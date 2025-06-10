import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

interface EmptyListVoiceAnimationProps {
  isListening: boolean;
  isProcessing: boolean;
  status: "idle" | "listening" | "processing" | "error" | "connecting";
}

export const EmptyListVoiceAnimation: React.FC<
  EmptyListVoiceAnimationProps
> = ({ isListening, isProcessing, status }) => {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  // Only show when actively listening or processing
  const shouldShow = isListening || isProcessing;

  useEffect(() => {
    if (shouldShow) {
      // Fade in the animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulse animation for microphone icon
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

      pulse.start();

      // Sound wave animations - only when listening
      if (isListening) {
        const createWaveAnimation = (
          animValue: Animated.Value,
          delay: number
        ) =>
          Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(animValue, {
                toValue: 1,
                duration: 600,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: 600,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          );

        createWaveAnimation(wave1, 0).start();
        createWaveAnimation(wave2, 200).start();
        createWaveAnimation(wave3, 400).start();
      }

      return () => {
        pulse.stop();
        wave1.stopAnimation();
        wave2.stopAnimation();
        wave3.stopAnimation();
      };
    } else {
      // Fade out the animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Reset animations
      pulseAnim.setValue(1);
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
    }
  }, [shouldShow, isListening]);

  const wave1Scale = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.3],
  });

  const wave2Scale = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.5],
  });

  const wave3Scale = wave3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.7],
  });

  const waveOpacity = wave1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.6, 0.2],
  });

  const getMessage = () => {
    if (isProcessing) {
      return {
        title: "Przetwarzam...",
        subtitle: "AI analizuje Twoje polecenie",
        icon: "robot",
      };
    }
    if (isListening) {
      return {
        title: "Słucham...",
        subtitle: "Powiedz co chcesz dodać do listy",
        icon: "microphone",
      };
    }
    return null;
  };

  const message = getMessage();

  // Don't render anything if not listening or processing
  if (!shouldShow || !message) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Sound waves - only when listening */}
      {isListening && (
        <View style={styles.wavesContainer}>
          <Animated.View
            style={[
              styles.wave,
              styles.wave1,
              {
                transform: [{ scale: wave1Scale }],
                opacity: waveOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              styles.wave2,
              {
                transform: [{ scale: wave2Scale }],
                opacity: waveOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              styles.wave3,
              {
                transform: [{ scale: wave3Scale }],
                opacity: waveOpacity,
              },
            ]}
          />
        </View>
      )}

      {/* Main content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <FontAwesome
            name={message.icon === "robot" ? "android" : "microphone"}
            size={48}
            color={
              isListening ? COLORS.light.primary : COLORS.light.textSecondary
            }
          />
        </Animated.View>

        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.subtitle}>{message.subtitle}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    position: "relative",
  },
  wavesContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  wave: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.light.primary + "30",
  },
  wave1: {
    width: 80,
    height: 80,
  },
  wave2: {
    width: 120,
    height: 120,
  },
  wave3: {
    width: 160,
    height: 160,
  },
  content: {
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 50,
    backgroundColor: COLORS.light.surface,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    marginBottom: SPACING.sm,
    textAlign: "center",
    fontWeight: "600",
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
