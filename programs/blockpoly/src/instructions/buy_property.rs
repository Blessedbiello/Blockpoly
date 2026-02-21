use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::BOARD;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::PropertyPurchased;
use crate::state::{GameState, GameStatus, PlayerState, PropertyState, TurnPhase};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32], space_index: u8)]
pub struct BuyProperty<'info> {
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

    /// Lazily initialized PropertyState PDA
    #[account(
        init,
        payer = player,
        space = PropertyState::MAX_SIZE,
        seeds = [SEED_PROPERTY_STATE, &game_id, &[space_index]],
        bump
    )]
    pub property_state: Account<'info, PropertyState>,

    /// Bank vault PDA
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
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<BuyProperty>,
    game_id: [u8; 32],
    space_index: u8,
    nft_asset: Pubkey,
) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let player_state = &mut ctx.accounts.player_state;
    let property = &mut ctx.accounts.property_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(
        game.turn_phase == TurnPhase::BuyDecision,
        BlockpolyError::WrongTurnPhase
    );
    require!(
        game.current_player_index == player_state.player_index,
        BlockpolyError::NotYourTurn
    );
    require!(space_index == player_state.position, BlockpolyError::InvalidSpaceIndex);

    let space = &BOARD[space_index as usize];
    require!(
        space.space_type == SPACE_TYPE_PROPERTY
            || space.space_type == SPACE_TYPE_BRIDGE
            || space.space_type == SPACE_TYPE_UTILITY,
        BlockpolyError::PropertyNotAvailable
    );

    let price = space.price;
    require!(price > 0, BlockpolyError::PropertyNotAvailable);

    // Transfer payment from player to bank
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.player_bpoly_ata.to_account_info(),
            to: ctx.accounts.bank_bpoly_ata.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, price)?;
    player_state.bpoly_balance = player_state.bpoly_balance.saturating_sub(price);

    // Initialize PropertyState
    property.game = game.key();
    property.space_index = space_index;
    property.owner = ctx.accounts.player.key();
    property.liquidity_pools = 0;
    property.is_full_protocol = false;
    property.is_mortgaged = false;
    property.nft_asset = nft_asset;
    property.bump = ctx.bumps.property_state;

    // Add to player's owned properties
    player_state.add_property(space_index);

    emit!(PropertyPurchased {
        game_id,
        player: ctx.accounts.player.key(),
        space: space_index,
        price,
        nft_asset,
    });

    game.advance_turn();

    Ok(())
}
