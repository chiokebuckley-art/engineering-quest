/**
 * The Trigonometry Academy: SOH-CAH-TOA grounded in similar triangles, solving right triangles, exact
 * values, angles in standard position, radians, the unit circle, trig graphs, inverse functions,
 * identities, sum and double-angle formulas, the laws of sines and cosines, and trig equations.
 * Home region: Trigonometry Mountains. Degrees throughout unless radians are named.
 */
import { defineAcademy, type ChapterSpec } from '../defs';
import { academySkill, mkq, typed, choose, model, ask, wave, mixOf, conceptFrom, oneOf, rint, pick, fmt, fmtSigned, fracStr, gcd, type Rng, type AskStep, type Visual, type Question } from '../kit';
import type { GeoItem, PlotLayers } from '../types';
import type { Fn } from '../fn';
import { lab } from '../../label';

const ID = 'trig';
const S = (key: string) => academySkill(ID, key);

/* ======================= helpers ======================= */
type P2 = [number, number];
type TF = 'sin' | 'cos' | 'tan';
const RAD = Math.PI / 180;
const COS30 = Math.sqrt(3) / 2;
const sinD = (d: number) => Math.sin(d * RAD);
const cosD = (d: number) => Math.cos(d * RAD);
const tanD = (d: number) => Math.tan(d * RAD);
const trigD = (f: TF, d: number) => (f === 'sin' ? sinD(d) : f === 'cos' ? cosD(d) : tanD(d));
const asinD = (v: number) => Math.asin(v) / RAD;
const acosD = (v: number) => Math.acos(v) / RAD;
const atanD = (v: number) => Math.atan(v) / RAD;
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const f4 = (x: number) => fmt(r4(x));
/** Five significant figures, for small ratios where 4 dp would lose precision: sin 4° → 0.069756. */
const sig5 = (x: number) => Number(x.toPrecision(5));
const dg = (d: number) => `${fmt(d)}°`;
/** A 1-decimal-place value always shown with its decimal: 21 → '21.0'. */
const s1 = (x: number) => { const v = r1(x); return `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`; };
/** 'a' or 'an' before a spoken number. */
const an = (n: number) => (/^8/.test(String(n)) || n === 11 || n === 18 ? 'an' : 'a');
const n360 = (d: number) => ((d % 360) + 360) % 360;
const refAngle = (d: number) => { const m = n360(d); return m <= 90 ? m : m <= 180 ? 180 - m : m <= 270 ? m - 180 : 360 - m; };
const quadIndex = (d: number) => { const m = n360(d); return m < 90 ? 0 : m < 180 ? 1 : m < 270 ? 2 : 3; };
const QUADS = ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const sq = (s: string) => (s.includes(' ') || s.includes('/') ? `(${s})` : s);
/** A number in a sum, negatives in brackets: 4 − (−2). */
/** A signed fraction for a product, negatives in brackets: (−15/17). */
const frP = (n: number, d: number) => (n < 0 ? `(${fracStr(n, d)})` : fracStr(n, d));
const par = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
/** f of an angle, negatives in brackets: tan(−30°). */
const fAt = (f: string, d: number) => (d < 0 ? `${f}(${dg(d)})` : `${f} ${dg(d)}`);

const MAG: Record<TF, Record<number, string>> = {
  sin: { 0: '0', 30: '1/2', 45: '√2/2', 60: '√3/2', 90: '1' },
  cos: { 0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0' },
  tan: { 0: '0', 30: '√3/3', 45: '1', 60: '√3' },
};
const UNDEF = 'no value';
/** Exact value at a special angle: exact('cos', 210) → '−√3/2'; UNDEF where tan is undefined. */
function exact(f: TF, d: number): string {
  const m = n360(d);
  if (f === 'tan' && Math.abs(cosD(m)) < 1e-9) return UNDEF;
  const mag = MAG[f][refAngle(m)];
  if (mag === '0') return '0';
  return trigD(f, m) < 0 ? `−${mag}` : mag;
}
const negEx = (s: string) => (s === '0' ? '0' : s.startsWith('−') ? s.slice(1) : `−${s}`);
const EXACT_POOL = ['1/2', '√2/2', '√3/2', '√3', '√3/3', '1', '0'];
const SPECIAL16 = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const NONQUAD = SPECIAL16.filter((d) => d % 90 !== 0);
const OTHER: Record<TF, TF> = { sin: 'cos', cos: 'sin', tan: 'tan' };

/** k√r, with 1√r written √r. */
const rt = (k: number, r: number) => (k === 1 ? `√${r}` : `${k}√${r}`);
/** (n/d)π, reduced: piStr(3, 4) → '3π/4'. */
function piStr(n: number, d: number): string {
  if (n === 0) return '0';
  const g = gcd(n, d); const a = n / g; const b = d / g;
  const top = `${a < 0 ? '−' : ''}${Math.abs(a) === 1 ? '' : Math.abs(a)}π`;
  return b === 1 ? top : `${top}/${b}`;
}
const degToPi = (deg: number) => piStr(deg, 180);

/** A right triangle with its right angle at (w, 0). θ sits at the left corner (0, 0) or the top corner (w, h). Edge labels: base, height, hypotenuse. */
function rtGeo(w: number, h: number, labels: [string | null, string | null, string | null], at: 'left' | 'top' = 'left', thetaLabel = 'θ'): Visual {
  const A: P2 = [0, 0]; const B: P2 = [w, 0]; const C: P2 = [w, h];
  const items: GeoItem[] = [
    { t: 'poly', pts: [A, B, C], labels: labels.map((l) => l ?? '') },
    { t: 'arc', at: B, from: A, to: C, right: true },
    at === 'left' ? { t: 'arc', at: A, from: B, to: C, label: thetaLabel } : { t: 'arc', at: C, from: A, to: B, label: thetaLabel },
  ];
  return { type: 'geo', items };
}
/** Any triangle A, B, C with side labels (BC = a, CA = b, AB = c) and angle labels. */
function triGeo(A: P2, B: P2, C: P2, sides: [string | null, string | null, string | null], angles: [string | null, string | null, string | null]): Visual {
  const items: GeoItem[] = [{ t: 'poly', pts: [A, B, C], labels: [sides[2] ?? '', sides[0] ?? '', sides[1] ?? ''] }];
  if (angles[0]) items.push({ t: 'arc', at: A, from: B, to: C, label: angles[0] });
  if (angles[1]) items.push({ t: 'arc', at: B, from: C, to: A, label: angles[1] });
  if (angles[2]) items.push({ t: 'arc', at: C, from: A, to: B, label: angles[2] });
  return { type: 'geo', items };
}
/** Place a triangle with sides a, b, c (opposite A, B, C): A at the origin, B on the x-axis. */
function placeTri(a: number, b: number, c: number): [P2, P2, P2] {
  const x = (b * b + c * c - a * a) / (2 * c); const y = Math.sqrt(Math.max(0.01, b * b - x * x));
  return [[0, 0], [c, 0], [x, y]];
}

/** Pick-the-picture with neutral letters (the labels must not give the answer away). */
function pickLettered(rng: Rng, q: Question, visuals: Visual[], right: number, noun = 'Graph'): AskStep {
  const order = rng.shuffle(visuals.map((_, i) => i));
  const options = order.map((i, k) => ({ visual: visuals[i], label: `${noun} ${'ABCD'[k]}` }));
  const label = options[order.indexOf(right)].label;
  return ask({ ...q, answerText: label }, 'pickmodel', { options, accept: [label] });
}
/** Every comma-joined combination of per-blank variants (so 1/2 and 0.5 are both accepted). */
const combos = (variants: string[][]): string[] => variants.reduce<string[]>((acc, vs) => acc.flatMap((a) => vs.map((v) => (a === '' ? v : `${a},${v}`))), ['']);
/** Accepted spellings of a number in a table cell. */
function numForms(n: number): string[] {
  const out = [fmt(n)];
  if (!Number.isInteger(n)) for (const d of [2, 4, 5, 8, 10, 20, 25, 50, 100]) { const k = Math.round(n * d); if (Math.abs(k / d - n) < 1e-9) { out.push(fracStr(k, d)); break; } }
  return out;
}
/**
 * A "to 1 decimal place" answer: judged against the unrounded value with a half-unit window, so only the
 * correctly rounded 1-dp value (or a more precise one) is accepted, and shown with its decimal ('9.0').
 */
const dec1 = (x: number) => ({ answer: Math.round(x * 1e6) / 1e6, tolerance: 0.05, answerText: s1(x), decimal: true });
const nearestDeg = (x: number) => ({ answer: Math.round(x), tolerance: 0.5 });
/**
 * Is a "to 1 decimal place" answer x safe to ask? x must sit clear of a rounding boundary (at least 0.01 from
 * an x.x5), and every value a student reaches from the rounded numbers printed in the steps (`shown`) must round
 * to the same 1-dp answer, so following the worked method is never marked wrong.
 */
const safe1 = (x: number, ...shown: number[]) => Math.abs(x * 10 - Math.floor(x * 10) - 0.5) >= 0.1 && shown.every((v) => r1(v) === r1(x));
/** '=' when the 2-dp value shown is exact, '≈' otherwise. */
const eq2 = (x: number) => (Math.abs(r2(x) - x) < 1e-9 ? '=' : '≈');
/** '=' when the 4-dp value shown is exact, '≈' otherwise. */
const eq4 = (x: number) => (Math.abs(Math.round(x * 1e4) / 1e4 - x) < 1e-12 ? '=' : '≈');

/* ======================= 1. ratios: SOH-CAH-TOA from similar triangles ======================= */
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
const FRAMES = ['crane brace', 'loading ramp', 'roof truss', 'cable stay', 'bridge strut'];

function triSetup(rng: Rng) {
  const [a, b, c] = pick(rng, TRIPLES); const k = a === 3 ? pick(rng, [1, 2, 3]) : 1;
  const flip = rng.next() < 0.5; const w = (flip ? b : a) * k; const h = (flip ? a : b) * k; const hyp = c * k;
  const at: 'left' | 'top' = rng.next() < 0.5 ? 'left' : 'top';
  return { w, h, hyp, at, opp: at === 'left' ? h : w, adj: at === 'left' ? w : h };
}
/** The two sides each ratio divides: RATIO_SIDES.sin = ['opposite', 'hypotenuse']. */
const RATIO_SIDES: Record<TF, [string, string]> = { sin: ['opposite', 'hypotenuse'], cos: ['adjacent', 'hypotenuse'], tan: ['opposite', 'adjacent'] };
const SOH: Record<TF, string> = { sin: 'opposite ÷ hypotenuse (SOH)', cos: 'adjacent ÷ hypotenuse (CAH)', tan: 'opposite ÷ adjacent (TOA)' };

function nameSideStep(rng: Rng): AskStep {
  const t = triSetup(rng); const role = pick(rng, ['opposite', 'adjacent', 'opposite', 'adjacent', 'hypotenuse'] as const);
  const ans = role === 'opposite' ? t.opp : role === 'adjacent' ? t.adj : t.hyp;
  const q = mkq(S('ratios'), 'name-sides', {
    prompt: `Ada marks angle θ on a ${pick(rng, FRAMES)}. Which side is ${role === 'hypotenuse' ? 'the hypotenuse' : role === 'opposite' ? 'opposite θ' : 'adjacent to θ'}?`,
    expression: `${cap(role)} = ?`, answer: ans,
    hint: 'Stand at θ. The hypotenuse faces the right angle; of the two legs, one touches θ and one faces it.',
    steps: ['Stand at θ: the adjacent leg touches θ, the opposite leg faces θ, and the hypotenuse faces the right angle.', `The longest side is ${lab(t.hyp, 'hypotenuse in m')}.`, `${lab(t.adj, 'adjacent in m')} touches θ; ${lab(t.opp, 'opposite in m')} faces θ.`],
    visual: rtGeo(t.w, t.h, [`${t.w} m`, `${t.h} m`, `${t.hyp} m`], t.at),
    app: 'Surveyors name sides from the angle they measure, not from how the drawing is turned.',
  });
  return choose(rng, q, `${ans} m`, [t.opp, t.adj, t.hyp].filter((v) => v !== ans).map((v) => `${v} m`));
}

function writeRatioStep(rng: Rng): AskStep {
  const t = triSetup(rng); const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]);
  const [n, d] = f === 'sin' ? [t.opp, t.hyp] : f === 'cos' ? [t.adj, t.hyp] : [t.opp, t.adj];
  const wrongs = f === 'sin' ? [`${t.adj}/${t.hyp}`, `${t.opp}/${t.adj}`, `${t.hyp}/${t.opp}`] : f === 'cos' ? [`${t.opp}/${t.hyp}`, `${t.adj}/${t.opp}`, `${t.hyp}/${t.adj}`] : [`${t.adj}/${t.opp}`, `${t.opp}/${t.hyp}`, `${t.adj}/${t.hyp}`];
  const q = mkq(S('ratios'), 'write-ratio', {
    prompt: `Write ${f} θ for this ${pick(rng, FRAMES)} as a ratio of two sides.`,
    expression: `${f} θ = ?`, answer: n / d,
    hint: 'Name the three sides from θ first, then use SOH-CAH-TOA.',
    steps: [`${f} θ = ${SOH[f]}.`, `From θ: ${lab(t.opp, 'opposite')}, ${lab(t.adj, 'adjacent')}, ${lab(t.hyp, 'hypotenuse')}.`, `${f} θ = ${lab(n, RATIO_SIDES[f][0])} ÷ ${lab(d, RATIO_SIDES[f][1])} = ${n}/${d}.`],
    visual: rtGeo(t.w, t.h, [`${t.w}`, `${t.h}`, `${t.hyp}`], t.at),
  });
  return choose(rng, q, `${n}/${d}`, wrongs);
}

/** Same angle, three sizes: the ratio column never changes. */
function similarTableStep(rng: Rng): AskStep {
  const b = pick(rng, [{ o: 3, a: 4, h: 5 }, { o: 4, a: 3, h: 5 }, { o: 7, a: 24, h: 25 }, { o: 24, a: 7, h: 25 }]);
  const f = pick(rng, (b.o === 3 ? ['sin', 'cos', 'tan'] : ['sin', 'cos']) as TF[]);
  const [n, d, nName, dName] = f === 'sin' ? [b.o, b.h, 'opposite', 'hypotenuse'] : f === 'cos' ? [b.a, b.h, 'adjacent', 'hypotenuse'] : [b.o, b.a, 'opposite', 'adjacent'];
  const ratio = n / d; const k2 = pick(rng, [2, 3]); const k3 = pick(rng, [4, 5, 6]);
  const q = mkq(S('ratios'), 'similar', {
    prompt: `Three ${pick(rng, ['ramps', 'braces', 'cable stays'])} share the same angle θ at different sizes. Fill the gaps.`,
    expression: `${f} θ = ${nName} ÷ ${dName}`, answer: ratio,
    hint: 'Same angle means same shape: every row keeps the same ratio.',
    steps: [`Same angle, similar triangles: ${f} θ = ${n}/${d} = ${fmt(ratio)} in every row.`, `Row 2: ${lab(n * k2, nName)} ÷ ${lab(d * k2, dName)} = ${lab(fmt(ratio), 'same ratio')}.`, `Row 3: ${nName} = ${lab(fmt(ratio), 'same ratio')} × ${lab(d * k3, dName)} = ${lab(n * k3, nName)}.`],
    visual: rtGeo(b.a, b.o, [`${b.a}`, `${b.o}`, `${b.h}`]),
  });
  return model(q, { kind: 'table', cols: [nName, dName, `${f} θ`], rows: [[n, d, ratio], [n * k2, d * k2, null], [null, d * k3, ratio]], label: `Same θ, three sizes` }, combos([numForms(ratio), [String(n * k3)]]), `Fill the ${f} θ gap in row 2, then the missing ${nName} in row 3.`);
}

function sameRatioStep(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, TRIPLES.slice(0, 3)); const k = pick(rng, [2, 3]); const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]);
  const x0 = b + 2;
  const items: GeoItem[] = [
    { t: 'poly', pts: [[0, 0], [b, 0], [b, a]], labels: [`${b}`, `${a}`, `${c}`] },
    { t: 'arc', at: [0, 0], from: [b, 0], to: [b, a], label: 'θ' },
    { t: 'text', p: [b / 2, a + 1], text: 'A' },
    { t: 'poly', pts: [[x0, 0], [x0 + k * b, 0], [x0 + k * b, k * a]], labels: [`${k * b}`, `${k * a}`, `${k * c}`] },
    { t: 'arc', at: [x0, 0], from: [x0 + k * b, 0], to: [x0 + k * b, k * a], label: 'θ' },
    { t: 'text', p: [x0 + (k * b) / 2, k * a + 1], text: 'B' },
  ];
  const [n, d] = f === 'sin' ? [a, c] : f === 'cos' ? [b, c] : [a, b];
  const q = mkq(S('ratios'), 'same-ratio', {
    prompt: `Braces A and B meet the deck at the same angle θ, and B is ${k} times bigger. Which has the larger ${f} θ?`,
    expression: `${f} θ: A or B?`, answer: 0,
    hint: `Work out ${f} θ in each triangle from its own sides.`,
    steps: [`Same angle, same shape: B is A scaled by ${lab(k, 'scale factor')}, and scaling both sides of a ratio leaves it unchanged.`, `A: ${f} θ = ${n}/${d}. B: ${f} θ = ${k * n}/${k * d} = ${n}/${d}.`, 'The ratio depends only on the angle, not the size.'],
    visual: { type: 'geo', items },
  });
  return choose(rng, q, 'The same for both', ['B, because it is bigger', 'A, because its sides are shorter', `B, by a factor of ${k}`]);
}

/** Tap the top of a ramp with a given tangent. */
function rampPointStep(rng: Rng): AskStep {
  const [p, qd] = pick(rng, [[1, 2], [3, 4], [2, 3], [1, 3], [3, 2], [2, 1], [1, 4], [5, 4], [4, 3]] as P2[]);
  const ms = [1, 2, 3, 4, 5, 6, 7, 8].filter((m) => m * qd <= 8 && m * p <= 8);
  const big = ms.filter((m) => m > 1); const m = pick(rng, big.length ? big : ms);
  const run = m * qd; const rise = m * p; const t = fracStr(p, qd);
  const frame = { prompt: `A ramp leaves the origin at angle θ with tan θ = ${t}. Tap the top of the ramp where the run is ${run} m.`, label: `Run ${lab(run, 'metres')}: where is the top?` };
  const q = mkq(S('ratios'), 'tan-point', {
    prompt: frame.prompt, expression: `tan θ = rise ÷ run = ${t}`, answer: rise,
    hint: 'tan θ compares rise to run. Scale both by the same factor.',
    steps: ['tan θ = rise ÷ run, so rise = run × tan θ.', `rise = ${lab(run, 'run in m')} × ${lab(t, 'tan of the angle')} = ${lab(rise, 'rise in m')}.`, `The point is (${run}, ${rise}).`],
    visual: { type: 'none' },
  });
  return model(q, { kind: 'plot', range: [0, 8, 0, 8], count: 1, label: frame.label, layers: { points: [{ x: 0, y: 0, label: 'θ' }] } }, [`${run},${rise}`], `Tap the point at run ${lab(run, 'metres')}.`);
}

/** Families whose ratios are terminating decimals. */
function decTri(rng: Rng) {
  const base = pick(rng, [[3, 4, 5], [4, 3, 5], [7, 24, 25], [24, 7, 25]]); const k = base[2] === 5 ? pick(rng, [1, 2, 3, 4]) : 1;
  return { o: base[0] * k, a: base[1] * k, h: base[2] * k, fs: (base[0] === 3 ? ['sin', 'cos', 'tan'] : ['sin', 'cos']) as TF[] };
}
function ratioValueQ(rng: Rng): Question {
  const t = decTri(rng); const f = pick(rng, t.fs);
  const [n, d] = f === 'sin' ? [t.o, t.h] : f === 'cos' ? [t.a, t.h] : [t.o, t.a];
  return mkq(S('ratios'), 'ratio-value', {
    prompt: `A ${pick(rng, FRAMES)} has sides ${t.a}, ${t.o} and ${t.h} as shown. Find ${f} θ as a decimal.`,
    expression: `${f} θ = ?`, answer: n / d,
    hint: `${f} is ${SOH[f].split(' (')[0]}. Read those two sides from θ.`,
    steps: [`${f} θ = ${SOH[f]}.`, `${f} θ = ${lab(n, RATIO_SIDES[f][0])} ÷ ${lab(d, RATIO_SIDES[f][1])} = ${fmt(n / d)}.`],
    visual: rtGeo(t.a, t.o, [`${t.a}`, `${t.o}`, `${t.h}`]),
  });
}
const ratioValueStep = (rng: Rng) => typed(ratioValueQ(rng));

function whichTriangleStep(rng: Rng): AskStep {
  const [o, a, h] = pick(rng, [[3, 4, 5], [5, 12, 13], [4, 3, 5], [12, 5, 13]]);
  const f = pick(rng, (o < a ? ['sin', 'cos', 'tan'] : ['sin', 'cos']) as TF[]);
  const [n, d] = f === 'sin' ? [o, h] : f === 'cos' ? [a, h] : [o, a];
  const right = rtGeo(a, o, [`${a}`, `${o}`, `${h}`], 'left');
  const swapped = rtGeo(o, a, [`${o}`, `${a}`, `${h}`], 'left');
  const otherCorner = rtGeo(a, o, [`${a}`, `${o}`, `${h}`], 'top');
  // The "wrong pair" triangle: the two numbers of the ratio used as the wrong sides.
  let misread: Visual;
  if (f === 'sin') misread = rtGeo(h, o, [`${h}`, `${o}`, `√${h * h + o * o}`]);
  else if (f === 'cos') misread = rtGeo(a, h, [`${a}`, `${h}`, `√${a * a + h * h}`]);
  else misread = rtGeo(Math.sqrt(a * a - o * o), o, [`√${a * a - o * o}`, `${o}`, `${a}`]);
  const q = mkq(S('ratios'), 'which-triangle', {
    prompt: `Vector wants a brace with ${f} θ = ${n}/${d}. Which triangle is it?`,
    expression: `${f} θ = ${n}/${d}`, answer: n / d,
    hint: 'In each picture, stand at θ and name opposite, adjacent and hypotenuse before you divide.',
    steps: [`${f} θ = ${SOH[f]}.`, `The right triangle has ${lab(n, RATIO_SIDES[f][0])} and ${lab(d, RATIO_SIDES[f][1])}, measured from θ.`],
    visual: { type: 'none' },
  });
  return pickLettered(rng, q, [right, swapped, otherCorner, misread], 0, 'Brace');
}

function ladderStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 4, 5]); const o = 4 * k; const a = 3 * k; const h = 5 * k; const f = pick(rng, ['sin', 'tan'] as TF[]);
  const ans = f === 'sin' ? o / h : o / a;
  const q = mkq(S('ratios'), 'transfer-ladder', {
    prompt: `${cap(an(h))} ${h} m ladder leans on a pump house wall, its foot ${a} m out. Find ${f} of its angle with the ground, as a fraction or to 2 decimal places.`,
    expression: `${f} θ = ?`, answer: ans, fraction: true, tolerance: 0.01, answerText: fracStr(o, f === 'sin' ? h : a),
    hint: 'You need the height up the wall first. Pythagoras finds it.',
    steps: [`The ${lab(h, 'ladder in m')} is the hypotenuse and the ${lab(a, 'foot distance in m')} is adjacent. Find the height first: height² = ladder² − foot².`, `height = √(${h * h} − ${a * a}) = √${o * o} = ${lab(o, 'height up the wall in m')}.`, `${f} θ = ${lab(o, 'height in m')} ÷ ${f === 'sin' ? lab(h, 'ladder in m') : lab(a, 'foot distance in m')} = ${fracStr(o, f === 'sin' ? h : a)}${f === 'sin' ? ` = ${fmt(ans)}` : ` ≈ ${fmt(r2(ans))}`}.`],
    visual: rtGeo(a, o, [`${a} m`, '?', `${h} m`]),
    app: 'Ladder safety rules are written as angles, but checked with a tape measure.',
  });
  return typed(q);
}
function shadowStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 4, 5]); const o = 3 * k; const a = 4 * k; const f = pick(rng, ['tan', 'cos'] as TF[]);
  const ans = f === 'tan' ? 0.75 : 0.8;
  const q = mkq(S('ratios'), 'transfer-shadow', {
    prompt: `${cap(an(o))} ${o} m signal mast casts ${an(a)} ${a} m shadow. Find ${f} of the sun's angle of elevation, as a decimal.`,
    expression: `${f} θ = ?`, answer: ans,
    hint: f === 'cos' ? 'The sun ray is the hypotenuse. Find it before you divide.' : 'The angle sits at the tip of the shadow. Which side faces it?',
    steps: [`The ${lab(o, 'mast height in m')}, the ${lab(a, 'shadow in m')} and the sun ray make a right triangle; θ is at the tip of the shadow.`, ...(f === 'cos' ? [`ray = √(${o * o} + ${a * a}) = ${lab(5 * k, 'sun ray in m')}.`, `cos θ = ${lab(a, 'shadow in m')} ÷ ${lab(5 * k, 'sun ray in m')} = 0.8.`] : [`tan θ = opposite ÷ adjacent = ${lab(o, 'mast height in m')} ÷ ${lab(a, 'shadow in m')} = 0.75.`])],
    visual: rtGeo(a, o, [`${a} m`, `${o} m`, null]),
  });
  return typed(q);
}

/* ======================= 2. solve-right ======================= */
const SIDE_NAME = { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' } as const;
const SIDE_CASES = [
  { want: 'opp', know: 'hyp', f: 'sin', op: 'mul' }, { want: 'adj', know: 'hyp', f: 'cos', op: 'mul' }, { want: 'opp', know: 'adj', f: 'tan', op: 'mul' },
  { want: 'hyp', know: 'opp', f: 'sin', op: 'div' }, { want: 'hyp', know: 'adj', f: 'cos', op: 'div' }, { want: 'adj', know: 'opp', f: 'tan', op: 'div' },
] as const;
const JIBS = ['crane jib', 'cable stay', 'loading ramp', 'roof rafter', 'ropeway cable'];

/** x worked from a ratio value t: K × t or K ÷ t. */
const sideX = (c: (typeof SIDE_CASES)[number], K: number, t: number) => (c.op === 'mul' ? K * t : K / t);
/** Every (case, θ, K) whose answer the 4-dp ratio in the steps rounds the same way (see safe1). */
const SIDE_POOL = SIDE_CASES.flatMap((c) => [20, 25, 30, 35, 40, 50, 55, 60, 65, 70].flatMap((th) => [6, 8, 10, 12, 15, 20, 25, 30, 40].map((K) => ({ c, th, K }))))
  .filter(({ c, th, K }) => { const xs = sideX(c, K, r4(trigD(c.f, th))); return safe1(sideX(c, K, trigD(c.f, th)), xs, r2(xs)); });
function sideCase(rng: Rng) {
  const { c, th, K } = pick(rng, SIDE_POOL);
  const tv = trigD(c.f, th); const x = sideX(c, K, tv); const xs = sideX(c, K, r4(tv));
  const lab = (s: 'opp' | 'adj' | 'hyp') => (s === c.know ? `${K} m` : s === c.want ? 'x = ?' : null);
  const visual = rtGeo(cosD(th) * 10, sinD(th) * 10, [lab('adj'), lab('opp'), lab('hyp')], 'left', `${th}°`);
  const form = (f: string, op: string) => (op === 'mul' ? `x = ${K} ${f} ${th}°` : `x = ${K} ÷ ${f} ${th}°`);
  return { c, th, K, tv, x, xs, visual, form, frame: pick(rng, JIBS) };
}
function findSideStep(rng: Rng): AskStep {
  const s = sideCase(rng); const { c, th, K } = s;
  const known = lab(K, `${SIDE_NAME[c.know]} in m`); const tvl = lab(f4(s.tv), `${c.f} of the angle`);
  const rel = c.op === 'mul' ? `${c.f} ${th}° = x ÷ ${known}, so x = ${K} × ${c.f} ${th}°.` : `${c.f} ${th}° = ${known} ÷ x, so x = ${K} ÷ ${c.f} ${th}°.`;
  const q = mkq(S('solve-right'), 'find-side', {
    prompt: `A ${s.frame} makes ${th}° with the level. Find x to 1 decimal place.`,
    expression: `${SIDE_NAME[c.know]} ${K} m, angle ${th}°: x = ?`, ...dec1(s.x), unit: 'm',
    hint: `x is the ${SIDE_NAME[c.want]}; you know the ${SIDE_NAME[c.know]}. Which ratio links those two?`,
    steps: [`From ${lab(`${th}°`, 'given angle')}: x is the ${SIDE_NAME[c.want]} and ${known} is known, so use ${c.f} (${SOH[c.f].split(' (')[0]}).`, rel, eq4(s.tv) === '=' ? `x = ${known} ${c.op === 'mul' ? '×' : '÷'} ${tvl} = ${fmt(s.x)}, so x = ${lab(s1(s.x), `${SIDE_NAME[c.want]} in m`)}.` : `x = ${known} ${c.op === 'mul' ? '×' : '÷'} ${tvl} ${eq2(s.xs)} ${fmt(r2(s.xs))}, so x ≈ ${lab(s1(s.x), `${SIDE_NAME[c.want]} in m`)}.`],
    visual: s.visual,
    app: 'Crane operators check jib reach and hook height with exactly this calculation.',
  });
  return typed(q);
}
function setupStep(rng: Rng): AskStep {
  const s = sideCase(rng); const { c } = s;
  const right = s.form(c.f, c.op);
  const flipOp = s.form(c.f, c.op === 'mul' ? 'div' : 'mul');
  const swapF = s.form(c.f === 'cos' ? 'sin' : 'cos', c.op);
  const rest = (['sin', 'cos', 'tan'] as TF[]).flatMap((f) => ['mul', 'div'].map((op) => s.form(f, op)));
  const q = mkq(S('solve-right'), 'set-up', {
    prompt: `A ${s.frame} makes ${s.th}° with the level. Which equation finds x?`,
    expression: 'x = ?', answer: s.x,
    hint: 'Name the side you want and the side you know from the angle, then pick the ratio that uses exactly those two.',
    steps: [`x is the ${SIDE_NAME[c.want]}; ${s.K} m is the ${SIDE_NAME[c.know]}: that pair belongs to ${c.f}.`, c.op === 'mul' ? `The unknown is on top of the ratio, so multiply: ${right}.` : `The unknown is on the bottom of the ratio, so divide: ${right}.`],
    visual: s.visual,
  });
  return choose(rng, q, right, [flipOp, swapF, ...rng.shuffle(rest)]);
}

function angleCase(rng: Rng) {
  for (let g = 0; g < 80; g++) {
    const f = pick(rng, ['tan', 'sin', 'cos'] as TF[]);
    let o = 0; let a = 0; let h = 0; let th = 0;
    if (f === 'tan') { o = rint(rng, 2, 15); a = rint(rng, 2, 15); if (o === a) continue; th = atanD(o / a); }
    else if (f === 'sin') { h = rint(rng, 5, 20); o = rint(rng, 2, h - 1); th = asinD(o / h); }
    else { h = rint(rng, 5, 20); a = rint(rng, 2, h - 1); th = acosD(a / h); }
    const fr = th - Math.floor(th);
    if (th < 12 || th > 78 || Math.abs(fr - 0.5) < 0.12) continue;
    const [n, d] = f === 'tan' ? [o, a] : f === 'sin' ? [o, h] : [a, h];
    const w = f === 'tan' || f === 'cos' ? (f === 'tan' ? a : a) : Math.sqrt(h * h - o * o);
    const ht = f === 'tan' || f === 'sin' ? o : Math.sqrt(h * h - a * a);
    const labels: [string | null, string | null, string | null] = f === 'tan' ? [`${a} m`, `${o} m`, null] : f === 'sin' ? [null, `${o} m`, `${h} m`] : [`${a} m`, null, `${h} m`];
    const prompt = f === 'tan' ? `A ropeway rises ${o} m over ${a} m of level ground.` : f === 'sin' ? `${cap(an(h))} ${h} m ramp rises ${o} m.` : `${cap(an(h))} ${h} m guy cable is anchored ${a} m from the foot of the mast.`;
    const [nl, dl] = f === 'tan' ? ['rise in m', 'level run in m'] : f === 'sin' ? ['rise in m', 'ramp length in m'] : ['anchor distance in m', 'cable length in m'];
    return { f, n, d, th, ans: Math.round(th), prompt, nl, dl, visual: rtGeo(w, ht, labels, 'left', 'θ = ?') };
  }
  return { f: 'tan' as TF, n: 3, d: 4, th: atanD(0.75), ans: 37, prompt: 'A ropeway rises 3 m over 4 m of level ground.', nl: 'rise in m', dl: 'level run in m', visual: rtGeo(4, 3, ['4 m', '3 m', null], 'left', 'θ = ?') };
}
function angleQ(rng: Rng): Question {
  const c = angleCase(rng);
  return mkq(S('solve-right'), 'find-angle', {
    prompt: `${c.prompt} Find θ, its angle with the ground, to the nearest degree.`,
    expression: `${c.f} θ = ${c.n}/${c.d}`, ...nearestDeg(c.th), unit: '°',
    hint: 'Two sides known, angle unknown: the inverse function turns a ratio back into an angle.',
    steps: ['Two sides known, angle unknown: undo the ratio with the inverse function.', `${c.f} θ = ${lab(c.n, c.nl)} ÷ ${lab(c.d, c.dl)} ${Math.abs(Math.round((c.n / c.d) * 1e4) / 1e4 - c.n / c.d) < 1e-12 ? '=' : '≈'} ${f4(c.n / c.d)}.`, `θ = ${c.f}⁻¹(${c.n}/${c.d}) ≈ ${fmt(r2(c.th))}°, so θ ≈ ${lab(`${c.ans}°`, 'angle with the ground')}.`],
    visual: c.visual,
  });
}
const findAngleStep = (rng: Rng) => typed(angleQ(rng));
function angleDialStep(rng: Rng): AskStep {
  const q = angleQ(rng);
  return model(q, { kind: 'angle', max: 180, step: 1, label: 'Turn the dial to θ' }, [String(q.answer)], 'Work out θ to the nearest degree, then turn the dial to it.');
}
/** Set the jib: the angle drives the hook height L sin θ; slide θ until the tip reaches a target height. */
function jibSliderStep(rng: Rng): AskStep {
  let L = 10; let h = 5; let th = 30;
  for (let g = 0; g < 60; g++) {
    L = pick(rng, [10, 12, 15, 20, 25]); h = rint(rng, 3, L - 2); th = asinD(h / L);
    if (th >= 12 && th <= 75 && Math.abs(th - Math.floor(th) - 0.5) > 0.15) break;
  }
  const ans = Math.round(th);
  const q = mkq(S('solve-right'), 'jib-slider', {
    prompt: `Ada's crane jib is ${L} m long and pivots at ground level. Slide the jib angle until its tip is ${h} m up, to the nearest degree.`,
    expression: `${L} sin θ = ${h}`, ...nearestDeg(th), unit: '°',
    hint: 'The jib is the hypotenuse and the tip height is opposite θ. Undo the ratio with the inverse function.',
    steps: ['The jib is the hypotenuse and the tip height is opposite θ, so tip height = L sin θ.', `sin θ = ${lab(h, 'tip height in m')} ÷ ${lab(L, 'jib length in m')}, so θ = sin⁻¹(${h}/${L}) ${eq2(th)} ${fmt(r2(th))}°.`, `To the nearest degree, θ = ${lab(`${ans}°`, 'jib angle')}.`],
    visual: rtGeo(cosD(th) * 10, sinD(th) * 10, [null, `${h} m`, `${L} m`], 'left', 'θ = ?'),
  });
  return model(q, { kind: 'slider', min: 0, max: 90, step: 1, label: 'jib angle θ', unit: '°', range: [0, 90, 0, L + 2], layers: { fns: [{ fn: { kind: 'sin', amp: L, deg: true }, label: 'tip height' }], hlines: [{ y: h, label: `${h} m` }] } }, [String(ans)], `Slide θ until the tip height reaches ${lab(h, 'metres')}.`);
}
function inverseSetupStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]); const v = pick(rng, f === 'tan' ? [0.4, 0.8, 1.2, 1.5, 2.5] : [0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]);
  const th = f === 'sin' ? asinD(v) : f === 'cos' ? acosD(v) : atanD(v);
  const q = mkq(S('solve-right'), 'inverse-setup', {
    prompt: `Ada measures ${f} θ = ${fmt(v)} for a ${pick(rng, JIBS)}. Which calculation gives the angle θ?`,
    expression: `${f} θ = ${fmt(v)}`, answer: th,
    hint: `You have a ratio and want an angle. Which button goes from ratio back to angle?`,
    steps: [`${f}⁻¹ undoes ${f}: it takes a ratio and returns the angle.`, `θ = ${f}⁻¹(${fmt(v)}) ≈ ${lab(`${fmt(r1(th))}°`, 'angle with the level')}.`, `It is not 1 ÷ ${f}: the −1 means "inverse function", not "reciprocal".`],
    visual: rtGeo(cosD(th) * 10, sinD(th) * 10, [null, null, null], 'left', 'θ = ?'),
  });
  return choose(rng, q, `θ = ${f}⁻¹(${fmt(v)})`, [`θ = 1 ÷ ${f}(${fmt(v)})`, `θ = ${f}(${fmt(v)})`, `θ = ${fmt(v)} × 90°`]);
}

