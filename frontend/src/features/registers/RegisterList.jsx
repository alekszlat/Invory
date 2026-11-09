import Button from '../../shared/ui/Button.jsx';
import { FolderOpen, Plus } from 'lucide-react';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import RegisterCard from './RegisterCard.jsx';

export default function RegisterList({ registers, onCreate, registerHref }) {
  return (
    <>
      <PageHeader title="Работни регистри" description="Създавайте и управлявайте регистрите на организацията.">
        <Button type="button" onClick={onCreate}>
          <Plus size={17} aria-hidden="true" />
          Нов регистър
        </Button>
      </PageHeader>
      <section className="mt-8" aria-labelledby="registers-title">
        <div className="mb-4 flex items-center gap-3">
          <h2 id="registers-title" className="text-lg font-semibold tracking-tight">Регистри</h2>
          <span aria-label={`${registers.length} регистъра`} className="inline-flex rounded-lg bg-[#f0f1f4] dark:bg-[#2b2d33] px-2.5 py-1 text-xs font-medium text-[#62646c] dark:text-[#b0b2be] tabular-nums">{registers.length}</span>
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
