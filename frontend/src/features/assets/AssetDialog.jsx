import { Input, Select } from '../../shared/ui/FormControls.jsx';
import Field from '../../shared/ui/Field.jsx';
import FormDialog from '../../shared/ui/FormDialog.jsx';

export default function AssetDialog({ registerName, onClose, onSave }) {
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
          <Input name="name" required maxLength={150} placeholder="Напр. Монитор Dell 24″" data-initial-focus />
        </Field>
        <Field label="Инвентарен номер *">
          <Input name="inventoryNumber" required maxLength={60} placeholder="Напр. INV-0014" />
        </Field>
        <Field label="Местоположение *">
          <Input name="location" required maxLength={120} placeholder="Напр. Каб. 302" />
        </Field>
        <Field label="Отговорник">
          <Input name="custodian" maxLength={120} placeholder="Име на МОЛ" />
        </Field>
        <Field label="Дата на придобиване">
          <Input name="acquiredOn" type="date" />
        </Field>
        <Field label="Количество *">
          <Input name="quantity" type="number" step="any" required defaultValue="1" />
        </Field>
        <Field label="Мярка">
          <Input name="unit" maxLength={12} defaultValue="бр." />
        </Field>
        <Field label="Статус">
          <Select name="status">
            <option>Активен</option>
            <option>За ремонт</option>
          </Select>
        </Field>
        <Field label="Документ основание">
          <Input name="sourceDocument" maxLength={200} placeholder="Номер и дата на документа" />
        </Field>
      </div>
    </FormDialog>
  );
}
