use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Protocol is currently paused")]
    ProtocolPaused,
    #[msg("Insufficient collateral ratio")]
    InsufficientCollateralRatio,
    #[msg("Collateral pool is not active")]
    CollateralPoolInactive,
    #[msg("Oracle price is stale")]
    StalePriceData,
    #[msg("Oracle price has low confidence")]
    LowConfidencePriceData,
    #[msg("Peg deviation exceeds threshold")]
    PegDeviationExceeded,
    #[msg("Position is liquidatable")]
    PositionLiquidatable,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid collateral type")]
    InvalidCollateralType,
    #[msg("Deposit amount exceeds maximum")]
    DepositExceedsMaximum,
    #[msg("Insufficient funds for operation")]
    InsufficientFunds,
    #[msg("Rebalancing not required")]
    RebalancingNotRequired,
    #[msg("Invalid oracle configuration")]
    InvalidOracleConfig,
    #[msg("Math overflow")]
    MathOverflow,
}
