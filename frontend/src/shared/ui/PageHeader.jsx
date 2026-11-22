import { StatusBadge } from './Badge.jsx';

// badge names the person's role on this page, such as "Участник".
export default function PageHeader({ title, description, badge, children }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 max-w-3xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-3xl leading-[1.1] font-bold tracking-tight wrap-anywhere sm:text-4xl">{title}</h1>
          {badge && <StatusBadge tone="accent">{badge}</StatusBadge>}
        </div>
        {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted wrap-anywhere">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
