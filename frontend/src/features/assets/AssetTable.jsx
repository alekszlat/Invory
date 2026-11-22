import { InventoryTag, StatusBadge } from '../../shared/ui/Badge.jsx';
import { quantity } from '../../shared/formatters.js';
import { assetStatusTones } from '../../shared/labels.js';

// The look of this table, including how rows turn into cards on phones, is in .asset-table in index.css.
// data-label gives each cell its column name on phones, where the column headings are hidden.
function AssetRow({ asset, onOpen, assetActions }) {
  return (
    <tr>
      <th scope="row" className="font-normal md:max-w-72">
        <button type="button" onClick={() => onOpen(asset)}
          className="inline-flex min-h-11 cursor-pointer items-center text-left text-base font-semibold text-ink underline decoration-line-strong decoration-1 underline-offset-4 wrap-anywhere hover:text-accent hover:decoration-accent">
          {asset.name}
        </button>
        <div><InventoryTag>{asset.inventoryNumber}</InventoryTag></div>
      </th>
      <td data-label="Местоположение" className="wrap-anywhere md:max-w-48">{asset.location}</td>
      <td data-label="Отговорник" className="wrap-anywhere md:max-w-48">{asset.custodian || '—'}</td>
      <td data-label="Количество" className="whitespace-nowrap tabular-nums">{quantity.format(asset.quantity)} {asset.unit}</td>
      <td data-cell="status"><StatusBadge tone={assetStatusTones[asset.status]}>{asset.status}</StatusBadge></td>
      {/* The server refuses checks and requests for a disposed asset, so its row has no actions. */}
      {assetActions && <td data-cell="actions">{asset.status !== 'Бракуван' && assetActions(asset)}</td>}
    </tr>
  );
}

export default function AssetTable({ assets, onOpen, assetActions }) {
  return (
    <div className="card overflow-x-auto" role="region" aria-labelledby="assets-title" tabIndex={0}>
      <table className="asset-table md:min-w-160">
        <caption className="sr-only">Активи в избрания регистър</caption>
        <thead>
          <tr>
            <th scope="col">Актив</th>
            <th scope="col">Местоположение</th>
            <th scope="col">Отговорник</th>
            <th scope="col">Количество</th>
            <th scope="col">Статус</th>
            {assetActions && <th scope="col">Действия</th>}
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => <AssetRow key={asset.id} asset={asset} onOpen={onOpen} assetActions={assetActions} />)}
          {!assets.length && <tr><td data-cell="empty" colSpan={assetActions ? 6 : 5} className="py-10 text-center text-ink-muted">Няма активи, които отговарят на търсенето.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
