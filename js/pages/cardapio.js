// Cardápio da família: semana planejada, porções para quem come em casa e lista de compras automática
import { html, useState, useLayoutEffect } from '../lib/preact-htm.js';
import { useList, useRecord } from '../store/hooks.js';
import { save, list } from '../store/repo.js';
import { Section, Sheet, toast } from '../components/ui.js';
import { removeWithUndo } from '../lib/actions.js';
import { saveSettings } from '../store/settings.js';
import { RECIPES, SPECIAL, MEAL_TYPES, DEFAULT_FAMILY, PORTIONS, servingsFor, kidEats, whoEats, lunchboxes, isWeekend, suggestWeek, shoppingFromPlan, fmtQty } from '../lib/recipes.js';
import { guessSection, norm, SECTION } from '../lib/shopping.js';
import { fromISO, toISO, weekday, shortDate } from '../lib/date.js';

const shift = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const weekOf = iso => shift(iso, -((fromISO(iso).getDay() + 6) % 7));
const MEAL = Object.fromEntries(MEAL_TYPES.map(([id, e, n]) => [id, { e, n }]));
export const useRecipes = () => { const own = useList('recipes', () => true, []); return own && Object.fromEntries([...RECIPES, ...own, ...Object.values(SPECIAL)].map(r => [r.id, r])); };
const fam = settings => settings?.family || DEFAULT_FAMILY;

// "200 g peito de frango", "2 ovos", "leite 200 ml" → ingrediente por porção
function parseIng(line) {
  const t = line.trim(); if (!t) return null;
  let m = t.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|un|unidades?|fatias?|colheres?)?\s+(?:de\s+)?(.+)$/i) || t.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|un|unidades?|fatias?)?$/i);
  if (!m) return { name: t, q: 1, u: 'un', sec: guessSection(t) };
  const [q, u, name] = /^\d/.test(m[1]) ? [m[1], m[2], m[3]] : [m[2], m[3], m[1]];
  let n = parseFloat(String(q).replace(',', '.')), unit = (u || 'un').toLowerCase();
  if (unit === 'kg') { n *= 1000; unit = 'g'; } if (unit === 'l') { n *= 1000; unit = 'ml'; }
  if (/^unid/.test(unit)) unit = 'un'; if (/^fatia/.test(unit)) unit = 'fatias'; if (/^colher/.test(unit)) { n *= 15; unit = 'g'; }
  const nm = name.charAt(0).toUpperCase() + name.slice(1);
  return { name: nm, q: n, u: unit, sec: guessSection(nm) };
}

function RecipeSheet({ recipe, meal, day, family, onClose, onPick }) {
  if (!recipe) return null;
  const d = day ?? 5; // sem dia: mostra para o fim de semana (todos em casa)
  const n = meal ? servingsFor(family, meal, d) : family.reduce((a, p) => a + p.portion, 0);
  const kid = meal ? kidEats(family, meal, d) : true;
  const boxes = meal === 'almoco' ? lunchboxes(family, d) : [];
  return html`<${Sheet} open=${!!recipe} onClose=${onClose} title=${recipe.name}>
    <p class="lead">${recipe.time ? `⏱️ ${recipe.time} min · ` : ''}Quantidades para ${String(n).replace('.', ',')} ${n === 1 ? 'porção' : 'porções'} (${(meal ? whoEats(family, meal, d) : family).map(p => p.name).join(', ')})</p>
    ${boxes.length > 0 && html`<div class="box-tip"><b>🍱 ${boxes.length} ${boxes.length === 1 ? 'marmita' : 'marmitas'} (${boxes.map(p => p.name).join(' e ')})</b><p>${recipe.box || 'Separe as marmitas assim que ficar pronto, antes de servir: a porção fica certa e esfria mais rápido na geladeira.'}</p></div>`}
    ${recipe.ing?.length > 0 && html`<div class="ing-list">${recipe.ing.map(i => html`<div><span>${i.name}</span><b>${fmtQty(i.q * n, i.u)}</b></div>`)}</div>`}
    ${recipe.how && html`<div class="field" style="margin-top:14px"><span>Como fazer</span><p class="how">${recipe.how}</p></div>`}
    ${recipe.kid && kid && html`<div class="kid-tip"><b>👧 Para a Olivia</b><p>${recipe.kid}</p></div>`}
    ${onPick && html`<button class="btn" style="margin-top:14px" onClick=${onPick}>Escolher esta</button>`}
  <//>`;
}

