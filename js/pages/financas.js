// Finanças: objetivos (espelho das "Metas" da Área Financeira do Cliente) + ação do mês
import { html, useState, useLayoutEffect } from '../lib/preact-htm.js';
import { useList, useRecord } from '../store/hooks.js';
import { save, get } from '../store/repo.js';
import { Section, Sheet, Check, toast } from '../components/ui.js';
import { removeWithUndo } from '../lib/actions.js';
import { parseBRL, brl, brlShort, monthsUntil } from '../lib/money.js';
import { shortDate, fromISO } from '../lib/date.js';

export const GOAL_TYPES = [['reserva', '🛟', 'Reserva de emergência'], ['viagem', '✈️', 'Viagem'], ['casa', '🏡', 'Casa'], ['carro', '🚗', 'Carro'],
  ['educacao', '🎓', 'Educação da Olivia'], ['divida', '💳', 'Quitar dívida'], ['investir', '📈', 'Investimento ou aposentadoria'], ['outro', '✨', 'Outro']];
const TYPE = Object.fromEntries(GOAL_TYPES.map(([id, e, n]) => [id, { e, n }]));
const COLORS = { reserva: '#139C94', viagem: '#3B82D6', casa: '#A08A6A', carro: '#6C63D9', educacao: '#F08A5D', divida: '#D6457F', investir: '#2F9E6E', outro: '#9B7CF0' };

// Mesmo cálculo do protótipo: guardado, alvo, falta, % e quanto guardar por mês até o prazo
export function goalStats(g, today) {
  const saved = (g.initial || 0) + (g.deposits || []).reduce((a, d) => a + d.amount, 0);
  const target = g.target || 0;
  const left = Math.max(0, target - saved);
  const pct = target ? Math.min(100, Math.round(saved / target * 100)) : 0;
  const months = monthsUntil(today, g.deadline);
  let tip;
  if (target && saved >= target) tip = 'Meta batida! 🎉';
  else if (months === -1) tip = 'O prazo passou. Que tal definir uma nova data?';
  else if (months) tip = `Para chegar lá: ${brl(left / months)} por mês`;
  else tip = 'Defina um prazo para saber quanto guardar por mês';
  if (pct >= 50 && pct < 100 && months > 0) tip = `Mais da metade! ${brl(left / months)} por mês até ${shortDate(g.deadline)}`;
  return { saved, target, left, pct, months, tip, done: target > 0 && saved >= target };
}

const Ring = ({ pct, color, size = 88 }) => { const r = 34, c = 2 * Math.PI * r;
  return html`<div class="goal-ring" style=${`width:${size}px;height:${size}px`}><svg viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r=${r} fill="none" class="track" stroke-width="9"/>
    <circle cx="42" cy="42" r=${r} fill="none" stroke=${color} stroke-width="9" stroke-linecap="round" stroke-dasharray=${`${c * pct / 100} ${c}`} transform="rotate(-90 42 42)"/></svg><b>${pct}%</b></div>`; };

const MoneyInput = ({ label, value, onInput, ph }) => html`<label class="field"><span>${label}</span><span class="money-in"><i>R$</i><input inputmode="decimal" value=${value} placeholder=${ph || '0,00'} onInput=${e => onInput(e.target.value)} /></span></label>`;

