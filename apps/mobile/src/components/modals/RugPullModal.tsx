import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGameStore, RUGPULL_BAIL, BPOLY_SCALE } from "@blockpoly/shared";

interface Props {
  actions: {
    rugpullPayBail: () => Promise<void>;
    rugpullUseJailFreeCard: () => Promise<void>;
    rugpullAttemptDoubles: () => Promise<void>;
  };
}

export function RugPullModal({ actions }: Props) {
  const { activeModal, closeModal } = useGameStore();
  const myState = useGameStore((s) => {
    const w = s.myWallet;
    return w ? s.playerStates.get(w) : null;
  });

  if (activeModal !== "rugpull") return null;

  const bailAmount = RUGPULL_BAIL / BPOLY_SCALE;
  const hasJailFree = myState?.hasJailFreeCard ?? false;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Rug Pull Zone!</Text>
          <Text style={styles.desc}>You're stuck in the Rug Pull Zone. Choose your escape:</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              await actions.rugpullPayBail();
              closeModal();
            }}
          >
            <Text style={styles.buttonText}>Pay Bail ({bailAmount} BPOLY)</Text>
          </TouchableOpacity>

          {hasJailFree && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#00AA44" }]}
              onPress={async () => {
                await actions.rugpullUseJailFreeCard();
                closeModal();
              }}
            >
              <Text style={styles.buttonText}>Use Jail-Free Card</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FF6B6B" }]}
            onPress={async () => {
              await actions.rugpullAttemptDoubles();
              closeModal();
            }}
          >
            <Text style={styles.buttonText}>Roll for Doubles</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#2a2a4a", borderRadius: 12, padding: 24 },
  title: { fontSize: 22, fontWeight: "bold", color: "#FF6B6B", marginBottom: 8 },
  desc: { fontSize: 14, color: "#aaa", marginBottom: 16 },
  actionButton: { backgroundColor: "#9945FF", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 8 },
  closeButton: { backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
