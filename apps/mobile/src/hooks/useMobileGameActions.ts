import { useCallback } from "react";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  type TransactionInstruction,
} from "@solana/web3.js";
import { BN, AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  gameStatePDA,
  playerStatePDA,
  propertyStatePDA,
  tradeOfferPDA,
  bankVaultPDA,
  gameIdFromString,
  useGameStore,
  BPOLY_MINT,
  NFT_COLLECTION,
  MPL_CORE_PROGRAM_ID,
  MAGICBLOCK_RPC,
  DELEGATION_PROGRAM_ID,
  PROGRAM_ID,
} from "@blockpoly/shared";
import idlJson from "@blockpoly/shared/src/idl/blockpoly.json";
import { useMobileWallet } from "./useMobileWallet";

const RPC = "https://api.devnet.solana.com";

function buildProgram(connection: Connection, walletPK: PublicKey): Program {
  const fakeWallet = {
    publicKey: walletPK,
    signTransaction: async (tx: unknown) => tx,
    signAllTransactions: async (txs: unknown[]) => txs,
  };
  const provider = new AnchorProvider(connection, fakeWallet as never, {
    commitment: "confirmed",
  });
  return new Program(idlJson as unknown as Idl, provider);
}

function bankAta(gameIdBytes: Uint8Array, mint: PublicKey): PublicKey {
  const [vault] = bankVaultPDA(gameIdBytes);
  return getAssociatedTokenAddressSync(mint, vault, true);
}

function playerAta(playerPK: PublicKey, mint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, playerPK, false);
}

