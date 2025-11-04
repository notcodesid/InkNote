import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/utils/theme";

export default function EmptyState({ icon: Icon, title, subtitle }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingVertical: 60,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.emptyStateBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Icon size={32} color={colors.iconSecondary} strokeWidth={1.5} />
      </View>

      <Text
        style={{
          fontFamily: "System",
          fontSize: 20,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontFamily: "System",
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}