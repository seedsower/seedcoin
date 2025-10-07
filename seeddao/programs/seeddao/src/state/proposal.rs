use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Active,
    Succeeded,
    Defeated,
    Executed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ProposalType {
    Treasury { amount: u64, recipient: Pubkey },
    Parameter { parameter: String, value: u64 },
    Upgrade { new_program: Pubkey },
    Text { description: String },
}

#[account]
pub struct Proposal {
    pub id: u64,
    pub proposer: Pubkey,
    pub dao_state: Pubkey,
    pub title: String,
    pub description: String,
    pub proposal_type: ProposalType,
    pub votes_for: u64,
    pub votes_against: u64,
    pub total_votes: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub execution_time: i64,
    pub status: ProposalStatus,
    pub executed: bool,
    pub bump: u8,
}

impl Proposal {
    pub const LEN: usize = 8 + // discriminator
        8 + // id
        32 + // proposer
        32 + // dao_state
        64 + // title (max 64 chars)
        256 + // description (max 256 chars)
        128 + // proposal_type (variable, estimated)
        8 + // votes_for
        8 + // votes_against
        8 + // total_votes
        8 + // start_time
        8 + // end_time
        8 + // execution_time
        1 + // status
        1 + // executed
        1; // bump

    pub fn is_active(&self) -> bool {
        let now = Clock::get().unwrap().unix_timestamp;
        now >= self.start_time && now <= self.end_time && self.status == ProposalStatus::Active
    }

    pub fn can_execute(&self) -> bool {
        let now = Clock::get().unwrap().unix_timestamp;
        self.status == ProposalStatus::Succeeded && 
        now >= self.execution_time && 
        !self.executed
    }

    pub fn has_quorum(&self, quorum_threshold: u64) -> bool {
        self.total_votes >= quorum_threshold
    }

    pub fn is_successful(&self) -> bool {
        self.votes_for > self.votes_against
    }
}
