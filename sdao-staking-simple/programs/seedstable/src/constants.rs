use anchor_lang::prelude::*;

// Protocol seeds
pub const PROTOCOL_SEED: &[u8] = b"protocol";
pub const COLLATERAL_POOL_SEED: &[u8] = b"collateral_pool";
pub const USER_POSITION_SEED: &[u8] = b"user_position";
pub const ORACLE_CONFIG_SEED: &[u8] = b"oracle_config";
pub const TREASURY_SEED: &[u8] = b"treasury";

// Protocol constants
pub const MIN_COLLATERAL_RATIO: u64 = 15000; // 150% in basis points
pub const PEG_DEVIATION_THRESHOLD: u64 = 200; // 2% in basis points
pub const LIQUIDATION_THRESHOLD: u64 = 12000; // 120% in basis points
pub const BASIS_POINTS: u64 = 10000;
pub const USD_DECIMALS: u8 = 6;

// Oracle constants
pub const MAX_PRICE_STALENESS: i64 = 300; // 5 minutes
pub const MAX_PRICE_DEVIATION: u64 = 500; // 5% in basis points

// Collateral limits
pub const MAX_USDC_DEPOSIT: u64 = 1_000_000 * 1_000_000; // 1M USDC
pub const MAX_SOL_DEPOSIT: u64 = 10_000 * 1_000_000_000; // 10K SOL
pub const MAX_SEEDS_DEPOSIT: u64 = 100_000 * 1_000_000; // 100K Seeds
