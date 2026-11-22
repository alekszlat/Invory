import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

export default function Dialog({ title, description, onClose, pending = false, children }) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-initial-focus]')?.focus();
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={event => {
        // Escape would close the native dialog without React knowing. The parent removes the dialog instead, and only when no save is running.
        event.preventDefault();
        if (!pending) onClose();
      }}
      // On phones the dialog sits at the bottom edge like a sheet, where the thumb can reach its buttons.
      className="app-dialog fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-dialog border border-line bg-surface p-0 text-ink shadow-dialog backdrop:bg-backdrop max-sm:mb-0 max-sm:max-h-[calc(100dvh-1rem)] max-sm:w-full max-sm:rounded-b-none"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div className="min-w-0">
          <h2 id={titleId} className="text-xl leading-tight font-bold tracking-tight wrap-anywhere">{title}</h2>
          {description && <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-ink-muted wrap-anywhere">{description}</p>}
        </div>
        <button type="button" onClick={onClose} disabled={pending} aria-label="Затвори" className="-mt-1.5 -mr-1.5 grid size-11 shrink-0 cursor-pointer place-items-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink disabled:cursor-wait disabled:opacity-60">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