export function useMobileGameActions(gameId: string) {
  const { publicKey, signAndSendTransaction, getConnection } = useMobileWallet();
  const store = useGameStore();

  const gameIdBytes = gameIdFromString(gameId);
  const [gamePDA] = gameStatePDA(gameIdBytes);
  const bpolyMint = new PublicKey(BPOLY_MINT);

  const send = useCallback(
    async (
      buildIx: (program: Program) => Promise<TransactionInstruction>,
      coSigners: Keypair[] = []
    ) => {
      if (!publicKey) throw new Error("Wallet not connected");
      const connection = getConnection();
      const program = buildProgram(connection, publicKey);
      const ix = await buildIx(program);
      return signAndSendTransaction([ix], coSigners);
    },
    [publicKey, getConnection, signAndSendTransaction]
  );

  // ── Lobby ─────────────────────────────────────────────────────────────

  const initializeGame = useCallback(
    async (maxPlayers: number, entryFeeLamports: bigint, nftCollection: PublicKey) => {
      await send(async (program) => {
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .initializeGame(
            Array.from(gameIdBytes),
            maxPlayers,
            new BN(entryFeeLamports.toString()),
            nftCollection
          )
          .accounts({
            host: publicKey!,
            gameState: gamePDA,
            bpolyMint,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  const joinGame = useCallback(async () => {
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      const [vaultPDA] = bankVaultPDA(gameIdBytes);
      return program.methods
        .joinGame(Array.from(gameIdBytes))
        .accounts({
          player: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
          playerBpolyAta: playerAta(publicKey!, bpolyMint),
          bpolyMint,
          bankVault: vaultPDA,
          bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  const startGame = useCallback(async () => {
    await send(async (program) => {
      const shuffleSeed = Keypair.generate().publicKey;
      return program.methods
        .startGame(Array.from(gameIdBytes), shuffleSeed)
        .accounts({
          host: publicKey!,
          gameState: gamePDA,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  // ── Core turn actions ─────────────────────────────────────────────────

  const requestDiceRoll = useCallback(async () => {
    store.addEvent({
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: "dice_request",
      message: "Requesting dice roll...",
      player: publicKey?.toBase58(),
    });
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      return program.methods
        .requestDiceRoll(Array.from(gameIdBytes))
        .accounts({
          player: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  const resolveLanding = useCallback(async () => {
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      const [vaultPDA] = bankVaultPDA(gameIdBytes);
      return program.methods
        .resolveLanding(Array.from(gameIdBytes))
        .accounts({
          player: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
          bankVault: vaultPDA,
          bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
          playerBpolyAta: playerAta(publicKey!, bpolyMint),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  const drawCard = useCallback(async () => {
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      return program.methods
        .drawCard(Array.from(gameIdBytes))
        .accounts({
          player: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  const rugpullAttemptDoubles = useCallback(async () => {
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      const [vaultPDA] = bankVaultPDA(gameIdBytes);
      return program.methods
        .rugpullAttemptDoubles(Array.from(gameIdBytes))
        .accounts({
          player: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
          bankVault: vaultPDA,
          bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
          playerBpolyAta: playerAta(publicKey!, bpolyMint),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  // ── Property actions ──────────────────────────────────────────────────

  const buyProperty = useCallback(
    async (spaceIndex: number) => {
      const assetKeypair = Keypair.generate();
      await send(async (program) => {
        const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .buyProperty(Array.from(gameIdBytes), spaceIndex)
          .accounts({
            player: publicKey!,
            gameState: gamePDA,
            playerState: playerPDA,
            propertyState: propPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            playerBpolyAta: playerAta(publicKey!, bpolyMint),
            nftAsset: assetKeypair.publicKey,
            nftCollection: new PublicKey(NFT_COLLECTION),
            mplCoreProgram: new PublicKey(MPL_CORE_PROGRAM_ID),
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .instruction();
      }, [assetKeypair]);
    },
    [publicKey, gameId, send]
  );

  const declineBuy = useCallback(async () => {
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      return program.methods
        .declineBuy(Array.from(gameIdBytes))
        .accounts({
          player: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  const payRent = useCallback(
    async (spaceIndex: number, diceTotalForUtility = 0) => {
      await send(async (program) => {
        const [payerPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
        const prop = store.properties.get(spaceIndex);
        const ownerPK = prop?.owner ?? publicKey!;
        return program.methods
          .payRent(Array.from(gameIdBytes), diceTotalForUtility, 0, 0)
          .accounts({
            payer: publicKey!,
            gameState: gamePDA,
            payerState: payerPDA,
            propertyState: propPDA,
            payerBpolyAta: playerAta(publicKey!, bpolyMint),
            ownerBpolyAta: playerAta(ownerPK, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send, store.properties]
  );

  const buildLP = useCallback(
    async (spaceIndex: number, siblingLpCounts: number[]) => {
      await send(async (program) => {
        const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .buildLp(Array.from(gameIdBytes), spaceIndex, siblingLpCounts)
          .accounts({
            player: publicKey!,
            gameState: gamePDA,
            playerState: playerPDA,
            propertyState: propPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            playerBpolyAta: playerAta(publicKey!, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  const buildProtocol = useCallback(
    async (spaceIndex: number) => {
      await send(async (program) => {
        const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .buildProtocol(Array.from(gameIdBytes), spaceIndex)
          .accounts({
            player: publicKey!,
            gameState: gamePDA,
            propertyState: propPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            playerBpolyAta: playerAta(publicKey!, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  const sellLP = useCallback(
    async (spaceIndex: number) => {
      await send(async (program) => {
        const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .sellLp(Array.from(gameIdBytes), spaceIndex)
          .accounts({
            player: publicKey!,
            gameState: gamePDA,
            propertyState: propPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            playerBpolyAta: playerAta(publicKey!, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  const mortgageProperty = useCallback(
    async (spaceIndex: number) => {
      await send(async (program) => {
        const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .mortgageProperty(Array.from(gameIdBytes), spaceIndex)
          .accounts({
            player: publicKey!,
            gameState: gamePDA,
            playerState: playerPDA,
            propertyState: propPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            playerBpolyAta: playerAta(publicKey!, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  const unmortgageProperty = useCallback(
    async (spaceIndex: number) => {
      await send(async (program) => {
        const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        return program.methods
          .unmortgageProperty(Array.from(gameIdBytes), spaceIndex)
          .accounts({
            player: publicKey!,
            gameState: gamePDA,
            playerState: playerPDA,
            propertyState: propPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            playerBpolyAta: playerAta(publicKey!, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  // ── Rug Pull ──────────────────────────────────────────────────────────

  const rugpullPayBail = useCallback(async () => {
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      const [vaultPDA] = bankVaultPDA(gameIdBytes);
      return program.methods
        .rugpullPayBail(Array.from(gameIdBytes))
        .accounts({
          player: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
          bankVault: vaultPDA,
          bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
          playerBpolyAta: playerAta(publicKey!, bpolyMint),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  const rugpullUseJailFreeCard = useCallback(async () => {
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      const [vaultPDA] = bankVaultPDA(gameIdBytes);
      return program.methods
        .rugpullUseJailFreeCard(Array.from(gameIdBytes))
        .accounts({
          player: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
          bankVault: vaultPDA,
          bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
          playerBpolyAta: playerAta(publicKey!, bpolyMint),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  // ── Auction ───────────────────────────────────────────────────────────

  const auctionBid = useCallback(
    async (spaceIndex: number, amount: bigint) => {
      await send(async (program) => {
        const [bidderPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [propPDA] = propertyStatePDA(gameIdBytes, spaceIndex);
        const [vaultPDA] = bankVaultPDA(gameIdBytes);
        const nftAsset = Keypair.generate().publicKey;
        return program.methods
          .auctionBid(Array.from(gameIdBytes), spaceIndex, new BN(amount.toString()), nftAsset)
          .accounts({
            bidder: publicKey!,
            gameState: gamePDA,
            bidderState: bidderPDA,
            propertyState: propPDA,
            bankVault: vaultPDA,
            bankBpolyAta: bankAta(gameIdBytes, bpolyMint),
            bidderBpolyAta: playerAta(publicKey!, bpolyMint),
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  // ── Trading ───────────────────────────────────────────────────────────

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
      await send(async (program) => {
        const recipientPK = new PublicKey(params.recipient);
        const [proposerPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [tradeOfferAddr] = tradeOfferPDA(gameIdBytes, publicKey!);
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
            proposer: publicKey!,
            gameState: gamePDA,
            proposerState: proposerPDA,
            tradeOffer: tradeOfferAddr,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  const acceptTrade = useCallback(
    async (proposerWallet: string) => {
      await send(async (program) => {
        const proposerPK = new PublicKey(proposerWallet);
        const [recipientPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [proposerPDA] = playerStatePDA(gameIdBytes, proposerPK);
        const [tradeOfferAddr] = tradeOfferPDA(gameIdBytes, proposerPK);
        return program.methods
          .acceptTrade(Array.from(gameIdBytes))
          .accounts({
            recipient: publicKey!,
            gameState: gamePDA,
            recipientState: recipientPDA,
            proposerState: proposerPDA,
            tradeOffer: tradeOfferAddr,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  const rejectTrade = useCallback(
    async (proposerWallet: string) => {
      await send(async (program) => {
        const proposerPK = new PublicKey(proposerWallet);
        const [recipientPDA] = playerStatePDA(gameIdBytes, publicKey!);
        const [tradeOfferAddr] = tradeOfferPDA(gameIdBytes, proposerPK);
        return program.methods
          .rejectTrade(Array.from(gameIdBytes))
          .accounts({
            recipient: publicKey!,
            gameState: gamePDA,
            recipientState: recipientPDA,
            tradeOffer: tradeOfferAddr,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  // ── End-game ──────────────────────────────────────────────────────────

  const claimPrize = useCallback(async () => {
    await send(async (program) => {
      const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
      return program.methods
        .claimPrize(Array.from(gameIdBytes))
        .accounts({
          winner: publicKey!,
          gameState: gamePDA,
          playerState: playerPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
    });
  }, [publicKey, gameId, send]);

  const declareBankruptcy = useCallback(
    async (creditor: string) => {
      await send(async (program) => {
        const creditorPK = new PublicKey(creditor);
        const [playerPDA] = playerStatePDA(gameIdBytes, publicKey!);
        return program.methods
          .declareBankruptcy(Array.from(gameIdBytes), creditorPK)
          .accounts({
            player: publicKey!,
            gameState: gamePDA,
            playerState: playerPDA,
          })
          .instruction();
      });
    },
    [publicKey, gameId, send]
  );

  // ── MagicBlock delegation ─────────────────────────────────────────────

  const delegateGame = useCallback(async () => {
    const gameState = store.gameState;
    if (!gameState) return;
    await send(async (program) => {
      const remainingAccounts = gameState.players.map((p) => {
        const [pda] = playerStatePDA(gameIdBytes, p);
        return { pubkey: pda, isSigner: false, isWritable: true };
      });
      return program.methods
        .delegateGame(Array.from(gameIdBytes))
        .accounts({
          host: publicKey!,
          gameState: gamePDA,
          delegationProgram: new PublicKey(DELEGATION_PROGRAM_ID),
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
    });
    store.setDelegated(true);
  }, [publicKey, gameId, send, store.gameState]);

  const undelegateGame = useCallback(async () => {
    const gameState = store.gameState;
    if (!gameState) return;
    await send(async (program) => {
      const remainingAccounts = gameState.players.map((p) => {
        const [pda] = playerStatePDA(gameIdBytes, p);
        return { pubkey: pda, isSigner: false, isWritable: true };
      });
      return program.methods
        .undelegateGame(Array.from(gameIdBytes))
        .accounts({
          host: publicKey!,
          gameState: gamePDA,
          delegationProgram: new PublicKey(DELEGATION_PROGRAM_ID),
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
    });
    store.setDelegated(false);
  }, [publicKey, gameId, send, store.gameState]);

  return {
    walletAddress: publicKey?.toBase58() ?? null,
    initializeGame,
    joinGame,
    startGame,
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
    rugpullAttemptDoubles,
    resolveLanding,
    drawCard,
    auctionBid,
    proposeTrade,
    acceptTrade,
    rejectTrade,
    claimPrize,
    declareBankruptcy,
    delegateGame,
    undelegateGame,
  };
}
