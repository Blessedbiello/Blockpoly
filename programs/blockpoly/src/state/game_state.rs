use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GameState {
    /// Unique game identifier
    pub game_id: [u8; 32],
    /// Host wallet
    pub host: Pubkey,
    /// Current game status
    pub status: GameStatus,
    /// Current turn phase
    pub turn_phase: TurnPhase,
    /// Index of the player whose turn it is
    pub current_player_index: u8,
    /// Total turns elapsed
    pub turn_number: u32,
    /// Full round number (increments when all players have gone)
    pub round_number: u32,
    /// Ordered list of player wallets
    pub players: Vec<Pubkey>,
    pub player_count: u8,
    pub max_players: u8,

    /// Switchboard VRF request account (Some while awaiting randomness)
    pub vrf_request: Option<Pubkey>,
    /// Dice result set by consume_randomness callback
    pub pending_dice: Option<[u8; 2]>,

    /// Alpha Call deck (shuffled indices 0-15)
    pub alpha_call_deck: [u8; 16],
    pub alpha_call_index: u8,
    /// Governance Vote deck (shuffled indices 0-15)
    pub governance_deck: [u8; 16],
    pub governance_index: u8,

    /// Global effect: bull run doubles rent
    pub bull_run_active: bool,
    pub bull_run_ends_round: u32,

    /// Inline auction state (avoids extra PDA)
    pub auction_space: Option<u8>,
    pub auction_highest_bid: u64,
    pub auction_highest_bidder: Option<Pubkey>,
    pub auction_end_turn: u32,

    /// SOL prize pool (entry fees)
    pub prize_pool_lamports: u64,
    /// Winner, set on game end
    pub winner: Option<Pubkey>,

    /// Metaplex Core collection address
    pub nft_collection: Pubkey,
    /// BPOLY SPL token mint
    pub bpoly_mint: Pubkey,
    /// Bank's BPOLY associated token account
    pub bank_bpoly_ata: Pubkey,

    /// Last rent payment amount (for 51% Attack card)
    pub last_rent_payer: Option<Pubkey>,
    pub last_rent_amount: u64,

    pub bump: u8,
}

impl GameState {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 +        // game_id
        32 +        // host
        1 +         // status
        1 +         // turn_phase
        1 +         // current_player_index
        4 +         // turn_number
        4 +         // round_number
        4 + 8 * 32 + // players vec
        1 +         // player_count
        1 +         // max_players
        1 + 32 +    // vrf_request Option<Pubkey>
        1 + 2 +     // pending_dice Option<[u8;2]>
        16 +        // alpha_call_deck
        1 +         // alpha_call_index
        16 +        // governance_deck
        1 +         // governance_index
        1 +         // bull_run_active
        4 +         // bull_run_ends_round
        1 + 1 +     // auction_space Option<u8>
        8 +         // auction_highest_bid
        1 + 32 +    // auction_highest_bidder Option<Pubkey>
        4 +         // auction_end_turn
        8 +         // prize_pool_lamports
        1 + 32 +    // winner Option<Pubkey>
        32 +        // nft_collection
        32 +        // bpoly_mint
        32 +        // bank_bpoly_ata
        1 + 32 +    // last_rent_payer
        8 +         // last_rent_amount
        1;          // bump

    pub fn current_player(&self) -> Option<Pubkey> {
        self.players.get(self.current_player_index as usize).copied()
    }

    pub fn advance_turn(&mut self) {
        self.turn_number += 1;
        let next = (self.current_player_index + 1) % self.player_count;
        if next == 0 {
            self.round_number += 1;
        }
        self.current_player_index = next;
        self.turn_phase = TurnPhase::RollDice;
        self.pending_dice = None;
    }

    pub fn next_alpha_card(&mut self) -> u8 {
        let card = self.alpha_call_deck[self.alpha_call_index as usize];
        self.alpha_call_index = (self.alpha_call_index + 1) % 16;
        card
    }

    pub fn next_governance_card(&mut self) -> u8 {
        let card = self.governance_deck[self.governance_index as usize];
        self.governance_index = (self.governance_index + 1) % 16;
        card
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum GameStatus {
    #[default]
    WaitingForPlayers,
    InProgress,
    Finished,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum TurnPhase {
    #[default]
    RollDice,
    AwaitingVRF,
    LandingEffect,
    DrawCard,
    RugPullDecision,
    AuctionPhase,
    BuyDecision,
    Finished,
}
