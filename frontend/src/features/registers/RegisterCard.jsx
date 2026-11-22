import { FolderTree, Package } from 'lucide-react';

import { assetCount, subregisterCount } from '../../shared/formatters.js';

// The whole card is the link, so it is easy to hit on a touch screen.
export default function RegisterCard({ register, href }) {
  return (
    <li className="min-w-0">
      <a href={href} className="card group flex h-full min-h-44 flex-col p-5 hover:border-line-strong sm:p-6 motion-safe:transition-colors">
        <h3 className="text-xl leading-tight font-bold tracking-tight wrap-anywhere decoration-1 underline-offset-4 group-hover:underline">{register.name}</h3>
        {register.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted wrap-anywhere">{register.description}</p>}
        <span className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-6 text-sm font-medium text-ink-muted">
          <span className="flex items-center gap-1.5"><Package size={16} strokeWidth={1.8} aria-hidden="true" />{assetCount(register.assetCount)}</span>
          <span className="flex items-center gap-1.5"><FolderTree size={16} strokeWidth={1.8} aria-hidden="true" />{subregisterCount(register.subregisters.length)}</span>
        </span>
      </a>
    </li>
  );
}
