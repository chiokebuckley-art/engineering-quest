/**
 * Differential Equations Academy: the last rung of the ladder. Equations whose unknown is a function:
 * reading and checking them, slope fields, Euler steps, separable and linear first-order equations,
 * growth, cooling, mixing and logistic models, second-order oscillators with damping and forcing,
 * RLC circuits, linear systems and phase portraits, and a first look at the Laplace transform.
 * Graduation seats the Reactor Core and completes the Engine.
 */
import type { Rng } from '../../rng';
import type { Question, Visual } from '../../types';
import type { AskStep, PlotLayers } from '../types';
import type { Fn } from '../fn';
import { defineAcademy, type ChapterSpec } from '../defs';
import { academySkill, mkq, typed, choose, model, ask, wave, mixOf, conceptFrom, oneOf, rint, pick, rnz, fmt, fracStr, coefTerm, type QSpec } from '../kit';
import { lab, labn, unit } from '../../label';

const ID = 'diffeq';
const S = (key: string) => academySkill(ID, key);
const Q = (key: string, sub: string, o: QSpec) => mkq(S(key), sub, o);
type Seg = NonNullable<PlotLayers['segments']>[number];
type Col = 'teal' | 'orange' | 'ask' | 'label' | 'muted';
type Range = [number, number, number, number];

/* ---------------- formatting helpers ---------------- */
const SUPS: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻', '-': '⁻', '+': '⁺', t: 'ᵗ', x: 'ˣ' };
const sup = (s: string) => [...s].map((ch) => SUPS[ch] ?? ch).join('');
/** e to the k·v: 'e³ᵗ', 'e⁻ᵗ', 'eᵗ'; non-integer k falls back to 'e^(0.5t)'. */
function ex(k: number, v = 't'): string {
  if (k === 0) return '1';
  if (Number.isInteger(k)) return `e${sup(`${k === 1 ? '' : k === -1 ? '−' : fmt(k)}${v}`)}`;
  return `e^(${fmt(k)}${v})`;
}
/** C·e^(kt): '5e³ᵗ', '−e⁻ᵗ', 'e²ᵗ'. */
const cex = (C: number, k: number, v = 't') => (k === 0 ? fmt(C) : C === 1 ? ex(k, v) : C === -1 ? `−${ex(k, v)}` : `${fmt(C)}${ex(k, v)}`);
/** A sum of terms with clean signs: sumStr([[2,'x'],[-1,'y'],[3,'']]) → '2x − y + 3'. */
function sumStr(terms: [number, string][]): string {
  const out: string[] = [];
  for (const [c, v] of terms) {
    if (!c) continue;
    const body = v ? (Math.abs(c) === 1 ? v : `${fmt(Math.abs(c))}${v}`) : fmt(Math.abs(c));
    out.push(out.length === 0 ? (c < 0 ? `−${body}` : body) : `${c < 0 ? '− ' : '+ '}${body}`);
  }
  return out.length ? out.join(' ') : '0';
}
/** 'y − 3', 'y + 2' or 'y'. */
const shifted = (v: string, e: number) => (e === 0 ? v : `${v} ${e > 0 ? '−' : '+'} ${fmt(Math.abs(e))}`);
/** k times an expression: 'y − 3' (k = 1), '−(y − 3)', '2(y − 3)', or '2y' for a single symbol. */
function scaled(k: number, inner: string): string {
  if (!inner.includes(' ')) return coefTerm(k, inner);
  if (k === 1) return inner;
  return k === -1 ? `−(${inner})` : `${fmt(k)}(${inner})`;
}
/** Signed number for the inside of an expression: '+ 3', '− 2'. */
const sg = (n: number) => (n < 0 ? `− ${fmt(-n)}` : `+ ${fmt(n)}`);
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
/** A number ready to multiply: '3' or '(−3)'. */
const par = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
/** A factored quadratic in v from its roots: '(r − 1)(r + 4)', 'r(r + 4)', '(r − 3)²'. */
const factored = (v: string, r1: number, r2: number) => (r1 === r2 ? `(${shifted(v, r1)})²` : r1 === 0 ? `${v}(${shifted(v, r2)})` : r2 === 0 ? `${v}(${shifted(v, r1)})` : `(${shifted(v, r1)})(${shifted(v, r2)})`);
/** Substituted linear combination: sub([[2, 3], [-1, 4]], 5) → '2·3 − 4 + 5' style, signs as operators. */
function subStr(terms: [number, number][], c = 0): string {
  const parts: string[] = [];
  for (const [k, v] of terms) {
    if (!k) continue;
    const body = `${Math.abs(k) === 1 ? '' : `${fmt(Math.abs(k))}·`}(${fmt(v)})`;
    parts.push(parts.length === 0 ? (k < 0 ? `−${body}` : body) : `${k < 0 ? '−' : '+'} ${body}`);
  }
  if (c) parts.push(parts.length === 0 ? fmt(c) : sg(c));
  return parts.length ? parts.join(' ') : '0';
}
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });
const plotV = (range: Range, layers: PlotLayers): Visual => ({ type: 'plot', range, layers });
/** A curve drawn as short segments (for solutions the Fn specs cannot express: damped waves, logistic). */
function curve(f: (t: number) => number, t0: number, t1: number, color: Col = 'teal', n = 48, lim = 60): Seg[] {
  const out: Seg[] = []; let prev: [number, number] | null = null;
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n; const y = f(t);
    if (!Number.isFinite(y) || Math.abs(y) > lim) { prev = null; continue; }
    const p: [number, number] = [r4(t), r4(y)];
    if (prev) out.push({ a: prev, b: p, color });
    prev = p;
  }
  return out;
}
/**
 * Pick the matching picture with neutral labels ('Graph A'…) assigned in display order, so the label
 * never gives the answer away. `mk` builds the question once the right label is known.
 */
function pickLettered(rng: Rng, prefix: string, right: Visual, wrongs: Visual[], mk: (label: string) => Question): AskStep {
  const items = rng.shuffle([{ v: right, ok: true }, ...wrongs.slice(0, 3).map((v) => ({ v, ok: false }))]);
  const options = items.map((it, i) => ({ visual: it.v, label: `${prefix} ${'ABCD'[i]}` }));
  const label = options[items.findIndex((it) => it.ok)].label;
  return ask({ ...mk(label), answerText: label }, 'pickmodel', { options, accept: [label] });
}
const ORD = ['', 'First order', 'Second order', 'Third order', 'Fourth order'];

/* ============================================================================================
 * 1. What is a differential equation
 * ========================================================================================== */
const ORDER_POOL: { eq: string; order: number; trap: number; why: string }[] = [
  { eq: 'y″ + 4y = 0', order: 2, trap: 1, why: 'y″, the second derivative, is the highest derivative.' },
  { eq: '(y′)² + y = 4t', order: 1, trap: 2, why: 'the ² squares y′; it is a power, not a second derivative.' },
  { eq: 'y‴ − y′ = t²', order: 3, trap: 2, why: 'y‴ is the third derivative; t² is only a power of t.' },
  { eq: 't²y″ + ty′ + y = 0', order: 2, trap: 3, why: 'y″ is the highest derivative; the t² in front is a coefficient.' },
  { eq: 'y′ = y³ − 2t', order: 1, trap: 3, why: 'only y′ appears; y³ is a power of y.' },
  { eq: 'y⁽⁴⁾ + y = sin t', order: 4, trap: 2, why: 'y⁽⁴⁾ is the fourth derivative.' },
  { eq: '(y″)³ + y′ = 0', order: 2, trap: 3, why: 'y″ is the highest derivative; the cube is a power.' },
  { eq: 'y′ + y⁴ = 1', order: 1, trap: 4, why: 'only y′ appears; y⁴ is a power of y.' },
];
function orderStep(rng: Rng): AskStep {
  const p = pick(rng, ORDER_POOL);
  const q = Q('intro', 'order', {
    prompt: 'Vector points at a reactor law. What order is this differential equation?',
    expression: p.eq, answer: p.order,
    hint: 'Order counts derivatives, not powers: find the highest derivative of y.',
    steps: [`Order = the highest derivative present: ${p.why}`, `So it is ${ORD[p.order].toLowerCase()}.`],
    visual: card('Order', ['y′ first derivative', 'y″ second derivative', '(y′)² is still first order']),
    app: 'The order tells an engineer how many starting values (position, speed…) a model needs.',
  });
  return choose(rng, q, ORD[p.order], [ORD[p.trap], ...[1, 2, 3, 4].filter((o) => o !== p.order && o !== p.trap).map((o) => ORD[o])]);
}

/** A straight-line candidate for y′ + a·y = b·t + c: a real solution about 65% of the time, a near miss otherwise. */
function verifyParams(rng: Rng) {
  const a = rint(rng, 1, 3); const m = rnz(rng, -3, 3); const n = rint(rng, -3, 4);
  const b = a * m; const c = m + a * n;
  const fake = rng.next() < 0.35; const n2 = fake ? n + pick(rng, [-2, -1, 1, 2]) : n;
  const cand = sumStr([[m, 't'], [n2, '']]);
  const rhs = sumStr([[b, 't'], [c, '']]);
  const lhs = `y′ + ${coefTerm(a, 'y')}`;
  const vals = [0, 1, 2].map((t) => m + a * (m * t + n2));
  const want = [0, 1, 2].map((t) => b * t + c);
  const rowSteps = [0, 1, 2].map((t) => `t = ${t}: ${fmt(m)} + ${a === 1 ? '' : `${a}·`}(${fmt(m * t + n2)}) = ${lab(fmt(vals[t]), 'left side')}; the right side is ${fmt(want[t])}.`);
  return { a, m, n2, fake, cand, rhs, lhs, vals, want, rowSteps };
}
/** Substitute a straight-line candidate into y′ + a·y = b·t + c and fill the table. */
function verifyTableStep(rng: Rng): AskStep {
  const { a, m, n2, fake, cand, rhs, lhs, vals, rowSteps } = verifyParams(rng);
  const q = Q('intro', 'verify', {
    prompt: `Vector tests y = ${cand} in the law ${lhs} = ${rhs}. Substitute and fill the last column.`,
    expression: `${lhs} = ${rhs}`, answer: vals[0], answerText: vals.map(fmt).join(', '),
    hint: `y′ is the slope of y = ${cand}, which is ${fmt(m)} everywhere. Then add ${a === 1 ? 'y' : `${a} times y`}.`,
    steps: [
      `Here y′ = ${fmt(m)}; add ${a === 1 ? 'y' : `${a}y`} row by row.`,
      ...rowSteps,
      fake ? `The columns do not match, so y = ${cand} is not a solution.` : `Every row matches ${rhs}, so y = ${cand} is a solution.`,
    ],
    app: 'Checking a candidate by substitution is how engineers test a model before trusting it.',
  });
  return model(q, { kind: 'table', cols: ['t', 'y', 'y′', lhs], rows: [0, 1, 2].map((t) => [t, m * t + n2, m, null]), label: `Compare with the right side, ${rhs}` }, [vals.map(fmt).join(',')], `Fill ${lhs} for t = 0, 1, 2.`);
}
const V_YES = 'Yes: every row matches the right side';
const V_NO = 'No: the rows differ from the right side';
const V_ONE = 'Yes: one matching row is enough';
const V_CLOSE = 'Yes: the rows are close enough';
/** The verdict after substituting: the filled column is shown beside the right side. */
function verifySolutionVerdictStep(rng: Rng): AskStep {
  const { m, fake, cand, rhs, lhs, vals, want, rowSteps } = verifyParams(rng);
  const q = Q('intro', 'verify-verdict', {
    prompt: `Newton substituted y = ${cand} into his column law. Is it a solution?`,
    expression: `${lhs} = ${rhs}`, answer: fake ? 0 : 1,
    hint: 'A solution must make the two sides equal for every t, not just some.',
    steps: [`A solution makes both sides equal for every t. Here y′ = ${fmt(m)}.`, ...rowSteps, fake ? `The rows differ, so y = ${cand} is not a solution.` : `Every row matches, so y = ${cand} is a solution.`],
    visual: card(`Left side vs right side`, [0, 1, 2].map((t) => `t = ${t}:  ${fmt(vals[t])}  vs  ${fmt(want[t])}`)),
    app: 'A model is trusted only when it satisfies its law everywhere, not at one lucky point.',
  });
  return fake ? choose(rng, q, V_NO, [V_CLOSE, V_YES]) : choose(rng, q, V_YES, [V_NO, V_ONE]);
}

function whichSolvesStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 4, -2, -3]); const C = pick(rng, [2, 3, 5]);
  const right = `y = ${cex(C, k)}`;
  const q = Q('intro', 'solution', {
    prompt: `Vector's ${k > 0 ? 'growth' : 'decay'} law for the reactor. Which function solves it?`,
    expression: `y′ = ${coefTerm(k, 'y')}`, answer: 0,
    hint: `Differentiate each candidate and compare y′ with ${coefTerm(k, 'y')}.`,
    steps: [`y = ${cex(C, k)} gives y′ = ${cex(C * k, k)} = ${fmt(k)}·(${cex(C, k)}) = ${coefTerm(k, 'y')}.`, `Adding a constant breaks it: (${ex(k)} + ${C})′ = ${cex(k, k)}, but ${fmt(k)}y = ${cex(k, k)} ${sg(k * C)}.`, `The solution of a differential equation is a function, not a number: the constant y = ${fmt(k)} has y′ = 0, but ${fmt(k)}y = ${fmt(k * k)}.`],
    visual: card('Rate proportional to amount', [`y′ = ${coefTerm(k, 'y')}`, 'the slope is always', `${fmt(k)} times the height`]),
    app: 'Every growth or decay model in the reactor starts from y′ = ky.',
  });
  return choose(rng, q, right, [`y = ${ex(k)} + ${C}`, `y = ${fmt(k)}`, `y = ${cex(k, 1)}`]);
}

function secondOrderCheckStep(rng: Rng): AskStep {
  const w = rint(rng, 2, 5); const kind = pick(rng, ['sin', 'cos', 'exp'] as const);
  const f = kind === 'exp' ? ex(w) : `${kind} ${w}t`;
  const right = kind === 'exp' ? `y″ − ${w * w}y = 0` : `y″ + ${w * w}y = 0`;
  const wrongs = kind === 'exp' ? [`y″ + ${w * w}y = 0`, `y″ − ${w}y = 0`, `y′ + ${w}y = 0`] : [`y″ + ${w}y = 0`, `y″ − ${w * w}y = 0`, `y′ + ${w * w}y = 0`];
  const d2 = kind === 'exp' ? `${w * w}${ex(w)}` : `−${w * w} ${kind} ${w}t`;
  const q = Q('intro', 'check-second', {
    prompt: `Newton's oscillator column hums like y = ${f}. Which equation does it solve?`,
    expression: `y = ${f}`, answer: 0,
    hint: 'Differentiate twice. Each derivative brings out another factor from inside.',
    steps: [`y″ = ${d2}, which is ${kind === 'exp' ? `+${w * w}` : `−${w * w}`} times y.`, `So ${right}. The inner ${w} comes out twice, which is why it is squared.`],
    app: 'Springs and circuits are second-order: the acceleration depends on the position.',
  });
  return choose(rng, q, right, wrongs);
}

function constantBalanceStep(rng: Rng): AskStep {
  const n = pick(rng, [2, 3]); const p = n === 2 ? rint(rng, 1, 3) : rint(rng, 1, 2);
  const t0 = n === 2 ? rnz(rng, -3, 3) : rnz(rng, -2, 2); const y0 = rint(rng, -6, 12);
  const pw = n === 2 ? 't²' : 't³'; const b = p * t0 ** n;
  const deriv = n === 2 ? coefTerm(2 * p, 't') : coefTerm(3 * p, 't²');
  const q = Q('intro', 'constant', {
    prompt: `Vector's gauge law: every y = ${coefTerm(p, pw)} + C solves y′ = ${deriv}. Find the C whose curve passes through (${fmt(t0)}, ${fmt(y0)}).`,
    expression: `y = ${coefTerm(p, pw)} + C, y(${fmt(t0)}) = ${fmt(y0)}`, answer: y0 - b,
    hint: `Put t = ${fmt(t0)} and y = ${fmt(y0)} into y = ${coefTerm(p, pw)} + C.`,
    steps: [`One point picks one curve from the family: ${fmt(y0)} = ${p === 1 ? '' : `${p}·`}(${fmt(t0)})${n === 2 ? '²' : '³'} + C.`, `${fmt(y0)} = ${fmt(b)} + C, so C = ${fmt(y0 - b)}.`],
    visual: plotV([-4, 4, -6, 14], { fns: [-4, 0, 4].map((C) => ({ fn: { kind: 'poly' as const, c: n === 2 ? [C, 0, p] : [C, 0, 0, p] }, color: 'muted' as const })), points: [{ x: t0, y: y0, label: `(${fmt(t0)}, ${fmt(y0)})`, color: 'ask' }] }),
    app: 'A starting measurement picks the one curve the real system follows.',
  });
  return model(q, { kind: 'balance', a: 1, b, c: 0, d: y0, variable: 'C' }, [String(y0 - b)], `Balance ${fmt(b)} + C = ${fmt(y0)} until C stands alone.`);
}

function slopeAtStep(rng: Rng, key = 'intro', v = 't'): AskStep {
  let a = rint(rng, -2, 2); const b = rint(rng, -2, 2); if (a === 0 && b === 0) a = 1;
  const c = rint(rng, -3, 3); const t0 = rint(rng, -2, 3); const y0 = rint(rng, -2, 4);
  const f = a * t0 + b * y0 + c; const rhs = sumStr([[a, v], [b, 'y'], [c, '']]);
  const q = Q(key, 'slope', {
    prompt: `The equation tells you the slope wherever you stand. What is dy/d${v} at (${fmt(t0)}, ${fmt(y0)})?`,
    expression: `dy/d${v} = ${rhs}`, answer: f,
    hint: `Put ${v} = ${fmt(t0)} and y = ${fmt(y0)} into the right side.`,
    steps: [`dy/d${v} = ${subStr([[a, t0], [b, y0]], c)} = ${lab(fmt(f), 'slope at this point')}.`],
    app: 'A slope field is this calculation done at every point of the grid.',
  });
  return typed(q);
}

/* transfer */
const ORDER_FRAMES: { frame: string; eq: string; order: number; trap: number }[] = [
  { frame: 'Ada: a loaded beam bends by this law.', eq: 'EI·y⁽⁴⁾ = w(x)', order: 4, trap: 1 },
  { frame: 'Volt: charge in an RLC loop obeys this law.', eq: 'L·q″ + R·q′ + q/C = V(t)', order: 2, trap: 1 },
  { frame: 'Dr. Catalyst: a reaction burns fuel by this law.', eq: 'dc/dt = −k·c²', order: 1, trap: 2 },
  { frame: 'Newton: a skydiver slows by this law.', eq: 'm·v′ = mg − b·v²', order: 1, trap: 2 },
  { frame: 'Brick: a hanging cable sags by this law.', eq: 'y″ = k·√(1 + (y′)²)', order: 2, trap: 3 },
];
function orderTransfer(rng: Rng): AskStep {
  const p = pick(rng, ORDER_FRAMES);
  const q = Q('intro', 'order-transfer', {
    prompt: `${p.frame} What order is it?`, expression: p.eq, answer: p.order,
    hint: 'Look only at derivatives. Powers and constants do not change the order.',
    steps: [`The highest derivative decides: this is ${ORD[p.order].toLowerCase()}.`, `So it needs ${p.order} starting ${p.order === 1 ? 'value' : 'values'}.`],
    app: 'Order = how many initial conditions you must measure.',
  });
  return choose(rng, q, ORD[p.order], [ORD[p.trap], ...[1, 2, 3, 4].filter((o) => o !== p.order && o !== p.trap).map((o) => ORD[o])]);
}
function pendulumTransfer(rng: Rng): AskStep {
  const w = rint(rng, 2, 6); const N = w * w;
  const q = Q('intro', 'pendulum', {
    prompt: `A small pendulum swing θ = A·cos(ωt) solves θ″ + ${N}θ = 0. Which ω works?`,
    expression: `θ″ + ${N}θ = 0`, answer: w,
    hint: 'Differentiate A·cos(ωt) twice and match the result with −' + N + 'θ.',
    steps: [`θ″ = −ω²·A cos(ωt) = −ω²θ.`, `So ω² = ${N} and ω = ${lab(w, 'swing frequency')}.`],
    app: 'Clock escapements and crane loads swing at ω = √(g/L).',
  });
  return choose(rng, q, String(w), [String(N), String(2 * w), fmt(w / 2), fmt(N / 2), String(2 * N)]);
}
function dragRateTransfer(rng: Rng): AskStep {
  const k = pick(rng, [0.1, 0.2, 0.4]); const v = rint(rng, 2, 8); const r = r4(10 - k * v * v);
  const q = Q('intro', 'drag', {
    prompt: `A probe falls with dv/dt = 10 − ${fmt(k)}v². At v = ${v} m/s, what is dv/dt?`,
    expression: `dv/dt = 10 − ${fmt(k)}·${v}²`, answer: r, unit: 'm/s²',
    hint: 'The equation is a rule for the rate: put the current speed in.',
    steps: [`At ${lab(v, 'speed in m/s')}: ${fmt(k)}·${v}² = ${lab(fmt(r4(k * v * v)), 'drag in m/s²')}.`, `dv/dt = ${lab(10, 'gravity in m/s²')} − ${lab(fmt(r4(k * v * v)), 'drag in m/s²')} = ${lab(fmt(r), 'acceleration in m/s²')}.`],
    app: 'Drag laws decide a parachute\'s landing speed.',
  });
  return typed(q);
}

/* ============================================================================================
 * 2. Slope fields & equilibria
 * ========================================================================================== */
const FIELD_POOL: [number, number, number][] = [[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0], [1, 1, 0], [-1, 1, 0], [1, -1, 0], [0, -1, 2], [0, 1, -1], [1, 0, -1], [0, -1, -1], [-1, -1, 0]];
const fieldText = ([a, b, c]: [number, number, number]) => sumStr([[a, 'x'], [b, 'y'], [c, '']]);
const same3 = (p: number[], q: number[]) => p.every((v, i) => v === q[i]);
function whichFieldStep(rng: Rng): AskStep {
  const right = pick(rng, FIELD_POOL); const [a, b, c] = right;
  const cands: [number, number, number][] = [[b, a, c], [-a, -b, -c], ...rng.shuffle(FIELD_POOL)];
  const wrongs: [number, number, number][] = [];
  for (const w of cands) if (!same3(w, right) && !wrongs.some((x) => same3(x, w)) && wrongs.length < 3) wrongs.push(w);
  const fv = (f: [number, number, number]) => plotV([-3, 3, -3, 3], { field: { a: f[0], b: f[1], c: f[2] } });
  const s1 = a + 2 * b + c; const s2 = -a + b + c;
  return pickLettered(rng, 'Field', fv(right), wrongs.map(fv), () => Q('fields', 'match-field', {
    prompt: 'Vector\'s floor shows four slope fields. Which one belongs to this equation?',
    expression: `dy/dx = ${fieldText(right)}`, answer: 0,
    hint: 'Test one or two points: the dash there must have the slope the equation gives.',
    steps: [`Test points: at (1, 2) the slope is ${fmt(s1)}; at (−1, 1) it is ${fmt(s2)}.`, `${b === 0 ? 'The slope depends only on x, so dashes match along vertical lines.' : a === 0 ? 'The slope depends only on y, so dashes match along horizontal lines.' : 'The slope depends on both x and y.'}`, 'Only one field has those dashes.'],
    app: 'A slope field shows every possible behaviour of a model before you solve it.',
  }));
}

/** dy/dt = k(y − e) */
function eqText(k: number, e: number) { return scaled(k, shifted('y', e)); }
function equilibriumStep(rng: Rng): AskStep {
  const k = pick(rng, [1, -1, 2, -2]); const e = rint(rng, -3, 3);
  const q = Q('fields', 'equilibrium', {
    prompt: 'Vector\'s floor law. An equilibrium solution is a constant y where dy/dt = 0. Tap two points on it.',
    expression: `dy/dt = ${eqText(k, e)}`, answer: e, answerText: `y = ${fmt(e)}`,
    hint: 'Set the right side to 0. Where are the dashes flat?',
    steps: [`dy/dt = 0 when ${shifted('y', e)} = 0, so y = ${fmt(e)}.`, `The equilibrium solution is the horizontal line y = ${fmt(e)}: the dashes there are flat.`],
    app: 'An equilibrium is a steady operating point of the reactor.',
  });
  return model(q, { kind: 'plot', range: [-4, 4, -4, 4], count: 2, label: 'Tap two points on the equilibrium line', layers: { field: { a: 0, b: k, c: -k * e } } }, undefined, `Tap two points on the solution that never changes.`, { rule: { kind: 'on-line', m: 0, b: e } });
}

const STABLE = 'Stable: nearby solutions move toward it';
const UNSTABLE = 'Unstable: nearby solutions move away';
const CROSS = 'Neither: solutions pass through it';
function stabilityStep(rng: Rng): AskStep {
  const k = pick(rng, [1, -1, 2, -2, 3, -3]); const e = rint(rng, -2, 2);
  const stable = k < 0;
  const q = Q('fields', 'stability', {
    prompt: `The coolant loop obeys this law. What kind of equilibrium is y = ${fmt(e)}?`,
    expression: `dy/dt = ${eqText(k, e)}`, answer: stable ? 1 : 0,
    hint: `Try y a little above ${fmt(e)}: is dy/dt positive (rising) or negative (falling)?`,
    steps: [`Just above y = ${fmt(e)}, dy/dt has the sign of ${fmt(k)}: ${k > 0 ? 'positive, so y rises further' : 'negative, so y falls back'}.`, `Just below, the sign flips: ${k > 0 ? 'y falls further' : 'y rises back'}.`, stable ? 'Solutions close in on it: stable.' : 'Solutions run away from it: unstable.', 'Solutions never cross an equilibrium line.'],
    visual: plotV([-3, 3, -4, 4], { field: { a: 0, b: k, c: -k * e }, hlines: [{ y: e, label: `y = ${fmt(e)}` }] }),
    app: 'Engineers want the operating point stable: a small bump should die out.',
  });
  return choose(rng, q, stable ? STABLE : UNSTABLE, [stable ? UNSTABLE : STABLE, CROSS]);
}

function phaseLineStep(rng: Rng): AskStep {
  const p = rint(rng, -7, 3); const qv = p + rint(rng, 2, 6); const s = pick(rng, [1, -1]);
  const stable = s > 0 ? p : qv;
  const f = factored('y', p, qv);
  const q = Q('fields', 'phase-line', {
    prompt: 'Dr. Catalyst\'s coolant law has two equilibria. Tap the one that is stable.',
    expression: `dy/dt = ${s < 0 ? '−' : ''}${f}`, answer: stable,
    hint: 'Check the sign of dy/dt between the equilibria and outside them. Arrows point the way y moves.',
    steps: [`Equilibria: y = ${fmt(p)} and y = ${fmt(qv)}.`, `Between them (try y = ${fmt((p + qv) / 2)}), dy/dt is ${s > 0 ? 'negative: y moves down' : 'positive: y moves up'}; outside, the sign is the opposite.`, `Arrows point into y = ${fmt(stable)} from both sides, so it is stable.`],
    visual: { type: 'numline', min: -10, max: 10, points: [{ x: p, label: fmt(p) }, { x: qv, label: fmt(qv) }] },
    app: 'A phase line tells you where a process settles without solving anything.',
  });
  return model(q, { kind: 'numberline', start: stable === p ? qv + 1 : p - 1, min: -10, max: 10, label: 'Phase line: tap the stable equilibrium' }, [String(stable)], 'Tap the equilibrium that solutions move toward.');
}

function solutionCurveStep(rng: Rng): AskStep {
  const k = pick(rng, [1, -1]); const e = rint(rng, -1, 1); const y0 = e + pick(rng, [-2, -1.5, 1.5, 2]);
  const R: Range = [0, 4, -4, 4];
  const base: PlotLayers = { field: { a: 0, b: k, c: -k * e }, hlines: [{ y: e }], points: [{ x: 0, y: y0, color: 'ask' }] };
  const mk = (f: (t: number) => number) => plotV(R, { ...base, segments: curve(f, 0, 4, 'teal', 40, 6) });
  const right = mk((t) => e + (y0 - e) * Math.exp(k * t));
  const wrongs = [mk((t) => e + (y0 - e) * Math.exp(-k * t)), mk((t) => e + (y0 - e) * (2 * Math.exp(-t) - 1)), mk((t) => y0 + k * (y0 - e) * t)];
  return pickLettered(rng, 'Graph', right, wrongs, () => Q('fields', 'solution-curve', {
    prompt: `The coolant starts at y(0) = ${fmt(y0)}. Which curve follows the field?`,
    expression: `dy/dt = ${eqText(k, e)}`, answer: 0,
    hint: 'A solution is tangent to every dash it passes, and it can never cross the equilibrium line.',
    steps: [`y = ${fmt(e)} is an equilibrium, so the solution cannot cross it.`, k < 0 ? `It bends toward y = ${fmt(e)} and levels off.` : `It bends away from y = ${fmt(e)} faster and faster.`, 'A straight line only follows the first dash; the field turns it.'],
    app: 'Sketching a solution from the field is a quick sanity check on any simulation.',
  }));
}

/* transfer */
function tankLevelTransfer(rng: Rng): AskStep {
  const k = pick(rng, [1, 2, 3]); const h = rint(rng, 2, 8); const inflow = k * h;
  const q = Q('fields', 'tank-level', {
    prompt: `Brick's settling pond fills at ${inflow} m³/h and leaks ${k === 1 ? 'h' : `${k}h`} m³/h at depth h. Tap the depth where the level holds steady.`,
    expression: `dh/dt = ${inflow} − ${coefTerm(k, 'h')}`, answer: h,
    hint: 'Steady means dh/dt = 0: inflow equals leak.',
    steps: [`${lab(inflow, 'inflow in m³/h')} − ${coefTerm(k, 'h')} = 0 gives h = ${lab(h, 'steady depth in m')}.`, `Above ${h} m the leak wins (level falls); below it the inflow wins, so h = ${h} is stable.`],
    app: 'Reservoirs, batteries and tanks all settle where input balances output.',
  });
  return model(q, { kind: 'numberline', start: 0, min: 0, max: 12, label: 'Depth h (m)' }, [String(h)], 'Tap the steady depth.');
}

/* ============================================================================================
 * 3. Euler's method
 * ========================================================================================== */
function eulerParams(rng: Rng) {
  let a = pick(rng, [-1, 0, 1, 2]); const b = pick(rng, [-1, 0, 1]); if (a === 0 && b === 0) a = 1;
  const c = rint(rng, -2, 3); const y0 = rint(rng, -2, 4);
  return { a, b, c, y0, f: (t: number, y: number) => a * t + b * y + c, rhs: sumStr([[a, 't'], [b, 'y'], [c, '']]) };
}
function eulerTableStep(rng: Rng): AskStep {
  const { f, rhs, y0 } = eulerParams(rng); const h = pick(rng, [1, 0.5]);
  const s0 = f(0, y0); const y1 = r4(y0 + h * s0); const s1 = r4(f(h, y1)); const y2 = r4(y1 + h * s1);
  const vals = [s0, y1, s1, y2];
  const q = Q('euler', 'euler-table', {
    prompt: `Step Ada's controller forward with h = ${fmt(h)}: slope first, then next y = y + h·slope.`,
    expression: `y′ = ${rhs}, y(0) = ${fmt(y0)}`, answer: y2, answerText: vals.map(fmt).join(', '),
    hint: `Slope = ${rhs} at the current (t, y). New y = old y + ${fmt(h)} × slope.`,
    steps: [`Euler: follow the tangent for one step, then recompute the slope.`, `Slope at (0, ${fmt(y0)}) = ${lab(fmt(s0), 'slope at this point')}; y₁ = ${fmt(y0)} + ${lab(fmt(h), 'step size h')}·${par(s0)} = ${lab(fmt(y1), 'Euler step')}.`, `Slope at (${fmt(h)}, ${fmt(y1)}) = ${lab(fmt(s1), 'slope at this point')}; y₂ = ${fmt(y1)} + ${lab(fmt(h), 'step size h')}·${par(s1)} = ${lab(fmt(y2), 'Euler step')}.`],
    app: 'Every simulator, from game physics to spacecraft, steps forward like this.',
  });
  return model(q, { kind: 'table', cols: ['n', 't', 'y', 'slope'], rows: [[0, 0, y0, null], [1, h, null, null], [2, r4(2 * h), null, '—']] }, [vals.map(fmt).join(',')], 'Fill the slope, then the next y, row by row.');
}
function eulerOneStep(rng: Rng): AskStep {
  const { f, rhs } = eulerParams(rng); const t0 = rint(rng, 0, 2); const y0 = rint(rng, -2, 5); const h = pick(rng, [0.1, 0.2, 0.5, 1]);
  const s = f(t0, y0); const y1 = r4(y0 + h * s);
  const q = Q('euler', 'euler-step', {
    prompt: `One Euler step of size h = ${fmt(h)} from y(${t0}) = ${fmt(y0)}. What is y(${fmt(r4(t0 + h))})?`,
    expression: `y′ = ${rhs}`, answer: y1,
    hint: 'New y = old y + h × (slope at the old point).',
    steps: [`Slope at (${t0}, ${fmt(y0)}) = ${lab(fmt(s), 'slope at this point')}.`, `y(${fmt(r4(t0 + h))}) ≈ ${lab(fmt(y0), 'y now')} + ${lab(fmt(h), 'step size h')}·${par(s)} = ${lab(fmt(y1), 'Euler step')}.`],
    app: 'One Euler step is one tick of a simulation clock.',
  });
  return typed(q);
}
function eulerPlotStep(rng: Rng): AskStep {
  let p = eulerParams(rng); let t0 = rint(rng, 0, 2); let y0 = rint(rng, -2, 3); let g = 0;
  while (Math.abs(y0 + p.f(t0, y0)) > 5 && g++ < 30) { p = eulerParams(rng); t0 = rint(rng, 0, 2); y0 = rint(rng, -2, 3); }
  if (Math.abs(y0 + p.f(t0, y0)) > 5) { p = { a: 1, b: 0, c: 0, y0: 0, f: (t) => t, rhs: 't' }; t0 = 1; y0 = 1; }
  const s = p.f(t0, y0); const y1 = y0 + s;
  const q = Q('euler', 'euler-plot', {
    prompt: `Ada's controller starts at (${t0}, ${fmt(y0)}). Take one Euler step with h = 1: where do you land?`,
    expression: `dy/dt = ${p.rhs}`, answer: y1, answerText: `(${t0 + 1}, ${fmt(y1)})`,
    hint: 'Follow the dash at your start point for one unit to the right.',
    steps: [`Slope at (${t0}, ${fmt(y0)}) = ${lab(fmt(s), 'slope at this point')}.`, `Move right ${lab(1, 'step size h')} and ${s >= 0 ? 'up' : 'down'} ${lab(fmt(Math.abs(s)), 'rise')}: (${t0 + 1}, ${fmt(y1)}).`],
    app: 'Euler walks the slope field one tangent at a time.',
  });
  return model(q, { kind: 'plot', range: [-1, 5, -6, 6], count: 1, label: 'Tap where one step lands', layers: { field: { a: p.a, b: p.b, c: p.c }, points: [{ x: t0, y: y0, label: 'start', color: 'ask' }] } }, [`${t0 + 1},${y1}`], 'Tap the point one Euler step away.');
}

