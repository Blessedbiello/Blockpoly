use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::PlayerJoined;
use crate::state::{GameState, GameStatus, PlayerState, PlayerStatus};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        init,
        payer = player,
        space = PlayerState::MAX_SIZE,
        seeds = [SEED_PLAYER_STATE, &game_id, player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,

    /// Player's BPOLY token account (receives starting balance)
    #[account(
        init_if_needed,
        payer = player,
        associated_token::mint = bpoly_mint,
        associated_token::authority = player,
    )]
    pub player_bpoly_ata: Account<'info, TokenAccount>,

    #[account(address = game_state.bpoly_mint)]
    pub bpoly_mint: Account<'info, Mint>,

    /// Bank vault PDA (signs BPOLY transfer)
    /// CHECK: seeds verified
    #[account(
        seeds = [SEED_BANK_VAULT, &game_id],
        bump
    )]
    pub bank_vault: UncheckedAccount<'info>,

    #[account(
        mut,
        address = game_state.bank_bpoly_ata,
    )]
    pub bank_bpoly_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<JoinGame>, game_id: [u8; 32]) -> Result<()> {
    let game = &mut ctx.accounts.game_state;

    require!(game.status == GameStatus::WaitingForPlayers, BlockpolyError::GameNotWaiting);
    require!((game.player_count as usize) < game.max_players as usize, BlockpolyError::GameFull);

    let player_key = ctx.accounts.player.key();
    require!(!game.players.contains(&player_key), BlockpolyError::AlreadyJoined);

    let player_index = game.player_count;
    game.players.push(player_key);
    game.player_count += 1;

    // Initialize PlayerState
    let ps = &mut ctx.accounts.player_state;
    ps.game = game.key();
    ps.wallet = player_key;
    ps.player_index = player_index;
    ps.status = PlayerStatus::Active;
    ps.position = 0;
    ps.doubles_streak = 0;
    ps.rugpull_turns_remaining = 0;
    ps.has_jail_free_card = false;
    ps.jail_free_card_type = 0;
    ps.properties_owned = Vec::new();
    ps.flash_loan_active = false;
    ps.flash_loan_repay_amount = 0;
    ps.flash_loan_due_turn = 0;
    ps.is_bankrupt = false;
    ps.bpoly_balance = STARTING_BALANCE;
    ps.bump = ctx.bumps.player_state;

    // Transfer starting balance from bank to player
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
    token::transfer(cpi_ctx, STARTING_BALANCE)?;

    emit!(PlayerJoined {
        game_id,
        player: player_key,
        player_index,
    });

    Ok(())
}
