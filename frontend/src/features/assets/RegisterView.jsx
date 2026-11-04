import Button from '../../shared/ui/Button.jsx';
import { ClipboardList, Plus } from 'lucide-react';
import { useState } from 'react';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import AssetFilters from './AssetFilters.jsx';
import AssetTable from './AssetTable.jsx';

export default function RegisterView({
  register, onAdd, onOpen, kicker = 'Организационен регистър', extraActions, assetActions,
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const query = search.trim().toLocaleLowerCase('bg');
  const matches = register.assets.filter(asset =>
    (!status || asset.status === status) && [asset.name, asset.inventoryNumber, asset.location, asset.custodian].some(value =>
      value.toLocaleLowerCase('bg').includes(query),
    ),
  );
  const count = register.assets.length;

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
          {count > 0 && <AssetFilters search={search} status={status} onSearchChange={setSearch} onStatusChange={setStatus} />}
        </div>
        {count ? (
          <AssetTable assets={matches} onOpen={onOpen} assetActions={assetActions} />
        ) : (
          <EmptyState icon={ClipboardList} title="Регистърът все още е празен"
            description={onAdd ? 'Добавете първия актив. Инвентарният му номер ще го отличава от останалите записи в регистъра.' : 'В този обхват все още няма активи.'}
            actionLabel="Добави първия актив" onAction={onAdd} />
        )}
      </section>
    </>
  );
}
