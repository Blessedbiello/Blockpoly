import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useGameStore } from "@blockpoly/shared";
import { useMobileWalletContext } from "../providers/MobileWalletProvider";
import { useMobileGame } from "../hooks/useMobileGame";
import { useMobileGameActions } from "../hooks/useMobileGameActions";
import { BoardGrid } from "../components/BoardGrid";
import { BuyModal } from "../components/modals/BuyModal";
import { AuctionModal } from "../components/modals/AuctionModal";
import { RentModal } from "../components/modals/RentModal";
import { CardDrawModal } from "../components/modals/CardDrawModal";
import { RugPullModal } from "../components/modals/RugPullModal";
import { TradeModal } from "../components/modals/TradeModal";
import { BuildModal } from "../components/modals/BuildModal";
import { MortgageModal } from "../components/modals/MortgageModal";
import { WinnerModal } from "../components/modals/WinnerModal";
import { JupiterSwapModal } from "../components/modals/JupiterSwapModal";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

export function GameScreen({ route }: Props) {
  const { gameId } = route.params;
  const { publicKey } = useMobileWalletContext();
  const store = useGameStore();
  const actions = useMobileGameActions(gameId);

  const playerWallets = store.gameState?.players.map((p) => p.toBase58()) ?? [];
  useMobileGame(gameId, playerWallets);

  useEffect(() => {
    if (publicKey) {
      store.setGameId(gameId);
      store.setMyWallet(publicKey.toBase58());
    }
  }, [gameId, publicKey]);

  const isMyTurn =
    store.gameState &&
    publicKey &&
    store.gameState.players[store.gameState.currentPlayerIndex]?.toBase58() ===
      publicKey.toBase58();

  const turnPhase = store.gameState?.turnPhase ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.boardContainer}>
        <BoardGrid />
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        {isMyTurn && turnPhase === 0 && (
          <TouchableOpacity style={styles.actionButton} onPress={actions.requestDiceRoll}>
            <Text style={styles.actionText}>Roll Dice</Text>
          </TouchableOpacity>
        )}
        {isMyTurn && turnPhase === 2 && (
          <TouchableOpacity style={styles.actionButton} onPress={actions.resolveLanding}>
            <Text style={styles.actionText}>Resolve</Text>
          </TouchableOpacity>
        )}
        {isMyTurn && turnPhase === 4 && (
          <TouchableOpacity style={styles.actionButton} onPress={actions.drawCard}>
            <Text style={styles.actionText}>Draw Card</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => store.openModal("trade")}
        >
          <Text style={styles.actionText}>Trade</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => store.openModal("build")}
        >
          <Text style={styles.actionText}>Build</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => store.openModal("mortgage")}
        >
          <Text style={styles.actionText}>Mortgage</Text>
        </TouchableOpacity>
      </View>

      {/* Game info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Turn: {store.gameState?.turnNumber ?? 0} | Round:{" "}
          {store.gameState?.roundNumber ?? 0}
        </Text>
        {store.gameState?.pendingDice && (
          <Text style={styles.diceText}>
            Dice: {store.gameState.pendingDice[0]} + {store.gameState.pendingDice[1]}
          </Text>
        )}
      </View>

      {/* Modals */}
      <BuyModal actions={actions} />
      <AuctionModal actions={actions} />
      <RentModal actions={actions} />
      <CardDrawModal actions={actions} />
      <RugPullModal actions={actions} />
      <TradeModal actions={actions} />
      <BuildModal actions={actions} />
      <MortgageModal actions={actions} />
      <WinnerModal actions={actions} />
      <JupiterSwapModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  boardContainer: { flex: 1 },
  actionBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
    backgroundColor: "#2a2a4a",
  },
  actionButton: {
    backgroundColor: "#9945FF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: "center",
  },
  secondaryButton: { backgroundColor: "#444" },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#1a1a2e",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  infoText: { color: "#888", fontSize: 12 },
  diceText: { color: "#9945FF", fontSize: 12, fontWeight: "600" },
});
