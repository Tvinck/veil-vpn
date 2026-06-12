import { ArrowRight, Eye, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { WorldGlobe } from './ui/WorldGlobe'
import { VeilLogo } from './ui/VeilLogo'
import { Badge } from './landing/Badge'
import { Pricing } from './landing/Pricing'
import { Reviews } from './landing/Reviews'

import { TiltCard } from './ui/TiltCard'

// ═══════════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const navigate = useNavigate()

  const ticker = ['БЕЗОПАСНЫЙ СЕРФИНГ', 'ЦИФРОВОЙ ЩИТ', 'БЕЗ ЛОГОВ', 'ВЫСОКАЯ СКОРОСТЬ', 'ПОЛНАЯ АНОНИМНОСТЬ', 'ВОЕННОЕ ШИФРОВАНИЕ']

  const bg = '#0a0a0f'
  const border = 'rgba(255,255,255,0.07)'
  const muted = 'rgba(255,255,255,0.48)'
  const red = '#e63950'

  const hovRed = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    el.style.color = red
  }
  const unHovRed = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    el.style.color = muted
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', color: '#fff', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <header className="sec-nav mobile-p-4 mobile-wrap">
        <VeilLogo />
        <nav className="sec-nav-links mobile-hide">
          {['Главная', 'Возможности', 'Тарифы', 'Поддержка', 'Контакты'].map(item => (
            <a key={item} href="#" className="sec-nav-link">{item}</a>
          ))}
        </nav>
        <button className="btn-red-nav" onClick={() => navigate('/KUq0yqj3mW_T79on')}>
          Личный кабинет <ArrowRight size={14} />
        </button>
      </header>

      {/* ── HERO ── */}
      <section className="sec-hero-grid mobile-grid-1 mobile-p-4" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Ambient blobs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: '650px', height: '650px',
          background: 'radial-gradient(circle, rgba(230,57,80,0.17) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '28%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(230,57,80,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Left content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', position: 'relative', zIndex: 1 }}>
          <Badge text="VPN с шифрованием военного уровня" />

          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', fontWeight: 900, lineHeight: 1.07, letterSpacing: '-1.5px', fontFamily: 'var(--font-title)' }}>
            Самый <span style={{ color: red, textShadow: '0 0 32px rgba(230,57,80,0.5)' }}>безопасный</span> VPN для<br />
            полной свободы в сети
          </h1>

          <p style={{ fontSize: '1rem', color: muted, lineHeight: 1.65, maxWidth: '480px' }}>
            Защитите свою конфиденциальность и серфите без границ. Наш VPN обеспечивает шифрование военного уровня с политикой нулевого журналирования (Zero Logs).
          </p>

          {/* Buttons row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn-red-primary" onClick={() => navigate('/KUq0yqj3mW_T79on')}>
              Начать сейчас <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right: Globe */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <WorldGlobe />
        </div>
      </section>

      {/* ── RED MARQUEE STRIP ── */}
      <div className="red-ticker-strip">
        <div className="red-ticker-content">
          {[...ticker, ...ticker, ...ticker].map((item, i) => (
            <span key={i} className="red-ticker-item">
              <span style={{ fontSize: '1.1rem' }}>✳</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES / NEXT LEVEL VPN ── */}
      <section style={{ padding: '100px 6%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '8%', right: '-12%', width: '520px', height: '520px',
          background: 'radial-gradient(circle, rgba(230,57,80,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ marginBottom: '56px' }}>
          <Badge text="VPN нового уровня!!" />
          <h2 style={{ marginTop: '18px', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: 1.18 }}>
            Идеальный щит<br />
            <span style={{ color: 'rgba(255,255,255,0.38)' }}>для вашей цифровой жизни</span>
          </h2>
        </div>

        <div className="sec-features-grid mobile-grid-1">
          {/* Card 1 */}
          <TiltCard className="h-full">
            <div className="sec-feature-card sec-feature-card-red h-full">
              <div className="sec-feat-icon" style={{ background: 'rgba(230,57,80,0.14)', border: '1px solid rgba(230,57,80,0.3)' }}>
                <Eye size={22} color={red} strokeWidth={2} />
              </div>
              <h3 className="sec-feat-title">Полная конфиденциальность в сети</h3>
              <p className="sec-feat-desc">Ваша история браузера и личная информация надежно защищены от хакеров, провайдеров и слежки шифрованием военного уровня.</p>
            </div>
          </TiltCard>

          {/* Card 2 — video/glow */}
          <TiltCard className="h-full">
            <div className="sec-feature-card sec-feature-card-glow h-full relative overflow-hidden">
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 65% 30%, rgba(230,57,80,0.28) 0%, transparent 60%)', borderRadius: '20px' }} />
              <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: red, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 22px rgba(230,57,80,0.6)', flexShrink: 0 }}>
                  <svg width="13" height="16" viewBox="0 0 13 16" fill="white"><path d="M0 0l13 8-13 8V0z" /></svg>
                </div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Как это работает</span>
              </div>
            </div>
          </TiltCard>

          {/* Card 3 */}
          <TiltCard className="h-full">
            <div className="sec-feature-card sec-feature-card-dark h-full">
              <div className="sec-feat-icon" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Lock size={22} color="rgba(255,255,255,0.8)" strokeWidth={2} />
              </div>
              <h3 className="sec-feat-title">Доступ откуда угодно и когда угодно</h3>
              <p className="sec-feat-desc">Получите доступ к любимому контенту без ограничений из любой точки мира. Один ключ для всех устройств.</p>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── PRICING ── */}
      <Pricing />

      {/* ── REVIEWS ── */}
      <Reviews />

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '0 6% 100px' }}>
        <div className="sec-cta-banner">
          <div style={{ position: 'absolute', right: '220px', top: 0, bottom: 0, width: '280px',
            background: 'radial-gradient(circle, rgba(230,57,80,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: 1.2 }}>
              Защитите свою конфиденциальность сегодня<br />Серфите свободно и без ограничений
            </h2>
            <p style={{ fontSize: '0.94rem', color: muted, lineHeight: 1.65, maxWidth: '460px' }}>
              Veil VPN. Ваши личные данные в безопасности от хакеров, трекеров и слежки, пока вы наслаждаетесь неограниченным доступом к любимым приложениям.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-red-primary" onClick={() => navigate('/KUq0yqj3mW_T79on')}>
                Получить доступ <ArrowRight size={14} />
              </button>
              <button className="btn-ghost-cta" onClick={() => navigate('/KUq0yqj3mW_T79on')}>
                Пробный период — 11₽
              </button>
            </div>
          </div>

          {/* Decorative Shield + Globe */}
          <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
            <svg width="210" height="210" viewBox="0 0 210 210">
              <defs>
                <radialGradient id="sGrad" cx="38%" cy="28%" r="72%">
                  <stop offset="0%" stopColor="#ff7085" /><stop offset="55%" stopColor="#e63950" /><stop offset="100%" stopColor="#7a0e1e" />
                </radialGradient>
                <radialGradient id="gGrad" cx="38%" cy="28%" r="72%">
                  <stop offset="0%" stopColor="#ff8c55" /><stop offset="55%" stopColor="#e65828" /><stop offset="100%" stopColor="#7a2200" />
                </radialGradient>
                <radialGradient id="gGlow2" cx="50%" cy="100%" r="65%">
                  <stop offset="0%" stopColor="#e63950" stopOpacity="0.5" /><stop offset="100%" stopColor="#e63950" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Globe */}
              <ellipse cx="115" cy="140" rx="78" ry="46" fill="url(#gGrad)" />
              <ellipse cx="115" cy="140" rx="78" ry="46" fill="none" stroke="#ff8c55" strokeWidth="1" opacity="0.4" />
              <ellipse cx="115" cy="140" rx="40" ry="46" fill="none" stroke="#ff8c55" strokeWidth="0.8" opacity="0.3" />
              <line x1="37" y1="140" x2="193" y2="140" stroke="#ff8c55" strokeWidth="0.8" opacity="0.3" />
              <ellipse cx="115" cy="178" rx="72" ry="24" fill="url(#gGlow2)" />
              {/* Shield */}
              <path d="M93 25 L137 46 V78 C137 98 120 113 105 118 C90 113 73 98 73 78 V46 Z"
                fill="url(#sGrad)" filter="drop-shadow(0 0 14px rgba(230,57,80,0.85))" />
              <path d="M95 35 L129 53 V75 C129 92 114 104 105 108 C96 104 81 92 81 75 V53 Z"
                fill="rgba(0,0,0,0.22)" />
              {/* Checkmark */}
              <path d="M96 74 L103 82 L117 64" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'rgba(5,5,9,0.98)', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '60px 6% 28px' }}>
        <div className="sec-footer-grid">
          <div>
            <VeilLogo />
            <p style={{ fontSize: '0.86rem', color: muted, lineHeight: 1.65, marginTop: '16px', maxWidth: '280px' }}>
              Veil VPN delivering professional security solutions that protect people property and peace of mind.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              {['IN', 'IG', 'X'].map(s => (
                <div key={s} style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem', color: muted, fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>{s}</div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>Быстрые ссылки</h4>
            {['Главная', 'О нас', 'Сервисы', 'Наш блог', 'Контакты'].map(l => (
              <a key={l} href="#" style={{ display: 'block', marginBottom: '9px', fontSize: '0.84rem', color: muted, textDecoration: 'none' }}
                onMouseEnter={hovRed} onMouseLeave={unHovRed}>{l}</a>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>Наши сервисы</h4>
            {['VPN защита', 'Конфиденциальность', 'Обход блокировок', 'Защита устройств', 'Управление доступом'].map(l => (
              <a key={l} href="#" style={{ display: 'block', marginBottom: '9px', fontSize: '0.84rem', color: muted, textDecoration: 'none' }}
                onMouseEnter={hovRed} onMouseLeave={unHovRed}>{l}</a>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>Контакты</h4>
            {[
              { e: '📞', t: '+7 (800) 000-00-00' },
              { e: '📍', t: 'Москва, Россия' },
              { e: '✉️', t: 'support@veilvpn.net' },
              { e: '🌐', t: 'veilvpn.net' },
            ].map(item => (
              <div key={item.t} style={{ display: 'flex', gap: '9px', marginBottom: '9px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{item.e}</span>
                <span style={{ fontSize: '0.83rem', color: muted }}>{item.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.28)' }}>©{new Date().getFullYear()} Veil VPN. All Rights Reserved.</p>
          <div style={{ display: 'flex', gap: '22px' }}>
            {['Условия использования', 'Политика конфиденциальности'].map(l => (
              <a key={l} href="#" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.32)', textDecoration: 'none' }}
                onMouseEnter={hovRed} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.32)' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
