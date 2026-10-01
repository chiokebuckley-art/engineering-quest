import type { Question } from '../types';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import type { Rng } from '../rng';

/**
 * Pre-algebra: one-step equations and evaluating expressions.
 * Every question keeps the "balance" idea: do the same thing to both sides.
 */
export type OneStepKind = 'add' | 'sub' | 'mul' | 'div';

export function oneStepQuestion(kind: OneStepKind, x: number, k: number, rng?: Rng): Question {
  const letter = rng ? rng.pick(['x', 'n', 'y', 'm']) : 'x';
  let expression = ''; let steps: string[] = []; let hint = ''; let explanation: string[] = [];
  const flip = rng ? rng.chance(0.3) : false; // sometimes write the number first
  if (kind === 'add') {
    const b = x + k;
    expression = flip ? `${k} + ${letter} = ${b}` : `${letter} + ${k} = ${b}`;
    hint = `Take ${k} away from both sides.`;
    steps = [`${letter} + ${k} = ${b}`, `${letter} = ${b} − ${k}`, `${letter} = ${x}`];
    explanation = [`${letter} is a number we don't know yet. The equation says: ${letter} plus ${k} makes ${b}.`, `A balance scale: both sides weigh the same. Remove ${k} from both sides and it still balances.`, `${b} − ${k} = ${x}, so ${letter} = ${x}.`, `Check: ${x} + ${k} = ${b}. ✓`];
  } else if (kind === 'sub') {
    const b = x - k;
    expression = `${letter} − ${k} = ${b}`;
    hint = `Add ${k} to both sides.`;
    steps = [`${letter} − ${k} = ${b}`, `${letter} = ${b} + ${k}`, `${letter} = ${x}`];
    explanation = [`${letter} minus ${k} leaves ${b}. To undo "minus ${k}", add ${k}.`, `Add ${k} to both sides: ${letter} = ${b} + ${k} = ${x}.`, `Check: ${x} − ${k} = ${b}. ✓`];
  } else if (kind === 'mul') {
    const b = x * k;
    expression = `${k}${letter} = ${b}`;
    hint = `${k}${letter} means ${k} × ${letter}. Divide both sides by ${k}.`;
    steps = [`${k} × ${letter} = ${b}`, `${letter} = ${b} ÷ ${k}`, `${letter} = ${x}`];
    explanation = [`${k}${letter} is shorthand for ${k} × ${letter}: ${k} groups of ${letter} make ${b}.`, `To undo "times ${k}", divide both sides by ${k}.`, `${b} ÷ ${k} = ${x} (because ${k} × ${x} = ${b}).`, `Check: ${k} × ${x} = ${b}. ✓`];
  } else {
    const b = x / k;
    expression = `${letter} ÷ ${k} = ${b}`;
    hint = `Multiply both sides by ${k}.`;
    steps = [`${letter} ÷ ${k} = ${b}`, `${letter} = ${b} × ${k}`, `${letter} = ${x}`];
    explanation = [`${letter} split into ${k} equal parts gives ${b} each. To undo "divide by ${k}", multiply by ${k}.`, `${b} × ${k} = ${x}.`, `Check: ${x} ÷ ${k} = ${b}. ✓`];
  }
  return {
    id: nextQuestionId('alg1'),
    masterySkillId: 'prealg.equations',
    topic: 'Pre-algebra', subtopic: 'One-step equation', difficulty: kind === 'add' || kind === 'sub' ? 2 : 3, mode: 'pure',
    prompt: `Solve for ${letter}.`,
    expression, answer: x,
    hint, solutionSteps: steps, explanation,
    visual: { type: 'balance', left: expression.split(' = ')[0], right: expression.split(' = ')[1], unknown: letter },
    prerequisites: kind === 'mul' || kind === 'div' ? ['mult', 'div'] : ['add.basic', 'sub.basic'],
    engineeringApplication: 'Every formula you will meet (F = ma, V = IR) is solved for the unknown exactly like this.',
  };
}

export function evaluateQuestion(a: number, b: number, x: number, op: '+' | '−', rng?: Rng): Question {
  const letter = rng ? rng.pick(['x', 'n', 'y']) : 'x';
  const answer = op === '+' ? a * x + b : a * x - b;
  const term = a === 1 ? letter : `${a}${letter}`;
  const expr = b === 0 ? term : `${term} ${op} ${b}`;
  return {
    id: nextQuestionId('alg2'),
    masterySkillId: 'prealg.expressions',
    topic: 'Pre-algebra', subtopic: 'Evaluate an expression', difficulty: 3, mode: 'pure',
    prompt: `If ${letter} = ${x}, what is ${expr}?`,
    expression: `${expr}, ${letter} = ${x}`,
    answer,
    hint: `Replace ${letter} with ${x}: ${a === 1 ? x : `${a} × ${x}`}${b ? ` ${op} ${b}` : ''}.`,
    solutionSteps: [`Substitute: ${a === 1 ? '' : `${a} × `}${x}${b ? ` ${op} ${b}` : ''}`, ...(a === 1 ? [] : [`${a} × ${x} = ${a * x}`]), `${answer}`],
    explanation: [`${term} means ${a === 1 ? letter : `${a} times ${letter}`}. A letter stands for a number — here ${letter} = ${x}.`, `Multiply first, then ${op === '+' ? 'add' : 'subtract'}: ${a === 1 ? x : `${a} × ${x} = ${a * x}`}${b ? `, then ${a * x} ${op} ${b} = ${answer}` : ''}.`, `Order of operations: multiplication before addition or subtraction.`],
    visual: { type: 'none' },
    prerequisites: ['mult', 'order.ops'],
    engineeringApplication: 'Plugging a measured value into a formula: distance = speed × time + head start.',
  };
}

export const genOneStep: Generator = (_skillId, _params, ctx) => {
  const d = ctx.difficulty;
  const kinds: OneStepKind[] = d <= 1 ? ['add', 'sub'] : d === 2 ? ['add', 'sub', 'mul'] : ['add', 'sub', 'mul', 'div'];
  const kind = ctx.rng.pick(kinds);
  const x = kind === 'div' ? ctx.rng.int(2, 12) * ctx.rng.int(2, 9) : ctx.rng.int(1, d >= 4 ? 30 : 12);
  const k = kind === 'add' || kind === 'sub' ? ctx.rng.int(1, d >= 4 ? 40 : 12) : ctx.rng.int(2, 12);
  if (kind === 'div') return oneStepQuestion('div', x, [2, 3, 4, 5, 6, 7, 8, 9].filter((c) => x % c === 0).length ? ctx.rng.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((c) => x % c === 0)) : 1, ctx.rng);
  return oneStepQuestion(kind, x, k, ctx.rng);
};

export const genEvaluate: Generator = (_skillId, _params, ctx) => {
  const d = ctx.difficulty;
  const a = d <= 1 ? 1 : ctx.rng.int(2, d >= 4 ? 12 : 6);
  const x = ctx.rng.int(1, d >= 4 ? 12 : 9);
  const b = d <= 1 ? ctx.rng.int(1, 9) : ctx.rng.int(0, 20);
  const op = ctx.rng.chance(0.7) || a * x - b < 0 ? '+' : '−';
  return evaluateQuestion(a, b, x, op, ctx.rng);
};
