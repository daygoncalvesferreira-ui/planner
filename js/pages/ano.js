// Meu Ano: palavra/versículo, momento do mês, Roda da Vida e perguntas de fechamento
import { html, useState, useLayoutEffect } from '../lib/preact-htm.js';
import { useList, useRecord, useAutosave } from '../store/hooks.js';
import { save, get } from '../store/repo.js';
import { Section, Sheet, toast } from '../components/ui.js';
import { WHEEL_AREAS } from '../store/schema.js';
import { todayISO, shortDate, fromISO } from '../lib/date.js';

// Lê o registro atual antes de gravar: campos salvos por outras telas não se perdem
export async function saveYear(y, patch) { return save('years', { ...((await get('years', y)) || { id: y, visibility: 'private' }), ...patch }); }

export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const QUESTIONS = [['consegui', 'O que consegui este ano?'], ['pendente', 'O que ficou pendente?'], ['aprendi', 'O que aprendi?'], ['mudar', 'O que quero mudar no próximo ano?'], ['grata', 'Pelo que sou grata?']];

// Gráfico da Roda: até duas avaliações sobrepostas (antes tracejada, atual preenchida)
export function Radar({ current, before, size = 300 }) {
  const n = WHEEL_AREAS.length, c = size / 2, R = size / 2 - 44;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [c + Math.cos(a) * R * v / 10, c + Math.sin(a) * R * v / 10]; };
  const poly = s => WHEEL_AREAS.map(([id], i) => pt(i, s?.[id] ?? 0).join(',')).join(' ');
  return html`<svg class="radar" viewBox=${`0 0 ${size} ${size}`} role="img" aria-label="Roda da Vida">
    ${[2, 4, 6, 8, 10].map(r => html`<polygon points=${WHEEL_AREAS.map((_, i) => pt(i, r).join(',')).join(' ')} class="grid" />`)}
    ${WHEEL_AREAS.map((_, i) => { const [x, y] = pt(i, 10); return html`<line x1=${c} y1=${c} x2=${x} y2=${y} class="grid" />`; })}
    ${before && html`<polygon points=${poly(before)} class="before" />`}
    ${current && html`<polygon points=${poly(current)} class="now" />`}
    ${current && WHEEL_AREAS.map(([id, , , col], i) => { const [x, y] = pt(i, current[id] ?? 0); return html`<circle cx=${x} cy=${y} r="4" fill=${col} />`; })}
    ${WHEEL_AREAS.map(([id, name, em], i) => { const [x, y] = pt(i, 12.6); return html`<text x=${x} y=${y} text-anchor="middle" dominant-baseline="middle" class="lbl"><tspan x=${x} dy="-0.4em">${em}</tspan><tspan x=${x} dy="1.2em">${current ? current[id] ?? '–' : name.slice(0, 6)}</tspan></text>`; })}
  </svg>`;
}

function WheelSheet({ open, onClose, last }) {
  const [s, setS] = useState({});
  const [note, setNote] = useState('');
  useLayoutEffect(() => { if (open) { setS(Object.fromEntries(WHEEL_AREAS.map(([id]) => [id, last?.scores?.[id] ?? 5]))); setNote(''); } }, [open]);
  if (!open) return null;
  const submit = async () => { await save('wheels', { date: todayISO(), scores: s, note, visibility: 'private' }); toast('Avaliação salva'); onClose(); };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Como está cada área?">
    <p class="lead">Dê uma nota de 0 a 10 para como você se sente hoje em cada área. Não pense muito: a primeira resposta costuma ser a mais honesta.</p>
    ${WHEEL_AREAS.map(([id, name, em, col]) => html`<label class="slider-row"><span class="sl-name">${em} ${name}</span>
      <input type="range" min="0" max="10" step="1" value=${s[id]} style=${`accent-color:${col}`} onInput=${e => setS({ ...s, [id]: +e.target.value })} aria-label=${name} />
      <b>${s[id]}</b></label>`)}
    <label class="field" style="margin-top:12px"><span>Alguma observação? (opcional)</span><input class="input" value=${note} onInput=${e => setNote(e.target.value)} placeholder="Ex.: fase corrida no trabalho" /></label>
    <button class="btn" onClick=${submit}>Salvar avaliação</button>
  <//>`;
}

