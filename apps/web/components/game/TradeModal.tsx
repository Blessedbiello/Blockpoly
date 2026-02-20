"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { BOARD } from "@/lib/board-data";

interface TradeModalProps {
  onPropose: (params: {
    recipient: string;
    offeredProperties: number[];
    offeredBpoly: bigint;
    requestedProperties: number[];
    requestedBpoly: bigint;
  }) => void;
}

export function TradeModal({ onPropose }: TradeModalProps) {
  const { activeModal, gameState, playerStates, myWallet, closeModal } =
    useGameStore();
  const [recipient, setRecipient] = useState("");
  const [offeredBpoly, setOfferedBpoly] = useState("0");
  const [requestedBpoly, setRequestedBpoly] = useState("0");
  const [offeredProps, setOfferedProps] = useState<number[]>([]);
  const [requestedProps, setRequestedProps] = useState<number[]>([]);

  if (activeModal !== "trade") return null;

  const myState = myWallet ? playerStates.get(myWallet) : undefined;
  const otherPlayers = Array.from(playerStates.values()).filter(
    (p) => p.wallet.toString() !== myWallet
  );

  const toggleMyProp = (space: number) => {
    setOfferedProps((prev) =>
      prev.includes(space) ? prev.filter((s) => s !== space) : [...prev, space]
    );
  };

  const handlePropose = () => {
    if (!recipient) return;
    onPropose({
      recipient,
      offeredProperties: offeredProps,
      offeredBpoly: BigInt(Math.floor(parseFloat(offeredBpoly) * 1_000_000)),
      requestedProperties: requestedProps,
      requestedBpoly: BigInt(Math.floor(parseFloat(requestedBpoly) * 1_000_000)),
    });
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={closeModal}
    >
      <div
        className="card w-96 p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-bold text-white">Propose Trade</div>

        {/* Recipient */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Trade With
          </label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full bg-[#0d0d22] border border-[#1a1a3e] rounded-lg px-3 py-2 text-slate-200 text-sm"
          >
            <option value="">Select player…</option>
            {otherPlayers.map((p) => (
              <option key={p.wallet.toString()} value={p.wallet.toString()}>
                {p.wallet.toString().slice(0, 8)}…
              </option>
            ))}
          </select>
        </div>

        {/* Your offer */}
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            You Offer
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {myState?.propertiesOwned.map((space) => (
              <button
                key={space}
                onClick={() => toggleMyProp(space)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  offeredProps.includes(space)
                    ? "bg-[#9945ff]/20 border-[#9945ff] text-[#9945ff]"
                    : "bg-[#0d0d22] border-[#1a1a3e] text-slate-400"
                }`}
              >
                {BOARD[space]?.name ?? `Space ${space}`}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={0}
            value={offeredBpoly}
            onChange={(e) => setOfferedBpoly(e.target.value)}
            placeholder="BPOLY to offer"
            className="w-full bg-[#0d0d22] border border-[#1a1a3e] rounded-lg px-3 py-2 text-slate-200 text-sm"
          />
        </div>

        {/* What you want */}
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            You Request
          </div>
          <input
            type="number"
            min={0}
            value={requestedBpoly}
            onChange={(e) => setRequestedBpoly(e.target.value)}
            placeholder="BPOLY to request"
            className="w-full bg-[#0d0d22] border border-[#1a1a3e] rounded-lg px-3 py-2 text-slate-200 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handlePropose} className="btn-primary flex-1">
            Send Offer
          </button>
          <button onClick={closeModal} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
