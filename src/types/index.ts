export type ClientApp = string
export type OS = 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Linux' | 'Android TV' | 'Apple TV'

export interface Friend {
  name: string
  status: 'active' | 'pending'
  bonus: string
}

export interface Profile {
  id: string
  username: string
  telegram_username: string
  avatar_color: string
  tg_bot_linked?: boolean
  tg_channel_subscribed?: boolean
}

export interface Subscription {
  id: string
  user_id: string
  status: string
  expires_at: string
  traffic_used: number
  traffic_limit: number | null
  subscription_key: string
  token: string
  created_at: string
  tg_bot_linked?: boolean
  tg_channel_subscribed?: boolean
}
