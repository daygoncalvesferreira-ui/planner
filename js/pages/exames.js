// Exames e consultas de rotina por pessoa (você, Olivia e quem mais quiser incluir)
import { html, useState, useLayoutEffect } from '../lib/preact-htm.js';
import { useList } from '../store/hooks.js';
import { save } from '../store/repo.js';
import { Sheet, toast } from '../components/ui.js';
import { removeWithUndo } from '../lib/actions.js';
import { saveSettings } from '../store/settings.js';
import { ROUTINE, addMonths } from '../lib/fitness.js';
import { todayISO, fromISO, shortDate } from '../lib/date.js';

export const DEFAULT_PEOPLE = [{ id: 'eu', name: 'Eu', kind: 'adulta' }, { id: 'olivia', name: 'Olivia', kind: 'crianca' }];
const KINDS = [['consulta', '🩺 Consulta'], ['exame', '🧪 Exame'], ['vacina', '💉 Vacina']];
const EVERY = [[3, '3 meses'], [6, '6 meses'], [12, '1 ano'], [24, '2 anos'], [0, 'Não repete']];
const opt = (a, v) => (a.find(o => o[0] === v) || [, ''])[1];
const daysTo = (iso, today) => Math.round((fromISO(iso) - fromISO(today)) / 864e5);

export function examStatus(e, today = todayISO()) {
  if (e.scheduledOn && e.scheduledOn >= today) return { k: 'agendado', label: `Agendado para ${shortDate(e.scheduledOn)}`, n: daysTo(e.scheduledOn, today) };
  if (!e.nextOn) return { k: 'sem', label: e.doneOn ? `Feito em ${shortDate(e.doneOn)}` : 'Sem data', n: 9999 };
  const n = daysTo(e.nextOn, today);
  if (n < 0) return { k: 'atrasado', label: `Atrasado desde ${shortDate(e.nextOn)}`, n };
  if (n <= 30) return { k: 'breve', label: `Vence em ${n} ${n === 1 ? 'dia' : 'dias'}`, n };
  return { k: 'ok', label: `Em dia · próximo em ${shortDate(e.nextOn)}`, n };
}
export const examsDue = (rows, today) => rows.filter(e => ['atrasado', 'breve'].includes(examStatus(e, today).k));

function ExamSheet({ item, people, onClose }) {
  const [f, setF] = useState(item || {});
  useLayoutEffect(() => setF(item || {}), [item]);
  if (!item) return null;
  const set = (k, v) => setF(cur => { const n = { ...cur, [k]: v };
    if ((k === 'doneOn' || k === 'every') && n.doneOn && n.every) n.nextOn = addMonths(n.doneOn, +n.every); // próxima data automática
    if (k === 'every' && !+v) n.nextOn = ''; return n; });
  const submit = async () => { const { _s, ...rest } = f; await save('exams', { visibility: 'private', ...rest, name: f.name.trim() }); toast('Salvo'); onClose(); };
  return html`<${Sheet} open=${!!item} onClose=${onClose} title=${item.id ? 'Editar' : 'Novo exame ou consulta'}>
    <div class="field"><span>Para quem</span><div class="chips">${people.map(p => html`<button type="button" class=${'chip' + (f.person === p.id ? ' on' : '')} onClick=${() => set('person', p.id)}>${p.name}</button>`)}</div></div>
    <label class="field"><span>Nome</span><input class="input" value=${f.name || ''} onInput=${e => set('name', e.target.value)} placeholder="Ex.: Ultrassom, Hemograma, Pediatra" /></label>
    <div class="field"><span>Tipo</span><div class="chips">${KINDS.map(([id, n]) => html`<button type="button" class=${'chip' + (f.kind === id ? ' on' : '')} onClick=${() => set('kind', id)}>${n}</button>`)}</div></div>
    <label class="field"><span>Médico ou especialidade (opcional)</span><input class="input" value=${f.doctor || ''} onInput=${e => set('doctor', e.target.value)} /></label>
    <div class="fieldrow"><label class="field"><span>Último feito em</span><input type="date" class="input" value=${f.doneOn || ''} onInput=${e => set('doneOn', e.target.value)} /></label>
      <label class="field"><span>Agendado para</span><input type="date" class="input" value=${f.scheduledOn || ''} onInput=${e => set('scheduledOn', e.target.value)} /></label></div>
    <div class="field"><span>Repetir a cada</span><div class="chips">${EVERY.map(([m, n]) => html`<button type="button" class=${'chip' + (+f.every === m ? ' on' : '')} onClick=${() => set('every', m)}>${n}</button>`)}</div></div>
    <label class="field"><span>Próximo previsto</span><input type="date" class="input" value=${f.nextOn || ''} onInput=${e => set('nextOn', e.target.value)} /></label>
    <label class="field"><span>Resultado ou observações (opcional)</span><textarea class="input area" rows="3" value=${f.result || ''} onInput=${e => set('result', e.target.value)} placeholder="Ex.: tudo normal; vitamina D baixa, repetir em 3 meses"></textarea></label>
    <button class="btn" disabled=${!f.name?.trim() || !f.person} onClick=${submit}>Salvar</button>
    ${item.id && html`<button class="btn ghost" onClick=${() => { removeWithUndo('exams', item.id, 'Excluído'); onClose(); }}>Excluir</button>`}
    ${item.history?.length > 0 && html`<div class="field" style="margin-top:14px"><span>Vezes anteriores</span>${item.history.map(h => html`<p class="hist-line">${shortDate(h.date)}${h.result ? ` · ${h.result}` : ''}</p>`)}</div>`}
  <//>`;
}

