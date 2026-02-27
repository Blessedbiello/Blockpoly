import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useGameStore, BOARD, GROUP_COLORS, SPACE_TYPES } from "@blockpoly/shared";

interface Props {
  actions: {
    mortgageProperty: (spaceIndex: number) => Promise<void>;
    unmortgageProperty: (spaceIndex: number) => Promise<void>;
  };
}

export function MortgageModal({ actions }: Props) {
  const { activeModal, closeModal } = useGameStore();
  const myState = useGameStore((s) => {
    const w = s.myWallet;
    return w ? s.playerStates.get(w) : null;
  });
  const properties = useGameStore((s) => s.properties);

  if (activeModal !== "mortgage") return null;

  const myProps = myState?.propertiesOwned ?? [];

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Mortgage / Unmortgage</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {myProps.length === 0 ? (
              <Text style={styles.empty}>No properties owned</Text>
            ) : (
              myProps.map((idx) => {
                const space = BOARD[idx];
                if (!space) return null;
                const prop = properties.get(idx);
                const mortgaged = prop?.isMortgaged ?? false;

                return (
                  <View key={idx} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: GROUP_COLORS[space.group] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{space.name}</Text>
                      <Text style={styles.detail}>
                        {mortgaged ? "Mortgaged" : `Value: ${space.mortgageValue} BPOLY`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.btn, mortgaged ? styles.unmortgageBtn : styles.mortgageBtn]}
                      onPress={async () => {
                        if (mortgaged) await actions.unmortgageProperty(idx);
                        else await actions.mortgageProperty(idx);
                      }}
                    >
                      <Text style={styles.btnText}>{mortgaged ? "Unmortgage" : "Mortgage"}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.btnText}>Close</Text>
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
  empty: { color: "#666", textAlign: "center", marginVertical: 16 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: "#e0e0e0", fontSize: 14, fontWeight: "600" },
  detail: { color: "#888", fontSize: 12 },
  btn: { borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  mortgageBtn: { backgroundColor: "#FF6B6B" },
  unmortgageBtn: { backgroundColor: "#00AA44" },
  closeButton: { backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 12 },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