const EULER_CASES: { rhs: string; y0: number; exact: string; fn: Fn; euler: number; true1: number; low: boolean }[] = [
  { rhs: 'y', y0: 1, exact: 'eᵗ', fn: { kind: 'exp', a: 1, base: Math.E }, euler: 2, true1: 2.718, low: true },
  { rhs: '2 − y', y0: 0, exact: '2 − 2e⁻ᵗ', fn: { kind: 'exp', a: -2, base: 1 / Math.E, k: 2 }, euler: 2, true1: 1.264, low: false },
  { rhs: '−y', y0: 3, exact: '3e⁻ᵗ', fn: { kind: 'exp', a: 3, base: 1 / Math.E }, euler: 0, true1: 1.104, low: true },
  { rhs: 't', y0: 0, exact: 't²/2', fn: { kind: 'poly', c: [0, 0, 0.5] }, euler: 0, true1: 0.5, low: true },
  { rhs: '1 − y', y0: 3, exact: '1 + 2e⁻ᵗ', fn: { kind: 'exp', a: 2, base: 1 / Math.E, k: 1 }, euler: 1, true1: 1.736, low: true },
  { rhs: '−t', y0: 2, exact: '2 − t²/2', fn: { kind: 'poly', c: [2, 0, -0.5] }, euler: 2, true1: 1.5, low: false },
];
const E_LOW = 'Too low: the curve bends up, away from the tangent';
const E_HIGH = 'Too high: the curve bends down, below the tangent';
const E_EXACT = 'Exact: Euler follows the curve';
function eulerErrorStep(rng: Rng): AskStep {
  const c = pick(rng, EULER_CASES);
  const q = Q('euler', 'euler-error', {
    prompt: `Ada's controller rides the tangent at t = 0 for one Euler step (h = 1). Is its y(1) too high, too low, or exact?`,
    expression: `y′ = ${c.rhs}, y(0) = ${fmt(c.y0)}`, answer: c.low ? 0 : 1,
    hint: 'Look at the bend of the true curve (teal) compared with the tangent (orange).',
    steps: [`The curve ${c.low ? 'bends upward (concave up), so the tangent stays below it' : 'bends downward (concave down), so the tangent stays above it'}.`, `Euler: y(1) ≈ ${lab(fmt(c.y0), 'start value')} + ${lab(1, 'step size h')} × ${lab(fmt(c.euler - c.y0), 'starting slope')} = ${lab(fmt(c.euler), 'Euler estimate')}.`, `True: y = ${c.exact}, so y(1) ≈ ${lab(fmt(c.true1), 'true value')}.`, `So Euler is ${c.low ? 'too low' : 'too high'}.`],
    visual: plotV([0, 2, -1, 4], { fns: [{ fn: c.fn, label: 'true' }], tangent: { fn: c.fn, x: 0 } }),
    app: 'Knowing which way a simulation errs tells you which side your safety margin must cover.',
  });
  return choose(rng, q, c.low ? E_LOW : E_HIGH, [c.low ? E_HIGH : E_LOW, E_EXACT]);
}
function halveStepStep(rng: Rng): AskStep {
  const E = pick(rng, [0.08, 0.12, 0.2, 0.36, 0.5, 0.6]); const h = pick(rng, [0.2, 0.4, 0.1]);
  const q = Q('euler', 'euler-order', {
    prompt: `Ada's controller: with h = ${fmt(h)}, Euler's answer is off by ${fmt(E)}. About how far off with h = ${fmt(h / 2)}?`,
    expression: `error ${fmt(E)} at h = ${fmt(h)}`, answer: E / 2,
    hint: 'Euler is a first-order method: its error is roughly proportional to h.',
    steps: ['Error ≈ (constant) × h for Euler.', `Halve h and the error roughly halves: ${lab(fmt(E), 'error now')} ÷ 2 ≈ ${lab(fmt(E / 2), 'new error')}.`, 'Twice the steps for half the error: accuracy costs computing time.'],
    app: 'Choosing a step size is a trade between accuracy and run time.',
  });
  return choose(rng, q, fmt(E / 2), [fmt(E / 4), fmt(E), fmt(E * 2)]);
}

/* transfer */
function bioFilterEulerTransfer(rng: Rng): AskStep {
  const B = pick(rng, [1000, 2000, 4000]); const r = pick(rng, [0.05, 0.1]); const d = pick(rng, [100, 200, 500]);
  const B1 = B + r * B + d;
  const q = Q('euler', 'bio-filter', {
    prompt: `Catalyst's bio-filter: bacteria grow by dN/dt = ${fmt(r)}N + ${d} per hour (a feeder adds ${d} an hour), from N(0) = ${B}. One Euler step of 1 hour gives?`,
    expression: `N(1) ≈ ${B} + 1·(${fmt(r)}·${B} + ${d})`, answer: B1, unit: 'bacteria',
    hint: 'New value = old value + step × rate at the old value.',
    steps: [`Rate at t = 0: ${lab(fmt(r), 'growth rate per hour')} × ${lab(B, 'bacteria')} + ${lab(d, 'fed per hour')} = ${lab(fmt(r * B + d), 'bacteria per hour')}.`, `N(1) ≈ ${lab(B, 'bacteria now')} + ${lab(1, 'hour')} × ${lab(fmt(r * B + d), 'bacteria per hour')} = ${lab(fmt(B1), 'bacteria')}.`],
    app: 'Bioreactor controllers step their cultures forward the same way.',
  });
  return typed(q);
}
function dragEulerTransfer(rng: Rng): AskStep {
  const k = pick(rng, [0.2, 0.5]); const h = pick(rng, [0.5, 1]);
  const v1 = r4(0 + h * 10); const v2 = r4(v1 + h * (10 - k * v1));
  const q = Q('euler', 'drag-euler', {
    prompt: `Newton drops a probe: v′ = 10 − ${fmt(k)}v, v(0) = 0. Two Euler steps of h = ${fmt(h)} s. What is v?`,
    expression: `v′ = 10 − ${fmt(k)}v`, answer: v2, unit: 'm/s',
    hint: 'First step uses the slope at v = 0; the second uses the slope at the new v.',
    steps: [`Step 1: at v = 0 the slope is ${lab(10, 'm/s²')}, so v ≈ 0 + ${lab(fmt(h), 'step in s')}·10 = ${lab(fmt(v1), 'speed in m/s')}.`, `Step 2: slope 10 − ${fmt(k)}·${fmt(v1)} = ${lab(fmt(r4(10 - k * v1)), 'm/s²')}, so v ≈ ${fmt(v1)} + ${lab(fmt(h), 'step in s')}·${fmt(r4(10 - k * v1))} = ${lab(fmt(v2), 'speed in m/s')}.`],
    app: 'Flight software integrates drag like this many times a second.',
  });
  return typed(q);
}

/* ============================================================================================
 * 4. Separable equations
 * ========================================================================================== */
const SEP_YES = ['dy/dx = x·y²', 'dy/dx = (x + 1)/y', 'dy/dx = eˣ·y', 'dy/dx = y·cos x', 'dy/dx = 3x²(y − 2)', 'dy/dx = xy + x'];
const SEP_NO = ['dy/dx = x + y', 'dy/dx = x² + y²', 'dy/dx = sin(xy)', 'dy/dx = y + x²', 'dy/dx = eˣ + y', 'dy/dx = xy + 1'];
function isSeparableStep(rng: Rng): AskStep {
  const right = pick(rng, SEP_YES);
  const q = Q('separable', 'is-separable', {
    prompt: 'Dr. Catalyst can only use the separate-and-integrate trick on one of these. Which is separable?',
    expression: 'dy/dx = g(x)·h(y)?', answer: 0,
    hint: 'Separable means the right side factors into (a function of x) × (a function of y). A sum usually does not.',
    steps: [`${right} factors as ${right === 'dy/dx = xy + x' ? 'x(y + 1)' : 'a function of x times a function of y'}.`, 'A sum like x + y cannot be split into an x-part times a y-part.'],
    app: 'Recognising the type of an equation picks the solving method.',
  });
  return choose(rng, q, right, rng.shuffle(SEP_NO));
}
function separateStep(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, 4, 6]); const n = pick(rng, [1, 2]); const xn = n === 1 ? 'x' : 'x²';
  const t = coefTerm(a, xn); const divY = rng.next() < 0.5;
  const eq = divY ? `dy/dx = ${t}/y` : `dy/dx = ${t}y`;
  const right = divY ? `y dy = ${t} dx` : `dy/y = ${t} dx`;
  const wrongs = divY ? [`dy/y = ${t} dx`, `y dx = ${t} dy`, `dy = ${t}y dx`] : [`y dy = ${t} dx`, `dy = ${t} dx`, `dy = ${t}y dx`];
  const q = Q('separable', 'separate', {
    prompt: 'Dr. Catalyst\'s rate law: move every y to the side with dy and every x to the side with dx.',
    expression: eq, answer: 0,
    hint: divY ? 'y is dividing on the right: multiply both sides by y (and by dx).' : 'y is multiplying on the right: divide both sides by y (and multiply by dx).',
    steps: [divY ? `Multiply both sides by y·dx: ${right}.` : `Divide by y and multiply by dx: ${right}.`, 'Now each side can be integrated on its own.'],
    app: 'Separating variables turns one hard equation into two ordinary integrals.',
  });
  return choose(rng, q, right, wrongs);
}
function solveSepStep(rng: Rng): AskStep {
  const kind = pick(rng, ['ky', 'xy', 'x/y', 'y2'] as const);
  if (kind === 'ky') {
    const k = pick(rng, [2, 3, 4, -2, -3]);
    const q = Q('separable', 'solve-sep', {
      prompt: 'Dr. Catalyst\'s rate law: separate and integrate. Which is the general solution?', expression: `dy/dx = ${coefTerm(k, 'y')}`, answer: 0,
      hint: '∫dy/y = ln|y|. Exponentiate at the very end: the +C becomes a multiplier.',
      steps: [`dy/y = ${fmt(k)} dx, so ln|y| = ${coefTerm(k, 'x')} + C.`, `Exponentiate: y = e^(${coefTerm(k, 'x')} + C) = C·${ex(k, 'x')} (a new constant C).`, 'The constant multiplies; it is not added on after.'],
      app: 'Growth, decay and discharge all have this shape.',
    });
    return choose(rng, q, `y = C${ex(k, 'x')}`, [`y = ${ex(k, 'x')} + C`, `y = ${coefTerm(k, 'x')} + C`, `y = Cx${sup(fmt(k))}`]);
  }
  if (kind === 'xy') {
    const k = rint(rng, 1, 3); const e2 = `e^(${coefTerm(k, 'x²')})`;
    const q = Q('separable', 'solve-sep', {
      prompt: 'Dr. Catalyst\'s rate law: separate and integrate. Which is the general solution?', expression: `dy/dx = ${coefTerm(2 * k, 'xy')}`, answer: 0,
      hint: `dy/y = ${2 * k}x dx. Integrate both sides, then exponentiate.`,
      steps: [`ln|y| = ∫${2 * k}x dx = ${coefTerm(k, 'x²')} + C.`, `y = C·${e2}: the constant multiplies.`],
      app: 'Reaction rates that speed up with time give this bell-shaped family.',
    });
    return choose(rng, q, `y = C·${e2}`, [`y = ${e2} + C`, `y = C${ex(2 * k, 'x')}`, `y = ${coefTerm(k, 'x²')} + C`]);
  }
  if (kind === 'x/y') {
    const q = Q('separable', 'solve-sep', {
      prompt: 'Dr. Catalyst\'s rate law: separate and integrate. Which is the general solution?', expression: 'dy/dx = x/y', answer: 0,
      hint: 'y dy = x dx. Integrate both sides; both give a square over 2.',
      steps: ['y dy = x dx, so y²/2 = x²/2 + C.', 'Multiply by 2 (2C is still just a constant): y² = x² + C.'],
      app: 'These hyperbolas are the paths of the reactor\'s cooling fins.',
    });
    return choose(rng, q, 'y² = x² + C', ['y = x + C', 'y² = x²', 'y²/2 = x² + C']);
  }
  const q = Q('separable', 'solve-sep', {
    prompt: 'Dr. Catalyst\'s rate law: separate and integrate. Which is the general solution?', expression: 'dy/dx = y²', answer: 0,
    hint: 'dy/y² = dx. The integral of y⁻² is −y⁻¹.',
    steps: ['∫y⁻² dy = ∫dx gives −1/y = x + C.', 'So y = −1/(x + C). The C sits inside, next to x.'],
    app: 'Runaway reactions follow this law.',
  });
  return choose(rng, q, 'y = −1/(x + C)', ['y = 1/(x + C)', 'y = −1/x + C', `y = C${ex(2, 'x')}`]);
}
const TRIPLES: [number, number, number][] = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [9, 12, 15]];
function ivpSepStep(rng: Rng): AskStep {
  if (rng.next() < 0.6) {
    const [a, x, y] = pick(rng, TRIPLES);
    const q = Q('separable', 'ivp-sep', {
      prompt: `Brick's fin profile: separate, integrate, use y(0) = ${a}. What is y(${x})?`, expression: `dy/dx = x/y, y(0) = ${a}`, answer: y,
      hint: 'y dy = x dx gives y² = x² + C. Use the starting value to find C.',
      steps: [`y² = x² + C and y(0) = ${a} give C = ${a * a}.`, `y(${x})² = ${x * x} + ${a * a} = ${y * y}, so y = ${y}: positive, like the start.`],
      app: 'Initial conditions turn a family of curves into one prediction.',
    });
    return typed(q);
  }
  const [y0, x, y] = pick(rng, [[1, 0.5, 2], [1, 0.75, 4], [1, 0.8, 5], [1, 0.9, 10], [2, 0.25, 4], [2, 0.3, 5], [2, 0.4, 10]] as [number, number, number][]);
  const q = Q('separable', 'ivp-sep', {
    prompt: `Catalyst's runaway law: separate, integrate, use y(0) = ${y0}. What is y(${fmt(x)})?`, expression: `dy/dx = y², y(0) = ${y0}`, answer: y,
    hint: '−1/y = x + C. Find C from y(0), then solve for y.',
    steps: [`−1/y = x + C and y(0) = ${y0} give C = ${fracStr(-1, y0)}.`, `y = 1/(${fracStr(1, y0)} − x); at x = ${fmt(x)}: y = 1/${fmt(r4(1 / y0 - x))} = ${y}.`],
    app: 'The same algebra predicts how fast a runaway reaction spikes.',
  });
  return typed(q);
}
const SEP_TABLE: Record<number, number[]> = { 8: [6, 15], 12: [5, 9, 16], 15: [8, 20], 20: [15, 21], 24: [7, 10, 18, 32] };
function sepTableStep(rng: Rng): AskStep {
  const a = pick(rng, [8, 12, 15, 20, 24]); const xs = rng.shuffle(SEP_TABLE[a]).slice(0, 2).sort((p, q) => p - q);
  const ys = xs.map((x) => Math.sqrt(x * x + a * a));
  const q = Q('separable', 'sep-table', {
    prompt: `The fin profile solves dy/dx = x/y with y(0) = ${a}. Fill in y.`, expression: `y² = x² + ${a * a}`, answer: ys[0], answerText: ys.join(', '),
    hint: 'Separating gave y² = x² + C, and y(0) fixes C. Square, add, take the root.',
    steps: [`y² = x² + C with y(0) = ${a}: C = ${a * a}.`, ...xs.map((x, i) => `x = ${x}: y = √(${x * x} + ${a * a}) = √${x * x + a * a} = ${ys[i]}.`)],
    app: 'Tabulating a solution is how its curve gets machined.',
  });
  return model(q, { kind: 'table', cols: ['x', 'y'], rows: [[0, a], [xs[0], null], [xs[1], null]] }, [ys.join(',')], 'Fill in y for each x.');
}
function sepConstantStep(rng: Rng): AskStep {
  if (rng.next() < 0.6) {
    const x0 = rnz(rng, -4, 4); const y0 = rnz(rng, -5, 6);
    const q = Q('separable', 'sep-constant', {
      prompt: `Brick's fin: separating dy/dx = x/y gave y² = x² + C. The curve passes through (${fmt(x0)}, ${fmt(y0)}). Find C.`,
      expression: `(${fmt(y0)})² = (${fmt(x0)})² + C`, answer: y0 * y0 - x0 * x0,
      hint: 'Put the point in, square the numbers, then undo the addition.',
      steps: [`${y0 * y0} = ${x0 * x0} + C.`, `C = ${y0 * y0} − ${x0 * x0} = ${fmt(y0 * y0 - x0 * x0)}.`],
      app: 'One measurement fixes the constant of integration.',
    });
    return model(q, { kind: 'balance', a: 1, b: x0 * x0, c: 0, d: y0 * y0, variable: 'C' }, [String(y0 * y0 - x0 * x0)], `Balance ${x0 * x0} + C = ${y0 * y0}.`);
  }
  const x0 = rnz(rng, -4, 4); const y0 = pick(rng, [1, -1]); const d = -1 / y0;
  const q = Q('separable', 'sep-constant', {
    prompt: `Catalyst's reaction: separating dy/dx = y² gave −1/y = x + C. The solution passes through (${fmt(x0)}, ${fmt(y0)}). Find C.`,
    expression: `−1/(${fmt(y0)}) = ${fmt(x0)} + C`, answer: d - x0,
    hint: `Put x = ${fmt(x0)} and y = ${fmt(y0)} in. −1/(${fmt(y0)}) is ${fmt(d)}.`,
    steps: [`${fmt(d)} = ${fmt(x0)} + C.`, `C = ${fmt(d)} − (${fmt(x0)}) = ${fmt(d - x0)}.`],
    app: 'One measurement fixes the constant of integration.',
  });
  return model(q, { kind: 'balance', a: 1, b: x0, c: 0, d, variable: 'C' }, [String(d - x0)], `Balance C ${sg(x0)} = ${fmt(d)}.`);
}
function blowupStep(rng: Rng): AskStep {
  const y0 = pick(rng, [1, 2, 4, 0.5]); const T = 1 / y0;
  const q = Q('separable', 'blow-up', {
    prompt: `Catalyst's runaway reaction: y′ = y², y(0) = ${fmt(y0)}. Slide to the moment the solution blows up.`,
    expression: `y′ = y², y(0) = ${fmt(y0)}`, answer: T,
    hint: 'Separate: −1/y = t + C. Solve for y; it blows up where the denominator hits 0.',
    steps: [`Separate: −1/y = t + C; y(0) = ${fmt(y0)} gives C = −${fmt(1 / y0)}, so y = 1/(${fmt(1 / y0)} − t).`, `The denominator is 0 at t = ${fmt(T)}: y shoots to infinity there.`, 'A tidy-looking equation can still have a solution that ends in finite time.'],
    app: 'Thermal runaway in batteries is this kind of blow-up; engineers design to stay far from it.',
  });
  return model(q, { kind: 'slider', min: 0, max: 3, step: 0.25, label: 'Time t', range: [0, 3, 0, 12], layers: { fns: [{ fn: { kind: 'rational', num: [y0], den: [1, -y0] } }] } }, [String(T)], 'Slide to the time where y blows up.');
}
/* transfer */
function torricelliTransfer(rng: Rng): AskStep {
  const h0 = pick(rng, [4, 9, 16, 25]); const k = pick(rng, [0.5, 1, 2]); const T = r4((2 * Math.sqrt(h0)) / k);
  const q = Q('separable', 'torricelli', {
    prompt: `Brick's water tower drains by dh/dt = ${coefTerm(-k, '√h')} (h in m, t in minutes), starting at h = ${h0} m. How many minutes until it is empty?`,
    expression: `dh/dt = ${coefTerm(-k, '√h')}, h(0) = ${h0}`, answer: T, unit: 'min',
    hint: 'Separate: dh/√h = −k dt. The integral of h^(−1/2) is 2√h.',
    steps: [`2√h = ${coefTerm(-k, 't')} + C; h(0) = ${lab(h0, 'start depth in m')} gives C = 2√${h0} = ${lab(2 * Math.sqrt(h0), 'constant C')}.`, `Empty when 2√h = 0: t = ${k === 1 ? '' : `${2 * Math.sqrt(h0)} ÷ ${lab(fmt(k), 'drain constant')} = `}${lab(fmt(T), 'minutes to empty')}.`],
    app: 'Torricelli\'s law sizes the drain on every tank.',
  });
  return typed(q);
}
function boatTransfer(rng: Rng): AskStep {
  const [v0, m] = pick(rng, [[4, 2], [4, 4], [5, 2], [10, 5], [10, 2], [2, 2]] as [number, number][]);
  const t = r4((m - 1) / v0); const v = v0 / m;
  const q = Q('separable', 'boat', {
    prompt: `Newton cuts a barge's engine: dv/dt = −v², v(0) = ${v0} m/s. What is v at t = ${fmt(t)} s?`,
    expression: `dv/dt = −v², v(0) = ${v0}`, answer: v, unit: 'm/s',
    hint: 'Separate: dv/v² = −dt, so 1/v grows by exactly t.',
    steps: [`−1/v = −t + C, and v(0) = ${lab(v0, 'start speed in m/s')}, so 1/v = t + 1/${v0}.`, `At t = ${lab(fmt(t), 'seconds')}: 1/v = ${fmt(r4(t + 1 / v0))}, so v = ${lab(fmt(v), 'speed in m/s')}.`],
    app: 'Quadratic drag slows boats and bullets this way.',
  });
  return typed(q);
}
function reactionSepTransfer(rng: Rng): AskStep {
  const q = Q('separable', 'second-order-reaction', {
    prompt: 'A reaction uses fuel by dc/dt = −kc², starting at c₀. Which law does the concentration follow?',
    expression: 'dc/dt = −kc²', answer: 0,
    hint: 'Separate: dc/c² = −k dt. The integral of c⁻² is −c⁻¹.',
    steps: ['−1/c = −kt + C, so 1/c = kt + C.', 'At t = 0: C = 1/c₀, so 1/c = kt + 1/c₀.'],
    app: 'Chemical engineers read reaction order from plots of 1/c against t.',
  });
  return choose(rng, q, '1/c = kt + 1/c₀', ['c = c₀e⁻ᵏᵗ', '1/c = −kt + 1/c₀', 'c = c₀ − kt']);
}

/* ============================================================================================
 * 5. Growth, decay & cooling
 * ========================================================================================== */
const AMOUNTS = [80, 160, 240, 320, 96, 400, 640];
function halfLifeTableStep(rng: Rng): AskStep {
  const A = pick(rng, AMOUNTS); const T = pick(rng, [2, 3, 5, 8, 10, 12]);
  const vals = [A / 2, A / 4, A / 8];
  const q = Q('growth', 'half-life-table', {
    prompt: `An isotope sample of ${A} mg has a half-life of ${T} hours. Fill the decay table.`,
    expression: `A(t) = ${A}·(1/2)^(t/${T})`, answer: vals[2], answerText: vals.join(', '),
    hint: 'Every half-life, whatever is left halves. It never drops by the same amount twice.',
    steps: ['dA/dt = −kA: the amount lost is proportional to the amount left, so each half-life halves it.', `After ${lab(T, 'hours')}: ${lab(A, 'mg at start')} ÷ 2 = ${lab(vals[0], 'mg left')}.`, `After ${lab(2 * T, 'hours')}: ${vals[0]} ÷ 2 = ${lab(vals[1], 'mg left')}.`, `After ${lab(3 * T, 'hours')}: ${vals[1]} ÷ 2 = ${lab(vals[2], 'mg left')}.`],
    app: 'Reactor fuel, medical tracers and carbon dating all run on half-lives.',
  });
  return model(q, { kind: 'table', cols: ['t (h)', 'amount (mg)'], rows: [[0, A], [T, null], [2 * T, null], [3 * T, null]] }, [vals.join(',')], 'Fill the amount after each half-life.');
}
function halfLifeTypedStep(rng: Rng): AskStep {
  const A = pick(rng, AMOUNTS); const T = pick(rng, [3, 5, 6, 8, 10]); const n = rint(rng, 2, 4); const v = A / 2 ** n;
  const q = Q('growth', 'half-life', {
    prompt: `${A} mg of tracer, half-life ${T} hours. How much is left after ${n * T} hours?`,
    expression: `${A}·(1/2)^(${n * T}/${T})`, answer: v, unit: 'mg',
    hint: `How many half-lives fit into ${n * T} hours?`,
    steps: [`${lab(n * T, 'hours')} ÷ ${lab(T, 'hours per half-life')} = ${labn(n, 'half-life', 'half-lives')}.`, `${lab(A, 'mg at start')} ÷ 2${sup(String(n))} = ${A} ÷ ${2 ** n} = ${lab(fmt(v), 'mg left')}.`],
    app: 'Hospitals time tracer doses by half-lives.',
  });
  return typed(q);
}
function rateFromHalfLifeStep(rng: Rng): AskStep {
  const T = pick(rng, [3, 5, 8, 10, 20]);
  const q = Q('growth', 'decay-constant', {
    prompt: `A sample decays by dA/dt = −kA with a half-life of ${T} years. What is k?`,
    expression: `A = A₀e⁻ᵏᵗ, A(${T}) = A₀/2`, answer: Math.LN2 / T,
    hint: `Set e^(−k·${T}) = 1/2 and take ln of both sides.`,
    steps: [`After ${lab(T, 'years, one half-life')}: e^(−${T}k) = 1/2 → −${T}k = ln(1/2) = −ln 2.`, `k = (ln 2)/${T} ≈ ${lab(fmt(r4(Math.LN2 / T)), 'decay rate per year')}.`, 'k is a rate, not the fraction lost: it is not 1/2.'],
    app: 'Decay constants set how long spent fuel must be shielded.',
  });
  return choose(rng, q, `k = (ln 2)/${T}`, [`k = ${T}/(ln 2)`, `k = 1/${2 * T}`, 'k = 1/2']);
}
const DOUBLING: [number, number][] = [[0.07, 10], [0.035, 20], [0.14, 5], [0.1, 7], [0.05, 14], [0.02, 35]];
function doublingStep(rng: Rng): AskStep {
  const [k, T] = pick(rng, DOUBLING);
  const q = Q('growth', 'doubling', {
    prompt: `An algae culture grows by dP/dt = ${fmt(k)}P (per day). Using ln 2 ≈ 0.7, how many days to double?`,
    expression: `e^(${fmt(k)}T) = 2`, answer: T, unit: 'days',
    hint: 'Doubling time T solves e^(kT) = 2, so T = ln 2 / k.',
    steps: [`kT = ln 2, so T = ${lab(0.7, 'about ln two')} ÷ ${lab(fmt(k), 'growth rate per day')}.`, `T = ${lab(T, 'days to double')}.`],
    app: 'The rule of 70 sizes growth in bioreactors and bank accounts alike.',
  });
  return typed(q);
}
function growthModelStep(rng: Rng): AskStep {
  const decay = rng.next() < 0.5;
  const q = Q('growth', 'model', {
    prompt: decay ? 'A coolant contaminant breaks down at a rate proportional to the amount present. Which model fits?' : 'Algae in the bioreactor grow at a rate proportional to how much algae there is. Which model fits?',
    expression: decay ? 'rate of loss ∝ amount' : 'rate of growth ∝ amount', answer: 0,
    hint: '"Proportional to the amount" means the rate equals a constant times A itself.',
    steps: [decay ? 'Rate = −k × amount: dA/dt = −kA (k > 0).' : 'Rate = k × amount: dA/dt = kA (k > 0).', 'A constant rate (dA/dt = k) would be a straight line, not exponential.'],
    app: 'Writing the model is the engineer\'s first step; solving comes second.',
  });
  return decay ? choose(rng, q, 'dA/dt = −kA', ['dA/dt = −k', 'dA/dt = −kt', 'A = −kt']) : choose(rng, q, 'dA/dt = kA', ['dA/dt = k', 'dA/dt = kt', 'A = kt']);
}
function coolingStep(rng: Rng): AskStep {
  const Ta = pick(rng, [10, 15, 20, 25]); const D = pick(rng, [40, 64, 80, 120, 160]); const tau = pick(rng, [4, 5, 10]); const n = rint(rng, 1, 3);
  const T = Ta + D / 2 ** n;
  const q = Q('growth', 'cooling', {
    prompt: `A beam at ${Ta + D}°C cools in a ${Ta}°C hall. The gap to the hall's temperature halves every ${tau} min. What does it read after ${n * tau} min?`,
    expression: `dT/dt = −k(T − ${Ta})`, answer: T, unit: '°C',
    hint: 'Newton\'s law halves the gap T − room, not the temperature itself.',
    steps: [`Gap now: ${lab(Ta + D, 'beam temperature')} − ${lab(Ta, 'hall temperature')} = ${lab(D, 'gap in degrees')}.`, `${lab(n * tau, 'minutes')} is ${labn(n, 'halving')} of the gap: ${D} ÷ ${2 ** n} = ${lab(fmt(D / 2 ** n), 'gap in degrees')}.`, `T = ${lab(Ta, 'hall temperature')} + ${lab(fmt(D / 2 ** n), 'gap in degrees')} = ${lab(fmt(T), 'beam temperature')}.`],
    app: 'Heat-treating steel follows Newton\'s law of cooling.',
  });
  return typed(q);
}
function coolingLinearStep(rng: Rng): AskStep {
  const Ta = pick(rng, [20, 30]); const D = pick(rng, [80, 120, 160]); const T0 = Ta + D; const T1 = Ta + D / 2; const T2 = Ta + D / 4;
  const q = Q('growth', 'cooling-trap', {
    prompt: `Coolant falls from ${T0}° to ${T1}° in 10 minutes in a ${Ta}° room. What does it read after another 10 minutes?`,
    expression: `dT/dt = −k(T − ${Ta})`, answer: T2, unit: '°',
    hint: 'The cooling rate is proportional to the gap to room temperature, and the gap has shrunk.',
    steps: [`Gap: ${T0} − ${Ta} = ${lab(D, 'gap in degrees')}, then ${T1} − ${Ta} = ${lab(D / 2, 'gap in degrees')} after ${lab(10, 'minutes')}: it halves every 10 minutes.`, `Next gap: ${D / 2} ÷ 2 = ${lab(D / 4, 'gap in degrees')}, so the reading is ${lab(Ta, 'room in degrees')} + ${lab(D / 4, 'gap')} = ${lab(T2, 'degrees')}.`, `It does not drop another ${D / 2}°: cooling slows as it nears the room.`],
    app: 'Predicting cool-down time decides when a part can be handled.',
  });
  return choose(rng, q, String(T2), [String(Ta), fmt(T1 / 2)]);
}
function coolingSliderStep(rng: Rng): AskStep {
  const Ta = pick(rng, [10, 20, 30]); const D = pick(rng, [40, 60, 80]); const tau = pick(rng, [2, 4, 5, 10]); const n = rint(rng, 1, 3);
  const target = Ta + D / 2 ** n;
  const q = Q('growth', 'cooling-slider', {
    prompt: `The core casing cools from ${Ta + D}° in a ${Ta}° hall; the gap halves every ${tau} min. Slide to when it reads ${fmt(target)}°.`,
    expression: `T = ${Ta} + ${D}·(1/2)^(t/${tau})`, answer: n * tau, unit: 'min',
    hint: `How many halvings take the gap from ${D}° to ${fmt(D / 2 ** n)}°?`,
    steps: [`Gap needed: ${lab(fmt(target), 'target reading')} − ${lab(Ta, 'hall')} = ${lab(fmt(D / 2 ** n), 'gap in degrees')}, and ${lab(D, 'starting gap')} ÷ ${2 ** n} = ${fmt(D / 2 ** n)}.`, `That is ${labn(n, 'halving')}: t = ${n} × ${lab(tau, 'min per halving')} = ${lab(n * tau, 'minutes')}.`],
    app: 'Cool-down curves set the wait before a reactor hall is opened.',
  });
  return model(q, { kind: 'slider', min: 0, max: 4 * tau, step: tau / 2, label: 'Time (min)', unit: 'min', range: [0, 4 * tau, 0, Ta + D + 10], layers: { fns: [{ fn: { kind: 'exp', a: D, base: 0.5 ** (1 / tau), k: Ta } }], hlines: [{ y: Ta, label: 'hall' }] } }, [String(n * tau)], `Slide to the time when T = ${lab(`${fmt(target)}°`, 'target reading')}.`);
}
function halfLifePlotStep(rng: Rng): AskStep {
  const A = pick(rng, [16, 12]); const T = pick(rng, [1, 2]); const n = A === 12 ? rint(rng, 1, 2) : rint(rng, 1, 3);
  const t = n * T; const v = A / 2 ** n;
  const q = Q('growth', 'half-life-plot', {
    prompt: `${A} g of isotope, half-life ${T} ${T === 1 ? 'day' : 'days'}. Plot the amount on day ${t}.`,
    expression: `A(t) = ${A}·(1/2)^${T === 1 ? 't' : `(t/${T})`}`, answer: v, answerText: `(${t}, ${fmt(v)})`,
    hint: `Day ${t} is ${n} half-li${n === 1 ? 'fe' : 'ves'} after the start.`,
    steps: [`${lab(t, unit(t, 'day'))} ÷ ${lab(T, `${unit(T, 'day')} per half-life`)} = ${labn(n, 'half-life', 'half-lives')}.`, `${lab(A, 'g at start')} ÷ ${2 ** n} = ${lab(fmt(v), 'g left')}: the point (${t}, ${fmt(v)}).`],
    app: 'Decay curves are read like this on every radiation badge.',
  });
  return model(q, { kind: 'plot', range: [0, 8, 0, 16], count: 1, label: 'Tap the amount at that day', layers: { points: [{ x: 0, y: A, label: `${A} g` }] } }, [`${t},${v}`], `Tap (day ${t}, amount).`);
}
/** Newton's cooling on the grid: plot the gap T − T_hall, which halves in equal times. */
function coolingGapPlotStep(rng: Rng): AskStep {
  const Ta = pick(rng, [20, 25, 30]); const D = pick(rng, [16, 12]); const T = pick(rng, [1, 2]); const n = D === 12 ? rint(rng, 1, 2) : rint(rng, 1, 3);
  const t = n * T; const v = D / 2 ** n;
  const q = Q('growth', 'cooling-gap-plot', {
    prompt: `Brick's beam starts ${D}° above the ${Ta}° hall, and the gap halves every ${T} min. Plot the gap at minute ${t}.`,
    expression: `T − ${Ta} = ${D}·(1/2)^${T === 1 ? 't' : `(t/${T})`}`, answer: v, answerText: `(${t}, ${fmt(v)})`,
    hint: `Minute ${t} is ${n} halving${n === 1 ? '' : 's'} after the start. Halve the gap, not the temperature.`,
    steps: [`dT/dt = −k(T − ${Ta}): the gap decays exponentially.`, `${lab(t, unit(t, 'minute'))} ÷ ${lab(T, `${unit(T, 'minute')} per halving`)} = ${labn(n, 'halving')}.`, `${lab(D, 'starting gap')} ÷ ${2 ** n} = ${lab(fmt(v), 'gap in degrees')}: the point (${t}, ${fmt(v)}). The beam reads ${Ta} + ${fmt(v)} = ${lab(fmt(Ta + v), 'degrees')}.`],
    app: 'Foundry crews read cool-down charts like this before handling a casting.',
  });
  return model(q, { kind: 'plot', range: [0, 8, 0, 16], count: 1, label: 'Tap the gap at that minute', layers: { points: [{ x: 0, y: D, label: `${D}°` }], hlines: [{ y: 0, label: 'hall temperature' }] } }, [`${t},${v}`], `Tap (minute ${t}, gap).`);
}
function decayGraphStep(rng: Rng): AskStep {
  const Ta = pick(rng, [20, 30, 40]); const T0 = 90; const R: Range = [0, 10, 0, 100];
  const base = { hlines: [{ y: Ta, label: 'room' }] };
  const right = plotV(R, { ...base, fns: [{ fn: { kind: 'exp', a: T0 - Ta, base: Math.exp(-0.35), k: Ta } }] });
  const wrongs = [
    plotV(R, { ...base, fns: [{ fn: { kind: 'exp', a: T0, base: Math.exp(-0.35) } }] }),
    plotV(R, { ...base, fns: [{ fn: { kind: 'poly', c: [T0, -(T0 - Ta) / 6] } }] }),
    plotV(R, { ...base, fns: [{ fn: { kind: 'poly', c: [T0, 0, -(T0 - Ta) / 100] } }] }),
  ];
  return pickLettered(rng, 'Graph', right, wrongs, () => Q('growth', 'cooling-graph', {
    prompt: `A ${T0}° casting cools by Newton's law in a ${Ta}° room. Which graph is T(t)?`,
    expression: `dT/dt = −k(T − ${Ta})`, answer: 0,
    hint: 'Where is the cooling fastest? Where does it stop?',
    steps: [`The rate is proportional to T − ${Ta}: fastest at the start, slower as the gap closes.`, `It levels off at ${Ta}°, never below it and never at 0°.`],
    app: 'Matching a model to data is how engineers check their assumptions.',
  }));
}
/* transfer */
function dosageTransfer(rng: Rng): AskStep {
  const A = pick(rng, [320, 400, 800]); const T = pick(rng, [4, 6, 8]); const n = rint(rng, 2, 3); const v = A / 2 ** n;
  const q = Q('growth', 'dosage', {
    prompt: `A patient takes ${A} mg of a drug with a ${T}-hour half-life. How much remains after ${n * T} hours?`,
    expression: `${A}·(1/2)^(${n * T}/${T})`, answer: v, unit: 'mg',
    hint: 'Count half-lives, then halve that many times.',
    steps: [`${lab(n * T, 'hours')} ÷ ${lab(T, 'hours per half-life')} = ${labn(n, 'half-life', 'half-lives')}.`, `${lab(A, 'mg taken')} ÷ ${2 ** n} = ${lab(fmt(v), 'mg left')}.`],
    app: 'Biomedical engineers design dosing schedules from half-lives.',
  });
  return typed(q);
}
function carbonTransfer(rng: Rng): AskStep {
  const n = rint(rng, 2, 4); const age = 5730 * n;
  const q = Q('growth', 'carbon-dating', {
    prompt: `A timber from an old mine keeps 1/${2 ** n} of its carbon-14 (half-life 5730 years). How old is it?`,
    expression: `(1/2)ⁿ = 1/${2 ** n}`, answer: age, unit: 'years',
    hint: 'How many halvings turn 1 into 1/' + 2 ** n + '?',
    steps: [`${lab(`1/${2 ** n}`, 'fraction left')} = (1/2)${sup(String(n))}: ${labn(n, 'half-life', 'half-lives')}.`, `${labn(n, 'half-life', 'half-lives')} × ${lab(5730, 'years per half-life')} = ${lab(age, 'years old')}.`],
    app: 'Carbon dating is exponential decay read backwards.',
  });
  return typed(q);
}
function bacteriaTransfer(rng: Rng): AskStep {
  const N = pick(rng, [50, 100, 300]); const d = pick(rng, [20, 30]); const n = rint(rng, 2, 4); const v = N * 2 ** n;
  const q = Q('growth', 'bacteria', {
    prompt: `A bio-filter starts with ${N} bacteria that double every ${d} min (dN/dt = kN). How many after ${n * d} min?`,
    expression: `N = ${N}·2^(t/${d})`, answer: v,
    hint: 'Exponential growth multiplies by the same factor every equal time step.',
    steps: [`${lab(n * d, 'minutes')} ÷ ${lab(d, 'min per doubling')} = ${labn(n, 'doubling')}.`, `${lab(N, 'bacteria at start')} × 2${sup(String(n))} = ${N} × ${2 ** n} = ${lab(v, 'bacteria')}.`],
    app: 'Water-treatment engineers size filters by bacterial growth rates.',
  });
  return typed(q);
}

