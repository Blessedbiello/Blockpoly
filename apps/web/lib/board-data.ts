import { SPACE_TYPES, COLOR_GROUPS } from "./constants";

export interface BoardSpace {
  index: number;
  name: string;
  type: number;
  group: number;
  price: number;       // in BPOLY (display units)
  baseRent: number;
  lpRents: [number, number, number, number];
  protocolRent: number;
  mortgageValue: number;
  lpCost: number;
  bridgeRents: [number, number, number, number];
  logo?: string;       // path to SVG logo
}

const B = (n: number) => n; // values already in display BPOLY

export const BOARD: BoardSpace[] = [
  {
    index: 0, name: "Genesis Block", type: SPACE_TYPES.GENESIS, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 200, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 1, name: "BONK", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.BROWN,
    price: 60, baseRent: 2, lpRents: [10, 30, 90, 160], protocolRent: 250,
    mortgageValue: 30, lpCost: 50, bridgeRents: [0, 0, 0, 0], logo: "/tokens/bonk.svg",
  },
  {
    index: 2, name: "Alpha Call", type: SPACE_TYPES.CARD_ALPHA, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 3, name: "dogwifhat", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.BROWN,
    price: 60, baseRent: 4, lpRents: [20, 60, 180, 320], protocolRent: 450,
    mortgageValue: 30, lpCost: 50, bridgeRents: [0, 0, 0, 0], logo: "/tokens/wif.svg",
  },
  {
    index: 4, name: "Gas Fees Tax", type: SPACE_TYPES.TAX, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 200, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 5, name: "Wormhole", type: SPACE_TYPES.BRIDGE, group: COLOR_GROUPS.BRIDGE,
    price: 200, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 100, lpCost: 0, bridgeRents: [25, 50, 100, 200], logo: "/tokens/wormhole.svg",
  },
  {
    index: 6, name: "Pyth Network", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.LIGHT_BLUE,
    price: 100, baseRent: 6, lpRents: [30, 90, 270, 400], protocolRent: 550,
    mortgageValue: 50, lpCost: 50, bridgeRents: [0, 0, 0, 0], logo: "/tokens/pyth.svg",
  },
  {
    index: 7, name: "Governance Vote", type: SPACE_TYPES.CARD_GOVERNANCE, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 8, name: "Switchboard", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.LIGHT_BLUE,
    price: 100, baseRent: 6, lpRents: [30, 90, 270, 400], protocolRent: 550,
    mortgageValue: 50, lpCost: 50, bridgeRents: [0, 0, 0, 0], logo: "/tokens/switchboard.svg",
  },
  {
    index: 9, name: "Clockwork", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.LIGHT_BLUE,
    price: 120, baseRent: 8, lpRents: [40, 100, 300, 450], protocolRent: 600,
    mortgageValue: 60, lpCost: 50, bridgeRents: [0, 0, 0, 0], logo: "/tokens/clockwork.svg",
  },
  {
    index: 10, name: "Rug Pull Zone", type: SPACE_TYPES.RUGPULL, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 11, name: "Solflare", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.PINK,
    price: 140, baseRent: 10, lpRents: [50, 150, 450, 625], protocolRent: 750,
    mortgageValue: 70, lpCost: 100, bridgeRents: [0, 0, 0, 0], logo: "/tokens/solflare.svg",
  },
  {
    index: 12, name: "QuickNode", type: SPACE_TYPES.UTILITY, group: COLOR_GROUPS.UTILITY,
    price: 150, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 75, lpCost: 0, bridgeRents: [0, 0, 0, 0], logo: "/tokens/quicknode.svg",
  },
  {
    index: 13, name: "Phantom", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.PINK,
    price: 140, baseRent: 10, lpRents: [50, 150, 450, 625], protocolRent: 750,
    mortgageValue: 70, lpCost: 100, bridgeRents: [0, 0, 0, 0], logo: "/tokens/phantom.svg",
  },
  {
    index: 14, name: "Backpack", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.PINK,
    price: 160, baseRent: 12, lpRents: [60, 180, 500, 700], protocolRent: 900,
    mortgageValue: 80, lpCost: 100, bridgeRents: [0, 0, 0, 0], logo: "/tokens/backpack.svg",
  },
  {
    index: 15, name: "deBridge", type: SPACE_TYPES.BRIDGE, group: COLOR_GROUPS.BRIDGE,
    price: 200, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 100, lpCost: 0, bridgeRents: [25, 50, 100, 200], logo: "/tokens/debridge.svg",
  },
  {
    index: 16, name: "Metaplex", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.ORANGE,
    price: 180, baseRent: 14, lpRents: [70, 200, 550, 750], protocolRent: 950,
    mortgageValue: 90, lpCost: 100, bridgeRents: [0, 0, 0, 0], logo: "/tokens/metaplex.svg",
  },
  {
    index: 17, name: "Alpha Call", type: SPACE_TYPES.CARD_ALPHA, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 18, name: "Magic Eden", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.ORANGE,
    price: 180, baseRent: 14, lpRents: [70, 200, 550, 750], protocolRent: 950,
    mortgageValue: 90, lpCost: 100, bridgeRents: [0, 0, 0, 0], logo: "/tokens/magiceden.svg",
  },
  {
    index: 19, name: "Tensor", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.ORANGE,
    price: 200, baseRent: 16, lpRents: [80, 220, 600, 800], protocolRent: 1000,
    mortgageValue: 100, lpCost: 100, bridgeRents: [0, 0, 0, 0], logo: "/tokens/tensor.svg",
  },
  {
    index: 20, name: "DeFi Summer", type: SPACE_TYPES.FREE_PARKING, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 21, name: "Raydium", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.RED,
    price: 220, baseRent: 18, lpRents: [90, 250, 700, 875], protocolRent: 1050,
    mortgageValue: 110, lpCost: 150, bridgeRents: [0, 0, 0, 0], logo: "/tokens/raydium.svg",
  },
  {
    index: 22, name: "Governance Vote", type: SPACE_TYPES.CARD_GOVERNANCE, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 23, name: "Orca", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.RED,
    price: 220, baseRent: 18, lpRents: [90, 250, 700, 875], protocolRent: 1050,
    mortgageValue: 110, lpCost: 150, bridgeRents: [0, 0, 0, 0], logo: "/tokens/orca.svg",
  },
  {
    index: 24, name: "Meteora", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.RED,
    price: 240, baseRent: 20, lpRents: [100, 300, 750, 925], protocolRent: 1100,
    mortgageValue: 120, lpCost: 150, bridgeRents: [0, 0, 0, 0], logo: "/tokens/meteora.svg",
  },
  {
    index: 25, name: "Allbridge", type: SPACE_TYPES.BRIDGE, group: COLOR_GROUPS.BRIDGE,
    price: 200, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 100, lpCost: 0, bridgeRents: [25, 50, 100, 200], logo: "/tokens/allbridge.svg",
  },
  {
    index: 26, name: "Marginfi", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.YELLOW,
    price: 260, baseRent: 22, lpRents: [110, 330, 850, 1025], protocolRent: 1200,
    mortgageValue: 130, lpCost: 150, bridgeRents: [0, 0, 0, 0], logo: "/tokens/marginfi.svg",
  },
  {
    index: 27, name: "Kamino Finance", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.YELLOW,
    price: 260, baseRent: 22, lpRents: [110, 330, 850, 1025], protocolRent: 1200,
    mortgageValue: 130, lpCost: 150, bridgeRents: [0, 0, 0, 0], logo: "/tokens/kamino.svg",
  },
  {
    index: 28, name: "Triton One", type: SPACE_TYPES.UTILITY, group: COLOR_GROUPS.UTILITY,
    price: 150, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 75, lpCost: 0, bridgeRents: [0, 0, 0, 0], logo: "/tokens/triton.svg",
  },
  {
    index: 29, name: "Drift Protocol", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.YELLOW,
    price: 280, baseRent: 24, lpRents: [120, 360, 900, 1100], protocolRent: 1275,
    mortgageValue: 140, lpCost: 150, bridgeRents: [0, 0, 0, 0], logo: "/tokens/drift.svg",
  },
  {
    index: 30, name: "SEC Investigation", type: SPACE_TYPES.GO_TO_JAIL, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 31, name: "Jupiter", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.GREEN,
    price: 300, baseRent: 26, lpRents: [130, 390, 900, 1100], protocolRent: 1275,
    mortgageValue: 150, lpCost: 200, bridgeRents: [0, 0, 0, 0], logo: "/tokens/jupiter.svg",
  },
  {
    index: 32, name: "Jito", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.GREEN,
    price: 300, baseRent: 26, lpRents: [130, 390, 900, 1100], protocolRent: 1275,
    mortgageValue: 150, lpCost: 200, bridgeRents: [0, 0, 0, 0], logo: "/tokens/jito.svg",
  },
  {
    index: 33, name: "Alpha Call", type: SPACE_TYPES.CARD_ALPHA, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 34, name: "Nosana", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.GREEN,
    price: 320, baseRent: 28, lpRents: [150, 450, 1000, 1200], protocolRent: 1400,
    mortgageValue: 160, lpCost: 200, bridgeRents: [0, 0, 0, 0], logo: "/tokens/nosana.svg",
  },
  {
    index: 35, name: "Mayan Finance", type: SPACE_TYPES.BRIDGE, group: COLOR_GROUPS.BRIDGE,
    price: 200, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 100, lpCost: 0, bridgeRents: [25, 50, 100, 200], logo: "/tokens/mayan.svg",
  },
  {
    index: 36, name: "Governance Vote", type: SPACE_TYPES.CARD_GOVERNANCE, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 0, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 37, name: "Helius", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.DARK_BLUE,
    price: 350, baseRent: 35, lpRents: [175, 500, 1100, 1300], protocolRent: 1500,
    mortgageValue: 175, lpCost: 200, bridgeRents: [0, 0, 0, 0], logo: "/tokens/helius.svg",
  },
  {
    index: 38, name: "Protocol Fee", type: SPACE_TYPES.TAX, group: COLOR_GROUPS.NONE,
    price: 0, baseRent: 100, lpRents: [0, 0, 0, 0], protocolRent: 0,
    mortgageValue: 0, lpCost: 0, bridgeRents: [0, 0, 0, 0],
  },
  {
    index: 39, name: "Solana", type: SPACE_TYPES.PROPERTY, group: COLOR_GROUPS.DARK_BLUE,
    price: 400, baseRent: 50, lpRents: [200, 600, 1400, 1700], protocolRent: 2000,
    mortgageValue: 200, lpCost: 200, bridgeRents: [0, 0, 0, 0], logo: "/tokens/solana.svg",
  },
];

