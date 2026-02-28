"use client";
// web3-compat boundary — needs VersionedTransaction for Jupiter swap deserialization.
import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolanaClient } from "@solana/react-hooks";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import {
  getQuote,
  getSwapTransaction,
  type JupiterQuote,
} from "@/lib/jupiter-client";
import { BPOLY_MINT, SOL_MINT } from "@/lib/constants";

export type SwapStatus =
  | "idle"
  | "quoting"
  | "quoted"
  | "signing"
  | "confirming"
  | "success"
  | "error";

export type SwapDirection = "sol_to_bpoly" | "bpoly_to_sol";

export function useJupiterSwap(direction: SwapDirection = "sol_to_bpoly") {
  const { publicKey, signTransaction } = useWallet();
  const client = useSolanaClient();

  const [status, setStatus] = useState<SwapStatus>("idle");
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const inputMint = direction === "sol_to_bpoly" ? SOL_MINT : BPOLY_MINT;
  const outputMint = direction === "sol_to_bpoly" ? BPOLY_MINT : SOL_MINT;

  const getConnection = useCallback((): Connection => {
    const endpoint =
      (client.config.endpoint as string | undefined) ??
      (client.config.rpc as string | undefined) ??
      "https://api.devnet.solana.com";
    return new Connection(endpoint, { commitment: "confirmed" });
  }, [client]);

  const fetchQuote = useCallback(
    async (amount: string) => {
      setStatus("quoting");
      setError(null);
      setQuote(null);
      try {
        const q = await getQuote(inputMint, outputMint, amount);
        setQuote(q);
        setStatus("quoted");
        return q;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Quote failed");
        setStatus("error");
        return null;
      }
    },
    [inputMint, outputMint]
  );

  const executeSwap = useCallback(async () => {
    if (!quote || !publicKey || !signTransaction) {
      setError("Missing quote, wallet, or signTransaction");
      setStatus("error");
      return null;
    }

    setStatus("signing");
    setError(null);
    try {
      const { swapTransaction, lastValidBlockHeight } = await getSwapTransaction(
        quote,
        publicKey.toBase58()
      );

      const swapTxBuf = Buffer.from(swapTransaction, "base64");
      const vtx = VersionedTransaction.deserialize(swapTxBuf);
      const signedTx = await signTransaction(vtx);

      setStatus("confirming");
      const connection = getConnection();
      const sig = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature: sig, ...latestBlockhash, lastValidBlockHeight },
        "confirmed"
      );

      setSignature(sig);
      setStatus("success");
      return sig;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Swap failed");
      setStatus("error");
      return null;
    }
  }, [quote, publicKey, signTransaction, getConnection]);

  const reset = useCallback(() => {
    setStatus("idle");
    setQuote(null);
    setError(null);
    setSignature(null);
  }, []);

  return {
    status,
    quote,
    error,
    signature,
    fetchQuote,
    executeSwap,
    reset,
  };
}
