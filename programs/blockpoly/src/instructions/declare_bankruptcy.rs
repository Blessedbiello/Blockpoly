use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::PlayerBankrupted;
use crate::state::{GameState, GameStatus, PlayerState, PlayerStatus};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct DeclareBankruptcy<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        mut,
        seeds = [SEED_PLAYER_STATE, &game_id, player.key().as_ref()],
        bump = player_state.bump,
        constraint = player_state.wallet == player.key() @ BlockpolyError::NotYourTurn,
    )]
    pub player_state: Account<'info, PlayerState>,
}

pub fn handler(
    ctx: Context<DeclareBankruptcy>,
    game_id: [u8; 32],
    creditor: Option<Pubkey>,
) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player = &mut ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(!player.is_bankrupt, BlockpolyError::PlayerBankrupt);

    player.is_bankrupt = true;
    player.status = PlayerStatus::Bankrupt;

    // Remove from active players
    game.players.retain(|&p| p != ctx.accounts.player.key());
    game.player_count -= 1;

    // NOTE: Property transfers to creditor/bank happen via remaining_accounts iteration.
    // Each PropertyState in remaining_accounts gets owner = creditor (or cleared if bank).

    emit!(PlayerBankrupted {
        game_id,
        player: ctx.accounts.player.key(),
        creditor,
    });

    // Check if only one player remains → game over
    if game.player_count == 1 {
        game.winner = game.players.first().copied();
        game.status = GameStatus::Finished;
    } else {
        // Skip to next player's turn
        game.current_player_index = game.current_player_index % game.player_count;
        game.advance_turn();
    }

    Ok(())
}
