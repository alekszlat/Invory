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
import { createDatabase, mockStorageKey } from './database.js';
import { createHandlers } from './handlers.js';

let database;
let userIds;
const server = setupServer();
const password = 'test-password-1';
const accounts = {
  accounting: { name: 'Елена Петрова', email: 'elena@example.test' },
  custodian: { name: 'Иван Иванов', email: 'ivan@example.test' },
  viewer: { name: 'Мария Георгиева', email: 'maria@example.test' },
};
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
async function loginAs(key) {
  return authApi.login({ email: accounts[key].email, password });
}
beforeEach(async () => {
  database = createDatabase();
  server.use(...createHandlers(database, 'http://localhost:5173/api/v1'));
  userIds = {};
  for (const [key, account] of Object.entries(accounts)) userIds[key] = (await authApi.register({ ...account, password })).user.id;
  await loginAs('accounting');
});

const assetInput = { name: 'Лаптоп Lenovo', inventoryNumber: 'INV-200', location: 'Каб. 101', custodian: 'Иван', acquiredOn: '2026-11-01', unit: 'бр.', quantity: 1, status: 'Активен', sourceDocument: '' };

describe('local REST workflow', () => {
  it('requires login, validates credentials, refreshes, and logs out', async () => {
    await authApi.logout();
    await expect(registersApi.list()).rejects.toMatchObject({ status: 401, code: 'LOGIN_REQUIRED' });
    await expect(authApi.login({ email: 'elena@example.test', password: 'wrong' })).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    await expect(authApi.login({ email: 'nobody@example.test', password })).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    await expect(authApi.login({ email: 'elena@example.test' })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    const session = await loginAs('viewer');
    expect(session).toMatchObject({ user: { id: userIds.viewer }, accessToken: expect.any(String), expiresAt: expect.any(String) });
    expect((await authApi.refresh()).user.id).toBe(userIds.viewer);
    clearAccessToken();
    expect((await registersApi.list()).items).toEqual([]);
    await authApi.logout();
    await expect(authApi.refresh()).rejects.toMatchObject({ status: 401, code: 'LOGIN_REQUIRED' });
  });

  it('starts empty and signs up new accounts without exposing the password', async () => {
    expect((await registersApi.list()).items).toEqual([]);
    const secret = 'my-new-password-9';
    const session = await authApi.register({ name: 'Нов Потребител', email: 'New@Example.test', password: secret });
    expect(session.user).toEqual({ id: expect.any(String), name: 'Нов Потребител', email: 'new@example.test' });
    expect((await authApi.refresh()).user.email).toBe('new@example.test');
    await expect(authApi.register({ name: 'Друг', email: 'new@example.test', password: secret })).rejects.toMatchObject({ status: 422, code: 'EMAIL_ALREADY_REGISTERED', fields: { email: expect.any(Array) } });
    await expect(authApi.register({ name: 'Друг', email: 'other@example.test', password: 'short' })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR', fields: { password: expect.any(Array) } });
    await expect(authApi.register({ name: 'Друг', email: 'not-an-email', password: secret })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR', fields: { email: expect.any(Array) } });
    await authApi.logout();
    await expect(authApi.login({ email: 'new@example.test', password: 'wrong-password' })).rejects.toMatchObject({ status: 401 });
    expect((await authApi.login({ email: 'NEW@example.test', password: secret })).user.email).toBe('new@example.test');
    expect(JSON.stringify(await database.run(false, data => data))).not.toContain(secret);
  });

  it('numbers assets 1, 2, 3 and uses those numbers everywhere', async () => {
    const register = await registersApi.create({ name: 'Склад', description: '' });
    const first = await assetsApi.create(register.id, assetInput);
    const second = await assetsApi.create(register.id, { ...assetInput, inventoryNumber: 'INV-201' });
    const otherRegister = await registersApi.create({ name: 'Офис', description: '' });
    const third = await assetsApi.create(otherRegister.id, assetInput);
    expect([first.id, second.id, third.id]).toEqual([1, 2, 3]);
    expect((await assetsApi.get(register.id, 2)).id).toBe(2);
    await expect(assetsApi.get(register.id, 'abc')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    await expect(assetsApi.get(register.id, 3)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    const scope = await subregistersApi.create(register.id, { name: 'Рафт' });
    await expect(subregistersApi.update(register.id, scope.id, { assetIds: ['1'] })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    expect((await subregistersApi.update(register.id, scope.id, { assetIds: [1, 2] })).assetIds).toEqual([1, 2]);
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian'); await sharingApi.accept(link.token);
    await expect(requestsApi.create(register.id, { subregisterId: scope.id, assetId: '1', kind: 'present' })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    const check = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: 1, kind: 'present' });
    expect(check).toMatchObject({ assetId: 1, asset: { id: 1 } });
  });

  it('returns subregisters with their register and every visible request in one list', async () => {
    const register = await registersApi.create({ name: 'Склад', description: '' });
    expect(register.subregisters).toEqual([]);
    const asset = await assetsApi.create(register.id, assetInput);
    const scope = await subregistersApi.create(register.id, { name: 'Рафт' });
    await subregistersApi.update(register.id, scope.id, { assetIds: [asset.id] });
    const [listed] = (await registersApi.list()).items;
    expect(listed.subregisters).toEqual([expect.objectContaining({ id: scope.id, assetIds: [asset.id], role: 'owner', memberCount: 0 })]);
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian'); await sharingApi.accept(link.token);
    const sent = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, kind: 'missing', note: 'Няма го' });
    expect((await requestsApi.list()).items.map(item => item.id)).toEqual([sent.id]);
    await expect(requestsApi.list({ view: 'incoming' })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    await loginAs('accounting');
    expect((await requestsApi.list()).items.map(item => item.id)).toEqual([sent.id]);
    await loginAs('viewer');
    expect((await requestsApi.list()).items).toEqual([]);
  });

  it('has no edit conflicts: later edits never block a save or a decision', async () => {
    const register = await registersApi.create({ name: 'Склад', description: '' });
    const asset = await assetsApi.create(register.id, assetInput);
    expect(asset).not.toHaveProperty('version');
    await expect(assetsApi.update(register.id, asset.id, { location: 'Каб. 2', expectedVersion: 1 })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    const scope = await subregistersApi.create(register.id, { name: 'Етаж' });
    expect(scope).not.toHaveProperty('version');
    await subregistersApi.update(register.id, scope.id, { assetIds: [asset.id] });
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian'); await sharingApi.accept(link.token);
    const request = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, kind: 'location', note: 'Преместен', location: 'Каб. 9' });
    expect(request).not.toHaveProperty('originalAssetVersion');
    await loginAs('accounting');
    await assetsApi.update(register.id, asset.id, { custodian: 'Мария' });
    await assetsApi.update(register.id, asset.id, { quantity: 2 });
    expect((await requestsApi.decide(request.id, { status: 'approved' })).status).toBe('approved');
    expect(await assetsApi.get(register.id, asset.id)).toMatchObject({ location: 'Каб. 9', custodian: 'Мария', quantity: 2 });
  });

  it('shares by stored token, submits a change, applies one decision, and retains history', async () => {
    const register = await registersApi.create({ name: 'Лаборатория', description: 'Тестов регистър' });
    expect(register.owner.id).toBe(userIds.accounting);
    expect(register.role).toBe('owner');
    expect(register).not.toHaveProperty('permissions');
    const asset = await assetsApi.create(register.id, assetInput);
    await expect(assetsApi.create(register.id, { ...assetInput, inventoryNumber: 'inv-200' })).rejects.toMatchObject({ status: 422, code: 'DUPLICATE_INVENTORY_NUMBER' });
    const scope = await subregistersApi.create(register.id, { name: 'Етаж 1' });
    const selected = await subregistersApi.update(register.id, scope.id, { assetIds: [asset.id] });
    expect(selected.assetIds).toEqual([asset.id]);
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian');
    await expect(assetsApi.list(register.id)).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    const accepted = await sharingApi.accept(link.token);
    expect(accepted).toMatchObject({ id: scope.id, role: 'participant' });
    expect(accepted).not.toHaveProperty('permissions');
    expect((await sharingApi.invited()).items.some(entry => entry.id === scope.id)).toBe(true);
    const proposal = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, kind: 'location', note: 'Преместен', location: 'Каб. 102' });
    expect(proposal.status).toBe('pending');
    expect((await assetsApi.get(register.id, asset.id, { subregisterId: scope.id })).location).toBe('Каб. 101');
    await expect(requestsApi.decide(proposal.id, { status: 'approved' })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await loginAs('accounting');
    expect((await requestsApi.list()).items).toHaveLength(1);
    const decision = await requestsApi.decide(proposal.id, { status: 'approved' });
    expect(decision.status).toBe('approved');
    expect((await assetsApi.get(register.id, asset.id)).location).toBe('Каб. 102');
    await expect(requestsApi.decide(proposal.id, { status: 'approved' })).rejects.toMatchObject({ status: 422, code: 'INVALID_TRANSITION' });
    const events = (await historyApi.list(register.id, { subregisterId: scope.id })).items;
    expect(events.some(entry => entry.title === 'Одобрена заявка')).toBe(true);
    expect(events.some(entry => entry.title === 'Променен актив')).toBe(true);
    expect(events.filter(entry => entry.title === 'Одобрена заявка')).toHaveLength(1);
    expect((await registersApi.list()).items[0].assetCount).toBe(1);
  });

  it('enforces guest reads, rejection, expiry, revocation, and pagination', async () => {
    const register = await registersApi.create({ name: 'Склад', description: '' });
    await expect(registersApi.create({ name: 'Чуж', ownerId: userIds.viewer })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    const asset = await assetsApi.create(register.id, assetInput);
    const scope = await subregistersApi.create(register.id, { name: 'Склад 1' });
    await subregistersApi.update(register.id, scope.id, { assetIds: [asset.id] });
    const guestLink = await sharingApi.invite(register.id, scope.id, { role: 'guest', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('viewer');
    await expect(clientHttp(`/invitations/${guestLink.token}/accept`, { method: 'POST', params: { role: 'owner' } })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
    const accepted = await sharingApi.accept(guestLink.token);
    expect(accepted.role).toBe('guest');
    expect((await assetsApi.list(register.id, { subregisterId: scope.id, search: 'LENOVO' })).items).toHaveLength(1);
    await expect(assetsApi.update(register.id, asset.id, { location: 'Другаде' })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await expect(requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, kind: 'missing', note: 'Няма го' })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
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
    const request = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, kind: 'disposal', note: 'Повреден' });
    await loginAs('accounting');
    await requestsApi.decide(request.id, { status: 'rejected', reason: 'Подлежи на ремонт' });
    expect((await assetsApi.get(register.id, asset.id)).status).toBe('Активен');
    const archived = await assetsApi.archive(register.id, asset.id);
    expect(archived.archivedAt).toBeTruthy();
    expect((await assetsApi.list(register.id)).items).toHaveLength(0);
    expect((await assetsApi.list(register.id, { includeArchived: true })).items).toHaveLength(1);
    expect((await historyApi.list(register.id)).items.some(entry => entry.title === 'Архивиран актив')).toBe(true);
  });

  it('refuses to approve a request once the asset is archived or disposed of', async () => {
    const register = await registersApi.create({ name: 'Офис', description: '' });
    const asset = await assetsApi.create(register.id, assetInput);
    const scope = await subregistersApi.create(register.id, { name: 'Офис 1' });
    await subregistersApi.update(register.id, scope.id, { assetIds: [asset.id] });
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian'); await sharingApi.accept(link.token);
    const moved = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, kind: 'location', note: 'Преместен', location: 'Каб. 7' });
    const disposal = await requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, kind: 'disposal', note: 'Счупен' });
    await loginAs('accounting');
    await requestsApi.decide(disposal.id, { status: 'approved' });
    await expect(requestsApi.decide(moved.id, { status: 'approved' })).rejects.toMatchObject({ status: 422, code: 'ASSET_UNAVAILABLE' });
    expect((await assetsApi.get(register.id, asset.id)).location).toBe('Каб. 101');
  });

  it('keeps saved data after the page is reloaded and recovers from a damaged copy', async () => {
    const storage = new Map();
    const browserStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
    const first = createDatabase(browserStorage);
    expect(await first.run(false, data => data.registers.length)).toBe(0);
    await first.run(true, data => { data.registers.push({ id: 'saved', name: 'Запазен', description: '', ownerId: 'someone', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); });
    const reloaded = createDatabase(browserStorage);
    expect(await reloaded.run(false, data => data.registers.length)).toBe(1);
    expect([...storage.keys()]).toEqual([mockStorageKey]);
    storage.set(mockStorageKey, 'not valid data');
    expect(await reloaded.run(false, data => data.registers.length)).toBe(0);
  });

  it('returns saved edits and enforces membership changes immediately', async () => {
    const register = await registersApi.create({ name: 'Преди', description: '' });
    expect((await registersApi.update(register.id, { name: 'След' })).name).toBe('След');
    const asset = await assetsApi.create(register.id, assetInput);
    const edited = await assetsApi.update(register.id, asset.id, { location: 'Каб. 202' });
    expect(edited).toMatchObject({ location: 'Каб. 202' });
    const scope = await subregistersApi.create(register.id, { name: 'Преди' });
    const renamed = await subregistersApi.update(register.id, scope.id, { name: 'След', assetIds: [asset.id] });
    expect(renamed).toMatchObject({ name: 'След', assetIds: [asset.id] });
    const link = await sharingApi.invite(register.id, scope.id, { role: 'participant', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    await loginAs('custodian'); await sharingApi.accept(link.token);
    await loginAs('accounting');
    expect((await sharingApi.updateMember(register.id, scope.id, userIds.custodian, { role: 'guest' })).role).toBe('guest');
    await loginAs('custodian');
    await expect(requestsApi.create(register.id, { subregisterId: scope.id, assetId: asset.id, kind: 'missing', note: 'Няма го' })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await loginAs('accounting'); await sharingApi.removeMember(register.id, scope.id, userIds.custodian);
    await loginAs('custodian');
    await expect(assetsApi.list(register.id, { subregisterId: scope.id })).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
