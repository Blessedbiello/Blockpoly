"use client";

import { useState } from "react";
import { useJupiterSwap } from "@/hooks/useJupiterSwap";
import { formatBpoly, formatSol } from "@/lib/jupiter-client";

export function JupiterSwapPanel() {
  const [solAmount, setSolAmount] = useState("");
  const { status, quote, error, signature, fetchQuote, executeSwap, reset } =
    useJupiterSwap("sol_to_bpoly");

  const handleGetQuote = async () => {
    const lamports = Math.floor(parseFloat(solAmount) * 1e9);
    if (isNaN(lamports) || lamports <= 0) return;
    await fetchQuote(lamports.toString());
  };

  const priceImpact = quote ? parseFloat(quote.priceImpactPct) : 0;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d18c] to-[#00b4d8] flex items-center justify-center text-sm font-bold">
          J
        </div>
        <div>
          <h3 className="font-semibold text-white">Get BPOLY</h3>
          <p className="text-xs text-slate-400">Swap SOL via Jupiter</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">SOL Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={solAmount}
            onChange={(e) => {
              setSolAmount(e.target.value);
              if (status !== "idle") reset();
            }}
            placeholder="0.1"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#9945ff]"
          />
        </div>

        {status === "idle" || status === "error" ? (
          <button
            onClick={handleGetQuote}
            disabled={!solAmount || parseFloat(solAmount) <= 0}
            className="btn-primary w-full text-sm"
          >
            Get Quote
          </button>
        ) : null}

        {status === "quoting" && (
          <div className="text-center text-sm text-slate-400 py-2">
            Fetching quote...
          </div>
        )}

        {quote && (status === "quoted" || status === "signing" || status === "confirming") && (
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

        {status === "success" && signature && (
          <div className="bg-emerald-900/30 border border-emerald-800 rounded p-3 text-sm space-y-2">
            <div className="text-emerald-400">Swap successful!</div>
            <a
              href={`https://solscan.io/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9945ff] hover:underline break-all"
            >
              View on Solscan
            </a>
            <button onClick={reset} className="btn-secondary w-full text-xs mt-1">
              New Swap
            </button>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-xs bg-red-900/20 rounded p-2">{error}</div>
        )}
      </div>
    </div>
  );
}
