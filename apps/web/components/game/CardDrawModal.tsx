"use client";

import { useGameStore } from "@/stores/gameStore";
import { ALPHA_CALL_CARDS, GOVERNANCE_VOTE_CARDS } from "@/lib/card-data";

export function CardDrawModal() {
  const { activeModal, modalData, closeModal } = useGameStore();

  if (activeModal !== "card") return null;

  const data = modalData as { deckType: 0 | 1; cardId: number } | null;
  if (!data) return null;

  const cards = data.deckType === 0 ? ALPHA_CALL_CARDS : GOVERNANCE_VOTE_CARDS;
  const card = cards[data.cardId];
  const isAlpha = data.deckType === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={closeModal}
    >
      <div
        className="w-80 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: `2px solid ${isAlpha ? "#9945ff" : "#00aa55"}`,
          background: "#0d0d22",
        }}
      >
        {/* Header */}
        <div
          className="p-5 text-center"
          style={{
            background: isAlpha
              ? "linear-gradient(135deg, #1a0033, #2d0066)"
              : "linear-gradient(135deg, #001a0d, #003322)",
          }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: isAlpha ? "#9945ff" : "#00ff88" }}
          >
            {isAlpha ? "📡 Alpha Call" : "🗳 Governance Vote"}
          </div>
          <div className="text-2xl font-bold text-white mt-2">{card?.name}</div>
        </div>

        {/* Description */}
        <div className="p-5 text-center">
          <p className="text-slate-300 text-sm leading-relaxed">
            {card?.description}
          </p>
        </div>

        <button
          onClick={closeModal}
          className="w-full py-3 font-semibold text-sm transition-colors"
          style={{
            background: isAlpha ? "#9945ff" : "#00aa55",
            color: "white",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
