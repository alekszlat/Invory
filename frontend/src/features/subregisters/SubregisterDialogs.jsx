import { Input, Select } from '../../shared/ui/FormControls.jsx';
import { useState } from 'react';
import { profiles, roleLabels } from '../../registryStore.js';
import Field from '../../shared/ui/Field.jsx';
import FormDialog from '../../shared/ui/FormDialog.jsx';

export function SubregisterDialog({ onClose, onSave }) {
  return (
    <FormDialog title="Нов подрегистър" description="Подрегистърът показва избрани активи от общия регистър." submitLabel="Създай подрегистъра" onClose={onClose} onSave={onSave}>
      <Field label="Име на подрегистъра">
        <Input name="name" required maxLength={100} data-initial-focus />
      </Field>
    </FormDialog>
  );
}

export function ScopeDialog({ register, subregister, onClose, onSave }) {
  return (
    <FormDialog title="Избери активи" description={subregister.name} submitLabel="Запази обхвата" onClose={onClose} onSave={onSave}>
      <fieldset className="divide-y divide-[#dcdde3] dark:divide-[#3b3d46]">
        <legend className="mb-2 text-sm font-semibold">Активи от общия регистър</legend>
        {register.assets.map(asset => (
          <label className="flex items-start gap-3 py-3 text-sm" key={asset.id}>
            <input type="checkbox" className="mt-0.5 size-4 accent-[#005ac1] dark:accent-[#9bcaff]" name="assetIds" value={asset.id} defaultChecked={subregister.assetIds.includes(asset.id)} />
            <span className="wrap-anywhere">{asset.name} <span className="text-[#62646c] dark:text-[#b0b2be]">· {asset.inventoryNumber}</span></span>
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
          <Select name="inviteeId" value={inviteeId} onChange={event => setInviteeId(event.target.value)} data-initial-focus>
            {available.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </Select>
        </Field>
        <Field label="Роля в подрегистъра">
          <Select key={inviteeId} name="role" defaultValue={existing?.role ?? 'participant'}>
            <option value="participant">{roleLabels.participant}</option>
            <option value="guest">{roleLabels.guest}</option>
          </Select>
        </Field>
        <p className="text-sm text-[#62646c] dark:text-[#b0b2be]">Участникът сверява активи и подава заявки. Гостът преглежда и търси.</p>
      </div>
    </FormDialog>
  );
}
