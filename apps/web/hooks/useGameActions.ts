"use client";
// web3-compat boundary — Anchor + web3.js v1 used here to build instructions.
// Signing goes through wallet-adapter signTransaction for co-signer support (mpl-core, Jupiter).
// Turn-loop actions conditionally route through MagicBlock when delegated.
import { useCallback } from "react";
import { useWalletConnection, useSolanaClient, useSendTransaction } from "@solana/react-hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { AccountRole, address as toAddress } from "@solana/kit";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionMessage,
  VersionedTransaction,
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
import {
  BPOLY_MINT,
  NFT_COLLECTION,
  MPL_CORE_PROGRAM_ID,
  MAGICBLOCK_RPC,
  DELEGATION_PROGRAM_ID,
} from "@/lib/constants";

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
  const { signTransaction } = useWallet();
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

  // MagicBlock connection factory.
  const getMagicBlockConnection = useCallback(
    (): Connection => new Connection(MAGICBLOCK_RPC, { commitment: "confirmed" }),
    []
  );

  // Shared helper: build program + send a single instruction via kit pipeline.
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

  // Co-signer helper: build ix, co-sign with keypairs, wallet signs, send raw.
  const buildAndSendWithCoSigner = useCallback(
    async (
      buildIx: (program: ReturnType<typeof getProgram>) => Promise<TransactionInstruction>,
      coSigners: Keypair[]
    ) => {
      if (!walletAddress) throw new Error("Wallet not connected");
      if (!signTransaction) throw new Error("Wallet does not support signTransaction");
      const connection = getConnection();
      const walletPK = new PublicKey(walletAddress);
      const program = await buildProgram(connection, walletPK);
      if (!program) throw new Error("IDL not loaded");
      const ix = await buildIx(program);
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const messageV0 = new TransactionMessage({
        payerKey: walletPK,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToV0Message();
      const vtx = new VersionedTransaction(messageV0);
      vtx.sign(coSigners);
      const signedTx = await signTransaction(vtx);
      const sig = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, "confirmed");
      return sig;
    },
    [walletAddress, getConnection, signTransaction]
  );

  // MagicBlock routing: send via MagicBlock RPC when delegated.
  const buildAndSendOnMagicBlock = useCallback(
    async (buildIx: (program: ReturnType<typeof getProgram>) => Promise<TransactionInstruction>) => {
      if (!walletAddress) throw new Error("Wallet not connected");
      if (!signTransaction) throw new Error("Wallet does not support signTransaction");
      const connection = getMagicBlockConnection();
      const walletPK = new PublicKey(walletAddress);
      const program = await buildProgram(connection, walletPK);
      if (!program) throw new Error("IDL not loaded");
      const ix = await buildIx(program);
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const messageV0 = new TransactionMessage({
        payerKey: walletPK,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [ix],
      }).compileToV0Message();
      const vtx = new VersionedTransaction(messageV0);
      const signedTx = await signTransaction(vtx);
      const sig = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, "confirmed");
      return sig;
    },
    [walletAddress, getMagicBlockConnection, signTransaction]
  );

  // Select send method based on delegation state.
  const getSender = useCallback(
    () => (store.isDelegated ? buildAndSendOnMagicBlock : buildAndSend),
    [store.isDelegated, buildAndSend, buildAndSendOnMagicBlock]
  );

  // ── Core turn actions (route through MagicBlock when delegated) ─────────

  const requestDiceRoll = useCallback(async () => {
    if (!walletAddress) return;
    try {
      store.addEvent({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: "dice_request",
        message: "Requesting dice roll\u2026",
        player: walletAddress,
      });
      const send = getSender();
      await send(async (program) => {
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
  }, [walletAddress, gameId, getSender]);

  const resolveLanding = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const send = getSender();
      await send(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .resolveLanding(Array.from(gameIdBytes))
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
      console.error("resolveLanding:", e);
    }
  }, [walletAddress, gameId, getSender]);

  const drawCard = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const send = getSender();
      await send(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        return program.methods
          .drawCard(Array.from(gameIdBytes))
          .accounts({
            player: walletPK,
            gameState: gamePDA,
            playerState: playerPDA,
          })
          .instruction();
      });
    } catch (e) {
      console.error("drawCard:", e);
    }
  }, [walletAddress, gameId, getSender]);

  const rugpullAttemptDoubles = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const send = getSender();
      await send(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .rugpullAttemptDoubles(Array.from(gameIdBytes))
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
      console.error("rugpullAttemptDoubles:", e);
    }
  }, [walletAddress, gameId, getSender]);

  // ── Property actions (always route through Solana) ──────────────────────

  const buyProperty = useCallback(
    async (spaceIndex: number) => {
      if (!walletAddress) return;
      try {
        const assetKeypair = Keypair.generate();
        store.addEvent({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: "buy",
          message: `Buying property at space ${spaceIndex}`,
          player: walletAddress,
        });
        await buildAndSendWithCoSigner(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
          const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
          const [vaultPDA] = bankVaultPDA(gameIdBytes);
          return program.methods
            .buyProperty(Array.from(gameIdBytes), spaceIndex)
            .accounts({
              player: walletPK,
              gameState: gamePDA,
              playerState: playerPDA,
              propertyState: propPDA,
              bankVault: vaultPDA,
              bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
              playerBpolyAta: playerAta(walletPK, bpolyMint),
              nftAsset: assetKeypair.publicKey,
              nftCollection: new PublicKey(NFT_COLLECTION),
              mplCoreProgram: new PublicKey(MPL_CORE_PROGRAM_ID),
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            })
            .instruction();
        }, [assetKeypair]);
      } catch (e) {
        console.error("buyProperty:", e);
      }
    },
    [walletAddress, gameId, buildAndSendWithCoSigner]
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

          const prop = store.properties.get(spaceIndex);
          const ownerPK = prop?.owner ?? walletPK;

          const bridgesOwned = 0;
          const utilitiesOwned = 0;

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

  // ── Rug Pull Zone actions ───────────────────────────────────────────────

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

  // ── Auction ─────────────────────────────────────────────────────────────

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

  // ── Trading ─────────────────────────────────────────────────────────────

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

  // ── End-game actions ────────────────────────────────────────────────────

  const claimPrize = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
        return program.methods
          .claimPrize(Array.from(gameIdBytes))
          .accounts({
            winner: walletPK,
            gameState: gamePDA,
            playerState: playerPDA,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
      });
    } catch (e) {
      console.error("claimPrize:", e);
    }
  }, [walletAddress, gameId, buildAndSend]);

  const declareBankruptcy = useCallback(
    async (creditor: string) => {
      if (!walletAddress) return;
      try {
        await buildAndSend(async (program) => {
          const walletPK = new PublicKey(walletAddress);
          const creditorPK = new PublicKey(creditor);
          const [playerPDA] = playerStatePDA(gameIdBytes, walletPK);
          return program.methods
            .declareBankruptcy(Array.from(gameIdBytes), creditorPK)
            .accounts({
              player: walletPK,
              gameState: gamePDA,
              playerState: playerPDA,
            })
            .instruction();
        });
      } catch (e) {
        console.error("declareBankruptcy:", e);
      }
    },
    [walletAddress, gameId, buildAndSend]
  );

  // ── Lobby actions (initialize, join, start) ─────────────────────────────

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
        const shuffleSeed = Keypair.generate().publicKey;
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

  // ── MagicBlock delegation ───────────────────────────────────────────────

  const delegateGame = useCallback(async () => {
    if (!walletAddress) return;
    const gameState = store.gameState;
    if (!gameState) return;
    try {
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const remainingAccounts = gameState.players.map((p) => {
          const [pda] = playerStatePDA(gameIdBytes, p);
          return { pubkey: pda, isSigner: false, isWritable: true };
        });
        return program.methods
          .delegateGame(Array.from(gameIdBytes))
          .accounts({
            host: walletPK,
            gameState: gamePDA,
            delegationProgram: new PublicKey(DELEGATION_PROGRAM_ID),
            systemProgram: SystemProgram.programId,
          })
          .remainingAccounts(remainingAccounts)
          .instruction();
      });
      store.setDelegated(true);
    } catch (e) {
      console.error("delegateGame:", e);
    }
  }, [walletAddress, gameId, buildAndSend, store.gameState]);

  const undelegateGame = useCallback(async () => {
    if (!walletAddress) return;
    const gameState = store.gameState;
    if (!gameState) return;
    try {
      await buildAndSend(async (program) => {
        const walletPK = new PublicKey(walletAddress);
        const remainingAccounts = gameState.players.map((p) => {
          const [pda] = playerStatePDA(gameIdBytes, p);
          return { pubkey: pda, isSigner: false, isWritable: true };
        });
        return program.methods
          .undelegateGame(Array.from(gameIdBytes))
          .accounts({
            host: walletPK,
            gameState: gamePDA,
            delegationProgram: new PublicKey(DELEGATION_PROGRAM_ID),
            systemProgram: SystemProgram.programId,
          })
          .remainingAccounts(remainingAccounts)
          .instruction();
      });
      store.setDelegated(false);
    } catch (e) {
      console.error("undelegateGame:", e);
    }
  }, [walletAddress, gameId, buildAndSend, store.gameState]);

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
    rugpullAttemptDoubles,
    // Landing / cards
    resolveLanding,
    drawCard,
    // Auction
    auctionBid,
    // Trading
    proposeTrade,
    acceptTrade,
    rejectTrade,
    // End-game
    claimPrize,
    declareBankruptcy,
    // MagicBlock
    delegateGame,
    undelegateGame,
  };
}
