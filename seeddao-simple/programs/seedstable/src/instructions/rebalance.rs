use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Rebalance<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump,
        constraint = !protocol_state.is_paused @ ErrorCode::ProtocolPaused
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        mut,
        address = protocol_state.stablecoin_mint
    )]
    pub stablecoin_mint: Account<'info, Mint>,

    #[account(
        mut,
        address = protocol_state.treasury
    )]
    pub treasury: Account<'info, TokenAccount>,

    /// CHECK: Oracle account for USD price feed
    pub usd_oracle: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Rebalance>) -> Result<()> {
    let protocol_state = &mut ctx.accounts.protocol_state;
    
    // Get current stablecoin price from oracle
    let current_price = get_stablecoin_price(&ctx.accounts.usd_oracle)?;
    let target_price = 1_000_000; // $1.00 with 6 decimals
    
    // Check if rebalancing is needed
    require!(
        protocol_state.needs_rebalancing(current_price, target_price),
        ErrorCode::RebalancingNotRequired
    );

    let deviation = if current_price > target_price {
        ((current_price - target_price) * 10000) / target_price
    } else {
        ((target_price - current_price) * 10000) / target_price
    };

    msg!("Rebalancing triggered - price deviation: {} basis points", deviation);

    // Calculate rebalancing amount based on deviation
    let rebalance_amount = calculate_rebalance_amount(
        protocol_state.total_stablecoin_supply,
        deviation
    )?;

    let seeds = &[
        PROTOCOL_SEED,
        &[protocol_state.bump],
    ];
    let signer = &[&seeds[..]];

    if current_price > target_price {
        // Price too high - mint more stablecoins to treasury to increase supply
        let cpi_accounts = MintTo {
            mint: ctx.accounts.stablecoin_mint.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
            authority: protocol_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::mint_to(cpi_ctx, rebalance_amount)?;
        
        protocol_state.total_stablecoin_supply = protocol_state.total_stablecoin_supply
            .checked_add(rebalance_amount)
            .ok_or(ErrorCode::MathOverflow)?;
            
        msg!("Minted {} stablecoins to reduce price", rebalance_amount);
    } else {
        // Price too low - burn stablecoins from treasury to decrease supply
        require!(
            ctx.accounts.treasury.amount >= rebalance_amount,
            ErrorCode::InsufficientFunds
        );

        let cpi_accounts = Burn {
            mint: ctx.accounts.stablecoin_mint.to_account_info(),
            from: ctx.accounts.treasury.to_account_info(),
            authority: protocol_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::burn(cpi_ctx, rebalance_amount)?;
        
        protocol_state.total_stablecoin_supply = protocol_state.total_stablecoin_supply
            .checked_sub(rebalance_amount)
            .ok_or(ErrorCode::MathOverflow)?;
            
        msg!("Burned {} stablecoins to increase price", rebalance_amount);
    }

    // Update protocol state
    protocol_state.last_rebalance_timestamp = Clock::get()?.unix_timestamp;
    protocol_state.collateral_ratio = protocol_state.calculate_collateral_ratio();

    Ok(())
}

fn get_stablecoin_price(_oracle: &AccountInfo) -> Result<u64> {
    // Simplified oracle integration - in production would use Pyth/Switchboard
    // For demo purposes, simulate price fluctuation
    Ok(1_020_000) // $1.02 - slightly above peg
}

fn calculate_rebalance_amount(total_supply: u64, deviation_bps: u64) -> Result<u64> {
    // Calculate rebalance amount as percentage of total supply based on deviation
    let rebalance_percentage = std::cmp::min(deviation_bps / 10, 1000); // Max 10% rebalance
    
    total_supply
        .checked_mul(rebalance_percentage)
        .and_then(|x| x.checked_div(10000))
        .ok_or(ErrorCode::MathOverflow)?
}
