import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GROUP_COLORS, SPACE_TYPES } from "@blockpoly/shared";
import type { BoardSpace as BoardSpaceData, PropertyStateData } from "@blockpoly/shared";

interface Props {
  space: BoardSpaceData;
  property: PropertyStateData | null;
}

export function BoardSpace({ space, property }: Props) {
  const groupColor = GROUP_COLORS[space.group] ?? "transparent";
  const isOwned = property !== null;

  return (
    <View style={styles.container}>
      {/* Color bar */}
      {space.type === SPACE_TYPES.PROPERTY && (
        <View style={[styles.colorBar, { backgroundColor: groupColor }]} />
      )}

      {/* Name */}
      <Text style={styles.name} numberOfLines={2}>
        {space.name}
      </Text>

      {/* Price */}
      {space.price > 0 && (
        <Text style={styles.price}>{space.price}</Text>
      )}

      {/* LP indicators */}
      {property && property.liquidityPools > 0 && (
        <View style={styles.lpRow}>
          {Array.from({ length: property.liquidityPools }).map((_, i) => (
            <View key={i} style={styles.lpDot} />
          ))}
        </View>
      )}

      {/* Full protocol indicator */}
      {property?.isFullProtocol && (
        <View style={styles.protocolBadge}>
          <Text style={styles.protocolText}>P</Text>
        </View>
      )}

      {/* Mortgaged indicator */}
      {property?.isMortgaged && (
        <Text style={styles.mortgagedText}>M</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 1,
    backgroundColor: "#1e1e3a",
  },
  colorBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  name: {
    fontSize: 5,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 7,
  },
  price: {
    fontSize: 5,
    color: "#9945FF",
    fontWeight: "600",
  },
  lpRow: {
    flexDirection: "row",
    gap: 1,
    marginTop: 1,
  },
  lpDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#00AA44",
  },
  protocolBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF0000",
    alignItems: "center",
    justifyContent: "center",
  },
  protocolText: {
    fontSize: 4,
    color: "#fff",
    fontWeight: "bold",
  },
  mortgagedText: {
    fontSize: 5,
    color: "#FF6B6B",
    fontWeight: "bold",
  },
});