export const GROUP_MEMBERS: Record<number, number[]> = {
  [COLOR_GROUPS.BROWN]: [1, 3],
  [COLOR_GROUPS.LIGHT_BLUE]: [6, 8, 9],
  [COLOR_GROUPS.PINK]: [11, 13, 14],
  [COLOR_GROUPS.ORANGE]: [16, 18, 19],
  [COLOR_GROUPS.RED]: [21, 23, 24],
  [COLOR_GROUPS.YELLOW]: [26, 27, 29],
  [COLOR_GROUPS.GREEN]: [31, 32, 34],
  [COLOR_GROUPS.DARK_BLUE]: [37, 39],
  [COLOR_GROUPS.BRIDGE]: [5, 15, 25, 35],
  [COLOR_GROUPS.UTILITY]: [12, 28],
};

export const BRIDGE_SPACES = [5, 15, 25, 35];
export const UTILITY_SPACES = [12, 28];

export function getSpace(index: number): BoardSpace {
  return BOARD[index];
}

export function nearestBridgeAhead(position: number): number {
  for (const bridge of BRIDGE_SPACES) {
    if (bridge > position) return bridge;
  }
  return BRIDGE_SPACES[0]; // wrap
}

export function nearestPropertyAhead(position: number): number {
  for (let i = 1; i < 40; i++) {
    const space = (position + i) % 40;
    if (BOARD[space].type === SPACE_TYPES.PROPERTY) return space;
  }
  return position;
}
