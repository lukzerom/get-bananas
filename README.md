<<<<<<< HEAD
# get-bananas
=======
# 🛒 Get Bananas - Shopping List App

A collaborative shopping list app built with Expo, React Native, TypeScript, and Supabase. Perfect for couples and families to manage their shopping lists together with real-time synchronization.

## ✨ Features

- **Real-time Collaboration**: Share shopping lists with your partner/family
- **User Authentication**: Secure sign up/sign in with Supabase Auth
- **Beautiful UI**: Clean, modern interface with dark/light theme support
- **Cross-platform**: Works on iOS, Android, and Web
- **TypeScript**: Full type safety throughout the application
- **Offline Support**: Works offline with automatic sync when connected

## 🛠 Tech Stack

- **Frontend**: Expo 53, React Native, TypeScript
- **Backend**: Supabase (Auth, Database, Real-time)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + Custom Hooks
- **Storage**: Supabase PostgreSQL with real-time subscriptions

## 📱 Architecture

The app follows a clean, modular architecture:

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components
│   └── common/       # Feature-specific components
├── contexts/         # React Context providers
├── services/         # API and external service integrations
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── constants/       # App constants and configuration
└── utils/           # Utility functions

app/                 # Expo Router file-based routing
├── auth/           # Authentication screens
├── lists/          # Shopping list screens
├── settings/       # App settings screens
└── _layout.tsx     # Root layout with navigation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd get-bananas
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Set up Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Lists table
CREATE TABLE public.shopping_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  shared_with TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Items table
CREATE TABLE public.shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  category TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Shopping Lists policies
CREATE POLICY "Users can view own and shared lists" ON public.shopping_lists
  FOR SELECT USING (
    auth.uid() = created_by OR
    auth.email()::text = ANY(shared_with)
  );

CREATE POLICY "Users can create lists" ON public.shopping_lists
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own lists" ON public.shopping_lists
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own lists" ON public.shopping_lists
  FOR DELETE USING (auth.uid() = created_by);

-- Shopping Items policies
CREATE POLICY "Users can view items from accessible lists" ON public.shopping_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = list_id AND (
        created_by = auth.uid() OR
        auth.email()::text = ANY(shared_with)
      )
    )
  );

CREATE POLICY "Users can create items in accessible lists" ON public.shopping_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = list_id AND (
        created_by = auth.uid() OR
        auth.email()::text = ANY(shared_with)
      )
    )
  );

CREATE POLICY "Users can update items in accessible lists" ON public.shopping_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = list_id AND (
        created_by = auth.uid() OR
        auth.email()::text = ANY(shared_with)
      )
    )
  );

CREATE POLICY "Users can delete items in accessible lists" ON public.shopping_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = list_id AND (
        created_by = auth.uid() OR
        auth.email()::text = ANY(shared_with)
      )
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON public.shopping_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Run the App

```bash
# Start the development server
npm start

# Or run on specific platforms
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Web browser
```

## 📱 Screens

### Authentication

- **Login**: Email/password authentication
- **Register**: Create new account with email verification

### Main App

- **Home**: Overview of all shopping lists
- **List Detail**: View and manage items in a specific list
- **Create List**: Create a new shopping list
- **Settings**: User profile and app preferences

## 🔧 Development

### Project Structure Explanation

- **Contexts**: React Context is used for state management (instead of Redux) to keep things simple while maintaining good separation of concerns
- **Services**: Centralized API calls and business logic
- **Components**: Reusable UI components following atomic design principles
- **Types**: Comprehensive TypeScript definitions for type safety

### Key Design Decisions

1. **Context over Redux**: Simpler setup for this app size while still providing good state management
2. **File-based Routing**: Expo Router provides a clean, intuitive routing structure
3. **Supabase**: Handles auth, database, and real-time features without complex backend setup
4. **TypeScript**: Ensures type safety and better developer experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Łukasz Żeromski**

This project showcases modern React Native development with TypeScript, demonstrating skills in:

- Mobile app architecture and state management
- Real-time database integration
- User authentication and security
- Clean, maintainable code structure
- Modern UI/UX design principles

---

_Built with ❤️ for better shopping experiences_
>>>>>>> feature/init-repo
