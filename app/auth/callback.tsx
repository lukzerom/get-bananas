import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/services/supabase";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants";
import type { EmailOtpType } from "@supabase/supabase-js";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Extract parameters from URL
        const {
          token_hash,
          type,
          access_token,
          refresh_token,
          error,
          error_description,
        } = params;

        // Handle errors first
        if (error || error_description) {
          setStatus("error");
          setMessage((error_description as string) || "Authentication failed");
          setTimeout(() => {
            router.replace("/auth/login");
          }, 3000);
          return;
        }

        // Handle email confirmation with token_hash (modern Supabase flow)
        if (token_hash && type) {
          setMessage("Verifying your email...");

          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: type as EmailOtpType,
            token_hash: token_hash as string,
          });

          if (verifyError) {
            throw verifyError;
          }

          setStatus("success");
          setMessage("Email confirmed successfully! 🎉");

          setTimeout(() => {
            router.replace("/");
          }, 2000);
          return;
        }

        // Handle legacy flow with access_token/refresh_token (fallback)
        if (access_token && refresh_token) {
          setMessage("Setting up your session...");

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (sessionError) {
            throw sessionError;
          }

          if (data.session) {
            setStatus("success");
            setMessage("Welcome back! Redirecting to your dashboard...");

            setTimeout(() => {
              router.replace("/");
            }, 2000);
            return;
          }
        }

        // If we get here, no valid auth data was found
        throw new Error("No valid authentication data found");
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong during authentication"
        );

        setTimeout(() => {
          router.replace("/auth/login");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [params, router]);

  const getIcon = () => {
    switch (status) {
      case "processing":
        return "⏳";
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  const getColor = () => {
    switch (status) {
      case "success":
        return COLORS.light.success || "#10B981";
      case "error":
        return COLORS.light.error || "#EF4444";
      default:
        return COLORS.light.text;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>

        {status === "processing" && (
          <ActivityIndicator
            size="large"
            color={COLORS.light.primary}
            style={styles.loader}
          />
        )}

        <Text style={[styles.message, { color: getColor() }]}>{message}</Text>

        {status !== "processing" && (
          <Text style={styles.subMessage}>
            You will be redirected automatically...
          </Text>
        )}
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  loader: {
    marginBottom: SPACING.lg,
  },
  message: {
    ...TYPOGRAPHY.h2,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  subMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.light.textSecondary,
    textAlign: "center",
  },
});
