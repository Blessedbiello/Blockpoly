"use client";

import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreateGameForm() {
  const { wallet, connectors, connect } = useWalletConnection();
  const walletAddress = wallet?.account.address ?? null;
  const router = useRouter();
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [entryFee, setEntryFee] = useState(0.01);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!walletAddress) {
      toast.error("Connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // Generate game ID from timestamp + wallet address
      const gameIdBytes = new Uint8Array(32);
      const ts = Date.now().toString();
      const encoder = new TextEncoder();
      const tsBytes = encoder.encode(ts.slice(-8));
      gameIdBytes.set(tsBytes);
      // encode first 24 bytes of wallet address string
      const addrBytes = encoder.encode(walletAddress.slice(0, 24));
      gameIdBytes.set(addrBytes, 8);

      const gameIdStr = Buffer.from(gameIdBytes).toString("hex").slice(0, 16);

      // In full impl: call initialize_game instruction
      toast.success("Game created! Redirecting...");
      router.push(`/game/${gameIdStr}`);
    } catch (e) {
      toast.error("Failed to create game");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Create Game</h2>
        <p className="text-slate-500 text-sm mt-1">
          Host a new Blockpoly game on-chain
        </p>
      </div>

      {!walletAddress ? (
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm mb-3">
            Connect your wallet to create a game
          </p>
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => connect(c.id)}
              className="btn-primary"
            >
              Connect {c.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Max players */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Max Players
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                    maxPlayers === n
                      ? "bg-[#9945ff] text-white"
                      : "bg-[#1a1a3e] text-slate-400 hover:bg-[#22224e]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Entry fee */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Entry Fee (SOL)
            </label>
            <input
              type="number"
              min={0}
              step={0.001}
              value={entryFee}
              onChange={(e) => setEntryFee(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0d0d22] border border-[#1a1a3e] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-[#9945ff] transition-colors"
            />
            <p className="text-xs text-slate-600 mt-1">
              Collected into prize pool. Winner takes all.
            </p>
          </div>

          {/* Game summary */}
          <div className="bg-[#0d0d22] rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Players</span>
              <span className="text-slate-200">2 – {maxPlayers}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Starting BPOLY</span>
              <span className="text-slate-200">1,500</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Randomness</span>
              <span className="text-[#00ff88]">Switchboard VRF</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Properties</span>
              <span className="text-[#00ff88]">Metaplex Core NFTs</span>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating on-chain…" : "Create Game"}
          </button>
        </div>
      )}
    </div>
  );
}
