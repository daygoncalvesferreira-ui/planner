// Marca automaticamente um hábito do dia a partir de outra tela (treino, água, alimentação, Bíblia)
import { list, save, remove } from '../store/repo.js';
export async function markHabit(pattern, date, on = true) {
  const h = (await list('habits', x => x.active && pattern.test(x.name)))[0];
  if (!h) return;
  const id = `${h.id}_${date}`;
  on ? await save('habitLogs', { id, habitId: h.id, date, value: 1 }) : await remove('habitLogs', id);
}