function SlotSheet({ slot, recipes, family, onClose, onSet }) {
  const day = slot ? +slot.key.split('-')[0] : 0;
  const [q, setQ] = useState(''), [view, setView] = useState(null);
  useLayoutEffect(() => { setQ(''); setView(null); }, [slot?.key]);
  if (!slot) return null;
  const meal = slot.key.split('-')[1];
  const boxDay = meal === 'almoco' && lunchboxes(family, day).length > 0;
  const opts = Object.values(recipes).filter(r => r.meals?.includes(meal) && (!q || norm(r.name).includes(norm(q))));
  return html`<${Sheet} open=${!!slot} onClose=${onClose} title=${`${MEAL[meal].e} ${MEAL[meal].n} · ${slot.label}`}>
    <input class="input" type="search" placeholder="Buscar receita" value=${q} onInput=${e => setQ(e.target.value)} aria-label="Buscar receita" style="margin-bottom:10px" />
    <div class="rows">${opts.map(r => html`<div class=${'pick-row' + (slot.current === r.id ? ' on' : '')}>
      <button class="grow" onClick=${() => { onSet(r.id); onClose(); }}><strong>${r.name}</strong><small>${r.time ? r.time + ' min' : ''}${boxDay && r.noBox ? ' · não vai bem na marmita' : ''}</small></button>
      <button class="mini-act" onClick=${() => setView(r)}>Ver</button></div>`)}
      ${(meal === 'jantar' || meal === 'almoco') && Object.values(SPECIAL).map(s => html`<div class=${'pick-row special' + (slot.current === s.id ? ' on' : '')}><button class="grow" onClick=${() => { onSet(s.id); onClose(); }}><strong>${s.emoji} ${s.name}</strong>${s.hint && html`<small>${s.hint}</small>`}</button></div>`)}
      ${slot.current && html`<button class="link" onClick=${() => { onSet(null); onClose(); }}>Deixar vazio</button>`}</div>
    <${RecipeSheet} recipe=${view} meal=${meal} day=${day} family=${family} onClose=${() => setView(null)} onPick=${() => { onSet(view.id); setView(null); onClose(); }} />
  <//>`;
}

function FamilySheet({ open, settings, onClose }) {
  const [f, setF] = useState([]);
  useLayoutEffect(() => { if (open) setF(JSON.parse(JSON.stringify(fam(settings)))); }, [open]);
  if (!open) return null;
  const upd = (i, patch) => setF(f.map((p, j) => j === i ? { ...p, ...patch } : p));
  const togMeal = (i, m, k = 'meals') => { const cur = f[i][k] || MEAL_TYPES.map(x => x[0]); upd(i, { [k]: cur.includes(m) ? cur.filter(x => x !== m) : [...cur, m] }); };
  const Chips = (p, i, k) => html`<div class="chips">${MEAL_TYPES.map(([m, e, n]) => { const on = (p[k] || MEAL_TYPES.map(x => x[0])).includes(m);
    return html`<button type="button" class=${'chip' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => togMeal(i, m, k)}>${e} ${n.split(' ')[0]}${m === 'almoco' && k === 'meals' && p.lunchbox && on ? ' 🍱' : ''}</button>`; })}</div>`;
  return html`<${Sheet} open=${open} onClose=${onClose} title="Quem come em casa">
    <p class="lead">Marque as refeições feitas com comida de casa. <b>Marmita conta</b>, porque é cozinhada aqui. Refeição na escola ou no trabalho, desmarque.</p>
    ${f.map((p, i) => html`<div class="fam-card">
      <div class="fam-top"><input class="input" value=${p.name} aria-label="Nome" onInput=${e => upd(i, { name: e.target.value })} />
        ${f.length > 1 && html`<button class="mini-act" aria-label=${'Remover ' + p.name} onClick=${() => setF(f.filter((_, j) => j !== i))}>Remover</button>`}</div>
      <span class="fam-lbl">Segunda a sexta</span>${Chips(p, i, 'meals')}
      ${p.meals.includes('almoco') && html`<label class="box-toggle"><input type="checkbox" checked=${!!p.lunchbox} onChange=${e => upd(i, { lunchbox: e.target.checked })} /> 🍱 Leva o almoço de marmita</label>`}
      <span class="fam-lbl">Sábado e domingo</span>${Chips(p, i, 'weekend')}
      <div class="chips">${PORTIONS.map(([v, n]) => html`<button type="button" class=${'chip' + (p.portion === v ? ' on' : '')} onClick=${() => upd(i, { portion: v, kid: v < 1 })}>${n}</button>`)}</div>
    </div>`)}
    <button class="link" onClick=${() => setF([...f, { id: 'p' + Date.now().toString(36), name: 'Nova pessoa', portion: 1, meals: MEAL_TYPES.map(m => m[0]), weekend: MEAL_TYPES.map(m => m[0]) }])}>+ Pessoa</button>
    <button class="btn" style="margin-top:12px" onClick=${async () => { await saveSettings({ family: f.filter(p => p.name.trim()) }); toast('Família atualizada'); onClose(); }}>Salvar</button>
  <//>`;
}

