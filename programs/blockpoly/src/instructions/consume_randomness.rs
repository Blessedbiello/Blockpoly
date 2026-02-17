use anchor_lang::prelude::*;
use crate::board::{BOARD, SPACE_TYPE_GO_TO_JAIL};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::{DiceRolled, RugPullEntered};
use crate::state::{GameState, GameStatus, PlayerState, PlayerStatus, TurnPhase};

/// Called by the Switchboard oracle (or test mock) to fulfill VRF randomness.
/// Derives dice from the random bytes, moves the player, and transitions phase.
#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct ConsumeRandomness<'info> {
    /// In production: must be the Switchboard oracle or VRF callback signer.
    /// For the hackathon: accept the current player (simplified auth).
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        mut,
        seeds = [SEED_PLAYER_STATE, &game_id, player_state.wallet.as_ref()],
        bump = player_state.bump,
    )]
    pub player_state: Account<'info, PlayerState>,
}

pub fn handler(
    ctx: Context<ConsumeRandomness>,
    game_id: [u8; 32],
    random_bytes: [u8; 32],
) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player = &mut ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(game.turn_phase == TurnPhase::AwaitingVRF, BlockpolyError::WrongTurnPhase);
    require!(
        game.current_player_index == player.player_index,
        BlockpolyError::NotYourTurn
    );

    // Derive dice: 1–6 using modulo
    let die1 = (random_bytes[0] % 6) + 1;
    let die2 = (random_bytes[1] % 6) + 1;
    let roll_total = die1 + die2;
    let is_doubles = die1 == die2;

    // Check for triple doubles → SEC Investigation (jail)
    if is_doubles {
        player.doubles_streak += 1;
        if player.doubles_streak >= 3 {
            // Triple doubles: go directly to Rug Pull Zone
            player.doubles_streak = 0;
            player.position = SPACE_RUGPULL_ZONE;
            player.rugpull_turns_remaining = RUGPULL_MAX_TURNS;
            player.status = PlayerStatus::InRugPullZone;

            game.turn_phase = TurnPhase::LandingEffect;
            game.vrf_request = None;
            game.pending_dice = Some([die1, die2]);

            emit!(RugPullEntered {
                game_id,
                player: player.wallet,
                reason: 2, // triple doubles
            });
            emit!(DiceRolled {
                game_id,
                player: player.wallet,
                die1,
                die2,
                new_position: player.position,
                passed_genesis: false,
            });
            return Ok(());
        }
    } else {
        player.doubles_streak = 0;
    }

    // Move player
    let old_position = player.position;
    let new_position = (old_position + roll_total) % BOARD_SIZE;
    let passed_genesis = new_position < old_position || (old_position == 0 && roll_total > 0);

    player.position = new_position;

    // Collect Genesis Block salary if passed GO
    // Actual token transfer happens in resolve_landing to keep this composable
    let actually_passed = new_position < old_position;

    // Check if landed on SEC Investigation (Go To Jail)
    if BOARD[new_position as usize].space_type == SPACE_TYPE_GO_TO_JAIL {
        player.position = SPACE_RUGPULL_ZONE;
        player.rugpull_turns_remaining = RUGPULL_MAX_TURNS;
        player.status = PlayerStatus::InRugPullZone;
        player.doubles_streak = 0;

        game.turn_phase = TurnPhase::LandingEffect;
        game.vrf_request = None;
        game.pending_dice = Some([die1, die2]);

        emit!(RugPullEntered {
            game_id,
            player: player.wallet,
            reason: 0,
        });
        emit!(DiceRolled {
            game_id,
            player: player.wallet,
            die1,
            die2,
            new_position: player.position,
            passed_genesis: actually_passed,
        });
        return Ok(());
    }

    game.turn_phase = TurnPhase::LandingEffect;
    game.vrf_request = None;
    game.pending_dice = Some([die1, die2]);

    emit!(DiceRolled {
        game_id,
        player: player.wallet,
        die1,
        die2,
        new_position,
        passed_genesis: actually_passed,
    });

    Ok(())
}