function MomentSheet({ ym, cur, onClose }) {
  const [t, setT] = useState('');
  useLayoutEffect(() => setT(cur?.text || ''), [ym]);
  if (!ym) return null;
  const [y, m] = ym.split('-').map(Number);
  return html`<${Sheet} open=${!!ym} onClose=${onClose} title=${`Momento de ${MONTHS[m - 1].toLowerCase()}`}>
    <p class="lead">Qual foi o melhor momento do mês? Uma frase basta.</p>
    <textarea class="input area" rows="3" value=${t} onInput=${e => setT(e.target.value)} placeholder="Ex.: O primeiro dia de aula dela" aria-label="Momento do mês"></textarea>
    <button class="btn" style="margin-top:12px" disabled=${!t.trim()} onClick=${async () => { await save('moments', { ...(cur || {}), id: ym, year: String(y), text: t.trim(), visibility: 'private' }); toast('Momento guardado'); onClose(); }}>Salvar</button>
  <//>`;
}

function YearWords({ y, yr }) {
  const [w, setW] = useState(yr?.word || ''), [v, setV] = useState(yr?.verse || '');
  const persist = useAutosave(patch => saveYear(y, patch), 600);
  return html`<${Section} title=${`Palavra e versículo de ${y}`} icon=${html`<span aria-hidden="true">✨</span>`} tone="lilac" hint="Uma palavra para guiar o ano e um versículo para lembrar. A palavra aparece no topo da tela Hoje.">
    <label class="field"><span>Palavra do ano</span><input class="input word" value=${w} placeholder="Ex.: Constância, Leveza, Coragem" onInput=${e => { setW(e.target.value); persist({ word: e.target.value.trim(), verse: v }); }} onBlur=${() => persist.flush()} /></label>
    <label class="field"><span>Versículo do ano</span><textarea class="input area" rows="2" value=${v} placeholder="Ex.: Tudo tem o seu tempo determinado… Eclesiastes 3:1" onInput=${e => { setV(e.target.value); persist({ word: w.trim(), verse: e.target.value }); }} onBlur=${() => persist.flush()}></textarea></label>
  <//>`;
}

function Questions({ y, yr }) {
  const [a, setA] = useState(yr?.answers || {});
  const persist = useAutosave(ans => saveYear(y, { answers: ans }), 700);
  const dec = new Date().getMonth() >= 10;
  return html`<${Section} title="Fechamento do ano" icon=${html`<span aria-hidden="true">📝</span>`} tone="blue"
    hint=${dec ? 'O ano está acabando. Separe 15 minutos com um café para responder.' : 'Para responder em dezembro. Pode ir anotando ao longo do ano, se quiser.'}>
    ${QUESTIONS.map(([k, q]) => html`<label class="field"><span>${q}</span><textarea class="input area" rows="2" value=${a[k] || ''} onBlur=${() => persist.flush()} onInput=${e => { const n = { ...a, [k]: e.target.value }; setA(n); persist(n); }}></textarea></label>`)}
  <//>`;
}

