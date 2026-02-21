use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::BOARD;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::PropertyUnmortgaged;
use crate::state::{GameState, GameStatus, PlayerState, PropertyState};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32], space_index: u8)]
pub struct UnmortgageProperty<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        mut,
        seeds = [SEED_PLAYER_STATE, &game_id, player.key().as_ref()],
        bump = player_state.bump,
        constraint = player_state.wallet == player.key() @ BlockpolyError::NotPropertyOwner,
    )]
    pub player_state: Account<'info, PlayerState>,

    #[account(
        mut,
        seeds = [SEED_PROPERTY_STATE, &game_id, &[space_index]],
        bump = property_state.bump,
        constraint = property_state.owner == player.key() @ BlockpolyError::NotPropertyOwner,
    )]
    pub property_state: Account<'info, PropertyState>,

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

pub fn handler(
    ctx: Context<UnmortgageProperty>,
    game_id: [u8; 32],
    space_index: u8,
) -> Result<()> {
    let property = &mut ctx.accounts.property_state;
    let player_state = &mut ctx.accounts.player_state;

    require!(property.is_mortgaged, BlockpolyError::WrongTurnPhase);

    let space = &BOARD[space_index as usize];
    // Unmortgage costs: mortgage value + 10% interest
    let unmortgage_cost = space.mortgage_value + space.mortgage_value / 10;

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.player_bpoly_ata.to_account_info(),
            to: ctx.accounts.bank_bpoly_ata.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, unmortgage_cost)?;
    player_state.bpoly_balance = player_state.bpoly_balance.saturating_sub(unmortgage_cost);

    property.is_mortgaged = false;

    emit!(PropertyUnmortgaged {
        game_id,
        player: ctx.accounts.player.key(),
        space: space_index,
        amount_paid: unmortgage_cost,
    });

    Ok(())
}
