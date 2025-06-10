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
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "../../src/contexts/AuthContext";
import { PublicRoute } from "../../src/guards/AuthGuard";
import { FormInput } from "../../src/components/ui/FormInput";
import { loginSchema, LoginFormData } from "../../src/utils/validation";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants";

function LoginScreenContent() {
  const { signIn, loading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        Alert.alert("Sign In Error", error.message || "Failed to sign in");
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
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back! 🛒</Text>
            <Text style={styles.subtitle}>
              Sign in to access your shopping lists
            </Text>
          </View>

          <View style={styles.form}>
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
              autoComplete="password"
            />

            <TouchableOpacity
              style={[
                styles.signInButton,
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
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity disabled={isSubmitting || loading}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function LoginScreen() {
  return (
    <PublicRoute>
      <LoginScreenContent />
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: "center",
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
  signInButton: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  disabledButton: {
    backgroundColor: COLORS.light.textSecondary,
  },
  signInButtonText: {
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