function elevationQ(rng: Rng): Question {
  if (rng.next() < 0.5) {
    const eye = pick(rng, [0, 0, 1.5]);
    // The steps multiply by a 4-dp tangent and add the eye height to a 2-dp x: keep only (d, θ) where that agrees with the answer.
    const pool = [20, 25, 30, 40, 50, 60, 80].flatMap((d) => [15, 20, 25, 30, 35, 40, 50, 55, 60].map((th) => ({ d, th })))
      .filter(({ d, th }) => { const xs = d * r4(tanD(th)); return safe1(eye + d * tanD(th), eye + xs, eye + r2(xs)); });
    const { d, th } = pick(rng, pool);
    const x = d * tanD(th); const xs = d * r4(tanD(th)); const h = eye + x; const what = pick(rng, ['tower crane', 'survey tower', 'cable-car pylon']);
    return mkq(S('solve-right'), 'elevation', {
      prompt: eye ? `From ${d} m away, a theodolite 1.5 m above the ground sights the top of a ${what} at ${th}° elevation. How tall is the ${what}, to 1 decimal place?` : `From ${d} m away, the angle of elevation to the top of a ${what} is ${th}°. How tall is it, to 1 decimal place?`,
      expression: eye ? 'height = 1.5 + x' : `tan ${th}° = h ÷ ${d}`, ...dec1(h), unit: 'm',
      hint: 'Elevation is measured up from the horizontal. The distance is adjacent to it; the height is opposite.',
      steps: ['Angle of elevation: measured up from the horizontal, so the ground distance is adjacent and the height is opposite.', `tan ${lab(`${th}°`, 'angle of elevation')} = ${eye ? 'x' : 'h'} ÷ ${lab(d, 'distance in m')}, so ${eye ? 'x' : 'h'} = ${d} × ${f4(tanD(th))} ${eq2(xs)} ${lab(fmt(r2(xs)), eye ? 'rise above the instrument in m' : 'height in m')}.`, ...(eye ? [`Add the instrument height: ${lab(1.5, 'instrument height in m')} + ${fmt(r2(xs))} = ${fmt(r2(1.5 + r2(xs)))}, so the height ≈ ${lab(s1(h), 'height in m')}.`] : [`h ≈ ${lab(s1(h), 'height in m')}.`])],
      visual: { type: 'geo', items: [
        { t: 'seg', a: [0, 0], b: [d, 0], label: `${d} m` }, { t: 'seg', a: [d, 0], b: [d, x], label: eye ? 'x = ?' : 'h = ?' },
        { t: 'seg', a: [0, 0], b: [d, x], dashed: true }, { t: 'arc', at: [0, 0], from: [d, 0], to: [d, x], label: `${th}°` }, { t: 'arc', at: [d, 0], from: [0, 0], to: [d, x], right: true },
      ] },
    });
  }
  const pool = [30, 40, 50, 60, 80, 100].flatMap((H) => [15, 20, 25, 30, 35, 40, 50, 55].map((th) => ({ H, th })))
    .filter(({ H, th }) => { const xs = H / r4(tanD(th)); return safe1(H / tanD(th), xs, r2(xs)); });
  const { H, th } = pick(rng, pool); const x = H / tanD(th); const xs = H / r4(tanD(th));
  return mkq(S('solve-right'), 'depression', {
    prompt: `From the top of ${an(H)} ${H} m cliff, the angle of depression to a survey boat is ${th}°. How far out is the boat, to 1 decimal place?`,
    expression: `tan ${th}° = ${H} ÷ x`, ...dec1(x), unit: 'm',
    hint: 'Depression is measured down from the horizontal. It equals the elevation angle seen from the boat.',
    steps: ['The angle of depression (down from the horizontal) equals the angle of elevation at the boat: alternate angles.', `At the boat: tan ${lab(`${th}°`, 'angle of elevation')} = ${lab(H, 'cliff height in m')} ÷ x, so x = ${H} ÷ tan ${th}°.`, `x = ${lab(H, 'cliff height in m')} ÷ ${f4(tanD(th))} ≈ ${fmt(r2(xs))}, so x ≈ ${lab(s1(x), 'distance out in m')}.`],
    visual: { type: 'geo', items: [
      { t: 'seg', a: [0, 0], b: [0, H], label: `${H} m` }, { t: 'seg', a: [0, 0], b: [x, 0], label: 'x = ?' }, { t: 'seg', a: [0, H], b: [x, 0], dashed: true },
      { t: 'seg', a: [0, H], b: [x, H], dashed: true }, { t: 'arc', at: [0, H], from: [x, H], to: [x, 0], label: `${th}°` }, { t: 'arc', at: [0, 0], from: [x, 0], to: [0, H], right: true },
    ] },
  });
}
const elevationStep = (rng: Rng) => typed(elevationQ(rng));
function elevDepStep(rng: Rng): AskStep {
  const H = pick(rng, [30, 40, 50, 60]); const th = pick(rng, [20, 25, 28, 32, 35, 40, 52]);
  const x = H / tanD(th);
  const q = mkq(S('solve-right'), 'alt-angles', {
    prompt: `From a ${H} m survey tower, the angle of depression to a beacon is ${th}°. What is the angle of elevation from the beacon up to the tower top?`,
    expression: `depression ${th}° → elevation = ?`, answer: th,
    hint: 'The horizontal through the tower top is parallel to the ground. The sight line crosses both.',
    steps: ['The horizontal at the top and the ground are parallel; the sight line is a transversal.', `Alternate angles are equal: ${lab(`${th}°`, 'angle of depression')} at the top = ${lab(`${th}°`, 'angle of elevation')} at the beacon.`, 'Both angles are measured from a horizontal, never from the vertical.'],
    visual: { type: 'geo', items: [
      { t: 'seg', a: [0, 0], b: [0, H], label: `${H} m` }, { t: 'seg', a: [0, 0], b: [x, 0] }, { t: 'seg', a: [0, H], b: [x, 0], dashed: true },
      { t: 'seg', a: [0, H], b: [x, H], dashed: true }, { t: 'arc', at: [0, H], from: [x, H], to: [x, 0], label: `${th}°` }, { t: 'arc', at: [x, 0], from: [0, H], to: [0, 0], label: '?' },
    ] },
  });
  return choose(rng, q, dg(th), [dg(90 - th), dg(180 - th), dg(2 * th)]);
}
function rampCodeStep(rng: Rng): AskStep {
  // sin of a small angle is shown to 5 significant figures (4 dp would keep only 3); keep (rise, θ) whose worked arithmetic rounds like the answer.
  const pool = [0.4, 0.5, 0.6, 0.75, 0.9].flatMap((rise) => [4, 4.8, 5].map((th) => ({ rise, th })))
    .filter(({ rise, th }) => { const Ls = rise / sig5(sinD(th)); return safe1(rise / sinD(th), Ls, r2(Ls)); });
  const { rise, th } = pick(rng, pool); const L = rise / sinD(th); const Ls = rise / sig5(sinD(th));
  const q = mkq(S('solve-right'), 'transfer-ramp', {
    prompt: `Building code caps an access ramp's slope at ${th}°, and this ramp must climb ${rise} m. What is the shortest ramp length along the slope, to 1 decimal place?`,
    expression: `sin ${th}° = ${rise} ÷ L`, ...dec1(L), unit: 'm',
    hint: 'The ramp surface is the hypotenuse; the climb is opposite the slope angle.',
    steps: ['The ramp is the hypotenuse and the climb is opposite the angle: sin.', `sin ${lab(`${th}°`, 'slope angle')} = ${lab(rise, 'climb in m')} ÷ L, so L = ${rise} ÷ sin ${th}°.`, `L = ${lab(rise, 'climb in m')} ÷ ${String(sig5(sinD(th)))} ≈ ${fmt(r2(Ls))}, so L ≈ ${lab(s1(L), 'ramp length in m')}.`],
    visual: rtGeo(cosD(th) * 10, sinD(th) * 10, [null, `${rise} m`, 'L = ?'], 'left', `${th}°`),
    app: 'Accessibility codes set ramp angles; the builder turns them into lengths.',
  });
  return typed(q);
}
/** Transfer: a road grade given as a percentage becomes an angle. */
function gradeStep(rng: Rng): AskStep {
  const pc = pick(rng, [6, 8, 10, 12, 15, 20]); const th = atanD(pc / 100);
  const q = mkq(S('solve-right'), 'transfer-grade', {
    prompt: `A road sign warns of a ${pc}% grade (${pc} m of rise per 100 m of level run). What angle does the road make with the horizontal, to 1 decimal place?`,
    expression: `${pc}% grade = ${pc} m rise per 100 m run`, ...dec1(th), unit: '°',
    hint: 'A percentage grade is rise ÷ run. Which ratio is that?',
    steps: ['A grade is rise ÷ horizontal run, which is tan θ.', `tan θ = ${lab(pc, 'rise in m')} ÷ ${lab(100, 'level run in m')} = ${fmt(pc / 100)}.`, `θ = tan⁻¹(${fmt(pc / 100)}) ≈ ${fmt(r2(th))}°, so θ ≈ ${lab(`${s1(th)}°`, 'road angle')}.`],
    visual: rtGeo(100, pc * 2, ['100 m', `${pc} m`, null], 'left', 'θ = ?'),
    app: 'Road engineers quote grades as percentages; a 10% grade is steeper than it sounds.',
  });
  return typed(q);
}
/** Transfer (trial): height from two sightings d m apart. */
function twoSightStep(rng: Rng): AskStep {
  // The steps work with 4-dp tangents and a 2-dp x: keep only sightings where that arithmetic rounds like the exact h.
  const pool = [20, 25, 30].flatMap((al) => [40, 45, 50, 60].flatMap((be) => [50, 60, 80, 100, 120].map((d) => ({ al, be, d })))).filter(({ al, be, d }) => {
    const h = ((d * tanD(al)) / (tanD(be) - tanD(al))) * tanD(be); const ta = r4(tanD(al)); const tb = r4(tanD(be)); const xs = (d * ta) / (tb - ta);
    return Math.abs(h * 10 - Math.floor(h * 10) - 0.5) > 0.2 && safe1(h, xs * tb, r2(xs) * tb);
  });
  const { al, be, d } = pick(rng, pool);
  const x = (d * tanD(al)) / (tanD(be) - tanD(al)); const h = x * tanD(be); const xs = (d * r4(tanD(al))) / (r4(tanD(be)) - r4(tanD(al)));
  const q = mkq(S('solve-right'), 'transfer-two-sightings', {
    prompt: `A surveyor sights the top of a mast at ${al}° elevation, walks ${d} m straight toward it, and sights it again at ${be}°. How tall is the mast, to 1 decimal place?`,
    expression: `h = x tan ${be}° = (x + ${d}) tan ${al}°`, ...dec1(h), unit: 'm',
    hint: 'Call the distance from the nearer spot x. Write the height twice, once from each spot.',
    steps: [`From the near spot h = x tan ${lab(`${be}°`, 'near sighting')}; from the far spot h = (x + ${lab(d, 'walk in m')}) tan ${lab(`${al}°`, 'far sighting')}.`, `Set them equal: x (tan ${be}° − tan ${al}°) = ${d} tan ${al}°, so x = ${lab(d, 'walk in m')} × ${f4(tanD(al))} ÷ (${f4(tanD(be))} − ${f4(tanD(al))}) ≈ ${lab(fmt(r2(xs)), 'near distance in m')}.`, `h = x tan ${be}° ≈ ${lab(fmt(r2(xs)), 'near distance in m')} × ${f4(tanD(be))} ≈ ${lab(s1(h), 'mast height in m')}.`],
    visual: { type: 'geo', items: [
      { t: 'seg', a: [0, 0], b: [d, 0], label: `${d} m` }, { t: 'seg', a: [d, 0], b: [d + x, 0], label: 'x' }, { t: 'seg', a: [d + x, 0], b: [d + x, h], label: 'h = ?' },
      { t: 'seg', a: [0, 0], b: [d + x, h], dashed: true }, { t: 'seg', a: [d, 0], b: [d + x, h], dashed: true },
      { t: 'arc', at: [0, 0], from: [d, 0], to: [d + x, h], label: `${al}°` }, { t: 'arc', at: [d, 0], from: [d + x, 0], to: [d + x, h], label: `${be}°` }, { t: 'arc', at: [d + x, 0], from: [0, 0], to: [d + x, h], right: true },
    ] },
    app: 'Surveyors use two sightings when they cannot reach the foot of what they measure.',
  });
  return typed(q);
}

/* ======================= 3. special right triangles ======================= */
function specialVisual(th: 30 | 45 | 60): Visual {
  return th === 45 ? rtGeo(1, 1, ['1', '1', '√2'], 'left', '45°') : rtGeo(Math.sqrt(3), 1, ['√3', '1', '2'], th === 30 ? 'left' : 'top', `${th}°`);
}
const SPECIAL_SIDES: Record<number, { o: string; a: string; h: string }> = { 30: { o: '1', a: '√3', h: '2' }, 45: { o: '1', a: '1', h: '√2' }, 60: { o: '√3', a: '1', h: '2' } };
const RATIO_TXT: Record<string, string> = { '1/√2': '1/√2 = √2/2', '1/√3': '1/√3 = √3/3' };
function exactValueStep(rng: Rng): AskStep {
  const th = pick(rng, [30, 45, 60] as const); const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]);
  const s = SPECIAL_SIDES[th]; const [n, d] = f === 'sin' ? [s.o, s.h] : f === 'cos' ? [s.a, s.h] : [s.o, s.a];
  const raw = d === '1' ? n : `${n}/${d}`; const right = exact(f, th);
  const wrongs = f === 'tan' ? [exact('tan', 90 - th), exact('sin', th), ...rng.shuffle(EXACT_POOL)] : [exact(OTHER[f], th), exact('tan', th), ...rng.shuffle(EXACT_POOL)];
  const q = mkq(S('special'), 'exact-value', {
    prompt: `Vector draws the special triangle. Read ${f} ${th}° exactly.`,
    expression: `${f} ${th}° = ?`, answer: trigD(f, th), answerText: right,
    hint: `Stand at the ${th}° corner. Which side faces it, which touches it?`,
    steps: [`From the ${lab(`${th}°`, 'marked corner')}: ${lab(s.o, 'opposite')}, ${lab(s.a, 'adjacent')}, ${lab(s.h, 'hypotenuse')}.`, `${f} ${th}° = ${RATIO_TXT[raw] ?? raw}${RATIO_TXT[raw] ? '' : raw === right ? '' : ` = ${right}`}.`],
    visual: specialVisual(th),
  });
  return choose(rng, q, right, wrongs);
}
function specialSideQ(rng: Rng): Question {
  const s = pick(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]); const kind = pick(rng, ['short-hyp', 'hyp-short', '45-hyp', 'long-short'] as const);
  if (kind === 'short-hyp') return mkq(S('special'), 'special-side', { prompt: `A 30-60-90 brace has its short leg (facing 30°) ${s} m long. How long is the hypotenuse?`, expression: 'hypotenuse = ?', answer: 2 * s, unit: 'm', hint: 'Half an equilateral triangle: the short leg is half of which side?', steps: ['A 30-60-90 triangle is half an equilateral triangle, so the short leg is half the hypotenuse.', `hypotenuse = 2 × ${lab(s, 'short leg in m')} = ${lab(2 * s, 'hypotenuse in m')}.`], visual: rtGeo(Math.sqrt(3), 1, [null, `${s} m`, '?'], 'left', '30°') });
  if (kind === 'hyp-short') return mkq(S('special'), 'special-side', { prompt: `A 30-60-90 rafter has a hypotenuse of ${2 * s} m. How long is the leg facing the 30° angle?`, expression: 'short leg = ?', answer: s, unit: 'm', hint: 'Sides of 30-60-90 are in the ratio 1 : √3 : 2. Which one is the hypotenuse?', steps: ['Sides are 1 : √3 : 2, so the short leg is half the hypotenuse.', `short leg = ${lab(2 * s, 'hypotenuse in m')} ÷ 2 = ${lab(s, 'short leg in m')}.`], visual: rtGeo(Math.sqrt(3), 1, [null, '?', `${2 * s} m`], 'left', '30°') });
  if (kind === '45-hyp') return mkq(S('special'), 'special-side', { prompt: `A 45° corner brace has a hypotenuse of ${rt(s, 2)} m. How long is each leg?`, expression: 'leg = ?', answer: s, unit: 'm', hint: 'Half a square: the hypotenuse is a leg times √2.', steps: ['A 45-45-90 triangle is half a square: hypotenuse = leg × √2.', `leg = ${lab(rt(s, 2), 'hypotenuse in m')} ÷ √2 = ${lab(s, 'leg in m')}.`], visual: rtGeo(1, 1, ['?', null, `${rt(s, 2)} m`], 'left', '45°') });
  return mkq(S('special'), 'special-side', { prompt: `A 30-60-90 truss has its long leg ${rt(s, 3)} m. How long is the short leg?`, expression: 'short leg = ?', answer: s, unit: 'm', hint: 'Long leg = short leg × √3.', steps: ['In 30-60-90, long leg = short leg × √3.', `short leg = ${lab(rt(s, 3), 'long leg in m')} ÷ √3 = ${lab(s, 'short leg in m')}.`], visual: rtGeo(Math.sqrt(3), 1, [`${rt(s, 3)} m`, '?', null], 'left', '30°') });
}
const specialSideStep = (rng: Rng) => typed(specialSideQ(rng));
function specialChooseStep(rng: Rng): AskStep {
  const s = pick(rng, [2, 3, 4, 5, 6, 7, 8]); const kind = pick(rng, ['long', 'hyp45', 'long-from-hyp'] as const);
  if (kind === 'hyp45') {
    const q = mkq(S('special'), 'special-exact', { prompt: `A square gate ${s} m on a side needs a diagonal brace. How long is it, exactly?`, expression: 'brace = ?', answer: s * Math.SQRT2, answerText: `${rt(s, 2)} m`, hint: 'The diagonal cuts the square into two 45-45-90 triangles.', steps: ['The diagonal makes two 45-45-90 triangles: hypotenuse = leg × √2.', `brace = ${lab(s, 'gate side in m')} × √2 = ${lab(rt(s, 2), 'brace in m')}.`], visual: rtGeo(1, 1, [`${s} m`, `${s} m`, '?'], 'left', '45°') });
    return choose(rng, q, `${rt(s, 2)} m`, [`${2 * s} m`, `${rt(s, 3)} m`, `${rt(2 * s, 2)} m`]);
  }
  if (kind === 'long') {
    const q = mkq(S('special'), 'special-exact', { prompt: `A 30-60-90 truss has short leg ${s} m. How long is the long leg, exactly?`, expression: 'long leg = ?', answer: s * Math.sqrt(3), answerText: `${rt(s, 3)} m`, hint: 'Sides 1 : √3 : 2. The long leg faces 60°.', steps: ['Sides of 30-60-90 are 1 : √3 : 2 (short : long : hypotenuse).', `long leg = ${lab(s, 'short leg in m')} × √3 = ${lab(rt(s, 3), 'long leg in m')}.`], visual: rtGeo(Math.sqrt(3), 1, ['?', `${s} m`, null], 'left', '30°') });
    return choose(rng, q, `${rt(s, 3)} m`, [`${2 * s} m`, `${rt(s, 2)} m`, `${rt(2 * s, 3)} m`]);
  }
  const q = mkq(S('special'), 'special-exact', { prompt: `A 30-60-90 truss has hypotenuse ${2 * s} m. How long is the long leg, exactly?`, expression: 'long leg = ?', answer: s * Math.sqrt(3), answerText: `${rt(s, 3)} m`, hint: 'Find the short leg first, then scale by √3.', steps: [`Short leg = half the hypotenuse = ${lab(2 * s, 'hypotenuse in m')} ÷ 2 = ${lab(s, 'short leg in m')}.`, `Long leg = short leg × √3 = ${lab(s, 'short leg in m')} × √3 = ${lab(rt(s, 3), 'long leg in m')}.`], visual: rtGeo(Math.sqrt(3), 1, ['?', null, `${2 * s} m`], 'left', '30°') });
  return choose(rng, q, `${rt(s, 3)} m`, [`${s} m`, `${rt(2 * s, 3)} m`, `${rt(s, 2)} m`]);
}
function acuteCircleStep(rng: Rng): AskStep {
  const th = pick(rng, [30, 45, 60]); const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]);
  const v = exact(f, th);
  const q = mkq(S('special'), 'acute-from-value', {
    prompt: `Volt needs the acute angle with ${f} θ = ${v}. Turn the dial to it.`,
    expression: `${f} θ = ${v}, 0° < θ < 90°`, answer: th,
    hint: 'Picture the 30-60-90 and 45-45-90 triangles. Which corner gives this ratio?',
    steps: [`From the special triangle, ${f} ${th}° = ${v}.`, `So θ = ${th}°.`],
  });
  return model(q, { kind: 'angle', max: 180, step: 15, label: `${f} θ = ${v}` }, [String(th)], 'Turn the dial to the acute angle with that value.');
}
function doubleTrapStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]);
  const v60 = trigD(f, 60); const v2 = 2 * trigD(f, 30);
  const q = mkq(S('special'), 'double-trap', {
    prompt: `Brick says: "30° doubled is 60°, so ${f} 60° must be 2 × ${f} 30°." Is he right?`,
    expression: `${f} 60° ≟ 2 ${f} 30°`, answer: 0,
    hint: `Read both exact values from the 30-60-90 triangle and compare.`,
    steps: [`${f} 60° = ${exact(f, 60)} ${eq2(v60)} ${fmt(r2(v60))}.`, `2 × ${f} 30° = 2 × ${exact(f, 30)} ${eq2(v2)} ${fmt(r2(v2))}.`, 'Trig functions are not proportional to the angle: doubling the angle does not double the value.'],
    visual: specialVisual(30),
  });
  return choose(rng, q, `No: ${f} 60° ${eq2(v60)} ${fmt(r2(v60))} but 2 ${f} 30° ${eq2(v2)} ${fmt(r2(v2))}`, ['Yes: double the angle, double the value', `Yes: both equal ${exact(f, 60)}`, 'Only when the triangle is large enough']);
}
/** Special triangles: the rational cells (sin 30°, tan 45°, cos 60°) of the 30/45/60 table. */
function exactTableStep(rng: Rng): AskStep {
  const angles = [30, 45, 60];
  const cells: { r: number; c: number; v: number }[] = [];
  const rows: (number | string | null)[][] = angles.map((d, ri) => [`${d}°`, ...(['sin', 'cos', 'tan'] as TF[]).map((f, ci) => {
    const e = exact(f, d);
    if (!e.includes('√')) cells.push({ r: ri, c: ci + 1, v: trigD(f, d) });
    return e;
  })]);
  const blanks = rng.shuffle(cells).slice(0, rint(rng, 2, 3)).sort((a, b) => a.r - b.r || a.c - b.c);
  for (const b of blanks) rows[b.r][b.c] = null;
  const vals = blanks.map((b) => Math.round(b.v * 1e9) / 1e9);
  const q = mkq(S('special'), 'exact-table', {
    prompt: 'Vector\'s table of exact values has holes. Fill the blanks from the special triangles.',
    expression: 'sin, cos, tan at 30°, 45°, 60°', answer: vals[0],
    hint: 'Stand at each corner of the two special triangles: which two sides does each ratio use?',
    steps: ['30-60-90 sides 1 : √3 : 2; 45-45-90 sides 1 : 1 : √2.', 'sin 30° = 1/2 (short leg over hypotenuse), tan 45° = 1/1 = 1, cos 60° = 1/2 (the short leg touches 60°).', `Blanks in order: ${vals.map((v) => fmt(v)).join(', ')}.`],
    visual: specialVisual(30),
  });
  return model(q, { kind: 'table', cols: ['θ', 'sin θ', 'cos θ', 'tan θ'], rows, label: 'Exact values' }, combos(vals.map(numForms)), 'Type each missing value (1/2 or 0.5 both work).');
}
function trussStep(rng: Rng): AskStep {
  const s = pick(rng, [2, 3, 4, 5, 6, 8]);
  const q = mkq(S('special'), 'transfer-truss', {
    prompt: `An equilateral roof truss has sides of ${2 * s} m. How tall is it at the peak, exactly?`,
    expression: 'height = ?', answer: s * Math.sqrt(3), answerText: `${rt(s, 3)} m`,
    hint: 'Drop the height from the peak: it cuts the truss into two 30-60-90 triangles.',
    steps: ['The height splits the equilateral truss into two 30-60-90 triangles.', `Short leg = half the base = ${lab(2 * s, 'truss side in m')} ÷ 2 = ${lab(s, 'short leg in m')}; the hypotenuse is a whole side.`, `Height = long leg = ${lab(s, 'short leg in m')} × √3 = ${lab(rt(s, 3), 'height in m')}.`],
    visual: { type: 'geo', items: [{ t: 'poly', pts: [[0, 0], [2, 0], [1, Math.sqrt(3)]], labels: [`${2 * s} m`, `${2 * s} m`, `${2 * s} m`] }, { t: 'seg', a: [1, 0], b: [1, Math.sqrt(3)], dashed: true, label: 'h = ?' }] },
  });
  return choose(rng, q, `${rt(s, 3)} m`, [`${s} m`, `${rt(2 * s, 3)} m`, `${rt(s, 2)} m`]);
}
/** Transfer: a hex nut is six equilateral triangles, so its width across the flats is side × √3. */
function hexNutStep(rng: Rng): AskStep {
  const s = pick(rng, [4, 6, 8, 10, 12]);
  const hex = [0, 60, 120, 180, 240, 300].map((d): P2 => [cosD(d), sinD(d)]);
  const q = mkq(S('special'), 'transfer-hex-nut', {
    prompt: `A hexagonal nut has sides of ${s} mm. How wide is it across the flats (the wrench size), exactly?`,
    expression: 'width across flats = ?', answer: s * Math.sqrt(3), answerText: `${rt(s, 3)} mm`,
    hint: 'A regular hexagon is six equilateral triangles meeting at the centre. Split one in half.',
    steps: [`The hexagon is six equilateral triangles with sides of ${lab(s, 'side in mm')}.`, `Half of one is a 30-60-90 triangle: hypotenuse ${lab(s, 'side in mm')}, short leg ${lab(s / 2, 'half side in mm')}, so the long leg is ${lab(rt(s / 2, 3), 'centre to flat in mm')}.`, `Across the flats is twice that: ${lab(rt(s, 3), 'wrench size in mm')}.`],
    visual: { type: 'geo', items: [{ t: 'poly', pts: hex, labels: [`${s} mm`, '', '', '', '', ''] }, { t: 'seg', a: [0, sinD(60)], b: [0, -sinD(60)], dashed: true, label: '?' }] },
    app: 'Wrench sizes are the width across the flats, never across the corners.',
  });
  return choose(rng, q, `${rt(s, 3)} mm`, [`${2 * s} mm`, `${rt(s / 2, 3)} mm`, `${rt(s, 2)} mm`]);
}

/* ======================= 4. angles in standard position ======================= */
/** A multiple of 5 in (0°, 360°) that is not on an axis. */
const mult5 = (rng: Rng) => { let d = 0; do { d = 5 * rint(rng, 1, 71); } while (d % 90 === 0); return d; };
const PLACE = (qi: number, ref: number) => [dg(ref), `180° − ${dg(ref)}`, `180° + ${dg(ref)}`, `360° − ${dg(ref)}`][qi];
const REF_RULE = ['θ itself', '180° − θ', 'θ − 180°', '360° − θ'];

