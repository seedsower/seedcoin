use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("HBktVPq8VSR42ugq3WoeHhqWqjSP8y2S4coVN7iRAAVD");

#[program]
pub mod seed_stable_mini {
    use super::*;
    
    /// Initialize program state
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.auth = ctx.accounts.auth.key();
        state.paused = 0;
        Ok(())
    }
    
    /// Mint SEEDS by depositing USDC (1:1 ratio)
    pub fn mint(ctx: Context<MintOp>, amt: u64) -> Result<()> {
        require!(ctx.accounts.state.paused == 0, SeedError::Paused);
        
        // Transfer USDC to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_usdc.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amt,
        )?;
        
        // Mint SEEDS
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.seed_mint.to_account_info(),
                    to: ctx.accounts.user_seeds.to_account_info(),
                    authority: ctx.accounts.state.to_account_info(),
                },
                &[&[b"state", &[ctx.bumps.state]]],
            ),
            amt,
        )?;
        
        Ok(())
    }
    
    /// Burn SEEDS to redeem USDC (1:1 ratio)
    pub fn burn(ctx: Context<BurnOp>, amt: u64) -> Result<()> {
        require!(ctx.accounts.state.paused == 0, SeedError::Paused);
        
        // Burn SEEDS
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.seed_mint.to_account_info(),
                    from: ctx.accounts.user_seeds.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amt,
        )?;
        
        // Return USDC
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.user_usdc.to_account_info(),
                    authority: ctx.accounts.state.to_account_info(),
                },
                &[&[b"state", &[ctx.bumps.state]]],
            ),
            amt,
        )?;
        
        Ok(())
    }
    
    /// Toggle pause (auth only)
    pub fn pause(ctx: Context<Auth>) -> Result<()> {
        ctx.accounts.state.paused = 1 - ctx.accounts.state.paused;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = auth,
        space = 8 + 33,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub auth: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintOp<'info> {
    #[account(seeds = [b"state"], bump)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub seed_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_seeds: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnOp<'info> {
    #[account(seeds = [b"state"], bump)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub seed_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_seeds: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Auth<'info> {
    #[account(mut, seeds = [b"state"], bump, has_one = auth)]
    pub state: Account<'info, State>,
    pub auth: Signer<'info>,
}

#[account]
pub struct State {
    pub auth: Pubkey,
    pub paused: u8,
}

#[error_code]
pub enum SeedError {
    #[msg("Program is paused")]
    Paused,
}
