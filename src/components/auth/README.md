# 🔐 AuthGuard System

The AuthGuard system provides a robust way to protect your app routes based on authentication status. It automatically redirects users to appropriate screens and listens to auth state changes.

## Components

### 1. `AuthGuard` - Base Component

The main component that handles authentication protection logic.

```tsx
import { AuthGuard } from "../../src/components/auth";

<AuthGuard requireAuth={true} redirectTo="/auth/login">
  <YourProtectedComponent />
</AuthGuard>;
```

**Props:**

- `children`: React components to render when auth requirements are met
- `fallback?`: Custom loading component (optional)
- `redirectTo?`: Custom redirect path (optional)
- `requireAuth?`: `true` = require authentication, `false` = require no authentication (default: `true`)

### 2. `ProtectedRoute` - Convenience Wrapper

For screens that require authentication (most app screens).

```tsx
import { ProtectedRoute } from "../../src/components/auth";

export default function HomeScreen() {
  return (
    <ProtectedRoute>
      <HomeScreenContent />
    </ProtectedRoute>
  );
}
```

**Features:**

- Automatically redirects to `/auth/login` if user is not authenticated
- Shows loading spinner while checking auth status
- Connected to auth state listener for real-time updates

### 3. `PublicRoute` - Convenience Wrapper

For screens that require NO authentication (login, register, etc.).

```tsx
import { PublicRoute } from "../../src/components/auth";

export default function LoginScreen() {
  return (
    <PublicRoute>
      <LoginScreenContent />
    </PublicRoute>
  );
}
```

**Features:**

- Automatically redirects to `/` if user is already authenticated
- Prevents authenticated users from accessing auth screens
- Connected to auth state listener for real-time updates

## Usage Examples

### Protected Screens

Use `ProtectedRoute` for any screen that requires authentication:

```tsx
// app/index.tsx
import { ProtectedRoute } from "../src/components/auth";

export default function HomeScreen() {
  return (
    <ProtectedRoute>
      <HomeScreenContent />
    </ProtectedRoute>
  );
}

// app/lists/[id].tsx
import { ProtectedRoute } from "../../src/components/auth";

export default function ListDetailScreen() {
  return (
    <ProtectedRoute>
      <ListDetailContent />
    </ProtectedRoute>
  );
}

// app/settings/profile.tsx
import { ProtectedRoute } from "../../src/components/auth";

export default function ProfileScreen() {
  return (
    <ProtectedRoute>
      <ProfileScreenContent />
    </ProtectedRoute>
  );
}
```

### Public Screens

Use `PublicRoute` for authentication screens:

```tsx
// app/auth/login.tsx
import { PublicRoute } from "../../src/components/auth";

export default function LoginScreen() {
  return (
    <PublicRoute>
      <LoginScreenContent />
    </PublicRoute>
  );
}

// app/auth/register.tsx
import { PublicRoute } from "../../src/components/auth";

export default function RegisterScreen() {
  return (
    <PublicRoute>
      <RegisterScreenContent />
    </PublicRoute>
  );
}
```

### Custom Redirects

You can customize where users are redirected:

```tsx
// Redirect to a specific screen after login
<ProtectedRoute redirectTo="/auth/login">
  <ProtectedContent />
</ProtectedRoute>

// Redirect authenticated users to dashboard instead of home
<PublicRoute redirectTo="/dashboard">
  <LoginContent />
</PublicRoute>
```

### Custom Loading State

Provide a custom loading component:

```tsx
const CustomLoader = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Loading your shopping lists...</Text>
    <ActivityIndicator size="large" />
  </View>
);

<ProtectedRoute fallback={<CustomLoader />}>
  <HomeScreenContent />
</ProtectedRoute>;
```

## How It Works

1. **Auth State Listening**: All AuthGuard components automatically listen to auth state changes via the `useAuth()` hook

2. **Automatic Redirects**:

   - `ProtectedRoute`: Redirects to login if user is not authenticated
   - `PublicRoute`: Redirects to home if user is already authenticated

3. **Loading States**: Shows loading spinner while checking authentication status

4. **Prevent Redirect Loops**: Smart logic prevents infinite redirects by checking current route segments

5. **Real-time Updates**: Immediately responds to auth state changes (login/logout)

## Flow Examples

### User Login Flow

1. User on login screen (wrapped with `PublicRoute`)
2. User submits login form
3. Auth state changes to "authenticated"
4. `PublicRoute` detects auth change and redirects to `/`
5. Home screen (wrapped with `ProtectedRoute`) renders

### User Logout Flow

1. User on home screen (wrapped with `ProtectedRoute`)
2. User clicks "Sign Out"
3. Auth state changes to "unauthenticated"
4. `ProtectedRoute` detects auth change and redirects to `/auth/login`
5. Login screen (wrapped with `PublicRoute`) renders

### Direct URL Access

1. Unauthenticated user tries to access `/lists/123`
2. `ProtectedRoute` checks auth status
3. User is not authenticated, redirects to `/auth/login`
4. User can then login and will be redirected to home

## Best Practices

1. **Wrap All Screens**: Every screen should be wrapped with either `ProtectedRoute` or `PublicRoute`

2. **Use Semantic Wrappers**: Prefer `ProtectedRoute` and `PublicRoute` over the base `AuthGuard` for clarity

3. **Keep Logic in Guards**: Don't duplicate auth checks in your components - let the guards handle it

4. **Test Both States**: Always test your screens in both authenticated and unauthenticated states

5. **Handle Edge Cases**: The guards handle loading states and prevent redirect loops automatically

This system ensures a secure and smooth user experience with minimal boilerplate code! 🚀
