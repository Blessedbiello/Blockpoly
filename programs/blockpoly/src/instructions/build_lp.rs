use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::{BOARD, group_spaces};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::LPBuilt;
use crate::state::{GameState, GameStatus, PlayerState, PropertyState, TurnPhase};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32], space_index: u8)]
pub struct BuildLP<'info> {
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

    #[account(seeds = [SEED_BANK_VAULT, &game_id], bump)]
    /// CHECK: bank vault PDA
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
    ctx: Context<BuildLP>,
    game_id: [u8; 32],
    space_index: u8,
    // LP counts of all other properties in the same group (for even-build validation)
    sibling_lp_counts: Vec<u8>,
) -> Result<()> {
    let game = &ctx.accounts.game_state;
    let player_state = &ctx.accounts.player_state;
    let property = &mut ctx.accounts.property_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    // Building is allowed outside the turn's main action phase (any time)
    require!(!property.is_mortgaged, BlockpolyError::PropertyMortgaged);
    require!(property.can_build_lp(), BlockpolyError::MaxLPsReached);
    require!(property.owner == ctx.accounts.player.key(), BlockpolyError::NotPropertyOwner);

    let space = &BOARD[space_index as usize];
    require!(space.space_type == SPACE_TYPE_PROPERTY, BlockpolyError::PropertyNotAvailable);

    // Validate complete color set ownership
    let group = space.group;
    let group_members = group_spaces(group);
    require!(
        player_state.properties_owned.iter().filter(|&&s| group_members.contains(&s)).count()
            == group_members.len(),
        BlockpolyError::IncompleteColorSet
    );

    // Even-building rule: can't build if any sibling has fewer LPs
    let current_lps = property.liquidity_pools;
    for &sibling_lp in &sibling_lp_counts {
        require!(sibling_lp >= current_lps, BlockpolyError::UnevenBuilding);
    }

    let lp_cost = space.lp_cost;
    // Transfer LP cost from player to bank
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.player_bpoly_ata.to_account_info(),
            to: ctx.accounts.bank_bpoly_ata.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, lp_cost)?;

    property.liquidity_pools += 1;

    emit!(LPBuilt {
        game_id,
        player: ctx.accounts.player.key(),
        space: space_index,
        lp_count: property.liquidity_pools,
    });

    Ok(())
}
