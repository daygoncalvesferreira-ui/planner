// Receitas da família: ingredientes por 1 porção de adulto. A conta da família multiplica
// pelas porções de quem come em casa (adulto = 1, criança de 2 anos ≈ 0,5).
// Base: Guia Alimentar para a População Brasileira (comida de verdade, pouco ultraprocessado).

// [nome, quantidade por adulto, unidade, seção do mercado]
const I = (name, q, u, sec) => ({ name, q, u, sec });
const ARROZ = I('Arroz', 60, 'g', 'mercearia'), FEIJAO = I('Feijão', 40, 'g', 'mercearia');
const CEBOLA = I('Cebola', 20, 'g', 'hortifruti'), ALHO = I('Alho', 1.5, 'g', 'hortifruti');
const ALFACE = I('Alface', 30, 'g', 'hortifruti'), TOMATE = I('Tomate', 50, 'g', 'hortifruti');
const OVOS = n => I('Ovos', n, 'un', 'frios');
const CUT = 'Corte em pedaços pequenos e macios, sem sal extra.';

export const MEAL_TYPES = [['cafe', '☕', 'Café da manhã'], ['almoco', '🍽️', 'Almoço'], ['lanche', '🍎', 'Lanche'], ['jantar', '🌙', 'Jantar']];

