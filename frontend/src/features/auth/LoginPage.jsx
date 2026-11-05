import { useState } from 'react';
import { Box } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import { Input } from '../../shared/ui/FormControls.jsx';

export default function LoginPage({ demoUsers, onLogin, initialError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function login(values) {
    setPending(true); setError('');
    try { await onLogin(values); }
    catch (failure) { setError(failure.message); }
    finally { setPending(false); }
  }

  return <main className="flex min-h-dvh items-center justify-center bg-[#eceef2] px-5 py-10 dark:bg-[#1e1f24]">
    <div className="w-full max-w-md rounded-2xl border border-[#dcdde3] bg-white p-6 shadow-[0_12px_40px_rgb(24_32_48/0.06)] dark:border-[#3b3d46] dark:bg-[#232429] sm:p-8">
      <div className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span className="grid size-10 place-items-center rounded-xl bg-[#005ac1] text-white dark:bg-[#9bcaff] dark:text-[#232429]"><Box size={23} strokeWidth={1.7} aria-hidden="true" /></span>
        invory
      </div>
      <h1 className="mt-8 text-2xl font-semibold">Вход в профила</h1>
      <p className="mt-2 text-sm text-[#62646c] dark:text-[#b0b2be]">Влезте, за да работите с регистри и покани.</p>
      {(error || (initialError && initialError.code !== 'LOGIN_REQUIRED' && !error)) && <p role="alert" className="mt-4 rounded-xl bg-[#fcecef] px-4 py-3 text-sm text-[#b32830] dark:bg-[#462c32] dark:text-[#ffb1b8]">{error || initialError.message}</p>}
      <form className="mt-6 grid gap-4" onSubmit={event => { event.preventDefault(); login({ email, password }); }}>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="login-email">Имейл
          <Input id="login-email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="login-password">Парола
          <Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
        </label>
        <Button type="submit" disabled={pending} className="w-full">{pending ? 'Влизане…' : 'Вход'}</Button>
      </form>
      {demoUsers?.length > 0 && <div className="mt-7 border-t border-[#dcdde3] pt-6 dark:border-[#3b3d46]">
        <p className="mb-3 text-sm font-medium">Демо профили</p>
        <div className="grid gap-2">{demoUsers.map(user => <Button key={user.id} type="button" variant="secondary" disabled={pending} onClick={() => login({ email: user.email, password: 'demo' })}>{user.name}</Button>)}</div>
      </div>}
    </div>
  </main>;
}
