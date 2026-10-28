import { STORES, DB_VERSION } from './schema.js';
import { dumpAll, putMany, getRaw } from './repo.js';
import { saveSettings } from './settings.js';
import { encryptText, decryptText } from '../lib/crypto.js';

// Backup protegido por senha (AES-256). Sem a senha, o arquivo é ilegível.
export async function exportBackup(password) {
  if (!password || password.length < 6) throw new Error('A senha do backup precisa ter pelo menos 6 caracteres.');
  const data = { app: 'planner', version: DB_VERSION, exportedAt: new Date().toISOString(), data: await dumpAll(STORES) };
  const box = { app: 'planner', version: DB_VERSION, exportedAt: data.exportedAt, ...(await encryptText(JSON.stringify(data), password)) };
  const name = `planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([JSON.stringify(box)], name, { type: 'application/json' });
  // No iPhone instalado, download direto costuma falhar: usa o "Compartilhar" do sistema
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Backup do planner' }); }
    catch (e) { if (e.name === 'AbortError') return false; throw new Error('Não foi possível compartilhar o backup.'); }
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  await saveSettings({ lastBackupAt: new Date().toISOString() });
  return true;
}

// Mescla registro a registro: só substitui se a cópia do backup for mais recente.
// Assim restaurar um backup antigo nunca apaga o que foi feito depois dele.
export const isEncrypted = async file => { try { return !!JSON.parse(await file.text()).enc; } catch { return false; } };
export async function importBackup(file, password) {
  let json;
  try { json = JSON.parse(await file.text()); } catch { throw new Error('Arquivo ilegível. Escolha o .json exportado pelo planner.'); }
  if (json?.enc) { if (!password) throw new Error('Este backup tem senha.'); json = JSON.parse(await decryptText(json, password)); }
  if (json?.app !== 'planner' || typeof json.data !== 'object' || !json.data) throw new Error('Este arquivo não é um backup do planner.');
  let added = 0, kept = 0;
  for (const s of STORES) {
    const rows = Array.isArray(json.data[s]) ? json.data[s].filter(r => r && r.id) : [];
    const take = [];
    for (const r of rows) {
      if (s === 'settings') continue; // preferências deste aparelho ficam como estão
      const cur = await getRaw(s, r.id);
      if (!cur || (r.updatedAt || '') > (cur.updatedAt || '')) take.push(r); else kept++;
    }
    if (take.length) { await putMany(s, take); added += take.length; }
  }
  return { added, kept };
}
