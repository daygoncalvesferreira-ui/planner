// Alimentação por hábitos (sem contar calorias) + água + medidas
import { html, useState, useLayoutEffect } from '../lib/preact-htm.js';
import { useList, useRecord, useAutosave } from '../store/hooks.js';
import { save, get } from '../store/repo.js';
import { Section, Sheet, Check, toast } from '../components/ui.js';
import { FOOD_CHECKS, MEALS, MEASURES } from '../lib/fitness.js';
import { markHabit } from '../lib/habit-link.js';
import { saveSettings } from '../store/settings.js';
import { fromISO, toISO, shortDate, weekday, dayMonth } from '../lib/date.js';
import { weekStart } from './treino.js';

const WATER = /[aá]gua/i, FOOD = /aliment/i;
const shift = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const foodScore = log => FOOD_CHECKS.filter(([k]) => log?.checks?.[k]).length;

// Grava o dia lendo o registro atual (evita apagar o que outra parte da tela salvou)
async function saveFood(date, patch, goal) {
  const cur = (await get('foodLogs', date)) || { id: date, checks: {}, water: 0, meals: {}, visibility: 'private' };
  const next = { ...cur, ...patch, checks: { ...cur.checks, ...(patch.checks || {}) }, meals: { ...cur.meals, ...(patch.meals || {}) } };
  await save('foodLogs', next);
  // Hábitos do dia acompanham automaticamente
  if (patch.water != null) await markHabit(WATER, date, next.water >= goal);
  if (patch.checks) await markHabit(FOOD, date, foodScore(next) >= 4);
  return next;
}

export function WaterRow({ date, log, goal }) {
  const w = log?.water || 0;
  const set = n => saveFood(date, { water: Math.max(0, n) }, goal).then(r => { if (n === goal && n > w) toast('Meta de água batida 💧'); });
  return html`<div class="water"><div class="drops" aria-label=${`${w} de ${goal} copos`}>${Array.from({ length: Math.max(goal, w) }, (_, i) => html`<button class=${'drop' + (i < w ? ' on' : '')} aria-label=${`Copo ${i + 1}`} onClick=${() => set(i < w ? i : i + 1)}>💧</button>`)}</div>
    <div class="water-ctl"><button aria-label="Menos um copo" onClick=${() => set(w - 1)}>−</button><span><b>${w}</b> de ${goal} copos (${(w * 0.25).toLocaleString('pt-BR')} L)</span><button aria-label="Mais um copo" onClick=${() => set(w + 1)}>+</button></div></div>`;
}

function Meals({ date, log }) {
  const [m, setM] = useState(log?.meals || {});
  useLayoutEffect(() => setM(log?.meals || {}), [date]);
  const persist = useAutosave(v => saveFood(date, { meals: v }, 8), 600);
  return html`${MEALS.map(([k, n]) => html`<label class="field"><span>${n}</span><input class="input" value=${m[k] || ''} placeholder="O que comeu (opcional)" onBlur=${() => persist.flush()} onInput=${e => { const v = { ...m, [k]: e.target.value }; setM(v); persist(v); }} /></label>`)}`;
}

