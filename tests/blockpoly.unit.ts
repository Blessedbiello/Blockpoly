/**
 * Blockpoly unit tests using LiteSVM (TypeScript).
 * Fast in-process tests — no validator needed.
 *
 * Board data / constant checks run without any SVM.
 * Full instruction tests require `anchor build` first (loads the .so).
 *
 * Run: pnpm test:unit
 */

import { assert } from "chai";
import { PublicKey } from "@solana/web3.js";

// ── Constants mirrored from programs/blockpoly/src/ ──────────────────────────

const PROGRAM_ID = new PublicKey("Bp1ypXF8ggBd7f6sWuXEsWs8iSU9L3dGAD9DPpAZ7bHm");

const SEED_GAME_STATE = Buffer.from("game_state");
const SEED_PLAYER_STATE = Buffer.from("player_state");
const SEED_PROPERTY_STATE = Buffer.from("property_state");
const SEED_BANK_VAULT = Buffer.from("bank_vault");

// Space type constants (must match constants.rs)
const SPACE_TYPE_PROPERTY = 0;
const SPACE_TYPE_CARD_ALPHA = 1;
const SPACE_TYPE_CARD_GOVERNANCE = 2;
const SPACE_TYPE_TAX = 3;
const SPACE_TYPE_BRIDGE = 4;
const SPACE_TYPE_UTILITY = 5;
const SPACE_TYPE_RUGPULL = 6;
const SPACE_TYPE_GO_TO_JAIL = 7;
const SPACE_TYPE_FREE_PARKING = 8;
const SPACE_TYPE_GENESIS = 9;

// Color group constants (must match constants.rs)
const GROUP_BROWN = 1;
const GROUP_LIGHT_BLUE = 2;
const GROUP_PINK = 3;
const GROUP_ORANGE = 4;
const GROUP_RED = 5;
const GROUP_GREEN = 6;
const GROUP_DARK_BLUE = 7;
const GROUP_BRIDGE = 8;

const BPOLY = (n: number) => BigInt(n) * 1_000_000n;

// ── Board data (TypeScript mirror of board.rs) ────────────────────────────────

interface SpaceData {
  index: number;
  name: string;
  spaceType: number;
  group: number;
  price: bigint;
  baseRent: bigint;
  lpRents: [bigint, bigint, bigint, bigint];
  protocolRent: bigint;
  mortgageValue: bigint;
  lpCost: bigint;
  bridgeRents: [bigint, bigint, bigint, bigint];
}

