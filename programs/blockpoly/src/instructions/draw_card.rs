use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::CardDrawn;
use crate::state::{GameState, GameStatus, PlayerState, TurnPhase};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct DrawCard<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        seeds = [SEED_PLAYER_STATE, &game_id, player.key().as_ref()],
        bump = player_state.bump,
        has_one = wallet @ BlockpolyError::NotYourTurn,
    )]
    pub player_state: Account<'info, PlayerState>,
}

pub fn handler(ctx: Context<DrawCard>, game_id: [u8; 32]) -> Result<(u8, u8)> {
    let game = &mut ctx.accounts.game_state;
    let player_state = &ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(game.turn_phase == TurnPhase::DrawCard, BlockpolyError::WrongTurnPhase);
    require!(
        game.current_player_index == player_state.player_index,
        BlockpolyError::NotYourTurn
    );

    let position = player_state.position;
    let space = &crate::board::BOARD[position as usize];

    let (deck_type, card_id) = match space.space_type {
        SPACE_TYPE_CARD_ALPHA => {
            let card = game.next_alpha_card();
            (0u8, card)
        }
        SPACE_TYPE_CARD_GOVERNANCE => {
            let card = game.next_governance_card();
            (1u8, card)
        }
        _ => return Err(BlockpolyError::WrongTurnPhase.into()),
    };

    emit!(CardDrawn {
        game_id,
        player: ctx.accounts.player.key(),
        deck: deck_type,
        card_id,
    });

    // Store the drawn card in pending_dice as a hack-free approach
    // We repurpose pending_dice[0] = deck_type, [1] = card_id for resolve_card
    game.pending_dice = Some([deck_type, card_id]);

    Ok((deck_type, card_id))
}
