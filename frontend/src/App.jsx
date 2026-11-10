import { useEffect, useState } from 'react';

import Button, { ActionLink } from './shared/ui/Button.jsx';
import { roleLabels } from './shared/labels.js';

import AppDialogs from './app/AppDialogs.jsx';
import AppShell from './app/AppShell.jsx';
import { readRoute, registerHref } from './app/navigation.js';
import { useAppActions } from './app/useAppActions.js';
import { useSession } from './app/useSession.js';

import { allPages } from './api/client.js';
import { registersApi } from './api/registers.js';
import { sharingApi } from './api/sharing.js';
import { requestsApi } from './api/requests.js';
import { historyApi } from './api/history.js';
import { useApiQuery } from './api/query.js';

import LoginPage from './features/auth/LoginPage.jsx';
import RegisterView from './features/assets/RegisterView.jsx';
import HistoryView from './features/history/HistoryView.jsx';
import InvitedList from './features/invitations/InvitedList.jsx';
import RegisterList from './features/registers/RegisterList.jsx';
import RequestsView from './features/requests/RequestsView.jsx';
import SubregistersView from './features/subregisters/SubregistersView.jsx';

function AcceptInvitation({ token, onAccept, pending, error }) {
  return <div className="rounded-2xl border border-[#dcdde3] bg-white p-6 dark:border-[#3b3d46] dark:bg-[#232429]">
    <h1 className="text-2xl font-semibold">Покана за подрегистър</h1>
    <p className="mt-2 text-sm text-[#62646c] dark:text-[#b0b2be]">Приемете поканата с профила, с който сте влезли. Ролята и обхватът се определят от връзката.</p>
    {error && <p role="alert" className="mt-3 text-sm text-[#b32830] dark:text-[#ffb1b8]">{error}</p>}
    <div className="mt-5"><Button type="button" disabled={pending} onClick={() => onAccept(token)}>{pending ? 'Приемане…' : 'Приеми поканата'}</Button></div>
  </div>;
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const { section, registerId, subregisterId } = route;

  const { me, login, signUp, logout } = useSession({
    onChange() { setDialog(null); setNotice(''); setActionError(''); },
    onError(error) { setActionError(error.message); },
  });
  const userId = me.data?.user.id;

  const ownedQuery = useApiQuery(userId, 'registers', {}, signal => allPages(registersApi.list, {}, signal));
  const invitedQuery = useApiQuery(userId, 'invited-scopes', {}, signal => allPages(sharingApi.invited, {}, signal));
  const owned = ownedQuery.data ?? [];
  const invitations = invitedQuery.data ?? [];
  const register = owned.find(entry => entry.id === registerId);

  // The subregisters page needs a selected register, so it opens the first one when the hash names none.
  const managed = register ?? owned[0];
  const managedSubs = managed?.subregisters ?? [];
  const subregister = managedSubs.find(entry => entry.id === subregisterId) ?? managedSubs[0];
  const invitedScope = invitations.find(entry => entry.registerId === registerId && entry.id === subregisterId);
  const memberQuery = useApiQuery(userId, 'members', subregister?.id,
    signal => allPages((params, nextSignal) => sharingApi.members(managed.id, subregister.id, params, nextSignal), {}, signal),
    Boolean(subregister && section === 'subregisters'));
  const requestsQuery = useApiQuery(userId, 'requests', {}, signal => allPages(requestsApi.list, {}, signal));
  const requests = requestsQuery.data ?? [];

  // GET /requests returns both the requests for registers that this user owns and the requests that this user submitted.
  const incoming = requests.filter(request => owned.some(entry => entry.id === request.registerId));
  const submitted = requests.filter(request => request.requester.id === userId);
  const scopes = [
    ...owned.flatMap(entry => [
      { registerId: entry.id, label: entry.name, path: entry.id },
      ...entry.subregisters.map(sub => ({ registerId: entry.id, subregisterId: sub.id, label: `${entry.name} / ${sub.name}`, path: `${entry.id}/${sub.id}` })),
    ]),
    ...invitations.map(sub => ({ registerId: sub.registerId, subregisterId: sub.id, label: `${sub.registerName} / ${sub.name} · ${roleLabels[sub.role]}`, path: `${sub.registerId}/${sub.id}` })),
  ];
  const historyScope = scopes.find(entry => entry.path === [registerId, subregisterId].filter(Boolean).join('/')) ?? scopes[0];
  const historyQuery = useApiQuery(userId, 'history', historyScope?.path,
    signal => allPages((params, nextSignal) => historyApi.list(historyScope.registerId, params, nextSignal), { subregisterId: historyScope.subregisterId }, signal),
    Boolean(historyScope && section === 'history'));

  const actions = useAppActions({ userId, register, managed, subregister, invitedScope, setDialog, setNotice, setActionError });

  useEffect(() => {
    function updateRoute() { setRoute(readRoute()); setDialog(null); setActionError(''); window.scrollTo(0, 0); }
    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);

  const pendingCount = incoming.filter(request => request.status === 'pending').length;
  const loading = userId && (ownedQuery.isPending || invitedQuery.isPending);
  const globalError = me.error || ownedQuery.error || invitedQuery.error || requestsQuery.error;

  function renderView() {
    // In #accept/<token>, the route puts the invitation token in the registerId position.
    if (section === 'accept') return <AcceptInvitation token={registerId} onAccept={actions.accept} pending={actions.accepting} error={actionError} />;
    if (loading) return <p role="status">Зареждане…</p>;
    if (globalError) return <p role="alert">{globalError.message}</p>;
    if (section === 'subregisters' && memberQuery.isPending && subregister) return <p role="status">Зареждане на участници…</p>;
    if (section === 'subregisters') return <SubregistersView owned={owned} register={managed ?? null}
      subregister={subregister} members={memberQuery.data ?? []} onCreate={() => setDialog({ type: 'subregister' })}
      onRename={() => setDialog({ type: 'editSubregister' })} onScope={() => setDialog({ type: 'scope' })} onInvite={() => setDialog({ type: 'invite' })}
      onMemberRole={actions.updateMember} onRemoveMember={actions.removeMember} />;
    if (section === 'invited') {
      if (!invitedScope) return <InvitedList invitations={invitations} />;
      return <RegisterView key={invitedScope.id} userId={userId} registerId={invitedScope.registerId} subregisterId={invitedScope.id}
        register={{ name: invitedScope.name, description: `Подрегистър към „${invitedScope.registerName}“`, assetCount: invitedScope.assetIds.length }}
        kicker={roleLabels[invitedScope.role]}
        onOpen={asset => setDialog({ type: 'details', registerId: invitedScope.registerId, subregisterId: invitedScope.id, assetId: asset.id })}
        extraActions={<ActionLink href={`#history/${invitedScope.registerId}/${invitedScope.id}`}>История</ActionLink>}
        assetActions={invitedScope.role === 'participant' ? asset => <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setDialog({ type: 'observation', asset })}>Свери</Button>
          <Button type="button" variant="secondary" onClick={() => setDialog({ type: 'observation', asset, disposal: true })}>Предложи бракуване</Button>
        </div> : undefined} />;
    }
    if (section === 'requests' && requestsQuery.isPending) return <p role="status">Зареждане на заявки…</p>;
    if (section === 'requests') return <RequestsView incoming={incoming} submitted={submitted}
      onDecide={(request, status) => setDialog({ type: 'decision', request, status })} />;
    if (section === 'history') return <HistoryView scopes={scopes} selected={historyScope} events={historyQuery.data ?? []} loading={historyQuery.isPending} error={historyQuery.error} />;
    if (register) return <RegisterView key={register.id} userId={userId} registerId={register.id} register={register}
      onAdd={() => setDialog({ type: 'asset' })}
      onOpen={asset => setDialog({ type: 'details', registerId: register.id, assetId: asset.id, canManage: true })}
      extraActions={<><ActionLink href={`#subregisters/${register.id}`}>Подрегистри</ActionLink><Button type="button" variant="secondary" onClick={() => setDialog({ type: 'editRegister' })}>Редактирай регистъра</Button></>} />;
    if (registerId) return <div className="rounded-2xl border border-[#dcdde3] bg-white p-6 dark:border-[#3b3d46] dark:bg-[#232429]">
      <h1 className="text-2xl font-semibold">Регистърът не е достъпен за този профил</h1><ActionLink href="#">Към работните регистри</ActionLink></div>;
    return <RegisterList registers={owned} onCreate={() => setDialog({ type: 'register' })} registerHref={registerHref} />;
  }

  if (me.isPending) return <main role="status" className="grid min-h-dvh place-items-center">Зареждане на профила…</main>;
  if (me.error) return <LoginPage onLogin={login} onSignUp={signUp} invited={section === 'accept'} initialError={me.error} />;

  return <>
    <AppShell section={section} pendingCount={pendingCount} userName={me.data?.user.name} onLogout={logout} onNavigate={() => setNotice('')} onCreate={() => setDialog({ type: 'register' })}
      error={actionError || (globalError && !loading ? globalError.message : '')} notice={notice}>{renderView()}</AppShell>
    <AppDialogs dialog={dialog} setDialog={setDialog} userId={userId} register={register} managed={managed}
      subregister={subregister} invitedScope={invitedScope} actions={actions} />
  </>;
}
