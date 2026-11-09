import { clearAccessToken, configureRefresh, http, setAccessToken } from './client.js';

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