/* ============================================================================================
 * 6. First-order linear equations & mixing tanks
 * ========================================================================================== */
function standardFormStep(rng: Rng): AskStep {
  if (rng.next() < 0.6) {
    const a = pick(rng, [2, 3, 4, 5]); const p = rnz(rng, -3, 4); const b = a * p; const m = rnz(rng, -3, 3) * a;
    const q = Q('linear', 'standard-form', {
      prompt: 'Vector\'s controller law: put it in standard form y′ + p·y = q(t). What is p?',
      expression: `${a}y′ ${sg(b)}y = ${coefTerm(m, 't')}`, answer: p,
      hint: 'Standard form has a plain y′ with coefficient 1. Divide every term first.',
      steps: [`Divide everything by ${a}: ${sumStr([[1, 'y′'], [p, 'y']])} = ${coefTerm(m / a, 't')}.`, `So p = ${fmt(p)}.`],
      app: 'Standard form is the input format for the integrating-factor method.',
    });
    return choose(rng, q, fmt(p), [fmt(b), fmt(-p), fmt(a)]);
  }
  const n = rint(rng, 2, 3);
  const q = Q('linear', 'standard-form', {
    prompt: 'Vector\'s controller law: put it in standard form y′ + p(t)·y = q(t). What is p(t)?',
    expression: `t·y′ + ${n === 1 ? '' : n}y = t³`, answer: 0,
    hint: 'Divide every term by t.',
    steps: [`Divide by t: y′ + (${n}/t)y = t².`, `p(t) = ${n}/t.`],
    app: 'Standard form is the input format for the integrating-factor method.',
  });
  return choose(rng, q, `${n}/t`, [String(n), coefTerm(n, 't'), `t/${n}`]);
}
function integratingFactorStep(rng: Rng): AskStep {
  const kind = pick(rng, ['const', 'lin', 'recip'] as const);
  if (kind === 'const') {
    const k = pick(rng, [2, 3, 4, -2, -3]);
    const q = Q('linear', 'integrating-factor', {
      prompt: 'Vector\'s master key: which integrating factor μ(t) = e^(∫p dt) makes the left side one derivative?', expression: `y′ ${sg(k)}y = ${ex(1)}`, answer: 0,
      hint: `p = ${fmt(k)}. Integrate p first, then exponentiate.`,
      steps: [`∫${par(k)} dt = ${coefTerm(k, 't')}, so μ = ${ex(k)}.`, `Then (${ex(k)}·y)′ = ${ex(k)}·y′ ${sg(k)}${ex(k)}·y: exactly the left side times μ.`],
      app: 'The integrating factor is the key that unlocks every linear first-order model.',
    });
    return choose(rng, q, `μ = ${ex(k)}`, [`μ = ${ex(-k)}`, `μ = e${sup(fmt(k))}`, `μ = ${coefTerm(k, 't')}`]);
  }
  if (kind === 'lin') {
    const q = Q('linear', 'integrating-factor', {
      prompt: 'Vector\'s master key: which integrating factor μ(t) = e^(∫p dt) makes the left side one derivative?', expression: 'y′ + 2t·y = t', answer: 0,
      hint: 'p(t) = 2t. Integrate it before exponentiating.',
      steps: ['∫2t dt = t², so μ = e^(t²).', '(e^(t²)·y)′ = e^(t²)·y′ + 2t·e^(t²)·y: the left side times μ.'],
      app: 'The integrating factor is the key that unlocks every linear first-order model.',
    });
    return choose(rng, q, 'μ = e^(t²)', ['μ = e²ᵗ', 'μ = e^(−t²)', 'μ = t²']);
  }
  const n = rint(rng, 1, 3); const tn = n === 1 ? 't' : `t${sup(String(n))}`;
  const q = Q('linear', 'integrating-factor', {
    prompt: 'Vector\'s master key: which integrating factor μ(t) = e^(∫p dt) makes the left side one derivative?', expression: `y′ + (${n}/t)·y = 1`, answer: 0,
    hint: `Integrate ${n}/t first, then use e^(ln a) = a.`,
    steps: [`∫(${n}/t) dt = ${n === 1 ? '' : n}ln t, so μ = e^(${n === 1 ? '' : n}ln t) = ${tn}.`, `(${tn}·y)′ = ${tn}y′ + ${n === 1 ? '' : n}${n - 1 === 0 ? '' : n - 1 === 1 ? 't' : `t${sup(String(n - 1))}`}y: the left side times μ.`],
    app: 'The integrating factor is the key that unlocks every linear first-order model.',
  });
  return choose(rng, q, `μ = ${tn}`, [`μ = e^(${n}/t)`, `μ = t${sup(`−${n}`)}`, `μ = ${n === 1 ? '' : n}ln t`]);
}
function linParams(rng: Rng) { const k = rint(rng, 1, 3); const s = rint(rng, 1, 6); let y0 = rint(rng, -2, 8); if (y0 === s || y0 === 0) y0 = s + 2; return { k, s, b: k * s, y0 }; }
function expTerm(C: number, k: number) { return `${C < 0 ? '−' : '+'} ${Math.abs(C) === 1 ? '' : fmt(Math.abs(C))}${ex(k)}`; }
function steadyStateStep(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, 4, 5]); const s = rnz(rng, -4, 8); const b = a * s;
  const q = Q('linear', 'steady-state', {
    prompt: 'Vector\'s heater controller: in the long run y stops changing. Set y′ = 0 and balance for the steady state.',
    expression: `y′ + ${a}y = ${fmt(b)}`, answer: s, answerText: `y = ${fmt(s)}`,
    hint: 'With y′ = 0 the equation is just ' + `${a}y = ${fmt(b)}.`,
    steps: [`Steady state: y′ = 0, so ${a}y = ${fmt(b)}.`, `y = ${fmt(b)} ÷ ${a} = ${lab(fmt(s), 'steady state')}.`, 'The e^(−kt) part dies away and this is what is left.'],
    app: 'Steady state is the operating point a controller settles to.',
  });
  return model(q, { kind: 'balance', a, b: 0, c: 0, d: b, variable: 'y' }, [String(s)], `Balance ${a}y = ${fmt(b)}.`);
}
function linearSolveStep(rng: Rng): AskStep {
  const { k, s, b, y0 } = linParams(rng); const C = y0 - s;
  const right = `y = ${s} ${expTerm(C, -k)}`;
  const q = Q('linear', 'solve-linear', {
    prompt: `Vector's heater law: solve with the integrating factor ${ex(k)} and y(0) = ${fmt(y0)}.`,
    expression: `y′ + ${coefTerm(k, 'y')} = ${b}`, answer: 0,
    hint: `(${ex(k)}y)′ = ${b}${ex(k)}. Integrate, divide by ${ex(k)}, then use y(0).`,
    steps: [`${ex(k)}y = ${cex(s, k)} + C, so y = ${s} + C${ex(-k)}.`, `y(0) = ${s} + C = ${fmt(y0)} gives C = ${fmt(C)}.`, `${right}.`],
    app: 'This one formula covers heating, charging, filling and cooling.',
  });
  return choose(rng, q, right, [`y = ${s} ${expTerm(C, k)}`, `y = ${s} ${expTerm(y0, -k)}`, `y = ${cex(y0, -k)}`]);
}
function icTableStep(rng: Rng): AskStep {
  const { k, s, b, y0 } = linParams(rng);
  const q = Q('linear', 'ic-table', {
    prompt: `Vector's heater: every solution is y = y∞ + C${ex(-k)}. Fill in y∞ and the C that matches y(0) = ${fmt(y0)}.`,
    expression: `y′ + ${coefTerm(k, 'y')} = ${b}, y(0) = ${fmt(y0)}`, answer: y0 - s, answerText: `${s}, ${fmt(y0 - s)}`,
    hint: 'y∞ is the steady state (y′ = 0). At t = 0 the exponential is 1.',
    steps: [`y∞ = ${b} ÷ ${k} = ${s}.`, `y(0) = ${s} + C = ${fmt(y0)}, so C = ${fmt(y0 - s)}.`],
    app: 'Steady state plus a dying transient: the shape of every first-order response.',
  });
  return model(q, { kind: 'table', rowLabels: ['y∞', 'C'], rows: [[null], [null]], cols: ['value'] }, [`${s},${fmt(y0 - s)}`], 'Fill in y∞, then C.');
}
function linearLimitStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 4, 5]); const b = rnz(rng, -12, 20); const y0 = rint(rng, -3, 9); const v = b / k;
  const q = Q('linear', 'limit', {
    prompt: `Start at y(0) = ${fmt(y0)}. What value does y approach as t grows?`,
    expression: `y′ + ${k}y = ${fmt(b)}`, answer: v,
    hint: 'The transient Ce^(−kt) dies away whatever the start.',
    steps: [`y = ${fmt(v)} + C${ex(-k)} and ${ex(-k)} → 0.`, `So y → ${fmt(b)}/${k} = ${lab(fmt(v), 'steady state')}, whatever y(0) was.`],
    app: 'The starting value only matters for a while; the steady state is what the plant runs at.',
  });
  return typed(q);
}
const TANKS: [number, number][] = [[100, 2], [100, 5], [100, 4], [200, 4], [200, 5], [200, 10], [50, 5], [50, 2], [500, 5], [500, 10]];
function mixParams(rng: Rng) { const [V, r] = pick(rng, TANKS); const cin = pick(rng, [1, 2, 3, 0.5]); return { V, r, cin, inflow: r * cin, tau: V / r, eq: cin * V }; }
function mixingDEStep(rng: Rng): AskStep {
  const { V, r, cin, inflow, tau } = mixParams(rng);
  const right = `dQ/dt = ${fmt(inflow)} − Q/${tau}`;
  const q = Q('linear', 'mixing-model', {
    prompt: `Dr. Catalyst's ${V} L tank: brine at ${fmt(cin)} g/L flows in at ${r} L/min; the mixed liquid drains at ${r} L/min. Q is the salt (g). Which equation?`,
    expression: 'rate in − rate out', answer: 0,
    hint: 'Rate in = flow × incoming concentration. Rate out = flow × tank concentration, and tank concentration is Q/V.',
    steps: [`In: ${lab(r, 'flow in L/min')} × ${lab(fmt(cin), 'brine in g/L')} = ${lab(fmt(inflow), 'salt in, g/min')}.`, `Out: ${lab(r, 'flow in L/min')} × Q ÷ ${lab(V, 'tank in L')}, which is Q/${tau} g/min.`, `${right}.`],
    app: 'Every mixing, dilution and flushing problem is rate in minus rate out.',
  });
  return choose(rng, q, right, [`dQ/dt = ${fmt(inflow)} − ${r}Q`, `dQ/dt = ${fmt(cin)} − Q/${tau}`, `dQ/dt = ${fmt(inflow)} + Q/${tau}`]);
}
function mixingRateStep(rng: Rng): AskStep {
  const { V, r, cin, inflow, tau } = mixParams(rng); const m = rint(rng, 1, Math.max(2, Math.round(inflow * 2))); const Qn = tau * m; const rate = r4(inflow - m);
  const q = Q('linear', 'mixing-rate', {
    prompt: `Catalyst's ${V} L tank, ${r} L/min in at ${fmt(cin)} g/L, ${r} L/min out. Right now it holds ${Qn} g of salt. How fast is Q changing?`,
    expression: `dQ/dt = ${fmt(inflow)} − Q/${tau}`, answer: rate, unit: 'g/min',
    hint: 'Put the current Q into rate in − rate out. A negative answer means salt is leaving.',
    steps: [`Out: ${lab(r, 'L/min')} × ${lab(Qn, 'g of salt')} ÷ ${lab(V, 'L in tank')} = ${lab(m, 'g/min out')}.`, `In: ${lab(r, 'L/min')} × ${lab(fmt(cin), 'g/L')} = ${lab(fmt(inflow), 'g/min in')}.`, `dQ/dt = ${lab(fmt(inflow), 'in')} − ${lab(m, 'out')} = ${lab(fmt(rate), 'change in g/min')}.`],
    app: 'Flow engineers watch net rates to see where a tank is heading.',
  });
  return typed(q);
}
function mixingEqStep(rng: Rng): AskStep {
  const { V, r, cin, inflow, eq } = mixParams(rng); const d = r * cin * V;
  const q = Q('linear', 'mixing-equilibrium', {
    prompt: `Catalyst's ${V} L tank, brine at ${fmt(cin)} g/L in at ${r} L/min, ${r} L/min out. How much salt when it settles? (Multiply by V, then balance.)`,
    expression: `${fmt(inflow)} = ${r}·Q/${V}`, answer: eq, unit: 'g',
    hint: 'Settled means rate in = rate out. Multiply both sides by the volume first.',
    steps: [`Rate in = rate out: ${lab(fmt(inflow), 'salt in, g/min')} = ${r}Q/${V}.`, `Multiply by ${lab(V, 'tank in L')}: ${r}Q = ${fmt(d)}, so Q = ${lab(fmt(eq), 'salt in g')}.`, `That is ${lab(fmt(cin), 'g/L')} × ${lab(V, 'litres')}: the tank ends up at the incoming concentration.`],
    app: 'The flushed tank matches its feed: a check every process engineer makes.',
  });
  return model(q, { kind: 'balance', a: r, b: 0, c: 0, d, variable: 'Q' }, [String(eq)], `Balance ${r}Q = ${fmt(d)}.`);
}
function mixingEulerTable(rng: Rng): AskStep {
  const { V, r, cin, inflow, tau } = mixParams(rng); let m = rint(rng, 0, Math.max(1, Math.round(inflow * 2))); if (m === inflow) m += 1; const Q0 = tau * m;
  const s0 = r4(inflow - m); const Q1 = r4(Q0 + s0);
  const q = Q('linear', 'mixing-euler', {
    prompt: `Catalyst's ${V} L tank, ${r} L/min in at ${fmt(cin)} g/L, ${r} L/min out, ${Q0} g of salt now. Fill the rate, then one Euler minute.`,
    expression: `dQ/dt = ${fmt(inflow)} − Q/${tau}`, answer: Q1, answerText: `${fmt(s0)}, ${fmt(Q1)}`,
    hint: 'Rate = in − out at the current Q. Next Q = Q + 1 min × rate.',
    steps: [`Out: ${lab(r, 'L/min')} × ${lab(Q0, 'g now')} ÷ ${lab(V, 'L in tank')} = ${lab(m, 'g/min out')}.`, `Rate: ${lab(fmt(inflow), 'g/min in')} − ${lab(m, 'g/min out')} = ${lab(fmt(s0), 'g/min')}.`, `Q(1) ≈ ${lab(Q0, 'g now')} + ${lab(1, 'minute')} × ${lab(fmt(s0), 'g/min')} = ${lab(fmt(Q1), 'g after one minute')}.`],
    app: 'Plant simulators march tank contents forward minute by minute.',
  });
  return model(q, { kind: 'table', cols: ['t (min)', 'Q (g)', 'dQ/dt'], rows: [[0, Q0, null], [1, null, '—']] }, [`${fmt(s0)},${fmt(Q1)}`], 'Fill the rate at t = 0 (minutes), then Q at t = 1 (minute).');
}
function mixingGraphStep(rng: Rng): AskStep {
  const { V, r, cin, eq, tau } = mixParams(rng); const salty = rng.next() < 0.4; const Q0 = salty ? 2 * eq : 0;
  const top = Math.max(eq, Q0) * 1.3; const R: Range = [0, 5 * tau, 0, top];
  const mk = (f: (t: number) => number) => plotV(R, { segments: curve(f, 0, 5 * tau, 'teal', 50, top * 3) });
  const right = mk((t) => eq + (Q0 - eq) * Math.exp(-t / tau));
  const wrongs = [
    mk((t) => Q0 + (r * cin - Q0 / tau) * t),
    mk((t) => eq + (Q0 - eq) * Math.exp(-t / tau) * Math.cos((1.5 * t) / tau)),
    mk((t) => eq / 2 + (Q0 - eq / 2) * Math.exp(-t / tau)),
  ];
  return pickLettered(rng, 'Graph', right, wrongs, () => Q('linear', 'mixing-graph', {
    prompt: `Catalyst's ${V} L tank starts with ${salty ? `${Q0} g of salt` : 'fresh water'}; brine at ${fmt(cin)} g/L flows in and out at ${r} L/min. Which graph is Q(t)?`,
    expression: `dQ/dt = ${fmt(r * cin)} − Q/${tau}`, answer: 0,
    hint: 'Find where it settles (rate in = rate out). Can a first-order tank overshoot?',
    steps: [`It settles at ${lab(fmt(cin), 'g/L')} × ${lab(V, 'litres')} = ${lab(fmt(eq), 'g of salt')}.`, `It ${salty ? 'falls' : 'rises'} fastest at first, then levels off: no overshoot, no straight line.`],
    app: 'Flush-out curves tell operators when a tank is safe to use.',
  }));
}
/* transfer */
const TERMINAL: [number, number][] = [[80, 20], [2, 4], [5, 10], [60, 15], [10, 25], [90, 30]];
function terminalVelocityTransfer(rng: Rng): AskStep {
  const [m, b] = pick(rng, TERMINAL); const v = (10 * m) / b;
  const q = Q('linear', 'terminal-velocity', {
    prompt: `Newton's ${m} kg drop pod falls with ${m}·v′ = ${10 * m} − ${b}v. Balance for its terminal speed.`,
    expression: `${m}v′ = ${10 * m} − ${b}v`, answer: v, unit: 'm/s',
    hint: 'Terminal speed is the steady state: v′ = 0.',
    steps: [`v′ = 0 gives ${b}v = ${10 * m}: drag balances weight.`, `v = ${lab(10 * m, 'weight in N')} ÷ ${lab(b, 'drag coefficient')} = ${lab(fmt(v), 'terminal speed in m/s')}.`],
    app: 'Parachutes are sized from the terminal speed they allow.',
  });
  return model(q, { kind: 'balance', a: b, b: 0, c: 0, d: 10 * m, variable: 'v' }, [String(v)], `Balance ${b}v = ${10 * m}.`);
}
function rcChargeTransfer(rng: Rng): AskStep {
  const Vs = pick(rng, [8, 12, 16, 24]); const n = rint(rng, 1, 3); const T = pick(rng, [2, 3, 5]); const v = Vs - Vs / 2 ** n;
  const q = Q('linear', 'rc-charge', {
    prompt: `Volt charges a capacitor from 0 V toward ${Vs} V; the gap to ${Vs} V halves every ${T} ms. Voltage after ${n * T} ms?`,
    expression: `V′ = (${Vs} − V)/RC`, answer: v, unit: 'V',
    hint: 'The gap Vs − V is what decays, not V itself.',
    steps: [`${lab(n * T, 'ms')} ÷ ${lab(T, 'ms per halving')} = ${labn(n, 'halving')}.`, `Gap: ${lab(Vs, 'volts at start')} ÷ ${2 ** n} = ${lab(fmt(Vs / 2 ** n), 'volts of gap')}.`, `V = ${lab(Vs, 'target volts')} − ${lab(fmt(Vs / 2 ** n), 'gap')} = ${lab(fmt(v), 'volts')}.`],
    app: 'Camera flashes and pacemakers charge along this curve.',
  });
  return typed(q);
}
function lakeTransfer(rng: Rng): AskStep {
  const [V, r] = pick(rng, [[1000, 10], [2000, 20], [500, 5], [4000, 40]] as [number, number][]); const tau = V / r; const cin = pick(rng, [1, 2, 3]); const m = rint(rng, 1, 6); const Qn = tau * m;
  const rate = r * cin - m;
  const q = Q('linear', 'lake', {
    prompt: `A settling lake of ${V} m³ takes ${r} m³/day of runoff at ${cin} kg/m³ and drains ${r} m³/day. It holds ${Qn} kg of silt now. dQ/dt?`,
    expression: `dQ/dt = ${r * cin} − Q/${tau}`, answer: rate, unit: 'kg/day',
    hint: 'Rate in − rate out, with the outflow carrying the lake\'s current concentration.',
    steps: [`In: ${lab(r, 'm³/day')} × ${lab(cin, 'kg/m³')} = ${lab(r * cin, 'kg/day in')}.`, `Out: ${lab(r, 'm³/day')} × ${lab(Qn, 'kg of silt')} ÷ ${lab(V, 'm³ of lake')} = ${lab(m, 'kg/day out')}.`, `dQ/dt = ${lab(r * cin, 'in')} − ${lab(m, 'out')} = ${lab(fmt(rate), 'kg/day')}.`],
    app: 'Environmental engineers predict pollutant levels with the same tank model.',
  });
  return typed(q);
}

/* ============================================================================================
 * 7. The logistic equation
 * ========================================================================================== */
