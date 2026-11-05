import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { apiMode } from './api/config.js';
import { queryClient } from './api/query.js';
import './index.css';

async function start() {
  let demo;
  if (apiMode === 'mock') {
    const { startMocks } = await import('./mocks/browser.js');
    demo = await startMocks(() => queryClient.invalidateQueries());
  } else if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(registration => registration.active?.scriptURL.endsWith('/mockServiceWorker.js')).map(registration => registration.unregister()));
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode><QueryClientProvider client={queryClient}><App demo={demo} /></QueryClientProvider></StrictMode>,
  );
}

start().catch(error => {
  document.getElementById('root').textContent = `Приложението не може да се стартира: ${error.message}`;
});
