"use client";

import { useGameStore, GameEvent } from "@/stores/gameStore";

interface EventLogProps {
  gameId: string;
}

const EVENT_ICONS: Record<string, string> = {
  dice_request: "🎲",
  dice_roll: "🎲",
  buy: "🏠",
  rent: "💰",
  card: "🃏",
  auction: "🔨",
  rugpull: "🔒",
  trade: "🤝",
  build: "🏗",
  state_change: "⚡",
  player_update: "👤",
  property_update: "📋",
  bankruptcy: "💥",
  win: "🏆",
  tax: "💸",
};

export function EventLog({ gameId }: EventLogProps) {
  const { eventLog } = useGameStore();

  return (
    <div className="card p-4 flex-1 min-h-0">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Game Feed
      </h3>
      <div className="space-y-1 overflow-y-auto max-h-64">
        {eventLog.length === 0 ? (
          <p className="text-slate-600 text-xs">Game events will appear here</p>
        ) : (
          eventLog.map((event) => (
            <EventItem key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}

function EventItem({ event }: { event: GameEvent }) {
  const icon = EVENT_ICONS[event.type] ?? "•";
  const time = new Date(event.timestamp).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex gap-2 text-xs py-0.5 group">
      <span className="flex-shrink-0 w-4 text-center leading-4">{icon}</span>
      <span className="text-slate-300 flex-1 leading-4">{event.message}</span>
      <span className="text-slate-600 flex-shrink-0 font-mono text-[9px] leading-4">
        {time}
      </span>
    </div>
  );
}
