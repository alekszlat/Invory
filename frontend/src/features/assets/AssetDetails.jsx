import Dialog from '../../shared/ui/Dialog.jsx';

const dateFormat = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeZone: 'UTC' });
const quantityFormat = new Intl.NumberFormat('bg-BG');

export default function AssetDetails({ asset, onClose }) {
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
    </Dialog>
  );
}
