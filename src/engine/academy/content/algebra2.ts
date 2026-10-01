/**
 * The Algebra 2 Academy: function transformations, quadratics (graphing and solving), complex numbers,
 * polynomials, rational functions, radicals and rational exponents, exponentials, logarithms and
 * sequences, then the Mastery Trial. Comes after Geometry and opens Trigonometry.
 * Symbolic answers (complex numbers, forms, formulas) are choose / pickmodel; typed answers are numbers.
 */
import { defineAcademy, type ChapterSpec } from '../defs';
import { academySkill, mkq, typed, choose, model, ask, wave, times, mixOf, conceptFrom, oneOf, rint, pick, rnz, fmt, fmtSigned, polyStr, fracStr, gcd, nearMisses, type Rng, type AskStep, type Visual, type Question } from '../kit';
import type { Fn } from '../fn';
import type { PlotLayers } from '../types';
import { lab, labn } from '../../label';

const ID = 'algebra2';
const S = (key: string) => academySkill(ID, key);
type R4 = [number, number, number, number];

/* ---------------- formatting helpers ---------------- */
const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹'; const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sup = (n: number) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).replace(/\d/g, (d) => SUPS[Number(d)]);
const sub = (n: number) => String(n).replace(/\d/g, (d) => SUBS[Number(d)]);
/** 'x − 3', 'x + 2', or 'x' when h = 0. */
const xm = (h: number, v = 'x') => (h === 0 ? v : `${v} ${h > 0 ? '−' : '+'} ${fmt(Math.abs(h))}`);
/** '(x − 3)' or 'x'. */
const px = (h: number, v = 'x') => (h === 0 ? v : `(${xm(h, v)})`);
/** m·x + b as text. */
const lin = (m: number, b: number, v = 'x') => polyStr([b, m], v);
/** A number ready to substitute: negatives in brackets. */
const pn = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
/** Leading coefficient in front of a bracket: 1 → '', −1 → '−'. */
const lead = (a: number) => (a === 1 ? '' : a === -1 ? '−' : fmt(a));
/** a(x − h)² + k */
const vform = (a: number, h: number, k: number) => `${lead(a)}${h === 0 ? 'x²' : `${px(h)}²`}${k ? ` ${fmtSigned(k)}` : ''}`;
/** Signed term with a unit-coefficient rule: sTerm(-1,'i') → '− i', sTerm(3,'i²') → '+ 3i²'. */
const sTerm = (n: number, v: string) => `${n < 0 ? '−' : '+'} ${Math.abs(n) === 1 ? '' : fmt(Math.abs(n))}${v}`;
/** Complex number a + bi. */
function cx(a: number, b: number): string {
  if (b === 0) return fmt(a);
  const im = Math.abs(b) === 1 ? 'i' : `${fmt(Math.abs(b))}i`;
  if (a === 0) return b < 0 ? `−${im}` : im;
  return `${fmt(a)} ${b < 0 ? '−' : '+'} ${im}`;
}
/** Polynomial written from the constant term up (to catch "the first term is the leading term"). */
function polyAsc(c: number[], v = 'x'): string {
  const terms: string[] = [];
  for (let k = 0; k < c.length; k++) {
    const a = c[k]; if (!a) continue;
    const body = k === 0 ? fmt(Math.abs(a)) : `${Math.abs(a) === 1 ? '' : fmt(Math.abs(a))}${v}${k === 1 ? '' : sup(k)}`;
    terms.push(terms.length === 0 ? (a < 0 ? `−${body}` : body) : `${a < 0 ? '− ' : '+ '}${body}`);
  }
  return terms.join(' ') || '0';
}
/** 'P(3)' substitution text: 2(3)³ − (3) + 1. */
function subst(c: number[], x: number): string {
  const terms: string[] = [];
  for (let k = c.length - 1; k >= 0; k--) {
    const a = c[k]; if (!a) continue;
    const body = k === 0 ? fmt(Math.abs(a)) : `${Math.abs(a) === 1 ? '' : fmt(Math.abs(a))}(${fmt(x)})${k === 1 ? '' : sup(k)}`;
    terms.push(terms.length === 0 ? (a < 0 ? `−${body}` : body) : `${a < 0 ? '− ' : '+ '}${body}`);
  }
  return terms.join(' ') || '0';
}
const polyAt = (c: number[], x: number) => c.reduceRight((acc, k) => acc * x + k, 0);
/** Coefficients (low → high) of a·(x − r1)(x − r2)… */
function expand(roots: number[], a = 1): number[] {
  let c = [a];
  for (const r of roots) { const n = new Array(c.length + 1).fill(0); c.forEach((v, i) => { n[i + 1] += v; n[i] -= r * v; }); c = n; }
  return c;
}
const poly = (c: number[]): Fn => ({ kind: 'poly', c });
const pv = (range: R4, layers: PlotLayers): Visual => ({ type: 'plot', range, layers });
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });
const round2 = (n: number) => Math.round(n * 100) / 100;
/** A non-zero integer in [lo, hi] different from every value in `avoid`. */
function rnzAvoid(rng: Rng, lo: number, hi: number, avoid: number[]): number {
  let v = rnz(rng, lo, hi); let g = 0;
  while (avoid.includes(v) && g++ < 60) v = rnz(rng, lo, hi);
  if (avoid.includes(v)) for (let t = lo; t <= hi; t++) if (t !== 0 && !avoid.includes(t)) return t;
  return v;
}
/** Pick-the-graph: options labelled Graph A–D in the order shown; `visuals[0]` is the right one. */
function pickGraph(rng: Rng, q: Question, visuals: Visual[]): AskStep {
  const order = rng.shuffle(visuals.map((_, i) => i));
  const options = order.map((i, j) => ({ visual: visuals[i], label: `Graph ${'ABCD'[j]}` }));
  const right = options[order.indexOf(0)].label;
  return ask({ ...q, answerText: right }, 'pickmodel', { options, accept: [right] });
}
const R6: R4 = [-6, 6, -6, 6];
/** A wave of builders run in order; a builder may return one ask or a linked pair (same numbers). */
const seqOf = (fs: ((rng: Rng) => AskStep | AskStep[])[]) => (rng: Rng): AskStep[] => fs.flatMap((f) => { const r = f(rng); return Array.isArray(r) ? r : [r]; });

/* =====================================================================
 * 1. Functions & transformations
 * ===================================================================== */
const K1 = 'functions';
const APP1 = 'Engineers reuse one known curve: a delayed, amplified signal is just a·f(t − h) + k.';
interface Parent { name: string; key: string; body: (h: number) => string; fn: (a: number, h: number, k: number) => Fn }
const PARENTS: Parent[] = [
  { name: 'y = |x|', key: 'vertex', body: (h) => `|${xm(h)}|`, fn: (a, h, k) => ({ kind: 'abs', a, h, k }) },
  { name: 'y = x²', key: 'vertex', body: (h) => (h === 0 ? 'x²' : `${px(h)}²`), fn: (a, h, k) => poly([a * h * h + k, -2 * a * h, a]) },
  { name: 'y = √x', key: 'start point', body: (h) => (h === 0 ? '√x' : `√${px(h)}`), fn: (a, h, k) => ({ kind: 'sqrt', a, h, k }) },
];
const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
const gStr = (P: Parent, a: number, h: number, k: number) => `${lead(a)}${P.body(h)}${k ? ` ${fmtSigned(k)}` : ''}`;
/** A labelled slide: shiftX(3) = '3 (units right)', shiftY(−1) = '1 (unit down)'. */
const shiftX = (h: number) => labn(Math.abs(h), h > 0 ? 'unit right' : 'unit left', h > 0 ? 'units right' : 'units left');
const shiftY = (k: number) => labn(Math.abs(k), k > 0 ? 'unit up' : 'unit down', k > 0 ? 'units up' : 'units down');

function vertexShiftStep(rng: Rng): AskStep {
  const P = pick(rng, PARENTS); const h = rnz(rng, -4, 4); const k = rnz(rng, -4, 4);
  const g = gStr(P, 1, h, k);
  const q = mkq(S(K1), 'shift-vertex', {
    prompt: `Vector slides the parent ${P.name} to make g(x) = ${g}.`,
    expression: `g(x) = ${g}`, answer: h, answerText: `(${fmt(h)}, ${fmt(k)})`,
    hint: 'Where is the inside zero? Then read the number added outside.',
    steps: [`Inside: ${xm(h)} = 0 when x = ${fmt(h)}, so the graph moves ${shiftX(h)}, opposite to the sign you see.`, `Outside: ${fmtSigned(k)} moves it ${shiftY(k)}.`, `${cap(P.key)}: (0, 0) moves to (${fmt(h)}, ${fmt(k)}).`],
    visual: pv(R6, { fns: [{ fn: P.fn(1, 0, 0), color: 'muted', dashed: true, label: 'parent' }] }), app: APP1,
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `g(x) = ${g}, parent dashed`, layers: { fns: [{ fn: P.fn(1, 0, 0), color: 'muted', dashed: true }] } }, [`${h},${k}`], `Tap the ${P.key} of g.`);
}

function shiftWordsStep(rng: Rng): AskStep {
  const h = rnz(rng, -5, 5); const k = rnz(rng, -5, 5);
  const e = `y = f(${xm(h)}) ${fmtSigned(k)}`;
  const say = (hh: number, kk: number) => `${hh > 0 ? 'Right' : 'Left'} ${Math.abs(hh)}, ${kk > 0 ? 'up' : 'down'} ${Math.abs(kk)}`;
  const q = mkq(S(K1), 'shift-words', {
    prompt: `Ada copies the cam profile y = f(x) and moves the copy. How does ${e} move the graph?`,
    expression: e, answer: 0,
    hint: 'Inside the brackets: which x makes the inside zero? Outside: read the sign as it is.',
    steps: [`Inside, ${xm(h)} = 0 at x = ${fmt(h)}: every point moves ${shiftX(h)}.`, `Outside, ${fmtSigned(k)} moves every point ${shiftY(k)}.`],
    app: APP1,
  });
  return choose(rng, q, say(h, k), [say(-h, k), say(h, -k), say(-h, -k)]);
}

type ReflectKind = 'neg-out' | 'neg-in' | 'stretch' | 'shift';
function reflectPointStep(rng: Rng, only?: ReflectKind): AskStep {
  const kind = only ?? pick(rng, ['neg-out', 'neg-in', 'stretch', 'shift'] as const);
  let p = rnz(rng, -5, 5); let y = rnz(rng, -5, 5); let g = ''; let ans: [number, number] = [0, 0]; let why = '';
  if (kind === 'neg-out') { g = '−f(x)'; ans = [p, -y]; why = 'The minus is outside: every output changes sign, so points flip over the x-axis.'; }
  else if (kind === 'neg-in') { g = 'f(−x)'; ans = [-p, y]; why = 'The minus is inside: the input changes sign, so points flip over the y-axis.'; }
  else if (kind === 'stretch') { y = rnz(rng, -3, 3); g = '2f(x)'; ans = [p, 2 * y]; why = 'Outside ×2 doubles every height; x stays put.'; }
  else { p = rint(rng, -3, 3); y = rint(rng, -3, 3); const h = rnz(rng, -3, 3); const k = rnz(rng, -3, 3); g = `f(${xm(h)}) ${fmtSigned(k)}`; ans = [p + h, y + k]; why = `Inside ${xm(h)}: move ${shiftX(h)}. Outside ${fmtSigned(k)}: move ${shiftY(k)}.`; }
  const q = mkq(S(K1), 'reflect-point', {
    prompt: `P(${fmt(p)}, ${fmt(y)}) is on y = f(x). Where does P land on y = ${g}?`,
    expression: `y = ${g}`, answer: ans[0], answerText: `(${fmt(ans[0])}, ${fmt(ans[1])})`,
    hint: 'Is the change inside f (it acts on x) or outside f (it acts on y)?',
    steps: [why, `P(${fmt(p)}, ${fmt(y)}) → (${fmt(ans[0])}, ${fmt(ans[1])}).`], app: APP1,
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `P moves to y = ${g}`, layers: { points: [{ x: p, y, label: 'P' }] } }, [`${ans[0]},${ans[1]}`], `Tap where P lands on y = ${g}.`);
}
const flipOutStep = (rng: Rng) => reflectPointStep(rng, 'neg-out');
const flipInStep = (rng: Rng) => reflectPointStep(rng, 'neg-in');

/** −f(x) and f(−x) side by side: both mirror images are offered, only one is right. */
function flipStep(rng: Rng): AskStep {
  const out = rng.next() < 0.5; const p = rnz(rng, -5, 5); const y = rnzAvoid(rng, -5, 5, [p, -p]);
  const g = out ? '−f(x)' : 'f(−x)';
  const pt = (a: number, b: number) => `(${fmt(a)}, ${fmt(b)})`;
  const right = out ? pt(p, -y) : pt(-p, y); const other = out ? pt(-p, y) : pt(p, -y);
  const q = mkq(S(K1), 'flip-choose', {
    prompt: `Ada mirrors a cam profile. P${pt(p, y)} is on y = f(x). Where is P on y = ${g}?`,
    expression: `y = ${g}`, answer: out ? -y : y,
    hint: 'Is the minus sign on the output (outside f) or on the input (inside f)?',
    steps: [out ? 'The minus is outside f: every output y changes sign, a mirror in the x-axis. x stays put.' : 'The minus is inside f: the input changes sign, a mirror in the y-axis. y stays put.', `P${pt(p, y)} → ${right}.`, `${other} would be the other mirror, y = ${out ? 'f(−x)' : '−f(x)'}.`], app: APP1,
  });
  return choose(rng, q, right, [other, pt(-p, -y), pt(y, p)]);
}

function transformTableStep(rng: Rng): AskStep {
  const xs = [-2, -1, 0, 1]; const f = xs.map(() => rint(rng, -4, 4));
  const a = pick(rng, [2, -1, 3, -2]); const k = rnz(rng, -3, 3);
  const g = f.map((v) => a * v + k);
  const gs = `${lead(a)}f(x) ${fmtSigned(k)}`;
  const q = mkq(S(K1), 'transform-table', {
    prompt: `Brick's pump curve f is in the table. Fill in g(x) = ${gs}.`,
    expression: `g(x) = ${gs}`, answer: g[0],
    hint: 'Work one column at a time: take f(x), multiply first, then add.',
    steps: [`Each g(x) = ${lab(fmt(a), 'stretch factor')} × f(x) ${fmtSigned(k)} (vertical shift).`, `For x = −2: f(−2) = ${lab(fmt(f[0]), 'pump reading')}, so ${fmt(a)} × ${pn(f[0])} ${fmtSigned(k)} = ${lab(fmt(g[0]), 'new reading')}.`, `g row: ${g.map(fmt).join(', ')}.`], app: APP1,
  });
  return model(q, { kind: 'table', rowLabels: ['x', 'f(x)', 'g(x)'], rows: [xs, f, [null, null, null, null]], label: `g(x) = ${gs}` }, [g.join(',')], 'Fill the g(x) row.');
}

function evalShiftStep(rng: Rng): AskStep { return typed(evalShiftQ(rng)); }
function evalShiftQ(rng: Rng): Question {
  const h = rnz(rng, -4, 4); const k = rnz(rng, -5, 5); const c = rint(rng, -3, 5);
  const ans = (c - h) ** 2 + k;
  return mkq(S(K1), 'evaluate-shift', {
    prompt: `f(x) = x². The shifted curve is g(x) = f(${xm(h)}) ${fmtSigned(k)}. Find g(${fmt(c)}).`,
    expression: `g(${fmt(c)}) = ?`, answer: ans,
    hint: 'Work the inside first: feed the new input into f, then add the outside number.',
    steps: [`g(${fmt(c)}) = f(${fmt(c)} − ${pn(h)}) ${fmtSigned(k)} = f(${fmt(c - h)}) ${fmtSigned(k)}.`, `f(${fmt(c - h)}) = ${pn(c - h)}² = ${(c - h) ** 2}.`, `${(c - h) ** 2} ${fmtSigned(k)} = ${fmt(ans)}.`],
    app: APP1,
  });
}

function whichGraphStep(rng: Rng): AskStep {
  const P = pick(rng, PARENTS); const a = pick(rng, [1, -1]); const h = rnz(rng, -3, 3); const k = rnz(rng, -3, 3);
  const vis = (aa: number, hh: number, kk: number) => pv(R6, { fns: [{ fn: P.fn(aa, hh, kk) }], points: [{ x: hh, y: kk }] });
  const q = mkq(S(K1), 'which-graph', {
    prompt: `Vector needs the cam profile y = ${gStr(P, a, h, k)}. Which graph is it?`, expression: `y = ${gStr(P, a, h, k)}`, answer: 0,
    hint: `Find the ${P.key} from the formula, then check whether the parent has been flipped.`,
    steps: [`${cap(P.key)}: inside zero at x = ${fmt(h)}, so ${shiftX(h)}; outside ${fmtSigned(k)}, so ${shiftY(k)}: (${fmt(h)}, ${fmt(k)}).`, `${a < 0 ? `The minus in front flips ${P.name.slice(4)} over the horizontal line through that point.` : `No minus in front: it keeps the shape of ${P.name.slice(4)}.`}`], app: APP1,
  });
  return pickGraph(rng, q, [vis(a, h, k), vis(a, -h, k), vis(a, h, -k), vis(-a, h, k)]);
}

function signalDelayStep(rng: Rng): AskStep {
  const d = rint(rng, 2, 6); let w = rint(rng, 1, 5); if (w === d) w = d + 1;
  const q = mkq(S(K1), 'transfer-delay', {
    prompt: `A pressure pulse p(t) leaves the pump. The far sensor sees the same pulse ${d} s later and ${w} kPa lower. Which formula gives the far reading?`,
    expression: 'far reading = ?', answer: 0,
    hint: 'Later means a value arrives at a bigger t. Which input brings it there?',
    steps: [`The delay is ${lab(d, 'delay in s')}: at time t the far sensor shows what the pump sent at t − ${d}, so p(t − ${d}).`, `The drop of ${lab(w, 'pressure drop in kPa')} happens outside: p(t − ${d}) − ${w}.`], app: APP1,
  });
  return choose(rng, q, `p(t − ${d}) − ${w}`, [`p(t + ${d}) − ${w}`, `p(t) − ${d + w}`, `p(t − ${w}) − ${d}`]);
}

function camLogStep(rng: Rng): AskStep {
  const xs = [0, 1, 2, 3, 4]; const f = xs.map(() => rint(rng, 10, 30));
  const h = pick(rng, [1, 2]); const k = rnz(rng, -4, 4); const i = rint(rng, 0, 4 - h); const c = xs[i] + h;
  const ans = f[i] + k;
  const q = mkq(S(K1), 'transfer-flowlog', {
    prompt: `Brick logged a canal's upstream flow f(t) in L/s. The downstream gauge reads the same flow ${h} s late and ${Math.abs(k)} L/s ${k > 0 ? 'higher' : 'lower'}. What does it read at t = ${c}?`,
    expression: `downstream(${c}) = ?`, answer: ans, unit: 'L/s',
    hint: 'Which upstream moment reaches the downstream gauge at that time? Look that up, then adjust.',
    steps: [`Downstream is f(t − ${h}) ${fmtSigned(k)}: ${lab(h, 'delay in s')} late shifts the input; ${lab(Math.abs(k), `L/s ${k > 0 ? 'higher' : 'lower'}`)} is outside.`, `At t = ${lab(c, 'time in s')}: f(${c} − ${h}) ${fmtSigned(k)} = f(${c - h}) ${fmtSigned(k)}.`, `The log says f(${c - h}) = ${lab(fmt(f[i]), 'upstream flow in L/s')}, so ${fmt(f[i])} ${fmtSigned(k)} = ${lab(fmt(ans), 'downstream flow in L/s')}.`],
    visual: card('Upstream flow log (L/s)', [xs.slice(0, 3).map((x, j) => `f(${x}) = ${fmt(f[j])}`).join('   '), xs.slice(3).map((x, j) => `f(${x}) = ${fmt(f[j + 3])}`).join('   ')]), app: APP1,
  });
  return typed(q);
}

/* =====================================================================
 * 2. Quadratic functions
 * ===================================================================== */
const K2 = 'quadratics';
const APP2 = 'Arches, cables, fountains and thrown loads follow parabolas; the vertex is the peak or the lowest point.';

function vertexFormTapStep(rng: Rng): AskStep {
  const a = pick(rng, [1, -1, 2, -2, 3]); const h = rnz(rng, -4, 4); const k = rint(rng, -4, 4);
  const y = vform(a, h, k);
  const q = mkq(S(K2), 'vertex-form', {
    prompt: `Ada's arch template is y = ${y}.`, expression: `y = ${y}`, answer: h, answerText: `(${fmt(h)}, ${fmt(k)})`,
    hint: 'The squared part is never negative. Where is it zero, and what is y there?',
    steps: [`${px(h)}² is 0 when x = ${lab(fmt(h), 'axis of symmetry')}.`, `Then y = ${lab(fmt(k), a > 0 ? 'lowest y' : 'highest y')}: the vertex is (${fmt(h)}, ${fmt(k)}).`, a > 0 ? 'a > 0, so it opens up and the vertex is the lowest point.' : 'a < 0, so it opens down and the vertex is the highest point.'], app: APP2,
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `y = ${y}` }, [`${h},${k}`], 'Tap the vertex.');
}

function axisStep(rng: Rng): AskStep {
  const a = pick(rng, [1, -1, 2, -2]); const h = rnz(rng, -4, 4); const b = -2 * a * h; const c = rnzAvoid(rng, -6, 6, [h, -h, 2 * h]); // x = c slip stays distinct
  const e = `y = ${polyStr([c, b, a])}`;
  const q = mkq(S(K2), 'axis', {
    prompt: `The spillway profile is ${e}. Where is its axis of symmetry?`, expression: e, answer: h,
    hint: 'The axis is x = −b/(2a). Watch both signs.',
    steps: [`a = ${lab(fmt(a), 'coefficient of x²')}, b = ${lab(fmt(b), 'coefficient of x')}.`, `x = −b ÷ 2a = ${fmt(-b)} ÷ ${pn(2 * a)} = ${lab(fmt(h), 'axis of symmetry')}.`], app: APP2,
  });
  return choose(rng, q, `x = ${fmt(h)}`, [`x = ${fmt(-h)}`, `x = ${fmt(2 * h)}`, `x = ${fmt(c)}`]);
}

function vertexStandardTapStep(rng: Rng): AskStep {
  const a = pick(rng, [1, -1]); const h = rnz(rng, -3, 3); const k = rint(rng, -5, 5); const b = -2 * a * h; const c = a * h * h + k;
  const e = polyStr([c, b, a]);
  const q = mkq(S(K2), 'vertex-standard', {
    prompt: `A fountain jet follows y = ${e}.`, expression: `y = ${e}`, answer: h, answerText: `(${fmt(h)}, ${fmt(k)})`,
    hint: 'Find the axis x = −b/(2a) first, then substitute that x.',
    steps: [`x = −b ÷ 2a = ${fmt(-b)} ÷ ${pn(2 * a)} = ${lab(fmt(h), 'axis of symmetry')}.`, `y = ${subst([c, b, a], h)} = ${lab(fmt(k), 'vertex height')}.`, `Vertex (${fmt(h)}, ${fmt(k)}).`], app: APP2,
  });
  return model(q, { kind: 'plot', range: [-6, 6, -7, 7], count: 1, label: `y = ${e}` }, [`${h},${k}`], 'Tap the vertex.');
}

function mirrorPointStep(rng: Rng): AskStep {
  const h = rnz(rng, -2, 2); const d = rnz(rng, -4, 4); const y = rnz(rng, -5, 5);
  const q = mkq(S(K2), 'mirror', {
    prompt: `A parabola has axis of symmetry x = ${fmt(h)}. P(${fmt(h + d)}, ${fmt(y)}) is on it.`,
    expression: `axis x = ${fmt(h)}`, answer: h - d, answerText: `(${fmt(h - d)}, ${fmt(y)})`,
    hint: 'Mirror across the dashed axis, not across the y-axis. Count the distance to the axis.',
    steps: [`P is ${labn(Math.abs(d), `unit ${d > 0 ? 'right' : 'left'} of the axis`, `units ${d > 0 ? 'right' : 'left'} of the axis`)}.`, `Its mirror is the same distance ${d > 0 ? 'left' : 'right'}: x = ${lab(fmt(h), 'axis')} ${d > 0 ? '−' : '+'} ${lab(Math.abs(d), 'distance')} = ${lab(fmt(h - d), 'mirror x-value')}.`, `Same height: (${fmt(h - d)}, ${fmt(y)}).`], app: APP2,
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `Axis x = ${fmt(h)}`, layers: { vlines: [{ x: h, label: `x = ${fmt(h)}` }], points: [{ x: h + d, y, label: 'P' }] } }, [`${h - d},${y}`], 'Tap the mirror point of P.');
}

function convertVertexStep(rng: Rng): AskStep {
  const h = rnz(rng, -4, 4); const b = -2 * h; const c = rint(rng, -6, 8); const k = c - h * h;
  const e = `y = ${polyStr([c, b, 1])}`;
  const q = mkq(S(K2), 'complete-square', {
    prompt: `Newton's fountain jet is ${e}. Complete the square to write it in vertex form.`, expression: e, answer: k,
    hint: 'Half of b, squared, completes the square. Add it AND subtract it.',
    steps: [`Half of ${lab(fmt(b), 'x-coefficient')} is ${fmt(-h)}; squared: ${lab(h * h, 'square to add')}.`, `y = (x² ${fmtSigned(b)}x + ${h * h})${c ? ` ${fmtSigned(c)}` : ''} − ${h * h}.`, `y = ${vform(1, h, k)}.`], app: APP2,
  });
  return choose(rng, q, `y = ${vform(1, h, k)}`, [`y = ${vform(1, -h, k)}`, `y = ${vform(1, h, c)}`, `y = ${vform(1, h, c + h * h)}`]);
}

