import { LoaderCircle } from 'lucide-react';

const tones = {
  danger: 'border-danger/30 bg-danger-soft text-danger',
  success: 'border-success/30 bg-success-soft text-success',
  info: 'border-tag-line bg-accent-soft text-ink',
};

// A danger message is announced as soon as it appears. Success messages are announced by the
// role="status" region in AppShell, and two live regions would read them twice.
export function Alert({ tone = 'danger', className = '', children }) {
  return (
    <p role={tone === 'danger' ? 'alert' : undefined} className={`rounded-control border px-4 py-3 text-sm leading-relaxed font-medium wrap-anywhere ${tones[tone]} ${className}`}>
      {children}
    </p>
  );
}

export function Loading({ className = '', children = 'Зареждане…' }) {
  return (
    <p role="status" className={`flex items-center gap-2 text-sm text-ink-muted ${className}`}>
      <LoaderCircle size={17} aria-hidden="true" className="shrink-0 motion-safe:animate-spin" />
      {children}
    </p>
  );
}
