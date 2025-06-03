import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../constants";

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helper functions
export const authService = {
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: __DEV__
          ? "get-bananas://auth/callback" // Development deep link
          : "get-bananas://auth/callback", // Production deep link (same for now)
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  resendConfirmationEmail: async (email: string) => {
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: __DEV__
          ? "get-bananas://auth/callback"
          : "get-bananas://auth/callback",
      },
    });
    return { data, error };
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  getCurrentSession: () => {
    return supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions
export const databaseService = {
  // Shopping Lists
  getLists: async (userId: string) => {
    try {
      // Simplified query - just get user's own lists for now
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      return { data, error };
    } catch (err) {
      console.error("Exception in getLists:", err);
      return { data: null, error: err };
    }
  },

  createList: async (list: any) => {
    const { data, error } = await supabase
      .from("shopping_lists")
      .insert([list])
      .select()
      .single();
    return { data, error };
  },

  updateList: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("shopping_lists")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  deleteList: async (id: string) => {
    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", id);
    return { error };
  },

  // Shopping Items
  getItems: async (listId: string) => {
    const { data, error } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  createItem: async (item: any) => {
    const { data, error } = await supabase
      .from("shopping_items")
      .insert([item])
      .select()
      .single();
    return { data, error };
  },

  updateItem: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("shopping_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  deleteItem: async (id: string) => {
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", id);
    return { error };
  },

  // Real-time subscriptions
  subscribeToLists: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel("shopping_lists")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_lists",
          // Note: Real-time filters are limited, so we'll filter in the callback
        },
        (payload: any) => {
          // Only process changes for lists the user has access to
          const list = payload.new || payload.old;
          if (
            list &&
            (list.created_by === userId ||
              (list.shared_with && Array.isArray(list.shared_with)))
          ) {
            callback(payload);
          }
        }
      )
      .subscribe();
  },

  subscribeToItems: (listId: string, callback: (payload: any) => void) => {
    return supabase
      .channel("shopping_items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_items",
          filter: `list_id=eq.${listId}`,
        },
        callback
      )
      .subscribe();
  },
};
