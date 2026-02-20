"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { BOARD } from "@/lib/board-data";

interface AuctionModalProps {
  onBid: (spaceIndex: number, amount: bigint) => void;
}

export function AuctionModal({ onBid }: AuctionModalProps) {
  const { activeModal, gameState, closeModal } = useGameStore();
  const [bidAmount, setBidAmount] = useState("");

  if (activeModal !== "auction") return null;
  if (!gameState?.auctionSpace) return null;

  const spaceIndex = gameState.auctionSpace;
  const space = BOARD[spaceIndex];
  const currentBid = Number(gameState.auctionHighestBid) / 1_000_000;
  const minBid = currentBid + 1;

  const handleBid = () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid) return;
    onBid(spaceIndex, BigInt(Math.floor(amount * 1_000_000)));
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="card w-80 p-6 shadow-2xl space-y-4">
        <div className="text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Auction</div>
          <div className="text-xl font-bold text-white mt-1">{space.name}</div>
        </div>

        <div className="bg-[#0d0d22] rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Current Bid</span>
            <span className="bpoly-amount">{currentBid} BPOLY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Min Bid</span>
            <span className="text-slate-300">{minBid} BPOLY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Leader</span>
            <span className="font-mono text-slate-300 text-xs">
              {gameState.auctionHighestBidder
                ? gameState.auctionHighestBidder.toString().slice(0, 8) + "..."
                : "None"}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Your Bid (BPOLY)
          </label>
          <input
            type="number"
            min={minBid}
            step={1}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`Min: ${minBid}`}
            className="w-full bg-[#0d0d22] border border-[#1a1a3e] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-[#9945ff]"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={handleBid} className="btn-primary flex-1">
            Bid
          </button>
          <button onClick={closeModal} className="btn-secondary flex-1">
            Pass
          </button>
        </div>
      </div>
    </div>
  );
}
