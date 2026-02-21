"use client";
// web3-compat boundary — Anchor + web3.js v1 used here to build instructions.
// Signing and sending go through the kit-native useSendTransaction() pipeline.
import { useCallback } from "react";
import { useWalletConnection, useSolanaClient, useSendTransaction } from "@solana/react-hooks";
import { AccountRole, address as toAddress } from "@solana/kit";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  type TransactionInstruction,
} from "@solana/web3.js";
import { BN, AnchorProvider } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { loadIdl, getProgram } from "@/lib/anchor-client";
import {
  gameStatePDA,
  playerStatePDA,
  propertyStatePDA,
  tradeOfferPDA,
  bankVaultPDA,
  gameIdFromString,
} from "@/lib/pdas";
import { useGameStore } from "@/stores/gameStore";
import { BPOLY_MINT } from "@/lib/constants";

// Convert a web3.js v1 TransactionInstruction → kit IInstruction for useSendTransaction.
function toKitIx(ix: TransactionInstruction) {
  return {
    programAddress: toAddress(ix.programId.toBase58()),
    accounts: ix.keys.map((k) => ({
      address: toAddress(k.pubkey.toBase58()),
      role: k.isSigner
        ? k.isWritable
          ? AccountRole.WRITABLE_SIGNER
          : AccountRole.READONLY_SIGNER
        : k.isWritable
          ? AccountRole.WRITABLE
          : AccountRole.READONLY,
    })),
    data: ix.data.length > 0 ? new Uint8Array(ix.data) : undefined,
  };
}

// Build an Anchor Program for instruction construction (no signing — kit handles that).
async function buildProgram(connection: Connection, walletPK: PublicKey) {
  const idl = await loadIdl();
  if (!idl) return null;
  const fakeWallet = {
    publicKey: walletPK,
    signTransaction: async (tx: unknown) => tx,
    signAllTransactions: async (txs: unknown[]) => txs,
  };
  const provider = new AnchorProvider(connection, fakeWallet as never, {
    commitment: "confirmed",
  });
  return getProgram(provider, idl);
}

// Derive the bank's BPOLY ATA (bank_vault PDA is the owner).
function bankAta(gameIdBytes: Uint8Array, mint: PublicKey): PublicKey {
  const [vault] = bankVaultPDA(gameIdBytes);
  return getAssociatedTokenAddressSync(mint, vault, true);
}

// Derive a player's BPOLY ATA.
function playerAta(playerPK: PublicKey, mint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, playerPK, false);
}

