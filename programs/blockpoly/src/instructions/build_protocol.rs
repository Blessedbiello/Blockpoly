use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::BOARD;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::ProtocolBuilt;
use crate::state::{GameState, GameStatus, PropertyState};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32], space_index: u8)]
pub struct BuildProtocol<'info> {
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
    ctx: Context<BuildProtocol>,
    game_id: [u8; 32],
    space_index: u8,
) -> Result<()> {
    let property = &mut ctx.accounts.property_state;

    require!(!property.is_full_protocol, BlockpolyError::MaxProtocolReached);
    require!(property.can_upgrade_protocol(), BlockpolyError::UnevenBuilding);
    require!(!property.is_mortgaged, BlockpolyError::PropertyMortgaged);

    let space = &BOARD[space_index as usize];
    let lp_cost = space.lp_cost; // Protocol upgrade costs same as one LP

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.player_bpoly_ata.to_account_info(),
            to: ctx.accounts.bank_bpoly_ata.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, lp_cost)?;

    property.is_full_protocol = true;
    property.liquidity_pools = 4; // keep count for sell-back

    emit!(ProtocolBuilt {
        game_id,
        player: ctx.accounts.player.key(),
        space: space_index,
    });

    Ok(())
}
