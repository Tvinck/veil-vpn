-- Включите расширение для UUID, если оно не включено
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица серверов (создается первой, чтобы на нее ссылались пользователи)
CREATE TABLE veil_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    ip TEXT,
    flag TEXT,
    status TEXT DEFAULT 'online', -- 'online', 'offline'
    cpu_load INT DEFAULT 0,
    ram_load INT DEFAULT 0,
    online_users INT DEFAULT 0,
    uptime TEXT
);

-- Таблица пользователей
CREATE TABLE veil_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    username TEXT,
    name TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'banned'
    plan TEXT DEFAULT 'premium',
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + interval '30 days'),
    traffic_used BIGINT DEFAULT 0,
    traffic_limit BIGINT DEFAULT 50000000000, -- 50 GB
    server_id UUID REFERENCES veil_servers(id) ON DELETE SET NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT DEFAULT 'user' -- 'admin', 'user'
);

-- Таблица транзакций (оплат)
CREATE TABLE veil_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES veil_users(id) ON DELETE CASCADE,
    type TEXT, -- 'buy_sub', 'extend_sub'
    amount INT NOT NULL,
    status TEXT DEFAULT 'success', -- 'success', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Заполним сервера мок-данными для тестирования
INSERT INTO veil_servers (name, location, ip, flag, status, cpu_load, ram_load, online_users, uptime)
VALUES 
    ('EU-West', 'Frankfurt, DE', '142.250.185.1', '🇩🇪', 'online', 65, 45, 12, '14d 5h'),
    ('US-East', 'New York, US', '172.217.18.2', '🇺🇸', 'online', 32, 28, 8, '3d 12h'),
    ('SG-Asia', 'Singapore', '104.244.42.1', '🇸🇬', 'offline', 0, 0, 0, '0d 0h');

-- Отключаем RLS (Row Level Security) на время разработки, 
-- чтобы фронтенд мог свободно читать/писать данные без сложной настройки авторизации:
ALTER TABLE veil_servers DISABLE ROW LEVEL SECURITY;
ALTER TABLE veil_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE veil_transactions DISABLE ROW LEVEL SECURITY;