function Suggest({ person, existing, onClose }) {
  const list = ROUTINE[person?.kind || 'adulta'];
  const [sel, setSel] = useState([]);
  useLayoutEffect(() => setSel(list.filter(([n]) => !existing.includes(n)).map(([n]) => n)), [person?.id]);
  if (!person) return null;
  const add = async () => {
    for (const [name, kind, every, doctor] of list.filter(([n]) => sel.includes(n))) await save('exams', { person: person.id, name, kind, every, doctor, doneOn: '', nextOn: '', visibility: 'private' });
    toast(`${sel.length} itens adicionados`); onClose();
  };
  return html`<${Sheet} open=${!!person} onClose=${onClose} title=${`Rotina sugerida · ${person.name}`}>
    <p class="lead">Uma base comum ${person.kind === 'crianca' ? 'para crianças' : 'para mulheres adultas'}. Confirme a frequência com o médico de cada uma. Depois, informe a data do último de cada item.</p>
    ${list.map(([n, k, ev]) => { const has = existing.includes(n); const on = sel.includes(n);
      return html`<label class=${'toggle' + (has ? ' dim' : '')}><input type="checkbox" disabled=${has} checked=${on || has} onChange=${() => setSel(on ? sel.filter(x => x !== n) : [...sel, n])} />
        <span><strong>${n}</strong><small>${has ? 'Já está na lista' : `A cada ${opt(EVERY, ev)}`}</small></span></label>`; })}
    <button class="btn" disabled=${!sel.length} onClick=${add}>Adicionar ${sel.length || ''}</button>
  <//>`;
}

