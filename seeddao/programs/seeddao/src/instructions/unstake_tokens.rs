use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;

#[derive(Accounts)]
pub struct UnstakeTokens<'info> {
    #[account(
        mut,
        seeds = [b"dao_state"],
        bump = dao_state.bump
    )]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        mut,
        seeds = [b"stake", dao_state.key().as_ref(), staker.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == staker.key()
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
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
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<UnstakeTokens>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    require!(!ctx.accounts.dao_state.is_paused, ErrorCode::DaoPaused);

    let dao_state = &mut ctx.accounts.dao_state;
    let stake_account = &mut ctx.accounts.stake_account;

    require!(stake_account.staked_amount >= amount, ErrorCode::InsufficientStake);

    // Create signer seeds for DAO authority
    let dao_seeds = &[
        b"dao_state",
        &[dao_state.bump],
    ];
    let signer = &[&dao_seeds[..]];

    // Transfer tokens back to staker
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.stake_vault.to_account_info(),
            to: ctx.accounts.staker_sdao_account.to_account_info(),
            authority: dao_state.to_account_info(),
        },
        signer,
    );
    token::transfer(transfer_ctx, amount)?;

    // Update stake account
    stake_account.staked_amount -= amount;
    stake_account.voting_power = stake_account.calculate_voting_power();

    // Update DAO total staked
    dao_state.total_staked -= amount;

    msg!("Unstaked {} SDAO tokens", amount);
    msg!("Remaining staked: {}", stake_account.staked_amount);
    msg!("Voting power: {}", stake_account.voting_power);

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("DAO is currently paused")]
    DaoPaused,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
}
