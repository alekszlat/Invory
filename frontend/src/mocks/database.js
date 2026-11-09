export const mockStorageKey = 'invory.mock.database.v2';
export const mockIdentityKey = 'invory.mock.user.v1';
const collections = ['users', 'credentials', 'registers', 'assets', 'subregisters', 'memberships', 'invitations', 'requests', 'history'];

// Starts with nothing in it, like a real server on its first day.
function emptyDatabase() {
  return { version: 2, ...Object.fromEntries(collections.map(name => [name, []])) };
}

function readStored(storage) {
  try {
    const data = JSON.parse(storage.getItem(mockStorageKey));
    if (data?.version === 2 && collections.every(name => Array.isArray(data[name]))) return data;
  } catch { /* A damaged copy is handled like a missing one below. */ }
  return null;
}

export function createDatabase(storage) {
  let memory = emptyDatabase();
  function read() {
    if (!storage) return structuredClone(memory);
    const stored = readStored(storage);
    if (stored) return stored;
    // This is throwaway test data and the app has no reset button, so a damaged copy must not lock the tester out.
    const empty = emptyDatabase();
    storage.setItem(mockStorageKey, JSON.stringify(empty));
    return empty;
  }
  function save(data) {
    if (storage) storage.setItem(mockStorageKey, JSON.stringify(data));
    else memory = structuredClone(data);
  }
  return {
    read,
    run(write, operation) {
      const execute = async () => {
        const data = read();
        const result = await operation(data);
        if (write) save(data);
        return result;
      };
      // One lock covers the canonical record, request decision, and generated history.
      return (storage && globalThis.navigator?.locks?.request(mockStorageKey, execute)) ?? Promise.resolve().then(execute);
    },
  };
}