export function Ano({ date }) {
  const y = date.slice(0, 4);
  const yr = useRecord('years', y);
  const wheels = useList('wheels', () => true, []);
  const moments = useList('moments', m => m.year === y, [y]);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [momentYm, setMomentYm] = useState(null);
  const [allMonths, setAllMonths] = useState(false);
  if (yr === undefined || !wheels || !moments) return null;
  const ws = [...wheels].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const yearWs = ws.filter(w => w.date.startsWith(y));
  const last = ws[ws.length - 1], first = yearWs.length > 1 ? yearWs[0] : null;
  const daysSince = last ? Math.round((fromISO(date) - fromISO(last.date)) / 864e5) : null;
  const curMonth = +date.slice(5, 7);
  const mm = Object.fromEntries(moments.map(m => [m.id, m]));
  const diffs = first && last ? WHEEL_AREAS.map(([id, n, e]) => [e + ' ' + n, (last.scores[id] ?? 0) - (first.scores[id] ?? 0)]).filter(d => d[1] !== 0).sort((a, b) => b[1] - a[1]) : [];
  return html`
    <h1 class="page-title">Meu ${y}</h1>
    <p class="soon">O que dá sentido ao ano: sua direção, os melhores momentos e como cada área da vida evoluiu.</p>
    <a class="retro-cta" href=${`#/retro/${y}`}><b>✨ Ver minha retrospectiva de ${y}</b><span>Um resumo do seu ano em cartões, com tudo o que você registrou.</span></a>
    <${YearWords} y=${y} yr=${yr} />

    <${Section} title="Roda da Vida" icon=${html`<span aria-hidden="true">🎡</span>`} tone="rose"
      hint=${!last ? 'Dê uma nota para cada área e veja onde a vida está equilibrada e onde pede atenção.' : daysSince >= 90 ? `Sua última avaliação foi há ${daysSince} dias. Que tal uma nova? Leva 2 minutos.` : `Última avaliação em ${shortDate(last.date)}. A próxima é sugerida a cada 3 meses.`}>
      ${last ? html`<${Radar} current=${last.scores} before=${first && first !== last ? first.scores : null} />
        ${first && first !== last && html`<div class="legend center"><span><i class="lg-before"></i>${shortDate(first.date)}</span><span><i class="lg-now"></i>${shortDate(last.date)}</span></div>`}
        ${diffs.length > 0 && html`<p class="plan-hint">Mais cresceu: <b>${diffs[0][0]} (+${diffs[0][1]})</b>${diffs[diffs.length - 1][1] < 0 ? html` · Pede atenção: <b>${diffs[diffs.length - 1][0]} (${diffs[diffs.length - 1][1]})</b>` : ''}</p>`}
        ${!first && html`<p class="plan-hint">Faça uma nova avaliação daqui a uns 3 meses para ver a comparação no gráfico.</p>`}`
      : html`<${Radar} current=${null} />`}
      <button class=${'btn' + (last && daysSince < 90 ? ' ghost' : '')} style="margin-top:10px" onClick=${() => setWheelOpen(true)}>${last ? 'Fazer nova avaliação' : 'Fazer minha primeira avaliação'}</button>
    <//>

    <${Section} title="Momentos do mês" icon=${html`<span aria-hidden="true">💛</span>`} tone="amber" hint="Uma frase por mês com o melhor momento. No fim do ano, vira a linha do tempo da sua retrospectiva.">
      <div class="months">${MONTHS.slice(0, curMonth).map((name, i) => { const ym = `${y}-${String(i + 1).padStart(2, '0')}`; const m = mm[ym];
        // Mostra o mês atual, o anterior e os preenchidos; os outros ficam em "ver todos"
        if (!allMonths && !m && i < curMonth - 2) return null;
        return html`<button class=${'month' + (m ? ' has' : '')} onClick=${() => setMomentYm(ym)}><span class="mn">${name}</span><span class="mt">${m ? m.text : '+ Escrever'}</span></button>`; }).reverse()}</div>
      ${!allMonths && curMonth > 2 && html`<button class="link" style="margin-top:6px" onClick=${() => setAllMonths(true)}>Ver todos os meses de ${y}</button>`}
    <//>

    <${Questions} y=${y} yr=${yr} />
    <${WheelSheet} open=${wheelOpen} last=${last} onClose=${() => setWheelOpen(false)} />
    <${MomentSheet} ym=${momentYm} cur=${momentYm && mm[momentYm]} onClose=${() => setMomentYm(null)} />`;
}

// Cartão no Hoje nos últimos 5 dias do mês e nos 3 primeiros (para o mês anterior)
export function MomentPrompt({ date }) {
  const d = fromISO(date); const day = d.getDate();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const target = day >= last - 4 ? d : day <= 3 ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : null;
  const ym = target ? `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}` : 'none';
  const m = useRecord('moments', ym);
  const [open, setOpen] = useState(false);
  if (!target || m === undefined || m) return null;
  return html`<button class="moment-prompt" onClick=${() => setOpen(true)}><b>💛 Qual foi o melhor momento de ${MONTHS[target.getMonth()].toLowerCase()}?</b><span>Uma frase para a sua retrospectiva do ano.</span></button>
    <${MomentSheet} ym=${open ? ym : null} cur=${null} onClose=${() => setOpen(false)} />`;
}
