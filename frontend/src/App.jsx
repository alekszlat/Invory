import { Box, ClipboardList, FolderTree, History, Inbox, LayoutGrid, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AssetDetails, AssetDialog, DecisionDialog, InviteDialog, ObservationDialog, RegisterDialog, ScopeDialog, SubregisterDialog,
} from './components/RegistryDialogs.jsx';
import { RegisterList, RegisterView } from './components/RegistryViews.jsx';
import { HistoryView, InvitedList, RequestsView, SubregistersView } from './components/WorkflowViews.jsx';
import {
  addAsset, assignAssets, createRegister, createSubregister, decideRequest, inviteProfile, profiles,
  readRegisters, requestLabels, roleLabels, storageKey, submitObservation, subregisterRole, visibleHistory,
} from './registryStore.js';

const navigation = [
  { id: 'register', label: 'Работни регистри', icon: LayoutGrid },
  { id: 'subregisters', label: 'Подрегистри', icon: FolderTree },
  { id: 'invited', label: 'Поканени регистри', icon: Inbox },
  { id: 'requests', label: 'Заявки', icon: ClipboardList },
  { id: 'history', label: 'История', icon: History },
];
const registerHref = id => `#register/${id}`;

function readRoute() {
  const [section, registerId, subregisterId] = window.location.hash.slice(1).split('/');
  return { section: navigation.some(page => page.id === section) ? section : 'register', registerId, subregisterId };
}

function readInitialState() {
  try {
    return { registers: readRegisters(), error: '' };
  } catch {
    return { registers: [], error: 'Запазените регистри не могат да се прочетат в този браузър.' };
  }
}

function initialProfile() {
  try {
    const id = sessionStorage.getItem('invory.demo.profile');
    if (profiles.some(profile => profile.id === id)) return id;
  } catch {
    // The profile selector also works without session storage.
  }
  return profiles[0].id;
}

