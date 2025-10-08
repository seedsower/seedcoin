use anchor_lang::prelude::*;

#[account]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub stablecoin_mint: Pubkey,
    pub treasury: Pubkey,
    pub total_collateral_value: u64,
    pub total_stablecoin_supply: u64,
    pub collateral_ratio: u64, // Basis points (150% = 15000)
    pub min_collateral_ratio: u64, // Minimum 150% = 15000 basis points
    pub peg_deviation_threshold: u64, // 2% = 200 basis points
    pub is_paused: bool,
    pub last_rebalance_timestamp: i64,
    pub bump: u8,
}

impl ProtocolState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // stablecoin_mint
        32 + // treasury
        8 + // total_collateral_value
        8 + // total_stablecoin_supply
        8 + // collateral_ratio
        8 + // min_collateral_ratio
        8 + // peg_deviation_threshold
        1 + // is_paused
        8 + // last_rebalance_timestamp
        1; // bump

    pub fn calculate_collateral_ratio(&self) -> u64 {
        if self.total_stablecoin_supply == 0 {
            return u64::MAX;
        }
        (self.total_collateral_value * 10000) / self.total_stablecoin_supply
    }

    pub fn is_undercollateralized(&self) -> bool {
        self.calculate_collateral_ratio() < self.min_collateral_ratio
    }

    pub fn needs_rebalancing(&self, current_price: u64, target_price: u64) -> bool {
        let deviation = if current_price > target_price {
            ((current_price - target_price) * 10000) / target_price
        } else {
            ((target_price - current_price) * 10000) / target_price
        };
        deviation > self.peg_deviation_threshold
    }
}
