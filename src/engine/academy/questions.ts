/**
 * Question builders for the Arithmetic Academy. Every builder returns an AskStep: a Question (so the
 * answer flows through mastery, the notebook and stats like any other) plus the verb the player uses
 * to answer it. Model verbs (counters, arrays, fraction bars…) judge what the player builds.
 */
import type { Difficulty, Question, Visual } from '../types';
import { lab, labn } from '../label';
import type { Rng } from '../rng';
import { pictureQuestion } from '../questions/picture';
import { wordProblem, type WordKind } from '../questions/wordproblems';
import { pureMultQuestion } from '../questions/multiplication';
import { pureDivQuestion } from '../questions/division';
import { simplify } from '../questions/precalc';
import type { AskStep, AcademyVerb, ModelSpec } from './types';

const OBJECTS = ['ore crystals', 'copper gears', 'brass bolts', 'glow lamps', 'iron rivets', 'steam valves'];
const pick = <T,>(rng: Rng, arr: readonly T[]) => arr[Math.floor(rng.next() * arr.length)];
const rint = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng.next() * (hi - lo + 1));
/** One of a plural object name: 'ore crystals' → 'ore crystal'. */
const single = (what: string) => what.replace(/s$/, '');
/** A count of a named object, singular or plural: cnt(1, 'brass bolts') = '1 (brass bolt)'. */
const cnt = (n: number, what: string, tail = '') => labn(n, `${single(what)}${tail}`, `${what}${tail}`);
/** The name of one equal part: ordinal(8) = 'eighth'. */
const PART_NAME: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 8: 'eighth', 10: 'tenth' };
const ordinal = (d: number) => PART_NAME[d] ?? 'equal part';
export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/−/g, '-');

function ask(question: Question, verb: AcademyVerb, extra: Partial<AskStep> = {}): AskStep {
  return { kind: 'ask', wave: '', question, verb, ...extra };
}
/** Numeric choices around the answer (never negative, never duplicates). */
export function numberChoices(rng: Rng, answer: number, count = 4, spread = 3): string[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < count && guard++ < 60) { const d = rint(rng, 1, spread) * (rng.next() < 0.5 ? -1 : 1); const c = answer + d; if (c >= 0) set.add(c); }
  return rng.shuffle([...set]).map(String);
}
const pq = (prefix: string, skill: string, sub: string, o: { prompt: string; expression: string; answer: number; visual: Visual; hint: string; steps: string[]; difficulty?: Difficulty; fraction?: boolean; answerText?: string; app?: string }) =>
  pictureQuestion(prefix, 'Arithmetic Academy', skill, sub, { difficulty: o.difficulty ?? 2, prompt: o.prompt, expression: o.expression, answer: o.answer, visual: o.visual, hint: o.hint, steps: o.steps, fraction: o.fraction, answerText: o.answerText, app: o.app ?? 'Engineers count, measure and check before they build.', prereq: [] });

/* ---------------- Ch.1 quantity & counting ---------------- */
export function countStep(rng: Rng, max = 20): AskStep {
  const n = rint(rng, 3, max); const what = pick(rng, OBJECTS);
  const q = pq('acad-count', 'num.sense', 'counting', { prompt: `Count the ${what} in the pile. Tap each one once.`, expression: 'How many?', answer: n, visual: { type: 'groups', groups: 1, perGroup: n }, hint: 'Tap each one exactly once. The last number you say is how many there are.', steps: [`Tap and count: 1, 2, 3 … ${n}.`, `The last number you said, ${lab(n, what)}, is how many there are.`], difficulty: 1 });
  return ask(q, 'counters', { model: { kind: 'counters', items: n, label: what }, ask: `Tap every ${what.replace(/s$/, '')} once, then lock in the count.` });
}
export function subitizeStep(rng: Rng): AskStep {
  const n = rint(rng, 2, 6); const what = pick(rng, OBJECTS);
  const q = pq('acad-subit', 'num.sense', 'subitize', { prompt: `A quick glance: how many ${what}?`, expression: 'How many?', answer: n, visual: { type: 'groups', groups: 1, perGroup: n }, hint: 'Small sets you can just see: 2, 3, 4… without counting one by one.', steps: [`There are ${lab(n, what)}. Sets this small you can see at a glance.`], difficulty: 1 });
  return ask(q, 'choose', { choices: numberChoices(rng, n, 4, 2) });
}
export function compareStep(rng: Rng, max = 20): AskStep {
  const a = rint(rng, 2, max); let b = rint(rng, 2, max); if (rng.next() < 0.15) b = a;
  const what = pick(rng, OBJECTS);
  const answerText = a > b ? 'Pile A' : b > a ? 'Pile B' : 'Same';
  const q = pq('acad-compare', 'num.sense', 'compare', { prompt: `Pile A has ${a} ${what}. Pile B has ${b} ${what}. Which pile has more?`, expression: 'Which has more?', answer: a > b ? 1 : b > a ? 2 : 0, visual: { type: 'bar', bars: [{ label: 'Pile A', parts: [a] }, { label: 'Pile B', parts: [b] }] }, hint: 'Line them up. The longer bar is the bigger pile.', steps: [`Pile A: ${lab(a, what)}. Pile B: ${lab(b, what)}.`, `${answerText === 'Same' ? 'They are the same.' : `${answerText} has more.`}`], difficulty: 1, answerText });
  return ask(q, 'choose', { choices: ['Pile A', 'Pile B', 'Same'], accept: [norm(answerText)] });
}

/* ---------------- Ch.2 place value ---------------- */
export function buildNumberStep(rng: Rng, max = 99): AskStep {
  const n = rint(rng, 11, max);
  const t = Math.floor(n / 10), o = n % 10;
  const q = pq('acad-pv', 'num.sense', 'place-value', { prompt: `Seat the plates to build ${n}: tens plates and ones plates.`, expression: `Build ${n}`, answer: n, visual: { type: 'pvchart', value: String(n) }, hint: `${n} is ${labn(t, 'ten')} and ${labn(o, 'one')}.`, steps: [`${labn(t, 'tens plate')} × ${lab(10, 'per tens plate')} = ${lab(t * 10, 'from tens')}`, `${lab(t * 10, 'from tens')} + ${lab(o, 'from ones')} = ${lab(n, 'in all')}`], difficulty: 2 });
  return ask(q, 'placevalue', { model: { kind: 'placevalue', target: n }, ask: `Build ${lab(n, 'in all')}. Tap +10 for each tens plate and +1 for each ones plate.` });
}
export function tensOnesStep(rng: Rng): AskStep {
  const n = rint(rng, 11, 99); const which = rng.next() < 0.5 ? 'tens' : 'ones';
  const answer = which === 'tens' ? Math.floor(n / 10) : n % 10;
  const q = pq('acad-pvq', 'num.sense', 'place-value', { prompt: `The dial reads ${n}. How many ${which} does it have?`, expression: `${which} in ${n}`, answer, visual: { type: 'pvchart', value: String(n), highlight: which === 'tens' ? 1 : 0 }, hint: `In ${lab(n, 'dial reading')}, the left digit counts tens and the right digit counts ones.`, steps: [`${lab(n, 'dial reading')} = ${labn(Math.floor(n / 10), 'ten')} × ${lab(10, 'per ten')} + ${labn(n % 10, 'one')}`, `So it has ${labn(answer, which.replace(/s$/, ''), which)}.`], difficulty: 2 });
  return ask(q, 'choose', { choices: numberChoices(rng, answer, 4, 2) });
}
export function bundleStep(rng: Rng): AskStep {
  const ones = rint(rng, 12, 39);
  const q = pq('acad-bundle', 'num.sense', 'bundling', { prompt: `${ones} loose ones plates arrive. Bundle every 10 into a tens plate. How many tens plates can you make?`, expression: `${ones} ones → ? tens`, answer: Math.floor(ones / 10), visual: { type: 'pvchart', value: String(ones) }, hint: 'Every 10 ones plates bundle into exactly 1 tens plate.', steps: [`${lab(ones, 'loose ones')} = ${labn(Math.floor(ones / 10), 'ten')} × ${lab(10, 'ones per ten')} + ${labn(ones % 10, 'one left over', 'ones left over')}`, `${labn(Math.floor(ones / 10), 'full bundle')}, so ${labn(Math.floor(ones / 10), 'tens plate')}.`], difficulty: 2 });
  return ask(q, 'type');
}

