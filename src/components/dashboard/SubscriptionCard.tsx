import { useNavigate } from 'react-router-dom'
import { User, Key } from 'lucide-react'
import { Profile, Subscription } from '../../types'
import { useMouseGlow } from '../../hooks/useMouseGlow'

interface Props {
  profile: Profile
  subscription: Subscription
  allSubscriptions: Subscription[]
}

/**
 * Карточка подписки пользователя (SubscriptionCard).
 * 
 * Особенности:
 * 1. Отображает основную информацию о профиле: имя пользователя, привязанный Telegram.
 * 2. Выводит вкладки для быстрого переключения между доступными подписками пользователя (мультиподписка).
 * 3. Показывает статус активности подписки (дней осталось, дата окончания) и прогресс-бар израсходованного трафика.
 * 
 * @param {Props} props - Параметры компонента
 */
export const SubscriptionCard = ({ profile, subscription, allSubscriptions }: Props) => {
  const navigate = useNavigate()
  const glow = useMouseGlow()

  /**
   * Вычисляет количество оставшихся дней активной подписки.
   */
  const getActiveDays = () => {
    if (!subscription || subscription.status !== 'active') return 0
    const diffTime = new Date(subscription.expires_at).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  /**
   * Возвращает дату окончания подписки в русской локали.
   */
  const getExpiryDateStr = () => {
    if (!subscription) return ''
    return new Date(subscription.expires_at).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  /**
   * Форматирует объем трафика в байтах в человекочитаемый вид (KiB, MiB, GiB, TiB).
   * 
   * @param bytes Объем в байтах
   */
  const formatTraffic = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const activeDays = getActiveDays()
  const expiryDate = getExpiryDateStr()

  // Calc traffic details
  const trafficUsedBytes = Number(subscription.traffic_used)
  const trafficLimitBytes = subscription.traffic_limit ? Number(subscription.traffic_limit) : 0
  const trafficUsedFormatted = formatTraffic(trafficUsedBytes)
  const trafficLimitFormatted = subscription.traffic_limit ? formatTraffic(trafficLimitBytes) : 'Безлимитно'
  const trafficPercent = trafficLimitBytes > 0 ? Math.min(100, Math.round((trafficUsedBytes / trafficLimitBytes) * 100)) : 12

  const red = '#e63950'

  return (
    <div 
      className="sec-profile-card glow-card-cyber" 
      onMouseMove={glow.handleMouseMove}
      onMouseEnter={glow.onMouseEnter}
      onMouseLeave={glow.onMouseLeave}
      style={{ 
        ...glow.style,
        padding: '30px', 
        zIndex: 5 
      }}
    >
      <div className="sec-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="sec-profile-avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(230,57,80,0.1)', border: '1px solid rgba(230,57,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={24} color="#e63950" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="sec-profile-name-text" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-title)' }}>{profile.username}</h2>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
            Telegram: {profile.telegram_username ? `@${profile.telegram_username}` : 'не привязан'}
          </p>
        </div>
      </div>

      {/* Multi-Subscription Tabs */}
      {allSubscriptions.length > 1 && (
        <div style={{ marginTop: '24px', marginBottom: '28px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#fff', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', letterSpacing: '0.5px' }}>
            <Key size={14} color="#e63950" />
            <span>Ваши профили подключения</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
            {allSubscriptions.map((s, index) => {
              const isActive = s.id === subscription?.id
              const limitText = s.traffic_limit ? `${Math.round(s.traffic_limit / (1024 * 1024 * 1024))} ГБ` : 'Безлимит'
              
              return (
                <button
                  key={s.id}
                  onClick={() => { if (!isActive) navigate(`/cabinet/${s.token}`) }}
                  style={{
                    padding: '12px 18px',
                    background: isActive ? 'linear-gradient(135deg, rgba(230,57,80,0.15), rgba(230,57,80,0.02))' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isActive ? 'rgba(230,57,80,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '14px',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '6px',
                    cursor: isActive ? 'default' : 'pointer',
                    minWidth: '150px',
                    boxShadow: isActive ? '0 0 20px rgba(230,57,80,0.15)' : 'none',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isActive && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: '#e63950', boxShadow: '0 0 10px #e63950' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '0.95rem' }}>Устройство {index + 1}</span>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.status === 'active' ? '#22c55e' : '#ef4444', boxShadow: `0 0 8px ${s.status === 'active' ? '#22c55e' : '#ef4444'}` }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: isActive ? '#ff8fa3' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                    {limitText}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="sec-profile-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px', marginBottom: '24px' }}>
        <div 
          className="sec-stat-box" 
          style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', background: 'rgba(255,255,255,0.01)', transition: 'all 0.25s ease', transform: 'translateY(0)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <span className="sec-stat-label" style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Имя пользователя</span>
          <span className="sec-stat-val" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{profile.username}</span>
        </div>

        <div 
          className="sec-stat-box" 
          style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', background: 'rgba(255,255,255,0.01)', transition: 'all 0.25s ease', transform: 'translateY(0)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <span className="sec-stat-label" style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Статус подключения</span>
          {subscription.status === 'active' && activeDays > 0 ? (
            <span className="sec-stat-val" style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></span>
              Активно ({activeDays} дн.)
            </span>
          ) : (
            <span className="sec-stat-val" style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></span>
              Истекло
            </span>
          )}
        </div>

        <div 
          className="sec-stat-box" 
          style={{ border: `1px solid ${subscription.status === 'active' && activeDays > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.25)'}`, borderRadius: '16px', padding: '16px', background: subscription.status === 'active' && activeDays > 0 ? 'rgba(255,255,255,0.01)' : 'rgba(239, 68, 68, 0.05)', transition: 'all 0.25s ease', transform: 'translateY(0)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = subscription.status === 'active' && activeDays > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.4)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = subscription.status === 'active' && activeDays > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <span className="sec-stat-label" style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Истекает</span>
          <span className="sec-stat-val" style={{ fontSize: '1.1rem', fontWeight: 800, color: subscription.status === 'active' && activeDays > 0 ? '#fff' : '#ef4444' }}>
            {expiryDate}
          </span>
        </div>

        <div 
          className="sec-stat-box" 
          style={{ border: '1px solid rgba(230, 57, 80, 0.25)', borderRadius: '16px', padding: '16px', background: 'rgba(230, 57, 80, 0.03)', transition: 'all 0.25s ease', transform: 'translateY(0)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(230,57,80,0.45)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(230, 57, 80, 0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(230, 57, 80, 0.25)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <span className="sec-stat-label" style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Объем трафика</span>
          <span className="sec-stat-val" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e63950' }}>
            {trafficUsedFormatted} / {trafficLimitFormatted}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
          <span>Расход: {trafficUsedFormatted}</span>
          <span>Лимит: {trafficLimitFormatted}</span>
        </div>
        <div className="sec-traffic-bar-bg" style={{ background: 'rgba(255,255,255,0.03)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="sec-traffic-bar-fill" style={{ width: `${trafficPercent}%`, background: red, height: '100%', boxShadow: '0 0 10px rgba(230,57,80,0.5)', borderRadius: '4px' }}></div>
        </div>
      </div>
    </div>
  )
}
