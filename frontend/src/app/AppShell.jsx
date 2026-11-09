import Button from '../shared/ui/Button.jsx';
import { Box, Plus, UserRound } from 'lucide-react';
import { navigation } from './navigation.js';

function Sidebar({ section, pendingCount, onNavigate, onCreate }) {
  return (
    <aside className="flex min-w-0 flex-col gap-4 border-b border-[#dcdde3] dark:border-[#3b3d46] bg-[#eceef2] dark:bg-[#1e1f24] px-4 py-5 md:sticky md:top-0 md:h-dvh md:gap-0 md:overflow-y-auto md:border-r md:border-b-0 md:px-4 md:py-7">
      <a href="#" className="flex w-fit items-center gap-3 px-2 text-2xl font-semibold tracking-tight" aria-label="Invory · Работни регистри">
        <span className="grid size-10 place-items-center rounded-xl bg-[#005ac1] dark:bg-[#9bcaff] text-white dark:text-[#232429]"><Box size={23} strokeWidth={1.7} aria-hidden="true" /></span>
        invory
      </a>
      <p className="hidden px-3 text-xs font-medium text-[#62646c] dark:text-[#b0b2be] md:mt-12 md:mb-3 md:block">Работно пространство</p>
      <nav className="flex flex-wrap gap-1 md:grid" aria-label="Основна навигация">
        {navigation.map(({ id, label, icon: Icon }) => (
          <a key={id} href={id === 'register' ? '#' : `#${id}`} onClick={onNavigate}
            aria-current={section === id ? 'page' : undefined} className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm leading-snug font-medium text-[#62646c] dark:text-[#b0b2be] hover:bg-white dark:hover:bg-[#232429] [&>svg]:shrink-0 aria-[current=page]:bg-white dark:aria-[current=page]:bg-[#232429] aria-[current=page]:text-[#005ac1] dark:aria-[current=page]:text-[#9bcaff] aria-[current=page]:shadow-[0_2px_8px_rgb(24_32_48/0.03)] dark:aria-[current=page]:shadow-none motion-safe:transition-[background-color,border-color] motion-safe:duration-140 motion-safe:ease-[ease]">
            <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
            <span>{label}</span>
            {id === 'requests' && pendingCount > 0 && <span className="ml-auto rounded-md bg-[#e8f0fc] dark:bg-[#233a55] px-2 py-0.5 text-xs text-[#005ac1] dark:text-[#9bcaff] tabular-nums">{pendingCount}</span>}
          </a>
        ))}
      </nav>
      <div className="mt-auto hidden md:block">
        <Button type="button" onClick={onCreate} variant="secondary" className="w-full">
          <Plus size={18} aria-hidden="true" />
          Нов регистър
        </Button>
      </div>
    </aside>
  );
}

export default function AppShell({
  section, pendingCount, userName, onLogout, onNavigate, onCreate, error, notice, children,
}) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <a href="#main-content" className="fixed top-3 left-3 z-50 -translate-y-24 rounded-xl border border-[#858792] dark:border-[#777a88] bg-white dark:bg-[#232429] px-4 py-3 text-sm font-semibold text-[#005ac1] dark:text-[#9bcaff] focus:translate-y-0" onClick={event => {
        event.preventDefault();
        document.getElementById('main-content').focus();
      }}>Към съдържанието</a>
      <Sidebar section={section} pendingCount={pendingCount} onNavigate={onNavigate} onCreate={onCreate} />
      <div className="min-w-0">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] px-5 py-3 lg:px-10">
          <p className="text-sm font-medium text-[#62646c] dark:text-[#b0b2be]">{navigation.find(page => page.id === section)?.label ?? 'Покана'}</p>
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2.5 [&>svg]:text-[#62646c] dark:[&>svg]:text-[#b0b2be]">
            <UserRound size={17} strokeWidth={1.7} aria-hidden="true" />
            <span className="text-sm wrap-anywhere">{userName || 'Профил'}</span>
            <Button type="button" variant="secondary" onClick={onLogout}>Изход</Button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-10 lg:py-10">
          {error && <p role="alert" className="rounded-xl border px-4 py-3 text-sm leading-relaxed font-medium border-[#b32830]/25 dark:border-[#ffb1b8]/25 bg-[#fcecef] dark:bg-[#462c32] text-[#b32830] dark:text-[#ffb1b8] mb-5">{error}</p>}
          <div role="status" aria-atomic="true">
            {notice && <p className="rounded-xl border px-4 py-3 text-sm leading-relaxed font-medium border-[#24613d]/25 dark:border-[#a1dcb3]/25 bg-[#e9f4ec] dark:bg-[#253b2d] text-[#24613d] dark:text-[#a1dcb3] mb-5">{notice}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
