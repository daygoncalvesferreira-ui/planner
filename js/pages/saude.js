// Central de saúde + cartão "Saúde de hoje" na tela Hoje
import { html } from '../lib/preact-htm.js';
import { useList, useRecord } from '../store/hooks.js';
import { Section } from '../components/ui.js';
import { nextDay, weekStart } from './treino.js';
import { WaterRow, foodScore } from './alimentacao.js';
import { examsDue, DEFAULT_PEOPLE } from './exames.js';
import { FOOD_CHECKS } from '../lib/fitness.js';
import { MenuToday } from './cardapio.js';
import { fromISO } from '../lib/date.js';

export function HealthToday({ date, settings }) {
  const plan = useRecord('workoutPlans', 'active');
  const logs = useList('workoutLogs', () => true, []);
  const food = useRecord('foodLogs', date);
  const exams = useList('exams', () => true, []);
  if (plan === undefined || !logs || food === undefined || !exams) return null;
  const goal = settings?.waterGoal || 8;
  const done = logs.find(l => l.date === date && l.done);
  const isDay = plan?.weekdays?.includes(fromISO(date).getDay());
  const due = examsDue(exams, date);
  const people = settings?.people || DEFAULT_PEOPLE;
  return html`<${Section} title="Saúde de hoje" icon=${html`<span aria-hidden="true">💪</span>`} tone="teal" action=${html`<a class="link" href="#/saude">Ver tudo</a>`}>
    <a class="health-line" href="#/treino"><span>🏋️</span><div><b>${!plan ? 'Monte sua ficha de treino' : done ? 'Treino feito ✓' : isDay ? `Treino: ${nextDay(plan, logs).name}` : 'Dia de descanso'}</b>
      <small>${!plan ? 'Leva 1 minuto' : done ? 'Hábito Exercício marcado' : isDay ? 'Toque para começar' : 'Recuperar também faz parte'}</small></div></a>
    <${MenuToday} date=${date} />
    <a class="health-line" href="#/alimentacao"><span>🥗</span><div><b>Alimentação: ${foodScore(food)} de ${FOOD_CHECKS.length} hábitos</b><small>Toque para marcar</small></div></a>
    <${WaterRow} date=${date} log=${food} goal=${goal} />
    ${due.length > 0 && html`<a class="health-line warn" href="#/exames"><span>🩺</span><div><b>${due.length} ${due.length === 1 ? 'exame ou consulta precisa' : 'exames ou consultas precisam'} de atenção</b>
      <small>${due.slice(0, 2).map(e => `${e.name.split(' (')[0]} (${(people.find(p => p.id === e.person) || { name: '' }).name})`).join(', ')}</small></div></a>`}
  <//>`;
}

export function Saude({ date, settings }) {
  const logs = useList('workoutLogs', l => l.done, []);
  const exams = useList('exams', () => true, []);
  const measures = useList('measures', () => true, []);
  if (!logs || !exams || !measures) return null;
  const week = logs.filter(l => l.date >= weekStart(date)).length;
  const due = examsDue(exams, date).length;
  const T = (href, e, n, d, badge) => html`<a class="tile" href=${href}><span class="tile-em" aria-hidden="true">${e}</span><strong>${n}</strong><span>${d}</span>${badge ? html`<b class="tile-count">${badge}</b>` : ''}</a>`;
  return html`<h1 class="page-title">Saúde</h1>
    <p class="soon">Treino, alimentação, medidas e exames num só lugar, rumo ao shape slim e a uma rotina saudável para a família.</p>
    <div class="tiles">
      ${T('#/cardapio', '🍽️', 'Cardápio da família', 'Semana e lista do mercado')}
      ${T('#/treino', '🏋️', 'Treino', 'Ficha slim e treino do dia', week ? `${week} na semana` : '')}
      ${T('#/alimentacao', '🥗', 'Alimentação', 'Hábitos do dia e água')}
      ${T('#/medidas', '📏', 'Medidas', 'Peso e centímetros', measures.length || '')}
      ${T('#/exames', '🩺', 'Exames e consultas', 'Seus e da Olivia', due ? `${due} pendente${due > 1 ? 's' : ''}` : '')}
    </div>
    <${Section} title="Como as peças se encaixam" tone="teal" hint="Treino de força 3x por semana + cardio + 4 ou 5 hábitos de alimentação na maioria dos dias. Meça a cada 2 a 4 semanas: a cintura costuma mudar antes do peso." />`;
}
