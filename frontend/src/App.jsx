import Button, { ActionLink } from './shared/ui/Button.jsx';
import { useEffect, useState } from 'react';
import AppShell from './app/AppShell.jsx';
import { navigateTo, readRoute, registerHref } from './app/navigation.js';
import AssetDetails from './features/assets/AssetDetails.jsx';
import AssetDialog from './features/assets/AssetDialog.jsx';
import RegisterView from './features/assets/RegisterView.jsx';
import HistoryView from './features/history/HistoryView.jsx';
import InvitedList from './features/invitations/InvitedList.jsx';
import RegisterDialog from './features/registers/RegisterDialog.jsx';
import RegisterList from './features/registers/RegisterList.jsx';
import { DecisionDialog, ObservationDialog } from './features/requests/RequestDialogs.jsx';
import RequestsView from './features/requests/RequestsView.jsx';
import { InviteDialog, ScopeDialog, SubregisterDialog } from './features/subregisters/SubregisterDialogs.jsx';
import SubregistersView from './features/subregisters/SubregistersView.jsx';
import {
  addAsset, assignAssets, createRegister, createSubregister, decideRequest, inviteProfile, profiles,
  readRegisters, requestLabels, roleLabels, storageKey, submitObservation, subregisterRole, visibleHistory,
} from './registryStore.js';

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
    navigateTo(section === 'register' ? '' : section);
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
    navigateTo(registerHref(result.register.id));
  }

  async function saveSubregister(values) {
    const registers = await createSubregister(managed.id, profileId, values);
    const saved = registers.find(entry => entry.id === managed.id).subregisters.at(-1);
    finish(registers, 'Подрегистърът е създаден.');
    navigateTo(`subregisters/${managed.id}/${saved.id}`);
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
          extraActions={<ActionLink href={`#history/${source.id}/${shared.id}`}>История</ActionLink>}
          assetActions={role === 'participant' ? asset => (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => openDialog('observation', { asset })}>Свери</Button>
              <Button type="button" variant="secondary" onClick={() => openDialog('observation', { asset, disposal: true })}>Предложи бракуване</Button>
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
            extraActions={<ActionLink href={`#subregisters/${register.id}`}>Подрегистри</ActionLink>} />;
        }
        if (registerId) {
          return <div className="min-w-0 rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] p-5 sm:p-6 shadow-[0_2px_8px_rgb(24_32_48/0.03)] dark:shadow-none space-y-4">
            <h1 className="text-2xl font-semibold">Регистърът не е достъпен за този профил</h1>
            <ActionLink href="#">Към работните регистри</ActionLink>
          </div>;
        }
        return <RegisterList registers={owned} onCreate={() => openDialog('register')} registerHref={registerHref} />;
    }
  }

  return (
    <>
      <AppShell section={section} pendingCount={pendingCount} profileId={profileId}
        onSwitchProfile={switchProfile} onNavigate={() => setNotice('')} onCreate={() => openDialog('register')}
        error={data.error} notice={notice}>
        {renderView()}
      </AppShell>

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
    </>
  );
}
