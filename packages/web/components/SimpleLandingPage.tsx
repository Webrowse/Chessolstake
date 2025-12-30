import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Users, Coins, Wallet, LogOut } from 'lucide-react';

interface SimpleLandingPageProps {
    onPlayPvP: () => void;
    onStakeMatch: () => void;
}

const SimpleLandingPage: React.FC<SimpleLandingPageProps> = ({
    onPlayPvP,
    onStakeMatch,
}) => {
    const { publicKey, disconnect, connected } = useWallet();
    const { setVisible } = useWalletModal();

    const handleWalletClick = () => {
        if (connected) {
            onStakeMatch();
        } else {
            setVisible(true);
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
            {/* Disconnect Button - Top Right */}
            {connected && publicKey && (
                <div className="absolute top-4 right-4 flex items-center gap-3">
                    <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-slate-300 text-sm font-mono">
                            {truncateAddress(publicKey.toBase58())}
                        </span>
                    </div>
                    <button
                        onClick={() => disconnect()}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-xl border border-red-500/30 transition-all"
                        title="Disconnect Wallet"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-md w-full text-center space-y-8">
                {/* Title */}
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-white tracking-tight">
                        POKE<span className="text-blue-500">CHESS</span>
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Pokemon-themed chess with SOL staking on Solana.
                        Play locally or stake SOL and challenge opponents for real rewards.
                    </p>
                </div>

                {/* Buttons */}
                <div className="space-y-4">
                    {/* Play PvP Button */}
                    <button
                        onClick={onPlayPvP}
                        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 group"
                    >
                        <Users className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        <span>Play PvP</span>
                        <span className="text-slate-500 text-sm">(Local - Same Device)</span>
                    </button>

                    {/* Connect Wallet / Stake Match Button */}
                    <button
                        onClick={handleWalletClick}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                    >
                        {connected ? (
                            <>
                                <Coins className="w-5 h-5" />
                                <span>Stake Match</span>
                            </>
                        ) : (
                            <>
                                <Wallet className="w-5 h-5" />
                                <span>Connect Wallet</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer Info */}
                <div className="text-slate-500 text-sm space-y-1">
                    <p>Built on Solana Devnet</p>
                    <p className="text-slate-600">2.5% platform fee on staked matches</p>
                </div>
            </div>
        </div>
    );
};

export default SimpleLandingPage;