/* ---------------- Ch.3 addition ---------------- */
export function joinStep(rng: Rng, max = 20): AskStep {
  const a = rint(rng, 2, max - 3); const b = rint(rng, 1, Math.min(9, max - a)); const what = pick(rng, OBJECTS);
  const q = pq('acad-join', 'add.basic', 'joining', { prompt: `Cart one has ${a} ${what}, cart two has ${b} more. Join them: hop along the rail from ${a}.`, expression: `${a} + ${b} = ?`, answer: a + b, visual: { type: 'jumps', from: a, jumps: [b] }, hint: `Start at ${lab(a, 'in cart one')} and count on ${lab(b, 'in cart two')}.`, steps: [`Start at ${lab(a, 'in cart one')}.`, `Hop ${lab(b, 'in cart two')}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(', ')}.`, `${lab(a, 'cart one')} + ${lab(b, 'cart two')} = ${cnt(a + b, what, ' in all')}`], difficulty: 1 });
  return ask(q, 'numberline', { model: { kind: 'numberline', start: a, max: Math.max(20, a + b + 2), label: `Start at ${lab(a, 'in cart one')}, hop ${lab(b, 'in cart two')}` }, ask: `Start at ${lab(a, 'in cart one')} and hop ${lab(b, 'in cart two')} along the rail. Tap where you land.` });
}
export function partWholeStep(rng: Rng, total = 10): AskStep {
  const part = rint(rng, 1, total - 1);
  const q = pq('acad-pw', 'add.basic', 'part-whole', { prompt: `The beam needs ${total} bolts. ${part} ${part === 1 ? 'is' : 'are'} in. How many more bolts make ${total}?`, expression: `${part} + ? = ${total}`, answer: total - part, visual: { type: 'bond', total, part }, hint: `Part + part = whole. ${cnt(part, 'bolts', ' in')} + ? (bolts missing) = ${lab(total, 'bolts needed')}.`, steps: [`Whole: ${lab(total, 'bolts needed')}. One part: ${cnt(part, 'bolts', ' in')}.`, `${lab(total, 'bolts needed')} − ${cnt(part, 'bolts', ' in')} = ${cnt(total - part, 'bolts', ' missing')}`], difficulty: 2 });
  return ask(q, 'choose', { choices: numberChoices(rng, total - part, 4, 2) });
}
export function swapAddStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 9); const b = rint(rng, 2, 9);
  const q = pq('acad-swap', 'add.basic', 'commutative', { prompt: `A cart of ${a} and a cart of ${b}: ${a} + ${b} and ${b} + ${a} join the same carts. Which is the total?`, expression: `${b} + ${a} = ?`, answer: a + b, visual: { type: 'bar', bars: [{ label: `${a} + ${b}`, parts: [a, b] }, { label: `${b} + ${a}`, parts: [b, a] }] }, hint: 'Order does not change a sum.', steps: [`${lab(a, 'first cart')} + ${lab(b, 'second cart')} = ${lab(a + b, 'in all')}`, `Swapped, ${lab(b, 'second cart')} + ${lab(a, 'first cart')} = ${lab(a + b, 'in all')} too.`], difficulty: 1 });
  return ask(q, 'type');
}
export function addTypedStep(rng: Rng, max = 20): AskStep {
  const a = rint(rng, 1, max - 1); const b = rint(rng, 1, max - a);
  const q = pq('acad-add', 'add.basic', 'facts', { prompt: `Join ${a} and ${b}.`, expression: `${a} + ${b} = ?`, answer: a + b, visual: { type: 'jumps', from: a, jumps: [b] }, hint: `Count on from the bigger number.`, steps: [`${a} + ${b} = ${a + b}.`], difficulty: 2 });
  return ask(q, 'type');
}

/* ---------------- Ch.4 subtraction ---------------- */
export function takeAwayStep(rng: Rng, max = 20): AskStep {
  const a = rint(rng, 5, max); const b = rint(rng, 1, Math.min(9, a - 1)); const what = pick(rng, OBJECTS);
  const q = pq('acad-take', 'sub.basic', 'take-away', { prompt: `The pump held ${a} ${what}. ${b} of them drained out. Hop back ${b} on the rail from ${a}.`, expression: `${a} − ${b} = ?`, answer: a - b, visual: { type: 'bar', bars: [{ label: `${a}`, parts: [a - b, b] }] }, hint: `Start at ${lab(a, `${what} at the start`)} and count back ${cnt(b, what, ' drained out')}.`, steps: [`Start at ${lab(a, `${what} at the start`)}.`, `Hop back ${cnt(b, what, ' drained out')}.`, `${lab(a, `${what} at the start`)} − ${cnt(b, what, ' drained out')} = ${cnt(a - b, what, ' left')}`], difficulty: 1 });
  return ask(q, 'numberline', { model: { kind: 'numberline', start: a, max: Math.max(20, a + 2), label: `Start at ${lab(a, 'starting amount')}, hop back ${lab(b, 'drained out')}` }, ask: `Start at ${lab(a, 'starting amount')} and hop back ${lab(b, 'drained out')}. Tap where you land.` });
}
export function differenceStep(rng: Rng, max = 20): AskStep {
  const a = rint(rng, 4, max); const b = rint(rng, 1, a - 1);
  const q = pq('acad-diff', 'sub.basic', 'compare', { prompt: `Ore cart A weighs ${a}, cart B weighs ${b}. How much heavier is A?`, expression: `${a} − ${b} = ?`, answer: a - b, visual: { type: 'bar', bars: [{ label: 'A', parts: [a] }, { label: 'B', parts: [b, '?'] }] }, hint: 'The difference is the gap between the two bars.', steps: [`Line them up: ${lab(b, 'cart B weight')} + ? (gap) = ${lab(a, 'cart A weight')}.`, `${lab(a, 'cart A weight')} − ${lab(b, 'cart B weight')} = ${lab(a - b, 'how much heavier A is')}`], difficulty: 2 });
  return ask(q, 'choose', { choices: numberChoices(rng, a - b, 4, 2) });
}
export function inverseCheckStep(rng: Rng): AskStep {
  const b = rint(rng, 2, 9); const c = rint(rng, 2, 9); const a = b + c;
  const q = pq('acad-inv', 'sub.basic', 'inverse', { prompt: `${lab(a, 'whole')} − ${lab(b, 'known part')} = ${lab(c, 'missing part')}. Check it with addition: ${lab(b, 'known part')} + ? = ${lab(a, 'whole')}.`, expression: `${b} + ? = ${a}`, answer: c, visual: { type: 'bond', total: a, part: b }, hint: 'Subtraction undoes addition. The same three numbers make both facts.', steps: [`${lab(b, 'known part')} + ${lab(c, 'missing part')} = ${lab(a, 'whole')}, so ${lab(a, 'whole')} − ${lab(b, 'known part')} = ${lab(c, 'missing part')}. The check passes.`], difficulty: 2 });
  return ask(q, 'type');
}
export function subTypedStep(rng: Rng, max = 20): AskStep {
  const a = rint(rng, 3, max); const b = rint(rng, 1, a);
  const q = pq('acad-sub', 'sub.basic', 'facts', { prompt: `Take ${b} from ${a}.`, expression: `${a} − ${b} = ?`, answer: a - b, visual: { type: 'bar', bars: [{ label: `${a}`, parts: [a - b, b] }] }, hint: 'Count back, or count up from the smaller number.', steps: [`${a} − ${b} = ${a - b}.`], difficulty: 2 });
  return ask(q, 'type');
}

