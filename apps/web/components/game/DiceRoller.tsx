"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";

const DIE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

interface DiceRollerProps {
  onRoll: () => void;
  disabled?: boolean;
}

export function DiceRoller({ onRoll, disabled }: DiceRollerProps) {
  const { gameState } = useGameStore();
  const [rolling, setRolling] = useState(false);

  const dice = gameState?.pendingDice;
  const isAwaiting = gameState?.turnPhase === 1; // AwaitingVRF

  const handleRoll = async () => {
    setRolling(true);
    try {
      await onRoll();
    } finally {
      setTimeout(() => setRolling(false), 800);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dice display */}
      <div className="flex gap-3">
        {dice ? (
          <>
            <DieDisplay value={dice[0]} rolling={rolling} />
            <DieDisplay value={dice[1]} rolling={rolling} />
          </>
        ) : (
          <>
            <DieDisplay value={null} rolling={rolling} />
            <DieDisplay value={null} rolling={rolling} />
          </>
        )}
      </div>

      {dice && (
        <div className="text-sm text-slate-400">
          Total:{" "}
          <span className="font-bold text-white">{dice[0] + dice[1]}</span>
          {dice[0] === dice[1] && (
            <span className="ml-2 text-[#00ff88] font-semibold text-xs">
              DOUBLES!
            </span>
          )}
        </div>
      )}

      <button
        onClick={handleRoll}
        disabled={disabled || rolling || isAwaiting}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAwaiting
          ? "Waiting for VRF..."
          : rolling
          ? "Rolling..."
          : "Roll Dice"}
      </button>
    </div>
  );
}

function DieDisplay({
  value,
  rolling,
}: {
  value: number | null;
  rolling: boolean;
}) {
  return (
    <div
      className={`w-14 h-14 bg-[#0d0d22] border-2 border-[#9945ff] rounded-xl flex items-center justify-center text-3xl shadow-lg transition-all ${
        rolling ? "animate-bounce" : ""
      }`}
      style={{
        boxShadow: value
          ? "0 0 12px rgba(153,69,255,0.4)"
          : "0 2px 8px rgba(0,0,0,0.5)",
      }}
    >
      {rolling ? (
        <span className="animate-spin">{DIE_FACES[Math.floor(Math.random() * 6)]}</span>
      ) : value !== null ? (
        DIE_FACES[value - 1]
      ) : (
        <span className="text-slate-700 text-2xl">?</span>
      )}
    </div>
  );
}
