import { Archive, Pencil } from 'lucide-react';

import { InventoryTag, StatusBadge } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import Dialog from '../../shared/ui/Dialog.jsx';
import { calendarDate, quantity } from '../../shared/formatters.js';
import { assetStatusTones } from '../../shared/labels.js';

export default function AssetDetails({ asset, onClose, onEdit, onArchive }) {
  const details = [
    ['Местоположение', asset.location],
    ['Отговорник', asset.custodian],
    ['Количество', `${quantity.format(asset.quantity)} ${asset.unit}`],
    ['Дата на придобиване', asset.acquiredOn ? calendarDate.format(new Date(asset.acquiredOn)) : ''],
    ['Документ основание', asset.sourceDocument],
  ];

  return (
    <Dialog title={asset.name} description="Данни за актива" onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <InventoryTag>{asset.inventoryNumber}</InventoryTag>
        <StatusBadge tone={assetStatusTones[asset.status]}>{asset.status}</StatusBadge>
      </div>
      <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2 sm:p-6">
        {details.map(([label, value]) => (
          <div key={label} className="border-b border-line pb-3">
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="mt-1 font-semibold wrap-anywhere">{value || '—'}</dd>
          </div>
        ))}
      </dl>
      {(onEdit || onArchive) && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-muted px-5 py-4 sm:px-6">
          {onArchive && <Button variant="danger" onClick={onArchive}><Archive size={17} aria-hidden="true" />Архивирай</Button>}
          {onEdit && <Button onClick={onEdit}><Pencil size={17} aria-hidden="true" />Редактирай</Button>}
        </div>
      )}
    </Dialog>
  );
}
