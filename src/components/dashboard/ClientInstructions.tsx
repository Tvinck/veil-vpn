import { useState } from 'react'
import { Apple, Bot, Monitor, Terminal, Tv, ChevronDown, Check, ExternalLink, Plus, Copy, Settings, Download, CloudDownload, ShieldCheck } from 'lucide-react'
import { OS, ClientApp, Subscription } from '../../types'

interface Props {
  subscription: Subscription
}

export const ClientInstructions = ({ subscription }: Props) => {
  const [selectedOS, setSelectedOS] = useState<OS>('iOS')
  const [selectedClient, setSelectedClient] = useState<ClientApp>('Happ')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const handleCopyKey = () => {
    if (!subscription) return
    const keyUrl = `https://api.veilvpn.net/sub/${subscription.token}`
    navigator.clipboard.writeText(keyUrl)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleAction = (action: string) => {
    if (!subscription) return
    const subUrl = `https://api.veilvpn.net/sub/${subscription.token}`
    
    if (action === 'copy_key') {
      handleCopyKey()
    } else if (action === 'add_sub') {
      // Basic scheme for specific clients (simplified for this component)
      if (selectedClient === 'Happ' || selectedClient === 'v2rayNG' || selectedClient === 'Shadowrocket') {
        window.location.href = `v2ray://install-sub?url=${encodeURIComponent(subUrl)}`
      } else if (selectedClient === 'Stash') {
        window.location.href = `stash://install-config?url=${encodeURIComponent(subUrl)}`
      } else {
        handleCopyKey()
        alert('Ключ скопирован! Добавьте его в приложение вручную.')
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
                      if (os === 'iOS') setSelectedClient('Happ');
                      else if (os === 'Android') setSelectedClient('Happ');
                      else if (os === 'Linux') setSelectedClient('FIClashX');
                      else if (os === 'Windows') setSelectedClient('Happ');
                      else if (os === 'Android TV') setSelectedClient('Happ');
                      else if (os === 'Apple TV') setSelectedClient('Happ');
                      else setSelectedClient('Happ');
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
              if (selectedOS === 'Windows') clients = ['Happ', 'FIClashX', 'Koala Clash', 'Prizrak-Box'];
              else if (selectedOS === 'macOS') clients = ['Happ', 'FIClashX', 'Koala Clash', 'Prizrak-Box'];
              else if (selectedOS === 'iOS') clients = ['Happ', 'Stash', 'Shadowrocket', 'Streisand'];
              else if (selectedOS === 'Android') clients = ['Happ', 'FIClashX', 'Clash Meta', 'v2rayNG'];
              else if (selectedOS === 'Linux') clients = ['FIClashX', 'Koala Clash', 'Prizrak-Box'];
              else if (selectedOS === 'Android TV') clients = ['Happ', 'vpn4tv'];
              else if (selectedOS === 'Apple TV') clients = ['Happ', 'Shadowrocket', 'Stash'];
              else clients = ['Happ'];

              return clients.map((client) => {
                const isActive = selectedClient === client;
                const dotColor = client === 'Happ' ? '#fbbf24' : '#14b8a6';
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
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, boxShadow: isActive ? `0 0 8px ${dotColor}` : 'none' }}></div>
                    <span style={{ zIndex: 1 }}>{client}</span>
                    {/* Subtle watermark background based on client */}
                    {client === 'Happ' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.1, fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>H</div>}
                    {client === 'FIClashX' && <div style={{ position: 'absolute', right: '-5px', opacity: 0.1, fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>X</div>}
                    {client === 'Koala Clash' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.05, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>🐨</div>}
                    {client === 'Prizrak-Box' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.08, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>👻</div>}
                    {client === 'Stash' && <div style={{ position: 'absolute', right: '-5px', opacity: 0.1, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>⚛️</div>}
                    {client === 'Shadowrocket' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.08, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>🚀</div>}
                    {client === 'Streisand' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.08, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>🧊</div>}
                    {client === 'Clash Meta' && <div style={{ position: 'absolute', right: '-10px', opacity: 0.05, fontSize: '3rem', fontWeight: 900, color: '#fff' }}>🐱</div>}
                    {client === 'v2rayNG' && <div style={{ position: 'absolute', right: '-5px', opacity: 0.08, fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>V</div>}
                    {client === 'vpn4tv' && <div style={{ position: 'absolute', right: '0px', opacity: 0.06, fontSize: '1.4rem', fontWeight: 900, color: '#fff', textAlign: 'right', lineHeight: 0.8 }}>VPN<br/>4TV</div>}
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
                Рекомендуем включить функцию <strong>«Обход локальных сетей и РФ»</strong> (или Bypass LAN and RU) в настройках маршрутизации выбранного приложения. Это ускорит загрузку российских сайтов и защитит банковские приложения (Сбербанк, Тинькофф) от блокировок.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
              const installSteps = [];
              if (selectedOS === 'macOS') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'App Store (RU)', iconType: 'external', primary: false }, { label: 'App Store (Global)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                } else if (selectedClient === 'FIClashX') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'macOS (Apple Silicon)', iconType: 'external', primary: false }, { label: 'macOS (Intel)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FIClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.' }
                  );
                } else if (selectedClient === 'Koala Clash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'macOS (Apple Silicon)', iconType: 'external', primary: false }, { label: 'macOS (Intel)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash. ⚠️ Предупреждение: Если при запуске приложения на macOS появляется уведомление, что приложение повреждено, выполните эту команду в терминале: sudo xattr -r -c /Applications/Koala\\ Clash.app' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.' }
                  );
                } else if (selectedClient === 'Prizrak-Box') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Скачайте архив под ваш чип (Apple Silicon или Intel), распакуйте и переместите Prizrak-Box.app в Applications.', buttons: [{ label: 'macOS (Apple Silicon)', iconType: 'external', primary: false }, { label: 'macOS (Intel)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Прочти перед первым запуском', desc: 'Если macOS показывает предупреждения безопасности — следуйте инструкции.', buttons: [{ label: 'Инструкция для Mac', iconType: 'external', primary: false }] },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку «Получить ссылку» в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел «Профили», нажмите кнопку «+», вставьте скопированную ссылку и нажмите «Подтвердить».', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.' }
                  );
                }
              } else if (selectedOS === 'Android TV') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.', buttons: [{ label: 'Открыть в Google Play', iconType: 'external', primary: false }, { label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'settings', title: 'Инструкции по установке', desc: 'Подробные инструкции, чтобы помочь вам настроить Happ на вашем устройстве.', buttons: [{ label: 'На русском', iconType: 'external', primary: false }, { label: 'На английском', iconType: 'external', primary: false }] },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Откройте приложение и подключитесь к серверу' }
                  );
                } else if (selectedClient === 'vpn4tv') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.', buttons: [{ label: 'Открыть в Google Play', iconType: 'external', primary: false }, { label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'settings', title: 'Инструкции по установке', desc: 'Подробные инструкции, чтобы помочь вам настроить VPN4TV на вашем устройстве.', buttons: [{ label: 'Краткое руководство', iconType: 'external', primary: false }, { label: 'Инструкция для Sber Box', iconType: 'external', primary: false }] },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Откройте приложение и подключитесь к серверу' }
                  );
                }
              } else if (selectedOS === 'Apple TV') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store на Apple TV и установите приложение. Запустите его, предоставьте разрешение на VPN-конфигурацию, если потребуется, и введите свой пароль.', buttons: [{ label: 'App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'settings', title: 'Инструкции по установке', desc: 'Подробные инструкции, чтобы помочь вам настроить Happ на вашем устройстве.', buttons: [{ label: 'На русском', iconType: 'external', primary: false }, { label: 'На английском', iconType: 'external', primary: false }] },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Откройте приложение и подключитесь к серверу' }
                  );
                } else if (selectedClient === 'Shadowrocket') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.', buttons: [{ label: 'Открыть в App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                } else if (selectedClient === 'Stash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение.', buttons: [{ label: 'Открыть в App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение Stash откроется, и конфигурация будет добавлена автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'На главном экране нажмите кнопку «Запуск». В появившемся окне разрешите добавление конфигураций VPN. После активации профиля перейдите в раздел «Политика» и выберите страну подключения.' }
                  );
                }
              } else if (selectedOS === 'iOS') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.', buttons: [{ label: 'App Store (RU)', iconType: 'external', primary: false }, { label: 'App Store (Global)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                } else if (selectedClient === 'Stash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение.', buttons: [{ label: 'Открыть в App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение Stash откроется, и конфигурация будет добавлена автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'На главном экране нажмите кнопку «Запуск». В появившемся окне разрешите добавление конфигураций VPN. После активации профиля перейдите в раздел «Политика» и выберите страну подключения.' }
                  );
                } else {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.', buttons: [{ label: 'Открыть в App Store', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                }
              } else if (selectedOS === 'Android') {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.', buttons: [{ label: 'Открыть в Google Play', iconType: 'external', primary: false }, { label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'Откройте приложение и подключитесь к серверу' }
                  );
                } else if (selectedClient === 'FIClashX') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Скачайте и установите FIClashX APK', buttons: [{ label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FIClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.' }
                  );
                } else if (selectedClient === 'Clash Meta') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Скачайте и установите Clash Meta APK', buttons: [{ label: 'Скачать APK', iconType: 'external', primary: false }, { label: 'Открыть в F-Droid', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — откроется окно создания профиля. Тебе потребуется указать период автообновления, например, 720 минут. Справа вверху нажми на кнопку Сохранить.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'Перейди в пункт Профили и выбери созданный профиль, затем вернись на главную страницу. Теперь ты можешь подключиться, нажав на кнопку Остановлен' }
                  );
                } else if (selectedClient === 'v2rayNG') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Скачайте и установите v2rayNG APK', buttons: [{ label: 'Скачать APK', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Обновление подписки', desc: 'Нажмите на три точечки справа сверху и выберите Обновить подписку. После этого в списке появятся доступные серверы' },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите требуемый сервер и нажмите кнопку Включить в правом нижнем углу' }
                  );
                }
              } else if (selectedOS === 'Linux') {
                if (selectedClient === 'FIClashX') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'amd64 (.deb)', iconType: 'external', primary: false }, { label: 'amd64 (AppImage)', iconType: 'external', primary: false }, { label: 'amd64 (.rpm)', iconType: 'external', primary: false }, { label: 'arm64 (.deb)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FIClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.' }
                  );
                } else if (selectedClient === 'Koala Clash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'amd64 (.deb)', iconType: 'external', primary: false }, { label: 'amd64 (.rpm)', iconType: 'external', primary: false }, { label: 'arm64 (.deb)', iconType: 'external', primary: false }, { label: 'arm64 (.rpm)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash.' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.' }
                  );
                } else if (selectedClient === 'Prizrak-Box') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите пакет под вашу архитектуру и установите Prizrak-Box.', buttons: [{ label: 'amd64 (.deb)', iconType: 'external', primary: false }, { label: 'amd64 (.rpm)', iconType: 'external', primary: false }, { label: 'arm64 (.deb)', iconType: 'external', primary: false }, { label: 'arm64 (.rpm)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Запустите программу.' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку «Получить ссылку» в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел «Профили», нажмите кнопку «+», вставьте скопированную ссылку и нажмите «Подтвердить».', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.' }
                  );
                }
              } else {
                if (selectedClient === 'Happ') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'Windows', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'check', title: 'Подключение и использование', desc: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.' }
                  );
                } else if (selectedClient === 'FIClashX') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'Windows (Установщик)', iconType: 'external', primary: false }, { label: 'Windows на ARM (Установщик)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '3', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите кнопку копирования ссылки ниже. В FIClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '4', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.' }
                  );
                } else if (selectedClient === 'Koala Clash') {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.', buttons: [{ label: 'Windows (Установщик)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash.' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы добавить подписку', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите кнопку копирования ссылки ниже. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.' }
                  );
                } else {
                  installSteps.push(
                    { id: '1', iconType: 'download', title: 'Установка приложения', desc: 'Выберите архитектуру (предпочтительно установщик) и установите или распакуйте Prizrak-Box.', buttons: [{ label: 'Windows (Установщик)', iconType: 'external', primary: false }, { label: 'Windows на ARM (Установщик)', iconType: 'external', primary: false }] },
                    { id: '2', iconType: 'warning', title: 'Предупреждение', desc: 'Запустите программу от имени администратора.' },
                    { id: '3', iconType: 'cloud', title: 'Добавление подписки', desc: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.', buttons: [{ label: 'Добавить подписку', iconType: 'plus', primary: true, action: 'add_sub' }] },
                    { id: '4', iconType: 'settings', title: 'Если подписка не добавилась', desc: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите кнопку копирования ссылки ниже. В Prizrak-Box перейдите в раздел Профили, нажмите кнопку +, вставьте вашу скопированную ссылку и нажмите Подтвердить.', buttons: [{ label: 'Копировать ссылку', iconType: 'copy', action: 'copy_key', primary: false }] },
                    { id: '5', iconType: 'check', title: 'Подключение и использование', desc: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси. Установите переключатель TUN в положение ВКЛ.' }
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
                          {step.buttons.map((btn, i) => {
                            let BtnIcon = ExternalLink;
                            if (btn.iconType === 'plus') BtnIcon = Plus;
                            if (btn.iconType === 'copy') BtnIcon = Copy;

                            return (
                              <button key={i} onClick={() => {
                                if ('action' in btn) handleAction(btn.action);
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
