// Retrospectiva do ano em cartões (tipo stories). Tudo calculado do que foi registrado.
// O ciclo menstrual fica de fora de propósito: é privado.
import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { list, get } from '../store/repo.js';
import { Radar, MONTHS, QUESTIONS } from './ano.js';
import { reading, SCOPES } from '../lib/bible.js';
import { todayISO, toISO, fromISO, shortDate } from '../lib/date.js';
import { WHEEL_AREAS } from '../store/schema.js';
import { goalStats } from './financas.js';
import { brl } from '../lib/money.js';

const inY = (d, y) => (d || '').startsWith(y);
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

async function gather(y) {
  const [settings, yr, plans, tasks, habits, logs, bible, media, wins, memories, moments, wheels, prayers, dreams, dates, goals] = await Promise.all([
    get('settings', 'app'), get('years', y), list('dayPlans', p => inY(p.id, y)), list('tasks', t => t.status === 'done' && inY(t.completedOn || t.completedAt, y)),
    list('habits'), list('habitLogs', l => inY(l.date, y)), get('biblePlans', 'active'), list('media', m => m.status === 'concluido' && inY(m.finishedOn, y)),
    list('wins', w => inY(w.date, y)), list('memories', m => inY(m.date, y)), list('moments', m => m.year === y), list('wheels', w => inY(w.date, y)),
    list('prayers', p => p.answered && inY(p.answeredOn, y)), list('dreams', d => d.done && inY(d.doneOn, y)), list('dateIdeas', d => d.done && inY(d.doneOn, y)), list('finGoals')
  ]);
  // Dias de uso: do primeiro registro do ano até hoje (ou 31/12)
  const firsts = [...plans.map(p => p.id), ...logs.map(l => l.date)].sort();
  const end = y === todayISO().slice(0, 4) ? todayISO() : `${y}-12-31`;
  const days = firsts.length ? Math.max(1, Math.round((fromISO(end) - fromISO(firsts[0])) / 864e5) + 1) : 0;
  const prios = plans.flatMap(p => (p.priorities || []).filter(x => x.text?.trim()));
  const habitStats = habits.map(h => ({ name: h.name, n: logs.filter(l => l.habitId === h.id).length })).filter(h => h.n).sort((a, b) => b.n - a.n);
  let bibleStats = null;
  if (bible) {
    const doneY = bible.done.filter(d => { const dt = fromISO(bible.start); dt.setDate(dt.getDate() + d); return inY(toISO(dt), y); });
    bibleStats = { readings: doneY.length, chapters: doneY.reduce((a, d) => a + reading(bible, d).length, 0), plan: SCOPES[bible.scope].name, pct: Math.round(bible.done.length / bible.days * 100) };
  }
  const ws = [...wheels].sort((a, b) => a.date.localeCompare(b.date));
  const savedY = goals.reduce((a, g) => a + (g.deposits || []).filter(d => inY(d.date, y)).reduce((b, d) => b + d.amount, 0), 0);
  const reached = goals.filter(g => goalStats(g, end).done).map(g => g.name);
  return { name: settings?.name, yr, days, prios, tasks: tasks.length, habitStats, bibleStats, media, wins, memories, moments, wheelFirst: ws.length > 1 ? ws[0] : null, wheelLast: ws[ws.length - 1], prayers, dreams, dates, savedY, reached };
}

