import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Info, ArrowLeft, Send, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

import { useDashboardData } from '../hooks/useDashboardData'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { SubscriptionCard } from './dashboard/SubscriptionCard'
import { ServerList } from './dashboard/ServerList'
import { ActivationCard } from './dashboard/ActivationCard'
import { ReferralProgram } from './dashboard/ReferralProgram'
import { ClientInstructions } from './dashboard/ClientInstructions'
import { SupportChat } from './dashboard/SupportChat'
import { useMouseGlow } from '../hooks/useMouseGlow'

/**
 * Личный кабинет пользователя (Dashboard).
 * 
 * Логика работы:
 * 1. Получает `token` из URL-параметров (например, `/cabinet/:token`).
 * 2. Передает токен хуку `useDashboardData` для загрузки подписок, профиля и рефералов из Supabase.
 * 3. Содержит обработчики выполнения Telegram Квестов (привязка бота и подписка на канал):
 *    - Запускает редирект на Telegram бот / канал.
 *    - Вызывает RPC-функции базы данных `claim_tg_bot_bonus` и `claim_tg_channel_bonus` для начисления дней подписки (+10 дней).
 * 4. Компонует карточку подписки, форму активации промокодов, реферальную программу и инструкции к клиентам.
 */
export default function Dashboard() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const glow = useMouseGlow()

  const {
    loading,
    errorMsg,
    profile,
    subscription,
    allSubscriptions,
    friends,
    fetchUserData
  } = useDashboardData(token)

  // ─── Quests States ───────────────────────────────────────────────────────────
  const [linkingBot, setLinkingBot] = useState(false)
  const [subscribingChannel, setSubscribingChannel] = useState(false)
  const [tgBonusMsg, setTgBonusMsg] = useState<string | null>(null)

  const handleLinkBot = async () => {
    if (!profile || !subscription) return
    if (profile.tg_bot_linked) return

    setLinkingBot(true)
    setTgBonusMsg(null)
    try {
      window.open('https://t.me/Veil_Vps_bot?start=' + token, '_blank')
      const { data: success, error } = await supabase.rpc('claim_tg_bot_bonus', {
        p_sub_id: subscription.id,
        p_profile_id: profile.id
      })
      if (error) throw error

      if (success) {
        await fetchUserData()
        setTgBonusMsg('Бот успешно запущен! Вам начислено +10 дней к подписке.')
      } else {
        setTgBonusMsg('Бонус уже был получен ранее.')
      }
      setTimeout(() => setTgBonusMsg(null), 5000)
    } catch (err) {
      console.error(err)
      setTgBonusMsg('Ошибка при активации бонуса')
      setTimeout(() => setTgBonusMsg(null), 3000)
    } finally {
      setLinkingBot(false)
    }
  }

  const handleSubscribeChannel = async () => {
    if (!profile || !subscription) return
    if (profile.tg_channel_subscribed) return

    setSubscribingChannel(true)
    setTgBonusMsg(null)
    try {
      window.open('https://t.me/+tSeFgs6ymno0YjQy', '_blank')
      const { data: success, error } = await supabase.rpc('claim_tg_channel_bonus', {
        p_sub_id: subscription.id,
        p_profile_id: profile.id
      })
      if (error) throw error

      if (success) {
        await fetchUserData()
        setTgBonusMsg('Вы подписались на канал! Начислено +10 дней к подписке.')
      } else {
        setTgBonusMsg('Бонус уже был получен ранее.')
      }
      setTimeout(() => setTgBonusMsg(null), 5000)
    } catch (err) {
      console.error(err)
      setTgBonusMsg('Ошибка при активации бонуса')
      setTimeout(() => setTgBonusMsg(null), 3000)
    } finally {
      setSubscribingChannel(false)
    }
  }

  // 1. LOADING VIEW
  if (loading) {
    return (
      <div className="sec-dash-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#030307' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <Loader2 size={44} className="animate-spin" color="#e63950" />
          <h3 style={{ fontFamily: 'var(--font-cyber)', color: '#fff', fontSize: '1.05rem', letterSpacing: '2px', fontWeight: 800 }}>
            СИНХРОНИЗАЦИЯ ПРОФИЛЯ...
          </h3>
        </div>
      </div>
    )
  }

  // 2. ERROR VIEW
  if (errorMsg || !profile || !subscription) {
    return (
      <div className="sec-dash-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#030307', padding: '20px' }}>
        <div className="sec-dash-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid rgba(230,57,80,0.25)', padding: '40px 30px', borderRadius: '24px', background: 'rgba(255,255,255,0.01)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <Info size={44} color="#e63950" style={{ margin: '0 auto 24px' }} />
          <h3 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 900, marginBottom: '14px', fontFamily: 'var(--font-title)' }}>Ошибка доступа</h3>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginBottom: '28px', lineHeight: 1.5 }}>
            {errorMsg || 'Не удалось загрузить данные личного кабинета.'}
          </p>
          <button className="btn-red-primary" onClick={() => navigate('/')} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> На главную страницу
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sec-dash-container" style={{ background: '#030307', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <div className="cyber-grid" />
      <div className="sec-dash-ambient-1" style={{ zIndex: 1 }}></div>
      <div className="sec-dash-ambient-2" style={{ zIndex: 1 }}></div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <DashboardHeader />

      <main className="sec-dash-main" style={{ padding: '40px 8%', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <SubscriptionCard 
          profile={profile} 
          subscription={subscription} 
          allSubscriptions={allSubscriptions} 
        />

        <ServerList />

        <div className="sec-dash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginTop: '32px', marginBottom: '48px' }}>
          <ActivationCard 
            subscription={subscription} 
            fetchUserData={fetchUserData} 
          />

          <ReferralProgram 
            profile={profile} 
            friends={friends} 
          />

            {/* Quests Card */}
            <div 
              className="sec-dash-card glow-card-cyber" 
              onMouseMove={glow.handleMouseMove}
              onMouseEnter={glow.onMouseEnter}
              onMouseLeave={glow.onMouseLeave}
              style={{ 
                ...glow.style,
                padding: '28px', 
                zIndex: 5 
              }}
            >
              <div className="sec-dash-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="sec-dash-icon-box" style={{ background: 'rgba(230,57,80,0.12)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} color="#e63950" strokeWidth={2.5} />
                </div>
                <h3 className="sec-dash-title" style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>Квесты Telegram</h3>
              </div>
              <p className="sec-dash-desc" style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.45, marginBottom: '24px' }}>
                Выполняйте задания в нашем боте и получайте дополнительные дни бесплатного подключения моментально на баланс!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div 
                  className={`sec-task-item ${profile.tg_bot_linked ? 'sec-task-item-done' : ''}`} 
                  style={{ 
                    background: profile.tg_bot_linked ? 'rgba(230,57,80,0.04)' : 'rgba(255,255,255,0.02)', 
                    border: `1px solid ${profile.tg_bot_linked ? 'rgba(230,57,80,0.25)' : 'rgba(255,255,255,0.06)'}`, 
                    borderRadius: '16px', 
                    padding: '16px', 
                    transition: 'all 0.3s ease' 
                  }}
                >
                  <div className="sec-task-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 className="sec-task-title" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>Подключение бота</h4>
                    <span className="sec-badge-red" style={{ fontSize: '0.72rem', background: 'rgba(230,57,80,0.15)', color: '#ff7085', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>+10 дней</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.45, marginBottom: '12px' }}>
                    Запустите нашего бота @Veil_Vps_bot. Он будет сообщать об окончании подписки и новых серверах.
                  </p>
                  {profile.tg_bot_linked ? (
                    <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} /> Выполнено
                    </div>
                  ) : (
                    <button onClick={handleLinkBot} disabled={linkingBot} className="btn-ghost-cta" style={{ padding: '8px 14px', fontSize: '0.8rem', justifyContent: 'center', width: 'fit-content' }}>
                      {linkingBot ? <Loader2 size={14} className="animate-spin" /> : 'Запустить бота'}
                    </button>
                  )}
                </div>

                <div 
                  className={`sec-task-item ${profile.tg_channel_subscribed ? 'sec-task-item-done' : ''}`} 
                  style={{ 
                    background: profile.tg_channel_subscribed ? 'rgba(230,57,80,0.04)' : 'rgba(255,255,255,0.02)', 
                    border: `1px solid ${profile.tg_channel_subscribed ? 'rgba(230,57,80,0.25)' : 'rgba(255,255,255,0.06)'}`, 
                    borderRadius: '16px', 
                    padding: '16px', 
                    transition: 'all 0.3s ease' 
                  }}
                >
                  <div className="sec-task-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 className="sec-task-title" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>Подписка на канал</h4>
                    <span className="sec-badge-red" style={{ fontSize: '0.72rem', background: 'rgba(230,57,80,0.15)', color: '#ff7085', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>+10 дней</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.45, marginBottom: '12px' }}>
                    Подпишитесь на наш закрытый новостной канал. Будьте в курсе акций и обновлений приложения.
                  </p>
                  {profile.tg_channel_subscribed ? (
                    <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} /> Выполнено
                    </div>
                  ) : (
                    <button onClick={handleSubscribeChannel} disabled={subscribingChannel} className="btn-ghost-cta" style={{ padding: '8px 14px', fontSize: '0.8rem', justifyContent: 'center', width: 'fit-content' }}>
                      {subscribingChannel ? <Loader2 size={14} className="animate-spin" /> : 'Подписаться'}
                    </button>
                  )}
                </div>
              </div>
            
            {tgBonusMsg && (
              <div style={{ color: '#22c55e', fontSize: '0.85rem', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.1)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Check size={16} /> {tgBonusMsg}
              </div>
            )}
          </div>
        </div>

        <ClientInstructions subscription={subscription} />
      </main>
      
      <SupportChat profileId={profile.id} />
      </div>
    </div>
  )
}
