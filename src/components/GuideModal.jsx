import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Copy, Check, ChevronLeft, Smartphone, Monitor, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const GUIDES = {
  ios: {
    title: 'iOS / iPhone',
    icon: <Smartphone size={24} color="var(--text-primary)" />,
    steps: [
      {
        title: '1. Скачать Hiddify',
        desc: 'Установите бесплатное приложение Hiddify из App Store. Это лучший VPN-клиент для iOS с поддержкой VLESS + Reality.',
        action: { label: 'Открыть App Store', href: 'https://apps.apple.com/us/app/hiddify/id6475253816' }
      },
      {
        title: '2. Скопировать ключ',
        desc: 'Нажмите кнопку ниже, чтобы скопировать ваш персональный VLESS-ключ в буфер обмена.',
        copyBtn: true,
      },
      {
        title: '3. Импорт конфига',
        desc: 'Откройте Hiddify → нажмите "+" внизу → "Добавить из буфера обмена". Конфиг автоматически подтянется.',
      },
      {
        title: '4. Подключение',
        desc: 'Нажмите большую круглую кнопку старта. Готово! Весь трафик теперь зашифрован через VEIL.',
        image: '🚀'
      }
    ]
  },
  android: {
    title: 'Android',
    icon: <Smartphone size={24} color="var(--green)" />,
    steps: [
      {
        title: '1. Скачать Hiddify',
        desc: 'Установите Hiddify из Google Play. Приложение бесплатное и поддерживает все современные протоколы.',
        action: { label: 'Открыть Google Play', href: 'https://play.google.com/store/apps/details?id=app.hiddify.com' }
      },
      {
        title: '2. Скопировать ключ',
        desc: 'Нажмите кнопку ниже для копирования вашего VLESS-конфига.',
        copyBtn: true,
      },
      {
        title: '3. Импорт конфига',
        desc: 'В Hiddify нажмите "+" → "Вставить из буфера обмена". Профиль VEIL появится в списке.',
      },
      {
        title: '4. Подключение',
        desc: 'Нажмите кнопку Connect. При первом подключении разрешите VPN-профиль в системе.',
        image: '⚡'
      }
    ]
  },
  mac: {
    title: 'macOS',
    icon: <Monitor size={24} color="var(--text-primary)" />,
    steps: [
      {
        title: '1. Скачать Hiddify',
        desc: 'Установите Hiddify Desktop для macOS с GitHub.',
        action: { label: 'Скачать .dmg', href: 'https://github.com/hiddify/hiddify-next/releases/latest' }
      },
      {
        title: '2. Скопировать ключ',
        desc: 'Скопируйте ваш персональный VLESS-ключ.',
        copyBtn: true,
      },
      {
        title: '3. Импорт в Hiddify',
        desc: 'Откройте Hiddify → "+" → "Добавить из буфера обмена" (или Cmd+V). Нажмите Connect.',
      },
      {
        title: '4. Готово!',
        desc: 'Весь трафик с Mac теперь идёт через зашифрованный VEIL-туннель.',
        image: '🔐'
      }
    ]
  },
  windows: {
    title: 'Windows',
    icon: <Monitor size={24} color="var(--accent)" />,
    steps: [
      {
        title: '1. Скачать Hiddify',
        desc: 'Скачайте Hiddify Desktop для Windows. Работает на Windows 10/11.',
        action: { label: 'Скачать .exe', href: 'https://github.com/hiddify/hiddify-next/releases/latest' }
      },
      {
        title: '2. Скопировать ключ',
        desc: 'Скопируйте ваш уникальный конфиг.',
        copyBtn: true,
      },
      {
        title: '3. Вставить конфиг',
        desc: 'В Hiddify нажмите "+" → "Добавить из буфера обмена" (или Ctrl+V). Профиль VEIL появится.',
      },
      {
        title: '4. Подключиться',
        desc: 'Нажмите кнопку старта. При первом запуске разрешите права администратора для создания VPN-туннеля.',
        image: '💻'
      }
    ]
  }
};

// Common tip added to all platforms
const COMMON_TIPS = {
  title: '⚠️ Важно: Telegram Proxy',
  desc: 'Если у вас включён встроенный Proxy в Telegram (Настройки → Данные → Proxy) — отключите его перед подключением к VEIL. VPN уже шифрует весь трафик, включая Telegram. Двойной туннель вызовет зависания.',
  image: '⚠️'
};

