import React, { useState, useEffect, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import Peer, { DataConnection } from 'peerjs';
import {
    Coins,
    Users,
    X,
    ArrowRight,
    Copy,
    Check,
    Loader2,
    RefreshCw,
    AlertCircle,
    Zap,
    Shield,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { stakingService } from '../services/stakingService';

type ModalStep = 'choose' | 'host' | 'join' | 'waiting' | 'joining' | 'staking';

interface StakeMatchModalProps {
    onMatchReady: (matchInfo: {
        matchId: string;
        stakeAmount: number;
        isHost: boolean;
        peerConnection: DataConnection;
        hostAddress: string;
        challengerAddress: string;
    }) => void;
    onCancel: () => void;
}

interface HandshakeMessage {
    type: 'stake_info' | 'stake_accepted' | 'stake_confirmed';
    stakeAmount?: number;
    hostAddress?: string;
    joinerAddress?: string;
    txSignature?: string; // On-chain transaction signature
}

const PRESET_AMOUNTS = [0.05, 0.1, 0.25, 0.5, 1];

const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Prefix to namespace our peer IDs (alphanumeric only for PeerJS compatibility)
const PEER_PREFIX = 'pkchess';

// PeerJS server configuration
// The mDNS privacy feature in browsers prevents direct local connections
// between different browsers on the same machine. We'll use public STUN
// servers which should work for same-network connections.
const PEER_OPTIONS = {
    debug: 3,
    config: {
        iceServers: [
            // Multiple STUN servers for better reliability
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // ExpressTurn free TURN server
            {
                urls: 'turn:relay1.expressturn.com:3478',
                username: 'efN9VFAPQ3BHRGMJLM',
                credential: '7rL9YmqerOkqKmIo',
            },
        ],
        // iceCandidatePoolSize helps gather candidates faster
        iceCandidatePoolSize: 10,
    },
};


export const StakeMatchModal: React.FC<StakeMatchModalProps> = ({
    onMatchReady,
    onCancel,
}) => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();

    const [step, setStep] = useState<ModalStep>('choose');
    const [roomCode, setRoomCode] = useState('');
    const [stakeAmount, setStakeAmount] = useState('0.1');
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [stakingStatus, setStakingStatus] = useState<string>('');

    // For joiner - the host's stake amount they need to match
    const [hostStakeAmount, setHostStakeAmount] = useState<number | null>(null);
    const [hostAddress, setHostAddress] = useState<string | null>(null);

    // On-chain transaction tracking (used for logging/debugging)
    const [, setHostTxSignature] = useState<string | null>(null);
    const [, setJoinerTxSignature] = useState<string | null>(null);

    // PeerJS refs
    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    // Track if we've handed off the connection to the game (don't cleanup if so)
    const connectionHandedOff = useRef(false);

    // Initialize staking service with Anchor provider
    const initializeStakingService = () => {
        if (!publicKey || !signTransaction) return false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wallet: any = {
            publicKey,
            signTransaction,
            signAllTransactions: async (txs: Transaction[]) => {
                const signed = [];
                for (const tx of txs) {
                    signed.push(await signTransaction(tx));
                }
                return signed;
            },
        };

        const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        stakingService.initializeProgram(provider);
        return true;
    };

    // Cleanup peer on unmount or cancel (but NOT if connection was handed off to game)
    useEffect(() => {
        return () => {
            if (connectionHandedOff.current) {
                console.log('[StakeMatchModal] Connection handed off to game, skipping cleanup');
                return;
            }
            console.log('[StakeMatchModal] Cleaning up peer connection');
            if (connRef.current) {
                connRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

    // Fetch balance
    useEffect(() => {
        const fetchBalance = async () => {
            if (!publicKey) return;
            try {
                const bal = await connection.getBalance(publicKey);
                setBalance(bal / LAMPORTS_PER_SOL);
            } catch (err) {
                console.error('Failed to fetch balance:', err);
            }
        };
        fetchBalance();
    }, [publicKey, connection]);

    const handleGenerateCode = () => {
        setRoomCode(generateRoomCode());
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        toast.success('Room code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    // HOST: Create on-chain match and then wait for joiner via PeerJS
    const handleCreateMatch = async () => {
        if (!publicKey || !signTransaction) return;

        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount < 0.01 || amount > 10) {
            setError('Stake must be between 0.01 and 10 SOL');
            return;
        }

        if (!roomCode.trim()) {
            setError('Please enter or generate a room code');
            return;
        }

        if (balance !== null && amount > balance) {
            setError('Insufficient balance');
            return;
        }

        setIsLoading(true);
        setError(null);
        setStep('staking');
        setStakingStatus('Initializing staking service...');

        try {
            // Initialize staking service
            if (!initializeStakingService()) {
                throw new Error('Failed to initialize staking service');
            }

            // Step 1: Create on-chain match (deposit stake to escrow)
            setStakingStatus('Creating on-chain match...');
            console.log('[Host] Creating on-chain match with stake:', amount, 'SOL');

            const { signature, matchPDA } = await stakingService.createMatch(
                {
                    publicKey,
                    signTransaction: signTransaction as (tx: Transaction) => Promise<Transaction>,
                },
                {
                    matchId: roomCode.toUpperCase(),
                    stakeAmountSol: amount,
                }
            );

            console.log('[Host] On-chain match created! Signature:', signature, 'PDA:', matchPDA.toBase58());
            setHostTxSignature(signature);
            toast.success('Stake deposited on-chain!');

            // Step 2: Create peer with room code as ID
            setStakingStatus('Setting up P2P connection...');
            const peerId = PEER_PREFIX + roomCode.toUpperCase();
            console.log('[Host] Creating peer with ID:', peerId);

            // Destroy any existing peer
            if (peerRef.current) {
                peerRef.current.destroy();
            }

            const peer = new Peer(peerId, PEER_OPTIONS);
            peerRef.current = peer;

            peer.on('open', (id) => {
                console.log('[Host] Peer created and registered with ID:', id);
                setIsLoading(false);
                setStep('waiting');
                toast.success('Match created! Share the room code.');
            });

            peer.on('connection', (conn) => {
                console.log('[Host] Incoming connection from:', conn.peer, 'open:', conn.open);
                connRef.current = conn;

                let stakeInfoSent = false;
                let sendAttempts = 0;
                const maxAttempts = 10;

                // Send stake info function with retry logic
                const sendStakeInfo = () => {
                    if (stakeInfoSent) {
                        console.log('[Host] Stake info already sent, skipping');
                        return;
                    }

                    sendAttempts++;
                    const stakeInfo: HandshakeMessage = {
                        type: 'stake_info',
                        stakeAmount: amount,
                        hostAddress: publicKey.toBase58(),
                        txSignature: signature,
                    };
                    console.log('[Host] Sending stake info (attempt ' + sendAttempts + '):', stakeInfo);
                    try {
                        conn.send(stakeInfo);
                        stakeInfoSent = true;
                        console.log('[Host] Stake info sent successfully');
                    } catch (e) {
                        console.error('[Host] Failed to send stake info:', e);
                        // Retry if connection might still be establishing
                        if (sendAttempts < maxAttempts) {
                            setTimeout(sendStakeInfo, 500);
                        }
                    }
                };

                // Set up data handler first
                conn.on('data', (data) => {
                    console.log('[Host] Received data:', data);
                    const msg = data as HandshakeMessage | { type: string };
                    if (msg.type === 'stake_confirmed' && 'joinerAddress' in msg && 'txSignature' in msg) {
                        console.log('[Host] Joiner staked and confirmed! Starting game...');
                        setJoinerTxSignature(msg.txSignature as string);
                        toast.success('Opponent joined! Game starting...');
                        // Mark connection as handed off so cleanup doesn't close it
                        connectionHandedOff.current = true;
                        onMatchReady({
                            matchId: roomCode,
                            stakeAmount: amount,
                            isHost: true,
                            peerConnection: conn,
                            hostAddress: publicKey.toBase58(),
                            challengerAddress: msg.joinerAddress as string,
                        });
                    } else if (msg.type === 'request_stake_info') {
                        // Joiner is requesting stake info, resend it
                        console.log('[Host] Joiner requested stake info, resending...');
                        stakeInfoSent = false; // Reset to allow resend
                        sendStakeInfo();
                    }
                });

                conn.on('close', () => {
                    console.log('[Host] Connection closed');
                });

                conn.on('error', (err) => {
                    console.error('[Host] Connection error:', err);
                });

                conn.on('open', () => {
                    console.log('[Host] Connection open event fired');
                    sendStakeInfo();
                });

                // Poll for connection readiness and send stake info
                let pollAttempts = 0;
                const pollInterval = setInterval(() => {
                    pollAttempts++;
                    const dc = (conn as any).dataChannel as RTCDataChannel | undefined;

                    console.log('[Host] Poll #' + pollAttempts,
                        'conn.open:', conn.open,
                        'dc:', dc ? dc.readyState : 'none'
                    );

                    if (conn.open || (dc && dc.readyState === 'open')) {
                        console.log('[Host] Connection ready via polling, sending stake info');
                        sendStakeInfo();
                        if (stakeInfoSent) {
                            clearInterval(pollInterval);
                        }
                    }

                    if (pollAttempts > 40) { // 10 seconds
                        clearInterval(pollInterval);
                        console.log('[Host] Gave up polling after 40 attempts');
                    }
                }, 250);

                // If already open, send immediately
                if (conn.open) {
                    console.log('[Host] Connection already open');
                    sendStakeInfo();
                }
            });

            peer.on('error', (err: any) => {
                console.error('[Host] Peer error:', err.type, err);
                setIsLoading(false);
                setStep('host');

                if (err.type === 'unavailable-id') {
                    setError('This room code is already in use. Try a different one.');
                } else if (err.type === 'network') {
                    setError('Network error. Check your connection.');
                } else if (err.type === 'server-error') {
                    setError('Server error. Please try again.');
                } else {
                    setError(`Failed to create match: ${err.type || 'unknown error'}`);
                }
            });

            peer.on('disconnected', () => {
                console.log('[Host] Peer disconnected from signaling server, attempting reconnect...');
                peer.reconnect();
            });

        } catch (err: any) {
            console.error('[Host] Exception:', err);
            setError(err.message || 'Failed to create match');
            setIsLoading(false);
            setStep('host');
        }
    };

    // JOINER: Connect to the host's peer using room code
    const handleLookupMatch = async () => {
        if (!publicKey) return;

        if (!roomCode.trim() || roomCode.length < 4) {
            setError('Please enter a valid room code');
            return;
        }

        // Prevent double-clicks or re-renders from creating multiple connections
        if (isLoading) {
            console.log('[Joiner] Already loading, ignoring duplicate call');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const hostPeerId = PEER_PREFIX + roomCode.toUpperCase();
            console.log('[Joiner] Will connect to host peer ID:', hostPeerId);

            // Destroy any existing peer completely
            if (peerRef.current) {
                console.log('[Joiner] Destroying existing peer');
                peerRef.current.destroy();
                peerRef.current = null;
            }
            if (connRef.current) {
                connRef.current.close();
                connRef.current = null;
            }

            // Small delay to ensure cleanup
            await new Promise(resolve => setTimeout(resolve, 100));

            // Create our own peer first
            console.log('[Joiner] Creating peer with options:', PEER_OPTIONS);
            const peer = new Peer(PEER_OPTIONS);
            peerRef.current = peer;

            let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
            let hasConnected = false;

            peer.on('error', (err: any) => {
                console.error('[Joiner] Peer error BEFORE open:', err.type, err.message, err);
            });

            peer.on('open', (myId) => {
                console.log('[Joiner] Our peer ready with ID:', myId, '- now connecting to host:', hostPeerId);

                // Now connect to the host - use defaults for best compatibility
                const conn = peer.connect(hostPeerId);
                connRef.current = conn;

                // Set a timeout for connection - 20 seconds
                connectionTimeout = setTimeout(() => {
                    if (!hasConnected) {
                        console.log('[Joiner] Connection timeout - no response from host');
                        setError('Match not found or connection failed. Check the room code.');
                        setIsLoading(false);
                        conn.close();
                    }
                }, 20000);

                let receivedStakeInfo = false;

                // Request stake info from host if we're connected but haven't received it
                const requestStakeInfo = () => {
                    if (receivedStakeInfo) return;
                    console.log('[Joiner] Requesting stake info from host');
                    try {
                        conn.send({ type: 'request_stake_info' });
                    } catch (e) {
                        console.error('[Joiner] Failed to request stake info:', e);
                    }
                };

                conn.on('open', () => {
                    console.log('[Joiner] Connection open event fired!');
                    hasConnected = true;
                    if (connectionTimeout) clearTimeout(connectionTimeout);
                    // Request stake info after a short delay (host might be sending it already)
                    setTimeout(() => {
                        if (!receivedStakeInfo) {
                            requestStakeInfo();
                        }
                    }, 500);
                });

                conn.on('data', (data) => {
                    console.log('[Joiner] Received data:', data);
                    hasConnected = true;
                    if (connectionTimeout) clearTimeout(connectionTimeout);
                    const msg = data as HandshakeMessage;
                    if (msg.type === 'stake_info') {
                        console.log('[Joiner] Received stake info:', msg);
                        receivedStakeInfo = true;
                        setHostStakeAmount(msg.stakeAmount || 0);
                        setHostAddress(msg.hostAddress || null);
                        setStep('joining');
                        setIsLoading(false);
                    }
                });

                conn.on('close', () => {
                    console.log('[Joiner] Connection closed');
                    if (connectionTimeout) clearTimeout(connectionTimeout);
                    if (step === 'joining') {
                        toast.error('Host disconnected');
                        setStep('join');
                        setHostStakeAmount(null);
                    }
                });

                conn.on('error', (err) => {
                    console.error('[Joiner] Connection error:', err);
                    if (connectionTimeout) clearTimeout(connectionTimeout);
                    if (!hasConnected) {
                        setError('Failed to connect to match.');
                        setIsLoading(false);
                    }
                });

                // Monitor the underlying RTCPeerConnection for debugging
                const checkPeerConnection = () => {
                    const pc = (conn as any).peerConnection as RTCPeerConnection | undefined;
                    if (pc) {
                        console.log('[Joiner] RTCPeerConnection state:', pc.connectionState, 'ice:', pc.iceConnectionState, 'signaling:', pc.signalingState);

                        pc.onconnectionstatechange = () => {
                            console.log('[Joiner] RTCPeerConnection state changed:', pc.connectionState);
                        };
                        pc.oniceconnectionstatechange = () => {
                            console.log('[Joiner] ICE connection state changed:', pc.iceConnectionState);
                        };
                    } else {
                        // peerConnection might not be available immediately
                        setTimeout(checkPeerConnection, 100);
                    }
                };
                checkPeerConnection();

                // Check the data channel directly
                const checkDataChannel = () => {
                    const dc = (conn as any).dataChannel as RTCDataChannel | undefined;
                    if (dc) {
                        console.log('[Joiner] DataChannel found:', dc.label, 'state:', dc.readyState);
                        dc.onopen = () => {
                            console.log('[Joiner] DataChannel opened directly!');
                            hasConnected = true;
                            if (connectionTimeout) clearTimeout(connectionTimeout);
                        };
                    }
                };

                // Poll for data channel creation and request stake info
                let pollAttempts = 0;
                let lastRequestAttempt = 0;
                const pollInterval = setInterval(() => {
                    pollAttempts++;
                    const dc = (conn as any).dataChannel as RTCDataChannel | undefined;
                    const pc = (conn as any).peerConnection as RTCPeerConnection | undefined;

                    console.log('[Joiner] Poll #' + pollAttempts,
                        'conn.open:', conn.open,
                        'dc:', dc ? dc.readyState : 'none',
                        'pc:', pc ? pc.connectionState : 'none',
                        'ice:', pc ? pc.iceConnectionState : 'none',
                        'receivedStakeInfo:', receivedStakeInfo
                    );

                    if (dc && !dc.onopen) {
                        checkDataChannel();
                    }

                    const isConnected = conn.open || (dc && dc.readyState === 'open');

                    if (isConnected) {
                        hasConnected = true;
                        if (connectionTimeout) clearTimeout(connectionTimeout);

                        // If connected but no stake info yet, request it periodically
                        if (!receivedStakeInfo && pollAttempts - lastRequestAttempt >= 4) { // Every 1 second
                            lastRequestAttempt = pollAttempts;
                            requestStakeInfo();
                        }
                    }

                    // Stop polling once we have stake info or timeout
                    if (receivedStakeInfo) {
                        clearInterval(pollInterval);
                        console.log('[Joiner] Received stake info, stopping poll');
                    } else if (pollAttempts > 60) { // 15 seconds of polling
                        clearInterval(pollInterval);
                        console.log('[Joiner] Gave up polling after 60 attempts');
                    }
                }, 250);
            });

            peer.on('error', (err: any) => {
                console.error('[Joiner] Peer error:', err.type, err);
                if (connectionTimeout) clearTimeout(connectionTimeout);
                setIsLoading(false);

                if (err.type === 'peer-unavailable') {
                    setError('Match not found. Check the room code.');
                } else if (err.type === 'network') {
                    setError('Network error. Check your connection.');
                } else if (err.type === 'server-error') {
                    setError('Server error. Please try again.');
                } else {
                    setError(`Connection failed: ${err.type || 'unknown error'}`);
                }
            });

            peer.on('disconnected', () => {
                console.log('[Joiner] Peer disconnected from server');
            });

        } catch (err: any) {
            console.error('[Joiner] Exception:', err);
            setError(err.message || 'Failed to find match');
            setIsLoading(false);
        }
    };

    const handleJoinMatch = async () => {
        if (!publicKey || !signTransaction || hostStakeAmount === null || !connRef.current || !hostAddress) return;

        if (balance !== null && hostStakeAmount > balance) {
            setError('Insufficient balance to match stake');
            return;
        }

        setIsLoading(true);
        setError(null);
        setStep('staking');
        setStakingStatus('Initializing staking service...');

        try {
            // Initialize staking service
            if (!initializeStakingService()) {
                throw new Error('Failed to initialize staking service');
            }

            // Step 1: Join on-chain match (deposit matching stake to escrow)
            setStakingStatus('Joining on-chain match...');
            console.log('[Joiner] Joining on-chain match with stake:', hostStakeAmount, 'SOL');

            const signature = await stakingService.joinMatch(
                {
                    publicKey,
                    signTransaction: signTransaction as (tx: Transaction) => Promise<Transaction>,
                },
                {
                    matchId: roomCode.toUpperCase(),
                }
            );

            console.log('[Joiner] On-chain join successful! Signature:', signature);
            setJoinerTxSignature(signature);
            toast.success('Stake deposited on-chain!');

            // Step 2: Send confirmation to host with our tx signature
            setStakingStatus('Confirming with host...');
            const confirmation: HandshakeMessage = {
                type: 'stake_confirmed',
                joinerAddress: publicKey.toBase58(),
                txSignature: signature,
            };
            connRef.current.send(confirmation);
            console.log('[Joiner] Sent stake confirmation');

            toast.success('Joined match! Game starting...');
            // Mark connection as handed off so cleanup doesn't close it
            connectionHandedOff.current = true;
            onMatchReady({
                matchId: roomCode,
                stakeAmount: hostStakeAmount,
                isHost: false,
                peerConnection: connRef.current,
                hostAddress: hostAddress,
                challengerAddress: publicKey.toBase58(),
            });
        } catch (err: any) {
            console.error('[Joiner] Exception:', err);
            setError(err.message || 'Failed to join match');
            setIsLoading(false);
            setStep('joining');
        }
    };

    const handleDeclineMatch = () => {
        // Close connection
        if (connRef.current) {
            connRef.current.close();
            connRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        setHostStakeAmount(null);
        setHostAddress(null);
        setStep('join');
        setRoomCode('');
    };

    const handleCancelWaiting = () => {
        if (connRef.current) {
            connRef.current.close();
            connRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setStep('host');
    };

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

    const renderChooseStep = () => (
        <div className="space-y-4">
            <p className="text-slate-400 text-center mb-6">
                Create a new match or join an existing one
            </p>

            <button
                onClick={() => {
                    handleGenerateCode();
                    setStep('host');
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
            >
                <Coins className="w-5 h-5" />
                <span>Host Match</span>
            </button>

            <button
                onClick={() => setStep('join')}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
            >
                <Users className="w-5 h-5" />
                <span>Join Match</span>
            </button>
        </div>
    );

    const renderHostStep = () => (
        <div className="space-y-6">
            {/* Balance */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Your Balance</span>
                    <span className="text-xl font-bold text-white">
                        {balance?.toFixed(4) ?? '--'} SOL
                    </span>
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

            {/* Room Code */}
            <div className="space-y-2">
                <label className="text-sm text-slate-400">Room Code</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg uppercase focus:outline-none focus:border-purple-500"
                        placeholder="ABC123"
                    />
                    <button
                        onClick={handleGenerateCode}
                        className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl transition-colors"
                        title="Generate random code"
                    >
                        <RefreshCw size={20} className="text-slate-300" />
                    </button>
                </div>
            </div>

            {/* Stake Amount */}
            <div className="space-y-3">
                <label className="text-sm text-slate-400">Stake Amount (SOL)</label>
                <div className="flex gap-2 flex-wrap">
                    {PRESET_AMOUNTS.map((amount) => (
                        <button
                            key={amount}
                            onClick={() => setStakeAmount(amount.toString())}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                parseFloat(stakeAmount) === amount
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {amount}
                        </button>
                    ))}
                </div>
                <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => {
                        setStakeAmount(e.target.value);
                        setError(null);
                    }}
                    min="0.01"
                    max="10"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-slate-500">Min: 0.01 SOL | Max: 10 SOL</p>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Create Button */}
            <button
                onClick={handleCreateMatch}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating Match...</span>
                    </>
                ) : (
                    <>
                        <span>Create Match</span>
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </div>
    );

    const renderWaitingStep = () => (
        <div className="space-y-6 text-center">
            <div className="py-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Waiting for Opponent</h3>
                <p className="text-slate-400">Share this code with your opponent</p>
            </div>

            {/* Room Code Display */}
            <div className="bg-slate-800 rounded-xl p-6 border border-purple-500/30">
                <p className="text-slate-400 text-sm mb-2">Room Code</p>
                <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl font-mono font-bold text-white tracking-widest">
                        {roomCode}
                    </span>
                    <button
                        onClick={handleCopyCode}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        {copied ? (
                            <Check size={20} className="text-green-400" />
                        ) : (
                            <Copy size={20} className="text-slate-300" />
                        )}
                    </button>
                </div>
            </div>

            {/* Stake Info */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Your Stake</span>
                    <span className="text-white font-mono font-bold">
                        {stakeAmount} SOL
                    </span>
                </div>
            </div>

            {/* Cancel Button */}
            <button
                onClick={handleCancelWaiting}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-all"
            >
                Cancel Match
            </button>
        </div>
    );

    const renderJoinStep = () => (
        <div className="space-y-6">
            {/* Room Code Input */}
            <div className="space-y-2">
                <label className="text-sm text-slate-400">Enter Room Code</label>
                <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => {
                        setRoomCode(e.target.value.toUpperCase());
                        setError(null);
                    }}
                    maxLength={6}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white font-mono text-2xl text-center uppercase focus:outline-none focus:border-purple-500 tracking-widest"
                    placeholder="ABC123"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Lookup Button */}
            <button
                onClick={handleLookupMatch}
                disabled={isLoading || roomCode.length < 4}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connecting...</span>
                    </>
                ) : (
                    <>
                        <span>Find Match</span>
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </div>
    );

    const renderJoiningStep = () => (
        <div className="space-y-6">
            {/* Match Found */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center">
                <Check className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Match Found!</h3>
                <p className="text-slate-400">Room: <span className="font-mono text-white">{roomCode}</span></p>
                {hostAddress && (
                    <p className="text-xs text-slate-500 mt-2 font-mono truncate">
                        Host: {hostAddress.slice(0, 8)}...{hostAddress.slice(-8)}
                    </p>
                )}
            </div>

            {/* Stake Amount to Match */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <p className="text-slate-400 text-sm mb-2">Required Stake</p>
                <p className="text-3xl font-mono font-bold text-purple-400">
                    {hostStakeAmount?.toFixed(4)} SOL
                </p>
                <p className="text-slate-500 text-sm mt-2">
                    You must match this amount to join
                </p>
            </div>

            {/* Balance Check */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Your Balance</span>
                    <span className={`font-mono font-bold ${
                        balance !== null && hostStakeAmount !== null && balance >= hostStakeAmount
                            ? 'text-green-400'
                            : 'text-red-400'
                    }`}>
                        {balance?.toFixed(4) ?? '--'} SOL
                    </span>
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

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleDeclineMatch}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors"
                >
                    Decline
                </button>
                <button
                    onClick={handleJoinMatch}
                    disabled={isLoading || (balance !== null && hostStakeAmount !== null && balance < hostStakeAmount)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            <span>Accept & Join</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderStakingStep = () => (
        <div className="space-y-6 text-center">
            <div className="py-8">
                <div className="relative inline-block">
                    <Shield className="w-16 h-16 text-purple-500 mx-auto animate-pulse" />
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin absolute -bottom-1 -right-1" />
                </div>
                <h3 className="text-xl font-bold text-white mt-6 mb-2">Processing On-Chain</h3>
                <p className="text-slate-400">{stakingStatus}</p>
            </div>

            {/* Transaction Progress */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Status</span>
                    <span className="text-purple-400 font-medium flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {stakingStatus}
                    </span>
                </div>
            </div>

            <p className="text-slate-500 text-sm">
                Please confirm the transaction in your wallet.
                <br />Your stake will be held in escrow until the game ends.
            </p>
        </div>
    );

    const getTitle = () => {
        switch (step) {
            case 'choose': return 'Stake Match';
            case 'host': return 'Host a Match';
            case 'waiting': return 'Waiting for Opponent';
            case 'join': return 'Join a Match';
            case 'joining': return 'Confirm Match';
            case 'staking': return 'Depositing Stake';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
                            <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
                            <p className="text-sm text-slate-400">Solana Devnet</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'choose' && renderChooseStep()}
                    {step === 'host' && renderHostStep()}
                    {step === 'waiting' && renderWaitingStep()}
                    {step === 'join' && renderJoinStep()}
                    {step === 'joining' && renderJoiningStep()}
                    {step === 'staking' && renderStakingStep()}
                </div>

                {/* Back button for non-choose steps (not during staking or waiting) */}
                {step !== 'choose' && step !== 'waiting' && step !== 'staking' && (
                    <div className="px-6 pb-6">
                        <button
                            onClick={() => {
                                // Cleanup any connections
                                if (connRef.current) {
                                    connRef.current.close();
                                    connRef.current = null;
                                }
                                if (peerRef.current) {
                                    peerRef.current.destroy();
                                    peerRef.current = null;
                                }
                                setError(null);
                                setHostStakeAmount(null);
                                setHostAddress(null);
                                setStep('choose');
                            }}
                            className="w-full text-slate-400 hover:text-white py-2 text-sm transition-colors"
                        >
                            ← Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StakeMatchModal;
