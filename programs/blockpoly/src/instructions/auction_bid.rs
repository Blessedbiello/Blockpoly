use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::constants::*;
use crate::errors::BlockpolyError;
use crate::events::{AuctionBid, AuctionWon};
use crate::state::{GameState, GameStatus, PlayerState, PropertyState, TurnPhase};

#[derive(Accounts)]
#[instruction(game_id: [u8; 32], space_index: u8)]
pub struct AuctionBidAccounts<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GAME_STATE, &game_id],
        bump = game_state.bump,
    )]
    pub game_state: Account<'info, GameState>,

    #[account(
        mut,
        seeds = [SEED_PLAYER_STATE, &game_id, bidder.key().as_ref()],
        bump = bidder_state.bump,
    )]
    pub bidder_state: Account<'info, PlayerState>,

    /// Lazily initialized on auction win (not on bid)
    #[account(
        init_if_needed,
        payer = bidder,
        space = PropertyState::MAX_SIZE,
        seeds = [SEED_PROPERTY_STATE, &game_id, &[space_index]],
        bump
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
        associated_token::authority = bidder,
    )]
    pub bidder_bpoly_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<AuctionBidAccounts>,
    game_id: [u8; 32],
    space_index: u8,
    bid_amount: u64,
    nft_asset: Pubkey,
) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let bidder_state = &mut ctx.accounts.bidder_state;
    let property = &mut ctx.accounts.property_state;

    require!(game.status == GameStatus::InProgress, BlockpolyError::GameNotStarted);
    require!(game.turn_phase == TurnPhase::AuctionPhase, BlockpolyError::AuctionNotActive);
    require!(game.auction_space == Some(space_index), BlockpolyError::AuctionNotActive);
    require!(bid_amount > game.auction_highest_bid, BlockpolyError::BidTooLow);
    require!(!bidder_state.is_bankrupt, BlockpolyError::PlayerBankrupt);

    // Check auction hasn't expired
    if game.turn_number > game.auction_end_turn {
        // Auction expired: finalize it
        finalize_auction(ctx, game_id, space_index, nft_asset)?;
        return Ok(());
    }

    game.auction_highest_bid = bid_amount;
    game.auction_highest_bidder = Some(ctx.accounts.bidder.key());
    // Extend deadline on new bid
    game.auction_end_turn = game.turn_number + AUCTION_DURATION_TURNS;

    emit!(AuctionBid {
        game_id,
        bidder: ctx.accounts.bidder.key(),
        space: space_index,
        amount: bid_amount,
    });

    Ok(())
}

fn finalize_auction<'info>(
    ctx: Context<AuctionBidAccounts<'info>>,
    game_id: [u8; 32],
    space_index: u8,
    nft_asset: Pubkey,
) -> Result<()> {
    let game = &mut ctx.accounts.game_state;
    let bidder_state = &mut ctx.accounts.bidder_state;
    let property = &mut ctx.accounts.property_state;

    if let Some(winner) = game.auction_highest_bidder {
        if winner == ctx.accounts.bidder.key() {
            let win_amount = game.auction_highest_bid;
            // Transfer bid from winner to bank
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bidder_bpoly_ata.to_account_info(),
                    to: ctx.accounts.bank_bpoly_ata.to_account_info(),
                    authority: ctx.accounts.bidder.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, win_amount)?;
            bidder_state.bpoly_balance = bidder_state.bpoly_balance.saturating_sub(win_amount);

            // Initialize PropertyState for winner
            property.game = game.key();
            property.space_index = space_index;
            property.owner = winner;
            property.liquidity_pools = 0;
            property.is_full_protocol = false;
            property.is_mortgaged = false;
            property.nft_asset = nft_asset;
            property.bump = ctx.bumps.property_state;
            bidder_state.add_property(space_index);

            emit!(AuctionWon {
                game_id,
                winner,
                space: space_index,
                amount: win_amount,
            });
        }
    }

    // Clear auction state
    game.auction_space = None;
    game.auction_highest_bid = 0;
    game.auction_highest_bidder = None;
    game.auction_end_turn = 0;
    game.advance_turn();

    Ok(())
}
