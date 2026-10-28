// Cálculos do ciclo menstrual. São estimativas pela média dos ciclos registrados:
// não servem como método contraceptivo nem diagnóstico.
const MS = 864e5;
const P = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const F = t => new Date(t).toISOString().slice(0, 10);
export const addDays = (iso, n) => F(P(iso) + n * MS);
export const diff = (a, b) => Math.round((P(a) - P(b)) / MS);

export const FLOWS = [['leve', 'Leve'], ['medio', 'Médio'], ['intenso', 'Intenso']];
export const SYMPTOMS = ['Cólica', 'Dor de cabeça', 'Inchaço', 'Cansaço', 'Humor alterado', 'Acne', 'Seios sensíveis', 'Desejo por doce', 'Dor nas costas', 'Insônia'];

// Junta dias de menstruação em períodos (aceita 1 dia sem registro no meio)
export function periods(logs) {
  const days = logs.filter(l => l.period).map(l => l.id).sort();
  const out = [];
  for (const d of days) {
    const last = out[out.length - 1];
    if (last && diff(d, last.end) <= 2) last.end = d; else out.push({ start: d, end: d });
  }
  return out;
}

export function analyze(logs, today) {
  const ps = periods(logs).filter(p => p.start <= today);
  const lens = [];
  for (let i = 1; i < ps.length; i++) { const l = diff(ps[i].start, ps[i - 1].start); if (l >= 15 && l <= 60) lens.push(l); }
  const recent = lens.slice(-6);
  const avg = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : 28;
  const plens = ps.slice(-6).map(p => diff(p.end, p.start) + 1).filter(n => n >= 2 && n <= 10);
  const plen = plens.length ? Math.round(plens.reduce((a, b) => a + b, 0) / plens.length) : 5;
  const irregular = recent.length >= 3 && Math.max(...recent) - Math.min(...recent) > 7;
  const last = ps[ps.length - 1];
  if (!last) return { avg, plen, irregular, known: lens.length, last: null };
  const inPeriod = diff(today, last.start) < plen + 1 && diff(today, last.end) <= 1;
  const cycleDay = diff(today, last.start) + 1;
  // Próximas previsões (3 ciclos) a partir do último início
  const next = addDays(last.start, avg);
  const future = [0, 1, 2].map(k => {
    const s = addDays(next, k * avg); const ov = addDays(s, -14);
    return { start: s, end: addDays(s, plen - 1), ovulation: ov, fertileStart: addDays(ov, -5), fertileEnd: addDays(ov, 1) };
  });
  const late = !inPeriod && diff(today, addDays(last.start, avg)) > 0 ? diff(today, addDays(last.start, avg)) : 0;
  return { avg, plen, irregular, known: lens.length, last, inPeriod, cycleDay, future, daysToNext: diff(future[0].start, today), late };
}

// Classificação de um dia para pintar o calendário
export function dayKind(iso, logs, a, today) {
  const log = logs.find(l => l.id === iso);
  if (log?.period) return 'period';
  if (!a?.future || iso < today) return ''; // previsão só olha para frente
  for (const f of a.future) {
    if (iso >= f.start && iso <= f.end) return 'predicted';
    if (iso === f.ovulation) return 'ovulation';
    if (iso >= f.fertileStart && iso <= f.fertileEnd) return 'fertile';
  }
  return '';
}
