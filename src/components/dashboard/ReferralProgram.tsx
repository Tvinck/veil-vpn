import { useState } from 'react'
import { Gift, Check, Copy } from 'lucide-react'
import { Profile, Friend } from '../../types'
import { useMouseGlow } from '../../hooks/useMouseGlow'

interface Props {
  profile: Profile
  friends: Friend[]
}

/**
 * Карточка реферальной программы (ReferralProgram).
 * 
 * Особенности:
 * 1. Генерирует уникальную реферальную ссылку на основе `username` пользователя.
 * 2. Предоставляет кнопку для копирования реферальной ссылки в буфер обмена.
 * 3. Отображает список приглашенных друзей и статус их активности.
 * 
 * *Примечание: В новой версии базы данных Connect логика рефералов отключена на уровне хука API.*
 * 
 * @param {Props} props - Параметры компонента
 */
export const ReferralProgram = ({ profile, friends }: Props) => {
  const [copiedRef, setCopiedRef] = useState(false)
  const glow = useMouseGlow()

  const refLink = profile ? `${window.location.origin}/ref/${profile.username}` : ''

  const handleCopyRef = () => {
    if (!refLink) return
    navigator.clipboard.writeText(refLink)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
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
        <div className="sec-dash-icon-box"><Gift size={20} color="#e63950" strokeWidth={2.5} /></div>
        <h3 className="sec-dash-title">Пригласить друга</h3>
      </div>
      <p className="sec-dash-desc">Когда ваш друг зарегистрируется и купит любую подписку, вы оба получите 30 дней защищённого подключения бесплатно!</p>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ваша ссылка:</span>
        <div className="sec-input-group">
          <input type="text" readOnly value={refLink} className="sec-input" style={{ color: '#e63950' }} />
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
  )
}
