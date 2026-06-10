
import { Badge } from './Badge'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const Pricing = () => {
  const navigate = useNavigate()

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

  const muted = 'rgba(255,255,255,0.48)'
  const red = '#e63950'

  return (
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
  )
}
