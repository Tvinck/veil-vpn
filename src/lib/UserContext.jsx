import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initUser = async () => {
      try {
        setLoading(true);
        
        // Check if running inside Telegram WebApp
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const initData = window.Telegram?.WebApp?.initData || '';
        
        if (!tgUser || !initData) {
          // Development fallback — only in dev mode
          if (import.meta.env.DEV) {
            console.warn('⚠️ DEV MODE: Using mock Telegram user');
            const mockUser = { id: 5679973346, username: 'artikissssss', first_name: '.' };
            const res = await fetch('/api/sync-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tgUser: mockUser, initData: '' })
            });
            if (res.ok) {
              const { user: fetchedUser } = await res.json();
              if (fetchedUser) setUser(fetchedUser);
            }
          } else {
            setError('Откройте приложение через Telegram бота @veilvpns_bot');
          }
          return;
        }

        // Production flow — send to backend with initData verification
        const res = await fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tgUser, initData })
        });
        
        if (!res.ok) {
          throw new Error('Failed to synchronize user');
        }
        
        const { user: fetchedUser } = await res.json();
        if (fetchedUser) {
           setUser(fetchedUser);
        }
      } catch (err) {
        console.error('UserContext Init Error:', err);
        setError('Ошибка загрузки. Попробуйте перезапустить приложение.');
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};
