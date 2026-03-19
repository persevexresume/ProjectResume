-- Create profiles table for storing master profile data
-- This table stores user profile information that will be used as defaults for resume generation

CREATE TABLE IF NOT EXISTS public.profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    title VARCHAR(255),
    summary TEXT,
    city VARCHAR(255),
    country VARCHAR(255),
    pin_code VARCHAR(20),
    location VARCHAR(500),
    experience_data JSONB DEFAULT '[]'::jsonb,
    education_data JSONB DEFAULT '[]'::jsonb,
    skills_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Create an index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- Enable Row Level Security (RLS)
-- NOTE: RLS is disabled because this app uses custom authentication (email/password)
-- not Supabase Auth. Security is enforced at the application level.
-- Uncomment below if you migrate to Supabase Auth in the future.
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Disable RLS for now (custom auth is handled by the application)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- RLS Policies (kept for reference, disabled via ALTER TABLE DISABLE above)
-- Uncomment these if you switch to Supabase Auth:
/* Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid()::text = user_id);
*/
