import { useState } from 'react';

import { navigateTo, registerHref } from './navigation.js';

import { assetsApi } from '../api/assets.js';
import { queryClient } from '../api/query.js';
import { registersApi } from '../api/registers.js';
import { requestsApi } from '../api/requests.js';
import { sharingApi } from '../api/sharing.js';
import { subregistersApi } from '../api/subregisters.js';

// App owns the dialog, notice and error state because navigation and login also reset it, so the setters are passed in.
export function useAppActions({ userId, register, managed, subregister, invitedScope, setDialog, setNotice, setActionError }) {
  const [accepting, setAccepting] = useState(false);

  function reloadData() {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  }
  function refreshed(message) {
    reloadData();
    setDialog(null); setNotice(message); setActionError('');
  }
  // The error is thrown again so that FormDialog stays open and shows it next to the form.
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
    // Form fields are text. The API expects a number for quantity and null for an empty date.
    const body = { ...values, quantity: Number(values.quantity), acquiredOn: values.acquiredOn || null };
    // FormDialog adds assetIds to every form, and the asset endpoints refuse fields that they do not know.
    delete body.assetIds;
    if (existing) await action(() => assetsApi.update(register.id, existing.id, body), 'Активът е обновен.');
    else await action(() => assetsApi.create(register.id, body), 'Активът е добавен в регистъра.');
  }
  async function archiveAsset(detail) {
    try { await action(() => assetsApi.archive(detail.registerId, detail.assetId), 'Активът е архивиран.'); } catch { /* The current view shows the error. */ }
  }
  async function saveSubregister(values) {
    const saved = await action(() => subregistersApi.create(managed.id, { name: values.name }), 'Подрегистърът е създаден.');
    navigateTo(`subregisters/${managed.id}/${saved.id}`);
  }
  async function renameSubregister(values) {
    await action(() => subregistersApi.update(managed.id, subregister.id, { name: values.name }), 'Подрегистърът е преименуван.');
  }
  async function saveScope(values) {
    // Checkbox values are text, but asset IDs are integers in the API.
    await action(() => subregistersApi.update(managed.id, subregister.id, { assetIds: values.assetIds.map(Number) }), 'Обхватът на подрегистъра е запазен.');
  }
  async function observe(asset, values) {
    const body = { subregisterId: invitedScope.id, assetId: asset.id, kind: values.kind, note: values.note ?? '', location: values.location ?? '' };
    await action(() => requestsApi.create(invitedScope.registerId, body), values.kind === 'present' ? 'Проверката е записана в историята.' : 'Заявката е изпратена до администратора.');
  }
  async function decide(request, status, values) {
    await action(() => requestsApi.decide(request.id, { status, reason: values.reason ?? '' }), 'Решението е записано.');
  }
  async function updateMember(id, role) {
    try { await action(() => sharingApi.updateMember(managed.id, subregister.id, id, { role }), 'Ролята е обновена.'); } catch { /* The current view shows the error. */ }
  }
  async function removeMember(id) {
    try { await action(() => sharingApi.removeMember(managed.id, subregister.id, id), 'Достъпът е премахнат.'); } catch { /* The current view shows the error. */ }
  }

  return {
    accepting, reloadData, accept, saveRegister, updateRegister, saveAsset, archiveAsset,
    saveSubregister, renameSubregister, saveScope, observe, decide, updateMember, removeMember,
  };
}
