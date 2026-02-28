use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::BOARD;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::PropertyPurchased;
use crate::state::{GameState, GameStatus, PlayerState, PropertyState, TurnPhase};

/// Metaplex Core program ID
pub const MPL_CORE_PROGRAM: Pubkey = pubkey!("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

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

    /// Fresh keypair from frontend — becomes the Core asset address
    #[account(mut)]
    pub nft_asset: Signer<'info>,

    /// Metaplex Core collection (stored in game_state.nft_collection)
    /// CHECK: address verified against game_state
    #[account(mut, address = game_state.nft_collection @ BlockpolyError::InvalidCollection)]
    pub nft_collection: UncheckedAccount<'info>,

    /// CHECK: mpl-core program, address constrained
    #[account(address = MPL_CORE_PROGRAM)]
    pub mpl_core_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Build the mpl-core CreateV2 instruction data via raw serialization.
/// Discriminator: [50, 174, 34, 243, 70, 79, 14, 190] (CreateV2)
fn build_create_v2_data(name: &str, uri: &str) -> Vec<u8> {
    let mut data = vec![];
    // CreateV2 discriminator
    data.extend_from_slice(&[50, 174, 34, 243, 70, 79, 14, 190]);
    // DataState enum: AccountState (0u8)
    data.push(0);
    // name: borsh string (u32 len + bytes)
    data.extend_from_slice(&(name.len() as u32).to_le_bytes());
    data.extend_from_slice(name.as_bytes());
    // uri: borsh string
    data.extend_from_slice(&(uri.len() as u32).to_le_bytes());
    data.extend_from_slice(uri.as_bytes());
    // plugins: Option<Vec<Plugin>> = None (0u8)
    data.push(0);
    // external_plugins: Option<Vec<ExternalPlugin>> = None (0u8)
    data.push(0);
    data
}

pub fn handler(
    ctx: Context<BuyProperty>,
    game_id: [u8; 32],
    space_index: u8,
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

    // Mint Metaplex Core NFT via raw CPI
    let uri = format!("{}/property-{}.json", NFT_BASE_URI, space_index);
    let ix_data = build_create_v2_data(space.name, &uri);

    let create_ix = Instruction {
        program_id: MPL_CORE_PROGRAM,
        accounts: vec![
            AccountMeta::new(ctx.accounts.nft_asset.key(), true),     // asset (signer)
            AccountMeta::new(ctx.accounts.nft_collection.key(), false), // collection (optional, writable)
            AccountMeta::new_readonly(ctx.accounts.player.key(), false), // authority/owner
            AccountMeta::new(ctx.accounts.player.key(), true),        // payer (signer)
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false), // system_program
            // log_wrapper: None — skip
        ],
        data: ix_data,
    };

    invoke(
        &create_ix,
        &[
            ctx.accounts.nft_asset.to_account_info(),
            ctx.accounts.nft_collection.to_account_info(),
            ctx.accounts.player.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.mpl_core_program.to_account_info(),
        ],
    )?;

    // Initialize PropertyState
    property.game = game.key();
    property.space_index = space_index;
    property.owner = ctx.accounts.player.key();
    property.liquidity_pools = 0;
    property.is_full_protocol = false;
    property.is_mortgaged = false;
    property.nft_asset = ctx.accounts.nft_asset.key();
    property.bump = ctx.bumps.property_state;

    // Add to player's owned properties
    player_state.add_property(space_index);

    let nft_asset_key = ctx.accounts.nft_asset.key();
    emit!(PropertyPurchased {
        game_id,
        player: ctx.accounts.player.key(),
        space: space_index,
        price,
        nft_asset: nft_asset_key,
    });

    game.advance_turn();

    Ok(())
}
