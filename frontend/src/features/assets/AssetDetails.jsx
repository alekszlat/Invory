import Dialog from '../../shared/ui/Dialog.jsx';

// acquiredOn is a date without a time, and new Date() reads it as UTC midnight.
// Formatting in UTC keeps time zones west of UTC from showing the previous day.
const dateFormat = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeZone: 'UTC' });
const quantityFormat = new Intl.NumberFormat('bg-BG');

export default function AssetDetails({ asset, onClose, onEdit, onArchive }) {
  const details = [
    ['Инвентарен номер', asset.inventoryNumber],
    ['Местоположение', asset.location],
    ['Отговорник', asset.custodian],
    ['Дата на придобиване', asset.acquiredOn ? dateFormat.format(new Date(asset.acquiredOn)) : ''],
    ['Количество', `${quantityFormat.format(asset.quantity)} ${asset.unit}`],
    ['Статус', asset.status],
    ['Документ основание', asset.sourceDocument],
  ];

  return (
    <Dialog title={asset.name} description="Данни за актива" onClose={onClose}>
      <dl className="p-5 sm:p-6 grid gap-5 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className="border-b border-[#dcdde3] dark:border-[#3b3d46] pb-3">
            <dt className="text-sm text-[#62646c] dark:text-[#b0b2be]">{label}</dt>
            <dd className="mt-1 text-sm font-semibold wrap-anywhere">{value || '—'}</dd>
          </div>
        ))}
      </dl>
      {(onEdit || onArchive) && <div className="flex justify-end gap-2 border-t border-[#dcdde3] p-5 dark:border-[#3b3d46]">
        {onEdit && <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#005ac1] dark:text-[#9bcaff]">Редактирай</button>}
        {onArchive && <button type="button" onClick={onArchive} className="text-sm font-semibold text-[#b32830] dark:text-[#ffb1b8]">Архивирай</button>}
      </div>}
    </Dialog>
  );
}
