import Button from './Button.jsx';
import { useState } from 'react';
import Dialog from './Dialog.jsx';

export default function FormDialog({ title, description, submitLabel, onClose, onSave, children }) {
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
        <div className="p-5 sm:p-6">{children}</div>
        {error && <p role="alert" className="rounded-xl border px-4 py-3 text-sm leading-relaxed font-medium border-[#b32830]/25 dark:border-[#ffb1b8]/25 bg-[#fcecef] dark:bg-[#462c32] text-[#b32830] dark:text-[#ffb1b8] mx-5 mb-4 sm:mx-6">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#dcdde3] dark:border-[#3b3d46] bg-[#f0f1f4] dark:bg-[#2b2d33] px-5 py-4 sm:px-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Отказ</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Записване…' : submitLabel}</Button>
        </div>
      </form>
    </Dialog>
  );
}
