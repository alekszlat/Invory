import StatusBadge from '../../shared/ui/StatusBadge.jsx';

const formatQuantity = new Intl.NumberFormat('bg-BG');

function AssetRow({ asset, onOpen, assetActions }) {
  const tone = asset.status === 'Активен' ? 'success' : asset.status === 'Бракуван' ? 'neutral' : 'warning';

  return (
    <tr className="border-[#dcdde3] not-first:border-t hover:bg-[#f0f1f4]/50 dark:border-[#3b3d46] dark:hover:bg-[#2b2d33]/50">
      <th scope="row" className="max-w-64 px-5 py-4 font-normal">
        <button type="button" className="inline-flex min-h-11 items-center text-left font-semibold text-[#005ac1] dark:text-[#9bcaff] wrap-anywhere hover:underline cursor-pointer disabled:cursor-wait disabled:opacity-60" onClick={() => onOpen(asset)}>{asset.name}</button>
        <div className="mt-1 text-xs font-normal text-[#62646c] dark:text-[#b0b2be] wrap-anywhere">{asset.inventoryNumber}</div>
      </th>
      <td className="max-w-44 px-5 py-4 wrap-anywhere">{asset.location}</td>
      <td className="max-w-44 px-5 py-4 wrap-anywhere">{asset.custodian || '—'}</td>
      <td className="px-5 py-4 whitespace-nowrap tabular-nums">{formatQuantity.format(asset.quantity)} {asset.unit}</td>
      <td className="px-5 py-4 whitespace-nowrap"><StatusBadge tone={tone}>{asset.status}</StatusBadge></td>
      {/* The server refuses checks and requests for a disposed asset, so its row has no actions. */}
      {assetActions && <td className="px-5 py-4">{asset.status !== 'Бракуван' && assetActions(asset)}</td>}
    </tr>
  );
}

export default function AssetTable({ assets, onOpen, assetActions }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] shadow-[0_2px_8px_rgb(24_32_48/0.03)] dark:shadow-none" role="region" aria-labelledby="assets-title" tabIndex={0}>
      <table className="w-full min-w-160 text-left text-sm">
        <caption className="sr-only">Активи в избрания регистър</caption>
        <thead className="border-b border-[#dcdde3] bg-[#f0f1f4] text-xs text-[#62646c] dark:border-[#3b3d46] dark:bg-[#2b2d33] dark:text-[#b0b2be]">
          <tr>
            <th scope="col" className="px-5 py-4 font-medium">Актив</th>
            <th scope="col" className="px-5 py-4 font-medium">Местоположение</th>
            <th scope="col" className="px-5 py-4 font-medium">Отговорник</th>
            <th scope="col" className="px-5 py-4 font-medium">Количество</th>
            <th scope="col" className="px-5 py-4 font-medium">Статус</th>
            {assetActions && <th scope="col" className="px-5 py-4 font-medium">Действия</th>}
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => <AssetRow key={asset.id} asset={asset} onOpen={onOpen} assetActions={assetActions} />)}
          {!assets.length && <tr><td colSpan={assetActions ? 6 : 5} className="px-5 py-10 text-center text-[#62646c] dark:text-[#b0b2be]">Няма активи, които отговарят на търсенето.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
