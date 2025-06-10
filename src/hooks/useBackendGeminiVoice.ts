import { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "react-native";
import {
  useAudioRecorder,
  RecordingConfig,
  ExpoAudioStreamModule,
  AudioDataEvent,
} from "@siteed/expo-audio-studio";
import {
  BackendGeminiService,
  BackendProduct,
  BackendGeminiConfig,
  ShoppingListState,
  ShoppingListItem,
  createBackendGeminiService,
} from "../services/backendGeminiService";

export type VoiceStatus =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "connecting";

export interface UseBackendGeminiVoiceConfig {
  backendUrl: string;
  userId: string;
  onShoppingListUpdated: (shoppingList: ShoppingListState) => void;
  onTranscriptReceived?: (transcript: string, isUser: boolean) => void;
  onError?: (error: string) => void;
  onStatusChange?: (
    status: "idle" | "listening" | "processing" | "error" | "connecting"
  ) => void;
  debugMode?: boolean;
}

export interface UseBackendGeminiVoiceReturn {
  isListening: boolean;
  isConnected: boolean;
  status: VoiceStatus;
  connectionAttempts: number;
  audioChunksSent: number;
  isRecording: boolean;
  currentShoppingList: ShoppingListState;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  toggleListening: () => void;
  sendTestAudio: () => void;
}

// Pure function to convert audio buffer to base64
const arrayBufferToBase64 = (buffer: Uint8Array): string => {
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
};

// Pure function to get error message based on attempts
const getErrorMessage = (connectionAttempts: number): string => {
  return connectionAttempts > 2
    ? "Nie można połączyć się z serwerem. Spróbuj ponownie później."
    : "Błąd podczas uruchamiania rozpoznawania mowy.";
};

// Pure function to show error alert
const showErrorAlert = (message: string) => {
  Alert.alert("Błąd", message, [{ text: "OK" }]);
};

// Pure function to show connection error alert
const showConnectionErrorAlert = () => {
  Alert.alert(
    "Błąd połączenia",
    "Nie można połączyć się z usługą rozpoznawania mowy. Sprawdź połączenie internetowe.",
    [{ text: "OK" }]
  );
};

export const useBackendGeminiVoice = (
  config: UseBackendGeminiVoiceConfig
): UseBackendGeminiVoiceReturn => {
  const {
    backendUrl,
    userId,
    debugMode = false,
    onShoppingListUpdated,
    onTranscriptReceived,
    onError,
    onStatusChange,
  } = config;

  // State
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [audioChunksSent, setAudioChunksSent] = useState(0);

  // Shopping list state (simplified - just current state from conversation)
  const [currentShoppingList, setCurrentShoppingList] =
    useState<ShoppingListState>({
      items: [],
      last_update: Date.now(),
      confidence: 0,
    });

  // Refs
  const serviceRef = useRef<BackendGeminiService | null>(null);
  const isInitializedRef = useRef(false);
  const recordingRef = useRef<any>(null);
  const recordingIntervalRef = useRef<any>(null);
  const lastSyncCheckRef = useRef<number>(0);

  // Audio recording hook
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();

  // Pure debug logging function
  const debugLog = useCallback(
    (message: string, data?: any) => {
      if (debugMode) {
        console.log(`[BACKEND GEMINI VOICE] ${message}`, data || "");
      }
    },
    [debugMode]
  );

  // Handle shopping list updates (NEW - replaces complex queue management)
  const handleShoppingListUpdated = useCallback(
    (shoppingList: ShoppingListState) => {
      console.log(
        "🛒 [CONVERSATION] Shopping list received from backend:",
        shoppingList
      );
      setCurrentShoppingList(shoppingList);
      onShoppingListUpdated(shoppingList);
    },
    [onShoppingListUpdated]
  );

  // Handle transcript received
  const handleTranscriptReceived = useCallback(
    (transcript: string, isUser: boolean) => {
      debugLog(`📝 Transcript: ${transcript} (user: ${isUser})`);
      onTranscriptReceived?.(transcript, isUser);
    },
    [onTranscriptReceived, debugLog]
  );

  // Handle errors
  const handleError = useCallback(
    (error: string) => {
      debugLog("❌ Error:", error);
      setStatus("error");
      onError?.(error);
    },
    [onError, debugLog]
  );

  // Handle status changes
  const handleStatusChange = useCallback(
    (newStatus: VoiceStatus) => {
      console.log("📊 [CONVERSATION] Status change:", newStatus);
      setStatus(newStatus);
      setIsListening(newStatus === "listening");
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // Handle connection status changes
  const handleConnectionStatusChange = useCallback(
    (connected: boolean) => {
      // debugLog("🌐 Connection status:", connected); // Disabled for clean logs
      setIsConnected(connected);
      if (connected) {
        setConnectionAttempts(0);
      }
    },
    [debugLog]
  );

  // Handle audio streaming
  const handleAudioStream = useCallback(
    async (audioEvent: AudioDataEvent) => {
      // Check both hook state and service state for connection
      const serviceActive = serviceRef.current?.isSessionActive() || false;

      if (!serviceRef.current || (!isConnected && !serviceActive)) {
        debugLog("⚠️ Cannot send audio - not connected to backend", {
          hasService: !!serviceRef.current,
          isConnected,
          serviceIsActive: serviceActive,
        });
        return;
      }

      // If service is active but hook state isn't updated, sync it
      if (serviceActive && !isConnected) {
        debugLog(
          "🔄 Syncing connection status - service is active but hook state is false"
        );
        handleConnectionStatusChange(true);
      }

      setAudioChunksSent((prev) => prev + 1);

      // Audio chunk logging disabled for performance
      // if (audioChunksSent % 50 === 0) {
      //   debugLog(`🎙️ Sending audio chunk #${audioChunksSent + 1} to backend`);
      // }

      try {
        const audioData =
          (audioEvent as any).eventData || (audioEvent as any).data;
        if (audioData) {
          let base64Audio: string;

          if (typeof audioData === "string") {
            base64Audio = audioData;
          } else if (audioData instanceof ArrayBuffer) {
            const uint8Array = new Uint8Array(audioData);
            base64Audio = arrayBufferToBase64(uint8Array);
          } else if (audioData instanceof Uint8Array) {
            base64Audio = arrayBufferToBase64(audioData);
          } else {
            debugLog("❌ Unsupported audio data type:", typeof audioData);
            return;
          }

          serviceRef.current.sendAudioChunk(base64Audio, Date.now());
          // Audio success logging disabled for performance
          // if (audioChunksSent % 50 === 0) {
          //   debugLog(`✅ Audio chunk #${audioChunksSent + 1} sent to backend`);
          // }
        }
      } catch (error) {
        debugLog("❌ Failed to send audio chunk:", error);
      }
    },
    [isConnected, audioChunksSent, debugLog, status, stopRecording]
  );

  // Initialize service
  useEffect(() => {
    if (!isInitializedRef.current && backendUrl && userId) {
      debugLog("🔧 Initializing Backend Gemini Service");

      const serviceConfig: BackendGeminiConfig = {
        backendUrl,
        userId,
        debugMode,
        reconnectAttempts: 3,
        reconnectDelay: 2000,
      };

      try {
        serviceRef.current = createBackendGeminiService(serviceConfig);

        // Set initial callbacks and start session
        serviceRef.current.setCallbacks({
          onShoppingListUpdated: handleShoppingListUpdated,
          onProductDetected: (product) => {
            debugLog("🛍️ Product detected via backend:", product);
          },
          onTranscriptReceived: handleTranscriptReceived,
          onError: handleError,
          onStatusChange: handleStatusChange,
          onConnectionStatus: handleConnectionStatusChange,
        });

        // Initialize connection but don't start listening automatically
        // The user will need to click the voice button to start listening
        debugLog(
          "✅ Service initialized - waiting for user to start listening"
        );

        isInitializedRef.current = true;
        debugLog("✅ Backend Gemini Service initialized");
      } catch (error) {
        debugLog("❌ Failed to initialize service:", error);
        handleError(`Initialization error: ${error}`);
      }
    }

    // Periodic connection status check to keep in sync (reduced frequency and logging)
    // Only sync status, don't auto-reconnect unless user has initiated a session
    const interval = setInterval(() => {
      if (serviceRef.current && isInitializedRef.current) {
        const serviceActive = serviceRef.current.isSessionActive();
        if (serviceActive !== isConnected) {
          // Only log if it's a significant change, not constant flipping
          if (Math.abs(Date.now() - (lastSyncCheckRef.current || 0)) > 10000) {
            debugLog(
              `🔄 Connection status out of sync. Syncing status only...`
            );
            lastSyncCheckRef.current = Date.now();
          }
          handleConnectionStatusChange(serviceActive);
        }
      }
    }, 10000); // Check every 10 seconds (much less frequent)

    return () => {
      clearInterval(interval);
      if (serviceRef.current) {
        debugLog("💀 Cleaning up service");
        serviceRef.current.destroy();
        serviceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [backendUrl, userId, debugMode]);

  // Separate effect to update callbacks without reinitializing service
  useEffect(() => {
    if (serviceRef.current && isInitializedRef.current) {
      // debugLog("🔄 Updating service callbacks"); // Disabled for clean logs
      serviceRef.current.setCallbacks({
        onShoppingListUpdated: (shoppingList) => {
          console.log(
            "🛒 [CONVERSATION] Shopping list update received:",
            shoppingList
          );
          handleShoppingListUpdated(shoppingList);
        },
        onProductDetected: (product) => {
          // Keep for compatibility with old backend messages
          debugLog("🛍️ Product detected via backend (legacy):", product);
        },
        onTranscriptReceived: (transcript, isUser) => {
          debugLog(
            `📝 Transcript from backend (${isUser ? "User" : "AI"}):`,
            transcript
          );
          handleTranscriptReceived(transcript, isUser);
        },
        onError: (error) => {
          debugLog("❌ Backend error:", error);
          handleStatusChange("error");
          handleError(error);
        },
        onStatusChange: (newStatus) => {
          debugLog("📊 Status change:", newStatus);
          handleStatusChange(newStatus);
        },
        onConnectionStatus: (connected) => {
          debugLog("🌐 Connection status:", connected);
          handleConnectionStatusChange(connected);
        },
      });
    }
  }, [
    handleShoppingListUpdated,
    handleTranscriptReceived,
    handleError,
    handleStatusChange,
    handleConnectionStatusChange,
    debugLog,
  ]);

  // Start listening function - with inactivity timeout
  const startListening = useCallback(async () => {
    if (!serviceRef.current) {
      debugLog("❌ Service not initialized");
      return;
    }

    console.log("🎙️ [CONVERSATION] Starting listening session");

    // Start the session if not already active (user-initiated)
    if (!serviceRef.current.isSessionActive()) {
      try {
        await serviceRef.current.startSession();
        debugLog("✅ Session started on user request");
      } catch (error) {
        debugLog("❌ Failed to start session on user request:", error);
        handleError(`Failed to start session: ${error}`);
        return;
      }
    }

    setStatus("listening");
    setAudioChunksSent(0);

    // Note: We DON'T clear any local state - let Gemini manage the conversation

    try {
      const recordingConfig: RecordingConfig = {
        sampleRate: 16000,
        channels: 1,
        encoding: "pcm_16bit",
        interval: 250,
        enableProcessing: true,
        keepAwake: true,
        onAudioStream: handleAudioStream,
      };

      await startRecording(recordingConfig);
      debugLog("🎙️ Recording started using expo-audio-studio");
    } catch (error) {
      debugLog("❌ Failed to start recording:", error);
      setStatus("error");
      handleError("Failed to start audio recording");
    }
  }, [debugLog, handleError, startRecording, handleAudioStream, stopRecording]);

  // Stop listening
  const stopListening = useCallback(async () => {
    console.log("🛑 [CONVERSATION] Stopping listening session");

    try {
      await stopRecording();
      setStatus("idle");
    } catch (error) {
      debugLog("❌ Error stopping recording:", error);
    }
  }, [debugLog, stopRecording]);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (isRecording) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isRecording, startListening, stopListening]);

  // Send test audio
  const sendTestAudio = useCallback(() => {
    if (serviceRef.current && isConnected) {
      debugLog("🧪 Sending test audio");
      serviceRef.current.sendTestAudio("Dodaj mleko");
    }
  }, [isConnected, debugLog]);

  return {
    isListening,
    isConnected,
    status,
    connectionAttempts,
    audioChunksSent,
    isRecording,
    currentShoppingList,
    startListening,
    stopListening,
    toggleListening,
    sendTestAudio,
  };
};
