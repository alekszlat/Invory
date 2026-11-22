import { Search } from 'lucide-react';

import { Input, Select } from '../../shared/ui/FormControls.jsx';
import { assetStatuses } from '../../shared/labels.js';

export default function AssetFilters({ search, status, onSearchChange, onStatusChange }) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto" role="search" aria-label="Търсене в регистъра">
      <label className="relative min-w-0 flex-1 lg:w-72">
        <span className="sr-only">Търси актив</span>
        <Search size={18} strokeWidth={1.8} className="pointer-events-none absolute top-3.5 left-3.5 text-ink-muted" aria-hidden="true" />
        <Input type="search" value={search} onChange={event => onSearchChange(event.target.value)} leadingIcon placeholder="Име, номер или място" />
      </label>
      <Select fullWidth={false} className="w-full sm:w-auto" value={status} onChange={event => onStatusChange(event.target.value)} aria-label="Филтър по статус">
        <option value="">Всички статуси</option>
        {assetStatuses.map(entry => <option key={entry}>{entry}</option>)}
      </Select>
    </div>
  );
}
