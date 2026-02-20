"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface GameEntry {
  id: string;
  host: string;
  playerCount: number;
  maxPlayers: number;
  status: "waiting" | "in_progress" | "finished";
  entryFee: number;
}

// In production: fetched from on-chain via getProgramAccounts
const MOCK_GAMES: GameEntry[] = [
  {
    id: "genesis01block01",
    host: "9RmpD...KxQm",
    playerCount: 2,
    maxPlayers: 4,
    status: "waiting",
    entryFee: 0.01,
  },
  {
    id: "solana2rug3pull4",
    host: "FxP3v...Lw9a",
    playerCount: 4,
    maxPlayers: 4,
    status: "in_progress",
    entryFee: 0.05,
  },
];

export function GameList() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");

  const handleJoin = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  const handleManualJoin = () => {
    if (!joinId.trim()) {
      toast.error("Enter a game ID");
      return;
    }
    router.push(`/game/${joinId.trim()}`);
  };

  return (
    <div className="card p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Join Game</h2>
        <p className="text-slate-500 text-sm mt-1">
          Join an open game or enter a game ID
        </p>
      </div>

      {/* Manual game ID entry */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter game ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className="flex-1 bg-[#0d0d22] border border-[#1a1a3e] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-[#9945ff] transition-colors"
          onKeyDown={(e) => e.key === "Enter" && handleManualJoin()}
        />
        <button onClick={handleManualJoin} className="btn-primary px-4">
          Join
        </button>
      </div>

      {/* Open games list */}
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Open Games
        </div>
        <div className="space-y-2">
          {MOCK_GAMES.map((game) => (
            <div
              key={game.id}
              className="flex items-center gap-3 p-3 bg-[#0d0d22] rounded-lg border border-[#1a1a3e] hover:border-[#9945ff]/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-slate-300 truncate">
                  {game.id}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Host: {game.host} · {game.entryFee} SOL entry
                </div>
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0">
                {game.playerCount}/{game.maxPlayers}
              </div>
              <StatusBadge status={game.status} />
              {game.status === "waiting" && (
                <button
                  onClick={() => handleJoin(game.id)}
                  className="btn-secondary text-xs px-3 py-1 flex-shrink-0"
                >
                  Join
                </button>
              )}
              {game.status === "in_progress" && (
                <button
                  onClick={() => handleJoin(game.id)}
                  className="btn-secondary text-xs px-3 py-1 flex-shrink-0"
                >
                  Watch
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GameEntry["status"] }) {
  const styles: Record<GameEntry["status"], string> = {
    waiting: "bg-[#00aa55]/20 text-[#00ff88] border-[#00aa55]/30",
    in_progress: "bg-[#9945ff]/20 text-[#9945ff] border-[#9945ff]/30",
    finished: "bg-slate-700/20 text-slate-500 border-slate-700/30",
  };
  const labels: Record<GameEntry["status"], string> = {
    waiting: "Open",
    in_progress: "Live",
    finished: "Done",
  };

  return (
    <span
      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
