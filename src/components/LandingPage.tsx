import { useState } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Shield, Star, Eye, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// WORLD GLOBE SVG — dot-matrix sphere with location pins
// ═══════════════════════════════════════════════════════════════════

const WorldGlobe = () => {
  const pins = [
    { x: 402, y: 198, name: 'Europe',   left: false },
    { x: 318, y: 182, name: 'UK',       left: true  },
    { x: 448, y: 185, name: 'Spain',    left: false },
    { x: 468, y: 206, name: 'Germany',  left: false },
    { x: 334, y: 165, name: 'Sweden',   left: true  },
    { x: 400, y: 222, name: 'Czech',    left: true  },
    { x: 445, y: 230, name: 'Austria',  left: false },
    { x: 474, y: 232, name: 'Italy',    left: false },
    { x: 508, y: 214, name: 'Ukraine',  left: false },
    { x: 196, y: 200, name: 'America',  left: true  },
    { x: 264, y: 286, name: 'Brazil',   left: true  },
  ]

  const CX = 440, CY = 318, RX = 370, RY = 195

  // Generate dot rows for full globe surface
  const allDots: { x: number; y: number }[] = []
  for (let row = 0; row <= 20; row++) {
    const y = CY - RY + (row / 20) * RY * 2
    const ratio = Math.sqrt(Math.max(0, 1 - ((y - CY) / RY) ** 2))
    const w = RX * ratio
    const numDots = Math.round(38 * ratio)
    for (let col = 0; col <= numDots; col++) {
      const x = CX - w + (col / Math.max(numDots, 1)) * w * 2
      allDots.push({ x, y })
    }
  }

  return (
    <svg viewBox="0 0 880 460" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '860px', display: 'block' }}>
      <defs>
        <radialGradient id="gSurface" cx="42%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#270a12" />
          <stop offset="55%" stopColor="#100406" />
          <stop offset="100%" stopColor="#06020400" />
        </radialGradient>
        <radialGradient id="gBottomGlow" cx="50%" cy="95%" r="55%">
          <stop offset="0%" stopColor="#e63950" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#e63950" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#e63950" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gCenterGlow" cx="50%" cy="58%" r="48%">
          <stop offset="0%" stopColor="#e63950" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#e63950" stopOpacity="0" />
        </radialGradient>
        <clipPath id="cpGlobe">
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
        </clipPath>
        <filter id="fPinGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Globe base fill */}
      <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#gSurface)" />

      {/* Dot matrix */}
      <g clipPath="url(#cpGlobe)">
        {allDots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="1.9"
            fill="#e63950"
            opacity={d.y > CY ? 0.48 : 0.18} />
        ))}
      </g>

      {/* Latitude grid ellipses */}
      <g clipPath="url(#cpGlobe)" stroke="#e63950" strokeWidth="0.7" fill="none" opacity="0.14">
        {[CY - 130, CY - 85, CY - 40, CY, CY + 45, CY + 90, CY + 130].map((y, i) => {
          const ratio = Math.sqrt(Math.max(0, 1 - ((y - CY) / RY) ** 2))
          return <ellipse key={i} cx={CX} cy={y} rx={RX * ratio} ry={12 * ratio + 2} />
        })}
      </g>

      {/* Longitude grid arcs */}
      <g clipPath="url(#cpGlobe)" stroke="#e63950" strokeWidth="0.7" fill="none" opacity="0.11">
        {[-160, -110, -65, -22, 22, 65, 110, 160].map((dx, i) => {
          const scaleX = 1 - Math.abs(dx) / 220
          return <ellipse key={i} cx={CX + dx * 0.65} cy={CY} rx={RX * scaleX * 0.12 + 4} ry={RY} />
        })}
      </g>

      {/* Bottom red glow */}
      <ellipse cx={CX} cy={498} rx={330} ry={145} fill="url(#gBottomGlow)" />
      {/* Center ambient */}
      <ellipse cx={CX} cy={CY} rx={250} ry={130} fill="url(#gCenterGlow)" />

      {/* Location Pins */}
      {pins.map((p, i) => {
        const boxW = 56, boxH = 20
        const boxX = p.left ? p.x - boxW - 10 : p.x + 10
        const boxY = p.y - 26
        return (
          <g key={i} filter="url(#fPinGlow)">
            <circle cx={p.x} cy={p.y} r="12" fill="#e63950" opacity="0.14" />
            <circle cx={p.x} cy={p.y} r="6"  fill="#e63950" opacity="0.92" />
            <circle cx={p.x} cy={p.y} r="2.5" fill="#ff8fa3" />
            <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="5"
              fill="rgba(8,4,6,0.9)" stroke="rgba(230,57,80,0.55)" strokeWidth="1" />
            <text x={boxX + boxW / 2} y={boxY + 13.5} textAnchor="middle"
              fill="white" fontSize="9" fontFamily="Inter,-apple-system,sans-serif" fontWeight="700">
              {p.name}
            </text>
            <line x1={p.x} y1={p.y - 6} x2={p.left ? p.x - 10 : p.x + 10} y2={boxY + boxH}
              stroke="#e63950" strokeWidth="1" opacity="0.55" />
          </g>
        )
      })}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════
