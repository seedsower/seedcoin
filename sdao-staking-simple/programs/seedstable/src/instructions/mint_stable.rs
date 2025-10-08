use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct MintStable<'info> {
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

pub fn handler(ctx: Context<MintStable>, amount: u64) -> Result<()> {
    let protocol_state = &mut ctx.accounts.protocol_state;
    let user_position = &mut ctx.accounts.user_position;

    // Calculate total collateral value for user
    let total_collateral_value: u64 = user_position.collateral_pool
        .as_ref()
        .map(|pos| pos.value_usd)
        .unwrap_or(0);

    // Calculate new stablecoin amount after minting
    let new_stablecoin_amount = user_position.stablecoin_minted
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;

    // Check if collateral ratio would be maintained
    let new_health_factor = user_position.calculate_health_factor(total_collateral_value);
    require!(
        new_health_factor >= protocol_state.min_collateral_ratio,
        ErrorCode::InsufficientCollateralRatio
    );

    // Mint stablecoins to user
    let seeds = &[
        PROTOCOL_SEED,
        &[protocol_state.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.stablecoin_mint.to_account_info(),
        to: ctx.accounts.user_stablecoin_account.to_account_info(),
        authority: protocol_state.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token::mint_to(cpi_ctx, amount)?;

    // Update user position
    user_position.stablecoin_minted = new_stablecoin_amount;
    user_position.last_update_timestamp = Clock::get()?.unix_timestamp;

    // Update protocol state
    protocol_state.total_stablecoin_supply = protocol_state.total_stablecoin_supply
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    
    protocol_state.collateral_ratio = protocol_state.calculate_collateral_ratio();

    msg!("Minted {} stablecoins to user", amount);
    Ok(())
}