// Prévia da lista: desmarque o que já tem em casa e mande o resto para o Mercado
function ShopSheet({ items, week, onClose }) {
  const [skip, setSkip] = useState([]);
  useLayoutEffect(() => setSkip([]), [items]);
  if (!items) return null;
  const go = async () => {
    const pending = await list('shoppingItems', i => i.listId === 'mercado' && !i.done);
    let added = 0, updated = 0, kept = 0;
    for (const it of items.filter(i => !skip.includes(i.name))) {
      const cur = pending.find(p => norm(p.name) === norm(it.name));
      if (cur?.source === 'cardapio') { await save('shoppingItems', { ...cur, qty: it.qty, week }); updated++; }
      else if (cur) kept++;
      else { await save('shoppingItems', { listId: 'mercado', name: it.name, qty: it.qty, section: it.sec, note: 'Cardápio da semana', done: false, source: 'cardapio', week, visibility: 'shared' }); added++; }
    }
    toast(`${added} itens adicionados ao Mercado${updated ? `, ${updated} atualizados` : ''}${kept ? ` · ${kept} já estavam na lista` : ''}`); onClose();
  };
  const secs = [...new Set(items.map(i => i.sec))];
  return html`<${Sheet} open=${!!items} onClose=${onClose} title="Lista de compras da semana">
    <p class="lead">Calculada pelo cardápio e por quem come em casa. <b>Toque no que você já tem</b> para não comprar repetido. Temperos (sal, óleo, ervas) não entram.</p>
    ${secs.map(sec => html`<h3 class="shop-sec">${SECTION[sec]?.emoji} ${SECTION[sec]?.name || sec}</h3>
      ${items.filter(i => i.sec === sec).map(i => { const off = skip.includes(i.name); return html`<button class=${'shop-line' + (off ? ' off' : '')} aria-pressed=${!off} onClick=${() => setSkip(off ? skip.filter(x => x !== i.name) : [...skip, i.name])}>
        <span class="box">${off ? '' : '✓'}</span><span class="nm">${i.name}</span><b>${off ? 'já tenho' : i.qty}</b></button>`; })}`)}
    <button class="btn" style="margin-top:14px" onClick=${go}>Adicionar ${items.length - skip.length} itens ao Mercado</button>
  <//>`;
}

function OwnRecipeSheet({ open, onClose }) {
  const blank = { name: '', meals: ['almoco'], ingTxt: '', how: '', kid: '' };
  const [f, setF] = useState(blank);
  useLayoutEffect(() => { if (open) setF(blank); }, [open]);
  if (!open) return null;
  const ing = (f.ingTxt || '').split('\n').map(parseIng).filter(Boolean);
  const tog = m => setF({ ...f, meals: f.meals.includes(m) ? f.meals.filter(x => x !== m) : [...f.meals, m] });
  return html`<${Sheet} open=${open} onClose=${onClose} title="Nova receita">
    <label class="field"><span>Nome</span><input class="input" value=${f.name} onInput=${e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Feijoada leve da vovó" /></label>
    <div class="field"><span>Serve para</span><div class="chips">${MEAL_TYPES.map(([m, e, n]) => html`<button type="button" class=${'chip' + (f.meals.includes(m) ? ' on' : '')} onClick=${() => tog(m)}>${e} ${n}</button>`)}</div></div>
    <label class="field"><span>Ingredientes para 1 adulto (um por linha)</span><textarea class="input area" rows="5" value=${f.ingTxt} onInput=${e => setF({ ...f, ingTxt: e.target.value })} placeholder=${'120 g peito de frango\n60 g arroz\n2 ovos\n200 ml leite'}></textarea></label>
    ${ing.length > 0 && html`<p class="plan-hint">Entendi: ${ing.map(i => `${i.name} (${fmtQty(i.q, i.u)})`).join(' · ')}</p>`}
    <label class="field"><span>Como fazer (opcional)</span><textarea class="input area" rows="3" value=${f.how} onInput=${e => setF({ ...f, how: e.target.value })}></textarea></label>
    <label class="field"><span>Dica para a Olivia (opcional)</span><input class="input" value=${f.kid} onInput=${e => setF({ ...f, kid: e.target.value })} /></label>
    <button class="btn" disabled=${!f.name.trim() || !f.meals.length} onClick=${async () => { await save('recipes', { name: f.name.trim(), meals: f.meals, ing, how: f.how, kid: f.kid, own: true, visibility: 'shared' }); toast('Receita salva'); onClose(); }}>Salvar receita</button>
  <//>`;
}

