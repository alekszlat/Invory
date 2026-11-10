import { setupWorker } from 'msw/browser';
import { apiBaseUrl } from '../api/config.js';
import { createDatabase, mockIdentityKey, mockStorageKey } from './database.js';
import { createHandlers } from './handlers.js';

export async function startMocks(onChange) {
  // The data is in localStorage, so all tabs share it. The login is in sessionStorage,
  // so each tab can use a different account. The sessionStorage entry takes the place of the refresh cookie.
  const database = createDatabase(localStorage);
  const mockSession = {
    get: () => sessionStorage.getItem(mockIdentityKey),
    set: id => sessionStorage.setItem(mockIdentityKey, id),
    clear: () => sessionStorage.removeItem(mockIdentityKey),
  };
  const base = new URL(apiBaseUrl, location.origin).href;
  const worker = setupWorker(...createHandlers(database, base, mockSession));
  // Only a missing API handler is an error. Vite modules, icons and other files pass through to the network.
  await worker.start({ quiet: true, onUnhandledRequest(request, print) {
    if (request.url.startsWith(`${base}/`)) print.error();
  } });
  // The storage event fires only in the other tabs, which must then reload data that this tab changed. A null key means storage was cleared.
  window.addEventListener('storage', event => { if (event.key === mockStorageKey || event.key === null) onChange(); });
}
