import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Save,
  Type,
  Mic,
  Image,
  Hash,
} from "lucide-react-native";
import ScreenLayout from "@/components/ScreenLayout";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { useTheme } from "@/utils/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TextNotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Empty Note", "Please add some content before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const noteData = {
        id: Math.random().toString(36).substr(2, 9),
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        timestamp: Date.now(),
        lastModified: Date.now(),
      };

      // Get existing notes
      const existingNotes = await AsyncStorage.getItem('textNotes');
      const notes = existingNotes ? JSON.parse(existingNotes) : [];
      
      // Add new note
      notes.push(noteData);
      
      // Save back to storage
      await AsyncStorage.setItem('textNotes', JSON.stringify(notes));
      
      Alert.alert("Success", "Note saved successfully!", [
        {
          text: "OK",
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. What would you like to do?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back()
          },
          {
            text: "Save & Exit",
            onPress: async () => {
              await handleSave();
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const ToolButton = ({ icon: Icon, label, onPress, isActive = false }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: isActive ? colors.primary : colors.surfaceElevated,
        marginRight: 8,
      }}
      onPress={onPress}
    >
      <Icon 
        size={16} 
        color={isActive ? "#FFFFFF" : colors.iconSecondary} 
        strokeWidth={1.5} 
      />
      <Text
        style={{
          fontFamily: "System",
          fontSize: 12,
          fontWeight: "600",
          color: isActive ? "#FFFFFF" : colors.textSecondary,
          marginLeft: 6,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ paddingTop: insets.top }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={handleBack}
              >
                <ArrowLeft size={20} color={colors.iconSecondary} strokeWidth={1.5} />
              </TouchableOpacity>

              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text,
                }}
              >
                New Note
              </Text>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  opacity: isSaving ? 0.6 : 1,
                }}
                onPress={handleSave}
                disabled={isSaving}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Save size={16} color="#FFFFFF" strokeWidth={1.5} />
                  <Text
                    style={{
                      fontFamily: "System",
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#FFFFFF",
                      marginLeft: 6,
                    }}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1, padding: 20 }}>
            {/* Title Input */}
            <TextInput
              ref={titleInputRef}
              style={{
                fontFamily: "System",
                fontSize: 28,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 20,
                paddingVertical: 8,
              }}
              placeholder="Note title..."
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={setTitle}
              multiline={false}
              returnKeyType="next"
              onSubmitEditing={() => {
                contentInputRef.current?.focus();
              }}
            />

            {/* Formatting Toolbar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                marginBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
            >
              <ToolButton
                icon={Type}
                label="Text"
                onPress={() => {}}
                isActive={true}
              />
              <ToolButton
                icon={Hash}
                label="Heading"
                onPress={() => {}}
              />
              <ToolButton
                icon={Mic}
                label="Voice"
                onPress={() => {
                  Alert.alert("Coming Soon", "Voice notes feature is coming soon!");
                }}
              />
              <ToolButton
                icon={Image}
                label="Image"
                onPress={() => {
                  Alert.alert("Coming Soon", "Image insertion is coming soon!");
                }}
              />
            </View>

            {/* Content Input */}
            <TextInput
              ref={contentInputRef}
              style={{
                flex: 1,
                fontFamily: "System",
                fontSize: 16,
                lineHeight: 24,
                color: colors.text,
                textAlignVertical: "top",
              }}
              placeholder="Start writing your note..."
              placeholderTextColor={colors.placeholder}
              value={content}
              onChangeText={setContent}
              multiline={true}
              scrollEnabled={true}
              blurOnSubmit={false}
            />
          </View>

          {/* Bottom Stats */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 16,
              paddingBottom: insets.bottom + 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              {content.length} characters
            </Text>

            <Text
              style={{
                fontFamily: "System",
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              {content.split(/\s+/).filter(word => word.length > 0).length} words
            </Text>
          </View>
        </View>
      </KeyboardAvoidingAnimatedView>
    </ScreenLayout>
  );
}