"use client";
// Uses framework-kit (@solana/react-hooks) for wallet + client access.
// Web3.js v1 Connection is created from the RPC endpoint at the web3-compat boundary
// so Anchor account subscriptions still work while the UI stays kit-native.
import { useEffect, useCallback } from "react";
import { useSolanaClient } from "@solana/react-hooks";
import { Connection, PublicKey, AccountInfo } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useGameStore } from "@/stores/gameStore";
import { gameStatePDA, playerStatePDA, propertyStatePDA, gameIdFromString } from "@/lib/pdas";
import { BOARD } from "@/lib/board-data";
import { SPACE_TYPES } from "@/lib/constants";

const PURCHASABLE_SPACES = BOARD.filter(
  (s) =>
    s.type === SPACE_TYPES.PROPERTY ||
    s.type === SPACE_TYPES.BRIDGE ||
    s.type === SPACE_TYPES.UTILITY
).map((s) => s.index);

// web3-compat boundary: create a v1 Connection from the kit client's RPC endpoint.
function useWeb3Connection(): Connection {
  const client = useSolanaClient();
  const endpoint =
    (client.config.endpoint as string | undefined) ??
    (client.config.rpc as string | undefined) ??
    "https://api.devnet.solana.com";
  return new Connection(endpoint, { commitment: "confirmed" });
}

export function useGame(gameId: string, playerWallets: string[]) {
  const connection = useWeb3Connection();
  const store = useGameStore();

  const gameIdBytes = gameIdFromString(gameId);
  const [gamePDA] = gameStatePDA(gameIdBytes);

  // Fetch GameState on mount and on demand
  const fetchGameState = useCallback(async () => {
    return connection.getAccountInfo(gamePDA);
  }, [gamePDA.toString()]);

  const { data: gameAccountInfo } = useQuery({
    queryKey: ["gameState", gameId],
    queryFn: fetchGameState,
    staleTime: 5000,
  });

  // Real-time WebSocket subscription to GameState PDA
  useEffect(() => {
    const sub = connection.onAccountChange(gamePDA, (_info: AccountInfo<Buffer>) => {
      store.addEvent({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: "state_change",
        message: "Game state updated",
      });
    });
    return () => { connection.removeAccountChangeListener(sub); };
  }, [gamePDA.toString()]);

  // Subscribe to all player PDAs
  useEffect(() => {
    const subs: number[] = [];
    for (const wallet of playerWallets) {
      const [playerPDA] = playerStatePDA(gameIdBytes, new PublicKey(wallet));
      const sub = connection.onAccountChange(playerPDA, () => {
        store.addEvent({
          id: `${Date.now()}-${wallet}`,
          timestamp: Date.now(),
          type: "player_update",
          message: `Player ${wallet.slice(0, 4)}... updated`,
          player: wallet,
        });
      });
      subs.push(sub);
    }
    return () => { subs.forEach((s) => connection.removeAccountChangeListener(s)); };
  }, [playerWallets.join(",")]);

  // Subscribe to property PDAs (all purchasable spaces)
  useEffect(() => {
    const subs: number[] = [];
    for (const spaceIndex of PURCHASABLE_SPACES) {
      const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
      const sub = connection.onAccountChange(propPDA, () => {
        store.addEvent({
          id: `${Date.now()}-prop-${spaceIndex}`,
          timestamp: Date.now(),
          type: "property_update",
          message: `Property ${BOARD[spaceIndex].name} changed hands`,
        });
      });
      subs.push(sub);
    }
    return () => { subs.forEach((s) => connection.removeAccountChangeListener(s)); };
  }, [gameId]);

  return {
    gameState: store.gameState,
    playerStates: store.playerStates,
    properties: store.properties,
  };
}