/* ---------------- Ch.5 multiplication ---------------- */
export function buildArrayStep(rng: Rng, tables: number[], anyOrder = false): AskStep {
  const a = rint(rng, 2, 6); const b = pick(rng, tables); const what = pick(rng, OBJECTS);
  const q = pq('acad-array', `mult.${Math.min(a, b)}`, 'arrays', { prompt: `Brick needs ${a} rows of ${b} ${what} across the bridge. Build the array.`, expression: `${a} × ${b} = ?`, answer: a * b, visual: { type: 'array', rows: a, cols: b }, hint: `${lab(a, 'rows')}, ${lab(b, `${what} in each row`)}.`, steps: [`${a} rows of ${b} is ${a} groups of ${b}.`, `${lab(a, 'rows')} × ${lab(b, `${what} per row`)} = ${lab(a * b, what)}`], difficulty: 2 });
  q.factId = `fact:mult:${Math.min(a, b)}x${Math.max(a, b)}`;
  return ask(q, 'array', { model: { kind: 'array', rows: a, cols: b, anyOrder }, accept: anyOrder ? [`${a}x${b}`, `${b}x${a}`] : [`${a}x${b}`], ask: `Build ${labn(a, 'row')} of ${lab(b, `${what} each`)}. Tap the corner cell.` });
}
export function groupsStep(rng: Rng, tables: number[]): AskStep {
  const groups = rint(rng, 2, 6); const per = pick(rng, tables); const what = pick(rng, OBJECTS);
  const q = pq('acad-groups', `mult.${Math.min(groups, per)}`, 'equal-groups', { prompt: `${groups} crates, ${per} ${what} in each. How many in all?`, expression: `${groups} × ${per} = ?`, answer: groups * per, visual: { type: 'groups', groups, perGroup: per }, hint: `${lab(groups, 'crates')} of ${lab(per, `${what} each`)}. Skip-count by ${per}.`, steps: [`Skip-count by ${per}: ${Array.from({ length: groups }, (_, i) => per * (i + 1)).join(', ')}.`, `${lab(groups, 'crates')} × ${lab(per, `${what} per crate`)} = ${lab(groups * per, what)}`], difficulty: 2 });
  q.factId = `fact:mult:${Math.min(groups, per)}x${Math.max(groups, per)}`;
  return ask(q, 'choose', { choices: numberChoices(rng, groups * per, 4, per) });
}
export function factStep(rng: Rng, tables: number[], verb: AcademyVerb = 'type'): AskStep {
  const a = pick(rng, tables); const b = rint(rng, 2, 10);
  const q = pureMultQuestion(a, b, rng);
  return ask(q, verb, verb === 'choose' ? { choices: numberChoices(rng, q.answer, 4, Math.max(2, a)) } : {});
}
export function areaPlateStep(rng: Rng, tables: number[]): AskStep {
  const a = rint(rng, 2, 5); const b = pick(rng, tables);
  const options = rng.shuffle([
    { visual: { type: 'array', rows: a, cols: b } as Visual, label: `${a} × ${b}` },
    { visual: { type: 'array', rows: a, cols: b + 1 } as Visual, label: `${a} × ${b + 1}` },
    { visual: { type: 'array', rows: a + 1, cols: b } as Visual, label: `${a + 1} × ${b}` },
  ]);
  const q = pq('acad-plate', `mult.${Math.min(a, b)}`, 'area', { prompt: `The bridge hole is ${a} by ${b}. Which plate covers exactly ${a * b} cells?`, expression: `Plate for ${a * b}`, answer: options.findIndex((o) => o.label === `${a} × ${b}`), visual: { type: 'array', rows: a, cols: b }, hint: `Count rows and columns: ${lab(a, 'rows')}, ${lab(b, 'cells across')}.`, steps: [`${lab(a, 'rows')} × ${lab(b, 'cells per row')} = ${lab(a * b, 'cells')}`], difficulty: 2, answerText: `${a} × ${b}` });
  return ask(q, 'pickmodel', { options, accept: [norm(`${a} × ${b}`)] });
}

/* ---------------- Ch.6 division ---------------- */
export function shareStep(rng: Rng, divisors: number[]): AskStep {
  const d = pick(rng, divisors); const qv = rint(rng, 2, 9); const total = d * qv; const what = pick(rng, OBJECTS);
  const q = pq('acad-share', `div.${d}`, 'fair-share', { prompt: `${total} ${what} shared fairly into ${d} crates. How many in each crate?`, expression: `${total} ÷ ${d} = ?`, answer: qv, visual: { type: 'share', total, groups: d }, hint: `Deal them out one at a time into ${d} crates.`, steps: [`${lab(d, 'crates')} × ? (${what} per crate) = ${lab(total, what)}`, `${lab(d, 'crates')} × ${lab(qv, `${what} per crate`)} = ${lab(total, what)}, so each crate gets ${qv}.`], difficulty: 2 });
  q.factId = `fact:div:${total}/${d}`;
  return ask(q, 'choose', { choices: numberChoices(rng, qv, 4, 2) });
}
/** Division as an array: build d equal rows from the total, then read how many in each row. */
export function divArrayStep(rng: Rng, divisors: number[]): AskStep {
  const d = pick(rng, divisors); const qv = rint(rng, 2, 8); const total = d * qv; const what = pick(rng, OBJECTS);
  const q = pq('acad-divarray', `div.${d}`, 'array', { prompt: `Lay ${total} ${what} out in ${d} equal rows. Build the array: how many go in each row?`, expression: `${total} ÷ ${d} = ?`, answer: qv, visual: { type: 'array', rows: d, cols: qv }, hint: `${lab(d, 'rows')}. Keep adding a column until the array holds ${total} ${what}.`, steps: [`${lab(d, 'rows')} × ${lab(qv, `${what} per row`)} = ${lab(total, what)}`, `${lab(total, what)} ÷ ${lab(d, 'rows')} = ${lab(qv, `${what} per row`)}`], difficulty: 2 });
  q.factId = `fact:div:${total}/${d}`;
  return ask(q, 'array', { model: { kind: 'array', rows: d, cols: qv }, accept: [`${d}x${qv}`], ask: `Build ${labn(d, 'row')} that hold ${lab(total, `${what} in all`)}. Tap the corner cell.` });
}
export function groupingStep(rng: Rng, divisors: number[]): AskStep {
  const per = pick(rng, divisors); const groups = rint(rng, 2, 9); const total = per * groups; const what = pick(rng, OBJECTS);
  const q = pq('acad-grouping', `div.${per}`, 'how-many-groups', { prompt: `${total} ${what}, ${per} fit in each crate. How many crates fill up?`, expression: `${total} ÷ ${per} = ?`, answer: groups, visual: { type: 'groups', groups, perGroup: per }, hint: `How many crates of ${per} fill up with ${total} ${what}? Skip-count by ${per}.`, steps: [`Skip-count by ${per}: ${Array.from({ length: groups }, (_, i) => per * (i + 1)).join(', ')}.`, `${lab(total, what)} ÷ ${lab(per, `${what} per crate`)} = ${lab(groups, 'crates')}`], difficulty: 2 });
  q.factId = `fact:div:${total}/${per}`;
  return ask(q, 'type');
}
export function divCheckStep(rng: Rng, divisors: number[]): AskStep {
  const d = pick(rng, divisors); const qv = rint(rng, 2, 9); const total = d * qv;
  const q = pq('acad-divcheck', `div.${d}`, 'inverse', { prompt: `${lab(total, 'dividend')} ÷ ${lab(d, 'divisor')} = ${lab(qv, 'quotient')}. Which multiplication fact checks it?`, expression: `Check ${total} ÷ ${d} = ${qv}`, answer: 0, visual: { type: 'array', rows: d, cols: qv }, hint: 'Division undoes multiplication: divisor × quotient = dividend.', steps: [`${lab(d, 'divisor')} × ${lab(qv, 'quotient')} = ${lab(total, 'dividend')}. The check passes.`], difficulty: 2, answerText: `${d} × ${qv} = ${total}` });
  const choices = rng.shuffle([`${d} × ${qv} = ${total}`, `${d} + ${qv} = ${d + qv}`, `${total} × ${d} = ${total * d}`]);
  return ask(q, 'choose', { choices, accept: [norm(`${d} × ${qv} = ${total}`)] });
}
export function divFactStep(rng: Rng, divisors: number[]): AskStep {
  const d = pick(rng, divisors); const qv = rint(rng, 2, 10);
  return ask(pureDivQuestion(d * qv, d), 'type');
}
export function remainderStep(rng: Rng): AskStep {
  const d = rint(rng, 3, 6); const qv = rint(rng, 2, 6); const r = rint(rng, 1, d - 1); const total = d * qv + r;
  const q = pq('acad-rem', 'div', 'remainder', { prompt: `${total} bolts packed ${d} to a box. How many are left over after the full boxes?`, expression: `${total} ÷ ${d} → left over?`, answer: r, visual: { type: 'groups', groups: qv, perGroup: d }, hint: `${lab(qv, 'full boxes')} × ${lab(d, 'bolts per box')} = ${lab(d * qv, 'bolts packed')}. What is left?`, steps: [`${lab(qv, 'full boxes')} × ${lab(d, 'bolts per box')} = ${lab(d * qv, 'bolts packed')}`, `${lab(total, 'bolts')} − ${lab(d * qv, 'bolts packed')} = ${cnt(r, 'bolts', ' left over')}`], difficulty: 3 });
  return ask(q, 'choose', { choices: numberChoices(rng, r, 4, 2) });
}

