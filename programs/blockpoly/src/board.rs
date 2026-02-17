/// On-chain board definition for Blockpoly.
/// All BPOLY amounts are in micro-units (6 decimals).
/// 1 BPOLY = 1_000_000 micro-BPOLY.
use crate::constants::*;

/// Complete definition of a single board space.
#[derive(Clone)]
pub struct SpaceData {
    pub index: u8,
    pub name: &'static str,
    pub space_type: u8,
    pub group: u8,
    /// Purchase price (0 if not purchasable)
    pub price: u64,
    /// Base rent (unimproved, no monopoly)
    pub base_rent: u64,
    /// Rent with 1-4 LPs
    pub lp_rents: [u64; 4],
    /// Full Protocol rent
    pub protocol_rent: u64,
    /// Mortgage value (price / 2)
    pub mortgage_value: u64,
    /// Cost to build one LP
    pub lp_cost: u64,
    /// Bridge rents: [1 owned, 2 owned, 3 owned, 4 owned]
    pub bridge_rents: [u64; 4],
}

/// Scale a BPOLY value from display units to micro-units
const fn bpoly(n: u64) -> u64 {
    n * 1_000_000
}

pub const BOARD: [SpaceData; 40] = [
    // 0: Genesis Block (GO)
    SpaceData {
        index: 0, name: "Genesis Block", space_type: SPACE_TYPE_GENESIS, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 1: BONK (Brown)
    SpaceData {
        index: 1, name: "BONK", space_type: SPACE_TYPE_PROPERTY, group: GROUP_BROWN,
        price: bpoly(60), base_rent: bpoly(2),
        lp_rents: [bpoly(10), bpoly(30), bpoly(90), bpoly(160)],
        protocol_rent: bpoly(250), mortgage_value: bpoly(30), lp_cost: LP_COST_BROWN,
        bridge_rents: [0; 4],
    },
    // 2: Alpha Call
    SpaceData {
        index: 2, name: "Alpha Call", space_type: SPACE_TYPE_CARD_ALPHA, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 3: dogwifhat (Brown)
    SpaceData {
        index: 3, name: "dogwifhat", space_type: SPACE_TYPE_PROPERTY, group: GROUP_BROWN,
        price: bpoly(60), base_rent: bpoly(4),
        lp_rents: [bpoly(20), bpoly(60), bpoly(180), bpoly(320)],
        protocol_rent: bpoly(450), mortgage_value: bpoly(30), lp_cost: LP_COST_BROWN,
        bridge_rents: [0; 4],
    },
    // 4: Gas Fees Tax
    SpaceData {
        index: 4, name: "Gas Fees Tax", space_type: SPACE_TYPE_TAX, group: GROUP_NONE,
        price: 0, base_rent: bpoly(200), lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 5: Wormhole (Bridge)
    SpaceData {
        index: 5, name: "Wormhole", space_type: SPACE_TYPE_BRIDGE, group: GROUP_BRIDGE,
        price: bpoly(200), base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: bpoly(100), lp_cost: 0,
        bridge_rents: [bpoly(25), bpoly(50), bpoly(100), bpoly(200)],
    },
    // 6: Pyth Network (Light Blue)
    SpaceData {
        index: 6, name: "Pyth Network", space_type: SPACE_TYPE_PROPERTY, group: GROUP_LIGHT_BLUE,
        price: bpoly(100), base_rent: bpoly(6),
        lp_rents: [bpoly(30), bpoly(90), bpoly(270), bpoly(400)],
        protocol_rent: bpoly(550), mortgage_value: bpoly(50), lp_cost: LP_COST_LIGHT_BLUE,
        bridge_rents: [0; 4],
    },
    // 7: Governance Vote
    SpaceData {
        index: 7, name: "Governance Vote", space_type: SPACE_TYPE_CARD_GOVERNANCE, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 8: Switchboard (Light Blue)
    SpaceData {
        index: 8, name: "Switchboard", space_type: SPACE_TYPE_PROPERTY, group: GROUP_LIGHT_BLUE,
        price: bpoly(100), base_rent: bpoly(6),
        lp_rents: [bpoly(30), bpoly(90), bpoly(270), bpoly(400)],
        protocol_rent: bpoly(550), mortgage_value: bpoly(50), lp_cost: LP_COST_LIGHT_BLUE,
        bridge_rents: [0; 4],
    },
    // 9: Clockwork (Light Blue)
    SpaceData {
        index: 9, name: "Clockwork", space_type: SPACE_TYPE_PROPERTY, group: GROUP_LIGHT_BLUE,
        price: bpoly(120), base_rent: bpoly(8),
        lp_rents: [bpoly(40), bpoly(100), bpoly(300), bpoly(450)],
        protocol_rent: bpoly(600), mortgage_value: bpoly(60), lp_cost: LP_COST_LIGHT_BLUE,
        bridge_rents: [0; 4],
    },
    // 10: Rug Pull Zone (Jail)
    SpaceData {
        index: 10, name: "Rug Pull Zone", space_type: SPACE_TYPE_RUGPULL, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 11: Solflare (Pink)
    SpaceData {
        index: 11, name: "Solflare", space_type: SPACE_TYPE_PROPERTY, group: GROUP_PINK,
        price: bpoly(140), base_rent: bpoly(10),
        lp_rents: [bpoly(50), bpoly(150), bpoly(450), bpoly(625)],
        protocol_rent: bpoly(750), mortgage_value: bpoly(70), lp_cost: LP_COST_PINK,
        bridge_rents: [0; 4],
    },
    // 12: QuickNode (Utility)
    SpaceData {
        index: 12, name: "QuickNode", space_type: SPACE_TYPE_UTILITY, group: GROUP_UTILITY,
        price: bpoly(150), base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: bpoly(75), lp_cost: 0, bridge_rents: [0; 4],
    },
    // 13: Phantom (Pink)
    SpaceData {
        index: 13, name: "Phantom", space_type: SPACE_TYPE_PROPERTY, group: GROUP_PINK,
        price: bpoly(140), base_rent: bpoly(10),
        lp_rents: [bpoly(50), bpoly(150), bpoly(450), bpoly(625)],
        protocol_rent: bpoly(750), mortgage_value: bpoly(70), lp_cost: LP_COST_PINK,
        bridge_rents: [0; 4],
    },
    // 14: Backpack (Pink)
    SpaceData {
        index: 14, name: "Backpack", space_type: SPACE_TYPE_PROPERTY, group: GROUP_PINK,
        price: bpoly(160), base_rent: bpoly(12),
        lp_rents: [bpoly(60), bpoly(180), bpoly(500), bpoly(700)],
        protocol_rent: bpoly(900), mortgage_value: bpoly(80), lp_cost: LP_COST_PINK,
        bridge_rents: [0; 4],
    },
    // 15: deBridge (Bridge)
    SpaceData {
        index: 15, name: "deBridge", space_type: SPACE_TYPE_BRIDGE, group: GROUP_BRIDGE,
        price: bpoly(200), base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: bpoly(100), lp_cost: 0,
        bridge_rents: [bpoly(25), bpoly(50), bpoly(100), bpoly(200)],
    },
    // 16: Metaplex (Orange)
    SpaceData {
        index: 16, name: "Metaplex", space_type: SPACE_TYPE_PROPERTY, group: GROUP_ORANGE,
        price: bpoly(180), base_rent: bpoly(14),
        lp_rents: [bpoly(70), bpoly(200), bpoly(550), bpoly(750)],
        protocol_rent: bpoly(950), mortgage_value: bpoly(90), lp_cost: LP_COST_ORANGE,
        bridge_rents: [0; 4],
    },
    // 17: Alpha Call
    SpaceData {
        index: 17, name: "Alpha Call", space_type: SPACE_TYPE_CARD_ALPHA, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 18: Magic Eden (Orange)
    SpaceData {
        index: 18, name: "Magic Eden", space_type: SPACE_TYPE_PROPERTY, group: GROUP_ORANGE,
        price: bpoly(180), base_rent: bpoly(14),
        lp_rents: [bpoly(70), bpoly(200), bpoly(550), bpoly(750)],
        protocol_rent: bpoly(950), mortgage_value: bpoly(90), lp_cost: LP_COST_ORANGE,
        bridge_rents: [0; 4],
    },
    // 19: Tensor (Orange)
    SpaceData {
        index: 19, name: "Tensor", space_type: SPACE_TYPE_PROPERTY, group: GROUP_ORANGE,
        price: bpoly(200), base_rent: bpoly(16),
        lp_rents: [bpoly(80), bpoly(220), bpoly(600), bpoly(800)],
        protocol_rent: bpoly(1000), mortgage_value: bpoly(100), lp_cost: LP_COST_ORANGE,
        bridge_rents: [0; 4],
    },
    // 20: DeFi Summer (Free Parking)
    SpaceData {
        index: 20, name: "DeFi Summer", space_type: SPACE_TYPE_FREE_PARKING, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 21: Raydium (Red)
    SpaceData {
        index: 21, name: "Raydium", space_type: SPACE_TYPE_PROPERTY, group: GROUP_RED,
        price: bpoly(220), base_rent: bpoly(18),
        lp_rents: [bpoly(90), bpoly(250), bpoly(700), bpoly(875)],
        protocol_rent: bpoly(1050), mortgage_value: bpoly(110), lp_cost: LP_COST_RED,
        bridge_rents: [0; 4],
    },
    // 22: Governance Vote
    SpaceData {
        index: 22, name: "Governance Vote", space_type: SPACE_TYPE_CARD_GOVERNANCE, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 23: Orca (Red)
    SpaceData {
        index: 23, name: "Orca", space_type: SPACE_TYPE_PROPERTY, group: GROUP_RED,
        price: bpoly(220), base_rent: bpoly(18),
        lp_rents: [bpoly(90), bpoly(250), bpoly(700), bpoly(875)],
        protocol_rent: bpoly(1050), mortgage_value: bpoly(110), lp_cost: LP_COST_RED,
        bridge_rents: [0; 4],
    },
    // 24: Meteora (Red)
    SpaceData {
        index: 24, name: "Meteora", space_type: SPACE_TYPE_PROPERTY, group: GROUP_RED,
        price: bpoly(240), base_rent: bpoly(20),
        lp_rents: [bpoly(100), bpoly(300), bpoly(750), bpoly(925)],
        protocol_rent: bpoly(1100), mortgage_value: bpoly(120), lp_cost: LP_COST_RED,
        bridge_rents: [0; 4],
    },
    // 25: Allbridge (Bridge)
    SpaceData {
        index: 25, name: "Allbridge", space_type: SPACE_TYPE_BRIDGE, group: GROUP_BRIDGE,
        price: bpoly(200), base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: bpoly(100), lp_cost: 0,
        bridge_rents: [bpoly(25), bpoly(50), bpoly(100), bpoly(200)],
    },
    // 26: Marginfi (Yellow)
    SpaceData {
        index: 26, name: "Marginfi", space_type: SPACE_TYPE_PROPERTY, group: GROUP_YELLOW,
        price: bpoly(260), base_rent: bpoly(22),
        lp_rents: [bpoly(110), bpoly(330), bpoly(850), bpoly(1025)],
        protocol_rent: bpoly(1200), mortgage_value: bpoly(130), lp_cost: LP_COST_YELLOW,
        bridge_rents: [0; 4],
    },
    // 27: Kamino Finance (Yellow)
    SpaceData {
        index: 27, name: "Kamino Finance", space_type: SPACE_TYPE_PROPERTY, group: GROUP_YELLOW,
        price: bpoly(260), base_rent: bpoly(22),
        lp_rents: [bpoly(110), bpoly(330), bpoly(850), bpoly(1025)],
        protocol_rent: bpoly(1200), mortgage_value: bpoly(130), lp_cost: LP_COST_YELLOW,
        bridge_rents: [0; 4],
    },
    // 28: Triton One (Utility)
    SpaceData {
        index: 28, name: "Triton One", space_type: SPACE_TYPE_UTILITY, group: GROUP_UTILITY,
        price: bpoly(150), base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: bpoly(75), lp_cost: 0, bridge_rents: [0; 4],
    },
    // 29: Drift Protocol (Yellow)
    SpaceData {
        index: 29, name: "Drift Protocol", space_type: SPACE_TYPE_PROPERTY, group: GROUP_YELLOW,
        price: bpoly(280), base_rent: bpoly(24),
        lp_rents: [bpoly(120), bpoly(360), bpoly(900), bpoly(1100)],
        protocol_rent: bpoly(1275), mortgage_value: bpoly(140), lp_cost: LP_COST_YELLOW,
        bridge_rents: [0; 4],
    },
    // 30: SEC Investigation (Go To Jail)
    SpaceData {
        index: 30, name: "SEC Investigation", space_type: SPACE_TYPE_GO_TO_JAIL, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 31: Jupiter (Green)
    SpaceData {
        index: 31, name: "Jupiter", space_type: SPACE_TYPE_PROPERTY, group: GROUP_GREEN,
        price: bpoly(300), base_rent: bpoly(26),
        lp_rents: [bpoly(130), bpoly(390), bpoly(900), bpoly(1100)],
        protocol_rent: bpoly(1275), mortgage_value: bpoly(150), lp_cost: LP_COST_GREEN,
        bridge_rents: [0; 4],
    },
    // 32: Jito (Green)
    SpaceData {
        index: 32, name: "Jito", space_type: SPACE_TYPE_PROPERTY, group: GROUP_GREEN,
        price: bpoly(300), base_rent: bpoly(26),
        lp_rents: [bpoly(130), bpoly(390), bpoly(900), bpoly(1100)],
        protocol_rent: bpoly(1275), mortgage_value: bpoly(150), lp_cost: LP_COST_GREEN,
        bridge_rents: [0; 4],
    },
    // 33: Alpha Call
    SpaceData {
        index: 33, name: "Alpha Call", space_type: SPACE_TYPE_CARD_ALPHA, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 34: Nosana (Green)
    SpaceData {
        index: 34, name: "Nosana", space_type: SPACE_TYPE_PROPERTY, group: GROUP_GREEN,
        price: bpoly(320), base_rent: bpoly(28),
        lp_rents: [bpoly(150), bpoly(450), bpoly(1000), bpoly(1200)],
        protocol_rent: bpoly(1400), mortgage_value: bpoly(160), lp_cost: LP_COST_GREEN,
        bridge_rents: [0; 4],
    },
    // 35: Mayan Finance (Bridge)
    SpaceData {
        index: 35, name: "Mayan Finance", space_type: SPACE_TYPE_BRIDGE, group: GROUP_BRIDGE,
        price: bpoly(200), base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: bpoly(100), lp_cost: 0,
        bridge_rents: [bpoly(25), bpoly(50), bpoly(100), bpoly(200)],
    },
    // 36: Governance Vote
    SpaceData {
        index: 36, name: "Governance Vote", space_type: SPACE_TYPE_CARD_GOVERNANCE, group: GROUP_NONE,
        price: 0, base_rent: 0, lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 37: Helius (Dark Blue)
    SpaceData {
        index: 37, name: "Helius", space_type: SPACE_TYPE_PROPERTY, group: GROUP_DARK_BLUE,
        price: bpoly(350), base_rent: bpoly(35),
        lp_rents: [bpoly(175), bpoly(500), bpoly(1100), bpoly(1300)],
        protocol_rent: bpoly(1500), mortgage_value: bpoly(175), lp_cost: LP_COST_DARK_BLUE,
        bridge_rents: [0; 4],
    },
    // 38: Protocol Fee (Luxury Tax)
    SpaceData {
        index: 38, name: "Protocol Fee", space_type: SPACE_TYPE_TAX, group: GROUP_NONE,
        price: 0, base_rent: bpoly(100), lp_rents: [0; 4], protocol_rent: 0,
        mortgage_value: 0, lp_cost: 0, bridge_rents: [0; 4],
    },
    // 39: Solana (Dark Blue)
    SpaceData {
        index: 39, name: "Solana", space_type: SPACE_TYPE_PROPERTY, group: GROUP_DARK_BLUE,
        price: bpoly(400), base_rent: bpoly(50),
        lp_rents: [bpoly(200), bpoly(600), bpoly(1400), bpoly(1700)],
        protocol_rent: bpoly(2000), mortgage_value: bpoly(200), lp_cost: LP_COST_DARK_BLUE,
        bridge_rents: [0; 4],
    },
];

/// Bridge space indices
pub const BRIDGE_SPACES: [u8; 4] = [5, 15, 25, 35];
/// Utility space indices
pub const UTILITY_SPACES: [u8; 2] = [12, 28];

/// Properties per color group
pub const GROUP_MEMBERS: [[u8; 3]; 10] = [
    [1, 3, 255],        // Brown (2 props)
    [6, 8, 9],          // Light Blue (3 props)
    [11, 13, 14],       // Pink (3 props)
    [16, 18, 19],       // Orange (3 props)
    [21, 23, 24],       // Red (3 props)
    [26, 27, 29],       // Yellow (3 props)
    [31, 32, 34],       // Green (3 props)
    [37, 39, 255],      // Dark Blue (2 props)
    [5, 15, 25],        // Bridge – only 3 of 4 fit; index 35 handled separately
    [12, 28, 255],      // Utility (2)
];
pub const GROUP_SIZES: [u8; 10] = [2, 3, 3, 3, 3, 3, 3, 2, 4, 2];

/// Return all space indices for a color group
pub fn group_spaces(group: u8) -> &'static [u8] {
    match group {
        GROUP_BROWN      => &[1, 3],
        GROUP_LIGHT_BLUE => &[6, 8, 9],
        GROUP_PINK       => &[11, 13, 14],
        GROUP_ORANGE     => &[16, 18, 19],
        GROUP_RED        => &[21, 23, 24],
        GROUP_YELLOW     => &[26, 27, 29],
        GROUP_GREEN      => &[31, 32, 34],
        GROUP_DARK_BLUE  => &[37, 39],
        GROUP_BRIDGE     => &[5, 15, 25, 35],
        GROUP_UTILITY    => &[12, 28],
        _ => &[],
    }
}

/// Find the nearest bridge space ahead of a given position (wraps around)
pub fn nearest_bridge_ahead(position: u8) -> u8 {
    for &bridge in BRIDGE_SPACES.iter() {
        if bridge > position {
            return bridge;
        }
    }
    BRIDGE_SPACES[0] // wrap around
}

/// Find the nearest unowned property ahead (used for Airdrop Season card)
pub fn nearest_property_ahead(position: u8) -> u8 {
    for i in 1..40u8 {
        let space = (position + i) % 40;
        if BOARD[space as usize].space_type == SPACE_TYPE_PROPERTY {
            return space;
        }
    }
    position
}