function coterminalQ(rng: Rng): Question {
  const base = mult5(rng); const k = pick(rng, [-2, -1, 1, 2]); const given = base + 360 * k;
  return mkq(S('angles'), 'coterminal', {
    prompt: given < 0 ? `A radar arm turns ${-given}° clockwise from east (an angle of ${dg(given)}). Where does it point, as an angle from 0° to 360°?` : `A radar arm spins ${given}° counterclockwise from east. Where does it point, as an angle from 0° to 360°?`,
    expression: `${dg(given)} → between 0° and 360°`, answer: base, unit: '°',
    hint: 'A full turn is 360°. Adding or removing whole turns lands on the same ray.',
    steps: ['Coterminal angles share a terminal side: they differ by whole turns of 360°.', given < 0 ? `${lab(dg(given), 'turn')} + ${lab(`${-360 * k}°`, Math.abs(k) === 1 ? 'one full turn' : 'two full turns')} = ${lab(dg(base), 'pointing angle')}.` : `${lab(dg(given), 'turn')} − ${lab(`${360 * k}°`, Math.abs(k) === 1 ? 'one full turn' : 'two full turns')} = ${lab(dg(base), 'pointing angle')}.`, `The arm points along ${dg(base)}.`],
    app: 'Radar, cranes and turbines keep spinning past 360°; the controller only cares where they point.',
  });
}
function coterminalDialStep(rng: Rng): AskStep {
  const q = coterminalQ(rng);
  return model(q, { kind: 'angle', max: 360, step: 5, label: 'Where does the arm point?' }, [String(q.answer)], 'Remove or add whole turns, then turn the dial.');
}
function coterminalChooseStep(rng: Rng): AskStep {
  const th = mult5(rng); const right = rng.next() < 0.5 ? th + 360 : th - 360;
  const q = mkq(S('angles'), 'coterminal-pick', {
    prompt: `Volt's beacon points along ${dg(th)}. Which angle points the same way?`,
    expression: `coterminal with ${dg(th)}`, answer: right,
    hint: 'Same way means the same terminal side: whole turns apart.',
    steps: ['Coterminal angles differ by a multiple of 360°.', `${dg(right)} ${right > th ? '−' : '+'} ${lab('360°', 'full turn')} = ${lab(dg(th), 'beacon angle')}, so it points the same way.`, 'Adding 180° points the opposite way; negating reflects across the x-axis.'],
    visual: { type: 'unitcircle', angle: th },
  });
  // Each distractor points a different way (−θ and 360° − θ would be the same ray, so only −θ is used).
  const dirs = new Set([n360(th)]); const wrongs: string[] = [];
  for (const w of [th + 180, -th, th + 90, th - 90, 180 - th]) if (!dirs.has(n360(w))) { dirs.add(n360(w)); wrongs.push(dg(w)); }
  return choose(rng, q, dg(right), wrongs);
}
function referenceCase(rng: Rng) {
  let base = mult5(rng); while (base < 90) base = mult5(rng);
  const given = rng.next() < 0.3 ? base + pick(rng, [360, -360]) : base; const ref = refAngle(base); const qi = quadIndex(base);
  const q = mkq(S('angles'), 'reference', {
    prompt: `A surveyor's sight line sits at ${dg(given)} in standard position. What is its reference angle?`,
    expression: `reference angle of ${dg(given)}`, answer: ref, unit: '°',
    hint: 'The reference angle is the acute angle between the terminal side and the x-axis, never the y-axis.',
    steps: ['The reference angle is the acute angle to the nearest part of the x-axis.', ...(given !== base ? [`${dg(given)} is coterminal with ${dg(base)}.`] : []), `${dg(base)} is in ${QUADS[qi]}, so use ${REF_RULE[qi]}: ${lab(dg(ref), 'reference angle')}.`],
    visual: { type: 'unitcircle', angle: base },
  });
  return { q, base, ref };
}
const referenceQ = (rng: Rng) => referenceCase(rng).q;
function referenceDialStep(rng: Rng): AskStep {
  const q = referenceQ(rng);
  return model(q, { kind: 'angle', max: 180, step: 5, label: 'Set the reference angle' }, [String(q.answer)], 'Turn the dial to the reference angle.');
}
function referenceChooseStep(rng: Rng): AskStep {
  // A 45° reference angle hides the y-axis mistake (90° − 45° = 45°), so the choose version avoids it.
  let c = referenceCase(rng); for (let g = 0; g < 20 && c.ref === 45; g++) c = referenceCase(rng);
  const { q, base, ref } = c;
  const wrongs = [90 - ref, 360 - base, base - 180, 180 - base, 90 + ref, 180 - ref, base % 180, 2 * ref, ref + 30].filter((v) => v > 0 && v !== ref && v < 360);
  return choose(rng, { ...q, unit: undefined }, dg(ref), wrongs.map(dg));
}
function quadrantStep(rng: Rng): AskStep {
  const base = mult5(rng); const k = pick(rng, [-2, -1, 0, 1]); const given = base + 360 * k;
  const q = mkq(S('angles'), 'quadrant', {
    prompt: `A wind vane reads ${dg(given)} in standard position. Which quadrant does it point into?`,
    expression: `${dg(given)} lies in …`, answer: quadIndex(base) + 1,
    hint: given < 0 ? 'Negative angles turn clockwise. Add 360° until you are between 0° and 360°.' : 'Remove whole turns of 360° first if you need to.',
    steps: [...(k !== 0 ? [`${dg(given)} ${k < 0 ? '+' : '−'} ${lab(`${Math.abs(k) * 360}°`, Math.abs(k) === 1 ? 'one full turn' : 'two full turns')} = ${lab(dg(base), 'same terminal side')}.`] : []), `${dg(base)} is between ${quadIndex(base) * 90}° and ${quadIndex(base) * 90 + 90}°: ${QUADS[quadIndex(base)]}.`],
  });
  return choose(rng, q, QUADS[quadIndex(base)], QUADS.filter((x) => x !== QUADS[quadIndex(base)]));
}
const DIRS: Record<number, P2> = { 0: [1, 0], 45: [1, 1], 90: [0, 1], 135: [-1, 1], 180: [-1, 0], 225: [-1, -1], 270: [0, -1], 315: [1, -1] };
function terminalPointStep(rng: Rng): AskStep {
  const base = pick(rng, [45, 135, 225, 315, 45, 135, 225, 315, 90, 180, 270]); const k = pick(rng, [-1, 1, 0]); const given = base + 360 * k;
  const [dx, dy] = DIRS[base]; const pts = [1, 2, 3, 4, 5].map((t) => `${t * dx},${t * dy}`);
  const q = mkq(S('angles'), 'terminal-side', {
    prompt: `Angles start on the positive x-axis and turn counterclockwise (clockwise if negative). Tap any point on the terminal side of ${dg(given)}.`,
    expression: `terminal side of ${dg(given)}`, answer: base,
    hint: 'Find where the angle stops turning. The ray from the origin through that direction is the terminal side.',
    steps: [...(k !== 0 ? [`${dg(given)} is coterminal with ${dg(base)}.`] : []), `${dg(base)} points ${base % 90 === 0 ? 'along an axis' : `halfway between the axes of ${QUADS[quadIndex(base)]}`}.`, `Points like (${fmt(dx)}, ${fmt(dy)}) and (${fmt(2 * dx)}, ${fmt(2 * dy)}) lie on that ray.`],
  });
  return model(q, { kind: 'plot', range: [-5, 5, -5, 5], count: 1, label: `Terminal side of ${dg(given)}` }, pts, 'Tap one lattice point on the terminal side.');
}
function turbineStep(rng: Rng): AskStep {
  const start = pick(rng, [0, 90, 180, 270]); const turn = mult5(rng) + 360 * pick(rng, [1, 2, 3]); const cw = rng.next() < 0.5;
  const end = n360(start + (cw ? -turn : turn));
  const q = mkq(S('angles'), 'transfer-turbine', {
    prompt: `A turbine blade starts at ${dg(start)} and turns ${turn}° ${cw ? 'clockwise' : 'counterclockwise'}. At what angle from 0° to 360° does it stop?`,
    expression: `${dg(start)} ${cw ? '−' : '+'} ${turn}°`, answer: end, unit: '°',
    hint: `${cw ? 'Clockwise turns count as negative.' : 'Counterclockwise turns count as positive.'} Then remove whole turns.`,
    steps: [`${cw ? 'Clockwise is negative' : 'Counterclockwise is positive'}: ${lab(dg(start), 'start angle')} ${cw ? '−' : '+'} ${lab(`${turn}°`, 'turn')} = ${dg(start + (cw ? -turn : turn))}.`, `Add or remove whole turns of 360° to land between 0° and 360°: ${lab(dg(end), 'stopping angle')}.`],
  });
  return typed(q);
}
function clockHandStep(rng: Rng): AskStep {
  const m = pick(rng, [5, 10, 20, 25, 35, 40, 50, 55]); const ang = n360(90 - 6 * m);
  const q = mkq(S('angles'), 'transfer-clock', {
    prompt: `A clock's minute hand starts at 12, which is 90° in standard position. Where is it after ${m} minutes, as an angle from 0° to 360°?`,
    expression: `90° − 6° × ${m}`, answer: ang, unit: '°',
    hint: 'Clock hands turn clockwise, so in standard position their angle goes down. Each minute is 360° ÷ 60.',
    steps: [`${lab('360°', 'full turn')} ÷ ${lab(60, 'minutes')} = ${lab('6°', 'turn per minute')}, clockwise, so subtract.`, `${lab('90°', 'start at twelve')} − ${lab('6°', 'per minute')} × ${lab(m, 'minutes')} = 90° − ${6 * m}° = ${90 - 6 * m < 0 ? dg(90 - 6 * m) : lab(dg(ang), 'hand angle')}.`, ...(90 - 6 * m < 0 ? [`Add ${lab('360°', 'full turn')}: ${lab(dg(ang), 'hand angle')}.`] : [])],
  });
  return typed(q);
}

/* ======================= 5. radians & arc length ======================= */
function toRadiansStep(rng: Rng): AskStep {
  const deg = pick(rng, [30, 45, 60, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330]);
  const g = gcd(deg, 180); const n = deg / g; const d = 180 / g;
  const q = mkq(S('radians'), 'to-radians', {
    prompt: `Newton's gear controller only takes radians. Convert ${dg(deg)}.`,
    expression: `${dg(deg)} = ? rad`, answer: (deg * Math.PI) / 180, answerText: degToPi(deg),
    hint: 'A half turn is 180°, and also π radians. What fraction of a half turn is this?',
    steps: ['180° = π radians, so multiply by π/180.', `${lab(deg, 'degrees')} × π/180 = ${lab(degToPi(deg), 'radians')}.`],
    visual: { type: 'unitcircle', angle: deg },
  });
  return choose(rng, q, degToPi(deg), [n !== d ? piStr(d, n) : piStr(2 * n, d), piStr(n, 2 * d), fracStr(n, d), piStr(2 * n, d)]);
}
function radToDegDialStep(rng: Rng): AskStep {
  const deg = 15 * rint(rng, 1, 23);
  const q = mkq(S('radians'), 'to-degrees', {
    prompt: `The controller reports ${degToPi(deg)} radians. Turn the dial to the same angle in degrees.`,
    expression: `${degToPi(deg)} rad = ?°`, answer: deg, unit: '°',
    hint: 'Replace π with 180° and simplify.',
    steps: ['π radians = 180°, so multiply by 180°/π (in effect, replace π with 180°).', `${degToPi(deg)} → ${degToPi(deg).replace('π', ' × 180°').replace(/^ × /, '')} = ${dg(deg)}.`],
  });
  return model(q, { kind: 'angle', max: 360, step: 15, label: lab(degToPi(deg), 'radians') }, [String(deg)], 'Convert to degrees and turn the dial.');
}
function radianSliderStep(rng: Rng): AskStep {
  let deg = 10; let rad = 0;
  for (let g = 0; g < 40; g++) { deg = 10 * rint(rng, 2, 35); if (deg % 90 === 0 && g < 30) continue; rad = (deg * Math.PI) / 180; const f = rad * 10 - Math.floor(rad * 10); if (Math.abs(f - 0.5) > 0.08) break; }
  rad = (deg * Math.PI) / 180;
  const q = mkq(S('radians'), 'radian-size', {
    prompt: `One radian is the angle whose arc is one radius long. About how many radians is ${dg(deg)}?`,
    expression: `${dg(deg)} ≈ ? rad`, answer: r1(rad),
    hint: 'π ≈ 3.14 radians is a half turn (180°). Scale from there.',
    steps: ['180° = π ≈ 3.1416 radians.', `${lab(deg, 'degrees')} × π/180 ≈ ${lab(f4(rad), 'radians')}, so about ${s1(rad)} radians.`],
    visual: { type: 'unitcircle', angle: deg },
  });
  return model(q, { kind: 'slider', min: 0, max: 6.3, step: 0.1, label: 'θ in radians', unit: 'rad' }, [fmt(r1(rad))], 'Slide to the angle in radians, to 1 decimal place.');
}
function arcQ(rng: Rng): Question {
  const v = pick(rng, ['rad', 'deg', 'find'] as const);
  if (v === 'rad') {
    const r = rint(rng, 2, 12); const th = pick(rng, [0.5, 1.5, 2, 2.5, 3]); const s = r * th;
    return mkq(S('radians'), 'arc-length', { prompt: `A pulley of radius ${r} cm turns through ${th} radians. How much belt passes over it?`, expression: `s = rθ = ${r} × ${th}`, answer: s, unit: 'cm', hint: 'In radians, arc length is simply radius times angle.', steps: ['With θ in radians, s = rθ.', `s = ${lab(r, 'radius in cm')} × ${lab(th, 'turn in radians')} = ${lab(fmt(s), 'belt in cm')}.`], visual: { type: 'circle', r, unit: 'cm', show: 'r', wheel: true } });
  }
  if (v === 'find') {
    const r = rint(rng, 2, 10); const th = pick(rng, [0.5, 1.5, 2, 2.5, 3, 4]); const s = r * th;
    return mkq(S('radians'), 'arc-angle', { prompt: `A winch drum of radius ${r} cm pulls in ${fmt(s)} cm of cable. Through how many radians did it turn?`, expression: `θ = s ÷ r`, answer: th, unit: 'rad', hint: 's = rθ. Undo the multiplication.', steps: ['s = rθ with θ in radians, so θ = s ÷ r.', `θ = ${lab(fmt(s), 'cable in cm')} ÷ ${lab(r, 'radius in cm')} = ${lab(fmt(th), 'turn in radians')}.`], visual: { type: 'circle', r, unit: 'cm', show: 'r', wheel: true } });
  }
  const r = pick(rng, [3, 4, 5, 6, 8, 9, 10, 12]); const deg = pick(rng, [30, 45, 60, 90, 120, 135, 150, 210, 240, 270]); const s = (r * deg * Math.PI) / 180;
  return mkq(S('radians'), 'arc-length', { prompt: `A gear of radius ${r} cm turns ${dg(deg)}. How far does a point on its rim travel, to 1 decimal place?`, expression: `s = rθ, θ in radians`, ...dec1(s), unit: 'cm', hint: 's = rθ only works with θ in radians. Convert first.', steps: ['s = rθ needs θ in radians.', `${lab(dg(deg), 'turn')} = ${degToPi(deg)} rad.`, `s = ${lab(r, 'radius in cm')} × ${degToPi(deg)} ≈ ${f4(s)}, so s ≈ ${lab(s1(s), 'rim travel in cm')}.`], visual: { type: 'circle', r, unit: 'cm', show: 'r', wheel: true } });
}
const arcStep = (rng: Rng) => typed(arcQ(rng));
function arcTrapStep(rng: Rng): AskStep {
  const r = pick(rng, [3, 4, 5, 6, 8, 10]); const deg = pick(rng, [30, 45, 60, 90, 120, 150]); const rad = (deg * Math.PI) / 180; const s = r * rad;
  const q = mkq(S('radians'), 'arc-trap', {
    prompt: `A ropeway bullwheel of radius ${r} m turns ${dg(deg)}. How much cable passes over it?`,
    expression: `s = rθ`, answer: s,
    hint: 'Check the units of θ before you multiply.',
    steps: ['s = rθ only holds with θ in radians.', `${lab(dg(deg), 'turn')} = ${degToPi(deg)} ≈ ${f4(rad)} rad.`, `s = ${lab(r, 'radius in m')} × ${lab(f4(rad), 'turn in radians')} ≈ ${lab(s1(s), 'cable in m')}, not ${r} × ${deg}.`],
    visual: { type: 'circle', r, unit: 'm', show: 'r', wheel: true },
  });
  return choose(rng, q, `${s1(s)} m`, [`${r * deg} m`, `${s1(2 * s)} m`, `${s1(0.5 * r * r * rad)} m`, `${s1(s / 2)} m`]);
}
function angularQ(rng: Rng): Question {
  const v = pick(rng, ['v', 'omega', 'rpm'] as const);
  if (v === 'v') {
    const r = pick(rng, [0.2, 0.25, 0.4, 0.5, 1.5, 2]); const w = pick(rng, [2, 4, 6, 8, 10, 12]); const sp = r2(r * w);
    return mkq(S('radians'), 'angular-speed', { prompt: `A winch drum of radius ${r} m spins at ${w} rad/s. How fast does the cable wind in, in m/s?`, expression: 'v = rω', answer: sp, unit: 'm/s', hint: 'Each radian of turn winds in one radius of cable.', steps: ['Arc length is rθ, so each second the drum winds in r × ω.', `v = ${lab(r, 'radius in m')} × ${lab(w, 'spin in rad/s')} = ${lab(fmt(sp), 'cable speed in m/s')}.`] });
  }
  if (v === 'omega') {
    const w = rint(rng, 2, 9); const t = rint(rng, 2, 6); const th = w * t;
    return mkq(S('radians'), 'angular-speed', { prompt: `A turbine shaft turns ${th} radians in ${t} seconds. What is its angular speed in rad/s?`, expression: 'ω = θ ÷ t', answer: w, unit: 'rad/s', hint: 'Angular speed is angle turned per second.', steps: ['ω = angle ÷ time.', `ω = ${lab(th, 'radians turned')} ÷ ${lab(t, 'seconds')} = ${lab(w, 'angular speed in rad/s')}.`] });
  }
  const rpm = pick(rng, [30, 45, 60, 90, 120, 300]); const w = (rpm * 2 * Math.PI) / 60;
  return mkq(S('radians'), 'rpm', { prompt: `A pump shaft runs at ${rpm} revolutions per minute. What is its angular speed in rad/s, to 1 decimal place?`, expression: `ω = ${rpm} × 2π ÷ 60`, ...dec1(w), unit: 'rad/s', hint: 'One revolution is 2π radians; one minute is 60 seconds.', steps: ['1 revolution = 2π rad and 1 minute = 60 s.', `ω = ${lab(rpm, 'revolutions per minute')} × 2π ÷ ${lab(60, 'seconds per minute')} = ${piStr(rpm, 30)} ≈ ${lab(s1(w), 'angular speed in rad/s')}.`] });
}
const angularStep = (rng: Rng) => typed(angularQ(rng));
/** Transfer: a bicycle wheel rolls one circumference per turn. */
function bikeWheelStep(rng: Rng): AskStep {
  const r = pick(rng, [0.3, 0.35, 0.4]); const n = pick(rng, [10, 20, 50]); const L = 2 * Math.PI * r * n;
  const q = mkq(S('radians'), 'transfer-bike', {
    prompt: `A bicycle wheel has radius ${r} m. How far does the bike roll in ${n} full turns of the wheel, to 1 decimal place?`,
    expression: `θ = ${n} × 2π rad, s = rθ`, ...dec1(L), unit: 'm',
    hint: 'A full turn is 2π radians. The ground under the tyre is the arc the rim unrolls.',
    steps: [`${lab(n, 'turns')} × 2π = ${2 * n}π radians.`, `The bike rolls the arc the rim unrolls: s = rθ = ${lab(r, 'radius in m')} × ${2 * n}π = ${fmt(r * 2 * n)}π ≈ ${lab(s1(L), 'distance in m')}.`],
    visual: { type: 'circle', r, unit: 'm', show: 'r', wheel: true },
    app: 'Bike computers count wheel turns and multiply by the circumference.',
  });
  return typed(q);
}
/** Misconception probe: π radians is a half turn, but π itself is about 3.14, not 180. */
function piTrapStep(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const q = mkq(S('radians'), 'pi-value', {
      prompt: 'Newton sets a shaft to θ = π radians. As a plain number, about how many radians is that?',
      expression: 'π rad = ? rad', answer: Math.PI,
      hint: 'π on its own is the circle constant from C = 2πr, a plain number. "π radians" counts that many radii of arc.',
      steps: ['π is a number: π ≈ 3.14.', 'π radians ≈ 3.14 radians, a half turn. That half turn is 180° in degrees, so "π = 180" only compares two units for the same turn.'],
      visual: { type: 'unitcircle', angle: 180, radians: true },
    });
    return choose(rng, q, '≈ 3.14 rad', ['180 rad', '360 rad', '1 rad']);
  }
  const r = pick(rng, [2, 3, 4, 5]); const s = r * Math.PI;
  const q = mkq(S('radians'), 'pi-arc', {
    prompt: `A pulley of radius ${r} m turns π radians. How much belt passes over it?`,
    expression: `s = rθ = ${r} × π`, answer: s,
    hint: 'In s = rθ, θ is a number of radians. What number is π?',
    steps: ['s = rθ with θ in radians.', `s = ${lab(r, 'radius in m')} × π ≈ ${r} × 3.14 ≈ ${lab(s1(s), 'belt in m')}.`, `Not ${r} × 180 = ${r * 180} m: π radians is 180°, but π itself is about 3.14.`],
    visual: { type: 'circle', r, unit: 'm', show: 'r', wheel: true },
  });
  return choose(rng, q, `≈ ${s1(s)} m`, [`${r * 180} m`, `${r * 360} m`, `≈ ${s1(s / 2)} m`]);
}
/** Arc model: slide the drum angle θ (radians) until s = rθ reaches the cable needed. */
function arcSliderStep(rng: Rng): AskStep {
  const r = pick(rng, [2, 3, 4, 5]); const th = pick(rng, [0.5, 1.2, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]); const s = Math.round(r * th * 100) / 100;
  const q = mkq(S('radians'), 'arc-slider', {
    prompt: `A winch drum of radius ${r} m must pay out ${fmt(s)} m of cable. Slide the drum angle θ, in radians, to the turn that does it.`,
    expression: `s = rθ: ${r}θ = ${fmt(s)}`, answer: th, unit: 'rad',
    hint: 'Each radian of turn pays out one radius of cable. How many radii is the cable?',
    steps: ['With θ in radians, s = rθ, so θ = s ÷ r.', `θ = ${lab(fmt(s), 'cable in m')} ÷ ${lab(r, 'radius in m')} = ${lab(fmt(th), 'turn in radians')}: the cable is ${fmt(th)} radii long.`],
  });
  return model(q, { kind: 'slider', min: 0, max: 6.3, step: 0.1, label: 'θ in radians', unit: 'rad', range: [0, 6.3, 0, r * 6.3 + 1], layers: { fns: [{ fn: { kind: 'poly', c: [0, r] }, label: 's = rθ' }], hlines: [{ y: s, label: `${fmt(s)} m` }] } }, [fmt(th)], `Slide θ until s = rθ reaches ${lab(fmt(s), 'metres of cable')}.`);
}
function minuteArcStep(rng: Rng): AskStep {
  const L = pick(rng, [6, 9, 12, 15]); const m = pick(rng, [10, 20, 40, 45]); const th = (m / 60) * 2 * Math.PI; const s = L * th;
  const q = mkq(S('radians'), 'transfer-clock', {
    prompt: `A tower clock's minute hand is ${L} cm long. How far does its tip travel in ${m} minutes, to 1 decimal place?`,
    expression: `θ = ${m}/60 of 2π`, ...dec1(s), unit: 'cm',
    hint: 'What fraction of a full turn is this? A full turn is 2π radians.',
    steps: [`${lab(m, 'minutes')} ÷ ${lab(60, 'minutes per turn')} = ${lab(fracStr(m, 60), 'of a turn')}: θ = ${fracStr(m, 60)} × 2π = ${piStr(m, 30)} rad.`, `s = rθ = ${lab(L, 'hand length in cm')} × ${piStr(m, 30)} ≈ ${lab(s1(s), 'tip travel in cm')}.`],
  });
  return typed(q);
}

/* ======================= 6. unit circle ======================= */
const coordTxt = (d: number) => `(${exact('cos', d)}, ${exact('sin', d)})`;
function ucCoordStep(rng: Rng): AskStep {
  const d = pick(rng, NONQUAD);
  const q = mkq(S('unit-circle'), 'coords-to-angle', {
    prompt: `Vector's beacon sits at ${coordTxt(d)} on the unit circle. Tap its angle.`,
    expression: `(cos θ, sin θ) = ${coordTxt(d)}`, answer: d,
    hint: 'The signs give the quadrant. The sizes (1/2, √2/2, √3/2) give the reference angle.',
    steps: ['On the unit circle, the point at angle θ is (cos θ, sin θ).', `Signs ${exact('cos', d).startsWith('−') ? '−' : '+'}, ${exact('sin', d).startsWith('−') ? '−' : '+'} put it in ${QUADS[quadIndex(d)]}; the sizes give reference angle ${dg(refAngle(d))}.`, `So θ = ${dg(d)}.`],
  });
  return model(q, { kind: 'unitcircle', label: coordTxt(d) }, [String(d)], 'Tap the angle whose point has these coordinates.');
}
function ucValueStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'cos', 'sin', 'tan'] as TF[]); const d = pick(rng, NONQUAD.filter((x) => quadIndex(x) > 0));
  const right = exact(f, d); const other = f === 'tan' ? exact('tan', 90 - refAngle(d)) : exact(OTHER[f], d);
  const q = mkq(S('unit-circle'), 'exact-any', {
    prompt: `Volt's survey arm points at ${dg(d)}. Read ${f} ${dg(d)} exactly from the unit circle.`,
    expression: `${f} ${dg(d)} = ?`, answer: trigD(f, d), answerText: right,
    hint: f === 'tan' ? 'tan θ = sin θ ÷ cos θ = y ÷ x. Signs first, then size from the reference angle.' : `${f === 'cos' ? 'cos is the x-coordinate' : 'sin is the y-coordinate'}. Signs come from the quadrant.`,
    steps: [`${dg(d)} is in ${QUADS[quadIndex(d)]} with reference angle ${dg(refAngle(d))}.`, `Size: ${f} ${dg(refAngle(d))} = ${exact(f, refAngle(d))}. Sign: ${f === 'sin' ? 'y' : f === 'cos' ? 'x' : 'y ÷ x'} is ${trigD(f, d) < 0 ? 'negative' : 'positive'} there.`, `${f} ${dg(d)} = ${right}.`],
    visual: { type: 'unitcircle', angle: d },
  });
  return choose(rng, q, right, [negEx(right), other, negEx(other), ...rng.shuffle(EXACT_POOL)]);
}
/** The same reading with the angle given in radians (the bridge to Pre-Calculus). */
function ucRadValueStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'cos', 'sin', 'tan'] as TF[]); const d = pick(rng, NONQUAD.filter((x) => quadIndex(x) > 0));
  const right = exact(f, d); const other = f === 'tan' ? exact('tan', 90 - refAngle(d)) : exact(OTHER[f], d); const r = degToPi(d);
  const q = mkq(S('unit-circle'), 'exact-radians', {
    prompt: `The survey controller logs the arm at ${r} radians. Read ${f}(${r}) exactly.`,
    expression: `${f}(${r}) = ?`, answer: trigD(f, d), answerText: right,
    hint: 'π radians is a half turn (180°). Place the angle, then read its point as usual.',
    steps: [`${r} = ${r.replace('π', ' × 180°').replace(/^ × /, '')} = ${dg(d)}, in ${QUADS[quadIndex(d)]} with reference angle ${degToPi(refAngle(d))} (${dg(refAngle(d))}).`, `Size: ${exact(f, refAngle(d))}. Sign: ${f === 'sin' ? 'y' : f === 'cos' ? 'x' : 'y ÷ x'} is ${trigD(f, d) < 0 ? 'negative' : 'positive'} there.`, `${f}(${r}) = ${right}.`],
    visual: { type: 'unitcircle', angle: d, radians: true },
  });
  return choose(rng, q, right, [negEx(right), other, negEx(other), ...rng.shuffle(EXACT_POOL)]);
}
/** Quadrantal angles: the point sits on an axis, and tan has no value where x = 0. */
function axisTableStep(rng: Rng): AskStep {
  const angles = rng.shuffle([0, 90, 180, 270]).slice(0, 3).sort((a, b) => a - b);
  const cells: { r: number; c: number; v: number }[] = [];
  const rows: (number | string | null)[][] = angles.map((d, ri) => [`${d}°`, ...(['sin', 'cos', 'tan'] as TF[]).map((f, ci) => {
    const e = exact(f, d);
    if (e === UNDEF) return '—';
    cells.push({ r: ri, c: ci + 1, v: Math.round(trigD(f, d) * 1e9) / 1e9 + 0 }); // + 0 turns −0 into 0
    return e;
  })]);
  const blanks = rng.shuffle(cells).slice(0, 3).sort((a, b) => a.r - b.r || a.c - b.c);
  for (const b of blanks) rows[b.r][b.c] = null;
  const vals = blanks.map((b) => b.v);
  const q = mkq(S('unit-circle'), 'axis-table', {
    prompt: 'The beacons on the four axes need their readings. Fill the blanks from the unit circle.',
    expression: 'sin, cos, tan at 0°, 90°, 180°, 270°', answer: vals[0],
    hint: 'On an axis the point is (1, 0), (0, 1), (−1, 0) or (0, −1). cos is x, sin is y, tan is y ÷ x.',
    steps: ['Axis points: 0° → (1, 0), 90° → (0, 1), 180° → (−1, 0), 270° → (0, −1). cos θ = x, sin θ = y.', 'tan θ = y ÷ x: 0 where y = 0; no value (—) at 90° and 270°, where x = 0.', `Blanks in order: ${vals.map((v) => fmt(v)).join(', ')}.`],
    visual: { type: 'unitcircle', angle: angles[1] },
  });
  return model(q, { kind: 'table', cols: ['θ', 'sin θ', 'cos θ', 'tan θ'], rows, label: 'Axis readings' }, combos(vals.map(numForms)), 'Type each missing value (use −1 for negative one).');
}
const SIGNS: Record<TF, number[]> = { sin: [1, 1, -1, -1], cos: [1, -1, -1, 1], tan: [1, -1, 1, -1] };
function signQuadrantStep(rng: Rng): AskStep {
  const qi = rint(rng, 0, 3); const [f, g] = rng.shuffle(['sin', 'cos', 'tan'] as TF[]).slice(0, 2);
  const sg = (x: TF) => (SIGNS[x][qi] > 0 ? '> 0' : '< 0');
  const q = mkq(S('unit-circle'), 'signs', {
    prompt: `A sensor arm reports ${f} θ ${sg(f)} and ${g} θ ${sg(g)}. Which quadrant is it in?`,
    expression: `${f} θ ${sg(f)}, ${g} θ ${sg(g)}`, answer: qi + 1,
    hint: 'cos is x, sin is y, tan is y ÷ x. Which quadrant gives both signs?',
    steps: ['cos θ = x, sin θ = y, tan θ = y/x.', `${f} ${sg(f)} and ${g} ${sg(g)} happen together only in ${QUADS[qi]}.`],
    visual: { type: 'unitcircle' },
  });
  return choose(rng, q, QUADS[qi], QUADS.filter((_, i) => i !== qi));
}
function ucByValueStep(rng: Rng): AskStep {
  const d = pick(rng, NONQUAD); const f = pick(rng, ['sin', 'cos'] as TF[]); const v = exact(f, d);
  const q = mkq(S('unit-circle'), 'value-to-angle', {
    prompt: `A beacon arm in ${QUADS[quadIndex(d)]} reads ${f} θ = ${v}. Find its angle.`,
    expression: `${f} θ = ${v}, ${QUADS[quadIndex(d)]}`, answer: d,
    hint: `The size ${v.replace('−', '')} names the reference angle; the quadrant places it.`,
    steps: [`${f} of the reference angle is ${v.replace('−', '')}, so the reference angle is ${dg(refAngle(d))}.`, `In ${QUADS[quadIndex(d)]}: θ = ${PLACE(quadIndex(d), refAngle(d))} = ${dg(d)}.`],
  });
  return model(q, { kind: 'unitcircle', label: `${f} θ = ${v}` }, [String(d)], `Tap the angle in ${QUADS[quadIndex(d)]}.`);
}
/** Dashed circle of radius r as plot segments. */
function circleSegs(r: number, n = 24): NonNullable<PlotLayers['segments']> {
  return Array.from({ length: n }, (_, i) => { const a = (2 * Math.PI * i) / n; const b = (2 * Math.PI * (i + 1)) / n; return { a: [r * Math.cos(a), r * Math.sin(a)] as P2, b: [r * Math.cos(b), r * Math.sin(b)] as P2, color: 'muted' as const }; });
}
const circlePoint = (key: string) => (rng: Rng): AskStep => {
  const [x, y] = pick(rng, [[3, 4], [4, 3], [-3, 4], [-4, 3], [-3, -4], [-4, -3], [3, -4], [4, -3]] as P2[]);
  const qi = x > 0 ? (y > 0 ? 0 : 3) : y > 0 ? 1 : 2; const both = key === 'unit-circle';
  const q = mkq(S(key), 'circle-point', {
    prompt: both ? `A 5 m crane arm points at angle θ with cos θ = ${fracStr(x, 5)} and sin θ = ${fracStr(y, 5)}. Tap the tip of the arm.` : `A 5 m crane arm points into ${QUADS[qi]} with sin θ = ${fracStr(y, 5)}. Find cos θ, then tap the tip.`,
    expression: both ? '(x, y) = (5 cos θ, 5 sin θ)' : `sin²θ + cos²θ = 1, ${QUADS[qi]}`, answer: x,
    hint: both ? 'On a circle of radius r, the point at θ is (r cos θ, r sin θ).' : 'Use sin²θ + cos²θ = 1 for the size of cos θ; the quadrant gives its sign.',
    steps: both ? ['On a circle of radius 5, the tip is (5 cos θ, 5 sin θ).', `x = ${lab(5, 'arm length in m')} × ${fracStr(x, 5)} = ${lab(fmt(x), 'x-coordinate in m')}, y = 5 × ${fracStr(y, 5)} = ${lab(fmt(y), 'y-coordinate in m')}.`, `Tip: (${fmt(x)}, ${fmt(y)}).`]
      : ['sin²θ + cos²θ = 1, so cos²θ = 1 − sin²θ.', `cos²θ = 1 − ${(y * y)}/25 = ${x * x}/25, so cos θ = ±${Math.abs(x)}/5; in ${QUADS[qi]} it is ${fracStr(x, 5)}.`, `Tip: (5 cos θ, 5 sin θ) with ${lab(5, 'arm length in m')}: x = ${lab(fmt(x), 'x-coordinate in m')}, y = ${lab(fmt(y), 'y-coordinate in m')}.`],
    visual: { type: 'none' },
  });
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: 'Radius 5 (metres): tap the tip', layers: { segments: circleSegs(5) } }, [`${x},${y}`], 'Tap the tip of the arm.');
};
function ucDecimalQ(rng: Rng): Question {
  const f = pick(rng, ['sin', 'cos'] as TF[]); const d = pick(rng, f === 'sin' ? [30, 150, 210, 330, 90, 270, 180] : [60, 120, 240, 300, 0, 180, 90]);
  const v = Math.round(trigD(f, d) * 1e9) / 1e9;
  return mkq(S('unit-circle'), 'decimal-value', {
    prompt: `The survey arm points at ${dg(d)}. Give ${f} ${dg(d)} as a decimal, straight from the unit circle.`,
    expression: `${f} ${dg(d)} = ?`, answer: v,
    hint: `${f === 'cos' ? 'cos is the x-coordinate' : 'sin is the y-coordinate'} of the point at ${dg(d)}.`,
    steps: [`The point at ${dg(d)} is ${coordTxt(d)}.`, `${f} is its ${f === 'cos' ? 'x' : 'y'}-coordinate: ${exact(f, d) === fmt(v) ? fmt(v) : `${exact(f, d)} = ${fmt(v)}`}.`],
    visual: { type: 'unitcircle', angle: d },
  });
}
const ucDecimalStep = (rng: Rng) => typed(ucDecimalQ(rng));
function crankStep(rng: Rng): AskStep {
  const r = pick(rng, [4, 5, 6, 8, 10]); const d = pick(rng, [30, 45, 60, 120, 135, 150]); const h = r * sinD(d);
  const q = mkq(S('unit-circle'), 'transfer-crank', {
    prompt: `A pump crank of radius ${r} cm starts at 3 o'clock and turns ${dg(d)} counterclockwise. How high above the axle is the crank pin, to 1 decimal place?`,
    expression: 'height = r sin θ', ...dec1(h), unit: 'cm',
    hint: 'Scale the unit circle by the radius: the height is the y-coordinate.',
    steps: ['On a circle of radius r, the point at θ is (r cos θ, r sin θ).', `height = ${lab(r, 'crank radius in cm')} × sin ${lab(dg(d), 'crank angle')} = ${r} × ${exact('sin', d)} ≈ ${lab(s1(h), 'pin height in cm')}.`],
    visual: { type: 'unitcircle', angle: d },
  });
  return typed(q);
}
function ferrisStep(rng: Rng): AskStep {
  const r = pick(rng, [10, 12, 16, 20]); const c = r + 2; const d = pick(rng, [30, 150, 210, 330, 90, 270]); const h = c + r * sinD(d);
  const q = mkq(S('unit-circle'), 'transfer-ferris', {
    prompt: `An observation wheel of radius ${r} m has its hub ${c} m up, and a cabin sits at ${dg(d)} in standard position. How high is the cabin?`,
    expression: `height = ${c} + ${r} sin ${dg(d)}`, answer: Math.round(h * 1e9) / 1e9, unit: 'm',
    hint: 'The cabin sits r sin θ above (or below) the hub.',
    steps: ['Height = hub height + r sin θ.', `sin ${lab(dg(d), 'cabin angle')} = ${exact('sin', d)}, so ${lab(r, 'wheel radius in m')} × sin ${dg(d)} = ${lab(fmt(r * sinD(d)), 'offset from the hub in m')}.`, `Height = ${lab(c, 'hub height in m')} ${fmtSigned(Math.round(r * sinD(d) * 1e9) / 1e9)} = ${lab(fmt(h), 'cabin height in m')}.`],
    visual: { type: 'unitcircle', angle: d },
  });
  return typed(q);
}

