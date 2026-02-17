use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct TradeOffer {
    /// Reference to the game
    pub game: Pubkey,
    /// Player proposing the trade
    pub proposer: Pubkey,
    /// Player receiving the trade offer
    pub recipient: Pubkey,
    /// Space indices of properties the proposer offers
    pub offered_properties: Vec<u8>,
    /// BPOLY offered by proposer (micro-units)
    pub offered_bpoly: u64,
    /// Space indices of properties requested from recipient
    pub requested_properties: Vec<u8>,
    /// BPOLY requested from recipient (micro-units)
    pub requested_bpoly: u64,
    /// Turn number when this offer expires
    pub expires_turn: u32,
    /// Whether a "Get Out of Rug Pull Free" card is offered
    pub offered_jail_free: bool,
    /// Whether a "Get Out of Rug Pull Free" card is requested
    pub requested_jail_free: bool,
    pub bump: u8,
}

impl TradeOffer {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 +        // game
        32 +        // proposer
        32 +        // recipient
        4 + 28 +    // offered_properties vec
        8 +         // offered_bpoly
        4 + 28 +    // requested_properties vec
        8 +         // requested_bpoly
        4 +         // expires_turn
        1 +         // offered_jail_free
        1 +         // requested_jail_free
        1;          // bump
}
