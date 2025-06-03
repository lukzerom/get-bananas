import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthState, User } from "../types";
import { authService } from "../services/supabase";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: any; needsEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error: any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Helper function to map Supabase user to our User type
  const mapSupabaseUser = (supabaseUser: any): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.email?.split("@")[0] ||
      "User",
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at,
  });

  // Get initial session on mount
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await authService.getCurrentSession();

        if (session?.user) {
          setAuthState({
            user: mapSupabaseUser(session.user),
            session,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: "Failed to get initial session",
        });
      }
    };

    getInitialSession();
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);

      if (session?.user) {
        // User is signed in
        setAuthState({
          user: mapSupabaseUser(session.user),
          session,
          loading: false,
          error: null,
        });
      } else {
        // User is signed out
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await authService.signIn(email, password);

      if (error) {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { error };
      }

      return { error: null };
    } catch (error) {
      const errorMessage = "Failed to sign in";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: { message: errorMessage } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await authService.signUp(
        email,
        password,
        fullName
      );

      // Always set loading to false after signup attempt
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error ? error.message : null,
      }));

      if (error) {
        return { error };
      }

      // Success case - user needs to verify email
      return { error: null, needsEmailVerification: true };
    } catch (error) {
      const errorMessage = "Failed to sign up";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      console.log("signOut");
      await authService.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to sign out",
      }));
    }
  };

  const refreshUser = async () => {
    try {
      const {
        data: { user },
      } = await authService.getCurrentUser();
      setAuthState((prev) => ({
        ...prev,
        user: user as User | null,
      }));
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await authService.resendConfirmationEmail(email);

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error ? error.message : null,
      }));

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      const errorMessage = "Failed to resend confirmation email";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: { message: errorMessage } };
    }
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    resendConfirmationEmail,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
