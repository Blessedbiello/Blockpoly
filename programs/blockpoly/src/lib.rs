use anchor_lang::prelude::*;

pub mod board;
pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("AicXQXhiHgzaxTXpbxYEriXSQdBRQNbqWgcMU1N57q9n");

#[program]
pub mod blockpoly {
    use super::*;

    // ── Game lifecycle ────────────────────────────────────────────────────────

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        game_id: [u8; 32],
        max_players: u8,
        entry_fee_lamports: u64,
        nft_collection: Pubkey,
    ) -> Result<()> {
        initialize_game::handler(ctx, game_id, max_players, entry_fee_lamports, nft_collection)
    }

    pub fn join_game(ctx: Context<JoinGame>, game_id: [u8; 32]) -> Result<()> {
        join_game::handler(ctx, game_id)
    }

    pub fn start_game(
        ctx: Context<StartGame>,
        game_id: [u8; 32],
        shuffle_seed: [u8; 32],
    ) -> Result<()> {
        start_game::handler(ctx, game_id, shuffle_seed)
    }

    // ── Dice & movement ────────────────────────────────────────────────────────

    pub fn request_dice_roll(ctx: Context<RequestDiceRoll>, game_id: [u8; 32]) -> Result<()> {
        request_dice_roll::handler(ctx, game_id)
    }

    pub fn consume_randomness(
        ctx: Context<ConsumeRandomness>,
        game_id: [u8; 32],
        random_bytes: [u8; 32],
    ) -> Result<()> {
        consume_randomness::handler(ctx, game_id, random_bytes)
    }

    pub fn resolve_landing(ctx: Context<ResolveLanding>, game_id: [u8; 32]) -> Result<()> {
        resolve_landing::handler(ctx, game_id)
    }

    // ── Property actions ───────────────────────────────────────────────────────

    pub fn buy_property(
        ctx: Context<BuyProperty>,
        game_id: [u8; 32],
        space_index: u8,
        nft_asset: Pubkey,
    ) -> Result<()> {
        buy_property::handler(ctx, game_id, space_index, nft_asset)
    }

    pub fn decline_buy(ctx: Context<DeclineBuy>, game_id: [u8; 32]) -> Result<()> {
        decline_buy::handler(ctx, game_id)
    }

    pub fn auction_bid(
        ctx: Context<AuctionBidAccounts>,
        game_id: [u8; 32],
        space_index: u8,
        bid_amount: u64,
        nft_asset: Pubkey,
    ) -> Result<()> {
        auction_bid::handler(ctx, game_id, space_index, bid_amount, nft_asset)
    }

    pub fn pay_rent(
        ctx: Context<PayRent>,
        game_id: [u8; 32],
        dice_total: u8,
        bridges_owned: u8,
        utilities_owned: u8,
    ) -> Result<()> {
        pay_rent::handler(ctx, game_id, dice_total, bridges_owned, utilities_owned)
    }

    // ── Building ───────────────────────────────────────────────────────────────

    pub fn build_lp(
        ctx: Context<BuildLP>,
        game_id: [u8; 32],
        space_index: u8,
        sibling_lp_counts: Vec<u8>,
    ) -> Result<()> {
        build_lp::handler(ctx, game_id, space_index, sibling_lp_counts)
    }

    pub fn build_protocol(
        ctx: Context<BuildProtocol>,
        game_id: [u8; 32],
        space_index: u8,
    ) -> Result<()> {
        build_protocol::handler(ctx, game_id, space_index)
    }

    pub fn sell_lp(ctx: Context<SellLP>, game_id: [u8; 32], space_index: u8) -> Result<()> {
        sell_lp::handler(ctx, game_id, space_index)
    }

    // ── Cards ─────────────────────────────────────────────────────────────────

    pub fn draw_card(ctx: Context<DrawCard>, game_id: [u8; 32]) -> Result<(u8, u8)> {
        draw_card::handler(ctx, game_id)
    }

    pub fn resolve_card(
        ctx: Context<ResolveCard>,
        game_id: [u8; 32],
        deck_type: u8,
        card_id: u8,
        extra_param: u64,
    ) -> Result<()> {
        resolve_card::handler(ctx, game_id, deck_type, card_id, extra_param)
    }

    // ── Rug Pull Zone ─────────────────────────────────────────────────────────

    pub fn rugpull_pay_bail(ctx: Context<HandleRugPull>, game_id: [u8; 32]) -> Result<()> {
        handle_rugpull::handler_pay_bail(ctx, game_id)
    }

    pub fn rugpull_use_jail_free_card(
        ctx: Context<HandleRugPull>,
        game_id: [u8; 32],
    ) -> Result<()> {
        handle_rugpull::handler_use_jail_free_card(ctx, game_id)
    }

    pub fn rugpull_attempt_doubles(
        ctx: Context<HandleRugPull>,
        game_id: [u8; 32],
    ) -> Result<()> {
        handle_rugpull::handler_attempt_doubles(ctx, game_id)
    }

    // ── Mortgage ──────────────────────────────────────────────────────────────

    pub fn mortgage_property(
        ctx: Context<MortgageProperty>,
        game_id: [u8; 32],
        space_index: u8,
    ) -> Result<()> {
        mortgage_property::handler(ctx, game_id, space_index)
    }

    pub fn unmortgage_property(
        ctx: Context<UnmortgageProperty>,
        game_id: [u8; 32],
        space_index: u8,
    ) -> Result<()> {
        unmortgage_property::handler(ctx, game_id, space_index)
    }

    // ── Trading ───────────────────────────────────────────────────────────────

    pub fn propose_trade(
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
        propose_trade::handler(
            ctx,
            game_id,
            recipient,
            offered_properties,
            offered_bpoly,
            requested_properties,
            requested_bpoly,
            offered_jail_free,
            requested_jail_free,
        )
    }

    pub fn accept_trade(ctx: Context<AcceptTrade>, game_id: [u8; 32]) -> Result<()> {
        accept_trade::handler(ctx, game_id)
    }

    pub fn reject_trade(ctx: Context<RejectTrade>, game_id: [u8; 32]) -> Result<()> {
        reject_trade::handler(ctx, game_id)
    }

    // ── End game ──────────────────────────────────────────────────────────────

    pub fn declare_bankruptcy(
        ctx: Context<DeclareBankruptcy>,
        game_id: [u8; 32],
        creditor: Option<Pubkey>,
    ) -> Result<()> {
        declare_bankruptcy::handler(ctx, game_id, creditor)
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>, game_id: [u8; 32]) -> Result<()> {
        claim_prize::handler(ctx, game_id)
    }
}
