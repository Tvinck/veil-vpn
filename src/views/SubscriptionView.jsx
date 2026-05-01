import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Star, Users, Zap, Crown, Gift, Copy, Share2 } from 'lucide-react';
import { PLANS } from '../config/routing';
import { useUser } from '../lib/UserContext';
import { supabase } from '../lib/supabase';

export default function SubscriptionView() {
  const { user, setUser } = useUser();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Safe compute days left
  const expiresAt = user?.subscription_expires_at ? new Date(user.subscription_expires_at) : new Date();
  const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
  const totalSubDays = user?.subscription_tier === 'premium' ? 30 : 3; // scale progress bar
  const refCode = user?.referral_code || (user?.telegram_id ? `VEIL-${String(user.telegram_id).substring(0, 5)}` : 'VEIL-VP');
  const totalReferrals = user?.total_referrals || 0;
  const bonusDays = totalReferrals * 3;

  // Russian plural for days
  const pluralDays = (n) => {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return 'дней';
    if (last > 1 && last < 5) return 'дня';
    if (last === 1) return 'день';
    return 'дней';
  };

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(`https://t.me/veilvpns_bot?start=${refCode}`);
    setCopied(true);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `🛡 VEIL — зашифрованный доступ к интернету\n\nПодключайся по моей ссылке и получи 3 дня бесплатно!\n\nhttps://t.me/veilvpns_bot?start=${refCode}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(`https://t.me/veilvpns_bot?start=${refCode}`)}&text=${encodeURIComponent(text)}`);
    } else {
      handleCopyRef();
      alert('Скопировано для отправки');
    }
  };

  return (
    <div className="container pb-nav" style={{ paddingTop: 20 }}>
      <h1 className="text-title" style={{ marginBottom: 6 }}>Подписка</h1>
      <p className="text-body" style={{ marginBottom: 20 }}>Выбери план или пригласи друга</p>

      {/* ── Current Plan ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginBottom: 20, borderColor: 'var(--accent)', borderWidth: 1, position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent)', padding: '4px 12px', borderBottomLeftRadius: 12, fontSize: 11, fontWeight: 700, color: 'white' }}>
          ТЕКУЩИЙ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={22} color="var(--accent-light)" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.is_premium ? 'Premium' : 'Free / Trial'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.is_premium ? 'Активная подписка' : 'Пробный период'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((daysLeft / totalSubDays) * 100, 100)}%` }}
              style={{ height: '100%', background: daysLeft <= 1 ? 'var(--red)' : 'var(--accent)', borderRadius: 3 }}
            />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: daysLeft <= 1 ? 'var(--red)' : 'var(--text-primary)' }}>
            {daysLeft} {pluralDays(daysLeft)}
          </span>
        </div>
      </motion.div>

      {/* ── Referral Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
        style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(108,92,231,0.08), rgba(0,214,143,0.05))', borderColor: 'rgba(108,92,231,0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Gift size={20} color="var(--green)" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Пригласи друга — получи +3 дня</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>За каждого друга +3 бесплатных дня</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-light)', letterSpacing: '0.05em' }}>
            {refCode}
          </span>
          <button
            onClick={handleCopyRef}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: 12 }}
          >
            {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
            {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>

        <button onClick={handleShare} className="btn btn-primary" style={{ width: '100%', height: 44 }}>
          <Share2 size={16} />
          Поделиться ссылкой
        </button>

        {totalReferrals > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Приглашено: <strong style={{ color: 'var(--text-primary)' }}>{totalReferrals}</strong></span>
            <span>Бонус: <strong style={{ color: 'var(--green)' }}>+{bonusDays} дней</strong></span>
          </div>
        )}
      </motion.div>

      {/* ── Plans ── */}
      <p className="text-caption" style={{ marginBottom: 10 }}>Тарифные планы</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Basic */}
        <PlanCard
          plan={PLANS.basic}
          icon={<Star size={20} />}
          isSelected={selectedPlan === 'basic'}
          onSelect={() => setSelectedPlan('basic')}
        />
        {/* Pro */}
        <PlanCard
          plan={PLANS.pro}
          icon={<Crown size={20} />}
          isSelected={selectedPlan === 'pro'}
          onSelect={() => setSelectedPlan('pro')}
          popular
        />
      </div>

      {/* ── Pay Button ── */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ marginTop: 16 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                disabled={isProcessing || !user}
                style={{ width: '100%', height: 52, fontSize: 16, background: 'linear-gradient(135deg, #FFE600 0%, #FFB800 100%)', color: '#000', border: 'none', fontWeight: 700, opacity: isProcessing ? 0.7 : 1, borderRadius: 16, boxShadow: '0 4px 20px rgba(255,230,0,0.3)' }}
                onClick={async () => {
                  if (isProcessing) return;
                  setIsProcessing(true);
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');

                  try {
                     const plan = PLANS[selectedPlan];
                     const response = await fetch('/api/create-invoice', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                             tgUserId: user.telegram_id,
                             planName: plan.nameRu || plan.title,
                             planDuration: plan.days,
                             priceRub: plan.priceStars
                         })
                     });
                     
                     const data = await response.json();
                     if (!response.ok || !data.invoiceUrl) throw new Error(data.error || 'Failed to generate invoice');
                     
                     if (window.Telegram?.WebApp?.openInvoice) {
                         window.Telegram.WebApp.openInvoice(data.invoiceUrl, async (status) => {
                             if (status === 'paid') {
                                 window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
                                 
                                 // Re-sync user to get updated subscription from DB
                                 try {
                                   const res = await fetch('/api/sync-user', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          tgUser: window.Telegram.WebApp.initDataUnsafe?.user || user,
                                          initData: window.Telegram.WebApp.initData || ''
                                      })
                                   });
                                   const syncedUser = await res.json();
                                   if (syncedUser?.user) setUser(syncedUser.user);
                                 } catch (syncErr) {
                                   console.error('Sync after payment failed:', syncErr);
                                 }
                                 
                                 window.Telegram?.WebApp?.showAlert?.(`Подписка успешно оформлена! 🎉`);
                                 setSelectedPlan(null);
                             } else if (status === 'failed') {
                                 window.Telegram?.WebApp?.showAlert?.('Оплата не удалась');
                             }
                             setIsProcessing(false);
                         });
                     } else {
                         window.open(data.invoiceUrl, '_blank');
                         setIsProcessing(false);
                     }
                  } catch (e) {
                      console.error('Payment error:', e);
                      window.Telegram?.WebApp?.showAlert?.('Ошибка: ' + e.message);
                      setIsProcessing(false);
                  }
                }}
              >
                {isProcessing ? 'Формирование инвойса...' : `⭐ Оплатить ${PLANS[selectedPlan]?.priceStars} Stars`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanCard({ plan, icon, isSelected, onSelect, popular }) {
  const handleClick = () => {
    onSelect();
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      className="card"
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        borderColor: isSelected ? 'var(--accent)' : popular ? 'rgba(108,92,231,0.15)' : 'var(--border)',
        position: 'relative',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(108,92,231,0.1), rgba(15,15,25,0.4))'
          : popular
            ? 'linear-gradient(135deg, rgba(30,30,50,0.5), rgba(15,15,25,0.3))'
            : undefined,
        borderWidth: isSelected ? 2 : 1,
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {popular && (
        <div style={{
          position: 'absolute', top: -1, right: 16,
          background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
          padding: '3px 10px',
          borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
          fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.06em',
          boxShadow: '0 2px 8px rgba(108,92,231,0.3)',
        }}>
          ПОПУЛЯРНЫЙ
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <motion.div
          animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: isSelected
              ? 'linear-gradient(135deg, var(--accent), var(--accent-light))'
              : 'var(--accent-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isSelected ? 'white' : 'var(--accent-light)',
            transition: 'all 0.3s',
            boxShadow: isSelected ? '0 4px 16px rgba(108,92,231,0.4)' : 'none',
          }}
        >
          {icon}
        </motion.div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{plan.nameRu}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{plan.days} дней</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>₽{plan.priceRub}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{plan.priceStars} ⭐</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {plan.features.map((f, i) => (
          <div key={i} className="feature-item" style={{ padding: '4px 0' }}>
            <div className="feature-check">
              <Check size={12} color="var(--green)" strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          layoutId="plan-check"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(108,92,231,0.5)',
            }}
          >
            <Check size={14} color="white" strokeWidth={3} />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
