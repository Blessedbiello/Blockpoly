import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import {
  useGameStore,
  BOARD,
  GROUP_COLORS,
  GROUP_MEMBERS,
  SPACE_TYPES,
} from "@blockpoly/shared";

interface Props {
  actions: {
    buildLP: (spaceIndex: number, siblingLpCounts: number[]) => Promise<void>;
    buildProtocol: (spaceIndex: number) => Promise<void>;
  };
}

export function BuildModal({ actions }: Props) {
  const { activeModal, closeModal } = useGameStore();
  const myState = useGameStore((s) => {
    const w = s.myWallet;
    return w ? s.playerStates.get(w) : null;
  });
  const properties = useGameStore((s) => s.properties);

  if (activeModal !== "build") return null;

  const myProps = (myState?.propertiesOwned ?? []).filter((idx) => {
    const space = BOARD[idx];
    return space && space.type === SPACE_TYPES.PROPERTY;
  });

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Build</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {myProps.length === 0 ? (
              <Text style={styles.empty}>No buildable properties</Text>
            ) : (
              myProps.map((idx) => {
                const space = BOARD[idx];
                const prop = properties.get(idx);
                const lps = prop?.liquidityPools ?? 0;
                const isProtocol = prop?.isFullProtocol ?? false;
                const groupMembers = GROUP_MEMBERS[space.group] ?? [];
                const siblingLps = groupMembers
                  .filter((m) => m !== idx)
                  .map((m) => properties.get(m)?.liquidityPools ?? 0);

                return (
                  <View key={idx} style={styles.propRow}>
                    <View style={[styles.dot, { backgroundColor: GROUP_COLORS[space.group] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.propName}>{space.name}</Text>
                      <Text style={styles.propDetail}>
                        LPs: {lps}/4 {isProtocol ? "| Full Protocol" : ""}
                      </Text>
                    </View>
                    {!isProtocol && lps < 4 && (
                      <TouchableOpacity
                        style={styles.buildButton}
                        onPress={async () => {
                          await actions.buildLP(idx, siblingLps);
                        }}
                      >
                        <Text style={styles.btnText}>+LP ({space.lpCost})</Text>
                      </TouchableOpacity>
                    )}
                    {!isProtocol && lps === 4 && (
                      <TouchableOpacity
                        style={[styles.buildButton, { backgroundColor: "#FF0000" }]}
                        onPress={async () => {
                          await actions.buildProtocol(idx);
                        }}
                      >
                        <Text style={styles.btnText}>Protocol</Text>
                      </TouchableOpacity>
                    )}
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
  propRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  propName: { color: "#e0e0e0", fontSize: 14, fontWeight: "600" },
  propDetail: { color: "#888", fontSize: 12 },
  buildButton: { backgroundColor: "#00AA44", borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  closeButton: { backgroundColor: "#555", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 12 },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
