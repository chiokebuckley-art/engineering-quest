/**
 * The Pre-Algebra Academy (Algebra City). Builds on the Arithmetic Academy: integers on the number line,
 * integer operations and the sign rules (from patterns), the order of operations with powers and
 * negatives, variables and expressions, like terms and the distributive property (area model), one-
 * and two-step equations on the balance, one-step inequalities on the number line, the four-quadrant
 * coordinate plane, ratios, rates and unit rates with variables (graphed on the plane), and proportions
 * (cross-multiplying, non-unit scale drawings, percent as a proportion).
 * Graduation seats the Variable Core and opens the Algebra 1 Academy.
 */
import { defineAcademy, type ChapterSpec } from '../defs';
import {
  academySkill, mkq, typed, choose, nearMisses, model, ask, wave, times, mixOf, conceptFrom, oneOf, rint, pick, rnz, fmt,
  fmtSigned, coefTerm, polyStr, gcd,
  type QSpec, type Rng, type AskStep, type Question, type Visual,
} from '../kit';
import { lab, labn } from '../../label';

const ID = 'prealgebra';
const S = (key: string) => academySkill(ID, key);
/** A question builder bound to one chapter's skill and its engineering "where you meet it" line. */
const Q = (key: string, app: string) => (sub: string, o: QSpec) => mkq(S(key), sub, { app, ...o });

/* ---------------- shared helpers ---------------- */
/** Wrap negatives in brackets for use inside an expression: par(-3) → '(−3)'. */
const par = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
/** a·v + b, tidy: lin(3, -5) → '3x − 5', lin(1, 0) → 'x', lin(-1, 4) → '−x + 4'. */
const lin = (a: number, b: number, v = 'x') => polyStr([b, a], v);
/** Signed reading: +3 or −3 (zero plain). */
const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));
/** A labelled number, bracketed when negative so the sign stays honest: parl(-3, 'hop left') → '(−3 (hop left))'. */
const parl = (n: number | string, label: string) => (typeof n === 'number' ? (n < 0 ? `(${lab(fmt(n), label)})` : lab(fmt(n), label)) : lab(n, label));
/** A signed temperature with its label: deg(-4, 'start') → '−4° (start)'. */
const deg = (n: number, label: string) => lab(`${fmt(n)}°`, label);
const nl = (min: number, max: number, extra: Partial<Extract<Visual, { type: 'numline' }>> = {}): Visual => ({ type: 'numline', min, max, ...extra });
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });
const pt = (x: number, y: number) => `(${fmt(x)}, ${fmt(y)})`;
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
/** Pick-the-picture with lettered options (the letters follow the shuffled order, so A is not always right). */
function pickLettered(rng: Rng, q: Question, visuals: Visual[], rightIndex: number, describe: string): AskStep {
  const order = rng.shuffle(visuals.map((_, i) => i));
  const options = order.map((i, j) => ({ visual: visuals[i], label: LETTERS[j] }));
  const right = LETTERS[order.indexOf(rightIndex)];
  return ask({ ...q, answerText: `${right}: ${describe}` }, 'pickmodel', { options, accept: [right] });
}
const flipOp = (op: string) => ({ '<': '>', '>': '<', '≤': '≥', '≥': '≤' } as Record<string, string>)[op];
const toggleStrict = (op: string) => ({ '<': '≤', '>': '≥', '≤': '<', '≥': '>' } as Record<string, string>)[op];

/* =====================================================================================
 * 1. Integers & the number line
 * ===================================================================================== */
const K1 = 'integers';
const q1 = Q(K1, 'Engineers read gauges that run below zero: temperatures, depths, voltages and tide levels.');

function readIntStep(rng: Rng): AskStep {
  const n = rng.next() < 0.75 ? -rint(rng, 1, 10) : rint(rng, 1, 10); const m = Math.abs(n); const below = n < 0;
  const side = below ? 'below' : 'above';
  const F = pick(rng, [
    { text: `Volt's cryo-coil reads ${m}° ${side} zero.`, u: `degrees ${side} zero`, zero: 'zero degrees', what: 'coil reading' },
    { text: `Brick's lift cage stops ${m} m ${side} street level.`, u: `m ${side} street level`, zero: 'street level', what: 'cage level' },
    { text: `The canal gauge shows ${m} cm ${side} the zero mark.`, u: `cm ${side} the mark`, zero: 'zero mark', what: 'gauge reading' },
  ]); const frame = F.text;
  const q = q1('read', {
    prompt: `${frame} Tap that reading on the line.`, expression: `${m} ${below ? 'below' : 'above'} 0 = ?`, answer: n,
    hint: 'Zero is the reference. Below zero is to the left and wears a minus sign.',
    steps: [`${lab(m, F.u)} is written ${lab(fmt(n), F.what)}.`, `From 0 (${F.zero}), count ${m} to the ${below ? 'left' : 'right'}: ${lab(fmt(n), F.what)}.`],
    visual: nl(-10, 10), difficulty: 1,
  });
  return model(q, { kind: 'numberline', start: 0, min: -12, max: 12, label: 'Zero: street level, freezing point, the mark' }, [String(n)], `Start at ${lab(0, F.zero)}. Tap the reading.`);
}

function oppositeStep(rng: Rng): AskStep {
  const a = rnz(rng, -9, 9);
  const q = q1('opposite', {
    prompt: `Ada's survey peg sits at ${fmt(a)}. Its twin sits at the opposite: same distance from 0, other side.`,
    expression: `opposite of ${fmt(a)} = ?`, answer: -a,
    hint: 'Opposites are mirror images across 0.',
    steps: [`${lab(fmt(a), 'peg')} is ${labn(Math.abs(a), 'step from zero', 'steps from zero')} to the ${a < 0 ? 'left' : 'right'} of 0.`, `Go ${labn(Math.abs(a), 'step from zero', 'steps from zero')} to the ${a < 0 ? 'right' : 'left'} of 0 instead: ${lab(fmt(-a), 'twin peg')}.`],
    visual: nl(-10, 10, { points: [{ x: a, label: 'peg' }] }), difficulty: 1,
  });
  return model(q, { kind: 'numberline', start: a, min: -12, max: 12, label: `Peg at ${lab(fmt(a), 'first peg')}` }, [String(-a)], 'Tap where the twin peg goes.');
}

function compareIntStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 3);
  let a: number; let b: number;
  if (kind <= 1) { a = -rint(rng, 2, 12); do b = -rint(rng, 1, 12); while (b === a); }
  else if (kind === 2) { a = -rint(rng, 1, 9); b = rint(rng, 1, 5); }
  else { a = -rint(rng, 1, 9); b = 0; }
  if (rng.next() < 0.5) [a, b] = [b, a];
  const sym = a < b ? '<' : '>';
  const q = q1('compare', {
    prompt: `Two coolant lines read ${fmt(a)}° and ${fmt(b)}°. Which sign goes between them?`,
    expression: `${fmt(a)}  ?  ${fmt(b)}`, answer: a < b ? 0 : 1, answerText: `${fmt(a)} ${sym} ${fmt(b)}`,
    hint: 'Picture both on the number line. Further left means smaller, even when the digits look bigger.',
    steps: [`${deg(Math.min(a, b), 'colder line')} sits further left on the number line than ${deg(Math.max(a, b), 'warmer line')}.`, `So ${deg(a, 'first line')} ${sym} ${deg(b, 'second line')}.`],
    visual: nl(-12, 12),
  });
  return choose(rng, q, sym, [sym === '<' ? '>' : '<', '=']);
}

function orderIntStep(rng: Rng): AskStep {
  const set = new Set<number>([-rint(rng, 1, 9)]);
  while (set.size < 2) set.add(-rint(rng, 1, 12));
  set.add(rint(rng, 0, 12));
  while (set.size < 4) set.add(rint(rng, -12, 12));
  const xs = rng.shuffle([...set]);
  const str = (arr: number[]) => arr.map(fmt).join(', ');
  const asc = [...xs].sort((p, r) => p - r);
  const key = (p: number) => (p < 0 ? -100 + Math.abs(p) : p);
  const negFlip = [...xs].sort((p, r) => key(p) - key(r));
  const byAbs = [...xs].sort((p, r) => Math.abs(p) - Math.abs(r) || p - r);
  const q = q1('order', {
    prompt: `Brick's mine levels, in metres: ${str(xs)}. Order them from lowest to highest.`,
    expression: 'lowest → highest', answer: asc[0],
    hint: 'The more negative a level, the deeper it is.',
    steps: ['Lowest means furthest left on the number line: the most negative number.', `In order: ${lab(fmt(asc[0]), 'lowest level in m')}, ${fmt(asc[1])}, ${fmt(asc[2])}, ${lab(fmt(asc[3]), 'highest level in m')}.`],
    visual: nl(-12, 12),
  });
  const swapMid = [asc[0], asc[2], asc[1], asc[3]];
  return choose(rng, q, str(asc), [str(negFlip), str(byAbs), str([...asc].reverse()), str(swapMid)]);
}

function absStep(rng: Rng): AskStep {
  const a = -rint(rng, 2, 12); const b = rnz(rng, -9, 9);
  const [x, y] = rng.next() < 0.5 ? [a, b] : [b, a];
  const right = Math.abs(x) + Math.abs(y);
  const q = q1('abs', {
    prompt: `Two probes hang at ${fmt(x)} m and ${fmt(y)} m. Each cable is as long as its probe's distance from 0. Total cable?`,
    expression: `|${fmt(x)}| + |${fmt(y)}| = ?`, answer: right, unit: 'm',
    hint: 'Absolute value is a distance, and a distance is never negative.',
    steps: [`|${fmt(x)}| = ${lab(Math.abs(x), 'first cable in m')} and |${fmt(y)}| = ${lab(Math.abs(y), 'second cable in m')}: distances from 0.`, `${lab(Math.abs(x), 'first cable')} + ${lab(Math.abs(y), 'second cable')} = ${lab(right, 'total cable in m')}.`],
    visual: nl(-12, 12, { points: [{ x, label: fmt(x) }, { x: y, label: fmt(y) }] }),
  });
  // |x + y| or −right can collide with other options (e.g. |−2| + |−1|): extra candidates keep 3 distractors.
  return choose(rng, q, fmt(right), [fmt(x + y), fmt(-right), fmt(Math.abs(Math.abs(x) - Math.abs(y))), fmt(Math.abs(x + y)), fmt(-Math.abs(Math.abs(x) - Math.abs(y))), ...nearMisses(rng, right, 3)]);
}

function absPickStep(rng: Rng): AskStep {
  const d = rint(rng, 2, 8);
  const vs: Visual[] = [
    nl(-10, 10, { points: [{ x: -d }, { x: d }] }),
    nl(-10, 10, { points: [{ x: d }] }),
    nl(-10, 10, { points: [{ x: -d }] }),
    nl(-10, 10, { points: [{ x: 0 }, { x: d }] }),
  ];
  const q = q1('abs-pick', {
    prompt: `Ada needs every spot exactly ${d} m from the post at 0. Which line marks them all?`,
    expression: `|x| = ${d}`, answer: 0,
    hint: 'Distance from 0 can be measured in either direction.',
    steps: [`Both ${lab(d, 'right spot')} and ${lab(fmt(-d), 'left spot')} are ${d} m from 0 (the post).`, `So |x| = ${lab(d, 'm from the post')} has two answers: ${lab(fmt(-d), 'left spot')} and ${lab(d, 'right spot')}.`],
  });
  return pickLettered(rng, q, vs, 0, `dots at ${fmt(-d)} and ${d}`);
}

function closestToZeroStep(rng: Rng): AskStep {
  const names = rng.shuffle(['canal bed', 'pump pit', 'dock', 'tunnel', 'tower base']).slice(0, 3);
  const abs = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 3).sort((p, r) => p - r);
  // the closest one is often negative; the deepest one is a trap for "least = closest"
  const vals = [rng.next() < 0.7 ? -abs[0] : abs[0], rng.next() < 0.5 ? -abs[1] : abs[1], -abs[2]];
  const idx = rng.shuffle([0, 1, 2]);
  const listed = idx.map((i, j) => `the ${names[j]} at ${fmt(vals[i])} m`);
  const rightName = names[idx.indexOf(0)];
  const q = q1('closest', {
    prompt: `Sea level is 0. ${listed[0][0].toUpperCase()}${listed[0].slice(1)}, ${listed[1]}, ${listed[2]}. Which is closest to sea level?`,
    expression: 'closest to 0', answer: abs[0], answerText: `the ${rightName}`,
    hint: 'Closest to 0 means the smallest distance from 0, whichever side.',
    steps: [`Distances from 0 (sea level): ${idx.map((i, j) => lab(Math.abs(vals[i]), `m, ${names[j]}`)).join(', ')}.`, `The smallest is ${lab(abs[0], 'm from sea level')}: the ${rightName}.`],
  });
  return choose(rng, q, `the ${rightName}`, names.filter((n) => n !== rightName).map((n) => `the ${n}`));
}

/** Transfer: a comparison story with a claimed reason to judge, plus the gap between the two readings. */
function warmerClaimChoose(rng: Rng): AskStep {
  const a = rint(rng, 6, 15); const b = rint(rng, 2, a - 2);
  const [cold, warm] = rng.shuffle(['the north store', 'the south store', 'the ice vault', 'the cold room']).slice(0, 2);
  const listed = rng.next() < 0.5 ? [[cold, -a], [warm, -b]] as const : [[warm, -b], [cold, -a]] as const;
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  const q = q1('compare-story', {
    prompt: `Catalyst's freezer log: ${listed[0][0]} reads ${fmt(listed[0][1])}°C and ${listed[1][0]} reads ${fmt(listed[1][1])}°C. Brick says ${cold} is warmer "because ${a} is bigger than ${b}". Which is warmer, and by how many degrees?`,
    expression: `${fmt(-a)}  vs  ${fmt(-b)}`, answer: a - b, answerText: `${cap(warm)}, by ${a - b}°`,
    hint: 'Put both readings on a number line. Warmer is further right. The gap is the distance between them.',
    steps: [`${deg(-b, warm)} is to the right of ${deg(-a, cold)} on the number line, so ${warm} is warmer: Brick compared the digits, not the positions.`, `Gap: ${lab(a, 'colder, degrees below zero')} − ${lab(b, 'warmer, degrees below zero')} = ${lab(`${a - b}°`, 'warmer by')}.`],
    visual: nl(-16, 4),
  });
  return choose(rng, q, `${cap(warm)}, by ${a - b}°`, [`${cap(cold)}, by ${a - b}°`, `${cap(warm)}, by ${a + b}°`, `${cap(cold)}, by ${a + b}°`]);
}

function absTypedQ(rng: Rng): Question {
  const a = rnz(rng, -15, 15); const b = rnz(rng, -15, 15);
  return q1('abs', {
    prompt: 'Find each distance from zero, then add.', expression: `|${fmt(a)}| + |${fmt(b)}| = ?`, answer: Math.abs(a) + Math.abs(b),
    hint: 'Absolute value is distance from 0: never negative.',
    steps: [`|${fmt(a)}| = ${Math.abs(a)}, |${fmt(b)}| = ${Math.abs(b)}.`, `${Math.abs(a)} + ${Math.abs(b)} = ${Math.abs(a) + Math.abs(b)}.`],
  });
}

/* =====================================================================================
 * 2. Adding & subtracting integers
 * ===================================================================================== */
const K2 = 'int-add';
const q2 = Q(K2, 'Temperature swings, depth changes and voltage drops are all integer sums and differences.');

function addHopStep(rng: Rng): AskStep {
  let a = 0; let b = 0; let g = 0;
  do { a = rint(rng, -9, 9); b = rnz(rng, -9, 9); } while ((Math.abs(a + b) > 12 || (a >= 0 && b > 0)) && g++ < 60);
  const s = a + b; const dir = b < 0 ? 'left' : 'right';
  const q = q2('add', {
    prompt: `The reactor reads ${fmt(a)}°. It ${b < 0 ? 'cools' : 'warms'} by ${Math.abs(b)}°.`,
    expression: `${fmt(a)} + ${par(b)} = ?`, answer: s,
    hint: 'Adding a negative hops left; adding a positive hops right.',
    steps: [`Adding ${deg(b, b < 0 ? 'cooling' : 'warming')} is ${labn(Math.abs(b), `hop ${dir}`, `hops ${dir}`)}.`, `From ${deg(a, 'start reading')}, ${Math.abs(b)} ${dir} lands on ${deg(s, 'new reading')}.`, `${deg(a, 'start')} + ${b < 0 ? `(${deg(b, 'cooling')})` : deg(b, 'warming')} = ${deg(s, 'new reading')}.`],
    visual: nl(-12, 12, { points: [{ x: a, label: 'start' }] }),
  });
  return model(q, { kind: 'numberline', start: a, min: -12, max: 12, label: `Start at ${deg(a, 'start reading')}` }, [String(s)], `Start at ${deg(a, 'start reading')} and add ${deg(b, b < 0 ? 'cooling' : 'warming')}. Tap where you land.`);
}

function subHopStep(rng: Rng): AskStep {
  let a = 0; let b = 0; let g = 0;
  do { a = rint(rng, -9, 9); b = rng.next() < 0.65 ? -rint(rng, 1, 9) : rint(rng, 1, 9); } while (Math.abs(a - b) > 12 && g++ < 60);
  const s = a - b; const dir = -b < 0 ? 'left' : 'right';
  const q = q2('subtract', {
    prompt: `Vector chalks ${fmt(a)} − ${par(b)} on the gate. Rewrite it as adding the opposite, then hop.`,
    expression: `${fmt(a)} − ${par(b)} = ?`, answer: s,
    hint: 'Subtracting a number is the same as adding its opposite.',
    steps: [`Subtracting ${fmt(b)} is adding its opposite, ${fmt(-b)}.`, `${fmt(a)} − ${par(b)} = ${fmt(a)} + ${par(-b)}.`, `Hop ${labn(Math.abs(b), `step ${dir}`, `steps ${dir}`)} from ${lab(fmt(a), 'start')}: ${lab(fmt(s), 'landing point')}.`],
    visual: nl(-12, 12, { points: [{ x: a, label: 'start' }] }),
  });
  return model(q, { kind: 'numberline', start: a, min: -12, max: 12, label: `Start at ${fmt(a)}` }, [String(s)], `Start at ${fmt(a)}. Tap where ${fmt(a)} − ${par(b)} lands.`);
}

function subNegChoose(rng: Rng): AskStep {
  const a = rnz(rng, -9, 9); const b = rint(rng, 2, 9);
  const q = q2('sub-negative', {
    prompt: `Catalyst's mix sits at ${fmt(a)}°C. She removes a cold pack worth ${fmt(-b)}°. New temperature?`,
    expression: `${fmt(a)} − (${fmt(-b)}) = ?`, answer: a + b, unit: '°C',
    hint: 'Taking away cold leaves it warmer. Subtracting a negative adds its opposite.',
    steps: [`Removing the ${deg(-b, 'cold pack')} gives back ${lab(`${b}°`, 'warmth')}: subtracting ${fmt(-b)} is adding ${b}.`, `${deg(a, 'start')} − (${deg(-b, 'cold pack')}) = ${fmt(a)}° + ${b}° = ${deg(a + b, 'new temperature')}.`],
    visual: nl(-12, 18, { points: [{ x: a, label: 'now' }] }),
  });
  return choose(rng, q, fmt(a + b), [fmt(a - b), fmt(-a - b), fmt(-a + b), fmt(-(a + b))]);
}

function twoNegChoose(rng: Rng): AskStep {
  const a = rint(rng, 2, 9); const b = rint(rng, 2, 9);
  const q = q2('two-negatives', {
    prompt: `Brick's cage drops ${a} m, then ${b} m more. What is the total change?`,
    expression: `${fmt(-a)} + (${fmt(-b)}) = ?`, answer: -(a + b), unit: 'm',
    hint: 'Two drops in a row: both hops go left.',
    steps: [`Start at 0 (no change yet), hop ${lab(a, 'first drop in m')} left to ${lab(fmt(-a), 'change so far in m')}.`, `Hop ${lab(b, 'second drop in m')} more left: ${lab(fmt(-(a + b)), 'total change in m')}.`, 'Adding two negatives gives a bigger negative, never a positive.'],
    visual: nl(-18, 6, { jumps: [{ from: 0, to: -a }] }),
  });
  return choose(rng, q, fmt(-(a + b)), [fmt(a + b), fmt(b - a), fmt(a - b), fmt(-Math.abs(a - b))]);
}

function rewriteChoose(rng: Rng): AskStep {
  const a = rnz(rng, -9, 9); let b = rnz(rng, -9, 9); if (b === a) b = a > 0 ? -a : a - 1;
  const right = `${fmt(a)} + ${par(-b)}`;
  const q = q2('rewrite', {
    prompt: 'Vector\'s gate keypad only takes + signs. Which addition means the same as this subtraction?',
    expression: `${fmt(a)} − ${par(b)}`, answer: a - b,
    hint: 'Keep the first number. Change subtract to add, and change the second number to its opposite.',
    steps: [`${fmt(a)} − ${par(b)} = ${fmt(a)} + ${par(-b)}.`, `Both equal ${fmt(a - b)}.`],
  });
  return choose(rng, q, right, [`${fmt(a)} + ${par(b)}`, `${fmt(-a)} + ${par(-b)}`, `${fmt(b)} − ${par(a)}`]);
}

function jumpsPickStep(rng: Rng): AskStep {
  let a = 0; let b = 0; let g = 0;
  do { a = rnz(rng, -6, 6); b = rnz(rng, -6, 6); } while ((Math.abs(a + b) > 9 || Math.abs(a - b) > 9 || Math.abs(-a + b) > 9) && g++ < 60);
  const vis = (from: number, to: number): Visual => nl(-10, 10, { jumps: [{ from, to }], points: [{ x: from }] });
  const vs = [vis(a, a + b), vis(a, a - b), vis(-a, -a + b)];
  const q = q2('hops', {
    prompt: 'Volt sketches the reactor\'s swing for this sum. Which hop picture is right?', expression: `${fmt(a)} + ${par(b)}`, answer: a + b,
    hint: 'Start at the first number. The second number says which way and how far.',
    steps: [`The hop starts at ${lab(fmt(a), 'first number')}.`, `${b < 0 ? 'Adding a negative' : 'Adding a positive'}: hop ${labn(Math.abs(b), `step ${b < 0 ? 'left' : 'right'}`, `steps ${b < 0 ? 'left' : 'right'}`)} to ${lab(fmt(a + b), 'landing point')}.`],
  });
  return pickLettered(rng, q, vs, 0, `start ${fmt(a)}, hop ${Math.abs(b)} ${b < 0 ? 'left' : 'right'}`);
}

function zeroPairStep(rng: Rng): AskStep {
  const p = rint(rng, 2, 9); let n = rint(rng, 2, 9); if (n === p) n = p === 9 ? 8 : p + 1;
  const q = q2('zero-pairs', {
    prompt: `Volt drops ${p} positive and ${n} negative charges in a cell. Each + and − pair cancels to 0. What charge is left?`,
    expression: `${p} + (${fmt(-n)}) = ?`, answer: p - n,
    hint: 'Pair each + with a −. Only the unpaired charges are left.',
    steps: [`${lab(p, 'positive charges')} and ${lab(n, 'negative charges')}: ${labn(Math.min(p, n), 'zero pair')} cancel.`, `${labn(Math.abs(p - n), `${p > n ? 'positive' : 'negative'} charge`)} ${Math.abs(p - n) === 1 ? 'is' : 'are'} left: ${lab(fmt(p - n), 'net charge')}.`],
    visual: card('The cell', [Array(p).fill('+').join(' '), Array(n).fill('−').join(' ')]),
  });
  return typed(q);
}

