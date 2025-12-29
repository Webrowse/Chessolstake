import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import {
    getStakingProgramId,
    getPlatformTreasury,
    MIN_STAKE_LAMPORTS,
    MAX_STAKE_LAMPORTS,
    MatchStatus,
    StakeInfo,
    CreateMatchParams,
    JoinMatchParams,
    DeclareWinnerParams,
    STAKING_IDL,
    roomCodeToMatchId,
    matchIdToRoomCode,
    solToLamports,
} from './stakingTypes';

// PDA seed constants
const MATCH_SEED = 'match';
const ESCROW_SEED = 'escrow';

/**
 * Staking Service - Handles all interactions with the PokeChess staking program
 */
class StakingService {
    private connection: Connection;
    private program: Program | null = null;

    constructor(rpcEndpoint: string) {
        this.connection = new Connection(rpcEndpoint, 'confirmed');
    }

    /**
     * Initialize the Anchor program with a wallet provider
     */
    initializeProgram(provider: AnchorProvider) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.program = new Program(STAKING_IDL as any, provider);
    }

    /**
     * Get PDA for match account
     */
    getMatchPDA(matchId: Uint8Array): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from(MATCH_SEED), matchId],
            getStakingProgramId()
        );
    }

    /**
     * Get PDA for escrow vault
     */
    getEscrowPDA(matchId: Uint8Array): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from(ESCROW_SEED), matchId],
            getStakingProgramId()
        );
    }

    /**
     * Prepare a transaction with recent blockhash and fee payer
     */
    private async prepareTransaction(tx: Transaction, feePayer: PublicKey): Promise<Transaction> {
        const { blockhash } = await this.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = feePayer;
        return tx;
    }

    /**
     * Create a new staked match
     */
    async createMatch(
        wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
        params: CreateMatchParams
    ): Promise<{ signature: string; matchPDA: PublicKey }> {
        if (!this.program) {
            throw new Error('Program not initialized. Call initializeProgram first.');
        }

        const stakeAmountLamports = solToLamports(params.stakeAmountSol);

        if (stakeAmountLamports < BigInt(MIN_STAKE_LAMPORTS)) {
            throw new Error(`Minimum stake is ${MIN_STAKE_LAMPORTS / LAMPORTS_PER_SOL} SOL`);
        }
        if (stakeAmountLamports > BigInt(MAX_STAKE_LAMPORTS)) {
            throw new Error(`Maximum stake is ${MAX_STAKE_LAMPORTS / LAMPORTS_PER_SOL} SOL`);
        }

        const matchIdBytes = roomCodeToMatchId(params.matchId);
        const [matchPDA] = this.getMatchPDA(matchIdBytes);
        const [escrowPDA] = this.getEscrowPDA(matchIdBytes);

        const tx = await this.program.methods
            .createMatch(Array.from(matchIdBytes), new BN(stakeAmountLamports.toString()))
            .accountsStrict({
                matchAccount: matchPDA,
                escrowVault: escrowPDA,
                host: wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        await this.prepareTransaction(tx, wallet.publicKey);
        const signedTx = await wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize());
        await this.connection.confirmTransaction(signature, 'confirmed');

        return { signature, matchPDA };
    }

    /**
     * Join an existing match as challenger
     */
    async joinMatch(
        wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
        params: JoinMatchParams
    ): Promise<string> {
        if (!this.program) {
            throw new Error('Program not initialized. Call initializeProgram first.');
        }

        const matchIdBytes = roomCodeToMatchId(params.matchId);
        const [matchPDA] = this.getMatchPDA(matchIdBytes);
        const [escrowPDA] = this.getEscrowPDA(matchIdBytes);

        const tx = await this.program.methods
            .joinMatch()
            .accountsStrict({
                matchAccount: matchPDA,
                escrowVault: escrowPDA,
                challenger: wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        await this.prepareTransaction(tx, wallet.publicKey);
        const signedTx = await wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize());
        await this.connection.confirmTransaction(signature, 'confirmed');

        return signature;
    }

    /**
     * Declare the winner of a match
     */
    async declareWinner(
        wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
        params: DeclareWinnerParams
    ): Promise<string> {
        if (!this.program) {
            throw new Error('Program not initialized. Call initializeProgram first.');
        }

        const matchIdBytes = roomCodeToMatchId(params.matchId);
        const [matchPDA] = this.getMatchPDA(matchIdBytes);

        const tx = await this.program.methods
            .declareWinner(params.winner)
            .accountsStrict({
                matchAccount: matchPDA,
                caller: wallet.publicKey,
            })
            .transaction();

        await this.prepareTransaction(tx, wallet.publicKey);
        const signedTx = await wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize());
        await this.connection.confirmTransaction(signature, 'confirmed');

        return signature;
    }

    /**
     * Claim reward as the winner
     */
    async claimReward(
        wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
        matchId: string
    ): Promise<string> {
        if (!this.program) {
            throw new Error('Program not initialized. Call initializeProgram first.');
        }

        const matchIdBytes = roomCodeToMatchId(matchId);
        const [matchPDA] = this.getMatchPDA(matchIdBytes);
        const [escrowPDA] = this.getEscrowPDA(matchIdBytes);

        const tx = await this.program.methods
            .claimReward()
            .accountsStrict({
                matchAccount: matchPDA,
                escrowVault: escrowPDA,
                winner: wallet.publicKey,
                platformTreasury: getPlatformTreasury(),
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        await this.prepareTransaction(tx, wallet.publicKey);
        const signedTx = await wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize());
        await this.connection.confirmTransaction(signature, 'confirmed');

        return signature;
    }

    /**
     * Cancel a match (only before challenger joins)
     */
    async cancelMatch(
        wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
        matchId: string
    ): Promise<string> {
        if (!this.program) {
            throw new Error('Program not initialized. Call initializeProgram first.');
        }

        const matchIdBytes = roomCodeToMatchId(matchId);
        const [matchPDA] = this.getMatchPDA(matchIdBytes);
        const [escrowPDA] = this.getEscrowPDA(matchIdBytes);

        const tx = await this.program.methods
            .cancelMatch()
            .accountsStrict({
                matchAccount: matchPDA,
                escrowVault: escrowPDA,
                host: wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        await this.prepareTransaction(tx, wallet.publicKey);
        const signedTx = await wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize());
        await this.connection.confirmTransaction(signature, 'confirmed');

        return signature;
    }

    /**
     * Declare a draw (refunds both players)
     */
    async declareDraw(
        wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
        matchId: string,
        hostPubkey: PublicKey,
        challengerPubkey: PublicKey
    ): Promise<string> {
        if (!this.program) {
            throw new Error('Program not initialized. Call initializeProgram first.');
        }

        const matchIdBytes = roomCodeToMatchId(matchId);
        const [matchPDA] = this.getMatchPDA(matchIdBytes);
        const [escrowPDA] = this.getEscrowPDA(matchIdBytes);

        const tx = await this.program.methods
            .declareDraw()
            .accountsStrict({
                matchAccount: matchPDA,
                escrowVault: escrowPDA,
                caller: wallet.publicKey,
                hostAccount: hostPubkey,
                challengerAccount: challengerPubkey,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        await this.prepareTransaction(tx, wallet.publicKey);
        const signedTx = await wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize());
        await this.connection.confirmTransaction(signature, 'confirmed');

        return signature;
    }

    /**
     * Fetch match info from chain
     */
    async getMatchInfo(matchId: string): Promise<StakeInfo | null> {
        if (!this.program) {
            throw new Error('Program not initialized. Call initializeProgram first.');
        }

        const matchIdBytes = roomCodeToMatchId(matchId);
        const [matchPDA] = this.getMatchPDA(matchIdBytes);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const account = await (this.program.account as any).matchAccount.fetch(matchPDA);

            const stakeAmountSol = Number(account.stakeAmount) / LAMPORTS_PER_SOL;

            return {
                matchId: matchIdToRoomCode(new Uint8Array(account.matchId)),
                hostAddress: account.host.toBase58(),
                challengerAddress: account.challenger.equals(PublicKey.default)
                    ? null
                    : account.challenger.toBase58(),
                stakeAmountSol,
                totalPot: stakeAmountSol * 2,
                status: account.status as MatchStatus,
                winner: account.winner.equals(PublicKey.default)
                    ? null
                    : account.winner.toBase58(),
                createdAt: new Date(Number(account.createdAt) * 1000),
            };
        } catch (error) {
            console.error('Failed to fetch match info:', error);
            return null;
        }
    }

    /**
     * Check if a match exists
     */
    async matchExists(matchId: string): Promise<boolean> {
        const matchIdBytes = roomCodeToMatchId(matchId);
        const [matchPDA] = this.getMatchPDA(matchIdBytes);

        const accountInfo = await this.connection.getAccountInfo(matchPDA);
        return accountInfo !== null;
    }

    /**
     * Get wallet balance
     */
    async getBalance(publicKey: PublicKey): Promise<number> {
        const balance = await this.connection.getBalance(publicKey);
        return balance / LAMPORTS_PER_SOL;
    }

    /**
     * Request airdrop (devnet only)
     */
    async requestAirdrop(publicKey: PublicKey, solAmount: number = 1): Promise<string> {
        const signature = await this.connection.requestAirdrop(
            publicKey,
            solAmount * LAMPORTS_PER_SOL
        );
        await this.connection.confirmTransaction(signature, 'confirmed');
        return signature;
    }

    /**
     * Calculate winner reward after platform fee
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
export const stakingService = new StakingService(
    'https://api.devnet.solana.com'
);

export default stakingService;
