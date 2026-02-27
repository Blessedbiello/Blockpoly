import React, { useState, useCallback } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import {
  useGameStore,
  quoteSolToBpoly,
  quoteBpolyToSol,
  formatBpoly,
  formatSol,
  type JupiterQuote,
} from "@blockpoly/shared";

export function JupiterSwapModal() {
  const { activeModal, closeModal } = useGameStore();
  const [direction, setDirection] = useState<"sol2bpoly" | "bpoly2sol">("sol2bpoly");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (!amount) return;
    setLoading(true);
    try {
      if (direction === "sol2bpoly") {
        const lamports = String(Math.floor(Number(amount) * 1e9));
        const q = await quoteSolToBpoly(lamports);
        setQuote(q);
      } else {
        const micro = String(Math.floor(Number(amount) * 1e6));
        const q = await quoteBpolyToSol(micro);
        setQuote(q);
      }
    } catch (err) {
      console.error("Quote error:", err);
    } finally {
      setLoading(false);
    }
  }, [amount, direction]);

  if (activeModal !== "jupiter_prompt") return null;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Jupiter Swap</Text>

          <View style={styles.dirRow}>
            <TouchableOpacity
              style={[styles.dirButton, direction === "sol2bpoly" && styles.active]}
              onPress={() => { setDirection("sol2bpoly"); setQuote(null); }}
            >
              <Text style={styles.dirText}>SOL → BPOLY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dirButton, direction === "bpoly2sol" && styles.active]}
              onPress={() => { setDirection("bpoly2sol"); setQuote(null); }}
            >
              <Text style={styles.dirText}>BPOLY → SOL</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={direction === "sol2bpoly" ? "Amount (SOL)" : "Amount (BPOLY)"}
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(v) => { setAmount(v); setQuote(null); }}
          />

          <TouchableOpacity style={styles.quoteButton} onPress={fetchQuote} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Quote</Text>
            )}
          </TouchableOpacity>

          {quote && (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                You receive:{" "}
                {direction === "sol2bpoly"
                  ? `${formatBpoly(quote.outAmount)} BPOLY`
                  : `${formatSol(quote.outAmount)} SOL`}
              </Text>
              <Text style={styles.quoteDetail}>
                Price impact: {quote.priceImpactPct}%
              </Text>
            </View>
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
  modal: { backgroundColor: "#2a2a4a", borderRadius: 12, padding: 24 },
  title: { fontSize: 20, fontWeight: "bold", color: "#e0e0e0", marginBottom: 12 },
  dirRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  dirButton: { flex: 1, backgroundColor: "#1a1a2e", borderRadius: 8, padding: 10, alignItems: "center" },
  active: { backgroundColor: "#9945FF" },
  dirText: { color: "#e0e0e0", fontSize: 14, fontWeight: "600" },
  input: { backgroundColor: "#1a1a2e", borderRadius: 8, padding: 12, color: "#e0e0e0", fontSize: 16, marginBottom: 12 },
  quoteButton: { backgroundColor: "#9945FF", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 12 },
  quoteBox: { backgroundColor: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 12 },
  quoteText: { color: "#00AA44", fontSize: 16, fontWeight: "600" },
  quoteDetail: { color: "#888", fontSize: 12, marginTop: 4 },
  closeButton: { backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