function logisticRateStep(rng: Rng): AskStep {
  const r = pick(rng, [0.1, 0.2, 0.4, 0.5]); const K = pick(rng, [100, 200, 500, 1000]); const P = (K / 10) * rint(rng, 1, 9);
  const v = r4(r * P * (1 - P / K));
  const q = Q('logistic', 'logistic-rate', {
    prompt: `Algae in the bio-reactor: r = ${fmt(r)} per day, capacity K = ${K}. How fast is the colony growing (per day) at P = ${P}?`,
    expression: `dP/dt = ${fmt(r)}P(1 − P/${K})`, answer: v, unit: 'per day',
    hint: 'Multiply r × P × (the fraction of room left, 1 − P/K).',
    steps: [`Room left: 1 − ${lab(P, 'population')}/${lab(K, 'capacity')} = ${lab(fmt(r4(1 - P / K)), 'room left')}.`, `dP/dt = ${lab(fmt(r), 'rate per day')} × ${lab(P, 'population')} × ${lab(fmt(r4(1 - P / K)), 'room left')} = ${lab(fmt(v), 'growth per day')}.`],
    app: 'Bio-process engineers run reactors near the fastest-growth point.',
  });
  return typed(q);
}
function logisticKBalance(rng: Rng): AskStep {
  const b = rint(rng, 2, 5); const K = rint(rng, 6, 30); const a = b * K;
  const q = Q('logistic', 'capacity', {
    prompt: 'Catalyst\'s culture stops growing at P = 0 and at one other population. Balance the bracket to 0 to find the carrying capacity.',
    expression: `dP/dt = 0.01P(${a} − ${b}P)`, answer: K,
    hint: `The rate is 0 when P = 0 or when ${a} − ${b}P = 0.`,
    steps: [`${a} − ${b}P = 0 → ${b}P = ${a}.`, `P = ${a} ÷ ${b} = ${K}: the carrying capacity K.`],
    app: 'Carrying capacity is the most a tank, habitat or market can hold.',
  });
  return model(q, { kind: 'balance', a: b, b: 0, c: 0, d: a, variable: 'P' }, [String(K)], `Balance ${b}P = ${a}.`);
}
function logisticEqLine(rng: Rng): AskStep {
  const b = pick(rng, [0.01, 0.02, 0.05]); const K = pick(rng, [10, 15, 20, 25, 30]); const a = r4(b * K);
  const q = Q('logistic', 'logistic-phase', {
    prompt: 'Catalyst\'s culture law. Factor out P to find both equilibria, then tap the stable one.',
    expression: `dP/dt = ${fmt(a)}P − ${fmt(b)}P²`, answer: K,
    hint: `dP/dt = P(${fmt(a)} − ${fmt(b)}P). Check the sign just above 0 and just above the other root.`,
    steps: [`P(${fmt(a)} − ${fmt(b)}P) = 0 at P = 0 and P = ${fmt(a)} ÷ ${fmt(b)} = ${lab(K, 'carrying capacity')}.`, `Between them dP/dt > 0, so P rises; above ${K} it is negative, so P falls.`, `Everything moves toward ${K}: it is stable. P = 0 is unstable.`],
    visual: { type: 'numline', min: -4, max: 36, points: [{ x: 0 }, { x: K }] },
    app: 'A stable capacity means a population recovers after a disturbance.',
  });
  return model(q, { kind: 'numberline', start: 0, min: -4, max: 36, label: 'Population P: tap the stable equilibrium' }, [String(K)], 'Tap the equilibrium populations move toward.');
}
function logisticTableStep(rng: Rng): AskStep {
  const [r, K] = pick(rng, [[0.4, 80], [0.4, 100], [0.2, 40], [0.8, 40], [0.5, 80]] as [number, number][]);
  const Ps = [K / 4, K / 2, (3 * K) / 4]; const vals = Ps.map((P) => r4(r * P * (1 - P / K)));
  const q = Q('logistic', 'logistic-table', {
    prompt: `Fill the growth rate at a quarter, half and three-quarters of capacity (r = ${fmt(r)}, K = ${K}).`,
    expression: `dP/dt = ${fmt(r)}P(1 − P/${K})`, answer: vals[1], answerText: vals.map(fmt).join(', '),
    hint: 'Room left is 3/4, 1/2 and 1/4 of the capacity in turn.',
    steps: Ps.map((P, i) => `P = ${P}: ${fmt(r)} × ${P} × ${lab(fmt(1 - P / K), 'room left')} = ${lab(fmt(vals[i]), 'growth rate')}.`).concat(['The rate peaks at P = K/2 and is symmetric about it.']),
    app: 'Harvesting at half capacity gives the largest sustainable yield.',
  });
  return model(q, { kind: 'table', cols: ['P', 'dP/dt'], rows: Ps.map((P) => [P, null]) }, [vals.map(fmt).join(',')], 'Fill dP/dt for each population.');
}
function inflectionStep(rng: Rng): AskStep {
  const K = pick(rng, [400, 600, 800, 1200]);
  const q = Q('logistic', 'fastest', {
    prompt: `A colony grows logistically toward K = ${K}. At what population is it growing fastest?`,
    expression: 'dP/dt = rP(1 − P/K)', answer: K / 2,
    hint: 'dP/dt is a parabola in P. Where is a parabola with roots 0 and K highest?',
    steps: [`dP/dt = 0 at P = 0 and P = ${K}; the parabola peaks halfway.`, `Fastest at P = ${K / 2}: the bend (inflection point) of the S-curve.`],
    app: 'Fisheries and bioreactors are held near K/2 for the biggest yield.',
  });
  return choose(rng, q, `P = ${K / 2}`, [`P = ${K}`, 'P near 0', `P = ${K / 4}`]);
}
function maxGrowthSlider(rng: Rng): AskStep {
  const K = pick(rng, [20, 40, 60, 80, 100]); const r = pick(rng, [0.4, 0.5, 1]); const peak = (r * K) / 4;
  const q = Q('logistic', 'max-growth', {
    prompt: `The graph is dP/dt against P for the culture (K = ${K}). Slide P to where growth is fastest.`,
    expression: `dP/dt = ${r === 1 ? '' : fmt(r)}P(1 − P/${K})`, answer: K / 2,
    hint: 'The top of this parabola sits halfway between its two zeros.',
    steps: [`Zeros at P = 0 and P = ${K}.`, `Peak at P = ${K / 2}, where dP/dt = ${fmt(peak)}.`],
    app: 'The peak of this curve is the maximum sustainable harvest.',
  });
  return model(q, { kind: 'slider', min: 0, max: K, step: K / 20, label: 'Population P', range: [0, K, 0, r4(peak * 1.3)], layers: { fns: [{ fn: { kind: 'poly', c: [0, r, -r / K] } }] } }, [String(K / 2)], 'Slide to the P with the highest growth rate.');
}
function logisticCurveStep(rng: Rng): AskStep {
  const K = 10; const r = 1; const high = rng.next() < 0.35; const P0 = high ? 13 : pick(rng, [1, 2]);
  const R: Range = [0, 10, 0, 15];
  const mk = (f: (t: number) => number) => plotV(R, { hlines: [{ y: K, label: `K = ${K}` }], segments: curve(f, 0, 10, 'teal', 50, 40) });
  const logistic = (t: number) => K / (1 + ((K - P0) / P0) * Math.exp(-r * t));
  const wrongs = [
    mk((t) => P0 * Math.exp(0.5 * t)),
    mk((t) => K + (P0 - K) * Math.exp(-0.35 * t) * Math.cos(1.2 * t)),
    high ? mk((t) => P0 + 0.6 * t * t) : mk((t) => P0 * Math.exp(-0.5 * t)),
  ];
  return pickLettered(rng, 'Graph', mk(logistic), wrongs, () => Q('logistic', 'logistic-curve', {
    prompt: `Algae start at P(0) = ${P0} with capacity K = ${K}. Which graph is P(t)?`,
    expression: `dP/dt = P(1 − P/${K})`, answer: 0,
    hint: high ? 'Above K the rate is negative. Can the curve cross K?' : 'Small P: nearly exponential. Near K: growth slows to zero. Can the curve cross K?',
    steps: [high ? `Above K, dP/dt < 0: P falls toward ${K} and levels off.` : `Early on it grows almost exponentially; the brakes come on as P nears ${K}: an S-curve.`, `P = ${K} is an equilibrium, so the curve never crosses it and never oscillates.`],
    app: 'Logistic curves model market adoption, epidemics and reactor cultures.',
  }));
}
/* transfer */
function rumorTransfer(rng: Rng): AskStep {
  const [k, N] = pick(rng, [[0.001, 400], [0.0005, 1000], [0.001, 1000], [0.0002, 2000]] as [number, number][]); const I = (N / 10) * rint(rng, 1, 9);
  const v = r4(k * I * (N - I));
  const q = Q('logistic', 'rumor', {
    prompt: `A software patch spreads through ${N} robots: dI/dt = ${fmt(k)}·I·(${N} − I), with t in hours. How fast is it spreading when I = ${I}?`,
    expression: `${fmt(k)}·${I}·${N - I}`, answer: v, unit: 'robots/h',
    hint: 'Spreading needs both the patched (I) and the unpatched (N − I).',
    steps: [`Unpatched: ${lab(N, 'robots')} − ${lab(I, 'patched')} = ${lab(N - I, 'unpatched')}.`, `dI/dt = ${lab(fmt(k), 'spread constant')} × ${lab(I, 'patched')} × ${lab(N - I, 'unpatched')} = ${lab(fmt(v), 'robots per hour')}.`],
    app: 'Network engineers model updates and viruses with the logistic law.',
  });
  return typed(q);
}
function harvestTransfer(rng: Rng): AskStep {
  const r = pick(rng, [0.4, 0.5, 0.8]); const K = pick(rng, [400, 1000, 2000]); const H = (r * K) / 4;
  const q = Q('logistic', 'harvest', {
    prompt: `A fish farm grows by dP/dt = ${fmt(r)}P(1 − P/${K}) per year. What is the largest yearly catch it can sustain?`,
    expression: `max of ${fmt(r)}P(1 − P/${K})`, answer: H, unit: 'fish/year',
    hint: 'A catch is sustainable if it is no more than the growth rate. Where is growth largest?',
    steps: [`Growth is largest at P = K/2 = ${lab(K / 2, 'fish')}.`, `There dP/dt = ${lab(fmt(r), 'rate per year')} × ${lab(K / 2, 'fish')} × ${lab('1/2', 'room left')} = ${lab(fmt(H), 'fish per year')}.`],
    app: 'Maximum sustainable yield sets fishing and forestry quotas.',
  });
  return typed(q);
}
function epidemicTransfer(rng: Rng): AskStep {
  const N = pick(rng, [2000, 5000, 10000]);
  const q = Q('logistic', 'epidemic', {
    prompt: `A flu spreads logistically through a town of ${N}. At what number infected are new cases arriving fastest?`,
    expression: `dI/dt = kI(${N} − I)`, answer: N / 2,
    hint: 'The rate is a parabola in I with zeros at 0 and N.',
    steps: [`dI/dt = 0 at I = 0 and I = ${lab(N, 'whole town')}.`, `Peak halfway: I = ${lab(N / 2, 'infected')}.`],
    app: 'Hospitals plan capacity for the peak of the infection rate.',
  });
  return choose(rng, q, String(N / 2), [String(N), String(N / 4), '1']);
}

/* ============================================================================================
 * 8. Second-order equations with constant coefficients
 * ========================================================================================== */
