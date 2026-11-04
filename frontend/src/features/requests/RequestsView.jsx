import Button from '../../shared/ui/Button.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import { requestLabels, requestStatuses } from '../../registryStore.js';
import { dateTime, profileName } from '../../shared/formatters.js';
import StatusBadge from '../../shared/ui/StatusBadge.jsx';

export default function RequestsView({ incoming, submitted, onDecide }) {
  const sections = [
    ['Входящи', incoming.filter(({ request }) => request.status === 'pending'), true],
    ['Подадени от мен', submitted, false],
    ['Обработени входящи', incoming.filter(({ request }) => request.status !== 'pending'), false],
  ];
  return (
    <>
      <PageHeader title="Заявки" description="Разгледайте входящите заявки за вашите регистри и проследете тези, които сте подали." />
      {sections.map(([title, items, canDecide]) => (
        <section className="mb-7" key={title}>
          <h2 className="mb-3 text-lg font-semibold">{title}</h2>
          {items.length ? (
            <ul className="grid gap-3">
              {items.map(({ register, request }) => {
                const asset = register.assets.find(entry => entry.id === request.assetId);
                const subregister = register.subregisters.find(entry => entry.id === request.subregisterId);
                return (
                  <li key={request.id} className="min-w-0 rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] p-5 sm:p-6 shadow-[0_2px_8px_rgb(24_32_48/0.03)] dark:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-[#62646c] dark:text-[#b0b2be] wrap-anywhere">{register.name} / {subregister?.name} · {dateTime.format(new Date(request.createdAt))}</p>
                        <h3 className="mt-1 font-semibold">{requestLabels[request.kind]}</h3>
                      </div>
                      <StatusBadge tone={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>{requestStatuses[request.status]}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm wrap-anywhere">{asset?.name} · {asset?.inventoryNumber} · {profileName(request.requesterId)}</p>
                    {request.kind === 'location' && <p className="mt-1 text-sm text-[#62646c] dark:text-[#b0b2be] wrap-anywhere">{request.originalLocation} → {request.location}</p>}
                    <p className="mt-2 text-sm text-[#62646c] dark:text-[#b0b2be] whitespace-pre-wrap wrap-anywhere">{request.note}</p>
                    {request.reason && <p className="mt-2 text-sm wrap-anywhere"><strong>Причина за отказ:</strong> {request.reason}</p>}
                    {canDecide && request.status === 'pending' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" onClick={() => onDecide(register.id, request, 'approved')}>Одобри</Button>
                        <Button type="button" variant="secondary" onClick={() => onDecide(register.id, request, 'rejected')}>Отхвърли</Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState compact>Няма заявки в тази секция.</EmptyState>}
        </section>
      ))}
    </>
  );
}
