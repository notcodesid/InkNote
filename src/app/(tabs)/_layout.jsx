import { Tabs } from "expo-router";
import {
  PenTool,
  FileText,
  Settings,
  FolderOpen,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          height: 74 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.iconSecondary,
        tabBarShowLabel: false,
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FolderOpen color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="drawing"
        options={{
          tabBarIcon: ({ color, size }) => (
            <PenTool color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="text-notes"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}