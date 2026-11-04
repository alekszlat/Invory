import { Input, Select, Textarea } from '../../shared/ui/FormControls.jsx';
import { useState } from 'react';
import Field from '../../shared/ui/Field.jsx';
import FormDialog from '../../shared/ui/FormDialog.jsx';

export function ObservationDialog({ asset, disposal, onClose, onSave }) {
  const [kind, setKind] = useState(disposal ? 'disposal' : 'present');

  return (
    <FormDialog title={disposal ? 'Предложи бракуване' : 'Проверка на актив'} description={`${asset.name} · ${asset.inventoryNumber}`} submitLabel={kind === 'present' ? 'Запази проверката' : 'Подай заявка'} onClose={onClose} onSave={onSave}>
      <div className="grid gap-4">
        {disposal ? <input type="hidden" name="kind" value="disposal" /> : (
          <Field label="Резултат от проверката">
            <Select name="kind" value={kind} onChange={event => setKind(event.target.value)} data-initial-focus>
              <option value="present">Наличен по опис</option>
              <option value="missing">Липсващ</option>
              <option value="location">Променено местоположение</option>
            </Select>
          </Field>
        )}
        {kind === 'location' && (
          <Field label="Установено местоположение">
            <Input name="location" required maxLength={120} placeholder={`По опис: ${asset.location}`} />
          </Field>
        )}
        {kind !== 'present' && (
          <Field label="Причина или описание">
            <Textarea name="note" required maxLength={500} rows={3} data-initial-focus={disposal ? '' : undefined} />
          </Field>
        )}
      </div>
    </FormDialog>
  );
}

export function DecisionDialog({ approve, description, onClose, onSave }) {
  return (
    <FormDialog title={approve ? 'Одобри заявката' : 'Отхвърли заявката'} description={description} submitLabel={approve ? 'Потвърди одобрението' : 'Потвърди отказа'} onClose={onClose} onSave={onSave}>
      {approve ? <p className="text-sm text-[#62646c] dark:text-[#b0b2be]">Решението ще се запише в историята на регистъра.</p> : (
        <Field label="Причина за отказа">
          <Textarea name="reason" required maxLength={500} rows={3} data-initial-focus />
        </Field>
      )}
    </FormDialog>
  );
}
