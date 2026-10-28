// Ficha de treino: modelo slim (academia ou casa), treino do dia com cargas e histórico
import { html, useState, useLayoutEffect } from '../lib/preact-htm.js';
import { useList, useRecord, useAutosave } from '../store/hooks.js';
import { save, get } from '../store/repo.js';
import { Section, Sheet, Check, toast } from '../components/ui.js';
import { TEMPLATES, WEEKDAYS } from '../lib/fitness.js';
import { markHabit } from '../lib/habit-link.js';
import { fromISO, toISO, shortDate } from '../lib/date.js';

const ID = 'active';
const EXERCISE = /exerc/i;
export const weekStart = iso => { const d = fromISO(iso); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d); };

// Próximo treino do rodízio: o seguinte ao último concluído
export function nextDay(plan, logs) {
  const done = logs.filter(l => l.done).sort((a, b) => (a.date + a.updatedAt).localeCompare(b.date + b.updatedAt));
  const last = done[done.length - 1];
  const i = last ? plan.days.findIndex(d => d.id === last.dayId) : -1;
  return plan.days[(i + 1) % plan.days.length];
}
export const lastLoad = (logs, name) => { for (const l of [...logs].filter(x => x.done).sort((a, b) => b.date.localeCompare(a.date))) { const e = l.items?.find(i => i.name === name && i.load); if (e) return e.load; } return ''; };

function Setup({ onDone, current }) {
  const [tpl, setTpl] = useState(current?.template || 'academia');
  const [days, setDays] = useState(current?.weekdays || [1, 3, 5]);
  const tog = d => setDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d]);
  const start = async () => {
    if (current && !confirm('Trocar o modelo apaga as mudanças que você fez nos exercícios. Continuar?')) return;
    await save('workoutPlans', { id: ID, template: tpl, weekdays: days, days: JSON.parse(JSON.stringify(TEMPLATES[tpl].days)), visibility: 'private' });
    toast('Ficha criada'); onDone?.();
  };
  return html`
    <${Section} title="1. Onde você vai treinar?" tone="teal">
      <div class="options">${Object.entries(TEMPLATES).map(([id, t]) => html`<button class=${'option' + (tpl === id ? ' on' : '')} aria-pressed=${tpl === id} onClick=${() => setTpl(id)}><strong>${t.name}</strong><span>${t.desc}</span></button>`)}</div>
    <//>
    <${Section} title="2. Em quais dias?" tone="teal" hint="3 dias por semana já dão ótimo resultado. Deixe pelo menos um dia de descanso entre eles.">
      <div class="chips">${WEEKDAYS.map(([d, n]) => html`<button class=${'chip' + (days.includes(d) ? ' on' : '')} aria-pressed=${days.includes(d)} onClick=${() => tog(d)}>${n}</button>`)}</div>
    <//>
    <button class="btn" style="margin-top:16px" disabled=${!days.length} onClick=${start}>Criar minha ficha</button>`;
}

function ExerciseSheet({ item, onSave, onDelete, onClose }) {
  const [f, setF] = useState(item || {});
  useLayoutEffect(() => setF(item || {}), [item]);
  if (!item) return null;
  const set = k => e => setF({ ...f, [k]: k === 'sets' || k === 'rest' ? +e.target.value : e.target.value });
  return html`<${Sheet} open=${!!item} onClose=${onClose} title=${item.name ? 'Editar exercício' : 'Novo exercício'}>
    <label class="field"><span>Exercício</span><input class="input" value=${f.name || ''} onInput=${set('name')} /></label>
    <div class="fieldrow"><label class="field"><span>Séries</span><input class="input" type="number" inputmode="numeric" value=${f.sets ?? 3} onInput=${set('sets')} /></label>
      <label class="field"><span>Repetições</span><input class="input" value=${f.reps || '12'} onInput=${set('reps')} /></label></div>
    <label class="field"><span>Descanso (segundos)</span><input class="input" type="number" inputmode="numeric" value=${f.rest ?? 60} onInput=${set('rest')} /></label>
    <label class="field"><span>Dica de execução (opcional)</span><input class="input" value=${f.tip || ''} onInput=${set('tip')} /></label>
    <button class="btn" disabled=${!f.name?.trim()} onClick=${() => { onSave({ ...f, name: f.name.trim() }); onClose(); }}>Salvar</button>
    ${item.name && html`<button class="btn ghost" onClick=${() => { onDelete(); onClose(); }}>Remover da ficha</button>`}
  <//>`;
}

