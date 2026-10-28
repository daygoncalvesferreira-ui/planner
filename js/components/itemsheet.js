import { html, useState, useEffect } from '../lib/preact-htm.js';
import { Sheet, toast } from './ui.js';
import { save } from '../store/repo.js';
import { removeWithUndo } from '../lib/actions.js';
import { todayISO, toISO, fromISO, shortDate } from '../lib/date.js';

const plusDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return toISO(d); };

// Editar tarefa ou compromisso. Para tarefa atrasada vira "Não consegui fazer".
export function ItemSheet({ item, store = 'tasks', onClose }) {
  const [f, setF] = useState(item || {});
  useEffect(() => setF(item || {}), [item]);
  if (!item) return null;
  const isTask = store === 'tasks';
  const late = isTask && item.status === 'todo' && item.date < todayISO();
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const move = async (date, msg) => { await save(store, { ...f, date }); toast(msg); onClose(); };
  async function submit(e) { e.preventDefault(); if (!f.title?.trim()) return; await save(store, { ...f, title: f.title.trim(), time: f.time || null }); onClose(); }
  const cancel = async () => {
    const prev = item;
    await save(store, { ...f, status: 'cancelled', cancelledOn: todayISO() });
    toast('Tarefa cancelada', { undo: () => save(store, prev) }); onClose();
  };
  const del = async () => { await removeWithUndo(store, item.id, isTask ? 'Tarefa excluída' : 'Compromisso excluído'); onClose(); };

  return html`<${Sheet} open=${!!item} onClose=${onClose} title=${late ? 'Não consegui fazer' : isTask ? 'Editar tarefa' : 'Editar compromisso'}>
    ${late && html`<p class="lead">Estava marcada para ${shortDate(item.date)}. Escolha o que fazer com ela, sem culpa: tarefas atrasadas não devem se acumular.</p>`}
    ${isTask && html`<div class="quick-dates">
      <button type="button" onClick=${() => move(todayISO(), 'Movida para hoje')}>Fazer hoje</button>
      <button type="button" onClick=${() => move(plusDays(1), 'Movida para amanhã')}>Amanhã</button>
      <button type="button" onClick=${() => move(plusDays(7), 'Movida para daqui a 1 semana')}>Daqui 1 semana</button>
    </div>`}
    <form onSubmit=${submit}>
      <label class="field"><span>${isTask ? 'Tarefa' : 'Compromisso'}</span><input class="input" value=${f.title} onInput=${set('title')} /></label>
      <div class="fieldrow">
        <label class="field"><span>${late ? 'Ou escolha outra data' : 'Dia'}</span><input type="date" class="input" value=${f.date} onInput=${set('date')} /></label>
        <label class="field"><span>Horário</span><input type="time" class="input" value=${f.time || ''} onInput=${set('time')} /></label>
      </div>
      <button class="btn">Salvar</button>
    </form>
    <div class="danger-row">
      ${isTask && html`<button type="button" onClick=${cancel}>Não vou mais fazer</button>`}
      <button type="button" onClick=${del}>Excluir</button>
    </div>
  <//>`;
}
