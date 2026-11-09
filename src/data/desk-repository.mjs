/**
 * Read models for React over the existing schema-v8 storage service.
 *
 * controller is the compatibility interface used by the ONE existing business
 * command owner. It forwards arguments, return values, write ordering, atomic
 * rollback, the sync commit observer, and stale-window protection unchanged.
 * React consumers receive detached, deeply frozen, referentially stable values
 * only after successful persistence. They cannot mutate the working store.
 *
 * No database, storage key, serialization, retry, or sync policy lives here.
 */
export function createDeskRepository(storage, events = globalThis) {
  const snapshots = new Map();
  const listeners = new Map();
  const statusListeners = new Set();
  let status = Object.freeze({ ready:false, stale:false, pending:0, revision:null, mode:null, error:null });
  let atomicCalls = 0;
  let scheduled = false;
  let disposed = false;
  let dirty = false;
  let writeVersion = 0;

  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  function notify(subscribers) {
    for (const listener of [...(subscribers || [])]) {
      // A broken view must never turn a successful database commit into failure.
      try { listener(); } catch (error) { events.reportError?.(error); }
    }
  }
  function publish() {
    if (disposed) return;
    const current = storage.status();
    const next = {
      ready:!!current.loaded, stale:!!current.stale, pending:current.pending,
      revision:current.revision, mode:current.mode, error:current.lastError,
    };
    const changed = JSON.stringify(next) !== JSON.stringify(status);
    status = changed ? Object.freeze(next) : status;
    // The synchronous storage API contains a mutable working copy while a save
    // is pending. Never expose that copy, including during an atomic rollback.
    if (next.ready && !next.stale && !next.pending && !next.error && !atomicCalls && !dirty) {
      for (const [key, previous] of snapshots) {
        const value = storage.getObject(key);
        const fingerprint = JSON.stringify(value);
        if (fingerprint !== previous.fingerprint) {
          snapshots.set(key, { fingerprint, value:freeze(structuredClone(value)) });
          notify(listeners.get(key));
        }
      }
    }
    if (changed) notify(statusListeners);
  }
  async function settled() {
    const version = writeVersion;
    try {
      const result = await storage.whenSaved();
      if (version === writeVersion && !atomicCalls) dirty = false;
      return result;
    } finally { publish(); }
  }
  function schedule() {
    if (scheduled || atomicCalls || disposed) return;
    scheduled = true;
    queueMicrotask(async () => {
      scheduled = false;
      if (disposed || atomicCalls) return;
      // The service owns retries/error reporting. Observing a failed background
      // save must not create an unhandled rejection or a second retry loop.
      try { await settled(); } catch { /* status.error retains the failure */ }
    });
  }
  const controller = { ...storage };
  for (const method of ['set','setCollection','remove']) {
    controller[method] = (...args) => {
      const result = storage[method](...args);
      dirty = true; writeVersion++;
      schedule();
      return result;
    };
  }
  controller.atomic = async fn => {
    atomicCalls++;
    try { return await storage.atomic(fn); }
    finally {
      atomicCalls--;
      if (!atomicCalls && !storage.status().pending) dirty = false;
      publish();
    }
  };
  controller.load = async (...args) => {
    try { return await storage.load(...args); }
    finally { publish(); }
  };
  controller.whenSaved = settled;
  // Keep the existing sync observer and storage error handler exclusively owned
  // by the controller. Neither is replaced to implement React subscriptions.
  events.addEventListener?.('roseachy:external-change', publish);
  publish();
  return Object.freeze({
    controller:Object.freeze(controller),
    getSnapshot(key) {
      if (!storage.KEYS.includes(key)) throw new Error(`Unknown Roseachy storage key: ${key}`);
      if (!snapshots.has(key)) {
        snapshots.set(key, { fingerprint:undefined, value:null });
        publish();
      }
      return snapshots.get(key).value;
    },
    subscribe(key, listener) {
      this.getSnapshot(key);
      const set = listeners.get(key) || new Set();
      listeners.set(key,set); set.add(listener);
      return () => set.delete(listener);
    },
    getStatus:() => status,
    subscribeStatus(listener) { statusListeners.add(listener); return () => statusListeners.delete(listener); },
    settled,
    dispose() {
      disposed = true;
      events.removeEventListener?.('roseachy:external-change', publish);
      listeners.clear(); statusListeners.clear();
    },
  });
}