export function useGameActions(gameId: string) {
  const { wallet } = useWalletConnection();
  const client = useSolanaClient();
  const { send: sendTx } = useSendTransaction();
  const store = useGameStore();

  const walletAddress = wallet?.account.address ?? null;

  const gameIdBytes = gameIdFromString(gameId);
  const [gamePDA] = gameStatePDA(gameIdBytes);
  const bpolyMint = new PublicKey(BPOLY_MINT);

  // Derive the web3.js Connection from kit client endpoint.
  const getConnection = useCallback((): Connection => {
    const endpoint =
      (client.config.endpoint as string | undefined) ??
      (client.config.rpc as string | undefined) ??
      "https://api.devnet.solana.com";
    return new Connection(endpoint, { commitment: "confirmed" });
  }, [client]);

  // Shared helper: build program + send a single instruction.
  const buildAndSend = useCallback(
    async (buildIx: (program: ReturnType<typeof getProgram>) => Promise<TransactionInstruction>) => {
      if (!walletAddress) throw new Error("Wallet not connected");
      const connection = getConnection();
      const walletPK = new PublicKey(walletAddress);
      const program = await buildProgram(connection, walletPK);
      if (!program) throw new Error("IDL not loaded — run `anchor build` first");
      const ix = await buildIx(program);
      await sendTx({ instructions: [toKitIx(ix)] });
    },
    [walletAddress, getConnection, sendTx]
  );

  // ── Core turn actions ───────────────────────────────────────────────────────

  const requestDiceRoll = useCallback(async () => {
    if (!walletAddress) return;
    try {
      store.addEvent({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: "dice_request",
        message: "Requesting dice roll…",
        player: walletAddress,
      });
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        return program.methods
          .requestDiceRoll(Array.from(gameIdBytes))
          .accounts({
            player: walletPK,
            gameState: gamePDA,
            playerState: playerPDA,
          })
          .instruction();
      });
    } catch (e) {
      console.error("requestDiceRoll:", e);
    }
  }, [walletAddress, gameId, buildAndSend]);

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
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          const nftAsset = Keypair.generate().publicKey; // placeholder NFT asset address
          return program.methods
            .buyProperty(Array.from(gameIdBytes), spaceIndex, nftAsset)
            .accounts({
              player: walletPK,
              gameState: gamePDA,
              playerState: playerPDA,
              propertyState: propPDA,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              playerBpolyAta: playerAta(walletPK, bpolyMint),
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            })
            .instruction();
        });
      } catch (e) {
        console.error("buyProperty:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  const declineBuy = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        return program.methods
          .declineBuy(Array.from(gameIdBytes))
          .accounts({
            player: walletPK,
            gameState: gamePDA,
            playerState: playerPDA,
          })
          .instruction();
      });
    } catch (e) {
      console.error("declineBuy:", e);
    }
  }, [walletAddress, gameId, buildAndSend]);

  const payRent = useCallback(
    async (spaceIndex: number, diceTotalForUtility = 0) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [payerPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);

          // Get owner from store for owner ATA
          const prop = store.properties.get(spaceIndex);
          const ownerPK = prop?.owner ?? walletPK;

          // Count bridges and utilities owned by current player from store state
          const myState = store.playerStates.get(walletAddress);
          const bridgesOwned = 0; // TODO: derive from player's properties
          const utilitiesOwned = 0; // TODO: derive from player's properties

          return program.methods
            .payRent(
              Array.from(gameIdBytes),
              diceTotalForUtility,
              bridgesOwned,
              utilitiesOwned
            )
            .accounts({
              payer: walletPK,
              gameState: gamePDA,
              payerState: payerPDA,
              propertyState: propPDA,
              payerBpolyAta: playerAta(walletPK, bpolyMint),
              ownerBpolyAta: playerAta(ownerPK, bpolyMint),
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        });
      } catch (e) {
        console.error("payRent:", e);
      }
    },
    [walletAddress, gameId, buildAndSend, store.properties, store.playerStates]
  );

  const buildLP = useCallback(
    async (spaceIndex: number, siblingLpCounts: number[]) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          return program.methods
            .buildLp(Array.from(gameIdBytes), spaceIndex, siblingLpCounts)
            .accounts({
              player: walletPK,
              gameState: gamePDA,
              playerState: playerPDA,
              propertyState: propPDA,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              playerBpolyAta: playerAta(walletPK, bpolyMint),
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        });
      } catch (e) {
        console.error("buildLP:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  const buildProtocol = useCallback(
    async (spaceIndex: number) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          return program.methods
            .buildProtocol(Array.from(gameIdBytes), spaceIndex)
            .accounts({
              player: walletPK,
              gameState: gamePDA,
              propertyState: propPDA,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              playerBpolyAta: playerAta(walletPK, bpolyMint),
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        });
      } catch (e) {
        console.error("buildProtocol:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  const sellLP = useCallback(
    async (spaceIndex: number) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          return program.methods
            .sellLp(Array.from(gameIdBytes), spaceIndex)
            .accounts({
              player: walletPK,
              gameState: gamePDA,
              propertyState: propPDA,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              playerBpolyAta: playerAta(walletPK, bpolyMint),
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        });
      } catch (e) {
        console.error("sellLP:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  const mortgageProperty = useCallback(
    async (spaceIndex: number) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          return program.methods
            .mortgageProperty(Array.from(gameIdBytes), spaceIndex)
            .accounts({
              player: walletPK,
              gameState: gamePDA,
              playerState: playerPDA,
              propertyState: propPDA,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              playerBpolyAta: playerAta(walletPK, bpolyMint),
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        });
      } catch (e) {
        console.error("mortgageProperty:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  const unmortgageProperty = useCallback(
    async (spaceIndex: number) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          return program.methods
            .unmortgageProperty(Array.from(gameIdBytes), spaceIndex)
            .accounts({
              player: walletPK,
              gameState: gamePDA,
              playerState: playerPDA,
              propertyState: propPDA,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              playerBpolyAta: playerAta(walletPK, bpolyMint),
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        });
      } catch (e) {
        console.error("unmortgageProperty:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  // ── Rug Pull Zone actions ───────────────────────────────────────────────────

  const rugpullPayBail = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .rugpullPayBail(Array.from(gameIdBytes))
          .accounts({
            player: walletPK,
            gameState: gamePDA,
            playerState: playerPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            playerBpolyAta: playerAta(walletPK, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
      });
    } catch (e) {
      console.error("rugpullPayBail:", e);
    }
  }, [walletAddress, gameId, buildAndSend]);

  const rugpullUseJailFreeCard = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .rugpullUseJailFreeCard(Array.from(gameIdBytes))
          .accounts({
            player: walletPK,
            gameState: gamePDA,
            playerState: playerPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            playerBpolyAta: playerAta(walletPK, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
      });
    } catch (e) {
      console.error("rugpullUseJailFreeCard:", e);
    }
  }, [walletAddress, gameId, buildAndSend]);

  // ── Auction ─────────────────────────────────────────────────────────────────

  const auctionBid = useCallback(
    async (spaceIndex: number, amount: bigint) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [bidderPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          const nftAsset = Keypair.generate().publicKey;
          return program.methods
            .auctionBid(
              Array.from(gameIdBytes),
              spaceIndex,
              new BN(amount.toString()),
              nftAsset
            )
            .accounts({
              bidder: walletPK,
              gameState: gamePDA,
              bidderState: bidderPDA,
              propertyState: propPDA,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              bidderBpolyAta: playerAta(walletPK, bpolyMint),
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            })
            .instruction();
        });
      } catch (e) {
        console.error("auctionBid:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  // ── Trading ─────────────────────────────────────────────────────────────────

  const proposeTrade = useCallback(
    async (params: {
      recipient: string;
      offeredProperties: number[];
      offeredBpoly: bigint;
      requestedProperties: number[];
      requestedBpoly: bigint;
      offeredJailFree?: boolean;
      requestedJailFree?: boolean;
    }) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const recipientPK = new PublicKey(params.recipient);
          const [proposerPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [tradeOfferPDAAddr] = tradeOfferPDA(gameIdBytes, walletPK);
          return program.methods
            .proposeTrade(
              Array.from(gameIdBytes),
              recipientPK,
              params.offeredProperties,
              new BN(params.offeredBpoly.toString()),
              params.requestedProperties,
              new BN(params.requestedBpoly.toString()),
              params.offeredJailFree ?? false,
              params.requestedJailFree ?? false
            )
            .accounts({
              proposer: walletPK,
              gameState: gamePDA,
              proposerState: proposerPDA,
              tradeOffer: tradeOfferPDAAddr,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            })
            .instruction();
        });
      } catch (e) {
        console.error("proposeTrade:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  const acceptTrade = useCallback(
    async (proposerWallet: string) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const proposerPK = new PublicKey(proposerWallet);
          const [recipientPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [proposerPDA] = playerStatePDA(gameIdBytes, proposerPK);
          const [tradeOfferAddr] = tradeOfferPDA(gameIdBytes, proposerPK);
          return program.methods
            .acceptTrade(Array.from(gameIdBytes))
            .accounts({
              recipient: walletPK,
              gameState: gamePDA,
              recipientState: recipientPDA,
              proposerState: proposerPDA,
              tradeOffer: tradeOfferAddr,
              systemProgram: SystemProgram.programId,
            })
            .instruction();
        });
      } catch (e) {
        console.error("acceptTrade:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  const rejectTrade = useCallback(
    async (proposerWallet: string) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const proposerPK = new PublicKey(proposerWallet);
          const [recipientPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [tradeOfferAddr] = tradeOfferPDA(gameIdBytes, proposerPK);
          return program.methods
            .rejectTrade(Array.from(gameIdBytes))
            .accounts({
              recipient: walletPK,
              gameState: gamePDA,
              recipientState: recipientPDA,
              tradeOffer: tradeOfferAddr,
              systemProgram: SystemProgram.programId,
            })
            .instruction();
        });
      } catch (e) {
        console.error("rejectTrade:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  // ── Lobby actions (initialize, join, start) ─────────────────────────────────

  const initializeGame = useCallback(
    async (maxPlayers: number, entryFeeLamports: bigint, nftCollection: PublicKey) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          return program.methods
            .initializeGame(
              Array.from(gameIdBytes),
              maxPlayers,
              new BN(entryFeeLamports.toString()),
              nftCollection
            )
            .accounts({
              host: walletPK,
              gameState: gamePDA,
              bpolyMint: bpolyMint,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
            })
            .instruction();
        });
      } catch (e) {
        console.error("initializeGame:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  const joinGame = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .joinGame(Array.from(gameIdBytes))
          .accounts({
            player: walletPK,
            gameState: gamePDA,
            playerState: playerPDA,
            playerBpolyAta: playerAta(walletPK, bpolyMint),
            bpolyMint: bpolyMint,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .instruction();
      });
    } catch (e) {
      console.error("joinGame:", e);
    }
  }, [walletAddress, gameId, buildAndSend]);

  const startGame = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const shuffleSeed = Keypair.generate().publicKey; // random seed for card shuffle
        return program.methods
          .startGame(Array.from(gameIdBytes), shuffleSeed)
          .accounts({
            host: walletPK,
            gameState: gamePDA,
          })
          .instruction();
      });
    } catch (e) {
      console.error("startGame:", e);
    }
  }, [walletAddress, gameId, buildAndSend]);

  return {
    walletAddress,
    // Lobby
    initializeGame,
    joinGame,
    startGame,
    // Core turn loop
    requestDiceRoll,
    buyProperty,
    declineBuy,
    payRent,
    // Building
    buildLP,
    buildProtocol,
    sellLP,
    // Property management
    mortgageProperty,
    unmortgageProperty,
    // Rug Pull Zone
    rugpullPayBail,
    rugpullUseJailFreeCard,
    // Auction
    auctionBid,
    // Trading
    proposeTrade,
    acceptTrade,
    rejectTrade,
  };
}
