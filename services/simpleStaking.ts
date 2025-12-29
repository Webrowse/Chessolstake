/**
 * Simple Staking Service - Uses basic SOL transfers instead of Anchor program
 * This is a simplified version for demo/development purposes
 */

import {
    Connection,
    PublicKey,
    Transaction,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export interface SimpleStakeInfo {
    matchId: string;
    hostAddress: string;
    challengerAddress: string | null;
    stakeAmountSol: number;
    totalPot: number;
    status: 'waiting' | 'active' | 'completed' | 'cancelled';
    winner: string | null;
}

// In-memory storage for match stakes (in production, use a database or on-chain storage)
const matchStakes = new Map<string, SimpleStakeInfo>();

class SimpleStakingService {
    private connection: Connection;

    constructor(rpcEndpoint: string = 'https://api.devnet.solana.com') {
        this.connection = new Connection(rpcEndpoint, 'confirmed');
    }

    /**
     * Create a new staked match (host stakes SOL)
     */
    async createMatch(
        wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
        matchId: string,
        stakeAmountSol: number
    ): Promise<{ success: boolean; signature?: string; error?: string }> {
        try {
            // For demo, we'll just record the stake intent
            // In production, this would transfer SOL to an escrow account

            const stakeInfo: SimpleStakeInfo = {
                matchId,
                hostAddress: wallet.publicKey.toBase58(),
                challengerAddress: null,
                stakeAmountSol,
                totalPot: stakeAmountSol,
                status: 'waiting',
                winner: null,
            };

            matchStakes.set(matchId, stakeInfo);

            return {
                success: true,
                signature: `demo-create-${matchId}-${Date.now()}`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create match',
            };
        }
    }

    /**
     * Join an existing match (challenger stakes SOL)
     */
    async joinMatch(
        wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
        matchId: string
    ): Promise<{ success: boolean; signature?: string; error?: string }> {
        try {
            const stakeInfo = matchStakes.get(matchId);

            if (!stakeInfo) {
                return { success: false, error: 'Match not found' };
            }

            if (stakeInfo.status !== 'waiting') {
                return { success: false, error: 'Match is not available to join' };
            }

            if (stakeInfo.hostAddress === wallet.publicKey.toBase58()) {
                return { success: false, error: 'Cannot play against yourself' };
            }

            // Update stake info
            stakeInfo.challengerAddress = wallet.publicKey.toBase58();
            stakeInfo.totalPot = stakeInfo.stakeAmountSol * 2;
            stakeInfo.status = 'active';
            matchStakes.set(matchId, stakeInfo);

            return {
                success: true,
                signature: `demo-join-${matchId}-${Date.now()}`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to join match',
            };
        }
    }

    /**
     * Declare winner and transfer stakes
     */
    async declareWinner(
        matchId: string,
        winnerAddress: string
    ): Promise<{ success: boolean; signature?: string; error?: string }> {
        try {
            const stakeInfo = matchStakes.get(matchId);

            if (!stakeInfo) {
                return { success: false, error: 'Match not found' };
            }

            if (stakeInfo.status !== 'active') {
                return { success: false, error: 'Match is not in progress' };
            }

            // Verify winner is a participant
            if (winnerAddress !== stakeInfo.hostAddress && winnerAddress !== stakeInfo.challengerAddress) {
                return { success: false, error: 'Winner must be a match participant' };
            }

            // Update stake info
            stakeInfo.winner = winnerAddress;
            stakeInfo.status = 'completed';
            matchStakes.set(matchId, stakeInfo);

            // In production, this would transfer the pot to the winner
            // For demo, we just record it

            return {
                success: true,
                signature: `demo-win-${matchId}-${Date.now()}`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to declare winner',
            };
        }
    }

    /**
     * Declare a draw (refund both players)
     */
    async declareDraw(
        matchId: string
    ): Promise<{ success: boolean; signature?: string; error?: string }> {
        try {
            const stakeInfo = matchStakes.get(matchId);

            if (!stakeInfo) {
                return { success: false, error: 'Match not found' };
            }

            // Update stake info
            stakeInfo.status = 'completed';
            stakeInfo.winner = null;
            matchStakes.set(matchId, stakeInfo);

            return {
                success: true,
                signature: `demo-draw-${matchId}-${Date.now()}`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to declare draw',
            };
        }
    }

    /**
     * Cancel a match (refund host)
     */
    async cancelMatch(
        matchId: string,
        callerAddress: string
    ): Promise<{ success: boolean; signature?: string; error?: string }> {
        try {
            const stakeInfo = matchStakes.get(matchId);

            if (!stakeInfo) {
                return { success: false, error: 'Match not found' };
            }

            if (stakeInfo.hostAddress !== callerAddress) {
                return { success: false, error: 'Only host can cancel' };
            }

            if (stakeInfo.status !== 'waiting') {
                return { success: false, error: 'Cannot cancel active match' };
            }

            stakeInfo.status = 'cancelled';
            matchStakes.set(matchId, stakeInfo);

            return {
                success: true,
                signature: `demo-cancel-${matchId}-${Date.now()}`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to cancel match',
            };
        }
    }

    /**
     * Get match info
     */
    getMatchInfo(matchId: string): SimpleStakeInfo | null {
        return matchStakes.get(matchId) || null;
    }

    /**
     * Check if match exists
     */
    matchExists(matchId: string): boolean {
        return matchStakes.has(matchId);
    }

    /**
     * Get wallet balance
     */
    async getBalance(publicKey: PublicKey): Promise<number> {
        try {
            const balance = await this.connection.getBalance(publicKey);
            return balance / LAMPORTS_PER_SOL;
        } catch {
            return 0;
        }
    }

    /**
     * Calculate winner reward (after 2.5% fee)
     */
    calculateWinnerReward(stakeAmountSol: number): {
        totalPot: number;
        platformFee: number;
        winnerReward: number;
    } {
        const totalPot = stakeAmountSol * 2;
        const platformFee = totalPot * 0.025; // 2.5%
        const winnerReward = totalPot - platformFee;

        return {
            totalPot,
            platformFee,
            winnerReward,
        };
    }
}

// Export singleton instance
export const simpleStakingService = new SimpleStakingService();

export default simpleStakingService;
