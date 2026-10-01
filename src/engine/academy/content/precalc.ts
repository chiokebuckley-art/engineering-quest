/**
 * The Pre-Calculus Academy: functions in depth, polynomial and rational functions, exponential and
 * log models, trig functions of real numbers, polar form and complex numbers, 2D vectors, parametric
 * motion, sequences and series, conic sections and a limits preview, then the Mastery Trial.
 * Graduation opens the Calculus Academy. See ../CONTENT_GUIDE.md.
 */
import type { Visual } from '../../types';
import type { PlotLayers } from '../types';
import type { Fn } from '../fn';
import { defineAcademy, type ChapterSpec } from '../defs';
import {
  academySkill, mkq, typed, choose, model, ask, wave, mixOf, conceptFrom, oneOf, rint, pick, rnz, fmt, fmtSigned,
  coefTerm, polyStr, fracStr, simplify, evalFn, type Rng, type AskStep, type Question,
} from '../kit';
import { lab, labn } from '../../label';

const ID = 'precalc';
const S = (key: string) => academySkill(ID, key);

/* ================================================================== */
/* shared helpers                                                      */
/* ================================================================== */
type Range = [number, number, number, number];
type Col = 'teal' | 'orange' | 'ask' | 'label' | 'muted';
const plotV = (range: Range, layers: PlotLayers): Visual => ({ type: 'plot', range, layers });
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });
const poly = (...c: number[]): Fn => ({ kind: 'poly', c });
/** 'mx + b' with clean signs. */
const lin = (m: number, b: number, v = 'x') => polyStr([b, m], v);
/** 'x − a' / 'x + a' / 'x'. */
const xm = (a: number, v = 'x') => (a === 0 ? v : a > 0 ? `${v} − ${fmt(a)}` : `${v} + ${fmt(-a)}`);
/** A factor '(x − a)', or 'x' when a = 0. */
const fac = (a: number, v = 'x') => (a === 0 ? v : `(${xm(a, v)})`);
/** Wrap negatives in brackets for substitution: par(−3) → '(−3)'. */
const par = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
const SUPS: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻', x: 'ˣ', t: 'ᵗ', n: 'ⁿ', k: 'ᵏ', '(': '⁽', ')': '⁾', ' ': '' };
const sup = (s: string | number) => String(s).split('').map((c) => SUPS[c] ?? c).join('');
const sub = (n: number) => String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
/** Multiply two coefficient arrays (low → high). */
function pmul(a: number[], b: number[]): number[] {
  const out = Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => { out[i + j] += x * y; }));
  return out;
}
/** Coefficients of (x − r1)(x − r2)… */
const fromRoots = (roots: number[], lead = 1) => roots.reduce((acc, r) => pmul(acc, [-r, 1]), [lead]);
/** Integers in [lo, hi] that satisfy pred, as strings (for number-line accepts). */
const intsWhere = (lo: number, hi: number, pred: (x: number) => boolean) => { const out: string[] = []; for (let x = lo; x <= hi; x++) if (pred(x)) out.push(String(x)); return out; };
const LETTERS = ['A', 'B', 'C', 'D'];
/**
 * Pick-the-graph: `visuals[right]` is correct. Options are shuffled, then labelled Graph A, B, C, D in
 * display order so the labels read in order on the screen.
 */
function pickGraph(rng: Rng, q: Question, visuals: Visual[], right = 0): AskStep {
  const order = rng.shuffle(visuals.map((_, i) => i));
  const options = order.map((i, k) => ({ visual: visuals[i], label: `Graph ${LETTERS[k]}` }));
  const label = `Graph ${LETTERS[order.indexOf(right)]}`;
  return ask({ ...q, answerText: label }, 'pickmodel', { options, accept: [label] });
}
/** A parametric curve drawn as short segments on a plot. */
function pathSegs(f: (t: number) => [number, number], t0: number, t1: number, n = 64, color: Col = 'teal'): NonNullable<PlotLayers['segments']> {
  const out: NonNullable<PlotLayers['segments']> = []; let prev = f(t0);
  for (let i = 1; i <= n; i++) { const p = f(t0 + ((t1 - t0) * i) / n); out.push({ a: [r4(prev[0]), r4(prev[1])], b: [r4(p[0]), r4(p[1])], color }); prev = p; }
  return out;
}
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const r2 = (n: number) => Math.round(n * 100) / 100;
const ellipseSegs = (a: number, b: number, h = 0, k = 0, color: Col = 'teal') => pathSegs((t) => [h + a * Math.cos(t), k + b * Math.sin(t)], 0, 2 * Math.PI, 72, color);
/** Hyperbola x²/a² − y²/b² = 1 (or the vertical one), both branches. */
const hyperSegs = (a: number, b: number, vertical: boolean, color: Col = 'teal') => {
  const br = (s: number) => pathSegs((t) => (vertical ? [b * Math.sinh(t), s * a * Math.cosh(t)] : [s * a * Math.cosh(t), b * Math.sinh(t)]), -2.2, 2.2, 40, color);
  return [...br(1), ...br(-1)];
};

/* ---- unit circle tables ---- */
const SPECIAL = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const RADS: Record<number, string> = { 0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π', 210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2', 300: '5π/3', 315: '7π/4', 330: '11π/6' };
const rad = (d: number) => { const m = ((d % 360) + 360) % 360; return d < 0 && RADS[-d] ? `−${RADS[-d]}` : RADS[m] ?? `${d}°`; };
const EXACT: Record<string, string> = { '0': '0', '0.5': '1/2', '0.7071': '√2/2', '0.866': '√3/2', '1': '1', '0.5774': '√3/3', '1.7321': '√3' };
function exact(v: number): string { const key = String(Math.round(Math.abs(v) * 1e4) / 1e4); const t = EXACT[key] ?? fmt(v); return v < -1e-9 && t !== '0' ? `−${t}` : t; }
type Trig = 'sin' | 'cos' | 'tan';
const trigAt = (f: Trig, deg: number) => { const r = (deg * Math.PI) / 180; const v = f === 'sin' ? Math.sin(r) : f === 'cos' ? Math.cos(r) : Math.tan(r); return Math.abs(v) < 1e-9 ? 0 : v; };
const QUAD_RANGE = ['0 and π/2', 'π/2 and π', 'π and 3π/2', '3π/2 and 2π'];
/** (n/d)·π written simply: piStr(1, 2) → 'π/2', piStr(4, 1) → '4π'. */
const piStr = (n: number, d = 1) => { if (n === 0) return '0'; const [a, b] = simplify(n, d); const top = a === 1 ? 'π' : a === -1 ? '−π' : `${fmt(a)}π`; return b === 1 ? top : `${top}/${b}`; };
/** Any whole number of degrees as a multiple of π: 15 → 'π/12'. */
const radStr = (deg: number) => piStr(deg, 180);

/* ---- inequality solution sets ---- */
type Ineq = '<' | '>' | '≤' | '≥';
const INEQS: Ineq[] = ['<', '>', '≤', '≥'];
const holds = (v: number, op: Ineq) => (op === '<' ? v < 0 : op === '>' ? v > 0 : op === '≤' ? v <= 0 : v >= 0);
const flipOp = (op: Ineq): Ineq => (op === '<' ? '>' : op === '>' ? '<' : op === '≤' ? '≥' : '≤');
const strictOp = (op: Ineq): Ineq => (op === '<' ? '≤' : op === '≤' ? '<' : op === '>' ? '≥' : '>');
/**
 * The set where pred holds, as intervals: the sign can only change at the critical points, so test one x in
 * each open piece and each critical point itself (points in `undef` are outside the domain).
 */
function solSet(pred: (x: number) => boolean, crit: number[], undef: number[] = []): string {
  const cs = [...new Set(crit)].sort((u, v) => u - v);
  const pieces: { inc: boolean; point?: number; lo?: number; hi?: number }[] = [];
  for (let i = 0; i <= cs.length; i++) {
    const lo = i === 0 ? undefined : cs[i - 1]; const hi = i === cs.length ? undefined : cs[i];
    const t = lo === undefined ? (hi as number) - 1 : hi === undefined ? lo + 1 : (lo + hi) / 2;
    pieces.push({ inc: pred(t), lo, hi });
    if (i < cs.length) pieces.push({ inc: !undef.includes(cs[i]) && pred(cs[i]), point: cs[i] });
  }
  const runs: string[] = [];
  for (let i = 0; i < pieces.length; i++) {
    if (!pieces[i].inc) continue;
    let j = i; while (j + 1 < pieces.length && pieces[j + 1].inc) j++;
    const a = pieces[i]; const b = pieces[j];
    if (i === j && a.point !== undefined) runs.push(`{${fmt(a.point)}}`);
    else {
      const L = a.point !== undefined ? `[${fmt(a.point)}` : a.lo === undefined ? '(−∞' : `(${fmt(a.lo)}`;
      const R = b.point !== undefined ? `${fmt(b.point)}]` : b.hi === undefined ? '∞)' : `${fmt(b.hi)})`;
      runs.push(`${L}, ${R}`);
    }
    i = j;
  }
  return runs.length ? runs.join(' ∪ ') : 'no solution';
}

/* ================================================================== */
/* 1. Functions in depth                                               */
/* ================================================================== */
const K1 = 'functions';
const APP1 = 'Control systems chain functions: a sensor feeds a converter feeds a display, and calibration needs inverses.';

function composeValueStep(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, -2, 4]); const b = rnz(rng, -5, 5); const c = rnz(rng, -4, 4); const k = rnz(rng, -3, 3);
  const inner = rng.next() < 0.6;
  const fS = lin(a, b); const gS = polyStr([c, 0, 1]);
  let ans: number; let steps: string[];
  if (inner) { const gk = k * k + c; ans = a * gk + b; steps = [`Work inside out: g(${fmt(k)}) = ${par(k)}² ${fmtSigned(c)} = ${lab(fmt(gk), 'output of g')}.`, `Feed it to f: f(${fmt(gk)}) = ${fmt(a)}·${par(gk)} ${fmtSigned(b)} = ${lab(fmt(ans), 'final output')}.`]; }
  else { const fk = a * k + b; ans = fk * fk + c; steps = [`Work inside out: f(${fmt(k)}) = ${fmt(a)}·${par(k)} ${fmtSigned(b)} = ${lab(fmt(fk), 'output of f')}.`, `Feed it to g: g(${fmt(fk)}) = ${par(fk)}² ${fmtSigned(c)} = ${lab(fmt(ans), 'final output')}.`]; }
  const q = mkq(S(K1), 'composition', {
    prompt: `Ada chains two machines: one's output feeds the other. f(x) = ${fS}, g(x) = ${gS}.`,
    expression: inner ? `f(g(${fmt(k)})) = ?` : `g(f(${fmt(k)})) = ?`, answer: ans,
    hint: 'Work from the inside out: evaluate the inner function first, then feed that number to the outer one.',
    steps, visual: card('Machine chain', [`f(x) = ${fS}`, `g(x) = ${gS}`, inner ? `${fmt(k)} → g → f` : `${fmt(k)} → f → g`]), app: APP1,
  });
  return typed(q);
}

function composeTableStep(rng: Rng): AskStep {
  const m = pick(rng, [2, 3, -1, -2]); const p = rint(rng, -3, 3); const c = rnz(rng, -5, 5);
  const g = (x: number) => m * x + p; const f = (x: number) => x * x + c;
  const xs = rng.shuffle([-2, -1, 0, 1, 2, 3]).slice(0, 3).sort((u, v) => u - v);
  const rows: (number | null)[][] = [[xs[0], g(xs[0]), f(g(xs[0]))], [xs[1], null, null], [xs[2], null, null]];
  const acc = [g(xs[1]), f(g(xs[1])), g(xs[2]), f(g(xs[2]))].map(String).join(',');
  const q = mkq(S(K1), 'composition', {
    prompt: `Signal chain: x goes through g(x) = ${lin(m, p)}, then through f(x) = ${polyStr([c, 0, 1])}.`,
    expression: 'Fill the f(g(x)) table', answer: f(g(xs[1])),
    hint: 'Each row: put x into g first. Whatever g gives you is the input to f.',
    steps: [`Inner function first: g(${fmt(xs[1])}) = ${lab(fmt(g(xs[1])), 'input for f')}, g(${fmt(xs[2])}) = ${lab(fmt(g(xs[2])), 'input for f')}.`, `Then f: f(${fmt(g(xs[1]))}) = ${lab(fmt(f(g(xs[1]))), 'f of g')}, f(${fmt(g(xs[2]))}) = ${lab(fmt(f(g(xs[2]))), 'f of g')}.`], app: APP1,
  });
  return model(q, { kind: 'table', cols: ['x', 'g(x)', 'f(g(x))'], rows, label: 'x → g → f' }, [acc], 'Fill each row inside out: g(x) first, then f of that.');
}

function composeOrderStep(rng: Rng): AskStep {
  const a = rnz(rng, -6, 6); const b = pick(rng, [2, 3, 4, -2, 5]);
  const fg = rng.next() < 0.5;
  const fS = lin(1, a); const gS = coefTerm(b, 'x');
  const fOfG = polyStr([a, b]); const gOfF = polyStr([a * b, b]); const prod = polyStr([0, a * b, b]); const sum = polyStr([a, b + 1]);
  const right = fg ? fOfG : gOfF;
  const q = mkq(S(K1), 'composition-order', {
    prompt: `f(x) = ${fS} adds a fixed offset; g(x) = ${gS} scales. Which is ${fg ? 'f(g(x))' : 'g(f(x))'}?`,
    expression: fg ? 'f(g(x)) = ?' : 'g(f(x)) = ?', answer: 0,
    hint: `${fg ? 'f(g(x))' : 'g(f(x))'} means: do the inside function first, then put the whole result into the outside one.`,
    steps: fg ? [`Replace the x in f with g(x): f(${gS}) = ${gS} ${fmtSigned(a)}.`, `f(g(x)) = ${fOfG}. (g(f(x)) = ${gOfF} is different: order matters.)`]
      : [`Replace the x in g with f(x): g(${fS}) = ${fmt(b)}(${fS}).`, `g(f(x)) = ${gOfF}. (f(g(x)) = ${fOfG} is different: order matters.)`],
    visual: card('Two machines', [`f(x) = ${fS}`, `g(x) = ${gS}`]), app: APP1,
  });
  return choose(rng, q, right, [fg ? gOfF : fOfG, prod, sum]);
}

function inverseValueStep(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, 4, 5, -2]); let b = rnz(rng, -9, 9); const t = rint(rng, -3, 6);
  // f(t) = t would make the reading equal the answer
  while (a * t + b === t) b = rnz(rng, -9, 9);
  const k = a * t + b; const fk = a * k + b;
  const q = mkq(S(K1), 'inverse', {
    prompt: `Volt's sensor turns temperature x into a reading f(x) = ${lin(a, b)}. The reading is ${fmt(k)}. What temperature made it?`,
    expression: `f⁻¹(${fmt(k)}) = ?`, answer: 0,
    hint: 'f⁻¹ runs the machine backwards: which input x does f send to this reading? (f⁻¹ is not 1 over f.)',
    steps: [`f⁻¹ undoes f: solve ${lin(a, b)} = ${lab(fmt(k), 'reading')}.`, `${coefTerm(a, 'x')} = ${fmt(k - b)}, so x = ${lab(fmt(t), 'temperature')}.`, `Check: f(${fmt(t)}) = ${lab(fmt(k), 'reading')}.`],
    visual: card('Undo the sensor', [`f(x) = ${lin(a, b)}`, `reading = ${fmt(k)}`]), app: APP1,
  });
  return choose(rng, q, fmt(t), [...(fk ? [fracStr(1, fk)] : []), fmt(fk), fracStr(k + b, a), fmt(t + 1)]);
}

function inverseReflectStep(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, -2, -1]); const b = rint(rng, -3, 3);
  let p = 0; let qv = 0; let g = 0;
  do { p = rint(rng, -3, 3); qv = a * p + b; } while ((qv === p || Math.abs(qv) > 6) && g++ < 40);
  if (qv === p || Math.abs(qv) > 6) { p = 1; qv = a + b; }
  const q = mkq(S(K1), 'inverse-graph', {
    prompt: `Volt's sensor line f(x) = ${lin(a, b)} passes through (${fmt(p)}, ${fmt(qv)}). The graph of f⁻¹ is f mirrored in the line y = x.`,
    expression: `Point on f⁻¹?`, answer: 0, answerText: `(${fmt(qv)}, ${fmt(p)})`,
    hint: 'Mirroring in y = x swaps the roles of input and output.',
    steps: [`f sends ${lab(fmt(p), 'input')} to ${lab(fmt(qv), 'output')}, so f⁻¹ sends ${lab(fmt(qv), 'input')} back to ${lab(fmt(p), 'output')}.`, `Swap the coordinates: (${fmt(p)}, ${fmt(qv)}) → (${fmt(qv)}, ${fmt(p)}).`], app: APP1,
  });
  return model(q, { kind: 'plot', range: [-7, 7, -7, 7], count: 1, label: 'f (teal), y = x (dashed)', layers: { fns: [{ fn: poly(b, a), label: 'f' }, { fn: poly(0, 1), dashed: true, color: 'muted' }], points: [{ x: p, y: qv, label: `(${fmt(p)}, ${fmt(qv)})` }] } },
    [`${qv},${p}`], 'Tap the matching point on the graph of f⁻¹.');
}

function inverseGraphPick(rng: Rng): AskStep {
  const R: Range = [-5, 5, -5, 5];
  const yx = { fn: poly(0, 1), dashed: true, color: 'muted' as Col };
  let fS: string; let f: Fn; let cands: Fn[];
  let inv = 'f⁻¹';
  if (rng.next() < 0.6) {
    const b0 = pick(rng, [2, 3, 0]); const base = b0 || Math.E; // 0 = e: the pair eˣ and ln x
    fS = b0 ? `${b0}ˣ` : 'eˣ'; f = { kind: 'exp', a: 1, base }; inv = b0 ? `log${sub(b0)} x` : 'ln x';
    cands = [{ kind: 'log', a: 1, base: b0 }, { kind: 'exp', a: -1, base }, { kind: 'exp', a: 1, base: 1 / base }, { kind: 'log', a: -1, base: b0 }];
  } else {
    const m = pick(rng, [2, 3]); const c = pick(rng, [1, 2, -1, -2]);
    fS = lin(m, c); f = poly(c, m); inv = `(${xm(c)})/${m}`;
    cands = [poly(-c / m, 1 / m), poly(-c, -m), poly(c, -m), { kind: 'rational', num: [1], den: [c, m] }];
  }
  const vis = cands.map((g): Visual => plotV(R, { fns: [{ fn: f, color: 'muted', dashed: true }, yx, { fn: g, color: 'teal' }] }));
  const q = mkq(S(K1), 'inverse-graph', {
    prompt: `The dashed curve is f(x) = ${fS}. Which teal curve is f⁻¹?`, expression: `f⁻¹ for f(x) = ${fS}`, answer: 0,
    hint: 'The inverse is the mirror image of f in the line y = x, not in an axis, and not 1/f.',
    steps: ['Swap x and y: every point (a, b) on f becomes (b, a) on f⁻¹.', `That is a reflection in the line y = x: f⁻¹(x) = ${inv}.`],
    visual: card('Inverse', [`f(x) = ${fS}`, 'f⁻¹ undoes f']), app: APP1,
  });
  return pickGraph(rng, q, vis, 0);
}

function inverseFormulaChoose(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, 4, 5]); const b = rnz(rng, -6, 6); const divForm = rng.next() < 0.5;
  // divForm: f(x) = (x − b)/a, so f⁻¹(x) = ax + b. Otherwise f(x) = ax + b, so f⁻¹(x) = (x − b)/a.
  const fS = divForm ? `(${xm(b)})/${a}` : lin(a, b);
  const right = divForm ? lin(a, b) : `(${xm(b)})/${a}`;
  const wrongs = divForm ? [lin(a, -b), lin(a, a * b), `${a}/(${xm(b)})`, `(${xm(-b)})/${a}`]
    : [`(${xm(-b)})/${a}`, `x/${a} ${fmtSigned(-b)}`, `1/(${lin(a, b)})`, lin(a, -b)];
  const q = mkq(S(K1), 'inverse', {
    prompt: `Volt's gauge maps a reading x to f(x) = ${fS}. Which formula undoes it?`, expression: 'f⁻¹(x) = ?', answer: 0,
    hint: 'List what f does to x, in order. f⁻¹ undoes those steps in REVERSE order, each with its opposite. (f⁻¹ is not 1/f.)',
    steps: divForm ? [`f ${b > 0 ? `subtracts ${b}` : `adds ${-b}`}, then divides by ${a}.`, `Undo in reverse: multiply by ${a}, then ${b > 0 ? `add ${b}` : `subtract ${-b}`}: f⁻¹(x) = ${right}.`, `Check: f(f⁻¹(x)) = (${right} ${fmtSigned(-b)})/${a} = x.`]
      : [`f multiplies by ${a}, then ${b > 0 ? `adds ${b}` : `subtracts ${-b}`}.`, `Undo in reverse: ${b > 0 ? `subtract ${b}` : `add ${-b}`}, then divide by ${a}: f⁻¹(x) = ${right}.`, `Check: f(f⁻¹(x)) = ${a}·${right} ${fmtSigned(b)} = x.`],
    visual: card('Swap and solve', [`y = ${fS}`, 'swap x and y, solve for y']), app: APP1,
  });
  return choose(rng, q, right, wrongs);
}

function oneToOnePick(rng: Rng): AskStep {
  const R: Range = [-4, 4, -5, 5];
  const good = pick(rng, [{ fn: poly(0, 0, 0, 0.25), s: 'x³/4' }, { fn: { kind: 'exp', a: 1, base: 2, k: -2 } as Fn, s: '2ˣ − 2' }, { fn: poly(1, 0, 0, -0.25), s: '1 − x³/4' }]);
  const bad: Fn[] = [poly(-3, 0, 1), { kind: 'abs', a: 1, k: -2 }, poly(0, -1.5, 0, 0.5)];
  const q = mkq(S(K1), 'one-to-one', {
    prompt: 'Ada can only calibrate a sensor whose curve can be run backwards. Which graph has an inverse function?', expression: 'Horizontal line test', answer: 0,
    hint: 'Slide a horizontal line up and down each graph. If it ever hits the curve twice, two inputs share one output and f⁻¹ could not choose.',
    steps: ['x² − 3, |x| − 2 and the wavy cubic all give the same output for two different inputs (a horizontal line hits them twice).', `Only y = ${good.s} is one-to-one: every horizontal line hits it at most once, so it has an inverse.`],
    visual: card('One-to-one', ['each output comes from', 'exactly one input']), app: APP1,
  });
  return pickGraph(rng, q, [plotV(R, { fns: [{ fn: good.fn }] }), ...bad.map((b) => plotV(R, { fns: [{ fn: b }] }))], 0);
}

function piecewisePlotStep(rng: Rng): AskStep {
  const k = rint(rng, -2, 2); const leftOwns = rng.next() < 0.5;
  const m1 = pick(rng, [1, -1, 2, 0]); const m2 = pick(rng, [1, -1, -2, 0]);
  const yL = rint(rng, -4, 4); let yR = rint(rng, -4, 4); if (yR === yL) yR = yL > 0 ? yL - 3 : yL + 3;
  const c1 = yL - m1 * k; const c2 = yR - m2 * k; const own = leftOwns ? yL : yR;
  const lS = lin(m1, c1); const rS = lin(m2, c2);
  const q = mkq(S(K1), 'piecewise', {
    prompt: `A thermostat's rule switches at x = ${fmt(k)}: f(x) = ${lS} for x ${leftOwns ? '≤' : '<'} ${fmt(k)}, and ${rS} for x ${leftOwns ? '>' : '≥'} ${fmt(k)}.`,
    expression: `(${fmt(k)}, f(${fmt(k)})) = ?`, answer: 0, answerText: `(${fmt(k)}, ${fmt(own)})`,
    hint: `Both pieces reach x = ${lab(fmt(k), 'switch point')} on the graph, but only one owns it. Which rule has the "or equal" sign?`,
    steps: [`x = ${lab(fmt(k), 'switch point')} fits "x ${leftOwns ? '≤' : '≥'} ${fmt(k)}", so the ${leftOwns ? 'left' : 'right'} rule ${leftOwns ? lS : rS} owns the boundary.`, `f(${fmt(k)}) = ${lab(fmt(own), 'owned value')}: a solid dot at (${fmt(k)}, ${fmt(own)}). The other piece gets an open dot at (${fmt(k)}, ${fmt(leftOwns ? yR : yL)}).`], app: 'Tax brackets, gear shifts and thermostat rules are piecewise functions.',
  });
  const layers: PlotLayers = { fns: [{ fn: poly(c1, m1), from: -6, to: k }, { fn: poly(c2, m2), from: k, to: 6, color: 'orange' }] };
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: 'The two pieces (no dots yet)', layers }, [`${k},${own}`], `Tap the point the function really has at x = ${fmt(k)}.`);
}

function piecewiseStep(rng: Rng): AskStep {
  const k = pick(rng, [-1, 0, 1, 2]); const p = rint(rng, -3, 3); const m = pick(rng, [1, 2, 3, -1]); let n = rint(rng, -3, 3);
  if (m * k + n === k * k + p) n += 1;
  const atK = rng.next() < 0.6; const x = atK ? k : k + pick(rng, [-2, -1, 1, 2]);
  const left = (t: number) => t * t + p; const right = (t: number) => m * t + n;
  const ans = x < k ? left(x) : right(x); const other = x < k ? right(x) : left(x);
  const fn: Fn = { kind: 'piece', parts: [{ from: -5, to: k, fn: poly(p, 0, 1) }, { from: k, to: 5, fn: poly(n, m) }] };
  const q = mkq(S(K1), 'piecewise', {
    prompt: `A valve's flow rule switches at x = ${fmt(k)}: f(x) = ${polyStr([p, 0, 1])} for x < ${fmt(k)}, and ${lin(m, n)} for x ≥ ${fmt(k)}.`,
    expression: `f(${fmt(x)}) = ?`, answer: 0,
    hint: `First decide which piece owns x = ${fmt(x)}: check it against "x < ${fmt(k)}" and "x ≥ ${fmt(k)}".`,
    steps: [`${lab(fmt(x), 'input')} ${x < k ? '<' : '≥'} ${lab(fmt(k), 'switch point')}, so use ${x < k ? polyStr([p, 0, 1]) : lin(m, n)}.`, `f(${fmt(x)}) = ${lab(fmt(ans), 'flow')}.`],
    // at the boundary the solid/open dots would answer the ownership question, so leave them off
    visual: plotV([-5, 5, -10, 10], { fns: [{ fn }], points: atK ? [] : [{ x: k, y: left(k), open: true }, { x: k, y: right(k) }] }), app: 'Tax brackets, gear shifts and thermostat rules are piecewise functions.',
  });
  return choose(rng, q, fmt(ans), [fmt(other), fmt(ans + 1), fmt(-ans || 2)]);
}

function evenOddStep(rng: Rng): AskStep {
  const kind = pick(rng, ['even', 'odd', 'neither', 'neither2'] as const);
  const a = rnz(rng, -3, 3); const b = rnz(rng, -5, 5); const c = rnz(rng, -4, 4);
  const co = kind === 'even' ? (rng.next() < 0.5 ? [c, 0, a] : [0, 0, b, 0, a]) : kind === 'odd' ? [0, b, 0, a] : kind === 'neither' ? [c, b, 0, a] : [0, b, a];
  const neg = co.map((v, i) => (i % 2 ? -v : v));
  const right = kind === 'even' ? 'Even' : kind === 'odd' ? 'Odd' : 'Neither';
  const fS = polyStr(co); const fnegS = polyStr(neg); const minusF = polyStr(co.map((v) => -v));
  const q = mkq(S(K1), 'symmetry', {
    prompt: `Ada tests a cam profile f(x) = ${fS} for symmetry. Is f even, odd or neither?`, expression: `f(x) = ${fS}`, answer: 0,
    hint: 'Work out f(−x). Even: f(−x) = f(x). Odd: f(−x) = −f(x). Odd powers alone do not make a function odd.',
    steps: [`f(−x) = ${fnegS}.`, right === 'Even' ? 'That equals f(x): even (mirror in the y-axis).' : right === 'Odd' ? `That equals −f(x) = ${minusF}: odd (half-turn about the origin).` : `That is neither f(x) = ${fS} nor −f(x) = ${minusF}: neither.`],
    visual: plotV([-3, 3, -10, 10], { fns: [{ fn: { kind: 'poly', c: co } }] }), app: 'Symmetry halves the work: engineers analyse half a symmetric part and mirror it.',
  });
  return choose(rng, q, right, ['Even', 'Odd', 'Neither'].filter((x) => x !== right));
}

function symmetryPointStep(rng: Rng): AskStep {
  const odd = rng.next() < 0.5; const a = rint(rng, 1, 5); const b = rnz(rng, -5, 5);
  const ans: [number, number] = odd ? [-a, -b] : [-a, b];
  const q = mkq(S(K1), 'symmetry', {
    prompt: `The pump curve f is ${odd ? 'odd' : 'even'} and f(${a}) = ${fmt(b)}.`, expression: 'Which other point must be on f?', answer: 0, answerText: `(${fmt(ans[0])}, ${fmt(ans[1])})`,
    hint: odd ? 'Odd: f(−x) = −f(x). A half-turn about the origin.' : 'Even: f(−x) = f(x). A mirror in the y-axis.',
    steps: [odd ? `Odd means f(−${a}) = −f(${a}) = ${fmt(-b)}.` : `Even means f(−${a}) = f(${a}) = ${fmt(b)}.`, `So (${fmt(ans[0])}, ${fmt(ans[1])}) is on the graph.`], app: APP1,
  });
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: `f is ${odd ? 'odd' : 'even'}`, layers: { points: [{ x: a, y: b, label: `(${a}, ${fmt(b)})` }] } }, [`${ans[0]},${ans[1]}`], `Tap the point that ${odd ? 'oddness' : 'evenness'} forces onto the graph.`);
}

function tempInverseStep(rng: Rng): AskStep {
  const C = pick(rng, [-40, -10, 0, 15, 25, 35, 60, 100]); const F = (9 * C) / 5 + 32;
  const q = mkq(S(K1), 'inverse', {
    prompt: `The furnace display converts Celsius to Fahrenheit with F(C) = (9/5)C + 32. It shows ${fmt(F)}°F. Undo it: what is the temperature in °C?`,
    expression: `F⁻¹(${fmt(F)}) = ?`, answer: C, unit: '°C',
    hint: 'Run the steps backwards in reverse order: undo the + 32 (freezing offset) first, then undo the × 9/5 (scale factor).',
    steps: [`Subtract the offset: ${lab(fmt(F), 'degrees Fahrenheit')} − ${lab(32, 'freezing offset')} = ${lab(fmt(F - 32), 'Fahrenheit degrees above freezing')}.`, `Rescale: ${lab(fmt(F - 32), 'Fahrenheit degrees above freezing')} × 5/9 = ${lab(fmt(C), 'degrees Celsius')}.`], visual: card('Inverse function', ['F(C) = (9/5)C + 32', 'C = (5/9)(F − 32)']), app: APP1,
  });
  return typed(q);
}

function chainCostStep(rng: Rng): AskStep {
  const r = pick(rng, [2, 3, 4]); const c = pick(rng, [5, 6, 8]); const fee = pick(rng, [10, 15, 20]); const h = rint(rng, 2, 6);
  const kg = r * h; const cost = c * kg + fee;
  const q = mkq(S(K1), 'composition', {
    prompt: `Brick's crusher makes m(h) = ${r}h tonnes of gravel in h hours. Hauling costs C(m) = ${c}m + ${fee} coins. Find C(m(${h})).`,
    expression: `C(m(${h})) = ?`, answer: cost, unit: 'coins',
    hint: 'Inside first: how many tonnes after that many hours? Then cost that many tonnes.',
    steps: [`m(${h}) = ${lab(r, 'tonnes per hour')} × ${lab(h, 'hours')} = ${lab(kg, 'tonnes')}.`, `C(${kg}) = ${lab(c, 'coins per tonne')} × ${lab(kg, 'tonnes')} + ${lab(fee, 'coin fee')} = ${lab(cost, 'coins')}.`], visual: card('Chain', [`hours → m → tonnes → C → coins`]), app: APP1,
  });
  return typed(q);
}

/* ================================================================== */
/* 2. Polynomial functions                                             */
/* ================================================================== */
const K2 = 'polynomials';
const APP2 = 'Beam deflection, cam profiles and spline curves in CAD are polynomials.';
/** Factors of a polynomial from its roots, with a bare 'x' factor written first. */
const facs = (roots: number[]) => [...roots].sort((u, v) => (u === 0 ? -1 : v === 0 ? 1 : 0)).map((r) => fac(r)).join('');

