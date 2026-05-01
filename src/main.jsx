import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './lib/UserContext';
import { ToastProvider } from './components/Toast';
import './index.css';

// Telegram WebApp init
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.setHeaderColor('#06060c');
  window.Telegram.WebApp.setBackgroundColor('#06060c');

  // Disable vertical swipes to prevent accidental close
  if (window.Telegram.WebApp.disableVerticalSwipes) {
    window.Telegram.WebApp.disableVerticalSwipes();
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </UserProvider>
  </React.StrictMode>
);
