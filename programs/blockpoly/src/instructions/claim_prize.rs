use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::GameWon;
use crate::state::{GameState, GameStatus, PlayerState};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        seeds = [SEED_PLAYER_STATE, &game_id, winner.key().as_ref()],
        bump = player_state.bump,
        constraint = player_state.wallet == winner.key() @ BlockpolyError::NotPropertyOwner,
    )]
    pub player_state: Account<'info, PlayerState>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimPrize>, game_id: [u8; 32]) -> Result<()> {
    require!(ctx.accounts.game_state.status == GameStatus::Finished, BlockpolyError::GameNotStarted);
    require!(
        ctx.accounts.game_state.winner == Some(ctx.accounts.winner.key()),
        BlockpolyError::NotPropertyOwner
    );

    let prize = ctx.accounts.game_state.prize_pool_lamports;

    // Transfer SOL prize from game_state account to winner
    if prize > 0 {
        **ctx.accounts.game_state.to_account_info().try_borrow_mut_lamports()? -= prize;
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += prize;
        ctx.accounts.game_state.prize_pool_lamports = 0;
    }

    emit!(GameWon {
        game_id,
        winner: ctx.accounts.winner.key(),
        prize_lamports: prize,
    });

    Ok(())
}
