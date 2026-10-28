import { html, useState } from '../lib/preact-htm.js';
import { useList } from '../store/hooks.js';
import { save } from '../store/repo.js';
import { Check, Section, Sheet, toast } from '../components/ui.js';
import { ItemSheet } from '../components/itemsheet.js';
import { removeWithUndo } from '../lib/actions.js';
import { icons } from '../components/icons.js';
import { fromISO, weekday, dayMonth, todayISO, toISO } from '../lib/date.js';

const label = (d, today) => {
  const t = fromISO(today); const n = Math.round((fromISO(d) - t) / 864e5);
  return n === 1 ? 'Amanhã' : `${weekday(fromISO(d))}, ${dayMonth(fromISO(d))}`;
};

// Lista de tudo que vem pela frente (o calendário em grade chega numa fase seguinte)
export function Proximos({ date }) {
  const [editing, setEditing] = useState(null);
  const tasks = useList('tasks', t => t.status === 'todo' && t.date !== date, [date]);
  const events = useList('events', e => e.date > date, [date]);
  if (!tasks || !events) return null;
  const late = tasks.filter(t => t.date < date).sort((a, b) => a.date.localeCompare(b.date));
  const items = [...tasks.filter(t => t.date > date).map(i => ({ ...i, _s: 'tasks' })), ...events.map(i => ({ ...i, _s: 'events' }))]
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'));
  const days = [...new Set(items.map(i => i.date))];
  const toggle = t => save('tasks', { ...t, status: 'done', completedAt: new Date().toISOString(), completedOn: todayISO() }).then(() => toast('Tarefa concluída'));
  const Row = i => html`<div class="row">
    ${i._s === 'events' ? html`<span class="time">${i.time || 'Dia'}</span>` : html`<${Check} on=${false} label=${'Concluir ' + i.title} onToggle=${() => toggle(i)} />`}
    <button class="grow item-btn stack" onClick=${() => setEditing({ item: i, store: i._s || 'tasks' })}><span class="title">${i.title}</span>
      ${i._s === 'tasks' && i.time && html`<span class="sub">${i.time}</span>`}</button>
  </div>`;
  return html`
    <h1 class="page-title">Próximos dias</h1>
    <p class="soon">Tudo o que vem pela frente, em ordem. Toque num item para editar ou mudar de dia. A visão em calendário mensal e semanal chega numa próxima fase.</p>
    ${late.length > 0 && html`<${Section} title="Atrasadas" icon=${icons.clock()} tone="rose" hint="Decida o destino de cada uma: fazer hoje, outro dia ou desistir." meta=${late.length}>
      <div class="rows">${late.map(t => Row({ ...t, _s: 'tasks' }))}</div><//>`}
    ${!items.length && !late.length && html`<div class="empty" style="margin-top:8px">Nada agendado depois de hoje. Use o botão Adicionar e escolha uma data.</div>`}
    ${days.map(d => html`<${Section} title=${label(d, date)} icon=${icons.calendario()} tone="lilac">
      <div class="rows">${items.filter(i => i.date === d).map(Row)}</div><//>`)}
    <${ItemSheet} item=${editing?.item} store=${editing?.store} onClose=${() => setEditing(null)} />`;
}

// Despejo mental: anotações soltas para organizar depois
export function Anotacoes() {
  const [converting, setConverting] = useState(null);
  const [cdate, setCdate] = useState(todayISO());
  const notes = useList('notes', n => n.kind === 'dump' && n.status === 'open', []);
  if (!notes) return null;
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const archive = async n => { await save('notes', { ...n, status: 'archived' }); toast('Arquivada', { undo: () => save('notes', n) }); };
  const convert = async kind => {
    const n = converting;
    await save(kind, kind === 'tasks' ? { title: n.text, date: cdate, time: null, status: 'todo', priority: 'normal', area: null } : { title: n.text, date: cdate, time: null, area: null });
    await save('notes', { ...n, status: 'converted' });
    toast(kind === 'tasks' ? 'Virou tarefa' : 'Virou compromisso'); setConverting(null);
  };
  return html`
    <h1 class="page-title">Anotações</h1>
    <p class="soon">Ideias soltas que você guardou pelo botão Adicionar. Transforme em tarefa quando souber o dia, ou arquive.</p>
    ${!sorted.length && html`<div class="empty">Nenhuma anotação pendente. Use Adicionar > Anotação para despejar o que estiver na cabeça.</div>`}
    <div class="rows">${sorted.map(n => html`<div class="note-card">
      <p>${n.text}</p>
      <div class="note-actions">
        <button onClick=${() => { setCdate(todayISO()); setConverting(n); }}>Virar tarefa</button>
        <button onClick=${() => archive(n)}>Arquivar</button>
        <button onClick=${() => removeWithUndo('notes', n.id, 'Anotação excluída')}>Excluir</button>
      </div></div>`)}</div>
    <${Sheet} open=${!!converting} onClose=${() => setConverting(null)} title="Organizar anotação">
      <p class="lead">"${converting?.text}"</p>
      <label class="field"><span>Para que dia?</span><input type="date" class="input" value=${cdate} onInput=${e => setCdate(e.target.value)} /></label>
      <button class="btn" onClick=${() => convert('tasks')}>Virar tarefa</button>
      <button class="btn ghost" onClick=${() => convert('events')}>Virar compromisso</button>
    <//>`;
}
