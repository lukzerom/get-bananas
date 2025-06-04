// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Shopping List types
export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  shared_with: string[];
  is_completed: boolean;
}

// Shopping Item types
export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  category?: string;
  is_completed: boolean;
  added_by: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
}

// Auth types
export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  error: string | null;
}

// Navigation types
export interface RootStackParamList {
  index: undefined;
  "auth/login": undefined;
  "auth/register": undefined;
  "lists/[id]": { id: string };
  "lists/create": undefined;
  "lists/edit/[id]": { id: string };
  "settings/profile": undefined;
  "settings/preferences": undefined;
}

// Context types
export interface ShoppingListsContextType {
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  loading: boolean;
  error: string | null;
  createList: (
    list: Omit<ShoppingList, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateList: (id: string, updates: Partial<ShoppingList>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  shareList: (listId: string, userEmail: string) => Promise<void>;
  setCurrentList: (list: ShoppingList | null) => void;
  refreshLists: () => Promise<void>;
}

export interface ShoppingItemsContextType {
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  addItem: (
    item: Omit<ShoppingItem, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemCompletion: (id: string) => Promise<void>;
  refreshItems: (listId: string) => Promise<void>;
}

// UI types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: object;
    h2: object;
    h3: object;
    body: object;
    caption: object;
  };
}