/* ---------------- Ch.7 properties ---------------- */
export function swapPadStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 9); let b = rint(rng, 2, 9); if (b === a) b = a + 1;
  const q = pq('acad-swappad', 'mult.missing', 'commutative', { prompt: `The swap pad turns ${a} × ${b} into ${b} × ?. Same product, factors swapped.`, expression: `${a} × ${b} = ${b} × ?`, answer: a, visual: { type: 'array', rows: a, cols: b }, hint: 'Turn the array on its side: the count does not change.', steps: [`${lab(a, 'rows')} × ${lab(b, 'columns')} = ${lab(a * b, 'dots')}`, `Turned on its side: ${lab(b, 'rows')} × ${lab(a, 'columns')} = ${lab(a * b, 'dots')} too. The missing factor is ${a}.`], difficulty: 2 });
  return ask(q, 'type');
}
export function splitAttackStep(rng: Rng): AskStep {
  const a = rint(rng, 3, 9); const b = rint(rng, 6, 9); const s = 5;
  const q = pq('acad-split', 'mult.missing', 'distributive', { prompt: `Split attack: ${a} × ${b} = ${a} × ${s} + ${a} × ?`, expression: `${a} × ${b} = ${a} × ${s} + ${a} × ?`, answer: b - s, visual: { type: 'array', rows: a, cols: b, highlightCols: s } as Visual, hint: `${lab(b, 'columns')} splits into ${lab(s, 'columns')} and ${labn(b - s, 'column')}.`, steps: [`${lab(b, 'columns')} = ${lab(s, 'columns')} + ${labn(b - s, 'column')}`, `${lab(a, 'rows')} × ${lab(s, 'columns')} = ${lab(a * s, 'dots')}`, `${lab(a, 'rows')} × ${labn(b - s, 'column')} = ${lab(a * (b - s), 'dots')}`, `${lab(a * s, 'dots')} + ${lab(a * (b - s), 'dots')} = ${lab(a * b, 'dots in all')}, so ${a} × ${b} = ${a} × ${s} + ${a} × ${b - s}.`], difficulty: 3 });
  return ask(q, 'choose', { choices: numberChoices(rng, b - s, 4, 2) });
}
export function inverseOpsStep(rng: Rng): AskStep {
  const d = rint(rng, 2, 9); const qv = rint(rng, 2, 9); const total = d * qv;
  const q = pq('acad-invops', 'mult.missing', 'inverse', { prompt: `The Engine accepts ${total} ÷ ${d} = ? only if ${d} × ? = ${total}. Find ?.`, expression: `${d} × ? = ${total}`, answer: qv, visual: { type: 'balance', left: `${d} × ?`, right: `${total}`, unknown: '?' } as Visual, hint: 'Multiplication and division undo each other.', steps: [`${lab(d, 'groups')} × ${lab(qv, 'per group')} = ${lab(total, 'total')}, so ${lab(total, 'total')} ÷ ${lab(d, 'groups')} = ${lab(qv, 'per group')}.`], difficulty: 2 });
  return ask(q, 'type');
}
export function whichEqualStep(rng: Rng): AskStep {
  const a = rint(rng, 3, 9); const b = rint(rng, 3, 9);
  const right = rng.next() < 0.5 ? `${b} × ${a}` : `${a} × ${b - 1} + ${a}`;
  const wrong = rng.shuffle([`${a} + ${b}`, `${a} × ${b + 1}`, `${b} − ${a}`]);
  const choices = rng.shuffle([right, wrong[0], wrong[1]]);
  const q = pq('acad-equal', 'mult.missing', 'equivalence', { prompt: `Which expression equals ${a} × ${b}? The Engine only takes equal power.`, expression: `= ${a} × ${b}`, answer: a * b, visual: { type: 'array', rows: a, cols: b }, hint: 'Swapping factors keeps the product; so does splitting one factor.', steps: [`${lab(a, 'rows')} × ${lab(b, 'columns')} = ${lab(a * b, 'dots')}`, `${right} also makes ${lab(a * b, 'dots')}.`], difficulty: 3, answerText: right });
  return ask(q, 'choose', { choices, accept: [norm(right)] });
}