/* ======================= 7. graphs of sin, cos, tan ======================= */
interface Wave { k: 'sin' | 'cos'; A: number; P: number; C: number; D: number }
const waveFn = (w: Wave): Fn => ({ kind: w.k, amp: w.A, freq: (2 * Math.PI) / w.P, phase: (-2 * Math.PI * w.C) / w.P, shift: w.D });
/** The coefficient B = 2π/P written with π: P = 4 → 'π/2'. */
const bStr = (P: number) => piStr(2, P);
function argStr(w: Wave): string {
  const b = bStr(w.P);
  if (w.C === 0) return b.includes('/') ? b.replace('/', 'x/') : `${b}x`;
  return `${b.includes('/') ? `(${b})` : b}(x ${w.C > 0 ? '−' : '+'} ${fmt(Math.abs(w.C))})`;
}
const eqStr = (w: Wave) => `y = ${w.A === 1 ? '' : `${fmt(w.A)} `}${w.k}(${argStr(w)})${w.D ? ` ${fmtSigned(w.D)}` : ''}`;
const plotOf = (fns: Fn[], range: [number, number, number, number] = [0, 8, -5, 6]): Visual => ({ type: 'plot', range, layers: { fns: fns.map((fn) => ({ fn })) } });
/** A y-range that shows every peak and trough of these waves with a unit of margin. */
const waveRange = (ws: Wave[]): [number, number, number, number] => [0, 8, Math.min(-1, ...ws.map((w) => w.D - w.A - 1)), Math.max(1, ...ws.map((w) => w.D + w.A + 1))];
const sameWave = (a: Wave, b: Wave) => [0.3, 1.1, 2.2, 3.7, 5.3, 6.9].every((x) => Math.abs(evalFnW(a, x) - evalFnW(b, x)) < 1e-6);
const evalFnW = (w: Wave, x: number) => w.A * (w.k === 'sin' ? Math.sin : Math.cos)((2 * Math.PI * (x - w.C)) / w.P) + w.D;

function ampStep(rng: Rng): AskStep {
  const A = rint(rng, 2, 4); const D = pick(rng, [1, 2, -1, -2, 3].filter((d) => d !== A)); const P = pick(rng, [2, 4, 8]);
  const w: Wave = { k: 'sin', A, P, C: 0, D };
  const q = mkq(S('graphs'), 'amplitude', {
    prompt: 'Volt\'s ropeway sensor traced this wave. What is its amplitude?',
    expression: 'amplitude = ?', answer: A,
    hint: 'Amplitude is measured from the midline, not from the x-axis.',
    steps: ['Amplitude = distance from the midline to a peak = (max − min) ÷ 2.', `max = ${lab(fmt(D + A), 'peak')}, min = ${lab(fmt(D - A), 'trough')}, so the midline is y = ${lab(fmt(D), 'midline')}.`, `amplitude = (${fmt(D + A)} − ${par(D - A)}) ÷ 2 = ${lab(A, 'amplitude')}.`],
    visual: plotOf([waveFn(w)], waveRange([w])),
  });
  return choose(rng, q, fmt(A), [fmt(A + D), fmt(2 * A), fmt(Math.abs(D)), fmt(A + 1)]);
}
function periodQ(rng: Rng): Question {
  const w: Wave = { k: pick(rng, ['sin', 'cos'] as const), A: rint(rng, 1, 3), P: pick(rng, [2, 4, 6, 8]), C: 0, D: pick(rng, [0, 0, 1, -1]) };
  return mkq(S('graphs'), 'period-graph', {
    prompt: `A vibration sensor traced ${eqStr(w)}, x in seconds. How long is one full cycle?`,
    expression: 'period = ?', answer: w.P, unit: 's',
    hint: 'One full cycle runs from a peak to the next peak (or any point to where the pattern repeats).',
    steps: ['The period is the length of one full cycle.', `From the graph, the pattern that starts at x = 0 repeats from x = ${lab(w.P, 'period in s')}.`, `Check: period = 2π ÷ B = 2π ÷ ${sq(bStr(w.P))} = ${lab(w.P, 'period in s')}.`],
    visual: plotOf([waveFn(w)]),
  });
}
const periodStep = (rng: Rng) => typed(periodQ(rng));
function periodEqStep(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]); const k = pick(rng, [2, 3, 4, 5, 6]); const base = f === 'tan' ? 180 : 360; const P = base / k;
    const q = mkq(S('graphs'), 'period-degrees', {
      prompt: `A gear sensor reads y = ${f}(${k}x), x in degrees. What is the period?`,
      expression: `y = ${f}(${k}x)`, answer: P,
      hint: `The parent ${f} x repeats every ${base}°. Multiplying x by ${k} speeds it up.`,
      steps: [`${f} x has period ${base}°.`, `y = ${f}(${k}x) runs ${k} times as fast, so its period is ${lab(`${base}°`, 'parent period')} ÷ ${lab(k, 'speed-up factor')} = ${lab(dg(P), 'period')}.`],
    });
    return choose(rng, q, dg(P), [dg((f === 'tan' ? 360 : 180) / k), dg(k), dg(base * k)]);
  }
  const P = pick(rng, [2, 4, 6, 8, 12]); const A = rint(rng, 2, 5); const w: Wave = { k: 'sin', A, P, C: 0, D: 0 };
  const q = mkq(S('graphs'), 'period-radians', {
    prompt: `A pump piston moves as ${eqStr(w)}, x in seconds. What is the period?`,
    expression: eqStr(w), answer: P,
    hint: 'Period = 2π ÷ B, where B is the number multiplying x.',
    steps: ['For y = A sin(Bx), the period is 2π ÷ B.', `B = ${bStr(P)}, so period = 2π ÷ ${sq(bStr(P))} = ${lab(P, 'period in s')}.`],
  });
  return choose(rng, q, `${P} s`, [`${fmt(r2((2 * Math.PI) / P))} s`, `${fmt(P / 2)} s`, `${2 * P} s`, `${A} s`]);
}
function peakPlotStep(rng: Rng): AskStep {
  const P = pick(rng, [4, 8]); const k = pick(rng, ['sin', 'cos'] as const); const C = pick(rng, P === 4 ? [0, 1] : [0, 1, 2]);
  const A = rint(rng, 1, 3); const D = pick(rng, [-1, 0, 1, 2]); const w: Wave = { k, A, P, C, D }; const lowest = rng.next() < 0.35;
  // Where the parent wave does this after its start, then shifted by C; the same point repeats every period,
  // so the first one at x ≥ 0 is (C + offset) reduced into [0, P).
  const offset = k === 'sin' ? (lowest ? (3 * P) / 4 : P / 4) : lowest ? P / 2 : 0;
  const base = C + offset; const x = ((base % P) + P) % P; const y = lowest ? D - A : D + A;
  const what = k === 'sin' ? (lowest ? 'Sine bottoms out three quarters of a period after its start' : 'Sine peaks a quarter period after its start') : (lowest ? 'Cosine bottoms out half a period after its start' : 'Cosine peaks at its start');
  const xLine = `${what}: x = ${C ? `${C} + ${fmt(offset)} = ` : ''}${fmt(base)}${base !== x ? `. One period earlier, ${fmt(base)} − ${P} = ${fmt(x)}, is still at x ≥ 0, so the first one is at x = ${fmt(x)}` : ''}.`;
  const q = mkq(S('graphs'), 'peak-point', {
    prompt: `The ropeway cable sags and rises as ${eqStr(w)}. Tap its first ${lowest ? 'lowest point' : 'peak'} at x ≥ 0.`,
    expression: eqStr(w), answer: y,
    hint: `Midline y = D, amplitude A, period 2π ÷ B. ${k === 'sin' ? 'Sine starts on the midline going up.' : 'Cosine starts at a peak.'} Then apply the shift, and check one period earlier.`,
    steps: [`Midline ${fmt(D)}, amplitude ${A}, period ${P}${C ? `, shifted ${C} right` : ''}.`, lowest ? `Lowest height = ${lab(fmt(D), 'midline')} − ${lab(A, 'amplitude')} = ${lab(fmt(y), 'lowest height')}.` : `Peak height = ${lab(fmt(D), 'midline')} + ${lab(A, 'amplitude')} = ${lab(fmt(y), 'peak height')}.`, xLine, `Point: (${fmt(x)}, ${fmt(y)}).`],
  });
  return model(q, { kind: 'plot', range: [0, 8, -5, 6], count: 1, label: eqStr(w) }, [`${x},${y}`], `Tap the first ${lowest ? 'lowest point' : 'peak'}.`);
}
function graphPickStep(rng: Rng): AskStep {
  const A = rint(rng, 1, 3); const D = pick(rng, [0, 1, 2].filter((d) => d !== A)); const P = pick(rng, [2, 4, 8]);
  const w: Wave = { k: 'sin', A, P, C: 0, D };
  const cands: Wave[] = [];
  if (D > 0) cands.push({ ...w, A: D, D: A });
  cands.push({ ...w, P: P === 8 ? 4 : P * 2 }, { ...w, k: 'cos' });
  if (D !== 0) cands.push({ ...w, D: -D });
  cands.push({ ...w, A: A + 1 }, { ...w, P: P === 2 ? 8 : P / 2 });
  const opts: Wave[] = [];
  for (const c of cands) if (!sameWave(c, w) && !opts.some((o) => sameWave(o, c)) && opts.length < 3) opts.push(c);
  const q = mkq(S('graphs'), 'which-graph', {
    prompt: `Which trace matches ${eqStr(w)}?`,
    expression: eqStr(w), answer: 0,
    hint: 'Check the midline first, then the height of the peaks above it, then how long one cycle takes.',
    steps: ['Read D (midline), A (amplitude) and the period 2π ÷ B.', `Midline y = ${D}, peaks at ${fmt(D + A)}, troughs at ${fmt(D - A)}, period ${P}.`, 'A sine starts on its midline and rises.'],
  });
  const range = waveRange([w, ...opts]);
  return pickLettered(rng, q, [w, ...opts].map((x) => plotOf([waveFn(x)], range)), 0, 'Trace');
}
function midlineQ(rng: Rng): Question {
  const lo = rint(rng, 0, 4); const a = rint(rng, 1, 4); const hi = lo + 2 * a; const ask2 = pick(rng, ['midline', 'amplitude'] as const);
  return mkq(S('graphs'), 'max-min', {
    prompt: `A harbour tide gauge swings between ${hi} m at high water and ${lo} m at low water. What is the ${ask2 === 'midline' ? 'midline height' : 'amplitude'}?`,
    expression: ask2 === 'midline' ? 'D = (max + min) ÷ 2' : 'A = (max − min) ÷ 2', answer: ask2 === 'midline' ? lo + a : a, unit: 'm',
    hint: ask2 === 'midline' ? 'The midline sits halfway between high and low.' : 'The amplitude is half the full swing.',
    steps: [ask2 === 'midline' ? 'The midline is the average of max and min.' : 'The amplitude is half of max − min.', ask2 === 'midline' ? `(${lab(hi, 'high water in m')} + ${lab(lo, 'low water in m')}) ÷ 2 = ${lab(lo + a, 'midline in m')}.` : `(${lab(hi, 'high water in m')} − ${lab(lo, 'low water in m')}) ÷ 2 = ${lab(a, 'amplitude in m')}.`],
    visual: plotOf([{ kind: 'sin', amp: a, freq: Math.PI / 6, shift: lo + a }], [0, 24, -1, hi + 2]),
  });
}
const midlineStep = (rng: Rng) => typed(midlineQ(rng));
function sliderCycleStep(rng: Rng): AskStep {
  const P = pick(rng, [2, 3, 4, 6]); const C = pick(rng, [0, 0.5, 1]); const w: Wave = { k: pick(rng, ['sin', 'cos'] as const), A: 2, P, C, D: 0 };
  const q = mkq(S('graphs'), 'cycle-slider', {
    prompt: `Newton plots ${eqStr(w)}, with one cycle starting at x = ${fmt(C)}. Slide the marker to where that cycle ends.`,
    expression: `period = 2π ÷ ${sq(bStr(P))}`, answer: C + P,
    hint: 'A cycle ends where the pattern starts to repeat. Compute the period from B.',
    steps: [`period = 2π ÷ ${sq(bStr(P))} = ${lab(P, 'period')}.`, `The cycle from x = ${fmt(C)} ends at ${lab(fmt(C), 'cycle start')} + ${lab(P, 'period')} = ${lab(fmt(C + P), 'cycle end')}.`],
  });
  return model(q, { kind: 'slider', min: 0, max: 8, step: 0.5, label: 'end of the cycle', range: [0, 8, -3, 3], layers: { fns: [{ fn: waveFn(w) }] } }, [fmt(C + P)], 'Slide to the end of one full cycle.');
}
function tanGraphStep(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const q = mkq(S('graphs'), 'tan-asymptotes', {
      prompt: 'A ropeway tension gauge follows y = tan x. Where between 0° and 360° does it blow up (vertical asymptotes)?',
      expression: 'tan x = sin x ÷ cos x', answer: 90,
      hint: 'A fraction blows up where its denominator is zero.',
      steps: ['tan x = sin x ÷ cos x has no value where cos x = 0.', 'cos x = 0 at 90° and 270°, so the asymptotes are there.', 'tan x = 0 at 0° and 180°, where sin x = 0.'],
      visual: { type: 'card', title: 'tan x = sin x ÷ cos x', lines: ['cos x = 0 → ?', 'sin x = 0 → ?'] },
    });
    return choose(rng, q, '90° and 270°', ['0° and 180°', '180° only', '45° and 225°']);
  }
  const q = mkq(S('graphs'), 'tan-period', {
    prompt: 'A ropeway tension gauge follows y = tan x. Every how many degrees does its pattern repeat?',
    expression: 'tan x = sin x ÷ cos x', answer: 180,
    hint: 'After half a turn, sin and cos both change sign. What happens to their ratio?',
    steps: ['sin(x + 180°) = −sin x and cos(x + 180°) = −cos x.', 'The ratio keeps its value, so tan repeats every 180°, not 360°.'],
    visual: { type: 'unitcircle', angle: 45 },
  });
  return choose(rng, q, '180°', ['360°', '90°', '720°']);
}
/** Read tangent from a picture: rising branches, zeros at 0° and 180°, asymptotes at 90° and 270°. */
function tanPickStep(rng: Rng): AskStep {
  const R: [number, number, number, number] = [0, 360, -4, 4];
  const opts: Visual[] = [plotOf([{ kind: 'tan', deg: true }], R), plotOf([{ kind: 'sin', amp: 2, deg: true }], R), plotOf([{ kind: 'cos', amp: 2, deg: true }], R), plotOf([{ kind: 'tan', deg: true, phase: -90 }], R)];
  const q = mkq(S('graphs'), 'tan-graph', {
    prompt: 'Newton\'s signal tower logged four traces over 0° to 360°. Which one is y = tan x?',
    expression: 'y = tan x = sin x ÷ cos x', answer: 0,
    hint: 'tan x = sin x ÷ cos x: where is it 0, and where does it blow up?',
    steps: ['tan x = 0 where sin x = 0: at 0°, 180° and 360°.', 'It has vertical asymptotes where cos x = 0: at 90° and 270°.', 'Between them it rises from −∞ to +∞, repeating every 180°. (tan(x − 90°) blows up at 0° and 180° instead.)'],
  });
  return pickLettered(rng, q, opts, 0, 'Trace');
}
function phaseShiftStep(rng: Rng): AskStep {
  const s = pick(rng, [30, 45, 60, 90]); const right = rng.next() < 0.5; const f = pick(rng, ['sin', 'cos'] as TF[]);
  const q = mkq(S('graphs'), 'phase-shift', {
    prompt: `Compared with y = ${f} x, how is y = ${f}(x ${right ? '−' : '+'} ${s}°) moved?`,
    expression: `y = ${f}(x ${right ? '−' : '+'} ${s}°)`, answer: right ? s : -s,
    hint: `Find the x that makes the inside equal 0: that is where the new graph does what ${f} x does at 0.`,
    steps: [`The inside is 0 when x = ${right ? '' : '−'}${s}°.`, `So the graph does at x = ${right ? '' : '−'}${s}° what ${f} x did at 0°: it moved ${lab(`${s}°`, 'phase shift')} ${right ? 'right' : 'left'}.`],
  });
  return choose(rng, q, `${s}° ${right ? 'right' : 'left'}`, [`${s}° ${right ? 'left' : 'right'}`, `${s} units up`, `${s} units down`]);
}
/** Transfer: build a height model for an observation wheel from its lowest and highest points and its period. */
function wheelModelStep(rng: Rng): AskStep {
  const lo = pick(rng, [1, 2, 3, 4]); const r = pick(rng, [5, 8, 10, 12, 15]); const hi = lo + 2 * r; const mid = lo + r; const T = pick(rng, [20, 30, 40, 60, 80]);
  const b = piStr(2, T); const arg = b.includes('/') ? b.replace('/', 't/') : `${b}t`;
  const right = `h = ${mid} − ${r} cos(${arg})`;
  const q = mkq(S('graphs'), 'transfer-wheel', {
    prompt: `A cabin boards at the bottom of an observation wheel, rides between ${lo} m and ${hi} m, and takes ${T} s per turn. Which equation gives its height after t seconds?`,
    expression: 'h(t) = ?', answer: mid,
    hint: 'Midline = average of top and bottom; amplitude = half the swing; B = 2π ÷ period. Which way does it start?',
    steps: [`Midline D = (${lab(hi, 'top in m')} + ${lab(lo, 'bottom in m')}) ÷ 2 = ${lab(mid, 'midline in m')}; amplitude A = (${hi} − ${lo}) ÷ 2 = ${lab(r, 'amplitude in m')}.`, `B = 2π ÷ ${lab(T, 'period in s')} = ${b}.`, `It starts at the bottom, so use −cos (cos starts at a peak): ${right}.`],
    app: 'Ride engineers model cabin heights this way to check clearances and loads.',
  });
  return choose(rng, q, right, [`h = ${mid} + ${r} cos(${arg})`, `h = ${mid} − ${hi} cos(${arg})`, `h = ${mid} − ${r} cos(${T}t)`, `h = ${r} − ${r} cos(${arg})`]);
}
function acStep(rng: Rng): AskStep {
  const f = pick(rng, [50, 60]); const V = f === 50 ? 325 : 170;
  const q = mkq(S('graphs'), 'transfer-ac', {
    prompt: `Mains voltage follows v = ${V} sin(${2 * f}πt), t in seconds. How many full cycles happen each second?`,
    expression: `v = ${V} sin(${2 * f}πt)`, answer: f, unit: 'Hz',
    hint: 'Find the period with 2π ÷ B, then count how many periods fit in one second.',
    steps: [`period = 2π ÷ ${2 * f}π = ${lab(`1/${f}`, 'period in s')}.`, `Cycles in ${lab(1, 'second')}: 1 ÷ (1/${f}) = ${lab(f, 'cycles per second')}.`],
    app: 'Electricians call cycles per second the frequency, measured in hertz.',
  });
  return typed(q);
}

/* ======================= 8. inverse trig functions ======================= */
const EXV: Record<string, number> = { '0': 0, '1/2': 0.5, '√2/2': Math.SQRT1_2, '√3/2': Math.sqrt(3) / 2, '1': 1, '√3/3': 1 / Math.sqrt(3), '√3': Math.sqrt(3) };
const exVal = (s: string) => (s.startsWith('−') ? -EXV[s.slice(1)] : EXV[s]);
const INV_VALS: Record<TF, string[]> = { sin: ['−1', '−√3/2', '−√2/2', '−1/2', '1/2', '√2/2', '√3/2', '1'], cos: ['−1', '−√3/2', '−√2/2', '−1/2', '0', '1/2', '√2/2', '√3/2'], tan: ['−√3', '−1', '−√3/3', '√3/3', '1', '√3'] };
const principal = (f: TF, v: number) => Math.round(f === 'sin' ? asinD(v) : f === 'cos' ? acosD(v) : atanD(v));
const RANGE: Record<TF, string> = { sin: '−90° ≤ θ ≤ 90°', cos: '0° ≤ θ ≤ 180°', tan: '−90° < θ < 90°' };

function invExactStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]); const v = pick(rng, INV_VALS[f]); const p = principal(f, exVal(v));
  const others = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330].filter((d) => d !== p && exact(f, d) === v);
  const q = mkq(S('inverse'), 'inverse-exact', {
    prompt: `Ada's calculator is broken. Find ${f}⁻¹(${v}) exactly, in degrees.`,
    expression: `${f}⁻¹(${v}) = ?`, answer: p,
    hint: `Many angles have ${f} θ = ${v}. ${f}⁻¹ must pick the one in its restricted range.`,
    steps: [`${f}⁻¹ returns the single angle with ${RANGE[f]}.`, `${fAt(f, p)} = ${v}${others.length ? ` (so ${others.length > 1 ? 'do' : 'does'} ${others.map(dg).join(' and ')}, but ${others.length > 1 ? 'those are' : 'that is'} outside the range)` : ''}.`, `${f}⁻¹(${v}) = ${dg(p)}.`],
    visual: { type: 'unitcircle' },
  });
  // cos⁻¹ of a negative is obtuse, not negative: the tempting wrong answer is −cos⁻¹(|v|) = p − 180°, so it leads.
  const lead = f === 'cos' && v.startsWith('−') ? [dg(p - 180)] : [];
  return choose(rng, q, dg(p), [...lead, ...others.map(dg), dg(-p), dg(90 - p), dg(180 - p)]);
}
function invCircleStep(rng: Rng): AskStep {
  const f = pick(rng, ['cos', 'cos', 'sin', 'tan'] as TF[]);
  const vals = f === 'cos' ? [...INV_VALS.cos] : INV_VALS[f].filter((x) => !x.startsWith('−'));
  const v = pick(rng, vals); const p = principal(f, exVal(v));
  const q = mkq(S('inverse'), 'inverse-circle', {
    prompt: `The lookout telescope's sensor computes ${f}⁻¹(${v}). Tap where it points on the unit circle.`,
    expression: `${f}⁻¹(${v}), range ${RANGE[f]}`, answer: p,
    hint: f === 'cos' ? 'cos⁻¹ answers live on the top half of the circle, from 0° to 180°.' : `${f}⁻¹ answers live on the right half, from −90° to 90°.`,
    steps: [`${f}⁻¹ returns the angle with ${RANGE[f]} whose ${f} is ${v}.`, `${f} ${dg(p)} = ${v}, and ${dg(p)} is in range.`],
  });
  return model(q, { kind: 'unitcircle', label: `${f}⁻¹(${v})` }, [String(p)], `Tap the angle ${f}⁻¹ returns.`);
}
function invDialStep(rng: Rng): AskStep {
  const v = pick(rng, INV_VALS.cos); const p = principal('cos', exVal(v));
  const q = mkq(S('inverse'), 'inverse-dial', {
    prompt: `A crane boom's cosine sensor reads ${v}. Set the dial to cos⁻¹(${v}).`,
    expression: `cos⁻¹(${v}) = ?`, answer: p,
    hint: 'cos⁻¹ gives an angle from 0° to 180°. A negative cosine means the angle is obtuse.',
    steps: ['cos⁻¹ returns an angle from 0° to 180°.', `cos ${dg(p)} = ${v}, so cos⁻¹(${v}) = ${dg(p)}.`],
  });
  return model(q, { kind: 'angle', max: 180, step: 15, label: `cos⁻¹(${v})` }, [String(p)], 'Turn the dial to the angle.');
}
function rangeStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]);
  const why: Record<TF, string> = { sin: 'On −90° to 90°, sin rises through every value from −1 to 1 exactly once.', cos: 'On 0° to 180°, cos falls through every value from 1 to −1 exactly once.', tan: 'Between −90° and 90°, tan takes every value exactly once; ±90° are asymptotes, so they are left out.' };
  const q = mkq(S('inverse'), 'restricted-range', {
    prompt: `${f}⁻¹ must give exactly one answer. Which outputs can ${f}⁻¹ give?`,
    expression: `range of ${f}⁻¹`, answer: 0,
    hint: `Look for a stretch of the ${f} graph that takes each value exactly once and includes 0° to 90°.`,
    steps: [why[f], `So ${f}⁻¹ gives ${RANGE[f]}.`],
    visual: plotOf([{ kind: f, deg: true }], [-180, 360, -2, 2]),
  });
  // For sin⁻¹, tan⁻¹'s range differs only in < versus ≤, which tests notation rather than the idea; use a real mistake.
  const wrongs = f === 'sin' ? [RANGE.cos, '0° ≤ θ ≤ 90°', '0° ≤ θ < 360°'] : [...(['sin', 'cos', 'tan'] as TF[]).filter((g) => g !== f).map((g) => RANGE[g]), '0° ≤ θ < 360°'];
  return choose(rng, q, RANGE[f], wrongs);
}
function compositionStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]);
  const a = pick(rng, f === 'sin' ? [120, 135, 150, 210, 225, 240] : f === 'cos' ? [210, 225, 240, 300, 315, 330] : [120, 135, 150, 210, 225, 240]);
  const res = f === 'sin' ? 180 - a : f === 'cos' ? 360 - a : a - 180;
  const q = mkq(S('inverse'), 'composition', {
    prompt: `Brick claims ${f}⁻¹(${f} ${dg(a)}) = ${dg(a)}, since they "cancel". What is it really?`,
    expression: `${f}⁻¹(${f} ${dg(a)}) = ?`, answer: res,
    hint: `Work inside out: find ${f} ${dg(a)} first, then ask which angle ${f}⁻¹ is allowed to return.`,
    steps: [`${f} ${dg(a)} = ${exact(f, a)}.`, `${f}⁻¹ must return an angle with ${RANGE[f]}, and ${dg(a)} is not one.`, `The angle in range with the same ${f} is ${dg(res)}.`],
    visual: { type: 'unitcircle', angle: a },
  });
  return choose(rng, q, dg(res), [dg(a), dg(-res), dg(a - 360), dg(180 - res)]);
}
function reciprocalTrapStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]); const v = pick(rng, f === 'tan' ? ['1', '√3'] : ['1/2', '√3/2', '√2/2']); const p = principal(f, exVal(v));
  // sin 45° = cos 45° = √2/2, so "the angle whose cos is √2/2" would also be right: swap in tan, which is false for every value here.
  const g = v === '√2/2' ? 'tan' : f === 'cos' ? 'sin' : 'cos';
  const q = mkq(S('inverse'), 'notation', {
    prompt: `What does ${f}⁻¹(${v}) mean?`,
    expression: `${f}⁻¹(${v})`, answer: p,
    hint: 'The −1 here is not an exponent. What undoes a function?',
    steps: [`${f}⁻¹ is the inverse function: it answers "which angle has ${f} equal to ${v}?"`, `Here that angle is ${dg(p)}.`, `The reciprocal 1 ÷ ${f} θ is a different function (${f === 'sin' ? 'csc' : f === 'cos' ? 'sec' : 'cot'}).`],
  });
  return choose(rng, q, `The angle whose ${f} is ${v} (${dg(p)})`, [`The reciprocal 1 ÷ ${f}(${v})`, `The angle whose ${g} is ${v}`, `${f}(${v}) multiplied by −1`]);
}
function invTypedQ(rng: Rng): Question {
  const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]); const mag = pick(rng, f === 'tan' ? [0.35, 0.8, 1.5, 2.5, 4] : [0.2, 0.35, 0.4, 0.6, 0.75, 0.9]); const v = rng.next() < 0.4 ? -mag : mag;
  const th = f === 'sin' ? asinD(v) : f === 'cos' ? acosD(v) : atanD(v);
  return mkq(S('inverse'), 'inverse-decimal', {
    prompt: `A tilt sensor's controller computes ${f}⁻¹(${fmt(v)}). Find it in degrees, to 1 decimal place.`,
    expression: `${f}⁻¹(${fmt(v)}) = ?`, ...dec1(th), unit: '°',
    hint: `Use the ${f}⁻¹ key in degree mode. ${f === 'cos' ? 'cos⁻¹ never gives a negative angle.' : `${f}⁻¹ of a negative gives a negative angle.`}`,
    steps: [`${f}⁻¹ returns the angle with ${RANGE[f]}.`, `${f}⁻¹(${fmt(v)}) ≈ ${fmt(r2(th))}°, so ${s1(th)}°.`],
  });
}
const invTypedStep = (rng: Rng) => typed(invTypedQ(rng));
function obtuseStep(rng: Rng): AskStep {
  const v = pick(rng, [0.6, 0.8, 0.5, 0.9, 0.3]); const base = asinD(v); const th = 180 - base;
  const q = mkq(S('inverse'), 'transfer-obtuse', {
    prompt: `A truss joint has sin θ = ${v}, but the drawing shows θ is obtuse. Find θ to 1 decimal place.`,
    expression: `sin θ = ${v}, 90° < θ < 180°`, ...dec1(th), unit: '°',
    hint: 'The calculator only returns the acute answer. Which obtuse angle has the same sine?',
    steps: [`sin⁻¹(${v}) ≈ ${lab(`${fmt(r2(base))}°`, 'acute angle')}, the calculator's answer.`, 'sin(180° − θ) = sin θ, so the obtuse angle is 180° minus it.', `θ ≈ ${lab('180°', 'half turn')} − ${lab(`${fmt(r2(base))}°`, 'acute angle')} ≈ ${lab(`${s1(th)}°`, 'joint angle')}.`],
    visual: { type: 'unitcircle' },
  });
  return typed(q);
}
function crankReflexStep(rng: Rng): AskStep {
  const v = pick(rng, [0.6, 0.8, 0.5, 0.3, 0.25]); const base = acosD(v); const th = 360 - base;
  const q = mkq(S('inverse'), 'transfer-reflex', {
    prompt: `A crank pin sits below its axle (Quadrant IV) with cos θ = ${v}. Find θ between 0° and 360°, to 1 decimal place.`,
    expression: `cos θ = ${v}, Quadrant IV`, ...dec1(th), unit: '°',
    hint: 'cos⁻¹ gives an angle in Quadrant I here. Which Quadrant IV angle has the same cosine?',
    steps: [`cos⁻¹(${v}) ≈ ${lab(`${fmt(r2(base))}°`, 'Quadrant I angle')}.`, 'cos(360° − θ) = cos θ, and 360° − θ lands in Quadrant IV.', `θ ≈ ${lab('360°', 'full turn')} − ${lab(`${fmt(r2(base))}°`, 'Quadrant I angle')} ≈ ${lab(`${s1(th)}°`, 'crank angle')}.`],
  });
  return typed(q);
}

