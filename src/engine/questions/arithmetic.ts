import type { Question } from '../types';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import { lab } from '../label';

export const genAdd: Generator = (skillId, _params, ctx) => {
  const d = ctx.difficulty;
  const max = d <= 1 ? 10 : d === 2 ? 20 : d === 3 ? 50 : d === 4 ? 100 : 500;
  const a = ctx.rng.int(1, max);
  const b = ctx.rng.int(1, max);
  const answer = a + b;
  const tens = Math.floor(b / 10) * 10;
  const ones = b - tens;
  const q: Question = {
    id: nextQuestionId('add'),
    masterySkillId: skillId,
    topic: 'Addition', subtopic: 'Whole numbers', difficulty: d, mode: 'pure',
    prompt: `Compute ${a} + ${b}.`,
    expression: `${a} + ${b} = ?`,
    answer,
    hint: b >= 10 ? `Split ${b} into ${lab(tens, 'tens part')} + ${lab(ones, 'ones part')}. Add the tens first: ${a} + ${tens} = ${lab(a + tens, 'running total')}, then add the ${ones}.` : `Count on from ${a} by ${b}.`,
    solutionSteps: b >= 10 ? [`${a} + ${lab(tens, 'tens part')} = ${lab(a + tens, 'running total')}`, `${lab(a + tens, 'running total')} + ${lab(ones, 'ones part')} = ${lab(answer, 'sum')}`] : [`${a} + ${b} = ${answer}`],
    explanation: [
      'Addition combines two quantities into one total.',
      b >= 10 ? `Break ${lab(b, 'the number we split')} into ${lab(tens, 'tens part')} + ${lab(ones, 'ones part')}. Add the tens, then the ones: ${a} + ${tens} = ${lab(a + tens, 'running total')}; ${a + tens} + ${ones} = ${lab(answer, 'sum')}.` : `Start at ${a} on the number line and move ${b} steps right: you land on ${answer}.`,
      `${a} + ${b} = ${answer}.`,
    ],
    visual: { type: 'numberline', step: b, count: 1, max: answer },
    prerequisites: [],
    engineeringApplication: 'Totals: combined flows, summed forces, stacked lengths.',
  };
  return q;
};

export const genSub: Generator = (skillId, _params, ctx) => {
  const d = ctx.difficulty;
  const max = d <= 1 ? 10 : d === 2 ? 20 : d === 3 ? 50 : d === 4 ? 100 : 500;
  const a = ctx.rng.int(2, max);
  const b = ctx.rng.int(1, a);
  const answer = a - b;
  return {
    id: nextQuestionId('sub'),
    masterySkillId: skillId,
    topic: 'Subtraction', subtopic: 'Whole numbers', difficulty: d, mode: 'pure',
    prompt: `Compute ${a} − ${b}.`,
    expression: `${a} − ${b} = ?`,
    answer,
    hint: `Think: ${b} + ? = ${a}. Or count back from ${a}.`,
    solutionSteps: [`${b} + ${lab(answer, 'missing part')} = ${a}`, `So ${a} − ${b} = ${lab(answer, 'difference')}`],
    explanation: [
      'Subtraction finds a difference: how far apart two numbers are, or what remains after removing.',
      `Start at ${a} and move ${b} steps left on the number line: you land on ${answer}.`,
      `Check with addition: ${answer} + ${b} = ${a}. ✓`,
    ],
    visual: { type: 'numberline', step: b, count: 1, max: a },
    prerequisites: ['add.basic'],
    engineeringApplication: 'Differences: pressure drop across a pipe, temperature change, remaining stock.',
  };
};