export function Alimentacao({ date: today, settings }) {
  const [date, setDate] = useState(today);
  const log = useRecord('foodLogs', date);
  const ws = weekStart(date);
  const week = useList('foodLogs', l => l.id >= ws && l.id <= shift(ws, 6), [ws]);
  const goal = settings?.waterGoal || 8;
  if (log === undefined || !week) return null;
  const toggle = k => saveFood(date, { checks: { [k]: !log?.checks?.[k] } }, goal);
  const score = foodScore(log);
  const byDay = Object.fromEntries(week.map(l => [l.id, l]));
  return html`<h1 class="page-title">Alimentação</h1>
    <p class="soon">Sem contar calorias: 5 hábitos simples que, somados ao treino, levam ao shape slim. Marque o que conseguiu no dia.</p>
    <div class="day-nav"><button class="icon-btn" aria-label="Dia anterior" onClick=${() => setDate(shift(date, -1))}>‹</button>
      <b>${date === today ? 'Hoje' : `${weekday(fromISO(date))}, ${dayMonth(fromISO(date))}`}</b>
      <button class="icon-btn" aria-label="Próximo dia" disabled=${date >= today} onClick=${() => setDate(shift(date, 1))}>›</button></div>
    <${Section} title="Hábitos do dia" icon=${html`<span aria-hidden="true">🥗</span>`} tone="teal" meta=${`${score} de ${FOOD_CHECKS.length}`}
      hint=${score >= 4 ? 'Dia muito bom. O hábito Alimentação foi marcado.' : 'Com 4 ou mais, o hábito Alimentação é marcado sozinho.'}>
      <div class="rows">${FOOD_CHECKS.map(([k, e, n, sub]) => html`<div class=${'row' + (log?.checks?.[k] ? ' done-soft' : '')}>
        <${Check} on=${!!log?.checks?.[k]} label=${n} onToggle=${() => toggle(k)} />
        <div class="grow item-btn stack"><span class="title">${e} ${n}</span><span class="sub">${sub}</span></div></div>`)}</div>
    <//>
    <${Section} title="Água" icon=${html`<span aria-hidden="true">💧</span>`} tone="blue" hint="Toque num copo para marcar. Ao bater a meta, o hábito Água é marcado.">
      <${WaterRow} date=${date} log=${log} goal=${goal} />
      <div class="goal-inline">Meta diária: ${[6, 8, 10, 12].map(n => html`<button class=${'chip' + (goal === n ? ' on' : '')} onClick=${() => saveSettings({ waterGoal: n })}>${n} copos</button>`)}</div>
    <//>
    <${Section} title="O que comi" icon=${html`<span aria-hidden="true">📝</span>`} tone="amber" hint="Opcional. Ajuda a perceber padrões e é útil para mostrar à nutricionista.">
      <${Meals} key=${date} date=${date} log=${log} />
    <//>
    <${Section} title="Minha semana" tone="teal">
      <div class="week-dots">${Array.from({ length: 7 }, (_, i) => { const d = shift(ws, i); const s = foodScore(byDay[d]); const lv = s >= 4 ? 'g' : s >= 2 ? 'm' : s ? 'l' : '';
        return html`<button class=${'wd ' + lv + (d === date ? ' sel' : '')} disabled=${d > today} onClick=${() => setDate(d)}><span>${'STQQSSD'[i]}</span><b>${s || ''}</b><small>${byDay[d]?.water ? byDay[d].water + '💧' : ''}</small></button>`; })}</div>
    <//>
    <a class="tile wide-tile" href="#/cardapio"><span class="tile-em">🍽️</span><strong>Cardápio da família</strong><span>O que vamos comer na semana, com a lista do mercado pronta.</span></a>
    <a class="tile wide-tile" href="#/medidas"><span class="tile-em">📏</span><strong>Medidas</strong><span>No shape slim, a fita métrica mostra mais que a balança.</span></a>
    <p class="cycle-note">Para um cardápio com quantidades sob medida, procure uma nutricionista. Este acompanhamento ajuda a levar seus hábitos para a consulta.</p>`;
}

