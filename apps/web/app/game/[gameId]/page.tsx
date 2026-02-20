import { BoardCanvas } from "@/components/board/BoardCanvas";
import { GamePanel } from "@/components/game/GamePanel";
import { EventLog } from "@/components/game/EventLog";
import { PlayerList } from "@/components/game/PlayerList";

interface GamePageProps {
  params: { gameId: string };
}

export default function GamePage({ params }: GamePageProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-4 p-4">
      {/* Left sidebar: player list + event log */}
      <aside className="lg:w-64 flex flex-col gap-4">
        <PlayerList gameId={params.gameId} />
        <EventLog gameId={params.gameId} />
      </aside>

      {/* Center: board */}
      <main className="flex-1 flex items-center justify-center">
        <BoardCanvas gameId={params.gameId} />
      </main>

      {/* Right sidebar: game actions */}
      <aside className="lg:w-72">
        <GamePanel gameId={params.gameId} />
      </aside>
    </div>
  );
}