const odeStr = (a: number, b: number, c: number, y = 'y') => `${sumStr([[a, `${y}″`], [b, `${y}′`], [c, y]])} = 0`;
const charStr = (a: number, b: number, c: number) => `${sumStr([[a, 'r²'], [b, 'r'], [c, '']])} = 0`;
function distinctRoots(rng: Rng, nonzero = false): [number, number] {
  let r1 = rint(rng, -5, 4); let r2 = rint(rng, r1 + 1, 5); let g = 0;
  while (nonzero && (r1 === 0 || r2 === 0 || r1 + r2 === 0) && g++ < 40) { r1 = rint(rng, -5, 4); r2 = rint(rng, r1 + 1, 5); }
  if (nonzero && (r1 === 0 || r2 === 0 || r1 + r2 === 0)) { r1 = -3; r2 = 1; }
  return [r1, r2];
}
const ce = (C: string, r: number) => (r === 0 ? C : `${C}${ex(r)}`);
function charEqStep(rng: Rng): AskStep {
  const [r1, r2] = distinctRoots(rng, true); const a = pick(rng, [1, 1, 2]); const b = -a * (r1 + r2); const c = a * r1 * r2;
  const q = Q('second', 'char-eq', {
    prompt: 'Vector\'s column law: try y = eʳᵗ. Which characteristic equation do you get?',
    expression: odeStr(a, b, c), answer: 0,
    hint: 'y = eʳᵗ turns y″ into r²eʳᵗ, y′ into reʳᵗ and y into eʳᵗ. Divide out eʳᵗ.',
    steps: [`Substitute: (${charStr(a, b, c).replace(' = 0', '')})eʳᵗ = 0.`, `eʳᵗ is never 0, so ${charStr(a, b, c)}.`, 'y itself becomes the constant term, not a missing term.'],
    app: 'The characteristic equation turns a differential equation into algebra.',
  });
  return choose(rng, q, charStr(a, b, c), [charStr(a, -b, c), charStr(c, b, a), `${sumStr([[a, 'r²'], [b, 'r']])} = 0`]);
}
function rootsTableStep(rng: Rng): AskStep {
  const [r1, r2] = distinctRoots(rng); const b = -(r1 + r2); const c = r1 * r2;
  const q = Q('second', 'roots', {
    prompt: 'Ada\'s pump shaft: find both roots of its characteristic equation, smaller first.',
    expression: odeStr(1, b, c), answer: r1, answerText: `${fmt(r1)}, ${fmt(r2)}`,
    hint: `Characteristic equation ${charStr(1, b, c)}. Find two numbers with sum ${fmt(-b)} and product ${fmt(c)}.`,
    steps: [`${charStr(1, b, c)} factors as ${factored('r', r1, r2)} = 0.`, `r = ${fmt(r1)} and r = ${fmt(r2)}, so y = ${ce('C₁', r1)} + ${ce('C₂', r2)}.`],
    app: 'The roots are the natural rates of the system.',
  });
  return model(q, { kind: 'table', rowLabels: ['r₁ (smaller)', 'r₂ (larger)'], cols: ['root'], rows: [[null], [null]] }, [`${r1},${r2}`], 'Fill in both roots.');
}
function rootsNumberlineStep(rng: Rng): AskStep {
  const k = rnz(rng, -6, 6);
  const q = Q('second', 'repeated-root', {
    prompt: 'Newton\'s column law has one repeated characteristic root. Tap it.',
    expression: odeStr(1, -2 * k, k * k), answer: k,
    hint: `r² ${sg(-2 * k)}r + ${k * k} is a perfect square.`,
    steps: [`${charStr(1, -2 * k, k * k)} is (${shifted('r', k)})² = 0.`, `r = ${fmt(k)} twice, so y = (C₁ + C₂t)${ex(k)}.`],
    app: 'A repeated root is the boundary case engineers call critical damping.',
  });
  return model(q, { kind: 'numberline', start: 0, min: -8, max: 8, label: 'Tap the repeated root' }, [String(k)], 'Tap the root r.');
}
const RT_REAL = 'Two distinct real roots'; const RT_REP = 'One repeated real root'; const RT_CX = 'A complex pair α ± βi';
function rootTypeStep(rng: Rng): AskStep {
  const kind = pick(rng, ['real', 'rep', 'cx'] as const); let b = 0; let c = 0;
  if (kind === 'real') { const [r1, r2] = distinctRoots(rng); b = -(r1 + r2); c = r1 * r2; }
  else if (kind === 'rep') { const k = rnz(rng, -5, 5); b = -2 * k; c = k * k; }
  else { const al = rint(rng, -3, 3); const be = rint(rng, 1, 4); b = -2 * al; c = al * al + be * be; }
  const D = b * b - 4 * c;
  const q = Q('second', 'root-type', {
    prompt: 'Ada\'s shaft law. Without solving: what kind of roots does its characteristic equation have?',
    expression: odeStr(1, b, c), answer: D,
    hint: 'Look at the discriminant b² − 4ac of r² + br + c.',
    steps: [`b² − 4ac = ${b * b} − ${par(4 * c)} = ${lab(fmt(D), 'discriminant')}.`, D > 0 ? 'Positive: two distinct real roots.' : D === 0 ? 'Zero: one repeated root.' : 'Negative: a complex pair, which means oscillation.'],
    app: 'The sign of one number tells you whether a structure will vibrate.',
  });
  return choose(rng, q, kind === 'real' ? RT_REAL : kind === 'rep' ? RT_REP : RT_CX, [RT_REAL, RT_REP, RT_CX]);
}
const iPart = (be: number) => (be === 1 ? 'i' : `${be}i`);
const rootsText = (al: number, be: number) => (al === 0 ? `r = ±${iPart(be)}` : `r = ${fmt(al)} ± ${iPart(be)}`);
const trig = (f: 'cos' | 'sin', be: number) => `${f} ${be === 1 ? '' : be}t`;
const oscText = (al: number, be: number) => (al === 0 ? `C₁${trig('cos', be)} + C₂${trig('sin', be)}` : `${ex(al)}(C₁${trig('cos', be)} + C₂${trig('sin', be)})`);
function generalSolStep(rng: Rng): AskStep {
  const kind = pick(rng, ['real', 'rep', 'cx'] as const);
  const mkq_ = (expr: string, steps: string[]) => Q('second', 'general-solution', {
    prompt: 'Vector reads out a column law\'s characteristic roots. Which is the general solution?', expression: expr, answer: 0,
    hint: 'Real roots give exponentials; a repeated root needs an extra t; complex roots give e^(αt) times cos and sin of βt.',
    steps, app: 'The form of the solution tells you the behaviour before any numbers go in.',
  });
  if (kind === 'real') {
    const [r1, r2] = distinctRoots(rng, true);
    const right = `y = ${ce('C₁', r1)} + ${ce('C₂', r2)}`;
    return choose(rng, mkq_(`r = ${fmt(r1)}, r = ${fmt(r2)}`, [`Each root r gives a solution eʳᵗ; add them with two constants: ${right}.`]), right, [`y = ${ce('C₁', -r1)} + ${ce('C₂', -r2)}`, `y = (C₁ + C₂t)${ex(r1)}`, `y = C${ex(r1 + r2)}`]);
  }
  if (kind === 'rep') {
    const k = rnz(rng, -4, 4); const right = `y = (C₁ + C₂t)${ex(k)}`;
    return choose(rng, mkq_(`r = ${fmt(k)} (repeated)`, [`One root gives only one exponential, ${ex(k)}; the second solution is t${ex(k)}.`, `${right}.`, `C₁${ex(k)} + C₂${ex(k)} is really one constant times ${ex(k)}: not general.`]), right, [`y = C₁${ex(k)} + C₂${ex(k)}`, `y = C₁${ex(k)} + C₂${ex(-k)}`, `y = (C₁ + C₂t)${ex(-k)}`]);
  }
  const al = rint(rng, -3, 2); const be = rint(rng, 1, 4); const right = `y = ${oscText(al, be)}`;
  const wrongs = [al !== 0 ? `y = ${oscText(-al, be)}` : '', be > 1 ? `y = ${oscText(al, be * be)}` : '', `y = ${ce('C₁', al + be)} + ${ce('C₂', al - be)}`, `y = (C₁ + C₂t)${ex(al === 0 ? be : al)}`].filter(Boolean);
  return choose(rng, mkq_(rootsText(al, be), [`α ± βi with α = ${fmt(al)}, β = ${be}: ${right}.`, 'α sets growth or decay; β sets the frequency of the wave.']), right, wrongs);
}
function complexTableStep(rng: Rng): AskStep {
  const al = rint(rng, -3, 3); const be = rint(rng, 1, 4); const b = -2 * al; const c = al * al + be * be; const D = b * b - 4 * c;
  const q = Q('second', 'complex-roots', {
    prompt: 'The shaft rings, so its roots are α ± βi. Fill in α and β.',
    expression: odeStr(1, b, c), answer: be, answerText: `${fmt(al)}, ${be}`,
    hint: 'r = (−b ± √(b² − 4c))/2. The square root of a negative number gives the i part.',
    steps: [`b² − 4c = ${b * b} − ${4 * c} = ${lab(fmt(D), 'discriminant')}; √(${fmt(D)}) = ${2 * be}i.`, `r = (${fmt(-b)} ± ${2 * be}i)/2 = ${fmt(al)} ± ${iPart(be)}: α = ${fmt(al)}, β = ${be}.`, `y = ${oscText(al, be)}.`],
    app: 'β is the ringing frequency; α says whether the ringing dies or grows.',
  });
  return model(q, { kind: 'table', rowLabels: ['α (real part)', 'β (imaginary part)'], cols: ['value'], rows: [[null], [null]] }, [`${al},${be}`], 'Fill in α, then β.');
}
function ivpSecondTable(rng: Rng): AskStep {
  const [r1, r2] = distinctRoots(rng); const C1 = rnz(rng, -3, 3); const C2 = rnz(rng, -3, 3);
  const y0 = C1 + C2; const v0 = r1 * C1 + r2 * C2;
  const q = Q('second', 'ivp-second', {
    prompt: `Ada's shaft: y = ${ce('C₁', r1)} + ${ce('C₂', r2)}. Use y(0) = ${fmt(y0)} and y′(0) = ${fmt(v0)} to fill C₁ and C₂.`,
    expression: `C₁ + C₂ = ${fmt(y0)}; ${sumStr([[r1, 'C₁'], [r2, 'C₂']])} = ${fmt(v0)}`, answer: C1, answerText: `${fmt(C1)}, ${fmt(C2)}`,
    hint: 'At t = 0 every exponential is 1. Differentiate first for the second equation.',
    steps: [`y(0): C₁ + C₂ = ${fmt(y0)}. y′(0): ${sumStr([[r1, 'C₁'], [r2, 'C₂']])} = ${fmt(v0)}.`, `Solve: C₁ = ${fmt(C1)}, C₂ = ${fmt(C2)}.`],
    app: 'A second-order system needs two measurements: where it starts and how fast.',
  });
  return model(q, { kind: 'table', rowLabels: ['C₁', 'C₂'], cols: ['value'], rows: [[null], [null]] }, [`${C1},${C2}`], 'Fill in C₁ and C₂.');
}
function charRootTyped(rng: Rng): AskStep {
  const [r1, r2] = distinctRoots(rng); const b = -(r1 + r2); const c = r1 * r2;
  const q = Q('second', 'larger-root', {
    prompt: 'Vector: y = eʳᵗ solves this column law for two values of r. What is the larger one?',
    expression: odeStr(1, b, c), answer: r2,
    hint: `Solve ${charStr(1, b, c)}.`,
    steps: [`${charStr(1, b, c)} → ${factored('r', r1, r2)} = 0.`, `r = ${fmt(r1)} or ${fmt(r2)}; the larger is ${fmt(r2)}.`],
    app: 'The larger root dominates the long-run behaviour.',
  });
  return typed(q);
}
/** The roots as a build: tap where the characteristic parabola p(r) = r² + br + c meets the axis. */
function charParabolaStep(rng: Rng): AskStep {
  const [r1, r2] = distinctRoots(rng); const b = -(r1 + r2); const c = r1 * r2; const rc = r1 !== 0 ? r1 : r2;
  const q = Q('second', 'char-parabola', {
    prompt: `Ada's pump shaft obeys this law. The curve is its characteristic polynomial p(r) = ${charStr(1, b, c).replace(' = 0', '')}. Tap both roots.`,
    expression: odeStr(1, b, c), answer: r1, answerText: `r = ${fmt(r1)} and r = ${fmt(r2)}`,
    hint: 'y = eʳᵗ solves the law exactly when p(r) = 0: where the parabola meets the axis. Check each by substituting.',
    steps: [`p(r) = ${factored('r', r1, r2)}, which is zero at r = ${fmt(r1)} and r = ${fmt(r2)}.`, `Check: p(${fmt(rc)}) = ${sumStr([[rc * rc, ''], [b * rc, ''], [c, '']])} = 0.`, `So y = ${ce('C₁', r1)} + ${ce('C₂', r2)}.`],
    app: 'The roots are the natural rates of the system; a plot of p(r) shows them at a glance.',
  });
  return model(q, { kind: 'plot', range: [-6, 6, -8, 8], count: 2, label: 'Tap both zeros of p(r) on the axis', layers: { fns: [{ fn: { kind: 'poly', c: [c, b, 1] }, label: 'p(r)' }] } }, undefined, 'Tap both points where p(r) = 0.', { rule: { kind: 'set', items: [`${r1},0`, `${r2},0`] } });
}
/** Which characteristic parabola belongs to a system that oscillates? The one with no real zeros. */
function oscParabolaPick(rng: Rng): AskStep {
  const R: Range = [-6, 6, -4, 8];
  const par2 = (b: number, c: number) => plotV(R, { fns: [{ fn: { kind: 'poly', c: [c, b, 1] } }], hlines: [{ y: 0 }] });
  const al = pick(rng, [-2, -1, 1]); const be = pick(rng, [1, 2]);
  const right = par2(-2 * al, al * al + be * be);
  const k = pick(rng, [-3, -2, 2, 3].filter((x) => x !== al));
  const p1 = rint(rng, -4, 0); const g1 = rint(rng, 2, 4); const p2 = rint(rng, -2, 1); let g2 = rint(rng, 1, 3); if (p1 === p2 && g1 === g2) g2 = 1;
  const wrongs = [par2(-2 * k, k * k), par2(-(2 * p1 + g1), p1 * (p1 + g1)), par2(-(2 * p2 + g2), p2 * (p2 + g2))];
  return pickLettered(rng, 'Curve', right, wrongs, () => Q('second', 'osc-parabola', {
    prompt: 'Four drive shafts, four characteristic polynomials p(r). Which shaft rings (oscillates) after a knock?',
    expression: 'p(r) = r² + br + c', answer: 0,
    hint: 'Real roots are where p(r) crosses the axis. Oscillation needs complex roots.',
    steps: [`Complex roots α ± βi mean p(r) = 0 has no real solution: the parabola never meets the axis (here α = ${fmt(al)}, β = ${be}).`, 'Crossing twice: two real roots, no ringing. Touching once: a repeated root, critical damping.', 'A negative discriminant is exactly a parabola that stays above the axis.'],
    app: 'Engineers read "will it ring?" from the sign of b² − 4c.',
  }));
}
/** Unit-start response x(0) = 1, x′(0) = 0 of m x″ + c x′ + k x = 0. */
function spring(m: number, c: number, k: number): (t: number) => number {
  const D = c * c - 4 * m * k;
  if (Math.abs(D) < 1e-9) { const r = -c / (2 * m); return (t) => (1 - r * t) * Math.exp(r * t); }
  if (D < 0) { const al = -c / (2 * m); const be = Math.sqrt(-D) / (2 * m); return (t) => Math.exp(al * t) * (Math.cos(be * t) - (al / be) * Math.sin(be * t)); }
  const r1 = (-c - Math.sqrt(D)) / (2 * m); const r2 = (-c + Math.sqrt(D)) / (2 * m);
  return (t) => (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}
function whichGraphSecond(rng: Rng): AskStep {
  const R: Range = [0, 8, -3, 3];
  const shapes = { decay: plotV(R, { segments: curve(spring(1, 0.8, 4), 0, 8, 'teal', 64) }), pure: plotV(R, { segments: curve(spring(1, 0, 4), 0, 8, 'teal', 64) }), grow: plotV(R, { segments: curve(spring(1, -0.3, 4), 0, 8, 'teal', 64, 3.5) }), over: plotV(R, { segments: curve(spring(1, 5, 4), 0, 8, 'teal', 64) }) };
  const kind = pick(rng, ['decay', 'pure', 'grow', 'over'] as const);
  const be = rint(rng, 1, 4); const al = kind === 'decay' ? -rint(rng, 1, 2) : kind === 'grow' ? rint(rng, 1, 2) : 0;
  const [r1, r2] = kind === 'over' ? [-rint(rng, 3, 5), -rint(rng, 1, 2)] : [0, 0];
  const expr = kind === 'over' ? `r = ${fmt(r1)}, r = ${fmt(r2)}` : rootsText(al, be);
  const why = kind === 'over' ? 'Both roots real and negative: two decaying exponentials, no wiggle.' : kind === 'pure' ? 'Purely imaginary roots: cos and sin forever at the same size.' : kind === 'decay' ? 'Complex with α < 0: a wave inside a shrinking envelope.' : 'Complex with α > 0: a wave inside a growing envelope. Unstable!';
  return pickLettered(rng, 'Trace', shapes[kind], (Object.keys(shapes) as (keyof typeof shapes)[]).filter((k) => k !== kind).map((k) => shapes[k]), () => Q('second', 'root-graph', {
    prompt: 'Ada logged the pump shaft\'s vibration. Which trace matches these characteristic roots?',
    expression: expr, answer: 0,
    hint: 'Real roots: no oscillation. Imaginary part: oscillation. Sign of the real part: grow or decay.',
    steps: [why],
    app: 'Engineers read stability straight off the roots.',
  }));
}
/* transfer */
function buildingSwayTransfer(rng: Rng): AskStep {
  const kind = pick(rng, ['over', 'under'] as const);
  // a real tower is damped: both roots negative (b > 0, c > 0)
  const r1 = -rint(rng, 3, 5); const r2 = -rint(rng, 1, 2); const al = -rint(rng, 1, 2); const be = rint(rng, 2, 5);
  const b = kind === 'over' ? -(r1 + r2) : -2 * al; const c = kind === 'over' ? r1 * r2 : al * al + be * be;
  const right = kind === 'over' ? RT_REAL : RT_CX;
  const q = Q('second', 'sway', {
    prompt: 'A tower\'s sway x(t) after a gust obeys this equation. What kind of characteristic roots does it have?',
    expression: odeStr(1, b, c, 'x'), answer: b * b - 4 * c,
    hint: 'Compute b² − 4c for r² + br + c.',
    steps: [`b² − 4c = ${b * b} − ${par(4 * c)} = ${lab(fmt(b * b - 4 * c), 'discriminant')}.`, kind === 'over' ? `Positive: two real roots (${fmt(r1)} and ${fmt(r2)}, both negative), so it creeps back with no oscillation.` : 'Negative: complex roots, so the tower sways back and forth as it settles.'],
    app: 'Structural engineers check this before adding dampers to a skyscraper.',
  });
  return choose(rng, q, right, [RT_REAL, RT_REP, RT_CX]);
}
function shaftTransfer(rng: Rng): AskStep {
  const al = -rint(rng, 1, 3); const be = rint(rng, 2, 6); const b = -2 * al; const c = al * al + be * be;
  const q = Q('second', 'shaft', {
    prompt: 'A drive shaft twists by θ″ + bθ′ + cθ = 0. How many radians per second does it ring at (β)?',
    expression: odeStr(1, b, c, 'θ'), answer: be, unit: 'rad/s',
    hint: 'Solve r² + br + c = 0; the ringing frequency is the imaginary part.',
    steps: [`r = (${fmt(-b)} ± √(${fmt(b * b - 4 * c)}))/2 = ${fmt(al)} ± ${be}i.`, `β = ${lab(be, 'ringing rate in rad/s')}.`],
    app: 'Shafts must never be driven near their ringing frequency.',
  });
  return typed(q);
}

/* ============================================================================================
 * 9. Springs & circuits: damping
 * ========================================================================================== */
const D_UNDER = 'Underdamped: it oscillates as it dies out';
const D_CRIT = 'Critically damped: fastest return, no overshoot';
const D_OVER = 'Overdamped: slow return, no overshoot';
const D_NONE = 'Undamped: it oscillates forever';
function naturalFreqStep(rng: Rng): AskStep {
  const m = pick(rng, [1, 2, 4, 5]); const w = rint(rng, 2, 6); const k = m * w * w;
  const q = Q('oscillators', 'natural-frequency', {
    prompt: `Newton's column: a ${m} kg mass on a spring with k = ${k} N/m. What is its natural frequency ω₀?`,
    expression: `${m === 1 ? '' : m}x″ + ${k}x = 0`, answer: w, unit: 'rad/s',
    hint: 'Divide by m: x″ + (k/m)x = 0, and ω₀² = k/m.',
    steps: [`k/m = ${lab(k, 'spring constant in N/m')} ÷ ${lab(m, 'mass in kg')} = ${w * w}.`, `ω₀ = √${w * w} = ${lab(w, 'natural frequency in rad/s')}.`, 'Stiffer spring: faster; heavier mass: slower.'],
    app: 'Every machine mount is designed around its natural frequency.',
  });
  return typed(q);
}
function dampParams(rng: Rng) {
  const m = pick(rng, [1, 2]); const w = rint(rng, 2, 4); const k = m * w * w; const crit = 2 * m * w;
  const kind = pick(rng, ['under', 'crit', 'over'] as const);
  const c = kind === 'under' ? rint(rng, 1, crit - 1) : kind === 'crit' ? crit : crit + rint(rng, 1, 6);
  return { m, k, c, crit, kind };
}
function dampingTypeStep(rng: Rng): AskStep {
  const { m, k, c, kind } = dampParams(rng); const D = c * c - 4 * m * k;
  const right = kind === 'under' ? D_UNDER : kind === 'crit' ? D_CRIT : D_OVER;
  const q = Q('oscillators', 'damping-type', {
    prompt: `The column's mass m = ${m} kg, damper c = ${c} N·s/m, spring k = ${k} N/m. How does it return after a push?`,
    expression: `${sumStr([[m, 'x″'], [c, 'x′'], [k, 'x']])} = 0`, answer: D,
    hint: 'Compare c² with 4mk: that is the discriminant of mr² + cr + k.',
    steps: [`c = ${lab(c, 'damper')}, so c² = ${c * c}; 4mk = 4 × ${lab(m, 'mass in kg')} × ${lab(k, 'spring constant')} = ${4 * m * k}.`, `c² − 4mk = ${c * c} − ${4 * m * k} = ${lab(fmt(D), 'discriminant')}.`, D < 0 ? 'Negative: complex roots, so it oscillates while decaying.' : D === 0 ? 'Zero: repeated root, the fastest return with no overshoot.' : 'Positive: two negative real roots, a slow creep back.'],
    app: 'Door closers are tuned near critical damping; guitar strings are underdamped.',
  });
  return choose(rng, q, right, [D_UNDER, D_CRIT, D_OVER, D_NONE]);
}
function criticalSlider(rng: Rng): AskStep {
  const m = pick(rng, [1, 2]); const w = rint(rng, 2, 4); const k = m * w * w; const crit = 2 * m * w; const top = Math.round(crit * 1.5);
  const q = Q('oscillators', 'critical-c', {
    prompt: `Newton's column: m = ${m} kg, k = ${k} N/m. The curve is the discriminant c² − 4mk. Slide the damper c to critical damping.`,
    expression: `c² − ${4 * m * k} = 0`, answer: crit, unit: 'N·s/m',
    hint: 'Critical damping is where the discriminant is exactly zero.',
    steps: [`c² = 4mk = 4 × ${lab(m, 'mass in kg')} × ${lab(k, 'spring constant')} = ${4 * m * k}.`, `c = √${4 * m * k} = ${lab(crit, 'critical damper in Ns/m')}: that is 2√(mk).`, 'Less than this: overshoot and ringing. More: sluggish.'],
    app: 'Suspension and instrument needles are tuned to critical damping.',
  });
  return model(q, { kind: 'slider', min: 0, max: top, step: 1, label: 'Damping c (N·s/m)', unit: 'N·s/m', range: [0, top, -4 * m * k, top * top - 4 * m * k], layers: { fns: [{ fn: { kind: 'poly', c: [-4 * m * k, 0, 1] } }] } }, [String(crit)], 'Slide c to where the discriminant is zero.');
}
/** The "more damping is always faster" trap: critical damping settles fastest without overshoot. */
function fastestDamperStep(rng: Rng): AskStep {
  const w = rint(rng, 2, 5); const k = w * w; const crit = 2 * w; const slow = Math.round(w * (4 - Math.sqrt(15)) * 100) / 100;
  const q = Q('oscillators', 'fastest-damper', {
    prompt: `Newton's column: m = 1 kg, spring k = ${k} N/m. Which damper brings it to rest fastest with no overshoot?`,
    expression: `x″ + cx′ + ${k}x = 0`, answer: crit,
    hint: 'Too little damping overshoots. Too much makes one root of r² + cr + k tiny, so that part dies very slowly.',
    steps: [`No overshoot needs c² ≥ 4k = 4 × ${lab(k, 'spring constant')} = ${4 * k}, so c ≥ ${lab(crit, 'critical damper')}. c = ${w} is underdamped: it overshoots.`, `At c = ${crit} (critical) the root is −${w} twice, so the motion dies off at rate ${w}.`, `At c = ${8 * w} the slow root is about −${fmt(slow)}: it creeps back about ${Math.round(w / slow)} times more slowly. More damping is not faster.`],
    app: 'Door closers and instrument needles are tuned to critical damping, not to the stiffest damper.',
  });
  return choose(rng, q, `c = ${crit} N·s/m`, [`c = ${8 * w} N·s/m`, `c = ${4 * w} N·s/m`, `c = ${w} N·s/m`]);
}
function springRootsTable(rng: Rng): AskStep {
  const p = rint(rng, 1, 4); const qq = rint(rng, p + 1, 6);
  const q = Q('oscillators', 'spring-roots', {
    prompt: `A 1 kg mass, damper c = ${p + qq} N·s/m, spring k = ${p * qq} N/m. Fill both roots of r² + cr + k = 0.`,
    expression: `x″ + ${p + qq}x′ + ${p * qq}x = 0`, answer: -qq, answerText: `${fmt(-qq)}, ${fmt(-p)}`,
    hint: `Two numbers with sum ${fmt(-(p + qq))} and product ${p * qq}.`,
    steps: [`r² + ${p + qq}r + ${p * qq} = (r + ${qq})(r + ${p}).`, `r = ${fmt(-qq)} and ${fmt(-p)}: both real and negative, so it is overdamped.`, `x = C₁${ex(-qq)} + C₂${ex(-p)}.`],
    app: 'Heavily damped mounts isolate delicate instruments.',
  });
  return model(q, { kind: 'table', rowLabels: ['r₁ (smaller)', 'r₂ (larger)'], cols: ['root'], rows: [[null], [null]] }, [`${-qq},${-p}`], 'Fill both roots, smaller first.');
}
function dampingGraphStep(rng: Rng, circuit = false): AskStep {
  const R: Range = [0, 8, -1.2, 1.2];
  const cs = { none: 0, under: 1, crit: 4, over: 10 } as const;
  const kind = pick(rng, ['none', 'under', 'crit', 'over'] as const);
  const vis = (c: number) => plotV(R, { segments: curve(spring(1, c, 4), 0, 8, 'teal', 64) });
  const why = { none: 'c = 0: nothing removes energy, so it oscillates forever.', under: 'c² = 1 < 4mk = 16: underdamped, a wave dying inside an envelope.', crit: 'c² = 16 = 4mk: critical, the fastest return without crossing zero.', over: 'c² = 100 > 16: overdamped, a slow creep back with no crossing.' }[kind];
  return pickLettered(rng, 'Trace', vis(cs[kind]), (Object.keys(cs) as (keyof typeof cs)[]).filter((k) => k !== kind).map((k) => vis(cs[k])), () => Q('oscillators', circuit ? 'rlc-graph' : 'damping-graph', {
    prompt: circuit ? `Volt's circuit: L = 1 H, R = ${cs[kind]} Ω, C = 0.25 F, charged and released. Which trace is the charge q(t)?` : `A 1 kg mass on a k = 4 N/m spring with damper c = ${cs[kind]} is pulled out and let go. Which trace is x(t)?`,
    expression: `${sumStr([[1, circuit ? 'q″' : 'x″'], [cs[kind], circuit ? 'q′' : 'x′'], [4, circuit ? 'q' : 'x']])} = 0`, answer: cs[kind],
    hint: 'Compare c² with 4mk = 16 (for a circuit: R² with 4L/C = 16).',
    steps: [circuit ? why.replace(/c = /, 'R = ').replace(/c² /g, 'R² ').replace('4mk', '4L/C') : why],
    app: 'Oscilloscope traces like these tell a technician how a system is tuned.',
  }));
}
const RLC_C = [[0.25, 4], [0.04, 10], [0.01, 20]] as const;
function rlcTypeStep(rng: Rng): AskStep {
  const [C, crit] = pick(rng, RLC_C); const kind = pick(rng, ['under', 'crit', 'over'] as const);
  const R = kind === 'crit' ? crit : kind === 'under' ? pick(rng, [crit / 4, crit / 2]) : crit * pick(rng, [1.5, 2]);
  const D = r4(R * R - 4 / C);
  const q = Q('oscillators', 'rlc-type', {
    prompt: `Volt's loop: L = 1 H, R = ${fmt(R)} Ω, C = ${fmt(C)} F. After the switch closes, how does the charge settle?`,
    expression: `${sumStr([[1, 'q″'], [R, 'q′'], [r4(1 / C), 'q']])} = 0`, answer: D,
    hint: 'Same maths as a spring: L ↔ m, R ↔ c, 1/C ↔ k. Compare R² with 4L/C.',
    steps: [`R² = ${fmt(R * R)}; 4L/C = 4 × ${lab(1, 'L in H')} ÷ ${lab(fmt(C), 'C in F')} = ${fmt(4 / C)}.`, `R² − 4L/C = ${fmt(R * R)} − ${fmt(4 / C)} = ${lab(fmt(D), 'discriminant')}.`, D < 0 ? 'Negative: underdamped, the current rings.' : D === 0 ? 'Zero: critically damped.' : 'Positive: overdamped, no ringing.'],
    app: 'Radio tuners want ringing; power supplies want none.',
  });
  return choose(rng, q, kind === 'under' ? D_UNDER : kind === 'crit' ? D_CRIT : D_OVER, [D_UNDER, D_CRIT, D_OVER, D_NONE]);
}
const LC_PAIRS: [number, number, number][] = [[1, 0.25, 2], [1, 0.04, 5], [1, 0.01, 10], [0.5, 0.02, 10], [2, 0.125, 2], [0.5, 0.08, 5], [2, 0.02, 5], [0.5, 0.5, 2], [1, 0.0625, 4], [0.5, 0.125, 4]];
function rlcFreqStep(rng: Rng): AskStep {
  const [L, C, w] = pick(rng, LC_PAIRS);
  const q = Q('oscillators', 'lc-frequency', {
    prompt: `An LC tank: L = ${fmt(L)} H, C = ${fmt(C)} F. What is its natural frequency ω₀ = 1/√(LC)?`,
    expression: `${L === 1 ? '' : fmt(L)}q″ + q/${fmt(C)} = 0`, answer: w, unit: 'rad/s',
    hint: 'Multiply L by C first, then take the square root, then flip it.',
    steps: [`LC = ${lab(fmt(L), 'L in H')} × ${lab(fmt(C), 'C in F')} = ${fmt(r4(L * C))}.`, `√${fmt(r4(L * C))} = ${fmt(1 / w)}, so ω₀ = 1/${fmt(1 / w)} = ${lab(w, 'natural frequency in rad/s')}.`],
    app: 'Every radio and wireless charger is tuned with ω₀ = 1/√(LC).',
  });
  return typed(q);
}
function rlcRootsTable(rng: Rng): AskStep {
  const p = rint(rng, 1, 3); const qq = rint(rng, p + 1, 5);
  const q = Q('oscillators', 'rlc-roots', {
    prompt: `Volt's snubber loop: L = 1 H, R = ${p + qq} Ω, C = ${fracStr(1, p * qq)} F. Fill both roots of r² + Rr + 1/C = 0.`,
    expression: `q″ + ${p + qq}q′ + ${p * qq}q = 0`, answer: -qq, answerText: `${fmt(-qq)}, ${fmt(-p)}`,
    hint: `1/C = ${p * qq}. Find two numbers with sum ${fmt(-(p + qq))} and product ${p * qq}.`,
    steps: [`r² + ${p + qq}r + ${p * qq} = (r + ${qq})(r + ${p}).`, `r = ${fmt(-qq)} and ${fmt(-p)}: overdamped, the charge dies away without ringing.`],
    app: 'Snubber circuits are overdamped on purpose.',
  });
  return model(q, { kind: 'table', rowLabels: ['r₁ (smaller)', 'r₂ (larger)'], cols: ['root'], rows: [[null], [null]] }, [`${-qq},${-p}`], 'Fill both roots, smaller first.');
}
function rlcCriticalSlider(rng: Rng): AskStep {
  const [C, crit] = pick(rng, RLC_C); const top = Math.round(crit * 1.5); const K4 = 4 / C;
  const q = Q('oscillators', 'rlc-critical', {
    prompt: `Volt's meter loop: L = 1 H, C = ${fmt(C)} F. The curve is R² − 4L/C. Slide the resistor to critical damping.`,
    expression: `R² − ${fmt(K4)} = 0`, answer: crit, unit: 'Ω',
    hint: 'Critical damping: R² = 4L/C exactly.',
    steps: [`4L/C = 4 × ${lab(1, 'L in H')} ÷ ${lab(fmt(C), 'C in F')} = ${fmt(K4)}.`, `R = √${fmt(K4)} = ${lab(crit, 'critical resistance in ohms')}.`],
    app: 'Choosing R for critical damping stops a meter needle from bouncing.',
  });
  return model(q, { kind: 'slider', min: 0, max: top, step: 1, label: 'Resistance R (Ω)', unit: 'Ω', range: [0, top, -K4, top * top - K4], layers: { fns: [{ fn: { kind: 'poly', c: [-K4, 0, 1] } }] } }, [String(crit)], 'Slide R to where the curve crosses zero.');
}
/** Tune an LC loop: slide the inductance until ω₀ = 1/√(LC) hits the target. */
/* L = 1/(Cω²) spans 0.25–4 H; the slider runs 0–5 H so no answer sits on the starting value or an end stop. */
const LC_TUNE: [number, number][] = [[0.01, 10], [0.01, 5], [0.01, 20], [0.04, 5], [0.04, 10], [0.0625, 4], [0.0625, 2], [0.25, 2], [0.25, 1], [0.02, 10], [0.02, 5], [0.1, 2]];
function rlcTuneSlider(rng: Rng): AskStep {
  const [C, w] = pick(rng, LC_TUNE); const L = r4(1 / (C * w * w)); const top = 5; const wMax = r4(1 / Math.sqrt(C * 0.25));
  const q = Q('oscillators', 'lc-tune', {
    prompt: `Volt's loop has C = ${fmt(C)} F and must ring at ω₀ = ${w} rad/s. The curve is ω₀ = 1/√(LC). Slide the inductance L to tune it.`,
    expression: `1/√(L·${fmt(C)}) = ${w}`, answer: L, unit: 'H',
    hint: 'Square both sides: LC = 1/ω₀². Then divide by C.',
    steps: [`1/√(LC) = ${lab(w, 'target in rad/s')} means LC = 1/${w}² = ${fracStr(1, w * w)}.`, `L = ${fracStr(1, w * w)} ÷ ${lab(fmt(C), 'C in F')} = ${lab(fmt(L), 'inductance in H')}.`, 'More inductance (or capacitance) means a slower ring.'],
    app: 'Radio tuners and wireless chargers are tuned by sliding L or C to hit one frequency.',
  });
  return model(q, { kind: 'slider', min: 0, max: top, step: 0.25, label: 'Inductance L (H)', unit: 'H', range: [0, top, 0, r4(wMax * 1.1)], layers: { segments: curve((x) => 1 / Math.sqrt(C * x), 0.25, top, 'teal', 60, wMax * 1.2), hlines: [{ y: w, label: `target ${w} rad/s` }] } }, [String(L)], `Slide L until the curve reaches ${lab(w, 'radians per second')}.`);
}

/* transfer */
const CARS: [number, number, number][] = [[400, 40000, 8000], [100, 10000, 2000], [200, 20000, 4000]];
function suspensionTransfer(rng: Rng): AskStep {
  const [m, k, crit] = pick(rng, CARS); const kind = pick(rng, ['under', 'crit', 'over'] as const);
  const c = kind === 'under' ? crit / 2 : kind === 'crit' ? crit : crit * 1.5;
  const D = c * c - 4 * m * k;
  const q = Q('oscillators', 'suspension', {
    prompt: `A buggy corner: m = ${m} kg, spring k = ${k} N/m, shock absorber c = ${c} N·s/m. How does it ride over a bump?`,
    expression: `${m}x″ + ${c}x′ + ${k}x = 0`, answer: D,
    hint: 'Compare c² with 4mk.',
    steps: [`Critical damping: 2√(mk) = 2√(${lab(m, 'mass in kg')} × ${lab(k, 'spring in N/m')}) = ${lab(crit, 'critical damping')}, and c = ${lab(c, 'shock setting')}.`, D < 0 ? 'c is below critical (c² < 4mk): underdamped, it bounces a few times.' : D === 0 ? 'c is exactly critical: critically damped.' : 'c is above critical (c² > 4mk): overdamped, a stiff slow ride.'],
    app: 'Car makers tune shocks slightly under critical for comfort.',
  });
  return choose(rng, q, kind === 'under' ? D_UNDER : kind === 'crit' ? D_CRIT : D_OVER, [D_UNDER, D_CRIT, D_OVER, D_NONE]);
}
function lcRadioTransfer(rng: Rng): AskStep {
  const [L, C, w] = pick(rng, [[0.01, 0.0001, 1000], [0.04, 0.0001, 500], [0.01, 0.0004, 500], [0.25, 0.0004, 100]] as [number, number, number][]);
  const q = Q('oscillators', 'radio', {
    prompt: `A crystal radio's tuner: L = ${fmt(L)} H, C = ${fmt(C)} F. Which ω₀ = 1/√(LC) does it pick up?`,
    expression: 'ω₀ = 1/√(LC)', answer: w, unit: 'rad/s',
    hint: 'Multiply, square-root, flip.',
    steps: [`LC = ${lab(fmt(L), 'L in H')} × ${lab(fmt(C), 'C in F')} = ${L * C < 1e-4 ? `${Math.round((L * C) * 1e6)} × 10⁻⁶` : fmt(L * C)}.`, `√(LC) = ${fmt(1 / w)}, so ω₀ = 1/${fmt(1 / w)} = ${lab(w, 'tuned frequency in rad/s')}.`],
    app: 'Tuning a radio is sliding the resonance of an LC circuit.',
  });
  return typed(q);
}
function towerFreqTransfer(rng: Rng): AskStep {
  const m = pick(rng, [1000, 4000, 500]); const w = rint(rng, 2, 5); const k = m * w * w;
  const q = Q('oscillators', 'tower', {
    prompt: `A rooftop water tank (${m} kg) sits on mounts of total stiffness ${k} N/m. Its natural frequency ω₀?`,
    expression: `${m}x″ + ${k}x = 0`, answer: w, unit: 'rad/s',
    hint: 'ω₀ = √(k/m).',
    steps: [`k/m = ${lab(k, 'stiffness in N/m')} ÷ ${lab(m, 'mass in kg')} = ${w * w}.`, `ω₀ = √${w * w} = ${lab(w, 'natural frequency in rad/s')}.`],
    app: 'Tuned-mass dampers in skyscrapers are sized from ω₀.',
  });
  return typed(q);
}

/* ============================================================================================
 * 10. Forcing & resonance (undetermined coefficients)
 * ========================================================================================== */
const lhs2 = (b: number, c: number, y = 'y') => sumStr([[1, `${y}″`], [b, `${y}′`], [c, y]]);
type FormKind = 'const' | 'lin' | 'exp' | 'cos' | 'res-cos' | 'res-exp';
function guessFormStep(rng: Rng, kinds: readonly FormKind[] = ['const', 'lin', 'exp', 'cos', 'res-cos', 'res-exp']): AskStep {
  const kind = pick(rng, kinds);
  const mk = (expr: string, steps: string[]) => Q('forced', 'trial-form', {
    prompt: 'Vector\'s motor drives the feed piston. Which trial form for the particular solution yₚ should you try?', expression: expr, answer: 0,
    hint: 'Copy the shape of the forcing term, include every piece its derivatives make, and multiply by t if that shape already solves the unforced equation.',
    steps, app: 'Undetermined coefficients: guess the shape, let the equation fix the numbers.',
  });
  if (kind === 'const') {
    const b = rint(rng, 1, 4); const c = rint(rng, 1, 6); const F = rint(rng, 2, 12);
    return choose(rng, mk(`${lhs2(b, c)} = ${F}`, ['A constant forcing gets a constant guess: yₚ = A.', `Then ${c}A = ${F}.`]), 'yₚ = A', ['yₚ = At', `yₚ = A${ex(1)}`, 'yₚ = At²']);
  }
  if (kind === 'lin') {
    const b = rint(rng, 1, 4); const c = rint(rng, 1, 6); const m = rint(rng, 2, 6); const n = rint(rng, 1, 5);
    return choose(rng, mk(`${lhs2(b, c)} = ${m}t + ${n}`, ['A degree-1 polynomial needs a full degree-1 guess: yₚ = At + B.', 'At alone cannot produce the constant terms its derivative makes.']), 'yₚ = At + B', ['yₚ = At', 'yₚ = A', 'yₚ = At²']);
  }
  if (kind === 'exp') {
    const k = pick(rng, [2, 3, -3]); const b = rint(rng, 1, 3); const c = rint(rng, 1, 4);
    return choose(rng, mk(`${lhs2(b, c)} = 5${ex(k)}`, [`Derivatives of ${ex(k)} are multiples of ${ex(k)}, so yₚ = A${ex(k)}.`, `${fmt(k)} is not a root of ${charStr(1, b, c).replace(' = 0', '')}, so no extra t is needed.`]), `yₚ = A${ex(k)}`, [`yₚ = At${ex(k)}`, `yₚ = A${ex(1)}`, 'yₚ = A']);
  }
  if (kind === 'cos') {
    const w = rint(rng, 2, 4); const b = rint(rng, 1, 3); const c = pick(rng, [1, 2, 3].filter((x) => x !== w * w));
    return choose(rng, mk(`${lhs2(b, c)} = cos ${w}t`, [`The y′ term turns cos ${w}t into sin ${w}t, so the guess needs both: yₚ = A cos ${w}t + B sin ${w}t.`]), `yₚ = A cos ${w}t + B sin ${w}t`, [`yₚ = A cos ${w}t`, 'yₚ = A cos t + B sin t', `yₚ = At cos ${w}t`]);
  }
  if (kind === 'res-cos') {
    const w = rint(rng, 2, 4);
    return choose(rng, mk(`y″ + ${w * w}y = cos ${w}t`, [`cos ${w}t and sin ${w}t already solve y″ + ${w * w}y = 0, so plugging them in gives 0.`, `Multiply by t: yₚ = t(A cos ${w}t + B sin ${w}t). This is resonance.`]), `yₚ = t(A cos ${w}t + B sin ${w}t)`, [`yₚ = A cos ${w}t + B sin ${w}t`, `yₚ = A cos ${w}t`, `yₚ = At² cos ${w}t`]);
  }
  const k = pick(rng, [1, 2, -1]); const r2 = pick(rng, [3, -2, 4].filter((x) => x !== k)); const b = -(k + r2); const c = k * r2;
  return choose(rng, mk(`${lhs2(b, c)} = ${ex(k)}`, [`r = ${fmt(k)} is a root of ${charStr(1, b, c).replace(' = 0', '')}, so ${ex(k)} already solves the unforced equation.`, `Multiply by t: yₚ = At${ex(k)}.`]), `yₚ = At${ex(k)}`, [`yₚ = A${ex(k)}`, `yₚ = At²${ex(k)}`, 'yₚ = At']);
}
/** Only the cases that carry the chapter's misconception: the missing sin ωt and the missing t. */
const guessResonantFormStep = (rng: Rng) => guessFormStep(rng, ['cos', 'res-cos', 'res-exp']);
function constantForcingBalance(rng: Rng): AskStep {
  const b = rint(rng, 0, 4); const c = rint(rng, 2, 6); const A = rnz(rng, -4, 6); const F = c * A;
  const q = Q('forced', 'constant-forcing', {
    prompt: 'A steady load sits on Newton\'s spring. Try yₚ = A: its derivatives are 0, so only the y term survives. Balance for A.',
    expression: `${lhs2(b, c)} = ${fmt(F)}`, answer: A, answerText: `yₚ = ${fmt(A)}`,
    hint: `With y = A: y″ = 0 and y′ = 0, leaving ${c}A = ${fmt(F)}.`,
    steps: [`${c}A = ${fmt(F)}.`, `A = ${fmt(A)}, so yₚ = ${fmt(A)}: the new resting position under a steady load.`],
    app: 'A steady load shifts where a spring rests: that shift is yₚ.',
  });
  return model(q, { kind: 'balance', a: c, b: 0, c: 0, d: F, variable: 'A' }, [String(A)], `Balance ${c}A = ${fmt(F)}.`);
}
function expForcingBalance(rng: Rng): AskStep {
  let k = 1; let b = 0; let c = 1; let p = 0; let g = 0;
  do { k = pick(rng, [1, 2, -1, 3]); b = rint(rng, -2, 3); c = rint(rng, -3, 5); p = k * k + b * k + c; } while ((Math.abs(p) < 2 || Math.abs(p) > 12 || c === 0 || b === 0) && g++ < 60);
  if (Math.abs(p) < 2 || c === 0 || b === 0) { k = 2; b = 1; c = 2; p = 8; }
  const A = rnz(rng, -3, 3); const M = p * A; const E = ex(k);
  const q = Q('forced', 'exp-forcing', {
    prompt: `A heater ramps Vector's piston with ${cex(M, k)}. Try yₚ = A${E}: each term of the law is a multiple of A${E}. Fill the multiples, then A.`,
    expression: `${lhs2(b, c)} = ${cex(M, k)}`, answer: A, answerText: `${fmt(k * k)}, ${fmt(b * k)}, ${fmt(c)}, A = ${fmt(A)}`,
    hint: `yₚ′ = ${coefTerm(k, 'A')}${E} and yₚ″ = ${coefTerm(k * k, 'A')}${E}. Multiply by each coefficient of the law.`,
    steps: [`y″ gives ${fmt(k * k)}, ${coefTerm(b, 'y′')} gives ${fmt(b)}·${par(k)} = ${fmt(b * k)}, ${coefTerm(c, 'y')} gives ${fmt(c)}.`, `Together (${sumStr([[k * k, ''], [b * k, ''], [c, '']])})A${E} = ${coefTerm(p, 'A')}${E} = ${cex(M, k)}.`, `So A = ${fmt(M)} ÷ ${par(p)} = ${fmt(A)}: yₚ = ${cex(A, k)}.`],
    app: 'Exponential inputs (a ramping heater, a discharging source) give exponential responses.',
  });
  return model(q, { kind: 'table', cols: [`multiple of A${E}`], rowLabels: ['from y″', `from ${coefTerm(b, 'y′')}`, `from ${coefTerm(c, 'y')}`, 'A'], rows: [[null], [null], [null], [null]] }, [`${k * k},${b * k},${c},${A}`], `Fill what each term contributes, then A.`);
}
function linearForcingTable(rng: Rng): AskStep {
  const b = rint(rng, -3, 3); const c = rint(rng, 1, 4); const A = rnz(rng, -3, 3); const B = rint(rng, -3, 3);
  const p = c * A; const qq = b * A + c * B;
  const q = Q('forced', 'poly-forcing', {
    prompt: 'Newton loads the walkway with a steady ramp. Try yₚ = At + B, match the t terms, then the constants. Fill A and B.',
    expression: `${lhs2(b, c)} = ${sumStr([[p, 't'], [qq, '']])}`, answer: A, answerText: `${fmt(A)}, ${fmt(B)}`,
    hint: `yₚ′ = A, yₚ″ = 0. So ${b === 0 ? '' : `${coefTerm(b, 'A')} + `}${c === 1 ? '' : c}(At + B) must equal ${sumStr([[p, 't'], [qq, '']])}.`,
    steps: [`t terms: ${coefTerm(c, 'A')} = ${fmt(p)}${c === 1 ? '' : `, so A = ${fmt(A)}`}.`, `Constants: ${b === 0 ? '' : `${coefTerm(b, 'A')} + `}${coefTerm(c, 'B')} = ${fmt(qq)}${b === 0 ? '' : `, so ${coefTerm(c, 'B')} = ${fmt(qq - b * A)}`}${c === 1 ? '' : `, B = ${fmt(B)}`}.`, `yₚ = ${sumStr([[A, 't'], [B, '']])}.`],
    app: 'A steadily ramping load gives a steadily ramping response.',
  });
  return model(q, { kind: 'table', rowLabels: ['A', 'B'], cols: ['value'], rows: [[null], [null]] }, [`${A},${B}`], 'Fill in A, then B.');
}
function cosForcingTyped(rng: Rng): AskStep {
  const w = rint(rng, 1, 3); const d = pick(rng, [-3, -2, -1, 1, 2, 3, 4, 5].filter((x) => w * w + x > 0)); const c = w * w + d; const A = rnz(rng, -4, 5); const F = d * A;
  const q = Q('forced', 'cos-forcing', {
    prompt: `Newton drives an undamped deck. With no damping, yₚ = A cos ${w === 1 ? '' : w}t works. Find A.`,
    expression: `y″ + ${c === 1 ? '' : c}y = ${F === 1 ? '' : F === -1 ? '−' : `${fmt(F)} `}cos ${w === 1 ? '' : w}t`, answer: A,
    hint: `yₚ″ = ${coefTerm(-w * w, 'A')} cos ${w === 1 ? '' : w}t. Substitute into the law and collect the cos terms.`,
    steps: [`(−${w * w} + ${c})A = ${fmt(F)}, so ${coefTerm(d, 'A')} = ${fmt(F)}.`, ...(d === 1 ? [] : [`A = ${fmt(F)} ÷ ${par(d)} = ${fmt(A)}.`]), `The closer ${w * w} gets to ${c}, the bigger A: that is resonance approaching.`],
    app: 'The amplitude of a driven structure depends on how close the drive is to its natural frequency.',
  });
  return typed(q);
}
function resonanceStep(rng: Rng): AskStep {
  const w = rint(rng, 2, 6); const N = w * w;
  const q = Q('forced', 'resonance', {
    prompt: `Newton shakes a bridge model: y″ + ${N}y = cos(ωt). Which drive frequency ω makes the swings grow without bound?`,
    expression: `y″ + ${N}y = cos(ωt)`, answer: w,
    hint: 'Resonance happens when the drive matches the natural frequency ω₀ = √(k/m).',
    steps: [`Natural frequency ω₀ = √${N} = ${w}.`, `Driving at ω = ${w} gives yₚ = t·(…): amplitude grows like t.`],
    app: 'Soldiers break step on bridges so they never drive at resonance.',
  });
  return choose(rng, q, `ω = ${w}`, [`ω = ${N}`, `ω = ${fmt(N / 2)}`, `ω = ${2 * w}`, `ω = ${2 * N}`, `ω = ${fmt(w / 2)}`]);
}
function resonanceSlider(rng: Rng): AskStep {
  const w0 = rint(rng, 2, 5); const c = 0.5; const top = 2 * w0 + 2; const k = w0 * w0;
  // amplitude as a multiple of the static stretch 1/k: k/√((k − ω²)² + c²ω²), peak ≈ w0/c
  const amp = (w: number) => k / Math.sqrt((k - w * w) ** 2 + c * c * w * w); const peak = r4(amp(Math.sqrt(k - (c * c) / 2)));
  const q = Q('forced', 'resonance-curve', {
    prompt: `Newton's walkway model: 1 kg on a k = ${k} N/m spring, lightly damped. The curve is its swing amplitude (in static stretches). Slide the drive to resonance.`,
    expression: `x″ + ${fmt(c)}x′ + ${k}x = cos(ωt)`, answer: w0, unit: 'rad/s',
    hint: 'For light damping the peak sits at the natural frequency ω₀ = √(k/m).',
    steps: [`ω₀ = √(${lab(k, 'spring constant')} ÷ ${lab(1, 'mass in kg')}) = ${lab(w0, 'natural frequency in rad/s')}.`, `For light damping the peak sits at (almost exactly) ω₀: the true peak is at √(ω₀² − c²/2) ≈ ${fmt(Math.round(Math.sqrt(k - (c * c) / 2) * 100) / 100)}.`, `There the swing is about ${fmt(Math.round(peak * 10) / 10)} times the static stretch: tall and sharp, but finite.`],
    app: 'Engineers keep operating speeds away from this peak.',
  });
  const yTop = Math.ceil(peak * 1.15);
  return model(q, { kind: 'slider', min: 0, max: top, step: 0.5, label: 'Drive frequency ω (rad/s)', unit: 'rad/s', range: [0, top, 0, yTop], layers: { segments: curve(amp, 0, top, 'teal', 160, yTop * 2) } }, [String(w0)], 'Slide ω to the peak.');
}
function resonanceGraph(rng: Rng): AskStep {
  const res = rng.next() < 0.5; const R: Range = [0, 16, -4.5, 4.5];
  const shapes = {
    lin: plotV(R, { segments: curve((t) => (t * Math.sin(2 * t)) / 4, 0, 16, 'teal', 96) }),
    beat: plotV(R, { segments: curve((t) => (Math.cos(t) - Math.cos(2 * t)) / 3, 0, 16, 'teal', 96) }),
    exp: plotV(R, { segments: curve((t) => 0.1 * Math.exp(0.25 * t) * Math.sin(2 * t), 0, 16, 'teal', 96, 5) }),
    decay: plotV(R, { segments: curve((t) => (Math.exp(-0.2 * t) * Math.sin(2 * t)) / 2, 0, 16, 'teal', 96) }),
  };
  const right = res ? 'lin' : 'beat';
  return pickLettered(rng, 'Trace', shapes[right], (Object.keys(shapes) as (keyof typeof shapes)[]).filter((k) => k !== right).map((k) => shapes[k]), () => Q('forced', 'resonance-graph', {
    prompt: `An undamped spring y″ + 4y = cos ${res ? '2t' : 't'} starts at rest. Which trace is y(t)?`,
    expression: `y″ + 4y = cos ${res ? '2t' : 't'}`, answer: res ? 1 : 0,
    hint: 'Compare the drive frequency with the natural frequency √4 = 2.',
    steps: res ? ['Drive = natural frequency 2: resonance.', 'y = t·sin(2t)/4: the swings grow in a straight-line envelope, not exponentially.'] : ['Drive 1 ≠ natural 2: no resonance.', 'y = (cos t − cos 2t)/3 stays bounded and repeats.'],
    app: 'Telling linear growth from exponential growth tells you whether you face resonance or instability.',
  }));
}
function fullSolutionStep(rng: Rng): AskStep {
  const [r1, r2] = distinctRoots(rng, true); const b = -(r1 + r2); const c = r1 * r2; const A = rnz(rng, -3, 3); const F = c * A;
  const yh = `${ce('C₁', r1)} + ${ce('C₂', r2)}`;
  const q = Q('forced', 'full-solution', {
    prompt: `Vector's piston: the unforced roots are ${fmt(r1)} and ${fmt(r2)}, and yₚ = ${fmt(A)}. Which is the general solution?`,
    expression: `${lhs2(b, c)} = ${fmt(F)}`, answer: A,
    hint: 'General solution = homogeneous part (with the constants) + one particular solution.',
    steps: [`yₕ = ${yh}; yₚ = ${fmt(A)} (check: ${par(c)}·${par(A)} = ${fmt(F)}).`, `y = ${yh} ${sg(A)}.`],
    app: 'Free response plus forced response: the whole behaviour of a driven system.',
  });
  return choose(rng, q, `y = ${yh} ${sg(A)}`, [`y = ${yh} ${sg(-A)}`, `y = ${fmt(A)}`, `y = ${yh}`]);
}
/* transfer */
function washerTransfer(rng: Rng): AskStep {
  const m = pick(rng, [10, 20, 50]); const w = pick(rng, [10, 20, 30]); const k = m * w * w;
  const q = Q('forced', 'washer', {
    prompt: `A ${m} kg washing-machine drum sits on mounts with k = ${k} N/m. Which spin speed (rad/s) must it pass through quickly?`,
    expression: `${m}x″ + ${k}x = F cos(ωt)`, answer: w,
    hint: 'The dangerous speed is the natural frequency √(k/m).',
    steps: [`k/m = ${lab(k, 'mount stiffness in N/m')} ÷ ${lab(m, 'mass in kg')} = ${w * w}.`, `ω₀ = √${w * w} = ${lab(w, 'resonant speed in rad/s')}.`],
    app: 'That is why washers shudder briefly as they speed up.',
  });
  return choose(rng, q, String(w), [String(w * w), String(2 * w), String(w / 2)]);
}
function bridgeTransfer(rng: Rng): AskStep {
  const m = pick(rng, [2000, 5000]); const w = rint(rng, 2, 6); const k = m * w * w;
  const q = Q('forced', 'footbridge', {
    prompt: `A footbridge deck (${m} kg) has stiffness ${k} N/m. At what ω (rad/s) would marching feet drive it to resonance?`,
    expression: `${m}y″ + ${k}y = F cos(ωt)`, answer: w, unit: 'rad/s',
    hint: 'Resonance: ω = √(k/m).',
    steps: [`k/m = ${lab(k, 'stiffness in N/m')} ÷ ${lab(m, 'mass in kg')} = ${w * w}.`, `ω = √${w * w} = ${lab(w, 'resonant frequency in rad/s')}.`],
    app: 'Footbridges are checked against walking frequencies before they open.',
  });
  return typed(q);
}
function dcCircuitTransfer(rng: Rng): AskStep {
  const C = pick(rng, [0.02, 0.05, 0.1, 0.25]); const V = pick(rng, [6, 9, 12, 20]); const qv = r4(C * V);
  const q = Q('forced', 'dc-circuit', {
    prompt: `Volt's RLC loop is driven by a steady ${V} V: q″ + 3q′ + q/${fmt(C)} = ${V}. What charge does it settle to (yₚ)?`,
    expression: `q/${fmt(C)} = ${V}`, answer: qv, unit: 'C',
    hint: 'A constant input: try qₚ = A, so q″ and q′ vanish.',
    steps: [`q/${fmt(C)} = ${V}, so q = ${lab(fmt(C), 'capacitance in F')} × ${lab(V, 'volts')}.`, `q = ${lab(fmt(qv), 'charge in coulombs')}: the capacitor ends up holding CV.`],
    app: 'Every DC power supply settles to Q = CV on its capacitors.',
  });
  return typed(q);
}

/* ============================================================================================
 * 11. Linear systems & phase portraits
 * ========================================================================================== */
type M2 = [[number, number], [number, number]];
const PS: { v1: [number, number]; v2: [number, number] }[] = [
  { v1: [1, 1], v2: [1, 2] }, { v1: [1, 0], v2: [1, 1] }, { v1: [1, 1], v2: [1, 0] }, { v1: [1, -1], v2: [1, 0] }, { v1: [1, 2], v2: [1, 1] }, { v1: [1, -1], v2: [1, -2] },
];
function sysParams(rng: Rng, l1?: number, l2?: number) {
  let a = l1 ?? rnz(rng, -4, 3); let b = l2 ?? rnz(rng, -3, 4); if (a === b) b = a + (a < 3 ? 1 : -1); if (b === 0) b = a > 0 ? a + 1 : a - 1;
  const [lo, hi] = a < b ? [a, b] : [b, a]; a = lo; b = hi;
  const { v1, v2 } = pick(rng, PS);
  const det = v1[0] * v2[1] - v2[0] * v1[1];
  // A = P·diag(a, b)·P⁻¹ with P = [v1 v2]
  const P = [[v1[0], v2[0]], [v1[1], v2[1]]]; const Pi = [[P[1][1] / det, -P[0][1] / det], [-P[1][0] / det, P[0][0] / det]];
  const PD = [[P[0][0] * a, P[0][1] * b], [P[1][0] * a, P[1][1] * b]];
  const A = [0, 1].map((i) => [0, 1].map((j) => Math.round(PD[i][0] * Pi[0][j] + PD[i][1] * Pi[1][j]))) as M2;
  return { A, l1: a, l2: b, v1, v2 };
}
const sysText = (A: M2) => `x′ = ${sumStr([[A[0][0], 'x'], [A[0][1], 'y']])},  y′ = ${sumStr([[A[1][0], 'x'], [A[1][1], 'y']])}`;
const matV = (A: M2): Visual => ({ type: 'mat', mats: [{ rows: A, label: 'A' }] });
function fieldArrows(A: M2, lim = 2): NonNullable<PlotLayers['vectors']> {
  const out: NonNullable<PlotLayers['vectors']> = [];
  for (let x = -lim; x <= lim; x++) for (let y = -lim; y <= lim; y++) {
    if (!x && !y) continue;
    const u = A[0][0] * x + A[0][1] * y; const v = A[1][0] * x + A[1][1] * y; const L = Math.hypot(u, v);
    if (L < 1e-9) continue;
    out.push({ x: r4((0.55 * u) / L), y: r4((0.55 * v) / L), from: [x, y], color: 'label' });
  }
  return out;
}
function trajectory(A: M2, x0: number, y0: number, dt: number, n = 60): Seg[] {
  const f = (x: number, y: number) => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
  const out: Seg[] = []; let x = x0; let y = y0;
  for (let i = 0; i < n; i++) {
    const [k1x, k1y] = f(x, y); const [k2x, k2y] = f(x + (dt * k1x) / 2, y + (dt * k1y) / 2); const [k3x, k3y] = f(x + (dt * k2x) / 2, y + (dt * k2y) / 2); const [k4x, k4y] = f(x + dt * k3x, y + dt * k3y);
    const nx = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x); const ny = y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    out.push({ a: [r4(x), r4(y)], b: [r4(nx), r4(ny)], color: 'teal' });
    x = nx; y = ny; if (Math.abs(x) > 3.2 || Math.abs(y) > 3.2) break;
  }
  return out;
}
type Portrait = 'saddle' | 'sink' | 'source' | 'spiral-in' | 'spiral-out' | 'center';
const PORTRAIT_NAME: Record<Portrait, string> = { saddle: 'Saddle', sink: 'Stable node (sink)', source: 'Unstable node (source)', 'spiral-in': 'Stable spiral', 'spiral-out': 'Unstable spiral', center: 'Center' };
const PORTRAIT_A: Record<Portrait, M2> = { saddle: [[1, 0], [0, -1]], sink: [[-1, 0], [0, -2]], source: [[1, 0], [0, 2]], 'spiral-in': [[-0.3, 1], [-1, -0.3]], 'spiral-out': [[0.3, 1], [-1, 0.3]], center: [[0, 1], [-1, 0]] };
function portraitVisual(p: Portrait): Visual {
  const A = PORTRAIT_A[p]; let segs: Seg[] = [];
  if (p === 'saddle') segs = [...trajectory(A, 0.15, 3, 0.1), ...trajectory(A, -0.15, -3, 0.1)];
  else if (p === 'sink') segs = [...trajectory(A, 3, 2.5, 0.08), ...trajectory(A, -3, -1, 0.08)];
  else if (p === 'source') segs = [...trajectory(A, 0.3, 0.2, 0.1), ...trajectory(A, -0.3, -0.1, 0.1)];
  else if (p === 'spiral-in') segs = trajectory(A, 2.8, 0, 0.15, 80);
  else if (p === 'spiral-out') segs = trajectory(A, 0.3, 0, 0.15, 80);
  else segs = trajectory(A, 2, 0, 0.12, 60);
  return plotV([-3, 3, -3, 3], { vectors: fieldArrows(A), segments: segs });
}
const eigType = (l1: number, l2: number): Portrait => (l1 * l2 < 0 ? 'saddle' : l1 < 0 ? 'sink' : 'source');
const cxType = (al: number): Portrait => (al < 0 ? 'spiral-in' : al > 0 ? 'spiral-out' : 'center');
const CONFUSE: Record<Portrait, Portrait[]> = { saddle: ['sink', 'source', 'spiral-in'], sink: ['source', 'saddle', 'spiral-in'], source: ['sink', 'saddle', 'spiral-out'], 'spiral-in': ['sink', 'spiral-out', 'center'], 'spiral-out': ['source', 'spiral-in', 'center'], center: ['spiral-in', 'spiral-out', 'saddle'] };
function traceDetTable(rng: Rng): AskStep {
  const { A, l1, l2 } = sysParams(rng); const T = A[0][0] + A[1][1]; const D = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const q = Q('systems', 'trace-det', {
    prompt: 'Ada\'s twin coolant loops. Fill the trace and determinant of A.',
    expression: sysText(A), answer: D, answerText: `${fmt(T)}, ${fmt(D)}`,
    hint: 'Trace = a + d (the diagonal). Determinant = ad − bc.',
    steps: [`Trace = ${fmt(A[0][0])} + ${par(A[1][1])} = ${lab(fmt(T), 'trace')}.`, `Det = (${fmt(A[0][0])})(${fmt(A[1][1])}) − (${fmt(A[0][1])})(${fmt(A[1][0])}) = ${lab(fmt(D), 'determinant')}.`, `Eigenvalues solve ${sumStr([[1, 'λ²'], [-T, 'λ'], [D, '']])} = 0: λ = ${lab(fmt(l1), 'eigenvalue')}, ${lab(fmt(l2), 'eigenvalue')}.`],
    visual: matV(A),
    app: 'Trace and determinant classify a system without solving it.',
  });
  return model(q, { kind: 'table', rowLabels: ['trace', 'det'], cols: ['value'], rows: [[null], [null]] }, [`${T},${D}`], 'Fill the trace, then the determinant.');
}
function eigenTable(rng: Rng): AskStep {
  const { A, l1, l2 } = sysParams(rng); const T = A[0][0] + A[1][1]; const D = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const q = Q('systems', 'eigenvalues', {
    prompt: 'Vector\'s twin loops: find the eigenvalues of A, smaller first.',
    expression: sysText(A), answer: l1, answerText: `${fmt(l1)}, ${fmt(l2)}`,
    hint: `det(A − λI) = λ² − (trace)λ + det. Here trace = ${fmt(T)}.`,
    steps: [`${sumStr([[1, 'λ²'], [-T, 'λ'], [D, '']])} = 0.`, `${factored('λ', l1, l2)} = 0, so λ = ${lab(fmt(l1), 'eigenvalue')}, ${lab(fmt(l2), 'eigenvalue')}.`, `Each gives a solution e^(λt)·v along its eigenvector.`],
    visual: matV(A),
    app: 'Eigenvalues are the natural rates of a coupled system.',
  });
  return model(q, { kind: 'table', rowLabels: ['λ₁ (smaller)', 'λ₂ (larger)'], cols: ['value'], rows: [[null], [null]] }, [`${l1},${l2}`], 'Fill both eigenvalues.');
}
function classifyStep(rng: Rng): AskStep {
  const cx = rng.next() < 0.35; let expr: string; let why: string[]; let p: Portrait;
  if (cx) {
    const al = pick(rng, [-2, -1, 0, 1, 2]); const be = rint(rng, 1, 3); p = cxType(al);
    expr = al === 0 ? `λ = ±${iPart(be)}` : `λ = ${fmt(al)} ± ${iPart(be)}`;
    why = ['Complex eigenvalues: trajectories rotate.', al < 0 ? 'Real part negative: they spiral in. Stable spiral.' : al > 0 ? 'Real part positive: they spiral out. Unstable spiral.' : 'Real part 0: closed orbits. Center.'];
  } else {
    const { l1, l2 } = sysParams(rng); p = eigType(l1, l2);
    expr = `λ = ${fmt(l1)}, λ = ${fmt(l2)}`;
    why = [p === 'saddle' ? 'Opposite signs: pulled in along one eigenvector, pushed out along the other. A saddle is unstable.' : p === 'sink' ? 'Both negative: everything decays into the origin. Stable node.' : 'Both positive: everything flows out. Unstable node.'];
  }
  const q = Q('systems', 'classify', {
    prompt: 'Volt reads the eigenvalues of the loop controller. What does the phase portrait look like near the origin?',
    expression: expr, answer: 0,
    hint: 'Real or complex? Then look at the signs of the (real parts of the) eigenvalues.',
    steps: why, app: 'A controller is only safe if its equilibrium is a sink or a stable spiral.',
  });
  return choose(rng, q, PORTRAIT_NAME[p], CONFUSE[p].map((x) => PORTRAIT_NAME[x]));
}
function portraitPick(rng: Rng): AskStep {
  const cx = rng.next() < 0.4; let p: Portrait; let expr: string;
  if (cx) { const al = pick(rng, [-1, 1, 0]); const be = rint(rng, 1, 3); p = cxType(al); expr = al === 0 ? `λ = ±${iPart(be)}` : `λ = ${fmt(al)} ± ${iPart(be)}`; }
  else { const { l1, l2 } = sysParams(rng); p = eigType(l1, l2); expr = `λ = ${fmt(l1)}, λ = ${fmt(l2)}`; }
  return pickLettered(rng, 'Portrait', portraitVisual(p), CONFUSE[p].map(portraitVisual), () => Q('systems', 'portrait', {
    prompt: 'Ada\'s loop monitor shows these eigenvalues. Which phase portrait matches?',
    expression: expr, answer: 0,
    hint: 'Real eigenvalues: straight-line directions, no rotation. Complex: rotation. Signs decide in or out.',
    steps: [`These eigenvalues give this picture: ${PORTRAIT_NAME[p].toLowerCase()}.`, p === 'saddle' ? 'In along one direction, out along the other.' : p.startsWith('spiral') ? 'Rotation from the imaginary part; the real part decides in or out.' : p === 'center' ? 'Pure rotation: closed loops.' : 'No rotation; all arrows point the same way along each eigenvector.'],
    app: 'Phase portraits show every possible run of a system in one picture.',
  }));
}
function eigenvectorLine(rng: Rng): AskStep {
  const { A, l1, l2, v1, v2 } = sysParams(rng); const useFirst = rng.next() < 0.5; const lam = useFirst ? l1 : l2; const v = useFirst ? v1 : v2; const m = v[1];
  const q = Q('systems', 'eigenvector', {
    prompt: `Twin loops: λ = ${fmt(lam)} is an eigenvalue. Tap two points on its straight-line solution through the origin.`,
    expression: sysText(A), answer: m, answerText: `y = ${m === 0 ? '0' : coefTerm(m, 'x')}`,
    hint: `Look for v = (1, m) with A·v = ${fmt(lam)}·v. The line through the origin with slope m is the one.`,
    steps: [`Try v = (1, ${fmt(m)}): A·v = (${fmt(A[0][0] + A[0][1] * m)}, ${fmt(A[1][0] + A[1][1] * m)}) = ${fmt(lam)}·(1, ${fmt(m)}).`, `So the line y = ${m === 0 ? '0' : coefTerm(m, 'x')} is invariant: start on it and you stay on it.`],
    visual: matV(A),
    app: 'Eigenvectors are the directions a coupled system moves in without twisting.',
  });
  return model(q, { kind: 'plot', range: [-4, 4, -4, 4], count: 2, label: 'Tap two points on the eigenvector line', layers: { vectors: fieldArrows(A) } }, undefined, 'Tap two points on the straight-line solution.', { rule: { kind: 'on-line', m, b: 0 } });
}
function equilibriumSystemPlot(rng: Rng): AskStep {
  let a = rnz(rng, -3, 3); let b = rint(rng, -2, 2); const c = rint(rng, -2, 2); let d = rnz(rng, -3, 3);
  if (a * d - b * c === 0) { a = 2; d = -1; b = 0; }
  const p = rint(rng, -3, 3); const qv = rint(rng, -3, 3); const e = -(a * p + b * qv); const f = -(c * p + d * qv);
  const q = Q('systems', 'system-equilibrium', {
    prompt: 'Catalyst\'s coupled tanks. Tap the equilibrium, where both rates are zero.',
    expression: `x′ = ${sumStr([[a, 'x'], [b, 'y'], [e, '']])},  y′ = ${sumStr([[c, 'x'], [d, 'y'], [f, '']])}`, answer: p, answerText: `(${fmt(p)}, ${fmt(qv)})`,
    hint: 'Set x′ = 0 and y′ = 0 and solve the two linear equations together.',
    steps: [`${sumStr([[a, 'x'], [b, 'y']])} = ${fmt(-e)} and ${sumStr([[c, 'x'], [d, 'y']])} = ${fmt(-f)}.`, `Solving: x = ${fmt(p)}, y = ${fmt(qv)}. Check: both right sides are 0 there.`],
    app: 'Equilibria of coupled tanks are where the plant runs steadily.',
  });
  return model(q, { kind: 'plot', range: [-4, 4, -4, 4], count: 1, label: 'Tap the equilibrium point' }, [`${p},${qv}`], 'Tap the point where x′ = 0 and y′ = 0.');
}
const matTxt = (r: number[][]) => `[${r[0].map(fmt).join(' ')} ; ${r[1].map(fmt).join(' ')}]`;
function convertStep(rng: Rng): AskStep {
  const b = rnz(rng, -4, 5); let c = rnz(rng, -4, 6); if (c === b) c = b + 1 === 0 ? b + 2 : b + 1;
  const right = matTxt([[0, 1], [-c, -b]]);
  const q = Q('systems', 'to-system', {
    prompt: 'Newton\'s simulator only takes first-order systems. With x₁ = y and x₂ = y′, which matrix A gives x′ = Ax?',
    expression: `${lhs2(b, c)} = 0`, answer: 0,
    hint: 'x₁′ = y′ = x₂. For x₂′ = y″, solve the equation for y″.',
    steps: ['x₁′ = x₂: first row [0 1].', `x₂′ = y″ = ${sumStr([[-c, 'y'], [-b, 'y′']])} = ${sumStr([[-c, 'x₁'], [-b, 'x₂']])}: second row [${fmt(-c)} ${fmt(-b)}].`, 'Its eigenvalues are the characteristic roots.'],
    app: 'Simulators only handle first-order systems, so every model is converted like this.',
  });
  return choose(rng, q, right, [matTxt([[0, 1], [c, b]]), matTxt([[1, 0], [-c, -b]]), matTxt([[0, 1], [-b, -c]])]);
}
function eigenTyped(rng: Rng): AskStep {
  const { A, l1, l2 } = sysParams(rng);
  const q = Q('systems', 'larger-eigenvalue', {
    prompt: 'Vector\'s twin loops: what is the larger eigenvalue of A?',
    expression: sysText(A), answer: l2,
    hint: 'Solve λ² − (trace)λ + det = 0.',
    steps: [`${lab(fmt(A[0][0] + A[1][1]), 'trace')} and ${lab(fmt(A[0][0] * A[1][1] - A[0][1] * A[1][0]), 'determinant')}.`, `λ = ${fmt(l1)} or ${fmt(l2)}: the larger is ${lab(fmt(l2), 'eigenvalue')}.`],
    visual: matV(A),
    app: 'The largest eigenvalue decides whether a system blows up or settles.',
  });
  return typed(q);
}
/* transfer */
function coupledTanksTransfer(rng: Rng): AskStep {
  const a = rint(rng, 2, 5); let b = rint(rng, 1, 6); if (b === a) b = a + 1;
  const l1 = -a - b; const l2 = -a + b; const p = eigType(l1, l2); const A: M2 = [[-a, b], [b, -a]];
  const q = Q('systems', 'coupled', {
    prompt: 'Dr. Catalyst\'s two coupled tanks trade coolant through pumps. What kind of equilibrium is the origin?',
    expression: sysText(A), answer: 0,
    hint: 'Find the eigenvalues from λ² − (trace)λ + det = 0, then look at their signs.',
    steps: [`Trace ${fmt(-2 * a)}, det ${fmt(a * a - b * b)}: λ² + ${2 * a}λ ${sg(a * a - b * b)} = 0, so λ = ${lab(fmt(l1), 'eigenvalue')} and ${lab(fmt(l2), 'eigenvalue')}.`, p === 'saddle' ? 'Opposite signs: a saddle, unstable (the pumps win).' : 'Both negative: a stable node (the tanks settle).'],
    visual: matV(A),
    app: 'Coupled tanks, circuits and reactors are classified by their eigenvalues.',
  });
  return choose(rng, q, PORTRAIT_NAME[p], CONFUSE[p].map((x) => PORTRAIT_NAME[x]));
}
function predatorTransfer(rng: Rng): AskStep {
  const b = rint(rng, 1, 4); const c = rint(rng, 1, 4); const w2 = b * c;
  const q = Q('systems', 'predator-prey', {
    prompt: `Near its balance point, a predator–prey model is x′ = ${coefTerm(-b, 'y')}, y′ = ${coefTerm(c, 'x')}. What do the populations do?`,
    expression: `λ² + ${w2} = 0`, answer: 0,
    hint: `A = [0 ${fmt(-b)} ; ${c} 0]: trace 0 and det = 0·0 − (${fmt(-b)})(${c}) = ${w2} > 0. Solve λ² − (trace)λ + det = 0.`,
    steps: [`λ² + ${w2} = 0 gives λ = ±${Number.isInteger(Math.sqrt(w2)) ? (w2 === 1 ? 'i' : `${Math.sqrt(w2)}i`) : `i√${w2}`}: purely imaginary.`, 'A center: the populations cycle around the balance point.'],
    app: 'Ecologists and control engineers read cycles from imaginary eigenvalues.',
  });
  return choose(rng, q, PORTRAIT_NAME.center, CONFUSE.center.map((x) => PORTRAIT_NAME[x]));
}
function drugCompartmentTransfer(rng: Rng): AskStep {
  const p = rint(rng, 1, 5); const qv = rint(rng, 1, 5); const e = 3 * p - qv; const f = -(p - 2 * qv);
  const q = Q('systems', 'compartments', {
    prompt: `A two-compartment dosing model: x′ = ${sumStr([[-3, 'x'], [1, 'y'], [e, '']])}, y′ = ${sumStr([[1, 'x'], [-2, 'y'], [f, '']])}. What is x at the steady state?`,
    expression: `−3x + y = ${fmt(-e)},  x − 2y = ${fmt(-f)}`, answer: p,
    hint: 'Steady state: both derivatives zero. Solve the two equations.',
    steps: [`From the second: x = ${sumStr([[2, 'y'], [-f, '']])}.`, `Substitute and solve: x = ${p}, y = ${qv}.`],
    app: 'Pharmacokinetic models are small linear systems like this.',
  });
  return typed(q);
}

