import { useEffect, useState } from 'react';

import AppDialogs from './app/AppDialogs.jsx';
import AppShell from './app/AppShell.jsx';
import { readRoute } from './app/navigation.js';
import { useAppActions } from './app/useAppActions.js';
import { useSession } from './app/useSession.js';

import Button, { ActionLink } from './shared/ui/Button.jsx';
import { Alert, Loading } from './shared/ui/Feedback.jsx';
import { roleLabels } from './shared/labels.js';

import { allPages } from './api/client.js';
import { historyApi } from './api/history.js';
import { useApiQuery } from './api/query.js';
import { registersApi } from './api/registers.js';
import { requestsApi } from './api/requests.js';
import { sharingApi } from './api/sharing.js';

import RegisterView from './features/assets/RegisterView.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import HistoryView from './features/history/HistoryView.jsx';
import AcceptInvitation from './features/invitations/AcceptInvitation.jsx';
import InvitedList from './features/invitations/InvitedList.jsx';
import RegisterList from './features/registers/RegisterList.jsx';
import RequestsView from './features/requests/RequestsView.jsx';
import SubregistersView from './features/subregisters/SubregistersView.jsx';

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
      ...entry.subregisters.map(sub => ({
        registerId: entry.id,
        subregisterId: sub.id,
        label: `${entry.name} / ${sub.name}`,
        path: `${entry.id}/${sub.id}`,
      })),
    ]),
    ...invitations.map(sub => ({
      registerId: sub.registerId,
      subregisterId: sub.id,
      label: `${sub.registerName} / ${sub.name} · ${roleLabels[sub.role]}`,
      path: `${sub.registerId}/${sub.id}`,
    })),
  ];
  const historyPath = [registerId, subregisterId].filter(Boolean).join('/');
  const historyScope = scopes.find(entry => entry.path === historyPath) ?? scopes[0];
  const historyQuery = useApiQuery(userId, 'history', historyScope?.path,
    signal => allPages((params, nextSignal) => historyApi.list(historyScope.registerId, params, nextSignal), { subregisterId: historyScope.subregisterId }, signal),
    Boolean(historyScope && section === 'history'));

  const actions = useAppActions({ userId, register, managed, subregister, invitedScope, setDialog, setNotice, setActionError });

  useEffect(() => {
    function updateRoute() {
      setRoute(readRoute());
      setDialog(null);
      setActionError('');
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);

  const pendingCount = incoming.filter(request => request.status === 'pending').length;
  const loading = userId && (ownedQuery.isPending || invitedQuery.isPending);
  const globalError = me.error || ownedQuery.error || invitedQuery.error || requestsQuery.error;

  function participantActions(asset) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setDialog({ type: 'observation', asset })}>Свери</Button>
        <Button variant="secondary" onClick={() => setDialog({ type: 'observation', asset, disposal: true })}>Предложи бракуване</Button>
      </div>
    );
  }

  function renderView() {
    if (section === 'accept') {
      // In #accept/<token>, the route puts the invitation token in the registerId position.
      return <AcceptInvitation token={registerId} onAccept={actions.accept} pending={actions.accepting} error={actionError} />;
    }
    if (loading) return <Loading />;
    if (globalError) return <Alert>{globalError.message}</Alert>;

    if (section === 'subregisters') {
      if (memberQuery.isPending && subregister) return <Loading>Зареждане на участници…</Loading>;
      return (
        <SubregistersView
          owned={owned}
          register={managed}
          subregister={subregister}
          members={memberQuery.data ?? []}
          onCreate={() => setDialog({ type: 'subregister' })}
          onRename={() => setDialog({ type: 'editSubregister' })}
          onScope={() => setDialog({ type: 'scope' })}
          onInvite={() => setDialog({ type: 'invite' })}
          onMemberRole={actions.updateMember}
          onRemoveMember={actions.removeMember}
        />
      );
    }
    if (section === 'invited') {
      if (!invitedScope) return <InvitedList invitations={invitations} />;
      return (
        <RegisterView
          key={invitedScope.id}
          userId={userId}
          registerId={invitedScope.registerId}
          subregisterId={invitedScope.id}
          register={{
            name: invitedScope.name,
            description: `Подрегистър към „${invitedScope.registerName}“`,
            assetCount: invitedScope.assetIds.length,
          }}
          badge={roleLabels[invitedScope.role]}
          onOpen={asset => setDialog({ type: 'details', registerId: invitedScope.registerId, subregisterId: invitedScope.id, assetId: asset.id })}
          extraActions={<ActionLink href={`#history/${invitedScope.registerId}/${invitedScope.id}`}>История</ActionLink>}
          assetActions={invitedScope.role === 'participant' ? participantActions : undefined}
        />
      );
    }
    if (section === 'requests') {
      if (requestsQuery.isPending) return <Loading>Зареждане на заявки…</Loading>;
      return (
        <RequestsView
          incoming={incoming}
          submitted={submitted}
          onDecide={(request, status) => setDialog({ type: 'decision', request, status })}
        />
      );
    }
    if (section === 'history') {
      return (
        <HistoryView
          scopes={scopes}
          selected={historyScope}
          events={historyQuery.data ?? []}
          loading={historyQuery.isPending}
          error={historyQuery.error}
        />
      );
    }
    if (register) {
      return (
        <RegisterView
          key={register.id}
          userId={userId}
          registerId={register.id}
          register={register}
          onAdd={() => setDialog({ type: 'asset' })}
          onOpen={asset => setDialog({ type: 'details', registerId: register.id, assetId: asset.id, canManage: true })}
          extraActions={<>
            <ActionLink href={`#subregisters/${register.id}`}>Подрегистри</ActionLink>
            <Button variant="secondary" onClick={() => setDialog({ type: 'editRegister' })}>Редактирай регистъра</Button>
          </>}
        />
      );
    }
    if (registerId) {
      return (
        <div className="card mx-auto max-w-xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Регистърът не е достъпен за този профил</h1>
          <ActionLink href="#" className="mt-5">Към работните регистри</ActionLink>
        </div>
      );
    }
    return <RegisterList registers={owned} onCreate={() => setDialog({ type: 'register' })} />;
  }

  if (me.isPending) return <main className="grid min-h-dvh place-items-center"><Loading>Зареждане на профила…</Loading></main>;
  if (me.error) return <LoginPage onLogin={login} onSignUp={signUp} invited={section === 'accept'} initialError={me.error} />;

  return (
    <>
      <AppShell
        section={section}
        pendingCount={pendingCount}
        userName={me.data?.user.name}
        onLogout={logout}
        onNavigate={() => setNotice('')}
        onCreate={() => setDialog({ type: 'register' })}
        error={actionError || (globalError && !loading ? globalError.message : '')}
        notice={notice}
      >
        {renderView()}
      </AppShell>
      <AppDialogs
        dialog={dialog}
        setDialog={setDialog}
        userId={userId}
        register={register}
        managed={managed}
        subregister={subregister}
        invitedScope={invitedScope}
        actions={actions}
      />
    </>
  );
}