function zerosPlotStep(rng: Rng): AskStep {
  const r1 = rint(rng, -5, 5); let r2 = rint(rng, -5, 5); if (r2 === r1) r2 = r1 === 5 ? -5 : r1 + 1;
  const lead = pick(rng, [1, 2, -1, 3]);
  const fS = `${lead === 1 ? '' : lead === -1 ? '−' : fmt(lead)}${facs([r1, r2])}`;
  const q = mkq(S(K2), 'zeros', {
    prompt: `The beam sags along f(x) = ${fS}. Where does it cross the axis?`, expression: `Zeros of ${fS}`, answer: 0, answerText: `(${fmt(r1)}, 0) and (${fmt(r2)}, 0)`,
    hint: 'A product is zero when one factor is zero. Solve each factor = 0; watch the sign.',
    steps: [`${[r1, r2].map((r) => (r === 0 ? 'the factor x gives x = 0' : `${fac(r)} = 0 gives x = ${fmt(r)}`)).join('; ')}.`, `The graph meets the axis at (${fmt(r1)}, 0) and (${fmt(r2)}, 0).`], app: APP2,
  });
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 2, label: 'Tap the two x-intercepts' }, undefined, 'Tap both points where the graph crosses the x-axis.', { rule: { kind: 'set', items: [`${r1},0`, `${r2},0`] } });
}

function zerosChooseStep(rng: Rng): AskStep {
  const roots = rng.shuffle([1, 2, 3, 4, 5]).slice(0, 3).map((r) => r * pick(rng, [1, -1]));
  const show = (rs: number[]) => `x = ${[...rs].sort((u, v) => u - v).map(fmt).join(', ')}`;
  const fS = roots.map((r) => fac(r)).join('');
  const q = mkq(S(K2), 'zeros', {
    prompt: `The cam's lift is f(x) = ${fS}. Where is the lift zero?`, expression: `f(x) = ${fS}`, answer: 0,
    hint: 'Set each factor to zero. (x − 3) = 0 when x = 3, not −3.',
    steps: roots.map((r) => `${fac(r)} = 0 → x = ${fmt(r)}.`).concat([`Zeros: ${show(roots)}.`]), visual: card('Zero-product rule', ['If A·B·C = 0,', 'then A = 0 or B = 0 or C = 0']), app: APP2,
  });
  return choose(rng, q, show(roots), [show(roots.map((r) => -r)), show([-roots[0], roots[1], roots[2]]), show([roots[0], -roots[1], roots[2]])]);
}

const ENDS = ['Down on the left, up on the right', 'Up on the left, down on the right', 'Up on both ends', 'Down on both ends'];
function endBehaviourStep(rng: Rng): AskStep {
  const n = pick(rng, [2, 3, 4, 5]); const a = pick(rng, [1, 2, 3, -1, -2, -3]);
  const lower = [rint(rng, 1, n - 1), 0].filter((v, i, arr) => arr.indexOf(v) === i);
  const terms = [{ k: n, c: a }, ...lower.map((k) => ({ k, c: rnz(rng, -6, 6) * (k === 0 ? 1 : 1) }))];
  // write it with the leading term NOT first, so reading the first term is the trap
  const order = [...terms.slice(1), terms[0]];
  const term = (t: { k: number; c: number }, first: boolean) => {
    const body = t.k === 0 ? fmt(Math.abs(t.c)) : `${Math.abs(t.c) === 1 ? '' : fmt(Math.abs(t.c))}x${t.k === 1 ? '' : sup(t.k)}`;
    return first ? (t.c < 0 ? `−${body}` : body) : `${t.c < 0 ? '− ' : '+ '}${body}`;
  };
  const fS = order.map((t, i) => term(t, i === 0)).join(' ');
  const right = n % 2 ? (a > 0 ? ENDS[0] : ENDS[1]) : a > 0 ? ENDS[2] : ENDS[3];
  const q = mkq(S(K2), 'end-behaviour', {
    prompt: `A crane cable's sag model is f(x) = ${fS}. How do the ends of the graph behave?`, expression: `f(x) = ${fS}`, answer: 0,
    hint: 'Far from 0, the highest power wins, wherever it is written. Look at its degree (odd/even) and its sign.',
    steps: [`The leading term is ${term({ k: n, c: a }, true)}: degree ${n} (${n % 2 ? 'odd' : 'even'}), coefficient ${a > 0 ? 'positive' : 'negative'}.`, `${n % 2 ? 'Odd degree: the ends go opposite ways.' : 'Even degree: both ends go the same way.'} ${right}.`],
    visual: card('End behaviour', ['Find the highest power of x', 'Odd or even degree? Sign?']), app: APP2,
  });
  return choose(rng, q, right, ENDS.filter((e) => e !== right));
}

function multiplicityPick(rng: Rng): AskStep {
  const a = rint(rng, -3, 3); let b = rint(rng, -3, 3); if (b === a) b = a === 3 ? -2 : a + 2;
  const f1 = fromRoots([a, a, b]); const f2 = fromRoots([a, b, b]); const f3 = fromRoots([a, b]); const f4 = fromRoots([a, a, b], -1);
  const R: Range = [-5, 5, -10, 10];
  const vis = [f1, f2, f3, f4].map((c): Visual => plotV(R, { fns: [{ fn: { kind: 'poly', c } }] }));
  const fS = b === 0 ? `x${fac(a)}²` : `${fac(a)}²${fac(b)}`;
  const q = mkq(S(K2), 'multiplicity', {
    prompt: `Ada's cam lifts along f(x) = ${fS}. Which graph is it?`, expression: `f(x) = ${fS}`, answer: 0,
    hint: 'A squared factor makes the graph touch the axis and turn back. A single factor makes it cross. The leading coefficient is +1.',
    steps: [`${fac(a)}² → touches the axis at x = ${fmt(a)}.`, `${fac(b)} → crosses at x = ${fmt(b)}.`, 'Degree 3, positive: down on the left, up on the right.'],
    visual: card('Multiplicity', ['even power: touch and turn', 'odd power: cross']), app: APP2,
  });
  return pickGraph(rng, q, vis, 0);
}

function signChartStep(rng: Rng): AskStep {
  const rs = rng.shuffle([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]).slice(0, 3).sort((u, v) => u - v);
  const lead = pick(rng, [1, -1]); const want = pick(rng, ['<', '>'] as const);
  const f = (x: number) => lead * (x - rs[0]) * (x - rs[1]) * (x - rs[2]);
  const acc = intsWhere(-8, 8, (x) => (want === '<' ? f(x) < 0 : f(x) > 0));
  const fS = `${lead < 0 ? '−' : ''}${facs(rs)}`;
  const q = mkq(S(K2), 'sign-chart', {
    prompt: `The tank's net inflow is f(x) = ${fS}. Find a whole number x where f(x) ${want} 0.`, expression: `f(x) ${want} 0`, answer: 0, answerText: acc[0],
    hint: 'Mark the zeros on a line. The sign can only change at a zero of odd multiplicity. Test one x in each piece.',
    steps: [`Zeros at ${rs.map(fmt).join(', ')} split the line into 4 pieces.`, `For large x, f is ${lead > 0 ? 'positive' : 'negative'}; the sign flips at each zero going left.`, `f(x) ${want} 0 on ${solSet((x) => (want === '<' ? f(x) < 0 : f(x) > 0), rs)}; any whole number in there works.`],
    visual: { type: 'numline', min: -8, max: 8, points: rs.map((r) => ({ x: r, open: true })) }, app: APP2,
  });
  return model(q, { kind: 'numberline', start: 0, min: -8, max: 8, label: `Zeros at ${rs.map(fmt).join(', ')}` }, acc, `Tap any whole number where f(x) ${want} 0; skip the zeros.`);
}

function remainderStep(rng: Rng): AskStep {
  const c = [rnz(rng, -6, 6), rint(rng, -4, 4), rint(rng, -3, 3), 1]; const k = rnz(rng, -3, 3);
  const val = evalFn({ kind: 'poly', c }, k); const fS = polyStr(c);
  const q = mkq(S(K2), 'remainder', {
    prompt: `Brick divides f(x) = ${fS} by (${xm(k)}). What is the remainder?`, expression: `${fS} ÷ (${xm(k)})`, answer: val,
    hint: 'Remainder theorem: dividing by (x − k) leaves remainder f(k). Read k carefully from the factor.',
    steps: [`Dividing by (${xm(k)}) leaves remainder f(${fmt(k)}).`, `f(${fmt(k)}) = ${par(k)}³ ${c[2] ? `${fmtSigned(c[2])}·${par(k)}²` : ''} ${c[1] ? `${fmtSigned(c[1])}·${par(k)}` : ''} ${fmtSigned(c[0])} = ${fmt(val)}.`.replace(/\s+/g, ' ')],
    visual: card('Remainder theorem', ['f(x) = (x − k)·q(x) + R', 'put x = k: R = f(k)']), app: APP2,
  });
  return typed(q);
}

function zeroSliderStep(rng: Rng): AskStep {
  const p = pick(rng, [1, 3, 5, 7, -1, -3, -5]); const q0 = rint(rng, 1, 3) * pick(rng, [1, -1]);
  const zero = p / 2;
  const c = pmul([-p, 2], [q0, 1]);
  const q = mkq(S(K2), 'zeros', {
    prompt: `The spring force is f(x) = (${lin(2, -p)})(${xm(-q0)}). One zero is not a whole number.`, expression: `Zero from ${lin(2, -p)} = 0`, answer: zero,
    hint: `Solve ${lin(2, -p)} = 0: undo the ${p > 0 ? 'subtraction' : 'addition'}, then divide by 2.`,
    steps: [`${lin(2, -p)} = 0 → 2x = ${fmt(p)} → x = ${fmt(zero)}.`, `The other factor gives x = ${fmt(-q0)}.`], app: APP2,
  });
  return model(q, { kind: 'slider', min: -4, max: 4, step: 0.5, label: 'Slide onto the zero', range: [-4, 4, -8, 8], layers: { fns: [{ fn: { kind: 'poly', c } }] } }, [String(zero)], `Slide the marker onto the zero that comes from ${lin(2, -p)}.`);
}

function boxVolumeStep(rng: Rng): AskStep {
  const L = pick(rng, [12, 14, 16, 20]); const W = pick(rng, [10, 12]); const x = rint(rng, 1, 4);
  const V = x * (L - 2 * x) * (W - 2 * x);
  const q = mkq(S(K2), 'model', {
    prompt: `Ada folds a ${L} × ${W} cm steel sheet into an open box by cutting x-cm squares from each corner: V(x) = x(${L} − 2x)(${W} − 2x). Find V(${x}).`,
    expression: `V(${x}) = ?`, answer: V, unit: 'cm³',
    hint: 'Substitute into each factor, then multiply the three numbers.',
    steps: [`Box length: ${lab(L, 'sheet length in cm')} − ${lab(2 * x, 'two cuts in cm')} = ${lab(L - 2 * x, 'length in cm')}; width: ${lab(W, 'sheet width in cm')} − ${lab(2 * x, 'two cuts in cm')} = ${lab(W - 2 * x, 'width in cm')}.`, `V(${x}) = ${lab(x, 'height in cm')} × ${lab(L - 2 * x, 'length in cm')} × ${lab(W - 2 * x, 'width in cm')} = ${lab(V, 'volume in cm³')}.`], visual: { type: 'box', l: L - 2 * x, w: W - 2 * x, h: x, unit: 'cm' }, app: APP2,
  });
  return typed(q);
}

function profitSignStep(rng: Rng): AskStep {
  const a = rint(rng, 1, 3); const b = a + rint(rng, 3, 5);
  const acc = intsWhere(0, 10, (x) => -(x - a) * (x - b) > 0);
  const q = mkq(S(K2), 'sign-chart', {
    prompt: `The workshop's profit is P(x) = −${fac(a)}${fac(b)} thousand coins for x hundred parts. Pick a whole-number x that makes a profit.`,
    expression: 'P(x) > 0', answer: 0, answerText: acc[0],
    hint: 'The break-even points are the zeros. With a negative leading coefficient, the graph is a hill.',
    steps: [`Break-even (zeros) at x = ${lab(a, 'hundred parts')} and x = ${lab(b, 'hundred parts')}.`, `−(x − ${a})(x − ${b}) is positive between the zeros: x = ${acc.join(', ')} (hundreds of parts).`], app: 'Break-even analysis is a sign chart.',
  });
  return model(q, { kind: 'numberline', start: 0, min: 0, max: 10, label: 'hundreds of parts' }, acc, 'Tap a production level that makes a profit.');
}

function allZerosChoose(rng: Rng): AskStep {
  const [r, s1, s2] = rng.shuffle([1, 2, 3, 4]).slice(0, 3).map((v) => v * pick(rng, [1, -1]));
  const show = (rs: number[]) => `x = ${[...rs].sort((u, v) => u - v).map(fmt).join(', ')}`;
  const fS = polyStr(fromRoots([r, s1, s2])); const quad = polyStr(fromRoots([s1, s2]));
  const q = mkq(S(K2), 'zeros', {
    prompt: `Brick's load curve is f(x) = ${fS}, and x = ${fmt(r)} is one zero. Find all the zeros.`, expression: `f(x) = ${fS}`, answer: 0,
    hint: `A zero at x = ${fmt(r)} means ${fac(r)} is a factor. Divide it out, then factor the quadratic that is left.`,
    steps: [`Divide by ${fac(r)} (synthetic division with ${fmt(r)}): f(x) = ${fac(r)}(${quad}).`, `${quad} = ${fac(s1)}${fac(s2)}.`, `Zeros: ${show([r, s1, s2])}.`],
    visual: card('Factor theorem', [`f(${fmt(r)}) = 0  ⇔  ${fac(r)} is a factor`]), app: APP2,
  });
  return choose(rng, q, show([r, s1, s2]), [show([r, -s1, -s2]), show([s1, s2]), show([-r, s1, s2])]);
}

function buildPolyStep(rng: Rng): AskStep {
  const roots = rng.shuffle([-3, -2, -1, 1, 2, 3]).slice(0, pick(rng, [2, 3])).sort((u, v) => u - v);
  const a = pick(rng, [2, 3, -1, -2, 4, -3]);
  let x0 = rint(rng, -2, 4); let g = 0; while ((roots.includes(x0) || Math.abs(roots.reduce((m, r) => m * (x0 - r), 1)) > 30) && g++ < 20) x0 = rint(rng, -2, 4);
  if (roots.includes(x0)) x0 = 4;
  const prod = roots.reduce((m, r) => m * (x0 - r), 1); const y0 = a * prod;
  const fS = `a${facs(roots)}`;
  const q = mkq(S(K2), 'build', {
    prompt: `Ada designs a cam f(x) = ${fS} with zeros at x = ${roots.map(fmt).join(', ')}. It must pass through (${fmt(x0)}, ${fmt(y0)}). Find a.`,
    expression: `f(${fmt(x0)}) = ${fmt(y0)}: a = ?`, answer: a,
    hint: 'The zeros fix the factors; the extra point fixes the stretch. Substitute the point and solve for a.',
    steps: [`f(${fmt(x0)}) = a·${roots.map((r) => `(${fmt(x0)} ${fmtSigned(-r)})`).join('')} = ${fmt(prod)}a.`, `${fmt(prod)}a = ${fmt(y0)}, so a = ${fmt(a)}.`], app: APP2,
  });
  return typed(q);
}

function polySetStep(rng: Rng): AskStep {
  const a = rint(rng, -4, 4); let b = rint(rng, -4, 4); if (b === a) b = a >= 2 ? a - 3 : a + 3;
  const lead = pick(rng, [1, 1, -1]); const op = pick(rng, INEQS);
  const f = (x: number) => lead * (x - a) ** 2 * (x - b);
  const once = (x: number) => lead * (x - a) * (x - b);
  const fS = `${lead < 0 ? '−' : ''}${b === 0 ? `x${fac(a)}²` : `${fac(a)}²${fac(b)}`}`;
  const right = solSet((x) => holds(f(x), op), [a, b]);
  const q = mkq(S(K2), 'sign-chart', {
    prompt: `Brick's beam load is f(x) = ${fS}. For which x is f(x) ${op} 0?`, expression: `${fS} ${op} 0`, answer: 0,
    hint: 'Mark the zeros. The sign flips at a single zero but NOT at a squared one. Test each piece, then decide whether the zeros themselves count.',
    steps: [`Zeros: x = ${fmt(a)} (squared factor, no sign change) and x = ${fmt(b)} (single factor, the sign flips).`, `For large x, f is ${lead > 0 ? 'positive' : 'negative'}; so f is ${lead > 0 ? 'negative' : 'positive'} left of ${fmt(b)} and ${lead > 0 ? 'positive' : 'negative'} right of it (touching 0 at ${fmt(a)}).`, `${op === '≤' || op === '≥' ? 'The zeros make f = 0, so they count' : 'The zeros make f = 0, so they are left out'}: ${right}.`],
    visual: { type: 'numline', min: -6, max: 6, points: [{ x: a, label: fmt(a) }, { x: b, label: fmt(b) }] }, app: APP2,
  });
  return choose(rng, q, right, [solSet((x) => holds(once(x), op), [a, b]), solSet((x) => holds(f(x), strictOp(op)), [a, b]), solSet((x) => holds(f(x), flipOp(op)), [a, b])]);
}

/* ================================================================== */
/* 3. Rational functions                                               */
/* ================================================================== */
const K3 = 'rational';
const APP3 = 'Lens equations, average cost and the gain of a filter are rational functions; asymptotes are their limits.';

function vaStep(rng: Rng): AskStep {
  const a = rnz(rng, -5, 5); let b = rnz(rng, -5, 5); if (b === a) b = -a;
  const den = polyStr(fromRoots([a, b]));
  const q = mkq(S(K3), 'asymptote', {
    prompt: `Catalyst's reaction rate is f(x) = ${fac(a)} / (${den}). Where is the vertical asymptote?`, expression: `f(x) = ${fac(a)} / (${den})`, answer: 0,
    hint: 'Factor the bottom first. A factor that cancels with the top leaves a hole, not an asymptote.',
    steps: [`${den} = ${fac(a)}${fac(b)}.`, `${fac(a)} cancels: a hole at x = ${fmt(a)}.`, `${fac(b)} stays on the bottom: vertical asymptote x = ${fmt(b)}.`],
    visual: card('Holes vs asymptotes', ['cancels → hole', 'stays on the bottom → asymptote']), app: APP3,
  });
  return choose(rng, q, `x = ${fmt(b)}`, [`x = ${fmt(a)}`, `x = ${fmt(a)} and x = ${fmt(b)}`, `x = ${fmt(-b)}`]);
}

function holePlotStep(rng: Rng): AskStep {
  let a = 0; let b = 0; let g = 0;
  do { a = rnz(rng, -4, 4); b = rnz(rng, -4, 4); } while ((a === b || Math.abs(a - b) > 6) && g++ < 40);
  if (a === b) { a = 2; b = -1; }
  const num = polyStr(fromRoots([a, b]));
  const q = mkq(S(K3), 'hole', {
    prompt: `Catalyst's sensor curve is f(x) = (${num}) / (${xm(a)}). Its graph is a line with one missing point.`, expression: 'Find the hole', answer: 0, answerText: `(${fmt(a)}, ${fmt(a - b)})`,
    hint: 'Factor the top and cancel. The hole is where the cancelled factor is zero; its height comes from what is left.',
    steps: [`${num} = ${fac(a)}${fac(b)}, so f(x) = ${xm(b)} for x ≠ ${fmt(a)}.`, `At x = ${fmt(a)}: ${xm(b).replace('x', par(a))} = ${fmt(a - b)}. Hole at (${fmt(a)}, ${fmt(a - b)}).`], app: APP3,
  });
  return model(q, { kind: 'plot', range: [-7, 7, -7, 7], count: 1, label: 'Tap the hole', layers: { fns: [{ fn: poly(-b, 1), color: 'muted' }] } }, [`${a},${a - b}`], 'Tap the point that is missing from the graph.');
}

function haStep(rng: Rng): AskStep {
  const kind = pick(rng, ['equal', 'lower', 'higher'] as const);
  const p = pick(rng, [2, 3, 4, 6, -2]); const qd = pick(rng, [1, 2, 3]); const r = rnz(rng, -9, 9); let t = rnz(rng, -9, 9);
  // same degree with proportional top and bottom would make f constant: reroll the bottom's constant
  let g = 0; while (kind === 'equal' && r * qd === t * p && g++ < 20) t = rnz(rng, -9, 9);
  if (kind === 'equal' && r * qd === t * p) t = -t;
  const numC = kind === 'lower' ? [r, p] : [r, 0, p]; const denC = kind === 'higher' ? [t, qd] : [t, 0, qd];
  const fS = `(${polyStr(numC)}) / (${polyStr(denC)})`;
  const NONE = 'No horizontal asymptote';
  const right = kind === 'equal' ? `y = ${fracStr(p, qd)}` : kind === 'lower' ? 'y = 0' : NONE;
  const q = mkq(S(K3), 'asymptote', {
    prompt: `Volt's filter gain is f(x) = ${fS}. Far from the origin, where does it level off?`, expression: `f(x) = ${fS}`, answer: 0,
    hint: 'Compare the highest powers on top and bottom. The constant terms do not matter far away.',
    steps: kind === 'equal' ? ['Same degree top and bottom.', `The ratio of leading coefficients: ${fmt(p)}/${fmt(qd)}, so ${right}.`]
      : kind === 'lower' ? ['The bottom has the higher degree.', 'The bottom grows faster, so f → 0: y = 0.'] : ['The top has the higher degree.', 'f keeps growing: there is no horizontal asymptote.'],
    visual: card('Horizontal asymptote', ['compare degrees', 'top < bottom · equal · top > bottom']), app: APP3,
  });
  const wr = [`y = ${fracStr(r, t)}`, kind === 'equal' ? 'y = 0' : `y = ${fracStr(p, qd)}`, kind === 'higher' ? 'y = 0' : NONE, `y = ${fracStr(qd, p)}`];
  return choose(rng, q, right, wr);
}

function rationalSignStep(rng: Rng): AskStep {
  let a = 0; let b = 0; let g = 0;
  do { a = rint(rng, -6, 6); b = rint(rng, -6, 6); } while (Math.abs(a - b) < 2 && g++ < 40);
  if (Math.abs(a - b) < 2) { a = -2; b = 3; }
  const want = pick(rng, ['<', '>'] as const);
  const f = (x: number) => (x - a) / (x - b);
  const acc = intsWhere(-8, 8, (x) => x !== b && (want === '<' ? f(x) < 0 : f(x) > 0));
  const fS = `${fac(a)}/${fac(b)}`;
  const q = mkq(S(K3), 'sign', {
    prompt: `The lens gain is f(x) = ${fS}. Find a whole number x where f(x) ${want} 0.`, expression: `f(x) ${want} 0`, answer: 0, answerText: acc[0],
    hint: 'The sign can change at a zero of the top AND at a zero of the bottom. Test one x in each piece.',
    steps: [`Critical points: x = ${fmt(a)} (zero of the top) and x = ${fmt(b)} (zero of the bottom).`, `f is negative strictly between them and positive outside.`, `f(x) ${want} 0 on ${solSet((x) => (want === '<' ? f(x) < 0 : f(x) > 0), [a, b], [b])}; any whole number in there works.`],
    visual: { type: 'numline', min: -8, max: 8, points: [{ x: a, label: 'top 0' }, { x: b, label: 'bottom 0', open: true }] }, app: APP3,
  });
  return model(q, { kind: 'numberline', start: 0, min: -8, max: 8, label: `Critical points ${fmt(Math.min(a, b))} and ${fmt(Math.max(a, b))}` }, acc, `Tap any whole number where f(x) ${want} 0.`);
}

function rationalGraphPick(rng: Rng): AskStep {
  const h = rnz(rng, -3, 3); const k = rnz(rng, -3, 3);
  const mk = (hh: number, kk: number): Visual => plotV([-6, 6, -6, 6], { fns: [{ fn: { kind: 'rational', num: [1 - kk * hh, kk], den: [-hh, 1] } }], vlines: [{ x: hh }], hlines: [{ y: kk }] });
  const fS = `1/(${xm(h)}) ${fmtSigned(k)}`;
  const q = mkq(S(K3), 'graph', {
    prompt: `Catalyst's reaction curve is f(x) = ${fS}. Which graph is it?`, expression: `f(x) = ${fS}`, answer: 0,
    hint: 'The vertical asymptote is where the bottom is zero. The + k outside lifts the horizontal asymptote to y = k.',
    steps: [`Bottom zero: ${xm(h)} = 0 → vertical asymptote x = ${fmt(h)}.`, `The ${fmtSigned(k)} shifts the curve: horizontal asymptote y = ${fmt(k)}.`],
    visual: card('Shifted 1/x', ['1/(x − h) + k', 'asymptotes x = h, y = k']), app: APP3,
  });
  return pickGraph(rng, q, [mk(h, k), mk(-h, k), mk(h, -k), mk(-h, -k)], 0);
}

function vaSliderStep(rng: Rng): AskStep {
  const c = pick(rng, [1, 3, 5, 7, -1, -3, -5, -7]); const p = rint(rng, -3, 3);
  const va = c / 2;
  const fS = `${fac(-p)} / (${lin(2, -c)})`;
  const q = mkq(S(K3), 'asymptote', {
    prompt: `The filter gain is f(x) = ${fS}.`, expression: 'Vertical asymptote', answer: va,
    hint: `Set the bottom to zero and solve: ${lin(2, -c)} = 0.`,
    steps: [`${lin(2, -c)} = 0 → 2x = ${fmt(c)} → x = ${fmt(va)}.`, `The top is not zero there, so x = ${fmt(va)} is an asymptote.`], app: APP3,
  });
  return model(q, { kind: 'slider', min: -4, max: 4, step: 0.5, label: 'Slide onto the asymptote', range: [-4, 4, -6, 6], layers: { fns: [{ fn: { kind: 'rational', num: [p, 1], den: [-c, 2] } }] } }, [String(va)], 'Slide the dashed line onto the vertical asymptote.');
}

function avgCostStep(rng: Rng): AskStep {
  const F = pick(rng, [200, 500, 1000, 1200]); const v = pick(rng, [3, 4, 5, 8, 12]);
  const q = mkq(S(K3), 'model', {
    prompt: `Printing gear blanks costs ${F} coins to set up plus ${v} coins each. Average cost per blank: A(n) = (${F} + ${v}n)/n. What does A(n) approach for huge runs?`,
    expression: `A(n) = (${v}n + ${F})/n → ?`, answer: v, unit: 'coins',
    hint: 'Same degree on top and bottom: compare leading coefficients. The set-up cost gets spread thin.',
    steps: [`Split it: A(n) = ${v} + ${F}/n, the ${lab(v, 'coins per blank')} plus the ${lab(F, 'set-up coins')} shared by n blanks.`, `As n grows, the set-up share ${F}/n → 0, so A(n) → ${lab(v, 'coins per blank')}. That is the horizontal asymptote.`], visual: card('Average cost', [`A(n) = ${v} + ${F}/n`]), app: APP3,
  });
  return typed(q);
}

function mixingStep(rng: Rng): AskStep {
  const c = pick(rng, [2, 3, 4, 5]); const V = pick(rng, [50, 100, 200]); const r = pick(rng, [5, 10, 20]);
  const q = mkq(S(K3), 'model', {
    prompt: `Catalyst pours brine with ${c} g/L of salt into a tank of ${V} L of pure water at ${r} L/min. Concentration: C(t) = ${c * r}t/(${V} + ${r}t). What level does C approach?`,
    expression: `C(t) = ${c * r}t/(${r}t + ${V}) → ?`, answer: c, unit: 'g/L',
    hint: 'Long run: compare the t terms on top and bottom.',
    steps: [`Leading coefficients: ${lab(c * r, 'grams of salt per min')} ÷ ${lab(r, 'litres per min')} = ${lab(c, 'grams per litre')}.`, `C(t) → ${lab(c, 'grams per litre')}: the tank approaches the brine's own concentration.`], visual: card('Mixing tank', [`C(t) = ${c * r}t/(${r}t + ${V})`]), app: APP3,
  });
  return typed(q);
}

function haPractice(rng: Rng): Question {
  const p = pick(rng, [1, 2, 3, 4, 5, 6]); const qd = pick(rng, [2, 3, 4]); const r = rnz(rng, -5, 5); let s = rnz(rng, -5, 5);
  let g = 0; while (r * qd === s * p && g++ < 20) s = rnz(rng, -5, 5); // proportional top and bottom: f would be constant
  if (r * qd === s * p) s = -s;
  const fS = `(${polyStr([r, p])})/(${polyStr([s, qd])})`;
  const v = p / qd; const repeating = Math.abs(v * 100 - Math.round(v * 100)) > 1e-9;
  return mkq(S(K3), 'asymptote', {
    prompt: `Horizontal asymptote of f(x) = ${fS}: y = ?${repeating ? ' (a fraction, or 2 decimal places)' : ''}`, expression: `f(x) = ${fS}`, answer: v, fraction: !Number.isInteger(v), answerText: fracStr(p, qd), tolerance: repeating ? 0.005 : undefined,
    hint: 'Same degree: divide the leading coefficients.', steps: [`y = ${fmt(p)}/${fmt(qd)}${fracStr(p, qd) === `${p}/${qd}` ? '' : ` = ${fracStr(p, qd)}`}.`], app: APP3,
  });
}

function slantAsymptoteChoose(rng: Rng): AskStep {
  const m = pick(rng, [1, 1, 2]); const k = rnz(rng, -3, 3); const b = rint(rng, -4, 4); let c = rint(rng, -6, 6);
  const qc = b + m * k; let rem = c + k * qc; if (rem === 0) { c += 2; rem = c + k * qc; }
  const num = polyStr([c, b, m]); const line = lin(m, qc);
  const q = mkq(S(K3), 'slant', {
    prompt: `Volt's amplifier gain is f(x) = (${num}) / (${xm(k)}), with no horizontal asymptote. Which slant line does f hug for large x?`,
    expression: `f(x) = (${num}) / (${xm(k)})`, answer: 0,
    hint: 'Divide the top by the bottom (long or synthetic division). The quotient is the slant asymptote; the remainder over the bottom fades to 0.',
    steps: [`${num} = (${xm(k)})(${line}) ${fmtSigned(rem)}.`, `So f(x) = ${line} ${rem < 0 ? '−' : '+'} ${Math.abs(rem)}/(${xm(k)}), and the fraction → 0 far away: y = ${line}.`],
    visual: card('Slant asymptote', ['top degree = bottom degree + 1', 'divide: quotient = the slant line']), app: APP3,
  });
  return choose(rng, q, `y = ${line}`, [`y = ${lin(m, b - m * k)}`, `y = ${lin(m, b)}`, 'No asymptote at all', `y = ${fmt(m)}`]);
}

function rationalSetStep(rng: Rng): AskStep {
  const a = rint(rng, -5, 5); let b = rint(rng, -5, 5); if (b === a) b = a >= 2 ? a - 4 : a + 4;
  const op = pick(rng, INEQS);
  const f = (x: number) => (x - a) / (x - b);
  const set = (o: Ineq) => solSet((x) => holds(f(x), o), [a, b], [b]);
  const right = set(op); const fS = `${fac(a)}/${fac(b)}`;
  const q = mkq(S(K3), 'sign', {
    prompt: `Catalyst's lens gain is f(x) = ${fS}. For which x is f(x) ${op} 0?`, expression: `${fS} ${op} 0`, answer: 0,
    hint: 'The sign can change where the top is 0 AND where the bottom is 0. Test each piece. A zero of the bottom is never in the answer: f does not exist there.',
    steps: [`Critical points: x = ${fmt(a)} (top is zero, so f is zero) and x = ${fmt(b)} (bottom is zero, f does not exist).`, `f is negative strictly between them and positive outside.`, `${op === '≤' || op === '≥' ? `x = ${fmt(a)} counts (f = 0 there), x = ${fmt(b)} never does` : 'Neither critical point counts'}: ${right}.`],
    visual: { type: 'numline', min: -6, max: 6, points: [{ x: a, label: 'top 0' }, { x: b, label: 'bottom 0', open: true }] }, app: APP3,
  });
  return choose(rng, q, right, [solSet((x) => holds((x - a) * (x - b), op), [a, b]), set(strictOp(op)), set(flipOp(op))]);
}

/* ================================================================== */
/* 4. Exponential & logarithmic models                                 */
/* ================================================================== */
const K4 = 'explog';
const APP4 = 'Engineers model battery discharge, cooling, radioactive decay and population growth with exponentials.';