function whichParabolaStep(rng: Rng): AskStep {
  const a = pick(rng, [1, -1]); const h = rnz(rng, -3, 3); const k = rnz(rng, -3, 3);
  const vis = (aa: number, hh: number, kk: number) => pv(R6, { fns: [{ fn: PARENTS[1].fn(aa, hh, kk) }], points: [{ x: hh, y: kk }] });
  const y = vform(a, h, k);
  const q = mkq(S(K2), 'which-parabola', {
    prompt: `Which graph is the fountain arc y = ${y}?`, expression: `y = ${y}`, answer: 0,
    hint: 'Read the vertex (h, k) from the form, then the sign of a.',
    steps: [`Vertex (${fmt(h)}, ${fmt(k)}).`, a > 0 ? 'a > 0: opens up.' : 'a < 0: opens down.'], app: APP2,
  });
  return pickGraph(rng, q, [vis(a, h, k), vis(a, -h, k), vis(a, h, -k), vis(-a, h, k)]);
}

function minValueStep(rng: Rng): AskStep { return typed(minValueQ(rng)); }
function minValueQ(rng: Rng): Question {
  const a = pick(rng, [1, 2, -1, -2]); const h = rnz(rng, -4, 4); const k = rint(rng, -9, 9); const b = -2 * a * h; const c = a * h * h + k;
  const e = polyStr([c, b, a]);
  return mkq(S(K2), 'extreme-value', {
    prompt: `y = ${e}. What is the ${a > 0 ? 'minimum' : 'maximum'} value of y?`, expression: `y = ${e}`, answer: k,
    hint: 'The extreme value sits on the axis of symmetry. Find that x, then substitute.',
    steps: [`Axis: x = ${fmt(-b)} ÷ ${pn(2 * a)} = ${lab(fmt(h), 'axis of symmetry')}.`, `y = ${subst([c, b, a], h)} = ${lab(fmt(k), a > 0 ? 'minimum value' : 'maximum value')}.`], app: APP2,
  });
}

function archWidthStep(rng: Rng): AskStep {
  const m = rint(rng, 2, 6); const h = rint(rng, m, 8);
  const e = vform(-1, h, m * m);
  const q = mkq(S(K2), 'transfer-arch', {
    prompt: `Ada surveys an arch: y = ${e} metres, with the ground at y = 0. How wide is the arch at the ground?`,
    expression: `y = ${e}`, answer: 2 * m, unit: 'm',
    hint: 'Ground means y = 0. Find both x-values where the arch meets it.',
    steps: [`Set y = ${lab(0, 'ground level')}: ${px(h)}² = ${m * m}.`, `${xm(h)} = ±${m}, so x = ${lab(h - m, 'left foot in m')} or x = ${lab(h + m, 'right foot in m')}.`, `Width = ${lab(h + m, 'right foot in m')} − ${lab(h - m, 'left foot in m')} = ${lab(2 * m, 'width in m')}.`], app: APP2,
  });
  return typed(q);
}

function flarePeakStep(rng: Rng): AskStep {
  const v = pick(rng, [10, 20, 30, 40]); const c = rint(rng, 0, 20); const tp = v / 10; const top = -5 * tp * tp + v * tp + c;
  const askTime = rng.next() < 0.5;
  const q = mkq(S(K2), 'transfer-peak', {
    prompt: `Newton fires a test flare: h(t) = ${polyStr([c, v, -5], 't')} metres. ${askTime ? 'After how many seconds does it peak?' : 'What is its greatest height, in metres?'}`,
    expression: `h(t) = ${polyStr([c, v, -5], 't')}`, answer: askTime ? tp : top, unit: askTime ? 's' : 'm',
    hint: 'The peak is the vertex: t = −b/(2a).',
    steps: [`a = −5 (gravity term), b = ${lab(v, 'launch speed in m/s')}: t = −b ÷ 2a = −${v} ÷ (−10) = ${lab(tp, 'seconds to the peak')}.`, `h(${tp}) = −5(${tp})² + ${v}(${tp})${c ? ` + ${lab(c, 'launch height in m')}` : ''} = ${lab(top, 'peak height in m')}.`], app: APP2,
  });
  return typed(q);
}

/* =====================================================================
 * 3. Solving quadratics
 * ===================================================================== */
const K3 = 'solving';
const APP3 = 'Solving a quadratic tells you when a projectile lands, what size a panel must be, where a beam crosses zero load.';

function twoRoots(rng: Rng, lo = -5, hi = 5, noOpposite = false): [number, number] {
  const r = rnz(rng, lo, hi); const avoid = noOpposite ? [r, -r] : [r];
  return [r, rnzAvoid(rng, lo, hi, avoid)];
}

function zerosTapStep(rng: Rng): AskStep {
  const [r, s] = twoRoots(rng);
  const c = expand([r, s]);
  const e = polyStr(c);
  const q = mkq(S(K3), 'zeros-plot', {
    prompt: `Brick's spillway floor is y = ${e}. Factor it to find where it meets the axis.`,
    expression: `y = ${e}`, answer: Math.min(r, s), answerText: `(${fmt(Math.min(r, s))}, 0) and (${fmt(Math.max(r, s))}, 0)`,
    hint: 'Find two numbers that multiply to the constant and add to the x-coefficient. Then set each factor to zero.',
    steps: [`${e} = ${px(r)}${px(s)}.`, `Each factor can be zero: x = ${lab(fmt(r), 'x-intercept')} or x = ${lab(fmt(s), 'x-intercept')}.`, `Intercepts (${fmt(r)}, 0) and (${fmt(s)}, 0).`], app: APP3,
  });
  return model(q, { kind: 'plot', range: R6, count: 2, label: `y = ${e}` }, undefined, 'Tap both x-intercepts.', { rule: { kind: 'set', items: [`${r},0`, `${s},0`] } });
}

function factorSolveStep(rng: Rng): AskStep {
  const [r, s] = twoRoots(rng, -6, 6, true);
  const c = expand([r, s]);
  const sol = (u: number, v: number) => { const [p, w] = [u, v].sort((m, n) => m - n); return `x = ${fmt(p)} or x = ${fmt(w)}`; };
  const q = mkq(S(K3), 'factor-solve', {
    prompt: `Brick's gate opens where ${polyStr(c)} = 0. Solve by factoring.`, expression: `${polyStr(c)} = 0`, answer: Math.min(r, s),
    hint: 'After factoring, ask what makes each bracket zero.',
    steps: [`${polyStr(c)} = ${px(r)}${px(s)}.`, `${xm(r)} = 0 gives x = ${fmt(r)}; ${xm(s)} = 0 gives x = ${fmt(s)}.`], app: APP3,
  });
  return choose(rng, q, sol(r, s), [sol(-r, -s), sol(-r, s), sol(r, -s)]);
}

function zeroProductBalanceStep(rng: Rng): AskStep {
  const k = pick(rng, [-9, -7, -5, -3, -1, 1, 3, 5, 7, 9]); const s = rnz(rng, -5, 5);
  const q = mkq(S(K3), 'zero-product', {
    prompt: `Brick's gate curve is (2x ${fmtSigned(-k)})${px(s)} = 0. One root is not a whole number. Pick the factor that gives it and solve on the balance.`,
    expression: `(2x ${fmtSigned(-k)})${px(s)} = 0`, answer: k / 2,
    hint: 'A product is zero only if one factor is zero. Which factor has x multiplied by a number?',
    steps: [`Zero product: 2x ${fmtSigned(-k)} = 0 or ${xm(s)} = 0.`, `${xm(s)} = 0 gives the whole number x = ${fmt(s)}.`, `2x ${fmtSigned(-k)} = 0: 2x = ${fmt(k)}, so x = ${fmt(k / 2)}.`], app: APP3,
  });
  return model(q, { kind: 'balance', a: 2, b: -k, c: 0, d: 0, variable: 'x' }, [String(k / 2)], 'Balance the factor that gives the non-whole root until x stands alone.');
}

/** ax² + bx + c with a = 2 or 3 factored as (px − q)(x − s): the step up from Algebra 1's monic factoring. */
function nonMonicFactorStep(rng: Rng): AskStep {
  const p = pick(rng, [2, 3]); let q0 = rnz(rng, -7, 7); let g = 0; while (gcd(p, q0) !== 1 && g++ < 40) q0 = rnz(rng, -7, 7); if (gcd(p, q0) !== 1) q0 = 1;
  const s = rnzAvoid(rng, -5, 5, [q0, -q0, p / q0]);
  const a = p; const b = -(p * s + q0); const c = q0 * s; const e = `${polyStr([c, b, a])} = 0`;
  const val = (n: number, d: number) => ({ v: n / d, t: fracStr(n, d) });
  const sol = (u: { v: number; t: string }, w: { v: number; t: string }) => { const [m, n] = [u, w].sort((x, y) => x.v - y.v); return `x = ${m.t} or x = ${n.t}`; };
  const R = val(q0, p); const Sx = val(s, 1);
  const q = mkq(S(K3), 'factor-nonmonic', {
    prompt: `Brick's lower gate follows ${e}. Factor it and solve.`, expression: e, answer: Math.min(q0 / p, s),
    hint: `Look for (${p}x ± ?)(x ± ?): the outer and inner products must add to ${fmt(b)}.`,
    steps: [`${polyStr([c, b, a])} = (${p}x ${fmtSigned(-q0)})${px(s)}: check ${p}x·${pn(-s)} + ${pn(-q0)}·x = ${fmt(b)}x.`, `${p}x ${fmtSigned(-q0)} = 0 gives ${p}x = ${fmt(q0)}, so x = ${R.t}: divide by ${p}.`, `${xm(s)} = 0 gives x = ${fmt(s)}.`], app: APP3,
  });
  const wrongs = [sol(val(q0, 1), Sx), sol(val(-q0, p), val(-s, 1)), sol(val(p, q0), Sx), sol(val(-q0, p), Sx), sol(R, val(-s, 1))];
  return choose(rng, q, sol(R, Sx), wrongs.filter((w) => !/x = (\S+) or x = \1$/.test(w)));
}

const ROOTS_TWO = 'Two real roots'; const ROOTS_ONE = 'One real root (a double root)'; const ROOTS_NONE = 'No real roots (two complex roots)';
function discriminantCase(rng: Rng): { a: number; b: number; c: number; D: number; kind: 'two' | 'one' | 'none' } {
  const kind = pick(rng, ['two', 'one', 'none'] as const);
  if (kind === 'one') { const a = pick(rng, [1, 2, -1, 3]); const r = rnz(rng, -3, 3); return { a, b: -2 * a * r, c: a * r * r, D: 0, kind }; }
  for (let g = 0; g < 200; g++) {
    const a = pick(rng, [1, 2, 3, -1, -2]); const b = rint(rng, -6, 6); const c = rnz(rng, -6, 6); const D = b * b - 4 * a * c;
    if ((kind === 'two' && D > 0) || (kind === 'none' && D < 0)) return { a, b, c, D, kind };
  }
  return { a: 1, b: -5, c: 6, D: 1, kind: 'two' };
}
function discCountStep(rng: Rng): AskStep {
  const { a, b, c, D, kind } = discriminantCase(rng);
  const right = kind === 'two' ? ROOTS_TWO : kind === 'one' ? ROOTS_ONE : ROOTS_NONE;
  const q = mkq(S(K3), 'discriminant-count', {
    prompt: `Volt checks a circuit equation, ${polyStr([c, b, a])} = 0. How many real roots does it have?`, expression: `${polyStr([c, b, a])} = 0`, answer: D,
    hint: 'Work out b² − 4ac and look at its sign. A negative b squared is positive.',
    steps: [`D = b² − 4ac = ${pn(b)}² − 4·${pn(a)}·${pn(c)} = ${lab(fmt(D), 'discriminant')}.`, D > 0 ? 'D > 0: two real roots.' : D === 0 ? 'D = 0: one repeated root; the vertex touches the axis.' : 'D < 0: no real roots; the parabola misses the axis.'], app: APP3,
  });
  return choose(rng, q, right, [ROOTS_TWO, ROOTS_ONE, ROOTS_NONE].filter((x) => x !== right));
}
function discTypedStep(rng: Rng): AskStep { return typed(discQ(rng)); }
function discQ(rng: Rng): Question {
  const { a, b, c, D } = discriminantCase(rng);
  return mkq(S(K3), 'discriminant', {
    prompt: `Volt checks ${polyStr([c, b, a])} = 0 before solving. Find the discriminant b² − 4ac.`, expression: 'b² − 4ac = ?', answer: D,
    hint: 'Square b first (a square is never negative), then subtract 4ac, minding the sign of ac.',
    steps: [`a = ${lab(fmt(a), 'coefficient of x²')}, b = ${lab(fmt(b), 'coefficient of x')}, c = ${lab(fmt(c), 'constant')}.`, `D = ${pn(b)}² − 4·${pn(a)}·${pn(c)} = ${b * b} ${fmtSigned(-4 * a * c)} = ${lab(fmt(D), 'discriminant')}.`], app: APP3,
  });
}

function completeSquareTableStep(rng: Rng): AskStep {
  const h = rnz(rng, -5, 5); const m = rint(rng, 1, 5); const b = -2 * h; const c = h * h - m * m;
  const eq = `${polyStr([c, b, 1])} = 0`;
  const q = mkq(S(K3), 'complete-square-table', {
    prompt: `Brick solves ${eq} by completing the square. Move c across, add (b ÷ 2)² to both sides, then take the square root.`,
    expression: eq, answer: h - m,
    hint: 'b is the x-coefficient. Halve it (keep its sign), square that, and add it to what is on the right. Then ± the root.',
    steps: [`b = ${lab(fmt(b), 'x-coefficient')}; half is ${fmt(-h)}; squared ${lab(h * h, 'square to add')}.`, `x² ${fmtSigned(b)}x = ${fmt(-c)}, so x² ${fmtSigned(b)}x + ${h * h} = ${fmt(-c)} + ${h * h}: ${px(h)}² = ${lab(m * m, 'new right side')}.`, `${xm(h)} = ±${m}, so x = ${fmt(h - m)} or x = ${fmt(h + m)}.`], app: APP3,
  });
  return model(q, { kind: 'table', rowLabels: ['(b ÷ 2)²', 'right side', 'smaller x', 'larger x'], cols: ['value'], rows: [[null], [null], [null], [null]], label: eq }, [`${h * h},${m * m},${h - m},${h + m}`], 'Fill each line: the square you add, the new right side, then both roots.');
}

function quadFormulaTypedStep(rng: Rng): AskStep { return typed(quadFormulaQ(rng)); }
function quadFormulaQ(rng: Rng): Question {
  const p = pick(rng, [2, 3]); let qq = rnz(rng, -7, 7); let g = 0; while (qq % p === 0 && g++ < 40) qq = rnz(rng, -7, 7); if (qq % p === 0) qq = 1;
  const s = rnz(rng, -5, 5);
  const a = p; const b = -(p * s + qq); const c = qq * s; const D = b * b - 4 * a * c; const sq = Math.abs(p * s - qq);
  const big = Math.max(qq / p, s);
  return mkq(S(K3), 'formula', {
    prompt: `Volt's filter needs ${polyStr([c, b, a])} = 0. Use the quadratic formula and type the larger root (as a fraction if it is not whole).`, expression: `${polyStr([c, b, a])} = 0`,
    answer: big, answerText: fracStr(-b + sq, 2 * a), fraction: true,
    hint: 'x = (−b ± √(b² − 4ac)) ÷ 2a. Divide the whole top by 2a.',
    steps: [`a = ${a}, b = ${fmt(b)}, c = ${fmt(c)}.`, `D = ${pn(b)}² − 4·${a}·${pn(c)} = ${lab(D, 'discriminant')}; √D = ${sq}.`, `x = (${fmt(-b)} ± ${sq}) ÷ ${2 * a}: x = ${fracStr(-b + sq, 2 * a)} or x = ${fracStr(-b - sq, 2 * a)}.`, `Larger root: ${fracStr(-b + sq, 2 * a)}.`], app: APP3,
  });
}

function irrationalRootsStep(rng: Rng): AskStep {
  const h = rnz(rng, -4, 4); const m = pick(rng, [2, 3, 5, 6, 7]); const b = -2 * h; const c = h * h - m;
  const q = mkq(S(K3), 'formula-irrational', {
    prompt: `Ada's brace length solves ${polyStr([c, b, 1])} = 0. Solve it exactly.`, expression: `${polyStr([c, b, 1])} = 0`, answer: h,
    hint: 'Use the formula; then simplify the root and divide EVERY term on top by 2a.',
    steps: [`D = ${pn(b)}² − 4·1·${pn(c)} = ${lab(4 * m, 'discriminant')}.`, `√${4 * m} = √4·√${m} = 2√${m}.`, `x = (${fmt(-b)} ± 2√${m}) ÷ 2 = ${fmt(h)} ± √${m}.`], app: APP3,
  });
  return choose(rng, q, `x = ${fmt(h)} ± √${m}`, [`x = ${fmt(-h)} ± √${m}`, `x = ${fmt(h)} ± 2√${m}`, `x = ${fmt(h)} ± ${m}`]);
}

function flareLandStep(rng: Rng): AskStep {
  const T = rint(rng, 2, 6); const u = pick(rng, [0, 1]); const b = 5 * (T - u); const c = 5 * T * u;
  const e = polyStr([c, b, -5], 't');
  const q = mkq(S(K3), 'transfer-landing', {
    prompt: `Newton's flare has height h(t) = ${e} metres. After how many seconds does it land (h = 0)?`,
    expression: `${e} = 0`, answer: T, unit: 's',
    hint: 'Set h = 0 and divide every term by −5 first. Only a positive time makes sense.',
    steps: [`Landing means h = ${lab(0, 'ground height in m')}. Divide by −5: ${polyStr([-c / 5, -b / 5, 1], 't')} = 0.`, `Factor: ${u ? `(t − ${T})(t + 1)` : `t(t − ${T})`} = 0.`, `t = ${lab(T, 'landing time in s')}; the other root, t = ${u ? '−1' : '0'}, is not the landing.`], app: APP3,
  });
  return typed(q);
}

function panelAreaStep(rng: Rng): AskStep {
  const w = rint(rng, 2, 9); const d = rint(rng, 1, 5); const A = w * (w + d);
  const q = mkq(S(K3), 'transfer-panel', {
    prompt: `Volt's solar panel is ${d} m longer than it is wide, with area ${A} m². How wide is it?`,
    expression: `w(w + ${d}) = ${A}`, answer: w, unit: 'm',
    hint: 'Write w(w + d) = area as a quadratic equal to zero and factor it.',
    steps: [`Length = w + ${lab(d, 'extra length in m')}, so w(w + ${d}) = ${lab(A, 'area in m²')}: ${polyStr([-A, d, 1], 'w')} = 0.`, `(w − ${w})(w + ${w + d}) = 0.`, `w = ${lab(w, 'width in m')}; a width can't be negative.`], app: APP3,
  });
  return typed(q);
}

/* =====================================================================
 * 4. Complex numbers
 * ===================================================================== */
const K4 = 'complex';
const APP4 = 'Electrical engineers write AC voltages and impedances as complex numbers (they call i "j").';

function iPowerStep(rng: Rng): AskStep {
  const n = rint(rng, 5, 30); const r = n % 4; const vals = ['1', 'i', '−1', '−i']; const right = vals[r];
  const q = mkq(S(K4), 'powers-of-i', {
    prompt: `Vector's phase counter reads i${sup(n)}. Simplify it.`, expression: `i${sup(n)} = ?`, answer: r,
    hint: 'i² = −1, not 1. So i⁴ = (i²)² = 1: the powers repeat every 4.',
    steps: [`i⁴ = 1, so only the remainder matters: ${lab(n, 'exponent')} ÷ ${lab(4, 'cycle length')} leaves ${lab(r, 'remainder')}.`, `i${sup(n)} = i${sup(r)} = ${right}.`], app: APP4,
  });
  return choose(rng, q, right, vals.filter((v) => v !== right));
}

function addComplexStep(rng: Rng): AskStep {
  const a = rnz(rng, -6, 6); const b = rnz(rng, -6, 6); const c = rnz(rng, -6, 6); const d = rnz(rng, -6, 6);
  const plus = rng.next() < 0.5;
  const re = plus ? a + c : a - c; const im = plus ? b + d : b - d;
  const e = `(${cx(a, b)}) ${plus ? '+' : '−'} (${cx(c, d)})`;
  const q = mkq(S(K4), 'add-subtract', {
    prompt: `Combine the two phasors: ${e}.`, expression: e, answer: re,
    hint: plus ? 'Real parts with real parts, i parts with i parts.' : 'The minus hits BOTH parts of the second number.',
    steps: [plus ? `Real: ${fmt(a)} ${fmtSigned(c)} = ${lab(fmt(re), 'real part')}.` : `Real: ${fmt(a)} − ${pn(c)} = ${lab(fmt(re), 'real part')}.`, plus ? `Imaginary: ${fmt(b)} ${fmtSigned(d)} = ${lab(fmt(im), 'imaginary part')}.` : `Imaginary: ${fmt(b)} − ${pn(d)} = ${lab(fmt(im), 'imaginary part')}.`, `= ${cx(re, im)}.`], app: APP4,
  });
  const wrongs = plus ? [cx(a + d, b + c), fmt(a + b + c + d), cx(a + c, b - d)] : [cx(a - c, b + d), cx(a + c, b - d), cx(a - d, b - c)];
  // when a slip happens to land on the right value (a purely real sum, say), top up with sign slips on each part
  return choose(rng, q, cx(re, im), [...wrongs, cx(re, -im), cx(-re, im), cx(im, re), plus ? cx(a - c, b - d) : cx(a + c, b + d)]);
}

function productParts(rng: Rng) {
  for (let g = 0; g < 80; g++) {
    const a = rnz(rng, -4, 4); const b = rnz(rng, -4, 4); const c = rnz(rng, -4, 4); const d = rnz(rng, -4, 4);
    if (a * d + b * c !== 0) return { a, b, c, d, re: a * c - b * d, im: a * d + b * c };
  }
  return { a: 2, b: 3, c: 1, d: -1, re: 5, im: 1 };
}
const foilLine = (a: number, b: number, c: number, d: number) => `${fmt(a * c)} ${sTerm(a * d, 'i')} ${sTerm(b * c, 'i')} ${sTerm(b * d, 'i²')}`;
function multComplexStep(rng: Rng): AskStep {
  const { a, b, c, d, re, im } = productParts(rng);
  const e = `(${cx(a, b)})(${cx(c, d)})`;
  const q = mkq(S(K4), 'multiply', {
    prompt: `Volt multiplies two phasors: ${e}.`, expression: e, answer: re,
    hint: 'FOIL all four products, then replace i² with −1.',
    steps: [`FOIL: ${foilLine(a, b, c, d)}.`, `i² = −1, so ${sTerm(b * d, 'i²').replace(/^\+ /, '')} becomes ${fmt(-b * d)}.`, `Real: ${fmt(a * c)} ${fmtSigned(-b * d)} = ${lab(fmt(re), 'real part')}. Imaginary: ${fmt(a * d)} ${fmtSigned(b * c)} = ${lab(fmt(im), 'imaginary part')}.`, `= ${cx(re, im)}.`], app: APP4,
  });
  return choose(rng, q, cx(re, im), [cx(a * c + b * d, im), cx(a * c, b * d), cx(re, 0)]);
}

type ProductParts = ReturnType<typeof productParts>;
/** FOIL as an area grid: rows a and bi, columns c and di; the i·i cell is entered already turned into −bd. */
function productTableStep(rng: Rng, P: ProductParts = productParts(rng)): AskStep {
  const { a, b, c, d, re, im } = P;
  const e = `(${cx(a, b)})(${cx(c, d)})`;
  const q = mkq(S(K4), 'multiply-table', {
    prompt: `Volt multiplies two phasors, ${e}, on an area grid: each cell is a row times a column.`, expression: e, answer: re,
    hint: 'Multiply the numbers in each cell. An i times a plain number is an i term; i times i is i², which is −1.',
    steps: [`FOIL: ${foilLine(a, b, c, d)}.`, `The i·i cell: ${cx(0, b)} × ${cx(0, d)} = ${fmt(b * d)}i² = ${fmt(-b * d)}.`, `Real: ${fmt(a * c)} ${fmtSigned(-b * d)} = ${lab(fmt(re), 'real part')}. Imaginary: ${fmt(a * d)} ${fmtSigned(b * c)} = ${lab(fmt(im), 'imaginary part')}. Product ${cx(re, im)}.`], app: APP4,
  });
  return model(q, { kind: 'table', rowLabels: [fmt(a), cx(0, b)], cols: [`× ${fmt(c)}`, `× ${cx(0, d)}`], rows: [[null, null], [null, null]], label: e }, [`${a * c},${a * d},${b * c},${-b * d}`], 'Fill each cell as a number: an i term by its coefficient, the i·i cell after turning i² into −1.');
}
/** Combine the grid: the same product, now as one complex number. */
function productCombineStep(rng: Rng, P: ProductParts = productParts(rng)): AskStep {
  const { a, b, c, d, re, im } = P;
  const e = `(${cx(a, b)})(${cx(c, d)})`;
  const q = mkq(S(K4), 'multiply-combine', {
    prompt: `Volt's grid for ${e} holds ${fmt(a * c)}, ${cx(0, a * d)}, ${cx(0, b * c)} and ${fmt(b * d)}i². Which is the product?`, expression: e, answer: re,
    hint: 'Collect the plain numbers and the i terms separately. What is i² worth?',
    steps: [`i² = −1, so ${fmt(b * d)}i² = ${fmt(-b * d)}: a real number.`, `Real: ${fmt(a * c)} ${fmtSigned(-b * d)} = ${lab(fmt(re), 'real part')}. Imaginary: ${fmt(a * d)} ${fmtSigned(b * c)} = ${lab(fmt(im), 'imaginary part')}.`, `= ${cx(re, im)}.`], app: APP4,
  });
  return choose(rng, q, cx(re, im), [cx(a * c + b * d, im), cx(a * c, a * d + b * c + b * d), cx(re, 0), cx(re, -im)]);
}
const productPair = (rng: Rng): AskStep[] => { const P = productParts(rng); return [productTableStep(rng, P), productCombineStep(rng, P)]; };

