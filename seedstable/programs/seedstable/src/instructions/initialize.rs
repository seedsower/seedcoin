use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = ProtocolState::LEN,
        seeds = [PROTOCOL_SEED],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        init,
        payer = authority,
        mint::decimals = USD_DECIMALS,
        mint::authority = protocol_state,
    )]
    pub stablecoin_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = stablecoin_mint,
        token::authority = protocol_state,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Initialize>, bump: u8) -> Result<()> {
    let protocol_state = &mut ctx.accounts.protocol_state;
    
    protocol_state.authority = ctx.accounts.authority.key();
    protocol_state.stablecoin_mint = ctx.accounts.stablecoin_mint.key();
    protocol_state.treasury = ctx.accounts.treasury.key();
    protocol_state.total_collateral_value = 0;
    protocol_state.total_stablecoin_supply = 0;
    protocol_state.collateral_ratio = u64::MAX;
    protocol_state.min_collateral_ratio = MIN_COLLATERAL_RATIO;
    protocol_state.peg_deviation_threshold = PEG_DEVIATION_THRESHOLD;
    protocol_state.is_paused = false;
    protocol_state.last_rebalance_timestamp = Clock::get()?.unix_timestamp;
    protocol_state.bump = bump;

    msg!("SeedStable protocol initialized successfully");
    Ok(())
}
