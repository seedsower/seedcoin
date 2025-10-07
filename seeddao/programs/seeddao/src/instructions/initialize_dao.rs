use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeDao<'info> {
    #[account(
        init,
        payer = authority,
        space = DaoState::LEN,
        seeds = [b"dao_state"],
        bump
    )]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        init,
        payer = authority,
        space = Treasury::LEN,
        seeds = [b"treasury", dao_state.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = dao_state,
        seeds = [b"sdao_mint"],
        bump
    )]
    pub sdao_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = usdc_mint,
        token::authority = treasury,
        seeds = [b"usdc_vault", treasury.key().as_ref()],
        bump
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = seeds_mint,
        token::authority = treasury,
        seeds = [b"seeds_vault", treasury.key().as_ref()],
        bump
    )]
    pub seeds_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub seeds_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeDao>,
    total_supply: u64,
    min_proposal_threshold: u64,
    voting_period: i64,
    execution_delay: i64,
    quorum_threshold: u64,
) -> Result<()> {
    let dao_state = &mut ctx.accounts.dao_state;
    let treasury = &mut ctx.accounts.treasury;

    // Initialize DAO state
    dao_state.authority = ctx.accounts.authority.key();
    dao_state.sdao_mint = ctx.accounts.sdao_mint.key();
    dao_state.treasury = ctx.accounts.treasury.key();
    dao_state.total_supply = total_supply;
    dao_state.total_staked = 0;
    dao_state.proposal_count = 0;
    dao_state.min_proposal_threshold = min_proposal_threshold;
    dao_state.voting_period = voting_period;
    dao_state.execution_delay = execution_delay;
    dao_state.quorum_threshold = quorum_threshold;
    dao_state.is_paused = false;
    dao_state.bump = ctx.bumps.dao_state;

    // Initialize treasury
    treasury.dao_state = dao_state.key();
    treasury.usdc_vault = ctx.accounts.usdc_vault.key();
    treasury.seeds_vault = ctx.accounts.seeds_vault.key();
    treasury.total_value = 0;
    treasury.bump = ctx.bumps.treasury;

    msg!("SeedDAO initialized with total supply: {}", total_supply);
    msg!("Min proposal threshold: {}", min_proposal_threshold);
    msg!("Voting period: {} seconds", voting_period);

    Ok(())
}
