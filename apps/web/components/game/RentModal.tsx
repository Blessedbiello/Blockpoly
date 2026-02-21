"use client";

import { useGameStore } from "@/stores/gameStore";
import { BOARD } from "@/lib/board-data";
import { GROUP_COLORS, GROUP_NAMES } from "@/lib/constants";

interface RentModalProps {
  onPayRent: (spaceIndex: number) => void;
}

export function RentModal({ onPayRent }: RentModalProps) {
  const { activeModal, modalData, gameState, myWallet, playerStates, properties, closeModal } =
    useGameStore();

  if (activeModal !== "rent") return null;

  const spaceIndex = modalData as number;
  const space = BOARD[spaceIndex];
  const prop = properties.get(spaceIndex);
  const myState = myWallet ? playerStates.get(myWallet) : undefined;

  if (!space || !prop) return null;

  const ownerWallet = prop.owner.toString();
  const ownerState = playerStates.get(ownerWallet);
  const groupColor = GROUP_COLORS[space.group] ?? "#1a1a3e";
  const groupName = GROUP_NAMES[space.group] ?? "";

  // Calculate approximate rent to display.
  const lps = prop.liquidityPools;
  const rents = [space.baseRent, ...(space.lpRents ?? []), space.protocolRent].filter(Boolean);
  const displayRent = prop.isFullProtocol
    ? space.protocolRent
    : lps > 0
    ? (space.lpRents?.[lps - 1] ?? space.baseRent)
    : space.baseRent;

  const canPay = myState && myState.bpolyBalance >= BigInt((displayRent ?? 0) * 1_000_000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="card w-80 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 text-center" style={{ background: groupColor + "cc" }}>
          <div className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            Rent Due — {groupName}
          </div>
          <div className="text-2xl font-bold text-white mt-1">{space.name}</div>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          <div className="bg-[#0d0d22] rounded-lg p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Owner</span>
              <span className="font-mono text-slate-300 text-xs">
                {ownerState
                  ? `${ownerWallet.slice(0, 6)}…${ownerWallet.slice(-4)}`
                  : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Development</span>
              <span className="text-slate-300">
                {prop.isFullProtocol
                  ? "🏛 Full Protocol"
                  : lps > 0
                  ? `${"🏊".repeat(lps)} ${lps} LP`
                  : "Unimproved"}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#1a1a3e] pt-1.5">
              <span className="text-slate-400 font-semibold">Rent Owed</span>
              <span className="bpoly-amount text-base font-bold">
                {displayRent} BPOLY
              </span>
            </div>
          </div>

          {gameState?.bullRunActive && (
            <div className="bg-[#ffd700]/10 border border-[#ffd700]/30 rounded-lg p-2 text-xs text-[#ffd700] text-center">
              🐂 Bull Run active — rent doubled!
            </div>
          )}

          {!canPay && myState && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-xs text-red-400 text-center">
              Insufficient BPOLY — you may go bankrupt!
            </div>
          )}

          <button
            onClick={() => {
              onPayRent(spaceIndex);
              closeModal();
            }}
            className={`w-full ${canPay ? "btn-danger" : "btn-secondary"}`}
          >
            {canPay ? `Pay ${displayRent} BPOLY` : "Pay (declare bankruptcy)"}
          </button>
        </div>
      </div>
    </div>
  );
}
