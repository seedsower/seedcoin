use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(
        seeds = [b"dao_state"],
        bump = dao_state.bump
    )]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        mut,
        seeds = [b"proposal", dao_state.key().as_ref(), proposal.id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        seeds = [b"treasury", dao_state.key().as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub executor: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ExecuteProposal>) -> Result<()> {
    let dao_state = &ctx.accounts.dao_state;
    let proposal = &mut ctx.accounts.proposal;

    // Check if proposal can be executed
    require!(proposal.can_execute(), ErrorCode::CannotExecute);
    require!(proposal.has_quorum(dao_state.quorum_threshold), ErrorCode::NoQuorum);
    require!(proposal.is_successful(), ErrorCode::ProposalFailed);

    // Execute based on proposal type
    match &proposal.proposal_type {
        ProposalType::Treasury { amount, recipient } => {
            // Treasury transfer logic would go here
            // This is a simplified version - in practice you'd need more accounts
            msg!("Executing treasury transfer of {} to {}", amount, recipient);
        },
        ProposalType::Parameter { parameter, value } => {
            // Parameter update logic would go here
            msg!("Updating parameter {} to {}", parameter, value);
        },
        ProposalType::Upgrade { new_program } => {
            // Program upgrade logic would go here
            msg!("Upgrading to program {}", new_program);
        },
        ProposalType::Text { description: _ } => {
            // Text proposals don't require execution
            msg!("Text proposal executed (no action required)");
        },
    }

    // Mark proposal as executed
    proposal.executed = true;
    proposal.status = ProposalStatus::Executed;

    msg!("Proposal {} executed successfully", proposal.id);

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Proposal cannot be executed")]
    CannotExecute,
    #[msg("Proposal does not have quorum")]
    NoQuorum,
    #[msg("Proposal failed (more against than for votes)")]
    ProposalFailed,
}
