import { Box } from 'lucide-react';

// The wordmark takes the caller's text color, so it works on the walnut sidebar and on a light page.
export default function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 text-2xl font-bold tracking-tight ${className}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-brass text-sidebar">
        <Box size={20} strokeWidth={2} aria-hidden="true" />
      </span>
      invory
    </span>
  );
}