function complexPlotStep(rng: Rng): AskStep {
  let a = 0; let b = 0; let c = 0; let d = 0;
  for (let g = 0; g < 40; g++) { a = rnz(rng, -3, 3); b = rnz(rng, -3, 3); c = rnz(rng, -3, 3); d = rnz(rng, -3, 3); if (a + c !== 0 || b + d !== 0) break; }
  const q = mkq(S(K4), 'complex-plane', {
    prompt: `z₁ = ${cx(a, b)} and z₂ = ${cx(c, d)}. Plot z₁ + z₂ (real part across, imaginary part up).`,
    expression: 'z₁ + z₂', answer: a + c, answerText: cx(a + c, b + d),
    hint: 'Adding complex numbers adds arrows tip to tail: add across, add up.',
    steps: [`Real parts: ${fmt(a)} ${fmtSigned(c)} = ${lab(fmt(a + c), 'real part')}.`, `Imaginary parts: ${fmt(b)} ${fmtSigned(d)} = ${lab(fmt(b + d), 'imaginary part')}.`, `z₁ + z₂ = ${cx(a + c, b + d)}: the point (${fmt(a + c)}, ${fmt(b + d)}).`], app: APP4,
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: 'Complex plane: real →, imaginary ↑', layers: { vectors: [{ x: a, y: b, label: 'z₁', color: 'teal' }, { x: c, y: d, label: 'z₂', color: 'orange' }] } }, [`${a + c},${b + d}`], 'Tap the tip of z₁ + z₂.');
}

const imStr = (m: number) => (m === 1 ? 'i' : `${m}i`);
function complexRootsStep(rng: Rng): AskStep {
  const h = rnz(rng, -4, 4); const m = rint(rng, 1, 4); const b = -2 * h; const c = h * h + m * m;
  const e = `${polyStr([c, b, 1])} = 0`;
  const q = mkq(S(K4), 'complex-roots', {
    prompt: `Volt's resonance equation is ${e}. Solve it.`, expression: e, answer: h,
    hint: 'Use the formula. A negative discriminant gives √(negative) = a real number times i.',
    steps: [`D = ${pn(b)}² − 4·${c} = ${lab(fmt(-4 * m * m), 'discriminant')}: negative, so no REAL roots, but there are still two complex roots.`, `√(${fmt(-4 * m * m)}) = ${imStr(2 * m)}.`, `x = (${fmt(-b)} ± ${imStr(2 * m)}) ÷ 2 = ${fmt(h)} ± ${imStr(m)}.`], app: APP4,
  });
  const slip = pick(rng, [`x = ${fmt(h)} ± ${imStr(2 * m)}`, `x = ${fmt(h)} ± ${m}`]);
  return choose(rng, q, `x = ${fmt(h)} ± ${imStr(m)}`, ['No solution: the discriminant is negative', `x = ${fmt(-h)} ± ${imStr(m)}`, slip]);
}

function conjugatePlotStep(rng: Rng): AskStep {
  const a = rnz(rng, -5, 5); const b = rnz(rng, -5, 5);
  const q = mkq(S(K4), 'conjugate-plot', {
    prompt: `Volt's signal is z = ${cx(a, b)}. Its conjugate keeps the real part and flips the sign of the i part. Plot the conjugate.`,
    expression: `conjugate of ${cx(a, b)}`, answer: a, answerText: cx(a, -b),
    hint: 'Which part changes sign? On the plane, what does that do to the point?',
    steps: [`The conjugate of ${cx(a, b)} is ${cx(a, -b)}.`, `The point (${fmt(a)}, ${fmt(b)}) moves to (${fmt(a)}, ${fmt(-b)}): a mirror in the real axis.`], app: APP4,
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: 'Complex plane: real →, imaginary ↑', layers: { vectors: [{ x: a, y: b, label: 'z', color: 'teal' }] } }, [`${a},${-b}`], 'Tap the conjugate of z.');
}

function modulusStep(rng: Rng): AskStep { return typed(modulusQ(rng)); }
function modulusQ(rng: Rng): Question {
  const [p, qq, r] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5], [12, 5, 13]]);
  const a = rng.next() < 0.5 ? -p : p; const b = rng.next() < 0.5 ? -qq : qq;
  return mkq(S(K4), 'modulus', {
    prompt: `A signal phasor is z = ${cx(a, b)}. Its size is |z| = √(a² + b²). Find |z|.`, expression: `|${cx(a, b)}| = ?`, answer: r,
    hint: 'Square both parts (a square is never negative), add, then take the root. It is not a + b.',
    steps: [`a = ${lab(fmt(a), 'real part')}, b = ${lab(fmt(b), 'imaginary part')}.`, `|z| = √(${pn(a)}² + ${pn(b)}²) = √${a * a + b * b} = ${lab(r, 'size of the phasor')}.`], app: APP4,
  });
}

function conjugateStep(rng: Rng): AskStep {
  const a = rnz(rng, -6, 6); const b = rint(rng, 1, 6);
  const q = mkq(S(K4), 'conjugate', {
    prompt: `Multiply ${cx(a, b)} by its conjugate ${cx(a, -b)}.`, expression: `(${cx(a, b)})(${cx(a, -b)}) = ?`, answer: a * a + b * b,
    hint: 'The i terms cancel. What does −b²i² become?',
    steps: [`(a + bi)(a − bi) = a² − b²i² = a² + b².`, `${pn(a)}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}.`], app: APP4,
  });
  return typed(q);
}

function impedanceStep(rng: Rng): AskStep {
  const [R, X0, Z] = pick(rng, [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15]] as const);
  const X = rng.next() < 0.5 ? -X0 : X0; const r1 = rint(rng, 1, R - 1); const r2 = R - r1; const x1 = rnzAvoid(rng, -9, 9, [X]); const x2 = X - x1;
  const I = rint(rng, 2, 5); const V = I * Z;
  const q = mkq(S(K4), 'transfer-current', {
    prompt: `Volt puts Z₁ = ${cx(r1, x1)} Ω and Z₂ = ${cx(r2, x2)} Ω in series on a ${V} V AC supply. The current is I = V ÷ |Z₁ + Z₂|. Find I.`,
    expression: `I = ${V} ÷ |Z₁ + Z₂|`, answer: I, unit: 'A',
    hint: 'Series impedances add as complex numbers. Then the size |a + bi| = √(a² + b²) goes under the voltage.',
    steps: [`Real parts: ${r1} + ${r2} = ${lab(R, 'total resistance in ohms')}. Imaginary parts: ${fmt(x1)} ${fmtSigned(x2)} = ${lab(fmt(X), 'total reactance in ohms')}. Z = ${cx(R, X)} Ω.`, `|Z| = √(${R}² + ${X0}²) = √${R * R + X0 * X0} = ${lab(Z, 'impedance size in ohms')}, not ${R} + ${X0}.`, `I = ${lab(V, 'supply in volts')} ÷ ${lab(Z, 'impedance size in ohms')} = ${lab(I, 'current in amps')}.`], app: APP4,
  });
  return typed(q);
}

function rotateStep(rng: Rng): AskStep {
  const a = rnz(rng, -4, 4); const b = rnz(rng, -4, 4);
  const q = mkq(S(K4), 'transfer-rotate', {
    prompt: `Ada's robot arm tip is at z = ${cx(a, b)}. Multiplying by i turns it 90° counter-clockwise. Plot i·z.`,
    expression: `i·(${cx(a, b)})`, answer: -b, answerText: cx(-b, a),
    hint: 'Multiply out: i·a + i·bi, and remember i² = −1.',
    steps: [`i·(${cx(a, b)}) = ${cx(0, a)} ${sTerm(b, 'i²')} = ${cx(-b, a)}.`, `So the tip moves to (${fmt(-b)}, ${fmt(a)}): a quarter turn.`], app: APP4,
  });
  return model(q, { kind: 'plot', range: R6, count: 1, arrows: true, label: 'Complex plane: real →, imaginary ↑', layers: { vectors: [{ x: a, y: b, label: 'z', color: 'teal' }] } }, [`${-b},${a}`], 'Tap the tip of i·z.');
}

/* =====================================================================
 * 5. Polynomial functions
 * ===================================================================== */
const K5 = 'polynomials';
const APP5 = 'Cam profiles, beam deflection and control systems are polynomials; their zeros are where things balance.';
const ENDS = ['Falls left, rises right', 'Rises left, falls right', 'Rises on both ends', 'Falls on both ends'];

function endBehaviorStep(rng: Rng): AskStep {
  const n = rint(rng, 2, 5); const a = pick(rng, [1, 2, 3, -1, -2, -3]);
  const c = Array.from({ length: n + 1 }, () => (rng.next() < 0.5 ? rnz(rng, -6, 6) : 0)); c[n] = a;
  if (c.slice(0, n).every((v) => v === 0)) c[0] = rnz(rng, -6, 6);
  const expr = rng.next() < 0.5 ? polyAsc(c) : polyStr(c);
  const right = n % 2 ? (a > 0 ? ENDS[0] : ENDS[1]) : a > 0 ? ENDS[2] : ENDS[3];
  const q = mkq(S(K5), 'end-behaviour', {
    prompt: `A gear-tooth profile is y = ${expr}. How do its ends behave?`, expression: `y = ${expr}`, answer: n,
    hint: 'Find the highest power wherever it is written: its degree and its sign decide both ends.',
    steps: [`Leading term: ${lead(a)}x${sup(n)}.`, n % 2 ? `Degree ${n} is odd: the ends go opposite ways.` : `Degree ${n} is even: both ends go the same way.`, `Leading coefficient ${a > 0 ? 'positive' : 'negative'}: ${right.toLowerCase()}.`], app: APP5,
  });
  return choose(rng, q, right, ENDS.filter((x) => x !== right));
}

function zerosMultStep(rng: Rng, mode: 'bounce' | 'cross' | 'both'): AskStep {
  const [r, s] = twoRoots(rng, -4, 4);
  const e = `y = ${px(r)}²${px(s)}`;
  const steps = [`${xm(r)} is squared: x = ${fmt(r)} has multiplicity 2 (even), so the graph touches the axis and turns back.`, `${xm(s)} appears once: x = ${fmt(s)} has multiplicity 1 (odd), so the graph crosses.`];
  const q = mkq(S(K5), mode === 'both' ? 'zeros' : 'multiplicity-plot', {
    prompt: mode === 'both' ? `Brick's gearbox wobble is ${e}. Find its zeros.` : `Brick's gearbox wobble is ${e}. Which zero does the graph ${mode === 'bounce' ? 'touch and turn back from' : 'cross straight through'}?`,
    expression: e, answer: mode === 'cross' ? s : r, answerText: mode === 'both' ? `(${fmt(r)}, 0) and (${fmt(s)}, 0)` : `(${fmt(mode === 'cross' ? s : r)}, 0)`,
    hint: mode === 'both' ? 'Set each factor to zero. The square does not change where it is zero.' : 'Look at each factor\'s power: even powers do not change sign.',
    steps, app: APP5,
  });
  if (mode === 'both') return model(q, { kind: 'plot', range: R6, count: 2, label: e }, undefined, 'Tap both zeros on the x-axis.', { rule: { kind: 'set', items: [`${r},0`, `${s},0`] } });
  const z = mode === 'cross' ? s : r;
  return model(q, { kind: 'plot', range: R6, count: 1, label: e }, [`${z},0`], `Tap the zero where the graph ${mode === 'bounce' ? 'touches and turns' : 'crosses'}.`);
}
const bounceTapStep = (rng: Rng) => zerosMultStep(rng, rng.next() < 0.6 ? 'bounce' : 'cross');
const zerosBothStep = (rng: Rng) => zerosMultStep(rng, 'both');

const MULT = ['Crosses straight through', 'Touches the axis and turns back', 'Crosses, flattening out as it passes'];
function multiplicityStep(rng: Rng): AskStep {
  const [r, s] = twoRoots(rng, -4, 4); const m = pick(rng, [1, 2, 3]); const n = pick(rng, [1, 2, 3]);
  const e = `y = ${px(r)}${m > 1 ? sup(m) : ''}${px(s)}${n > 1 ? sup(n) : ''}`;
  const right = MULT[m - 1];
  const q = mkq(S(K5), 'multiplicity', {
    prompt: `Brick's shaft wobble is ${e}. What does the graph do at x = ${fmt(r)}?`, expression: e, answer: m,
    hint: 'The power on that factor is its multiplicity. Does y change sign as x passes the zero?',
    steps: [`${xm(r)} has power ${m}: multiplicity ${m}.`, m === 2 ? 'Even multiplicity: y keeps its sign, so the graph touches and turns back.' : m === 1 ? 'Multiplicity 1: y changes sign, crossing like a line.' : 'Odd multiplicity 3: y changes sign, but the graph flattens like x³ as it crosses.'], app: APP5,
  });
  return choose(rng, q, right, MULT.filter((x) => x !== right));
}

function syntheticParts(rng: Rng) {
  const q2 = pick(rng, [1, 2, -1]); const q1 = rint(rng, -4, 4); const q0 = rint(rng, -4, 4); const R = rint(rng, -6, 6); const r = rnz(rng, -3, 3);
  const a3 = q2; const a2 = q1 - r * q2; const a1 = q0 - r * q1; const a0 = R - r * q0;
  return { q2, q1, q0, R, r, c: [a0, a1, a2, a3] };
}
function syntheticTableStep(rng: Rng): AskStep {
  const { q2, q1, q0, R, r, c } = syntheticParts(rng);
  const P = polyStr(c);
  const q = mkq(S(K5), 'synthetic', {
    prompt: `Ada divides P(x) = ${P} by ${xm(r)} with synthetic division.`, expression: `(${P}) ÷ (${xm(r)})`, answer: R,
    hint: `Use the number that makes ${xm(r)} zero. Bring down, multiply, add, repeat.`,
    steps: [`${xm(r)} = 0 at x = ${fmt(r)}: use ${fmt(r)}.`, `Bring down ${fmt(q2)}. ${fmt(q2)}·${pn(r)} + ${pn(c[2])} = ${fmt(q1)}.`, `${fmt(q1)}·${pn(r)} + ${pn(c[1])} = ${fmt(q0)}. ${fmt(q0)}·${pn(r)} + ${pn(c[0])} = ${fmt(R)}.`, `Quotient ${polyStr([q0, q1, q2])}, remainder ${fmt(R)}.`], app: APP5,
  });
  return model(q, { kind: 'table', rowLabels: ['P', 'bottom'], cols: ['x³', 'x²', 'x', '1'], rows: [[c[3], c[2], c[1], c[0]], [null, null, null, null]], label: `÷ (${xm(r)})` }, [`${q2},${q1},${q0},${R}`], 'Fill the bottom row; the last cell is the remainder.');
}

function remainderParts(rng: Rng) {
  const c = [rint(rng, -5, 5), rint(rng, -4, 4), rint(rng, -3, 3), pick(rng, [1, -1, 2])]; const r = rnz(rng, -3, 3);
  return { c, r, R: polyAt(c, r) };
}
function remainderStep(rng: Rng): AskStep {
  const { c, r, R } = remainderParts(rng);
  const q = mkq(S(K5), 'remainder', {
    prompt: `Ada feeds P(x) = ${polyStr(c)} into the divider press with ${xm(r)}. What remainder comes out?`, expression: `P(x) ÷ (${xm(r)})`, answer: R,
    hint: 'Remainder theorem: the remainder is P of the number that makes the divisor zero.',
    steps: [`${xm(r)} = 0 when x = ${fmt(r)}.`, `P(${fmt(r)}) = ${subst(c, r)} = ${lab(fmt(R), 'remainder')}.`], app: APP5,
  });
  const wrongs = [fmt(polyAt(c, -r)), fmt(c[0]), ...nearMisses(rng, R, 3, 3)]; // P(−r) or c₀ may equal R: choose() drops those
  return choose(rng, q, fmt(R), wrongs);
}
function remainderTypedStep(rng: Rng): AskStep { return typed(remainderQ(rng)); }
function remainderQ(rng: Rng): Question {
  const { c, r, R } = remainderParts(rng);
  return mkq(S(K5), 'remainder', {
    prompt: `Use the remainder theorem: what remainder does P(x) = ${polyStr(c)} leave when divided by ${xm(r)}?`, expression: `P(x) ÷ (${xm(r)})`, answer: R,
    hint: 'No long division needed: substitute the number that makes the divisor zero.',
    steps: [`${xm(r)} = 0 when x = ${fmt(r)}.`, `P(${fmt(r)}) = ${subst(c, r)} = ${lab(fmt(R), 'remainder')}.`], app: APP5,
  });
}

function factorTheoremStep(rng: Rng): AskStep {
  const r = rnz(rng, -3, 3); const p = rint(rng, 1, 5);
  const c = [-r * p, p, -r, 1];
  const q = mkq(S(K5), 'factor-theorem', {
    prompt: `Ada's press only splits cleanly by a factor. Which is a factor of P(x) = ${polyStr(c)}?`, expression: `P(x) = ${polyStr(c)}`, answer: r,
    hint: 'x − a is a factor exactly when P(a) = 0. Test each one.',
    steps: [`Factor theorem: x − a is a factor exactly when P(a) = 0.`, `P(${fmt(r)}) = ${subst(c, r)} = ${lab(0, 'remainder')}.`, `So ${xm(r)} is a factor: P(x) = ${px(r)}(x² + ${p}).`], app: APP5,
  });
  // x² + p has no real zeros, so x − a is a factor only for a = r: every other x − a below is wrong
  const wrongs = [xm(-r), xm(-r * p)]; if (p !== r) wrongs.push(xm(p));
  return choose(rng, q, xm(r), [...wrongs, xm(r * p), xm(2 * r), xm(r + 1), xm(-(r + 1))].filter((w) => w !== xm(r)));
}

function polyGraphPickStep(rng: Rng): AskStep {
  let roots: number[] = []; let neg: number[] = [];
  for (let g = 0; g < 40; g++) {
    roots = rng.shuffle([-3, -2, -1, 0, 1, 2, 3]).slice(0, 3).sort((x, y) => x - y); neg = roots.map((x) => -x).sort((x, y) => x - y);
    if (neg.join() !== roots.join()) break;
  }
  const a = pick(rng, [1, -1]);
  const shown = [...roots].sort((x, y) => (x === 0 ? -1 : y === 0 ? 1 : x - y));
  const e = `y = ${a < 0 ? '−' : ''}${shown.map((x) => px(x)).join('')}`;
  const vis = (c: number[]) => pv([-5, 5, -10, 10], { fns: [{ fn: poly(c) }] });
  const q = mkq(S(K5), 'which-cubic', {
    prompt: `Brick's cam lift is ${e}. Which graph is it?`, expression: e, answer: 0,
    hint: 'Read the zeros from the factors (sign flipped), then use the leading sign for the ends.',
    steps: [`Zeros: x = ${roots.map(fmt).join(', ')}, each crossing (multiplicity 1).`, a > 0 ? 'Leading term +x³: falls left, rises right.' : 'Leading term −x³: rises left, falls right.'], app: APP5,
  });
  return pickGraph(rng, q, [vis(expand(roots, a)), vis(expand(roots, -a)), vis(expand(neg, a)), vis(expand([roots[0], roots[0], roots[2]], a))]);
}

function boxVolumeStep(rng: Rng): AskStep {
  const Sd = pick(rng, [10, 12, 16, 20, 24]); const h = Sd / 2;
  const q = mkq(S(K5), 'transfer-box', {
    prompt: `Brick folds a box from a ${Sd} cm square sheet by cutting x cm squares from each corner: V(x) = x(${Sd} − 2x)². Where is V = 0?`,
    expression: `V(x) = x(${Sd} − 2x)²`, answer: h,
    hint: 'A product is zero when any factor is zero. Solve each factor.',
    steps: [`V = 0 when x = ${lab(0, 'no cut')} or ${lab(Sd, 'sheet side in cm')} − 2x = 0.`, `${Sd} − 2x = 0 gives x = ${lab(h, 'cut size in cm')}: a double zero, so the graph touches there.`], app: APP5,
  });
  return choose(rng, q, `x = 0 or x = ${h}`, [`x = 0 or x = ${Sd}`, `x = ${h} only`, `x = 0, ${h} or −${h}`]);
}

function tableRemainderStep(rng: Rng): AskStep {
  const c = [rint(rng, -5, 5), rint(rng, -3, 3), rint(rng, -2, 2), pick(rng, [1, -1])]; const xs = [-2, -1, 0, 1, 2]; const vals = xs.map((x) => polyAt(c, x));
  const r = pick(rng, [-2, -1, 1, 2]);
  const q = mkq(S(K5), 'transfer-remainder-log', {
    prompt: `A test rig logged a polynomial P(x) at five inputs. What remainder does P(x) ÷ (${xm(r)}) leave?`,
    expression: `P(x) ÷ (${xm(r)})`, answer: polyAt(c, r),
    hint: 'The remainder theorem turns the division into one lookup. Which input makes the divisor zero?',
    steps: [`${xm(r)} = 0 at x = ${fmt(r)}.`, `Remainder = P(${fmt(r)}) = ${lab(fmt(polyAt(c, r)), 'remainder')} from the log.`],
    visual: card('P(x) log', [xs.slice(0, 3).map((x, j) => `P(${fmt(x)}) = ${fmt(vals[j])}`).join('   '), xs.slice(3).map((x, j) => `P(${fmt(x)}) = ${fmt(vals[j + 3])}`).join('   ')]), app: APP5,
  });
  return typed(q);
}

/* =====================================================================
 * 6. Rational expressions & functions
 * ===================================================================== */
const K6 = 'rational';
const APP6 = 'Rational functions model parallel resistors, average cost per part and flow through a narrowing pipe.';
const ratStr = (num: string, den: string) => `${/[ +−]/.test(num.replace(/^−/, '')) ? `(${num})` : num}/${/[ +−]/.test(den.replace(/^−/, '')) ? `(${den})` : den}`;

function simplifyRationalStep(rng: Rng): AskStep {
  const [r, s] = twoRoots(rng, -5, 5, true);
  const num = polyStr(expand([r, s]));
  const q = mkq(S(K6), 'simplify', {
    prompt: `Volt's gain formula is (${num}) / (${xm(r)}). Simplify it.`, expression: `(${num}) / (${xm(r)})`, answer: s,
    hint: 'Factor the top, then cancel a whole common factor.',
    steps: [`Factor the top: ${num} = ${px(r)}${px(s)}.`, `Cancel the common factor ${px(r)} (x ≠ ${fmt(r)}).`, `Result: ${xm(s)}.`], app: APP6,
  });
  return choose(rng, q, xm(s), [xm(r), xm(-s), xm(-r)]);
}

function cancelTermsStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 9); let b = rint(rng, 2, 9); if (b === a) b = a === 9 ? 2 : a + 1;
  const q = mkq(S(K6), 'cancel-terms', {
    prompt: `Catalyst's flow ratio is (x + ${a})/(x + ${b}). Simplify it.`, expression: `(x + ${a})/(x + ${b})`, answer: 0,
    hint: 'You may only cancel FACTORS (things multiplied), never terms (things added).',
    steps: ['x + a and x + b are sums, not products: there is no common factor to cancel.', `Test x = 1: (1 + ${a})/(1 + ${b}) = ${fracStr(1 + a, 1 + b)}, not ${fracStr(a, b)}.`], app: APP6,
  });
  return choose(rng, q, 'Already simplest: no common factor', [fracStr(a, b), `x + ${fracStr(a, b)}`]);
}

function vaHoleStep(rng: Rng): AskStep {
  const [r, s] = twoRoots(rng, -4, 4, true); const t = rnzAvoid(rng, -4, 4, [r, s]); // s ≠ −r keeps the (−r, −s) slip apart from the swapped one
  const num = polyStr(expand([s, t])); const den = polyStr(expand([r, s]));
  const q = mkq(S(K6), 'asymptote-hole', {
    prompt: `f(x) = (${num}) / (${den}). Where are its vertical asymptote and its hole?`, expression: `f(x) = (${num}) / (${den})`, answer: r,
    hint: 'Factor top and bottom. A factor that cancels leaves a hole; one left on the bottom is an asymptote.',
    steps: [`f(x) = ${px(s)}${px(t)} / (${px(r)}${px(s)}).`, `${px(s)} cancels: a hole at x = ${fmt(s)}.`, `${px(r)} stays on the bottom: vertical asymptote x = ${fmt(r)}.`], app: APP6,
  });
  return choose(rng, q, `VA x = ${fmt(r)}; hole at x = ${fmt(s)}`, [`VA x = ${fmt(r)} and x = ${fmt(s)}; no hole`, `VA x = ${fmt(s)}; hole at x = ${fmt(r)}`, `VA x = ${fmt(-r)}; hole at x = ${fmt(-s)}`]);
}

function asymptoteCrossStep(rng: Rng): AskStep {
  const h = rint(rng, -4, 4); const k = rint(rng, -3, 3); const m = rnzAvoid(rng, -6, 6, [-k * h]);
  const num = k === 0 ? fmt(m) : lin(k, m); const den = h === 0 ? 'x' : xm(h);
  const f = ratStr(num, den);
  const q = mkq(S(K6), 'asymptotes-plot', {
    prompt: `Catalyst's flow rate is f(x) = ${f}.`, expression: `f(x) = ${f}`, answer: h, answerText: `(${fmt(h)}, ${fmt(k)})`,
    hint: 'Vertical: where the bottom is zero. Horizontal: compare degrees and leading coefficients.',
    steps: [`Bottom zero at x = ${fmt(h)}: vertical asymptote x = ${fmt(h)}.`, k === 0 ? 'Top degree 0 < bottom degree 1: horizontal asymptote y = 0.' : `Same degree top and bottom: y = ${lab(fmt(k), 'top leading coefficient')} ÷ ${lab(1, 'bottom leading coefficient')} = ${lab(fmt(k), 'horizontal asymptote')}.`, `They cross at (${fmt(h)}, ${fmt(k)}).`], app: APP6,
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `f(x) = ${f}` }, [`${h},${k}`], 'Tap the point where the two asymptotes cross.');
}

