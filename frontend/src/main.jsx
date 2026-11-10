import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import App from './App.jsx';

import { apiMode } from './api/config.js';
import { queryClient } from './api/query.js';

import './index.css';

async function start() {
  // The mock worker must run before React renders, because the first render already asks for the session.
  if (apiMode === 'mock') {
    const { startMocks } = await import('./mocks/browser.js');

    // Another tab changed the shared mock data, so every cached answer can be out of date.
    await startMocks(() => queryClient.invalidateQueries());
  } else if ('serviceWorker' in navigator) {
    // A worker from an earlier mock-mode run stays installed in the browser. It passes requests through while no page
    // turns mocking on, but it still stands between the page and every request, so API mode removes it.
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(registration => registration.active?.scriptURL.endsWith('/mockServiceWorker.js')).map(registration => registration.unregister()));
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></StrictMode>,
  );
  
}

start().catch(error => {
  document.getElementById('root').textContent = `Приложението не може да се стартира: ${error.message}`;
});
