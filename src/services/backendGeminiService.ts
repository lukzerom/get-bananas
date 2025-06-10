// Backend Gemini Service for React Native
// Connects to the Python backend instead of directly to Gemini Live API

import { Alert } from "react-native";

// Types for backend communication
export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit?: string;
  category: string;
}

export interface ShoppingListState {
  items: ShoppingListItem[];
  conversation_context?: string;
  last_update: number;
  confidence: number;
}

// Keep old interface for compatibility during transition
export interface BackendProduct {
  id: string;
  name: string;
  action: "add" | "remove";
  quantity: number;
  unit?: string;
  category: string;
  confidence: number;
  timestamp: number;
}

export interface BackendGeminiCallbacks {
  onShoppingListUpdated?: (shoppingList: ShoppingListState) => void;
  onProductDetected?: (product: BackendProduct) => void; // Keep for compatibility
  onTranscriptReceived?: (transcript: string, isUser: boolean) => void;
  onError?: (error: string) => void;
  onStatusChange?: (
    status: "idle" | "listening" | "processing" | "error" | "connecting"
  ) => void;
  onConnectionStatus?: (isConnected: boolean) => void;
}

export interface BackendGeminiConfig {
  backendUrl: string;
  userId: string;
  debugMode?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

// WebSocket message types
interface BackendMessage {
  type: string;
  [key: string]: any;
}

// Audio data structure
interface AudioDataEvent {
  data?: ArrayBuffer | Uint8Array | string;
  [key: string]: any;
}

export class BackendGeminiService {
  private callbacks: BackendGeminiCallbacks = {};
  private config: BackendGeminiConfig;
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private debugSteps: string[] = [];
  private audioChunksSent = 0;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;

  constructor(config: BackendGeminiConfig) {
    this.config = {
      debugMode: true,
      reconnectAttempts: 5,
      reconnectDelay: 2000,
      ...config,
    };

    if (!this.config.backendUrl) {
      throw new Error("Backend URL is required");
    }

    if (!this.config.userId) {
      throw new Error("User ID is required");
    }

    this.debugLog("✅ Backend Gemini service initialized");
  }

  private debugLog(message: string, data?: any) {
    if (this.config.debugMode) {
      console.log(`[BACKEND GEMINI] ${message}`, data || "");
      this.debugSteps.push(`${new Date().toLocaleTimeString()}: ${message}`);

      // Keep only last 20 debug steps
      if (this.debugSteps.length > 20) {
        this.debugSteps = this.debugSteps.slice(-20);
      }
    }
  }

  public setCallbacks(callbacks: BackendGeminiCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.debugLog("📋 Callbacks set", Object.keys(callbacks));
  }

  public async startSession(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.debugLog("🔌 Connecting to backend...");

        // Convert HTTP(S) URL to WebSocket URL
        const wsUrl = this.config.backendUrl
          .replace(/^https?:\/\//, "")
          .replace(/^/, "ws://"); // Use ws:// for local development, wss:// for production
        const fullWsUrl = `${wsUrl}/ws/${this.config.userId}`;

        this.debugLog("🌐 WebSocket URL:", fullWsUrl);
        this.websocket = new WebSocket(fullWsUrl);

        this.websocket.onopen = () => {
          this.debugLog("✅ WebSocket connected successfully");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.callbacks?.onConnectionStatus?.(true);
          this.callbacks?.onStatusChange?.("connecting");

          // Send session start message
          this.sendMessage({
            type: "start_session",
          });

          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleBackendMessage(event);
        };

        this.websocket.onerror = (error) => {
          this.debugLog("❌ WebSocket error:", error);
          this.isConnected = false;
          this.callbacks?.onError?.(`WebSocket error: ${error}`);

          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        };

        this.websocket.onclose = (event) => {
          this.debugLog("🔌 WebSocket closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          this.isConnected = false;
          this.callbacks?.onConnectionStatus?.(false);
          this.callbacks?.onStatusChange?.("idle");

          // Attempt reconnection if not manually closed
          if (
            event.code !== 1000 &&
            this.reconnectAttempts < (this.config.reconnectAttempts || 5)
          ) {
            this.attemptReconnection();
          }
        };
      } catch (error) {
        this.debugLog("❌ Failed to create WebSocket connection:", error);
        reject(error);
      }
    });
  }

