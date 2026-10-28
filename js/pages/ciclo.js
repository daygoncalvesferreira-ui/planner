import { html, useState, useEffect } from '../lib/preact-htm.js';
import { useList } from '../store/hooks.js';
import { save, get } from '../store/repo.js';
import { Section, Sheet, toast } from '../components/ui.js';
import { analyze, dayKind, periods, addDays, diff, FLOWS, SYMPTOMS } from '../lib/cycle.js';
import { fromISO, toISO, shortDate } from '../lib/date.js';

const ICON = html`<span aria-hidden="true">🌸</span>`;
const setPeriod = async (id, on) => { const cur = await get('cycleLogs', id); await save('cycleLogs', { ...(cur || { id }), period: on, visibility: 'private' }); };

// Cartão discreto na tela Hoje
export function CycleToday({ date }) {
  const logs = useList('cycleLogs', () => true, []);
  if (!logs) return null;
  const a = analyze(logs, date);
  const todayLog = logs.find(l => l.id === date);
  const start = () => setPeriod(date, true).then(() => toast('Registrado', { undo: () => setPeriod(date, false) }));
  let body;
  if (!a.last) body = html`<div class="empty">Registre o primeiro dia da próxima menstruação para começar as previsões.<button onClick=${start}>Começou hoje</button></div>`;
  else if (a.inPeriod) body = todayLog?.period
    ? html`<div class="cycle-line"><b>Dia ${a.cycleDay} da menstruação</b><span>Registrado hoje ✓</span></div>`
    : html`<div class="cycle-line"><b>Ainda menstruada hoje?</b><span class="cycle-btns">
        <button onClick=${() => setPeriod(date, true)}>Sim</button><button onClick=${() => setPeriod(date, false)}>Terminou</button></span></div>`;
  else body = html`<div class="cycle-line"><b>${a.late ? `Atraso de ${a.late} ${a.late === 1 ? 'dia' : 'dias'}` : `Dia ${a.cycleDay} do ciclo`}</b>
      <span>${a.late ? 'Registre quando vier.' : a.daysToNext <= 0 ? 'Pode vir hoje' : `Próxima em ~${a.daysToNext} ${a.daysToNext === 1 ? 'dia' : 'dias'} (${shortDate(a.future[0].start)})`}</span>
      ${(a.late || a.daysToNext <= 3) && html`<button class="cycle-start" onClick=${start}>Começou hoje</button>`}</div>`;
  return html`<${Section} title="Ciclo" icon=${ICON} tone="rose" action=${html`<a class="link" href="#/ciclo">Calendário</a>`}>${body}<//>`;
}

function DaySheet({ iso, logs, onClose }) {
  const cur = logs.find(l => l.id === iso) || { id: iso };
  const [f, setF] = useState(cur);
  useEffect(() => setF(logs.find(l => l.id === iso) || { id: iso }), [iso]);
  if (!iso) return null;
  const sym = f.symptoms || [];
  const tog = s => setF({ ...f, symptoms: sym.includes(s) ? sym.filter(x => x !== s) : [...sym, s] });
  const submit = async () => { await save('cycleLogs', { ...f, visibility: 'private' }); onClose(); };
  return html`<${Sheet} open=${!!iso} onClose=${onClose} title=${shortDate(iso)}>
    <label class="toggle"><input type="checkbox" checked=${!!f.period} onChange=${e => setF({ ...f, period: e.target.checked })} />
      <span><strong>Menstruada neste dia</strong><small>Marque cada dia em que houve sangramento.</small></span></label>
    ${f.period && html`<div class="field"><span>Fluxo</span><div class="seg">${FLOWS.map(([id, n]) => html`<button type="button" class=${f.flow === id ? 'on' : ''} onClick=${() => setF({ ...f, flow: id })}>${n}</button>`)}</div></div>`}
    <div class="field"><span>Como você está (opcional)</span><div class="chips">${SYMPTOMS.map(s => html`<button type="button" class=${'chip' + (sym.includes(s) ? ' on' : '')} aria-pressed=${sym.includes(s)} onClick=${() => tog(s)}>${s}</button>`)}</div></div>
    <label class="field"><span>Anotação</span><input class="input" value=${f.note || ''} onInput=${e => setF({ ...f, note: e.target.value })} /></label>
    <button class="btn" onClick=${submit}>Salvar</button>
  <//>`;
}

