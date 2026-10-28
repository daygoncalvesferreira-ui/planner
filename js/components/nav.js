import { html } from '../lib/preact-htm.js';
import { icons } from './icons.js';

const TABS = [['hoje', 'Hoje'], ['calendario', 'Calendário'], ['habitos', 'Hábitos'], ['financas', 'Finanças'], ['vida', 'Vida']];

const TAB_OF = Object.fromEntries('compras biblia ciclo anotacoes midia ano retro conquistas memorias encontros sonhos oracao datas saude treino alimentacao medidas exames cardapio'.split(' ').map(k => [k, 'vida'])); // subpáginas acendem a aba mãe
export const Nav = ({ route }) => { const cur = TAB_OF[route[0]] || route[0]; return html`
  <nav class="nav" aria-label="Principal"><ul>
    ${TABS.map(([id, label]) => html`<li><a href=${'#/' + id} class=${cur === id ? 'on' : ''} aria-current=${cur === id ? 'page' : null}>${icons[id]()}${label}</a></li>`)}
  </ul></nav>`; };
