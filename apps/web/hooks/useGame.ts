"use client";
import { useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, AccountInfo } from "@solana/web3.js";
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

export function useGame(gameId: string, playerWallets: string[]) {
  const { connection } = useConnection();
  const store = useGameStore();

  const gameIdBytes = gameIdFromString(gameId);
  const [gamePDA] = gameStatePDA(gameIdBytes);

  // Fetch and subscribe to GameState
  const fetchGameState = useCallback(async () => {
    const info = await connection.getAccountInfo(gamePDA);
    return info;
  }, [connection, gamePDA]);

  const { data: gameAccountInfo } = useQuery({
    queryKey: ["gameState", gameId],
    queryFn: fetchGameState,
    staleTime: 5000,
  });

  // Real-time WebSocket subscription to GameState PDA
  useEffect(() => {
    const sub = connection.onAccountChange(gamePDA, (info: AccountInfo<Buffer>) => {
      // Decode and update store (IDL coder needed in full impl)
      // For now, trigger a re-fetch via query invalidation
      store.addEvent({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: "state_change",
        message: "Game state updated",
      });
    });

    return () => {
      connection.removeAccountChangeListener(sub);
    };
  }, [connection, gamePDA]);

  // Subscribe to all player PDAs
  useEffect(() => {
    const subs: number[] = [];

    for (const wallet of playerWallets) {
      const [playerPDA] = playerStatePDA(gameIdBytes, new PublicKey(wallet));
      const sub = connection.onAccountChange(playerPDA, (info) => {
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

    return () => {
      subs.forEach((s) => connection.removeAccountChangeListener(s));
    };
  }, [connection, playerWallets.join(",")]);

  // Subscribe to property PDAs (all 22 purchasable spaces)
  useEffect(() => {
    const subs: number[] = [];

    for (const spaceIndex of PURCHASABLE_SPACES) {
      const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
      const sub = connection.onAccountChange(propPDA, (info) => {
        store.addEvent({
          id: `${Date.now()}-prop-${spaceIndex}`,
          timestamp: Date.now(),
          type: "property_update",
          message: `Property ${BOARD[spaceIndex].name} changed hands`,
        });
      });
      subs.push(sub);
    }

    return () => {
      subs.forEach((s) => connection.removeAccountChangeListener(s));
    };
  }, [connection, gameId]);

  return {
    gameState: store.gameState,
    playerStates: store.playerStates,
    properties: store.properties,
  };
}
