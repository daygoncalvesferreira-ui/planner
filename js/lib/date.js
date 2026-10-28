// Datas sempre no fuso local (toISOString usaria UTC e trocaria o dia à noite)
const pad = n => String(n).padStart(2, '0');
export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const fromISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

export const weekday = d => { const s = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d); return s[0].toUpperCase() + s.slice(1); };
export const dayMonth = d => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(d);
export const shortDate = s => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(fromISO(s)).replace('.', '');

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
export const isEvening = (d = new Date()) => d.getHours() >= 18;
