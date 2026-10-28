// Versão do banco local. Para adicionar coleções: suba DB_VERSION e acrescente em STORES.
export const DB_NAME = 'planner';
export const DB_VERSION = 7;
export const STORES = [
  'settings', 'tasks', 'events', 'dayPlans', 'habits', 'habitLogs',
  'transactions', 'bills', 'goals', 'notes', 'reviews',
  'shoppingLists', 'shoppingItems', 'shoppingCatalog', // v2: lista de compras
  'biblePlans', 'cycleLogs', // v3: leitura bíblica e ciclo
  // v4: vida e memórias
  'media', 'wheels', 'moments', 'years', 'wins', 'memories', 'specialDates', 'dateIdeas', 'dreams', 'prayers',
  // v5: saúde
  'workoutPlans', 'workoutLogs', 'foodLogs', 'measures', 'exams',
  // v6: objetivos financeiros (mesmo modelo de metas da Área Financeira do Cliente)
  'finGoals', 'finMonths',
  // v7: cardápio da família
  'mealPlans', 'recipes'
];

// Nunca compartilhar com o casal nem enviar à nuvem sem pedido explícito (dados de saúde)
export const ALWAYS_PRIVATE = ['cycleLogs', 'measures', 'foodLogs', 'exams', 'workoutLogs'];

// Áreas: base de cores e filtros em todo o app
export const AREAS = {
  eu: 'Eu', saude: 'Saúde', autocuidado: 'Autocuidado', casamento: 'Casamento',
  filha: 'Filha', casa: 'Casa', trabalho: 'Trabalho', carreira: 'Carreira',
  estudos: 'Estudos', espiritual: 'Espiritual', financeiro: 'Financeiro'
};

// Padrão de visibilidade quando o app ficar compartilhado (Fase 2)
export const SHARED_AREAS = ['casamento', 'filha', 'casa', 'financeiro', 'compras'];

// Áreas avaliadas na Roda da Vida (id, nome, emoji, cor)
export const WHEEL_AREAS = [
  ['saude', 'Saúde', '💪', '#22A37F'], ['autocuidado', 'Autocuidado', '🧴', '#E57BA6'], ['casamento', 'Casamento', '❤️', '#D6457F'],
  ['filha', 'Filha', '👧', '#F08A5D'], ['casa', 'Casa', '🏠', '#A08A6A'], ['financeiro', 'Finanças', '💰', '#2F9E6E'],
  ['trabalho', 'Trabalho', '💼', '#3B82D6'], ['carreira', 'Carreira', '🚀', '#6C63D9'], ['estudos', 'Estudos', '📚', '#139C94'],
  ['espiritual', 'Espiritual', '🙏', '#D9A21C'], ['lazer', 'Lazer', '🎈', '#9B7CF0'], ['amizades', 'Amizades', '🤝', '#E0794B']
];

export const DEFAULT_HABITS = [
  ['Água', 'saude'], ['Exercício', 'saude'], ['Bíblia/devocional', 'espiritual'],
  ['Skincare', 'autocuidado'], ['Organização da casa', 'casa'], ['Alimentação', 'saude'],
  ['Tempo com marido', 'casamento'], ['Tempo com filha', 'filha'], ['Estudos', 'estudos']
];
