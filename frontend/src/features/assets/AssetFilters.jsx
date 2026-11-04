import { Input, Select } from '../../shared/ui/FormControls.jsx';
import { Search } from 'lucide-react';

export default function AssetFilters({ search, status, onSearchChange, onStatusChange }) {
  return (
    <div className="flex w-full flex-wrap gap-2 lg:w-auto" role="search" aria-label="Търсене в регистъра">
      <label className="relative min-w-0 flex-1 lg:w-64 max-[479px]:w-full max-[479px]:basis-full">
        <span className="sr-only">Търси актив</span>
        <Search size={18} strokeWidth={1.7} className="pointer-events-none absolute top-3.5 left-3.5 text-[#62646c] dark:text-[#b0b2be]" aria-hidden="true" />
        <Input type="search" value={search} onChange={event => onSearchChange(event.target.value)} leadingIcon placeholder="Име, номер или място" />
      </label>
      <Select fullWidth={false} className="max-w-full grow lg:grow-0 max-[479px]:w-full max-[479px]:basis-full" value={status} onChange={event => onStatusChange(event.target.value)} aria-label="Филтър по статус">
        <option value="">Всички статуси</option>
        <option>Активен</option>
        <option>За ремонт</option>
        <option>Бракуван</option>
      </Select>
    </div>
  );
}
