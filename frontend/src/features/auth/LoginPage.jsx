import { useState } from 'react';
import { Box, Eye, EyeOff } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import { Input } from '../../shared/ui/FormControls.jsx';

const screens = {
  login: { title: 'Вход в профила', description: 'Влезте, за да работите с вашите регистри и покани.', submit: 'Вход', pending: 'Влизане…', question: 'Нямате профил?', switchLabel: 'Създайте профил', other: 'signup' },
  signup: { title: 'Създаване на профил', description: 'Създайте профил, за да водите регистри и да приемате покани.', submit: 'Създай профил', pending: 'Създаване…', question: 'Вече имате профил?', switchLabel: 'Влезте', other: 'login' },
};
const emptyValues = { name: '', email: '', password: '', confirm: '' };

function AuthField({ id, label, hint, error, children }) {
  const message = error || hint;
  return <div className="grid gap-1.5">
    <label htmlFor={id} className="text-sm font-medium">{label}</label>
    {children}
    {message && <p id={`${id}-message`} className={`text-xs leading-relaxed ${error ? 'text-[#b32830] dark:text-[#ffb1b8]' : 'text-[#62646c] dark:text-[#b0b2be]'}`}>{message}</p>}
  </div>;
}

export default function LoginPage({ onLogin, onSignUp, invited, initialError }) {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState(emptyValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const screen = screens[mode];
  const signingUp = mode === 'signup';
  const passwordType = showPassword ? 'text' : 'password';
  // LOGIN_REQUIRED only means that there is no session yet, which is normal on this page and not an error to show.
  const banner = error || (initialError?.code !== 'LOGIN_REQUIRED' ? initialError?.message : '');

  function change(event) {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
    setFieldErrors(current => ({ ...current, [name]: undefined }));
  }

  function switchMode() {
    // The email is kept so that someone on the wrong screen does not retype it; passwords are not carried over.
    setMode(screen.other);
    setValues(current => ({ ...emptyValues, email: current.email }));
    setFieldErrors({}); setError(''); setShowPassword(false);
  }

  function inputProps(name) {
    const message = fieldErrors[name];
    return { id: `auth-${name}`, name, value: values[name], onChange: change, required: true, 'aria-invalid': message ? true : undefined, 'aria-describedby': `auth-${name}-message` };
  }

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    if (signingUp && values.password !== values.confirm) {
      setError(''); setFieldErrors({ confirm: 'Паролите не съвпадат.' });
      return;
    }
    setPending(true); setError(''); setFieldErrors({});
    try {
      if (signingUp) await onSignUp({ name: values.name.trim(), email: values.email, password: values.password });
      else await onLogin({ email: values.email, password: values.password });
    } catch (failure) {
      const messages = Object.fromEntries(Object.entries(failure.fields ?? {}).map(([field, [first]]) => [field, first]));
      setFieldErrors(messages);
      // Errors about a field are shown next to it; anything else needs the banner to be seen at all.
      if (!['name', 'email', 'password'].some(field => messages[field])) setError(failure.message);
    } finally { setPending(false); }
  }

  return <main className="flex min-h-dvh items-center justify-center bg-[#eceef2] px-5 py-10 dark:bg-[#1e1f24]">
    <div className="w-full max-w-md rounded-2xl border border-[#dcdde3] bg-white p-6 shadow-[0_12px_40px_rgb(24_32_48/0.06)] dark:border-[#3b3d46] dark:bg-[#232429] sm:p-8">
      <div className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span className="grid size-10 place-items-center rounded-xl bg-[#005ac1] text-white dark:bg-[#9bcaff] dark:text-[#232429]"><Box size={23} strokeWidth={1.7} aria-hidden="true" /></span>
        invory
      </div>
      <h1 className="mt-8 text-2xl font-semibold">{screen.title}</h1>
      <p className="mt-2 text-sm text-[#62646c] dark:text-[#b0b2be]">{screen.description}</p>
      {invited && <p className="mt-4 rounded-xl bg-[#e8f0fc] px-4 py-3 text-sm text-[#005ac1] dark:bg-[#233a55] dark:text-[#9bcaff]">Получили сте покана за подрегистър. Влезте или създайте профил, за да я приемете.</p>}
      {banner && <p role="alert" className="mt-4 rounded-xl bg-[#fcecef] px-4 py-3 text-sm text-[#b32830] dark:bg-[#462c32] dark:text-[#ffb1b8]">{banner}</p>}
      <form className="mt-6 grid gap-4" onSubmit={submit} aria-busy={pending}>
        {signingUp && <AuthField id="auth-name" label="Име и фамилия" error={fieldErrors.name}>
          <Input {...inputProps('name')} autoComplete="name" maxLength={120} />
        </AuthField>}
        <AuthField id="auth-email" label="Имейл" error={fieldErrors.email}>
          <Input {...inputProps('email')} type="email" autoComplete="username" />
        </AuthField>
        <AuthField id="auth-password" label="Парола" hint={signingUp ? 'Поне 8 знака.' : ''} error={fieldErrors.password}>
          <div className="relative">
            <Input {...inputProps('password')} type={passwordType} className="pr-12" autoComplete={signingUp ? 'new-password' : 'current-password'} minLength={signingUp ? 8 : undefined} maxLength={200} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Скрий символите' : 'Покажи символите'} aria-pressed={showPassword}
              className="absolute top-0 right-0 grid size-11 cursor-pointer place-items-center rounded-xl text-[#62646c] dark:text-[#b0b2be]">
              {showPassword ? <EyeOff size={18} strokeWidth={1.7} aria-hidden="true" /> : <Eye size={18} strokeWidth={1.7} aria-hidden="true" />}
            </button>
          </div>
        </AuthField>
        {signingUp && <AuthField id="auth-confirm" label="Повторете паролата" error={fieldErrors.confirm}>
          <Input {...inputProps('confirm')} type={passwordType} autoComplete="new-password" maxLength={200} />
        </AuthField>}
        <Button type="submit" disabled={pending} className="mt-1 w-full">{pending ? screen.pending : screen.submit}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-[#62646c] dark:text-[#b0b2be]">
        {screen.question}{' '}
        <button type="button" onClick={switchMode} className="cursor-pointer font-semibold text-[#005ac1] hover:underline dark:text-[#9bcaff]">{screen.switchLabel}</button>
      </p>
    </div>
  </main>;
}