// Execução do treino: marca cada exercício e anota a carga
function Session({ plan, day, date, logs, onClose }) {
  const id = `${date}_${day.id}`;
  const draft = logs.find(l => l.id === id);
  const [items, setItems] = useState(() => draft?.items || day.exercises.map(e => ({ name: e.name, done: false, load: '' })));
  const [cardio, setCardio] = useState(draft?.cardio || false);
  const persist = useAutosave(v => save('workoutLogs', { id, date, dayId: day.id, items: v.items, cardio: v.cardio, done: false, visibility: 'private' }), 500);
  const upd = (i, patch) => { const n = items.map((x, j) => j === i ? { ...x, ...patch } : x); setItems(n); persist({ items: n, cardio }); };
  const doneN = items.filter(i => i.done).length;
  const finish = async () => {
    persist.flush();
    await save('workoutLogs', { id, date, dayId: day.id, items, cardio, done: true, visibility: 'private' });
    await markHabit(EXERCISE, date);
    toast('Treino concluído 💪 Hábito Exercício marcado'); onClose();
  };
  return html`<div class="session">
    <div class="session-head"><button class="icon-btn" aria-label="Voltar" onClick=${() => { persist.flush(); onClose(); }}>‹</button>
      <div><h1>${day.name}</h1><span>${doneN} de ${items.length} exercícios</span></div></div>
    <div class="progress"><span style=${`width:${doneN / items.length * 100}%;background:var(--teal)`}></span></div>
    <div class="rows" style="margin-top:12px">${day.exercises.map((e, i) => { const it = items[i] || {}; const prev = lastLoad(logs, e.name);
      return html`<div class=${'ex-row' + (it.done ? ' done' : '')}>
        <${Check} on=${it.done} label=${'Concluir ' + e.name} onToggle=${() => upd(i, { done: !it.done })} />
        <div class="grow"><strong>${e.name}</strong><span class="ex-meta">${e.sets} × ${e.reps} · descanso ${e.rest}s${prev ? ` · última: ${prev}` : ''}</span>
          ${e.tip && html`<small class="ex-tip">${e.tip}</small>`}</div>
        <input class="load" inputmode="decimal" placeholder=${prev || 'kg'} value=${it.load} aria-label=${'Carga em ' + e.name} onInput=${ev => upd(i, { load: ev.target.value })} />
      </div>`; })}</div>
    ${day.cardio && html`<label class="toggle" style="margin-top:12px"><input type="checkbox" checked=${cardio} onChange=${e => { setCardio(e.target.checked); persist({ items, cardio: e.target.checked }); }} />
      <span><strong>Cardio: ${day.cardio}</strong><small>Fazer depois dos exercícios ajuda a queimar gordura sem perder força.</small></span></label>`}
    <p class="plan-hint">Dica de progressão: quando fizer todas as séries com facilidade e boa postura, aumente um pouco a carga no próximo treino.</p>
    <button class="btn" style="margin-top:8px" onClick=${finish}>✓ Concluir treino</button>
  </div>`;
}

