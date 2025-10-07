use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("imhPqBdTKnajpiWiKY88kssdWC4eiwHvaLfQNu5vEvR");

#[program]
pub mod seeddao {
    use super::*;

    /// Initialize the DAO with governance parameters
    pub fn initialize_dao(
        ctx: Context<InitializeDao>,
        total_supply: u64,
        min_proposal_threshold: u64,
        voting_period: i64,
        execution_delay: i64,
        quorum_threshold: u64,
    ) -> Result<()> {
        instructions::initialize_dao::handler(
            ctx,
            total_supply,
            min_proposal_threshold,
            voting_period,
            execution_delay,
            quorum_threshold,
        )
    }

    /// Create a new governance proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        title: String,
        description: String,
        proposal_type: ProposalType,
    ) -> Result<()> {
        instructions::create_proposal::handler(ctx, proposal_id, title, description, proposal_type)
    }

    /// Vote on a proposal
    pub fn vote_proposal(
        ctx: Context<VoteProposal>,
        choice: VoteChoice,
    ) -> Result<()> {
        instructions::vote_proposal::handler(ctx, choice)
    }

    /// Execute a successful proposal
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::execute_proposal::handler(ctx)
    }

    /// Stake SDAO tokens for voting power and rewards
    pub fn stake_tokens(
        ctx: Context<StakeTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::stake_tokens::handler(ctx, amount)
    }

    /// Unstake SDAO tokens
    pub fn unstake_tokens(
        ctx: Context<UnstakeTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::unstake_tokens::handler(ctx, amount)
    }

    /// Claim staking rewards
    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        apy_basis_points: u64,
    ) -> Result<()> {
        instructions::claim_rewards::handler(ctx, apy_basis_points)
    }

    /// Update DAO parameters (authority only)
    pub fn update_dao(
        ctx: Context<UpdateDao>,
        new_authority: Option<Pubkey>,
        new_min_proposal_threshold: Option<u64>,
        new_voting_period: Option<i64>,
        new_execution_delay: Option<i64>,
        new_quorum_threshold: Option<u64>,
        pause_state: Option<bool>,
    ) -> Result<()> {
        instructions::update_dao::handler(
            ctx,
            new_authority,
            new_min_proposal_threshold,
            new_voting_period,
            new_execution_delay,
            new_quorum_threshold,
            pause_state,
        )
    }
}