function haStep(rng: Rng): AskStep {
  const kind = pick(rng, ['lower', 'equal', 'higher'] as const);
  const dD = pick(rng, [1, 2]); const nD = kind === 'lower' ? dD - 1 : kind === 'equal' ? dD : dD + 1;
  const a = pick(rng, [1, 2, 3, 4, 5, 6]); const b = pick(rng, [1, 2, 3, 4, 5, 6]); let cn = rnz(rng, -6, 6); let cd = rnz(rng, -6, 6);
  // equal degrees: top and bottom must not be proportional, or f is a constant with a hole
  for (let g = 0; g < 60 && kind === 'equal' && a * cd === b * cn; g++) { cn = rnz(rng, -6, 6); cd = rnz(rng, -6, 6); }
  if (kind === 'equal' && a * cd === b * cn) cd = 7; // b·cn ≤ 36 is never 7a's multiple of 7 here
  const numC = new Array(nD + 1).fill(0); numC[0] = cn; if (nD > 0) numC[nD] = a;
  const denC = new Array(dD + 1).fill(0); denC[0] = cd; denC[dD] = b;
  const aLead = nD === 0 ? cn : a;
  const ns = polyStr(numC); const ds = polyStr(denC);
  const right = kind === 'lower' ? 'y = 0' : kind === 'equal' ? `y = ${fracStr(aLead, b)}` : 'No horizontal asymptote';
  const q = mkq(S(K6), 'horizontal-asymptote', {
    prompt: `Catalyst's valve flow is f(x) = ${ratStr(ns, ds)}. As x grows huge, where does it level off?`, expression: `f(x) = ${ratStr(ns, ds)}`, answer: nD - dD,
    hint: 'For huge x only the highest powers matter. Compare the degrees of top and bottom.',
    steps: [`Top degree ${nD}, bottom degree ${dD}.`, `Divide top and bottom by x${dD === 1 ? '' : sup(dD)}: every term with x left on the bottom of a fraction → 0 for huge x.`, kind === 'lower' ? 'Bottom wins: f(x) → 0, so y = 0.' : kind === 'equal' ? `Equal degrees: only the leading terms survive, ${lab(fmt(aLead), 'top leading coefficient')} ÷ ${lab(b, 'bottom leading coefficient')} = ${lab(fracStr(aLead, b), 'horizontal asymptote')}.` : 'Top wins: f(x) grows without bound, so there is no horizontal asymptote.'], app: APP6,
  });
  return choose(rng, q, right, ['y = 0', `y = ${fracStr(aLead, b)}`, 'No horizontal asymptote', `y = ${fracStr(cn, cd)}`].filter((x) => x !== right));
}

function blowupTableStep(rng: Rng): AskStep {
  const h = rint(rng, -3, 3); const offs = rng.shuffle([-4, -3, -2, -1, 1, 2, 3, 4, 6]).slice(0, 4).sort((x, y) => x - y);
  const xs = offs.map((o) => h + o); const ys = offs.map((o) => 12 / o);
  const f = `12/${h === 0 ? 'x' : `(${xm(h)})`}`;
  const q = mkq(S(K6), 'near-asymptote', {
    prompt: `Volt probes f(x) = ${f} near x = ${fmt(h)}.`, expression: `f(x) = ${f}`, answer: ys[0],
    hint: 'Work out the bottom first for each x, then divide 12 by it.',
    steps: [xs.map((x, i) => `f(${fmt(x)}) = 12 ÷ ${pn(offs[i])} = ${fmt(ys[i])}`).join('; ') + '.', `The closer x gets to ${fmt(h)}, the bigger |f(x)|: a vertical asymptote at x = ${fmt(h)}.`], app: APP6,
  });
  return model(q, { kind: 'table', rowLabels: ['x', 'f(x)'], rows: [xs, [null, null, null, null]], label: `f(x) = ${f}` }, [ys.join(',')], 'Fill in f(x) for each x.');
}

function holeYStep(rng: Rng): AskStep { return typed(holeYQ(rng)); }
function holeYQ(rng: Rng): Question {
  const [r, s] = twoRoots(rng, -5, 5);
  const num = polyStr(expand([r, s]));
  return mkq(S(K6), 'hole', {
    prompt: `f(x) = (${num}) / (${xm(r)}) has a hole at x = ${fmt(r)}. What is the y-value of the hole?`, expression: `f(${fmt(r)}) → ?`, answer: r - s,
    hint: 'Substituting now gives 0/0. Cancel the common factor first, then substitute.',
    steps: [`${px(r)}${px(s)} / ${px(r)} = ${xm(s)} for x ≠ ${fmt(r)}.`, `At x = ${fmt(r)}: ${fmt(r)} ${fmtSigned(-s)} = ${lab(fmt(r - s), 'height of the hole')}.`], app: APP6,
  });
}

function addRationalStep(rng: Rng): AskStep {
  const a = rint(rng, 1, 4); const b = rint(rng, 1, 4); const r = rint(rng, 1, 5);
  const den = `x² − ${r * r}`; const numer = lin(a + b, (a - b) * r);
  const e = `${a}/(x − ${r}) + ${b}/(x + ${r})`;
  const w3 = a !== b ? ratStr(lin(a + b, (b - a) * r), den) : ratStr(numer, `x² + ${r * r}`);
  const q = mkq(S(K6), 'add', {
    prompt: `Catalyst combines two flow rates: ${e}. Add them.`, expression: e, answer: a + b,
    hint: 'Use the common denominator (x − r)(x + r). Never add the bottoms.',
    steps: [`Common denominator: (x − ${r})(x + ${r}) = ${den}.`, `Top: ${a === 1 ? '' : a}(x + ${r}) + ${b === 1 ? '' : b}(x − ${r}) = ${numer}.`, `Sum: ${ratStr(numer, den)}.`], app: APP6,
  });
  return choose(rng, q, ratStr(numer, den), [`${a + b}/(2x)`, ratStr(String(a + b), den), w3]);
}

function parallelResistStep(rng: Rng): AskStep {
  const [p, qq, R] = pick(rng, [[6, 3, 2], [12, 4, 3], [10, 10, 5], [20, 5, 4], [12, 6, 4], [30, 15, 10], [8, 8, 4], [6, 12, 4], [4, 12, 3]]);
  if (rng.next() < 0.5) {
    const q = mkq(S(K6), 'transfer-parallel-limit', {
      prompt: `Volt wires ${p === 8 ? 'an' : 'a'} ${p} Ω resistor in parallel with a dial resistor R₂: R = ${p}R₂/(${p} + R₂). As R₂ is turned up huge, what does R approach?`, expression: `R = ${p}R₂/(${p} + R₂), R₂ → ∞`, answer: p, unit: 'Ω',
      hint: 'R is a rational function of R₂ with equal degrees on top and bottom. Divide top and bottom by R₂.',
      steps: [`Divide top and bottom by R₂: R = ${p} ÷ (${p}/R₂ + 1).`, `As R₂ grows, ${p}/R₂ → 0, so R → ${lab(p, 'fixed resistor in ohms')} ÷ 1 = ${lab(p, 'combined resistance in ohms')}: the horizontal asymptote.`, 'A huge resistor in parallel carries almost no current, so the pair acts like the fixed one alone.'], app: APP6,
    });
    return typed(q);
  }
  const q = mkq(S(K6), 'transfer-parallel-solve', {
    prompt: `Volt needs ${R} Ω from a ${p} Ω resistor and a second one in parallel: R = R₁R₂/(R₁ + R₂). What second resistor R₂ does he need?`, expression: `${R} = ${p}R₂/(${p} + R₂)`, answer: qq, unit: 'Ω',
    hint: 'Multiply both sides by the bottom to clear the fraction, then collect the R₂ terms.',
    steps: [`R = ${lab(R, 'target in ohms')}, R₁ = ${lab(p, 'first resistor in ohms')}: ${R}(${p} + R₂) = ${p}R₂, so ${R * p} + ${R}R₂ = ${p}R₂.`, `${R * p} = ${p - R === 1 ? '' : p - R}R₂, so R₂ = ${p - R === 1 ? lab(qq, 'second resistor in ohms') : `${R * p} ÷ ${p - R} = ${lab(qq, 'second resistor in ohms')}`}.`, `Check: ${p}·${qq} ÷ (${p} + ${qq}) = ${p * qq} ÷ ${p + qq} = ${lab(R, 'target in ohms')} ✓.`], app: APP6,
  });
  return typed(q);
}

function avgCostStep(rng: Rng): AskStep {
  const F = pick(rng, [200, 500, 1000, 1200]); const v = pick(rng, [3, 4, 5, 8, 12]);
  const q = mkq(S(K6), 'transfer-average-cost', {
    prompt: `Brick's workshop pays ${F} dollars to set up, then ${v} dollars per part: C(n) = (${F} + ${v}n)/n per part. As n grows, what does C(n) approach?`,
    expression: `C(n) = (${F} + ${v}n)/n`, answer: v, unit: 'dollars',
    hint: 'Split the fraction into two parts and ask what happens to each one for huge n.',
    steps: [`C(n) = ${lab(F, 'setup cost in dollars')} ÷ n + ${lab(v, 'cost per part in dollars')}.`, `As n grows, ${F} ÷ n → 0, so C(n) → ${lab(v, 'dollars per part')}: the horizontal asymptote.`], app: APP6,
  });
  return typed(q);
}

/* =====================================================================
 * 7. Radicals & rational exponents
 * ===================================================================== */
const K7 = 'radicals';
const APP7 = 'Scaling laws (area grows as V^(2/3), a pendulum period as L^(1/2)) are rational exponents.';
const ROOTSYM: Record<number, string> = { 2: '√', 3: '∛', 4: '∜', 5: '⁵√' };
const RATS: [number, number, number][] = [[4, 2, 2], [9, 2, 3], [25, 2, 5], [36, 2, 6], [49, 2, 7], [100, 2, 10], [8, 3, 2], [27, 3, 3], [64, 3, 4], [125, 3, 5], [1000, 3, 10], [16, 4, 2], [81, 4, 3], [32, 5, 2]];
function ratExpParts(rng: Rng) {
  const [base, n, root] = pick(rng, RATS);
  const ms = [2, 3, 4, 5].filter((m) => m !== n && gcd(m, n) === 1 && root ** m <= 1000);
  const m = ms.length ? pick(rng, ms) : 1;
  return { base, n, root, m, val: root ** m };
}
function ratExpTypedStep(rng: Rng): AskStep { return typed(ratExpQ(rng)); }
function ratExpQ(rng: Rng): Question {
  const { base, n, root, m, val } = ratExpParts(rng); const neg = rng.next() < 0.25;
  const e = `${base}^(${neg ? '−' : ''}${m}/${n})`;
  return mkq(S(K7), 'rational-exponent', {
    prompt: `Brick's forge scaling law needs ${e}. Evaluate it${neg ? ' (as a fraction)' : ''}.`, expression: `${e} = ?`, answer: neg ? 1 / val : val, fraction: neg, answerText: neg ? `1/${val}` : undefined,
    hint: 'The bottom of the exponent is a root, the top is a power. Root first keeps numbers small.',
    steps: [`Root first: ${ROOTSYM[n]}${base} = ${root}.`, `Then the power: ${root}${sup(m)} = ${val}.`, ...(neg ? [`Negative exponent: flip it, 1/${val}.`] : [])], app: APP7,
  });
}
function ratExpChooseStep(rng: Rng): AskStep {
  const { base, n, root, m, val } = ratExpParts(rng);
  const e = `${base}^(${m}/${n})`;
  const q = mkq(S(K7), 'rational-exponent-choose', {
    prompt: `Brick's casting scales by ${e}. Evaluate it.`, expression: e, answer: val,
    hint: 'a^(m/n) means the n-th root of a, raised to the m. It is not a × m/n.',
    steps: [`${ROOTSYM[n]}${base} = ${root}.`, `${root}${sup(m)} = ${val}.`], app: APP7,
  });
  const wrongs = [fracStr(base * m, n), fmt(root)]; if (base ** m <= 1e6) wrongs.push(fmt(base ** m));
  wrongs.push(fmt(root * m), fmt(val * root)); // fallbacks: root × m, one power too many
  return choose(rng, q, fmt(val), wrongs);
}

const fmtPow = (p: number, qd: number) => { const [a, b] = [p / gcd(p, qd), qd / gcd(p, qd)]; return b === 1 ? (a === 1 ? 'x' : `x${sup(a)}`) : `x^(${a}/${b})`; };
function radToExpStep(rng: Rng): AskStep {
  const n = pick(rng, [2, 3, 4, 5]); const ms = [1, 2, 3, 4, 5, 6, 7].filter((m) => m !== n && gcd(m, n) === 1); const m = pick(rng, ms);
  const e = m > 1 ? `${ROOTSYM[n]}(x${sup(m)})` : `${ROOTSYM[n]}x`;
  const q = mkq(S(K7), 'radical-to-exponent', {
    prompt: `Ada's formula sheet has ${e}. Write it as a power of x.`, expression: e, answer: m / n,
    hint: 'The index of the root goes in the denominator of the exponent.',
    steps: [`${ROOTSYM[n]} means the power 1/${n}.`, m > 1 ? `(x${sup(m)})^(1/${n}) = x^(${m}/${n}): multiply the exponents.` : `${ROOTSYM[n]}x = x^(1/${n}).`], app: APP7,
  });
  // m = 1 makes x^(n/m) and x^(mn) the same, so the negative-exponent slip keeps four options
  return choose(rng, q, fmtPow(m, n), [fmtPow(n, m), fmtPow(m * n, 1), fmtPow(m - n, 1), `x^(−${m}/${n})`]);
}

function simplifyRadParts(rng: Rng) { const k = rint(rng, 2, 6); const m = pick(rng, [2, 3, 5, 6, 7]); return { k, m, N: k * k * m }; }
/** Simplest radical form. Every distractor has a different value from √N (so none is a true but unfinished form). */
function simplifyRadStep(rng: Rng, key = K7): AskStep {
  const { k, m, N } = simplifyRadParts(rng);
  const q = mkq(S(key), 'simplify-root', {
    prompt: `Ada's diagonal brace is √${N} m long. Write √${N} in simplest radical form.`, expression: `√${N}`, answer: k,
    hint: 'Look for the largest perfect square that divides the number.',
    steps: [`${N} = ${lab(k * k, 'largest square factor')} × ${lab(m, 'left under the root')}.`, `√${N} = √${k * k} · √${m} = ${k}√${m}: ${lab(k, 'root of the square')} times √${m}.`, ...(k % 2 === 0 && k > 2 ? [`${k / 2}√${4 * m} is equal but not finished: ${4 * m} still has the square factor 4.`] : [])], app: APP7,
  });
  // k²√m: forgot to root the square; k·m: dropped the root on m; N/2: root read as halving; √m: lost the k
  return choose(rng, q, `${k}√${m}`, [`${k * k}√${m}`, fmt(k * m), N % 2 === 0 ? fmt(N / 2) : `√${m}`, `√${m}`]);
}
/** The same idea as a worksheet: largest square factor, its root, what stays under the root. */
function simplifyRadTableStep(rng: Rng): AskStep {
  const { k, m, N } = simplifyRadParts(rng);
  const q = mkq(S(K7), 'simplify-root-table', {
    prompt: `Ada cuts a brace √${N} m long. Split ${N} into the largest perfect square times what is left.`, expression: `√${N}`, answer: k, answerText: `${k}√${m}`,
    hint: 'Try the squares 4, 9, 16, 25, 36 from the biggest down: which one divides the number?',
    steps: [`${N} = ${lab(k * k, 'largest square factor')} × ${lab(m, 'left under the root')}; ${m} has no square factor left.`, `√${k * k} = ${lab(k, 'its square root')}, so √${N} = ${k}√${m}.`], app: APP7,
  });
  return model(q, { kind: 'table', rowLabels: ['largest square factor', 'its square root', 'left under √'], cols: ['value'], rows: [[null], [null], [null]], label: `√${N}` }, [`${k * k},${k},${m}`], 'Fill the square factor, its root, and what stays under the root.');
}

function radicalParts(rng: Rng) {
  const c1 = pick(rng, [1, 2]); const b = rint(rng, 2, 6); const a = rnz(rng, -5, 9);
  return { c1, b, a, x: (b * b - a) / c1, inside: lin(c1, a) };
}
type RadicalParts = ReturnType<typeof radicalParts>;
/** The Algebra 2 step: squaring both sides of √(inside) = b. */
function radicalSetupStep(rng: Rng, P: RadicalParts = radicalParts(rng)): AskStep {
  const { c1, b, a, inside } = P;
  const q = mkq(S(K7), 'radical-square', {
    prompt: `Brick's forge rule is √(${inside}) = ${b}. Square both sides. Which equation do you get?`, expression: `√(${inside}) = ${b}`, answer: b * b,
    hint: 'Squaring undoes the root on the left. What happens to the right side?',
    steps: [`(√(${inside}))² = ${inside}: the root is gone.`, `The right side must be squared too: ${b}² = ${b * b}.`, `${inside} = ${b * b}.`], app: APP7,
  });
  return choose(rng, q, `${inside} = ${b * b}`, [`${inside} = ${b}`, `${inside} = ${2 * b}`, `${polyStr([a * a, 0, c1 * c1])} = ${b * b}`, `${lin(c1, a * a)} = ${b * b}`]);
}
function radicalEqBalanceStep(rng: Rng, P: RadicalParts = radicalParts(rng)): AskStep {
  const { c1, b, a, x, inside } = P;
  const q = mkq(S(K7), 'radical-equation', {
    prompt: `Brick squared √(${inside}) = ${b} and got ${inside} = ${b * b}. Finish solving, then check the root.`, expression: `${inside} = ${b * b}`, answer: x,
    hint: 'Undo the rest with inverse operations: the constant first, then the coefficient.',
    steps: [`${inside} = ${b * b}.`, `x = ${fmt(x)}.`, `Check in the original: √(${fmt(c1 * x + a)}) = ${b} ✓.`], app: APP7,
  });
  return model(q, { kind: 'balance', a: c1, b: a, c: 0, d: b * b, variable: 'x' }, [String(x)], `Balance ${inside} = ${b * b} until x stands alone.`);
}
/** Square first (choose), then solve the same equation on the balance. */
const radicalPair = (rng: Rng): AskStep[] => { const P = radicalParts(rng); return [radicalSetupStep(rng, P), radicalEqBalanceStep(rng, P)]; };

function fracExpTableStep(rng: Rng): AskStep {
  const cube = rng.next() < 0.5;
  const [base, root] = cube ? pick(rng, [[8, 2], [27, 3], [64, 4]] as const) : pick(rng, [[4, 2], [9, 3], [16, 4], [25, 5]] as const);
  const ps = cube ? ['1/3', '2/3', '1', '4/3'] : ['1/2', '1', '3/2', '2'];
  const vals = [1, 2, 3, 4].map((k) => root ** k); const n = cube ? 3 : 2;
  const q = mkq(S(K7), 'exponent-ladder', {
    prompt: `Fill the ladder of powers of ${base}. Each step up the exponent multiplies by the same amount.`, expression: `${base}^p`, answer: root,
    hint: `Start with ${base}^(1/${n}): which number to the power ${n} gives ${base}?`,
    steps: [`${base}^(1/${n}) = ${ROOTSYM[n]}${base} = ${root}.`, `Each +1/${n} in the exponent multiplies by ${lab(root, 'step factor')}: ${vals.join(', ')}.`], app: APP7,
  });
  return model(q, { kind: 'table', rowLabels: ['p', `${base}^p`], rows: [ps, [null, null, null, null]], label: `powers of ${base}` }, [vals.join(',')], `Fill in ${base}^p for each p.`);
}

function extraneousStep(rng: Rng): AskStep {
  const c = rint(rng, 0, 3); const g = rint(rng, 2 - c, 5 - c); const t = 1 - 2 * c - g; const a = c * c - g * t;
  const right = lin(1, c);
  const sq = c ? `(${right})²` : 'x²';
  const q = mkq(S(K7), 'extraneous', {
    prompt: `Ada solves √(${xm(-a)}) = ${right} by squaring both sides. What are the solutions?`, expression: `√(${xm(-a)}) = ${right}`, answer: g,
    hint: 'Squaring can create fake roots. Put every answer back into the ORIGINAL equation.',
    steps: [`Square: ${xm(-a)} = ${sq}, so ${polyStr([c * c - a, 2 * c - 1, 1])} = 0.`, `Roots: x = ${fmt(g)} or x = ${fmt(t)}.`, `Check x = ${fmt(t)}: √${t + a} = ${Math.sqrt(t + a)}, but the right side is ${fmt(t + c)}: fake (extraneous).`, `Check x = ${fmt(g)}: both sides are ${fmt(g + c)} ✓. Only x = ${fmt(g)}.`], app: APP7,
  });
  return choose(rng, q, `x = ${fmt(g)} only`, [`x = ${fmt(g)} or x = ${fmt(t)}`, `x = ${fmt(t)} only`, 'No solution']);
}

function tankFaceStep(rng: Rng): AskStep {
  const s = rint(rng, 2, 10); const V = s ** 3;
  const q = mkq(S(K7), 'transfer-tank', {
    prompt: `Ada's cube tank holds ${V} m³. One face has area V^(2/3). Find the face area.`, expression: `${V}^(2/3)`, answer: s * s, unit: 'm²',
    hint: 'The cube root of the volume is the side. Then square it.',
    steps: [`V^(1/3) = ∛${lab(V, 'volume in m³')} = ${lab(s, 'side in m')}.`, `V^(2/3) = side × side = ${lab(s, 'side in m')} × ${lab(s, 'side in m')} = ${lab(s * s, 'face area in m²')}.`], app: APP7,
  });
  return typed(q);
}

function pendulumStep(rng: Rng): AskStep {
  const L = pick(rng, [1, 4, 9, 16, 25, 0.25, 2.25]); const T = 2 * Math.sqrt(L);
  const q = mkq(S(K7), 'transfer-pendulum', {
    prompt: `Newton's rule of thumb: a pendulum L metres long has period T ≈ 2L^(1/2) seconds. Find T for L = ${fmt(L)} m.`, expression: `T = 2 × ${fmt(L)}^(1/2)`, answer: T, unit: 's',
    hint: 'A power of 1/2 is a square root. Root first, then double.',
    steps: [`${fmt(L)}^(1/2) = √${lab(fmt(L), 'length in m')} = ${lab(fmt(Math.sqrt(L)), 'root of the length')}.`, `T = ${lab(2, 'rule of thumb factor')} × ${fmt(Math.sqrt(L))} = ${lab(fmt(T), 'period in s')}.`], app: APP7,
  });
  return typed(q);
}

/* =====================================================================
 * 8. Exponential functions
 * ===================================================================== */
const K8 = 'exponential';
const APP8 = 'Bacteria, interest, radioactive decay and capacitor discharge all multiply by a fixed factor per step.';
const expLabel = (a: number, b: string, v = 'x') => `${a === 1 ? '' : `${a} · `}${b}${v === 'x' ? 'ˣ' : 'ᵗ'}`;

function growthTableStep(rng: Rng): AskStep {
  const decay = rng.next() < 0.35;
  const a = decay ? pick(rng, [16, 32, 64, 48, 80]) : pick(rng, [1, 2, 3, 5]); const b = decay ? 0.5 : pick(rng, [2, 3]);
  const vals = [0, 1, 2, 3].map((x) => a * b ** x);
  const f = `y = ${expLabel(a, decay ? '(1/2)' : String(b))}`;
  const q = mkq(S(K8), 'growth-table', {
    prompt: `Catalyst's ${decay ? 'isotope sample' : 'culture'} follows ${f}. Fill in y for each hour x.`, expression: f, answer: a,
    hint: 'Any base to the power 0 is 1. Then multiply by the base each step; do not add.',
    steps: [`x = 0: ${decay ? '(1/2)' : b}⁰ = 1, so y = ${lab(a, 'starting amount')}.`, `Each hour multiply by ${lab(decay ? '1/2' : b, decay ? 'decay factor per hour' : 'growth factor per hour')}: ${vals.join(', ')}.`], app: APP8,
  });
  return model(q, { kind: 'table', rowLabels: ['x', 'y'], rows: [[0, 1, 2, 3], [null, null, null, null]], label: f }, [vals.join(',')], 'Fill in y for x = 0, 1, 2 and 3 (hours).');
}

const CHANGE = ['Linear: adds the same amount', 'Exponential: multiplies by the same factor', 'Neither'];
function linOrExpStep(rng: Rng): AskStep {
  const kind = pick(rng, [0, 1, 2]);
  let ys: number[];
  if (kind === 0) { const d = rint(rng, 2, 6); const y0 = rng.next() < 0.4 ? d : rint(rng, 1, 6); ys = [0, 1, 2, 3].map((x) => y0 + d * x); }
  else if (kind === 1) { const y0 = rint(rng, 1, 4); const r = pick(rng, [2, 3]); ys = [0, 1, 2, 3].map((x) => y0 * r ** x); }
  else { const c = rint(rng, 1, 4); ys = [0, 1, 2, 3].map((x) => x * x + c); }
  const diffs = ys.slice(1).map((y, i) => y - ys[i]); const ratios = ys.slice(1).map((y, i) => fracStr(y, ys[i]));
  const q = mkq(S(K8), 'linear-or-exponential', {
    prompt: `Volt logs a reading each second: ${ys.join(', ')}. What kind of change is it?`, expression: ys.join(', '), answer: kind,
    hint: 'Check the differences AND the ratios between neighbours.',
    steps: [`Differences: ${diffs.join(', ')}.`, `Ratios: ${ratios.join(', ')}.`, kind === 0 ? 'Same difference: linear.' : kind === 1 ? 'Same ratio: exponential.' : 'Neither the differences nor the ratios are constant.'], app: APP8,
  });
  return choose(rng, q, CHANGE[kind], CHANGE.filter((_, i) => i !== kind));
}

