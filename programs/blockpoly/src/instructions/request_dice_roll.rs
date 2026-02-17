use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::state::{GameState, GameStatus, PlayerState, TurnPhase};

/// Request a dice roll via Switchboard VRF.
/// In the real deployment this integrates with the Switchboard oracle.
/// For the hackathon build, we accept a pseudo-randomness fallback where
/// the Switchboard callback (consume_randomness) fulfills the roll.
///
/// The VRF account is passed in and tracked in game_state.vrf_request.
/// The oracle fulfills it by calling consume_randomness.
#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct RequestDiceRoll<'info> {
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
        has_one = wallet @ BlockpolyError::NotYourTurn,
    )]
    pub player_state: Account<'info, PlayerState>,
}

pub fn handler(ctx: Context<RequestDiceRoll>, game_id: [u8; 32]) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player = &ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(
        game.current_player_index == player.player_index,
        BlockpolyError::NotYourTurn
    );
    require!(
        game.turn_phase == TurnPhase::RollDice,
        BlockpolyError::WrongTurnPhase
    );
    require!(game.vrf_request.is_none(), BlockpolyError::VRFPending);

    // In production: CPI to Switchboard to request VRF
    // The oracle callback will call consume_randomness with the result.
    // For now, we mark the phase as AwaitingVRF. A separate consume_randomness
    // instruction (called by the oracle or, in tests, directly) will move us forward.

    game.turn_phase = TurnPhase::AwaitingVRF;
    // vrf_request pubkey would be set here with the actual Switchboard VRF account
    // game.vrf_request = Some(vrf_account.key());

    emit!(crate::events::VrfRequested {
        game_id,
        player: ctx.accounts.player.key(),
        vrf_account: Pubkey::default(), // replaced with actual VRF account in production
    });

    Ok(())
}
