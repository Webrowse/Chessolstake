
import React, { useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { PieceType, GameDifficulty, GameMode, BoardOrientation, TeamTheme, XPState, Mission, TrainerStats, ShopItem } from '../types';
import { TEAM_PRESETS, LEAGUES } from '../constants';
import PokemonPiece from './PokemonPiece';
import ShopList from './ShopList';
import ProfileView from './ProfileView';
import { Send, Mic, Play, SkipBack, SkipForward, Rewind, LogOut, RotateCcw, Repeat, CheckCircle2, RotateCw, BrainCircuit } from 'lucide-react';
import { getAIChatResponse } from '../services/geminiService';
import { toast } from 'react-hot-toast';

interface GameInfoProps {
  game: Chess;
  capturedWhite: PieceType[];
  capturedBlack: PieceType[];
  commentary: string;
  difficulty: GameDifficulty;
  gameMode: GameMode;
  orientation: BoardOrientation;
  setDifficulty: (d: GameDifficulty) => void;
  resetGame: () => void;
  undoMove: () => void;
  onFlipBoard: () => void;
  onExit: () => void;
  isAiThinking: boolean;
  whiteTime: number;
  blackTime: number;
  whiteTheme: TeamTheme;
  blackTheme: TeamTheme;
  xpState: XPState;
  missions: Mission[];
  trainerStats: TrainerStats;
  isGameOver: boolean;
  onEmote: (emoji: string) => void;
  onVoiceCommand: (transcript: string) => void;
  replayIndex: number;
  setReplayIndex: (index: number) => void;
  p2pScore: { white: number; black: number };
  coins: number; 
  inventory: string[];
  onBuyItem: (item: ShopItem) => void;
  onOpenTower: () => void;
  isHost?: boolean;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const GameInfo: React.FC<GameInfoProps> = ({ 
  game, capturedWhite, capturedBlack, commentary, difficulty, gameMode,
  orientation, setDifficulty, resetGame, undoMove, onFlipBoard, onExit,
  isAiThinking, whiteTime, blackTime, whiteTheme, blackTheme, xpState, 
  missions, trainerStats, isGameOver, onEmote, onVoiceCommand,
  replayIndex, setReplayIndex, p2pScore, coins, inventory, onBuyItem, onOpenTower, isHost = true
}) => {
  const [activeTab, setActiveTab] = useState<'moves' | 'chat' | 'shop' | 'profile'>('moves');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reset' | 'exit' | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            toast(`Heard: "${transcript}"`, { icon: '🎙️', duration: 2000 });
            onVoiceCommand(transcript);
        };
        recognitionRef.current = recognition;

        return () => {
            if(recognitionRef.current) recognitionRef.current.abort();
        };
    }
  }, [onVoiceCommand]);

  const toggleMic = () => {
      if (recognitionRef.current) {
          if (isListening) recognitionRef.current.stop();
          else recognitionRef.current.start();
      } else {
          toast.error("Voice control not supported in this browser.");
      }
  };

  useEffect(() => {
      if (scrollContainerRef.current) {
          const { scrollHeight, clientHeight } = scrollContainerRef.current;
          if (scrollHeight > clientHeight) {
            scrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
          }
      }
  }, [chatHistory, game.history().length, activeTab]);

  useEffect(() => {
      if (gameMode === 'ai' && commentary && !commentary.includes("Thinking")) {
          setChatHistory(prev => [...prev, { role: 'model', text: commentary }]);
      }
  }, [commentary, gameMode]);

  const handleSendMessage = async () => {
      if (!chatInput.trim()) return;
      setChatHistory(prev => [...prev, { role: 'user', text: chatInput }]);
      const msg = chatInput;
      setChatInput("");
      const res = await getAIChatResponse(msg, chatHistory as any);
      setChatHistory(prev => [...prev, { role: 'model', text: res }]);
  };

  const handleDestructiveAction = (action: 'reset' | 'exit') => {
      if (confirmAction === action) {
          if (action === 'reset') resetGame();
          if (action === 'exit') onExit();
          setConfirmAction(null);
      } else {
          setConfirmAction(action);
          setTimeout(() => setConfirmAction(null), 3000);
      }
  };

  const toggleDifficulty = () => {
      if (difficulty === GameDifficulty.EASY) setDifficulty(GameDifficulty.MEDIUM);
      else if (difficulty === GameDifficulty.MEDIUM) setDifficulty(GameDifficulty.HARD);
      else setDifficulty(GameDifficulty.EASY);
  };

  const history = game.history({ verbose: true });
  const moveList = history.map((move, i) => {
      const pieceName = TEAM_PRESETS[move.color === 'w' ? whiteTheme : blackTheme][move.piece].name;
      let text = `${pieceName} to ${move.to}`;
      if (move.flags.includes('c') || move.flags.includes('e')) text = `${pieceName} attacked!`;
      return { num: Math.floor(i / 2) + 1, white: i % 2 === 0, text, san: move.san };
  });

  const isReplayMode = replayIndex !== -1;
  const currentMoveIndex = isReplayMode ? replayIndex : history.length - 1;

  const isWhiteOrientation = orientation === 'white';
  const bottomColor = isWhiteOrientation ? 'w' : 'b';
  const topColor = isWhiteOrientation ? 'b' : 'w';
  const bottomTime = isWhiteOrientation ? whiteTime : blackTime;
  const topTime = isWhiteOrientation ? blackTime : whiteTime;
  const bottomTheme = isWhiteOrientation ? whiteTheme : blackTheme;
  const topTheme = isWhiteOrientation ? blackTheme : whiteTheme;
  
  const topLabel = gameMode === 'ai' ? 'Rival' : (gameMode === 'online' ? 'Opponent' : 'Player 2');
  const bottomLabel = gameMode === 'ai' ? 'You' : (gameMode === 'online' ? 'You' : 'Player 1');

  const league = LEAGUES.slice().reverse().find(l => trainerStats.rating >= l.minRating) || LEAGUES[0];

  return (
    <div className="flex flex-col w-full h-[600px] lg:h-[700px] glass-panel rounded-2xl shadow-2xl overflow-hidden font-sans border border-slate-700/50 backdrop-blur-xl">
        
        {/* GLOBAL HEADER */}
        <div className="bg-slate-900/60 px-4 py-3 flex items-center justify-between border-b border-slate-700/50 shrink-0">
             <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center bg-slate-800/80 text-sm shadow-md" style={{borderColor: league.color}}>
                     {league.id === 'bronze' && '🥉'}
                     {league.id === 'silver' && '🥈'}
                     {league.id === 'gold' && '🥇'}
                     {league.id === 'platinum' && '💠'}
                     {league.id === 'diamond' && '💎'}
                     {league.id === 'master' && '🟣'}
                 </div>
                 <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] leading-none mb-1">{league.name}</span>
                     <span className="text-sm text-white font-mono font-bold leading-none">{trainerStats.rating}</span>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 {gameMode === 'ai' && (
                     <button onClick={toggleDifficulty} className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-800 rounded border border-slate-600 hover:border-slate-400 text-slate-300">
                         {difficulty}
                     </button>
                 )}
                 {gameMode === 'online' && (
                     <div className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-800 rounded border border-slate-600">
                         <span className={isHost ? 'text-yellow-300' : 'text-gray-300'}>{isHost ? '♔ White' : '♚ Black'}</span>
                     </div>
                 )}
                 <div className="bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 shadow-inner">
                      <span className="text-xs">🪙</span>
                      <span className="text-xs text-yellow-400 font-mono font-bold">{coins}</span>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                     <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">LVL {xpState.level}</span>
                     <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-blue-500 shadow-neon-blue transition-all duration-1000 ease-out" style={{ width: `${(xpState.current / xpState.max) * 100}%` }}></div>
                     </div>
                 </div>
             </div>
        </div>

        {/* OPPONENT CARD */}
        <div className="px-4 py-3 bg-slate-800/20 flex items-center justify-between border-b border-white/5 shrink-0 relative overflow-hidden">
            {isAiThinking && (
                 <div className="absolute inset-0 bg-blue-500/5 animate-pulse z-0"></div>
            )}
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full border-2 border-red-500 bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg relative ring-2 ring-red-500/20">
                     <div className="absolute inset-0 bg-red-500/10"></div>
                     <PokemonPiece pokemonDef={TEAM_PRESETS[topTheme]['k']} type='k' color={topColor} hasShinyCharm={inventory.includes('shiny_charm') && topColor === 'b'} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">{topLabel}</div>
                        {isAiThinking && <BrainCircuit size={12} className="text-blue-400 animate-pulse" />}
                    </div>
                    <div className="flex gap-0.5 mt-1">
                        {(isWhiteOrientation ? capturedWhite : capturedBlack).map((p, i) => (
                             <div key={i} className="w-3 h-3 opacity-70 grayscale hover:grayscale-0 transition-all"><PokemonPiece pokemonDef={TEAM_PRESETS[isWhiteOrientation ? whiteTheme : blackTheme][p]} type={p} color={isWhiteOrientation ? 'w' : 'b'} /></div>
                        ))}
                    </div>
                </div>
            </div>
            {gameMode !== 'ai' && (
                 <div className="flex gap-2 text-xs font-bold text-slate-400 bg-slate-900/40 px-2 py-1 rounded border border-white/5 relative z-10">
                    <span className="text-white">W: {p2pScore.white}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-white">B: {p2pScore.black}</span>
                 </div>
            )}
            <div className={`text-xl font-mono font-bold ${topTime < 30 ? 'text-red-500 animate-pulse text-glow' : 'text-slate-200'} bg-slate-950/50 px-3 py-1 rounded-lg border border-white/5 min-w-[70px] text-center relative z-10`}>
                {formatTime(topTime)}
            </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="grid grid-cols-4 p-2 gap-1 bg-slate-900/80 border-b border-white/5 shrink-0 backdrop-blur-sm">
            {(['moves', 'chat', 'shop', 'profile'] as const).map(tab => {
                 if (tab === 'chat' && gameMode !== 'ai') return null;
                 return (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 outline-none
                        ${activeTab === tab 
                            ? 'bg-blue-600/20 text-blue-300 shadow-inner border border-blue-500/30' 
                            : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        {tab === 'moves' ? 'Log' : tab}
                    </button>
                 );
            })}
        </div>

        {/* CONTENT SCROLL AREA */}
        <div ref={scrollContainerRef} className="flex-grow overflow-y-auto bg-slate-900/40 relative custom-scrollbar">
            
            {/* LOG TAB */}
            {activeTab === 'moves' && (
                <div className="p-2 space-y-1 animate-fade-in pb-12">
                     {(isGameOver || isReplayMode) && (
                         <div className="sticky top-0 z-10 bg-slate-800/90 backdrop-blur-md p-2 rounded-lg border border-slate-600/50 flex justify-center gap-2 mb-3 shadow-lg mx-2 mt-2">
                             <button onClick={() => setReplayIndex(0)} className="text-slate-400 hover:text-white p-2 rounded hover:bg-white/10" aria-label="Start"><SkipBack size={16}/></button>
                             <button onClick={() => setReplayIndex(Math.max(-1, currentMoveIndex - 1))} className="text-slate-400 hover:text-white p-2 rounded hover:bg-white/10" aria-label="Previous"><Rewind size={16}/></button>
                             <span className="text-xs font-mono text-blue-300 min-w-[50px] text-center flex items-center justify-center bg-slate-900/50 rounded border border-white/10">{currentMoveIndex + 1} / {history.length}</span>
                             <button onClick={() => setReplayIndex(Math.min(history.length - 1, currentMoveIndex + 1))} className="text-slate-400 hover:text-white p-2 rounded hover:bg-white/10" aria-label="Next"><Play size={16} fill="currentColor" /></button>
                             <button onClick={() => setReplayIndex(history.length - 1)} className="text-slate-400 hover:text-white p-2 rounded hover:bg-white/10" aria-label="End"><SkipForward size={16}/></button>
                         </div>
                     )}
                     <div className="grid grid-cols-[30px_50px_1fr] gap-x-2 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 border-b border-white/5 mb-2 sticky top-0 bg-slate-900/95 backdrop-blur z-0">
                         <span>#</span>
                         <span>Move</span>
                         <span>Details</span>
                     </div>
                     <div className="space-y-0.5 px-2">
                        {moveList.map((m, i) => (
                            <div key={i} className={`grid grid-cols-[30px_50px_1fr] gap-x-2 px-3 py-2 rounded-md text-xs transition-colors border border-transparent ${i === currentMoveIndex ? 'bg-blue-500/20 text-blue-100 border-blue-500/30 shadow-sm' : 'text-slate-400 hover:bg-white/5'}`}>
                                <span className="font-mono opacity-50">{m.num}.</span>
                                <span className="font-bold text-slate-300">{m.san}</span>
                                <span className="truncate">{m.text}</span>
                            </div>
                        ))}
                     </div>
                     {moveList.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                            <span className="text-2xl opacity-50 mb-2 grayscale">♟️</span>
                            <span className="text-xs italic tracking-wide">Ready to Start</span>
                        </div>
                     )}
                </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && gameMode === 'ai' && (
                <div className="flex flex-col h-full animate-fade-in relative">
                    <div className="flex-grow p-4 space-y-4 pb-20">
                        {chatHistory.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm backdrop-blur-sm ${m.role === 'user' ? 'bg-blue-600/90 text-white rounded-br-none shadow-neon-blue' : 'bg-slate-700/80 text-slate-200 rounded-bl-none border border-slate-600'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-slate-900/90 border-t border-white/5 flex gap-2 backdrop-blur">
                        <input 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                            className="flex-grow bg-slate-800/50 text-white text-sm px-4 py-2 rounded-full border border-slate-600 focus:border-blue-500 focus:outline-none placeholder-slate-500 transition-colors" 
                            placeholder="Message Rival..." 
                        />
                        <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg btn-press">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* SHOP TAB */}
            {activeTab === 'shop' && (
                <div className="animate-fade-in h-full">
                    <ShopList coins={coins} inventory={inventory} onBuyItem={onBuyItem} />
                </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <div className="animate-fade-in h-full">
                    <ProfileView 
                        trainerStats={trainerStats} 
                        xpState={xpState} 
                        missions={missions} 
                        onOpenTower={onOpenTower} 
                        inventory={inventory}
                    />
                </div>
            )}
        </div>

        {/* BOTTOM: PLAYER & CONTROLS */}
        <div className="bg-slate-900/80 border-t border-white/5 shrink-0 backdrop-blur-md">
             {/* Player Status */}
             <div className="px-4 py-3 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-slate-800 flex items-center justify-center overflow-hidden relative shadow-lg ring-2 ring-blue-500/20">
                        <div className="absolute inset-0 bg-blue-500/10"></div>
                        <PokemonPiece pokemonDef={TEAM_PRESETS[bottomTheme]['k']} type='k' color={bottomColor} hasShinyCharm={inventory.includes('shiny_charm')} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">{bottomLabel}</div>
                         <div className="flex gap-0.5 mt-1">
                            {(isWhiteOrientation ? capturedBlack : capturedWhite).map((p, i) => (
                                <div key={i} className="w-3 h-3 opacity-70 grayscale hover:grayscale-0"><PokemonPiece pokemonDef={TEAM_PRESETS[isWhiteOrientation ? blackTheme : whiteTheme][p]} type={p} color={isWhiteOrientation ? 'b' : 'w'} /></div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleMic}
                        className={`p-2 rounded-full transition-all shadow-sm btn-press ${isListening ? 'bg-red-500 animate-pulse text-white ring-2 ring-red-500/50 shadow-neon-red' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600'}`}
                        title="Voice Control"
                    >
                        <Mic size={16} />
                    </button>
                    <div className={`text-xl font-mono font-bold ${bottomTime < 30 ? 'text-red-500 animate-pulse text-glow' : 'text-white'} bg-slate-800 px-3 py-1 rounded-lg border border-slate-600 min-w-[70px] text-center`}>
                        {formatTime(bottomTime)}
                    </div>
                </div>
            </div>

            {/* Emotes */}
            <div className="flex gap-4 justify-center py-2 border-t border-white/5 bg-slate-950/40 overflow-x-auto px-4 scrollbar-hide">
                {['🔥', '💀', '🤡', '🥶', '👋', '🤔'].map(emoji => (
                    <button key={emoji} onClick={() => onEmote(emoji)} className="text-2xl hover:scale-125 transition-transform active:scale-95 p-1 focus:outline-none drop-shadow-md" aria-label={`Send emoji ${emoji}`}>{emoji}</button>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="p-3 bg-slate-950/60 grid grid-cols-4 gap-2 border-t border-white/5">
                <button 
                    onClick={undoMove} 
                    disabled={gameMode !== 'ai'} 
                    className="flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-400 hover:text-white py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-slate-700 btn-press h-10 hover:border-slate-500"
                >
                    <RotateCcw size={14} />
                </button>
                <button 
                    onClick={onFlipBoard} 
                    className="flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-slate-700 btn-press h-10 hover:border-slate-500"
                >
                    <Repeat size={14} />
                </button>
                
                {/* Reset */}
                <button 
                    onClick={() => handleDestructiveAction('reset')} 
                    className={`flex flex-col items-center justify-center py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm btn-press h-10 border
                        ${confirmAction === 'reset' ? 'bg-yellow-600 text-white border-yellow-500 shadow-neon-yellow' : 'bg-slate-800 text-yellow-500 border-yellow-500/20 hover:bg-slate-700 hover:border-yellow-500/50'}`}
                >
                    {confirmAction === 'reset' ? <CheckCircle2 size={14} /> : <RotateCw size={14} />}
                </button>

                {/* Exit */}
                <button 
                    onClick={() => handleDestructiveAction('exit')} 
                    className={`flex flex-col items-center justify-center py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border h-10 btn-press
                        ${confirmAction === 'exit' ? 'bg-red-600 text-white border-red-500 shadow-neon-red' : 'bg-slate-800 text-red-500 border-red-500/20 hover:bg-slate-700 hover:border-red-500/50'}`}
                >
                     {confirmAction === 'exit' ? <CheckCircle2 size={14} /> : <LogOut size={14} />}
                </button>
            </div>
        </div>
    </div>
  );
};

export default GameInfo;
