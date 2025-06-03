import React, { createContext, useContext, useEffect, useState } from "react";
import { ShoppingList, ShoppingListsContextType } from "../types";
import { databaseService } from "../services/supabase";
import { useAuth } from "./AuthContext";

const ShoppingListsContext = createContext<
  ShoppingListsContextType | undefined
>(undefined);

export function useShoppingLists() {
  const context = useContext(ShoppingListsContext);
  if (context === undefined) {
    throw new Error(
      "useShoppingLists must be used within a ShoppingListsProvider"
    );
  }
  return context;
}

interface ShoppingListsProviderProps {
  children: React.ReactNode;
}

export function ShoppingListsProvider({
  children,
}: ShoppingListsProviderProps) {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lists when user changes
  useEffect(() => {
    if (user) {
      refreshLists();
    } else {
      setLists([]);
      setCurrentList(null);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = databaseService.subscribeToLists(
      user.id,
      (payload) => {
        console.log("Real-time list update:", payload);

        switch (payload.eventType) {
          case "INSERT":
            setLists((prev) => [payload.new, ...prev]);
            break;
          case "UPDATE":
            setLists((prev) =>
              prev.map((list) =>
                list.id === payload.new.id ? payload.new : list
              )
            );
            // Update current list if it's the one being updated
            setCurrentList((prev) =>
              prev?.id === payload.new.id ? payload.new : prev
            );
            break;
          case "DELETE":
            setLists((prev) =>
              prev.filter((list) => list.id !== payload.old.id)
            );
            // Clear current list if it's the one being deleted
            setCurrentList((prev) =>
              prev?.id === payload.old.id ? null : prev
            );
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const refreshLists = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await databaseService.getLists(user.id);

      if (error) {
        console.error("Error fetching lists:", error);
        setError(
          typeof error === "string"
            ? error
            : (error as any)?.message || "Unknown error"
        );
        setLists([]); // Clear lists on error
      } else {
        setLists(data || []);
        setError(null); // Clear any previous errors
      }
    } catch (err) {
      console.error("Exception in refreshLists:", err);
      setError("Failed to fetch lists");
      setLists([]); // Clear lists on exception
    }

    // Always set loading to false
    setLoading(false);
  };

  const createList = async (
    listData: Omit<ShoppingList, "id" | "created_at" | "updated_at">
  ) => {
    if (!user) throw new Error("User not authenticated");

    setError(null);

    try {
      const newList = {
        ...listData,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await databaseService.createList(newList);

      if (error) {
        setError(error.message);
        throw error;
      }

      // The real-time subscription will handle adding the list to state
      return data;
    } catch (err) {
      const errorMessage = "Failed to create list";
      setError(errorMessage);
      console.error("Error creating list:", err);
      throw new Error(errorMessage);
    }
  };

  const updateList = async (id: string, updates: Partial<ShoppingList>) => {
    setError(null);

    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await databaseService.updateList(id, updatedData);

      if (error) {
        setError(error.message);
        throw error;
      }

      // The real-time subscription will handle updating the list in state
      return data;
    } catch (err) {
      const errorMessage = "Failed to update list";
      setError(errorMessage);
      console.error("Error updating list:", err);
      throw new Error(errorMessage);
    }
  };

  const deleteList = async (id: string) => {
    setError(null);

    try {
      const { error } = await databaseService.deleteList(id);

      if (error) {
        setError(error.message);
        throw error;
      }

      // The real-time subscription will handle removing the list from state
    } catch (err) {
      const errorMessage = "Failed to delete list";
      setError(errorMessage);
      console.error("Error deleting list:", err);
      throw new Error(errorMessage);
    }
  };

  const shareList = async (listId: string, userEmail: string) => {
    setError(null);

    try {
      // Find the list to get current shared_with array
      const list = lists.find((l) => l.id === listId);
      if (!list) {
        throw new Error("List not found");
      }

      // Add the user email to shared_with array if not already present
      const sharedWith = list.shared_with || [];
      if (!sharedWith.includes(userEmail)) {
        sharedWith.push(userEmail);
      }

      await updateList(listId, { shared_with: sharedWith });
    } catch (err) {
      const errorMessage = "Failed to share list";
      setError(errorMessage);
      console.error("Error sharing list:", err);
      throw new Error(errorMessage);
    }
  };

  const value: ShoppingListsContextType = {
    lists,
    currentList,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    shareList,
    setCurrentList,
    refreshLists,
  };

  return (
    <ShoppingListsContext.Provider value={value}>
      {children}
    </ShoppingListsContext.Provider>
  );
}
