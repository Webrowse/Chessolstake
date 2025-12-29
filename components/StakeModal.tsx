import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
    Coins,
    Wallet,
    AlertCircle,
    Loader2,
    Trophy,
    Users,
    X,
    Zap,
    Shield,
    ArrowRight
} from 'lucide-react';
import { simpleStakingService } from '../services/simpleStaking';
import { toast } from 'react-hot-toast';

// Constants
const MIN_STAKE_SOL = 0.01;
const MAX_STAKE_SOL = 10;
const PLATFORM_FEE_BPS = 250; // 2.5%

interface StakeModalProps {
    isHost: boolean;
    roomCode: string;
    existingStakeAmount?: number; // SOL amount if joining existing match
    onStakeComplete: (stakeInfo: { matchId: string; stakeAmount: number }) => void;
    onCancel: () => void;
}

const PRESET_AMOUNTS = [0.05, 0.1, 0.25, 0.5, 1];

export const StakeModal: React.FC<StakeModalProps> = ({
    isHost,
    roomCode,
    existingStakeAmount,
    onStakeComplete,
    onCancel,
}) => {
    const { publicKey, signTransaction, connected } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();

    const [stakeAmount, setStakeAmount] = useState<string>(
        existingStakeAmount?.toString() ?? '0.1'
    );
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const minStake = MIN_STAKE_SOL;
    const maxStake = MAX_STAKE_SOL;

    // Fetch balance
    useEffect(() => {
        const fetchBalance = async () => {
            if (!publicKey) return;
            setIsLoadingBalance(true);
            try {
                const bal = await connection.getBalance(publicKey);
                setBalance(bal / LAMPORTS_PER_SOL);
            } catch (err) {
                console.error('Failed to fetch balance:', err);
            } finally {
                setIsLoadingBalance(false);
            }
        };

        if (connected && publicKey) {
            fetchBalance();
        }
    }, [connected, publicKey, connection]);

    const handleStake = async () => {
        if (!publicKey || !signTransaction) {
            setVisible(true);
            return;
        }

        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount < minStake || amount > maxStake) {
            setError(`Stake must be between ${minStake} and ${maxStake} SOL`);
            return;
        }

        if (balance !== null && amount > balance) {
            setError('Insufficient balance');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const walletAdapter = { publicKey, signTransaction };

            if (isHost) {
                // Create new match with stake
                const result = await simpleStakingService.createMatch(
                    walletAdapter,
                    roomCode,
                    amount
                );
                if (result.success) {
                    toast.success('Match created! Ready for opponent.');
                    onStakeComplete({ matchId: roomCode, stakeAmount: amount });
                } else {
                    throw new Error(result.error);
                }
            } else {
                // Join existing match
                const result = await simpleStakingService.joinMatch(
                    walletAdapter,
                    roomCode
                );
                if (result.success) {
                    toast.success('Joined match! Good luck!');
                    onStakeComplete({ matchId: roomCode, stakeAmount: existingStakeAmount ?? amount });
                } else {
                    throw new Error(result.error);
                }
            }
        } catch (err: any) {
            console.error('Staking error:', err);
            const errorMessage = err.message || 'Transaction failed';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateRewards = () => {
        const amount = parseFloat(stakeAmount) || 0;
        const totalPot = amount * 2;
        const platformFee = totalPot * (PLATFORM_FEE_BPS / 10000);
        const winnerReward = totalPot - platformFee;
        return { totalPot, platformFee, winnerReward };
    };

    const rewards = calculateRewards();

    const handleRequestAirdrop = async () => {
        if (!publicKey) return;
        setIsLoading(true);
        try {
            const sig = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
            await connection.confirmTransaction(sig, 'confirmed');
            toast.success('Airdrop received! +1 SOL');
            const bal = await connection.getBalance(publicKey);
            setBalance(bal / LAMPORTS_PER_SOL);
        } catch (err: any) {
            toast.error('Airdrop failed. Try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-6 border-b border-slate-700/50">
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <Coins className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {isHost ? 'Create Staked Match' : 'Join Staked Match'}
                            </h2>
                            <p className="text-sm text-slate-400">
                                Room: <span className="text-purple-400 font-mono">{roomCode}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Wallet Status */}
                    {!connected ? (
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-3">
                                <Wallet className="w-5 h-5 text-yellow-400" />
                                <span className="text-slate-300">Connect wallet to stake</span>
                            </div>
                            <button
                                onClick={() => setVisible(true)}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all"
                            >
                                Connect Wallet
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Balance Display */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-purple-400" />
                                        <span className="text-slate-400">Your Balance</span>
                                    </div>
                                    <div className="text-right">
                                        {isLoadingBalance ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                        ) : (
                                            <span className="text-xl font-bold text-white">
                                                {balance?.toFixed(4) ?? '--'} SOL
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {balance !== null && balance < 0.1 && (
                                    <button
                                        onClick={handleRequestAirdrop}
                                        disabled={isLoading}
                                        className="mt-3 w-full text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2"
                                    >
                                        <Zap size={14} />
                                        Request Devnet Airdrop (+1 SOL)
                                    </button>
                                )}
                            </div>

                            {/* Stake Amount Input */}
                            {isHost ? (
                                <div className="space-y-3">
                                    <label className="text-sm text-slate-400">Stake Amount (SOL)</label>

                                    {/* Preset buttons */}
                                    <div className="flex gap-2">
                                        {PRESET_AMOUNTS.map((amount) => (
                                            <button
                                                key={amount}
                                                onClick={() => setStakeAmount(amount.toString())}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    parseFloat(stakeAmount) === amount
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                            >
                                                {amount}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom input */}
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={stakeAmount}
                                            onChange={(e) => {
                                                setStakeAmount(e.target.value);
                                                setError(null);
                                            }}
                                            min={minStake}
                                            max={maxStake}
                                            step="0.01"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            SOL
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        Min: {minStake} SOL | Max: {maxStake} SOL
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Required Stake</span>
                                        <span className="text-2xl font-bold text-purple-400">
                                            {existingStakeAmount?.toFixed(4)} SOL
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Match the host's stake to join
                                    </p>
                                </div>
                            )}

                            {/* Rewards Preview */}
                            <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl p-4 border border-purple-500/20">
                                <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                                    <Trophy size={16} />
                                    Potential Winnings
                                </h3>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Total Pot</span>
                                        <span className="text-white font-mono">
                                            {rewards.totalPot.toFixed(4)} SOL
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Platform Fee (2.5%)</span>
                                        <span className="text-slate-500 font-mono">
                                            -{rewards.platformFee.toFixed(4)} SOL
                                        </span>
                                    </div>
                                    <div className="border-t border-slate-700 pt-2 flex justify-between">
                                        <span className="text-slate-300 font-medium">Winner Gets</span>
                                        <span className="text-green-400 font-bold font-mono">
                                            {rewards.winnerReward.toFixed(4)} SOL
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Security Note */}
                            <div className="flex items-start gap-2 text-xs text-slate-500">
                                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>
                                    Your stake is locked in a secure escrow smart contract until the match ends.
                                    The winner automatically receives the combined pot.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={handleStake}
                                disabled={isLoading || (balance !== null && parseFloat(stakeAmount) > balance)}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Coins className="w-5 h-5" />
                                        <span>
                                            {isHost ? 'Create Match & Stake' : 'Join Match & Stake'}
                                        </span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-800/30 px-6 py-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Users size={14} />
                        <span>Solana Devnet • Skill-based staking</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StakeModal;