/* ======================= 9. identities ======================= */
const PYTH: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
function pythagQ(rng: Rng): Question {
  const [a, b, c] = pick(rng, PYTH); const givenF = pick(rng, ['sin', 'cos'] as TF[]); const qi = rint(rng, 0, 3);
  const sgn = (f: TF) => SIGNS[f][qi]; const want = pick(rng, (givenF === 'sin' ? ['cos', 'cos', 'tan'] : ['sin', 'sin', 'tan']) as TF[]);
  const gv = sgn(givenF) * a; const other = givenF === 'sin' ? 'cos' : 'sin'; const ov = sgn(other as TF) * b;
  const sinN = givenF === 'sin' ? gv : ov; const cosN = givenF === 'cos' ? gv : ov;
  const [n, d] = want === 'tan' ? [sinN, cosN] : [ov, c];
  return mkq(S('identities'), 'pythagorean', {
    prompt: `Dr. Catalyst's mixing arm sits in ${QUADS[qi]} with ${givenF} θ = ${fracStr(gv, c)}. Find ${want} θ as a fraction.`,
    expression: `sin²θ + cos²θ = 1`, answer: n / d, fraction: true, answerText: fracStr(n, d),
    hint: `Square, subtract from 1, take the root, then let the quadrant choose the sign.`,
    steps: ['sin²θ + cos²θ = 1.', `${other}²θ = 1 − (${a}/${c})² = ${c * c - a * a}/${c * c}, so ${other} θ = ±${b}/${c}.`, `In ${QUADS[qi]}, ${other} θ is ${ov < 0 ? 'negative' : 'positive'}: ${other} θ = ${fracStr(ov, c)}.`, ...(want === 'tan' ? [`tan θ = sin θ ÷ cos θ = ${sinN < 0 ? `(${fracStr(sinN, c)})` : fracStr(sinN, c)} ÷ ${cosN < 0 ? `(${fracStr(cosN, c)})` : fracStr(cosN, c)} = ${fracStr(sinN, cosN)}.`] : [])],
    visual: { type: 'unitcircle', angle: [45, 135, 225, 315][qi] },
  });
}
const pythagStep = (rng: Rng) => typed(pythagQ(rng));
const NEXT_STEPS = [
  { goal: 'tan θ · cos θ = sin θ', from: 'tan θ · cos θ', right: '(sin θ / cos θ) · cos θ', wrongs: ['(cos θ / sin θ) · cos θ', 'tan(θ · cos θ)', 'sin θ · cos²θ'], why: 'Quotient identity: tan θ = sin θ / cos θ.', then: 'The cos θ cancels, leaving sin θ.' },
  { goal: '(1 − cos²θ) / sin θ = sin θ', from: '(1 − cos²θ) / sin θ', right: 'sin²θ / sin θ', wrongs: ['(1 − cos θ)² / sin θ', 'cos²θ / sin θ', '(1 − cos θ) / sin θ'], why: 'Pythagorean identity: 1 − cos²θ = sin²θ.', then: 'sin²θ / sin θ = sin θ.' },
  { goal: 'sec θ − cos θ = sin θ tan θ', from: 'sec θ − cos θ', right: '1/cos θ − cos θ', wrongs: ['1/sin θ − cos θ', 'sec(θ − cos θ)', '(1 − cos θ) / cos θ'], why: 'Reciprocal identity: sec θ = 1/cos θ.', then: 'Common denominator: (1 − cos²θ)/cos θ = sin²θ/cos θ = sin θ tan θ.' },
  { goal: '(sin θ + cos θ)² = 1 + 2 sin θ cos θ', from: '(sin θ + cos θ)²', right: 'sin²θ + 2 sin θ cos θ + cos²θ', wrongs: ['sin²θ + cos²θ', 'sin²θ + sin θ cos θ + cos²θ', '2 sin θ + 2 cos θ'], why: 'Square a sum: (a + b)² = a² + 2ab + b², never just a² + b².', then: 'sin²θ + cos²θ = 1 gives 1 + 2 sin θ cos θ.' },
  { goal: '1 + tan²θ = sec²θ', from: '1 + tan²θ', right: '1 + sin²θ / cos²θ', wrongs: ['1 + sin²θ / cos θ', '1 + cos²θ / sin²θ', '(1 + tan θ)²'], why: 'Quotient identity, squared: tan²θ = sin²θ / cos²θ.', then: '(cos²θ + sin²θ)/cos²θ = 1/cos²θ = sec²θ.' },
  { goal: 'cot θ · sin θ = cos θ', from: 'cot θ · sin θ', right: '(cos θ / sin θ) · sin θ', wrongs: ['(sin θ / cos θ) · sin θ', '(1 / cos θ) · sin θ', 'cot(θ · sin θ)'], why: 'cot θ = cos θ / sin θ.', then: 'The sin θ cancels, leaving cos θ.' },
  { goal: 'cos²θ − sin²θ = 1 − 2 sin²θ', from: 'cos²θ − sin²θ', right: '(1 − sin²θ) − sin²θ', wrongs: ['(1 + sin²θ) − sin²θ', '(sin²θ − 1) − sin²θ', '(cos θ − sin θ)²'], why: 'Pythagorean identity: cos²θ = 1 − sin²θ.', then: 'Collect terms: 1 − 2 sin²θ.' },
];
function nextStepStep(rng: Rng): AskStep {
  const t = pick(rng, NEXT_STEPS);
  const q = mkq(S('identities'), 'verify-next', {
    prompt: `Vector is verifying ${t.goal}, starting from the left side. Which is a correct next step?`,
    expression: `${t.from} = …`, answer: 0,
    hint: 'Rewrite one piece using a basic identity: reciprocal, quotient or Pythagorean. Every step must stay equal.',
    steps: [t.why, `${t.from} = ${t.right}.`, t.then],
    visual: { type: 'card', title: 'Basic identities', lines: ['sin²θ + cos²θ = 1', 'tan θ = sin θ / cos θ', 'sec θ = 1/cos θ, csc θ = 1/sin θ'] },
  });
  return choose(rng, q, t.right, t.wrongs);
}
const TRUE_IDS = [
  { eq: 'sin²θ + cos²θ = 1', why: 'the point (cos θ, sin θ) is 1 unit from the origin' },
  { eq: '1 + tan²θ = sec²θ', why: 'divide sin²θ + cos²θ = 1 by cos²θ' },
  { eq: 'tan θ = sin θ / cos θ', why: 'tan θ = y/x on the unit circle' },
  { eq: 'csc θ = 1 / sin θ', why: 'csc is defined as the reciprocal of sin' },
  { eq: '1 + cot²θ = csc²θ', why: 'divide sin²θ + cos²θ = 1 by sin²θ' },
];
const FALSE_IDS = ['sin θ + cos θ = 1', 'sin²θ − cos²θ = 1', 'tan θ = cos θ / sin θ', 'sec θ = 1 / sin θ', '1 + tan²θ = csc²θ', 'sin 2θ = 2 sin θ', '(sin θ + cos θ)² = 1'];
/** Misconception probe: (sin θ + cos θ)² is not sin²θ + cos²θ. */
function squareSumStep(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const q = mkq(S('identities'), 'square-sum-test', {
      prompt: 'Brick expands (sin θ + cos θ)² as sin²θ + cos²θ, which is always 1. Test him at θ = 45°: what is (sin 45° + cos 45°)²?',
      expression: '(sin 45° + cos 45°)² = ?', answer: 2,
      hint: 'Add first, then square: sin 45° = cos 45° = √2/2.',
      steps: ['sin 45° + cos 45° = √2/2 + √2/2 = √2.', '(√2)² = 2, not 1, so Brick is wrong.', 'Squaring a sum makes a middle term: (sin θ + cos θ)² = 1 + 2 sin θ cos θ.'],
      visual: { type: 'unitcircle', angle: 45, showCoords: true },
    });
    return typed(q);
  }
  const q = mkq(S('identities'), 'square-sum', {
    prompt: 'Brick expands (sin θ + cos θ)² for a cam profile. What does it really equal for every θ?',
    expression: '(sin θ + cos θ)² = ?', answer: 0,
    hint: '(a + b)² = a² + 2ab + b². Then use sin²θ + cos²θ = 1.',
    steps: ['(a + b)² = a² + 2ab + b², never just a² + b².', '(sin θ + cos θ)² = sin²θ + 2 sin θ cos θ + cos²θ.', 'sin²θ + cos²θ = 1, so it equals 1 + 2 sin θ cos θ.'],
  });
  return choose(rng, q, '1 + 2 sin θ cos θ', ['1', 'sin²θ + cos²θ + sin θ cos θ', '2 sin θ cos θ']);
}
function whichIdentityStep(rng: Rng): AskStep {
  const t = pick(rng, TRUE_IDS);
  const q = mkq(S('identities'), 'which-identity', {
    prompt: 'Vector etches one identity into the forge door. Which equation is true for every angle θ (where defined)?',
    expression: 'true for every θ?', answer: 0,
    hint: 'Test each with θ = 30° (not 45°, where sin = cos hides mistakes). An identity never fails.',
    steps: [`${t.eq} is an identity: ${t.why}.`, 'Each of the others fails at θ = 30°. (At 45°, where sin θ = cos θ, some of them happen to work, which is why one test angle proves nothing.)'],
  });
  return choose(rng, q, t.eq, rng.shuffle(FALSE_IDS));
}
function pythagTableStep(rng: Rng): AskStep {
  const [sv, cv] = pick(rng, [[0.6, 0.8], [0.8, 0.6], [0.28, 0.96], [0.96, 0.28], [0.6, 0.8]] as P2[]); const qi = rint(rng, 0, 3);
  const s = SIGNS.sin[qi] * sv; const c = SIGNS.cos[qi] * cv; const s2 = r2(sv * sv * 100) / 100; const c2 = r2(cv * cv * 100) / 100;
  const q = mkq(S('identities'), 'pythag-table', {
    prompt: `A survey arm at angle θ in ${QUADS[qi]} has sin θ = ${fmt(s)} and cos θ = ${fmt(c)}. Square each and add.`,
    expression: 'sin²θ + cos²θ = ?', answer: 1,
    hint: qi > 0 ? 'Squaring a negative number gives a positive result.' : 'Square each value, then add.',
    steps: [`sin²θ = (${fmt(s)})² = ${fmt(s2)}.`, `cos²θ = (${fmt(c)})² = ${fmt(c2)}.`, `Sum: ${fmt(s2)} + ${fmt(c2)} = 1, as the Pythagorean identity promises.`],
    visual: { type: 'unitcircle', angle: [45, 135, 225, 315][qi] },
  });
  return model(q, { kind: 'table', cols: ['value', 'squared'], rowLabels: ['sin θ', 'cos θ', 'sum'], rows: [[s, null], [c, null], ['', null]], label: 'Square, then add' }, combos([numForms(s2), numForms(c2), ['1']]), 'Fill in both squares and their sum.');
}
function reciprocalQ(rng: Rng): Question {
  const kind = pick(rng, ['sec', 'csc', 'cot'] as const);
  const [given, ans] = pick(rng, (kind === 'cot' ? [[2, 0.5], [4, 0.25], [0.5, 2], [0.25, 4], [1.25, 0.8]] : [[2, 0.5], [2.5, 0.4], [4, 0.25], [5, 0.2], [1.25, 0.8]]) as P2[]);
  const base = kind === 'sec' ? 'cos' : kind === 'csc' ? 'sin' : 'tan';
  return mkq(S('identities'), 'reciprocal', {
    prompt: `A slope sensor reports ${kind} θ = ${fmt(given)}. Find ${base} θ as a decimal.`,
    expression: `${kind} θ = 1 / ${base} θ`, answer: ans,
    hint: `${kind} is the reciprocal of ${base}.`,
    steps: [`${kind} θ = 1 / ${base} θ, so ${base} θ = 1 / ${kind} θ.`, `${base} θ = 1 ÷ ${fmt(given)} = ${fmt(ans)}.`],
  });
}
const reciprocalStep = (rng: Rng) => typed(reciprocalQ(rng));
function pitchStep(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, PYTH);
  const q = mkq(S('identities'), 'transfer-pitch', {
    prompt: `A roof pitch gauge reads tan θ = ${a}/${b} (θ acute), but the rafter table needs sec θ. Find sec θ as a fraction.`,
    expression: '1 + tan²θ = sec²θ', answer: c / b, fraction: true, tolerance: 0.001, answerText: `${c}/${b}`,
    hint: 'One Pythagorean identity links tan and sec directly.',
    steps: ['Divide sin²θ + cos²θ = 1 by cos²θ: 1 + tan²θ = sec²θ.', `sec²θ = 1 + ${a * a}/${b * b} = ${c * c}/${b * b}.`, `θ is acute, so sec θ = ${lab(`${c}/${b}`, 'rafter length per unit of run')}.`],
    app: 'Carpenters multiply the run by sec θ to get the rafter length.',
  });
  return typed(q);
}
function forceStep(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, PYTH); const k = pick(rng, [1, 2]);
  const q = mkq(S('identities'), 'transfer-force', {
    prompt: `A ${c * k} kN cable pulls a sled up the slope at angle θ with sin θ = ${a}/${c}. What is the horizontal part of the pull, F cos θ?`,
    expression: `F cos θ, sin θ = ${a}/${c}`, answer: b * k, unit: 'kN',
    hint: 'You need cos θ, and you only know sin θ. One identity links them.',
    steps: [`cos θ = √(1 − sin²θ) = √(1 − ${a * a}/${c * c}) = ${b}/${c} (θ is acute).`, `F cos θ = ${lab(c * k, 'cable pull in kN')} × ${lab(`${b}/${c}`, 'cos of the slope angle')} = ${lab(b * k, 'horizontal pull in kN')}.`],
    visual: rtGeo(b, a, ['', '', `${c * k} kN`], 'left', 'θ'),
  });
  return typed(q);
}

/* ======================= 10. sum, difference & double angle ======================= */
function distributeTrapStep(rng: Rng): AskStep {
  const [A, B] = pick(rng, [[30, 60], [45, 45], [30, 30], [60, 60], [90, 30]] as P2[]); const f = pick(rng, ['sin', 'cos'] as TF[]);
  const whole = trigD(f, A + B); const split = trigD(f, A) + trigD(f, B);
  const q = mkq(S('sum-double'), 'distribute-trap', {
    prompt: `Brick wants to split ${f}(${A}° + ${B}°) into ${f} ${A}° + ${f} ${B}°. Does that work?`,
    expression: `${f}(${A}° + ${B}°) ≟ ${f} ${A}° + ${f} ${B}°`, answer: 0,
    hint: 'Work out both sides with exact values and compare.',
    steps: [`${f}(${A}° + ${B}°) = ${f} ${A + B}° = ${exact(f, A + B)}${exact(f, A + B).includes('√') ? ` ≈ ${fmt(r2(whole))}` : ''}.`, `${f} ${A}° + ${f} ${B}° = ${exact(f, A)} + ${exact(f, B)} ${Math.abs(r2(split) - split) < 1e-9 ? '=' : '≈'} ${fmt(r2(split))}.`, `They differ: ${f} does not distribute over +. Use the sum formula instead.`],
  });
  const eq = (x: number) => (Math.abs(r2(x) - x) < 1e-9 ? '=' : '≈');
  return choose(rng, q, `No: ${f} ${A + B}° ${eq(whole)} ${fmt(r2(whole))} but the split gives ${eq(split) === '≈' ? '≈ ' : ''}${fmt(r2(split))}`, [`Yes: ${f} distributes over +`, `Yes: both equal ${exact(f, A + B)}`, 'Only when both angles are acute']);
}
const FORMULAS = [
  { lhs: 'sin(A + B)', right: 'sin A cos B + cos A sin B', wrongs: ['sin A + sin B', 'sin A sin B + cos A cos B', 'sin A cos B − cos A sin B'] },
  { lhs: 'sin(A − B)', right: 'sin A cos B − cos A sin B', wrongs: ['sin A − sin B', 'sin A cos B + cos A sin B', 'cos A cos B − sin A sin B'] },
  { lhs: 'cos(A + B)', right: 'cos A cos B − sin A sin B', wrongs: ['cos A + cos B', 'cos A cos B + sin A sin B', 'sin A cos B + cos A sin B'] },
  { lhs: 'cos(A − B)', right: 'cos A cos B + sin A sin B', wrongs: ['cos A − cos B', 'cos A cos B − sin A sin B', 'sin A sin B − cos A cos B'] },
  { lhs: 'sin 2θ', right: '2 sin θ cos θ', wrongs: ['2 sin θ', 'sin²θ + cos²θ', 'sin θ cos θ'] },
  { lhs: 'cos 2θ', right: 'cos²θ − sin²θ', wrongs: ['2 cos θ', 'cos²θ + sin²θ', '2 sin θ cos θ'] },
  { lhs: 'cos 2θ', right: '1 − 2 sin²θ', wrongs: ['1 − sin²θ', '2 sin²θ − 1', '1 − 2 sin θ'] },
  { lhs: 'tan(A + B)', right: '(tan A + tan B) / (1 − tan A tan B)', wrongs: ['tan A + tan B', '(tan A + tan B) / (1 + tan A tan B)', '(tan A − tan B) / (1 − tan A tan B)'] },
];
function formulaStep(rng: Rng): AskStep {
  const t = pick(rng, FORMULAS);
  const q = mkq(S('sum-double'), 'formula', {
    prompt: `Volt's circuit book lost a page. Which expression equals ${t.lhs}?`,
    expression: `${t.lhs} = ?`, answer: 0,
    hint: t.lhs.startsWith('tan') ? 'Test each choice with A = B = 30°: exactly one gives tan 60° = √3.' : t.lhs.includes('θ') ? 'Test each choice with θ = 30°: exactly one matches.' : 'Test each choice with A = 60°, B = 30°: exactly one matches.',
    steps: [`${t.lhs} = ${t.right}.`, t.lhs.startsWith('cos(') ? 'Cosine formulas pair cos with cos and sin with sin, with the opposite sign.' : t.lhs.startsWith('sin(') ? 'Sine formulas mix: sin cos ± cos sin, with the same sign.' : t.lhs.startsWith('tan') ? 'Check with A = B = 30°: every wrong choice misses tan 60° = √3.' : 'Check with θ = 30°: every wrong choice fails.'],
  });
  return choose(rng, q, t.right, t.wrongs);
}
const EXACT_SUMS = [
  { f: 'sin', d: 75, split: '45° + 30°', work: 'sin 45° cos 30° + cos 45° sin 30° = √6/4 + √2/4', right: '(√6 + √2)/4', naive: '(√2 + 1)/2', flip: '(√6 − √2)/4' },
  { f: 'cos', d: 75, split: '45° + 30°', work: 'cos 45° cos 30° − sin 45° sin 30° = √6/4 − √2/4', right: '(√6 − √2)/4', naive: '(√2 + √3)/2', flip: '(√6 + √2)/4' },
  { f: 'sin', d: 15, split: '45° − 30°', work: 'sin 45° cos 30° − cos 45° sin 30° = √6/4 − √2/4', right: '(√6 − √2)/4', naive: '(√2 − 1)/2', flip: '(√6 + √2)/4' },
  { f: 'cos', d: 15, split: '45° − 30°', work: 'cos 45° cos 30° + sin 45° sin 30° = √6/4 + √2/4', right: '(√6 + √2)/4', naive: '(√2 − √3)/2', flip: '(√6 − √2)/4' },
  { f: 'sin', d: 105, split: '60° + 45°', work: 'sin 60° cos 45° + cos 60° sin 45° = √6/4 + √2/4', right: '(√6 + √2)/4', naive: '(√3 + √2)/2', flip: '(√6 − √2)/4' },
  { f: 'cos', d: 105, split: '60° + 45°', work: 'cos 60° cos 45° − sin 60° sin 45° = √2/4 − √6/4', right: '(√2 − √6)/4', naive: '(1 + √2)/2', flip: '(√2 + √6)/4' },
];
function exactSumStep(rng: Rng): AskStep {
  const t = pick(rng, EXACT_SUMS);
  const q = mkq(S('sum-double'), 'exact-sum', {
    prompt: `A beacon is set at ${t.d}°. Find ${t.f} ${t.d}° exactly, using ${t.d}° = ${t.split}.`,
    expression: `${t.f} ${t.d}° = ${t.f}(${t.split})`, answer: trigD(t.f as TF, t.d), answerText: t.right,
    hint: `Use the ${t.f}(A ${t.split.includes('−') ? '−' : '+'} B) formula, then multiply out the exact values.`,
    steps: [`${t.f}(${t.split}) = ${t.work}.`, `= ${t.right}.`],
  });
  return choose(rng, q, t.right, [t.flip, t.naive, t.right.replace('/4', '/2')]);
}
function doubleCase(rng: Rng) {
  const [a, b, c] = pick(rng, PYTH); const qi = rint(rng, 0, 3); const sN = SIGNS.sin[qi] * a; const cN = SIGNS.cos[qi] * b;
  return { a, b, c, qi, sN, cN, sin2: 2 * sN * cN, cos2: cN * cN - sN * sN, c2: c * c };
}
function doubleQ(rng: Rng): Question {
  const t = doubleCase(rng); const want = pick(rng, ['sin', 'cos'] as TF[]); const n = want === 'sin' ? t.sin2 : t.cos2;
  return mkq(S('sum-double'), 'double-value', {
    prompt: `Volt's shaft sits at θ with sin θ = ${fracStr(t.sN, t.c)} and cos θ = ${fracStr(t.cN, t.c)}. Find ${want} 2θ for the doubled rotor, as a fraction.`,
    expression: want === 'sin' ? 'sin 2θ = 2 sin θ cos θ' : 'cos 2θ = cos²θ − sin²θ', answer: n / t.c2, fraction: true, answerText: fracStr(n, t.c2),
    hint: `Doubling the angle does not double the ${want === 'sin' ? 'sine' : 'cosine'}. Use the double-angle formula.`,
    steps: want === 'sin' ? ['sin 2θ = 2 sin θ cos θ.', `= 2 × ${frP(t.sN, t.c)} × ${frP(t.cN, t.c)} = ${fracStr(t.sin2, t.c2)}.`] : ['cos 2θ = cos²θ − sin²θ.', `= ${t.cN * t.cN}/${t.c2} − ${t.sN * t.sN}/${t.c2} = ${fracStr(t.cos2, t.c2)}.`],
  });
}
const doubleStep = (rng: Rng) => typed(doubleQ(rng));
function doubleTrapStep2(rng: Rng): AskStep {
  const t = doubleCase(rng); const a = Math.abs(t.sN); const b = Math.abs(t.cN); const c = t.c;
  const q = mkq(S('sum-double'), 'double-trap', {
    prompt: `A cam is set at an acute angle θ with sin θ = ${a}/${c}. Newton needs sin 2θ.`,
    expression: 'sin 2θ = ?', answer: (2 * a * b) / (c * c),
    hint: 'Find cos θ first, then use sin 2θ = 2 sin θ cos θ.',
    steps: [`cos θ = ${b}/${c} (θ acute).`, `sin 2θ = 2 × ${a}/${c} × ${b}/${c} = ${fracStr(2 * a * b, c * c)}.`, `Not 2 × ${a}/${c}: doubling the angle does not double the sine.`],
  });
  return choose(rng, q, fracStr(2 * a * b, c * c), [fracStr(2 * a, c), fracStr(a * b, c * c), fracStr(b * b - a * a, c * c)]);
}
function doubleTableStep(rng: Rng): AskStep {
  const [s0, c0] = pick(rng, [[0.6, 0.8], [0.8, 0.6]] as P2[]); const qi = rint(rng, 0, 3); const s = SIGNS.sin[qi] * s0; const c = SIGNS.cos[qi] * c0;
  const s2 = r2(2 * s * c); const c2 = r2(c * c - s * s);
  const q = mkq(S('sum-double'), 'double-table', {
    prompt: `Volt's rotor sits at θ in ${QUADS[qi]}. Fill in sin 2θ and cos 2θ for the doubled rotor.`,
    expression: 'sin 2θ = 2 sin θ cos θ,  cos 2θ = cos²θ − sin²θ', answer: s2,
    hint: [
      'Both sin θ and cos θ are positive here. For cos 2θ, square each value and subtract: the result can still be negative.',
      'One of sin θ, cos θ is negative here, so 2 sin θ cos θ is negative. Squares are never negative.',
      'Both sin θ and cos θ are negative here, so their product is positive. Squares are never negative.',
      'One of sin θ, cos θ is negative here, so 2 sin θ cos θ is negative. Squares are never negative.',
    ][qi],
    steps: [`sin 2θ = 2 × ${par(s)} × ${par(c)} = ${fmt(s2)}.`, `cos 2θ = ${par(c)}² − ${par(s)}² = ${fmt(r2(c * c))} − ${fmt(r2(s * s))} = ${fmt(c2)}.`],
    visual: { type: 'unitcircle', angle: [45, 135, 225, 315][qi] },
  });
  return model(q, { kind: 'table', cols: ['sin θ', 'cos θ', 'sin 2θ', 'cos 2θ'], rows: [[s, c, null, null]], label: 'Double the angle' }, combos([numForms(s2), numForms(c2)]), 'Fill in sin 2θ and cos 2θ.');
}
const DOUBLE_PTS: { p: number; q: number }[] = [{ p: 2, q: 1 }, { p: 1, q: 2 }, { p: 3, q: 1 }, { p: 1, q: 3 }, { p: 2, q: -1 }, { p: -1, q: 2 }, { p: -2, q: 1 }, { p: 3, q: -1 }];
function doublePlotStep(rng: Rng): AskStep {
  const { p, q: qq } = pick(rng, DOUBLE_PTS); const m = p * p + qq * qq;
  const x = (5 * (p * p - qq * qq)) / m; const y = (5 * 2 * p * qq) / m;
  const surd = (n: number) => `${n < 0 ? '−' : ''}${Math.abs(n)}/√${m}`; const surdP = (n: number) => (n < 0 ? `(${surd(n)})` : surd(n));
  const q = mkq(S('sum-double'), 'double-plot', {
    prompt: `A 5 m crane arm points at θ with cos θ = ${surd(p)} and sin θ = ${surd(qq)}, and the slew doubles the angle. Tap the tip at 2θ.`,
    expression: 'tip = (5 cos 2θ, 5 sin 2θ)', answer: x,
    hint: 'Use cos 2θ = cos²θ − sin²θ and sin 2θ = 2 sin θ cos θ, then scale by 5.',
    steps: [`cos 2θ = ${p * p}/${m} − ${qq * qq}/${m} = ${fracStr(p * p - qq * qq, m)}.`, `sin 2θ = 2 × ${surdP(qq)} × ${surdP(p)} = ${fracStr(2 * p * qq, m)}.`, `Tip = (5 × ${frP(p * p - qq * qq, m)}, 5 × ${frP(2 * p * qq, m)}) with ${lab(5, 'arm length in m')}: x = ${lab(fmt(x), 'x-coordinate in m')}, y = ${lab(fmt(y), 'y-coordinate in m')}.`],
  });
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: 'Tip at 2θ', layers: { segments: circleSegs(5) } }, [`${Math.round(x)},${Math.round(y)}`], 'Tap the tip of the arm after the angle doubles.');
}
function sumValueQ(rng: Rng): Question {
  const A = pick(rng, [[3, 4, 5], [4, 3, 5]]); const B = pick(rng, [[5, 12, 13], [12, 5, 13]]); const kind = pick(rng, ['sin+', 'sin-', 'cos+', 'cos-'] as const);
  const [sA, cA] = [A[0], A[1]]; const [sB, cB] = [B[0], B[1]];
  const n = kind === 'sin+' ? sA * cB + cA * sB : kind === 'sin-' ? sA * cB - cA * sB : kind === 'cos+' ? cA * cB - sA * sB : cA * cB + sA * sB;
  const lhs2 = `${kind.slice(0, 3)}(A ${kind.endsWith('+') ? '+' : '−'} B)`;
  const form = kind === 'sin+' ? 'sin A cos B + cos A sin B' : kind === 'sin-' ? 'sin A cos B − cos A sin B' : kind === 'cos+' ? 'cos A cos B − sin A sin B' : 'cos A cos B + sin A sin B';
  const terms = kind === 'sin+' ? [sA * cB, cA * sB, '+'] : kind === 'sin-' ? [sA * cB, cA * sB, '−'] : kind === 'cos+' ? [cA * cB, sA * sB, '−'] : [cA * cB, sA * sB, '+'];
  return mkq(S('sum-double'), 'sum-value', {
    prompt: `Two struts meet at acute angles A and B, with sin A = ${sA}/5, cos A = ${cA}/5, sin B = ${sB}/13, cos B = ${cB}/13. Find ${lhs2} as a fraction.`,
    expression: `${lhs2} = ${form}`, answer: n / 65, fraction: true, answerText: fracStr(n, 65),
    hint: 'Write the formula, then multiply the fractions term by term.',
    steps: [`${lhs2} = ${form}.`, `= ${terms[0]}/65 ${terms[2]} ${terms[1]}/65 = ${fracStr(n, 65)}.`],
  });
}
const sumValueStep = (rng: Rng) => typed(sumValueQ(rng));
/** Table model: from sin and cos of A and B, fill sin(A + B) and cos(A + B). */
function sumTableStep(rng: Rng): AskStep {
  const [sA, cA] = pick(rng, [[3, 4], [4, 3]] as P2[]); const [sB, cB] = pick(rng, [[5, 12], [12, 5]] as P2[]);
  const sn = sA * cB + cA * sB; const cn = cA * cB - sA * sB;
  const q = mkq(S('sum-double'), 'sum-table', {
    prompt: 'Two brackets meet at acute angles A and B. Fill in sin and cos of the combined angle A + B.',
    expression: 'sin(A + B) and cos(A + B) = ?', answer: sn / 65,
    hint: 'Sine mixes (sin cos + cos sin); cosine pairs like with like and flips the sign.',
    steps: [`sin(A + B) = ${sA}/5 × ${cB}/13 + ${cA}/5 × ${sB}/13 = ${sA * cB}/65 + ${cA * sB}/65 = ${fracStr(sn, 65)}.`, `cos(A + B) = ${cA}/5 × ${cB}/13 − ${sA}/5 × ${sB}/13 = ${cA * cB}/65 − ${sA * sB}/65 = ${fracStr(cn, 65)}.`, `Check: (${fracStr(sn, 65)})² + (${fracStr(cn, 65)})² = ${sn * sn + cn * cn}/4225 = 1.`],
  });
  return model(q, { kind: 'table', cols: ['sin', 'cos'], rowLabels: ['A', 'B', 'A + B'], rows: [[`${sA}/5`, `${cA}/5`], [`${sB}/13`, `${cB}/13`], [null, null]], label: 'Combine the angles' }, [`${fracStr(sn, 65)},${fracStr(cn, 65)}`], 'Fill in sin(A + B) and cos(A + B) as fractions over 65.');
}
const COLLAPSE: [string, number, string][] = [['2 sin 15° cos 15°', 0.5, 'sin 30°'], ['2 sin 75° cos 75°', 0.5, 'sin 150°'], ['cos²60° − sin²60°', -0.5, 'cos 120°'], ['2 cos²30° − 1', 0.5, 'cos 60°'], ['2 sin 105° cos 105°', -0.5, 'sin 210°'], ['1 − 2 sin²45°', 0, 'cos 90°']];
function collapseStep(rng: Rng): AskStep {
  const [expr, v, as] = pick(rng, COLLAPSE);
  const q = mkq(S('sum-double'), 'transfer-collapse', {
    prompt: `A power meter's formula contains ${expr}. Collapse it with a double-angle formula and give its value as a decimal.`,
    expression: expr, answer: v,
    hint: 'Match the pattern: 2 sin θ cos θ, cos²θ − sin²θ, 2 cos²θ − 1 or 1 − 2 sin²θ.',
    steps: [`${expr} is a double-angle pattern: it equals ${as}.`, `${as} = ${fmt(v)}.`],
    app: 'AC power engineers collapse products of sines this way to find average power.',
  });
  return typed(q);
}
function tanSumStep(rng: Rng): AskStep {
  const [t1, t2, ans] = pick(rng, [[[1, 2], [1, 3], 45], [[1, 4], [3, 5], 45], [[1, 5], [2, 3], 45], [[1, 7], [3, 4], 45], [[2, 1], [3, 1], 135]] as [P2, P2, number][]);
  const T1 = fracStr(t1[0], t1[1]); const T2 = fracStr(t2[0], t2[1]);
  const num = t1[0] * t2[1] + t2[0] * t1[1]; const den = t1[1] * t2[1] - t1[0] * t2[0]; const tv = num / den;
  const q = mkq(S('sum-double'), 'transfer-tan-sum', {
    prompt: `Two ramps climb at acute angles A and B with tan A = ${T1} and tan B = ${T2}. Laid end to end, what is A + B in degrees?`,
    expression: 'tan(A + B) = (tan A + tan B) / (1 − tan A tan B)', answer: ans, unit: '°',
    hint: 'Find tan(A + B) with the sum formula, then ask which angle between 0° and 180° has that tangent.',
    steps: [`tan(A + B) = (${T1} + ${T2}) / (1 − ${T1} × ${T2}) = ${fracStr(num, t1[1] * t2[1])} ÷ ${den < 0 ? `(${fracStr(den, t1[1] * t2[1])})` : fracStr(den, t1[1] * t2[1])} = ${fmt(tv)}.`, `A + B is between 0° and 180°, and tan ${ans}° = ${fmt(tv)}, so A + B = ${lab(`${ans}°`, 'combined ramp angle')}.`],
  });
  return typed(q);
}

