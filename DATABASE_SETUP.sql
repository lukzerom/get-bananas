-- Get Bananas Shopping App Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security for all tables
-- Note: JWT secret is automatically managed by Supabase
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    shared_with TEXT[] DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE
);

-- Create shopping_items table
CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(20),
    category VARCHAR(50),
    is_completed BOOLEAN DEFAULT FALSE,
    added_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create categories table (for future use)
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL, -- hex color code
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, color, icon, order_index) VALUES
('Fruits & Vegetables', '#34C759', '🥕', 1),
('Dairy & Eggs', '#FFCC02', '🥛', 2),
('Meat & Seafood', '#FF3B30', '🥩', 3),
('Bakery', '#FF9500', '🍞', 4),
('Pantry', '#8E8E93', '🥫', 5),
('Frozen', '#00C7BE', '🧊', 6),
('Beverages', '#007AFF', '🥤', 7),
('Snacks', '#5856D6', '🍿', 8),
('Health & Beauty', '#AF52DE', '🧴', 9),
('Household', '#A2845E', '🧽', 10)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_by ON shopping_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON shopping_lists(created_at);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_added_by ON shopping_items(added_by);
CREATE INDEX IF NOT EXISTS idx_shopping_items_created_at ON shopping_items(created_at);

-- Enable Row Level Security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create Row Level Security Policies

-- Shopping Lists Policies
CREATE POLICY "Users can view their own lists and shared lists" ON shopping_lists
    FOR SELECT USING (
        created_by = auth.uid() OR 
        auth.jwt() ->> 'email' = ANY(shared_with)
    );

CREATE POLICY "Users can create their own lists" ON shopping_lists
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own lists and shared lists" ON shopping_lists
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        auth.jwt() ->> 'email' = ANY(shared_with)
    );

CREATE POLICY "Users can delete their own lists" ON shopping_lists
    FOR DELETE USING (created_by = auth.uid());

-- Shopping Items Policies
CREATE POLICY "Users can view items from their lists" ON shopping_items
    FOR SELECT USING (
        list_id IN (
            SELECT id FROM shopping_lists 
            WHERE created_by = auth.uid() OR 
                  auth.jwt() ->> 'email' = ANY(shared_with)
        )
    );

CREATE POLICY "Users can add items to their lists" ON shopping_items
    FOR INSERT WITH CHECK (
        added_by = auth.uid() AND
        list_id IN (
            SELECT id FROM shopping_lists 
            WHERE created_by = auth.uid() OR 
                  auth.jwt() ->> 'email' = ANY(shared_with)
        )
    );

CREATE POLICY "Users can update items in their lists" ON shopping_items
    FOR UPDATE USING (
        list_id IN (
            SELECT id FROM shopping_lists 
            WHERE created_by = auth.uid() OR 
                  auth.jwt() ->> 'email' = ANY(shared_with)
        )
    );

CREATE POLICY "Users can delete items from their lists" ON shopping_items
    FOR DELETE USING (
        list_id IN (
            SELECT id FROM shopping_lists 
            WHERE created_by = auth.uid() OR 
                  auth.jwt() ->> 'email' = ANY(shared_with)
        )
    );

-- Categories Policies (read-only for all authenticated users)
CREATE POLICY "All users can view categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_shopping_lists_updated_at 
    BEFORE UPDATE ON shopping_lists 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at 
    BEFORE UPDATE ON shopping_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for setting completed_at when item is completed
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
        NEW.completed_at = NOW();
        NEW.completed_by = auth.uid();
    ELSIF NEW.is_completed = FALSE AND OLD.is_completed = TRUE THEN
        NEW.completed_at = NULL;
        NEW.completed_by = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_shopping_items_completed_at 
    BEFORE UPDATE ON shopping_items 
    FOR EACH ROW EXECUTE FUNCTION set_completed_at();

-- Grant necessary permissions (if needed)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 