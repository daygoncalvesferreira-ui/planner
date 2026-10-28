import { html, useState, useRef, useLayoutEffect } from '../lib/preact-htm.js';
import { Sheet, toast } from './ui.js';
import { save } from '../store/repo.js';
import { todayISO } from '../lib/date.js';
import { addItem, LISTS } from '../lib/shopping.js';

// Adicionar universal: tudo o que se registra no dia a dia, num só lugar. Só o texto é obrigatório.
const TYPES = [['task', '✅', 'Tarefa'], ['event', '📅', 'Compromisso'], ['buy', '🛒', 'Compra'], ['note', '💭', 'Anotação'],
  ['win', '🏆', 'Conquista'], ['memory', '👧', 'Olivia'], ['media', '🍿', 'Filme/livro'], ['prayer', '🙏', 'Oração']];
const LEAD = { task: 'Algo para fazer. Aparece em Tarefas no dia escolhido.', event: 'Algo com horário marcado. Aparece na Agenda.', note: 'Ideia solta, para organizar depois.',
  buy: 'Vai para a lista escolhida. "2 leite" já entende a quantidade.', win: 'Uma vitória, grande ou pequena. Vai para Conquistas.', memory: 'Algo que a Olivia disse ou fez. Vai para Memórias da Olivia.',
  media: 'Algo que quer ver ou ler. Vai para a lista "Quero".', prayer: 'Um pedido de oração. Vai para Oração.' };
const LABEL = { note: 'O que está na sua cabeça?', win: 'O que você conquistou?', memory: 'O que aconteceu?', media: 'Título', prayer: 'Pedido' };
const PH = { task: 'Ex.: comprar material escolar', event: 'Ex.: pediatra da Olivia', note: 'Preciso marcar dentista…', buy: 'Ex.: 2 leite', win: 'Ex.: treinei 3x esta semana',
  memory: 'Ex.: "Mamãe, o céu está chorando?"', media: 'Ex.: Duna', prayer: 'Ex.: saúde da família' };
export function QuickAdd({ open, initial, onClose }) {
  const [type, setType] = useState('task');
  const [text, setText] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('');
  const [listId, setListId] = useState('mercado');
  const [memKind, setMemKind] = useState('frase');
  const [mediaType, setMediaType] = useState('filme');
  const ref = useRef();
  // Layout effect: zera o formulário antes de a tela aparecer (digitar rápido não perde texto)
  useLayoutEffect(() => { if (open) { setType(initial || 'task'); setText(''); setDate(todayISO()); setTime(''); setTimeout(() => ref.current?.focus(), 250); } }, [open]);

  async function submit(e) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    if (type === 'task') await save('tasks', { title, date, time: time || null, status: 'todo', priority: 'normal', area: null });
    if (type === 'event') await save('events', { title, date, time: time || null, duration: null, area: null });
    if (type === 'buy') { const r = await addItem(listId, title); if (r?.duplicate) { toast('Esse item já está na lista'); return onClose(); } }
    if (type === 'note') await save('notes', { text: title, kind: 'dump', date: todayISO(), status: 'open' });
    if (type === 'win') await save('wins', { text: title, date: todayISO(), visibility: 'private' });
    if (type === 'memory') await save('memories', { text: title, kind: memKind, date: todayISO(), visibility: 'private' });
    if (type === 'media') await save('media', { title, type: mediaType, status: 'quero', visibility: 'private' });
    if (type === 'prayer') await save('prayers', { text: title, date: todayISO(), answered: false, visibility: 'private' });
    toast({ task: 'Tarefa criada', event: 'Compromisso criado', note: 'Anotação guardada', buy: 'Adicionado à lista ' + LISTS.find(l => l[0] === listId)[1],
      win: 'Conquista registrada 🏆', memory: 'Memória guardada 💛', media: 'Adicionado em Quero ver/ler', prayer: 'Pedido guardado 🙏' }[type]);
    onClose();
  }
  const T = ([id, e, l]) => html`<button type="button" class=${'qa-type' + (type === id ? ' on' : '')} aria-pressed=${type === id} onClick=${() => { setType(id); ref.current?.focus(); }}><span aria-hidden="true">${e}</span>${l}</button>`;
  const C = (opts, v, set) => html`<div class="chips" style="margin-bottom:14px">${opts.map(([id, n]) => html`<button type="button" class=${'chip' + (v === id ? ' on' : '')} aria-pressed=${v === id} onClick=${() => set(id)}>${n}</button>`)}</div>`;

  return html`<${Sheet} open=${open} onClose=${onClose} title="Adicionar">
    <form onSubmit=${submit}>
      <div class="qa-grid" role="group" aria-label="O que adicionar">${TYPES.map(T)}</div>
      <p class="lead">${LEAD[type]}</p>
      <label class="field"><span>${LABEL[type] || 'O quê?'}</span>
        <input ref=${ref} class="input" value=${text} onInput=${e => setText(e.target.value)} placeholder=${PH[type]} /></label>
      ${type === 'memory' && C([['frase', '💬 Frase'], ['primeira', '⭐ Primeira vez'], ['momento', '📸 Momento']], memKind, setMemKind)}
      ${type === 'media' && C([['filme', '🎬 Filme'], ['serie', '📺 Série'], ['livro', '📚 Livro']], mediaType, setMediaType)}
      ${type === 'buy' && html`<div class="chips" style="margin-bottom:14px">${LISTS.map(([id, n, e]) => html`<button type="button" class=${'chip' + (listId === id ? ' on' : '')} aria-pressed=${listId === id} onClick=${() => setListId(id)}>${e} ${n}</button>`)}</div>`}
      ${(type === 'task' || type === 'event') && html`<div class="fieldrow">
        <label class="field"><span>Dia</span><input type="date" class="input" value=${date} onInput=${e => setDate(e.target.value)} /></label>
        <label class="field"><span>Horário (opcional)</span><input type="time" class="input" value=${time} onInput=${e => setTime(e.target.value)} /></label>
      </div>`}
      <button class="btn" disabled=${!text.trim()}>Salvar</button>
    </form>
  <//>`;
}