export const RECIPES = [
  // Café da manhã
  { id: 'b:pao-ovo', name: 'Pão integral com ovo mexido', meals: ['cafe'], time: 10, ing: [I('Pão de forma integral', 2, 'fatias', 'padaria'), OVOS(2), I('Manteiga', 5, 'g', 'frios')], how: 'Bata os ovos, mexa em fogo baixo com um fio de manteiga e sirva com o pão.', kid: 'Ovo bem cozido, pão em tirinhas para ela segurar.' },
  { id: 'b:tapioca', name: 'Tapioca com queijo', meals: ['cafe', 'lanche'], time: 10, ing: [I('Goma de tapioca', 50, 'g', 'mercearia'), I('Queijo minas', 30, 'g', 'frios')], how: 'Espalhe a goma na frigideira quente, espere firmar, recheie com o queijo e dobre.', kid: 'Meia tapioca, cortada em pedaços pequenos.' },
  { id: 'b:iogurte-fruta', name: 'Iogurte natural com banana e aveia', meals: ['cafe', 'lanche'], time: 3, ing: [I('Iogurte natural', 170, 'g', 'frios'), I('Banana', 1, 'un', 'hortifruti'), I('Aveia em flocos', 20, 'g', 'mercearia')], how: 'Corte a banana sobre o iogurte e finalize com a aveia.', kid: 'Iogurte natural sem açúcar, banana amassada.' },
  { id: 'b:cuscuz', name: 'Cuscuz com ovo', meals: ['cafe', 'jantar'], time: 15, ing: [I('Flocão de milho', 50, 'g', 'mercearia'), OVOS(1), I('Manteiga', 5, 'g', 'frios')], how: 'Hidrate o flocão com água e uma pitada de sal, cozinhe na cuscuzeira por 10 min e sirva com ovo cozido.', kid: 'Cuscuz bem úmido, ovo picadinho.' },
  { id: 'b:vitamina', name: 'Vitamina de banana com aveia', meals: ['cafe', 'lanche'], time: 5, ing: [I('Leite', 200, 'ml', 'frios'), I('Banana', 1, 'un', 'hortifruti'), I('Aveia em flocos', 15, 'g', 'mercearia')], how: 'Bata tudo no liquidificador. Sem açúcar: a banana já adoça.', kid: 'Ofereça no copo de transição, em quantidade menor.' },
  { id: 'b:pao-queijo-mamao', name: 'Pão francês com queijo e mamão', meals: ['cafe'], time: 5, ing: [I('Pão francês', 1, 'un', 'padaria'), I('Queijo minas', 30, 'g', 'frios'), I('Mamão', 150, 'g', 'hortifruti')], how: 'Monte o pão com o queijo e sirva o mamão picado.', kid: 'Mamão em cubinhos, pão sem casca dura.' },
  // Lanches
  { id: 'b:fruta-castanha', name: 'Maçã com castanhas', meals: ['lanche'], time: 2, ing: [I('Maçã', 1, 'un', 'hortifruti'), I('Castanha-do-pará', 15, 'g', 'mercearia')], how: 'Corte a maçã e sirva com as castanhas.', kid: 'Castanha inteira tem risco de engasgo: só triturada, polvilhada na fruta. Maçã em lâminas finas ou cozida.' },
  { id: 'b:salada-fruta', name: 'Salada de frutas', meals: ['lanche', 'cafe'], time: 10, ing: [I('Banana', 0.5, 'un', 'hortifruti'), I('Maçã', 0.5, 'un', 'hortifruti'), I('Mamão', 100, 'g', 'hortifruti'), I('Laranja', 0.5, 'un', 'hortifruti')], how: 'Pique as frutas e regue com o suco da laranja. Sem açúcar.', kid: 'Frutas em pedaços bem pequenos e macios.' },
  { id: 'b:sanduiche', name: 'Sanduíche natural de frango', meals: ['lanche', 'jantar'], time: 10, ing: [I('Pão de forma integral', 2, 'fatias', 'padaria'), I('Peito de frango', 40, 'g', 'acougue'), I('Cenoura', 20, 'g', 'hortifruti'), I('Requeijão', 15, 'g', 'frios')], how: 'Misture o frango desfiado com a cenoura ralada e o requeijão e recheie o pão. Use sobra de frango cozido.', kid: 'Meio sanduíche cortado em quadradinhos.' },
  { id: 'b:pipoca', name: 'Pipoca caseira', meals: ['lanche'], time: 8, ing: [I('Milho de pipoca', 30, 'g', 'mercearia'), I('Óleo', 5, 'ml', 'mercearia')], how: 'Estoure na panela com pouco óleo e pouco sal.', kid: 'Pipoca não é indicada antes dos 4 anos (risco de engasgo). Para ela: banana ou mamão.', kidSwap: [I('Banana', 1, 'un', 'hortifruti')] },
  { id: 'b:iogurte-mel', name: 'Iogurte com mel e frutas vermelhas', meals: ['lanche'], time: 3, ing: [I('Iogurte natural', 170, 'g', 'frios'), I('Mel', 10, 'g', 'mercearia'), I('Morango', 60, 'g', 'hortifruti')], how: 'Misture o iogurte com o mel e os morangos picados.', kid: 'Sem mel para ela (açúcar). Morango cortado em quatro.' },
  // Almoço e jantar
  { id: 'b:frango-salada', name: 'Arroz, feijão, frango grelhado e salada', meals: ['almoco', 'jantar'], time: 30, ing: [ARROZ, FEIJAO, I('Peito de frango', 120, 'g', 'acougue'), ALFACE, TOMATE, CEBOLA, ALHO], how: 'Tempere o frango com alho, sal e limão e grelhe. Arroz e feijão como de costume. Salada de alface e tomate.', kid: 'Frango desfiado bem fininho, feijão amassado se preferir. ' + CUT },
  { id: 'b:carne-legumes', name: 'Arroz, feijão e carne moída com legumes', meals: ['almoco', 'jantar'], time: 30, ing: [ARROZ, FEIJAO, I('Carne moída (patinho)', 100, 'g', 'acougue'), I('Cenoura', 50, 'g', 'hortifruti'), I('Abobrinha', 50, 'g', 'hortifruti'), CEBOLA, ALHO], how: 'Refogue cebola e alho, junte a carne, depois a cenoura e a abobrinha em cubos. Cozinhe até os legumes amaciarem.', kid: 'Ótima opção para ela: carne moída e legumes macios. ' + CUT },
  { id: 'b:omelete-salada', name: 'Arroz, feijão, omelete e salada', meals: ['almoco', 'jantar'], time: 20, ing: [ARROZ, FEIJAO, OVOS(2), TOMATE, ALFACE, I('Queijo muçarela', 20, 'g', 'frios')], how: 'Bata os ovos com tomate picado e queijo e faça a omelete em fogo baixo.', kid: 'Omelete bem passada, em tiras. ' + CUT },
  { id: 'b:bolonhesa', box: 'Leve o macarrão já misturado ao molho; a salada em pote separado.', name: 'Macarrão à bolonhesa e salada', meals: ['almoco', 'jantar'], time: 30, ing: [I('Macarrão', 80, 'g', 'mercearia'), I('Carne moída (patinho)', 100, 'g', 'acougue'), I('Molho de tomate', 80, 'g', 'mercearia'), ALFACE, CEBOLA, ALHO], how: 'Refogue a carne com cebola e alho, junte o molho e cozinhe 10 min. Sirva com o macarrão.', kid: 'Macarrão de formato pequeno ou cortado.' },
  { id: 'b:peixe-batata', box: 'Na marmita, aqueça por menos tempo para o peixe não ressecar.', name: 'Peixe assado com batata e brócolis', meals: ['almoco', 'jantar'], time: 40, ing: [I('Filé de tilápia', 150, 'g', 'acougue'), I('Batata', 150, 'g', 'hortifruti'), I('Brócolis', 80, 'g', 'hortifruti'), I('Limão', 0.5, 'un', 'hortifruti'), ALHO], how: 'Tempere o peixe com limão, alho e sal. Asse com a batata em rodelas por 25 min a 200 °C. Cozinhe o brócolis no vapor.', kid: 'Confira bem as espinhas. Peixe desfiado, batata amassada.' },
  { id: 'b:frango-pure', name: 'Frango ao molho com purê de batata', meals: ['almoco', 'jantar'], time: 35, ing: [I('Peito de frango', 120, 'g', 'acougue'), I('Molho de tomate', 50, 'g', 'mercearia'), I('Batata', 150, 'g', 'hortifruti'), I('Leite', 30, 'ml', 'frios'), I('Manteiga', 5, 'g', 'frios'), CEBOLA, ALHO], how: 'Cozinhe o frango em cubos no molho com cebola e alho. Para o purê, amasse a batata cozida com leite e manteiga.', kid: 'Purê é perfeito para ela. Frango desfiado no molho.' },
  { id: 'b:escondidinho', name: 'Escondidinho de mandioca com carne', meals: ['almoco', 'jantar'], time: 50, ing: [I('Mandioca', 200, 'g', 'hortifruti'), I('Carne moída (patinho)', 100, 'g', 'acougue'), I('Queijo muçarela', 20, 'g', 'frios'), I('Leite', 30, 'ml', 'frios'), CEBOLA, ALHO], how: 'Cozinhe e amasse a mandioca com o leite. Refogue a carne. Monte em camadas, cubra com queijo e leve ao forno até gratinar.', kid: 'Macio e fácil de comer. ' + CUT },
  { id: 'b:sopa', name: 'Sopa de legumes com frango', meals: ['jantar'], noBox: true, time: 40, ing: [I('Peito de frango', 80, 'g', 'acougue'), I('Batata', 100, 'g', 'hortifruti'), I('Cenoura', 60, 'g', 'hortifruti'), I('Abobrinha', 60, 'g', 'hortifruti'), I('Macarrão', 20, 'g', 'mercearia'), CEBOLA, ALHO], how: 'Refogue cebola e alho, junte o frango em cubos, os legumes e água. Cozinhe 25 min e acrescente o macarrão no fim.', kid: 'Sirva morna, com legumes amassados com o garfo.' },
  { id: 'b:strogonoff', box: 'Separe a porção da marmita antes de pôr o creme de leite, e acrescente na hora de servir.', name: 'Strogonoff de frango, arroz e salada', meals: ['almoco', 'jantar'], time: 30, ing: [ARROZ, I('Peito de frango', 120, 'g', 'acougue'), I('Creme de leite', 30, 'g', 'frios'), I('Molho de tomate', 40, 'g', 'mercearia'), ALFACE, CEBOLA, ALHO], how: 'Doure o frango em cubos com cebola e alho, junte o molho e, no fim, o creme de leite (sem ferver).', kid: 'Frango bem picadinho.' },
  { id: 'b:bife-legumes', name: 'Arroz, feijão, bife acebolado e legumes', meals: ['almoco'], time: 30, ing: [ARROZ, FEIJAO, I('Bife (patinho)', 120, 'g', 'acougue'), I('Cebola', 40, 'g', 'hortifruti'), I('Cenoura', 50, 'g', 'hortifruti'), I('Brócolis', 60, 'g', 'hortifruti')], how: 'Grelhe os bifes e doure a cebola em rodelas. Cozinhe cenoura e brócolis no vapor.', kid: 'Bife é difícil de mastigar: ofereça carne moída ou desfiada. ' + CUT },
  { id: 'b:panqueca', name: 'Panqueca de carne e salada', meals: ['jantar'], time: 40, ing: [I('Farinha de trigo', 40, 'g', 'mercearia'), I('Leite', 80, 'ml', 'frios'), OVOS(0.5), I('Carne moída (patinho)', 80, 'g', 'acougue'), I('Molho de tomate', 50, 'g', 'mercearia'), ALFACE, CEBOLA], how: 'Bata farinha, leite e ovo e faça os discos. Recheie com a carne refogada, enrole e cubra com o molho.', kid: 'Meia panqueca cortada em pedaços.' },
  { id: 'b:omelete-forno', name: 'Omelete de forno com legumes', meals: ['jantar'], time: 30, ing: [OVOS(2), TOMATE, I('Cenoura', 30, 'g', 'hortifruti'), I('Queijo muçarela', 20, 'g', 'frios'), ALFACE], how: 'Bata os ovos com os legumes ralados e o queijo e asse por 20 min a 180 °C. Sirva com salada.', kid: 'Fatias pequenas e macias.' },
  { id: 'b:frango-abobora', name: 'Arroz, feijão, frango desfiado e abóbora', meals: ['almoco', 'jantar'], time: 35, ing: [ARROZ, FEIJAO, I('Peito de frango', 100, 'g', 'acougue'), I('Abóbora', 100, 'g', 'hortifruti'), CEBOLA, ALHO], how: 'Cozinhe e desfie o frango, refogue com cebola e alho. Abóbora em cubos cozida ou assada.', kid: 'Abóbora amassada e frango desfiado: ela costuma adorar.' },
  { id: 'b:baiao', name: 'Baião de dois e salada', meals: ['almoco'], time: 40, ing: [ARROZ, I('Feijão-de-corda', 40, 'g', 'mercearia'), I('Queijo coalho', 40, 'g', 'frios'), ALFACE, TOMATE, CEBOLA, ALHO], how: 'Cozinhe o feijão, junte o arroz refogado com cebola e alho e termine com o queijo coalho em cubos.', kid: 'Queijo coalho em pedacinhos pequenos (é borrachudo).' }
];
export const SPECIAL = { sobras: { id: 'sobras', name: 'Sobras do almoço', emoji: '♻️', ing: [], hint: 'O almoço deste dia já é calculado em dobro.' }, fora: { id: 'fora', name: 'Livre ou comer fora', emoji: '🍕', ing: [] } };

