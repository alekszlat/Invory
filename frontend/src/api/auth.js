import { clearAccessToken, configureRefresh, http, setAccessToken } from './client.js';

// These calls create the token, so they send none. A 401 here means wrong credentials or no cookie, not an expired token to refresh.
// credentials: 'include' lets the browser send and store the HttpOnly refresh cookie. All other calls omit cookies.
async function session(path, body) {
  const result = await http(path, { method: 'POST', body, auth: false, credentials: 'include' });
  setAccessToken(result.accessToken);
  return result;
}

export const authApi = {
  login: body => session('/auth/login', body),
  register: body => session('/auth/register', body),
  refresh: () => session('/auth/refresh'),
  async logout() {
    await http('/auth/logout', { method: 'POST', credentials: 'include' });
    clearAccessToken();
  },
};

configureRefresh(authApi.refresh);
