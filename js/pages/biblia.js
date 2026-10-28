import { html, useState, useEffect } from '../lib/preact-htm.js';
import { useRecord, useList } from '../store/hooks.js';
import { save, list } from '../store/repo.js';
import { Section, Check, toast } from '../components/ui.js';
import { SCOPES, DURATIONS, VERSIONS, totalChapters, reading, format, status, links } from '../lib/bible.js';
import { toISO, fromISO, dayMonth, shortDate } from '../lib/date.js';

const ID = 'active';
const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };

// Marcar leitura também marca o hábito "Bíblia/devocional" do dia (nunca desmarca)
async function markRead(plan, day, today, on) {
  const done = on ? [...new Set([...plan.done, day])] : plan.done.filter(d => d !== day);
  await save('biblePlans', { ...plan, done });
  if (on) {
    const h = (await list('habits', x => x.active && /b[ií]blia/i.test(x.name)))[0];
    if (h) await save('habitLogs', { id: `${h.id}_${today}`, habitId: h.id, date: today, value: 1 });
  }
}

// Cartão na tela Hoje
export function BibleToday({ date }) {
  const plan = useRecord('biblePlans', ID);
  const [opened, setOpened] = useState(false); // abriu o link: ao voltar, o botão de concluir fica em destaque
  const [showNext, setShowNext] = useState(false);
  if (plan === undefined) return null;
  if (!plan) return html`<${Section} title="Leitura bíblica" icon=${html`<span aria-hidden="true">📖</span>`} tone="amber" hint="Escolha um plano e a leitura do dia aparece aqui.">
    <a class="empty" href="#/biblia" style="text-decoration:none">Ainda sem plano de leitura.<span class="cta">Escolher plano</span></a><//>`;
  const st = status(plan, date);
  if (st.finished) return html`<${Section} title="Leitura bíblica" icon=${html`<span aria-hidden="true">📖</span>`} tone="amber" hint="Plano concluído. Que tal começar outro?">
    <a class="empty" href="#/biblia" style="text-decoration:none">🎉 Você terminou o plano.<span class="cta">Novo plano</span></a><//>`;
  const day = st.next;
  const ahead = day > st.idx;
  const chs = reading(plan, day);
  const finish = () => markRead(plan, day, date, true).then(() => { setOpened(false); setShowNext(false); toast('Leitura do dia concluída ✓', { undo: () => markRead({ ...plan, done: [...plan.done, day] }, day, date, false) }); });
  return html`<${Section} title="Leitura bíblica" icon=${html`<span aria-hidden="true">📖</span>`} tone="amber"
    hint=${st.behind ? `Você está ${st.behind} ${st.behind === 1 ? 'leitura' : 'leituras'} atrás. Siga no seu ritmo.` : ahead ? (showNext ? 'Leitura adiantada do seu plano.' : 'Você está em dia.') : 'Toque em Ler para abrir. Ao terminar, marque como lida.'}
    meta=${`Dia ${day + 1} de ${plan.days}`}>
    ${ahead && !showNext ? html`<div class="reading-today done-today">
      <p class="reading-ref">✓ Leitura de hoje concluída</p>
      <button class="link" onClick=${() => setShowNext(true)}>Quero adiantar a próxima</button>
    </div>` : html`<div class="reading-today">
      <p class="reading-ref">${format(chs)}</p>
      ${chs.length > 0 && html`<div class="read-links">${links(chs, plan.version).map(l => html`<a href=${l.url} target="_blank" rel="noopener" onClick=${() => setOpened(true)}>Ler ${l.label} <span aria-hidden="true">↗</span></a>`)}</div>`}
      <button class=${'done-btn' + (opened ? ' pulse' : '')} onClick=${finish}>${opened ? '✓ Terminei a leitura' : '✓ Marcar como lida'}</button>
      <small class="read-note">Abre no YouVersion (${plan.version || 'NVI'}). Volte aqui e marque quando terminar.</small>
    </div>`}
  <//>`;
}

const VersionPicker = ({ value, onChange }) => html`<div class="chips">${VERSIONS.map(([v, , n]) => html`<button class=${'chip' + (value === v ? ' on' : '')} aria-pressed=${value === v} title=${n} onClick=${() => onChange(v)}>${v}</button>`)}</div>
  <p class="plan-hint">${(VERSIONS.find(x => x[0] === value) || VERSIONS[0])[2]}</p>`;

