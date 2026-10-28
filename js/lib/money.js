// Dinheiro em pt-BR: "1.234,56" <-> 1234.56
export const parseBRL = v => { if (typeof v === 'number') return v; const n = Number(String(v || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
export const brl = (n, cents = true) => 'R$ ' + (Math.round(n * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
export const brlShort = n => brl(n, n % 1 !== 0 && n < 1000);
// Meses de aporte até o prazo, contados como no protótipo da Área Financeira:
// de outubro a dezembro = 2 aportes (nov e dez). Mínimo 1 quando o prazo é futuro.
export function monthsUntil(today, deadline) {
  if (!deadline) return null;
  if (deadline < today) return -1;
  const [y1, m1] = today.split('-').map(Number), [y2, m2] = deadline.split('-').map(Number);
  return Math.max(1, (y2 - y1) * 12 + (m2 - m1));
}
