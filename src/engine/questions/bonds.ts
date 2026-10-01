import type { Question } from '../types';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import { bondFactId, bondFacts, parseBondFact } from '../curriculum/facts';
import { pickFact } from '../srs/SpacedRepetitionEngine';
import { lab } from '../label';

/** What the three numbers of a bond are: the whole, the part we know, the part we find. */
export interface BondLabels { total: string; part: string; missing: string }
const ABSTRACT: BondLabels = { total: 'total', part: 'known part', missing: 'missing part' };
const SCENES: Record<number, { prompt: (a: number, t: number) => string; unit: string; app: string; labels: BondLabels }> = {
  5: { prompt: (a, t) => `A hand has ${t} fingers. ${a} are up. How many are down?`, unit: 'fingers', app: 'Small totals you can see at a glance.', labels: { total: 'fingers on a hand', part: 'fingers up', missing: 'fingers down' } },
  10: { prompt: (a, t) => `A rack holds ${t} batteries. ${a} are in. How many more fit?`, unit: 'batteries', app: 'Our number system is built in tens.', labels: { total: 'rack spaces', part: 'batteries in', missing: 'more batteries' } },
  50: { prompt: (a, t) => `A crate holds ${t} bolts. It has ${a}. How many more to fill it?`, unit: 'bolts', app: 'Half of a hundred: quick stock counts.', labels: { total: 'bolts when full', part: 'bolts in the crate', missing: 'more bolts' } },
  100: { prompt: (a, t) => `A tank holds ${t} litres. ${a} litres are in. How many more litres fill it?`, unit: 'L', app: 'Percent means "per hundred" — every percentage starts here.', labels: { total: 'litres when full', part: 'litres in', missing: 'more litres' } },
};
const GENERIC = { prompt: (a: number, t: number) => `A box holds ${t} marbles. ${a} are in. How many more fill it?`, unit: 'marbles', app: 'Counting up to a round total is how change is given and gaps are filled.', labels: { total: 'marbles when full', part: 'marbles in', missing: 'more marbles' } as BondLabels };

export function bondExplanation(a: number, t: number, labels: BondLabels = ABSTRACT): string[] {
  const b = t - a;
  const T = lab(t, labels.total); const A = lab(a, labels.part); const B = lab(b, labels.missing);
  const next = Math.ceil(a / 10) * 10;
  const lines = [
    `Number bonds are pairs that make a total. ${a} and ${b} make ${t}.`,
    `Think of a bar of ${t} split in two: one part is ${a}, the other must be ${T} − ${A} = ${B}.`,
  ];
  if (t === 10) lines.push(`Ten-frame trick: ${a} filled, count the empty spots: ${b}.`);
  if (t > 20 && a % 10 !== 0 && next < t) lines.push(`Jump to the next ten first: ${a} → ${next} is ${lab(next - a, 'first jump')}, then ${next} → ${t} is ${lab(t - next, 'second jump')}. Add the jumps: ${next - a} + ${t - next} = ${B}.`);
  if (t > 10 && t <= 20 && a < 10) lines.push(`Make ten first: ${a} → 10 takes ${lab(10 - a, 'partner to make ten')}, then ${lab(t - 10, 'more to reach the total')} gets to ${t}. Add: ${10 - a} + ${t - 10} = ${B}.`);
  if (t > 10 && t <= 20 && a >= 10) lines.push(`${a} is already past 10: it is 10 and ${a - 10}, so it needs ${t} − ${a} = ${B}.`);
  lines.push(`Check: ${A} + ${B} = ${T}. ✓`);
  return lines;
}

/** Any bond question for target t with part a (not necessarily a tracked fact). */
export function bondQuestion(a: number, t: number, skillId: string, variant: 0 | 1 | 2 | 3, tracked: boolean): Question {
  const b = t - a;
  const sc = SCENES[t] ?? GENERIC;
  const L = variant === 3 ? sc.labels : ABSTRACT;
  const expression = variant === 0 ? `${a} + ? = ${t}` : variant === 1 ? `? + ${a} = ${t}` : variant === 2 ? `${t} − ${a} = ?` : `${a} + ? = ${t}`;
  return {
    id: nextQuestionId('bond'),
    masterySkillId: skillId,
    factId: tracked ? bondFactId(t, a) : undefined,
    topic: 'Number bonds',
    subtopic: `Make ${t}`,
    difficulty: variant === 3 ? 5 : 2,
    mode: variant === 3 ? 'applied' : 'pure',
    prompt: variant === 3 ? sc.prompt(a, t) : `What makes ${t}?`,
    expression,
    answer: b,
    unit: variant === 3 ? sc.unit : undefined,
    hint: t > 20 && a % 10 !== 0 && Math.ceil(a / 10) * 10 < t ? `Jump to ${Math.ceil(a / 10) * 10} first, then to ${t}.` : `${a} and what make ${t}? Count up from ${a}.`,
    solutionSteps: [`${lab(t, L.total)} − ${lab(a, L.part)} = ${lab(b, L.missing)}.`, `${lab(a, L.part)} + ${lab(b, L.missing)} = ${lab(t, L.total)}.`],
    explanation: bondExplanation(a, t, L),
    visual: { type: 'bond', total: t, part: a },
    prerequisites: ['add.basic'],
    engineeringApplication: sc.app,
  };
}

export const genBonds: Generator = (skillId, params, ctx) => {
  const t = Number(params?.target ?? 10);
  const facts = bondFacts(t);
  const fid = pickFact(facts, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const f = parseBondFact(fid)!;
  // The canonical fact stores the smaller part; ask either side of the pair.
  let a = ctx.rng.chance(0.5) ? f.part : t - f.part;
  let tracked = true;
  // Past 20 the tracked facts go by fives; at higher difficulty sometimes ask any number (e.g. 64 + ? = 100).
  if (t > 20 && ctx.difficulty >= 3 && ctx.rng.chance(0.5)) { a = ctx.rng.int(1, t - 1); tracked = false; }
  const variant = (ctx.difficulty >= 5 && ctx.rng.chance(0.35)) ? 3 : (ctx.rng.int(0, 2) as 0 | 1 | 2);
  return bondQuestion(a, t, skillId, variant, tracked);
};
