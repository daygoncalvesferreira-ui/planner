// Páginas de registro da vida, todas sobre a lista genérica (components/collection.js)
import { html } from '../lib/preact-htm.js';
import { Collection } from '../components/collection.js';
import { save } from '../store/repo.js';
import { toast } from '../components/ui.js';
import { WHEEL_AREAS } from '../store/schema.js';
import { todayISO, shortDate, fromISO, toISO } from '../lib/date.js';

const AREA_OPTS = WHEEL_AREAS.map(([id, n, e]) => [id, `${e} ${n}`]);
const AREA = Object.fromEntries(WHEEL_AREAS.map(([id, n, e]) => [id, `${e} ${n}`]));
const opt = (arr, v) => (arr.find(o => o[0] === v) || [, ''])[1];
const yearOf = r => (r.date || r.createdAt || '').slice(0, 4);

// ---------- Conquistas ----------
export const WINS = {
  store: 'wins', title: 'Conquistas', emoji: '🏆', addLabel: 'Registrar conquista', newTitle: 'Nova conquista', savedMsg: 'Conquista registrada 🏆',
  intro: 'Grandes ou pequenas. Ver o que você já fez dá mais energia do que olhar só o que falta.',
  lead: 'Ex.: "Fechei a conciliação sem atraso", "Corri 5 km", "Organizei o armário da filha".',
  empty: 'Nenhuma conquista ainda. Registre a primeira: vale qualquer vitória do dia.',
  fields: [
    { key: 'text', label: 'O que você conquistou?', main: true, type: 'textarea', ph: 'Escreva em uma frase' },
    { key: 'area', label: 'Área (opcional)', type: 'choice', options: AREA_OPTS },
    { key: 'date', label: 'Quando', type: 'date' }
  ],
  header: rows => { const y = String(new Date().getFullYear()); const m = todayISO().slice(0, 7);
    return html`<div class="stat-row"><div><b>${rows.filter(r => r.date?.startsWith(m)).length}</b><span>este mês</span></div><div><b>${rows.filter(r => yearOf(r) === y).length}</b><span>em ${y}</span></div><div><b>${rows.length}</b><span>no total</span></div></div>`; },
  row: r => html`<strong>${r.text}</strong><span class="meta-line"><span>${shortDate(r.date)}</span>${r.area && html`<span>${AREA[r.area]}</span>`}</span>`
};

// ---------- Memórias da filha ----------
const MEM_KINDS = [['frase', '💬 Frase'], ['primeira', '⭐ Primeira vez'], ['momento', '📸 Momento'], ['conquista', '🏅 Conquista dela']];
export const MEMORIES = {
  store: 'memories', title: 'Memórias da filha', emoji: '👧', addLabel: 'Guardar memória', newTitle: 'Nova memória', savedMsg: 'Memória guardada 💛',
  intro: 'Frases engraçadas, primeiras vezes e momentos que você não quer esquecer. Daqui a alguns anos, isto vale ouro.',
  empty: 'Nenhuma memória ainda. Aquela frase de hoje que fez você rir já serve.',
  tabs: [['all', 'Todas', () => true], ['frase', 'Frases', r => r.kind === 'frase'], ['primeira', 'Primeiras vezes', r => r.kind === 'primeira']],
  defaults: tab => ({ kind: tab === 'all' ? 'frase' : tab }),
  fields: [
    { key: 'kind', label: 'Tipo', type: 'choice', options: MEM_KINDS, required: true },
    { key: 'text', label: 'O que aconteceu ou o que ela disse?', main: true, type: 'textarea' },
    { key: 'context', label: 'Contexto (opcional)', ph: 'Ex.: no carro, voltando da escola' },
    { key: 'date', label: 'Quando', type: 'date' }
  ],
  row: r => html`<strong>${r.kind === 'frase' ? `"${r.text}"` : r.text}</strong><span class="meta-line"><span>${opt(MEM_KINDS, r.kind)}</span><span>${shortDate(r.date)}</span>${r.context && html`<span>${r.context}</span>`}</span>`
};

