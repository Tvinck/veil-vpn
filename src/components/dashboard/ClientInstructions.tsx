import { useState } from 'react'
import { Apple, Bot, Monitor, Terminal, Tv, ChevronDown, Check, ExternalLink, Plus, Copy, Settings, Download, CloudDownload, ShieldCheck } from 'lucide-react'
import { OS, ClientApp, Subscription } from '../../types'
import { useMouseGlow } from '../../hooks/useMouseGlow'

/**
 * Компонент пошаговых инструкций по настройке подключения (ClientInstructions).
 * 
 * Предоставляет инструкции для различных ОС: iOS, Android, Windows, macOS, Android TV, Linux.
 * 
 * Особенности:
 * 1. Фильтрация инструкций в зависимости от выбранной операционной системы и рекомендуемого клиента (например, Hiddify, v2rayNG, Nekobox).
 * 2. Генерация шагов установки: скачивание клиента, импорт токена подписки, запуск подключения.
 * 3. Поддерживает копирование токена подписки одной кнопкой.
 * 
 * @param {object} props - Параметры компонента
 * @param {Subscription} props.subscription - Объект подписки пользователя
 */
interface Props {
  subscription: Subscription
}

interface StepCardProps {
  step: any
  copiedKey: boolean
  handleAction: (action: string, link?: string) => void
}

