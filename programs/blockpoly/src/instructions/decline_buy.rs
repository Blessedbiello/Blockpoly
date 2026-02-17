use anchor_lang::prelude::*;
use crate::board::BOARD;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::AuctionStarted;
use crate::state::{GameState, GameStatus, PlayerState, TurnPhase};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct DeclineBuy<'info> {
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

pub fn handler(ctx: Context<DeclineBuy>, game_id: [u8; 32]) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player_state = &ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(game.turn_phase == TurnPhase::BuyDecision, BlockpolyError::WrongTurnPhase);
    require!(
        game.current_player_index == player_state.player_index,
        BlockpolyError::NotYourTurn
    );

    let space = player_state.position;
    let starting_bid = BOARD[space as usize].price / 10; // starting bid = 10% of price

    // Set up auction in GameState
    game.auction_space = Some(space);
    game.auction_highest_bid = starting_bid;
    game.auction_highest_bidder = None;
    game.auction_end_turn = game.turn_number + AUCTION_DURATION_TURNS;
    game.turn_phase = TurnPhase::AuctionPhase;

    emit!(AuctionStarted {
        game_id,
        space,
        starting_bid,
    });

    Ok(())
}
