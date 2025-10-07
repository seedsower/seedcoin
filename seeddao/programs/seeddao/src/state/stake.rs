use anchor_lang::prelude::*;

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub dao_state: Pubkey,
    pub staked_amount: u64,
    pub rewards_earned: u64,
    pub last_claim_time: i64,
    pub stake_time: i64,
    pub voting_power: u64,
    pub bump: u8,
}

impl StakeAccount {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        32 + // dao_state
        8 + // staked_amount
        8 + // rewards_earned
        8 + // last_claim_time
        8 + // stake_time
        8 + // voting_power
        1; // bump

    pub fn calculate_voting_power(&self) -> u64 {
        // Voting power = staked amount + time bonus
        let now = Clock::get().unwrap().unix_timestamp;
        let stake_duration = now - self.stake_time;
        let time_bonus = (stake_duration as u64 / 86400) * self.staked_amount / 1000; // 0.1% per day
        self.staked_amount + time_bonus
    }

    pub fn calculate_rewards(&self, apy_basis_points: u64) -> u64 {
        let now = Clock::get().unwrap().unix_timestamp;
        let time_since_claim = now - self.last_claim_time;
        let annual_rewards = self.staked_amount * apy_basis_points / 10000;
        (annual_rewards * time_since_claim as u64) / (365 * 24 * 3600)
    }
}
