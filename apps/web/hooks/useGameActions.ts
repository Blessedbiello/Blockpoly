"use client";
import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useGameStore } from "@/stores/gameStore";
import { gameIdFromString, gameStatePDA, playerStatePDA, propertyStatePDA, bankVaultPDA } from "@/lib/pdas";

export function useGameActions(gameId: string) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const store = useGameStore();

  const gameIdBytes = gameIdFromString(gameId);

  const withProgram = useCallback(
    async (fn: (program: any) => Promise<Transaction | null>) => {
      if (!publicKey) throw new Error("Wallet not connected");
      // Program instance would be initialized here with IDL
      // Placeholder: returns null until IDL is available
      return fn(null);
    },
    [publicKey, connection]
  );

  const requestDiceRoll = useCallback(async () => {
    if (!publicKey) return;
    try {
      store.addEvent({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: "dice_request",
        message: "Requesting dice roll...",
        player: publicKey.toString(),
      });
      // In full impl: build and send request_dice_roll instruction
    } catch (e) {
      console.error("requestDiceRoll error:", e);
    }
  }, [publicKey, gameId]);

  const buyProperty = useCallback(
    async (spaceIndex: number) => {
      if (!publicKey) return;
      try {
        store.addEvent({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: "buy",
          message: `Buying property at space ${spaceIndex}`,
          player: publicKey.toString(),
        });
        // build buy_property instruction
      } catch (e) {
        console.error("buyProperty error:", e);
      }
    },
    [publicKey, gameId]
  );

  const declineBuy = useCallback(async () => {
    if (!publicKey) return;
    // build decline_buy instruction → triggers auction
  }, [publicKey, gameId]);

  const payRent = useCallback(
    async (spaceIndex: number) => {
      if (!publicKey) return;
      // build pay_rent instruction
    },
    [publicKey, gameId]
  );

  const buildLP = useCallback(
    async (spaceIndex: number) => {
      if (!publicKey) return;
      // build build_lp instruction
    },
    [publicKey, gameId]
  );

  const buildProtocol = useCallback(
    async (spaceIndex: number) => {
      if (!publicKey) return;
      // build build_protocol instruction
    },
    [publicKey, gameId]
  );

  const sellLP = useCallback(
    async (spaceIndex: number) => {
      if (!publicKey) return;
    },
    [publicKey, gameId]
  );

  const mortgageProperty = useCallback(
    async (spaceIndex: number) => {
      if (!publicKey) return;
    },
    [publicKey, gameId]
  );

  const unmortgageProperty = useCallback(
    async (spaceIndex: number) => {
      if (!publicKey) return;
    },
    [publicKey, gameId]
  );

  const rugpullPayBail = useCallback(async () => {
    if (!publicKey) return;
  }, [publicKey, gameId]);

  const rugpullUseJailFreeCard = useCallback(async () => {
    if (!publicKey) return;
  }, [publicKey, gameId]);

  const auctionBid = useCallback(
    async (spaceIndex: number, amount: bigint) => {
      if (!publicKey) return;
    },
    [publicKey, gameId]
  );

  const proposeTrade = useCallback(
    async (params: {
      recipient: string;
      offeredProperties: number[];
      offeredBpoly: bigint;
      requestedProperties: number[];
      requestedBpoly: bigint;
    }) => {
      if (!publicKey) return;
    },
    [publicKey, gameId]
  );

  const acceptTrade = useCallback(
    async (proposerWallet: string) => {
      if (!publicKey) return;
    },
    [publicKey, gameId]
  );

  const rejectTrade = useCallback(
    async (proposerWallet: string) => {
      if (!publicKey) return;
    },
    [publicKey, gameId]
  );

  return {
    requestDiceRoll,
    buyProperty,
    declineBuy,
    payRent,
    buildLP,
    buildProtocol,
    sellLP,
    mortgageProperty,
    unmortgageProperty,
    rugpullPayBail,
    rugpullUseJailFreeCard,
    auctionBid,
    proposeTrade,
    acceptTrade,
    rejectTrade,
  };
}
