import { createClient } from '@supabase/supabase-js'

/** URL адрес инстанса Supabase проекта Veil */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
/** Публичный анонимный API ключ для доступа к базе данных */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing in environment variables.')
}

/**
 * В продакшене используем проксирование через Vercel rewrites (/supabase-proxy/*)
 * чтобы все запросы к Supabase шли через тот же домен (same-origin).
 * Это устраняет CORS/PNA блокировки при использовании VPN с fake-ip DNS.
 * В dev-режиме используем прямой URL Supabase.
 */
const isProduction = import.meta.env.PROD
const effectiveUrl = isProduction
  ? `${window.location.origin}/supabase-proxy`
  : (supabaseUrl || '')

/**
 * Экспортируемый клиент Supabase для выполнения асинхронных операций
 * с базой данных (подписки, рефералы, профили пользователей).
 */
export const supabase = createClient(
  effectiveUrl,
  supabaseAnonKey || ''
)