function wordAddTyped(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2);
  if (kind === 0) {
    const d = 10 * rint(rng, 5, 15); const u = 5 * rint(rng, 2, d / 5 - 2);
    return typed(q2('word', {
      prompt: `A survey sub at ${fmt(-d)} m rises ${u} m. What does its depth gauge read now (sea level = 0)?`, expression: `${fmt(-d)} + ${u} = ?`, answer: -d + u, unit: 'm',
      hint: 'Rising is a positive change: hop right from the start.',
      steps: [`Start at ${lab(fmt(-d), 'starting depth in m')}, add ${lab(u, 'm risen')}.`, `${lab(fmt(-d), 'start')} + ${lab(u, 'rise')} = ${lab(fmt(-d + u), 'gauge reading in m')}.`],
    }));
  }
  if (kind === 1) {
    const t = -rint(rng, 3, 15); const r = rint(rng, 5, 20);
    return typed(q2('word', {
      prompt: `At dawn the bridge gauge read ${fmt(t)}°C. By noon it had risen ${r}°. Noon reading?`, expression: `${fmt(t)} + ${r} = ?`, answer: t + r, unit: '°C',
      hint: 'Start below zero and hop right by the rise.',
      steps: [r >= -t ? `${lab(`${-t}°`, 'up to zero')} of the ${lab(`${r}°`, 'rise')} gets back to 0${r > -t ? `; the other ${lab(`${r + t}°`, 'above zero')} goes above zero` : ''}.` : `The ${lab(`${r}°`, 'rise')} is not enough to get back to 0.`, `${deg(t, 'dawn')} + ${lab(`${r}°`, 'rise')} = ${deg(t + r, 'noon reading')}, in °C.`],
    }));
  }
  const hi = rint(rng, 2, 12); const lo = -rint(rng, 2, 12);
  return typed(q2('word', {
    prompt: `The kiln went from ${fmt(lo)}° at start-up to ${fmt(hi)}°. By how many degrees did it change?`, expression: `${fmt(hi)} − (${fmt(lo)}) = ?`, answer: hi - lo, unit: '°',
    hint: 'Change = end − start. Subtracting a negative adds.',
    steps: [`Change = ${deg(hi, 'end')} − (${deg(lo, 'start')}).`, `= ${hi}° + ${-lo}° = ${lab(`${hi - lo}°`, 'change')}.`],
  }));
}

function spanTyped(rng: Rng): AskStep {
  const h = rint(rng, 8, 40); const d = rint(rng, 5, 30);
  const q = q2('span', {
    prompt: `A crane tip is ${h} m above the dock (${signed(h)}). The pile it drives ends ${d} m below (${fmt(-d)}). How far from tip to pile base?`,
    expression: `${h} − (${fmt(-d)}) = ?`, answer: h + d, unit: 'm',
    hint: 'Distance between two heights is top minus bottom.',
    steps: [`Top − bottom = ${lab(h, 'tip height in m')} − (${lab(fmt(-d), 'pile base in m')}).`, `= ${lab(h, 'm above dock')} + ${lab(d, 'm below dock')} = ${lab(h + d, 'm from tip to base')}.`],
    visual: nl(-30, 40, { points: [{ x: h, label: 'tip' }, { x: -d, label: 'base' }] }),
  });
  return typed(q);
}

/** Transfer: two changes in a row, starting below zero. */
function liftTripTyped(rng: Rng): AskStep {
  let s = 0; let up = 0; let down = 0; let g = 0;
  do { s = -rint(rng, 10, 40); up = rint(rng, 15, 50); down = rint(rng, 10, 45); } while ((s + up <= 0 || s + up - down === 0) && g++ < 60);
  const mid = s + up; const end = mid - down;
  return typed(q2('two-changes', {
    prompt: `Brick's mine lift starts at ${fmt(s)} m (street level = 0). It rises ${up} m, then drops ${down} m. What level does the lift board show now?`,
    expression: `${fmt(s)} + ${up} + (${fmt(-down)}) = ?`, answer: end, unit: 'm',
    hint: 'Do the changes one at a time: rising hops right, dropping hops left.',
    steps: [`Rise: ${lab(fmt(s), 'start level in m')} + ${lab(up, 'm risen')} = ${lab(fmt(mid), 'level after rising')}.`, `Drop: ${lab(fmt(mid), 'level after rising')} + ${parl(-down, 'm dropped')} = ${lab(fmt(end), 'final level in m')}.`],
  }));
}

function intAddQ(rng: Rng): Question {
  const a = rnz(rng, -20, 20); const b = rnz(rng, -20, 20); const sub = rng.next() < 0.5;
  const ans = sub ? a - b : a + b;
  return q2(sub ? 'subtract' : 'add', {
    prompt: sub ? 'Subtract by adding the opposite.' : 'Add the integers.', expression: `${fmt(a)} ${sub ? '−' : '+'} ${par(b)} = ?`, answer: ans,
    hint: sub ? 'a − b = a + (opposite of b).' : 'Same signs: add and keep the sign. Different signs: subtract and take the sign of the larger distance.',
    steps: sub ? [`${fmt(a)} − ${par(b)} = ${fmt(a)} + ${par(-b)}.`, `= ${fmt(ans)}.`] : [`${fmt(a)} + ${par(b)} = ${fmt(ans)}.`],
  });
}

/* =====================================================================================
 * 3. Multiplying & dividing integers
 * ===================================================================================== */
const K3 = 'int-mult';
const q3 = Q(K3, 'Rates of change (litres per minute, degrees per hour) are signed, and the signs multiply.');

function patternTableStep(rng: Rng): AskStep {
  const k = rint(rng, 2, 9); const a = rng.next() < 0.65 ? -k : k;
  const rows: (number | string | null)[][] = [[`${fmt(a)} × 1`, a], [`${fmt(a)} × 0`, 0], [`${fmt(a)} × (−1)`, null], [`${fmt(a)} × (−2)`, null]];
  const q = q3('pattern', {
    prompt: 'Newton\'s pattern: each row multiplies by one less. Keep the pattern going.',
    expression: `${fmt(a)} × (−1), ${fmt(a)} × (−2)`, answer: -a, answerText: `${fmt(-a)}, ${fmt(-2 * a)}`,
    hint: 'Look at how the product changes from one row to the next.',
    steps: [`Each row down, the product ${a < 0 ? 'goes up' : 'goes down'} by ${k}: ${fmt(a)} → 0.`, `Keep going: 0 → ${fmt(-a)} → ${fmt(-2 * a)}.`, a < 0 ? 'So a negative times a negative is positive.' : 'So a positive times a negative is negative.'],
  });
  return model(q, { kind: 'table', cols: ['multiply', 'product'], rows, label: 'Fill the last two products.' }, [`${-a},${-2 * a}`], 'Continue the pattern down the table.');
}

function signRuleChoose(rng: Rng): AskStep {
  let a = -rint(rng, 2, 9); let b = rng.next() < 0.55 ? -rint(rng, 2, 9) : rint(rng, 2, 9);
  if (rng.next() < 0.5) [a, b] = [b, a];
  const p = a * b;
  const q = q3('sign-rule', {
    prompt: 'Newton\'s foundry stamp prints this product. Same signs stamp +, different signs stamp −. What does it print?',
    expression: `${par(a)} × ${par(b)} = ?`, answer: p,
    hint: 'Multiply the sizes, then decide the sign.',
    steps: [`${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(p)}.`, `${a < 0 && b < 0 ? 'Both negative: positive.' : 'One negative: negative.'} ${fmt(p)}.`],
  });
  // (−2) × (−2) collapses −p, a + b and −(|a| + |b|) to −4: fall back to other sign/size slips.
  return choose(rng, q, fmt(p), [fmt(-p), fmt(a + b), fmt(-(Math.abs(a) + Math.abs(b))), fmt(Math.abs(a) + Math.abs(b)), ...nearMisses(rng, -p, 3), ...nearMisses(rng, p, 3)]);
}

function signPredictStep(rng: Rng): AskStep {
  const fs = Array.from({ length: 4 }, () => rint(rng, 2, 9) * (rng.next() < 0.5 ? -1 : 1));
  if (!fs.some((f) => f < 0)) fs[rint(rng, 0, 3)] *= -1;
  const zero = rng.next() < 0.12; if (zero) fs[rint(rng, 0, 3)] = 0;
  const negs = fs.filter((f) => f < 0).length;
  const right = zero ? 'zero' : negs % 2 ? 'negative' : 'positive';
  const q = q3('sign-count', {
    prompt: 'Without multiplying it out: what sign does this product have?',
    expression: fs.map(par).join(' × '), answer: zero ? 0 : negs % 2 ? -1 : 1, answerText: right,
    hint: 'Negatives cancel in pairs. Count them.',
    steps: zero ? ['One factor is 0, so the whole product is 0.'] : [`There ${negs === 1 ? 'is 1 negative factor' : `are ${negs} negative factors`}.`, negs % 2 ? 'One negative is left unpaired, so the product is negative.' : 'The negatives pair off, so the product is positive.'],
  });
  return choose(rng, q, right, ['positive', 'negative', 'zero'].filter((x) => x !== right));
}

function divIntTyped(rng: Rng): AskStep {
  const per = -rint(rng, 2, 9); const n = rint(rng, 2, 8); const total = per * n;
  if (rng.next() < 0.5) {
    return typed(q3('divide', {
      prompt: `The tank level changed by ${fmt(total)} cm in ${n} minutes, the same each minute. Change per minute?`,
      expression: `${fmt(total)} ÷ ${n} = ?`, answer: per, unit: 'cm',
      hint: 'Division undoes multiplication: what times the minutes gives the total?',
      steps: [`${lab(n, 'minutes')} × ? (cm per minute) = ${lab(fmt(total), 'total change in cm')}.`, `${lab(n, 'minutes')} × ${parl(per, 'cm per minute')} = ${lab(fmt(total), 'total change in cm')}, so ${fmt(per)} cm each minute.`],
    }));
  }
  const d = rng.next() < 0.5 ? -n : n; const t = per * d;
  return typed(q3('divide', {
    prompt: 'Volt\'s cell tester shows a signed division. The sign rules are the same as for multiplying. What does it read?',
    expression: `${fmt(t)} ÷ ${par(d)} = ?`, answer: per,
    hint: 'Ask: which number times the divisor makes the dividend?',
    steps: [`${par(d)} × ${par(per)} = ${fmt(t)}.`, `So ${fmt(t)} ÷ ${par(d)} = ${fmt(per)}.`],
  }));
}

function repeatHopStep(rng: Rng): AskStep {
  const k = rint(rng, 2, 6); const n = rint(rng, 2, Math.min(5, Math.floor(20 / k)));
  const q = q3('groups', {
    prompt: `Brick lowers the cage ${k} m at a time, ${n} times, starting from street level (0).`,
    expression: `${n} × (${fmt(-k)}) = ?`, answer: -n * k, unit: 'm',
    hint: `${lab(n, 'lowerings')} of ${lab(fmt(-k), 'm each')}: hop the same amount each time.`,
    steps: [`${lab(n, 'lowerings')} × ${parl(-k, 'm per lowering')} means ${n} hops of ${k} to the left.`, `Cage levels in m: ${Array.from({ length: n }, (_, i) => fmt(-k * (i + 1))).join(', ')}.`, `The cage stops at ${lab(fmt(-n * k), 'final level in m')}.`],
  });
  return model(q, { kind: 'numberline', start: 0, min: -20, max: 5, label: 'Street level is 0 (metres)' }, [String(-n * k)], `Hop ${lab(n, 'lowerings')} of ${lab(fmt(-k), 'metres each')} from ${lab(0, 'street level')}. Tap where the cage stops.`);
}

function agoTyped(rng: Rng): AskStep {
  const k = rint(rng, 2, 9); const n = rint(rng, 2, 8);
  return typed(q3('neg-times-neg', {
    prompt: `A tank drains ${k} L a minute (rate ${fmt(-k)} L/min). ${n} minutes ago is time ${fmt(-n)} min. Compared with now, how much more or less water was in the tank then? Answer + for more, − for less.`,
    expression: `(${fmt(-k)}) × (${fmt(-n)}) = ?`, answer: k * n, unit: 'L', negative: true,
    hint: 'Change = rate × time. Decide the sign first: was there more water before the draining, or less?',
    steps: [`Change = rate × time = ${parl(-k, 'L per minute')} × ${parl(-n, 'minutes from now')}.`, `Negative × negative is positive: +${lab(k * n, 'L more then')}.`, `It makes sense: ${n} minutes ago the tank had not yet lost those ${k * n} L, so it held more.`],
  }));
}

/** n groups of −k as hops: pick the picture (the groups meaning, not the bare rule). */
function groupsPickStep(rng: Rng): AskStep {
  const n = rint(rng, 2, 4); let k = rint(rng, 2, n === 4 ? 3 : 4); if (n === 2 && k === 2) k = 3;
  const hops = (count: number, size: number) => Array.from({ length: count }, (_, i) => ({ from: i * size, to: (i + 1) * size }));
  const vs: Visual[] = [
    nl(-13, 13, { jumps: hops(n, -k) }),
    nl(-13, 13, { jumps: hops(n, k) }),
    nl(-13, 13, { jumps: [{ from: 0, to: -k }, { from: -k, to: -k - n }] }),
  ];
  const q = q3('groups-pick', {
    prompt: `Brick lowers the cage ${k} m at a time, ${n} times. Which hop picture shows ${n} × (${fmt(-k)})?`,
    expression: `${n} × (${fmt(-k)})`, answer: -n * k,
    hint: `${n} × (${fmt(-k)}) means ${lab(n, 'lowerings')} of ${lab(fmt(-k), 'm each')}: the same hop, ${n} times.`,
    steps: [`Each hop is ${lab(fmt(-k), 'm per lowering')}: ${k} to the left.`, `${lab(n, 'lowerings')} from 0 (street level): ${Array.from({ length: n }, (_, i) => fmt(-k * (i + 1))).join(', ')}.`, `${lab(n, 'lowerings')} × ${parl(-k, 'm each')} = ${lab(fmt(-n * k), 'cage level in m')}.`],
  });
  return pickLettered(rng, q, vs, 0, `${n} hops of ${fmt(-k)}, landing on ${fmt(-n * k)}`);
}

/** Transfer: a signed rate over time added to a starting reading. */
function freezerTyped(rng: Rng): AskStep {
  const start = rint(rng, 2, 12); const r = rint(rng, 2, 5); let h = rint(rng, 2, 6); if (start - r * h === 0) h += 1;
  const end = start - r * h;
  return typed(q3('rate-times-time', {
    prompt: `Catalyst's freezer starts at ${start}°C and cools ${r}° every hour (${fmt(-r)}° per hour). What does it read after ${h} hours?`,
    expression: `${start} + ${h} × (${fmt(-r)}) = ?`, answer: end, unit: '°C',
    hint: 'Work out the total change (hours × rate, signs included), then add it to the start.',
    steps: [`Change: ${lab(h, 'hours')} × (${deg(-r, 'per hour')}) = ${deg(-r * h, 'total change')}.`, `${deg(start, 'start')} + (${deg(-r * h, 'total change')}) = ${deg(end, 'final reading')}, in °C.`],
  }));
}

function avgChangeTyped(rng: Rng): AskStep {
  const m = rnz(rng, -4, 3); let vals: number[] = []; let g = 0;
  do { vals = Array.from({ length: 4 }, () => rnz(rng, -8, 8)); vals.push(5 * m - vals.reduce((s, v) => s + v, 0)); } while ((Math.abs(vals[4]) > 12 || vals[4] === 0) && g++ < 80);
  if (Math.abs(vals[4]) > 12 || vals[4] === 0) vals = [m - 2, m + 3, m - 4, m + 1, m + 2];
  const sum = vals.reduce((s, v) => s + v, 0);
  return typed(q3('average', {
    prompt: `Over 5 days the reservoir changed by ${vals.map(signed).join(', ')} cm. What was the average change per day?`,
    expression: `(${vals.map(signed).join(' ')}) ÷ 5 = ?`, answer: sum / 5, unit: 'cm',
    hint: 'Add all the changes (signs matter), then share the total over the days.',
    steps: [`Total: ${vals.map(signed).join(' ')} = ${lab(fmt(sum), 'total change in cm')}.`, `${lab(fmt(sum), 'total change in cm')} ÷ ${lab(5, 'days')} = ${lab(fmt(sum / 5), 'cm per day')}.`],
  }));
}

function intMultQ(rng: Rng): Question {
  const a = rnz(rng, -12, 12); const b = rnz(rng, -9, 9);
  if (rng.next() < 0.5) return q3('multiply', { prompt: 'Multiply.', expression: `${par(a)} × ${par(b)} = ?`, answer: a * b, hint: 'Same signs: positive. Different signs: negative.', steps: [`${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}, sign ${a * b < 0 ? 'negative' : 'positive'}: ${fmt(a * b)}.`] });
  return q3('divide', { prompt: 'Divide.', expression: `${fmt(a * b)} ÷ ${par(b)} = ?`, answer: a, hint: 'Which number times the divisor gives the dividend?', steps: [`${par(b)} × ${par(a)} = ${fmt(a * b)}, so the quotient is ${fmt(a)}.`] });
}

/* =====================================================================================
 * 4. Order of operations
 * ===================================================================================== */
const K4 = 'order';
const q4 = Q(K4, 'Every spreadsheet, calculator and control program follows the same order of operations.');

function evalTimesChoose(rng: Rng): AskStep {
  const a = rint(rng, 2, 12); const b = rint(rng, 2, 6); const c = rint(rng, 2, 6); const plus = rng.next() < 0.5;
  const ans = plus ? a + b * c : a - b * c;
  const q = q4('times-first', {
    prompt: `The pressure panel shows this expression. What does it read?`,
    expression: `${a} ${plus ? '+' : '−'} ${b} × ${c}`, answer: ans,
    hint: 'Multiplication binds tighter than + and −.',
    steps: [`Multiply first: ${b} × ${c} = ${b * c}.`, `${a} ${plus ? '+' : '−'} ${b * c} = ${fmt(ans)}.`],
  });
  return choose(rng, q, fmt(ans), [fmt(plus ? (a + b) * c : (a - b) * c), fmt(plus ? a + b + c : a - b + c), fmt(plus ? a * b + c : b * c - a)]);
}

function powerChoose(rng: Rng): AskStep {
  const b = rint(rng, 2, 4); const c = rint(rng, 3, 4); const a = rint(rng, 10, 40); const ans = a - b * c * c;
  const q = q4('power-first', {
    prompt: 'Volt\'s load formula. Evaluate it in the right order.',
    expression: `${a} − ${b} × ${c}²`, answer: ans,
    hint: 'Powers come before multiplying, and multiplying before subtracting.',
    steps: [`Power: ${c}² = ${c * c}.`, `Multiply: ${b} × ${c * c} = ${b * c * c}.`, `Subtract: ${a} − ${b * c * c} = ${fmt(ans)}.`],
  });
  return choose(rng, q, fmt(ans), [fmt((a - b) * c * c), fmt(a - (b * c) ** 2), fmt(a - b * 2 * c)]);
}

function negSquareChoose(rng: Rng): AskStep {
  // k starts at 3: for k = 2, 2k = k² and the "doubled" distractors would collapse into the answer.
  const k = rint(rng, 3, 9); const inside = rng.next() < 0.5;
  const ans = inside ? k * k : -k * k;
  const q = q4('neg-square', {
    prompt: 'Careful: does the square grab the minus sign too?',
    expression: inside ? `(−${k})² = ?` : `−${k}² = ?`, answer: ans,
    hint: 'A power applies only to what it touches. Brackets decide what it touches.',
    steps: inside ? [`The brackets put the minus inside: (−${k}) × (−${k}).`, `Negative × negative is positive: ${k * k}.`] : [`The square touches only the ${k}: −${k}² = −(${k} × ${k}).`, `= ${fmt(-k * k)}.`],
  });
  return choose(rng, q, fmt(ans), [fmt(-ans), fmt(inside ? 2 * k : -2 * k), fmt(inside ? -2 * k : 2 * k)]);
}

function layerTableStep(rng: Rng): AskStep {
  let rowLabels: string[]; let vals: number[]; let expr: string;
  if (rng.next() < 0.5) {
    const b = rint(rng, 2, 5); const c = rint(rng, 2, 4); const a = rint(rng, 5, 30);
    expr = `${a} − ${b} × ${c}²`; rowLabels = [`${c}²`, `${b} × ${c}²`, expr]; vals = [c * c, b * c * c, a - b * c * c];
  } else {
    const p = -rint(rng, 3, 9); const qq = rint(rng, 1, 8); const r = rint(rng, 2, 5); const s = rint(rng, 2, 6);
    const inner = `${fmt(p)} + ${qq}`; expr = `(${inner})² − ${r} × ${s}`;
    rowLabels = [inner, `(${inner})²`, `${r} × ${s}`, expr]; vals = [p + qq, (p + qq) ** 2, r * s, (p + qq) ** 2 - r * s];
  }
  const q = q4('layers', {
    prompt: 'Trace it like Volt traces a circuit: innermost part first, one layer at a time.',
    expression: expr, answer: vals[vals.length - 1], answerText: vals.map(fmt).join(', '),
    hint: 'Brackets, then powers, then × and ÷, then + and −.',
    steps: rowLabels.map((l, i) => `${l} = ${fmt(vals[i])}`),
  });
  return model(q, { kind: 'table', cols: ['value'], rowLabels, rows: vals.map(() => [null]), label: 'Fill each layer.' }, [vals.join(',')], 'Fill in the value of each layer, top to bottom.');
}

function parensChoose(rng: Rng): AskStep {
  let a = 0; let b = 0; let c = 0; let d = 0; let forms: { s: string; v: number }[] = []; let target = 0; let g = 0;
  do {
    a = rint(rng, 2, 6); b = rint(rng, 2, 6); c = rint(rng, 3, 7); d = rint(rng, 1, c - 1);
    forms = [
      { s: `${a} + ${b} × ${c} − ${d}`, v: a + b * c - d },
      { s: `(${a} + ${b}) × ${c} − ${d}`, v: (a + b) * c - d },
      { s: `${a} + ${b} × (${c} − ${d})`, v: a + b * (c - d) },
      { s: `(${a} + ${b}) × (${c} − ${d})`, v: (a + b) * (c - d) },
    ];
    target = rint(rng, 1, 3);
  } while (forms.filter((f) => f.v === forms[target].v).length > 1 && g++ < 60);
  const T = forms[target].v;
  const q = q4('brackets', {
    prompt: `Ada needs the gauge to read ${T}. Where do the brackets go?`,
    expression: `${a} + ${b} × ${c} − ${d}  →  make ${T}`, answer: T,
    hint: 'Try each placing and work it out in order: brackets first.',
    steps: [`${forms[target].s}: work the brackets first.`, `It gives ${lab(T, 'target reading')}.`, ...forms.filter((_, i) => i !== target).map((f) => `${f.s} = ${f.v}`)],
  });
  return choose(rng, q, forms[target].s, forms.filter((f, i) => i !== target && f.v !== T).map((f) => f.s));
}

function orderLineStep(rng: Rng): AskStep {
  const a = rint(rng, 1, 9); let b = 0; let c = 0;
  do { b = rint(rng, 2, 5); c = rint(rng, 2, 5); } while (a - b * c < -20);
  const neg = rng.next() < 0.5;
  const expr = neg ? `${a} + (${fmt(-b)}) × ${c}` : `${a} − ${b} × ${c}`;
  const ans = a - b * c;
  const q = q4('order-line', {
    prompt: `The gauge needle starts at ${a}. The × part is one grouped move: ${c} hops of ${fmt(-b)}. Evaluate ${expr} on the gauge.`,
    expression: expr, answer: ans,
    hint: `${neg ? `(${fmt(-b)}) × ${c}` : `${b} × ${c}`} is ${c} hops of ${neg ? fmt(-b) : b} bundled into one move. Make the whole move from ${lab(a, 'start')}; do not add ${a} to anything first.`,
    steps: [neg ? `(${fmt(-b)}) × ${c} is ${lab(c, 'hops')} of ${lab(fmt(-b), 'each hop')}: one move of ${lab(fmt(-b * c), 'grouped move')}.` : `− ${b} × ${c} takes away ${c} groups of ${b}: ${lab(c, 'hops')} of ${lab(fmt(-b), 'each hop')}, one move of ${lab(fmt(-b * c), 'grouped move')}.`, `From ${lab(a, 'start')}, move ${b * c} left: ${lab(a, 'start')} + ${parl(-b * c, 'grouped move')} = ${lab(fmt(ans), 'landing point')}.`, 'The × is done first because it is a single grouped move, not something added to the start.'],
  });
  return model(q, { kind: 'numberline', start: a, min: -20, max: 10, label: `Start at ${lab(a, 'needle start')}` }, [String(ans)], `Start at ${lab(a, 'needle start')}. Make ${lab(c, 'hops')} of ${lab(fmt(-b), 'each hop')}, then tap where you land.`);
}

