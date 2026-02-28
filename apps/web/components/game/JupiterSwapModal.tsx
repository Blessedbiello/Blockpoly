"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useJupiterSwap } from "@/hooks/useJupiterSwap";
import { formatBpoly, formatSol } from "@/lib/jupiter-client";

export function JupiterSwapModal() {
  const { activeModal, closeModal } = useGameStore();
  const [solAmount, setSolAmount] = useState("0.1");
  const { status, quote, error, signature, fetchQuote, executeSwap, reset } =
    useJupiterSwap("sol_to_bpoly");

  if (activeModal !== "jupiter_prompt") return null;

  const handleGetQuote = async () => {
    const lamports = Math.floor(parseFloat(solAmount) * 1e9);
    if (isNaN(lamports) || lamports <= 0) return;
    await fetchQuote(lamports.toString());
  };

  const handleClose = () => {
    reset();
    setSolAmount("0.1");
    closeModal();
  };

  const priceImpact = quote ? parseFloat(quote.priceImpactPct) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="card w-96 overflow-hidden shadow-2xl">
        {/* Header */}
        <div
          className="p-6 text-center"
          style={{
            background: "linear-gradient(135deg, #001a0d, #002a1a, #001a0d)",
          }}
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#00d18c] to-[#00b4d8] flex items-center justify-center text-xl font-bold mb-3">
            J
          </div>
          <div className="text-xs text-emerald-400 uppercase tracking-widest font-semibold">
            Jupiter DEX
          </div>
          <div className="text-lg font-bold text-white mt-1">
            You&apos;ve arrived at Jupiter
          </div>
          <div className="text-xs text-slate-400 mt-1">
            The galaxy&apos;s busiest DEX. Swap SOL for BPOLY to top up your balance.
          </div>
        </div>

        <div className="p-6 space-y-4">
          {status !== "success" && (
            <>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">SOL Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={solAmount}
                  onChange={(e) => {
                    setSolAmount(e.target.value);
                    if (quote) reset();
                  }}
                  placeholder="0.1"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {!quote && status !== "quoting" && (
                <button
                  onClick={handleGetQuote}
                  disabled={!solAmount || parseFloat(solAmount) <= 0}
                  className="btn-primary w-full text-sm"
                >
                  Get Quote
                </button>
              )}

              {status === "quoting" && (
                <div className="text-center text-sm text-slate-400 py-2">
                  Fetching quote...
                </div>
              )}

              {quote && (
                <div className="bg-slate-800/50 rounded p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">You pay</span>
                    <span className="text-white">{formatSol(quote.inAmount)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">You receive</span>
                    <span className="text-emerald-400">{formatBpoly(quote.outAmount)} BPOLY</span>
                  </div>
                  {priceImpact > 1 && (
                    <div className="text-amber-400 text-xs">
                      Price impact: {priceImpact.toFixed(2)}%
                    </div>
                  )}
                  <button
                    onClick={executeSwap}
                    disabled={status === "signing" || status === "confirming"}
                    className="btn-success w-full text-sm mt-2"
                  >
                    {status === "signing"
                      ? "Signing..."
                      : status === "confirming"
                        ? "Confirming..."
                        : "Swap"}
                  </button>
                </div>
              )}
            </>
          )}

          {status === "success" && signature && (
            <div className="bg-emerald-900/30 border border-emerald-800 rounded p-3 text-sm space-y-2 text-center">
              <div className="text-emerald-400 font-semibold">Swap successful!</div>
              <a
                href={`https://solscan.io/tx/${signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#9945ff] hover:underline break-all"
              >
                View on Solscan
              </a>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-xs bg-red-900/20 rounded p-2">{error}</div>
          )}

          <button onClick={handleClose} className="btn-secondary w-full text-sm">
            {status === "success" ? "Continue" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}
