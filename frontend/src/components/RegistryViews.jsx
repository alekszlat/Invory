import { ArrowRight, Box, ClipboardList, FolderOpen, Plus, Search } from 'lucide-react';
import { useState } from 'react';

const formatQuantity = new Intl.NumberFormat('bg-BG');

function assetCount(count) {
  return `${count} ${count === 1 ? 'актив' : 'актива'}`;
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="grid justify-items-center rounded-2xl border border-dashed border-[#bdcabb] bg-white px-6 py-11 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-xl bg-peach text-clay">
        <Icon size={23} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {onAction && (
        <button type="button" className="button-primary mt-5" onClick={onAction}>
          <Plus size={17} aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function RegisterIllustration() {
  return (
    <div className="relative hidden h-36 w-60 shrink-0 lg:block" aria-hidden="true">
      <div className="absolute top-1 right-3 h-29 w-45 rotate-7 rounded-xl border border-dashed border-[#b2c1aa] bg-[#e2eadb]" />
      <div className="absolute top-7 right-9 h-27 w-43 rotate-3 rounded-xl border border-line bg-[#f7f9f4]" />
      <div className="absolute top-12 right-1 flex w-57 -rotate-5 items-center gap-3 rounded-xl border border-line bg-white p-3.5 shadow-sm">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-peach text-clay">
          <Box size={20} strokeWidth={1.7} />
        </span>
        <div>
          <div className="text-sm font-bold text-ink">Регистър на активите</div>
          <div className="mt-0.5 text-xs text-muted">Записи на организацията</div>
        </div>
      </div>
    </div>
  );
}

export function RegisterList({ registers, onCreate, registerHref }) {
  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-[2rem]">Работни регистри</h1>
          <p className="mt-2 text-sm text-muted">Създавайте и управлявайте регистрите на организацията.</p>
        </div>
        <button type="button" className="button-primary" onClick={onCreate}>
          <Plus size={17} aria-hidden="true" />
          Нов регистър
        </button>
      </section>

      <section className="mt-6 flex items-center justify-between gap-6 rounded-2xl border border-line bg-sage px-6 py-7 sm:px-8 sm:py-9">
        <div className="max-w-lg">
          <p className="text-xs font-semibold tracking-widest text-sage-ink uppercase">Общ организационен регистър</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Активите на организацията на едно място</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">Отворете регистър, за да прегледате записите или да добавите актив с инвентарен номер, местоположение и отговорник.</p>
        </div>
        <RegisterIllustration />
      </section>

      <section className="mt-8" aria-labelledby="registers-title">
        <div className="mb-4 flex items-center gap-2.5">
          <h2 id="registers-title" className="text-lg font-bold">Регистри</h2>
          <span aria-label={`${registers.length} регистъра`} className="rounded-md bg-sage px-2 py-0.5 text-xs font-semibold text-sage-ink">{registers.length}</span>
        </div>

        {registers.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {registers.map(register => (
              <li key={register.id} className="flex min-w-0 flex-col rounded-2xl border border-line bg-white p-5 shadow-xs">
                <span className="grid size-10 place-items-center rounded-lg bg-peach text-clay"><Box size={20} strokeWidth={1.7} aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-bold wrap-anywhere">{register.name}</h3>
                {register.description && <p className="mt-2 text-sm leading-relaxed text-muted wrap-anywhere">{register.description}</p>}
                <div className="mt-auto pt-5">
                  <p className="text-sm text-muted">{assetCount(register.assets.length)}</p>
                  <a href={registerHref(register.id)} aria-label={`Отвори регистър ${register.name}`} className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-sm font-semibold text-clay hover:underline">
                    Отвори регистъра
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="Все още няма регистри"
            description="Създайте първия регистър и започнете с въвеждането на активите."
            actionLabel="Създай регистър"
            onAction={onCreate}
          />
        )}
      </section>
    </>
  );
}

export function RegisterView({
  register, onAdd, onOpen, kicker = 'Организационен регистър', extraActions, assetActions,
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const query = search.trim().toLocaleLowerCase('bg');
  const matches = register.assets.filter(asset =>
    (!status || asset.status === status) && [asset.name, asset.inventoryNumber, asset.location, asset.custodian].some(value =>
      value.toLocaleLowerCase('bg').includes(query),
    ),
  );

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-semibold tracking-widest text-sage-ink uppercase">{kicker}</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight wrap-anywhere sm:text-[2rem]">{register.name}</h1>
          {register.description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted wrap-anywhere">{register.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {extraActions}
          {onAdd && (
            <button type="button" className="button-primary" onClick={onAdd}>
              <Plus size={17} aria-hidden="true" />
              Добави актив
            </button>
          )}
        </div>
      </section>

      <section className="mt-7" aria-labelledby="assets-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 id="assets-title" className="text-lg font-bold">Активи</h2>
            <span className="rounded-md bg-sage px-2 py-0.5 text-xs font-semibold text-sage-ink">{assetCount(register.assets.length)}</span>
          </div>
          {register.assets.length > 0 && (
            <div className="flex w-full flex-wrap gap-2 lg:w-auto">
              <div className="relative min-w-45 flex-1">
                <Search size={17} className="pointer-events-none absolute top-3.5 left-3 text-muted" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="field-control pl-9"
                  aria-label="Търси актив"
                  placeholder="Име, номер или място"
                />
              </div>
              <select className="field-control w-auto flex-1 lg:flex-initial" value={status} onChange={event => setStatus(event.target.value)} aria-label="Филтър по статус">
                <option value="">Всички статуси</option>
                <option>Активен</option>
                <option>За ремонт</option>
                <option>Бракуван</option>
              </select>
            </div>
          )}
        </div>
        {register.assets.length ? (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-136 text-left text-sm">
              <thead className="border-b border-line bg-[#f9faf7] text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Актив</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Местоположение</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Отговорник</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Количество</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Статус</th>
                  {assetActions && <th scope="col" className="px-4 py-3 font-semibold">Действия</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {matches.map(asset => (
                  <tr key={asset.id}>
                    <td className="max-w-64 px-4 py-3">
                      <button type="button" className="text-left font-semibold text-clay wrap-anywhere hover:underline" onClick={() => onOpen(asset)}>{asset.name}</button>
                      <div className="mt-0.5 text-xs text-muted wrap-anywhere">{asset.inventoryNumber}</div>
                    </td>
                    <td className="max-w-44 px-4 py-3 wrap-anywhere">{asset.location}</td>
                    <td className="max-w-44 px-4 py-3 wrap-anywhere">{asset.custodian || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatQuantity.format(asset.quantity)} {asset.unit}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${asset.status === 'Активен' ? 'bg-sage text-sage-ink' : 'bg-peach text-clay'}`}>{asset.status}</span>
                    </td>
                    {assetActions && <td className="px-4 py-3">{asset.status !== 'Бракуван' && assetActions(asset)}</td>}
                  </tr>
                ))}
                {!matches.length && <tr><td colSpan={assetActions ? 6 : 5} className="px-4 py-6 text-muted">Няма активи, които отговарят на търсенето.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="Регистърът все още е празен"
            description={onAdd ? "Добавете първия актив. Инвентарният му номер ще го отличава от останалите записи в регистъра." : "В този обхват все още няма активи."}
            actionLabel="Добави първия актив"
            onAction={onAdd}
          />
        )}
      </section>
    </>
  );
}
