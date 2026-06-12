import { useState } from 'react'
import { Apple, Bot, Monitor, Terminal, Tv, ChevronDown, Check, ExternalLink, Plus, Copy, Settings, Download, CloudDownload, ShieldCheck } from 'lucide-react'
import { OS, ClientApp, Subscription } from '../../types'

interface Props {
  subscription: Subscription
}

const regions = [
  '🇳🇱 Нидерланды (Premium)',
  '🇩🇪 Германия (Premium)',
  '🇫🇮 Финляндия (Premium)',
  '🇷🇺 Россия (Premium)',
  '🇮🇳 Индия (Premium)',
  '🇱🇹 Литва (Premium)',
  '🇬🇧 Великобритания (Premium)',
  '🇺🇸 США (Premium)',
  '🇯🇵 Япония (Premium)'
];

export const ClientInstructions = ({ subscription }: Props) => {
  const [selectedOS, setSelectedOS] = useState<OS>('iOS')
  const [selectedClient, setSelectedClient] = useState<ClientApp>('happ')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const handleCopyKey = () => {
    if (!subscription) return
    const keyUrl = subscription.subscription_key || subscription.token

    let finalCopyText = keyUrl;

    if (keyUrl && (keyUrl.startsWith('vless://') || keyUrl.startsWith('vmess://'))) {
      const baseUrl = keyUrl.split('#')[0];
      finalCopyText = regions.map(region => `${baseUrl}#${encodeURIComponent(region)}`).join('\n');
    }

    navigator.clipboard.writeText(finalCopyText)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleAction = (action: string, link?: string) => {
    if (action === 'copy_key') {
      handleCopyKey()
    } else if (action === 'add_sub') {
      handleCopyKey()
      alert('Ключи (9 регионов) скопированы! Откройте ваше VPN-приложение и вставьте их из буфера обмена (Import from Clipboard).')
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
        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-title)' }}>Установка</h3>
        
        {/* OS Selector */}
        <div style={{ position: 'relative', width: '160px' }}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedOS === 'iOS' || selectedOS === 'macOS' ? <Apple size={16} color="rgba(255,255,255,0.6)" /> : selectedOS === 'Android' ? <Bot size={16} color="rgba(255,255,255,0.6)" /> : selectedOS === 'Linux' ? <Terminal size={16} color="rgba(255,255,255,0.6)" /> : selectedOS === 'Android TV' || selectedOS === 'Apple TV' ? <Tv size={16} color="rgba(255,255,255,0.6)" /> : <Monitor size={16} color="rgba(255,255,255,0.6)" />}
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedOS}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#181b21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              {(['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Android TV', 'Apple TV'] as OS[]).map((os) => (
                <div key={os} onClick={() => { 
                  setSelectedOS(os); 
                  setIsDropdownOpen(false);
                  if (os === 'iOS') setSelectedClient('happ');
                  else if (os === 'Android') setSelectedClient('happ');
                  else if (os === 'Linux') setSelectedClient('happ');
                  else if (os === 'Windows') setSelectedClient('happ');
                  else if (os === 'Android TV') setSelectedClient('happ');
                  else if (os === 'Apple TV') setSelectedClient('happ');
                  else setSelectedClient('happ');
                }}
                  style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: selectedOS === os ? '#fff' : 'rgba(255,255,255,0.7)', background: selectedOS === os ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = selectedOS === os ? 'rgba(255,255,255,0.1)' : 'transparent'}
                >
                  {os}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {(() => {
          let clients: ClientApp[] = [];
          if (selectedOS === 'Windows') clients = ['happ', 'flclashx', 'koala clash', 'Prizrak-box'];
          else if (selectedOS === 'macOS') clients = ['happ', 'flclashx', 'koala clash', 'Prizrak-box'];
          else if (selectedOS === 'iOS') clients = ['happ', 'stash', 'shadowrocket', 'streisand'];
          else if (selectedOS === 'Android') clients = ['happ', 'flclashx', 'clash meta', 'v2rayng'];
          else if (selectedOS === 'Linux') clients = ['happ', 'koala clash', 'Prizrak-box'];
          else if (selectedOS === 'Android TV') clients = ['happ', 'vpn4tv'];
          else if (selectedOS === 'Apple TV') clients = ['happ', 'shadowrocket', 'stash'];
          else clients = ['happ'];

          return clients.map((client) => {
            const isActive = selectedClient === client;
            const dotColor = client === 'happ' ? '#fbbf24' : '#14b8a6';
            return (
              <button key={client} onClick={() => setSelectedClient(client)}
                style={{
                  position: 'relative',
                  padding: '16px 24px',
                  background: isActive ? 'linear-gradient(to right, rgba(20, 184, 166, 0.15), rgba(20, 184, 166, 0.05))' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? 'rgba(20, 184, 166, 0.5)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '12px',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-title)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  overflow: 'hidden',
                  textTransform: 'capitalize'
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, boxShadow: isActive ? `0 0 8px ${dotColor}` : 'none' }}></div>
                <span style={{ zIndex: 1 }}>{client}</span>
              </button>
            )
          });
        })()}
      </div>

      {/* White List Banner */}
      <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <ShieldCheck size={24} color="#14b8a6" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14b8a6', marginBottom: '6px', fontFamily: 'var(--font-title)' }}>Белые списки (Обход РФ)</h4>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0 }}>
            Рекомендуем включить функцию <strong>«Обход локальных сетей и РФ»</strong> в настройках маршрутизации выбранного приложения. Это ускорит загрузку российских сайтов и защитит банковские приложения (Сбербанк, Тинькофф) от блокировок.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(() => {
          const installSteps: any[] = [];
          
          // Helper functions to generate common steps
          const getDownloadStep = (links: {label: string, url: string}[]) => ({
            id: '1', iconType: 'download', title: '1. Скачайте приложение', 
            desc: 'Выберите вашу систему и установите приложение по ссылке ниже.', 
            buttons: links.map(l => ({ label: l.label, iconType: 'external', primary: false, action: 'open_link', link: l.url }))
          });
          
          const getCopyStep = () => ({
            id: '2', iconType: 'copy', title: '2. Скопируйте ключи серверов', 
            desc: 'Нажмите кнопку ниже, чтобы скопировать 9 региональных серверов в буфер обмена.', 
            buttons: [{ label: 'Скопировать сервера', iconType: 'copy', action: 'copy_key', primary: true }]
          });

          const getImportStep = (importInstruction: string) => ({
            id: '3', iconType: 'settings', title: '3. Добавьте сервера в приложение', 
            desc: importInstruction
          });

          const getConnectStep = (connectInstruction: string = 'Выберите нужный сервер из списка и нажмите кнопку подключения.') => ({
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
                getImportStep('Откройте FlClash, перейдите в раздел Профили, нажмите кнопку +, выберите "Из буфера обмена".'),
                getConnectStep()
              );
            } else {
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
                getConnectStep('Выберите нужный сервер в списке, чтобы он подсветился, и нажмите на круглую кнопку VPN внизу справа.')
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
            } else if (selectedClient === 'vpn4tv') {
               installSteps.push(
                 getDownloadStep([{label: 'Скачать', url: '#'}]),
                 getCopyStep(),
                 getImportStep('Следуйте инструкциям в приложении для импорта профилей.'),
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

          return installSteps.map(step => {
            let IconComp = Check;
            let color = '#14b8a6';
            let bg = 'rgba(20, 184, 166, 0.08)';

            if (step.iconType === 'download') IconComp = Download;
            if (step.iconType === 'cloud') IconComp = CloudDownload;
            if (step.iconType === 'settings') { IconComp = Settings; color = '#14b8a6'; bg = 'rgba(20, 184, 166, 0.08)'; }
            if (step.iconType === 'warning') { IconComp = Settings; color = '#f87171'; bg = 'rgba(248, 113, 113, 0.08)'; }
            if (step.iconType === 'check') { IconComp = Check; color = '#14b8a6'; bg = 'rgba(20, 184, 166, 0.08)'; }
            if (step.iconType === 'copy') { IconComp = Copy; color = '#fbbf24'; bg = 'rgba(251, 191, 36, 0.08)'; }

            return (
              <div key={step.id} style={{ display: 'flex', padding: '24px', background: '#171920', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', gap: '20px' }}>
                <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', background: bg, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={22} color={color} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>{step.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: step.buttons ? '16px' : '0' }}>{step.desc}</p>
                  
                  {step.buttons && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {step.buttons.map((btn: any, i: number) => {
                        let BtnIcon = ExternalLink;
                        if (btn.iconType === 'plus') BtnIcon = Plus;
                        if (btn.iconType === 'copy') BtnIcon = Copy;

                        return (
                          <button key={i} onClick={() => {
                            if ('action' in btn) handleAction(btn.action, btn.link);
                          }} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                            background: btn.primary ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${btn.primary ? '#14b8a6' : 'rgba(255,255,255,0.1)'}`,
                            color: btn.primary ? '#14b8a6' : '#14b8a6'
                          }}>
                            <BtnIcon size={16} /> {'action' in btn && btn.action === 'copy_key' && copiedKey ? 'Скопировано!' : btn.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  )
}
