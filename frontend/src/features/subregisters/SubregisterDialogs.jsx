import { Input, Select } from '../../shared/ui/FormControls.jsx';
import { useState } from 'react';
import { roleLabels } from '../../shared/labels.js';
import { sharingApi } from '../../api/sharing.js';
import { allPages } from '../../api/client.js';
import { useApiQuery } from '../../api/query.js';
import Field from '../../shared/ui/Field.jsx';
import FormDialog from '../../shared/ui/FormDialog.jsx';
import Dialog from '../../shared/ui/Dialog.jsx';
import Button from '../../shared/ui/Button.jsx';

export function SubregisterDialog({ subregister, onClose, onSave }) {
  return (
    <FormDialog title={subregister ? 'Преименувай подрегистър' : 'Нов подрегистър'} description="Подрегистърът показва избрани активи от общия регистър." submitLabel={subregister ? 'Запази името' : 'Създай подрегистъра'} onClose={onClose} onSave={onSave}>
      <Field label="Име на подрегистъра">
        <Input name="name" required maxLength={100} defaultValue={subregister?.name} data-initial-focus />
      </Field>
    </FormDialog>
  );
}

export function ScopeDialog({ assets, subregister, onClose, onSave }) {
  return (
    <FormDialog title="Избери активи" description={subregister.name} submitLabel="Запази обхвата" onClose={onClose} onSave={onSave}>
      <fieldset className="divide-y divide-[#dcdde3] dark:divide-[#3b3d46]">
        <legend className="mb-2 text-sm font-semibold">Активи от общия регистър</legend>
        {assets.map(asset => (
          <label className="flex items-start gap-3 py-3 text-sm" key={asset.id}>
            <input type="checkbox" className="mt-0.5 size-4 accent-[#005ac1] dark:accent-[#9bcaff]" name="assetIds" value={asset.id} defaultChecked={subregister.assetIds.includes(asset.id)} disabled={Boolean(asset.archivedAt && !subregister.assetIds.includes(asset.id))} />
            <span className="wrap-anywhere">{asset.name} <span className="text-[#62646c] dark:text-[#b0b2be]">· {asset.inventoryNumber}{asset.archivedAt ? ' · Архивиран' : ''}</span></span>
          </label>
        ))}
      </fieldset>
    </FormDialog>
  );
}

export function InviteDialog({ userId, registerId, subregister, onClose, onChanged }) {
  const [role, setRole] = useState('participant');
  const [expiresAt, setExpiresAt] = useState(() => {
    const date = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [created, setCreated] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const query = useApiQuery(userId, 'invitations', subregister.id,
    signal => allPages((params, nextSignal) => sharingApi.invitations(registerId, subregister.id, params, nextSignal), {}, signal));

  async function generate(event) {
    event.preventDefault(); setPending(true); setError('');
    try {
      const invite = await sharingApi.invite(registerId, subregister.id, { role, expiresAt: new Date(expiresAt).toISOString() });
      setCreated(invite);
      await query.refetch(); onChanged();
    } catch (problem) { setError(problem.message); }
    finally { setPending(false); }
  }
  async function revoke(invite) {
    setPending(true); setError('');
    try { await sharingApi.revoke(invite.id); await query.refetch(); onChanged(); }
    catch (problem) { setError(problem.message); }
    finally { setPending(false); }
  }
  const link = invite => `${location.origin}${location.pathname}#accept/${invite.token}`;
  return <Dialog title="Покана за подрегистър" description={subregister.name} onClose={onClose} pending={pending}>
    <form onSubmit={generate} className="grid gap-4 p-5 sm:p-6">
      <Field label="Роля в подрегистъра"><Select value={role} onChange={event => setRole(event.target.value)} data-initial-focus>
        <option value="participant">{roleLabels.participant}</option><option value="guest">{roleLabels.guest}</option>
      </Select></Field>
      <Field label="Валидна до"><Input type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} required /></Field>
      <p className="text-sm text-[#62646c] dark:text-[#b0b2be]">Участникът сверява активи и подава заявки. Гостът преглежда и търси.</p>
      {error && <p role="alert" className="text-sm text-[#b32830] dark:text-[#ffb1b8]">{error}</p>}
      <Button type="submit" disabled={pending}>Генерирай връзка</Button>
      {created && <Field label="Връзка за покана"><Input readOnly value={link(created)} onFocus={event => event.target.select()} /></Field>}
    </form>
    <div className="border-t border-[#dcdde3] p-5 dark:border-[#3b3d46] sm:p-6">
      <h3 className="font-semibold">Създадени връзки</h3>
      {query.isPending && <p role="status" className="mt-2 text-sm">Зареждане…</p>}
      {query.error && <p role="alert" className="mt-2 text-sm text-[#b32830]">{query.error.message}</p>}
      <ul className="mt-2 divide-y divide-[#dcdde3] dark:divide-[#3b3d46]">
        {(query.data ?? []).map(invite => <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
          <span>{roleLabels[invite.role]} · {invite.revokedAt ? 'Отменена' : `До ${new Date(invite.expiresAt).toLocaleString('bg-BG')}`}</span>
          {!invite.revokedAt && <button type="button" disabled={pending} onClick={() => revoke(invite)} className="cursor-pointer font-semibold text-[#b32830] dark:text-[#ffb1b8]">Отмени</button>}
          {!invite.revokedAt && <Input aria-label="Връзка за покана" readOnly value={link(invite)} onFocus={event => event.target.select()} />}
        </li>)}
      </ul>
    </div>
  </Dialog>;
}
