import { useEffect, useRef, useCallback } from "react";
import { Connection, PublicKey, type AccountInfo } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import {
  useGameStore,
  gameStatePDA,
  playerStatePDA,
  propertyStatePDA,
  gameIdFromString,
  decodeGameState,
  decodePlayerState,
  decodePropertyState,
  BOARD,
  SPACE_TYPES,
} from "@blockpoly/shared";
import idlJson from "@blockpoly/shared/src/idl/blockpoly.json";
import { PROGRAM_ID } from "@blockpoly/shared";

const RPC = "https://api.devnet.solana.com";

const PURCHASABLE_SPACES = BOARD.filter(
  (s) =>
    s.type === SPACE_TYPES.PROPERTY ||
    s.type === SPACE_TYPES.BRIDGE ||
    s.type === SPACE_TYPES.UTILITY
).map((s) => s.index);

function buildDecoder(connection: Connection): Program {
  const fakeWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: unknown) => tx,
    signAllTransactions: async (txs: unknown[]) => txs,
  };
  const provider = new AnchorProvider(connection, fakeWallet as never, {
    commitment: "confirmed",
  });
  return new Program(idlJson as unknown as Idl, provider);
}

export function useMobileGame(gameId: string, playerWallets: string[]) {
  const store = useGameStore();
  const programRef = useRef<Program | null>(null);

  const gameIdBytes = gameIdFromString(gameId);
  const [gamePDA] = gameStatePDA(gameIdBytes);

  useEffect(() => {
    const connection = new Connection(RPC, "confirmed");
    programRef.current = buildDecoder(connection);

    // Initial fetch
    connection.getAccountInfo(gamePDA).then((info) => {
      if (info?.data && programRef.current) {
        const gs = decodeGameState(programRef.current, info.data as Buffer);
        if (gs) store.setGameState(gs);
      }
    });

    // WebSocket subscription for GameState
    const gameSub = connection.onAccountChange(
      gamePDA,
      (info: AccountInfo<Buffer>) => {
        if (programRef.current && info.data) {
          const gs = decodeGameState(programRef.current, info.data);
          if (gs) {
            store.setGameState(gs);
            if (gs.pendingDice) {
              store.addEvent({
                id: `dice-${Date.now()}`,
                timestamp: Date.now(),
                type: "dice_rolled",
                message: `Dice: ${gs.pendingDice[0] + gs.pendingDice[1]}`,
              });
            }
          }
        }
      },
      "confirmed"
    );

    return () => {
      connection.removeAccountChangeListener(gameSub);
    };
  }, [gameId]);

  // Player subscriptions
  useEffect(() => {
    if (!programRef.current) return;
    const connection = new Connection(RPC, "confirmed");
    const subs: number[] = [];

    for (const wallet of playerWallets) {
      const [playerPDA] = playerStatePDA(gameIdBytes, new PublicKey(wallet));

      // Initial fetch
      connection.getAccountInfo(playerPDA).then((info) => {
        if (info?.data && programRef.current) {
          const ps = decodePlayerState(programRef.current, info.data as Buffer);
          if (ps) store.setPlayerState(wallet, ps);
        }
      });

      const sub = connection.onAccountChange(
        playerPDA,
        (info: AccountInfo<Buffer>) => {
          if (programRef.current && info.data) {
            const ps = decodePlayerState(programRef.current, info.data);
            if (ps) store.setPlayerState(wallet, ps);
          }
        },
        "confirmed"
      );
      subs.push(sub);
    }

    return () => {
      subs.forEach((s) => connection.removeAccountChangeListener(s));
    };
  }, [playerWallets.join(",")]);

  // Property subscriptions
  useEffect(() => {
    if (!programRef.current) return;
    const connection = new Connection(RPC, "confirmed");
    const subs: number[] = [];

    for (const spaceIndex of PURCHASABLE_SPACES) {
      const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
      const sub = connection.onAccountChange(
        propPDA,
        (info: AccountInfo<Buffer>) => {
          if (programRef.current && info.data) {
            const prop = decodePropertyState(programRef.current, info.data);
            if (prop) store.setProperty(spaceIndex, prop);
          }
        },
        "confirmed"
      );
      subs.push(sub);
    }

    return () => {
      subs.forEach((s) => connection.removeAccountChangeListener(s));
    };
  }, [gameId]);
}
