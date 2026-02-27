import { PublicKey } from "@solana/web3.js";
import type { Program } from "@coral-xyz/anchor";
import type { GameStateData, PlayerStateData, PropertyStateData } from "./store";

export function decodeGameState(program: Program, data: Buffer): GameStateData | null {
  try {
    const raw = program.coder.accounts.decode("GameState", data);
    return {
      gameId: Array.from(raw.gameId as number[]),
      host: raw.host as PublicKey,
      status: Object.keys(raw.status as Record<string, unknown>).includes("inProgress")
        ? 1
        : Object.keys(raw.status as Record<string, unknown>).includes("finished")
          ? 2
          : 0,
      turnPhase: encodeTurnPhase(raw.turnPhase as Record<string, unknown>),
      currentPlayerIndex: raw.currentPlayerIndex as number,
      turnNumber: raw.turnNumber as number,
      roundNumber: raw.roundNumber as number,
      players: (raw.players as PublicKey[]),
      playerCount: raw.playerCount as number,
      maxPlayers: raw.maxPlayers as number,
      bullRunActive: raw.bullRunActive as boolean,
      bullRunEndsRound: raw.bullRunEndsRound as number,
      auctionSpace: raw.auctionSpace != null ? Number(raw.auctionSpace) : null,
      auctionHighestBid: BigInt((raw.auctionHighestBid as { toString(): string }).toString()),
      auctionHighestBidder: raw.auctionHighestBidder as PublicKey | null,
      winner: raw.winner as PublicKey | null,
      pendingDice: raw.pendingDice
        ? [Number((raw.pendingDice as number[])[0]), Number((raw.pendingDice as number[])[1])]
        : null,
    };
  } catch {
    return null;
  }
}

function encodeTurnPhase(phase: Record<string, unknown>): number {
  const variants = ["rollDice", "awaitingVrf", "landingEffect", "buyDecision", "drawCard", "auctionPhase", "rugpullDecision"];
  const idx = variants.findIndex((v) => v in phase);
  return idx === -1 ? 0 : idx;
}

export function decodePlayerState(program: Program, data: Buffer): PlayerStateData | null {
  try {
    const raw = program.coder.accounts.decode("PlayerState", data);
    const statusVariants = ["active", "inRugpullZone", "bankrupt"];
    const statusIdx = statusVariants.findIndex((v) => v in (raw.status as Record<string, unknown>));
    return {
      wallet: raw.wallet as PublicKey,
      playerIndex: raw.playerIndex as number,
      position: raw.position as number,
      doublesStreak: raw.doublesStreak as number,
      rugpullTurnsRemaining: raw.rugpullTurnsRemaining as number,
      hasJailFreeCard: raw.hasJailFreeCard as boolean,
      propertiesOwned: Array.from(raw.propertiesOwned as Uint8Array),
      flashLoanActive: raw.flashLoanActive as boolean,
      isBankrupt: raw.isBankrupt as boolean,
      bpolyBalance: BigInt((raw.bpolyBalance as { toString(): string }).toString()),
      status: statusIdx === -1 ? 0 : statusIdx,
    };
  } catch {
    return null;
  }
}

export function decodePropertyState(program: Program, data: Buffer): PropertyStateData | null {
  try {
    const raw = program.coder.accounts.decode("PropertyState", data);
    return {
      spaceIndex: raw.spaceIndex as number,
      owner: raw.owner as PublicKey,
      liquidityPools: raw.liquidityPools as number,
      isFullProtocol: raw.isFullProtocol as boolean,
      isMortgaged: raw.isMortgaged as boolean,
      nftAsset: raw.nftAsset as PublicKey,
    };
  } catch {
    return null;
  }
}
