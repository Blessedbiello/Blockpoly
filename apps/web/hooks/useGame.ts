"use client";
// web3-compat boundary: web3.js v1 Connection + Anchor coder are isolated here.
// All other UI stays kit-native via @solana/react-hooks.
import { useEffect, useCallback, useRef } from "react";
import { useSolanaClient } from "@solana/react-hooks";
import { Connection, PublicKey, type AccountInfo } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useQuery } from "@tanstack/react-query";
import { useGameStore } from "@/stores/gameStore";
import { gameStatePDA, playerStatePDA, propertyStatePDA, gameIdFromString } from "@/lib/pdas";
import { loadIdl, getProgram } from "@/lib/anchor-client";
import { BOARD } from "@/lib/board-data";
import { SPACE_TYPES } from "@/lib/constants";
import type { GameStateData, PlayerStateData, PropertyStateData } from "@/stores/gameStore";

const PURCHASABLE_SPACES = BOARD.filter(
  (s) =>
    s.type === SPACE_TYPES.PROPERTY ||
    s.type === SPACE_TYPES.BRIDGE ||
    s.type === SPACE_TYPES.UTILITY
).map((s) => s.index);

// Derive web3.js Connection from the kit client RPC endpoint.
function useWeb3Connection(): Connection {
  const client = useSolanaClient();
  const endpoint =
    (client.config.endpoint as string | undefined) ??
    (client.config.rpc as string | undefined) ??
    "https://api.devnet.solana.com";
  return new Connection(endpoint, { commitment: "confirmed" });
}

// Build an Anchor Program for decoding (no signing needed).
async function buildDecoder(connection: Connection): Promise<Program | null> {
  const idl = await loadIdl();
  if (!idl) return null;
  const fakeWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: unknown) => tx,
    signAllTransactions: async (txs: unknown[]) => txs,
  };
  const provider = new AnchorProvider(connection, fakeWallet as never, {
    commitment: "confirmed",
  });
  return getProgram(provider, idl);
}