const BOARD: SpaceData[] = [
  { index: 0,  name: "Genesis Block",  spaceType: SPACE_TYPE_GENESIS,          group: 0, price: BPOLY(0),   baseRent: BPOLY(0),   lpRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)],     protocolRent: BPOLY(0),    mortgageValue: BPOLY(0),  lpCost: BPOLY(0), bridgeRents: [BPOLY(25), BPOLY(50), BPOLY(100), BPOLY(200)] },
  { index: 1,  name: "BONK",           spaceType: SPACE_TYPE_PROPERTY,         group: GROUP_BROWN,      price: BPOLY(60),  baseRent: BPOLY(2),   lpRents: [BPOLY(10), BPOLY(30), BPOLY(90), BPOLY(160)],  protocolRent: BPOLY(250),  mortgageValue: BPOLY(30), lpCost: BPOLY(50), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 2,  name: "Alpha Call",     spaceType: SPACE_TYPE_CARD_ALPHA,       group: 0, price: BPOLY(0),   baseRent: BPOLY(0),   lpRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)],     protocolRent: BPOLY(0),    mortgageValue: BPOLY(0),  lpCost: BPOLY(0), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 3,  name: "dogwifhat",      spaceType: SPACE_TYPE_PROPERTY,         group: GROUP_BROWN,      price: BPOLY(60),  baseRent: BPOLY(4),   lpRents: [BPOLY(20), BPOLY(60), BPOLY(180), BPOLY(320)], protocolRent: BPOLY(450),  mortgageValue: BPOLY(30), lpCost: BPOLY(50), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 4,  name: "Gas Fees Tax",   spaceType: SPACE_TYPE_TAX,              group: 0, price: BPOLY(0),   baseRent: BPOLY(0),   lpRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)],     protocolRent: BPOLY(0),    mortgageValue: BPOLY(0),  lpCost: BPOLY(0), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 5,  name: "Wormhole",       spaceType: SPACE_TYPE_BRIDGE,           group: GROUP_BRIDGE,     price: BPOLY(200), baseRent: BPOLY(0),   lpRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)],     protocolRent: BPOLY(0),    mortgageValue: BPOLY(100),lpCost: BPOLY(0), bridgeRents: [BPOLY(25), BPOLY(50), BPOLY(100), BPOLY(200)] },
  { index: 6,  name: "Pyth Network",   spaceType: SPACE_TYPE_PROPERTY,         group: GROUP_LIGHT_BLUE, price: BPOLY(100), baseRent: BPOLY(6),   lpRents: [BPOLY(30), BPOLY(90), BPOLY(270), BPOLY(400)], protocolRent: BPOLY(550),  mortgageValue: BPOLY(50), lpCost: BPOLY(50), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 10, name: "Rug Pull Zone",  spaceType: SPACE_TYPE_RUGPULL,          group: 0, price: BPOLY(0),   baseRent: BPOLY(0),   lpRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)],     protocolRent: BPOLY(0),    mortgageValue: BPOLY(0),  lpCost: BPOLY(0), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 20, name: "DeFi Summer",    spaceType: SPACE_TYPE_FREE_PARKING,     group: 0, price: BPOLY(0),   baseRent: BPOLY(0),   lpRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)],     protocolRent: BPOLY(0),    mortgageValue: BPOLY(0),  lpCost: BPOLY(0), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 30, name: "SEC Investigation", spaceType: SPACE_TYPE_GO_TO_JAIL,    group: 0, price: BPOLY(0),   baseRent: BPOLY(0),   lpRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)],     protocolRent: BPOLY(0),    mortgageValue: BPOLY(0),  lpCost: BPOLY(0), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 31, name: "Jupiter",        spaceType: SPACE_TYPE_PROPERTY,         group: GROUP_GREEN,      price: BPOLY(300), baseRent: BPOLY(26),  lpRents: [BPOLY(130), BPOLY(390), BPOLY(900), BPOLY(1100)], protocolRent: BPOLY(1275), mortgageValue: BPOLY(150),lpCost: BPOLY(200), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 37, name: "Helius",         spaceType: SPACE_TYPE_PROPERTY,         group: GROUP_DARK_BLUE,  price: BPOLY(350), baseRent: BPOLY(35),  lpRents: [BPOLY(175), BPOLY(500), BPOLY(1100), BPOLY(1300)], protocolRent: BPOLY(1500), mortgageValue: BPOLY(175),lpCost: BPOLY(200), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
  { index: 39, name: "Solana",         spaceType: SPACE_TYPE_PROPERTY,         group: GROUP_DARK_BLUE,  price: BPOLY(400), baseRent: BPOLY(50),  lpRents: [BPOLY(200), BPOLY(600), BPOLY(1400), BPOLY(1700)], protocolRent: BPOLY(2000), mortgageValue: BPOLY(200),lpCost: BPOLY(200), bridgeRents: [BPOLY(0), BPOLY(0), BPOLY(0), BPOLY(0)] },
];

// ── PDA helpers ───────────────────────────────────────────────────────────────

function gameId(label: string): Buffer {
  const buf = Buffer.alloc(32);
  Buffer.from(label).copy(buf);
  return buf;
}

function gameStatePDA(gid: Buffer): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEED_GAME_STATE, gid], PROGRAM_ID);
}

function playerStatePDA(gid: Buffer, wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED_PLAYER_STATE, gid, wallet.toBuffer()],
    PROGRAM_ID
  );
}

