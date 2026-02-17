use anchor_lang::prelude::*;

/// Lazily initialized on first purchase. Absence = bank-owned.
#[account]
#[derive(Default)]
pub struct PropertyState {
    /// Reference to the game
    pub game: Pubkey,
    /// Board space index (0–39)
    pub space_index: u8,
    /// Current owner
    pub owner: Pubkey,
    /// Number of Liquidity Pools built (0–4)
    pub liquidity_pools: u8,
    /// Whether the property has reached Full Protocol status
    pub is_full_protocol: bool,
    /// Whether the property is mortgaged
    pub is_mortgaged: bool,
    /// Metaplex Core asset address
    pub nft_asset: Pubkey,
    pub bump: u8,
}

impl PropertyState {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 +  // game
        1 +   // space_index
        32 +  // owner
        1 +   // liquidity_pools
        1 +   // is_full_protocol
        1 +   // is_mortgaged
        32 +  // nft_asset
        1;    // bump

    pub fn has_buildings(&self) -> bool {
        self.liquidity_pools > 0 || self.is_full_protocol
    }

    pub fn can_build_lp(&self) -> bool {
        !self.is_mortgaged && !self.is_full_protocol && self.liquidity_pools < 4
    }

    pub fn can_upgrade_protocol(&self) -> bool {
        !self.is_mortgaged && !self.is_full_protocol && self.liquidity_pools == 4
    }
}
