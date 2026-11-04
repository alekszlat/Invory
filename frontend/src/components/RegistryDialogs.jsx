import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { profiles, roleLabels } from '../registryStore.js';

function Dialog({ title, description, onClose, pending = false, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-initial-focus]')?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={event => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-sidebar/60"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:px-6">
        <div className="min-w-0">
          <h2 id="dialog-title" className="text-xl font-bold tracking-tight wrap-anywhere">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted wrap-anywhere">{description}</p>}
        </div>
        <button type="button" onClick={onClose} disabled={pending} aria-label="Затвори" className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function FormDialog({ title, description, submitLabel, onClose, onSave, children }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const values = { ...Object.fromEntries(form), assetIds: form.getAll('assetIds') };
    setPending(true);
    setError('');
    try {
      await onSave(values);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Записването е неуспешно.');
      setPending(false);
    }
  }

  return (
    <Dialog title={title} description={description} onClose={onClose} pending={pending}>
      <form onSubmit={submit} aria-busy={pending}>
        <div className="p-5 sm:px-6">{children}</div>
        {error && <p role="alert" className="mx-5 mb-4 rounded-lg bg-peach px-3 py-2 text-sm font-medium text-clay sm:mx-6">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-[#f9faf7] px-5 py-4 sm:px-6">
          <button type="button" className="button-secondary" onClick={onClose} disabled={pending}>Отказ</button>
          <button type="submit" className="button-primary" disabled={pending}>{pending ? 'Записване…' : submitLabel}</button>
        </div>
      </form>
    </Dialog>
  );
}

function Field({ label, children, wide = false }) {
  return <label className={`field-label ${wide ? 'sm:col-span-2' : ''}`}><span>{label}</span>{children}</label>;
}

export function RegisterDialog({ onClose, onSave }) {
  return (
    <FormDialog
      title="Създай регистър"
      description="Въведете име на организационния регистър."
      submitLabel="Създай регистъра"
      onClose={onClose}
      onSave={onSave}
    >
      <div className="grid gap-4">
        <Field label="Име на регистъра">
          <input name="name" required maxLength={100} className="field-control" placeholder="Напр. Регистър на катедрата" data-initial-focus />
        </Field>
        <Field label="Описание (по желание)">
          <textarea name="description" rows={3} maxLength={300} className="field-control resize-y" placeholder="Какви активи ще управлявате в този регистър?" />
        </Field>
      </div>
    </FormDialog>
  );
}

export function AssetDialog({ registerName, onClose, onSave }) {
  return (
    <FormDialog
      title="Добави актив"
      description={`Регистър: ${registerName}`}
      submitLabel="Запази актива"
      onClose={onClose}
      onSave={onSave}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Наименование *" wide>
          <input name="name" required maxLength={150} className="field-control" placeholder="Напр. Монитор Dell 24″" data-initial-focus />
        </Field>
        <Field label="Инвентарен номер *">
          <input name="inventoryNumber" required maxLength={60} className="field-control" placeholder="Напр. INV-0014" />
        </Field>
        <Field label="Местоположение *">
          <input name="location" required maxLength={120} className="field-control" placeholder="Напр. Каб. 302" />
        </Field>
        <Field label="Отговорник">
          <input name="custodian" maxLength={120} className="field-control" placeholder="Име на МОЛ" />
        </Field>
        <Field label="Дата на придобиване">
          <input name="acquiredOn" type="date" className="field-control" />
        </Field>
        <Field label="Количество *">
          <input name="quantity" type="number" step="any" required defaultValue="1" className="field-control" />
        </Field>
        <Field label="Мярка">
          <input name="unit" maxLength={12} defaultValue="бр." className="field-control" />
        </Field>
        <Field label="Статус">
          <select name="status" className="field-control">
            <option>Активен</option>
            <option>За ремонт</option>
          </select>
        </Field>
        <Field label="Документ основание">
          <input name="sourceDocument" maxLength={200} className="field-control" placeholder="Номер и дата на документа" />
        </Field>
      </div>
    </FormDialog>
  );
}

const dateFormat = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeZone: 'UTC' });
const quantityFormat = new Intl.NumberFormat('bg-BG');

