import { FolderOpen, Plus } from 'lucide-react';

import Button from './Button.jsx';

// compact is a one-line note for a section that has nothing in it yet.
export default function EmptyState({
  icon: Icon = FolderOpen, title, description, actionLabel, onAction, compact = false, children,
}) {
  return (
    <div className={`grid gap-2 rounded-card border border-dashed border-line-strong/50 px-6 ${compact ? 'justify-items-start py-5 text-left' : 'justify-items-center bg-surface py-12 text-center'}`}>
      {!compact && (
        <span className="mb-2 grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
        </span>
      )}
      {title && <h3 className="text-lg font-bold">{title}</h3>}
      <p className="max-w-md text-sm leading-relaxed text-ink-muted">{description || children}</p>
      {onAction && (
        <Button className="mt-3" onClick={onAction}>
          <Plus size={17} aria-hidden="true" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
