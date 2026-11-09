import { http, HttpResponse } from 'msw';
import { requestLabels } from '../shared/labels.js';

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
// Test accounts live in browser storage, so a typed password is never saved as readable text.
// SHA-256 is only good enough for this stand-in; the real server needs a proper password hash.
async function hashPassword(password) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
class Fault extends Error {
  constructor(status, code, message, fields = {}) { super(message); Object.assign(this, { status, code, fields }); }
}
const fail = (status, code, message, fields) => { throw new Fault(status, code, message, fields); };
const invalid = (field, message) => fail(422, 'VALIDATION_ERROR', message, { [field]: [message] });
const find = (items, key) => items.find(item => item.id === key) ?? fail(404, 'NOT_FOUND', 'Записът не е намерен.');
// Web addresses carry the asset number as text; assets are stored with real numbers.
const assetIdFrom = value => (/^[1-9]\d*$/.test(value) ? Number(value) : fail(404, 'NOT_FOUND', 'Записът не е намерен.'));
// Assets are archived and never deleted, so the highest number is never given out twice.
const nextAssetId = data => Math.max(0, ...data.assets.map(asset => asset.id)) + 1;
function text(body, field, max, required = false) {
  const value = body[field];
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) invalid(field, `Невалидно поле „${field}“ (до ${max} знака).`);
  return value.trim();
}
function fields(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('body', 'Очаква се JSON обект.');
  const unknown = Object.keys(body).find(key => !allowed.includes(key));
  if (unknown) invalid(unknown, 'Полето не е разрешено.');
}
function choice(value, values, field) { if (!values.includes(value)) invalid(field, 'Неразпозната стойност.'); return value; }
function userFor(data, request, tokens) {
  const bearer = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
  const entry = tokens.get(bearer);
  const user = entry?.expiresAt > Date.now() ? data.users.find(user => user.id === entry.userId) : null;
  return user ?? fail(401, 'LOGIN_REQUIRED', 'Необходим е вход в профил.');
}
function owner(register, user) { if (register.ownerId !== user.id) fail(403, 'FORBIDDEN', 'Действието е достъпно за администратора на регистъра.'); }
function scopeFor(data, register, subregisterId, user) {
  const subregister = subregisterId ? find(data.subregisters.filter(sub => sub.registerId === register.id), subregisterId) : null;
  const role = register.ownerId === user.id ? 'owner' : data.memberships.find(member => member.subregisterId === subregister?.id && member.userId === user.id)?.role;
  if (!role) fail(403, 'FORBIDDEN', 'Нямате достъп до този обхват.');
  return { subregister, role };
}
function registerView(data, register, user) {
  return { id: register.id, name: register.name, description: register.description, owner: find(data.users, register.ownerId), assetCount: data.assets.filter(asset => asset.registerId === register.id && !asset.archivedAt).length, role: 'owner', subregisters: data.subregisters.filter(sub => sub.registerId === register.id).map(sub => subView(data, sub, user)), createdAt: register.createdAt, updatedAt: register.updatedAt };
}
function subView(data, sub, user) {
  const register = find(data.registers, sub.registerId);
  const { role } = scopeFor(data, register, sub.id, user);
  return { ...sub, registerName: register.name, memberCount: data.memberships.filter(member => member.subregisterId === sub.id).length, role };
}
function memberView(data, member) {
  const { userId, ...rest } = member;
  return { ...rest, user: find(data.users, userId) };
}
function requestView(data, request) {
  const { requesterId, decidedById, ...rest } = request;
  const register = find(data.registers, request.registerId);
  const subregister = find(data.subregisters, request.subregisterId);
  const asset = find(data.assets, request.assetId);
  return { ...rest, register: { id: register.id, name: register.name }, subregister: { id: subregister.id, name: subregister.name }, asset: { id: asset.id, name: asset.name, inventoryNumber: asset.inventoryNumber }, requester: find(data.users, requesterId), decidedBy: decidedById ? find(data.users, decidedById) : null };
}
function event(data, user, registerId, title, details, scope = {}) {
  data.history.unshift({ id: id(), registerId, subregisterId: null, assetId: null, actorId: user.id, participantId: null, ownerOnly: false, at: now(), title, details, ...scope });
}
function page(items, url) {
  const number = (name, fallback, max) => {
    const value = url.searchParams.get(name) ?? String(fallback);
    if (!/^[1-9]\d*$/.test(value) || Number(value) > max) invalid(name, 'Невалидна страница или размер.');
    return Number(value);
  };
  const current = number('page', 1, Number.MAX_SAFE_INTEGER);
  const pageSize = number('pageSize', 20, 100);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), pagination: { page: current, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) } };
}
function params(url, allowed) {
  for (const key of url.searchParams.keys()) if (!['page', 'pageSize', ...allowed].includes(key)) invalid(key, 'Неподдържан параметър.');
}
function validateAsset(body, existing) {
  fields(body, ['name', 'inventoryNumber', 'location', 'custodian', 'acquiredOn', 'unit', 'quantity', 'status', 'sourceDocument']);
  const result = {};
  for (const [key, max] of Object.entries({ name: 150, inventoryNumber: 60, location: 120, custodian: 120, unit: 12, sourceDocument: 200 })) {
    const required = ['name', 'inventoryNumber', 'location'].includes(key) && (!existing || key in body);
    const value = text(body, key, max, required);
    if (value !== undefined) result[key] = value;
  }
  if (!existing || 'quantity' in body) {
    if (typeof body.quantity !== 'number' || !Number.isFinite(body.quantity) || body.quantity <= 0) invalid('quantity', 'Въведете количество, по-голямо от нула.');
    result.quantity = body.quantity;
  }
  if (!existing || 'status' in body) result.status = choice(body.status ?? 'Активен', ['Активен', 'За ремонт', 'Бракуван'], 'status');
  if ('acquiredOn' in body) {
    const date = body.acquiredOn;
    if (date !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) invalid('acquiredOn', 'Въведете валидна дата.');
    result.acquiredOn = date;
  }
  if (!existing) return { custodian: '', acquiredOn: null, sourceDocument: '', ...result, unit: result.unit || 'бр.' };
  return result;
}

