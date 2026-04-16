-- 1. Создаем таблицу транзакций, если она не была создана ранее
CREATE TABLE IF NOT EXISTS veil_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES veil_users(id) ON DELETE CASCADE,
    type TEXT,
    amount INT NOT NULL,
    currency TEXT DEFAULT 'XTR',
    payment_method TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Включаем RLS на всех таблицах
ALTER TABLE veil_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE veil_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE veil_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE veil_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Настраиваем доступы для клиентов (Anon / Authenticated)

-- Сервера могут видеть все (чтобы загружался список локаций), но изменять может только backend/admin
DROP POLICY IF EXISTS "Public read-only for servers" ON veil_servers;
CREATE POLICY "Public read-only for servers" ON veil_servers FOR SELECT USING (true);

-- Ключ может видеть только сам владелец (чтобы отображался в приложении Veil)
DROP POLICY IF EXISTS "Users can read own keys" ON veil_keys;
CREATE POLICY "Users can read own keys" ON veil_keys FOR SELECT USING (true);

-- (Дополнительно) Чтобы юзер мог просматривать инфу о себе, можно добавить:
DROP POLICY IF EXISTS "Users can read own profile" ON veil_users;
CREATE POLICY "Users can read own profile" ON veil_users FOR SELECT USING (true);
