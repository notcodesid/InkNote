import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/theme";

export default function ScreenHeader({ 
  title, 
  actionIcon: ActionIcon, 
  onActionPress, 
  actionLabel 
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={{ paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontSize: 32,
            fontWeight: "800",
            color: colors.text,
          }}
        >
          {title}
        </Text>

        {ActionIcon && onActionPress && (
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
            }}
            onPress={onActionPress}
            accessibilityLabel={actionLabel}
          >
            <ActionIcon size={20} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}