function GoalSheet({ item, onClose }) {
  const [f, setF] = useState({});
  useLayoutEffect(() => { if (item) setF({ ...item, targetTxt: item.target ? String(item.target).replace('.', ',') : '', initialTxt: item.initial ? String(item.initial).replace('.', ',') : '' }); }, [item]);
  if (!item) return null;
  const ok = f.name?.trim() && parseBRL(f.targetTxt) > 0;
  const submit = async () => {
    const { targetTxt, initialTxt, ...rest } = f;
    await save('finGoals', { deposits: [], ...rest, name: f.name.trim(), target: parseBRL(targetTxt), initial: parseBRL(initialTxt), visibility: 'shared' });
    toast(item.id ? 'Objetivo atualizado' : 'Objetivo criado 🎯'); onClose();
  };
  const pickType = id => setF({ ...f, type: id, name: f.name?.trim() ? f.name : (id === 'outro' ? '' : TYPE[id].n) });
  return html`<${Sheet} open=${!!item} onClose=${onClose} title=${item.id ? 'Editar objetivo' : 'Novo objetivo'}>
    <div class="field"><span>Tipo</span><div class="type-grid">${GOAL_TYPES.map(([id, e, n]) => html`<button type="button" class=${'type-btn' + (f.type === id ? ' on' : '')} aria-pressed=${f.type === id} onClick=${() => pickType(id)}><span>${e}</span>${n}</button>`)}</div></div>
    <label class="field"><span>Nome do objetivo</span><input class="input" value=${f.name || ''} onInput=${e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Viagem em família" /></label>
    <div class="fieldrow">
      <${MoneyInput} label="Quanto quer juntar" value=${f.targetTxt || ''} onInput=${v => setF({ ...f, targetTxt: v })} ph="18.000,00" />
      <label class="field"><span>Até quando</span><input type="date" class="input" value=${f.deadline || ''} onInput=${e => setF({ ...f, deadline: e.target.value })} /></label>
    </div>
    <${MoneyInput} label=${item.id ? 'Valor que já tinha ao criar' : 'Já tem algum valor guardado? (opcional)'} value=${f.initialTxt || ''} onInput=${v => setF({ ...f, initialTxt: v })} />
    <label class="field"><span>Onde está guardado (opcional)</span><input class="input" value=${f.where || ''} onInput=${e => setF({ ...f, where: e.target.value })} placeholder="Ex.: CDB com liquidez diária, poupança" /></label>
    <label class="field"><span>Por que este objetivo importa? (opcional)</span><input class="input" value=${f.why || ''} onInput=${e => setF({ ...f, why: e.target.value })} placeholder="Ex.: dormir tranquila se algo acontecer" /></label>
    <button class="btn" disabled=${!ok} onClick=${submit}>Salvar objetivo</button>
    ${item.id && html`<button class="btn ghost" onClick=${() => { removeWithUndo('finGoals', item.id, 'Objetivo excluído'); onClose(); }}>Excluir objetivo</button>`}
  <//>`;
}

function DepositSheet({ goal, today, onClose }) {
  const [v, setV] = useState(''), [note, setNote] = useState(''), [date, setDate] = useState(today), [out, setOut] = useState(false);
  useLayoutEffect(() => { if (goal) { setV(''); setNote(''); setDate(today); setOut(false); } }, [goal?.id]);
  if (!goal) return null;
  const amount = parseBRL(v);
  const st = goalStats(goal, today);
  const submit = async () => {
    const dep = { id: Date.now().toString(36), date, amount: out ? -amount : amount, note: note.trim() };
    const fresh = await get('finGoals', goal.id);
    const next = { ...fresh, deposits: [...(fresh.deposits || []), dep] };
    await save('finGoals', next);
    const after = goalStats(next, today);
    toast(after.done && !st.done ? 'Meta batida! 🎉 Parabéns!' : out ? 'Retirada registrada' : `${brl(amount)} guardados 💰`); onClose();
  };
  return html`<${Sheet} open=${!!goal} onClose=${onClose} title=${`${TYPE[goal.type]?.e || '🎯'} ${goal.name}`}>
    <div class="seg"><button type="button" class=${!out ? 'on' : ''} onClick=${() => setOut(false)}>Guardei</button><button type="button" class=${out ? 'on' : ''} onClick=${() => setOut(true)}>Precisei tirar</button></div>
    <${MoneyInput} label=${out ? 'Quanto tirou' : 'Quanto guardou'} value=${v} onInput=${setV} />
    ${!out && st.months > 0 && !st.done && html`<div class="chips" style="margin:-4px 0 14px"><button type="button" class="chip" onClick=${() => setV((Math.ceil(st.left / st.months * 100) / 100).toFixed(2).replace('.', ','))}>Valor do mês: ${brl(st.left / st.months)}</button></div>`}
    <div class="fieldrow"><label class="field"><span>Quando</span><input type="date" class="input" value=${date} onInput=${e => setDate(e.target.value)} /></label>
      <label class="field"><span>Observação</span><input class="input" value=${note} onInput=${e => setNote(e.target.value)} placeholder="Ex.: 13º" /></label></div>
    <button class="btn" disabled=${!(amount > 0)} onClick=${submit}>${out ? 'Registrar retirada' : 'Guardar'}</button>
    ${(goal.deposits || []).length > 0 && html`<div class="field" style="margin-top:16px"><span>Histórico</span>${[...goal.deposits].reverse().slice(0, 8).map(d => html`<p class="hist-line"><b class=${d.amount < 0 ? 'neg' : 'pos'}>${d.amount < 0 ? '−' : '+'}${brl(Math.abs(d.amount))}</b> · ${shortDate(d.date)}${d.note ? ` · ${d.note}` : ''}</p>`)}</div>`}
  <//>`;
}

