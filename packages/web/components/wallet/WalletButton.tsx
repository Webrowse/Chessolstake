import React, { useState, useCallback, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown, Check, Loader2 } from 'lucide-react';

export const WalletButton: React.FC = () => {
    const { publicKey, wallet, disconnect, connecting, connected } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();
    const [balance, setBalance] = useState<number | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    // Track adapter readiness to avoid evaluating connected state too early
    // Chrome's late provider injection can cause false "disconnected" during initial mount
    const [isAdapterReady, setIsAdapterReady] = useState(false);

    // Wait a brief moment before trusting the connected state
    // This handles Chrome's late provider injection timing
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAdapterReady(true);
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // Fetch balance when connected
    const fetchBalance = useCallback(async () => {
        if (!publicKey) return;
        setIsLoadingBalance(true);
        try {
            const bal = await connection.getBalance(publicKey);
            setBalance(bal / LAMPORTS_PER_SOL);
        } catch (err) {
            console.error('Failed to fetch balance:', err);
            setBalance(null);
        } finally {
            setIsLoadingBalance(false);
        }
    }, [publicKey, connection]);

    React.useEffect(() => {
        if (connected && publicKey) {
            fetchBalance();
            // Subscribe to balance changes
            const subId = connection.onAccountChange(publicKey, (account) => {
                setBalance(account.lamports / LAMPORTS_PER_SOL);
            });
            return () => {
                connection.removeAccountChangeListener(subId);
            };
        } else {
            setBalance(null);
        }
    }, [connected, publicKey, connection, fetchBalance]);

    const handleConnect = () => {
        setVisible(true);
    };

    const handleDisconnect = async () => {
        await disconnect();
        setShowDropdown(false);
    };

    const copyAddress = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey.toBase58());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openExplorer = () => {
        if (publicKey) {
            window.open(
                `https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`,
                '_blank'
            );
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    // Show loading state during initial adapter readiness check
    // This prevents showing "Connect Wallet" button when wallet might auto-connect
    if (!isAdapterReady && !connected && !connecting) {
        return (
            <button
                disabled
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600/50 to-indigo-600/50 text-white/70 px-4 py-2 rounded-xl font-semibold shadow-lg border border-purple-400/20 cursor-wait"
            >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Initializing...</span>
            </button>
        );
    }

    // Not connected - show connect button
    if (!connected) {
        return (
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
            >
                {connecting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connecting...</span>
                    </>
                ) : (
                    <>
                        <Wallet className="w-5 h-5" />
                        <span>Connect Wallet</span>
                    </>
                )}
            </button>
        );
    }

    // Connected - show wallet info
    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 px-4 py-2 rounded-xl transition-all duration-300 hover:bg-slate-700/80"
            >
                {/* Wallet Icon */}
                {wallet?.adapter.icon && (
                    <img
                        src={wallet.adapter.icon}
                        alt={wallet.adapter.name}
                        className="w-5 h-5 rounded"
                    />
                )}

                {/* Balance & Address */}
                <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-white">
                        {isLoadingBalance ? (
                            <span className="text-slate-400">Loading...</span>
                        ) : balance !== null ? (
                            `${balance.toFixed(4)} SOL`
                        ) : (
                            '-- SOL'
                        )}
                    </span>
                    <span className="text-xs text-slate-400">
                        {publicKey ? truncateAddress(publicKey.toBase58()) : ''}
                    </span>
                </div>

                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                        showDropdown ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                        {/* Balance Section */}
                        <div className="p-4 border-b border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">Balance</p>
                            <p className="text-xl font-bold text-white">
                                {balance?.toFixed(4) ?? '--'} SOL
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Devnet</p>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                            <button
                                onClick={copyAddress}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                            </button>

                            <button
                                onClick={openExplorer}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>View on Explorer</span>
                            </button>

                            <button
                                onClick={fetchBalance}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <Loader2 className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                                <span>Refresh Balance</span>
                            </button>
                        </div>

                        {/* Disconnect */}
                        <div className="p-2 border-t border-slate-700/50">
                            <button
                                onClick={handleDisconnect}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Disconnect</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WalletButton;
