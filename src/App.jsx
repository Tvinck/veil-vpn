import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HomeView from './views/HomeView';
import ServersView from './views/ServersView';
import SubscriptionView from './views/SubscriptionView';
import SettingsView from './views/SettingsView';
import AdminView from './views/AdminView';
import SplashScreen from './components/SplashScreen';
import { VeilLogo, GlobeEncrypted } from './components/Icons';
import { Gift, Settings } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'VEIL', Icon: ({ active, ...p }) => <VeilLogo size={22} color={active ? 'var(--accent-light)' : 'var(--text-muted)'} glow={active} {...p} /> },
  { id: 'servers', label: 'Серверы', Icon: ({ active, ...p }) => <GlobeEncrypted size={22} color={active ? 'var(--accent-light)' : 'var(--text-muted)'} {...p} /> },
  { id: 'subscription', label: 'Подписка', Icon: ({ active, ...p }) => <Gift size={22} strokeWidth={active ? 2.2 : 1.6} {...p} /> },
  { id: 'settings', label: 'Настройки', Icon: ({ active, ...p }) => <Settings size={22} strokeWidth={active ? 2.2 : 1.6} {...p} /> },
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [selectedServer, setSelectedServer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [doubleTunnel, setDoubleTunnel] = useState(() => {
    return localStorage.getItem('veil_double_tunnel') === 'true';
  });

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('veil_selected_server');
    if (saved) {
      try {
        setSelectedServer(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved server');
      }
    }
  }, []);

  // Splash timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = useCallback((id) => {
    setTab(id);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  }, []);

  const handleServerSelect = useCallback((s) => {
    setSelectedServer(s);
    localStorage.setItem('veil_selected_server', JSON.stringify(s));
    setTab('home');
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
  }, []);

  const renderView = () => {
    switch (tab) {
      case 'home':
        return <HomeView server={selectedServer} isConnected={isConnected} setIsConnected={setIsConnected} onSelectServer={() => setTab('servers')} doubleTunnel={doubleTunnel} />;
      case 'servers':
        return <ServersView selected={selectedServer} onSelect={handleServerSelect} />;
      case 'subscription':
        return <SubscriptionView />;
      case 'settings':
        return <SettingsView onOpenAdmin={() => setTab('admin')} doubleTunnel={doubleTunnel} setDoubleTunnel={(v) => { setDoubleTunnel(v); localStorage.setItem('veil_double_tunnel', v.toString()); }} />;
      case 'admin':
        return <AdminView onBack={() => setTab('settings')} />;
      default:
        return null;
    }
  };

  const activeIndex = TABS.findIndex(t => t.id === tab);

  return (
    <>
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ flex: 1 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      {/* ── Premium Bottom Navigation ── */}
      {tab !== 'admin' && (
        <nav className="bottom-nav">
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            maxWidth: 480, margin: '0 auto',
            position: 'relative',
          }}>
            {/* Animated active pill background */}
            <motion.div
              layoutId="nav-pill"
              style={{
                position: 'absolute',
                top: 2, bottom: 2,
                width: `${100 / TABS.length}%`,
                left: `${(activeIndex / TABS.length) * 100}%`,
                background: 'linear-gradient(135deg, rgba(108,92,231,0.12), rgba(162,155,254,0.06))',
                borderRadius: 12,
                border: '1px solid rgba(108,92,231,0.15)',
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />

            {TABS.map(({ id, label, Icon }) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabChange(id)}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <motion.div
                    animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon active={isActive} />
                  </motion.div>
                  <motion.span
                    animate={{
                      color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 600,
                    }}
                    style={{ fontSize: 10, letterSpacing: '0.02em' }}
                  >
                    {label}
                  </motion.span>
                  
                  {/* Active glow dot */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      style={{
                        position: 'absolute', bottom: -1,
                        width: 4, height: 4, borderRadius: '50%',
                        background: 'var(--accent)',
                        boxShadow: '0 0 8px var(--accent-glow)',
                      }}
                      transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Connection status indicator in header area */}
      {isConnected && tab !== 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed', top: 'calc(4px + env(safe-area-inset-top, 0px))',
            right: 12, zIndex: 100,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'rgba(0,214,143,0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,214,143,0.15)',
            borderRadius: 20,
          }}
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 6px var(--green-glow)',
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.06em' }}>
            PROTECTED
          </span>
        </motion.div>
      )}
    </>
  );
}
