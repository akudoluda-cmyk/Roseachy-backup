/** Immutable draft snapshots. This module has no DOM or business-storage access. */
export function createFormState(initial) {
  let snapshot = { fields: initial, pending: {}, error: '' };
  const listeners = new Set();
  function publish(next) {
    snapshot = next;
    for (const listener of listeners) listener();
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    patch(id, patch) {
      if (!Object.hasOwn(snapshot.fields, id)) throw new Error(`Unknown form field: ${id}`);
      const field = snapshot.fields[id];
      if (Object.entries(patch).every(([key,value]) => field[key] === value)) return;
      publish({ ...snapshot, fields: { ...snapshot.fields, [id]: { ...field, ...patch } } });
    },
    async command(id, execute) {
      if (snapshot.pending[id]) return false;
      publish({ ...snapshot, pending: { ...snapshot.pending, [id]: true }, error: '' });
      try { return await execute(); }
      catch (error) {
        publish({ ...snapshot, error: error.message || String(error) });
        throw error;
      } finally {
        publish({ ...snapshot, pending: { ...snapshot.pending, [id]: false } });
      }
    },
  };
}
