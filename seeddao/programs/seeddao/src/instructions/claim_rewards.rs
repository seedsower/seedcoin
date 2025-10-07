use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, MintTo};
use crate::state::*;

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
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
        constraint = sdao_mint.key() == dao_state.sdao_mint
    )]
    pub sdao_mint: Account<'info, anchor_spl::token::Mint>,

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
    ctx: Context<ClaimRewards>,
    apy_basis_points: u64, // e.g., 1850 for 18.5% APY
) -> Result<()> {
    let dao_state = &ctx.accounts.dao_state;
    let stake_account = &mut ctx.accounts.stake_account;

    require!(stake_account.staked_amount > 0, ErrorCode::NoStakedTokens);

    // Calculate rewards
    let rewards = stake_account.calculate_rewards(apy_basis_points);
    require!(rewards > 0, ErrorCode::NoRewardsToClaim);

    // Create signer seeds for DAO authority (mint authority)
    let dao_seeds = &[
        b"dao_state",
        &[dao_state.bump],
    ];
    let signer = &[&dao_seeds[..]];

    // Mint rewards to staker
    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.sdao_mint.to_account_info(),
            to: ctx.accounts.staker_sdao_account.to_account_info(),
            authority: dao_state.to_account_info(),
        },
        signer,
    );
    token::mint_to(mint_ctx, rewards)?;

    // Update stake account
    stake_account.rewards_earned += rewards;
    stake_account.last_claim_time = Clock::get()?.unix_timestamp;

    msg!("Claimed {} SDAO rewards", rewards);
    msg!("Total rewards earned: {}", stake_account.rewards_earned);

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("No staked tokens")]
    NoStakedTokens,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
}
