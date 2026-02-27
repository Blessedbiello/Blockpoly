import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, SEEDS } from "./constants";

const PROGRAM_PK = new PublicKey(PROGRAM_ID);

function toSeed(s: string): Buffer {
  return Buffer.from(s);
}

export function gameStatePDA(gameId: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [toSeed(SEEDS.GAME_STATE), gameId],
    PROGRAM_PK
  );
}

export function playerStatePDA(
  gameId: Uint8Array,
  playerWallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [toSeed(SEEDS.PLAYER_STATE), gameId, playerWallet.toBuffer()],
    PROGRAM_PK
  );
}

export function propertyStatePDA(
  gameId: Uint8Array,
  spaceIndex: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [toSeed(SEEDS.PROPERTY_STATE), gameId, Buffer.from([spaceIndex])],
    PROGRAM_PK
  );
}

export function tradeOfferPDA(
  gameId: Uint8Array,
  proposer: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [toSeed(SEEDS.TRADE_OFFER), gameId, proposer.toBuffer()],
    PROGRAM_PK
  );
}

export function bankVaultPDA(gameId: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [toSeed(SEEDS.BANK_VAULT), gameId],
    PROGRAM_PK
  );
}

export function gameIdFromString(id: string): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(id);
  const padded = new Uint8Array(32);
  padded.set(bytes.slice(0, 32));
  return padded;
}

export function gameIdToString(id: number[] | Uint8Array): string {
  const bytes = new Uint8Array(id);
  // Find null terminator
  const end = bytes.indexOf(0);
  return new TextDecoder().decode(bytes.slice(0, end === -1 ? 32 : end));
}
