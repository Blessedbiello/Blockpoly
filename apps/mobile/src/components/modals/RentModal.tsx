import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGameStore, BOARD, GROUP_COLORS, GROUP_NAMES, calculateRent } from "@blockpoly/shared";

interface Props {
  actions: { payRent: (spaceIndex: number, diceTotal?: number) => Promise<void> };
}

export function RentModal({ actions }: Props) {
  const { activeModal, closeModal, gameState } = useGameStore();
  const myState = useGameStore((s) => {
    const w = s.myWallet;
    return w ? s.playerStates.get(w) : null;
  });
  const properties = useGameStore((s) => s.properties);

  if (activeModal !== "rent" || !myState) return null;

  const spaceIndex = myState.position;
  const space = BOARD[spaceIndex];
  const prop = properties.get(spaceIndex);
  if (!prop) return null;

  const ownerProps = Array.from(properties.entries())
    .filter(([, p]) => p.owner.toBase58() === prop.owner.toBase58())
    .map(([idx]) => idx);

  const diceTotal = gameState?.pendingDice
    ? gameState.pendingDice[0] + gameState.pendingDice[1]
    : 0;

  const rent = calculateRent({
    spaceIndex,
    liquidityPools: prop.liquidityPools,
    isFullProtocol: prop.isFullProtocol,
    isMortgaged: prop.isMortgaged,
    ownerProperties: ownerProps,
    diceTotalForUtility: diceTotal,
    bullRunActive: gameState?.bullRunActive ?? false,
  });

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={[styles.colorBar, { backgroundColor: GROUP_COLORS[space.group] }]} />
          <Text style={styles.title}>{space.name}</Text>
          <Text style={styles.detail}>Owner: {prop.owner.toBase58().slice(0, 8)}...</Text>
          <Text style={styles.rent}>Rent Due: {rent} BPOLY</Text>
          <TouchableOpacity
            style={styles.payButton}
            onPress={async () => {
              await actions.payRent(spaceIndex, diceTotal);
              closeModal();
            }}
          >
            <Text style={styles.buttonText}>Pay Rent</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#2a2a4a", borderRadius: 12, padding: 24 },
  colorBar: { height: 6, borderRadius: 3, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "bold", color: "#e0e0e0" },
  detail: { fontSize: 13, color: "#888", marginBottom: 8 },
  rent: { fontSize: 18, color: "#FF6B6B", fontWeight: "600", marginBottom: 16 },
  payButton: { backgroundColor: "#9945FF", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
