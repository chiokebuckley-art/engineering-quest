import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { nextQuestionId, fmt } from './context';
import { lab } from '../label';

/**
 * Mental-math tricks, each generated with a worked, digit-by-digit explanation.
 *  11      — multiply by 11: split the digits, put their sums in the middle (carries included)
 *  sq5     — square a number ending in 5: n × (n + 1), then attach 25
 *  same10  — same tens digit, units add to 10: t × (t + 1) | u1 × u2 (two digits!)
 */
export type TrickKind = '11' | 'sq5' | 'same10' | 'all';
export const TRICK_KINDS: { id: TrickKind; label: string; short: string }[] = [
  { id: 'all', label: 'All three tricks', short: 'All tricks' },
  { id: '11', label: 'Multiply by 11', short: '×11' },
  { id: 'sq5', label: 'Squares ending in 5', short: '…5²' },
  { id: 'same10', label: 'Same tens, units make 10', short: 'Same tens' },
];

function base(skillId: string, expression: string, answer: number, difficulty: Difficulty, hint: string, steps: string[], subtopic: string): Question {
  return {
    id: nextQuestionId('trick'), masterySkillId: skillId, topic: 'Math tricks', subtopic, difficulty, mode: 'pure',
    prompt: '', expression, answer, hint, solutionSteps: steps, explanation: steps, visual: { type: 'none' }, prerequisites: ['mult', 'add.basic'],
    engineeringApplication: 'Engineers estimate in their heads constantly. Tricks like this make quick checks possible without a calculator.',
  };
}

/** n × 11 for a two- or three-digit n. */
export function times11Question(n: number, skillId = 'trick.11'): Question {
  const digits = String(n).split('').map(Number);
  const answer = n * 11;
  const steps: string[] = [];
  if (digits.length === 2) {
    const [a, b] = digits; const s = a + b;
    steps.push(`Split the digits: ${a} _ ${b}.`, `Add them: ${lab(a, 'tens digit')} + ${lab(b, 'ones digit')} = ${lab(s, 'digit sum')}.`);
    if (s < 10) steps.push(`Put ${s} in the middle: ${a}${s}${b}.`);
    else steps.push(`${lab(s, 'digit sum')} is two digits. Keep the ${s % 10} in the middle and carry the 1 to the front: ${lab(a, 'front digit')} + ${lab(1, 'carry')} = ${lab(a + 1, 'new front digit')}.`, `Result: ${a + 1}${s % 10}${b}.`);
  } else {
    const [a, b, c] = digits; const s1 = a + b; const s2 = b + c;
    steps.push(`Outer digits stay put: ${a} _ _ ${c}.`, `Add the neighbours: ${a} + ${b} = ${lab(s1, 'left middle sum')} and ${b} + ${c} = ${lab(s2, 'right middle sum')}.`);
    let carry2 = 0; let mid2 = s2;
    if (s2 >= 10) { carry2 = 1; mid2 = s2 - 10; steps.push(`${s2} is two digits: keep ${mid2}, carry 1 left into the ${s1} → ${s1 + 1}.`); }
    const t1 = s1 + carry2; let carry1 = 0; let mid1 = t1;
    if (t1 >= 10) { carry1 = 1; mid1 = t1 - 10; steps.push(`${t1} is two digits: keep ${mid1}, carry 1 left into the ${a} → ${a + 1}.`); }
    steps.push(`Read it off: ${a + carry1} ${mid1} ${mid2} ${c} → ${fmt(answer)}.`);
  }
  const hint = digits.length === 2 ? `Split ${digits[0]} _ ${digits[1]} and put ${digits[0]} + ${digits[1]} in the middle. Carry if the sum is 10 or more.` : `Keep ${digits[0]} and ${digits[2]} on the outside. Fill the middle with ${digits[0]}+${digits[1]} and ${digits[1]}+${digits[2]}, carrying from the right.`;
  return base(skillId, `${n} × 11 = ?`, answer, digits.length === 2 ? 2 : 4, hint, steps, 'Multiply by 11');
}

/** A number ending in 5, squared. */
export function square5Question(n: number, skillId = 'trick.sq5'): Question {
  const t = Math.floor(n / 10); const left = t * (t + 1);
  const answer = n * n;
  const steps = [
    `The number in front of the 5 is ${t}. Multiply it by the next number: ${lab(t, 'front number')} × ${lab(t + 1, 'next number')} = ${lab(left, 'front part')}.`,
    `Attach 25 to the end: ${left}25 → ${fmt(answer)}.`,
    `Check the ending: any number ending in 5, squared, ends in 25.`,
  ];
  return base(skillId, `${n} × ${n} = ?`, answer, n < 100 ? 2 : 4, `${t} × ${t + 1}, then write 25 after it.`, steps, 'Squares ending in 5');
}

/** Same tens digit, units add to 10. */
export function same10Question(t: number, u1: number, skillId = 'trick.same10'): Question {
  const u2 = 10 - u1; const a = t * 10 + u1; const b = t * 10 + u2;
  const left = t * (t + 1); const right = u1 * u2; const answer = a * b;
  const rightTxt = right < 10 ? `0${right}` : String(right);
  const steps = [
    `Both numbers start with ${t}, and the last digits ${lab(u1, 'first ones digit')} + ${lab(u2, 'second ones digit')} = 10. The trick works.`,
    `Left part: ${lab(t, 'shared front number')} × ${lab(t + 1, 'next number')} = ${lab(left, 'left part')}.`,
    `Right part: ${lab(u1, 'first ones digit')} × ${lab(u2, 'second ones digit')} = ${lab(right, 'right part')}${right < 10 ? ` — write it as two digits: ${rightTxt}` : ''}.`,
    `Join them: ${left} | ${rightTxt} → ${fmt(answer)}.`,
  ];
  return base(skillId, `${a} × ${b} = ?`, answer, 3, `${t} × ${t + 1} on the left, ${u1} × ${u2} on the right, written as two digits.`, steps, 'Same tens, units make 10');
}

export function trickQuestion(kind: TrickKind, difficulty: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<TrickKind, 'all'> = kind === 'all' ? rng.pick(['11', 'sq5', 'same10'] as const) : kind;
  if (k === '11') {
    const three = difficulty >= 4 ? true : difficulty === 3 ? rng.chance(0.5) : false;
    const n = three ? rng.int(100, 999) : rng.int(12, 99);
    return times11Question(n, skillId ?? 'trick.11');
  }
  if (k === 'sq5') {
    const n = (difficulty >= 4 ? rng.int(1, 19) : rng.int(1, 9)) * 10 + 5;
    return square5Question(n, skillId ?? 'trick.sq5');
  }
  const t = difficulty >= 4 ? rng.int(1, 12) : rng.int(1, 9);
  const u1 = rng.int(1, 9);
  return same10Question(t, u1, skillId ?? 'trick.same10');
}

/** Generator: params.kind = 11 | sq5 | same10 | all. */
export const genTricks: Generator = (skillId, params, ctx) => trickQuestion(String(params?.kind ?? 'all') as TrickKind, ctx.difficulty, ctx.rng, skillId);
