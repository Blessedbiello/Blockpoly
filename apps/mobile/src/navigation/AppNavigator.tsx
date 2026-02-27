import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LobbyScreen } from "../screens/LobbyScreen";
import { GameScreen } from "../screens/GameScreen";

export type RootStackParamList = {
  Lobby: undefined;
  Game: { gameId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Lobby"
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#e0e0e0",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#1a1a2e" },
        }}
      >
        <Stack.Screen
          name="Lobby"
          component={LobbyScreen}
          options={{ title: "Blockpoly" }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ title: "Game" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
