import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { ShoppingItem, ShoppingItemsContextType } from "../types";
import { databaseService } from "../services/supabase";
import { useAuth } from "./AuthContext";

const ShoppingItemsContext = createContext<
  ShoppingItemsContextType | undefined
>(undefined);

export const useShoppingItems = () => {
  const context = useContext(ShoppingItemsContext);
  if (context === undefined) {
    throw new Error(
      "useShoppingItems must be used within a ShoppingItemsProvider"
    );
  }
  return context;
};

interface ShoppingItemsProviderProps {
  children: React.ReactNode;
}

export const ShoppingItemsProvider = ({
  children,
}: ShoppingItemsProviderProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear items when user changes
  useEffect(() => {
    if (!user) {
      setItems([]);
    }
  }, [user]);

  const refreshItems = useCallback(
    async (listId: string) => {
      if (!user || !listId) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await databaseService.getItems(listId);

        if (error) {
          console.error("Error fetching items:", error);
          setError(
            typeof error === "string"
              ? error
              : (error as any)?.message || "Failed to fetch items"
          );
          setItems([]);
        } else {
          setItems(data || []);
          setError(null);
        }
      } catch (err) {
        console.error("Exception in refreshItems:", err);
        setError("Failed to fetch items");
        setItems([]);
      }

      setLoading(false);
    },
    [user]
  );

  const addItem = async (
    itemData: Omit<ShoppingItem, "id" | "created_at" | "updated_at">
  ) => {
    if (!user) throw new Error("User not authenticated");

    setError(null);

    try {
      const newItem = {
        ...itemData,
        added_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await databaseService.createItem(newItem);

      if (error) {
        setError(error.message);
        throw error;
      }

      // Add item to state immediately for better UX
      if (data) {
        setItems((prev) => [data, ...prev]);
      }

      return data;
    } catch (err) {
      const errorMessage = "Failed to add item";
      setError(errorMessage);
      console.error("Error adding item:", err);
      throw new Error(errorMessage);
    }
  };

  const updateItem = async (id: string, updates: Partial<ShoppingItem>) => {
    setError(null);

    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await databaseService.updateItem(id, updatedData);

      if (error) {
        setError(error.message);
        throw error;
      }

      // Update item in state immediately
      if (data) {
        setItems((prev) => prev.map((item) => (item.id === id ? data : item)));
      }

      return data;
    } catch (err) {
      const errorMessage = "Failed to update item";
      setError(errorMessage);
      console.error("Error updating item:", err);
      throw new Error(errorMessage);
    }
  };

  const deleteItem = async (id: string) => {
    setError(null);

    try {
      const { error } = await databaseService.deleteItem(id);

      if (error) {
        setError(error.message);
        throw error;
      }

      // Remove item from state immediately
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const errorMessage = "Failed to delete item";
      setError(errorMessage);
      console.error("Error deleting item:", err);
      throw new Error(errorMessage);
    }
  };

  const toggleItemCompletion = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const now = new Date().toISOString();
    await updateItem(id, {
      is_completed: !item.is_completed,
      completed_at: !item.is_completed ? now : undefined,
      completed_by: !item.is_completed ? user?.id : undefined,
    });
  };

  const value: ShoppingItemsContextType = {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    toggleItemCompletion,
    refreshItems,
  };

  return (
    <ShoppingItemsContext.Provider value={value}>
      {children}
    </ShoppingItemsContext.Provider>
  );
};
