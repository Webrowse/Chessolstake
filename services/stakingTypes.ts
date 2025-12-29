import { PublicKey } from '@solana/web3.js';

// Program ID - deployed to Devnet (lazy initialization to avoid polyfill timing issues)
const STAKING_PROGRAM_ID_STR = 'B5jR7EVRTkbJBc7zmRXmMAW1EwYpS9MfniGtRGxPoZ3u';
const PLATFORM_TREASURY_STR = '11111111111111111111111111111111';

let _stakingProgramId: PublicKey | null = null;
let _platformTreasury: PublicKey | null = null;

export function getStakingProgramId(): PublicKey {
    if (!_stakingProgramId) {
        _stakingProgramId = new PublicKey(STAKING_PROGRAM_ID_STR);
    }
    return _stakingProgramId;
}

export function getPlatformTreasury(): PublicKey {
    if (!_platformTreasury) {
        _platformTreasury = new PublicKey(PLATFORM_TREASURY_STR);
    }
    return _platformTreasury;
}

// Keep these for backwards compatibility but they now call the lazy getters
export const STAKING_PROGRAM_ID = { get value() { return getStakingProgramId(); } };
export const PLATFORM_TREASURY = { get value() { return getPlatformTreasury(); } };

// Constants matching the Rust program
export const MIN_STAKE_LAMPORTS = 10_000_000; // 0.01 SOL
export const MAX_STAKE_LAMPORTS = 10_000_000_000; // 10 SOL
export const PLATFORM_FEE_BPS = 250; // 2.5%

// Match status enum matching Rust
export enum MatchStatus {
    WaitingForChallenger = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
    Draw = 4,
}

// Match account structure matching Rust MatchAccount
export interface MatchAccount {
    matchId: Uint8Array; // [u8; 32]
    host: PublicKey;
    challenger: PublicKey;
    stakeAmount: bigint;
    status: MatchStatus;
    winner: PublicKey;
    createdAt: bigint;
    bump: number;
}

// Frontend-friendly stake info
export interface StakeInfo {
    matchId: string;
    hostAddress: string;
    challengerAddress: string | null;
    stakeAmountSol: number;
    totalPot: number;
    status: MatchStatus;
    winner: string | null;
    createdAt: Date;
}

// Create match parameters
export interface CreateMatchParams {
    matchId: string; // Room code or unique identifier
    stakeAmountSol: number;
}

// Join match parameters
export interface JoinMatchParams {
    matchId: string;
}

// Declare winner parameters
export interface DeclareWinnerParams {
    matchId: string;
    winner: PublicKey;
}

