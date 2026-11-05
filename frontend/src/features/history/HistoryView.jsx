import { Select } from '../../shared/ui/FormControls.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import { dateTime } from '../../shared/formatters.js';
import { navigateTo } from '../../app/navigation.js';

export default function HistoryView({ scopes, selected, events, loading, error }) {
  return (
    <>
      <PageHeader title="История" description="Изберете регистър или подрегистър, за да видите промените в достъпния обхват." />
      {scopes.length ? (
        <>
          <label className="grid min-w-0 gap-2 text-sm font-medium mb-5 max-w-lg">
            Регистър за преглед
            <Select value={selected.path} onChange={event => navigateTo(`history/${event.target.value}`)}>
              {scopes.map(scope => <option key={scope.path} value={scope.path}>{scope.label}</option>)}
            </Select>
          </label>
          {error && <p role="alert">{error.message}</p>}
          {loading ? <p role="status">Зареждане на история…</p> : events.length ? (
            <ol className="divide-y divide-[#dcdde3] dark:divide-[#3b3d46] rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] px-5 sm:px-6">
              {events.map(event => (
                <li className="relative py-5 pl-6 before:absolute before:top-6 before:left-0 before:size-2 before:rounded-full before:bg-[#005ac1] dark:before:bg-[#9bcaff] before:content-['']" key={event.id}>
                  <time className="text-xs text-[#62646c] dark:text-[#b0b2be]" dateTime={event.at}>{dateTime.format(new Date(event.at))} · {event.actor.name}</time>
                  <p className="mt-1 font-semibold">{event.title}</p>
                  <p className="mt-1 text-sm text-[#62646c] dark:text-[#b0b2be] wrap-anywhere">{event.details}</p>
                </li>
              ))}
            </ol>
          ) : <EmptyState compact>В този обхват все още няма записани промени.</EmptyState>}
        </>
      ) : <EmptyState compact>Все още няма регистър или подрегистър, чиято история да прегледате.</EmptyState>}
    </>
  );
}