// Ação do mês: uma só, bem prática (como no protótipo)
function MonthAction({ ym }) {
  const rec = useRecord('finMonths', ym);
  const [editing, setEditing] = useState(false), [t, setT] = useState('');
  if (rec === undefined) return null;
  const saveA = async () => { await save('finMonths', { ...(rec || { id: ym, visibility: 'shared' }), action: t.trim(), actionDone: false }); setEditing(false); toast('Ação do mês salva'); };
  const toggle = () => save('finMonths', { ...rec, actionDone: !rec.actionDone }).then(() => !rec.actionDone && toast('Ação do mês feita ✓'));
  return html`<${Section} title="Ação do mês" icon=${html`<span aria-hidden="true">🎯</span>`} tone="rose" hint="Uma só, bem prática. É o passo que mais aproxima seus objetivos neste mês.">
    ${editing || !rec?.action ? html`<div class="action-edit"><input class="input" value=${t} onInput=${e => setT(e.target.value)} placeholder="Ex.: Renegociar a fatura do cartão" aria-label="Ação do mês" />
        <button class="btn" disabled=${!t.trim()} onClick=${saveA}>Salvar</button></div>`
      : html`<div class=${'row' + (rec.actionDone ? ' done' : '')}><${Check} on=${!!rec.actionDone} label="Marcar ação do mês como feita" onToggle=${toggle} />
        <button class="grow item-btn stack" onClick=${() => { setT(rec.action); setEditing(true); }}><span class="title">${rec.action}</span><span class="sub">${rec.actionDone ? 'Feito ✓' : 'Toque na caixinha quando fizer'}</span></button></div>`}
  <//>`;
}

