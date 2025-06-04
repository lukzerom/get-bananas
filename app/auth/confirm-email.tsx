import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/contexts/AuthContext";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants";

export default function ConfirmEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resendConfirmationEmail, loading } = useAuth();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert(
        "Error",
        "Email address not found. Please try signing up again."
      );
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      const { error } = await resendConfirmationEmail(email);

      if (error) {
        Alert.alert(
          "Resend Failed",
          error.message ||
            "Failed to resend confirmation email. Please try again."
        );
      } else {
        setResendSuccess(true);
        Alert.alert(
          "Email Sent! 📧",
          "We've sent another confirmation email to your inbox. Please check your email (including spam folder)."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An unexpected error occurred while resending the email."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📧</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a confirmation link to:
          </Text>
          <Text style={styles.email}>{email || "your email address"}</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>What's next?</Text>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>
              Open your email app and look for an email from us
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>
              Click the confirmation link in the email
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepText}>
              Your app will open and you'll be signed in automatically
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackToLogin}
          >
            <Text style={styles.primaryButtonText}>Back to Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (isResending || loading) && styles.disabledButton,
            ]}
            onPress={handleResendEmail}
            disabled={isResending || loading}
          >
            {isResending ? (
              <View style={styles.resendingContainer}>
                <ActivityIndicator size="small" color={COLORS.light.primary} />
                <Text style={styles.secondaryButtonText}>Sending...</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.secondaryButtonText,
                  resendSuccess && styles.successText,
                ]}
              >
                {resendSuccess ? "Email sent! ✓" : "Didn't receive the email?"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.help}>
          <Text style={styles.helpText}>
            💡 Check your spam folder if you don't see the email
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  icon: {
    fontSize: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl * 2,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.light.text,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  email: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.primary,
    textAlign: "center",
    fontWeight: "600",
  },
  instructions: {
    width: "100%",
    marginBottom: SPACING.xl * 2,
  },
  instructionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.light.text,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  stepNumber: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.primary,
    fontWeight: "bold",
    width: 24,
  },
  stepText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.text,
    flex: 1,
    lineHeight: 22,
  },
  actions: {
    width: "100%",
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.background,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.primary,
    textDecorationLine: "underline",
  },
  help: {
    paddingHorizontal: SPACING.md,
  },
  helpText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.light.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  resendingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  successText: {
    color: COLORS.light.success,
  },
});
