import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../../src/contexts/AuthContext";
import { useShoppingLists } from "../../src/contexts/ShoppingListsContext";
import { useShoppingItems } from "../../src/contexts/ShoppingItemsContext";
import { ProtectedRoute } from "../../src/guards/AuthGuard";
import { AddItemModal } from "../../src/components/items/AddItemModal";
import { ShoppingItemsList } from "../../src/components/items/ShoppingItemsList";
import { FloatingVoiceButton } from "../../src/components/voice/FloatingVoiceButton";
import { ConversationShoppingListPopup } from "../../src/components/voice/ConversationShoppingListPopup";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants";
import {
  ShoppingListState,
  ShoppingListItem,
} from "../../src/services/backendGeminiService";

function ListDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { lists, loading } = useShoppingLists();
  const { items, refreshItems, addItem, deleteItem, updateItem } =
    useShoppingItems();
  const [showAddModal, setShowAddModal] = useState(false);

  // Voice recognition state - simplified for Gemini only
  const [streamingStatus, setStreamingStatus] = useState<
    "idle" | "listening" | "processing" | "error" | "connecting"
  >("idle");

  // Shopping list state from conversation
  const [conversationShoppingList, setConversationShoppingList] =
    useState<ShoppingListState>({
      items: [],
      last_update: Date.now(),
      confidence: 0,
    });

  // Show conversation popup when we have items from Gemini conversation
  const [showConversationPopup, setShowConversationPopup] = useState(false);

  // Find the list by ID
  const list = lists.find((l) => l.id === id);
  const isShared = list ? list.shared_with.length > 0 : false;

  // Load items when component mounts or list changes
  useEffect(() => {
    if (list?.id) {
      refreshItems(list.id);
    }
  }, [list?.id, refreshItems]);

  // Backend Gemini handlers
  const handleShoppingListUpdated = useCallback(
    (shoppingList: ShoppingListState) => {
      console.log("🛒 Shopping list updated from Gemini:", shoppingList);
      setConversationShoppingList(shoppingList);
      setShowConversationPopup(true);
    },
    []
  );

  const handleBackendTranscriptReceived = useCallback(
    (transcript: string, isUser: boolean) => {
      console.log(`📝 Transcript (${isUser ? "User" : "AI"}):`, transcript);
    },
    []
  );

  const handleBackendError = useCallback((error: string) => {
    console.error("❌ Backend error:", error);
    setStreamingStatus("error");
    Toast.show({
      type: "error",
      text1: "Błąd głosowy",
      text2: error,
      position: "bottom",
    });
  }, []);

  const handleBackendStatusChange = useCallback(
    (status: "idle" | "listening" | "processing" | "error" | "connecting") => {
      console.log("📊 Status change:", status);
      setStreamingStatus(status);
    },
    []
  );

  const clearConversationList = useCallback(() => {
    setConversationShoppingList({
      items: [],
      last_update: Date.now(),
      confidence: 0,
    });
  }, []);

  // Add conversation items to the shopping list
  const addConversationItemsToList = useCallback(async () => {
    if (!list?.id || !user?.id || conversationShoppingList.items.length === 0)
      return;

    try {
      for (const item of conversationShoppingList.items) {
        const newItem = {
          list_id: list.id,
          name: item.name,
          description: `Dodano głosowo przez AI • Kategoria: ${item.category}`,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          is_completed: false,
          added_by: user.id,
        };

        await addItem(newItem);
      }

      Toast.show({
        type: "success",
        text1: "✅ Dodano produkty",
        text2: `${conversationShoppingList.items.length} produktów dodano do listy`,
        position: "bottom",
      });

      setShowConversationPopup(false);
      clearConversationList();
    } catch (error) {
      console.error("Error adding conversation items:", error);
      Toast.show({
        type: "error",
        text1: "Błąd",
        text2: "Nie udało się dodać produktów",
        position: "bottom",
      });
    }
  }, [
    list?.id,
    user?.id,
    addItem,
    conversationShoppingList.items,
    clearConversationList,
  ]);

  const handleGoBack = () => {
    router.back();
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={styles.loadingText}>Loading lists...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Lista nie znaleziona</Text>
          <Text style={styles.errorDescription}>
            Lista o podanym ID nie istnieje lub nie masz do niej dostępu.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← Powrót</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {list.name}
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{list.name}</Text>
          {list.description && (
            <Text style={styles.listDescription}>{list.description}</Text>
          )}
          <View style={styles.listMetaRow}>
            <Text style={styles.listMeta}>
              Created: {new Date(list.created_at).toLocaleDateString()}
            </Text>
            {isShared && (
              <View style={styles.sharedBadge}>
                <Text style={styles.sharedBadgeText}>👥 Shared</Text>
              </View>
            )}
          </View>
          {list.shared_with.length > 0 && (
            <Text style={styles.listMeta}>
              Shared with: {list.shared_with.join(", ")}
            </Text>
          )}
        </View>

        <View style={styles.itemsSection}>
          <ShoppingItemsList
            listId={list.id}
            onAddItem={handleOpenAddModal}
            isListening={streamingStatus === "listening"}
            isProcessing={streamingStatus === "processing"}
            voiceStatus={streamingStatus}
          />
        </View>

        {/* Simplified Floating Voice Button - only Gemini */}
        <FloatingVoiceButton
          backendUrl="http://192.168.55.106:8000"
          userId={user?.id || "test-user"}
          onShoppingListUpdated={handleShoppingListUpdated}
          onTranscriptReceived={handleBackendTranscriptReceived}
          onError={handleBackendError}
          onStatusChange={handleBackendStatusChange}
          debugMode={false}
          position="bottom-right"
        />
      </View>

      <AddItemModal
        visible={showAddModal}
        onClose={handleCloseAddModal}
        listId={list.id}
        listName={list.name}
        isShared={isShared}
      />

      {/* Conversation Shopping List Popup - only from Gemini */}
      <ConversationShoppingListPopup
        visible={showConversationPopup}
        shoppingList={conversationShoppingList}
        onAddToList={addConversationItemsToList}
        onClear={clearConversationList}
        onClose={() => setShowConversationPopup(false)}
      />
    </SafeAreaView>
  );
}

export default function ListDetailScreen() {
  return (
    <ProtectedRoute>
      <ListDetailContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.light.text,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  errorDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
    backgroundColor: COLORS.light.surface,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: SPACING.sm,
  },
  backButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  backButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.primary,
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.light.background,
    fontWeight: "600",
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  listInfo: {
    backgroundColor: COLORS.light.surface,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  listName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.light.text,
    marginBottom: SPACING.sm,
  },
  listDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.sm,
  },
  listMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  listMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.xs,
  },
  sharedBadge: {
    backgroundColor: COLORS.light.primary + "20",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sharedBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.primary,
    fontWeight: "600",
    fontSize: 11,
  },
  itemsSection: {
    flex: 1,
    paddingBottom: SPACING.xl * 2, // Add space for floating button
  },
});
