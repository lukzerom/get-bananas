import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { TranscriptSegment } from "../services/streamingSpeechService";

interface StreamingTranscriptDisplayProps {
  segments: TranscriptSegment[];
}

interface AnimatedSegmentProps {
  segment: TranscriptSegment;
}

const AnimatedSegment: React.FC<AnimatedSegmentProps> = ({ segment }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  useEffect(() => {
    switch (segment.fadeState) {
      case "fading-in":
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case "visible":
        // Already visible, maybe add a subtle pulse if processing
        if (segment.isProcessing) {
          Animated.loop(
            Animated.sequence([
              Animated.timing(fadeAnim, {
                toValue: 0.7,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }
        break;

      case "fading-out":
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case "hidden":
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.95);
        break;
    }
  }, [segment.fadeState, segment.isProcessing]);

  if (segment.fadeState === "hidden") {
    return null;
  }

  const getSegmentStyle = () => {
    let additionalStyle = {};

    if (segment.isProcessing) {
      additionalStyle = styles.processingSegment;
    } else if (segment.confidence > 0.9) {
      additionalStyle = styles.highConfidenceSegment;
    } else if (segment.confidence > 0.8) {
      additionalStyle = styles.mediumConfidenceSegment;
    } else {
      additionalStyle = styles.lowConfidenceSegment;
    }

    return [styles.transcriptSegment, additionalStyle];
  };

  return (
    <Animated.View
      style={[
        styles.segmentContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={getSegmentStyle()}>
        <Text style={styles.transcriptText}>{segment.text}</Text>
        {segment.isProcessing && (
          <View style={styles.processingIndicator}>
            <Text style={styles.processingText}>🔄</Text>
          </View>
        )}
        <View style={styles.confidenceIndicator}>
          <Text style={styles.confidenceText}>
            {Math.round(segment.confidence * 100)}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const StreamingTranscriptDisplay: React.FC<StreamingTranscriptDisplayProps> = ({
  segments,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🎙️ Live Transcript</Text>
      </View>
      <View style={styles.segmentsContainer}>
        {segments
          .filter((segment) => segment.fadeState !== "hidden")
          .reverse() // Show newest first
          .map((segment) => (
            <AnimatedSegment key={segment.id} segment={segment} />
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    minHeight: 120,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  segmentsContainer: {
    flex: 1,
  },
  segmentContainer: {
    marginBottom: 8,
  },
  transcriptSegment: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 2,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  highConfidenceSegment: {
    backgroundColor: "rgba(34, 197, 94, 0.2)", // Bright green
    borderColor: "#22c55e",
  },
  mediumConfidenceSegment: {
    backgroundColor: "rgba(251, 191, 36, 0.2)", // Bright yellow
    borderColor: "#fbbf24",
  },
  lowConfidenceSegment: {
    backgroundColor: "rgba(239, 68, 68, 0.2)", // Bright red
    borderColor: "#ef4444",
  },
  processingSegment: {
    backgroundColor: "rgba(139, 92, 246, 0.3)", // Bright purple
    borderColor: "#8b5cf6",
  },
  transcriptText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  processingIndicator: {
    marginRight: 8,
  },
  processingText: {
    fontSize: 12,
  },
  confidenceIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confidenceText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default StreamingTranscriptDisplay;