export function AssetDetails({ asset, onClose }) {
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
      <dl className="grid gap-4 p-5 sm:grid-cols-2 sm:px-6">
        {details.map(([label, value]) => (
          <div key={label} className="border-b border-line pb-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 text-sm font-semibold wrap-anywhere">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}

export function SubregisterDialog({ onClose, onSave }) {
  return (
    <FormDialog title="Нов подрегистър" description="Подрегистърът показва избрани активи от общия регистър." submitLabel="Създай подрегистъра" onClose={onClose} onSave={onSave}>
      <Field label="Име на подрегистъра">
        <input className="field-control" name="name" required maxLength={100} data-initial-focus />
      </Field>
    </FormDialog>
  );
}

export function ScopeDialog({ register, subregister, onClose, onSave }) {
  return (
    <FormDialog title="Избери активи" description={subregister.name} submitLabel="Запази обхвата" onClose={onClose} onSave={onSave}>
      <fieldset className="divide-y divide-line">
        <legend className="mb-2 text-sm font-semibold">Активи от общия регистър</legend>
        {register.assets.map(asset => (
          <label className="flex items-start gap-3 py-3 text-sm" key={asset.id}>
            <input type="checkbox" className="mt-0.5 size-4 accent-clay" name="assetIds" value={asset.id} defaultChecked={subregister.assetIds.includes(asset.id)} />
            <span className="wrap-anywhere">{asset.name} <span className="text-muted">· {asset.inventoryNumber}</span></span>
          </label>
        ))}
      </fieldset>
    </FormDialog>
  );
}

export function InviteDialog({ profileId, subregister, onClose, onSave }) {
  const available = profiles.filter(profile => profile.id !== profileId);
  const [inviteeId, setInviteeId] = useState(available[0]?.id ?? '');
  const existing = subregister.members.find(member => member.profileId === inviteeId);

  return (
    <FormDialog title="Покани профил" description={subregister.name} submitLabel="Запази достъпа" onClose={onClose} onSave={onSave}>
      <div className="grid gap-4">
        <Field label="Демо профил">
          <select className="field-control" name="inviteeId" value={inviteeId} onChange={event => setInviteeId(event.target.value)} data-initial-focus>
            {available.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>
        </Field>
        <Field label="Роля в подрегистъра">
          <select key={inviteeId} className="field-control" name="role" defaultValue={existing?.role ?? 'participant'}>
            <option value="participant">{roleLabels.participant}</option>
            <option value="guest">{roleLabels.guest}</option>
          </select>
        </Field>
        <p className="text-sm text-muted">Участникът сверява активи и подава заявки. Гостът преглежда и търси.</p>
      </div>
    </FormDialog>
  );
}

export function ObservationDialog({ asset, disposal, onClose, onSave }) {
  const [kind, setKind] = useState(disposal ? 'disposal' : 'present');

  return (
    <FormDialog title={disposal ? 'Предложи бракуване' : 'Проверка на актив'} description={`${asset.name} · ${asset.inventoryNumber}`} submitLabel={kind === 'present' ? 'Запази проверката' : 'Подай заявка'} onClose={onClose} onSave={onSave}>
      <div className="grid gap-4">
        {disposal ? <input type="hidden" name="kind" value="disposal" /> : (
          <Field label="Резултат от проверката">
            <select className="field-control" name="kind" value={kind} onChange={event => setKind(event.target.value)} data-initial-focus>
              <option value="present">Наличен по опис</option>
              <option value="missing">Липсващ</option>
              <option value="location">Променено местоположение</option>
            </select>
          </Field>
        )}
        {kind === 'location' && (
          <Field label="Установено местоположение">
            <input className="field-control" name="location" required maxLength={120} placeholder={`По опис: ${asset.location}`} />
          </Field>
        )}
        {kind !== 'present' && (
          <Field label="Причина или описание">
            <textarea className="field-control resize-y" name="note" required maxLength={500} rows={3} data-initial-focus={disposal ? '' : undefined} />
          </Field>
        )}
      </div>
    </FormDialog>
  );
}

export function DecisionDialog({ approve, description, onClose, onSave }) {
  return (
    <FormDialog title={approve ? 'Одобри заявката' : 'Отхвърли заявката'} description={description} submitLabel={approve ? 'Потвърди одобрението' : 'Потвърди отказа'} onClose={onClose} onSave={onSave}>
      {approve ? <p className="text-sm text-muted">Решението ще се запише в историята на регистъра.</p> : (
        <Field label="Причина за отказа">
          <textarea className="field-control resize-y" name="reason" required maxLength={500} rows={3} data-initial-focus />
        </Field>
      )}
    </FormDialog>
  );
}
