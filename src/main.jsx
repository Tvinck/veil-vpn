import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './lib/UserContext';
import './index.css';

// Telegram WebApp init
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.setHeaderColor('#0a0a0f');
  window.Telegram.WebApp.setBackgroundColor('#0a0a0f');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