export function Financas({ date }) {
  const goals = useList('finGoals', () => true, []);
  const [editing, setEditing] = useState(null);
  const [depositing, setDepositing] = useState(null);
  const [showDone, setShowDone] = useState(false);
  if (!goals) return null;
  const all = goals.map(g => ({ g, s: goalStats(g, date) }));
  const active = all.filter(x => !x.s.done).sort((a, b) => (a.g.deadline || '9999').localeCompare(b.g.deadline || '9999'));
  const done = all.filter(x => x.s.done);
  const saved = all.reduce((a, x) => a + x.s.saved, 0), target = all.reduce((a, x) => a + x.s.target, 0);
  const monthly = active.reduce((a, x) => a + (x.s.months > 0 ? x.s.left / x.s.months : 0), 0);
  const ym = date.slice(0, 7);
  const savedMonth = goals.reduce((a, g) => a + (g.deposits || []).filter(d => d.date.startsWith(ym)).reduce((b, d) => b + d.amount, 0), 0);
  // "Vale saber": o objetivo mais próximo do prazo e o efeito de guardar um pouco mais
  const near = active.find(x => x.s.months > 0);
  let insight = null;
  if (near) { const per = near.s.left / near.s.months, extra = Math.max(50, Math.round(per * 0.2 / 50) * 50);
    const faster = Math.ceil(near.s.left / (per + extra)); const gain = near.s.months - faster;
    insight = gain >= 1 ? `Guardando ${brl(extra, false)} a mais por mês, "${near.g.name}" fica pronto ${gain === 1 ? '1 mês' : gain + ' meses'} antes.` : `Guardando ${brl(per)} por mês, "${near.g.name}" fica pronto até ${shortDate(near.g.deadline)}.`; }
  const Card = ({ g, s }) => html`<div class="goal-card-f">
    <button class="gc-main" onClick=${() => setEditing(g)}>
      <${Ring} pct=${s.pct} color=${COLORS[g.type] || COLORS.outro} />
      <div class="gc-text"><strong>${TYPE[g.type]?.e || '🎯'} ${g.name}</strong>
        <span>${brl(s.saved)} de ${brl(s.target)}${s.left ? ` · faltam ${brl(s.left)}` : ''}</span>
        ${g.deadline && html`<span>Meta para ${fromISO(g.deadline).toLocaleDateString('pt-BR')}</span>`}
        <em class=${s.done ? 'tip done' : 'tip'}>${s.tip}</em></div></button>
    ${!s.done && html`<button class="gc-add" onClick=${() => setDepositing(g)}>+ Guardar</button>`}
  </div>`;
  return html`<h1 class="page-title">Finanças</h1>
    <p class="soon">Seus objetivos: quanto já guardou, quanto falta e quanto guardar por mês para chegar lá.</p>
    ${goals.length > 0 && html`<div class="fin-hero">
      <${Ring} pct=${target ? Math.round(saved / target * 100) : 0} color="#fff" size=${96} />
      <div><span>Guardado nos objetivos</span><b>${brl(saved)}</b><small>de ${brl(target)}${savedMonth ? ` · ${brl(savedMonth)} este mês` : ''}</small>
        ${monthly > 0 && html`<small>Meta de guardar por mês: <b>${brl(monthly)}</b></small>`}</div></div>`}
    <${MonthAction} ym=${ym} />
    <section class="section tone-lilac">
      <div class="section-head"><span class="badge" aria-hidden="true">🌱</span><div class="head-text"><h2>Meus objetivos</h2><p class="hint">Toque no objetivo para editar, e em "+ Guardar" sempre que separar dinheiro.</p></div></div>
      ${!goals.length && html`<div class="empty">Comece pela reserva de emergência: ela protege todos os outros objetivos.</div>`}
      <div class="cards">${active.map(x => html`<${Card} ...${x} />`)}</div>
      <button class="add-big" style="margin-top:10px" onClick=${() => setEditing({ type: goals.some(g => g.type === 'reserva') ? 'outro' : 'reserva', name: goals.some(g => g.type === 'reserva') ? '' : 'Reserva de emergência' })}>+ Novo objetivo</button>
      ${done.length > 0 && html`<button class="link" onClick=${() => setShowDone(!showDone)}>${showDone ? 'Esconder' : 'Ver'} objetivos conquistados (${done.length}) 🎉</button>
        ${showDone && html`<div class="cards">${done.map(x => html`<${Card} ...${x} />`)}</div>`}`}
    </section>
    ${insight && html`<div class="insight"><span aria-hidden="true">💡</span><div><b>Vale saber</b><p>${insight}</p></div></div>`}
    <${Section} title="Em breve" tone="blue" hint="Receitas, despesas, contas a pagar e planejado x realizado por categoria, compartilhados com seu marido (fases seguintes)." />
    <${GoalSheet} item=${editing} onClose=${() => setEditing(null)} />
    <${DepositSheet} goal=${depositing} today=${date} onClose=${() => setDepositing(null)} />`;
}
