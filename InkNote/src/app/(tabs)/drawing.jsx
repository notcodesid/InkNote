import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Dimensions, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Canvas,
  Path,
  Group,
  Fill,
  useTouchHandler,
  useSharedValueEffect,
  runOnJS,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  PenTool,
  Eraser,
  Palette,
  Undo,
  Redo,
  Save,
  Settings,
  Download,
} from "lucide-react-native";
import ScreenLayout from "@/components/ScreenLayout";
import { useTheme } from "@/utils/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function DrawingScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [currentTool, setCurrentTool] = useState("pen");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState(colors.strokeColor);
  const [paths, setPaths] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Drawing state
  const currentPath = useRef("");
  const currentStroke = useRef({
    color: colors.strokeColor,
    width: 3,
    tool: "pen",
  });

  // Available colors
  const availableColors = useMemo(
    () => [
      colors.strokeColor, // Black/White
      "#FF4444", // Red
      "#44FF44", // Green
      "#4444FF", // Blue
      "#FFFF44", // Yellow
      "#FF44FF", // Magenta
      "#44FFFF", // Cyan
      "#FF8844", // Orange
    ],
    [colors.strokeColor],
  );

  // Available stroke widths
  const strokeWidths = [1, 3, 5, 8, 12];

  const canvasHeight = screenHeight - insets.top - insets.bottom - 140; // Account for toolbar

  // Simple path bounds calculation (simplified)
  const getPathBounds = (pathString) => {
    const coords = pathString.match(/\d+\.?\d*/g) || [];
    const numbers = coords.map(Number);

    if (numbers.length < 2) return { centerX: 0, centerY: 0 };

    let minX = numbers[0],
      maxX = numbers[0];
    let minY = numbers[1],
      maxY = numbers[1];

    for (let i = 2; i < numbers.length; i += 2) {
      minX = Math.min(minX, numbers[i]);
      maxX = Math.max(maxX, numbers[i]);
      if (i + 1 < numbers.length) {
        minY = Math.min(minY, numbers[i + 1]);
        maxY = Math.max(maxY, numbers[i + 1]);
      }
    }

    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  };

  // Save current drawing state
  const saveDrawing = useCallback(async () => {
    try {
      const drawingData = {
        paths,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9),
      };

      const existingDrawings = await AsyncStorage.getItem("drawings");
      const drawings = existingDrawings ? JSON.parse(existingDrawings) : [];
      drawings.push(drawingData);

      await AsyncStorage.setItem("drawings", JSON.stringify(drawings));
      Alert.alert("Success", "Drawing saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save drawing");
      console.error("Save error:", error);
    }
  }, [paths]);

  // Handle pan gesture for drawing
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      setIsDrawing(true);

      // Start new path
      const startX = event.x;
      const startY = event.y;
      currentPath.current = `M${startX},${startY}`;

      currentStroke.current = {
        color: strokeColor,
        width: strokeWidth,
        tool: currentTool,
      };
    })
    .onUpdate((event) => {
      if (currentTool === "eraser") return;

      // Add line to current path
      const x = event.x;
      const y = event.y;
      currentPath.current += ` L${x},${y}`;

      // Update paths in real-time for smooth drawing
      setPaths((prev) => {
        const newPaths = [...prev];
        const currentPathData = {
          path: currentPath.current,
          color: currentStroke.current.color,
          width: currentStroke.current.width,
          tool: currentStroke.current.tool,
        };

        if (newPaths.length > 0 && newPaths[newPaths.length - 1].isTemp) {
          newPaths[newPaths.length - 1] = { ...currentPathData, isTemp: true };
        } else {
          newPaths.push({ ...currentPathData, isTemp: true });
        }

        return newPaths;
      });
    })
    .onEnd(() => {
      setIsDrawing(false);

      if (currentPath.current && currentTool !== "eraser") {
        // Finalize the path
        setPaths((prev) => {
          // Save current state for undo
          setUndoStack((prevUndo) => [
            ...prevUndo,
            prev.filter((p) => !p.isTemp),
          ]);

          const newPaths = prev.filter((p) => !p.isTemp);
          newPaths.push({
            path: currentPath.current,
            color: currentStroke.current.color,
            width: currentStroke.current.width,
            tool: currentStroke.current.tool,
            id: Date.now() + Math.random(),
          });
          return newPaths;
        });
      }

      currentPath.current = "";
    });

  // Handle eraser gesture
  const eraserGesture = Gesture.Pan()
    .enabled(currentTool === "eraser")
    .onUpdate((event) => {
      const eraserRadius = strokeWidth * 3;

      setPaths((prev) => {
        return prev.filter((pathData) => {
          // Simple collision detection - check if eraser point intersects with path
          // This is a simplified version - a more complex implementation would
          // parse the SVG path and do proper geometric intersection
          const pathBounds = getPathBounds(pathData.path);
          const distance = Math.sqrt(
            Math.pow(event.x - pathBounds.centerX, 2) +
              Math.pow(event.y - pathBounds.centerY, 2),
          );

          return distance > eraserRadius;
        });
      });
    });

  // Combine gestures
  const combinedGesture = Gesture.Race(panGesture, eraserGesture);

  // Undo function
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setPaths(previousState);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  // Clear canvas
  const handleClear = () => {
    Alert.alert(
      "Clear Canvas",
      "Are you sure you want to clear the entire drawing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setUndoStack((prev) => [...prev, paths]);
            setPaths([]);
          },
        },
      ],
    );
  };

  // Tool selection
  const ToolButton = ({ tool, icon: Icon, isActive, onPress }) => (
    <TouchableOpacity
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isActive ? colors.primary : colors.surfaceElevated,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 4,
      }}
      onPress={onPress}
    >
      <Icon
        size={20}
        color={isActive ? "#FFFFFF" : colors.iconSecondary}
        strokeWidth={1.5}
      />
    </TouchableOpacity>
  );

  // Color picker
  const ColorButton = ({ color, isActive, onPress }) => (
    <TouchableOpacity
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: color,
        borderWidth: isActive ? 3 : 1,
        borderColor: isActive ? colors.primary : colors.border,
        marginHorizontal: 2,
      }}
      onPress={onPress}
    />
  );

  // Stroke width selector
  const StrokeButton = ({ width, isActive, onPress }) => (
    <TouchableOpacity
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isActive ? colors.primary : colors.surfaceElevated,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 2,
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: width * 2,
          height: width * 2,
          borderRadius: width,
          backgroundColor: isActive ? "#FFFFFF" : colors.iconSecondary,
        }}
      />
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
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
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontSize: 28,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Draw
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
                onPress={handleUndo}
                disabled={undoStack.length === 0}
              >
                <Undo
                  size={18}
                  color={
                    undoStack.length > 0
                      ? colors.iconSecondary
                      : colors.textTertiary
                  }
                  strokeWidth={1.5}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={saveDrawing}
              >
                <Save size={18} color="#FFFFFF" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Canvas */}
        <View style={{ flex: 1, backgroundColor: colors.canvasBackground }}>
          <GestureDetector gesture={combinedGesture}>
            <Canvas
              style={{
                width: screenWidth,
                height: canvasHeight,
                backgroundColor: colors.canvasBackground,
              }}
            >
              <Fill color={colors.canvasBackground} />
              <Group>
                {paths.map((pathData, index) => (
                  <Path
                    key={pathData.id || index}
                    path={pathData.path}
                    color={pathData.color}
                    style="stroke"
                    strokeWidth={pathData.width}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                ))}
              </Group>
            </Canvas>
          </GestureDetector>
        </View>

        {/* Bottom Toolbar */}
        <View
          style={{
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Tools */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ToolButton
                tool="pen"
                icon={PenTool}
                isActive={currentTool === "pen"}
                onPress={() => setCurrentTool("pen")}
              />
              <ToolButton
                tool="eraser"
                icon={Eraser}
                isActive={currentTool === "eraser"}
                onPress={() => setCurrentTool("eraser")}
              />
            </View>

            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: colors.error,
              }}
              onPress={handleClear}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Colors */}
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Colors
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {availableColors.map((color, index) => (
                <ColorButton
                  key={index}
                  color={color}
                  isActive={strokeColor === color}
                  onPress={() => setStrokeColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Stroke Width */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Brush Size
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {strokeWidths.map((width) => (
                <StrokeButton
                  key={width}
                  width={width}
                  isActive={strokeWidth === width}
                  onPress={() => setStrokeWidth(width)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}