/* ======================= 11. laws of sines & cosines ======================= */
/** b worked with the 4-dp sines the steps show. */
const lawSinesShown = (A: number, B: number, a: number) => (a * r4(sinD(B))) / r4(sinD(A));
/** Every (A, B, a) whose answer b the shown 4-dp sines round the same way (see safe1). */
const LAW_SINES_POOL = Array.from({ length: 17 }, (_, i) => 5 * (i + 6)).flatMap((A) => Array.from({ length: 17 }, (_, j) => 5 * (j + 6)).flatMap((B) => Array.from({ length: 23 }, (_, k) => ({ A, B, a: k + 8 }))))
  .filter(({ A, B, a }) => A + B <= 155 && A !== B && safe1((a * sinD(B)) / sinD(A), lawSinesShown(A, B, a), r2(lawSinesShown(A, B, a))));
function lawSinesQ(rng: Rng): Question {
  const { A, B, a } = pick(rng, LAW_SINES_POOL); const bs = lawSinesShown(A, B, a);
  const C = 180 - A - B; const b = (a * sinD(B)) / sinD(A); const c = (a * sinD(C)) / sinD(A);
  const [PA, PB, PC] = placeTri(a, b, c);
  return mkq(S('laws'), 'law-sines', {
    prompt: `Survey stations A and B sight beacon C: angle A = ${A}°, angle B = ${B}°, and side a = ${a} m. Find side b to 1 decimal place.`,
    expression: 'a / sin A = b / sin B', ...dec1(b), unit: 'm',
    hint: 'No right angle, so no SOH-CAH-TOA. Pair each side with the angle opposite it.',
    steps: ['Law of sines: a / sin A = b / sin B (each side over the sine of its opposite angle).', `b = ${lab(a, 'side a in m')} × sin ${lab(`${B}°`, 'angle B')} ÷ sin ${lab(`${A}°`, 'angle A')} ≈ ${a} × ${f4(sinD(B))} ÷ ${f4(sinD(A))} ${eq2(bs)} ${fmt(r2(bs))}.`, `b ≈ ${lab(s1(b), 'side b in m')}.`],
    visual: triGeo(PA, PB, PC, [`a = ${a} m`, 'b = ?', ''], [`${A}°`, `${B}°`, '']),
  });
}
const lawSinesStep = (rng: Rng) => typed(lawSinesQ(rng));
/** Misconception probe: pair each side with the angle facing it. */
function lawSinesSetupStep(rng: Rng): AskStep {
  let A = 0; let B = 0; let C = 0;
  // A ≠ 90° (sin A = 1 would make "a sin B" equal to the right answer); distinct angles keep the choices distinct.
  do { A = 5 * rint(rng, 6, 22); B = 5 * rint(rng, 6, 22); C = 180 - A - B; } while (C < 20 || A === 90 || A === B || B === C || A === C);
  const a = rint(rng, 8, 30); const b = (a * sinD(B)) / sinD(A); const c = (a * sinD(C)) / sinD(A);
  const [PA, PB, PC] = placeTri(a, b, c);
  const q = mkq(S('laws'), 'law-sines-setup', {
    prompt: `Survey stations A and B sight beacon C: angle A = ${A}°, angle B = ${B}°, and side a = ${a} m. Which equation finds side b?`,
    expression: 'a / sin A = b / sin B', answer: b,
    hint: 'Each side goes with the angle facing it. Which angle faces b?',
    steps: ['Law of sines: each side over the sine of the angle opposite it, so a / sin A = b / sin B.', `Multiply both sides by sin B: b = ${a} sin ${B}° ÷ sin ${A}°.`, `That gives b ≈ ${lab(s1(b), 'side b in m')}.`],
    visual: triGeo(PA, PB, PC, [`a = ${a} m`, 'b = ?', ''], [`${A}°`, `${B}°`, '']),
  });
  return choose(rng, q, `b = ${a} sin ${B}° ÷ sin ${A}°`, [`b = ${a} sin ${A}° ÷ sin ${B}°`, `b = ${a} sin ${C}° ÷ sin ${A}°`, `b = ${a} sin ${B}°`]);
}
/** The law of sines run backwards: find an angle. a > b, so B < A and only the acute answer fits. */
function lawSinesAngleQ(rng: Rng): Question {
  let A = 40; let a = 12; let b = 9; let B = asinD((b * sinD(A)) / a);
  for (let g = 0; g < 80; g++) {
    A = pick(rng, [30, 35, 40, 45, 50, 55, 60, 65, 70]); a = rint(rng, 8, 20); b = rint(rng, 5, a - 2); B = asinD((b * sinD(A)) / a);
    if (B >= 12 && A - B >= 3 && Math.abs(B - Math.floor(B) - 0.5) > 0.15) break;
  }
  const C = 180 - A - B; const c = (a * sinD(C)) / sinD(A); const [PA, PB, PC] = placeTri(a, b, c); const sB = (b * sinD(A)) / a;
  return mkq(S('laws'), 'law-sines-angle', {
    prompt: `A roof truss has angle A = ${A}°, side a = ${a} m opposite it, and side b = ${b} m. Find angle B to the nearest degree.`,
    expression: 'sin B / b = sin A / a', ...nearestDeg(B), unit: '°',
    hint: 'Flip the law of sines so the unknown angle is on top: sin B / b = sin A / a.',
    steps: [`sin B = b sin A ÷ a = ${lab(b, 'side b in m')} × ${f4(sinD(A))} ÷ ${lab(a, 'side a in m')} ≈ ${f4(sB)}.`, `B = sin⁻¹(${f4(sB)}) ≈ ${fmt(r2(B))}°, so B ≈ ${lab(`${Math.round(B)}°`, 'angle B')}.`, `The obtuse partner 180° − ${Math.round(B)}° cannot fit: b < a means B < A, and A + ${180 - Math.round(B)}° would pass 180°.`],
    visual: triGeo(PA, PB, PC, [`a = ${a} m`, `b = ${b} m`, ''], [`${A}°`, 'B = ?', '']),
  });
}
const lawSinesAngleStep = (rng: Rng) => typed(lawSinesAngleQ(rng));
/** Does the obtuse partner B₂ = 180° − B₁ also make a triangle? Links sin⁻¹ to the ambiguous case. */
function obtusePartnerStep(rng: Rng): AskStep {
  const two = rng.next() < 0.5;
  let [A, a, b] = two ? [30, 8, 12] : [40, 12, 9]; let B1 = asinD((b * sinD(A)) / a);
  for (let g = 0; g < 80; g++) {
    const A0 = two ? pick(rng, [25, 30, 35, 40, 45]) : pick(rng, [35, 40, 45, 50, 55, 60]);
    const b0 = two ? rint(rng, 10, 20) : rint(rng, 6, 18); const a0 = two ? rint(rng, 6, b0 - 2) : rint(rng, b0 + 2, 20);
    const ratio = (b0 * sinD(A0)) / a0; if (ratio >= 1) continue;
    const B0 = asinD(ratio); const r0 = Math.round(B0);
    if (B0 >= 12 && B0 <= 80 && Math.abs(B0 - Math.floor(B0) - 0.5) > 0.15 && Math.abs(r0 - A0) >= 3) { [A, a, b, B1] = [A0, a0, b0, B0]; break; }
  }
  const r = Math.round(B1); const B2 = 180 - r; const sum = A + B2; const fits = sum < 180;
  const q = mkq(S('laws'), 'obtuse-partner', {
    prompt: `Angle A = ${A}°, a = ${a} m and b = ${b} m. sin⁻¹ gives B₁ ≈ ${r}°; does B₂ = 180° − ${r}° = ${B2}° also make a triangle?`,
    expression: `A + B₂ = ${A}° + ${B2}°`, answer: fits ? 1 : 0,
    hint: 'sin(180° − B) = sin B, so both angles fit the sine. The question is whether A + B₂ leaves room for C.',
    steps: [`sin B₂ = sin B₁, so B₂ = ${B2}° satisfies the law of sines too.`, `A + B₂ = ${lab(`${A}°`, 'angle A')} + ${lab(`${B2}°`, 'obtuse partner')} = ${lab(`${sum}°`, 'angle sum')}, which is ${fits ? 'less than 180°, leaving room for angle C' : 'not less than 180°, leaving no room for angle C'}.`, fits ? 'So two triangles fit: the ambiguous case (a < b).' : 'So only B₁ fits (a > b means B < A).'],
  });
  const yes = `Yes: ${A}° + ${B2}° = ${sum}° < 180°, so two triangles fit`; const no = `No: ${A}° + ${B2}° = ${sum}°, which leaves no room for C`;
  return choose(rng, q, fits ? yes : no, ['Yes: sine is positive in Quadrant II, so the obtuse angle always fits', 'No: sin⁻¹ never gives obtuse angles, so they never fit', fits ? `No: ${A}° + ${B2}° is too big for a triangle` : `Yes: ${A}° + ${B2}° still leaves room for C`]);
}
const SAS_EXACT: [number, number, number, number][] = [[8, 5, 60, 7], [8, 3, 60, 7], [15, 8, 60, 13], [16, 6, 60, 14], [7, 15, 60, 13], [3, 5, 120, 7], [7, 8, 120, 13], [5, 16, 120, 19]];
/** a² + b² − 2ab cos C, exactly and with the cosine rounded to 4 dp as a student might. */
const lawCosC2 = (a: number, b: number, C: number) => a * a + b * b - 2 * a * b * cosD(C);
const lawCosC2Shown = (a: number, b: number, C: number) => a * a + b * b - 2 * a * b * r4(cosD(C));
/** A side c safe to ask to 1 dp: √ of the 2-dp c² the steps show, and of c² from a 4-dp cosine, both round like c. */
const lawCosSafe = (a: number, b: number, C: number) => { const c2 = lawCosC2(a, b, C); return safe1(Math.sqrt(c2), Math.sqrt(r2(c2)), Math.sqrt(lawCosC2Shown(a, b, C))); };
const LAW_COS_POOL = Array.from({ length: 16 }, (_, i) => i + 5).flatMap((a) => Array.from({ length: 16 }, (_, j) => j + 5).flatMap((b) => Array.from({ length: 21 }, (_, k) => 5 * (k + 6)).map((C) => ({ a, b, C, c: Math.sqrt(lawCosC2(a, b, C)) }))))
  .filter(({ a, b, C }) => lawCosSafe(a, b, C));
function lawCosQ(rng: Rng): Question {
  let a: number; let b: number; let C: number; let c: number; let exactCase = false;
  if (rng.next() < 0.5) { [a, b, C, c] = pick(rng, SAS_EXACT); exactCase = true; }
  else ({ a, b, C, c } = pick(rng, LAW_COS_POOL));
  const c2 = a * a + b * b - 2 * a * b * cosD(C);
  const [PA, PB, PC] = placeTri(a, b, c);
  return mkq(S('laws'), 'law-cosines', {
    prompt: `Two cable stays of ${a} m and ${b} m meet at ${C}°. How far apart are their far ends${exactCase ? '' : ', to 1 decimal place'}?`,
    expression: 'c² = a² + b² − 2ab cos C', ...(exactCase ? { answer: c } : dec1(c)), unit: 'm',
    hint: 'Two sides and the angle between them: the law of cosines.',
    steps: ['Two sides and the included angle: c² = a² + b² − 2ab cos C.', `a = ${lab(a, 'first stay in m')}, b = ${lab(b, 'second stay in m')}, C = ${lab(`${C}°`, 'angle between')}: c² = ${a * a} + ${b * b} − 2 × ${a} × ${b} × cos ${C}° ${exactCase ? `= ${fmt(Math.round(c2))}` : `${eq2(c2)} ${fmt(r2(c2))}`}.`, exactCase ? `c = √${Math.round(c2)} = ${lab(c, 'gap between the ends in m')}.` : `c = √${fmt(r2(c2))} ≈ ${lab(s1(c), 'gap between the ends in m')}.`],
    visual: triGeo(PA, PB, PC, [`${a} m`, `${b} m`, 'c = ?'], ['', '', `${C}°`]),
  });
}
const lawCosStep = (rng: Rng) => typed(lawCosQ(rng));
const WHICH_LAW = [
  { given: 'angle A, angle B and side a', law: 'Law of sines', why: 'Two angles and a side: every side can be paired with its opposite angle.' },
  { given: 'angle A, angle B and side c between them', law: 'Law of sines', why: 'Find the third angle (180° minus the other two), then pair sides with opposite angles.' },
  { given: 'sides a and b and the angle C between them', law: 'Law of cosines', why: 'Two sides and the included angle: c² = a² + b² − 2ab cos C.' },
  { given: 'all three sides a, b and c', law: 'Law of cosines', why: 'Three sides and no angle: rearrange c² = a² + b² − 2ab cos C for cos C.' },
];
function whichLawStep(rng: Rng): AskStep {
  const t = pick(rng, WHICH_LAW);
  const q = mkq(S('laws'), 'which-law', {
    prompt: `In a triangle with no right angle, Ada knows ${t.given}. Which tool should she use first?`,
    expression: `known: ${t.given}`, answer: 0,
    hint: 'The law of sines needs a side with its opposite angle. The law of cosines works from sides around an angle.',
    steps: [t.why, `So: ${t.law}.`, 'SOH-CAH-TOA and Pythagoras need a right angle.'],
  });
  return choose(rng, q, t.law, [t.law === 'Law of sines' ? 'Law of cosines' : 'Law of sines', 'SOH-CAH-TOA', 'Pythagorean theorem']);
}
function cosSignStep(rng: Rng): AskStep {
  const a = rint(rng, 3, 9); let b = rint(rng, 3, 9); if (b === a) b += 1; const c2 = a * a + b * b + a * b;
  const q = mkq(S('laws'), 'cos-sign', {
    prompt: `Sides ${a} m and ${b} m meet at an obtuse 120°. Using c² = a² + b² − 2ab cos C, what is c²?`,
    expression: `c² = ${a * a} + ${b * b} − 2(${a})(${b}) cos 120°`, answer: c2,
    hint: 'cos 120° is negative. Subtracting a negative adds.',
    steps: ['cos 120° = −1/2.', `−2 × ${lab(a, 'side a in m')} × ${lab(b, 'side b in m')} × (−1/2) = +${lab(a * b, 'correction')}.`, `c² = ${lab(a * a, 'a squared')} + ${lab(b * b, 'b squared')} + ${lab(a * b, 'correction')} = ${lab(c2, 'c squared in m²')}.`],
  });
  return choose(rng, q, String(c2), [String(a * a + b * b - a * b), String(a * a + b * b), String((a + b) * (a + b))]);
}
/**
 * Integer triangles (a, b, c): four whose angle C (opposite c) is exactly 60° or 120°, and ten general ones
 * (C = 83°, 96°, 90°, 135°, 72°, 112°, 103°, 84°, 127°, 94°), each well clear of a rounding boundary.
 */
const SSS_CASES: [number, number, number][] = [[3, 5, 7], [5, 8, 7], [7, 8, 13], [8, 15, 13], [4, 5, 6], [7, 9, 12], [3, 4, 5], [6, 7, 12], [8, 9, 10], [5, 7, 10], [6, 8, 11], [5, 8, 9], [4, 6, 9], [3, 5, 6]];
function sssDialStep(rng: Rng): AskStep {
  const [a0, b0, c0] = pick(rng, SSS_CASES); const k = pick(rng, [1, 1, 2]); const a = a0 * k; const b = b0 * k; const c = c0 * k;
  const num = a * a + b * b - c * c; const den = 2 * a * b; const Cx = acosD(num / den); const C = Math.round(Cx); const exactC = Math.abs(Cx - C) < 1e-9;
  const [PA, PB, PC] = placeTri(a, b, c);
  const q = mkq(S('laws'), 'sss-angle', {
    prompt: `A roof truss has members ${a} m, ${b} m and ${c} m. Find the angle C opposite the ${c} m member, to the nearest degree.`,
    expression: 'cos C = (a² + b² − c²) ÷ 2ab', ...nearestDeg(Cx),
    hint: 'Rearrange the law of cosines for cos C. A negative cosine means an obtuse angle.',
    steps: ['cos C = (a² + b² − c²) ÷ 2ab.', `a = ${lab(a, 'member in m')}, b = ${lab(b, 'member in m')}, c = ${lab(c, 'member facing C in m')}: cos C = (${a * a} + ${b * b} − ${c * c}) ÷ ${den} = ${fracStr(num, den)}.`, exactC ? `C = cos⁻¹(${fracStr(num, den)}) = ${lab(`${C}°`, 'angle C')}.` : `C = cos⁻¹(${fracStr(num, den)}) ≈ ${fmt(r2(Cx))}°, so C ≈ ${lab(`${C}°`, 'angle C')}.`],
    visual: triGeo(PA, PB, PC, [`${a} m`, `${b} m`, `${c} m`], ['', '', 'C = ?']),
  });
  return model(q, { kind: 'angle', max: 180, step: 1, label: 'Angle C' }, [String(C)], 'Work out C to the nearest degree, then turn the dial.');
}
function ambiguousStep(rng: Rng): AskStep {
  const b = pick(rng, [10, 20]); const h = b / 2; const a = pick(rng, b === 10 ? [3, 4, 5, 6, 7, 8, 9, 10, 12, 15] : [6, 8, 10, 12, 14, 16, 18, 20, 25]);
  const n = a < h ? 0 : a === h ? 1 : a < b ? 2 : 1;
  const label = ['No triangle', 'Exactly one triangle', 'Two triangles'][n];
  const why = a < h ? `a = ${a} is shorter than h = ${h}: side a cannot reach the base.` : a === h ? `a = ${a} equals h: it meets the base once, at a right angle.` : a < b ? `h = ${h} < a = ${a} < b = ${b}: a can swing to meet the base in two places.` : `a = ${a} ≥ b = ${b}: a meets the base on one side only.`;
  const q = mkq(S('laws'), 'ambiguous', {
    prompt: `SSA check: angle A = 30°, side b = ${b} m, and side a (opposite A) = ${a} m. How many triangles fit?`,
    expression: `A = 30°, b = ${b}, a = ${a}`, answer: n,
    hint: 'Drop the height h = b sin A from C to the base. Compare a with h and with b.',
    steps: [`h = b sin A = ${lab(b, 'side b in m')} × 1/2 = ${lab(h, 'height in m')}.`, why, `${label}.`],
    visual: { type: 'geo', items: [{ t: 'seg', a: [0, 0], b: [b * 1.4, 0] }, { t: 'seg', a: [0, 0], b: [b * cosD(30), h], label: `b = ${b}` }, { t: 'arc', at: [0, 0], from: [b, 0], to: [b * cosD(30), h], label: '30°' }, { t: 'seg', a: [b * cosD(30), h], b: [b * cosD(30), 0], dashed: true, label: 'h' }, { t: 'pt', p: [b * cosD(30), h], label: 'C' }] },
  });
  return choose(rng, q, label, ['No triangle', 'Exactly one triangle', 'Two triangles'].filter((x) => x !== label));
}
function cosTableStep(rng: Rng): AskStep {
  const [a, b] = pick(rng, [[3, 5], [5, 8], [4, 6], [7, 8]] as P2[]); const base = a * a + b * b; const k = 2 * a * b;
  const vals = [base - k / 2, base, base + k / 2];
  const q = mkq(S('laws'), 'cos-table', {
    prompt: `Sides ${a} and ${b} hinge at angle C. Fill in c² as the hinge opens from 60° to 120°.`,
    expression: `c² = ${a * a} + ${b * b} − ${k} cos C`, answer: vals[1],
    hint: 'At 90° the correction term vanishes and you get Pythagoras.',
    steps: [`c² = ${lab(base, 'a² plus b²')} − ${lab(k, 'twice a times b')} × cos C.`, `60°: ${base} − ${k} × 0.5 = ${vals[0]}. 90°: ${base} − 0 = ${vals[1]} (Pythagoras). 120°: ${base} + ${k / 2} = ${vals[2]}.`, 'The law of cosines is Pythagoras plus a correction for the angle.'],
  });
  return model(q, { kind: 'table', cols: ['C', 'cos C', 'c²'], rows: [['60°', 0.5, null], ['90°', 0, null], ['120°', -0.5, null]], label: `a = ${a}, b = ${b}` }, [vals.join(',')], 'Fill in c² for each angle.');
}
function riverStep(rng: Rng): AskStep {
  // P = B would make AP = AB (a trivial isosceles case); the rest must round the same with the 4-dp sines shown.
  const pool = [60, 80, 100, 120, 150, 200].flatMap((d) => [50, 55, 60, 65, 70].flatMap((al) => [45, 50, 55, 60, 65].map((be) => ({ d, al, be })))).filter(({ d, al, be }) => {
    const P = 180 - al - be; const APs = (d * r4(sinD(be))) / r4(sinD(P));
    return P !== be && safe1((d * sinD(be)) / sinD(P), APs, r2(APs));
  });
  const { d, al, be } = pick(rng, pool); const P = 180 - al - be;
  const AP = (d * sinD(be)) / sinD(P); const APs = (d * r4(sinD(be))) / r4(sinD(P));
  const [PA, PB, PC] = placeTri(AP * sinD(al) / sinD(be), AP, d);
  const q = mkq(S('laws'), 'transfer-river', {
    prompt: `Stations A and B, ${d} m apart on one side of a gorge, sight beacon P across it at angle A = ${al}° and angle B = ${be}°. How far is A from P, to 1 decimal place?`,
    expression: 'AP / sin B = AB / sin P', ...dec1(AP), unit: 'm',
    hint: 'Find the angle at P first. AP faces angle B.',
    steps: [`P = ${lab('180°', 'angle sum')} − ${lab(`${al}°`, 'angle A')} − ${lab(`${be}°`, 'angle B')} = ${lab(`${P}°`, 'angle P')}.`, `AP ÷ sin ${be}° = ${lab(d, 'baseline AB in m')} ÷ sin ${P}°, so AP ≈ ${d} × ${f4(sinD(be))} ÷ ${f4(sinD(P))} ≈ ${fmt(r2(APs))}.`, `AP ≈ ${lab(s1(AP), 'distance A to P in m')}.`],
    visual: triGeo(PA, PB, PC, ['', 'AP = ?', `${d} m`], [`${al}°`, `${be}°`, 'P']),
    app: 'Triangulation mapped whole mountain ranges before GPS existed.',
  });
  return typed(q);
}
function shipsStep(rng: Rng): AskStep {
  const pool = [6, 8, 10, 12].flatMap((s1v) => [5, 9, 11, 15].flatMap((s2v) => [40, 50, 70, 110, 130].map((ang) => ({ s1v, s2v, ang })))).filter(({ s1v, s2v, ang }) => lawCosSafe(s1v, s2v, ang));
  const { s1v, s2v, ang } = pick(rng, pool);
  const dist = Math.sqrt(lawCosC2(s1v, s2v, ang));
  const q = mkq(S('laws'), 'transfer-ships', {
    prompt: `Two cable cars leave the summit station on straight lines ${ang}° apart, one travelling ${s1v} km and the other ${s2v} km. How far apart are they, to 1 decimal place?`,
    expression: 'd² = a² + b² − 2ab cos C', ...dec1(dist), unit: 'km',
    hint: 'Two sides and the angle between them.',
    steps: [`d² = ${s1v * s1v} + ${s2v * s2v} − 2 × ${lab(s1v, 'first trip in km')} × ${lab(s2v, 'second trip in km')} × cos ${lab(`${ang}°`, 'angle between')} ≈ ${fmt(r2(dist * dist))}.`, `d = √${fmt(r2(dist * dist))} ≈ ${lab(s1(dist), 'gap in km')}.`],
  });
  return typed(q);
}

