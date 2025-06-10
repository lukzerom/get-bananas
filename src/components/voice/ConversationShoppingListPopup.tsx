import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";
import { ShoppingListState } from "../../services/backendGeminiService";

interface ConversationShoppingListPopupProps {
  visible: boolean;
  shoppingList: ShoppingListState;
  onAddToList: () => void;
  onClear: () => void;
  onClose: () => void;
}

export const ConversationShoppingListPopup: React.FC<
  ConversationShoppingListPopupProps
> = ({ visible, shoppingList, onAddToList, onClear, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <View style={styles.header}>
            <Text style={styles.title}>🛒 Lista z rozmowy</Text>
            <Text style={styles.confidence}>
              Pewność: {Math.round(shoppingList.confidence * 100)}%
            </Text>
          </View>

          <ScrollView
            style={styles.itemsList}
            showsVerticalScrollIndicator={true}
          >
            {shoppingList.items.map((item, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} {item.unit || "szt."}
                </Text>
                {item.category && (
                  <Text style={styles.itemCategory}>{item.category}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearButtonText}>🧹 Wyczyść</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addButton} onPress={onAddToList}>
              <Text style={styles.addButtonText}>
                ✅ Dodaj do listy ({shoppingList.items.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  popup: {
    backgroundColor: COLORS.light.background,
    borderRadius: 16,
    padding: SPACING.lg,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    marginBottom: SPACING.md,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.text,
    marginBottom: SPACING.xs,
  },
  confidence: {
    fontSize: 12,
    color: COLORS.light.textSecondary,
  },
  itemsList: {
    maxHeight: 300,
    marginBottom: SPACING.md,
  },
  item: {
    backgroundColor: COLORS.light.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.light.primary,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.light.text,
    marginBottom: SPACING.xs,
  },
  itemDetails: {
    fontSize: 14,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemCategory: {
    fontSize: 12,
    color: COLORS.light.primary,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  clearButton: {
    flex: 1,
    backgroundColor: COLORS.light.error,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  clearButtonText: {
    color: COLORS.light.background,
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    flex: 2,
    backgroundColor: COLORS.light.success,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: COLORS.light.background,
    fontSize: 14,
    fontWeight: "600",
  },
});
