import React, { useRef, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { COLORS, SPACING } from "../../constants";
import {
  useBackendGeminiVoice,
  UseBackendGeminiVoiceConfig,
} from "../../hooks";
import {
  BackendProduct,
  ShoppingListState,
} from "../../services/backendGeminiService";

interface FloatingVoiceButtonProps {
  backendUrl: string;
  userId: string;
  onShoppingListUpdated: (shoppingList: ShoppingListState) => void;
  onProductDetected?: (product: BackendProduct) => void;
  onTranscriptReceived?: (transcript: string, isUser: boolean) => void;
  onError?: (error: string) => void;
  onStatusChange?: (
    status: "idle" | "listening" | "processing" | "error" | "connecting"
  ) => void;
  debugMode?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export const FloatingVoiceButton: React.FC<FloatingVoiceButtonProps> = (
  props
) => {
  const { position = "bottom-right" } = props;

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Internal state to track if we're actually listening (source of truth)
  const [isActuallyListening, setIsActuallyListening] = useState(false);

  // Use the custom hook for all business logic
  const voiceHook = useBackendGeminiVoice(props);

  // Handle button press - simplified toggle logic
  const handlePress = async () => {
    console.log("🎤 Button pressed. Current state:", isActuallyListening);

    if (isActuallyListening) {
      // Stop listening
      console.log("🛑 Stopping listening...");
      await voiceHook.stopListening();
      setIsActuallyListening(false);
    } else {
      // Start listening
      console.log("▶️ Starting listening...");
      setIsActuallyListening(true);
      await voiceHook.startListening();
    }
  };

  // Animation effects - only when actually listening
  useEffect(() => {
    if (isActuallyListening) {
      // Pulse animation when listening
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Wave animation for listening
      const wave = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      pulse.start();
      wave.start();

      return () => {
        pulse.stop();
        wave.stop();
        // Reset to base values when stopping
        pulseAnim.setValue(1);
        waveAnim.setValue(0);
      };
    } else {
      // Immediately reset animations when not listening
      pulseAnim.stopAnimation(() => {
        pulseAnim.setValue(1);
      });
      waveAnim.stopAnimation(() => {
        waveAnim.setValue(0);
      });
    }
  }, [isActuallyListening]);

  // Get button style based on listening state
  const getButtonStyle = () => {
    if (isActuallyListening) {
      return { backgroundColor: COLORS.light.primary };
    }
    if (!voiceHook.isConnected) {
      return { backgroundColor: COLORS.light.textSecondary };
    }
    return { backgroundColor: COLORS.light.primary + "CC" }; // Semi-transparent when idle
  };

  // Get position styles
  const getPositionStyle = () => {
    const baseStyle = {
      position: "absolute" as const,
      zIndex: 1000,
    };

    switch (position) {
      case "bottom-right":
        return { ...baseStyle, bottom: SPACING.xl, right: SPACING.md };
      case "bottom-left":
        return { ...baseStyle, bottom: SPACING.xl, left: SPACING.md };
      case "top-right":
        return { ...baseStyle, top: SPACING.xl, right: SPACING.md };
      case "top-left":
        return { ...baseStyle, top: SPACING.xl, left: SPACING.md };
      default:
        return { ...baseStyle, bottom: SPACING.xl, right: SPACING.md };
    }
  };

  const waveScale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3],
  });

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={[styles.container, getPositionStyle()]}>
      {/* Listening wave effect - only when actually listening */}
      {isActuallyListening && (
        <Animated.View
          style={[
            styles.wave,
            {
              transform: [{ scale: waveScale }],
              opacity: waveOpacity,
            },
          ]}
        />
      )}

      {/* Main floating button */}
      <Animated.View
        style={[
          styles.floatingButton,
          getButtonStyle(),
          {
            transform: isActuallyListening
              ? [{ scale: pulseAnim }]
              : [{ scale: 1 }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.buttonTouchable}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <FontAwesome
            name={isActuallyListening ? "microphone" : "microphone-slash"}
            size={24}
            color={COLORS.light.background}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Debug info - only in debug mode */}
      {props.debugMode && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            {isActuallyListening ? "Listening" : "Idle"}
          </Text>
          <Text style={styles.debugText}>
            Connected: {voiceHook.isConnected ? "Yes" : "No"}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.light.primary + "30",
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  debugInfo: {
    position: "absolute",
    top: -50,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 8,
    borderRadius: 4,
    minWidth: 100,
  },
  debugText: {
    color: "white",
    fontSize: 10,
    textAlign: "center",
  },
});
