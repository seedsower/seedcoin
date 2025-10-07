use anchor_lang::prelude::*;

#[account]
pub struct DaoState {
    pub authority: Pubkey,
    pub sdao_mint: Pubkey,
    pub treasury: Pubkey,
    pub total_supply: u64,
    pub total_staked: u64,
    pub proposal_count: u64,
    pub min_proposal_threshold: u64, // Minimum SDAO needed to create proposal
    pub voting_period: i64, // Voting period in seconds
    pub execution_delay: i64, // Delay before execution in seconds
    pub quorum_threshold: u64, // Minimum votes needed for quorum
    pub is_paused: bool,
    pub bump: u8,
}

impl DaoState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // sdao_mint
        32 + // treasury
        8 + // total_supply
        8 + // total_staked
        8 + // proposal_count
        8 + // min_proposal_threshold
        8 + // voting_period
        8 + // execution_delay
        8 + // quorum_threshold
        1 + // is_paused
        1; // bump
}

#[account]
pub struct Treasury {
    pub dao_state: Pubkey,
    pub usdc_vault: Pubkey,
    pub seeds_vault: Pubkey,
    pub total_value: u64,
    pub bump: u8,
}

impl Treasury {
    pub const LEN: usize = 8 + // discriminator
        32 + // dao_state
        32 + // usdc_vault
        32 + // seeds_vault
        8 + // total_value
        1; // bump
}