function wordToOrderChoose(rng: Rng): AskStep {
  const packs = rint(rng, 2, 6); const per = rint(rng, 3, 9);
  // have = per would make the distractor have × packs + per equal the true total.
  let have = rint(rng, 2, 12); while (have === per) have = rint(rng, 2, 12);
  const q = q4('write', {
    prompt: `Ada has ${have} bolts and buys ${packs} packs of ${per}. Which expression gives her total?`,
    expression: 'total bolts', answer: have + packs * per,
    hint: 'The packs are multiplied first; then add what she already had.',
    steps: [`${lab(packs, 'packs')} × ${lab(per, 'bolts per pack')} = ${lab(packs * per, 'bolts bought')}.`, `${lab(have, 'bolts she had')} + ${lab(packs, 'packs')} × ${lab(per, 'bolts per pack')} = ${lab(have + packs * per, 'total bolts')}. No brackets needed: × comes first.`],
  });
  return choose(rng, q, `${have} + ${packs} × ${per}`, [`(${have} + ${packs}) × ${per}`, `${have} × ${packs} + ${per}`, `${have} + ${packs} + ${per}`]);
}

/** Equal-rank operations side by side: × with ÷, or − with +. The trap is "always × before ÷ / + before −". */
function sameRankChoose(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const b = rint(rng, 2, 5); const c = rint(rng, 2, 4); const m = rint(rng, 2, 3); const a = b * c * m; const q = c * m; const ans = q * c;
    const qq = q4('left-to-right', {
      prompt: `Vector's flow panel shows this expression. What does it read?`,
      expression: `${a} ÷ ${b} × ${c}`, answer: ans,
      hint: '× and ÷ rank equal. Neither goes first: work them from left to right.',
      steps: [`÷ and × have the same rank, so go left to right.`, `${a} ÷ ${b} = ${q}.`, `${q} × ${c} = ${ans}.`, `Doing the × first (${a} ÷ ${b * c} = ${m}) breaks the left-to-right rule.`],
    });
    return choose(rng, qq, fmt(ans), [fmt(m), fmt(q + c), fmt(q - c)]);
  }
  const a = rint(rng, 12, 25); const b = rint(rng, 4, 9); let c = rint(rng, 2, 6); if (c === b) c = b === 6 ? 5 : 6;
  const ans = a - b + c;
  const qq = q4('left-to-right', {
    prompt: `Brick's crate counter shows this expression. What does it read?`,
    expression: `${a} − ${b} + ${c}`, answer: ans,
    hint: '+ and − rank equal. Neither goes first: work them from left to right.',
    steps: ['− and + have the same rank, so go left to right.', `${a} − ${b} = ${a - b}.`, `${a - b} + ${c} = ${ans}.`, `Adding first (${a} − ${b + c} = ${a - b - c}) breaks the left-to-right rule.`],
  });
  return choose(rng, qq, fmt(ans), [fmt(a - b - c), fmt(a + b + c), fmt(a + b - c)]);
}

/** Transfer: write the expression for a two-stage bill (products added, no brackets needed). */
function pumpBillChoose(rng: Rng): AskStep {
  const h1 = rint(rng, 2, 5); const r1 = rint(rng, 6, 12); const h2 = rint(rng, 2, 5); let r2 = rint(rng, 3, 9); if (r2 === r1) r2 = r1 - 1;
  const v = h1 * r1 + h2 * r2; const right = `${h1} × ${r1} + ${h2} × ${r2}`;
  const wrong = [
    { s: `(${h1} + ${h2}) × (${r1} + ${r2})`, v: (h1 + h2) * (r1 + r2) },
    { s: `${h1} × (${r1} + ${h2}) × ${r2}`, v: h1 * (r1 + h2) * r2 },
    { s: `${h1} × ${r1} + ${h2} + ${r2}`, v: h1 * r1 + h2 + r2 },
    { s: `${h1} + ${r1} × ${h2} + ${r2}`, v: h1 + r1 * h2 + r2 },
  ].filter((w) => w.v !== v).map((w) => w.s);
  const q = q4('write-bill', {
    prompt: `Ada hires a pump: ${h1} h on the fast stage at $${r1} an hour, then ${h2} h on the slow stage at $${r2} an hour. Which expression gives the whole bill?`,
    expression: 'whole bill ($)', answer: v, answerText: right,
    hint: 'Each stage costs hours × rate. Then add the two stages.',
    steps: [`Fast stage: ${lab(h1, 'hours')} × ${lab(r1, 'dollars per hour')} = ${lab(h1 * r1, 'dollars')}.`, `Slow stage: ${lab(h2, 'hours')} × ${lab(r2, 'dollars per hour')} = ${lab(h2 * r2, 'dollars')}.`, `${lab(h1 * r1, 'fast dollars')} + ${lab(h2 * r2, 'slow dollars')} = ${lab(v, 'dollars, whole bill')}. That is ${right}: no brackets needed, both × are done before the +.`],
  });
  return choose(rng, q, right, wrong);
}

function orderQ(rng: Rng): Question {
  const a = rint(rng, 2, 6); const b = rint(rng, 1, 5); let c = rint(rng, 2, 4); if (c === b) c = b + 2; const d = rint(rng, 2, 9);
  const ans = a * (b - c) ** 2 - d;
  return q4('evaluate', {
    prompt: 'Evaluate: brackets, powers, ×, then −.', expression: `${a} × (${b} − ${c})² − ${d}`, answer: ans,
    hint: 'Brackets first, then the power.',
    steps: [`${b} − ${c} = ${fmt(b - c)}.`, `(${fmt(b - c)})² = ${(b - c) ** 2}.`, `${a} × ${(b - c) ** 2} = ${a * (b - c) ** 2}.`, `${a * (b - c) ** 2} − ${d} = ${fmt(ans)}.`],
  });
}

/* =====================================================================================
 * 5. Variables & expressions
 * ===================================================================================== */
const K5 = 'expressions';
const q5 = Q(K5, 'Formulas are expressions with variables: an engineer plugs in the numbers of the day.');

function evalExprStep(rng: Rng): AskStep {
  let a = rnz(rng, -6, 6); if (Math.abs(a) < 2) a = a < 0 ? -3 : 3;
  const b = rnz(rng, -9, 9); const v = rnz(rng, -5, 5);
  const e = lin(a, b); const ans = a * v + b;
  return typed(q5('evaluate', {
    prompt: `Brick's load formula is ${e}. Find its value when x = ${fmt(v)}.`,
    expression: `${e}, x = ${fmt(v)}`, answer: ans,
    hint: 'Put the number in place of x, in brackets if it is negative. Then multiply before you add.',
    steps: [`Replace x: ${fmt(a)} × ${par(v)} ${fmtSigned(b)}.`, `${fmt(a * v)} ${fmtSigned(b)} = ${fmt(ans)}.`],
  }));
}

function evalTableStep(rng: Rng): AskStep {
  let a = rnz(rng, -5, 5); if (Math.abs(a) < 2) a = 2;
  const b = rnz(rng, -6, 6); const start = rint(rng, -2, -1);
  const xs = [start, start + 1, start + 2, start + 3]; const ys = xs.map((x) => a * x + b);
  const e = lin(a, b);
  const q = q5('table', {
    prompt: `Fill Ada's table for the rule ${e}.`, expression: `x → ${e}`, answer: ys[1], answerText: ys.slice(1).map(fmt).join(', '),
    hint: 'Each row: replace x with that row\'s number.',
    steps: xs.slice(1).map((x, i) => `x = ${fmt(x)}: ${fmt(a)} × ${par(x)} ${fmtSigned(b)} = ${fmt(ys[i + 1])}.`),
  });
  return model(q, { kind: 'table', cols: ['x', e], rows: xs.map((x, i) => [x, i === 0 ? ys[0] : null]), label: `Rule: ${e}` }, [ys.slice(1).join(',')], 'Fill in the missing outputs.');
}

function concatChoose(rng: Rng): AskStep {
  const a = rint(rng, 2, 9); let n = rint(rng, 2, 9); if (a === 2 && n === 2) n = 3;
  const q = q5('meaning', {
    prompt: `The crate label says ${a}n. If n = ${n}, what is ${a}n?`,
    expression: `${a}n, n = ${n}`, answer: a * n,
    hint: 'A number written right next to a letter means multiply.',
    steps: [`${a}n means ${a} × n.`, `${a} × ${n} = ${a * n}.`],
  });
  return choose(rng, q, String(a * n), [`${a}${n}`, String(a + n), `${n}${a}`]);
}

function wordsToExprChoose(rng: Rng): AskStep {
  // m ≠ k, or the distractor n/(k − m) divides by zero.
  const k = rint(rng, 2, 9); let m = rint(rng, 2, 9); if (m === k) m = k === 9 ? 8 : k + 1;
  const T = pick(rng, [
    { words: `${k} less than n`, right: `n − ${k}`, wrong: [`${k} − n`, `n + ${k}`, `${k}n`], why: `Start with n, then take ${k} away.` },
    { words: `${k} more than twice n`, right: `2n + ${k}`, wrong: [`2(n + ${k})`, `${k}n + 2`, `n + 2 + ${k}`], why: `Twice n is 2n; ${k} more adds ${k}.` },
    { words: `twice the sum of n and ${k}`, right: `2(n + ${k})`, wrong: [`2n + ${k}`, `n + 2 × ${k}`, `2 + n + ${k}`], why: 'The sum comes first, so it needs brackets; then double it.' },
    { words: `n divided by ${k}, then minus ${m}`, right: `n/${k} − ${m}`, wrong: [`${k}/n − ${m}`, `n/(${k} − ${m})`, `${m} − n/${k}`], why: `Divide n by ${k} first, then subtract ${m}.` },
    { words: `the product of ${k} and n, decreased by ${m}`, right: `${k}n − ${m}`, wrong: [`${k}(n − ${m})`, `${m} − ${k}n`, `${k} + n − ${m}`], why: `Product means multiply: ${k}n. Decreased by ${m} subtracts ${m} from it.` },
  ]);
  const q = q5('words', {
    prompt: `Vector reads the spec aloud: "${T.words}". Which expression matches?`,
    expression: `"${T.words}"`, answer: k, answerText: T.right,
    hint: 'Ask what you start with, and what happens to it, in order.',
    steps: [T.why, `"${T.words}" is ${T.right}.`],
  });
  return choose(rng, q, T.right, T.wrong);
}

/** The chapter's named misconception on purpose: "k less than n" is n − k, never k − n. */
function lessThanExprChoose(rng: Rng): AskStep {
  const k = rint(rng, 2, 9);
  const T = pick(rng, [
    { w: `${k} less than n`, first: true, why: `"Less than n" means start at n, then take ${k} away.` },
    { w: `${k} fewer than n`, first: true, why: `"Fewer than n" means start at n and have ${k} fewer.` },
    { w: `n decreased by ${k}`, first: false, why: `Start with n; decreasing it takes ${k} away.` },
    { w: `${k} subtracted from n`, first: true, why: `Subtracted FROM n: n is what you start with, and ${k} comes off it.` },
  ]);
  const q = q5('less-than', {
    prompt: `Brick's cut list says the brace is "${T.w}" metres long, where n is the beam length. Which expression matches?`,
    expression: `"${T.w}"`, answer: k, answerText: `n − ${k}`,
    hint: T.first ? 'Find what you start with. The words put the number first, but you start at n.' : 'Find what you start with (n), then what happens to it.',
    steps: [T.why, `So "${T.w}" is n (beam length in m) − ${lab(k, 'm taken off')}. ${k} − n would be a different length: it starts at ${k}.`],
  });
  return choose(rng, q, `n − ${k}`, [`${k} − n`, `n + ${k}`, `${k}n`]);
}

function storyExprChoose(rng: Rng): AskStep {
  const c = rint(rng, 5, 20); let g = rint(rng, 2, 9); if (g === c) g = c - 1;
  const q = q5('story', {
    prompt: `An empty crate weighs ${c} kg and each gear adds ${g} kg. Which expression gives the weight with n gears?`,
    expression: 'weight with n gears', answer: g, answerText: `${g}n + ${c}`,
    hint: 'What changes with n gets multiplied by n. What stays the same is added once.',
    steps: [`n (number of gears) × ${lab(g, 'kg per gear')} = ${g}n kg of gears.`, `Plus the crate once: ${g}n (kg of gears) + ${lab(c, 'kg crate')}.`],
  });
  return choose(rng, q, `${g}n + ${c}`, [`${c}n + ${g}`, `${g + c}n`, `${g}(n + ${c})`]);
}

function sliderSolveStep(rng: Rng): AskStep {
  // First quadrant only (the coordinate plane comes later) and a y-span of at most 15 for phones.
  const a = rint(rng, 2, 3); const max = a === 2 ? 6 : 4; const n = rint(rng, 1, max); const b = rint(rng, 1, 3); const T = a * n + b;
  const e = lin(a, b, 'n');
  const q = q5('guess-check', {
    prompt: `Brick's crate formula is ${e}. Slide n until it reaches ${T}. The line climbs with the value of ${e}.`,
    expression: `${e} = ${T}`, answer: n,
    hint: 'Try a value, work out the expression, then go up or down.',
    steps: [`Try n = ${n}: ${a} × ${n} + ${b} = ${lab(T, 'target')}.`, `So n = ${n}.`],
  });
  return model(q, { kind: 'slider', min: 0, max, step: 1, label: 'n', range: [0, max, 0, a * max + b], layers: { fns: [{ fn: { kind: 'poly', c: [b, a] }, label: e }], hlines: [{ y: T, label: String(T) }] } }, [String(n)], `Slide n until ${e} = ${lab(T, 'target')}.`);
}

function formulaTyped(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2);
  if (kind === 0) {
    const C = pick(rng, [-20, -15, -10, -5, 0, 5, 10, 15, 25, 30, 35]); const F = Math.round(1.8 * C + 32);
    return typed(q5('formula', {
      prompt: `Catalyst converts with F = 1.8C + 32. The lab reads C = ${fmt(C)}°. What is F?`,
      expression: `1.8 × ${par(C)} + 32`, answer: F, unit: '°F',
      hint: 'Multiply first, then add 32.',
      steps: [`1.8 (F degrees per C degree) × ${parl(C, 'degrees C')} = ${fmt(1.8 * C)}.`, `${fmt(1.8 * C)} + 32 (offset) = ${lab(fmt(F), 'degrees F')}.`],
    }));
  }
  if (kind === 1) {
    const I = rint(rng, 2, 6); const R = rint(rng, 3, 12);
    return typed(q5('formula', {
      prompt: `Volt's rule is V = IR. The current I is ${I} A and the resistance R is ${R} Ω. Find V.`,
      expression: `V = ${I} × ${R}`, answer: I * R, unit: 'V',
      hint: 'IR means I times R.',
      steps: [`V = I × R = ${lab(I, 'amps')} × ${lab(R, 'ohms')} = ${lab(I * R, 'volts')}.`],
    }));
  }
  const l = rint(rng, 4, 15); const w = rint(rng, 2, 9);
  return typed(q5('formula', {
    prompt: `A frame's perimeter is P = 2l + 2w. Here l = ${l} m and w = ${w} m. Find P.`,
    expression: `2 × ${l} + 2 × ${w}`, answer: 2 * l + 2 * w, unit: 'm',
    hint: 'Multiply each term, then add.',
    steps: [`2 × ${lab(l, 'length in m')} = ${lab(2 * l, 'both lengths')}, 2 × ${lab(w, 'width in m')} = ${lab(2 * w, 'both widths')}.`, `${lab(2 * l, 'both lengths')} + ${lab(2 * w, 'both widths')} = ${lab(2 * l + 2 * w, 'perimeter in m')}.`],
  }));
}

/* =====================================================================================
 * 6. Like terms & the distributive property
 * ===================================================================================== */
const K6 = 'like-terms';
const q6 = Q(K6, 'Engineers simplify formulas before they compute: fewer terms, fewer mistakes.');

function combineChoose(rng: Rng): AskStep {
  let a = 0; let c = 0; let g = 0;
  do { a = rnz(rng, -7, 7); c = rnz(rng, -7, 7); } while ((a + c === 0 || a < 0 && c < 0) && g++ < 60);
  const b = rnz(rng, -9, 9); const d = rnz(rng, -9, 9);
  const orig = `${coefTerm(a, 'x')} ${fmtSigned(b)} ${c < 0 ? '−' : '+'} ${coefTerm(Math.abs(c), 'x')} ${fmtSigned(d)}`;
  const right = lin(a + c, b + d);
  const lump = a + b + c + d;
  const q = q6('combine', {
    prompt: `Catalyst's recipe card reads ${orig}. Combine like terms.`,
    expression: orig, answer: a + c, answerText: right,
    hint: 'x-terms join x-terms; plain numbers join plain numbers. The sign in front belongs to the term.',
    steps: [`x-terms: ${fmt(a)} ${fmtSigned(c)} = ${fmt(a + c)}, so ${coefTerm(a + c, 'x')}.`, `Numbers: ${fmt(b)} ${fmtSigned(d)} = ${fmt(b + d)}.`, `${orig} = ${right}.`],
  });
  // When b + d = 0 the lump and all-in-one slips equal the answer: extra sign slips keep 3 distractors.
  return choose(rng, q, right, [lump === 0 ? '0' : coefTerm(lump, 'x'), lin(a - c, b + d), lin(a + c, b - d), lin(a + c + b + d, 0), lin(a + c, d - b), lin(-(a + c), b + d)]);
}

function distributeChoose(rng: Rng): AskStep {
  const k = rnz(rng, -6, 6) || 2; const kk = Math.abs(k) < 2 ? (k < 0 ? -2 : 2) : k; const m = rnz(rng, -9, 9);
  const orig = `${fmt(kk)}(x ${fmtSigned(m)})`;
  const right = lin(kk, kk * m);
  const q = q6('distribute', {
    prompt: `Expand Ada's panel formula ${orig}.`,
    expression: orig, answer: kk * m, answerText: right,
    hint: 'The number outside multiplies EVERY term inside, sign included.',
    steps: [`${fmt(kk)} × x = ${coefTerm(kk, 'x')}.`, `${fmt(kk)} × ${par(m)} = ${fmt(kk * m)}.`, `${orig} = ${right}.`],
  });
  return choose(rng, q, right, [lin(kk, m), lin(kk, -kk * m), lin(1, kk * m), lin(kk, kk + m)]);
}

function areaNumbersStep(rng: Rng): AskStep {
  const k = rint(rng, 3, 9); const t = pick(rng, [20, 30, 40, 50, 60, 70]); const u = rint(rng, 1, 9);
  const q = q6('area-numbers', {
    prompt: `Brick's plate is ${k} by ${t + u}. Split it into a ${k} × ${t} panel and a ${k} × ${u} panel.`,
    expression: `${k} × ${t + u} = ${k}(${t} + ${u})`, answer: k * (t + u), answerText: `${k * t} + ${k * u} = ${k * (t + u)}`,
    hint: 'Each panel is the height times its own width.',
    steps: [`${lab(k, 'height')} × ${lab(t, 'left width')} = ${lab(k * t, 'left area')} and ${lab(k, 'height')} × ${lab(u, 'right width')} = ${lab(k * u, 'right area')}.`, `${lab(k * t, 'left area')} + ${lab(k * u, 'right area')} = ${lab(k * (t + u), 'plate area')}.`, `That is the distributive property: ${k}(${t} + ${u}) = ${k} × ${t} + ${k} × ${u}.`],
  });
  return model(q, { kind: 'table', cols: [String(t), String(u)], rowLabels: [String(k)], rows: [[null, null]], label: 'Area of each panel' }, [`${k * t},${k * u}`], 'Fill in the area of each panel.');
}

function checkTableStep(rng: Rng): AskStep {
  const k = rint(rng, 2, 6); const m = rint(rng, 1, 6);
  const vals = [k * (1 + m), k + m, k * (2 + m), 2 * k + m];
  const q = q6('test', {
    prompt: `Brick claims ${k}(x + ${m}) = ${k}x + ${m}. Test his claim with x = 1 and x = 2.`,
    expression: `${k}(x + ${m})  vs  ${k}x + ${m}`, answer: vals[0], answerText: vals.join(', '),
    hint: 'Work out each column for each row: brackets first.',
    steps: [`x = 1: ${k}(1 + ${m}) = ${vals[0]}, but ${k} + ${m} = ${vals[1]}.`, `x = 2: ${k}(2 + ${m}) = ${vals[2]}, but ${2 * k} + ${m} = ${vals[3]}.`, `They never match: the ${k} multiplies the ${m} too. ${k}(x + ${m}) = ${k}x + ${k * m}.`],
  });
  return model(q, { kind: 'table', cols: ['x', `${k}(x + ${m})`, `${k}x + ${m}`], rows: [[1, null, null], [2, null, null]], label: 'Do the columns match?' }, [vals.join(',')], 'Fill in both columns for each x.');
}

const areaViz = (k: string, m: string, left: string, right: string): Visual => ({ type: 'geo', items: [
  { t: 'poly', pts: [[0, 0], [5, 0], [5, 3], [0, 3]], labels: ['x', '', '', k] },
  { t: 'poly', pts: [[5, 0], [8, 0], [8, 3], [5, 3]], labels: [m, '', '', ''] },
  { t: 'text', p: [2.5, 1.5], text: left }, { t: 'text', p: [6.5, 1.5], text: right },
] });

function areaModelPick(rng: Rng): AskStep {
  const k = rint(rng, 2, 6); let m = rint(rng, 2, 6); if (k === 2 && m === 2) m = 3;
  const K = String(k); const M = String(m);
  const vs = [areaViz(K, M, `${k}x`, String(k * m)), areaViz(K, M, `${k}x`, M), areaViz(K, M, 'x', String(k * m)), areaViz(K, M, `${k}x`, String(k + m))];
  const q = q6('area-model', {
    prompt: `Which area model is labelled correctly for ${k}(x + ${m})?`,
    expression: `${k}(x + ${m})`, answer: k * m,
    hint: 'Each panel\'s area is its height times its width. Both panels are the same height.',
    steps: [`Left panel: ${lab(k, 'height')} × x (width) = ${k}x. Right panel: ${lab(k, 'height')} × ${lab(m, 'width')} = ${lab(k * m, 'area')}.`, `${k}(x + ${m}) = ${k}x + ${k * m}.`],
  });
  return pickLettered(rng, q, vs, 0, `${k}x and ${k * m}`);
}

function factorChoose(rng: Rng): AskStep {
  const g = rint(rng, 2, 6); const p = rint(rng, 2, 5); let r = rint(rng, 1, 9); while (gcd(p, r) !== 1) r++;
  const e = `${g * p}x + ${g * r}`; const right = `${g}(${p}x + ${r})`;
  const q = q6('factor', {
    prompt: `Ada wants ${e} as one width times a sum. Which is equal to it?`,
    expression: e, answer: g, answerText: right,
    hint: 'Expand each choice and see which one gives back the original.',
    steps: [`${g} goes into both ${g * p} and ${g * r}.`, `${g}(${p}x + ${r}) = ${g * p}x + ${g * r}. ✓`],
  });
  return choose(rng, q, right, [`${g}(${p}x + ${g * r})`, `${g * p}(x + ${g * r})`, `${g}(x + ${r})`]);
}

function simplifyEvalTyped(rng: Rng): AskStep {
  const a = rint(rng, 2, 6); const c = rnz(rng, -4, 4); const b = rnz(rng, -9, 9); const d = rnz(rng, -9, 9); const v = rnz(rng, -4, 4);
  const A = a + c === 0 ? a + c + 1 : a + c; const cc = A - a;
  const orig = `${coefTerm(a, 'x')} ${fmtSigned(b)} ${cc < 0 ? '−' : '+'} ${coefTerm(Math.abs(cc), 'x')} ${fmtSigned(d)}`;
  const simp = lin(A, b + d); const ans = A * v + b + d;
  return typed(q6('simplify-evaluate', {
    prompt: `Simplify ${orig}, then find its value at x = ${fmt(v)}.`,
    expression: `${orig}, x = ${fmt(v)}`, answer: ans,
    hint: 'Combine like terms first: fewer terms to evaluate.',
    steps: [`Simplify: ${simp}.`, `x = ${fmt(v)}: ${fmt(A)} × ${par(v)} ${fmtSigned(b + d)} = ${fmt(ans)}.`],
  }));
}

