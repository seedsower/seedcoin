use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
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
        seeds = [COLLATERAL_POOL_SEED, collateral_vault.mint.as_ref()],
        bump = collateral_pool.bump
    )]
    pub collateral_pool: Account<'info, CollateralPool>,

    #[account(
        mut,
        address = collateral_pool.vault
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = collateral_vault.mint,
        token::authority = user
    )]
    pub user_collateral_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawCollateral>, amount: u64) -> Result<()> {
    let user_position = &mut ctx.accounts.user_position;
    let collateral_pool = &mut ctx.accounts.collateral_pool;
    let protocol_state = &mut ctx.accounts.protocol_state;

    // Find user's position in this collateral pool and validate amount
    let pool_key = collateral_pool.key();
    let (pool_amount, pool_value_usd) = user_position.collateral_pool
        .as_ref()
        .filter(|pos| pos.pool == pool_key)
        .map(|pos| (pos.amount, pos.value_usd))
        .ok_or(ErrorCode::InsufficientFunds)?;

    require!(
        pool_amount >= amount,
        ErrorCode::InsufficientFunds
    );

    // Calculate remaining collateral value after withdrawal
    let withdrawal_value = (pool_value_usd * amount) / pool_amount;
    let remaining_collateral_value = pool_value_usd.saturating_sub(withdrawal_value);

    // Check if withdrawal would maintain minimum collateral ratio
    let stablecoin_minted = user_position.stablecoin_minted;
    if stablecoin_minted > 0 {
        let new_health_factor = user_position.calculate_health_factor(remaining_collateral_value);
        require!(
            new_health_factor >= protocol_state.min_collateral_ratio,
            ErrorCode::InsufficientCollateralRatio
        );
    }

    // Transfer collateral from vault to user
    let seeds = &[
        PROTOCOL_SEED,
        &[protocol_state.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.collateral_vault.to_account_info(),
        to: ctx.accounts.user_collateral_account.to_account_info(),
        authority: protocol_state.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token::transfer(cpi_ctx, amount)?;

    // Update pool position
    if let Some(pool_position) = &mut user_position.collateral_pool {
        pool_position.amount = pool_position.amount
            .checked_sub(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        pool_position.value_usd = pool_position.value_usd
            .checked_sub(withdrawal_value)
            .ok_or(ErrorCode::MathOverflow)?;
    }

    // Update user position
    user_position.collateral_deposited = user_position.collateral_deposited
        .checked_sub(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    user_position.last_update_timestamp = Clock::get()?.unix_timestamp;

    // Update collateral pool
    collateral_pool.total_deposited = collateral_pool.total_deposited
        .checked_sub(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    collateral_pool.total_value_usd = collateral_pool.total_value_usd
        .checked_sub(withdrawal_value)
        .ok_or(ErrorCode::MathOverflow)?;

    // Update protocol state
    protocol_state.total_collateral_value = protocol_state.total_collateral_value
        .checked_sub(withdrawal_value)
        .ok_or(ErrorCode::MathOverflow)?;
    protocol_state.collateral_ratio = protocol_state.calculate_collateral_ratio();

    msg!("Withdrew {} collateral tokens worth ${} USD", amount, withdrawal_value);
    Ok(())
}