const whoLabel = (who, boxes) => !who.length ? 'ninguém em casa' : boxes.length ? `🍱 ${boxes.length} ${boxes.length === 1 ? 'marmita' : 'marmitas'}${who.length > boxes.length ? ` + ${who.filter(p => !boxes.includes(p)).map(p => p.name).join(', ')}` : ''}` : who.length === 1 ? who[0].name : `${who.length} pessoas`;
function famSummary(family) {
  const boxes = family.filter(p => p.lunchbox && p.meals.includes('almoco')).length;
  const kidOut = family.filter(p => p.kid && !p.meals.includes('almoco')).map(p => p.name);
  return [boxes ? `${boxes} marmitas nos dias úteis` : '', kidOut.length ? `${kidOut.join(', ')} almoça fora` : '', 'fim de semana todos em casa'].filter(Boolean).join(' · ');
}

export function Cardapio({ date, settings }) {
  const [ws, setWs] = useState(weekOf(date));
  const plan = useRecord('mealPlans', ws);
  const recipes = useRecipes();
  const own = useList('recipes', () => true, []);
  const [slot, setSlot] = useState(null), [view, setView] = useState(null), [famOpen, setFamOpen] = useState(false), [shop, setShop] = useState(null), [newRec, setNewRec] = useState(false), [ownOpen, setOwnOpen] = useState(false);
  if (plan === undefined || !recipes || !own) return null;
  const family = fam(settings);
  const slots = plan?.slots || {};
  const setSlotVal = (key, rid) => save('mealPlans', { id: ws, visibility: 'shared', ...(plan || {}), slots: { ...slots, [key]: rid } });
  const build = async () => { await save('mealPlans', { id: ws, visibility: 'shared', slots: suggestWeek(Math.round(fromISO(ws) / 6048e5) % 7, [...RECIPES, ...own], family) }); toast('Semana montada. Troque o que quiser.'); };
  const filled = Object.values(slots).filter(Boolean).length;
  // Na semana atual, a lista considera só os dias que ainda vêm (o que passou já foi comprado)
  const todayIdx = (fromISO(date).getDay() + 6) % 7;
  const upcoming = () => ws !== weekOf(date) ? slots : Object.fromEntries(Object.entries(slots).filter(([k]) => +k.split('-')[0] >= todayIdx));
  const n = family.reduce((a, p) => a + p.portion, 0);
  return html`<h1 class="page-title">Cardápio da família</h1>
    <p class="soon">Planeje a semana, veja as quantidades certas para a família e gere a lista do mercado sem esquecer nada.</p>
    <button class="fam-bar" onClick=${() => setFamOpen(true)}><span>👨‍👩‍👧 ${family.map(p => p.name).join(', ')}</span><small>${famSummary(family)} · ajustar</small></button>
    <div class="day-nav"><button class="icon-btn" aria-label="Semana anterior" onClick=${() => setWs(shift(ws, -7))}>‹</button>
      <b>${ws === weekOf(date) ? 'Esta semana' : ws > weekOf(date) ? 'Próxima semana' : 'Semana passada'} · ${shortDate(ws)} a ${shortDate(shift(ws, 6))}</b>
      <button class="icon-btn" aria-label="Próxima semana" onClick=${() => setWs(shift(ws, 7))}>›</button></div>
    ${!filled ? html`<div class="empty-plan"><p>Nenhum cardápio para esta semana ainda.</p>
        <button class="btn" onClick=${build}>✨ Montar semana sugerida</button><small>Variada, com arroz e feijão, legumes e frutas. Jantar de sobras 2x na semana para poupar tempo. Você troca o que quiser.</small></div>`
      : html`<div class="week-actions"><button class="btn" onClick=${() => setShop(shoppingFromPlan(upcoming(), family, recipes))}>🛒 Gerar lista de compras${ws === weekOf(date) && todayIdx > 0 ? ' (de hoje em diante)' : ''}</button>
        <button class="btn ghost" onClick=${() => confirm('Substituir a semana inteira por uma nova sugestão?') && build()}>Nova sugestão</button></div>`}
    ${filled > 0 && Array.from({ length: 7 }, (_, d) => { const iso = shift(ws, d); const today = iso === date;
      return html`<section class=${'section menu-day' + (today ? ' today' : '')}>
        <h2>${today ? 'Hoje · ' : ''}${weekday(fromISO(iso))} <small>${shortDate(iso)}</small></h2>
        ${MEAL_TYPES.map(([m, e, nm]) => { const key = `${d}-${m}`; const r = recipes[slots[key]];
          const who = whoEats(family, m, d); const boxes = m === 'almoco' ? lunchboxes(family, d) : [];
          if (!who.length && !slots[key]) return null; // ninguém come em casa nessa refeição
          return html`<div class="menu-slot"><span class="ms-meal">${e}</span>
            <button class="ms-name" onClick=${() => setSlot({ key, label: weekday(fromISO(iso)), current: slots[key] })}><small>${nm} · ${whoLabel(who, boxes)}</small><span>${r ? (r.emoji ? r.emoji + ' ' : '') + r.name : '+ Escolher'}</span></button>
            ${r?.ing?.length > 0 && html`<button class="mini-act" onClick=${() => setView({ r, m, d })}>Receita</button>`}</div>`; })}
      </section>`; })}
    <${Section} title="Minhas receitas" tone="amber" hint="Inclua os pratos que vocês já fazem: eles entram no cardápio e na lista de compras.">
      ${own.length > 0 && html`<div class="rows">${own.map(r => html`<div class="row"><button class="grow item-btn stack" onClick=${() => setView({ r })}><span class="title">${r.name}</span><span class="sub">${r.meals.map(m => MEAL[m].n).join(', ')}</span></button>
        <button class="mini-act" onClick=${() => removeWithUndo('recipes', r.id, 'Receita removida')}>Excluir</button></div>`)}</div>`}
      <button class="add-big" style="margin-top:8px" onClick=${() => setNewRec(true)}>+ Nova receita</button>
      <button class="link" onClick=${() => setOwnOpen(!ownOpen)}>${ownOpen ? 'Esconder' : 'Ver'} as ${RECIPES.length} receitas do app</button>
      ${ownOpen && html`<div class="rows">${RECIPES.map(r => html`<button class="row row-btn" onClick=${() => setView({ r })}><div class="grow item-btn stack"><span class="title">${r.name}</span><span class="sub">${r.meals.map(m => MEAL[m].n).join(', ')} · ${r.time} min</span></div></button>`)}</div>`}
    <//>
    <p class="cycle-note">Cardápio geral, baseado no Guia Alimentar para a População Brasileira. Para a Olivia, siga também as orientações do pediatra. Para quantidades sob medida para o seu objetivo, uma nutricionista ajusta este plano.</p>
    <${SlotSheet} slot=${slot} recipes=${recipes} family=${family} onClose=${() => setSlot(null)} onSet=${rid => setSlotVal(slot.key, rid)} />
    <${RecipeSheet} recipe=${view?.r} meal=${view?.m} day=${view?.d} family=${family} onClose=${() => setView(null)} />
    <${FamilySheet} open=${famOpen} settings=${settings} onClose=${() => setFamOpen(false)} />
    <${ShopSheet} items=${shop} week=${ws} onClose=${() => setShop(null)} />
    <${OwnRecipeSheet} open=${newRec} onClose=${() => setNewRec(false)} />`;
}

// Linha no cartão "Saúde de hoje"
export function MenuToday({ date }) {
  const plan = useRecord('mealPlans', weekOf(date));
  const recipes = useRecipes();
  if (plan === undefined || !recipes) return null;
  const d = (fromISO(date).getDay() + 6) % 7;
  const name = m => recipes[plan?.slots?.[`${d}-${m}`]]?.name;
  const a = name('almoco'), j = name('jantar');
  return html`<a class="health-line" href="#/cardapio"><span>🍽️</span><div><b>${a || j ? `Almoço: ${a || '—'}` : 'Monte o cardápio da semana'}</b>
    <small>${a || j ? `Jantar: ${j || '—'}` : 'E gere a lista de compras em 1 toque'}</small></div></a>`;
}