function perimeterExprChoose(rng: Rng): AskStep {
  const a = rint(rng, 1, 9); const b = rint(rng, 2, 9);
  const right = lin(2, 2 * a + 2 * b);
  const q = q6('perimeter', {
    prompt: `A solar panel is (x + ${a}) m long and ${b} m wide. Which expression is its perimeter?`,
    expression: 'P = 2 × length + 2 × width', answer: 2 * a + 2 * b, answerText: right,
    hint: 'Double the length (every term of it), double the width, then combine like terms.',
    steps: [`Two lengths: 2(x + ${a}) = 2x + ${lab(2 * a, 'metres')}. Two widths: 2 × ${lab(b, 'width in m')} = ${lab(2 * b, 'metres')}.`, `2x + ${lab(2 * a, 'm from lengths')} + ${lab(2 * b, 'm from widths')} = ${right}, in m.`],
    visual: { type: 'geo', items: [{ t: 'poly', pts: [[0, 0], [7, 0], [7, 3], [0, 3]], labels: [`x + ${a}`, String(b), '', ''] }] },
  });
  return choose(rng, q, right, [lin(1, a + b), lin(2, a + 2 * b), lin(2, 2 * a + b), lin(4, 2 * a + 2 * b)]);
}

/** Hands-on like terms: tally the x-coefficients and the plain numbers in separate columns. */
function likeTermsTallyStep(rng: Rng): AskStep {
  let a = 0; let c = 0; let g = 0;
  do { a = rnz(rng, -7, 7); c = rnz(rng, -7, 7); } while ((a + c === 0 || (a < 0 && c < 0)) && g++ < 60);
  const b = rnz(rng, -9, 9); const d = rnz(rng, -9, 9);
  const orig = `${coefTerm(a, 'x')} ${fmtSigned(b)} ${c < 0 ? '−' : '+'} ${coefTerm(Math.abs(c), 'x')} ${fmtSigned(d)}`;
  const right = lin(a + c, b + d);
  const q = q6('tally', {
    prompt: `Catalyst's recipe card reads ${orig}. Sort the terms: total the x-terms in one column and the plain numbers in the other.`,
    expression: orig, answer: a + c, answerText: `x-terms ${fmt(a + c)}, numbers ${fmt(b + d)}: ${right}`,
    hint: 'x-terms only join x-terms. Carry each sign with the term after it.',
    steps: [`x-terms: ${coefTerm(a, 'x')} and ${coefTerm(c, 'x')}: ${fmt(a)} ${fmtSigned(c)} = ${fmt(a + c)}.`, `Numbers: ${fmt(b)} and ${fmt(d)}: ${fmt(b)} ${fmtSigned(d)} = ${fmt(b + d)}.`, `${orig} = ${right}.`],
  });
  return model(q, { kind: 'table', cols: ['x-terms', 'numbers'], rowLabels: ['total'], rows: [[null, null]], label: 'Tally like with like' }, [`${a + c},${b + d}`], 'Enter the total number of x\'s, then the total of the plain numbers.');
}

/** Hands-on distributing with a variable: the outside number reaches both parts. */
function distributePartsStep(rng: Rng): AskStep {
  let k = rnz(rng, -6, 6); if (Math.abs(k) < 2) k = k < 0 ? -2 : 2;
  const m = rnz(rng, -9, 9);
  const orig = `${fmt(k)}(x ${fmtSigned(m)})`;
  const right = lin(k, k * m);
  const q = q6('distribute-parts', {
    prompt: `Ada's panel formula is ${orig}. Split it like the area model: what does the ${fmt(k)} make of the x-part, and of the number part?`,
    expression: orig, answer: k * m, answerText: `${coefTerm(k, 'x')} and ${fmt(k * m)}: ${right}`,
    hint: 'The outside number multiplies EVERY part inside, sign included.',
    steps: [`x-part: ${fmt(k)} × x = ${coefTerm(k, 'x')}, so its coefficient is ${fmt(k)}.`, `Number part: ${fmt(k)} × ${par(m)} = ${fmt(k * m)}.`, `${orig} = ${right}.`],
    visual: k > 0 && m > 0 ? areaViz(String(k), String(m), '?', '?') : card(orig, [`${fmt(k)} × x = ?`, `${fmt(k)} × ${par(m)} = ?`]),
  });
  return model(q, { kind: 'table', cols: ['x-part coefficient', 'number part'], rowLabels: [orig], rows: [[null, null]], label: 'Multiply each part' }, [`${k},${k * m}`], `Enter what ${lab(fmt(k), 'outside number')} makes of each part.`);
}

/* =====================================================================================
 * 7. One-step equations
 * ===================================================================================== */
const K7 = 'one-step';
const q7 = Q(K7, 'Solving for the unknown is how engineers find the load, the length or the current they need.');

function balanceAddStep(rng: Rng): AskStep {
  const b = rnz(rng, -9, 9); const x = rint(rng, -8, 12); const d = x + b;
  const flipSides = rng.next() < 0.25;
  const eq = flipSides ? `${fmt(d)} = ${lin(1, b)}` : `${lin(1, b)} = ${fmt(d)}`;
  const q = q7('add-sub', {
    prompt: `The plaza scale balances: ${eq}. Get x alone on its pan.`,
    expression: eq, answer: x, answerText: `x = ${fmt(x)}`,
    hint: 'Undo what is done to x by doing the opposite, to both pans.',
    steps: [`${b < 0 ? 'Add' : 'Subtract'} ${Math.abs(b)} on both sides.`, `x = ${fmt(d)} ${fmtSigned(-b)} = ${fmt(x)}.`, `Check: ${fmt(x)} ${fmtSigned(b)} = ${fmt(d)}. ✓`],
  });
  const spec = flipSides ? { kind: 'balance' as const, a: 0, b: d, c: 1, d: b } : { kind: 'balance' as const, a: 1, b, c: 0, d };
  return model(q, { ...spec, label: 'Whatever you do to one pan, do to the other.' }, [String(x)], 'Do the same to both sides until x stands alone.');
}

function balanceMultStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 9) * (rng.next() < 0.3 ? -1 : 1); const x = rnz(rng, -9, 9); const d = a * x;
  const eq = `${coefTerm(a, 'x')} = ${fmt(d)}`;
  const q = q7('mult-div', {
    prompt: `The plaza scale reads ${eq}. Get one x alone on its pan.`,
    expression: eq, answer: x, answerText: `x = ${fmt(x)}`,
    hint: 'x is multiplied. What undoes multiplying?',
    steps: [`x is multiplied by ${fmt(a)}, so divide both sides by ${fmt(a)}.`, `x = ${fmt(d)} ÷ ${par(a)} = ${fmt(x)}.`, `Check: ${fmt(a)} × ${par(x)} = ${fmt(d)}. ✓`],
  });
  return model(q, { kind: 'balance', a, b: 0, c: 0, d, label: 'Share both pans into equal parts.' }, [String(x)], 'Get one x alone on its pan.');
}

function inverseChoose(rng: Rng): AskStep {
  const k = rint(rng, 2, 9); const x = rint(rng, 2, 9); const kind = rint(rng, 0, 3);
  const T = [
    { eq: `x + ${k} = ${x + k}`, right: `subtract ${k}`, wrong: [`add ${k}`, `subtract ${x + k}`, `divide by ${k}`] },
    { eq: `x − ${k} = ${x}`, right: `add ${k}`, wrong: [`subtract ${k}`, `add ${x}`, `multiply by ${k}`] },
    { eq: `${k}x = ${k * x}`, right: `divide by ${k}`, wrong: [`subtract ${k}`, `multiply by ${k}`, `divide by ${k * x}`] },
    { eq: `x ÷ ${k} = ${x}`, right: `multiply by ${k}`, wrong: [`divide by ${k}`, `subtract ${k}`, `add ${k}`] },
  ][kind];
  const sol = kind === 0 ? x : kind === 1 ? x + k : kind === 2 ? x : x * k;
  const q = q7('inverse', {
    prompt: `To get x alone in ${T.eq}, what should Ada do to both sides?`,
    expression: T.eq, answer: sol, answerText: T.right,
    hint: 'Look at what is being done to x, then do the opposite.',
    steps: [`The opposite move is: ${T.right}.`, `That leaves x = ${sol}.`],
  });
  return choose(rng, q, T.right, T.wrong);
}

function divEqTyped(rng: Rng): AskStep {
  const k = rint(rng, 2, 6); const m = rnz(rng, -8, 8);
  return typed(q7('divide-eq', {
    prompt: `Volt spreads a charge x evenly over ${k} plates. Each plate gets ${fmt(m)}. Find x.`,
    expression: `x ÷ ${k} = ${fmt(m)}`, answer: k * m,
    hint: 'x was divided. What undoes dividing?',
    steps: [`Multiply both sides by ${lab(k, 'plates')}.`, `x = ${lab(fmt(m), 'charge per plate')} × ${lab(k, 'plates')} = ${lab(fmt(k * m), 'total charge')}.`, `Check: ${lab(fmt(k * m), 'total charge')} ÷ ${lab(k, 'plates')} = ${lab(fmt(m), 'charge per plate')}. ✓`],
  }));
}

function solutionChoose(rng: Rng): AskStep {
  const b = rint(rng, 2, 12); const d = rint(rng, -9, 9); const x = d - b;
  const eq = `x + ${b} = ${fmt(d)}`;
  const q = q7('which-solves', {
    prompt: `Which value balances ${eq}?`,
    expression: eq, answer: x, answerText: `x = ${fmt(x)}`,
    hint: 'Try each one in the equation. Or undo the + on both sides.',
    steps: [`Subtract ${b} from both sides: x = ${fmt(d)} − ${b} = ${fmt(x)}.`, `Check: ${fmt(x)} + ${b} = ${fmt(d)}. ✓`],
  });
  // d = 0 or d = −b collapses these slips onto each other (or onto x): fall back to copying d, then near misses.
  return choose(rng, q, fmt(x), [fmt(d + b), fmt(b - d), fmt(-(d + b)), fmt(d), ...nearMisses(rng, x, 3)]);
}

function wordEqTyped(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2);
  if (kind === 0) {
    const b = rint(rng, 3, 12); const v = rint(rng, 5, 20);
    return typed(q7('word', {
      prompt: `Newton's cart sped up by ${b} m/s and now moves at ${v + b} m/s. How fast was it going before?`,
      expression: `v + ${b} = ${v + b}`, answer: v, unit: 'm/s',
      hint: 'The speed-up was added. Undo it.',
      steps: [`v (speed before) + ${lab(b, 'm/s gained')} = ${lab(v + b, 'm/s now')}.`, `Subtract ${lab(b, 'm/s gained')} from both sides: v = ${lab(v, 'm/s before')}.`],
    }));
  }
  if (kind === 1) {
    const k = rint(rng, 3, 9); const w = rint(rng, 4, 15);
    return typed(q7('word', {
      prompt: `${k} identical gears weigh ${k * w} g in all. How heavy is one gear?`,
      expression: `${k}g = ${k * w}`, answer: w, unit: 'g',
      hint: 'The gear weight was multiplied by the count. Undo it.',
      steps: [`${lab(k, 'gears')} × g (grams per gear) = ${lab(k * w, 'grams in all')}.`, `Divide both sides by ${lab(k, 'gears')}: g = ${lab(w, 'grams per gear')}.`],
    }));
  }
  const t = rint(rng, 5, 20); const r = rint(rng, -12, 6);
  return typed(q7('word', {
    prompt: `After a ${t}° drop, Catalyst's vat reads ${fmt(r)}°. What did it read before?`,
    expression: `T − ${t} = ${fmt(r)}`, answer: r + t, unit: '°',
    hint: 'The drop was subtracted. Undo it.',
    steps: [`T (reading before) − ${lab(`${t}°`, 'drop')} = ${deg(r, 'reading now')}.`, `Add ${lab(`${t}°`, 'drop')} to both sides: T = ${fmt(r)}° + ${t}° = ${deg(r + t, 'reading before')}.`],
  }));
}

function springTyped(rng: Rng): AskStep {
  const s = rint(rng, 2, 6); const m = rint(rng, 3, 12);
  return typed(q7('spring', {
    prompt: `A spring stretches ${s} cm for every kg hung on it. It stretched ${s * m} cm. How many kg hang on it?`,
    expression: `${s}m = ${s * m}`, answer: m, unit: 'kg',
    hint: 'Write the equation first: stretch per kg times kg equals total stretch.',
    steps: [`${lab(s, 'cm per kg')} × m (kg hung) = ${lab(s * m, 'cm stretched')}.`, `Divide both sides by ${lab(s, 'cm per kg')}: m = ${lab(m, 'kg hung')}.`],
  }));
}

/** Transfer: a one-step equation hidden in a physics formula. */
function ohmSolveTyped(rng: Rng): AskStep {
  const R = rint(rng, 2, 12); const I = rint(rng, 2, 9); const V = R * I;
  return typed(q7('formula', {
    prompt: `Volt's rule is V = IR. A ${R} Ω heater has ${V} V across it. What current I flows through it?`,
    expression: `${R}I = ${V}`, answer: I, unit: 'A',
    hint: 'Put the numbers you know into V = IR. One unknown is left: undo what is done to it.',
    steps: [`${lab(V, 'volts')} = I (amps) × ${lab(R, 'ohms')}, so ${R}I = ${V}.`, `Divide both sides by ${lab(R, 'ohms')}: I = ${lab(I, 'amps')}.`, `Check: ${lab(I, 'amps')} × ${lab(R, 'ohms')} = ${lab(V, 'volts')}. ✓`],
  }));
}

/* =====================================================================================
 * 8. Two-step equations
 * ===================================================================================== */
const K8 = 'two-step';
const q8 = Q(K8, 'Fixed cost plus a rate (fees, tanks draining, springs) always makes a two-step equation.');

function balanceTwoStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 6) * (rng.next() < 0.25 ? -1 : 1); const x = rnz(rng, -6, 9); const b = rnz(rng, -12, 12); const d = a * x + b;
  const eq = `${lin(a, b)} = ${fmt(d)}`;
  const q = q8('balance', {
    prompt: `The plaza scale reads ${eq}. Unwrap x: last thing done, first thing undone.`,
    expression: eq, answer: x, answerText: `x = ${fmt(x)}`,
    hint: 'Clear the plain number from x\'s pan first, then share out the x\'s.',
    steps: [`${b < 0 ? 'Add' : 'Subtract'} ${Math.abs(b)} on both sides: ${coefTerm(a, 'x')} = ${fmt(d - b)}.`, `Divide both sides by ${fmt(a)}: x = ${fmt(x)}.`, `Check: ${fmt(a)} × ${par(x)} ${fmtSigned(b)} = ${fmt(d)}. ✓`],
  });
  return model(q, { kind: 'balance', a, b, c: 0, d, label: 'Undo the + or − first, then the ×.' }, [String(x)], 'Do the same to both sides until x stands alone.');
}

function nextLineChoose(rng: Rng): AskStep {
  const a = rint(rng, 2, 6); const x = rint(rng, 1, 9); const b = rint(rng, 2, 12); const minus = rng.next() < 0.4;
  const d = minus ? a * x - b : a * x + b;
  const eq = `${a}x ${minus ? '−' : '+'} ${b} = ${fmt(d)}`;
  const right = `${a}x = ${fmt(minus ? d + b : d - b)}`;
  const q = q8('next-line', {
    prompt: `Brick is solving ${eq}. Which next line keeps the scale balanced?`,
    expression: eq, answer: x, answerText: right,
    hint: 'Whatever you do must happen to every term on both sides.',
    steps: [`${minus ? 'Add' : 'Subtract'} ${b} on both sides: ${right}.`, `Then divide by ${a}: x = ${x}.`, `Dividing only the x-term by ${a} would unbalance the scale.`],
  });
  return choose(rng, q, right, [`${a}x = ${fmt(minus ? d - b : d + b)}`, `x ${minus ? '−' : '+'} ${b} = ${fmt(d)} ÷ ${a}`, `x = ${fmt(minus ? d + b : d - b)}`]);
}

function thinkNumberTyped(rng: Rng): AskStep {
  const a = rint(rng, 2, 6); const n = rnz(rng, -5, 9); const b = rnz(rng, -9, 12); const d = a * n + b;
  return typed(q8('think', {
    prompt: `Vector thinks of a number n, multiplies it by ${a}, then ${b < 0 ? 'subtracts' : 'adds'} ${Math.abs(b)}. He gets ${fmt(d)}. What is n?`,
    expression: 'n = ?', answer: n,
    hint: 'Write the equation, then undo the steps in reverse order.',
    steps: [`${lin(a, b, 'n')} = ${lab(fmt(d), 'result')}.`, `${b < 0 ? 'Add' : 'Subtract'} ${lab(Math.abs(b), b < 0 ? 'subtracted' : 'added')}: ${a}n = ${fmt(d - b)}.`, `Divide by ${lab(a, 'multiplier')}: n = ${lab(fmt(n), 'his number')}.`],
  }));
}

function wordTwoStepTyped(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2);
  if (kind === 0) {
    const f = rint(rng, 3, 9); const r = rint(rng, 2, 6); const n = rint(rng, 3, 12);
    return typed(q8('word', {
      prompt: `A cargo drone charges $${f} to launch plus $${r} per km. A trip cost $${f + r * n}. How many km was it?`,
      expression: `${r}k + ${f} = ${f + r * n}`, answer: n, unit: 'km',
      hint: 'Take off the launch fee first; the rest is paid per km.',
      steps: [`${lab(r, 'dollars per km')} × k (km) + ${lab(f, 'launch fee')} = ${lab(f + r * n, 'dollars in all')}.`, `Subtract ${lab(f, 'launch fee')}: ${r}k = ${lab(r * n, 'dollars for distance')}.`, `Divide by ${lab(r, 'dollars per km')}: k = ${lab(n, 'km')}.`],
    }));
  }
  if (kind === 1) {
    const f = 5 * rint(rng, 4, 12); const r = 5 * rint(rng, 2, 8); const h = rint(rng, 2, 9);
    return typed(q8('word', {
      prompt: `A crane rents for $${f} plus $${r} an hour. Brick's bill is $${f + r * h}. How many hours?`,
      expression: `${r}h + ${f} = ${f + r * h}`, answer: h, unit: 'h',
      hint: 'Remove the fixed fee, then divide by the hourly rate.',
      steps: [`${lab(r, 'dollars per hour')} × h (hours) + ${lab(f, 'fixed fee')} = ${lab(f + r * h, 'dollars in all')}.`, `Subtract ${lab(f, 'fixed fee')}: ${r}h = ${lab(r * h, 'dollars for hours')}.`, `Divide by ${lab(r, 'dollars per hour')}: h = ${lab(h, 'hours')}.`],
    }));
  }
  const w = rint(rng, 2, 8); const l = rint(rng, w + 1, 15); const P = 2 * l + 2 * w;
  return typed(q8('word', {
    prompt: `A rectangular frame is ${w} m wide and its perimeter is ${P} m. How long is it?`,
    expression: `2L + ${2 * w} = ${P}`, answer: l, unit: 'm',
    hint: 'Perimeter = 2 × length + 2 × width. Put in what you know.',
    steps: [`2L + 2 × ${lab(w, 'width in m')} = ${lab(P, 'perimeter in m')}, so 2L + ${lab(2 * w, 'm of width')} = ${P}.`, `Subtract ${lab(2 * w, 'm of width')}: 2L = ${lab(2 * l, 'm of length')}.`, `Divide by 2 (lengths): L = ${lab(l, 'length in m')}.`],
  }));
}

function solutionTwoChoose(rng: Rng): AskStep {
  const a = rint(rng, 3, 6); const x = rint(rng, 2, 9); const b = rint(rng, 2, 9); const d = a * x + b;
  const tidy = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9;
  const wrongs = [(d + b) / a, d / a - b, d - b].filter((v) => tidy(v) && v !== x).map(fmt);
  const eq = `${a}x + ${b} = ${d}`;
  const q = q8('which-solves', {
    prompt: `Which value of x balances ${eq}?`,
    expression: eq, answer: x, answerText: `x = ${x}`,
    hint: 'Undo the + first, then the ×. Check by putting it back in.',
    steps: [`Subtract ${b}: ${a}x = ${d - b}.`, `Divide by ${a}: x = ${x}.`, `Check: ${a} × ${x} + ${b} = ${d}. ✓`],
  });
  return choose(rng, q, String(x), [...wrongs, String(x + 1), String(d)]);
}

function bothSidesBalance(rng: Rng): AskStep {
  const c = rint(rng, 1, 4); const a = c + rint(rng, 1, 4); const x = rnz(rng, -5, 8); const b = rnz(rng, -9, 9); const d = (a - c) * x + b;
  const eq = `${lin(a, b)} = ${lin(c, d)}`;
  const q = q8('both-sides', {
    prompt: `Both pans hold x-blocks: ${eq}. Clear x-blocks off one pan first.`,
    expression: eq, answer: x, answerText: `x = ${fmt(x)}`,
    hint: 'Take the same number of x-blocks off both pans, then solve as usual.',
    steps: [`Subtract ${coefTerm(c, 'x')} from both sides: ${lin(a - c, b)} = ${fmt(d)}.`, `${b < 0 ? 'Add' : 'Subtract'} ${Math.abs(b)}: ${coefTerm(a - c, 'x')} = ${fmt(d - b)}.`, ...(a - c === 1 ? [] : [`Divide by ${a - c}: x = ${fmt(x)}.`])],
  });
  return model(q, { kind: 'balance', a, b, c, d, label: 'x-blocks on both pans.' }, [String(x)], 'Balance it down until x stands alone.');
}

function tempSolveTyped(rng: Rng): AskStep {
  const C = pick(rng, [-20, -15, -10, -5, 5, 10, 15, 20, 25, 30]); const F = Math.round(1.8 * C + 32);
  return typed(q8('formula', {
    prompt: `Catalyst's old gauge reads ${fmt(F)}°F. Using F = 1.8C + 32, what is the temperature in °C?`,
    expression: `1.8C + 32 = ${fmt(F)}`, answer: C, unit: '°C',
    hint: 'It is a two-step equation: undo the + 32, then the × 1.8.',
    steps: [`Subtract 32 (offset): 1.8C = ${lab(fmt(F - 32), 'F degrees above freezing')}.`, `Divide by 1.8 (F degrees per C degree): C = ${lab(fmt(C), 'degrees C')}.`],
  }));
}

function tankTyped(rng: Rng): AskStep {
  const r = rint(rng, 2, 6); const t = rint(rng, 3, 9); const left = rint(rng, 4, 20); const s = left + r * t;
  return typed(q8('tank', {
    prompt: `A tank holds ${s} L and drains ${r} L each minute. After how many minutes will it hold ${left} L?`,
    expression: `${s} − ${r}t = ${left}`, answer: t, unit: 'min',
    hint: 'Start amount minus what drains equals what is left.',
    steps: [`${lab(s, 'L at start')} − ${lab(r, 'L per minute')} × t (minutes) = ${lab(left, 'L left')}.`, `Subtract ${lab(s, 'L at start')}: −${r}t = ${lab(fmt(left - s), 'change in L')}.`, `Divide by −${r} (L per minute): t = ${lab(t, 'minutes')}.`],
  }));
}

/* =====================================================================================
 * 9. One-step inequalities
 * ===================================================================================== */
const K9 = 'inequalities';
const q9 = Q(K9, 'Safety limits are inequalities: at most this load, at least this voltage, below this temperature.');
const OPS = ['<', '>', '≤', '≥'];

function rayPickStep(rng: Rng): AskStep {
  const c = rint(rng, -6, 6); const op = pick(rng, OPS);
  const dir: 'left' | 'right' = op === '<' || op === '≤' ? 'left' : 'right'; const open = op === '<' || op === '>';
  const combos: { dir: 'left' | 'right'; open: boolean }[] = [{ dir, open }, { dir, open: !open }, { dir: dir === 'left' ? 'right' : 'left', open }, { dir: dir === 'left' ? 'right' : 'left', open: !open }];
  const vs = combos.map((k) => nl(-8, 8, { ray: { from: c, dir: k.dir, open: k.open } }));
  const q = q9('graph', {
    prompt: `Volt's safe readings are x ${op} ${fmt(c)}. Which graph shows them?`,
    expression: `x ${op} ${fmt(c)}`, answer: c,
    hint: 'Is the boundary itself allowed? That decides the dot. Which way are the allowed values? That decides the ray.',
    steps: [open ? `${op} leaves ${lab(fmt(c), 'boundary')} out: open dot.` : `${op} includes ${lab(fmt(c), 'boundary')}: closed dot.`, `x is ${dir === 'left' ? 'less' : 'greater'} than${open ? '' : ' or equal to'} ${fmt(c)}: the ray points ${dir}.`],
  });
  return pickLettered(rng, q, vs, 0, `${open ? 'open' : 'closed'} dot at ${fmt(c)}, ray ${dir}`);
}

