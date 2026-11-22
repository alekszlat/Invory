import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import Button from '../../shared/ui/Button.jsx';
import { Alert } from '../../shared/ui/Feedback.jsx';
import { Input } from '../../shared/ui/FormControls.jsx';
import Logo from '../../shared/ui/Logo.jsx';

const screens = {
  login: { title: 'Вход в профила', description: 'Влезте, за да работите с вашите регистри и покани.', submit: 'Вход', pending: 'Влизане…', question: 'Нямате профил?', switchLabel: 'Създайте профил', other: 'signup' },
  signup: { title: 'Създаване на профил', description: 'Създайте профил, за да водите регистри и да приемате покани.', submit: 'Създай профил', pending: 'Създаване…', question: 'Вече имате профил?', switchLabel: 'Влезте', other: 'login' },
};
const emptyValues = { name: '', email: '', password: '', confirm: '' };

function AuthField({ id, label, hint, error, children }) {
  const message = error || hint;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {message && <p id={`${id}-message`} className={`text-sm leading-relaxed ${error ? 'font-medium text-danger' : 'text-ink-muted'}`}>{message}</p>}
    </div>
  );
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
  const PasswordIcon = showPassword ? EyeOff : Eye;
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
    return {
      id: `auth-${name}`,
      name,
      value: values[name],
      onChange: change,
      required: true,
      'aria-invalid': message ? true : undefined,
      'aria-describedby': `auth-${name}-message`,
    };
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

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* On wide screens a walnut panel says what Invory is for. Phones get the form alone. */}
      <div className="app-sidebar hidden flex-col justify-between gap-10 bg-sidebar p-12 text-sidebar-ink lg:flex">
        <Logo />
        <p className="max-w-md text-3xl leading-tight font-bold tracking-tight">Описвайте активите на организацията, проверявайте ги на място и одобрявайте промените.</p>
      </div>
      <div className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-3xl leading-tight font-bold tracking-tight">{screen.title}</h1>
          <p className="mt-2 text-ink-muted">{screen.description}</p>
          {invited && <Alert tone="info" className="mt-5">Получили сте покана за подрегистър. Влезте или създайте профил, за да я приемете.</Alert>}
          {banner && <Alert className="mt-5">{banner}</Alert>}
          <form className="mt-7 grid gap-5" onSubmit={submit} aria-busy={pending}>
            {signingUp && (
              <AuthField id="auth-name" label="Име и фамилия" error={fieldErrors.name}>
                <Input {...inputProps('name')} autoComplete="name" maxLength={120} />
              </AuthField>
            )}
            <AuthField id="auth-email" label="Имейл" error={fieldErrors.email}>
              <Input {...inputProps('email')} type="email" autoComplete="username" />
            </AuthField>
            <AuthField id="auth-password" label="Парола" hint={signingUp ? 'Поне 8 знака.' : ''} error={fieldErrors.password}>
              <div className="relative">
                <Input {...inputProps('password')} type={passwordType} className="pr-12" autoComplete={signingUp ? 'new-password' : 'current-password'} minLength={signingUp ? 8 : undefined} maxLength={200} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Скрий символите' : 'Покажи символите'} aria-pressed={showPassword}
                  className="absolute top-0 right-0 grid size-11 cursor-pointer place-items-center rounded-control text-ink-muted hover:text-ink">
                  <PasswordIcon size={18} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
            </AuthField>
            {signingUp && (
              <AuthField id="auth-confirm" label="Повторете паролата" error={fieldErrors.confirm}>
                <Input {...inputProps('confirm')} type={passwordType} autoComplete="new-password" maxLength={200} />
              </AuthField>
            )}
            <Button type="submit" disabled={pending} className="mt-1 w-full">{pending ? screen.pending : screen.submit}</Button>
          </form>
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-1.5 text-sm text-ink-muted">
            {screen.question}
            <button type="button" onClick={switchMode} className="text-link cursor-pointer">{screen.switchLabel}</button>
          </p>
        </div>
      </div>
    </main>
  );
}
