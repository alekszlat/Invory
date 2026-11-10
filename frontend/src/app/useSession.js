import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { navigateTo } from './navigation.js';

import { authApi } from '../api/auth.js';
import { configureSessionExpired } from '../api/client.js';
import { clearPrivateCache, queryClient } from '../api/query.js';

// onChange resets the screen after login, sign-up and logout. onError shows a failed logout.
export function useSession({ onChange, onError }) {
  // A new key on login, sign-up, logout or session expiry starts a new auth query, so the cached answer of the previous session is never reused.
  const [sessionKey, setSessionKey] = useState('initial');
  const me = useQuery({ queryKey: ['auth', sessionKey], queryFn: authApi.refresh, retry: false });

  // client.js calls this when the session cannot be refreshed. The new auth query then fails and shows the login page.
  useEffect(() => {
    configureSessionExpired(() => { void clearPrivateCache().then(() => setSessionKey(crypto.randomUUID())); });
    return () => configureSessionExpired(() => {});
  }, []);

  async function openSession(session) {
    await clearPrivateCache();
    const nextKey = crypto.randomUUID();
    // The login answer already holds the session, so it is stored directly instead of sending an extra refresh call.
    queryClient.setQueryData(['auth', nextKey], session);
    setSessionKey(nextKey);
    onChange();
  }

  async function login(values) { await openSession(await authApi.login(values)); }
  async function signUp(values) { await openSession(await authApi.register(values)); }
  async function logout() {
    try {
      await authApi.logout();
      await clearPrivateCache();
      setSessionKey(crypto.randomUUID());
      onChange();
      navigateTo('');
    } catch (error) { onError(error); }
  }

  return { me, login, signUp, logout };
}