function growthTableStep(rng: Rng): AskStep {
  const o = pick(rng, [{ f: 2, fS: '2', P: rint(rng, 3, 12) }, { f: 3, fS: '3', P: rint(rng, 2, 6) }, { f: 0.5, fS: '(1/2)', P: 16 * rint(rng, 1, 5) }, { f: 1.5, fS: '1.5', P: 8 * rint(rng, 1, 5) }]);
  const v = [1, 2, 3].map((t) => o.P * o.f ** t);
  const grow = o.f > 1;
  const q = mkq(S(K4), 'growth', {
    prompt: `${grow ? "Catalyst's culture" : 'A tracer in the reactor'} starts at ${o.P} and is multiplied by ${o.fS.replace(/[()]/g, '')} every hour: N = ${o.P}·${o.fS}ᵗ.`,
    expression: `N = ${o.P}·${o.fS}ᵗ`, answer: v[0],
    hint: 'Exponential change multiplies by the same factor each step. It does not add the same amount.',
    steps: [`Each hour multiply by ${lab(o.fS.replace(/[()]/g, ''), 'growth factor per hour')}: ${lab(o.P, 'start')} → ${lab(fmt(v[0]), 'after one hour')} → ${lab(fmt(v[1]), 'after two hours')} → ${lab(fmt(v[2]), 'after three hours')}.`, 'Equal steps in t give equal RATIOS in N, not equal differences.'], app: APP4,
  });
  return model(q, { kind: 'table', cols: ['N at t = 0', 't = 1', 't = 2', 't = 3'], rows: [[o.P, null, null, null]], label: `N = ${o.P}·${o.fS}ᵗ` }, [v.map(String).join(',')], 'Fill in N for t = 1, 2 and 3 (hours).');
}

function halfLifeStep(rng: Rng): AskStep {
  const A0 = pick(rng, [80, 160, 320, 640, 960]); const h = pick(rng, [2, 3, 4, 5, 6, 8]); const n = pick(rng, [2, 3, 4]);
  const left = A0 / 2 ** n; const askTime = rng.next() < 0.5;
  const q = mkq(S(K4), 'half-life', {
    prompt: askTime ? `A medical isotope starts at ${A0} mg with a half-life of ${h} hours. When will only ${fmt(left)} mg remain?` : `A medical isotope starts at ${A0} mg with a half-life of ${h} hours. How much remains after ${n * h} hours?`,
    expression: askTime ? `${A0} → ${fmt(left)} mg: t = ?` : `A(${n * h}) = ?`, answer: askTime ? n * h : left, unit: askTime ? 'h' : 'mg',
    hint: 'Count half-lives: each one halves what is left. It does not remove the same amount each time.',
    steps: [`${lab(n * h, 'hours')} ÷ ${lab(h, 'hours per half-life')} = ${labn(n, 'half-life', 'half-lives')}.`, `Halve each time: ${lab(A0, 'mg at the start')} → ${Array.from({ length: n }, (_, i) => lab(fmt(A0 / 2 ** (i + 1)), i === n - 1 ? 'mg left' : 'mg')).join(' → ')}.`, askTime ? `So t = ${labn(n, 'half-life', 'half-lives')} × ${lab(h, 'hours each')} = ${lab(n * h, 'hours')}.` : `${lab(fmt(left), 'mg')} remain.`],
    visual: plotV([0, 5 * h, 0, A0 * 1.1], { fns: [{ fn: { kind: 'exp', a: A0, base: 0.5 ** (1 / h) } }], hlines: [{ y: A0 / 2, label: 'half' }] }), app: APP4,
  });
  return typed(q);
}

function halfLifeFracStep(rng: Rng): AskStep {
  const n = pick(rng, [3, 4, 5]);
  const q = mkq(S(K4), 'half-life', {
    prompt: `Brick's lamp fuel decays with a fixed half-life. What fraction is left after ${n} half-lives?`, expression: `after ${n} half-lives`, answer: 0,
    hint: 'Each half-life multiplies what is left by 1/2.',
    steps: [`(1/2)${sup(n)} = ${lab(`1/${2 ** n}`, 'fraction left')}.`, `Not 1/${2 * n}: halving ${n} times multiplies, it does not add.`], visual: card('Half-lives', ['1 → 1/2 → 1/4 → …']), app: APP4,
  });
  return choose(rng, q, `1/${2 ** n}`, [`1/${2 * n}`, `1/${2 ** (n - 1)}`, `1/${n}`, `1/${2 ** (n + 1)}`]);
}

function logEvalStep(rng: Rng): AskStep {
  const o = pick(rng, [{ b: 2, k: rint(rng, 2, 6) }, { b: 3, k: rint(rng, 2, 4) }, { b: 5, k: rint(rng, 1, 3) }, { b: 10, k: rint(rng, -2, 4) }, { b: 2, k: -rint(rng, 1, 4) }, { b: 3, k: -rint(rng, 1, 3) }]);
  const N = o.b ** o.k;
  const NS = o.k < 0 && o.b !== 10 ? `(1/${o.b ** -o.k})` : fmt(N);
  const logS = o.b === 10 ? `log ${NS}` : `log${sub(o.b)} ${NS}`;
  const q = mkq(S(K4), 'log', {
    prompt: "Volt's sound meter works in logs. Evaluate:", expression: `${logS} = ?`, answer: o.k,
    hint: `Ask: ${o.b} to what power gives ${NS.replace(/[()]/g, '')}?`,
    steps: [`${o.b}${sup(o.k)} = ${NS.replace(/[()]/g, '')}.`, `So ${logS} = ${fmt(o.k)}.`], visual: card('A log is an exponent', ['log_b N = k  means  bᵏ = N']), app: APP4,
  });
  return typed(q);
}

const LOGN = [
  { n: '6', right: '0.778', wrong: ['0.144', '0.176', '0.602'], why: 'log 6 = log 2 + log 3 = 0.301 + 0.477' },
  { n: '1.5', right: '0.176', wrong: ['1.585', '0.778', '0.144'], why: 'log 1.5 = log 3 − log 2 = 0.477 − 0.301' },
  { n: '8', right: '0.903', wrong: ['0.027', '2.408', '0.602'], why: 'log 8 = 3·log 2 = 3 × 0.301' },
  { n: '9', right: '0.954', wrong: ['0.228', '4.293', '0.477'], why: 'log 9 = 2·log 3 = 2 × 0.477' },
  { n: '18', right: '1.255', wrong: ['0.068', '0.778', '1.079'], why: 'log 18 = log 2 + 2·log 3 = 0.301 + 0.954' },
];
function logNumericStep(rng: Rng): AskStep {
  const o = pick(rng, LOGN);
  const q = mkq(S(K4), 'log-laws', {
    prompt: `Ada's table has log 2 ≈ 0.301 and log 3 ≈ 0.477. Use log laws for log ${o.n}.`, expression: `log ${o.n} ≈ ?`, answer: 0,
    hint: 'Break the number into 2s and 3s. Products add logs, quotients subtract, powers multiply. Never multiply two logs together.',
    steps: [`${o.why}.`, `= ${o.right}.`], visual: card('Log laws', ['log(MN) = log M + log N', 'log(M/N) = log M − log N', 'log(Mᵏ) = k·log M']), app: APP4,
  });
  return choose(rng, q, o.right, o.wrong);
}

function logLawStep(rng: Rng): AskStep {
  const law = pick(rng, ['product', 'quotient', 'power'] as const); const k = rint(rng, 2, 5);
  const set = law === 'product' ? { e: 'log(MN)', right: 'log M + log N', wrong: ['log M · log N', 'log(M + N)', 'log M − log N'] }
    : law === 'quotient' ? { e: 'log(M/N)', right: 'log M − log N', wrong: ['log M ÷ log N', 'log(M − N)', 'log M + log N'] }
      : { e: `log(M${sup(k)})`, right: `${k}·log M`, wrong: [`(log M)${sup(k)}`, `log M + ${k}`, `log ${k} + log M`] };
  const q = mkq(S(K4), 'log-laws', {
    prompt: 'Vector checks your log laws before the growth lab opens. Which is equal?', expression: `${set.e} = ?`, answer: 0,
    hint: 'A log is an exponent. Multiplying numbers adds exponents; dividing subtracts; a power multiplies.',
    steps: [`${set.e} = ${set.right}.`, law === 'power' ? 'Mᵏ multiplies k copies of M, so its log adds k copies of log M.' : 'Logs turn multiplication into addition, like exponents do.'], visual: card('Exponent rules', ['10ᵃ · 10ᵇ = 10ᵃ⁺ᵇ', '10ᵃ / 10ᵇ = 10ᵃ⁻ᵇ']), app: APP4,
  });
  return choose(rng, q, set.right, set.wrong);
}

function changeBaseStep(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const r = pick(rng, [3, 4, 5, 6, 8, 10, 12]); const g = 1 + r / 100; const t = Math.log(2) / Math.log(g);
    const q = mkq(S(K4), 'change-of-base', {
      prompt: `Algae in Catalyst's tank grow ${r}% per day: N = N₀·${fmt(g)}ᵗ. How many days to double? (2 decimal places)`, expression: `${fmt(g)}ᵗ = 2`, answer: r2(t), tolerance: 0.015, unit: 'days',
      hint: 'Take logs of both sides: the exponent comes down as a multiplier.',
      steps: [`Daily factor 1 + ${r}/100 = ${lab(fmt(g), 'growth factor per day')}; doubling means ${fmt(g)}ᵗ = ${lab(2, 'times the start')}, so t·log ${fmt(g)} = log 2.`, `t = log 2 / log ${fmt(g)} = ${Math.log10(2).toFixed(6)} / ${Math.log10(g).toFixed(6)} ≈ ${lab(r2(t).toFixed(2), 'days')}.`], visual: card('Doubling time', ['bᵗ = 2  →  t = log 2 / log b']), app: APP4,
    });
    return typed(q);
  }
  const b = pick(rng, [3, 5, 7]); const N = pick(rng, [10, 20, 50, 100]); const v = Math.log(N) / Math.log(b);
  const q = mkq(S(K4), 'change-of-base', {
    prompt: `The calculator only has log (base 10). Find log${sub(b)} ${N} to 2 decimal places.`, expression: `log${sub(b)} ${N} ≈ ?`, answer: r2(v), tolerance: 0.015,
    hint: 'Change of base: log_b N = log N / log b.',
    steps: [`log${sub(b)} ${N} = log ${N} / log ${b}.`, `= ${Math.log10(N).toFixed(5)} / ${Math.log10(b).toFixed(5)} ≈ ${r2(v).toFixed(2)}.`], visual: card('Change of base', ['log_b N = log N / log b']), app: APP4,
  });
  return typed(q);
}

function balanceExpStep(rng: Rng): AskStep {
  const [u, v] = rng.shuffle([1, 2, 3]).slice(0, 2);
  let m = 0; let n = 0; let x = 0; let g = 0;
  do { x = rint(rng, -3, 5); m = rint(rng, -3, 3); n = (u * m + (u - v) * x) / v; } while ((!Number.isInteger(n) || Math.abs(n) > 6) && g++ < 60);
  if (!Number.isInteger(n) || Math.abs(n) > 6) { x = u === 1 ? 0 : 0; m = 0; n = 0; }
  const B1 = 2 ** u; const B2 = 2 ** v;
  const eq = `${B1}${sup(xm(-m))} = ${B2}${sup(xm(-n))}`;
  const q = mkq(S(K4), 'exp-equation', {
    prompt: `The vault lock opens when ${eq}. Both sides are powers of 2: solve for x.`, expression: eq, answer: x,
    hint: `Rewrite: ${B1} = 2${sup(u)} and ${B2} = 2${sup(v)}. Same base, so the exponents must be equal.`,
    steps: [`2${sup(u === 1 ? xm(-m) : `${u}(${xm(-m)})`)} = 2${sup(v === 1 ? xm(-n) : `${v}(${xm(-n)})`)}.`, `${lin(u, u * m)} = ${lin(v, v * n)}.`, `x = ${fmt(x)}.`], app: APP4,
  });
  return model(q, { kind: 'balance', a: u, b: u * m, c: v, d: v * n, label: 'Exponents of 2 must match' }, [String(x)], `Powers of 2: ${B1} = 2${sup(u)}, ${B2} = 2${sup(v)}. Balance the exponents to get x alone.`);
}

function logisticPick(rng: Rng): AskStep {
  const K = pick(rng, [400, 500]); const R: Range = [0, 10, 0, 600];
  const logistic = plotV(R, { segments: pathSegs((t) => [t, K / (1 + 24 * Math.exp(-0.9 * t))], 0, 10, 50), hlines: [{ y: K, label: `${K}` }] });
  const expo = plotV(R, { fns: [{ fn: { kind: 'exp', a: 20, base: Math.exp(0.35) } }], hlines: [{ y: K, label: `${K}` }] });
  const linear = plotV(R, { fns: [{ fn: poly(20, K / 10) }], hlines: [{ y: K, label: `${K}` }] });
  const decay = plotV(R, { fns: [{ fn: { kind: 'exp', a: K, base: 0.7 } }], hlines: [{ y: K, label: `${K}` }] });
  const q = mkq(S(K4), 'logistic', {
    prompt: `Catalyst's pond holds at most ${K} fish. Growth is fast at first, then slows near the limit. Which graph is this logistic model?`, expression: 'Logistic growth', answer: 0,
    hint: 'Logistic: starts like an exponential, bends over, and levels off at the carrying capacity.',
    steps: ['An S-shaped curve: fast growth while space is plentiful.', `It flattens toward the capacity line y = ${lab(K, 'fish, carrying capacity')} and never shoots through it.`], visual: card('Carrying capacity', [`limit ${K} fish`]), app: APP4,
  });
  return pickGraph(rng, q, [logistic, expo, linear, decay], 0);
}

function halfLifeSlider(rng: Rng): AskStep {
  const h = pick(rng, [2, 2.5, 3, 3.5, 4, 5, 6]);
  const q = mkq(S(K4), 'half-life', {
    prompt: 'Volt measures a capacitor draining from 80 V. The half-life is the time for it to fall to half.', expression: 'Read the half-life', answer: h, unit: 's',
    hint: 'Half of 80 (starting volts) is 40 (volts). Find where the curve crosses the 40 V line.',
    steps: [`The curve reaches ${lab(40, 'volts, half the start')} at t = ${lab(fmt(h), 'seconds')}.`, `Every ${lab(fmt(h), 'seconds')} it halves again: ${lab(20, 'volts')} at ${lab(fmt(2 * h), 'seconds')}.`], app: APP4,
  });
  return model(q, { kind: 'slider', min: 0, max: 12, step: 0.5, unit: 's', label: 'Slide to the half-life', range: [0, 12, 0, 90], layers: { fns: [{ fn: { kind: 'exp', a: 80, base: 0.5 ** (1 / h) } }], hlines: [{ y: 40, label: '40 V' }] } }, [String(h)], 'Slide the marker to the half-life.');
}

function decibelStep(rng: Rng): AskStep {
  const k = rint(rng, 1, 5); const ratio = 10 ** k;
  const q = mkq(S(K4), 'log-model', {
    prompt: `Sound level is L = 10·log(I/I₀) decibels. The turbine is ${ratio.toLocaleString('en-US')} times as intense as the fan. How many dB louder is it?`,
    expression: `10·log(${ratio.toLocaleString('en-US')}) = ?`, answer: 10 * k, unit: 'dB',
    hint: 'Multiplying the intensity adds to the log. Work out log of the ratio first.',
    steps: [`Intensity ratio ${lab(ratio.toLocaleString('en-US'), 'times as intense')}: log(${ratio.toLocaleString('en-US')}) = ${labn(k, 'power of ten', 'powers of ten')}.`, `${lab(10, 'dB per power of ten')} × ${labn(k, 'power of ten', 'powers of ten')} = ${lab(10 * k, 'dB louder')}.`], visual: card('Decibels', ['L = 10·log(I/I₀)']), app: 'Acoustic engineers use logs so a huge range of loudness fits a small scale.',
  });
  return typed(q);
}

function phStep(rng: Rng): AskStep {
  const k = rint(rng, 2, 12); const H = `0.${'0'.repeat(k - 1)}1`;
  const q = mkq(S(K4), 'log-model', {
    prompt: `Catalyst tests coolant: pH = −log[H⁺]. The coolant has [H⁺] = ${k <= 6 ? H : `10${sup(-k)}`} mol/L. What is its pH?`,
    expression: 'pH = ?', answer: k,
    hint: 'Write [H⁺] as a power of 10, take the log, then change the sign.',
    steps: [`[H⁺] = 10${sup(-k)} mol/L.`, `log[H⁺] = ${lab(fmt(-k), 'power of ten')}, so pH = −(${fmt(-k)}) = ${lab(k, 'pH units')}.`], visual: card('pH', ['pH = −log[H⁺]']), app: 'Chemical engineers keep pH in range to stop corrosion.',
  });
  return typed(q);
}

function quakeStep(rng: Rng): AskStep {
  const m1 = rint(rng, 3, 5); const d = rint(rng, 1, 3);
  const q = mkq(S(K4), 'log-model', {
    prompt: `On the Richter scale each +1 means 10 times the ground motion. How many times bigger is the motion in a magnitude ${m1 + d} quake than in a magnitude ${m1}?`,
    expression: `Magnitude ${m1 + d} vs ${m1}: how many times bigger?`, answer: 10 ** d,
    hint: 'Each step up multiplies by 10. Count the steps.',
    steps: [`${lab(m1 + d, 'magnitude')} − ${lab(m1, 'magnitude')} = ${labn(d, 'step')}.`, `10${sup(d)} = ${lab(10 ** d, 'times the ground motion')}.`], visual: card('A log scale', ['+1 step = ×10']), app: 'Structural engineers design for earthquakes measured on a log scale.',
  });
  return typed(q);
}

function percentGrowthChoose(rng: Rng): AskStep {
  const o = pick(rng, [{ P: 200, r: 10, n: 3 }, { P: 500, r: 10, n: 2 }, { P: 1000, r: 20, n: 3 }, { P: 500, r: 20, n: 2 }, { P: 1000, r: 10, n: 3 }, { P: 400, r: 50, n: 2 }]);
  const g = 1 + o.r / 100; const at = (n: number) => fmt(r4(o.P * g ** n));
  const q = mkq(S(K4), 'growth', {
    prompt: `Catalyst's culture of ${o.P} g grows ${o.r}% per day. How much is there after ${o.n} days?`, expression: `${o.P}·${fmt(g)}${sup(o.n)} = ?`, answer: 0,
    hint: `Growing ${o.r}% means multiplying by ${lab(fmt(g), 'daily factor')} each day. Each day's ${o.r}% is taken of a bigger amount than the day before.`,
    steps: [`Each day × ${lab(fmt(g), 'daily factor')}: ${Array.from({ length: o.n + 1 }, (_, i) => lab(at(i), i === 0 ? 'g at the start' : `g after day ${['', 'one', 'two', 'three', 'four'][i]}`)).join(' → ')}.`, `After ${o.n} days: ${lab(at(o.n), 'grams')}. (Adding ${lab(fmt((o.P * o.r) / 100), 'g a day')} would give ${lab(fmt(o.P + (o.n * o.P * o.r) / 100), 'grams')}: that is linear, not exponential.)`],
    visual: card('Percent growth', [`+${o.r}% a day = × ${fmt(g)} a day`]), app: APP4,
  });
  return choose(rng, q, `${at(o.n)} g`, [`${fmt(o.P + (o.n * o.P * o.r) / 100)} g`, `${at(o.n - 1)} g`, `${at(o.n + 1)} g`]);
}

const LN: Record<number, number> = { 2: Math.log(2), 3: Math.log(3), 4: Math.log(4), 5: Math.log(5), 10: Math.log(10) };
function lnSolveStep(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const k = pick(rng, [0.1, 0.2, 0.25, 0.4, 0.5]); const F = pick(rng, [2, 3, 5, 10]); const t = LN[F] / k;
    const q = mkq(S(K4), 'ln', {
      prompt: `Catalyst's culture grows continuously: N = N₀·e^(${fmt(k)}t), t in hours. How long until it is ${F} times as big? (2 decimal places)`, expression: `e^(${fmt(k)}t) = ${F}`, answer: r2(t), tolerance: 0.015, unit: 'h',
      hint: 'ln undoes e: ln(e^(kt)) = kt. Isolate the power of e, take ln of both sides, then divide.',
      steps: [`N = ${F}N₀ gives e^(${fmt(k)}t) = ${lab(F, 'times as big')}.`, `Take ln: ${fmt(k)}t = ln ${F} ≈ ${LN[F].toFixed(4)}.`, `t = ${LN[F].toFixed(4)} / ${lab(fmt(k), 'growth rate per hour')} ≈ ${lab(r2(t).toFixed(2), 'hours')}.`],
      visual: card('Natural log', ['ln x = logₑ x,  e ≈ 2.718', 'ln(eᵏ) = k']), app: APP4,
    });
    return typed(q);
  }
  const tau = pick(rng, [2, 4, 5, 10]); const o = pick(rng, [{ F: 2, pc: 50 }, { F: 4, pc: 25 }, { F: 5, pc: 20 }, { F: 10, pc: 10 }]); const t = tau * LN[o.F];
  const q = mkq(S(K4), 'ln', {
    prompt: `Volt's capacitor discharges as V = V₀·e^(−t/${tau}), t in seconds. When is it down to ${o.pc}% of V₀? (2 decimal places)`, expression: `e^(−t/${tau}) = ${fmt(o.pc / 100)}`, answer: r2(t), tolerance: 0.015, unit: 's',
    hint: 'Divide by V₀, take ln of both sides, and remember ln of a number below 1 is negative.',
    steps: [`e^(−t/${tau}) = ${lab(fmt(o.pc / 100), 'fraction of the start voltage')}, so −t/${tau} = ln ${fmt(o.pc / 100)} = −ln ${o.F} ≈ −${LN[o.F].toFixed(4)}.`, `t = ${lab(tau, 'seconds, time constant')} × ${LN[o.F].toFixed(4)} ≈ ${lab(r2(t).toFixed(2), 'seconds')}.`],
    visual: card('Natural log', ['ln x = logₑ x,  e ≈ 2.718', 'ln(1/F) = −ln F']), app: APP4,
  });
  return typed(q);
}

function lnLawChoose(rng: Rng): AskStep {
  const k = rint(rng, 2, 6); const [u, v] = rng.shuffle([2, 3, 4, 5]).slice(0, 2); const n = pick(rng, [5, 7, 9]);
  const o = pick(rng, [
    { e: 'Which statement is true for all a, b > 0?', right: 'ln(ab) = ln a + ln b', wrong: ['ln(a + b) = ln a + ln b', 'ln(ab) = ln a · ln b', 'ln(a/b) = ln a / ln b'], why: 'ln is an exponent (base e): multiplying numbers adds their exponents.' },
    { e: `ln(e${sup(k)}) = ?`, right: String(k), wrong: [`e${sup(k)}`, `${k}e`, '1'], why: `ln asks "e to what power?" The power is ${k}. ln and e undo each other.` },
    { e: `ln(e${sup(u)} · e${sup(v)}) = ?`, right: String(u + v), wrong: [String(u * v), `e${sup(u + v)}`, `e${sup(u * v)}`], why: `e${sup(u)} · e${sup(v)} = e${sup(u + v)} (add exponents), and ln(e${sup(u + v)}) = ${u + v}.` },
    { e: `e^(ln ${n}) = ?`, right: String(n), wrong: [`ln ${n}`, `e${sup(n)}`, '1'], why: `ln ${n} is the power of e that gives ${n}, so raising e to it gives ${n} back.` },
  ]);
  const q = mkq(S(K4), 'ln', {
    prompt: "Catalyst's continuous-growth models use ln, the log with base e (e ≈ 2.718).", expression: o.e, answer: 0,
    hint: 'ln x = logₑ x: it undoes eˣ. It follows every log law: products add, quotients subtract, powers come down.',
    steps: [o.why, `So the answer is ${o.right}.`], visual: card('ln and e', ['ln x = logₑ x', 'ln y = k  means  eᵏ = y']), app: APP4,
  });
  return choose(rng, q, o.right, o.wrong);
}

const EXTR: [number, number, number, number][] = [[2, 3, 4, -2], [6, 4, 8, -2], [3, 2, 4, -1], [7, 3, 8, -1], [4, 5, 8, -4], [1, 1, 2, -1]];
function logExtraneousChoose(rng: Rng): AskStep {
  const [k, n, sol, bad] = pick(rng, EXTR); const N = 2 ** n; const eq = `log₂ x + log₂(${xm(k)}) = ${n}`;
  const q = mkq(S(K4), 'log-equation', {
    prompt: `Volt's log amplifier balances when ${eq}. Solve for x.`, expression: eq, answer: 0,
    hint: 'Combine with the product law, rewrite as a power of 2, solve the quadratic, then CHECK each root: you cannot take the log of a negative number.',
    steps: [`log₂(x(${xm(k)})) = ${n}, so x(${xm(k)}) = 2${sup(n)} = ${N}.`, `x² − ${k === 1 ? '' : k}x − ${N} = 0 → (${xm(sol)})(${xm(bad)}) = 0 → x = ${sol} or x = ${fmt(bad)}.`, `x = ${fmt(bad)} would need log₂ of a negative number: it is extraneous. x = ${sol}.`],
    visual: card('Log equations', ['log M + log N = log(MN)', 'check every root in the original']), app: APP4,
  });
  return choose(rng, q, `x = ${sol}`, [`x = ${sol} or x = ${fmt(bad)}`, `x = ${fmt(bad)}`, `x = ${fmt((N + k) / 2)}`]);
}

function logisticReadStep(rng: Rng): AskStep {
  const K = pick(rng, [400, 600, 1000, 1200]); const A = pick(rng, [3, 4, 9, 19, 24]); const r = pick(rng, [0.5, 0.8, 1.2]);
  const which = pick(rng, ['cap', 'start', 'mid'] as const);
  const ans = which === 'cap' ? K : which === 'start' ? K / (1 + A) : K / 2;
  const fS = `P(t) = ${K} / (1 + ${A}e^(−${fmt(r)}t))`;
  const q = mkq(S(K4), 'logistic', {
    prompt: `Catalyst models the fish in a pond with ${fS}, t in years. ${which === 'cap' ? 'What population does it level off at?' : which === 'start' ? 'How many fish are there at t = 0?' : 'What is the population when growth is fastest, in the middle of the S?'}`,
    expression: which === 'cap' ? 'carrying capacity = ?' : which === 'start' ? 'P(0) = ?' : 'P at the fastest growth = ?', answer: ans, unit: 'fish',
    hint: which === 'cap' ? 'As t grows, what happens to e^(−rt)? What is left of the fraction?' : which === 'start' ? 'e⁰ = 1.' : 'The S-curve is steepest halfway up to the carrying capacity.',
    steps: which === 'cap' ? [`As t → ∞, e^(−${fmt(r)}t) → 0.`, `P → ${K}/(1 + 0) = ${lab(K, 'fish')}: the carrying capacity.`] : which === 'start' ? [`P(0) = ${K}/(1 + ${A}·e⁰) = ${K}/${1 + A}.`, `= ${lab(fmt(ans), 'fish at the start')}.`] : [`The capacity is ${lab(K, 'fish')}, the top of the S.`, `The steepest point is halfway: ${lab(K, 'fish capacity')} ÷ 2 = ${lab(K / 2, 'fish')}.`],
    visual: card('Logistic model', [fS, 'P = K / (1 + A·e^(−rt))']), app: APP4,
  });
  return typed(q);
}

/* ================================================================== */
/* 5. Trig functions of real numbers                                   */
/* ================================================================== */
const K5 = 'trigfns';
const APP5 = 'AC current, rotating machinery, sound and tides all run on sine and cosine of a real-number input.';

function radianUnitStep(rng: Rng): AskStep {
  const deg = pick(rng, SPECIAL.slice(1));
  const q = mkq(S(K5), 'radians', {
    prompt: `Volt's rotor has turned ${rad(deg)} radians from the start line.`, expression: `θ = ${rad(deg)}`, answer: deg, answerText: String(deg),
    hint: 'π radians is half a turn (180°). Count how many π/6 or π/4 slices that is.',
    steps: [`${rad(deg)} × 180°/π = ${lab(`${deg}°`, 'rotor angle')}.`, `So the rotor points at ${deg}° on the circle.`], app: APP5,
  });
  return model(q, { kind: 'unitcircle', label: 'Tap the angle' }, [String(deg)], `Tap θ = ${rad(deg)} on the unit circle.`);
}

function trigExactStep(rng: Rng): AskStep {
  const f = pick(rng, ['sin', 'cos', 'tan'] as const);
  const deg = pick(rng, SPECIAL.filter((d) => d % 90 !== 0 || f !== 'tan' || d % 180 === 0).filter((d) => d !== 0));
  const v = trigAt(f, deg); const right = exact(v);
  const other = f === 'sin' ? trigAt('cos', deg) : f === 'cos' ? trigAt('sin', deg) : v === 0 ? 1 : 1 / v;
  const q = mkq(S(K5), 'exact-values', {
    prompt: "Volt reads the rotor position off the unit circle: x = cos t, y = sin t, tan t = y/x.", expression: `${f}(${rad(deg)}) = ?`, answer: 0,
    hint: 'Find the reference angle, take its value, then fix the sign from the quadrant.',
    steps: [`${rad(deg)} is ${deg}°; the point is (${exact(trigAt('cos', deg))}, ${exact(trigAt('sin', deg))}).`, `${f}(${rad(deg)}) = ${right}.`],
    visual: { type: 'unitcircle', angle: deg, radians: true }, app: APP5,
  });
  return choose(rng, q, right, [exact(other), exact(-v), exact(-other), '1/2', '√3/2', '−1/2']);
}

const EQS: { f: Trig; v: number; s: string }[] = [
  { f: 'sin', v: 0.5, s: '2 sin x − 1 = 0' }, { f: 'sin', v: -0.5, s: '2 sin x + 1 = 0' }, { f: 'cos', v: 0.5, s: '2 cos x − 1 = 0' }, { f: 'cos', v: -0.5, s: '2 cos x + 1 = 0' },
  { f: 'sin', v: Math.SQRT1_2, s: '√2 sin x − 1 = 0' }, { f: 'cos', v: -Math.SQRT1_2, s: '√2 cos x + 1 = 0' }, { f: 'sin', v: -Math.sqrt(3) / 2, s: '2 sin x + √3 = 0' },
  { f: 'cos', v: Math.sqrt(3) / 2, s: '2 cos x − √3 = 0' }, { f: 'tan', v: 1, s: 'tan x − 1 = 0' }, { f: 'tan', v: -1, s: 'tan x + 1 = 0' }, { f: 'tan', v: Math.sqrt(3), s: 'tan x − √3 = 0' },
];
const solsOf = (f: Trig, v: number) => SPECIAL.filter((d) => !(f === 'tan' && d % 180 === 90) && Math.abs(trigAt(f, d) - v) < 1e-9);
const solStr = (ds: number[]) => (ds.length ? ds.map(rad).join(', ') : 'no solution');

function trigEqStep(rng: Rng): AskStep {
  const e = pick(rng, EQS); const sols = solsOf(e.f, e.v);
  const other: Trig = e.f === 'sin' ? 'cos' : e.f === 'cos' ? 'sin' : 'tan';
  const q = mkq(S(K5), 'equations', {
    prompt: 'Solve on [0, 2π). The signal hits this level more than once per turn.', expression: e.s, answer: 0,
    hint: `Isolate ${e.f} x, find the reference angle, then find EVERY angle in one turn with that value and sign.`,
    steps: [`${e.f} x = ${exact(e.v)}.`, `On [0, 2π) that happens at x = ${solStr(sols)}.`, 'One inverse-trig answer is never the whole story: check each quadrant.'],
    visual: plotV([0, 6.3, -2, 2], { fns: [{ fn: { kind: e.f } }], hlines: [{ y: Math.max(-2, Math.min(2, e.v)) }] }), app: APP5,
  });
  const wrong = [solStr([sols[0]]), solStr(solsOf(e.f, -e.v)), solStr(e.f === 'tan' ? solsOf('tan', 1 / e.v) : solsOf(other, e.v)), solStr([sols[0], (sols[0] + 180) % 360].sort((a, b) => a - b))];
  return choose(rng, q, solStr(sols), wrong);
}

function trigEqUnitStep(rng: Rng): AskStep {
  const e = pick(rng, EQS.filter((x) => x.f !== 'tan')); const sols = solsOf(e.f, e.v); const s = pick(rng, sols); const quad = Math.floor(s / 90);
  const q = mkq(S(K5), 'equations', {
    prompt: `Volt's rotor must stop where ${e.s}. One solution lies between ${QUAD_RANGE[quad]}: find it.`, expression: e.s, answer: s, answerText: String(s),
    hint: `${e.f} is the ${e.f === 'sin' ? 'y' : 'x'}-coordinate on the unit circle. Which point in that quarter has the right value?`,
    steps: [`${e.f} x = ${exact(e.v)}: solutions ${solStr(sols)}.`, `The one between ${QUAD_RANGE[quad]} is ${rad(s)}.`], app: APP5,
  });
  return model(q, { kind: 'unitcircle', label: `${e.f} x = ${exact(e.v)}` }, [String(s)], `Tap the solution between ${QUAD_RANGE[quad]}.`);
}

