// Lista genérica de registros (conquistas, memórias, encontros, sonhos, oração).
// Cada página só descreve campos, filtros e como mostrar uma linha: evita repetir código.
import { html, useState, useLayoutEffect } from '../lib/preact-htm.js';
import { useList } from '../store/hooks.js';
import { save } from '../store/repo.js';
import { Sheet, toast } from './ui.js';
import { removeWithUndo } from '../lib/actions.js';
import { todayISO } from '../lib/date.js';

export function Field({ f, value, set }) {
  const v = value ?? '';
  if (f.type === 'textarea') return html`<label class="field"><span>${f.label}</span><textarea class="input area" rows="3" value=${v} placeholder=${f.ph || ''} onInput=${e => set(e.target.value)}></textarea></label>`;
  if (f.type === 'choice') return html`<div class="field"><span>${f.label}</span><div class="chips">${f.options.map(([id, n]) => html`<button type="button" class=${'chip' + (v === id ? ' on' : '')} aria-pressed=${v === id} onClick=${() => set(v === id && !f.required ? '' : id)}>${n}</button>`)}</div></div>`;
  if (f.type === 'stars') return html`<div class="field"><span>${f.label}</span><div class="stars" role="radiogroup" aria-label=${f.label}>${[1, 2, 3, 4, 5].map(n => html`<button type="button" role="radio" aria-checked=${v === n} aria-label=${n + ' estrelas'} class=${n <= (v || 0) ? 'on' : ''} onClick=${() => set(v === n ? 0 : n)}>★</button>`)}</div></div>`;
  return html`<label class="field"><span>${f.label}</span><input class="input" type=${f.type || 'text'} inputmode=${f.inputmode} value=${v} placeholder=${f.ph || ''} onInput=${e => set(f.type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value)} /></label>`;
}

export function EditSheet({ cfg, item, onClose, title }) {
  const [f, setF] = useState(item || {});
  useLayoutEffect(() => setF(item || {}), [item]);
  if (!item) return null;
  const req = cfg.fields.find(x => x.main);
  const submit = async e => {
    e.preventDefault();
    if (req && !String(f[req.key] || '').trim()) return;
    const rec = await save(cfg.store, { visibility: 'private', ...(cfg.normalize ? cfg.normalize(f) : f) });
    if (!item.id) toast(cfg.savedMsg || 'Salvo');
    cfg.afterSave?.(rec, item);
    onClose();
  };
  return html`<${Sheet} open=${!!item} onClose=${onClose} title=${title || (item.id ? 'Editar' : cfg.newTitle)}>
    ${cfg.lead && !item.id && html`<p class="lead">${cfg.lead}</p>`}
    <form onSubmit=${submit}>
      ${cfg.fields.filter(x => !x.show || x.show(f)).map(x => html`<${Field} f=${x} value=${f[x.key]} set=${v => setF(cur => ({ ...cur, [x.key]: v }))} />`)}
      <button class="btn" disabled=${req && !String(f[req.key] || '').trim()}>Salvar</button>
      ${item.id && html`<button type="button" class="btn ghost" onClick=${() => { removeWithUndo(cfg.store, item.id, 'Excluído'); onClose(); }}>Excluir</button>`}
    </form>
  <//>`;
}

export function Collection({ cfg, date }) {
  const rows = useList(cfg.store, cfg.filter || (() => true), []);
  const [tab, setTab] = useState(cfg.tabs?.[0][0] || 'all');
  const [editing, setEditing] = useState(null);
  if (!rows) return null;
  const tabFn = cfg.tabs?.find(t => t[0] === tab)?.[2] || (() => true);
  const shown = rows.filter(tabFn).sort(cfg.sort || ((a, b) => (b.date || b.createdAt).localeCompare(a.date || a.createdAt)));
  const add = () => setEditing({ date: todayISO(), ...(cfg.defaults?.(tab) || {}) });
  return html`
    <h1 class="page-title">${cfg.emoji} ${cfg.title}</h1>
    <p class="soon">${cfg.intro}</p>
    ${cfg.header?.(rows, date)}
    ${cfg.tabs && html`<div class="tabs" role="tablist">${cfg.tabs.map(([id, n, fn]) => { const c = rows.filter(fn).length; return html`<button role="tab" aria-selected=${tab === id} class=${'tab' + (tab === id ? ' on' : '')} onClick=${() => setTab(id)}>${n}${c ? html`<b>${c}</b>` : ''}</button>`; })}</div>`}
    <button class="add-big" onClick=${add}>+ ${cfg.addLabel}</button>
    ${!shown.length && html`<div class="empty">${cfg.empty}</div>`}
    <div class="cards">${shown.map(r => html`<div class="card-row ${cfg.rowClass?.(r) || ''}">
      <button class="card-main" onClick=${() => setEditing(r)}>${cfg.row(r, date)}</button>
      ${cfg.action?.(r, setEditing)}
    </div>`)}</div>
    <${EditSheet} cfg=${cfg} item=${editing} onClose=${() => setEditing(null)} />`;
}
