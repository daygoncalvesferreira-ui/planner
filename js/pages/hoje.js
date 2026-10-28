import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { useList, useRecord, useAutosave } from '../store/hooks.js';
import { save, remove, get } from '../store/repo.js';
import { ItemSheet } from '../components/itemsheet.js';
import { BibleToday } from './biblia.js';
import { CycleToday } from './ciclo.js';
import { MomentPrompt } from './ano.js';
import { HealthToday } from './saude.js';
import { goalStats } from './financas.js';
import { EditSheet } from '../components/collection.js';
import { WINS, upcomingDates } from './colecoes.js';
import { habitEmoji, habitOn } from './habitos.js';
import { todayISO, fromISO, weekday, dayMonth, greeting, shortDate } from '../lib/date.js';
import { Check, Section, Sheet } from '../components/ui.js';
import { icons } from '../components/icons.js';
import { saveSettings } from '../store/settings.js';

const OVERLOAD = 8; // tarefas pendentes no dia a partir das quais o aviso aparece

async function savePlan(date, patch) {
  const cur = (await get('dayPlans', date)) || { id: date, priorities: [{}, {}, {}], review: '' };
  return save('dayPlans', { ...cur, ...patch });
}

function Priorities({ plan, date }) {
  const [items, setItems] = useState([{}, {}, {}]);
  const loaded = useRef(false);
  useEffect(() => { if (plan !== undefined && !loaded.current) { loaded.current = true; if (plan) setItems(plan.priorities); } }, [plan]);
  const persist = useAutosave(p => savePlan(date, { priorities: p }), 400);
  const update = (i, patch, now) => {
    const next = items.map((it, j) => (j === i ? { ...it, ...patch } : it));
    setItems(next);
    if (now) { persist.flush(); savePlan(date, { priorities: next }); } else persist(next);
  };
  const filled = items.filter(p => p.text?.trim()).length;
  return html`<${Section} title="Minhas 3 prioridades" icon=${icons.star()} tone="rose"
    hint="O que faria o dia valer a pena? Escreva no máximo 3, da mais importante para a menos."
    meta=${`${items.filter(p => p.done).length} de ${filled || 3}`}>
    ${items.map((p, i) => html`<div class=${'prio' + (p.done ? ' done' : '')}>
      <span class="num">${i + 1}</span>
      <input value=${p.text || ''} placeholder=${['Toque para escrever a principal', 'Segunda prioridade', 'Terceira prioridade'][i]}
        aria-label=${'Prioridade ' + (i + 1)} onInput=${e => update(i, { text: e.target.value })} onBlur=${() => persist.flush()} enterkeyhint="done" />
      <${Check} on=${p.done} label=${'Concluir prioridade ' + (i + 1)} onToggle=${() => p.text?.trim() && update(i, { done: !p.done }, true)} />
    </div>`)}
  <//>`;
}

function Agenda({ events, onAdd, onEdit }) {
  return html`<${Section} title="Agenda" icon=${icons.clock()} tone="lilac" hint="Compromissos com horário marcado."
    action=${events.length ? html`<button class="link" onClick=${onAdd}>+ Novo</button>` : null}>
    <div class="rows">
      ${!events.length && html`<div class="empty">Nada marcado para hoje.<button onClick=${onAdd}>+ Adicionar</button></div>`}
      ${events.map(ev => html`<button class="row row-btn" onClick=${() => onEdit(ev)}>
        <span class="time">${ev.time || 'Dia'}</span>
        <div class="grow"><div class="title">${ev.title}</div></div>
        <span class="chev" aria-hidden="true">›</span>
      </button>`)}
    </div>
  <//>`;
}

