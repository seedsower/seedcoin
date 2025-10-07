use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use crate::state::*;

#[derive(Accounts)]
pub struct VoteProposal<'info> {
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
        init_if_needed,
        payer = voter,
        space = Vote::LEN,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(
        seeds = [b"stake", dao_state.key().as_ref(), voter.key().as_ref()],
        bump = stake_account.bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        constraint = voter_sdao_account.mint == dao_state.sdao_mint,
        constraint = voter_sdao_account.owner == voter.key()
    )]
    pub voter_sdao_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<VoteProposal>,
    choice: VoteChoice,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let vote = &mut ctx.accounts.vote;
    let stake_account = &ctx.accounts.stake_account;
    let voter_balance = ctx.accounts.voter_sdao_account.amount;

    require!(proposal.is_active(), ErrorCode::ProposalNotActive);
    require!(voter_balance > 0 || stake_account.staked_amount > 0, ErrorCode::NoVotingPower);

    // Calculate voting power (wallet balance + staked amount + time bonus)
    let voting_power = voter_balance + stake_account.calculate_voting_power();
    
    // If this is a vote update, subtract previous vote
    if vote.voting_power > 0 {
        match vote.choice {
            VoteChoice::For => proposal.votes_for -= vote.voting_power,
            VoteChoice::Against => proposal.votes_against -= vote.voting_power,
            VoteChoice::Abstain => {}, // Abstain doesn't affect for/against counts
        }
        proposal.total_votes -= vote.voting_power;
    }

    // Record new vote
    vote.voter = ctx.accounts.voter.key();
    vote.proposal = proposal.key();
    vote.choice = choice.clone();
    vote.voting_power = voting_power;
    vote.timestamp = Clock::get()?.unix_timestamp;
    vote.bump = ctx.bumps.vote;

    // Update proposal vote counts
    match choice {
        VoteChoice::For => proposal.votes_for += voting_power,
        VoteChoice::Against => proposal.votes_against += voting_power,
        VoteChoice::Abstain => {}, // Abstain doesn't affect for/against counts
    }
    proposal.total_votes += voting_power;

    msg!("Vote recorded: {} with power {}", 
         match choice {
             VoteChoice::For => "FOR",
             VoteChoice::Against => "AGAINST", 
             VoteChoice::Abstain => "ABSTAIN",
         },
         voting_power
    );

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("No voting power (no SDAO tokens or stake)")]
    NoVotingPower,
}
