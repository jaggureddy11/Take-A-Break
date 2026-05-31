-- ==========================================================================
-- TAB (Take A Breath) Database Schema Migration Script
-- ==========================================================================

-- 1. Create Roles Enum
CREATE TYPE role_enum AS ENUM ('visitor', 'seeker', 'dude', 'admin');
CREATE TYPE bounty_status_enum AS ENUM ('pending', 'visiting', 'submitted', 'completed', 'disputed');
CREATE TYPE escrow_state_enum AS ENUM ('secured', 'released', 'disputed');
CREATE TYPE chat_message_type_enum AS ENUM ('text', 'location', 'image', 'speed_test');

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role role_enum DEFAULT 'seeker' NOT NULL,
    wallet_pending NUMERIC DEFAULT 0.00 NOT NULL,
    wallet_withdrawn NUMERIC DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bounties Table
CREATE TABLE IF NOT EXISTS public.bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dude_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    area TEXT NOT NULL,
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    budget_min INTEGER NOT NULL,
    budget_max INTEGER NOT NULL,
    deposit_min INTEGER NOT NULL,
    deposit_max INTEGER NOT NULL,
    room_type TEXT NOT NULL,
    gender_pref TEXT DEFAULT 'Any' NOT NULL,
    food_pref TEXT,
    preferences TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    notes TEXT,
    status bounty_status_enum DEFAULT 'pending' NOT NULL,
    escrow_state escrow_state_enum DEFAULT 'secured' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Verification Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID NOT NULL UNIQUE REFERENCES public.bounties(id) ON DELETE CASCADE,
    dude_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wifi_speed INTEGER NOT NULL,
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5) NOT NULL,
    photo_url TEXT NOT NULL,
    location_link TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Chats Table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type chat_message_type_enum DEFAULT 'text' NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 7. Policies definition

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Bounties policies
CREATE POLICY "Bounties are viewable by authenticated users" ON public.bounties
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Seekers can insert their own bounties" ON public.bounties
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Seekers and assigned dudes can update bounties" ON public.bounties
    FOR UPDATE TO authenticated USING (auth.uid() = seeker_id OR auth.uid() = dude_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Reports policies
CREATE POLICY "Reports are viewable by authenticated users" ON public.reports
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dudes can insert reports for their assigned bounties" ON public.reports
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = dude_id);

-- Chats policies
CREATE POLICY "Chats are viewable by participants" ON public.chats
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.bounties 
            WHERE bounties.id = chats.bounty_id 
            AND (bounties.seeker_id = auth.uid() OR bounties.dude_id = auth.uid())
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Participants can send messages" ON public.chats
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = sender_id AND (
            EXISTS (
                SELECT 1 FROM public.bounties 
                WHERE bounties.id = chats.bounty_id 
                AND (bounties.seeker_id = auth.uid() OR bounties.dude_id = auth.uid())
            )
        )
    );

-- 8. Add Realtime Subscriptions configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bounties;

-- 9. Auto Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'seeker'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
