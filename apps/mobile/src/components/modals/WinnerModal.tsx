import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGameStore, BPOLY_DECIMALS } from "@blockpoly/shared";

interface Props {
  actions: { claimPrize: () => Promise<void> };
}

export function WinnerModal({ actions }: Props) {
  const { activeModal, closeModal, gameState, myWallet } = useGameStore();
  const myState = useGameStore((s) => {
    const w = s.myWallet;
    return w ? s.playerStates.get(w) : null;
  });

  if (activeModal !== "winner") return null;

  const isWinner =
    gameState?.winner && myWallet && gameState.winner.toBase58() === myWallet;
  const balance = myState ? Number(myState.bpolyBalance) / 10 ** BPOLY_DECIMALS : 0;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {isWinner ? "You Won!" : "Game Over"}
          </Text>
          {isWinner ? (
            <>
              <Text style={styles.detail}>
                Final balance: {balance.toFixed(2)} BPOLY
              </Text>
              <TouchableOpacity
                style={styles.claimButton}
                onPress={async () => {
                  await actions.claimPrize();
                  closeModal();
                }}
              >
                <Text style={styles.buttonText}>Claim Prize</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.detail}>
              Winner: {gameState?.winner?.toBase58().slice(0, 8)}...
            </Text>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#2a2a4a", borderRadius: 12, padding: 24, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFD700", marginBottom: 12 },
  detail: { fontSize: 16, color: "#aaa", marginBottom: 16 },
  claimButton: { backgroundColor: "#9945FF", borderRadius: 8, padding: 14, alignItems: "center", width: "100%", marginBottom: 8 },
  closeButton: { backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center", width: "100%" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
