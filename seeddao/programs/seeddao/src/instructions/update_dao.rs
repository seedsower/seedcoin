use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct UpdateDao<'info> {
    #[account(
        mut,
        seeds = [b"dao_state"],
        bump = dao_state.bump,
        constraint = dao_state.authority == authority.key()
    )]
    pub dao_state: Account<'info, DaoState>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateDao>,
    new_authority: Option<Pubkey>,
    new_min_proposal_threshold: Option<u64>,
    new_voting_period: Option<i64>,
    new_execution_delay: Option<i64>,
    new_quorum_threshold: Option<u64>,
    pause_state: Option<bool>,
) -> Result<()> {
    let dao_state = &mut ctx.accounts.dao_state;

    // Update parameters if provided
    if let Some(authority) = new_authority {
        dao_state.authority = authority;
        msg!("Updated authority to: {}", authority);
    }

    if let Some(threshold) = new_min_proposal_threshold {
        dao_state.min_proposal_threshold = threshold;
        msg!("Updated min proposal threshold to: {}", threshold);
    }

    if let Some(period) = new_voting_period {
        require!(period > 0, ErrorCode::InvalidVotingPeriod);
        dao_state.voting_period = period;
        msg!("Updated voting period to: {} seconds", period);
    }

    if let Some(delay) = new_execution_delay {
        require!(delay >= 0, ErrorCode::InvalidExecutionDelay);
        dao_state.execution_delay = delay;
        msg!("Updated execution delay to: {} seconds", delay);
    }

    if let Some(quorum) = new_quorum_threshold {
        dao_state.quorum_threshold = quorum;
        msg!("Updated quorum threshold to: {}", quorum);
    }

    if let Some(paused) = pause_state {
        dao_state.is_paused = paused;
        msg!("DAO pause state: {}", if paused { "PAUSED" } else { "ACTIVE" });
    }

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid voting period")]
    InvalidVotingPeriod,
    #[msg("Invalid execution delay")]
    InvalidExecutionDelay,
}