function cards(d, y) {
  const out = [];
  out.push(['cover', html`<p class="rc-kicker">Retrospectiva</p><h2 class="rc-big">${d.name ? `O seu ${y}, ${d.name}` : `O seu ${y}`}</h2>
    ${d.yr?.word && html`<p class="rc-word">“${d.yr.word}”</p>`}${d.yr?.verse && html`<p class="rc-verse">${d.yr.verse}</p>`}
    <p class="rc-hint">Deslize para o lado →</p>`]);
  if (d.prios.length || d.tasks) out.push(['focus', html`<p class="rc-kicker">Foco</p>
    <div class="rc-num"><b>${d.prios.filter(p => p.done).length}</b><span>prioridades cumpridas de ${d.prios.length} definidas</span></div>
    <div class="rc-num"><b>${d.tasks}</b><span>tarefas concluídas</span></div>
    ${d.days > 0 && html`<p class="rc-small">Em ${plural(d.days, 'dia', 'dias')} usando o planner.</p>`}`]);
  if (d.habitStats.length) { const top = d.habitStats[0]; out.push(['habits', html`<p class="rc-kicker">Hábitos</p>
    <h2 class="rc-mid">Seu hábito mais forte foi <b>${top.name}</b></h2><p class="rc-small">${plural(top.n, 'dia', 'dias')} registrado${top.n === 1 ? '' : 's'}</p>
    <div class="rc-bars">${d.habitStats.slice(0, 6).map(h => html`<div><span>${h.name}</span><i style=${`width:${d.days ? Math.min(100, h.n / d.days * 100) : 0}%`}></i><b>${d.days ? Math.round(h.n / d.days * 100) : 0}%</b></div>`)}</div>`]); }
  if (d.bibleStats?.readings) out.push(['bible', html`<p class="rc-kicker">Palavra</p>
    <div class="rc-num"><b>${d.bibleStats.chapters}</b><span>capítulos lidos</span></div>
    <p class="rc-small">${plural(d.bibleStats.readings, 'leitura concluída', 'leituras concluídas')} no plano “${d.bibleStats.plan}” (${d.bibleStats.pct}% do plano).</p>`]);
  if (d.media.length) { const books = d.media.filter(m => m.type === 'livro'), rest = d.media.filter(m => m.type !== 'livro');
    const top = [...d.media].filter(m => m.rating).sort((a, b) => b.rating - a.rating).slice(0, 3);
    out.push(['media', html`<p class="rc-kicker">Histórias</p>
      <div class="rc-two"><div class="rc-num"><b>${books.length}</b><span>${books.length === 1 ? 'livro' : 'livros'}${d.yr?.bookGoal ? ` de ${d.yr.bookGoal}` : ''}</span></div><div class="rc-num"><b>${rest.length}</b><span>filmes e séries</span></div></div>
      ${top.length > 0 && html`<p class="rc-small">Seus favoritos:</p><ol class="rc-list">${top.map(m => html`<li>${m.title} <span class="stars-inline">${'★'.repeat(m.rating)}</span></li>`)}</ol>`}
      ${d.media.find(m => m.quote) && html`<p class="rc-quote">“${d.media.find(m => m.quote).quote}”</p>`}`]); }
  if (d.wins.length) out.push(['wins', html`<p class="rc-kicker">Conquistas</p><div class="rc-num"><b>${d.wins.length}</b><span>${d.wins.length === 1 ? 'conquista registrada' : 'conquistas registradas'}</span></div>
    <ul class="rc-list">${[...d.wins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map(w => html`<li>🏆 ${w.text}</li>`)}</ul>`]);
  if (d.memories.length) { const f = d.memories.find(m => m.kind === 'frase') || d.memories[0];
    out.push(['kid', html`<p class="rc-kicker">Memórias da filha</p><p class="rc-quote big">${f.kind === 'frase' ? `“${f.text}”` : f.text}</p>
      <p class="rc-small">${shortDate(f.date)} · ${plural(d.memories.length, 'memória guardada', 'memórias guardadas')} este ano</p>`]); }
  if (d.savedY > 0 || d.reached.length) out.push(['money', html`<p class="rc-kicker">Objetivos</p><div class="rc-num"><b class="rc-money">${brl(d.savedY, false)}</b><span>guardados para os seus objetivos</span></div>
    ${d.reached.length > 0 && html`<p class="rc-small">Conquistados:</p><ul class="rc-list">${d.reached.map(n => html`<li>🎯 ${n}</li>`)}</ul>`}`]);
  if (d.dates.length) out.push(['couple', html`<p class="rc-kicker">Nós dois</p><div class="rc-num"><b>${d.dates.length}</b><span>${d.dates.length === 1 ? 'encontro a dois' : 'encontros a dois'}</span></div>
    <ul class="rc-list">${d.dates.slice(0, 4).map(x => html`<li>❤️ ${x.title}</li>`)}</ul>`]);
  if (d.prayers.length || d.dreams.length) out.push(['faith', html`<p class="rc-kicker">Respostas e sonhos</p>
    ${d.prayers.length > 0 && html`<div class="rc-num"><b>${d.prayers.length}</b><span>${d.prayers.length === 1 ? 'oração respondida' : 'orações respondidas'}</span></div><ul class="rc-list">${d.prayers.slice(0, 3).map(p => html`<li>🙌 ${p.text}</li>`)}</ul>`}
    ${d.dreams.length > 0 && html`<div class="rc-num"><b>${d.dreams.length}</b><span>${d.dreams.length === 1 ? 'sonho realizado' : 'sonhos realizados'}</span></div><ul class="rc-list">${d.dreams.map(x => html`<li>🎉 ${x.title}</li>`)}</ul>`}`]);
  if (d.moments.length) out.push(['moments', html`<p class="rc-kicker">Os melhores momentos</p>
    <ol class="rc-timeline">${[...d.moments].sort((a, b) => a.id.localeCompare(b.id)).map(m => html`<li><b>${MONTHS[+m.id.slice(5) - 1]}</b><span>${m.text}</span></li>`)}</ol>`]);
  if (d.wheelLast) { const diffs = d.wheelFirst ? WHEEL_AREAS.map(([id, n, e]) => [`${e} ${n}`, (d.wheelLast.scores[id] ?? 0) - (d.wheelFirst.scores[id] ?? 0)]).sort((a, b) => b[1] - a[1]) : [];
    out.push(['wheel', html`<p class="rc-kicker">Roda da Vida</p><div class="rc-radar"><${Radar} current=${d.wheelLast.scores} before=${d.wheelFirst?.scores} /></div>
      ${diffs.length && diffs[0][1] > 0 ? html`<p class="rc-small">Mais cresceu: <b>${diffs[0][0]} (+${diffs[0][1]})</b></p>` : html`<p class="rc-small">Faça avaliações ao longo do ano para ver a evolução.</p>`}`]); }
  const ans = d.yr?.answers || {}; const has = QUESTIONS.filter(([k]) => ans[k]?.trim());
  out.push(['end', has.length ? html`<p class="rc-kicker">Nas suas palavras</p>${has.map(([k, q]) => html`<div class="rc-answer"><b>${q}</b><p>${ans[k]}</p></div>`)}`
    : html`<p class="rc-kicker">Para fechar</p><h2 class="rc-mid">Responda as perguntas de fechamento</h2><p class="rc-small">O que consegui, o que aprendi, o que quero mudar. Elas aparecem aqui.</p><a class="rc-btn" href="#/ano">Responder agora</a>`]);
  return out;
}

