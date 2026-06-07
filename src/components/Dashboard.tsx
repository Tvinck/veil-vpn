import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  Shield, 
  Send, 
  User, 
  Download, 
  Plus, 
  Copy, 
  Check, 
  ArrowLeft,
  ChevronDown,
  Monitor,
  Info,
  Gift,
  Ticket,
  ChevronRight,
  Loader2,
  CloudDownload,
  Settings,
  ExternalLink,
  Apple,
  Bot,
  Terminal,
  Tv,
  Key
} from 'lucide-react'

/** Доступные VPN-клиенты */
type ClientApp = string

/** Доступные операционные системы для инструкций */
type OS = 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Linux' | 'Android TV' | 'Apple TV'

/** Описание строки приглашенного друга в реферальной системе */
interface Friend {
  /** Имя пользователя друга */
  name: string
  /** Статус покупки (активный или ожидающий) */
  status: 'active' | 'pending'
  /** Текстовое описание бонуса */
  bonus: string
}

/**
 * Компонент личного кабинета клиента Veil VPN.
 * Отображает остаток дней подписки, трафик, форму ввода промокодов, реферальную ссылку
 * и панель установки инструкций клиентов, а также предоставляет Telegram квесты для продления подписки.
 */
export default function Dashboard() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  // ─── Динамические состояния базы данных ──────────────────────────────────────────
  
  /** Флаг загрузки первичных данных */
  const [loading, setLoading] = useState(true)
  /** Сообщение об ошибке доступа */
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  /** Профиль авторизованного клиента */
  const [profile, setProfile] = useState<{ 
    id: string; 
    username: string; 
    telegram_username: string; 
    avatar_color: string;
    tg_bot_linked?: boolean;
    tg_channel_subscribed?: boolean;
  } | null>(null)
  /** Модель текущей подписки клиента */
  const [subscription, setSubscription] = useState<{ id: string; status: string; expires_at: string; traffic_used: number; traffic_limit: number | null; subscription_key: string; token: string } | null>(null)
  /** Все подписки пользователя */
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([])
  /** Список привлеченных рефералов */
  const [friends, setFriends] = useState<Friend[]>([])

  // ─── Состояния интерактивного интерфейса ───────────────────────────────────────
  
  /** Флаг успешного копирования VLESS-ключа в буфер */
  const [copiedKey, setCopiedKey] = useState(false)
  /** Флаг успешного копирования реферальной ссылки */
  const [copiedRef, setCopiedRef] = useState(false)
  /** Открыт ли выпадающий список операционных систем */
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  /** Выбранный в данный момент VPN-клиент */
  const [selectedClient, setSelectedClient] = useState<ClientApp>('Happ')
  /** Выбранная в данный момент операционная система */
  const [selectedOS, setSelectedOS] = useState<OS>('Windows')
  
  // ─── Реферальные коды и квесты ────────────────────────────────────────────────
  
  /** Поле ввода кода активации */
  const [activationCode, setActivationCode] = useState('')
  /** Статус активации промокода */
  const [activationStatus, setActivationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  /** Выполняется ли запрос привязки бота */
  const [linkingBot, setLinkingBot] = useState(false)
  /** Выполняется ли запрос подписки на канал */
  const [subscribingChannel, setSubscribingChannel] = useState(false)
  /** Уведомление об успешном начислении бонуса */
  const [tgBonusMsg, setTgBonusMsg] = useState<string | null>(null)

  /**
   * Асинхронно запрашивает данные пользователя из Supabase по предоставленному токену.
   * Получает подписку, профиль и рефералов, агрегируя их в соответствующие стейты.
   */
  const fetchUserData = async () => {
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

      setSubscription(sub)

      // 1.5 Извлечение ВСЕХ подписок этого пользователя
      const { data: allSubs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', sub.user_id)
        .order('created_at', { ascending: true })

      if (allSubs) {
        setAllSubscriptions(allSubs)
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

      setProfile(prof)

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
  }

  useEffect(() => {
    fetchUserData()
  }, [token])

  /**
   * Обработчик активации промокода или ключа продления подписки.
   * Увеличивает expires_at подписки на 30 дней в базе данных.
   */
  const handleActivateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activationCode.trim() || !subscription) return

    const code = activationCode.toUpperCase().trim()

    // Валидный код начинается с 'VEIL-' или длиннее 8 символов
    if (code.startsWith('VEIL-') || code.length >= 8) {
      try {
        const currentExpiry = new Date(subscription.expires_at)
        const baseDate = currentExpiry.getTime() > new Date().getTime() ? currentExpiry : new Date()
        const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 дней

        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            expires_at: newExpiry.toISOString(),
            status: 'active'
          })
          .eq('id', subscription.id)

        if (error) throw error

        setActivationStatus('success')
        setActivationCode('')
        await fetchUserData() // Перезагрузка данных профиля
        setTimeout(() => setActivationStatus('idle'), 5000)
      } catch (err) {
        console.error('Ошибка при активации:', err)
        setActivationStatus('error')
        setTimeout(() => setActivationStatus('idle'), 3000)
      }
    } else {
      setActivationStatus('error')
      setTimeout(() => setActivationStatus('idle'), 3000)
    }
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
   * Копирует VLESS-ключ подписки в буфер обмена.
   */
  const handleCopyKey = () => {
    if (!subscription) return
    navigator.clipboard.writeText(subscription.subscription_key)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  /**
   * Копирует персональную реферальную ссылку в буфер обмена.
   */
  const handleCopyRef = () => {
    if (!profile) return
    const refLink = `https://veilvpn.net/ref/${profile.username}`
    navigator.clipboard.writeText(refLink)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  /**
   * Квест: Открывает Telegram-бота для привязки аккаунта.
   * Начисляет +10 бонусных дней к подписке.
   */
  const handleLinkBot = async () => {
    if (!profile || !subscription) return
    if (profile.tg_bot_linked) return

    setLinkingBot(true)
    setTgBonusMsg(null)
    try {
      // 1. Открытие бота
      window.open('https://t.me/Veil_Vps_bot?start=' + token, '_blank')

      // 2. Начисление +10 дней
      const currentExpiry = new Date(subscription.expires_at)
      const baseDate = currentExpiry.getTime() > new Date().getTime() ? currentExpiry : new Date()
      const newExpiry = new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000)

      const { error: subErr } = await supabase
        .from('subscriptions')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', subscription.id)

      if (subErr) throw subErr

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ tg_bot_linked: true })
        .eq('id', profile.id)

      if (profErr) throw profErr

      setProfile(prev => prev ? { ...prev, tg_bot_linked: true } : null)
      setSubscription(prev => prev ? { ...prev, expires_at: newExpiry.toISOString() } : null)
      setTgBonusMsg('Бот успешно запущен! Вам начислено +10 дней VPN.')
      setTimeout(() => setTgBonusMsg(null), 5000)
    } catch (err) {
      console.error(err)
      setTgBonusMsg('Ошибка при активации бонуса')
      setTimeout(() => setTgBonusMsg(null), 3000)
    } finally {
      setLinkingBot(false)
    }
  }

  /**
   * Квест: Открывает Telegram-канал и проверяет подписку.
   * Начисляет +10 бонусных дней к подписке.
   */
  const handleSubscribeChannel = async () => {
    if (!profile || !subscription) return
    if (profile.tg_channel_subscribed) return

    setSubscribingChannel(true)
    setTgBonusMsg(null)
    try {
      // 1. Открытие ссылки на канал
      window.open('https://t.me/+tSeFgs6ymno0YjQy', '_blank')

      // 2. Начисление +10 дней
      const currentExpiry = new Date(subscription.expires_at)
      const baseDate = currentExpiry.getTime() > new Date().getTime() ? currentExpiry : new Date()
      const newExpiry = new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000)

      const { error: subErr } = await supabase
        .from('subscriptions')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', subscription.id)

      if (subErr) throw subErr

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ tg_channel_subscribed: true })
        .eq('id', profile.id)

      if (profErr) throw profErr

      setProfile(prev => prev ? { ...prev, tg_channel_subscribed: true } : null)
      setSubscription(prev => prev ? { ...prev, expires_at: newExpiry.toISOString() } : null)
      setTgBonusMsg('Вы подписались на канал! Начислено +10 дней VPN.')
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

  const activeDays = getActiveDays()
  const expiryDate = getExpiryDateStr()

  // Calc traffic details
  const trafficUsedBytes = Number(subscription.traffic_used)
  const trafficLimitBytes = subscription.traffic_limit ? Number(subscription.traffic_limit) : 0
  const trafficUsedFormatted = formatTraffic(trafficUsedBytes)
  const trafficLimitFormatted = subscription.traffic_limit ? formatTraffic(trafficLimitBytes) : 'Безлимитно'
  const trafficPercent = trafficLimitBytes > 0 ? Math.min(100, Math.round((trafficUsedBytes / trafficLimitBytes) * 100)) : 12

  return (
    <div className="sec-dash-container">
      {/* Ambient backgrounds */}
      <div className="sec-dash-ambient-1"></div>
      <div className="sec-dash-ambient-2"></div>

      {/* Header */}
      <header className="sec-dash-header">
        <button onClick={() => navigate('/')} className="sec-dash-back-btn">
          <ArrowLeft size={16} />
          <span className="mobile-hide">Вернуться на сайт</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: '#e63950', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(230,57,80,0.55)' }}>
            <Shield size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>
            VEIL<span style={{ color: '#e63950' }}>VPN</span>
          </span>
        </div>
        <a href="https://t.me/Veil_Vps_bot" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.6)', transition: 'color 0.2s' }} title="Поддержка в Telegram" onMouseEnter={e => e.currentTarget.style.color = '#e63950'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
          <Send size={20} />
        </a>
      </header>

      <main className="sec-dash-main">
        {/* Profile Card */}
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

        {/* Action Columns */}
        <div className="sec-dash-grid">
          {/* Extend Subscription */}
          <div className="sec-dash-card">
            <div className="sec-dash-card-header">
              <div className="sec-dash-icon-box"><Ticket size={20} color="#e63950" strokeWidth={2.5} /></div>
              <h3 className="sec-dash-title">Продлить подписку</h3>
            </div>
            <p className="sec-dash-desc">Купили код продления (VPN-ключ) на сторонней площадке? Введите его ниже для мгновенной активации дней.</p>

            <form onSubmit={handleActivateCode} className="sec-input-group" style={{ marginBottom: '16px' }}>
              <input type="text" placeholder="VEIL-XXXXXX" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} className="sec-input" />
              <button type="submit" className="sec-input-btn">Активировать</button>
            </form>

            {activationStatus === 'success' && (
              <div style={{ color: '#22c55e', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> Код успешно активирован!</div>
            )}
            {activationStatus === 'error' && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px' }}>Неверный код. Проверьте правильность ввода.</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: 'auto' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Нет кода продления?</span>
              <button className="btn-ghost-cta" onClick={() => navigate('/checkout')} style={{ justifyContent: 'space-between', padding: '10px 16px' }}>
                <span>Купить новый ключ</span><ChevronRight size={14} />
              </button>
              <a href="https://t.me/Veil_Vps_bot" target="_blank" rel="noreferrer" className="btn-ghost-cta" style={{ justifyContent: 'space-between', padding: '10px 16px', textDecoration: 'none' }}>
                <span>Продлить через Telegram-бот</span><ChevronRight size={14} />
              </a>
            </div>
          </div>

          {/* Referral System */}
          <div className="sec-dash-card">
            <div className="sec-dash-card-header">
              <div className="sec-dash-icon-box"><Gift size={20} color="#e63950" strokeWidth={2.5} /></div>
              <h3 className="sec-dash-title">Пригласить друга</h3>
            </div>
            <p className="sec-dash-desc">Когда ваш друг зарегистрируется и купит любую подписку, вы оба получите 30 дней VPN бесплатно!</p>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ваша ссылка:</span>
              <div className="sec-input-group">
                <input type="text" readOnly value={`https://veilvpn.net/ref/${profile.username}`} className="sec-input" style={{ color: '#e63950' }} />
                <button onClick={handleCopyRef} className="sec-input-btn">
                  {copiedRef ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', flexGrow: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Ваша команда ({friends.length}):</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                {friends.length > 0 ? (
                  friends.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: f.status === 'active' ? '#22c55e' : '#e63950', boxShadow: f.status === 'active' ? '0 0 8px #22c55e' : '0 0 8px #e63950' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.name}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: f.status === 'active' ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>{f.bonus}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', marginTop: '10px' }}>Нет приглашенных друзей.</div>
                )}
              </div>
            </div>
          </div>

          {/* Quests */}
          <div className="sec-dash-card">
            <div className="sec-dash-card-header">
              <div className="sec-dash-icon-box"><Send size={20} color="#e63950" strokeWidth={2.5} /></div>
              <h3 className="sec-dash-title">Квесты Telegram</h3>
            </div>
            <p className="sec-dash-desc">Выполняйте задания и получайте бонусные дни бесплатного VPN на ваш счет моментально!</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Task 1 */}
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

              {/* Task 2 */}
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

        {/* Install Panel */}
        <div style={{ padding: '0px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-title)' }}>Установка</h3>
            
            {/* OS Selector */}
            <div style={{ position: 'relative', width: '160px' }}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedOS === 'iOS' || selectedOS === 'macOS' ? <Apple size={16} color="rgba(255,255,255,0.6)" /> : selectedOS === 'Android' ? <Bot size={16} color="rgba(255,255,255,0.6)" /> : selectedOS === 'Linux' ? <Terminal size={16} color="rgba(255,255,255,0.6)" /> : selectedOS === 'Android TV' || selectedOS === 'Apple TV' ? <Tv size={16} color="rgba(255,255,255,0.6)" /> : <Monitor size={16} color="rgba(255,255,255,0.6)" />}
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedOS}</span>
                </div>
                <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              
              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#181b21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  {(['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Android TV', 'Apple TV'] as OS[]).map((os) => (
                    <div key={os} onClick={() => { 
                      setSelectedOS(os); 
                      setIsDropdownOpen(false);
                      if (os === 'iOS') setSelectedClient('Happ');
                      else if (os === 'Android') setSelectedClient('Happ');
                      else if (os === 'Linux') setSelectedClient('FIClashX');
                      else if (os === 'Windows') setSelectedClient('Happ');
                      else if (os === 'Android TV') setSelectedClient('Happ');
                      else if (os === 'Apple TV') setSelectedClient('Happ');
                      else setSelectedClient('Happ');
                    }}
                      style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: selectedOS === os ? '#fff' : 'rgba(255,255,255,0.7)', background: selectedOS === os ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedOS === os ? 'rgba(255,255,255,0.1)' : 'transparent'}
                    >
                      {os}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {(() => {
              let clients: ClientApp[] = [];
              if (selectedOS === 'Windows') clients = ['Happ', 'FIClashX', 'Koala Clash', 'Prizrak-Box'];
              else if (selectedOS === 'macOS') clients = ['Happ', 'FIClashX', 'Koala Clash', 'Prizrak-Box'];
              else if (selectedOS === 'iOS') clients = ['Happ', 'Stash', 'Shadowrocket', 'Streisand'];
              else if (selectedOS === 'Android') clients = ['Happ', 'FIClashX', 'Clash Meta', 'v2rayNG'];
              else if (selectedOS === 'Linux') clients = ['FIClashX', 'Koala Clash', 'Prizrak-Box'];
              else if (selectedOS === 'Android TV') clients = ['Happ', 'vpn4tv'];
              else if (selectedOS === 'Apple TV') clients = ['Happ', 'Shadowrocket', 'Stash'];
              else clients = ['Happ'];

              return clients.map((client) => {
                const isActive = selectedClient === client;
                const dotColor = client === 'Happ' ? '#fbbf24' : '#14b8a6';
                return (
                  <button key={client} onClick={() => setSelectedClient(client)}
                    style={{
                      position: 'relative',
                      padding: '16px 24px',
                      background: isActive ? 'linear-gradient(to right, rgba(20, 184, 166, 0.15), rgba(20, 184, 166, 0.05))' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? 'rgba(20, 184, 166, 0.5)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: '12px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-title)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, boxShadow: isActive ? `0 0 8px ${dotColor}` : 'none' }}></div>
                    <span style={{ zIndex: 1 }}>{client}</span>
                    {/* Subtle watermark background based on client */}
                    {client === 'Happ' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.1, fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>H</div>}
                    {client === 'FIClashX' && <div style={{ position: 'absolute', right: '-5px', opacity: 0.1, fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>X</div>}
                    {client === 'Koala Clash' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.05, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>🐨</div>}
                    {client === 'Prizrak-Box' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.08, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>👻</div>}
                    {client === 'Stash' && <div style={{ position: 'absolute', right: '-5px', opacity: 0.1, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>⚛️</div>}
                    {client === 'Shadowrocket' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.08, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>🚀</div>}
                    {client === 'Streisand' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.08, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>🧊</div>}
                    {client === 'Clash Meta' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.05, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>🐱</div>}
                    {client === 'v2rayNG' && <div style={{ position: 'absolute', right: '-5px', opacity: 0.08, fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>V</div>}
                    {client === 'vpn4tv' && <div style={{ position: 'absolute', right: '0px', opacity: 0.06, fontSize: '1.4rem', fontWeight: 900, color: '#fff', textAlign: 'right', lineHeight: 0.8 }}>VPN<br/>4TV</div>}
                  </button>
                )
              });
            })()}
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
              const installSteps = [];
              if (selectedOS === 'macOS') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'App Store (RU)', iconType: 'external', primary: false }, { label: 'App Store (Global)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                } else if (selectedClient === 'FIClashX') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'macOS (Apple Silicon)', iconType: 'external', primary: false }, { label: 'macOS (Intel)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FIClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.' }
                  );
                } else if (selectedClient === 'Koala Clash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'macOS (Apple Silicon)', iconType: 'external', primary: false }, { label: 'macOS (Intel)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash. ⚠️ Предупреждение: Если при запуске приложения на macOS появляется уведомление, что приложение повреждено, выполните эту команду в терминале: sudo xattr -r -c /Applications/Koala\\ Clash.app' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.' }
                  );
                } else if (selectedClient === 'Prizrak-Box') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Скачайте архив под ваш чип (Apple Silicon или Intel), распакуйте и переместите Prizrak-Box.app в Applications.', buttons: [{ label: 'macOS (Apple Silicon)', iconType: 'external', primary: false }, { label: 'macOS (Intel)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Прочти перед первым запуском', desc: 'Если macOS показывает предупреждения безопасности — следуйте инструкции.', buttons: [{ label: 'Инструкция для Mac', iconType: 'external', primary: false }] },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку «Получить ссылку» в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел «Профили», нажмите кнопку «+», вставьте скопированную ссылку и нажмите «Подтвердить».', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.' }
                  );
                }
              } else if (selectedOS === 'Android TV') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.', buttons: [{ label: 'Открыть в Google Play', iconType: 'external', primary: false }, { label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'settings', title: 'Инструкции по установке', desc: 'Подробные инструкции, чтобы помочь вам настроить Happ на вашем устройстве.', buttons: [{ label: 'На русском', iconType: 'external', primary: false }, { label: 'На английском', iconType: 'external', primary: false }] },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Откройте приложение и подключитесь к серверу' }
                  );
                } else if (selectedClient === 'vpn4tv') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.', buttons: [{ label: 'Открыть в Google Play', iconType: 'external', primary: false }, { label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'settings', title: 'Инструкции по установке', desc: 'Подробные инструкции, чтобы помочь вам настроить VPN4TV на вашем устройстве.', buttons: [{ label: 'Краткое руководство', iconType: 'external', primary: false }, { label: 'Инструкция для Sber Box', iconType: 'external', primary: false }] },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Откройте приложение и подключитесь к серверу' }
                  );
                }
              } else if (selectedOS === 'Apple TV') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store на Apple TV и установите приложение. Запустите его, предоставьте разрешение на VPN-конфигурацию, если потребуется, и введите свой пароль.', buttons: [{ label: 'App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'settings', title: 'Инструкции по установке', desc: 'Подробные инструкции, чтобы помочь вам настроить Happ на вашем устройстве.', buttons: [{ label: 'На русском', iconType: 'external', primary: false }, { label: 'На английском', iconType: 'external', primary: false }] },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Откройте приложение и подключитесь к серверу' }
                  );
                } else if (selectedClient === 'Shadowrocket') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.', buttons: [{ label: 'Открыть в App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                } else if (selectedClient === 'Stash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение.', buttons: [{ label: 'Открыть в App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение Stash откроется, и конфигурация будет добавлена автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'На главном экране нажмите кнопку «Запуск». В появившемся окне разрешите добавление конфигураций VPN. После активации профиля перейдите в раздел «Политика» и выберите страну подключения.' }
                  );
                }
              } else if (selectedOS === 'iOS') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.', buttons: [{ label: 'App Store (RU)', iconType: 'external', primary: false }, { label: 'App Store (Global)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                } else if (selectedClient === 'Stash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение.', buttons: [{ label: 'Открыть в App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение Stash откроется, и конфигурация будет добавлена автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'На главном экране нажмите кнопку «Запуск». В появившемся окне разрешите добавление конфигураций VPN. После активации профиля перейдите в раздел «Политика» и выберите страну подключения.' }
                  );
                } else {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.', buttons: [{ label: 'Открыть в App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                }
              } else if (selectedOS === 'Android') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.', buttons: [{ label: 'Открыть в Google Play', iconType: 'external', primary: false }, { label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'Откройте приложение и подключитесь к серверу' }
                  );
                } else if (selectedClient === 'FIClashX') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Скачайте и установите FIClashX APK', buttons: [{ label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FIClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.' }
                  );
                } else if (selectedClient === 'Clash Meta') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Скачайте и установите Clash Meta APK', buttons: [{ label: 'Скачать APK', iconType: 'external', primary: false }, { label: 'Открыть в F-Droid', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — откроется окно создания профиля. Тебе потребуется указать период автообновления, например, 720 минут. Справа вверху нажми на кнопку Сохранить.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'Перейди в пункт Профили и выбери созданный профиль, затем вернись на главную страницу. Теперь ты можешь подключиться, нажав на кнопку Остановлен' }
                  );
                } else if (selectedClient === 'v2rayNG') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Скачайте и установите v2rayNG APK', buttons: [{ label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Обновление подписки', desc: 'Нажмите на три точечки справа сверху и выберите Обновить подписку. После этого в списке появятся доступные серверы' },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите требуемый сервер и нажмите кнопку Включить в правом нижнем углу' }
                  );
                }
              } else if (selectedOS === 'Linux') {
                if (selectedClient === 'FIClashX') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'amd64 (.deb)', iconType: 'external', primary: false }, { label: 'amd64 (AppImage)', iconType: 'external', primary: false }, { label: 'amd64 (.rpm)', iconType: 'external', primary: false }, { label: 'arm64 (.deb)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FIClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.' }
                  );
                } else if (selectedClient === 'Koala Clash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'amd64 (.deb)', iconType: 'external', primary: false }, { label: 'amd64 (.rpm)', iconType: 'external', primary: false }, { label: 'arm64 (.deb)', iconType: 'external', primary: false }, { label: 'arm64 (.rpm)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash.' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.' }
                  );
                } else if (selectedClient === 'Prizrak-Box') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите пакет под вашу архитектуру и установите Prizrak-Box.', buttons: [{ label: 'amd64 (.deb)', iconType: 'external', primary: false }, { label: 'amd64 (.rpm)', iconType: 'external', primary: false }, { label: 'arm64 (.deb)', iconType: 'external', primary: false }, { label: 'arm64 (.rpm)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Запустите программу.' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку «Получить ссылку» в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел «Профили», нажмите кнопку «+», вставьте скопированную ссылку и нажмите «Подтвердить».', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.' }
                  );
                }
              } else {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'Windows', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                } else if (selectedClient === 'FIClashX') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'Windows (Установщик)', iconType: 'external', primary: false }, { label: 'Windows на ARM (Установщик)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите кнопку копирования ссылки ниже. В FIClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.' }
                  );
                } else if (selectedClient === 'Koala Clash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'Windows (Установщик)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash.' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите кнопку копирования ссылки ниже. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.' }
                  );
                } else {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите архитектуру (предпочтительно установщик) и установите или распакуйте Prizrak-Box.', buttons: [{ label: 'Windows (Установщик)', iconType: 'external', primary: false }, { label: 'Windows на ARM (Установщик)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Запустите программу от имени администратора.' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите кнопку копирования ссылки ниже. В Prizrak-Box перейдите в раздел Профили, нажмите кнопку +, вставьте вашу скопированную ссылку и нажмите Подтвердить.', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси. Установите переключатель TUN в положение ВКЛ.' }
                  );
                }
              }

              return installSteps.map(step => {
                let IconComp = Check;
                let color = '#14b8a6';
                let bg = 'rgba(20, 184, 166, 0.08)';

                if (step.iconType === 'download') IconComp = Download;
                if (step.iconType === 'cloud') IconComp = CloudDownload;
                if (step.iconType === 'settings') { IconComp = Settings; color = '#14b8a6'; bg = 'rgba(20, 184, 166, 0.08)'; }
                if (step.iconType === 'warning') { IconComp = Settings; color = '#f87171'; bg = 'rgba(248, 113, 113, 0.08)'; }
                if (step.iconType === 'check') { IconComp = Check; color = '#14b8a6'; bg = 'rgba(20, 184, 166, 0.08)'; }

                return (
                  <div key={step.id} style={{ display: 'flex', padding: '24px', background: '#171920', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', gap: '20px' }}>
                    <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', background: bg, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconComp size={22} color={color} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>{step.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: step.buttons ? '16px' : '0' }}>{step.desc}</p>
                      
                      {step.buttons && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {step.buttons.map((btn, i) => {
                            let BtnIcon = ExternalLink;
                            if (btn.iconType === 'plus') BtnIcon = Plus;
                            if (btn.iconType === 'copy') BtnIcon = Copy;

                            return (
                              <button key={i} onClick={() => {
                                if ('action' in btn && btn.action === 'copy_key') handleCopyKey();
                              }} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                background: btn.primary ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${btn.primary ? '#14b8a6' : 'rgba(255,255,255,0.1)'}`,
                                color: btn.primary ? '#14b8a6' : '#14b8a6'
                              }}>
                                <BtnIcon size={16} /> {'action' in btn && btn.action === 'copy_key' && copiedKey ? 'Скопировано!' : btn.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </main>
    </div>
  )
}
