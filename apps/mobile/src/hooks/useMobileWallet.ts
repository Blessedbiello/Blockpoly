import { useCallback } from "react";
import {
  Connection,
  PublicKey,
  VersionedTransaction,
  type TransactionInstruction,
  TransactionMessage,
  Keypair,
} from "@solana/web3.js";
import { useMobileWalletContext } from "../providers/MobileWalletProvider";

const RPC = "https://api.devnet.solana.com";

export function useMobileWallet() {
  const { publicKey, authToken } = useMobileWalletContext();

  const getConnection = useCallback(
    () => new Connection(RPC, "confirmed"),
    []
  );

  const signAndSendTransaction = useCallback(
    async (
      instructions: TransactionInstruction[],
      coSigners: Keypair[] = []
    ): Promise<string> => {
      if (!publicKey) throw new Error("Wallet not connected");

      const { transact } = await import(
        "@solana-mobile/mobile-wallet-adapter-protocol-web3js"
      );

      const connection = getConnection();
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const vtx = new VersionedTransaction(messageV0);

      // Co-sign first (e.g., NFT asset keypair)
      if (coSigners.length > 0) {
        vtx.sign(coSigners);
      }

      let signature = "";

      await transact(async (wallet) => {
        // Reauthorize with saved token
        if (authToken) {
          await wallet.reauthorize({ auth_token: authToken });
        } else {
          await wallet.authorize({
            identity: {
              name: "Blockpoly",
              uri: "https://blockpoly.app",
              icon: "favicon.ico",
            },
            cluster: "devnet",
          });
        }

        const signedTxs = await wallet.signAndSendTransactions({
          transactions: [vtx],
          minContextSlot: 0,
        });

        signature = signedTxs[0]
          ? Buffer.from(signedTxs[0]).toString("base64")
          : "";
      });

      // Confirm
      if (signature) {
        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );
      }

      return signature;
    },
    [publicKey, authToken, getConnection]
  );

  return {
    publicKey,
    connected: publicKey !== null,
    getConnection,
    signAndSendTransaction,
  };
}
