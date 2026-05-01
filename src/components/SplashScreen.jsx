import { motion } from 'framer-motion';
import { VeilLogo } from './Icons';

/**
 * VEIL Splash Screen — Premium animated loading screen
 * ═══════════════════════════════════════════════════════
 * Glassmorphism + orbital particles + staggered reveal
 */
export default function SplashScreen({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#06060c',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          animate={{ 
            x: [0, 30, -20, 0],
            y: [0, -20, 10, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '10%', left: '15%',
            width: '50vw', height: '50vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108,92,231,0.2), transparent 60%)',
          }}
        />
        <motion.div
          animate={{ 
            x: [0, -20, 30, 0],
            y: [0, 30, -10, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '5%', right: '10%',
            width: '60vw', height: '60vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,214,143,0.15), transparent 60%)',
          }}
        />
      </div>

      {/* Orbital ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: 200, height: 200,
          borderRadius: '50%',
          border: '1px solid rgba(108,92,231,0.08)',
        }}
      >
        <motion.div
          style={{
            position: 'absolute', top: -3, left: '50%', marginLeft: -3,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-light)',
            boxShadow: '0 0 12px rgba(108,92,231,0.6)',
          }}
        />
      </motion.div>

      {/* Second orbital ring (counter-rotate) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: 260, height: 260,
          borderRadius: '50%',
          border: '1px solid rgba(0,214,143,0.06)',
        }}
      >
        <motion.div
          style={{
            position: 'absolute', bottom: -2, left: '50%', marginLeft: -2,
            width: 4, height: 4, borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 8px rgba(0,214,143,0.5)',
          }}
        />
      </motion.div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, type: 'spring', damping: 12, stiffness: 100 }}
        style={{ position: 'relative', zIndex: 2, marginBottom: 24 }}
      >
        <motion.div
          animate={{ 
            boxShadow: [
              '0 0 30px rgba(108,92,231,0.2), 0 0 60px rgba(108,92,231,0.05)',
              '0 0 50px rgba(108,92,231,0.4), 0 0 100px rgba(108,92,231,0.1)',
              '0 0 30px rgba(108,92,231,0.2), 0 0 60px rgba(108,92,231,0.05)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(30,30,45,0.6), rgba(15,15,25,0.3))',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderTop: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <VeilLogo size={40} color="var(--accent-light)" glow />
        </motion.div>
      </motion.div>

      {/* Brand Name */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #74b9ff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', position: 'relative', zIndex: 2,
          marginBottom: 8,
        }}
      >
        VEIL
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        style={{
          fontSize: 13, color: 'var(--text-muted)', fontWeight: 500,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          position: 'relative', zIndex: 2,
        }}
      >
        Encrypted Access
      </motion.p>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: 'absolute', bottom: 80,
          width: 120, height: 3, borderRadius: 2,
          background: 'rgba(108,92,231,0.1)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '50%', height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, transparent, var(--accent-light), transparent)',
          }}
        />
      </motion.div>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.2 }}
        style={{
          position: 'absolute', bottom: 50,
          fontSize: 11, color: 'var(--text-muted)', fontWeight: 500,
        }}
      >
        v2.0
      </motion.p>
    </motion.div>
  );
}
