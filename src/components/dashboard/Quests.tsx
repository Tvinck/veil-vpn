
import { Bot, Check, Tv, Terminal } from 'lucide-react'

export const Quests = ({
  profile,
  linkingBot,
  subscribingChannel,
  handleLinkBot,
  handleSubscribeChannel,
  tgBonusMsg,
}: {
  profile: any
  linkingBot: boolean
  subscribingChannel: boolean
  handleLinkBot: () => void
  handleSubscribeChannel: () => void
  tgBonusMsg: string | null
}) => {
  return (
    <div className="sec-dash-card">
      <div className="sec-dash-card-header">
        <div className="sec-dash-icon-box" style={{ background: 'rgba(230,57,80,0.1)' }}>
          <Bot size={22} color="#e63950" />
        </div>
        <div>
          <h3 className="sec-dash-title">Telegram Квесты</h3>
        </div>
      </div>
      <p className="sec-dash-desc">Выполняйте задания в Telegram и получайте бесплатные дни премиум подписки.</p>
      
      {tgBonusMsg && (
        <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', padding: '12px', borderRadius: '10px', color: '#4ade80', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> {tgBonusMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Бонус 1: Привязка бота */}
        <div className={`sec-task-item ${profile?.tg_bot_linked ? 'sec-task-item-done' : ''}`}>
          <div className="sec-task-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Terminal size={18} color="#fff" />
              </div>
              <div>
                <h4 className="sec-task-title">Привязать Telegram Bot</h4>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Удобное управление подпиской</p>
              </div>
            </div>
            {profile?.tg_bot_linked ? (
              <span className="sec-badge-red" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)' }}><Check size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Выполнено</span>
            ) : (
              <span className="sec-badge-red">+10 дней</span>
            )}
          </div>
          {!profile?.tg_bot_linked && (
            <button className="btn-red-primary" onClick={handleLinkBot} disabled={linkingBot} style={{ padding: '10px', fontSize: '0.85rem', marginTop: '4px', width: '100%', justifyContent: 'center' }}>
              {linkingBot ? 'Привязка...' : 'Перейти в бота'}
            </button>
          )}
        </div>

        {/* Бонус 2: Подписка на канал */}
        <div className={`sec-task-item ${profile?.tg_channel_subscribed ? 'sec-task-item-done' : ''}`}>
          <div className="sec-task-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tv size={18} color="#fff" />
              </div>
              <div>
                <h4 className="sec-task-title">Подписаться на канал</h4>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Новости и бесплатные ключи</p>
              </div>
            </div>
            {profile?.tg_channel_subscribed ? (
              <span className="sec-badge-red" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)' }}><Check size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Выполнено</span>
            ) : (
              <span className="sec-badge-red">+10 дней</span>
            )}
          </div>
          {!profile?.tg_channel_subscribed && (
            <button className="btn-red-primary" onClick={handleSubscribeChannel} disabled={subscribingChannel} style={{ padding: '10px', fontSize: '0.85rem', marginTop: '4px', width: '100%', justifyContent: 'center' }}>
              {subscribingChannel ? 'Проверка...' : 'Подписаться'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