function MeasureSheet({ open, last, onClose, date }) {
  const [f, setF] = useState({});
  useLayoutEffect(() => { if (open) setF({ date }); }, [open]);
  if (!open) return null;
  const any = MEASURES.some(([k]) => f[k]);
  return html`<${Sheet} open=${open} onClose=${onClose} title="Nova medição">
    <p class="lead">Meça sempre no mesmo horário, de manhã e em jejum, a cada 2 a 4 semanas. Preencha só o que quiser.</p>
    <label class="field"><span>Data</span><input type="date" class="input" value=${f.date} onInput=${e => setF({ ...f, date: e.target.value })} /></label>
    <div class="fieldrow">${MEASURES.map(([k, n, u]) => html`<label class="field"><span>${n} (${u})</span><input class="input" inputmode="decimal" placeholder=${last?.[k] ? String(last[k]).replace('.', ',') : ''} value=${f[k] ? String(f[k]).replace('.', ',') : ''}
      onInput=${e => { const v = parseFloat(e.target.value.replace(',', '.')); setF({ ...f, [k]: isNaN(v) ? '' : v }); }} /></label>`)}</div>
    <button class="btn" disabled=${!any} onClick=${async () => { await save('measures', { ...f, visibility: 'private' }); toast('Medidas salvas'); onClose(); }}>Salvar</button>
  <//>`;
}

function LineChart({ points, unit }) {
  if (points.length < 2) return html`<p class="plan-hint">O gráfico aparece a partir da segunda medição.</p>`;
  const W = 320, H = 140, P = 28;
  const vs = points.map(p => p.v), min = Math.min(...vs), max = Math.max(...vs), span = max - min || 1;
  const x = i => P + i * (W - 2 * P) / (points.length - 1), y = v => H - P - (v - min) / span * (H - 2 * P);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.v)}`).join(' ');
  return html`<svg class="line-chart" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Evolução da medida">
    <path d=${d} />${points.map((p, i) => html`<circle cx=${x(i)} cy=${y(p.v)} r="4" /><text x=${x(i)} y=${y(p.v) - 10} text-anchor="middle">${String(p.v).replace('.', ',')}</text>`)}
    <text x=${P} y=${H - 6} class="ax">${shortDate(points[0].d)}</text><text x=${W - P} y=${H - 6} text-anchor="end" class="ax">${shortDate(points[points.length - 1].d)}</text>
  </svg>`;
}

export function Medidas({ date }) {
  const rows = useList('measures', () => true, []);
  const [open, setOpen] = useState(false);
  const [k, setK] = useState('cintura');
  if (!rows) return null;
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const pts = sorted.filter(r => r[k]).map(r => ({ d: r.date, v: r[k] }));
  const [, name, unit] = MEASURES.find(m => m[0] === k);
  const diff = pts.length > 1 ? Math.round((pts[pts.length - 1].v - pts[0].v) * 10) / 10 : null;
  return html`<h1 class="page-title">Medidas</h1>
    <p class="soon">Acompanhe a evolução pelo corpo, não só pela balança. Com treino de força, é comum perder centímetros antes de perder peso.</p>
    <button class="add-big" onClick=${() => setOpen(true)}>+ Nova medição</button>
    ${!rows.length ? html`<div class="empty">Faça a primeira medição hoje: ela é o seu ponto de partida.</div>` : html`
      <${Section} title="Evolução" tone="rose">
        <div class="chips">${MEASURES.map(([id, n]) => html`<button class=${'chip' + (k === id ? ' on' : '')} onClick=${() => setK(id)}>${n}</button>`)}</div>
        ${diff != null && html`<p class="measure-diff">${name}: <b class=${diff < 0 ? 'down' : diff > 0 ? 'up' : ''}>${diff > 0 ? '+' : ''}${String(diff).replace('.', ',')} ${unit}</b> desde ${shortDate(pts[0].d)}</p>`}
        <${LineChart} points=${pts} unit=${unit} />
      <//>
      <${Section} title="Histórico" tone="rose"><div class="rows">${[...sorted].reverse().map(r => html`<div class="row"><div class="grow item-btn stack"><span class="title">${shortDate(r.date)}</span>
        <span class="sub">${MEASURES.filter(([m]) => r[m]).map(([m, n, u]) => `${n} ${String(r[m]).replace('.', ',')} ${u}`).join(' · ')}</span></div></div>`)}</div><//>`}
    <${MeasureSheet} open=${open} last=${last} date=${date} onClose=${() => setOpen(false)} />`;
}
