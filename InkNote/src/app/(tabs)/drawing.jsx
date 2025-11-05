import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Dimensions, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Canvas,
  Path,
  Group,
  Fill,
  Skia,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  PenTool,
  Eraser,
  Undo,
  Redo,
  Save,
} from "lucide-react-native";
import ScreenLayout from "@/components/ScreenLayout";
import { useTheme } from "@/utils/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function DrawingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [currentTool, setCurrentTool] = useState("pen");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState(colors.strokeColor);
  const [paths, setPaths] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentDrawingPath, setCurrentDrawingPath] = useState(null);

  // Refs for tracking current stroke
  const currentPoints = useRef([]);

  // Available colors
  const availableColors = useMemo(
    () => [
      colors.strokeColor,
      "#FF4444",
      "#44FF44",
      "#4444FF",
      "#FFFF44",
      "#FF44FF",
      "#44FFFF",
      "#FF8844",
    ],
    [colors.strokeColor],
  );

  // Available stroke widths
  const strokeWidths = [1, 3, 5, 8, 12];

  const canvasHeight = screenHeight - insets.top - insets.bottom - 140;

  // Helper to create smooth path from points
  const createSmoothPath = useCallback((points) => {
    if (points.length === 0) return null;

    const path = Skia.Path.Make();

    if (points.length === 1) {
      const point = points[0];
      path.addCircle(point.x, point.y, point.width / 2);
      return path;
    }

    path.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path.quadTo(points[i].x, points[i].y, xc, yc);
    }

    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      path.lineTo(lastPoint.x, lastPoint.y);
    }

    return path;
  }, []);

  // Check if point is near path (for eraser)
  const isPointNearPath = (x, y, pathData, eraserRadius) => {
    if (!pathData.points || pathData.points.length === 0) return false;

    for (let point of pathData.points) {
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
      );
      if (distance < eraserRadius) {
        return true;
      }
    }
    return false;
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

  // Drawing gesture handler
  const drawingGesture = Gesture.Pan()
    .onStart((event) => {
      if (currentTool === "pen") {
        const pressure = event.force || 0.5;
        const adjustedWidth = strokeWidth * (0.5 + pressure);

        currentPoints.current = [{
          x: event.x,
          y: event.y,
          width: adjustedWidth,
          pressure,
        }];

        const path = Skia.Path.Make();
        path.addCircle(event.x, event.y, adjustedWidth / 2);

        setCurrentDrawingPath({
          path,
          color: strokeColor,
          width: strokeWidth,
        });
      }
    })
    .onUpdate((event) => {
      if (currentTool === "pen") {
        const pressure = event.force || 0.5;
        const adjustedWidth = strokeWidth * (0.5 + pressure);

        currentPoints.current.push({
          x: event.x,
          y: event.y,
          width: adjustedWidth,
          pressure,
        });

        const path = createSmoothPath(currentPoints.current);

        setCurrentDrawingPath({
          path,
          color: strokeColor,
          width: strokeWidth,
        });
      } else if (currentTool === "eraser") {
        const eraserRadius = strokeWidth * 3;

        setPaths((prev) => {
          const filtered = prev.filter((pathData) => {
            return !isPointNearPath(event.x, event.y, pathData, eraserRadius);
          });

          if (filtered.length !== prev.length) {
            setUndoStack((prevUndo) => [...prevUndo, prev]);
            setRedoStack([]);
          }

          return filtered;
        });
      }
    })
    .onEnd(() => {
      if (currentTool === "pen" && currentPoints.current.length > 0) {
        const pathData = {
          points: [...currentPoints.current],
          color: strokeColor,
          width: strokeWidth,
          tool: currentTool,
          id: Date.now() + Math.random(),
        };

        setPaths((prev) => {
          setUndoStack((prevUndo) => [...prevUndo, prev]);
          setRedoStack([]);
          return [...prev, pathData];
        });

        currentPoints.current = [];
        setCurrentDrawingPath(null);
      }
    });

  // Undo function
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, paths]);
      setPaths(previousState);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  }, [undoStack, paths]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [...prev, paths]);
      setPaths(nextState);
      setRedoStack((prev) => prev.slice(0, -1));
    }
  }, [redoStack, paths]);

  // Clear canvas
  const handleClear = useCallback(() => {
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
            setRedoStack([]);
            setPaths([]);
          },
        },
      ],
    );
  }, [paths]);

  // Tool selection button
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

  // Color picker button
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

  // Stroke width selector button
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
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
                onPress={handleRedo}
                disabled={redoStack.length === 0}
              >
                <Redo
                  size={18}
                  color={
                    redoStack.length > 0
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
          <GestureDetector gesture={drawingGesture}>
            <Canvas
              style={{
                width: screenWidth,
                height: canvasHeight,
                backgroundColor: colors.canvasBackground,
              }}
            >
              <Fill color={colors.canvasBackground} />
              <Group>
                {/* Render saved paths */}
                {paths.map((pathData, index) => {
                  const path = createSmoothPath(pathData.points);
                  if (!path) return null;

                  return (
                    <Path
                      key={pathData.id || index}
                      path={path}
                      color={pathData.color}
                      style="stroke"
                      strokeWidth={pathData.width}
                      strokeCap="round"
                      strokeJoin="round"
                    />
                  );
                })}

                {/* Render current drawing path */}
                {currentDrawingPath && currentDrawingPath.path && (
                  <Path
                    path={currentDrawingPath.path}
                    color={currentDrawingPath.color}
                    style="stroke"
                    strokeWidth={currentDrawingPath.width}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                )}
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
