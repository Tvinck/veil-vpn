import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Send } from 'lucide-react'

export const DashboardHeader = () => {
  const navigate = useNavigate()

  return (
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
  )
}
