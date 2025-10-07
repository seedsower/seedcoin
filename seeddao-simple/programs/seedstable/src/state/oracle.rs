use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OracleType {
    Pyth,
    Switchboard,
}

#[account]
pub struct OracleConfig {
    pub oracle_type: OracleType,
    pub price_feed: Pubkey,
    pub max_staleness: i64, // Maximum age of price data in seconds
    pub max_deviation: u64, // Maximum allowed price deviation in basis points
    pub decimals: u8,
    pub is_active: bool,
    pub bump: u8,
}

impl OracleConfig {
    pub const LEN: usize = 8 + // discriminator
        1 + // oracle_type
        32 + // price_feed
        8 + // max_staleness
        8 + // max_deviation
        1 + // decimals
        1 + // is_active
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PriceData {
    pub price: u64,
    pub confidence: u64,
    pub timestamp: i64,
    pub is_valid: bool,
}

impl PriceData {
    pub fn is_stale(&self, max_staleness: i64) -> bool {
        let current_time = Clock::get().unwrap().unix_timestamp;
        (current_time - self.timestamp) > max_staleness
    }

    pub fn has_high_confidence(&self, max_deviation: u64) -> bool {
        if self.price == 0 {
            return false;
        }
        let deviation_bps = (self.confidence * 10000) / self.price;
        deviation_bps <= max_deviation
    }
}
