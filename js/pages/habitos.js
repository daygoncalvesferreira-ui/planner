// Hábitos: visão da semana, % do mês e edição (criar, renomear, escolher dias, reordenar, remover)
import { html, useState, useLayoutEffect } from '../lib/preact-htm.js';
import { useList } from '../store/hooks.js';
import { save, remove } from '../store/repo.js';
import { Sheet, Section, toast } from '../components/ui.js';
import { removeWithUndo } from '../lib/actions.js';
import { WEEKDAYS } from '../lib/fitness.js';
import { fromISO, toISO, todayISO } from '../lib/date.js';

export const HABIT_ICON = { 'Água': '💧', 'Exercício': '🏃‍♀️', 'Bíblia/devocional': '📖', 'Skincare': '🧴', 'Organização da casa': '🏠',
  'Alimentação': '🥗', 'Tempo com marido': '❤️', 'Tempo com filha': '👧', 'Estudos': '📚' };
export const habitEmoji = h => h.emoji || HABIT_ICON[h.name] || '✨';
// Hábito vale para o dia? (sem dias escolhidos = todos os dias)
export const habitOn = (h, iso) => !h.days?.length || h.days.includes(fromISO(iso).getDay());
const AUTO = { 'Água': 'Marcado sozinho ao bater a meta de água', 'Exercício': 'Marcado sozinho ao concluir o treino', 'Alimentação': 'Marcado sozinho com 4 hábitos de alimentação', 'Bíblia/devocional': 'Marcado sozinho ao concluir a leitura bíblica' };
const EMOJIS = ['✨', '💧', '🏃‍♀️', '📖', '🧴', '🏠', '🥗', '❤️', '👧', '📚', '🧘‍♀️', '😴', '🙏', '💊', '🚶‍♀️', '📵', '🎹', '🌱', '💰', '✍️'];
const shift = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };

function HabitSheet({ item, count, onClose }) {
  const [f, setF] = useState({});
  useLayoutEffect(() => { if (item) setF({ emoji: habitEmoji(item), days: [], ...item }); }, [item]);
  if (!item) return null;
  const tog = d => setF({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] });
  const submit = async () => { await save('habits', { frequency: 'daily', goal: 1, active: true, order: count, ...f, name: f.name.trim() }); toast(item.id ? 'Hábito atualizado' : 'Hábito criado'); onClose(); };
  return html`<${Sheet} open=${!!item} onClose=${onClose} title=${item.id ? 'Editar hábito' : 'Novo hábito'}>
    <label class="field"><span>Nome</span><input class="input" value=${f.name || ''} onInput=${e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Dormir antes das 23h" /></label>
    <div class="field"><span>Ícone</span><div class="emoji-grid">${EMOJIS.map(e => html`<button type="button" class=${f.emoji === e ? 'on' : ''} aria-label=${'Ícone ' + e} onClick=${() => setF({ ...f, emoji: e })}>${e}</button>`)}</div></div>
    <div class="field"><span>Em quais dias? (nenhum marcado = todos os dias)</span><div class="chips">${WEEKDAYS.map(([d, n]) => html`<button type="button" class=${'chip' + (f.days?.includes(d) ? ' on' : '')} onClick=${() => tog(d)}>${n}</button>`)}</div></div>
    ${AUTO[item.name] && html`<p class="plan-hint">💡 ${AUTO[item.name]}.</p>`}
    <button class="btn" disabled=${!f.name?.trim()} onClick=${submit}>Salvar</button>
    ${item.id && html`<button class="btn ghost" onClick=${() => { removeWithUndo('habits', item.id, 'Hábito removido'); onClose(); }}>Remover hábito</button>`}
  <//>`;
}

export function Habitos({ date }) {
  const habits = useList('habits', h => h.active, []);
  const ws = shift(date, -((fromISO(date).getDay() + 6) % 7));
  const since = shift(date, -29);
  const logs = useList('habitLogs', l => l.date >= since, [since]);
  const [editing, setEditing] = useState(null);
  const [order, setOrder] = useState(false);
  if (!habits || !logs) return null;
  const hs = [...habits].sort((a, b) => a.order - b.order);
  const has = new Set(logs.map(l => l.habitId + '_' + l.date));
  const week = Array.from({ length: 7 }, (_, i) => shift(ws, i));
  const toggle = (h, d) => { const id = `${h.id}_${d}`; has.has(h.id + '_' + d) ? remove('habitLogs', id) : save('habitLogs', { id, habitId: h.id, date: d, value: 1 }); };
  const move = async (i, dir) => { const a = hs[i], b = hs[i + dir]; if (!b) return; await save('habits', { ...a, order: b.order }); await save('habits', { ...b, order: a.order }); };
  // % desde que o hábito existe (no máximo 30 dias): quem começou ontem não vê 3%
  const pct = h => { const start = (h.createdAt || '').slice(0, 10); let due = 0, ok = 0; for (let i = 0; i < 30; i++) { const d = shift(since, i); if (d > date || d < start || !habitOn(h, d)) continue; due++; if (has.has(h.id + '_' + d)) ok++; } return due ? Math.round(ok / due * 100) : 0; };
  return html`<h1 class="page-title">Hábitos</h1>
    <p class="soon">Toque num dia para marcar ou desmarcar. Sem sequência para "quebrar": o que importa é a constância no mês.</p>
    <${Section} title="Esta semana" tone="amber" action=${html`<button class="link" onClick=${() => setOrder(!order)}>${order ? 'Pronto' : 'Reordenar'}</button>`}>
      <div class="hw-head"><span></span>${week.map((d, i) => html`<b class=${d === date ? 'today' : ''}>${'STQQSSD'[i]}</b>`)}</div>
      ${hs.map((h, i) => html`<div class="hw-row">
        ${order ? html`<div class="hw-order"><button aria-label="Subir" disabled=${i === 0} onClick=${() => move(i, -1)}>▲</button><button aria-label="Descer" disabled=${i === hs.length - 1} onClick=${() => move(i, 1)}>▼</button><span>${habitEmoji(h)} ${h.name}</span></div>`
          : html`<button class="hw-name" onClick=${() => setEditing(h)}><span>${habitEmoji(h)}</span><div><strong>${h.name}</strong><small>${pct(h)}% ${(h.createdAt || '').slice(0, 10) > since ? 'desde que começou' : 'nos últimos 30 dias'}${h.days?.length ? ` · ${WEEKDAYS.filter(w => h.days.includes(w[0])).map(w => w[1]).join(', ')}` : ''}</small></div></button>`}
        ${!order && week.map(d => { const on = has.has(h.id + '_' + d), due = habitOn(h, d);
          return html`<button class=${'hw-dot' + (on ? ' on' : '') + (!due ? ' off' : '')} disabled=${d > date} aria-label=${`${h.name}, ${d}`} aria-pressed=${on} onClick=${() => toggle(h, d)}>${on ? '✓' : ''}</button>`; })}
      </div>`)}
    <//>
    <button class="add-big" onClick=${() => setEditing({ name: '', days: [] })}>+ Novo hábito</button>
    <p class="plan-hint">Toque no nome de um hábito para editar, escolher os dias ou remover. Poucos hábitos bem feitos valem mais que muitos pela metade.</p>
    <${HabitSheet} item=${editing} count=${hs.length} onClose=${() => setEditing(null)} />`;
}