/** B = p/q inside sin(Bx); the period 2π/B is (2q/p)π. */
const PERIODS = [{ B: '2x', p: 2, q: 1 }, { B: '3x', p: 3, q: 1 }, { B: '4x', p: 4, q: 1 }, { B: 'x/2', p: 1, q: 2 }, { B: '6x', p: 6, q: 1 }];
function periodStep(rng: Rng): AskStep {
  const P = pick(rng, PERIODS); const A = pick(rng, [2, 3, 5]); const f = pick(rng, ['sin', 'cos']);
  // the A-based slips come first: choose() keeps the first three distinct wrong answers
  const o = { B: P.B, right: piStr(2 * P.q, P.p), wrong: [piStr(2 * P.q * A, P.p), piStr(2 * P.q, P.p * A), piStr(2 * P.p, P.q), '2π'] };
  const q = mkq(S(K5), 'period', {
    prompt: `A vibrating beam follows y = ${A} ${f}(${o.B}). How long is one full cycle?`, expression: `Period of y = ${A} ${f}(${o.B})`, answer: 0,
    hint: 'One cycle is complete when the INSIDE, Bx, runs through 2π. Solve Bx = 2π.',
    steps: [`${o.B} = 2π when x = ${o.right}.`, `Period = 2π/B = ${o.right}. The ${lab(A, 'amplitude')} changes the height, not the period.`], visual: card('Period', ['y = A sin(Bx)', 'period = 2π / B']), app: APP5,
  });
  return choose(rng, q, o.right, o.wrong);
}

function amplitudePick(rng: Rng): AskStep {
  const A = pick(rng, [1, 2, 3]); const B = pick(rng, [1, 2]); const D = pick(rng, [-1, 0, 1]);
  const mk = (a: number, b: number, d: number): Visual => plotV([0, 6.5, -4.5, 4.5], { fns: [{ fn: { kind: 'sin', amp: a, freq: b, shift: d } }], hlines: d ? [{ y: d }] : [] });
  const yS = `y = ${A === 1 ? '' : `${A} `}sin${B === 1 ? ' x' : `(${B}x)`}${D ? ` ${fmtSigned(D)}` : ''}`;
  const q = mkq(S(K5), 'graphs', {
    prompt: `Volt's AC signal is ${yS}. Which graph shows it?`, expression: yS, answer: 0,
    hint: 'Read three things: the midline (+D), the height above the midline (A) and how many waves fit in 2π (B).',
    steps: [`Midline y = ${fmt(D)}; amplitude ${A}, so it runs from ${fmt(D)} − ${A} = ${lab(fmt(D - A), 'lowest value')} to ${fmt(D)} + ${A} = ${lab(fmt(D + A), 'highest value')}.`, `B = ${B}: ${B} full wave${B > 1 ? 's' : ''} between 0 and 2π ≈ 6.28.`], visual: card('Reading a sine', ['y = A sin(Bx) + D']), app: APP5,
  });
  return pickGraph(rng, q, [mk(A, B, D), mk(A === 1 ? 2 : A - 1, B, D), mk(A, B === 1 ? 2 : 1, D), mk(A, B, D === 0 ? 1 : -D)], 0);
}

const IDS = [
  { e: '(1 − cos²x) / sin x', right: 'sin x', wrong: ['cos x', '1 − cos x', '1/sin x'], why: '1 − cos²x = sin²x, and sin²x / sin x = sin x.', hint: 'Use sin²x + cos²x = 1 to rewrite the top, then cancel.' },
  { e: 'tan x · cos x', right: 'sin x', wrong: ['cos²x', '1', 'tan x'], why: 'tan x = sin x / cos x, so the cos x cancels.', hint: 'Rewrite tan x in sin and cos, then cancel.' },
  { e: 'sec²x − tan²x', right: '1', wrong: ['0', '−1', 'sec x − tan x'], why: 'Divide sin²x + cos²x = 1 by cos²x: tan²x + 1 = sec²x.', hint: 'Divide sin²x + cos²x = 1 through by cos²x and see what it says about sec²x and tan²x.' },
  { e: 'sin x / tan x', right: 'cos x', wrong: ['sin²x', 'tan x', '1/cos x'], why: 'sin x ÷ (sin x / cos x) = cos x.', hint: 'Rewrite tan x in sin and cos, then divide.' },
  { e: '2 sin x cos x', right: 'sin 2x', wrong: ['sin²x', 'cos 2x', '2 sin x'], why: 'Double-angle identity: sin 2x = 2 sin x cos x.', hint: 'This is a double-angle pattern: which function of 2x expands to 2 sin x cos x?' },
  { e: 'cos(π/2 − x)', right: 'sin x', wrong: ['cos x', '−sin x', 'cos(π/2) − cos x'], why: 'Cofunction identity: cos(π/2 − x) = sin x. Cosine does not distribute.', hint: 'Cofunction identity: a trig function of the complementary angle π/2 − x equals its co-function of x. (Cosine does not distribute over the subtraction.)' },
  { e: 'sin(x + π)', right: '−sin x', wrong: ['sin x', 'sin x + π', 'cos x'], why: 'Adding π moves to the opposite point of the circle: both coordinates flip sign.', hint: 'On the unit circle, adding π takes you to the diametrically opposite point. What happens to its y-coordinate?' },
];
function identityStep(rng: Rng): AskStep {
  const o = pick(rng, IDS);
  const q = mkq(S(K5), 'identities', {
    prompt: 'Vector simplifies a control formula. Which expression equals it wherever both sides are defined?', expression: `${o.e} = ?`, answer: 0,
    hint: o.hint,
    steps: [o.why, `So ${o.e} = ${o.right}.`], visual: card('Toolbox', ['sin²x + cos²x = 1', 'tan x = sin x / cos x', 'sec x = 1 / cos x']), app: APP5,
  });
  return choose(rng, q, o.right, o.wrong);
}

const TURB: Record<number, number> = { 0: 1, 2: 0.5, 3: 0, 4: -0.5, 6: -1, 8: -0.5, 9: 0, 10: 0.5 };
function turbineStep(rng: Rng): AskStep {
  const C = pick(rng, [10, 12, 15]); const R = pick(rng, [4, 6, 8]); const t = pick(rng, [0, 2, 3, 4, 6, 8, 9, 10]);
  const c = TURB[t]; const h = C - R * c; const arg = t === 0 ? '0' : rad(t * 30);
  const q = mkq(S(K5), 'models', {
    prompt: `A turbine blade tip's height is h(t) = ${C} − ${R} cos(πt/6) metres, t in seconds. Find h(${t}).`, expression: `h(${t}) = ?`, answer: h, unit: 'm',
    hint: 'πt/6 is an angle in radians. Work it out, take its cosine from the unit circle, then substitute.',
    steps: [`πt/6 at t = ${lab(t, 'seconds')} is ${arg}.`, `cos(${arg}) = ${exact(c)}.`, `h = ${lab(C, 'hub height in m')} − ${lab(R, 'blade length in m')}·(${exact(c)}) = ${lab(fmt(h), 'm high')}.`],
    visual: plotV([0, 12, 0, C + R + 2], { fns: [{ fn: { kind: 'cos', amp: -R, freq: Math.PI / 6, shift: C } }] }), app: APP5,
  });
  return typed(q);
}

const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
function pythagIdStep(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, TRIPLES); const quad = pick(rng, [2, 3, 4]); const givenSin = rng.next() < 0.5;
  const sinSign = quad === 2 ? 1 : -1; const cosSign = quad === 4 ? 1 : -1;
  const sinV = (sinSign * a) / c; const cosV = (cosSign * b) / c;
  const ans = givenSin ? cosV : sinV;
  const Q = ['', 'I', 'II', 'III', 'IV'][quad];
  const q = mkq(S(K5), 'identities', {
    prompt: `Volt's rotor sensor reads ${givenSin ? 'sin' : 'cos'} t = ${fracStr(givenSin ? sinSign * a : cosSign * b, c)}, with t in quadrant ${Q}. Find ${givenSin ? 'cos' : 'sin'} t.`,
    expression: `${givenSin ? 'cos' : 'sin'} t = ?`, answer: ans, fraction: true, answerText: fracStr(givenSin ? cosSign * b : sinSign * a, c),
    hint: `Use sin²t + cos²t = 1 for the size, then the quadrant for the sign.`,
    steps: [`${givenSin ? 'cos' : 'sin'}²t = 1 − (${fracStr(givenSin ? a : b, c)})² = ${fracStr((givenSin ? b : a) ** 2, c * c)}.`, `Size ${fracStr(givenSin ? b : a, c)}; in quadrant ${Q} ${givenSin ? 'cos' : 'sin'} is ${ans < 0 ? 'negative' : 'positive'}: ${fracStr(Math.round(ans * c), c)}.`],
    visual: card('Pythagorean identity', ['sin²t + cos²t = 1', 'signs: ASTC by quadrant']), app: APP5,
  });
  return typed(q);
}

function acPeriodStep(rng: Rng): AskStep {
  const o = pick(rng, [{ B: 100, ms: 20 }, { B: 50, ms: 40 }, { B: 200, ms: 10 }, { B: 80, ms: 25 }, { B: 40, ms: 50 }]);
  const V = pick(rng, [120, 170, 325]);
  const q = mkq(S(K5), 'models', {
    prompt: `Volt's signal generator outputs V(t) = ${V} sin(${o.B}πt) volts, t in seconds. How many milliseconds is one cycle?`, expression: 'Period in ms', answer: o.ms, unit: 'ms',
    hint: 'Period = 2π / B. Here B includes the π.',
    steps: [`Period = 2π / (${o.B}π) = 2/${o.B} = ${lab(fmt(o.ms / 1000), 'seconds per cycle')}.`, `= ${lab(o.ms, 'milliseconds per cycle')}, a frequency of ${lab(1000 / o.ms, 'cycles per second')}.`], visual: card('Signal generator', [`V(t) = ${V} sin(${o.B}πt)`]), app: 'Electrical engineers read a signal’s period to set timers and filters (mains power runs at 50 or 60 Hz).',
  });
  return typed(q);
}

function tideStep(rng: Rng): AskStep {
  const D = rint(rng, 4, 9); const A = rint(rng, 2, Math.min(4, D - 1)); const hi = rng.next() < 0.5;
  const q = mkq(S(K5), 'models', {
    prompt: `Ada's lock gate sees water depth d(t) = ${D} + ${A} sin(πt/6) metres. What is the ${hi ? 'deepest' : 'shallowest'} the water gets?`,
    expression: `${hi ? 'max' : 'min'} of d(t)`, answer: hi ? D + A : D - A, unit: 'm',
    hint: 'sin never goes above 1 or below −1.',
    steps: [`sin(πt/6) ranges from −1 to 1.`, `So d runs from ${lab(D, 'mean depth in m')} − ${lab(A, 'tide swing in m')} = ${lab(D - A, 'm, shallowest')} to ${D} + ${A} = ${lab(D + A, 'm, deepest')}.`], visual: plotV([0, 12, 0, D + A + 2], { fns: [{ fn: { kind: 'sin', amp: A, freq: Math.PI / 6, shift: D } }] }), app: 'Harbour and lock engineers plan gates around the tide curve.',
  });
  return typed(q);
}

const ADV_EQ = [
  { s: 'sin 2x = sin x', sols: [0, 60, 180, 300], wrongs: [[60, 300], [0, 180], [0, 60, 180, 300, 360]],
    steps: ['sin 2x = 2 sin x cos x, so 2 sin x cos x − sin x = 0 → sin x (2 cos x − 1) = 0.', 'sin x = 0 → x = 0, π; cos x = 1/2 → x = π/3, 5π/3.', 'Dividing both sides by sin x would lose x = 0 and π: factor instead.'] },
  { s: 'sin 2x = cos x', sols: [30, 90, 150, 270], wrongs: [[30, 150], [90, 270], [30, 90, 150]],
    steps: ['sin 2x = 2 sin x cos x, so 2 sin x cos x − cos x = 0 → cos x (2 sin x − 1) = 0.', 'cos x = 0 → x = π/2, 3π/2; sin x = 1/2 → x = π/6, 5π/6.', 'Dividing both sides by cos x would lose π/2 and 3π/2: factor instead.'] },
  { s: 'cos²x − sin²x = 1/2', sols: [30, 150, 210, 330], wrongs: [[30, 150], [60, 300], [120, 240]],
    steps: ['cos²x − sin²x = cos 2x, so cos 2x = 1/2.', 'For x in [0, 2π), 2x runs over two turns: 2x = π/3, 5π/3, 7π/3, 11π/3.', 'Halve each: x = π/6, 5π/6, 7π/6, 11π/6.'] },
];
const radList = (ds: number[]) => (ds.length ? [...ds].sort((u, v) => u - v).map(radStr).join(', ') : 'no solution');
function trigEqAdvStep(rng: Rng): AskStep {
  if (rng.next() < 0.45) {
    const o = pick(rng, ADV_EQ);
    const q = mkq(S(K5), 'equations', {
      prompt: `Volt's two signals match when ${o.s}. Solve on [0, 2π).`, expression: o.s, answer: 0,
      hint: 'Use an identity to write everything in one angle x, move everything to one side and FACTOR. Never divide by a trig function that could be 0.',
      steps: o.steps, visual: card('Identities', ['sin 2x = 2 sin x cos x', 'cos 2x = cos²x − sin²x']), app: APP5,
    });
    return choose(rng, q, radList(o.sols), o.wrongs.map(radList));
  }
  const f = pick(rng, ['sin', 'cos'] as const); const v = pick(rng, [0.5, -0.5, Math.SQRT1_2, -Math.SQRT1_2, Math.sqrt(3) / 2, -Math.sqrt(3) / 2]);
  const us = solsOf(f, v); const xs = [...us.map((u) => u / 2), ...us.map((u) => (u + 360) / 2)];
  const vS = exact(v); const eq = `${f} 2x = ${vS}`;
  const q = mkq(S(K5), 'equations', {
    prompt: `A vibrating shaft hits the level when ${eq}. Solve on [0, 2π).`, expression: eq, answer: 0,
    hint: 'Let u = 2x. As x runs over [0, 2π), u runs over [0, 4π): TWO full turns. Find every u, then halve.',
    steps: [`u = 2x runs over [0, 4π). ${f} u = ${vS} at u = ${radList(us)} in the first turn, and ${radList(us.map((u) => u + 360))} in the second.`, `Halve each: x = ${radList(xs)}.`],
    visual: plotV([0, 6.3, -1.5, 1.5], { fns: [{ fn: { kind: f, freq: 2 } }], hlines: [{ y: v }] }), app: APP5,
  });
  return choose(rng, q, radList(xs), [radList(us.map((u) => u / 2)), radList(us), radList(solsOf(f, -v).flatMap((u) => [u / 2, (u + 360) / 2]))]);
}

/* ================================================================== */
/* 6. Polar coordinates & complex numbers                              */
/* ================================================================== */
const K6 = 'polar';
const APP6 = 'Radar, sonar and robot arms think in (distance, angle); AC circuits add phasors as complex numbers.';
const surd = (k: number, root: number) => (k === 0 ? '0' : `${k < 0 ? '−' : ''}${Math.abs(k) === 1 ? '' : Math.abs(k)}√${root}`);
const cx = (a: number, b: number) => (b === 0 ? fmt(a) : a === 0 ? coefTerm(b, 'i') : `${fmt(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : fmt(Math.abs(b))}i`);

function polarToRectPlot(rng: Rng): AskStep {
  let deg: number; let rS: string; let x: number; let y: number;
  if (rng.next() < 0.55) { deg = pick(rng, [45, 135, 225, 315]); const k = rint(rng, 1, 5); rS = surd(k, 2); x = k * Math.sign(trigAt('cos', deg)); y = k * Math.sign(trigAt('sin', deg)); }
  else { deg = pick(rng, [90, 180, 270]); const r = rint(rng, 1, 6); rS = String(r); x = Math.round(r * trigAt('cos', deg)); y = Math.round(r * trigAt('sin', deg)); }
  const q = mkq(S(K6), 'polar-to-rect', {
    prompt: `The radar reports a drone at (r, θ) = (${rS}, ${rad(deg)}).`, expression: `(${rS}, ${rad(deg)}) → (x, y)`, answer: 0, answerText: `(${fmt(x)}, ${fmt(y)})`,
    hint: 'θ is measured anticlockwise from the positive x-axis. x = r cos θ, y = r sin θ.',
    steps: [`x = ${rS}·cos(${rad(deg)}) = ${lab(fmt(x), 'across')}.`, `y = ${rS}·sin(${rad(deg)}) = ${lab(fmt(y), 'up')}.`], app: APP6,
  });
  return model(q, { kind: 'plot', range: [-7, 7, -7, 7], count: 1, label: 'Radar screen' }, [`${x},${y}`], 'Tap the drone’s (x, y) position.');
}

function polarPlotChoose(rng: Rng): AskStep {
  const r = rint(rng, 2, 5); const deg = pick(rng, [90, 180, 270]);
  const x = Math.round(r * trigAt('cos', deg)); const y = Math.round(r * trigAt('sin', deg)); const th = ((deg * Math.PI) / 180).toFixed(2);
  const pt = (u: number | string, v: number | string) => `(${typeof u === 'number' ? fmt(u) : u}, ${typeof v === 'number' ? fmt(v) : v})`;
  const q = mkq(S(K6), 'polar-to-rect', {
    prompt: `Ada's radar reports a drone at (r, θ) = (${r}, ${rad(deg)}). Where is it on the (x, y) map?`, expression: `(${r}, ${rad(deg)}) → (x, y)`, answer: 0,
    hint: '(r, θ) is not (x, y): r is a distance and θ a direction. Face along θ from the positive x-axis, then walk r units.',
    steps: [`θ = ${rad(deg)} points along ${AXIS_DIR[deg]}.`, `x = ${lab(r, 'distance')}·cos(${rad(deg)}) = ${lab(fmt(x), 'across')}, y = ${r}·sin(${rad(deg)}) = ${lab(fmt(y), 'up')}: ${pt(x, y)}.`],
    visual: card('Polar vs grid', ['(r, θ): distance r, direction θ', 'x = r cos θ, y = r sin θ']), app: APP6,
  });
  return choose(rng, q, pt(x, y), [pt(r, th), pt(y, x), pt(-x, -y), pt(r, 0)]);
}

function rectToPolarR(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5], [9, 12, 15]] as [number, number, number][]);
  const x = a * pick(rng, [1, -1]); const y = b * pick(rng, [1, -1]);
  const q = mkq(S(K6), 'rect-to-polar', {
    prompt: `Sonar puts a buoy at (x, y) = (${fmt(x)}, ${fmt(y)}) km. How far is it from the ship at the origin?`, expression: `r = ?`, answer: c, unit: 'km',
    hint: 'r is the hypotenuse: r² = x² + y². Signs do not matter once squared.',
    steps: [`r² = ${par(x)}² + ${par(y)}² = ${a * a} + ${b * b} = ${lab(c * c, 'square km')}.`, `r = √${c * c} = ${lab(c, 'km from the ship')}. Not ${a + b}: distances do not add across a right angle.`],
    visual: plotV([-c - 1, c + 1, -c - 1, c + 1], { points: [{ x, y, label: 'buoy' }], segments: [{ a: [0, 0], b: [x, y] }, { a: [0, 0], b: [x, 0], dashed: true, color: 'muted' }, { a: [x, 0], b: [x, y], dashed: true, color: 'muted' }] }), app: APP6,
  });
  return typed(q);
}

/** A point at a special angle with nice coordinates (as strings) plus its angle. */
function specialPoint(rng: Rng, degs: number[]) {
  const deg = pick(rng, degs); const k = rint(rng, 1, 4); const m = deg % 180; const ref = m <= 90 ? m : 180 - m;
  const sx = Math.sign(Math.round(trigAt('cos', deg) * 1e6)); const sy = Math.sign(Math.round(trigAt('sin', deg) * 1e6));
  const X = ref === 30 ? surd(sx * k, 3) : fmt(sx * k); const Y = ref === 60 ? surd(sy * k, 3) : fmt(sy * k);
  return { deg, ref, X: ref === 90 ? '0' : X, Y: ref === 0 ? '0' : Y };
}
const AXIS_DIR: Record<number, string> = { 0: 'the positive x-axis (east)', 90: 'the positive y-axis (north)', 180: 'the negative x-axis (west)', 270: 'the negative y-axis (south)' };

function polarAngleUnitStep(rng: Rng): AskStep {
  const p = specialPoint(rng, SPECIAL);
  const q = mkq(S(K6), 'rect-to-polar', {
    prompt: `A sonar echo comes from (x, y) = (${p.X}, ${p.Y}). Which direction θ is it?`, expression: `θ for (${p.X}, ${p.Y})`, answer: p.deg, answerText: String(p.deg),
    hint: p.deg % 90 === 0 ? 'One coordinate is 0, so the echo lies on an axis. Which way along it?' : 'Find the reference angle from |y|/|x|, then use the signs of x and y to pick the quadrant.',
    steps: [p.deg % 90 === 0 ? `One coordinate is 0: the point lies on ${AXIS_DIR[p.deg]}.` : `Reference angle: tan⁻¹(|y|/|x|) = ${lab(`${p.ref}°`, 'reference angle')}.`, `x is ${p.X.startsWith('−') ? 'negative' : p.X === '0' ? 'zero' : 'positive'}, y is ${p.Y.startsWith('−') ? 'negative' : p.Y === '0' ? 'zero' : 'positive'}: θ = ${p.deg}° = ${rad(p.deg)}.`], app: APP6,
  });
  return model(q, { kind: 'unitcircle', label: 'Direction of the echo' }, [String(p.deg)], `Tap the direction of (${p.X}, ${p.Y}).`);
}

function polarAngleChoose(rng: Rng): AskStep {
  const p = specialPoint(rng, [120, 135, 150, 210, 225, 240]);
  const calc = p.deg - 180;
  const q = mkq(S(K6), 'rect-to-polar', {
    prompt: `Ada's robot must turn to face (${p.X}, ${p.Y}). What is θ in [0, 2π)?`, expression: `θ for (${p.X}, ${p.Y})`, answer: 0,
    hint: 'tan⁻¹(y/x) only returns angles between −π/2 and π/2. Check which quadrant the point is really in.',
    steps: [`tan⁻¹(y/x) gives ${rad(calc)}, but the point has x ${p.X.startsWith('−') ? '< 0' : '> 0'} and y ${p.Y.startsWith('−') ? '< 0' : '> 0'}.`, `Quadrant ${p.deg < 180 ? 'II' : 'III'}: θ = ${rad(p.deg)}.`],
    visual: plotV([-5, 5, -5, 5], { vectors: [{ x: Math.cos((p.deg * Math.PI) / 180) * 4, y: Math.sin((p.deg * Math.PI) / 180) * 4 }] }), app: APP6,
  });
  return choose(rng, q, `θ = ${rad(p.deg)}`, [`θ = ${rad(calc)}`, `θ = ${rad((p.deg + 180) % 360)}`, `θ = ${rad(p.ref)}`, `θ = ${rad(360 - p.deg)}`]);
}

function polarCurvePick(rng: Rng): AskStep {
  const a = pick(rng, [4, 6]); const R = a / 2; const Rg: Range = [-7, 7, -7, 7];
  const circ = (h: number, k: number, r: number): Visual => plotV(Rg, { segments: ellipseSegs(r, r, h, k) });
  const opts = [{ s: `r = ${a} cos θ`, v: circ(R, 0, R) }, { s: `r = ${a} sin θ`, v: circ(0, R, R) }, { s: `r = ${a}`, v: circ(0, 0, a) }, { s: `r = −${a} cos θ`, v: circ(-R, 0, R) }];
  const i = rint(rng, 0, 3); const o = opts[i];
  const rect = i === 0 ? `(x − ${fmt(R)})² + y² = ${R * R}` : i === 1 ? `x² + (y − ${fmt(R)})² = ${R * R}` : i === 2 ? `x² + y² = ${a * a}` : `(x + ${fmt(R)})² + y² = ${R * R}`;
  const q = mkq(S(K6), 'polar-graphs', {
    prompt: `Newton's radar sweeps the curve ${o.s}. Which graph is it?`, expression: o.s, answer: 0,
    hint: 'Try easy angles: where is the point at θ = 0 and at θ = π/2? Or multiply by r and use x = r cos θ, y = r sin θ.',
    steps: [i === 2 ? 'Every point is the same distance from the origin.' : `Multiply by r: r² = ${i === 1 ? `${a}r sin θ` : `${i === 3 ? '−' : ''}${a}r cos θ`}, so x² + y² = ${i === 1 ? `${a}y` : `${i === 3 ? '−' : ''}${a}x`}.`, `${rect}: a circle.`],
    visual: card('Polar → rectangular', ['x = r cos θ, y = r sin θ', 'r² = x² + y²']), app: APP6,
  });
  return pickGraph(rng, q, [o.v, ...opts.filter((_, j) => j !== i).map((x) => x.v)], 0);
}

const CZ = [
  { z: '1 + i√3', r: '2', d: 60, wr: '4' }, { z: '√3 + i', r: '2', d: 30, wr: '4' }, { z: '−1 + i', r: '√2', d: 135, wr: '2' },
  { z: '1 − i', r: '√2', d: 315, wr: '2' }, { z: '−2 − 2i', r: '2√2', d: 225, wr: '4' }, { z: '−√3 + i', r: '2', d: 150, wr: '4' },
  { z: '3i', r: '3', d: 90, wr: '9' }, { z: '−4', r: '4', d: 180, wr: '16' }, { z: '2 − 2i√3', r: '4', d: 300, wr: '16' },
];
const cisForm = (r: string, d: number) => `${r}(cos ${rad(d)} + i sin ${rad(d)})`;
function complexPolarStep(rng: Rng): AskStep {
  const o = pick(rng, CZ);
  const wrongAngle = o.d < 90 ? 90 - o.d : o.d === 90 || o.d === 180 ? 0 : o.d < 270 ? o.d - 180 : 360 - o.d;
  const q = mkq(S(K6), 'complex-polar', {
    prompt: `Volt writes the phasor z = ${o.z} in polar form r(cos θ + i sin θ).`, expression: `z = ${o.z}`, answer: 0,
    hint: 'r = √(a² + b²). For θ, plot the point a + bi and check its quadrant.',
    steps: [`r = ${o.r}.`, `The point sits at angle ${rad(o.d)} from the positive real axis.`, `z = ${cisForm(o.r, o.d)}.`], visual: card('Polar form', ['a + bi = r(cos θ + i sin θ)', 'r = √(a² + b²)']), app: APP6,
  });
  const wa = wrongAngle < 0 ? wrongAngle + 360 : wrongAngle;
  const ref = o.d % 90 === 0 ? (o.d + 90) % 360 : o.d % 180 < 90 ? o.d % 180 : 180 - (o.d % 180);
  return choose(rng, q, cisForm(o.r, o.d), [cisForm(o.r, wa === o.d ? (o.d + 90) % 360 : wa), cisForm(o.wr, o.d), cisForm(o.r, (o.d + 180) % 360), cisForm(o.r, ref)]);
}

function complexMultiplyStep(rng: Rng): AskStep {
  const r1 = pick(rng, [2, 3, 4]); const r2 = pick(rng, [3, 5]); const al = 10 * rint(rng, 1, 8); let be = 10 * rint(rng, 1, 8); if (be === al) be = al === 80 ? 20 : al + 10;
  const f = (r: number, d: number) => `${r} cis ${d}°`;
  const q = mkq(S(K6), 'complex-polar', {
    prompt: `Two AC phasors: z = ${f(r1, al)} and w = ${f(r2, be)} (cis θ means cos θ + i sin θ). Find zw.`, expression: 'zw = ?', answer: 0,
    hint: 'In polar form, multiplying stretches and turns: multiply the sizes, ADD the angles.',
    steps: [`Sizes multiply: ${lab(r1, 'size of z')} × ${lab(r2, 'size of w')} = ${lab(r1 * r2, 'size of zw')}.`, `Angles add: ${lab(`${al}°`, 'angle of z')} + ${lab(`${be}°`, 'angle of w')} = ${lab(`${al + be}°`, 'angle of zw')}.`, `zw = ${f(r1 * r2, al + be)}.`], visual: card('Multiplying in polar form', ['r₁ cis α · r₂ cis β', '= r₁r₂ cis(α + β)']), app: APP6,
  });
  return choose(rng, q, f(r1 * r2, al + be), [f(r1 + r2, al + be), f(r1 * r2, al * be), f(r1 * r2, Math.abs(al - be))]);
}

function complexRotatePlot(rng: Rng): AskStep {
  const a = rnz(rng, -5, 5); const b = rnz(rng, -5, 5); const op = rng.next() < 0.7 ? 'i' : 'conj';
  const ans: [number, number] = op === 'i' ? [-b, a] : [a, -b];
  const q = mkq(S(K6), 'complex-plane', {
    prompt: `Volt's phasor is z = ${cx(a, b)}. ${op === 'i' ? 'Multiplying by i turns it.' : 'The conjugate flips the sign of the imaginary part.'}`,
    expression: op === 'i' ? `i·z = ?` : 'z̄ = ?', answer: 0, answerText: cx(ans[0], ans[1]),
    hint: op === 'i' ? 'Expand i·(a + bi) and remember i² = −1.' : 'The conjugate of a + bi is a − bi: a mirror in the real axis.',
    steps: op === 'i' ? [`i·(${cx(a, b)}) = ${cx(0, a)} ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : fmt(Math.abs(b))}i² = ${cx(ans[0], ans[1])}.`, 'Multiplying by i rotates a quarter turn anticlockwise.'] : [`z̄ = ${cx(ans[0], ans[1])}.`, 'Mirror in the real (horizontal) axis.'], app: APP6,
  });
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 1, arrows: true, label: 'Complex plane: real →, imaginary ↑', layers: { vectors: [{ x: a, y: b, label: 'z' }] } }, [`${ans[0]},${ans[1]}`], `Tap the tip of ${op === 'i' ? 'i·z' : 'z̄'}.`);
}

function robotArmStep(rng: Rng): AskStep {
  const L = 2 * rint(rng, 2, 9); const deg = pick(rng, [30, 60]); const horiz = deg === 60;
  const q = mkq(S(K6), 'polar-to-rect', {
    prompt: `Ada's robot arm is ${L} cm long and raised ${deg}° above the bench. How far ${horiz ? 'out along the bench' : 'above the bench'} is its tip?`,
    expression: `${horiz ? 'x' : 'y'} = ${L}·${horiz ? 'cos' : 'sin'} ${deg}°`, answer: L / 2, unit: 'cm',
    hint: `${horiz ? 'Along the bench is x = r cos θ.' : 'Height is y = r sin θ.'}`,
    steps: [`${horiz ? 'cos 60°' : 'sin 30°'} = 1/2.`, `${lab(L, 'arm length in cm')} × 1/2 = ${lab(L / 2, horiz ? 'cm along the bench' : 'cm above the bench')}.`], visual: { type: 'geo', items: [{ t: 'seg', a: [0, 0], b: [10, 0] }, { t: 'seg', a: [0, 0], b: [Math.cos((deg * Math.PI) / 180) * 8, Math.sin((deg * Math.PI) / 180) * 8], label: `${L} cm` }, { t: 'arc', at: [0, 0], from: [10, 0], to: [Math.cos((deg * Math.PI) / 180) * 8, Math.sin((deg * Math.PI) / 180) * 8], label: `${deg}°` }] }, app: APP6,
  });
  return typed(q);
}

function impedanceStep(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]] as [number, number, number][]);
  const q = mkq(S(K6), 'complex-polar', {
    prompt: `Volt's circuit has impedance Z = ${a} + ${b}i ohms. The current depends on |Z|. Find it.`, expression: `|${a} + ${b}i| = ?`, answer: c, unit: 'Ω',
    hint: '|a + bi| is the distance from 0 to the point (a, b).',
    steps: [`Resistance ${lab(a, 'ohms')}, reactance ${lab(b, 'ohms')}: |Z| = √(${a}² + ${b}²) = √${c * c}.`, `= ${lab(c, 'ohms')}.`], visual: card('Modulus', ['|a + bi| = √(a² + b²)']), app: APP6,
  });
  return typed(q);
}

/* ================================================================== */
/* 7. Vectors in 2D                                                    */
/* ================================================================== */
const K7 = 'vectors';
const APP7 = 'Forces, velocities and cable tensions are vectors: engineers add them by components.';
const vec = (x: number | string, y: number | string) => `⟨${typeof x === 'number' ? fmt(x) : x}, ${typeof y === 'number' ? fmt(y) : y}⟩`;
const combo = (p: number, q: number) => `${p === 1 ? '' : p === -1 ? '−' : fmt(p)}u${q === 0 ? '' : ` ${q < 0 ? '−' : '+'} ${Math.abs(q) === 1 ? '' : fmt(Math.abs(q))}v`}`;

