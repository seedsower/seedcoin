use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(
        mut,
        seeds = [b"dao_state"],
        bump = dao_state.bump
    )]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        init_if_needed,
        payer = staker,
        space = StakeAccount::LEN,
        seeds = [b"stake", dao_state.key().as_ref(), staker.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        init_if_needed,
        payer = staker,
        token::mint = dao_state.sdao_mint,
        token::authority = dao_state,
        seeds = [b"stake_vault", dao_state.key().as_ref(), staker.key().as_ref()],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = staker_sdao_account.mint == dao_state.sdao_mint,
        constraint = staker_sdao_account.owner == staker.key()
    )]
    pub staker_sdao_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub staker: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<StakeTokens>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    require!(!ctx.accounts.dao_state.is_paused, ErrorCode::DaoPaused);

    let dao_state = &mut ctx.accounts.dao_state;
    let stake_account = &mut ctx.accounts.stake_account;
    let now = Clock::get()?.unix_timestamp;

    // Initialize stake account if needed
    if stake_account.owner == Pubkey::default() {
        stake_account.owner = ctx.accounts.staker.key();
        stake_account.dao_state = dao_state.key();
        stake_account.staked_amount = 0;
        stake_account.rewards_earned = 0;
        stake_account.last_claim_time = now;
        stake_account.stake_time = now;
        stake_account.voting_power = 0;
        stake_account.bump = ctx.bumps.stake_account;
    }

    // Transfer tokens to stake vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.staker_sdao_account.to_account_info(),
            to: ctx.accounts.stake_vault.to_account_info(),
            authority: ctx.accounts.staker.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Update stake account
    stake_account.staked_amount += amount;
    stake_account.voting_power = stake_account.calculate_voting_power();

    // Update DAO total staked
    dao_state.total_staked += amount;

    msg!("Staked {} SDAO tokens", amount);
    msg!("Total staked: {}", stake_account.staked_amount);
    msg!("Voting power: {}", stake_account.voting_power);

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("DAO is currently paused")]
    DaoPaused,
}
