import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Connection, PublicKey } from "@solana/web3.js";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PROGRAM_ID, SEEDS } from "@blockpoly/shared";
import { gameIdToString } from "@blockpoly/shared";
import { useMobileWalletContext } from "../providers/MobileWalletProvider";
import { useMobileGameActions } from "../hooks/useMobileGameActions";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Lobby">;

interface GameListItem {
  pubkey: string;
  gameId: string;
  playerCount: number;
  maxPlayers: number;
  status: number;
}

const RPC = "https://api.devnet.solana.com";

export function LobbyScreen({ navigation }: Props) {
  const { publicKey, connected, connecting, authorize } = useMobileWalletContext();
  const [games, setGames] = useState<GameListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGameId, setNewGameId] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");

  const actions = useMobileGameActions(newGameId);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const connection = new Connection(RPC, "confirmed");
      const programPk = new PublicKey(PROGRAM_ID);
      const accounts = await connection.getProgramAccounts(programPk, {
        filters: [
          { memcmp: { offset: 0, bytes: Buffer.from(SEEDS.GAME_STATE).toString("base64") } },
        ],
      });

      const items: GameListItem[] = accounts.map((a) => {
        const data = a.account.data;
        const gameIdBytes = data.slice(8, 40);
        return {
          pubkey: a.pubkey.toBase58(),
          gameId: gameIdToString(gameIdBytes),
          playerCount: data[72] ?? 0,
          maxPlayers: data[73] ?? 8,
          status: data[40] ?? 0,
        };
      });

      setGames(items.filter((g) => g.status === 0)); // WaitingForPlayers
    } catch (err) {
      console.error("fetchGames:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected) fetchGames();
  }, [connected]);

  const handleCreateGame = useCallback(async () => {
    if (!newGameId.trim()) {
      Alert.alert("Error", "Enter a game ID");
      return;
    }
    try {
      await actions.initializeGame(Number(maxPlayers), BigInt(0), new PublicKey("8YzHyvcEP8uP1XgK5pUnPh8BgGgskb9xHtiAkxFeJhjZ"));
      Alert.alert("Success", `Game "${newGameId}" created!`);
      fetchGames();
    } catch (err) {
      Alert.alert("Error", String(err));
    }
  }, [newGameId, maxPlayers, actions]);

  const handleJoinGame = useCallback(
    async (gameId: string) => {
      try {
        const joinActions = useMobileGameActions(gameId);
        await joinActions.joinGame();
        navigation.navigate("Game", { gameId });
      } catch (err) {
        Alert.alert("Error", String(err));
      }
    },
    [navigation]
  );

  if (!connected) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Blockpoly</Text>
        <Text style={styles.subtitle}>On-chain Monopoly on Solana</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={authorize}
          disabled={connecting}
        >
          {connecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Connect Wallet</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.walletLabel}>
        {publicKey?.toBase58().slice(0, 8)}...
      </Text>

      {/* Create Game */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Game</Text>
        <TextInput
          style={styles.input}
          placeholder="Game ID"
          placeholderTextColor="#666"
          value={newGameId}
          onChangeText={setNewGameId}
        />
        <TextInput
          style={styles.input}
          placeholder="Max Players (2-8)"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          value={maxPlayers}
          onChangeText={setMaxPlayers}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGame}>
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Game List */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Open Games</Text>
          <TouchableOpacity onPress={fetchGames}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color="#9945FF" />
        ) : (
          <FlatList
            data={games}
            keyExtractor={(item) => item.pubkey}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gameCard}
                onPress={() => handleJoinGame(item.gameId)}
              >
                <Text style={styles.gameTitle}>{item.gameId}</Text>
                <Text style={styles.gameMeta}>
                  {item.playerCount}/{item.maxPlayers} players
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No open games found</Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#1a1a2e" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e" },
  title: { fontSize: 32, fontWeight: "bold", color: "#e0e0e0", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#888", marginBottom: 32 },
  walletLabel: { fontSize: 12, color: "#9945FF", marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#e0e0e0", marginBottom: 12 },
  input: {
    backgroundColor: "#2a2a4a",
    borderRadius: 8,
    padding: 12,
    color: "#e0e0e0",
    marginBottom: 8,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#9945FF",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refreshText: { color: "#9945FF", fontSize: 14 },
  gameCard: {
    backgroundColor: "#2a2a4a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  gameTitle: { fontSize: 16, fontWeight: "600", color: "#e0e0e0" },
  gameMeta: { fontSize: 13, color: "#888", marginTop: 4 },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 16 },
});