function solveIneqChoose(rng: Rng): AskStep {
  const b = rnz(rng, -9, 9); const d = rint(rng, -8, 8); const op = pick(rng, OPS); const sol = d - b;
  const lhs = lin(1, b);
  const q = q9('solve', {
    prompt: `Solve for the safe range: ${lhs} ${op} ${fmt(d)}.`,
    expression: `${lhs} ${op} ${fmt(d)}`, answer: sol, answerText: `x ${op} ${fmt(sol)}`,
    hint: 'Solve it like an equation. Adding or subtracting never flips the sign.',
    steps: [`${b < 0 ? 'Add' : 'Subtract'} ${Math.abs(b)} on both sides.`, `x ${op} ${fmt(d)} ${fmtSigned(-b)}, so x ${op} ${fmt(sol)}.`],
  });
  return choose(rng, q, `x ${op} ${fmt(sol)}`, [`x ${op} ${fmt(d + b)}`, `x ${flipOp(op)} ${fmt(sol)}`, `x ${toggleStrict(op)} ${fmt(sol)}`]);
}

function negDivChoose(rng: Rng): AskStep {
  const neg = rng.next() < 0.7; const a = rint(rng, 2, 6) * (neg ? -1 : 1); const x0 = rnz(rng, -6, 6); const d = a * x0; const op = pick(rng, OPS);
  const solOp = neg ? flipOp(op) : op; const right = `x ${solOp} ${fmt(x0)}`;
  const eq = `${coefTerm(a, 'x')} ${op} ${fmt(d)}`;
  const q = q9('divide', {
    prompt: `Solve Newton's limit: ${eq}.`,
    expression: eq, answer: x0, answerText: right,
    hint: 'Divide both sides by the number with x. Is that number negative?',
    steps: neg ? [`Divide both sides by ${fmt(a)}, a negative: the sign flips.`, `x ${solOp} ${fmt(d)} ÷ ${par(a)} = ${fmt(x0)}.`, `Why: multiplying or dividing by a negative mirrors the number line (2 < 5 but −2 > −5).`] : [`Divide both sides by ${a}, a positive: the sign stays.`, `x ${op} ${fmt(x0)}.`],
  });
  return choose(rng, q, right, [`x ${neg ? op : flipOp(op)} ${fmt(x0)}`, `x ${solOp} ${fmt(-x0)}`, `x ${neg ? op : flipOp(op)} ${fmt(-x0)}`]);
}

function boundaryIntStep(rng: Rng): AskStep {
  const b = rnz(rng, -6, 6); const op = pick(rng, OPS); let c = rint(rng, -6, 6);
  let sol = c - b; if (Math.abs(sol) > 10) { c = b + (sol > 0 ? 9 : -9); sol = c - b; }
  const greatest = op === '<' || op === '≤'; const strict = op === '<' || op === '>';
  const ans = strict ? (greatest ? sol - 1 : sol + 1) : sol;
  const word = greatest ? 'greatest' : 'least';
  const lhs = lin(1, b);
  const q = q9('boundary', {
    prompt: `The valve is safe when ${lhs} ${op} ${fmt(c)}. Tap the ${word} safe integer x.`,
    expression: `${lhs} ${op} ${fmt(c)}`, answer: ans,
    hint: 'Solve first. Then ask: is the boundary itself allowed?',
    steps: [`${b < 0 ? 'Add' : 'Subtract'} ${Math.abs(b)}: x ${op} ${fmt(sol)}.`, strict ? `${lab(fmt(sol), 'boundary')} itself is not allowed (open dot), so the ${word} integer is ${fmt(ans)}.` : `${lab(fmt(sol), 'boundary')} is allowed (closed dot), so it is the ${word} integer.`],
  });
  return model(q, { kind: 'numberline', start: 0, min: -12, max: 12, label: `${lhs} ${op} ${fmt(c)}` }, [String(ans)], `Tap the ${word} integer that is safe.`);
}

function wordIneqChoose(rng: Rng): AskStep {
  const n = rint(rng, 2, 9) * 10;
  const T = pick(rng, [
    { s: `The lift holds at most ${n} kg.`, v: 'w', op: '≤', why: '"At most" means that much or less.', vl: 'load in kg', nl: 'kg limit' },
    { s: `The pump needs at least ${n} volts.`, v: 'v', op: '≥', why: '"At least" means that much or more.', vl: 'volts', nl: 'fewest volts' },
    { s: `The kiln must stay below ${n}°.`, v: 't', op: '<', why: '"Below" means less than, and not equal.', vl: 'kiln temperature', nl: 'degree limit' },
    { s: `The cable must be longer than ${n} m.`, v: 'L', op: '>', why: '"Longer than" means greater, and not equal.', vl: 'cable length in m', nl: 'm to beat' },
    { s: `No more than ${n} crates fit on the barge.`, v: 'c', op: '≤', why: '"No more than" means that many or fewer.', vl: 'crates', nl: 'most crates' },
    { s: `The tank needs no less than ${n} L.`, v: 'V', op: '≥', why: '"No less than" means that much or more.', vl: 'litres', nl: 'fewest litres' },
  ]);
  const right = `${T.v} ${T.op} ${n}`;
  const q = q9('words', {
    prompt: `${T.s} Which inequality says that?`,
    expression: T.s, answer: n, answerText: right,
    hint: 'Decide the direction (more or less), then whether the limit itself is allowed.',
    steps: [T.why, `So ${T.v} (${T.vl}) ${T.op} ${lab(n, T.nl)}.`],
  });
  return choose(rng, q, right, OPS.filter((o) => o !== T.op).map((o) => `${T.v} ${o} ${n}`));
}

function testValueChoose(rng: Rng): AskStep {
  const c = rint(rng, -8, 3); const op = pick(rng, ['>', '<']);
  const right = op === '>' ? c + rint(rng, 1, 3) : c - rint(rng, 1, 3);
  const wrongs = op === '>' ? [c, c - 1, c - 2] : [c, c + 1, c + 2];
  const q = q9('test', {
    prompt: `Which reading is a solution of x ${op} ${fmt(c)}?`,
    expression: `x ${op} ${fmt(c)}`, answer: right,
    hint: `Put each on the number line. ${op === '>' ? 'Greater means to the right.' : 'Less means to the left.'} The boundary is not included.`,
    steps: [`${fmt(right)} is ${op === '>' ? 'right' : 'left'} of ${fmt(c)}, so ${fmt(right)} ${op} ${fmt(c)} is true.`, `${lab(fmt(c), 'boundary')} itself fails: ${fmt(c)} ${op} ${fmt(c)} is false.`],
    visual: nl(-12, 8),
  });
  return choose(rng, q, fmt(right), wrongs.map(fmt));
}

function craneLimitTyped(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const cap = 5 * rint(rng, 8, 20); const h = rint(rng, 5, cap - 10);
    return typed(q9('limit', {
      prompt: `Brick's crane lifts at most ${cap} t. It already holds ${h} t. What is the most it can still take?`,
      expression: `${h} + t ≤ ${cap}`, answer: cap - h, unit: 't',
      hint: 'Write the inequality, then solve it like an equation.',
      steps: [`${lab(h, 'tonnes held')} + t (tonnes more) ≤ ${lab(cap, 'tonne limit')}.`, `Subtract ${lab(h, 'tonnes held')}: t ≤ ${lab(cap - h, 'tonnes')}.`, `The most is ${lab(cap - h, 'tonnes more')}.`],
    }));
  }
  const p = rint(rng, 3, 9); let m = rint(rng, 20, 80); if (m % p === 0) m += 1;
  const most = Math.floor(m / p);
  return typed(q9('limit', {
    prompt: `Ada has $${m}. Each sensor costs $${p}. At most how many sensors can she buy?`,
    expression: `${p}s ≤ ${m}`, answer: most,
    hint: 'Solve the inequality, then remember you cannot buy part of a sensor.',
    steps: [`${lab(p, 'dollars per sensor')} × s (sensors) ≤ ${lab(m, 'dollars she has')}, so s ≤ ${m} ÷ ${p}, which is about ${lab(fmt(Math.round((m / p) * 10) / 10), 'sensors')}.`, `${lab(most, 'sensors')} cost ${lab(`$${most * p}`, 'total')}; ${lab(most + 1, 'sensors')} would cost ${lab(`$${(most + 1) * p}`, 'total')}, too much. At most ${most}.`],
  }));
}

/* =====================================================================================
 * 10. Ratios, rates & unit rates
 * ===================================================================================== */
const K10 = 'rates';
const q10 = Q(K10, 'Flow rates, speeds and costs per unit let engineers scale any job up or down.');

function unitRateTyped(rng: Rng): AskStep {
  const r = rint(rng, 2, 12); const n = rint(rng, 3, 9);
  const T = pick(rng, [
    { p: `A pump moves ${r * n} L in ${n} minutes.`, ask: 'Litres per minute?', u: 'L/min', tl: 'litres', nl: 'minutes', rl: 'litres per minute' },
    { p: `Newton's test cart rolls ${r * n} m in ${n} s.`, ask: 'Metres per second?', u: 'm/s', tl: 'metres', nl: 'seconds', rl: 'metres per second' },
    { p: `${n} m of cable costs $${r * n}.`, ask: 'Cost per metre?', u: '$/m', tl: 'dollars', nl: 'metres of cable', rl: 'dollars per metre' },
  ]);
  return typed(q10('unit-rate', {
    prompt: `${T.p} ${T.ask}`, expression: `${r * n} ÷ ${n} = ?`, answer: r, unit: T.u,
    hint: 'A unit rate is the amount for ONE. Divide by the number of units.',
    steps: [`Per 1: ${lab(r * n, T.tl)} ÷ ${lab(n, T.nl)} = ${lab(r, T.rl)}.`, `${r} ${T.u}.`],
  }));
}

function rateTableStep(rng: Rng): AskStep {
  const r = rint(rng, 2, 9); const n0 = rint(rng, 2, 4); const [n1, n2] = rng.shuffle([5, 6, 7, 8, 9, 10]).slice(0, 2).sort((p, q) => p - q);
  const q = q10('table', {
    prompt: 'The pump log is half empty. Find the rate for 1 minute first, then fill the rest.',
    expression: `L = ? × t`, answer: r, answerText: `${r}, ${r * n1}, ${r * n2}`,
    hint: 'Every row keeps the same litres-per-minute.',
    steps: [`${lab(r * n0, 'litres')} ÷ ${lab(n0, 'minutes')} = ${lab(r, 'litres per minute')}.`, `${lab(n1, 'minutes')} × ${lab(r, 'L per minute')} = ${lab(r * n1, 'litres')}; ${lab(n2, 'minutes')} × ${lab(r, 'L per minute')} = ${lab(r * n2, 'litres')}.`, `Rule: L = ${r}t, with L (litres) and t (minutes).`],
  });
  return model(q, { kind: 'table', cols: ['t (min)', 'L (litres)'], rows: [[1, null], [n0, r * n0], [n1, null], [n2, null]], label: 'Pump log' }, [`${r},${r * n1},${r * n2}`], 'Fill the missing litres.');
}

function ruleChoose(rng: Rng): AskStep {
  // y reaches at most 4r = 16: the phone plot budget.
  const r = rint(rng, 2, 4); const xs = [1, 2, 3];
  const q = q10('rule', {
    prompt: 'Newton plots his cart\'s time t (s) and distance d (m). Which rule fits every point?',
    expression: xs.map((x) => `(${x}, ${r * x})`).join('  '), answer: r, answerText: `d = ${r}t`,
    hint: 'Test the rule on EVERY point, not just the first.',
    steps: [`Each d is ${lab(r, 'm per second')} times its t: ${xs.map((x) => `${r} × ${x} = ${r * x}`).join(', ')}.`, `d = ${r}t. (d = t + ${r - 1} fits the first point only.)`],
    visual: { type: 'plot', range: [0, 4, 0, 4 * r], layers: { points: xs.map((x) => ({ x, y: r * x })) } },
  });
  return choose(rng, q, `d = ${r}t`, [`d = t + ${r - 1}`, `t = ${r}d`, `d = ${r} + t`]);
}

function betterBuyChoose(rng: Rng): AskStep {
  let nA = 0; let nB = 0; let uA = 0; let uB = 0; let g = 0;
  do {
    [uA, uB] = rng.shuffle([20, 25, 30, 40, 50, 60, 75]).slice(0, 2).sort((p, q) => q - p);
    nA = rint(rng, 4, 8); nB = rint(rng, nA + 2, 12);
  } while (nB * uB <= nA * uA && g++ < 60);
  // Pack with more bolts is cheaper per bolt but costs more in total: the trap is picking the lower price tag.
  const swap = rng.next() < 0.5;
  const P = [{ n: nA, u: uA }, { n: nB, u: uB }]; if (swap) P.reverse();
  const money = (c: number) => (c / 100).toFixed(2);
  const right = P[0].u < P[1].u ? 'Pack A' : 'Pack B';
  const q = q10('better-buy', {
    prompt: `Pack A: ${P[0].n} bolts for $${money(P[0].n * P[0].u)}. Pack B: ${P[1].n} bolts for $${money(P[1].n * P[1].u)}. Which is the better buy?`,
    expression: 'price per bolt', answer: Math.min(uA, uB) / 100, answerText: right,
    hint: 'Compare the price of ONE bolt, not the price tags.',
    steps: [`A: ${lab(`$${money(P[0].n * P[0].u)}`, 'pack price')} ÷ ${lab(P[0].n, 'bolts')} = ${lab(`$${money(P[0].u)}`, 'per bolt')}.`, `B: ${lab(`$${money(P[1].n * P[1].u)}`, 'pack price')} ÷ ${lab(P[1].n, 'bolts')} = ${lab(`$${money(P[1].u)}`, 'per bolt')}.`, `${right} is cheaper per bolt.`],
  });
  return choose(rng, q, right, [right === 'Pack A' ? 'Pack B' : 'Pack A', 'Same value']);
}

function flipRateChoose(rng: Rng): AskStep {
  const r = rint(rng, 2, 8); const n = rint(rng, 2, 6);
  const q = q10('which-way', {
    prompt: `A drill makes ${r * n} holes in ${n} minutes. How many holes per minute?`,
    expression: `holes ÷ minutes`, answer: r, unit: 'holes/min',
    hint: '"Per minute" means divide by the minutes.',
    steps: [`${lab(r * n, 'holes')} ÷ ${lab(n, 'minutes')} = ${lab(r, 'holes per minute')}.`, `${lab(`1/${r}`, 'minutes per hole')} would be the rate upside down.`],
  });
  return choose(rng, q, String(r), [`1/${r}`, String(r * n * n), String(r * n + n)]);
}

function sliderTimeStep(rng: Rng): AskStep {
  // The slider stops at max = floor(16 / r) hours, so the distance axis never passes 16 km (phone budget).
  let r = 0; let t = 0; let max = 0; let g = 0;
  do { r = pick(rng, [2, 3, 4, 5]); max = Math.floor(16 / r); t = pick(rng, [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7]); } while ((!Number.isInteger(r * t) || t > max) && g++ < 60);
  if (!Number.isInteger(r * t) || t > max) { r = 2; max = 8; t = 3.5; }
  const D = r * t;
  const q = q10('time', {
    prompt: `Newton's rover drives ${r} km every hour. Slide to the time when it has gone ${D} km.`,
    expression: `${r}t = ${D}`, answer: t, unit: 'h',
    hint: 'Where does the distance line reach the target height?',
    steps: [`d (km) = ${lab(r, 'km per hour')} × t (hours), so ${r}t = ${lab(D, 'km')}.`, `t = ${lab(D, 'km')} ÷ ${lab(r, 'km per hour')} = ${lab(fmt(t), 'hours')}.`],
  });
  return model(q, { kind: 'slider', min: 0, max, step: 0.5, label: 'time t (hours)', unit: 'h', range: [0, max, 0, r * max], layers: { fns: [{ fn: { kind: 'poly', c: [0, r] }, label: `d = ${r}t` }], hlines: [{ y: D, label: `${D} km` }] } }, [String(t)], 'Slide to the time. The pink line shows it on the graph.');
}

/** A part-to-part ratio with a variable: multiply (or divide) by the ratio, never add it. */
function ratioExprChoose(rng: Rng): AskStep {
  const k = rint(rng, 2, 5);
  const T = pick(rng, [
    { p: `Brick's concrete is 1 : ${k} cement to sand. With c buckets of cement, which expression gives the buckets of sand?`, right: `${k}c`, wrong: [`c + ${k}`, `c/${k}`, `${k}/c`], why: `Every bucket of cement needs ${lab(k, 'buckets of sand')}, so c (buckets of cement) × ${k} = ${k}c buckets of sand.`, expr: `cement : sand = 1 : ${k}`, check: `Check with c = 3: ${lab(3, 'buckets of cement')} × ${lab(k, 'sand per cement')} = ${lab(3 * k, 'buckets of sand')} keeps 1 : ${k}, while 3 + ${k} = ${3 + k} would not.` },
    { p: `Newton's gear pair is 1 : ${k}: the follower turns ${k} times for each turn of the driver. The driver turns t times. Which expression gives the follower's turns?`, right: `${k}t`, wrong: [`t + ${k}`, `t/${k}`, `${k} − t`], why: `${lab(k, 'follower turns')} for each driver turn: ${k} × t (driver turns) = ${k}t follower turns.`, expr: `driver : follower = 1 : ${k}`, check: `Check with t = 3: ${lab(3, 'driver turns')} × ${lab(k, 'follower turns each')} = ${lab(3 * k, 'follower turns')} keeps 1 : ${k}, while 3 + ${k} = ${3 + k} would not.` },
    { p: `Catalyst mixes cleaner ${k} : 1, water to concentrate. With w cups of water, which expression gives the cups of concentrate?`, right: `w/${k}`, wrong: [`${k}w`, `w − ${k}`, `${k}/w`], why: `There is 1 cup of concentrate for every ${lab(k, 'cups of water')}, so w (cups of water) need w ÷ ${k} cups of concentrate.`, expr: `water : concentrate = ${k} : 1`, check: `Check with w = ${3 * k}: ${lab(3 * k, 'cups of water')} ÷ ${lab(k, 'water per concentrate')} = ${lab(3, 'cups of concentrate')} keeps ${k} : 1, while ${3 * k} − ${k} = ${2 * k} cups would not.` },
  ]);
  const q = q10('ratio-expr', {
    prompt: T.p,
    expression: T.expr, answer: k, answerText: T.right,
    hint: 'A ratio says how many of one for EACH one of the other. Scale by multiplying or dividing, never by adding.',
    steps: [T.why, T.check],
  });
  return choose(rng, q, T.right, T.wrong);
}

/** A rate as points (t, d) through the origin: the coordinate plane chapter comes just before this one. */
function rateGraphStep(rng: Rng): AskStep {
  const k = pick(rng, [1, 2, 2, 3, 3]); const xmax = Math.min(6, Math.floor(12 / k));
  const q = q10('graph-rate', {
    prompt: `Newton's cart moves ${k} m every second: d = ${coefTerm(k, 't')}. Plot two points (t, d) that fit.`,
    expression: `d = ${coefTerm(k, 't')}`, answer: k, answerText: `any two, e.g. (1, ${k}) and (2, ${2 * k})`,
    hint: 'Pick a time t, work out d, and plot (t, d). Do it twice.',
    steps: [`t = 1 (second) gives d = ${lab(k, 'metres')}; t = 2 (seconds) gives d = ${lab(2 * k, 'metres')}.`, `Plot (1, ${k}) and (2, ${2 * k}). They line up with (0, 0).`],
  });
  return model(q, { kind: 'plot', range: [0, xmax, 0, 12], count: 2, label: 't across, d up' }, undefined, 'Tap two points that fit the rule.', { rule: { kind: 'on-line', m: k, b: 0 } });
}

function mixTransferTyped(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const s = rint(rng, 2, 6); const v = pick(rng, [50, 100, 250]); const k = rint(rng, 2, 8);
    return typed(q10('scale-up', {
      prompt: `Catalyst mixes ${s} g of salt into every ${v} mL of water. How much salt for ${k * v} mL?`,
      expression: `${s} g per ${v} mL`, answer: s * k, unit: 'g',
      hint: 'How many batches of the small amount fit in the big one?',
      steps: [`${lab(k * v, 'mL wanted')} ÷ ${lab(v, 'mL per batch')} = ${labn(k, 'batch', 'batches')}.`, `${labn(k, 'batch', 'batches')} × ${lab(s, 'g salt per batch')} = ${lab(s * k, 'g salt')}.`],
    }));
  }
  const p = rint(rng, 3, 12); const m = rint(rng, 2, 5); const P = p * rint(rng, 4, 12);
  return typed(q10('scale-up', {
    prompt: `A 3-D printer lays ${p} layers every ${m} minutes. How many minutes for ${P} layers?`,
    expression: `${p} layers per ${m} min`, answer: (P / p) * m, unit: 'min',
    hint: 'Count how many groups of layers, then time each group.',
    steps: [`${lab(P, 'layers')} ÷ ${lab(p, 'layers per group')} = ${lab(P / p, 'groups')}.`, `${lab(P / p, 'groups')} × ${lab(m, 'minutes per group')} = ${lab((P / p) * m, 'minutes')}.`],
  }));
}

/* =====================================================================================
 * 11. Proportions
 * ===================================================================================== */
const K11 = 'proportions';
const q11 = Q(K11, 'Blueprints, maps, scale models and mix recipes are proportions.');

/**
 * a/b = c/x with NO whole-number factor between matching parts (a → c) or inside a ratio (a → b),
 * so the player has to cross-multiply (a·x = b·c) and solve the one-step equation.
 */
function crossTriple(rng: Rng): { a: number; b: number; c: number; x: number } {
  let a = 0; let b = 0; let c = 0; let g = 0;
  const bad = () => (b * c) % a !== 0 || b % a === 0 || a % b === 0 || c % a === 0 || a % c === 0 || b * c > 96;
  do { a = rint(rng, 3, 8); b = rint(rng, 3, 12); c = rint(rng, 2, 12); } while (bad() && g++ < 300);
  if (bad()) { a = 4; b = 6; c = 10; }
  return { a, b, c, x: (b * c) / a };
}

function solvePropTyped(rng: Rng): AskStep {
  if (rng.next() < 0.35) {
    const { a, b, c, x } = crossTriple(rng);
    return typed(q11('solve', {
      prompt: `Ada's two mix tickets must match: ${a}/${b} = ${c}/x. There is no whole-number scale factor. Find x.`,
      expression: `${a}/${b} = ${c}/x`, answer: x,
      hint: 'Cross-multiply: the two cross products of equal ratios are equal. Then solve the one-step equation.',
      steps: [`Cross-multiply: ${a} × x = ${b} × ${c}, so ${a}x = ${b * c}.`, `Divide both sides by ${a}: x = ${x}.`, `Check: ${a} × ${x} = ${a * x} and ${b} × ${c} = ${b * c}. ✓`],
    }));
  }
  const b = rint(rng, 2, 9); let a = rint(rng, 1, 9); if (a === b) a = b - 1; const k = rint(rng, 2, 6); const form = rint(rng, 0, 2);
  const eq = form === 0 ? `${a}/${b} = x/${b * k}` : form === 1 ? `${a}/${b} = ${a * k}/x` : `x/${b} = ${a * k}/${b * k}`;
  const ans = form === 0 ? a * k : form === 1 ? b * k : a;
  const steps = form === 0
    ? [`${b} × ${k} = ${b * k}: the scale factor is ${k}.`, `x = ${a} × ${k} = ${a * k}.`, `Check: ${a} × ${b * k} = ${b} × ${a * k} = ${a * b * k}.`]
    : form === 1 ? [`${a} × ${k} = ${a * k}: the scale factor is ${k}.`, `x = ${b} × ${k} = ${b * k}.`, `Check: ${a} × ${b * k} = ${b} × ${a * k}.`]
      : [`${b * k} ÷ ${k} = ${b}: scale down by ${k}.`, `x = ${a * k} ÷ ${k} = ${a}.`];
  return typed(q11('solve', {
    prompt: `Ada's two mix tickets must match: ${eq}. Find x.`, expression: eq, answer: ans,
    hint: 'Find the scale factor between the two known matching parts.',
    steps,
  }));
}

