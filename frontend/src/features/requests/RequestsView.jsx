import { ArrowRight } from 'lucide-react';

import { CountBadge, InventoryTag, StatusBadge } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { dateTime } from '../../shared/formatters.js';
import { requestLabels, requestStatuses, requestStatusTones } from '../../shared/labels.js';

function RequestCard({ request, onDecide }) {
  return (
    <li className="card min-w-0 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-bold">{requestLabels[request.kind]}</h3>
          <p className="mt-0.5 text-sm text-ink-muted wrap-anywhere">{request.register.name} / {request.subregister.name}</p>
        </div>
        <StatusBadge tone={requestStatusTones[request.status]}>{requestStatuses[request.status]}</StatusBadge>
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className="font-semibold wrap-anywhere">{request.asset.name}</span>
        <InventoryTag>{request.asset.inventoryNumber}</InventoryTag>
      </p>
      {request.kind === 'location' && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm wrap-anywhere">
          <span className="text-ink-muted">{request.originalLocation}</span>
          <ArrowRight size={15} className="shrink-0 text-ink-muted" aria-hidden="true" /><span className="sr-only">към</span>
          <span className="font-semibold">{request.location}</span>
        </p>
      )}
      {request.note && <p className="mt-3 border-l-2 border-line-strong/40 pl-3 text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere">{request.note}</p>}
      {request.reason && <p className="mt-3 text-sm wrap-anywhere"><strong>Причина за отказ:</strong> {request.reason}</p>}
      <p className="mt-4 text-xs text-ink-muted">
        Подадена от {request.requester.name} на <time dateTime={request.createdAt}>{dateTime.format(new Date(request.createdAt))}</time>
      </p>
      {onDecide && request.status === 'pending' && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button onClick={() => onDecide(request, 'approved')}>Одобри</Button>
          <Button variant="secondary" onClick={() => onDecide(request, 'rejected')}>Отхвърли</Button>
        </div>
      )}
    </li>
  );
}

export default function RequestsView({ incoming, submitted, onDecide }) {
  const groups = [
    { title: 'Входящи', items: incoming.filter(request => request.status === 'pending'), onDecide },
    { title: 'Подадени от мен', items: submitted },
    { title: 'Обработени входящи', items: incoming.filter(request => request.status !== 'pending') },
  ];

  return (
    <>
      <PageHeader title="Заявки" description="Разгледайте входящите заявки за вашите регистри и проследете тези, които сте подали." />
      <div className="grid gap-10">
        {groups.map(group => (
          <section key={group.title}>
            <h2 className="mb-3 flex items-center gap-2.5 text-xl font-bold tracking-tight">
              {group.title} <CountBadge>{group.items.length}</CountBadge>
            </h2>
            {group.items.length ? (
              <ul className="grid gap-3 lg:grid-cols-2">
                {group.items.map(request => <RequestCard key={request.id} request={request} onDecide={group.onDecide} />)}
              </ul>
            ) : <EmptyState compact>Няма заявки в тази секция.</EmptyState>}
          </section>
        ))}
      </div>
    </>
  );
}
