import { DB_NAME, DB_VERSION, STORES } from './schema.js';

let dbPromise;
export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); });
    };
    // Outra aba/versão antiga aberta segurando o banco: avisa em vez de ficar em branco
    req.onblocked = () => document.dispatchEvent(new CustomEvent('db-blocked'));
    req.onsuccess = () => {
      const db = req.result;
      // Nova versão do app quer atualizar o banco: esta aba solta e recarrega
      db.onversionchange = () => { db.close(); location.reload(); };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function tx(store, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const result = fn(t.objectStore(store));
    t.oncomplete = () => resolve(result && 'result' in result ? result.result : result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Não foi possível salvar (espaço cheio?).'));
  });
}
