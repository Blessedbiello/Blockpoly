import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useGameStore, BOARD } from "@blockpoly/shared";

interface Props {
  actions: {
    proposeTrade: (params: {
      recipient: string;
      offeredProperties: number[];
      offeredBpoly: bigint;
      requestedProperties: number[];
      requestedBpoly: bigint;
    }) => Promise<void>;
  };
}

export function TradeModal({ actions }: Props) {
  const { activeModal, closeModal } = useGameStore();
  const myState = useGameStore((s) => {
    const w = s.myWallet;
    return w ? s.playerStates.get(w) : null;
  });
  const gameState = useGameStore((s) => s.gameState);
  const myWallet = useGameStore((s) => s.myWallet);

  const [recipient, setRecipient] = useState("");
  const [offeredBpoly, setOfferedBpoly] = useState("");
  const [requestedBpoly, setRequestedBpoly] = useState("");

  if (activeModal !== "trade") return null;

  const myProps = myState?.propertiesOwned ?? [];
  const otherPlayers = gameState?.players.filter((p) => p.toBase58() !== myWallet) ?? [];

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Propose Trade</Text>

          <Text style={styles.label}>Trade with:</Text>
          {otherPlayers.map((p) => (
            <TouchableOpacity
              key={p.toBase58()}
              style={[styles.playerChip, recipient === p.toBase58() && styles.selectedChip]}
              onPress={() => setRecipient(p.toBase58())}
            >
              <Text style={styles.chipText}>{p.toBase58().slice(0, 8)}...</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Your Properties:</Text>
          {myProps.map((idx) => (
            <Text key={idx} style={styles.propText}>{BOARD[idx]?.name ?? `Space ${idx}`}</Text>
          ))}

          <TextInput
            style={styles.input}
            placeholder="BPOLY to offer"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            value={offeredBpoly}
            onChangeText={setOfferedBpoly}
          />
          <TextInput
            style={styles.input}
            placeholder="BPOLY to request"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            value={requestedBpoly}
            onChangeText={setRequestedBpoly}
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.tradeButton}
              onPress={async () => {
                if (!recipient) return;
                await actions.proposeTrade({
                  recipient,
                  offeredProperties: [],
                  offeredBpoly: BigInt(Number(offeredBpoly || 0) * 1_000_000),
                  requestedProperties: [],
                  requestedBpoly: BigInt(Number(requestedBpoly || 0) * 1_000_000),
                });
                closeModal();
              }}
            >
              <Text style={styles.buttonText}>Propose</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#2a2a4a", borderRadius: 12, padding: 24, maxHeight: "80%" },
  title: { fontSize: 20, fontWeight: "bold", color: "#e0e0e0", marginBottom: 12 },
  label: { fontSize: 14, color: "#888", marginBottom: 4, marginTop: 8 },
  playerChip: { backgroundColor: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 4 },
  selectedChip: { borderColor: "#9945FF", borderWidth: 2 },
  chipText: { color: "#e0e0e0", fontSize: 14 },
  propText: { color: "#aaa", fontSize: 13, marginLeft: 8 },
  input: { backgroundColor: "#1a1a2e", borderRadius: 8, padding: 12, color: "#e0e0e0", marginTop: 8, fontSize: 16 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 16 },
  tradeButton: { flex: 1, backgroundColor: "#9945FF", borderRadius: 8, padding: 14, alignItems: "center" },
  closeButton: { flex: 1, backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
