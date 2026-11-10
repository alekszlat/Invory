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
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] p-0 text-[#1d1d1f] dark:text-[#f1f1f4] overscroll-contain shadow-[0_24px_80px_rgb(0_0_0/0.22)] dark:shadow-[0_24px_80px_rgb(0_0_0/0.45)] backdrop:bg-[rgb(10_15_25/0.48)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#dcdde3] dark:border-[#3b3d46] p-5 sm:p-6">
        <div className="min-w-0">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight wrap-anywhere">{title}</h2>
          {description && <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-[#62646c] dark:text-[#b0b2be] wrap-anywhere">{description}</p>}
        </div>
        <button type="button" onClick={onClose} disabled={pending} aria-label="Затвори" className="grid size-11 shrink-0 place-items-center rounded-xl text-[#62646c] dark:text-[#b0b2be] hover:bg-[#f0f1f4] dark:hover:bg-[#2b2d33] cursor-pointer disabled:cursor-wait disabled:opacity-60">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
