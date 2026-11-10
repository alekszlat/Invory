import { apiBaseUrl } from './config.js';

// The access token lives only in memory so that page scripts cannot read it from storage.
// After a reload, the HttpOnly refresh cookie gets a new token through refreshSession.
let accessToken = null;
// auth.js sets this through configureRefresh, because auth.js imports this module and a direct import back would be circular.
let refreshSession = null;
let sessionExpired = () => {};
// The server replaces the refresh cookie on each use. Requests that fail with 401 at the same time
// must share one refresh call, because a second call would send a cookie that is no longer valid.
let refreshInFlight = null;

export function setAccessToken(token) {
  if (typeof token !== 'string' || !token) throw new Error('Липсва токен за достъп в отговора.');
  accessToken = token;
}
export function clearAccessToken() { accessToken = null; }
export function configureRefresh(handler) { refreshSession = handler; }
export function configureSessionExpired(handler) { sessionExpired = handler; }

export class ApiError extends Error {
  constructor(status, error) {
    super(error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code;
    this.fields = error.fields ?? {};
    this.traceId = error.traceId;
  }
}

export async function http(path, { method = 'GET', body, params, signal, auth = true, credentials = 'omit' } = {}) {
  // Vitest runs this module in Node, where there is no window.location to resolve a relative base URL against.
  const url = new URL(`${apiBaseUrl}${path}`, globalThis.location?.origin ?? 'http://localhost:5173');
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  async function send() {
    try {
      return await fetch(url, {
        method, credentials, signal,
        headers: {
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (error) {
      // React Query aborts requests that it no longer needs. That is not a connection failure to show to the user.
      if (error.name === 'AbortError') throw error;
      throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Връзката със сървъра е неуспешна.' });
    }
  }
  let response = await send();
  if (response.status === 401 && auth && refreshSession) {
    try {
      if (!refreshInFlight) refreshInFlight = Promise.resolve().then(refreshSession).finally(() => { refreshInFlight = null; });
      await refreshInFlight;
      response = await send();
    } catch (error) {
      clearAccessToken();
      // Only a 401 from the refresh call means that the session has ended. After a network error, the next request tries the refresh again.
      if (error.status === 401) sessionExpired();
      throw error;
    }
    // The refresh succeeded but the server still refuses the new token, so the session cannot be recovered.
    if (response.status === 401) { clearAccessToken(); sessionExpired(); }
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data?.error ?? { code: 'HTTP_ERROR', message: `Заявката е неуспешна (${response.status}).` });
  if (data === null) throw new ApiError(response.status, { code: 'INVALID_RESPONSE', message: 'Неразпознат отговор от сървъра.' });
  return data;
}

export async function allPages(list, params = {}, signal) {
  const items = [];
  let page = 1;
  let result;
  do {
    // 100 is the largest pageSize that the API accepts, so it gives the fewest calls.
    result = await list({ ...params, page, pageSize: 100 }, signal);
    items.push(...result.items);
    page += 1;
  } while (page <= result.pagination.totalPages);
  return items;
}