function growthFactorStep(rng: Rng): AskStep {
  const grow = rng.next() < 0.5; const p = pick(rng, [3, 4, 5, 6, 8, 12, 15, 20, 25]);
  const right = fmt(grow ? 1 + p / 100 : 1 - p / 100);
  const q = mkq(S(K8), 'growth-factor', {
    prompt: grow ? `A reactor's output grows ${p}% per year. By what factor is it multiplied each year?` : `A battery loses ${p}% of its charge each hour. By what factor is the charge multiplied each hour?`,
    expression: grow ? `+${p}% per year` : `−${p}% per hour`, answer: grow ? 1 + p / 100 : 1 - p / 100,
    hint: 'Start from the whole, 100% = 1, then add or remove the percent.',
    steps: [grow ? `${lab('100%', 'whole output')} + ${lab(`${p}%`, 'growth per year')} = ${lab(`${100 + p}%`, 'new output')} = ${lab(right, 'growth factor per year')}.` : `${lab('100%', 'full charge')} − ${lab(`${p}%`, 'loss per hour')} = ${lab(`${100 - p}%`, 'charge kept')} = ${lab(right, 'decay factor per hour')}.`], app: APP8,
  });
  return choose(rng, q, right, [fmt(p / 100), fmt(grow ? 1 - p / 100 : 1 + p / 100), p < 10 ? `1.${p}` : fmt(p)]);
}

function compoundTypedStep(rng: Rng): AskStep { return typed(compoundQ(rng)); }
/** Exact decimal of a short terminating product like 1.05⁴ = 1.21550625 (fmt would round to 4 places). */
const exactDec = (x: number) => String(Number(x.toFixed(10)));
function compoundQ(rng: Rng): Question {
  const P = pick(rng, [1000, 2000, 500, 5000]);
  // [rate, periods a year, years]: long powers come with their value, so the item tests the set-up, not keypad stamina
  const [r, n, t] = pick(rng, [[0.1, 1, 2], [0.1, 1, 3], [0.2, 1, 2], [0.2, 1, 3], [0.05, 1, 2], [0.1, 2, 1], [0.1, 2, 2], [0.08, 4, 1]] as const);
  const f = 1 + r / n; const A = P * f ** (n * t); const ans = round2(A);
  const given = n * t >= 4 ? ` (${fmt(f)}${sup(n * t)} = ${exactDec(f ** (n * t))})` : '';
  return mkq(S(K8), 'compound', {
    prompt: `The guild bank pays ${fmt(r * 100)}% a year, compounded ${n === 1 ? 'yearly' : n === 2 ? 'twice a year' : 'quarterly'}. ${P} dollars sits for ${t} year${t === 1 ? '' : 's'}. Find the balance to the nearest cent.${given}`,
    expression: 'A = P(1 + r/n)^(nt)', answer: ans, tolerance: 0.01, decimal: true, unit: 'dollars',
    hint: 'Each period multiplies by 1 + r/n. Count the periods: n per year for t years.',
    steps: [n === 1 ? `Each year multiplies by 1 + ${lab(fmt(r), 'yearly rate')} = ${lab(fmt(f), 'growth factor per year')}, for ${labn(t, 'year')}.` : `Each period multiplies by 1 + ${lab(fmt(r), 'yearly rate')} ÷ ${lab(n, 'periods per year')} = ${lab(fmt(f), 'growth factor per period')}; periods: ${n} × ${labn(t, 'year')} = ${lab(n * t, 'periods')}.`, `A = ${lab(P, 'starting amount in dollars')} × ${fmt(f)}${sup(n * t)} = ${lab(fmt(ans), 'balance in dollars')}.`], app: APP8,
  });
}

function simpleVsCompoundStep(rng: Rng): AskStep {
  const P = pick(rng, [1000, 2000, 500]); const r = pick(rng, [0.1, 0.2]);
  const comp = round2(P * (1 + r) ** 3); const simple = round2(P * (1 + 3 * r)); const interest = round2(P * r * 3); const tri = round2(P * (1 + r) * 3);
  const q = mkq(S(K8), 'simple-vs-compound', {
    prompt: `${P} dollars grows ${fmt(r * 100)}% a year, compounded yearly, for 3 years. What is the balance?`, expression: `${P} dollars, ${fmt(r * 100)}% a year, 3 years`, answer: comp,
    hint: 'Each year the percent is taken of the NEW balance, not the starting one.',
    steps: [`Each year multiplies by ${lab(fmt(1 + r), 'growth factor per year')}, for ${lab(3, 'years')}: ${lab(P, 'starting amount in dollars')} × ${fmt(1 + r)}³.`, `= ${lab(fmt(comp), 'balance in dollars')}. Not ${fmt(simple)}: interest also earns interest.`], app: APP8,
  });
  return choose(rng, q, fmt(comp), [fmt(simple), fmt(interest), fmt(tri)]);
}

function halfLifeStep(rng: Rng): AskStep { return typed(halfLifeQ(rng)); }
function halfLifeQ(rng: Rng): Question {
  const N0 = pick(rng, [800, 640, 1600, 960, 320]); const H = pick(rng, [2, 3, 5, 8, 10]); const k = rint(rng, 1, 4); const t = k * H; const ans = N0 / 2 ** k;
  return mkq(S(K8), 'half-life', {
    prompt: `Catalyst's isotope has a half-life of ${H} years. A ${N0} g sample sits for ${t} years. How many grams remain?`, expression: `${N0} g, half-life ${H} y, ${t} y later`, answer: ans, unit: 'g',
    hint: 'Count the half-lives first. Each one halves what is left; it does not remove a fixed amount.',
    steps: [`${lab(t, 'years waited')} ÷ ${lab(H, 'half-life in years')} = ${labn(k, 'half-life', 'half-lives')}.`, `${lab(N0, 'starting mass in g')} × (1/2)${sup(k)} = ${lab(fmt(ans), 'grams left')}.`], app: APP8,
  });
}

function doublingSliderStep(rng: Rng): AskStep {
  const a = pick(rng, [1, 2, 3]); const b = pick(rng, [2, 3]); const T = rint(rng, 2, b === 2 ? 5 : 3); const target = a * b ** T;
  const range: R4 = [0, 6, 0, Math.ceil(target * 1.3)];
  const f = `N = ${expLabel(a, String(b), 't')}`;
  const q = mkq(S(K8), 'reach-target', {
    prompt: `A culture follows ${f}, with t in hours. When does N reach ${target}?`, expression: `${f} = ${target}`, answer: T, unit: 'h',
    hint: `${a === 1 ? 'Start at 1' : `Start at ${a}`} and keep multiplying by ${b} until you reach ${target}. Count the multiplications.`,
    steps: [`Multiply by ${lab(b, 'growth factor per hour')} each hour: ${a === 1 ? '' : `${lab(a, 'starting count')} × `}${b}${sup(T)} = ${lab(target, 'target count')}.`, `So t = ${lab(T, 'hours')}.`], app: APP8,
  });
  return model(q, { kind: 'slider', min: 0, max: 6, step: 1, label: 'Slide to the hour when the curve meets the line', unit: 'h', range, layers: { fns: [{ fn: { kind: 'exp', a, base: b } }], hlines: [{ y: target, label: `N = ${target}` }] } }, [String(T)], `Slide t until N = ${lab(target, 'target count')}.`);
}

function eLimitStep(rng: Rng): AskStep {
  const variant = rng.next() < 0.5;
  if (variant) {
    const q = mkq(S(K8), 'number-e', {
      prompt: 'Vector compounds more and more often: (1 + 1/n)ⁿ for n = 1, 10, 100, 1000… Where does it head?', expression: '(1 + 1/n)ⁿ as n grows', answer: Math.E,
      hint: 'Look at the table: the values keep rising, but by less and less.',
      steps: ['1 + 1/n → 1, but the power n grows too: the two effects balance.', 'The values 2, 2.5937, 2.7048, 2.7169… settle at e ≈ 2.718.'],
      visual: card('(1 + 1/n)ⁿ', ['n = 1: 2', 'n = 10: 2.5937', 'n = 100: 2.7048', 'n = 1000: 2.7169']), app: APP8,
    });
    return choose(rng, q, 'About 2.718: the number e', ['Exactly 1, because 1 + 1/n → 1', 'It grows without limit', 'Exactly 2']);
  }
  const q = mkq(S(K8), 'number-e', {
    prompt: 'Which formula gives a balance P growing at rate r, compounded continuously for t years?', expression: 'continuous growth', answer: Math.E,
    hint: 'Compounding infinitely often turns (1 + r/n)^(nt) into a power of e.',
    steps: ['(1 + r/n)^(nt) → e^(rt) as n → ∞.', 'So A = Pe^(rt).'], app: APP8,
  });
  return choose(rng, q, 'A = Pe^(rt)', ['A = P(1 + r)ᵗ', 'A = P(1 + rt)', 'A = P·r·eᵗ']);
}

function continuousStep(rng: Rng): AskStep {
  const P = pick(rng, [1000, 2000, 5000]); const r = pick(rng, [0.05, 0.04, 0.06, 0.1]); const t = pick(rng, [5, 10]);
  const cont = round2(P * Math.exp(r * t)); const yearly = round2(P * (1 + r) ** t); const simple = round2(P * (1 + r * t));
  const q = mkq(S(K8), 'continuous', {
    prompt: `${P} dollars grows at ${fmt(r * 100)}% compounded continuously for ${t} years (A = Pe^(rt)). Which balance is right?`, expression: `A = ${P}e^(${fmt(r)} × ${t})`, answer: cont,
    hint: 'Continuous compounding beats yearly compounding, but only slightly.',
    steps: [`rt = ${lab(fmt(r), 'yearly rate')} × ${labn(t, 'year')} = ${fmt(r * t)}, so A = ${lab(P, 'starting amount in dollars')} · e^${fmt(r * t)}.`, `e^${fmt(r * t)} ≈ ${fmt(Math.exp(r * t))}, so A ≈ ${lab(fmt(cont), 'balance in dollars')}.`, `Yearly compounding gives less, ${lab(fmt(yearly), 'dollars')}; simple interest less still, ${lab(fmt(simple), 'dollars')}.`], app: APP8,
  });
  return choose(rng, q, fmt(cont), [fmt(yearly), fmt(simple)]);
}

function expPlotStep(rng: Rng): AskStep {
  const decay = rng.next() < 0.3;
  const a = decay ? pick(rng, [4, 8]) : pick(rng, [1, 2, 3]); const b = decay ? 0.5 : pick(rng, [2, 3]); const y1 = a * b;
  const f = `y = ${expLabel(a, decay ? '(1/2)' : String(b))}`;
  const q = mkq(S(K8), 'exp-plot', {
    prompt: `Catalyst's ${decay ? 'isotope' : 'culture'} follows ${f}. Plot it.`, expression: f, answer: a, answerText: `(0, ${a}) and (1, ${fmt(y1)})`,
    hint: 'Substitute x = 0 and x = 1. Anything to the power 0 is 1.',
    steps: [`x = 0: ${decay ? '(1/2)' : b}⁰ = 1, so y = ${lab(a, 'starting amount')}. The y-intercept is a, not b.`, `x = 1: y = ${lab(a, 'starting amount')} × ${lab(decay ? '1/2' : b, decay ? 'decay factor' : 'growth factor')} = ${lab(fmt(y1), 'amount one step later')}.`], app: APP8,
  });
  return model(q, { kind: 'plot', range: [-4, 4, -1, 10], count: 2, label: f }, undefined, 'Tap the y-intercept and the point at x = 1.', { rule: { kind: 'set', items: [`0,${a}`, `1,${y1}`] } });
}

function scrubberStep(rng: Rng): AskStep {
  const D = pick(rng, [200, 400, 800]); const p = pick(rng, [0.25, 0.5, 0.1]); const t = pick(rng, [2, 3]);
  const ans = Math.round(D * (1 - p) ** t * 1e6) / 1e6; // exact: 200 × 0.75³ = 84.375
  const q = mkq(S(K8), 'transfer-scrubber', {
    prompt: `Catalyst's scrubber tank holds ${D} g of toxic gas. Each hour it removes ${fmt(p * 100)}% of what is left. How many grams remain after ${t} hours?`, expression: `${D} g, ${t} h later`, answer: ans, tolerance: 0.005, unit: 'g',
    hint: 'Removing a percent each hour means keeping the rest: multiply, hour by hour.',
    steps: [`${lab('100%', 'all the gas')} − ${lab(`${fmt(p * 100)}%`, 'removed per hour')} = ${lab(`${fmt(100 - p * 100)}%`, 'kept per hour')} = ${lab(fmt(1 - p), 'decay factor per hour')}.`, `After ${labn(t, 'hour')}: ${lab(D, 'starting gas in g')} × ${fmt(1 - p)}${sup(t)} = ${lab(fmt(ans), 'grams left')}.`, 'Not a fixed amount each hour: the percent is of what is left.'], app: APP8,
  });
  return typed(q);
}

function compoundTableStep(rng: Rng): AskStep {
  const P = pick(rng, [1000, 2000, 500]); const r = pick(rng, [0.1, 0.2]); const f = 1 + r;
  const bal = [1, 2, 3].map((y) => round2(P * f ** y));
  const q = mkq(S(K8), 'compound-table', {
    prompt: `Vector's guild account starts at ${P} dollars and earns ${fmt(r * 100)}% a year, compounded yearly. Fill the balance year by year.`, expression: `${P} × ${fmt(f)} each year`, answer: bal[2],
    hint: 'Each year the interest is a percent of the NEW balance. Multiply the last balance by the growth factor.',
    steps: [`Growth factor 1 + ${lab(fmt(r), 'yearly rate')} = ${lab(fmt(f), 'growth factor per year')}.`, `${lab(P, 'starting balance in dollars')} → ${bal.map(fmt).join(' → ')}.`, `Simple interest would add ${lab(fmt(P * r), 'dollars a year')} instead: ${lab(fmt(P + 3 * P * r), 'dollars after three years')}.`], app: APP8,
  });
  return model(q, { kind: 'table', rowLabels: ['year', 'balance'], rows: [[0, 1, 2, 3], [P, null, null, null]], label: `${lab(`${fmt(r * 100)}%`, 'interest rate')} a year` }, [bal.join(',')], 'Fill the balance after 1 (year), 2 (years) and 3 (years).');
}

function sensorNetStep(rng: Rng): AskStep {
  const N0 = pick(rng, [25, 50, 100]); const d = pick(rng, [3, 6]); const months = pick(rng, [12, 18]); const k = months / d; const ans = N0 * 2 ** k;
  const q = mkq(S(K8), 'transfer-network', {
    prompt: `Volt's sensor network starts with ${N0} nodes and doubles every ${d} months. How many nodes after ${months} months?`, expression: `${N0} nodes, ${months} months later`, answer: ans,
    hint: 'Count how many doublings fit in the time, then double that many times.',
    steps: [`${lab(months, 'months')} ÷ ${lab(d, 'months per doubling')} = ${lab(k, 'doublings')}.`, `${lab(N0, 'starting nodes')} × 2${sup(k)} = ${N0} × ${2 ** k} = ${lab(ans, 'nodes')}.`], app: APP8,
  });
  return typed(q);
}

/* =====================================================================
 * 9. Logarithms
 * ===================================================================== */
const K9 = 'logarithms';
const APP9 = 'Decibels, pH, the Richter scale and data-rate plots are logarithmic: they count powers of ten.';
const LOG = (b: number) => `log${sub(b)}`;

function logPowerStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 3, 5, 10]); const e = rint(rng, 2, b === 2 ? 6 : b === 3 ? 5 : 4); const N = b ** e;
  const q = mkq(S(K9), 'log-as-exponent', {
    prompt: `The gauge reads ${LOG(b)} ${N}. A log asks: ${b} to what power gives ${N}?`, expression: `${LOG(b)} ${N} = ?`, answer: e,
    hint: `Keep multiplying ${b}s until you reach ${N}. The log is how many you used.`,
    steps: [`${LOG(b)} ${N} asks: ${b} to what power is ${N}?`, `${b}${sup(e)} = ${N}, so ${LOG(b)} ${N} = ${lab(e, 'exponent')}.`], app: APP9,
  });
  return model(q, { kind: 'power', bases: [2, 3, 5, 10], exps: [1, 2, 3, 4, 5, 6] }, [`${b}^${e}`], `Build ${N} as a power of ${b}.`);
}

function logTypedStep(rng: Rng): AskStep { return typed(logQ(rng)); }
function logQ(rng: Rng): Question {
  const kind = pick(rng, ['pos', 'neg', 'root', 'one', 'ln'] as const); const b = pick(rng, [2, 3, 4, 5, 10]);
  if (kind === 'ln') {
    const k = rint(rng, 2, 6);
    return mkq(S(K9), 'evaluate-ln', {
      prompt: `Catalyst's growth meter reads ln e${sup(k)}. ln is the natural log, log base e. Evaluate it.`, expression: `ln e${sup(k)} = ?`, answer: k,
      hint: 'ln asks: e to what power gives this? The input is already written as a power of e.',
      steps: [`ln x = logₑ x.`, `e${sup(k)} is e to the power ${k}, so ln e${sup(k)} = ${lab(k, 'exponent')}.`], app: APP9,
    });
  }
  if (kind === 'pos' || kind === 'neg') {
    const e = rint(rng, 2, b >= 5 ? 3 : 4); const N = b ** e; const arg = kind === 'pos' ? String(N) : `(1/${N})`;
    return mkq(S(K9), 'evaluate-log', {
      prompt: `Vector's gauge reads ${LOG(b)} ${arg}. Evaluate it.`, expression: `${LOG(b)} ${arg} = ?`, answer: kind === 'pos' ? e : -e,
      hint: `Write the input as a power of ${b}. A fraction 1/${b}ᵏ is ${b} to a negative power.`,
      steps: kind === 'pos' ? [`${b}${sup(e)} = ${N}.`, `So ${LOG(b)} ${N} = ${lab(e, 'exponent')}.`] : [`1/${N} = 1/${b}${sup(e)} = ${b}${sup(-e)}.`, `So ${LOG(b)}(1/${N}) = ${lab(`−${e}`, 'exponent')}.`], app: APP9,
    });
  }
  if (kind === 'root') {
    const r = pick(rng, [2, 3, 4, 5]); const cube = r <= 3 && rng.next() < 0.4; const B = cube ? r ** 3 : r * r; const n = cube ? 3 : 2;
    return mkq(S(K9), 'evaluate-log', {
      prompt: `Vector's gauge reads ${LOG(B)} ${r}. Evaluate it as a fraction.`, expression: `${LOG(B)} ${r} = ?`, answer: 1 / n, fraction: true, answerText: `1/${n}`,
      hint: `${r} is a root of ${B}. Roots are fractional powers.`,
      steps: [`${r} = ${ROOTSYM[n]}${B} = ${B}^(1/${n}).`, `So ${LOG(B)} ${r} = ${lab(`1/${n}`, 'exponent')}.`], app: APP9,
    });
  }
  return mkq(S(K9), 'evaluate-log', {
    prompt: `Vector's gauge reads ${LOG(b)} 1. Evaluate it.`, expression: `${LOG(b)} 1 = ?`, answer: 0,
    hint: `Which power of ${b} gives 1?`,
    steps: [`${b}⁰ = 1.`, `So ${LOG(b)} 1 = ${lab(0, 'exponent')}, for every base.`], app: APP9,
  });
}

function logProductStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 3, 10]); const kind = pick(rng, ['prod', 'quot', 'pow'] as const); const top = b === 10 ? 2 : 3;
  let p = rint(rng, 1, top); let qq = rint(rng, 1, top);
  // b = 2, p = q = 1 makes the log(M ± N) slip land on the right value (2 + 2 = 2·2, 4 − 2 = 4 ÷ 2); p = q = 2 makes p·q = p + q
  // quot: hi ÷ lo = hi − lo (hi = 4, lo = 2) makes log M ÷ log N = 4 ÷ 2 = 4 − 2, the right value
  const clash = () => (kind !== 'pow' && b === 2 && p === 1 && qq === 1) || (kind === 'prod' && p === 2 && qq === 2) || (kind === 'quot' && (Math.max(p, qq) + 1) / Math.min(p, qq) === Math.max(p, qq) + 1 - Math.min(p, qq));
  for (let g = 0; g < 60 && clash(); g++) { p = rint(rng, 1, top); qq = rint(rng, 1, top); }
  if (clash()) { p = 1; qq = 2; }
  const M = b ** p; const N = b ** qq;
  let expr = ''; let right = ''; let value = 0; let wrongs: string[] = []; let steps: string[] = []; let ask = 'Which single log is it?';
  if (kind === 'prod') {
    // every option is a single log (or a product of logs), so the log(M + N) slip cannot be spotted by its format
    expr = `${LOG(b)} ${M} + ${LOG(b)} ${N}`; right = `${LOG(b)} ${M * N}`; value = p + qq;
    wrongs = [`${LOG(b)} ${M + N}`, `${LOG(b)} ${M} × ${LOG(b)} ${N}`, `${LOG(b)} ${b ** (p * qq)}`];
    steps = [`log M + log N = log(MN): ${LOG(b)}(${M} × ${N}) = ${LOG(b)} ${M * N}.`, `Why: ${M} = ${b}${sup(p)} and ${N} = ${b}${sup(qq)}, so ${M} × ${N} = ${b}${sup(p + qq)}: the exponents add, ${p} + ${qq} = ${p + qq}.`, `Not ${LOG(b)} ${M + N}: logs do not split a sum.`];
  } else if (kind === 'quot') {
    const hi = Math.max(p, qq) + 1; const lo = Math.min(p, qq); const Mh = b ** hi; const Nl = b ** lo;
    expr = `${LOG(b)} ${Mh} − ${LOG(b)} ${Nl}`; right = `${LOG(b)} ${Mh / Nl}`; value = hi - lo;
    wrongs = [`${LOG(b)} ${Mh - Nl}`, `${LOG(b)} ${Mh} ÷ ${LOG(b)} ${Nl}`, `${LOG(b)} ${Mh * Nl}`];
    steps = [`log M − log N = log(M/N): ${LOG(b)}(${Mh} ÷ ${Nl}) = ${LOG(b)} ${Mh / Nl}.`, `Check: ${hi} − ${lo} = ${hi - lo}, and ${b}${sup(hi - lo)} = ${Mh / Nl} ✓.`, `Not ${LOG(b)} ${Mh - Nl}: logs do not split a difference, and log M ÷ log N is not log(M/N).`];
  } else {
    const k = p === 2 ? pick(rng, [3, 4]) : rint(rng, 2, 4); // p = k = 2 would make pᵏ, p + k and kp all 4
    expr = `${LOG(b)}(${M}${sup(k)})`; right = fmt(k * p); value = k * p; ask = 'What is it?';
    wrongs = [fmt(p ** k), fmt(p + k), fmt(M ** k), ...nearMisses(rng, k * p, 2, 3)];
    steps = [`log(Mᵏ) = k · log M: ${k} × ${LOG(b)} ${M}.`, `${LOG(b)} ${M} = ${p}, so it is ${k} × ${p} = ${k * p}.`];
  }
  const q = mkq(S(K9), 'log-rules', {
    prompt: `Catalyst combines log readings: ${expr}. ${ask}`, expression: expr, answer: value,
    hint: kind === 'pow' ? 'Use a log rule to bring the power down, then evaluate the log.' : 'Which rule turns a sum or difference of logs into ONE log?', steps, app: APP9,
  });
  return choose(rng, q, right, wrongs);
}

function expToLogStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 3, 5]); const N = pick(rng, [6, 7, 10, 11, 12, 15, 20, 50].filter((n) => ![4, 8, 16, 32, 9, 27, 25].includes(n)));
  const approx = Math.log(N) / Math.log(b);
  const q = mkq(S(K9), 'exp-to-log', {
    prompt: `Solve ${b}ˣ = ${N} for x, exactly.`, expression: `${b}ˣ = ${N}`, answer: round2(approx),
    hint: 'A log IS the exponent: bˣ = N and x = log_b N say the same thing.',
    steps: [`${b}ˣ = ${N} means x = ${LOG(b)} ${N}.`, `≈ ${fmt(round2(approx))}: between ${Math.floor(approx)} and ${Math.ceil(approx)}, since ${b}${sup(Math.floor(approx))} < ${N} < ${b}${sup(Math.ceil(approx))}.`], app: APP9,
  });
  return choose(rng, q, `x = ${LOG(b)} ${N}`, [`x = ${LOG(N)} ${b}`, `x = ${N} ÷ ${b}`, `x = log ${N} − log ${b}`]);
}

