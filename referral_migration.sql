-- ═══════════════════════════════════════════
-- VEIL VPN — Referral System Migration (FIXED)
-- ═══════════════════════════════════════════

-- 1. Удаляем старую таблицу если она была создана криво
DROP TABLE IF EXISTS veil_referrals CASCADE;

-- 2. Создаём таблицу рефералов заново с правильной структурой
CREATE TABLE veil_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES veil_users(id) ON DELETE CASCADE,
    referrer_telegram_id BIGINT NOT NULL,
    referred_telegram_id BIGINT NOT NULL,
    referred_user_id UUID REFERENCES veil_users(id) ON DELETE SET NULL,
    bonus_days INT DEFAULT 3,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Уникальный индекс — один человек может быть приглашён только 1 раз
CREATE UNIQUE INDEX idx_referrals_unique_referred 
    ON veil_referrals(referred_telegram_id) 
    WHERE status IN ('pending', 'completed');

-- 4. Добавляем колонки в veil_users
ALTER TABLE veil_users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES veil_users(id);
ALTER TABLE veil_users ADD COLUMN IF NOT EXISTS total_referrals INT DEFAULT 0;
ALTER TABLE veil_users ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- 5. Генерируем referral_code для существующих юзеров
UPDATE veil_users 
SET referral_code = 'VEIL-' || SUBSTRING(telegram_id::TEXT, 1, 5)
WHERE referral_code IS NULL AND telegram_id IS NOT NULL;

-- 6. RLS
ALTER TABLE veil_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read referrals" ON veil_referrals;
CREATE POLICY "Public read referrals" ON veil_referrals FOR SELECT USING (true);

-- 7. Авто-подсчёт нагрузки серверов
CREATE OR REPLACE FUNCTION update_server_load()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE veil_servers
        SET current_users = (SELECT count(*) FROM veil_keys WHERE server_id = NEW.server_id)
        WHERE id = NEW.server_id;
    END IF;
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.server_id != NEW.server_id)) THEN
        UPDATE veil_servers
        SET current_users = (SELECT count(*) FROM veil_keys WHERE server_id = OLD.server_id)
        WHERE id = OLD.server_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_server_load ON veil_keys;
CREATE TRIGGER trigger_update_server_load
AFTER INSERT OR UPDATE OR DELETE ON veil_keys
FOR EACH ROW
EXECUTE FUNCTION update_server_load();

-- 8. Принудительно пересчитать текущую нагрузку
UPDATE veil_servers s
SET current_users = (
    SELECT count(*) FROM veil_keys k WHERE k.server_id = s.id
);
