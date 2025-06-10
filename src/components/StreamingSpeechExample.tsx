import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import {
  streamingSpeechService,
  DetectedProduct,
  TranscriptSegment,
} from "../services/streamingSpeechService";
import StreamingTranscriptDisplay from "./StreamingTranscriptDisplay";

const StreamingSpeechExample: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<string>("idle");
  const [transcriptSegments, setTranscriptSegments] = useState<
    TranscriptSegment[]
  >([]);
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>(
    []
  );
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    // Set up callbacks for the streaming service
    streamingSpeechService.setCallbacks({
      onProductDetected: (product: DetectedProduct) => {
        console.log("🎯 Product detected in UI:", product);
        setDetectedProducts((prev) => [product, ...prev.slice(0, 4)]); // Keep last 5

        // Show a brief alert for demo purposes
        Alert.alert(
          `${product.action === "add" ? "✅ Added" : "❌ Removed"}`,
          `${product.name} (${product.quantity}${
            product.unit ? " " + product.unit : ""
          })`,
          [],
          { cancelable: true }
        );
      },

      onTranscriptSegment: (segment: TranscriptSegment) => {
        console.log("📝 Transcript segment updated:", segment);
        setTranscriptSegments((prev) =>
          prev.map((s) => (s.id === segment.id ? segment : s))
        );
      },

      onTranscriptUpdate: (segments: TranscriptSegment[]) => {
        console.log("📝 All transcript segments updated:", segments.length);
        setTranscriptSegments(segments);
      },

      onStatusChange: (newStatus) => {
        console.log("🔄 Status changed:", newStatus);
        setStatus(newStatus);
        setIsListening(newStatus === "listening");
      },

      onQueueUpdate: (length) => {
        console.log("📋 Queue length:", length);
        setQueueLength(length);
      },

      onError: (error) => {
        console.error("❌ Streaming error:", error);
        Alert.alert("Error", error);
        setIsListening(false);
        setStatus("error");
      },
    });

    return () => {
      // Cleanup on unmount
      if (streamingSpeechService.isCurrentlyListening) {
        streamingSpeechService.stopListening();
      }
    };
  }, []);

  const handleToggleListening = async () => {
    try {
      if (isListening) {
        await streamingSpeechService.stopListening();
      } else {
        await streamingSpeechService.startListening();
      }
    } catch (error) {
      console.error("Error toggling listening:", error);
      Alert.alert(
        "Error",
        `Failed to ${isListening ? "stop" : "start"} listening`
      );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "listening":
        return "#22c55e"; // Green
      case "processing":
        return "#8b5cf6"; // Purple
      case "error":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "listening":
        return "🎙️ Listening...";
      case "processing":
        return "🔄 Processing...";
      case "error":
        return "❌ Error";
      default:
        return "💤 Idle";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗣️ Streaming Speech Demo</Text>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor() },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Queue Status */}
      {queueLength > 0 && (
        <View style={styles.queueStatus}>
          <Text style={styles.queueText}>
            📋 Processing queue: {queueLength} items
          </Text>
        </View>
      )}

      {/* Transcript Display */}
      <StreamingTranscriptDisplay segments={transcriptSegments} />

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.button,
            isListening ? styles.stopButton : styles.startButton,
          ]}
          onPress={handleToggleListening}
          disabled={status === "error"}
        >
          <Text style={styles.buttonText}>
            {isListening ? "⏹️ Stop Listening" : "🎙️ Start Listening"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Products */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>🛒 Recent Products</Text>
        {detectedProducts.length === 0 ? (
          <Text style={styles.emptyText}>No products detected yet...</Text>
        ) : (
          <View style={styles.productsList}>
            {detectedProducts.map((product) => (
              <View key={product.id} style={styles.productItem}>
                <Text style={styles.productAction}>
                  {product.action === "add" ? "✅" : "❌"}
                </Text>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDetails}>
                    {product.quantity}
                    {product.unit ? ` ${product.unit}` : ""} •
                    {Math.round(product.confidence * 100)}% confidence
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>💡 Instructions</Text>
        <Text style={styles.instructionText}>
          • Tap "Start Listening" to begin{"\n"}• Speak naturally in Polish
          about shopping{"\n"}• Watch transcripts fade in/out with colors{"\n"}•
          Products are processed asynchronously{"\n"}• Green = high confidence,
          Yellow = medium, Red = low
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  queueStatus: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 16,
    borderRadius: 8,
  },
  queueText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  controls: {
    padding: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#22c55e",
  },
  stopButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  productsSection: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  emptyText: {
    color: "#6b7280",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  productsList: {
    gap: 8,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#22c55e",
  },
  productAction: {
    fontSize: 20,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  productDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  instructions: {
    backgroundColor: "#fef3c7",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
});

export default StreamingSpeechExample;
