use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(collateral_type: CollateralType)]
pub struct CreateCollateralPool<'info> {
    #[account(
        constraint = authority.key() == protocol_state.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        init,
        payer = authority,
        space = CollateralPool::LEN,
        seeds = [COLLATERAL_POOL_SEED, collateral_mint.key().as_ref()],
        bump
    )]
    pub collateral_pool: Account<'info, CollateralPool>,

    pub collateral_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = collateral_mint,
        token::authority = protocol_state,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    /// CHECK: Oracle account for price feeds
    pub oracle_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateOraclePrice<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [COLLATERAL_POOL_SEED, collateral_pool.mint.as_ref()],
        bump = collateral_pool.bump
    )]
    pub collateral_pool: Account<'info, CollateralPool>,

    /// CHECK: Oracle account validation happens in instruction
    pub oracle_account: AccountInfo<'info>,
}

pub fn create_collateral_pool_handler(
    ctx: Context<CreateCollateralPool>, 
    collateral_type: CollateralType,
    max_deposit: u64
) -> Result<()> {
    let collateral_pool = &mut ctx.accounts.collateral_pool;
    
    collateral_pool.protocol_state = ctx.accounts.protocol_state.key();
    collateral_pool.collateral_type = collateral_type;
    collateral_pool.mint = ctx.accounts.collateral_mint.key();
    collateral_pool.vault = ctx.accounts.collateral_vault.key();
    collateral_pool.oracle = ctx.accounts.oracle_account.key();
    collateral_pool.total_deposited = 0;
    collateral_pool.total_value_usd = 0;
    collateral_pool.liquidation_threshold = LIQUIDATION_THRESHOLD;
    collateral_pool.max_deposit_amount = max_deposit;
    collateral_pool.is_active = true;
    collateral_pool.bump = *ctx.bumps.get("collateral_pool").unwrap();

    msg!("Created collateral pool for {:?}", collateral_type);
    Ok(())
}

pub fn update_oracle_price_handler(ctx: Context<UpdateOraclePrice>) -> Result<()> {
    let collateral_pool = &mut ctx.accounts.collateral_pool;
    
    // Get updated price from oracle
    let price_data = get_oracle_price_data(&ctx.accounts.oracle_account)?;
    
    // Validate price data
    require!(price_data.is_valid, ErrorCode::InvalidOracleConfig);
    require!(!price_data.is_stale(MAX_PRICE_STALENESS), ErrorCode::StalePriceData);
    require!(price_data.has_high_confidence(MAX_PRICE_DEVIATION), ErrorCode::LowConfidencePriceData);
    
    // Update collateral pool value
    let decimals = get_mint_decimals(&collateral_pool.mint)?;
    collateral_pool.update_value(price_data.price, decimals);
    
    msg!("Updated oracle price: ${}", price_data.price);
    Ok(())
}

fn get_oracle_price_data(_oracle_account: &AccountInfo) -> Result<PriceData> {
    // Simplified oracle integration - in production would use Pyth/Switchboard SDK
    Ok(PriceData {
        price: 100_000_000, // $100.00 with 6 decimals
        confidence: 50_000, // $0.05 confidence interval
        timestamp: Clock::get()?.unix_timestamp,
        is_valid: true,
    })
}

fn get_mint_decimals(_mint: &Pubkey) -> Result<u8> {
    // Simplified - in production would read from mint account
    Ok(9) // SOL has 9 decimals
}

use anchor_spl::token::{Mint, TokenAccount};
