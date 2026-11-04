import { Input, Textarea } from '../../shared/ui/FormControls.jsx';
import Field from '../../shared/ui/Field.jsx';
import FormDialog from '../../shared/ui/FormDialog.jsx';

export default function RegisterDialog({ onClose, onSave }) {
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
          <Input name="name" required maxLength={100} placeholder="Напр. Регистър на катедрата" data-initial-focus />
        </Field>
        <Field label="Описание (по желание)">
          <Textarea name="description" rows={3} maxLength={300} placeholder="Какви активи ще управлявате в този регистър?" />
        </Field>
      </div>
    </FormDialog>
  );
}
