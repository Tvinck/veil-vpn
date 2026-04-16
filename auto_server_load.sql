-- Функция для автоматического подсчета количества юзеров на сервере
CREATE OR REPLACE FUNCTION update_server_load()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем счетчик для нового сервера (при создании или переносе юзера)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE veil_servers
        SET current_users = (SELECT count(*) FROM veil_keys WHERE server_id = NEW.server_id)
        WHERE id = NEW.server_id;
    END IF;
    
    -- Обновляем счетчик для старого сервера (при удалении или переносе юзера)
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.server_id != NEW.server_id)) THEN
        UPDATE veil_servers
        SET current_users = (SELECT count(*) FROM veil_keys WHERE server_id = OLD.server_id)
        WHERE id = OLD.server_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Удаляем триггер, если он уже существует (для пересоздания)
DROP TRIGGER IF EXISTS trigger_update_server_load ON veil_keys;

-- Создаем триггер, который срабатывает при любых изменениях с ключами
CREATE TRIGGER trigger_update_server_load
AFTER INSERT OR UPDATE OR DELETE ON veil_keys
FOR EACH ROW
EXECUTE FUNCTION update_server_load();

-- Сразу принудительно пересчитываем всех текущих пользователей
UPDATE veil_servers s
SET current_users = (
    SELECT count(*) FROM veil_keys k WHERE k.server_id = s.id
);
