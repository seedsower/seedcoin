use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteChoice {
    For,
    Against,
    Abstain,
}

#[account]
pub struct Vote {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub choice: VoteChoice,
    pub voting_power: u64,
    pub timestamp: i64,
    pub bump: u8,
}

impl Vote {
    pub const LEN: usize = 8 + // discriminator
        32 + // voter
        32 + // proposal
        1 + // choice
        8 + // voting_power
        8 + // timestamp
        1; // bump
}
