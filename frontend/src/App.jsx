import { useEffect, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import Button, { ActionLink } from './shared/ui/Button.jsx';
import AppShell from './app/AppShell.jsx';
import { navigateTo, readRoute, registerHref } from './app/navigation.js';
import { allPages, configureSessionExpired } from './api/client.js';
import { authApi } from './api/auth.js';
import { registersApi } from './api/registers.js';
import { assetsApi } from './api/assets.js';
import { subregistersApi } from './api/subregisters.js';
import { sharingApi } from './api/sharing.js';
import { requestsApi } from './api/requests.js';
import { historyApi } from './api/history.js';
import { clearPrivateCache, queryClient, useApiQuery } from './api/query.js';
import { requestLabels, roleLabels } from './shared/labels.js';
import AssetDetails from './features/assets/AssetDetails.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
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

function AcceptInvitation({ token, onAccept, pending, error }) {
  return <div className="rounded-2xl border border-[#dcdde3] bg-white p-6 dark:border-[#3b3d46] dark:bg-[#232429]">
    <h1 className="text-2xl font-semibold">Покана за подрегистър</h1>
    <p className="mt-2 text-sm text-[#62646c] dark:text-[#b0b2be]">Приемете поканата с избрания профил. Ролята и обхватът се определят от връзката.</p>
    {error && <p role="alert" className="mt-3 text-sm text-[#b32830] dark:text-[#ffb1b8]">{error}</p>}
    <div className="mt-5"><Button type="button" disabled={pending} onClick={() => onAccept(token)}>{pending ? 'Приемане…' : 'Приеми поканата'}</Button></div>
  </div>;
}

export default function App({ demo }) {
  const [sessionKey, setSessionKey] = useState('initial');
  const [route, setRoute] = useState(readRoute);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const { section, registerId, subregisterId } = route;
  const me = useQuery({ queryKey: ['auth', sessionKey], queryFn: authApi.refresh, retry: false });
  const userId = me.data?.user.id;
  const ownedQuery = useApiQuery(userId, 'registers', {}, signal => allPages(registersApi.list, {}, signal));
  const invitedQuery = useApiQuery(userId, 'invited-scopes', {}, signal => allPages(sharingApi.invited, {}, signal));
  const owned = ownedQuery.data ?? [];
  const invitations = invitedQuery.data ?? [];
  const register = owned.find(entry => entry.id === registerId);
  const managed = register ?? owned[0];
  const subQueries = useQueries({ queries: owned.map(entry => ({
    queryKey: ['user', userId, 'subregisters', entry.id],
    queryFn: ({ signal }) => allPages((params, nextSignal) => subregistersApi.list(entry.id, params, nextSignal), {}, signal),
    staleTime: 15_000, retry: false,
  })) });
  const managedIndex = owned.findIndex(entry => entry.id === managed?.id);
  const managedSubs = subQueries[managedIndex]?.data ?? [];
  const subregister = managedSubs.find(entry => entry.id === subregisterId) ?? managedSubs[0];
  const invitedScope = invitations.find(entry => entry.registerId === registerId && entry.id === subregisterId);
  const memberQuery = useApiQuery(userId, 'members', subregister?.id,
    signal => allPages((params, nextSignal) => sharingApi.members(managed.id, subregister.id, params, nextSignal), {}, signal),
    Boolean(subregister && section === 'subregisters'));
  const scopeAssets = useApiQuery(userId, 'scope-assets', managed?.id,
    signal => allPages((params, nextSignal) => assetsApi.list(managed.id, params, nextSignal), { includeArchived: true }, signal),
    Boolean(managed && dialog?.type === 'scope'));
  const incomingQuery = useApiQuery(userId, 'requests', { view: 'incoming' }, signal => allPages(requestsApi.list, { view: 'incoming' }, signal));
  const submittedQuery = useApiQuery(userId, 'requests', { view: 'submitted' }, signal => allPages(requestsApi.list, { view: 'submitted' }, signal));
  const scopes = [
    ...owned.flatMap((entry, index) => [
      { registerId: entry.id, label: entry.name, path: entry.id },
      ...(subQueries[index]?.data ?? []).map(sub => ({ registerId: entry.id, subregisterId: sub.id, label: `${entry.name} / ${sub.name}`, path: `${entry.id}/${sub.id}` })),
    ]),
    ...invitations.map(sub => ({ registerId: sub.registerId, subregisterId: sub.id, label: `${sub.registerName} / ${sub.name} · ${roleLabels[sub.role]}`, path: `${sub.registerId}/${sub.id}` })),
  ];
  const historyScope = scopes.find(entry => entry.path === [registerId, subregisterId].filter(Boolean).join('/')) ?? scopes[0];
  const historyQuery = useApiQuery(userId, 'history', historyScope?.path,
    signal => allPages((params, nextSignal) => historyApi.list(historyScope.registerId, params, nextSignal), { subregisterId: historyScope.subregisterId }, signal),
    Boolean(historyScope && section === 'history'));
  const detail = ['details', 'editAsset'].includes(dialog?.type) ? dialog : null;
  const detailsQuery = useApiQuery(userId, 'asset-detail', { registerId: detail?.registerId, subregisterId: detail?.subregisterId, assetId: detail?.assetId },
    signal => assetsApi.get(detail.registerId, detail.assetId, { subregisterId: detail.subregisterId }, signal), Boolean(detail));

  useEffect(() => {
    function updateRoute() { setRoute(readRoute()); setDialog(null); setActionError(''); window.scrollTo(0, 0); }
    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);

  useEffect(() => {
    configureSessionExpired(() => { void clearPrivateCache().then(() => setSessionKey(crypto.randomUUID())); });
    return () => configureSessionExpired(() => {});
  }, []);

  async function login(values) {
    const session = await authApi.login(values);
    await clearPrivateCache();
    const nextKey = crypto.randomUUID();
    queryClient.setQueryData(['auth', nextKey], session);
    setSessionKey(nextKey);
    setDialog(null); setNotice(''); setActionError('');
  }
  async function logout() {
    try {
      await authApi.logout();
      await clearPrivateCache();
      setSessionKey(crypto.randomUUID());
      setDialog(null); setNotice(''); setActionError('');
      navigateTo('');
    } catch (error) { setActionError(error.message); }
  }

  async function switchProfile(next) {
    try {
      const profile = demo.users.find(user => user.id === next);
      const session = await authApi.login({ email: profile.email, password: 'demo' });
      await clearPrivateCache();
      const nextKey = crypto.randomUUID();
      queryClient.setQueryData(['auth', nextKey], session);
      setSessionKey(nextKey);
      setDialog(null); setNotice(''); setActionError('');
      if (section !== 'accept') navigateTo(section === 'register' ? '' : section);
    } catch (error) { setActionError(error.message); }
  }
  async function resetData() {
    demo.reset(); await clearPrivateCache(); setSessionKey(crypto.randomUUID());
    setDialog(null); setNotice('Демо данните са нулирани.'); setActionError(''); navigateTo('');
  }
  function refreshed(message) {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
    setDialog(null); setNotice(message); setActionError('');
  }
  async function action(callback, message) {
    setActionError('');
    try { const result = await callback(); refreshed(message); return result; }
    catch (error) { setActionError(error.message); throw error; }
  }
  async function accept(token) {
    setAccepting(true); setActionError('');
    try { const scope = await sharingApi.accept(token); refreshed('Поканата е приета.'); navigateTo(`invited/${scope.registerId}/${scope.id}`); }
    catch (error) { setActionError(error.message); }
    finally { setAccepting(false); }
  }
  async function saveRegister(values) {
    const saved = await action(() => registersApi.create({ name: values.name, description: values.description }), 'Регистърът е създаден.');
    navigateTo(registerHref(saved.id));
  }
  async function updateRegister(values) {
    await action(() => registersApi.update(register.id, { name: values.name, description: values.description }), 'Регистърът е обновен.');
  }
  async function saveAsset(values, existing) {
    const body = { ...values, quantity: Number(values.quantity), acquiredOn: values.acquiredOn || null };
    delete body.assetIds;
    if (existing) await action(() => assetsApi.update(register.id, existing.id, { ...body, expectedVersion: existing.version }), 'Активът е обновен.');
    else await action(() => assetsApi.create(register.id, body), 'Активът е добавен в регистъра.');
  }
  async function saveSubregister(values) {
    const saved = await action(() => subregistersApi.create(managed.id, { name: values.name }), 'Подрегистърът е създаден.');
    navigateTo(`subregisters/${managed.id}/${saved.id}`);
  }
  async function renameSubregister(values) {
    await action(() => subregistersApi.update(managed.id, subregister.id, { name: values.name, expectedVersion: subregister.version }), 'Подрегистърът е преименуван.');
  }
  async function saveScope(values) {
    await action(() => subregistersApi.update(managed.id, subregister.id, { assetIds: values.assetIds, expectedVersion: subregister.version }), 'Обхватът на подрегистъра е запазен.');
  }
  async function observe(values) {
    const body = { subregisterId: invitedScope.id, assetId: dialog.asset.id, assetVersion: dialog.asset.version, kind: values.kind, note: values.note ?? '', location: values.location ?? '' };
    await action(() => requestsApi.create(invitedScope.registerId, body), values.kind === 'present' ? 'Проверката е записана в историята.' : 'Заявката е изпратена до администратора.');
  }
  async function updateMember(id, role) {
    try { await action(() => sharingApi.updateMember(managed.id, subregister.id, id, { role }), 'Ролята е обновена.'); } catch { /* The current view shows the error. */ }
  }
  async function removeMember(id) {
    try { await action(() => sharingApi.removeMember(managed.id, subregister.id, id), 'Достъпът е премахнат.'); } catch { /* The current view shows the error. */ }
  }
  const pendingCount = (incomingQuery.data ?? []).filter(request => request.status === 'pending').length;
  const loading = userId && (ownedQuery.isPending || invitedQuery.isPending);
  const globalError = me.error || ownedQuery.error || invitedQuery.error || subQueries.find(query => query.error)?.error || incomingQuery.error || submittedQuery.error;

  function renderView() {
    if (section === 'accept') return <AcceptInvitation token={registerId} onAccept={accept} pending={accepting} error={actionError} />;
    if (loading) return <p role="status">Зареждане…</p>;
    if (globalError) return <p role="alert">{globalError.message}</p>;
    if ((section === 'subregisters' || section === 'history') && subQueries.some(query => query.isPending)) return <p role="status">Зареждане на подрегистри…</p>;
    if (section === 'subregisters' && memberQuery.isPending && subregister) return <p role="status">Зареждане на участници…</p>;
    if (section === 'subregisters') return <SubregistersView owned={owned} register={managed ? { ...managed, subregisters: managedSubs } : null}
      subregister={subregister} members={memberQuery.data ?? []} onCreate={() => setDialog({ type: 'subregister' })}
      onRename={() => setDialog({ type: 'editSubregister' })} onScope={() => setDialog({ type: 'scope' })} onInvite={() => setDialog({ type: 'invite' })}
      onMemberRole={updateMember} onRemoveMember={removeMember} />;
    if (section === 'invited') {
      if (!invitedScope) return <InvitedList invitations={invitations} />;
      return <RegisterView key={invitedScope.id} userId={userId} registerId={invitedScope.registerId} subregisterId={invitedScope.id}
        register={{ name: invitedScope.name, description: `Подрегистър към „${invitedScope.registerName}“`, assetCount: invitedScope.assetIds.length }}
        kicker={roleLabels[invitedScope.role]}
        onOpen={asset => setDialog({ type: 'details', registerId: invitedScope.registerId, subregisterId: invitedScope.id, assetId: asset.id })}
        extraActions={<ActionLink href={`#history/${invitedScope.registerId}/${invitedScope.id}`}>История</ActionLink>}
        assetActions={invitedScope.permissions.includes('check') ? asset => <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setDialog({ type: 'observation', asset })}>Свери</Button>
          <Button type="button" variant="secondary" onClick={() => setDialog({ type: 'observation', asset, disposal: true })}>Предложи бракуване</Button>
        </div> : undefined} />;
    }
    if (section === 'requests' && (incomingQuery.isPending || submittedQuery.isPending)) return <p role="status">Зареждане на заявки…</p>;
    if (section === 'requests') return <RequestsView incoming={incomingQuery.data ?? []} submitted={submittedQuery.data ?? []}
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
  if (me.error) return <LoginPage demoUsers={demo?.users} onLogin={login} initialError={me.error} />;

  return <>
    <AppShell section={section} pendingCount={pendingCount} profileId={demo ? demo.currentUserId() : me.data?.user.name} demoUsers={demo?.users}
      onSwitchProfile={switchProfile} onReset={resetData} onLogout={logout} onNavigate={() => setNotice('')} onCreate={() => setDialog({ type: 'register' })}
      error={actionError || (globalError && !loading ? globalError.message : '')} notice={notice}>{renderView()}</AppShell>
    {dialog?.type === 'register' && <RegisterDialog onClose={() => setDialog(null)} onSave={saveRegister} />}
    {dialog?.type === 'editRegister' && register && <RegisterDialog register={register} onClose={() => setDialog(null)} onSave={updateRegister} />}
    {dialog?.type === 'asset' && register && <AssetDialog registerName={register.name} onClose={() => setDialog(null)} onSave={values => saveAsset(values)} />}
    {dialog?.type === 'editAsset' && register && detailsQuery.data && <AssetDialog registerName={register.name} asset={detailsQuery.data} onClose={() => setDialog(null)} onSave={values => saveAsset(values, detailsQuery.data)} />}
    {dialog?.type === 'details' && detailsQuery.data && <AssetDetails asset={detailsQuery.data} onClose={() => setDialog(null)}
      onEdit={detail.canManage ? () => setDialog({ ...detail, type: 'editAsset' }) : undefined}
      onArchive={detail.canManage ? async () => { try { await action(() => assetsApi.archive(detail.registerId, detail.assetId), 'Активът е архивиран.'); } catch { /* The current view shows the error. */ } } : undefined} />}
    {dialog?.type === 'subregister' && managed && <SubregisterDialog onClose={() => setDialog(null)} onSave={saveSubregister} />}
    {dialog?.type === 'editSubregister' && subregister && <SubregisterDialog subregister={subregister} onClose={() => setDialog(null)} onSave={renameSubregister} />}
    {dialog?.type === 'scope' && subregister && scopeAssets.isPending && <div role="status">Зареждане на активи…</div>}
    {dialog?.type === 'scope' && subregister && scopeAssets.error && <p role="alert">{scopeAssets.error.message}</p>}
    {dialog?.type === 'scope' && subregister && scopeAssets.data && <ScopeDialog assets={scopeAssets.data} subregister={subregister} onClose={() => setDialog(null)} onSave={saveScope} />}
    {dialog?.type === 'invite' && subregister && <InviteDialog userId={userId} registerId={managed.id} subregister={subregister} onClose={() => setDialog(null)} onChanged={() => queryClient.invalidateQueries({ queryKey: ['user', userId] })} />}
    {dialog?.type === 'observation' && invitedScope?.role === 'participant' && <ObservationDialog asset={dialog.asset} disposal={dialog.disposal} onClose={() => setDialog(null)} onSave={observe} />}
    {dialog?.type === 'decision' && <DecisionDialog approve={dialog.status === 'approved'} description={requestLabels[dialog.request.kind]} onClose={() => setDialog(null)}
      onSave={values => action(() => requestsApi.decide(dialog.request.id, { status: dialog.status, reason: values.reason ?? '' }), 'Решението е записано.')} />}
  </>;
}
