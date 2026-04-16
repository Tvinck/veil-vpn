import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Smartphone, QrCode, FileKey, ExternalLink, ChevronRight, ToggleLeft, ToggleRight, Info, Copy, Check, AlertTriangle, ChevronDown, ShieldAlert } from 'lucide-react';
import { DIRECT_DOMAINS, PROXY_DOMAINS, STEALTH_CONFIG } from '../config/routing';
import { StealthIcon, TunnelIcon, GlobeEncrypted, FingerprintIcon } from '../components/Icons';
import GuideModal from '../components/GuideModal';
import { useUser } from '../lib/UserContext';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

export default function SettingsView({ onOpenAdmin }) {
  const { user } = useUser();
  const isAdmin = user?.is_admin || false;
  const [smartRouting, setSmartRouting] = useState(true);
  const [autoConnect, setAutoConnect] = useState(false);
  const [protocol, setProtocol] = useState('vless-reality');
  const [antiDPI, setAntiDPI] = useState(true);
  const [showDomains, setShowDomains] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [vpnKey, setVpnKey] = useState(null);

  // Load real VPN key for this user
  useEffect(() => {
    if (!user) return;
    supabase
      .from('veil_keys')
      .select('config_url')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setVpnKey(data[0].config_url);
      });
  }, [user]);

  const toggleSmartRouting = useCallback(() => {
    setSmartRouting(v => !v);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  }, []);

  const handleCopyConfig = useCallback(() => {
    if (!vpnKey) {
      window.Telegram?.WebApp?.showAlert?.('Сначала подключитесь к серверу чтобы получить ключ.');
      return;
    }
    navigator.clipboard?.writeText(vpnKey);
    setCopied(true);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    setTimeout(() => setCopied(false), 2000);
  }, [vpnKey]);

  const Toggle = ({ value, onChange }) => (
    <button onClick={onChange} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      {value
        ? <ToggleRight size={28} color="var(--green)" fill="var(--green)" />
        : <ToggleLeft size={28} color="var(--text-muted)" />
      }
    </button>
  );


  return (
    <div className="container pb-nav" style={{ paddingTop: 20 }}>
      <h1 className="text-title" style={{ marginBottom: 6 }}>Настройки</h1>
      <p className="text-body" style={{ marginBottom: 20 }}>Индивидуальная защита соединения</p>

      {/* ── Connection Settings ── */}
      <p className="text-caption" style={{ marginBottom: 8 }}>Трафик и Маршруты</p>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <SettingRow
          icon={<GlobeEncrypted size={18} color="var(--accent-light)" />}
          iconBg="var(--accent-subtle)"
          label="Smart Routing"
          description={`${DIRECT_DOMAINS.length} доменов → напрямую`}
          right={<Toggle value={smartRouting} onChange={toggleSmartRouting} />}
        />
        <SettingRow
          icon={<Zap size={18} color="var(--orange)" />}
          iconBg="var(--orange-bg)"
          label="Автоподключение"
          description="Подключаться при запуске"
          right={<Toggle value={autoConnect} onChange={() => { setAutoConnect(!autoConnect); window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); }} />}
        />
        <SettingRow
          icon={<StealthIcon size={18} color="var(--green)" active={antiDPI} />}
          iconBg="var(--green-bg)"
          label="Anti-DPI фрагментация"
          description="Разбивает TLS ClientHello"
          right={<Toggle value={antiDPI} onChange={() => { setAntiDPI(!antiDPI); window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); }} />}
          isLast={false}
        />
        <SettingRow
          icon={<TunnelIcon size={18} color="var(--accent-light)" />}
          iconBg="var(--accent-subtle)"
          label="Протокол"
          description={protocol === 'vless-reality' ? 'VLESS + Reality (рекомендуется)' : 'Shadowsocks-2022 (fallback)'}
          right={<ChevronRight size={18} color="var(--text-muted)" />}
          onClick={() => setProtocol(p => p === 'vless-reality' ? 'shadowsocks' : 'vless-reality')}
          isLast
        />
      </div>

      {/* ── Stealth Config ── */}
      <p className="text-caption" style={{ marginBottom: 8 }}>Маскировка</p>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoChip label="SNI" value={STEALTH_CONFIG.sniTargets[0].replace('www.', '')} />
          <InfoChip label="Fingerprint" value="Chrome" />
          <InfoChip label="Flow" value="XTLS-Vision" />
          <InfoChip label="TLS" value="1.3" />
        </div>
        {antiDPI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoChip label="Fragment" value={STEALTH_CONFIG.antiDPI.fragmentLength} color="var(--orange)" />
              <InfoChip label="Interval" value={`${STEALTH_CONFIG.antiDPI.fragmentInterval}ms`} color="var(--orange)" />
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Export ── */}
      <p className="text-caption" style={{ marginBottom: 8 }}>Экспорт конфига</p>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <SettingRow
          icon={<QrCode size={18} />}
          iconBg="var(--accent-subtle)"
          iconColor="var(--accent-light)"
          label="QR-код для телефона"
          description="Отсканируй в Hiddify или v2rayN"
          right={<ChevronRight size={18} color="var(--text-muted)" />}
          onClick={() => setShowQR(!showQR)}
        />
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ padding: '0 16px 16px', textAlign: 'center' }}
            >
              {vpnKey ? (
                <>
                  <div style={{ width: 220, height: 220, margin: '0 auto', background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                    <QRCodeSVG
                      value={vpnKey}
                      size={196}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#1a1a2e"
                      includeMargin={false}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 10, fontWeight: 600 }}>✅ Отсканируйте в Hiddify или v2rayN</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>QR содержит ваш персональный VLESS ключ</p>
                </>
              ) : (
                <>
                  <div style={{ width: 200, height: 200, margin: '0 auto', background: 'var(--bg-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, border: '1px dashed var(--border)' }}>
                    <QrCode size={40} color="var(--text-muted)" />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет ключа</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--orange)', marginTop: 10, fontWeight: 600 }}>⚠️ Сначала подключитесь к серверу на главном экране</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <SettingRow
          icon={copied ? <Check size={18} /> : <FileKey size={18} />}
          iconBg={copied ? 'var(--green-bg)' : 'var(--green-bg)'}
          iconColor={copied ? 'var(--green)' : 'var(--green)'}
          label={copied ? 'Скопировано!' : 'Скопировать VLESS ссылку'}
          description="Для ручного подключения"
          right={<Copy size={18} color="var(--text-muted)" />}
          onClick={handleCopyConfig}
        />
        <SettingRow
          icon={<Smartphone size={18} />}
          iconBg="var(--orange-bg)"
          iconColor="var(--orange)"
          label="Инструкции по настройке"
          description="iOS, Android, Windows, macOS"
          right={<ChevronRight size={18} color="var(--text-muted)" />}
          onClick={() => setShowGuide(true)}
          isLast
        />
      </div>

      {/* ── Domain Lists ── */}
      <p className="text-caption" style={{ marginBottom: 8 }}>Маршрутизация доменов</p>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <SettingRow
          icon={<span style={{ fontSize: 16 }}>🏦</span>}
          label={`Напрямую (${DIRECT_DOMAINS.length})`}
          description="Банки, госуслуги, VK, Yandex, 1С"
          right={<ChevronRight size={18} color="var(--text-muted)" />}
          onClick={() => setShowDomains(showDomains === 'direct' ? null : 'direct')}
        />
        <AnimatePresence>
          {showDomains === 'direct' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ padding: '0 16px 12px', maxHeight: 250, overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {DIRECT_DOMAINS.map(d => (
                  <span key={d} style={{ fontSize: 10, color: 'var(--green)', background: 'var(--green-bg)', padding: '2px 7px', borderRadius: 6, fontFamily: 'monospace' }}>{d}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <SettingRow
          icon={<span style={{ fontSize: 16 }}>🔓</span>}
          label={`Через VEIL (${PROXY_DOMAINS.length})`}
          description="Instagram, YouTube, Discord, AI, Dev"
          right={<ChevronRight size={18} color="var(--text-muted)" />}
          onClick={() => setShowDomains(showDomains === 'proxy' ? null : 'proxy')}
          isLast
        />
        <AnimatePresence>
          {showDomains === 'proxy' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ padding: '0 16px 12px', maxHeight: 250, overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PROXY_DOMAINS.map(d => (
                  <span key={d} style={{ fontSize: 10, color: 'var(--accent-light)', background: 'var(--accent-subtle)', padding: '2px 7px', borderRadius: 6, fontFamily: 'monospace' }}>{d}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Info ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card" style={{ background: 'var(--accent-subtle)', borderColor: 'rgba(108,92,231,0.15)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={18} color="var(--accent-light)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Как это работает?</strong><br />
            VEIL использует VLESS+Reality с маскировкой под {STEALTH_CONFIG.sniTargets[0]}. DPI-системы видят обычный HTTPS-трафик к Microsoft. Anti-DPI фрагментация разбивает TLS-хэндшейк на части, обходя глубокую инспекцию пакетов ТСПУ.
          </div>
        </div>
      </motion.div>

      {/* ── Admin Area ── */}
      {isAdmin && (
        <>
          <p className="text-caption" style={{ marginBottom: 8, marginTop: 16 }}>Администрирование</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <SettingRow
              icon={<ShieldAlert size={18} />}
              iconBg="rgba(255,107,107,0.1)"
              iconColor="var(--error)"
              label="Панель Управления"
              description="Мониторинг серверов и юзеров"
              right={<ChevronRight size={18} color="var(--text-muted)" />}
              onClick={onOpenAdmin}
              isLast
            />
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>VEIL v1.1 • Encrypted Access</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {DIRECT_DOMAINS.length} direct • {PROXY_DOMAINS.length} proxy • Anti-DPI {antiDPI ? '✅' : '❌'}
        </p>
      </div>
      
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} vpnKey={vpnKey} />
    </div>
  );
}

function SettingRow({ icon, iconBg, iconColor, label, description, right, onClick, isLast }) {
  return (
    <div
      className="server-row"
      onClick={onClick}
      style={{ borderBottom: isLast ? 'none' : undefined, cursor: onClick ? 'pointer' : 'default' }}
    >
      {iconBg ? (
        <div style={{ width: 34, height: 34, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
          {icon}
        </div>
      ) : (
        <div style={{ width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{description}</div>}
      </div>
      {right}
    </div>
  );
}

function InfoChip({ label, value, color = 'var(--accent-light)' }) {
  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