// ---------- Encontros a dois ----------
const DATE_KINDS = [['restaurante', '🍽️ Restaurante'], ['passeio', '🌳 Passeio'], ['casa', '🏠 Em casa'], ['viagem', '✈️ Viagem'], ['cultura', '🎭 Cultura'], ['outro', '✨ Outro']];
const COST = [['0', 'Grátis'], ['1', '$'], ['2', '$$'], ['3', '$$$']];
export const DATE_IDEAS = {
  store: 'dateIdeas', title: 'Encontros a dois', emoji: '❤️', addLabel: 'Nova ideia de encontro', newTitle: 'Ideia de encontro', savedMsg: 'Ideia guardada',
  intro: 'Guarde aqui lugares e programas que vocês querem fazer. Quando bater a dúvida "o que vamos fazer?", a resposta está pronta.',
  empty: 'Nenhuma ideia ainda. Aquele restaurante que alguém indicou? Anote aqui.',
  tabs: [['todo', 'Ideias', r => !r.done], ['done', 'Já fizemos', r => r.done]],
  sort: (a, b) => (b.doneOn || b.createdAt).localeCompare(a.doneOn || a.createdAt),
  fields: [
    { key: 'title', label: 'O quê?', main: true, ph: 'Ex.: Jantar no restaurante italiano do centro' },
    { key: 'kind', label: 'Tipo', type: 'choice', options: DATE_KINDS },
    { key: 'cost', label: 'Custo', type: 'choice', options: COST },
    { key: 'where', label: 'Onde ou link (opcional)' },
    { key: 'done', label: 'Já fizemos?', type: 'choice', options: [[true, 'Sim'], [false, 'Ainda não']] },
    { key: 'memory', label: 'Como foi? (opcional)', type: 'textarea', show: f => f.done === true }
  ],
  normalize: f => ({ ...f, doneOn: f.done ? (f.doneOn || todayISO()) : null }),
  row: r => html`<strong>${r.title}</strong><span class="meta-line">${r.kind && html`<span>${opt(DATE_KINDS, r.kind)}</span>`}${r.cost != null && r.cost !== '' && html`<span>${opt(COST, r.cost)}</span>`}${r.done && html`<span>Fizemos em ${shortDate(r.doneOn)}</span>`}</span>${r.memory && html`<span class="quote">${r.memory}</span>`}`,
  action: (r, edit) => !r.done && html`<button class="mini-act good" onClick=${() => edit({ ...r, done: true })}>Fizemos!</button>`
};

// ---------- Sonhos ----------
const HORIZON = [['ano', 'Este ano'], ['medio', '1 a 3 anos'], ['um-dia', 'Um dia']];
export const DREAMS = {
  store: 'dreams', title: 'Lista de sonhos', emoji: '🌠', addLabel: 'Novo sonho', newTitle: 'Novo sonho', savedMsg: 'Sonho guardado ✨',
  intro: 'O que você quer viver, conquistar ou construir. Sonho escrito vira direção para as metas.',
  empty: 'Nenhum sonho ainda. Comece por um que você pensa com frequência.',
  tabs: [['dreaming', 'Sonhando', r => !r.done], ['done', 'Realizados', r => r.done]],
  fields: [
    { key: 'title', label: 'Qual é o sonho?', main: true, ph: 'Ex.: Viajar com a família para o Nordeste' },
    { key: 'area', label: 'Área', type: 'choice', options: AREA_OPTS },
    { key: 'horizon', label: 'Para quando', type: 'choice', options: HORIZON },
    { key: 'why', label: 'Por que ele importa? (opcional)', type: 'textarea' },
    { key: 'done', label: 'Já realizou?', type: 'choice', options: [[true, 'Sim! 🎉'], [false, 'Ainda não']] }
  ],
  normalize: f => ({ ...f, doneOn: f.done ? (f.doneOn || todayISO()) : null }),
  row: r => html`<strong>${r.done ? '🎉 ' : ''}${r.title}</strong><span class="meta-line">${r.area && html`<span>${AREA[r.area]}</span>`}${r.horizon && html`<span>${opt(HORIZON, r.horizon)}</span>`}${r.done && html`<span>Realizado em ${shortDate(r.doneOn)}</span>`}</span>${r.why && html`<span class="quote">${r.why}</span>`}`,
  action: (r, edit) => !r.done && html`<button class="mini-act good" onClick=${() => edit({ ...r, done: true })}>Realizei!</button>`
};

