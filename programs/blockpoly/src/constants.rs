/// PDA seeds
pub const SEED_GAME_STATE: &[u8] = b"game_state";
pub const SEED_PLAYER_STATE: &[u8] = b"player_state";
pub const SEED_PROPERTY_STATE: &[u8] = b"property_state";
pub const SEED_TRADE_OFFER: &[u8] = b"trade_offer";
pub const SEED_BANK_VAULT: &[u8] = b"bank_vault";

/// Game parameters
pub const MAX_PLAYERS: u8 = 8;
pub const BOARD_SIZE: u8 = 40;
pub const STARTING_BALANCE: u64 = 1_500_000_000; // 1500 BPOLY (6 decimals)
pub const GENESIS_SALARY: u64 = 200_000_000;     // 200 BPOLY
pub const BPOLY_DECIMALS: u8 = 6;

/// Rug Pull (Jail) constants
pub const RUGPULL_MAX_TURNS: u8 = 3;
pub const RUGPULL_BAIL_AMOUNT: u64 = 50_000_000; // 50 BPOLY

/// Tax amounts
pub const GAS_FEE_TAX: u64 = 200_000_000;   // space 4: 200 BPOLY
pub const PROTOCOL_FEE_TAX: u64 = 100_000_000; // space 38: 100 BPOLY

/// Flash loan parameters
pub const FLASH_LOAN_AMOUNT: u64 = 200_000_000;   // 200 BPOLY
pub const FLASH_LOAN_REPAY: u64 = 210_000_000;    // 210 BPOLY
pub const FLASH_LOAN_PENALTY: u64 = 50_000_000;   // 50 BPOLY late penalty

/// Card deck sizes
pub const ALPHA_CALL_DECK_SIZE: u8 = 16;
pub const GOVERNANCE_DECK_SIZE: u8 = 16;

/// Auction parameters
pub const AUCTION_DURATION_TURNS: u32 = 3;

/// Board space indices
pub const SPACE_GENESIS: u8 = 0;
pub const SPACE_RUGPULL_ZONE: u8 = 10;
pub const SPACE_DEFI_SUMMER: u8 = 20;
pub const SPACE_SEC_INVESTIGATION: u8 = 30;

/// Space types
pub const SPACE_TYPE_PROPERTY: u8 = 0;
pub const SPACE_TYPE_CARD_ALPHA: u8 = 1;
pub const SPACE_TYPE_CARD_GOVERNANCE: u8 = 2;
pub const SPACE_TYPE_TAX: u8 = 3;
pub const SPACE_TYPE_BRIDGE: u8 = 4;
pub const SPACE_TYPE_UTILITY: u8 = 5;
pub const SPACE_TYPE_RUGPULL: u8 = 6;
pub const SPACE_TYPE_GO_TO_JAIL: u8 = 7;
pub const SPACE_TYPE_FREE_PARKING: u8 = 8;
pub const SPACE_TYPE_GENESIS: u8 = 9;

/// Color groups
pub const GROUP_BROWN: u8 = 0;
pub const GROUP_LIGHT_BLUE: u8 = 1;
pub const GROUP_PINK: u8 = 2;
pub const GROUP_ORANGE: u8 = 3;
pub const GROUP_RED: u8 = 4;
pub const GROUP_YELLOW: u8 = 5;
pub const GROUP_GREEN: u8 = 6;
pub const GROUP_DARK_BLUE: u8 = 7;
pub const GROUP_BRIDGE: u8 = 8;
pub const GROUP_UTILITY: u8 = 9;
pub const GROUP_NONE: u8 = 255;

/// Building costs per group (in BPOLY micro-units)
pub const LP_COST_BROWN: u64 = 50_000_000;
pub const LP_COST_LIGHT_BLUE: u64 = 50_000_000;
pub const LP_COST_PINK: u64 = 100_000_000;
pub const LP_COST_ORANGE: u64 = 100_000_000;
pub const LP_COST_RED: u64 = 150_000_000;
pub const LP_COST_YELLOW: u64 = 150_000_000;
pub const LP_COST_GREEN: u64 = 200_000_000;
pub const LP_COST_DARK_BLUE: u64 = 200_000_000;
