use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, Burn};
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump,
        constraint = !protocol_state.is_paused @ ErrorCode::ProtocolPaused
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        mut,
        seeds = [USER_POSITION_SEED, position_owner.key().as_ref()],
        bump = user_position.bump
    )]
    pub user_position: Account<'info, UserPosition>,

    /// CHECK: Owner of the position being liquidated
    pub position_owner: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [COLLATERAL_POOL_SEED, collateral_vault.mint.as_ref()],
        bump = collateral_pool.bump
    )]
    pub collateral_pool: Account<'info, CollateralPool>,

    #[account(
        mut,
        address = protocol_state.stablecoin_mint
    )]
    pub stablecoin_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = collateral_pool.vault
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = collateral_vault.mint,
        token::authority = liquidator
    )]
    pub liquidator_collateral_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = protocol_state.stablecoin_mint,
        token::authority = liquidator
    )]
    pub liquidator_stablecoin_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Liquidate>, collateral_amount: u64) -> Result<()> {
    let user_position = &mut ctx.accounts.user_position;
    let collateral_pool = &mut ctx.accounts.collateral_pool;
    let protocol_state = &mut ctx.accounts.protocol_state;

    // Calculate total collateral value
    let _total_collateral_value: u64 = user_position.collateral_pool
        .as_ref()
        .map(|pos| pos.value_usd)
        .unwrap_or(0);

    // Check if position is liquidatable
    require!(
        user_position.is_liquidatable(LIQUIDATION_THRESHOLD),
        ErrorCode::PositionLiquidatable
    );

    // Find the collateral pool position
    let pool_key = collateral_pool.key();
    let pool_position = user_position.collateral_pool
        .as_mut()
        .filter(|pos| pos.pool == pool_key)
        .ok_or(ErrorCode::InsufficientFunds)?;

    require!(
        pool_position.amount >= collateral_amount,
        ErrorCode::InsufficientFunds
    );

    // Calculate liquidation values
    let collateral_value = (pool_position.value_usd * collateral_amount) / pool_position.amount;
    let liquidation_bonus = collateral_value / 20; // 5% bonus
    let stablecoin_to_burn = collateral_value - liquidation_bonus;

    require!(
        ctx.accounts.liquidator_stablecoin_account.amount >= stablecoin_to_burn,
        ErrorCode::InsufficientFunds
    );

    // Burn stablecoins from liquidator
    let cpi_accounts = Burn {
        mint: ctx.accounts.stablecoin_mint.to_account_info(),
        from: ctx.accounts.liquidator_stablecoin_account.to_account_info(),
        authority: ctx.accounts.liquidator.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::burn(cpi_ctx, stablecoin_to_burn)?;

    // Transfer collateral to liquidator
    let seeds = &[
        PROTOCOL_SEED,
        &[protocol_state.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.collateral_vault.to_account_info(),
        to: ctx.accounts.liquidator_collateral_account.to_account_info(),
        authority: protocol_state.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token::transfer(cpi_ctx, collateral_amount)?;

    // Update user position
    pool_position.amount = pool_position.amount
        .checked_sub(collateral_amount)
        .ok_or(ErrorCode::MathOverflow)?;
    pool_position.value_usd = pool_position.value_usd
        .checked_sub(collateral_value)
        .ok_or(ErrorCode::MathOverflow)?;

    user_position.stablecoin_minted = user_position.stablecoin_minted
        .checked_sub(stablecoin_to_burn)
        .ok_or(ErrorCode::MathOverflow)?;
    user_position.last_update_timestamp = Clock::get()?.unix_timestamp;

    // Update collateral pool
    collateral_pool.total_deposited = collateral_pool.total_deposited
        .checked_sub(collateral_amount)
        .ok_or(ErrorCode::MathOverflow)?;
    collateral_pool.total_value_usd = collateral_pool.total_value_usd
        .checked_sub(collateral_value)
        .ok_or(ErrorCode::MathOverflow)?;

    // Update protocol state
    protocol_state.total_collateral_value = protocol_state.total_collateral_value
        .checked_sub(collateral_value)
        .ok_or(ErrorCode::MathOverflow)?;
    protocol_state.total_stablecoin_supply = protocol_state.total_stablecoin_supply
        .checked_sub(stablecoin_to_burn)
        .ok_or(ErrorCode::MathOverflow)?;
    protocol_state.collateral_ratio = protocol_state.calculate_collateral_ratio();

    msg!("Liquidated {} collateral for {} stablecoins with {} bonus", 
         collateral_amount, stablecoin_to_burn, liquidation_bonus);
    Ok(())
}
