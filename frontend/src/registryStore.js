export const storageKey = 'invory.react.registry.v1';

export const profiles = [
  { id: 'accounting', name: 'Елена · Счетоводство' },
  { id: 'custodian', name: 'Иван · МОЛ' },
  { id: 'viewer', name: 'Мария · Преглед' },
];

export const roleLabels = { owner: 'Администратор', participant: 'Участник', guest: 'Гост' };
export const requestLabels = { missing: 'Липсващ актив', location: 'Промяна на местоположение', disposal: 'Предложение за бракуване' };
export const requestStatuses = { pending: 'За преглед', approved: 'Одобрена', rejected: 'Отхвърлена' };

function newId() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), part =>
    part.toString(16).padStart(8, '0'),
  ).join('');
}

export function readRegisters() {
  const raw = localStorage.getItem(storageKey);
  if (raw === null) return [];

  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.registers)) {
    throw new Error('Форматът на запазените регистри не се разпознава.');
  }
  return data.registers.map(register => ({
    ownerId: profiles[0].id,
    subregisters: [],
    requests: [],
    history: [],
    ...register,
  }));
}

export function subregisterRole(register, subregister, profileId) {
  if (register.ownerId === profileId) return 'owner';
  return subregister.members.find(member => member.profileId === profileId)?.role;
}

export function visibleHistory(register, subregister, profileId) {
  if (register.ownerId === profileId) {
    return subregister
      ? register.history.filter(event => event.subregisterId === subregister.id
          || (!event.subregisterId && subregister.assetIds.includes(event.assetId)))
      : register.history;
  }
  if (!subregister || !subregisterRole(register, subregister, profileId)) return [];
  return register.history.filter(event =>
    !event.ownerOnly
      && (!event.participantId || event.participantId === profileId)
      && (event.assetId
        ? subregister.assetIds.includes(event.assetId) && (!event.subregisterId || event.subregisterId === subregister.id)
        : event.subregisterId === subregister.id),
  );
}

function updateRegisters(update) {
  const save = () => {
    const registers = update(readRegisters());
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, registers }));
    return registers;
  };

  return navigator.locks?.request(storageKey, save) ?? Promise.resolve().then(save);
}

function historyEvent(profileId, title, details, scope = {}) {
  return { id: newId(), at: new Date().toISOString(), profileId, title, details, ...scope };
}

function changeRegister(registerId, update) {
  return updateRegisters(registers => {
    const index = registers.findIndex(entry => entry.id === registerId);
    if (index < 0) throw new Error('Регистърът не е намерен.');
    return registers.map((register, position) => position === index ? update(register) : register);
  });
}

function requireOwner(register, profileId) {
  if (register.ownerId !== profileId) throw new Error('Действието е достъпно за администратора на регистъра.');
}

function record(register, event) {
  return { ...register, history: [event, ...register.history] };
}

export async function createRegister(values, profileId = profiles[0].id) {
  const name = values.name.trim();
  if (!name) throw new Error('Въведете име на регистъра.');

  const register = {
    id: newId(),
    name,
    description: values.description.trim(),
    ownerId: profileId,
    assets: [],
    subregisters: [],
    requests: [],
    history: [historyEvent(profileId, 'Създаден регистър', name)],
  };
  const registers = await updateRegisters(current => [...current, register]);
  return { register, registers };
}

