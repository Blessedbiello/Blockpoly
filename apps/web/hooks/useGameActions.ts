"use client";
// Uses framework-kit (@solana/react-hooks) for wallet access.
// Anchor program calls cross the web3-compat boundary via anchor-client.ts.
import { useCallback } from "react";
import { useWalletConnection, useSolanaClient } from "@solana/react-hooks";
import { Connection } from "@solana/web3.js";
import { useGameStore } from "@/stores/gameStore";
import { gameIdFromString } from "@/lib/pdas";

export function useGameActions(gameId: string) {
  const { wallet } = useWalletConnection();
  const client = useSolanaClient();
  const store = useGameStore();

  // The connected wallet address (kit Address type → string for display/Anchor)
  const walletAddress = wallet?.account.address ?? null;

  const gameIdBytes = gameIdFromString(gameId);

  // web3-compat boundary: derive web3.js Connection from kit endpoint for Anchor CPIs.
  const getConnection = useCallback((): Connection => {
    const endpoint =
      (client.config.endpoint as string | undefined) ??
      (client.config.rpc as string | undefined) ??
      "https://api.devnet.solana.com";
    return new Connection(endpoint, { commitment: "confirmed" });
  }, [client]);

  const requestDiceRoll = useCallback(async () => {
    if (!walletAddress) return;
    try {
      store.addEvent({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: "dice_request",
        message: "Requesting dice roll...",
        player: walletAddress,
      });
      // TODO: build and send request_dice_roll instruction via Anchor program
    } catch (e) {
      console.error("requestDiceRoll error:", e);
    }
  }, [walletAddress, gameId]);

  const buyProperty = useCallback(
    async (spaceIndex: number) => {
      if (!walletAddress) return;
      try {
        store.addEvent({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: "buy",
          message: `Buying property at space ${spaceIndex}`,
          player: walletAddress,
        });
        // TODO: build buy_property instruction via Anchor
      } catch (e) {
        console.error("buyProperty error:", e);
      }
    },
    [walletAddress, gameId]
  );

  const declineBuy = useCallback(async () => {
    if (!walletAddress) return;
    // TODO: build decline_buy instruction → triggers auction
  }, [walletAddress, gameId]);

  const payRent = useCallback(
    async (_spaceIndex: number) => {
      if (!walletAddress) return;
      // TODO: build pay_rent instruction
    },
    [walletAddress, gameId]
  );

  const buildLP = useCallback(
    async (_spaceIndex: number) => {
      if (!walletAddress) return;
      // TODO: build build_lp instruction
    },
    [walletAddress, gameId]
  );

  const buildProtocol = useCallback(
    async (_spaceIndex: number) => {
      if (!walletAddress) return;
      // TODO: build build_protocol instruction
    },
    [walletAddress, gameId]
  );

  const sellLP = useCallback(
    async (_spaceIndex: number) => {
      if (!walletAddress) return;
    },
    [walletAddress, gameId]
  );

  const mortgageProperty = useCallback(
    async (_spaceIndex: number) => {
      if (!walletAddress) return;
    },
    [walletAddress, gameId]
  );

  const unmortgageProperty = useCallback(
    async (_spaceIndex: number) => {
      if (!walletAddress) return;
    },
    [walletAddress, gameId]
  );

  const rugpullPayBail = useCallback(async () => {
    if (!walletAddress) return;
  }, [walletAddress, gameId]);

  const rugpullUseJailFreeCard = useCallback(async () => {
    if (!walletAddress) return;
  }, [walletAddress, gameId]);

  const auctionBid = useCallback(
    async (_spaceIndex: number, _amount: bigint) => {
      if (!walletAddress) return;
    },
    [walletAddress, gameId]
  );

  const proposeTrade = useCallback(
    async (_params: {
      recipient: string;
      offeredProperties: number[];
      offeredBpoly: bigint;
      requestedProperties: number[];
      requestedBpoly: bigint;
    }) => {
      if (!walletAddress) return;
    },
    [walletAddress, gameId]
  );

  const acceptTrade = useCallback(
    async (_proposerWallet: string) => {
      if (!walletAddress) return;
    },
    [walletAddress, gameId]
  );

  const rejectTrade = useCallback(
    async (_proposerWallet: string) => {
      if (!walletAddress) return;
    },
    [walletAddress, gameId]
  );

  return {
    walletAddress,
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
