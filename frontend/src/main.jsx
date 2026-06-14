import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { QueueProvider } from './context/QueueContext.jsx'
import { AlertProvider } from './context/AlertContext.jsx'
import App from './App.jsx'
import "@fontsource-variable/material-symbols-outlined";
import './index.css'
import './i18n';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <QueueProvider>
            <App />
          </QueueProvider>
        </NotificationProvider>
      </AuthProvider>
      <AlertProvider>
        <AuthProvider>
          <QueueProvider>
            <App />
          </QueueProvider>
        </AuthProvider>
      </AlertProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Register Progressive Web App (PWA) Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully on scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