export default function GuideModal({ isOpen, onClose, vpnKey }) {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopy = () => {
    if (!vpnKey) {
      window.Telegram?.WebApp?.showAlert?.('Сначала подключитесь к серверу на главном экране, чтобы получить ключ.');
      return;
    }
    navigator.clipboard?.writeText(vpnKey);
    setCopied(true);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setSelectedPlatform(null);
    setShowQR(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 999
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              background: 'var(--bg-secondary)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '24px 20px',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 20px))',
              zIndex: 1000,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              {selectedPlatform ? (
                <button onClick={() => { setSelectedPlatform(null); setShowQR(false); }} className="btn btn-ghost" style={{ padding: '8px 0', minWidth: 'auto', border: 'none', background: 'transparent' }}>
                  <ChevronLeft size={24} />
                </button>
              ) : (
                <div style={{ width: 24 }} />
              )}
              
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {selectedPlatform ? GUIDES[selectedPlatform].title : 'Как подключиться'}
              </h2>
              
              <button onClick={handleClose} style={{ background: 'var(--bg-primary)', border: 'none', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} color="var(--text-primary)" />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <AnimatePresence mode="wait">
                {!selectedPlatform ? (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                  >
                    {/* QR Code option */}
                    <button
                      onClick={() => setShowQR(!showQR)}
                      style={{
                        display: 'flex', alignItems: 'center', background: vpnKey ? 'rgba(0,214,143,0.05)' : 'var(--bg-primary)',
                        border: vpnKey ? '1px solid rgba(0,214,143,0.2)' : '1px solid var(--border)', borderRadius: 16, cursor: 'pointer', padding: 16,
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: vpnKey ? 'rgba(0,214,143,0.12)' : 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                        <QrCode size={24} color={vpnKey ? 'var(--green)' : 'var(--text-muted)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Сканировать QR-код</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {vpnKey ? 'Отсканируйте камерой в Hiddify' : 'Сначала подключитесь к серверу'}
                        </div>
                      </div>
                    </button>

                    {/* Show QR inline */}
                    <AnimatePresence>
                      {showQR && vpnKey && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ textAlign: 'center', overflow: 'hidden' }}
                        >
                          <div style={{ width: 220, height: 220, margin: '0 auto', background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                            <QRCodeSVG value={vpnKey} size={196} level="M" bgColor="#ffffff" fgColor="#1a1a2e" />
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Откройте Hiddify → «+» → «Сканировать QR»</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Platform guides */}
                    {Object.entries(GUIDES).map(([key, data]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedPlatform(key)}
                        style={{
                          display: 'flex', alignItems: 'center', background: 'var(--bg-primary)',
                          border: '1px solid var(--border)', borderRadius: 16, cursor: 'pointer', padding: 16,
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                          {data.icon}
                        </div>
                        <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{data.title}</div>
                        <ChevronLeft size={20} color="var(--text-muted)" style={{ transform: 'rotate(180deg)' }} />
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="guide"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {GUIDES[selectedPlatform].steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 16 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                              {idx + 1}
                            </div>
                            {idx < GUIDES[selectedPlatform].steps.length - 1 && (
                              <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 8 }} />
                            )}
                          </div>
                          <div style={{ flex: 1, paddingBottom: 24 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{step.title}</div>
                            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: step.action || step.copyBtn ? 12 : 0 }}>
                              {step.desc}
                            </div>
                            
                            {step.action && (
                              <a href={step.action.href} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', padding: '8px 16px', height: 'auto', fontSize: 13 }}>
                                {step.action.label}
                                <ExternalLink size={14} />
                              </a>
                            )}
                            
                            {step.copyBtn && (
                              <button onClick={handleCopy} className="btn btn-ghost" style={{ border: '1px solid var(--accent-light)', color: 'var(--accent-light)', padding: '8px 16px', height: 'auto', fontSize: 13 }}>
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Ключ скопирован!' : vpnKey ? 'Скопировать ключ' : 'Ключ не получен'}
                              </button>
                            )}

                            {step.image && (
                              <div style={{ marginTop: 12, width: '100%', height: 80, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                                {step.image}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Telegram Proxy Warning */}
                      <div style={{ 
                        background: 'rgba(255,165,0,0.06)', 
                        border: '1px solid rgba(255,165,0,0.2)',
                        borderRadius: 16, 
                        padding: 16, 
                        marginTop: 8 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <span style={{ fontSize: 20 }}>⚠️</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange)', marginBottom: 4 }}>{COMMON_TIPS.title}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{COMMON_TIPS.desc}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