export default function App() {
  const [data, setData] = useState(readInitialState);
  const [route, setRoute] = useState(readRoute);
  const [profileId, setProfileId] = useState(initialProfile);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const { section, registerId, subregisterId } = route;
  const owned = data.registers.filter(entry => entry.ownerId === profileId);
  const register = owned.find(entry => entry.id === registerId);
  const managed = register ?? owned[0];
  const subregister = managed?.subregisters.find(entry => entry.id === subregisterId) ?? managed?.subregisters[0];
  const invitations = data.registers.filter(entry => entry.ownerId !== profileId).flatMap(entry =>
    entry.subregisters.flatMap(sub => {
      const role = subregisterRole(entry, sub, profileId);
      return role ? [{ register: entry, subregister: sub, role }] : [];
    }),
  );
  const invitation = invitations.find(entry => entry.register.id === registerId && entry.subregister.id === subregisterId);
  const detailsId = dialog?.type === 'details' ? dialog.asset.id : undefined;
  const detailsAsset = register?.assets.find(asset => asset.id === detailsId)
    ?? (invitation?.subregister.assetIds.includes(detailsId)
      ? invitation.register.assets.find(asset => asset.id === detailsId) : undefined);
  const incoming = owned.flatMap(entry => entry.requests.map(request => ({ register: entry, request })));
  const submitted = invitations.filter(entry => entry.role === 'participant').flatMap(({ register, subregister: sub }) =>
    register.requests
      .filter(request => request.requesterId === profileId && request.subregisterId === sub.id && sub.assetIds.includes(request.assetId))
      .map(request => ({ register, request })),
  );
  const scopes = [
    ...owned.flatMap(entry => [
      { register: entry, path: entry.id, label: entry.name },
      ...entry.subregisters.map(sub => ({ register: entry, subregister: sub, path: `${entry.id}/${sub.id}`, label: `${entry.name} / ${sub.name}` })),
    ]),
    ...invitations.map(entry => ({
      ...entry,
      path: `${entry.register.id}/${entry.subregister.id}`,
      label: `${entry.register.name} / ${entry.subregister.name} · ${roleLabels[entry.role]}`,
    })),
  ];
  const historyScope = scopes.find(entry => entry.path === [registerId, subregisterId].filter(Boolean).join('/')) ?? scopes[0];
  const pendingCount = incoming.filter(({ request }) => request.status === 'pending').length;

  useEffect(() => {
    function updateRoute() {
      setRoute(readRoute());
      setDialog(null);
      window.scrollTo(0, 0);
    }
    function syncRegisters(event) {
      if (event.key === storageKey || event.key === null) setData(readInitialState());
    }
    window.addEventListener('hashchange', updateRoute);
    window.addEventListener('storage', syncRegisters);
    return () => {
      window.removeEventListener('hashchange', updateRoute);
      window.removeEventListener('storage', syncRegisters);
    };
  }, []);

  function switchProfile(next) {
    setProfileId(next);
    setDialog(null);
    setNotice('');
    window.location.hash = section === 'register' ? '' : section;
    try {
      sessionStorage.setItem('invory.demo.profile', next);
    } catch {
      // The active profile remains available in the current view.
    }
  }

  function finish(registers, message) {
    setData({ registers, error: '' });
    setDialog(null);
    setNotice(message);
  }

  async function saveRegister(values) {
    const result = await createRegister(values, profileId);
    finish(result.registers, 'Регистърът е създаден.');
    window.location.hash = registerHref(result.register.id);
  }

  async function saveSubregister(values) {
    const registers = await createSubregister(managed.id, profileId, values);
    const saved = registers.find(entry => entry.id === managed.id).subregisters.at(-1);
    finish(registers, 'Подрегистърът е създаден.');
    window.location.hash = `subregisters/${managed.id}/${saved.id}`;
  }

  function openDialog(type, options = {}) {
    setNotice('');
    setDialog({ type, ...options });
  }

  const close = () => setDialog(null);
  const openAsset = asset => openDialog('details', { asset });

  function renderView() {
    switch (section) {
      case 'subregisters':
        return <SubregistersView owned={owned} register={managed} subregister={subregister}
          onCreate={() => openDialog('subregister')} onScope={() => openDialog('scope', { originalIds: subregister.assetIds })}
          onInvite={() => openDialog('invite')} />;
      case 'invited': {
        if (!invitation) return <InvitedList invitations={invitations} />;
        const { register: source, subregister: shared, role } = invitation;
        const assets = source.assets.filter(asset => shared.assetIds.includes(asset.id));
        return <RegisterView key={shared.id}
          register={{ name: shared.name, description: `Подрегистър към „${source.name}“`, assets }}
          kicker={roleLabels[role]} onOpen={openAsset}
          extraActions={<a className="button-secondary" href={`#history/${source.id}/${shared.id}`}>История</a>}
          assetActions={role === 'participant' ? asset => (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="button-secondary min-h-9" onClick={() => openDialog('observation', { asset })}>Свери</button>
              <button type="button" className="button-secondary min-h-9" onClick={() => openDialog('observation', { asset, disposal: true })}>Предложи бракуване</button>
            </div>
          ) : undefined} />;
      }
      case 'requests':
        return <RequestsView incoming={incoming} submitted={submitted}
          onDecide={(id, request, decision) => openDialog('decision', { id, request, decision })} />;
      case 'history':
        return <HistoryView scopes={scopes} selected={historyScope}
          events={historyScope ? visibleHistory(historyScope.register, historyScope.subregister, profileId) : []} />;
      default:
        if (register) {
          return <RegisterView key={register.id} register={register} onAdd={() => openDialog('asset')} onOpen={openAsset}
            extraActions={<a className="button-secondary" href={`#subregisters/${register.id}`}>Подрегистри</a>} />;
        }
        if (registerId) {
          return <div className="space-y-4 rounded-2xl border border-line bg-white p-6">
            <h1 className="text-2xl font-bold">Регистърът не е достъпен за този профил</h1>
            <a href="#" className="button-secondary">Към работните регистри</a>
          </div>;
        }
        return <RegisterList registers={owned} onCreate={() => openDialog('register')} registerHref={registerHref} />;
    }
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-5 bg-sidebar px-4 py-4 text-white sm:px-6 md:sticky md:top-0 md:h-dvh md:gap-8 md:px-5 md:py-7">
        <a href="#" className="flex w-fit items-center gap-3 text-2xl font-bold tracking-tight">
          <span className="grid size-10 -rotate-4 place-items-center rounded-xl bg-[#d76d47]">
            <Box size={23} strokeWidth={1.7} className="rotate-4" aria-hidden="true" />
          </span>
          invory
        </a>
        <nav className="flex flex-wrap gap-2 md:grid" aria-label="Основна навигация">
          {navigation.map(({ id, label, icon: Icon }) => (
            <a key={id} href={id === 'register' ? '#' : `#${id}`} onClick={() => setNotice('')}
              aria-current={section === id ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#334641] ${section === id ? 'bg-[#374c43] text-[#ffe0d0]' : 'text-[#d5e1da]'}`}>
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              {label}
              {id === 'requests' && pendingCount > 0 && <span className="ml-auto rounded bg-[#d76d47] px-1.5 text-xs text-sidebar">{pendingCount}</span>}
            </a>
          ))}
        </nav>
        <button type="button" onClick={() => openDialog('register')} className="hidden min-h-11 items-center gap-2.5 rounded-lg border border-sidebar-line px-3 py-2 text-left text-sm font-semibold text-[#ecf1ec] hover:bg-[#334641] md:mt-auto md:flex">
          <Plus size={18} aria-hidden="true" />
          Нов регистър
        </button>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-8">
            <p className="text-sm font-semibold text-muted">{navigation.find(page => page.id === section).label}</p>
            <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              Демо профил
              <select className="field-control w-auto" value={profileId} onChange={event => switchProfile(event.target.value)}>
                {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
            </label>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          {data.error && <p role="alert" className="mb-4 rounded-lg border border-line bg-white p-3 text-sm">{data.error}</p>}
          {notice && <p role="status" className="mb-4 rounded-lg border border-line bg-sage px-4 py-3 text-sm font-medium text-sage-ink">{notice}</p>}
          {renderView()}
        </main>
      </div>

      {dialog?.type === 'register' && <RegisterDialog onClose={close} onSave={saveRegister} />}
      {dialog?.type === 'asset' && register && <AssetDialog registerName={register.name} onClose={close}
        onSave={async values => finish(await addAsset(register.id, values, profileId), 'Активът е добавен в регистъра.')} />}
      {detailsAsset && <AssetDetails asset={detailsAsset} onClose={close} />}
      {dialog?.type === 'subregister' && managed && <SubregisterDialog onClose={close} onSave={saveSubregister} />}
      {dialog?.type === 'scope' && subregister && <ScopeDialog register={managed} subregister={subregister} onClose={close}
        onSave={async values => finish(await assignAssets(managed.id, subregister.id, profileId, values.assetIds, dialog.originalIds), 'Обхватът на подрегистъра е запазен.')} />}
      {dialog?.type === 'invite' && subregister && <InviteDialog profileId={profileId} subregister={subregister} onClose={close}
        onSave={async values => finish(await inviteProfile(managed.id, subregister.id, profileId, values), 'Достъпът е запазен.')} />}
      {dialog?.type === 'observation' && invitation?.role === 'participant' && <ObservationDialog asset={dialog.asset} disposal={dialog.disposal} onClose={close}
        onSave={async values => finish(
          await submitObservation(invitation.register.id, invitation.subregister.id, dialog.asset.id, profileId, values, dialog.asset),
          values.kind === 'present' ? 'Проверката е записана в историята.' : 'Заявката е изпратена до администратора.',
        )} />}
      {dialog?.type === 'decision' && <DecisionDialog approve={dialog.decision === 'approved'} description={requestLabels[dialog.request.kind]} onClose={close}
        onSave={async values => finish(
          await decideRequest(dialog.id, dialog.request.id, profileId, dialog.decision, values.reason),
          'Решението е записано.',
        )} />}
    </div>
  );
}
