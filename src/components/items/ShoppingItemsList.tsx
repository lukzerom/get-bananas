import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ShoppingItem } from "../../types";
import { useShoppingItems } from "../../contexts/ShoppingItemsContext";
import { EmptyListVoiceAnimation } from "../voice/EmptyListVoiceAnimation";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  DEFAULT_CATEGORIES,
} from "../../constants";

// Category colors for backgrounds
const CATEGORY_COLORS: { [key: string]: string } = {
  "Fruits & Vegetables": "#34C75915", // Light green
  "Dairy & Eggs": "#FFCC0215", // Light yellow
  "Meat & Seafood": "#FF3B3015", // Light red
  Bakery: "#FF950015", // Light orange
  Pantry: "#8E8E9315", // Light gray
  Frozen: "#00C7BE15", // Light teal
  Beverages: "#007AFF15", // Light blue
  Snacks: "#5856D615", // Light purple
  "Health & Beauty": "#AF52DE15", // Light violet
  Household: "#A2845E15", // Light brown
  "Pet Food": "#FF6B3515", // Light orange-red
  "Baby & Kids": "#FF9FF315", // Light pink
  "Breakfast & Cereal": "#F7DC6F15", // Light yellow-orange
  "Condiments & Sauces": "#DC763315", // Light brown-orange
  "Deli & Prepared Foods": "#85C1E915", // Light blue
  "International Foods": "#BB8FCE15", // Light purple-pink
};

interface ShoppingItemsListProps {
  listId: string;
  onAddItem?: () => void;
  // Voice animation props
  isListening?: boolean;
  isProcessing?: boolean;
  voiceStatus?: "idle" | "listening" | "processing" | "error" | "connecting";
}

export const ShoppingItemsList: React.FC<ShoppingItemsListProps> = ({
  listId,
  onAddItem,
  isListening = false,
  isProcessing = false,
  voiceStatus = "idle",
}) => {
  const { items, loading, toggleItemCompletion, deleteItem } =
    useShoppingItems();

  // Sort and group items by category, then by completion status
  const sortedItems = useMemo(() => {
    const categorizedItems = [...items].sort((a, b) => {
      // First sort by completion status (incomplete items first)
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }

      // Then sort by category
      const categoryA = a.category || "Other";
      const categoryB = b.category || "Other";

      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }

      // Finally sort by name within the same category
      return a.name.localeCompare(b.name);
    });

    return categorizedItems;
  }, [items]);

  const getCategoryColor = (category?: string) => {
    if (!category) return COLORS.light.surface;
    return CATEGORY_COLORS[category] || COLORS.light.surface;
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return "📦";
    const categoryConfig = DEFAULT_CATEGORIES.find(
      (cat) => cat.name === category
    );
    return categoryConfig?.icon || "📦";
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await toggleItemCompletion(itemId);
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleDeleteItem = async (item: ShoppingItem) => {
    Alert.alert("Usuń produkt", `Czy na pewno chcesz usunąć "${item.name}"?`, [
      {
        text: "Anuluj",
        style: "cancel",
      },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem(item.id);
          } catch (error) {
            console.error("Error deleting item:", error);
            Alert.alert(
              "Błąd",
              "Nie udało się usunąć produktu. Spróbuj ponownie."
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ShoppingItem;
    index: number;
  }) => {
    const previousItem = index > 0 ? sortedItems[index - 1] : null;
    const showCategoryHeader =
      !previousItem ||
      (previousItem.category || "Other") !== (item.category || "Other") ||
      previousItem.is_completed !== item.is_completed;

    return (
      <View>
        {/* Category Header */}
        {showCategoryHeader && (
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryHeaderText}>
              {getCategoryIcon(item.category)} {item.category || "Other"}
            </Text>
            {item.is_completed && (
              <Text style={styles.completedIndicator}>✓ Completed</Text>
            )}
          </View>
        )}

        {/* Item */}
        <View
          style={[
            styles.itemContainer,
            item.is_completed && styles.itemCompleted,
            { backgroundColor: getCategoryColor(item.category) },
          ]}
        >
          <TouchableOpacity
            style={styles.itemLeft}
            onPress={() => handleToggleItem(item.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                item.is_completed && styles.checkboxCompleted,
              ]}
            >
              {item.is_completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemName,
                  item.is_completed && styles.itemNameCompleted,
                ]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              {item.description && (
                <Text
                  style={[
                    styles.itemDescription,
                    item.is_completed && styles.itemDescriptionCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              )}
              <View style={styles.itemMeta}>
                <Text style={styles.itemQuantity}>
                  {item.quantity}
                  {item.unit && ` ${item.unit}`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    // Show voice animation if listening/processing, otherwise show normal empty state
    if (isListening || isProcessing || voiceStatus !== "idle") {
      return (
        <EmptyListVoiceAnimation
          isListening={isListening}
          isProcessing={isProcessing}
          status={voiceStatus}
        />
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>🍌</Text>
        <Text style={styles.emptyStateTitle}>Lista jest pusta</Text>
        <Text style={styles.emptyStateDescription}>
          Użyj przycisku mikrofonu aby dodać produkty głosowo lub kliknij
          przycisk +
        </Text>
        {onAddItem && (
          <TouchableOpacity
            style={styles.addFirstItemButton}
            onPress={onAddItem}
          >
            <Text style={styles.addFirstItemButtonText}>+ Dodaj produkt</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    const completedCount = items.filter((item) => item.is_completed).length;
    const totalCount = items.length;

    if (totalCount === 0) return null;

    const progressPercentage =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSubtitle}>
            {totalCount} {totalCount === 1 ? "item" : "items"} •{" "}
            {progressPercentage}% complete
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressText}>{progressPercentage}%</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.light.primary} />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.emptyListContent,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.light.surface,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.primary,
    fontWeight: "600",
    fontSize: 11,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  categoryHeaderText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.text,
    fontWeight: "600",
  },
  completedIndicator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.primary,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  emptyListContent: {
    flex: 1,
  },
  itemContainer: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.light.border + "50",
  },
  itemCompleted: {
    opacity: 0.6,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    marginRight: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  checkmark: {
    color: COLORS.light.background,
    fontSize: 14,
    fontWeight: "bold",
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  itemNameCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.light.textSecondary,
  },
  itemDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemDescriptionCompleted: {
    textDecorationLine: "line-through",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  itemQuantity: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptyStateDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  addFirstItemButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  addFirstItemButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.background,
    fontWeight: "600",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light.error,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
  deleteButtonText: {
    color: COLORS.light.background,
    fontSize: 16,
  },
});