function Tasks({ tasks, date, onEdit }) {
  const [text, setText] = useState('');
  const add = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    await save('tasks', { title: text.trim(), date, time: null, status: 'todo', priority: 'normal', area: null });
    setText('');
  };
  const toggle = t => save('tasks', { ...t, status: t.status === 'done' ? 'todo' : 'done',
    completedAt: t.status === 'done' ? null : new Date().toISOString(), completedOn: t.status === 'done' ? null : date });
  const done = tasks.filter(t => t.status === 'done').length;
  return html`<${Section} title="Tarefas" icon=${icons.list()} tone="teal" hint="Toque na caixinha ao terminar. Toque no nome para editar ou mudar de dia."
    meta=${tasks.length ? `${done} de ${tasks.length}` : null}>
    <div class="rows">
      ${tasks.map(t => html`<div class=${'row' + (t.status === 'done' ? ' done' : '')}>
        <${Check} on=${t.status === 'done'} label=${'Concluir ' + t.title} onToggle=${() => toggle(t)} />
        <button class="grow item-btn stack" onClick=${() => onEdit(t)}><span class="title">${t.title}</span>
          ${(t.date < date && t.status === 'todo') ? html`<span class="sub"><span class="late">Atrasada desde ${shortDate(t.date)}</span> · toque para decidir</span>` : t.time && html`<span class="sub">${t.time}</span>`}
        </button>
      </div>`)}
      <form class="add-row" onSubmit=${add}>
        <input value=${text} onInput=${e => setText(e.target.value)} placeholder="Escreva uma tarefa…" aria-label="Nova tarefa" enterkeyhint="done" />
        ${text.trim() && html`<button>Adicionar</button>`}
      </form>
    </div>
  <//>`;
}

function Habits({ habits, logs, date }) {
  const doneIds = new Set(logs.map(l => l.habitId));
  const toggle = h => {
    const id = `${h.id}_${date}`;
    doneIds.has(h.id) ? remove('habitLogs', id) : save('habitLogs', { id, habitId: h.id, date, value: 1 });
  };
  return html`<${Section} title="Hábitos" icon=${icons.habitos(20)} tone="amber" hint="Toque em cada hábito que você cumpriu hoje."
    meta=${`${doneIds.size} de ${habits.length}`}>
    <div class="habits">${habits.map(h => { const on = doneIds.has(h.id); return html`<button class=${'habit' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => toggle(h)}>
      <span class="em" aria-hidden="true">${habitEmoji(h)}</span><span class="nm">${h.name}</span><span class="st">${on ? 'Feito ✓' : 'Marcar'}</span></button>`; })}</div>
  <//>`;
}

// Blocos da tela Hoje: a usuária escolhe quais aparecem e em que ordem
export const BLOCKS = [['prioridades', '⭐', 'Minhas 3 prioridades'], ['agenda', '🕐', 'Agenda'], ['tarefas', '✅', 'Tarefas'], ['saude', '💪', 'Saúde de hoje'],
  ['habitos', '💛', 'Hábitos'], ['biblia', '📖', 'Leitura bíblica'], ['ciclo', '🌸', 'Ciclo'], ['areas', '🧩', 'Atalhos das áreas'], ['noite', '🌙', 'Fechar o dia (revisão, conquista)']];
const DEFAULT_HIDDEN = ['areas'];

function HomeEditor({ open, settings, onClose }) {
  // Estado local: toques rápidos seguidos não se perdem enquanto salva
  const home = settings.home || {};
  const [order, setOrder] = useState(() => [...(home.order || []), ...BLOCKS.map(b => b[0]).filter(id => !(home.order || []).includes(id))]);
  const [hidden, setHidden] = useState(() => home.hidden || [...DEFAULT_HIDDEN, ...(settings.showCycleOnToday === false ? ['ciclo'] : [])]);
  if (!open) return null;
  const set = patch => { const next = { order, hidden, ...patch }; setOrder(next.order); setHidden(next.hidden); saveSettings({ home: next }); };
  const move = (i, d) => { const o = [...order]; [o[i], o[i + d]] = [o[i + d], o[i]]; set({ order: o }); };
  const tog = id => set({ hidden: hidden.includes(id) ? hidden.filter(x => x !== id) : [...hidden, id] });
  return html`<${Sheet} open=${open} onClose=${onClose} title="Personalizar a tela Hoje">
    <p class="lead">Deixe só o que você usa todo dia. O resto continua no app, em Vida, na busca e no botão Adicionar.</p>
    ${order.map((id, i) => { const b = BLOCKS.find(x => x[0] === id); return b && html`<div class="home-row">
      <label><input type="checkbox" checked=${!hidden.includes(id)} onChange=${() => tog(id)} /><span>${b[1]} ${b[2]}</span></label>
      <button aria-label="Subir" disabled=${i === 0} onClick=${() => move(i, -1)}>▲</button><button aria-label="Descer" disabled=${i === order.length - 1} onClick=${() => move(i, 1)}>▼</button></div>`; })}
    <button class="btn" style="margin-top:14px" onClick=${onClose}>Pronto</button>
  <//>`;
}

