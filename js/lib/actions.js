// Ações com "Desfazer": nada é apagado sem chance de voltar atrás
import { remove, restore } from '../store/repo.js';
import { toast } from '../components/ui.js';

export async function removeWithUndo(store, ids, msg) {
  const prev = [];
  for (const id of [].concat(ids)) { const r = await remove(store, id); if (r) prev.push(r); }
  if (prev.length) toast(msg, { undo: async () => { for (const r of prev) await restore(store, r); } });
}
