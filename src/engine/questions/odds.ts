import type { Question } from '../types';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import { lab, labn } from '../label';

/** "N of M cards help you. What percent is that?" — rounded to the nearest whole percent. */
export function oddsQuestion(n: number, m: number, prompt?: string): Question {
  const pct = Math.round((100 * n) / m);
  const N = labn(n, 'helpful card', 'helpful cards'); const M = lab(m, 'unseen cards'); const D = lab((n / m).toFixed(3), 'chance as a decimal');
  const near = Math.round(m / 10) * 10;
  return {
    id: nextQuestionId('odds'), masterySkillId: 'prob.outs', topic: 'Probability', subtopic: 'Outs', difficulty: 3, mode: 'applied',
    prompt: prompt ?? `${n} of the ${m} unseen cards would improve your hand.`, expression: `What percent of the deck helps you?`, answer: pct, acceptable: [pct - 1, pct + 1].filter((x) => x >= 0 && x <= 100), unit: '%',
    hint: `${N} ÷ ${M}, then × 100. Estimate: ${m} is about ${near}, so ${n} of them is roughly ${lab(`${Math.round((100 * n) / near)}%`, 'rough chance')}.`,
    solutionSteps: [`${N} ÷ ${M} = ${D}.`, `${D} × 100 ≈ ${lab(`${pct}%`, 'chance to improve')}.`],
    explanation: [`A chance is the helpful cards divided by all the cards that could come: ${N} ÷ ${M}.`, `${N} ÷ ${M} = ${D}, which is about ${lab(`${pct}%`, 'chance to improve')}.`, `Rule of thumb: each helpful card in a deck of ~50 is worth about 2%.`],
    visual: { type: 'none' }, prerequisites: ['div', 'percent'],
    engineeringApplication: 'Engineers estimate the chance of failure the same way: the cases that break it, divided by all the cases.',
  };
}

/** Odds generator for lessons: N of M unseen cards help. */
export const genOdds: Generator = (skillId, _p, ctx) => {
  const m = ctx.rng.pick([50, 49, 48, 47]); const n = ctx.difficulty <= 2 ? ctx.rng.pick([2, 3, 4, 5, 6, 8, 9, 12]) : ctx.rng.int(1, 20);
  const q = oddsQuestion(n, m); return { ...q, masterySkillId: skillId };
};
