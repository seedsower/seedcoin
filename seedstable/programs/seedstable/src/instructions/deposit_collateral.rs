use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(collateral_type: CollateralType)]
pub struct DepositCollateral<'info> {
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
        init_if_needed,
        payer = user,
        space = UserPosition::LEN,
        seeds = [USER_POSITION_SEED, user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(
        mut,
        seeds = [COLLATERAL_POOL_SEED, collateral_mint.key().as_ref()],
        bump = collateral_pool.bump,
        constraint = collateral_pool.is_active @ ErrorCode::CollateralPoolInactive,
        constraint = collateral_pool.collateral_type == collateral_type @ ErrorCode::InvalidCollateralType
    )]
    pub collateral_pool: Account<'info, CollateralPool>,

    pub collateral_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = collateral_pool.vault
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = user
    )]
    pub user_collateral_account: Account<'info, TokenAccount>,

    /// CHECK: Oracle account validation happens in instruction
    pub oracle_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<DepositCollateral>, collateral_type: CollateralType, amount: u64) -> Result<()> {
    let collateral_pool = &mut ctx.accounts.collateral_pool;
    let user_position = &mut ctx.accounts.user_position;
    let protocol_state = &mut ctx.accounts.protocol_state;

    // Check deposit limits
    require!(
        collateral_pool.can_accept_deposit(amount),
        ErrorCode::DepositExceedsMaximum
    );

    require!(
        ctx.accounts.user_collateral_account.amount >= amount,
        ErrorCode::InsufficientFunds
    );

    // Get price from oracle (simplified - would need actual oracle integration)
    let price = get_oracle_price(&ctx.accounts.oracle_account, collateral_type)?;
    
    // Transfer collateral from user to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_collateral_account.to_account_info(),
        to: ctx.accounts.collateral_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;

    // Calculate USD value
    let decimals = ctx.accounts.collateral_mint.decimals;
    let usd_value = calculate_usd_value(amount, price, decimals)?;

    // Update collateral pool
    collateral_pool.total_deposited = collateral_pool.total_deposited
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    collateral_pool.total_value_usd = collateral_pool.total_value_usd
        .checked_add(usd_value)
        .ok_or(ErrorCode::MathOverflow)?;

    // Initialize user position if needed
    if user_position.owner == Pubkey::default() {
        user_position.owner = ctx.accounts.user.key();
        user_position.protocol_state = protocol_state.key();
        user_position.collateral_deposited = 0;
        user_position.stablecoin_minted = 0;
        user_position.collateral_pool = None;
        user_position.bump = ctx.bumps.user_position;
    }

    // Update user position
    let pool_position = CollateralPoolPosition {
        pool: collateral_pool.key(),
        amount,
        value_usd: usd_value,
    };

    // Update or set collateral pool position
    if let Some(existing_pos) = &mut user_position.collateral_pool {
        if existing_pos.pool == collateral_pool.key() {
            existing_pos.amount = existing_pos.amount
                .checked_add(amount)
                .ok_or(ErrorCode::MathOverflow)?;
            existing_pos.value_usd = existing_pos.value_usd
                .checked_add(usd_value)
                .ok_or(ErrorCode::MathOverflow)?;
        } else {
            // Replace with new pool position
            user_position.collateral_pool = Some(pool_position);
        }
    } else {
        user_position.collateral_pool = Some(pool_position);
    }

    user_position.collateral_deposited = user_position.collateral_deposited
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;
    user_position.last_update_timestamp = Clock::get()?.unix_timestamp;

    // Update protocol state
    protocol_state.total_collateral_value = protocol_state.total_collateral_value
        .checked_add(usd_value)
        .ok_or(ErrorCode::MathOverflow)?;
    protocol_state.collateral_ratio = protocol_state.calculate_collateral_ratio();

    msg!("Deposited {} collateral tokens worth ${} USD", amount, usd_value);
    Ok(())
}

fn get_oracle_price(_oracle_account: &AccountInfo, collateral_type: CollateralType) -> Result<u64> {
    // Simplified oracle price - in production would integrate with Pyth/Switchboard
    match collateral_type {
        CollateralType::USDC => Ok(1_000_000), // $1.00 with 6 decimals
        CollateralType::SOL => Ok(100_000_000), // $100.00 with 6 decimals
        CollateralType::TokenizedSeeds => Ok(50_000_000), // $50.00 with 6 decimals
    }
}

fn calculate_usd_value(amount: u64, price: u64, decimals: u8) -> Result<u64> {
    let amount_scaled = amount
        .checked_div(10_u64.pow(decimals as u32))
        .ok_or(ErrorCode::MathOverflow)?;
    
    Ok(amount_scaled
        .checked_mul(price)
        .ok_or(ErrorCode::MathOverflow)?)
}