export function Retro({ year }) {
  const y = year || todayISO().slice(0, 4);
  const [d, setD] = useState(null);
  const [i, setI] = useState(0);
  const track = useRef();
  useEffect(() => { gather(y).then(setD); }, [y]);
  if (!d) return null;
  const cs = cards(d, y);
  const onScroll = e => setI(Math.round(e.target.scrollLeft / e.target.clientWidth));
  const go = n => track.current?.scrollTo({ left: n * track.current.clientWidth, behavior: 'smooth' });
  const thin = cs.length <= 3;
  return html`<div class="retro">
    <a class="icon-btn retro-close" href="#/ano" aria-label="Fechar retrospectiva">✕</a>
    <div class="rc-dots" aria-hidden="true">${cs.map((_, k) => html`<i class=${k <= i ? 'on' : ''}></i>`)}</div>
    <div class="rc-track" ref=${track} onScroll=${onScroll}>
      ${cs.map(([k, body], n) => html`<section class=${'rc-card rc-' + k} aria-label=${`Cartão ${n + 1} de ${cs.length}`}><div class="rc-inner">${body}</div></section>`)}
    </div>
    <div class="rc-nav">
      <button onClick=${() => go(Math.max(0, i - 1))} disabled=${i === 0} aria-label="Anterior">‹</button>
      <span>${i + 1} / ${cs.length}</span>
      <button onClick=${() => go(Math.min(cs.length - 1, i + 1))} disabled=${i === cs.length - 1} aria-label="Próximo">›</button>
    </div>
    ${thin && html`<p class="rc-note">Ainda tem poucos registros. Conforme você usar o planner, novos cartões aparecem aqui.</p>`}
  </div>`;
}