const EXP_PAIRS = [{ b: 2, u: 2, v: 3 }, { b: 2, u: 1, v: 2 }, { b: 2, u: 1, v: 3 }, { b: 3, u: 1, v: 2 }, { b: 2, u: 3, v: 2 }, { b: 3, u: 2, v: 1 }, { b: 2, u: 2, v: 1 }];
const expPart = (B: number, p: number) => (p === 0 ? `${B}ˣ` : `${B}^(${xm(-p)})`);
function expParts(rng: Rng) {
  const { b, u, v } = pick(rng, EXP_PAIRS); const B1 = b ** u; const B2 = b ** v;
  let x0 = 0; let p = 0; let qq = 0;
  for (let g = 0; g < 200; g++) {
    x0 = rint(rng, -3, 5); p = rint(rng, -3, 3);
    if ((u * (x0 + p)) % v !== 0) continue;
    qq = (u * (x0 + p)) / v - x0;
    // p = qq forces x0 = −p (u ≠ v): both sides are b⁰, and v(x + p) = u(x + p) is the answer with its sides swapped
    if (Math.abs(qq) <= 5 && p !== qq) break;
  }
  if ((u * (x0 + p)) % v !== 0 || Math.abs(qq) > 5 || p === qq) { x0 = 1; p = 0; qq = u / v - 1; if (!Number.isInteger(qq)) { p = v - 1; qq = (u * (1 + p)) / v - 1; } }
  return { b, u, v, B1, B2, p, qq, x0, e: `${expPart(B1, p)} = ${expPart(B2, qq)}`, eq: `${lin(u, u * p)} = ${lin(v, v * qq)}` };
}
type ExpParts = ReturnType<typeof expParts>;
/** The exponent after a power of a power: u(x + p), written without '1(' or '(x)'. */
const expOf = (u: number, p: number) => (u === 1 ? xm(-p) : p === 0 ? `${u}x` : `${u}(${xm(-p)})`);
/** The Algebra 2 step: rewrite as powers of one base and equate the exponents. */
function expSetupStep(rng: Rng, P: ExpParts = expParts(rng)): AskStep {
  const { b, u, v, B1, B2, p, qq, e, eq } = P;
  const q = mkq(S(K9), 'exponent-equation', {
    prompt: `Catalyst's reactor balance is ${e}. Write both sides as powers of ${b}. Which equation do the exponents give?`, expression: e, answer: P.x0,
    hint: `${B1} and ${B2} are both powers of ${b}. A power of a power multiplies the exponents: the WHOLE exponent.`,
    steps: [`${B1} = ${b}${sup(u)} and ${B2} = ${b}${sup(v)}.`, [[B1, u, p], [B2, v, qq]].filter(([, w]) => w !== 1).map(([B, w, s0]) => `${expPart(B, s0)} = ${b}^(${expOf(w, s0)})`).join(' and ') + ': a power of a power multiplies the exponents.', `Equal powers of ${b} have equal exponents: ${eq}.`], app: APP9,
  });
  // Each slip is a·x + b = c·x + d. Any slip with the answer's solution x0 is an equivalent equation (the answer with
  // its sides swapped when p = qq, which expParts rules out), so it is dropped. Order: likeliest slips first, then fallbacks.
  const slipCs: [number, number, number, number][] = [
    [u, p, v, qq], // multiplied only the x, not the whole exponent
    [v, v * p, u, u * qq], // each base given the other's power
    [1, p, 1, qq], // ignored the powers
    [u, u * p, v, qq], [u, p, v, v * qq], // distributed on one side only
    [v, p, u, qq], // swapped powers, not distributed
    [u, u * p, v, -v * qq], [u, -u * p, v, v * qq], // sign of a shift flipped
  ];
  const slips = slipCs.filter(([a1, b1, c1, d1]) => a1 === c1 || (d1 - b1) / (a1 - c1) !== P.x0).map(([a1, b1, c1, d1]) => `${lin(a1, b1)} = ${lin(c1, d1)}`);
  return choose(rng, q, eq, slips);
}
function solveExpBalanceStep(rng: Rng, P: ExpParts = expParts(rng)): AskStep {
  const { u, v, p, qq, x0, e, eq } = P;
  const q = mkq(S(K9), 'solve-exponential', {
    prompt: `Catalyst turned ${e} into ${eq}. Solve it on the balance.`, expression: eq, answer: x0,
    hint: 'Get the x terms on one side and the numbers on the other.',
    steps: [`${eq}.`, `x = ${fmt(x0)}.`, `Check: both sides of ${e} give the same power at x = ${fmt(x0)}.`], app: APP9,
  });
  return model(q, { kind: 'balance', a: u, b: u * p, c: v, d: v * qq, variable: 'x', label: eq }, [String(x0)], 'Balance the exponents until x stands alone.');
}
/** Equate the exponents (choose), then solve the same equation on the balance. */
const expPair = (rng: Rng): AskStep[] => { const P = expParts(rng); return [expSetupStep(rng, P), solveExpBalanceStep(rng, P)]; };

function changeBaseStep(rng: Rng): AskStep { return typed(changeBaseQ(rng)); }
function changeBaseQ(rng: Rng): Question {
  if (rng.next() < 0.3) {
    const b = pick(rng, [3, 5, 7]); const N = pick(rng, [20, 30, 50, 100]); const v = Math.log(N) / Math.log(b); const ans = round2(v);
    const lN = fmt(Math.log10(N)); const lb = fmt(Math.log10(b));
    return mkq(S(K9), 'change-of-base', {
      prompt: `Volt's meter reads in base ${b}. Find ${LOG(b)} ${N} to 2 decimal places. (log ${N} ≈ ${lN}, log ${b} ≈ ${lb})`, expression: `${LOG(b)} ${N} ≈ ?`, answer: ans, tolerance: 0.01, decimal: true,
      hint: 'Change of base: any base works as long as top and bottom use the same one. Which log goes on top?',
      steps: [`${LOG(b)} ${N} = log ${N} ÷ log ${b}.`, `= ${lab(lN, 'log of the number')} ÷ ${lab(lb, 'log of the base')} ≈ ${fmt(ans)}.`], app: APP9,
    });
  }
  let g = 2; let p = 2; let qq = 3;
  for (let t = 0; t < 60; t++) { g = pick(rng, [2, 3]); p = rint(rng, 2, 3); qq = rint(rng, 1, g === 2 ? 5 : 4); if (qq % p !== 0) break; }
  if (qq % p === 0) { g = 2; p = 2; qq = 3; }
  const B = g ** p; const N = g ** qq;
  return mkq(S(K9), 'change-of-base', {
    prompt: `Volt's meter reads in base ${B}. Change the base to ${g} to find ${LOG(B)} ${N}, as a fraction.`, expression: `${LOG(B)} ${N} = ?`, answer: qq / p, fraction: true, answerText: fracStr(qq, p),
    hint: `Write both ${B} and ${N} as powers of ${g}. The answer is not ${N} ÷ ${B}.`,
    steps: [`${LOG(B)} ${N} = ${LOG(g)} ${N} ÷ ${LOG(g)} ${B}.`, `${N} = ${g}${sup(qq)} and ${B} = ${g}${sup(p)}, so = ${lab(qq, 'exponent of the number')} ÷ ${lab(p, 'exponent of the base')} = ${fracStr(qq, p)}.`], app: APP9,
  });
}

function inversePlotStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 3]); const p = rint(rng, 0, b === 2 ? 3 : 2); const y = b ** p;
  const q = mkq(S(K9), 'inverse-plot', {
    prompt: `P(${p}, ${y}) is on y = ${b}ˣ. Where is its mirror point on y = ${LOG(b)} x?`, expression: `y = ${LOG(b)} x`, answer: y, answerText: `(${y}, ${p})`,
    hint: 'The log undoes the exponential: inputs and outputs swap places.',
    steps: [`${LOG(b)} undoes ${b}ˣ, so every point (x, y) becomes (y, x): a mirror in y = x.`, `(${p}, ${y}) becomes (${y}, ${p}): check ${LOG(b)} ${y} = ${p}.`], app: APP9,
  });
  return model(q, { kind: 'plot', range: [-2, 10, -2, 10], count: 1, label: `y = ${b}ˣ and the mirror line y = x`, layers: { fns: [{ fn: { kind: 'exp', a: 1, base: b }, label: `${b}ˣ` }, { fn: poly([0, 1]), color: 'muted', dashed: true, label: 'y = x' }], points: [{ x: p, y, label: 'P' }] } }, [`${y},${p}`], `Tap P's mirror point on y = ${LOG(b)} x.`);
}

function logGraphPickStep(rng: Rng): AskStep {
  const h = rnz(rng, -3, 3); const k = rnz(rng, -2, 2);
  const vis = (hh: number, kk: number, aa = 1) => pv([-5, 7, -5, 5], { fns: [{ fn: { kind: 'log', a: aa, base: 2, h: hh, k: kk } }], vlines: [{ x: hh }] });
  const e = `y = log₂(${xm(h)}) ${fmtSigned(k)}`;
  const q = mkq(S(K9), 'log-graph', {
    prompt: `Which graph is ${e}?`, expression: e, answer: h,
    hint: 'The log needs a positive input: where does the inside hit zero? That is the wall.',
    steps: [`${xm(h)} > 0 means x > ${fmt(h)}: the vertical asymptote is x = ${fmt(h)}.`, `log₂ 1 = 0, so it passes (${fmt(h + 1)}, ${fmt(k)}) and rises to the right.`], app: APP9,
  });
  return pickGraph(rng, q, [vis(h, k), vis(-h, k), vis(h, -k), vis(h, k, -1)]);
}

function lnSolveStep(rng: Rng): AskStep {
  const r = pick(rng, [0.02, 0.04, 0.05, 0.1]); const k = pick(rng, [2, 3]); const t = Math.log(k) / r; const lnk = k === 2 ? '0.6931' : '1.0986';
  const f = `N = N₀e^(${fmt(r)}t)`;
  const q = mkq(S(K9), 'solve-ln', {
    prompt: `Catalyst's culture grows as ${f}, t in hours. When has it ${k === 2 ? 'doubled' : 'tripled'}? Which is the exact time?`, expression: `e^(${fmt(r)}t) = ${k}`, answer: round2(t),
    hint: 'The unknown is in an exponent of e. Which log undoes e?',
    steps: [`${k === 2 ? 'Doubled' : 'Tripled'}: N = ${k}N₀, so e^(${fmt(r)}t) = ${k}.`, `Take ln of both sides: ln(e^(${fmt(r)}t)) = ${fmt(r)}t, so ${fmt(r)}t = ln ${k}.`, `t = ln ${k} ÷ ${fmt(r)} ≈ ${lnk} ÷ ${lab(fmt(r), 'growth rate per hour')} ≈ ${lab(fmt(round2(t)), 'hours')}. (log ${k} is base 10, the wrong log for e.)`], app: APP9,
  });
  return choose(rng, q, `t = ln ${k} ÷ ${fmt(r)}`, [`t = log ${k} ÷ ${fmt(r)}`, `t = ${fmt(r)} × ln ${k}`, `t = ln(${k} ÷ ${fmt(r)})`]);
}

function pHStep(rng: Rng): AskStep {
  const p1 = rint(rng, 2, 6); const d = rint(rng, 1, 3); const p2 = p1 + d;
  const q = mkq(S(K9), 'transfer-ph', {
    prompt: `Catalyst tests two tanks: pH ${p1} and pH ${p2}. pH = −log₁₀[H⁺]. How many times more acidic (more H⁺) is the pH ${p1} tank?`, expression: `pH ${p1} vs pH ${p2}`, answer: 10 ** d,
    hint: 'Write each [H⁺] as a power of ten, 10^(−pH), then divide the two.',
    steps: [`[H⁺] = 10^(−pH). The pH values differ by ${lab(p2, 'higher pH')} − ${lab(p1, 'lower pH')} = ${lab(d, 'pH steps')}.`, `10^(−${p1}) ÷ 10^(−${p2}) = 10${sup(d)} = ${lab(10 ** d, 'times more acidic')}.`], app: APP9,
  });
  return typed(q);
}

function decibelStep(rng: Rng): AskStep {
  const L1 = pick(rng, [40, 50, 60, 70]); const d = rint(rng, 1, 3); const L2 = L1 + 10 * d;
  const q = mkq(S(K9), 'transfer-decibel', {
    prompt: `Sound level is L = 10·log₁₀(I/I₀) dB. Volt's fan goes from ${L1} dB to ${L2} dB. By what factor did the intensity I grow?`, expression: `${L1} dB → ${L2} dB`, answer: 10 ** d,
    hint: 'Turn the change in L into a change in log₁₀ I (divide by 10), then undo the log.',
    steps: [`ΔL = ${lab(L2, 'new level in dB')} − ${lab(L1, 'old level in dB')} = ${lab(L2 - L1, 'rise in dB')} = 10 · Δlog₁₀ I, so Δlog₁₀ I = ${lab(d, 'powers of ten')}.`, `I grew by 10${sup(d)} = ${lab(10 ** d, 'times the intensity')}.`], app: APP9,
  });
  return typed(q);
}

function doublingTimeStep(rng: Rng): AskStep {
  const N = pick(rng, [10, 20, 50, 100]); const v = Math.log(N) / Math.log(2); const ans = round2(v);
  const q = mkq(S(K9), 'transfer-stages', {
    prompt: `Brick's mine fan doubles the airflow at each stage: 2ˢ times the start after s stages. Solve 2ˢ = ${N} to 2 decimal places. (log ${N} ≈ ${fmt(Math.log10(N))}, log 2 ≈ 0.301)`, expression: `2ˢ = ${N}`, answer: ans, tolerance: 0.01, decimal: true,
    hint: 'Take a log of both sides: the power s comes down in front.',
    steps: [`log(2ˢ) = s·log 2, so s = log ${N} ÷ log 2.`, `= ${lab(fmt(Math.log10(N)), 'log of the target')} ÷ ${lab(0.301, 'log of two')} ≈ ${lab(fmt(ans), 'stages')}.`], app: APP9,
  });
  return typed(q);
}

/* =====================================================================
 * 10. Sequences & series
 * ===================================================================== */
const K10 = 'sequences';
const APP10 = 'Stacked pipes, repeating payments, bouncing loads and signal repeaters are sequences and series.';

function arithTableStep(rng: Rng): AskStep {
  const a1 = rint(rng, -10, 10); const d = rnz(rng, -6, 6); const terms = [0, 1, 2, 3].map((i) => a1 + i * d);
  const known = pick(rng, [[0, 1], [1, 2], [2, 3], [0, 3], [0, 2], [1, 3]]); const [i, j] = known;
  const row = terms.map((t, k) => (known.includes(k) ? t : null)); const blanks = terms.filter((_, k) => !known.includes(k));
  const q = mkq(S(K10), 'arithmetic-table', {
    prompt: `Ada's staircase heights form an arithmetic sequence. Fill the missing terms.`, expression: `a${sub(i + 1)} = ${fmt(terms[i])}, a${sub(j + 1)} = ${fmt(terms[j])}`, answer: blanks[0],
    hint: 'Arithmetic: the same difference d each step. How many steps apart are the two known terms?',
    steps: [`a${sub(j + 1)} − a${sub(i + 1)} = ${fmt(terms[j])} − ${pn(terms[i])} = ${fmt((j - i) * d)} over ${labn(j - i, 'step')}, so d = ${lab(fmt(d), 'common difference')}.`, `Terms: ${terms.map(fmt).join(', ')}.`], app: APP10,
  });
  return model(q, { kind: 'table', rowLabels: ['n', 'aₙ'], rows: [[1, 2, 3, 4], row], label: 'arithmetic: add d each step' }, [blanks.join(',')], 'Fill the blank terms.');
}

function geomTableStep(rng: Rng): AskStep {
  const a1 = pick(rng, [1, 2, 3, -2, 5]); const r = pick(rng, [2, 3, -2]); const terms = [0, 1, 2, 3].map((i) => a1 * r ** i);
  const known = pick(rng, [[0, 1], [1, 2]]); const row = terms.map((t, k) => (known.includes(k) ? t : null)); const blanks = terms.filter((_, k) => !known.includes(k));
  const q = mkq(S(K10), 'geometric-table', {
    prompt: `Volt's repeater gains form a geometric sequence. Fill the missing terms.`, expression: `a${sub(known[0] + 1)} = ${fmt(terms[known[0]])}, a${sub(known[1] + 1)} = ${fmt(terms[known[1]])}`, answer: blanks[0],
    hint: 'Geometric: the same ratio r each step. Divide neighbours to find r (keep its sign).',
    steps: [`r = ${fmt(terms[known[1]])} ÷ ${pn(terms[known[0]])} = ${lab(fmt(r), 'common ratio')}.`, `Terms: ${terms.map(fmt).join(', ')}.`], app: APP10,
  });
  return model(q, { kind: 'table', rowLabels: ['n', 'aₙ'], rows: [[1, 2, 3, 4], row], label: 'geometric: multiply by r each step' }, [blanks.join(',')], 'Fill the blank terms.');
}

function nthTermStep(rng: Rng): AskStep {
  const a1 = rint(rng, -10, 15); const d = rnz(rng, -5, 7); const n = rint(rng, 12, 40); const an = a1 + (n - 1) * d;
  const q = mkq(S(K10), 'nth-term', {
    prompt: `Volt's repeaters are spaced as an arithmetic sequence: a₁ = ${fmt(a1)}, d = ${fmt(d)}. Find a${sub(n)}.`, expression: `a${sub(n)} = ?`, answer: an,
    hint: 'How many times has d been added by term n? The first term has had none.',
    steps: [`aₙ = a₁ + (n − 1)d.`, `a${sub(n)} = ${lab(fmt(a1), 'first term')} + ${lab(n - 1, 'steps')} × ${pn(d)} = ${lab(fmt(an), 'term asked for')}.`], app: APP10,
  });
  return choose(rng, q, fmt(an), [fmt(a1 + n * d), fmt(n * d), fmt(a1 + (n - 2) * d)]);
}

function nthTypedArithStep(rng: Rng): AskStep { return typed(nthArithQ(rng)); }
function nthArithQ(rng: Rng): Question {
  const a1 = rint(rng, -10, 20); const d = rnz(rng, -6, 8); const n = rint(rng, 10, 50); const an = a1 + (n - 1) * d;
  const t = [0, 1, 2].map((i) => a1 + i * d);
  return mkq(S(K10), 'nth-term', {
    prompt: `Ada's markers follow ${t.map(fmt).join(', ')}, … Find term ${n}.`, expression: `a${sub(n)} = ?`, answer: an,
    hint: 'aₙ = a₁ + (n − 1)d: by term n, d has been added n − 1 times.',
    steps: [`d = ${fmt(t[1])} − ${pn(t[0])} = ${lab(fmt(d), 'common difference')}.`, `a${sub(n)} = ${lab(fmt(a1), 'first term')} + ${lab(n - 1, 'steps')} × ${pn(d)} = ${lab(fmt(an), 'term asked for')}.`], app: APP10,
  });
}

function nthTypedGeomStep(rng: Rng): AskStep {
  const a1 = pick(rng, [1, 2, 3, 5]); const r = pick(rng, [2, 3]); const n = rint(rng, 4, r === 2 ? 8 : 6); const an = a1 * r ** (n - 1);
  const t = [0, 1, 2].map((i) => a1 * r ** i);
  const q = mkq(S(K10), 'nth-term-geometric', {
    prompt: `Volt's signal boosts follow ${t.join(', ')}, … Find term ${n}.`, expression: `a${sub(n)} = ?`, answer: an,
    hint: 'aₙ = a₁ · rⁿ⁻¹: the first term has not been multiplied yet.',
    steps: [`r = ${t[1]} ÷ ${t[0]} = ${lab(r, 'common ratio')}.`, `a${sub(n)} = ${lab(a1, 'first boost')} × ${r}${sup(n - 1)} = ${lab(an, 'boost asked for')}.`], app: APP10,
  });
  return typed(q);
}

function seqTypeStep(rng: Rng): AskStep {
  const kind = pick(rng, ['arith', 'geom', 'neither'] as const);
  let t: number[] = []; let right = ''; let wrongs: string[] = [];
  if (kind === 'arith') {
    let a1 = rnz(rng, -8, 12); let d = rnz(rng, -6, 6); for (let g = 0; g < 40 && [0, 1, 2, 3, 4].some((i) => a1 + i * d === 0); g++) { a1 = rnz(rng, -8, 12); d = rnz(rng, -6, 6); }
    if ([0, 1, 2, 3, 4].some((i) => a1 + i * d === 0)) { a1 = 3; d = 4; }
    t = [0, 1, 2, 3, 4].map((i) => a1 + i * d);
    right = `Arithmetic, d = ${fmt(d)}`; wrongs = [`Arithmetic, d = ${fmt(-d)}`, 'Neither'];
    if (t[0] !== 0) wrongs.push(`Geometric, r = ${fracStr(t[1], t[0])}`);
  } else if (kind === 'geom') {
    const [a1, rn, rd] = pick(rng, [[pick(rng, [1, 2, 3]), 2, 1], [pick(rng, [1, 2]), 3, 1], [pick(rng, [1, 3]), -2, 1], [pick(rng, [48, 64, 80]), 1, 2]] as const);
    t = [0, 1, 2, 3, 4].map((i) => (a1 * rn ** i) / rd ** i);
    right = `Geometric, r = ${fracStr(rn, rd)}`; wrongs = [`Arithmetic, d = ${fmt(t[1] - t[0])}`, `Geometric, r = ${fracStr(rd, rn)}`, 'Neither'];
  } else {
    const c = rint(rng, 1, 4); t = [1, 2, 3, 4, 5].map((n) => n * n + c);
    right = 'Neither'; wrongs = [`Arithmetic, d = ${t[1] - t[0]}`, `Geometric, r = ${fracStr(t[1], t[0])}`];
  }
  const q = mkq(S(K10), 'sequence-type', {
    prompt: `Ada's stair heights run ${t.map(fmt).join(', ')}, … What kind of sequence is it?`, expression: t.map(fmt).join(', '), answer: 0,
    hint: 'Check every difference and every ratio, not just the first pair.',
    steps: [`Differences: ${t.slice(1).map((v, i) => fmt(v - t[i])).join(', ')}.`, `Ratios: ${t.slice(1).map((v, i) => (t[i] === 0 ? '–' : fracStr(v, t[i]))).join(', ')}.`, `${right}.`], app: APP10,
  });
  return choose(rng, q, right, wrongs);
}

function arithSumStep(rng: Rng): AskStep { return typed(arithSumQ(rng)); }
function arithSumQ(rng: Rng): Question {
  const a1 = rint(rng, 1, 10); const d = rint(rng, 1, 5); const n = rint(rng, 8, 25); const an = a1 + (n - 1) * d; const Ssum = (n * (a1 + an)) / 2;
  return mkq(S(K10), 'arithmetic-sum', {
    prompt: `Brick's truss has ${a1} bolts in panel 1 and ${d} more in each next panel. How many bolts in the first ${n} panels?`, expression: `S${sub(n)} = ?`, answer: Ssum,
    hint: 'Pair the first panel with the last: every pair has the same total. Then count the pairs.',
    steps: [`a${sub(n)} = ${lab(a1, 'bolts in the first panel')} + ${lab(n - 1, 'more panels')} × ${lab(d, 'extra bolts per panel')} = ${lab(an, 'bolts in the last panel')}.`, `S = n(a₁ + aₙ)/2 = ${lab(n, 'panels')} × ${lab(a1 + an, 'first plus last')} ÷ 2 = ${lab(Ssum, 'bolts')}.`], app: APP10,
  });
}

function geomSumStep(rng: Rng): AskStep {
  const a1 = pick(rng, [1, 2, 3, 5]); const r = pick(rng, [2, 3]); const n = rint(rng, 4, r === 2 ? 7 : 5); const Ssum = (a1 * (r ** n - 1)) / (r - 1);
  const t = [0, 1, 2].map((i) => a1 * r ** i);
  const q = mkq(S(K10), 'geometric-sum', {
    prompt: `Volt's repeaters boost ${t.join(', ')}, … Add the first ${n} boosts.`, expression: `S${sub(n)} = ?`, answer: Ssum,
    hint: 'Sₙ = a₁(rⁿ − 1)/(r − 1). Or list the terms and add.',
    steps: [`a₁ = ${lab(a1, 'first boost')}, r = ${lab(r, 'common ratio')}, n = ${lab(n, 'boosts')}.`, r === 2 ? `S = ${a1}(2${sup(n)} − 1) ÷ 1 = ${a1} × ${r ** n - 1} = ${Ssum}.` : `S = ${a1}(${r}${sup(n)} − 1) ÷ ${r - 1} = ${a1} × ${r ** n - 1} ÷ ${r - 1} = ${Ssum}.`], app: APP10,
  });
  return typed(q);
}

function seqPlotStep(rng: Rng): AskStep {
  let a1 = 0; let d = 1; let n = 5; let an = 0;
  for (let g = 0; g < 60; g++) { a1 = rint(rng, -4, 4); d = rnz(rng, -2, 2); n = rint(rng, 4, 7); an = a1 + (n - 1) * d; if (Math.abs(an) <= 7) break; }
  if (Math.abs(an) > 7) { a1 = 1; d = 1; n = 5; an = 5; }
  const pts = [1, 2, 3].map((k) => ({ x: k, y: a1 + (k - 1) * d }));
  const q = mkq(S(K10), 'sequence-plot', {
    prompt: `a₁ = ${fmt(a1)}, d = ${fmt(d)}. The first three terms are plotted as points (n, aₙ).`, expression: `a${sub(n)} = ?`, answer: an, answerText: `(${n}, ${fmt(an)})`,
    hint: 'Each step right adds d: the points line up.',
    steps: [`Each step right adds ${fmt(d)}: the points lie on a line of slope ${fmt(d)}.`, `a${sub(n)} = ${lab(fmt(a1), 'first term')} + ${lab(n - 1, 'steps')} × ${pn(d)} = ${lab(fmt(an), 'height of the point')}.`], app: APP10,
  });
  return model(q, { kind: 'plot', range: [0, 8, -8, 8], count: 1, label: 'Points (n, aₙ)', layers: { points: pts } }, [`${n},${an}`], `Tap the point for n = ${n}.`);
}

