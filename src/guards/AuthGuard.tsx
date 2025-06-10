import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { COLORS } from "../constants";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean; // true = require auth, false = require no auth
}

export const AuthGuard = ({
  children,
  fallback,
  requireAuth = true,
}: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    if (requireAuth && !user) {
      // Protected route, but no user - redirect to login
      router.replace("/auth/login");
      return;
    }

    if (!requireAuth && user) {
      // Auth route, but user is logged in - redirect to home
      router.replace("/");
      return;
    }
  }, [user, loading, requireAuth, router]);

  // Show loading while determining auth state
  if (loading) {
    return fallback || <DefaultLoadingComponent />;
  }

  // For protected routes: don't render if no user (will redirect)
  if (requireAuth && !user) {
    return null;
  }

  // For auth routes: don't render if user exists (will redirect)
  if (!requireAuth && user) {
    return null;
  }

  // Render children if auth state is correct
  return <>{children}</>;
};

// Convenience wrapper for protected routes
export const ProtectedRoute = ({
  children,
  ...props
}: Omit<AuthGuardProps, "requireAuth">) => {
  return (
    <AuthGuard requireAuth={true} {...props}>
      {children}
    </AuthGuard>
  );
};

// Convenience wrapper for auth routes (login/register)
export const PublicRoute = ({
  children,
  ...props
}: Omit<AuthGuardProps, "requireAuth">) => {
  return (
    <AuthGuard requireAuth={false} {...props}>
      {children}
    </AuthGuard>
  );
};

const DefaultLoadingComponent = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.light.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light.background,
  },
});
