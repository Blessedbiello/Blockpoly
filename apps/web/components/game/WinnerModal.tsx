"use client";

import { useGameStore } from "@/stores/gameStore";
import { useRouter } from "next/navigation";

export function WinnerModal() {
  const { activeModal, modalData, closeModal, reset } = useGameStore();
  const router = useRouter();

  if (activeModal !== "winner") return null;

  const data = modalData as { winner: string; prizeSOL: number } | null;

  const handleExit = () => {
    closeModal();
    reset();
    router.push("/lobby");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="card w-96 overflow-hidden shadow-2xl text-center">
        {/* Trophy animation */}
        <div
          className="p-8"
          style={{
            background:
              "linear-gradient(135deg, #1a1200, #332500, #1a1200)",
          }}
        >
          <div className="text-7xl mb-2">🏆</div>
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

          <button onClick={handleExit} className="btn-primary w-full mt-4">
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