// Decode GameState account bytes → GameStateData.
function decodeGameState(program: Program, data: Buffer): GameStateData | null {
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

// Decode TurnPhase enum to number.
function encodeTurnPhase(phase: Record<string, unknown>): number {
  const variants = ["rollDice", "awaitingVrf", "landingEffect", "buyDecision", "drawCard", "auctionPhase", "rugpullDecision"];
  const idx = variants.findIndex((v) => v in phase);
  return idx === -1 ? 0 : idx;
}

// Decode PlayerState account bytes → PlayerStateData.
function decodePlayerState(program: Program, data: Buffer): PlayerStateData | null {
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

// Decode PropertyState account bytes → PropertyStateData.
function decodePropertyState(program: Program, data: Buffer): PropertyStateData | null {
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

export function useGame(gameId: string, playerWallets: string[]) {
  const connection = useWeb3Connection();
  const store = useGameStore();
  const programRef = useRef<Program | null>(null);

  const gameIdBytes = gameIdFromString(gameId);
  const [gamePDA] = gameStatePDA(gameIdBytes);

  // Initialize Anchor decoder once.
  useEffect(() => {
    buildDecoder(connection).then((p) => {
      programRef.current = p;
    });
  }, []);

  // Fetch GameState on mount and on demand.
  const fetchGameState = useCallback(async () => {
    return connection.getAccountInfo(gamePDA);
  }, [gamePDA.toString()]);

  const { data: gameAccountInfo, refetch } = useQuery({
    queryKey: ["gameState", gameId],
    queryFn: fetchGameState,
    staleTime: 5000,
  });

  // Decode and sync initial game state into the store.
  useEffect(() => {
    if (!gameAccountInfo?.data || !programRef.current) return;
    const gs = decodeGameState(programRef.current, gameAccountInfo.data as Buffer);
    if (gs) store.setGameState(gs);
  }, [gameAccountInfo]);

  // Real-time WebSocket subscription to GameState PDA.
  useEffect(() => {
    const sub = connection.onAccountChange(
      gamePDA,
      (info: AccountInfo<Buffer>) => {
        const program = programRef.current;
        if (program && info.data) {
          const gs = decodeGameState(program, info.data);
          if (gs) {
            store.setGameState(gs);
            // Emit event for dice roll if pending_dice changed
            if (gs.pendingDice) {
              store.addEvent({
                id: `dice-${Date.now()}`,
                timestamp: Date.now(),
                type: "dice_rolled",
                message: `Dice: ${gs.pendingDice[0] + gs.pendingDice[1]} (${gs.pendingDice[0]} + ${gs.pendingDice[1]})`,
              });
            }
          }
        }
        store.addEvent({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: "state_change",
          message: "Game state updated",
        });
      },
      "confirmed"
    );
    return () => { connection.removeAccountChangeListener(sub); };
  }, [gamePDA.toString()]);

  // Subscribe to all player PDAs and decode their state.
  useEffect(() => {
    const subs: number[] = [];
    for (const wallet of playerWallets) {
      const [playerPDA] = playerStatePDA(gameIdBytes, new PublicKey(wallet));
      const sub = connection.onAccountChange(
        playerPDA,
        (info: AccountInfo<Buffer>) => {
          const program = programRef.current;
          if (program && info.data) {
            const ps = decodePlayerState(program, info.data);
            if (ps) {
              store.setPlayerState(wallet, ps);
              store.addEvent({
                id: `${Date.now()}-${wallet}`,
                timestamp: Date.now(),
                type: "player_update",
                message: `Player ${wallet.slice(0, 4)}… updated (pos: ${ps.position})`,
                player: wallet,
              });
            }
          }
        },
        "confirmed"
      );
      subs.push(sub);
    }
    return () => { subs.forEach((s) => connection.removeAccountChangeListener(s)); };
  }, [playerWallets.join(",")]);

  // Subscribe to property PDAs (all purchasable spaces).
  useEffect(() => {
    const subs: number[] = [];
    for (const spaceIndex of PURCHASABLE_SPACES) {
      const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
      const sub = connection.onAccountChange(
        propPDA,
        (info: AccountInfo<Buffer>) => {
          const program = programRef.current;
          if (program && info.data) {
            const prop = decodePropertyState(program, info.data);
            if (prop) {
              store.setProperty(spaceIndex, prop);
              store.addEvent({
                id: `${Date.now()}-prop-${spaceIndex}`,
                timestamp: Date.now(),
                type: "property_update",
                message: `${BOARD[spaceIndex].name} changed hands`,
              });
            }
          }
        },
        "confirmed"
      );
      subs.push(sub);
    }
    return () => { subs.forEach((s) => connection.removeAccountChangeListener(s)); };
  }, [gameId]);

  // Fetch all player states on demand.
  const fetchAllPlayerStates = useCallback(async () => {
    const program = programRef.current;
    if (!program) return;
    for (const wallet of playerWallets) {
      const [playerPDA] = playerStatePDA(gameIdBytes, new PublicKey(wallet));
      const info = await connection.getAccountInfo(playerPDA);
      if (info?.data) {
        const ps = decodePlayerState(program, info.data as Buffer);
        if (ps) store.setPlayerState(wallet, ps);
      }
    }
  }, [playerWallets.join(",")]);

  // Fetch all property states on demand.
  const fetchAllProperties = useCallback(async () => {
    const program = programRef.current;
    if (!program) return;
    for (const spaceIndex of PURCHASABLE_SPACES) {
      const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
      const info = await connection.getAccountInfo(propPDA);
      if (info?.data) {
        const prop = decodePropertyState(program, info.data as Buffer);
        if (prop) store.setProperty(spaceIndex, prop);
      }
    }
  }, [gameId]);

  return {
    gameState: store.gameState,
    playerStates: store.playerStates,
    properties: store.properties,
    refetchGameState: refetch,
    fetchAllPlayerStates,
    fetchAllProperties,
  };
}
