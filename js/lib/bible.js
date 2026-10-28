// Plano de leitura bíblica: só referências (livro e capítulo), sem texto bíblico.
const AT = 'Gênesis 50|Êxodo 40|Levítico 27|Números 36|Deuteronômio 34|Josué 24|Juízes 21|Rute 4|1 Samuel 31|2 Samuel 24|1 Reis 22|2 Reis 25|1 Crônicas 29|2 Crônicas 36|Esdras 10|Neemias 13|Ester 10|Jó 42|Salmos 150|Provérbios 31|Eclesiastes 12|Cânticos 8|Isaías 66|Jeremias 52|Lamentações 5|Ezequiel 48|Daniel 12|Oséias 14|Joel 3|Amós 9|Obadias 1|Jonas 4|Miquéias 7|Naum 3|Habacuque 3|Sofonias 3|Ageu 2|Zacarias 14|Malaquias 4';
const NT = 'Mateus 28|Marcos 16|Lucas 24|João 21|Atos 28|Romanos 16|1 Coríntios 16|2 Coríntios 13|Gálatas 6|Efésios 6|Filipenses 4|Colossenses 4|1 Tessalonicenses 5|2 Tessalonicenses 3|1 Timóteo 6|2 Timóteo 4|Tito 3|Filemom 1|Hebreus 13|Tiago 5|1 Pedro 5|2 Pedro 3|1 João 5|2 João 1|3 João 1|Judas 1|Apocalipse 22';
const books = s => s.split('|').map(x => { const i = x.lastIndexOf(' '); return [x.slice(0, i), +x.slice(i + 1)]; });
export const OLD = books(AT), NEW = books(NT);
const chapters = list => list.flatMap(([b, n]) => Array.from({ length: n }, (_, i) => [b, i + 1]));
const range = (list, from, to) => { const i = list.findIndex(b => b[0] === from), j = list.findIndex(b => b[0] === to); return list.slice(i, j + 1); };

// Cada escopo tem uma ou mais "trilhas" lidas em paralelo, divididas igualmente pelos dias
export const SCOPES = {
  paralelo: { name: 'Bíblia toda: Antigo e Novo juntos', desc: 'Todo dia um trecho de cada Testamento. Bom para não ficar meses só no Antigo.', tracks: () => [chapters(OLD), chapters(NEW)] },
  biblia: { name: 'Bíblia toda, de Gênesis a Apocalipse', desc: 'Leitura na ordem dos livros.', tracks: () => [chapters([...OLD, ...NEW])] },
  nt: { name: 'Novo Testamento', desc: 'De Mateus a Apocalipse.', tracks: () => [chapters(NEW)] },
  at: { name: 'Antigo Testamento', desc: 'De Gênesis a Malaquias.', tracks: () => [chapters(OLD)] },
  evangelhos: { name: 'Evangelhos e Atos', desc: 'A vida de Jesus e o início da igreja.', tracks: () => [chapters(range(NEW, 'Mateus', 'Atos'))] },
  sabedoria: { name: 'Salmos e Provérbios', desc: 'Leituras curtas, boas para começar o hábito.', tracks: () => [chapters(range(OLD, 'Salmos', 'Provérbios'))] }
};
export const DURATIONS = [[30, '1 mês'], [90, '3 meses'], [180, '6 meses'], [365, '1 ano']];

export function totalChapters(scope) { return SCOPES[scope].tracks().reduce((a, t) => a + t.length, 0); }

// Leitura do dia (0 = primeiro dia): trechos de cada trilha
export function reading(plan, day) {
  return SCOPES[plan.scope].tracks().flatMap(t => {
    const a = Math.floor(day * t.length / plan.days), b = Math.floor((day + 1) * t.length / plan.days);
    return t.slice(a, b);
  });
}

// [[Gênesis,1],[Gênesis,2],[Êxodo,1]] → "Gênesis 1–2 · Êxodo 1"
export function format(chs) {
  if (!chs.length) return 'Dia livre (revise ou recupere leituras)';
  const out = [];
  for (const [b, c] of chs) {
    const last = out[out.length - 1];
    if (last && last.b === b && last.to === c - 1) last.to = c; else out.push({ b, from: c, to: c });
  }
  return out.map(g => g.b + ' ' + (g.from === g.to ? g.from : `${g.from}–${g.to}`)).join(' · ');
}

const dayMs = 864e5;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const dayIndex = (plan, today) => Math.round((parse(today) - parse(plan.start)) / dayMs);
export const nextUndone = plan => { const done = new Set(plan.done); for (let i = 0; i < plan.days; i++) if (!done.has(i)) return i; return -1; };
export function status(plan, today) {
  const idx = Math.min(dayIndex(plan, today), plan.days - 1);
  const done = new Set(plan.done);
  let behind = 0; for (let i = 0; i <= idx; i++) if (!done.has(i)) behind++;
  // Hoje conta como "em dia" se a única pendente é a de hoje
  const todayPending = idx >= 0 && !done.has(idx);
  return { idx, behind: Math.max(0, behind - (todayPending ? 1 : 0)), next: nextUndone(plan), finished: plan.done.length >= plan.days };
}

// Links para o YouVersion (bible.com). Abre o app de Bíblia se estiver instalado.
const CODES = ('GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL ' +
  'MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV').split(' ');
const CODE = Object.fromEntries([...OLD, ...NEW].map(([b], i) => [b, CODES[i]]));
export const VERSIONS = [['NVI', 129, 'Nova Versão Internacional'], ['NAA', 1840, 'Nova Almeida Atualizada'], ['ARC', 212, 'Almeida Revista e Corrigida'], ['NVT', 1930, 'Nova Versão Transformadora']];
export const chapterUrl = (book, ch, v = 'NVI') => { const [abbr, id] = VERSIONS.find(x => x[0] === v) || VERSIONS[0]; return `https://www.bible.com/bible/${id}/${CODE[book]}.${ch}.${abbr}`; };
// Um link por trecho: abre no primeiro capítulo, e no app é só avançar
export function links(chs, v) {
  const out = [];
  for (const [b, c] of chs) { const last = out[out.length - 1]; if (last && last.b === b && last.to === c - 1) last.to = c; else out.push({ b, from: c, to: c }); }
  return out.map(g => ({ label: g.b + ' ' + (g.from === g.to ? g.from : `${g.from}–${g.to}`), url: chapterUrl(g.b, g.from, v) }));
}
