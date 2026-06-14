import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { VeilLogo } from '../ui/VeilLogo'

/**
 * Верхняя навигационная панель личного кабинета (DashboardHeader).
 * 
 * Отображает:
 * 1. Кнопку возврата на главную страницу лендинга.
 * 2. Фирменный логотип проекта (Veil.Net).
 * 3. Быструю ссылку на Telegram-бот технической поддержки.
 */
export const DashboardHeader = () => {
  const navigate = useNavigate()

  return (
    <header className="sec-dash-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(10, 10, 15, 0.75)', backdropFilter: 'blur(20px)' }}>
      <button 
        onClick={() => navigate('/')} 
        className="sec-dash-back-btn sec-back-btn-mobile" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 16px', 
          borderRadius: '10px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.6)',
          transition: 'all 0.25s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(230,57,80,0.3)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.background = 'rgba(230,57,80,0.04)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        }}
      >
        <ArrowLeft size={15} />
        <span className="mobile-hide" style={{ fontWeight: 700, fontSize: '0.85rem' }}>На главную</span>
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <VeilLogo />
        <span style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>
          VEIL<span style={{ color: '#e63950' }}>.NET</span>
        </span>
      </div>
      
      <a 
        href="https://t.me/Veil_Vps_bot" 
        target="_blank" 
        rel="noreferrer" 
        style={{ 
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.6)', 
          transition: 'all 0.25s ease' 
        }} 
        title="Поддержка в Telegram" 
        onMouseEnter={e => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'rgba(230,57,80,0.3)';
          e.currentTarget.style.background = 'rgba(230,57,80,0.08)';
        }} 
        onMouseLeave={e => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        }}
      >
        <Send size={16} />
      </a>
    </header>
  )
}
