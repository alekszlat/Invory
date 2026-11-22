import { useState } from 'react';

import { InventoryTag, StatusBadge } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import Dialog from '../../shared/ui/Dialog.jsx';
import { Alert, Loading } from '../../shared/ui/Feedback.jsx';
import { Field, Input, Select } from '../../shared/ui/FormControls.jsx';
import FormDialog from '../../shared/ui/FormDialog.jsx';
import { dateTime } from '../../shared/formatters.js';
import { roleLabels } from '../../shared/labels.js';

import { allPages } from '../../api/client.js';
import { useApiQuery } from '../../api/query.js';
import { sharingApi } from '../../api/sharing.js';

export function SubregisterDialog({ subregister, onClose, onSave }) {
  return (
    <FormDialog
      title={subregister ? 'Преименувай подрегистър' : 'Нов подрегистър'}
      description="Подрегистърът показва избрани активи от общия регистър."
      submitLabel={subregister ? 'Запази името' : 'Създай подрегистъра'}
      onClose={onClose}
      onSave={onSave}
    >
      <Field label="Име на подрегистъра">
        <Input name="name" required maxLength={100} defaultValue={subregister?.name} data-initial-focus />
      </Field>
    </FormDialog>
  );
}

export function ScopeDialog({ assets, subregister, onClose, onSave }) {
  return (
    <FormDialog title="Избери активи" description={subregister.name} submitLabel="Запази обхвата" onClose={onClose} onSave={onSave}>
      <fieldset className="divide-y divide-line">
        <legend className="mb-2 text-sm font-semibold">Активи от общия регистър</legend>
        {assets.map(asset => {
          const chosen = subregister.assetIds.includes(asset.id);
          return (
            <label className="flex cursor-pointer items-start gap-3 py-3 has-disabled:cursor-not-allowed has-disabled:opacity-60" key={asset.id}>
              <input type="checkbox" className="mt-1 size-4.5 shrink-0 accent-primary" name="assetIds" value={asset.id} defaultChecked={chosen} disabled={Boolean(asset.archivedAt && !chosen)} />
              <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="font-medium wrap-anywhere">{asset.name}</span>
                <InventoryTag>{asset.inventoryNumber}</InventoryTag>
                {asset.archivedAt && <StatusBadge>Архивиран</StatusBadge>}
              </span>
            </label>
          );
        })}
      </fieldset>
    </FormDialog>
  );
}

// The link opens the accept page of this app. The token is the only secret part of it.
const inviteLink = invite => `${location.origin}${location.pathname}#accept/${invite.token}`;

function selectText(event) {
  event.target.select();
}

export function InviteDialog({ userId, registerId, subregister, onClose, onChanged }) {
  const [role, setRole] = useState('participant');
  // A datetime-local input takes local time without a zone. toISOString() gives UTC, so the date is shifted
  // by the time zone offset first. The default validity is 7 days.
  const [expiresAt, setExpiresAt] = useState(() => {
    const date = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [created, setCreated] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const query = useApiQuery(userId, 'invitations', subregister.id,
    signal => allPages((params, nextSignal) => sharingApi.invitations(registerId, subregister.id, params, nextSignal), {}, signal));

  async function changeInvitations(callback) {
    setPending(true);
    setError('');
    try {
      await callback();
      await query.refetch();
      onChanged();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setPending(false);
    }
  }
  async function generate(event) {
    event.preventDefault();
    await changeInvitations(async () => {
      const invite = await sharingApi.invite(registerId, subregister.id, { role, expiresAt: new Date(expiresAt).toISOString() });
      setCreated(invite);
    });
  }
  async function revoke(invite) {
    await changeInvitations(() => sharingApi.revoke(invite.id));
  }

  return (
    <Dialog title="Покана за подрегистър" description={subregister.name} onClose={onClose} pending={pending}>
      <form onSubmit={generate} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <Field label="Роля в подрегистъра">
          <Select value={role} onChange={event => setRole(event.target.value)} data-initial-focus>
            <option value="participant">{roleLabels.participant}</option>
            <option value="guest">{roleLabels.guest}</option>
          </Select>
        </Field>
        <Field label="Валидна до">
          <Input type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} required />
        </Field>
        <p className="text-sm leading-relaxed text-ink-muted sm:col-span-2">Участникът сверява активи и подава заявки. Гостът преглежда и търси.</p>
        {error && <Alert className="sm:col-span-2">{error}</Alert>}
        <Button type="submit" disabled={pending} className="sm:col-span-2 sm:justify-self-start">Генерирай връзка</Button>
        {created && (
          <Field label="Връзка за покана" wide>
            <Input readOnly value={inviteLink(created)} onFocus={selectText} />
          </Field>
        )}
      </form>
      <div className="border-t border-line bg-surface-muted p-5 sm:p-6">
        <h3 className="font-bold">Създадени връзки</h3>
        {query.isPending && <Loading className="mt-2" />}
        {query.error && <Alert className="mt-2">{query.error.message}</Alert>}
        <ul className="mt-2 divide-y divide-line">
          {(query.data ?? []).map(invite => (
            <li key={invite.id} className="grid gap-2 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={invite.revokedAt ? 'neutral' : 'accent'}>{roleLabels[invite.role]}</StatusBadge>
                  <span className="text-ink-muted">{invite.revokedAt ? 'Отменена' : `Валидна до ${dateTime.format(new Date(invite.expiresAt))}`}</span>
                </span>
                {!invite.revokedAt && <Button variant="danger" disabled={pending} onClick={() => revoke(invite)}>Отмени</Button>}
              </div>
              {!invite.revokedAt && <Input aria-label="Връзка за покана" readOnly value={inviteLink(invite)} onFocus={selectText} />}
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
