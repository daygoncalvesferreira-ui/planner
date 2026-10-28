// Modelos de treino, checklist de alimentação e exames de rotina sugeridos.
// São pontos de partida gerais: ajuste com educador físico, nutricionista e médicos.

const ex = (name, sets, reps, rest = 60, tip = '') => ({ name, sets, reps, rest, tip });
export const TEMPLATES = {
  academia: { name: 'Academia · Slim 3x', desc: 'Foco em pernas e glúteos, superiores para definir e cardio no fim. Treinos A, B e C em rodízio.', days: [
    { id: 'A', name: 'A · Pernas e glúteos', cardio: '20 min de esteira inclinada ou bike', exercises: [
      ex('Agachamento (livre ou no smith)', 3, '12', 90, 'Desça até a coxa ficar paralela ao chão, joelhos na direção dos pés.'),
      ex('Leg press 45°', 3, '12', 90), ex('Cadeira extensora', 3, '15'),
      ex('Elevação pélvica', 4, '12', 90, 'Segure 1 segundo no alto contraindo o glúteo.'),
      ex('Cadeira abdutora', 3, '15'), ex('Panturrilha em pé', 3, '15', 45)] },
    { id: 'B', name: 'B · Superiores e abdômen', cardio: '20 min de elíptico ou escada', exercises: [
      ex('Puxada frontal', 3, '12'), ex('Remada baixa', 3, '12'), ex('Supino reto com halteres', 3, '12'),
      ex('Desenvolvimento com halteres', 3, '12'), ex('Elevação lateral', 3, '15', 45), ex('Tríceps na polia', 3, '12', 45),
      ex('Prancha', 3, '30 s', 45, 'Quadril alinhado, abdômen contraído.'), ex('Abdominal infra', 3, '15', 45)] },
    { id: 'C', name: 'C · Posterior e glúteos', cardio: '20 min de esteira (caminhada rápida)', exercises: [
      ex('Stiff', 3, '12', 90, 'Costas retas, desça até sentir alongar atrás da coxa.'), ex('Mesa flexora', 3, '12'),
      ex('Afundo (passada)', 3, '10 cada perna', 90), ex('Glúteo na polia (coice)', 3, '12 cada perna'),
      ex('Cadeira abdutora', 3, '15'), ex('Ponte unilateral', 3, '12 cada perna', 45)] }
  ] },
  casa: { name: 'Em casa · Slim 3x', desc: 'Com peso do corpo, um par de halteres e um elástico. Treinos A, B e C em rodízio.', days: [
    { id: 'A', name: 'A · Pernas e glúteos', cardio: '10 min de polichinelo e corrida parada, em blocos', exercises: [
      ex('Agachamento com halter (goblet)', 3, '15'), ex('Afundo', 3, '12 cada perna'), ex('Elevação pélvica', 4, '15'),
      ex('Abdução com elástico', 3, '20', 45), ex('Panturrilha', 3, '20', 45), ex('Polichinelo', 3, '40 s', 30)] },
    { id: 'B', name: 'B · Superiores e abdômen', cardio: '10 min de corda ou corrida parada', exercises: [
      ex('Flexão (joelhos apoiados)', 3, '10'), ex('Remada curvada com halteres', 3, '12'), ex('Desenvolvimento com halteres', 3, '12'),
      ex('Elevação lateral', 3, '12', 45), ex('Tríceps no banco', 3, '12', 45), ex('Prancha', 3, '30 s', 45), ex('Abdominal bicicleta', 3, '20', 45)] },
    { id: 'C', name: 'C · Posterior e glúteos', cardio: '10 min de escalador e polichinelo', exercises: [
      ex('Stiff com halteres', 3, '12'), ex('Agachamento sumô', 3, '15'), ex('Coice com elástico', 3, '15 cada perna'),
      ex('Ponte unilateral', 3, '12 cada perna', 45), ex('Afundo reverso', 3, '10 cada perna'), ex('Escalador (mountain climber)', 3, '30 s', 30)] }
  ] }
};
export const WEEKDAYS = [[1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [0, 'Dom']];

// Alimentação: hábitos simples, sem contar calorias
export const FOOD_CHECKS = [
  ['proteina', '🍗', 'Proteína nas refeições principais', 'Ovo, frango, peixe, carne, feijão, iogurte'],
  ['verduras', '🥗', 'Verduras ou legumes no almoço e no jantar', 'Metade do prato'],
  ['frutas', '🍎', '2 frutas no dia', 'Boas no lanche ou de sobremesa'],
  ['doces', '🍫', 'Doce e refrigerante com moderação', 'Um pedaço não estraga o dia'],
  ['horarios', '⏰', 'Comi nos horários, sem pular refeição', 'Evita a fome que leva a exageros']
];
export const MEALS = [['cafe', '☕ Café da manhã'], ['almoco', '🍽️ Almoço'], ['lanche', '🍌 Lanche'], ['jantar', '🌙 Jantar']];
export const MEASURES = [['peso', 'Peso', 'kg'], ['cintura', 'Cintura', 'cm'], ['abdomen', 'Abdômen', 'cm'], ['quadril', 'Quadril', 'cm'], ['coxa', 'Coxa', 'cm'], ['braco', 'Braço', 'cm']];

// Exames e consultas de rotina sugeridos (periodicidade em meses). Confirme com o médico de cada uma.
export const ROUTINE = {
  adulta: [
    ['Check-up com clínico geral', 'consulta', 12, 'Clínico geral'], ['Exames de sangue (hemograma, glicemia, colesterol, tireoide, vitamina D)', 'exame', 12, 'Clínico geral'],
    ['Consulta ginecológica + preventivo', 'consulta', 12, 'Ginecologista'], ['Dentista (limpeza)', 'consulta', 6, 'Dentista'],
    ['Oftalmologista', 'consulta', 12, 'Oftalmologista'], ['Dermatologista (pintas e pele)', 'consulta', 12, 'Dermatologista']
  ],
  crianca: [
    ['Consulta com pediatra', 'consulta', 6, 'Pediatra'], ['Dentista (limpeza e flúor)', 'consulta', 6, 'Odontopediatra'],
    ['Oftalmologista', 'consulta', 12, 'Oftalmologista'], ['Conferir caderneta de vacinação', 'vacina', 12, 'Pediatra'],
    ['Exames de sangue de rotina (se o pediatra pedir)', 'exame', 12, 'Pediatra']
  ]
};
export const addMonths = (iso, m) => { const [y, mo, d] = iso.split('-').map(Number); const dt = new Date(y, mo - 1 + m, d); const p = n => String(n).padStart(2, '0'); return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`; };