/* ---------------- Ch.8 fractions ---------------- */
export function shadeFractionStep(rng: Rng, denoms = [2, 3, 4, 6, 8]): AskStep {
  const d = pick(rng, denoms); const n = rint(rng, 1, d - 1);
  const q = pq('acad-shade', 'frac', 'unit-fractions', { prompt: `Light ${n}/${d} of the bridge deck: the deck is one whole cut into ${d} equal planks.`, expression: `Shade ${n}/${d}`, answer: n / d, visual: { type: 'fracbar', fracs: [{ n, d, label: `${n}/${d}` }] } as Visual, hint: `${d} equal planks. Light ${n} of them.`, steps: [`Each plank is 1/${d} of the whole.`, `${labn(n, 'lit plank')} out of ${lab(d, 'equal planks')} is ${n}/${d}.`], difficulty: 2, fraction: true, answerText: `${n}/${d}` });
  return ask(q, 'fracbar', { model: { kind: 'fracbar', pieces: d, label: 'bridge deck' }, accept: [`${n}/${d}`], ask: `Tap planks to light exactly ${lab(`${n}/${d}`, 'of the deck')}.` });
}
export function equivalentStep(rng: Rng): AskStep {
  const base = pick(rng, [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]); const k = pick(rng, [2, 3]);
  const [n, d] = base; const D = d * k;
  const q = pq('acad-equiv', 'frac', 'equivalence', { prompt: `${n}/${d} of the deck is lit. Show the same amount with the deck cut into ${D} planks.`, expression: `${n}/${d} = ?/${D}`, answer: n / d, visual: { type: 'fracbar', fracs: [{ n, d, label: `${n}/${d}` }, { n: n * k, d: D, label: `${n * k}/${D}` }] } as Visual, hint: `Each plank splits into ${lab(k, 'pieces')}: ${labn(n, 'lit plank')} ${n === 1 ? 'becomes' : 'become'} ${lab(n * k, 'lit pieces')}.`, steps: [`${lab(d, 'planks')} × ${lab(k, 'pieces per plank')} = ${lab(D, 'pieces')}`, `${labn(n, 'lit plank')} × ${lab(k, 'pieces per plank')} = ${lab(n * k, 'lit pieces')}`, `${n}/${d} (of the deck) = ${n * k}/${D} (of the deck): same length.`], difficulty: 3, fraction: true, answerText: `${n * k}/${D}` });
  return ask(q, 'fracbar', { model: { kind: 'fracbar', pieces: D, label: 'bridge deck' }, accept: [`${n * k}/${D}`], ask: `Light the same amount as ${lab(`${n}/${d}`, 'of the deck')}, using ${lab(D, 'equal planks')}.` });
}
export function whichFractionStep(rng: Rng): AskStep {
  const d = pick(rng, [3, 4, 5, 6]); const n = rint(rng, 1, d - 1);
  // neutral labels, assigned after the shuffle: a label reading "3/5" would give the answer away
  const decks = rng.shuffle([
    { visual: { type: 'fracbar', fracs: [{ n, d }] } as Visual, right: true },
    { visual: { type: 'fracbar', fracs: [{ n: Math.min(d, n + 1), d }] } as Visual, right: false },
    { visual: { type: 'fracbar', fracs: [{ n, d: d + 2 }] } as Visual, right: false },
  ]);
  const options = decks.map((o, i) => ({ visual: o.visual, label: `Deck ${'ABC'[i]}` }));
  const rightLabel = options[decks.findIndex((o) => o.right)].label;
  const q = pq('acad-whichfrac', 'frac', 'compare', { prompt: `Which deck shows ${n}/${d}? Same whole, ${d} equal planks, ${n} lit.`, expression: `Find ${n}/${d}`, answer: n / d, visual: { type: 'fracbar', fracs: [{ n, d }] } as Visual, hint: `Count the planks first: ${lab(d, 'equal planks')}. Then the lit ones: ${labn(n, 'lit plank')}.`, steps: [`${labn(n, 'lit plank')} out of ${lab(d, 'equal planks')}: ${n}/${d}.`], difficulty: 2, fraction: true, answerText: rightLabel });
  return ask(q, 'pickmodel', { options, accept: [rightLabel] });
}
export function compareFractionsStep(rng: Rng): AskStep {
  const n = 1; const a = pick(rng, [2, 3, 4]); let b = pick(rng, [3, 4, 5, 6, 8]); if (b === a) b = a + 1;
  const bigger = a < b ? `1/${a}` : `1/${b}`;
  const q = pq('acad-cmpfrac', 'frac', 'compare', { prompt: `Which is the bigger piece of the same log: 1/${a} or 1/${b}?`, expression: `1/${a} or 1/${b}?`, answer: a < b ? 1 / a : 1 / b, visual: { type: 'fracbar', fracs: [{ n, d: a, label: `1/${a}` }, { n, d: b, label: `1/${b}` }] } as Visual, hint: 'More cuts means smaller pieces.', steps: [`Cutting into ${lab(Math.max(a, b), 'equal pieces')} makes smaller pieces than cutting into ${lab(Math.min(a, b), 'equal pieces')}.`, `So ${bigger} (of the log) is bigger.`], difficulty: 2, fraction: true, answerText: bigger });
  return ask(q, 'choose', { choices: [`1/${a}`, `1/${b}`], accept: [bigger] });
}
export function addSameDenomStep(rng: Rng): AskStep {
  const d = pick(rng, [4, 5, 6, 8]); const a = rint(rng, 1, d - 2); const b = rint(rng, 1, d - a - 1);
  const [sn, sd] = simplify(a + b, d);
  const q = pq('acad-fracadd', 'frac', 'add', { prompt: `${a}/${d} of the path is mossy and ${b}/${d} is muddy. How much of the path is either?`, expression: `${a}/${d} + ${b}/${d} = ?`, answer: (a + b) / d, visual: { type: 'fracbar', fracs: [{ n: a, d }, { n: b, d }], op: '+' } as Visual, hint: 'Same-size pieces: add the counts, keep the size.', steps: [`Each piece is 1/${d} (of the path).`, `${labn(a, 'mossy piece')} + ${labn(b, 'muddy piece')} = ${lab(a + b, 'pieces either')}`, `${a}/${d} + ${b}/${d} = ${a + b}/${d}${sn !== a + b ? ` = ${sn}/${sd}` : ''} (of the path)`], difficulty: 3, fraction: true, answerText: `${a + b}/${d}` });
  return ask(q, 'type');
}
export function fractionOfStep(rng: Rng): AskStep {
  const d = pick(rng, [2, 3, 4, 5]); const n = rint(rng, 1, d - 1); const whole = d * rint(rng, 2, 6);
  const q = pq('acad-fracof', 'frac', 'multiply', { prompt: `Forage ${n}/${d} of the ${whole} mushrooms in the ring. "Of" means multiply.`, expression: `${n}/${d} of ${whole} = ?`, answer: (whole / d) * n, visual: { type: 'share', total: whole, groups: d }, hint: `Split ${lab(whole, 'mushrooms')} into ${lab(d, 'equal groups')}, then take ${labn(n, 'group')}.`, steps: [`${lab(whole, 'mushrooms')} ÷ ${lab(d, 'equal groups')} = ${lab(whole / d, 'mushrooms per group')}`, `${labn(n, 'group taken', 'groups taken')} × ${lab(whole / d, 'mushrooms per group')} = ${labn((whole / d) * n, 'mushroom to forage', 'mushrooms to forage')}`], difficulty: 3 });
  return ask(q, 'choose', { choices: numberChoices(rng, (whole / d) * n, 4, 3) });
}
export function unlikeDenomStep(rng: Rng): AskStep {
  const pairs: [number, number][] = [[2, 4], [3, 6], [2, 6], [4, 8], [2, 8]];
  const [d1, d2] = pick(rng, pairs); const a = 1; const b = rint(rng, 1, d2 - (d2 / d1) - 1);
  const sum = (a * d2) / d1 + b; const [sn, sd] = simplify(sum, d2);
  const q = pq('acad-unlike', 'frac', 'add-unlike', { prompt: `Creek crossing: ${a}/${d1} of the stones plus ${b}/${d2} more. Rename ${a}/${d1} in ${d2}ths first.`, expression: `${a}/${d1} + ${b}/${d2} = ?`, answer: sum / d2, visual: { type: 'fracbar', fracs: [{ n: a, d: d1 }, { n: b, d: d2 }], into: d2, op: '+' } as Visual, hint: `${a}/${d1} (of the stones) = ${(a * d2) / d1}/${d2} (of the stones).`, steps: [`${a}/${d1} (of the stones) = ${(a * d2) / d1}/${d2} (of the stones)`, `${labn((a * d2) / d1, ordinal(d2))} + ${labn(b, ordinal(d2))} = ${labn(sum, ordinal(d2))}`, `${(a * d2) / d1}/${d2} + ${b}/${d2} = ${sum}/${d2}${sn !== sum ? ` = ${sn}/${sd}` : ''} (of the stones)`], difficulty: 4, fraction: true, answerText: `${sum}/${d2}` });
  return ask(q, 'type');
}