// Atalho de Finanças: ação do mês pendente, senão progresso dos objetivos
function finSub(goals, month, date) {
  if (month?.action && !month.actionDone) return `Ação do mês: ${month.action}`;
  if (!goals.length) return 'Crie seus objetivos';
  const st = goals.map(g => goalStats(g, date)); const s = st.reduce((a, x) => a + x.saved, 0), t = st.reduce((a, x) => a + x.target, 0);
  return `Objetivos: ${t ? Math.round(s / t * 100) : 0}% guardado`;
}

const SHORTCUTS = [
  ['👧', 'Filha', 'Memórias e frases', '#/memorias'], ['❤️', 'Casamento', 'Ideias de encontros', '#/encontros'],
  ['💰', 'Finanças', 'Objetivos e ação do mês', '#/financas'], ['🙏', 'Espiritual', 'Leitura bíblica e oração', '#/biblia']
];

function Review({ plan, date }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const loaded = useRef(false);
  useEffect(() => { if (plan !== undefined && !loaded.current) { loaded.current = true; setText(plan?.review || ''); } }, [plan]);
  const persist = useAutosave(async v => { await savePlan(date, { review: v }); setStatus('Salvo'); }, 600);
  const PROMPTS = ['O que deu certo?', 'O que ficou pendente?', 'Sou grata por…'];
  const addPrompt = q => { const v = (text ? text + '\n' : '') + q + ' '; setText(v); persist(v); };
  return html`<${Section} title="Revisão do dia" icon=${icons.moon()} tone="blue" hint="Um minuto à noite para fechar o dia. Toque numa pergunta para começar.">
    <div class="prompts">${PROMPTS.map(q => html`<button onClick=${() => addPrompt(q)}>${q}</button>`)}</div>
    <textarea class="journal" value=${text} placeholder="Escreva livremente…"
      aria-label="Revisão do dia" onBlur=${() => persist.flush()} onInput=${e => { setText(e.target.value); setStatus(''); persist(e.target.value); }}></textarea>
    <div class="saved" aria-live="polite">${status && '✓ ' + status}</div>
  <//>`;
}

function NameSheet({ open }) {
  const [name, setName] = useState('');
  return html`<${Sheet} open=${open} onClose=${() => {}} title="Boas-vindas ao seu planner">
    <p class="lead">Aqui você organiza o dia em poucos segundos. Para começar, como podemos te chamar?</p>
    <form onSubmit=${e => { e.preventDefault(); name.trim() && saveSettings({ name: name.trim() }); }}>
      <label class="field"><span>Qual é o seu nome?</span>
        <input class="input" value=${name} onInput=${e => setName(e.target.value)} autofocus autocomplete="given-name" /></label>
      <button class="btn" disabled=${!name.trim()}>Começar</button>
    </form>
  <//>`;
}

// Peso de cada bloco no anel: prioridades valem mais que hábitos
const WEIGHT = { prios: 0.5, tasks: 0.3, habits: 0.2 };

