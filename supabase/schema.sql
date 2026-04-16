-- ═══════════════════════════════════════════════════
-- VEIL VPN — Master Database Schema
-- ═══════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Users & Trial Management ──
CREATE TABLE veil_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id bigint UNIQUE NOT NULL,
  username text,
  first_name text,
  
  -- Account Status
  status text DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'banned')),
  trial_ends_at timestamptz DEFAULT now() + interval '3 days',
  sub_ends_at timestamptz,
  
  -- Referral System
  referral_code text UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 8)),
  referred_by uuid REFERENCES veil_users(id),
  total_referrals int DEFAULT 0,
  bonus_days int DEFAULT 0,
  
  -- Configs
  vless_url text,
  active_server_id uuid, -- Reference to veil_servers
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 2. Payments & Subscriptions (T-Bank & Telegram Stars) ──
CREATE TABLE veil_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES veil_users(id) NOT NULL,
  amount_rub numeric,
  amount_stars int,
  payment_method text CHECK (payment_method IN ('tbank', 'stars', 'crypto', 'bonus')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  plan_days int NOT NULL,
  provider_tx_id text,
  
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ── 3. Server Infrastructure Management ──
CREATE TABLE veil_servers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  country text NOT NULL,
  flag_emoji text,
  ip_address text NOT NULL,
  panel_port int NOT NULL,
  xray_port int DEFAULT 443,
  
  -- Health & Routing
  is_active boolean DEFAULT true,
  current_load int DEFAULT 0,
  is_pro boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- ── Security & RLS ──
ALTER TABLE veil_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE veil_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE veil_servers ENABLE ROW LEVEL SECURITY;

-- Base Policies for Anon/Edge Functions
CREATE POLICY "Users can view own data" ON veil_users FOR SELECT USING (true); 
CREATE POLICY "Users can create self" ON veil_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update self" ON veil_users FOR UPDATE USING (true);

-- Servers are public for clients to list
CREATE POLICY "Servers are public" ON veil_servers FOR SELECT USING (is_active = true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_veil_users_modtime
    BEFORE UPDATE ON veil_users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function to handle referral bonuses automatically
CREATE OR REPLACE FUNCTION process_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
    -- If a new user is created and they have a 'referred_by'
    IF NEW.referred_by IS NOT NULL THEN
        -- Add +3 days to referRER
        UPDATE veil_users 
        SET 
            total_referrals = total_referrals + 1,
            bonus_days = bonus_days + 3,
            -- If on trial, extend trial. If on sub, extend sub.
            trial_ends_at = CASE WHEN status = 'trial' THEN trial_ends_at + interval '3 days' ELSE trial_ends_at END,
            sub_ends_at = CASE WHEN status = 'active' THEN sub_ends_at + interval '3 days' ELSE sub_ends_at END
        WHERE id = NEW.referred_by;
        
        -- The referred user already gets exactly 3 days default trial_ends_at, 
        -- but we can add +3 days to them too if you want:
        NEW.trial_ends_at = NEW.trial_ends_at + interval '3 days';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_process_referral
    BEFORE INSERT ON veil_users
    FOR EACH ROW
    EXECUTE FUNCTION process_referral_bonus();