function partialSumTableStep(rng: Rng): AskStep {
  const a1 = pick(rng, [8, 16, 32]); const terms = [0, 1, 2, 3].map((i) => a1 / 2 ** i); const sums = terms.map((_, i) => terms.slice(0, i + 1).reduce((s, v) => s + v, 0));
  const q = mkq(S(K10), 'partial-sums', {
    prompt: `Newton's bouncing ball travels ${terms.join(' + ')} + … cm, each hop half the last. Fill the running totals.`, expression: `${terms.join(' + ')} + …`, answer: sums[3],
    hint: 'Each running total is the previous total plus the next term.',
    steps: [`S₁ = ${lab(a1, 'first hop in cm')}, then add each term: ${sums.join(', ')}.`, `The gap to ${lab(2 * a1, 'limit in cm')} halves each time: the sum heads for ${2 * a1} cm.`], app: APP10,
  });
  return model(q, { kind: 'table', rowLabels: ['n', 'term', 'Sₙ'], rows: [[1, 2, 3, 4], terms, [null, null, null, null]], label: 'running totals' }, [sums.join(',')], 'Fill the running total Sₙ.');
}

function infiniteSumStep(rng: Rng, mode: 'diverge' | 'converge' = rng.next() < 0.25 ? 'diverge' : 'converge'): AskStep {
  const NO = 'No finite sum: it never settles';
  if (mode === 'diverge') {
    const a1 = rint(rng, 2, 6); const r = pick(rng, [2, 2, 3, -2]);
    const t = [a1, a1 * r, a1 * r * r]; const series = `${t[0]} ${t[1] < 0 ? '−' : '+'} ${Math.abs(t[1])} + ${t[2]} ${r < 0 ? '−' : '+'} …`;
    const q = mkq(S(K10), 'infinite-sum', {
      prompt: `Volt's feedback loop adds ${series} forever. What is the total?`, expression: series, answer: 0,
      hint: 'Is |r| less than 1? The formula a₁/(1 − r) only works then.',
      steps: [`r = ${lab(fmt(r), 'common ratio')}: |r| ≥ 1, so the terms get bigger in size and the running total never settles.`, `a₁/(1 − r) would give ${fracStr(a1, 1 - r)}: the formula does not apply when |r| ≥ 1.`], app: APP10,
    });
    return choose(rng, q, NO, [fracStr(a1, 1 - r), fmt(t[0] + t[1] + t[2]), fmt(2 * a1), fracStr(a1, 1 + r)]);
  }
  const [rn, rd, a1] = pick(rng, [[1, 2, pick(rng, [4, 6, 8, 10, 12])], [1, 3, pick(rng, [6, 12, 18])], [1, 4, pick(rng, [3, 6, 9, 12])], [-1, 2, pick(rng, [6, 12, 18])]] as const);
  const Ssum = (a1 * rd) / (rd - rn);
  const t2 = (a1 * rn) / rd; const t3 = (a1 * rn * rn) / (rd * rd);
  const fr = (x: number) => fracStr(Math.round(x * rd * rd), rd * rd);
  const series = rn > 0 ? `${a1} + ${fr(t2)} + ${fr(t3)} + …` : `${a1} − ${fr(-t2)} + ${fr(t3)} − …`;
  const q = mkq(S(K10), 'infinite-sum', {
    prompt: `Volt's signal echoes ${series} forever. What is the total?`, expression: series, answer: Ssum,
    hint: 'Find r. When |r| < 1 the total settles at a₁ ÷ (1 − r).',
    steps: [`r = ${lab(fracStr(rn, rd), 'common ratio')}, and |r| < 1, so the sum settles.`, `S = a₁ ÷ (1 − r) = ${lab(a1, 'first echo')} ÷ ${fracStr(rd - rn, rd)} = ${lab(fmt(Ssum), 'total')}.`], app: APP10,
  });
  return choose(rng, q, fmt(Ssum), [NO, fracStr(a1 * rd, rd + rn), fracStr(Math.round((a1 + t2 + t3) * rd * rd), rd * rd)]);
}
const divergeSumStep = (rng: Rng) => infiniteSumStep(rng, 'diverge');
const convergeSumStep = (rng: Rng) => infiniteSumStep(rng, 'converge');

function pipeStackStep(rng: Rng): AskStep {
  const B = rint(rng, 8, 20); const T = rint(rng, 1, 4); const rows = B - T + 1; const total = ((B + T) * rows) / 2;
  const q = mkq(S(K10), 'transfer-pipes', {
    prompt: `Brick stacks pipes: ${B} on the bottom row, one fewer in each row above, ${T} on the top row. How many pipes?`, expression: `${B} + ${B - 1} + … + ${T}`, answer: total,
    hint: 'Count the rows first. Then pair the bottom row with the top row.',
    steps: [`Rows: ${lab(B, 'bottom row')} − ${lab(T, 'top row')} + 1 = ${lab(rows, 'rows')}.`, `S = rows × (bottom + top) ÷ 2 = ${lab(rows, 'rows')} × ${lab(B + T, 'bottom plus top')} ÷ 2 = ${lab(total, 'pipes')}.`], app: APP10,
  });
  return typed(q);
}

function dampingStep(rng: Rng): AskStep {
  const [H, rn, rd] = pick(rng, [[16, 1, 2], [32, 1, 2], [64, 1, 2], [27, 2, 3], [81, 2, 3], [81, 1, 3], [27, 1, 3]] as const);
  const k = rint(rng, 1, 3); const h = (H * rn ** k) / rd ** k;
  const q = mkq(S(K10), 'transfer-damping', {
    prompt: `Newton twangs a steel beam: it swings ${H} mm, and each cycle the swing is ${fracStr(rn, rd)} of the one before. How big is the swing after ${k} cycle${k === 1 ? '' : 's'}?`, expression: `after ${k} cycle${k === 1 ? '' : 's'} = ?`, answer: h, unit: 'mm',
    hint: 'Each cycle multiplies the swing by the same fraction: a geometric sequence. Count the multiplications.',
    steps: [`After ${labn(k, 'cycle')}: ${lab(H, 'first swing in mm')} × (${fracStr(rn, rd)})${sup(k)}, keeping ${lab(fracStr(rn, rd), 'fraction per cycle')} each time.`, `= ${lab(fmt(h), 'swing in mm')}.`, 'Damping never takes the same amount off each cycle: it takes the same fraction.'], app: APP10,
  });
  return typed(q);
}

/* =====================================================================
 * Chapters
 * ===================================================================== */
const Q = (short: string) => `aq.alg2.${short}`;

