import { Select } from '../../shared/ui/FormControls.jsx';
import Button from '../../shared/ui/Button.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import { ArrowRight, FolderOpen, Plus, Users } from 'lucide-react';
import { roleLabels } from '../../registryStore.js';
import { profileName } from '../../shared/formatters.js';
import StatusBadge from '../../shared/ui/StatusBadge.jsx';
import { navigateTo } from '../../app/navigation.js';

export default function SubregistersView({ owned, register, subregister, onCreate, onScope, onInvite }) {
  return (
    <>
      <PageHeader title="Подрегистри" description="Изберете регистър, определете кои активи да се виждат и поканете профили с конкретна роля.">
        {register && <Button type="button" onClick={onCreate}><Plus size={17} aria-hidden="true" /> Нов подрегистър</Button>}
      </PageHeader>
      {register ? (
        <>
          <label className="grid min-w-0 gap-2 text-sm font-medium mb-5 max-w-md">
            Работен регистър
            <Select value={register.id} onChange={event => navigateTo(`subregisters/${event.target.value}`)}>
              {owned.map(entry => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
            </Select>
          </label>
          {register.subregisters.length ? (
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <nav aria-label="Подрегистри в избрания регистър" className="grid gap-2">
                {register.subregisters.map(entry => (
                  <a key={entry.id} href={`#subregisters/${register.id}/${entry.id}`} aria-current={entry.id === subregister?.id ? 'page' : undefined}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] px-4 py-4 hover:bg-[#f0f1f4] dark:hover:bg-[#2b2d33] aria-[current=page]:border-[#005ac1]/40 dark:aria-[current=page]:border-[#9bcaff]/40 aria-[current=page]:bg-[#e8f0fc] dark:aria-[current=page]:bg-[#233a55] motion-safe:transition-[background-color,border-color] motion-safe:duration-140 motion-safe:ease-[ease]">
                    <FolderOpen size={20} className="shrink-0 text-[#005ac1] dark:text-[#9bcaff]" aria-hidden="true" />
                    <span className="min-w-0"><strong className="block text-sm wrap-anywhere">{entry.name}</strong><small className="text-[#62646c] dark:text-[#b0b2be]">Активи: {entry.assetIds.length} · Поканени: {entry.members.length}</small></span>
                  </a>
                ))}
              </nav>
              {subregister && (
                <section className="min-w-0 rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] p-5 sm:p-6 shadow-[0_2px_8px_rgb(24_32_48/0.03)] dark:shadow-none">
                  <h2 className="text-lg font-semibold wrap-anywhere">{subregister.name}</h2>
                  <p className="mt-1 text-sm text-[#62646c] dark:text-[#b0b2be]">Активите остават част от общия регистър.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={onScope}>Избери активи</Button>
                    <Button type="button" onClick={onInvite}><Users size={17} aria-hidden="true" /> Покани профил</Button>
                  </div>
                  <h3 className="mt-6 mb-2 text-sm font-semibold">Поканени профили</h3>
                  {subregister.members.length ? (
                    <ul className="divide-y divide-[#dcdde3] dark:divide-[#3b3d46]">
                      {subregister.members.map(member => <li key={member.profileId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        {profileName(member.profileId)} <StatusBadge>{roleLabels[member.role]}</StatusBadge>
                      </li>)}
                    </ul>
                  ) : <p className="text-sm text-[#62646c] dark:text-[#b0b2be]">Все още няма поканени профили.</p>}
                  <a className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#005ac1] dark:text-[#9bcaff] hover:underline" href={`#history/${register.id}/${subregister.id}`}>История на подрегистъра <ArrowRight size={16} aria-hidden="true" /></a>
                </section>
              )}
            </div>
          ) : <EmptyState compact>Към този регистър още няма подрегистри.</EmptyState>}
        </>
      ) : <EmptyState compact>Създайте работен регистър, за да добавите подрегистри към него.</EmptyState>}
    </>
  );
}
