import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Palette,
  Trash2,
  Download,
  Upload,
  Moon,
  Sun,
  Info,
  HelpCircle,
  Share,
  ChevronRight,
} from "lucide-react-native";
import ScreenLayout from "@/components/ScreenLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { useTheme } from "@/utils/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your notes and drawings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['textNotes', 'drawings']);
              Alert.alert("Success", "All data has been cleared.");
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data.");
            }
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const textNotes = await AsyncStorage.getItem('textNotes');
      const drawings = await AsyncStorage.getItem('drawings');
      
      const exportData = {
        textNotes: textNotes ? JSON.parse(textNotes) : [],
        drawings: drawings ? JSON.parse(drawings) : [],
        exportDate: new Date().toISOString(),
        version: "1.0"
      };

      // In a real app, you would use a file sharing library
      Alert.alert(
        "Export Data", 
        `Ready to export:\n• ${exportData.textNotes.length} text notes\n• ${exportData.drawings.length} drawings\n\nNote: Export functionality requires additional file sharing capabilities.`
      );
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export data.");
    }
  };

  const handleImportData = () => {
    Alert.alert(
      "Import Data",
      "Import functionality allows you to restore notes and drawings from a backup file.\n\nNote: Import functionality requires additional file picker capabilities."
    );
  };

  const SettingSection = ({ title, children }) => (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontFamily: "System",
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
          marginBottom: 12,
          marginLeft: 4,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    dangerous = false,
    rightElement
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 8,
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: dangerous ? 
            (isDark ? 'rgba(239, 83, 80, 0.1)' : 'rgba(239, 83, 80, 0.05)') : 
            colors.emptyStateBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon 
          size={18} 
          color={dangerous ? colors.error : colors.iconSecondary} 
          strokeWidth={1.5} 
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "System",
            fontSize: 16,
            fontWeight: "600",
            color: dangerous ? colors.error : colors.text,
            marginBottom: subtitle ? 2 : 0,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontFamily: "System",
              fontSize: 14,
              color: colors.textSecondary,
              lineHeight: 18,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement || (showChevron && (
        <ChevronRight
          size={18}
          color={colors.iconSecondary}
          strokeWidth={1.5}
        />
      ))}
    </TouchableOpacity>
  );

  const AppInfoCard = () => (
    <View
      style={{
        backgroundColor: colors.profileCard,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Palette size={28} color="#FFFFFF" strokeWidth={1.5} />
      </View>
      
      <Text
        style={{
          fontFamily: "System",
          fontSize: 20,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 4,
        }}
      >
        HandWrite Notes
      </Text>
      
      <Text
        style={{
          fontFamily: "System",
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 8,
        }}
      >
        Version 1.0.0
      </Text>
      
      <Text
        style={{
          fontFamily: "System",
          fontSize: 12,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 18,
        }}
      >
        A powerful note-taking app with drawing capabilities and offline storage
      </Text>
    </View>
  );

  return (
    <ScreenLayout>
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Settings" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <AppInfoCard />

          <SettingSection title="Appearance">
            <SettingItem
              icon={isDark ? Moon : Sun}
              title="Theme"
              subtitle={`Currently using ${isDark ? 'dark' : 'light'} theme`}
              onPress={() => {
                Alert.alert(
                  "Theme Settings",
                  "Theme automatically follows your system preference. You can change this in your device settings."
                );
              }}
            />
          </SettingSection>

          <SettingSection title="Data Management">
            <SettingItem
              icon={Download}
              title="Export Data"
              subtitle="Save your notes and drawings to a backup file"
              onPress={handleExportData}
            />
            
            <SettingItem
              icon={Upload}
              title="Import Data"
              subtitle="Restore notes and drawings from a backup file"
              onPress={handleImportData}
            />

            <SettingItem
              icon={Trash2}
              title="Clear All Data"
              subtitle="Permanently delete all notes and drawings"
              onPress={handleClearAllData}
              dangerous={true}
            />
          </SettingSection>

          <SettingSection title="Support">
            <SettingItem
              icon={Share}
              title="Share App"
              subtitle="Tell others about HandWrite Notes"
              onPress={() => {
                Alert.alert(
                  "Share App",
                  "Share this amazing note-taking app with your friends and colleagues!"
                );
              }}
            />

            <SettingItem
              icon={HelpCircle}
              title="Help & Support"
              subtitle="Get help and report issues"
              onPress={() => {
                Alert.alert(
                  "Help & Support",
                  "For help and support:\n\n• Check the in-app tutorials\n• Visit our documentation\n• Contact our support team"
                );
              }}
            />

            <SettingItem
              icon={Info}
              title="About"
              subtitle="App information and credits"
              onPress={() => {
                Alert.alert(
                  "About HandWrite Notes",
                  "HandWrite Notes is a modern note-taking app built with React Native, featuring:\n\n• High-performance drawing with Skia\n• Offline-first storage\n• Cross-platform compatibility\n• Gesture-based interactions\n\nBuilt with ❤️ using React Native and Expo."
                );
              }}
            />
          </SettingSection>

          {/* Performance Info */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Performance Features
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                color: colors.textSecondary,
                lineHeight: 18,
              }}
            >
              • 60fps drawing with hardware acceleration{'\n'}
              • Offline-first data storage{'\n'}
              • Optimized gesture recognition{'\n'}
              • Battery-efficient rendering
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}