function additiveTrapChoose(rng: Rng): AskStep {
  const a = rint(rng, 2, 6); const b = a + rint(rng, 1, 4); const k = rint(rng, 2, 3); const c = b * k; const x = a * k;
  const q = q11('multiply-not-add', {
    prompt: `Ada's glue is ${a} parts resin to ${b} parts hardener. With ${c} parts hardener, how much resin?`,
    expression: `${a}/${b} = x/${c}`, answer: x,
    hint: 'Ratios scale by multiplying, not by adding.',
    steps: [`${lab(b, 'parts hardener')} → ${lab(c, 'parts hardener')} is × ${lab(k, 'scale factor')}, not + ${c - b}.`, `So x (parts resin) = ${lab(a, 'parts resin')} × ${lab(k, 'scale factor')} = ${lab(x, 'parts resin')}.`],
  });
  // c − a can equal x (6/9 = x/18): c − b and near misses stand in when it does.
  return choose(rng, q, String(x), [String(a + c - b), String(c - a), String(a * c), String(c - b), ...nearMisses(rng, x, 3)]);
}

/**
 * A non-unit scale (e.g. 4 cm : 10 m) with no whole-number jump from the known drawing length to the
 * new one, so the player finds a common step first. Half the time the real length is given instead.
 */
function scaleRatioTableStep(rng: Rng): AskStep {
  let a = 0; let r = 0; let c = 0; let gg = 0;
  const bad = () => r % a === 0 || a % r === 0 || c % a === 0 || a % c === 0 || (c * r) % a !== 0 || (c * r) / a > 60;
  do { a = rint(rng, 2, 6); r = rint(rng, 3, 15); c = rint(rng, 2, 12); } while (bad() && gg++ < 300);
  if (bad()) { a = 4; r = 10; c = 6; }
  const R = (c * r) / a; const g = gcd(a, c); const stepM = (r * g) / a;
  const common = `Split both into ${lab(a / g, 'equal steps')}: ${lab(g, 'cm per step')} ↔ ${lab(stepM, 'm per step')}.`;
  if (rng.next() < 0.5) {
    const q = q11('scale', {
      prompt: `Ada's blueprint scale: ${a} cm on paper is ${r} m on site. How long is a beam drawn ${c} cm?`,
      expression: `${a} : ${r} = ${c} : ?`, answer: R, unit: 'm',
      hint: `${lab(c, 'cm drawn')} is not a whole number of ${a} cm steps. Find a smaller step both lengths are built from.`,
      steps: [`${lab(a, 'cm on paper')} ↔ ${lab(r, 'm on site')}. ${common}`, `${lab(c, 'cm drawn')} is ${c / g} steps of ${g} cm: ${lab(c / g, 'steps')} × ${lab(stepM, 'm per step')} = ${lab(R, 'm real beam')}.`],
    });
    return model(q, { kind: 'ratiotable', labels: ['drawing (cm)', 'real (m)'], rows: [[a, r], [c, null]] }, [String(R)], 'Fill in the real length.');
  }
  const q = q11('scale', {
    prompt: `Ada's blueprint scale: ${a} cm on paper is ${r} m on site. The real beam is ${R} m. How long should she draw it?`,
    expression: `${a} : ${r} = ? : ${R}`, answer: c, unit: 'cm',
    hint: 'Find a small step that fits both the scale and the real length, then count steps.',
    steps: [`${lab(a, 'cm on paper')} ↔ ${lab(r, 'm on site')}. ${common}`, `${lab(R, 'm real beam')} is ${R / stepM} steps of ${stepM} m: ${lab(c / g, 'steps')} × ${lab(g, 'cm per step')} = ${lab(c, 'cm to draw')}.`],
  });
  return model(q, { kind: 'ratiotable', labels: ['drawing (cm)', 'real (m)'], rows: [[a, r], [null, R]] }, [String(c)], 'Fill in the drawing length.');
}

/** Cross-multiply, then solve the one-step equation on the balance: proportions meet Chapter 7. */
function crossMultBalanceStep(rng: Rng): AskStep {
  const { a, b, c, x } = crossTriple(rng);
  const q = q11('cross-multiply', {
    prompt: `Ada's glue tickets must match: ${a} parts resin to ${b} parts hardener, and ${c} parts resin to x parts hardener. ${a} → ${c} is no whole-number jump, so cross-multiply and balance.`,
    expression: `${a}/${b} = ${c}/x`, answer: x, answerText: `x = ${x}`,
    hint: 'Equal ratios have equal cross products: a/b = c/x means a × x = b × c.',
    steps: [`Cross-multiply: ${lab(a, 'parts resin')} × x (parts hardener) = ${lab(b, 'parts hardener')} × ${lab(c, 'parts resin')}, so ${a}x = ${b * c}.`, `Divide both pans by ${a}: x = ${lab(x, 'parts hardener')}.`, `Check: ${a}/${b} = ${c}/${x} because ${a} × ${x} = ${b} × ${c} = ${b * c}. ✓`],
  });
  return model(q, { kind: 'balance', a, b: 0, c: 0, d: b * c, label: `${a}x = ${b} × ${c}` }, [String(x)], 'The cross products are on the pans. Share both pans until one x stands alone.');
}

/** Percent as a proportion in a ratio table (part ↔ percent, whole ↔ 100) with the whole or the percent unknown. */
function percentTableStep(rng: Rng): AskStep {
  let W = 0; let p = 0; let g = 0;
  do { W = pick(rng, [20, 40, 60, 80, 120, 150, 200]); p = 5 * rint(rng, 1, 19); } while (((W * p) % 100 !== 0 || p === 50) && g++ < 80);
  if ((W * p) % 100 !== 0 || p === 50) { W = 60; p = 30; }
  const P = (W * p) / 100;
  if (rng.next() < 0.5) {
    const q = q11('percent-whole', {
      prompt: `Catalyst's tank gauge says ${P} L is ${p}% of the tank. How many litres does the full tank hold?`,
      expression: `${P}/W = ${p}/100`, answer: W, unit: 'L',
      hint: 'Part ↔ percent, whole ↔ 100%. Scale the row that you know.',
      steps: [`${lab(`${p}%`, 'tank share')} ↔ ${lab(P, 'litres')}, and the whole tank is 100% (full).`, `Cross-multiply: ${lab(p, 'percent')} × W (full tank in L) = ${lab(P, 'litres')} × ${lab(100, 'percent full')} = ${P * 100}.`, `W = ${P * 100} ÷ ${lab(p, 'percent')} = ${lab(W, 'litres, full tank')}.`],
    });
    return model(q, { kind: 'ratiotable', labels: ['litres', 'percent'], rows: [[P, p], [null, 100]] }, [String(W)], `Fill in the litres for ${lab('100%', 'full tank')}.`);
  }
  const q = q11('percent-part', {
    prompt: `Catalyst's ${W} L tank holds ${P} L. What percent full is it?`,
    expression: `${P}/${W} = p/100`, answer: p, unit: '%',
    hint: 'Part ↔ percent, whole ↔ 100%. Scale the whole row to find the part\'s percent.',
    steps: [`${lab(W, 'L, full tank')} ↔ 100% (full), and ${lab(P, 'L in the tank')} ↔ p (percent full).`, `Cross-multiply: ${lab(W, 'L, full tank')} × p = ${lab(P, 'L in the tank')} × ${lab(100, 'percent full')} = ${P * 100}.`, `p = ${P * 100} ÷ ${lab(W, 'L, full tank')} = ${lab(`${p}%`, 'full')}.`],
  });
  return model(q, { kind: 'ratiotable', labels: ['litres', 'percent'], rows: [[P, null], [W, 100]] }, [String(p)], 'Fill in the percent for the litres in the tank.');
}

function percentPropTyped(rng: Rng): AskStep {
  let W = 0; let p = 0; let g = 0;
  do { W = pick(rng, [20, 25, 40, 50, 60, 80, 120, 200]); p = 5 * rint(rng, 1, 19); } while ((W * p) % 100 !== 0 && g++ < 60);
  if ((W * p) % 100 !== 0) { W = 40; p = 25; }
  const P = (W * p) / 100;
  if (rng.next() < 0.5) {
    return typed(q11('what-percent', {
      prompt: `${P} of ${W} welds passed inspection. What percent passed?`,
      expression: `${P}/${W} = p/100`, answer: p, unit: '%',
      hint: 'Part over whole equals percent over 100.',
      steps: [`Part over whole: ${lab(`${P}/${W}`, 'welds passed out of all')} = p/100.`, `p = ${lab(P, 'welds passed')} × 100 ÷ ${lab(W, 'welds in all')} = ${lab(`${p}%`, 'passed')}.`],
    }));
  }
  return typed(q11('whole', {
    prompt: `${P} kg is ${p}% of the barge's load. What is the whole load?`,
    expression: `${P}/W = ${p}/100`, answer: W, unit: 'kg',
    hint: 'The part goes on top, the whole on the bottom.',
    steps: [`${lab(P, 'kg part')} ÷ W (whole load in kg) = ${lab(p, 'percent')} ÷ 100.`, `W = ${lab(P, 'kg part')} × 100 ÷ ${lab(p, 'percent')} = ${lab(W, 'kg whole load')}.`],
  }));
}

function setupChoose(rng: Rng): AskStep {
  let a = 0; let b = 0; let c = 0; let g = 0;
  do { a = rint(rng, 2, 6); b = rint(rng, 2, 12); c = rint(rng, 2, 12); } while (((b * c) % a !== 0 || a === b || a === c || b === c) && g++ < 80);
  if ((b * c) % a !== 0 || a === b || a === c || b === c) { a = 4; b = 10; c = 6; }
  const x = (b * c) / a;
  const q = q11('set-up', {
    prompt: `${a} pumps fill ${b} tanks an hour. Which proportion finds x, the tanks for ${c} pumps?`,
    expression: `x = tanks for ${c} pumps`, answer: x, answerText: `${a}/${b} = ${c}/x`,
    hint: 'Keep the same kind of quantity in the same place on both sides.',
    steps: [`Pumps over tanks on both sides: ${a}/${b} = ${c}/x, with ${lab(a, 'pumps')}, ${lab(b, 'tanks an hour')}, ${lab(c, 'pumps')} and x (tanks an hour).`, `x = ${lab(b, 'tanks')} × ${lab(c, 'pumps')} ÷ ${lab(a, 'pumps')} = ${lab(x, 'tanks an hour')}.`],
  });
  return choose(rng, q, `${a}/${b} = ${c}/x`, [`${a}/${b} = x/${c}`, `${b}/${a} = ${c}/x`, `${a}/${c} = x/${b}`]);
}

function proportionPairChoose(rng: Rng): AskStep {
  const a = rint(rng, 2, 7); let b = rint(rng, 3, 9); if (b === a) b += 1; const k = rint(rng, 2, 4);
  const right = `${a}/${b} = ${a * k}/${b * k}`;
  const q = q11('is-proportion', {
    prompt: 'Brick scaled a mix and wrote four claims. Which one is a true proportion?',
    expression: 'equal ratios?', answer: k, answerText: right,
    hint: 'Equal ratios have equal cross products.',
    steps: [`${a} × ${b * k} = ${a * b * k} and ${b} × ${a * k} = ${a * b * k}: equal.`, `Adding the same amount to both parts (${a}/${b} → ${a + k}/${b + k}) changes the ratio.`],
  });
  return choose(rng, q, right, [`${a}/${b} = ${a + k}/${b + k}`, `${a}/${b} = ${a * k}/${b + k}`, `${a}/${b} = ${b}/${a}`]);
}

function scaleModelTyped(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const s = pick(rng, [50, 200, 500]); const m = 2 * rint(rng, 6, 30); const real = (m * s) / 100;
    return typed(q11('scale-model', {
      prompt: `A 1 : ${s} scale model of the bridge is ${m} cm long. How long is the real bridge, in metres?`,
      expression: `1/${s} = ${m}/x (x in cm), then x ÷ 100 = ? m`, answer: real, unit: 'm',
      hint: 'Every real length is the model length times the scale. Then change cm to m.',
      steps: [`1/${s} = ${m}/x gives x = ${lab(m, 'model cm')} × ${lab(s, 'scale')} = ${lab(m * s, 'real cm')}.`, `${lab(m * s, 'real cm')} ÷ ${lab(100, 'cm per m')} = ${lab(fmt(real), 'real m')}.`],
    }));
  }
  const v = rint(rng, 2, 4); const bags = v * rint(rng, 2, 4); const V = rint(rng, v + 1, 12); const ans = (bags / v) * V;
  return typed(q11('scale-model', {
    prompt: `${v} m³ of concrete needs ${bags} bags of cement. How many bags for ${V} m³?`,
    expression: `${v}/${bags} = ${V}/x`, answer: ans, unit: 'bags',
    hint: 'Find the bags for 1 m³ first.',
    steps: [`${lab(bags, 'bags')} ÷ ${lab(v, 'm³')} = ${lab(bags / v, 'bags per m³')}.`, `${lab(V, 'm³')} × ${lab(bags / v, 'bags per m³')} = ${lab(ans, 'bags')}.`],
  }));
}

/* =====================================================================================
 * 12. The coordinate plane
 * ===================================================================================== */
const K12 = 'coordinates';
const q12 = Q(K12, 'Surveyors, CNC machines and game engines all place things with (x, y) coordinates.');
const GRID: [number, number, number, number] = [-6, 6, -6, 6];

function plotPointStep(rng: Rng): AskStep {
  const x = rnz(rng, -6, 6); let y = rnz(rng, -6, 6); if (y === x) y = -y;
  const q = q12('plot', {
    prompt: `Ada's survey stake goes at ${pt(x, y)}. Plot it.`,
    expression: pt(x, y), answer: x, answerText: pt(x, y),
    hint: 'First number: across (x). Second number: up or down (y).',
    steps: ['Start at the origin (0, 0).', `Go ${labn(Math.abs(x), `step ${x < 0 ? 'left' : 'right'}`, `steps ${x < 0 ? 'left' : 'right'}`)}, then ${labn(Math.abs(y), `step ${y < 0 ? 'down' : 'up'}`, `steps ${y < 0 ? 'down' : 'up'}`)}.`],
  });
  return model(q, { kind: 'plot', range: GRID, count: 1, label: 'Survey grid' }, [`${x},${y}`], `Tap ${pt(x, y)}.`);
}

function readPointChoose(rng: Rng): AskStep {
  const x = rnz(rng, -6, 6); let y = rnz(rng, -6, 6); if (Math.abs(y) === Math.abs(x)) y = y > 0 ? (y % 6) + 1 : -((Math.abs(y) % 6) + 1);
  if (Math.abs(y) === Math.abs(x)) y = y > 0 ? (y % 6) + 1 : -((Math.abs(y) % 6) + 1);
  const q = q12('read', {
    prompt: 'The drone hovers at point P. What are its coordinates?',
    expression: 'P = (x, y)', answer: x, answerText: pt(x, y),
    hint: 'Read across to x first, then up or down to y.',
    steps: [`P is ${labn(Math.abs(x), `step ${x < 0 ? 'left' : 'right'}`, `steps ${x < 0 ? 'left' : 'right'}`)} of the y-axis: x = ${fmt(x)}.`, `P is ${labn(Math.abs(y), `step ${y < 0 ? 'below' : 'above'}`, `steps ${y < 0 ? 'below' : 'above'}`)} the x-axis: y = ${fmt(y)}.`],
    visual: { type: 'plot', range: GRID, layers: { points: [{ x, y, label: 'P' }] } },
  });
  return choose(rng, q, pt(x, y), [pt(y, x), pt(-x, y), pt(x, -y)]);
}

function quadrantChoose(rng: Rng): AskStep {
  const x = rnz(rng, -6, 6); const y = rnz(rng, -6, 6);
  const qd = x > 0 ? (y > 0 ? 'I' : 'IV') : y > 0 ? 'II' : 'III';
  const q = q12('quadrant', {
    prompt: `A signal buoy sits at ${pt(x, y)}. Which quadrant is it in?`,
    expression: pt(x, y), answer: ['I', 'II', 'III', 'IV'].indexOf(qd) + 1, answerText: `Quadrant ${qd}`,
    hint: 'I is top right; the numbering goes counter-clockwise.',
    steps: [`x is ${x < 0 ? 'negative (left)' : 'positive (right)'}; y is ${y < 0 ? 'negative (down)' : 'positive (up)'}.`, `${x < 0 ? 'Left' : 'Right'} and ${y < 0 ? 'down' : 'up'} is Quadrant ${qd}.`],
    visual: { type: 'plot', range: GRID, layers: {} },
  });
  return choose(rng, q, `Quadrant ${qd}`, ['I', 'II', 'III', 'IV'].filter((z) => z !== qd).map((z) => `Quadrant ${z}`));
}

function moveStep(rng: Rng): AskStep {
  let x0 = 0; let y0 = 0; let dx = 0; let dy = 0; let g = 0;
  do { x0 = rint(rng, -5, 5); y0 = rint(rng, -5, 5); dx = rnz(rng, -5, 5); dy = rnz(rng, -5, 5); } while ((Math.abs(x0 + dx) > 6 || Math.abs(y0 + dy) > 6) && g++ < 80);
  if (Math.abs(x0 + dx) > 6 || Math.abs(y0 + dy) > 6) { x0 = 1; y0 = -2; dx = -4; dy = 3; }
  const X = x0 + dx; const Y = y0 + dy;
  const q = q12('translate', {
    prompt: `The drone at ${pt(x0, y0)} flies ${Math.abs(dx)} ${dx < 0 ? 'left' : 'right'} and ${Math.abs(dy)} ${dy < 0 ? 'down' : 'up'}. Where does it land?`,
    expression: `${pt(x0, y0)} → ?`, answer: X, answerText: pt(X, Y),
    hint: 'Left and right change x; up and down change y.',
    steps: [`x: ${lab(fmt(x0), 'start x')} ${dx < 0 ? '−' : '+'} ${labn(Math.abs(dx), `step ${dx < 0 ? 'left' : 'right'}`, `steps ${dx < 0 ? 'left' : 'right'}`)} = ${lab(fmt(X), 'new x')}.`, `y: ${lab(fmt(y0), 'start y')} ${dy < 0 ? '−' : '+'} ${labn(Math.abs(dy), `step ${dy < 0 ? 'down' : 'up'}`, `steps ${dy < 0 ? 'down' : 'up'}`)} = ${lab(fmt(Y), 'new y')}.`, `It lands at ${pt(X, Y)}.`],
  });
  return model(q, { kind: 'plot', range: GRID, count: 1, label: 'Flight grid', layers: { points: [{ x: x0, y: y0, label: 'start' }] } }, [`${X},${Y}`], 'Tap where the drone lands.');
}

function reflectStep(rng: Rng): AskStep {
  const x = rnz(rng, -6, 6); const y = rnz(rng, -6, 6); const acrossX = rng.next() < 0.5;
  const X = acrossX ? x : -x; const Y = acrossX ? -y : y;
  const q = q12('reflect', {
    prompt: `Mirror the bracket at ${pt(x, y)} across the ${acrossX ? 'x-axis' : 'y-axis'}. Where is its twin?`,
    expression: `reflect ${pt(x, y)} in the ${acrossX ? 'x' : 'y'}-axis`, answer: X, answerText: pt(X, Y),
    hint: 'The twin is the same distance from the mirror line, on the other side.',
    steps: [acrossX ? `Across the x-axis, x stays ${fmt(x)} and y becomes its opposite, ${fmt(-y)}.` : `Across the y-axis, y stays ${fmt(y)} and x becomes its opposite, ${fmt(-x)}.`, `The twin is at ${pt(X, Y)}.`],
  });
  return model(q, { kind: 'plot', range: GRID, count: 1, label: `Mirror: the ${acrossX ? 'x' : 'y'}-axis`, layers: { points: [{ x, y, label: 'bracket' }] } }, [`${X},${Y}`], 'Tap the twin point.');
}

function distanceTyped(rng: Rng): AskStep {
  const a = -rint(rng, 1, 6); const b = rint(rng, 1, 6); const c = rnz(rng, -5, 5); const horiz = rng.next() < 0.5;
  const P = horiz ? [a, c] : [c, a]; const R = horiz ? [b, c] : [c, b];
  return typed(q12('distance', {
    prompt: `The pump is at ${pt(P[0], P[1])} and the tank at ${pt(R[0], R[1])}. How long is the straight pipe between them?`,
    expression: `${pt(P[0], P[1])} to ${pt(R[0], R[1])}`, answer: b - a, unit: 'units',
    hint: `The ${horiz ? 'y' : 'x'}-values match, so count along the ${horiz ? 'x' : 'y'}-direction, across 0.`,
    steps: [`Same ${horiz ? 'y' : 'x'}, so the pipe is ${horiz ? 'horizontal' : 'vertical'}.`, `From ${lab(fmt(a), 'pump')} to 0 is ${-a} ${-a === 1 ? 'unit' : 'units'}; from 0 to ${lab(b, 'tank')} is ${b} ${b === 1 ? 'unit' : 'units'}.`, `${labn(-a, 'unit to zero', 'units to zero')} + ${labn(b, 'unit past zero', 'units past zero')} = ${lab(b - a, 'units of pipe')}.`],
    visual: { type: 'plot', range: GRID, layers: { points: [{ x: P[0], y: P[1], label: 'pump' }, { x: R[0], y: R[1], label: 'tank' }], segments: [{ a: [P[0], P[1]], b: [R[0], R[1]], dashed: true }] } },
  }));
}

function pickPointStep(rng: Rng): AskStep {
  let x = 0; let y = 0; let g = 0; let cands: [number, number][] = [];
  do { x = rnz(rng, -5, 5); y = rnz(rng, -5, 5); cands = [[x, y], [y, x], [-x, y], [x, -y]]; } while (new Set(cands.map((c) => c.join(','))).size < 4 && g++ < 80);
  const vs: Visual[] = cands.map(([px, py]) => ({ type: 'plot', range: GRID, layers: { points: [{ x: px, y: py }] } }));
  const q = q12('pick', {
    prompt: `Which grid shows the point ${pt(x, y)}?`,
    expression: pt(x, y), answer: x,
    hint: 'x first (across), then y (up or down).',
    steps: [`${pt(x, y)}: ${Math.abs(x)} ${x < 0 ? 'left' : 'right'}, ${Math.abs(y)} ${y < 0 ? 'down' : 'up'}.`, `${pt(y, x)} swaps them: a different point.`],
  });
  return pickLettered(rng, q, vs, 0, `the dot at ${pt(x, y)}`);
}

function areaGridTyped(rng: Rng): AskStep {
  const a = rint(rng, 1, 5); const c = rint(rng, 1, 5); const b = rint(rng, 1, 5); const d = rint(rng, 1, 5);
  const w = a + c; const h = b + d;
  return typed(q12('area', {
    prompt: `A solar panel's corners sit at ${pt(-a, b)}, ${pt(c, b)}, ${pt(c, -d)} and ${pt(-a, -d)}. What is its area?`,
    expression: 'area = width × height', answer: w * h, unit: 'square units',
    hint: 'Find the width across 0 and the height across 0 first.',
    steps: [`Width: from ${fmt(-a)} to ${c} is ${lab(a, 'left of zero')} + ${lab(c, 'right of zero')} = ${lab(w, 'width')}.`, `Height: from ${fmt(-d)} to ${b} is ${lab(d, 'below zero')} + ${lab(b, 'above zero')} = ${lab(h, 'height')}.`, `Area: ${lab(w, 'width')} × ${lab(h, 'height')} = ${lab(w * h, 'square units')}.`],
  }));
}

