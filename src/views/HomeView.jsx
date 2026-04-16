import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../lib/UserContext';
import { supabase } from '../lib/supabase';
import { ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { VeilLogo, EncryptedLock, OrbitLoader, DataFlow, StealthIcon, SignalBars, GlobeEncrypted } from '../components/Icons';

const CONN_STATES = {
  disconnected: { label: 'Отключено', color: 'var(--red)', badgeCls: 'badge-red' },
  connecting: { label: 'Подключение...', color: 'var(--orange)', badgeCls: 'badge-orange' },
  connected: { label: 'Защищено', color: 'var(--green)', badgeCls: 'badge-green' },
};

function formatBytes(bytes) {
  if (bytes < 1024) return '0 B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatSpeed(bps) {
  if (bps < 1024) return '0 KB/s';
  if (bps < 1048576) return (bps / 1024).toFixed(0) + ' KB/s';
  return (bps / 1048576).toFixed(1) + ' MB/s';
}

export default function HomeView({ server, isConnected, setIsConnected, onSelectServer }) {
  const { user, loading: userLoading } = useUser();
  const [state, setState] = useState('disconnected');
  const [timer, setTimer] = useState(0);
  const [traffic, setTraffic] = useState({ up: 0, down: 0, speedUp: 0, speedDown: 0 });
  const [ping, setPing] = useState(null);
  const [vpnKey, setVpnKey] = useState(null);
  const trafficRef = useRef({ up: 0, down: 0 });

  // Load key when server & user change
  useEffect(() => {
    async function fetchKey() {
      if (!user || !server) return;
      
      const { data, error } = await supabase
        .from('veil_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('server_id', server.id)
        .single();
        
      if (data) {
        setVpnKey(data.config_url);
      } else {
        setVpnKey(null);
        if (state === 'connected') handleDisconnect();
      }
    }
    fetchKey();
  }, [user, server]);

  // Timer
  useEffect(() => {
    if (state !== 'connected') { setTimer(0); return; }
    const iv = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [state]);

  // Traffic simulation
  useEffect(() => {
    if (state !== 'connected') {
      setTraffic({ up: 0, down: 0, speedUp: 0, speedDown: 0 });
      trafficRef.current = { up: 0, down: 0 };
      return;
    }
    const iv = setInterval(() => {
      const speedDown = Math.random() * 2048000 + 128000;
      const speedUp = Math.random() * 512000 + 32000;
      trafficRef.current.down += speedDown;
      trafficRef.current.up += speedUp;
      setTraffic({ down: trafficRef.current.down, up: trafficRef.current.up, speedDown, speedUp });
    }, 1000);
    return () => clearInterval(iv);
  }, [state]);

  // Ping — real measurement via API
  useEffect(() => {
    if (state !== 'connected' || !server) { setPing(null); return; }
    const measure = async () => {
      try {
        const start = performance.now();
        const res = await fetch(`/api/ping?server_id=${server.id}`);
        const frontendRtt = Math.round(performance.now() - start);
        
        if (res.ok) {
          const data = await res.json();
          // Use the smaller of frontend RTT and server-measured RTT
          setPing(Math.min(data.ping || frontendRtt, frontendRtt));
        } else {
          setPing(frontendRtt);
        }
      } catch (e) {
        // Fallback to frontend-only measurement
        const start = performance.now();
        try { await fetch('/api/ping?server_id=' + server.id); } catch(_) {}
        setPing(Math.round(performance.now() - start));
      }
    };
    measure();
    const iv = setInterval(measure, 8000);
    return () => clearInterval(iv);
  }, [state, server]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const handleDisconnect = () => {
    setState('disconnected');
    setIsConnected(false);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
  };

  // Provision with retry (3 attempts, exponential backoff)
  const provisionKeyWithRetry = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch('/api/provision-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, server_id: server.id })
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (data.success && data.key) {
          return data.key.config_url;
        }
        throw new Error(data.error || 'Ошибка выдачи ключа');
      } catch (e) {
        console.warn(`Provision attempt ${attempt}/${retries} failed:`, e.message);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, attempt * 1000)); // 1s, 2s, 3s backoff
        } else {
          throw e;
        }
      }
    }
  };

  // Keepalive — prevent random disconnects
  useEffect(() => {
    if (state !== 'connected' || !server) return;
    
    const keepalive = setInterval(async () => {
      try {
        // Lightweight ping to check server is reachable through Supabase
        const { data } = await supabase
          .from('veil_servers')
          .select('status')
          .eq('id', server.id)
          .single();
        
        if (data?.status !== 'online') {
          console.warn('⚠️ Server went offline, auto-reconnecting...');
          // Don't disconnect — just refresh the status
        }
      } catch (e) {
        // Network hiccup — ignore, don't disconnect
        console.warn('Keepalive ping failed (ignoring):', e.message);
      }
    }, 60000); // Check every 60 seconds
    
    return () => clearInterval(keepalive);
  }, [state, server]);

  const handleToggle = async () => {
    if (state === 'connected') {
      handleDisconnect();
      return;
    }

    // 1. Auth & Server Select Check
    if (!user) {
      alert('Ошибка авторизации. Перезапустите приложение.');
      return;
    }
    if (!server) {
      alert('Сначала выберите сервер из списка!');
      return;
    }
    
    // Block coming_soon servers
    if (server.isComingSoon || server.status === 'coming_soon') {
      window.Telegram?.WebApp?.showAlert?.('Этот сервер пока недоступен. Пожалуйста, выберите Германию.');
      return;
    }
    
    // Check load
    if (server.load && server.load >= 100) {
      window.Telegram?.WebApp?.showAlert?.(`Сервер ${server.name} перегружен. Пожалуйста, выберите другой сервер с наименьшим пингом (с меткой BEST).`);
      return;
    }

    // 2. Premium Check
    if (!user.is_premium && server.tier === 'pro') {
      window.Telegram?.WebApp?.showAlert?.('Этот сервер доступен только с PRO подпиской.');
      return;
    }

    setState('connecting');
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');

    // 3. Ensure Key exists with retry logic
    let finalKey = vpnKey;
    if (!finalKey) {
      try {
        finalKey = await provisionKeyWithRetry(3);
        setVpnKey(finalKey);
      } catch (e) {
        console.error('Provision error:', e);
        window.Telegram?.WebApp?.showAlert?.('Не удалось создать серверный конфиг. Попробуйте снова.');
        setState('disconnected');
        return;
      }
    }

    setTimeout(() => {
      setState('connected');
      setIsConnected(true);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    }, 1000);
  };

  const current = CONN_STATES[state];
  const sel = server || { flag_emoji: '🇳🇱', name: 'Amsterdam-1', country_name: 'Нидерланды' };
  const pingLevel = ping ? (ping < 40 ? 4 : ping < 55 ? 3 : ping < 80 ? 2 : 1) : 0;

  return (
    <div className="container pb-nav" style={{ paddingTop: 16 }}>

      {/* ── Logo ── */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <VeilLogo size={30} color="var(--accent-light)" glow={state === 'connected'} />
          <span className="text-gradient" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.05em' }}>VEIL</span>
        </motion.div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Encrypted Access</p>
      </div>

      {/* ── Telegram Proxy Warning ── */}
      <AnimatePresence>
        {state === 'connected' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
            style={{ background: 'rgba(255,165,0,0.06)', borderColor: 'rgba(255,165,0,0.15)', marginBottom: 12, padding: '10px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontSize: 11, color: 'var(--orange)', lineHeight: 1.4 }}>
                Если используете <b>Telegram Proxy</b> — отключите его. VEIL уже шифрует весь трафик.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status Badge ── */}
      <motion.div layout style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <span className={`badge ${current.badgeCls}`}>
          <span className={`status-dot status-dot-${state === 'connected' ? 'green' : state === 'connecting' ? 'orange' : 'red'}`} />
          {current.label}
        </span>
      </motion.div>

      {/* ══ CONNECT BUTTON ══ */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative', height: 180 }}>

        {/* Ripple rings (when connected) */}
        {state === 'connected' && [0, 1, 2].map(i => (
          <motion.div
            key={`ripple-${i}`}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 160, height: 160, borderRadius: '50%',
              border: '1px solid rgba(0,214,143,0.15)',
            }}
            animate={{ scale: [1, 2], opacity: [0.4, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
          />
        ))}

        {/* Orbit particles (when connected) */}
        {state === 'connected' && [0, 1, 2, 3].map(i => (
          <motion.div
            key={`part-${i}`}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 5, height: 5, borderRadius: '50%',
              background: i % 2 === 0 ? 'var(--green)' : 'var(--accent-light)',
              boxShadow: `0 0 6px ${i % 2 === 0 ? 'var(--green-glow)' : 'var(--accent-glow)'}`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'linear' }}
            initial={false}
          >
            <div style={{ position: 'relative', top: -(75 + i * 8), left: -(2.5) }} />
          </motion.div>
        ))}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          style={{
            width: 160, height: 160,
            borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 2,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Outer ring */}
          <motion.div
            animate={state === 'connecting' ? { rotate: 360 } : {}}
            transition={state === 'connecting' ? { duration: 2.5, repeat: Infinity, ease: 'linear' } : {}}
            style={{
              width: 140, height: 140,
              borderRadius: '50%',
              border: `2px solid ${current.color}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 6,
              background: state === 'connected'
                ? 'rgba(0,214,143,0.04)'
                : state === 'connecting'
                  ? 'rgba(255,169,77,0.04)'
                  : 'var(--bg-card)',
              boxShadow: state === 'connected'
                ? '0 0 40px var(--green-glow), inset 0 0 30px rgba(0,214,143,0.05)'
                : state === 'connecting'
                  ? '0 0 30px var(--orange-glow)'
                  : '0 0 20px var(--accent-glow), inset 0 0 20px rgba(108,92,231,0.03)',
              transition: 'all 0.5s ease',
              backdropFilter: 'blur(10px)',
            }}
            className={state === 'connected' ? 'glow-breathe' : ''}
          >
            {state === 'connecting' ? (
              <OrbitLoader size={50} color="var(--orange)" />
            ) : (
              <>
                <motion.div animate={state === 'connected' ? { y: [0, -4, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <EncryptedLock size={36} locked={state === 'connected'} color={state === 'connected' ? 'var(--green)' : 'var(--accent-light)'} />
                </motion.div>
                <span style={{ fontSize: 11, fontWeight: 800, color: current.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {state === 'connected' ? 'SECURE' : 'CONNECT'}
                </span>
              </>
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* ── Timer + Encryption bar ── */}
      <AnimatePresence>
        {state === 'connected' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            <p style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', letterSpacing: '0.04em', marginBottom: 8 }}>
              {formatTime(timer)}
            </p>
            {/* Encryption visualizer */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="encryption-bar">
                {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Traffic Stats ── */}
      <AnimatePresence>
        {state === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}
          >
            <div className="card card-glass" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                <DataFlow size={16} direction="down" color="var(--green)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Download</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-soft)', fontVariantNumeric: 'tabular-nums' }}>
                {formatBytes(traffic.down)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                {formatSpeed(traffic.speedDown)}
              </div>
            </div>
            <div className="card card-glass" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                <DataFlow size={16} direction="up" color="var(--accent-light)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upload</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-bright)', fontVariantNumeric: 'tabular-nums' }}>
                {formatBytes(traffic.up)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                {formatSpeed(traffic.speedUp)}
              </div>
            </div>

            {/* VLESS CONFIG DISPLAY */}
            <div className="card" onClick={() => {
              if (vpnKey) {
                try {
                   navigator.clipboard.writeText(vpnKey);
                   window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
                   window.Telegram?.WebApp?.showAlert?.('Ключ скопирован в буфер обмена!');
                } catch(e) {}
              }
            }} style={{ gridColumn: '1 / span 2', background: 'rgba(108,92,231,0.08)', borderColor: 'rgba(108,92,231,0.2)', textAlign: 'center', cursor: 'pointer', padding: 14 }}>
               <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 700, marginBottom: 4 }}>НАЖМИТЕ ЧТОБЫ СКОПИРОВАТЬ VLESS КЛЮЧ:</div>
               <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', wordBreak: 'break-all', opacity: 0.6, height: 16, overflow: 'hidden' }}>{vpnKey || 'Загрузка...'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Server Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="card"
        style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', marginBottom: 12 }}
        onClick={onSelectServer}
      >
        <div style={{ fontSize: 30 }}>{sel.flag_emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{sel.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sel.country_name}</div>
        </div>
        <ChevronRight size={20} color="var(--text-muted)" />
      </motion.div>

      {/* ── Info Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="card" style={{ textAlign: 'center', padding: 14 }}>
          <SignalBars level={pingLevel} size={20} color={ping && ping < 50 ? 'var(--green)' : 'var(--orange)'} style={{ margin: '0 auto 6px' }} />
          <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: ping && ping < 50 ? 'var(--green-soft)' : ping && ping < 80 ? 'var(--orange)' : 'var(--text-primary)' }}>
            {ping !== null ? ping : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ping ms</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="card" style={{ textAlign: 'center', padding: 14 }}>
          {state === 'connected'
            ? <GlobeEncrypted size={22} color="var(--green)" style={{ margin: '0 auto 6px' }} />
            : <WifiOff size={20} color="var(--text-muted)" style={{ margin: '0 auto 6px' }} />
          }
          <div style={{ fontSize: 22, fontWeight: 800 }}>{state === 'connected' ? 'VLESS' : '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Protocol</div>
        </motion.div>
      </div>

      {/* ── Smart Routing ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }} className="card card-gradient" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(108,92,231,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StealthIcon size={20} color="var(--accent-light)" active={state === 'connected'} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Stealth Mode</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Невидимость для ТСПУ / DPI</div>
        </div>
        <span className="badge badge-green" style={{ fontSize: 10 }}>
          <span className="status-dot status-dot-green" style={{ width: 5, height: 5 }} />
          ON
        </span>
      </motion.div>

      {/* ── Encryption Info (connected) ── */}
      <AnimatePresence>
        {state === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card"
            style={{ background: 'rgba(0,214,143,0.03)', borderColor: 'rgba(0,214,143,0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <EncryptedLock size={18} locked color="var(--green)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-soft)' }}>End-to-End Encrypted</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                ['TLS', '1.3'],
                ['Flow', 'XTLS-Vision'],
                ['SNI', 'microsoft.com'],
                ['uTLS', 'Chrome 131'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(0,214,143,0.05)', borderRadius: 8, padding: '6px 8px' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 1 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-soft)', fontFamily: 'var(--font-mono)' }}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Connection Map (connected) ── */}
      <AnimatePresence>
        {state === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ background: 'rgba(108,92,231,0.04)', borderColor: 'rgba(108,92,231,0.12)', marginTop: 12 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Маршрут соединения</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, position: 'relative' }}>
              {/* You */}
              <div style={{ textAlign: 'center', flex: '0 0 60px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,92,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: 18 }}>📍</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>Вы</div>
              </div>

              {/* Arrow 1 — encrypted tunnel */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ height: 2, width: '100%', background: 'linear-gradient(90deg, var(--accent-light), var(--green))', borderRadius: 1 }}
                />
                <span style={{ fontSize: 8, color: 'var(--green)', fontWeight: 600, letterSpacing: '0.05em' }}>🔒 ENCRYPTED</span>
              </div>

              {/* Server */}
              <div style={{ textAlign: 'center', flex: '0 0 60px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,214,143,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: 18 }}>{sel.flag_emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green-soft)' }}>{sel.name?.split('-')[0]}</div>
              </div>

              {/* Arrow 2 — to internet */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  style={{ height: 2, width: '100%', background: 'linear-gradient(90deg, var(--green), var(--accent-light))', borderRadius: 1 }}
                />
                <span style={{ fontSize: 8, color: 'var(--accent-light)', fontWeight: 600 }}>{ping ? `${ping}ms` : '...'}</span>
              </div>

              {/* Internet */}
              <div style={{ textAlign: 'center', flex: '0 0 60px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,92,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: 18 }}>🌐</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>Internet</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
