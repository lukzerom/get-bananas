import "react-native-url-polyfill/auto";
import { useEffect } from "react";
import { Slot, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ShoppingListsProvider } from "../src/contexts/ShoppingListsContext";

function InitialLayout() {
  const router = useRouter();

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const { hostname, path, queryParams } = Linking.parse(url);

      // Handle auth callback deep links
      if (hostname === "auth" && path === "/callback") {
        router.push({
          pathname: "/auth/callback",
          params: queryParams || {},
        });
      }
    };

    // Handle initial URL when app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URLs when app is already running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, [router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ShoppingListsProvider>
          <StatusBar style="auto" />
          <InitialLayout />
        </ShoppingListsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
