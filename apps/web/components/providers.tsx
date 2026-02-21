"use client";

// Framework-kit-first provider setup (per solana-dev skill).
// @solana/client + @solana/react-hooks handle wallet discovery and connection.
// Anchor / web3.js v1 types stay isolated behind anchor-client.ts (web3-compat boundary).

import { ReactNode } from "react";
import { SolanaProvider } from "@solana/react-hooks";
import { autoDiscover, createClient } from "@solana/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

const endpoint =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

// Derive WS endpoint from HTTP endpoint unless explicitly overridden.
const websocketEndpoint =
  process.env.NEXT_PUBLIC_WS_URL ??
  endpoint.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");

// Single Solana client for the whole app — framework-kit pattern.
export const solanaClient = createClient({
  endpoint,
  websocketEndpoint,
  walletConnectors: autoDiscover(),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaProvider client={solanaClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0f0f1a",
              border: "1px solid #1a1a3e",
              color: "#e2e8f0",
            },
          }}
        />
      </SolanaProvider>
    </QueryClientProvider>
  );
}