export function Treino({ date }) {
  const plan = useRecord('workoutPlans', ID);
  const logs = useList('workoutLogs', () => true, []);
  const [changing, setChanging] = useState(false);
  const [session, setSession] = useState(null);
  const [editing, setEditing] = useState(null); // { dayIdx, exIdx, item }
  const [open, setOpen] = useState(null);
  if (plan === undefined || !logs) return null;
  if (!plan || changing) return html`<h1 class="page-title">Ficha de treino</h1>
    <p class="soon">Uma ficha para o shape slim: pernas e glúteos firmes, braços e abdômen definidos, com cardio para reduzir gordura. Você pode ajustar cada exercício depois.</p>
    <${Setup} current=${plan} onDone=${() => setChanging(false)} />
    ${changing && html`<button class="btn ghost" onClick=${() => setChanging(false)}>Voltar à minha ficha</button>`}`;
  if (session) return html`<${Session} plan=${plan} day=${plan.days.find(d => d.id === session)} date=${date} logs=${logs} onClose=${() => setSession(null)} />`;

  const next = nextDay(plan, logs);
  const todayDone = logs.find(l => l.date === date && l.done);
  const isDay = plan.weekdays.includes(fromISO(date).getDay());
  const ws = weekStart(date);
  const week = logs.filter(l => l.done && l.date >= ws).length;
  const hist = logs.filter(l => l.done).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const saveEx = (di, xi, ex) => { const days = plan.days.map((d, i) => i !== di ? d : { ...d, exercises: xi == null ? [...d.exercises, ex] : d.exercises.map((e, j) => j === xi ? ex : e) }); save('workoutPlans', { ...plan, days }); };
  const delEx = (di, xi) => { const days = plan.days.map((d, i) => i !== di ? d : { ...d, exercises: d.exercises.filter((_, j) => j !== xi) }); save('workoutPlans', { ...plan, days }); };
  return html`<h1 class="page-title">Treino</h1>
    <div class="stat-row"><div><b>${week}/${plan.weekdays.length}</b><span>treinos na semana</span></div><div><b>${logs.filter(l => l.done && l.date.slice(0, 7) === date.slice(0, 7)).length}</b><span>no mês</span></div><div><b>${logs.filter(l => l.done).length}</b><span>no total</span></div></div>
    <${Section} title=${todayDone ? 'Treino de hoje feito ✓' : isDay ? 'Treino de hoje' : 'Hoje é dia de descanso'} icon=${html`<span aria-hidden="true">💪</span>`} tone="teal"
      hint=${todayDone ? 'Ótimo trabalho. Descanso e boa alimentação completam o resultado.' : isDay ? 'O próximo do seu rodízio. Toque em começar e marque cada exercício.' : 'Descansar também faz parte. Se quiser treinar mesmo assim, pode.'}>
      ${!todayDone && html`<button class="btn" onClick=${() => setSession(next.id)}>Começar ${next.name}</button>`}
    <//>
    <${Section} title="Minha ficha" tone="teal" hint=${`${TEMPLATES[plan.template].name} · ${plan.weekdays.length}x por semana (${WEEKDAYS.filter(w => plan.weekdays.includes(w[0])).map(w => w[1]).join(', ')}). Toque num treino para ver e editar.`}>
      <div class="rows">${plan.days.map((d, di) => html`<div class="plan-day">
        <button class="pd-head" aria-expanded=${open === d.id} onClick=${() => setOpen(open === d.id ? null : d.id)}><strong>${d.name}</strong><span>${d.exercises.length} exercícios ${open === d.id ? '▴' : '▾'}</span></button>
        ${open === d.id && html`<div class="pd-body">${d.exercises.map((e, xi) => html`<button class="pd-ex" onClick=${() => setEditing({ di, xi, item: e })}><span>${e.name}</span><b>${e.sets}×${e.reps}</b></button>`)}
          ${d.cardio && html`<p class="plan-hint">+ Cardio: ${d.cardio}</p>`}
          <div class="pd-actions"><button class="link" onClick=${() => setEditing({ di, xi: null, item: { sets: 3, reps: '12', rest: 60 } })}>+ Exercício</button><button class="link" onClick=${() => setSession(d.id)}>Treinar este</button></div></div>`}
      </div>`)}</div>
    <//>
    ${hist.length > 0 && html`<${Section} title="Últimos treinos" tone="teal"><div class="rows">${hist.map(l => html`<div class="row"><div class="grow item-btn stack"><span class="title">${plan.days.find(d => d.id === l.dayId)?.name || l.dayId}</span>
      <span class="sub">${shortDate(l.date)} · ${l.items.filter(i => i.done).length} exercícios${l.cardio ? ' · cardio ✓' : ''}</span></div></div>`)}</div><//>`}
    <p class="cycle-note">Ficha de referência geral. Se tiver dor, lesão ou alguma condição de saúde, faça uma avaliação com educador físico antes. Ele também ajusta as cargas à sua realidade.</p>
    <button class="btn ghost" onClick=${() => setChanging(true)}>Trocar modelo ou dias</button>
    <${ExerciseSheet} item=${editing?.item} onClose=${() => setEditing(null)} onSave=${ex => saveEx(editing.di, editing.xi, ex)} onDelete=${() => delEx(editing.di, editing.xi)} />`;
}
