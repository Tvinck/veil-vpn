import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Paperclip, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Компонент окна чата техподдержки (SupportChat).
 * 
 * Особенности:
 * 1. Загружает историю сообщений пользователя из таблицы `support_messages` Supabase.
 * 2. Слушает входящие ответы операторов поддержки в реальном времени с помощью
 *    Supabase Realtime PostgreSQL Changes канала, фильтруя изменения по `user_id`.
 * 3. Позволяет отправлять сообщения напрямую в БД с указанием названия проекта.
 * 4. Поддерживает загрузку изображений/скриншотов в Supabase Storage (bucket `support-attachments`).
 * 
 * @param {object} props - Параметры компонента
 * @param {string} props.profileId - UUID профиля пользователя для связи сообщений
 */
export const SupportChat = ({ profileId }: { profileId: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)
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

  /**
   * Отправляет текстовое сообщение клиента в службу поддержки.
   * Сообщение сохраняется локально для мгновенного отображения, а затем записывается в Supabase.
   * 
   * @param {React.FormEvent} e - Событие отправки формы
   */
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
      project: 'Veil Secure',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    // Вставка сообщения техподдержки в Supabase
    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: profileId,
        is_from_user: true,
        message: msgText,
        project: 'Veil Secure'
      })

    if (error) {
      console.error('Ошибка отправки:', error)
    }
  }

  /**
   * Загружает выбранный файл-изображение (скриншот) в Supabase Storage bucket
   * и отправляет в чат специальное текстовое сообщение с ссылкой на картинку.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Событие изменения инпута выбора файла
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение (PNG, JPG, JPEG)');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = `${profileId}/${fileName}`;

      // Upload file to Supabase support-attachments bucket
      const { error } = await supabase.storage
        .from('support-attachments')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      const msgText = `📷 [Изображение]: ${publicUrl}`;

      // Insert message locally
      const tempMsg = {
        id: crypto.randomUUID(),
        user_id: profileId,
        is_from_user: true,
        message: msgText,
        project: 'Veil Secure',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);

      // Insert message in Supabase
      const { error: insertError } = await supabase
        .from('support_messages')
        .insert({
          user_id: profileId,
          is_from_user: true,
          message: msgText,
          project: 'Veil Secure'
        });

      if (insertError) {
        throw insertError;
      }
    } catch (err) {
      console.error('Ошибка загрузки изображения:', err);
      alert('Не удалось загрузить изображение. Попробуйте еще раз.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <AnimatePresence mode="wait">
      {/* Floating Button */}
      {!isOpen ? (
        <motion.button 
          key="chat-trigger-btn"
          className="sec-chat-trigger-mobile"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', zIndex: 50,
            background: 'linear-gradient(135deg, #e63950, #b41c30)',
            color: 'white', padding: '14px 20px', borderRadius: '30px',
            boxShadow: '0 10px 25px rgba(230,57,80,0.5)',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            border: 'none'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageSquare size={20} />
          Возникли вопросы? Мы поможем
        </motion.button>
      ) : (
        /* Chat Window */
        <motion.div 
          key="chat-window-drawer"
          className="sec-chat-window-mobile"
          initial={{ opacity: 0, scale: 0.85, y: 30, transformOrigin: 'bottom right' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', zIndex: 50,
            width: '370px', height: '530px',
            background: 'rgba(15,10,12,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(230,57,80,0.35)',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(230,57,80,0.15), rgba(15,10,12,0.4))',
            padding: '18px 20px',
            borderBottom: '1px solid rgba(230,57,80,0.25)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', display: 'flex' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
                <span style={{ position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', animation: 'ping 1.5s infinite', opacity: 0.75 }} />
              </div>
              <div>
                <h4 style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', margin: 0, letterSpacing: '0.5px' }}>Служба поддержки</h4>
                <p style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.45)', margin: '3px 0 0 0', fontWeight: 500 }}>
                  🕒 Работаем с 10:00 до 22:00 (МСК)
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(230,57,80,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="hide-scrollbar">
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '10px 0', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.02)', marginBottom: '10px' }}>
              Чат active с 10:00 до 22:00 по московскому времени
            </div>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 'auto', marginBottom: 'auto', fontSize: '0.85rem' }}>
                Напишите нам, если у вас возникли трудности. Мы на связи!
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isClient = msg.is_from_user === true
                  return (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
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
                      }}
                    >
                      {msg.message.startsWith('📷 [Изображение]:') ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <img 
                            src={msg.message.split('📷 [Изображение]: ')[1]} 
                            alt="Вложение" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '180px', 
                              borderRadius: '8px', 
                              cursor: 'pointer',
                              display: 'block'
                            }} 
                            onClick={() => window.open(msg.message.split('📷 [Изображение]: ')[1], '_blank')}
                          />
                        </div>
                      ) : (
                        msg.message
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: '16px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: '10px', alignItems: 'center'
          }}>
            <input 
              type="file" 
              accept="image/*" 
              id="support-image-upload" 
              style={{ display: 'none' }} 
              onChange={handleImageUpload}
              disabled={uploading}
            />
            <label 
              htmlFor="support-image-upload" 
              style={{ 
                cursor: uploading ? 'default' : 'pointer', 
                color: uploading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s', flexShrink: 0
              }}
              onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </label>

            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              disabled={uploading}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem',
                outline: 'none', height: '38px'
              }}
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || uploading}
              style={{
                background: newMessage.trim() ? '#e63950' : 'rgba(255,255,255,0.1)',
                color: 'white', border: 'none', borderRadius: '10px', width: '38px', height: '38px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (newMessage.trim() && !uploading) ? 'pointer' : 'default', transition: 'background 0.2s',
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
