// Regras da lista de compras: seções, leitura de "2 leite", seção automática e básicos
import { save, get, list } from '../store/repo.js';

// Ordem de um mercado típico: entrada (hortifrúti) até o caixa (limpeza/higiene)
export const SECTIONS = [
  ['hortifruti', 'Hortifrúti', '🥬'], ['padaria', 'Padaria', '🥖'], ['acougue', 'Açougue', '🥩'],
  ['frios', 'Frios e laticínios', '🧀'], ['mercearia', 'Mercearia', '🥫'], ['bebidas', 'Bebidas', '🧃'],
  ['congelados', 'Congelados', '🧊'], ['limpeza', 'Limpeza', '🧽'], ['higiene', 'Higiene', '🧼'],
  ['farmacia', 'Farmácia', '💊'], ['outros', 'Outros', '📦']
];
export const SECTION = Object.fromEntries(SECTIONS.map(([id, n, e], i) => [id, { name: n, emoji: e, order: i }]));

export const LISTS = [['mercado', 'Mercado', '🛒'], ['farmacia', 'Farmácia', '💊'], ['casa', 'Casa', '🏠'], ['filha', 'Filha', '👧']];

export const norm = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const catalogId = (listId, name) => `${listId}:${norm(name)}`;

// "2 leite", "1,5 kg carne", "leite" → { qty, name }
// Também entende "meio kg queijo", "1/2 kg presunto" e quantidade no fim: "leite 2", "arroz 5kg"
const Q = '(\\d+(?:[.,]\\d+)?|\\d+\\/\\d+|meio|meia|uma?|duas|dois|tr[eê]s)';
const UN = '(kg|g|l|ml|un|pct|cx|dz|pacotes?|caixas?|latas?|duzias?|d[uú]zias?)';
const WORDS = { meio: '1/2', meia: '1/2', um: '1', uma: '1', dois: '2', duas: '2', 'tres': '3', 'três': '3' };
export function parse(text) {
  const t = text.trim().replace(/\s+/g, ' ');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const fmt = (q, u) => (WORDS[q.toLowerCase()] || q) + (u ? ' ' + u.toLowerCase() : '');
  let m = t.match(new RegExp('^' + Q + '\\s*' + UN + '?\\.?\\s+(?:de\\s+)?(.+)$', 'i'));
  if (m) return { qty: fmt(m[1], m[2]), name: cap(m[3]) };
  m = t.match(new RegExp('^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*' + UN + '?$', 'i'));
  if (m) return { qty: fmt(m[2], m[3]), name: cap(m[1]) };
  return { qty: '', name: cap(t) };
}

const KEYWORDS = {
  hortifruti: 'banana maca laranja limao tomate cebola alho batata cenoura alface rucula couve brocolis abobrinha pepino pimentao mamao melancia uva morango abacate fruta legume verdura cheiro-verde mandioca inhame chuchu',
  padaria: 'pao bisnaguinha bolo torrada croissant',
  acougue: 'carne frango file peito coxa linguica bife costela picanha patinho moida porco peixe salsicha',
  frios: 'leite creme-de-leite queijo presunto manteiga margarina iogurte requeijao creme ovo ovos mussarela peito-de-peru nata',
  mercearia: 'leite-condensado arroz feijao acucar cafe sal oleo azeite macarrao farinha molho biscoito bolacha aveia achocolatado tempero vinagre milho ervilha atum sardinha granola cereal fuba gelatina',
  bebidas: 'agua suco refrigerante cha cerveja vinho',
  congelados: 'congelado sorvete lasanha pao-de-queijo hamburguer nuggets polpa',
  limpeza: 'detergente sabao amaciante agua-sanitaria desinfetante esponja saco-de-lixo lustra multiuso alcool limpa papel-toalha pano vassoura',
  higiene: 'papel-higienico sabonete pasta-de-dente escova shampoo condicionador desodorante absorvente fio-dental cotonete fralda lenco',
  farmacia: 'remedio curativo band-aid soro vitamina protetor-solar algodao termometro'
};
export function guessSection(name) {
  const n = norm(name);
  let best = 'outros', len = 0;
  for (const [sec, words] of Object.entries(KEYWORDS))
    for (const w of words.split(' ').map(x => x.replace(/-/g, ' ')))
    { // palavra no início do nome vale mais ("molho de tomate" é mercearia)
      const score = n.startsWith(w) ? 100 + w.length : n.includes(' ' + w) ? w.length : 0;
      if (score > len) { best = sec; len = score; }
    }
  return best;
}

// Adiciona item e aprende (seção + frequência) no catálogo
export async function addItem(listId, text, extra = {}) {
  const { qty, name } = parse(text);
  if (!name) return null;
  const cid = catalogId(listId, name);
  const pending = await list('shoppingItems', i => i.listId === listId && !i.done && norm(i.name) === norm(name));
  if (pending.length) return { duplicate: true };
  const cat = await get('shoppingCatalog', cid);
  const section = extra.section || cat?.section || guessSection(name);
  await save('shoppingItems', { listId, name: cat?.name || name, qty, section, note: '', done: false, visibility: 'shared', ...extra });
  await save('shoppingCatalog', { ...(cat || { id: cid, listId, name, staple: false, count: 0 }), section, count: (cat?.count || 0) + 1 });
  return { ok: true };
}

export async function learn(listId, name, patch) {
  const cid = catalogId(listId, name);
  const cat = await get('shoppingCatalog', cid);
  await save('shoppingCatalog', { ...(cat || { id: cid, listId, name, count: 1, staple: false }), ...patch });
}

const STAPLES = {
  mercado: {
    hortifruti: 'Banana, Maçã, Tomate, Cebola, Alho, Batata, Cenoura, Alface, Limão',
    padaria: 'Pão francês, Pão de forma',
    acougue: 'Frango, Carne moída, Bife',
    frios: 'Leite, Ovos, Queijo, Presunto, Manteiga, Iogurte, Requeijão',
    mercearia: 'Arroz, Feijão, Açúcar, Café, Sal, Óleo, Azeite, Macarrão, Molho de tomate, Farinha de trigo, Biscoito, Achocolatado',
    bebidas: 'Água mineral, Suco',
    limpeza: 'Detergente, Sabão em pó, Amaciante, Água sanitária, Desinfetante, Esponja, Saco de lixo, Papel toalha',
    higiene: 'Papel higiênico, Sabonete, Pasta de dente, Shampoo, Condicionador, Desodorante'
  },
  farmacia: { farmacia: 'Curativo, Álcool 70%, Algodão, Protetor solar, Soro fisiológico' },
  casa: { outros: 'Lâmpada, Pilha, Filtro de água' },
  filha: { outros: 'Lanche da escola, Material escolar' }
};

export async function seedShopping() {
  let order = 0;
  for (const [id, name, emoji] of LISTS) if (!(await get('shoppingLists', id))) await save('shoppingLists', { id, name, emoji, order: order++, visibility: 'shared' });
  for (const [listId, secs] of Object.entries(STAPLES))
    for (const [section, names] of Object.entries(secs))
      for (const name of names.split(', ')) {
        const id = catalogId(listId, name);
        if (!(await get('shoppingCatalog', id))) await save('shoppingCatalog', { id, listId, name, section, staple: true, count: 0, visibility: 'shared' });
      }
}
