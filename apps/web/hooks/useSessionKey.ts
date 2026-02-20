"use client";
import { useEffect, useState, useCallback } from "react";
import { Keypair } from "@solana/web3.js";

const SESSION_KEY_STORAGE = "blockpoly_session_key";

export function useSessionKey(gameId: string) {
  const [sessionKeypair, setSessionKeypair] = useState<Keypair | null>(null);

  // Load or create ephemeral session keypair for a game
  useEffect(() => {
    if (!gameId) return;

    const stored = localStorage.getItem(`${SESSION_KEY_STORAGE}_${gameId}`);
    if (stored) {
      try {
        const secretKey = new Uint8Array(JSON.parse(stored));
        setSessionKeypair(Keypair.fromSecretKey(secretKey));
        return;
      } catch {
        // Invalid stored key, generate new one
      }
    }

    const kp = Keypair.generate();
    localStorage.setItem(
      `${SESSION_KEY_STORAGE}_${gameId}`,
      JSON.stringify(Array.from(kp.secretKey))
    );
    setSessionKeypair(kp);
  }, [gameId]);

  const clearSessionKey = useCallback(() => {
    if (gameId) {
      localStorage.removeItem(`${SESSION_KEY_STORAGE}_${gameId}`);
      setSessionKeypair(null);
    }
  }, [gameId]);

  return {
    sessionKeypair,
    sessionPublicKey: sessionKeypair?.publicKey ?? null,
    clearSessionKey,
  };
}
