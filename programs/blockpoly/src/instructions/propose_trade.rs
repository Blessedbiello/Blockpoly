use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::TradeProposed;
use crate::state::{GameState, GameStatus, PlayerState, TradeOffer};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct ProposeTrade<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        seeds = [SEED_PLAYER_STATE, &game_id, proposer.key().as_ref()],
        bump = proposer_state.bump,
        constraint = proposer_state.wallet == proposer.key() @ BlockpolyError::NotPropertyOwner,
    )]
    pub proposer_state: Account<'info, PlayerState>,

    #[account(
        init,
        payer = proposer,
        space = TradeOffer::MAX_SIZE,
        seeds = [SEED_TRADE_OFFER, &game_id, proposer.key().as_ref()],
        bump
    )]
    pub trade_offer: Account<'info, TradeOffer>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<ProposeTrade>,
    game_id: [u8; 32],
    recipient: Pubkey,
    offered_properties: Vec<u8>,
    offered_bpoly: u64,
    requested_properties: Vec<u8>,
    requested_bpoly: u64,
    offered_jail_free: bool,
    requested_jail_free: bool,
) -> Result<()> {
    let game = &ctx.accounts.game_state;
    let proposer_state = &ctx.accounts.proposer_state;
    let trade = &mut ctx.accounts.trade_offer;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(!proposer_state.is_bankrupt, BlockpolyError::PlayerBankrupt);
    require!(game.players.contains(&recipient), BlockpolyError::RecipientNotInGame);

    // Validate proposer owns offered properties
    for &prop in &offered_properties {
        require!(proposer_state.owns_property(prop), BlockpolyError::NotPropertyOwner);
    }

    if offered_jail_free {
        require!(proposer_state.has_jail_free_card, BlockpolyError::InvalidTradeOffer);
    }

    trade.game = game.key();
    trade.proposer = ctx.accounts.proposer.key();
    trade.recipient = recipient;
    trade.offered_properties = offered_properties.clone();
    trade.offered_bpoly = offered_bpoly;
    trade.requested_properties = requested_properties.clone();
    trade.requested_bpoly = requested_bpoly;
    trade.expires_turn = game.turn_number + 10; // valid for 10 turns
    trade.offered_jail_free = offered_jail_free;
    trade.requested_jail_free = requested_jail_free;
    trade.bump = ctx.bumps.trade_offer;

    emit!(TradeProposed {
        game_id,
        proposer: ctx.accounts.proposer.key(),
        recipient,
        offered_properties,
        offered_bpoly,
        requested_properties,
        requested_bpoly,
    });

    Ok(())
}
