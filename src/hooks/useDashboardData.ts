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
        .from('subscriptions')
        .select('*')
        .eq('token', token)
        .single()

      if (subErr || !sub) {
        setErrorMsg('Личный кабинет по этому токену не найден. Проверьте правильность вашей ссылки.')
        setLoading(false)
        return
      }

      setSubscription(sub as Subscription)

      // 1.5 Извлечение ВСЕХ подписок этого пользователя
      const { data: allSubs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', sub.user_id)
        .order('created_at', { ascending: true })

      if (allSubs) {
        setAllSubscriptions(allSubs as Subscription[])
      }

      // 2. Извлечение связанного профиля пользователя
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sub.user_id)
        .single()

      if (profErr || !prof) {
        setErrorMsg('Профиль пользователя не существует в базе данных.')
        setLoading(false)
        return
      }

      setProfile(prof as Profile)

      // 3. Fetch Referrals where user is referrer_id
      const { data: refs, error: refsErr } = await supabase
        .from('referrals')
        .select(`
          status,
          bonus_days,
          referred:profiles!referred_id (
            username
          )
        `)
        .eq('referrer_id', sub.user_id)

      if (!refsErr && refs) {
        const formattedFriends: Friend[] = refs.map((r: any) => ({
          name: r.referred?.username || 'Анонимный друг',
          status: r.status as 'active' | 'pending',
          bonus: r.status === 'active' ? `+${r.bonus_days} дней бесплатного VPN` : 'Ожидает покупки'
        }))
        setFriends(formattedFriends)
      } else {
        setFriends([])
      }
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
