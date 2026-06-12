import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Profile, Subscription, Friend } from '../types'

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

      // 1. Извлечение подписки по токену
      const { data: sub, error: subErr } = await supabase
        .from('vpn_subscriptions')
        .select('*')
        .eq('token', token)
        .single()

      if (subErr || !sub) {
        setErrorMsg('Личный кабинет по этому токену не найден. Проверьте правильность вашей ссылки.')
        setLoading(false)
        return
      }

      setSubscription(sub as Subscription)

      // 1.5 Извлечение ВСЕХ подписок этого пользователя (fallback by username if user_id doesn't exist)
      const { data: allSubs } = await supabase
        .from('vpn_subscriptions')
        .select('*')
        .eq('username', sub.username)
        .order('created_at', { ascending: true })

      if (allSubs) {
        setAllSubscriptions(allSubs as Subscription[])
      }

      // 2. Создаем псевдо-профиль из данных подписки
      const prof: Profile = {
        id: sub.id,
        username: sub.username,
        telegram_username: sub.telegram_username || '',
        avatar_color: '#E63950', // Fallback color
        tg_bot_linked: false, // Not currently tracked in new schema
        tg_channel_subscribed: false // Not currently tracked in new schema
      }

      setProfile(prof)

      // 3. Реферальная система временно отключена в новой БД
      setFriends([])
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
