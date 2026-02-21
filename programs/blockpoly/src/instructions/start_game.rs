use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::GameStarted;
use crate::state::{GameState, GameStatus, TurnPhase};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct StartGame<'info> {
    #[account(mut)]
    pub host: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
        has_one = host @ BlockpolyError::HostOnly,
    )]
    pub game_state: Account<'info, GameState>,
}

pub fn handler(
    ctx: Context<StartGame>,
    game_id: [u8; 32],
    // VRF seed used to shuffle the card decks (provided by host after requesting VRF)
    shuffle_seed: [u8; 32],
) -> Result<()> {
    let game = &mut ctx.accounts.game_state;

    require!(game.status == GameStatus::WaitingForPlayers, BlockpolyError::GameNotWaiting);
    require!(game.player_count >= 2, BlockpolyError::InvalidPlayerCount);

    // Shuffle Alpha Call deck using Fisher-Yates with VRF seed
    let mut alpha_deck: [u8; 16] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    fisher_yates_shuffle(&mut alpha_deck, &shuffle_seed, 0);

    // Shuffle Governance Vote deck with same seed, different offset
    let mut gov_deck: [u8; 16] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    fisher_yates_shuffle(&mut gov_deck, &shuffle_seed, 16);

    game.alpha_call_deck = alpha_deck;
    game.alpha_call_index = 0;
    game.governance_deck = gov_deck;
    game.governance_index = 0;
    game.status = GameStatus::InProgress;
    game.turn_phase = TurnPhase::RollDice;
    game.current_player_index = 0;
    game.turn_number = 1;
    game.round_number = 1;

    emit!(GameStarted {
        game_id,
        player_count: game.player_count,
    });

    Ok(())
}

/// Fisher-Yates shuffle using bytes from seed starting at seed_offset
fn fisher_yates_shuffle(deck: &mut [u8; 16], seed: &[u8; 32], seed_offset: usize) {
    let n = deck.len();
    for i in (1..n).rev() {
        // Use seed bytes cyclically
        let seed_byte = seed[(seed_offset + i) % 32] as usize;
        let j = seed_byte % (i + 1);
        deck.swap(i, j);
    }
}
