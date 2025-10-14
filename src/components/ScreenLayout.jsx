import React from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "@/utils/theme";

export default function ScreenLayout({ children, scrollable = true }) {
  const { colors, isDark } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        {children}
      </View>
    </GestureHandlerRootView>
  );
}