import Button from './Button.jsx';
import { FolderOpen, Plus } from 'lucide-react';

export default function EmptyState({
  icon: Icon = FolderOpen, title, description, actionLabel, onAction, compact = false, children,
}) {
  return (
    <div className={`grid gap-3 rounded-2xl border border-dashed border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] px-6 ${compact ? 'justify-items-start py-6 text-left' : 'justify-items-center py-12 text-center'}`}>
      {!compact && <span className="mb-1 grid size-14 place-items-center rounded-2xl bg-[#f0f1f4] dark:bg-[#2b2d33] text-[#62646c] dark:text-[#b0b2be]">
        <Icon size={25} strokeWidth={1.6} aria-hidden="true" />
      </span>}
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <p className="max-w-md text-sm leading-relaxed text-[#62646c] dark:text-[#b0b2be]">{description || children}</p>
      {onAction && (
        <Button type="button" className="mt-2" onClick={onAction}>
          <Plus size={17} aria-hidden="true" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
