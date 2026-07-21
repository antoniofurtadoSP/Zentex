import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the PWA service worker (or clean up for instant updates in development/preview)
if ('serviceWorker' in navigator) {
  const isDevApp = window.location.hostname.includes('localhost') || 
                    window.location.hostname.includes('127.0.0.1') ||
                    window.location.hostname.includes('ais-dev') ||
                    window.location.hostname.includes('ais-pre') ||
                    window.location.hostname.includes('run.app');

  if (isDevApp) {
    // Unregister any active service worker in development/preview to prevent aggressive caching of old files
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[Service Worker] Unregistered active service worker for development/preview mode.');
            // Clear all browser caches for this app
            caches.keys().then((keys) => {
              return Promise.all(keys.map(key => caches.delete(key)));
            }).then(() => {
              console.log('[Service Worker] Caches cleared.');
            });
          }
        });
      }
    });
  } else {
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
}