export function Exames({ date, settings }) {
  const rows = useList('exams', () => true, []);
  const people = settings?.people || DEFAULT_PEOPLE;
  const [who, setWho] = useState(people[0].id);
  const [editing, setEditing] = useState(null);
  const [suggest, setSuggest] = useState(null);
  const [newP, setNewP] = useState(null);
  if (!rows) return null;
  const person = people.find(p => p.id === who) || people[0];
  const mine = rows.filter(r => r.person === person.id).map(r => ({ ...r, _s: examStatus(r, date) })).sort((a, b) => a._s.n - b._s.n);
  const due = mine.filter(r => ['atrasado', 'breve'].includes(r._s.k)).length;
  const did = async r => { const hist = [...(r.history || []), ...(r.doneOn ? [{ date: r.doneOn, result: r.result || '' }] : [])];
    const { _s, ...base } = r;
    await save('exams', { ...base, history: hist, doneOn: date, scheduledOn: '', result: '', nextOn: +r.every ? addMonths(date, +r.every) : '' });
    toast('Registrado. Próxima data calculada', { undo: () => save('exams', base) }); };
  const addPerson = async () => { const name = newP?.name?.trim(); if (!name) return;
    const p = { id: 'p' + Date.now().toString(36), name, kind: newP.kind || 'adulta' };
    await saveSettings({ people: [...people, p] }); setWho(p.id); setNewP(null); };
  return html`<h1 class="page-title">Exames e consultas</h1>
    <p class="soon">Saiba o que está em dia e o que está vencendo, seu e da família. Fica só neste aparelho.</p>
    <div class="tabs" role="tablist">${people.map(p => { const n = examsDue(rows.filter(r => r.person === p.id), date).length;
      return html`<button role="tab" aria-selected=${who === p.id} class=${'tab' + (who === p.id ? ' on' : '')} onClick=${() => setWho(p.id)}>${p.name}${n ? html`<b>${n}</b>` : ''}</button>`; })}
      <button class="tab" onClick=${() => setNewP({ name: '', kind: 'adulta' })}>+ Pessoa</button></div>
    ${due > 0 && html`<div class="behind"><p><b>${due} ${due === 1 ? 'item precisa' : 'itens precisam'} de atenção</b> para ${person.name === 'Eu' ? 'você' : person.name}. Agende e registre a data em "Agendado para".</p></div>`}
    <button class="add-big" onClick=${() => setEditing({ person: person.id, kind: 'consulta', every: 12 })}>+ Exame ou consulta</button>
    ${!mine.length && html`<div class="empty">Nada cadastrado para ${person.name === 'Eu' ? 'você' : person.name}.<button onClick=${() => setSuggest(person)}>Ver rotina sugerida</button></div>`}
    <div class="cards">${mine.map(r => html`<div class=${'card-row exam ' + r._s.k}>
      <button class="card-main" onClick=${() => setEditing(r)}><strong>${r.name}</strong>
        <span class="meta-line"><span class="ex-status">${r._s.label}</span>${r.doctor && html`<span>${r.doctor}</span>`}${+r.every ? html`<span>a cada ${opt(EVERY, +r.every)}</span>` : ''}</span>
        ${!r.doneOn && html`<span class="meta-line"><span>Toque para informar quando foi o último</span></span>`}
        ${r.result && html`<span class="quote">${r.result}</span>`}</button>
      ${(r._s.k !== 'ok') && html`<button class="mini-act good" onClick=${() => did(r)}>Fiz hoje</button>`}
    </div>`)}</div>
    ${mine.length > 0 && html`<button class="link" style="margin-top:10px" onClick=${() => setSuggest(person)}>+ Itens da rotina sugerida</button>`}
    <p class="cycle-note">Sugestões gerais de rotina. A frequência certa depende da idade e do histórico de cada pessoa: confirme sempre com o médico.</p>
    <${ExamSheet} item=${editing} people=${people} onClose=${() => setEditing(null)} />
    <${Suggest} person=${suggest} existing=${rows.filter(r => r.person === suggest?.id).map(r => r.name)} onClose=${() => setSuggest(null)} />
    <${Sheet} open=${!!newP} onClose=${() => setNewP(null)} title="Adicionar pessoa">
      <label class="field"><span>Nome</span><input class="input" value=${newP?.name || ''} onInput=${e => setNewP({ ...newP, name: e.target.value })} placeholder="Ex.: marido" /></label>
      <div class="field"><span>Rotina sugerida de</span><div class="chips">${[['adulta', 'Adulto'], ['crianca', 'Criança']].map(([k, n]) => html`<button type="button" class=${'chip' + (newP?.kind === k ? ' on' : '')} onClick=${() => setNewP({ ...newP, kind: k })}>${n}</button>`)}</div></div>
      <button class="btn" disabled=${!newP?.name?.trim()} onClick=${addPerson}>Adicionar</button>
    <//>`;
}