function vecAddPlot(rng: Rng): AskStep {
  const u = [rnz(rng, -4, 4), rint(rng, -4, 4)]; let v = [rint(rng, -4, 4), rnz(rng, -4, 4)]; let g = 0;
  // v identical to u would draw the orange arrow exactly over the teal one
  while (v[0] === u[0] && v[1] === u[1] && g++ < 20) v = [rint(rng, -4, 4), rnz(rng, -4, 4)];
  if (v[0] === u[0] && v[1] === u[1]) v = [-u[0] || 1, u[1] ? -u[1] : 2];
  const s = [u[0] + v[0], u[1] + v[1]];
  const q = mkq(S(K7), 'add', {
    prompt: `Newton's two thrusters push with u = ${vec(u[0], u[1])} and v = ${vec(v[0], v[1])}.`, expression: 'u + v = ?', answer: 0, answerText: vec(s[0], s[1]),
    hint: 'Add x with x and y with y. Or slide v so its tail sits on the tip of u.',
    steps: [`Across: ${fmt(u[0])} + ${par(v[0])} = ${lab(fmt(s[0]), 'across')}. Up: ${fmt(u[1])} + ${par(v[1])} = ${lab(fmt(s[1]), 'up')}. So u + v = ${vec(s[0], s[1])}.`, 'Tip-to-tail: the sum runs from the start of u to the end of v.'], app: APP7,
  });
  return model(q, { kind: 'plot', range: [-9, 9, -9, 9], count: 1, arrows: true, label: 'u (teal), v (orange)', layers: { vectors: [{ x: u[0], y: u[1], label: 'u', color: 'teal' }, { x: v[0], y: v[1], label: 'v', color: 'orange' }] } }, [`${s[0]},${s[1]}`], 'Tap the tip of u + v (it starts at the origin).');
}

function vecScalarPlot(rng: Rng): AskStep {
  const [p, qq] = pick(rng, [[2, 0], [-1, 0], [2, -1], [1, -1], [-2, 1], [3, 0]] as [number, number][]);
  let u = [0, 0]; let v = [0, 0]; let r = [0, 0]; let g = 0;
  do { u = [rint(rng, -3, 3), rint(rng, -3, 3)]; v = [rint(rng, -3, 3), rint(rng, -3, 3)]; r = [p * u[0] + qq * v[0], p * u[1] + qq * v[1]]; } while ((Math.abs(r[0]) > 8 || Math.abs(r[1]) > 8 || (u[0] === 0 && u[1] === 0) || (qq !== 0 && v[0] === 0 && v[1] === 0) || (r[0] === 0 && r[1] === 0)) && g++ < 60);
  const name = combo(p, qq);
  const q = mkq(S(K7), 'scalar', {
    prompt: `Brick's crane cables: u = ${vec(u[0], u[1])}${qq ? `, v = ${vec(v[0], v[1])}` : ''}. Find ${name}.`, expression: `${name} = ?`, answer: 0, answerText: vec(r[0], r[1]),
    hint: 'A scalar multiplies BOTH components. A minus sign reverses a vector.',
    steps: [`${name} = ⟨${fmt(p)}·${par(u[0])}${qq ? ` ${fmtSigned(qq)}·${par(v[0])}` : ''}, ${fmt(p)}·${par(u[1])}${qq ? ` ${fmtSigned(qq)}·${par(v[1])}` : ''}⟩.`, `= ${vec(r[0], r[1])}.`], app: APP7,
  });
  const layers: PlotLayers = { vectors: [{ x: u[0], y: u[1], label: 'u', color: 'teal' }, ...(qq ? [{ x: v[0], y: v[1], label: 'v', color: 'orange' as const }] : [])] };
  return model(q, { kind: 'plot', range: [-8, 8, -8, 8], count: 1, arrows: true, label: qq ? 'u (teal), v (orange)' : 'u (teal)', layers }, [`${r[0]},${r[1]}`], `Tap the tip of ${name}.`);
}

function vecFromPointsChoose(rng: Rng): AskStep {
  const P = [rint(rng, -5, 5), rint(rng, -5, 5)]; let Q = [rint(rng, -5, 5), rint(rng, -5, 5)];
  const bad = () => Q[0] === P[0] || Q[1] === P[1] || Q[0] - P[0] === Q[1] - P[1];
  let g = 0; while (bad() && g++ < 40) Q = [rint(rng, -5, 5), rint(rng, -5, 5)];
  if (bad()) Q = [P[0] + (P[0] > 0 ? -3 : 3), P[1] + (P[1] > 0 ? -2 : 2)]; // toward the origin: stays on the ±6 plot
  const d = [Q[0] - P[0], Q[1] - P[1]];
  const q = mkq(S(K7), 'components', {
    prompt: `Brick's crane moves a load from P(${fmt(P[0])}, ${fmt(P[1])}) to Q(${fmt(Q[0])}, ${fmt(Q[1])}). What is the displacement vector PQ?`, expression: 'PQ = ?', answer: 0,
    hint: 'End minus start: Q − P, component by component.',
    steps: [`PQ = ⟨${fmt(Q[0])} − ${par(P[0])}, ${fmt(Q[1])} − ${par(P[1])}⟩.`, `= ${vec(d[0], d[1])}.`], visual: plotV([-6, 6, -6, 6], { points: [{ x: P[0], y: P[1], label: 'P' }, { x: Q[0], y: Q[1], label: 'Q' }], vectors: [{ x: d[0], y: d[1], from: [P[0], P[1]] }] }), app: APP7,
  });
  return choose(rng, q, vec(d[0], d[1]), [vec(-d[0], -d[1]), vec(P[0] + Q[0], P[1] + Q[1]), vec(d[1], d[0]), vec(d[0], -d[1])]);
}

const TRIPLE_SET: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [4, 3, 5], [12, 5, 13]];
function vecMagStep(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, TRIPLE_SET); const x = a * pick(rng, [1, -1]); const y = b * pick(rng, [1, -1]);
  const q = mkq(S(K7), 'magnitude', {
    prompt: `A cable tension is F = ${vec(x, y)} kN. How strong is the pull, |F|?`, expression: `|${vec(x, y)}| = ?`, answer: c, unit: 'kN',
    hint: 'The components are the legs of a right triangle; the magnitude is its hypotenuse.',
    steps: [`Components ${lab(fmt(x), 'kN across')} and ${lab(fmt(y), 'kN up')}: |F| = √(${par(x)}² + ${par(y)}²) = √${c * c}.`, `= ${lab(c, 'kN pull')}, not ${a + b}: you cannot add the legs.`],
    visual: plotV([-c, c, -c, c], { vectors: [{ x, y, label: 'F' }], segments: [{ a: [0, 0], b: [x, 0], dashed: true, color: 'muted' }, { a: [x, 0], b: [x, y], dashed: true, color: 'muted' }] }), app: APP7,
  });
  return typed(q);
}

function vecMagSumChoose(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, TRIPLE_SET);
  const q = mkq(S(K7), 'magnitude', {
    prompt: `Two tugboats pull a barge: one with ${vec(a, 0)} kN (east), one with ${vec(0, b)} kN (north). How big is the total pull?`, expression: '|u + v| = ?', answer: 0,
    hint: 'Add the vectors first, THEN find the length. |u + v| is usually not |u| + |v|.',
    steps: [`u + v = ⟨${lab(a, 'kN east')}, ${lab(b, 'kN north')}⟩.`, `|u + v| = √(${a}² + ${b}²) = ${lab(c, 'kN total pull')}.`], visual: plotV([-1, a + 1, -1, b + 1], { vectors: [{ x: a, y: 0, label: 'u', color: 'teal' }, { x: 0, y: b, from: [a, 0], label: 'v' }] }), app: APP7,
  });
  return choose(rng, q, `${c} kN`, [`${a + b} kN`, `${c * c} kN`, `${Math.abs(a - b)} kN`]);
}

function dirAngleStep(rng: Rng): AskStep {
  const p = specialPoint(rng, SPECIAL.slice(1));
  const q = mkq(S(K7), 'direction', {
    prompt: `A cable pulls with F = ${vec(p.X, p.Y)}. Set its direction angle, measured anticlockwise from east.`, expression: `direction of ${vec(p.X, p.Y)}`, answer: p.deg, answerText: String(p.deg),
    hint: p.deg % 90 === 0 ? 'One component is 0, so F points straight along an axis. Which way?' : 'Sketch it: which quadrant do the signs put it in? Then use tan(ref) = |y|/|x| for the reference angle.',
    steps: p.deg % 90 === 0 ? [`One component is 0: F points along ${AXIS_DIR[p.deg]}.`, `That is ${p.deg}° anticlockwise from east.`] : [`tan(ref) = |y|/|x| gives a reference angle of ${p.ref}°.`, `Signs put it at ${lab(`${p.deg}°`, 'direction from east')}.`], app: APP7,
  });
  return model(q, { kind: 'angle', max: 360, step: 15, label: 'Direction from east (anticlockwise)' }, [String(p.deg)], 'Turn the dial to the direction of F.');
}

function componentsChoose(rng: Rng): AskStep {
  const k = rint(rng, 2, 8); const F = 2 * k; const deg = pick(rng, [30, 60]); const wantX = rng.next() < 0.5;
  const val = (useCos: boolean) => ((useCos ? deg === 60 : deg === 30) ? String(k) : surd(k, 3));
  const right = val(wantX); const swapped = val(!wantX);
  const q = mkq(S(K7), 'components', {
    prompt: `Newton launches a probe at ${F} m/s, ${deg}° above horizontal. Find its ${wantX ? 'horizontal' : 'vertical'} velocity.`, expression: `${wantX ? 'vₓ' : 'vᵧ'} = ?`, answer: 0,
    hint: 'Horizontal uses cos θ, vertical uses sin θ (θ measured from the horizontal).',
    steps: [`${wantX ? 'vₓ' : 'vᵧ'} = ${lab(F, 'launch speed in m/s')}·${wantX ? 'cos' : 'sin'} ${deg}° = ${F}·${wantX ? (deg === 60 ? '1/2' : '√3/2') : deg === 30 ? '1/2' : '√3/2'}.`, `= ${right} m/s, the ${wantX ? 'horizontal' : 'vertical'} velocity.`],
    visual: { type: 'geo', items: [{ t: 'seg', a: [0, 0], b: [10, 0], dashed: true }, { t: 'seg', a: [0, 0], b: [Math.cos((deg * Math.PI) / 180) * 9, Math.sin((deg * Math.PI) / 180) * 9], label: `${F} m/s`, arrow: true }, { t: 'arc', at: [0, 0], from: [10, 0], to: [Math.cos((deg * Math.PI) / 180) * 9, Math.sin((deg * Math.PI) / 180) * 9], label: `${deg}°` }] }, app: APP7,
  });
  return choose(rng, q, `${right} m/s`, [`${swapped} m/s`, `${F} m/s`, `${surd(k, 2)} m/s`]);
}

function vecTableStep(rng: Rng): AskStep {
  const u = [rnz(rng, -4, 4), rint(rng, -4, 4)]; let v = [rint(rng, -4, 4), rnz(rng, -4, 4)];
  if (v[0] === u[0] && v[1] === u[1]) v = [-u[0], v[1]];
  const s = [u[0] + v[0], u[1] + v[1]]; const w = [2 * u[0] - v[0], 2 * u[1] - v[1]];
  const q = mkq(S(K7), 'components', {
    prompt: `Ada logs two forces: u = ${vec(u[0], u[1])}, v = ${vec(v[0], v[1])}. Fill in u + v and 2u − v.`, expression: 'Component table', answer: s[0],
    hint: 'Work column by column: every x uses only x-components, every y only y-components.',
    steps: [`u + v = ${vec(s[0], s[1])}.`, `2u − v = ⟨${fmt(2 * u[0])} − ${par(v[0])}, ${fmt(2 * u[1])} − ${par(v[1])}⟩ = ${vec(w[0], w[1])}.`], app: APP7,
  });
  return model(q, { kind: 'table', cols: ['x', 'y'], rowLabels: ['u', 'v', 'u + v', '2u − v'], rows: [[u[0], u[1]], [v[0], v[1]], [null, null], [null, null]], label: 'Components' }, [[...s, ...w].map(String).join(',')], 'Fill in the components of u + v and 2u − v.');
}

function windStep(rng: Rng): AskStep {
  // the wind is NOT at right angles to the heading: it pushes east and partly against the drone (south)
  const [a, b, c] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15]] as [number, number, number][]);
  const s = pick(rng, [1, 2, 3]); const air = (b + s) * 10; const E = a * 10; const So = s * 10;
  const q = mkq(S(K7), 'magnitude', {
    prompt: `A drone flies north at ${air} km/h. A gust pushes it ${E} km/h east and ${So} km/h south. What is its speed over the ground?`, expression: 'ground speed = ?', answer: c * 10, unit: 'km/h',
    hint: 'Write each velocity as ⟨east, north⟩, add them component by component, then take the magnitude.',
    steps: [`East: ${lab(E, 'km/h from the gust')}. North: ${lab(air, 'km/h flying')} − ${lab(So, 'km/h pushed south')} = ${lab(air - So, 'km/h north')}. Ground ${vec(E, air - So)}.`, `√(${E}² + ${air - So}²) = ${lab(c * 10, 'km/h ground speed')}.`], visual: plotV([0, E + 10, 0, air + 10], { vectors: [{ x: 0, y: air, label: 'air' }, { x: E, y: -So, from: [0, air], label: 'wind', color: 'teal' }, { x: E, y: air - So, label: 'ground', color: 'ask' }] }), app: APP7,
  });
  return typed(q);
}

function riverStep(rng: Rng): AskStep {
  const v = pick(rng, [2, 3, 4, 5]); const cur = pick(rng, [1, 1.5, 2, 3]); const t = pick(rng, [20, 30, 40, 50, 60]); const W = v * t;
  const q = mkq(S(K7), 'components', {
    prompt: `A ferry steers straight across a ${W} m river at ${v} m/s. The current pushes it downstream at ${cur} m/s. How far downstream does it land?`, expression: 'drift = ?', answer: cur * t, unit: 'm',
    hint: 'The two components act independently: the crossing time comes from the across-component only.',
    steps: [`Time to cross: ${lab(W, 'm wide')} ÷ ${lab(v, 'm/s across')} = ${lab(t, 'seconds')}.`, `Drift: ${lab(cur, 'm/s current')} × ${lab(t, 'seconds')} = ${lab(cur * t, 'm downstream')}.`], visual: card('Velocity', [`⟨${cur}, ${v}⟩ m/s`, 'across: v, downstream: current']), app: APP7,
  });
  return typed(q);
}

/* ================================================================== */
/* 8. Parametric equations                                             */
/* ================================================================== */
const K8 = 'parametric';
const APP8 = 'Robot paths, CNC tool paths and trajectories are parametric: x and y are both functions of time.';
type Param = { xs: string; ys: string; x: (t: number) => number; y: (t: number) => number };
function randParam(rng: Rng): Param {
  const p = pick(rng, [1, 2, -1, 3]); const a = rint(rng, -3, 3);
  if (rng.next() < 0.5) { const b = rint(rng, -4, 2); return { xs: lin(p, a, 't'), ys: polyStr([b, 0, 1], 't'), x: (t) => p * t + a, y: (t) => t * t + b }; }
  const m = pick(rng, [2, -1, -2, 3]); const c = rint(rng, -3, 3);
  return { xs: lin(p, a, 't'), ys: lin(m, c, 't'), x: (t) => p * t + a, y: (t) => m * t + c };
}

function paramTableStep(rng: Rng): AskStep {
  const P = randParam(rng);
  const acc = [P.x(1), P.y(1), P.x(2), P.y(2)].map(String).join(',');
  const q = mkq(S(K8), 'evaluate', {
    prompt: `Newton's drone flies x = ${P.xs}, y = ${P.ys}, with t in seconds. Where is it at t = 1 and t = 2?`, expression: `x = ${P.xs}, y = ${P.ys}`, answer: P.x(1),
    hint: 'Put the same t into BOTH equations. t is the clock, not a coordinate.',
    steps: [`t = ${lab(1, 'second')}: (${fmt(P.x(1))}, ${fmt(P.y(1))}).`, `t = ${lab(2, 'seconds')}: (${fmt(P.x(2))}, ${fmt(P.y(2))}).`], app: APP8,
  });
  return model(q, { kind: 'table', cols: ['t', 'x', 'y'], rows: [[0, P.x(0), P.y(0)], [1, null, null], [2, null, null]], label: `x = ${P.xs}, y = ${P.ys}` }, [acc], 'Fill in x and y for t = 1 (second) and t = 2 (seconds).');
}

function paramPlotStep(rng: Rng): AskStep {
  let P = randParam(rng); let T = pick(rng, [-2, -1, 1, 2, 3]); let g = 0;
  while ((Math.abs(P.x(T)) > 7 || Math.abs(P.y(T)) > 7 || (P.x(T) === T)) && g++ < 60) { P = randParam(rng); T = pick(rng, [-2, -1, 1, 2, 3]); }
  if (Math.abs(P.x(T)) > 7 || Math.abs(P.y(T)) > 7) { P = { xs: '2t − 1', ys: '3 − t', x: (t) => 2 * t - 1, y: (t) => 3 - t }; T = 2; }
  const X = P.x(T); const Y = P.y(T);
  const q = mkq(S(K8), 'evaluate', {
    prompt: `A rover follows x = ${P.xs}, y = ${P.ys}. Where is it at t = ${fmt(T)}?`, expression: `t = ${fmt(T)}`, answer: 0, answerText: `(${fmt(X)}, ${fmt(Y)})`,
    hint: 'Work out x from its equation and y from its equation, with the same t. Do not plot (t, y).',
    steps: [`x = ${fmt(X)}, y = ${fmt(Y)}.`, `The rover is at (${fmt(X)}, ${fmt(Y)}).`], app: APP8,
  });
  return model(q, { kind: 'plot', range: [-7, 7, -7, 7], count: 1, label: 'Rover map' }, [`${X},${Y}`], `Tap the rover's position at t = ${fmt(T)}.`);
}

function eliminateChoose(rng: Rng): AskStep {
  const a = rnz(rng, -4, 4);
  if (rng.next() < 0.6) {
    const m = pick(rng, [2, 3, -2, -3]); const c = rint(rng, -5, 5);
    const q = mkq(S(K8), 'eliminate', {
      prompt: `A crane hook moves along x = ${lin(1, a, 't')}, y = ${lin(m, c, 't')}. Write its path as y in terms of x.`, expression: 'y = ?', answer: 0,
      hint: 'Solve the x-equation for t, then substitute that whole expression into y.',
      steps: [`t = ${xm(a)}.`, `y = ${fmt(m)}(${xm(a)})${c ? ` ${fmtSigned(c)}` : ''} = ${polyStr([c - m * a, m])}.`], visual: card('Eliminate t', [`x = ${lin(1, a, 't')}`, `y = ${lin(m, c, 't')}`]), app: APP8,
    });
    return choose(rng, q, `y = ${polyStr([c - m * a, m])}`, [`y = ${polyStr([c - a, m])}`, `y = ${polyStr([c + m * a, m])}`, `y = ${polyStr([c, m])}`]);
  }
  const c = rint(rng, -4, 4); const tail = c ? ` ${fmtSigned(c)}` : '';
  const q = mkq(S(K8), 'eliminate', {
    prompt: `A cam follower moves along x = ${lin(1, a, 't')}, y = ${polyStr([c, 0, 1], 't')}. Write its path as y in terms of x.`, expression: 'y = ?', answer: 0,
    hint: 'Solve for t first, then square the whole expression.',
    steps: [`t = ${xm(a)}.`, `y = (${xm(a)})²${tail}: a parabola with vertex (${fmt(a)}, ${fmt(c)}).`], visual: card('Eliminate t', [`x = ${lin(1, a, 't')}`, `y = ${polyStr([c, 0, 1], 't')}`]), app: APP8,
  });
  return choose(rng, q, `y = (${xm(a)})²${tail}`, [`y = (${xm(-a)})²${tail}`, `y = ${polyStr([c - a, 0, 1])}`, `y = ${polyStr([c + a * a, 0, 1])}`, `y = ${polyStr([c, 0, 1])}`]);
}

function eliminateLinePlot(rng: Rng): AskStep {
  const m = pick(rng, [1, 2, -1, -2]); const a = rint(rng, -3, 3); let c = rint(rng, -4, 4);
  let b = c - m * a; if (Math.abs(b) > 4) { c = m * a; b = 0; }
  const q = mkq(S(K8), 'eliminate', {
    prompt: `A cutting laser moves along x = ${lin(1, a, 't')}, y = ${lin(m, c, 't')}. Its path is a straight line.`, expression: 'Tap two points on the path', answer: 0, answerText: `any two points on y = ${polyStr([b, m])}`,
    hint: 'Pick two values of t (say 0 and 1), work out each (x, y), and tap those points.',
    steps: [`t = 0: (${fmt(a)}, ${fmt(c)}); t = 1: (${fmt(a + 1)}, ${fmt(m + c)}).`, `Eliminating t: y = ${polyStr([b, m])}.`], app: APP8,
  });
  return model(q, { kind: 'plot', range: [-7, 7, -7, 7], count: 2, label: 'Laser table' }, undefined, 'Tap two points on the laser’s path.', { rule: { kind: 'on-line', m, b } });
}

function projectileTyped(rng: Rng): AskStep {
  const u = pick(rng, [10, 20, 30, 40]); const v = rint(rng, 3, 12); const which = pick(rng, ['land', 'height', 'range', 'peak'] as const);
  const land = u / 5; const peak = u / 10; const H = (u * u) / 20; const R = v * land;
  const ans = which === 'land' ? land : which === 'height' ? H : which === 'range' ? R : peak;
  const ask2 = which === 'land' ? 'When does it land?' : which === 'height' ? 'How high does it go?' : which === 'range' ? 'How far away does it land?' : 'When is it highest?';
  const q = mkq(S(K8), 'projectile', {
    prompt: `Newton's water rocket flies x = ${v}t, y = ${u}t − 5t² (metres, seconds). ${ask2}`, expression: `x = ${v}t, y = ${u}t − 5t²`, answer: ans, unit: which === 'land' || which === 'peak' ? 's' : 'm',
    hint: which === 'land' || which === 'range' ? 'It lands when y = 0 again: factor y = t(… − 5t).' : 'The top of the arc is halfway between launch and landing (by symmetry).',
    steps: [`y = t(${u} − 5t) = 0 at t = 0 and t = ${u} ÷ 5 = ${lab(land, 'seconds')}.`, which === 'land' ? `Lands at t = ${lab(land, 'seconds')}.` : which === 'range' ? `x = ${lab(v, 'm/s across')} × ${lab(land, 'seconds')} = ${lab(R, 'm away')}.` : which === 'peak' ? `Highest halfway: t = ${land} ÷ 2 = ${lab(peak, 'seconds')}.` : `Highest at t = ${lab(peak, 'seconds')}: y = ${u}·${peak} − 5·${peak}² = ${lab(H, 'm high')}.`],
    visual: plotV([0, R + 2, 0, H + 5], { fns: [{ fn: poly(0, u / v, -5 / (v * v)), from: 0, to: R }] }), app: APP8,
  });
  return typed(q);
}

function projectileSlider(rng: Rng): AskStep {
  const u = pick(rng, [10, 20, 30]); const v = rint(rng, 2, 8); const R = (v * u) / 5; const H = (u * u) / 20; const top = rng.next() < 0.5;
  const ans = top ? R / 2 : R; const max = Math.ceil(R + 4);
  const q = mkq(S(K8), 'projectile', {
    prompt: `A water rocket flies x = ${v}t, y = ${u}t − 5t². ${top ? 'Slide to the x-position of the top of the arc.' : 'Slide to where it lands.'}`, expression: top ? 'x at the top' : 'x at landing', answer: ans, unit: 'm',
    hint: 'Find the time first from y, then put that time into x.',
    steps: [`Lands when ${u}t − 5t² = 0: t = ${lab(u / 5, 'seconds')}, so x = ${lab(v, 'm/s across')} × ${lab(u / 5, 'seconds')} = ${lab(R, 'metres')}.`, top ? `Top of the arc: halfway, t = ${lab(u / 10, 'seconds')}, x = ${lab(fmt(R / 2), 'metres')}.` : `It lands ${R} m away.`], app: APP8,
  });
  return model(q, { kind: 'slider', min: 0, max, step: top && !Number.isInteger(R / 2) ? 0.5 : 1, unit: 'm', label: 'x (m)', range: [0, max, 0, H + 5], layers: { fns: [{ fn: poly(0, u / v, -5 / (v * v)), from: 0, to: R }] } }, [String(ans)], top ? 'Slide to the x of the highest point.' : 'Slide to the landing point.');
}

function paramEllipsePick(rng: Rng): AskStep {
  const [a, b] = rng.shuffle([2, 3, 4, 5]).slice(0, 2); const R: Range = [-6, 6, -6, 6];
  const e = (p: number, q2: number): Visual => plotV(R, { segments: ellipseSegs(p, q2) });
  const q = mkq(S(K8), 'curves', {
    prompt: `A robot arm's tip traces x = ${a} cos t, y = ${b} sin t. Which path is it?`, expression: `x = ${a} cos t, y = ${b} sin t`, answer: 0,
    hint: 'cos t and sin t run between −1 and 1. How far does x reach? How far does y reach?',
    steps: [`x runs from −${a} to ${a}; y runs from −${b} to ${b}.`, `(x/${a})² + (y/${b})² = cos²t + sin²t = 1: a stretched circle (an oval) ${2 * a} wide and ${2 * b} tall. You will meet its equation as an ellipse in Conic Sections.`], visual: card('Stretched circle', ['x = a cos t, y = b sin t']), app: APP8,
  });
  return pickGraph(rng, q, [e(a, b), e(b, a), e(a, a), e(b, b)], 0);
}

function ferrisParamStep(rng: Rng): AskStep {
  const R = 2 * rint(rng, 3, 9);
  const o = pick(rng, [{ t: 5, fn: 'x', v: R / 2, ang: 'π/3' }, { t: 10, fn: 'x', v: -R / 2, ang: '2π/3' }, { t: 15, fn: 'x', v: -R, ang: 'π' }, { t: 7.5, fn: 'y', v: R, ang: 'π/2' }, { t: 25, fn: 'x', v: R / 2, ang: '5π/3' }]);
  const q = mkq(S(K8), 'evaluate', {
    prompt: `A Ferris wheel car moves on x = ${R} cos(πt/15), y = ${R} sin(πt/15) metres from the hub. Find ${o.fn} at t = ${fmt(o.t)} s.`, expression: `${o.fn}(${fmt(o.t)}) = ?`, answer: o.v, unit: 'm',
    hint: 'Work out the angle πt/15 first, then use the unit circle.',
    steps: [`πt/15 at t = ${lab(fmt(o.t), 'seconds')} is ${o.ang}.`, `${o.fn} = ${lab(R, 'wheel radius in m')}·${o.fn === 'x' ? 'cos' : 'sin'}(${o.ang}) = ${lab(fmt(o.v), o.fn === 'x' ? 'm across from the hub' : 'm above the hub')}.`], visual: card('Circular motion', ['x = R cos(ωt)', 'y = R sin(ωt)']), app: APP8,
  });
  return typed(q);
}

function droneTimeStep(rng: Rng): AskStep {
  const p = pick(rng, [2, 3, 4]); const a = rint(rng, -2, 5); const m = pick(rng, [2, 3, 5]); const c = rint(rng, 0, 6); const T = rint(rng, 2, 6); const X = p * T + a;
  const q = mkq(S(K8), 'eliminate', {
    prompt: `A survey drone flies x = ${lin(p, a, 't')}, y = ${lin(m, c, 't')}, in metres with t in seconds. How high is it when it passes over x = ${X}?`, expression: `y when x = ${X}`, answer: m * T + c, unit: 'm',
    hint: 'Use the x-equation to find WHEN it is at that x, then use that time in y.',
    steps: [`${lin(p, a, 't')} = ${lab(X, 'm across')} → t = ${lab(T, 'seconds')}.`, `y = ${m}·${T}${c ? ` ${fmtSigned(c)}` : ''} = ${lab(m * T + c, 'm high')}.`], visual: card('Same clock', [`x = ${lin(p, a, 't')}`, `y = ${lin(m, c, 't')}`]), app: APP8,
  });
  return typed(q);
}

/* ================================================================== */
/* 9. Sequences, series & the binomial theorem                         */
/* ================================================================== */
const K9 = 'sequences';
const APP9 = 'Loan payments, sensor sampling and signal filters are sequences and sums; the binomial theorem powers error estimates.';
const C = (n: number, k: number): number => (k < 0 || k > n ? 0 : k === 0 || k === n ? 1 : C(n - 1, k - 1) + C(n - 1, k));

function seqTableStep(rng: Rng): AskStep {
  const geo = rng.next() < 0.45;
  const a1 = geo ? pick(rng, [1, 2, 3, 5]) : rint(rng, -5, 12); const d = geo ? pick(rng, [2, 3, -2]) : pick(rng, [2, 3, 4, 5, -2, -3, -4, 6]);
  const term = (n: number) => (geo ? a1 * d ** (n - 1) : a1 + (n - 1) * d);
  const q = mkq(S(K9), 'patterns', {
    prompt: `Brick's sensor log: ${fmt(term(1))}, ${fmt(term(2))}, ${fmt(term(3))}, … Continue the pattern.`, expression: `${fmt(term(1))}, ${fmt(term(2))}, ${fmt(term(3))}, ?, ?`, answer: term(4),
    hint: 'Check both: is there a common difference (add), or a common ratio (multiply)?',
    steps: [geo ? `Each term is ${fmt(d)} times the last (geometric, r = ${fmt(d)}).` : `Each term adds ${fmt(d)} (arithmetic, d = ${fmt(d)}).`, `a₄ = ${fmt(term(4))}, a₅ = ${fmt(term(5))}.`], app: APP9,
  });
  return model(q, { kind: 'table', cols: ['a₄', 'a₅'], rows: [[null, null]], label: `Sensor log: ${fmt(term(1))}, ${fmt(term(2))}, ${fmt(term(3))}, …` }, [`${term(4)},${term(5)}`], 'Fill in the next two terms.');
}

function nthTermChoose(rng: Rng): AskStep {
  if (rng.next() < 0.6) {
    const a1 = rint(rng, 2, 12); const d = rint(rng, 2, 7); const n = rint(rng, 12, 40); const right = a1 + (n - 1) * d;
    const q = mkq(S(K9), 'nth-term', {
      prompt: `A stair stringer has a first rise at ${a1} cm and each step is ${d} cm higher. How high is step ${n}?`, expression: `a₁ = ${a1}, d = ${d}, a${sub(n)} = ?`, answer: 0,
      hint: `From step 1 to step ${n} there are ${n} − 1 gaps, not ${n}.`,
      steps: [`aₙ = a₁ + (n − 1)d.`, `a${sub(n)} = ${lab(a1, 'cm, first rise')} + ${lab(n - 1, 'gaps')} × ${lab(d, 'cm per step')} = ${lab(right, 'cm')}.`], visual: card('Arithmetic sequence', ['aₙ = a₁ + (n − 1)d']), app: APP9,
    });
    return choose(rng, q, String(right), [String(a1 + n * d), String((n - 1) * d), String(a1 + (n - 2) * d)]);
  }
  const a1 = pick(rng, [2, 3, 5]); const r = pick(rng, [2, 3]); const n = rint(rng, 5, 7); const right = a1 * r ** (n - 1);
  const q = mkq(S(K9), 'nth-term', {
    prompt: `A chain reaction starts with ${a1} neutrons and each generation is ${r} times the last. How many in generation ${n}?`, expression: `a₁ = ${a1}, r = ${r}, a${sub(n)} = ?`, answer: 0,
    hint: `Generation ${n} is ${n} − 1 multiplications after generation 1.`,
    steps: [`aₙ = a₁·r${sup('n−1')}.`, `a${sub(n)} = ${lab(a1, 'neutrons at the start')}·${r}${sup(n - 1)} = ${lab(right, 'neutrons')}.`], visual: card('Geometric sequence', ['aₙ = a₁·rⁿ⁻¹']), app: APP9,
  });
  return choose(rng, q, String(right), [String(a1 * r ** n), String(a1 + (n - 1) * r), String(a1 * r * (n - 1))]);
}

function sigmaTyped(rng: Rng): AskStep {
  const m = rint(rng, 1, 3); const n = m + rint(rng, 3, 5); const sq = rng.next() < 0.35;
  const p = pick(rng, [2, 3, 4, -1]); const c = rint(rng, -5, 5);
  const f = (k: number) => (sq ? k * k : p * k + c); const body = sq ? 'k²' : `(${lin(p, c, 'k')})`;
  const terms = Array.from({ length: n - m + 1 }, (_, i) => f(m + i)); const sum = terms.reduce((s, x) => s + x, 0);
  const q = mkq(S(K9), 'sigma', {
    prompt: `The load log adds ${body} for k = ${m} to ${n}.`, expression: `Σ ${body}, k = ${m} to ${n}`, answer: sum,
    hint: `List a term for EVERY k from ${m} to ${n} (that is ${n} − ${m} + 1 terms), then add.`,
    steps: [`${n - m + 1} terms: ${terms.map(fmt).join(' + ').replace(/\+ −/g, '− ')}.`, `Sum = ${fmt(sum)}.`], visual: card('Sigma notation', ['Σ: add the term for each k', `k = ${m}, ${m + 1}, …, ${n}`]), app: APP9,
  });
  return typed(q);
}

