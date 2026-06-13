import { createClient } from '@supabase/supabase-js'

/** URL адрес инстанса Supabase проекта Veil */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
/** Публичный анонимный API ключ для доступа к базе данных */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing in environment variables.')
}

/**
 * Экспортируемый клиент Supabase для выполнения асинхронных операций
 * с базой данных (подписки, рефералы, профили пользователей).
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)
