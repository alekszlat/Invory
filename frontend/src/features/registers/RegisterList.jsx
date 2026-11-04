import Button from '../../shared/ui/Button.jsx';
import { Box, FolderOpen, Plus } from 'lucide-react';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import RegisterCard from './RegisterCard.jsx';

function RegisterIntroduction() {
  return (
    <section className="flex items-center justify-between gap-6 overflow-hidden rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] px-6 py-8 sm:px-8 sm:py-10">
      <div className="max-w-xl">
        <p className="mb-2 text-xs leading-relaxed font-semibold tracking-wide text-[#005ac1] dark:text-[#9bcaff]">Общ организационен регистър</p>
        <h2 className="mt-3 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">Активите на организацията на едно място</h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#62646c] dark:text-[#b0b2be]">Отворете регистър, за да прегледате записите или да добавите актив с инвентарен номер, местоположение и отговорник.</p>
      </div>
      <div className="relative hidden h-40 w-64 shrink-0 xl:block" aria-hidden="true">
        <span className="absolute h-28 w-48 rounded-xl border border-[#dcdde3] dark:border-[#3b3d46] top-1 right-5 rotate-6 bg-[#f0f1f4] dark:bg-[#2b2d33]" />
        <span className="absolute h-28 w-48 rounded-xl border border-[#dcdde3] dark:border-[#3b3d46] top-6 right-9 -rotate-3 bg-[#e8f0fc] dark:bg-[#233a55]" />
        <div className="absolute top-14 right-0 flex w-64 items-center gap-3 rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] p-4 shadow-[0_2px_8px_rgb(24_32_48/0.03)] dark:shadow-none">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#005ac1]/15 dark:border-[#9bcaff]/15 bg-[#e8f0fc] dark:bg-[#233a55] text-[#005ac1] dark:text-[#9bcaff]"><Box size={23} strokeWidth={1.6} /></span>
          <div>
            <p className="text-sm font-semibold">Регистър на активите</p>
            <p className="mt-1 text-xs text-[#62646c] dark:text-[#b0b2be]">Записи на организацията</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function RegisterList({ registers, onCreate, registerHref }) {
  return (
    <>
      <PageHeader title="Работни регистри" description="Създавайте и управлявайте регистрите на организацията.">
        <Button type="button" onClick={onCreate}>
          <Plus size={17} aria-hidden="true" />
          Нов регистър
        </Button>
      </PageHeader>
      <RegisterIntroduction />
      <section className="mt-9" aria-labelledby="registers-title">
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
