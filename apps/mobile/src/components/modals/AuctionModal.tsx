import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useGameStore, BOARD, BPOLY_SCALE } from "@blockpoly/shared";

interface Props {
  actions: { auctionBid: (spaceIndex: number, amount: bigint) => Promise<void> };
}

export function AuctionModal({ actions }: Props) {
  const { activeModal, gameState, closeModal } = useGameStore();
  const [bidAmount, setBidAmount] = useState("");

  if (activeModal !== "auction" || !gameState?.auctionSpace) return null;

  const space = BOARD[gameState.auctionSpace];
  const currentBid = Number(gameState.auctionHighestBid) / BPOLY_SCALE;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Auction: {space.name}</Text>
          <Text style={styles.detail}>Current bid: {currentBid.toFixed(0)} BPOLY</Text>
          <TextInput
            style={styles.input}
            placeholder="Your bid (BPOLY)"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            value={bidAmount}
            onChangeText={setBidAmount}
          />
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.bidButton}
              onPress={async () => {
                const amount = BigInt(Math.floor(Number(bidAmount) * BPOLY_SCALE));
                await actions.auctionBid(gameState.auctionSpace!, amount);
                closeModal();
              }}
            >
              <Text style={styles.buttonText}>Place Bid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.buttonText}>Close</Text>
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
  title: { fontSize: 20, fontWeight: "bold", color: "#e0e0e0", marginBottom: 8 },
  detail: { fontSize: 14, color: "#aaa", marginBottom: 12 },
  input: { backgroundColor: "#1a1a2e", borderRadius: 8, padding: 12, color: "#e0e0e0", marginBottom: 16, fontSize: 16 },
  buttons: { flexDirection: "row", gap: 12 },
  bidButton: { flex: 1, backgroundColor: "#9945FF", borderRadius: 8, padding: 14, alignItems: "center" },
  closeButton: { flex: 1, backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
