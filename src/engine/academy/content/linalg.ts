/**
 * The Linear Algebra Academy (first-year college): vectors, span, the dot product, matrices, linear
 * maps of the plane, matrix products, systems and row reduction, determinants, inverses, rank and
 * eigenvalues. Home region: the Linear Algebra Grid. Every chapter teaches the picture first (arrows
 * on the grid, the columns of a matrix as where the basis goes) and then the arithmetic.
 *
 * Note on display: a model step shows the question visual above the model unless the model draws the
 * same kind of picture (see visualPolicy.ts), so any matrix a plot or balance step needs is written
 * inline as [a b; c d] (rows split by semicolons). Choose and typed steps carry a `mat`, `plot` or card.
 */
import { defineAcademy, type ChapterSpec } from '../defs';
import type { PlotLayers } from '../types';
import {
  academySkill, mkq, typed, choose, model, ask, wave, times, mixOf, conceptFrom, oneOf, rint, pick, rnz, fmt,
  coefTerm, polyStr, fracStr, gcd, type Rng, type AskStep, type Visual, type Question,
} from '../kit';
import { lab, labn, unit } from '../../label';

const ID = 'linalg';
const S = (key: string) => academySkill(ID, key);

/* =====================================================================================
 * Helpers
 * ===================================================================================== */
type Vec = number[];
type Mat = number[][];

const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n: number) => String(n).replace(/\d/g, (d) => SUBS[Number(d)]);
/** A vector as text: (3, −2). */
const vs = (v: Vec) => `(${v.map(fmt).join(', ')})`;
/** A matrix inline: [2 −1; 0 3] (rows split by semicolons). */
const ms = (A: Mat) => `[${A.map((r) => r.map(fmt).join(' ')).join('; ')}]`;
/** A number in parentheses when negative, for worked steps: 3 · (−2). */
const pn = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
/** a² with the sign kept visible: (−3)². */
const sq = (n: number) => `${pn(n)}²`;
/** A linear expression from coefficients: lin([2, −1], ['u', 'v']) → '2u − v'. Zero terms are skipped. */
function lin(cs: number[], vars: string[]): string {
  const out: string[] = [];
  cs.forEach((c, i) => {
    if (!c) return;
    if (!out.length) out.push(coefTerm(c, vars[i]));
    else out.push(`${c < 0 ? '−' : '+'} ${coefTerm(Math.abs(c), vars[i])}`);
  });
  return out.length ? out.join(' ') : '0';
}
/** A sum of products for worked steps: 2·4 + 3·(−1). */
const prods = (a: Vec, b: Vec) => a.map((x, i) => `${pn(x)}·${pn(b[i])}`).join(' + ');

const dot = (a: Vec, b: Vec) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a: Vec, b: Vec) => a.map((x, i) => x + b[i]);
const scale = (k: number, a: Vec) => a.map((x) => k * x + 0);
const det2 = (A: Mat) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const mul = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const mulv = (A: Mat, v: Vec): Vec => A.map((r) => r.reduce((s, a, k) => s + a * v[k], 0));
const transpose = (A: Mat): Mat => A[0].map((_, j) => A.map((r) => r[j]));
const col = (A: Mat, j: number): Vec => A.map((r) => r[j]);
const eqM = (A: Mat, B: Mat) => JSON.stringify(A) === JSON.stringify(B);
/** Table answer: entries in reading order. */
const csv = (xs: (number | string)[]) => xs.map((x) => String(x)).join(',');
const fits = (v: Vec, r = 6) => v.every((x) => Math.abs(x) <= r);

/** Retry `make` until `ok`, falling back to a known-good value. Uses only the rng inside `make`. */
function until<T>(make: () => T, ok: (t: T) => boolean, fallback: T): T {
  for (let i = 0; i < 300; i++) { const t = make(); if (ok(t)) return t; }
  return fallback;
}

const R6: [number, number, number, number] = [-6, 6, -6, 6];
const plotV = (layers: PlotLayers, range = R6): Visual => ({ type: 'plot', range, layers });
const matV = (mats: [Mat | (number | string)[][], string?][], ops?: string[]): Visual => ({ type: 'mat', mats: mats.map(([rows, label]) => ({ rows, label })), ops });
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });

/** Pick the matching picture, options labelled Panel 1…4 in screen order (letters would clash with matrix names). */
function pickLettered(rng: Rng, q: Question, visuals: Visual[], rightIdx = 0): AskStep {
  const seen = new Set<string>(); const keep: number[] = [];
  visuals.forEach((v, i) => { const k = JSON.stringify(v); if (!seen.has(k)) { seen.add(k); keep.push(i); } });
  const order = rng.shuffle(keep.slice(0, 4));
  const options = order.map((i, k) => ({ visual: visuals[i], label: `Panel ${k + 1}` }));
  const right = options[order.indexOf(rightIdx)].label;
  return ask({ ...q, answerText: q.answerText ?? right }, 'pickmodel', { options, accept: [right] });
}

/** All nonzero lattice multiples of `dir` inside ±r, as "x,y" plot answers. */
function multiples(dir: Vec, r = 6): string[] {
  const g = gcd(dir[0], dir[1]); const d = [dir[0] / g, dir[1] / g];
  const out: string[] = [];
  for (let k = -12; k <= 12; k++) { if (!k) continue; const p = [k * d[0] + 0, k * d[1] + 0]; if (fits(p, r)) out.push(`${p[0]},${p[1]}`); }
  return out;
}

/* =====================================================================================
 * Chapter 1 · Vectors
 * ===================================================================================== */
const K1 = 'vectors';

function vecAddStep(rng: Rng): AskStep {
  const u = [rnz(rng, -3, 3), rnz(rng, -3, 3)];
  const v = until(() => [rnz(rng, -3, 3), rnz(rng, -3, 3)], (p) => p[0] !== -u[0] || p[1] !== -u[1], [u[0], 1]);
  const w = add(u, v);
  const layers: PlotLayers = { vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], from: [u[0], u[1]], label: 'v', color: 'teal' }] };
  const q = mkq(S(K1), 'add', {
    prompt: `Beacon arrow u = ${vs(u)}. Arrow v = ${vs(v)} starts at the tip of u.`,
    expression: 'u + v = ?', answer: 0, answerText: vs(w),
    hint: 'Add matching components: x with x, y with y.',
    steps: [`Add component by component: (${fmt(u[0])} + ${pn(v[0])}, ${fmt(u[1])} + ${pn(v[1])}).`, `u + v = ${vs(w)}: exactly where v's tip lands.`],
    visual: plotV(layers), app: 'Surveyors and drones add displacement vectors leg by leg.',
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: 'u, then v from its tip', layers }, [`${w[0]},${w[1]}`], 'Tap the point where u + v ends.');
}

function scalarStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, -1, -2]); const m = Math.floor(6 / Math.abs(k));
  const v = until(() => [rint(rng, -m, m), rint(rng, -m, m)], (p) => p[0] !== 0 || p[1] !== 0, [1, 1]);
  const w = scale(k, v); const name = coefTerm(k, 'v');
  const layers: PlotLayers = { vectors: [{ x: v[0], y: v[1], label: 'v', color: 'teal' }] };
  const q = mkq(S(K1), 'scale', {
    prompt: `Beacon v = ${vs(v)}. Scale it by ${fmt(k)}.`,
    expression: `${name} = ?`, answer: 0, answerText: vs(w),
    hint: k < 0 ? 'Multiply every component. A negative scalar also flips the arrow around.' : 'Multiply every component by the scalar.',
    steps: [`Multiply each component by ${lab(fmt(k), 'scalar')}: (${fmt(k)}·${pn(v[0])}, ${fmt(k)}·${pn(v[1])}).`, `${name} = ${vs(w)}${k < 0 ? ', pointing the opposite way' : ''}.`],
    visual: plotV(layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: `v is drawn; build ${name}`, layers }, [`${w[0]},${w[1]}`], `Tap the tip of ${name}.`);
}

function displacementStep(rng: Rng): AskStep {
  const A = until(() => [rint(rng, -4, 4), rint(rng, -4, 4)], (p) => p[0] !== 0 || p[1] !== 0, [2, -1]);
  const B = until(() => [rint(rng, -4, 4), rint(rng, -4, 4)], (p) => (p[0] !== A[0] && p[1] !== A[1]) && (p[0] !== 0 || p[1] !== 0), [A[0] + 3, A[1] - 2]);
  const d = [B[0] - A[0], B[1] - A[1]];
  const q = mkq(S(K1), 'displacement', {
    prompt: `A survey drone flies from A = ${vs(A)} to B = ${vs(B)}. What is its displacement vector?`,
    expression: 'AB→ = ?', answer: 0,
    hint: 'Displacement is end minus start.',
    steps: [`AB→ = B − A (end minus start).`, `(${fmt(B[0])} − ${pn(A[0])}, ${fmt(B[1])} − ${pn(A[1])}) = ${vs(d)}.`],
    visual: plotV({ points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }] }),
  });
  return choose(rng, q, vs(d), [vs([A[0] - B[0], A[1] - B[1]]), vs(add(A, B)), vs(B)]);
}

const TRIPLES2: Vec[] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5], [12, 5, 13]];
const TRIPLES3: Vec[] = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [2, 1, 2, 3], [3, 6, 2, 7]];
const sgn = (rng: Rng) => (rng.next() < 0.5 ? -1 : 1);

function lengthVec(rng: Rng, three = rng.next() < 0.4): { v: Vec; r: number } {
  const t = three ? pick(rng, TRIPLES3) : pick(rng, TRIPLES2);
  const v = t.slice(0, -1).map((x) => x * sgn(rng));
  return { v, r: t[t.length - 1] };
}
function lengthStep(rng: Rng): AskStep {
  const { v, r } = lengthVec(rng); const ss = v.reduce((s, x) => s + x * x, 0);
  const q = mkq(S(K1), 'length', {
    prompt: `How long is the beacon arrow v = ${vs(v)}?`,
    expression: '|v| = ?', answer: r,
    hint: 'Square each component, add them, then take the square root.',
    steps: [`|v| = √(${v.map(sq).join(' + ')})`, `= √${ss} = ${lab(r, 'length')}.`],
    // Only the (3, 4) arrows fit a phone-sized grid; longer arrows and 3D vectors get a card.
    visual: v.length === 2 && fits(v, 6) ? plotV({ vectors: [{ x: v[0], y: v[1], label: 'v' }] }) : card(v.length === 2 ? 'Beacon arrow' : 'v in space', [`v = ${vs(v)}`, v.length === 2 ? '|v| = √(x² + y²)' : '|v| = √(x² + y² + z²)']),
  });
  return typed(q);
}

function lengthProbeStep(rng: Rng): AskStep {
  const [p, qq, r] = pick(rng, TRIPLES2);
  const q = mkq(S(K1), 'length-probe', {
    prompt: `Cable u pulls ${p} N east and cable v pulls ${qq} N north on the same hook. How strong is the combined pull |u + v|?`,
    expression: `u = (${p}, 0), v = (0, ${qq}), |u + v| = ?`, answer: r,
    hint: 'Add the vectors first, then measure the new arrow. Lengths do not simply add.',
    steps: [`East pull ${lab(p, 'force in N')}, north pull ${lab(qq, 'force in N')}: u + v = (${p}, ${qq}).`, `|u + v| = √(${p}² + ${qq}²) = √${p * p + qq * qq} = ${lab(r, 'combined pull in N')}.`, `That is less than ${lab(p, 'newtons')} + ${lab(qq, 'newtons')} = ${lab(p + qq, 'N if pulls just added')}.`],
    visual: plotV({ vectors: [{ x: p, y: 0, label: 'u' }, { x: 0, y: qq, from: [p, 0], label: 'v', color: 'teal' }] }, [-2, 14, -2, 14]),
    app: 'Riggers add cable forces as vectors before choosing a shackle.',
  });
  return choose(rng, q, `${r} N`, [`${p + qq} N`, `${p * p + qq * qq} N`, `${Math.abs(p - qq)} N`]);
}

function vec3Step(rng: Rng): AskStep {
  const u = [rint(rng, -3, 3), rint(rng, -3, 3), rint(rng, -3, 3)];
  const v = [rint(rng, -3, 3), rint(rng, -3, 3), rint(rng, -3, 3)];
  const [a, b] = pick(rng, [[2, -1], [1, 1], [1, -1], [3, 1], [2, 1], [-1, 2]]);
  const w = add(scale(a, u), scale(b, v)); const name = lin([a, b], ['u', 'v']);
  const q = mkq(S(K1), 'combine3', {
    prompt: `Crane cables in space: u = ${vs(u)}, v = ${vs(v)}. Build ${name}.`,
    expression: `${name} = ?`, answer: 0, answerText: vs(w),
    hint: 'Scale each vector first, then add x with x, y with y, z with z.',
    steps: [`${coefTerm(a, 'u')} = ${vs(scale(a, u))}, ${coefTerm(b, 'v')} = ${vs(scale(b, v))}.`, `Add components: ${name} = ${vs(w)}.`],
    visual: card('Vectors in R³', [`u = ${vs(u)}`, `v = ${vs(v)}`]),
  });
  return model(q, { kind: 'table', rowLabels: ['x', 'y', 'z'], rows: [[null], [null], [null]], label: name, bracket: true }, [csv(w)], `Fill in the three components of ${name}.`);
}

function hikerPathStep(rng: Rng): AskStep {
  const t = pick(rng, TRIPLES3); const r = t[3];
  const total = rng.shuffle(t.slice(0, 3)).map((x) => x * sgn(rng));
  const leg1 = [rint(rng, -3, 3), rint(rng, -3, 3), rint(rng, -1, 1)]; const leg2 = [rint(rng, -3, 3), rint(rng, -3, 3), rint(rng, -1, 1)];
  const leg3 = total.map((x, i) => x - leg1[i] - leg2[i]);
  const q = mkq(S(K1), 'gps', {
    prompt: `A hiker's GPS logs three legs as (east, north, up) in km: ${vs(leg1)}, ${vs(leg2)}, ${vs(leg3)}. How far is the hiker from camp in a straight line?`,
    expression: 'distance = |leg₁ + leg₂ + leg₃|', answer: r, unit: 'km',
    hint: 'Add the three legs into one displacement in space, then find its length.',
    steps: [`Total displacement = ${vs(total)} km (east, north, up).`, `Distance = √(${total.map(sq).join(' + ')}) = √${r * r} = ${lab(r, 'distance in km')}.`],
    visual: card('GPS track (east, north, up)', [`leg 1: ${vs(leg1)}`, `leg 2: ${vs(leg2)}`, `leg 3: ${vs(leg3)}`]),
    app: 'GPS receivers sum displacement vectors in 3D to track position and altitude.',
  });
  return typed(q);
}

const VECTORS: ChapterSpec = {
  key: K1, title: 'Vectors in R² and R³', wing: 'beacons', wingName: 'Beacon Field',
  goal: 'Read a vector as components, add vectors tip to tail, scale them, find a displacement B − A, and measure length in the plane and in space.',
  misconception: 'Adding lengths instead of components (|u + v| = |u| + |v|); displacement as start minus end; thinking a negative scalar only shrinks an arrow instead of flipping it.',
  teach: [
    { title: 'An arrow is its components', text: 'v = (3, 2) means 3 across and 2 up. Slide the arrow anywhere and it is the same vector. The arrow from point A to point B is B − A: end minus start.', steps: ['v = (3, 2): 3 across, 2 up from the origin.', 'A = (−4, −3) and B = (−1, −1).', 'B − A: (−1 − (−4), −1 − (−3)) = (3, 2)', 'Same components, so the teal arrow from A to B is the same v.'], next: 'Start v at (1, −2) instead. Where does its tip land?', visual: plotV({ vectors: [{ x: 3, y: 2, label: 'v' }, { x: 3, y: 2, from: [-4, -3], label: 'v', color: 'teal' }], points: [{ x: -4, y: -3, label: 'A' }, { x: -1, y: -1, label: 'B' }] }) },
    { title: 'Add tip to tail, scale by stretching', text: 'Start v at the tip of u: u + v ends where v ends. In numbers, add matching components. k·v multiplies every component by k; a negative k flips the arrow around.', steps: ['u = (3, 1) and v = (−1, 3).', 'u + v = (3 + (−1), 1 + 3) = (2, 4)', 'On the plot, v starts at the tip (3, 1) and ends on (2, 4).', 'Scale: 2u = (2 × 3, 2 × 1) = (6, 2), and −u = (−3, −1) points back.'], next: 'Draw v first, then u from its tip. Where does that path end?', visual: plotV({ vectors: [{ x: 3, y: 1, label: 'u' }, { x: -1, y: 3, from: [3, 1], label: 'v', color: 'teal' }, { x: 2, y: 4, label: 'u + v', color: 'ask' }] }) },
    { title: 'Length is Pythagoras', text: '|v| = √(x² + y²) in the plane and √(x² + y² + z²) in space. Lengths do not add: 3 east plus 4 north is 5 from base, not 7.', steps: ['(3, 4) has legs 3 (east) and 4 (north).', '|(3, 4)| = √(3² + 4²) = √(9 + 16) = √25 = 5 (length)', 'In space: |(2, 3, 6)| = √(4 + 9 + 36) = √49 = 7 (length)', 'Walking 3 (east) + 4 (north) = 7 (path length) is the long way round; the straight arrow is 5 (distance).'], next: 'Find |(6, 8)| in your head. How does it compare with |(3, 4)|?', visual: card('Length', ['|(3, 4)| = √(9 + 16) = 5', '|(2, 3, 6)| = √(4 + 9 + 36) = 7', '|u + v| ≤ |u| + |v|']) },
  ],
  quests: [
    { id: 'aq.linalg.vectors.beacons', name: 'Beacon Alignment', giver: 'vector', guided: true,
      hook: 'The Grid\'s beacons point every which way. Vector: "An arrow is just its components. Add them tip to tail and the beacons line up."',
      change: 'The first row of beacons snaps into line and glows teal.',
      waves: [wave('Tip to tail', times(3, vecAddStep)), wave('Stretch and flip', times(2, scalarStep)), wave('Measure', mixOf([lengthStep, lengthProbeStep, displacementStep]))] },
    { id: 'aq.linalg.vectors.survey', name: 'Drone Survey', giver: 'ada',
      hook: 'Ada: "My survey drones log every leg as a vector. Displacements, 3D cables, lengths: get them right or the map is junk."',
      change: 'The survey map of the Grid redraws itself, true to the metre.',
      waves: [wave('Displacements', mixOf([displacementStep, displacementStep, scalarStep])), wave('Into space', times(3, vec3Step)), wave('Lengths', mixOf([lengthStep, lengthProbeStep]))] },
  ],
  concept: conceptFrom([vecAddStep, scalarStep, vec3Step, lengthProbeStep]),
  transfer: oneOf([hikerPathStep]),
  practice: (rng) => lengthStep(rng).question,
};

/* =====================================================================================
 * Chapter 2 · Linear combinations & span
 * ===================================================================================== */
const K2 = 'span';

