// Supabase Configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// App Configuration
export const APP_NAME = "Get Bananas";
export const APP_VERSION = "1.0.0";

// Theme Colors
export const COLORS = {
  light: {
    primary: "#007AFF",
    secondary: "#5856D6",
    background: "#FFFFFF",
    surface: "#F2F2F7",
    text: "#000000",
    textSecondary: "#6D6D70",
    border: "#C7C7CC",
    error: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
  },
  dark: {
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    background: "#000000",
    surface: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "#98989D",
    border: "#38383A",
    error: "#FF453A",
    success: "#30D158",
    warning: "#FF9F0A",
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Typography
export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: "bold" as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: "bold" as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "normal" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: "normal" as const,
    lineHeight: 18,
  },
};

// Default Categories
export const DEFAULT_CATEGORIES = [
  { name: "Fruits & Vegetables", color: "#34C759", icon: "🥕" },
  { name: "Dairy & Eggs", color: "#FFCC02", icon: "🥛" },
  { name: "Meat & Seafood", color: "#FF3B30", icon: "🥩" },
  { name: "Bakery", color: "#FF9500", icon: "🍞" },
  { name: "Pantry", color: "#8E8E93", icon: "🥫" },
  { name: "Frozen", color: "#00C7BE", icon: "🧊" },
  { name: "Beverages", color: "#007AFF", icon: "🥤" },
  { name: "Snacks", color: "#5856D6", icon: "🍿" },
  { name: "Health & Beauty", color: "#AF52DE", icon: "🧴" },
  { name: "Household", color: "#A2845E", icon: "🧽" },
];

// Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: "user_preferences",
  THEME: "theme",
  ONBOARDING_COMPLETED: "onboarding_completed",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  LISTS: "shopping_lists",
  ITEMS: "shopping_items",
  CATEGORIES: "categories",
  USERS: "users",
} as const;