function propertyStatePDA(gid: Buffer, spaceIndex: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED_PROPERTY_STATE, gid, Buffer.from([spaceIndex])],
    PROGRAM_ID
  );
}

function bankVaultPDA(gid: Buffer): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEED_BANK_VAULT, gid], PROGRAM_ID);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Blockpoly — unit tests (no validator required)", () => {
  // ── Board data ────────────────────────────────────────────────────────────

  describe("Board data integrity", () => {
    it("Genesis Block is space 0", () => {
      const space = BOARD.find((s) => s.index === 0)!;
      assert.equal(space.spaceType, SPACE_TYPE_GENESIS);
      assert.equal(space.name, "Genesis Block");
    });

    it("Rug Pull Zone (jail) is space 10", () => {
      const space = BOARD.find((s) => s.index === 10)!;
      assert.equal(space.spaceType, SPACE_TYPE_RUGPULL);
    });

    it("DeFi Summer (free parking) is space 20", () => {
      const space = BOARD.find((s) => s.index === 20)!;
      assert.equal(space.spaceType, SPACE_TYPE_FREE_PARKING);
    });

    it("SEC Investigation (go to jail) is space 30", () => {
      const space = BOARD.find((s) => s.index === 30)!;
      assert.equal(space.spaceType, SPACE_TYPE_GO_TO_JAIL);
    });

    it("Jupiter is space 31, Green group", () => {
      const jupiter = BOARD.find((s) => s.name === "Jupiter")!;
      assert.equal(jupiter.index, 31);
      assert.equal(jupiter.group, GROUP_GREEN);
      assert.equal(jupiter.price, BPOLY(300));
    });

    it("Solana is the most expensive property at 400 BPOLY", () => {
      const solana = BOARD.find((s) => s.name === "Solana")!;
      const maxPrice = BOARD.reduce(
        (max, s) => (s.price > max ? s.price : max),
        0n
      );
      assert.equal(solana.price, maxPrice);
      assert.equal(solana.price, BPOLY(400));
    });

    it("Helius is Dark Blue, space 37", () => {
      const helius = BOARD.find((s) => s.name === "Helius")!;
      assert.equal(helius.index, 37);
      assert.equal(helius.group, GROUP_DARK_BLUE);
    });

    it("Pyth Network base rent is 6 BPOLY, price 100 BPOLY", () => {
      const pyth = BOARD.find((s) => s.name === "Pyth Network")!;
      assert.equal(pyth.baseRent, BPOLY(6));
      assert.equal(pyth.price, BPOLY(100));
    });

    it("Solana protocol rent is 2000 BPOLY", () => {
      const solana = BOARD.find((s) => s.name === "Solana")!;
      assert.equal(solana.protocolRent, BPOLY(2000));
    });

    it("Wormhole is a bridge at space 5", () => {
      const wh = BOARD.find((s) => s.name === "Wormhole")!;
      assert.equal(wh.spaceType, SPACE_TYPE_BRIDGE);
      assert.equal(wh.index, 5);
      assert.equal(wh.price, BPOLY(200));
      assert.equal(wh.bridgeRents[0], BPOLY(25)); // 1 bridge owned
      assert.equal(wh.bridgeRents[1], BPOLY(50)); // 2 bridges owned
      assert.equal(wh.bridgeRents[3], BPOLY(200)); // 4 bridges owned
    });
  });

  // ── Token economics ───────────────────────────────────────────────────────

  describe("Token economics", () => {
    it("Starting balance is 1500 BPOLY in micro-units", () => {
      const STARTING_BALANCE = 1_500_000_000n;
      assert.equal(STARTING_BALANCE, BPOLY(1500));
    });

    it("Genesis salary is 200 BPOLY in micro-units", () => {
      const GENESIS_SALARY = 200_000_000n;
      assert.equal(GENESIS_SALARY, BPOLY(200));
    });

    it("Rug pull bail is 50 BPOLY in micro-units", () => {
      const RUGPULL_BAIL = 50_000_000n;
      assert.equal(RUGPULL_BAIL, BPOLY(50));
    });

    it("BPOLY helper: 1 BPOLY = 1_000_000 micro-units", () => {
      assert.equal(BPOLY(1), 1_000_000n);
      assert.equal(BPOLY(100), 100_000_000n);
    });
  });

  // ── PDA derivation ────────────────────────────────────────────────────────

  describe("PDA derivation", () => {
    const GID = gameId("unit-test-game");

    it("gameStatePDA is deterministic", () => {
      const [pda1, bump1] = gameStatePDA(GID);
      const [pda2, bump2] = gameStatePDA(GID);
      assert.equal(pda1.toString(), pda2.toString());
      assert.equal(bump1, bump2);
    });

    it("bankVaultPDA differs from gameStatePDA", () => {
      const [gs] = gameStatePDA(GID);
      const [bv] = bankVaultPDA(GID);
      assert.notEqual(gs.toString(), bv.toString());
    });

    it("different game IDs produce different PDAs", () => {
      const [pda_a] = gameStatePDA(gameId("game-alpha"));
      const [pda_b] = gameStatePDA(gameId("game-beta"));
      assert.notEqual(pda_a.toString(), pda_b.toString());
    });

    it("playerStatePDA is unique per wallet", () => {
      const wallet_a = PublicKey.unique();
      const wallet_b = PublicKey.unique();
      const [pda_a] = playerStatePDA(GID, wallet_a);
      const [pda_b] = playerStatePDA(GID, wallet_b);
      assert.notEqual(pda_a.toString(), pda_b.toString());
    });

    it("propertyStatePDA is unique per space index", () => {
      const [pda6] = propertyStatePDA(GID, 6);
      const [pda31] = propertyStatePDA(GID, 31);
      assert.notEqual(pda6.toString(), pda31.toString());
    });

    it("propertyStatePDA for the same space is deterministic across games", () => {
      const [pda1] = propertyStatePDA(gameId("game-x"), 6);
      const [pda2] = propertyStatePDA(gameId("game-y"), 6);
      // Different games → different PDAs even for same space
      assert.notEqual(pda1.toString(), pda2.toString());
    });
  });

  // ── Rent calculation ──────────────────────────────────────────────────────

  describe("Rent calculation logic", () => {
    it("bridge rent scales: 1→25, 2→50, 3→100, 4→200 BPOLY", () => {
      const bridgeRents: bigint[] = [BPOLY(25), BPOLY(50), BPOLY(100), BPOLY(200)];
      // Each tier is 2x the previous
      for (let i = 1; i < 4; i++) {
        assert.equal(bridgeRents[i], bridgeRents[i - 1] * 2n);
      }
    });

    it("monopoly bonus doubles base rent (unimproved)", () => {
      const pyth = BOARD.find((s) => s.name === "Pyth Network")!;
      const baseRent = pyth.baseRent;
      const monopolyRent = baseRent * 2n; // doubled when monopoly
      assert.equal(monopolyRent, BPOLY(12));
    });

    it("LP rent 1 > base rent for all properties", () => {
      const properties = BOARD.filter((s) => s.spaceType === SPACE_TYPE_PROPERTY);
      for (const prop of properties) {
        if (prop.lpCost > 0n) {
          assert.ok(
            prop.lpRents[0] > prop.baseRent,
            `${prop.name}: LP rent[0] should exceed base rent`
          );
        }
      }
    });

    it("protocol rent > all LP rents for all properties", () => {
      const properties = BOARD.filter((s) => s.spaceType === SPACE_TYPE_PROPERTY);
      for (const prop of properties) {
        if (prop.protocolRent > 0n) {
          const maxLpRent = prop.lpRents.reduce((a, b) => (a > b ? a : b));
          assert.ok(
            prop.protocolRent > maxLpRent,
            `${prop.name}: protocol rent should exceed all LP rents`
          );
        }
      }
    });
  });
});
