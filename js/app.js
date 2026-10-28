import { html, render, useState, useEffect } from './lib/preact-htm.js';
import { useRoute } from './router.js';
import { getSettings, applyTheme, seedOnce } from './store/settings.js';
import { onChange, requestPersist } from './store/repo.js';
import { useToday } from './store/hooks.js';
import { Nav } from './components/nav.js';
import { QuickAdd } from './components/quickadd.js';
import { Toaster } from './components/ui.js';
import { icons } from './components/icons.js';
import { Hoje } from './pages/hoje.js';
import { EmBreve, Vida } from './pages/outras.js';
import { Ajustes } from './pages/ajustes.js';
import { Compras } from './pages/compras.js';
import { Proximos, Anotacoes } from './pages/proximos.js';
import { Biblia } from './pages/biblia.js';
import { Ciclo } from './pages/ciclo.js';
import { Midia } from './pages/midia.js';
import { Ano } from './pages/ano.js';
import { Retro } from './pages/retro.js';
import { Treino } from './pages/treino.js';
import { Alimentacao, Medidas } from './pages/alimentacao.js';
import { Exames } from './pages/exames.js';
import { Saude } from './pages/saude.js';
import { Financas } from './pages/financas.js';
import { Habitos } from './pages/habitos.js';
import { Busca } from './pages/busca.js';
import { Cardapio } from './pages/cardapio.js';
import { LockScreen } from './components/lockscreen.js';
import { page as cpage, WINS, MEMORIES, DATE_IDEAS, DREAMS, PRAYERS, SPECIAL_DATES } from './pages/colecoes.js';
const COL = { conquistas: cpage(WINS), memorias: cpage(MEMORIES), encontros: cpage(DATE_IDEAS), sonhos: cpage(DREAMS), oracao: cpage(PRAYERS), datas: cpage(SPECIAL_DATES) };

// Botão Adicionar só nas telas de planejamento (nas demais, cada tela tem o próprio botão)
const FAB_PAGES = ['hoje', 'calendario', 'anotacoes', 'vida', 'habitos'];

function App() {
  const route = useRoute();
  const [settings, setSettings] = useState(null);
  const [quick, setQuick] = useState(null); // null = fechado; senão tipo inicial
  const [blocked, setBlocked] = useState(false);
  const [fabHidden, setFabHidden] = useState(false);
  const [locked, setLocked] = useState(null); // null = ainda não sabe; true/false
  const date = useToday();
  useEffect(() => {
    const onBlocked = () => setBlocked(true);
    document.addEventListener('db-blocked', onBlocked);
    const load = () => getSettings().then(s => { applyTheme(s.theme); setSettings(s); setLocked(l => l === null ? !!s.lock?.enabled : l); });
    seedOnce().then(load);
    requestPersist().then(ok => saveSettingsQuiet(ok));
    // Botão Adicionar some ao rolar para baixo e volta ao rolar para cima
    let y = scrollY;
    const onScroll = () => { const ny = scrollY; if (Math.abs(ny - y) > 8) { setFabHidden(ny > y && ny > 120); y = ny; } };
    addEventListener('scroll', onScroll, { passive: true });
    const off = onChange(s => s === 'settings' && load());
    // Privacidade: borra ao sair do app e bloqueia de novo após o tempo escolhido
    let hiddenAt = 0;
    const onVis = async () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); document.body.classList.add('privacy'); return; }
      document.body.classList.remove('privacy');
      const st = await getSettings();
      if (st.lock?.enabled && Date.now() - hiddenAt >= (st.lock.after ?? 1) * 60000) setLocked(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { off(); removeEventListener('scroll', onScroll); document.removeEventListener('db-blocked', onBlocked); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  if (blocked && !settings) return html`<main><h1 class="page-title">Atualizando o app</h1>
    <p class="soon">Há uma versão antiga do planner aberta em outra aba ou janela. Feche-a e toque abaixo.</p>
    <button class="btn" onClick=${() => location.reload()}>Tentar de novo</button></main>`;
  if (!settings || locked === null) return null;
  if (locked) return html`<${LockScreen} settings=${settings} onUnlock=${() => setLocked(false)} />`;

  const page = route[0];
  const view =
    page === 'hoje' ? html`<${Hoje} key=${date} date=${date} settings=${settings} editMode=${route[1] === 'editar'} onQuickAdd=${t => setQuick(t)} />` :
    page === 'habitos' ? html`<${Habitos} date=${date} />` :
    page === 'busca' ? html`<${Busca} />` :
    page === 'cardapio' ? html`<${Cardapio} date=${date} settings=${settings} />` :
    page === 'calendario' ? html`<${Proximos} date=${date} />` :
    page === 'anotacoes' ? html`<${Anotacoes} />` :
    page === 'biblia' ? html`<${Biblia} date=${date} />` :
    page === 'ciclo' ? html`<${Ciclo} date=${date} />` :
    page === 'vida' ? html`<${Vida} settings=${settings} />` :
    page === 'midia' ? html`<${Midia} date=${date} />` :
    page === 'financas' ? html`<${Financas} date=${date} />` :
    page === 'saude' ? html`<${Saude} date=${date} settings=${settings} />` :
    page === 'treino' ? html`<${Treino} date=${date} />` :
    page === 'alimentacao' ? html`<${Alimentacao} key=${date} date=${date} settings=${settings} />` :
    page === 'medidas' ? html`<${Medidas} date=${date} />` :
    page === 'exames' ? html`<${Exames} date=${date} settings=${settings} />` :
    page === 'ano' ? html`<${Ano} key=${date.slice(0, 4)} date=${date} />` :
    page === 'retro' ? html`<${Retro} year=${route[1]} />` :
    COL[page] ? html`<${COL[page]} date=${date} />` :
    page === 'compras' ? html`<${Compras} />` :
    page === 'ajustes' ? html`<${Ajustes} settings=${settings} />` :
    html`<${Hoje} key=${date} date=${date} settings=${settings} onQuickAdd=${t => setQuick(t)} />`;

  return html`
    <main>${view}</main>
    ${FAB_PAGES.includes(page) && html`<button class=${'fab' + (fabHidden ? ' hide' : '')} onClick=${() => setQuick('task')}>${icons.plus()}Adicionar</button>`}
    <${Nav} route=${route} />
    <${QuickAdd} open=${!!quick} initial=${quick} onClose=${() => setQuick(null)} />
    <${Toaster} />`;
}

// Guarda no ajuste se o navegador aceitou proteger os dados (mostrado em Ajustes)
function saveSettingsQuiet(ok) { window.__persisted = ok; }

render(html`<${App} />`, document.getElementById('app'));

if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.endsWith('claude.ai') && !location.hostname.endsWith('claudeusercontent.com')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