function sigmaCountChoose(rng: Rng): AskStep {
  const m = rint(rng, 0, 5); const n = m + rint(rng, 5, 12);
  const q = mkq(S(K9), 'sigma', {
    prompt: `Brick's log sums one reading per hour: Σ aₖ for k = ${m} to ${n}. How many readings is that?`, expression: `k = ${m}, …, ${n}`, answer: 0,
    hint: 'Count fence posts, not gaps: both ends are included.',
    steps: [`${n} − ${m} = ${n - m} gaps between the ends.`, `Terms = ${n} − ${m} + 1 = ${labn(n - m + 1, 'reading')}.`], visual: card('Counting terms', ['from k = m to k = n: n − m + 1 terms']), app: APP9,
  });
  return choose(rng, q, String(n - m + 1), [String(n - m), String(n), String(n - m + 2), String(n - m - 1), String(n + 1)]);
}

const INF: [number, number, number][] = [[8, 1, 2], [12, 1, 4], [6, 1, 3], [20, 1, 2], [9, 1, 3], [27, 1, 3], [10, 1, 2], [36, 1, 4]];
const nice = (n: number, d: number) => (Number.isInteger((n / d) * 100) ? fmt(n / d) : fracStr(n, d));
function geoSeriesTyped(rng: Rng): AskStep {
  const kind = pick(rng, ['finite', 'infinite', 'bounce'] as const);
  if (kind === 'finite') {
    const a = pick(rng, [1, 2, 3, 5]); const r = pick(rng, [2, 3]); const n = rint(rng, 4, 6); const tot = (a * (r ** n - 1)) / (r - 1);
    const q = mkq(S(K9), 'series', {
      prompt: `A server's backup log ${r === 2 ? 'doubles' : 'triples'} each night: ${a} + ${a * r} + ${a * r * r} + … GB for ${n} nights. Find the total.`, expression: `S${sub(n)} = ?`, answer: tot, unit: 'GB',
      hint: 'Geometric sum: Sₙ = a(rⁿ − 1)/(r − 1). Or just list and add the terms.',
      steps: [`a = ${lab(a, 'GB on night one')}, r = ${lab(r, 'growth factor')}, n = ${labn(n, 'night')}.`, `S = ${a}(${r}${sup(n)} − 1)/(${r} − 1) = ${lab(tot, 'GB in total')}.`], visual: card('Geometric series', ['Sₙ = a(rⁿ − 1)/(r − 1)']), app: APP9,
    });
    return typed(q);
  }
  if (kind === 'infinite') {
    const [a, , d] = pick(rng, INF); const tot = a / (1 - 1 / d);
    const q = mkq(S(K9), 'series', {
      prompt: `Each pump stroke moves 1/${d} as much as the one before: ${a} + ${nice(a, d)} + ${nice(a, d * d)} + … litres, forever. What total does it approach?`, expression: `a = ${a}, r = 1/${d}`, answer: tot, unit: 'L',
      hint: 'When |r| < 1 the sum settles down: S = a / (1 − r).',
      steps: [`S = ${lab(a, 'litres, first stroke')} ÷ (1 − 1/${d}) = ${a} ÷ (${fracStr(d - 1, d)}).`, `= ${lab(fmt(tot), 'litres')}.`], visual: card('Infinite geometric series', ['S = a / (1 − r),  |r| < 1']), app: APP9,
    });
    return typed(q);
  }
  const H = pick(rng, [4, 6, 8, 10, 12, 20]);
  const q = mkq(S(K9), 'series', {
    prompt: `A steel ball drops ${H} m and each bounce rises half as high as the last. Total distance it travels (up and down) before it stops?`, expression: 'total distance = ?', answer: 3 * H, unit: 'm',
    hint: 'After the first drop, every bounce height is travelled TWICE: up and back down.',
    steps: [`Down ${lab(H, 'metres')}, then up and down ${lab(fmt(H / 2), 'metres')}, ${lab(fmt(H / 4), 'metres')}, …`, `The bounce heights add up to ${lab(H, 'metres')}, so ${lab(H, 'm first drop')} + 2·${H} = ${lab(3 * H, 'metres')}.`], visual: card('Bouncing ball', [`${H} + 2·(${fmt(H / 2)} + ${fmt(H / 4)} + …)`]), app: APP9,
  });
  return typed(q);
}

function pascalTable(rng: Rng): AskStep {
  const n = pick(rng, [4, 5]);
  const prev = Array.from({ length: n }, (_, k) => C(n - 1, k));
  const acc = Array.from({ length: n - 1 }, (_, i) => C(n, i + 1)).map(String).join(',');
  const q = mkq(S(K9), 'binomial', {
    prompt: `Vector's vault lock uses row ${n} of Pascal's triangle. Build it from row ${n - 1}.`, expression: `Row ${n}`, answer: C(n, 1),
    hint: 'Each inside entry is the sum of the two entries just above it: the one above and the one above-left.',
    steps: [`Row ${n - 1}: ${prev.join(', ')}.`, `Add neighbours: row ${n} = 1, ${acc.replace(/,/g, ', ')}, 1.`], visual: card(`Row ${n - 1}`, [prev.join('   '), `row ${n} starts and ends with 1`]), app: APP9,
  });
  // only the inside entries of row n: at most 4 columns on a phone
  return model(q, { kind: 'table', cols: Array.from({ length: n - 1 }, (_, i) => `C(${n}, ${i + 1})`), rows: [Array.from({ length: n - 1 }, () => null)], label: `Inside of row ${n}: each = the two above it added` }, [acc], `Fill in the inside of row ${n}.`);
}

function binomCoeffChoose(rng: Rng): AskStep {
  const n = pick(rng, [3, 4, 5]); const k = rint(rng, 1, n - 1); const c = pick(rng, [2, 3, -1, -2]); const a = pick(rng, [1, 1, 2]);
  const right = C(n, k) * a ** k * c ** (n - k); const xk = k === 1 ? 'x' : `x${sup(k)}`; const base = lin(a, c);
  const q = mkq(S(K9), 'binomial', {
    prompt: `Ada expands (${base})${sup(n)} for an error estimate. What is the coefficient of ${xk}?`, expression: `(${base})${sup(n)}: coefficient of ${xk}`, answer: 0,
    hint: `The general term is C(n, k)·(${a === 1 ? 'x' : `${a}x`})ᵏ·cⁿ⁻ᵏ. Raise ${a === 1 ? 'the constant' : 'both parts'} to ${a === 1 ? 'its power' : 'their powers'}, signs included, and do not forget the Pascal number.`,
    steps: [`The ${xk} term is C(${n}, ${k})·(${a === 1 ? 'x' : `${a}x`})${sup(k)}·${par(c)}${sup(n - k)}, and C(${n}, ${k}) = ${C(n, k)}.`, `${C(n, k)}${a === 1 ? '' : ` × ${a ** k}`} × ${par(c ** (n - k))} = ${fmt(right)}.`], visual: card('Binomial theorem', ['(ax + c)ⁿ: term k is', 'C(n, k)·(ax)ᵏ·cⁿ⁻ᵏ']), app: APP9,
  });
  return choose(rng, q, fmt(right), [...(a === 1 ? [] : [fmt(C(n, k) * c ** (n - k))]), fmt(C(n, k)), fmt(C(n, k) * a * c), fmt(Math.abs(right)), fmt(a ** k * c ** (n - k))]);
}

function binomExpandChoose(rng: Rng): AskStep {
  const c = pick(rng, [1, 2, 3, -1, -2]);
  const right = polyStr([c ** 3, 3 * c * c, 3 * c, 1]);
  const q = mkq(S(K9), 'binomial', {
    prompt: `Ada needs (${xm(-c)})³ fully expanded for a volume formula.`, expression: `(${xm(-c)})³ = ?`, answer: 0,
    hint: '(a + b)³ is NOT a³ + b³. Use row 3 of Pascal: 1, 3, 3, 1.',
    steps: [`Coefficients 1, 3, 3, 1 with powers of ${fmt(c)}: x³ + 3·${par(c)}·x² + 3·${par(c)}²·x + ${par(c)}³.`, `= ${right}.`], visual: card('Pascal row 3', ['1  3  3  1']), app: APP9,
  });
  return choose(rng, q, right, [polyStr([c ** 3, 0, 0, 1]), polyStr([c ** 3, 3 * c, 3 * c * c, 1]), polyStr([c ** 3, c * c, c, 1])]);
}

function seqPlotStep(rng: Rng): AskStep {
  let a1 = 0; let d = 0; let g = 0;
  do { a1 = rint(rng, -4, 4); d = pick(rng, [1, 2, 3, -1, -2, -3]); } while (Math.abs(a1 + 4 * d) > 8 && g++ < 40);
  if (Math.abs(a1 + 4 * d) > 8) { a1 = 0; d = 2; }
  const n = pick(rng, [4, 5]); const an = a1 + (n - 1) * d;
  const q = mkq(S(K9), 'patterns', {
    prompt: `Brick plots an arithmetic sequence of sensor readings as points (n, aₙ). The first three are shown.`, expression: `(${n}, a${sub(n)}) = ?`, answer: 0, answerText: `(${n}, ${fmt(an)})`,
    hint: 'An arithmetic sequence goes up (or down) by the same step each time: its points lie on a line.',
    steps: [`d = ${fmt(d)}.`, `a${sub(n)} = ${fmt(a1)} + ${n - 1}·${par(d)} = ${fmt(an)}.`], app: APP9,
  });
  return model(q, { kind: 'plot', range: [0, 6, -9, 9], count: 1, label: 'n →, aₙ ↑', layers: { points: [1, 2, 3].map((k) => ({ x: k, y: a1 + (k - 1) * d })) } }, [`${n},${an}`], `Tap the point for n = ${n}.`);
}

function recursiveTableStep(rng: Rng): AskStep {
  if (rng.next() < 0.3) {
    const a1 = rint(rng, 1, 4); const a2 = rint(rng, 1, 5); const a3 = a1 + a2; const a4 = a2 + a3;
    const q = mkq(S(K9), 'recursive', {
      prompt: `Brick's gear train: each gear's teeth count is the sum of the two before it, aₙ = aₙ₋₁ + aₙ₋₂, with a₁ = ${a1}, a₂ = ${a2}.`, expression: 'aₙ = aₙ₋₁ + aₙ₋₂', answer: a3,
      hint: 'A recursive rule builds each term from earlier terms. Add the two terms just before the blank.',
      steps: [`a₃ = a₂ + a₁ = ${a2} + ${a1} = ${lab(a3, 'teeth')}.`, `a₄ = a₃ + a₂ = ${a3} + ${a2} = ${lab(a4, 'teeth')}.`], app: APP9,
    });
    return model(q, { kind: 'table', cols: ['a₁', 'a₂', 'a₃', 'a₄'], rows: [[a1, a2, null, null]], label: 'aₙ = aₙ₋₁ + aₙ₋₂' }, [`${a3},${a4}`], 'Fill in a₃ and a₄ from the rule.');
  }
  const p = pick(rng, [2, 3, -1, -2]); const c = rnz(rng, -3, 3); let a1 = rint(rng, -2, 4);
  // a₁ on the fixed point c/(1 − p) would make every term equal a₁: copying it would score
  while (a1 * (1 - p) === c) a1 = rint(rng, -2, 4);
  const t = [a1]; for (let i = 1; i < 4; i++) t.push(p * t[i - 1] + c);
  const rule = `aₙ = ${p === 1 ? '' : p === -1 ? '−' : fmt(p)}aₙ₋₁ ${fmtSigned(c)}`;
  const q = mkq(S(K9), 'recursive', {
    prompt: `Brick's pump log is recursive: ${rule}, with a₁ = ${fmt(a1)}. Each reading comes from the one before.`, expression: rule, answer: t[1],
    hint: 'Put the previous term into the rule to get the next one. Work left to right.',
    steps: [`a₂ = ${fmt(p)}·${par(t[0])} ${fmtSigned(c)} = ${fmt(t[1])}.`, `a₃ = ${fmt(p)}·${par(t[1])} ${fmtSigned(c)} = ${fmt(t[2])}; a₄ = ${fmt(p)}·${par(t[2])} ${fmtSigned(c)} = ${fmt(t[3])}.`], app: APP9,
  });
  return model(q, { kind: 'table', cols: ['a₁', 'a₂', 'a₃', 'a₄'], rows: [[a1, null, null, null]], label: rule }, [t.slice(1).join(',')], 'Fill in a₂, a₃ and a₄ from the rule.');
}

const RATIOS: [number, number][] = [[1, 2], [-1, 2], [1, 3], [2, 3], [3, 2], [2, 1], [-1, 1], [5, 4]];
function convergeChoose(rng: Rng): AskStep {
  const [pr, qr] = pick(rng, RATIOS); const a = qr === 1 ? pick(rng, [3, 5, 6]) : qr * qr * pick(rng, [1, 2, 3]);
  const conv = Math.abs(pr) < qr; const rS = fracStr(pr, qr); const DIV = 'No finite sum: |r| ≥ 1';
  const t = (i: number) => (a * pr ** i) / qr ** i; const show = (v: number) => nice(v * qr ** 2, qr ** 2);
  const series = `${fmt(a)} ${t(1) < 0 ? '−' : '+'} ${show(Math.abs(t(1)))} ${t(2) < 0 ? '−' : '+'} ${show(Math.abs(t(2)))} + …`;
  const blind = fracStr(a * qr, qr - pr); // a/(1 − r) used without checking |r|
  const q = mkq(S(K9), 'series', {
    prompt: `Brick's damper passes on r = ${rS} of each shock to the next: ${series} forever. What does the total approach?`, expression: `a = ${fmt(a)}, r = ${rS}`, answer: 0,
    hint: 'a/(1 − r) only works when |r| < 1, so the terms shrink toward 0. Check |r| before using it.',
    steps: conv ? [`|r| = ${fracStr(Math.abs(pr), qr)} < 1: the terms shrink, so the sum settles.`, `S = ${fmt(a)} / (1 − (${rS})) = ${blind}.`]
      : [`|r| = ${fracStr(Math.abs(pr), qr)} ≥ 1: the terms never shrink toward 0, so the partial sums never settle.`, `(The formula would give ${blind}, which is meaningless here.) No finite sum.`],
    visual: card('Infinite geometric series', ['S = a / (1 − r)', 'only when |r| < 1']), app: APP9,
  });
  const plusR = qr + pr === 0 ? [] : [fracStr(a * qr, qr + pr)]; // a/(1 + r): a sign slip (undefined when r = −1)
  return conv ? choose(rng, q, blind, [...plusR, DIV, fracStr(a * pr, qr - pr)])
    : choose(rng, q, DIV, [blind, ...plusR, '0', fmt(a)]);
}

function sigmaTableStep(rng: Rng): AskStep {
  const m = rint(rng, 1, 4); const sqr = rng.next() < 0.3; const p = pick(rng, [2, 3, -2, 4]); const c = rint(rng, -5, 5);
  const f = (k: number) => (sqr ? k * k : p * k + c); const body = sqr ? 'k²' : `(${lin(p, c, 'k')})`;
  const terms = [m, m + 1, m + 2].map(f); const sum = terms.reduce((u, v) => u + v, 0);
  const q = mkq(S(K9), 'sigma', {
    prompt: `Brick's load log records Σ ${body} for k = ${m} to ${m + 2}. Build it term by term.`, expression: `Σ ${body}, k = ${m} to ${m + 2}`, answer: sum,
    hint: 'Σ means: put each k into the term, one row at a time, then add the rows.',
    steps: [`k = ${m}, ${m + 1}, ${m + 2} give ${terms.map(fmt).join(', ')}.`, `Sum = ${terms.map(fmt).join(' + ').replace(/\+ −/g, '− ')} = ${fmt(sum)}.`], app: APP9,
  });
  return model(q, { kind: 'table', cols: ['k', `term ${body}`], rows: [[m, null], [m + 1, null], [m + 2, null], ['sum', null]], label: `Σ ${body}` }, [[...terms, sum].join(',')], 'Fill in each term, then the sum.');
}

function seatsStep(rng: Rng): AskStep {
  const s = pick(rng, [12, 15, 20]); const d = pick(rng, [2, 3]); const R = pick(rng, [10, 12, 16, 20]); const last = s + (R - 1) * d; const tot = (R * (s + last)) / 2;
  const q = mkq(S(K9), 'series', {
    prompt: `A stadium's first row has ${s} seats and each row has ${d} more than the one in front. How many seats in ${R} rows?`, expression: `${s} + ${s + d} + … (${R} rows)`, answer: tot, unit: 'seats',
    hint: 'Arithmetic series: (number of terms) × (first + last) / 2. Find the last row first.',
    steps: [`Last row: ${lab(s, 'seats in row one')} + ${lab(R - 1, 'more rows')} × ${lab(d, 'extra seats per row')} = ${lab(last, 'seats in the last row')}.`, `Total = ${lab(R, 'rows')} × (${s} + ${last})/2 = ${lab(tot, 'seats')}.`], visual: card('Arithmetic series', ['Sₙ = n(a₁ + aₙ)/2']), app: APP9,
  });
  return typed(q);
}

function pipeStackStep(rng: Rng): AskStep {
  const N = rint(rng, 8, 20);
  const q = mkq(S(K9), 'series', {
    prompt: `Brick stacks pipes: ${N} on the bottom row, one fewer in each row above, up to 1 on top. How many pipes?`, expression: `1 + 2 + … + ${N}`, answer: (N * (N + 1)) / 2, unit: 'pipes',
    hint: 'Pair the rows from the ends: 1 with the biggest, 2 with the next… each pair has the same total.',
    steps: [`${N} rows, first 1, last ${N}.`, `${lab(N, 'rows')} × (1 + ${N})/2 = ${lab((N * (N + 1)) / 2, 'pipes')}.`], visual: card('Pipe stack', ['Σ k, k = 1 to n = n(n + 1)/2']), app: APP9,
  });
  return typed(q);
}

/* ================================================================== */
/* 10. Conic sections                                                  */
/* ================================================================== */
const K10 = 'conics';
const APP10 = 'Satellite dishes are parabolas, orbits are ellipses, and navigation systems use hyperbolas.';
const sq = (h: number, v: string) => (h === 0 ? `${v}²` : `(${xm(h, v)})²`);

function circleCentrePlot(rng: Rng): AskStep {
  const h = rint(rng, -5, 5); const k = rint(rng, -5, 5); const r = rint(rng, 1, 5);
  const eq = `${sq(h, 'x')} + ${sq(k, 'y')} = ${r * r}`;
  const q = mkq(S(K10), 'circles', {
    prompt: `Vector's radar ring is ${eq}. Where is its centre?`, expression: eq, answer: 0, answerText: `(${fmt(h)}, ${fmt(k)})`,
    hint: '(x − h)² + (y − k)² = r² has centre (h, k). (x + 3) means x − (−3).',
    steps: [`Match to (x − h)² + (y − k)²: h = ${fmt(h)}, k = ${fmt(k)}.`, `Centre (${fmt(h)}, ${fmt(k)}), radius ${r}.`], app: APP10,
  });
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: 'Radar grid' }, [`${h},${k}`], 'Tap the centre of the circle.');
}

function circleRadiusTyped(rng: Rng): AskStep {
  const h = rint(rng, -5, 5); let k = rint(rng, -5, 5); if (h === 0 && k === 0) k = 2; const r = rint(rng, 2, 9);
  if (rng.next() < 0.45) {
    const eq = `${sq(h, 'x')} + ${sq(k, 'y')} = ${r * r}`;
    const q = mkq(S(K10), 'circles', {
      prompt: `An observatory dome's base, in metres, is ${eq}. What is its radius?`, expression: eq, answer: r, unit: 'm',
      hint: 'The right-hand side is r², not r.', steps: [`r² = ${lab(r * r, 'square metres')}.`, `r = √${r * r} = ${lab(r, 'm radius')}.`], visual: card('Circle', ['(x − h)² + (y − k)² = r²']), app: APP10,
    });
    return typed(q);
  }
  const D = -2 * h; const E = -2 * k; const F = h * h + k * k - r * r;
  const eq = `x² + y²${D ? ` ${fmtSigned(D)}x` : ''}${E ? ` ${fmtSigned(E)}y` : ''}${F ? ` ${fmtSigned(F)}` : ''} = 0`;
  const q = mkq(S(K10), 'circles', {
    prompt: `A cam track is ${eq}. Complete the square to find its radius.`, expression: eq, answer: r,
    hint: 'Group x terms and y terms, add (half the coefficient)² to each, and balance by adding the same on the right.',
    steps: [`${sq(h, 'x')} + ${sq(k, 'y')} = ${[-F, h * h, k * k].filter((v) => v !== 0).map(fmt).join(' + ').replace(/\+ −/g, '− ')}.`, `= ${r * r}, so r = ${r}.`], visual: card('Complete the square', ['x² + bx = (x + b/2)² − (b/2)²']), app: APP10,
  });
  return typed(q);
}

type Conic = 'Circle' | 'Ellipse' | 'Parabola' | 'Hyperbola';
function conicTypeChoose(rng: Rng): AskStep {
  const kind = pick(rng, ['Circle', 'Ellipse', 'Parabola', 'Hyperbola'] as Conic[]);
  const [a, b] = rng.shuffle([2, 3, 4, 5]).slice(0, 2);
  let eq = ''; let why = '';
  if (kind === 'Circle') { const m = pick(rng, [1, 2, 3, 4]); eq = m === 1 ? `x² + y² = ${a * a}` : `${m}x² + ${m}y² = ${m * a * a}`; why = 'x² and y² have the SAME positive coefficient.'; }
  else if (kind === 'Ellipse') { eq = rng.next() < 0.5 ? `x²/${a * a} + y²/${b * b} = 1` : `${b * b}x² + ${a * a}y² = ${a * a * b * b}`; why = 'x² and y² are both positive but with different coefficients.'; }
  else if (kind === 'Hyperbola') { eq = pick(rng, [`x²/${a * a} − y²/${b * b} = 1`, `y²/${a * a} − x²/${b * b} = 1`, `${b * b}x² − ${a * a}y² = ${a * a * b * b}`]); why = 'x² and y² have OPPOSITE signs.'; }
  else { const p = pick(rng, [2, 3, -2]); eq = pick(rng, [`y = ${polyStr([rnz(rng, -5, 5), 0, p])}`, `y² = ${4 * p}x`, `x = y²/${4 * Math.abs(p)}`]); why = 'Only ONE variable is squared.'; }
  const q = mkq(S(K10), 'identify', {
    prompt: 'The observatory catalogues each orbit by its shape. Which conic is this?', expression: eq, answer: 0,
    hint: 'Look at the squared terms: how many are there, and do their coefficients match in sign and size?',
    steps: [why, `So it is ${kind === 'Ellipse' ? 'an' : 'a'} ${kind.toLowerCase()}.`], visual: card('Conic checklist', ['one squared term → parabola', 'same coefficients → circle', 'same sign → ellipse · opposite → hyperbola']), app: APP10,
  });
  return choose(rng, q, kind, (['Circle', 'Ellipse', 'Parabola', 'Hyperbola'] as Conic[]).filter((x) => x !== kind));
}

function ellipseVertexPlot(rng: Rng): AskStep {
  const [a, b] = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2); const xLong = a > b;
  // vertices end the LONG axis, co-vertices the short one: name each point by what it really is
  const nm = (onX: boolean, sign: string) => `the ${onX === xLong ? 'vertex' : 'co-vertex'} on the ${sign} ${onX ? 'x' : 'y'}-axis`;
  const which = pick(rng, [[a, 0, nm(true, 'positive')], [-a, 0, nm(true, 'negative')], [0, b, nm(false, 'positive')], [0, -b, nm(false, 'negative')]] as [number, number, string][]);
  const eq = `x²/${a * a} + y²/${b * b} = 1`;
  const q = mkq(S(K10), 'ellipses', {
    prompt: `A satellite's orbit is ${eq}. Where is ${which[2]}?`, expression: eq, answer: 0, answerText: `(${fmt(which[0])}, ${fmt(which[1])})`,
    hint: 'The number under x² is the SQUARE of the reach along x (likewise for y). Take the square root to get the reach along each axis.',
    steps: [`Under x²: ${a * a} = ${a}², so the ellipse reaches x = ±${a}. Under y²: ${b * b} = ${b}², so it reaches y = ±${b}.`, `The long axis is along ${xLong ? 'x' : 'y'} (semi-major axis ${Math.max(a, b)}, semi-minor ${Math.min(a, b)}): vertices (${xLong ? `±${a}, 0` : `0, ±${b}`}), co-vertices (${xLong ? `0, ±${b}` : `±${a}, 0`}).`, `${which[2][0].toUpperCase()}${which[2].slice(1)}: (${fmt(which[0])}, ${fmt(which[1])}).`], app: APP10,
  });
  return model(q, { kind: 'plot', range: [-7, 7, -7, 7], count: 1, label: 'Orbit chart' }, [`${which[0]},${which[1]}`], `Tap ${which[2]}.`);
}

function conicPick(rng: Rng): AskStep {
  const [a, b] = rng.shuffle([2, 3, 4, 5]).slice(0, 2); const R: Range = [-7, 7, -7, 7];
  const E = (p: number, q2: number): Visual => plotV(R, { segments: ellipseSegs(p, q2) });
  const Hx = plotV(R, { segments: hyperSegs(a, b, false) }); const Hy = plotV(R, { segments: hyperSegs(a, b, true) });
  const hyper = rng.next() < 0.5;
  const eq = hyper ? `x²/${a * a} − y²/${b * b} = 1` : `x²/${a * a} + y²/${b * b} = 1`;
  const q = mkq(S(K10), 'identify', {
    prompt: `Vector's star chart lists the orbit ${eq}. Which graph is it?`, expression: eq, answer: 0,
    hint: hyper ? 'Minus sign: a hyperbola. It opens along the axis of the POSITIVE squared term, with vertices at ±a.' : 'Plus sign: an ellipse. It reaches ±a along x and ±b along y.',
    steps: hyper ? [`Opposite signs → hyperbola; x² is positive, so it opens left and right.`, `Vertices at (±${a}, 0).`] : [`Same signs, different sizes → ellipse.`, `Reaches x = ±${a} and y = ±${b}.`],
    visual: card('Conics', [eq]), app: APP10,
  });
  return hyper ? pickGraph(rng, q, [Hx, Hy, E(a, b), E(a, a)], 0) : pickGraph(rng, q, [E(a, b), E(b, a), Hx, E(Math.max(a, b), Math.max(a, b))], 0);
}

function parabolaFocusPlot(rng: Rng): AskStep {
  const p = pick(rng, [1, 2, 3, -1, -2, -3]); const up = rng.next() < 0.5;
  const eq = up ? `x² = ${fmt(4 * p)}y` : `y² = ${fmt(4 * p)}x`; const F: [number, number] = up ? [0, p] : [p, 0];
  const layers: PlotLayers = up ? { fns: [{ fn: poly(0, 0, 1 / (4 * p)) }] } : { segments: pathSegs((t) => [(t * t) / (4 * p), t], -6, 6, 48) };
  const q = mkq(S(K10), 'parabolas', {
    prompt: `Volt's dish has cross-section ${eq}. The receiver goes at the focus.`, expression: eq, answer: 0, answerText: `(${fmt(F[0])}, ${fmt(F[1])})`,
    hint: `Match to ${up ? 'x² = 4py' : 'y² = 4px'}: the focus is p units from the vertex, inside the curve. 4p is not p.`,
    steps: [`4p = ${fmt(4 * p)}, so p = ${fmt(p)}.`, `Focus (${fmt(F[0])}, ${fmt(F[1])}).`], app: APP10,
  });
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: 'Dish cross-section', layers }, [`${F[0]},${F[1]}`], 'Tap the focus.');
}

const slopeS = (n: number, d: number) => { const s = fracStr(n, d); return s === '1' ? 'y = ±x' : s.includes('/') ? `y = ±(${s})x` : `y = ±${s}x`; };
function hyperbolaAsymptoteChoose(rng: Rng): AskStep {
  const [a, b] = rng.shuffle([2, 3, 4, 5]).slice(0, 2); const vert = rng.next() < 0.4;
  const eq = vert ? `y²/${a * a} − x²/${b * b} = 1` : `x²/${a * a} − y²/${b * b} = 1`;
  const [n, d] = vert ? [a, b] : [b, a];
  const q = mkq(S(K10), 'hyperbolas', {
    prompt: `A navigation hyperbola is ${eq}. What are its asymptotes?`, expression: eq, answer: 0,
    hint: 'Replace the 1 with 0 and solve for y. Use the square roots, not the squares.',
    steps: [`${vert ? `y²/${a * a} = x²/${b * b}` : `y²/${b * b} = x²/${a * a}`} → y = ±(${n}/${d})x.`, `${slopeS(n, d)}.`], visual: card('Asymptotes', ['set the right side to 0']), app: APP10,
  });
  return choose(rng, q, slopeS(n, d), [slopeS(d, n), slopeS(n * n, d * d), `y = ±${n}x`]);
}

/** [rim radius, focal length p]: never Rr = 2p (the depth Rr²/4p would equal p and could be copied), and p varies. */
const DISH: [number, number][] = [[6, 1], [8, 2], [10, 2], [12, 3], [9, 3], [12, 4], [10, 4], [15, 5], [18, 6]];
function dishStep(rng: Rng): AskStep {
  const [Rr, p] = pick(rng, DISH); const d = (Rr * Rr) / (4 * p);
  const q = mkq(S(K10), 'parabolas', {
    prompt: `A dish is ${2 * Rr} dm across and ${fmt(d)} dm deep, shaped like x² = 4py. How far above the vertex is the focus?`, expression: 'p = ?', answer: p, unit: 'dm',
    hint: `The rim point has x = ${lab(Rr, 'rim radius in dm')} and y = ${lab(fmt(d), 'depth in dm')}. It lies on x² = 4py: solve for p.`,
    steps: [`${lab(Rr, 'rim radius in dm')}² = 4p·${lab(fmt(d), 'depth in dm')} → ${Rr * Rr} = ${fmt(4 * d)}p.`, `p = ${Rr * Rr} ÷ ${fmt(4 * d)} = ${lab(p, 'dm above the vertex')}.`], visual: plotV([-Rr - 1, Rr + 1, -1, d + 2], { fns: [{ fn: poly(0, 0, 1 / (4 * p)), from: -Rr, to: Rr }], points: [{ x: Rr, y: d, label: 'rim' }] }), app: APP10,
  });
  return typed(q);
}

function whisperStep(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, [[5, 4, 3], [5, 3, 4], [13, 12, 5], [10, 8, 6], [10, 6, 8], [17, 15, 8]] as [number, number, number][]);
  const q = mkq(S(K10), 'ellipses', {
    prompt: `A whispering gallery, in metres, is the ellipse x²/${a * a} + y²/${b * b} = 1. Two people stand at the foci. How far apart are they?`, expression: 'distance between foci', answer: 2 * c, unit: 'm',
    hint: 'For an ellipse, c² = a² − b², where a is the longer reach (semi-major axis) and b the shorter. Here the long axis is along x, so the foci are at (±c, 0).',
    steps: [`a = ${lab(a, 'm, long reach')}, b = ${lab(b, 'm, short reach')}: c² = ${a * a} − ${b * b} = ${c * c}, so c = ${lab(c, 'm, centre to focus')}.`, `2 × ${c} = ${lab(2 * c, 'm between the foci')}.`], visual: card('Ellipse foci', ['c² = a² − b²']), app: APP10,
  });
  return typed(q);
}

/* ================================================================== */
/* 11. Limits preview                                                  */
/* ================================================================== */
const K11 = 'limits';
const APP11 = 'Instantaneous speed, the flow through a valve at an instant, and every derivative in calculus are limits.';
function holeFn(rng: Rng) {
  let a = 0; let c = 0; let g = 0;
  do { a = rnz(rng, -3, 4); c = rint(rng, -4, 4); } while ((Math.abs(a + c) > 5 || c === -a) && g++ < 40);
  if (Math.abs(a + c) > 5 || c === -a) { a = 2; c = 1; }
  return { a, c, L: a + c, num: polyStr(fromRoots([a, -c])), den: xm(a) };
}
const limS = (a: number, side = '') => `lim x→${fmt(a)}${side}`;

function limitTableStep(rng: Rng): AskStep {
  const h = holeFn(rng); const xs = [h.a - 0.1, h.a - 0.01, h.a + 0.01].map(r4);
  const acc = xs.map((x) => String(r4(x + h.c))).join(',');
  const q = mkq(S(K11), 'tables', {
    prompt: `Vector's gauge reads f(x) = (${h.num}) / (${h.den}), which has no value at x = ${fmt(h.a)} (0/0). Sneak up on it.`, expression: `f(x) near x = ${fmt(h.a)}`, answer: r4(xs[0] + h.c),
    hint: 'Factor the top: for every x except the hole, f(x) simplifies to something easy.',
    steps: [`f(x) = ${facs([h.a, -h.c])}/${fac(h.a)} = ${xm(-h.c)} (x ≠ ${fmt(h.a)}).`, `Values: ${acc.replace(/,/g, ', ').replace(/-/g, '−')}. They close in on ${fmt(h.L)}.`], app: APP11,
  });
  return model(q, { kind: 'table', cols: ['x', 'f(x)'], rows: xs.map((x) => [x, null]), label: `f(x) = (${h.num}) / (${h.den})` }, [acc], 'Fill in f(x) for each x.');
}

