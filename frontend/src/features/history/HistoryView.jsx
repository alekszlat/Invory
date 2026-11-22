import { navigateTo } from '../../app/navigation.js';

import EmptyState from '../../shared/ui/EmptyState.jsx';
import { Alert, Loading } from '../../shared/ui/Feedback.jsx';
import { Field, Select } from '../../shared/ui/FormControls.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { dateTime } from '../../shared/formatters.js';

function Timeline({ events }) {
  if (!events.length) return <EmptyState compact>В този обхват все още няма записани промени.</EmptyState>;

  return (
    <div className="card px-5 py-2 sm:px-6">
      <ol className="ml-1.5 border-l-2 border-line">
        {events.map(event => (
          <li key={event.id} className="relative py-4 pl-6 before:absolute before:top-[1.4rem] before:-left-[0.45rem] before:size-3 before:rounded-full before:bg-brass before:ring-4 before:ring-surface">
            <p className="font-semibold">{event.title}</p>
            <p className="mt-0.5 text-sm text-ink-muted wrap-anywhere">{event.details}</p>
            <p className="mt-1.5 text-xs text-ink-muted">
              <time dateTime={event.at}>{dateTime.format(new Date(event.at))}</time>, {event.actor.name}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function HistoryView({ scopes, selected, events, loading, error }) {
  return (
    <>
      <PageHeader title="История" description="Изберете регистър или подрегистър, за да видите промените в достъпния обхват." />
      {scopes.length ? (
        <>
          <Field label="Регистър за преглед" className="mb-6 max-w-lg">
            <Select value={selected.path} onChange={event => navigateTo(`history/${event.target.value}`)}>
              {scopes.map(scope => <option key={scope.path} value={scope.path}>{scope.label}</option>)}
            </Select>
          </Field>
          {error && <Alert className="mb-4">{error.message}</Alert>}
          {loading ? <Loading>Зареждане на история…</Loading> : <Timeline events={events} />}
        </>
      ) : <EmptyState compact>Все още няма регистър или подрегистър, чиято история да прегледате.</EmptyState>}
    </>
  );
}
