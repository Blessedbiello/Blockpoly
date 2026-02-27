import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { BOARD, GROUP_COLORS } from "@blockpoly/shared";
import { useGameStore } from "@blockpoly/shared";
import { BoardSpace } from "./BoardSpace";
import { PlayerToken } from "./PlayerToken";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 16) / 11);

// Map board index → (row, col) in the 11x11 grid.
function boardPosition(index: number): { row: number; col: number } {
  if (index <= 10) return { row: 10, col: 10 - index }; // bottom row, right→left
  if (index <= 20) return { row: 10 - (index - 10), col: 0 }; // left col, bottom→top
  if (index <= 30) return { row: 0, col: index - 20 }; // top row, left→right
  return { row: index - 30, col: 10 }; // right col, top→bottom
}

export function BoardGrid() {
  const playerStates = useGameStore((s) => s.playerStates);
  const properties = useGameStore((s) => s.properties);

  // Build grid cells
  const cells: React.ReactNode[] = [];

  for (const space of BOARD) {
    const { row, col } = boardPosition(space.index);
    const prop = properties.get(space.index);

    cells.push(
      <View
        key={space.index}
        style={[
          styles.cell,
          {
            top: row * CELL_SIZE,
            left: col * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
          },
        ]}
      >
        <BoardSpace space={space} property={prop ?? null} />
      </View>
    );
  }

  // Player tokens
  const tokens: React.ReactNode[] = [];
  const PLAYER_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];

  playerStates.forEach((ps, wallet) => {
    const { row, col } = boardPosition(ps.position);
    const offsetX = (ps.playerIndex % 3) * 8;
    const offsetY = Math.floor(ps.playerIndex / 3) * 8;

    tokens.push(
      <PlayerToken
        key={wallet}
        color={PLAYER_COLORS[ps.playerIndex] ?? "#fff"}
        style={{
          position: "absolute",
          top: row * CELL_SIZE + 2 + offsetY,
          left: col * CELL_SIZE + 2 + offsetX,
        }}
      />
    );
  });

  return (
    <View style={[styles.board, { width: CELL_SIZE * 11, height: CELL_SIZE * 11 }]}>
      {cells}
      {tokens}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: "relative",
    alignSelf: "center",
    marginVertical: 8,
  },
  cell: {
    position: "absolute",
    borderWidth: 0.5,
    borderColor: "#333",
  },
});
