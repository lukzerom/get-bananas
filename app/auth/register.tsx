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
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "../../src/contexts/AuthContext";
import { PublicRoute } from "../../src/guards/AuthGuard";
import { FormInput } from "../../src/components/ui/FormInput";
import { registerSchema, RegisterFormData } from "../../src/utils/validation";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants";

function RegisterScreenContent() {
  const { signUp, loading } = useAuth();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await signUp(data.email, data.password, data.fullName);

      if (result.error) {
        Alert.alert(
          "Sign Up Error",
          result.error.message || "Failed to create account"
        );
      } else if (result.needsEmailVerification) {
        // Navigate to email confirmation screen
        router.push({
          pathname: "/auth/confirm-email",
          params: { email: data.email },
        });
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const isFormDisabled = isSubmitting || loading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Join Get Bananas! 🍌</Text>
              <Text style={styles.subtitle}>
                Create your account to start managing shopping lists
              </Text>
            </View>

            <View style={styles.form}>
              <FormInput
                control={control}
                name="fullName"
                label="Full Name"
                error={errors.fullName?.message}
                isRequired
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoComplete="name"
              />

              <FormInput
                control={control}
                name="email"
                label="Email"
                error={errors.email?.message}
                isRequired
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />

              <FormInput
                control={control}
                name="password"
                label="Password"
                error={errors.password?.message}
                isRequired
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="password-new"
              />

              <FormInput
                control={control}
                name="confirmPassword"
                label="Confirm Password"
                error={errors.confirmPassword?.message}
                isRequired
                placeholder="Confirm your password"
                secureTextEntry
                autoComplete="password-new"
              />

              <TouchableOpacity
                style={[
                  styles.signUpButton,
                  isFormDisabled && styles.disabledButton,
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={isFormDisabled}
              >
                {isSubmitting || loading ? (
                  <ActivityIndicator
                    color={COLORS.light.background}
                    size="small"
                  />
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity disabled={isSubmitting || loading}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function RegisterScreen() {
  return (
    <PublicRoute>
      <RegisterScreenContent />
    </PublicRoute>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: "center",
    paddingVertical: SPACING.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl * 2,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.light.text,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
  },
  form: {
    marginBottom: SPACING.xl,
  },
  signUpButton: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  disabledButton: {
    backgroundColor: COLORS.light.textSecondary,
  },
  signUpButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.background,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
  },
  linkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.primary,
    fontWeight: "600",
  },
});
