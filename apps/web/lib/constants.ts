export const PROGRAM_ID = "AicXQXhiHgzaxTXpbxYEriXSQdBRQNbqWgcMU1N57q9n";
export const BPOLY_MINT = "6p3LtZQ9ko2oXRijE6Yb87re5PaoB9dybXxUkB4bGNb6";
export const NFT_COLLECTION = "8YzHyvcEP8uP1XgK5pUnPh8BgGgskb9xHtiAkxFeJhjZ";

export const SEEDS = {
  GAME_STATE: "game_state",
  PLAYER_STATE: "player_state",
  PROPERTY_STATE: "property_state",
  TRADE_OFFER: "trade_offer",
  BANK_VAULT: "bank_vault",
} as const;

export const BPOLY_DECIMALS = 6;
export const BPOLY_SCALE = 1_000_000;
export const STARTING_BALANCE = 1_500 * BPOLY_SCALE;
export const GENESIS_SALARY = 200 * BPOLY_SCALE;
export const RUGPULL_BAIL = 50 * BPOLY_SCALE;
export const MAX_PLAYERS = 8;

export const SPACE_TYPES = {
  PROPERTY: 0,
  CARD_ALPHA: 1,
  CARD_GOVERNANCE: 2,
  TAX: 3,
  BRIDGE: 4,
  UTILITY: 5,
  RUGPULL: 6,
  GO_TO_JAIL: 7,
  FREE_PARKING: 8,
  GENESIS: 9,
} as const;

export const COLOR_GROUPS = {
  BROWN: 0,
  LIGHT_BLUE: 1,
  PINK: 2,
  ORANGE: 3,
  RED: 4,
  YELLOW: 5,
  GREEN: 6,
  DARK_BLUE: 7,
  BRIDGE: 8,
  UTILITY: 9,
  NONE: 255,
} as const;

export const GROUP_COLORS: Record<number, string> = {
  0: "#8B4513",   // Brown
  1: "#87CEEB",   // Light Blue
  2: "#FF69B4",   // Pink
  3: "#FFA500",   // Orange
  4: "#FF0000",   // Red
  5: "#FFD700",   // Yellow
  6: "#00AA44",   // Green
  7: "#000080",   // Dark Blue
  8: "#333333",   // Bridge (black)
  9: "#808080",   // Utility (gray)
  255: "transparent",
};

export const GROUP_NAMES: Record<number, string> = {
  0: "Brown",
  1: "Light Blue",
  2: "Pink",
  3: "Orange",
  4: "Red",
  5: "Yellow",
  6: "Green",
  7: "Dark Blue",
  8: "Bridge",
  9: "Utility",
  255: "None",
};
