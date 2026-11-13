// On-device storage for the PWA: IndexedDB (works offline, larger quota, survives in the
// service-worker era), with a localStorage fallback for private modes that block IndexedDB.
const Store = (() => {
  const DB = 'littlebites', OBJ = 'kv';
  let dbp = null;
  const open = () => new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no idb'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(OBJ);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('blocked'));
  });
  const db = () => dbp || (dbp = open().catch((e) => { dbp = null; throw e; }));

  async function get(key) {
    try {
      const d = await db();
      return await new Promise((resolve, reject) => {
        const q = d.transaction(OBJ).objectStore(OBJ).get(key);
        q.onsuccess = () => resolve(q.result);
        q.onerror = () => reject(q.error);
      });
    } catch (_) {
      try { return JSON.parse(localStorage.getItem('lb.' + key)) || undefined; } catch (_) { return undefined; }
    }
  }
  async function set(key, val) {
    try {
      const d = await db();
      await new Promise((resolve, reject) => {
        const t = d.transaction(OBJ, 'readwrite');
        t.objectStore(OBJ).put(JSON.parse(JSON.stringify(val)), key);
        t.oncomplete = resolve; t.onerror = () => reject(t.error); t.onabort = () => reject(t.error);
      });
    } catch (_) {
      try { localStorage.setItem('lb.' + key, JSON.stringify(val)); } catch (_) {}
    }
  }
  async function del(key) {
    try {
      const d = await db();
      await new Promise((resolve, reject) => { const t = d.transaction(OBJ, 'readwrite'); t.objectStore(OBJ).delete(key); t.oncomplete = resolve; t.onerror = () => reject(t.error); });
    } catch (_) { try { localStorage.removeItem('lb.' + key); } catch (_) {} }
  }
  return { get, set, del };
})();