const MONTHS = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

export function Ciclo({ date }) {
  const logs = useList('cycleLogs', () => true, []);
  const [month, setMonth] = useState(date.slice(0, 7));
  const [open, setOpen] = useState(null);
  if (!logs) return null;
  const a = analyze(logs, date);
  const first = fromISO(month + '-01');
  const offset = (first.getDay() + 6) % 7; // semana começa na segunda
  const nDays = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: nDays }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  const shift = n => { const d = new Date(first.getFullYear(), first.getMonth() + n, 1); setMonth(toISO(d).slice(0, 7)); };
  const hist = periods(logs).slice(-6).reverse();
  return html`
    <h1 class="page-title">Ciclo menstrual</h1>
    <p class="soon">Toque num dia para registrar menstruação, fluxo e sintomas. As previsões melhoram a cada ciclo registrado. Fica só neste aparelho e nunca é compartilhado.</p>
    <div class="cycle-summary">
      <div><b>${a.last ? (a.inPeriod ? `Dia ${a.cycleDay}` : a.late ? `+${a.late}` : `Dia ${a.cycleDay}`) : '—'}</b><span>${a.inPeriod ? 'da menstruação' : a.late ? 'dias de atraso' : 'do ciclo'}</span></div>
      <div><b>${a.future ? shortDate(a.future[0].start) : '—'}</b><span>próxima prevista</span></div>
      <div><b>${a.avg}d</b><span>${a.known ? `ciclo médio de ${a.known} ${a.known === 1 ? 'registro' : 'registros'}` : 'padrão até registrar'}</span></div>
    </div>
    ${a.irregular && html`<p class="cycle-note">Seus ciclos variam bastante entre si, então as previsões são menos precisas. Se isso for novo para você, vale comentar com sua ginecologista.</p>`}
    <section class="section tone-rose">
      <div class="cal-head"><button class="icon-btn" aria-label="Mês anterior" onClick=${() => shift(-1)}>‹</button>
        <h2>${MONTHS.format(first).replace(/^./, c => c.toUpperCase())}</h2>
        <button class="icon-btn" aria-label="Próximo mês" onClick=${() => shift(1)}>›</button></div>
      <div class="cal">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(d => html`<span class="dow">${d}</span>`)}
        ${cells.map(iso => iso ? html`<button class=${'cal-day ' + dayKind(iso, logs, a, date) + (iso === date ? ' today' : '')}
          aria-label=${shortDate(iso)} onClick=${() => setOpen(iso)}>${+iso.slice(8)}${logs.find(l => l.id === iso && (l.symptoms?.length || l.note)) ? html`<i></i>` : ''}</button>` : html`<span></span>`)}</div>
      <div class="legend"><span><i class="period"></i>Menstruação</span><span><i class="predicted"></i>Prevista</span><span><i class="fertile"></i>Período fértil</span><span><i class="ovulation"></i>Ovulação</span></div>
    </section>
    ${hist.length > 0 && html`<${Section} title="Últimos ciclos" tone="rose">
      <div class="rows">${hist.map((p, i) => { const prev = periods(logs).slice(-6).reverse()[i + 1]; return html`<div class="row"><div class="grow item-btn stack">
        <span class="title">${shortDate(p.start)} a ${shortDate(p.end)}</span>
        <span class="sub">${diff(p.end, p.start) + 1} dias de menstruação${prev ? ` · ciclo de ${diff(p.start, prev.start)} dias` : ''}</span></div></div>`; })}</div><//>`}
    <p class="cycle-note">Previsões são estimativas pela média dos seus ciclos. Não use como método para evitar ou planejar gravidez e não substituem acompanhamento médico.</p>
    <${DaySheet} iso=${open} logs=${logs} onClose=${() => setOpen(null)} />`;
}