function combStep(rng: Rng): AskStep {
  const { u, v, a, b, w } = until(() => {
    const u = [rint(rng, -2, 2), rint(rng, -2, 2)]; const v = [rint(rng, -2, 2), rint(rng, -2, 2)];
    const a = rnz(rng, -2, 2); const b = rnz(rng, -2, 2);
    return { u, v, a, b, w: add(scale(a, u), scale(b, v)) };
  }, (t) => t.u[0] * t.v[1] - t.u[1] * t.v[0] !== 0 && fits(t.w) && !(t.w[0] === 0 && t.w[1] === 0), { u: [1, 0], v: [1, 1], a: 2, b: 1, w: [3, 1] });
  const name = lin([a, b], ['u', 'v']);
  const layers: PlotLayers = { vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v', color: 'teal' }] };
  const q = mkq(S(K2), 'combine', {
    prompt: `Mix the beacons: u = ${vs(u)}, v = ${vs(v)}. Where does ${name} point?`,
    expression: `${name} = ?`, answer: 0, answerText: vs(w),
    hint: 'Scale each arrow by its weight, then add the results.',
    steps: [`${coefTerm(a, 'u')} = ${vs(scale(a, u))} and ${coefTerm(b, 'v')} = ${vs(scale(b, v))}.`, `${name} = ${vs(w)}.`],
    visual: plotV(layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: 'u and v are drawn', layers }, [`${w[0]},${w[1]}`], `Tap the tip of ${name}.`);
}

/** Pairs (u, v) with determinant ±1, so every integer target has integer weights. */
const UNIMOD: [Vec, Vec][] = [[[1, 0], [1, 1]], [[1, 1], [0, 1]], [[2, 1], [1, 1]], [[1, 2], [0, 1]], [[1, -1], [0, 1]], [[3, 1], [2, 1]], [[1, 1], [1, 2]], [[2, 1], [3, 2]], [[1, 0], [2, 1]]];
function weightsProblem(rng: Rng) {
  return until(() => { const [u, v] = pick(rng, UNIMOD); const a = rnz(rng, -3, 3); const b = rnz(rng, -3, 3); return { u, v, a, b, w: add(scale(a, u), scale(b, v)) }; }, (t) => fits(t.w, 7), { u: [1, 0], v: [1, 1], a: 3, b: 2, w: [5, 2] });
}
const R7: [number, number, number, number] = [-7, 7, -7, 7];
const weightsSteps = (u: Vec, v: Vec, w: Vec, a: number, b: number, names: [string, string] = ['weight on u', 'weight on v']) => [
  `Match components: ${lin([u[0], v[0]], ['a', 'b'])} = ${fmt(w[0])} and ${lin([u[1], v[1]], ['a', 'b'])} = ${fmt(w[1])}.`,
  `Solve the pair: a = ${lab(fmt(a), names[0])}, b = ${lab(fmt(b), names[1])}.`,
  `Check: ${coefTerm(a, 'u')} ${b < 0 ? '−' : '+'} ${coefTerm(Math.abs(b), 'v')} = ${vs(add(scale(a, u), scale(b, v)))}.`,
];
function weightsStep(rng: Rng): AskStep {
  const { u, v, a, b, w } = weightsProblem(rng);
  const q = mkq(S(K2), 'weights', {
    prompt: `u = ${vs(u)}, v = ${vs(v)}. Find the weights so that a·u + b·v = ${vs(w)}.`,
    expression: `a·u + b·v = ${vs(w)}`, answer: a, answerText: `a = ${fmt(a)}, b = ${fmt(b)}`,
    hint: 'Write one equation for the x-components and one for the y-components, then solve the pair.',
    steps: weightsSteps(u, v, w, a, b),
    visual: plotV({ vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v', color: 'teal' }], points: [{ x: w[0], y: w[1], label: 'target' }] }, R7),
  });
  return model(q, { kind: 'table', cols: ['a', 'b'], rows: [[null, null]], label: `a·${vs(u)} + b·${vs(v)} = ${vs(w)}` }, [csv([a, b])], 'Fill in the weights a and b.');
}

function spanKindStep(rng: Rng): AskStep {
  const three = rng.next() < 0.35; const parallel = rng.next() < 0.55;
  const dim = three ? 3 : 2;
  const u = until(() => Array.from({ length: dim }, () => rint(rng, -3, 3)), (p) => p.filter((x) => x !== 0).length >= 2, three ? [1, 2, -1] : [2, -1]);
  const k = pick(rng, [2, -2, 3, -1].filter((m) => three || fits(scale(m, u), 7)));
  const v = parallel ? scale(k, u) : until(() => Array.from({ length: dim }, () => rint(rng, -3, 3)), (p) => {
    if (dim === 2) return p[0] * u[1] - p[1] * u[0] !== 0;
    const c = [u[1] * p[2] - u[2] * p[1], u[2] * p[0] - u[0] * p[2], u[0] * p[1] - u[1] * p[0]];
    return c.some((x) => x !== 0);
  }, three ? [0, 1, 1] : [1, 1]);
  const right = parallel ? 'a line through the origin' : three ? 'a plane through the origin' : 'the whole plane R²';
  const wrongs = three ? ['a line through the origin', 'a plane through the origin', 'all of R³', 'only the two arrows themselves'] : ['a line through the origin', 'the whole plane R²', 'only the two arrows themselves', 'a line that misses the origin'];
  const q = mkq(S(K2), 'span-kind', {
    prompt: `Two relay beacons: u = ${vs(u)} and v = ${vs(v)}. What is their span (every mix a·u + b·v)?`,
    expression: 'span{u, v} = ?', answer: 0,
    hint: 'Is v a multiple of u? If so, v adds no new direction.',
    steps: parallel
      ? [`v = ${fmt(k)}u, so v points along u's line: it adds no new direction.`, `Every mix a·u + b·v = (${lin([1, k], ['a', 'b'])})u stays on one line through the origin.`]
      : three
        ? ['u and v are not parallel, so they give two independent directions.', 'Two directions in space sweep out a plane through the origin, not all of R³.']
        : ['u and v are not parallel, so they give two independent directions.', 'Two independent directions in the plane reach every point: the whole plane.'],
    visual: three ? card('Beacons in space', [`u = ${vs(u)}`, `v = ${vs(v)}`]) : plotV({ vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v', color: 'teal' }] }, R7),
  });
  return choose(rng, q, right, wrongs.filter((w) => w !== right));
}

function inSpanStep(rng: Rng): AskStep {
  const yes = rng.next() < 0.5;
  // |v| ≤ 2 per component and k ∈ {±2, 3} keep the target w on a phone-sized [−7, 7] grid.
  const { v, k, w } = until(() => {
    const v = [rnz(rng, -2, 2), rnz(rng, -2, 2)]; const k = pick(rng, [2, 3, -2]); const d = pick(rng, [1, -1, 2]);
    return { v, k, w: yes ? scale(k, v) : [k * v[0], k * v[1] + d] };
  }, (t) => fits(t.w, 7), { v: [1, 2], k: 2, w: yes ? [2, 4] : [2, 5] });
  const q = mkq(S(K2), 'on-line', {
    prompt: `Relay beam v = ${vs(v)}. Can a stretched copy c·v hit the target w = ${vs(w)}?`,
    expression: 'w = c·v ?', answer: 0,
    hint: 'Find c from the x-components, then check it on the y-components too.',
    steps: yes
      ? [`x: ${fmt(w[0])} = c·${pn(v[0])} gives c = ${lab(fmt(k), 'stretch factor')}.`, `y: ${fmt(k)}·${pn(v[1])} = ${fmt(w[1])}. It checks, so w = ${coefTerm(k, 'v')}.`]
      : [`x: ${fmt(w[0])} = c·${pn(v[0])} gives c = ${lab(fmt(k), 'stretch factor')}.`, `y: ${fmt(k)}·${pn(v[1])} = ${fmt(k * v[1])}, not ${fmt(w[1])}. w is off the line of v.`],
    visual: plotV({ vectors: [{ x: v[0], y: v[1], label: 'v', color: 'teal' }], points: [{ x: w[0], y: w[1], label: 'w' }] }, R7),
  });
  const no = 'No: w is off the line of v';
  return yes ? choose(rng, q, `Yes: w = ${coefTerm(k, 'v')}`, [`Yes: w = ${coefTerm(k + 1, 'v')}`, no]) : choose(rng, q, no, [`Yes: w = ${coefTerm(k, 'v')}`, `Yes: w = ${coefTerm(k + 1, 'v')}`]);
}

const ALLOY: [Vec, Vec][] = [[[2, 1], [1, 1]], [[3, 1], [2, 1]], [[1, 1], [1, 2]], [[2, 1], [3, 2]], [[3, 2], [1, 1]]];
function alloyStep(rng: Rng): AskStep {
  const [A, B] = pick(rng, ALLOY); const a = rint(rng, 1, 4); const b = rint(rng, 1, 4); const t = add(scale(a, A), scale(b, B));
  const askA = rng.next() < 0.5;
  const q = mkq(S(K2), 'alloy', {
    prompt: `Dr. Catalyst melts stock bars. Bar A = ${A[0]} kg copper + ${A[1]} kg tin; bar B = ${B[0]} kg copper + ${B[1]} kg tin. The mould needs ${t[0]} kg copper and ${t[1]} kg tin. How many ${askA ? 'A' : 'B'} bars?`,
    expression: `a·${vs(A)} + b·${vs(B)} = ${vs(t)}`, answer: askA ? a : b,
    hint: 'Copper gives one equation, tin gives another. Solve them together.',
    steps: [`a = number of A bars, b = number of B bars.`, `Copper: ${lin([A[0], B[0]], ['a', 'b'])} = ${lab(t[0], 'kg copper needed')}.`, `Tin: ${lin([A[1], B[1]], ['a', 'b'])} = ${lab(t[1], 'kg tin needed')}.`, `Solve: a = ${labn(a, 'A bar')}, b = ${labn(b, 'B bar')}.`, `So ${labn(askA ? a : b, `${askA ? 'A' : 'B'} bar`)}.`],
    visual: card('Alloy recipe', [`A = ${vs(A)}  B = ${vs(B)}`, `target = ${vs(t)}`, '(copper, tin) in kg']),
    app: 'Metallurgists blend stock alloys by solving for the weights of a linear combination.',
  });
  return typed(q);
}
function thrusterStep(rng: Rng): AskStep {
  const { u, v, a, b, w } = until(() => weightsProblem(rng), (t) => t.a > 0 && t.b > 0, { u: [1, 0], v: [1, 1], a: 3, b: 2, w: [5, 2] });
  const askA = rng.next() < 0.5;
  const q = mkq(S(K2), 'thruster', {
    prompt: `A probe's thruster 1 pushes u = ${vs(u)} per second and thruster 2 pushes v = ${vs(v)} per second. To drift exactly ${vs(w)}, how many seconds does thruster ${askA ? 1 : 2} fire?`,
    expression: `a·${vs(u)} + b·${vs(v)} = ${vs(w)}`, answer: askA ? a : b, unit: 's',
    hint: 'The drift is a mix of the two pushes. Match x-components and y-components.',
    steps: weightsSteps(u, v, w, a, b, ['seconds, thruster one', 'seconds, thruster two']),
    visual: card('Thrusters', [`thruster 1: u = ${vs(u)}`, `thruster 2: v = ${vs(v)}`, `drift: ${vs(w)}`]),
  });
  return typed(q);
}

const SPAN: ChapterSpec = {
  key: K2, title: 'Linear Combinations & Span', wing: 'beacons', wingName: 'Beacon Relay',
  goal: 'Build a·u + b·v on the grid, find the weights that hit a target, and tell when two vectors span a line, a plane or all of R².',
  misconception: 'Believing any two vectors span the plane, even parallel ones; thinking the span is just the arrows drawn, not every mix of them; forgetting a span always passes through the origin.',
  teach: [
    { title: 'Mix two arrows', text: 'A linear combination a·u + b·v stretches u by a, v by b, then adds. With u = (1, 0) and v = (1, 1): 2u + v = (3, 1).', steps: ['2u = 2 × (1, 0) = (2, 0)', '2u + v = (2 + 1, 0 + 1) = (3, 1)', 'On the plot: walk u twice, then v once, and you land on (3, 1).'], next: 'Which mix a·u + b·v lands on (4, 3)?', visual: plotV({ vectors: [{ x: 1, y: 0, label: 'u' }, { x: 1, y: 1, label: 'v', color: 'teal' }, { x: 3, y: 1, label: '2u + v', color: 'ask' }] }) },
    { title: 'Span: everywhere you can reach', text: 'The span of u and v is every mix a·u + b·v. Two arrows that are not parallel reach the whole plane. Parallel arrows only reach one line through the origin: the second one adds no new direction.', steps: ['−2 × (2, −1) = (−4, 2): that is v, so v is parallel to u.', 'Any mix a·u + b·v is (a − 2b)·u: still a multiple of u.', 'For example 1·u + 1·v = (2 − 4, −1 + 2) = (−2, 1), on the dashed line y = −x/2.', '(1, 1) is off that line, so u and v can never reach it.'], visual: plotV({ fns: [{ fn: { kind: 'poly', c: [0, -0.5] }, dashed: true, color: 'muted' }], vectors: [{ x: 2, y: -1, label: 'u' }, { x: -4, y: 2, label: 'v = −2u', color: 'teal' }] }) },
    { title: 'Weights come from equations', text: 'To find the weights, match components: the x-parts give one equation and the y-parts another. Finding weights is solving a small system.', steps: ['Hit (5, 2) with u = (1, 0) and v = (1, 1).', 'x: a + b = 5 and y: b = 2', 'So b = 2 (weight on v) and a = 5 − 2 = 3 (weight on u).', 'Check: 3·(1, 0) + 2·(1, 1) = (3 + 2, 0 + 2) = (5, 2)'], next: 'Which weights a and b hit (1, 4)?', visual: card('a·(1, 0) + b·(1, 1) = (5, 2)', ['x: a + b = 5', 'y: b = 2', 'b = 2, a = 3']) },
  ],
  quests: [
    { id: 'aq.linalg.span.mixing', name: 'Beacon Mixing', giver: 'vector', guided: true,
      hook: 'Vector: "Two beacons, any strengths you like. Every point you can light is their span. Mix them."',
      change: 'Mixed beams sweep the Beacon Field and light every lattice point.',
      waves: [wave('Mix the arrows', times(3, combStep)), wave('What they span', times(2, spanKindStep)), wave('Find the weights', times(2, weightsStep))] },
    { id: 'aq.linalg.span.relay', name: 'Beacon Relay', giver: 'volt',
      hook: 'Volt: "The relay only takes beams that land exactly. Find the weights, and tell me which targets no stretch of one beam can reach."',
      change: 'The relay towers pass the beam across the Grid without a flicker.',
      waves: [wave('Weights', times(3, weightsStep)), wave('On the line?', times(2, inSpanStep)), wave('Mixes', mixOf([combStep, combStep, spanKindStep]))] },
  ],
  concept: conceptFrom([combStep, weightsStep, spanKindStep, inSpanStep]),
  transfer: oneOf([alloyStep, thrusterStep]),
  practice: (rng) => { const { u, v, a, b, w } = weightsProblem(rng); return mkq(S(K2), 'weights', { prompt: `u = ${vs(u)}, v = ${vs(v)}, and a·u + b·v = ${vs(w)}. Find a.`, expression: `a·u + b·v = ${vs(w)}, a = ?`, answer: a, negative: true, hint: 'Match x-components and y-components, then solve the pair.', steps: weightsSteps(u, v, w, a, b) }); },
};

/* =====================================================================================
 * Chapter 3 · Dot product, angle, projection
 * ===================================================================================== */
const K3 = 'dot';

function dotChooseStep(rng: Rng): AskStep {
  const u = [rnz(rng, -5, 5), rnz(rng, -5, 5)]; const v = [rnz(rng, -5, 5), rnz(rng, -5, 5)];
  const d = dot(u, v);
  const q = mkq(S(K3), 'dot-probe', {
    prompt: `Beam u = ${vs(u)}, beam v = ${vs(v)}. What is u · v?`,
    expression: 'u · v = ?', answer: d,
    hint: 'Multiply matching components, then add the products. The result is one number.',
    steps: [`u · v = ${prods(u, v)}`, `= ${fmt(u[0] * v[0])} + ${pn(u[1] * v[1])} = ${lab(fmt(d), 'dot product')}.`],
    visual: card('Dot product', [`u = ${vs(u)}`, `v = ${vs(v)}`]),
  });
  return choose(rng, q, fmt(d), [vs([u[0] * v[0], u[1] * v[1]]), fmt(u[0] * v[1] + u[1] * v[0]), fmt(Math.abs(u[0] * v[0]) + Math.abs(u[1] * v[1])), fmt(u[0] * v[0] - u[1] * v[1]), fmt(-d), fmt(d + 10)]);
}

function dotTypedStep(rng: Rng): AskStep {
  const n = rng.next() < 0.5 ? 3 : 2;
  const nz = (p: Vec) => p.filter((x) => x !== 0).length >= 2;
  const u = until(() => Array.from({ length: n }, () => rint(rng, -5, 5)), nz, n === 3 ? [2, -1, 3] : [2, -1]);
  const v = until(() => Array.from({ length: n }, () => rint(rng, -5, 5)), nz, n === 3 ? [1, 4, -2] : [3, 4]);
  const d = dot(u, v);
  const q = mkq(S(K3), 'dot', {
    prompt: `u = ${vs(u)} and v = ${vs(v)}. Find u · v.`,
    expression: 'u · v = ?', answer: d, negative: true,
    hint: 'Multiply matching components and add.',
    steps: [`u · v = ${prods(u, v)}`, `= ${lab(fmt(d), 'dot product')}.`],
    visual: card('Dot product', [`u = ${vs(u)}`, `v = ${vs(v)}`]),
  });
  return typed(q);
}

function perpStep(rng: Rng): AskStep {
  const v = until(() => [rint(rng, -4, 4), rint(rng, -4, 4)], (p) => p[0] !== 0 && p[1] !== 0, [2, 1]);
  const p = [-v[1], v[0]]; const g = gcd(p[0], p[1]); const p0 = [p[0] / g, p[1] / g];
  const layers: PlotLayers = { vectors: [{ x: v[0], y: v[1], label: 'v', color: 'teal' }] };
  const q = mkq(S(K3), 'perpendicular', {
    prompt: `Beam v = ${vs(v)}. Place a strut w at a right angle to it.`,
    expression: 'w · v = 0, w ≠ 0', answer: 0, answerText: `any multiple of ${vs(p0)}`,
    hint: 'Perpendicular means w · v = 0: pick w so the two products cancel exactly.',
    steps: ['Perpendicular (orthogonal) means w · v = 0.', `w = ${vs(p0)} works: ${prods(p0, v)} = 0. Any nonzero multiple of it works too.`],
    visual: plotV(layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: 'v is drawn', layers }, multiples(p0), 'Tap a point w (not the origin) with w · v = 0.');
}

const DIRS: Vec[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const lenText = (d: Vec, s: number) => (d[0] && d[1] ? (s === 1 ? '√2' : `${s}√2`) : String(s));
const COS: Record<number, string> = { 45: '√2/2', 90: '0', 135: '−√2/2', 180: '−1' };
function angleStep(rng: Rng): AskStep {
  const i = rint(rng, 0, 7); const diff = pick(rng, [1, 2, 3, 4, 1, 3]); const j = (i + diff * sgn(rng) + 8) % 8;
  const di = DIRS[i]; const dj = DIRS[j];
  const si = di[0] && di[1] ? rint(rng, 1, 2) : rint(rng, 1, 3); const sj = dj[0] && dj[1] ? rint(rng, 1, 2) : rint(rng, 1, 3);
  const u = scale(si, di); const v = scale(sj, dj); const ang = 45 * diff;
  const layers: PlotLayers = { vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v', color: 'teal' }] };
  const q = mkq(S(K3), 'angle', {
    prompt: `Two struts meet at a joint: u = ${vs(u)} and v = ${vs(v)}. What angle do they make?`,
    expression: 'cos θ = u·v / (|u||v|)', answer: ang, unit: '°',
    hint: 'Find u·v and both lengths, divide, then ask which angle has that cosine.',
    steps: [`u · v = ${prods(u, v)} = ${lab(fmt(dot(u, v)), 'dot product')}.`, `|u| = ${lenText(di, si)}, |v| = ${lenText(dj, sj)}.`, `cos θ = ${fmt(dot(u, v))} / (${lenText(di, si)} · ${lenText(dj, sj)}) = ${COS[ang]}, so θ = ${lab(`${ang}°`, 'angle between the struts')}.`],
    visual: plotV(layers),
  });
  return model(q, { kind: 'angle', max: 180, step: 15, label: `u = ${vs(u)}, v = ${vs(v)}` }, [String(ang)], 'Compute cos θ, then set the dial to the angle between u and v.');
}

function angleTypeStep(rng: Rng): AskStep {
  const three = rng.next() < 0.4; const kind = rint(rng, 0, 2);
  const u = three ? [rnz(rng, -4, 4), rnz(rng, -4, 4), rint(rng, -3, 3)] : [rnz(rng, -4, 4), rnz(rng, -4, 4)];
  const v = kind === 1
    ? (three ? scale(pick(rng, [1, -1, 2]), [u[1], -u[0], 0]) : scale(pick(rng, [1, -1, 2]), [-u[1], u[0]]))
    : until(() => u.map(() => rint(rng, -4, 4)), (p) => (kind === 0 ? dot(u, p) > 0 : dot(u, p) < 0), three ? scale(kind === 0 ? 1 : -1, [u[0], 0, 0]) : scale(kind === 0 ? 1 : -1, [u[0], 0]));
  const d = dot(u, v);
  const labels = ['acute (less than 90°)', 'a right angle (exactly 90°)', 'obtuse (more than 90°)'];
  const right = labels[d > 0 ? 0 : d === 0 ? 1 : 2];
  const q = mkq(S(K3), 'angle-sign', {
    prompt: `A truss joint: member u = ${vs(u)}, member v = ${vs(v)}. What kind of angle do they make?`,
    expression: 'sign of u · v', answer: d,
    hint: 'You do not need the angle itself: the sign of u · v decides.',
    steps: [`u · v = ${prods(u, v)} = ${lab(fmt(d), 'dot product')}.`, d > 0 ? 'Positive dot product: cos θ > 0, so the angle is acute.' : d === 0 ? 'Zero dot product: cos θ = 0, so the members are perpendicular.' : 'Negative dot product: cos θ < 0, so the angle is obtuse. Nothing is wrong with the members.'],
    visual: card('Truss members', [`u = ${vs(u)}`, `v = ${vs(v)}`]),
  });
  const zeroMyth = 'one of the members must be the zero vector';
  return choose(rng, q, right, d === 0 ? [zeroMyth, ...labels.filter((l) => l !== right)] : labels.filter((l) => l !== right));
}

/** Probes the misconception "a zero dot product means one vector is zero". */
function zeroDotStep(rng: Rng): AskStep {
  const u = [rnz(rng, -4, 4), rnz(rng, -4, 4)];
  const g = gcd(u[0], u[1]); const v = scale(pick(rng, [1, -1, 2]), [-u[1] / g + 0, u[0] / g + 0]);
  const q = mkq(S(K3), 'zero-dot', {
    prompt: `Newton checks two bracing rods: u = ${vs(u)}, v = ${vs(v)}. He finds u · v = 0. What does that tell him?`,
    expression: `${prods(u, v)} = 0`, answer: 0,
    hint: 'Recall u · v = |u||v| cos θ. Which factor must be 0 here?',
    steps: ['u · v = |u||v|cos θ. Neither length is 0 here, so cos θ = 0.', 'cos θ = 0 means θ = 90°: the rods are perpendicular (orthogonal).'],
    visual: plotV({ vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v', color: 'teal' }] }, [-8, 8, -8, 8]),
  });
  return choose(rng, q, 'They are perpendicular', ['One of them must be the zero vector', 'They are parallel', 'They point in opposite directions']);
}

const PROJ_V: Vec[] = [[1, 2], [2, 1], [1, 1], [1, -1], [2, -1], [1, -2], [3, 1], [1, 3], [-1, 2]];
function projProblem(rng: Rng) {
  return until(() => {
    const v = pick(rng, PROJ_V); const k = pick(rng, [1, 2, -1, -2]); const m = pick(rng, [1, -1, 2, -2]);
    const u = add(scale(k, v), scale(m, [-v[1], v[0]]));
    return { v, k, u, p: scale(k, v) };
  }, (t) => fits(t.u) && fits(t.p), { v: [1, 2], k: 1, u: [-1, 3], p: [1, 2] });
}
function projSteps(u: Vec, v: Vec, k: number) {
  const uv = dot(u, v); const vv = dot(v, v);
  return [`proj = (u·v / v·v)·v.`, `u · v = ${prods(u, v)} = ${lab(fmt(uv), 'dot product')}; v · v = ${lab(fmt(vv), 'squared length of v')}.`, `proj = (${fmt(uv)}/${fmt(vv)})·v = ${coefTerm(k, 'v')} = ${vs(scale(k, v))}.`];
}
function projPlotStep(rng: Rng): AskStep {
  const { v, k, u, p } = projProblem(rng);
  const layers: PlotLayers = { fns: v[0] !== 0 ? [{ fn: { kind: 'poly', c: [0, v[1] / v[0]] }, dashed: true, color: 'muted' }] : [], vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v', color: 'teal' }] };
  const q = mkq(S(K3), 'projection', {
    prompt: `Light falls straight onto the line of v = ${vs(v)}. Where does the shadow of u = ${vs(u)} end?`,
    expression: 'proj_v u = (u·v / v·v)·v', answer: 0, answerText: vs(p),
    hint: 'Divide u·v by v·v (the squared length of v), then scale v by that number.',
    steps: projSteps(u, v, k),
    visual: plotV(layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: 'u, v and the line of v', layers }, [`${p[0]},${p[1]}`], 'Tap the tip of the projection of u onto v.');
}
/** Rails with whole-number length, so "divide by |v|" gives a visible wrong vector. */
const PROJ_RAILS: Vec[] = [[3, 4], [4, 3], [-3, 4], [4, -3], [0, 2], [2, 0], [0, -2], [-2, 0], [0, 3], [3, 0]];
function projChooseStep(rng: Rng): AskStep {
  const v = pick(rng, PROJ_RAILS); const k = pick(rng, [1, -1, 2, -2]); const m = pick(rng, [1, -1, 2]);
  const u = add(scale(k, v), scale(m, [-v[1], v[0]])); const p = scale(k, v);
  const uv = dot(u, v); const vv = dot(v, v); const len = Math.sqrt(vv); const uu = dot(u, u);
  const q = mkq(S(K3), 'projection-probe', {
    prompt: `Sensor arm u = ${vs(u)} leans over rail v = ${vs(v)}. Which is the projection of u onto v?`,
    expression: 'proj_v u = ?', answer: 0,
    hint: 'A projection onto v is a vector along v. Scale v by u·v over v·v, the squared length.',
    steps: [`proj = (u·v / v·v)·v.`, `u · v = ${prods(u, v)} = ${lab(fmt(uv), 'dot product')}; v · v = ${lab(fmt(vv), 'squared length of v')}, not |v| = ${lab(fmt(len), 'length of v')}.`, `proj = (${fmt(uv)}/${fmt(vv)})·v = ${coefTerm(k, 'v')} = ${vs(p)}.`, `Dividing by |v| = ${fmt(len)} instead gives ${vs(scale(uv / len, v))}, ${fmt(len)} times too long.`],
    visual: card('Project u onto v', [`u = ${vs(u)}`, `v = ${vs(v)}`]),
  });
  return choose(rng, q, vs(p), [vs(scale(uv / len, v)), vs(scale(uv, v)), fmt(k), `(${u.map((x) => fracStr(uv * x, uu)).join(', ')})`]);
}

function workStep(rng: Rng): AskStep {
  const { F, d } = until(() => ({ F: [rnz(rng, -4, 6) * 10, rnz(rng, -4, 6) * 10], d: [rint(rng, 1, 6), rnz(rng, -3, 3)] }), (t) => dot(t.F, t.d) !== 0, { F: [30, 40], d: [5, 1] });
  const W = dot(F, d);
  const q = mkq(S(K3), 'work', {
    prompt: `Newton's winch pulls a cart with force F = ${vs(F)} N while it rolls d = ${vs(d)} m. How much work does the winch do?`,
    expression: 'W = F · d', answer: W, unit: 'J', negative: true,
    hint: 'Only the part of the force along the motion does work: take the dot product.',
    steps: ['W = F · d: multiply matching force and distance parts, then add.', `x: ${lab(fmt(F[0]), 'newtons')} × ${lab(fmt(d[0]), 'metres')} = ${lab(fmt(F[0] * d[0]), 'joules')}. y: ${lab(fmt(F[1]), 'newtons')} × ${lab(fmt(d[1]), 'metres')} = ${lab(fmt(F[1] * d[1]), 'joules')}.`, `W = ${fmt(F[0] * d[0])} + ${pn(F[1] * d[1])} = ${lab(fmt(W), 'work in J')}.`],
    visual: card('Work', [`F = ${vs(F)} N`, `d = ${vs(d)} m`]), app: 'Work, power and flux are all dot products.',
  });
  return typed(q);
}
function rampStep(rng: Rng): AskStep {
  const [a, b, L] = pick(rng, [[4, 3, 5], [3, 4, 5], [12, 5, 13], [8, 6, 10]]);
  const W = L * rint(rng, 2, 8) * (L === 13 ? 1 : 2);
  const along = (W * b) / L;
  const q = mkq(S(K3), 'ramp', {
    prompt: `A crate weighing ${W} N sits on a ramp that climbs along d = (${a}, ${b}). How many newtons of its weight pull it down the ramp?`,
    expression: `|w · d| / |d| with w = (0, −${W})`, answer: along, unit: 'N',
    hint: 'The part of w along the ramp is the scalar projection: w · d divided by |d|.',
    steps: [`Its weight, ${lab(W, 'newtons')}, points straight down: w = (0, −${W}).`, `w · d = 0·${a} + (−${W})·${b} = ${lab(`−${W * b}`, 'dot product')}.`, `|d| = √(${a}² + ${b}²) = ${lab(L, 'length of d')}.`, `−${W * b} / ${L} = −${along}: ${lab(along, 'N down the ramp')}.`],
    visual: plotV({ vectors: [{ x: a, y: b, label: 'd', color: 'teal' }], segments: [{ a: [0, 0], b: [a, 0], color: 'muted' }] }, [-1, 13, -1, 13]),
  });
  return typed(q);
}

const DOT: ChapterSpec = {
  key: K3, title: 'Dot Product, Angles & Projection', wing: 'lab', wingName: 'Projection Lab',
  goal: 'Compute u · v, use its sign and cos θ = u·v/(|u||v|) to find angles, build perpendicular vectors, and project one vector onto another.',
  misconception: 'Thinking the dot product is a vector (multiplying matching parts and stopping); reading a zero dot product as "one vector is zero"; dividing by |v| instead of |v|² in a projection.',
  teach: [
    { title: 'Multiply matching parts, then add', text: 'u · v = u₁v₁ + u₂v₂ (+ u₃v₃ in space). The answer is one number, not a vector. It also equals |u||v|cos θ, so it measures how much two arrows agree.', steps: ['(2, 3) · (4, −1): multiply x with x, y with y.', '2 × 4 + 3 × (−1) = 8 − 3 = 5 (dot product)', 'In space: (1, 2, 2) · (2, 0, 1) = 2 + 0 + 2 = 4 (dot product)', 'Positive 5: the two arrows point roughly the same way.'], next: 'Dot (2, 3) with (3, −2) in your head. What does the answer say about the angle?', visual: card('(2, 3) · (4, −1)', ['= 2·4 + 3·(−1)', '= 8 − 3 = 5', 'one number']) },
    { title: 'The sign tells the angle', text: 'Positive: acute. Zero: perpendicular (orthogonal), even though neither arrow is zero. Negative: obtuse. For the exact angle, cos θ = u·v / (|u||v|).', steps: ['u = (2, 1) and v = (−1, 2) on the plot.', 'u · v = 2 × (−1) + 1 × 2 = −2 + 2 = 0 (dot product)', 'Zero, so u and v are perpendicular: the plot shows a right angle.', 'Exact angle for (1, 0) and (1, 1): u · v = 1 (dot product), |u| = 1 (length) and |v| = √2.', 'cos θ = 1 ÷ (1 × √2) ≈ 0.707 (cosine of the angle), so θ = 45° (angle).'], next: 'Swap v for (1, 2). Is u · v positive, zero or negative now?', visual: plotV({ vectors: [{ x: 2, y: 1, label: 'u' }, { x: -1, y: 2, label: 'v', color: 'teal' }] }) },
    { title: 'Shadows: projection', text: 'The projection of u onto v is the shadow of u on the line of v: (u·v / v·v)·v. Divide by v·v, the length squared. The length of the shadow is u·v / |v|. Work W = F · d is the same idea: only the part of the force along the motion counts.', steps: ['u = (3, 4) and v = (2, 1).', 'u · v: 3 × 2 + 4 × 1 = 10 (dot product)', 'v · v: 2 × 2 + 1 × 1 = 5 (squared length of v)', '10 ÷ 5 = 2 (scale factor), so proj = 2 × (2, 1) = (4, 2)', 'On the plot, the dashed drop from (3, 4) meets v’s line at (4, 2).'], visual: plotV({ fns: [{ fn: { kind: 'poly', c: [0, 0.5] }, dashed: true, color: 'muted' }], vectors: [{ x: 4, y: 2, label: 'proj', color: 'ask' }, { x: 3, y: 4, label: 'u' }, { x: 2, y: 1, label: 'v', color: 'teal' }], segments: [{ a: [3, 4], b: [4, 2], dashed: true, color: 'muted' }] }, [-1, 6, -1, 6]) },
  ],
  quests: [
    { id: 'aq.linalg.dot.alignment', name: 'Square the Struts', giver: 'newton', guided: true,
      hook: 'Newton: "Half the struts in the Lab are skewed. The dot product tells you how much two directions agree. Make them square."',
      change: 'The Lab\'s struts stand square; the frame stops creaking.',
      waves: [wave('Multiply and add', mixOf([dotChooseStep, dotTypedStep, dotTypedStep])), wave('Square corners', mixOf([perpStep, zeroDotStep, perpStep, perpStep])), wave('Angle dial', times(2, angleStep))] },
    { id: 'aq.linalg.dot.shadows', name: 'Shadow Lab', giver: 'volt',
      hook: 'Volt: "The sensors only read the part of a signal along their rail. Project, and tell me what angle every pair makes."',
      change: 'The shadow sensors read true and the Lab lights settle.',
      waves: [wave('Shadows', times(3, projPlotStep)), wave('Which projection', times(2, projChooseStep)), wave('Angles', mixOf([angleTypeStep, angleStep, angleTypeStep]))] },
  ],
  concept: conceptFrom([perpStep, angleStep, projPlotStep, dotChooseStep]),
  transfer: oneOf([workStep, rampStep]),
  practice: (rng) => dotTypedStep(rng).question,
};

/* =====================================================================================
 * Chapter 4 · Matrices: entries, sums, transpose
 * ===================================================================================== */
const K4 = 'matrices';

/** An r × c matrix with entries in [lo, hi]. */
const randM = (rng: Rng, r: number, c: number, lo = -4, hi = 5): Mat => Array.from({ length: r }, () => Array.from({ length: c }, () => rint(rng, lo, hi)));

function entryStep(rng: Rng): AskStep {
  const vals = rng.shuffle(Array.from({ length: 19 }, (_, i) => i - 9)).slice(0, 9);
  const A: Mat = [vals.slice(0, 3), vals.slice(3, 6), vals.slice(6, 9)];
  const i = rint(rng, 0, 2); const j = (i + rint(rng, 1, 2)) % 3;
  const q = mkq(S(K4), 'entry', {
    prompt: `Control panel A shows nine gauge readings. What is a${sub(i + 1)}${sub(j + 1)}?`,
    expression: `a${sub(i + 1)}${sub(j + 1)} = ?`, answer: A[i][j], negative: true,
    hint: 'The first index counts rows (down), the second counts columns (across).',
    steps: [`a${sub(i + 1)}${sub(j + 1)} is row ${i + 1}, column ${j + 1}: rows first, always.`, `Row ${i + 1} is ${A[i].map(fmt).join(', ')}; its entry in column ${j + 1} is ${fmt(A[i][j])}.`],
    visual: matV([[A, 'A']]),
  });
  return choose(rng, q, fmt(A[i][j]), [fmt(A[j][i]), fmt(A[i][i]), fmt(A[j][j])]);
}

function sizeStep(rng: Rng): AskStep {
  const r = rint(rng, 2, 3); const c = r === 2 ? pick(rng, [3, 4]) : pick(rng, [2, 4]);
  const A = randM(rng, r, c, -5, 9);
  const q = mkq(S(K4), 'size', {
    prompt: 'Brick bolted a new panel to the wall. What size is this matrix?',
    expression: 'size = rows × columns', answer: r * c, answerText: `${r} × ${c}`,
    hint: 'Size is written rows × columns. Count the horizontal rows first.',
    steps: [`Size is rows × columns.`, `It has ${r} rows and ${c} columns: ${r} × ${c}.`],
    visual: matV([[A]]),
  });
  return choose(rng, q, `${r} × ${c}`, [`${c} × ${r}`, `${r * c} × 1`, `${r} × ${r}`]);
}

const ADD_OPS: { name: string; a: number; b: number }[] = [
  { name: 'A + B', a: 1, b: 1 }, { name: 'A − B', a: 1, b: -1 }, { name: '2A + B', a: 2, b: 1 }, { name: 'A − 2B', a: 1, b: -2 }, { name: '3A', a: 3, b: 0 }, { name: 'B − A', a: -1, b: 1 },
];
function addMatProblem(rng: Rng) {
  const op = pick(rng, ADD_OPS); const A = randM(rng, 2, 2, -3, 4); const B = randM(rng, 2, 2, -3, 4);
  const C = A.map((r, i) => r.map((x, j) => op.a * x + op.b * B[i][j] + 0));
  return { op, A, B, C };
}
function addTableStep(rng: Rng): AskStep {
  const { op, A, B, C } = addMatProblem(rng);
  const usesB = op.b !== 0;
  const q = mkq(S(K4), 'add', {
    prompt: usesB ? `Panel A = ${ms(A)}, panel B = ${ms(B)}. Build ${op.name}.` : `Panel A = ${ms(A)}. Build ${op.name}.`,
    expression: `${op.name} = ?`, answer: C[0][0], answerText: ms(C),
    hint: usesB ? 'Work entry by entry: each entry of the answer uses only the matching entries of A and B.' : 'Multiply every entry by the scalar.',
    steps: [usesB ? 'Same size, so combine matching entries one position at a time.' : `Multiply every entry of A by ${op.a}.`, `Top row: ${C[0].map(fmt).join(', ')}. Bottom row: ${C[1].map(fmt).join(', ')}.`, `${op.name} = ${ms(C)}.`],
    visual: matV(usesB ? [[A, 'A'], [B, 'B']] : [[A, 'A']]),
  });
  return model(q, { kind: 'table', rows: [[null, null], [null, null]], label: op.name, bracket: true }, [csv(C.flat())], `Fill in every entry of ${op.name}.`);
}

function sumDefinedStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2);
  const m = rint(rng, 2, 3); const n = m === 2 ? pick(rng, [3, 4]) : pick(rng, [2, 4]);
  if (kind === 0) {
    const q = mkq(S(K4), 'defined', {
      prompt: `Panel A is ${m} × ${n} and panel B is ${n} × ${m}. Can Brick add them?`,
      expression: 'A + B defined?', answer: 0,
      hint: 'Addition pairs up entries position by position.',
      steps: ['Addition works entry by entry, so both matrices need the same shape.', `${m} × ${n} and ${n} × ${m} are different shapes: A + B is not defined.`],
      visual: card('Panel sizes', [`A: ${m} × ${n}`, `B: ${n} × ${m}`]),
    });
    return choose(rng, q, 'No: the sizes must match', [`Yes: both have ${m * n} entries`, `Yes: the result is ${m} × ${m}`, `Yes: the result is ${n} × ${n}`]);
  }
  if (kind === 1) {
    const q = mkq(S(K4), 'defined', {
      prompt: `Panels A and B are both ${m} × ${n}. What size is 2A − B?`,
      expression: 'size of 2A − B', answer: m * n, answerText: `${m} × ${n}`,
      hint: 'Scaling and adding never change the shape.',
      steps: ['Scalar multiples and sums act entry by entry.', `So 2A − B has the same shape as A and B: ${m} × ${n}.`],
      visual: card('Panel sizes', [`A: ${m} × ${n}`, `B: ${m} × ${n}`]),
    });
    return choose(rng, q, `${m} × ${n}`, [`${2 * m} × ${2 * n}`, `${m} × ${2 * n}`, 'not defined']);
  }
  const q = mkq(S(K4), 'defined', {
    prompt: `Panel A is ${m} × ${n}. Is A + Aᵀ defined?`,
    expression: 'A + Aᵀ defined?', answer: 0,
    hint: 'What shape is Aᵀ?',
    steps: [`Aᵀ swaps rows and columns, so it is ${n} × ${m}.`, `${m} × ${n} and ${n} × ${m} differ, so A + Aᵀ is not defined. It only works for square matrices.`],
    visual: card('Panel size', [`A: ${m} × ${n}`]),
  });
  return choose(rng, q, 'No: A and Aᵀ have different shapes', [`Yes: it is ${m} × ${n}`, `Yes: it is ${n} × ${m}`, 'Yes: Aᵀ is just −A']);
}

function transposeTableStep(rng: Rng): AskStep {
  const A = randM(rng, 2, 3, -5, 9); const T = transpose(A);
  const blanks = new Set(rng.shuffle([0, 1, 2, 3, 4, 5]).slice(0, 4));
  const rows = T.map((r, i) => r.map((x, j) => (blanks.has(i * 2 + j) ? null : x)));
  const ans = T.flat().filter((_, k) => blanks.has(k));
  const q = mkq(S(K4), 'transpose', {
    prompt: `Mirror panel: A = ${ms(A)}. Complete Aᵀ.`,
    expression: 'Aᵀ = ?', answer: 0, answerText: ms(T),
    hint: 'Row 1 of A becomes column 1 of Aᵀ. Nothing changes sign.',
    steps: ['Transpose: row i of A becomes column i of Aᵀ, so (Aᵀ)ᵢⱼ = aⱼᵢ.', `A is 2 × 3, so Aᵀ is 3 × 2: ${ms(T)}.`],
    visual: matV([[A, 'A']]),
  });
  return model(q, { kind: 'table', rows, label: 'Aᵀ (3 × 2)', bracket: true }, [csv(ans)], 'Fill in the blank entries of Aᵀ.');
}

function transposePickStep(rng: Rng): AskStep {
  const vals = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -2, -3]).slice(0, 6);
  const A: Mat = [vals.slice(0, 3), vals.slice(3, 6)];
  const T = transpose(A);
  const rot: Mat = [0, 1, 2].map((i) => [A[1][i], A[0][i]]);
  const anti: Mat = [0, 1, 2].map((i) => [A[1][2 - i], A[0][2 - i]]);
  const neg: Mat = A.map((r) => r.map((x) => -x));
  const q = mkq(S(K4), 'transpose-probe', {
    prompt: `Ada's mirror wall should show panel A = ${ms(A)} transposed. Which panel is Aᵀ?`,
    expression: 'Aᵀ = ?', answer: 0, answerText: ms(T),
    hint: 'Read row 1 of A and write it down column 1. Signs stay the same.',
    steps: ['Row 1 of A becomes column 1 of Aᵀ; row 2 becomes column 2.', `Aᵀ = ${ms(T)}.`],
  });
  return pickLettered(rng, q, [matV([[T]]), matV([[rot]]), matV([[anti]]), matV([[neg]])]);
}

function inventoryStep(rng: Rng): AskStep {
  const parts = ['bolts', 'beams', 'plates']; const depots = ['North', 'South'];
  const Sm = randM(rng, 2, 3, 10, 40); const D = randM(rng, 2, 3, 5, 20);
  // Orders are capped per entry so that S + D − 2·O stays a positive stock count.
  const O = Sm.map((r, a) => r.map((x, b) => rint(rng, 1, Math.min(9, Math.floor((x + D[a][b]) / 2) - 1))));
  const i = rint(rng, 0, 1); const j = rint(rng, 0, 2);
  const v = Sm[i][j] + D[i][j] - 2 * O[i][j];
  const q = mkq(S(K4), 'inventory', {
    prompt: `Brick tracks stock as matrices (rows: North, South; columns: bolts, beams, plates). New stock = S + D − 2·O. How many ${parts[j]} at ${depots[i]}?`,
    expression: `(S + D − 2O)${sub(i + 1)}${sub(j + 1)} = ?`, answer: v,
    hint: `Only the entries in row ${i + 1}, column ${j + 1} of each matrix matter.`,
    steps: [`Use the ${depots[i]} row and the ${parts[j]} column: s = ${lab(Sm[i][j], 'in stock')}, d = ${lab(D[i][j], 'delivered')}, o = ${lab(O[i][j], 'ordered')}.`, `${lab(Sm[i][j], 'stock')} + ${lab(D[i][j], 'delivered')} − 2·${lab(O[i][j], 'ordered')} = ${lab(v, `${parts[j]} at ${depots[i]}`)}.`],
    visual: card('Depot matrices (rows N, S)', [`stock S = ${ms(Sm)}`, `deliveries D = ${ms(D)}`, `orders O = ${ms(O)}`]),
    app: 'Warehouse and sensor data live in matrices; spreadsheets do matrix sums all day.',
  });
  return typed(q);
}

const MATRICES: ChapterSpec = {
  key: K4, title: 'Matrices: Entries, Sums, Transpose', wing: 'hall', wingName: 'Matrix Hall Panels',
  goal: 'Read entries aᵢⱼ (row first), give a matrix\'s size, add and scale same-size matrices, and transpose by turning rows into columns.',
  misconception: 'Reading aᵢⱼ as column i, row j; adding matrices of different shapes because they "have the same number of entries"; thinking transposing flips signs or rotates the panel.',
  teach: [
    { title: 'Rows, then columns', text: 'An m × n matrix has m rows and n columns. a₂₃ sits in row 2, column 3: rows first, always. In prompts we write [2 −1; 0 3] for the rows (2, −1) and (0, 3).', steps: ['A has 2 rows and 3 columns: 2 × 3 = 6 entries.', 'a₂₃: go to row 2 (0, 3, 7), then column 3: 7.', 'a₁₂: row 1 (2, −1, 5), column 2: −1.', 'a₃₂ does not exist here: A has no row 3.'], next: 'Find a₁₃ and a₂₁ on the panel.', visual: matV([[[[2, -1, 5], [0, 3, 7]], 'A (2 × 3): a₂₃ = 7']]) },
    { title: 'Add matching entries', text: 'Only same-size matrices add, entry by entry. k·A multiplies every entry by k. A 2 × 3 and a 3 × 2 cannot be added, even though both have six entries.', steps: ['Top left: 1 + 5 = 6', 'Top right: 2 + (−1) = 1', 'Bottom row: 3 + 0 = 3 and 4 + 2 = 6', 'Scale: 2A = [2·1 2·2; 2·3 2·4] = [2 4; 6 8]'], next: 'Work out A − B entry by entry.', visual: matV([[[[1, 2], [3, 4]], 'A'], [[[5, -1], [0, 2]], 'B'], [[[6, 1], [3, 6]], 'A + B']], ['+', '=']) },
    { title: 'Transpose: rows become columns', text: 'Aᵀ writes row 1 of A down column 1, row 2 down column 2, so (Aᵀ)ᵢⱼ = aⱼᵢ. A 2 × 3 matrix becomes 3 × 2. No sign changes, no rotation.', steps: ['Row 1 of A, (2, −1, 5), becomes column 1 of Aᵀ.', 'Row 2 of A, (0, 3, 7), becomes column 2 of Aᵀ.', 'Shape: 2 × 3 = 6 entries in, 3 × 2 = 6 entries out.', 'Spot check: (Aᵀ)₃₂ is a₂₃, which is 7 in both panels.'], next: 'Transpose Aᵀ again. What do you get?', visual: matV([[[[2, -1, 5], [0, 3, 7]], 'A'], [[[2, 0], [-1, 3], [5, 7]], 'Aᵀ']], ['→']) },
  ],
  quests: [
    { id: 'aq.linalg.matrices.readout', name: 'Panel Readout', giver: 'brick', guided: true,
      hook: 'Brick: "The Hall panels are matrices. Read the right gauge, add the right panels, and don\'t add two that don\'t fit."',
      change: 'Every panel in the Matrix Hall reads true, brass numbers glowing in their brackets.',
      waves: [wave('Find the entry', mixOf([entryStep, entryStep, sizeStep])), wave('Add the panels', times(3, addTableStep)), wave('Sizes', mixOf([sumDefinedStep, addTableStep]))] },
    { id: 'aq.linalg.matrices.mirror', name: 'Mirror Panels', giver: 'ada',
      hook: 'Ada: "The mirror wall shows every panel transposed. Half of them are wrong. Fix them."',
      change: 'The mirror wall shows every panel correctly transposed.',
      waves: [wave('Transpose', times(3, transposeTableStep)), wave('Which is the transpose', times(2, transposePickStep)), wave('Mixed panels', mixOf([sumDefinedStep, addTableStep, entryStep]))] },
  ],
  concept: conceptFrom([addTableStep, transposeTableStep, transposePickStep, entryStep]),
  transfer: oneOf([inventoryStep]),
  practice: (rng) => { const { op, A, B, C } = until(() => addMatProblem(rng), (t) => t.op.b !== 0, addMatProblem(rng)); const i = rint(rng, 0, 1); const j = rint(rng, 0, 1); return mkq(S(K4), 'add', { prompt: `A = ${ms(A)}, B = ${ms(B)}. Find entry (${i + 1}, ${j + 1}) of ${op.name}.`, expression: `(${op.name})${sub(i + 1)}${sub(j + 1)} = ?`, answer: C[i][j], negative: true, hint: 'Use only the matching entries of A and B.', steps: [`Row ${i + 1}, column ${j + 1}: a = ${fmt(A[i][j])}, b = ${fmt(B[i][j])}.`, `${op.name} there is ${fmt(C[i][j])}.`] }); },
};

/* =====================================================================================
 * Chapter 5 · Linear transformations of the plane
 * ===================================================================================== */
const K5 = 'transform';

interface Move { key: string; M: Mat; desc: string; confuse: string[] }
const MOVES: Move[] = [
  { key: 'rot90', M: [[0, -1], [1, 0]], desc: 'rotate 90° counterclockwise', confuse: ['rot90cw', 'reflyx', 'rot180'] },
  { key: 'rot90cw', M: [[0, 1], [-1, 0]], desc: 'rotate 90° clockwise', confuse: ['rot90', 'reflyx', 'reflx'] },
  { key: 'rot180', M: [[-1, 0], [0, -1]], desc: 'rotate 180°', confuse: ['reflx', 'refly', 'rot90'] },
  { key: 'reflx', M: [[1, 0], [0, -1]], desc: 'reflect across the x-axis', confuse: ['refly', 'rot180', 'reflyx'] },
  { key: 'refly', M: [[-1, 0], [0, 1]], desc: 'reflect across the y-axis', confuse: ['reflx', 'rot180', 'rot90'] },
  { key: 'reflyx', M: [[0, 1], [1, 0]], desc: 'reflect across the line y = x', confuse: ['rot90', 'rot90cw', 'reflx'] },
  { key: 'stretch2', M: [[2, 0], [0, 1]], desc: 'stretch x by 2', confuse: ['stretchy2', 'shear2', 'rot90'] },
  { key: 'stretchy2', M: [[1, 0], [0, 2]], desc: 'stretch y by 2', confuse: ['stretch2', 'shear2', 'reflx'] },
  { key: 'shear2', M: [[1, 2], [0, 1]], desc: 'shear sideways: (x, y) → (x + 2y, y)', confuse: ['shearup2', 'stretch2', 'reflyx'] },
  { key: 'shearup2', M: [[1, 0], [2, 1]], desc: 'shear upward: (x, y) → (x, 2x + y)', confuse: ['shear2', 'stretchy2', 'rot90'] },
];
const move = (k: string) => MOVES.find((m) => m.key === k)!;

function invertible2(rng: Rng, lo = -3, hi = 3): Mat {
  return until(() => randM(rng, 2, 2, lo, hi), (A) => det2(A) !== 0 && A.flat().filter((x) => x !== 0).length >= 3, [[2, 1], [1, 1]]);
}

function basisImageStep(rng: Rng): AskStep {
  const A = until(() => invertible2(rng), (M) => M[0][1] !== M[1][0], [[2, 1], [-1, 1]]); const j = rint(rng, 0, 1);
  const img = col(A, j); const e = j === 0 ? 'e₁ = (1, 0)' : 'e₂ = (0, 1)';
  const layers: PlotLayers = { vectors: [{ x: 1, y: 0, label: 'e₁', color: 'teal' }, { x: 0, y: 1, label: 'e₂', color: 'teal' }] };
  const q = mkq(S(K5), 'basis-image', {
    prompt: `The Warp Floor applies A = ${ms(A)} to the whole grid. Where does ${e} land?`,
    expression: `A·e${sub(j + 1)} = ?`, answer: 0, answerText: vs(img),
    hint: 'Multiply it out: A times a basis vector picks out one column of A, not a row.',
    steps: [`A·e${sub(j + 1)} is column ${j + 1} of A.`, `Column ${j + 1} = ${vs(img)}.`],
    visual: matV([[A, 'A']]),
  });
  return model(q, { kind: 'plot', range: [-4, 4, -4, 4], count: 1, arrows: true, label: `A = ${ms(A)}`, layers }, [`${img[0]},${img[1]}`], `Tap where ${e.split(' ')[0]} lands.`);
}

function buildMatrixStep(rng: Rng): AskStep {
  const named = rng.next() < 0.5;
  const mv = pick(rng, MOVES);
  const M = named ? mv.M : until(() => randM(rng, 2, 2, -3, 4), (A) => det2(A) !== 0 && A[0][1] !== A[1][0], [[2, -1], [3, 1]]);
  const c1 = col(M, 0); const c2 = col(M, 1);
  const q = mkq(S(K5), 'build', {
    prompt: named ? `Build the warp matrix that will ${mv.desc}.` : `Build the warp matrix that sends e₁ to ${vs(c1)} and e₂ to ${vs(c2)}.`,
    expression: 'A = ?', answer: 0, answerText: ms(M),
    hint: named ? 'Ask where (1, 0) goes and where (0, 1) goes. Those images are the columns.' : 'The image of e₁ is the first column, written downward.',
    steps: named
      ? [`Columns are the images of e₁ and e₂.`, `e₁ = (1, 0) goes to ${vs(c1)}; e₂ = (0, 1) goes to ${vs(c2)}.`, `A = ${ms(M)}.`]
      : ['Columns are the images of e₁ and e₂, written downward.', `Column 1 = ${vs(c1)}, column 2 = ${vs(c2)}, so A = ${ms(M)}.`],
  });
  return model(q, { kind: 'table', rows: [[null, null], [null, null]], label: 'A', bracket: true }, [csv(M.flat())], 'Fill in the four entries of A.');
}

function matVecProblem(rng: Rng) {
  return until(() => { const A = invertible2(rng, -2, 2); const v = [rnz(rng, -3, 3), rnz(rng, -3, 3)]; return { A, v, w: mulv(A, v) }; }, (t) => fits(t.w) && (t.w[0] !== 0 || t.w[1] !== 0), { A: [[1, 1], [0, 1]], v: [2, 1], w: [3, 1] });
}
const matVecSteps = (A: Mat, v: Vec, w: Vec) => [
  `A·v = x·(column 1) + y·(column 2).`,
  `${fmt(v[0])}·${vs(col(A, 0))} + ${pn(v[1])}·${vs(col(A, 1))} = ${vs(scale(v[0], col(A, 0)))} + ${vs(scale(v[1], col(A, 1)))} = ${vs(w)}.`,
];
function matVecStep(rng: Rng): AskStep {
  const { A, v, w } = matVecProblem(rng);
  const layers: PlotLayers = { vectors: [{ x: v[0], y: v[1], label: 'v', color: 'teal' }] };
  const q = mkq(S(K5), 'apply', {
    prompt: `The warp A = ${ms(A)} moves a beacon at v = ${vs(v)}. Where does it end up?`,
    expression: 'A·v = ?', answer: w[0], answerText: vs(w),
    hint: 'A·v is x copies of column 1 plus y copies of column 2.',
    steps: matVecSteps(A, v, w),
    visual: matV([[A, 'A'], [v.map((x) => [x]), 'v']], ['·']),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: `A = ${ms(A)}`, layers }, [`${w[0]},${w[1]}`], 'Tap where A·v lands.');
}

function whatDoesItDoStep(rng: Rng): AskStep {
  const mv = pick(rng, MOVES);
  const q = mkq(S(K5), 'name-move', {
    prompt: 'This matrix is wired into the Warp Floor. What does it do to the plane?',
    expression: `A = ${ms(mv.M)}`, answer: 0,
    hint: 'Read the columns: where do (1, 0) and (0, 1) go?',
    steps: [`e₁ → ${vs(col(mv.M, 0))}, e₂ → ${vs(col(mv.M, 1))}.`, `That is: ${mv.desc}.`],
    visual: matV([[mv.M, 'A']]),
  });
  return choose(rng, q, mv.desc, mv.confuse.map((k) => move(k).desc));
}

function whichMatrixStep(rng: Rng): AskStep {
  const mv = pick(rng, MOVES);
  const q = mkq(S(K5), 'pick-matrix', {
    prompt: `Ada needs the warp that will ${mv.desc}. Which matrix is it?`,
    expression: `${mv.desc}`, answer: 0, answerText: ms(mv.M),
    hint: 'Work out where e₁ and e₂ go, then look for those images as the columns.',
    steps: [`e₁ → ${vs(col(mv.M, 0))} and e₂ → ${vs(col(mv.M, 1))}.`, `Those are the columns: ${ms(mv.M)}.`],
  });
  const wrong = [transpose(mv.M), ...mv.confuse.map((k) => move(k).M)].filter((M) => !eqM(M, mv.M));
  return pickLettered(rng, q, [matV([[mv.M]]), ...wrong.map((M) => matV([[M]]))]);
}

function moveImageStep(rng: Rng): AskStep {
  const { mv, p, w } = until(() => { const mv = pick(rng, MOVES); const p = [rnz(rng, -3, 3), rnz(rng, -3, 3)]; return { mv, p, w: mulv(mv.M, p) }; }, (t) => fits(t.w) && (t.w[0] !== t.p[0] || t.w[1] !== t.p[1]), { mv: move('rot90'), p: [3, 1], w: [-1, 3] });
  const layers: PlotLayers = { vectors: [{ x: p[0], y: p[1], label: 'p', color: 'teal' }] };
  const q = mkq(S(K5), 'move-point', {
    prompt: `Ada's robot arm must ${mv.desc}. A beacon sits at p = ${vs(p)}. Where does it go?`,
    expression: `${mv.desc}: p → ?`, answer: w[0], answerText: vs(w),
    hint: 'Build the matrix first: where do e₁ and e₂ go? Those are its columns. Then multiply.',
    steps: [`The matrix is ${ms(mv.M)} (columns: e₁ → ${vs(col(mv.M, 0))}, e₂ → ${vs(col(mv.M, 1))}).`, `${ms(mv.M)}·${vs(p)} = ${vs(w)}.`],
    visual: plotV(layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: mv.desc, layers }, [`${w[0]},${w[1]}`], 'Tap where the beacon lands.');
}

function linearOrNotStep(rng: Rng): AskStep {
  const a = rnz(rng, -3, 3); const b = rnz(rng, -3, 3); const c = rnz(rng, -3, 3); const k = rint(rng, 1, 4);
  const good = `T(x, y) = (${lin([a, b], ['x', 'y'])}, ${lin([c, 0], ['x', 'y'])})`;
  const q = mkq(S(K5), 'linear', {
    prompt: 'Only a linear map can be wired into the Warp Floor. Which one is linear?',
    expression: 'T(u + v) = T(u) + T(v), T(cu) = c·T(u)', answer: 0,
    hint: 'A linear map sends (0, 0) to (0, 0) and each output is a plain combination of x and y.',
    steps: ['Linear: each output is a combination of x and y with constant coefficients: no added constants, no products, no powers.', `${good} is linear; it is the matrix ${ms([[a, b], [c, 0]])}.`, `A shift like (x + ${k}, y) moves the origin, so it is not linear.`],
  });
  return choose(rng, q, good, [`T(x, y) = (x + ${k}, y)`, `T(x, y) = (x·y, ${coefTerm(c, 'x')})`, `T(x, y) = (x², ${coefTerm(b, 'y')})`]);
}

function cadStep(rng: Rng): AskStep {
  const k = rnz(rng, -3, 3); const M: Mat = rng.next() < 0.5 ? [[1, k], [0, 1]] : [[1, 0], [k, 1]];
  const p = [rint(rng, -4, 5), rnz(rng, -4, 5)]; const w = mulv(M, p); const which = M[0][1] !== 0 ? 0 : 1;
  const q = mkq(S(K5), 'cad', {
    prompt: `A CAD tool slants a facade with the shear ${ms(M)}. A window corner sits at ${vs(p)}. What is its new ${which ? 'y' : 'x'}-coordinate?`,
    expression: `${ms(M)}·${vs(p)}`, answer: w[which], negative: true,
    hint: `The ${which ? 'second' : 'first'} row of the matrix dotted with the point gives the new ${which ? 'y' : 'x'}.`,
    steps: [`New point = ${fmt(p[0])}·${vs(col(M, 0))} + ${pn(p[1])}·${vs(col(M, 1))} = ${vs(w)}.`, `New ${which ? 'y' : 'x'} = ${fmt(w[which])}.`],
    visual: matV([[M, 'shear'], [p.map((x) => [x]), 'corner']], ['·']), app: 'Graphics and CAD engines move every vertex with a matrix.',
  });
  return typed(q);
}
const DEVICE: Record<string, string> = {
  rot90: 'A satellite dish motor turns the feed horn 90° counterclockwise about the mount.',
  rot90cw: 'A satellite dish motor turns the feed horn 90° clockwise about the mount.',
  reflyx: 'A periscope mirror lies along the line y = x and reflects the feed horn\'s image across it.',
};
function dishStep(rng: Rng): AskStep {
  const mv = move(pick(rng, ['rot90', 'rot90cw', 'reflyx']));
  const p = until(() => [rnz(rng, -5, 5), rnz(rng, -5, 5)], (t) => Math.abs(t[0]) !== Math.abs(t[1]), [4, 1]);
  const w = mulv(mv.M, p);
  const q = mkq(S(K5), 'dish', {
    prompt: `${DEVICE[mv.key]} The horn sits at ${vs(p)} m. Where does it end up?`,
    expression: `${mv.desc}: ${vs(p)} → ?`, answer: 0, answerText: vs(w),
    hint: 'Write the move as a matrix (columns = where e₁ and e₂ go), then multiply.',
    steps: [`The matrix is ${ms(mv.M)}: e₁ → ${vs(col(mv.M, 0))}, e₂ → ${vs(col(mv.M, 1))}.`, `${ms(mv.M)}·${vs(p)} = ${fmt(p[0])}·${vs(col(mv.M, 0))} + ${pn(p[1])}·${vs(col(mv.M, 1))} = ${vs(w)}: the new horn position in m.`],
    visual: card('Feed horn', [`position ${vs(p)} m`, mv.desc]),
    app: 'Antenna pointing and optics chain rotation and reflection matrices.',
  });
  // Real slips: the opposite rotation, rotating instead of reflecting, and reading rows as columns.
  const wrong = [...mv.confuse.map((k) => mulv(move(k).M, p)), mulv(transpose(mv.M), p), [-p[0], -p[1]]];
  return choose(rng, q, vs(w), wrong.map(vs));
}

const TRANSFORM: ChapterSpec = {
  key: K5, title: 'Linear Transformations of the Plane', wing: 'warp', wingName: 'The Warp Floor',
  goal: 'See a 2 × 2 matrix as a warp of the plane: its columns are where e₁ and e₂ land, A·v is a mix of the columns, and rotations, reflections, stretches and shears each have a matrix.',
  misconception: 'Reading where e₁ goes from the first ROW instead of the first column; thinking a shift (x + 2, y) is linear; mixing up a 90° rotation with a reflection across y = x.',
  teach: [
    { title: 'Columns are where the basis goes', text: 'A 2 × 2 matrix warps the whole plane. Its first column is where e₁ = (1, 0) lands; its second column is where e₂ = (0, 1) lands. Read columns, not rows.', steps: ['On the plot, Ae₁ = (2, 0) and Ae₂ = (1, 1).', 'Stand them up as columns: A = [2 1; 0 1].', 'Check: A·(1, 0) = 1·(2, 0) + 0·(1, 1) = (2, 0)', 'Using them as rows would give [2 0; 1 1], a different warp.'], next: 'Where does A send (0, 2)? Use column 2.', visual: plotV({ vectors: [{ x: 1, y: 0, label: 'e₁', color: 'teal' }, { x: 0, y: 1, label: 'e₂', color: 'teal' }, { x: 2, y: 0, label: 'Ae₁', color: 'orange' }, { x: 1, y: 1, label: 'Ae₂', color: 'ask' }] }, [-3, 3, -3, 3]) },
    { title: 'Matrix times vector', text: 'A·(x, y) = x·(column 1) + y·(column 2): a linear combination of the columns. Grid lines stay straight, parallel and evenly spaced, and the origin stays put.', steps: ['A = [2 1; 0 1] has columns (2, 0) and (1, 1).', '3·(2, 0) + 2·(1, 1) = (6, 0) + (2, 2) = (8, 2)', 'Row check: 2 × 3 + 1 × 2 = 8 and 0 × 3 + 1 × 2 = 2'], next: 'Where does [2 1; 0 1] send (1, 3)?', visual: card('[2 1; 0 1]·(3, 2)', ['= 3·(2, 0) + 2·(1, 1)', '= (6, 0) + (2, 2)', '= (8, 2)']) },
    { title: 'The four moves', text: 'Rotate 90° counterclockwise: [0 −1; 1 0]. Reflect across the x-axis: [1 0; 0 −1]. Stretch: [k 0; 0 m]. Shear: [1 k; 0 1]. A shift like (x + 2, y) is not linear: it moves the origin.', steps: ['Send p = (1, 2) through each panel.', 'Rotate: (0 × 1 − 1 × 2, 1 × 1 + 0 × 2) = (−2, 1)', 'Reflect: (1, −1 × 2) = (1, −2)', 'Stretch: (2 × 1, 1 × 2) = (2, 2) and shear: (1 + 2 × 2, 2) = (5, 2)', 'Shift: (0, 0) + (2, 0) = (2, 0), so the origin moves: not linear.'], next: 'Rotate (1, 0) by 90° twice. Where does it end up?', visual: matV([[[[0, -1], [1, 0]], 'rotate'], [[[1, 0], [0, -1]], 'reflect'], [[[2, 0], [0, 1]], 'stretch'], [[[1, 2], [0, 1]], 'shear']]) },
  ],
  quests: [
    { id: 'aq.linalg.transform.calibrate', name: 'Warp Floor Calibration', giver: 'vector', guided: true,
      hook: 'Vector: "Every matrix is a warp of the whole plane. Watch where e₁ and e₂ go, and you know where everything goes."',
      change: 'The Warp Floor hums; its grid bends exactly as the panel says.',
      waves: [wave('Where e₁ and e₂ land', times(3, basisImageStep)), wave('Build the matrix', times(2, buildMatrixStep)), wave('Warp a beacon', times(3, matVecStep))] },
    { id: 'aq.linalg.transform.moves', name: 'The Four Moves', giver: 'ada',
      hook: 'Ada: "Rotate, reflect, stretch, shear. The robot arms need the right matrix for each, and the wiring crew keeps swapping rows for columns."',
      change: 'The robot arms on the Warp Floor swing, flip and slide on cue.',
      waves: [wave('Name the move', mixOf([whatDoesItDoStep, moveImageStep, moveImageStep])), wave('Pick the matrix', times(3, whichMatrixStep)), wave('Linear or not', mixOf([linearOrNotStep, matVecStep, buildMatrixStep]))] },
  ],
  concept: conceptFrom([basisImageStep, buildMatrixStep, matVecStep, whichMatrixStep]),
  transfer: oneOf([cadStep, dishStep]),
  practice: (rng) => { const { A, v, w } = matVecProblem(rng); return mkq(S(K5), 'apply', { prompt: `A = ${ms(A)} and v = ${vs(v)}. Find the first component of A·v.`, expression: '(A·v)₁ = ?', answer: w[0], negative: true, hint: 'Row 1 of A dotted with v.', steps: matVecSteps(A, v, w) }); },
};

/* =====================================================================================
 * Chapter 6 · Matrix multiplication & composition
 * ===================================================================================== */
const K6 = 'matmul';

function productEntryStep(rng: Rng): AskStep {
  const n = pick(rng, [2, 3]); const A = randM(rng, 2, n, -3, 4); const B = randM(rng, n, 2, -3, 4);
  const C = mul(A, B); const i = rint(rng, 0, 1); const j = rint(rng, 0, 1);
  const r = A[i]; const c = col(B, j);
  const q = mkq(S(K6), 'entry', {
    prompt: `Gear stage A = ${ms(A)}, stage B = ${ms(B)}. Find entry (${i + 1}, ${j + 1}) of AB.`,
    expression: `(AB)${sub(i + 1)}${sub(j + 1)} = ?`, answer: C[i][j], negative: true,
    hint: `Row ${i + 1} of A times column ${j + 1} of B: multiply matching entries and add.`,
    steps: [`(AB)${sub(i + 1)}${sub(j + 1)} = row ${i + 1} of A · column ${j + 1} of B.`, `${vs(r)} · ${vs(c)} = ${prods(r, c)} = ${fmt(C[i][j])}.`],
    visual: matV([[A, 'A'], [B, 'B']], ['×']),
  });
  return typed(q);
}

function productProblem(rng: Rng) {
  return until(() => { const A = randM(rng, 2, 2, -2, 3); const B = randM(rng, 2, 2, -2, 3); return { A, B, C: mul(A, B) }; }, (t) => !eqM(t.C, mul(t.B, t.A)) && t.A.flat().filter((x) => x).length >= 3 && t.B.flat().filter((x) => x).length >= 3, { A: [[1, 2], [0, 1]], B: [[2, 0], [1, 3]], C: [[4, 6], [1, 3]] });
}
function productTableStep(rng: Rng): AskStep {
  const { A, B, C } = productProblem(rng);
  const q = mkq(S(K6), 'product', {
    prompt: `Stage A = ${ms(A)}, stage B = ${ms(B)}. Build the product AB.`,
    expression: 'AB = ?', answer: C[0][0], answerText: ms(C),
    hint: 'Entry (i, j) is row i of A dotted with column j of B.',
    steps: ['Each entry: row of A · column of B.', `Row 1: ${vs(A[0])}·${vs(col(B, 0))} = ${fmt(C[0][0])}, ${vs(A[0])}·${vs(col(B, 1))} = ${fmt(C[0][1])}.`, `Row 2: ${vs(A[1])}·${vs(col(B, 0))} = ${fmt(C[1][0])}, ${vs(A[1])}·${vs(col(B, 1))} = ${fmt(C[1][1])}.`],
    visual: matV([[A, 'A'], [B, 'B']], ['×']),
  });
  return model(q, { kind: 'table', rows: [[null, null], [null, null]], label: 'AB', bracket: true }, [csv(C.flat())], 'Fill in all four entries of AB.');
}

function productPickStep(rng: Rng): AskStep {
  const { A, B, C } = productProblem(rng);
  const entrywise = A.map((r, i) => r.map((x, j) => x * B[i][j]));
  const rowRow = A.map((r) => B.map((s) => dot(r, s)));
  const q = mkq(S(K6), 'product-probe', {
    prompt: `Brick couples gear stage A = ${ms(A)} to stage B = ${ms(B)}. Which panel is the combined stage AB?`,
    expression: 'AB = ?', answer: 0, answerText: ms(C),
    hint: 'Not entry by entry: each entry is a row of A dotted with a column of B.',
    steps: ['(AB)ᵢⱼ = row i of A · column j of B.', `AB = ${ms(C)}.`, `Multiplying entry by entry gives ${ms(entrywise)}, which is not the matrix product.`],
  });
  return pickLettered(rng, q, [matV([[C]]), matV([[entrywise]]), matV([[mul(B, A)]]), matV([[rowRow]])]);
}

function prodSizeStep(rng: Rng): AskStep {
  const m = rint(rng, 1, 4); const n = rint(rng, 2, 4); const ok = rng.next() < 0.65;
  const p = ok ? n : until(() => rint(rng, 1, 4), (x) => x !== n, n + 1); const qq = rint(rng, 1, 4);
  const q = mkq(S(K6), 'size', {
    prompt: `Brick chains a ${m} × ${n} gear stage A onto a ${p} × ${qq} stage B. What size is the product AB?`,
    expression: `(${m} × ${n})(${p} × ${qq})`, answer: ok ? m * qq : 0, answerText: ok ? `${m} × ${qq}` : 'not defined',
    hint: 'Each row of A must be dotted with a column of B, so their lengths must match.',
    steps: ok ? [`Inner sizes match (${n} = ${p}), so AB is defined.`, `Outer sizes give the shape: ${m} × ${qq}.`] : [`A's rows have ${n} entries but B's columns have ${p}: they cannot be dotted.`, 'AB is not defined.'],
  });
  return ok ? choose(rng, q, `${m} × ${qq}`, [`${n} × ${p}`, `${qq} × ${m}`, 'not defined', `${m} × ${n}`, `${m * p} × ${n * qq}`]) : choose(rng, q, 'not defined', [`${m} × ${qq}`, `${qq} × ${m}`, `${n} × ${p}`, `${m} × ${p}`, `${n} × ${qq}`, `${m * p} × ${n * qq}`]);
}

function composeProblem(rng: Rng) {
  return until(() => { const a = pick(rng, MOVES); const b = pick(rng, MOVES); return { first: a, then: b }; }, (t) => t.first.key !== t.then.key && !eqM(mul(t.then.M, t.first.M), mul(t.first.M, t.then.M)), { first: move('rot90'), then: move('reflx') });
}
function composeOrderStep(rng: Rng): AskStep {
  const { first, then } = composeProblem(rng);
  const F = first.M; const G = then.M; const right = mul(G, F);
  const q = mkq(S(K6), 'compose', {
    prompt: `First ${first.desc} (matrix F = ${ms(F)}), then ${then.desc} (matrix G = ${ms(G)}). Which single matrix does both?`,
    expression: 'first F, then G', answer: 0, answerText: ms(right),
    hint: 'For a vector v, F acts first: G(Fv). Which product is that?',
    steps: ['G(Fv) = (GF)v: the matrix that acts first sits on the right.', `GF = ${ms(right)}.`, `FG = ${ms(mul(F, G))} is the other order, a different warp.`],
  });
  const sum = F.map((r, i) => r.map((x, j) => x + G[i][j]));
  const ew = F.map((r, i) => r.map((x, j) => x * G[i][j]));
  return pickLettered(rng, q, [matV([[right]]), matV([[mul(F, G)]]), matV([[sum]]), matV([[ew]])]);
}

function composePlotStep(rng: Rng): AskStep {
  const { A, B, v, w, bv } = until(() => {
    const A = invertible2(rng, -2, 2); const B = pick(rng, MOVES).M; const v = [rnz(rng, -2, 2), rnz(rng, -2, 2)];
    const bv = mulv(B, v); return { A, B, v, bv, w: mulv(A, bv) };
  }, (t) => fits(t.w) && fits(t.bv) && (t.w[0] !== 0 || t.w[1] !== 0), { A: [[1, 1], [0, 1]], B: [[0, -1], [1, 0]], v: [2, 1], bv: [-1, 2], w: [1, 2] });
  const layers: PlotLayers = { vectors: [{ x: v[0], y: v[1], label: 'v', color: 'teal' }] };
  const q = mkq(S(K6), 'chain', {
    prompt: `Two warps in a row: first B = ${ms(B)}, then A = ${ms(A)}. Where does the beacon at v = ${vs(v)} end up?`,
    expression: 'A(Bv) = (AB)v', answer: w[0], answerText: vs(w),
    hint: 'Apply B to v first, then apply A to that result.',
    steps: ['B acts first, then A: the result is A(Bv) = (AB)v.', `Bv = ${vs(bv)}.`, `A·${vs(bv)} = ${vs(w)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: `first B = ${ms(B)}, then A = ${ms(A)}`, layers }, [`${w[0]},${w[1]}`], 'Tap where the beacon ends up after both warps.');
}

const nOf = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;
function partsStep(rng: Rng): AskStep {
  const P: Mat = [[rint(rng, 2, 6), rint(rng, 4, 12)], [rint(rng, 1, 5), rint(rng, 3, 10)]];
  const o = [rint(rng, 2, 9), rint(rng, 2, 9)]; const j = rint(rng, 0, 1);
  const need = o[0] * P[0][j] + o[1] * P[1][j]; const part = j ? 'bolts' : 'gears';
  const q = mkq(S(K6), 'parts', {
    prompt: `A gearbox needs ${nOf(P[0][0], 'gear')} and ${nOf(P[0][1], 'bolt')}; a winch needs ${nOf(P[1][0], 'gear')} and ${nOf(P[1][1], 'bolt')}. Brick orders ${o[0]} gearboxes and ${o[1]} winches. How many ${part}?`,
    expression: `${vs(o)} × ${ms(P)}`, answer: need,
    hint: `The order row times the ${part} column: multiply matching entries and add.`,
    steps: [`Order row ${vs(o)} times the ${part} column ${vs(col(P, j))}.`, `${labn(o[0], 'gearbox', 'gearboxes')} × ${lab(P[0][j], `${unit(P[0][j], part.slice(0, -1), part)} each`)} + ${labn(o[1], 'winch', 'winches')} × ${lab(P[1][j], `${unit(P[1][j], part.slice(0, -1), part)} each`)} = ${lab(need, part)}.`],
    visual: matV([[[o], 'order'], [P, 'parts per unit']], ['×']), app: 'Bills of materials are matrix products.',
  });
  return typed(q);
}

const MATMUL: ChapterSpec = {
  key: K6, title: 'Matrix Multiplication & Composition', wing: 'hall', wingName: 'Gear Train Gallery',
  goal: 'Multiply matrices row by column, predict the size of a product, and read AB as "B first, then A": one matrix for a chain of warps.',
  misconception: 'Multiplying matrices entry by entry; assuming AB = BA; writing the first warp on the left when composing; multiplying sizes that do not match.',
  teach: [
    { title: 'Row times column', text: 'Why rows times columns? Column j of AB is A times column j of B: B sends e_j there, then A moves it. Each entry of that column is a row of A dotted with it, so (AB)ᵢⱼ = row i of A · column j of B. An m × n times an n × p needs matching inner sizes and gives m × p.', steps: ['Row 1 · column 1: 1 × 2 + 2 × 1 = 4', 'Row 1 · column 2: 1 × 1 + 2 × (−1) = −1', 'Row 2: 3 × 2 + 0 × 1 = 6 and 3 × 1 + 0 × (−1) = 3', 'So AB = [4 −1; 6 3]: 2 × 2 times 2 × 2 gives 2 × 2.'], next: 'Work out BA the same way. Is it the same as AB?', visual: matV([[[[1, 2], [3, 0]], 'A'], [[[2, 1], [1, -1]], 'B'], [[[4, -1], [6, 3]], 'AB']], ['×', '=']) },
    { title: 'A product is a chain of warps', text: '(AB)v = A(Bv): B acts first, then A. The product AB does both warps in one step, so the first warp sits on the right.', steps: ['A = [1 2; 3 0], B = [2 1; 1 −1], v = (1, 1).', 'B first: Bv = (2 + 1, 1 − 1) = (3, 0)', 'Then A: (1 × 3 + 2 × 0, 3 × 3 + 0 × 0) = (3, 9)', 'One step: (AB)v = [4 −1; 6 3]·(1, 1) = (4 − 1, 6 + 3) = (3, 9)'], visual: card('first B, then A', ['v → Bv → A(Bv)', 'A(Bv) = (AB)v', 'rightmost acts first']) },
    { title: 'Order matters', text: 'Let R = rotate 90° [0 −1; 1 0] and F = reflect across the x-axis [1 0; 0 −1]. F·R means R first, then F; R·F means F first, then R. They are different warps: in general AB ≠ BA. Multiplying entry by entry is not the matrix product at all.', steps: ['F·R top right: row 1 of F · column 2 of R = 1 × (−1) + 0 × 0 = −1', 'R·F top right: row 1 of R · column 2 of F = 0 × 0 + (−1) × (−1) = 1', 'Track e₁ through F·R: (1, 0) → (0, 1) → (0, −1), column 1 of F·R.', 'Through R·F: (1, 0) → (1, 0) → (0, 1), column 1 of R·F.'], next: 'Follow e₂ = (0, 1) through both orders. Where does each send it?', visual: matV([[[[0, -1], [-1, 0]], 'F·R: R first'], [[[0, 1], [1, 0]], 'R·F: F first']], ['≠']) },
  ],
  quests: [
    { id: 'aq.linalg.matmul.gear-train', name: 'Gear Train', giver: 'brick', guided: true,
      hook: 'Brick: "Two gear stages in a row make one gearbox. Row times column, and the whole train is one matrix."',
      change: 'The gear train meshes; the Gallery\'s great wheels turn together.',
      waves: [wave('Fill the product', times(3, productTableStep)), wave('Row by column', mixOf([productEntryStep, productEntryStep, prodSizeStep])), wave('Which product', times(2, productPickStep))] },
    { id: 'aq.linalg.matmul.chained', name: 'Chained Warps', giver: 'ada',
      hook: 'Ada: "The Warp Floor runs two warps back to back. Get the order wrong and the beacon lands in the wall."',
      change: 'Chained warps run cleanly; beacons land exactly where planned.',
      waves: [wave('Do the sizes fit', times(2, prodSizeStep)), wave('Order matters', times(3, composeOrderStep)), wave('Two warps in a row', times(3, composePlotStep))] },
  ],
  concept: conceptFrom([productTableStep, productPickStep, composeOrderStep, composePlotStep]),
  transfer: oneOf([partsStep]),
  practice: (rng) => productEntryStep(rng).question,
};

/* =====================================================================================
 * Chapter 7 · Systems as Ax = b
 * ===================================================================================== */
const K7 = 'systems';
const XY = ['x', 'y']; const XYZ = ['x', 'y', 'z'];
const eqStr = (cs: number[], vars: string[], rhs: number) => `${lin(cs, vars)} = ${fmt(rhs)}`;
const det3 = (A: Mat) => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
/** An augmented matrix [A | b] as a mat visual (a '|' column separates b). */
const augV = (A: Mat, b: Vec, label?: string): Visual => matV([[A.map((r, i) => [...r, '|', b[i]]), label]]);

function system2(rng: Rng, lo = -4, hi = 5) {
  return until(() => { const A = randM(rng, 2, 2, lo, hi); const s = [rint(rng, -3, 4), rint(rng, -3, 4)]; return { A, s, b: mulv(A, s) }; },
    (t) => det2(t.A) !== 0 && t.A.flat().every((x) => x !== 0), { A: [[2, 1], [1, -1]], s: [2, 1], b: [5, 1] });
}

function augmentedStep(rng: Rng): AskStep {
  const three = rng.next() < 0.5; const n = three ? 3 : 2; const vars = three ? XYZ : XY;
  const { A, b } = until(() => {
    const A = randM(rng, n, n, -4, 5);
    if (three) { const zi = rint(rng, 0, 2); A[zi][(zi + rint(rng, 1, 2)) % 3] = 0; }
    else if (rng.next() < 0.4) A[rint(rng, 0, 1)][rint(rng, 0, 1)] = 0;
    const s = Array.from({ length: n }, () => rint(rng, -3, 3));
    return { A, b: mulv(A, s) };
  }, (t) => (three ? det3(t.A) : det2(t.A)) !== 0 && t.A.every((r) => r.some((x) => x !== 0)), three ? { A: [[2, -1, 0], [1, 0, 3], [0, 1, -1]], b: [5, 4, 1] } : { A: [[2, 1], [1, -1]], b: [5, 1] });
  const full = A.map((r, i) => [...r, b[i]]); const w = n + 1;
  const zeros = full.flatMap((r, i) => r.map((x, j) => (x === 0 && j < n ? i * w + j : -1))).filter((k) => k >= 0);
  const others = rng.shuffle(full.flat().map((_, k) => k).filter((k) => !zeros.includes(k))).slice(0, Math.max(0, (three ? 4 : 3) - zeros.length));
  const blank = new Set([...zeros, ...others]);
  const rows = full.map((r, i) => r.map((x, j) => (blank.has(i * w + j) ? null : x)));
  const ans = full.flat().filter((_, k) => blank.has(k));
  const eqs = A.map((r, i) => eqStr(r, vars, b[i]));
  const q = mkq(S(K7), 'augmented', {
    prompt: `Solver Deck intake: ${eqs.join(';  ')}. Complete the augmented matrix [A | b].`,
    expression: '[A | b]', answer: 0, answerText: ms(full),
    hint: 'One row per equation: the coefficients of each variable in order, then the right side. A missing variable has coefficient 0.',
    steps: ['Each equation is a row: coefficients in variable order, then the constant.', ...eqs.map((e, i) => `${e} → ${full[i].map(fmt).join(', ')}`)],
    visual: card('The system', eqs),
  });
  return model(q, { kind: 'table', cols: [...vars, 'b'], rows, label: '[A | b]', bracket: true }, [csv(ans)], 'Fill in the blank entries of [A | b].');
}

function checkSolutionStep(rng: Rng): AskStep {
  const { A, s, b } = system2(rng);
  const g1 = gcd(A[0][0], A[0][1]); const only1 = [s[0] + A[0][1] / g1, s[1] - A[0][0] / g1];
  const g2 = gcd(A[1][0], A[1][1]); const only2 = [s[0] + A[1][1] / g2, s[1] - A[1][0] / g2];
  const eqs = A.map((r, i) => eqStr(r, XY, b[i]));
  const q = mkq(S(K7), 'check', {
    prompt: 'Two beam equations must both hold. Which point (x, y) solves the system?',
    expression: eqs.join(',  '), answer: 0, answerText: vs(s),
    hint: 'Substitute each candidate into BOTH equations. Passing one is not enough.',
    steps: ['A solution must satisfy every equation at once.', `(${fmt(s[0])}, ${fmt(s[1])}): ${lin(A[0], XY)} → ${fmt(b[0])} ✓ and ${lin(A[1], XY)} → ${fmt(b[1])} ✓.`, `${vs(only1)} satisfies only the first equation.`],
    visual: card('The system', eqs),
  });
  return choose(rng, q, vs(s), [vs(only1), vs(only2), vs([s[1], s[0]]), vs([-s[0], s[1]])]);
}

function linesProblem(rng: Rng) {
  return until(() => system2(rng, -3, 3), (t) => t.A[0][1] !== 0 && t.A[1][1] !== 0 && fits(t.s, 5) && (t.s[0] !== 0 || t.s[1] !== 0) && Math.abs(t.b[0]) <= 9 && Math.abs(t.b[1]) <= 9, { A: [[1, 1], [1, -1]], s: [2, 1], b: [3, 1] });
}
function intersectStep(rng: Rng): AskStep {
  const { A, s, b } = linesProblem(rng);
  const fn = (i: number) => ({ kind: 'poly' as const, c: [b[i] / A[i][1], -A[i][0] / A[i][1]] });
  const layers: PlotLayers = { fns: [{ fn: fn(0), color: 'teal' }, { fn: fn(1), color: 'orange' }] };
  const eqs = A.map((r, i) => eqStr(r, XY, b[i]));
  const q = mkq(S(K7), 'intersect', {
    prompt: `Row picture: each equation is a line. Teal: ${eqs[0]}. Orange: ${eqs[1]}.`,
    expression: eqs.join(',  '), answer: s[0], answerText: vs(s),
    hint: 'The solution lies on both lines at once: where they cross. Check it in both equations.',
    steps: ['A solution of the system is a point on every line.', `The lines cross at ${vs(s)}.`, `Check: ${prods(A[0], s)} = ${fmt(b[0])} and ${prods(A[1], s)} = ${fmt(b[1])}.`],
    visual: plotV(layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: 'teal: equation 1 · orange: equation 2', layers }, [`${s[0]},${s[1]}`], 'Tap the point that solves both equations.');
}

function substituteProblem(rng: Rng) {
  return until(() => {
    const p = pick(rng, [1, 2, -1, 3, -2]); const qq = rint(rng, -4, 4); const a = rnz(rng, -3, 3); const bb = rnz(rng, -3, 3);
    const y0 = rint(rng, -3, 4); const x0 = p * y0 + qq; return { p, qq, a, bb, y0, x0, e: a * x0 + bb * y0 };
    // The balance starts at (a·p + bb)y + a·qq = e: reject a zero coefficient and a start that is already "y = e".
  }, (t) => t.a * t.p + t.bb !== 0 && !(t.a * t.p + t.bb === 1 && t.a * t.qq === 0) && Math.abs(t.e) <= 30, { p: 2, qq: 1, a: 3, bb: 1, y0: 2, x0: 5, e: 17 });
}
/** '3(…)', '−(…)', '(…)' for a coefficient in front of parentheses. */
const coefParen = (a: number, inner: string) => `${a === 1 ? '' : a === -1 ? '−' : fmt(a)}(${inner})`;
const xExpr = (p: number, qq: number) => `${coefTerm(p, 'y')}${qq ? ` ${qq < 0 ? '−' : '+'} ${Math.abs(qq)}` : ''}`;
function substituteStep(rng: Rng): AskStep {
  const { p, qq, a, bb, y0, x0, e } = substituteProblem(rng);
  const A1 = a * p + bb; const B1 = a * qq;
  const q = mkq(S(K7), 'substitute', {
    prompt: `Beam loads: x = ${xExpr(p, qq)} and ${eqStr([a, bb], XY, e)}. Substitute for x, then solve for y.`,
    expression: `${coefParen(a, xExpr(p, qq))} ${bb < 0 ? '−' : '+'} ${coefTerm(Math.abs(bb), 'y')} = ${fmt(e)}`, answer: y0, negative: true,
    hint: 'Replace x in the second equation by its expression in y. Now there is one unknown.',
    steps: [`Substitute: ${coefParen(a, xExpr(p, qq))} ${bb < 0 ? '−' : '+'} ${coefTerm(Math.abs(bb), 'y')} = ${fmt(e)}.`, `Simplify: ${lin([A1], ['y'])}${B1 ? ` ${B1 < 0 ? '−' : '+'} ${Math.abs(B1)}` : ''} = ${fmt(e)}.`, `y = ${fmt(y0)}, then x = ${fmt(x0)}.`],
  });
  return model(q, { kind: 'balance', a: A1, b: B1, c: 0, d: e, variable: 'y', label: 'after substituting x' }, [String(y0)], 'Balance the substituted equation until y stands alone.');
}

function howManyStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2);
  const r1 = [rnz(rng, -4, 4), rnz(rng, -4, 4)]; const e1 = rint(rng, -6, 6); const k = pick(rng, [2, -1, 3, -2]);
  const r2 = kind === 0 ? until(() => [rnz(rng, -4, 4), rnz(rng, -4, 4)], (r) => r[0] * r1[1] - r[1] * r1[0] !== 0, [r1[1], -r1[0]]) : scale(k, r1);
  const e2 = kind === 0 ? rint(rng, -6, 6) : kind === 1 ? k * e1 + pick(rng, [1, -1, 2, 3]) : k * e1;
  const labels = ['exactly one solution', 'no solution', 'infinitely many solutions'];
  const eqs = [eqStr(r1, XY, e1), eqStr(r2, XY, e2)];
  const q = mkq(S(K7), 'how-many', {
    prompt: 'Two support cables follow these equations. How many points (x, y) satisfy both?',
    expression: eqs.join(',  '), answer: kind,
    hint: 'Is the left side of one equation a multiple of the other? If so, compare the right sides too.',
    steps: kind === 0
      ? ['The left sides are not multiples of each other: the lines have different slopes.', 'Two lines with different slopes cross exactly once.']
      : kind === 1
        ? [`Equation 2's left side is ${fmt(k)} times equation 1's, but ${fmt(e2)} ≠ ${fmt(k)}·${pn(e1)} = ${fmt(k * e1)}.`, 'Parallel lines never meet: no solution.']
        : [`Equation 2 is exactly ${fmt(k)} times equation 1, right side included.`, 'Both describe the same line: infinitely many solutions.'],
    visual: card('The system', eqs),
  });
  return choose(rng, q, labels[kind], [...labels.filter((_, i) => i !== kind), 'exactly two solutions']);
}

const CIRCUITS: Mat[] = [[[2, 1], [1, -1]], [[3, -1], [1, 2]], [[1, 1], [2, -1]], [[4, -2], [1, 1]], [[5, -2], [-2, 3]], [[3, 1], [1, -2]]];
function circuitStep(rng: Rng): AskStep {
  const A = pick(rng, CIRCUITS); const I = [rint(rng, 1, 5), rint(rng, 1, 5)]; const V = mulv(A, I); const which = rint(rng, 0, 1);
  const eqs = A.map((r, i) => eqStr(r, ['I₁', 'I₂'], V[i]));
  const q = mkq(S(K7), 'circuit', {
    prompt: `Volt's two-loop circuit gives ${eqs[0]} and ${eqs[1]}, with the currents in amps. Find ${which ? 'I₂' : 'I₁'}.`,
    expression: eqs.join(',  '), answer: I[which], unit: 'A',
    hint: 'Eliminate one current: scale an equation so one unknown cancels when you add or subtract.',
    steps: ['Write it as Ax = b and eliminate one unknown.', `Solving gives I₁ = ${lab(I[0], 'current in A')} and I₂ = ${lab(I[1], 'current in A')}.`, `Check: ${prods(A[0], I)} = ${lab(fmt(V[0]), 'right side of loop one')} and ${prods(A[1], I)} = ${lab(fmt(V[1]), 'right side of loop two')}.`],
    visual: card('Kirchhoff loops', eqs), app: 'Circuit simulators solve Ax = b for every node and loop.',
  });
  return typed(q);
}
function mixtureStep(rng: Rng): AskStep {
  const [p1, p2] = pick(rng, [[10, 40], [20, 50], [10, 30], [30, 70], [20, 60]]);
  const { x, y, c } = until(() => { const x = rint(rng, 1, 6) * 5; const y = rint(rng, 1, 6) * 5; return { x, y, c: (p1 * x + p2 * y) / (x + y) }; }, (t) => Number.isInteger(t.c), { x: 20, y: 10, c: (p1 * 20 + p2 * 10) / 30 });
  const T = x + y;
  const q = mkq(S(K7), 'mixture', {
    prompt: `Dr. Catalyst needs ${T} L of ${fmt(c)}% acid from a ${p1}% stock and a ${p2}% stock. How many litres of the ${p1}% stock?`,
    expression: `x + y = ${T},  ${fmt(p1 / 100)}x + ${fmt(p2 / 100)}y = ${fmt((c * T) / 100)}`, answer: x, unit: 'L',
    hint: 'One equation for total volume, one for the amount of pure acid.',
    steps: [`x = litres of the ${p1}% stock, y = litres of the ${p2}% stock.`, `Volume: x + y = ${lab(T, 'total litres')}.`, `Acid: ${p1}% is ${lab(fmt(p1 / 100), 'acid per litre')} and ${p2}% is ${lab(fmt(p2 / 100), 'acid per litre')}, so ${fmt(p1 / 100)}x + ${fmt(p2 / 100)}y = ${lab(fmt((c * T) / 100), 'litres of pure acid')}.`, `Substitute y = ${T} − x and solve: x = ${lab(x, 'litres of weaker stock')}, y = ${lab(y, 'litres of stronger stock')}.`],
    visual: card('Mixing', [`${p1}% stock: x L`, `${p2}% stock: y L`, `target: ${T} L at ${fmt(c)}%`]),
  });
  return typed(q);
}

const SYSTEMS: ChapterSpec = {
  key: K7, title: 'Systems as Ax = b', wing: 'solver', wingName: 'Solver Deck Intake',
  goal: 'Write a system as Ax = b and as an augmented matrix, see its solution as where lines cross, check a solution in every equation, and tell one, none or infinitely many solutions.',
  misconception: 'Checking a candidate in only the first equation; dropping a missing variable instead of writing a 0 coefficient; believing every system has exactly one solution.',
  teach: [
    { title: 'One system, three views', text: '2x + y = 5 and x − y = 1 are the matrix equation Ax = b with A = [2 1; 1 −1] and b = (5, 1). They also say x·(2, 1) + y·(1, −1) = (5, 1): b is a mix of the columns of A.', steps: ['Row 1 of A times (x, y): 2x + y = 5.', 'Add the two equations: 3x = 5 + 1 = 6, so x = 2.', 'Then y = 5 − 2 × 2 = 1.', 'Column view: 2·(2, 1) + 1·(1, −1) = (4 + 1, 2 − 1) = (5, 1)'], visual: matV([[[[2, 1], [1, -1]], 'A'], [[['x'], ['y']], 'x'], [[[5], [1]], 'b']], ['·', '=']) },
    { title: 'The augmented matrix', text: 'Write each equation as a row: coefficients in variable order, then the right side. A variable that is missing gets a 0. The sign in front of a term belongs to its coefficient.', steps: ['x + 3z = 4 is 1·x + 0·y + 3·z = 4: row [1 0 3 | 4].', 'y − z = 1 is 0·x + 1·y + (−1)·z = 1: row [0 1 −1 | 1].', 'Check x = 1, y = 2, z = 1: 1 + 3 × 1 = 4 and 2 − 1 = 1.'], next: 'Write 2x − y = 7 as a row with columns x, y, z.', visual: card('x + 3z = 4', ['→ row 1, 0, 3 | 4', 'y − z = 1', '→ row 0, 1, −1 | 1']) },
    { title: 'One, none, or infinitely many', text: 'Two lines in the plane cross once, run parallel (no solution), or are the same line (infinitely many). A solution must satisfy every equation, not just the first one you try.', steps: ['2x + y = 5 is the line y = 5 − 2x; x − y = 1 is y = x − 1.', 'Where they cross: 5 − 2x = x − 1, so 3x = 6 and x = 2.', 'y = 2 − 1 = 1: one crossing, the point (2, 1).', 'Check both: 2 × 2 + 1 = 5 and 2 − 1 = 1.', 'Parallel: 2x + y = 5 and 2x + y = 3 never meet.'], next: 'Change the second equation to 4x + 2y = 10. How many solutions now?', visual: plotV({ fns: [{ fn: { kind: 'poly', c: [5, -2] } }, { fn: { kind: 'poly', c: [-1, 1] }, color: 'orange' }], points: [{ x: 2, y: 1, label: '(2, 1)' }] }) },
  ],
  quests: [
    { id: 'aq.linalg.systems.intake', name: 'Solver Deck Intake', giver: 'volt', guided: true,
      hook: 'Volt: "The Solver Deck only reads matrices. Turn every set of equations into [A | b], and check answers against every row."',
      change: 'The Solver Deck boots; its intake screens fill with clean augmented matrices.',
      waves: [wave('Write the matrix', times(3, augmentedStep)), wave('Check a solution', times(2, checkSolutionStep)), wave('Where lines meet', mixOf([intersectStep, intersectStep, substituteStep]))] },
    { id: 'aq.linalg.systems.beams', name: 'Crossing Beams', giver: 'ada',
      hook: 'Ada: "Some beam pairs cross once, some never, some lie right on top of each other. Tell me which before we weld."',
      change: 'Every beam pair on the Deck is welded exactly where it crosses.',
      waves: [wave('How many solutions', times(3, howManyStep)), wave('Substitute', times(2, substituteStep)), wave('Mixed', mixOf([intersectStep, augmentedStep, checkSolutionStep]))] },
  ],
  concept: conceptFrom([augmentedStep, intersectStep, howManyStep, substituteStep]),
  transfer: oneOf([circuitStep, mixtureStep]),
  practice: (rng) => { const { A, s, b } = system2(rng); const eqs = A.map((r, i) => eqStr(r, XY, b[i])); return mkq(S(K7), 'solve', { prompt: `Solve the system ${eqs.join(' and ')}. Find x.`, expression: eqs.join(',  '), answer: s[0], negative: true, hint: 'Eliminate y or substitute, then check in both equations.', steps: [`The solution is (x, y) = ${vs(s)}.`, `Check: ${prods(A[0], s)} = ${fmt(b[0])} and ${prods(A[1], s)} = ${fmt(b[1])}.`] }); },
};

/* =====================================================================================
 * Chapter 8 · Gaussian elimination
 * ===================================================================================== */
const K8 = 'elim';
/** 'R₂ → R₂ − 3R₁' (new R_t = R_t − m·R_s). */
const opText = (t: number, m: number, s: number) => `R${sub(t)} → R${sub(t)} ${m < 0 ? '+' : '−'} ${Math.abs(m) === 1 ? '' : Math.abs(m)}R${sub(s)}`;
const opShort = (t: number, m: number, s: number) => `R${sub(t)} ${m < 0 ? '+' : '−'} ${Math.abs(m) === 1 ? '' : Math.abs(m)}R${sub(s)}`;

function elimRows(rng: Rng, n: number) {
  return until(() => {
    const p = pick(rng, [1, -1, 2]); const m = pick(rng, [2, 3, -2, -3, -1, 4]);
    const r1 = [p, ...Array.from({ length: n }, () => rint(rng, -3, 3))];
    const r2 = [m * p, ...Array.from({ length: n }, () => rint(rng, -4, 5))];
    const nr = r2.map((x, j) => x - m * r1[j] + 0);
    return { p, m, r1, r2, nr };
  }, (t) => t.nr[1] !== 0 && t.r1[1] !== 0 && t.nr.every((x) => Math.abs(x) <= 25), { p: 1, m: 2, r1: [1, 2, 3], r2: [2, 1, 4], nr: [0, -3, -2] });
}

function nextOpStep(rng: Rng): AskStep {
  const three = rng.next() < 0.4; const n = three ? 3 : 2;
  const { m, r1, r2 } = elimRows(rng, n);
  const t = three ? rint(rng, 2, 3) : 2;
  const other = [0, ...Array.from({ length: n }, () => rint(rng, -4, 5))];
  const rows = three ? (t === 2 ? [r1, r2, other] : [r1, other, r2]) : [r1, r2];
  const A = rows.map((r) => r.slice(0, n)); const b = rows.map((r) => r[n]);
  const right = opText(t, m, 1);
  const flip = Math.abs(m) >= 2 ? `R${sub(t)} → R${sub(t)} ${m < 0 ? '+' : '−'} (1/${Math.abs(m)})R₁` : `R${sub(t)} → R${sub(t)} − 2R₁`;
  const q = mkq(S(K8), 'next-op', {
    prompt: `The press needs a 0 under the first pivot in row ${t}. Which row operation makes it?`,
    expression: `clear the ${fmt(r2[0])} in row ${t}`, answer: m,
    hint: 'Multiplier m = (entry to clear) ÷ (pivot), then R → R − m·R₁. Watch the sign of m.',
    steps: [`Multiplier m = ${lab(fmt(r2[0]), 'entry to clear')} / ${lab(fmt(r1[0]), 'pivot')} = ${lab(fmt(m), 'multiplier')}.`, `${right}: ${fmt(r2[0])} − ${pn(m)}·${pn(r1[0])} = 0.`],
    visual: augV(A, b),
  });
  return choose(rng, q, right, [opText(t, -m, 1), `R₁ → R₁ ${m < 0 ? '+' : '−'} ${Math.abs(m) === 1 ? '' : Math.abs(m)}R${sub(t)}`, flip]);
}

function fillRowStep(rng: Rng, three = rng.next() < 0.4): AskStep {
  const n = three ? 3 : 2; const vars = three ? XYZ : XY;
  const { m, r1, r2, nr } = elimRows(rng, n);
  const op = opText(2, m, 1);
  const q = mkq(S(K8), 'fill-row', {
    prompt: `Row-reduction press: apply ${op} to the whole row, right side included.`,
    expression: op, answer: nr[1], answerText: `[${nr.map(fmt).join(' ')}]`,
    hint: `Work column by column: new entry = (R₂ entry) − m·(R₁ entry) with m = ${fmt(m)}. Don't skip the b column.`,
    steps: [`${op}: apply it to every entry of row 2, the b column included.`, ...nr.slice(1).map((x, j) => `${j < n - 1 ? vars[j + 1] : 'b'}: ${fmt(r2[j + 1])} − ${pn(m)}·${pn(r1[j + 1])} = ${fmt(x)}`)],
    visual: augV([r1.slice(0, n), r2.slice(0, n)], [r1[n], r2[n]]),
  });
  return model(q, { kind: 'table', cols: [...vars, 'b'], rowLabels: ['R₁', 'R₂', `new ${opShort(2, m, 1)}`], rows: [r1, r2, [0, ...nr.slice(1).map(() => null)]], label: op }, [csv(nr.slice(1))], 'Fill in the new row 2.');
}

function backSubProblem(rng: Rng) {
  const three = rng.next() < 0.4;
  if (!three) {
    const c = pick(rng, [1, 2, 3, -1, -2]); const a = rnz(rng, -3, 3); const x0 = rint(rng, -4, 5); const y0 = rint(rng, -4, 4);
    return { A: [[1, a], [0, c]] as Mat, b: [x0 + a * y0, c * y0], sol: [x0, y0] };
  }
  const a = rint(rng, -3, 3); const bb = rnz(rng, -2, 2); const c = rnz(rng, -3, 3); const d = pick(rng, [1, 2, -1, 3]);
  const s = [rint(rng, -3, 4), rint(rng, -3, 3), rint(rng, -3, 3)];
  const A: Mat = [[1, a, bb], [0, 1, c], [0, 0, d]];
  return { A, b: mulv(A, s), sol: s };
}
function backSubSteps(A: Mat, b: Vec, sol: Vec) {
  const vars = A.length === 3 ? XYZ : XY; const n = A.length;
  return [
    'Start at the bottom row, which has one unknown, and work upward.',
    ...Array.from({ length: n }, (_, k) => n - 1 - k).map((i) => {
      const known = A[i].map((c, j) => (j > i && c ? `${pn(c)}·${pn(sol[j])}` : '')).filter(Boolean);
      const alone = A[i][i] === 1 && !known.length;
      return alone ? `Row ${i + 1}: ${vars[i]} = ${fmt(sol[i])}.` : `Row ${i + 1}: ${eqStr(A[i], vars, b[i])} → ${vars[i]} = ${fmt(sol[i])}${known.length ? ` (after moving ${known.join(' + ')})` : ''}.`;
    }),
  ];
}
function backSubStep(rng: Rng): AskStep {
  const { A, b, sol } = backSubProblem(rng); const vars = A.length === 3 ? XYZ : XY;
  const q = mkq(S(K8), 'back-sub', {
    prompt: 'The press left the system in echelon form. Back-substitute to find x.',
    expression: A.map((r, i) => eqStr(r, vars, b[i])).join(',  '), answer: sol[0], negative: true,
    hint: 'Solve the last row first, then substitute upward.',
    steps: backSubSteps(A, b, sol),
    visual: augV(A, b),
  });
  return typed(q);
}

function readEndStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2); const three = rng.next() < 0.6;
  const a = rint(rng, -3, 3); const bb = rint(rng, -3, 3); const c = rint(rng, -3, 3);
  const e = rint(rng, -5, 5); const f = rint(rng, -5, 5); const g = rnz(rng, -5, 5); const d = rnz(rng, -3, 3);
  const A: Mat = three ? [[1, a, bb], [0, 1, c], [0, 0, kind === 0 ? d : 0]] : [[1, a], [0, kind === 0 ? d : 0]];
  const b = three ? [e, f, kind === 2 ? 0 : g] : [e, kind === 2 ? 0 : g];
  const last = A.length - 1; const lastEq = `${A[last].map(fmt).join(' ')} | ${fmt(b[last])}`;
  const labels = ['exactly one solution', 'no solution', 'infinitely many solutions'];
  const q = mkq(S(K8), 'read-end', {
    prompt: 'Row reduction is finished. Read the staircase: how many solutions does the system have?',
    expression: `last row: [${lastEq}]`, answer: kind,
    hint: 'Translate the last row back into an equation and see what it claims.',
    steps: kind === 0
      ? [`The last row says ${lin([A[last][last]], [three ? 'z' : 'y'])} = ${fmt(b[last])}: every variable has a pivot.`, 'Back-substitution gives exactly one solution.']
      : kind === 1
        ? [`The last row says 0 = ${fmt(g)}, which is impossible.`, 'No solution: the equations contradict each other.']
        : ['The last row says 0 = 0: always true, not a contradiction.', `${three ? 'z' : 'y'} has no pivot, so it is free: infinitely many solutions.`],
    visual: augV(A, b),
  });
  return choose(rng, q, labels[kind], labels.filter((_, i) => i !== kind));
}

function solveProblem(rng: Rng) {
  return until(() => {
    const b1 = rnz(rng, -3, 3); const a2 = rnz(rng, -3, 3); const b2 = rnz(rng, -4, 4); const s = [rint(rng, -4, 4), rint(rng, -4, 4)];
    const A: Mat = [[1, b1], [a2, b2]]; return { A, s, b: mulv(A, s) };
  }, (t) => det2(t.A) !== 0, { A: [[1, 2], [3, 1]], s: [1, 2], b: [5, 5] });
}
function solveSteps(A: Mat, b: Vec, s: Vec) {
  const m = A[1][0]; const c = A[1][1] - m * A[0][1]; const r = b[1] - m * b[0];
  return [`${opText(2, m, 1)} clears x: ${lin([c], ['y'])} = ${fmt(r)}${c === 1 ? '' : `, so y = ${fmt(s[1])}`}.`, `Back into row 1: x ${A[0][1] < 0 ? '−' : '+'} ${Math.abs(A[0][1])}·${pn(s[1])} = ${fmt(b[0])}, so x = ${fmt(s[0])}.`];
}
function solveTableStep(rng: Rng): AskStep {
  const { A, s, b } = solveProblem(rng); const eqs = A.map((r, i) => eqStr(r, XY, b[i]));
  const m = A[1][0]; const c = A[1][1] - m * A[0][1]; const r = b[1] - m * b[0];
  const q = mkq(S(K8), 'solve', {
    prompt: `Reduce and solve: ${eqs[0]} and ${eqs[1]}.`,
    expression: eqs.join(',  '), answer: s[0], answerText: `new R₂ = [0 ${fmt(c)} | ${fmt(r)}], ${vs(s)}`,
    hint: 'Use row 1 to clear x from row 2, right side included. Solve the new row for y, then back-substitute.',
    steps: [`${opText(2, m, 1)}: y-entry ${fmt(A[1][1])} − ${pn(m)}·${pn(A[0][1])} = ${fmt(c)}, b-entry ${fmt(b[1])} − ${pn(m)}·${pn(b[0])} = ${fmt(r)}. The new row says ${lin([c], ['y'])} = ${fmt(r)}${c === 1 ? '' : `, so y = ${fmt(s[1])}`}.`, ...solveSteps(A, b, s).slice(1)],
  });
  return model(q, { kind: 'table', cols: ['x', 'y', 'b'], rowLabels: ['R₁', `new ${opShort(2, m, 1)}`, 'solution'], rows: [[1, A[0][1], b[0]], [0, null, null], [null, null, '—']], label: `[A | b] = ${ms([[1, A[0][1], b[0]], [A[1][0], A[1][1], b[1]]])}` }, [csv([c, r, s[0], s[1]])], 'Fill in the new row 2, then the solution x and y.');
}

/** Clear under the SECOND pivot of a 3 × 3 system whose first column is already clear. */
function secondPivotStep(rng: Rng): AskStep {
  const t = until(() => {
    const p = pick(rng, [1, -1, 2]); const m = pick(rng, [2, -1, 3, -2]);
    const a = rint(rng, -3, 3); const bb = rint(rng, -3, 3); const c = rnz(rng, -3, 3); const d = rint(rng, -3, 4);
    const s = [rint(rng, -3, 3), rint(rng, -3, 3), rnz(rng, -3, 3)];
    const A: Mat = [[1, a, bb], [0, p, c], [0, m * p, d]]; const b = mulv(A, s);
    return { p, m, A, b, s, nz: d - m * c, nb: b[2] - m * b[1] };
  }, (t) => t.nz !== 0 && Math.abs(t.nb) <= 30 && t.b.every((x) => Math.abs(x) <= 20), { p: 1, m: 2, A: [[1, 1, 1], [0, 1, 2], [0, 2, 1]], b: [6, 8, 7], s: [1, 2, 3], nz: -3, nb: -9 });
  const { p, m, A, b, s, nz, nb } = t;
  const op = opText(3, m, 2);
  const q = mkq(S(K8), 'second-pivot', {
    prompt: `Three-bolt joint: column x is already clear. Clear the ${fmt(m * p)} under the second pivot ${fmt(p)} to finish the staircase.`,
    expression: 'R₃ → R₃ − m·R₂', answer: nz, answerText: `new R₃ = [0 0 ${fmt(nz)} | ${fmt(nb)}]`,
    hint: 'Use R₂, not R₁: m = (entry to clear) ÷ (second pivot). Apply it across the whole row, b included.',
    steps: [`m = ${lab(fmt(m * p), 'entry to clear')} / ${lab(fmt(p), 'second pivot')} = ${lab(fmt(m), 'multiplier')}, so ${op}. R₁ is not used: x is already cleared in R₂ and R₃.`, `y: ${fmt(m * p)} − ${pn(m)}·${pn(p)} = 0.`, `z: ${fmt(A[2][2])} − ${pn(m)}·${pn(A[1][2])} = ${fmt(nz)}.`, `b: ${fmt(b[2])} − ${pn(m)}·${pn(b[1])} = ${fmt(nb)}.`, `Echelon form reached. The new row says ${lin([nz], ['z'])} = ${fmt(nb)}${nz === 1 ? '' : `, so z = ${fmt(s[2])}`}; back-substitute for y and x.`],
  });
  return model(q, { kind: 'table', cols: ['x', 'y', 'z', 'b'], rowLabels: ['R₁', 'R₂', 'R₃', `new ${opShort(3, m, 2)}`], rows: [[...A[0], b[0]], [...A[1], b[1]], [...A[2], b[2]], [0, null, null, null]], label: op }, [csv([0, nz, nb])], 'Fill in the new row 3: its y, z and b entries.');
}

/** A 0 in a pivot slot: the fix is a row swap. */
function swapStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2);
  let A: Mat; let right: string; let wrongs: string[]; let why: string;
  if (kind === 0) {
    A = [[0, rnz(rng, -3, 3)], [rnz(rng, -3, 3), rint(rng, -3, 3)]];
    right = 'R₁ ↔ R₂'; wrongs = ['no solution: the pivot is 0', 'divide R₁ by 0', 'R₂ → R₂ − 0·R₁'];
    why = 'R₂ has a nonzero x-entry, so swap it up: R₁ ↔ R₂.';
  } else if (kind === 1) {
    A = until(() => [[0, rnz(rng, -3, 3), rint(rng, -3, 3)], [0, rint(rng, -3, 3), rnz(rng, -3, 3)], [rnz(rng, -3, 3), rint(rng, -3, 3), rint(rng, -3, 3)]], (M) => det3(M) !== 0, [[0, 1, 2], [0, 2, 1], [1, 1, 1]]);
    right = 'R₁ ↔ R₃'; wrongs = ['R₁ ↔ R₂', 'no solution: the pivot is 0', 'divide R₁ by 0'];
    why = 'R₂ also has a 0 in the x column, so swapping with R₂ does not help. R₃ has a nonzero x-entry: R₁ ↔ R₃.';
  } else {
    A = [[1, rint(rng, -3, 3), rint(rng, -3, 3)], [0, 0, rnz(rng, -3, 3)], [0, rnz(rng, -3, 3), rint(rng, -3, 3)]];
    right = 'R₂ ↔ R₃'; wrongs = ['y is free: its pivot is 0', 'R₁ ↔ R₂', 'no solution: the pivot is 0'];
    why = 'y is not free: R₃ has a nonzero y-entry. Swap it up, R₂ ↔ R₃, and y gets its pivot.';
  }
  const n = A.length; const sol = Array.from({ length: n }, () => rint(rng, -3, 3)); const b = mulv(A, sol);
  const slot = kind === 2 ? 'second' : 'first';
  const q = mkq(S(K8), 'swap', {
    prompt: `The press stalls: the ${slot} pivot slot holds a 0. Which move gets it going?`,
    expression: kind === 2 ? 'pivot (2, 2) = 0' : 'pivot (1, 1) = 0', answer: 0,
    hint: 'A pivot cannot be 0, but a 0 there does not mean the system is broken. Which of the three legal moves can bring a nonzero entry up?',
    steps: ['A 0 cannot be a pivot: you cannot divide by it or use it to clear the entries below.', why, 'Swapping rows is one of the three legal moves: it keeps every solution.'],
    visual: augV(A, b),
  });
  return choose(rng, q, right, wrongs);
}

const REACTIONS: { eq: string; species: string[]; coef: number[]; atoms: string[] }[] = [
  { eq: 'a CH₄ + b O₂ → c CO₂ + d H₂O', species: ['CH₄', 'O₂', 'CO₂', 'H₂O'], coef: [1, 2, 1, 2], atoms: ['C: a = c', 'H: 4a = 2d', 'O: 2b = 2c + d'] },
  { eq: 'a C₃H₈ + b O₂ → c CO₂ + d H₂O', species: ['C₃H₈', 'O₂', 'CO₂', 'H₂O'], coef: [1, 5, 3, 4], atoms: ['C: 3a = c', 'H: 8a = 2d', 'O: 2b = 2c + d'] },
  { eq: 'a H₂ + b O₂ → c H₂O', species: ['H₂', 'O₂', 'H₂O'], coef: [2, 1, 2], atoms: ['H: 2a = 2c', 'O: 2b = c'] },
  { eq: 'a N₂ + b H₂ → c NH₃', species: ['N₂', 'H₂', 'NH₃'], coef: [1, 3, 2], atoms: ['N: 2a = c', 'H: 2b = 3c'] },
  { eq: 'a Fe + b O₂ → c Fe₂O₃', species: ['Fe', 'O₂', 'Fe₂O₃'], coef: [4, 3, 2], atoms: ['Fe: a = 2c', 'O: 2b = 3c'] },
  { eq: 'a C₂H₆ + b O₂ → c CO₂ + d H₂O', species: ['C₂H₆', 'O₂', 'CO₂', 'H₂O'], coef: [2, 7, 4, 6], atoms: ['C: 2a = c', 'H: 6a = 2d', 'O: 2b = 2c + d'] },
  { eq: 'a Al + b O₂ → c Al₂O₃', species: ['Al', 'O₂', 'Al₂O₃'], coef: [4, 3, 2], atoms: ['Al: a = 2c', 'O: 2b = 3c'] },
];
function chemStep(rng: Rng): AskStep {
  const r = pick(rng, REACTIONS); const i = rint(rng, 0, r.species.length - 1);
  const q = mkq(S(K8), 'balance-chem', {
    prompt: `Dr. Catalyst balances ${r.eq}. Each element gives one linear equation. With the smallest whole numbers, what is the coefficient of ${r.species[i]}?`,
    expression: r.atoms.join(',  '), answer: r.coef[i],
    hint: 'Set one coefficient to 1 (or 2), solve the others from the atom equations, then clear any fractions.',
    steps: ['Atom balance is a homogeneous linear system; its solutions are multiples of one vector.', ...r.atoms, `Smallest whole numbers: ${r.species.map((sp, k) => `${r.coef[k]} ${sp}`).join(', ')}.`],
    visual: card('Atom balance', r.atoms), app: 'Chemical engineers balance reactions and mass flows by row reduction.',
  });
  return typed(q);
}

const ELIM: ChapterSpec = {
  key: K8, title: 'Gaussian Elimination', wing: 'solver', wingName: 'Row-Reduction Press',
  goal: 'Choose the row operation that clears an entry, carry it across the whole row, reach echelon form, back-substitute, and read "no solution" or "free variable" from the last row.',
  misconception: 'Applying a row operation to the coefficients but not the right-hand side; getting the multiplier upside down or with the wrong sign; using R₁ again to clear under the second pivot; giving up at a 0 pivot instead of swapping rows; reading a row of zeros as "no solution".',
  teach: [
    { title: 'Three legal moves', text: 'Swap two rows. Multiply a row by a nonzero number. Add a multiple of one row to another. None of them changes the solutions, and each acts on the WHOLE row, right side included.', steps: ['The rows say x + 2y = 5 and 3x + y = 5.', 'R₂ − 3R₁: 3 − 3 × 1 = 0, 1 − 3 × 2 = −5, 5 − 3 × 5 = −10', 'x = 1, y = 2 fits before and after: 1 + 2 × 2 = 5 and −5 × 2 = −10.', 'Skip the right side and you keep 5, not −10: a wrong system.'], visual: augV([[1, 2], [3, 1]], [5, 5], '[A | b]') },
    { title: 'Clear below each pivot', text: 'The pivot is a row\'s first nonzero entry. To clear the 3 under a pivot of 1: m = 3 ÷ 1, so R₂ → R₂ − 3R₁. Repeat under the next pivot, using THAT pivot\'s row, until the rows form a staircase (echelon form). A 0 in a pivot slot? Swap in a lower row. Then back-substitute from the bottom.', steps: ['m = 3 (entry to clear) ÷ 1 (pivot) = 3 (multiplier).', 'R₂ − 3R₁ = (3, 1 | 5) − 3 × (1, 2 | 5) = (0, −5 | −10)', 'Back-substitute: −5y = −10, so y = −10 ÷ (−5) = 2.', 'Row 1: x + 2 × 2 = 5, so x = 5 − 4 = 1.'], next: 'Reduce [2 1 | 4; 6 5 | 16]. What multiplier clears the 6?', visual: augV([[1, 2], [0, -5]], [5, -10], 'after R₂ − 3R₁') },
    { title: 'Read the last row', text: '[0 0 | 5] says 0 = 5: impossible, so no solution. [0 0 | 0] says 0 = 0: nothing is wrong, but a variable has no pivot and is free, so there are infinitely many solutions.', steps: ['[0 3 | 6] says 0x + 3y = 6, so y = 6 ÷ 3 = 2.', '[0 0 | 5] says 0x + 0y = 5: no x and y can make 0 = 5.', '[0 0 | 0] says 0x + 0y = 0: true for every x and y, so one is free.'], visual: card('Last rows', ['[0 0 | 5] → no solution', '[0 0 | 0] → free variable', '[0 3 | 6] → y = 2']) },
  ],
  quests: [
    { id: 'aq.linalg.elim.press', name: 'Row-Reduction Press', giver: 'vector', guided: true,
      hook: 'Vector: "The press takes three moves and no others. Clear below each pivot and the system solves itself from the bottom up."',
      change: 'The press thumps rhythmically; staircases of brass rows roll off the line.',
      waves: [wave('Choose the move', times(3, nextOpStep)), wave('Fill the new row', times(3, (r) => fillRowStep(r))), wave('Reduce and solve', mixOf([backSubStep, solveTableStep]))] },
    { id: 'aq.linalg.elim.three-unknowns', name: 'Three Unknowns', giver: 'brick',
      hook: 'Brick: "Three-bolt joints, three unknown loads. Some joints are overdetermined, some are floppy. The last row tells you which."',
      change: 'Every joint on the Deck is solved or flagged; the floppy ones get extra braces.',
      waves: [wave('Clear the column', times(2, (r) => fillRowStep(r, true))), wave('Second pivot', mixOf([secondPivotStep, swapStep, secondPivotStep])), wave('Read the staircase', times(3, readEndStep))] },
  ],
  concept: conceptFrom([nextOpStep, (r) => fillRowStep(r), readEndStep, solveTableStep, secondPivotStep]),
  transfer: oneOf([chemStep]),
  practice: (rng) => backSubStep(rng).question,
};

/* =====================================================================================
 * Chapter 9 · Determinants
 * ===================================================================================== */
const K9 = 'det';

function det2ChooseStep(rng: Rng): AskStep {
  const A = until(() => randM(rng, 2, 2, -5, 6), (M) => M.flat().every((x) => x !== 0) && M[0][1] * M[1][0] !== 0 && det2(M) !== 0, [[3, 2], [1, 4]]);
  const [[a, b], [c, d]] = A; const D = det2(A);
  const q = mkq(S(K9), 'det2', {
    prompt: 'The vault door reads its determinant before it opens. What is det A?',
    expression: `det ${ms(A)} = ?`, answer: D, negative: true,
    hint: 'Main diagonal product minus the other diagonal product.',
    steps: ['det [a b; c d] = ad − bc.', `${pn(a)}·${pn(d)} − ${pn(b)}·${pn(c)} = ${fmt(a * d)} − ${pn(b * c)} = ${lab(fmt(D), 'determinant')}.`],
    visual: matV([[A, 'A']]),
  });
  return choose(rng, q, fmt(D), [fmt(a * d + b * c), fmt(-D), fmt(a * c - b * d), fmt(a * b - c * d)]);
}

function areaProblem(rng: Rng) {
  return until(() => { const u = [rint(rng, -3, 4), rint(rng, -3, 3)]; const v = [rint(rng, -3, 3), rint(rng, -3, 4)]; return { u, v, D: u[0] * v[1] - u[1] * v[0] }; },
    (t) => t.D !== 0 && Math.abs(t.D) <= 14 && fits(add(t.u, t.v), 6) && t.u.some((x) => x) && t.v.some((x) => x) && t.u[1] !== 0 && t.v[0] !== 0, { u: [3, 1], v: [1, 2], D: 5 });
}
const paraLayers = (u: Vec, v: Vec): PlotLayers => ({ vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v', color: 'teal' }], segments: [{ a: [u[0], u[1]], b: [u[0] + v[0], u[1] + v[1]], dashed: true, color: 'muted' }, { a: [v[0], v[1]], b: [u[0] + v[0], u[1] + v[1]], dashed: true, color: 'muted' }] });
function areaStep(rng: Rng): AskStep {
  const { u, v, D } = areaProblem(rng);
  const q = mkq(S(K9), 'area', {
    prompt: `A floor tile is the parallelogram on u = ${vs(u)} and v = ${vs(v)}. What is its area?`,
    expression: `area = |det [${fmt(u[0])} ${fmt(v[0])}; ${fmt(u[1])} ${fmt(v[1])}]|`, answer: Math.abs(D), unit: 'square units',
    hint: 'Put u and v in as columns, take the determinant, and remember an area is never negative.',
    steps: [`det = ${pn(u[0])}·${pn(v[1])} − ${pn(v[0])}·${pn(u[1])} = ${lab(fmt(D), 'determinant')}.`, `Area = |det| = ${lab(Math.abs(D), 'area in square units')}${D < 0 ? ' (the minus sign only says the pair is clockwise)' : ''}.`],
    visual: plotV(paraLayers(u, v)),
  });
  return model(q, { kind: 'slider', min: 0, max: 16, step: 1, label: 'tile area', unit: 'square units' }, [String(Math.abs(D))], 'Compute det [u v], then slide to the area of the tile.', { aid: { kind: 'plot', range: R6, count: 1, label: 'the tile (for reference)', layers: paraLayers(u, v) } });
}

function orientationStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2);
  const A = kind === 2
    ? until(() => { const r = [rnz(rng, -3, 3), rnz(rng, -3, 3)]; return [r, scale(pick(rng, [2, -1, 3, -2]), r)] as Mat; }, () => true, [[1, 2], [2, 4]])
    : until(() => randM(rng, 2, 2, -3, 4), (M) => (kind === 0 ? det2(M) > 0 : det2(M) < 0) && M.flat().filter((x) => x).length >= 3, kind === 0 ? [[2, 1], [1, 3]] : [[1, 2], [3, 1]]);
  const D = det2(A); const k = Math.abs(D);
  const keep = `keeps orientation and scales areas by ${k || 2}`; const flip = `flips orientation and scales areas by ${k || 2}`;
  const squash = 'squashes the plane onto a line (areas become 0)';
  const right = kind === 0 ? keep : kind === 1 ? flip : squash;
  const q = mkq(S(K9), 'orientation', {
    prompt: 'Before wiring this warp into the vault floor, Brick asks what it does to shapes.',
    expression: `A = ${ms(A)}`, answer: D, negative: true,
    hint: 'Compute det A. Its size is the area factor; its sign says whether the plane is flipped.',
    steps: [`det A = ${pn(A[0][0])}·${pn(A[1][1])} − ${pn(A[0][1])}·${pn(A[1][0])} = ${lab(fmt(D), 'determinant')}.`, kind === 0 ? `Positive: orientation kept; areas scale by ${k}.` : kind === 1 ? `Negative: the warp flips the plane like a mirror; areas scale by |${fmt(D)}| = ${k}. Areas are never negative.` : 'Zero: the columns are parallel, so the whole plane lands on a line.'],
    visual: matV([[A, 'A']]),
  });
  const sumDiag = Math.abs(A[0][0] * A[1][1] + A[0][1] * A[1][0]);
  const wrongs = kind === 2 ? [keep, flip, 'scales areas by 1'] : kind === 0 ? [flip, squash, `keeps orientation and scales areas by ${sumDiag}`, `keeps orientation and scales areas by ${k + 1}`] : [keep, squash, `turns every area negative: area × (${fmt(D)})`];
  return choose(rng, q, right, wrongs);
}

function cofactorProblem(rng: Rng) {
  return until(() => {
    const A = randM(rng, 3, 3, -3, 4); A[rint(rng, 1, 2)][rint(rng, 0, 2)] = 0;
    const M = [0, 1, 2].map((j) => { const rows = [A[1], A[2]].map((r) => r.filter((_, c) => c !== j)); return det2(rows); });
    const t = [A[0][0] * M[0], -A[0][1] * M[1], A[0][2] * M[2]];
    return { A, M, t, D: t[0] + t[1] + t[2] };
  }, (x) => x.A[0].every((v) => v !== 0) && x.D !== 0 && Math.abs(x.D) <= 60, { A: [[2, 1, 3], [0, 1, 2], [1, 0, 1]], M: [1, -2, -1], t: [2, 2, -3], D: 1 });
}
function cofactorSteps(A: Mat, M: Vec, t: Vec, D: number) {
  return [
    'Expand along row 1 with signs + − +; M₁ⱼ is the 2 × 2 determinant left after deleting row 1 and column j.',
    `M₁₁ = ${fmt(M[0])}, M₁₂ = ${fmt(M[1])}, M₁₃ = ${fmt(M[2])}.`,
    `Terms: +${pn(A[0][0])}·${pn(M[0])} = ${fmt(t[0])}, −${pn(A[0][1])}·${pn(M[1])} = ${fmt(t[1])}, +${pn(A[0][2])}·${pn(M[2])} = ${fmt(t[2])}.`,
    `det A = ${fmt(t[0])} + ${pn(t[1])} + ${pn(t[2])} = ${lab(fmt(D), 'determinant')}.`,
  ];
}
function cofactorStep(rng: Rng): AskStep {
  const { A, M, t, D } = cofactorProblem(rng);
  const q = mkq(S(K9), 'cofactor', {
    prompt: `Cofactor lock: expand det A along row 1 for A = ${ms(A)}.`,
    expression: 'det A = +a₁₁M₁₁ − a₁₂M₁₂ + a₁₃M₁₃', answer: D, answerText: fmt(D),
    hint: 'For each entry of row 1, cover its row and column, take the 2 × 2 determinant left over, and use the sign pattern + − +.',
    steps: cofactorSteps(A, M, t, D),
    visual: matV([[A, 'A']]),
  });
  return model(q, { kind: 'table', rowLabels: ['+ a₁₁·M₁₁', '− a₁₂·M₁₂', '+ a₁₃·M₁₃', 'det A'], rows: [[null], [null], [null], [null]], label: `A = ${ms(A)}` }, [csv([...t, D])], 'Fill in each signed term (sign included), then det A.');
}
function det3TypedStep(rng: Rng): AskStep {
  const { A, M, t, D } = cofactorProblem(rng);
  const q = mkq(S(K9), 'det3', {
    prompt: 'A 3D press uses this matrix. Find its determinant.',
    expression: 'det A = ?', answer: D, negative: true,
    hint: 'Expand along row 1 with the sign pattern + − +.',
    steps: cofactorSteps(A, M, t, D),
    visual: matV([[A, 'A']]),
  });
  return typed(q);
}

function zeroDetProblem(rng: Rng) {
  const a = pick(rng, [1, 2, 3, -2]); const b = pick(rng, [1, -1, 2, -2]); const j = rnz(rng, -3, 3);
  return { a, b, c: a * j, k: b * j };
}
function zeroDetStep(rng: Rng): AskStep {
  const { a, b, c, k } = zeroDetProblem(rng);
  const q = mkq(S(K9), 'singular', {
    prompt: `A crane linkage jams when det [${fmt(a)} ${fmt(b)}; ${fmt(c)} k] = 0. Which k jams it?`,
    expression: `${lin([a], ['k'])} − ${pn(b)}·${pn(c)} = 0`, answer: k, negative: true,
    hint: 'Write det = ad − bc with d = k, set it equal to 0, and solve for k.',
    steps: [`det = ${fmt(a)}·k − ${pn(b)}·${pn(c)} = ${lin([a], ['k'])} ${b * c < 0 ? '+' : '−'} ${Math.abs(b * c)}.`, `Set it to 0: k = ${fmt(k)}. Then row 2 is a multiple of row 1, so the columns are parallel.`],
  });
  return model(q, { kind: 'balance', a, b: -b * c, c: 0, d: 0, variable: 'k', label: 'det = 0' }, [String(k)], 'Balance det = 0 until k stands alone.');
}

function scalingStep(rng: Rng): AskStep {
  const { dA, dB } = until(() => ({ dA: pick(rng, [2, 3, -2, 4, -3]), dB: pick(rng, [-2, 3, 2, -1, 5]) }), (t) => t.dA !== t.dB && Math.abs(t.dA + t.dB) !== Math.abs(t.dA * t.dB), { dA: 3, dB: -2 });
  const S0 = rint(rng, 2, 6);
  const area = Math.abs(dA * dB) * S0;
  const q = mkq(S(K9), 'scaling', {
    prompt: `A steel plate of area ${S0} m² passes through warp B (det ${fmt(dB)}), then warp A (det ${fmt(dA)}). What is its final area?`,
    expression: 'area × |det(AB)|', answer: area,
    hint: 'Determinants multiply for a chain of warps; an area uses the absolute value.',
    steps: [`det(AB) = det A · det B = ${lab(fmt(dA), 'det A')} × ${lab(fmt(dB), 'det B')} = ${lab(fmt(dA * dB), 'det AB')}.`, `|det(AB)| = ${lab(Math.abs(dA * dB), 'area factor')}: the sign only says flipped or not.`, `New area = ${lab(Math.abs(dA * dB), 'area factor')} × ${lab(S0, 'area before in m²')} = ${lab(area, 'area after in m²')}.`],
    visual: card('Two warps', [`det B = ${fmt(dB)}`, `det A = ${fmt(dA)}`, `area before: ${S0} m²`]),
  });
  return choose(rng, q, `${area} m²`, [`${Math.abs(dA + dB) * S0} m²`, `${fmt(dA * dB * S0)} m²`, `${Math.abs(dA * dB)} m²`, `${(Math.abs(dA) + Math.abs(dB)) * S0} m²`, `${Math.abs(dA) * S0} m²`, `${S0} m²`]);
}

function volumeStep(rng: Rng): AskStep {
  const d = [pick(rng, [2, 3, 1]), pick(rng, [2, 3, -1, 4]), pick(rng, [1, 2, -2])]; const x = rint(rng, -3, 3); const y = rint(rng, -3, 3); const z = rint(rng, -3, 3);
  const A: Mat = [[d[0], x, y], [0, d[1], z], [0, 0, d[2]]]; const D = d[0] * d[1] * d[2]; const V = rint(rng, 2, 5);
  const q = mkq(S(K9), 'volume', {
    prompt: `Newton's hydraulic press maps every crate with A = ${ms(A)}. A crate of volume ${V} m³ goes in. What volume comes out?`,
    expression: '|det A| × volume', answer: Math.abs(D) * V, unit: 'm³',
    hint: 'A triangular matrix has determinant equal to the product of its diagonal.',
    steps: [`Triangular, so det A = ${d.map(pn).join('·')} = ${lab(fmt(D), 'determinant')}.`, `Volume out = ${lab(Math.abs(D), 'volume factor')} × ${lab(V, 'volume in, m³')} = ${lab(Math.abs(D) * V, 'volume out, m³')}.`],
    visual: matV([[A, 'A']]), app: 'Continuum mechanics tracks volume change with the Jacobian determinant.',
  });
  return typed(q);
}
function surveyStep(rng: Rng): AskStep {
  const { u, v, D } = areaProblem(rng);
  const q = mkq(S(K9), 'survey', {
    prompt: `Ada surveys a triangular plot with corners (0, 0), ${vs(u)} and ${vs(v)} (in hectometres). What is its area in square hectometres?`,
    expression: 'triangle area = |det [u v]| / 2', answer: Math.abs(D) / 2, unit: 'hm²',
    hint: 'A triangle is half the parallelogram on the same two edges.',
    steps: [`det [u v] = ${pn(u[0])}·${pn(v[1])} − ${pn(v[0])}·${pn(u[1])} = ${lab(fmt(D), 'determinant')}.`, `Area = ${lab(Math.abs(D), 'parallelogram area in hm²')} ÷ 2 = ${lab(fmt(Math.abs(D) / 2), 'triangle area in hm²')}.`],
    visual: { type: 'geo', items: [{ t: 'poly', pts: [[0, 0], [u[0], u[1]], [v[0], v[1]]], fill: 'rgba(45,212,191,0.18)' }, { t: 'pt', p: [0, 0], label: '(0, 0)' }, { t: 'pt', p: [u[0], u[1]], label: vs(u) }, { t: 'pt', p: [v[0], v[1]], label: vs(v) }] },
    app: 'Surveyors use the shoelace formula, a sum of 2 × 2 determinants.',
  });
  return typed(q);
}

const DET: ChapterSpec = {
  key: K9, title: 'Determinants: Area & Orientation', wing: 'vault', wingName: 'Determinant Vault',
  goal: 'Compute 2 × 2 and 3 × 3 determinants, read |det| as the area or volume scale factor and its sign as orientation, and find when a matrix squashes space flat.',
  misconception: 'Computing ad + bc; dropping the − sign on the middle cofactor; reading a negative determinant as a negative area; thinking det(AB) = det A + det B.',
  teach: [
    { title: 'ad − bc is an area', text: 'For A = [a b; c d], det A = ad − bc. It is the signed area of the parallelogram built on the columns (a, c) and (b, d): the factor by which A scales every area.', steps: ['Columns u = (3, 1) and v = (1, 2), so A = [3 1; 1 2].', 'det A = 3 × 2 − 1 × 1 = 6 − 1 = 5 (determinant)', 'The parallelogram on the plot has area 5 square units.', 'A scales every area by 5: 1 (unit square area) × 5 (area factor) = 5 (new area).'], next: 'Swap the columns to [1 3; 2 1]. What happens to det?', visual: plotV(paraLayers([3, 1], [1, 2]), [-1, 5, -1, 5]) },
    { title: 'The sign is orientation', text: 'Positive det: orientation kept. Negative: the warp flips the plane like a mirror, and the area factor is |det|. Zero: the plane is squashed onto a line. For a chain of warps, det(AB) = det A · det B.', steps: ['Mirror: det [1 0; 0 −1] = 1 × (−1) − 0 × 0 = −1 (determinant): flipped, area factor |−1| = 1.', 'Squash: det [1 2; 2 4] = 1 × 4 − 2 × 2 = 0 (determinant): columns (1, 2) and (2, 4) lie on one line.', 'Mirror twice: det = (−1) × (−1) = 1 (determinant), so two flips undo each other.'], visual: matV([[[[1, 0], [0, -1]], 'mirror: det −1'], [[[1, 2], [2, 4]], 'squash: det 0']]) },
    { title: '3 × 3 by cofactors', text: 'Expand along row 1 with signs + − +: det A = a₁₁M₁₁ − a₁₂M₁₂ + a₁₃M₁₃, where M₁ⱼ is the 2 × 2 determinant left when you delete row 1 and column j. |det A| is the volume scale factor.', steps: ['Row 1 is (2, 1, 3), with signs + − +.', 'M₁₁ = det [1 2; 0 1] = 1 × 1 − 2 × 0 = 1', 'M₁₂ = det [0 2; 1 1] = 0 × 1 − 2 × 1 = −2', 'M₁₃ = det [0 1; 1 0] = 0 × 0 − 1 × 1 = −1', 'det = 2 × 1 − 1 × (−2) + 3 × (−1) = 2 + 2 − 3 = 1 (determinant)'], next: 'Expand the same determinant down column 2 instead. Do you get 1 again?', visual: card('det [2 1 3; 0 1 2; 1 0 1]', ['+2·(1·1 − 2·0) = 2', '−1·(0·1 − 2·1) = 2', '+3·(0·0 − 1·1) = −3', 'det = 1']) },
  ],
  quests: [
    { id: 'aq.linalg.det.vault-floor', name: 'The Vault Floor', giver: 'brick', guided: true,
      hook: 'Brick: "The vault floor is tiled with parallelograms, and the door only opens for the right determinant. ad minus bc, not plus."',
      change: 'The determinant parallelogram on the Vault floor lights up gold.',
      waves: [wave('ad − bc', times(3, det2ChooseStep)), wave('Measure the tile', times(2, areaStep)), wave('Flip or squash', mixOf([orientationStep, orientationStep, zeroDetStep]))] },
    { id: 'aq.linalg.det.cofactor-lock', name: 'The Cofactor Lock', giver: 'vector',
      hook: 'Vector: "The inner lock is three by three. Expand along the top row, mind the + − + signs, and never let a warp squash the vault flat."',
      change: 'The cofactor lock clicks open; the Vault\'s inner chamber hums.',
      waves: [wave('Expand', times(3, cofactorStep)), wave('When it jams', times(2, zeroDetStep)), wave('Scale factors', mixOf([scalingStep, det3TypedStep, areaStep]))] },
  ],
  concept: conceptFrom([areaStep, cofactorStep, orientationStep, zeroDetStep]),
  transfer: oneOf([volumeStep, surveyStep]),
  practice: (rng) => { const A = until(() => randM(rng, 2, 2, -5, 6), (M) => M.flat().every((x) => x !== 0), [[3, 2], [1, 4]]); const D = det2(A); return mkq(S(K9), 'det2', { prompt: `Find det ${ms(A)}.`, expression: `det ${ms(A)} = ?`, answer: D, negative: true, hint: 'ad − bc.', steps: ['det [a b; c d] = ad − bc.', `${pn(A[0][0])}·${pn(A[1][1])} − ${pn(A[0][1])}·${pn(A[1][0])} = ${lab(fmt(D), 'determinant')}.`] }); },
};

/* =====================================================================================
 * Chapter 10 · The inverse of a 2 × 2
 * ===================================================================================== */
const K10 = 'inverse';

/** A 2 × 2 with determinant ±1 (so its inverse has integer entries). */
function unimodular(rng: Rng, lo = -3, hi = 4): Mat {
  return until(() => randM(rng, 2, 2, lo, hi), (A) => Math.abs(det2(A)) === 1 && A.flat().filter((x) => x !== 0).length >= 3 && !(A[0][0] === A[1][1] && A[0][1] === 0 && A[1][0] === 0), [[2, 1], [1, 1]]);
}
const adj = (A: Mat): Mat => [[A[1][1], -A[0][1] + 0], [-A[1][0] + 0, A[0][0]]];
const inv2 = (A: Mat): Mat => { const D = det2(A); return adj(A).map((r) => r.map((x) => x / D + 0)); };
/** A⁻¹ with exact fraction entries, e.g. [['1/2', '−1'], ['−1/2', '2']]. */
const invS = (A: Mat): string[][] => { const D = det2(A); return adj(A).map((r) => r.map((x) => fracStr(x, D))); };
/** A matrix of display strings inline: [1/2 −1; −1/2 2]. */
const msS = (A: string[][]) => `[${A.map((r) => r.join(' ')).join('; ')}]`;
const strM = (A: Mat): string[][] => A.map((r) => r.map(fmt));
/** Table answer for string entries (ASCII minus). */
const csvS = (xs: string[]) => xs.join(',').replace(/−/g, '-');
/**
 * About half unimodular (integer inverse), half with det ∈ {2, −2, 4} and a fractional inverse, so
 * "divide by det A" really changes the numbers.
 */
function invMatrix(rng: Rng, lo = -3, hi = 4): Mat {
  if (rng.next() < 0.5) return unimodular(rng, lo, hi);
  return until(() => randM(rng, 2, 2, lo, hi), (A) => { const D = det2(A); return [2, -2, 4].includes(D) && A.flat().filter((x) => x !== 0).length >= 3 && adj(A).flat().some((x) => x % D !== 0); }, [[4, 2], [1, 1]]);
}
const invSteps = (A: Mat) => {
  const D = det2(A);
  return [`det A = ${pn(A[0][0])}·${pn(A[1][1])} − ${pn(A[0][1])}·${pn(A[1][0])} = ${lab(fmt(D), 'determinant')}.`, `Swap the diagonal, negate the off-diagonal: ${ms(adj(A))}.`, `Divide every entry by ${lab(fmt(D), 'determinant')}: A⁻¹ = ${msS(invS(A))}.`];
};

function inverseTableStep(rng: Rng): AskStep {
  const A = invMatrix(rng); const I = inv2(A);
  const q = mkq(S(K10), 'inverse', {
    prompt: `The Undo Switch must reverse the warp A = ${ms(A)}. Build A⁻¹ (fractions like 1/2 are fine).`,
    expression: 'A⁻¹ = (1/det A)·[d −b; −c a]', answer: I[0][0], answerText: msS(invS(A)),
    hint: 'Find det A first. Then swap a and d, change the signs of b and c, and divide everything by det A.',
    steps: invSteps(A),
    visual: matV([[A, 'A']]),
  });
  return model(q, { kind: 'table', rows: [[null, null], [null, null]], label: 'A⁻¹', bracket: true }, [csvS(invS(A).flat())], 'Fill in all four entries of A⁻¹.');
}

function inversePickStep(rng: Rng): AskStep {
  const A = until(() => invMatrix(rng), (M) => M.flat().every((x) => x !== 0), [[4, 2], [1, 1]]); const D = det2(A);
  const swapOnly: Mat = [[A[1][1], A[0][1]], [A[1][0], A[0][0]]];
  const negOnly: Mat = [[A[0][0], -A[0][1]], [-A[1][0], A[1][1]]];
  const recip = A.map((r) => r.map((x) => fracStr(1, x)));
  const q = mkq(S(K10), 'inverse-probe', {
    prompt: `Volt's undo panel offers candidates for A⁻¹, where A = ${ms(A)}. Which panel is A⁻¹?`,
    expression: 'A⁻¹ = ?', answer: 0, answerText: msS(invS(A)),
    hint: 'An inverse is not the matrix of reciprocals. Swap, negate, divide by det A, and check that AA⁻¹ = I.',
    steps: invSteps(A),
  });
  // All panels as strings, so identical-looking panels dedupe. "Swap and negate only" (adj A) is the
  // forgot-to-divide mistake; it equals A⁻¹ only when det A = 1, so it is left out then.
  const opts = [matV([[invS(A)]]), ...(D !== 1 ? [matV([[strM(adj(A))]])] : []), matV([[recip]]), matV([[strM(negOnly)]]), matV([[strM(swapOnly)]])];
  return pickLettered(rng, q, opts);
}

function invertiblePickStep(rng: Rng): AskStep {
  const r = [rnz(rng, -3, 3), rnz(rng, -3, 3)]; const k = pick(rng, [2, -2, 3, -1]);
  const singular: Mat = rng.next() < 0.5 ? [r, scale(k, r)] : [[r[0], k * r[0]], [r[1], k * r[1]]];
  const zeroOk: Mat = until(() => { const M = randM(rng, 2, 2, -3, 4); M[rint(rng, 0, 1)][rint(rng, 0, 1)] = 0; return M; }, (M) => det2(M) !== 0, [[2, 0], [1, 3]]);
  const neg: Mat = until(() => randM(rng, 2, 2, -4, -1), (M) => det2(M) !== 0, [[-2, -1], [-1, -3]]);
  const other: Mat = until(() => randM(rng, 2, 2, 1, 5), (M) => det2(M) !== 0 && !eqM(M, zeroOk), [[4, 2], [3, 5]]);
  const all = [singular, zeroOk, neg, other];
  const q = mkq(S(K10), 'invertible', {
    prompt: 'Four actuator matrices. One can never be undone. Which has NO inverse?',
    expression: 'det A = 0 ⇔ no inverse', answer: 0, answerText: ms(singular),
    hint: 'Compute each determinant. A zero entry is harmless; a zero determinant is not.',
    steps: ['A matrix has an inverse exactly when det A ≠ 0.', ...all.map((M) => `det ${ms(M)} = ${fmt(det2(M))}`), `${ms(singular)} has det 0: its columns are parallel, so it squashes the plane.`],
  });
  return pickLettered(rng, q, all.map((M) => matV([[M]])));
}

function detFactorProblem(rng: Rng) {
  return until(() => randM(rng, 2, 2, -4, 5), (A) => [2, 3, 4, 5, -2, -3].includes(det2(A)) && A.flat().every((x) => x !== 0), [[3, 1], [1, 1]]);
}
function detFactorStep(rng: Rng): AskStep {
  const A = detFactorProblem(rng); const D = det2(A); const wrongDet = A[0][0] * A[1][1] + A[0][1] * A[1][0];
  const q = mkq(S(K10), 'det-factor', {
    prompt: `A = ${ms(A)}, and A⁻¹ = k·${ms(adj(A))}. What is k?`,
    expression: 'k = ?', answer: 1 / D, answerText: fracStr(1, D),
    hint: 'The swapped-and-negated matrix is det A times too big.',
    steps: [`det A = ${pn(A[0][0])}·${pn(A[1][1])} − ${pn(A[0][1])}·${pn(A[1][0])} = ${lab(fmt(D), 'determinant')}.`, `k = 1/det A = ${lab(fracStr(1, D), 'scale factor')}.`],
    visual: matV([[A, 'A']]),
  });
  return choose(rng, q, fracStr(1, D), [fmt(D), fracStr(-1, D), wrongDet ? fracStr(1, wrongDet) : '0', '1']);
}

function solveInverseProblem(rng: Rng) {
  return until(() => { const A = invMatrix(rng, -2, 4); const x = [rint(rng, -4, 4), rint(rng, -4, 4)]; return { A, x, b: mulv(A, x) }; }, (t) => fits(t.b, 12) && (t.x[0] !== 0 || t.x[1] !== 0), { A: [[2, 1], [1, 1]], x: [1, 2], b: [4, 3] });
}
function solveInverseStep(rng: Rng): AskStep {
  const { A, x, b } = solveInverseProblem(rng); const I = msS(invS(A));
  const q = mkq(S(K10), 'solve-inverse', {
    prompt: `An actuator applied A = ${ms(A)} and the arm ended at b = ${vs(b)}. Where did it start? Solve Ax = b with A⁻¹.`,
    expression: 'x = A⁻¹b', answer: x[0], answerText: vs(x),
    hint: 'Build A⁻¹ (swap, negate, divide by det), then multiply it by b.',
    steps: [...invSteps(A).slice(0, 1), `A⁻¹ = ${I}.`, `x = A⁻¹b = ${I}·${vs(b)} = ${vs(x)}.`, `Check: A·${vs(x)} = ${vs(b)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: `A = ${ms(A)}, b = ${vs(b)}`, layers: { points: fits(b) ? [{ x: b[0], y: b[1], label: 'b' }] : [] } }, [`${x[0]},${x[1]}`], 'Tap the starting point x.');
}

function checkInverseStep(rng: Rng): AskStep {
  // Skip involutions (A⁻¹ = A): there "B uses the same numbers as A" would be literally true.
  const A = until(() => invMatrix(rng), (M) => !eqM(inv2(M), M), [[2, 1], [1, 1]]); const good = rng.next() < 0.5;
  // The wrong B is "swap only"; when a = d that is A itself, so use "negate only" instead.
  const swapOnly: Mat = [[A[1][1], A[0][1]], [A[1][0], A[0][0]]];
  const B: Mat = good ? inv2(A) : !eqM(swapOnly, A) ? swapOnly : [[A[0][0], -A[0][1]], [-A[1][0], A[1][1]]];
  const P = mul(A, B).map((r) => r.map((x) => x + 0)); const isI = eqM(P, [[1, 0], [0, 1]]);
  const Bs = good ? invS(A) : strM(B);
  const right = isI ? 'Yes: AB = I' : 'No: AB ≠ I';
  const q = mkq(S(K10), 'check-inverse', {
    prompt: `Volt claims B = ${msS(Bs)} undoes A = ${ms(A)}. Is B = A⁻¹?`,
    expression: 'AB = I ?', answer: isI ? 1 : 0,
    hint: 'Multiply A by B. The inverse must give the identity [1 0; 0 1].',
    steps: ['B is A⁻¹ exactly when AB = I.', `AB = ${ms(P)}${isI ? ' = I.' : ', which is not I.'}`],
    visual: matV([[A, 'A'], [Bs, 'B']], ['×']),
  });
  return choose(rng, q, right, [isI ? 'No: AB ≠ I' : 'Yes: AB = I', 'Yes: B uses the same numbers as A', 'No: an inverse has fractions in it']);
}

function cipherStep(rng: Rng): AskStep {
  const K = until(() => unimodular(rng, 1, 4), (M) => det2(M) === 1, [[2, 1], [1, 1]]); const p = [rint(rng, 1, 9), rint(rng, 1, 9)]; const c = mulv(K, p); const which = rint(rng, 0, 1);
  const q = mkq(S(K10), 'cipher', {
    prompt: `Volt encrypts a pair of signal codes by multiplying by the key K = ${ms(K)}. The receiver gets ${vs(c)}. What was the ${which ? 'second' : 'first'} code?`,
    expression: 'p = K⁻¹c', answer: p[which],
    hint: 'Undo the key: multiply what arrived by K⁻¹.',
    steps: [`det K = 1, so K⁻¹ = ${ms(inv2(K))}.`, `p = K⁻¹·${vs(c)} = ${vs(p)}.`, `Check: K·${vs(p)} = ${vs(c)}.`],
    visual: matV([[K, 'key K'], [c.map((v) => [v]), 'received']]), app: 'The Hill cipher and many error-correcting codes decode with a matrix inverse.',
  });
  return typed(q);
}
function cameraStep(rng: Rng): AskStep {
  const { A, x, b } = solveInverseProblem(rng); const which = rint(rng, 0, 1);
  const q = mkq(S(K10), 'camera', {
    prompt: `A warped camera lens maps every point by A = ${ms(A)}. A rivet shows up at ${vs(b)} in the image. What is its true ${which ? 'y' : 'x'}-coordinate?`,
    expression: 'true point = A⁻¹·(image point)', answer: x[which], negative: true,
    hint: 'The image point is A times the true point. Undo A.',
    steps: [`det A = ${lab(fmt(det2(A)), 'determinant')}, so A⁻¹ = ${msS(invS(A))}.`, `A⁻¹·${vs(b)} = ${vs(x)}: the true rivet point.`],
    visual: matV([[A, 'lens A']]), app: 'Camera calibration undoes lens distortion with inverse maps.',
  });
  return typed(q);
}

const INVERSE: ChapterSpec = {
  key: K10, title: 'The Inverse of a 2 × 2', wing: 'vault', wingName: 'The Undo Switch',
  goal: 'Build A⁻¹ for a 2 × 2 by swapping, negating and dividing by det A; check AA⁻¹ = I; solve Ax = b as x = A⁻¹b; and know that det A = 0 means no inverse.',
  misconception: 'Inverting each entry (1/a, 1/b, …); swapping or negating but not both; forgetting to divide by det A; thinking a zero entry means no inverse.',
  teach: [
    { title: 'Undo the warp', text: 'A⁻¹ undoes A: A⁻¹A = AA⁻¹ = I, the identity [1 0; 0 1] that leaves every vector alone. Then Ax = b solves in one step: x = A⁻¹b.', steps: ['Row 1 of A · column 1 of A⁻¹: 2 × 1 + 1 × (−1) = 1', 'Row 1 · column 2: 2 × (−1) + 1 × 2 = 0', 'Row 2: 1 × 1 + 1 × (−1) = 0 and 1 × (−1) + 1 × 2 = 1', 'So AA⁻¹ = [1 0; 0 1] = I, as in the panel.', 'Solve Ax = (3, 2): x = A⁻¹b = (3 − 2, −3 + 4) = (1, 1)'], next: 'Use A⁻¹ to solve Ax = (5, 3).', visual: matV([[[[2, 1], [1, 1]], 'A'], [[[1, -1], [-1, 2]], 'A⁻¹'], [[[1, 0], [0, 1]], 'I']], ['×', '=']) },
    { title: 'Swap, negate, divide', text: '[a b; c d]⁻¹ = (1/(ad − bc))·[d −b; −c a]. Why? Multiply it out: [a b; c d]·[d −b; −c a] = (ad − bc)·I, so dividing by ad − bc leaves exactly I. It is NOT the matrix of reciprocals.', steps: ['A = [4 2; 1 1]: det = 4 × 1 − 2 × 1 = 2 (determinant)', 'Swap 4 and 1, negate 2 and 1: [1 −2; −1 4]', 'Divide by 2 (determinant): A⁻¹ = [1/2 −1; −1/2 2]', 'Check row 1 · column 1: 4 × 1/2 + 2 × (−1/2) = 2 − 1 = 1'], next: 'Invert [3 1; 5 2] the same way.', visual: card('A = [4 2; 1 1]', ['det = 4·1 − 2·1 = 2', 'swap, negate: [1 −2; −1 4]', 'divide by 2: A⁻¹ = [1/2 −1; −1/2 2]', 'check: [a b; c d]·[d −b; −c a] = (ad − bc)·I']) },
    { title: 'No inverse when det = 0', text: 'If det A = 0 the warp squashes the plane onto a line: many points land on the same spot, so nothing can undo it. A zero ENTRY is fine; a zero DETERMINANT is not.', steps: ['[2 0; 1 3]: det = 2 × 3 − 0 × 1 = 6 (determinant), invertible despite the 0 entry.', '[1 2; 2 4]: det = 1 × 4 − 2 × 2 = 0 (determinant)', '[1 2; 2 4] sends (2, 0) to (2, 4) and (0, 1) to (2, 4) too.', 'Landing on (2, 4), you cannot tell which point you started from.'], visual: matV([[[[2, 0], [1, 3]], 'det 6: invertible'], [[[1, 2], [2, 4]], 'det 0: no inverse']]) },
  ],
  quests: [
    { id: 'aq.linalg.inverse.undo-switch', name: 'The Undo Switch', giver: 'volt', guided: true,
      hook: 'Volt: "Every warp on the Grid needs an undo switch. Swap, negate, divide by the determinant, and prove it gives the identity."',
      change: 'Every warp panel now has a working undo switch, glowing teal beside it.',
      waves: [wave('Swap, negate, divide', times(3, inverseTableStep)), wave('Which inverse', times(2, inversePickStep)), wave('Divide by det', mixOf([detFactorStep, detFactorStep, checkInverseStep]))] },
    { id: 'aq.linalg.inverse.actuators', name: 'Stuck Actuators', giver: 'ada',
      hook: 'Ada: "The actuators moved the arms and nobody logged where they started. Run the warps backwards, but first find the one that can\'t be undone."',
      change: 'The robot arms return to their home positions; the stuck actuator is tagged for replacement.',
      waves: [wave('Invertible?', times(2, invertiblePickStep)), wave('Solve with A⁻¹', times(3, solveInverseStep)), wave('Check', mixOf([checkInverseStep, inverseTableStep, detFactorStep]))] },
  ],
  concept: conceptFrom([inverseTableStep, inversePickStep, invertiblePickStep, solveInverseStep]),
  transfer: oneOf([cipherStep, cameraStep]),
  practice: (rng) => { const A = invMatrix(rng); const I = inv2(A); const i = rint(rng, 0, 1); const j = rint(rng, 0, 1); return mkq(S(K10), 'inverse', { prompt: `A = ${ms(A)}. Find entry (${i + 1}, ${j + 1}) of A⁻¹.`, expression: `(A⁻¹)${sub(i + 1)}${sub(j + 1)} = ?`, answer: I[i][j], fraction: !Number.isInteger(I[i][j]), negative: true, hint: 'Swap the diagonal, negate the off-diagonal, divide by det A.', steps: invSteps(A) }); },
};

/* =====================================================================================
 * Chapter 11 · Independence, basis, rank, null space
 * ===================================================================================== */
const K11 = 'basis';

function independentStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 4);
  let vecs: Vec[] = []; let dep = true; let why = '';
  if (kind === 0) {
    vecs = until(() => [0, 1, 2].map(() => [rnz(rng, -3, 3), rnz(rng, -3, 3)]), (vs3) => vs3.every((a, i) => vs3.every((b, j) => i === j || a[0] * b[1] - a[1] * b[0] !== 0)), [[1, 0], [0, 1], [1, 1]]);
    why = 'Three vectors in R² are always dependent: the plane only has room for two independent directions.';
  } else if (kind === 1) {
    const u = [rnz(rng, -3, 3), rnz(rng, -3, 3)]; const k = pick(rng, [2, -1, 3, -2]); vecs = [u, scale(k, u)];
    why = `v₂ = ${fmt(k)}·v₁: one is a multiple of the other.`;
  } else if (kind === 2) {
    vecs = until(() => [0, 1].map(() => [rnz(rng, -3, 3), rnz(rng, -3, 3)]), (p) => p[0][0] * p[1][1] - p[0][1] * p[1][0] !== 0, [[1, 2], [2, 1]]); dep = false;
    why = `det [v₁ v₂] = ${fmt(vecs[0][0] * vecs[1][1] - vecs[0][1] * vecs[1][0])} ≠ 0: neither is a multiple of the other.`;
  } else if (kind === 3) {
    const v1 = [rint(rng, -2, 2), rint(rng, -2, 2), rnz(rng, -2, 2)]; const v2 = [rnz(rng, -2, 2), rint(rng, -2, 2), rint(rng, -2, 2)]; const a = rnz(rng, -2, 2); const b = rnz(rng, -2, 2);
    vecs = [v1, v2, add(scale(a, v1), scale(b, v2))];
    why = `v₃ = ${lin([a, b], ['v₁', 'v₂'])}: a passenger.`;
    if (det3(vecs) !== 0 || vecs[2].every((x) => x === 0)) { vecs = [[1, 0, 1], [0, 1, 1], [1, 1, 2]]; why = 'v₃ = v₁ + v₂: a passenger.'; }
  } else {
    vecs = until(() => [0, 1, 2].map(() => [rint(rng, -2, 2), rint(rng, -2, 2), rint(rng, -2, 2)]), (m) => det3(m) !== 0 && m.every((v) => v.filter((x) => x).length >= 1), [[1, 0, 1], [0, 1, 1], [1, 1, 0]]); dep = false;
    why = `det [v₁ v₂ v₃] = ${fmt(det3(vecs))} ≠ 0: no vector is a mix of the others.`;
  }
  const names = vecs.map((v, i) => `v${sub(i + 1)} = ${vs(v)}`);
  const q = mkq(S(K11), 'independent', {
    prompt: `Beacon census: ${names.join(', ')}. Independent, or is one a passenger?`,
    expression: 'c₁v₁ + c₂v₂ + … = 0 only for all c = 0?', answer: dep ? 1 : 0,
    hint: 'Could one vector be built from the others? Count too: how many independent directions fit in this space?',
    steps: [dep ? 'Dependent: some combination with not-all-zero weights gives 0.' : 'Independent: only the all-zero combination gives 0.', why],
    visual: card('The beacons', names),
  });
  const indep = 'Independent'; const depT = 'Dependent: one is a combination of the others';
  return choose(rng, q, dep ? depT : indep, [dep ? indep : depT, 'Dependent: only if one of them is the zero vector']);
}

function rankProblem(rng: Rng) {
  const kind = rint(rng, 0, 2);
  if (kind < 2) {
    const r = rint(rng, 1, 3); const cols = pick(rng, [3, 4]);
    const A: Mat = [0, 1, 2].map((i) => Array.from({ length: cols }, (_, j) => (i >= r ? 0 : j < i ? 0 : j === i ? rnz(rng, -3, 4) : rint(rng, -3, 4))));
    return { A, r, echelon: true };
  }
  const A = until(() => { const r1 = [rnz(rng, -2, 3), rint(rng, -2, 3), rint(rng, -2, 3)]; const r2 = [rint(rng, -2, 3), rnz(rng, -2, 3), rint(rng, -2, 3)]; return [r1, r2, add(r1, r2)]; },
    ([r1, r2]) => r1[0] * r2[1] - r1[1] * r2[0] !== 0 || r1[0] * r2[2] - r1[2] * r2[0] !== 0 || r1[1] * r2[2] - r1[2] * r2[1] !== 0, [[1, 0, 2], [0, 1, 1], [1, 1, 3]]);
  return { A, r: 2, echelon: false };
}
function rankStep(rng: Rng): AskStep {
  const { A, r, echelon } = rankProblem(rng);
  const nonzero = A.flat().filter((x) => x !== 0).length;
  const q = mkq(S(K11), 'rank', {
    prompt: echelon ? 'The ledger matrix is already in echelon form. What is its rank?' : 'Brick\'s ledger: row 3 looks suspicious. What is the rank of this matrix?',
    expression: `rank ${ms(A)}`, answer: r,
    hint: echelon ? 'Count pivots: the first nonzero entry of each nonzero row.' : 'Is one row a combination of the others? Rank counts independent rows (pivots after reduction).',
    steps: echelon ? [`Rank = number of pivots.`, r === 1 ? 'There is 1 nonzero row, so 1 pivot: rank 1.' : `There are ${r} nonzero rows, each with a pivot: rank ${r}.`] : ['Row 3 = row 1 + row 2, so R₃ → R₃ − R₁ − R₂ gives a zero row.', 'Two pivots remain: rank 2.'],
    visual: matV([[A, 'A']]),
  });
  return choose(rng, q, String(r), ['1', '2', '3', String(nonzero), String(A[0].length)]);
}

function rowComboStep(rng: Rng): AskStep {
  const p = rint(rng, -2, 3); const s0 = rint(rng, -3, 3); const qv = rint(rng, -2, 3); const t = rint(rng, -3, 3);
  const r1 = [1, 1, p, s0]; const r2 = [0, 1, qv, t]; const a = rnz(rng, -2, 2); const b = rnz(rng, -2, 2);
  const r3 = add(scale(a, r1), scale(b, r2)); const A: Mat = [r1, r2, r3];
  const q = mkq(S(K11), 'row-combo', {
    prompt: `Brick's ledger A = ${ms(A)}. Row 3 is a mix of rows 1 and 2: R₃ = a·R₁ + b·R₂. Find a and b.`,
    expression: 'R₃ = a·R₁ + b·R₂', answer: a, answerText: `a = ${fmt(a)}, b = ${fmt(b)}`,
    hint: 'Column 1 gives a directly (row 2 starts with 0). Column 2 then gives b.',
    steps: [`Column 1: a·1 + b·0 = ${fmt(r3[0])}, so a = ${fmt(a)}. Column 2: a + b = ${fmt(r3[1])}, so b = ${fmt(b)}.`, `Columns 3 and 4 check. R₃ → R₃ − (${lin([a, b], ['R₁', 'R₂'])}) leaves a zero row, so only 2 pivots: rank 2.`],
    visual: matV([[A, 'A']]),
  });
  return model(q, { kind: 'table', cols: ['a', 'b'], rows: [[null, null]], label: 'R₃ = a·R₁ + b·R₂' }, [csv([a, b])], 'Fill in the weights a and b.');
}

function nullityStep(rng: Rng): AskStep {
  const m = rint(rng, 2, 4); const n = rint(rng, m + 1, 6); const r = rint(rng, 1, m);
  const q = mkq(S(K11), 'nullity', {
    prompt: `Brick's ledger A is ${m} × ${n} with rank ${r}. What is the dimension of its null space (all x with Ax = 0)?`,
    expression: 'rank + nullity = number of columns', answer: n - r,
    hint: 'x has one entry per column. Each pivot pins down one variable; the rest are free.',
    steps: ['Rank + nullity = number of columns (the number of unknowns).', `Nullity = ${lab(n, 'columns')} − ${lab(r, 'rank')} = ${labn(n - r, 'free variable')}.`],
    visual: card('A', [`${m} rows × ${n} columns`, `rank ${r}`]),
  });
  return choose(rng, q, String(n - r), [String(m - r), String(r), String(n), '0']);
}

function nullProblem(rng: Rng) {
  const a = rnz(rng, -3, 3); const b = rnz(rng, -3, 3); const k = pick(rng, [2, -1, 3, -2, 1]);
  const A: Mat = rng.next() < 0.5 ? [[a, b], [k * a, k * b]] : [[a, k * a], [b, k * b]];
  const dir = A[0][0] || A[0][1] ? [-A[0][1], A[0][0]] : [-A[1][1], A[1][0]];
  const g = gcd(dir[0], dir[1]) * (dir[0] < 0 || (dir[0] === 0 && dir[1] < 0) ? -1 : 1);
  return { A, dir: [dir[0] / g + 0, dir[1] / g + 0] };
}
function nullVectorStep(rng: Rng): AskStep {
  const { A, dir } = nullProblem(rng);
  const q = mkq(S(K11), 'null-space', {
    prompt: `The squash warp A = ${ms(A)} sends a whole line of points to 0. Find one nonzero x with Ax = 0.`,
    expression: 'Ax = 0, x ≠ 0', answer: 0, answerText: `any multiple of ${vs(dir)}`,
    hint: 'Both rows give the same equation. Solve a·x + b·y = 0 with x and y not both zero.',
    steps: ['Row 2 is a multiple of row 1 (det A = 0), so there is one equation.', `${eqStr(A[0][0] || A[0][1] ? A[0] : A[1], XY, 0)} is solved by ${vs(dir)} and every multiple of it: the null space is that line.`],
    visual: matV([[A, 'A']]),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: `A = ${ms(A)}`, layers: {} }, multiples(dir), 'Tap any nonzero point x with Ax = 0.');
}

function depWeightsStep(rng: Rng): AskStep {
  const fam = rint(rng, 0, 1); const p = rnz(rng, -2, 2); const qv = rnz(rng, -2, 2);
  const v1 = fam ? [1, 0, p] : [1, 1, 0]; const v2 = fam ? [0, 1, qv] : [0, 1, 1];
  const a = rnz(rng, -3, 3); const b = rnz(rng, -3, 3); const v3 = add(scale(a, v1), scale(b, v2));
  const q = mkq(S(K11), 'dep-weights', {
    prompt: `Passenger found: v₃ = ${vs(v3)} is a mix of v₁ = ${vs(v1)} and v₂ = ${vs(v2)}. Find the weights.`,
    expression: 'v₃ = a·v₁ + b·v₂', answer: a, answerText: `a = ${fmt(a)}, b = ${fmt(b)}`,
    hint: 'Match components one at a time. Start with the component where only one of v₁, v₂ is nonzero.',
    steps: [`Components: ${[0, 1, 2].map((i) => `${lin([v1[i], v2[i]], ['a', 'b'])} = ${fmt(v3[i])}`).join(', ')}.`, `a = ${fmt(a)}, b = ${fmt(b)}; the third equation checks.`],
    visual: card('Vectors in R³', [`v₁ = ${vs(v1)}`, `v₂ = ${vs(v2)}`, `v₃ = ${vs(v3)}`]),
  });
  return model(q, { kind: 'table', cols: ['a', 'b'], rows: [[null, null]], label: `${vs(v3)} = a·${vs(v1)} + b·${vs(v2)}` }, [csv([a, b])], 'Fill in the weights a and b.');
}

function basisStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 4);
  const yes = 'Yes: independent, and they span'; const depT = 'No: they are dependent'; const few = 'No: too few vectors to span the space';
  let vecs: Vec[] = []; let space = 'R²'; let right = yes; let why = '';
  if (kind === 0) { vecs = until(() => [0, 1].map(() => [rnz(rng, -3, 3), rint(rng, -3, 3)]), (p) => p[0][0] * p[1][1] - p[0][1] * p[1][0] !== 0 && !(p[0][1] === 0 && p[1][0] === 0), [[2, 1], [1, 3]]); why = 'Two non-parallel vectors in R²: independent and spanning. (A basis need not be e₁, e₂.)'; }
  else if (kind === 1) { const u = [rnz(rng, -3, 3), rnz(rng, -3, 3)]; vecs = [u, scale(pick(rng, [2, -1, -2]), u)]; right = depT; why = 'They are parallel: only a line, and one is a multiple of the other.'; }
  else if (kind === 2) { vecs = [[1, 0], [0, 1], [rnz(rng, -3, 3), rnz(rng, -3, 3)]]; right = depT; why = 'Three vectors in R² are always dependent: a basis of R² has exactly 2.'; }
  else if (kind === 3) { space = 'R³'; vecs = until(() => [0, 1].map(() => [rint(rng, -2, 2), rint(rng, -2, 2), rint(rng, -2, 2)]), (p) => { const [a, b] = p; return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].some((x) => x !== 0); }, [[1, 0, 2], [0, 1, 1]]); right = few; why = 'Two independent vectors in R³ only span a plane: a basis of R³ needs 3.'; }
  else { space = 'R³'; vecs = until(() => [0, 1, 2].map(() => [rint(rng, -2, 2), rint(rng, -2, 2), rint(rng, -2, 2)]), (m) => det3(m) !== 0, [[1, 1, 0], [0, 1, 1], [1, 0, 1]]); why = `det = ${fmt(det3(vecs))} ≠ 0: three independent vectors in R³ form a basis.`; }
  const names = vecs.map((v, i) => `v${sub(i + 1)} = ${vs(v)}`);
  const q = mkq(S(K11), 'basis', {
    prompt: `Ada wants a survey frame for ${space}. Is {${names.join(', ')}} a basis of ${space}?`,
    expression: `basis of ${space}: independent + spanning`, answer: [yes, depT, few].indexOf(right),
    hint: `A basis of ${space} has exactly ${space === 'R²' ? 2 : 3} independent vectors.`,
    steps: ['A basis must be independent AND span the space; every basis of Rⁿ has exactly n vectors.', why],
    visual: card('Candidate basis', names),
  });
  return choose(rng, q, right, [yes, depT, few, 'No: a basis must be the standard e₁, e₂, …'].filter((x) => x !== right));
}

function trussFreeStep(rng: Rng): AskStep {
  const n = rint(rng, 4, 7); const r = rint(rng, 2, n - 1);
  const q = mkq(S(K11), 'truss', {
    prompt: `Newton's truss has ${n} unknown member forces. Its joint equations, written as Ax = b, have rank ${r}. How many forces can be chosen freely?`,
    expression: 'free variables = unknowns − rank', answer: n - r,
    hint: 'Each pivot fixes one unknown; the unknowns without a pivot are free.',
    steps: ['Rank + nullity = number of unknowns.', `Free forces = ${lab(n, 'unknown forces')} − ${lab(r, 'rank')} = ${labn(n - r, 'free force')}.`, 'Engineers call such a truss statically indeterminate.'],
    visual: card('Truss equations', [`${n} unknowns`, `rank ${r}`]), app: 'Structural engineers check rank to know if a truss is statically determinate.',
  });
  return typed(q);
}
function sensorRankStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3]);
  const base = until(() => Array.from({ length: k }, () => [rint(rng, -2, 3), rint(rng, -2, 3), rint(rng, -2, 3)]), (B) => {
    if (k === 3) return det3(B) !== 0;
    const [a, b] = B; return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].some((x) => x !== 0);
  }, k === 3 ? [[1, 0, 2], [0, 1, 1], [2, 1, 0]] : [[1, 0, 2], [0, 1, 1]]);
  const [i, j] = rng.shuffle(Array.from({ length: k }, (_, t) => t)).slice(0, 2); const l = rint(rng, 0, k - 1); const mult = pick(rng, [2, -1, 3, -2]);
  const cols = [...base, add(base[i], base[j]), scale(mult, base[l])];
  const order = rng.shuffle(cols.map((_, t) => t)); // order[c] = which column sits in channel c + 1
  const name = (t: number) => `c${sub(order.indexOf(t) + 1)}`;
  const D: Mat = [0, 1, 2].map((r) => order.map((t) => cols[t][r]));
  const q = mkq(S(K11), 'sensors', {
    prompt: `Volt's logger records ${cols.length} channels (the columns) over 3 readings. Some channels may repeat information. What is the rank of the data?`,
    expression: 'rank = number of independent columns', answer: k,
    hint: 'Look for a column that is a multiple of another, or the sum of two others. It adds no new direction.',
    steps: [`${name(k)} = ${name(i)} + ${name(j)} and ${name(k + 1)} = ${coefTerm(mult, name(l))}: both are combinations of other channels.`, `The remaining ${k} channels are independent${k === 3 ? ` (det = ${fmt(det3(base))} ≠ 0)` : ' (not multiples of each other)'}, so the rank is ${k}.`],
    visual: matV([[D, 'readings × channels']]), app: 'Data engineers find the rank of sensor data to drop redundant channels.',
  });
  return typed(q);
}

/** Which set of points is a subspace? Distractors each fail one closure test. */
function subspaceStep(rng: Rng): AskStep {
  const m = pick(rng, [2, -2, 3, -3, -1]); const c = rnz(rng, -3, 3);
  const right = `{(x, y) : y = ${coefTerm(m, 'x')}}`;
  const fails = rng.shuffle<[string, string]>([
    [`{(x, y) : y = ${coefTerm(m, 'x')} ${c < 0 ? '−' : '+'} ${Math.abs(c)}}`, `y = ${coefTerm(m, 'x')} ${c < 0 ? '−' : '+'} ${Math.abs(c)} misses (0, 0), so it cannot be a subspace.`],
    ['{(x, y) : x ≥ 0 and y ≥ 0}', 'The quadrant holds (1, 1) but not −1·(1, 1) = (−1, −1): not closed under scaling.'],
    ['{(x, y) : xy = 0}', 'The two axes hold (1, 0) and (0, 1) but not their sum (1, 1): not closed under addition.'],
    ['{(x, y) : x² + y² ≤ 1}', 'The disk holds (1, 0) but not 2·(1, 0) = (2, 0): not closed under scaling.'],
  ]).slice(0, 3);
  const q = mkq(S(K11), 'subspace', {
    prompt: 'Vector needs a set of beacon positions in R² that is a subspace. Which set qualifies?',
    expression: 'subspace: holds 0, closed under + and scaling', answer: 0,
    hint: 'Test each set: is (0, 0) in it? Does adding two members stay inside? Does scaling by any number, even −1, stay inside?',
    steps: ['A subspace contains 0 and is closed under adding vectors and multiplying by any scalar.', `${right} is a line through the origin: sums and multiples of points on it stay on it.`, ...fails.map((f) => f[1])],
  });
  return choose(rng, q, right, fails.map((f) => f[0]));
}

/** dim span{…}: count independent directions, not vectors. */
function dimSpanStep(rng: Rng): AskStep {
  const n = pick(rng, [3, 4]); const parallel = rng.next() < 0.35;
  const indep = (a: Vec, b: Vec) => a.some((_, r) => a.some((__, t) => a[r] * b[t] - a[t] * b[r] !== 0));
  const { v1, v2 } = until(() => ({ v1: Array.from({ length: n }, () => rint(rng, -2, 2)), v2: Array.from({ length: n }, () => rint(rng, -2, 2)) }), (t) => indep(t.v1, t.v2), { v1: n === 3 ? [1, 0, 2] : [1, 0, 2, 1], v2: n === 3 ? [0, 1, 1] : [0, 1, 1, -1] });
  const a = rnz(rng, -2, 2); const b = rnz(rng, -2, 2); const k = pick(rng, [2, -1, 3, -2]);
  const vecs = parallel ? [v1, scale(k, v1)] : [v1, v2, add(scale(a, v1), scale(b, v2))];
  const dim = parallel ? 1 : 2; const space = n === 3 ? 'R³' : 'R⁴';
  const names = vecs.map((v, i) => `v${sub(i + 1)} = ${vs(v)}`);
  const q = mkq(S(K11), 'dim-span', {
    prompt: `Beacon array in ${space}: ${names.join(', ')}. What is the dimension of their span?`,
    expression: `dim span{${vecs.map((_, i) => `v${sub(i + 1)}`).join(', ')}} = ?`, answer: dim,
    hint: 'Throw out passengers (vectors that are mixes of the others), then count what is left.',
    steps: ['The dimension of a span is the size of a basis for it: the number of independent vectors, not the number listed.', parallel ? `v₂ = ${fmt(k)}·v₁, so both lie on one line through the origin: dimension 1.` : `v₃ = ${lin([a, b], ['v₁', 'v₂'])} is a passenger. v₁ and v₂ are not parallel, so they are a basis of the span: a plane in ${space}, dimension 2.`],
    visual: card(`Beacons in ${space}`, names),
  });
  return choose(rng, q, String(dim), [String(vecs.length), String(n), String(dim === 1 ? 0 : 1)]);
}

/** The null space always contains 0; for an invertible warp that is all it contains. */
function nullSpaceKindStep(rng: Rng): AskStep {
  const singular = rng.next() < 0.4;
  const A = singular ? nullProblem(rng).A : invertible2(rng, -3, 3); const D = det2(A);
  const zero = 'only the zero vector (0, 0)'; const line = 'a line through the origin';
  const empty = 'it is empty: no x gives Ax = 0'; const all = 'all of R²';
  const right = singular ? line : zero;
  const q = mkq(S(K11), 'null-kind', {
    prompt: `Vector tests the warp A = ${ms(A)} for directions it sends to 0. What is its null space?`,
    expression: 'null space = {x : Ax = 0}', answer: singular ? 1 : 0,
    hint: 'A·(0, 0) = (0, 0) for every matrix. Then ask: does det A say A squashes the plane?',
    steps: ['The null space is never empty: A·0 = 0 for every A, so 0 is always in it.', singular ? `det A = 0: the columns are parallel and A squashes the plane onto a line, so a whole line of x goes to 0.` : `det A = ${fmt(D)} ≠ 0: A squashes nothing, so Ax = 0 only for x = 0.`],
    visual: matV([[A, 'A']]),
  });
  return choose(rng, q, right, singular ? [zero, empty, all] : [empty, line, all]);
}

const BASIS: ChapterSpec = {
  key: K11, title: 'Independence, Basis & Rank', wing: 'core', wingName: 'Beacon Census Hall',
  goal: 'Tell which sets are subspaces, decide whether vectors are independent, test a basis, find the dimension of a span, count rank as pivots, and find the null space of a matrix.',
  misconception: 'Calling any line or region a subspace, even one that misses the origin or is not closed; thinking three vectors in R² can be independent if none are parallel; counting vectors instead of independent directions for a dimension; reading rank as the number of rows or nonzero entries; forgetting the null space always contains 0.',
  teach: [
    { title: 'Independent means no passengers', text: 'Vectors are independent when none is a mix of the others: the only way to get c₁v₁ + c₂v₂ + … = 0 is all c = 0. Three vectors in R² can never be independent: the plane only has room for two directions.', steps: ['v₁ + v₂ = (2 + (−1), 1 + 2) = (1, 3), which is v₃.', 'So 1·v₁ + 1·v₂ − 1·v₃ = 0 with weights that are not all 0: dependent.', 'v₁ and v₂ alone: det [2 −1; 1 2] = 2 × 2 − (−1) × 1 = 5 (determinant), not 0, so independent.'], next: 'Is {v₁, (4, 2)} independent? Look for a multiple.', visual: plotV({ vectors: [{ x: 2, y: 1, label: 'v₁' }, { x: -1, y: 2, label: 'v₂', color: 'teal' }, { x: 1, y: 3, label: 'v₃ = v₁ + v₂', color: 'ask' }] }) },
    { title: 'Subspaces, basis and dimension', text: 'A subspace is a set of vectors that contains 0 and is closed under adding and scaling: in R² that is {0}, a line through the origin, or the whole plane. A basis spans it with no passengers, and the number of basis vectors is its dimension. Any two non-parallel arrows are a basis of R², not just e₁ and e₂.', steps: ['y = 2x at x = 0: y = 2 × 0 = 0, so the line holds 0.', 'y = 2x + 1 at x = 0: y = 2 × 0 + 1 = 1, so it misses 0.', 'Closed: (1, 2) + (3, 6) = (4, 8), still on y = 2x.', '(2, 1) and (1, 3): det = 2 × 3 − 1 × 1 = 5 (determinant), not 0, so they are a basis of R².'], visual: card('Subspaces of R²', ['y = 2x: a subspace, dimension 1', 'y = 2x + 1: misses 0, not a subspace', 'basis of R²: {(2, 1), (1, 3)}, dimension 2']) },
    { title: 'Rank and null space', text: 'Rank = number of pivots = the dimension of the column space (all outputs Ax). The null space is every x with Ax = 0; it always contains 0. Rank + nullity = number of columns.', steps: ['Pivots: the 1 in column 1 and the 1 in column 3, so rank 2.', 'Columns 2 and 4 have no pivot: x₂ and x₄ are free.', '2 (pivots) + 2 (free columns) = 4 (columns), so nullity = 4 − 2 = 2 (nullity).', 'Set x₂ = 1, x₄ = 0: x = (−2, 1, 0, 0), and row 1 gives 1 × (−2) + 2 × 1 = 0.'], next: 'Find the second null vector: set x₂ = 0 and x₄ = 1.', visual: matV([[[[1, 2, 0, 3], [0, 0, 1, -1], [0, 0, 0, 0]], 'rank 2, nullity 4 − 2 = 2']]) },
  ],
  quests: [
    { id: 'aq.linalg.basis.census', name: 'Beacon Census', giver: 'vector', guided: true,
      hook: 'Vector: "Some beacons are passengers: they point where others already reach. Find them, and find the directions that the squash warps send to zero."',
      change: 'Passenger beacons dim; the Grid runs on a clean basis.',
      waves: [wave('Passengers?', times(3, independentStep)), wave('Find the weights', times(2, depWeightsStep)), wave('Sent to zero', mixOf([nullVectorStep, nullSpaceKindStep, nullVectorStep]))] },
    { id: 'aq.linalg.basis.ledger', name: 'The Rank Ledger', giver: 'brick',
      hook: 'Brick: "My ledgers have more rows than real information. Count the pivots and tell me how much is actually there."',
      change: 'The ledgers shrink to their true rank; Brick finally sees what is free and what is fixed.',
      waves: [wave('Count pivots', mixOf([rankStep, rowComboStep, rankStep])), wave('Rank + nullity', times(2, nullityStep)), wave('Subspace, basis, dimension', mixOf([subspaceStep, basisStep, dimSpanStep, nullVectorStep]))] },
  ],
  concept: conceptFrom([nullVectorStep, depWeightsStep, independentStep, basisStep, subspaceStep, dimSpanStep]),
  transfer: oneOf([trussFreeStep, sensorRankStep]),
  practice: (rng) => nullityStep(rng).question,
};

/* =====================================================================================
 * Chapter 12 · Eigenvalues & eigenvectors
 * ===================================================================================== */
const K12 = 'eigen';

function eigProblem(rng: Rng) {
  return until(() => {
    const l1 = rint(rng, -3, 5); const l2 = rint(rng, -3, 5); const a = rint(rng, -3, 6); const d = l1 + l2 - a; const N = a * d - l1 * l2;
    const divs = Array.from({ length: 13 }, (_, i) => i - 6).filter((x) => x !== 0 && N % x === 0 && Math.abs(N / x) <= 6);
    const b = divs.length ? pick(rng, divs) : 0; const c = b ? N / b : 0;
    return { A: [[a, b], [c, d]] as Mat, lo: Math.min(l1, l2), hi: Math.max(l1, l2) };
  }, (t) => t.lo !== t.hi && t.A[0][1] !== 0 && t.A[1][0] !== 0 && Math.abs(t.A[1][1]) <= 6, { A: [[2, 1], [1, 2]], lo: 1, hi: 3 });
}
/** A reduced eigenvector for eigenvalue lam of a 2 × 2 A (b ≠ 0 guaranteed by eigProblem). */
function eigVec(A: Mat, lam: number): Vec { const v = [-A[0][1], A[0][0] - lam]; const g = gcd(v[0], v[1]); const s = v[0] < 0 || (v[0] === 0 && v[1] < 0) ? -1 : 1; return [(s * v[0]) / g + 0, (s * v[1]) / g + 0]; }
const charCoef = (A: Mat) => [det2(A), -(A[0][0] + A[1][1]), 1];
const lamPoly = (c: number[]) => polyStr(c, 'λ');
const minusLam = (a: number) => (a === 0 ? '−λ' : `${fmt(a)} − λ`);

function isEigenStep(rng: Rng): AskStep {
  const { A, lo, hi } = eigProblem(rng); const lam = pick(rng, [lo, hi]); const e = eigVec(A, lam); const yes = rng.next() < 0.55;
  const v = yes ? e : until(() => [rnz(rng, -3, 3), rint(rng, -3, 3)], (w) => w[0] * e[1] - w[1] * e[0] !== 0 && w[0] * eigVec(A, lam === lo ? hi : lo)[1] - w[1] * eigVec(A, lam === lo ? hi : lo)[0] !== 0, [1, 0]);
  const Av = mulv(A, v);
  const no = 'No: Av is not a multiple of v';
  const q = mkq(S(K12), 'is-eigen', {
    prompt: `Does the warp A = ${ms(A)} keep the beacon v = ${vs(v)} on its own line?`,
    expression: 'Av = λv ?', answer: yes ? lam : 0,
    hint: 'Compute Av, then compare it with v component by component.',
    steps: [`Av = ${vs(Av)}.`, yes ? `${vs(Av)} = ${fmt(lam)}·${vs(v)}, so v is an eigenvector with λ = ${lab(fmt(lam), 'eigenvalue')}.` : `${vs(Av)} is not a single number times ${vs(v)}: v is knocked off its line.`],
    visual: matV([[A, 'A'], [v.map((x) => [x]), 'v']], ['·']),
  });
  const ratio = v[0] ? Av[0] / v[0] : Av[1] / (v[1] || 1);
  const fakeLam = Number.isInteger(ratio) && ratio !== lam ? ratio : lam + 1;
  const yesT = (k: number) => `Yes, with λ = ${fmt(k)}`;
  return yes ? choose(rng, q, yesT(lam), [yesT(A[0][0]), yesT(lam + 1), no, yesT(-lam), yesT(A[1][1]), yesT(lam - 1)])
    : choose(rng, q, no, [yesT(fakeLam), yesT(A[0][0]), yesT(A[1][1]), yesT(fakeLam + 1), yesT(lam)]);
}

function charPolyStep(rng: Rng): AskStep {
  const { A } = eigProblem(rng); const [[a, b], [c, d]] = A; const T = a + d; const D = det2(A);
  const q = mkq(S(K12), 'char-poly', {
    prompt: 'Find the characteristic polynomial det(A − λI) of this resonance matrix.',
    expression: `A = ${ms(A)}`, answer: D, answerText: lamPoly(charCoef(A)),
    hint: 'Subtract λ from the diagonal entries only, then take ad − bc of what is left.',
    steps: [`A − λI = [${minusLam(a)}, ${fmt(b)}; ${fmt(c)}, ${minusLam(d)}]: λI only has λ on the diagonal, so b and c stay.`, `det(A − λI) = λ² − (trace)λ + det A, with trace = ${fmt(a)} + ${pn(d)} = ${lab(fmt(T), 'trace')} and det A = ${pn(a)}·${pn(d)} − ${pn(b)}·${pn(c)} = ${lab(fmt(D), 'determinant')}.`, `So det(A − λI) = ${lamPoly(charCoef(A))}.`, `Subtracting λ from all four entries would cancel the λ² and leave ${lamPoly([D, -(a + d - b - c)])}: not the characteristic polynomial.`],
    visual: matV([[A, 'A']]),
  });
  // First distractor: λ taken off every entry, det [a−λ b−λ; c−λ d−λ] = (ad − bc) − (a + d − b − c)λ.
  return choose(rng, q, lamPoly(charCoef(A)), [lamPoly([D, -(a + d - b - c)]), lamPoly([D, T, 1]), lamPoly([a * d + b * c, -T, 1]), lamPoly([a * d, -T, 1]), lamPoly([D - T, -T, 1])]);
}

/** Build A − λI: λ comes off the diagonal only. */
function aMinusLamStep(rng: Rng): AskStep {
  const { A, lo, hi } = eigProblem(rng); const lam = until(() => pick(rng, [lo, hi]), (x) => x !== 0, hi || lo);
  const M: Mat = [[A[0][0] - lam, A[0][1]], [A[1][0], A[1][1] - lam]];
  const lamI = lam < 0 ? `A + ${fmt(-lam)}I` : `A − ${fmt(lam)}I`;
  const q = mkq(S(K12), 'a-minus-lam', {
    prompt: `Newton tests λ = ${fmt(lam)} on the resonance matrix A = ${ms(A)}. Build A − λI.`,
    expression: `${lamI} = ?`, answer: M[0][0], answerText: ms(M),
    hint: 'I has 1s on the diagonal and 0s elsewhere. Which entries does λI actually touch?',
    steps: [`λI = ${ms([[lam, 0], [0, lam]])}: λ on the diagonal, 0 off it.`, `A − λI = ${ms(M)}: the off-diagonal entries ${fmt(A[0][1])} and ${fmt(A[1][0])} stay as they are.`, `det(A − λI) = ${pn(M[0][0])}·${pn(M[1][1])} − ${pn(M[0][1])}·${pn(M[1][0])} = ${lab(fmt(det2(M)), 'determinant')}, so λ = ${lab(fmt(lam), 'eigenvalue')}.`],
  });
  return model(q, { kind: 'table', rows: [[null, null], [null, null]], label: lamI, bracket: true }, [csv(M.flat())], 'Fill in all four entries of A − λI.');
}

/** Tap where Av lands; the dashed line through v shows whether it stayed on its line. */
function avLandStep(rng: Rng): AskStep {
  const yes = rng.next() < 0.5;
  const { A, v, Av, lam } = until(() => {
    const { A, lo, hi } = eigProblem(rng); const lam = pick(rng, [lo, hi]); const e = eigVec(A, lam); const other = eigVec(A, lam === lo ? hi : lo);
    const v = yes ? e : until(() => [rnz(rng, -3, 3), rint(rng, -3, 3)], (w) => w[0] * e[1] - w[1] * e[0] !== 0 && w[0] * other[1] - w[1] * other[0] !== 0, [1, 0]);
    return { A, v, Av: mulv(A, v), lam };
  }, (t) => fits(t.v, 6) && fits(t.Av, 6) && t.Av.some((x) => x !== 0) && (yes || t.Av[0] * t.v[1] - t.Av[1] * t.v[0] !== 0), yes ? { A: [[2, 1], [1, 2]], v: [1, 1], Av: [3, 3], lam: 3 } : { A: [[2, 1], [1, 2]], v: [1, 0], Av: [2, 1], lam: 3 });
  const t = Math.floor(6 / Math.max(Math.abs(v[0]), Math.abs(v[1])));
  const layers: PlotLayers = { segments: [{ a: [-t * v[0], -t * v[1]], b: [t * v[0], t * v[1]], dashed: true, color: 'muted' }], vectors: [{ x: v[0], y: v[1], label: 'v', color: 'teal' }] };
  const q = mkq(S(K12), 'av-land', {
    prompt: `Warp A = ${ms(A)}, beacon v = ${vs(v)}; the dashed line is v's own line. Where does Av land?`,
    expression: 'Av = ?', answer: Av[0], answerText: vs(Av),
    hint: 'A·v = x·(column 1) + y·(column 2). Then look: is the tip still on the dashed line?',
    steps: [`Av = ${fmt(v[0])}·${vs(col(A, 0))} + ${pn(v[1])}·${vs(col(A, 1))} = ${vs(Av)}.`, yes ? `${vs(Av)} = ${fmt(lam)}·${vs(v)}: it stayed on the dashed line, so v is an eigenvector with λ = ${lab(fmt(lam), 'eigenvalue')}.` : `${vs(Av)} is off the dashed line: A knocked v off its line, so v is not an eigenvector.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: `A = ${ms(A)}; dashed: the line of v`, layers }, [`${Av[0]},${Av[1]}`], 'Tap where Av lands, then check whether it stayed on the dashed line.');
}

const eigSteps = (A: Mat, lo: number, hi: number) => [`det(A − λI) = ${lamPoly(charCoef(A))} = 0.`, `Factor: (λ ${lo < 0 ? '+' : '−'} ${Math.abs(lo)})(λ ${hi < 0 ? '+' : '−'} ${Math.abs(hi)}) = 0.`.replace('(λ − 0)', 'λ').replace('(λ + 0)', 'λ'), `λ = ${lab(fmt(lo), 'eigenvalue')} and λ = ${lab(fmt(hi), 'eigenvalue')}.`, `Check: ${fmt(lo)} + ${pn(hi)} = ${lab(fmt(lo + hi), 'trace')} and ${pn(lo)} × ${pn(hi)} = ${lab(fmt(lo * hi), 'determinant')}.`];
function eigenvaluesTableStep(rng: Rng): AskStep {
  const { A, lo, hi } = eigProblem(rng); const T = A[0][0] + A[1][1]; const D = det2(A);
  const q = mkq(S(K12), 'eigenvalues', {
    prompt: `The vibration matrix is A = ${ms(A)}. Build λ² − (trace)λ + det = 0, then solve it for both eigenvalues.`,
    expression: 'λ² − (a + d)λ + (ad − bc) = 0', answer: hi, answerText: `trace ${fmt(T)}, det ${fmt(D)}; λ = ${fmt(lo)} and ${fmt(hi)}`,
    hint: 'trace = a + d (diagonal only), det = ad − bc. Then factor the quadratic.',
    steps: [`trace = ${fmt(A[0][0])} + ${pn(A[1][1])} = ${lab(fmt(T), 'trace')}; det = ${pn(A[0][0])}·${pn(A[1][1])} − ${pn(A[0][1])}·${pn(A[1][0])} = ${lab(fmt(D), 'determinant')}.`, ...eigSteps(A, lo, hi)],
  });
  return model(q, { kind: 'table', rowLabels: ['trace a + d', 'det ad − bc', 'smaller λ', 'larger λ'], rows: [[null], [null], [null], [null]], label: `A = ${ms(A)}` }, [csv([T, D, lo, hi])], 'Fill in the trace and det, then both eigenvalues (smaller first).');
}

function eigChooseStep(rng: Rng): AskStep {
  const { A, lo, hi } = eigProblem(rng); const pair = (x: number, y: number) => `${fmt(Math.min(x, y))} and ${fmt(Math.max(x, y))}`;
  const q = mkq(S(K12), 'eigen-probe', {
    prompt: 'Newton reads the eigenvalues of this resonance matrix. Which pair is right?',
    expression: `A = ${ms(A)}`, answer: hi, answerText: pair(lo, hi),
    hint: 'The diagonal entries are the eigenvalues only for a triangular matrix. Use det(A − λI) = 0.',
    steps: eigSteps(A, lo, hi),
    visual: matV([[A, 'A']]),
  });
  return choose(rng, q, pair(lo, hi), [pair(A[0][0], A[1][1]), pair(-lo, -hi), pair(lo, -hi), pair(lo + 1, hi + 1)]);
}

function eigenvectorStep(rng: Rng): AskStep {
  const { A, lo, hi } = until(() => eigProblem(rng), (t) => fits(eigVec(t.A, t.lo), 6) && fits(eigVec(t.A, t.hi), 6), { A: [[2, 1], [1, 2]], lo: 1, hi: 3 });
  const lam = lo === 0 ? hi : hi === 0 ? lo : pick(rng, [lo, hi]); const e = eigVec(A, lam); const M = [[A[0][0] - lam, A[0][1]], [A[1][0], A[1][1] - lam]];
  const q = mkq(S(K12), 'eigenvector', {
    prompt: `A = ${ms(A)} has eigenvalue λ = ${fmt(lam)}. Find an eigenvector: a mode that A only stretches.`,
    expression: '(A − λI)v = 0, v ≠ 0', answer: 0, answerText: `any nonzero multiple of ${vs(e)}`,
    hint: 'Subtract λ on the diagonal. The two rows of A − λI are multiples, so solve one of them.',
    steps: [`A − λI = ${ms(M)}.`, `${eqStr(M[0], XY, 0)} gives v = ${vs(e)} (or any nonzero multiple).`, `Check: A·${vs(e)} = ${vs(mulv(A, e))} = ${fmt(lam)}·${vs(e)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: `A = ${ms(A)}, λ = ${fmt(lam)}`, layers: {} }, multiples(e), 'Tap the tip of a nonzero eigenvector v.');
}

function powerStep(rng: Rng): AskStep {
  const lam = pick(rng, [2, -2, 3, -1]); const n = lam === 3 ? 2 : Math.abs(lam) === 2 ? 3 : pick(rng, [2, 3]); const v = [rnz(rng, -2, 2), rnz(rng, -2, 2)];
  const w = scale(lam ** n, v);
  const q = mkq(S(K12), 'power', {
    prompt: `v = ${vs(v)} is an eigenvector of the warp A with λ = ${fmt(lam)}. The warp runs ${n} times. Where does v end up?`,
    expression: `A${n === 2 ? '²' : '³'}v = ?`, answer: w[0], answerText: vs(w),
    hint: 'Each pass just multiplies an eigenvector by λ.',
    steps: [`Av = λv, so A${n === 2 ? '²' : '³'}v = λ${n === 2 ? '²' : '³'}v.`, `${pn(lam)}${n === 2 ? '²' : '³'} = ${lab(fmt(lam ** n), 'total stretch')}, so A${n === 2 ? '²' : '³'}v = ${vs(w)}.`],
    visual: card('Eigenvector', [`v = ${vs(v)}`, `λ = ${fmt(lam)}`, `${n} passes`]),
  });
  return choose(rng, q, vs(w), [vs(scale(n * lam, v)), vs(scale(lam, v)), vs(scale(lam ** n, [v[0], 0]).map((x, i) => (i ? v[1] : x)))]);
}

const MARKOV: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 2], [2, 1], [1, 1], [3, 1], [4, 1]];
function markovStep(rng: Rng): AskStep {
  const [pt, qt] = pick(rng, MARKOV); const p = pt / 10; const qq = qt / 10;
  const ans = qt / (pt + qt);
  const q = mkq(S(K12), 'markov', {
    prompt: `Each day a pump that is running breaks down with probability ${fmt(p)}; a pump that is down gets repaired with probability ${fmt(qq)}. In the long run, what fraction of days is it running? Give it as a fraction.`,
    expression: `P = ${ms([[1 - p, qq], [p, 1 - qq]])}, Px = x`, answer: ans, answerText: fracStr(qt, pt + qt), fraction: true,
    hint: 'The steady state is the eigenvector with λ = 1: the flow running → down must equal the flow down → running.',
    steps: ['Steady state: Px = x, the eigenvector of P for λ = 1.', `Let x = fraction of days running. Balance: ${lab(fmt(p), 'breakdown chance')}·x = ${lab(fmt(qq), 'repair chance')}·(1 − x).`, `x = ${fmt(qq)}/(${fmt(p)} + ${fmt(qq)}) = ${lab(fracStr(qt, pt + qt), 'fraction of days running')}.`],
    visual: matV([[[[fmt(1 - p), fmt(qq)], [fmt(p), fmt(1 - qq)]], 'P (columns: from running, from down)']]),
    app: 'Reliability engineers and search engines find steady states as eigenvectors with λ = 1.',
  });
  return typed(q);
}
function markovTableStep(rng: Rng): AskStep {
  const [pt, qt] = pick(rng, MARKOV); const p = pt / 10; const qq = qt / 10; const T = pt + qt;
  const q = mkq(S(K12), 'steady-state', {
    prompt: `Brick's ore carts shuttle between two depots. Each day ${pt * 10}% of the carts at A roll to B and ${qt * 10}% of those at B roll to A. Fill in the long-run shares.`,
    expression: `P = ${ms([[1 - p, qq], [p, 1 - qq]])}, Px = x`, answer: qt / T, answerText: `(${fracStr(qt, T)}, ${fracStr(pt, T)})`,
    hint: 'The steady state x is the eigenvector of P with λ = 1, scaled so the shares add to 1. In it, the daily flow A → B equals the flow B → A.',
    steps: ['Steady state: Px = x, the eigenvector of P for λ = 1, with shares adding to 1.', `${pt * 10}% is ${lab(fmt(p), 'share leaving A daily')}; ${qt * 10}% is ${lab(fmt(qq), 'share leaving B daily')}.`, `Let x = share at A. Balance the flows: ${fmt(p)}·x = ${fmt(qq)}·(1 − x).`, `x = ${fmt(qq)}/(${fmt(p)} + ${fmt(qq)}) = ${lab(fracStr(qt, T), 'long-run share at A')}, so B holds 1 − x = ${lab(fracStr(pt, T), 'long-run share at B')}.`],
    app: 'Logistics planners find long-run fleet balance as the λ = 1 eigenvector.',
  });
  return model(q, { kind: 'table', rowLabels: ['share at A', 'share at B'], rows: [[null], [null]], label: `P = ${ms([[1 - p, qq], [p, 1 - qq]])} (columns: from A, from B)` }, [csvS([fracStr(qt, T), fracStr(pt, T)])], 'Fill in the steady-state shares as fractions.');
}

function vibrationStep(rng: Rng): AskStep {
  const k = rint(rng, 1, 4); const askSlow = rng.next() < 0.5;
  const together = '(1, 1): the carriages move together'; const opposite = '(1, −1): the carriages move in opposite directions';
  const q = mkq(S(K12), 'vibration', {
    prompt: `Two carriages joined by springs obey x″ = Ax with A = ${ms([[-2 * k, k], [k, -2 * k]])}. Which mode shape has eigenvalue ${fmt(askSlow ? -k : -3 * k)}?`,
    expression: 'Av = λv', answer: askSlow ? -k : -3 * k, answerText: askSlow ? together : opposite,
    hint: 'Multiply A by (1, 1) and by (1, −1) and see which comes out as the given λ times itself.',
    steps: [`A·(1, 1) = ${vs([-k, -k])} = ${fmt(-k)}·(1, 1).`, `A·(1, −1) = ${vs([-3 * k, 3 * k])} = ${fmt(-3 * k)}·(1, −1).`, `So λ = ${fmt(askSlow ? -k : -3 * k)} belongs to ${askSlow ? together : opposite}.`],
    visual: matV([[[[-2 * k, k], [k, -2 * k]], 'A']]), app: 'Structural and mechanical engineers design around vibration mode shapes: eigenvectors.',
  });
  return choose(rng, q, askSlow ? together : opposite, [askSlow ? opposite : together, '(1, 0): only the first carriage moves', '(0, 1): only the second carriage moves']);
}

const EIGEN: ChapterSpec = {
  key: K12, title: 'Eigenvalues & Eigenvectors', wing: 'core', wingName: 'The Eigen Core',
  goal: 'Test Av = λv, write det(A − λI) = 0 for a 2 × 2, find both eigenvalues and an eigenvector, and use them for repeated warps, steady states and vibration modes.',
  misconception: 'Reading the eigenvalues off the diagonal of any matrix; subtracting λ from every entry instead of only the diagonal; offering the zero vector as an eigenvector; thinking Aⁿv = nλv.',
  teach: [
    { title: 'Arrows that stay on their line', text: 'Most vectors get knocked off their line by a warp. An eigenvector only stretches: Av = λv. The number λ is its eigenvalue, the stretch factor (negative means it flips). The zero vector never counts.', steps: ['The warp on the plot is A = [2 1; 1 2].', 'Av = (2 + 1, 1 + 2) = (3, 3) = 3 × (1, 1): same line, λ = 3 (eigenvalue).', 'Aw = (2 × 1 + 1 × 0, 1 × 1 + 2 × 0) = (2, 1): knocked off w’s line.', '(1, −1) → (2 − 1, 1 − 2) = (1, −1): another eigenvector, λ = 1 (eigenvalue).'], next: 'Apply A to (2, 2). Is it an eigenvector, and with which λ?', visual: plotV({ vectors: [{ x: 1, y: 1, label: 'v', color: 'teal' }, { x: 3, y: 3, label: 'Av = 3v', color: 'ask' }, { x: 1, y: 0, label: 'w', color: 'label' }, { x: 2, y: 1, label: 'Aw', color: 'orange' }] }, [-1, 4, -1, 4]) },
    { title: 'The characteristic equation', text: 'Av = λv means (A − λI)v = 0 with v ≠ 0, so A − λI must squash: det(A − λI) = 0. For [a b; c d]: λ² − (a + d)λ + (ad − bc) = 0. Subtract λ on the diagonal only.', steps: ['(2 − λ)(2 − λ) − 1 × 1 = λ² − 4λ + 3', 'Check with the formula: a + d = 2 + 2 = 4 (trace) and ad − bc = 2 × 2 − 1 × 1 = 3 (determinant).', 'λ² − 4λ + 3 = (λ − 1)(λ − 3) = 0, so λ = 1 or λ = 3 (eigenvalues).', 'λ = 3: A − 3I = [−1 1; 1 −1] squashes (1, 1) to 0, so v = (1, 1).'], next: 'Find the eigenvalues of [3 0; 0 5] in your head.', visual: card('A = [2 1; 1 2]', ['det [2−λ 1; 1 2−λ] = 0', 'λ² − 4λ + 3 = 0', 'λ = 1 and λ = 3']) },
    { title: 'Where engineers meet them', text: 'Run a warp n times and an eigenvector just gets multiplied by λⁿ. That is why Markov chains settle (λ = 1 gives the steady state) and why structures vibrate in fixed mode shapes.', steps: ['A = [2 1; 1 2] and v = (1, 1), with λ = 3 (eigenvalue).', 'A²v = A(3, 3) = (9, 9) = 3² × (1, 1)', 'A³v = 3³ × (1, 1) = (27, 27): no matrix products needed.', 'Markov: [0.9 0.2; 0.1 0.8]·(2, 1) = (1.8 + 0.2, 0.2 + 0.8) = (2, 1): λ = 1 (eigenvalue), steady.'], next: 'What is A⁴(1, 1) for A = [2 1; 1 2]?', visual: card('Repeat the warp', ['Av = λv', 'A²v = λ²v', 'Aⁿv = λⁿv']) },
  ],
  quests: [
    { id: 'aq.linalg.eigen.steady-arrows', name: 'Steady Arrows', giver: 'vector', guided: true,
      hook: 'Vector: "At the heart of the Core are the arrows a warp cannot turn. Find them, and the numbers that stretch them."',
      change: 'The Eigen Core\'s beacons lock onto their own lines and blaze steady.',
      waves: [wave('Stay on the line?', mixOf([avLandStep, avLandStep, isEigenStep])), wave('Characteristic equation', mixOf([aMinusLamStep, charPolyStep])), wave('Find λ', times(3, eigenvaluesTableStep))] },
    { id: 'aq.linalg.eigen.resonance', name: 'Resonance Watch', giver: 'newton',
      hook: 'Newton: "The Core shudders at certain modes. Eigenvalues tell me how fast, eigenvectors tell me the shape. Find both before it shakes loose."',
      change: 'The Core\'s resonance is tuned out; it hums at a steady pitch.',
      waves: [wave('Eigenvalues', mixOf([eigChooseStep, eigenvaluesTableStep])), wave('Eigenvectors', times(3, eigenvectorStep)), wave('Modes and steady states', mixOf([powerStep, vibrationStep, markovTableStep]))] },
  ],
  concept: conceptFrom([eigenvaluesTableStep, eigenvectorStep, isEigenStep, charPolyStep, aMinusLamStep, avLandStep]),
  transfer: oneOf([markovStep]),
  practice: (rng) => { const { A, lo, hi } = eigProblem(rng); return mkq(S(K12), 'eigenvalues', { prompt: `A = ${ms(A)}. Find its larger eigenvalue.`, expression: 'det(A − λI) = 0', answer: hi, negative: true, hint: 'λ² − (a + d)λ + (ad − bc) = 0.', steps: eigSteps(A, lo, hi) }); },
};

/* =====================================================================================
 * Mastery Trial
 * ===================================================================================== */
const TRIAL: ChapterSpec = {
  key: 'trial', title: 'Mastery Trial: The Matrix Core', wing: 'core', wingName: 'The Matrix Core',
  goal: 'Show durable command of the whole Grid under trial rules: vectors, matrices and maps, systems and determinants, rank and eigenvalues, and two engineering problems. Seat the Matrix Core.',
  misconception: 'Treating each chapter as its own trick; one lucky run as mastery; skipping the chapters that felt hardest.',
  teach: [
    { title: 'Trial rules', text: 'Five phases, twenty-seven prompts across the whole Grid, one helper you may use once. Pass at 80% or better. Every chapter must already be mastered.', visual: card('The Mastery Trial', ['Vectors · Matrices & maps', 'Systems & determinants', 'Structure & eigenvalues · Transfer']) },
  ],
  quests: [
    { id: 'aq.linalg.trial.rehearsal', name: 'Trial Rehearsal', giver: 'vector', guided: true,
      hook: 'Vector: "Before the Core, a rehearsal. Same shape as the trial, no stakes."',
      change: 'The Matrix Core chamber unseals.',
      waves: [wave('Vectors & maps', mixOf([vecAddStep, spanKindStep, dotTypedStep, matVecStep, productTableStep])), wave('Systems & structure', mixOf([augmentedStep, (r) => fillRowStep(r), det2ChooseStep, inverseTableStep, eigenvaluesTableStep]))] },
    { id: 'aq.linalg.trial.keeper', name: 'The Core Keeper', giver: 'brick',
      hook: 'Brick: "The Keeper asks anything from anywhere on the Grid. Answer like you built it."',
      change: 'The Keeper steps aside; the Matrix Core waits for you.',
      waves: [wave('Anything', mixOf([projPlotStep, composeOrderStep, readEndStep, cofactorStep])), wave('Anywhere', mixOf([nullVectorStep, eigenvectorStep, workStep, markovStep]))] },
  ],
  concept: conceptFrom([basisImageStep, areaStep, eigenvectorStep]),
  transfer: oneOf([workStep, chemStep, markovStep, cipherStep]),
  practice: (rng) => dotTypedStep(rng).question,
};

/* =====================================================================================
 * The academy
 * ===================================================================================== */
const CHAPTERS: ChapterSpec[] = [VECTORS, SPAN, DOT, MATRICES, TRANSFORM, MATMUL, SYSTEMS, ELIM, DET, INVERSE, BASIS, EIGEN, TRIAL];

export const LINALG = defineAcademy({
  id: 'linalg',
  name: 'Linear Algebra Academy',
  short: 'Linear Algebra',
  tier: 'Advanced',
  blurb: 'Vectors, matrices, systems of equations, determinants, eigenvalues.',
  icon: 'circuit',
  home: 'linalg-grid',
  wings: {
    beacons: { name: 'Beacon Field', icon: 'compass' },
    lab: { name: 'Projection Lab', icon: 'lantern' },
    hall: { name: 'Matrix Hall', icon: 'multiply' },
    warp: { name: 'The Warp Floor', icon: 'cog' },
    solver: { name: 'Solver Deck', icon: 'gauge' },
    vault: { name: 'Determinant Vault', icon: 'lock' },
    core: { name: 'The Eigen Core', icon: 'reactor' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'Vectors', items: [vecAddStep(rng), spanKindStep(rng), weightsStep(rng), dotTypedStep(rng), projPlotStep(rng), perpStep(rng)] },
    { name: 'Matrices & maps', items: [addTableStep(rng), transposeTableStep(rng), basisImageStep(rng), whichMatrixStep(rng), productTableStep(rng), composeOrderStep(rng)] },
    { name: 'Systems & determinants', items: [augmentedStep(rng), howManyStep(rng), fillRowStep(rng), readEndStep(rng), cofactorStep(rng), inverseTableStep(rng), solveInverseStep(rng)] },
    { name: 'Structure & eigenvalues', items: [independentStep(rng), rankStep(rng), nullVectorStep(rng), charPolyStep(rng), eigenvaluesTableStep(rng), eigenvectorStep(rng)] },
    { name: 'Transfer', items: [oneOf([workStep, circuitStep])(rng), oneOf([markovStep, chemStep])(rng)] },
  ],
  trialIntro: 'The Mastery Trial. Five phases across the whole Grid: vectors, matrices and maps, systems and determinants, structure and eigenvalues, then two engineering problems. One helper, 80% to pass. The Matrix Core is listening.',
  coreName: 'The Matrix Core',
  coreLine: 'Vectors to eigenvalues, the whole Grid. The Matrix Core locks into place, the sheared half of the Grid snaps back into a perfect lattice, and every beacon swings to point the way to the Differential Equations Academy.',
  coreColor: '#38bdf8',
  title: 'Grid Architect',
});
