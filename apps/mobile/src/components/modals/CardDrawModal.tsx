import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGameStore, ALPHA_CALL_CARDS, GOVERNANCE_VOTE_CARDS } from "@blockpoly/shared";

interface Props {
  actions: { drawCard: () => Promise<void> };
}

export function CardDrawModal({ actions }: Props) {
  const { activeModal, modalData, closeModal } = useGameStore();
  if (activeModal !== "card") return null;

  const data = modalData as { deck?: number; cardId?: number } | null;
  const card = data?.deck !== undefined && data?.cardId !== undefined
    ? (data.deck === 0 ? ALPHA_CALL_CARDS : GOVERNANCE_VOTE_CARDS)[data.cardId]
    : null;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.deckLabel}>
            {card ? (card.deck === "alpha" ? "Alpha Call" : "Governance Vote") : "Draw a Card"}
          </Text>
          {card ? (
            <>
              <Text style={styles.title}>{card.name}</Text>
              <Text style={styles.desc}>{card.description}</Text>
            </>
          ) : (
            <Text style={styles.desc}>Tap below to draw your card.</Text>
          )}
          {!card && (
            <TouchableOpacity
              style={styles.drawButton}
              onPress={async () => {
                await actions.drawCard();
              }}
            >
              <Text style={styles.buttonText}>Draw</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#2a2a4a", borderRadius: 12, padding: 24 },
  deckLabel: { fontSize: 12, color: "#9945FF", textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "bold", color: "#e0e0e0", marginBottom: 8 },
  desc: { fontSize: 14, color: "#aaa", marginBottom: 16, lineHeight: 20 },
  drawButton: { backgroundColor: "#9945FF", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 8 },
  closeButton: { backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
