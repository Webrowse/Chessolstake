import React from 'react';
import { Trophy, Frown, Handshake, RotateCcw, Home, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

type GameResult = 'win' | 'loss' | 'draw';

interface SimpleGameEndModalProps {
    result: GameResult;
    reason?: string;
    winner?: 'w' | 'b' | null;
    gameMode: 'ai' | 'p2p' | 'online' | 'staked_online';
    playerColor?: 'w' | 'b';
    onPlayAgain: () => void;
    onExit: () => void;
}

export const SimpleGameEndModal: React.FC<SimpleGameEndModalProps> = ({
    result,
    reason,
    winner,
    gameMode,
    playerColor: _playerColor = 'w',
    onPlayAgain,
    onExit,
}) => {
    React.useEffect(() => {
        if (result === 'win') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [result]);

    const getResultContent = () => {
        if (result === 'draw' || winner === null) {
            return {
                icon: <Handshake className="w-20 h-20 text-blue-400" />,
                title: "It's a Draw!",
                subtitle: reason || 'A worthy match!',
                bgGradient: 'from-blue-600/20 via-blue-600/10 to-transparent',
                borderColor: 'border-blue-500/30',
                textColor: 'text-blue-400',
            };
        }

        // For P2P mode, just show who won
        if (gameMode === 'p2p') {
            return {
                icon: <Trophy className="w-20 h-20 text-yellow-400" />,
                title: winner === 'w' ? 'White Wins!' : 'Black Wins!',
                subtitle: reason || 'Checkmate!',
                bgGradient: 'from-yellow-600/20 via-amber-600/10 to-transparent',
                borderColor: 'border-yellow-500/30',
                textColor: 'text-yellow-400',
            };
        }

        // For AI and online modes, show win/loss from player perspective
        if (result === 'win') {
            return {
                icon: <Trophy className="w-20 h-20 text-yellow-400" />,
                title: 'Victory!',
                subtitle: reason || 'You are the Champion!',
                bgGradient: 'from-yellow-600/20 via-amber-600/10 to-transparent',
                borderColor: 'border-yellow-500/30',
                textColor: 'text-yellow-400',
            };
        } else {
            return {
                icon: <Frown className="w-20 h-20 text-slate-400" />,
                title: 'Defeat',
                subtitle: reason || 'Better luck next time!',
                bgGradient: 'from-slate-600/20 via-slate-600/10 to-transparent',
                borderColor: 'border-slate-500/30',
                textColor: 'text-slate-400',
            };
        }
    };

    const content = getResultContent();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className={`w-full max-w-sm bg-slate-900/95 border ${content.borderColor} rounded-2xl shadow-2xl overflow-hidden`}>
                {/* Header */}
                <div className={`relative bg-gradient-to-b ${content.bgGradient} p-8 text-center`}>
                    <div className="relative inline-block">
                        {content.icon}
                        {result === 'win' && (
                            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-pulse" />
                        )}
                    </div>

                    <h2 className={`text-3xl font-bold ${content.textColor} mt-4 font-pixel`}>
                        {content.title}
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">{content.subtitle}</p>
                </div>

                {/* Buttons */}
                <div className="p-6 space-y-3">
                    <button
                        onClick={onPlayAgain}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Play Again</span>
                    </button>

                    <button
                        onClick={onExit}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
                    >
                        <Home className="w-5 h-5" />
                        <span>Back to Menu</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimpleGameEndModal;
