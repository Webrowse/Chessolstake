import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
    Trophy,
    Frown,
    Handshake,
    Coins,
    Loader2,
    Check,
    Sparkles,
    X
} from 'lucide-react';
import { simpleStakingService, SimpleStakeInfo } from '../services/simpleStaking';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

type GameResult = 'win' | 'loss' | 'draw';

interface GameEndModalProps {
    result: GameResult;
    matchId: string;
    stakeInfo: SimpleStakeInfo;
    playerAddress?: string;
    opponentAddress?: string;
    onClose: () => void;
    onPlayAgain: () => void;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({
    result,
    matchId,
    stakeInfo,
    onClose,
    onPlayAgain,
}) => {
    const { publicKey } = useWallet();

    const [isClaiming, setIsClaiming] = useState(false);
    const [hasClaimed, setHasClaimed] = useState(false);

    // Trigger confetti on win
    useEffect(() => {
        if (result === 'win') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [result]);

    const handleClaimReward = async () => {
        if (!publicKey) {
            toast.error('Wallet not connected');
            return;
        }

        setIsClaiming(true);
        try {
            const claimResult = await simpleStakingService.declareWinner(
                matchId,
                publicKey.toBase58()
            );

            if (claimResult.success) {
                setHasClaimed(true);
                toast.success('Reward claimed successfully!');
                confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.4 },
                });
            } else {
                throw new Error(claimResult.error);
            }
        } catch (err: any) {
            console.error('Claim error:', err);
            toast.error(err.message || 'Failed to claim reward');
        } finally {
            setIsClaiming(false);
        }
    };

    const handleDeclareDraw = async () => {
        setIsClaiming(true);
        try {
            const drawResult = await simpleStakingService.declareDraw(matchId);

            if (drawResult.success) {
                setHasClaimed(true);
                toast.success('Draw declared! Stakes refunded.');
            } else {
                throw new Error(drawResult.error);
            }
        } catch (err: any) {
            console.error('Draw declaration error:', err);
            toast.error(err.message || 'Failed to declare draw');
        } finally {
            setIsClaiming(false);
        }
    };

    const { winnerReward } = simpleStakingService.calculateWinnerReward(stakeInfo.stakeAmountSol);

    const getResultContent = () => {
        switch (result) {
            case 'win':
                return {
                    icon: <Trophy className="w-16 h-16 text-yellow-400" />,
                    title: 'Victory!',
                    subtitle: 'You are the Champion!',
                    bgGradient: 'from-yellow-600/20 via-amber-600/10 to-transparent',
                    borderColor: 'border-yellow-500/30',
                };
            case 'loss':
                return {
                    icon: <Frown className="w-16 h-16 text-slate-400" />,
                    title: 'Defeat',
                    subtitle: 'Better luck next time!',
                    bgGradient: 'from-slate-600/20 via-slate-600/10 to-transparent',
                    borderColor: 'border-slate-500/30',
                };
            case 'draw':
                return {
                    icon: <Handshake className="w-16 h-16 text-blue-400" />,
                    title: 'Draw',
                    subtitle: 'A worthy opponent!',
                    bgGradient: 'from-blue-600/20 via-blue-600/10 to-transparent',
                    borderColor: 'border-blue-500/30',
                };
        }
    };

    const content = getResultContent();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className={`w-full max-w-md bg-slate-900/95 border ${content.borderColor} rounded-2xl shadow-2xl overflow-hidden`}>
                {/* Header */}
                <div className={`relative bg-gradient-to-b ${content.bgGradient} p-8 text-center`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative inline-block">
                        {content.icon}
                        {result === 'win' && (
                            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
                        )}
                    </div>

                    <h2 className="text-3xl font-bold text-white mt-4">{content.title}</h2>
                    <p className="text-slate-400 mt-1">{content.subtitle}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Stake Summary */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400">Match Stake</span>
                            <span className="text-white font-mono">
                                {stakeInfo.stakeAmountSol.toFixed(4)} SOL each
                            </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400">Total Pot</span>
                            <span className="text-white font-mono">
                                {stakeInfo.totalPot.toFixed(4)} SOL
                            </span>
                        </div>
                        {result === 'win' && (
                            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                                <span className="text-green-400 font-medium">Your Reward</span>
                                <span className="text-green-400 font-bold font-mono text-xl">
                                    +{winnerReward.toFixed(4)} SOL
                                </span>
                            </div>
                        )}
                        {result === 'draw' && (
                            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                                <span className="text-blue-400 font-medium">Refund</span>
                                <span className="text-blue-400 font-bold font-mono">
                                    {stakeInfo.stakeAmountSol.toFixed(4)} SOL
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {result === 'win' && !hasClaimed && (
                        <button
                            onClick={handleClaimReward}
                            disabled={isClaiming}
                            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl shadow-lg shadow-yellow-500/25 transition-all flex items-center justify-center gap-3"
                        >
                            {isClaiming ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Claiming Reward...</span>
                                </>
                            ) : (
                                <>
                                    <Coins className="w-5 h-5" />
                                    <span>Claim {winnerReward.toFixed(4)} SOL</span>
                                </>
                            )}
                        </button>
                    )}

                    {result === 'draw' && !hasClaimed && (
                        <button
                            onClick={handleDeclareDraw}
                            disabled={isClaiming}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
                        >
                            {isClaiming ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processing Refund...</span>
                                </>
                            ) : (
                                <>
                                    <Handshake className="w-5 h-5" />
                                    <span>Claim Refund</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Success State */}
                    {hasClaimed && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-400">
                                <Check className="w-5 h-5" />
                                <span className="font-medium">
                                    {result === 'win' ? 'Reward Claimed!' : 'Refund Processed!'}
                                </span>
                            </div>
                        </div>
                    )}

                    {result === 'loss' && (
                        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-sm">
                                Your stake of <span className="text-white font-mono">{stakeInfo.stakeAmountSol.toFixed(4)} SOL</span> has been
                                transferred to the winner.
                            </p>
                        </div>
                    )}

                    {/* Play Again */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors"
                        >
                            Exit
                        </button>
                        <button
                            onClick={onPlayAgain}
                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-medium transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameEndModal;
