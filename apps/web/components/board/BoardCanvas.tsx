"use client";

import { BoardSpace } from "./BoardSpace";
import { PlayerToken } from "./PlayerToken";
import { useGameStore } from "@/stores/gameStore";
import { BOARD } from "@/lib/board-data";

// 11×11 grid layout.
// Each cell is either a space index or null (center area).
// Bottom row L→R: 0–10
// Left col bottom→top: 11–19 (reversed: 19 at top)
// Top row R→L: 20–30
// Right col top→bottom: 31–39

const GRID: (number | null)[][] = (() => {
  const grid: (number | null)[][] = Array.from({ length: 11 }, () =>
    Array(11).fill(null)
  );

  // Bottom row (row 10): spaces 0–10, left to right
  for (let col = 0; col <= 10; col++) {
    grid[10][col] = col;
  }

  // Left column (col 0): spaces 11–19, bottom to top (row 9 → row 1)
  for (let i = 0; i < 9; i++) {
    grid[9 - i][0] = 11 + i;
  }

  // Top row (row 0): spaces 20–30, right to left
  for (let col = 0; col <= 10; col++) {
    grid[0][10 - col] = 20 + col;
  }

  // Right column (col 10): spaces 31–39, top to bottom (row 1 → row 9)
  for (let i = 0; i < 9; i++) {
    grid[1 + i][10] = 31 + i;
  }

  return grid;
})();

interface BoardCanvasProps {
  gameId: string;
}

const PLAYER_COLORS = [
  "#ff4444", "#44aaff", "#44ff88", "#ffd700",
  "#ff44aa", "#44ffff", "#ff8844", "#aa44ff",
];

export function BoardCanvas({ gameId }: BoardCanvasProps) {
  const { gameState, playerStates, properties, highlightedSpace } = useGameStore();

  const players = Array.from(playerStates.values());

  return (
    <div className="relative">
      {/* Board grid */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(11, minmax(56px, 1fr))",
          gridTemplateRows: "repeat(11, minmax(56px, 1fr))",
          border: "2px solid #1a1a3e",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#0a0a1e",
          width: "min(90vw, 660px)",
          height: "min(90vw, 660px)",
        }}
      >
        {GRID.map((row, rowIdx) =>
          row.map((spaceIndex, colIdx) => {
            if (spaceIndex === null) {
              // Center area
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="bg-[#0a0a1e]"
                  style={{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }}
                />
              );
            }

            const space = BOARD[spaceIndex];
            const property = properties.get(spaceIndex);
            const isHighlighted = highlightedSpace === spaceIndex;

            // Determine which players are on this space
            const playersOnSpace = players.filter(
              (p) => p.position === spaceIndex
            );

            return (
              <div
                key={spaceIndex}
                style={{ gridRow: rowIdx + 1, gridColumn: colIdx + 1, position: "relative" }}
              >
                <BoardSpace
                  space={space}
                  property={property}
                  isHighlighted={isHighlighted}
                  isCorner={[0, 10, 20, 30].includes(spaceIndex)}
                  rotation={
                    rowIdx === 10 ? 0 :     // bottom
                    colIdx === 0  ? 90 :    // left
                    rowIdx === 0  ? 180 :   // top
                    270                     // right
                  }
                />
                {/* Player tokens on this space */}
                {playersOnSpace.map((p, i) => (
                  <PlayerToken
                    key={p.wallet.toString()}
                    wallet={p.wallet.toString()}
                    color={PLAYER_COLORS[p.playerIndex % PLAYER_COLORS.length]}
                    index={i}
                    isCurrentPlayer={
                      gameState?.currentPlayerIndex === p.playerIndex
                    }
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Center panel overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          top: "calc(100% / 11)",
          left: "calc(100% / 11)",
          right: "calc(100% / 11)",
          bottom: "calc(100% / 11)",
        }}
      >
        <div className="text-center space-y-2 p-4">
          <div className="text-4xl font-bold font-[family-name:var(--font-space)]">
            <span className="text-white">Block</span>
            <span className="text-[#9945ff]">poly</span>
          </div>
          {gameState?.pendingDice && (
            <div className="flex gap-2 justify-center mt-2">
              <DieDisplay value={gameState.pendingDice[0]} />
              <DieDisplay value={gameState.pendingDice[1]} />
            </div>
          )}
          {gameState?.bullRunActive && (
            <div className="text-[#ffd700] text-xs font-semibold animate-pulse">
              BULL RUN ACTIVE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DieDisplay({ value }: { value: number }) {
  return (
    <div className="w-10 h-10 bg-[#0d0d22] border-2 border-[#9945ff] rounded-lg flex items-center justify-center text-xl font-bold text-white shadow-lg">
      {value}
    </div>
  );
}
