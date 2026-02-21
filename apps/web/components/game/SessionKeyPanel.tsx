"use client";

import { useSessionKey } from "@/hooks/useSessionKey";

interface SessionKeyPanelProps {
  gameId: string;
}

export function SessionKeyPanel({ gameId }: SessionKeyPanelProps) {
  const { sessionPublicKey, clearSessionKey } = useSessionKey(gameId);

  const shortKey = sessionPublicKey
    ? `${sessionPublicKey.toBase58().slice(0, 6)}…${sessionPublicKey.toBase58().slice(-4)}`
    : null;

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 uppercase tracking-wider">Session Key</div>
        {sessionPublicKey && (
          <button
            onClick={clearSessionKey}
            className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
            title="Revoke session key"
          >
            Revoke
          </button>
        )}
      </div>

      {sessionPublicKey ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] flex-shrink-0 animate-pulse" />
            <span className="text-xs text-[#00ff88] font-medium">Active</span>
          </div>
          <div className="font-mono text-[10px] text-slate-500 truncate">{shortKey}</div>
          <p className="text-[10px] text-slate-600 leading-tight">
            Dice rolls auto-sign without wallet popup. Financial actions still require approval.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
          <span className="text-xs text-slate-500">Not active</span>
        </div>
      )}
    </div>
  );
}
