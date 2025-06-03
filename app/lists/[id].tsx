import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShoppingLists } from "../../src/contexts/ShoppingListsContext";
import { ProtectedRoute } from "../../src/components/auth";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants";

function ListDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lists, loading } = useShoppingLists();

  // Find the list by ID
  const list = lists.find((l) => l.id === id);

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={styles.loadingText}>Loading list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>List Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>List Not Found</Text>
          <Text style={styles.errorDescription}>
            The shopping list you're looking for doesn't exist or has been
            deleted.
          </Text>
          <TouchableOpacity onPress={handleGoBack} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
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
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{list.name}</Text>
          {list.description && (
            <Text style={styles.listDescription}>{list.description}</Text>
          )}
          <Text style={styles.listMeta}>
            Created: {new Date(list.created_at).toLocaleDateString()}
          </Text>
          {list.shared_with.length > 0 && (
            <Text style={styles.listMeta}>
              Shared with: {list.shared_with.join(", ")}
            </Text>
          )}
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>No items yet</Text>
            <Text style={styles.emptyItemsDescription}>
              Start adding items to your shopping list
            </Text>
            <TouchableOpacity style={styles.addItemButton}>
              <Text style={styles.addItemButtonText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  menuButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  menuButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.textSecondary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  listInfo: {
    backgroundColor: COLORS.light.surface,
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
  listMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemsSection: {
    flex: 1,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    marginBottom: SPACING.md,
  },
  emptyItems: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyItemsText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptyItemsDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  addItemButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  addItemButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.background,
    fontWeight: "600",
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
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  errorDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  errorButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  errorButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.background,
    fontWeight: "600",
  },
});
