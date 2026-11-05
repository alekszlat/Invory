import { apiBaseUrl } from './config.js';

let accessToken = null;
let refreshSession = null;
let sessionExpired = () => {};
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
      if (error.status === 401) sessionExpired();
      throw error;
    }
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
    result = await list({ ...params, page, pageSize: 100 }, signal);
    items.push(...result.items);
    page += 1;
  } while (page <= result.pagination.totalPages);
  return items;
}