  private attemptReconnection() {
    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay || 2000;

    this.debugLog(
      `🔄 Attempting reconnection ${this.reconnectAttempts}/${this.config.reconnectAttempts} in ${delay}ms`
    );
    this.callbacks?.onStatusChange?.("connecting");

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.startSession();
        this.debugLog("✅ Reconnection successful");
      } catch (error) {
        this.debugLog("❌ Reconnection failed:", error);

        if (this.reconnectAttempts >= (this.config.reconnectAttempts || 5)) {
          this.callbacks?.onError?.("Failed to reconnect to backend service");
          this.callbacks?.onStatusChange?.("error");
        }
      }
    }, delay);
  }

  private sendMessage(message: BackendMessage) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.debugLog("⚠️ Cannot send message - WebSocket not ready");
      return;
    }

    try {
      this.websocket.send(JSON.stringify(message));
      // Only log important message types, not audio chunks
      if (message.type !== "audio_chunk") {
        this.debugLog("📤 Message sent:", message.type);
      }
    } catch (error) {
      this.debugLog("❌ Failed to send message:", error);
      this.callbacks?.onError?.(`Failed to send message: ${error}`);
    }
  }

  private handleBackendMessage(event: MessageEvent) {
    try {
      const data: BackendMessage = JSON.parse(event.data);
      this.debugLog("📥 Received message:", data.type);

      switch (data.type) {
        case "session_started":
          this.debugLog("🎯 Session started successfully");
          this.isConnected = true;
          this.callbacks?.onConnectionStatus?.(true);
          this.callbacks?.onStatusChange?.("listening");
          break;

        case "shopping_list_updated":
          this.debugLog(
            "🛒 [CONVERSATION] Shopping list updated:",
            data.shopping_list
          );
          if (data.shopping_list) {
            this.callbacks?.onShoppingListUpdated?.(data.shopping_list);
          }
          break;

        case "product_detected":
          this.debugLog("🛍️ Product detected:", data.product);
          if (data.product) {
            this.callbacks?.onProductDetected?.(data.product);
          }
          break;

        case "transcript":
          this.debugLog("📝 Transcript received:", data.text);
          if (data.text) {
            this.callbacks?.onTranscriptReceived?.(
              data.text,
              data.isUser || false
            );
          }
          break;

        case "status":
          this.debugLog("📊 Status update:", data.status);
          if (data.status) {
            this.callbacks?.onStatusChange?.(data.status);
          }
          break;

        case "error":
          this.debugLog("❌ Backend error:", data.message);
          this.callbacks?.onError?.(data.message || "Backend error");
          break;

        case "audio_received":
          // this.debugLog("📡 Audio chunk confirmation received:", {
          //   timestamp: data.timestamp,
          //   chunkSize: data.chunk_size,
          // }); // Disabled for clean logs
          break;

        case "pong":
          this.debugLog("🏓 Pong received");
          break;

        default:
          this.debugLog("❓ Unknown message type:", data.type);
      }
    } catch (error) {
      this.debugLog("❌ Error parsing backend message:", error);
    }
  }

  // Send audio data to backend
  public handleAudioStreamData(audioData: AudioDataEvent): void {
    if (!this.isConnected || !this.websocket) {
      this.debugLog("❌ Cannot send audio - not connected to backend");
      return;
    }

    this.audioChunksSent++;

    try {
      // Get the actual audio data
      const actualAudioData = audioData.data;

      if (!actualAudioData) {
        this.debugLog("❌ No audio data found");
        return;
      }

      // Convert audio data to Base64
      let base64Audio: string;

      if (typeof actualAudioData === "string") {
        base64Audio = actualAudioData;
      } else if (actualAudioData instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(actualAudioData);
        base64Audio = this.arrayBufferToBase64(uint8Array);
      } else if (actualAudioData instanceof Uint8Array) {
        base64Audio = this.arrayBufferToBase64(actualAudioData);
      } else {
        this.debugLog(
          "❌ Unsupported audio data type:",
          typeof actualAudioData
        );
        return;
      }

      // Send audio chunk to backend
      this.sendMessage({
        type: "audio_chunk",
        audio_data: base64Audio,
      });

      this.debugLog(
        `🎙️ Audio chunk #${this.audioChunksSent} sent (${base64Audio.length} chars)`
      );
    } catch (error) {
      this.debugLog(
        `❌ Failed to send audio chunk #${this.audioChunksSent}:`,
        error
      );
    }
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Send ping to keep connection alive
  public ping(): void {
    this.sendMessage({ type: "ping" });
  }

  public sendTestAudio(text: string = "Dodaj mleko do listy zakupów"): void {
    this.debugLog("🧪 Sending test audio message:", text);
    this.sendMessage({
      type: "test_audio",
      text: text,
    });
  }

  public sendAudioChunk(audioData: string, timestamp?: number): void {
    this.debugLog("🎙️ Sending audio chunk:", {
      dataLength: audioData.length,
      timestamp: timestamp || Date.now(),
    });
    this.sendMessage({
      type: "audio_chunk",
      audio_data: audioData,
      timestamp: timestamp || Date.now(),
    });
  }

  public async stopSession(): Promise<void> {
    try {
      this.debugLog("🛑 Stopping session...");

      // Clear reconnection timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Send stop message
      if (this.isConnected) {
        this.sendMessage({ type: "stop_session" });
      }

      // Close WebSocket
      if (this.websocket) {
        this.websocket.close(1000, "Session stopped by user");
        this.websocket = null;
      }

      this.isConnected = false;
      this.callbacks?.onConnectionStatus?.(false);
      this.callbacks?.onStatusChange?.("idle");

      this.debugLog("🛑 Session stopped successfully");
    } catch (error) {
      this.debugLog("❌ Error stopping session:", error);
      this.callbacks?.onError?.("Failed to stop session");
    }
  }

  // Utility methods
  public isSessionActive(): boolean {
    return this.isConnected && this.websocket?.readyState === WebSocket.OPEN;
  }

  public getStatus():
    | "idle"
    | "listening"
    | "processing"
    | "error"
    | "connecting" {
    if (!this.isConnected) return "idle";
    return "listening";
  }

  public getDebugInfo(): string {
    return `Backend Gemini Service Debug Info:
Connected: ${this.isConnected}
WebSocket: ${this.websocket ? "Active" : "None"}
Backend URL: ${this.config.backendUrl}
User ID: ${this.config.userId}
Audio chunks sent: ${this.audioChunksSent}
Reconnect attempts: ${this.reconnectAttempts}
Steps: ${this.debugSteps.join(", ")}
Callbacks: ${Object.keys(this.callbacks).join(", ")}`;
  }

  public destroy() {
    this.debugLog("💀 Destroying service");
    this.stopSession();
  }
}

// Export singleton pattern (optional)
let backendGeminiService: BackendGeminiService | null = null;

export const createBackendGeminiService = (
  config: BackendGeminiConfig
): BackendGeminiService => {
  if (!backendGeminiService) {
    backendGeminiService = new BackendGeminiService(config);
  }
  return backendGeminiService;
};

export const getBackendGeminiService = (): BackendGeminiService | null => {
  return backendGeminiService;
};
