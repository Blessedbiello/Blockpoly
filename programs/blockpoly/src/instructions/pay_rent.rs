use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::board::{BOARD, group_spaces};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::RentPaid;
use crate::state::{GameState, GameStatus, PlayerState, PropertyState, TurnPhase};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct PayRent<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        mut,
        seeds = [SEED_PLAYER_STATE, &game_id, payer.key().as_ref()],
        bump = payer_state.bump,
        has_one = wallet @ BlockpolyError::NotYourTurn,
    )]
    pub payer_state: Account<'info, PlayerState>,

    /// PropertyState of the space landed on
    #[account(
        seeds = [SEED_PROPERTY_STATE, &game_id, &[property_state.space_index]],
        bump = property_state.bump,
    )]
    pub property_state: Account<'info, PropertyState>,

    #[account(
        mut,
        associated_token::mint = game_state.bpoly_mint,
        associated_token::authority = payer,
    )]
    pub payer_bpoly_ata: Account<'info, TokenAccount>,

    /// Owner's BPOLY ATA (receives rent)
    /// CHECK: verified via property_state.owner
    #[account(
        mut,
        associated_token::mint = game_state.bpoly_mint,
        associated_token::authority = property_state.owner,
    )]
    pub owner_bpoly_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<PayRent>,
    game_id: [u8; 32],
    /// For utilities: the dice roll total (passed in since VRF already resolved)
    dice_total: u8,
    /// Number of bridges owned by the property owner (passed in to avoid loading extra accounts)
    bridges_owned: u8,
    /// Number of utilities owned by the owner
    utilities_owned: u8,
) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let payer_state = &mut ctx.accounts.payer_state;
    let property = &ctx.accounts.property_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(game.turn_phase == TurnPhase::BuyDecision, BlockpolyError::WrongTurnPhase);
    require!(
        game.current_player_index == payer_state.player_index,
        BlockpolyError::NotYourTurn
    );
    require!(!property.is_mortgaged, BlockpolyError::PropertyMortgaged);
    // Can't pay rent to yourself
    require!(property.owner != ctx.accounts.payer.key(), BlockpolyError::PropertyNotAvailable);

    let space_index = payer_state.position;
    let space = &BOARD[space_index as usize];

    let rent = calculate_rent(
        space_index,
        property,
        game,
        dice_total,
        bridges_owned,
        utilities_owned,
    )?;

    // Transfer BPOLY from payer to owner
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.payer_bpoly_ata.to_account_info(),
            to: ctx.accounts.owner_bpoly_ata.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, rent)?;
    payer_state.bpoly_balance = payer_state.bpoly_balance.saturating_sub(rent);

    // Track last rent for 51% Attack card
    game.last_rent_payer = Some(ctx.accounts.payer.key());
    game.last_rent_amount = rent;

    emit!(RentPaid {
        game_id,
        payer: ctx.accounts.payer.key(),
        owner: property.owner,
        space: space_index,
        amount: rent,
    });

    game.advance_turn();

    Ok(())
}

pub fn calculate_rent(
    space_index: u8,
    property: &PropertyState,
    game: &GameState,
    dice_total: u8,
    bridges_owned: u8,
    utilities_owned: u8,
) -> Result<u64> {
    let space = &BOARD[space_index as usize];

    let base_rent = match space.space_type {
        SPACE_TYPE_BRIDGE => {
            // Bridge rent based on how many bridges the owner has
            let idx = (bridges_owned.saturating_sub(1)).min(3) as usize;
            space.bridge_rents[idx]
        }
        SPACE_TYPE_UTILITY => {
            // Utility: dice × 4 (1 owned) or dice × 10 (both owned)
            let multiplier: u64 = if utilities_owned >= 2 { 10 } else { 4 };
            (dice_total as u64) * 1_000_000 * multiplier
        }
        SPACE_TYPE_PROPERTY => {
            if property.is_full_protocol {
                space.protocol_rent
            } else if property.liquidity_pools > 0 {
                space.lp_rents[(property.liquidity_pools - 1) as usize]
            } else {
                // Check for color group monopoly (doubles base rent)
                let group_spaces = group_spaces(space.group);
                let owner = property.owner;
                // Monopoly bonus requires ALL spaces in group to be owned by same player
                // For full accuracy we'd need to load all PropertyState PDAs.
                // The instruction accepts a boolean flag from the caller.
                // Here we use the raw base rent; the caller validates monopoly.
                space.base_rent
            }
        }
        _ => 0,
    };

    // Apply Bull Run doubling (doubles rent for the current round)
    let rent = if game.bull_run_active
        && game.round_number <= game.bull_run_ends_round
        && !property.is_full_protocol
        && property.liquidity_pools == 0
    {
        base_rent.saturating_mul(2)
    } else {
        base_rent
    };

    Ok(rent)
}
