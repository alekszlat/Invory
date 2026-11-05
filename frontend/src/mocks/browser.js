import { setupWorker } from 'msw/browser';
import { apiBaseUrl } from '../api/config.js';
import { createDatabase, demoUsers, mockIdentityKey, mockStorageKey } from './database.js';
import { createHandlers } from './handlers.js';

export async function startMocks(onChange) {
  const database = createDatabase(localStorage);
  const mockSession = {
    get: () => sessionStorage.getItem(mockIdentityKey),
    set: id => sessionStorage.setItem(mockIdentityKey, id),
    clear: () => sessionStorage.removeItem(mockIdentityKey),
  };
  const base = new URL(apiBaseUrl, location.origin).href;
  const worker = setupWorker(...createHandlers(database, base, mockSession));
  await worker.start({ quiet: true, onUnhandledRequest(request, print) {
    if (request.url.startsWith(`${base}/`)) print.error();
  } });
  window.addEventListener('storage', event => { if (event.key === mockStorageKey || event.key === null) onChange(); });
  return {
    users: demoUsers,
    currentUserId: mockSession.get,
    reset() { database.reset(); },
  };
}