function limitHoleChoose(rng: Rng): AskStep {
  const h = holeFn(rng);
  const q = mkq(S(K11), 'algebraic', {
    prompt: `Plugging x = ${fmt(h.a)} into f(x) = (${h.num}) / (${h.den}) gives 0/0. What is the limit?`, expression: `${limS(h.a)} f(x) = ?`, answer: 0,
    hint: '0/0 is a signal to simplify, not an answer. Factor, cancel, then substitute.',
    steps: [`${h.num} = ${facs([h.a, -h.c])}; cancel ${fac(h.a)}.`, `${limS(h.a)} ${h.c ? `(${xm(-h.c)})` : 'x'} = ${fmt(h.L)}.`, 'The function has a hole there, but the limit exists.'],
    visual: card('Factor, cancel, substitute', [`(${h.num}) / (${h.den})`, `x = ${fmt(h.a)} gives 0/0: simplify first`]), app: APP11,
  });
  return choose(rng, q, fmt(h.L), ['Does not exist', '0', '1', fmt(h.c - h.a)]);
}

function limitGraphChoose(rng: Rng): AskStep {
  let m = 1; let n = 0; let a = 0; let g = 0;
  do { m = pick(rng, [1, -1, 2]); n = rint(rng, -2, 3); a = rint(rng, -2, 2); } while (Math.abs(m * a + n) > 4 && g++ < 40);
  const L = m * a + n; const v = L + pick(rng, [-2, 2, 3, -3]); const askLim = rng.next() < 0.7;
  const q = mkq(S(K11), 'graphs', {
    prompt: `A sensor glitch: the graph follows the line, but at x = ${fmt(a)} the recorded value jumps to the dot.`, expression: askLim ? `${limS(a)} f(x) = ?` : `f(${fmt(a)}) = ?`, answer: 0,
    hint: askLim ? 'The limit is the height the graph heads toward from both sides. The value AT the point does not matter.' : 'f(a) is where the solid dot is: the actual recorded value.',
    steps: askLim ? [`From both sides the line heads to height ${fmt(L)} (the open circle).`, `${limS(a)} f(x) = ${fmt(L)}, even though f(${fmt(a)}) = ${fmt(v)}.`] : [`The solid dot is at (${fmt(a)}, ${fmt(v)}).`, `f(${fmt(a)}) = ${fmt(v)}; the limit would be ${fmt(L)}.`],
    visual: plotV([-4, 4, -7, 7], { fns: [{ fn: poly(n, m) }], points: [{ x: a, y: L, open: true }, { x: a, y: v }] }), app: APP11,
  });
  return choose(rng, q, fmt(askLim ? L : v), [fmt(askLim ? v : L), 'Does not exist', fmt((askLim ? L : v) + 1)]);
}

function oneSidedChoose(rng: Rng): AskStep {
  const a = rint(rng, -2, 2); const p = rint(rng, -3, 1); let qq = rint(rng, -1, 3); if (qq === p) qq = p + 2;
  const side = pick(rng, ['⁻', '⁺', ''] as const);
  const Lm = a + p; const Lp = a + qq;
  const right = side === '⁻' ? fmt(Lm) : side === '⁺' ? fmt(Lp) : 'Does not exist';
  const fn: Fn = { kind: 'piece', parts: [{ from: -5, to: a, fn: poly(p, 1) }, { from: a, to: 5, fn: poly(qq, 1) }] };
  const q = mkq(S(K11), 'one-sided', {
    prompt: `A pressure switch trips at x = ${fmt(a)}: f(x) = ${lin(1, p)} for x < ${fmt(a)}, and ${lin(1, qq)} for x ≥ ${fmt(a)}.`, expression: `${limS(a, side)} f(x) = ?`, answer: 0,
    hint: '⁻ means approach from the left (x < a), ⁺ from the right. The two-sided limit exists only if both sides agree.',
    steps: [`From the left: ${lin(1, p).replace('x', par(a))} = ${fmt(Lm)}. From the right: ${lin(1, qq).replace('x', par(a))} = ${fmt(Lp)}.`, side ? `${limS(a, side)} f(x) = ${right}.` : `${fmt(Lm)} ≠ ${fmt(Lp)}, so the two-sided limit does not exist.`],
    visual: plotV([-5, 5, -8, 8], { fns: [{ fn }], points: [{ x: a, y: Lm, open: true }, { x: a, y: Lp }] }), app: APP11,
  });
  const wr = side === '' ? [fmt(Lm), fmt(Lp), fmt((Lm + Lp) / 2)] : [side === '⁻' ? fmt(Lp) : fmt(Lm), 'Does not exist', fmt((Lm + Lp) / 2)];
  return choose(rng, q, right, wr);
}

function secantTyped(rng: Rng): AskStep {
  // speed is a size: keep the time non-negative and the cart moving forward (slope 2a + b > 0)
  let a = 0; let b = 0; let g = 0;
  do { b = rint(rng, -3, 3); a = rint(rng, 0, 3); } while (2 * a + b <= 0 && g++ < 40);
  if (2 * a + b <= 0) { a = 1; b = 1; }
  const f = poly(0, b, 1); const slope = 2 * a + b;
  const ys = [a - 3, a + 3].flatMap((x) => [evalFn(f, x)]).concat([evalFn(f, a), evalFn(f, -b / 2)]);
  const lo = Math.floor(Math.min(...ys)) - 1; const hi = Math.ceil(Math.max(...ys)) + 1;
  const q = mkq(S(K11), 'secants', {
    prompt: `Newton tracks a cart at s(t) = ${polyStr([0, b, 1], 't')}. Shrink h: the secant slopes are average speeds from t = ${fmt(a)} to t = ${fmt(a)} + h. What speed do they approach?`,
    expression: `speed at t = ${fmt(a)}`, answer: slope, unit: 'm/s',
    hint: 'Watch the trend as h gets tiny: the slope settles toward a whole number. Do not just copy the last reading.',
    steps: [`Average speed = [s(${fmt(a)} + h) − s(${fmt(a)})]/h = ${fmt(slope)} + h (in m/s, h in seconds).`, `As h → 0 this approaches ${lab(fmt(slope), 'm/s, speed at that instant')}.`], app: APP11,
  });
  return ask(q, 'type', { aid: { kind: 'secant', fn: f, x: a, hs: [1, 0.5, 0.1, 0.01], range: [a - 3, a + 3, lo, hi] } });
}

function limitPlotStep(rng: Rng): AskStep {
  const h = holeFn(rng);
  const q = mkq(S(K11), 'graphs', {
    prompt: `Vector's gauge curve is f(x) = (${h.num}) / (${h.den}). As x → ${fmt(h.a)}, the graph heads toward one point, but f(${fmt(h.a)}) itself does not exist.`, expression: `${limS(h.a)} f(x)`, answer: 0, answerText: `(${fmt(h.a)}, ${fmt(h.L)})`,
    hint: 'Simplify f by cancelling, then find the height at x = a.',
    steps: [`f(x) = ${xm(-h.c)} for x ≠ ${fmt(h.a)}.`, `Heading toward (${fmt(h.a)}, ${fmt(h.L)}): the limit is ${fmt(h.L)}.`], app: APP11,
  });
  return model(q, { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: 'The graph of f', layers: { fns: [{ fn: { kind: 'rational', num: fromRoots([h.a, -h.c]), den: [-h.a, 1] } }] } }, [`${h.a},${h.L}`], 'Tap the point the graph is heading toward.');
}

function limitInfinityChoose(rng: Rng): AskStep {
  const p = pick(rng, [2, 3, 4, 6]); const qd = pick(rng, [1, 2, 3]); const r = rnz(rng, -7, 7); let s = rnz(rng, -7, 7);
  const lower = rng.next() < 0.35;
  // proportional top and bottom would make f constant: reroll the bottom's constant
  let g = 0; while (!lower && r * qd === s * p && g++ < 20) s = rnz(rng, -7, 7);
  if (!lower && r * qd === s * p) s = -s;
  const fS = lower ? `(${polyStr([r, p])}) / (${polyStr([s, 0, qd])})` : `(${polyStr([r, p])}) / (${polyStr([s, qd])})`;
  const right = lower ? '0' : fracStr(p, qd);
  const q = mkq(S(K11), 'infinity', {
    prompt: `Newton's cooling fin: f(x) = ${fS}. What does f(x) approach as x grows without bound?`, expression: `lim x→∞ ${fS}`, answer: 0,
    hint: 'For huge x only the highest powers matter. Divide top and bottom by the highest power on the bottom.',
    steps: lower ? ['The bottom has the higher degree.', 'f(x) → 0.'] : [`Leading terms: ${fmt(p)}x / ${coefTerm(qd, 'x')}.`, `f(x) → ${right}.`], visual: card('Limits at infinity', ['compare the highest powers']), app: APP11,
  });
  return choose(rng, q, right, [fracStr(r, s), '∞', lower ? fracStr(p, qd) : '0']);
}

function lensTableStep(rng: Rng): AskStep {
  const F = pick(rng, [5, 8, 10, 20, 25]); const us = [100, 1000, 10000];
  const v = (u: number) => fmt(Math.round((F * u * 1000) / (u - F)) / 1000); // 3 decimals: v never reaches F, so never print it as F
  const q = mkq(S(K11), 'infinity', {
    prompt: `Ada's lens images an object u cm away at v = ${F}u/(u − ${F}) cm (bench readings below). What does v approach as u → ∞?`,
    expression: 'lim u→∞ v = ?', answer: F, unit: 'cm',
    hint: 'Read the trend down the table: the objects get further away, and v closes in on one number.',
    steps: [`v = ${us.map(v).join(', ')} (cm) … closing in on ${lab(F, 'cm')}.`, `Algebra agrees: same degree top and bottom, leading coefficients ${F}/1 = ${lab(F, 'cm, focal length')}. Far objects focus at the focal length.`],
    visual: card('Bench readings', us.map((u) => `u = ${u.toLocaleString('en-US')} cm → v ≈ ${v(u)} cm`)), app: 'Camera and telescope designers set the sensor at the focal length, the limit for far objects.',
  });
  return typed(q);
}

function tariffStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 5, 10]); const p = pick(rng, [3, 4, 5]); const qq = pick(rng, [1, 2]);
  // a surcharge: the rate jumps UP at the boundary (F + qq·b > p·b), so heavier parcels never cost less
  const F = (p - qq) * b + pick(rng, [2, 3, 4, 6, 8]);
  const fromLeft = rng.next() < 0.5; const L = p * b; const R = F + qq * b;
  const q = mkq(S(K11), 'one-sided', {
    prompt: `A courier charges C(w) = ${p}w coins for parcels up to ${b} kg (w ≤ ${b}), and ${F} + ${qq === 1 ? '' : qq}w coins above ${b} kg. What does the charge approach as w → ${b}${fromLeft ? '⁻' : '⁺'}?`,
    expression: `lim w→${b}${fromLeft ? '⁻' : '⁺'} C(w) = ?`, answer: fromLeft ? L : R, unit: 'coins',
    hint: `${fromLeft ? '⁻ means from below: parcels just under' : '⁺ means from above: parcels just over'} ${b} kg. Which rule prices those parcels?`,
    steps: [`Just ${fromLeft ? 'under' : 'over'} ${b} kg the rule is ${fromLeft ? `${p}w` : `${F} + ${qq === 1 ? '' : qq}w`}.`, `As w → ${lab(b, 'kg')}: ${fromLeft ? `${lab(p, 'coins per kg')}·${lab(b, 'kg')} = ${lab(L, 'coins')}` : `${lab(F, 'coins base')} + ${lab(qq, 'coins per kg')}·${lab(b, 'kg')} = ${lab(R, 'coins')}`}. From the other side it approaches ${lab(fromLeft ? R : L, 'coins')}, so the two-sided limit does not exist.`],
    visual: card('Courier rates', [`w ≤ ${b} kg: ${p}w`, `w > ${b} kg: ${F} + ${qq === 1 ? '' : qq}w`]), app: 'Tariffs, tax brackets and shipping rates jump at a boundary: one-sided limits describe each side.',
  });
  return typed(q);
}

function coolingStep(rng: Rng): AskStep {
  const Rm = pick(rng, [18, 20, 22, 25]); const D = pick(rng, [40, 60, 70]);
  const q = mkq(S(K11), 'infinity', {
    prompt: `A casting cools as T(t) = ${Rm} + ${D}·(1/2)ᵗ °C, t in hours. What temperature does it approach in the long run?`, expression: 'lim t→∞ T(t)', answer: Rm, unit: '°C',
    hint: 'What happens to (1/2)ᵗ when t is huge?',
    steps: [`(1/2)ᵗ → 0 as t → ∞.`, `T → ${lab(Rm, 'room temperature')} + ${lab(D, 'degrees above the room')} × 0 = ${lab(Rm, 'degrees Celsius')}.`], visual: plotV([0, 8, 0, Rm + D + 10], { fns: [{ fn: { kind: 'exp', a: D, base: 0.5, k: Rm } }], hlines: [{ y: Rm, label: 'room' }] }), app: APP11,
  });
  return typed(q);
}

