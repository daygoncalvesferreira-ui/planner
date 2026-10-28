// CRUD genérico. Único ponto que conhece o armazenamento: na Fase 2 a sincronização entra aqui.
import { tx } from './db.js';

const listeners = new Set();
export const onChange = fn => (listeners.add(fn), () => listeners.delete(fn));
const emit = store => listeners.forEach(fn => fn(store));

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export async function get(store, id) {
  const r = await tx(store, 'readonly', s => s.get(id));
  return r && !r.deletedAt ? r : null;
}

export async function list(store, filter = () => true) {
  const all = await tx(store, 'readonly', s => s.getAll());
  return all.filter(r => !r.deletedAt && filter(r));
}

export async function save(store, data) {
  const now = new Date().toISOString();
  const rec = {
    householdId: null, createdBy: null, visibility: 'private', deletedAt: null,
    createdAt: now, ...data, id: data.id || uid(), updatedAt: now
  };
  await tx(store, 'readwrite', s => s.put(rec));
  emit(store);
  return rec;
}

// Exclusão lógica. Devolve o registro anterior para permitir "Desfazer".
export async function remove(store, id) {
  const r = await tx(store, 'readonly', s => s.get(id));
  if (r && !r.deletedAt) { await save(store, { ...r, deletedAt: new Date().toISOString() }); return r; }
  return null;
}
export const restore = (store, rec) => rec && save(store, { ...rec, deletedAt: null });

export async function getRaw(store, id) { return tx(store, 'readonly', s => s.get(id)); }

export async function dumpAll(stores) {
  const out = {};
  for (const s of stores) out[s] = await tx(s, 'readonly', st => st.getAll());
  return out;
}

export async function putMany(store, records) {
  await tx(store, 'readwrite', s => records.forEach(r => s.put(r)));
  emit(store);
}

// Pede ao navegador para não apagar os dados quando faltar espaço
export async function requestPersist() {
  try { return navigator.storage?.persist ? await navigator.storage.persist() : false; } catch { return false; }
}
