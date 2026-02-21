"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWalletConnection, useSolanaClient } from "@solana/react-hooks";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { toast } from "sonner";
import { loadIdl, getProgram } from "@/lib/anchor-client";
import { PROGRAM_ID } from "@/lib/constants";
import { gameIdToString } from "@/lib/pdas";
import { useGameActions } from "@/hooks/useGameActions";

// Discriminator bytes for GameState account (from IDL).
const GAME_STATE_DISCRIMINATOR = Buffer.from([144, 94, 208, 172, 248, 99, 134, 120]);

interface GameEntry {
  id: string;
  host: string;
  playerCount: number;
  maxPlayers: number;
  status: 0 | 1 | 2;
  entryFee: number;
}

const STATUS_LABELS: Record<number, string> = { 0: "Open", 1: "Live", 2: "Done" };
const STATUS_STYLES: Record<number, string> = {
  0: "bg-[#00aa55]/20 text-[#00ff88] border-[#00aa55]/30",
  1: "bg-[#9945ff]/20 text-[#9945ff] border-[#9945ff]/30",
  2: "bg-slate-700/20 text-slate-500 border-slate-700/30",
};

export function GameList() {
  const router = useRouter();
  const client = useSolanaClient();
  const { wallet, connectors, connect } = useWalletConnection();
  const walletAddress = wallet?.account.address ?? null;

  const [games, setGames] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // For join we need per-game actions — use the selected game ID.
  const joinActions = useGameActions(joiningId ?? "00000000");

  const getConnection = useCallback((): Connection => {
    const endpoint =
      (client.config.endpoint as string | undefined) ?? "https://api.devnet.solana.com";
    return new Connection(endpoint, { commitment: "confirmed" });
  }, [client]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const connection = getConnection();
      const accounts = await connection.getProgramAccounts(new PublicKey(PROGRAM_ID), {
        filters: [
          { memcmp: { offset: 0, bytes: GAME_STATE_DISCRIMINATOR.toString("base64"), encoding: "base64" } },
          // status byte at offset 8+32 = 40 (after discriminator + game_id):
          // status 0 = WaitingForPlayers (show open games).
          // We show all statuses so players can spectate too.
        ],
        dataSlice: { offset: 0, length: 200 }, // enough for header fields
      });

      const idl = await loadIdl();
      if (!idl) return;

      const fakeWallet = {
        publicKey: PublicKey.default,
        signTransaction: async (tx: unknown) => tx,
        signAllTransactions: async (txs: unknown[]) => txs,
      };
      const provider = new AnchorProvider(connection, fakeWallet as never, {});
      const program = getProgram(provider, idl);

      const entries: GameEntry[] = [];
      for (const { account } of accounts) {
        try {
          const decoded = program.coder.accounts.decode("GameState", account.data as Buffer);
          const statusKey = Object.keys(decoded.status as Record<string, unknown>)[0];
          const status = statusKey === "inProgress" ? 1 : statusKey === "finished" ? 2 : 0;
          const gameIdStr = gameIdToString(decoded.gameId as number[]);
          const prizePool = Number(decoded.prizePoolLamports ?? 0);
          entries.push({
            id: gameIdStr,
            host: (decoded.host as PublicKey).toString(),
            playerCount: decoded.playerCount as number,
            maxPlayers: decoded.maxPlayers as number,
            status: status as 0 | 1 | 2,
            entryFee: prizePool / 1e9,
          });
        } catch {
          // Skip malformed accounts
        }
      }

      // Sort: waiting first, then in_progress, then finished.
      entries.sort((a, b) => a.status - b.status);
      setGames(entries);
    } catch (e) {
      console.error("fetchGames:", e);
    } finally {
      setLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchGames();
  }, []);

  const handleJoin = async (gameId: string) => {
    if (!walletAddress) {
      toast.error("Connect your wallet first");
      return;
    }
    setJoiningId(gameId);
    router.push(`/game/${gameId}`);
  };

  const handleManualJoin = () => {
    if (!joinId.trim()) { toast.error("Enter a game ID"); return; }
    router.push(`/game/${joinId.trim()}`);
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Join Game</h2>
          <p className="text-slate-500 text-sm mt-1">Join an open game or enter a game ID</p>
        </div>
        <button
          onClick={fetchGames}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
          title="Refresh"
        >
          {loading ? "…" : "⟳ Refresh"}
        </button>
      </div>

      {/* Manual game ID entry */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter game ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualJoin()}
          className="flex-1 bg-[#0d0d22] border border-[#1a1a3e] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-[#9945ff] transition-colors"
        />
        <button onClick={handleManualJoin} className="btn-primary px-4">
          Go
        </button>
      </div>

      {/* On-chain games list */}
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          {loading ? "Loading games…" : `On-chain Games (${games.length})`}
        </div>

        {!loading && games.length === 0 && (
          <div className="text-center py-6 text-slate-600 text-sm">
            No games found on-chain. Create one!
          </div>
        )}

        <div className="space-y-2">
          {games.map((game) => (
            <div
              key={game.id}
              className="flex items-center gap-3 p-3 bg-[#0d0d22] rounded-lg border border-[#1a1a3e] hover:border-[#9945ff]/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-slate-300 truncate">{game.id}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Host: {game.host.slice(0, 6)}… · {game.playerCount}/{game.maxPlayers} players
                </div>
              </div>

              <span
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[game.status]}`}
              >
                {STATUS_LABELS[game.status]}
              </span>

              <button
                onClick={() => handleJoin(game.id)}
                className="btn-secondary text-xs px-3 py-1 flex-shrink-0"
              >
                {game.status === 0 ? "Join" : "Watch"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet connect prompt */}
      {!walletAddress && (
        <div className="border-t border-[#1a1a3e] pt-4">
          <p className="text-xs text-slate-500 text-center mb-2">Connect to join a game</p>
          <div className="flex flex-col gap-2">
            {connectors.map((c) => (
              <button key={c.id} onClick={() => connect(c.id)} className="btn-secondary text-sm">
                Connect {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
