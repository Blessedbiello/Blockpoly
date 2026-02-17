use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct PlayerState {
    /// Reference to the game
    pub game: Pubkey,
    /// Player's wallet
    pub wallet: Pubkey,
    /// Index in GameState.players
    pub player_index: u8,
    /// Player lifecycle status
    pub status: PlayerStatus,
    /// Current board position (0–39)
    pub position: u8,
    /// Number of consecutive doubles this turn
    pub doubles_streak: u8,
    /// Turns remaining in Rug Pull Zone (0 = not in jail)
    pub rugpull_turns_remaining: u8,
    /// Holds a "Get Out of Rug Pull Free" card
    pub has_jail_free_card: bool,
    /// Which deck the card came from: 0=none, 1=alpha_call, 2=governance
    pub jail_free_card_type: u8,
    /// Space indices of owned properties (max 28 purchasable spaces)
    pub properties_owned: Vec<u8>,
    /// Flash loan tracking
    pub flash_loan_active: bool,
    pub flash_loan_repay_amount: u64,
    pub flash_loan_due_turn: u32,
    /// Set to true once player is eliminated
    pub is_bankrupt: bool,
    /// BPOLY balance mirror (authoritative copy is the ATA; this for quick reads)
    pub bpoly_balance: u64,
    pub bump: u8,
}

impl PlayerState {
    pub const MAX_SIZE: usize = 8 +  // discriminator
        32 +        // game
        32 +        // wallet
        1 +         // player_index
        1 +         // status
        1 +         // position
        1 +         // doubles_streak
        1 +         // rugpull_turns_remaining
        1 +         // has_jail_free_card
        1 +         // jail_free_card_type
        4 + 28 +    // properties_owned vec (max 28)
        1 +         // flash_loan_active
        8 +         // flash_loan_repay_amount
        4 +         // flash_loan_due_turn
        1 +         // is_bankrupt
        8 +         // bpoly_balance
        1;          // bump

    pub fn is_in_rugpull(&self) -> bool {
        self.rugpull_turns_remaining > 0
    }

    pub fn owns_property(&self, space: u8) -> bool {
        self.properties_owned.contains(&space)
    }

    pub fn add_property(&mut self, space: u8) {
        if !self.owns_property(space) {
            self.properties_owned.push(space);
        }
    }

    pub fn remove_property(&mut self, space: u8) {
        self.properties_owned.retain(|&s| s != space);
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum PlayerStatus {
    #[default]
    Active,
    InRugPullZone,
    Bankrupt,
}