export function createHandlers(database, baseUrl, mockSession = (() => {
  let current = null;
  return { get: () => current, set: id => { current = id; }, clear: () => { current = null; } };
})()) {
  const tokens = new Map();
  function issue(user, replace = false) {
    const accessToken = `mock.${id()}.${id()}`;
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    if (replace) tokens.clear();
    tokens.set(accessToken, { userId: user.id, expiresAt: expiresAt.getTime() });
    mockSession.set(user.id);
    return { user, accessToken, expiresAt: expiresAt.toISOString() };
  }
  function route(method, path, write, action, success = 200, requiresAuth = true) {
    return http[method](`${baseUrl}${path}`, async ({ request, params: routeParams }) => {
      try {
        let body;
        if (request.headers.get('Content-Type')?.includes('application/json')) {
          try { body = await request.json(); } catch { fail(400, 'INVALID_JSON', 'Невалиден JSON.'); }
          if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('body', 'Очаква се JSON обект.');
        }
        const result = await database.run(write, data => action({ data, user: requiresAuth ? userFor(data, request, tokens) : null, body: body ?? {}, url: new URL(request.url), p: routeParams }));
        return success === 204 ? new HttpResponse(null, { status: 204 }) : HttpResponse.json(result, { status: success });
      } catch (error) {
        return HttpResponse.json({ error: { code: error.code ?? 'MOCK_STORAGE_ERROR', message: error instanceof Fault ? error.message : 'Данните не могат да бъдат прочетени или запазени. Проверете паметта на браузъра.', fields: error.fields ?? {}, traceId: id() } }, { status: error.status ?? 500 });
      }
    });
  }
  return [
    route('post', '/auth/login', false, async ({ data, body }) => {
      fields(body, ['email', 'password']);
      const email = text(body, 'email', 254, true).toLowerCase();
      text(body, 'password', 200, true);
      const user = data.users.find(entry => entry.email === email);
      const saved = data.credentials.find(entry => entry.userId === user?.id);
      if (!saved || saved.passwordHash !== await hashPassword(body.password)) fail(401, 'INVALID_CREDENTIALS', 'Невалиден имейл или парола.');
      return issue(user, true);
    }, 200, false),
    route('post', '/auth/register', true, async ({ data, body }) => {
      fields(body, ['name', 'email', 'password']);
      const name = text(body, 'name', 120, true);
      const email = text(body, 'email', 254, true).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid('email', 'Въведете валиден имейл.');
      if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 200) invalid('password', 'Паролата трябва да е между 8 и 200 знака.');
      if (data.users.some(entry => entry.email === email)) fail(422, 'EMAIL_ALREADY_REGISTERED', 'Вече има профил с този имейл.', { email: ['Вече има профил с този имейл.'] });
      const user = { id: id(), name, email };
      data.users.push(user);
      data.credentials.push({ userId: user.id, passwordHash: await hashPassword(body.password) });
      return issue(user, true);
    }, 201, false),
    route('post', '/auth/refresh', false, ({ data }) => {
      const user = data.users.find(entry => entry.id === mockSession.get());
      if (!user) fail(401, 'LOGIN_REQUIRED', 'Необходим е вход в профил.');
      return issue(user);
    }, 200, false),
    route('post', '/auth/logout', false, () => { tokens.clear(); mockSession.clear(); return null; }, 204),
    route('get', '/registers', false, ({ data, user, url }) => {
      params(url, []);
      return page(data.registers.filter(register => register.ownerId === user.id).map(register => registerView(data, register, user)), url);
    }),
    route('post', '/registers', true, ({ data, user, body }) => {
      fields(body, ['name', 'description']);
      const register = { id: id(), name: text(body, 'name', 100, true), description: text(body, 'description', 300) ?? '', ownerId: user.id, createdAt: now(), updatedAt: now() };
      data.registers.push(register);
      event(data, user, register.id, 'Създаден регистър', register.name);
      return registerView(data, register, user);
    }, 201),
    route('patch', '/registers/:registerId', true, ({ data, user, p, body }) => {
      const register = find(data.registers, p.registerId); owner(register, user); fields(body, ['name', 'description']);
      if (!Object.keys(body).length) invalid('body', 'Посочете поне едно поле.');
      if ('name' in body) register.name = text(body, 'name', 100, true);
      if ('description' in body) register.description = text(body, 'description', 300);
      register.updatedAt = now(); event(data, user, register.id, 'Обновен регистър', register.name);
      return registerView(data, register, user);
    }),
    route('get', '/registers/:registerId/assets', false, ({ data, user, p, url }) => {
      params(url, ['subregisterId', 'search', 'status', 'location', 'custodian', 'includeArchived']);
      const register = find(data.registers, p.registerId);
      const { subregister } = scopeFor(data, register, url.searchParams.get('subregisterId'), user);
      const archived = url.searchParams.get('includeArchived');
      if (archived !== null) choice(archived, ['true', 'false'], 'includeArchived');
      const status = url.searchParams.get('status');
      if (status) choice(status, ['Активен', 'За ремонт', 'Бракуван'], 'status');
      const search = (url.searchParams.get('search') ?? '').trim().toLocaleLowerCase('bg');
      return page(data.assets.filter(asset => asset.registerId === register.id && (!subregister || subregister.assetIds.includes(asset.id))
        && (archived === 'true' || !asset.archivedAt) && (!status || asset.status === status)
        && ['location', 'custodian'].every(key => !url.searchParams.get(key) || asset[key] === url.searchParams.get(key))
        && [asset.name, asset.inventoryNumber, asset.location, asset.custodian].some(value => value.toLocaleLowerCase('bg').includes(search))), url);
    }),
    route('get', '/registers/:registerId/assets/:assetId', false, ({ data, user, p, url }) => {
      params(url, ['subregisterId']);
      const register = find(data.registers, p.registerId);
      const { subregister } = scopeFor(data, register, url.searchParams.get('subregisterId'), user);
      return find(data.assets.filter(asset => asset.registerId === register.id && (!subregister || subregister.assetIds.includes(asset.id))), assetIdFrom(p.assetId));
    }),
    route('post', '/registers/:registerId/assets', true, ({ data, user, p, body }) => {
      const register = find(data.registers, p.registerId); owner(register, user);
      const values = validateAsset(body);
      if (data.assets.some(asset => asset.registerId === register.id && asset.inventoryNumber.toLocaleUpperCase('bg') === values.inventoryNumber.toLocaleUpperCase('bg'))) fail(422, 'DUPLICATE_INVENTORY_NUMBER', 'В този регистър вече има актив с този инвентарен номер.', { inventoryNumber: ['Номерът вече се използва.'] });
      const asset = { ...values, id: nextAssetId(data), registerId: register.id, archivedAt: null, createdAt: now(), updatedAt: now() };
      data.assets.push(asset); event(data, user, register.id, 'Добавен актив', `${asset.name} · ${asset.inventoryNumber}`, { assetId: asset.id }); return asset;
    }, 201),
    route('patch', '/registers/:registerId/assets/:assetId', true, ({ data, user, p, body }) => {
      const register = find(data.registers, p.registerId); owner(register, user);
      const asset = find(data.assets.filter(asset => asset.registerId === register.id), assetIdFrom(p.assetId));
      if (asset.archivedAt) fail(422, 'ASSET_ARCHIVED', 'Архивиран актив не може да се редактира.');
      const values = validateAsset(body, asset);
      if (!Object.keys(values).length) invalid('body', 'Посочете поне едно поле.');
      if (values.inventoryNumber && data.assets.some(entry => entry.id !== asset.id && entry.registerId === register.id && entry.inventoryNumber.toLocaleUpperCase('bg') === values.inventoryNumber.toLocaleUpperCase('bg'))) fail(422, 'DUPLICATE_INVENTORY_NUMBER', 'В този регистър вече има актив с този инвентарен номер.', { inventoryNumber: ['Номерът вече се използва.'] });
      Object.assign(asset, values, { updatedAt: now() });
      event(data, user, register.id, 'Променен актив', `${asset.name} · ${asset.inventoryNumber}`, { assetId: asset.id }); return asset;
    }),
    route('delete', '/registers/:registerId/assets/:assetId', true, ({ data, user, p }) => {
      const register = find(data.registers, p.registerId); owner(register, user);
      const asset = find(data.assets.filter(asset => asset.registerId === register.id), assetIdFrom(p.assetId));
      if (!asset.archivedAt) {
        asset.archivedAt = now(); asset.updatedAt = asset.archivedAt;
        event(data, user, register.id, 'Архивиран актив', `${asset.name} · ${asset.inventoryNumber}`, { assetId: asset.id });
      }
      return asset;
    }),
    route('post', '/registers/:registerId/subregisters', true, ({ data, user, p, body }) => {
      const register = find(data.registers, p.registerId); owner(register, user); fields(body, ['name']);
      const sub = { id: id(), registerId: register.id, name: text(body, 'name', 100, true), assetIds: [], createdAt: now(), updatedAt: now() };
      data.subregisters.push(sub); event(data, user, register.id, 'Създаден подрегистър', sub.name, { subregisterId: sub.id }); return subView(data, sub, user);
    }, 201),
    route('patch', '/registers/:registerId/subregisters/:subregisterId', true, ({ data, user, p, body }) => {
      const register = find(data.registers, p.registerId); owner(register, user);
      const sub = scopeFor(data, register, p.subregisterId, user).subregister;
      fields(body, ['name', 'assetIds']);
      if (!('name' in body) && !('assetIds' in body)) invalid('body', 'Посочете поне едно поле.');
      if ('name' in body) sub.name = text(body, 'name', 100, true);
      if ('assetIds' in body) {
        if (!Array.isArray(body.assetIds) || new Set(body.assetIds).size !== body.assetIds.length || body.assetIds.some(key => !data.assets.some(asset => asset.id === key && asset.registerId === register.id && (!asset.archivedAt || sub.assetIds.includes(key))))) invalid('assetIds', 'Изберете активи от родителския регистър.');
        sub.assetIds = [...body.assetIds];
      }
      sub.updatedAt = now(); event(data, user, register.id, 'Обновен подрегистър', sub.name, { subregisterId: sub.id }); return subView(data, sub, user);
    }),
    route('get', '/invited-scopes', false, ({ data, user, url }) => {
      params(url, []);
      return page(data.subregisters.filter(sub => data.memberships.some(member => member.subregisterId === sub.id && member.userId === user.id)).map(sub => subView(data, sub, user)), url);
    }),
    route('get', '/registers/:registerId/subregisters/:subregisterId/invitations', false, ({ data, user, p, url }) => {
      params(url, []); const register = find(data.registers, p.registerId); owner(register, user); scopeFor(data, register, p.subregisterId, user);
      return page(data.invitations.filter(invite => invite.subregisterId === p.subregisterId).map(({ acceptedBy: _acceptedBy, ...invite }) => invite), url);
    }),
    route('post', '/registers/:registerId/subregisters/:subregisterId/invitations', true, ({ data, user, p, body }) => {
      const register = find(data.registers, p.registerId); owner(register, user); scopeFor(data, register, p.subregisterId, user); fields(body, ['role', 'expiresAt']);
      const role = choice(body.role, ['participant', 'guest'], 'role');
      if (typeof body.expiresAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(body.expiresAt) || !Number.isFinite(Date.parse(body.expiresAt)) || Date.parse(body.expiresAt) <= Date.now()) invalid('expiresAt', 'Изберете бъдещ срок в UTC.');
      const invite = { id: id(), registerId: register.id, subregisterId: p.subregisterId, role, token: id() + id(), expiresAt: body.expiresAt, revokedAt: null, createdAt: now() };
      data.invitations.push({ ...invite, acceptedBy: [] }); event(data, user, register.id, 'Създадена покана', 'Генерирана връзка за достъп', { subregisterId: p.subregisterId, ownerOnly: true }); return invite;
    }, 201),
    route('delete', '/invitations/:invitationId', true, ({ data, user, p }) => {
      const invite = find(data.invitations, p.invitationId); owner(find(data.registers, invite.registerId), user);
      if (!invite.revokedAt) { invite.revokedAt = now(); event(data, user, invite.registerId, 'Отменена покана', 'Връзката вече не е активна', { subregisterId: invite.subregisterId, ownerOnly: true }); }
      const { acceptedBy: _acceptedBy, ...result } = invite; return result;
    }),
    route('post', '/invitations/:token/accept', true, ({ data, user, p, url, body }) => {
      params(url, []); fields(body, []);
      const invite = data.invitations.find(invite => invite.token === p.token) ?? fail(404, 'NOT_FOUND', 'Поканата не е намерена.');
      if (invite.revokedAt || Date.parse(invite.expiresAt) <= Date.now()) fail(410, 'INVITATION_UNAVAILABLE', 'Поканата е изтекла или отменена.');
      const register = find(data.registers, invite.registerId);
      if (register.ownerId === user.id) fail(422, 'INVALID_TRANSITION', 'Администраторът вече има достъп до този обхват.');
      let member = data.memberships.find(member => member.subregisterId === invite.subregisterId && member.userId === user.id);
      if (invite.acceptedBy.includes(user.id)) {
        if (!member) fail(422, 'INVALID_TRANSITION', 'Достъпът е премахнат. Необходима е нова покана.');
        return subView(data, find(data.subregisters, invite.subregisterId), user);
      }
      if (member) member.role = invite.role;
      else { member = { userId: user.id, subregisterId: invite.subregisterId, role: invite.role, createdAt: now() }; data.memberships.push(member); }
      invite.acceptedBy.push(user.id);
      event(data, user, register.id, 'Приета покана', user.name, { subregisterId: invite.subregisterId, ownerOnly: true }); return subView(data, find(data.subregisters, invite.subregisterId), user);
    }),
    route('get', '/registers/:registerId/subregisters/:subregisterId/memberships', false, ({ data, user, p, url }) => {
      params(url, []); const register = find(data.registers, p.registerId); owner(register, user); scopeFor(data, register, p.subregisterId, user);
      return page(data.memberships.filter(member => member.subregisterId === p.subregisterId).map(member => memberView(data, member)), url);
    }),
    ...['patch', 'delete'].map(method => route(method, '/registers/:registerId/subregisters/:subregisterId/memberships/:userId', true, ({ data, user, p, body }) => {
      const register = find(data.registers, p.registerId); owner(register, user); scopeFor(data, register, p.subregisterId, user);
      const member = data.memberships.find(member => member.subregisterId === p.subregisterId && member.userId === p.userId) ?? fail(404, 'NOT_FOUND', 'Членството не е намерено.');
      if (method === 'patch') { fields(body, ['role']); member.role = choice(body.role, ['participant', 'guest'], 'role'); }
      else data.memberships = data.memberships.filter(entry => entry !== member);
      event(data, user, register.id, method === 'patch' ? 'Променена роля' : 'Премахнат достъп', find(data.users, member.userId).name, { subregisterId: p.subregisterId, ownerOnly: true });
      return method === 'patch' ? memberView(data, member) : null;
    }, method === 'delete' ? 204 : 200)),
    route('get', '/requests', false, ({ data, user, url }) => {
      params(url, ['registerId', 'subregisterId', 'status']);
      const status = url.searchParams.get('status'); if (status) choice(status, ['pending', 'approved', 'rejected'], 'status');
      return page(data.requests.filter(request => {
        const register = find(data.registers, request.registerId);
        const member = data.memberships.find(member => member.subregisterId === request.subregisterId && member.userId === user.id);
        const sub = find(data.subregisters, request.subregisterId);
        return (register.ownerId === user.id || (request.requesterId === user.id && member?.role === 'participant' && sub.assetIds.includes(request.assetId)))
          && (!status || request.status === status) && ['registerId', 'subregisterId'].every(key => !url.searchParams.get(key) || request[key] === url.searchParams.get(key));
      }).map(request => requestView(data, request)), url);
    }),
    route('post', '/registers/:registerId/requests', true, ({ data, user, p, body }) => {
      const register = find(data.registers, p.registerId);
      fields(body, ['subregisterId', 'assetId', 'kind', 'note', 'location']);
      text(body, 'subregisterId', 100, true);
      if (!Number.isInteger(body.assetId) || body.assetId < 1) invalid('assetId', 'Посочете номера на актива.');
      const { subregister, role } = scopeFor(data, register, body.subregisterId, user);
      if (role !== 'participant') fail(403, 'FORBIDDEN', 'Само участник в подрегистъра може да подава проверки и заявки.');
      const asset = find(data.assets.filter(asset => asset.registerId === register.id && subregister.assetIds.includes(asset.id)), body.assetId);
      if (asset.archivedAt || asset.status === 'Бракуван') fail(422, 'ASSET_UNAVAILABLE', 'Активът не е достъпен за проверка.');
      const kind = choice(body.kind, ['present', 'missing', 'location', 'disposal'], 'kind');
      const note = text(body, 'note', 500, kind !== 'present') ?? '';
      const location = text(body, 'location', 120, kind === 'location') ?? '';
      if (kind !== 'location' && location) invalid('location', 'Местоположение се подава само при заявка за преместване.');
      if (kind === 'location' && location === asset.location) invalid('location', 'Посочете различно местоположение.');
      if (data.requests.some(request => request.subregisterId === subregister.id && request.assetId === asset.id && request.requesterId === user.id && request.kind === kind && request.status === 'pending')) fail(422, 'DUPLICATE_REQUEST', 'Вече има такава заявка, която чака решение.');
      const at = now();
      const request = { id: id(), registerId: register.id, subregisterId: subregister.id, assetId: asset.id, requesterId: user.id, kind, note, location, originalLocation: asset.location, originalStatus: asset.status, status: kind === 'present' ? 'approved' : 'pending', reason: '', createdAt: at, decidedAt: kind === 'present' ? at : null, decidedById: null };
      data.requests.unshift(request);
      event(data, user, register.id, kind === 'present' ? 'Потвърдена наличност' : 'Подадена заявка', `${requestLabels[kind]} · ${asset.name} · ${asset.inventoryNumber}`, { subregisterId: subregister.id, assetId: asset.id, participantId: user.id }); return requestView(data, request);
    }, 201),
    route('patch', '/requests/:requestId', true, ({ data, user, p, body }) => {
      const request = find(data.requests, p.requestId); const register = find(data.registers, request.registerId); owner(register, user);
      fields(body, ['status', 'reason']); const status = choice(body.status, ['approved', 'rejected'], 'status');
      if (request.status !== 'pending') fail(422, 'INVALID_TRANSITION', 'Заявката вече е обработена.');
      const reason = text(body, 'reason', 500, status === 'rejected') ?? '';
      const asset = find(data.assets, request.assetId); const sub = find(data.subregisters, request.subregisterId);
      if (status === 'approved' && (asset.archivedAt || asset.status === 'Бракуван' || !sub.assetIds.includes(asset.id))) fail(422, 'ASSET_UNAVAILABLE', 'Активът вече не е достъпен за тази заявка. Отхвърлете я и поискайте нова проверка.');
      const before = asset.location;
      if (status === 'approved' && ['location', 'disposal'].includes(request.kind)) {
        if (request.kind === 'location') asset.location = request.location;
        else asset.status = 'Бракуван';
        asset.updatedAt = now();
        event(data, user, register.id, 'Променен актив', `${asset.name} · ${request.kind === 'location' ? `${before} → ${asset.location}` : 'Бракуван'}`, { assetId: asset.id });
      }
      Object.assign(request, { status, reason, decidedAt: now(), decidedById: user.id });
      event(data, user, register.id, status === 'approved' ? 'Одобрена заявка' : 'Отхвърлена заявка', `${requestLabels[request.kind]} · ${asset.name}${reason ? ` · ${reason}` : ''}`, { subregisterId: sub.id, assetId: asset.id, participantId: request.requesterId }); return requestView(data, request);
    }),
    route('get', '/registers/:registerId/history', false, ({ data, user, p, url }) => {
      params(url, ['subregisterId']); const register = find(data.registers, p.registerId);
      const { subregister, role } = scopeFor(data, register, url.searchParams.get('subregisterId'), user);
      const events = data.history.filter(event => event.registerId === register.id
        && (!subregister || event.subregisterId === subregister.id || (!event.subregisterId && event.assetId && subregister.assetIds.includes(event.assetId)))
        && (role === 'owner' || (!event.ownerOnly && (!event.participantId || event.participantId === user.id) && (!event.assetId || subregister.assetIds.includes(event.assetId)))));
      return page(events.map(({ actorId, participantId: _participantId, ownerOnly: _ownerOnly, ...event }) => ({ ...event, actor: find(data.users, actorId) })), url);
    }),
  ];
}
