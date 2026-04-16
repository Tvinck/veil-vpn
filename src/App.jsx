import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HomeView from './views/HomeView';
import ServersView from './views/ServersView';
import SubscriptionView from './views/SubscriptionView';
import SettingsView from './views/SettingsView';
import AdminView from './views/AdminView';
import { VeilLogo, GlobeEncrypted } from './components/Icons';
import { Gift, Settings } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'VEIL', Icon: ({ active, ...p }) => <VeilLogo size={22} color={active ? 'var(--accent-light)' : 'var(--text-muted)'} {...p} /> },
  { id: 'servers', label: 'Серверы', Icon: ({ active, ...p }) => <GlobeEncrypted size={22} color={active ? 'var(--accent-light)' : 'var(--text-muted)'} {...p} /> },
  { id: 'subscription', label: 'Подписка', Icon: ({ active, ...p }) => <Gift size={22} strokeWidth={active ? 2.2 : 1.6} {...p} /> },
  { id: 'settings', label: 'Настройки', Icon: ({ active, ...p }) => <Settings size={22} strokeWidth={active ? 2.2 : 1.6} {...p} /> },
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [selectedServer, setSelectedServer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

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
        return <HomeView server={selectedServer} isConnected={isConnected} setIsConnected={setIsConnected} onSelectServer={() => setTab('servers')} />;
      case 'servers':
        return <ServersView selected={selectedServer} onSelect={handleServerSelect} />;
      case 'subscription':
        return <SubscriptionView />;
      case 'settings':
        return <SettingsView onOpenAdmin={() => setTab('admin')} />;
      case 'admin':
        return <AdminView onBack={() => setTab('settings')} />;
      default:
        return null;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          style={{ flex: 1 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom Navigation ── */}
      {tab !== 'admin' && (
        <nav className="bottom-nav">
          <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 480, margin: '0 auto' }}>
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`nav-item ${tab === id ? 'active' : ''}`}
                onClick={() => handleTabChange(id)}
              >
                <Icon active={tab === id} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
