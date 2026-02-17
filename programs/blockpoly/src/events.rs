use anchor_lang::prelude::*;

#[event]
pub struct GameCreated {
    pub game_id: [u8; 32],
    pub host: Pubkey,
    pub max_players: u8,
}

#[event]
pub struct PlayerJoined {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub player_index: u8,
}

#[event]
pub struct GameStarted {
    pub game_id: [u8; 32],
    pub player_count: u8,
}

#[event]
pub struct DiceRolled {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub die1: u8,
    pub die2: u8,
    pub new_position: u8,
    pub passed_genesis: bool,
}

#[event]
pub struct PropertyPurchased {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub space: u8,
    pub price: u64,
    pub nft_asset: Pubkey,
}

#[event]
pub struct RentPaid {
    pub game_id: [u8; 32],
    pub payer: Pubkey,
    pub owner: Pubkey,
    pub space: u8,
    pub amount: u64,
}

#[event]
pub struct LPBuilt {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub space: u8,
    pub lp_count: u8,
}

#[event]
pub struct ProtocolBuilt {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub space: u8,
}

#[event]
pub struct LPSold {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub space: u8,
    pub lp_count: u8,
}

#[event]
pub struct CardDrawn {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub deck: u8, // 0 = alpha_call, 1 = governance
    pub card_id: u8,
}

#[event]
pub struct CardResolved {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub card_id: u8,
    pub effect: String,
}

#[event]
pub struct RugPullEntered {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub reason: u8, // 0 = SEC Investigation space, 1 = card, 2 = triple doubles
}

#[event]
pub struct RugPullExited {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub method: u8, // 0 = bail, 1 = jail-free card, 2 = doubles
}

#[event]
pub struct PropertyMortgaged {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub space: u8,
    pub amount_received: u64,
}

#[event]
pub struct PropertyUnmortgaged {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub space: u8,
    pub amount_paid: u64,
}

#[event]
pub struct PlayerBankrupted {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub creditor: Option<Pubkey>, // None = bank
}

#[event]
pub struct GameWon {
    pub game_id: [u8; 32],
    pub winner: Pubkey,
    pub prize_lamports: u64,
}

#[event]
pub struct TradeProposed {
    pub game_id: [u8; 32],
    pub proposer: Pubkey,
    pub recipient: Pubkey,
    pub offered_properties: Vec<u8>,
    pub offered_bpoly: u64,
    pub requested_properties: Vec<u8>,
    pub requested_bpoly: u64,
}

#[event]
pub struct TradeCompleted {
    pub game_id: [u8; 32],
    pub proposer: Pubkey,
    pub recipient: Pubkey,
}

#[event]
pub struct TradeRejected {
    pub game_id: [u8; 32],
    pub proposer: Pubkey,
    pub recipient: Pubkey,
}

#[event]
pub struct AuctionStarted {
    pub game_id: [u8; 32],
    pub space: u8,
    pub starting_bid: u64,
}

#[event]
pub struct AuctionBid {
    pub game_id: [u8; 32],
    pub bidder: Pubkey,
    pub space: u8,
    pub amount: u64,
}

#[event]
pub struct AuctionWon {
    pub game_id: [u8; 32],
    pub winner: Pubkey,
    pub space: u8,
    pub amount: u64,
}

#[event]
pub struct BullRunActivated {
    pub game_id: [u8; 32],
    pub ends_round: u32,
}

#[event]
pub struct TaxPaid {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub space: u8,
    pub amount: u64,
}

#[event]
pub struct VrfRequested {
    pub game_id: [u8; 32],
    pub player: Pubkey,
    pub vrf_account: Pubkey,
}
