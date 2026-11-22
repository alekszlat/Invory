import { FolderOpen, History, Plus, Users } from 'lucide-react';

import { navigateTo } from '../../app/navigation.js';

import { CountBadge } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import { Field, Select } from '../../shared/ui/FormControls.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { assetCount, memberCount } from '../../shared/formatters.js';
import { roleLabels } from '../../shared/labels.js';

function SubregisterLinks({ register, selectedId }) {
  return (
    <nav aria-label="Подрегистри в избрания регистър">
      <ul className="grid gap-2">
        {register.subregisters.map(entry => (
          <li key={entry.id}>
            <a href={`#subregisters/${register.id}/${entry.id}`} aria-current={entry.id === selectedId ? 'page' : undefined}
              className="flex min-w-0 items-center gap-3 rounded-card border border-line bg-surface px-4 py-3.5 hover:border-line-strong aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft motion-safe:transition-colors">
              <FolderOpen size={20} strokeWidth={1.8} className="shrink-0 text-accent" aria-hidden="true" />
              <span className="min-w-0">
                <strong className="block font-semibold wrap-anywhere">{entry.name}</strong>
                <span className="flex flex-wrap gap-x-3 text-sm text-ink-muted">
                  <span>{assetCount(entry.assetIds.length)}</span>
                  <span>{memberCount(entry.memberCount)}</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MemberList({ members, onMemberRole, onRemoveMember }) {
  if (!members.length) return <p className="text-sm text-ink-muted">Все още няма поканени профили.</p>;

  return (
    <ul className="divide-y divide-line">
      {members.map(({ user, role }) => (
        <li key={user.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
          <span className="min-w-0">
            <span className="block font-semibold wrap-anywhere">{user.name}</span>
            <span className="block text-sm text-ink-muted wrap-anywhere">{user.email}</span>
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <Select aria-label={`Роля на ${user.name}`} fullWidth={false} value={role} onChange={event => onMemberRole(user.id, event.target.value)}>
              <option value="participant">{roleLabels.participant}</option>
              <option value="guest">{roleLabels.guest}</option>
            </Select>
            <Button variant="danger" onClick={() => onRemoveMember(user.id)}>Премахни</Button>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function SubregistersView({
  owned, register, subregister, members = [], onCreate, onRename, onScope, onInvite, onMemberRole, onRemoveMember,
}) {
  return (
    <>
      <PageHeader title="Подрегистри" description="Изберете регистър, определете кои активи да се виждат и поканете профили с конкретна роля.">
        {register && <Button onClick={onCreate}><Plus size={17} aria-hidden="true" /> Нов подрегистър</Button>}
      </PageHeader>
      {register ? (
        <>
          <Field label="Работен регистър" className="mb-6 max-w-md">
            <Select value={register.id} onChange={event => navigateTo(`subregisters/${event.target.value}`)}>
              {owned.map(entry => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
            </Select>
          </Field>
          {register.subregisters.length ? (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)]">
              <SubregisterLinks register={register} selectedId={subregister?.id} />
              {subregister && (
                <section className="card min-w-0 p-5 sm:p-6">
                  <h2 className="text-2xl leading-tight font-bold tracking-tight wrap-anywhere">{subregister.name}</h2>
                  <p className="mt-1 text-sm text-ink-muted">Активите остават част от общия регистър.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button onClick={onInvite}><Users size={17} aria-hidden="true" /> Покани профил</Button>
                    <Button variant="secondary" onClick={onScope}>Избери активи</Button>
                    <Button variant="secondary" onClick={onRename}>Преименувай</Button>
                  </div>
                  <div className="mt-6 border-t border-line pt-5">
                    <h3 className="mb-1 flex items-center gap-2.5 text-lg font-bold">Поканени профили <CountBadge>{members.length}</CountBadge></h3>
                    <MemberList members={members} onMemberRole={onMemberRole} onRemoveMember={onRemoveMember} />
                  </div>
                  <a className="text-link mt-4" href={`#history/${register.id}/${subregister.id}`}>
                    <History size={16} aria-hidden="true" />
                    История на подрегистъра
                  </a>
                </section>
              )}
            </div>
          ) : <EmptyState compact>Към този регистър още няма подрегистри.</EmptyState>}
        </>
      ) : <EmptyState compact>Създайте работен регистър, за да добавите подрегистри към него.</EmptyState>}
    </>
  );
}