/* ---------------- Ch.9 ratios ---------------- */
const MIXES: [string, string][] = [['oil', 'coolant'], ['sand', 'cement'], ['copper', 'tin'], ['red', 'blue']];
/** Cups of one part of a mix, labelled: cups(1, 'oil') = '1 (cup of oil)', cups(3, 'oil', ', first row') = '3 (cups of oil, first row)'. */
const cups = (n: number, x: string, tail = '') => labn(n, `cup of ${x}${tail}`, `cups of ${x}${tail}`);
export function ratioTableStep(rng: Rng): AskStep {
  const [x, y] = pick(rng, MIXES); const a = rint(rng, 1, 4); let b = rint(rng, 2, 5); if (b === a) b++;
  const k = rint(rng, 2, 6);
  const q = pq('acad-ratiotab', 'ratio', 'ratio-table', { prompt: `The lock mixes ${x}:${y} as ${a}:${b}. With ${a * k} ${x}, how much ${y} keeps the same mix?`, expression: `${a}:${b} → ${a * k}:?`, answer: b * k, visual: { type: 'ratio', parts: [{ label: x, n: a }, { label: y, n: b }], unit: 'cups', known: { label: x, amount: a * k }, ask: y } as Visual, hint: `${cups(a, x, ', first row')} → ${cups(a * k, x)} is × ${lab(k, 'scale factor')}. Do the same to ${cups(b, y, ', first row')}.`, steps: [`${cups(a * k, x)} ÷ ${cups(a, x, ', first row')} = ${lab(k, 'scale factor')}: the batch is ${k} times bigger.`, `${cups(b, y, ', first row')} × ${lab(k, 'scale factor')} = ${cups(b * k, y)}`], difficulty: 3 });
  return ask(q, 'ratiotable', { model: { kind: 'ratiotable', labels: [x, y], rows: [[a, b], [a * k, null]] }, accept: [String(b * k)], ask: `Fill the empty cell so every row keeps the ${a}:${b} mix.` });
}
export function partPartWholeStep(rng: Rng): AskStep {
  const [x, y] = pick(rng, MIXES); const a = rint(rng, 1, 4); let b = rint(rng, 1, 5); if (b === a) b++;
  const whole = a + b; const askPart = rng.next() < 0.5;
  const right = askPart ? `${a}/${whole}` : `${a}/${b}`;
  const q = pq('acad-ppw', 'ratio', 'part-whole', { prompt: askPart ? `${a} ${x} to ${b} ${y}. What fraction of the whole mix is ${x}?` : `${a} ${x} to ${b} ${y}. Written part:part, ${x} to ${y} is which fraction?`, expression: askPart ? `${x} : whole` : `${x} : ${y}`, answer: askPart ? a / whole : a / b, visual: { type: 'ratio', parts: [{ label: x, n: a }, { label: y, n: b }], unit: 'cups', known: { label: x, amount: a }, ask: y } as Visual, hint: `Part:part compares ${x} to ${y}. Part:whole compares ${x} to all ${whole} cups.`, steps: [`Whole: ${cups(a, x)} + ${cups(b, y)} = ${lab(whole, 'cups in the whole mix')}`, askPart ? `${x} is ${cups(a, x)} out of ${lab(whole, 'cups in all')}: ${a}/${whole}.` : `${x} to ${y} is ${cups(a, x)} to ${cups(b, y)}: ${a}:${b}, written ${a}/${b}.`], difficulty: 3, fraction: true, answerText: right });
  return ask(q, 'choose', { choices: rng.shuffle([`${a}/${whole}`, `${a}/${b}`, `${b}/${whole}`]), accept: [right] });
}
export function unitRateStep(rng: Rng): AskStep {
  const n = rint(rng, 2, 6); const per = rint(rng, 2, 9); const total = n * per;
  const q = pq('acad-unitrate', 'ratio', 'unit-rate', { prompt: `${n} barges carry ${total} crates in total, the same number each. Crates per barge?`, expression: `${total} ÷ ${n} = ?`, answer: per, visual: { type: 'share', total, groups: n }, hint: 'A unit rate is the amount for ONE.', steps: [`${lab(total, 'crates')} ÷ ${lab(n, 'barges')} = ${lab(per, 'crates per barge')}`], difficulty: 3 });
  return ask(q, 'type');
}

/* ---------------- Ch.10 proportions ---------------- */
export function scaleRecipeStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 5); const b = rint(rng, 3, 8); const k = rint(rng, 2, 5);
  const q = pq('acad-scale', 'ratio', 'scale', { prompt: `One batch of sealant is ${a} resin : ${b} hardener. The River lock needs ${k} batches. Hardener needed?`, expression: `${b} × ${k} = ?`, answer: b * k, visual: { type: 'ratio', parts: [{ label: 'resin', n: a }, { label: 'hardener', n: b }], unit: 'cups', known: { label: 'resin', amount: a * k }, ask: 'hardener' } as Visual, hint: `Scale every part by ${lab(k, 'batches')}.`, steps: [`${cups(a, 'resin', ' per batch')} × ${lab(k, 'batches')} = ${cups(a * k, 'resin')}`, `${cups(b, 'hardener', ' per batch')} × ${lab(k, 'batches')} = ${cups(b * k, 'hardener')}`], difficulty: 3 });
  return ask(q, 'ratiotable', { model: { kind: 'ratiotable', labels: ['resin', 'hardener'], rows: [[a, b], [a * k, null]] }, accept: [String(b * k)], ask: `Fill the row for ${lab(k, 'batches')}.` });
}
export function crossProductStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 6); const b = rint(rng, 3, 9); const k = rint(rng, 2, 4);
  const q = pq('acad-cross', 'ratio', 'proportion', { prompt: `${a}/${b} = ${a * k}/?. Equivalent ratios have equal cross products: ${a} × ? = ${b} × ${a * k}.`, expression: `${a}/${b} = ${a * k}/?`, answer: b * k, visual: { type: 'balance', left: `${a} × ?`, right: `${b} × ${a * k}`, unknown: '?' } as Visual, hint: `${lab(a, 'first top')} → ${lab(a * k, 'second top')} is × ${lab(k, 'scale factor')}, so ${lab(b, 'first bottom')} → ${lab(b * k, 'second bottom')}.`, steps: [`${lab(a * k, 'second top')} ÷ ${lab(a, 'first top')} = ${lab(k, 'scale factor')}`, `${lab(b, 'first bottom')} × ${lab(k, 'scale factor')} = ${lab(b * k, 'second bottom')}`, `Check: ${a} × ${b * k} = ${lab(a * b * k, 'cross product')} and ${b} × ${a * k} = ${lab(a * b * k, 'cross product')}. Equal, so the ratios match.`], difficulty: 4 });
  return ask(q, 'type');
}
export function scaleDrawingStep(rng: Rng): AskStep {
  const scale = pick(rng, [2, 4, 5, 10]); const drawn = rint(rng, 2, 9);
  const q = pq('acad-scaledraw', 'ratio', 'scale-drawing', { prompt: `The blueprint scale is 1 : ${scale}. A beam drawn ${drawn} cm long is how long for real?`, expression: `${drawn} × ${scale} = ?`, answer: drawn * scale, visual: { type: 'bar', bars: [{ label: 'drawing', parts: [drawn] }, { label: 'real', parts: Array(scale).fill(drawn) }] }, hint: `Every ${lab(1, 'cm drawn')} is ${lab(scale, 'cm for real')}.`, steps: [`1 : ${scale} means ${lab(1, 'cm drawn')} stands for ${lab(scale, 'cm for real')}.`, `${lab(drawn, 'drawn length in cm')} × ${lab(scale, 'scale factor')} = ${lab(drawn * scale, 'real length in cm')}`], difficulty: 3 });
  return ask(q, 'choose', { choices: numberChoices(rng, drawn * scale, 4, scale) });
}

