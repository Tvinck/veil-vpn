import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Key, Info, CheckCircle2, ShieldCheck, Cpu, Smartphone, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { WorldGlobe } from './ui/WorldGlobe'
import { VeilLogo } from './ui/VeilLogo'
import { Badge } from './landing/Badge'
import { Pricing } from './landing/Pricing'
import { Reviews } from './landing/Reviews'
import { TiltCard } from './ui/TiltCard'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 14
    }
  }
}

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 13
    }
  }
}

const listContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
}

const listItem = {
  hidden: { opacity: 0, x: -16 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 14
    }
  }
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [accessLink, setAccessLink] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const ticker = [
    'ЗАЩИЩЕННЫЙ СЕРФИНГ',
    'ПЕРСОНАЛЬНЫЙ ПРОФИЛЬ',
    'БЕЗ ОГРАНИЧЕНИЙ СКОРОСТИ',
    'ВЫСОКАЯ СТАБИЛЬНОСТЬ',
    'ПОЛНАЯ АНОНИМНОСТЬ',
    'ШИФРОВАНИЕ ДАННЫХ'
  ]

  const red = '#e63950'
  const bg = '#030307'

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    const rawInput = accessLink.trim()
    if (!rawInput) {
      setLoginError('Пожалуйста, введите ваш ключ доступа или ссылку.')
      return
    }

    // Smart parsing of connection URL or plain token
    let token = rawInput
    if (rawInput.includes('/cabinet/')) {
      const parts = rawInput.split('/cabinet/')
      token = parts[parts.length - 1]
    } else if (rawInput.includes('/')) {
      const parts = rawInput.split('/')
      token = parts[parts.length - 1]
    }

    // Clean up query parameters if present
    token = token.split('?')[0].trim()

    if (token.length < 5) {
      setLoginError('Некорректный формат ключа. Проверьте правильность ссылки.')
      return
    }

    setLoginSuccess(true)
    setTimeout(() => {
      setIsLoginOpen(false)
      setLoginSuccess(false)
      setAccessLink('')
      navigate(`/cabinet/${token}`)
    }, 1000)
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', color: '#fff', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      
      {/* ── HEADER NAVIGATION ── */}
      <header className="veil-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <VeilLogo />
          <span style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.35rem', fontWeight: 900, letterSpacing: '2.5px', color: '#fff' }}>
            VEIL<span style={{ color: red }}>.NET</span>
          </span>
        </div>
        
        <nav className="sec-nav-links mobile-hide">
          {['Главная', 'Возможности', 'Тарифы', 'Отзывы'].map((item, index) => {
            const href = item === 'Тарифы' ? '#pricing' : '#';
            return (
              <a key={index} href={href} className="sec-nav-link">
                {item}
              </a>
            );
          })}
        </nav>
        
        <button className="btn-red-nav" onClick={() => setIsLoginOpen(true)}>
          Личный кабинет <ArrowRight size={14} />
        </button>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="hero-section mobile-grid-1 mobile-p-4" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Decorative background lights */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '700px', height: '700px',
          background: 'radial-gradient(circle, rgba(230,57,80,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '15%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Hero Left Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hero-content"
        >
          <motion.div variants={scaleInVariants}>
            <Badge text="Проект от BAZZAR GROUP" />
          </motion.div>

          <motion.h1 
            variants={fadeUpVariants}
            className="hero-title" 
            style={{ fontSize: 'clamp(2.2rem, 4.2vw, 3.8rem)', fontWeight: 950, lineHeight: 1.08, letterSpacing: '-1.5px', marginTop: '14px' }}
          >
            Настройка сетевого<br />
            подключения для<br />
            <span style={{ color: red, textShadow: '0 0 32px rgba(230,57,80,0.45)' }}>работы в РФ</span>
          </motion.h1>

          <motion.p 
            variants={fadeUpVariants}
            className="hero-subtitle" 
            style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: '520px', marginBottom: '32px' }}
          >
            Цифровые IT-услуги по подключению персонального защищённого сетевого профиля для ваших личных устройств ⚡️
          </motion.p>

          {/* Action Row */}
          <motion.div 
            variants={fadeUpVariants}
            style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', marginBottom: '40px' }}
          >
            <motion.button 
              whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)' }}
              whileTap={{ scale: 0.96 }}
              className="btn-cyan" 
              onClick={() => navigate('/checkout')}
            >
              Оформить подключение <ArrowRight size={15} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.96 }}
              className="btn-ghost" 
              onClick={() => setIsLoginOpen(true)}
            >
              Войти по ключу <Key size={15} />
            </motion.button>
          </motion.div>

          {/* Quick specs badge list */}
          <motion.div 
            variants={containerVariants}
            className="devices-grid"
          >
            <motion.div variants={scaleInVariants} whileHover={{ y: -2, scale: 1.05 }} className="device-item">
              <Smartphone size={14} className="text-cyan" /> 3 Устройства
            </motion.div>
            <motion.div variants={scaleInVariants} whileHover={{ y: -2, scale: 1.05 }} className="device-item">
              <Zap size={14} className="text-cyan" /> Без лимитов
            </motion.div>
            <motion.div variants={scaleInVariants} whileHover={{ y: -2, scale: 1.05 }} className="device-item">
              <ShieldCheck size={14} className="text-cyan" /> Маскировка трафика
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Hero Right Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hero-visual"
        >
          <WorldGlobe />
        </motion.div>
      </section>

      {/* ── RED MARQUEE TICKER ── */}
      <div className="red-ticker-strip">
        <div className="red-ticker-content">
          {[...ticker, ...ticker, ...ticker].map((item, i) => (
            <span key={i} className="red-ticker-item" style={{ fontFamily: 'var(--font-cyber)', fontSize: '0.95rem', fontWeight: 800 }}>
              <span style={{ color: red, marginRight: '8px' }}>✳</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── DETAILED FEATURES (BENTO GRID STYLE) ── */}
      <section style={{ padding: '100px 8%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(230,57,80,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <Badge text="Инновационные технологии" />
          <h2 style={{ marginTop: '18px', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: 1.15 }}>
            Профессиональное решение<br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>для стабильной работы интернета</span>
          </h2>
        </motion.div>

        <div className="sec-features-grid mobile-grid-1">
          {/* Card 1: Features List */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.0 }}
            className="h-full"
          >
            <TiltCard className="h-full">
              <div className="sec-feature-card sec-feature-card-red h-full" style={{ padding: '35px 30px' }}>
                <div className="sec-feat-icon" style={{ background: 'rgba(230,57,80,0.12)', border: '1px solid rgba(230,57,80,0.25)', marginBottom: '24px' }}>
                  <ShieldCheck size={24} color={red} strokeWidth={2.5} />
                </div>
                <h3 className="sec-feat-title" style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '20px' }}>Преимущества профиля</h3>
                <motion.ul 
                  variants={listContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none' }}
                >
                  <motion.li variants={listItem} style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                    <span style={{ color: red }}>✓</span> Автоматическая выдача ключа (ссылки) сразу после оплаты.
                  </motion.li>
                  <motion.li variants={listItem} style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                    <span style={{ color: red }}>✓</span> Доступ ко всем ресурсам при максимально простой настройке.
                  </motion.li>
                  <motion.li variants={listItem} style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                    <span style={{ color: red }}>✓</span> Самая доступная стоимость сетевого профиля на рынке.
                  </motion.li>
                  <motion.li variants={listItem} style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                    <span style={{ color: red }}>✓</span> Доступ к множеству зашифрованных сетевых направлений.
                  </motion.li>
                </motion.ul>
              </div>
            </TiltCard>
          </motion.div>

          {/* Card 2: Wireframe / Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="h-full"
          >
            <TiltCard className="h-full">
              <div className="sec-feature-card sec-feature-card-glow h-full relative overflow-hidden" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.15, 0.35, 0.15]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(230,57,80,0.25) 0%, transparent 60%)' }} 
                />
                <motion.div 
                  animate={{ 
                    y: [0, -6, 0],
                    boxShadow: [
                      '0 0 20px rgba(230,57,80,0.4)',
                      '0 0 35px rgba(230,57,80,0.75)',
                      '0 0 20px rgba(230,57,80,0.4)'
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', background: red, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', position: 'relative', zIndex: 2 }}
                >
                  <Cpu size={28} color="#fff" />
                </motion.div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', color: '#fff', position: 'relative', zIndex: 2, letterSpacing: '1px' }}>VLESS Reality</span>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px', position: 'relative', zIndex: 2 }}>Протокол последнего поколения</span>
              </div>
            </TiltCard>
          </motion.div>

          {/* Card 3: Limitations & Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="h-full"
          >
            <TiltCard className="h-full">
              <div className="sec-feature-card sec-feature-card-dark h-full" style={{ padding: '35px 30px' }}>
                <div className="sec-feat-icon" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
                  <Lock size={22} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                </div>
                <h3 className="sec-feat-title" style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '20px' }}>Условия и лимиты</h3>
                <motion.ul 
                  variants={listContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none' }}
                >
                  <motion.li variants={listItem} style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                    <span style={{ color: red }}>✳</span> Один профиль рассчитан на <strong>3 устройства</strong> одновременно.
                  </motion.li>
                  <motion.li variants={listItem} style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                    <span style={{ color: red }}>✳</span> Полное отсутствие лимитов на объем проходящего трафика.
                  </motion.li>
                  <motion.li variants={listItem} style={{ display: 'flex', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                    <span style={{ color: red }}>✳</span> Подробная пошаговая инструкция предоставляется сразу после совершения покупки.
                  </motion.li>
                  <motion.li variants={listItem} style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '6px' }}>
                    * Фактическая скорость зависит от конфигурации устройства, типа сети клиента, оператора связи и текущей нагрузки.
                  </motion.li>
                </motion.ul>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <Pricing />

      {/* ── REVIEWS SECTION ── */}
      <Reviews />

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '0 8% 100px' }}>
        <div className="sec-cta-banner" style={{ background: 'linear-gradient(135deg, #0d0d16 0%, #06060c 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', padding: '60px' }}>
          <div style={{ position: 'absolute', right: '15%', top: 0, bottom: 0, width: '320px',
            background: 'radial-gradient(circle, rgba(230,57,80,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: 1.25 }}>
              Получите надежный доступ<br />к информации без ограничений
            </h2>
            <p style={{ fontSize: '0.96rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: '500px' }}>
              Присоединяйтесь к проекту Veil от BAZZAR GROUP. Ваши личные данные защищены шифрованием, а сетевой профиль гарантирует стабильную скорость соединения.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button className="btn-cyan" onClick={() => navigate('/checkout')}>
                Настроить профиль <ArrowRight size={15} />
              </button>
              <button className="btn-ghost" onClick={() => setIsLoginOpen(true)}>
                Личный кабинет
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#020205', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '70px 8% 30px' }}>
        <div className="sec-footer-grid" style={{ marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <VeilLogo />
              <span style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>
                VEIL<span style={{ color: red }}>.NET</span>
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginTop: '20px', maxWidth: '280px' }}>
              Veil предоставляет цифровые услуги по конфигурированию защищенного сетевого профиля для стабильного серфинга.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginBottom: '18px', fontFamily: 'var(--font-title)' }}>Разделы</h4>
            {['Главная', 'Инструкции', 'Тарифы', 'Отзывы'].map(l => (
              <a key={l} href="#" style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = red} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>{l}</a>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginBottom: '18px', fontFamily: 'var(--font-title)' }}>Услуги</h4>
            {['Сетевой профиль', 'Шифрование трафика', 'Настройка устройств', 'Маршрутизация'].map(l => (
              <a key={l} href="#" style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = red} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>{l}</a>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginBottom: '18px', fontFamily: 'var(--font-title)' }}>Поддержка</h4>
            {[
              { e: '✉️', t: 'support@veil-secure.net' },
              { e: '🤖', t: 'Telegram бот: @Veil_Vps_bot' },
            ].map(item => (
              <div key={item.t} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{item.e}</span>
                <span style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.5)' }}>{item.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} VEIL.NET. Все права защищены. BAZZAR GROUP.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Политика конфиденциальности', 'Пользовательское соглашение'].map(l => (
              <a key={l} href="#" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = red} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── CABINET ACCESS MODAL (LICHNY KABINET) ── */}
      <AnimatePresence>
        {isLoginOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(2,2,5,0.85)', backdropFilter: 'blur(8px)' }}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth: '480px',
                background: '#09090f',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '36px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(230,57,80,0.1)'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsLoginOpen(false)}
                style={{
                  position: 'absolute', top: '20px', right: '20px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                ✕
              </button>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(230,57,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(230,57,80,0.2)' }}>
                  <Lock size={20} color={red} />
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: '#fff' }}>Личный кабинет</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginTop: '8px', lineHeight: 1.45 }}>
                  Вставьте индивидуальную ссылку или токен доступа, полученный при покупке профиля.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={accessLink}
                      onChange={e => setAccessLink(e.target.value)}
                      placeholder="https://veil.net/cabinet/token... или токен" 
                      style={{
                        width: '100%',
                        padding: '16px 16px 16px 44px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = red; e.currentTarget.style.boxShadow = '0 0 14px rgba(230,57,80,0.15)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                    />
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }}>
                      <Key size={16} />
                    </div>
                  </div>
                  
                  {loginError && (
                    <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={12} /> {loginError}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={loginSuccess}
                  className="btn-red-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                >
                  {loginSuccess ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> Вход выполнен...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Войти в кабинет <ArrowRight size={16} />
                    </span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
