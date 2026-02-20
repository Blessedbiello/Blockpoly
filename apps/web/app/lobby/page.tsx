import { CreateGameForm } from "@/components/lobby/CreateGameForm";
import { GameList } from "@/components/lobby/GameList";
import Link from "next/link";

export default function LobbyPage() {
  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-space)]">
          <span className="text-white">Block</span>
          <span className="text-[#9945ff]">poly</span>{" "}
          <span className="text-slate-400 font-normal text-2xl">Lobby</span>
        </h1>
        <div />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <CreateGameForm />
        <GameList />
      </div>
    </div>
  );
}
