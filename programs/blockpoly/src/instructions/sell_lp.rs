use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::BOARD;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::LPSold;
use crate::state::{GameState, PropertyState};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32], space_index: u8)]
pub struct SellLP<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

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
    ctx: Context<SellLP>,
    game_id: [u8; 32],
    space_index: u8,
) -> Result<()> {
    let game = &ctx.accounts.game_state;
    let property = &mut ctx.accounts.property_state;

    require!(property.has_buildings(), BlockpolyError::WrongTurnPhase);

    let space = &BOARD[space_index as usize];
    // Sell back at half LP cost
    let refund = space.lp_cost / 2;

    if property.is_full_protocol {
        property.is_full_protocol = false;
        // liquidity_pools stays at 4
    } else {
        property.liquidity_pools -= 1;
    }

    let bank_vault_bump = ctx.bumps.bank_vault;
    let signer_seeds: &[&[&[u8]]] = &[&[SEED_BANK_VAULT, &game_id, &[bank_vault_bump]]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.bank_bpoly_ata.to_account_info(),
            to: ctx.accounts.player_bpoly_ata.to_account_info(),
            authority: ctx.accounts.bank_vault.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(cpi_ctx, refund)?;

    emit!(LPSold {
        game_id,
        player: ctx.accounts.player.key(),
        space: space_index,
        lp_count: property.liquidity_pools,
    });

    Ok(())
}