/* ---------------- Ch.11 percent ---------------- */
type PercentPair = readonly [number, number, number];
const PERCENT_PAIRS: readonly PercentPair[] = [[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [1, 10, 10], [3, 10, 30]];

/** `done` names what the top counts: 'shaded', 'painted', 'polished'. */
function percentRenameSteps(n: number, d: number, done = 'shaded'): string[] {
  const factor = 100 / d; const p = n * factor;
  return [
    `Percent means out of 100. Make the bottom number 100.`,
    `${lab(100, 'hundredths')} ÷ ${lab(d, 'equal pieces')} = ${lab(factor, 'hundredths per piece')}, so ${lab(d, 'equal pieces')} × ${lab(factor, 'hundredths per piece')} = ${lab(100, 'hundredths')}.`,
    `Multiply the top by the same ${factor}: ${labn(n, `${done} piece`)} × ${lab(factor, 'hundredths per piece')} = ${lab(p, `${done} hundredths`)}.`,
    `Cut each of the ${d} original pieces into ${factor} equal smaller pieces. The ${done} amount stays the same.`,
    `${n}/${d} = (${n} × ${factor})/(${d} × ${factor}) = ${p}/100 = ${p}% (${done}).`,
  ];
}
const percentSolutionVisual = (n: number, d: number): Visual => ({ type: 'fracbar', fracs: [{ n, d }], into: 100 });

/** Three linked decisions with one fraction, before any independent conversion. */
export function percentBridgeWave(rng: Rng): AskStep[] {
  const [n, d, p] = pick(rng, [PERCENT_PAIRS[0], PERCENT_PAIRS[1], PERCENT_PAIRS[3]]);
  const factor = 100 / d;
  const source: Visual = { type: 'fracbar', fracs: [{ n, d }] };
  const steps = percentRenameSteps(n, d, 'painted');
  const bottom = pq('acad-pct-bottom', 'percent', 'make-hundred', {
    prompt: `${n}/${d} of a market sign is painted. Percent means out of 100; what number must ${lab(d, 'equal pieces')} be multiplied by to make ${lab(100, 'hundredths')}?`,
    expression: `${d} × ? = 100`, answer: factor, visual: source,
    hint: `Find the missing multiplier: ${lab(100, 'hundredths')} ÷ ${lab(d, 'equal pieces')}. The bottom counts all the equal pieces.`,
    steps: [`${lab(100, 'hundredths')} ÷ ${lab(d, 'equal pieces')} = ${lab(factor, 'hundredths per piece')}, so ${d} × ${factor} = 100.`, `Each original piece will split into ${factor} equal smaller pieces.`],
  });
  const top = pq('acad-pct-top', 'percent', 'same-factor', {
    prompt: `The bottom changes from ${lab(d, 'equal pieces')} to ${lab(100, 'hundredths')} by multiplying by ${lab(factor, 'hundredths per piece')}. Multiply the top by that SAME number to keep the same painted amount.`,
    expression: `${n}/${d} = ?/100`, answer: p, visual: source,
    hint: `The top counts the painted pieces. Work out ${labn(n, 'painted piece')} × ${lab(factor, 'hundredths per piece')}.`, steps,
  });
  top.solutionVisual = percentSolutionVisual(n, d);
  const read = pq('acad-pct-read', 'percent', 'read-hundredths', {
    prompt: `You renamed ${n}/${d} as ${p}/100. What percent means ${p} out of 100?`,
    expression: `${p}/100 = ?%`, answer: p,
    visual: { type: 'fracbar', fracs: [{ n: p, d: 100 }] },
    hint: 'The percent sign means out of 100. Read the top number when the bottom is 100.',
    steps: [`${p}/100 means ${lab(p, 'painted hundredths')} out of ${lab(100, 'hundredths')}.`, `That is written ${p}%.`, ...steps],
  });
  return [
    ask(bottom, 'choose', { choices: numberChoices(rng, factor, 4, 5) }),
    ask(top, 'table', { model: { kind: 'table', label: 'Use the same multiplier on top and bottom', cols: ['start', 'multiply by', 'new count'], rowLabels: ['top', 'bottom'], rows: [[n, `× ${factor}`, null], [d, `× ${factor}`, 100]] }, accept: [String(p)], ask: 'Fill the missing top number, then lock in.' }),
    ask(read, 'choose', { choices: numberChoices(rng, p, 4, 10) }),
  ];
}

export function percentOfStep(rng: Rng): AskStep {
  const pct = pick(rng, [10, 20, 25, 50, 75]); const of = pick(rng, [20, 40, 60, 80, 100]);
  const amount = (pct / 100) * of;
  const q = pq('acad-pctof', 'percent', 'percent-of', {
    prompt: `The market tariff is ${pct}% of ${of} coins. Shade ${pct}% on the dial to find it.`, expression: `${pct}% of ${of} = ?`, answer: amount,
    visual: { type: 'card', title: 'Find the part', lines: [`Whole: ${of} coins = 100%`, `Find ${pct}% of that whole.`, 'Part: ? coins'] },
    hint: `Percent means out of 100. On the dial, ${lab(of, 'total coins')} ÷ ${lab(20, 'equal segments')} = ${labn(of / 20, 'coin per segment', 'coins per segment')}.`,
    steps: [`${lab(`${pct}%`, 'share to take')} ÷ ${lab('5%', 'share per segment')} = ${lab(pct / 5, 'segments to shade')}`, `${lab(of, 'total coins')} ÷ ${lab(20, 'equal segments')} = ${labn(of / 20, 'coin per segment', 'coins per segment')}`, `${lab(pct / 5, 'shaded segments')} × ${labn(of / 20, 'coin per segment', 'coins per segment')} = ${labn(amount, 'coin')}`, `Check: ${lab(pct, 'percent number')} ÷ 100 = ${lab(pct / 100, 'decimal share')}, and ${lab(pct / 100, 'decimal share')} × ${lab(of, 'total coins')} = ${labn(amount, 'coin')}.`], difficulty: 3,
  });
  q.solutionVisual = { type: 'bar', bars: [{ label: 'whole', parts: [of] }, { label: `${pct}%`, parts: [amount] }] };
  return ask(q, 'percent', { model: { kind: 'percent', of, label: 'coins' }, accept: [String(amount)], ask: `Shade ${lab(`${pct}%`, 'tariff rate')} on the dial, then work out how many coins that is.` });
}
export function fracToPercentStep(rng: Rng, pair?: PercentPair): AskStep {
  const [n, d, p] = pair ?? pick(rng, PERCENT_PAIRS);
  const q = pq('acad-frac2pct', 'percent', 'convert', {
    prompt: `${n}/${d} of the plaques are polished. What percent is polished?`, expression: `${n}/${d} = ?%`, answer: p,
    visual: { type: 'fracbar', fracs: [{ n, d }] },
    hint: `First find ${lab(100, 'hundredths')} ÷ ${lab(d, 'equal pieces')}. Multiply BOTH the top and bottom by that number, then read the top as a percent.`,
    steps: percentRenameSteps(n, d, 'polished'), difficulty: 3,
  });
  q.solutionVisual = percentSolutionVisual(n, d);
  return ask(q, 'choose', { choices: numberChoices(rng, p, 4, 10) });
}
/** Different fractions from the bridge, with no completed target bar. */
export function percentIndependentWave(rng: Rng): AskStep[] {
  return rng.shuffle([PERCENT_PAIRS[2], PERCENT_PAIRS[4], PERCENT_PAIRS[6]]).map((pair) => fracToPercentStep(rng, pair));
}
export function percentChangeStep(rng: Rng): AskStep {
  const base = pick(rng, [20, 40, 50, 80, 100]); const pct = pick(rng, [10, 20, 25, 50]); const up = rng.next() < 0.5;
  const delta = (pct / 100) * base; const answer = up ? base + delta : base - delta;
  const q = pq('acad-pctchange', 'percent', up ? 'increase' : 'decrease', {
    prompt: `Engine tariff: ${base} coins, ${up ? 'raised' : 'cut'} by ${pct}%. New tariff?`, expression: `${base} ${up ? '+' : '−'} (${pct}% of ${base}) = ?`, answer,
    visual: { type: 'card', title: 'Find the new tariff', lines: [`Before: ${base} coins`, `${up ? 'Add' : 'Remove'} ${pct}% of the BEFORE amount.`, 'After: ? coins'] },
    hint: `Find ${lab(`${pct}%`, 'change')} of ${lab(base, 'coins before')} first, then ${up ? 'add' : 'subtract'} it. The base is the OLD amount.`,
    steps: [`${pct}% means ${pct}/100 (of the old tariff).`, `${pct}/100 × ${lab(base, 'coins before')} = ${labn(delta, 'coin of change', 'coins of change')}`, `${lab(base, 'coins before')} ${up ? '+' : '−'} ${labn(delta, 'coin of change', 'coins of change')} = ${lab(answer, 'coins after')}`], difficulty: 4,
  });
  q.solutionVisual = { type: 'bar', bars: [{ label: 'before', parts: [base] }, { label: 'after', parts: [answer] }] };
  return ask(q, 'type');
}
/** Typed Arcade practice keeps the same curriculum without instructions for an absent dial. */
export function percentPracticeQuestion(rng: Rng): Question {
  const q = pick(rng, [fracToPercentStep, percentOfStep, percentChangeStep])(rng).question;
  return { ...q, prompt: q.prompt.replace(/ Shade .*? on the dial to find it\./, '') };
}

/* ---------------- Ch.12 exponents ---------------- */
export function writePowerStep(rng: Rng): AskStep {
  const base = pick(rng, [2, 3, 5, 10]); const exp = rint(rng, 2, 4);
  const q = pq('acad-power', 'exponents', 'powers', { prompt: `The gauge multiplies by ${base}, ${exp} times: ${Array(exp).fill(base).join(' × ')}. Set the power tower.`, expression: `${Array(exp).fill(base).join(' × ')} = ${base}^?`, answer: exp, visual: { type: 'card', title: 'Power tower', lines: [`${Array(exp).fill(base).join(' × ')}`, `= ${base}^${exp} = ${base ** exp}`] } as Visual, hint: 'The exponent counts how many times the base is multiplied.', steps: [`${lab(base, 'base')} appears ${exp} times, so ${lab(exp, 'exponent')}: ${base}^${exp}.`, `${base}^${exp} = ${base ** exp}.`], difficulty: 3, answerText: `${base}^${exp}` });
  return ask(q, 'power', { model: { kind: 'power', bases: [2, 3, 5, 10], exps: [2, 3, 4, 5] }, accept: [`${base}^${exp}`], ask: `Set the base to ${lab(base, 'gauge multiplier')} and pick the right exponent.` });
}
export function evaluatePowerStep(rng: Rng): AskStep {
  const base = pick(rng, [2, 3, 4, 5]); const exp = rint(rng, 2, base > 3 ? 3 : 4);
  const q = pq('acad-evalpow', 'exponents', 'evaluate', { prompt: `Read the gauge: ${base}^${exp} means ${base} multiplied ${exp} times, NOT ${base} × ${exp}.`, expression: `${base}^${exp} = ?`, answer: base ** exp, visual: { type: 'card', title: `${base}^${exp}`, lines: [Array(exp).fill(base).join(' × ')] } as Visual, hint: `${Array(exp).fill(base).join(' × ')}.`, steps: [`${Array(exp).fill(base).join(' × ')} = ${base ** exp}.`], difficulty: 3 });
  return ask(q, 'choose', { choices: rng.shuffle([String(base ** exp), String(base * exp), String(base ** exp + base), String(base ** (exp + 1))].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 4) });
}
export function powerOfTenStep(rng: Rng): AskStep {
  const exp = rint(rng, 2, 5); const mant = pick(rng, [1, 2, 3, 4, 6, 7]);
  const q = pq('acad-pow10', 'exponents', 'powers-of-ten', { prompt: `Scale room: ${mant} × 10^${exp}. Every ×10 moves each digit one place left.`, expression: `${mant} × 10^${exp} = ?`, answer: mant * 10 ** exp, visual: { type: 'pvchart', value: String(mant), shift: exp } as Visual, hint: `10^${exp} is a 1 with ${exp} zeros: ${10 ** exp}.`, steps: [`10^${exp} = ${10 ** exp}.`, `${mant} × ${10 ** exp} = ${mant * 10 ** exp}.`], difficulty: 3 });
  return ask(q, 'type');
}

/* ---------------- Ch.13 roots ---------------- */
export function sideFromAreaStep(rng: Rng): AskStep {
  const s = rint(rng, 2, 12);
  const q = pq('acad-root', 'exponents', 'square-root', { prompt: `A square Forge panel has area ${s * s}. How long is one side?`, expression: `√${s * s} = ?`, answer: s, visual: { type: 'rect', w: s, h: s, unit: '', ask: 'area', grid: true } as Visual, hint: 'Which number times itself makes the area?', steps: [`${lab(s, 'side')} × ${lab(s, 'side')} = ${lab(s * s, 'area')}, so the side is ${s}.`, `Check by squaring: ${s}^2 = ${lab(s * s, 'area')}.`], difficulty: 3 });
  return ask(q, 'root', { model: { kind: 'root', area: s * s }, accept: [String(s)], ask: `Pick the side length whose square is ${lab(s * s, 'panel area')}.` });
}
export function estimateRootStep(rng: Rng): AskStep {
  const lo = rint(rng, 2, 9); const n = lo * lo + rint(rng, 1, 2 * lo);
  const right = `${lo} and ${lo + 1}`;
  const q = pq('acad-estroot', 'exponents', 'estimate-root', { prompt: `√${n} is not a whole number. Between which two whole numbers is it?`, expression: `√${n} ≈ ?`, answer: lo, visual: { type: 'card', title: 'Perfect squares', lines: [`${lo}² = ${lo * lo}`, `${lo + 1}² = ${(lo + 1) * (lo + 1)}`] } as Visual, hint: `${lo * lo} < ${n} < ${(lo + 1) * (lo + 1)}.`, steps: [`${lo}² = ${lo * lo} and ${lo + 1}² = ${(lo + 1) ** 2}.`, `${n} sits between them, so √${n} is between ${lo} and ${lo + 1}.`], difficulty: 4, answerText: right });
  return ask(q, 'choose', { choices: rng.shuffle([right, `${lo - 1} and ${lo}`, `${lo + 1} and ${lo + 2}`]), accept: [norm(right)] });
}
export function squareCheckStep(rng: Rng): AskStep {
  const s = rint(rng, 3, 12);
  const q = pq('acad-sq', 'exponents', 'square', { prompt: `Check a root by squaring: ${s}^2 = ?`, expression: `${s}^2 = ?`, answer: s * s, visual: { type: 'array', rows: s, cols: s }, hint: `${s} × ${s}.`, steps: [`${s} × ${s} = ${s * s}.`], difficulty: 2 });
  return ask(q, 'type');
}
export function cubeTeaserStep(rng: Rng): AskStep {
  const s = pick(rng, [2, 3, 4, 5]);
  const q = pq('acad-cube', 'exponents', 'cube-root', { prompt: `Bonus: a cube crate holds ${s ** 3} unit cubes. How long is each edge?`, expression: `∛${s ** 3} = ?`, answer: s, visual: { type: 'cubes', l: s, w: s, h: s }, hint: 'Edge × edge × edge = volume.', steps: [`${lab(s, 'edge')} × ${lab(s, 'edge')} × ${lab(s, 'edge')} = ${lab(s ** 3, 'unit cubes')}, so the edge is ${s}.`], difficulty: 4 });
  return ask(q, 'root', { model: { kind: 'root', area: s ** 3, cube: true }, accept: [String(s)], ask: `Pick the edge whose cube is ${lab(s ** 3, 'unit cubes')}.` });
}

/* ---------------- word problems / transfer ---------------- */
export function wordStep(rng: Rng, kind: WordKind, difficulty: Difficulty = 2): AskStep {
  return ask(wordProblem(kind, difficulty, rng), 'type');
}
export function transferFor(rng: Rng, chapter: number): AskStep {
  switch (chapter) {
    case 1: return rng.next() < 0.5 ? countStep(rng, 20) : compareStep(rng, 20);
    case 2: return rng.next() < 0.5 ? tensOnesStep(rng) : bundleStep(rng);
    case 3: return rng.next() < 0.5 ? wordStep(rng, 'add', 2) : partWholeStep(rng, rint(rng, 10, 20));
    case 4: return rng.next() < 0.5 ? wordStep(rng, 'sub', 2) : differenceStep(rng, 30);
    case 5: return rng.next() < 0.5 ? wordStep(rng, 'mult', 2) : groupsStep(rng, [3, 4, 6, 7, 8]);
    case 6: return rng.next() < 0.5 ? wordStep(rng, 'div', 2) : (rng.next() < 0.5 ? shareStep(rng, [3, 4, 6, 7]) : remainderStep(rng));
    case 7: return rng.next() < 0.5 ? whichEqualStep(rng) : inverseOpsStep(rng);
    case 8: return pick(rng, [fractionOfStep, addSameDenomStep, compareFractionsStep])(rng);
    case 9: return pick(rng, [ratioTableStep, unitRateStep, partPartWholeStep])(rng);
    case 10: return pick(rng, [crossProductStep, scaleDrawingStep, scaleRecipeStep])(rng);
    case 11: return pick(rng, [percentOfStep, percentChangeStep, fracToPercentStep])(rng);
    case 12: return pick(rng, [evaluatePowerStep, powerOfTenStep])(rng);
    case 13: return pick(rng, [sideFromAreaStep, estimateRootStep, squareCheckStep])(rng);
    default: return wordStep(rng, 'twostep', 3);
  }
}

export type ModelBuilder = (rng: Rng) => AskStep;
export const _internal = { pick, rint, ask, pq };
export type { ModelSpec };

