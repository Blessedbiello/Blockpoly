use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::TradeRejected;
use crate::state::{GameState, PlayerState, TradeOffer};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32])]
pub struct RejectTrade<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        seeds = [SEED_PLAYER_STATE, &game_id, recipient.key().as_ref()],
        bump = recipient_state.bump,
        constraint = recipient_state.wallet == recipient.key() @ BlockpolyError::InvalidTradeOffer,
    )]
    pub recipient_state: Account<'info, PlayerState>,

    #[account(
        mut,
        seeds = [SEED_TRADE_OFFER, &game_id, trade_offer.proposer.as_ref()],
        bump = trade_offer.bump,
        has_one = recipient @ BlockpolyError::InvalidTradeOffer,
        close = recipient
    )]
    pub trade_offer: Account<'info, TradeOffer>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RejectTrade>, game_id: [u8; 32]) -> Result<()> {
    let trade = &ctx.accounts.trade_offer;

    emit!(TradeRejected {
        game_id,
        proposer: trade.proposer,
        recipient: ctx.accounts.recipient.key(),
    });

    // Account closed via `close = recipient` constraint
    Ok(())
}