const StepCard = ({ step, copiedKey, handleAction }: StepCardProps) => {
  const glow = useMouseGlow()
  
  let IconComp = Check;
  let color = '#fbbf24';
  let bg = 'rgba(251, 191, 36, 0.08)';

  if (step.iconType === 'download') { IconComp = Download; color = '#e63950'; bg = 'rgba(230, 57, 80, 0.08)'; }
  if (step.iconType === 'cloud') { IconComp = CloudDownload; color = '#e63950'; bg = 'rgba(230, 57, 80, 0.08)'; }
  if (step.iconType === 'settings') { IconComp = Settings; color = '#38bdf8'; bg = 'rgba(56, 189, 248, 0.08)'; }
  if (step.iconType === 'warning') { IconComp = Settings; color = '#ef4444'; bg = 'rgba(239, 68, 68, 0.08)'; }
  if (step.iconType === 'check') { IconComp = Check; color = '#22c55e'; bg = 'rgba(34, 197, 94, 0.08)'; }
  if (step.iconType === 'copy') { IconComp = Copy; color = '#a855f7'; bg = 'rgba(168, 85, 247, 0.08)'; }

  return (
    <div 
      className="glow-card-cyber sec-guide-step-wrapper"
      onMouseMove={glow.handleMouseMove}
      onMouseEnter={glow.onMouseEnter}
      onMouseLeave={glow.onMouseLeave}
      style={{ 
        ...glow.style,
        display: 'flex', 
        padding: '24px', 
        gap: '20px',
        zIndex: 5
      }}
    >
      <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', background: bg, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconComp size={22} color={color} />
      </div>
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '10px', fontFamily: 'var(--font-title)' }}>{step.title}</h4>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: step.buttons ? '16px' : '0' }}>{step.desc}</p>
        
        {step.buttons && (
          <div className="sec-step-buttons-container" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
            {step.buttons.map((btn: any, i: number) => {
              let BtnIcon = ExternalLink;
              if (btn.iconType === 'plus') BtnIcon = Plus;
              if (btn.iconType === 'copy') BtnIcon = Copy;

              const isPrimary = btn.primary;

              return (
                <button 
                  key={i} 
                  className="sec-step-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if ('action' in btn) handleAction(btn.action, btn.link);
                  }} 
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '11px 22px', 
                    borderRadius: '12px', 
                    fontSize: '0.88rem', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    transition: 'all 0.25s ease',
                    background: isPrimary ? '#e63950' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isPrimary ? '#e63950' : 'rgba(255,255,255,0.12)'}`,
                    color: '#fff',
                    boxShadow: isPrimary ? '0 4px 14px rgba(230, 57, 80, 0.3)' : 'none'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isPrimary ? '#ff4d66' : 'rgba(255,255,255,0.08)';
                    if (isPrimary) e.currentTarget.style.boxShadow = '0 6px 20px rgba(230, 57, 80, 0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isPrimary ? '#e63950' : 'rgba(255,255,255,0.04)';
                    if (isPrimary) e.currentTarget.style.boxShadow = '0 4px 14px rgba(230, 57, 80, 0.3)';
                  }}
                >
                  <BtnIcon size={16} /> {'action' in btn && btn.action === 'copy_key' && copiedKey ? 'Скопировано!' : btn.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export const ClientInstructions = ({ subscription }: Props) => {
  const [selectedOS, setSelectedOS] = useState<OS>('iOS')
  const [selectedClient, setSelectedClient] = useState<ClientApp>('happ')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const subUrl = subscription ? `https://185-142-99-185.sslip.io:2053/api/sub?token=${subscription.token}` : ''

  const handleCopyKey = () => {
    if (!subUrl) return
    navigator.clipboard.writeText(subUrl)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleAction = (action: string, link?: string) => {
    if (action === 'copy_key') {
      handleCopyKey()
    } else if (action === 'add_sub') {
      handleCopyKey()
      alert('Ссылка скопирована! Откройте ваше приложение подключения и выберите Добавить из буфера обмена (Import from Clipboard) или Импорт по URL.')
    } else if (action === 'open_link' && link) {
      if (link !== '#') {
        window.open(link, '_blank', 'noopener,noreferrer')
      } else {
        alert('Ссылка для скачивания временно недоступна.')
      }
    }
  }

  return (
    <div style={{ padding: '0px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>Инструкция по настройке</h3>
        
        {/* OS Selector */}
        <div style={{ position: 'relative', width: '180px', zIndex: 60 }}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            style={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 18px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '14px', 
              color: '#fff', 
              cursor: 'pointer', 
              transition: 'all 0.25s ease' 
            }} 
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(230,57,80,0.4)'} 
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedOS === 'iOS' || selectedOS === 'macOS' ? <Apple size={16} color="#e63950" /> : selectedOS === 'Android' ? <Bot size={16} color="#e63950" /> : selectedOS === 'Linux' ? <Terminal size={16} color="#e63950" /> : selectedOS === 'Android TV' || selectedOS === 'Apple TV' ? <Tv size={16} color="#e63950" /> : <Monitor size={16} color="#e63950" />}
              <span style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{selectedOS}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'rgba(15, 17, 28, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '6px', zIndex: 70, boxShadow: '0 15px 35px rgba(0,0,0,0.5)' }}>
              {(['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Android TV', 'Apple TV'] as OS[]).map((os) => (
                <div key={os} onClick={() => { 
                  setSelectedOS(os); 
                  setIsDropdownOpen(false);
                  setSelectedClient('happ');
                }}
                  style={{ padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, color: selectedOS === os ? '#fff' : 'rgba(255,255,255,0.6)', background: selectedOS === os ? 'rgba(230, 57, 80, 0.15)' : 'transparent', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = selectedOS === os ? 'rgba(230, 57, 80, 0.15)' : 'transparent'}
                >
                  {os}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
        {(() => {
          let clients: ClientApp[] = [];
          if (selectedOS === 'Windows') clients = ['happ', 'flclashx', 'koala clash', 'Prizrak-box'];
          else if (selectedOS === 'macOS') clients = ['happ', 'flclashx', 'koala clash', 'Prizrak-box'];
          else if (selectedOS === 'iOS') clients = ['happ', 'stash', 'shadowrocket', 'streisand'];
          else if (selectedOS === 'Android') clients = ['happ', 'flclashx', 'clash meta', 'v2rayng'];
          else if (selectedOS === 'Linux') clients = ['happ', 'koala clash', 'Prizrak-box'];
          else if (selectedOS === 'Android TV') clients = ['happ'];
          else if (selectedOS === 'Apple TV') clients = ['happ', 'shadowrocket', 'stash'];
          else clients = ['happ'];

          return clients.map((client) => {
            const isActive = selectedClient === client;
            const dotColor = client === 'happ' ? '#ffaa00' : '#e63950';
            return (
              <button 
                key={client} 
                onClick={() => setSelectedClient(client)}
                className={`sec-client-tab ${isActive ? 'sec-client-tab-active' : ''}`}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, boxShadow: isActive ? `0 0 8px ${dotColor}` : 'none', flexShrink: 0 }}></div>
                <span style={{ zIndex: 1, textTransform: 'capitalize' }}>{client}</span>
              </button>
            )
          });
        })()}
      </div>

      {/* White List Banner */}
      <div className="sec-whitelist-banner" style={{ marginBottom: '24px' }}>
        <ShieldCheck size={24} color="#e63950" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '6px', fontFamily: 'var(--font-title)' }}>Оптимизация маршрутизации (Белые списки)</h4>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, margin: 0 }}>
            Рекомендуем включить функцию <strong>«Обход локальных сетей и РФ»</strong> в настройках маршрутизации выбранного приложения. Это обеспечит максимальную скорость загрузки локальных сайтов и стабильную работу сервисов (Госуслуги, банки) без отключения сетевого профиля.
          </p>
        </div>
      </div>

      {/* 1-Click Quick Import Grid */}
      {subUrl && (
        <div style={{ marginBottom: '36px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '24px', padding: '28px' }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '10px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CloudDownload size={22} color="#e63950" />
            Быстрый импорт в 1 клик
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginBottom: '20px', lineHeight: 1.5 }}>
            Выберите ваше приложение ниже, чтобы автоматически импортировать профиль подписки со всеми нашими серверами.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {[
              { name: 'Happ (Hiddify)', link: `happ://add/${subUrl}`, desc: 'Рекомендуется (Кроссплатформенный)', badge: 'Happ / Hiddify', color: '#ffaa00', bg: 'rgba(251, 191, 36, 0.08)' },
              { name: 'Stash', link: `stash://install-config?url=${encodeURIComponent(subUrl)}`, desc: 'Для iOS / macOS (Clash-клиент)', badge: 'Stash', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)' },
              { name: 'Shadowrocket', link: `shadowrocket://add/${subUrl}`, desc: 'Для iOS / Apple TV (Классика)', badge: 'Shadowrocket', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)' },
              { name: 'Sing-box', link: `sing-box://import-remote-profile?url=${encodeURIComponent(subUrl)}`, desc: 'Оригинальный клиент Sing-box', badge: 'Sing-box', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
              { name: 'Clash / FlClash', link: `clash://install-config?url=${encodeURIComponent(subUrl)}`, desc: 'Для всех Clash-клиентов', badge: 'Clash', color: '#e63950', bg: 'rgba(230, 57, 80, 0.08)' },
              { name: 'Streisand', link: `streisand://import/${subUrl}`, desc: 'Для iOS / Apple TV (Streisand)', badge: 'Streisand', color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)' }
            ].map((app) => (
              <a
                key={app.name}
                href={app.link}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = app.color;
                  e.currentTarget.style.background = app.bg;
                  e.currentTarget.style.boxShadow = `0 6px 20px ${app.color}15`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)' }}>{app.name}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: app.color, background: `${app.color}15`, padding: '2px 8px', borderRadius: '6px', border: `1px solid ${app.color}30` }}>
                    {app.badge}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, fontWeight: 500 }}>
                  {app.desc}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {(() => {
          const installSteps: any[] = [];
          
          const getDownloadStep = (links: {label: string, url: string}[]) => ({
            id: '1', iconType: 'download', title: '1. Скачайте приложение', 
            desc: 'Выберите вашу систему и установите приложение по ссылке ниже.', 
            buttons: links.map(l => ({ label: l.label, iconType: 'external', primary: false, action: 'open_link', link: l.url }))
          });
          
          const getCopyStep = () => ({
            id: '2', iconType: 'copy', title: '2. Скопируйте ссылку подключения', 
            desc: 'Нажмите кнопку ниже, чтобы скопировать вашу персональную ссылку. По ней загрузятся все конфигурации серверов и счетчик трафика.', 
            buttons: [{ label: 'Скопировать ссылку', iconType: 'copy', action: 'copy_key', primary: true }]
          });

          const getImportStep = (importInstruction: string) => ({
            id: '3', iconType: 'settings', title: '3. Добавьте в приложение', 
            desc: importInstruction
          });

          const getConnectStep = (connectInstruction: string = 'Выберите нужный сервер из списка и запустите подключение.') => ({
            id: '4', iconType: 'check', title: '4. Подключитесь', 
            desc: connectInstruction
          });

          if (selectedOS === 'Windows') {
            if (selectedClient === 'happ') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать для Windows', url: 'https://github.com/hiddify/hiddify-next/releases/latest/download/Hiddify-Windows-Setup-x64.exe'}]),
                getCopyStep(),
                getImportStep('Откройте Happ, нажмите на кнопку "+" (Добавить) в правом верхнем углу и выберите "Добавить из буфера обмена" (Import from Clipboard).'),
                getConnectStep('Нажмите огромную круглую кнопку для подключения.')
              );
            } else if (selectedClient === 'flclashx') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать FlClash', url: 'https://github.com/chen08209/FlClash/releases/latest/download/FlClash-Windows-x64-Setup.exe'}]),
                getCopyStep(),
                getImportStep('Откройте FlClash, перейдите в раздел Профили, нажмите кнопку +, выберите "Из буфера обмена" и сохраните.'),
                getConnectStep()
              );
            } else if (selectedClient === 'koala clash' || selectedClient === 'Prizrak-box') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать приложение', url: '#'}]),
                getCopyStep(),
                getImportStep('Откройте приложение, найдите раздел добавления профилей/серверов и выберите "Импорт из буфера обмена".'),
                getConnectStep()
              );
            }
          } else if (selectedOS === 'macOS') {
            if (selectedClient === 'happ') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать Happ (GitHub)', url: 'https://github.com/hiddify/hiddify-next/releases/latest'}]),
                getCopyStep(),
                getImportStep('Откройте Happ, нажмите на кнопку "+" и выберите "Добавить из буфера обмена".'),
                getConnectStep('Нажмите огромную круглую кнопку для подключения.')
              );
            } else if (selectedClient === 'flclashx') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать FlClash', url: 'https://github.com/chen08209/FlClash/releases/latest'}]),
                getCopyStep(),
                getImportStep('Откройте FlClash, перейдите в раздел Профили, нажмите кнопку +, выберите "Из буфера обмена" и сохраните.'),
                getConnectStep()
              );
            } else if (selectedClient === 'koala clash' || selectedClient === 'Prizrak-box') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать приложение', url: '#'}]),
                getCopyStep(),
                getImportStep('Откройте приложение, найдите раздел добавления профилей и выберите "Импорт из буфера обмена".'),
                getConnectStep()
              );
            }
          } else if (selectedOS === 'iOS') {
            if (selectedClient === 'happ') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать в App Store', url: 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6598772702'}]),
                getCopyStep(),
                getImportStep('Откройте приложение Happ, нажмите "+" вверху и выберите "Добавить из буфера обмена".'),
                getConnectStep()
              );
            } else if (selectedClient === 'stash') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать Stash', url: 'https://apps.apple.com/us/app/stash/id1596063349'}]),
                getCopyStep(),
                getImportStep('Откройте Stash, перейдите в раздел "Settings" -> "Config File" -> "Download from Clipboard".'),
                getConnectStep()
              );
            } else if (selectedClient === 'shadowrocket') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать Shadowrocket', url: 'https://apps.apple.com/us/app/shadowrocket/id932747118'}]),
                getCopyStep(),
                getImportStep('Откройте Shadowrocket. Приложение автоматически обнаружит ключи в буфере обмена и предложит их добавить. Либо нажмите "+" и выберите Type: Subscribe.'),
                getConnectStep('Выберите нужный сервер из списка и включите главный переключатель вверху экрана.')
              );
            } else if (selectedClient === 'streisand') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать Streisand', url: 'https://apps.apple.com/us/app/streisand/id6450534064'}]),
                getCopyStep(),
                getImportStep('Откройте Streisand, зажмите кнопку "+" и выберите "Import from Clipboard".'),
                getConnectStep()
              );
            }
          } else if (selectedOS === 'Android') {
            if (selectedClient === 'happ') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать в Google Play', url: 'https://play.google.com/store/apps/details?id=app.hiddify.com'}]),
                getCopyStep(),
                getImportStep('Откройте Happ, нажмите на кнопку "+" и выберите "Добавить из буфера обмена" (Import from Clipboard).'),
                getConnectStep('Нажмите круглую кнопку по центру экрана.')
              );
            } else if (selectedClient === 'flclashx') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать APK FlClash', url: 'https://github.com/chen08209/FlClash/releases/latest/download/FlClash-Android-arm64-v8a.apk'}]),
                getCopyStep(),
                getImportStep('Откройте FlClash, перейдите в Профили, нажмите +, выберите "Из буфера обмена".'),
                getConnectStep()
              );
            } else if (selectedClient === 'clash meta') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать APK', url: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases/latest'}]),
                getCopyStep(),
                getImportStep('Откройте приложение, перейдите в Профили, нажмите "+" и вставьте ключи из буфера обмена.'),
                getConnectStep()
              );
            } else if (selectedClient === 'v2rayng') {
              installSteps.push(
                getDownloadStep([{label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.v2ray.ang'}]),
                getCopyStep(),
                getImportStep('Откройте v2rayNG, нажмите на иконку "+" в правом верхнем углу и выберите "Импорт профиля из буфера обмена".'),
                getConnectStep('Выберите нужный сервер в списке, чтобы он подсветился, и нажмите на круглую кнопку подключения внизу справа.')
              );
            }
          } else if (selectedOS === 'Linux') {
             if (selectedClient === 'happ') {
              installSteps.push(
                getDownloadStep([{label: 'Скачать AppImage', url: 'https://github.com/hiddify/hiddify-next/releases/latest/download/Hiddify-Linux-x64.AppImage'}]),
                getCopyStep(),
                getImportStep('Откройте Happ, нажмите "+" и импортируйте из буфера обмена.'),
                getConnectStep()
              );
             } else {
               installSteps.push(
                 getDownloadStep([{label: 'Скачать приложение', url: '#'}]),
                 getCopyStep(),
                 getImportStep('Импортируйте ключи из буфера обмена.'),
                 getConnectStep()
               );
             }
          } else if (selectedOS === 'Android TV') {
            if (selectedClient === 'happ') {
              installSteps.push(
                getDownloadStep([{label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=app.hiddify.com'}]),
                getCopyStep(),
                getImportStep('Откройте приложение на телевизоре. Используйте приложение на телефоне для сканирования QR-кода добавления или передайте скопированные ссылки через буфер обмена Android TV (Android TV Remote).'),
                getConnectStep()
              );
            }
          } else if (selectedOS === 'Apple TV') {
             if (selectedClient === 'happ') {
              installSteps.push(
                getDownloadStep([{label: 'App Store', url: 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6598772702'}]),
                getCopyStep(),
                getImportStep('Откройте приложение на Apple TV. Если у вас включена синхронизация iCloud с iPhone, ваши сервера добавятся автоматически. В противном случае введите ссылки вручную через Apple TV Remote на iPhone.'),
                getConnectStep()
              );
             } else if (selectedClient === 'shadowrocket') {
                installSteps.push(
                 getDownloadStep([{label: 'App Store', url: 'https://apps.apple.com/us/app/shadowrocket/id932747118'}]),
                 getCopyStep(),
                 getImportStep('Рекомендуется добавить ключи в Shadowrocket на iPhone, после чего они синхронизируются на Apple TV через iCloud.'),
                 getConnectStep()
               );
             } else if (selectedClient === 'stash') {
                installSteps.push(
                 getDownloadStep([{label: 'App Store', url: 'https://apps.apple.com/us/app/stash/id1596063349'}]),
                 getCopyStep(),
                 getImportStep('Рекомендуется добавить ключи в Stash на iPhone, после чего они синхронизируются на Apple TV через iCloud.'),
                 getConnectStep()
               );
             }
          }

          return installSteps.map(step => (
            <StepCard 
              key={step.id} 
              step={step} 
              copiedKey={copiedKey} 
              handleAction={handleAction} 
            />
          ));
        })()}
      </div>
    </div>
  )
}
