import { Plus, UserRound } from 'lucide-react';

import { navigation } from './navigation.js';

import Button from '../shared/ui/Button.jsx';
import { Alert } from '../shared/ui/Feedback.jsx';
import Logo from '../shared/ui/Logo.jsx';

// On phones the menu becomes one row that scrolls sideways, so the page content starts near the top of the screen.
function Sidebar({ section, pendingCount, onNavigate, onCreate }) {
  return (
    <aside className="app-sidebar flex min-w-0 flex-col gap-3 bg-sidebar px-3 pt-4 pb-2 text-sidebar-ink md:sticky md:top-0 md:h-dvh md:gap-10 md:overflow-y-auto md:px-4 md:py-7">
      <a href="#" className="w-fit rounded-control px-2" aria-label="Invory · Работни регистри"><Logo /></a>
      <nav aria-label="Основна навигация" className="-mx-3 overflow-x-auto px-3 pb-1 md:mx-0 md:overflow-visible md:p-0">
        <ul className="flex gap-1 md:grid">
          {navigation.map(({ id, label, icon: Icon }) => (
            <li key={id} className="shrink-0">
              <a href={id === 'register' ? '#' : `#${id}`} onClick={onNavigate} aria-current={section === id ? 'page' : undefined}
                className="flex min-h-11 items-center gap-2.5 rounded-control px-3 py-2 text-sm font-semibold whitespace-nowrap text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink aria-[current=page]:bg-sidebar-active aria-[current=page]:text-sidebar-ink md:whitespace-normal [&[aria-current=page]>svg]:text-brass motion-safe:transition-colors">
                <Icon size={19} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                <span>{label}</span>
                {id === 'requests' && pendingCount > 0 && <span className="ml-auto rounded-full bg-brass px-2 text-xs leading-5 font-bold text-sidebar tabular-nums">{pendingCount}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {/* The wrapper hides the button on phones. On the button itself, hidden would clash with its inline-flex. */}
      <div className="mt-auto hidden md:block">
        <Button variant="sidebar" onClick={onCreate} className="w-full">
          <Plus size={18} aria-hidden="true" />
          Нов регистър
        </Button>
      </div>
    </aside>
  );
}

// The router reads the hash, so following "#main-content" would leave the current page. Move focus by hand instead.
function skipToContent(event) {
  event.preventDefault();
  document.getElementById('main-content').focus();
}

export default function AppShell({
  section, pendingCount, userName, onLogout, onNavigate, onCreate, error, notice, children,
}) {
  const pageTitle = navigation.find(page => page.id === section)?.label ?? 'Покана';

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15.5rem_minmax(0,1fr)]">
      <a href="#main-content" onClick={skipToContent}
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-control border border-line-strong bg-surface px-4 py-3 text-sm font-semibold text-accent focus:translate-y-0">
        Към съдържанието
      </a>
      <Sidebar section={section} pendingCount={pendingCount} onNavigate={onNavigate} onCreate={onCreate} />
      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5 sm:px-6 lg:px-10">
          {/* The menu already marks the current page on phones, so the name is repeated here only on wider screens. */}
          <p className="hidden text-sm font-semibold text-ink-muted sm:block">{pageTitle}</p>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <UserRound size={17} strokeWidth={1.8} className="shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="wrap-anywhere">{userName || 'Профил'}</span>
            </span>
            <Button variant="secondary" onClick={onLogout}>Изход</Button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {error && <Alert className="mb-5">{error}</Alert>}
          <div role="status" aria-atomic="true">
            {notice && <Alert tone="success" className="mb-5">{notice}</Alert>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
