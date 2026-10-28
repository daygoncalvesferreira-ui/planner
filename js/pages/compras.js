import { html, useState, useEffect, useLayoutEffect } from '../lib/preact-htm.js';
import { useList } from '../store/hooks.js';
import { save, remove } from '../store/repo.js';
import { removeWithUndo } from '../lib/actions.js';
import { Check, Sheet, toast } from '../components/ui.js';
import { icons } from '../components/icons.js';
import { SECTIONS, SECTION, addItem, learn, norm } from '../lib/shopping.js';

function EditItem({ item, onClose }) {
  const [f, setF] = useState(item || {});
  const [staple, setStaple] = useState(false);
  const cat = useList('shoppingCatalog', c => item && c.listId === item.listId && norm(c.name) === norm(item.name), [item?.id]);
  useLayoutEffect(() => { setF(item || {}); }, [item]);
  useEffect(() => { if (cat) setStaple(!!cat[0]?.staple); }, [cat]);
  if (!item) return null;
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    await save('shoppingItems', f);
    // Renomeou: o histórico antigo passa para o novo nome (sem duplicar sugestões)
    if (norm(f.name) !== norm(item.name) && cat?.[0]) { await remove('shoppingCatalog', cat[0].id); await learn(item.listId, f.name, { count: cat[0].count }); }
    await learn(item.listId, f.name, { section: f.section, staple, name: f.name });
    onClose();
  }
  return html`<${Sheet} open=${!!item} onClose=${onClose} title="Editar item">
    <form onSubmit=${submit}>
      <label class="field"><span>Item</span><input class="input" value=${f.name} onInput=${set('name')} /></label>
      <div class="fieldrow">
        <label class="field"><span>Quantidade</span><input class="input" value=${f.qty} onInput=${set('qty')} placeholder="Ex.: 2 ou 1 kg" /></label>
        <label class="field"><span>Seção do mercado</span>
          <select class="input" value=${f.section} onChange=${set('section')}>${SECTIONS.map(([id, n]) => html`<option value=${id}>${n}</option>`)}</select></label>
      </div>
      <label class="field"><span>Observação</span><input class="input" value=${f.note} onInput=${set('note')} placeholder="Marca, tamanho, sabor…" /></label>
      <label class="toggle"><input type="checkbox" checked=${staple} onChange=${e => setStaple(e.target.checked)} />
        <span><strong>Faz parte dos básicos da casa</strong><small>Aparece na lista de básicos para você repor com um toque.</small></span></label>
      <button class="btn">Salvar</button>
      <button type="button" class="btn ghost" onClick=${() => { removeWithUndo('shoppingItems', item.id, 'Item removido'); onClose(); }}>Tirar da lista</button>
    </form>
  <//>`;
}

function Staples({ open, listId, pendingNames, onClose }) {
  const staples = useList('shoppingCatalog', c => c.listId === listId && c.staple, [listId]);
  if (!open || !staples) return null;
  const bySec = SECTIONS.map(([id]) => [id, staples.filter(s => s.section === id).sort((a, b) => a.name.localeCompare(b.name))]).filter(([, a]) => a.length);
  const add = async s => {
    if (pendingNames.has(norm(s.name))) return;
    await addItem(listId, s.name, { section: s.section });
  };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Básicos da casa">
    <p class="lead">Toque no que acabou para colocar na lista. Para incluir novos básicos, toque num item da lista e marque "Faz parte dos básicos".</p>
    ${!staples.length && html`<div class="empty">Nenhum básico nesta lista ainda.</div>`}
    ${bySec.map(([sec, arr]) => html`<div class="staple-group"><h3>${SECTION[sec].emoji} ${SECTION[sec].name}</h3>
      <div class="chips">${arr.map(s => { const on = pendingNames.has(norm(s.name)); return html`<button class=${'chip' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => add(s)}>${on ? '✓ ' : '+ '}${s.name}</button>`; })}</div></div>`)}
    <button class="btn" style="margin-top:18px" onClick=${onClose}>Pronto</button>
  <//>`;
}

