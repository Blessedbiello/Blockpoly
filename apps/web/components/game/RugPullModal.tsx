"use client";

import { useGameStore } from "@/stores/gameStore";
import { RUGPULL_BAIL } from "@/lib/constants";

interface RugPullModalProps {
  onPayBail: () => void;
  onUseJailFreeCard: () => void;
  onAttemptDoubles: () => void;
}

export function RugPullModal({
  onPayBail,
  onUseJailFreeCard,
  onAttemptDoubles,
}: RugPullModalProps) {
  const { activeModal, myWallet, playerStates, closeModal } = useGameStore();

  if (activeModal !== "rugpull") return null;

  const myState = myWallet ? playerStates.get(myWallet) : undefined;
  const turnsLeft = myState?.rugpullTurnsRemaining ?? 0;
  const hasJailFreeCard = myState?.hasJailFreeCard ?? false;
  const canPayBail = myState && myState.bpolyBalance >= BigInt(RUGPULL_BAIL);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="card w-80 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">🚨</div>
          <div className="text-xl font-bold text-red-400">Rug Pull Zone</div>
          <div className="text-sm text-slate-400 mt-1">
            {turnsLeft > 0
              ? `${turnsLeft} turn${turnsLeft !== 1 ? "s" : ""} remaining in the zone`
              : "Choose your escape"}
          </div>
        </div>

        {/* Status */}
        <div className="bg-[#0d0d22] rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Bail Cost</span>
            <span className="bpoly-amount">
              {RUGPULL_BAIL / 1_000_000} BPOLY
            </span>
          </div>
          {myState && (
            <div className="flex justify-between">
              <span className="text-slate-500">Your Balance</span>
              <span className={canPayBail ? "text-slate-200" : "text-red-400"}>
                {(Number(myState.bpolyBalance) / 1_000_000).toFixed(0)} BPOLY
              </span>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          {hasJailFreeCard && (
            <button
              onClick={() => {
                onUseJailFreeCard();
                closeModal();
              }}
              className="btn-success w-full"
            >
              🃏 Use Get-Out-of-Rug-Pull Card
              <div className="text-xs opacity-70 mt-0.5">Free escape — no cost</div>
            </button>
          )}

          <button
            onClick={() => {
              onPayBail();
              closeModal();
            }}
            disabled={!canPayBail}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            💸 Pay {RUGPULL_BAIL / 1_000_000} BPOLY Bail
            <div className="text-xs opacity-70 mt-0.5">Immediate release</div>
          </button>

          <button
            onClick={() => {
              onAttemptDoubles();
              closeModal();
            }}
            className="btn-secondary w-full"
          >
            🎲 Roll for Doubles
            <div className="text-xs opacity-70 mt-0.5">3 attempts — doubles = free</div>
          </button>
        </div>
      </div>
    </div>
  );
}