/* ============================================================================================
 * 12. The Laplace transform
 * ========================================================================================== */
function tableLookupStep(rng: Rng): AskStep {
  const kind = pick(rng, ['exp', 'one', 't', 't2', 'sin', 'cos'] as const);
  const mk = (f: string, steps: string[]) => Q('laplace', 'lookup', {
    prompt: 'Volt\'s switchboard needs this signal in s. Use the table: what is its Laplace transform?', expression: `ℒ{${f}}`, answer: 0,
    hint: 'ℒ{1} = 1/s, ℒ{t} = 1/s², ℒ{e^(at)} = 1/(s − a), ℒ{sin bt} = b/(s² + b²), ℒ{cos bt} = s/(s² + b²).',
    steps, visual: card('Transform table', ['1 → 1/s', 'tⁿ → n!/sⁿ⁺¹', 'e^(at) → 1/(s − a)', 'sin bt → b/(s² + b²)', 'cos bt → s/(s² + b²)']),
    app: 'Control engineers work in s instead of t because derivatives become multiplication.',
  });
  if (kind === 'exp') { const a = rnz(rng, -4, 5); return choose(rng, mk(ex(a), [`ℒ{e^(at)} = 1/(s − a) with a = ${fmt(a)}: 1/(${shifted('s', a)}).`]), `1/(${shifted('s', a)})`, [`1/(${shifted('s', -a)})`, `${fmt(a)}/s`, `1/(${shifted('s', a)})²`]); }
  if (kind === 'one') return choose(rng, mk('1', ['ℒ{1} = ∫₀^∞ e^(−st) dt = 1/s.']), '1/s', ['1', 's', '1/s²']);
  if (kind === 't') return choose(rng, mk('t', ['ℒ{t} = 1!/s² = 1/s².']), '1/s²', ['1/s', '2/s²', 's²']);
  if (kind === 't2') return choose(rng, mk('t²', ['ℒ{t²} = 2!/s³ = 2/s³.']), '2/s³', ['1/s³', '2/s²', '1/s²']);
  const b = rint(rng, 2, 5); const bb = b * b;
  if (kind === 'sin') return choose(rng, mk(`sin ${b}t`, [`ℒ{sin bt} = b/(s² + b²) with b = ${b}: ${b}/(s² + ${bb}).`]), `${b}/(s² + ${bb})`, [`s/(s² + ${bb})`, `${b}/(s² − ${bb})`, `${b}/(s² + ${b})`]);
  return choose(rng, mk(`cos ${b}t`, [`ℒ{cos bt} = s/(s² + b²) with b = ${b}: s/(s² + ${bb}).`]), `s/(s² + ${bb})`, [`${b}/(s² + ${bb})`, `s/(s² − ${bb})`, `s/(s² + ${b})`]);
}
function transformValueTable(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const M = rint(rng, 2, 9); const a = rnz(rng, -5, 5);
    const q = Q('laplace', 'transform-fill', {
      prompt: `Volt's switchboard: ℒ{${cex(M, a)}} = A/(s − B). Fill in A and B.`, expression: `ℒ{${cex(M, a)}}`, answer: M, answerText: `${M}, ${fmt(a)}`,
      hint: 'Constants come straight through; e^(at) gives 1/(s − a).',
      steps: [`ℒ{${cex(M, a)}} = ${M}·1/(s − (${fmt(a)})) = ${M}/(${shifted('s', a)}).`, `A = ${M}, B = ${fmt(a)}.`],
      app: 'Reading transforms off the table is the everyday skill in circuit analysis.',
    });
    return model(q, { kind: 'table', rowLabels: ['A', 'B'], cols: ['value'], rows: [[null], [null]] }, [`${M},${a}`], 'Fill A, then B.');
  }
  const m = rint(rng, 1, 4); const b = rint(rng, 2, 5);
  const q = Q('laplace', 'transform-fill', {
    prompt: `Volt's switchboard: ℒ{${m === 1 ? '' : `${m} `}sin ${b}t} = A/(s² + B). Fill in A and B.`, expression: `ℒ{${m === 1 ? '' : `${m} `}sin ${b}t}`, answer: m * b, answerText: `${m * b}, ${b * b}`,
    hint: 'ℒ{sin bt} = b/(s² + b²). Watch for b versus b².',
    steps: [`ℒ{sin ${b}t} = ${b}/(s² + ${b * b}); times ${m}: ${m * b}/(s² + ${b * b}).`, `A = ${m * b}, B = ${b * b}.`],
    app: 'Sinusoidal sources in circuits transform exactly like this.',
  });
  return model(q, { kind: 'table', rowLabels: ['A', 'B'], cols: ['value'], rows: [[null], [null]] }, [`${m * b},${b * b}`], 'Fill A, then B.');
}
function laplaceAreaStep(rng: Rng): AskStep {
  const s0 = pick(rng, [1, 2, 4, 5]); const b = 8 / s0;
  const q = Q('laplace', 'definition', {
    prompt: `ℒ{1} at s = ${s0} is the area under e^(−${s0 === 1 ? '' : s0}t) from 0 to ∞. Try the rectangles, then type the exact area.`,
    expression: `∫₀^∞ e^(−${s0 === 1 ? '' : s0}t) dt`, answer: 1 / s0, fraction: true,
    hint: 'The antiderivative of e^(−st) is −e^(−st)/s.',
    steps: [s0 === 1 ? '∫₀^∞ e^(−t) dt = [−e^(−t)]₀^∞ = 0 − (−1).' : `∫₀^∞ e^(−${s0}t) dt = [−e^(−${s0}t)/${s0}]₀^∞ = 0 − (−1/${s0}).`, `= ${fracStr(1, s0)}: that is why ℒ{1} = 1/s.`],
    app: 'The transform is an integral that weights later times less and less.',
  });
  return typed(q, { aid: { kind: 'riemann', fn: { kind: 'exp', a: 1, base: Math.exp(-s0) }, a: 0, b, ns: [4, 8, 16, 32], rule: 'mid', range: [0, b, 0, 1.1] } });
}
function derivRuleStep(rng: Rng): AskStep {
  if (rng.next() < 0.55) {
    const y0 = rnz(rng, -4, 6);
    const q = Q('laplace', 'derivative-rule', {
      prompt: `Volt's sensor starts at y(0) = ${fmt(y0)}. What is ℒ{y′} in terms of Y(s)?`, expression: 'ℒ{y′}', answer: y0,
      hint: 'Integrate by parts: the boundary term brings in y(0) with a minus sign.',
      steps: ['ℒ{y′} = sY(s) − y(0).', `= ${sumStr([[1, 'sY'], [-y0, '']])}.`, 'Derivatives become multiplication by s, plus the starting value.'],
      app: 'This rule is why initial conditions get built into the algebra automatically.',
    });
    return choose(rng, q, sumStr([[1, 'sY'], [-y0, '']]), ['sY', sumStr([[1, 'sY'], [y0, '']]), sumStr([[1, 'Y/s'], [-y0, '']])]);
  }
  const a = rnz(rng, -3, 4); const b = rnz(rng, -3, 4);
  const right = sumStr([[1, 's²Y'], [-a, 's'], [-b, '']]);
  const q = Q('laplace', 'derivative-rule', {
    prompt: `Volt's sensor starts at y(0) = ${fmt(a)}, y′(0) = ${fmt(b)}. What is ℒ{y″}?`, expression: 'ℒ{y″}', answer: a,
    hint: 'ℒ{y″} = s²Y − s·y(0) − y′(0).',
    steps: [`s²Y − s·(${fmt(a)}) − (${fmt(b)}) = ${right}.`],
    app: 'Second-order models turn into algebra in s with both initial values built in.',
  });
  return choose(rng, q, right, [sumStr([[1, 's²Y'], [-b, 's'], [-a, '']]), sumStr([[1, 's²Y'], [-(a + b), '']]), 's²Y']);
}
function ivpLaplaceTable(rng: Rng): AskStep {
  const k = rint(rng, 1, 3); const A = rint(rng, 1, 5); let y0 = rint(rng, -2, 7); if (y0 === A) y0 = A + 2; const b = k * A; const B = y0 - A;
  const q = Q('laplace', 'ivp-laplace', {
    prompt: `Volt's charger law transforms to (s + ${k})Y${y0 ? ` ${sg(-y0)}` : ''} = ${b}/s. Then Y = A/s + B/(s + ${k}). Fill A and B.`,
    expression: `y′ + ${coefTerm(k, 'y')} = ${b}, y(0) = ${fmt(y0)}`, answer: A, answerText: `${A}, ${fmt(B)}`,
    hint: `Y = (${sumStr([[y0, 's'], [b, '']])})/(s(s + ${k})). Cover-up: A is the value at s = 0 without the s; B is the value at s = −${k} without (s + ${k}).`,
    steps: [`A = ${b}/${k} = ${A}.`, `B = (${fmt(y0 * -k)} + ${b})/(−${k}) = ${fmt(B)}.`, `Invert: y = ${A} ${expTerm(B, -k)}. The same answer the integrating factor gives.`],
    app: 'Partial fractions plus the table: the Laplace way to solve any linear IVP.',
  });
  return model(q, { kind: 'table', rowLabels: ['A', 'B'], cols: ['value'], rows: [[null], [null]] }, [`${A},${B}`], 'Fill A, then B.');
}
function inverseStep(rng: Rng): AskStep {
  if (rng.next() < 0.55) {
    const M = rint(rng, 2, 9); const a = rnz(rng, -5, 5);
    const q = Q('laplace', 'inverse', {
      prompt: 'Volt\'s switchboard answers in s. Read the table backwards: what is y(t)?', expression: `Y(s) = ${M}/(${shifted('s', -a)})`, answer: a,
      hint: '1/(s − a) comes from e^(at). Watch the sign inside the bracket.',
      steps: [`${shifted('s', -a)} = s − (${fmt(-a)}), so a = ${fmt(-a)}.`, `y = ${cex(M, -a)}.`],
      app: 'Inverse transforms turn an s-domain answer back into a time response.',
    });
    return choose(rng, q, `y = ${cex(M, -a)}`, [`y = ${cex(M, a)}`, `y = ${M}t${ex(-a)}`, `y = ${M} sin ${Math.abs(a) === 1 ? '' : Math.abs(a)}t`]);
  }
  const b = rint(rng, 2, 5); const m = rint(rng, 1, 4); const k = m * b;
  const q = Q('laplace', 'inverse', {
    prompt: 'Volt\'s switchboard answers in s. Read the table backwards: what is y(t)?', expression: `Y(s) = ${k}/(s² + ${b * b})`, answer: m,
    hint: `sin ${b}t transforms to ${b}/(s² + ${b * b}). How many of those make ${k}?`,
    steps: [`${k}/(s² + ${b * b}) = ${m} × ${b}/(s² + ${b * b}).`, `y = ${m === 1 ? '' : `${m} `}sin ${b}t.`],
    app: 'Inverse transforms turn an s-domain answer back into a time response.',
  });
  return choose(rng, q, `y = ${m === 1 ? '' : `${m} `}sin ${b}t`, [`y = ${m === 1 ? '' : `${m} `}cos ${b}t`, `y = ${k} sin ${b}t`, `y = ${m === 1 ? '' : `${m} `}sin ${b * b}t`]);
}
function secondOrderLaplace(rng: Rng): AskStep {
  const b = rint(rng, 2, 4); const cosCase = rng.next() < 0.5; const y0 = rint(rng, 1, 4); const m = rint(rng, 1, 3); const v0 = m * b;
  const expr = cosCase ? `y″ + ${b * b}y = 0, y(0) = ${y0}, y′(0) = 0` : `y″ + ${b * b}y = 0, y(0) = 0, y′(0) = ${v0}`;
  const Y = cosCase ? `${y0 === 1 ? '' : y0}s/(s² + ${b * b})` : `${v0}/(s² + ${b * b})`;
  const right = cosCase ? `y = ${y0 === 1 ? '' : `${y0} `}cos ${b}t` : `y = ${m === 1 ? '' : `${m} `}sin ${b}t`;
  const q = Q('laplace', 'second-order-laplace', {
    prompt: 'Newton\'s column, the Laplace way: transform, solve for Y(s), and invert. Which is y(t)?', expression: expr, answer: 0,
    hint: 'ℒ{y″} = s²Y − s·y(0) − y′(0). Collect the Y terms.',
    steps: [`(s² + ${b * b})Y = ${cosCase ? `${y0 === 1 ? '' : y0}s` : v0}, so Y = ${Y}.`, `${right}.`],
    app: 'Oscillator problems solve in three lines this way.',
  });
  const wrongs = cosCase ? [`y = ${y0 === 1 ? '' : `${y0} `}sin ${b}t`, `y = ${y0 === 1 ? '' : `${y0} `}cos ${b * b}t`, `y = ${cex(y0, -b)}`] : [`y = ${m === 1 ? '' : `${m} `}cos ${b}t`, `y = ${v0} sin ${b}t`, `y = ${m === 1 ? '' : `${m} `}sin ${b * b}t`];
  return choose(rng, q, right, wrongs);
}
function poleStep(rng: Rng): AskStep {
  const p = rnz(rng, -6, 6); const M = rint(rng, 2, 9);
  const q = Q('laplace', 'pole', {
    prompt: 'Volt\'s Y(s) has one pole. Tap it: the s that makes the denominator zero.',
    expression: `Y(s) = ${M}/(${shifted('s', p)})`, answer: p,
    hint: 'Set the denominator to zero.',
    steps: [`${shifted('s', p)} = 0 at s = ${fmt(p)}.`, `y = ${cex(M, p)}: a pole ${p < 0 ? 'left of 0 decays (stable)' : 'right of 0 grows (unstable)'}.`],
    app: 'Control engineers keep every pole in the left half of the s-plane.',
  });
  return model(q, { kind: 'numberline', start: 0, min: -8, max: 8, label: 'The real s-axis: tap the pole' }, [String(p)], 'Tap the pole.');
}
/** The s-plane as a build: factor or complete the square, then tap both poles. */
function polePlaneStep(rng: Rng): AskStep {
  const cx = rng.next() < 0.5;
  let b: number; let c: number; let items: string[]; let steps: string[]; let decays: boolean;
  if (cx) {
    const al = rint(rng, -4, 1); const be = rint(rng, 1, 3); b = -2 * al; c = al * al + be * be; decays = al < 0;
    items = [`${al},${be}`, `${al},${-be}`];
    steps = [`Complete the square: ${sumStr([[1, 's²'], [b, 's'], [c, '']])} = ${al === 0 ? 's²' : `(${shifted('s', al)})²`} + ${be * be}, zero at s = ${al === 0 ? '±' : `${fmt(al)} ± `}${iPart(be)}.`, `Tap (${fmt(al)}, ${be}) and (${fmt(al)}, ${fmt(-be)}).`, al < 0 ? `Real part ${fmt(al)} < 0: y = ${ex(al)}·sin ${be === 1 ? '' : be}t (times a constant) rings and decays.` : al === 0 ? 'Real part 0: y rings forever without decaying.' : `Real part ${fmt(al)} > 0: the ringing grows. Unstable.`];
  } else {
    const p1 = rint(rng, -5, 0); const p2 = rint(rng, p1 + 1, 1); b = -(p1 + p2); c = p1 * p2; decays = p2 < 0;
    items = [`${p1},0`, `${p2},0`];
    steps = [`Factor: ${sumStr([[1, 's²'], [b, 's'], [c, '']])} = ${factored('s', p1, p2)}, zero at s = ${fmt(p1)} and s = ${fmt(p2)}.`, `Both poles sit on the real axis: tap (${fmt(p1)}, 0) and (${fmt(p2)}, 0).`, decays ? 'Both are left of 0: every e^(pt) term decays.' : `A pole at ${fmt(p2)} is not left of 0: that term ${p2 === 0 ? 'never dies away' : 'grows'}.`];
  }
  const den = sumStr([[1, 's²'], [b, 's'], [c, '']]);
  const q = Q('laplace', 'pole-plane', {
    prompt: `Volt's switchboard reads Y(s) = 1/(${den}). Tap both poles on the s-plane (real part across, imaginary part up).`,
    expression: `Y(s) = 1/(${den})`, answer: decays ? 1 : 0, answerText: items.map((it) => `(${it.split(',').map((v) => fmt(Number(v))).join(', ')})`).join(' and '),
    hint: 'A pole is where the denominator is zero. Factor it, or complete the square if it will not factor.',
    steps,
    app: 'Control engineers keep every pole left of the imaginary axis so every response decays.',
  });
  return model(q, { kind: 'plot', range: [-6, 2, -4, 4], count: 2, label: 'The s-plane: tap both poles' }, undefined, 'Tap both poles of Y(s).', { rule: { kind: 'set', items } });
}
/** Typed: the settled value of a Laplace-solved IVP (the A of A/s). */
function laplaceSteadyTyped(rng: Rng): AskStep {
  const k = rint(rng, 1, 4); const A = rint(rng, 1, 6); let y0 = rint(rng, -2, 8); if (y0 === A) y0 = A + 2; const b = k * A; const B = y0 - A;
  const q = Q('laplace', 'laplace-steady', {
    prompt: `Volt solved his charger law y′ + ${coefTerm(k, 'y')} = ${b}, y(0) = ${fmt(y0)} by Laplace: Y = A/s + B/(s + ${k}). What value does y(t) settle to?`,
    expression: `Y(s) = ${y0 ? `(${sumStr([[y0, 's'], [b, '']])})` : b}/(s(s + ${k}))`, answer: A,
    hint: `B/(s + ${k}) inverts to a dying exponential. Find A by cover-up at s = 0.`,
    steps: [`A = the rest of Y at s = 0 (cover up the s): ${b}/${k} = ${A}.`, `y = ${A} ${expTerm(B, -k)}, and the exponential dies away, so y → ${A}.`],
    app: 'Reading the settled value straight from Y(s) is how circuit designers check a charger.',
  });
  return typed(q);
}
/* transfer */
function controlPoleTransfer(rng: Rng): AskStep {
  const stable = rng.next() < 0.5; const p1 = -rint(rng, 1, 5); let p2 = stable ? -rint(rng, 1, 6) : rint(rng, 1, 3); if (p2 === p1) p2 = p1 - 1;
  const q = Q('laplace', 'stability', {
    prompt: `A motor controller's transfer function has poles at s = ${fmt(p1)} and s = ${fmt(p2)}. Is it stable?`,
    expression: `G(s) = 1/((${shifted('s', p1)})(${shifted('s', p2)}))`, answer: stable ? 1 : 0,
    hint: 'Each pole p gives a term e^(pt) in the response.',
    steps: [`Poles ${fmt(p1)} and ${fmt(p2)} give ${ex(p1)} and ${ex(p2)} terms.`, stable ? 'Both negative: every term decays. Stable.' : `${ex(p2)} grows: unstable, even though the other pole is fine.`],
    app: 'One pole in the right half-plane is enough to make a system unsafe.',
  });
  return choose(rng, q, stable ? 'Stable: all poles are negative' : 'Unstable: a pole is positive', [stable ? 'Unstable: a pole is positive' : 'Stable: all poles are negative', 'Stable: most poles are negative']);
}
function capacitorInverseTransfer(rng: Rng): AskStep {
  const V = pick(rng, [5, 9, 12, 24]); const a = rint(rng, 2, 6);
  const q = Q('laplace', 'capacitor', {
    prompt: `Volt's capacitor discharges with V(s) = ${V}/(s + ${a}). What is V(t)?`,
    expression: `V(s) = ${V}/(s + ${a})`, answer: a,
    hint: '1/(s − a) ↔ e^(at). Here the bracket is s + ' + a + '.',
    steps: [`s + ${a} = s − (−${a}), so V(t) = ${cex(V, -a)} volts.`],
    app: 'Circuit simulators report answers exactly like this.',
  });
  return choose(rng, q, `V = ${cex(V, -a)}`, [`V = ${cex(V, a)}`, `V = ${V}t${ex(-a)}`, `V = ${cex(r4(V / a), -1)}`]);
}
function shiftTransfer(rng: Rng): AskStep {
  const a = rnz(rng, -3, 3); const b = rint(rng, 2, 4);
  const q = Q('laplace', 'shift', {
    prompt: `Volt's damped signal: multiplying by e^(at) shifts s to s − a. Use it: what is ℒ{${ex(a)}·sin ${b}t}?`,
    expression: `ℒ{${ex(a)} sin ${b}t}`, answer: a,
    hint: `ℒ{sin ${b}t} = ${b}/(s² + ${b * b}); replace s by s − (${fmt(a)}).`,
    steps: [`${b}/((${shifted('s', a)})² + ${b * b}).`],
    app: 'Damped oscillations transform with this shift rule.',
  });
  return choose(rng, q, `${b}/((${shifted('s', a)})² + ${b * b})`, [`${b}/((${shifted('s', -a)})² + ${b * b})`, `${b}/(s² + ${b * b}) ${a > 0 ? '−' : '+'} ${Math.abs(a)}`, `${b}/((${shifted('s', a)})² + ${b})`]);
}
function runawayVatTransfer(rng: Rng): AskStep {
  const E = pick(rng, [60, 80, 120, 150]); const below = rng.next() < 0.5;
  const right = below ? 'It cools further below, faster and faster' : 'It heats further above, faster and faster';
  const q = Q('fields', 'runaway-vat', {
    prompt: `Dr. Catalyst's vat makes heat faster than it sheds it above ${E}°C: dT/dt = 0.1(T − ${E}). It starts just ${below ? 'below' : 'above'} ${E}°C. What happens?`,
    expression: `dT/dt = 0.1(T − ${E})`, answer: below ? -1 : 1,
    hint: `Check the sign of dT/dt ${below ? 'below' : 'above'} T = ${E}.`,
    steps: [`T = ${lab(E, 'equilibrium temperature')}: there dT/dt = 0.`, below ? 'Below it dT/dt < 0, so T drops, and the gap feeds itself: unstable.' : 'Above it dT/dt > 0, so T climbs, and the gap feeds itself: unstable (thermal runaway).'],
    app: 'Unstable equilibria are knife-edges: engineers design so they never sit on one.',
  });
  return choose(rng, q, right, [`It returns to ${E}°C`, 'It stays where it started', `It oscillates around ${E}°C`]);
}
function batteryStabilityTransfer(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 4]); const Qe = rint(rng, 2, 6); const a = k * Qe; const up = rng.next() < 0.5;
  const q = Q('fields', 'battery', {
    prompt: `Volt's battery bank charges by dQ/dt = ${a} − ${k}Q. A surge knocks the charge ${up ? 'above' : 'below'} its steady value. What happens next?`,
    expression: `dQ/dt = ${a} − ${k}Q`, answer: Qe,
    hint: 'Find the steady charge (dQ/dt = 0), then check the sign of dQ/dt on the side the surge pushed it.',
    steps: [`Steady: ${lab(a, 'charging rate')} − ${k}Q = 0 at Q = ${lab(Qe, 'steady charge')}.`, up ? `Above ${Qe}, dQ/dt < 0: the charge drains back.` : `Below ${Qe}, dQ/dt > 0: the charge climbs back.`, `Both sides push toward Q = ${Qe}: a stable equilibrium.`],
    app: 'Chargers are designed around a stable set-point so a surge dies out by itself.',
  });
  return choose(rng, q, `It ${up ? 'drains' : 'climbs'} back to Q = ${Qe}`, [`It keeps ${up ? 'rising' : 'falling'} away from Q = ${Qe}`, 'It stays at its new charge', `It oscillates around Q = ${Qe} forever`]);
}

