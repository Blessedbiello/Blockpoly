import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGameStore, BOARD, GROUP_COLORS, GROUP_NAMES } from "@blockpoly/shared";

interface Props {
  actions: { buyProperty: (spaceIndex: number) => Promise<void>; declineBuy: () => Promise<void> };
}

export function BuyModal({ actions }: Props) {
  const { activeModal, modalData, closeModal, gameState } = useGameStore();
  if (activeModal !== "buy") return null;

  const myState = useGameStore((s) => {
    const wallet = s.myWallet;
    return wallet ? s.playerStates.get(wallet) : null;
  });
  const spaceIndex = myState?.position ?? 0;
  const space = BOARD[spaceIndex];

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={[styles.colorBar, { backgroundColor: GROUP_COLORS[space.group] }]} />
          <Text style={styles.title}>{space.name}</Text>
          <Text style={styles.group}>{GROUP_NAMES[space.group]}</Text>
          <Text style={styles.price}>Price: {space.price} BPOLY</Text>
          <Text style={styles.detail}>Base Rent: {space.baseRent} BPOLY</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={async () => {
                await actions.buyProperty(spaceIndex);
                closeModal();
              }}
            >
              <Text style={styles.buttonText}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={async () => {
                await actions.declineBuy();
                closeModal();
              }}
            >
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#2a2a4a", borderRadius: 12, padding: 24 },
  colorBar: { height: 6, borderRadius: 3, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#e0e0e0" },
  group: { fontSize: 14, color: "#888", marginBottom: 8 },
  price: { fontSize: 18, color: "#9945FF", fontWeight: "600", marginBottom: 4 },
  detail: { fontSize: 14, color: "#aaa", marginBottom: 16 },
  buttons: { flexDirection: "row", gap: 12 },
  buyButton: { flex: 1, backgroundColor: "#9945FF", borderRadius: 8, padding: 14, alignItems: "center" },
  declineButton: { flex: 1, backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
