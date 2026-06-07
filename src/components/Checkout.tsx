import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Check, CreditCard, Loader2, Mail } from 'lucide-react'

export default function Checkout() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1) // Default to "Для роутера" (index 1)
  const [email, setEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success'>('idle')

  const plans = [
    {
      id: 0,
      name: 'Базовый',
      desc: 'Идеально для смартфона',
      price: 150,
      features: ['Трафик без лимитов', '1 устройство', 'Поддержка 24/7']
    },
    {
      id: 1,
      name: 'Для роутера',
      desc: 'ХИТ ПРОДАЖ',
      price: 250,
      features: ['Настройка на роутере', 'Все устройства дома', 'Обход блокировок ТВ']
    },
    {
      id: 2,
      name: 'Всё вместе',
      desc: 'Максимум возможностей',
      price: 400,
      features: ['Шифрование военного класса', 'Защита от утечек', 'Приоритетная поддержка']
    }
  ]

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPlan === null) return

    setIsProcessing(true)
    
    // Имитация вызова API бекенда и редиректа на страницу Т-Банка
    setTimeout(() => {
      setIsProcessing(false)
      setPaymentStatus('success')
    }, 2000)
  }

  const red = '#e63950'

  if (paymentStatus === 'success') {
    return (
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)' }}>
          <Check size={40} color="#22c55e" strokeWidth={3} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: '#fff', marginBottom: '16px' }}>Имитация оплаты прошла успешно!</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.6 }}>В реальной версии здесь будет происходить переадресация на платежный шлюз Т-Банка. Ваш ключ был бы отправлен на почту и в личный кабинет.</p>
        <button className="btn-red-primary" onClick={() => navigate(-1)}>
          Вернуться в личный кабинет
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="sec-dash-header mobile-wrap mobile-p-4">
        <button onClick={() => navigate(-1)} className="sec-dash-back-btn">
          <ArrowLeft size={16} />
          <span className="mobile-hide">Вернуться назад</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: red, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(230,57,80,0.55)' }}>
            <Shield size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>
            VEIL<span style={{ color: red }}>VPN</span>
          </span>
        </div>
        <div style={{ width: '150px' }} className="mobile-hide"></div> {/* Placeholder for centering logo on desktop */}
      </header>

      <main className="sec-dash-main mobile-p-4" style={{ flexGrow: 1, maxWidth: '1000px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, fontFamily: 'var(--font-title)', color: '#fff' }}>
            Оформление подписки
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '12px', fontSize: '1rem' }}>Выберите подходящий тариф и оплатите банковской картой</p>
        </div>

        <div className="sec-dash-grid mobile-grid-1" style={{ alignItems: 'stretch' }}>
          
          {/* Планы */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id
              return (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    background: isSelected ? 'rgba(230,57,80,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `2px solid ${isSelected ? red : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: isSelected ? '0 0 20px rgba(230,57,80,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)' }}>{plan.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: isSelected ? '#ff8fa3' : 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '4px' }}>{plan.desc}</p>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-cyber)', color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)' }}>
                      {plan.price}₽<span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>/мес</span>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div style={{ borderTop: `1px solid rgba(230,57,80,0.2)`, paddingTop: '12px', marginTop: '4px' }}>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {plan.features.map((f, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                            <Check size={14} color={red} strokeWidth={3} /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Форма оплаты */}
          <div className="sec-dash-card" style={{ height: 'fit-content' }}>
            <div className="sec-dash-card-header">
              <div className="sec-dash-icon-box" style={{ background: '#ffdd2d', boxShadow: '0 0 15px rgba(255,221,45,0.3)' }}>
                <CreditCard size={20} color="#000" strokeWidth={2.5} />
              </div>
              <h3 className="sec-dash-title" style={{ color: '#fff' }}>Оплата Т-Банк</h3>
            </div>
            
            <p className="sec-dash-desc" style={{ marginBottom: '24px' }}>
              Безопасная оплата картой любого банка РФ через шлюз Т-Банка. Чек об оплате будет отправлен на вашу почту.
            </p>

            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: '8px' }}>Email для получения чека</label>
                <div className="sec-input-group">
                  <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', borderRadius: '10px 0 0 10px' }}>
                    <Mail size={16} />
                  </div>
                  <input 
                    type="email" 
                    required 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="sec-input" 
                    style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none', paddingLeft: '8px' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>К оплате:</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-cyber)', color: '#fff' }}>
                  {selectedPlan !== null ? plans.find(p => p.id === selectedPlan)?.price : 0} ₽
                </span>
              </div>

              <button 
                type="submit" 
                className="btn-red-primary" 
                disabled={isProcessing || selectedPlan === null}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '16px', 
                  fontSize: '1.05rem',
                  background: '#ffdd2d',
                  color: '#000',
                  boxShadow: '0 0 20px rgba(255,221,45,0.4)'
                }}
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : 'Перейти к оплате'}
              </button>
            </form>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', opacity: 0.5 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>T-Pay</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mir Pay</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>СБП</span>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}
