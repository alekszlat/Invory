export const demoUsers = [
  { id: 'accounting', name: 'Елена · Счетоводство', email: 'elena@example.test' },
  { id: 'custodian', name: 'Иван · МОЛ', email: 'ivan@example.test' },
  { id: 'viewer', name: 'Мария · Преглед', email: 'maria@example.test' },
];
export const mockStorageKey = 'invory.mock.database.v1';
export const mockIdentityKey = 'invory.mock.user.v1';
const legacyStorageKey = 'invory.react.registry.v1';

export function seedDatabase() {
  const at = '2026-11-01T09:00:00.000Z';
  return {
    version: 1, users: structuredClone(demoUsers),
    registers: [{ id: 'demo-register', name: 'Демо регистър', description: 'Измислени данни за локални проверки.', ownerId: 'accounting', createdAt: at, updatedAt: at }],
    assets: [{ id: 'demo-asset', registerId: 'demo-register', name: 'Монитор Dell 24″', inventoryNumber: 'INV-001', location: 'Каб. 302', custodian: 'Иван', acquiredOn: '2026-10-01', unit: 'бр.', quantity: 1, status: 'Активен', sourceDocument: 'Демо протокол 1', archivedAt: null, version: 1, createdAt: at, updatedAt: at }],
    subregisters: [{ id: 'demo-scope', registerId: 'demo-register', name: 'Каб. 302', assetIds: ['demo-asset'], version: 1, createdAt: at, updatedAt: at }],
    memberships: [
      { subregisterId: 'demo-scope', userId: 'custodian', role: 'participant', createdAt: at },
      { subregisterId: 'demo-scope', userId: 'viewer', role: 'guest', createdAt: at },
    ], invitations: [], requests: [],
    history: [{ id: 'demo-event', registerId: 'demo-register', subregisterId: null, assetId: 'demo-asset', actorId: 'accounting', participantId: null, ownerOnly: false, at, title: 'Добавен актив', details: 'Монитор Dell 24″ · INV-001' }],
  };
}

function initialDatabase(storage) {
  const data = seedDatabase();
  const raw = storage.getItem(legacyStorageKey);
  if (!raw) return data;
  let legacy;
  try { legacy = JSON.parse(raw); } catch { return data; }
  if (legacy.version !== 1 || !Array.isArray(legacy.registers)) return data;
  const importedAt = new Date().toISOString();
  for (const register of legacy.registers) {
    if (typeof register.id !== 'string' || !register.id || typeof register.name !== 'string' || !Array.isArray(register.assets)) continue;
    const ownerId = data.users.some(user => user.id === register.ownerId) ? register.ownerId : data.users[0].id;
    data.registers.push({ id: register.id, name: register.name, description: register.description ?? '', ownerId, createdAt: importedAt, updatedAt: importedAt });
    for (const asset of register.assets) {
      if (typeof asset.id !== 'string' || !asset.id) continue;
      data.assets.push({ ...asset, registerId: register.id, acquiredOn: asset.acquiredOn || null, archivedAt: null, version: 1, createdAt: importedAt, updatedAt: importedAt });
    }
    for (const sub of register.subregisters ?? []) {
      if (typeof sub.id !== 'string' || !sub.id) continue;
      data.subregisters.push({ id: sub.id, registerId: register.id, name: sub.name, assetIds: sub.assetIds ?? [], version: 1, createdAt: importedAt, updatedAt: importedAt });
      for (const member of sub.members ?? []) {
        if (data.users.some(user => user.id === member.profileId) && ['participant', 'guest'].includes(member.role)) {
          data.memberships.push({ subregisterId: sub.id, userId: member.profileId, role: member.role, createdAt: importedAt });
        }
      }
    }
    for (const request of register.requests ?? []) {
      data.requests.push({ ...request, registerId: register.id, originalAssetVersion: 1, reason: request.reason ?? '', decidedAt: request.decidedAt ?? null, decidedById: request.status === 'pending' ? null : ownerId });
    }
    for (const history of register.history ?? []) {
      const { profileId, ...entry } = history;
      data.history.push({ registerId: register.id, subregisterId: null, assetId: null, participantId: null, ownerOnly: false, ...entry, actorId: profileId });
    }
  }
  return data;
}

export function createDatabase(storage) {
  let memory = seedDatabase();
  function read() {
    if (!storage) return structuredClone(memory);
    const raw = storage.getItem(mockStorageKey);
    if (raw === null) {
      const seed = initialDatabase(storage);
      storage.setItem(mockStorageKey, JSON.stringify(seed));
      return seed;
    }
    const data = JSON.parse(raw);
    if (data.version !== 1 || !['users', 'registers', 'assets', 'subregisters', 'memberships', 'invitations', 'requests', 'history'].every(key => Array.isArray(data[key]))) {
      throw new Error('Невалидни демо данни. Използвайте „Нулирай демо данните“.');
    }
    return data;
  }
  function save(data) {
    if (storage) storage.setItem(mockStorageKey, JSON.stringify(data));
    else memory = structuredClone(data);
  }
  return {
    read,
    run(write, operation) {
      const execute = () => {
        const data = read();
        const result = operation(data);
        if (write) save(data);
        return result;
      };
      // One lock covers the canonical record, request decision, and generated history.
      return (storage && globalThis.navigator?.locks?.request(mockStorageKey, execute)) ?? Promise.resolve().then(execute);
    },
    reset() { save(seedDatabase()); },
  };
}