// Pessoas da casa: porção relativa e refeições feitas com comida de casa.
// meals = segunda a sexta, weekend = sábado e domingo. lunchbox = o almoço vai de marmita (cozinhado em casa).
const ALL = ['cafe', 'almoco', 'lanche', 'jantar'];
export const DEFAULT_FAMILY = [
  { id: 'day', name: 'Day', portion: 1, meals: ['cafe', 'almoco', 'jantar'], weekend: ALL, lunchbox: true },
  { id: 'marido', name: 'Roger', portion: 1, meals: ['cafe', 'almoco', 'jantar'], weekend: ALL, lunchbox: true },
  { id: 'irma', name: 'Manu', portion: 1, meals: ALL, weekend: ALL },
  { id: 'olivia', name: 'Olivia', portion: 0.5, meals: ['jantar'], weekend: ALL, kid: true }
];
export const isWeekend = day => day >= 5; // índice 0 = segunda
export const mealsOf = (p, day) => (isWeekend(day) ? (p.weekend || ALL) : p.meals);
export const eatsAt = (p, meal, day) => mealsOf(p, day).includes(meal);
// Quantas marmitas sair do almoço do dia (só em dias úteis)
export const lunchboxes = (family, day) => isWeekend(day) ? [] : family.filter(p => p.lunchbox && eatsAt(p, 'almoco', day));
export const PORTIONS = [[0.5, 'Criança pequena'], [0.75, 'Criança maior'], [1, 'Adulto'], [1.25, 'Come bastante']];
export const whoEats = (family, meal, day = 0) => family.filter(p => eatsAt(p, meal, day));
export const servingsFor = (family, meal, day = 0) => whoEats(family, meal, day).reduce((a, p) => a + p.portion, 0);
export const kidEats = (family, meal, day = 0) => family.some(p => p.kid && eatsAt(p, meal, day));