export function Hoje({ settings, date, onQuickAdd, editMode }) {
  const now = new Date();
  const [editing, setEditing] = useState(null); // { item, store }
  const [nightOpen, setNightOpen] = useState(false);
  const plan = useRecord('dayPlans', date);
  const events = useList('events', e => e.date === date, [date]);
  // Do dia + atrasadas pendentes + atrasadas concluídas hoje (não somem ao marcar)
  const tasks = useList('tasks', t => t.status !== 'cancelled' && (t.date === date || (t.date < date && (t.status === 'todo' || t.completedOn === date))), [date]);
  const notes = useList('notes', n => n.kind === 'dump' && n.status === 'open', []);
  const sdates = useList('specialDates', () => true, []);
  const year = useRecord('years', date.slice(0, 4));
  const finGoals = useList('finGoals', () => true, []);
  const finMonth = useRecord('finMonths', date.slice(0, 7));
  const [winItem, setWinItem] = useState(null); // objeto estável: o formulário não se apaga ao atualizar a tela
  const habitsAll = useList('habits', h => h.active, []);
  const logs = useList('habitLogs', l => l.date === date, [date]);
  const shop = useList('shoppingItems', i => i.listId === 'mercado' && !i.done, []);
  if (!events || !tasks || !habitsAll || !logs || !shop || !notes || !sdates || year === undefined || !finGoals || finMonth === undefined || plan === undefined) return null;
  const soon = upcomingDates(sdates, date, 14);
  const habits = habitsAll.filter(h => habitOn(h, date)); // só os hábitos de hoje

  const sortedEvents = [...events].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  const sortedTasks = [...tasks].sort((a, b) => (a.status === 'done') - (b.status === 'done') || a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const prios = (plan?.priorities || []).filter(p => p.text?.trim());
  const pending = tasks.filter(t => t.status !== 'done').length;

  const parts = [
    ['prios', 'Prioridades', prios.filter(p => p.done).length, prios.length],
    ['tasks', 'Tarefas', tasks.filter(t => t.status === 'done').length, tasks.length],
    ['habits', 'Hábitos', logs.filter(l => habits.some(h => h.id === l.habitId)).length, habits.length]
  ].filter(p => p[3] > 0);
  const wsum = parts.reduce((a, p) => a + WEIGHT[p[0]], 0);
  const pct = wsum ? Math.round(parts.reduce((a, [k, , d, t]) => a + WEIGHT[k] * d / t, 0) / wsum * 100) : 0;
  const late = tasks.filter(t => t.status === 'todo' && t.date < date).length;

  const warn = pending > OVERLOAD;
  const R = 32, C = 2 * Math.PI * R;
  const detail = warn ? `${pending} tarefas pendentes${late ? `, ${late} atrasadas` : ''}. Toque numa tarefa para mudar de dia.`
    : !prios.length ? 'Comece definindo suas 3 prioridades logo abaixo.'
    : parts.map(([, n, d, t]) => `${n} ${d}/${t}`).join(' · ');

  const home = settings.home || {};
  const order = [...(home.order || []), ...BLOCKS.map(b => b[0]).filter(id => !(home.order || []).includes(id))];
  const hidden = home.hidden || [...DEFAULT_HIDDEN, ...(settings.showCycleOnToday === false ? ['ciclo'] : [])];
  const evening = now.getHours() >= 17;
  const BLOCK = {
    prioridades: () => html`<${Priorities} plan=${plan} date=${date} />`,
    agenda: () => html`<${Agenda} events=${sortedEvents} onAdd=${() => onQuickAdd('event')} onEdit=${ev => setEditing({ item: ev, store: 'events' })} />`,
    tarefas: () => html`<${Tasks} tasks=${sortedTasks} date=${date} onEdit=${t => setEditing({ item: t, store: 'tasks' })} />`,
    saude: () => html`<${HealthToday} date=${date} settings=${settings} />`,
    biblia: () => html`<${BibleToday} date=${date} />`,
    ciclo: () => html`<${CycleToday} date=${date} />`,
    habitos: () => habits.length > 0 && html`<${Habits} habits=${[...habits].sort((a, b) => a.order - b.order)} logs=${logs} date=${date} />`,
    areas: () => html`<${Section} title="Atalhos" icon=${icons.vida(20)} tone="lilac">
      <div class="shortcuts"><a class="shortcut wide" href="#/compras"><span class="em" aria-hidden="true">🛒</span><div><strong>Lista de compras</strong><span>${shop.length ? `${shop.length} ${shop.length === 1 ? 'item' : 'itens'} para o mercado` : 'Nada pendente no mercado'}</span></div></a>${SHORTCUTS.map(([em, t, sub, href]) => html`<a class="shortcut" href=${href}><span class="em" aria-hidden="true">${em}</span><strong>${t}</strong><span>${t === 'Finanças' ? finSub(finGoals, finMonth, date) : sub}</span></a>`)}</div>
    <//>`,
    noite: () => evening || nightOpen ? html`
      <${Review} plan=${plan} date=${date} />
      <button class="win-quick" onClick=${() => setWinItem({ date })}>🏆 Registrar uma conquista de hoje</button>
      <${MomentPrompt} date=${date} />`
      : html`<button class="night-btn" onClick=${() => setNightOpen(true)}>🌙 Fechar o dia <span>revisão e conquista aparecem sozinhas às 17h</span></button>`
  };

  return html`
    <header class="hero">
      <span class="date-chip"><i></i>${weekday(fromISO(date))}, ${dayMonth(fromISO(date))}</span>
      <div class="hero-actions"><a class="icon-btn" href="#/busca" aria-label="Buscar">${icons.search()}</a><a class="icon-btn" href="#/ajustes" aria-label="Ajustes">${icons.gear()}</a></div>
    </header>
    <h1 class="hello">${greeting(now)}${settings.name ? `, ${settings.name}` : ''}</h1>
    ${year?.word ? html`<a class="year-word" href="#/ano">✨ ${year.word}</a>` : ''}
    ${soon.map(s => html`<a class="date-banner" href="#/datas"><span aria-hidden="true">${s.kind === 'casamento' ? '💍' : s.kind === 'aniversario' ? '🎂' : '📌'}</span>
      <div><b>${s.days === 0 ? `Hoje: ${s.title}!` : s.days === 1 ? `Amanhã: ${s.title}` : `${s.title} em ${s.days} dias`}</b>${s.note && html`<small>${s.note}</small>`}</div></a>`)}
    <div class=${'day-card' + (warn ? ' warn' : '')}>
      <div class="ring" role="progressbar" aria-valuenow=${pct} aria-valuemin="0" aria-valuemax="100" aria-label="Progresso do dia">
        <svg width="76" height="76" viewBox="0 0 76 76"><circle class="track" cx="38" cy="38" r=${R} fill="none" stroke-width="8"/>
          <circle class="bar" cx="38" cy="38" r=${R} fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray=${C} stroke-dashoffset=${C * (1 - pct / 100)}/></svg>
        <b>${pct}%</b>
      </div>
      <div><h2>${warn ? 'Seu dia está sobrecarregado' : 'Seu dia até agora'}</h2><p>${detail}</p>
        ${!warn && prios.length > 0 && html`<p class="fine">As prioridades contam mais no anel.</p>`}</div>
    </div>
    ${!settings.guideDone && settings.name && html`<div class="guide">
      <h2>Como usar o planner</h2>
      <ol>
        <li><span>1</span>Escolha até 3 prioridades: o que não pode deixar de acontecer.</li>
        <li><span>2</span>Para registrar qualquer coisa, use o botão <b>Adicionar</b>. Para achar qualquer coisa, a lupa 🔍.</li>
        <li><span>3</span>Deixe na tela só o que você usa: toque em <b>Personalizar</b>, lá embaixo.</li>
      </ol>
      <button onClick=${() => saveSettings({ guideDone: true })}>Entendi, fechar guia</button>
    </div>`}
    ${order.filter(id => !hidden.includes(id)).map(id => BLOCK[id]?.())}
    ${settings.name && (!settings.lastBackupAt || Date.now() - new Date(settings.lastBackupAt) > 7 * 864e5) && html`<a class="backup-nudge" href="#/ajustes">
      <b>💾 Faça um backup</b><span>${settings.lastBackupAt ? 'Seu último backup tem mais de uma semana.' : 'Você ainda não salvou nenhuma cópia dos seus dados.'} Leva 10 segundos.</span></a>`}
    <a class="customize" href="#/hoje/editar">${icons.edit()} Personalizar a tela Hoje</a>
    <${EditSheet} cfg=${WINS} item=${winItem} onClose=${() => setWinItem(null)} />
    <${NameSheet} open=${!settings.name} />
    <${ItemSheet} item=${editing?.item} store=${editing?.store} onClose=${() => setEditing(null)} />
    ${editMode && html`<${HomeEditor} open=${true} settings=${settings} onClose=${() => { location.hash = '#/hoje'; }} />`}
  `;
}
