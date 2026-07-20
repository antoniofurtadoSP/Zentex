import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registered with scope:', reg.scope);
        
        // Check for updates periodically
        setInterval(() => {
          reg.update().catch(() => {});
        }, 15000);

        // Check for updates on focus/visibility change
        const checkUpdate = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', checkUpdate);
        window.addEventListener('focus', checkUpdate);

        // Check for updates on load
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[Service Worker] New update found! Reloading...');
                  window.location.reload();
                }
              }
            };
          }
        };
      })
      .catch((err) => {
        console.error('[Service Worker] Registration failed:', err);
      });

    // Reload the page when the service worker changes (updates)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[Service Worker] Controller changed, reloading...');
        window.location.reload();
      }
    });
  });
}

