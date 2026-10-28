// Filmes, séries e livros
import { html, useState } from '../lib/preact-htm.js';
import { Collection } from '../components/collection.js';
import { useRecord } from '../store/hooks.js';
import { save } from '../store/repo.js';
import { saveYear } from './ano.js';
import { toast } from '../components/ui.js';
import { todayISO, shortDate } from '../lib/date.js';

export const TYPES = [['filme', '🎬 Filme'], ['serie', '📺 Série'], ['livro', '📚 Livro']];
const STATUS = [['quero', 'Quero'], ['andamento', 'Em andamento'], ['concluido', 'Concluído'], ['abandonado', 'Abandonei']];
const WITH = [['sozinha', 'Sozinha'], ['marido', 'Com o marido'], ['filha', 'Com a filha'], ['familia', 'Em família']];
const opt = (a, v) => (a.find(o => o[0] === v) || [, ''])[1];
const stars = n => n ? html`<span class="stars-inline" aria-label=${n + ' de 5'}>${'★'.repeat(n)}</span>` : null;
const isBook = f => f.type === 'livro';

function BookGoal({ rows }) {
  const y = String(new Date().getFullYear());
  const yr = useRecord('years', y);
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState('');
  if (yr === undefined) return null;
  const read = rows.filter(r => r.type === 'livro' && r.status === 'concluido' && (r.finishedOn || '').startsWith(y)).length;
  const seen = rows.filter(r => r.type !== 'livro' && r.status === 'concluido' && (r.finishedOn || '').startsWith(y)).length;
  const goal = yr?.bookGoal;
  const setGoal = async () => { const n = parseInt(v, 10); if (n > 0) { await saveYear(y, { bookGoal: n }); toast('Meta salva'); } setEditing(false); };
  return html`<div class="goal-card">
    <div class="goal-top"><div><b>${read}${goal ? ` de ${goal}` : ''}</b> <span>livros lidos em ${y}</span></div>
      ${!editing && html`<button class="link" onClick=${() => { setV(goal || ''); setEditing(true); }}>${goal ? 'Mudar meta' : 'Definir meta'}</button>`}</div>
    ${goal && html`<div class="progress"><span style=${`width:${Math.min(100, read / goal * 100)}%;background:var(--accent)`}></span></div>`}
    ${editing && html`<form class="goal-form" onSubmit=${e => { e.preventDefault(); setGoal(); }}><input class="input" type="number" inputmode="numeric" min="1" value=${v} onInput=${e => setV(e.target.value)} placeholder="Ex.: 12" aria-label="Meta de livros no ano" /><button class="btn">Salvar</button></form>`}
    <small>${seen} ${seen === 1 ? 'filme ou série concluído' : 'filmes e séries concluídos'} este ano</small>
  </div>`;
}

export const MEDIA = {
  store: 'media', title: 'Filmes, séries e livros', emoji: '🍿', addLabel: 'Adicionar título', newTitle: 'Novo título', savedMsg: 'Adicionado à lista',
  intro: 'Anote o que quer ver ou ler, acompanhe o que está em andamento e guarde o que ficou com você.',
  empty: 'Nada aqui ainda. Aquela série que te indicaram? Comece por ela.',
  tabs: [['quero', 'Quero', r => r.status === 'quero'], ['andamento', 'Em andamento', r => r.status === 'andamento'], ['concluido', 'Concluídos', r => r.status === 'concluido' || r.status === 'abandonado']],
  defaults: tab => ({ type: 'filme', status: tab === 'concluido' ? 'concluido' : tab }),
  sort: (a, b) => (b.finishedOn || b.updatedAt).localeCompare(a.finishedOn || a.updatedAt),
  header: rows => html`<${BookGoal} rows=${rows} />`,
  fields: [
    { key: 'title', label: 'Título', main: true },
    { key: 'type', label: 'Tipo', type: 'choice', options: TYPES, required: true },
    { key: 'status', label: 'Situação', type: 'choice', options: STATUS, required: true },
    { key: 'author', label: 'Autor(a)', show: isBook },
    { key: 'where', label: 'Onde assistir (opcional)', ph: 'Ex.: Netflix, cinema', show: f => !isBook(f) },
    { key: 'pages', label: 'Total de páginas', type: 'number', inputmode: 'numeric', show: isBook },
    { key: 'page', label: 'Estou na página', type: 'number', inputmode: 'numeric', show: f => isBook(f) && f.status === 'andamento' },
    { key: 'season', label: 'Temporada', type: 'number', inputmode: 'numeric', show: f => f.type === 'serie' && f.status !== 'quero' },
    { key: 'episode', label: 'Episódio', type: 'number', inputmode: 'numeric', show: f => f.type === 'serie' && f.status === 'andamento' },
    { key: 'with', label: 'Com quem', type: 'choice', options: WITH, show: f => !isBook(f) },
    { key: 'by', label: 'Quem indicou (opcional)' },
    { key: 'rating', label: 'Sua nota', type: 'stars', show: f => f.status === 'concluido' || f.status === 'abandonado' },
    { key: 'quote', label: 'O que ficou com você', type: 'textarea', ph: 'Uma frase, um aprendizado, uma cena', show: f => f.status === 'concluido' || f.status === 'abandonado' },
    { key: 'finishedOn', label: 'Terminei em', type: 'date', show: f => f.status === 'concluido' }
  ],
  normalize: f => ({ ...f, finishedOn: f.status === 'concluido' ? (f.finishedOn || todayISO()) : f.finishedOn || null, startedOn: f.status !== 'quero' ? (f.startedOn || todayISO()) : f.startedOn || null }),
  rowClass: r => r.status === 'abandonado' ? 'dim' : '',
  row: r => {
    const prog = r.type === 'livro' && r.status === 'andamento' && r.pages ? Math.round((r.page || 0) / r.pages * 100) : null;
    return html`<strong>${r.title}</strong>
      <span class="meta-line"><span>${opt(TYPES, r.type)}</span>${r.author && html`<span>${r.author}</span>`}${r.where && html`<span>${r.where}</span>`}
        ${r.type === 'serie' && r.season && html`<span>T${r.season}${r.episode && r.status === 'andamento' ? ` · E${r.episode}` : ''}</span>`}
        ${r.with && r.with !== 'sozinha' && html`<span>${opt(WITH, r.with)}</span>`}
        ${r.status === 'abandonado' && html`<span>Abandonei</span>`}${r.status === 'concluido' && r.finishedOn && html`<span>${shortDate(r.finishedOn)}</span>`}${stars(r.rating)}</span>
      ${prog != null && html`<span class="meta-line"><span>Página ${r.page || 0} de ${r.pages} · ${prog}%</span></span><div class="progress thin"><span style=${`width:${prog}%;background:var(--accent)`}></span></div>`}
      ${r.quote && html`<span class="quote">"${r.quote}"</span>`}`;
  },
  action: (r, edit) => r.status === 'quero' ? html`<button class="mini-act" onClick=${() => save('media', { ...r, status: 'andamento', startedOn: todayISO() }).then(() => toast('Movido para Em andamento'))}>Comecei</button>`
    : r.status === 'andamento' ? html`<button class="mini-act good" onClick=${() => edit({ ...r, status: 'concluido' })}>Terminei</button>` : null
};

export const Midia = ({ date }) => html`<${Collection} cfg=${MEDIA} date=${date} />`;
