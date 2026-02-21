use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::{RugPullExited};
use crate::state::{GameState, GameStatus, PlayerState, PlayerStatus, TurnPhase};

/// Handles all Rug Pull Zone interactions:
/// - pay_bail: pay 50 BPOLY to exit
/// - use_jail_free_card: use held GORPF card
/// - attempt_doubles: declared when rolling — if doubles, exit; else stay
///   (this instruction covers the bail scenario; doubles are handled in request_dice_roll)
#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct HandleRugPull<'info> {
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

    /// CHECK: bank vault PDA
    #[account(seeds = [SEED_BANK_VAULT, &game_id], bump)]
    pub bank_vault: UncheckedAccount<'info>,

    #[account(mut, address = game_state.bank_bpoly_ata)]
    pub bank_bpoly_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = game_state.bpoly_mint,
        associated_token::authority = player,
    )]
    pub player_bpoly_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub enum RugPullAction {
    PayBail,
    UseJailFreeCard,
    AttemptDoubles, // roll dice — if doubles, exit; requires subsequent dice roll
}

pub fn handler_pay_bail(ctx: Context<HandleRugPull>, game_id: [u8; 32]) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player = &mut ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(
        game.current_player_index == player.player_index,
        BlockpolyError::NotYourTurn
    );
    require!(player.is_in_rugpull(), BlockpolyError::NotInRugPullZone);
    require!(
        game.turn_phase == TurnPhase::RugPullDecision || game.turn_phase == TurnPhase::RollDice,
        BlockpolyError::WrongTurnPhase
    );

    // Transfer bail from player to bank
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.player_bpoly_ata.to_account_info(),
            to: ctx.accounts.bank_bpoly_ata.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, RUGPULL_BAIL_AMOUNT)?;
    player.bpoly_balance = player.bpoly_balance.saturating_sub(RUGPULL_BAIL_AMOUNT);

    player.rugpull_turns_remaining = 0;
    player.status = PlayerStatus::Active;

    // Allow player to roll dice this turn
    game.turn_phase = TurnPhase::RollDice;

    emit!(RugPullExited {
        game_id,
        player: ctx.accounts.player.key(),
        method: 0, // bail
    });

    Ok(())
}

pub fn handler_use_jail_free_card(ctx: Context<HandleRugPull>, game_id: [u8; 32]) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player = &mut ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(
        game.current_player_index == player.player_index,
        BlockpolyError::NotYourTurn
    );
    require!(player.is_in_rugpull(), BlockpolyError::NotInRugPullZone);
    require!(player.has_jail_free_card, BlockpolyError::NoJailFreeCard);

    player.has_jail_free_card = false;
    player.jail_free_card_type = 0;
    player.rugpull_turns_remaining = 0;
    player.status = PlayerStatus::Active;

    game.turn_phase = TurnPhase::RollDice;

    emit!(RugPullExited {
        game_id,
        player: ctx.accounts.player.key(),
        method: 1, // jail-free card
    });

    Ok(())
}

/// Called when a player in Rug Pull Zone has their turn and chooses to attempt doubles.
/// This sets up the turn phase to RollDice; the consume_randomness callback will check
/// if doubles were rolled and either exit or decrement the turn counter.
pub fn handler_attempt_doubles(ctx: Context<HandleRugPull>, game_id: [u8; 32]) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player = &ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(
        game.current_player_index == player.player_index,
        BlockpolyError::NotYourTurn
    );
    require!(player.is_in_rugpull(), BlockpolyError::NotInRugPullZone);

    // Proceed to roll — consume_randomness handles the doubles check
    game.turn_phase = TurnPhase::RollDice;

    Ok(())
}
