use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("B5jR7EVRTkbJBc7zmRXmMAW1EwYpS9MfniGtRGxPoZ3u");

/// PokeChess Staking Program
///
/// This program handles escrow-based staking for chess matches.
/// Players stake SOL before a match, and the winner receives the combined pot.
///
/// Flow:
/// 1. Player 1 (host) creates a match and stakes SOL
/// 2. Player 2 (challenger) joins and stakes matching SOL
/// 3. After game ends, the winner (or arbiter) calls claim_reward
/// 4. Winner receives total pot minus platform fee
#[program]
pub mod pokechess_staking {
    use super::*;

    /// Platform fee in basis points (100 = 1%)
    pub const PLATFORM_FEE_BPS: u64 = 250; // 2.5%

    /// Minimum stake amount (0.01 SOL)
    pub const MIN_STAKE_LAMPORTS: u64 = 10_000_000;

    /// Maximum stake amount (10 SOL for devnet safety)
    pub const MAX_STAKE_LAMPORTS: u64 = 10_000_000_000;

    /// Creates a new match with initial stake from the host
    pub fn create_match(
        ctx: Context<CreateMatch>,
        match_id: [u8; 32],
        stake_amount: u64,
    ) -> Result<()> {
        require!(
            stake_amount >= MIN_STAKE_LAMPORTS,
            StakingError::StakeTooLow
        );
        require!(
            stake_amount <= MAX_STAKE_LAMPORTS,
            StakingError::StakeTooHigh
        );

        let match_account = &mut ctx.accounts.match_account;
        match_account.match_id = match_id;
        match_account.host = ctx.accounts.host.key();
        match_account.challenger = Pubkey::default();
        match_account.stake_amount = stake_amount;
        match_account.status = MatchStatus::WaitingForChallenger;
        match_account.winner = Pubkey::default();
        match_account.created_at = Clock::get()?.unix_timestamp;
        match_account.bump = ctx.bumps.match_account;

        // Transfer stake from host to escrow
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.host.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                },
            ),
            stake_amount,
        )?;

        emit!(MatchCreated {
            match_id,
            host: ctx.accounts.host.key(),
            stake_amount,
        });

        Ok(())
    }

    /// Challenger joins an existing match by staking the same amount
    pub fn join_match(ctx: Context<JoinMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::WaitingForChallenger,
            StakingError::MatchNotJoinable
        );
        require!(
            ctx.accounts.challenger.key() != match_account.host,
            StakingError::CannotPlaySelf
        );

        match_account.challenger = ctx.accounts.challenger.key();
        match_account.status = MatchStatus::InProgress;

        // Transfer matching stake from challenger to escrow
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.challenger.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                },
            ),
            match_account.stake_amount,
        )?;

        emit!(MatchStarted {
            match_id: match_account.match_id,
            host: match_account.host,
            challenger: ctx.accounts.challenger.key(),
            total_pot: match_account.stake_amount * 2,
        });

        Ok(())
    }

    /// Declares the winner and distributes rewards
    /// Can only be called by the host or challenger (honest reporting)
    /// In production, this would use an oracle or trusted arbiter
    pub fn declare_winner(ctx: Context<DeclareWinner>, winner: Pubkey) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::InProgress,
            StakingError::MatchNotInProgress
        );
        require!(
            winner == match_account.host || winner == match_account.challenger,
            StakingError::InvalidWinner
        );

        // Verify caller is a participant
        let caller = ctx.accounts.caller.key();
        require!(
            caller == match_account.host || caller == match_account.challenger,
            StakingError::NotParticipant
        );

        match_account.winner = winner;
        match_account.status = MatchStatus::Completed;

        emit!(WinnerDeclared {
            match_id: match_account.match_id,
            winner,
            declared_by: caller,
        });

        Ok(())
    }

    /// Winner claims the reward from escrow
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        let match_account = &ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::Completed,
            StakingError::MatchNotCompleted
        );
        require!(
            ctx.accounts.winner.key() == match_account.winner,
            StakingError::NotWinner
        );

        let total_pot = match_account.stake_amount * 2;
        let platform_fee = (total_pot * PLATFORM_FEE_BPS) / 10_000;
        let winner_reward = total_pot - platform_fee;

        // Transfer reward to winner
        let match_id = match_account.match_id;

        // Transfer winner reward
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= winner_reward;
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += winner_reward;

        // Transfer platform fee to treasury
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.platform_treasury.to_account_info().try_borrow_mut_lamports()? += platform_fee;

        emit!(RewardClaimed {
            match_id,
            winner: ctx.accounts.winner.key(),
            amount: winner_reward,
            platform_fee,
        });

        Ok(())
    }

    /// Cancel a match before challenger joins (refund host)
    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        let match_account = &ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::WaitingForChallenger,
            StakingError::CannotCancelStartedMatch
        );
        require!(
            ctx.accounts.host.key() == match_account.host,
            StakingError::NotHost
        );

        let stake_amount = match_account.stake_amount;

        // Refund host
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= stake_amount;
        **ctx.accounts.host.to_account_info().try_borrow_mut_lamports()? += stake_amount;

        emit!(MatchCancelled {
            match_id: match_account.match_id,
            refunded_to: ctx.accounts.host.key(),
            amount: stake_amount,
        });

        Ok(())
    }

    /// Declare a draw and refund both players
    pub fn declare_draw(ctx: Context<DeclareDraw>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::InProgress,
            StakingError::MatchNotInProgress
        );

        let caller = ctx.accounts.caller.key();
        require!(
            caller == match_account.host || caller == match_account.challenger,
            StakingError::NotParticipant
        );

        match_account.status = MatchStatus::Draw;
        let stake_amount = match_account.stake_amount;

        // Refund both players
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= stake_amount;
        **ctx.accounts.host_account.to_account_info().try_borrow_mut_lamports()? += stake_amount;

        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= stake_amount;
        **ctx.accounts.challenger_account.to_account_info().try_borrow_mut_lamports()? += stake_amount;

        emit!(MatchDraw {
            match_id: match_account.match_id,
            refund_amount: stake_amount,
        });

        Ok(())
    }
}