/* ============================================================================================
 * Chapters
 * ========================================================================================== */
const fieldsSlope = (rng: Rng) => slopeAtStep(rng, 'fields', 'x');
const eulerSegs = (pts: [number, number][], color: Col): Seg[] => pts.slice(1).map((p, i) => ({ a: pts[i], b: p, color }));

const CHAPTERS: ChapterSpec[] = [
  {
    key: 'intro', title: 'What Is a Differential Equation?', wing: 'core', wingName: 'Core Control Room',
    goal: 'Read a differential equation as a rule for change, name its order, and check a candidate solution by substituting it.',
    misconception: 'Expecting the answer to be a number instead of a function; reading (y′)² as second order because of the power.',
    teach: [
      { title: 'The unknown is a function', text: 'An algebra equation asks for a number. A differential equation asks for a whole function, described by how it changes. y′ = 0.5y says: wherever you are, the slope is half the height. y = e^(0.5t) obeys that rule everywhere.', steps: ['At t = 2: y = e^(0.5 × 2) = e¹ ≈ 2.72 (height).', 'Slope from the rule: 0.5 (rate) × y = 0.5 × 2.72 (height) ≈ 1.36 (slope).', 'Differentiate: y′ = 0.5e^(0.5t), and at t = 2 that is also 0.5 × e¹ ≈ 1.36 (slope).', 'That is the tangent drawn at t = 2: it rises about 1.36 per unit of t.'], next: 'Move to t = 4 on the curve. What height do you read, and what slope does y′ = 0.5y predict there?', visual: plotV([0, 4, 0, 8], { fns: [{ fn: { kind: 'exp', a: 1, base: Math.exp(0.5) }, label: 'y' }], tangent: { fn: { kind: 'exp', a: 1, base: Math.exp(0.5) }, x: 2 } }) },
      { title: 'Order counts derivatives', text: 'The order is the highest derivative that appears. Powers do not count: (y′)² = y is still first order. A first-order law needs one starting value; a second-order law (like a spring) needs two.', steps: ['y″ + 4y = 0: the highest derivative is y″, so second order.', 'Check y = cos 2t at t = 0: y = 1 and y″ = −4cos 0 = −4.', 'y″ + 4y = −4 + 4 × 1 = 0 ✓', 'It needs two starting values: here y(0) = 1 and y′(0) = 0.', '(y′)² = y: the ² is a power, not a derivative, so first order.'], visual: card('Order', ['y′ = −3y: first order', 'y″ + 4y = 0: second order', '(y′)² = y: still first order']) },
      { title: 'Check by substituting', text: 'To test a candidate, put it in. y = 3t + 1 has y′ = 3, so y′ + y should equal the right side 3t + 4 for every t. Fill the last column and compare.', steps: ['Candidate y = 3t + 1, so y′ = 3 in every row.', 'When t is 0: y′ + y = 3 (slope) + 1 (y value) = 4 (left side), and 3 × 0 + 4 = 4 (right side) ✓', 'When t is 1: y′ + y = 3 (slope) + 4 (y value) = 7 (left side), and 3 × 1 + 4 = 7 (right side) ✓', 'When t is 2: y′ + y = 3 (slope) + 7 (y value) = 10 (left side), and 3 × 2 + 4 = 10 (right side) ✓'], model: { kind: 'table', cols: ['t', 'y', 'y′', 'y′ + y'], rows: [[0, 1, 3, null], [1, 4, 3, null], [2, 7, 3, null]], label: 'Right side 3t + 4: 4, 7, 10' } },
    ],
    quests: [
      { id: 'aq.diffeq.intro.reactor-laws', name: 'Reading the Reactor Laws', giver: 'vector', guided: true,
        hook: 'Vector: "The Reactor runs on laws of change, apprentice. Each one names a function by how it moves. Read them, test them, then pin down the one the Reactor follows."',
        change: 'The control room screens show the reactor laws, checked and signed.',
        waves: [wave('Name the order', mixOf([orderStep, orderStep, whichSolvesStep])), wave('Substitute and check', mixOf([verifyTableStep, verifySolutionVerdictStep, secondOrderCheckStep])), wave('Pin the constant', mixOf([verifyTableStep, constantBalanceStep, slopeAtStep]))] },
      { id: 'aq.diffeq.intro.oscillator-check', name: 'Law Inspection', giver: 'newton', hook: 'Newton: "My column\'s controllers claim to obey a stack of laws, from the oscillator itself to the coolant feeds. Substitute and tell me which claims are true."',
        change: 'Every controller on the column hums in tune with its law.',
        waves: [wave('Which law?', mixOf([secondOrderCheckStep, orderStep, slopeAtStep])), wave('Test the candidates', mixOf([verifyTableStep, verifySolutionVerdictStep, whichSolvesStep])), wave('One curve from many', mixOf([secondOrderCheckStep, constantBalanceStep, verifyTableStep]))] },
    ],
    concept: conceptFrom([verifyTableStep, verifySolutionVerdictStep, constantBalanceStep, whichSolvesStep, secondOrderCheckStep]),
    transfer: oneOf([orderTransfer, pendulumTransfer, dragRateTransfer]),
    practice: (rng) => slopeAtStep(rng).question,
  },
  {
    key: 'fields', title: 'Slope Fields & Equilibria', wing: 'core', wingName: 'Slope-Field Floor',
    goal: 'Read a slope field, match it to its equation, find equilibrium solutions and decide whether each is stable or unstable.',
    misconception: 'Mixing up slopes that depend on x with slopes that depend on y; believing solutions can cross an equilibrium line.',
    teach: [
      { title: 'Dashes are slopes', text: 'At each point, draw a short dash with the slope the equation gives there. For dy/dx = y the dashes are flat on the x-axis and steepen as you go up. Every solution curve runs along the dashes.', steps: ['dy/dx = y, so the dash at (x, y) has slope y.', 'At (2, 1.5): slope 1.5, so 0.5 (step right) × 1.5 (slope) = 0.75 (rise).', 'At (0, −1): slope −1, a dash tilting down.', 'On the x-axis y = 0: every dash is flat.'], next: 'Find the dashes along the line y = −2. Which way do they tilt, and how steep are they?', visual: plotV([-3, 3, -3, 3], { field: { a: 0, b: 1, c: 0 } }) },
      { title: 'Equilibria are flat lines', text: 'Where the right side is 0 the solution never changes: an equilibrium. For dy/dt = −(y − 2) that is y = 2. Solutions can approach it, but never cross it.', steps: ['Set the right side to 0: −(y − 2) = 0, so y = 2.', 'At y = 4: dy/dt = −(4 − 2) = −2 (rate), falling toward 2.', 'At y = 0: dy/dt = −(0 − 2) = 2 (rate), rising toward 2.', 'The dashes on the line y = 2 are flat: slope −(2 − 2) = 0.'], visual: plotV([0, 4, -1, 5], { field: { a: 0, b: -1, c: 2 }, hlines: [{ y: 2, label: 'y = 2' }] }) },
      { title: 'Stable or unstable', text: 'Check the sign of dy/dt just above and just below. For dy/dt = y² − 4 the equilibria are y = −2 and y = 2. Below −2 and between them the arrows point to −2: stable. Above 2 they point away from 2: unstable.', steps: ['y² − 4 = 0 at y = −2 and y = 2.', 'y = −3: (−3)² − 4 = 5 (rate) > 0, so y rises toward −2.', 'y = 0: 0² − 4 = −4 (rate) < 0, so y falls toward −2.', 'y = 3: 3² − 4 = 5 (rate) > 0, so y rises away from 2.', 'Those are the three arrows: two point into −2, one points away from 2.'], visual: plotV([-4, 4, -1, 1], { points: [{ x: -2, y: 0, label: 'stable' }, { x: 2, y: 0, label: 'unstable', color: 'orange' }], vectors: [{ x: 1.4, y: 0, from: [-3.8, 0] }, { x: -3.2, y: 0, from: [1.6, 0] }, { x: 1.4, y: 0, from: [2.4, 0] }] }) },
    ],
    quests: [
      { id: 'aq.diffeq.fields.field-map', name: 'Map the Field', giver: 'vector', guided: true, hook: 'Vector: "The reactor floor is painted with slope dashes. Learn to read them and you can see every future at once."',
        change: 'The slope-field floor glows: every dash matches its law.',
        waves: [wave('Match the field', mixOf([whichFieldStep, fieldsSlope, whichFieldStep])), wave('Find the calm lines', mixOf([equilibriumStep, stabilityStep, equilibriumStep])), wave('Follow a solution', mixOf([phaseLineStep, solutionCurveStep]))] },
      { id: 'aq.diffeq.fields.coolant-loop', name: 'Coolant Loop', giver: 'catalyst', hook: 'Dr. Catalyst: "The coolant loop has two resting temperatures. One is safe, one is a knife-edge. Tell me which is which."',
        change: 'The coolant loop settles on its stable set-point.',
        waves: [wave('Safe or knife-edge', mixOf([stabilityStep, phaseLineStep, fieldsSlope])), wave('Where it settles', mixOf([equilibriumStep, solutionCurveStep, phaseLineStep])), wave('Field check', mixOf([whichFieldStep, equilibriumStep]))] },
    ],
    concept: conceptFrom([equilibriumStep, phaseLineStep, whichFieldStep, solutionCurveStep]),
    transfer: oneOf([tankLevelTransfer, runawayVatTransfer, batteryStabilityTransfer]),
    practice: (rng) => fieldsSlope(rng).question,
  },
  {
    key: 'euler', title: "Euler's Method", wing: 'core', wingName: 'The Stepper Deck',
    goal: 'Step a solution forward with Euler\'s method, by hand and on the grid, and predict the direction and size of its error.',
    misconception: 'Thinking Euler\'s answer is exact, or that halving the step quarters the error.',
    teach: [
      { title: 'Walk the tangent', text: 'Stand at a point, read the slope from the equation, walk along that tangent for a step h, and repeat. The orange path follows dy/dt = t − y from (0, 1) with h = 1.', steps: ['At (0, 1): slope = 0 − 1 = −1.', 'Step h = 1: y₁ = 1 (y now) + 1 (step size h) × (−1) = 0 (new y), so walk to (1, 0).', 'At (1, 0): slope = 1 − 0 = 1, so y₂ = 0 (y now) + 1 (step size h) × 1 (slope) = 1 (new y).', 'Repeat: (2, 1), (3, 2), (4, 3), the corners of the orange path.'], next: 'Redo the first step from (0, 1) with h = 0.5. Where does it land?', visual: plotV([0, 4, -1, 4], { field: { a: 1, b: -1, c: 0 }, segments: eulerSegs([[0, 1], [1, 0], [2, 1], [3, 2], [4, 3]], 'orange'), points: [{ x: 0, y: 1, label: 'start' }] }) },
      { title: 'The recipe', text: 'slope = f(t, y); new y = y + h × slope; new t = t + h. Every simulator in the Engine runs this loop, just with smaller steps.', steps: ['y′ = 0.5y, y(0) = 2, h = 0.2.', 'slope = 0.5 × 2 (y now) = 1 (slope), so y₁ = 2 + 0.2 (step size h) × 1 = 2.2 (new y) at t = 0.2.', 'slope = 0.5 × 2.2 (y now) = 1.1 (slope), so y₂ = 2.2 + 0.2 (step size h) × 1.1 = 2.42 (new y) at t = 0.4.', 'Exact: y(0.4) = 2e^(0.2) ≈ 2.44 (true value), so Euler is a little low.'], visual: card("Euler's method", ['slope = f(t, y)', 'y ← y + h·slope', 't ← t + h', 'repeat']) },
      { title: 'Smaller steps, smaller error', text: 'For y′ = t from y(0) = 0, the true curve is teal. Orange steps with h = 1, pink with h = 0.5. Euler’s error is proportional to h, not h²: halve the step and the error halves.', steps: ['Exact: y = t²/2, so y(2) = 2²/2 = 2 (true value).', 'h = 1: y₁ = 0 + 1 × 0 = 0, y₂ = 0 + 1 × 1 = 1 (Euler). Error 2 (true) − 1 (Euler) = 1 (error).', 'h = 0.5: 0 → 0 → 0.25 → 0.75, then 0.75 + 0.5 (step size h) × 1.5 (slope) = 1.5 (Euler).', 'Error 2 (true) − 1.5 (Euler) = 0.5 (error): half the step, half the error.'], visual: plotV([0, 2, 0, 2.2], { fns: [{ fn: { kind: 'poly', c: [0, 0, 0.5] } }], segments: [...eulerSegs([[0, 0], [1, 0], [2, 1]], 'orange'), ...eulerSegs([[0, 0], [0.5, 0], [1, 0.25], [1.5, 0.75], [2, 1.5]], 'ask')] }) },
    ],
    quests: [
      { id: 'aq.diffeq.euler.stepper', name: 'The Stepper Deck', giver: 'ada', guided: true, hook: 'Ada: "The reactor\'s controller cannot solve equations. It can only take steps. Teach it to step well."',
        change: 'The stepper deck ticks forward, one tangent at a time.',
        waves: [wave('One step', mixOf([eulerOneStep, eulerPlotStep, eulerPlotStep])), wave('Step table', mixOf([eulerTableStep, eulerErrorStep])), wave('How far off?', mixOf([eulerTableStep, halveStepStep, eulerOneStep]))] },
      { id: 'aq.diffeq.euler.probe-drop', name: 'Probe Drop', giver: 'newton', hook: 'Newton: "I\'m dropping a probe into the core. Step its fall forward and tell me how much to trust the numbers."',
        change: 'The probe\'s simulated fall matches its telemetry.',
        waves: [wave('Walk the field', mixOf([eulerPlotStep, eulerOneStep, eulerErrorStep])), wave('March the table', mixOf([eulerTableStep, halveStepStep, eulerOneStep])), wave('Land it', mixOf([eulerTableStep, eulerPlotStep]))] },
    ],
    concept: conceptFrom([eulerTableStep, eulerPlotStep, eulerErrorStep]),
    transfer: oneOf([bioFilterEulerTransfer, dragEulerTransfer]),
    practice: (rng) => eulerOneStep(rng).question,
  },
  {
    key: 'separable', title: 'Separable Equations', wing: 'tanks', wingName: 'Separation Bench',
    goal: 'Recognise a separable equation, separate and integrate it, fix the constant from a starting value, and spot solutions that blow up.',
    misconception: 'Adding +C after exponentiating (e^(kx) + C instead of Ce^(kx)); treating a sum like x + y as separable.',
    teach: [
      { title: 'Separate the variables', text: 'If dy/dx is (a function of x) × (a function of y), move every y to the dy side and every x to the dx side, then integrate each side on its own.', steps: ['dy/dx = 2x·y: g(x) = 2x and h(y) = y.', 'dy/y = 2x dx, so ln|y| = x² + C and y = Ae^(x²).', 'Start y(0) = 3: A·e⁰ = A, so A = 3.', 'Check: when x is 1, y = 3e ≈ 8.15 (height) and dy/dx = 2 × 1 × 8.15 ≈ 16.3 (slope) ✓'], next: 'Is dy/dx = x + y separable? Try to write it as g(x) × h(y).', visual: card('Separable', ['dy/dx = g(x)·h(y)', 'dy / h(y) = g(x) dx', 'integrate both sides, add C once']) },
      { title: 'Where the constant goes', text: 'dy/y = k dx gives ln|y| = kx + C. Exponentiate: y = e^(kx + C) = e^C·e^(kx). The constant multiplies. Writing e^(kx) + C is the classic slip.', steps: ['dy/y = 0.5 dx with y(0) = 4.', 'ln|y| = 0.5x + C, so y = A·e^(0.5x).', 'When x is 0: A × e^0 = A = 4, so y = 4e^(0.5x).', 'The slip y = e^(0.5x) + 3 also starts at 4, but at x = 0 its slope is 0.5, not 0.5 × 4 = 2.'], visual: card('The constant', ['ln|y| = kx + C', 'y = C·e^(kx)', 'not e^(kx) + C']) },
      { title: 'Some solutions blow up', text: 'y′ = y² with y(0) = 1 gives y = 1/(1 − t). It is perfectly smooth, then shoots to infinity at t = 1. Separating shows you exactly when.', steps: ['dy/y² = dt, so −1/y = t + C.', 'y(0) = 1: −1/1 = 0 + C, so C = −1 and y = 1/(1 − t).', 't = 0.5: y = 1/(1 − 0.5) = 2. t = 0.9: y = 1/(1 − 0.9) = 10.', 'At t = 1 the bottom is 1 − 1 = 0: the curve runs off the top.'], next: 'Where does y′ = y² with y(0) = 2 blow up? Separate it the same way and find the t.', visual: plotV([0, 2, 0, 10], { fns: [{ fn: { kind: 'rational', num: [1], den: [1, -1] } }], vlines: [{ x: 1, label: 't = 1' }] }) },
    ],
    quests: [
      { id: 'aq.diffeq.separable.bench', name: 'Separation Bench', giver: 'catalyst', guided: true, hook: 'Dr. Catalyst: "Some reaction laws come apart cleanly: the x-stuff on one side, the y-stuff on the other. Separate them and they solve themselves."',
        change: 'The separation bench sorts every reagent into its flask.',
        waves: [wave('Can it separate?', mixOf([isSeparableStep, separateStep, solveSepStep])), wave('Integrate and fix C', mixOf([sepTableStep, sepConstantStep, solveSepStep])), wave('Runaway check', mixOf([blowupStep, ivpSepStep]))] },
      { id: 'aq.diffeq.separable.cooling-fins', name: 'Cooling Fins', giver: 'brick', hook: 'Brick: "The fin cutters need exact profiles. Solve the curves and give me numbers I can machine."',
        change: 'New cooling fins bolt onto the reactor casing.',
        waves: [wave('Separate', mixOf([separateStep, sepConstantStep, ivpSepStep])), wave('Profiles', mixOf([sepTableStep, isSeparableStep, blowupStep])), wave('Constants', mixOf([sepConstantStep, solveSepStep]))] },
    ],
    concept: conceptFrom([sepTableStep, sepConstantStep, blowupStep, solveSepStep]),
    transfer: oneOf([torricelliTransfer, boatTransfer, reactionSepTransfer]),
    practice: (rng) => ivpSepStep(rng).question,
  },
  {
    key: 'growth', title: 'Growth, Decay & Cooling', wing: 'tanks', wingName: 'Isotope Vault',
    goal: 'Model growth and decay with dA/dt = kA, work with half-lives and doubling times, and apply Newton\'s law of cooling.',
    misconception: 'Thinking decay or cooling drops by the same amount each step (linear), or that an object cools toward 0° instead of the room.',
    teach: [
      { title: 'Rate proportional to amount', text: 'dA/dt = kA: the more there is, the faster it changes. The solution is A = A₀e^(kt): growth when k > 0, decay when k < 0. Equal times multiply by equal factors.', steps: ['A₀ = 50 g, k = 0.1 per hour.', 'Rate now: dA/dt = 0.1 (rate per hour) × 50 (grams) = 5 (grams per hour).', 'After 10 (hours): A = 50e^(0.1 × 10) = 50e ≈ 135.9 (grams).', 'After 20 (hours): A = 50e^(0.1 × 20) = 50e² ≈ 369.5 (grams): another × e.'], next: 'Make k = −0.1 instead. How much is left after 10 hours?', visual: card('Exponential law', ['dA/dt = kA', 'A = A₀·e^(kt)', 'k > 0 grows · k < 0 decays']) },
      { title: 'Half-life', text: 'Decay halves the amount in equal times: 16 → 8 → 4 → 2. Each half-life removes half of what is left, so the drops get smaller. k = (ln 2)/half-life.', steps: ['Start at 16 with a half-life of 1 time unit.', 't = 1: 16 (amount) × 0.5 = 8 (left). t = 2: 8 × 0.5 = 4 (left). t = 3: 4 × 0.5 = 2 (left).', 'The drops are 16 − 8 = 8 (drop), then 4, then 2: each half the last.', 'k = ln 2 ÷ 1 (half-life) ≈ 0.693 (decay rate), so A = 16e^(−(ln 2)t) ≈ 16e^(−0.693t).'], visual: plotV([0, 5, 0, 16], { fns: [{ fn: { kind: 'exp', a: 16, base: 0.5 } }], points: [{ x: 1, y: 8, label: '8' }, { x: 2, y: 4, label: '4' }, { x: 3, y: 2, label: '2' }] }) },
      { title: "Newton's law of cooling", text: 'dT/dt = −k(T − T_room): the gap to the room decays exponentially, so a hot part cools fast at first, then slowly, and levels off at room temperature, never at 0.', steps: ['Start 90°, room 20°, and k = 0.35 (cooling rate).', 'Start gap: 90 (start in degrees) − 20 (room in degrees) = 70 (gap in degrees).', 'First rate: dT/dt = −0.35 (cooling rate) × 70 (gap) = −24.5 (degrees per minute).', 't = 2 (minutes): gap = 70e^(−0.35 × 2) ≈ 34.8 (gap), so T ≈ 20 + 34.8 = 54.8 (degrees).', 't = 10 (minutes): gap = 70e^(−3.5) ≈ 2.1 (gap), so T ≈ 20 + 2.1 = 22.1 (degrees): near the room, not 0.'], visual: plotV([0, 10, 0, 100], { fns: [{ fn: { kind: 'exp', a: 70, base: Math.exp(-0.35), k: 20 } }], hlines: [{ y: 20, label: 'room 20°' }] }) },
    ],
    quests: [
      { id: 'aq.diffeq.growth.isotope-vault', name: 'Isotope Vault', giver: 'catalyst', guided: true, hook: 'Dr. Catalyst: "The vault holds spent fuel and tracer isotopes. Tell me how much is left and when it is safe."',
        change: 'The isotope vault\'s decay clocks read true.',
        waves: [wave('Write the law', mixOf([growthModelStep, halfLifeTableStep, rateFromHalfLifeStep])), wave('Half-lives', mixOf([halfLifePlotStep, halfLifeTypedStep, doublingStep])), wave('Read the curve', mixOf([halfLifeTableStep, decayGraphStep]))] },
      { id: 'aq.diffeq.growth.cooling-hall', name: 'Cooling Hall', giver: 'brick', hook: 'Brick: "Forged beams come out glowing. Tell me when my crew can touch them, and do not tell me they cool at a steady rate."',
        change: 'The cooling hall\'s timers call each beam safe at the right minute.',
        waves: [wave('Not a straight line', mixOf([coolingLinearStep, coolingStep, decayGraphStep])), wave('Time it', mixOf([coolingSliderStep, coolingStep, coolingGapPlotStep])), wave('Hall check', mixOf([coolingSliderStep, coolingGapPlotStep]))] },
    ],
    concept: conceptFrom([halfLifeTableStep, coolingSliderStep, halfLifePlotStep, decayGraphStep]),
    transfer: oneOf([dosageTransfer, carbonTransfer, bacteriaTransfer]),
    practice: (rng) => halfLifeTypedStep(rng).question,
  },
  {
    key: 'linear', title: 'Linear Equations & Mixing Tanks', wing: 'tanks', wingName: 'Mixing Tank Floor',
    goal: 'Solve y′ + p·y = q with an integrating factor, find steady states, and model mixing tanks as rate in minus rate out.',
    misconception: 'Forgetting to divide by the y′ coefficient before reading p; using the flow rate instead of flow × concentration (Q/V) for what leaves a tank.',
    teach: [
      { title: 'Standard form', text: 'Divide so y′ stands alone: y′ + p(t)·y = q(t). 2y′ + 6y = 4 becomes y′ + 3y = 2, so p = 3, not 6.', steps: ['2y′ + 6y = 4: divide every term by 2.', '2y′ ÷ 2 = y′, 6y ÷ 2 = 3y, 4 ÷ 2 = 2.', 'y′ + 3y = 2, so p = 3 and q = 2.'], visual: card('Standard form', ['y′ + p(t)·y = q(t)', '2y′ + 6y = 4 → y′ + 3y = 2']) },
      { title: 'The integrating factor', text: 'By the product rule (μy)′ = μy′ + μ′y. That equals μ(y′ + py) exactly when μ′ = pμ, so μ = e^(∫p dt). Then (μy)′ = μq: integrate and divide by μ. When p = k and q are constants, every solution is q/k + Ce^(−kt).', steps: ['y′ + 2y = 6: p = 2, so μ = e^(∫2 dt) = e²ᵗ.', '∫6e²ᵗ dt = 3e²ᵗ + C, so y = 3 + Ce⁻²ᵗ (and q/k = 6 ÷ 2 = 3).', 'Start y(0) = 1: 3 + C = 1, so C = −2.', 'Check t = 0.5: y = 3 − 2e⁻¹ ≈ 2.26, y′ = 4e⁻¹ ≈ 1.47, and 1.47 + 2 × 2.26 ≈ 6 ✓'], visual: card('Worked example', ['y′ + 2y = 6', 'μ = e²ᵗ', '(e²ᵗy)′ = 6e²ᵗ', 'e²ᵗy = 3e²ᵗ + C', 'y = 3 + Ce⁻²ᵗ']) },
      { title: 'Rate in − rate out', text: 'A tank of V litres with Q grams of salt: in = flow × incoming concentration; out = flow × Q/V. A 100 L tank fed 2 g/L brine at 5 L/min obeys dQ/dt = 10 − Q/20. From any start (0, 100 or 400 g) it settles where in = out: Q = 2 × 100 = 200 g.', steps: ['In: 5 (flow in L/min) × 2 (brine in g/L) = 10 (salt in, g/min).', 'Out: 5 (flow in L/min) × Q ÷ 100 (tank in L), which is Q/20 g/min.', 'Balance: 10 = Q/20, so Q = 10 × 20 = 200 (salt in g).', 'Start 0 g: dQ/dt = 10 − 0/20 = 10 (g/min), rising. Start 400 g: 10 − 400/20 = −10 (g/min), falling.'], next: 'Double the incoming brine to 4 g/L. Where does the tank settle now?', visual: plotV([0, 100, 0, 420], { fns: [0, 100, 400].map((Q0) => ({ fn: { kind: 'exp' as const, a: Q0 - 200, base: Math.exp(-1 / 20), k: 200 } })), hlines: [{ y: 200, label: 'Q∞ = c_in·V = 200 g' }] }) },
    ],
    quests: [
      { id: 'aq.diffeq.linear.integrating-factor', name: 'The Integrating Factor', giver: 'vector', guided: true, hook: 'Vector: "Linear laws have a master key: the integrating factor. Turn it and any heater, charger or tank model opens."',
        change: 'The master key turns: every linear controller in the hall reports its steady state.',
        waves: [wave('Standard form', mixOf([standardFormStep, integratingFactorStep, integratingFactorStep])), wave('Solve it', mixOf([steadyStateStep, linearSolveStep, icTableStep])), wave('Long run', mixOf([steadyStateStep, linearLimitStep]))] },
      { id: 'aq.diffeq.linear.brine-tanks', name: 'Brine Tanks', giver: 'catalyst', hook: 'Dr. Catalyst: "Brine in, mixture out. Write the law, march it forward, and tell me where each tank settles."',
        change: 'The mixing tanks hold steady at the right salinity.',
        waves: [wave('Write the law', mixOf([mixingDEStep, mixingRateStep, mixingEulerTable])), wave('Where it settles', mixOf([mixingEqStep, mixingGraphStep, mixingRateStep])), wave('Tank check', mixOf([mixingEqStep, mixingEulerTable]))] },
    ],
    concept: conceptFrom([steadyStateStep, icTableStep, mixingEqStep, mixingGraphStep]),
    transfer: oneOf([terminalVelocityTransfer, rcChargeTransfer, lakeTransfer]),
    practice: (rng) => linearLimitStep(rng).question,
  },
  {
    key: 'logistic', title: 'The Logistic Equation', wing: 'tanks', wingName: 'Bio-Reactor',
    goal: 'Use dP/dt = rP(1 − P/K): find the carrying capacity, classify both equilibria, and know growth is fastest at K/2.',
    misconception: 'Believing growth is always exponential, or that growth is fastest when the population is largest.',
    teach: [
      { title: 'Growth with brakes', text: 'dP/dt = rP(1 − P/K). When P is small, (1 − P/K) ≈ 1 and growth looks exponential. As P nears K the bracket shrinks to 0 and growth stops.', steps: ['Take r = 0.5, K = 1000.', 'When P is 10: 0.5 × 10 × (1 − 10/1000) = 4.95 (growth rate), almost rP = 5.', 'When P is 500: 0.5 × 500 × (1 − 0.5) = 125 (growth rate).', 'When P is 990: 0.5 × 990 × (1 − 0.99) = 4.95 (growth rate): nearly stopped.'], visual: card('Logistic law', ['dP/dt = rP(1 − P/K)', 'small P: like rP', 'P → K: growth → 0']) },
      { title: 'Two equilibria', text: 'P = 0 and P = K. Between them dP/dt > 0; above K it is negative. Everything flows to K (stable) and away from 0 (unstable).', steps: ['dP/dt = P(1 − P/10) is 0 at P = 0 and P = 10.', 'When P is 5: 5 × (1 − 5/10) = 2.5 (growth rate) > 0, rising to 10.', 'When P is 12: 12 × (1 − 12/10) = −2.4 (growth rate) < 0, falling to 10.', 'When P is 0.1: 0.1 × (1 − 0.01) = 0.099 (growth rate) > 0, moving away from 0.'], visual: { type: 'numline', min: -2, max: 12, points: [{ x: 0, label: 'unstable' }, { x: 10, label: 'K, stable' }] } },
      { title: 'The S-curve', text: 'From a small start the curve rises slowly, speeds up, and bends over as it nears K. The bend (fastest growth) happens at P = K/2.', steps: ['Here r = 1, K = 10, P(0) = 1: P = 10/(1 + 9e^(−t)).', 't = ln 9 ≈ 2.2: 9e^(−ln 9) = 1, so P = 10/(1 + 1) = 5 = K/2.', 'Rate there: 1 × 5 × (1 − 5/10) = 2.5 (growth rate), the steepest point.', 'At P = 8 the rate is only 8 × (1 − 8/10) = 1.6 (growth rate).'], next: 'Work out the rate at P = 2. How does it compare with P = 8, and why?', visual: plotV([0, 10, 0, 12], { segments: curve((t) => 10 / (1 + 9 * Math.exp(-t)), 0, 10), hlines: [{ y: 10, label: 'K' }], points: [{ x: r4(Math.log(9)), y: 5, label: 'K/2: fastest' }] }) },
    ],
    quests: [
      { id: 'aq.diffeq.logistic.algae-bloom', name: 'Algae Bloom', giver: 'catalyst', guided: true, hook: 'Dr. Catalyst: "The bio-reactor\'s algae feed the fuel line, but the tank can only hold so much. Find the limit and the sweet spot."',
        change: 'The bio-reactor glows green at its best harvest level.',
        waves: [wave('Find the limit', mixOf([logisticRateStep, logisticKBalance, logisticEqLine])), wave('The sweet spot', mixOf([logisticTableStep, inflectionStep, logisticCurveStep])), wave('Harvest', mixOf([maxGrowthSlider, logisticRateStep]))] },
      { id: 'aq.diffeq.logistic.culture-control', name: 'Culture Control', giver: 'vector', hook: 'Vector: "Every growth story in the Engine ends in a limit. Read this culture\'s law and predict its whole life."',
        change: 'The culture monitors predict each colony to the day.',
        waves: [wave('Equilibria', mixOf([logisticEqLine, logisticCurveStep, logisticRateStep])), wave('Fastest growth', mixOf([maxGrowthSlider, logisticKBalance, inflectionStep])), wave('The whole curve', mixOf([logisticTableStep, logisticCurveStep]))] },
    ],
    concept: conceptFrom([logisticEqLine, maxGrowthSlider, logisticTableStep, logisticCurveStep]),
    transfer: oneOf([rumorTransfer, harvestTransfer, epidemicTransfer]),
    practice: (rng) => logisticRateStep(rng).question,
  },
  {
    key: 'second', title: 'Second-Order Linear Equations', wing: 'column', wingName: 'Oscillator Column',
    goal: 'Turn ay″ + by′ + cy = 0 into its characteristic equation, handle distinct, repeated and complex roots, and fit two initial conditions.',
    misconception: 'Writing C₁eʳᵗ + C₂eʳᵗ for a repeated root; dropping the y term from the characteristic equation.',
    teach: [
      { title: 'Guess eʳᵗ', text: 'Try y = eʳᵗ: y′ = reʳᵗ and y″ = r²eʳᵗ. Every term shares eʳᵗ, which is never 0, so ay″ + by′ + cy = 0 becomes ar² + br + c = 0. Calculus becomes algebra.', steps: ['y″ − 3y′ + 2y = 0 becomes r² − 3r + 2 = 0.', '(r − 1)(r − 2) = 0, so r = 1 or r = 2: y = C₁eᵗ + C₂e²ᵗ.', 'Check y = e²ᵗ at t = 0: y = 1, y′ = 2, y″ = 4.', '4 − 3 × 2 + 2 × 1 = 0 ✓'], next: 'Write the characteristic equation for y″ + 4y′ + 3y = 0. What are its roots?', visual: card('Characteristic equation', ['y = eʳᵗ', 'ay″ + by′ + cy = 0', '→ ar² + br + c = 0']) },
      { title: 'Three kinds of roots', text: 'Two real roots: two exponentials. One repeated root r: eʳᵗ and teʳᵗ (substituting teʳᵗ works only because r is a double root). Complex roots α ± βi: e^(αt) times cos βt and sin βt. Check: y = cos 2t has y″ = −4cos 2t, so it solves y″ + 4y = 0, whose roots are ±2i. Euler\'s formula e^(iβt) = cos βt + i sin βt is the general reason.', steps: ['r² + 4r + 3 = 0: r = −1, −3, so y = C₁e⁻ᵗ + C₂e⁻³ᵗ.', 'r² + 4r + 4 = (r + 2)² = 0: r = −2 twice, so y = (C₁ + C₂t)e⁻²ᵗ.', 'r² + 2r + 5 = 0: r = (−2 ± √(4 − 20))/2 = −1 ± 2i.', 'So y = e⁻ᵗ(C₁cos 2t + C₂sin 2t).'], visual: card('Solutions', ['r₁ ≠ r₂: C₁e^(r₁t) + C₂e^(r₂t)', 'r repeated: (C₁ + C₂t)eʳᵗ', 'α ± βi: e^(αt)(C₁cos βt + C₂sin βt)']) },
      { title: 'Roots decide the shape', text: 'Complex roots mean oscillation; the real part α sets whether it dies (α < 0), stays (α = 0) or grows (α > 0). This trace has roots −0.4 ± 1.96i.', steps: ['The trace solves y″ + 0.8y′ + 4y = 0.', 'r = (−0.8 ± √(0.64 − 16))/2 ≈ −0.4 ± 1.96i.', 'α = −0.4: the swings shrink like e^(−0.4t); at t = 8, e^(−0.4 × 8) ≈ 0.04 (envelope).', 'β ≈ 1.96: one swing lasts 2π/1.96 ≈ 3.2 (period), so about 2.5 swings by t = 8.'], visual: plotV([0, 8, -1.2, 1.2], { segments: curve(spring(1, 0.8, 4), 0, 8, 'teal', 64) }) },
    ],
    quests: [
      { id: 'aq.diffeq.second.char-roots', name: 'Characteristic Roots', giver: 'vector', guided: true, hook: 'Vector: "Second-order laws hide their behaviour in two numbers, the characteristic roots. Find them and you know how the column will move."',
        change: 'The column\'s root gauges light up in pairs.',
        waves: [wave('Build the equation', mixOf([charEqStep, charParabolaStep, rootTypeStep])), wave('Three cases', mixOf([generalSolStep, rootsNumberlineStep, complexTableStep])), wave('Fit the start', mixOf([ivpSecondTable, charRootTyped]))] },
      { id: 'aq.diffeq.second.pump-shaft', name: 'Pump Shaft', giver: 'ada', hook: 'Ada: "The main pump shaft is humming. Tell me from its equation whether it rings, creeps or runs away."',
        change: 'The pump shaft spins quietly on retuned bearings.',
        waves: [wave('Kind of roots', mixOf([rootTypeStep, charParabolaStep, charRootTyped])), wave('Read the trace', mixOf([complexTableStep, whichGraphSecond, generalSolStep])), wave('Set it running', mixOf([oscParabolaPick, rootsNumberlineStep, ivpSecondTable]))] },
    ],
    concept: conceptFrom([charParabolaStep, complexTableStep, rootsNumberlineStep, whichGraphSecond, oscParabolaPick]),
    transfer: oneOf([buildingSwayTransfer, shaftTransfer]),
    practice: (rng) => charRootTyped(rng).question,
  },
  {
    key: 'oscillators', title: 'Springs, Damping & RLC Circuits', wing: 'column', wingName: 'Spring–Mass Column',
    goal: 'Find natural frequencies, classify damping by comparing c² with 4mk, and read RLC circuits as the same equation.',
    misconception: 'Thinking more damping always returns faster (overdamped is slower than critical); seeing circuits and springs as unrelated.',
    teach: [
      { title: 'Mass, damper, spring', text: 'mx″ + cx′ + kx = 0. With no damper it oscillates at ω₀ = √(k/m). The characteristic equation is mr² + cr + k = 0, so everything hangs on c² − 4mk.', steps: ['m = 1 kg, k = 4 N/m: ω₀ = √(4 (spring constant) ÷ 1 (mass in kg)) = 2 (natural frequency in rad/s).', '4mk = 4 × 1 (mass in kg) × 4 (spring constant) = 16, and 4² = 16, so c = 4 (critical damper).', 'c = 1 (damper): c² = 1 < 16, so r = (−1 ± √(1 − 16))/2 ≈ −0.5 ± 1.94i: it rings.'], visual: card('Spring–mass', ['mx″ + cx′ + kx = 0', 'ω₀ = √(k/m)', 'compare c² with 4mk']) },
      { title: 'Three ways back', text: 'Underdamped (teal, c² < 4mk) overshoots and rings. Critical (orange, c² = 4mk) returns fastest without crossing. Overdamped (pink, c² > 4mk) creeps back slowly.', steps: ['All three: 4mk = 4 × 1 (mass in kg) × 4 (spring constant) = 16.', 'Teal c = 1: c² = 1 < 16, underdamped.', 'Orange c = 4: c² = 4² = 16, critical: r = −2 twice.', 'Pink c = 10: c² = 100 > 16, r = −5 ± √21 ≈ −0.42, −9.58. The slow −0.42 makes it creep.'], next: 'Picture c = 2 on the same spring. Which of the three shapes do you get?', visual: plotV([0, 8, -1, 1.2], { segments: [...curve(spring(1, 1, 4), 0, 8, 'teal', 64), ...curve(spring(1, 4, 4), 0, 8, 'orange', 48), ...curve(spring(1, 10, 4), 0, 8, 'ask', 48)] }) },
      { title: 'Circuits are springs', text: 'An RLC loop obeys Lq″ + Rq′ + q/C = 0: inductance acts like mass, resistance like the damper, 1/C like the spring. Same maths, same three cases, ω₀ = 1/√(LC).', steps: ['L is 0.5 H and C is 0.02 F, so LC = 0.5 × 0.02 = 0.01.', 'ω₀ = 1/√0.01 = 1/0.1 = 10 (natural frequency in rad/s).', 'Critical when R² = 4L/C = 4 × 0.5 ÷ 0.02 = 100, so R = 10 (critical resistance in ohms).', 'R = 4 Ω: R² = 16 < 100, underdamped: the current rings.'], visual: card('Spring ↔ circuit', ['m ↔ L', 'c ↔ R', 'k ↔ 1/C', 'ω₀ = 1/√(LC)']) },
    ],
    quests: [
      { id: 'aq.diffeq.oscillators.spring-column', name: 'The Spring Column', giver: 'newton', guided: true, hook: 'Newton: "The tall spring column steadies the reactor against shocks. Tune its damper so it settles without ringing."',
        change: 'The spring column absorbs a test shock and settles in one smooth move.',
        waves: [wave('How it moves', mixOf([naturalFreqStep, dampingTypeStep, dampingGraphStep, fastestDamperStep])), wave('Tune the damper', mixOf([criticalSlider, springRootsTable, dampingTypeStep])), wave('Final tuning', mixOf([criticalSlider, naturalFreqStep]))] },
      { id: 'aq.diffeq.oscillators.rlc-tank', name: 'RLC Tank Circuit', giver: 'volt', hook: 'Volt: "My control circuit is a spring made of electrons. Same equation, different parts. Tune it."',
        change: 'The reactor\'s RLC circuits hum at their design frequency.',
        waves: [wave('Read the circuit', mixOf([rlcFreqStep, rlcTypeStep, rlcRootsTable])), wave('Tune R', mixOf([rlcCriticalSlider, (r: Rng) => dampingGraphStep(r, true), rlcTypeStep])), wave('Sign off', mixOf([rlcTuneSlider, rlcFreqStep]))] },
    ],
    concept: conceptFrom([criticalSlider, fastestDamperStep, dampingGraphStep, rlcCriticalSlider, rlcTuneSlider]),
    transfer: oneOf([suspensionTransfer, lcRadioTransfer, towerFreqTransfer]),
    practice: (rng) => naturalFreqStep(rng).question,
  },
  {
    key: 'forced', title: 'Forcing & Resonance', wing: 'column', wingName: 'Driven Piston Bay',
    goal: 'Find particular solutions by undetermined coefficients for constant, polynomial, exponential and cosine forcing, and recognise resonance.',
    misconception: 'Guessing only A cos ωt when damping also makes sin ωt; forgetting the extra t when the forcing already solves the unforced equation.',
    teach: [
      { title: 'Free plus forced', text: 'For ay″ + by′ + cy = g(t), the general solution is yₕ + yₚ: the unforced solution with its two constants, plus any one solution that produces g.', steps: ['y″ + 3y′ + 2y = 4.', 'yₕ: r² + 3r + 2 = 0 gives r = −1, −2, so yₕ = C₁e⁻ᵗ + C₂e⁻²ᵗ.', 'yₚ: try y = A, so 0 + 0 + 2A = 4 and A = 2.', 'y = C₁e⁻ᵗ + C₂e⁻²ᵗ + 2: the free part dies away, leaving 2.'], next: 'Change the forcing from 4 to 10. What is the new yₚ?', visual: card('Structure', ['y = yₕ + yₚ', 'yₕ: solves the = 0 equation', 'yₚ: one solution with the forcing']) },
      { title: 'Guess the shape', text: 'Copy the forcing\'s shape with unknown coefficients, include every term its derivatives create, then substitute and match. If the guess already solves the unforced equation, multiply by t.', steps: ['y″ + 3y′ + 2y = 12e²ᵗ: guess yₚ = Ae²ᵗ.', 'y′ = 2Ae²ᵗ and y″ = 4Ae²ᵗ.', '4A + 3 × 2A + 2A = 12A = 12, so A = 1 and yₚ = e²ᵗ.', 'Forcing e⁻ᵗ would clash: r = −1 already solves the = 0 equation, so guess Ate⁻ᵗ.'], visual: card('Trial forms', ['constant → A', 'mt + n → At + B', 'e^(kt) → Ae^(kt)', 'cos ωt → A cos ωt + B sin ωt']) },
      { title: 'Resonance', text: 'Drive an undamped spring at its natural frequency and yₚ gets a factor of t: y″ + 4y = cos 2t gives y = t·sin(2t)/4, swings that grow and grow.', steps: ['r² + 4 = 0 gives r = ±2i: natural frequency 2, the same as the drive cos 2t.', 'Guess yₚ = Bt sin 2t: then yₚ″ + 4yₚ = 4B cos 2t, so 4B = 1 and B = 1/4.', 'The envelope is t/4: the swings touch the dashed lines ±t/4 at every peak, so near t = 8 they are about 8 (time) ÷ 4 = 2 (swing height).', 'The last peak, near t ≈ 14.9, reaches about 14.9 (time) ÷ 4 ≈ 3.7 (swing height), and the swings keep growing.'], visual: plotV([0, 16, -4.5, 4.5], { segments: curve((t) => (t * Math.sin(2 * t)) / 4, 0, 16, 'teal', 96), fns: [{ fn: { kind: 'poly', c: [0, 0.25] }, color: 'muted', dashed: true }, { fn: { kind: 'poly', c: [0, -0.25] }, color: 'muted', dashed: true }] }) },
    ],
    quests: [
      { id: 'aq.diffeq.forced.driven-piston', name: 'Driven Piston', giver: 'vector', guided: true, hook: 'Vector: "The feed piston is driven by a motor. Its free motion you know; now find the motion the motor forces on it."',
        change: 'The feed piston tracks its drive without a shudder.',
        waves: [wave('Guess the shape', mixOf([(r: Rng) => guessFormStep(r), constantForcingBalance, guessResonantFormStep])), wave('Fix the numbers', mixOf([expForcingBalance, linearForcingTable, fullSolutionStep])), wave('Driven waves', mixOf([cosForcingTyped, expForcingBalance]))] },
      { id: 'aq.diffeq.forced.bridge-resonance', name: 'Bridge Resonance', giver: 'newton', hook: 'Newton: "The walkway over the core sways when crews march across it. Find the frequency we must never drive it at."',
        change: 'Signs on the walkway read: break step, resonance at the posted frequency.',
        waves: [wave('Danger frequency', mixOf([resonanceStep, resonanceSlider, resonanceGraph])), wave('Forced response', mixOf([cosForcingTyped, (r: Rng) => guessFormStep(r), linearForcingTable])), wave('Walkway check', mixOf([resonanceSlider, constantForcingBalance]))] },
    ],
    concept: conceptFrom([guessResonantFormStep, expForcingBalance, linearForcingTable, resonanceSlider]),
    transfer: oneOf([washerTransfer, bridgeTransfer, dcCircuitTransfer]),
    practice: (rng) => cosForcingTyped(rng).question,
  },
  {
    key: 'systems', title: 'Systems & Phase Portraits', wing: 'deck', wingName: 'Twin-Loop Control Deck',
    goal: 'Write coupled equations as x′ = Ax, find eigenvalues and eigenvectors, locate equilibria, and classify nodes, saddles and spirals.',
    misconception: 'Calling a saddle stable because one eigenvalue is negative; ignoring the imaginary part that makes a spiral.',
    teach: [
      { title: 'Two coupled rates', text: 'When two quantities feed each other, x′ = ax + by and y′ = cx + dy. As a matrix: x′ = Ax. A point in the plane is a state; its arrow is where it goes next.', steps: ['x′ = −2x + y, y′ = x − 2y, so A = [[−2, 1], [1, −2]].', 'At the state (1, 0): x′ = −2 × 1 + 0 = −2, y′ = 1 − 2 × 0 = 1.', 'Its arrow is (−2, 1): x shrinks while y grows.', 'At (1, 1): x′ = −2 + 1 = −1, y′ = 1 − 2 = −1: heading in toward the origin.'], next: 'Work out the arrow at the state (0, 1). Which way does it move?', visual: card('Linear system', ['x′ = ax + by', 'y′ = cx + dy', 'x′ = A·x']) },
      { title: 'Eigenvalues rule', text: 'Solutions e^(λt)v move along eigenvectors v at rate λ. The eigenvalues solve λ² − (trace)λ + det = 0, and their signs tell you everything near the origin.', steps: ['Same A: trace = −2 + (−2) = −4, det = (−2)(−2) − 1 × 1 = 3.', 'λ² + 4λ + 3 = 0, so (λ + 1)(λ + 3) = 0: λ = −1, −3.', 'Both negative: a stable node.', 'Eigenvector (1, 1): A·(1, 1) = (−2 + 1, 1 − 2) = (−1, −1), which is −1 × (1, 1) ✓'], visual: card('Classify by λ', ['both negative: stable node', 'both positive: unstable node', 'opposite signs: saddle', 'complex: spiral (or center)']) },
      { title: 'A saddle', text: 'Eigenvalues 1 and −1: trajectories slide in along one eigenvector and are flung out along the other. One negative eigenvalue is not enough for stability.', steps: ['A = [[1, 0], [0, −1]]: x′ = x and y′ = −y.', 'trace = 1 + (−1) = 0, det = 1 × (−1) − 0 = −1 < 0: opposite signs.', 'λ = 1 along the x-axis, λ = −1 along the y-axis.', 'Start (0.15, 3): at t = 3, x = 0.15e³ ≈ 3.01, y = 3e⁻³ ≈ 0.15. In along y, out along x.'], visual: portraitVisual('saddle') },
    ],
    quests: [
      { id: 'aq.diffeq.systems.twin-loops', name: 'Twin Loops', giver: 'vector', guided: true, hook: 'Vector: "The two coolant loops share a heat exchanger, so each one\'s change depends on both. Find the eigenvalues and you know the pair."',
        change: 'The twin-loop display shows a calm, stable phase portrait.',
        waves: [wave('Trace and eigenvalues', mixOf([traceDetTable, eigenTable, classifyStep])), wave('Draw the portrait', mixOf([portraitPick, eigenvectorLine, classifyStep])), wave('Balance point', mixOf([equilibriumSystemPlot, eigenTyped]))] },
      { id: 'aq.diffeq.systems.coupled-tanks', name: 'Coupled Tanks', giver: 'catalyst', hook: 'Dr. Catalyst: "Two tanks pump into each other. Is the pair steady, or will one drain the other?"',
        change: 'The coupled tanks hold level together.',
        waves: [wave('Set up', mixOf([equilibriumSystemPlot, convertStep, eigenTable])), wave('Classify', mixOf([classifyStep, portraitPick, eigenvectorLine])), wave('Confirm', mixOf([traceDetTable, classifyStep]))] },
    ],
    concept: conceptFrom([eigenTable, eigenvectorLine, equilibriumSystemPlot, portraitPick]),
    transfer: oneOf([coupledTanksTransfer, predatorTransfer, drugCompartmentTransfer]),
    practice: (rng) => eigenTyped(rng).question,
  },
  {
    key: 'laplace', title: 'The Laplace Transform', wing: 'deck', wingName: 'Transform Switchboard',
    goal: 'Transform functions with the table, turn derivatives into algebra with sY − y(0), solve a simple initial value problem, and read poles.',
    misconception: 'Sign slips between 1/(s − a) and e^(at); swapping the sin and cos entries; forgetting the initial values in ℒ{y′}.',
    teach: [
      { title: 'An integral that eats derivatives', text: 'ℒ{f} = ∫₀^∞ e^(−st)f(t) dt turns a function of t into a function of s. For f = 1 at s = 1 it is the shaded area under e^(−t): exactly 1, and in general ℒ{1} = 1/s. Its superpower: ℒ{y′} = sY − y(0). Derivatives become multiplication.', steps: ['ℒ{1} = ∫₀^∞ e^(−st) dt = [−e^(−st)/s] from 0 to ∞ = 1/s.', 'At s = 1 the area is 1/1 = 1; the part shaded up to t = 6 is 1 − e^(−6) ≈ 0.998.', 'Rule check with y = e^(2t): Y = 1/(s − 2) and y(0) = 1.', 'sY − y(0) = s/(s − 2) − 1 = 2/(s − 2), which is ℒ{2e^(2t)} = ℒ{y′} ✓'], next: 'Picture the same area at s = 2, under e^(−2t). What is it?', visual: plotV([0, 6, 0, 1.1], { fns: [{ fn: { kind: 'exp', a: 1, base: Math.exp(-1) }, label: 'e^(−t)' }], shade: { fn: { kind: 'exp', a: 1, base: Math.exp(-1) }, a: 0, b: 6 } }) },
      { title: 'The table', text: 'You rarely integrate: a short table covers most models. Read it forwards to transform and backwards to invert.', steps: ['sin 3t → 3/(s² + 9), since b = 3 and b² = 3² = 9.', 'ℒ{3 + 2e^(−t)} = 3/s + 2/(s + 1): transform term by term.', 'Backwards: 5/(s − 4) = 5 × 1/(s − 4), so it came from 5e^(4t).', 'Mind the sign: 1/(s + 2) = 1/(s − (−2)) comes from e^(−2t).'], visual: card('Transform table', ['1 → 1/s', 't → 1/s²', 'e^(at) → 1/(s − a)', 'sin bt → b/(s² + b²)', 'cos bt → s/(s² + b²)']) },
      { title: 'Solve in s, come back', text: 'Transform, solve for Y(s), split it into table entries, and read the table backwards. Each pole p of Y (where it blows up) gives an e^(pt) term. Y = 1/((s + 3)(s² + 2s + 5)) has poles −3 and −1 ± 2i: terms e^(−3t), e^(−t)cos 2t and e^(−t)sin 2t. All three poles sit left of the imaginary axis, so y decays.', steps: ['y′ + 3y = 0, y(0) = 2 transforms to sY − 2 + 3Y = 0.', '(s + 3)Y = 2, so Y = 2/(s + 3).', 'Read the table backwards: y = 2e^(−3t). Its pole s = −3 is the dot on the left.', 'The text’s Y = 1/((s + 3)(s² + 2s + 5)) adds two more poles: s² + 2s + 5 = 0 gives s = (−2 ± √(4 − 20))/2 = −1 ± 2i, the other two dots.'], visual: plotV([-5, 2, -3, 3], { points: [{ x: -3, y: 0, label: '−3' }, { x: -1, y: 2, label: '−1 + 2i' }, { x: -1, y: -2, label: '−1 − 2i' }], vlines: [{ x: 0, label: 'decay | grow' }] }) },
    ],
    quests: [
      { id: 'aq.diffeq.laplace.switchboard', name: 'Transform Switchboard', giver: 'volt', guided: true, hook: 'Volt: "The final switchboard speaks in s, not t. Learn its table and every circuit in the Reactor answers you in algebra."',
        change: 'The switchboard lights up, every line translated between t and s.',
        waves: [wave('Read the table', mixOf([tableLookupStep, polePlaneStep, tableLookupStep])), wave('Why it works', mixOf([laplaceAreaStep, derivRuleStep, transformValueTable])), wave('Solve and invert', mixOf([ivpLaplaceTable, inverseStep]))] },
      { id: 'aq.diffeq.laplace.final-calibration', name: 'Final Calibration', giver: 'vector', hook: 'Vector: "One calibration left before the Core. Solve the Reactor\'s start-up laws the Laplace way."',
        change: 'The last calibration holds. The Reactor Core is ready to ignite.',
        waves: [wave('Back and forth', mixOf([inverseStep, transformValueTable, derivRuleStep])), wave('Start-up laws', mixOf([ivpLaplaceTable, secondOrderLaplace, poleStep])), wave('Calibrate', mixOf([ivpLaplaceTable, polePlaneStep]))] },
    ],
    concept: conceptFrom([transformValueTable, ivpLaplaceTable, poleStep, polePlaneStep]),
    transfer: oneOf([controlPoleTransfer, capacitorInverseTransfer, shiftTransfer]),
    practice: (rng) => laplaceSteadyTyped(rng).question,
  },
  {
    key: 'trial', title: 'Mastery Trial & the Reactor Core', wing: 'capstone', wingName: 'The Reactor Core',
    goal: 'Prove durable command of differential equations across every chapter, then ignite the Reactor Core and complete the Engine.',
    misconception: 'Solving by pattern-matching the method name instead of reading what the equation says about change.',
    teach: [
      { title: 'Trial rules', text: 'Five phases, twenty-five prompts across every chapter: first-order laws, models, oscillators, systems and transforms. One helper, 80% to pass. Read each equation as a story about change before you pick a method.', visual: card('The Mastery Trial', ['First-order laws · Models', 'Oscillators · Systems & transforms', 'Transfer']) },
    ],
    quests: [
      { id: 'aq.diffeq.trial.rehearsal', name: 'Core Rehearsal', giver: 'vector', guided: true, hook: 'Vector: "Before the Core, a rehearsal. Same shape as the Trial, no stakes."',
        change: 'The Core chamber doors unseal.',
        waves: [wave('First order', mixOf([slopeAtStep, eulerTableStep, halfLifeTableStep])), wave('Oscillators', mixOf([rootsTableStep, dampingTypeStep, constantForcingBalance])), wave('Systems', mixOf([eigenTable, tableLookupStep]))] },
      { id: 'aq.diffeq.trial.keeper', name: 'The Core Keeper', giver: 'newton', hook: 'Newton: "The Keeper of the Core asks about any law of change, from any corner of the Reactor. Answer like an engineer."',
        change: 'The Keeper steps aside from the Core.',
        waves: [wave('Anything', mixOf([mixingEqStep, logisticEqLine, criticalSlider, portraitPick])), wave('Anywhere', mixOf([ivpLaplaceTable, solutionCurveStep, resonanceStep]))] },
    ],
    concept: conceptFrom([verifyTableStep, eulerTableStep, rootsTableStep, eigenTable]),
    transfer: oneOf([dosageTransfer, suspensionTransfer, controlPoleTransfer, terminalVelocityTransfer]),
  },
];

