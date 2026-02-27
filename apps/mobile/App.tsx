import "./polyfills";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { MobileWalletProvider } from "./src/providers/MobileWalletProvider";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <MobileWalletProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </MobileWalletProvider>
  );
}
