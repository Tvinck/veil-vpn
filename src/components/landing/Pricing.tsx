import { Badge } from './Badge'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMouseGlow } from '../../hooks/useMouseGlow'

interface PlanCardProps {
  plan: {
    name: string
    desc: string
    price: string
    period: string
    badge?: string
    features: string[]
    featured: boolean
  }
}

/**
 * Карточка тарифного плана.
 * Поддерживает интерактивную подсветку (glow) при движении мыши,
 * плавные анимации появления и раскрытия списка возможностей.
 * 
 * @param {PlanCardProps} props - Параметры карточки
 */
const PlanCard = ({ plan }: PlanCardProps) => {
  const navigate = useNavigate()
  const glow = useMouseGlow()
  const red = '#e63950'

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
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

  const listContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06
      }
    }
  }

  const listItem = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15
      }
    }
  }

  // Highlight border style for the featured card
  const borderStyle = plan.featured
    ? { border: `1.5px solid ${red}`, boxShadow: '0 0 30px rgba(230,57,80,0.15)' }
    : { border: '1px solid rgba(255, 255, 255, 0.05)' }

  return (
    <motion.div
      variants={cardVariants}
      {...glow}
      className="glow-card-cyber"
      style={{
        ...glow.style,
        ...borderStyle,
        borderRadius: '30px',
        padding: '40px 35px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'rgba(6, 6, 12, 0.7)',
        backdropFilter: 'blur(24px)',
        minHeight: '480px',
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
      }}
    >
      {/* Featured Badge */}
      {plan.badge && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '25px',
          background: red,
          color: '#fff',
          fontSize: '0.65rem',
          fontWeight: 900,
          padding: '4px 12px',
          borderRadius: '100px',
          letterSpacing: '1px',
          boxShadow: '0 0 15px rgba(230,57,80,0.5)',
          fontFamily: 'var(--font-cyber)',
          zIndex: 10
        }}>
          {plan.badge}
        </div>
      )}

      {/* Plan Header */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          {plan.desc}
        </p>
        <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
          {plan.name} план
        </h3>
      </div>

      {/* Price section */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '24px 0', position: 'relative', zIndex: 3 }}>
        <span style={{ 
          fontSize: '2.8rem', 
          fontWeight: 950, 
          color: plan.featured ? red : '#fff', 
          fontFamily: 'var(--font-cyber)',
          letterSpacing: '-1.5px',
          textShadow: plan.featured ? '0 0 24px rgba(230,57,80,0.3)' : 'none'
        }}>
          {plan.price}
        </span>
        <span style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 700 }}>{plan.period}</span>
      </div>

      {/* Choose button */}
      <div style={{ marginBottom: '28px', position: 'relative', zIndex: 3 }}>
        <motion.button 
          whileHover={{ scale: 1.04, boxShadow: plan.featured ? '0 0 25px rgba(230, 57, 80, 0.4)' : '0 0 20px rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/checkout')} 
          style={{ 
            width: '100%', 
            padding: '16px',
            borderRadius: '14px',
            fontSize: '0.88rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: plan.featured ? red : 'rgba(255,255,255,0.04)',
            border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.1)',
            color: '#fff'
          }}
        >
          Выбрать план →
        </motion.button>
      </div>

      {/* Features checklist */}
      <motion.ul 
        variants={listContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, position: 'relative', zIndex: 3 }}
      >
        {plan.features.map((f, j) => (
          <motion.li 
            variants={listItem} 
            key={j} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}
          >
            <Check size={14} color={red} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            {f}
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  )
}

/**
 * Секция выбора тарифных планов на лендинге.
 * Выводит сетку доступных тарифов (базовый, для роутера, всё вместе)
 * и декоративные радиальные свечения для создания глубины.
 */
export const Pricing = () => {
  const plans = [
    {
      name: 'Базовый', desc: 'Идеально для смартфона',
      price: '150₽', period: '/мес',
      features: ['Глобальная сеть адресов', 'Трафик без лимитов', '1 устройство', 'Поддержка 24/7', 'Высокая скорость'],
      featured: false,
    },
    {
      name: 'Для роутера', desc: 'Для всей семьи',
      price: '250₽', period: '/мес', badge: 'ХИТ ПРОДАЖ',
      features: ['Глобальная сеть адресов', 'Настройка на роутере', 'Все домашние устройства', 'Работа на Smart TV', 'Защита от утечек', 'Поддержка 24/7'],
      featured: true,
    },
    {
      name: 'Всё вместе', desc: 'Максимум возможностей',
      price: '400₽', period: '/мес',
      features: ['Глобальная сеть адресов', 'Роутер + личные устройства', 'Надежное шифрование данных', 'Стабильная маршрутизация', 'Защита от утечек', 'Приоритетная поддержка'],
      featured: false,
    },
  ]

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  return (
    <section style={{ padding: '80px 8% 120px', position: 'relative' }} id="pricing">
      {/* Decorative radial glows */}
      <div style={{ position: 'absolute', top: '15%', left: '5%', width: '450px', height: '450px',
        background: 'radial-gradient(circle, rgba(0,240,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '450px', height: '450px',
        background: 'radial-gradient(circle, rgba(230,57,80,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ textShadow: 'none', textAlign: 'center', marginBottom: '64px' }}>
        <Badge text="Простые тарифы · Надежное подключение" />
        <h2 style={{ marginTop: '18px', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: 1.15 }}>
          Гибкие тарифные планы<br />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>для каждого пользователя</span>
        </h2>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="sec-pricing-grid"
      >
        {plans.map((plan, i) => (
          <PlanCard key={i} plan={plan} />
        ))}
      </motion.div>
    </section>
  )
}
