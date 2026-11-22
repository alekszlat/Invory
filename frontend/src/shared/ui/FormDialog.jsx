import { useState } from 'react';

import Button from './Button.jsx';
import Dialog from './Dialog.jsx';
import { Alert } from './Feedback.jsx';

export default function FormDialog({ title, description, submitLabel, onClose, onSave, children }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    // Object.fromEntries keeps only the last value of a repeated field, so the checked assetIds are read separately.
    const values = { ...Object.fromEntries(form), assetIds: form.getAll('assetIds') };
    setPending(true);
    setError('');
    try {
      // pending stays true after a success, because the parent closes this dialog.
      await onSave(values);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Записването е неуспешно.');
      setPending(false);
    }
  }

  return (
    <Dialog title={title} description={description} onClose={onClose} pending={pending}>
      <form onSubmit={submit} aria-busy={pending}>
        <div className="p-5 sm:p-6">{children}</div>
        {error && <Alert className="mx-5 mb-4 sm:mx-6">{error}</Alert>}
        {/* The buttons stay in view while a long form scrolls inside the dialog. */}
        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-line bg-surface-muted px-5 py-4 sm:px-6">
          <Button variant="secondary" onClick={onClose} disabled={pending}>Отказ</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Записване…' : submitLabel}</Button>
        </div>
      </form>
    </Dialog>
  );
}