/** Three staked corners of a rectangle across the axes: tap the fourth. */
function fourthCornerStep(rng: Rng): AskStep {
  const x1 = -rint(rng, 1, 5); const x2 = rint(rng, 1, 5); const y1 = -rint(rng, 1, 5); const y2 = rint(rng, 1, 5);
  const corners: [number, number][] = [[x1, y2], [x2, y2], [x2, y1], [x1, y1]];
  const miss = rint(rng, 0, 3); const [mx, my] = corners[miss];
  const shown = corners.filter((_, i) => i !== miss);
  const q = q12('corner', {
    prompt: `Ada has staked three corners of a rectangular pad at ${shown.map(([x, y]) => pt(x, y)).join(', ')}. Tap the fourth corner.`,
    expression: `${shown.map(([x, y]) => pt(x, y)).join(', ')}, ?`, answer: mx, answerText: pt(mx, my),
    hint: 'The pad\'s sides run along grid lines, so every corner shares its x with one corner and its y with another.',
    steps: [`The x-values so far: ${shown.map(([x]) => fmt(x)).join(', ')}. ${fmt(mx)} appears only once, so the fourth corner needs it too.`, `The y-values so far: ${shown.map(([, y]) => fmt(y)).join(', ')}. ${fmt(my)} appears only once.`, `The fourth corner is ${pt(mx, my)}.`],
  });
  return model(q, { kind: 'plot', range: GRID, count: 1, label: 'Pad corners', layers: { points: shown.map(([x, y]) => ({ x, y })) } }, [`${mx},${my}`], 'Tap the missing corner.');
}

/** Transfer: an L-shaped fence across quadrants; two grid-line distances added. */
function pathLengthTyped(rng: Rng): AskStep {
  const a = -rint(rng, 1, 6); const b = rint(rng, 1, 6); const y0 = rint(rng, 1, 6); const y1 = -rint(rng, 1, 6);
  const across = b - a; const down = y0 - y1;
  return typed(q12('path', {
    prompt: `Brick's fence runs from ${pt(a, y0)} to ${pt(b, y0)}, then turns and runs to ${pt(b, y1)}. Each grid unit is 1 m. How long is the fence?`,
    expression: `${pt(a, y0)} → ${pt(b, y0)} → ${pt(b, y1)}`, answer: across + down, unit: 'm',
    hint: 'Each leg runs along a grid line. Count each one across 0, then add the legs.',
    steps: [`First leg: same y, x from ${fmt(a)} to ${b}: ${lab(-a, 'm left of zero')} + ${lab(b, 'm right of zero')} = ${lab(across, 'm, first leg')}.`, `Second leg: same x, y from ${y0} to ${fmt(y1)}: ${lab(y0, 'm above zero')} + ${lab(-y1, 'm below zero')} = ${lab(down, 'm, second leg')}.`, `Total: ${lab(across, 'm, first leg')} + ${lab(down, 'm, second leg')} = ${lab(across + down, 'm of fence')}.`],
    visual: { type: 'plot', range: GRID, layers: { segments: [{ a: [a, y0], b: [b, y0] }, { a: [b, y0], b: [b, y1] }] } },
  }));
}

function coordQ(rng: Rng): Question {
  const a = -rint(rng, 1, 8); const b = rint(rng, 1, 8); const y = rnz(rng, -5, 5);
  return q12('distance', {
    prompt: 'Find the distance between the two points.', expression: `${pt(a, y)} to ${pt(b, y)}`, answer: b - a,
    hint: 'Same y: count across, through 0.', steps: [`${-a} + ${b} = ${b - a}.`],
  });
}

/* =====================================================================================
 * Chapters
 * ===================================================================================== */
