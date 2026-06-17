import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Check, CreditCard, Loader2, Mail, AlertTriangle, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Checkout() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1) // Default to "Для роутера" (index 1)
  const [email, setEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'unavailable'>('idle')

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
      features: ['Настройка на роутере', 'Все устройства дома', 'Работа на Smart TV']
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
    
    // Имитация вызова API и вывод сообщения о временной недоступности оплаты на сайте
    setTimeout(() => {
      setIsProcessing(false)
      setPaymentStatus('unavailable')
    }, 1500)
  }

  const red = '#e63950'

  if (paymentStatus === 'unavailable') {
    return (
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center', background: '#020205' }}>
        {/* Background Grid & Ambient Glows */}
        <div className="cyber-grid" />
        <div className="sec-dash-ambient-1" style={{ zIndex: 1 }} />
        <div className="sec-dash-ambient-2" style={{ zIndex: 1 }} />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="sec-dash-card" 
          style={{ 
            maxWidth: '500px', 
            width: '100%', 
            border: '1.5px solid rgba(255, 122, 0, 0.25)', 
            padding: '40px 30px', 
            borderRadius: '24px', 
            background: 'rgba(6, 6, 12, 0.75)', 
            backdropFilter: 'blur(24px)', 
            boxShadow: '0 20px 50px rgba(255, 122, 0, 0.08), 0 0 30px rgba(0,0,0,0.5)',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '24px', 
            position: 'relative', 
            zIndex: 10 
          }}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 122, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255, 122, 0, 0.2)' }}>
            <AlertTriangle size={36} color="#ff7a00" strokeWidth={2.5} />
          </div>
          
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 950, fontFamily: 'var(--font-title)', color: '#fff', letterSpacing: '-0.5px', marginBottom: '12px' }}>
              Оплата временно недоступна
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Приём прямых платежей банковскими картами на сайте временно приостановлен по техническим причинам.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '18px', width: '100%', textAlign: 'left', fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
            Вы можете моментально и безопасно оплатить тариф <strong style={{ color: '#fff' }}>"{plans.find(p => p.id === selectedPlan)?.name}"</strong> ({plans.find(p => p.id === selectedPlan)?.price} ₽) и сразу же получить ключ подключения в нашем Telegram-боте.
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <button 
              className="btn-red-primary" 
              onClick={() => window.open('https://t.me/Veil_Vps_bot', '_blank')}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                background: 'linear-gradient(135deg, #00f0ff 0%, #0072ff 100%)', 
                color: '#000', 
                border: 'none', 
                boxShadow: '0 0 25px rgba(0,240,255,0.3)', 
                fontWeight: 900, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '16px',
                fontSize: '1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-cyber)',
                letterSpacing: '0.5px'
              }}
            >
              <Send size={16} /> Оплатить в Telegram
            </button>
            <button 
              onClick={() => setPaymentStatus('idle')}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '12px', 
                fontSize: '0.88rem', 
                fontWeight: 800, 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)', 
                color: 'rgba(255,255,255,0.7)', 
                cursor: 'pointer', 
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            >
              Вернуться к выбору тарифа
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="sec-dash-container" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#020205', overflowX: 'hidden' }}>
      {/* Background Grid & Ambient Glows */}
      <div className="cyber-grid" />
      <div className="sec-dash-ambient-1" style={{ zIndex: 1 }} />
      <div className="sec-dash-ambient-2" style={{ zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header */}
        <header className="sec-dash-header mobile-wrap mobile-p-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(2, 2, 5, 0.6)', backdropFilter: 'blur(16px)', zIndex: 10 }}>
          <button 
            onClick={() => navigate(-1)} 
            className="sec-dash-back-btn hover:text-white transition-colors" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' }}
          >
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', background: red, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(230,57,80,0.55)' }}>
              <Shield size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>
              VEIL<span style={{ color: red }}>.NET</span>
            </span>
          </div>
          <div style={{ width: '150px' }} className="mobile-hide"></div> {/* Placeholder for centering logo on desktop */}
        </header>

        <main className="sec-dash-main mobile-p-4" style={{ flexGrow: 1, maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '60px 20px', zIndex: 10 }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 2.75rem)', fontWeight: 950, fontFamily: 'var(--font-title)', color: '#fff', letterSpacing: '-0.75px', lineHeight: 1.15 }}>
              Оформление подключения
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: '14px', fontSize: '1rem', fontWeight: 500 }}>
              Выберите подходящий тариф и перейдите к оплате
            </p>
          </div>

          <div className="sec-dash-grid mobile-grid-1" style={{ alignItems: 'stretch', gap: '32px' }}>
            
            {/* Тарифы */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id
                return (
                  <motion.div 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.995 }}
                    className="relative overflow-hidden"
                    style={{
                      background: isSelected ? 'rgba(230,57,80,0.06)' : 'rgba(6, 6, 12, 0.4)',
                      border: `1.5px solid ${isSelected ? red : 'rgba(255,255,255,0.04)'}`,
                      borderRadius: '20px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'border-color 0.3s, background-color 0.3s, box-shadow 0.3s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: isSelected ? '0 8px 25px rgba(230,57,80,0.14)' : '0 4px 20px rgba(0,0,0,0.25)',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    {plan.id === 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '16px',
                        background: red,
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '2px 10px',
                        borderRadius: '100px',
                        letterSpacing: '1px',
                        boxShadow: '0 0 10px rgba(230,57,80,0.4)',
                        fontFamily: 'var(--font-cyber)'
                      }}>
                        ХИТ
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-title)' }}>{plan.name}</h3>
                        <p style={{ fontSize: '0.82rem', color: isSelected ? '#ff8fa3' : 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: '4px' }}>{plan.desc}</p>
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 950, fontFamily: 'var(--font-cyber)', color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)' }}>
                        {plan.price}₽<span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>/мес</span>
                      </div>
                    </div>
                    
                    <AnimatePresence initial={false}>
                      {isSelected && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          style={{ borderTop: `1px solid rgba(230,57,80,0.15)`, paddingTop: '16px', marginTop: '4px', position: 'relative', zIndex: 1, overflow: 'hidden' }}
                        >
                          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {plan.features.map((f, idx) => (
                              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                                <Check size={14} color={red} strokeWidth={3} /> {f}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>

            {/* Форма оплаты */}
            <div className="sec-dash-card" style={{ height: 'fit-content', background: 'rgba(6, 6, 12, 0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(24px)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
              <div className="sec-dash-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div className="sec-dash-icon-box" style={{ background: '#ffdd2d', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255,221,45,0.2)' }}>
                  <CreditCard size={18} color="#000" strokeWidth={2.5} />
                </div>
                <h3 className="sec-dash-title" style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 900, fontFamily: 'var(--font-title)' }}>Оплата Т-Банк</h3>
              </div>
              
              <p className="sec-dash-desc" style={{ marginBottom: '24px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>
                Безопасная оплата картой любого банка РФ через шлюз Т-Банка. Чек об оплате будет отправлен на вашу почту.
              </p>

              <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-title)' }}>Email для получения чека</label>
                  <div className="sec-input-group" style={{ display: 'flex', position: 'relative' }}>
                    <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                      <Mail size={16} />
                    </div>
                    <input 
                      type="email" 
                      required 
                      placeholder="your@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="sec-input" 
                      style={{
                        borderRadius: '0 12px 12px 0', 
                        borderLeft: 'none', 
                        paddingLeft: '8px',
                        flexGrow: 1, 
                        padding: '14px', 
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.08)', 
                        color: '#fff', 
                        outline: 'none',
                        fontSize: '0.92rem',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      }}
                    />
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>К оплате:</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 950, fontFamily: 'var(--font-cyber)', color: '#fff' }}>
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
                    fontSize: '1rem',
                    background: '#ffdd2d',
                    color: '#000',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(255,221,45,0.25)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-cyber)',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffe560'
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(255,221,45,0.45)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffdd2d'
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(255,221,45,0.25)'
                  }}
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : 'Перейти к оплате'}
                </button>
              </form>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', opacity: 0.4, fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
                <span>T-Pay</span>
                <span>Mir Pay</span>
                <span>СБП</span>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  )
}
