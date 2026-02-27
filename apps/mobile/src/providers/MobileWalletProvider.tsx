import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { PublicKey } from "@solana/web3.js";

export interface MobileWalletState {
  publicKey: PublicKey | null;
  authToken: string | null;
  connected: boolean;
  connecting: boolean;
  authorize: () => Promise<void>;
  disconnect: () => void;
}

const MobileWalletContext = createContext<MobileWalletState>({
  publicKey: null,
  authToken: null,
  connected: false,
  connecting: false,
  authorize: async () => {},
  disconnect: () => {},
});

export function useMobileWalletContext() {
  return useContext(MobileWalletContext);
}

export function MobileWalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const authorize = useCallback(async () => {
    setConnecting(true);
    try {
      // Dynamic import to avoid bundling issues on non-Solana-Mobile devices
      const { transact } = await import(
        "@solana-mobile/mobile-wallet-adapter-protocol-web3js"
      );

      await transact(async (wallet) => {
        const result = await wallet.authorize({
          identity: {
            name: "Blockpoly",
            uri: "https://blockpoly.app",
            icon: "favicon.ico",
          },
          cluster: "devnet",
        });

        const pk = new PublicKey(result.accounts[0].address);
        setPublicKey(pk);
        setAuthToken(result.auth_token);
      });
    } catch (err) {
      console.error("MWA authorize failed:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setAuthToken(null);
  }, []);

  return (
    <MobileWalletContext.Provider
      value={{
        publicKey,
        authToken,
        connected: publicKey !== null,
        connecting,
        authorize,
        disconnect,
      }}
    >
      {children}
    </MobileWalletContext.Provider>
  );
}
