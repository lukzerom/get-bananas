import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/contexts/AuthContext";
import { useShoppingLists } from "../src/contexts/ShoppingListsContext";
import { ProtectedRoute } from "../src/guards/AuthGuard";
import { ShoppingList } from "../src/types";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants";

function HomeScreenContent() {
  const { user, signOut } = useAuth();
  const { lists, loading, error } = useShoppingLists();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleListPress = (list: ShoppingList) => {
    router.push(`/lists/${list.id}` as any);
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const completedItems = 0; // This would come from items context
    const totalItems = 0; // This would come from items context

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleListPress(item)}
      >
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{item.name}</Text>
          {item.description && (
            <Text style={styles.listDescription}>{item.description}</Text>
          )}
          <Text style={styles.listStats}>
            {completedItems}/{totalItems} items completed
          </Text>
        </View>
        <View style={styles.listActions}>
          <Text style={styles.progressText}>
            {totalItems > 0
              ? Math.round((completedItems / totalItems) * 100)
              : 0}
            %
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Shopping Lists</Text>
      <Text style={styles.emptyDescription}>
        Create your first shopping list to get started!
      </Text>
      <Link href="/lists/create" asChild>
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>Create List</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || "User"}! 👋</Text>
          <Text style={styles.subtitle}>Ready to go shopping?</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Lists</Text>
          <Link href="/lists/create" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            lists.length === 0 ? styles.emptyListContainer : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <ProtectedRoute>
      <HomeScreenContent />
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
    alignItems: "flex-start",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.light.surface,
  },
  greeting: {
    ...TYPOGRAPHY.h2,
    color: COLORS.light.text,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    marginTop: SPACING.xs,
  },
  signOutButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.light.error,
    borderRadius: 8,
  },
  signOutText: {
    color: COLORS.light.background,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
  },
  addButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.light.primary,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.light.background,
    fontWeight: "600",
  },
  listItem: {
    flexDirection: "row",
    backgroundColor: COLORS.light.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    marginBottom: SPACING.xs,
  },
  listDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.xs,
  },
  listStats: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
  },
  listActions: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: SPACING.md,
  },
  progressText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.primary,
    fontWeight: "bold",
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.light.text,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptyDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  createButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  createButtonText: {
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
    backgroundColor: COLORS.light.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: 8,
  },
  errorText: {
    color: COLORS.light.background,
    textAlign: "center",
    fontWeight: "600",
  },
});