/* ======================= 12. trig equations ======================= */
/** All special-angle solutions in [0°, 360°) of f(x) = v. */
const solsOf = (f: TF, v: string) => SPECIAL16.filter((d) => exact(f, d) === v);
const listDeg = (xs: number[]) => (xs.length === 0 ? 'no solution' : xs.length === 1 ? `${dg(xs[0])} only` : `${xs.slice(0, -1).map(dg).join(', ')} and ${dg(xs[xs.length - 1])}`);
const EQ_FORMS: Record<string, (f: string) => string[]> = {
  '√3/2': (f) => [`2 ${f} x = √3`, `2 ${f} x − √3 = 0`], '−√3/2': (f) => [`2 ${f} x = −√3`, `2 ${f} x + √3 = 0`],
  '√2/2': (f) => [`√2 ${f} x = 1`, `2 ${f} x − √2 = 0`], '−√2/2': (f) => [`√2 ${f} x = −1`, `2 ${f} x + √2 = 0`],
  '√3': () => ['tan x = √3', 'tan x − √3 = 0'], '−√3': () => ['tan x + √3 = 0', '3 tan x = −3√3'],
  '√3/3': () => ['√3 tan x = 1', '3 tan x = √3'], '−√3/3': () => ['√3 tan x = −1', '3 tan x + √3 = 0'],
};
function eqCase(rng: Rng, twoOnly = false) {
  for (let g = 0; g < 60; g++) {
    const f = pick(rng, ['sin', 'cos', 'sin', 'cos', 'tan'] as TF[]);
    const v = pick(rng, f === 'tan' ? ['1', '−1', '√3', '−√3', '√3/3', '−√3/3'] : ['1/2', '−1/2', '√2/2', '−√2/2', '√3/2', '−√3/2', '1/2', '−1/2']);
    const sols = solsOf(f, v); if (twoOnly && sols.length !== 2) continue;
    let text: string;
    if (EQ_FORMS[v]) text = pick(rng, EQ_FORMS[v](f));
    else { const val = exVal(v); const k = pick(rng, [2, 4]); const m = pick(rng, [-3, -2, -1, 1, 2, 3]); text = `${k} ${f} x ${fmtSigned(m)} = ${fmt(k * val + m)}`; }
    const ref = refAngle(sols[0]);
    return { f, v, sols, text, ref };
  }
  return { f: 'sin' as TF, v: '1/2', sols: [30, 150], text: '2 sin x − 1 = 0', ref: 30 };
}
function eqSteps(e: ReturnType<typeof eqCase>): string[] {
  const quads = e.sols.map((d) => QUADS[quadIndex(d)].replace('Quadrant ', ''));
  return [`Isolate the function: ${e.f} x = ${e.v}.`, `${e.f} ${lab(dg(e.ref), 'reference angle')} = ${e.v.replace('−', '')}. ${e.f} is ${e.v.startsWith('−') ? 'negative' : 'positive'} in Quadrants ${quads.join(' and ')}.`, `x = ${listDeg(e.sols).replace(' only', '')}.`];
}
function allSolutionsStep(rng: Rng): AskStep {
  const e = eqCase(rng, true);
  const p = principal(e.f, exVal(e.v));
  const others = (['sin', 'cos', 'tan'] as TF[]).filter((g) => g !== e.f).map((g) => solsOf(g, e.v)).filter((s) => s.length === 2);
  // Distractors: the calculator's one angle, another function's pair, the wrong sign's pair, and quadrant slips.
  // (For tan, the reference angle and 180° more is often the right answer itself, so more slips follow.)
  const wrongs = [listDeg([p]), ...others.map(listDeg), listDeg(solsOf(e.f, negEx(e.v))), listDeg([e.ref, 180 + e.ref]), listDeg([e.ref, 360 - e.ref]), listDeg([e.ref, 180 - e.ref])];
  const q = mkq(S('equations'), 'all-solutions', {
    prompt: `Newton's summit signal fires whenever ${e.text}. Which angles fire it for 0° ≤ x < 360°?`,
    expression: e.text, answer: e.sols[0],
    hint: 'The calculator gives one angle. The unit circle has a second angle with the same value. Where?',
    steps: eqSteps(e),
    visual: { type: 'unitcircle' },
  });
  return choose(rng, q, listDeg(e.sols), wrongs);
}
function ucSolveStep(rng: Rng): AskStep {
  const e = eqCase(rng, true); const big = rng.next() < 0.5; const ans = big ? e.sols[1] : e.sols[0];
  const q = mkq(S('equations'), 'solve-circle', {
    prompt: `The signal controller must solve ${e.text} for 0° ≤ x < 360°. Tap the ${big ? 'larger' : 'smaller'} solution.`,
    expression: e.text, answer: ans,
    hint: 'Isolate the trig function, find the reference angle, then use the signs to place both solutions.',
    steps: eqSteps(e),
  });
  return model(q, { kind: 'unitcircle', label: e.text }, [String(ans)], `Tap the ${big ? 'larger' : 'smaller'} solution.`);
}
function tableSolutionsStep(rng: Rng): AskStep {
  const e = eqCase(rng, true);
  const q = mkq(S('equations'), 'solve-table', {
    prompt: `Newton logs every firing angle where ${e.text}, for 0° ≤ x < 360°. Enter both, smaller first.`,
    expression: e.text, answer: e.sols[0],
    hint: 'Two solutions: the reference angle placed in both quadrants where the sign fits.',
    steps: eqSteps(e),
  });
  return model(q, { kind: 'table', cols: ['x₁ (smaller)', 'x₂ (larger)'], rows: [[null, null]], label: 'Solutions in degrees' }, [`${e.sols[0]},${e.sols[1]}`], 'Type both solutions in degrees.');
}
function sliderCrossStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos'] as TF[]); const v = pick(rng, ['1/2', '−1/2', '√2/2', '−√2/2', '√3/2', '−√3/2']); const sols = solsOf(f, v); const big = rng.next() < 0.5; const ans = big ? sols[1] : sols[0];
  const q = mkq(S('equations'), 'solve-graph', {
    prompt: `The line y = ${v} crosses y = ${f} x twice on 0° to 360°. Slide the marker to the ${big ? 'second' : 'first'} crossing.`,
    expression: `${f} x = ${v}`, answer: ans,
    hint: 'Solve it exactly first (reference angle plus quadrant signs), then check against the graph.',
    steps: [`Reference angle: ${dg(refAngle(sols[0]))}.`, `${f} x = ${v} at ${listDeg(sols)}.`, `The ${big ? 'second' : 'first'} crossing is x = ${dg(ans)}.`],
  });
  return model(q, { kind: 'slider', min: 0, max: 360, step: 5, label: 'x in degrees', unit: '°', range: [0, 360, -1.5, 1.5], layers: { fns: [{ fn: { kind: f, deg: true } }], hlines: [{ y: exVal(v), label: `y = ${v}` }] } }, [String(ans)], `Slide to the ${big ? 'second' : 'first'} crossing.`);
}
const COUNT_CASES: { eq: string; n: number; why: string }[] = [
  { eq: 'sin x = 0.3', n: 2, why: '0.3 is between −1 and 1, so the line y = 0.3 crosses one full sine wave twice.' },
  { eq: 'cos x = −0.6', n: 2, why: 'Between −1 and 1: one full cosine wave crosses y = −0.6 twice.' },
  { eq: 'sin x = 1.4', n: 0, why: 'sin x never goes above 1.' },
  { eq: 'cos x = −1', n: 1, why: 'cos x reaches −1 only at its lowest point, 180°.' },
  { eq: 'tan x = 5', n: 2, why: 'tan repeats every 180°, so it hits 5 once in each half turn.' },
  { eq: 'sin 2x = 0.5', n: 4, why: 'sin 2x runs two full waves on 0° to 360°, two crossings each.' },
  { eq: 'cos 3x = 0.2', n: 6, why: 'cos 3x runs three full waves, two crossings each.' },
  { eq: 'sin x = 1', n: 1, why: 'sin x reaches 1 only at its peak, 90°.' },
  { eq: '2 cos x = 3', n: 0, why: 'cos x would have to be 1.5, above its maximum of 1.' },
];
function countQ(rng: Rng): Question {
  const t = pick(rng, COUNT_CASES);
  return mkq(S('equations'), 'count', {
    prompt: `A rotor sensor trips whenever ${t.eq}. How many times does it trip for 0° ≤ x < 360°?`,
    expression: t.eq, answer: t.n,
    hint: 'Picture the graph and the horizontal line. How many waves fit in 0° to 360°, and how often does the line cross each?',
    steps: [t.why, `${t.n} solution${t.n === 1 ? '' : 's'}.`],
  });
}
const countStep = (rng: Rng) => typed(countQ(rng));
function numericSolveQ(rng: Rng): Question {
  const f = pick(rng, ['sin', 'cos', 'tan'] as TF[]); const mag = pick(rng, f === 'tan' ? [0.5, 0.8, 1.5, 2, 3] : [0.2, 0.3, 0.4, 0.6, 0.7, 0.8]); const v = rng.next() < 0.4 ? -mag : mag;
  const p = f === 'sin' ? asinD(v) : f === 'cos' ? acosD(v) : atanD(v);
  let sols: number[];
  if (f === 'sin') sols = v > 0 ? [p, 180 - p] : [180 - p, 360 + p];
  else if (f === 'cos') sols = [p, 360 - p];
  else sols = v > 0 ? [p, 180 + p] : [180 + p, 360 + p];
  const big = sols[1];
  const rule = f === 'sin' ? 'sin(180° − θ) = sin θ' : f === 'cos' ? 'cos(360° − θ) = cos θ' : 'tan repeats every 180°';
  return mkq(S('equations'), 'solve-decimal', {
    prompt: `Volt's rotor sensor reads ${f} x = ${fmt(v)} for 0° ≤ x < 360°. Give the larger angle, to 1 decimal place.`,
    expression: `${f} x = ${fmt(v)}`, ...dec1(big), unit: '°',
    hint: `The calculator gives one angle. Use ${rule} to find the rest, and keep only answers from 0° to 360°.`,
    steps: [`Calculator: ${f}⁻¹(${fmt(v)}) ≈ ${lab(`${fmt(r2(p))}°`, 'calculator angle')}.`, `Since ${rule}${v < 0 && f !== 'cos' ? ' (and adding 360° changes nothing)' : ''}, the solutions from 0° to 360° are ${fmt(r2(sols[0]))}° and ${fmt(r2(sols[1]))}°.`, `The larger is ${s1(big)}°.`],
  });
}
const numericSolveStep = (rng: Rng) => typed(numericSolveQ(rng));
const QUAD_EQS = [
  { eq: '2 sin²x − sin x − 1 = 0', fac: '(2 sin x + 1)(sin x − 1) = 0, so sin x = −1/2 or sin x = 1', sols: [90, 210, 330], wrongs: ['90° and 210°', '30°, 90° and 150°', '90° only'] },
  { eq: '2 cos²x − cos x − 1 = 0', fac: '(2 cos x + 1)(cos x − 1) = 0, so cos x = −1/2 or cos x = 1', sols: [0, 120, 240], wrongs: ['120° and 240°', '0°, 60° and 300°', '0° only'] },
  { eq: '2 sin²x + sin x − 1 = 0', fac: '(2 sin x − 1)(sin x + 1) = 0, so sin x = 1/2 or sin x = −1', sols: [30, 150, 270], wrongs: ['30° and 150°', '90°, 210° and 330°', '30°, 90° and 150°'] },
  { eq: 'sin x cos x = sin x', fac: 'sin x (cos x − 1) = 0, so sin x = 0 or cos x = 1 (never divide by sin x: it can be 0)', sols: [0, 180], wrongs: ['0° only', '90° and 270°', '0°, 90° and 180°'] },
  { eq: '2 cos²x = cos x', fac: 'cos x (2 cos x − 1) = 0, so cos x = 0 or cos x = 1/2 (dividing by cos x would lose cos x = 0)', sols: [60, 90, 270, 300], wrongs: ['60° and 300°', '90° and 270°', '60°, 120°, 240° and 300°'] },
  { eq: 'tan²x = 3', fac: 'tan x = √3 or tan x = −√3: a square root has two signs', sols: [60, 120, 240, 300], wrongs: ['60° and 240°', '60° only', '30°, 150°, 210° and 330°'] },
  { eq: '4 sin²x = 1', fac: 'sin²x = 1/4, so sin x = 1/2 or sin x = −1/2', sols: [30, 150, 210, 330], wrongs: ['30° and 150°', '30° only', '60°, 120°, 240° and 300°'] },
];
function quadraticEqStep(rng: Rng): AskStep {
  const t = pick(rng, QUAD_EQS);
  const q = mkq(S('equations'), 'factor', {
    prompt: `Vector's summit lock opens when ${t.eq}. Solve it for 0° ≤ x < 360°.`,
    expression: t.eq, answer: t.sols[0],
    hint: 'Treat sin x (or cos x) like a single unknown: factor, set each factor to zero, then solve each small equation.',
    steps: [t.fac + '.', `Solve each on 0° to 360°: x = ${listDeg(t.sols).replace(' only', '')}.`],
  });
  return choose(rng, q, listDeg(t.sols), t.wrongs);
}
const MULTI = [
  { eq: 'sin 2x = 1', inner: [90, 450], sols: [45, 225], wrongs: ['45° only', '90° only', '45° and 135°'] },
  { eq: 'sin 2x = 1/2', inner: [30, 150, 390, 510], sols: [15, 75, 195, 255], wrongs: ['15° and 75°', '30° and 150°', '60° and 300°'] },
  { eq: 'cos 2x = 1/2', inner: [60, 300, 420, 660], sols: [30, 150, 210, 330], wrongs: ['30° and 150°', '60° and 300°', '60°, 300°, 420° and 660°'] },
  { eq: 'cos 2x = 0', inner: [90, 270, 450, 630], sols: [45, 135, 225, 315], wrongs: ['45° and 135°', '90° and 270°', '45° only'] },
  { eq: 'sin 2x = −1/2', inner: [210, 330, 570, 690], sols: [105, 165, 285, 345], wrongs: ['105° and 165°', '210° and 330°', '15° and 75°'] },
];
function multiAngleStep(rng: Rng): AskStep {
  const t = pick(rng, MULTI);
  const q = mkq(S('equations'), 'double-angle-eq', {
    prompt: `A gear equation: solve ${t.eq} for 0° ≤ x < 360°.`,
    expression: t.eq, answer: t.sols[0],
    hint: 'If x runs from 0° to 360°, then 2x runs from 0° to 720°: two full turns of solutions.',
    steps: ['Let u = 2x. Since 0° ≤ x < 360°, u runs over 0° ≤ u < 720°.', `u = ${t.inner.map(dg).join(', ')}.`, `Halve each: x = ${listDeg(t.sols).replace(' only', '')}.`],
  });
  return choose(rng, q, listDeg(t.sols), t.wrongs);
}
function tideStep(rng: Rng): AskStep {
  const A = pick(rng, [2, 3, 4]); const D = pick(rng, [4, 5, 6]); const up = rng.next() < 0.5; const target = up ? D + A / 2 : D - A / 2; const t = up ? 1 : 7;
  const q = mkq(S('equations'), 'transfer-tide', {
    prompt: `The harbour depth is h = ${D} + ${A} sin(30t°) metres, t in hours after midnight. When is the depth first ${fmt(target)} m?`,
    expression: `${D} + ${A} sin(30t°) = ${fmt(target)}`, answer: t, unit: 'h',
    hint: 'Isolate the sine, solve for the angle 30t, then divide by 30.',
    steps: [`Take away the ${lab(D, 'mean depth in m')}: ${lab(A, 'tide swing in m')} × sin(30t°) = ${lab(fmt(target - D), 'metres from the mean')}, so sin(30t°) = ${up ? '1/2' : '−1/2'}.`, `The first angle that works is 30t = ${lab(`${up ? 30 : 210}°`, 'tide angle')}.`, `t = ${up ? 30 : 210} ÷ ${lab(30, 'degrees per hour')} = ${lab(t, t === 1 ? 'hour after midnight' : 'hours after midnight')}.`],
    app: 'Harbour masters schedule ships by solving tide equations like this.',
  });
  return typed(q);
}
/** Transfer (trial): a reservoir level on a cosine cycle; when is it first at a given level? */
function reservoirStep(rng: Rng): AskStep {
  const A = pick(rng, [2, 4, 6]); const D = pick(rng, [10, 12, 15]);
  const c = pick(rng, [{ v: '1/2', level: D + A / 2, ang: 60 }, { v: '0', level: D, ang: 90 }, { v: '−1/2', level: D - A / 2, ang: 120 }]); const t = c.ang / 30;
  const q = mkq(S('equations'), 'transfer-reservoir', {
    prompt: `A mountain reservoir's level is h = ${D} + ${A} cos(30t°) m, t in months after 1 January. How many months until it first falls to ${fmt(c.level)} m?`,
    expression: `${D} + ${A} cos(30t°) = ${fmt(c.level)}`, answer: t, unit: 'months',
    hint: 'Isolate the cosine, find the first angle 30t that works, then divide by 30.',
    steps: [`Take away the ${lab(D, 'mean level in m')}: ${lab(A, 'seasonal swing in m')} × cos(30t°) = ${lab(fmt(c.level - D), 'metres from the mean')}, so cos(30t°) = ${c.v}.`, `Starting from 0° (full), the first angle with cosine ${c.v} is 30t = ${lab(`${c.ang}°`, 'cycle angle')}.`, `t = ${c.ang} ÷ ${lab(30, 'degrees per month')} = ${lab(t, 'months')}.`],
    app: 'Water engineers plan releases around seasonal cycles like this.',
  });
  return typed(q);
}
function jointStep(rng: Rng): AskStep {
  const t = pick(rng, [{ eq: '2 cos θ + 1 = 0', ans: 120, iso: 'cos θ = −1/2' }, { eq: '2 cos θ − √3 = 0', ans: 30, iso: 'cos θ = √3/2' }, { eq: '√2 cos θ + 1 = 0', ans: 135, iso: 'cos θ = −√2/2' }, { eq: 'tan θ + 1 = 0', ans: 135, iso: 'tan θ = −1' }, { eq: '2 cos θ + √3 = 0', ans: 150, iso: 'cos θ = −√3/2' }]);
  const q = mkq(S('equations'), 'transfer-joint', {
    prompt: `A robot elbow bends only from 0° to 180°, and its controller solves ${t.eq}. Which angle does it set?`,
    expression: t.eq, answer: t.ans, unit: '°',
    hint: 'Isolate the function. On 0° to 180° there is only one answer.',
    steps: [`${t.iso}.`, `On 0° to 180°, the only angle with ${t.iso} is ${lab(`${t.ans}°`, 'elbow angle')}.`],
  });
  return typed(q);
}

