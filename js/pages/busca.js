// Busca em tudo: tarefas, compromissos, anotações, memórias, filmes, exames, objetivos…
import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { list } from '../store/repo.js';
import { shortDate } from '../lib/date.js';
import { norm } from '../lib/shopping.js';
import { icons } from '../components/icons.js';

// [coleção, rótulo, emoji, campos de texto, rota, campo de data]
const SOURCES = [
  ['tasks', 'Tarefas', '✅', ['title'], '#/calendario', 'date'], ['events', 'Compromissos', '📅', ['title'], '#/calendario', 'date'],
  ['notes', 'Anotações', '💭', ['text'], '#/anotacoes', 'date'], ['shoppingItems', 'Compras', '🛒', ['name', 'note'], '#/compras'],
  ['media', 'Filmes, séries e livros', '🍿', ['title', 'author', 'quote', 'by'], '#/midia', 'finishedOn'], ['memories', 'Memórias da Olivia', '👧', ['text', 'context'], '#/memorias', 'date'],
  ['wins', 'Conquistas', '🏆', ['text'], '#/conquistas', 'date'], ['dreams', 'Sonhos', '🌠', ['title', 'why'], '#/sonhos'],
  ['prayers', 'Oração', '🙏', ['text', 'forWhom', 'answer'], '#/oracao', 'date'], ['dateIdeas', 'Encontros', '❤️', ['title', 'where', 'memory'], '#/encontros'],
  ['specialDates', 'Datas especiais', '🎂', ['title', 'note'], '#/datas', 'date'], ['exams', 'Exames e consultas', '🩺', ['name', 'doctor', 'result'], '#/exames', 'doneOn'],
  ['finGoals', 'Objetivos financeiros', '💰', ['name', 'where', 'why'], '#/financas', 'deadline'], ['moments', 'Momentos do mês', '💛', ['text'], '#/ano'],
  ['habits', 'Hábitos', '⭐', ['name'], '#/habitos'], ['recipes', 'Minhas receitas', '🍳', ['name', 'how'], '#/cardapio'], ['dayPlans', 'Revisões do dia', '🌙', ['review'], '#/hoje', 'id']
];
const PAGES = [['Cardápio da família', '#/cardapio', '🍽️'], ['Receitas', '#/cardapio', '🍳'], ['Treino', '#/treino', '🏋️'], ['Alimentação', '#/alimentacao', '🥗'], ['Medidas', '#/medidas', '📏'], ['Ciclo menstrual', '#/ciclo', '🌸'], ['Leitura bíblica', '#/biblia', '📖'],
  ['Meu ano', '#/ano', '✨'], ['Roda da Vida', '#/ano', '🎡'], ['Retrospectiva', `#/retro/${new Date().getFullYear()}`, '🎞️'], ['Ajustes', '#/ajustes', '⚙️'], ['Backup', '#/ajustes', '💾'], ['Bloqueio e PIN', '#/ajustes', '🔒'],
  ['Exames', '#/exames', '🩺'], ['Finanças', '#/financas', '💰'], ['Hábitos', '#/habitos', '⭐'], ['Lista de compras', '#/compras', '🛒'], ['Datas especiais', '#/datas', '🎂']];

export function Busca() {
  const [q, setQ] = useState(''), [res, setRes] = useState([]);
  const ref = useRef();
  useEffect(() => { setTimeout(() => ref.current?.focus(), 100); }, []);
  useEffect(() => {
    const t = norm(q); if (t.length < 2) return setRes([]);
    let alive = true;
    (async () => {
      const out = [];
      for (const [store, label, em, fields, href, dk] of SOURCES) {
        const rows = await list(store, r => fields.some(f => norm(String(r[f] || '')).includes(t)));
        if (rows.length) out.push({ label, em, href, items: rows.slice(0, 6).map(r => ({ text: fields.map(f => r[f]).find(v => v && norm(String(v)).includes(t)) || r[fields[0]], date: dk && r[dk] })), more: rows.length - 6 });
      }
      if (alive) setRes(out);
    })();
    return () => { alive = false; };
  }, [q]);
  const pages = q.trim().length >= 2 ? PAGES.filter(([n]) => norm(n).includes(norm(q))) : [];
  const total = res.reduce((a, g) => a + g.items.length, 0);
  return html`<h1 class="page-title">Buscar</h1>
    <label class="search-box">${icons.search()}<input ref=${ref} type="search" value=${q} onInput=${e => setQ(e.target.value)} placeholder="Ex.: pediatra, Duna, reserva, leite" aria-label="Buscar em tudo" enterkeyhint="search" /></label>
    ${q.trim().length < 2 && html`<p class="soon" style="margin-top:12px">Procura em tarefas, anotações, memórias, filmes, exames, objetivos e tudo mais que você registrou.</p>`}
    ${pages.length > 0 && html`<div class="chips" style="margin-top:12px">${pages.map(([n, h, e]) => html`<a class="chip live" href=${h}>${e} ${n}</a>`)}</div>`}
    ${q.trim().length >= 2 && !total && !pages.length && html`<div class="empty" style="margin-top:12px">Nada encontrado para "${q}".</div>`}
    ${res.map(g => html`<div class="search-group"><h2>${g.em} ${g.label}</h2>
      ${g.items.map(it => html`<a class="search-item" href=${g.href}><span>${String(it.text).slice(0, 120)}</span>${it.date && html`<small>${/^\d{4}-\d{2}-\d{2}/.test(it.date) ? shortDate(it.date.slice(0, 10)) : ''}</small>`}</a>`)}
      ${g.more > 0 && html`<a class="link" href=${g.href}>+ ${g.more} em ${g.label}</a>`}</div>`)}`;
}
