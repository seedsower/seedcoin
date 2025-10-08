use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("LiveStakingProgram111111111111111111111111");

#[program]
pub mod live_staking {
    use super::*;

    // Initialize the staking program
    pub fn initialize_staking(
        ctx: Context<InitializeStaking>,
        authority_bump: u8,
    ) -> Result<()> {
        let staking_pool = &mut ctx.accounts.staking_pool;
        staking_pool.authority = ctx.accounts.authority.key();
        staking_pool.authority_bump = authority_bump;
        staking_pool.sdao_mint = ctx.accounts.sdao_mint.key();
        staking_pool.vault = ctx.accounts.vault.key();
        staking_pool.total_staked = 0;
        staking_pool.apy_basis_points = 1850; // 18.5% APY
        staking_pool.min_stake_amount = 100_000_000; // 100 SDAO (6 decimals)
        
        msg!("Live staking pool initialized with 18.5% APY");
        Ok(())
    }

    // Stake SDAO tokens - REAL TOKEN TRANSFER
    pub fn stake_tokens(
        ctx: Context<StakeTokens>,
        amount: u64,
    ) -> Result<()> {
        let staking_pool = &mut ctx.accounts.staking_pool;
        let user_stake = &mut ctx.accounts.user_stake;
        
        require!(amount >= staking_pool.min_stake_amount, StakingError::InsufficientAmount);
        
        // REAL SPL TOKEN TRANSFER - NO SIMULATION
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        
        // Execute the real token transfer
        token::transfer(transfer_ctx, amount)?;
        
        // Update staking records
        if user_stake.amount == 0 {
            user_stake.user = ctx.accounts.user.key();
            user_stake.stake_time = Clock::get()?.unix_timestamp;
        }
        
        user_stake.amount += amount;
        user_stake.last_claim_time = Clock::get()?.unix_timestamp;
        staking_pool.total_staked += amount;
        
        msg!("Successfully staked {} SDAO tokens - REAL TRANSFER COMPLETED", amount / 1_000_000);
        Ok(())
    }

    // Unstake SDAO tokens - REAL TOKEN RETURN
    pub fn unstake_tokens(
        ctx: Context<UnstakeTokens>,
        amount: u64,
    ) -> Result<()> {
        let user_stake = &mut ctx.accounts.user_stake;
        let staking_pool = &mut ctx.accounts.staking_pool;
        
        require!(user_stake.amount >= amount, StakingError::InsufficientStaked);
        
        // Calculate and transfer pending rewards first
        let pending_rewards = calculate_rewards(
            user_stake.amount,
            user_stake.last_claim_time,
            staking_pool.apy_basis_points,
        )?;
        
        // REAL TOKEN TRANSFER BACK TO USER
        let authority_seeds = &[
            b"staking_authority",
            &[staking_pool.authority_bump],
        ];
        let signer_seeds = &[&authority_seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.staking_authority.to_account_info(),
            },
            signer_seeds,
        );
        
        // Execute real token return + rewards
        token::transfer(transfer_ctx, amount + pending_rewards)?;
        
        // Update records
        user_stake.amount -= amount;
        user_stake.last_claim_time = Clock::get()?.unix_timestamp;
        staking_pool.total_staked -= amount;
        
        msg!("Successfully unstaked {} SDAO + {} rewards - REAL TRANSFER COMPLETED", 
             amount / 1_000_000, pending_rewards / 1_000_000);
        Ok(())
    }

    // Claim staking rewards - REAL REWARD DISTRIBUTION
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let user_stake = &mut ctx.accounts.user_stake;
        let staking_pool = &ctx.accounts.staking_pool;
        
        let pending_rewards = calculate_rewards(
            user_stake.amount,
            user_stake.last_claim_time,
            staking_pool.apy_basis_points,
        )?;
        
        require!(pending_rewards > 0, StakingError::NoRewardsToClaim);
        
        // REAL REWARD TOKEN TRANSFER
        let authority_seeds = &[
            b"staking_authority",
            &[staking_pool.authority_bump],
        ];
        let signer_seeds = &[&authority_seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.staking_authority.to_account_info(),
            },
            signer_seeds,
        );
        
        // Execute real reward transfer
        token::transfer(transfer_ctx, pending_rewards)?;
        
        user_stake.last_claim_time = Clock::get()?.unix_timestamp;
        
        msg!("Successfully claimed {} SDAO rewards - REAL TRANSFER COMPLETED", 
             pending_rewards / 1_000_000);
        Ok(())
    }
}

// Calculate real-time rewards based on staking time and APY
fn calculate_rewards(
    staked_amount: u64,
    last_claim_time: i64,
    apy_basis_points: u16,
) -> Result<u64> {
    let current_time = Clock::get()?.unix_timestamp;
    let time_diff = current_time - last_claim_time;
    
    if time_diff <= 0 {
        return Ok(0);
    }
    
    // Calculate rewards: (staked_amount * apy * time_in_seconds) / (10000 * seconds_per_year)
    let seconds_per_year = 365 * 24 * 60 * 60;
    let rewards = (staked_amount as u128)
        .checked_mul(apy_basis_points as u128)
        .unwrap()
        .checked_mul(time_diff as u128)
        .unwrap()
        .checked_div(10000)
        .unwrap()
        .checked_div(seconds_per_year)
        .unwrap() as u64;
    
    Ok(rewards)
}

// Account structures
#[derive(Accounts)]
pub struct InitializeStaking<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::LEN,
        seeds = [b"staking_pool"],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        seeds = [b"staking_authority"],
        bump
    )]
    /// CHECK: This is safe as it's a PDA
    pub staking_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub sdao_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        token::mint = sdao_mint,
        token::authority = staking_authority,
        seeds = [b"staking_vault"],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool"],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStake::LEN,
        seeds = [b"user_stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        token::mint = staking_pool.sdao_mint,
        token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"staking_vault"],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UnstakeTokens<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool"],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,
    
    #[account(
        seeds = [b"staking_authority"],
        bump = staking_pool.authority_bump
    )]
    /// CHECK: This is safe as it's a PDA
    pub staking_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        token::mint = staking_pool.sdao_mint,
        token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"staking_vault"],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        seeds = [b"staking_pool"],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,
    
    #[account(
        seeds = [b"staking_authority"],
        bump = staking_pool.authority_bump
    )]
    /// CHECK: This is safe as it's a PDA
    pub staking_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        token::mint = staking_pool.sdao_mint,
        token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"staking_vault"],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// Data structures
#[account]
pub struct StakingPool {
    pub authority: Pubkey,
    pub authority_bump: u8,
    pub sdao_mint: Pubkey,
    pub vault: Pubkey,
    pub total_staked: u64,
    pub apy_basis_points: u16, // 1850 = 18.5%
    pub min_stake_amount: u64,
}

impl StakingPool {
    pub const LEN: usize = 32 + 1 + 32 + 32 + 8 + 2 + 8;
}

#[account]
pub struct UserStake {
    pub user: Pubkey,
    pub amount: u64,
    pub stake_time: i64,
    pub last_claim_time: i64,
}

impl UserStake {
    pub const LEN: usize = 32 + 8 + 8 + 8;
}

// Error codes
#[error_code]
pub enum StakingError {
    #[msg("Insufficient amount to stake")]
    InsufficientAmount,
    #[msg("Insufficient staked amount")]
    InsufficientStaked,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
}
