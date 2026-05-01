import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Info, X, Wifi, WifiOff, Copy } from 'lucide-react';

/**
 * VEIL Toast System — Premium Notification Toasts
 * ═══════════════════════════════════════════════════
 * Glassmorphism toasts with haptic feedback and auto-dismiss
 */

const ToastContext = createContext(null);

const ICONS = {
  success: { Icon: Check, color: 'var(--green)', bg: 'var(--green-bg)' },
  error: { Icon: AlertTriangle, color: 'var(--red)', bg: 'var(--red-bg)' },
  warning: { Icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-bg)' },
  info: { Icon: Info, color: 'var(--accent-light)', bg: 'var(--accent-subtle)' },
  connected: { Icon: Wifi, color: 'var(--green)', bg: 'var(--green-bg)' },
  disconnected: { Icon: WifiOff, color: 'var(--red)', bg: 'var(--red-bg)' },
  copied: { Icon: Copy, color: 'var(--accent-light)', bg: 'var(--accent-subtle)' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    // Haptic
    if (type === 'success' || type === 'connected') {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } else if (type === 'error' || type === 'disconnected') {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } else {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed', top: 'calc(12px + env(safe-area-inset-top, 0px))',
        left: 16, right: 16, zIndex: 10000,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

function Toast({ id, message, type, duration, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const config = ICONS[type] || ICONS.info;
  const { Icon, color, bg } = config;

  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.95, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, scale: 0.95, filter: 'blur(4px)' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(30,30,45,0.85), rgba(15,15,25,0.7))',
        backdropFilter: 'blur(40px) saturate(250%)',
        WebkitBackdropFilter: 'blur(40px) saturate(250%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 14,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${bg}`,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={onDismiss}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: bg, border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={color} strokeWidth={2.5} />
      </div>
      <span style={{
        fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
        lineHeight: 1.3, flex: 1,
      }}>
        {message}
      </span>
      <X size={14} color="var(--text-muted)" style={{ flexShrink: 0, opacity: 0.5 }} />
    </motion.div>
  );
}