// NAV LOGO
// ═══════════════════════════════════════════════════════════════════

const VeilLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div style={{
      width: '34px', height: '34px', background: '#e63950', borderRadius: '9px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 18px rgba(230,57,80,0.55)',
    }}>
      <Shield size={18} color="#fff" strokeWidth={2.5} />
    </div>
    <span style={{
      fontFamily: 'var(--font-cyber)', fontSize: '1.25rem',
      fontWeight: 900, letterSpacing: '2px', color: '#fff',
    }}>
      VEIL<span style={{ color: '#e63950' }}>VPN</span>
    </span>
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// BADGE component
// ═══════════════════════════════════════════════════════════════════

const Badge = ({ text }: { text: string }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: 'rgba(230,57,80,0.09)', border: '1px solid rgba(230,57,80,0.32)',
    borderRadius: '6px', padding: '6px 14px', width: 'fit-content',
  }}>
    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e63950', boxShadow: '0 0 6px #e63950' }} />
    <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#e63950', fontFamily: 'var(--font-cyber)', letterSpacing: '0.8px' }}>{text}</span>
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeReview, setActiveReview] = useState(0)

  const plans = [
    {
      name: 'Базовый', desc: 'Идеально для смартфона',
      price: '150₽', period: '/мес',
      features: ['Глобальная сеть серверов', 'Трафик без лимитов', '1 устройство', 'Поддержка 24/7', 'Высокая скорость'],
      featured: false,
    },
    {
      name: 'Для роутера', desc: 'Для всей семьи',
      price: '250₽', period: '/мес', badge: 'ХИТ ПРОДАЖ',
      features: ['Глобальная сеть серверов', 'Настройка на роутере', 'Все домашние устройства', 'Обход блокировок ТВ', 'Защита от утечек', 'Поддержка 24/7'],
      featured: true,
    },
    {
      name: 'Всё вместе', desc: 'Максимум возможностей',
      price: '400₽', period: '/мес',
      features: ['Глобальная сеть серверов', 'Роутер + личные устройства', 'Шифрование военного класса', 'Обход любых блокировок', 'Защита от утечек', 'Приоритетная поддержка'],
      featured: false,
    },
  ]

  const reviews = [
    { name: 'Алексей Петров', role: 'Разработчик, Москва', stars: 5,
      text: 'Veil VPN полностью изменил мой опыт. Теперь могу без ограничений работать с любыми сервисами. Каждый раз, когда подключаюсь к публичному Wi-Fi — чувствую себя в безопасности.' },
    { name: 'Мария Соколова', role: 'Дизайнер, Санкт-Петербург', stars: 5,
      text: 'Лучший VPN из всех что пробовала. Установка за 2 минуты, работает на всех устройствах. Скорость не падает даже при 4K-стриминге. Однозначно рекомендую!' },
    { name: 'Дмитрий Иванов', role: 'Фрилансер, Казань', stars: 5,
      text: 'Протокол VLESS Reality — что-то невероятное. Провайдер вообще не видит VPN-трафик. Все стриминговые сервисы работают идеально. Пользуюсь уже год.' },
  ]

  const ticker = ['BROWSE FREELY', 'SECURE ANYWHERE', 'DIGITAL SHIELD', 'SAFE & FAST', 'ZERO LOGS', 'MILITARY GRADE']

  const bg = '#0a0a0f'
  const card = 'rgba(255,255,255,0.028)'
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
          <div className="sec-feature-card sec-feature-card-red">
            <div className="sec-feat-icon" style={{ background: 'rgba(230,57,80,0.14)', border: '1px solid rgba(230,57,80,0.3)' }}>
              <Eye size={22} color={red} strokeWidth={2} />
            </div>
            <h3 className="sec-feat-title">Полная конфиденциальность в сети</h3>
            <p className="sec-feat-desc">Ваша история браузера и личная информация надежно защищены от хакеров, провайдеров и слежки шифрованием военного уровня.</p>
          </div>

          {/* Card 2 — video/glow */}
          <div className="sec-feature-card sec-feature-card-glow">
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 65% 30%, rgba(230,57,80,0.28) 0%, transparent 60%)', borderRadius: '20px' }} />
            <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: red, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 22px rgba(230,57,80,0.6)', flexShrink: 0 }}>
                <svg width="13" height="16" viewBox="0 0 13 16" fill="white"><path d="M0 0l13 8-13 8V0z" /></svg>
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Как это работает</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="sec-feature-card sec-feature-card-dark">
            <div className="sec-feat-icon" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Lock size={22} color="rgba(255,255,255,0.8)" strokeWidth={2} />
            </div>
            <h3 className="sec-feat-title">Доступ откуда угодно и когда угодно</h3>
            <p className="sec-feat-desc">Получите доступ к любимому контенту без ограничений из любой точки мира. Один ключ для всех устройств.</p>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: '60px 6% 100px' }} id="pricing">
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <Badge text="Простые тарифы · Максимальная защита" />
          <h2 style={{ marginTop: '18px', fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)' }}>
            Гибкие VPN-тарифы для каждого пользователя
          </h2>
        </div>

        <div className="sec-pricing-grid">
          {plans.map((plan, i) => (
            <div key={i} className={`sec-plan-card ${plan.featured ? 'sec-plan-featured' : ''}`}>
              {plan.badge && (
                <div className="sec-plan-badge">{plan.badge}</div>
              )}
              <div>
                <p style={{ fontSize: '0.75rem', color: muted, fontWeight: 600, marginBottom: '5px' }}>{plan.desc}</p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)' }}>{plan.name} план</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.3rem', fontWeight: 900, color: plan.featured ? red : '#fff', fontFamily: 'var(--font-cyber)' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: '0.82rem', color: muted, fontWeight: 600 }}>{plan.period}</span>
              </div>
              <button className={plan.featured ? 'btn-red-primary' : 'btn-ghost-plan'}
                onClick={() => navigate('/KUq0yqj3mW_T79on')} style={{ width: '100%', justifyContent: 'center' }}>
                Выбрать план →
              </button>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.84rem', color: 'rgba(255,255,255,0.68)' }}>
                    <Check size={13} color={red} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="sec-reviews-grid" style={{ padding: '60px 6% 100px' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Badge text="Отзывы клиентов" />
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: 1.2 }}>
            Что говорят наши клиенты<br />о Veil VPN
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '10px' }}>
            {[
              { label: 'Happy Users Worldwide', value: '18,400+' },
              { label: 'Satisfaction Rate', value: '98%' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: '0.72rem', color: muted, fontWeight: 600, marginBottom: '8px' }}>
                  <span style={{ color: red, marginRight: '4px' }}>→</span>{s.label}
                </p>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-cyber)', color: '#fff' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — review card */}
        <div>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '30px', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {Array.from({ length: reviews[activeReview].stars }).map((_, i) => (
                <Star key={i} size={15} fill={red} color={red} />
              ))}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.68, marginBottom: '22px' }}>
              "{reviews[activeReview].text}"
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{reviews[activeReview].name}</div>
                <div style={{ fontSize: '0.75rem', color: muted, marginTop: '3px' }}>{reviews[activeReview].role}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="review-nav-btn"
                  onClick={() => setActiveReview(p => (p - 1 + reviews.length) % reviews.length)}>
                  <ChevronLeft size={16} />
                </button>
                <button className="review-nav-btn review-nav-btn-active"
                  onClick={() => setActiveReview(p => (p + 1) % reviews.length)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