// IDL for Anchor program (simplified for client use)
export const STAKING_IDL = {
    version: '0.1.0',
    name: 'pokechess_staking',
    instructions: [
        {
            name: 'createMatch',
            accounts: [
                { name: 'matchAccount', isMut: true, isSigner: false },
                { name: 'escrowVault', isMut: true, isSigner: false },
                { name: 'host', isMut: true, isSigner: true },
                { name: 'systemProgram', isMut: false, isSigner: false },
            ],
            args: [
                { name: 'matchId', type: { array: ['u8', 32] } },
                { name: 'stakeAmount', type: 'u64' },
            ],
        },
        {
            name: 'joinMatch',
            accounts: [
                { name: 'matchAccount', isMut: true, isSigner: false },
                { name: 'escrowVault', isMut: true, isSigner: false },
                { name: 'challenger', isMut: true, isSigner: true },
                { name: 'systemProgram', isMut: false, isSigner: false },
            ],
            args: [],
        },
        {
            name: 'declareWinner',
            accounts: [
                { name: 'matchAccount', isMut: true, isSigner: false },
                { name: 'caller', isMut: true, isSigner: true },
            ],
            args: [
                { name: 'winner', type: 'publicKey' },
            ],
        },
        {
            name: 'claimReward',
            accounts: [
                { name: 'matchAccount', isMut: true, isSigner: false },
                { name: 'escrowVault', isMut: true, isSigner: false },
                { name: 'winner', isMut: true, isSigner: true },
                { name: 'platformTreasury', isMut: true, isSigner: false },
                { name: 'systemProgram', isMut: false, isSigner: false },
            ],
            args: [],
        },
        {
            name: 'cancelMatch',
            accounts: [
                { name: 'matchAccount', isMut: true, isSigner: false },
                { name: 'escrowVault', isMut: true, isSigner: false },
                { name: 'host', isMut: true, isSigner: true },
                { name: 'systemProgram', isMut: false, isSigner: false },
            ],
            args: [],
        },
        {
            name: 'declareDraw',
            accounts: [
                { name: 'matchAccount', isMut: true, isSigner: false },
                { name: 'escrowVault', isMut: true, isSigner: false },
                { name: 'caller', isMut: true, isSigner: true },
                { name: 'hostAccount', isMut: true, isSigner: false },
                { name: 'challengerAccount', isMut: true, isSigner: false },
                { name: 'systemProgram', isMut: false, isSigner: false },
            ],
            args: [],
        },
    ],
    accounts: [
        {
            name: 'MatchAccount',
            type: {
                kind: 'struct',
                fields: [
                    { name: 'matchId', type: { array: ['u8', 32] } },
                    { name: 'host', type: 'publicKey' },
                    { name: 'challenger', type: 'publicKey' },
                    { name: 'stakeAmount', type: 'u64' },
                    { name: 'status', type: { defined: 'MatchStatus' } },
                    { name: 'winner', type: 'publicKey' },
                    { name: 'createdAt', type: 'i64' },
                    { name: 'bump', type: 'u8' },
                ],
            },
        },
    ],
    types: [
        {
            name: 'MatchStatus',
            type: {
                kind: 'enum',
                variants: [
                    { name: 'WaitingForChallenger' },
                    { name: 'InProgress' },
                    { name: 'Completed' },
                    { name: 'Cancelled' },
                    { name: 'Draw' },
                ],
            },
        },
    ],
    events: [
        { name: 'MatchCreated', fields: [
            { name: 'matchId', type: { array: ['u8', 32] } },
            { name: 'host', type: 'publicKey' },
            { name: 'stakeAmount', type: 'u64' },
        ]},
        { name: 'MatchStarted', fields: [
            { name: 'matchId', type: { array: ['u8', 32] } },
            { name: 'host', type: 'publicKey' },
            { name: 'challenger', type: 'publicKey' },
            { name: 'totalPot', type: 'u64' },
        ]},
        { name: 'WinnerDeclared', fields: [
            { name: 'matchId', type: { array: ['u8', 32] } },
            { name: 'winner', type: 'publicKey' },
            { name: 'declaredBy', type: 'publicKey' },
        ]},
        { name: 'RewardClaimed', fields: [
            { name: 'matchId', type: { array: ['u8', 32] } },
            { name: 'winner', type: 'publicKey' },
            { name: 'amount', type: 'u64' },
            { name: 'platformFee', type: 'u64' },
        ]},
        { name: 'MatchCancelled', fields: [
            { name: 'matchId', type: { array: ['u8', 32] } },
            { name: 'refundedTo', type: 'publicKey' },
            { name: 'amount', type: 'u64' },
        ]},
        { name: 'MatchDraw', fields: [
            { name: 'matchId', type: { array: ['u8', 32] } },
            { name: 'refundAmount', type: 'u64' },
        ]},
    ],
    errors: [
        { code: 6000, name: 'StakeTooLow', msg: 'Stake amount is below minimum (0.01 SOL)' },
        { code: 6001, name: 'StakeTooHigh', msg: 'Stake amount exceeds maximum (10 SOL)' },
        { code: 6002, name: 'MatchNotJoinable', msg: 'Match is not joinable' },
        { code: 6003, name: 'CannotPlaySelf', msg: 'Cannot play against yourself' },
        { code: 6004, name: 'MatchNotInProgress', msg: 'Match is not in progress' },
        { code: 6005, name: 'InvalidWinner', msg: 'Invalid winner address' },
        { code: 6006, name: 'NotParticipant', msg: 'Caller is not a match participant' },
        { code: 6007, name: 'MatchNotCompleted', msg: 'Match is not completed' },
        { code: 6008, name: 'NotWinner', msg: 'Caller is not the winner' },
        { code: 6009, name: 'CannotCancelStartedMatch', msg: 'Cannot cancel a match that has started' },
        { code: 6010, name: 'NotHost', msg: 'Caller is not the host' },
    ],
} as const;

// Helper to convert room code to match ID bytes
export function roomCodeToMatchId(roomCode: string): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(roomCode.padEnd(32, '\0'));
    return encoded.slice(0, 32);
}

// Helper to convert match ID bytes back to room code
export function matchIdToRoomCode(matchId: Uint8Array): string {
    const decoder = new TextDecoder();
    return decoder.decode(matchId).replace(/\0/g, '').trim();
}

// Helper to format SOL amount
export function formatSol(lamports: number | bigint): string {
    const sol = Number(lamports) / 1e9;
    return sol.toFixed(4);
}

// Helper to convert SOL to lamports
export function solToLamports(sol: number): bigint {
    return BigInt(Math.floor(sol * 1e9));
}
