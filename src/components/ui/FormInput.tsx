import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

interface FormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  error?: string;
  isRequired?: boolean;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  isRequired = false,
  style,
  ...textInputProps
}: FormInputProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={styles.required}> *</Text>}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, error && styles.errorInput, style]}
            value={value || ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={COLORS.light.textSecondary}
            {...textInputProps}
          />
        )}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.text,
    marginBottom: SPACING.sm,
    fontWeight: "600",
  },
  required: {
    color: COLORS.light.error,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.light.text,
    backgroundColor: COLORS.light.background,
  },
  errorInput: {
    borderColor: COLORS.light.error,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.error,
    marginTop: SPACING.xs,
  },
});
