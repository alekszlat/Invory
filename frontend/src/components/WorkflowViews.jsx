import { ArrowRight, FolderOpen, Plus, Users } from 'lucide-react';
import { profiles, requestLabels, requestStatuses, roleLabels } from '../registryStore.js';

const dateTime = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });
const profileName = id => profiles.find(profile => profile.id === id)?.name ?? 'Профил';
const panel = 'rounded-2xl border border-line bg-white p-5';

function PageTitle({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-muted">{children}</p>;
}

export function SubregistersView({ owned, register, subregister, onCreate, onScope, onInvite }) {
  return (
    <>
      <PageTitle title="Подрегистри" description="Изберете регистър, определете кои активи да се виждат и поканете профили с конкретна роля.">
        {register && <button type="button" className="button-primary" onClick={onCreate}><Plus size={17} aria-hidden="true" /> Нов подрегистър</button>}
      </PageTitle>
      {register ? (
        <>
          <label className="field-label mb-5 max-w-md">
            Работен регистър
            <select className="field-control" value={register.id} onChange={event => { window.location.hash = `subregisters/${event.target.value}`; }}>
              {owned.map(entry => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
            </select>
          </label>
          {register.subregisters.length ? (
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <nav aria-label="Подрегистри в избрания регистър" className="grid gap-2">
                {register.subregisters.map(entry => (
                  <a key={entry.id} href={`#subregisters/${register.id}/${entry.id}`} aria-current={entry.id === subregister?.id ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-xl border border-line px-4 py-3 hover:bg-sage ${entry.id === subregister?.id ? 'bg-sage' : 'bg-white'}`}>
                    <FolderOpen size={20} className="shrink-0 text-sage-ink" aria-hidden="true" />
                    <span className="min-w-0"><strong className="block text-sm wrap-anywhere">{entry.name}</strong><small className="text-muted">Активи: {entry.assetIds.length} · Поканени: {entry.members.length}</small></span>
                  </a>
                ))}
              </nav>
              {subregister && (
                <section className={panel}>
                  <h2 className="text-lg font-bold wrap-anywhere">{subregister.name}</h2>
                  <p className="mt-1 text-sm text-muted">Активите остават част от общия регистър.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className="button-secondary" onClick={onScope}>Избери активи</button>
                    <button type="button" className="button-primary" onClick={onInvite}><Users size={17} aria-hidden="true" /> Покани профил</button>
                  </div>
                  <h3 className="mt-6 mb-2 text-sm font-bold">Поканени профили</h3>
                  {subregister.members.length ? (
                    <ul className="divide-y divide-line">
                      {subregister.members.map(member => <li key={member.profileId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        {profileName(member.profileId)} <span className="rounded-md bg-sage px-2 py-1 text-xs text-sage-ink">{roleLabels[member.role]}</span>
                      </li>)}
                    </ul>
                  ) : <p className="text-sm text-muted">Все още няма поканени профили.</p>}
                  <a className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-clay hover:underline" href={`#history/${register.id}/${subregister.id}`}>История на подрегистъра <ArrowRight size={16} aria-hidden="true" /></a>
                </section>
              )}
            </div>
          ) : <Empty>Към този регистър още няма подрегистри.</Empty>}
        </>
      ) : <Empty>Създайте работен регистър, за да добавите подрегистри към него.</Empty>}
    </>
  );
}

export function InvitedList({ invitations }) {
  return (
    <>
      <PageTitle title="Поканени регистри" description="Тук се показват подрегистрите, до които вашият профил има споделен достъп." />
      {invitations.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {invitations.map(({ register, subregister, role }) => (
            <li key={subregister.id} className={panel}>
              <p className="text-sm text-muted wrap-anywhere">{register.name}</p>
              <h2 className="mt-1 text-lg font-bold wrap-anywhere">{subregister.name}</h2>
              <p className="mt-2 text-sm">{roleLabels[role]} · Активи: {subregister.assetIds.length}</p>
              <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-clay hover:underline" href={`#invited/${register.id}/${subregister.id}`}>
                Отвори подрегистъра <ArrowRight size={16} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : <Empty>За този профил още няма споделени регистри.</Empty>}
    </>
  );
}

export function RequestsView({ incoming, submitted, onDecide }) {
  const sections = [
    ['Входящи', incoming.filter(({ request }) => request.status === 'pending'), true],
    ['Подадени от мен', submitted, false],
    ['Обработени входящи', incoming.filter(({ request }) => request.status !== 'pending'), false],
  ];
  return (
    <>
      <PageTitle title="Заявки" description="Разгледайте входящите заявки за вашите регистри и проследете тези, които сте подали." />
      {sections.map(([title, items, canDecide]) => (
        <section className="mb-7" key={title}>
          <h2 className="mb-3 text-lg font-bold">{title}</h2>
          {items.length ? (
            <ul className="grid gap-3">
              {items.map(({ register, request }) => {
                const asset = register.assets.find(entry => entry.id === request.assetId);
                const subregister = register.subregisters.find(entry => entry.id === request.subregisterId);
                return (
                  <li key={request.id} className={panel}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted wrap-anywhere">{register.name} / {subregister?.name} · {dateTime.format(new Date(request.createdAt))}</p>
                        <h3 className="mt-1 font-bold">{requestLabels[request.kind]}</h3>
                      </div>
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${request.status === 'approved' ? 'bg-sage text-sage-ink' : 'bg-peach text-clay'}`}>{requestStatuses[request.status]}</span>
                    </div>
                    <p className="mt-2 text-sm wrap-anywhere">{asset?.name} · {asset?.inventoryNumber} · {profileName(request.requesterId)}</p>
                    {request.kind === 'location' && <p className="mt-1 text-sm text-muted wrap-anywhere">{request.originalLocation} → {request.location}</p>}
                    <p className="mt-2 text-sm text-muted whitespace-pre-wrap wrap-anywhere">{request.note}</p>
                    {request.reason && <p className="mt-2 text-sm wrap-anywhere"><strong>Причина за отказ:</strong> {request.reason}</p>}
                    {canDecide && request.status === 'pending' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" className="button-primary" onClick={() => onDecide(register.id, request, 'approved')}>Одобри</button>
                        <button type="button" className="button-secondary" onClick={() => onDecide(register.id, request, 'rejected')}>Отхвърли</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : <Empty>Няма заявки в тази секция.</Empty>}
        </section>
      ))}
    </>
  );
}

export function HistoryView({ scopes, selected, events }) {
  return (
    <>
      <PageTitle title="История" description="Изберете регистър или подрегистър, за да видите промените в достъпния обхват." />
      {scopes.length ? (
        <>
          <label className="field-label mb-5 max-w-lg">
            Регистър за преглед
            <select className="field-control" value={selected.path} onChange={event => { window.location.hash = `history/${event.target.value}`; }}>
              {scopes.map(scope => <option key={scope.path} value={scope.path}>{scope.label}</option>)}
            </select>
          </label>
          {events.length ? (
            <ol className="divide-y divide-line rounded-2xl border border-line bg-white px-5">
              {events.map(event => (
                <li className="py-4" key={event.id}>
                  <time className="text-xs text-muted" dateTime={event.at}>{dateTime.format(new Date(event.at))} · {profileName(event.profileId)}</time>
                  <p className="mt-1 font-semibold">{event.title}</p>
                  <p className="mt-1 text-sm text-muted wrap-anywhere">{event.details}</p>
                </li>
              ))}
            </ol>
          ) : <Empty>В този обхват все още няма записани промени.</Empty>}
        </>
      ) : <Empty>Все още няма регистър или подрегистър, чиято история да прегледате.</Empty>}
    </>
  );
}
