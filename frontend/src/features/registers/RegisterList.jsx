import { FolderOpen, Plus } from 'lucide-react';

import { registerHref } from '../../app/navigation.js';

import { CountBadge } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { registerCount } from '../../shared/formatters.js';

import RegisterCard from './RegisterCard.jsx';

export default function RegisterList({ registers, onCreate }) {
  return (
    <>
      <PageHeader title="Работни регистри" description="Създавайте и управлявайте регистрите на организацията.">
        <Button onClick={onCreate}>
          <Plus size={17} aria-hidden="true" />
          Нов регистър
        </Button>
      </PageHeader>
      <section aria-labelledby="registers-title">
        <div className="mb-4 flex items-center gap-2.5">
          <h2 id="registers-title" className="text-xl font-bold tracking-tight">Регистри</h2>
          <CountBadge label={registerCount(registers.length)}>{registers.length}</CountBadge>
        </div>
        {registers.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {registers.map(register => <RegisterCard key={register.id} register={register} href={registerHref(register.id)} />)}
          </ul>
        ) : (
          <EmptyState icon={FolderOpen} title="Все още няма регистри"
            description="Създайте първия регистър и започнете с въвеждането на активите."
            actionLabel="Създай регистър" onAction={onCreate} />
        )}
      </section>
    </>
  );
}