// ---------- Oração ----------
export const PRAYERS = {
  store: 'prayers', title: 'Pedidos de oração', emoji: '🙏', addLabel: 'Novo pedido', newTitle: 'Pedido de oração', savedMsg: 'Pedido guardado',
  intro: 'Anote pelo que está orando. Quando a resposta vier, registre: no fim do ano você vê tudo o que Deus respondeu.',
  empty: 'Nenhum pedido aqui ainda.',
  tabs: [['open', 'Orando', r => !r.answered], ['answered', 'Respondidas', r => r.answered]],
  sort: (a, b) => (b.answeredOn || b.date || '').localeCompare(a.answeredOn || a.date || ''),
  fields: [
    { key: 'text', label: 'Pedido', main: true, type: 'textarea' },
    { key: 'forWhom', label: 'Por quem (opcional)', ph: 'Ex.: família, amiga, trabalho' },
    { key: 'date', label: 'Desde', type: 'date' },
    { key: 'answered', label: 'Foi respondida?', type: 'choice', options: [[true, 'Sim 🙌'], [false, 'Ainda orando']] },
    { key: 'answer', label: 'Como foi respondida?', type: 'textarea', show: f => f.answered === true }
  ],
  normalize: f => ({ ...f, answeredOn: f.answered ? (f.answeredOn || todayISO()) : null }),
  row: r => html`<strong>${r.text}</strong><span class="meta-line">${r.forWhom && html`<span>${r.forWhom}</span>`}<span>desde ${shortDate(r.date)}</span>${r.answered && html`<span>🙌 respondida em ${shortDate(r.answeredOn)}</span>`}</span>${r.answer && html`<span class="quote">${r.answer}</span>`}`,
  action: (r, edit) => !r.answered && html`<button class="mini-act good" onClick=${() => edit({ ...r, answered: true })}>Respondida</button>`
};

// ---------- Datas especiais ----------
const SD_KINDS = [['aniversario', '🎂 Aniversário'], ['casamento', '💍 Casamento'], ['memoria', '🕊️ Data marcante'], ['outro', '📌 Outro']];
// Próxima ocorrência anual de uma data (lida com 29/02)
export function nextOccurrence(iso, today) {
  const [, m, d] = iso.split('-').map(Number); const t = fromISO(today);
  let y = t.getFullYear(); let n = new Date(y, m - 1, d);
  if (toISO(n) < today) n = new Date(++y, m - 1, d);
  const days = Math.round((n - t) / 864e5);
  const years = y - +iso.slice(0, 4);
  return { date: toISO(n), days, years };
}
export const upcomingDates = (rows, today, within = 14) => rows.filter(r => r.date).map(r => ({ ...r, ...nextOccurrence(r.date, today) })).filter(r => r.days <= within).sort((a, b) => a.days - b.days);
const when = n => n === 0 ? 'Hoje! 🎉' : n === 1 ? 'Amanhã' : `Em ${n} dias`;
export const SPECIAL_DATES = {
  store: 'specialDates', title: 'Datas especiais', emoji: '🎂', addLabel: 'Nova data', newTitle: 'Data especial', savedMsg: 'Data guardada',
  intro: 'Aniversários e datas importantes, com contagem regressiva. Elas aparecem na tela Hoje duas semanas antes.',
  empty: 'Comece pelas essenciais: aniversário da filha, do marido e de casamento.',
  fields: [
    { key: 'title', label: 'Nome', main: true, ph: 'Ex.: Aniversário da mãe' },
    { key: 'kind', label: 'Tipo', type: 'choice', options: SD_KINDS },
    { key: 'date', label: 'Data original (com o ano, se souber)', type: 'date' },
    { key: 'note', label: 'Ideia de presente ou lembrete (opcional)' }
  ],
  sort: (a, b) => nextOccurrence(a.date, todayISO()).days - nextOccurrence(b.date, todayISO()).days,
  row: (r, today = todayISO()) => { const o = nextOccurrence(r.date, today);
    return html`<strong>${r.title}</strong><span class="meta-line"><span><b>${when(o.days)}</b></span><span>${shortDate(o.date)}</span>${o.years > 0 && r.kind !== 'outro' && html`<span>${o.years} ${o.years === 1 ? 'ano' : 'anos'}</span>`}</span>${r.note && html`<span class="quote">${r.note}</span>`}`; }
};

export const page = cfg => ({ date }) => html`<${Collection} cfg=${cfg} date=${date} />`;
