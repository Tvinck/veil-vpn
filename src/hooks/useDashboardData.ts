import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Profile, Subscription, Friend } from '../types'

/**
 * Кастомный React-хук для загрузки данных личного кабинета.
 * 
 * Логика работы:
 * 1. Запрашивает запись подписки из таблицы `vpn_subscriptions` по уникальному UUID-токену.
 * 2. При успешном получении, запрашивает ВСЕ подписки, привязанные к имени пользователя (`username`),
 *    чтобы отобразить вкладки мультиподписки.
 * 3. Формирует объект профиля пользователя. Временные поля `tg_bot_linked` и `tg_channel_subscribed`
 *    инициализируются значением false, так как в текущей схеме БД они не сохраняются перманентно.
 * 4. Загружает список реферальных друзей (временно отключено/пусто `setFriends([])`).
 * 
 * @param {string|undefined} token - Токен доступа пользователя (из параметров URL)
 */
export function useDashboardData(token: string | undefined) {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([])
  const [friends, setFriends] = useState<Friend[]>([])

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      if (!token) {
        setErrorMsg('Укажите индивидуальный токен в ссылке (например, /KUq0yqj3mW_T79on)')
        setLoading(false)
        return
      }

      // 1. Извлечение подписок по токену (используем RPC для безопасности и возможности получения всех подписок)
      const { data: allSubs, error: rpcErr } = await supabase
        .rpc('get_user_subscriptions_by_token', { p_token: token })

      if (rpcErr || !allSubs || allSubs.length === 0) {
        setErrorMsg('Личный кабинет по этому токену не найден. Проверьте правильность вашей ссылки.')
        setLoading(false)
        return
      }

      // Находим основную подписку, соответствующую токену (или первую)
      const sub = allSubs.find((s: any) => s.token === token) || allSubs[0]

      setSubscription(sub as Subscription)
      setAllSubscriptions(allSubs as Subscription[])

      // 2. Создаем псевдо-профиль из данных подписки
      const prof: Profile = {
        id: sub.id,
        username: sub.username,
        telegram_username: sub.telegram_username || '',
        avatar_color: '#E63950', // Fallback color
        tg_bot_linked: sub.tg_bot_linked || false, // Загрузка реального состояния привязки бота из БД
        tg_channel_subscribed: sub.tg_channel_subscribed || false // Загрузка реального состояния подписки на канал из БД
      }

      setProfile(prof)

      // 3. Реферальная система
      const { data: dbRefs } = await supabase
        .from('vpn_referrals')
        .select('*')
        .eq('referrer_username', sub.username)
        .order('created_at', { ascending: false })

      const mappedFriends: Friend[] = (dbRefs || []).map((r: any) => ({
        name: r.referred_username,
        status: r.status as 'active' | 'pending',
        bonus: r.status === 'active' ? `+${r.bonus_days} дней` : 'Ожидает покупки'
      }))

      setFriends(mappedFriends)
    } catch (err) {
      console.error('Ошибка загрузки данных:', err)
      setErrorMsg('Произошла непредвиденная ошибка при синхронизации с базой данных.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return {
    loading,
    errorMsg,
    profile,
    subscription,
    allSubscriptions,
    friends,
    fetchUserData
  }
}
