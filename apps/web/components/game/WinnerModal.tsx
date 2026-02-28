"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useJupiterSwap } from "@/hooks/useJupiterSwap";
import { formatBpoly, formatSol } from "@/lib/jupiter-client";
import { BPOLY_DECIMALS } from "@/lib/constants";
import { useRouter } from "next/navigation";

export function WinnerModal() {
  const { activeModal, modalData, closeModal, reset: resetStore } = useGameStore();
  const router = useRouter();
  const [bpolyAmount, setBpolyAmount] = useState("");
  const { status, quote, error, signature, fetchQuote, executeSwap, reset: resetSwap } =
    useJupiterSwap("bpoly_to_sol");

  if (activeModal !== "winner") return null;

  const data = modalData as { winner: string; prizeSOL: number } | null;

  const handleExit = () => {
    closeModal();
    resetStore();
    router.push("/lobby");
  };

  const handleGetQuote = async () => {
    const microBpoly = Math.floor(parseFloat(bpolyAmount) * 10 ** BPOLY_DECIMALS);
    if (isNaN(microBpoly) || microBpoly <= 0) return;
    await fetchQuote(microBpoly.toString());
  };

  const priceImpact = quote ? parseFloat(quote.priceImpactPct) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="card w-96 overflow-hidden shadow-2xl text-center">
        {/* Trophy header */}
        <div
          className="p-8"
          style={{
            background:
              "linear-gradient(135deg, #1a1200, #332500, #1a1200)",
          }}
        >
          <div className="text-7xl mb-2">&#127942;</div>
          <div className="text-xs text-[#ffd700] uppercase tracking-widest font-semibold">
            Game Over
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            We have a winner!
          </div>
        </div>

        <div className="p-6 space-y-4">
          {data && (
            <>
              <div>
                <div className="text-xs text-slate-500 mb-1">Winner</div>
                <div className="font-mono text-slate-200 text-sm break-all">
                  {data.winner}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Prize Pool</div>
                <div className="bpoly-amount text-2xl">{data.prizeSOL} SOL</div>
              </div>
            </>
          )}

          {/* Cash out section */}
          <div className="border-t border-slate-700 pt-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Cash Out BPOLY
            </div>
            <div className="text-left space-y-2">
              <input
                type="number"
                step="1"
                min="0"
                value={bpolyAmount}
                onChange={(e) => {
                  setBpolyAmount(e.target.value);
                  if (quote) resetSwap();
                }}
                placeholder="Amount in BPOLY"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#9945ff]"
              />

              {!quote && status !== "quoting" && status !== "success" && (
                <button
                  onClick={handleGetQuote}
                  disabled={!bpolyAmount || parseFloat(bpolyAmount) <= 0}
                  className="btn-secondary w-full text-xs"
                >
                  Get SOL Quote
                </button>
              )}

              {status === "quoting" && (
                <div className="text-center text-xs text-slate-400 py-1">
                  Fetching quote...
                </div>
              )}

              {quote && status !== "success" && (
                <div className="bg-slate-800/50 rounded p-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">You send</span>
                    <span className="text-white">{formatBpoly(quote.inAmount)} BPOLY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">You receive</span>
                    <span className="text-emerald-400">{formatSol(quote.outAmount)} SOL</span>
                  </div>
                  {priceImpact > 1 && (
                    <div className="text-amber-400 text-xs">
                      Impact: {priceImpact.toFixed(2)}%
                    </div>
                  )}
                  <button
                    onClick={executeSwap}
                    disabled={status === "signing" || status === "confirming"}
                    className="btn-success w-full text-xs mt-1"
                  >
                    {status === "signing"
                      ? "Signing..."
                      : status === "confirming"
                        ? "Confirming..."
                        : "Swap BPOLY to SOL"}
                  </button>
                </div>
              )}

              {status === "success" && signature && (
                <div className="bg-emerald-900/30 border border-emerald-800 rounded p-2 text-xs text-center space-y-1">
                  <div className="text-emerald-400">Cash out successful!</div>
                  <a
                    href={`https://solscan.io/tx/${signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9945ff] hover:underline break-all"
                  >
                    View on Solscan
                  </a>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-xs bg-red-900/20 rounded p-2">{error}</div>
              )}
            </div>
          </div>

          <button onClick={handleExit} className="btn-primary w-full mt-4">
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
