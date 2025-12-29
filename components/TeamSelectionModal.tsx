
import React, { useState } from 'react';
import { GameVariant, TeamTheme, GameMode, PieceType } from '../types';
import { TEAM_PRESETS } from '../constants';
import PokemonPiece from './PokemonPiece';
import { toast } from 'react-hot-toast';

interface TeamSelectionModalProps {
  gameMode: GameMode;
  onConfirm: (variant: GameVariant, whiteTheme: TeamTheme, blackTheme: TeamTheme) => void;
  onCancel: () => void;
  inventory?: string[]; // New prop
}

const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({ gameMode, onConfirm, onCancel, inventory = [] }) => {
  const [variant, setVariant] = useState<GameVariant>('standard');
  const [whiteTheme, setWhiteTheme] = useState<TeamTheme>('classic_hero');
  const [blackTheme, setBlackTheme] = useState<TeamTheme>('classic_villain');

  // Base themes + check if others are in inventory
  const isUnlocked = (themeId: string) => {
      if (themeId === 'classic_hero' || themeId === 'classic_villain') return true;
      return inventory.includes(`theme_${themeId}`);
  };

  const themes: { id: TeamTheme; label: string; color: string }[] = [
    { id: 'classic_hero', label: 'Classic Hero', color: 'bg-blue-600' },
    { id: 'classic_villain', label: 'Classic Villain', color: 'bg-purple-600' },
    { id: 'electric', label: 'Electric Spark', color: 'bg-yellow-500' },
    { id: 'fire', label: 'Fire Blast', color: 'bg-red-500' },
    { id: 'water', label: 'Hydro Pump', color: 'bg-blue-400' },
    { id: 'grass', label: 'Solar Beam', color: 'bg-green-600' },
    { id: 'psychic', label: 'Mind Crush', color: 'bg-fuchsia-500' },
  ];

  // Preview pieces with labels
  const renderPreview = (theme: TeamTheme, isWhite: boolean) => {
      const set = TEAM_PRESETS[theme];
      const pieces: { type: PieceType; label: string }[] = [
          { type: 'p', label: 'Pawn' },
          { type: 'n', label: 'Knight' },
          { type: 'b', label: 'Bishop' },
          { type: 'r', label: 'Rook' },
          { type: 'q', label: 'Queen' },
          { type: 'k', label: 'King' }
      ];

      return (
          <div className="grid grid-cols-3 gap-y-4 gap-x-2 mt-2">
             {pieces.map(({ type, label }) => (
                 <div key={type} className="flex flex-col items-center">
                     <div className="w-10 h-10 mb-1 relative flex items-center justify-center">
                         <PokemonPiece pokemonDef={set[type]} color={isWhite ? 'w' : 'b'} type={type} />
                     </div>
                     <span className="text-[9px] text-gray-400 font-bold uppercase">{label}</span>
                     <span className={`text-[8px] truncate max-w-full ${isWhite ? 'text-blue-300' : 'text-red-300'}`}>
                        {set[type].name}
                     </span>
                 </div>
             ))}
          </div>
      );
  };

  const handleSelectTheme = (setter: Function, id: TeamTheme) => {
      if (isUnlocked(id)) {
          setter(id);
      } else {
          toast.error("Locked! Purchase in PokeMart.");
      }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4 overflow-y-auto">
      <div className="bg-gray-900 border-2 border-gray-600 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col my-auto max-h-full">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
             <h2 className="text-xl font-pixel text-white">Battle Setup</h2>
             <button onClick={onCancel} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* Game Variant Section */}
            <div className="mb-8">
                <h3 className="text-yellow-400 font-bold uppercase text-xs tracking-wider mb-3">Game Rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={() => setVariant('standard')}
                        className={`p-4 rounded border-2 text-left transition-all ${variant === 'standard' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'}`}
                    >
                        <div className="font-bold text-white mb-1 flex items-center gap-2">
                            <span>🏆</span> Standard Battle
                        </div>
                        <div className="text-xs text-gray-400">Classic Chess rules. Checkmate the King to win.</div>
                    </button>
                    <button 
                        onClick={() => setVariant('koth')}
                        className={`p-4 rounded border-2 text-left transition-all ${variant === 'koth' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'}`}
                    >
                        <div className="font-bold text-white mb-1 flex items-center gap-2">
                             <span>👑</span> King of the Hill
                        </div>
                        <div className="text-xs text-gray-400">Control the center! Move your King to the center 4 squares (d4,e4,d5,e5) to win instantly.</div>
                    </button>
                </div>
            </div>

            {/* Team Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Player 1 (White) */}
                <div className="flex flex-col h-full">
                     <h3 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-white"></span>
                         {gameMode === 'ai' ? 'Your Team (White)' : 'Player 1 (White)'}
                     </h3>
                     
                     <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-4 flex-grow">
                         <div className="text-center text-[10px] text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-700 pb-1">Team Roster</div>
                         {renderPreview(whiteTheme, true)}
                     </div>

                     <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {themes.map(t => {
                            const locked = !isUnlocked(t.id);
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectTheme(setWhiteTheme, t.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded border transition-all ${whiteTheme === t.id ? 'border-blue-400 bg-gray-700' : 'border-transparent bg-gray-800/50 hover:bg-gray-700'} ${locked ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${t.color}`}></div>
                                        <span className="text-sm font-bold text-gray-200">{t.label}</span>
                                    </div>
                                    {locked && <span className="text-xs text-red-500">🔒</span>}
                                    {whiteTheme === t.id && <span className="text-xs text-blue-400 font-bold">SELECTED</span>}
                                </button>
                            );
                        })}
                     </div>
                </div>

                {/* Player 2 (Black) */}
                <div className="flex flex-col h-full">
                     <h3 className="text-red-400 font-bold uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-black border border-gray-600"></span>
                         {gameMode === 'ai' ? 'Rival Team (Black)' : 'Player 2 (Black)'}
                     </h3>

                     <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-4 flex-grow">
                         <div className="text-center text-[10px] text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-700 pb-1">Team Roster</div>
                         {renderPreview(blackTheme, false)}
                     </div>

                     <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {themes.map(t => {
                            // AI can play any theme, but let's restrict player from picking locked themes for AI just to be consistent, or allow it for preview?
                            // Let's allow unlocking AI themes too for consistency.
                            const locked = !isUnlocked(t.id);
                             return (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectTheme(setBlackTheme, t.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded border transition-all ${blackTheme === t.id ? 'border-red-400 bg-gray-700' : 'border-transparent bg-gray-800/50 hover:bg-gray-700'} ${locked ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${t.color}`}></div>
                                        <span className="text-sm font-bold text-gray-200">{t.label}</span>
                                    </div>
                                    {locked && <span className="text-xs text-red-500">🔒</span>}
                                    {blackTheme === t.id && <span className="text-xs text-red-400 font-bold">SELECTED</span>}
                                </button>
                            );
                        })}
                     </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-4 bg-gray-800 flex-shrink-0">
             <button 
                onClick={onCancel}
                className="px-6 py-2 text-gray-400 hover:text-white font-bold text-sm uppercase tracking-wider"
             >
                 Back
             </button>
             <button 
                onClick={() => onConfirm(variant, whiteTheme, blackTheme)}
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded shadow-lg transform hover:scale-105 active:scale-95 transition-all uppercase tracking-wider flex items-center gap-2"
             >
                 Start Battle <span>⚔️</span>
             </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default TeamSelectionModal;
