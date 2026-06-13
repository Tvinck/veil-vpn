import { useState } from 'react'
import { Badge } from './Badge'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

export const Reviews = () => {
  const [activeReview, setActiveReview] = useState(0)

  const reviews = [
    { name: 'Алексей Петров', role: 'Разработчик, Москва', stars: 5,
      text: 'Veil полностью изменил мой опыт. Теперь могу без ограничений работать с любыми зарубежными сервисами. Каждый раз, когда подключаюсь к публичному Wi-Fi — чувствую себя в полной безопасности.' },
    { name: 'Мария Соколова', role: 'Дизайнер, Санкт-Петербург', stars: 5,
      text: 'Лучший сетевой профиль из всех, что пробовала. Установка за 2 минуты, работает на всех устройствах. Скорость не падает даже при 4K-стриминге. Однозначно рекомендую!' },
    { name: 'Дмитрий Иванов', role: 'Фрилансер, Казань', stars: 5,
      text: 'Протокол VLESS Reality — что-то невероятное. Провайдер вообще не видит постороннего вмешательства, соединение замаскировано. Все зарубежные сервисы работают идеально. Пользуюсь уже год.' },
  ]

  const card = 'rgba(255,255,255,0.028)'
  const border = 'rgba(255,255,255,0.07)'
  const muted = 'rgba(255,255,255,0.48)'
  const red = '#e63950'

  return (
    <section className="sec-reviews-grid" style={{ padding: '60px 6% 100px' }}>
      {/* Left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Badge text="Отзывы клиентов" />
        <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: 1.2 }}>
          Что говорят наши клиенты<br />о сервисе Veil
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '10px' }}>
          {[
            { label: 'Довольных клиентов', value: '18,400+' },
            { label: 'Уровень надежности', value: '99.9%' },
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
  )
}