export function addAsset(registerId, values, profileId = profiles[0].id) {
  const name = values.name.trim();
  const inventoryNumber = values.inventoryNumber.trim();
  const location = values.location.trim();
  const quantity = Number(values.quantity);

  if (!name || !inventoryNumber || !location) {
    throw new Error('Въведете наименование, инвентарен номер и местоположение.');
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Въведете количество, по-голямо от нула.');
  }

  const asset = {
    id: newId(),
    name,
    inventoryNumber,
    location,
    custodian: values.custodian.trim(),
    acquiredOn: values.acquiredOn,
    unit: values.unit.trim() || 'бр.',
    quantity,
    status: values.status,
    sourceDocument: values.sourceDocument.trim(),
  };

  return changeRegister(registerId, register => {
    requireOwner(register, profileId);
    const numberKey = inventoryNumber.toLocaleUpperCase('bg');
    if (register.assets.some(entry => entry.inventoryNumber.toLocaleUpperCase('bg') === numberKey)) {
      throw new Error('В този регистър вече има актив с този инвентарен номер.');
    }

    return record({ ...register, assets: [...register.assets, asset] },
      historyEvent(profileId, 'Добавен актив', `${asset.name} · ${asset.inventoryNumber}`, { assetId: asset.id }));
  });
}

export function createSubregister(registerId, profileId, values) {
  const name = values.name.trim();
  if (!name) throw new Error('Въведете име на подрегистъра.');
  return changeRegister(registerId, register => {
    requireOwner(register, profileId);
    const subregister = { id: newId(), name, assetIds: [], members: [] };
    return record({ ...register, subregisters: [...register.subregisters, subregister] },
      historyEvent(profileId, 'Създаден подрегистър', name, { subregisterId: subregister.id }));
  });
}

function changeSubregister(registerId, subregisterId, profileId, update) {
  return changeRegister(registerId, register => {
    requireOwner(register, profileId);
    const subregister = register.subregisters.find(entry => entry.id === subregisterId);
    if (!subregister) throw new Error('Подрегистърът не е намерен.');
    const { changes, event } = update(register, subregister);
    const subregisters = register.subregisters.map(entry =>
      entry.id === subregisterId ? { ...entry, ...changes } : entry);
    return record({ ...register, subregisters }, { ...event, subregisterId });
  });
}

export function assignAssets(registerId, subregisterId, profileId, assetIds, originalIds) {
  return changeSubregister(registerId, subregisterId, profileId, (register, subregister) => {
    const previous = new Set(subregister.assetIds);
    if (originalIds && (originalIds.length !== previous.size || originalIds.some(id => !previous.has(id)))) {
      throw new Error('Обхватът е променен в друг прозорец. Отворете формата отново.');
    }
    const selected = new Set(assetIds);
    const assets = register.assets.filter(asset => selected.has(asset.id));
    if (assets.length !== selected.size) throw new Error('Някои от избраните активи вече не са достъпни.');
    const added = assets.filter(asset => !previous.has(asset.id)).length;
    const removed = subregister.assetIds.filter(id => !selected.has(id)).length;
    return {
      changes: { assetIds: assets.map(asset => asset.id) },
      event: historyEvent(profileId, 'Обновен обхват', `${added} добавени и ${removed} премахнати записа`),
    };
  });
}

export function inviteProfile(registerId, subregisterId, profileId, values) {
  const invitee = profiles.find(entry => entry.id === values.inviteeId && entry.id !== profileId);
  const role = values.role;
  if (!invitee || !['participant', 'guest'].includes(role)) throw new Error('Изберете профил и роля.');
  return changeSubregister(registerId, subregisterId, profileId, (_register, subregister) => {
    const existing = subregister.members.some(member => member.profileId === invitee.id);
    const members = [...subregister.members.filter(member => member.profileId !== invitee.id), { profileId: invitee.id, role }];
    return {
      changes: { members },
      event: historyEvent(profileId, existing ? 'Променена роля' : 'Поканен профил',
        `${invitee.name} · ${roleLabels[role]}`, { ownerOnly: true }),
    };
  });
}

