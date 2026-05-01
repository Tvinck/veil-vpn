import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Check, Signal, Users, Zap, MapPin, ArrowUpDown, Shield } from 'lucide-react';



function getPingColor(ping) {
  if (ping < 40) return 'var(--green)';
  if (ping < 70) return 'var(--orange)';
  return 'var(--red)';
}

function getLoadColor(load) {
  if (load < 40) return 'var(--green)';
  if (load < 70) return 'var(--orange)';
  return 'var(--red)';
}

export default function ServersView({ selected, onSelect }) {
  const [sortBy, setSortBy] = useState('ping'); // ping | load | name
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServers() {
      // Load online + coming_soon servers (skip truly offline)
      const { data, error } = await supabase
        .from('veil_servers')
        .select('*')
        .in('status', ['online', 'coming_soon']);
      if (!error && data) {
        const mapped = data.map(s => {
          const isComingSoon = s.status === 'coming_soon';
          
          // Calculate realistic load based on active users vs capacity
          const calculatedLoad = isComingSoon 
            ? 100  // Coming soon = shown as full
            : Math.floor((s.current_users || 0) / (s.max_users || 1000) * 100);
          const load = Math.min(Math.max(calculatedLoad, 0), 100);

          return {
            ...s,
            flag_emoji: s.flag || s.flag_emoji || '🌐',
            country_name: s.location || s.country_name || 'Локация',
            load: load,
            ping: isComingSoon ? 999 : null, // null = measuring
            isComingSoon: isComingSoon,
            tier: 'all'
          };
        });
        // Sort: online first, then coming_soon
        mapped.sort((a, b) => {
          if (a.isComingSoon !== b.isComingSoon) return a.isComingSoon ? 1 : -1;
          return 0;
        });
        setServers(mapped);

        // Measure real ping for online servers
        for (const s of mapped) {
          if (s.isComingSoon) continue;
          try {
            const resp = await fetch(`/api/ping?server_id=${s.id}`);
            const result = await resp.json();
            setServers(prev => prev.map(sv => 
              sv.id === s.id ? { ...sv, ping: result.ping || 999 } : sv
            ));
          } catch {
            setServers(prev => prev.map(sv => 
              sv.id === s.id ? { ...sv, ping: 999 } : sv
            ));
          }
        }
      }
      setLoading(false);
    }
    loadServers();
  }, []);

  const sorted = useMemo(() => {
    const arr = [...servers];
    if (sortBy === 'ping') arr.sort((a, b) => a.ping - b.ping);
    else if (sortBy === 'load') arr.sort((a, b) => a.load - b.load);
    else arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [sortBy, servers]);

  const bestServer = sorted[0];

  return (
    <div className="container pb-nav" style={{ paddingTop: 20 }}>
      <h1 className="text-title" style={{ marginBottom: 6 }}>Серверы</h1>
      <p className="text-body" style={{ marginBottom: 16 }}>Выбери ближайший для минимального пинга</p>

      {/* ── Best Server Recommendation ── */}
      {!loading && bestServer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          onClick={() => {
            onSelect(bestServer);
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
          }}
          style={{ 
            marginBottom: 16, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(0,214,143,0.06), rgba(108,92,231,0.04))',
            borderColor: 'rgba(0,214,143,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="var(--green)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>⚡ ЛУЧШИЙ СЕРВЕР</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{bestServer.flag_emoji} {bestServer.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{bestServer.ping}ms</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bestServer.load}% нагрузка</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Sort Toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="text-caption">ВСЕ СЕРВЕРЫ ({servers.length})</span>
        <button
          onClick={() => setSortBy(s => s === 'ping' ? 'load' : s === 'load' ? 'name' : 'ping')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--accent-light)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
        >
          <ArrowUpDown size={12} />
          {sortBy === 'ping' ? 'По пингу' : sortBy === 'load' ? 'По нагрузке' : 'По имени'}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
            Array(4).fill(0).map((_, idx) => (
              <div key={`skel-${idx}`} className="server-row skeleton-row" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12, opacity: 1 - (idx * 0.15) }}>
                 <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--accent-subtle)' }} className="skeleton-pulse" />
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ width: '40%', height: 14, borderRadius: 4, background: 'var(--accent-subtle)' }} className="skeleton-pulse" />
                    <div style={{ width: '25%', height: 10, borderRadius: 4, background: 'var(--accent-subtle)' }} className="skeleton-pulse" />
                 </div>
                 <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 30, height: 12, borderRadius: 4, background: 'var(--accent-subtle)' }} className="skeleton-pulse" />
                    <div style={{ width: 30, height: 12, borderRadius: 4, background: 'var(--accent-subtle)' }} className="skeleton-pulse" />
                 </div>
              </div>
            ))
        ) : sorted.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Нет доступных серверов</div>
        ) : sorted.map((srv, idx) => (
          <motion.div
            key={srv.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="server-row"
            onClick={() => {
              if (srv.isComingSoon) {
                window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
                return; // Can't select coming_soon servers
              }
              onSelect(srv);
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
            }}
            style={{
              background: selected?.id === srv.id ? 'var(--accent-subtle)' : 'transparent',
              borderLeft: selected?.id === srv.id ? '3px solid var(--accent)' : '3px solid transparent',
              opacity: srv.isComingSoon ? 0.5 : 1,
              cursor: srv.isComingSoon ? 'default' : 'pointer',
            }}
          >
            {/* Flag */}
            <span style={{ fontSize: 28 }}>{srv.flag_emoji}</span>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{srv.name}</span>
                {srv.isComingSoon ? (
                  <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'var(--surface-2)', color: 'var(--text-muted)' }}>Скоро</span>
                ) : (
                  <>
                    {bestServer && srv.id === bestServer.id && !srv.isComingSoon && (
                      <span className="badge badge-green" style={{ fontSize: 9, padding: '2px 6px' }}>⚡ BEST</span>
                    )}
                    {srv.tier === 'pro' && (
                      <span className="badge badge-accent" style={{ fontSize: 9, padding: '2px 6px' }}>PRO</span>
                    )}
                  </>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{srv.country_name}</div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 70 }}>
              {srv.isComingSoon ? (
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Недоступен</span>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <Signal size={12} color={srv.ping === null ? 'var(--text-muted)' : getPingColor(srv.ping)} />
                    <span style={{ color: srv.ping === null ? 'var(--text-muted)' : getPingColor(srv.ping), fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{srv.ping === null ? '...' : `${srv.ping}ms`}</span>
                  </div>
                  {/* Load bar */}
                  <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${srv.load}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.05 }}
                      style={{ height: '100%', borderRadius: 2, background: getLoadColor(srv.load) }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {srv.load}% нагрузка
                  </span>
                </>
              )}
            </div>

            {/* Selected check */}
            {selected?.id === srv.id && !srv.isComingSoon && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Check size={18} color="var(--accent)" strokeWidth={3} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Protocol info */}
      <div style={{ marginTop: 16, padding: '0 4px' }}>
        <p className="text-caption" style={{ marginBottom: 8 }}>Информация о защите</p>
        <div className="card" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🔐</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>VLESS + Reality</strong> — трафик неотличим от HTTPS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🛡️</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>XTLS-Vision</strong> — zero-copy шифрование</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🌐</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>uTLS Chrome</strong> — маскировка под браузер</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🧬</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>Anti-DPI</strong> — фрагментация TLS ClientHello</span>
          </div>
        </div>
      </div>
    </div>
  );
}
