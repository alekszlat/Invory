import { Package } from 'lucide-react';

import { StatusBadge } from '../../shared/ui/Badge.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { assetCount } from '../../shared/formatters.js';
import { roleLabels } from '../../shared/labels.js';

export default function InvitedList({ invitations }) {
  return (
    <>
      <PageHeader title="Поканени регистри" description="Тук се показват подрегистрите, до които вашият профил има споделен достъп." />
      {invitations.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {invitations.map(scope => (
            <li key={scope.id} className="min-w-0">
              <a href={`#invited/${scope.registerId}/${scope.id}`} className="card group flex h-full flex-col p-5 hover:border-line-strong sm:p-6 motion-safe:transition-colors">
                <p className="text-sm text-ink-muted wrap-anywhere">{scope.registerName}</p>
                <h2 className="mt-1 text-xl leading-tight font-bold tracking-tight wrap-anywhere decoration-1 underline-offset-4 group-hover:underline">{scope.name}</h2>
                <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-sm font-medium text-ink-muted">
                  <StatusBadge tone="accent">{roleLabels[scope.role]}</StatusBadge>
                  <span className="flex items-center gap-1.5"><Package size={16} strokeWidth={1.8} aria-hidden="true" />{assetCount(scope.assetIds.length)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : <EmptyState compact>За този профил още няма споделени регистри.</EmptyState>}
    </>
  );
}