export function submitObservation(registerId, subregisterId, assetId, profileId, values, expectedAsset) {
  return changeRegister(registerId, register => {
    const subregister = register.subregisters.find(entry => entry.id === subregisterId);
    const asset = register.assets.find(entry => entry.id === assetId);
    if (!subregister || subregisterRole(register, subregister, profileId) !== 'participant'
      || !asset || !subregister.assetIds.includes(asset.id) || asset.status === 'Бракуван') {
      throw new Error('Активът не е достъпен за тази проверка.');
    }
    if (expectedAsset && (asset.location !== expectedAsset.location || asset.status !== expectedAsset.status)) {
      throw new Error('Данните за актива са обновени. Отворете проверката отново.');
    }
    const kind = values.kind;
    const assetLabel = `${asset.name} · ${asset.inventoryNumber}`;
    const scope = { subregisterId, assetId, participantId: profileId };
    if (kind === 'present') {
      return record(register, historyEvent(profileId, 'Потвърдена наличност', assetLabel, scope));
    }
    const note = values.note?.trim() ?? '';
    const location = values.location?.trim() ?? '';
    if (!Object.hasOwn(requestLabels, kind) || !note) throw new Error('Посочете вида на заявката и опишете причината.');
    if (kind === 'location' && (!location || location === asset.location)) {
      throw new Error('Въведете местоположение, различно от това по регистър.');
    }
    if (register.requests.some(entry => entry.assetId === assetId && entry.subregisterId === subregisterId
      && entry.kind === kind && entry.requesterId === profileId && entry.status === 'pending')) {
      throw new Error('Вече има такава заявка за този актив, която чака решение.');
    }
    const request = {
      id: newId(), assetId, subregisterId, requesterId: profileId, kind, note, location,
      originalLocation: asset.location, originalStatus: asset.status, status: 'pending', createdAt: new Date().toISOString(),
    };
    return record({ ...register, requests: [request, ...register.requests] },
      historyEvent(profileId, 'Подадена заявка', `${requestLabels[kind]} · ${assetLabel}`, scope));
  });
}

export function decideRequest(registerId, requestId, profileId, decision, reason = '') {
  return changeRegister(registerId, register => {
    requireOwner(register, profileId);
    const request = register.requests.find(entry => entry.id === requestId);
    if (!request || request.status !== 'pending') throw new Error('Заявката вече не чака решение.');
    if (!['approved', 'rejected'].includes(decision)) throw new Error('Изберете решение.');
    reason = reason.trim();
    if (decision === 'rejected' && !reason) throw new Error('Въведете причина за отказа.');

    const asset = register.assets.find(entry => entry.id === request.assetId);
    const subregister = register.subregisters.find(entry => entry.id === request.subregisterId);
    const approved = decision === 'approved';
    if (approved && (!asset || !subregister?.assetIds.includes(asset.id)
      || asset.location !== request.originalLocation || asset.status !== request.originalStatus)) {
      throw new Error('Активът е променен или преместен в друг обхват. Отхвърлете тази заявка и поискайте нова проверка.');
    }
    const change = approved && request.kind === 'location'
      ? { location: request.location }
      : approved && request.kind === 'disposal' ? { status: 'Бракуван' } : null;
    const assets = change ? register.assets.map(entry => entry.id === asset.id ? { ...entry, ...change } : entry) : register.assets;
    const requests = register.requests.map(entry => entry.id === request.id
      ? { ...entry, status: decision, reason, decidedAt: new Date().toISOString() } : entry);

    const scope = { assetId: request.assetId, subregisterId: request.subregisterId };
    let result = record({ ...register, assets, requests },
      historyEvent(profileId, approved ? 'Одобрена заявка' : 'Отхвърлена заявка',
        `${requestLabels[request.kind]} · ${asset?.name ?? 'Актив'}${reason ? ' · ' + reason : ''}`,
        { ...scope, participantId: request.requesterId }));
    if (change) {
      const details = change.location ? `${asset.location} → ${change.location}` : `${asset.status} → Бракуван`;
      result = record(result, historyEvent(profileId, 'Променен актив',
        `${asset.name} · ${asset.inventoryNumber} · ${details}`, { assetId: asset.id }));
    }
    return result;
  });
}