// Semana sugerida: variada, sem repetir o mesmo prato no mesmo dia; domingo à noite livre
export function suggestWeek(seed = 0, all = RECIPES, family = DEFAULT_FAMILY) {
  const by = m => all.filter(r => r.meals.includes(m));
  const pick = (list, i) => list[(i + seed) % list.length].id;
  const slots = {};
  const lunch = by('almoco'), dinner = by('jantar'), cafe = by('cafe'), lanche = by('lanche');
  // escolhe o primeiro da sequência que ainda não apareceu no mesmo dia
  const pickNew = (list, i, used) => { for (let k = 0; k < list.length; k++) { const id = pick(list, i + k); if (!used.includes(id)) return id; } return pick(list, i); };
  for (let d = 0; d < 7; d++) {
    const used = [];
    used.push(slots[`${d}-cafe`] = pickNew(cafe, d, used));
    used.push(slots[`${d}-lanche`] = pickNew(lanche, d * 2, used));
    const boxDay = lunchboxes(family, d).length > 0;
    used.push(slots[`${d}-almoco`] = pickNew(boxDay ? lunch.filter(r => !r.noBox) : lunch, d * 3, used));
    const j = pickNew(dinner, d * 3 + 5, used);
    slots[`${d}-jantar`] = d === 6 ? 'fora' : d === 2 || d === 4 ? 'sobras' : j; // sobras do almoço economizam tempo
  }
  return slots;
}

