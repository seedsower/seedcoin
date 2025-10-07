use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct EmergencyPause<'info> {
    #[account(
        constraint = authority.key() == protocol_state.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

pub fn handler(ctx: Context<EmergencyPause>, pause: bool) -> Result<()> {
    let protocol_state = &mut ctx.accounts.protocol_state;
    
    protocol_state.is_paused = pause;
    
    if pause {
        msg!("Protocol emergency pause activated");
    } else {
        msg!("Protocol emergency pause deactivated");
    }
    
    Ok(())
}
