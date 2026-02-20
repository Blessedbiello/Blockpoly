"use client";

import { useGameStore } from "@/stores/gameStore";
import { BOARD } from "@/lib/board-data";

const PLAYER_COLORS = [
  "#ff4444", "#44aaff", "#44ff88", "#ffd700",
  "#ff44aa", "#44ffff", "#ff8844", "#aa44ff",
];

interface PlayerListProps {
  gameId: string;
}

export function PlayerList({ gameId }: PlayerListProps) {
  const { gameState, playerStates } = useGameStore();

  const players = Array.from(playerStates.values()).sort(
    (a, b) => a.playerIndex - b.playerIndex
  );

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Players
      </h3>
      <div className="space-y-2">
        {players.length === 0 ? (
          <p className="text-slate-600 text-xs">No players yet</p>
        ) : (
          players.map((p) => {
            const isCurrentTurn = gameState?.currentPlayerIndex === p.playerIndex;
            const color = PLAYER_COLORS[p.playerIndex % PLAYER_COLORS.length];
            const spaceName = BOARD[p.position]?.name ?? "?";

            return (
              <div
                key={p.wallet.toString()}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isCurrentTurn
                    ? "bg-[#9945ff]/10 border border-[#9945ff]/30"
                    : "bg-[#0d0d22]"
                }`}
              >
                {/* Token */}
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: color }}
                >
                  {p.wallet.toString().slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-slate-300 truncate">
                      {p.wallet.toString().slice(0, 6)}…
                    </span>
                    {isCurrentTurn && (
                      <span className="text-[9px] text-[#9945ff] font-semibold">
                        ▶
                      </span>
                    )}
                    {p.isBankrupt && (
                      <span className="text-[9px] text-red-500">BUST</span>
                    )}
                    {p.rugpullTurnsRemaining > 0 && (
                      <span className="text-[9px] text-orange-400">🔒</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {spaceName}
                  </div>
                </div>

                {/* Balance */}
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-mono text-[#ffd700] font-semibold">
                    {Math.floor(Number(p.bpolyBalance) / 1_000_000)}
                  </div>
                  <div className="text-[8px] text-slate-600">BPOLY</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
