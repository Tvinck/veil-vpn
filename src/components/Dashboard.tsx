import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Info, ArrowLeft, Send, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

import { useDashboardData } from '../hooks/useDashboardData'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { SubscriptionCard } from './dashboard/SubscriptionCard'
import { ActivationCard } from './dashboard/ActivationCard'
import { ReferralProgram } from './dashboard/ReferralProgram'
import { ClientInstructions } from './dashboard/ClientInstructions'
import { SupportChat } from './dashboard/SupportChat'

export default function Dashboard() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

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
        setTgBonusMsg('Бот успешно запущен! Вам начислено +10 дней VPN.')
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
        setTgBonusMsg('Вы подписались на канал! Начислено +10 дней VPN.')
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
      <div className="sec-dash-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <Loader2 size={48} className="animate-spin" color="#e63950" />
          <h3 style={{ fontFamily: 'var(--font-cyber)', color: '#fff', fontSize: '1.2rem', letterSpacing: '1px' }}>
            СИНХРОНИЗАЦИЯ...
          </h3>
        </div>
      </div>
    )
  }

  // 2. ERROR VIEW
  if (errorMsg || !profile || !subscription) {
    return (
      <div className="sec-dash-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="sec-dash-card" style={{ maxWidth: '480px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <Info size={40} color="#e63950" style={{ margin: '0 auto 20px' }} />
          <h3 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 900, marginBottom: '16px' }}>Ошибка доступа</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '28px' }}>{errorMsg || 'Не удалось загрузить данные личного кабинета.'}</p>
          <button className="btn-red-primary" onClick={() => navigate('/')} style={{ width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={16} /> Вернуться на главную
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sec-dash-container">
      <div className="sec-dash-ambient-1"></div>
      <div className="sec-dash-ambient-2"></div>

      <DashboardHeader />

      <main className="sec-dash-main">
        <SubscriptionCard 
          profile={profile} 
          subscription={subscription} 
          allSubscriptions={allSubscriptions} 
        />

        <div className="sec-dash-grid">
          <ActivationCard 
            subscription={subscription} 
            fetchUserData={fetchUserData} 
          />

          <ReferralProgram 
            profile={profile} 
            friends={friends} 
          />

          {/* Quests */}
          <div className="sec-dash-card">
            <div className="sec-dash-card-header">
              <div className="sec-dash-icon-box"><Send size={20} color="#e63950" strokeWidth={2.5} /></div>
              <h3 className="sec-dash-title">Квесты Telegram</h3>
            </div>
            <p className="sec-dash-desc">Выполняйте задания и получайте бонусные дни бесплатного VPN на ваш счет моментально!</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={`sec-task-item ${profile.tg_bot_linked ? 'sec-task-item-done' : ''}`}>
                <div className="sec-task-header">
                  <h4 className="sec-task-title">Подключение бота</h4>
                  <span className="sec-badge-red">+10 дней</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>Запустите нашего бота @Veil_Vps_bot. Он будет сообщать об окончании подписки и новых серверах.</p>
                {profile.tg_bot_linked ? (
                  <div style={{ color: '#e63950', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> Выполнено</div>
                ) : (
                  <button onClick={handleLinkBot} disabled={linkingBot} className="btn-ghost-cta" style={{ padding: '8px 14px', fontSize: '0.8rem', justifyContent: 'center' }}>
                    {linkingBot ? <Loader2 size={14} className="animate-spin" /> : 'Запустить бота'}
                  </button>
                )}
              </div>

              <div className={`sec-task-item ${profile.tg_channel_subscribed ? 'sec-task-item-done' : ''}`}>
                <div className="sec-task-header">
                  <h4 className="sec-task-title">Подписка на канал</h4>
                  <span className="sec-badge-red">+10 дней</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>Подпишитесь на наш закрытый новостной канал. Будьте в курсе акций и обновлений приложения.</p>
                {profile.tg_channel_subscribed ? (
                  <div style={{ color: '#e63950', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> Выполнено</div>
                ) : (
                  <button onClick={handleSubscribeChannel} disabled={subscribingChannel} className="btn-ghost-cta" style={{ padding: '8px 14px', fontSize: '0.8rem', justifyContent: 'center' }}>
                    {subscribingChannel ? <Loader2 size={14} className="animate-spin" /> : 'Подписаться'}
                  </button>
                )}
              </div>
            </div>
            
            {tgBonusMsg && (
              <div style={{ color: '#22c55e', fontSize: '0.85rem', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> {tgBonusMsg}</div>
            )}
          </div>
        </div>

        <ClientInstructions subscription={subscription} />
      </main>
      
      <SupportChat profileId={profile.id} />
    </div>
  )
}