export function Compras() {
  const [listId, setListId] = useState('mercado');
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(null);
  const [staplesOpen, setStaplesOpen] = useState(false);
  const lists = useList('shoppingLists', () => true, []);
  const all = useList('shoppingItems', () => true, []);
  const catalog = useList('shoppingCatalog', c => c.listId === listId, [listId]);
  if (!lists || !all || !catalog) return null;

  const items = all.filter(i => i.listId === listId);
  const pending = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  const pendingNames = new Set(pending.map(i => norm(i.name)));
  const qtyPrefix = (text.match(/^\d+([.,]\d+)?\s*(kg|g|l|ml|un|pct|cx|dz)?\.?\s+/i) || [''])[0];
  const q = norm(text.slice(qtyPrefix.length));
  const suggestions = q.length >= 2 ? catalog.filter(c => norm(c.name).includes(q) && !pendingNames.has(norm(c.name)) && norm(c.name) !== q)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 5) : [];

  async function add(value, extra) {
    const r = await addItem(listId, value, extra);
    if (r?.duplicate) toast('Esse item já está na lista');
    setText('');
  }
  const toggle = i => save('shoppingItems', { ...i, done: !i.done, doneAt: i.done ? null : new Date().toISOString() });
  const clearDone = () => removeWithUndo('shoppingItems', done.map(i => i.id), done.length === 1 ? '1 item comprado removido' : `${done.length} itens comprados removidos`);
  const groups = SECTIONS.map(([id]) => [id, pending.filter(i => i.section === id).sort((a, b) => a.name.localeCompare(b.name))]).filter(([, a]) => a.length);

  const Row = i => html`<div class=${'row' + (i.done ? ' done' : '')}>
    <${Check} on=${i.done} label=${(i.done ? 'Desmarcar ' : 'Peguei ') + i.name} onToggle=${() => toggle(i)} />
    <button class="grow item-btn" onClick=${() => setEditing(i)}>
      <span class="title">${i.name}</span>${i.qty && html`<span class="qty">${i.qty}</span>`}
      ${i.note && html`<span class="sub">${i.note}</span>`}
    </button>
  </div>`;

  return html`
    <h1 class="page-title">Lista de compras</h1>
    <p class="soon">Escreva o que precisa, pegue no mercado tocando na caixinha. A lista se organiza sozinha pela ordem dos corredores.</p>
    <div class="tabs" role="tablist">${[...lists].sort((a, b) => a.order - b.order).map(l => {
      const n = all.filter(i => i.listId === l.id && !i.done).length;
      return html`<button role="tab" aria-selected=${l.id === listId} class=${'tab' + (l.id === listId ? ' on' : '')} onClick=${() => { setListId(l.id); setText(''); }}>${l.emoji} ${l.name}${n ? html`<b>${n}</b>` : ''}</button>`;
    })}</div>

    <section class="section tone-teal">
      <form class="add-row" onSubmit=${e => { e.preventDefault(); text.trim() && add(text); }}>
        <input value=${text} onInput=${e => setText(e.target.value)} placeholder="Ex.: 2 leite" aria-label="Novo item" enterkeyhint="done" autocomplete="off" />
        ${text.trim() && html`<button>Adicionar</button>`}
      </form>
      ${suggestions.length > 0 && html`<div class="suggest"><small>Você já comprou:</small>${suggestions.map(s => html`<button onClick=${() => add(qtyPrefix + s.name, { section: s.section })}>+ ${s.name}</button>`)}</div>`}
      <div class="actions">
        <button class="pill" onClick=${() => setStaplesOpen(true)}>⭐ Básicos da casa</button>
        ${done.length > 0 && html`<button class="pill ghost" onClick=${clearDone}>Limpar comprados (${done.length})</button>`}
      </div>
    </section>

    ${!pending.length && !done.length && html`<div class="empty" style="margin-top:16px">Lista vazia. Digite acima ou toque em Básicos da casa para repor o que acabou.</div>`}
    ${groups.map(([sec, arr]) => html`<section class="section tone-teal shop-group">
      <div class="group-head"><span>${SECTION[sec].emoji}</span><h2>${SECTION[sec].name}</h2><span class="meta">${arr.length}</span></div>
      <div class="rows">${arr.map(Row)}</div>
    </section>`)}
    ${done.length > 0 && html`<section class="section shop-group tone-teal">
      <div class="group-head"><span>🛍️</span><h2>No carrinho</h2><span class="meta">${done.length}</span></div>
      <div class="rows">${done.map(Row)}</div>
    </section>`}

    <${EditItem} item=${editing} onClose=${() => setEditing(null)} />
    <${Staples} open=${staplesOpen} listId=${listId} pendingNames=${pendingNames} onClose=${() => setStaplesOpen(false)} />`;
}
