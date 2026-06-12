import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const SupportChat = ({ profileId }: { profileId: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileId) return

    // Load initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
    }
    
    if (isOpen) {
      fetchMessages()
    }

    // Subscribe to realtime changes
    const channel = supabase.channel(`support_chat_${profileId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages',
        filter: `user_id=eq.${profileId}` 
      }, payload => {
        setMessages(prev => {
          if (prev.some(m => m.message === payload.new.message && m.created_at.slice(0, 16) === payload.new.created_at.slice(0, 16))) {
            return prev
          }
          return [...prev, payload.new]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profileId, isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !profileId) return

    const msgText = newMessage.trim()
    setNewMessage('')

    const tempMsg = {
      id: crypto.randomUUID(),
      user_id: profileId,
      is_from_user: true,
      message: msgText,
      project: 'Veil VPN',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: profileId,
        is_from_user: true,
        message: msgText,
        project: 'Veil VPN'
      })

    if (error) {
      console.error('Ошибка отправки:', error)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', zIndex: 50,
            background: 'linear-gradient(135deg, #e63950, #b41c30)',
            color: 'white', padding: '14px 20px', borderRadius: '30px',
            boxShadow: '0 10px 25px rgba(230,57,80,0.5)',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            border: 'none', transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={20} />
          Возникли вопросы? Мы поможем
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '30px', right: '30px', zIndex: 50,
          width: '350px', height: '500px',
          background: 'rgba(15,10,12,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(230,57,80,0.3)',
          borderRadius: '20px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'rgba(230,57,80,0.1)',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(230,57,80,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
              <h4 style={{ color: 'white', fontWeight: 700, margin: 0 }}>Служба поддержки</h4>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="hide-scrollbar">
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 'auto', marginBottom: 'auto', fontSize: '0.85rem' }}>
                Напишите нам, если у вас возникли трудности. Мы на связи!
              </div>
            ) : (
              messages.map(msg => {
                const isClient = msg.is_from_user === true
                return (
                  <div key={msg.id} style={{
                    alignSelf: isClient ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: isClient ? '#e63950' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    borderBottomRightRadius: isClient ? '4px' : '14px',
                    borderBottomLeftRadius: !isClient ? '4px' : '14px',
                    fontSize: '0.85rem',
                    lineHeight: 1.5
                  }}>
                    {msg.message}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: '16px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: '10px'
          }}>
            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              style={{
                background: newMessage.trim() ? '#e63950' : 'rgba(255,255,255,0.1)',
                color: 'white', border: 'none', borderRadius: '10px', width: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: newMessage.trim() ? 'pointer' : 'default', transition: 'background 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
