import React from "react";
import { View, type ViewStyle } from "react-native";

interface Props {
  color: string;
  style?: ViewStyle;
}

export function PlayerToken({ color, style }: Props) {
  return (
    <View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: "#fff",
        },
        style,
      ]}
    />
  );
}