// Lista de compras da semana: soma ingredientes × porções de quem come em casa
const FMT = { g: [1000, 'kg'], ml: [1000, 'L'] };
export function shoppingFromPlan(slots, family, recipesById) {
  const acc = {};
  for (const [key, rid] of Object.entries(slots || {})) {
    const [day, meal] = key.split('-'); const r = recipesById[rid]; if (!r?.ing?.length) continue;
    const who = m => [family.filter(p => !p.kid && eatsAt(p, m, +day)).reduce((a, p) => a + p.portion, 0), family.filter(p => p.kid && eatsAt(p, m, +day)).reduce((a, p) => a + p.portion, 0)];
    let [adults, kids] = who(meal);
    // Jantar de sobras: o almoço do dia é feito também para quem janta
    if (meal === 'almoco' && slots[`${day}-jantar`] === 'sobras') { const [a2, k2] = who('jantar'); adults += a2; kids += k2; }
    const add = (list, mult) => list.forEach(i => { const k = i.name + '|' + i.u; acc[k] = acc[k] || { ...i, total: 0 }; acc[k].total += i.q * mult; });
    add(r.ing, adults);
    if (kids) add(r.kidSwap || r.ing, kids); // ex.: pipoca vira banana para a Olivia
  }
  return Object.values(acc).map(i => ({ ...i, qty: fmtQty(i.total, i.u) })).sort((a, b) => a.sec.localeCompare(b.sec) || a.name.localeCompare(b.name));
}
export function fmtQty(n, u) {
  if (u === 'un' || u === 'fatias') { const k = Math.ceil(n - 0.01); return `${k} ${u === 'un' ? (k === 1 ? 'unidade' : 'unidades') : 'fatias'}`; }
  const [lim, big] = FMT[u] || [];
  if (big && n >= lim - 0.5) return `${(Math.ceil(n / lim * 10) / 10).toLocaleString('pt-BR')} ${big}`;
  const step = n > 200 ? 50 : 10; return `${Math.ceil(n / step) * step} ${u}`;
}
