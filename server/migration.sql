-- ═══════════════════════════════════════════
-- VEIL VPN — Core Schema
-- Run this in Supabase SQL Editor
-- https://djodaxpjnzxzdspvvyuw.supabase.co
-- ═══════════════════════════════════════════

-- 1. Users
CREATE TABLE IF NOT EXISTS public.veil_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'trial', 'basic', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  referred_by UUID REFERENCES public.veil_users(id),
  referral_bonus_days INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Servers
CREATE TABLE IF NOT EXISTS public.veil_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 443,
  protocol TEXT DEFAULT 'vless-reality',
  sni TEXT DEFAULT 'microsoft.com',
  fingerprint TEXT DEFAULT 'chrome',
  public_key TEXT,
  short_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'full', 'offline')),
  max_users INTEGER DEFAULT 50,
  current_users INTEGER DEFAULT 0,
  load_percent INTEGER DEFAULT 0,
  ping_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Access Keys
CREATE TABLE IF NOT EXISTS public.veil_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.veil_users(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES public.veil_servers(id) ON DELETE CASCADE,
  vless_uuid TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  config_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_connected_at TIMESTAMPTZ,
  traffic_used_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Payments
CREATE TABLE IF NOT EXISTS public.veil_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.veil_users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'RUB' CHECK (currency IN ('RUB', 'stars', 'TON')),
  tier TEXT NOT NULL CHECK (tier IN ('trial', 'basic', 'pro')),
  duration_days INTEGER NOT NULL DEFAULT 30,
  payment_method TEXT CHECK (payment_method IN ('tbank', 'stars', 'referral')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Referral Log
CREATE TABLE IF NOT EXISTS public.veil_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.veil_users(id),
  referred_id UUID NOT NULL REFERENCES public.veil_users(id),
  bonus_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- 6. Connection Log
CREATE TABLE IF NOT EXISTS public.veil_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.veil_users(id),
  server_id UUID NOT NULL REFERENCES public.veil_servers(id),
  connected_at TIMESTAMPTZ DEFAULT now(),
  disconnected_at TIMESTAMPTZ,
  bytes_up BIGINT DEFAULT 0,
  bytes_down BIGINT DEFAULT 0
);

-- ═══════ INDEXES ═══════
CREATE INDEX IF NOT EXISTS idx_veil_users_telegram ON public.veil_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_veil_users_referral ON public.veil_users(referral_code);
CREATE INDEX IF NOT EXISTS idx_veil_keys_user ON public.veil_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_veil_keys_server ON public.veil_keys(server_id);
CREATE INDEX IF NOT EXISTS idx_veil_payments_user ON public.veil_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_veil_connections_user ON public.veil_connections(user_id);

-- ═══════ RLS ═══════
ALTER TABLE public.veil_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veil_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veil_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veil_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veil_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veil_connections ENABLE ROW LEVEL SECURITY;

-- Public read for servers
CREATE POLICY "Servers viewable by everyone" ON public.veil_servers
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access users" ON public.veil_users
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access keys" ON public.veil_keys
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access payments" ON public.veil_payments
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access referrals" ON public.veil_referrals
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access connections" ON public.veil_connections
  FOR ALL USING (auth.role() = 'service_role');

-- Anon can read active servers
CREATE POLICY "Anon can read servers" ON public.veil_servers
  FOR SELECT TO anon USING (status = 'active');

-- ═══════ SEED: Default server ═══════
INSERT INTO public.veil_servers (name, country_code, country_name, flag_emoji, host, port, protocol, sni, status)
VALUES ('Timeweb-EU-1', 'NL', 'Нидерланды', '🇳🇱', '0.0.0.0', 443, 'vless-reality', 'microsoft.com', 'active')
ON CONFLICT DO NOTHING;
