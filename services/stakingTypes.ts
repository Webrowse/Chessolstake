import { PublicKey } from '@solana/web3.js';

// Import the actual generated IDL from Anchor build
// This ensures compatibility with Anchor 0.32.x format
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JSON import
import POKECHESS_STAKING_IDL from './pokechess_staking_idl.json';

// Program ID - deployed to Devnet (lazy initialization to avoid polyfill timing issues)
const STAKING_PROGRAM_ID_STR = 'B5jR7EVRTkbJBc7zmRXmMAW1EwYpS9MfniGtRGxPoZ3u';
// Platform treasury wallet address - receives 2.5% fee from each match
const PLATFORM_TREASURY_STR = 'CtyKE4xLkGGQkgyD6GfJP67WgjozeQrUumDZVbiV9QDZ';

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

// Export the IDL for use in the staking service
export const STAKING_IDL = POKECHESS_STAKING_IDL;

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
