const tones = {
  neutral: 'bg-surface-muted text-ink-muted',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export function StatusBadge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs leading-relaxed font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function CountBadge({ label, children }) {
  return (
    <span aria-label={label} className="inline-flex min-w-7 justify-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted tabular-nums">
      {children}
    </span>
  );
}

// Drawn like the brass tag fixed to the item, so people can match the record on screen to the object in the room.
export function InventoryTag({ children }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-tag border border-tag-line bg-tag py-0.5 pr-2 pl-1.5 text-xs leading-relaxed font-semibold text-tag-ink tabular-nums wrap-anywhere">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-canvas ring-1 ring-tag-line" />
      {children}
    </span>
  );
}