export const DIFFEQ = defineAcademy({
  id: ID,
  name: 'Differential Equations Academy',
  short: 'Differential Equations',
  tier: 'Advanced',
  blurb: 'Equations that describe change: growth, cooling, oscillation and systems.',
  icon: 'reactor',
  home: 'ode-reactor',
  wings: {
    core: { name: 'Core Control Room', icon: 'gauge' },
    tanks: { name: 'Mixing Tank Floor', icon: 'flask' },
    column: { name: 'Oscillator Column', icon: 'cog' },
    deck: { name: 'Control Deck', icon: 'dashboard' },
    capstone: { name: 'The Reactor Core', icon: 'reactor' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'First-order laws', items: [orderStep(rng), phaseLineStep(rng), eulerTableStep(rng), ivpSepStep(rng), halfLifeTypedStep(rng), coolingSliderStep(rng), steadyStateStep(rng)] },
    { name: 'Models', items: [mixingEqStep(rng), mixingDEStep(rng), logisticEqLine(rng), inflectionStep(rng)] },
    { name: 'Oscillators', items: [charEqStep(rng), complexTableStep(rng), dampingTypeStep(rng), rlcCriticalSlider(rng), guessFormStep(rng), resonanceSlider(rng)] },
    { name: 'Systems & transforms', items: [eigenTable(rng), classifyStep(rng), equilibriumSystemPlot(rng), tableLookupStep(rng), ivpLaplaceTable(rng), poleStep(rng)] },
    { name: 'Transfer', items: [oneOf([torricelliTransfer, suspensionTransfer, harvestTransfer])(rng), controlPoleTransfer(rng)] },
  ],
  trialIntro: 'The Mastery Trial. Five phases across every kind of change: first-order laws, models, oscillators, systems and transforms. One helper, 80% to pass. The Reactor Core is waiting.',
  coreName: 'The Reactor Core',
  coreLine: 'Every law of change, read, stepped, solved and transformed. The Reactor Core ignites, the last gauge on the Engine swings to full, and the Mathematical Engine runs whole for the first time.',
  coreColor: '#f97316',
  title: 'Reactor Engineer',
});
