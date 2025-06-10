// Supabase Configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// App Configuration
export const APP_NAME = "Get Bananas";
export const APP_VERSION = "1.0.0";

// Theme Colors - Banana inspired!
export const COLORS = {
  light: {
    primary: "#FFD700", // Vibrant yellow like bananas
    secondary: "#FF6B47", // Orange-coral like the logo background
    accent: "#FF8C42", // Warm orange
    background: "#FFFEF7", // Warm white with slight yellow tint
    surface: "#FFF9E6", // Light yellow surface
    text: "#2D1810", // Dark brown for contrast
    textSecondary: "#8B6914", // Golden brown
    border: "#FFE066", // Light yellow border
    error: "#FF4757", // Vibrant red-orange
    success: "#2ED573", // Fresh green
    warning: "#FF6348", // Orange-red
    // New colors for voice features
    listening: "#FF6B47", // Orange when listening
    processing: "#FFD700", // Yellow when processing
    mic: "#FF8C42", // Accent orange for mic icon
  },
  dark: {
    primary: "#FFE066", // Softer yellow for dark mode
    secondary: "#FF7F50", // Coral for dark mode
    accent: "#FF9A56", // Lighter orange
    background: "#1A1A1A", // Dark background
    surface: "#2D2D2D", // Dark surface
    text: "#FFFFFF", // White text
    textSecondary: "#CCCCCC", // Light gray
    border: "#404040", // Dark border
    error: "#FF6B6B", // Light red
    success: "#51CF66", // Light green
    warning: "#FF8C42", // Orange
    // New colors for voice features
    listening: "#FF7F50", // Orange when listening
    processing: "#FFE066", // Yellow when processing
    mic: "#FF9A56", // Accent orange for mic icon
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

// Default Categories - Updated with banana-inspired colors
export const DEFAULT_CATEGORIES = [
  { name: "Fruits & Vegetables", color: "#2ED573", icon: "🥕" },
  { name: "Dairy & Eggs", color: "#FFD700", icon: "🥛" },
  { name: "Meat & Seafood", color: "#FF4757", icon: "🥩" },
  { name: "Bakery", color: "#FF8C42", icon: "🍞" },
  { name: "Pantry", color: "#8B6914", icon: "🥫" },
  { name: "Frozen", color: "#74B9FF", icon: "🧊" },
  { name: "Beverages", color: "#6C5CE7", icon: "🥤" },
  { name: "Snacks", color: "#FF6B47", icon: "🍿" },
  { name: "Health & Beauty", color: "#A29BFE", icon: "🧴" },
  { name: "Household", color: "#FDCB6E", icon: "🧽" },
  { name: "Pet Food", color: "#E17055", icon: "🐕" },
  { name: "Baby & Kids", color: "#FF9FF3", icon: "👶" },
  { name: "Breakfast & Cereal", color: "#FFE066", icon: "🥣" },
  { name: "Condiments & Sauces", color: "#D63031", icon: "🍯" },
  { name: "Deli & Prepared Foods", color: "#00B894", icon: "🥪" },
  { name: "International Foods", color: "#B2BEC3", icon: "🌍" },
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
