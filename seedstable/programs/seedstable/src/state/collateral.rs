use anchor_lang::prelude::*;

#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub protocol_state: Pubkey,
    pub usdc_deposited: u64,
    pub stablecoin_minted: u64,
    pub last_update_timestamp: i64,
    pub bump: u8,
}

impl UserPosition {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        32 + // protocol_state
        8 + // usdc_deposited
        8 + // stablecoin_minted
        8 + // last_update_timestamp
        1; // bump
}
