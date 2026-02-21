import { GameClient } from "@/components/game/GameClient";

interface GamePageProps {
  params: { gameId: string };
}

export default function GamePage({ params }: GamePageProps) {
  return <GameClient gameId={params.gameId} />;
}