/* ================================================================== */
/* Chapters                                                            */
/* ================================================================== */
const CHAPTERS: ChapterSpec[] = [
  {
    key: K1, title: 'Functions in Depth', wing: 'gate', wingName: 'Frontier Gatehouse',
    goal: 'Compose functions inside-out, find and graph inverses (a mirror in y = x) and test which functions have one, read piecewise rules at their boundaries and test for even/odd symmetry.',
    misconception: 'Treating f(g(x)) as f times g or as order-free; reading f⁻¹(x) as 1/f(x) or undoing the steps in the wrong order; letting both pieces own a boundary; calling any function with odd powers "odd".',
    teach: [
      { title: 'Chains and switches', text: 'f(g(x)) feeds x into g first, then g’s output into f: with f(x) = x + 3 and g(x) = 2x, f(g(x)) = 2x + 3 but g(f(x)) = 2x + 6, so order matters. A piecewise machine switches rule at a boundary; the solid dot owns the boundary, the open dot does not.', steps: ['g(4) = 2 × 4 = 8 (output of g), then f(8) = 8 + 3 = 11 (final output).', 'Other order: f(4) = 4 + 3 = 7 (output of f), then g(7) = 2 × 7 = 14 (final output). Not the same.', 'The graph is a different rule, h: h(x) is x + 1 left of 1 and 4 − x right of 1.', 'At the boundary x = 1 (switch point): 1 + 1 = 2 (solid dot, owned) but 4 − 1 = 3 (open dot, not owned), so h(1) = 2.'], next: 'Work out g(f(1)) and f(g(1)). Which is bigger?', visual: plotV([-4, 4, -4, 6], { fns: [{ fn: poly(1, 1), from: -4, to: 1 }, { fn: poly(4, -1), from: 1, to: 4, color: 'orange' }], points: [{ x: 1, y: 2, label: 'owns x = 1' }, { x: 1, y: 3, open: true }] }) },
      { title: 'Running a machine backwards', text: 'f⁻¹ undoes f: if f(2) = 5 then f⁻¹(5) = 2. Undo the steps in reverse order: f(x) = 2x + 1 gives f⁻¹(x) = (x − 1)/2. Every point (a, b) becomes (b, a), so f⁻¹ is f mirrored in y = x. Only one-to-one functions have an inverse (a horizontal line meets them at most once). f⁻¹ is not 1/f.', steps: ['f(x) = 2x + 1 means: × 2, then + 1.', 'Undo in reverse order: − 1, then ÷ 2, so f⁻¹(x) = (x − 1)/2.', '2 × 2 + 1 = 5 (output), so f(2) = 5; and (5 − 1)/2 = 2 (the input again), so f⁻¹(5) = 2: back where we started.', 'On the graph: (2, 5) is on f and (5, 2) is on the orange f⁻¹, mirror images in the dashed y = x.'], model: { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: 'f(x) = 2x + 1 and y = x', layers: { fns: [{ fn: poly(1, 2), label: 'f' }, { fn: poly(0, 1), dashed: true, color: 'muted' }, { fn: poly(-0.5, 0.5), label: 'f⁻¹', color: 'orange' }] } } },
      { title: 'Symmetry: even and odd', text: 'Even: f(−x) = f(x), a mirror in the y-axis (x², cos x). Odd: f(−x) = −f(x), a half-turn about the origin (x³, sin x). Test by working out f(−x). x³ + 1 has odd powers but is neither.', steps: ['(−2)² = 4 and 2² = 4: x² is as high at −2 as at 2, so it is even.', '(−1)³ = −1 and 1³ = 1: x³ gives opposite heights, so it is odd.', 'On the graph: (−2, 4) and (2, 4) mirror across the y-axis; (−1, −1) and (1, 1) are a half-turn apart.', 'x³ + 1: 1³ + 1 = 2 but (−1)³ + 1 = 0, which is neither 2 nor −2, so it is neither.'], visual: plotV([-3, 3, -6, 6], { fns: [{ fn: poly(0, 0, 1), label: 'x²' }, { fn: poly(0, 0, 0, 1), label: 'x³', color: 'orange' }] }) },
    ],
    quests: [
      { id: 'aq.precalc.functions.machine-chains', name: 'Machine Chains', giver: 'ada', guided: true, hook: 'Ada: "The gatehouse runs on chained machines and none of them talk. Compose them, undo them, and check which parts are symmetric."', change: 'The gatehouse machines hum in sequence and the frontier gate unbolts.',
        waves: [wave('Inside out', mixOf([composeValueStep, composeTableStep, composeOrderStep])), wave('Run it backwards', mixOf([inverseValueStep, inverseFormulaChoose, inverseReflectStep])), wave('Mirror test', mixOf([oneToOnePick, inverseGraphPick, symmetryPointStep]))] },
      { id: 'aq.precalc.functions.calibration', name: 'Calibration Run', giver: 'volt', hook: 'Volt: "Every sensor needs an inverse to read true, and the valves switch rules mid-range. Calibrate the lot."', change: 'The gate sensors read true across their whole range.',
        waves: [wave('Switch rules', mixOf([piecewisePlotStep, piecewiseStep, composeTableStep])), wave('Undo the sensor', mixOf([inverseFormulaChoose, inverseValueStep, oneToOnePick])), wave('Symmetric parts', mixOf([evenOddStep, symmetryPointStep, composeOrderStep]))] },
    ],
    concept: conceptFrom([inverseReflectStep, symmetryPointStep, composeTableStep, inverseGraphPick, piecewisePlotStep]),
    transfer: oneOf([tempInverseStep, chainCostStep]),
    practice: (rng) => composeValueStep(rng).question,
  },
  {
    key: K2, title: 'Polynomial Functions', wing: 'foundry', wingName: 'Curve Foundry: Beam Hall',
    goal: 'Find every zero from one known zero, build a polynomial from its zeros and a point, predict end behaviour and multiplicity, and solve polynomial inequalities with a sign chart.',
    misconception: 'Reading the zero of (x − 3) as −3; judging end behaviour from the first term written; thinking every zero makes the graph cross.',
    teach: [
      { title: 'Zeros come from factors', text: 'f(x) = (x − 2)(x + 3) is zero when a factor is zero: x = 2 or x = −3. The sign inside the bracket is the opposite of the zero. A squared factor (x − 2)² touches the axis and turns back instead of crossing.', steps: ['Set each factor to zero: x − 2 = 0 gives x = 2, and x + 3 = 0 gives x = −3.', 'Check: f(2) = (2 − 2)(2 + 3) = 0 × 5 = 0.', 'Check: f(−3) = (−3 − 2)(−3 + 3) = −5 × 0 = 0.', 'On the graph the curve crosses at the labelled 2 and −3; between them f(0) = (0 − 2)(0 + 3) = −6, so it dips below.'], next: 'Where does (x − 1)(x + 4) cross the x-axis?', visual: plotV([-5, 5, -8, 8], { fns: [{ fn: { kind: 'poly', c: fromRoots([2, -3]) } }], points: [{ x: 2, y: 0, label: '2' }, { x: -3, y: 0, label: '−3' }] }) },
      { title: 'The leading term rules the ends', text: 'Far from 0 the highest power wins, wherever it is written. Odd degree: the ends go opposite ways. Even degree: same way. A negative leading coefficient flips the picture.', steps: ['Leading term: −x³, degree 3 (odd), coefficient −1 (negative).', 'Big x, say 10: 3 + 2 × 10 − 10³ = 3 + 20 − 1000 = −977, nearly −10³ = −1000.', 'Big negative x, say −10: 3 + 2 × (−10) − (−10)³ = 3 − 20 + 1000 = 983.', 'Right end down, left end up: opposite ways, as odd degree says, and −x³ alone predicts both.'], visual: card('3 + 2x − x³', ['leading term −x³', 'odd, negative: up left, down right']) },
      { title: 'Sign charts', text: 'Mark the zeros on a number line. Between zeros the sign cannot change, so test one x in each piece. The sign flips at a single zero and stays the same at a squared one. The answer to f(x) ≥ 0 is a set: (x + 3)(x − 2) ≥ 0 gives (−∞, −3] ∪ [2, ∞).', steps: ['Zeros −3 and 2 cut the line into three pieces.', 'Left piece, test −4: (−4 + 3)(−4 − 2) = (−1)(−6) = 6 > 0.', 'Middle piece, test 0: (0 + 3)(0 − 2) = −6 < 0.', 'Right piece, test 3: (3 + 3)(3 − 2) = 6 > 0.', '≥ 0 keeps the two + pieces (teal on the picture) and the zeros: (−∞, −3] ∪ [2, ∞).'], visual: plotV([-5, 5, -8, 8], { fns: [{ fn: { kind: 'poly', c: fromRoots([2, -3]) }, color: 'muted' }], segments: [{ a: [-5, 0], b: [-3, 0], label: '+', color: 'teal' }, { a: [-3, 0], b: [2, 0], label: '−', color: 'orange' }, { a: [2, 0], b: [5, 0], label: '+', color: 'teal' }], points: [{ x: -3, y: 0, label: '−3' }, { x: 2, y: 0, label: '2' }] }) },
    ],
    quests: [
      { id: 'aq.precalc.polynomials.beam-sag', name: 'Beam Sag Survey', giver: 'brick', guided: true, hook: 'Brick: "These beams sag along polynomial curves. Tell me where they cross the line, which way the ends go, and where the load is negative."', change: 'Every beam in the hall is tagged with its zeros and sign chart.',
        waves: [wave('Find the zeros', mixOf([zerosPlotStep, zerosChooseStep, allZerosChoose])), wave('Ends and touches', mixOf([endBehaviourStep, multiplicityPick, zeroSliderStep])), wave('Sign chart', mixOf([signChartStep, polySetStep]))] },
      { id: 'aq.precalc.polynomials.cam-profile', name: 'Cam Profile', giver: 'ada', hook: 'Ada: "A cam is a polynomial you can hold. Get its touch points and signs right or the follower jumps."', change: 'The foundry cams run smooth.',
        waves: [wave('Touch or cross', mixOf([multiplicityPick, polySetStep, zerosPlotStep])), wave('Build the cam', mixOf([buildPolyStep, remainderStep, allZerosChoose])), wave('Solve the load', mixOf([endBehaviourStep, signChartStep, polySetStep]))] },
    ],
    concept: conceptFrom([zerosPlotStep, multiplicityPick, signChartStep, zeroSliderStep]),
    transfer: oneOf([boxVolumeStep, profitSignStep]),
    practice: (rng) => remainderStep(rng).question,
  },
  {
    key: K3, title: 'Rational Functions', wing: 'foundry', wingName: 'Curve Foundry: Lens Bench',
    goal: 'Find holes and vertical asymptotes by factoring, horizontal asymptotes by comparing degrees and slant asymptotes by division, and solve rational inequalities with a sign chart.',
    misconception: 'Calling every zero of the denominator an asymptote (a cancelled factor is a hole); finding the horizontal asymptote from the constant terms; putting an asymptote into the solution set of an inequality.',
    teach: [
      { title: 'Hole or wall?', text: 'Factor top and bottom. A factor that cancels leaves a hole: one missing point. A factor left on the bottom makes a vertical asymptote: the graph shoots off to ±∞ there.', steps: ['Cancel (x − 2): what is left is 1/(x + 1), except at x = 2.', 'Hole height: 1/(2 + 1) = 1/3, so the point (2, 1/3) is missing.', 'Wall: x + 1 = 0 at x = −1, where the top is −1 − 2 = −3, not 0.', 'Near the wall: 1/(−0.9 + 1) = 1/0.1 = 10 at x = −0.9, and 100 at x = −0.99.'], next: 'Where are the hole and the wall for (x + 3)/((x + 3)(x − 4))?', visual: card('(x − 2) / ((x − 2)(x + 1))', ['(x − 2) cancels → hole at x = 2', '(x + 1) stays → asymptote x = −1']) },
      { title: 'Where it levels off', text: 'For huge x only the leading terms matter: at x = 1000, (2x + 1)/(x − 1) = 2001/999 ≈ 2.003, and the ±1s hardly count. Bottom degree bigger: y = 0. Same degree: y = ratio of leading coefficients. Top bigger by one: divide, and the quotient is a slant asymptote.', steps: ['Leading terms: (2x + 1)/(x − 1) behaves like 2x/x = 2 for huge x.', 'Already at x = 101: (2 × 101 + 1)/(101 − 1) = 203/100 = 2.03.', 'Same degree (1 and 1), so the asymptote is y = 2/1 = 2: the flat dashed line.', 'The wall is where the bottom is 0: x − 1 = 0 at x = 1, the upright dashed line.'], visual: plotV([-6, 6, -6, 6], { fns: [{ fn: { kind: 'rational', num: [1, 2], den: [-1, 1] } }], vlines: [{ x: 1 }], hlines: [{ y: 2 }] }) },
      { title: 'Sign tests', text: 'A rational function can change sign where the top is 0 and where the bottom is 0, nowhere else. (x − 3)/(x + 1) ≤ 0 on (−1, 3]: 3 is in (f = 0 there), but −1 never is: f does not exist there.', visual: { type: 'numline', min: -4, max: 5, segment: { from: -1, to: 3, openLeft: true } } },
    ],
    quests: [
      { id: 'aq.precalc.rational.lens-bench', name: 'The Lens Bench', giver: 'catalyst', guided: true, hook: 'Catalyst: "My reaction rates are rational functions and the bench keeps blowing up at the asymptotes. Find the walls and the holes."', change: 'The lens bench is marked with every wall and hole.',
        waves: [wave('Hole or wall?', mixOf([vaStep, holePlotStep, vaSliderStep])), wave('Level off', mixOf([haStep, slantAsymptoteChoose, rationalGraphPick])), wave('Sign tests', mixOf([rationalSignStep, rationalSetStep]))] },
      { id: 'aq.precalc.rational.filter-tuning', name: 'Filter Tuning', giver: 'volt', hook: 'Volt: "Filter gains are rational. Tell me where they spike and where they settle."', change: 'The foundry filters are tuned.',
        waves: [wave('Asymptotes', mixOf([vaSliderStep, vaStep, haStep])), wave('Beyond level', mixOf([slantAsymptoteChoose, rationalGraphPick, holePlotStep])), wave('Pass bands', mixOf([rationalSetStep, rationalSignStep, rationalSetStep]))] },
    ],
    concept: conceptFrom([holePlotStep, rationalSignStep, rationalGraphPick, vaSliderStep]),
    transfer: oneOf([avgCostStep, mixingStep]),
    practice: haPractice,
  },
  {
    key: K4, title: 'Exponential & Log Models', wing: 'lab', wingName: 'Growth Lab',
    goal: 'Model percent growth and decay by repeated multiplication, solve continuous models with e and ln, apply log laws and check log equations for extraneous roots, and read a logistic model’s capacity and midpoint.',
    misconception: 'Growing by a percent as if adding the same amount each step; log(M + N) = log M + log N; ln(eˣ) = eˣ; keeping a root that puts a negative number inside a log; "after 3 half-lives, 1/6 is left".',
    teach: [
      { title: 'Multiply, don’t add', text: 'Exponential change multiplies by the same factor each step: N = N₀·bᵗ. Doubling 5 → 10 → 20 → 40, not 5 → 10 → 15. A half-life multiplies by 1/2 each period.', steps: ['5 (start) × 2 (growth factor) = 10, 10 × 2 = 20, 20 × 2 = 40 (count at the last column): each column is the one before, × 2.', 'In one go: 5 × 2³ = 5 × 8 = 40 (count) at t = 3 (steps), the last column.', 'Adding 5 each step would give only 5 + 3 × 5 = 20 (count) at t = 3 (steps).', 'Half-life instead: 40 × 1/2 = 20 (count) after one period, 20 × 1/2 = 10 (count) after two.'], next: 'What is N at t = 4? At t = 6?', model: { kind: 'table', cols: ['N at t = 0', 't = 1', 't = 2', 't = 3'], rows: [[5, 10, 20, 40]], label: 'N = 5·2ᵗ' } },
      { title: 'A log is an exponent', text: 'log₂ 32 = 5 because 2⁵ = 32. So logs obey exponent rules: log(MN) = log M + log N, log(M/N) = log M − log N, log(Mᵏ) = k·log M. ln is the log with base e ≈ 2.718, the base of continuous growth: ln(eᵏ) = k, so e^(0.2t) = 3 gives t = ln 3 / 0.2. Always check roots: log of a negative number does not exist.', visual: card('Log laws', ['log(MN) = log M + log N', 'log(Mᵏ) = k·log M', 'ln x = logₑ x:  ln(eᵏ) = k']) },
      { title: 'Logistic growth', text: 'Real populations cannot grow forever. A logistic model P = K/(1 + A·e^(−kt)) starts like an exponential, then bends over and levels off at the carrying capacity K.', steps: ['The picture is P = 500/(1 + 24e^(−0.9t)): K = 500 (carrying capacity), A = 24 (sets the start), k = 0.9 (growth rate).', 'Start: 500/(1 + 24 × 1) = 500/25 = 20 (population at the start), since e⁰ = 1.', 'Halfway up when 24e^(−0.9t) = 1: t = ln 24 ÷ 0.9 ≈ 3.5 (time), and there P = 500/2 = 250 (half the capacity).', 'Late on: at t = 10 (time), 24e^(−9) ≈ 0.003, so P ≈ 500/1.003 ≈ 498.5 (population), just under the capacity line.'], visual: plotV([0, 10, 0, 600], { segments: pathSegs((t) => [t, 500 / (1 + 24 * Math.exp(-0.9 * t))], 0, 10, 50), hlines: [{ y: 500, label: 'capacity' }] }) },
    ],
    quests: [
      { id: 'aq.precalc.explog.culture-lab', name: 'Culture Lab', giver: 'catalyst', guided: true, hook: 'Catalyst: "The cultures are growing and the tracers are decaying, and my assistants keep ADDING. Show them how multiplication runs a lab."', change: 'The growth lab charts are right for the first time.',
        waves: [wave('Multiply, not add', mixOf([growthTableStep, percentGrowthChoose, halfLifeFracStep])), wave('Half-lives', mixOf([halfLifeStep, halfLifeSlider, lnSolveStep])), wave('Logs are exponents', mixOf([logEvalStep, lnLawChoose]))] },
      { id: 'aq.precalc.explog.decay-vault', name: 'Decay Vault', giver: 'volt', hook: 'Volt: "Capacitors drain, algae double, the vault door wants exponents solved. Logs are your key."', change: 'The decay vault opens on a solved exponent.',
        waves: [wave('Same base', mixOf([balanceExpStep, logExtraneousChoose, logLawStep])), wave('Log laws', mixOf([logNumericStep, lnLawChoose, changeBaseStep])), wave('Models', mixOf([logisticPick, logisticReadStep, lnSolveStep]))] },
    ],
    concept: conceptFrom([growthTableStep, balanceExpStep, halfLifeSlider, logisticPick, logLawStep]),
    transfer: oneOf([decibelStep, phStep, quakeStep]),
    practice: (rng) => logEvalStep(rng).question,
  },
  {
    key: K5, title: 'Trig Functions of Real Numbers', wing: 'tower', wingName: 'Signal Tower',
    goal: 'Work in radians on the unit circle, read exact values, find the period and amplitude of a wave, simplify with identities, and solve trig equations on [0, 2π), including multiple angles and equations solved by factoring with an identity.',
    misconception: 'Stopping at the one answer a calculator gives (sin x = 1/2 has two solutions per turn, sin 2x = 1/2 has four); dividing by sin x and losing solutions; thinking the amplitude changes the period; distributing cos over a sum.',
    teach: [
      { title: 'Radians: angle as distance', text: 'On a circle of radius 1, an angle of t radians walks a distance t around the edge (half a turn is π). cos t and sin t are the x and y of the point you reach, and x² + y² = 1 gives cos²t + sin²t = 1 for every t. Cos does not distribute: cos(π/2 + π/2) = cos π = −1, but cos π/2 + cos π/2 = 0.', visual: { type: 'unitcircle', angle: 150, radians: true, showCoords: true } },
      { title: 'Every solution in one turn', text: 'sin x = 1/2 at π/6, and again at 5π/6, where the circle is at the same height. Use the reference angle, then find every quadrant with the right sign. For sin 2x = 1/2, the angle 2x runs round TWICE while x runs round once: four solutions.', model: { kind: 'unitcircle', label: 'Where is sin x = 1/2?' } },
      { title: 'Stretch and squeeze', text: 'y = A sin(Bx) + D: A is the height above the midline, D lifts the midline, and B squeezes the wave so one cycle takes 2π/B. The A never changes the period.', steps: ['2 sin 2x: A = 2 (height above the midline), B = 2 (waves per full turn), D = 0 (midline lift).', 'One cycle takes 2π/B = 2π/2 = π ≈ 3.14, half of sin x’s 2π ≈ 6.28.', 'Top of the orange wave: 2 sin(2 × π/4) = 2 sin(π/2) = 2 × 1 = 2 at x = π/4 ≈ 0.79.', 'On the graph the orange wave rises and falls twice while sin x does it once, and peaks at 2, not 1.'], next: 'Where is the midline of 3 sin 4x + 1, and how long is one cycle?', visual: plotV([0, 6.5, -3.5, 3.5], { fns: [{ fn: { kind: 'sin' }, label: 'sin x' }, { fn: { kind: 'sin', amp: 2, freq: 2 }, label: '2 sin 2x', color: 'orange' }] }) },
    ],
    quests: [
      { id: 'aq.precalc.trigfns.rotor-room', name: 'Rotor Room', giver: 'volt', guided: true, hook: 'Volt: "The rotors think in radians and the signal tower speaks in waves. Tune both."', change: 'The rotors spin in step with the tower signal.',
        waves: [wave('Radians', mixOf([radianUnitStep, radianUnitStep, trigExactStep])), wave('Waves', mixOf([periodStep, amplitudePick, turbineStep])), wave('Solve on the circle', mixOf([trigEqUnitStep, trigEqStep]))] },
      { id: 'aq.precalc.trigfns.signal-tower', name: 'Signal Tower', giver: 'vector', hook: 'Vector: "The tower repeats itself every turn. Find every time it hits the level, and simplify its formulas."', change: 'The signal tower broadcasts clean waves across the frontier.',
        waves: [wave('Every solution', mixOf([trigEqStep, trigEqAdvStep, trigEqUnitStep])), wave('Identities', mixOf([identityStep, pythagIdStep, trigEqAdvStep])), wave('Signals', mixOf([amplitudePick, periodStep, radianUnitStep]))] },
    ],
    concept: conceptFrom([radianUnitStep, trigEqUnitStep, amplitudePick, trigExactStep]),
    transfer: oneOf([acPeriodStep, tideStep]),
    practice: (rng) => turbineStep(rng).question,
  },
  {
    key: K6, title: 'Polar Coordinates & Complex Numbers', wing: 'tower', wingName: 'Radar Room',
    goal: 'Convert between polar and rectangular coordinates, find the direction of a point in the right quadrant, recognise polar circles, and write and multiply complex numbers in polar form.',
    misconception: 'Taking θ = tan⁻¹(y/x) without checking the quadrant; plotting (r, θ) as if it were (x, y); adding angles and moduli when multiplying.',
    teach: [
      { title: 'Distance and direction', text: 'Polar (r, θ): go r units from the origin in direction θ (anticlockwise from the positive x-axis). Convert with x = r cos θ, y = r sin θ; back with r = √(x² + y²) and the angle from the quadrant.', steps: ['Across: 4 cos(π/2) = 4 × 0 = 0.', 'Up: 4 sin(π/2) = 4 × 1 = 4.', 'So (r, θ) = (4, π/2) lands on (0, 4), the tip of the arrow.', 'Back again: √(0² + 4²) = √16 = 4 = r, and straight up means θ = π/2.'], next: 'Where does (r, θ) = (3, π) land, in x and y?', model: { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: '(r, θ) = (4, π/2) is (0, 4)', layers: { vectors: [{ x: 0, y: 4, label: '(4, π/2)' }] } } },
      { title: 'tan⁻¹ lies about quadrants', text: 'For (−2, 2), tan⁻¹(y/x) = tan⁻¹(−1) = −π/4, but the point is in quadrant II: θ = 3π/4. Always sketch the point first.', visual: plotV([-4, 4, -4, 4], { vectors: [{ x: -2, y: 2, label: '(−2, 2)' }], points: [{ x: 2, y: -2, label: 'tan⁻¹ says here', open: true }] }) },
      { title: 'Complex numbers as arrows', text: 'a + bi is the point (a, b). In polar form r(cos θ + i sin θ), multiplying multiplies the lengths and ADDS the angles. Multiplying by i turns a quarter turn.', steps: ['1 + i√3 is the point (1, √3).', 'Length: √(1² + (√3)²) = √(1 + 3) = √4 = 2 = r.', 'Angle: tan θ = √3/1 = √3 in quadrant I, so θ = π/3.', 'Times i (length 1, angle π/2): lengths 2 × 1 = 2, angles π/3 + π/2 = 5π/6, a quarter turn more.', 'Check: i(1 + i√3) = i + i²√3 = −√3 + i, the point (−√3, 1).'], visual: card('Polar form', ['1 + i√3 = 2(cos π/3 + i sin π/3)', 'zw: multiply r, add θ']) },
    ],
    quests: [
      { id: 'aq.precalc.polar.radar-room', name: 'Radar Room', giver: 'ada', guided: true, hook: 'Ada: "The radar reports distance and direction; the map wants x and y. Translate both ways, and mind the quadrants."', change: 'The radar screen and the survey map finally agree.',
        waves: [wave('Polar to grid', mixOf([polarToRectPlot, polarPlotChoose, rectToPolarR])), wave('Which way?', mixOf([polarAngleUnitStep, polarAngleChoose, polarCurvePick])), wave('Complex plane', mixOf([complexRotatePlot, complexPolarStep]))] },
      { id: 'aq.precalc.polar.phasor-bench', name: 'Phasor Bench', giver: 'volt', hook: 'Volt: "AC circuits add and multiply arrows that spin. Complex numbers in polar form make it easy."', change: 'The phasor bench lights with the right phase angles.',
        waves: [wave('Polar form', mixOf([complexPolarStep, complexRotatePlot, complexMultiplyStep])), wave('Sweep', mixOf([polarCurvePick, polarToRectPlot, polarAngleChoose])), wave('Bearings', mixOf([polarAngleUnitStep, rectToPolarR, complexRotatePlot]))] },
    ],
    concept: conceptFrom([polarToRectPlot, polarAngleUnitStep, polarCurvePick, complexRotatePlot]),
    transfer: oneOf([robotArmStep, impedanceStep]),
    practice: (rng) => rectToPolarR(rng).question,
  },
  {
    key: K7, title: 'Vectors in the Plane', wing: 'range', wingName: 'Launch Range: Thruster Pad',
    goal: 'Write vectors in components, add and scale them tip-to-tail, find magnitude and direction angle, and split a vector into horizontal and vertical parts.',
    misconception: 'Adding magnitudes instead of components (|u + v| = |u| + |v|); writing PQ as P − Q; swapping sin and cos for the components.',
    teach: [
      { title: 'Tip to tail', text: 'A vector ⟨a, b⟩ is a move: a across, b up. To add, put the tail of v on the tip of u; the sum goes from start to finish. In components: add x with x, y with y.', steps: ['Across: 3 + (−1) = 2. Up: 1 + 3 = 4.', 'So u + v = ⟨2, 4⟩.', 'On the plot: u ends at (3, 1); v starts there and ends at (3 − 1, 1 + 3), which is (2, 4), the tip of the sum.', 'Order does not matter: −1 + 3 = 2 and 3 + 1 = 4, so v + u = ⟨2, 4⟩ too.'], model: { kind: 'plot', range: [-6, 6, -6, 6], count: 1, arrows: true, label: 'u = ⟨3, 1⟩, v = ⟨−1, 3⟩', layers: { vectors: [{ x: 3, y: 1, label: 'u', color: 'teal' }, { x: -1, y: 3, from: [3, 1], label: 'v', color: 'orange' }] } } },
      { title: 'Length and direction', text: '|⟨a, b⟩| = √(a² + b²): the hypotenuse. A 3 kN pull east plus 4 kN north is 5 kN, not 7. Direction: the angle from east, in the right quadrant.', steps: ['√(3² + 4²) = √(9 + 16) = √25 = 5 (kN total pull).', 'Direction: tan θ = 4 (kN north) ÷ 3 (kN east), so θ = tan⁻¹(4/3) ≈ 53.1° north of east.', 'On the picture: 3 (kN east, teal), then 4 (kN north); the arrow from start to finish is the 5 (kN total).'], visual: plotV([-1, 5, -1, 5], { vectors: [{ x: 3, y: 0, label: '3', color: 'teal' }, { x: 0, y: 4, from: [3, 0], label: '4' }, { x: 3, y: 4, label: '5', color: 'ask' }] }) },
      { title: 'Components from an angle', text: 'A vector of length F at angle θ above horizontal has ⟨F cos θ, F sin θ⟩. Horizontal pairs with cos, vertical with sin.', steps: ['A 10 N pull at 30° above horizontal.', 'Across: 10 cos 30° ≈ 10 (N pull) × 0.866 = 8.66 (N across).', 'Up: 10 sin 30° = 10 (N pull) × 0.5 = 5 (N up).', 'Check: √(8.66² + 5²) ≈ √(75 + 25) = √100 = 10 (N pull).'], next: 'What are the components of a 20 N pull at 60° above horizontal?', visual: card('Components', ['vₓ = F cos θ', 'vᵧ = F sin θ']) },
    ],
    quests: [
      { id: 'aq.precalc.vectors.thruster-test', name: 'Thruster Test', giver: 'newton', guided: true, hook: 'Newton: "Two thrusters, one probe. Add their pushes the right way or it spins off the pad."', change: 'The probe lifts off in a straight line.',
        waves: [wave('Tip to tail', mixOf([vecAddPlot, vecAddPlot, vecFromPointsChoose])), wave('How strong?', mixOf([vecMagStep, vecMagSumChoose, dirAngleStep])), wave('Scale it', mixOf([vecScalarPlot, componentsChoose]))] },
      { id: 'aq.precalc.vectors.crane-cables', name: 'Crane Cables', giver: 'brick', hook: 'Brick: "Three cables on one hook. I need every pull in components before we lift."', change: 'The range crane lifts its first load level.',
        waves: [wave('Components', mixOf([vecTableStep, componentsChoose, vecFromPointsChoose])), wave('Direction', mixOf([dirAngleStep, dirAngleStep, vecMagStep])), wave('Combine', mixOf([vecScalarPlot, vecAddPlot, vecMagSumChoose]))] },
    ],
    concept: conceptFrom([vecAddPlot, dirAngleStep, vecTableStep, vecScalarPlot]),
    transfer: oneOf([windStep, riverStep]),
    practice: (rng) => vecMagStep(rng).question,
  },
  {
    key: K8, title: 'Parametric Equations', wing: 'range', wingName: 'Launch Range: Flight Line',
    goal: 'Evaluate x(t) and y(t) together, plot positions, eliminate the parameter, and analyse a projectile’s flight time, height and range.',
    misconception: 'Plotting (t, y) instead of (x, y); forgetting to multiply the whole substituted expression when eliminating t; thinking the top of the arc is where it lands.',
    teach: [
      { title: 'One clock, two coordinates', text: 'x = 2t − 1, y = 3 − t: at t = 2 the rover is at (3, 1). The same t goes into both equations; t is the clock, not a coordinate.', steps: ['Clock at 1: 2 × 1 − 1 = 1 across, 3 − 1 = 2 up, so (1, 2).', 'Clock at 2: 2 × 2 − 1 = 3 across, 3 − 2 = 1 up, so (3, 1).', 'Each table row is one tick: the same t goes into both columns.'], next: 'Where is the rover at t = 3?', model: { kind: 'table', cols: ['t', 'x', 'y'], rows: [[0, -1, 3], [1, 1, 2], [2, 3, 1]], label: 'x = 2t − 1, y = 3 − t' } },
      { title: 'Losing the parameter', text: 'Solve one equation for t and substitute into the other: x = t + 2 gives t = x − 2, so y = 3t becomes y = 3(x − 2) = 3x − 6. The whole bracket gets multiplied.', steps: ['Clock at 1: 1 + 2 = 3 across, 3 × 1 = 3 up, so (3, 3).', 'The x–y equation agrees: 3 × 3 − 6 = 3, the same y.', 'Forget the bracket (y = 3x − 2) and you get 3 × 3 − 2 = 7: wrong.'], visual: card('Eliminate t', ['x = t + 2 → t = x − 2', 'y = 3t → y = 3x − 6']) },
      { title: 'A projectile', text: 'x = vt, y = ut − 5t² (g ≈ 10 m/s²). It lands when y = 0 again; by symmetry it is highest halfway through the flight.', steps: ['The arch drawn is x = 10t, y = 20t − 5t²: v = 10 (m/s across), u = 20 (m/s up).', 'Lands: 20t − 5t² = 5t(4 − t) = 0, so t = 4 (seconds), and 10 (m/s across) × 4 (seconds) = 40 (m along).', 'Top halfway, at 2 (seconds): 20 × 2 − 5 × 2² = 40 − 20 = 20 (m high), 10 × 2 = 20 (m along).', 'On the graph: up from (0, 0) to the top at (20, 20), down to (40, 0).'], visual: plotV([0, 42, 0, 25], { fns: [{ fn: poly(0, 2, -0.05), from: 0, to: 40 }] }) },
    ],
    quests: [
      { id: 'aq.precalc.parametric.drone-track', name: 'Drone Track', giver: 'newton', guided: true, hook: 'Newton: "The drones fly on a clock: x of t and y of t. Put them on the map and write their paths."', change: 'Every drone path on the range is charted.',
        waves: [wave('Plug in t', mixOf([paramTableStep, paramPlotStep, paramPlotStep])), wave('Lose the t', mixOf([eliminateChoose, eliminateLinePlot, eliminateChoose])), wave('Shape', mixOf([paramEllipsePick, projectileTyped]))] },
      { id: 'aq.precalc.parametric.launch-range', name: 'Launch Range', giver: 'ada', hook: 'Ada: "Water-rocket tests today. Tell me when they land, how high they go and where to put the catch net."', change: 'The catch nets sit exactly where the rockets come down.',
        waves: [wave('Rocket flight', mixOf([projectileTyped, projectileSlider, projectileTyped])), wave('Paths', mixOf([eliminateLinePlot, paramEllipsePick, eliminateChoose])), wave('Positions', mixOf([paramPlotStep, paramTableStep, projectileSlider]))] },
    ],
    concept: conceptFrom([paramPlotStep, eliminateLinePlot, paramTableStep, paramEllipsePick]),
    transfer: oneOf([ferrisParamStep, droneTimeStep]),
    practice: (rng) => projectileTyped(rng).question,
  },
  {
    key: K9, title: 'Sequences, Series & the Binomial Theorem', wing: 'archive', wingName: 'Pattern Archive',
    goal: 'Build sequences from recursive rules, jump to the nth term, build and count sigma sums, decide whether an infinite geometric series converges and sum it, and find any term of a binomial expansion.',
    misconception: 'Using a₁ + n·d instead of a₁ + (n − 1)d; miscounting the terms in Σ from k = m to n; using a/(1 − r) when |r| ≥ 1; believing (x + c)ⁿ = xⁿ + cⁿ.',
    teach: [
      { title: 'Add or multiply?', text: 'Arithmetic: add the same d each time (5, 8, 11, …; aₙ = a₁ + (n − 1)d). Geometric: multiply by the same r (3, 6, 12, …; aₙ = a₁·rⁿ⁻¹). There are n − 1 steps from term 1 to term n.', steps: ['The dots are 2, 5, 8, 11: each is 3 higher, so d = 3.', '4th term: 2 + (4 − 1) × 3 = 2 + 9 = 11, the top dot.', '10th term: 2 + (10 − 1) × 3 = 2 + 27 = 29.', 'Geometric 3, 6, 12, …: × 2 each time, so the 5th term is 3 × 2⁴ = 3 × 16 = 48.'], next: 'Which term of 2, 5, 8, 11, … is 32?', model: { kind: 'plot', range: [0, 6, -1, 15], count: 1, label: 'aₙ = 2 + 3(n − 1)', layers: { points: [{ x: 1, y: 2 }, { x: 2, y: 5 }, { x: 3, y: 8 }, { x: 4, y: 11 }] } } },
      { title: 'Sigma and series', text: 'Σ (2k + 1) for k = 1 to 4 means 3 + 5 + 7 + 9 = 24; from k = m to n there are n − m + 1 terms. Arithmetic: pair first with last, second with second-last: every pair has the same total, so S = n(first + last)/2. Geometric forever: S − rS = a (everything else cancels), so S = a/(1 − r), but only when |r| < 1; otherwise the terms never shrink and there is no sum.', visual: card('Series', ['1 + 2 + … + 10 = 5 pairs of 11 = 55', 'S − rS = a  →  S = a/(1 − r)']) },
      { title: 'Pascal and the binomial theorem', text: '(x + c)ⁿ is not xⁿ + cⁿ. Multiplying out n brackets, the xᵏ term picks x from k of them and c from the rest, and there are C(n, k) ways to choose: row n of Pascal’s triangle. (x + 2)³ = x³ + 6x² + 12x + 8.', visual: card('Pascal’s triangle', ['1', '1 1', '1 2 1', '1 3 3 1', '1 4 6 4 1']) },
    ],
    quests: [
      { id: 'aq.precalc.sequences.pattern-archive', name: 'Pattern Archive', giver: 'brick', guided: true, hook: 'Brick: "The archive logs readings in patterns. Continue them, jump ahead, and add them up."', change: 'The archive ledgers balance to the last reading.',
        waves: [wave('Next terms', mixOf([seqTableStep, recursiveTableStep, seqPlotStep])), wave('Jump ahead', mixOf([nthTermChoose, sigmaCountChoose, sigmaTableStep])), wave('Add them up', mixOf([sigmaTyped, geoSeriesTyped, convergeChoose]))] },
      { id: 'aq.precalc.sequences.binomial-vault', name: 'Binomial Vault', giver: 'vector', hook: 'Vector: "The vault lock is Pascal’s triangle. Expand the binomials and it opens."', change: 'The binomial vault swings open.',
        waves: [wave('Pascal', mixOf([pascalTable, binomCoeffChoose, binomExpandChoose])), wave('Series', mixOf([geoSeriesTyped, convergeChoose, sigmaTableStep])), wave('Sequences as functions', mixOf([seqPlotStep, recursiveTableStep, nthTermChoose]))] },
    ],
    concept: conceptFrom([pascalTable, sigmaTableStep, seqPlotStep, recursiveTableStep]),
    transfer: oneOf([seatsStep, pipeStackStep]),
    practice: (rng) => { const a1 = rint(rng, 2, 12); const d = rint(rng, 2, 7); const n = rint(rng, 10, 30); return mkq(S(K9), 'nth-term', { prompt: `Arithmetic sequence: a₁ = ${a1}, d = ${d}. Find a${sub(n)}.`, expression: `a${sub(n)} = ?`, answer: a1 + (n - 1) * d, hint: 'aₙ = a₁ + (n − 1)d.', steps: [`a${sub(n)} = ${a1} + ${n - 1}·${d} = ${a1 + (n - 1) * d}.`], app: APP9 }); },
  },
  {
    key: K10, title: 'Conic Sections', wing: 'observatory', wingName: 'Orbit Observatory',
    goal: 'Read the centre and radius of a circle (completing the square), the vertices of an ellipse, the focus of a parabola and the asymptotes of a hyperbola, and name a conic from its equation.',
    misconception: 'Reading (x + 3)² as centre x = 3; taking the number under x² as the reach instead of its square root; confusing ellipses and hyperbolas.',
    teach: [
      { title: 'Circles', text: '(x − h)² + (y − k)² = r²: centre (h, k), radius r. (x + 3)² means h = −3. The right side is r², so = 25 means r = 5. General form? Complete the square first.', model: { kind: 'plot', range: [-6, 6, -6, 6], count: 1, label: '(x − 1)² + (y + 2)² = 9', layers: { segments: ellipseSegs(3, 3, 1, -2), points: [{ x: 1, y: -2, label: 'centre' }] } } },
      { title: 'Ellipses and hyperbolas', text: 'x²/a² + y²/b² = 1 is an ellipse reaching ±a on x and ±b on y. Change the + to − and you get a hyperbola with vertices at ±a and asymptotes y = ±(b/a)x.', steps: ['Teal ellipse: x²/16 + y²/4 = 1, so a = √16 = 4 and b = √4 = 2.', 'It passes (4, 0): 4²/16 + 0²/4 = 1 + 0 = 1.', 'Orange hyperbola: x²/4 − y²/9 = 1, so vertices at ±√4 = ±2 on the x-axis.', 'Asymptotes y = ±(3/2)x: at x = 4 they are at ±6, and the curve is inside at √(9 × 3) ≈ 5.2.'], visual: plotV([-7, 7, -7, 7], { segments: [...ellipseSegs(4, 2), ...hyperSegs(2, 3, false, 'orange')] }) },
      { title: 'Parabolas and focus', text: 'x² = 4py opens up (p > 0) with focus (0, p): every ray coming straight down reflects to the focus. That is why a dish receiver sits there. 4p is not p.', steps: ['The curve is y = x²/8, which is x² = 8y.', 'Match with x² = 4py: 4p = 8.', 'Divide: 8 ÷ 4 = 2 = p, so the focus is (0, 2), the labelled dot.', 'Check a point: 4²/8 = 16/8 = 2, so at x = 4 the dish is level with the focus.'], next: 'Where is the focus of x² = 12y?', visual: plotV([-6, 6, -1, 6], { fns: [{ fn: poly(0, 0, 1 / 8) }], points: [{ x: 0, y: 2, label: 'focus (0, 2)' }] }) },
    ],
    quests: [
      { id: 'aq.precalc.conics.orbit-observatory', name: 'Orbit Observatory', giver: 'vector', guided: true, hook: 'Vector: "The observatory charts orbits and radar rings. Read their equations and put them on the sky map."', change: 'The sky map shows every orbit in its place.',
        waves: [wave('Circles', mixOf([circleCentrePlot, circleCentrePlot, circleRadiusTyped])), wave('Name the conic', mixOf([conicTypeChoose, conicTypeChoose, conicPick])), wave('Ellipses', mixOf([ellipseVertexPlot, ellipseVertexPlot]))] },
      { id: 'aq.precalc.conics.dish-array', name: 'Dish Array', giver: 'volt', hook: 'Volt: "The receivers must sit at the focus or the dishes hear nothing. And the navigation grid runs on hyperbolas."', change: 'The dish array locks onto the satellites.',
        waves: [wave('Focus', mixOf([parabolaFocusPlot, parabolaFocusPlot, conicTypeChoose])), wave('Hyperbolas', mixOf([hyperbolaAsymptoteChoose, conicPick, hyperbolaAsymptoteChoose])), wave('Mixed sky', mixOf([circleRadiusTyped, ellipseVertexPlot, circleCentrePlot]))] },
    ],
    concept: conceptFrom([circleCentrePlot, ellipseVertexPlot, conicPick, parabolaFocusPlot]),
    transfer: oneOf([dishStep, whisperStep]),
    practice: (rng) => circleRadiusTyped(rng).question,
  },
  {
    key: K11, title: 'Limits Preview', wing: 'edge', wingName: 'The Edge of the Map',
    goal: 'Find the value a function approaches from tables and graphs, simplify 0/0 forms, compare one-sided limits, and watch secant slopes approach an instantaneous rate.',
    misconception: 'Thinking the limit is just f(a); thinking 0/0 means the answer is 0 (or that the limit cannot exist); using the last secant reading instead of the value it approaches.',
    teach: [
      { title: 'Where is it heading?', text: 'f(x) = (x² − 4)/(x − 2) has no value at 2 (0/0), but at 1.9, 1.99, 2.01 it gives 3.9, 3.99, 4.01. It heads to 4: the limit is 4. A limit is about the approach, not the value at the point.', steps: ['Factor: x² − 4 = (x − 2)(x + 2), so away from 2, f(x) = x + 2.', 'At 1.9: 1.9 + 2 = 3.9. At 1.99: 1.99 + 2 = 3.99. These are the table rows.', 'Heading into 2: 2 + 2 = 4, the limit.', 'At 2 itself, (2² − 4)/(2 − 2) is 0/0: no value, just a hole at (2, 4).'], next: 'What does f give at x = 2.001?', model: { kind: 'table', cols: ['x', 'f(x)'], rows: [[1.9, 3.9], [1.99, 3.99], [2.01, 4.01]], label: 'f(x) = (x² − 4)/(x − 2)' } },
      { title: 'Left, right, both', text: 'Approach from the left (x → a⁻) and from the right (x → a⁺). If they agree, that is the limit. If they disagree (a jump), the limit does not exist.', steps: ['From the left, x − 1: 0.9 − 1 = −0.1 at 0.9, heading to 1 − 1 = 0 (the open dot).', 'From the right, x + 1: 1.1 + 1 = 2.1 at 1.1, heading to 1 + 1 = 2 (the solid dot).', '0 and 2 disagree, so the limit at 1 does not exist, even though f(1) = 2.'], visual: plotV([-3, 3, -4, 4], { fns: [{ fn: { kind: 'piece', parts: [{ from: -3, to: 1, fn: poly(-1, 1) }, { from: 1, to: 3, fn: poly(1, 1) }] } }], points: [{ x: 1, y: 0, open: true }, { x: 1, y: 2 }] }) },
      { title: 'Secants become a tangent', text: 'The slope from x to x + h is an average rate. Shrink h and the secant swings toward the tangent: its slope approaches the instantaneous rate. This is where calculus begins.', steps: ['h = 1 (the dashed secant): (2.5² − 1.5²)/1 = (6.25 − 2.25)/1 = 4 (secant slope).', 'Shrink to 0.1 (step size h): (1.6² − 1.5²)/0.1 = (2.56 − 2.25)/0.1 = 3.1 (secant slope).', 'Shrink to 0.01 (step size h): (1.51² − 1.5²)/0.01 = (2.2801 − 2.25)/0.01 = 3.01 (secant slope).', '4, 3.1, 3.01 head to 3 (slope of the tangent) at x = 1.5 (x-value).'], next: 'What slope does the secant give with h = 0.001?', visual: plotV([-1, 4, -1, 9], { fns: [{ fn: poly(0, 0, 1) }], tangent: { fn: poly(0, 0, 1), x: 1.5 }, segments: [{ a: [1.5, 2.25], b: [2.5, 6.25], dashed: true, color: 'orange', label: 'secant, h = 1' }] }) },
    ],
    quests: [
      { id: 'aq.precalc.limits.edge', name: 'The Edge', giver: 'vector', guided: true, hook: 'Vector: "Beyond this edge is calculus. To cross, you must say where a function is heading even where it is not defined."', change: 'A bridge of limits reaches toward the Calculus Frontier.',
        waves: [wave('Sneak up', mixOf([limitTableStep, limitTableStep, limitHoleChoose])), wave('Read the graph', mixOf([limitGraphChoose, limitPlotStep, oneSidedChoose])), wave('Secants', mixOf([secantTyped, limitPlotStep]))] },
      { id: 'aq.precalc.limits.speed-trap', name: 'Speed Trap', giver: 'newton', hook: 'Newton: "A speedometer is a limit. Average speeds over smaller and smaller windows: what number are they closing in on?"', change: 'The frontier speed traps read instantaneous speed.',
        waves: [wave('Heading toward', mixOf([limitPlotStep, limitHoleChoose, limitGraphChoose])), wave('Left and right', mixOf([oneSidedChoose, oneSidedChoose, limitTableStep])), wave('Far away', mixOf([limitInfinityChoose, secantTyped, limitPlotStep]))] },
    ],
    concept: conceptFrom([limitTableStep, limitPlotStep, limitGraphChoose]),
    transfer: oneOf([lensTableStep, tariffStep, coolingStep]),
    practice: (rng) => { const h = holeFn(rng); return mkq(S(K11), 'algebraic', { prompt: `Find the limit of (${h.num}) / (${h.den}) as x → ${fmt(h.a)}.`, expression: `${limS(h.a)} f(x) = ?`, answer: h.L, hint: 'Factor, cancel, then substitute.', steps: [`f(x) = ${xm(-h.c)} for x ≠ ${fmt(h.a)}.`, `Limit = ${fmt(h.L)}.`], app: APP11 }); },
  },
  {
    key: 'trial', title: 'Mastery Trial & Graduation', wing: 'capstone', wingName: 'The Frontier Core',
    goal: 'Prove durable Pre-Calculus: functions and graphs, growth and waves, motion and patterns, and the first limits. Seat the Pre-Calculus Core and open the Calculus Frontier.',
    misconception: 'One lucky run is mastery; that Pre-Calculus is a list of separate tricks instead of one toolkit for functions.',
    teach: [
      { title: 'Trial rules', text: 'Five phases across the whole academy, one helper you may use once. Pass at 80% or better. Every chapter must already be mastered.', visual: card('The Mastery Trial', ['Functions & graphs · Growth & waves', 'Motion & patterns · Toward calculus', 'Transfer']) },
    ],
    quests: [
      { id: 'aq.precalc.trial.rehearsal', name: 'Trial Rehearsal', giver: 'vector', guided: true, hook: 'Vector: "Before the Core, a rehearsal. The same five phases and every chapter, no stakes."', change: 'The Frontier Core doors unbar.',
        waves: [wave('Functions & graphs', mixOf([composeValueStep, inverseReflectStep, zerosPlotStep, vaStep])), wave('Growth & waves', mixOf([halfLifeStep, trigEqUnitStep, polarToRectPlot])), wave('Motion & patterns', mixOf([vecAddPlot, projectileTyped, seqPlotStep, circleCentrePlot])), wave('Toward calculus', mixOf([limitHoleChoose])), wave('Transfer', mixOf([oneOf([avgCostStep, windStep, lensTableStep])]))] },
      { id: 'aq.precalc.trial.keeper', name: 'The Frontier Keeper', giver: 'newton', hook: 'Newton: "The Keeper asks anything, anywhere, in any costume. Recognise the mathematics underneath."', change: 'The Keeper steps aside and the road to calculus opens.',
        waves: [wave('Anything', mixOf([tempInverseStep, signChartStep, vaSliderStep, decibelStep, acPeriodStep])), wave('Anywhere', mixOf([robotArmStep, vecTableStep, paramPlotStep, seatsStep, conicPick, limitPlotStep]))] },
    ],
    concept: conceptFrom([inverseReflectStep, polarToRectPlot, limitPlotStep]),
    transfer: oneOf([tempInverseStep, boxVolumeStep, avgCostStep, decibelStep, acPeriodStep, robotArmStep, windStep, droneTimeStep, seatsStep, dishStep, lensTableStep]),
  },
];

export const PRECALC = defineAcademy({
  id: 'precalc',
  name: 'Pre-Calculus Academy',
  short: 'Pre-Calculus',
  tier: 'High School',
  blurb: 'Functions and their inverses, polynomial and rational functions, exponentials and logs, trig functions, polar form, vectors, parametrics, series, conics and a first look at limits.',
  icon: 'compass',
  home: 'calculus-frontier',
  wings: {
    gate: { name: 'Frontier Gatehouse', icon: 'unlock' },
    foundry: { name: 'Curve Foundry', icon: 'anvil' },
    lab: { name: 'Growth Lab', icon: 'flask' },
    tower: { name: 'Signal Tower', icon: 'bolt' },
    range: { name: 'Launch Range', icon: 'target' },
    archive: { name: 'Pattern Archive', icon: 'scroll' },
    observatory: { name: 'Orbit Observatory', icon: 'telescope' },
    edge: { name: 'The Edge of the Map', icon: 'map' },
    capstone: { name: 'The Frontier Core', icon: 'reactor' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'Functions & graphs', items: [composeValueStep(rng), inverseValueStep(rng), evenOddStep(rng), zerosPlotStep(rng), endBehaviourStep(rng), vaStep(rng), haStep(rng)] },
    { name: 'Growth & waves', items: [halfLifeStep(rng), logEvalStep(rng), lnSolveStep(rng), balanceExpStep(rng), trigEqStep(rng), trigExactStep(rng), polarToRectPlot(rng), complexPolarStep(rng)] },
    { name: 'Motion & patterns', items: [vecAddPlot(rng), dirAngleStep(rng), eliminateChoose(rng), projectileTyped(rng), nthTermChoose(rng), binomCoeffChoose(rng), conicTypeChoose(rng), circleCentrePlot(rng)] },
    { name: 'Toward calculus', items: [limitHoleChoose(rng), oneSidedChoose(rng), secantTyped(rng)] },
    { name: 'Transfer', items: [oneOf([avgCostStep, decibelStep, windStep])(rng), oneOf([seatsStep, dishStep, lensTableStep])(rng)] },
  ],
  trialIntro: 'The Pre-Calculus Mastery Trial. Five phases across every chapter, one helper, 80% to pass. The Frontier Core is waiting for its last piece.',
  coreName: 'The Pre-Calculus Core',
  coreLine: 'Functions, waves, vectors and limits lock together. The Pre-Calculus Core seats with a hum, the Edge of the Map folds into a bridge, and the Calculus Frontier opens ahead.',
  coreColor: '#c084fc',
  title: 'Frontier Scout',
});