const CHAPTERS: ChapterSpec[] = [
  {
    key: K1, title: 'Integers & the Number Line', wing: 'gate', wingName: 'City Gate Thermometers',
    goal: 'Place positive and negative numbers on a number line, compare and order them, and read opposites and absolute value as distances from zero.',
    misconception: 'Thinking −7 is greater than −2 because 7 > 2; treating absolute value as "make it negative" instead of distance from zero.',
    teach: [
      { title: 'Zero is the reference', text: 'Integers are the whole numbers, their negatives and 0. Zero is the reference point: numbers above it sit to the right; numbers below it run left and wear a minus sign. The digits say how far from 0, the sign says which side.', steps: ['A coil at 4° below zero: 4 steps left of 0, so 0 (zero mark) − 4 (degrees below) = −4 (coil reading).', 'A cage 3 m above the street: 3 steps right of 0, so 0 (street level) + 3 (m above) = 3 (cage level).', 'On the line: 4 (steps up to zero) + 3 (steps past zero) = 7 (steps apart).'], visual: nl(-10, 10, { points: [{ x: -4, label: '−4' }, { x: 3, label: '3' }] }) },
      { title: 'Further left is smaller', text: '−7 is colder than −2: it sits further left. On a number line, left is always less, no matter how big the digits look.', steps: ['−2 is 2 steps left of 0; −7 is 7 steps left of 0.', 'From −2, hop 5 more steps left: −2 (start) − 5 (hop left) = −7 (landing point).', 'So −7 < −2: at −7° it is 5 degrees colder.'], next: 'Put −3 and −8 on the line. Which is further left, so which is smaller?', model: { kind: 'numberline', start: -2, min: -12, max: 12, label: 'Start at −2° (warmer reading). Is −7° (colder reading) left or right of you?' } },
      { title: 'Opposites and absolute value', text: '5 and −5 are opposites: the same distance from 0 on opposite sides. |−5| = 5 (distance from zero) is that distance, and a distance is never negative.', visual: nl(-8, 8, { points: [{ x: -5, label: '−5' }, { x: 5, label: '5' }] }) },
    ],
    quests: [
      { id: 'aq.prealg.integers.frozen-gate', name: 'The Frozen Gate', giver: 'volt', guided: true,
        hook: 'Algebra City\'s gate thermometers froze below zero and read nonsense. Volt: "Set each gauge true. Left of zero is below, and below gets a minus."',
        change: 'The gate thermometers read true and the first gate bar lifts.',
        waves: [wave('Read the gauges', times(3, readIntStep)), wave('Mirror pegs', times(2, oppositeStep)), wave('Colder or warmer', times(3, compareIntStep))] },
      { id: 'aq.prealg.integers.mine-levels', name: 'Mine Levels', giver: 'brick',
        hook: 'Brick: "The lift board lists levels above and below the street. Sort them, measure the cables, and don\'t trust how big the digits look."',
        change: 'The lift board shows every level in order.',
        waves: [wave('Sort the levels', mixOf([orderIntStep, readIntStep])), wave('Distance from zero', mixOf([absStep, absPickStep, absStep])), wave('Twin pegs', mixOf([oppositeStep, readIntStep, compareIntStep]))] },
    ],
    concept: conceptFrom([oppositeStep, compareIntStep, absPickStep, readIntStep]),
    transfer: oneOf([closestToZeroStep, warmerClaimChoose]),
    practice: absTypedQ,
  },
  {
    key: K2, title: 'Adding & Subtracting Integers', wing: 'gate', wingName: 'Gate Reactor Room',
    goal: 'Add integers as hops on the number line, cancel zero pairs, and subtract by adding the opposite.',
    misconception: 'Reading a − (−b) as a − b; believing two negatives always make a positive, even when adding.',
    teach: [
      { title: 'Adding is a hop', text: 'Start at the first number. Add a positive: hop right. Add a negative: hop left. The size of the number is how far you hop.', steps: ['Start at −3 (start) and add 5 (hop right).', '−3 → −2 → −1 → 0 → 1 → 2', '−3 (start) + 5 (hop right) = 2 (landing point)', 'Adding a negative hops left: 2 (start) + (−6 (hop left)) = −4 (landing point).'], next: 'Start at −3 and add −4. Which way do you hop, and where do you land?', model: { kind: 'numberline', start: -3, min: -12, max: 12, label: 'Start at −3 (start) and add 5 (hop right)' } },
      { title: 'Zero pairs', text: 'A + charge and a − charge cancel to 0. 5 + (−8): five pairs cancel, three − charges are left. So 5 (positive charges) + (−8 (negative charges)) = −3 (net charge).', visual: card('5 + (−8)', ['+ + + + +', '− − − − − − − −', '5 pairs cancel → −3']) },
      { title: 'Subtract = add the opposite', text: 'Watch the pattern: 4 − 2 = 2, 4 − 1 = 3, 4 − 0 = 4, 4 − (−1) = 5, 4 − (−2) = 6. Subtracting a negative adds. Taking away cold leaves it warmer.', visual: card('4 − (−2)', ['4 − 1 = 3', '4 − 0 = 4', '4 − (−1) = 5', '4 − (−2) = 6']) },
    ],
    quests: [
      { id: 'aq.prealg.int-add.reactor-swings', name: 'Reactor Swings', giver: 'volt', guided: true,
        hook: 'The gate reactor swings above and below zero. Volt: "Hop the changes on the rail. Warming goes right, cooling goes left."',
        change: 'The reactor settles and the gate hums with steady power.',
        waves: [wave('Hop the changes', times(3, addHopStep)), wave('Charge pairs', mixOf([zeroPairStep, jumpsPickStep, twoNegChoose])), wave('Take away cold', times(2, subHopStep))] },
      { id: 'aq.prealg.int-add.cold-packs', name: 'Cold Packs', giver: 'catalyst',
        hook: 'Dr. Catalyst: "My mixes need exact temperatures. Adding cold, removing cold: get the signs right or the batch curdles."',
        change: 'Catalyst\'s mixing vats hold their temperatures.',
        waves: [wave('Remove the cold', mixOf([subNegChoose, rewriteChoose, subHopStep])), wave('Big swings', times(3, wordAddTyped)), wave('Hop it out', mixOf([subHopStep, addHopStep]))] },
    ],
    concept: conceptFrom([addHopStep, subHopStep, jumpsPickStep, rewriteChoose]),
    transfer: oneOf([spanTyped, liftTripTyped]),
    practice: intAddQ,
  },
  {
    key: K3, title: 'Multiplying & Dividing Integers', wing: 'foundry', wingName: 'Sign Foundry',
    goal: 'Multiply as repeated groups, discover the sign rules from patterns (including why negative × negative is positive), and divide as the inverse.',
    misconception: 'Thinking a negative times a negative is negative, or that "two negatives make a positive" also works for adding.',
    teach: [
      { title: 'Groups of negatives', text: 'Multiplying counts groups: 3 × (−4) means three groups of −4. On the line, start at 0 and hop −4 three times.', steps: ['(−4) + (−4) + (−4) = −12', 'The hops: 0 → −4 → −8 → −12.', 'So 3 (groups) × (−4 (each hop)) = −12 (landing point): a positive times a negative is negative.'], visual: nl(-14, 2, { jumps: [{ from: 0, to: -4 }, { from: -4, to: -8 }, { from: -8, to: -12 }] }) },
      { title: 'Follow the pattern', text: 'Multiply −3 by 2, 1, 0, −1, −2. The products go −6, −3, 0, then 3, 6: each step adds 3. So −3 × (−1) = 3. Negative × negative is positive because the pattern demands it.', next: 'Keep the pattern one row further: what is −3 × (−3)?', model: { kind: 'table', cols: ['multiply', 'product'], rows: [['−3 × 1', -3], ['−3 × 0', 0], ['−3 × (−1)', null], ['−3 × (−2)', null]], label: 'Keep the pattern going' } },
      { title: 'Division undoes it', text: '−12 ÷ 3 = −4 because 3 × (−4) = −12. Same rules: same signs give positive, different signs give negative.', visual: card('Sign rules', ['+ × + = +', '− × − = +', '+ × − = −', '÷ follows the same rules']) },
    ],
    quests: [
      { id: 'aq.prealg.int-mult.sign-foundry', name: 'The Sign Foundry', giver: 'newton', guided: true,
        hook: 'Newton: "The foundry stamps signs on every part. Find the pattern and you will never have to memorise a rule."',
        change: 'The foundry stamps run true: every part gets the right sign.',
        waves: [wave('Follow the pattern', times(2, patternTableStep)), wave('Lower the cage', mixOf([repeatHopStep, groupsPickStep])), wave('Stamp the sign', mixOf([signRuleChoose, signPredictStep, signRuleChoose, agoTyped]))] },
      { id: 'aq.prealg.int-mult.drain-rates', name: 'Drain Rates', giver: 'ada',
        hook: 'Ada: "The city tanks drain at signed rates. Multiply forward, divide back, and tell me the sign before you do the arithmetic."',
        change: 'Every tank in the foundry district shows its true drain rate.',
        waves: [wave('Per minute', mixOf([divIntTyped, repeatHopStep, divIntTyped])), wave('Count the negatives', mixOf([signPredictStep, patternTableStep, signPredictStep])), wave('Back in time', mixOf([agoTyped, repeatHopStep]))] },
    ],
    concept: conceptFrom([patternTableStep, signPredictStep, repeatHopStep, groupsPickStep]),
    transfer: oneOf([avgChangeTyped, freezerTyped]),
    practice: intMultQ,
  },
  {
    key: K4, title: 'Order of Operations', wing: 'foundry', wingName: 'Foundry Control Panel',
    goal: 'Evaluate expressions with brackets, powers, negatives and all four operations in the agreed order, and place brackets to change a result.',
    misconception: 'Working strictly left to right through every operation; the opposite slip of always doing × before ÷ and + before − (24 ÷ 4 × 2 read as 24 ÷ 8, 20 − 8 + 2 read as 20 − 10); reading −3² as (−3)² = 9.',
    teach: [
      { title: 'Why an order at all', text: 'The order of operations is the order everyone agrees to work a calculation in, so the same panel reads the same for every engineer. In 2 + 3 × 4, multiplication comes before addition: it reads as three fours joined to 2.', steps: ['3 × 4 = 12 first.', 'Then 2 + 12 = 14.', 'Adding first would give (2 + 3) × 4 = 20: a different reading, so the order matters.'], visual: card('2 + 3 × 4', ['3 × 4 = 12 first', '2 + 12 = 14']) },
      { title: 'Brackets, powers, ×÷, +−', text: 'Brackets first. Then powers: a power is packed multiplication (4² = 4 × 4), so unpack it before any other ×. Then × and ÷: × is packed addition, so it goes before +. × and ÷ rank equal, so work them left to right, and the same for + and −: 24 ÷ 4 × 2 = 12 and 20 − 8 + 2 = 14.', visual: card('Order', ['( ) brackets', 'x² powers (packed ×)', '× ÷ left to right (packed +)', '+ − left to right', '24 ÷ 4 × 2 = 6 × 2 = 12']) },
      { title: 'The minus and the square', text: 'A power grabs only what it touches. −3² = −(3 × 3) = −9. (−3)² = (−3) × (−3) = 9. Brackets decide.', next: 'Which is bigger: −4² or (−4)²?', visual: card('−3² vs (−3)²', ['−3² = −9', '(−3)² = 9']) },
    ],
    quests: [
      { id: 'aq.prealg.order.control-panel', name: 'The Control Panel', giver: 'vector', guided: true,
        hook: 'The foundry panel shows expressions, and every apprentice reads them differently. Vector: "One order, agreed by all. Read it layer by layer."',
        change: 'The control panel reads the same for everyone.',
        waves: [wave('Layer by layer', times(2, layerTableStep)), wave('Multiply first', mixOf([evalTimesChoose, orderLineStep, sameRankChoose])), wave('Powers and minus signs', mixOf([negSquareChoose, powerChoose, orderLineStep]))] },
      { id: 'aq.prealg.order.brackets', name: 'Bracket Keys', giver: 'ada',
        hook: 'Ada: "The gauges need exact readings. Slot the bracket keys in the right places and the valves open."',
        change: 'The bracket keys turn and the foundry valves open.',
        waves: [wave('Place the brackets', times(2, parensChoose)), wave('Read the gauge', mixOf([orderLineStep, layerTableStep, powerChoose])), wave('The minus trap', mixOf([negSquareChoose, sameRankChoose, orderLineStep]))] },
    ],
    concept: conceptFrom([layerTableStep, negSquareChoose, sameRankChoose, parensChoose]),
    transfer: oneOf([wordToOrderChoose, pumpBillChoose]),
    practice: orderQ,
  },
  {
    key: K5, title: 'Variables & Expressions', wing: 'library', wingName: 'Variable Library',
    goal: 'Read a letter as a number that can change, evaluate expressions (with negatives), fill a rule table, and write expressions from words.',
    misconception: 'Reading 3n with n = 4 as 34; writing "5 less than n" as 5 − n.',
    teach: [
      { title: 'A letter is a box for a number', text: 'A variable is a letter that stands for a number we do not know yet, or one that changes. A number written next to it multiplies it: 3n means 3 × n.', steps: ['n is 4, so 3n = 3 × 4 = 12.', 'Not 34: the 3 and the n are multiplied, not written side by side.', 'Change the box to 10: 3 × 10 = 30.'], visual: card('3n', ['3n = 3 × n', 'n = 4 → 3 × 4 = 12']) },
      { title: 'Evaluate: fill the box', text: 'To evaluate an expression, put the number in place of the letter, then follow the order of operations. Put negatives in brackets so the signs stay honest.', steps: ['Rule 3x + 5, with x as −2.', '3 × (−2) + 5 = −6 + 5 = −1', 'That is the first row of the table: −2 → −1.'], next: 'Fill the row for x = 1: what is 3 × 1 + 5?', model: { kind: 'table', cols: ['x', '3x + 5'], rows: [[-2, -1], [-1, null], [0, null], [1, null]], label: 'Rule: 3x + 5' } },
      { title: 'Words to symbols', text: '"5 less than n" starts at n and takes 5 away: n − 5. "Twice n, plus 7" is 2n + 7. Read what you start with, then what happens to it.', steps: ['If n is 12: n − 5 = 12 − 5 = 7, which is 5 less than 12.', 'Twice n, plus 7 with n as 3: 2 × 3 + 7 = 13.', 'Twice (n plus 7) with n as 3: 2 × (3 + 7) = 20. The brackets change the answer.'], next: 'Write "4 more than twice n" in symbols. What is it when n is 5?', visual: card('Words → symbols', ['5 less than n → n − 5', 'twice n plus 7 → 2n + 7', 'twice (n plus 7) → 2(n + 7)']) },
    ],
    quests: [
      { id: 'aq.prealg.expressions.library', name: 'The Variable Library', giver: 'vector', guided: true,
        hook: 'The library\'s formula books are written in letters. Vector: "A letter is a box. Fill it with a number and the formula speaks."',
        change: 'The library lamps light formula by formula.',
        waves: [wave('Fill the box', mixOf([concatChoose, evalTableStep, evalExprStep])), wave('Rule tables', mixOf([evalTableStep, sliderSolveStep])), wave('Words to symbols', mixOf([lessThanExprChoose, wordsToExprChoose, wordsToExprChoose]))] },
      { id: 'aq.prealg.expressions.crate-formulas', name: 'Crate Formulas', giver: 'brick',
        hook: 'Brick: "Every crate has a formula. Write it, evaluate it, and find the n that hits the target weight."',
        change: 'The crate labels carry formulas that work for any load.',
        waves: [wave('Write the formula', mixOf([storyExprChoose, lessThanExprChoose, storyExprChoose])), wave('Hit the target', times(2, sliderSolveStep)), wave('Evaluate', mixOf([evalExprStep, evalTableStep, evalExprStep]))] },
    ],
    concept: conceptFrom([evalTableStep, concatChoose, sliderSolveStep, lessThanExprChoose]),
    transfer: oneOf([formulaTyped]),
    practice: (rng) => evalExprStep(rng).question,
  },
  {
    key: K6, title: 'Like Terms & the Distributive Property', wing: 'library', wingName: 'Area Model Hall',
    goal: 'Combine like terms, expand k(x + m) with the area model (negatives too), test a claimed identity with numbers, and factor out a common number.',
    misconception: 'Combining unlike terms (3x + 2 = 5x); distributing to the first term only: 3(x + 4) = 3x + 4.',
    teach: [
      { title: 'Like terms are like units', text: '3x + 5x = 8x, just as 3 crates + 5 crates = 8 crates. But 3x + 2 cannot merge: crates and loose bolts are different things.', visual: card('Like terms', ['3x + 5x = 8x', '4 + 7 = 11', '3x + 2 stays 3x + 2']) },
      { title: 'The area model', text: '3(x + 4) is a plate 3 tall and x + 4 wide. Split it: 3 (height) × x (left width) = 3x and 3 (height) × 4 (right width) = 12 (right area). So 3(x + 4) = 3x + 12. The 3 multiplies BOTH parts.', next: 'Split 4(x + 2) the same way. What are the two plates?', visual: areaViz('3', '4', '3x', '12') },
      { title: 'Negatives distribute too', text: '−2(x − 5): −2 × x = −2x and −2 × (−5) = +10. So −2(x − 5) = −2x + 10. Carry the sign with the number.', visual: card('−2(x − 5)', ['−2 × x = −2x', '−2 × (−5) = +10', '= −2x + 10']) },
    ],
    quests: [
      { id: 'aq.prealg.like-terms.area-hall', name: 'The Area Model Hall', giver: 'brick', guided: true,
        hook: 'Brick\'s floor plates are labelled with expressions. Brick: "Split the plates into panels and read each area. No shortcuts that lose a panel."',
        change: 'The hall floor is laid, panel by panel.',
        waves: [wave('Split the plate', mixOf([areaNumbersStep, distributePartsStep])), wave('Test the shortcut', mixOf([checkTableStep, areaModelPick])), wave('Expand and combine', mixOf([distributeChoose, combineChoose, distributeChoose]))] },
      { id: 'aq.prealg.like-terms.recipe-cards', name: 'Recipe Cards', giver: 'catalyst',
        hook: 'Dr. Catalyst: "My recipe cards are a mess of terms. Tidy them: combine, expand, factor, then tell me the value."',
        change: 'Catalyst\'s recipe cards are clean and short.',
        waves: [wave('Tidy the cards', mixOf([combineChoose, likeTermsTallyStep, combineChoose])), wave('Factor and check', mixOf([factorChoose, checkTableStep, areaModelPick])), wave('Simplify, then evaluate', mixOf([likeTermsTallyStep, simplifyEvalTyped, distributePartsStep]))] },
    ],
    concept: conceptFrom([checkTableStep, areaModelPick, distributePartsStep, likeTermsTallyStep]),
    transfer: oneOf([perimeterExprChoose]),
    practice: (rng) => simplifyEvalTyped(rng).question,
  },
  {
    key: K7, title: 'One-Step Equations', wing: 'plaza', wingName: 'Balance Plaza',
    goal: 'Treat an equation as a balance, undo addition, subtraction, multiplication or division by doing the inverse to both sides, and check by substituting.',
    misconception: 'Doing the operation shown instead of undoing it (x + 7 = 12 → x = 19); changing only one side of the equation.',
    teach: [
      { title: 'An equation is a balance', text: 'x + 3 = 8: both pans weigh the same. Take 3 off the left and you must take 3 off the right, or the scale tips. What is left: x = 5.', next: 'Try x + 7 = 12 in your head: what comes off both pans, and what is x?', model: { kind: 'balance', a: 1, b: 3, c: 0, d: 8, label: 'Take the same off both pans.' } },
      { title: 'Undo with the inverse', text: 'Adding is undone by subtracting; multiplying is undone by dividing. 4x = 20: divide both sides by 4, x = 5. x ÷ 3 = 6: multiply both sides by 3, x = 18.', visual: card('Inverse pairs', ['+ 3 ↔ − 3', '× 4 ↔ ÷ 4', '÷ 3 ↔ × 3']) },
      { title: 'Check by substituting', text: 'Put your answer back in the original. 4 × 5 = 20 ✓. If the check fails, the balance was broken somewhere.', visual: { type: 'balance', left: '4 × 5', right: '20', unknown: '=' } },
    ],
    quests: [
      { id: 'aq.prealg.one-step.plaza-scale', name: 'The Plaza Scale', giver: 'vector', guided: true,
        hook: 'The giant scale in Balance Plaza is stuck. Vector: "Whatever you do to one pan, do to the other. Get x alone and it swings free."',
        change: 'The plaza scale swings free and the fountain starts.',
        waves: [wave('Take it off both pans', times(3, balanceAddStep)), wave('Undo it', times(2, inverseChoose)), wave('Share it out', times(3, balanceMultStep))] },
      { id: 'aq.prealg.one-step.weigh-station', name: 'Weigh Station', giver: 'newton',
        hook: 'Newton: "Every cart at the weigh station has an unknown. Write the equation, balance it, and check your answer by putting it back."',
        change: 'The weigh station logs every cart correctly.',
        waves: [wave('Which one balances', times(2, solutionChoose)), wave('On the scale', mixOf([balanceMultStep, balanceAddStep, divEqTyped])), wave('Cart problems', mixOf([wordEqTyped, balanceAddStep, wordEqTyped]))] },
    ],
    concept: conceptFrom([balanceAddStep, inverseChoose, balanceMultStep, solutionChoose]),
    transfer: oneOf([springTyped, ohmSolveTyped]),
    practice: (rng) => wordEqTyped(rng).question,
  },
  {
    key: K8, title: 'Two-Step Equations', wing: 'plaza', wingName: 'Plaza Clockwork',
    goal: 'Solve ax + b = c by undoing in reverse order on the balance, handle negative coefficients and x on both sides, and model fee-plus-rate stories.',
    misconception: 'Dividing before undoing the addition, and dividing only one term: 3x + 6 = 21 → x + 6 = 7.',
    teach: [
      { title: 'Unwrap in reverse', text: '3x + 5 = 20. To build it, x was multiplied by 3, then 5 was added. Undo in reverse: subtract 5 (3x = 15), then divide by 3 (x = 5). Last on, first off.', next: 'Unwrap 2x + 7 = 19: which move comes first, and what is x?', model: { kind: 'balance', a: 3, b: 5, c: 0, d: 20, label: 'Undo the + 5 first.' } },
      { title: 'Every term, both sides', text: 'Dividing 3x + 6 = 21 by 3 gives x + 2 = 7, not x + 6 = 7. Any move must reach every term on both pans. Clearing the + 6 first avoids the trap.', visual: card('3x + 6 = 21', ['− 6 both sides: 3x = 15', '÷ 3 both sides: x = 5', 'not x + 6 = 7']) },
      { title: 'x on both pans', text: '5x + 2 = 2x + 14. Take 2x off both pans: 3x + 2 = 14. Now it is a two-step equation you know: x = 4.', visual: { type: 'balance', left: '5x + 2', right: '2x + 14', unknown: 'x' } },
    ],
    quests: [
      { id: 'aq.prealg.two-step.clockwork', name: 'The Plaza Clockwork', giver: 'ada', guided: true,
        hook: 'The plaza clock\'s gears are locked by two-step equations. Ada: "Unwrap each one in reverse: last thing done, first thing undone."',
        change: 'The plaza clock ticks again.',
        waves: [wave('Unwrap it', times(3, balanceTwoStep)), wave('Next line', times(2, nextLineChoose)), wave('Think of a number', mixOf([thinkNumberTyped, balanceTwoStep]))] },
      { id: 'aq.prealg.two-step.fees', name: 'Fees and Fares', giver: 'brick',
        hook: 'Brick: "Drones, cranes, frames: a fixed part plus a rate every time. Set up the equation and balance it out."',
        change: 'The city ledger balances to the cent.',
        waves: [wave('Fixed plus rate', mixOf([wordTwoStepTyped, balanceTwoStep, wordTwoStepTyped])), wave('Which x works', mixOf([solutionTwoChoose, nextLineChoose])), wave('Blocks on both pans', times(2, bothSidesBalance))] },
    ],
    concept: conceptFrom([balanceTwoStep, nextLineChoose, bothSidesBalance, solutionTwoChoose]),
    transfer: oneOf([tempSolveTyped, tankTyped]),
    practice: (rng) => thinkNumberTyped(rng).question,
  },
  {
    key: K9, title: 'One-Step Inequalities', wing: 'plaza', wingName: 'Safety Limits Board',
    goal: 'Write inequalities from limits, graph them with open or closed dots, solve one-step inequalities, and flip the sign when multiplying or dividing by a negative.',
    misconception: 'Mixing up open and closed dots; forgetting to flip the sign when dividing by a negative; reading "at least" as ≤.',
    teach: [
      { title: 'Many answers', text: 'An inequality says one side is less (<) or more (>) than the other. x < 3 is true for every number left of 3, so the answer is a ray, not a single point.', steps: ['Test 2: 2 < 3 ✓. Test −5: −5 < 3 ✓.', 'Test 2.9: 3 − 2.9 = 0.1, still below 3 ✓.', 'Test 3: 3 < 3 is false, so 3 itself is left out: open dot.', 'Every number that works sits left of 3: the shaded ray.'], visual: nl(-8, 8, { ray: { from: 3, dir: 'left', open: true } }) },
      { title: 'Open or closed', text: '< and > leave the boundary out: open dot. ≤ and ≥ include it: closed dot. "At most 5" is x ≤ 5, closed.', steps: ['A crane lifts at most 5 t: x (load in t) ≤ 5 (limit in t).', 'A 2 t crate plus a 3 t crate: 2 (first crate in t) + 3 (second crate in t) = 5 (load in t), exactly the limit and allowed, so the dot at 5 is closed.', 'A 4 t crate plus a 2 t crate: 4 (first crate in t) + 2 (second crate in t) = 6 (load in t), over the limit.', 'The picture: a closed dot at −2 shading right is x ≥ −2, and −2 itself is in.'], next: 'Picture x < 1: open or closed dot, and which way does it shade?', visual: nl(-8, 8, { ray: { from: -2, dir: 'right', open: false } }) },
      { title: 'Flip on a negative', text: 'Multiplying or dividing both sides by a negative mirrors the line across 0, so the order flips: < becomes >. Adding, subtracting, or using a positive never flips it.', steps: ['2 < 5. Times −1: −1 × 2 = −2 and −1 × 5 = −5.', 'On the line −2 is right of −5, so −2 > −5: the order flipped.', 'Solve −2x < 6: divide by −2 and flip, 6 ÷ (−2) = −3, so x > −3.', 'Check 0: −2 × 0 = 0, and 0 < 6 ✓. Check −4: −2 × (−4) = 8, and 8 < 6 is false ✗.'], visual: nl(-6, 6, { points: [{ x: 2, label: '2' }, { x: 5, label: '5' }, { x: -2, label: '−2' }, { x: -5, label: '−5' }] }) },
    ],
    quests: [
      { id: 'aq.prealg.inequalities.limits-board', name: 'The Limits Board', giver: 'volt', guided: true,
        hook: 'The plaza\'s safety board lists limits, and the lights are wrong. Volt: "Open dot or closed, left or right. Show me every safe value."',
        change: 'The safety board glows with correct limits.',
        waves: [wave('Graph the limit', times(2, rayPickStep)), wave('Find the edge', times(3, boundaryIntStep)), wave('Limits in words', times(3, wordIneqChoose))] },
      { id: 'aq.prealg.inequalities.overload', name: 'Overload Alarms', giver: 'newton',
        hook: 'Newton: "Each alarm has a limit with a negative in it. Solve, and watch the sign when you divide."',
        change: 'The overload alarms trip only when they should.',
        waves: [wave('Solve the limit', mixOf([solveIneqChoose, negDivChoose, boundaryIntStep])), wave('Safe or not', mixOf([testValueChoose, boundaryIntStep, testValueChoose])), wave('Flip or not', mixOf([negDivChoose, boundaryIntStep]))] },
    ],
    concept: conceptFrom([rayPickStep, boundaryIntStep, negDivChoose, testValueChoose]),
    transfer: oneOf([craneLimitTyped]),
    practice: (rng) => craneLimitTyped(rng).question,
  },
  {
    key: K12, title: 'The Coordinate Plane', wing: 'grid', wingName: 'Grid Tower Survey',
    goal: 'Plot and read points in all four quadrants, move and reflect them, find distances along grid lines, and complete a shape from its corners.',
    misconception: 'Swapping x and y ((3, −2) plotted at (−2, 3)); numbering the quadrants the wrong way round.',
    teach: [
      { title: 'Two number lines cross', text: 'The coordinate plane is two number lines crossing at 0, the origin (0, 0). The x-axis runs across, the y-axis runs up. A point (x, y) says across first, then up or down.', steps: ['(3, −2): start at the origin.', 'Across: 0 (origin) + 3 (steps right) = 3 (x value), so 3 to the right.', 'Then up or down: 0 (origin) − 2 (steps down) = −2 (y value), so 2 down.', 'Land on the dot at (3, −2).'], visual: { type: 'plot', range: [-6, 6, -6, 6], layers: { points: [{ x: 3, y: -2, label: '(3, −2)' }] } } },
      { title: 'Four quadrants', text: 'The axes cut the plane into four quadrants, numbered counter-clockwise from the top right: I (+, +), II (−, +), III (−, −), IV (+, −). The signs of x and y tell you the quadrant.', steps: ['(3, 3): right and up, (+, +), so quadrant I.', 'Mirror it across the y-axis: x changes sign, −1 × 3 = −3, so (3, 3) → (−3, 3) in II.', 'Mirror that across the x-axis: y changes sign, −1 × 3 = −3, so (−3, 3) → (−3, −3) in III.', '(3, −3): right and down, (+, −), so quadrant IV.'], next: 'Which quadrant holds (−4, 2)?', visual: { type: 'plot', range: [-6, 6, -6, 6], layers: { points: [{ x: 3, y: 3, label: 'I' }, { x: -3, y: 3, label: 'II' }, { x: -3, y: -3, label: 'III' }, { x: 3, y: -3, label: 'IV' }] } } },
    ],
    quests: [
      { id: 'aq.prealg.coordinates.survey', name: 'The Tower Survey', giver: 'ada', guided: true,
        hook: 'Ada is surveying the Grid Tower site. Ada: "Stakes go where the coordinates say. Across first, then up or down, or the tower goes up crooked."',
        change: 'The survey stakes stand in true positions around the tower.',
        waves: [wave('Drive the stakes', times(3, plotPointStep)), wave('Read the grid', mixOf([readPointChoose, quadrantChoose, pickPointStep])), wave('Drone moves', times(2, moveStep))] },
      { id: 'aq.prealg.coordinates.mirror-works', name: 'Mirror Works', giver: 'newton',
        hook: 'Newton: "Mirror brackets, pipe runs and pad corners. Every point is two numbers: across first, then up or down."',
        change: 'The tower beacon lights: every grid line is true.',
        waves: [wave('Mirror it', times(2, reflectStep)), wave('Pipe runs', mixOf([distanceTyped, quadrantChoose, distanceTyped])), wave('Stake the pad', mixOf([fourthCornerStep, readPointChoose, fourthCornerStep]))] },
    ],
    concept: conceptFrom([plotPointStep, pickPointStep, reflectStep, fourthCornerStep]),
    transfer: oneOf([areaGridTyped, pathLengthTyped]),
    practice: coordQ,
  },
  {
    key: K10, title: 'Ratios, Rates & Unit Rates', wing: 'docks', wingName: 'Rate Docks',
    goal: 'Write a part-to-part ratio as an expression with a variable, find unit rates, fill rate tables from the rate for one, write the rule y = kx, compare deals by unit price, and graph a rate as points through the origin.',
    misconception: 'Dividing the wrong way round for a unit rate; thinking the smaller price tag is always the better buy; using "add the same" instead of "multiply by the rate".',
    teach: [
      { title: 'Ratios with a letter', text: 'A ratio compares two amounts. Concrete at 1 : 2 cement to sand means 2 buckets of sand for EACH bucket of cement. With c buckets of cement, the sand is 2c, not c + 2. A ratio scales by multiplying.', steps: ['1 (bucket of cement) × 2 (sand per cement) = 2 (buckets of sand).', '3 (buckets of cement) × 2 (sand per cement) = 6 (buckets of sand).', 'c (buckets of cement) × 2 (sand per cement) = 2c buckets of sand.', 'Adding 2 instead would give 3 (cement) + 2 (sand per cement) = 5 (buckets): the wrong mix.'], visual: card('1 : 2 cement to sand', ['1 bucket → 2 of sand', '3 buckets → 6 of sand', 'c buckets → 2c of sand']) },
      { title: 'Rate means per one', text: 'A rate compares two different units. 150 km in 3 hours is 150 (km) ÷ 3 (hours) = 50 (km per hour). Always ask "per what?" and divide by that.', visual: card('Unit rate', ['150 km ÷ 3 h', '= 50 km per 1 h']) },
      { title: 'Tables grow by the rate', text: 'A rate table lists matching amounts. Every row is the rate times the hours: distance = rate × time, so at 50 km/h the rule is d = 50t. The letter t can be any time.', steps: ['The rate: 50 km in each hour.', '1 h: 50 (km per hour) × 1 (hour) = 50 (km), the first row.', '3 h, not in the table: 50 (km per hour) × 3 (hours) = 150 (km).'], next: 'Fill the 2 h and 5 h rows. What do you multiply each time by?', model: { kind: 'table', cols: ['t (h)', 'd (km)'], rows: [[1, 50], [2, null], [5, null]], label: 'd = 50t' } },
      { title: 'Compare per one', text: 'To compare two deals, find the price for ONE: divide the price by how many. The lower price per one is the better buy, whatever the tag says.', steps: ['A: 6 bolts for $3, so $3 (pack price) ÷ 6 (bolts) = $0.50 (per bolt).', 'B: 10 bolts for $4, so $4 (pack price) ÷ 10 (bolts) = $0.40 (per bolt).', '$0.40 (B per bolt) < $0.50 (A per bolt), so B wins: the bigger price tag is the better buy here.'], visual: card('Better buy?', ['A: $3 ÷ 6 = $0.50 each', 'B: $4 ÷ 10 = $0.40 each', 'B wins']) },
      { title: 'Graph a rate', text: 'A rate can be drawn: time goes across, distance goes up, and each row of the table becomes a point. The points of d = 2t line up in a straight line through the origin. A rate is a line. That is where Algebra 1 begins.', steps: ['t is 0: d = 2 (rate) × 0 (time) = 0 (distance), the origin (0, 0).', 't is 1: d = 2 (rate) × 1 (time) = 2 (distance), the point (1, 2).', 't is 3: d = 2 (rate) × 3 (time) = 6 (distance), the point (3, 6).', 'Each step of 1 across goes up by 2, so the points make a straight line.'], next: 'Follow the dashed line to t = 5. How high is it there?', visual: { type: 'plot', range: [0, 6, 0, 12], layers: { fns: [{ fn: { kind: 'poly', c: [0, 2] }, label: 'd = 2t', dashed: true }], points: [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }] } } },
    ],
    quests: [
      { id: 'aq.prealg.rates.pump-log', name: 'The Pump Log', giver: 'ada', guided: true,
        hook: 'The dock pumps\' log is half blank. Ada: "Find the rate for one minute, and the whole log fills itself."',
        change: 'The dock pump log is complete.',
        waves: [wave('Ratio and rate for one', mixOf([ratioExprChoose, unitRateTyped])), wave('Fill the log', mixOf([rateTableStep, flipRateChoose, rateTableStep])), wave('Which rule', mixOf([ruleChoose, sliderTimeStep, ruleChoose]))] },
      { id: 'aq.prealg.rates.dock-market', name: 'Dock Market', giver: 'brick',
        hook: 'Brick: "Bolt sellers on every pier, all shouting prices. Per bolt, apprentice. Always per bolt."',
        change: 'The dock market boards show prices per unit.',
        waves: [wave('Better buy', times(2, betterBuyChoose)), wave('Rover runs', mixOf([sliderTimeStep, rateGraphStep])), wave('Logs and rates', mixOf([rateTableStep, flipRateChoose, unitRateTyped]))] },
    ],
    concept: conceptFrom([rateTableStep, sliderTimeStep, rateGraphStep, ruleChoose]),
    transfer: oneOf([mixTransferTyped]),
    practice: (rng) => unitRateTyped(rng).question,
  },
  {
    key: K11, title: 'Proportions', wing: 'docks', wingName: 'Blueprint Office',
    goal: 'Solve proportions for x with a scale factor or, when there is no whole-number factor, by cross-multiplying and balancing; set a proportion up the right way; scale drawings with non-unit scales; and treat percent as a proportion out of 100.',
    misconception: 'Additive thinking: 3/5 = x/10 → x = 8 because "5 went up by 5"; setting a proportion upside down on one side.',
    teach: [
      { title: 'Two equal ratios', text: '3/4 = x/12. The bottom went from 4 to 12: × 3 (scale factor). So the top goes × 3 too: x = 9. Scale by multiplying, never by adding.', model: { kind: 'ratiotable', labels: ['top', 'bottom'], rows: [[3, 4], [null, 12]] } },
      { title: 'Scale drawings', text: 'A scale drawing shrinks every length by the same ratio: on a 4 cm : 10 m plan, 4 cm on paper is 10 m in real life. A 6 cm beam is not a whole number of 4 cm steps, so halve the scale first. Same kind of quantity in the same place on both sides.', steps: ['Halve both sides: 4 (cm on paper) ÷ 2 = 2 (cm per step) and 10 (m on site) ÷ 2 = 5 (m per step), so 2 cm ↔ 5 m.', 'The beam: 6 (cm drawn) ÷ 2 (cm per step) = 3 (steps).', 'Each step is 5 m: 3 (steps) × 5 (m per step) = 15 (m real beam).', 'Check: 4 (cm on paper) × 1.5 (scale up) = 6 (cm drawn) and 10 (m on site) × 1.5 (scale up) = 15 (m real beam), the same ratio.'], next: 'On the same plan, how long in real life is a 10 cm beam?', visual: card('4 cm : 10 m', ['÷ 2: 2 cm ↔ 5 m', '6 cm = 3 × 2 cm → 3 × 5 = 15 m']) },
      { title: 'No whole-number factor? Cross-multiply', text: '4/6 = 10/x. 4 → 10 is × 2.5: no whole-number jump. Equal ratios have equal cross products, so 4 × x = 6 × 10: 4x = 60. Balance it: x = 15.', model: { kind: 'balance', a: 4, b: 0, c: 0, d: 60, label: '4x = 6 × 10' } },
      { title: 'Percent is a proportion', text: '30% of what is 12? part ↔ percent, whole ↔ 100: 12/W = 30/100. 30% (share) ↔ 12 (part), so 10% (share) ↔ 4 (part) and 100% (whole) ↔ 40 (whole). Percent is a ratio with 100 at the bottom.', model: { kind: 'ratiotable', labels: ['part', 'percent'], rows: [[12, 30], [null, 100]] } },
    ],
    quests: [
      { id: 'aq.prealg.proportions.blueprint-office', name: 'The Blueprint Office', giver: 'ada', guided: true,
        hook: 'The blueprint office\'s plans are drawn to scale, and the builders keep adding instead of multiplying. Ada: "Scale factor. Every part, times the same number."',
        change: 'The blueprints go out with correct real lengths.',
        waves: [wave('Scale the drawing', times(3, scaleRatioTableStep)), wave('Multiply, don\'t add', times(2, additiveTrapChoose)), wave('Solve for x', mixOf([crossMultBalanceStep, proportionPairChoose, solvePropTyped, crossMultBalanceStep]))] },
      { id: 'aq.prealg.proportions.percent-tanks', name: 'Percent Tanks', giver: 'catalyst',
        hook: 'Dr. Catalyst: "My tanks and inspections are all in percents. Part is to whole as percent is to 100: that is all it ever is."',
        change: 'The tank gauges show litres and percents that agree.',
        waves: [wave('Percent tables', times(2, percentTableStep)), wave('Set it up right', mixOf([setupChoose, percentPropTyped, setupChoose])), wave('Pumps and plans', mixOf([scaleRatioTableStep, percentTableStep, percentPropTyped]))] },
    ],
    concept: conceptFrom([scaleRatioTableStep, crossMultBalanceStep, percentTableStep, setupChoose]),
    transfer: oneOf([scaleModelTyped]),
    practice: (rng) => solvePropTyped(rng).question,
  },
  {
    key: 'trial', title: 'Mastery Trial & Graduation', wing: 'tower', wingName: "The Sorcerer's Tower",
    goal: 'Prove durable command of Pre-Algebra: integers, expressions, equations and inequalities, the coordinate plane, and ratios and proportions. Seat the Variable Core and open the road to Algebra 1.',
    misconception: 'Treating each chapter as its own trick; an equation, a proportion and a rate graph are all the same balance idea.',
    teach: [
      { title: 'Trial rules', text: 'Five phases, twenty-seven prompts across the whole academy, one helper you may use once. Pass at 80% or better. Every chapter must already be mastered.', visual: card('The Mastery Trial', ['Integers & order', 'Expressions', 'Equations & inequalities', 'The plane & ratios', 'Transfer']) },
    ],
    quests: [
      { id: 'aq.prealg.trial.rehearsal', name: 'Gate Rehearsal', giver: 'vector', guided: true,
        hook: 'Vector: "The Algebra Sorcerer\'s tower waits. First, a rehearsal at the gate: same shape, no stakes."',
        change: 'The tower door unbars.',
        waves: [wave('Integers', mixOf([compareIntStep, addHopStep, signRuleChoose, negSquareChoose])), wave('Expressions', mixOf([distributeChoose, evalTableStep])), wave('Equations', mixOf([balanceMultStep, balanceTwoStep, solveIneqChoose])), wave('Grids and ratios', mixOf([plotPointStep, rateTableStep, additiveTrapChoose]))] },
      { id: 'aq.prealg.trial.sorcerer', name: 'The Algebra Sorcerer', giver: 'newton',
        hook: 'The Algebra Sorcerer bars the stair with balances and grids. Newton: "Everything you learned is the same idea: keep it balanced, keep it in proportion."',
        change: 'The Sorcerer bows and the stair to the Variable Core opens.',
        waves: [wave('Balances', mixOf([balanceTwoStep, bothSidesBalance, boundaryIntStep])), wave('Ratios and grids', mixOf([rateTableStep, additiveTrapChoose, plotPointStep, rateGraphStep]))] },
    ],
    concept: conceptFrom([compareIntStep, distributeChoose, balanceTwoStep, setupChoose]),
    transfer: oneOf([spanTyped, avgChangeTyped, formulaTyped, perimeterExprChoose, tankTyped, craneLimitTyped, mixTransferTyped, scaleModelTyped, areaGridTyped]),
    practice: (rng) => pick(rng, [intAddQ, intMultQ, orderQ, coordQ])(rng),
  },
];

export const PREALGEBRA = defineAcademy({
  id: ID,
  name: 'Pre-Algebra Academy',
  short: 'Pre-Algebra',
  tier: 'Foundational',
  blurb: 'Integers, variables, expressions, ratios and proportions, and your first equations.',
  icon: 'book',
  home: 'algebra-city',
  wings: {
    gate: { name: 'City Gate', icon: 'unlock' },
    foundry: { name: 'Sign Foundry', icon: 'anvil' },
    library: { name: 'Variable Library', icon: 'scroll' },
    plaza: { name: 'Balance Plaza', icon: 'gauge' },
    grid: { name: 'Grid Tower', icon: 'map' },
    docks: { name: 'Rate Docks', icon: 'pump' },
    tower: { name: "Sorcerer's Tower", icon: 'star' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'Integers & order', items: [compareIntStep(rng), absStep(rng), subHopStep(rng), twoNegChoose(rng), patternTableStep(rng), signPredictStep(rng), layerTableStep(rng), negSquareChoose(rng)] },
    { name: 'Expressions', items: [evalExprStep(rng), wordsToExprChoose(rng), combineChoose(rng), distributeChoose(rng), areaModelPick(rng)] },
    { name: 'Equations & inequalities', items: [balanceMultStep(rng), balanceTwoStep(rng), nextLineChoose(rng), bothSidesBalance(rng), rayPickStep(rng), negDivChoose(rng)] },
    { name: 'The plane & ratios', items: [plotPointStep(rng), rateTableStep(rng), rateGraphStep(rng), additiveTrapChoose(rng), crossMultBalanceStep(rng), percentTableStep(rng)] },
    { name: 'Transfer', items: [tankTyped(rng), areaGridTyped(rng)] },
  ],
  trialIntro: 'The Mastery Trial in the Algebra Sorcerer\'s tower. Five phases across the whole academy, one helper, 80% to pass. The Variable Core is waiting.',
  coreName: 'The Variable Core',
  coreLine: 'Integers to the coordinate plane: every letter in Algebra City lights up. The Variable Core turns, the balance in the plaza settles level, and the road to the Algebra 1 Academy opens.',
  coreColor: '#a78bfa',
  title: 'Pre-Algebra Graduate',
});
