import { html, useState } from '../lib/preact-htm.js';
import { useList } from '../store/hooks.js';
import { icons } from '../components/icons.js';

// [rota, emoji, nome, descrição, coleção para contar]
const GRUPOS = [
  ['Meu ano', [['ano', '✨', 'Meu ano', 'Palavra, Roda da Vida e momentos'], ['retro', '🎞️', 'Retrospectiva', 'Seu ano em cartões'],
    ['conquistas', '🏆', 'Conquistas', 'Vitórias grandes e pequenas', 'wins'], ['sonhos', '🌠', 'Sonhos', 'O que você quer viver', 'dreams']]],
  ['Saúde', [['cardapio', '🍽️', 'Cardápio da família', 'Semana planejada e lista do mercado'], ['treino', '🏋️', 'Treino', 'Ficha slim e treino do dia'], ['alimentacao', '🥗', 'Alimentação', 'Hábitos do dia e água'],
    ['medidas', '📏', 'Medidas', 'Peso e centímetros', 'measures'], ['exames', '🩺', 'Exames e consultas', 'Seus e da Olivia', 'exams']]],
  ['Eu', [['midia', '🍿', 'Filmes, séries e livros', 'O que ver, ler e o que ficou', 'media'], ['ciclo', '🌸', 'Ciclo menstrual', 'Calendário e previsões'],
    ['anotacoes', '💭', 'Anotações', 'Ideias para organizar', 'notes']]],
  ['Família', [['memorias', '👧', 'Memórias da Olivia', 'Frases e primeiras vezes', 'memories'], ['encontros', '❤️', 'Encontros a dois', 'Ideias e o que já fizeram', 'dateIdeas'],
    ['datas', '🎂', 'Datas especiais', 'Aniversários com contagem', 'specialDates'], ['compras', '🛒', 'Lista de compras', 'Mercado, farmácia e casa']]],
  ['Espiritual', [['biblia', '📖', 'Leitura bíblica', 'Plano e leitura do dia'], ['oracao', '🙏', 'Oração', 'Pedidos e respostas', 'prayers']]]
];
export const MODULES = GRUPOS.flatMap(([, items]) => items.map(([id, e, n]) => [id, e, n]));
const SOON = ['Autocuidado', 'Diário', 'Casa', 'Trabalho', 'Carreira', 'Estudos', 'Metas'];

// "Onde anoto isso?": o mapa que evita caçar coisas
const MAP = [['Algo para fazer', 'Tarefa (botão Adicionar)'], ['Algo com horário', 'Compromisso'], ['Ideia solta, sem saber o dia', 'Anotação'],
  ['O que vamos comer', 'Saúde > Cardápio da família'], ['Algo para comprar', 'Compra'], ['Uma vitória sua', 'Conquista'], ['Algo que a Olivia disse ou fez', 'Memória da Olivia'],
  ['Algo que quer ver ou ler', 'Filme, série ou livro'], ['Dinheiro para um objetivo', 'Finanças > + Guardar'], ['Um desejo para a vida', 'Sonhos'], ['Exame ou consulta', 'Saúde > Exames']];

const COUNT_FILTER = { notes: n => n.kind === 'dump' && n.status === 'open', media: m => m.status !== 'concluido' && m.status !== 'abandonado', prayers: p => !p.answered, dateIdeas: d => !d.done, dreams: d => !d.done };
const Count = ({ store }) => { const r = useList(store, COUNT_FILTER[store] || (() => true), []); return r && r.length ? html`<b class="tile-count">${r.length}</b>` : null; };

export const EmBreve = ({ id }) => html`<h1 class="page-title">${id}</h1>`;

export function Vida({ settings }) {
  const [map, setMap] = useState(false);
  const hidden = settings?.hiddenModules || [];
  return html`<div class="page-head"><h1 class="page-title">Vida</h1><a class="icon-btn" href="#/busca" aria-label="Buscar">${icons.search()}</a></div>
  <p class="soon">Tudo o que faz parte da sua história, além das tarefas.</p>
  <button class="map-btn" aria-expanded=${map} onClick=${() => setMap(!map)}>🧭 Onde anoto cada coisa? <span>${map ? '▴' : '▾'}</span></button>
  ${map && html`<div class="map">${MAP.map(([q, a]) => html`<div><span>${q}</span><b>${a}</b></div>`)}<p>Na dúvida, use o botão <b>Adicionar</b> ou a <b>busca</b> 🔍.</p></div>`}
  ${GRUPOS.map(([g, items]) => { const vis = items.filter(i => !hidden.includes(i[0])); return vis.length > 0 && html`<div class="vida-sec"><h2>${g}</h2><div class="tiles">
    ${vis.map(([r, e, n, d, store]) => html`<a class="tile" href=${'#/' + r + (r === 'retro' ? '/' + new Date().getFullYear() : '')}><span class="tile-em" aria-hidden="true">${e}</span><strong>${n}</strong><span>${d}</span>${store && html`<${Count} store=${store} />`}</a>`)}
  </div></div>`; })}
  ${hidden.length > 0 && html`<p class="plan-hint" style="margin-top:16px">${hidden.length} ${hidden.length === 1 ? 'área oculta' : 'áreas ocultas'}. Religue em <a href="#/ajustes">Ajustes</a>.</p>`}
  <div class="vida-sec"><h2>Em breve</h2><div class="chips">${SOON.map(s => html`<span class="chip">${s}</span>`)}</div></div>`;
}
