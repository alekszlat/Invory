import { ClipboardList, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CountBadge } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import { Alert, Loading } from '../../shared/ui/Feedback.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { assetCount } from '../../shared/formatters.js';
import { roleLabels } from '../../shared/labels.js';

import { assetsApi } from '../../api/assets.js';
import { useApiQuery } from '../../api/query.js';

import AssetFilters from './AssetFilters.jsx';
import AssetTable from './AssetTable.jsx';

function Pagination({ page, totalPages, onChange }) {
  return (
    <nav aria-label="Страници с активи" className="mt-4 flex flex-wrap items-center justify-end gap-2 text-sm">
      <Button variant="secondary" disabled={page === 1} onClick={() => onChange(page - 1)}>Предишна</Button>
      <span className="px-2 text-ink-muted tabular-nums">Страница {page} от {totalPages}</span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Следваща</Button>
    </nav>
  );
}

export default function RegisterView({
  register, registerId, subregisterId, userId, onAdd, onOpen, badge = roleLabels.owner, extraActions, assetActions,
}) {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const filters = { subregisterId, search: appliedSearch, status, page, pageSize: 20 };

  // Waits for a pause in typing, so that a search costs one server call rather than one per letter.
  useEffect(() => {
    const timer = setTimeout(() => { setAppliedSearch(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useApiQuery(userId, `assets:${registerId}`, filters, signal => assetsApi.list(registerId, filters, signal));
  const count = register.assetCount;
  const totalPages = query.data?.pagination.totalPages ?? 0;

  function changeStatus(value) {
    setStatus(value);
    setPage(1);
  }

  function renderAssets() {
    if (query.isPending) return <Loading>Зареждане на активи…</Loading>;
    if (!count) {
      return (
        <EmptyState icon={ClipboardList} title="Регистърът все още е празен"
          description={onAdd ? 'Добавете първия актив. Инвентарният му номер ще го отличава от останалите записи в регистъра.' : 'В този обхват все още няма активи.'}
          actionLabel="Добави първия актив" onAction={onAdd} />
      );
    }
    return (
      <>
        <AssetTable assets={query.data?.items ?? []} onOpen={onOpen} assetActions={assetActions} />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </>
    );
  }

  return (
    <>
      <PageHeader title={register.name} badge={badge} description={register.description}>
        {extraActions}
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus size={17} aria-hidden="true" />
            Добави актив
          </Button>
        )}
      </PageHeader>
      <section aria-labelledby="assets-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h2 id="assets-title" className="text-xl font-bold tracking-tight">Активи</h2>
            <CountBadge label={assetCount(count)}>{count}</CountBadge>
          </div>
          {count > 0 && <AssetFilters search={search} status={status} onSearchChange={setSearch} onStatusChange={changeStatus} />}
        </div>
        {query.error && <Alert className="mb-4">{query.error.message}</Alert>}
        {renderAssets()}
      </section>
    </>
  );
}
