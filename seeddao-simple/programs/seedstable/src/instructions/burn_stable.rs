use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Burn};
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct BurnStable<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump,
        constraint = !protocol_state.is_paused @ ErrorCode::ProtocolPaused
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        mut,
        seeds = [USER_POSITION_SEED, user.key().as_ref()],
        bump = user_position.bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(
        mut,
        address = protocol_state.stablecoin_mint
    )]
    pub stablecoin_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = stablecoin_mint,
        token::authority = user
    )]
    pub user_stablecoin_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<BurnStable>, amount: u64) -> Result<()> {
    let protocol_state = &mut ctx.accounts.protocol_state;
    let user_position = &mut ctx.accounts.user_position;

    // Check if user has enough stablecoins to burn
    require!(
        user_position.stablecoin_minted >= amount,
        ErrorCode::InsufficientFunds
    );

    require!(
        ctx.accounts.user_stablecoin_account.amount >= amount,
        ErrorCode::InsufficientFunds
    );

    // Burn stablecoins from user account
    let cpi_accounts = Burn {
        mint: ctx.accounts.stablecoin_mint.to_account_info(),
        from: ctx.accounts.user_stablecoin_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::burn(cpi_ctx, amount)?;

    // Update user position
    user_position.stablecoin_minted = user_position.stablecoin_minted
        .checked_sub(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    user_position.last_update_timestamp = Clock::get()?.unix_timestamp;

    // Update protocol state
    protocol_state.total_stablecoin_supply = protocol_state.total_stablecoin_supply
        .checked_sub(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    
    protocol_state.collateral_ratio = protocol_state.calculate_collateral_ratio();

    msg!("Burned {} stablecoins from user", amount);
    Ok(())
}
