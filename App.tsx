import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { DataConnection } from 'peerjs';
import ChessBoard from './components/ChessBoard';
import SimpleLandingPage from './components/SimpleLandingPage';
import PromotionModal from './components/PromotionModal';
import StakeMatchModal from './components/StakeMatchModal';
import GameEndModal from './components/GameEndModal';
import SimpleGameEndModal from './components/SimpleGameEndModal';
import './index.css';
import { SimpleStakeInfo } from './services/simpleStaking';
import { PieceType, GameMode, BoardOrientation, TeamTheme, GameResult, OnlineMessage } from './types';
import { Toaster, toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

// Constants
const TURN_TIME_SECONDS = 60;
const MAX_STRIKES = 3;

type AppView = 'landing' | 'game';

const App: React.FC = () => {
    const chessRef = useRef(new Chess());
    const { publicKey, connected } = useWallet();

    // Core state
    const [view, setView] = useState<AppView>('landing');
    const [gameMode, setGameMode] = useState<GameMode>('p2p');
    const [isHost, setIsHost] = useState(true);

    // Board state
    const [board, setBoard] = useState(chessRef.current.board());
    const [turn, setTurn] = useState(chessRef.current.turn());
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [validDestinations, setValidDestinations] = useState<string[]>([]);
    const [boardOrientation, setBoardOrientation] = useState<BoardOrientation>('white');
    const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

    // Game state
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameOverInfo, setGameOverInfo] = useState<{ winner: 'w' | 'b' | null; reason: string } | null>(null);
    const [gameResult, setGameResult] = useState<GameResult>(null);
    const [showGameEndModal, setShowGameEndModal] = useState(false);

    // Timer state
    const [turnTimeLeft, setTurnTimeLeft] = useState(TURN_TIME_SECONDS);
    const [whiteStrikes, setWhiteStrikes] = useState(0);
    const [blackStrikes, setBlackStrikes] = useState(0);
    const timerRef = useRef<number | null>(null);

    // Staking state
    const [showStakeModal, setShowStakeModal] = useState(false);
    const [stakeInfo, setStakeInfo] = useState<SimpleStakeInfo | null>(null);
    const [matchId, setMatchId] = useState<string | null>(null);

    // Peer connection state - using direct DataConnection from StakeMatchModal
    const peerConnRef = useRef<DataConnection | null>(null);
    const [isPeerConnected, setIsPeerConnected] = useState(false);
    const previousConnectedRef = useRef(connected);

    // Fixed themes for MVP
    const whiteTheme: TeamTheme = 'classic_hero';
    const blackTheme: TeamTheme = 'classic_villain';

    // Handle wallet disconnect during staked game
    useEffect(() => {
        if (previousConnectedRef.current && !connected && gameMode === 'staked_online' && view === 'game' && !isGameOver) {
            // Wallet disconnected during staked game - auto-lose
            const opponentColor = isHost ? 'b' : 'w';
            handleGameOver(opponentColor, 'Wallet Disconnected');
            toast.error('Wallet disconnected - you lost the match!');
        }
        previousConnectedRef.current = connected;
    }, [connected, gameMode, view, isGameOver, isHost]);

    // Refs to hold latest values for peer data handler
    const isHostRef = useRef(isHost);
    const viewRef = useRef(view);
    const gameModeRef = useRef(gameMode);
    const isGameOverRef = useRef(isGameOver);

    // Keep refs up to date
    useEffect(() => {
        isHostRef.current = isHost;
        viewRef.current = view;
        gameModeRef.current = gameMode;
        isGameOverRef.current = isGameOver;
    }, [isHost, view, gameMode, isGameOver]);

    // Game over handler ref to avoid circular dependencies
    const handleGameOverRef = useRef<(winner?: 'w' | 'b' | 'draw', reason?: string) => void>(() => {});

    // Setup peer connection - just stores the connection, listeners are set up in useEffect
    const setupPeerConnection = useCallback((conn: DataConnection) => {
        peerConnRef.current = conn;
        setIsPeerConnected(conn.open);
    }, []);

    // Effect to manage peer connection listeners
    useEffect(() => {
        const conn = peerConnRef.current;
        if (!conn) return;

        const handleData = (data: unknown) => {
            const msg = data as OnlineMessage;
            if (msg.type === 'move') {
                const moveData = msg.payload;
                const game = chessRef.current;
                try {
                    const move = game.move(moveData);
                    if (move) {
                        setLastMove({ from: move.from, to: move.to });
                        // Update board state directly
                        setBoard(game.board());
                        setTurn(game.turn());
                        setTurnTimeLeft(TURN_TIME_SECONDS);
                        toast.success("Opponent moved!");

                        // Check for game over
                        if (game.isGameOver()) {
                            let winner: 'w' | 'b' | undefined = undefined;
                            let reason = '';
                            if (game.isCheckmate()) {
                                winner = game.turn() === 'w' ? 'b' : 'w';
                                reason = 'Checkmate';
                            } else if (game.isDraw()) {
                                reason = 'Draw';
                            }
                            // Trigger game over handling via ref
                            handleGameOverRef.current(winner, reason);
                        }
                    }
                } catch (e) {
                    console.error("Invalid remote move", e);
                }
            } else if (msg.type === 'resign') {
                const winner = isHostRef.current ? 'w' : 'b';
                handleGameOverRef.current(winner, 'Opponent Resigned');
                toast.success('Opponent resigned - you win!');
            }
        };

        const handleClose = () => {
            console.log('[App] Peer connection closed');
            setIsPeerConnected(false);
            if (viewRef.current === 'game' && gameModeRef.current === 'staked_online' && !isGameOverRef.current) {
                const winner = isHostRef.current ? 'w' : 'b';
                handleGameOverRef.current(winner, 'Opponent Disconnected');
                toast.success('Opponent disconnected - you win!');
            }
        };

        const handleError = (err: any) => {
            console.error('[App] Peer connection error:', err);
        };

        conn.on('data', handleData);
        conn.on('close', handleClose);
        conn.on('error', handleError);

        return () => {
            conn.off('data', handleData);
            conn.off('close', handleClose);
            conn.off('error', handleError);
        };
    }, [isPeerConnected]);

    // Turn timer
    useEffect(() => {
        if (view !== 'game' || isGameOver) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        // Only run timer for staked online games
        if (gameMode !== 'staked_online') return;

        // Check if it's my turn
        const myColor = isHost ? 'w' : 'b';
        const isMyTurn = turn === myColor;

        // Reset timer on turn change
        setTurnTimeLeft(TURN_TIME_SECONDS);

        if (!isMyTurn) return; // Don't run timer on opponent's turn

        timerRef.current = window.setInterval(() => {
            setTurnTimeLeft((prev) => {
                if (prev <= 1) {
                    // Time's up - add strike
                    if (turn === 'w') {
                        setWhiteStrikes((s) => {
                            const newStrikes = s + 1;
                            if (newStrikes >= MAX_STRIKES) {
                                handleGameOver('b', 'Time Expired (3 Strikes)');
                            } else {
                                toast.error(`Strike ${newStrikes}/${MAX_STRIKES}! Move faster!`);
                                setTurnTimeLeft(TURN_TIME_SECONDS);
                            }
                            return newStrikes;
                        });
                    } else {
                        setBlackStrikes((s) => {
                            const newStrikes = s + 1;
                            if (newStrikes >= MAX_STRIKES) {
                                handleGameOver('w', 'Time Expired (3 Strikes)');
                            } else {
                                toast.error(`Strike ${newStrikes}/${MAX_STRIKES}! Move faster!`);
                                setTurnTimeLeft(TURN_TIME_SECONDS);
                            }
                            return newStrikes;
                        });
                    }
                    return TURN_TIME_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [view, turn, isGameOver, gameMode, isHost]);

    const handleGameOver = useCallback((winner?: 'w' | 'b' | 'draw', reason?: string) => {
        const game = chessRef.current;
        if (timerRef.current) clearInterval(timerRef.current);

        let actualWinner: 'w' | 'b' | null = null;
        let gameOverReason = reason || '';

        if (winner === 'draw' || game.isDraw()) {
            actualWinner = null;
            if (!gameOverReason) {
                if (game.isStalemate()) gameOverReason = 'Stalemate';
                else if (game.isThreefoldRepetition()) gameOverReason = 'Threefold Repetition';
                else if (game.isInsufficientMaterial()) gameOverReason = 'Insufficient Material';
                else gameOverReason = 'Draw';
            }
        } else if (winner === 'w' || winner === 'b') {
            actualWinner = winner;
        } else if (game.isCheckmate()) {
            actualWinner = game.turn() === 'w' ? 'b' : 'w';
            gameOverReason = 'Checkmate';
        }

        setIsGameOver(true);
        setGameOverInfo({ winner: actualWinner, reason: gameOverReason });

        // Determine player's result
        const playerColor = boardOrientation === 'white' ? 'w' : 'b';
        let result: GameResult = null;

        if (actualWinner === null) {
            result = 'draw';
            toast(gameOverReason || "It's a Draw!", { icon: '🤝' });
        } else {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            const winText = actualWinner === 'w' ? "White Wins!" : "Black Wins!";
            toast(gameOverReason ? `${winText} (${gameOverReason})` : winText, { icon: '🏆' });
            result = actualWinner === playerColor ? 'win' : 'loss';
        }

        setGameResult(result);
        setShowGameEndModal(true);
    }, [boardOrientation]);

    // Keep the ref updated with the latest handleGameOver
    useEffect(() => {
        handleGameOverRef.current = handleGameOver;
    }, [handleGameOver]);

    const updateGameState = useCallback((remoteMove = false) => {
        const game = chessRef.current;
        setBoard(game.board());
        setTurn(game.turn());

        // Reset turn timer
        setTurnTimeLeft(TURN_TIME_SECONDS);

        // Send move to peer if online and not remote
        if (gameMode === 'staked_online' && !remoteMove && peerConnRef.current?.open) {
            const history = game.history({ verbose: true });
            const lastMoveData = history[history.length - 1];
            if (lastMoveData) {
                const moveMsg: OnlineMessage = {
                    type: 'move',
                    payload: { from: lastMoveData.from, to: lastMoveData.to, promotion: lastMoveData.promotion }
                };
                peerConnRef.current.send(moveMsg);
            }
        }

        if (game.isGameOver()) handleGameOver();
    }, [handleGameOver, gameMode]);

    const handleSquareClick = useCallback((square: Square) => {
        const game = chessRef.current;
        if (isGameOver || game.isGameOver() || promotionMove) return;

        // For staked online, only allow moves on your turn
        if (gameMode === 'staked_online') {
            const myColor = isHost ? 'w' : 'b';
            if (game.turn() !== myColor) return;
        }

        if (selectedSquare === square) {
            setSelectedSquare(null);
            setValidDestinations([]);
            return;
        }

        if (selectedSquare) {
            const piece = game.get(selectedSquare);
            // Check for pawn promotion
            if (piece?.type === 'p' && ((piece.color === 'w' && square[1] === '8') || (piece.color === 'b' && square[1] === '1'))) {
                if (validDestinations.includes(square)) {
                    setPromotionMove({ from: selectedSquare, to: square });
                    return;
                }
            }
            try {
                const moveResult = game.move({ from: selectedSquare, to: square, promotion: 'q' });
                if (moveResult) {
                    setLastMove({ from: moveResult.from, to: moveResult.to });
                    setSelectedSquare(null);
                    setValidDestinations([]);
                    updateGameState();
                    return;
                }
            } catch { }
        }

        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
            setValidDestinations(game.moves({ square, verbose: true }).map(m => m.to));
        } else {
            setSelectedSquare(null);
            setValidDestinations([]);
        }
    }, [gameMode, isHost, isGameOver, promotionMove, selectedSquare, updateGameState, validDestinations]);

    const handlePromotionSelect = (type: PieceType) => {
        if (!promotionMove) return;
        const game = chessRef.current;
        const move = game.move({ from: promotionMove.from, to: promotionMove.to, promotion: type });
        if (move) {
            setLastMove({ from: move.from, to: move.to });
            updateGameState();
        }
        setPromotionMove(null);
        setSelectedSquare(null);
        setValidDestinations([]);
    };

    const startGame = (mode: GameMode, asHost: boolean = true, _matchInfo?: { matchId: string; stakeAmount: number }) => {
        chessRef.current = new Chess();
        setGameMode(mode);
        setIsHost(asHost);
        setBoardOrientation(asHost ? 'white' : 'black');
        setLastMove(null);
        setSelectedSquare(null);
        setValidDestinations([]);
        setIsGameOver(false);
        setGameOverInfo(null);
        setShowGameEndModal(false);
        setGameResult(null);
        setTurnTimeLeft(TURN_TIME_SECONDS);
        setWhiteStrikes(0);
        setBlackStrikes(0);

        // Note: stakeInfo and matchId are set by handleMatchReady before calling this
        // for staked_online mode, so we don't set them here

        setBoard(chessRef.current.board());
        setTurn(chessRef.current.turn());
        setView('game');
    };

    const handlePlayPvP = () => {
        startGame('p2p', true);
    };

    const handleStakeMatch = () => {
        setShowStakeModal(true);
    };

    const handleMatchReady = (matchInfo: {
        matchId: string;
        stakeAmount: number;
        isHost: boolean;
        peerConnection: DataConnection;
        hostAddress: string;
        challengerAddress: string;
    }) => {
        setShowStakeModal(false);

        // Setup the peer connection for game communication
        setupPeerConnection(matchInfo.peerConnection);

        // Store stake info with addresses from on-chain match
        setStakeInfo({
            matchId: matchInfo.matchId,
            hostAddress: matchInfo.hostAddress,
            challengerAddress: matchInfo.challengerAddress,
            stakeAmountSol: matchInfo.stakeAmount,
            totalPot: matchInfo.stakeAmount * 2,
            status: 'active',
            winner: null,
        });
        setMatchId(matchInfo.matchId);

        startGame('staked_online', matchInfo.isHost, matchInfo);
    };

    const exitToLanding = () => {
        // Close peer connection if exists
        if (peerConnRef.current) {
            peerConnRef.current.close();
            peerConnRef.current = null;
        }
        setIsPeerConnected(false);
        setStakeInfo(null);
        setMatchId(null);
        setGameResult(null);
        setShowGameEndModal(false);
        setView('landing');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden text-slate-50">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                }
            }} />

            {promotionMove && (
                <PromotionModal
                    color={turn}
                    onSelect={handlePromotionSelect}
                    onClose={() => setPromotionMove(null)}
                />
            )}

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-black opacity-90"></div>
            </div>

            {view === 'landing' && (
                <div className="z-10 w-full">
                    <SimpleLandingPage
                        onPlayPvP={handlePlayPvP}
                        onStakeMatch={handleStakeMatch}
                    />
                    {showStakeModal && (
                        <StakeMatchModal
                            onMatchReady={handleMatchReady}
                            onCancel={() => setShowStakeModal(false)}
                        />
                    )}
                </div>
            )}

            {view === 'game' && (
                <div className="z-10 flex flex-col items-center gap-4 w-full max-w-2xl">
                    {/* Game Header */}
                    <div className="w-full flex items-center justify-between px-2">
                        <button
                            onClick={exitToLanding}
                            className="text-slate-400 hover:text-white text-sm"
                        >
                            ← Exit
                        </button>

                        <div className="text-center">
                            <h2 className="text-lg font-bold text-white">
                                {gameMode === 'staked_online' ? 'Staked Match' : 'Local PvP'}
                            </h2>
                            {gameMode === 'staked_online' && stakeInfo && (
                                <p className="text-purple-400 text-sm">
                                    {stakeInfo.stakeAmountSol} SOL each • {stakeInfo.totalPot} SOL pot
                                </p>
                            )}
                        </div>

                        <div className="text-right">
                            <p className={`text-lg font-bold ${turn === 'w' ? 'text-white' : 'text-slate-400'}`}>
                                {turn === 'w' ? "White's Turn" : "Black's Turn"}
                            </p>
                            {gameMode === 'staked_online' && (
                                <p className="text-sm text-slate-500">
                                    {turnTimeLeft}s | Strikes: {turn === 'w' ? whiteStrikes : blackStrikes}/{MAX_STRIKES}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Chess Board */}
                    <ChessBoard
                        game={chessRef.current}
                        board={board}
                        selectedSquare={selectedSquare}
                        possibleMoves={validDestinations}
                        lastMove={lastMove}
                        onSquareClick={handleSquareClick}
                        orientation={boardOrientation}
                        boardEffect={null}
                        whiteTheme={whiteTheme}
                        blackTheme={blackTheme}
                        gameVariant="standard"
                        emotes={[]}
                        isOnFire={false}
                    />

                    {/* Flip Board for PvP */}
                    {gameMode === 'p2p' && (
                        <button
                            onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
                            className="text-slate-400 hover:text-white text-sm mt-2"
                        >
                            🔄 Flip Board
                        </button>
                    )}

                    {/* Game End Modal */}
                    {showGameEndModal && gameResult && gameMode !== 'staked_online' && (
                        <SimpleGameEndModal
                            result={gameResult}
                            reason={gameOverInfo?.reason}
                            winner={gameOverInfo?.winner}
                            gameMode={gameMode}
                            playerColor={boardOrientation === 'white' ? 'w' : 'b'}
                            onPlayAgain={() => {
                                setShowGameEndModal(false);
                                startGame(gameMode, isHost);
                            }}
                            onExit={exitToLanding}
                        />
                    )}

                    {showGameEndModal && gameResult && gameMode === 'staked_online' && stakeInfo && (
                        <GameEndModal
                            result={gameResult}
                            matchId={matchId || ''}
                            stakeInfo={stakeInfo}
                            playerAddress={publicKey?.toBase58() || ''}
                            opponentAddress={isHost ? stakeInfo.challengerAddress || '' : stakeInfo.hostAddress}
                            onClose={exitToLanding}
                            onPlayAgain={() => {
                                setShowGameEndModal(false);
                                exitToLanding();
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default App;
