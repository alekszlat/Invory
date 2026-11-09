import Button from '../../shared/ui/Button.jsx';
import { ClipboardList, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import AssetFilters from './AssetFilters.jsx';
import AssetTable from './AssetTable.jsx';
import { assetsApi } from '../../api/assets.js';
import { useApiQuery } from '../../api/query.js';

export default function RegisterView({
  register, registerId, subregisterId, userId, onAdd, onOpen, kicker = 'Организационен регистър', extraActions, assetActions,
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
  const result = query.data;

  return (
    <>
      <PageHeader title={register.name} kicker={kicker} description={register.description}>
        {extraActions}
        {onAdd && <Button type="button" onClick={onAdd}>
          <Plus size={17} aria-hidden="true" />
          Добави актив
        </Button>}
      </PageHeader>
      <section className="mt-8" aria-labelledby="assets-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="mb-0 flex items-center gap-3">
            <h2 id="assets-title" className="text-lg font-semibold tracking-tight">Активи</h2>
            <span className="inline-flex rounded-lg bg-[#f0f1f4] dark:bg-[#2b2d33] px-2.5 py-1 text-xs font-medium text-[#62646c] dark:text-[#b0b2be] tabular-nums">{count} {count === 1 ? 'актив' : 'актива'}</span>
          </div>
          {count > 0 && <AssetFilters search={search} status={status} onSearchChange={setSearch} onStatusChange={value => { setStatus(value); setPage(1); }} />}
        </div>
        {query.error && <p role="alert" className="mb-3 text-sm text-[#b32830] dark:text-[#ffb1b8]">{query.error.message}</p>}
        {query.isPending ? <p role="status">Зареждане на активи…</p> : count ? (
          <><AssetTable assets={result?.items ?? []} onOpen={onOpen} assetActions={assetActions} />
            {(result?.pagination.totalPages ?? 0) > 1 && <div className="mt-4 flex items-center justify-end gap-3 text-sm">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Предишна</button>
              <span>Страница {page} от {result.pagination.totalPages}</span>
              <button type="button" disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)}>Следваща</button>
            </div>}</>
        ) : (
          <EmptyState icon={ClipboardList} title="Регистърът все още е празен"
            description={onAdd ? 'Добавете първия актив. Инвентарният му номер ще го отличава от останалите записи в регистъра.' : 'В този обхват все още няма активи.'}
            actionLabel="Добави първия актив" onAction={onAdd} />
        )}
      </section>
    </>
  );
}
