use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, MintTo};

declare_id!("AnwNEDsBwSHqy3CdKLv2kieXD5QLqNqdVxEB8zCfPrrC");

#[program]
pub mod sdao_staking {
    use super::*;

    /// Initialize the staking pool
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        apy_basis_points: u16, // e.g., 1850 for 18.5%
    ) -> Result<()> {
        let pool = &mut ctx.accounts.staking_pool;
        pool.authority = ctx.accounts.authority.key();
        pool.sdao_mint = ctx.accounts.sdao_mint.key();
        pool.vault = ctx.accounts.vault.key();
        pool.total_staked = 0;
        pool.apy_basis_points = apy_basis_points;
        pool.bump = ctx.bumps.staking_pool;
        
        msg!("Staking pool initialized with {}% APY", apy_basis_points as f64 / 100.0);
        Ok(())
    }

    /// Stake SDAO tokens
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        let pool = &mut ctx.accounts.staking_pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;

        // Initialize user stake account if first time
        if user_stake.amount == 0 {
            user_stake.owner = ctx.accounts.user.key();
            user_stake.pool = pool.key();
            user_stake.amount = 0;
            user_stake.reward_debt = 0;
            user_stake.last_stake_time = clock.unix_timestamp;
            user_stake.bump = ctx.bumps.user_stake;
        }

        // Calculate pending rewards before updating stake
        let pending_rewards = calculate_rewards(user_stake, pool.apy_basis_points, clock.unix_timestamp)?;
        
        // Transfer tokens to vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        // Update user stake
        user_stake.amount += amount;
        user_stake.reward_debt += pending_rewards;
        user_stake.last_stake_time = clock.unix_timestamp;

        // Update pool
        pool.total_staked += amount;

        msg!("Staked {} SDAO tokens. Total staked: {}", amount, user_stake.amount);
        Ok(())
    }

    /// Unstake SDAO tokens
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);
        
        let user_stake = &mut ctx.accounts.user_stake;
        let pool = &mut ctx.accounts.staking_pool;
        
        require!(user_stake.amount >= amount, StakingError::InsufficientStake);

        let clock = Clock::get()?;
        
        // Calculate and add pending rewards
        let pending_rewards = calculate_rewards(user_stake, pool.apy_basis_points, clock.unix_timestamp)?;
        user_stake.reward_debt += pending_rewards;

        // Create signer seeds for pool authority
        let seeds = &[
            b"staking_pool",
            pool.sdao_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer tokens back to user
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.staking_pool.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, amount)?;

        // Update user stake
        user_stake.amount -= amount;
        user_stake.last_stake_time = clock.unix_timestamp;

        // Update pool
        pool.total_staked -= amount;

        msg!("Unstaked {} SDAO tokens. Remaining staked: {}", amount, user_stake.amount);
        Ok(())
    }

    /// Claim staking rewards
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let user_stake = &mut ctx.accounts.user_stake;
        let pool = &ctx.accounts.staking_pool;
        let clock = Clock::get()?;

        // Calculate total rewards
        let pending_rewards = calculate_rewards(user_stake, pool.apy_basis_points, clock.unix_timestamp)?;
        let total_rewards = user_stake.reward_debt + pending_rewards;

        require!(total_rewards > 0, StakingError::NoRewards);

        // Create signer seeds for pool authority (mint authority)
        let seeds = &[
            b"staking_pool",
            pool.sdao_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        // Mint rewards to user
        let mint_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.sdao_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.staking_pool.to_account_info(),
            },
            signer,
        );
        token::mint_to(mint_ctx, total_rewards)?;

        // Reset reward debt and update last stake time
        user_stake.reward_debt = 0;
        user_stake.last_stake_time = clock.unix_timestamp;

        msg!("Claimed {} SDAO rewards", total_rewards);
        Ok(())
    }

    /// Get user staking info
    pub fn get_stake_info(ctx: Context<GetStakeInfo>) -> Result<StakeInfo> {
        let user_stake = &ctx.accounts.user_stake;
        let pool = &ctx.accounts.staking_pool;
        let clock = Clock::get()?;

        let pending_rewards = calculate_rewards(user_stake, pool.apy_basis_points, clock.unix_timestamp)?;
        let total_rewards = user_stake.reward_debt + pending_rewards;

        Ok(StakeInfo {
            staked_amount: user_stake.amount,
            pending_rewards: total_rewards,
            apy: pool.apy_basis_points,
            last_stake_time: user_stake.last_stake_time,
        })
    }
}

// Helper function to calculate rewards
fn calculate_rewards(user_stake: &UserStake, apy_basis_points: u16, current_time: i64) -> Result<u64> {
    if user_stake.amount == 0 {
        return Ok(0);
    }

    let time_elapsed = current_time - user_stake.last_stake_time;
    let seconds_per_year = 365 * 24 * 60 * 60;
    
    // Calculate rewards: (staked_amount * apy * time_elapsed) / (10000 * seconds_per_year)
    let rewards = (user_stake.amount as u128)
        .checked_mul(apy_basis_points as u128)
        .unwrap()
        .checked_mul(time_elapsed as u128)
        .unwrap()
        .checked_div(10000u128)
        .unwrap()
        .checked_div(seconds_per_year as u128)
        .unwrap() as u64;

    Ok(rewards)
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8 + 2 + 1,
        seeds = [b"staking_pool", sdao_mint.key().as_ref()],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        init,
        payer = authority,
        token::mint = sdao_mint,
        token::authority = staking_pool,
        seeds = [b"vault", staking_pool.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    pub sdao_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool", staking_pool.sdao_mint.as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"user_stake", staking_pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        seeds = [b"vault", staking_pool.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.mint == staking_pool.sdao_mint,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool", staking_pool.sdao_mint.as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", staking_pool.key().as_ref(), user.key().as_ref()],
        bump = user_stake.bump,
        constraint = user_stake.owner == user.key()
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        seeds = [b"vault", staking_pool.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.mint == staking_pool.sdao_mint,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        seeds = [b"staking_pool", staking_pool.sdao_mint.as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", staking_pool.key().as_ref(), user.key().as_ref()],
        bump = user_stake.bump,
        constraint = user_stake.owner == user.key()
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        constraint = sdao_mint.key() == staking_pool.sdao_mint
    )]
    pub sdao_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_token_account.mint == staking_pool.sdao_mint,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetStakeInfo<'info> {
    pub staking_pool: Account<'info, StakingPool>,
    pub user_stake: Account<'info, UserStake>,
}

#[account]
pub struct StakingPool {
    pub authority: Pubkey,
    pub sdao_mint: Pubkey,
    pub vault: Pubkey,
    pub total_staked: u64,
    pub apy_basis_points: u16,
    pub bump: u8,
}

#[account]
pub struct UserStake {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub reward_debt: u64,
    pub last_stake_time: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct StakeInfo {
    pub staked_amount: u64,
    pub pending_rewards: u64,
    pub apy: u16,
    pub last_stake_time: i64,
}

#[error_code]
pub enum StakingError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("No rewards to claim")]
    NoRewards,
}