const CHAPTERS: ChapterSpec[] = [
  {
    key: K1, title: 'Functions & Transformations', wing: 'foundry', wingName: 'Function Foundry',
    goal: 'Know the parent shapes, and read a·f(x − h) + k as a shift, stretch or flip of a known graph.',
    misconception: 'Reading f(x − 3) as a shift LEFT (following the minus sign); mixing up −f(x) (flip over the x-axis) with f(−x) (flip over the y-axis).',
    teach: [
      { title: 'Parent functions', text: 'Every family has a parent: y = x², y = |x|, y = √x. Learn its shape and its key point (the vertex), and every relative is that shape moved or stretched.', steps: ['Put x = 4 into each parent.', '4² = 4 × 4 = 16, so y = x² is already off the top of the grid.', '|−4| = |4| = 4: |x| has the same height on both sides.', '√4 = 2 because 2 × 2 = 4, and √x starts at x = 0: no negative inputs.', 'All three pass through (0, 0) and (1, 1): 1² = |1| = √1 = 1.'], next: 'In your head: which parent is highest at x = 1/4?', visual: pv(R6, { fns: [{ fn: poly([0, 0, 1]), label: 'x²' }, { fn: { kind: 'abs' }, label: '|x|', color: 'orange' }, { fn: { kind: 'sqrt' }, label: '√x', color: 'muted' }] }) },
      { title: 'Inside moves sideways, backwards', text: 'g(x) = |x − 3| + 2 moves |x| RIGHT 3 and UP 2. Inside, x − 3 = 0 when x = 3, so the vertex sits at x = 3. Outside changes do what they say; inside changes go opposite to the sign.', next: 'In your head: where is the vertex of |x + 1| − 2?', model: { kind: 'plot', range: R6, count: 1, label: 'Tap the vertex of |x − 3| + 2', layers: { fns: [{ fn: { kind: 'abs' }, color: 'muted', dashed: true }] } } },
      { title: 'Flip and stretch', text: 'A minus OUTSIDE, −f(x), flips outputs: a mirror in the x-axis. A minus INSIDE, f(−x), flips inputs: a mirror in the y-axis. 2f(x) doubles every height.', steps: ['f(x) = |x − 2| + 1 is the solid V, vertex (2, 1).', '|4 − 2| + 1 = 2 + 1 = 3, so f(4) = 3.', '−f(4) = −3: the point (4, 3) mirrors to (4, −3) on the dashed V, and the vertex (2, 1) to (2, −1).', '2f(4) = 2 × 3 = 6: every height doubles.'], next: 'Where does the vertex (2, 1) go under f(−x)?', visual: pv(R6, { fns: [{ fn: { kind: 'abs', h: 2, k: 1 }, label: 'f' }, { fn: { kind: 'abs', a: -1, h: 2, k: -1 }, label: '−f', color: 'orange', dashed: true }] }) },
    ],
    quests: [
      { id: Q('functions.foundry'), name: 'The Shifting Moulds', giver: 'vector', guided: true, hook: 'Vector: "The Foundry pours every curve from a handful of parent moulds. Slide each mould into place and the casting line restarts."', change: 'The Foundry\'s parent moulds slide on their rails again.',
        waves: [wave('Slide the parent', times(3, vertexShiftStep)), wave('Read the shift', mixOf([shiftWordsStep, whichGraphStep, shiftWordsStep])), wave('Flip and stretch', mixOf([flipOutStep, flipInStep, flipStep]))] },
      { id: Q('functions.cam-shop'), name: 'Cam Shop', giver: 'ada', hook: 'Ada: "Every cam here is a copy of one profile, shifted, flipped or stretched. Tell me where each follower lands."', change: 'The cam followers track their profiles without chatter.',
        waves: [wave('Pump tables', times(2, transformTableStep)), wave('Evaluate the copy', times(3, evalShiftStep)), wave('Which profile', mixOf([whichGraphStep, reflectPointStep, vertexShiftStep]))] },
    ],
    concept: conceptFrom([vertexShiftStep, reflectPointStep, transformTableStep, whichGraphStep]),
    transfer: oneOf([signalDelayStep, camLogStep]),
    practice: evalShiftQ,
  },
  {
    key: K2, title: 'Quadratic Functions', wing: 'arches', wingName: 'Parabola Bridge',
    goal: 'Graph y = a(x − h)² + k and y = ax² + bx + c: the vertex, the axis of symmetry x = −b/(2a), the direction it opens, and completing the square.',
    misconception: 'Reading the vertex of a(x − h)² + k as (−h, k); using x = b/(2a) (dropping the minus); completing the square without subtracting what was added.',
    teach: [
      { title: 'Vertex form', text: 'y = a(x − h)² + k is x² slid to the vertex (h, k). The square is never negative, so with a > 0 the lowest y is k, reached at x = h. A negative a flips it into an arch.', steps: ['y = (x − 2)² − 3 has h = 2 and k = −3.', '(2 − 2)² − 3 = 0 − 3 = −3: the lowest point, the dot (2, −3).', '(4 − 2)² − 3 = 4 − 3 = 1 and (0 − 2)² − 3 = 4 − 3 = 1: equal heights 2 either side.', 'So the solid curve is the dashed x² moved right 2 and down 3.'], next: 'Where is the vertex of y = −(x + 1)² + 4, and does it open up or down?', visual: pv(R6, { fns: [{ fn: poly([0, 0, 1]), color: 'muted', dashed: true, label: 'x²' }, { fn: poly([1, -4, 1]), label: '(x − 2)² − 3' }], points: [{ x: 2, y: -3, label: '(2, −3)' }] }) },
      { title: 'Axis of symmetry', text: 'A parabola is its own mirror image across the line x = h. In standard form y = ax² + bx + c that line is x = −b/(2a). Every point has a twin the same distance on the other side.', steps: ['Take y = x² − 2x − 6: a = 1, b = −2.', '−b/(2a) = 2 ÷ (2 × 1) = 1: the line x = 1 on the grid.', 'P is on the parabola: 4² − 2 × 4 − 6 = 16 − 8 − 6 = 2, so P = (4, 2).', '4 (x of P) − 1 (axis) = 3 (units right of the axis), so the twin is 3 units left: 1 (axis) − 3 (units left) = −2 (x of the twin), at (−2, 2).'], next: 'Across x = 1, where is the twin of (3, −3)?', model: { kind: 'plot', range: R6, count: 1, label: 'Axis x = 1: tap the twin of P', layers: { vlines: [{ x: 1, label: 'x = 1' }], points: [{ x: 4, y: 2, label: 'P' }] } } },
      { title: 'Completing the square', text: 'To find the vertex of x² − 6x + 5: half of −6 is −3, and (−3)² = 9. Add 9 and take 9 away: (x² − 6x + 9) − 9 + 5 = (x − 3)² − 4. Vertex (3, −4).', visual: card('x² − 6x + 5', ['= (x² − 6x + 9) − 9 + 5', '= (x − 3)² − 4', 'vertex (3, −4)']) },
    ],
    quests: [
      { id: Q('quadratics.arch'), name: 'The Arch Templates', giver: 'ada', guided: true, hook: 'Ada: "Every arch on the Parabola Bridge is cut from a template. Find each vertex and the axis it mirrors across."', change: 'The bridge arches stand true and symmetric.',
        waves: [wave('Find the vertex', times(3, vertexFormTapStep)), wave('Mirror image', mixOf([mirrorPointStep, axisStep, mirrorPointStep])), wave('Which arch', times(2, whichParabolaStep))] },
      { id: Q('quadratics.fountain'), name: 'The Fountain Jets', giver: 'newton', hook: 'Newton: "The fountain jets are written in standard form. Find each peak before the water finds the wiring."', change: 'The fountain jets arc cleanly into their basins.',
        waves: [wave('Standard form', times(3, vertexStandardTapStep)), wave('Rewrite', mixOf([convertVertexStep, axisStep, convertVertexStep])), wave('Peak value', mixOf([minValueStep, minValueStep, whichParabolaStep]))] },
    ],
    concept: conceptFrom([vertexFormTapStep, mirrorPointStep, whichParabolaStep, vertexStandardTapStep]),
    transfer: oneOf([archWidthStep, flarePeakStep]),
    practice: minValueQ,
  },
  {
    key: K3, title: 'Solving Quadratics', wing: 'arches', wingName: 'Spillway Gates',
    goal: 'Solve quadratics by factoring, by completing the square and with the quadratic formula, and use the discriminant to count real roots.',
    misconception: 'From (x + 2)(x − 3) = 0 writing x = 2 or x = −3 (sign flip); dividing only part of the numerator by 2a; thinking b² is negative when b is negative.',
    teach: [
      { title: 'Zero product', text: 'If A·B = 0 then A = 0 or B = 0. x² − x − 6 = (x − 3)(x + 2), so x = 3 or x = −2: the values that make each bracket zero. They are where the parabola crosses the x-axis.', visual: pv(R6, { fns: [{ fn: poly([-6, -1, 1]) }], points: [{ x: 3, y: 0, label: '3' }, { x: -2, y: 0, label: '−2' }] }) },
      { title: 'The quadratic formula', text: 'Complete the square on ax² + bx + c = 0 once, for every quadratic: x² + (b/a)x = −c/a becomes (x + b/2a)² = (b² − 4ac)/4a². Take the root of both sides and you have the formula. Divide the WHOLE top by 2a, and simplify roots by pulling out a square: √12 = √(4·3) = √4·√3 = 2√3.', visual: card('ax² + bx + c = 0', ['x = (−b ± √(b² − 4ac)) ÷ 2a', 'x² − 4x + 1 = 0: x = (4 ± √12) ÷ 2', '√12 = √(4·3) = 2√3', 'x = (4 ± 2√3) ÷ 2 = 2 ± √3']) },
      { title: 'The discriminant', text: 'D = b² − 4ac sits under the root. D > 0: two real roots. D = 0: one repeated root (the vertex touches the axis). D < 0: no real roots; the parabola misses the axis.', steps: ['x² − 3: D = 0² − 4 × 1 × (−3) = 12 > 0, two roots, x = ±√3 ≈ ±1.73.', 'x²: D = 0² − 4 × 1 × 0 = 0, one repeated root at the vertex (0, 0).', 'x² + 2: D = 0² − 4 × 1 × 2 = −8 < 0, no real roots.', 'On the graph: the D > 0 curve cuts the axis twice, the D = 0 curve just touches it, the D < 0 curve floats above it.'], next: 'How many real roots does x² − 4x + 4 have? Work out D first.', visual: pv(R6, { fns: [{ fn: poly([-3, 0, 1]), label: 'D > 0' }, { fn: poly([0, 0, 1]), color: 'orange', label: 'D = 0' }, { fn: poly([2, 0, 1]), color: 'muted', label: 'D < 0' }] }) },
    ],
    quests: [
      { id: Q('solving.spillway'), name: 'The Spillway Gates', giver: 'brick', guided: true, hook: 'Brick: "Each spillway gate opens where its floor curve meets the waterline. Factor the curve, find the crossings."', change: 'The spillway gates swing open on cue.',
        waves: [wave('Factor and cross', mixOf([zerosTapStep, factorSolveStep, nonMonicFactorStep])), wave('Zero product', mixOf([zeroProductBalanceStep, factorSolveStep, zeroProductBalanceStep])), wave('Complete the square', times(2, completeSquareTableStep))] },
      { id: Q('solving.formula'), name: 'The Formula Vault', giver: 'volt', hook: 'Volt: "Some circuits will not factor. The vault opens for the formula, and the discriminant says what is inside first."', change: 'The Formula Vault stands open.',
        waves: [wave('Discriminant', mixOf([discCountStep, discTypedStep, discCountStep])), wave('The formula', mixOf([(rng) => simplifyRadStep(rng, K3), irrationalRootsStep, quadFormulaTypedStep])), wave('Roots on the grid', mixOf([zerosTapStep, completeSquareTableStep, zerosTapStep]))] },
    ],
    concept: conceptFrom([zerosTapStep, discCountStep, completeSquareTableStep, zeroProductBalanceStep]),
    transfer: oneOf([flareLandStep, panelAreaStep]),
    practice: quadFormulaQ,
  },
  {
    key: K4, title: 'Complex Numbers', wing: 'observatory', wingName: 'Imaginary Observatory',
    goal: 'Use i with i² = −1: simplify powers of i, add, subtract and multiply complex numbers, plot them, and find complex roots of quadratics.',
    misconception: 'Treating i² as +1, so (2 + 3i)(1 + i) comes out 5 + 5i instead of −1 + 5i; forgetting to distribute a minus over both parts; thinking a negative discriminant means "no solution at all".',
    teach: [
      { title: 'Meet i', text: 'No real number squares to −1, so we name one: i, with i² = −1. Then √−9 = 3i. The powers of i cycle every four: i, −1, −i, 1, i, …', visual: card('powers of i', ['i¹ = i', 'i² = −1', 'i³ = −i', 'i⁴ = 1  (then it repeats)']) },
      { title: 'The complex plane', text: 'a + bi is a point: a across (real), b up (imaginary). Adding complex numbers adds arrows tip to tail, just like adding forces.', steps: ['z₁ = 2 + i is the point (2, 1); z₂ = 1 + 3i is (1, 3).', 'Real parts: 2 + 1 = 3.', 'Imaginary parts: 1 + 3 = 4.', '(2 + i) + (1 + 3i) = 3 + 4i: put the tail of z₂ on the tip of z₁ and it ends at (3, 4).'], next: 'Where is the tip of z₁ − z₂? Subtract the real parts, then the imaginary parts.', model: { kind: 'plot', range: R6, count: 1, arrows: true, label: 'Tap the tip of (2 + i) + (1 + 3i)', layers: { vectors: [{ x: 2, y: 1, label: 'z₁', color: 'teal' }, { x: 1, y: 3, label: 'z₂', color: 'orange' }] } } },
      { title: 'Multiply with i² = −1', text: 'FOIL as usual, then every i² becomes −1 and joins the real part.', steps: ['2 × 1 = 2 and 2 × (−i) = −2i.', '3i × 1 = 3i and 3i × (−i) = −3i².', '−3i² = −3 × (−1) = 3, which joins the 2: 2 + 3 = 5.', '−2i + 3i = i, so (2 + 3i)(1 − i) = 5 + i.'], next: 'Multiply (1 + 2i)(1 − 2i). What happens to the i terms?', visual: card('(2 + 3i)(1 − i)', ['= 2 − 2i + 3i − 3i²', '= 2 + i + 3', '= 5 + i']) },
    ],
    quests: [
      { id: Q('complex.observatory'), name: 'The Imaginary Axis', giver: 'vector', guided: true, hook: 'Vector: "The Observatory tracks signals on a second axis, the imaginary one. Learn i and the telescope turns."', change: 'The Observatory telescope swings onto the imaginary axis.',
        waves: [wave('Powers of i', times(2, iPowerStep)), wave('On the plane', mixOf([complexPlotStep, conjugatePlotStep, complexPlotStep])), wave('Add and subtract', times(3, addComplexStep))] },
      { id: Q('complex.phasor'), name: 'Phasor Lab', giver: 'volt', hook: 'Volt: "AC circuits live in the complex plane. Multiply my phasors right and the lab lights hum in phase."', change: 'The Phasor Lab lamps hum in phase.',
        waves: [wave('Multiply', seqOf([productPair, multComplexStep])), wave('Conjugates, size and turns', mixOf([conjugateStep, modulusStep, rotateStep])), wave('Complex roots', mixOf([complexRootsStep, complexPlotStep, complexRootsStep]))] },
    ],
    concept: conceptFrom([complexPlotStep, productTableStep, conjugatePlotStep, rotateStep]),
    transfer: oneOf([impedanceStep]),
    practice: modulusQ,
  },
  {
    key: K5, title: 'Polynomial Functions', wing: 'works', wingName: 'Polynomial Works',
    goal: 'Predict end behaviour from the leading term, read zeros and multiplicity from factors, and divide by (x − r) with synthetic division and the remainder theorem.',
    misconception: 'Judging end behaviour from the first term written (not the highest power); thinking every zero crosses the axis; dividing by (x − 3) using −3.',
    teach: [
      { title: 'End behaviour', text: 'For huge |x| the highest power wins. Even degree: both ends go the same way. Odd degree: opposite ways. A negative leading coefficient flips both. Find that term even when it is written last.', steps: ['10³ − 2 × 10 = 1000 − 20 = 980 and (−10)³ − 2 × (−10) = −1000 + 20 = −980: the x³ term wins.', 'Odd degree, positive lead: down on the left, up on the right, like the x³ − 2x curve.', '−10⁴ ÷ 4 − 10² + 2 = −2500 − 100 + 2 = −2598, and x = −10 gives the same.', 'Even degree, negative lead: both ends fall, like the −x⁴/4 … curve.'], next: 'Which way do the ends of y = 5 + 3x − 2x³ point?', visual: pv([-4, 4, -8, 8], { fns: [{ fn: poly([0, -2, 0, 1]), label: 'x³ − 2x' }, { fn: poly([2, 0, -1, 0, -0.25]), color: 'orange', label: '−x⁴/4 …' }] }) },
      { title: 'Zeros and multiplicity', text: 'y = (x − 1)²(x + 2): x = −2 appears once, so the graph crosses. x = 1 is squared (multiplicity 2): the graph touches the axis and turns back.', steps: ['x − 1 = 0 at x = 1 (squared, multiplicity 2); x + 2 = 0 at x = −2 (once).', 'Either side of 1: (0 − 1)²(0 + 2) = 1 × 2 = 2 and (2 − 1)²(2 + 2) = 1 × 4 = 4. Both positive, so it touches and turns back.', 'Either side of −2: (−3 − 1)²(−3 + 2) = 16 × (−1) = −16 and (−1 − 1)²(−1 + 2) = 4 × 1 = 4. The sign changes, so it crosses.'], next: 'Does y = x(x − 3)² cross or touch at x = 3? And at x = 0?', visual: pv([-4, 4, -6, 6], { fns: [{ fn: poly(expand([1, 1, -2])) }], points: [{ x: 1, y: 0, label: 'touch' }, { x: -2, y: 0, label: 'cross' }] }) },
      { title: 'Synthetic division and the remainder', text: 'Divide by (x − r) using r. Bring down, multiply by r, add, repeat. The last number is the remainder, and it always equals P(r): P(x) = (x − r)Q(x) + R, and at x = r the first part is 0, so P(r) = R. So P(r) = 0 means (x − r) is a factor.', steps: ['Bring down the 1.', '1 × 3 = 3, then −2 + 3 = 1.', '1 × 3 = 3, then −5 + 3 = −2.', '−2 × 3 = −6, then 6 + (−6) = 0: the remainder.', 'Check: P(3) = 3³ − 2 × 3² − 5 × 3 + 6 = 27 − 18 − 15 + 6 = 0.'], next: 'What is P(1) for the same P(x)? Is (x − 1) a factor?', visual: card('x³ − 2x² − 5x + 6 ÷ (x − 3)', ['use 3:  1  −2  −5  6', 'bottom: 1   1  −2  0', 'quotient x² + x − 2, remainder 0 = P(3)']) },
    ],
    quests: [
      { id: Q('polynomials.gearbox'), name: 'The Gearbox Curves', giver: 'brick', guided: true, hook: 'Brick: "The gearbox wobble follows a polynomial. Tell me where it runs off to and where it touches zero, or the teeth strip."', change: 'The gearbox runs smooth; the wobble is mapped.',
        waves: [wave('End behaviour', times(2, endBehaviorStep)), wave('Zeros and bounces', mixOf([bounceTapStep, multiplicityStep, bounceTapStep])), wave('Which curve', mixOf([polyGraphPickStep, zerosBothStep, polyGraphPickStep]))] },
      { id: Q('polynomials.divider'), name: 'The Divider Press', giver: 'ada', hook: 'Ada: "The press splits a polynomial by (x − r). Feed it right and the remainder tells you if r is a root."', change: 'The Divider Press stamps clean quotients.',
        waves: [wave('Synthetic division', times(2, syntheticTableStep)), wave('Remainder theorem', mixOf([remainderStep, remainderTypedStep, factorTheoremStep])), wave('Check the zeros', mixOf([syntheticTableStep, zerosBothStep, endBehaviorStep]))] },
    ],
    concept: conceptFrom([bounceTapStep, syntheticTableStep, multiplicityStep, polyGraphPickStep]),
    transfer: oneOf([boxVolumeStep, tableRemainderStep]),
    practice: remainderQ,
  },
  {
    key: K6, title: 'Rational Functions', wing: 'works', wingName: 'Flow Control Room',
    goal: 'Simplify rational expressions by cancelling factors, add them over a common denominator, and find vertical asymptotes, holes and horizontal asymptotes.',
    misconception: 'Cancelling terms instead of factors ((x + 6)/(x + 2) = 3); adding fractions by adding tops and bottoms; calling every zero of the original denominator an asymptote (missing holes).',
    teach: [
      { title: 'Factor, then cancel', text: '(x² − 9)/(x − 3) = (x − 3)(x + 3)/(x − 3) = x + 3, for x ≠ 3. Cancel whole factors, never terms: (x + 6)/(x + 2) is NOT 3 (try x = 1: 7/3).', visual: card('(x² − 9)/(x − 3)', ['= (x − 3)(x + 3)/(x − 3)', '= x + 3,  x ≠ 3', '(x + 6)/(x + 2) ≠ 3']) },
      { title: 'Asymptotes and holes', text: 'Where the simplified bottom is zero, the outputs blow up: a vertical asymptote. A factor that cancelled leaves a single missing point instead: a hole.', steps: ['The graph is (x + 1)/(x² − x − 2) = (x + 1)/((x − 2)(x + 1)).', 'Cancel (x + 1): 1/(x − 2), for x ≠ −1.', 'x − 2 = 0 at x = 2: the wall.', 'Hole: 1/(−1 − 2) = −1/3, so the open dot is (−1, −1/3).'], next: 'Where are the wall and the hole of (x − 3)/(x² − 9)?', visual: pv(R6, { fns: [{ fn: { kind: 'rational', num: [1, 1], den: [-2, -1, 1] } }], vlines: [{ x: 2, label: 'x = 2' }], points: [{ x: -1, y: -1 / 3, open: true, label: 'hole' }] }) },
      { title: 'Horizontal asymptotes', text: 'For huge |x| compare degrees. Why: divide top and bottom by the highest power, (2x + 1)/(x − 1) = (2 + 1/x)/(1 − 1/x) → 2, since 1/x → 0. Top smaller: y = 0. Equal: y = ratio of leading coefficients. Top bigger: no horizontal asymptote.', visual: pv(R6, { fns: [{ fn: { kind: 'rational', num: [1, 2], den: [-1, 1] } }], vlines: [{ x: 1 }], hlines: [{ y: 2, label: 'y = 2' }] }) },
    ],
    quests: [
      { id: Q('rational.flow'), name: 'The Flow Walls', giver: 'catalyst', guided: true, hook: 'Dr. Catalyst: "Flow through my valves follows rational functions. Find the walls it can never cross before the pipes burst."', change: 'The flow valves hold steady at their asymptotes.',
        waves: [wave('Near the wall', times(2, blowupTableStep)), wave('Asymptotes', mixOf([asymptoteCrossStep, haStep, asymptoteCrossStep])), wave('Holes', mixOf([vaHoleStep, holeYStep, vaHoleStep]))] },
      { id: Q('rational.resistor'), name: 'The Resistor Bank', giver: 'volt', hook: 'Volt: "Resistor networks are fractions of polynomials. Simplify them honestly: factors only, no shortcuts."', change: 'The resistor bank reads the right totals.',
        waves: [wave('Simplify', mixOf([simplifyRationalStep, cancelTermsStep, simplifyRationalStep])), wave('Add fractions', times(2, addRationalStep)), wave('Asymptote hunt', mixOf([asymptoteCrossStep, haStep, blowupTableStep, asymptoteCrossStep]))] },
    ],
    concept: conceptFrom([asymptoteCrossStep, vaHoleStep, blowupTableStep, haStep]),
    transfer: oneOf([parallelResistStep, avgCostStep]),
    practice: holeYQ,
  },
  {
    key: K7, title: 'Radicals & Rational Exponents', wing: 'forge', wingName: 'Radical Forge',
    goal: 'Read a^(m/n) as (ⁿ√a)^m, simplify square roots, and solve radical equations by squaring and checking.',
    misconception: 'Reading 8^(2/3) as 8 × 2/3; √ as "divide by 2"; forgetting to check for extraneous (fake) roots after squaring.',
    teach: [
      { title: 'Roots are fractional powers', text: '(8^(1/3))³ = 8¹, so 8^(1/3) must be ∛8 = 2. So a^(1/n) = ⁿ√a and a^(m/n) = (ⁿ√a)^m: the bottom is the root, the top is the power. Root first keeps numbers small.', next: 'Fill in the table. Take the cube root first, then the power: what is 8^(2/3)?', model: { kind: 'table', rowLabels: ['p', '8^p'], rows: [['1/3', '2/3', '1', '4/3'], [null, null, null, null]], label: 'powers of 8' } },
      { title: 'Simplify square roots', text: 'Pull out the biggest perfect square: √72 = √(36·2) = 6√2. A root is not half: √36 = 6, not 18.', visual: card('√72', ['72 = 36 × 2', '√72 = √36 · √2', '= 6√2']) },
      { title: 'Square, solve, then check', text: '√(x + 7) = x + 1 → x + 7 = (x + 1)² → x = 2 or x = −3. Check x = −3: √4 = 2 but −3 + 1 = −2. Squaring can invent fake roots, so check every answer in the ORIGINAL equation.', visual: card('√(x + 7) = x + 1', ['x² + x − 6 = 0', 'x = 2 ✓', 'x = −3 ✗ (extraneous)']) },
    ],
    quests: [
      { id: Q('radicals.forge'), name: 'The Scaling Forge', giver: 'brick', guided: true, hook: 'Brick: "The forge scales parts by fractional powers. Get the root and the power in the right order or the castings crack."', change: 'The forge scales castings without cracks.',
        waves: [wave('Exponent ladder', times(2, fracExpTableStep)), wave('Root then power', mixOf([ratExpChooseStep, ratExpTypedStep, radToExpStep])), wave('Square both sides', seqOf([radicalPair, radicalSetupStep]))] },
      { id: Q('radicals.pipes'), name: 'Diagonal Braces', giver: 'ada', hook: 'Ada: "Brace lengths come out as roots. Simplify them, and check every root I solve for: some are fakes."', change: 'Every diagonal brace is cut to a true length.',
        waves: [wave('Simplify', mixOf([simplifyRadStep, simplifyRadTableStep, simplifyRadStep])), wave('Check your roots', seqOf([extraneousStep, radicalPair, extraneousStep])), wave('Powers', mixOf([ratExpTypedStep, fracExpTableStep, ratExpChooseStep]))] },
    ],
    concept: conceptFrom([fracExpTableStep, simplifyRadTableStep, ratExpChooseStep, radicalSetupStep]),
    transfer: oneOf([tankFaceStep, pendulumStep]),
    practice: ratExpQ,
  },
  {
    key: K8, title: 'Exponential Functions', wing: 'reactor', wingName: 'Growth Reactor',
    goal: 'Model growth and decay with y = a·bˣ, turn a percent into a growth factor, compute compound interest and half-lives, and meet the number e.',
    misconception: 'Treating exponential change as linear (adding instead of multiplying); using 0.08 instead of 1.08 for 8% growth; simple interest in place of compound.',
    teach: [
      { title: 'Multiply, do not add', text: 'Linear change adds the same amount each step: 3, 5, 7, 9. Exponential change multiplies by the same factor: 3, 6, 12, 24. In y = a·bˣ, a is the start and b the factor; b > 1 grows, 0 < b < 1 decays.', steps: ['Line: 3 (start) + 2 (added each step) × 0 (steps) = 3. Curve: 3 (start) × 2⁰ = 3. Both start at 3.', '3 (start) + 2 (added each step) × 3 (steps) = 9: the line adds 2 three times.', '3 (start) × 2³ = 3 × 8 (three doublings) = 24: the curve doubles three times, near the top of the grid.', '3 (start) + 2 (added each step) × 4 (steps) = 11 but 3 (start) × 2⁴ = 48: the curve has left the picture.'], next: 'At x = 2, which is bigger, 3 + 2x or 3·2ˣ? Read it off the graph, then check.', visual: pv([-1, 4, -1, 25], { fns: [{ fn: { kind: 'exp', a: 3, base: 2 }, label: '3·2ˣ' }, { fn: poly([3, 2]), color: 'orange', label: '3 + 2x' }] }) },
      { title: 'Growth factors', text: 'Grow 8% a year: multiply by 1.08 (100% + 8%). Lose 15%: multiply by 0.85. Compound interest: A = P(1 + r/n)^(nt), because every period multiplies again.', steps: ['500 (starting amount) grows 8% (per year), a factor of 1.08 (growth factor per year), for 2 (years): 500 × 1.08² = 500 × 1.1664 = 583.20 (after two years).', '200 (starting amount) loses 15%: 200 (starting amount) × 0.85 (decay factor) = 170 (left).', '1000 (starting amount) at 6% compounded monthly: r/n = 0.06 (yearly rate) ÷ 12 (months) = 0.005 (rate per month), and nt = 12 (months) × 1 (year) = 12 (periods) for one year.', '1000 (starting amount) × 1.005¹² ≈ 1061.68 (monthly compounding), against 1000 (starting amount) × 1.06 (growth factor per year) = 1060 (yearly compounding).'], next: 'Grow 25%, then lose 20%. Multiply the two factors: are you back where you started?', visual: card('growth factor', ['+8%  → × 1.08', '−15% → × 0.85', 'A = P(1 + r/n)^(nt)']) },
      { title: 'The number e', text: 'Compound more and more often: (1 + 1/n)ⁿ climbs 2, 2.59, 2.70, 2.717… and settles at e ≈ 2.718. Continuous growth is A = Pe^(rt).', steps: ['(1 + 1/1)¹ = 2', '(1 + 1/10)¹⁰ = 1.1¹⁰ ≈ 2.5937', '(1 + 1/1000)¹⁰⁰⁰ = 1.001¹⁰⁰⁰ ≈ 2.7169', 'Continuous: 100 (starting amount) at 5% for 10 (years) is 100 × e^(0.05 (yearly rate) × 10 (years)) = 100 × e^0.5 ≈ 164.87 (balance).'], next: 'Work out (1 + 1/2)². Where does it sit in the list?', visual: card('(1 + 1/n)ⁿ', ['n = 1: 2', 'n = 10: 2.5937', 'n = 1000: 2.7169', '→ e ≈ 2.71828']) },
    ],
    quests: [
      { id: Q('exponential.culture'), name: 'The Culture Vats', giver: 'catalyst', guided: true, hook: 'Dr. Catalyst: "My cultures double, my isotopes halve. Tell growth from decay, and adding from multiplying, or the vats overflow."', change: 'The culture vats hold at a safe level.',
        waves: [wave('Grow the table', times(2, growthTableStep)), wave('Linear or exponential', mixOf([linOrExpStep, expPlotStep, linOrExpStep])), wave('Double time', mixOf([doublingSliderStep, halfLifeStep, doublingSliderStep]))] },
      { id: Q('exponential.bank'), name: 'The Guild Bank', giver: 'vector', hook: 'Vector: "The Guild Bank funds the reactor. Interest earns interest here; work it out properly."', change: 'The reactor fund balances to the cent.',
        waves: [wave('Growth factors', mixOf([growthFactorStep, expPlotStep, compoundTableStep])), wave('Compound interest', mixOf([compoundTypedStep, simpleVsCompoundStep, compoundTypedStep])), wave('The number e', mixOf([eLimitStep, continuousStep, doublingSliderStep]))] },
    ],
    concept: conceptFrom([growthTableStep, doublingSliderStep, expPlotStep, growthFactorStep]),
    transfer: oneOf([scrubberStep, sensorNetStep]),
    practice: halfLifeQ,
  },
  {
    key: K9, title: 'Logarithms', wing: 'reactor', wingName: 'Log Gauge Room',
    goal: 'Read a logarithm as an exponent, use the log rules, solve exponential equations (same base or logs), and change base.',
    misconception: 'log(M + N) = log M + log N; log_b N as N ÷ b; forgetting that y = log_b x is the mirror image of y = bˣ.',
    teach: [
      { title: 'A log is an exponent', text: 'log₂ 32 asks: 2 to what power gives 32? 2⁵ = 32, so log₂ 32 = 5. Logs and exponentials undo each other.', steps: ['2⁵ = 2 × 2 × 2 × 2 × 2 = 32, so log₂ 32 = 5 (exponent).', '10³ = 10 × 10 × 10 = 1000, so log₁₀ 1000 = 3 (exponent).', '3 × 3 × 3 × 3 = 81, four 3s, so log₃ 81 = 4 (exponent).', 'On the tower: pick base 2, then try exponents until the readout shows 32. That exponent is the log.'], next: 'Use the tower to find log₅ 125: base 5, which exponent?', model: { kind: 'power', bases: [2, 3, 5, 10], exps: [1, 2, 3, 4, 5, 6] } },
      { title: 'Mirror of the exponential', text: 'y = log₂ x is y = 2ˣ reflected in the line y = x: the point (3, 8) on one becomes (8, 3) on the other. That is why log₂ x has a wall at x = 0.', steps: ['2³ = 2 × 2 × 2 = 8, so (3, 8) is on y = 2ˣ.', 'Swap the coordinates: log₂ 8 = 3, so (8, 3) is on y = log₂ x.', '2⁰ = 1 puts (0, 1) on 2ˣ and (1, 0) on log₂ x.', '2ˣ is never 0 or below, so log₂ x has no value for x ≤ 0: the wall.'], next: 'The point (2, 4) is on y = 2ˣ. Where is its mirror on the log curve?', visual: pv([-2, 9, -2, 9], { fns: [{ fn: { kind: 'exp', a: 1, base: 2 }, label: '2ˣ' }, { fn: { kind: 'log', a: 1, base: 2 }, color: 'orange', label: 'log₂ x' }, { fn: poly([0, 1]), color: 'muted', dashed: true }] }) },
      { title: 'The rules', text: 'Logs turn multiplying into adding. Why: if M = bᵖ and N = b^q, then MN = b^(p+q), so log(MN) = p + q = log M + log N. They do NOT split a sum. ln x means logₑ x, the natural log, so ln eᵏ = k.', steps: ['log₂ (8 × 4) = log₂ 32 = 5, and log₂ 8 + log₂ 4 = 3 + 2 = 5.', 'log₂ (8 ÷ 4) = log₂ 2 = 1 = 3 − 2.', 'log₂ (8²) = 2 × log₂ 8 = 2 × 3 = 6, and 8² = 64 = 2⁶.', 'log₂ 10 = log 10 ÷ log 2 ≈ 1 ÷ 0.3010 ≈ 3.32.', 'log₂ (8 + 8) = log₂ 16 = 4, not log₂ 8 + log₂ 8 = 6.'], next: 'Write log₃ 9 + log₃ 27 as one log. What number is it?', visual: card('log rules', ['log(MN) = log M + log N', 'log(M/N) = log M − log N', 'log(Mᵏ) = k·log M', 'log_b N = log N ÷ log b', 'log(M + N) ≠ log M + log N']) },
    ],
    quests: [
      { id: Q('logarithms.gauge'), name: 'The Log Gauges', giver: 'vector', guided: true, hook: 'Vector: "These gauges read in powers, not amounts. Build each reading as a power and the needles settle."', change: 'The log gauges settle on true readings.',
        waves: [wave('Build the power', times(3, logPowerStep)), wave('Undo the exponential', mixOf([inversePlotStep, expToLogStep, inversePlotStep])), wave('Read the log', mixOf([logTypedStep, lnSolveStep]))] },
      { id: Q('logarithms.reactor'), name: 'Reactor Exponents', giver: 'catalyst', hook: 'Dr. Catalyst: "The reactor equations hide x in the exponent. Bring it down with the rules, not with guesses."', change: 'The reactor exponents are solved and the core steadies.',
        waves: [wave('Log rules', mixOf([logProductStep, logPowerStep, logProductStep])), wave('Solve for the exponent', seqOf([expPair, changeBaseStep, expSetupStep])), wave('Shifted logs', mixOf([logGraphPickStep, changeBaseStep, logGraphPickStep]))] },
    ],
    concept: conceptFrom([logPowerStep, inversePlotStep, logGraphPickStep, expSetupStep]),
    transfer: oneOf([pHStep, decibelStep, doublingTimeStep]),
    practice: logQ,
  },
  {
    key: K10, title: 'Sequences & Series', wing: 'stairs', wingName: 'Sequence Stairs',
    goal: 'Tell arithmetic from geometric sequences, write the nth term, add finite arithmetic and geometric series, and sum an infinite geometric series when |r| < 1.',
    misconception: 'aₙ = a₁ + n·d (off by one step); calling any growing list arithmetic; applying a₁/(1 − r) when |r| ≥ 1.',
    teach: [
      { title: 'Add or multiply', text: 'Arithmetic: add the same d each step (3, 7, 11, 15; d = 4). Geometric: multiply by the same r (3, 6, 12, 24; r = 2). aₙ = a₁ + (n − 1)d, because the first term has had no steps yet.', steps: ['Each step right in the table adds d = 4: 3 (first term) + 4 (common difference) = 7 (second term).', 'Term 10 directly: 10 − 1 = 9 (steps from the first term), so 3 (first term) + 9 (steps) × 4 (common difference) = 3 + 36 = 39.', 'Geometric 3, 6, 12, 24 uses aₙ = a₁·rⁿ⁻¹: term 4 is 3 (first term) × 2³ = 3 × 8 = 24 (fourth term).'], next: 'Fill in a₃ and a₄, then check a₄ with aₙ = a₁ + (n − 1)d.', model: { kind: 'table', rowLabels: ['n', 'aₙ'], rows: [[1, 2, 3, 4], [3, 7, null, null]], label: 'arithmetic, d = 4' } },
      { title: 'Adding a sequence', text: 'Pair first with last: 1 + 100, 2 + 99, … every pair is 101 and there are 50 pairs: 5050. So Sₙ = n(a₁ + aₙ)/2. Geometric: S − rS = a₁ − a₁rⁿ (everything else cancels), so Sₙ = a₁(rⁿ − 1)/(r − 1).', steps: ['1 + 100 = 101, 2 + 99 = 101, …: 100 (terms) ÷ 2 = 50 (pairs).', '50 (pairs) × 101 (each pair) = 5050 (total)', 'Formula check: 100 (terms) × (1 + 100) ÷ 2 = 5050 (total).', 'Geometric: 3 + 6 + 12 + 24 = 45, and 3(2⁴ − 1)/(2 − 1) = 3 (first term) × 15 = 45 (total).'], next: 'Pair them up: what is 2 + 4 + 6 + … + 20?', visual: card('1 + 2 + … + 100', ['pairs: 1 + 100 = 101', '50 pairs × 101 = 5050', 'Sₙ = n(a₁ + aₙ)/2']) },
      { title: 'Infinite sums', text: '8 + 4 + 2 + 1 + … never passes 16: each term closes half the gap. When |r| < 1 the total settles at a₁/(1 − r). When |r| ≥ 1 there is no finite total.', steps: ['4 (second term) ÷ 8 (first term) = 1/2 (common ratio), so a₁ = 8 and r = 1/2.', 'Running totals, one dot each: 8, 8 + 4 = 12, 12 + 2 = 14, 14 + 1 = 15, then 15.5, 15.75.', 'The gap to 16 halves each time: 8, 4, 2, 1, 0.5, 0.25.', '8 (first term) ÷ (1 − 1/2) = 8 ÷ 0.5 = 16 (total): the line the dots creep up to.'], next: 'Where does 9 + 3 + 1 + … settle? Find r first.', visual: pv([0, 7, 0, 18], { points: [{ x: 1, y: 8 }, { x: 2, y: 12 }, { x: 3, y: 14 }, { x: 4, y: 15 }, { x: 5, y: 15.5 }, { x: 6, y: 15.75 }], hlines: [{ y: 16, label: 'S = 16' }] }) },
    ],
    quests: [
      { id: Q('sequences.stairs'), name: 'The Sequence Stairs', giver: 'ada', guided: true, hook: 'Ada: "Each flight of these stairs follows a rule. Find the rule and the missing steps appear."', change: 'The missing stairs slide into place.',
        waves: [wave('Fill the pattern', mixOf([arithTableStep, geomTableStep, arithTableStep])), wave('Which kind', times(2, seqTypeStep)), wave('Term by term', mixOf([seqPlotStep, nthTermStep, seqPlotStep]))] },
      { id: Q('sequences.signal'), name: 'The Repeater Line', giver: 'volt', hook: 'Volt: "Signal repeaters along the line boost by steps and by factors. I need the nth one and the running totals."', change: 'The repeater line carries the signal end to end.',
        waves: [wave('nth term', mixOf([seqPlotStep, nthTypedGeomStep, nthTypedArithStep])), wave('Partial sums', mixOf([arithSumStep, geomSumStep, partialSumTableStep])), wave('Forever', mixOf([divergeSumStep, partialSumTableStep, convergeSumStep]))] },
    ],
    concept: conceptFrom([arithTableStep, geomTableStep, seqPlotStep, partialSumTableStep]),
    transfer: oneOf([pipeStackStep, dampingStep]),
    practice: nthArithQ,
  },
  {
    key: 'trial', title: 'Mastery Trial', wing: 'core', wingName: 'The Function Core',
    goal: 'Prove durable mastery of Algebra 2 under trial rules and seat the Function Core.',
    misconception: 'One lucky run is mastery; skipping the weak chapter; memorising forms without knowing why they work.',
    teach: [
      { title: 'Trial rules', text: 'Five phases across the whole academy, one helper you may use once, 80% to pass. Every chapter must already be mastered.', visual: card('The Mastery Trial', ['Functions & quadratics', 'Complex numbers & polynomials', 'Rational & radical', 'Exponentials & logs', 'Sequences & transfer']) },
    ],
    quests: [
      { id: Q('trial.rehearsal'), name: 'Trial Rehearsal', giver: 'vector', guided: true, hook: 'Vector: "Before the Core chamber, a rehearsal. Same shape as the Trial, no stakes."', change: 'The Function Core chamber unseals.',
        waves: [wave('Functions & quadratics', mixOf([vertexShiftStep, vertexStandardTapStep, discCountStep])), wave('Numbers & polynomials', mixOf([multComplexStep, syntheticTableStep, asymptoteCrossStep, ratExpChooseStep])), wave('Growth & sequences', mixOf([logPowerStep, growthFactorStep, arithTableStep]))] },
      { id: Q('trial.keeper'), name: 'The Core Keeper', giver: 'newton', hook: 'Newton: "The Keeper asks from anywhere in the academy, in situations you have not seen. Answer like an engineer."', change: 'The Core Keeper steps aside.',
        waves: [wave('Anything', mixOf([archWidthStep, impedanceStep, parallelResistStep, pHStep, sensorNetStep])), wave('Anywhere', mixOf([boxVolumeStep, signalDelayStep, pipeStackStep, flareLandStep, tankFaceStep]))] },
    ],
    concept: conceptFrom([vertexStandardTapStep, complexPlotStep, inversePlotStep]),
    transfer: oneOf([signalDelayStep, archWidthStep, flareLandStep, impedanceStep, boxVolumeStep, parallelResistStep, tankFaceStep, scrubberStep, pHStep, pipeStackStep]),
  },
];

export const ALGEBRA2 = defineAcademy({
  id: ID,
  name: 'Algebra 2 Academy',
  short: 'Algebra 2',
  tier: 'High School',
  blurb: 'Quadratics, polynomials, exponentials and logarithms, sequences, complex numbers.',
  icon: 'book',
  home: 'algebra-city',
  wings: {
    foundry: { name: 'Function Foundry', icon: 'factory' },
    arches: { name: 'Parabola Bridge', icon: 'bridge' },
    observatory: { name: 'Imaginary Observatory', icon: 'telescope' },
    works: { name: 'Polynomial Works', icon: 'gear' },
    forge: { name: 'Radical Forge', icon: 'anvil' },
    reactor: { name: 'Growth Reactor', icon: 'reactor' },
    stairs: { name: 'Sequence Stairs', icon: 'level-up' },
    core: { name: 'The Function Core', icon: 'crystal' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'Functions & quadratics', items: [vertexShiftStep(rng), shiftWordsStep(rng), reflectPointStep(rng), vertexFormTapStep(rng), convertVertexStep(rng), zerosTapStep(rng), discCountStep(rng), quadFormulaTypedStep(rng)] },
    { name: 'Complex & polynomials', items: [iPowerStep(rng), multComplexStep(rng), complexRootsStep(rng), bounceTapStep(rng), syntheticTableStep(rng), remainderTypedStep(rng)] },
    { name: 'Rational & radical', items: [asymptoteCrossStep(rng), vaHoleStep(rng), ratExpTypedStep(rng), radicalSetupStep(rng)] },
    { name: 'Exponentials & logs', items: [growthFactorStep(rng), halfLifeStep(rng), logPowerStep(rng), expSetupStep(rng), logProductStep(rng)] },
    { name: 'Sequences & transfer', items: [arithTableStep(rng), infiniteSumStep(rng), geomSumStep(rng), archWidthStep(rng), pHStep(rng)] },
  ],
  trialIntro: 'The Mastery Trial. Five phases across all of Algebra 2, one helper, 80% to pass. The Function Core is waiting for its engineer.',
  coreName: 'The Function Core',
  coreLine: 'Shifts, parabolas, complex roots, polynomials, asymptotes, powers, logs and series: the Function Core locks into the Engine, its curves glowing in the Foundry, and the road to the Trigonometry Academy opens.',
  coreColor: '#34d399',
  title: 'Function Engineer',
});
