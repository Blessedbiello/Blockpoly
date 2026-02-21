"use client";

import { useEffect } from "react";
import { useGame } from "@/hooks/useGame";
import { useGameActions } from "@/hooks/useGameActions";
import { useGameStore } from "@/stores/gameStore";
import { useWalletConnection } from "@solana/react-hooks";

// Board + panel
import { BoardCanvas } from "@/components/board/BoardCanvas";
import { GamePanel } from "@/components/game/GamePanel";
import { PlayerList } from "@/components/game/PlayerList";
import { EventLog } from "@/components/game/EventLog";
import { DiceRoller } from "@/components/game/DiceRoller";

import { SessionKeyPanel } from "@/components/game/SessionKeyPanel";

// Modals
import { BuyModal } from "@/components/game/BuyModal";
import { AuctionModal } from "@/components/game/AuctionModal";
import { BuildModal } from "@/components/game/BuildModal";
import { RentModal } from "@/components/game/RentModal";
import { RugPullModal } from "@/components/game/RugPullModal";
import { MortgageModal } from "@/components/game/MortgageModal";
import { TradeModal } from "@/components/game/TradeModal";
import { CardDrawModal } from "@/components/game/CardDrawModal";
import { WinnerModal } from "@/components/game/WinnerModal";

interface GameClientProps {
  gameId: string;
}

export function GameClient({ gameId }: GameClientProps) {
  const { wallet } = useWalletConnection();
  const walletAddress = wallet?.account.address ?? null;

  const store = useGameStore();
  const actions = useGameActions(gameId);

  // Sync wallet address into store so modals can reference it.
  useEffect(() => {
    if (walletAddress) store.setMyWallet(walletAddress);
  }, [walletAddress]);

  // Determine player wallets from game state.
  const playerWallets = store.gameState?.players.map((p) => p.toString()) ?? [];

  // Activate live subscriptions + initial fetch.
  useGame(gameId, playerWallets);

  const gameStatus = store.gameState?.status ?? 0;
  const isWaiting = gameStatus === 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-4 p-4">
      {/* Left sidebar */}
      <aside className="lg:w-64 flex flex-col gap-4">
        <PlayerList gameId={gameId} />
        <EventLog gameId={gameId} />
      </aside>

      {/* Center: board */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4">
        <BoardCanvas gameId={gameId} />

        {/* Dice roller shown during active game when it's your turn */}
        {gameStatus === 1 && store.gameState?.turnPhase === 0 && (
          <div className="w-full max-w-xs">
            <DiceRoller
              onRoll={actions.requestDiceRoll}
              disabled={
                !walletAddress ||
                store.gameState?.players[store.gameState.currentPlayerIndex]?.toString() !== walletAddress
              }
            />
          </div>
        )}

        {/* Start game button (host only, waiting phase) */}
        {isWaiting &&
          walletAddress &&
          store.gameState?.host.toString() === walletAddress &&
          (store.gameState?.playerCount ?? 0) >= 2 && (
            <button
              onClick={actions.startGame}
              className="btn-primary px-8 py-3 text-lg"
            >
              Start Game
            </button>
          )}

        {/* Join game button (waiting phase, not already a player) */}
        {isWaiting &&
          walletAddress &&
          !playerWallets.includes(walletAddress) && (
            <button
              onClick={actions.joinGame}
              className="btn-success px-8 py-3 text-lg"
            >
              Join Game
            </button>
          )}
      </main>

      {/* Right sidebar: actions panel */}
      <aside className="lg:w-72 flex flex-col gap-4">
        <GamePanel gameId={gameId} />
        <SessionKeyPanel gameId={gameId} />

        {/* Build / Mortgage buttons always accessible during game */}
        {gameStatus === 1 && walletAddress && (
          <div className="card p-4 space-y-2">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Manage Properties</div>
            <button
              onClick={() => store.openModal("build")}
              className="btn-secondary w-full text-sm"
            >
              🏗 Build / Improve
            </button>
            <button
              onClick={() => store.openModal("mortgage")}
              className="btn-secondary w-full text-sm"
            >
              📋 Mortgage
            </button>
            <button
              onClick={() => store.openModal("trade")}
              className="btn-secondary w-full text-sm"
            >
              🤝 Trade
            </button>
          </div>
        )}

        {/* Claim prize if winner */}
        {gameStatus === 2 &&
          walletAddress &&
          store.gameState?.winner?.toString() === walletAddress && (
            <button
              onClick={actions.claimPrize}
              className="btn-primary w-full text-lg py-3"
            >
              🏆 Claim Prize!
            </button>
          )}
      </aside>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <BuyModal
        onBuy={(spaceIndex) => actions.buyProperty(spaceIndex)}
        onDecline={actions.declineBuy}
      />
      <AuctionModal
        onBid={(spaceIndex, amount) => actions.auctionBid(spaceIndex, amount)}
      />
      <BuildModal
        onBuildLP={(spaceIndex, siblingCounts) => actions.buildLP(spaceIndex, siblingCounts)}
        onBuildProtocol={(spaceIndex) => actions.buildProtocol(spaceIndex)}
        onSellLP={(spaceIndex) => actions.sellLP(spaceIndex)}
      />
      <RentModal
        onPayRent={(spaceIndex) => actions.payRent(spaceIndex)}
      />
      <RugPullModal
        onPayBail={actions.rugpullPayBail}
        onUseJailFreeCard={actions.rugpullUseJailFreeCard}
        onAttemptDoubles={actions.rugpullAttemptDoubles}
      />
      <MortgageModal
        onMortgage={(spaceIndex) => actions.mortgageProperty(spaceIndex)}
        onUnmortgage={(spaceIndex) => actions.unmortgageProperty(spaceIndex)}
      />
      <TradeModal
        onPropose={(params) => actions.proposeTrade(params)}
      />
      <CardDrawModal />
      <WinnerModal />
    </div>
  );
}
