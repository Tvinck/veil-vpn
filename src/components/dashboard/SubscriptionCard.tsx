import { useNavigate } from 'react-router-dom'
import { User, Key } from 'lucide-react'
import { Profile, Subscription } from '../../types'

interface Props {
  profile: Profile
  subscription: Subscription
  allSubscriptions: Subscription[]
}

export const SubscriptionCard = ({ profile, subscription, allSubscriptions }: Props) => {
  const navigate = useNavigate()

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

  return (
    <div className="sec-profile-card">
      <div className="sec-profile-header">
        <div className="sec-profile-avatar">
          <User size={28} color="#e63950" strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-title)' }}>{profile.username}</h2>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            Telegram: {profile.telegram_username ? `@${profile.telegram_username}` : 'не привязан'}
          </p>
        </div>
      </div>

      {/* Multi-Subscription Tabs */}
      {allSubscriptions.length > 1 && (
        <div style={{ marginTop: '24px', marginBottom: '28px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#fff', fontWeight: 700, marginBottom: '16px' }}>
            <Key size={16} color="#e63950" />
            <span>Ваши ключи доступа</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
            {allSubscriptions.map((s, index) => {
              const isActive = s.id === subscription?.id
              const limitText = s.traffic_limit ? `${Math.round(s.traffic_limit / (1024 * 1024 * 1024))} ГБ` : 'Безлимит'
              
              return (
                <button
                  key={s.id}
                  onClick={() => { if (!isActive) navigate(`/${s.token}`) }}
                  style={{
                    padding: '12px 16px',
                    background: isActive ? 'linear-gradient(135deg, rgba(230,57,80,0.15), rgba(230,57,80,0.02))' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isActive ? 'rgba(230,57,80,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '14px',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '6px',
                    cursor: isActive ? 'default' : 'pointer',
                    minWidth: '140px',
                    boxShadow: isActive ? '0 0 20px rgba(230,57,80,0.15)' : 'none',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' } }}
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

      <div className="sec-profile-stats">
        <div className="sec-stat-box">
          <span className="sec-stat-label">Имя пользователя</span>
          <span className="sec-stat-val">{profile.username}</span>
        </div>

        <div className="sec-stat-box">
          <span className="sec-stat-label">Статус</span>
          {subscription.status === 'active' && activeDays > 0 ? (
            <span className="sec-stat-val" style={{ color: '#22c55e' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></span>
              Активна ({activeDays} дн.)
            </span>
          ) : (
            <span className="sec-stat-val" style={{ color: '#ef4444' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></span>
              Истекла
            </span>
          )}
        </div>

        <div className="sec-stat-box" style={{ borderColor: subscription.status === 'active' && activeDays > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(239, 68, 68, 0.3)', background: subscription.status === 'active' && activeDays > 0 ? 'rgba(255,255,255,0.02)' : 'rgba(239, 68, 68, 0.05)' }}>
          <span className="sec-stat-label">Истекает</span>
          <span className="sec-stat-val" style={{ color: subscription.status === 'active' && activeDays > 0 ? '#fff' : '#ef4444' }}>
            {expiryDate}
          </span>
        </div>

        <div className="sec-stat-box" style={{ borderColor: 'rgba(230, 57, 80, 0.3)', background: 'rgba(230, 57, 80, 0.04)' }}>
          <span className="sec-stat-label">Трафик</span>
          <span className="sec-stat-val" style={{ color: '#e63950' }}>
            {trafficUsedFormatted} / {trafficLimitFormatted}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          <span>Расход: {trafficUsedFormatted}</span>
          <span>Лимит: {trafficLimitFormatted}</span>
        </div>
        <div className="sec-traffic-bar-bg">
          <div className="sec-traffic-bar-fill" style={{ width: `${trafficPercent}%` }}></div>
        </div>
      </div>
    </div>
  )
}
