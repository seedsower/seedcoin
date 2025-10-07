use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::*;

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [b"dao_state"],
        bump = dao_state.bump
    )]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [b"proposal", dao_state.key().as_ref(), proposal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        constraint = proposer_sdao_account.mint == dao_state.sdao_mint,
        constraint = proposer_sdao_account.owner == proposer.key(),
        constraint = proposer_sdao_account.amount >= dao_state.min_proposal_threshold
    )]
    pub proposer_sdao_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<CreateProposal>,
    proposal_id: u64,
    title: String,
    description: String,
    proposal_type: ProposalType,
) -> Result<()> {
    require!(!ctx.accounts.dao_state.is_paused, ErrorCode::DaoPaused);
    require!(title.len() <= 64, ErrorCode::TitleTooLong);
    require!(description.len() <= 256, ErrorCode::DescriptionTooLong);

    let dao_state = &mut ctx.accounts.dao_state;
    let proposal = &mut ctx.accounts.proposal;
    let now = Clock::get()?.unix_timestamp;

    // Initialize proposal
    proposal.id = proposal_id;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.dao_state = dao_state.key();
    proposal.title = title;
    proposal.description = description;
    proposal.proposal_type = proposal_type;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.total_votes = 0;
    proposal.start_time = now;
    proposal.end_time = now + dao_state.voting_period;
    proposal.execution_time = now + dao_state.voting_period + dao_state.execution_delay;
    proposal.status = ProposalStatus::Active;
    proposal.executed = false;
    proposal.bump = ctx.bumps.proposal;

    // Increment proposal count
    dao_state.proposal_count += 1;

    msg!("Proposal {} created by {}", proposal_id, ctx.accounts.proposer.key());
    msg!("Voting ends at: {}", proposal.end_time);

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("DAO is currently paused")]
    DaoPaused,
    #[msg("Title is too long (max 64 characters)")]
    TitleTooLong,
    #[msg("Description is too long (max 256 characters)")]
    DescriptionTooLong,
}
