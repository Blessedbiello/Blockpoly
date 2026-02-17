use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::GameCreated;
use crate::state::{GameState, GameStatus, TurnPhase};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32], max_players: u8)]
pub struct InitializeGame<'info> {
    #[account(mut)]
    pub host: Signer<'info>,

    #[account(
        init,
        payer = host,
        space = GameState::MAX_SIZE,
        seeds = [SEED_GAME_STATE, &game_id],
        bump
    )]
    pub game_state: Account<'info, GameState>,

    /// BPOLY SPL token mint (must be pre-created)
    pub bpoly_mint: Account<'info, Mint>,

    /// Bank vault PDA — holds BPOLY during the game
    /// CHECK: PDA owned by program, used as ATA authority
    #[account(
        seeds = [SEED_BANK_VAULT, &game_id],
        bump
    )]
    pub bank_vault: UncheckedAccount<'info>,

    /// Bank's BPOLY associated token account
    #[account(
        init,
        payer = host,
        associated_token::mint = bpoly_mint,
        associated_token::authority = bank_vault,
    )]
    pub bank_bpoly_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeGame>,
    game_id: [u8; 32],
    max_players: u8,
    entry_fee_lamports: u64,
    nft_collection: Pubkey,
) -> Result<()> {
    require!(
        max_players >= 2 && max_players <= MAX_PLAYERS,
        BlockpolyError::InvalidPlayerCount
    );

    let game = &mut ctx.accounts.game_state;
    game.game_id = game_id;
    game.host = ctx.accounts.host.key();
    game.status = GameStatus::WaitingForPlayers;
    game.turn_phase = TurnPhase::RollDice;
    game.current_player_index = 0;
    game.turn_number = 0;
    game.round_number = 0;
    game.players = Vec::new();
    game.player_count = 0;
    game.max_players = max_players;
    game.vrf_request = None;
    game.pending_dice = None;
    game.alpha_call_deck = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    game.alpha_call_index = 0;
    game.governance_deck = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    game.governance_index = 0;
    game.bull_run_active = false;
    game.bull_run_ends_round = 0;
    game.auction_space = None;
    game.auction_highest_bid = 0;
    game.auction_highest_bidder = None;
    game.auction_end_turn = 0;
    game.prize_pool_lamports = entry_fee_lamports;
    game.winner = None;
    game.nft_collection = nft_collection;
    game.bpoly_mint = ctx.accounts.bpoly_mint.key();
    game.bank_bpoly_ata = ctx.accounts.bank_bpoly_ata.key();
    game.last_rent_payer = None;
    game.last_rent_amount = 0;
    game.bump = ctx.bumps.game_state;

    emit!(GameCreated {
        game_id,
        host: ctx.accounts.host.key(),
        max_players,
    });

    Ok(())
}
