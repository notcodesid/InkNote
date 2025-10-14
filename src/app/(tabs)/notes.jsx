import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Plus,
  FolderOpen,
  PenTool,
  FileText,
  Trash,
  Calendar,
} from "lucide-react-native";
import ScreenLayout from "@/components/ScreenLayout";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { useTheme } from "@/utils/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [searchText, setSearchText] = useState("");
  const [notes, setNotes] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Load saved notes and drawings
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      // Load text notes
      const storedNotes = await AsyncStorage.getItem('textNotes');
      const notesData = storedNotes ? JSON.parse(storedNotes) : [];
      
      // Load drawings
      const storedDrawings = await AsyncStorage.getItem('drawings');
      const drawingsData = storedDrawings ? JSON.parse(storedDrawings) : [];
      
      setNotes(notesData);
      setDrawings(drawingsData);
      
      // Combine and sort by timestamp
      const allItems = [
        ...notesData.map(note => ({ ...note, type: 'text' })),
        ...drawingsData.map(drawing => ({ ...drawing, type: 'drawing' }))
      ].sort((a, b) => b.timestamp - a.timestamp);
      
      setFilteredItems(allItems);
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchText.trim() === "") {
      const allItems = [
        ...notes.map(note => ({ ...note, type: 'text' })),
        ...drawings.map(drawing => ({ ...drawing, type: 'drawing' }))
      ].sort((a, b) => b.timestamp - a.timestamp);
      setFilteredItems(allItems);
    } else {
      const filtered = [
        ...notes.map(note => ({ ...note, type: 'text' })),
        ...drawings.map(drawing => ({ ...drawing, type: 'drawing' }))
      ].filter(item => {
        if (item.type === 'text') {
          return item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                 item.content?.toLowerCase().includes(searchText.toLowerCase());
        }
        return item.id?.toLowerCase().includes(searchText.toLowerCase());
      }).sort((a, b) => b.timestamp - a.timestamp);
      setFilteredItems(filtered);
    }
  }, [searchText, notes, drawings]);

  const handleSearch = (text) => {
    setSearchText(text);
  };

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 0);
  };

  const handleCreateNote = () => {
    router.push('/text-notes');
  };

  const handleItemPress = (item) => {
    if (item.type === 'text') {
      router.push(`/note/${item.id}`);
    } else {
      // For drawings, we could navigate to a drawing viewer
      Alert.alert("Drawing", `Drawing created on ${formatDate(item.timestamp)}`);
    }
  };

  const handleDeleteItem = async (item) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete this ${item.type}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              if (item.type === 'text') {
                const updatedNotes = notes.filter(note => note.id !== item.id);
                setNotes(updatedNotes);
                await AsyncStorage.setItem('textNotes', JSON.stringify(updatedNotes));
              } else {
                const updatedDrawings = drawings.filter(drawing => drawing.id !== item.id);
                setDrawings(updatedDrawings);
                await AsyncStorage.setItem('drawings', JSON.stringify(updatedDrawings));
              }
              
              // Refresh filtered items
              loadStoredData();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert("Error", "Failed to delete item");
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const NoteCard = ({ item, onPress, onDelete }) => (
    <Pressable
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 12,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        shadowColor: isDark ? "#000" : "#000",
        shadowOffset: { width: 0, height: pressed ? 4 : 2 },
        shadowOpacity: pressed ? (isDark ? 0.3 : 0.08) : isDark ? 0.2 : 0.04,
        shadowRadius: pressed ? 8 : 4,
        elevation: pressed ? 4 : 2,
      })}
      onPress={onPress}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        {/* Type Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.emptyStateBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {item.type === 'text' ? (
            <FileText size={18} color={colors.primary} strokeWidth={1.5} />
          ) : (
            <PenTool size={18} color={colors.primary} strokeWidth={1.5} />
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 16,
                fontWeight: "600",
                color: colors.text,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.type === 'text' ? (item.title || 'Untitled Note') : `Drawing ${item.id}`}
            </Text>

            <TouchableOpacity
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 size={14} color={colors.error} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {item.type === 'text' && item.content && (
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 8,
                lineHeight: 20,
              }}
              numberOfLines={2}
            >
              {item.content}
            </Text>
          )}

          {/* Metadata */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Calendar
                size={12}
                color={colors.iconSecondary}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginLeft: 4,
                }}
              >
                {formatDate(item.timestamp)}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: item.type === 'text' ? colors.success : colors.warning,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 10,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                }}
              >
                {item.type}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenLayout scrollable={false}>
      {/* Sticky Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: colors.background,
          borderBottomWidth: isScrolled ? 1 : 0,
          borderBottomColor: colors.border,
        }}
      >
        <ScreenHeader
          title="Notes"
          actionIcon={Plus}
          onActionPress={handleCreateNote}
          actionLabel="Create note"
        />

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              flex: 1,
              marginRight: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 24,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 4,
              }}
            >
              {notes.length}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              Text Notes
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              flex: 1,
              marginLeft: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 24,
                fontWeight: "600",
                color: colors.primary,
                marginBottom: 4,
              }}
            >
              {drawings.length}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              Drawings
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.searchBg,
              borderRadius: 24,
              height: 44,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Search size={18} color={colors.iconSecondary} strokeWidth={1.5} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontFamily: "System",
                fontSize: 15,
                fontWeight: "500",
                color: colors.text,
              }}
              placeholder="Search notes and drawings..."
              placeholderTextColor={colors.placeholder}
              value={searchText}
              onChangeText={handleSearch}
            />
          </View>
        </View>
      </View>

      {/* Notes List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 200, // Account for header + stats + search
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {filteredItems.length === 0 && searchText.trim() !== "" ? (
          <EmptyState
            icon={Search}
            title="No items found"
            subtitle={`No notes or drawings match "${searchText}". Try a different search term.`}
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No notes yet"
            subtitle="Create your first note or drawing to get started with organizing your thoughts."
          />
        ) : (
          filteredItems.map((item) => (
            <NoteCard
              key={`${item.type}-${item.id}`}
              item={item}
              onPress={() => handleItemPress(item)}
              onDelete={() => handleDeleteItem(item)}
            />
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}