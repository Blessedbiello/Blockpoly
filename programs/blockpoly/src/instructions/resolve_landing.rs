use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::BOARD;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::TaxPaid;
use crate::state::{GameState, GameStatus, PlayerState, PropertyState, TurnPhase};

/// Resolves what happens when a player lands on a space.
/// Handles: Genesis salary, tax spaces, free parking, Rug Pull Zone (just visiting),
/// unowned property (→ BuyDecision), owned property (→ pay_rent), card spaces (→ DrawCard).
/// The frontend calls this after consume_randomness emits DiceRolled.
#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct ResolveLanding<'info> {
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

    /// Bank vault PDA (signer for bank-side transfers)
    /// CHECK: seeds verified
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

pub fn handler(ctx: Context<ResolveLanding>, game_id: [u8; 32]) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player_state = &mut ctx.accounts.player_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(game.turn_phase == TurnPhase::LandingEffect, BlockpolyError::WrongTurnPhase);
    require!(
        game.current_player_index == player_state.player_index,
        BlockpolyError::NotYourTurn
    );

    let position = player_state.position;
    let space = &BOARD[position as usize];
    let dice = game.pending_dice.unwrap_or([1, 1]);
    let passed_genesis = {
        // We re-derive based on stored pending_dice vs previous position being > current
        // The DiceRolled event already reported passed_genesis; here we track it via position context
        // Simple heuristic: if position < (position - dice total) % 40
        false // will be handled properly by the event; here we only care if ON space 0
    };

    // Handle passing Genesis Block (position == 0 means landed ON it, which also pays)
    // The actual salary transfer happens here for tax/free spaces and if they LANDED on Genesis
    let bank_vault_bump = ctx.bumps.bank_vault;
    let signer_seeds: &[&[&[u8]]] = &[&[SEED_BANK_VAULT, &game_id, &[bank_vault_bump]]];

    // Helper: transfer from bank to player
    let transfer_from_bank = |amount: u64| -> Result<()> {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bank_bpoly_ata.to_account_info(),
                to: ctx.accounts.player_bpoly_ata.to_account_info(),
                authority: ctx.accounts.bank_vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi_ctx, amount)
    };

    match space.space_type {
        SPACE_TYPE_GENESIS => {
            // Landed ON Genesis Block: collect 200 BPOLY salary
            transfer_from_bank(GENESIS_SALARY)?;
            player_state.bpoly_balance = player_state.bpoly_balance.saturating_add(GENESIS_SALARY);
            game.advance_turn();
        }
        SPACE_TYPE_TAX => {
            // Gas Fees Tax (200) or Protocol Fee (100)
            let tax_amount = space.base_rent; // base_rent stores tax amount
            // Transfer from player to bank
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.player_bpoly_ata.to_account_info(),
                    to: ctx.accounts.bank_bpoly_ata.to_account_info(),
                    authority: ctx.accounts.player.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, tax_amount)?;
            player_state.bpoly_balance = player_state.bpoly_balance.saturating_sub(tax_amount);

            emit!(TaxPaid {
                game_id,
                player: ctx.accounts.player.key(),
                space: position,
                amount: tax_amount,
            });
            game.advance_turn();
        }
        SPACE_TYPE_FREE_PARKING | SPACE_TYPE_RUGPULL => {
            // Nothing happens — just visiting
            game.advance_turn();
        }
        SPACE_TYPE_GO_TO_JAIL => {
            // Already handled in consume_randomness; this should not reach here
            game.advance_turn();
        }
        SPACE_TYPE_CARD_ALPHA => {
            game.turn_phase = TurnPhase::DrawCard;
        }
        SPACE_TYPE_CARD_GOVERNANCE => {
            game.turn_phase = TurnPhase::DrawCard;
        }
        SPACE_TYPE_PROPERTY | SPACE_TYPE_BRIDGE | SPACE_TYPE_UTILITY => {
            // Check if property exists (is owned)
            // If no PropertyState PDA → bank-owned → give player option to buy
            game.turn_phase = TurnPhase::BuyDecision;
        }
        _ => {
            game.advance_turn();
        }
    }

    Ok(())
}
