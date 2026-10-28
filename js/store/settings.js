import { get, save, list } from './repo.js';
import { DEFAULT_HABITS } from './schema.js';
import { seedShopping } from '../lib/shopping.js';

const ID = 'app';
export const getSettings = async () => (await get('settings', ID)) || { id: ID, name: '', theme: 'auto' };
export const saveSettings = async patch => save('settings', { ...(await getSettings()), ...patch, id: ID });

export function applyTheme(theme) {
  const root = document.documentElement;
  theme === 'auto' ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', theme);
  // Barra de status do celular acompanha o tema escolhido
  document.querySelectorAll('meta[name=theme-color]').forEach(m => {
    if (theme === 'auto') m.setAttribute('content', m.media.includes('dark') ? '#15131C' : '#F6F4FB');
    else m.setAttribute('content', theme === 'dark' ? '#15131C' : '#F6F4FB');
  });
}

// Primeira abertura: cria os hábitos iniciais uma única vez
export async function seedOnce() {
  const s = await getSettings();
  if (!s.seeded) {
    if (!(await list('habits')).length) {
      let order = 0;
      for (const [name, area] of DEFAULT_HABITS) await save('habits', { name, area, frequency: 'daily', days: [], goal: 1, active: true, order: order++ });
    }
    await saveSettings({ seeded: true });
  }
  if ((s.seedVersion || 1) < 2) { await seedShopping(); await saveSettings({ seedVersion: 2 }); }
}
