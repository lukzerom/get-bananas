import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useShoppingItems } from "../../contexts/ShoppingItemsContext";
import { createItemSchema, CreateItemFormData } from "../../utils/validation";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  DEFAULT_CATEGORIES,
} from "../../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  categorizationService,
  ProductCategorizationResult,
} from "../../services/categorizationService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
  isShared?: boolean;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  listId,
  listName,
  isShared = false,
}) => {
  const { addItem } = useShoppingItems();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateItemFormData>({
    resolver: yupResolver(createItemSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      quantity: 1,
      unit: "",
      category: "",
    },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (visible) {
      // Show modal animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide modal animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        reset();
        setSelectedCategory("");
        setIsProcessing(false);
      });
    }
  }, [visible]);

  const onSubmit = async (data: CreateItemFormData) => {
    try {
      setIsProcessing(true);

      await addItem({
        list_id: listId,
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        quantity: data.quantity,
        unit: data.unit?.trim() || undefined,
        category: selectedCategory || data.category?.trim() || undefined,
        is_completed: false,
        added_by: "", // This will be set by the context
      });

      Alert.alert("Success! 🎉", `"${data.name}" has been added to your list`, [
        {
          text: "Add Another",
          onPress: () => {
            reset();
            setSelectedCategory("");
          },
        },
        {
          text: "Done",
          style: "default",
          onPress: onClose,
        },
      ]);
    } catch (error) {
      console.error("Add item error:", error);
      Alert.alert(
        "Oops! 😅",
        error instanceof Error
          ? error.message
          : "Failed to add item. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setValue("category", category);
  };

  const handleAIProcess = async () => {
    if (!watchedName.trim()) return;

    setIsProcessing(true);

    try {
      const result: ProductCategorizationResult =
        await categorizationService.categorizeProduct(watchedName.trim());

      // Set the category
      setSelectedCategory(result.category);
      setValue("category", result.category);

      // Optionally update the product name to the common name
      const shouldUpdateName =
        result.commonName !== watchedName.trim() &&
        result.success &&
        result.confidence > 0.8;

      if (shouldUpdateName) {
        setValue("name", result.commonName);
      }

      // Show different messages based on success and confidence
      const confidencePercent = Math.round(result.confidence * 100);
      const icon = "🔍";
      const title = "Smart Suggestion";

      let message = `I think "${watchedName}" belongs in "${result.category}" (${confidencePercent}% confident).\n\n${result.reasoning}`;

      if (shouldUpdateName) {
        message += `\n\nI also suggest using "${result.commonName}" as the product name.`;
      }

      // Remove the fallback message since we're always using rule-based logic now

      const buttons = shouldUpdateName
        ? [
            {
              text: "Use both suggestions",
              style: "default" as const,
            },
            {
              text: "Category only",
              onPress: () => {
                // Keep original name, just use category
                setValue("name", watchedName.trim());
              },
            },
            {
              text: "Cancel",
              style: "cancel" as const,
              onPress: () => {
                // Reset both
                setSelectedCategory("");
                setValue("category", "");
                setValue("name", watchedName.trim());
              },
            },
          ]
        : [
            {
              text: "Use suggestion",
              style: "default" as const,
            },
            {
              text: "Cancel",
              style: "cancel" as const,
              onPress: () => {
                setSelectedCategory("");
                setValue("category", "");
              },
            },
          ];

      Alert.alert(title + " " + icon, message, buttons);
    } catch (error) {
      console.error("AI processing error:", error);
      Alert.alert(
        "Categorization Error 😅",
        error instanceof Error
          ? `Failed to get category suggestion: ${error.message}`
          : "Something went wrong with categorization. Please try again or select category manually."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCategoryChips = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryLabel}>Category (Optional)</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {DEFAULT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryChip,
              selectedCategory === category.name && styles.categoryChipSelected,
              { borderColor: category.color },
            ]}
            onPress={() => handleCategorySelect(category.name)}
          >
            <Text style={styles.categoryEmoji}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.name &&
                  styles.categoryChipTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.dragHandle} />
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.headerTitle}>Add Item</Text>
              <Text style={styles.headerSubtitle}>
                to "{listName}"
                {isShared && (
                  <Text style={styles.sharedIndicator}> • Shared</Text>
                )}
              </Text>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Main Input */}
              <View style={styles.mainInputContainer}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.mainInput,
                        errors.name && styles.inputError,
                      ]}
                      placeholder="What do you need? (e.g., Milk, Bread, Fantazja)"
                      placeholderTextColor={COLORS.light.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoFocus
                      multiline
                      textAlignVertical="top"
                      maxLength={100}
                      autoCorrect={false}
                      autoCapitalize="sentences"
                      spellCheck={false}
                    />
                  )}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name.message}</Text>
                )}

                {/* AI Processing Button */}
                {watchedName.trim().length > 2 && (
                  <TouchableOpacity
                    style={styles.aiButton}
                    onPress={handleAIProcess}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.light.background}
                      />
                    ) : (
                      <Text style={styles.aiButtonText}>🔍 Smart Suggest</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Categories - Moved before Quantity */}
              {renderCategoryChips()}

              {/* Quantity & Unit */}
              <View style={styles.quantityContainer}>
                <View style={styles.quantityInputContainer}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <Controller
                    control={control}
                    name="quantity"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.quantityInput,
                          errors.quantity && styles.inputError,
                        ]}
                        placeholder="1"
                        placeholderTextColor={COLORS.light.textSecondary}
                        value={value ? value.toString() : ""}
                        onChangeText={(text) => {
                          // Filter out non-numeric characters
                          const numericText = text.replace(/[^0-9]/g, "");

                          if (numericText === "") {
                            // Allow empty for editing, but don't update form
                            return;
                          }

                          const numValue = parseInt(numericText, 10);
                          if (numValue > 0 && numValue <= 999) {
                            onChange(numValue);
                          }
                        }}
                        onBlur={() => {
                          // Ensure we have a valid number on blur
                          if (!value || value < 1) {
                            onChange(1);
                          }
                          onBlur();
                        }}
                        keyboardType="numeric"
                        maxLength={3}
                        autoCorrect={false}
                        selectTextOnFocus={true}
                      />
                    )}
                  />
                </View>

                <View style={styles.unitInputContainer}>
                  <Text style={styles.inputLabel}>Unit (Optional)</Text>
                  <Controller
                    control={control}
                    name="unit"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.unitInput}
                        placeholder="pcs, kg, l..."
                        placeholderTextColor={COLORS.light.textSecondary}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        maxLength={20}
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                    )}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.descriptionContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="Any special notes or brand preferences..."
                      placeholderTextColor={COLORS.light.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      maxLength={200}
                      autoCorrect={false}
                      autoCapitalize="sentences"
                    />
                  )}
                />
              </View>

              {/* Future Features Hint */}
              <View style={styles.futureFeatures}>
                <Text style={styles.futureFeaturesTitle}>🎙️ Coming Soon</Text>
                <Text style={styles.futureFeaturesText}>
                  Voice input and smart product recognition
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, SPACING.xl) },
              ]}
            >
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isSubmitting || isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addButton,
                  (isSubmitting || isProcessing) && styles.addButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting || isProcessing}
              >
                {isSubmitting || isProcessing ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.light.background}
                  />
                ) : (
                  <Text style={styles.addButtonText}>Add Item</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropTouchable: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.light.border,
    borderRadius: 2,
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.light.textSecondary,
    lineHeight: 20,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.light.text,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
  },
  sharedIndicator: {
    color: COLORS.light.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  mainInputContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  mainInput: {
    ...TYPOGRAPHY.h3,
    backgroundColor: COLORS.light.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    minHeight: 80,
    color: COLORS.light.text,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: COLORS.light.error,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  aiButton: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignSelf: "flex-end",
    marginTop: SPACING.sm,
    minWidth: 120,
    alignItems: "center",
  },
  aiButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.background,
    fontWeight: "600",
  },
  quantityContainer: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  quantityInputContainer: {
    flex: 1,
  },
  unitInputContainer: {
    flex: 2,
  },
  inputLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.text,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  quantityInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.light.surface,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.light.text,
    textAlign: "center",
  },
  unitInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.light.surface,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.light.text,
  },
  categoryContainer: {
    marginBottom: SPACING.lg,
  },
  categoryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.text,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  categoryScroll: {
    marginHorizontal: -SPACING.xs,
  },
  categoryScrollContent: {
    paddingHorizontal: SPACING.xs,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.surface,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryChipSelected: {
    backgroundColor: COLORS.light.primary + "20",
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  categoryChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
    fontWeight: "500",
  },
  categoryChipTextSelected: {
    color: COLORS.light.primary,
    fontWeight: "600",
  },
  descriptionContainer: {
    marginBottom: SPACING.lg,
  },
  descriptionInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.light.surface,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.light.text,
    minHeight: 80,
  },
  futureFeatures: {
    backgroundColor: COLORS.light.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: "center",
  },
  futureFeaturesTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  futureFeaturesText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.light.surface,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    fontWeight: "600",
  },
  addButton: {
    flex: 2,
    backgroundColor: COLORS.light.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.background,
    fontWeight: "600",
  },
});
