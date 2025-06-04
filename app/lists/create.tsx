import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useShoppingLists } from "../../src/contexts/ShoppingListsContext";
import { FormInput } from "../../src/components/ui/FormInput";
import {
  createListSchema,
  CreateListFormData,
} from "../../src/utils/validation";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants";

export default function CreateListScreen() {
  const { createList } = useShoppingLists();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateListFormData>({
    resolver: yupResolver(createListSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateListFormData) => {
    try {
      await createList({
        name: data.name,
        description: data.description || undefined,
        shared_with: [],
        is_completed: false,
        created_by: "", // This will be set by the context
      });

      Alert.alert("Success", "Shopping list created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Create list error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to create shopping list. Please check your internet connection and try again."
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const isFormDisabled = isSubmitting;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create List</Text>
          <TouchableOpacity
            style={[styles.saveButton, isFormDisabled && styles.disabledButton]}
            onPress={handleSubmit(onSubmit)}
            disabled={isFormDisabled}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.light.background} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.form}>
            <FormInput
              control={control}
              name="name"
              label="List Name"
              error={errors.name?.message}
              isRequired
              placeholder="e.g., Weekly Groceries, Party Shopping"
              autoFocus
              maxLength={100}
            />

            <FormInput
              control={control}
              name="description"
              label="Description (Optional)"
              error={errors.description?.message}
              placeholder="Add a description for your shopping list..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              style={styles.textArea}
            />
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>💡 Tips</Text>
            <Text style={styles.tipText}>
              • You can share this list with others after creating it
            </Text>
            <Text style={styles.tipText}>
              • Use descriptive names to easily identify your lists
            </Text>
            <Text style={styles.tipText}>
              • Add items to your list from the list detail screen
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  keyboardView: {
    flex: 1,
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
  },
  cancelButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: COLORS.light.textSecondary,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.background,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  textArea: {
    height: 100,
    paddingTop: SPACING.md,
  },
  tips: {
    backgroundColor: COLORS.light.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  tipsTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    marginBottom: SPACING.md,
  },
  tipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
});
