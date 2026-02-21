"use client";

import { useWalletConnection } from "@solana/react-hooks";
import { useGameStore } from "@/stores/gameStore";
import { useGameActions } from "@/hooks/useGameActions";
import { BOARD } from "@/lib/board-data";

interface GamePanelProps {
  gameId: string;
}

const TURN_PHASE_LABELS: Record<number, string> = {
  0: "Roll Dice",
  1: "Awaiting VRF",
  2: "Landing Effect",
  3: "Draw Card",
  4: "Rug Pull Decision",
  5: "Auction Phase",
  6: "Buy Decision",
  7: "Finished",
};

export function GamePanel({ gameId }: GamePanelProps) {
  const { wallet } = useWalletConnection();
  const walletAddress = wallet?.account.address ?? null;
  const { gameState, playerStates } = useGameStore();
  const actions = useGameActions(gameId);

  const myState = walletAddress ? playerStates.get(walletAddress) : undefined;

  const isMyTurn =
    gameState &&
    walletAddress &&
    gameState.players[gameState.currentPlayerIndex]?.toString() === walletAddress;

  const currentPosition = myState?.position ?? 0;
  const currentSpace = BOARD[currentPosition];
  const phase = gameState?.turnPhase ?? 0;

  return (
    <div className="card p-4 space-y-4 h-fit">
      {/* Wallet address display */}
      <div className="text-xs text-slate-500 font-mono truncate">
        {walletAddress ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-4)}` : "Not connected"}
      </div>

      {/* Game info */}
      {gameState && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Round</span>
            <span className="text-slate-200 font-mono">{gameState.roundNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Turn</span>
            <span className="text-slate-200 font-mono">{gameState.turnNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Phase</span>
            <span className="text-[#9945ff] font-semibold text-xs">
              {TURN_PHASE_LABELS[phase] ?? "Unknown"}
            </span>
          </div>
        </div>
      )}

      {/* My status */}
      {myState && (
        <div className="border-t border-[#1a1a3e] pt-4 space-y-2 text-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Your Status</div>
          <div className="flex justify-between">
            <span className="text-slate-500">Position</span>
            <span className="text-slate-200">{currentSpace.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Balance</span>
            <span className="bpoly-amount">
              {Number(myState.bpolyBalance) / 1_000_000} BPOLY
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Properties</span>
            <span className="text-slate-200">{myState.propertiesOwned.length}</span>
          </div>
          {myState.hasJailFreeCard && (
            <div className="text-[#00ff88] text-xs">
              Holding: Get Out of Rug Pull Free
            </div>
          )}
          {myState.flashLoanActive && (
            <div className="text-red-400 text-xs animate-pulse">
              Flash loan active! Repay next turn
            </div>
          )}
          {myState.rugpullTurnsRemaining > 0 && (
            <div className="text-red-400 text-xs">
              In Rug Pull Zone ({myState.rugpullTurnsRemaining} turns left)
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isMyTurn && (
        <div className="border-t border-[#1a1a3e] pt-4 space-y-2">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Your Turn
          </div>

          {/* Roll dice */}
          {phase === 0 && (
            <button
              onClick={actions.requestDiceRoll}
              className="btn-primary w-full"
            >
              Roll Dice
            </button>
          )}

          {/* Buy decision */}
          {phase === 6 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Buy <span className="text-white">{currentSpace.name}</span> for{" "}
                <span className="bpoly-amount">{currentSpace.price} BPOLY</span>?
              </p>
              <button
                onClick={() => actions.buyProperty(currentPosition)}
                className="btn-success w-full"
              >
                Buy
              </button>
              <button
                onClick={actions.declineBuy}
                className="btn-secondary w-full"
              >
                Decline (Auction)
              </button>
            </div>
          )}

          {/* Rug Pull Zone */}
          {phase === 4 && myState && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                You are in the Rug Pull Zone.
              </p>
              <button
                onClick={actions.rugpullPayBail}
                className="btn-danger w-full"
              >
                Pay 50 BPOLY Bail
              </button>
              {myState.hasJailFreeCard && (
                <button
                  onClick={actions.rugpullUseJailFreeCard}
                  className="btn-success w-full"
                >
                  Use Jail-Free Card
                </button>
              )}
              <button
                onClick={actions.requestDiceRoll}
                className="btn-secondary w-full"
              >
                Roll for Doubles
              </button>
            </div>
          )}
        </div>
      )}

      {/* Waiting indicator */}
      {!isMyTurn && gameState?.status === 1 && (
        <div className="text-center text-slate-500 text-sm py-2 animate-pulse">
          Waiting for other players…
        </div>
      )}
    </div>
  );
}