// ============================================================================
// Accounts
// ============================================================================

#[derive(Accounts)]
#[instruction(match_id: [u8; 32], stake_amount: u64)]
pub struct CreateMatch<'info> {
    #[account(
        init,
        payer = host,
        space = 8 + MatchAccount::INIT_SPACE,
        seeds = [b"match", match_id.as_ref()],
        bump
    )]
    pub match_account: Account<'info, MatchAccount>,

    #[account(
        mut,
        seeds = [b"escrow", match_id.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as escrow vault
    pub escrow_vault: AccountInfo<'info>,

    #[account(mut)]
    pub host: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(
        mut,
        seeds = [b"match", match_account.match_id.as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, MatchAccount>,

    #[account(
        mut,
        seeds = [b"escrow", match_account.match_id.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as escrow vault
    pub escrow_vault: AccountInfo<'info>,

    #[account(mut)]
    pub challenger: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeclareWinner<'info> {
    #[account(
        mut,
        seeds = [b"match", match_account.match_id.as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, MatchAccount>,

    #[account(mut)]
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [b"match", match_account.match_id.as_ref()],
        bump = match_account.bump,
        close = winner
    )]
    pub match_account: Account<'info, MatchAccount>,

    #[account(
        mut,
        seeds = [b"escrow", match_account.match_id.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as escrow vault
    pub escrow_vault: AccountInfo<'info>,

    #[account(mut)]
    pub winner: Signer<'info>,

    /// CHECK: Platform treasury for fees
    #[account(mut)]
    pub platform_treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(
        mut,
        seeds = [b"match", match_account.match_id.as_ref()],
        bump = match_account.bump,
        close = host
    )]
    pub match_account: Account<'info, MatchAccount>,

    #[account(
        mut,
        seeds = [b"escrow", match_account.match_id.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as escrow vault
    pub escrow_vault: AccountInfo<'info>,

    #[account(mut)]
    pub host: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeclareDraw<'info> {
    #[account(
        mut,
        seeds = [b"match", match_account.match_id.as_ref()],
        bump = match_account.bump,
        close = caller
    )]
    pub match_account: Account<'info, MatchAccount>,

    #[account(
        mut,
        seeds = [b"escrow", match_account.match_id.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as escrow vault
    pub escrow_vault: AccountInfo<'info>,

    #[account(mut)]
    pub caller: Signer<'info>,

    /// CHECK: Host account for refund
    #[account(mut, address = match_account.host)]
    pub host_account: AccountInfo<'info>,

    /// CHECK: Challenger account for refund
    #[account(mut, address = match_account.challenger)]
    pub challenger_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

// ============================================================================
// State
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct MatchAccount {
    /// Unique match identifier (can be room code hash)
    pub match_id: [u8; 32],

    /// Host player (white, creates the match)
    pub host: Pubkey,

    /// Challenger player (black, joins the match)
    pub challenger: Pubkey,

    /// Stake amount per player in lamports
    pub stake_amount: u64,

    /// Current match status
    pub status: MatchStatus,

    /// Winner's public key (set after match ends)
    pub winner: Pubkey,

    /// Unix timestamp when match was created
    pub created_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MatchStatus {
    WaitingForChallenger,
    InProgress,
    Completed,
    Cancelled,
    Draw,
}

impl Default for MatchStatus {
    fn default() -> Self {
        MatchStatus::WaitingForChallenger
    }
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct MatchCreated {
    pub match_id: [u8; 32],
    pub host: Pubkey,
    pub stake_amount: u64,
}

#[event]
pub struct MatchStarted {
    pub match_id: [u8; 32],
    pub host: Pubkey,
    pub challenger: Pubkey,
    pub total_pot: u64,
}

#[event]
pub struct WinnerDeclared {
    pub match_id: [u8; 32],
    pub winner: Pubkey,
    pub declared_by: Pubkey,
}

#[event]
pub struct RewardClaimed {
    pub match_id: [u8; 32],
    pub winner: Pubkey,
    pub amount: u64,
    pub platform_fee: u64,
}

#[event]
pub struct MatchCancelled {
    pub match_id: [u8; 32],
    pub refunded_to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct MatchDraw {
    pub match_id: [u8; 32],
    pub refund_amount: u64,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum StakingError {
    #[msg("Stake amount is below minimum (0.01 SOL)")]
    StakeTooLow,

    #[msg("Stake amount exceeds maximum (10 SOL)")]
    StakeTooHigh,

    #[msg("Match is not joinable")]
    MatchNotJoinable,

    #[msg("Cannot play against yourself")]
    CannotPlaySelf,

    #[msg("Match is not in progress")]
    MatchNotInProgress,

    #[msg("Invalid winner address")]
    InvalidWinner,

    #[msg("Caller is not a match participant")]
    NotParticipant,

    #[msg("Match is not completed")]
    MatchNotCompleted,

    #[msg("Caller is not the winner")]
    NotWinner,

    #[msg("Cannot cancel a match that has started")]
    CannotCancelStartedMatch,

    #[msg("Caller is not the host")]
    NotHost,
}
