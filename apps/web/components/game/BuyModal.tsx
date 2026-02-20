"use client";

import { useGameStore } from "@/stores/gameStore";
import { BOARD } from "@/lib/board-data";
import { GROUP_COLORS, GROUP_NAMES } from "@/lib/constants";

interface BuyModalProps {
  onBuy: (spaceIndex: number) => void;
  onDecline: () => void;
}

export function BuyModal({ onBuy, onDecline }: BuyModalProps) {
  const { activeModal, modalData, closeModal } = useGameStore();

  if (activeModal !== "buy") return null;

  const spaceIndex = modalData as number;
  const space = BOARD[spaceIndex];
  if (!space) return null;

  const groupColor = GROUP_COLORS[space.group] ?? "#333";
  const groupName = GROUP_NAMES[space.group] ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="card w-80 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 text-center" style={{ background: groupColor }}>
          <div className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            {groupName}
          </div>
          <div className="text-2xl font-bold text-white mt-1">{space.name}</div>
          <div className="text-white/80 text-lg font-mono mt-1">
            {space.price} BPOLY
          </div>
        </div>

        {/* Rent info */}
        <div className="p-4 text-xs text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Base Rent</span>
            <span className="text-slate-200">{space.baseRent} BPOLY</span>
          </div>
          <div className="flex justify-between">
            <span>With Full Protocol</span>
            <span className="text-[#ffd700]">{space.protocolRent} BPOLY</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={() => {
              onBuy(spaceIndex);
              closeModal();
            }}
            className="btn-success flex-1"
          >
            Buy
          </button>
          <button
            onClick={() => {
              onDecline();
              closeModal();
            }}
            className="btn-secondary flex-1"
          >
            Auction
          </button>
        </div>
      </div>
    </div>
  );
}
