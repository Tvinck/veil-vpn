import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useMouseGlow } from '../../hooks/useMouseGlow'
import { Server, Wifi, Activity } from 'lucide-react'

interface ServerData {
  id: string
  name: string
  country_code: string
  ip_address: string
  port: number
  ping_ms: number | null
  status: string
  load_percentage: number | null
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '🌐'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  try {
    return String.fromCodePoint(...codePoints)
  } catch (e) {
    return '🌐'
  }
}

export const ServerList = () => {
  const [servers, setServers] = useState<ServerData[]>([])
  const [loading, setLoading] = useState(true)
  const glow = useMouseGlow()

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const { data, error } = await supabase
          .from('vpn_servers')
          .select('*')
          .order('name')
        
        if (!error && data) {
          setServers(data as ServerData[])
        }
      } catch (err) {
        console.error('Error fetching servers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchServers()
    
    // Set up polling every 30 seconds for live ping updates
    const interval = setInterval(fetchServers, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="sec-dash-card" style={{ padding: '24px', marginBottom: '32px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Загрузка списка серверов...</p>
      </div>
    )
  }

  if (servers.length === 0) {
    return null
  }

  return (
    <div 
      className="sec-dash-card glow-card-cyber"
      onMouseMove={glow.handleMouseMove}
      onMouseEnter={glow.onMouseEnter}
      onMouseLeave={glow.onMouseLeave}
      style={{ 
        ...glow.style,
        padding: '28px', 
        marginBottom: '32px',
        zIndex: 5
      }}
    >
      <div className="sec-dash-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div className="sec-dash-icon-box" style={{ background: 'rgba(230,57,80,0.12)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Server size={18} color="#e63950" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="sec-dash-title" style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Наши Сервера</h3>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Все локации поддерживают TCP (Vision) и gRPC протоколы</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {servers.map((s) => {
          const ping = s.ping_ms ?? 0
          const load = s.load_percentage ?? 0
          
          let pingColor = '#22c55e' // Green
          if (ping > 70 && ping <= 150) pingColor = '#fbbf24' // Yellow
          if (ping > 150 || ping === 0) pingColor = '#ef4444' // Red

          let loadColor = '#22c55e'
          if (load > 50 && load <= 80) loadColor = '#fbbf24'
          if (load > 80) loadColor = '#ef4444'

          const isOnline = s.status === 'online'

          return (
            <div 
              key={s.id}
              style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(230, 57, 80, 0.2)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.01)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{getFlagEmoji(s.country_code)}</span>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'var(--font-title)' }}>
                    {s.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>TCP</span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>gRPC</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                {isOnline ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: pingColor }}>
                      <Wifi size={14} strokeWidth={2.5} />
                      <span>{ping ? `${ping} ms` : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                      <Activity size={12} color="rgba(255,255,255,0.3)" />
                      <span style={{ color: loadColor }}>{load}%</span>
                      <span>нагрузка</span>
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: '8px' }}>
                    офлайн
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
