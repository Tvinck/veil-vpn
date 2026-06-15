import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Check, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Subscription } from '../../types'
import { useMouseGlow } from '../../hooks/useMouseGlow'

interface Props {
  subscription: Subscription
  fetchUserData: () => Promise<void>
}

/**
 * Карточка продления подписки по кодам активации (ActivationCard).
 * 
 * Логика работы:
 * 1. Получает промокод от пользователя.
 * 2. Вызывает Supabase RPC-функцию `activate_promo_code` с токеном подписки и кодом.
 * 3. При успешном выполнении вызывает `fetchUserData` для обновления баланса/срока действия в UI.
 * 
 * @param {Props} props - Параметры компонента
 */
export const ActivationCard = ({ subscription, fetchUserData }: Props) => {
  const navigate = useNavigate()
  const glow = useMouseGlow()
  const [activationCode, setActivationCode] = useState('')
  const [activationStatus, setActivationStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleActivateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activationCode.trim() || !subscription) return

    const code = activationCode.toUpperCase().trim()

    try {
      const { data: success, error } = await supabase.rpc('activate_promo_code', {
        p_sub_id: subscription.id,
        p_code: code
      })

      if (error) throw error
      if (!success) {
        setActivationStatus('error')
        setTimeout(() => setActivationStatus('idle'), 3000)
        return
      }

      setActivationStatus('success')
      setActivationCode('')
      await fetchUserData() // Перезагрузка данных
      setTimeout(() => setActivationStatus('idle'), 5000)
    } catch (err) {
      console.error('Ошибка при активации:', err)
      setActivationStatus('error')
      setTimeout(() => setActivationStatus('idle'), 3000)
    }
  }

  return (
    <div 
      className="sec-dash-card glow-card-cyber" 
      onMouseMove={glow.handleMouseMove}
      onMouseEnter={glow.onMouseEnter}
      onMouseLeave={glow.onMouseLeave}
      style={{ 
        ...glow.style,
        padding: '30px', 
        zIndex: 5 
      }}
    >
      <div className="sec-dash-card-header">
        <div className="sec-dash-icon-box"><Ticket size={20} color="#e63950" strokeWidth={2.5} /></div>
        <h3 className="sec-dash-title">Продлить подписку</h3>
      </div>
      <p className="sec-dash-desc">Купили код продления (ключ доступа) на сторонней площадке? Введите его ниже для мгновенной активации дней.</p>

      <form onSubmit={handleActivateCode} className="sec-input-group sec-input-group-stack" style={{ marginBottom: '16px' }}>
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
  )
}