/* ======================= chapters ======================= */
const CHAPTERS: ChapterSpec[] = [
  {
    key: 'ratios', title: 'SOH-CAH-TOA from Similar Triangles', wing: 'ridge', wingName: "Surveyor's Ridge",
    goal: 'Name opposite, adjacent and hypotenuse from a marked angle, write sin, cos and tan as side ratios, and explain why the ratio depends only on the angle.',
    misconception: 'Treating "opposite" and "adjacent" as fixed sides of the drawing (they swap when θ moves corners), and thinking a bigger triangle has a bigger sine.',
    teach: [
      { title: 'Name the sides from θ', text: 'Stand at the marked angle θ. The hypotenuse faces the right angle. The opposite leg faces θ; the adjacent leg touches it. Move θ to the other corner and opposite and adjacent swap.', steps: ['In the picture θ is at the bottom-left corner: 4 (adjacent), 3 (opposite), 5 (hypotenuse).', 'The hypotenuse is the longest side: 3² + 4² = 9 + 16 = 25 (hypotenuse squared) = 5².', 'Move θ to the top corner and the legs swap: 4 (now opposite), 3 (now adjacent), 5 (still the hypotenuse).'], visual: rtGeo(4, 3, ['adjacent', 'opposite', 'hypotenuse']) },
      { title: 'Same angle, same ratio', text: 'Scale a 3-4-5 brace to 6-8-10: every side doubles, so opposite ÷ hypotenuse stays 3/5. Similar triangles share their ratios, so the ratio belongs to the angle, not the size. That is why it earns a name.', steps: ['Small brace: 3 (opposite) ÷ 5 (hypotenuse) = 0.6 (ratio)', 'Big brace: 6 (opposite) ÷ 10 (hypotenuse) = 0.6 (same ratio)', 'Adjacent ÷ hypotenuse matches too: 4 (adjacent) ÷ 5 (hypotenuse) = 0.8 and 8 (adjacent) ÷ 10 (hypotenuse) = 0.8.', 'Same θ, same ratios, whatever the size.'], visual: { type: 'geo', items: [{ t: 'poly', pts: [[0, 0], [4, 0], [4, 3]], labels: ['4', '3', '5'] }, { t: 'arc', at: [0, 0], from: [4, 0], to: [4, 3], label: 'θ' }, { t: 'poly', pts: [[6, 0], [14, 0], [14, 6]], labels: ['8', '6', '10'] }, { t: 'arc', at: [6, 0], from: [14, 0], to: [14, 6], label: 'θ' }] } },
      { title: 'SOH-CAH-TOA', text: 'Three ratios, three names. sin θ = opposite ÷ hypotenuse, cos θ = adjacent ÷ hypotenuse, tan θ = opposite ÷ adjacent. Name the sides first, then divide.', steps: ['The 3-4-5 brace with θ at the bottom corner: 3 (opposite), 4 (adjacent), 5 (hypotenuse).', 'SOH: 3 (opposite) ÷ 5 (hypotenuse) = 0.6, so sin θ = 0.6', 'CAH: 4 (adjacent) ÷ 5 (hypotenuse) = 0.8, so cos θ = 0.8', 'TOA: 3 (opposite) ÷ 4 (adjacent) = 0.75, so tan θ = 0.75'], next: 'Move θ to the top corner of the same brace. What is tan θ now?', visual: { type: 'card', title: 'SOH · CAH · TOA', lines: ['sin θ = opposite / hypotenuse', 'cos θ = adjacent / hypotenuse', 'tan θ = opposite / adjacent'] } },
    ],
    quests: [
      { id: 'aq.trig.ratios.brace', name: 'The Crane Brace', giver: 'ada', guided: true, hook: 'Ada: "The survey crane on the ridge is braced with right triangles. Name every side from the marked angle, or the braces go in upside down."', change: 'The ridge crane stands braced and square.',
        waves: [wave('Name the sides', mixOf([nameSideStep, nameSideStep, rampPointStep])), wave('Same angle, same ratio', mixOf([similarTableStep, sameRatioStep, similarTableStep])), wave('Write the ratio', mixOf([writeRatioStep, ratioValueStep, rampPointStep]))] },
      { id: 'aq.trig.ratios.ramps', name: 'Ramp Survey', giver: 'brick', hook: 'Brick: "Every ore ramp on the ridge has a slope card. Half of them are wrong. Check the ratios."', change: 'Every ramp on the ridge carries a true slope card.',
        waves: [wave('Ratios', mixOf([writeRatioStep, writeRatioStep, ratioValueStep])), wave('Pick the brace', mixOf([whichTriangleStep, rampPointStep, nameSideStep])), wave('Scale it', mixOf([similarTableStep, ratioValueStep, rampPointStep]))] },
    ],
    concept: conceptFrom([similarTableStep, whichTriangleStep, rampPointStep, sameRatioStep]),
    transfer: oneOf([ladderStep, shadowStep]),
    practice: ratioValueQ,
  },
  {
    key: 'solve-right', title: 'Solving Right Triangles', wing: 'ridge', wingName: 'Crane Yard',
    goal: 'Find a missing side with the right ratio, a missing angle with an inverse function, and solve angle-of-elevation and angle-of-depression problems.',
    misconception: 'Multiplying when the unknown is on the bottom of the ratio; reading sin⁻¹ as 1 ÷ sin; measuring elevation or depression from the vertical.',
    teach: [
      { title: 'Pick the ratio, then solve', text: 'Name the side you want and the side you know from the angle. The ratio that uses exactly those two is your equation. Unknown on top: multiply. Unknown on the bottom: divide.', steps: ['Want: x, opposite the 35° (given angle). Know: 20 (hypotenuse in m). Opposite and hypotenuse → sin.', 'sin 35° = x ÷ 20 (hypotenuse in m)', 'x is on top, so multiply: 20 (hypotenuse in m) × sin 35° = 20 × 0.5736 (sine of the angle) ≈ 11.5 (opposite in m)', 'Unknown on the bottom instead? 11.5 (opposite in m) ÷ sin 35° ≈ 20 (hypotenuse in m) gets the hypotenuse back.'], next: 'Now find the bottom side next to 35°. Which ratio links it to the 20 m hypotenuse, and how long is it?', visual: rtGeo(cosD(35) * 10, sinD(35) * 10, [null, 'x = ?', '20 m'], 'left', '35°') },
      { title: 'Ratio back to angle', text: 'sin, cos and tan take an angle and give a ratio. sin⁻¹, cos⁻¹ and tan⁻¹ run the other way: ratio in, angle out. The −1 means inverse, not 1 ÷ sin.', steps: ['A ramp rises 3 m over 4 m across: tan θ = 3 (rise in m) ÷ 4 (run in m) = 0.75 (tan of the angle)', 'Ratio in, angle out: tan⁻¹(0.75) ≈ 36.9°, so θ ≈ 36.9° (ramp angle).', 'Check forwards: tan 36.9° (ramp angle) ≈ 0.75 ✓', '1 ÷ tan θ = 4 (run in m) ÷ 3 (rise in m) ≈ 1.33 is just another ratio, not an angle.'], visual: { type: 'card', title: 'Inverse functions', lines: ['tan θ = 3/4', 'θ = tan⁻¹(3/4) ≈ 36.9°', 'not 1 ÷ tan(3/4)'] } },
      { title: 'Up and down from the horizontal', text: 'Angles of elevation and depression are both measured from a horizontal line. Looking down from a tower and up from the beacon give equal angles: the two horizontals are parallel.', steps: ['In the picture the mast is 4 m tall and the beacon is 7 m from its foot.', 'From the beacon: tan(elevation) = opposite ÷ adjacent = 4 (mast height in m) ÷ 7 (distance in m) ≈ 0.571', 'Elevation = tan⁻¹(0.571) ≈ 29.7° (angle of elevation).', 'The sight line: 4² + 7² = 16 + 49 = 65 (sight line squared), so it is √65 ≈ 8.06 (sight line in m).', 'The horizontals are parallel, so the depression from the top is also ≈ 29.7° (angle of depression).'], visual: { type: 'geo', items: [{ t: 'seg', a: [0, 0], b: [0, 4] }, { t: 'seg', a: [0, 0], b: [7, 0] }, { t: 'seg', a: [0, 4], b: [7, 0], dashed: true }, { t: 'seg', a: [0, 4], b: [7, 4], dashed: true }, { t: 'arc', at: [0, 4], from: [7, 4], to: [7, 0], label: 'depression' }, { t: 'arc', at: [7, 0], from: [0, 4], to: [0, 0], label: 'elevation' }] } },
    ],
    quests: [
      { id: 'aq.trig.solve-right.jib', name: 'The Crane Jib', giver: 'brick', guided: true, hook: 'Brick: "The yard crane\'s load chart is smudged. Work out each reach and height before we lift."', change: 'A fresh load chart hangs in the crane cab.',
        waves: [wave('Set it up', mixOf([setupStep, findSideStep, setupStep])), wave('Find the angle', mixOf([angleDialStep, inverseSetupStep, angleDialStep])), wave('Look up, look down', mixOf([elevationStep, elevDepStep, jibSliderStep]))] },
      { id: 'aq.trig.solve-right.gorge', name: 'Survey the Gorge', giver: 'newton', hook: 'Newton: "A ropeway must span the gorge. Heights, distances and angles, all from the rim."', change: 'Survey stakes mark the ropeway line across the gorge.',
        waves: [wave('Sides', mixOf([findSideStep, findSideStep, setupStep])), wave('Angles', mixOf([angleDialStep, findAngleStep, angleDialStep])), wave('From the rim', mixOf([elevationStep, jibSliderStep, elevationStep]))] },
    ],
    concept: conceptFrom([setupStep, angleDialStep, elevDepStep, jibSliderStep]),
    transfer: oneOf([rampCodeStep, gradeStep]),
    practice: (rng) => findSideStep(rng).question,
  },
  {
    key: 'special', title: 'Special Triangles & Exact Values', wing: 'ridge', wingName: 'Beacon Towers',
    goal: 'Build the 45-45-90 triangle from a square and the 30-60-90 from an equilateral triangle, and read exact values of sin, cos and tan at 30°, 45° and 60°.',
    misconception: 'Mixing up which leg of the 30-60-90 is short (so sin 60° = 1/2), and thinking doubling the angle doubles the sine.',
    teach: [
      { title: 'Half a square', text: 'Cut a square with side 1 along its diagonal: two 45-45-90 triangles with legs 1, 1 and hypotenuse √2 (Pythagoras). So sin 45° = cos 45° = 1/√2 = √2/2 and tan 45° = 1.', visual: specialVisual(45) },
      { title: 'Half an equilateral triangle', text: 'Cut an equilateral triangle with side 2 down the middle: a 30-60-90 with short leg 1 (half of 2), hypotenuse 2 and long leg √3. The short leg always faces the 30° angle.', steps: ['Short leg: 2 (side) ÷ 2 = 1 (short leg).', 'Long leg by Pythagoras: 2² − 1² = 4 − 1 = 3 (long leg squared), so it is √3 ≈ 1.73 (long leg).', 'In the picture the 30° at the top faces the short leg 1; the 60° at the corner faces the long leg √3.'], next: 'Stand at the 60° corner instead. What are sin 60° and cos 60°?', visual: { type: 'geo', items: [{ t: 'poly', pts: [[0, 0], [2, 0], [1, Math.sqrt(3)]], labels: ['2', '2', '2'] }, { t: 'seg', a: [1, 0], b: [1, Math.sqrt(3)], dashed: true, label: '√3' }, { t: 'arc', at: [1, Math.sqrt(3)], from: [1, 0], to: [0, 0], label: '30°' }, { t: 'arc', at: [0, 0], from: [2, 0], to: [1, Math.sqrt(3)], label: '60°' }] } },
      { title: 'Read the values', text: 'From 30°: opposite 1, adjacent √3, hypotenuse 2, so sin 30° = 1/2 and cos 30° = √3/2. From 60° the legs swap: sin 60° = √3/2, cos 60° = 1/2. Doubling the angle does not double the value.', visual: { type: 'card', title: 'Exact values', lines: ['sin 30° = 1/2   cos 30° = √3/2   tan 30° = √3/3', 'sin 45° = √2/2  cos 45° = √2/2  tan 45° = 1', 'sin 60° = √3/2  cos 60° = 1/2   tan 60° = √3'] } },
    ],
    quests: [
      { id: 'aq.trig.special.beacons', name: 'Light the Beacons', giver: 'vector', guided: true, hook: 'Vector: "The beacon towers are aimed at 30°, 45° and 60°. Their gears need exact values, not calculator crumbs."', change: 'Three beacons blaze along the ridge.',
        waves: [wave('Read the triangle', mixOf([exactValueStep, exactValueStep, acuteCircleStep])), wave('Scale the triangle', mixOf([specialSideStep, specialChooseStep, specialSideStep])), wave('The table', mixOf([exactTableStep, doubleTrapStep, acuteCircleStep]))] },
      { id: 'aq.trig.special.trusses', name: 'Truss Works', giver: 'ada', hook: 'Ada: "Equilateral trusses and square gates: every brace is a special triangle. Cut them exactly."', change: 'The truss works stack perfect braces.',
        waves: [wave('Exact sides', mixOf([specialChooseStep, specialSideStep, specialChooseStep])), wave('Exact values', mixOf([exactValueStep, acuteCircleStep, exactTableStep])), wave('Traps', mixOf([doubleTrapStep, exactValueStep, acuteCircleStep]))] },
    ],
    concept: conceptFrom([exactTableStep, acuteCircleStep, doubleTrapStep, exactValueStep]),
    transfer: oneOf([trussStep, hexNutStep]),
    practice: specialSideQ,
  },
  {
    key: 'angles', title: 'Angles in Standard Position', wing: 'observatory', wingName: 'Radar Dome',
    goal: 'Draw any angle in standard position (positive counterclockwise, negative clockwise), find coterminal angles with whole turns, and find reference angles in every quadrant.',
    misconception: 'Measuring the reference angle to the y-axis; turning negative angles counterclockwise; thinking adding 180° gives the same direction.',
    teach: [
      { title: 'Standard position', text: 'Start on the positive x-axis (east). Positive angles turn counterclockwise, negative angles clockwise. Where the turn stops is the terminal side. Angles can go past 360°: a radar arm keeps spinning.', steps: ['The arm points at 135° (arm angle) = 90° (quarter turn to north) + 45° (more into Quadrant II).', 'Clockwise, −225° lands on the same ray: 360° (full turn) − 225° (clockwise turn) = 135° (arm angle).'], visual: { type: 'unitcircle', angle: 135 } },
      { title: 'Coterminal angles', text: 'Coterminal angles stop on the same ray, the same terminal side. They differ by whole turns, so add or subtract 360° as often as you like. Adding 180° is only half a turn, so it points the opposite way.', steps: ['The arm stops at 40°.', '40° (arm angle) + 360° (full turn) = 400°: one extra turn, same ray.', '40° (arm angle) − 360° (full turn) = −320°: one turn backwards, same ray.', '40° (arm angle) + 180° (half turn) = 220° points the opposite way: not coterminal.'], next: 'Find the angle between 720° and 1080° that is coterminal with 40°.', visual: { type: 'unitcircle', angle: 40 } },
      { title: 'Reference angles', text: 'The reference angle is the acute angle between the terminal side and the x-axis. Quadrant II: 180° − θ. Quadrant III: θ − 180°. Quadrant IV: 360° − θ. Always to the x-axis, never the y-axis.', steps: ['150° is in Quadrant II: 180° (half turn) − 150° (angle) = 30° (reference angle).', '225° is in Quadrant III: 225° (angle) − 180° (half turn) = 45° (reference angle).', '300° is in Quadrant IV: 360° (full turn) − 300° (angle) = 60° (reference angle).'], next: 'What is the reference angle of 200°, and which quadrant is it in?', visual: { type: 'card', title: 'Reference angle of θ', lines: ['Quadrant I: θ', 'Quadrant II: 180° − θ', 'Quadrant III: θ − 180°', 'Quadrant IV: 360° − θ'] } },
    ],
    quests: [
      { id: 'aq.trig.angles.radar', name: 'Radar Sweep', giver: 'volt', guided: true, hook: 'Volt: "The observatory radar has been spinning all night and its counter reads nonsense like 1,145°. Tell me where it is actually pointing."', change: 'The radar dome reads true bearings again.',
        waves: [wave('Where does it point?', mixOf([coterminalDialStep, terminalPointStep, coterminalChooseStep])), wave('Which quadrant?', mixOf([quadrantStep, terminalPointStep, quadrantStep])), wave('Reference angles', mixOf([referenceDialStep, referenceChooseStep, referenceDialStep]))] },
      { id: 'aq.trig.angles.vanes', name: 'Weather Vanes', giver: 'catalyst', hook: 'Dr. Catalyst: "My wind vanes log angles, some negative, some past a full turn. I need reference angles for the vent valves."', change: 'The vent valves on the observatory roof open in step with the wind.',
        waves: [wave('Reference angles', mixOf([referenceChooseStep, referenceDialStep, referenceChooseStep])), wave('Coterminal', mixOf([coterminalDialStep, coterminalChooseStep, (r) => typed(coterminalQ(r))])), wave('Terminal sides', mixOf([terminalPointStep, quadrantStep, coterminalDialStep]))] },
    ],
    concept: conceptFrom([coterminalDialStep, referenceDialStep, terminalPointStep, referenceChooseStep]),
    transfer: oneOf([turbineStep, clockHandStep]),
    practice: coterminalQ,
  },
  {
    key: 'radians', title: 'Radians & Arc Length', wing: 'observatory', wingName: 'Gear Gallery',
    goal: 'Measure angles in radians (arc length over radius), convert between degrees and radians, and use s = rθ, ω = θ/t and v = rω.',
    misconception: 'Thinking π "equals 180" (π radians is 180°; π itself is about 3.14), and plugging degrees into s = rθ.',
    teach: [
      { title: 'What a radian is', text: 'Wrap the radius around the rim: the angle it covers is 1 radian, about 57.3°. A full turn fits 2π radii of arc, so 360° = 2π radians and 180° = π radians.', steps: ['1 radian = 180° ÷ π ≈ 57.3°.', 'The radius fits around the rim 2π ≈ 6.28 times, so a full turn is 2π radians = 360°.'], visual: { type: 'circle', r: 1, unit: 'r', show: 'r', wheel: true } },
      { title: 'Converting', text: 'Degrees to radians: multiply by π/180. Radians to degrees: multiply by 180/π. 135° = 135π/180 = 3π/4. π stands for 180° only when it is measuring an angle in radians.', visual: { type: 'card', title: 'π rad = 180°', lines: ['90° = π/2', '60° = π/3', '45° = π/4', '30° = π/6'] } },
      { title: 'Arc length and spin', text: 'Because a radian is one radius of arc, s = rθ with θ in radians. A drum turning ω radians per second winds cable at v = rω. In degrees, neither formula works.', steps: ['The drum has radius 3 m. Turn it 2 radians.', 's = rθ: 3 (radius in m) × 2 (turn in radians) = 6 (cable in m).', 'A quarter turn is π/2 radians: 3 (radius in m) × π/2 ≈ 4.71 (cable in m).', 'Spinning at 0.5 rad/s, v = rω: 3 (radius in m) × 0.5 (spin in rad/s) = 1.5 (cable speed in m/s).'], next: 'The same 3 m drum turns half a turn. How much cable does it wind?', visual: { type: 'circle', r: 3, unit: 'm', show: 'r', wheel: true } },
    ],
    quests: [
      { id: 'aq.trig.radians.gears', name: 'Gear Controller', giver: 'newton', guided: true, hook: 'Newton: "The new gear controller speaks only radians. Translate for it, or the gears grind."', change: 'The gallery gears turn smoothly under the new controller.',
        waves: [wave('Convert', mixOf([toRadiansStep, radToDegDialStep, piTrapStep, radianSliderStep])), wave('Arc length', mixOf([arcSliderStep, arcStep, arcTrapStep])), wave('Spin', mixOf([angularStep, radToDegDialStep, radianSliderStep]))] },
      { id: 'aq.trig.radians.winch', name: 'The Big Winch', giver: 'ada', hook: 'Ada: "The ropeway winch needs cable lengths and speeds. Radians in, metres out."', change: 'The ropeway winch hauls at a steady, measured speed.',
        waves: [wave('Radians', mixOf([radToDegDialStep, toRadiansStep, piTrapStep])), wave('Cable out', mixOf([arcTrapStep, arcSliderStep, arcStep])), wave('Speed', mixOf([angularStep, radianSliderStep, angularStep]))] },
    ],
    concept: conceptFrom([radToDegDialStep, arcSliderStep, piTrapStep, arcTrapStep]),
    transfer: oneOf([bikeWheelStep, minuteArcStep]),
    practice: arcQ,
  },
  {
    key: 'unit-circle', title: 'The Unit Circle', wing: 'observatory', wingName: 'Unit Circle Observatory',
    goal: 'Read cos θ and sin θ as the x and y coordinates of the point at angle θ on the unit circle, extend trig to every angle, and know the signs in each quadrant.',
    misconception: 'Thinking sine is the x-coordinate; thinking sine and cosine are always positive; believing trig only works inside right triangles.',
    teach: [
      { title: 'Coordinates are trig', text: 'Put a right triangle with hypotenuse 1 at the origin. Its legs are cos θ across and sin θ up, so the point at angle θ on the unit circle is (cos θ, sin θ). This works for every angle, not just acute ones.', steps: ['On the dial θ = 60° and the hypotenuse is 1.', 'Across: 1 (hypotenuse) × cos 60° = 1/2 = 0.5 (x-coordinate)', 'Up: 1 (hypotenuse) × sin 60° = √3/2 ≈ 0.87 (y-coordinate)', 'So the point is (1/2, √3/2), and (1/2)² + (√3/2)² = 1/4 + 3/4 = 1 ✓'], visual: { type: 'unitcircle', angle: 60, showCoords: true } },
      { title: 'Signs by quadrant', text: 'x is negative on the left, y is negative below. So cos θ < 0 in Quadrants II and III, sin θ < 0 in III and IV, and tan θ = y/x is positive in I and III.', steps: ['On the dial θ = 225°, in Quadrant III: the point is (−√2/2, −√2/2) ≈ (−0.71, −0.71).', 'Left and below: cos 225° < 0 and sin 225° < 0.', 'tan 225° = y ÷ x = (−0.71) ÷ (−0.71) = 1 > 0: negative ÷ negative is positive.'], next: 'Turn the arm to 120°. Which of sin, cos and tan are negative there?', visual: { type: 'unitcircle', angle: 225, showCoords: true } },
      { title: 'Any radius', text: 'On a circle of radius r, the point at θ is (r cos θ, r sin θ). A 5 m crane arm at cos θ = −4/5, sin θ = 3/5 has its tip at (−4, 3).', steps: ['Across: 5 (arm length in m) × (−4/5) = −4 (x-coordinate in m)', 'Up: 5 (arm length in m) × 3/5 = 3 (y-coordinate in m)', 'Check the arm is 5 m: (−4)² + 3² = 16 + 9 = 25 = 5².'], visual: { type: 'plot', range: [-6, 6, -6, 6], layers: { segments: circleSegs(5), vectors: [{ x: -4, y: 3, label: '(−4, 3)' }] } } },
    ],
    quests: [
      { id: 'aq.trig.unit-circle.beacons', name: 'Circle of Beacons', giver: 'vector', guided: true, hook: 'Vector: "Sixteen beacons ring the observatory, one at every special angle. Their coordinates are the trig values. Learn to read them."', change: 'The ring of beacons lights around the observatory dome.',
        waves: [wave('Coordinates', mixOf([ucCoordStep, ucCoordStep, ucValueStep])), wave('Signs', mixOf([signQuadrantStep, ucByValueStep, axisTableStep])), wave('Radius 5', mixOf([circlePoint('unit-circle'), ucValueStep, circlePoint('unit-circle')]))] },
      { id: 'aq.trig.unit-circle.arm', name: 'The Survey Arm', giver: 'volt', hook: 'Volt: "The rotating survey arm needs its tip positions for every angle, including the ones past 90°."', change: 'The survey arm sweeps the whole circle without a hitch.',
        waves: [wave('Exact values', mixOf([ucValueStep, ucRadValueStep, ucDecimalStep])), wave('Find the angle', mixOf([ucByValueStep, ucCoordStep, signQuadrantStep])), wave('Arm tips', mixOf([circlePoint('unit-circle'), circlePoint('unit-circle'), ucByValueStep]))] },
    ],
    concept: conceptFrom([ucCoordStep, ucByValueStep, circlePoint('unit-circle'), signQuadrantStep]),
    transfer: oneOf([crankStep, ferrisStep]),
    practice: ucDecimalQ,
  },
  {
    key: 'graphs', title: 'Graphs of Sine, Cosine & Tangent', wing: 'ropeway', wingName: 'Sine Ridge Ropeway',
    goal: 'Read amplitude, period, midline and phase shift from y = A sin(B(x − C)) + D, match equations to graphs, and know where tangent repeats and blows up.',
    misconception: 'Reading the period as B instead of 2π ÷ B; taking the maximum value as the amplitude; shifting the wrong way for x − C.',
    teach: [
      { title: 'Unroll the circle', text: 'Walk around the unit circle and plot the height sin θ against the angle: a wave that repeats every full turn. Cosine is the same wave started at its peak.', steps: ['Read sin at the marks: 0 at 0°, 1 at 90°, 0 at 180°, −1 at 270°, 0 at 360°.', 'It repeats every turn: sin 390° = sin(390° − 360°) = sin 30° = 1/2', 'Cosine is the same wave 90° ahead: cos 0° = sin(0° + 90°) = sin 90° = 1'], visual: { type: 'plot', range: [0, 360, -1.5, 1.5], layers: { fns: [{ fn: { kind: 'sin', deg: true }, label: 'sin' }, { fn: { kind: 'cos', deg: true }, label: 'cos' }], vlines: [{ x: 90, label: '90°' }, { x: 180, label: '180°' }, { x: 270, label: '270°' }] } } },
      { title: 'Four dials', text: 'y = A sin(B(x − C)) + D. D lifts the midline. A is the distance from the midline to a peak. The period is 2π ÷ B (360° ÷ B in degrees). C slides the wave right.', steps: ['The plotted wave is y = 2 sin(πx/2) + 1, so A = 2, B = π/2, C = 0, D = 1.', 'Midline y = 1. Peak: 1 (midline) + 2 (amplitude) = 3 (peak); trough: 1 (midline) − 2 (amplitude) = −1 (trough).', 'Period: 2π ÷ B = 2π ÷ (π/2) = 4 (period), so it repeats every 4 units.', 'C = 0, so it starts on the midline at x = 0 and climbs.'], next: 'Double B to π in your head. How long is one full wave now?', visual: plotOf([waveFn({ k: 'sin', A: 2, P: 4, C: 0, D: 1 })], [0, 8, -2, 4]) },
      { title: 'Tangent', text: 'tan x = sin x ÷ cos x. It is zero where sin is zero and has vertical asymptotes where cos is zero (90°, 270°). It repeats every 180°, not 360°.', steps: ['tan 45° = sin 45° ÷ cos 45° = 0.707 ÷ 0.707 = 1', 'tan 180° = 0 ÷ (−1) = 0: a zero, where sin is zero.', 'At 90°, cos 90° = 0 and you cannot divide by 0: a vertical asymptote.', 'tan 225° = tan(225° − 180°) = tan 45° = 1: it repeats every 180°.'], visual: plotOf([{ kind: 'tan', deg: true }], [0, 360, -4, 4]) },
    ],
    quests: [
      { id: 'aq.trig.graphs.sway', name: 'Ropeway Sway', giver: 'volt', guided: true, hook: 'Volt: "The ropeway cable sways in waves. Read its amplitude and period so the dampers can be tuned."', change: 'The dampers settle and the cable glides smoothly along Sine Ridge.',
        waves: [wave('Amplitude and midline', mixOf([ampStep, midlineStep, peakPlotStep])), wave('Period', mixOf([periodStep, sliderCycleStep, periodEqStep])), wave('Match the trace', mixOf([graphPickStep, peakPlotStep, graphPickStep]))] },
      { id: 'aq.trig.graphs.signals', name: 'Signal Tower', giver: 'newton', hook: 'Newton: "The signal tower broadcasts waves with shifts, stretches and lifts. Decode each one."', change: 'The signal tower beams a clean carrier wave down the valley.',
        waves: [wave('Shifts', mixOf([phaseShiftStep, peakPlotStep, periodEqStep])), wave('Tangent', mixOf([tanGraphStep, tanPickStep, sliderCycleStep])), wave('Match', mixOf([graphPickStep, peakPlotStep, periodStep]))] },
    ],
    concept: conceptFrom([graphPickStep, peakPlotStep, sliderCycleStep, ampStep]),
    transfer: oneOf([acStep, wheelModelStep]),
    practice: periodQ,
  },
  {
    key: 'inverse', title: 'Inverse Trig Functions', wing: 'ropeway', wingName: 'Lookout Station',
    goal: 'Read sin⁻¹, cos⁻¹ and tan⁻¹ as "the angle whose …", know their restricted ranges and why they need them, and find the other angles a calculator does not show.',
    misconception: 'Reading sin⁻¹ x as 1 ÷ sin x; believing sin⁻¹(sin θ) always gives back θ; expecting cos⁻¹ of a negative to be negative.',
    teach: [
      { title: 'Angle out', text: 'sin 30° = 1/2 takes an angle and gives a ratio. sin⁻¹(1/2) = 30° runs backwards: ratio in, angle out. The −1 means inverse function, not reciprocal; 1 ÷ sin θ is csc θ.', visual: { type: 'card', title: 'Inverse, not reciprocal', lines: ['sin⁻¹(1/2) = 30°', '1 ÷ sin 30° = 2 = csc 30°'] } },
      { title: 'Why the range is restricted', text: 'Infinitely many angles have sin θ = 1/2 (30°, 150°, 390°, …). A function must give one answer, so sin⁻¹ only answers with −90° to 90°, where sin takes each value once. cos⁻¹ answers with 0° to 180°; tan⁻¹ with −90° to 90°, ends excluded.', steps: ['sin 30° = 1/2 and sin 150° = 1/2, and 30° + 360° = 390° works too.', 'Only 30° lies between −90° and 90°, so sin⁻¹(1/2) = 30°.', 'Negative input: sin⁻¹(−1/2) = −30°, still inside −90° to 90°.', 'cos⁻¹ answers from 0° to 180°: cos⁻¹(−1/2) = 120°.'], next: 'What does cos⁻¹(1/2) give, and why is −60° not the answer?', visual: plotOf([{ kind: 'sin', deg: true }], [-180, 360, -1.5, 1.5]) },
      { title: 'Finding the others', text: 'The calculator gives one angle. The unit circle gives the rest: sin(180° − θ) = sin θ and cos(360° − θ) = cos θ. So sin θ = 0.8 is 53.1° or 126.9°.', steps: ['sin⁻¹(0.8) ≈ 53.1°: the calculator’s answer.', '180° (half turn) − 53.1° (calculator angle) = 126.9° (Quadrant II partner) with the same height.', 'On the dial: 180° (half turn) − 30° (reference angle) = 150°, so sin 150° = sin 30° = 1/2.'], visual: { type: 'unitcircle', angle: 150, showCoords: true } },
    ],
    quests: [
      { id: 'aq.trig.inverse.lookout', name: 'The Lookout', giver: 'ada', guided: true, hook: 'Ada: "The lookout telescope gets ratios from its sensors and must turn them into angles. One answer each, the right one."', change: 'The lookout telescope swings straight to every beacon.',
        waves: [wave('What it means', mixOf([reciprocalTrapStep, invCircleStep, invExactStep])), wave('Restricted ranges', mixOf([rangeStep, invDialStep, invCircleStep])), wave('Cancel?', mixOf([compositionStep, invTypedStep, invDialStep]))] },
      { id: 'aq.trig.inverse.gauges', name: 'Gauge Readings', giver: 'brick', hook: 'Brick: "Every gauge on the lift gives a ratio. I need angles, and I need the obtuse ones too."', change: 'The lift gauges now read in degrees.',
        waves: [wave('Exact inverses', mixOf([invExactStep, invCircleStep, invExactStep])), wave('Decimals', mixOf([invTypedStep, invDialStep, invTypedStep])), wave('Traps', mixOf([compositionStep, rangeStep, invCircleStep]))] },
    ],
    concept: conceptFrom([invCircleStep, invDialStep, compositionStep, rangeStep]),
    transfer: oneOf([obtuseStep, crankReflexStep]),
    practice: invTypedQ,
  },
  {
    key: 'identities', title: 'Trig Identities', wing: 'forge', wingName: 'Identity Forge',
    goal: 'Derive sin²θ + cos²θ = 1 from the unit circle, use the reciprocal and quotient identities, and verify an identity one legal step at a time.',
    misconception: 'Treating (sin θ + cos θ)² as sin²θ + cos²θ; thinking an identity only holds for special angles; forgetting that the quadrant picks the sign after a square root.',
    teach: [
      { title: 'Pythagoras on the circle', text: 'The point (cos θ, sin θ) is 1 unit from the origin, so cos²θ + sin²θ = 1 for every angle. Divide by cos²θ: 1 + tan²θ = sec²θ. Divide by sin²θ: cot²θ + 1 = csc²θ.', steps: ['On the dial θ = 135°: the point is (−√2/2, √2/2) ≈ (−0.707, 0.707).', '(−√2/2)² + (√2/2)² = 2/4 + 2/4 = 1 ✓', '1 + tan²135° = 1 + (−1)² = 2, and sec²135° = 1 ÷ 0.5 = 2 ✓'], visual: { type: 'unitcircle', angle: 135, showCoords: true } },
      { title: 'Reciprocal and quotient', text: 'sec θ = 1/cos θ, csc θ = 1/sin θ, cot θ = 1/tan θ. And tan θ = sin θ / cos θ (y ÷ x). Rewriting everything in sin and cos is the safest first move.', steps: ['At 60°: sin 60° = √3/2 ≈ 0.866 and cos 60° = 1/2.', 'sec 60° = 1 ÷ cos 60° = 1 ÷ 0.5 = 2', 'csc 60° = 1 ÷ 0.866 ≈ 1.155', 'tan 60° = (√3/2) ÷ (1/2) = √3 ≈ 1.732, so cot 60° = 1 ÷ √3 ≈ 0.577'], visual: { type: 'card', title: 'The toolkit', lines: ['sin²θ + cos²θ = 1', 'tan θ = sin θ / cos θ', 'sec θ = 1/cos θ, csc θ = 1/sin θ, cot θ = 1/tan θ'] } },
      { title: 'Verifying', text: 'To verify an identity, start from one side and change it one legal step at a time until it matches the other. Never move terms across the equals sign: you are proving it, not solving it.', steps: ['Test it at 30° before proving it.', 'Left side: tan 30° × cos 30° = (√3/3) × (√3/2) = 3/6 = 1/2', 'Right side: sin 30° = 1/2. Same ✓', 'One angle is only a check; the steps on the card prove it for every θ.'], next: 'Check 1 + tan²θ = sec²θ at θ = 60°. What does each side come to?', visual: { type: 'card', title: 'tan θ · cos θ = sin θ', lines: ['tan θ · cos θ', '= (sin θ / cos θ) · cos θ', '= sin θ ✓'] } },
    ],
    quests: [
      { id: 'aq.trig.identities.forge', name: 'The Identity Forge', giver: 'vector', guided: true, hook: 'Vector: "The forge only stamps equations that are true for every angle. Prove each one, a step at a time."', change: 'The forge stamps its first true identities onto brass plates.',
        waves: [wave('Pythagoras', mixOf([pythagTableStep, pythagStep, circlePoint('identities')])), wave('Next step', mixOf([nextStepStep, squareSumStep, reciprocalStep])), wave('True every time', mixOf([whichIdentityStep, circlePoint('identities'), pythagTableStep]))] },
      { id: 'aq.trig.identities.alloys', name: 'Alloy Ratios', giver: 'catalyst', hook: 'Dr. Catalyst: "My mixing arms know only one ratio each. Find the rest with identities, signs included."', change: 'The alloy arms mix in perfect proportion.',
        waves: [wave('Signs matter', mixOf([pythagStep, circlePoint('identities'), pythagStep])), wave('Prove it', mixOf([nextStepStep, squareSumStep, whichIdentityStep])), wave('Reciprocals', mixOf([reciprocalStep, pythagTableStep, circlePoint('identities')]))] },
    ],
    concept: conceptFrom([pythagTableStep, circlePoint('identities'), nextStepStep, whichIdentityStep]),
    transfer: oneOf([forceStep, pitchStep]),
    practice: pythagQ,
  },
  {
    key: 'sum-double', title: 'Sum, Difference & Double-Angle Formulas', wing: 'forge', wingName: 'Formula Foundry',
    goal: 'Use sin(A ± B), cos(A ± B) and tan(A + B) to find exact values, and the double-angle formulas to find sin 2θ and cos 2θ from sin θ and cos θ.',
    misconception: 'Believing sin(A + B) = sin A + sin B and sin 2θ = 2 sin θ; flipping the sign inside cos(A − B).',
    teach: [
      { title: 'Trig does not distribute', text: 'On the unit circle, sin is the height of the point. At 30° the height is 0.5, at 60° about 0.87, and at 30° + 60° = 90° it is 1, far less than 0.5 + 0.87 ≈ 1.37. Angles add; their sines do not.', visual: { type: 'plot', range: [-0.4, 1.4, -0.3, 1.3], layers: { segments: [...circleSegs(1, 36).filter((g) => g.a[0] >= -0.01 && g.a[1] >= -0.01), { a: [COS30, 0], b: [COS30, 0.5], dashed: true, label: '0.5' }, { a: [0.5, 0], b: [0.5, COS30], dashed: true, label: '0.87' }], vectors: [{ x: COS30, y: 0.5, label: '30°' }, { x: 0.5, y: COS30, label: '60°' }, { x: 0, y: 1, label: '90°: height 1' }] } } },
      { title: 'The sum formulas', text: 'Turn the point at angle A a further B around the unit circle: it lands at (cos(A + B), sin(A + B)). Tracking where it lands gives sin(A ± B) = sin A cos B ± cos A sin B (same sign) and cos(A ± B) = cos A cos B ∓ sin A sin B (opposite sign).', steps: ['On the plot A = 60° and B = 30°, landing at A + B = 90°.', 'sin: (√3/2)(√3/2) + (1/2)(1/2) = 3/4 + 1/4 = 1 = sin 90° ✓', 'cos: (1/2)(√3/2) − (√3/2)(1/2) = √3/4 − √3/4 = 0 = cos 90° ✓', 'The point at 90° is (0, 1): across 0, up 1.'], next: 'Write sin 75° as sin(45° + 30°). Which four exact values do you need, and what do you get?', visual: { type: 'plot', range: [-0.4, 1.4, -0.3, 1.3], layers: { segments: circleSegs(1, 36).filter((g) => g.a[0] >= -0.01 && g.a[1] >= -0.01), vectors: [{ x: 0.5, y: COS30, label: 'A = 60°', color: 'teal' }, { x: 0, y: 1, label: 'A + B = 90°', color: 'orange' }] } } },
      { title: 'Double angles', text: 'Set B = A in the sum formulas: sin 2θ = 2 sin θ cos θ and cos 2θ = cos²θ − sin²θ = 1 − 2 sin²θ = 2 cos²θ − 1. Doubling the angle does not double the sine.', steps: ['The 3-4-5 brace: sin θ = 3/5, cos θ = 4/5.', 'sin 2θ = 2 × 3/5 × 4/5 = 24/25', 'cos 2θ = 16/25 − 9/25 = 7/25', 'Check: (24/25)² + (7/25)² = (576 + 49)/625 = 1 ✓', 'Not 2 × 3/5 = 6/5: that is bigger than 1, and no sine is.'], visual: { type: 'card', title: 'Double angle', lines: ['sin 2θ = 2 sin θ cos θ', 'cos 2θ = cos²θ − sin²θ', '= 1 − 2 sin²θ = 2 cos²θ − 1'] } },
    ],
    quests: [
      { id: 'aq.trig.sum-double.rotor', name: 'Rotor Doubling', giver: 'volt', guided: true, hook: 'Volt: "The generator rotor turns at twice the shaft angle. I need its sine and cosine exactly, no guessing."', change: 'The doubled rotor hums in phase with the shaft.',
        waves: [wave('Does it split?', mixOf([distributeTrapStep, formulaStep, exactSumStep])), wave('Double it', mixOf([doubleTableStep, doubleTrapStep2, doublePlotStep])), wave('Put it to work', mixOf([doubleStep, doublePlotStep, doubleTableStep]))] },
      { id: 'aq.trig.sum-double.foundry', name: 'The Formula Foundry', giver: 'newton', hook: 'Newton: "Two struts, two angles, one joint. Combine them with the formulas and cast the brackets."', change: 'The foundry casts brackets at exact combined angles.',
        waves: [wave('Formulas', mixOf([formulaStep, exactSumStep, sumTableStep])), wave('Combine', mixOf([sumValueStep, doublePlotStep, exactSumStep])), wave('Double', mixOf([doubleTableStep, doubleStep, doubleTrapStep2]))] },
    ],
    concept: conceptFrom([doubleTableStep, doublePlotStep, distributeTrapStep, doubleTrapStep2]),
    transfer: oneOf([collapseStep, tanSumStep]),
    practice: doubleQ,
  },
  {
    key: 'laws', title: 'Law of Sines & Law of Cosines', wing: 'summit', wingName: 'Triangulation Summit',
    goal: 'Solve triangles with no right angle: the law of sines for side-angle pairs, the law of cosines for two sides with the included angle or three sides, and spot when SSA gives two triangles.',
    misconception: 'Using SOH-CAH-TOA in a triangle with no right angle; pairing a side with the wrong angle; losing the sign of cos C for obtuse angles.',
    teach: [
      { title: 'Law of sines', text: 'In any triangle, a/sin A = b/sin B = c/sin C: each side over the sine of the angle facing it. Drop a height h from C: h = b sin A = a sin B, which gives the law. Use it when you know a side and its opposite angle.', steps: ['On the picture the dashed h is b sin A seen from A and a sin B seen from B.', 'Say A = 30°, a = 10 m (a matched pair) and B = 45°. Find b.', 'b ÷ sin 45° (angle B) = 10 (side a in m) ÷ sin 30° (angle A)', 'b = 10 (side a in m) × 0.7071 ÷ 0.5 ≈ 14.1 (side b in m)', 'Height check: 14.1 (side b in m) × sin 30° ≈ 7.07 (height h in m) and 10 (side a in m) × sin 45° ≈ 7.07 (height h in m) ✓'], visual: { type: 'geo', items: [...(triGeo([0, 0], [7, 0], [2, 4], ['a', 'b', 'c'], ['A', 'B', 'C']) as { items: GeoItem[] }).items, { t: 'seg', a: [2, 4], b: [2, 0], dashed: true, label: 'h' }, { t: 'arc', at: [2, 0], from: [7, 0], to: [2, 4], right: true }] } },
      { title: 'Law of cosines', text: 'c² = a² + b² − 2ab cos C. When C = 90°, cos C = 0 and it is Pythagoras. Acute C makes c shorter; obtuse C (negative cosine) makes it longer. Use it for SAS and SSS.', steps: ['SAS: a = 5, b = 8 and C = 60° between them.', '5² + 8² − 2 × 5 × 8 × cos 60° = 25 + 64 − 40 = 49', 'So c² = 49 and c = √49 = 7.', 'With C = 90°: 25 + 64 = 89, so c ≈ 9.43. The acute angle made c shorter.'], next: 'Keep a = 5 and b = 8 but open C to 120°. How long is c now?', visual: { type: 'card', title: 'c² = a² + b² − 2ab cos C', lines: ['C = 90°: c² = a² + b²', 'C < 90°: c² smaller', 'C > 90°: c² bigger'] } },
      { title: 'The ambiguous case', text: 'Given two sides and an angle not between them (SSA), side a can swing and meet the base twice, once, or not at all. Compare a with the height h = b sin A and with b.', steps: ['In the picture b = 10, A = 30° and each teal side a is about 6.', 'Height: 10 (side b) × sin 30° = 10 × 0.5 = 5 (height h)', '5 (height h) < 6 (side a) < 10 (side b), so h < a < b: a meets the base twice.', 'sin B = 10 (side b) × 0.5 ÷ 6 (side a) ≈ 0.833, so B ≈ 56.4° or 180° − 56.4° = 123.6°.', 'a = 5 just touches once; a < 5 misses; a ≥ 10 gives one triangle.'], next: 'Keep b = 10 and A = 30°. How many triangles are there if a = 8? If a = 12?', visual: { type: 'geo', items: [{ t: 'seg', a: [0, 0], b: [14, 0] }, { t: 'seg', a: [0, 0], b: [8.66, 5], label: 'b' }, { t: 'arc', at: [0, 0], from: [10, 0], to: [8.66, 5], label: 'A' }, { t: 'seg', a: [8.66, 5], b: [8.66, 0], dashed: true, label: 'h' }, { t: 'seg', a: [8.66, 5], b: [5.3, 0], color: 'teal' }, { t: 'seg', a: [8.66, 5], b: [12, 0], color: 'teal' }] } },
    ],
    quests: [
      { id: 'aq.trig.laws.triangulate', name: 'Triangulate the Peaks', giver: 'ada', guided: true, hook: 'Ada: "Beacons on three peaks, no right angles anywhere. Survey the network with the two laws."', change: 'Faint survey lines join the beacons across the summit.',
        waves: [wave('Which law?', mixOf([whichLawStep, lawSinesSetupStep, lawSinesStep])), wave('Cosines', mixOf([cosTableStep, lawCosStep, cosSignStep])), wave('Angles from sides', mixOf([sssDialStep, lawSinesAngleStep, ambiguousStep, sssDialStep]))] },
      { id: 'aq.trig.laws.trusses', name: 'Summit Trusses', giver: 'brick', hook: 'Brick: "The summit hut needs trusses with odd angles. Side lengths and angles, and tell me if a triangle even fits."', change: 'The summit hut stands on true trusses.',
        waves: [wave('Sides', mixOf([lawSinesSetupStep, lawSinesStep, lawCosStep])), wave('Angles', mixOf([sssDialStep, lawSinesAngleStep, cosSignStep, sssDialStep])), wave('Does it fit?', mixOf([ambiguousStep, obtusePartnerStep, cosTableStep]))] },
    ],
    concept: conceptFrom([sssDialStep, cosTableStep, ambiguousStep, lawSinesSetupStep, obtusePartnerStep]),
    transfer: oneOf([riverStep, shipsStep]),
    practice: lawCosQ,
  },
  {
    key: 'equations', title: 'Solving Trig Equations', wing: 'summit', wingName: 'Signal Summit',
    goal: 'Solve trig equations on 0° to 360° by isolating the function, finding the reference angle and placing every solution by quadrant, including factored and multiple-angle equations.',
    misconception: 'Stopping at the one answer the calculator gives; dividing by sin x and losing solutions; forgetting that 2x runs over two full turns.',
    teach: [
      { title: 'Isolate, reference, place', text: 'Solve 2 sin x + 1 = 0: isolate sin x = −1/2. Reference angle 30°. Sine is negative in Quadrants III and IV, so x = 180° (half turn) + 30° (reference angle) = 210° and x = 360° (full turn) − 30° (reference angle) = 330°.', visual: { type: 'unitcircle', angle: 210, showCoords: true } },
      { title: 'Count on the graph', text: 'A horizontal line y = c crosses one full sine wave twice when −1 < c < 1. So expect two solutions on 0° to 360°, one at ±1, none beyond. The calculator only shows the first.', steps: ['The line y = −1/2 is between −1 and 1, so it crosses the wave twice.', 'The calculator: sin⁻¹(−1/2) = −30°, outside 0° to 360°.', 'The two crossings: 180° (half turn) + 30° (reference angle) = 210° and 360° (full turn) − 30° (reference angle) = 330°.', 'Check: sin 210° = sin 330° = −1/2 ✓'], next: 'Slide the line up to y = 1/2. Where are the crossings from 0° to 360° now?', visual: { type: 'plot', range: [0, 360, -1.5, 1.5], layers: { fns: [{ fn: { kind: 'sin', deg: true } }], hlines: [{ y: -0.5, label: 'y = −1/2' }] } } },
      { title: 'Factor, never divide', text: 'sin x cos x = sin x: move everything to one side and factor, sin x (cos x − 1) = 0. Dividing by sin x throws away the solutions where sin x = 0. For sin 2x, let u = 2x run over 0° to 720°, then halve.', steps: ['sin x cos x − sin x = 0, so sin x (cos x − 1) = 0.', 'sin x = 0 gives 0° and 180°; cos x = 1 gives 0° again.', 'Check 180°: sin 180° × cos 180° = 0 × (−1) = 0 = sin 180° ✓', 'Dividing by sin x leaves only cos x = 1, which loses 180°.'], next: 'Solve sin 2x = 0 for 0° ≤ x < 360° by letting u = 2x run over 0° ≤ u < 720°. How many solutions are there?', visual: { type: 'card', title: 'sin x cos x = sin x', lines: ['sin x (cos x − 1) = 0', 'sin x = 0 → 0°, 180°', 'cos x = 1 → 0°'] } },
    ],
    quests: [
      { id: 'aq.trig.equations.signals', name: 'Signal Timing', giver: 'newton', guided: true, hook: 'Newton: "The summit signal fires whenever its wave hits a set level. Find every firing angle, not just the first."', change: 'The summit signal flashes on time, every time.',
        waves: [wave('Isolate and place', mixOf([ucSolveStep, allSolutionsStep, tableSolutionsStep])), wave('Read the graph', mixOf([sliderCrossStep, countStep, ucSolveStep])), wave('Calculator angles', mixOf([numericSolveStep, sliderCrossStep, tableSolutionsStep]))] },
      { id: 'aq.trig.equations.gears', name: 'Gear Equations', giver: 'vector', hook: 'Vector: "Factored equations, doubled angles, squared functions. The last locks on the summit need every root."', change: 'The summit locks turn and the path to the Angle Core opens.',
        waves: [wave('Factor', mixOf([quadraticEqStep, ucSolveStep, quadraticEqStep])), wave('Multiple angles', mixOf([multiAngleStep, countStep, sliderCrossStep])), wave('Every solution', mixOf([allSolutionsStep, tableSolutionsStep, numericSolveStep]))] },
    ],
    concept: conceptFrom([ucSolveStep, tableSolutionsStep, sliderCrossStep, quadraticEqStep]),
    transfer: oneOf([tideStep, jointStep]),
    practice: numericSolveQ,
  },
  {
    key: 'trial', title: 'Mastery Trial', wing: 'core', wingName: 'The Angle Core',
    goal: 'Prove durable command of trigonometry, from right triangles to the unit circle, graphs, identities, oblique triangles and equations, and seat the Angle Core.',
    misconception: 'One lucky run is mastery; skipping the unit circle and leaning on the calculator for every angle.',
    teach: [
      { title: 'Trial rules', text: 'Five phases across the whole academy, from SOH-CAH-TOA to trig equations. One helper, used once. Pass at 80% to seat the Angle Core and open the road to Pre-Calculus.', visual: { type: 'card', title: 'The Mastery Trial', lines: ['Right triangles · Angles & the circle', 'Graphs & inverses · Identities & formulas', 'Oblique triangles & equations'] } },
    ],
    quests: [
      { id: 'aq.trig.trial.rehearsal', name: 'Trial Rehearsal', giver: 'vector', guided: true, hook: 'Vector: "Before the Core, a rehearsal. Same shape, no stakes."', change: 'The Angle Core chamber doors unbar.',
        waves: [wave('Triangles', mixOf([findSideStep, exactValueStep, angleDialStep])), wave('The circle', mixOf([coterminalDialStep, radToDegDialStep, ucCoordStep])), wave('Waves, identities & laws', mixOf([graphPickStep, pythagStep, lawCosStep]))] },
      { id: 'aq.trig.trial.keeper', name: 'The Core Keeper', giver: 'brick', hook: 'Brick: "The Keeper asks anything from anywhere on the mountain. Answer like you own it."', change: 'The Keeper steps aside from the Angle Core.',
        waves: [wave('Anything', mixOf([invExactStep, doubleTableStep, sssDialStep, ucSolveStep])), wave('Anywhere', mixOf([angleDialStep, circlePoint('unit-circle'), periodEqStep, lawSinesAngleStep]))] },
    ],
    concept: conceptFrom([ucCoordStep, graphPickStep, sssDialStep, doubleTableStep]),
    transfer: oneOf([twoSightStep, reservoirStep]),
  },
];

export const TRIG = defineAcademy({
  id: 'trig',
  name: 'Trigonometry Academy',
  short: 'Trigonometry',
  tier: 'High School',
  blurb: 'Right triangles, the unit circle, radians, trig graphs, identities and the laws of sines and cosines.',
  icon: 'target',
  home: 'trig-mountains',
  wings: {
    ridge: { name: "Surveyor's Ridge", icon: 'compass' },
    observatory: { name: 'Angle Observatory', icon: 'telescope' },
    ropeway: { name: 'Sine Ridge Ropeway', icon: 'energy' },
    forge: { name: 'Identity Forge', icon: 'anvil' },
    summit: { name: 'Triangulation Summit', icon: 'map' },
    core: { name: 'The Angle Core', icon: 'target' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'Right triangles', items: [writeRatioStep(rng), findSideStep(rng), angleDialStep(rng), elevationStep(rng), exactValueStep(rng), specialChooseStep(rng)] },
    { name: 'Angles & the circle', items: [coterminalDialStep(rng), referenceChooseStep(rng), toRadiansStep(rng), arcStep(rng), ucCoordStep(rng), ucValueStep(rng)] },
    { name: 'Graphs & inverses', items: [graphPickStep(rng), peakPlotStep(rng), periodEqStep(rng), invExactStep(rng), compositionStep(rng)] },
    { name: 'Identities & formulas', items: [pythagStep(rng), nextStepStep(rng), exactSumStep(rng), doubleTableStep(rng)] },
    { name: 'Oblique triangles & equations', items: [lawSinesStep(rng), lawCosStep(rng), sssDialStep(rng), allSolutionsStep(rng), ucSolveStep(rng), twoSightStep(rng), reservoirStep(rng)] },
  ],
  trialIntro: 'The Mastery Trial. Five phases across the whole mountain, from SOH-CAH-TOA to trig equations, one helper, 80% to pass. The Angle Core is waiting.',
  coreName: 'The Angle Core',
  coreLine: 'Triangles, circles, waves and identities, all one idea. The Angle Core locks into the Engine, every beacon on Trigonometry Mountains blazes at once, and the ropeway carries you on toward Pre-Calculus.',
  coreColor: '#fb7185',
  title: 'Trig Surveyor',
});
