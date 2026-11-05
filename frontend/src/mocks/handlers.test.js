import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { clearAccessToken, http as clientHttp } from '../api/client.js';
import { authApi } from '../api/auth.js';
import { registersApi } from '../api/registers.js';
import { assetsApi } from '../api/assets.js';
import { subregistersApi } from '../api/subregisters.js';
import { sharingApi } from '../api/sharing.js';
import { requestsApi } from '../api/requests.js';
import { historyApi } from '../api/history.js';
import { createDatabase } from './database.js';
import { createHandlers } from './handlers.js';

let database;
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
async function loginAs(id) {
  const email = { accounting: 'elena@example.test', custodian: 'ivan@example.test', viewer: 'maria@example.test' }[id];
  return authApi.login({ email, password: 'demo' });
}
beforeEach(async () => {
  database = createDatabase();
  server.use(...createHandlers(database, 'http://localhost:5173/api/v1'));
  await loginAs('accounting');
});

const assetInput = { name: 'Лаптоп Lenovo', inventoryNumber: 'INV-200', location: 'Каб. 101', custodian: 'Иван', acquiredOn: '2026-11-01', unit: 'бр.', quantity: 1, status: 'Активен', sourceDocument: '' };

describe('local REST workflow', () => {
  it('requires login, validates demo credentials, refreshes, and logs out', async () => {
    await authApi.logout();
    await expect(authApi.me()).rejects.toMatchObject({ status: 401, code: 'LOGIN_REQUIRED' });
    await expect(authApi.login({ email: 'elena@example.test', password: 'wrong' })).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    await expect(authApi.login({ email: 'elena@example.test' })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    const session = await loginAs('viewer');
    expect(session).toMatchObject({ user: { id: 'viewer' }, accessToken: expect.any(String), expiresAt: expect.any(String) });
    expect((await authApi.me()).id).toBe('viewer');
    expect((await authApi.refresh()).user.id).toBe('viewer');
    clearAccessToken();
    expect((await registersApi.list()).items).toEqual([]);
    await authApi.logout();
    await expect(authApi.refresh()).rejects.toMatchObject({ status: 401, code: 'LOGIN_REQUIRED' });
  });

  it('shares by stored token, submits a change, applies one decision, and retains history', async () => {
    const register = await registersApi.create({ name: 'Лаборатория', description: 'Тестов регистър' });
    expect(register.owner.id).toBe('accounting');
    expect(register.permissions).toContain('manage');
    const asset = await assetsApi.create(register.id, assetInput);
    await expect(assetsApi.create(register.id, { ...assetInput, inventoryNumber: 'inv-200' })).rejects.toMatchObject({ status: 409, code: 'DUPLICATE_INVENTORY_NUMBER' });
    const scope = await subregistersApi.create(register.id, { name: 'Етаж 1' });
    const selected = await subregistersApi.update(register.id, scope.id, { assetIds: [asset.id], expectedVersion: scope.version });
    expect(selected.assetIds).toEqual([asset.id]);
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian');
    await expect(registersApi.get(register.id)).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    const accepted = await sharingApi.accept(link.token);
    expect(accepted).toMatchObject({ id: scope.id, role: 'participant', permissions: ['read', 'check', 'request'] });
    expect((await sharingApi.invited()).items.some(entry => entry.id === scope.id)).toBe(true);
    const proposal = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, assetVersion: asset.version, kind: 'location', note: 'Преместен', location: 'Каб. 102' });
    expect(proposal.status).toBe('pending');
    expect((await assetsApi.get(register.id, asset.id, { subregisterId: scope.id })).location).toBe('Каб. 101');
    await expect(requestsApi.decide(proposal.id, { status: 'approved' })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await loginAs('accounting');
    expect((await requestsApi.list({ view: 'incoming' })).items).toHaveLength(1);
    const decision = await requestsApi.decide(proposal.id, { status: 'approved' });
    expect(decision.status).toBe('approved');
    expect((await assetsApi.get(register.id, asset.id)).location).toBe('Каб. 102');
    await expect(requestsApi.decide(proposal.id, { status: 'approved' })).rejects.toMatchObject({ status: 409, code: 'INVALID_TRANSITION' });
    const events = (await historyApi.list(register.id, { subregisterId: scope.id })).items;
    expect(events.some(entry => entry.title === 'Одобрена заявка')).toBe(true);
    expect(events.some(entry => entry.title === 'Променен актив')).toBe(true);
    expect(events.filter(entry => entry.title === 'Одобрена заявка')).toHaveLength(1);
    expect((await registersApi.list()).items[0].assetCount).toBe(1);
  });

  it('enforces guest reads, rejection, expiry, revocation, and pagination', async () => {
    const register = await registersApi.create({ name: 'Склад', description: '' });
    await expect(registersApi.create({ name: 'Чуж', ownerId: 'viewer' })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    const asset = await assetsApi.create(register.id, assetInput);
    const scope = await subregistersApi.create(register.id, { name: 'Склад 1' });
    await subregistersApi.update(register.id, scope.id, { assetIds: [asset.id] });
    const guestLink = await sharingApi.invite(register.id, scope.id, { role: 'guest', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('viewer');
    await expect(clientHttp(`/invitations/${guestLink.token}/accept`, { method: 'POST', params: { role: 'owner' } })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    const accepted = await sharingApi.accept(guestLink.token);
    expect(accepted.permissions).toEqual(['read']);
    expect((await assetsApi.list(register.id, { subregisterId: scope.id, search: 'LENOVO' })).items).toHaveLength(1);
    await expect(assetsApi.update(register.id, asset.id, { location: 'Другаде' })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await expect(requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, assetVersion: 1, kind: 'missing', note: 'Няма го' })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await expect(assetsApi.list(register.id)).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await loginAs('accounting');
    const revoked = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await sharingApi.revoke(revoked.id);
    const shortLink = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 250).toISOString() });
    await new Promise(resolve => setTimeout(resolve, 300));
    await loginAs('custodian');
    await expect(sharingApi.accept(revoked.token)).rejects.toMatchObject({ status: 410, code: 'INVITATION_UNAVAILABLE' });
    await expect(sharingApi.accept(shortLink.token)).rejects.toMatchObject({ status: 410, code: 'INVITATION_UNAVAILABLE' });
    await loginAs('accounting');
    expect((await assetsApi.list(register.id, { page: 1, pageSize: 1 })).pagination).toMatchObject({ page: 1, pageSize: 1, totalItems: 1, totalPages: 1 });
  });

  it('rejects without changing the asset and archives without deleting history', async () => {
    const register = await registersApi.create({ name: 'Офис', description: '' });
    const asset = await assetsApi.create(register.id, assetInput);
    const scope = await subregistersApi.create(register.id, { name: 'Офис 1' });
    await subregistersApi.update(register.id, scope.id, { assetIds: [asset.id] });
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian'); await sharingApi.accept(link.token);
    const request = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, assetVersion: asset.version, kind: 'disposal', note: 'Повреден' });
    await loginAs('accounting');
    await requestsApi.decide(request.id, { status: 'rejected', reason: 'Подлежи на ремонт' });
    expect((await assetsApi.get(register.id, asset.id)).status).toBe('Активен');
    const archived = await assetsApi.archive(register.id, asset.id);
    expect(archived.archivedAt).toBeTruthy();
    expect((await assetsApi.list(register.id)).items).toHaveLength(0);
    expect((await assetsApi.list(register.id, { includeArchived: true })).items).toHaveLength(1);
    expect((await historyApi.list(register.id)).items.some(entry => entry.title === 'Архивиран актив')).toBe(true);
  });

  it('persists the mock database separately from the selected demo account', async () => {
    const storage = new Map();
    const browserStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
    const first = createDatabase(browserStorage);
    const before = await first.run(false, data => data.registers.length);
    await first.run(true, data => { data.registers.push({ id: 'saved', name: 'Запазен', description: '', ownerId: 'viewer', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); });
    const reloaded = createDatabase(browserStorage);
    expect((await reloaded.run(false, data => data.registers.length))).toBe(before + 1);
    reloaded.reset();
    expect((await first.run(false, data => data.registers.length))).toBe(before);
    expect([...storage.keys()]).toEqual(['invory.mock.database.v1']);
  });

  it('imports legacy local registers once without deleting the original browser data', async () => {
    const legacy = JSON.stringify({ version: 1, registers: [{
      id: 'old-register', name: 'Стар регистър', description: '', ownerId: 'accounting',
      assets: [{ id: 'old-asset', name: 'Стар актив', inventoryNumber: 'OLD-1', location: 'Каб. 1', custodian: '', acquiredOn: '', unit: 'бр.', quantity: 1, status: 'Активен', sourceDocument: '' }],
      subregisters: [{ id: 'old-sub', name: 'Стар обхват', assetIds: ['old-asset'], members: [{ profileId: 'custodian', role: 'participant' }] }],
      requests: [], history: [],
    }] });
    const storage = new Map([['invory.react.registry.v1', legacy]]);
    const browserStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
    const imported = createDatabase(browserStorage);
    expect(imported.read().assets.find(asset => asset.id === 'old-asset')).toMatchObject({ registerId: 'old-register', version: 1 });
    expect(imported.read().memberships).toContainEqual(expect.objectContaining({ subregisterId: 'old-sub', userId: 'custodian', role: 'participant' }));
    expect(createDatabase(browserStorage).read().registers.filter(register => register.id === 'old-register')).toHaveLength(1);
    imported.reset();
    expect(imported.read().registers.some(register => register.id === 'old-register')).toBe(false);
    expect(storage.get('invory.react.registry.v1')).toBe(legacy);
  });

  it('returns saved edits and enforces membership changes immediately', async () => {
    const register = await registersApi.create({ name: 'Преди', description: '' });
    expect((await registersApi.update(register.id, { name: 'След' })).name).toBe('След');
    const asset = await assetsApi.create(register.id, assetInput);
    const edited = await assetsApi.update(register.id, asset.id, { location: 'Каб. 202', expectedVersion: asset.version });
    expect(edited).toMatchObject({ location: 'Каб. 202', version: 2 });
    const scope = await subregistersApi.create(register.id, { name: 'Преди' });
    const renamed = await subregistersApi.update(register.id, scope.id, { name: 'След', assetIds: [asset.id], expectedVersion: scope.version });
    expect(renamed).toMatchObject({ name: 'След', assetIds: [asset.id] });
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian'); await sharingApi.accept(link.token);
    await loginAs('accounting');
    expect((await sharingApi.updateMember(register.id, scope.id, 'custodian', { role: 'guest' })).role).toBe('guest');
    await loginAs('custodian');
    await expect(requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, assetVersion: edited.version, kind: 'missing', note: 'Няма го' })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await loginAs('accounting'); await sharingApi.removeMember(register.id, scope.id, 'custodian');
    await loginAs('custodian');
    await expect(assetsApi.list(register.id, { subregisterId: scope.id })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