function Setup({ date, onDone, current }) {
  const [scope, setScope] = useState('paralelo');
  const [days, setDays] = useState(365);
  const [version, setVersion] = useState(current?.version || 'NVI');
  const per = (totalChapters(scope) / days);
  const start = async () => {
    if (current && !confirm('Começar um novo plano? O progresso do plano atual será substituído.')) return;
    await save('biblePlans', { id: ID, scope, days: +days, start: date, done: [], version, visibility: 'private' });
    toast('Plano criado'); onDone?.();
  };
  return html`
    <${Section} title="1. O que ler" tone="amber">
      <div class="options">${Object.entries(SCOPES).map(([id, s]) => html`<button class=${'option' + (scope === id ? ' on' : '')} aria-pressed=${scope === id} onClick=${() => setScope(id)}>
        <strong>${s.name}</strong><span>${s.desc} ${totalChapters(id)} capítulos.</span></button>`)}</div>
    <//>
    <${Section} title="2. Em quanto tempo" tone="amber">
      <div class="chips">${DURATIONS.map(([d, l]) => html`<button class=${'chip' + (days === d ? ' on' : '')} aria-pressed=${days === d} onClick=${() => setDays(d)}>${l}</button>`)}</div>
      <p class="plan-hint">Cerca de <b>${per < 1 ? '1 capítulo a cada ' + Math.round(1 / per) + ' dias' : (Math.round(per * 10) / 10).toLocaleString('pt-BR') + ' capítulos por dia'}</b>, uns ${Math.max(5, Math.round(per * 4))} minutos. Termina em ${dayMonth(fromISO(addDays(date, days - 1)))} de ${fromISO(addDays(date, days - 1)).getFullYear()}.</p>
    <//>
    <${Section} title="3. Versão da Bíblia" tone="amber" hint="Para os links que abrem a leitura no YouVersion.">
      <${VersionPicker} value=${version} onChange=${setVersion} />
    <//>
    <button class="btn" style="margin-top:16px" onClick=${start}>Começar hoje</button>`;
}

export function Biblia({ date }) {
  const plan = useRecord('biblePlans', ID);
  const [changing, setChanging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  if (plan === undefined) return null;
  const head = html`<h1 class="page-title">Leitura bíblica</h1>`;
  if (!plan || changing) return html`${head}<p class="soon">Escolha o que ler e em quanto tempo. O app divide os capítulos por dia e mostra a leitura na tela Hoje. Use a sua Bíblia ou o app de Bíblia que preferir.</p>
    <${Setup} date=${date} current=${plan} onDone=${() => setChanging(false)} />
    ${changing && html`<button class="btn ghost" onClick=${() => setChanging(false)}>Voltar ao plano atual</button>`}`;

  const st = status(plan, date);
  const pct = Math.round(plan.done.length / plan.days * 100);
  const done = new Set(plan.done);
  const end = addDays(plan.start, plan.days - 1);
  // Recalcular: o próximo dia pendente passa a ser hoje (sem culpa, sem acumular)
  const rebase = async () => { await save('biblePlans', { ...plan, start: addDays(date, -st.next) }); toast('Plano recalculado a partir de hoje'); };
  const from = showAll ? 0 : Math.max(0, st.next);
  const to = showAll ? plan.days : Math.min(plan.days, from + 7);
  const daysList = Array.from({ length: to - from }, (_, k) => from + k);
  return html`${head}
    <div class="bible-head">
      <strong>${SCOPES[plan.scope].name}</strong>
      <span>${plan.done.length} de ${plan.days} leituras · ${pct}% · termina em ${shortDate(end)}</span>
      <div class="progress"><span style=${`width:${pct}%`}></span></div>
    </div>
    ${st.behind > 0 && html`<div class="behind">
      <p>Você está <b>${st.behind} ${st.behind === 1 ? 'leitura' : 'leituras'} atrás</b>. Pode recuperar aos poucos ou recalcular: o plano continua de onde parou e a data final se ajusta.</p>
      <button onClick=${rebase}>Recalcular a partir de hoje</button></div>`}
    <${Section} title=${showAll ? 'Plano completo' : 'Próximas leituras'} tone="amber">
      <div class="rows">${daysList.map(d => { const on = done.has(d); const dd = addDays(plan.start, d); return html`<div class=${'row' + (on ? ' done' : '')}>
        <${Check} on=${on} label=${'Leitura do dia ' + (d + 1)} onToggle=${() => markRead(plan, d, date, !on)} />
        <div class="grow item-btn stack"><span class="title">${format(reading(plan, d))}</span>
          <span class="sub">Dia ${d + 1} · ${dd === date ? 'hoje' : shortDate(dd)}${dd < date && !on ? ' · atrasada' : ''}</span></div>
        ${reading(plan, d).length > 0 && html`<a class="row-link" href=${links(reading(plan, d), plan.version)[0].url} target="_blank" rel="noopener" aria-label=${'Ler dia ' + (d + 1) + ' no YouVersion'}>Ler ↗</a>`}
      </div>`; })}</div>
      <button class="link" style="margin-top:8px" onClick=${() => setShowAll(!showAll)}>${showAll ? 'Mostrar só as próximas' : `Ver plano completo (${plan.days} dias)`}</button>
    <//>
    <${Section} title="Versão da Bíblia" tone="amber" hint="Muda os links sem alterar seu progresso.">
      <${VersionPicker} value=${plan.version || 'NVI'} onChange=${v => save('biblePlans', { ...plan, version: v })} />
    <//>
    <button class="btn ghost" onClick=${() => setChanging(true)}>Trocar de plano</button>`;
}
