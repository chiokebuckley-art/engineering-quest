/**
 * The Geometry Academy (grades 9–10): points and lines, angle pairs, parallel lines, triangles,
 * congruence and proof, similarity, right triangles, polygons and area, circles, solids,
 * transformations and coordinate geometry, then the Mastery Trial. Follows Algebra 1; graduation
 * opens Algebra 2. Diagrams use the 'geo' visual; the player turns the angle dial, taps the plot,
 * fills tables and works the balance.
 */
import type { Visual } from '../../types';
import type { GeoItem, PlotLayers } from '../types';
import { defineAcademy, type ChapterSpec } from '../defs';
import {
  academySkill, mkq, typed, choose, model, ask, wave, mixOf, conceptFrom, oneOf, rint, pick, fmt, fmtSigned, fracStr, coefTerm, polyStr,
  type Rng, type AskStep, type Question, type QSpec,
} from '../kit';
import { lab, labn } from '../../label';

const ID = 'geometry';
const S = (k: string) => academySkill(ID, k);
const Q = (k: string, sub: string, o: QSpec) => mkq(S(k), sub, o);

/* ================================================================== */
/* helpers                                                             */
/* ================================================================== */
type P2 = [number, number];
type Range = [number, number, number, number];
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const rad = (d: number) => (d * Math.PI) / 180;
/** The point `len` from `o` in direction `d` degrees. */
const at = (o: P2, d: number, len: number): P2 => [r3(o[0] + len * Math.cos(rad(d))), r3(o[1] + len * Math.sin(rad(d)))];
/** A geometry diagram (poly edge labels may be null for 'no label'; stored as '' so the visual stays null-free). */
const geo = (items: GeoItem[], w?: number, h?: number): Visual => ({ type: 'geo', items: items.map((it) => (it.t === 'poly' && it.labels ? { ...it, labels: it.labels.map((l) => l ?? '') } : it)), ...(w ? { w } : {}), ...(h ? { h } : {}) });
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });
const plotV = (range: Range, layers: PlotLayers): Visual => ({ type: 'plot', range, layers });
const dg = (n: number) => `${fmt(n)}°`;
/** A degree measure with its label: labd(40, 'given angle') = '40° (given angle)'. */
const labd = (n: number, label: string) => lab(`${fmt(n)}°`, label);
/** 'b − a' with labels, a negative a in brackets: minusLab(2, 'y of B', -3, 'y of A') = '2 (y of B) − (−3 (y of A))'. */
const minusLab = (b: number, lb: string, a: number, la: string) => `${lab(fmt(b), lb)} − ${a < 0 ? `(${lab(fmt(a), la)})` : lab(fmt(a), la)}`;
/** 'ax + b' with clean signs. */
const lin = (a: number, b: number) => polyStr([b, a]);
const piStr = (k: number) => (k === 1 ? 'π' : `${fmt(k)}π`);
const pt = (x: number, y: number) => `(${fmt(x)}, ${fmt(y)})`;
/** A multiple of `step` in [lo, hi]. */
const stepPick = (rng: Rng, lo: number, hi: number, step: number) => lo + step * rint(rng, 0, Math.floor((hi - lo) / step));
/** Signed sum text: sumText(-3, -6) → '−3 − 6'. */
const sumText = (a: number, b: number) => `${fmt(a)} ${fmtSigned(b)}`;
/** 'a' or 'an' before a word or number ('an 8 m beam', 'an octagon'). */
const aan = (w: string) => (/^(8|11(?!\d)|18(?!\d)|[aeiou])/i.test(w) ? `an ${w}` : `a ${w}`);
const Aan = (w: string) => { const t = aan(w); return t[0].toUpperCase() + t.slice(1); };
/** Invisible bounding points so pick-the-picture options share one scale. */
const bounds = (a: P2, b: P2): GeoItem[] => [{ t: 'text', p: a, text: '' }, { t: 'text', p: b, text: '' }];

/** Pick the picture with neutral labels (the label must not give the answer away). */
function pickFig(rng: Rng, q: Question, opts: { visual: Visual; right?: boolean }[]): AskStep {
  const sh = rng.shuffle(opts);
  const idx = sh.findIndex((o) => o.right);
  const options = sh.map((o, i) => ({ visual: o.visual, label: `Sketch ${i + 1}` }));
  const right = options[idx].label;
  return ask({ ...q, answer: idx, answerText: right }, 'pickmodel', { options, accept: [right] });
}
const dial = (label: string, step = 5) => ({ kind: 'angle' as const, max: 180 as const, step, label });
/**
 * A dial question reused as a plain typed question (Arcade practice, drills): no dial exists there, so
 * 'Set the dial to X.' becomes 'Find X.'
 */
const typedPrompt = (q: Question): Question => ({ ...q, prompt: q.prompt.replace(/Set the dial to (the |one )?([^.]*)\./, (_m, art: string | undefined, rest: string) => `Find ${art ?? ''}${rest}.`) });

/**
 * Two expressions for equal angles: a·x + b = c·x + d, every angle a clean positive value.
 * `avoid90` rules out v = 90: then 'equal' and 'sum = 180' give the same x, so a 'which equation?' item would have two right choices.
 */
function equalPair(rng: Rng, lo = 30, hi = 150, avoid90 = false): { a: number; b: number; c: number; d: number; x: number; v: number } {
  for (let g = 0; g < 200; g++) {
    const a = rint(rng, 2, 6); const c = rint(rng, 1, a - 1); const x = rint(rng, 4, 20); const v = stepPick(rng, lo, hi, 5);
    const b = v - a * x; const d = v - c * x;
    if (Math.abs(b) <= 40 && Math.abs(d) <= 60 && b !== 0 && !(avoid90 && v === 90)) return { a, b, c, d, x, v };
  }
  return { a: 3, b: 10, c: 1, d: 40, x: 15, v: 55 };
}
/** Two angle expressions that add to `total`: (a·x + b) + (c·x + d) = total. `avoid90` rules out v1 = v2 = 90 (see equalPair). */
function sumPair(rng: Rng, total = 180, avoid90 = false): { a: number; b: number; c: number; d: number; x: number; v1: number; v2: number } {
  for (let g = 0; g < 200; g++) {
    const a = rint(rng, 1, 4); const c = rint(rng, 1, 4); const x = rint(rng, 5, 25); const v1 = stepPick(rng, 30, total - 30, 5); const v2 = total - v1;
    const b = v1 - a * x; const d = v2 - c * x;
    if (Math.abs(b) <= 40 && Math.abs(d) <= 40 && b + d !== 0 && !(avoid90 && v1 === 90)) return { a, b, c, d, x, v1, v2 };
  }
  return { a: 2, b: 10, c: 1, d: 20, x: 50, v1: 110, v2: 70 };
}
/** Worked lines for solving a·x + b = c·x + d (c may be 0). */
function solveLines(a: number, b: number, c: number, d: number): string[] {
  const out: string[] = [];
  let A = a; let D = d;
  if (c) { A = a - c; out.push(`Subtract ${coefTerm(c, 'x')} from both sides: ${lin(A, b)} = ${fmt(d)}.`); }
  if (b) { D = d - b; out.push(`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides: ${coefTerm(A, 'x')} = ${fmt(D)}.`); }
  if (A !== 1) out.push(`Divide both sides by ${fmt(A)}: x = ${fmt(D / A)}.`);
  return out;
}

/* ================================================================== */
/* 1. Points, lines & planes                                           */
/* ================================================================== */
const K1 = 'lines';
type FigKind = 'segment' | 'rayAB' | 'rayBA' | 'line';
const FIG_NAME: Record<FigKind, string> = { segment: 'segment AB', rayAB: 'ray AB', rayBA: 'ray BA', line: 'line AB' };
const FIG_WHY: Record<FigKind, string> = {
  segment: 'Segment AB has two endpoints, A and B, and stops at both.',
  rayAB: 'Ray AB starts at A, passes through B and never stops.',
  rayBA: 'Ray BA starts at B, passes through A and keeps going past A.',
  line: 'Line AB runs forever in both directions through A and B.',
};
function figVisual(kind: FigKind): Visual {
  const A: P2 = [0, 0]; const B: P2 = [4, 0];
  const items: GeoItem[] = [...bounds([-3.5, -1], [7.5, 1])];
  if (kind === 'segment') items.push({ t: 'seg', a: A, b: B });
  if (kind === 'rayAB') items.push({ t: 'seg', a: A, b: [7.3, 0], arrow: true });
  if (kind === 'rayBA') items.push({ t: 'seg', a: B, b: [-3.3, 0], arrow: true });
  if (kind === 'line') items.push({ t: 'seg', a: [2, 0], b: [7.3, 0], arrow: true }, { t: 'seg', a: [2, 0], b: [-3.3, 0], arrow: true });
  items.push({ t: 'pt', p: A, label: 'A' }, { t: 'pt', p: B, label: 'B' });
  return geo(items, 300, 120);
}
function figureNameStep(rng: Rng): AskStep {
  const kinds: FigKind[] = ['segment', 'rayAB', 'rayBA', 'line'];
  const target = pick(rng, kinds);
  const q = Q(K1, 'naming', {
    prompt: `Volt needs a cable shaped like ${FIG_NAME[target]}. Which sketch shows it?`,
    expression: `Find ${FIG_NAME[target]}`,
    answer: 0,
    hint: 'A segment stops at both ends. A ray starts at its FIRST letter and runs forever. A line never stops either way.',
    steps: [FIG_WHY[target], 'The order of the letters in a ray matters: the first letter is where it starts.'],
    app: 'Cable runs, laser beams and survey sight-lines are segments, rays and lines.',
  });
  return pickFig(rng, q, kinds.map((k) => ({ visual: figVisual(k), right: k === target })));
}
const NOTATION: { q: string; right: string; wrong: string[]; why: string }[] = [
  { q: 'Two different planes cross. Where they meet is a…', right: 'line', wrong: ['point', 'plane', 'ray'], why: 'Two flat sheets that cross meet along a straight line, like two walls meeting at a corner seam.' },
  { q: 'Two different lines cross. Where they meet is a…', right: 'point', wrong: ['line', 'segment', 'plane'], why: 'Two straight lines can share only one location: a single point.' },
  { q: 'How many lines pass through two different points?', right: 'exactly one', wrong: ['exactly two', 'infinitely many', 'none'], why: 'Two points fix exactly one line. That is why a straightedge only needs two marks.' },
  { q: 'How many planes hold three points that are not on one line?', right: 'exactly one', wrong: ['two', 'none', 'infinitely many'], why: 'Three non-collinear points fix one plane. That is why a three-legged stool never wobbles.' },
  { q: 'How long is line AB?', right: 'It has no length: it never ends', wrong: ['The distance from A to B', 'Twice the distance AB', 'It is as long as ray AB'], why: 'A line goes on forever. Only segment AB, which stops at A and B, has a length.' },
  { q: 'Ray AB and ray BA are…', right: 'different: they start at different points', wrong: ['the same ray', 'the same as segment AB', 'the same as line AB'], why: 'Ray AB starts at A and heads through B; ray BA starts at B and heads through A. They point opposite ways.' },
];
function notationStep(rng: Rng): AskStep {
  const f = pick(rng, NOTATION);
  const q = Q(K1, 'undefined-terms', {
    prompt: `Vector: "${f.q}"`,
    expression: f.q,
    answer: 0,
    hint: 'Picture it with real objects: taut strings for lines, sheets of paper for planes.',
    steps: [f.why],
    app: 'Engineering drawings are built on these definitions.',
  });
  return choose(rng, q, f.right, f.wrong);
}
function segAddStep(rng: Rng): AskStep {
  const ab = rint(rng, 3, 14); const bc = rint(rng, 3, 14); const ac = ab + bc;
  const whole = rng.next() < 0.5;
  const items: GeoItem[] = [
    { t: 'seg', a: [0, 0], b: [ab, 0], label: `${ab} m` },
    { t: 'seg', a: [ab, 0], b: [ac, 0], label: whole ? `${bc} m` : '?' },
    { t: 'pt', p: [0, 0], label: 'A' }, { t: 'pt', p: [ab, 0], label: 'B' }, { t: 'pt', p: [ac, 0], label: 'C' },
    { t: 'text', p: [ac / 2, -ac / 8], text: whole ? 'AC = ?' : `AC = ${ac} m` },
  ];
  const q = Q(K1, 'segment-addition', {
    prompt: whole ? `A cable runs from A to C through a clamp at B. AB = ${ab} m and BC = ${bc} m. How long is AC?` : `Cable AC is ${ac} m long with a clamp at B. AB = ${ab} m. How long is BC?`,
    expression: whole ? `AB + BC = AC → ${ab} + ${bc} = ?` : `AB + BC = AC → ${ab} + ? = ${ac}`,
    answer: whole ? ac : bc,
    unit: 'm',
    hint: 'B sits between A and C, so the two parts add up to the whole.',
    steps: ['Segment addition: AB + BC = AC.', whole ? `${lab(ab, 'AB in m')} + ${lab(bc, 'BC in m')} = ${lab(ac, 'AC in m')}.` : `${lab(ab, 'AB in m')} + BC = ${lab(ac, 'AC in m')}, so BC = ${lab(ac, 'AC in m')} − ${lab(ab, 'AB in m')} = ${lab(bc, 'BC in m')}.`],
    visual: geo(items, 320, 140),
    app: 'Surveyors chain long distances as a sum of short measured pieces.',
  });
  return typed(q);
}
function segAlgebraStep(rng: Rng): AskStep {
  const x = rint(rng, 2, 9); const p = rint(rng, 1, 3); const r = rint(rng, 1, 3);
  const q0 = rint(rng, Math.max(-2, 2 - p * x), 6); const s0 = rint(rng, Math.max(-2, 2 - r * x), 6);
  const A = p + r; const B = q0 + s0; const T = A * x + B;
  const ab = p * x + q0; const bc = r * x + s0;
  const q = Q(K1, 'segment-algebra', {
    prompt: `Clamp B sits on cable AC. AB = ${lin(p, q0)}, BC = ${lin(r, s0)} and AC = ${T}. Find x.`,
    expression: 'Find x',
    answer: x,
    hint: 'The parts add to the whole. Combine like terms, then undo the operations on both sides.',
    steps: [`AB + BC = AC, so (${lin(p, q0)}) + (${lin(r, s0)}) = ${lab(T, 'length of AC')}.`, `Combine like terms: ${lin(A, B)} = ${lab(T, 'length of AC')}.`, ...solveLines(A, B, 0, T), `Check: ${lab(ab, 'length of AB')} + ${lab(bc, 'length of BC')} = ${lab(T, 'length of AC')}.`],
    visual: geo([
      { t: 'seg', a: [0, 0], b: [ab, 0], label: lin(p, q0) }, { t: 'seg', a: [ab, 0], b: [T, 0], label: lin(r, s0) },
      { t: 'pt', p: [0, 0], label: 'A' }, { t: 'pt', p: [ab, 0], label: 'B' }, { t: 'pt', p: [T, 0], label: 'C' },
      { t: 'text', p: [T / 2, -T / 8], text: `AC = ${T}` },
    ], 320, 140),
  });
  return model(q, { kind: 'balance', a: A, b: B, c: 0, d: T, label: `${lin(A, B)} = ${T}` }, [String(x)], 'Solve for x on the balance: keep it level and get x alone.');
}
function midpointLineStep(rng: Rng): AskStep {
  const g = rint(rng, 2, 8); const a = rint(rng, -14, 14 - 2 * g); const b = a + 2 * g; const m = a + g;
  const q = Q(K1, 'midpoint-line', {
    prompt: `On the rail ruler, bolt A is at ${fmt(a)} and bolt B is at ${fmt(b)}. Where does the midpoint bracket go?`,
    expression: `midpoint of ${fmt(a)} and ${fmt(b)}`,
    answer: m,
    negative: m < 0,
    hint: 'The midpoint is the same distance from both ends. Find half the gap, then step that far from A.',
    steps: [`The midpoint is the average of the ends ${lab(fmt(a), "A's mark")} and ${lab(fmt(b), "B's mark")}: add them, then divide by 2 (ends).`, `${sumText(a, b)} = ${lab(fmt(a + b), 'sum of the marks')}, and ${lab(fmt(a + b), 'sum of the marks')} ÷ ${lab(2, 'ends')} = ${lab(fmt(m), 'midpoint mark')}.`, `Check: ${lab(fmt(m), 'midpoint mark')} is ${lab(g, 'half the gap')} from each end. Half the gap is a distance, not the location.`],
    visual: { type: 'numline', min: -15, max: 15, step: 5, points: [{ x: a, label: 'A' }, { x: b, label: 'B' }] },
    app: 'Centering a beam on its supports starts with a midpoint.',
  });
  return model(q, { kind: 'numberline', start: a, min: -15, max: 15, label: `A at ${lab(fmt(a), 'ruler mark')}, B at ${lab(fmt(b), 'ruler mark')}` }, [String(m)], 'Tap the point exactly halfway between A and B.');
}
function angleFigure(base: number, th: number, label: string): Visual {
  const O: P2 = [0, 0]; const P = at(O, base, 4); const R = at(O, base + th, 4);
  return geo([{ t: 'seg', a: O, b: P }, { t: 'seg', a: O, b: R }, { t: 'arc', at: O, from: P, to: R, label }, { t: 'pt', p: O }, ...bounds([-4, -0.5], [4, 4])], 300, 170);
}
function angleMeasureStep(rng: Rng): AskStep {
  let th = stepPick(rng, 20, 160, 5); if (th === 90) th = 115;
  const base = pick(rng, [0, 10, 20, 30]);
  const lo = Math.min(th, 180 - th); const hi = Math.max(th, 180 - th);
  const q = Q(K1, 'measure', {
    prompt: `The crane arm's protractor has two scales. They read ${lo} and ${hi} where the arm crosses. Which is the angle?`,
    expression: `${lo}° or ${hi}°?`,
    answer: th,
    hint: 'Is the angle narrower or wider than a square corner (90°)? Use the scale that agrees with the picture.',
    steps: [`The angle is ${th < 90 ? 'acute: narrower' : 'obtuse: wider'} than a right angle (90°), so it measures ${labd(th, 'crane arm angle')}, not ${labd(180 - th, 'other scale reading')}.`, 'Read the scale that starts at 0 on one of the rays.'],
    visual: angleFigure(base, th, ''),
    app: 'Crane and robot-arm angles are set from a protractor reading.',
  });
  return model(q, dial('Set the true angle'), [String(th)], 'Set the dial to the angle in the picture.');
}
type AngleKind = 'acute' | 'right' | 'obtuse' | 'straight' | 'reflex';
function classifyAngleStep(rng: Rng): AskStep {
  const kind = pick(rng, ['acute', 'acute', 'right', 'obtuse', 'obtuse', 'straight', 'reflex'] as AngleKind[]);
  const m = kind === 'acute' ? stepPick(rng, 15, 85, 5) : kind === 'right' ? 90 : kind === 'obtuse' ? stepPick(rng, 95, 175, 5) : kind === 'straight' ? 180 : stepPick(rng, 190, 350, 10);
  const wrongs: Record<AngleKind, AngleKind[]> = { acute: ['obtuse', 'right', 'reflex'], right: ['acute', 'obtuse', 'straight'], obtuse: ['acute', 'reflex', 'straight'], straight: ['obtuse', 'reflex', 'right'], reflex: ['obtuse', 'straight', 'acute'] };
  const q = Q(K1, 'classify-angle', {
    prompt: `The crane arm swings ${m}° from the deck. What kind of angle is that?`,
    expression: `${m}° is…`,
    answer: 0,
    hint: 'Compare with the landmarks: 90° is a square corner, 180° is a straight line, 360° is a full turn.',
    steps: [`${labd(m, 'crane swing')} is ${kind}: acute < 90°, right = 90°, obtuse between 90° and 180°, straight = 180°, reflex between 180° and 360°.`],
    visual: kind === 'reflex' ? card('Crane swing', [`${m}°: past a straight line`, 'less than a full turn (360°)']) : angleFigure(0, m, `${m}°`),
  });
  return choose(rng, q, kind, wrongs[kind]);
}
function clockAngleStep(rng: Rng): AskStep {
  // Half past the hour: the hour hand has moved halfway to the next number (15°), so this is not just 30 × h.
  const h = pick(rng, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11]);
  const hourPos = 30 * h + 15; const ans = Math.abs(hourPos - 180);
  const O: P2 = [0, 0]; const M = at(O, -90, 3.4); const H = at(O, 90 - hourPos, 2.4);
  const q = Q(K1, 'clock', {
    prompt: `The tower clock shows ${h}:30. What is the smaller angle between the two hands?`,
    expression: `angle at ${h}:30`,
    answer: ans,
    hint: 'Measure each hand from 12. In 30 minutes the hour hand also moves: halfway to the next number.',
    steps: [
      'One hour step is 360° (full turn) ÷ 12 (hour marks) = 30° (per hour mark). At 30 minutes the minute hand points at 6: 180° (minute hand from twelve).',
      `The hour hand is halfway from ${h} to ${h + 1}: ${lab(h, 'hours passed')} × ${labd(30, 'per hour mark')} + ${labd(15, 'half an hour mark')} = ${labd(hourPos, 'hour hand from twelve')}.`,
      `The angle between them is ${hourPos > 180 ? `${labd(hourPos, 'hour hand')} − ${labd(180, 'minute hand')}` : `${labd(180, 'minute hand')} − ${labd(hourPos, 'hour hand')}`} = ${labd(ans, 'angle between the hands')}.`,
    ],
    visual: geo([{ t: 'circle', c: O, r: 4 }, { t: 'seg', a: O, b: M }, { t: 'seg', a: O, b: H }, { t: 'arc', at: O, from: M, to: H, label: '?' }, { t: 'text', p: [0, 4.6], text: '12' }, { t: 'text', p: [0, -4.6], text: '6' }], 240, 240),
  });
  return typed(q);
}
function angleBisectorStep(rng: Rng): AskStep {
  const whole = stepPick(rng, 40, 170, 10); const half = whole / 2;
  const O: P2 = [0, 0]; const A = at(O, 0, 4); const C = at(O, whole, 4); const D = at(O, half, 4);
  const q = Q(K1, 'bisector', {
    prompt: `A brace bisects a ${whole}° corner of the crane frame. Set the dial to one half.`,
    expression: `${whole}° split into two equal angles`,
    answer: half,
    hint: 'To bisect means to cut into two EQUAL parts.',
    steps: ['A bisector splits an angle into two equal angles.', `${labd(whole, 'whole corner')} ÷ ${lab(2, 'equal halves')} = ${labd(half, 'each half')}.`],
    visual: geo([{ t: 'seg', a: O, b: A }, { t: 'seg', a: O, b: C }, { t: 'seg', a: O, b: D, dashed: true }, { t: 'arc', at: O, from: A, to: D, label: '?' }, { t: 'arc', at: O, from: D, to: C, label: '?' }, { t: 'pt', p: O, label: 'B' }, { t: 'pt', p: A, label: 'A' }, { t: 'pt', p: C, label: 'C' }, { t: 'pt', p: D, label: 'D' }, ...bounds([-4, -0.5], [4, 4])], 300, 180),
    app: 'Symmetric braces bisect the corner so the load splits evenly.',
  });
  return model(q, dial('Set one half', 5), [String(half)], 'Turn the dial to one half of the corner.');
}
function trailStep(rng: Rng): AskStep {
  const g = rint(rng, 3, 12); const a = rint(rng, 2, 20); const b = a + 2 * g; const m = a + g;
  const q = Q(K1, 'midpoint-line', {
    prompt: `A trail starts at mile marker ${a} and ends at mile marker ${b}. The water station is exactly halfway. Which mile marker?`,
    expression: `halfway from ${a} to ${b}`,
    answer: m,
    hint: 'Halfway is the average of the two markers, not half the trail length.',
    steps: [`Add the markers: ${lab(a, 'start marker')} + ${lab(b, 'end marker')} = ${lab(a + b, 'sum of the markers')}.`, `Halve it: ${lab(a + b, 'sum of the markers')} ÷ ${lab(2, 'ends')} = ${lab(m, 'halfway marker')}.`, `Check: ${lab(m, 'halfway marker')} − ${lab(a, 'start marker')} = ${labn(g, 'mile')} and ${lab(b, 'end marker')} − ${lab(m, 'halfway marker')} = ${labn(g, 'mile')}.`],
    visual: { type: 'numline', min: a - 2, max: b + 2, points: [{ x: a, label: 'start' }, { x: b, label: 'end' }] },
  });
  return typed(q);
}

/* ================================================================== */
/* 2. Angle pairs                                                      */
/* ================================================================== */
const K2 = 'pairs';
function linearPairFig(th: number, left: string, right: string): Visual {
  const O: P2 = [0, 0]; const R: P2 = [4, 0]; const L: P2 = [-4, 0]; const U = at(O, th, 4);
  return geo([{ t: 'seg', a: L, b: R }, { t: 'seg', a: O, b: U }, { t: 'arc', at: O, from: R, to: U, label: right }, { t: 'arc', at: O, from: U, to: L, label: left }, { t: 'pt', p: O }, ...bounds([-4, -0.4], [4, 4])], 300, 170);
}
function linearPairDialStep(rng: Rng): AskStep {
  let th = stepPick(rng, 25, 155, 5); if (th === 90) th = 120;
  const givenRight = rng.next() < 0.5; const given = givenRight ? th : 180 - th; const ans = 180 - given;
  const q = Q(K2, 'linear-pair', {
    prompt: `A support leans off a straight deck. One angle is ${given}°. Set the dial to the other angle.`,
    expression: `${given}° + ? = 180°`,
    answer: ans,
    hint: 'The two angles sit side by side on a straight line. What does a straight line measure?',
    steps: ['A linear pair lies along a straight line, so the angles add to 180°.', `${labd(180, 'straight line')} − ${labd(given, 'given angle')} = ${labd(ans, 'other angle')}.`],
    visual: linearPairFig(th, givenRight ? '?' : `${given}°`, givenRight ? `${given}°` : '?'),
    app: 'Every strut that meets a straight deck makes a linear pair.',
  });
  return model(q, dial('Set the other angle'), [String(ans)], 'Turn the dial to the missing angle.');
}
function complementDialStep(rng: Rng): AskStep {
  const th = stepPick(rng, 10, 80, 5); const ans = 90 - th;
  const O: P2 = [0, 0]; const R: P2 = [4, 0]; const U: P2 = [0, 4]; const M = at(O, th, 4);
  const q = Q(K2, 'complement', {
    prompt: `A diagonal brace splits a square corner. One part is ${th}°. Set the dial to the other part.`,
    expression: `${th}° + ? = 90°`,
    answer: ans,
    hint: 'The two parts fill a square corner. How big is a square corner?',
    steps: ['The two angles make a right angle, so they are complementary: they add to 90°.', `${labd(90, 'square corner')} − ${labd(th, 'given part')} = ${labd(ans, 'other part')}.`],
    visual: geo([{ t: 'seg', a: O, b: R }, { t: 'seg', a: O, b: U }, { t: 'seg', a: O, b: M }, { t: 'arc', at: O, from: R, to: M, label: `${th}°` }, { t: 'arc', at: O, from: M, to: U, label: '?' }, { t: 'pt', p: O }], 240, 200),
  });
  return model(q, dial('Set the other part'), [String(ans)], 'Turn the dial to the missing part of the corner.');
}
function compSuppStep(rng: Rng): AskStep {
  const comp = rng.next() < 0.5;
  let a = comp ? stepPick(rng, 15, 75, 5) : stepPick(rng, 20, 160, 5);
  if (a === 45 || a === 90) a = comp ? 35 : 125;
  const word = comp ? 'complement' : 'supplement';
  const ans = comp ? 90 - a : 180 - a;
  const wrong = comp ? [dg(180 - a), dg(a), dg(90 + a)] : [dg(a < 90 ? 90 - a : a - 90), dg(a), dg(360 - a)];
  const q = Q(K2, 'comp-supp', {
    prompt: `Ada: "Brace angle ∠1 is ${a}°. I need its ${word}."`,
    expression: `${word} of ${a}° = ?`,
    answer: ans,
    hint: 'Complementary angles make a square corner; supplementary angles make a straight line. (C comes before S, and 90 comes before 180.)',
    steps: [`The ${word} of an angle adds to it to make ${comp ? '90°' : '180°'}.`, `${labd(comp ? 90 : 180, comp ? 'square corner' : 'straight line')} − ${labd(a, 'brace angle')} = ${labd(ans, word)}.`],
    visual: angleFigure(0, a, `${a}°`),
  });
  return choose(rng, q, dg(ans), wrong);
}
/** Two lines crossing at the origin, one along 0°, the other at th. Angle i sits between directions i·… (0: th, 1: 180−th, 2: th, 3: 180−th). */
function crossFig(th: number, labels: (string | null)[]): Visual {
  const O: P2 = [0, 0]; const dirs = [0, th, 180, 180 + th]; const P = dirs.map((d) => at(O, d, 4));
  const items: GeoItem[] = [{ t: 'seg', a: P[0], b: P[2] }, { t: 'seg', a: P[1], b: P[3] }];
  labels.forEach((lb, i) => { if (lb !== null) items.push({ t: 'arc', at: O, from: P[i], to: P[(i + 1) % 4], label: lb }); });
  items.push({ t: 'pt', p: O });
  return geo(items, 280, 200);
}
const crossMeasure = (i: number, th: number) => (i % 2 === 0 ? th : 180 - th);
function verticalStep(rng: Rng): AskStep {
  let th = stepPick(rng, 30, 150, 5); if (th === 90) th = 65;
  const g = rint(rng, 0, 3); const vertical = rng.next() < 0.6; const a = vertical ? (g + 2) % 4 : (g + pick(rng, [1, 3])) % 4;
  const mg = crossMeasure(g, th); const ans = crossMeasure(a, th);
  const labels: (string | null)[] = [null, null, null, null]; labels[g] = `${mg}°`; labels[a] = '?';
  const wrong = [vertical ? dg(180 - mg) : dg(mg), dg(360 - mg), ...(mg < 90 ? [dg(90 - mg)] : [])];
  const q = Q(K2, 'vertical', {
    prompt: `Two girders cross at a rivet. One angle is ${mg}°. Find the angle marked ?.`,
    expression: 'Find ?',
    answer: ans,
    hint: 'Is ? across the rivet from the known angle, or next to it along a straight girder?',
    steps: vertical
      ? ['? is across the crossing from the known angle: they are vertical angles, and vertical angles are equal.', `? (marked angle) = ${labd(mg, 'given angle')}.`]
      : ['? sits next to the known angle along one straight girder: a linear pair, so they add to 180°.', `? (marked angle) = ${labd(180, 'straight girder')} − ${labd(mg, 'given angle')} = ${labd(ans, 'marked angle')}.`],
    visual: crossFig(th, labels),
  });
  return choose(rng, q, dg(ans), wrong);
}
function verticalAlgebraStep(rng: Rng): AskStep {
  const { a, b, c, d, x, v } = equalPair(rng);
  const th = v;
  const q = Q(K2, 'vertical-algebra', {
    prompt: `Two girders cross. Vertical angles measure (${lin(a, b)})° and (${lin(c, d)})°. Find x.`,
    expression: 'Find x',
    answer: x,
    hint: 'Across the crossing or side by side? Decide how the two angles are related, then move the x terms to one side.',
    steps: ['Vertical angles are equal: set the expressions equal.', ...solveLines(a, b, c, d), `Each angle is ${a} × ${lab(x, 'value of x')} ${fmtSigned(b)} = ${labd(v, 'each vertical angle')}.`],
    visual: crossFig(th, [`${lin(a, b)}°`, null, `${lin(c, d)}°`, null]),
  });
  return model(q, { kind: 'balance', a, b, c, d, label: `${lin(a, b)} = ${lin(c, d)}` }, [String(x)], 'Solve for x on the balance.');
}
function linearAlgebraStep(rng: Rng): AskStep {
  const { a, b, c, d, x, v1, v2 } = sumPair(rng);
  const q = Q(K2, 'linear-algebra', {
    prompt: `A strut on a straight deck makes angles of (${lin(a, b)})° and (${lin(c, d)})°. Find x.`,
    expression: 'Find x',
    answer: x,
    hint: 'The two angles sit side by side on a straight deck. What does a straight line measure?',
    steps: [`A linear pair adds to 180°: (${lin(a, b)}) + (${lin(c, d)}) = ${lab(180, 'degrees on a straight line')}.`, `Combine like terms: ${lin(a + c, b + d)} = ${lab(180, 'degrees on a straight line')}.`, ...solveLines(a + c, b + d, 0, 180), `The angles are ${labd(v1, 'first angle')} and ${labd(v2, 'second angle')}, which add to 180°.`],
    visual: linearPairFig(v1, `${lin(c, d)}°`, `${lin(a, b)}°`),
  });
  return model(q, { kind: 'balance', a: a + c, b: b + d, c: 0, d: 180, label: `${lin(a + c, b + d)} = 180` }, [String(x)], 'Solve for x on the balance.');
}
/** Choices for 'Which equation finds x?': the right setup plus the wrong-relationship equations. */
function equationChoices(e1: string, e2: string, equal: boolean): { right: string; wrong: string[] } {
  const eq = `${e1} = ${e2}`; const sum = (t: number) => `(${e1}) + (${e2}) = ${t}`;
  return equal ? { right: eq, wrong: [sum(180), sum(90), sum(360)] } : { right: sum(180), wrong: [eq, sum(90), sum(360)] };
}
/** Decide the relationship before solving: equal, or adding to 180°? (The picture says which; the prompt does not.) */
function pairEquationStep(rng: Rng): AskStep {
  const kind = pick(rng, ['vertical', 'vertical', 'adjacent', 'deck'] as const);
  if (kind === 'vertical') {
    const { a, b, c, d, x, v } = equalPair(rng, 30, 150, true);
    const { right, wrong } = equationChoices(`${lin(a, b)}`, `${lin(c, d)}`, true);
    const q = Q(K2, 'pair-equation', {
      prompt: `Two girders cross at a rivet. The marked angles are (${lin(a, b)})° and (${lin(c, d)})°. Which equation finds x?`,
      expression: 'Which equation?',
      answer: 0,
      hint: 'Look at where the two angles sit: across the rivet from each other, or side by side along one girder?',
      steps: ['The angles are across the crossing from each other: vertical angles, which are equal.', `${right}, which gives x = ${lab(x, 'value of x')}: each angle is ${labd(v, 'vertical angle')}.`],
      visual: crossFig(v, [`${lin(a, b)}°`, null, `${lin(c, d)}°`, null]),
    });
    return choose(rng, q, right, wrong);
  }
  const { a, b, c, d, x, v1, v2 } = sumPair(rng, 180, true);
  const { right, wrong } = equationChoices(`${lin(a, b)}`, `${lin(c, d)}`, false);
  const atCross = kind === 'adjacent';
  const q = Q(K2, 'pair-equation', {
    prompt: atCross ? `Two girders cross at a rivet. The marked angles are (${lin(a, b)})° and (${lin(c, d)})°. Which equation finds x?` : `A strut stands on a straight deck, making angles of (${lin(a, b)})° and (${lin(c, d)})°. Which equation finds x?`,
    expression: 'Which equation?',
    answer: 0,
    hint: 'Look at where the two angles sit: across from each other, or side by side along one straight line?',
    steps: ['The angles sit side by side on one straight line: a linear pair, which adds to 180°.', `${right}, which gives x = ${lab(x, 'value of x')}: the angles are ${labd(v1, 'first angle')} and ${labd(v2, 'second angle')}.`],
    visual: atCross ? crossFig(v1, [`${lin(a, b)}°`, `${lin(c, d)}°`, null, null]) : linearPairFig(v1, `${lin(c, d)}°`, `${lin(a, b)}°`),
  });
  return choose(rng, q, right, wrong);
}
function cornersTableStep(rng: Rng): AskStep {
  let th = stepPick(rng, 30, 150, 5); if (th === 90) th = 70;
  const g = rint(rng, 0, 3); const mg = crossMeasure(g, th);
  const labels: (string | null)[] = [null, null, null, null];
  labels[g] = `${mg}°`; labels[(g + 1) % 4] = '1'; labels[(g + 2) % 4] = '2'; labels[(g + 3) % 4] = '3';
  const vals = [1, 2, 3].map((k) => crossMeasure((g + k) % 4, th));
  const q = Q(K2, 'all-four', {
    prompt: `Two roads cross. One corner is ${mg}°. Fill in the other three corners.`,
    expression: `${mg}°, ∠1, ∠2, ∠3`,
    answer: vals[0],
    hint: 'Neighbours along a straight road add to 180°. Opposite corners match.',
    steps: [`∠1 and the ${mg}° corner form a linear pair: ∠1 = ${labd(180, 'straight road')} − ${labd(mg, 'given corner')} = ${labd(vals[0], 'corner one')}.`, `∠2 is vertical to the ${mg}° corner: ∠2 = ${labd(vals[1], 'same as the given corner')}.`, `∠3 is vertical to ∠1: ∠3 = ${labd(vals[2], 'same as corner one')}. All four add to 360° (full turn).`],
    visual: crossFig(th, labels),
  });
  return model(q, { kind: 'table', cols: ['∠1', '∠2', '∠3'], rows: [[null, null, null]], label: 'Degrees at each corner' }, [vals.join(',')], 'Fill in ∠1, ∠2 and ∠3 in degrees.');
}
function scissorsStep(rng: Rng): AskStep {
  const a = stepPick(rng, 20, 70, 5);
  const q = Q(K2, 'vertical', {
    prompt: `Scissor blades cross at the pivot and open ${a}°. What angle do the two handles make?`,
    expression: 'handle angle = ?',
    answer: a,
    hint: 'Blades and handles are the same two straight pieces, crossing at the pivot.',
    steps: ['The handles are across the pivot from the blades: vertical angles.', `Vertical angles are equal: ${labd(a, 'blade opening')} = ${labd(a, 'handle opening')}.`],
    visual: crossFig(a, [`${a}°`, null, '?', null]),
  });
  return typed(q);
}
function mirrorStep(rng: Rng): AskStep {
  const a = stepPick(rng, 20, 70, 5); const ans = 180 - 2 * a;
  const O: P2 = [0, 0]; const inc = at(O, 180 - a, 4); const out = at(O, a, 4);
  const q = Q(K2, 'mirror', {
    prompt: `In a periscope, light hits a flat mirror at ${a}° and leaves at the same ${a}°. What angle is between the incoming and outgoing beams?`,
    expression: `${a}° + ? + ${a}° = 180°`,
    answer: ans,
    hint: 'The mirror is a straight line. The three angles along it make a straight angle.',
    steps: ['The three angles sit along the straight mirror, so they add to 180°.', `? = ${labd(180, 'straight mirror')} − ${labd(a, 'incoming beam')} − ${labd(a, 'outgoing beam')} = ${labd(ans, 'angle between beams')}.`],
    visual: geo([{ t: 'seg', a: [-4.5, 0], b: [4.5, 0] }, { t: 'seg', a: inc, b: O }, { t: 'seg', a: O, b: out }, { t: 'arc', at: O, from: out, to: [4.5, 0], label: `${a}°` }, { t: 'arc', at: O, from: [-4.5, 0], to: inc, label: `${a}°` }, { t: 'arc', at: O, from: inc, to: out, label: '?' }, { t: 'text', p: [0, -0.7], text: 'mirror' }], 300, 180),
    app: 'Periscopes, laser levels and fibre optics all steer light with reflection angles.',
  });
  return typed(q);
}

/* ================================================================== */
/* 3. Parallel lines & transversals                                    */
/* ================================================================== */
const K3 = 'parallel';
type Pos = 'UR' | 'UL' | 'LL' | 'LR';
type Vx = 'T' | 'B';
const measureAt = (p: Pos, th: number) => (p === 'UR' || p === 'LL' ? th : 180 - th);
type Rel = 'corresponding' | 'alternate interior' | 'alternate exterior' | 'co-interior';
const REL_PAIRS: Record<Rel, [[Vx, Pos], [Vx, Pos]][]> = {
  corresponding: [[['T', 'UR'], ['B', 'UR']], [['T', 'UL'], ['B', 'UL']], [['T', 'LL'], ['B', 'LL']], [['T', 'LR'], ['B', 'LR']]],
  'alternate interior': [[['T', 'LL'], ['B', 'UR']], [['T', 'LR'], ['B', 'UL']]],
  'alternate exterior': [[['T', 'UR'], ['B', 'LL']], [['T', 'UL'], ['B', 'LR']]],
  'co-interior': [[['T', 'LL'], ['B', 'UL']], [['T', 'LR'], ['B', 'UR']]],
};
const REL_RULE: Record<Rel, string> = {
  corresponding: 'corresponding angles (same corner at each crossing, an F shape) are equal',
  'alternate interior': 'alternate interior angles (between the rails, opposite sides, a Z shape) are equal',
  'alternate exterior': 'alternate exterior angles (outside the rails, opposite sides) are equal',
  'co-interior': 'co-interior angles (between the rails, same side, a C shape) add to 180°',
};
/**
 * Two rails (bottom horizontal, top tilted by phi) cut by a transversal at th; arcs at the given corners.
 * The parallel marks (››) are drawn only when `markers` is on: items that ask whether the rails ARE
 * parallel must not show them, or the picture gives the answer away.
 */
function railFig(th: number, marks: { v: Vx; p: Pos; label: string }[], phi = 0, opts: { markers?: boolean; note?: string } = {}): Visual {
  const B: P2 = [0, 0]; const T = at(B, th, 3 / Math.sin(rad(th)));
  const items: GeoItem[] = [
    { t: 'seg', a: at(T, 180 + phi, 5.5), b: at(T, phi, 5.5) }, { t: 'seg', a: [T[0] - 5.5, 0], b: [T[0] + 5.5, 0] },
    { t: 'seg', a: at(B, th + 180, 1.6), b: at(T, th, 1.6) },
  ];
  if (!phi && opts.markers !== false) items.push({ t: 'text', p: [T[0] - 4.3, 3.35], text: '››' }, { t: 'text', p: [T[0] - 4.3, 0.35], text: '››' });
  if (opts.note) items.push({ t: 'text', p: [T[0] + 3.5, -0.9], text: opts.note });
  for (const m of marks) {
    const V = m.v === 'T' ? T : B; const tilt = m.v === 'T' ? phi : 0;
    const R = at(V, tilt, 2); const L = at(V, tilt + 180, 2); const U = at(V, th, 2); const D = at(V, th + 180, 2);
    const [from, to] = m.p === 'UR' ? [R, U] : m.p === 'UL' ? [U, L] : m.p === 'LL' ? [L, D] : [D, R];
    items.push({ t: 'arc', at: V, from, to, label: m.label });
  }
  return geo(items, 320, 220);
}
const railTheta = (rng: Rng) => (rng.next() < 0.5 ? stepPick(rng, 40, 80, 5) : stepPick(rng, 100, 140, 5));
function transAngleStep(rng: Rng): AskStep {
  const rel = pick(rng, ['corresponding', 'corresponding', 'alternate interior', 'alternate interior', 'co-interior', 'co-interior', 'alternate exterior'] as Rel[]);
  const pair = pick(rng, REL_PAIRS[rel]); const [g, a] = rng.next() < 0.5 ? pair : [pair[1], pair[0]];
  const th = railTheta(rng); const given = measureAt(g[1], th); const ans = measureAt(a[1], th);
  const q = Q(K3, 'transversal', {
    prompt: `The two rails are parallel. One angle is ${given}°. Set the dial to the angle marked ?.`,
    expression: 'Find ?',
    answer: ans,
    hint: 'Slide the top crossing down onto the bottom one: matching corners are equal, and neighbours along a straight line add to 180°.',
    steps: [`? and the ${given}° angle are ${rel} angles: ${REL_RULE[rel]}.`, rel === 'co-interior' ? `? = ${labd(180, 'co-interior sum')} − ${labd(given, 'given angle')} = ${labd(ans, 'marked angle')}.` : `? (marked angle) = ${labd(ans, 'given angle')}.`],
    visual: railFig(th, [{ v: g[0], p: g[1], label: `${given}°` }, { v: a[0], p: a[1], label: '?' }]),
    app: 'Rail tracks, bridge chords and roof rafters are parallel lines cut by transversals.',
  });
  return model(q, dial('Set the angle marked ?'), [String(ans)], 'Turn the dial to the angle marked ?.');
}
function relNameStep(rng: Rng): AskStep {
  const rels: (Rel | 'vertical')[] = ['corresponding', 'alternate interior', 'alternate exterior', 'co-interior', 'vertical'];
  const rel = pick(rng, rels);
  let pair: [[Vx, Pos], [Vx, Pos]];
  if (rel === 'vertical') { const v = pick(rng, ['T', 'B'] as Vx[]); pair = pick(rng, [[[v, 'UR'], [v, 'LL']], [[v, 'UL'], [v, 'LR']]] as [[Vx, Pos], [Vx, Pos]][]); }
  else pair = pick(rng, REL_PAIRS[rel]);
  const th = railTheta(rng);
  const wrongs: Record<string, string[]> = {
    corresponding: ['alternate interior', 'co-interior', 'vertical'], 'alternate interior': ['corresponding', 'co-interior', 'alternate exterior'],
    'alternate exterior': ['alternate interior', 'corresponding', 'vertical'], 'co-interior': ['alternate interior', 'corresponding', 'alternate exterior'], vertical: ['corresponding', 'alternate interior', 'co-interior'],
  };
  const why: Record<string, string> = {
    corresponding: 'Both angles sit in the same corner of their crossing: corresponding (an F shape).',
    'alternate interior': 'Both are between the rails, on opposite sides of the transversal: alternate interior (a Z shape).',
    'alternate exterior': 'Both are outside the rails, on opposite sides of the transversal: alternate exterior.',
    'co-interior': 'Both are between the rails on the same side of the transversal: co-interior (a C shape).',
    vertical: 'Both are at the same crossing, directly across from each other: vertical angles.',
  };
  const q = Q(K3, 'name-pair', {
    prompt: 'Brick points at ∠1 and ∠2. What kind of angle pair are they?',
    expression: '∠1 and ∠2 are…',
    answer: 0,
    hint: 'Ask two things: are they between the rails or outside? Same side of the transversal or opposite sides?',
    steps: [why[rel]],
    visual: railFig(th, [{ v: pair[0][0], p: pair[0][1], label: '1' }, { v: pair[1][0], p: pair[1][1], label: '2' }]),
  });
  return choose(rng, q, rel, wrongs[rel]);
}
function converseStep(rng: Rng): AskStep {
  const rel = pick(rng, ['corresponding', 'alternate interior', 'co-interior', 'co-interior'] as Rel[]);
  const pair = pick(rng, REL_PAIRS[rel]); const top = pair[0][0] === 'T' ? pair[0] : pair[1]; const bot = pair[0][0] === 'T' ? pair[1] : pair[0];
  const parallel = rng.next() < 0.5;
  let th = railTheta(rng); let v1: number;
  const v2 = () => measureAt(bot[1], th);
  if (parallel) v1 = measureAt(top[1], th);
  else if (rel === 'co-interior') { th = pick(rng, [75, 80, 100, 105]); v1 = v2(); } // the trap: equal co-interior angles
  else v1 = measureAt(top[1], th) + pick(rng, [-10, -5, 5, 10]);
  const b2 = v2();
  // The figure is neutral: no parallel marks and no tilt (either would give the answer away), so it is
  // labelled 'not to scale' and the player must decide from the measured angles alone.
  const q = Q(K3, 'converse', {
    prompt: `Ada measures ∠1 = ${v1}° and ∠2 = ${b2}°. They are ${rel} angles. Are the rails parallel?`,
    expression: `∠1 = ${v1}°, ∠2 = ${b2}°`,
    answer: parallel ? 1 : 0,
    hint: 'For parallel rails, corresponding and alternate angles must be equal, and co-interior angles must add to 180°.',
    steps: [rel === 'co-interior'
      ? `Co-interior angles of parallel rails add to 180°. Here ${labd(v1, 'angle one')} + ${labd(b2, 'angle two')} = ${labd(v1 + b2, 'their sum')}, so the rails are ${parallel ? '' : 'not '}parallel.`
      : `${rel[0].toUpperCase()}${rel.slice(1)} angles of parallel rails are equal. ${labd(v1, 'angle one')} ${v1 === b2 ? '=' : '≠'} ${labd(b2, 'angle two')}, so the rails are ${parallel ? '' : 'not '}parallel.`],
    visual: railFig(th, [{ v: 'T', p: top[1], label: '1' }, { v: 'B', p: bot[1], label: '2' }], 0, { markers: false, note: 'not to scale' }),
  });
  return choose(rng, q, parallel ? 'Parallel' : 'Not parallel', [parallel ? 'Not parallel' : 'Parallel', 'Can’t tell from angles']);
}
function transAlgebraStep(rng: Rng): AskStep {
  const supp = rng.next() < 0.4;
  if (supp) {
    const { a, b, c, d, x, v1, v2 } = sumPair(rng);
    const th = v1;
    const q = Q(K3, 'transversal-algebra', {
      prompt: `The rails are parallel. Co-interior angles measure (${lin(a, b)})° and (${lin(c, d)})°. Find x.`,
      expression: 'Find x',
      answer: x,
      hint: 'Co-interior angles between parallel rails are not equal. What do they add to?',
      steps: [`Co-interior angles add to 180°: (${lin(a, b)}) + (${lin(c, d)}) = ${lab(180, 'co-interior sum in degrees')}.`, `Combine: ${lin(a + c, b + d)} = ${lab(180, 'co-interior sum in degrees')}.`, ...solveLines(a + c, b + d, 0, 180), `The angles are ${labd(v1, 'first angle')} and ${labd(v2, 'second angle')}.`],
      visual: railFig(th, [{ v: 'T', p: 'LL', label: `${lin(a, b)}°` }, { v: 'B', p: 'UL', label: `${lin(c, d)}°` }]),
    });
    return model(q, { kind: 'balance', a: a + c, b: b + d, c: 0, d: 180, label: `${lin(a + c, b + d)} = 180` }, [String(x)], 'Solve for x on the balance.');
  }
  const { a, b, c, d, x, v } = equalPair(rng, 40, 140);
  const rel = pick(rng, ['corresponding', 'alternate interior'] as Rel[]);
  const pair = pick(rng, REL_PAIRS[rel]);
  const th = pair[0][1] === 'UR' || pair[0][1] === 'LL' ? v : 180 - v;
  const q = Q(K3, 'transversal-algebra', {
    prompt: `The rails are parallel. ${rel === 'corresponding' ? 'Corresponding' : 'Alternate interior'} angles measure (${lin(a, b)})° and (${lin(c, d)})°. Find x.`,
    expression: 'Find x',
    answer: x,
    hint: 'Corresponding and alternate interior angles of parallel rails match. Move the x terms to one side, then the numbers.',
    steps: [`${rel === 'corresponding' ? 'Corresponding' : 'Alternate interior'} angles are equal: ${lin(a, b)} = ${lin(c, d)}.`, ...solveLines(a, b, c, d), `Each angle is ${labd(v, 'each matching angle')}.`],
    visual: railFig(th === 90 ? 95 : th, [{ v: pair[0][0], p: pair[0][1], label: `${lin(a, b)}°` }, { v: pair[1][0], p: pair[1][1], label: `${lin(c, d)}°` }]),
  });
  return model(q, { kind: 'balance', a, b, c, d, label: `${lin(a, b)} = ${lin(c, d)}` }, [String(x)], 'Solve for x on the balance.');
}
/** Decide the relationship before solving: the rails are parallel, but are these two angles equal or supplementary? */
function railEquationStep(rng: Rng): AskStep {
  const rel = pick(rng, ['corresponding', 'alternate interior', 'alternate exterior', 'co-interior', 'co-interior'] as Rel[]);
  const pair = pick(rng, REL_PAIRS[rel]);
  if (rel === 'co-interior') {
    const { a, b, c, d, x, v1, v2 } = sumPair(rng, 180, true);
    // pair[0] is at the top crossing (LL or LR); th makes its measure v1 and its partner's v2 = 180 − v1
    const th = pair[0][1] === 'LL' ? v1 : 180 - v1;
    const { right, wrong } = equationChoices(`${lin(a, b)}`, `${lin(c, d)}`, false);
    const q = Q(K3, 'rail-equation', {
      prompt: `The rails are parallel. The marked angles are (${lin(a, b)})° and (${lin(c, d)})°. Which equation finds x?`,
      expression: 'Which equation?',
      answer: 0,
      hint: 'Name the pair first: same corner (F), a Z between the rails, or a C between the rails? Only one kind adds to 180°.',
      steps: [`The angles are co-interior: ${REL_RULE['co-interior']}.`, `${right}, which gives x = ${lab(x, 'value of x')}: the angles are ${labd(v1, 'first angle')} and ${labd(v2, 'second angle')}.`],
      visual: railFig(th === 90 ? 95 : th, [{ v: pair[0][0], p: pair[0][1], label: `${lin(a, b)}°` }, { v: pair[1][0], p: pair[1][1], label: `${lin(c, d)}°` }]),
    });
    return choose(rng, q, right, wrong);
  }
  const { a, b, c, d, x, v } = equalPair(rng, 40, 140, true);
  const th = pair[0][1] === 'UR' || pair[0][1] === 'LL' ? v : 180 - v;
  const { right, wrong } = equationChoices(`${lin(a, b)}`, `${lin(c, d)}`, true);
  const q = Q(K3, 'rail-equation', {
    prompt: `The rails are parallel. The marked angles are (${lin(a, b)})° and (${lin(c, d)})°. Which equation finds x?`,
    expression: 'Which equation?',
    answer: 0,
    hint: 'Name the pair first: same corner (F), a Z between the rails, or a C between the rails? Only one kind adds to 180°.',
    steps: [`The angles are ${rel} angles: ${REL_RULE[rel]}.`, `${right}, which gives x = ${lab(x, 'value of x')}: each angle is ${labd(v, 'matching angle')}.`],
    visual: railFig(th === 90 ? 95 : th, [{ v: pair[0][0], p: pair[0][1], label: `${lin(a, b)}°` }, { v: pair[1][0], p: pair[1][1], label: `${lin(c, d)}°` }]),
  });
  return choose(rng, q, right, wrong);
}
function railTableStep(rng: Rng): AskStep {
  const th = railTheta(rng); const gp = pick(rng, ['UR', 'UL', 'LL', 'LR'] as Pos[]); const mg = measureAt(gp, th);
  const order: Pos[] = ['UR', 'UL', 'LL', 'LR'];
  const vals = order.map((p) => measureAt(p, th));
  const q = Q(K3, 'all-eight', {
    prompt: `The rails are parallel and one angle at the lower crossing is ${mg}°. Fill in ∠1 to ∠4 at the upper crossing.`,
    expression: `${mg}° → ∠1, ∠2, ∠3, ∠4`,
    answer: vals[0],
    hint: 'Each upper corner matches the same corner below. Only two sizes appear, and they add to 180°.',
    steps: [`Parallel rails make the upper crossing a copy of the lower one, so the matching corner is ${labd(mg, 'given lower angle')} too.`, `The other two corners are ${labd(180, 'straight rail')} − ${labd(mg, 'given lower angle')} = ${labd(180 - mg, 'neighbour angle')}.`, `${vals.map((v, i) => `∠${i + 1} = ${v}°`).join(', ')}.`],
    visual: railFig(th, [{ v: 'B', p: gp, label: `${mg}°` }, { v: 'T', p: 'UR', label: '1' }, { v: 'T', p: 'UL', label: '2' }, { v: 'T', p: 'LL', label: '3' }, { v: 'T', p: 'LR', label: '4' }]),
  });
  return model(q, { kind: 'table', cols: ['∠1', '∠2', '∠3', '∠4'], rows: [[null, null, null, null]], label: 'Degrees at the upper crossing' }, [vals.join(',')], 'Fill in all four angles at the upper crossing.');
}
function eratosthenesStep(rng: Rng): AskStep {
  const [ang, parts] = pick(rng, [[7.2, 50], [7.2, 50], [6, 60], [9, 40], [12, 30]] as [number, number][]);
  const d = ang === 7.2 ? 800 : pick(rng, [300, 400, 500]);
  const where = ang === 7.2 ? 'Earth' : 'the planet';
  const q = Q(K3, 'eratosthenes', {
    prompt: `Sun rays are parallel. At noon the sun is ${fmt(ang)}° from straight overhead in one city, and straight overhead ${d} km due south. How far around ${where} is it?`,
    expression: `${fmt(ang)}° of 360° ↔ ${d} km`,
    answer: parts * d,
    unit: 'km',
    hint: 'Draw both cities\' vertical lines down to the centre. They cut the parallel sun rays: alternate interior angles.',
    steps: [`Alternate interior angles: the angle at the centre between the two cities is also ${labd(ang, 'angle at the centre')}.`, `${labd(360, 'full circle')} ÷ ${labd(ang, 'angle at the centre')} = ${lab(parts, 'equal slices')}, so ${lab(d, 'km between the cities')} is one slice of the way round.`, `${lab(parts, 'slices')} × ${lab(d, 'km per slice')} = ${lab(parts * d, 'km around')}.`],
    visual: (() => {
      const O: P2 = [0, 0]; const S: P2 = [0, 3]; const A = at(O, 115, 3); const Aout = at(O, 115, 4.3); const Aray: P2 = [A[0], 5.2];
      return geo([
        { t: 'circle', c: O, r: 3 }, { t: 'seg', a: O, b: S, dashed: true }, { t: 'seg', a: O, b: Aout, dashed: true },
        { t: 'seg', a: [0, 5.2], b: S, arrow: true }, { t: 'seg', a: Aray, b: A, arrow: true },
        { t: 'arc', at: A, from: Aray, to: Aout, label: `${fmt(ang)}°` }, { t: 'arc', at: O, from: S, to: A, label: '?' },
        { t: 'pt', p: S, label: 'sun overhead' }, { t: 'pt', p: A, label: 'city' }, { t: 'pt', p: O },
        { t: 'text', p: [0, -3.7], text: `${d} km apart · not to scale` },
      ], 260, 260);
    })(),
    app: 'Eratosthenes measured the Earth with a stick and parallel lines.',
  });
  return typed(q);
}
function sunRayStep(rng: Rng): AskStep {
  const a = stepPick(rng, 35, 75, 5);
  const q = Q(K3, 'transversal', {
    prompt: `Sun rays are parallel. A ray hits flat ground at ${a}° beside tower A. At what angle does a ray hit the ground beside tower B?`,
    expression: `ray angle at B = ?`,
    answer: a,
    hint: 'The ground is a transversal crossing two parallel rays.',
    steps: ['The ground cuts the parallel rays in the same corner at each tower: corresponding angles.', `Corresponding angles are equal: ${labd(a, 'ray angle at A')} = ${labd(a, 'ray angle at B')}.`],
    visual: geo([{ t: 'seg', a: [-1, 0], b: [9, 0] }, { t: 'seg', a: [0, 0], b: at([0, 0], 180 + a, -4) }, { t: 'seg', a: [5, 0], b: at([5, 0], 180 + a, -4) }, { t: 'arc', at: [0, 0], from: [1, 0], to: at([0, 0], a, 3), label: `${a}°` }, { t: 'arc', at: [5, 0], from: [6, 0], to: at([5, 0], a, 3), label: '?' }, { t: 'pt', p: [0, 0], label: 'A' }, { t: 'pt', p: [5, 0], label: 'B' }], 320, 180),
  });
  return typed(q);
}

/* ================================================================== */
/* 4. Triangles                                                        */
/* ================================================================== */
const K4 = 'triangles';
/** Vertices of a triangle with base (0,0)–(base,0), angle A at the left and B at the right. */
function triPts(A: number, B: number, base = 6): [P2, P2, P2] {
  const C = 180 - A - B; const ac = (base * Math.sin(rad(B))) / Math.sin(rad(C));
  return [[0, 0], [base, 0], at([0, 0], A, ac)];
}
/** Vertices from side lengths: AB = c on the base, BC = a, CA = b. */
function triSides(a: number, b: number, c: number, o: P2 = [0, 0]): [P2, P2, P2] {
  const x = (b * b + c * c - a * a) / (2 * c); const y = Math.sqrt(Math.max(0, b * b - x * x));
  return [o, [o[0] + c, o[1]], [r3(o[0] + x), r3(o[1] + y)]];
}
/** Arcs at the three vertices ('' = no arc, 'R' = right-angle square). */
function vertexArcs(p: [P2, P2, P2], labels: string[]): GeoItem[] {
  const out: GeoItem[] = [];
  labels.forEach((lb, i) => {
    if (!lb) return;
    const v = p[i]; const f = p[(i + 1) % 3]; const t = p[(i + 2) % 3];
    out.push(lb === 'R' ? { t: 'arc', at: v, from: f, to: t, right: true } : { t: 'arc', at: v, from: f, to: t, label: lb });
  });
  return out;
}
function triFig(A: number, B: number, labels: string[], names?: string[]): Visual {
  const p = triPts(A, B);
  const items: GeoItem[] = [{ t: 'poly', pts: p }, ...vertexArcs(p, labels)];
  if (names) names.forEach((n, i) => items.push({ t: 'pt', p: p[i], label: n }));
  return geo(items, 300, 200);
}
function missingAngleDialStep(rng: Rng): AskStep {
  const A = stepPick(rng, 25, 100, 5); const B = stepPick(rng, 25, 155 - A, 5); const angs = [A, B, 180 - A - B];
  const u = rint(rng, 0, 2); const known = angs.filter((_, i) => i !== u);
  const q = Q(K4, 'angle-sum', {
    prompt: `A truss panel has angles of ${known[0]}° and ${known[1]}°. Set the dial to the third angle.`,
    expression: `${known[0]}° + ${known[1]}° + ? = 180°`,
    answer: angs[u],
    hint: 'Tear the three corners off any triangle and they line up into a straight line.',
    steps: ['The angles of a triangle add to 180°.', `${labd(180, 'angle sum')} − ${labd(known[0], 'first angle')} − ${labd(known[1], 'second angle')} = ${labd(angs[u], 'third angle')}.`],
    visual: triFig(A, B, angs.map((v, i) => (i === u ? '?' : `${v}°`))),
    app: 'Every roof truss and bridge panel is checked with the triangle angle sum.',
  });
  return model(q, dial('Set the third angle'), [String(angs[u])], 'Turn the dial to the missing angle.');
}
function exteriorStep(rng: Rng): AskStep {
  const A = stepPick(rng, 30, 70, 5); const beta = stepPick(rng, 40, Math.min(100, 160 - A), 5); const C = 180 - A - beta; const ext = A + C;
  const p = triPts(A, beta); const E: P2 = [9, 0];
  const q = Q(K4, 'exterior', {
    prompt: 'A truss chord runs past the joint. Find the exterior angle ?.',
    expression: `? = exterior angle`,
    answer: ext,
    hint: 'The exterior angle and its inside neighbour make a straight line. What else adds to that neighbour to make 180°?',
    steps: ['An exterior angle equals the sum of the two remote interior angles.', `${labd(A, 'left angle')} + ${labd(C, 'top angle')} = ${labd(ext, 'exterior angle')}.`, `Check: ${labd(beta, 'inside neighbour')} + ${labd(ext, 'exterior angle')} = ${labd(180, 'straight line')}.`],
    visual: geo([{ t: 'poly', pts: p }, { t: 'seg', a: p[1], b: E, dashed: true }, ...vertexArcs(p, [`${A}°`, '', `${C}°`]), { t: 'arc', at: p[1], from: E, to: p[2], label: '?' }], 320, 200),
  });
  return choose(rng, q, dg(ext), [dg(beta), dg(360 - ext), dg(Math.abs(A - C) || 15)]);
}
function classifyTriStep(rng: Rng): AskStep {
  if (rng.next() < 0.65) {
    const kind = pick(rng, ['obtuse', 'obtuse', 'right', 'acute'] as const);
    let a: number; let b: number;
    if (kind === 'obtuse') { a = stepPick(rng, 20, 45, 5); b = stepPick(rng, 20, 85 - a, 5); }
    else if (kind === 'right') { a = stepPick(rng, 20, 70, 5); b = 90 - a; }
    else { a = stepPick(rng, 50, 80, 5); b = stepPick(rng, Math.max(95 - a, 20), 80, 5); if (a === 60 && b === 60) b = 65; }
    const c = 180 - a - b;
    const q = Q(K4, 'classify', {
      prompt: `Two angles of a bracket are ${a}° and ${b}°. Classify the triangle by its angles.`,
      expression: `${a}°, ${b}°, ?`,
      answer: 0,
      hint: 'Find the third angle first. The triangle is named by its biggest angle.',
      steps: [`The third angle is ${labd(180, 'angle sum')} − ${labd(a, 'first angle')} − ${labd(b, 'second angle')} = ${labd(c, 'third angle')}.`, `The largest angle is ${labd(Math.max(a, b, c), 'largest angle')}, so the triangle is ${kind}.`],
      visual: triFig(a, b, [`${a}°`, `${b}°`, '?']),
    });
    return choose(rng, q, `${kind} triangle`, ['acute triangle', 'right triangle', 'obtuse triangle', 'equiangular triangle'].filter((k) => k !== `${kind} triangle`));
  }
  const kind = pick(rng, ['equilateral', 'isosceles', 'scalene'] as const);
  const s = rint(rng, 4, 9);
  const sides = kind === 'equilateral' ? [s, s, s] : kind === 'isosceles' ? [s, s, s + pick(rng, [-2, -1, 1, 2, 3])] : [s, s + 1, s + 3];
  const p = triSides(sides[1], sides[2], sides[0]);
  const q = Q(K4, 'classify', {
    prompt: `A frame has sides ${sides.join(' m, ')} m. Classify it by its sides.`,
    expression: sides.map((v) => `${v}`).join(', '),
    answer: 0,
    hint: 'Count how many sides match.',
    steps: [kind === 'equilateral' ? 'All three sides are equal: equilateral.' : kind === 'isosceles' ? 'Exactly two sides are equal: isosceles.' : 'No two sides are equal: scalene.'],
    visual: geo([{ t: 'poly', pts: p, labels: [`${sides[0]}`, `${sides[1]}`, `${sides[2]}`] }], 280, 200),
  });
  // 'isosceles' (at least two equal sides) also fits an equilateral frame, so it is never a wrong choice there.
  const wrongs = kind === 'equilateral' ? ['scalene', 'right', 'obtuse'] : ['equilateral', 'isosceles', 'scalene', 'right'].filter((k) => k !== kind);
  return choose(rng, q, kind, wrongs);
}
function inequalityStep(rng: Rng): AskStep {
  const tri = (x: number, y: number, z: number) => [x, y, z].sort((m, n) => m - n);
  const a = rint(rng, 3, 8); const b = rint(rng, 3, 8); const c = rint(rng, Math.abs(a - b) + 1, a + b - 1);
  const good = tri(a, b, c);
  const p = rint(rng, 2, 6); const qq = rint(rng, 3, 7); const flat = tri(p, qq, p + qq);
  const u = rint(rng, 2, 5); const v = rint(rng, 2, 5); const short = tri(u, v, u + v + rint(rng, 1, 4));
  const w = rint(rng, 1, 3); const short2 = tri(w, w + 1, 2 * w + 1 + rint(rng, 2, 5));
  const txt = (t: number[]) => `${t[0]} m, ${t[1]} m, ${t[2]} m`;
  const q = Q(K4, 'inequality', {
    prompt: 'Brick has four bundles of beams. Which bundle can be bolted into a triangle?',
    expression: 'Which three lengths make a triangle?',
    answer: 0,
    hint: 'Lay the two shorter beams along the longest. Do their ends reach past each other, or fall flat or short?',
    steps: [`${txt(good)}: the two shorter beams add to more than the longest: ${lab(good[0], 'shortest in m')} + ${lab(good[1], 'middle in m')} = ${lab(good[0] + good[1], 'two shorter in m')} > ${lab(good[2], 'longest in m')}.`, `${txt(flat)} fails: ${lab(flat[0], 'shortest in m')} + ${lab(flat[1], 'middle in m')} is exactly ${lab(flat[2], 'longest in m')}, so the beams lie flat.`, 'Triangle inequality: any two sides must add to MORE than the third.'],
    visual: card('Beam bundles', ['two shorter beams must reach', 'past each other over the longest']),
  });
  return choose(rng, q, txt(good), [txt(flat), txt(short), txt(short2)]);
}
function thirdSideStep(rng: Rng): AskStep {
  const a = rint(rng, 3, 12); let b = rint(rng, 3, 12); if (a === b) b = a === 12 ? 9 : a + 2;
  const longest = rng.next() < 0.6; const ans = longest ? a + b - 1 : Math.abs(a - b) + 1;
  const q = Q(K4, 'inequality', {
    prompt: `Two truss beams are ${a} m and ${b} m. What is the ${longest ? 'longest' : 'shortest'} whole-metre third beam that still makes a triangle?`,
    expression: `beams ${a} m and ${b} m, third = ?`,
    answer: ans,
    hint: 'The third side must be less than the other two combined, and more than their difference.',
    steps: [`The third side must be between ${lab(Math.max(a, b), 'longer beam in m')} − ${lab(Math.min(a, b), 'shorter beam in m')} = ${lab(Math.abs(a - b), 'lower limit in m')} and ${lab(a, 'first beam in m')} + ${lab(b, 'second beam in m')} = ${lab(a + b, 'upper limit in m')}, not equal to either.`, `The ${longest ? 'longest' : 'shortest'} whole number in that range is ${lab(ans, 'third beam in m')}.`],
    visual: { type: 'numline', min: 0, max: 25, step: 5, points: [{ x: a, label: `${a}` }, { x: b, label: `${b}` }] },
  });
  return model(q, { kind: 'numberline', start: 0, min: 0, max: 25, label: `Beams of ${lab(a, 'metres')} and ${lab(b, 'metres')}` }, [String(ans)], `Tap the ${longest ? 'longest' : 'shortest'} whole-metre third beam that works.`);
}
function triAlgebraStep(rng: Rng): AskStep {
  let x = 20; let p = [1, 2, 1]; let c = [10, 5, 85]; let angs = [30, 45, 105];
  for (let g = 0; g < 300; g++) {
    const X = rint(rng, 8, 30); const P = [rint(rng, 1, 3), rint(rng, 1, 3), rint(rng, 1, 2)]; const C1 = stepPick(rng, -10, 20, 5); const C2 = stepPick(rng, -10, 20, 5);
    const a1 = P[0] * X + C1; const a2 = P[1] * X + C2; const a3 = 180 - a1 - a2; const C3 = a3 - P[2] * X;
    if (a1 >= 20 && a2 >= 20 && a3 >= 20 && Math.abs(C3) <= 40) { x = X; p = P; c = [C1, C2, C3]; angs = [a1, a2, a3]; break; }
  }
  const T = p[0] + p[1] + p[2]; const K = c[0] + c[1] + c[2];
  const ex = p.map((pi, i) => lin(pi, c[i]));
  const q = Q(K4, 'angle-algebra', {
    prompt: 'The truss angles are written in x. Find x.',
    expression: 'Find x',
    answer: x,
    hint: 'All three angles together make 180°. Collect the x terms and the numbers.',
    steps: ['The angles of a triangle add to 180°.', `Combine like terms: ${lin(T, K)} = ${lab(180, 'angle sum in degrees')}.`, ...solveLines(T, K, 0, 180), `The angles are ${labd(angs[0], 'left corner')}, ${labd(angs[1], 'right corner')} and ${labd(angs[2], 'top corner')}.`],
    visual: triFig(angs[0], angs[1], ex.map((e) => `${e}`)),
  });
  return model(q, { kind: 'balance', a: T, b: K, c: 0, d: 180, label: `${lin(T, K)} = 180` }, [String(x)], 'Solve for x on the balance.');
}
function isoscelesStep(rng: Rng): AskStep {
  const givenVertex = rng.next() < 0.5;
  const base = givenVertex ? 0 : stepPick(rng, 30, 65, 5);
  const v = givenVertex ? stepPick(rng, 50, 140, 10) : 180 - 2 * base;
  const b = (180 - v) / 2;
  const P: [P2, P2, P2] = [[0, 0], [6, 0], [3, r3(3 * Math.tan(rad(b)))]];
  const q = Q(K4, 'isosceles', {
    prompt: givenVertex ? `A roof truss has two equal rafters. The peak angle is ${v}°. Set the dial to one base angle.` : `A roof truss has two equal rafters. Each base angle is ${b}°. Set the dial to the peak angle.`,
    expression: givenVertex ? `${v}° + 2 × ? = 180°` : `? + 2 × ${b}° = 180°`,
    answer: givenVertex ? b : v,
    hint: 'Equal sides face equal angles, so the two base angles match. All three still add to 180°.',
    steps: givenVertex ? ['The base angles are equal and the three angles add to 180°.', `${labd(180, 'angle sum')} − ${labd(v, 'peak angle')} = ${labd(180 - v, 'both base angles')}.`, `Shared equally: ${labd(180 - v, 'both base angles')} ÷ ${lab(2, 'base angles')} = ${labd(b, 'each base angle')}.`] : ['The base angles are equal and the three angles add to 180°.', `${labd(180, 'angle sum')} − ${labd(b, 'base angle')} − ${labd(b, 'base angle')} = ${labd(v, 'peak angle')}.`],
    visual: geo([{ t: 'poly', pts: P }, { t: 'tick', a: P[0], b: P[2] }, { t: 'tick', a: P[1], b: P[2] }, ...vertexArcs(P, givenVertex ? ['?', '', `${v}°`] : [`${b}°`, `${b}°`, '?'])], 280, 200),
  });
  const ans = givenVertex ? b : v;
  return model(q, dial(givenVertex ? 'Set a base angle' : 'Set the peak angle'), [String(ans)], givenVertex ? 'Turn the dial to one base angle.' : 'Turn the dial to the peak angle.');
}
function shortcutStep(rng: Rng): AskStep {
  const a = rint(rng, 3, 9); let b = rint(rng, 2, 8); if (a === b) b += 1;
  const lo = Math.abs(a - b); const hi = a + b;
  const good = rint(rng, lo + 1, hi - 1);
  const q = Q(K4, 'inequality', {
    prompt: `A drone flies ${a} km to a relay mast, then ${b} km to the lab. The three points make a triangle. Which could be the straight-line distance back?`,
    expression: `legs ${a} km, ${b} km → d = ?`,
    answer: good,
    hint: 'The direct path is shorter than the two legs together, but longer than their difference.',
    steps: [`The direct distance must be between ${lab(Math.max(a, b), 'longer leg in km')} − ${lab(Math.min(a, b), 'shorter leg in km')} = ${lab(lo, 'lower limit in km')} and ${lab(a, 'first leg in km')} + ${lab(b, 'second leg in km')} = ${lab(hi, 'upper limit in km')}, not equal to either.`, `Only ${lab(good, 'direct distance in km')} fits.`],
    visual: card('Flight log', [`leg 1: ${a} km`, `leg 2: ${b} km`, 'direct: ?']),
  });
  return choose(rng, q, `${good} km`, [`${hi} km`, `${hi + rint(rng, 1, 4)} km`, `${lo === 0 ? hi + 6 : lo} km`]);
}
function robotTurnStep(rng: Rng): AskStep {
  const a = stepPick(rng, 40, 80, 5); const b = stepPick(rng, 40, 80, 5); const c = 180 - a - b; const turn = 180 - c;
  const q = Q(K4, 'exterior', {
    prompt: `A survey robot drives a triangle. The corner angles inside it are ${a}° and ${b}° at its first two stops. How many degrees does it turn at the third corner?`,
    expression: 'turn = exterior angle at the third corner',
    answer: turn,
    hint: 'The robot turns through the exterior angle, not the inside corner.',
    steps: [`The turn is the exterior angle, which equals the sum of the other two interior angles: ${labd(a, 'first corner')} + ${labd(b, 'second corner')} = ${labd(turn, 'turn')}.`, `Check: the inside corner is ${labd(c, 'third corner')}, and ${labd(c, 'third corner')} + ${labd(turn, 'turn')} = ${labd(180, 'straight line')}.`],
    visual: triFig(a, b, [`${a}°`, `${b}°`, '']),
    app: 'Robot and drone paths are programmed as turn angles, which are exterior angles.',
  });
  return typed(q);
}

/* ================================================================== */
/* 5. Congruence & proof                                               */
/* ================================================================== */
const K5 = 'congruence';
type Crit = 'SSS' | 'SAS' | 'ASA' | 'AAS' | 'HL' | 'SSA' | 'AAA';
function critFig(c: Crit): Visual {
  const base: [P2, P2, P2] = c === 'HL' ? [[0, 0], [4, 0], [0, 3]] : [[0, 0], [5, 0], [1.6, 3.2]];
  // The copy is a mirror image, except for the traps: AAA draws a bigger triangle (same angles, not the
  // same size) and SSA draws the other triangle of the ambiguous case (same ∠A, AB and BC, but C is
  // closer to A: the ray from A at 63° meets the circle of radius BC about B twice).
  const src: [P2, P2, P2] = c === 'AAA' ? base.map(([x, y]) => [r3(1.4 * x), r3(1.4 * y)]) as [P2, P2, P2] : c === 'SSA' ? [[0, 0], [5, 0], [0.4, 0.8]] : base;
  const w = Math.max(...src.map((p) => p[0]));
  const copy: [P2, P2, P2] = src.map(([x, y]) => [r3(7.5 + (w - x)), y]) as [P2, P2, P2];
  const ANG = ['63°', '43°', '74°'];
  const items: GeoItem[] = [];
  for (const p of [base, copy]) {
    items.push({ t: 'poly', pts: p });
    const side = (i: number, n: number) => items.push({ t: 'tick', a: p[i], b: p[(i + 1) % 3], n });
    const ang = (i: number) => items.push(...vertexArcs(p, [0, 1, 2].map((k) => (k === i ? ANG[i] : ''))));
    if (c === 'SSS') { side(0, 1); side(1, 2); side(2, 3); }
    if (c === 'SAS') { side(0, 1); side(2, 2); ang(0); }
    if (c === 'ASA') { ang(0); ang(1); side(0, 1); }
    if (c === 'AAS') { ang(0); ang(1); side(1, 1); }
    if (c === 'SSA') { side(0, 1); side(1, 2); ang(0); }
    if (c === 'AAA') { ang(0); ang(1); ang(2); }
    if (c === 'HL') { items.push(...vertexArcs(p, ['R', '', ''])); side(1, 2); side(0, 1); }
  }
  return geo(items, 330, 180);
}
const CRIT_WHY: Record<Crit, string> = {
  SSS: 'All three pairs of sides are marked equal: SSS.',
  SAS: 'Two sides and the angle BETWEEN them are marked: SAS.',
  ASA: 'Two angles and the side BETWEEN them are marked: ASA.',
  AAS: 'Two angles and a side that is NOT between them are marked: AAS.',
  HL: 'Right triangles with equal hypotenuses and one equal leg: HL.',
  SSA: 'Two sides and an angle that is NOT between them: SSA does not prove congruence (two different triangles can fit).',
  AAA: 'Three equal angles only fix the shape, not the size: AAA proves similar, not congruent.',
};
function criterionStep(rng: Rng): AskStep {
  const c = pick(rng, ['SSS', 'SAS', 'ASA', 'AAS', 'HL', 'SSA', 'AAA'] as Crit[]);
  const right = c === 'SSA' || c === 'AAA' ? 'Not enough to prove it' : c;
  const wrongs: Record<Crit, string[]> = {
    SSS: ['SAS', 'HL', 'Not enough to prove it'], SAS: ['SSA', 'SSS', 'ASA'], ASA: ['AAS', 'SAS', 'AAA'], AAS: ['ASA', 'AAA', 'SSA'],
    HL: ['SSA', 'SAS', 'Not enough to prove it'], SSA: ['SAS', 'SSA', 'ASA'], AAA: ['AAA', 'ASA', 'AAS'],
  };
  const q = Q(K5, 'criterion', {
    prompt: 'The marks show what Brick measured on both wall panels. Which rule proves the triangles congruent?',
    expression: 'Congruent by…?',
    answer: 0,
    hint: 'Read the marks in order around the triangle. Is the marked angle between the marked sides? Is the marked side between the marked angles?',
    steps: [CRIT_WHY[c]],
    visual: critFig(c),
    app: 'Prefabricated panels are checked for congruence with the fewest measurements.',
  });
  return choose(rng, q, right, wrongs[c]);
}
const TRI_SIDES: [number, number, number][] = [[5, 7, 9], [6, 8, 11], [7, 10, 12], [4, 6, 7], [8, 9, 13], [5, 8, 10]];
function congPair(rng: Rng) {
  const [ab, bc, ca] = pick(rng, TRI_SIDES);
  const letters = pick(rng, ['DEF', 'PQR', 'XYZ', 'KLM']);
  const perm = rng.shuffle([0, 1, 2]);
  const N = perm.map((i) => letters[i]); // A ↔ N[0], B ↔ N[1], C ↔ N[2]
  const p = triSides(bc, ca, ab);
  const maxX = Math.max(...p.map((v) => v[0]));
  const off = maxX + 3;
  const mir: [P2, P2, P2] = p.map(([x, y]) => [r3(off + (maxX - x)), y]) as [P2, P2, P2];
  const len = (i: number, j: number) => { const k = [i, j].sort().join(''); return k === '01' ? ab : k === '12' ? bc : ca; };
  const visual = geo([
    { t: 'poly', pts: p, labels: [`${ab}`, `${bc}`, `${ca}`] }, { t: 'pt', p: p[0], label: 'A' }, { t: 'pt', p: p[1], label: 'B' }, { t: 'pt', p: p[2], label: 'C' },
    { t: 'poly', pts: mir }, { t: 'pt', p: mir[0], label: N[0] }, { t: 'pt', p: mir[1], label: N[1] }, { t: 'pt', p: mir[2], label: N[2] },
  ], 330, 190);
  return { ab, bc, ca, N, name: N.join(''), len, visual };
}
function cpctcStep(rng: Rng): AskStep {
  const t = congPair(rng);
  const [i, j] = pick(rng, [[0, 1], [1, 2], [2, 0]] as [number, number][]);
  const ans = t.len(i, j);
  const q = Q(K5, 'cpctc', {
    prompt: `ΔABC ≅ Δ${t.name}. How long is ${t.N[i]}${t.N[j]}?`,
    expression: `${t.N[i]}${t.N[j]} = ?`,
    answer: ans,
    hint: 'Match letters by their place in the statement: first with first, second with second, third with third.',
    steps: [`In ΔABC ≅ Δ${t.name}: A ↔ ${t.N[0]}, B ↔ ${t.N[1]}, C ↔ ${t.N[2]}.`, `${t.N[i]}${t.N[j]} matches ${'ABC'[i]}${'ABC'[j]}, which is ${lab(ans, `length of ${'ABC'[i]}${'ABC'[j]}`)}.`, 'Corresponding parts of congruent triangles are congruent (CPCTC).'],
    visual: t.visual,
  });
  return choose(rng, q, String(ans), [String(t.ab), String(t.bc), String(t.ca), String(t.ab + t.bc + t.ca)]);
}
function corrTableStep(rng: Rng): AskStep {
  const t = congPair(rng);
  const pairs = rng.shuffle([[0, 1], [1, 2], [2, 0]] as [number, number][]);
  const vals = pairs.map(([i, j]) => t.len(i, j));
  const q = Q(K5, 'cpctc', {
    prompt: `ΔABC ≅ Δ${t.name}. Fill in the side lengths of Δ${t.name}.`,
    expression: `ΔABC ≅ Δ${t.name}`,
    answer: vals[0],
    hint: 'Each side is named by two letters. Find the matching two letters of ΔABC in the same places.',
    steps: [`A ↔ ${t.N[0]}, B ↔ ${t.N[1]}, C ↔ ${t.N[2]}.`, ...pairs.map(([i, j], k) => `${t.N[i]}${t.N[j]} ↔ ${'ABC'[i]}${'ABC'[j]} = ${lab(vals[k], `length of ${'ABC'[i]}${'ABC'[j]}`)}.`)],
    visual: t.visual,
  });
  return model(q, { kind: 'table', rowLabels: pairs.map(([i, j]) => `${t.N[i]}${t.N[j]}`), cols: ['length'], rows: [[null], [null], [null]], label: `Sides of Δ${t.name}` }, [vals.join(',')], `Fill in each side of Δ${t.name}.`);
}
/** Two labelled triangles ABC and DEF (same shape, side by side) for the proof figures. */
const PF_T1: [P2, P2, P2] = [[0, 0], [4, 0], [1.5, 3]];
const PF_T2: [P2, P2, P2] = PF_T1.map(([x, y]) => [x + 6, y]) as [P2, P2, P2];
function proofPairFig(extra: (p: [P2, P2, P2]) => GeoItem[]): Visual {
  const items: GeoItem[] = [];
  for (const [p, names] of [[PF_T1, 'ABC'], [PF_T2, 'DEF']] as [[P2, P2, P2], string][]) {
    items.push({ t: 'poly', pts: p }, ...extra(p), ...p.map((v, i) => ({ t: 'pt', p: v, label: names[i] } as GeoItem)));
  }
  return geo(items, 330, 180);
}
type ProofFig = 'midpoint' | 'vertical' | 'reflexive' | 'cpctc' | 'parallel' | 'sas' | 'bisector' | 'aas' | 'perp';
function proofFig(k: ProofFig): Visual {
  const pt2 = (p: P2, label: string): GeoItem => ({ t: 'pt', p, label });
  if (k === 'midpoint') return geo([{ t: 'seg', a: [0, 0], b: [6, 0] }, { t: 'tick', a: [0, 0], b: [3, 0] }, { t: 'tick', a: [3, 0], b: [6, 0] }, pt2([0, 0], 'A'), pt2([3, 0], 'M'), pt2([6, 0], 'B'), ...bounds([0, -1], [6, 1])], 300, 110);
  if (k === 'vertical') { const A: P2 = [-3, 1.5]; const B: P2 = [3, -1.5]; const C: P2 = [-3, -1.5]; const D: P2 = [3, 1.5]; const E: P2 = [0, 0]; return geo([{ t: 'seg', a: A, b: B }, { t: 'seg', a: C, b: D }, { t: 'arc', at: E, from: A, to: C }, { t: 'arc', at: E, from: B, to: D }, pt2(A, 'A'), pt2(B, 'B'), pt2(C, 'C'), pt2(D, 'D'), pt2(E, 'E')], 280, 180); }
  if (k === 'reflexive') { const A: P2 = [0, 0]; const B: P2 = [4, 0]; const C: P2 = [5, 3]; const D: P2 = [1, 3]; return geo([{ t: 'poly', pts: [A, B, C, D] }, { t: 'seg', a: A, b: C }, { t: 'tick', a: A, b: C, n: 2 }, pt2(A, 'A'), pt2(B, 'B'), pt2(C, 'C'), pt2(D, 'D')], 280, 180); }
  if (k === 'parallel') { const A: P2 = [0, 3]; const B: P2 = [5, 3]; const C: P2 = [4, 0]; const D: P2 = [-1, 0]; return geo([{ t: 'seg', a: A, b: B }, { t: 'seg', a: D, b: C }, { t: 'seg', a: A, b: C }, { t: 'arc', at: A, from: B, to: C }, { t: 'arc', at: C, from: D, to: A }, { t: 'text', p: [2.5, 3.35], text: '›' }, { t: 'text', p: [1.5, 0.35], text: '›' }, pt2(A, 'A'), pt2(B, 'B'), pt2(C, 'C'), pt2(D, 'D')], 300, 170); }
  if (k === 'bisector') { const Bv: P2 = [0, 0]; const A = at(Bv, 10, 4.5); const C = at(Bv, 90, 4.5); const D = at(Bv, 50, 4.5); return geo([{ t: 'seg', a: Bv, b: A }, { t: 'seg', a: Bv, b: C }, { t: 'seg', a: Bv, b: D, dashed: true }, { t: 'arc', at: Bv, from: A, to: D }, { t: 'arc', at: Bv, from: D, to: C }, pt2(Bv, 'B'), pt2(A, 'A'), pt2(C, 'C'), pt2(D, 'D')], 240, 200); }
  if (k === 'perp') { const A: P2 = [0, 3]; const Bv: P2 = [0, 0]; const C: P2 = [4, 0]; return geo([{ t: 'seg', a: A, b: Bv }, { t: 'seg', a: Bv, b: C }, { t: 'arc', at: Bv, from: C, to: A, right: true }, pt2(A, 'A'), pt2(Bv, 'B'), pt2(C, 'C')], 240, 180); }
  if (k === 'cpctc') return proofPairFig((p) => [{ t: 'arc', at: p[1], from: p[2], to: p[0] }, { t: 'tick', a: p[0], b: p[1] }, { t: 'tick', a: p[1], b: p[2], n: 2 }, { t: 'tick', a: p[2], b: p[0], n: 3 }]);
  if (k === 'sas') return proofPairFig((p) => [{ t: 'tick', a: p[0], b: p[1] }, { t: 'tick', a: p[1], b: p[2], n: 2 }, { t: 'arc', at: p[1], from: p[2], to: p[0] }]);
  return proofPairFig((p) => [{ t: 'arc', at: p[0], from: p[1], to: p[2] }, { t: 'arc', at: p[1], from: p[2], to: p[0] }, { t: 'tick', a: p[1], b: p[2], n: 2 }]); // aas
}
const PROOFS: { given: string; statement: string; right: string; wrong: string[]; fig: ProofFig }[] = [
  { given: 'M is the midpoint of AB.', statement: 'AM ≅ MB', right: 'Definition of midpoint', wrong: ['Vertical angles are congruent', 'Reflexive property', 'CPCTC'], fig: 'midpoint' },
  { given: 'AB and CD cross at E.', statement: '∠AEC ≅ ∠BED', right: 'Vertical angles are congruent', wrong: ['Linear pairs are supplementary', 'Alternate interior angles are congruent', 'Definition of midpoint'], fig: 'vertical' },
  { given: 'ΔABC and ΔCDA share side AC.', statement: 'AC ≅ AC', right: 'Reflexive property', wrong: ['Given', 'Definition of midpoint', 'SSS'], fig: 'reflexive' },
  { given: 'ΔABC ≅ ΔDEF (already proved).', statement: '∠B ≅ ∠E', right: 'CPCTC', wrong: ['SAS', 'Vertical angles are congruent', 'Given'], fig: 'cpctc' },
  { given: 'AB ∥ CD, cut by transversal AC.', statement: '∠BAC ≅ ∠DCA', right: 'Alternate interior angles are congruent', wrong: ['Corresponding angles are congruent', 'Vertical angles are congruent', 'CPCTC'], fig: 'parallel' },
  { given: 'AB ≅ DE, ∠B ≅ ∠E, BC ≅ EF.', statement: 'ΔABC ≅ ΔDEF', right: 'SAS', wrong: ['SSA', 'ASA', 'CPCTC'], fig: 'sas' },
  { given: 'BD bisects ∠ABC.', statement: '∠ABD ≅ ∠DBC', right: 'Definition of angle bisector', wrong: ['Definition of midpoint', 'Vertical angles are congruent', 'Reflexive property'], fig: 'bisector' },
  { given: '∠A ≅ ∠D, ∠B ≅ ∠E, BC ≅ EF.', statement: 'ΔABC ≅ ΔDEF', right: 'AAS', wrong: ['ASA', 'AAA', 'SSA'], fig: 'aas' },
  { given: 'AB ⊥ BC.', statement: '∠ABC = 90°', right: 'Definition of perpendicular', wrong: ['Definition of midpoint', 'Linear pairs are supplementary', 'Given'], fig: 'perp' },
];
function reasonStep(rng: Rng): AskStep {
  const f = pick(rng, PROOFS);
  const q = Q(K5, 'proof', {
    prompt: `Given: ${f.given} Statement: ${f.statement}. Which reason goes in Vector's blank?`,
    expression: `${f.statement}   Reason: ?`,
    answer: 0,
    hint: 'A reason must be a definition, property or theorem that turns the given facts into exactly this statement.',
    steps: [`${f.statement} because: ${f.right}.`, `Given: ${f.given}`],
    visual: proofFig(f.fig),
    app: 'Engineers justify every step of a design check, just like a proof.',
  });
  return choose(rng, q, f.right, f.wrong);
}
/** Whole proofs: the player follows the chain and fills one blank reason; the distractors are reasons from the same proof. */
const CHAINS: { given: string; prove: string; lines: [string, string][] }[] = [
  { given: 'M is the midpoint of AB, and CM ⊥ AB.', prove: 'CA ≅ CB', lines: [['AM ≅ MB', 'Definition of midpoint'], ['∠AMC ≅ ∠BMC', 'Definition of perpendicular (both 90°)'], ['CM ≅ CM', 'Reflexive property'], ['ΔAMC ≅ ΔBMC', 'SAS'], ['CA ≅ CB', 'CPCTC']] },
  { given: 'In ABCD, AB ∥ CD and AB ≅ CD.', prove: 'BC ≅ DA', lines: [['AB ≅ CD', 'Given'], ['∠BAC ≅ ∠DCA', 'Alternate interior angles are congruent'], ['AC ≅ AC', 'Reflexive property'], ['ΔABC ≅ ΔCDA', 'SAS'], ['BC ≅ DA', 'CPCTC']] },
];
function proofChainStep(rng: Rng): AskStep {
  const c = pick(rng, CHAINS); const blank = rint(rng, 1, c.lines.length - 1);
  const right = c.lines[blank][1];
  const wrong = rng.shuffle(c.lines.filter((_, i) => i !== blank).map((l) => l[1]));
  const q = Q(K5, 'proof-chain', {
    prompt: `Given: ${c.given} Prove: ${c.prove}. Which reason fills the blank in step ${blank + 1}?`,
    expression: `${c.lines[blank][0]}   Reason: ?`,
    answer: 0,
    hint: 'Read the chain in order. What does this step use: a definition, a shared side, a congruence rule, or a matching part of triangles already proved congruent?',
    steps: [`Step ${blank + 1}, ${c.lines[blank][0]}: ${right}.`, ...c.lines.map(([st, r], i) => `${i + 1}. ${st}: ${r}.`)],
    visual: card(`Prove ${c.prove}`, c.lines.map(([st, r], i) => `${i + 1}. ${st}  |  ${i === blank ? '?' : r}`)),
    app: 'A safety case is a chain of reasons: every link must hold.',
  });
  return choose(rng, q, right, wrong);
}
function congAlgebraStep(rng: Rng): AskStep {
  const { a, b, c, d, x, v } = equalPair(rng, 10, 60);
  const q = Q(K5, 'cong-algebra', {
    prompt: `ΔABC ≅ ΔDEF. AB = ${lin(a, b)} and DE = ${lin(c, d)}. Find x.`,
    expression: 'Find x',
    answer: x,
    hint: 'AB and DE are corresponding sides of congruent triangles.',
    steps: ['Corresponding sides are equal (CPCTC): set the expressions equal.', ...solveLines(a, b, c, d), `Both sides measure ${lab(v, 'length of AB and DE')}.`],
    visual: card('ΔABC ≅ ΔDEF', [`AB = ${lin(a, b)}`, `DE = ${lin(c, d)}`]),
  });
  return model(q, { kind: 'balance', a, b, c, d, label: `${lin(a, b)} = ${lin(c, d)}` }, [String(x)], 'Balance the equation to find x.');
}
function cpctcAngleStep(rng: Rng): AskStep {
  const letters = pick(rng, ['DEF', 'PQR', 'XYZ', 'KLM']); const perm = rng.shuffle([0, 1, 2]); const N = perm.map((i) => letters[i]); const name = N.join('');
  const A = stepPick(rng, 35, 80, 5); const B = stepPick(rng, 35, 125 - A, 5); const angs = [A, B, 180 - A - B];
  const k = pick(rng, [2, 2, 0, 1]);
  const p = triPts(A, B, 5); const mir: [P2, P2, P2] = p.map(([x, y]) => [r3(8 + (5 - x)), y]) as [P2, P2, P2];
  const q = Q(K5, 'cpctc-angle', {
    prompt: `ΔABC ≅ Δ${name}. ∠A = ${A}° and ∠B = ${B}°. Set the dial to ∠${N[k]}.`,
    expression: `∠${N[k]} = ?`,
    answer: angs[k],
    hint: `Which angle of ΔABC sits in the same place as ${N[k]} in the statement?`,
    steps: [`In ΔABC ≅ Δ${name}, ∠${N[k]} ↔ ∠${'ABC'[k]}.`, k === 2 ? `∠C = ${labd(180, 'angle sum')} − ${labd(A, 'angle A')} − ${labd(B, 'angle B')} = ${labd(angs[2], 'angle C')}, so ∠${N[2]} = ${labd(angs[2], 'same as angle C')}.` : `So ∠${N[k]} = ${labd(angs[k], `same as angle ${'ABC'[k]}`)}.`],
    visual: geo([
      { t: 'poly', pts: p }, ...vertexArcs(p, [`${A}°`, `${B}°`, '']), { t: 'pt', p: p[0], label: 'A' }, { t: 'pt', p: p[1], label: 'B' }, { t: 'pt', p: p[2], label: 'C' },
      { t: 'poly', pts: mir }, ...vertexArcs(mir, [0, 1, 2].map((i) => (i === k ? '?' : ''))), { t: 'pt', p: mir[0], label: N[0] }, { t: 'pt', p: mir[1], label: N[1] }, { t: 'pt', p: mir[2], label: N[2] },
    ], 330, 190),
  });
  return model(q, dial(`Set ∠${N[k]}`), [String(angs[k])], `Turn the dial to ∠${N[k]}.`);
}
function riverStep(rng: Rng): AskStep {
  const w = rint(rng, 18, 60); const half = rint(rng, 15, 40);
  const q = Q(K5, 'cpctc', {
    prompt: `Ada paces out ΔABC ≅ ΔEDC on the near bank, with BC = CD = ${half} m. DE measures ${w} m. How wide is the river, AB?`,
    expression: 'AB = ?',
    answer: w,
    unit: 'm',
    hint: 'Right angles at B and D, vertical angles at C, and BC = CD: the triangles are congruent by ASA.',
    steps: [`ΔABC ≅ ΔEDC by ASA: right angles, BC = CD = ${lab(half, 'paced side in m')}, vertical angles at C.`, `AB and ED are corresponding sides (CPCTC), so AB = DE = ${lab(w, 'river width in m')}.`],
    visual: geo([{ t: 'seg', a: [-1, 0], b: [9, 0] }, { t: 'poly', pts: [[0, 0], [4, 0], [0, 3]] }, { t: 'poly', pts: [[4, 0], [8, 0], [8, -3]] }, { t: 'pt', p: [0, 3], label: 'A' }, { t: 'pt', p: [0, 0], label: 'B' }, { t: 'pt', p: [4, 0], label: 'C' }, { t: 'pt', p: [8, 0], label: 'D' }, { t: 'pt', p: [8, -3], label: 'E' }, { t: 'text', p: [-0.6, 1.5], text: 'river' }], 320, 220),
    app: 'Surveyors have measured rivers this way since Roman times.',
  });
  return typed(q);
}
function rigidStep(rng: Rng): AskStep {
  const q = Q(K5, 'criterion', {
    prompt: 'A square gate frame sags, but adding one diagonal brace makes it rigid. Why does the brace work?',
    expression: 'Why are triangles rigid?',
    answer: 0,
    hint: 'Once three side lengths are fixed, how many different triangles can you build?',
    steps: ['SSS: three fixed sides fix the whole triangle, angles included, so a triangle cannot flex. A square with four fixed sides can still lean.'],
    visual: geo([{ t: 'poly', pts: [[0, 0], [4, 0], [4, 4], [0, 4]] }, { t: 'seg', a: [0, 0], b: [4, 4] }], 220, 200),
  });
  return choose(rng, q, 'Three fixed sides fix the angles too (SSS)', ['The angles of a triangle add to 180°', 'Triangles use less steel', 'AAA: equal angles fix the size']);
}

/* ================================================================== */
/* 6. Similarity & scale                                               */
/* ================================================================== */
const K6 = 'similarity';
const SIM_SIDES: [number, number, number][] = [[3, 4, 5], [4, 5, 6], [4, 6, 8], [2, 3, 4], [6, 8, 10], [4, 6, 7], [5, 6, 8]];
function simPick(rng: Rng): { s: [number, number, number]; k: number } {
  const s = pick(rng, SIM_SIDES); const even = s.every((v) => v % 2 === 0);
  const k = pick(rng, even ? [2, 3, 1.5, 2.5, 0.5] : [2, 3, 4]);
  return { s, k };
}
function simFig(s: number[], k: number, small: (string | null)[], big: (string | null)[]): Visual {
  const p = triSides(s[1], s[2], s[0]);
  const q = triSides(s[1] * k, s[2] * k, s[0] * k, [s[0] + 2, 0]);
  return geo([{ t: 'poly', pts: p, labels: small }, { t: 'poly', pts: q, labels: big }], 330, 190);
}
function similarTableStep(rng: Rng): AskStep {
  const { s, k } = simPick(rng); const i = rint(rng, 0, 2);
  const big = s.map((v) => v * k); const others = [0, 1, 2].filter((j) => j !== i);
  const q = Q(K6, 'similar-sides', {
    prompt: `ΔABC ~ ΔDEF. ${['AB', 'BC', 'CA'][i]} = ${s[i]} and ${['DE', 'EF', 'FD'][i]} = ${fmt(big[i])}. Fill in the other sides of ΔDEF.`,
    expression: `k = ${fmt(big[i])} ÷ ${s[i]}`,
    answer: big[others[0]],
    hint: 'Similar means every side is multiplied by the same scale factor. Find it from the matching pair.',
    steps: [`Scale factor k = ${lab(fmt(big[i]), `length of ${['DE', 'EF', 'FD'][i]}`)} ÷ ${lab(s[i], `length of ${['AB', 'BC', 'CA'][i]}`)} = ${lab(fmt(k), 'scale factor')}.`, ...others.map((j) => `${['DE', 'EF', 'FD'][j]} = ${lab(s[j], `length of ${['AB', 'BC', 'CA'][j]}`)} × ${lab(fmt(k), 'scale factor')} = ${lab(fmt(big[j]), `length of ${['DE', 'EF', 'FD'][j]}`)}.`), 'Multiply, do not add: adding the same amount to every side changes the shape.'],
    visual: simFig(s, k, s.map(String), big.map((v, j) => (j === i ? fmt(v) : '?'))),
    app: 'Scale models, blueprints and camera lenses all rely on similar triangles.',
  });
  return model(q, { kind: 'table', cols: ['ΔABC', 'ΔDEF'], rowLabels: ['AB ↔ DE', 'BC ↔ EF', 'CA ↔ FD'], rows: s.map((v, j) => [v, j === i ? big[j] : null]), label: 'Matching sides' }, [others.map((j) => fmt(big[j])).join(',')], 'Fill in the missing sides of ΔDEF.');
}
function additiveStep(rng: Rng): AskStep {
  const k = pick(rng, [1.5, 2, 2.5, 3]); const w = 2 * rint(rng, 1, 4); let h = 2 * rint(rng, 1, 5); if (h === w) h += 2;
  const W = w * k; const H = h * k;
  const q = Q(K6, 'scale', {
    prompt: `${Aan(`${w} cm`)} × ${h} cm blueprint panel is enlarged so the ${w} cm side becomes ${fmt(W)} cm. How long does the ${h} cm side become?`,
    expression: `${w} → ${fmt(W)}, ${h} → ?`,
    answer: H,
    hint: 'Ask "times what?" not "plus what?". The same multiplier stretches every side.',
    steps: [`Scale factor: ${lab(fmt(W), 'new side in cm')} ÷ ${lab(w, 'old side in cm')} = ${lab(fmt(k), 'scale factor')}.`, `${lab(h, 'other side in cm')} × ${lab(fmt(k), 'scale factor')} = ${lab(fmt(H), 'new other side in cm')}.`, `Adding ${lab(fmt(W - w), 'extra cm')} to each side would give ${lab(fmt(h + W - w), 'wrong side in cm')} and distort the panel.`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [w, 0], [w, h], [0, h]], labels: [`${w}`, `${h}`, null, null] }, { t: 'poly', pts: [[w + 2, 0], [w + 2 + W, 0], [w + 2 + W, H], [w + 2, H]], labels: [fmt(W), '?', null, null] }], 330, 200),
  });
  return choose(rng, q, `${fmt(H)} cm`, [`${fmt(h + W - w)} cm`, `${fmt(W)} cm`, `${fmt(h * k * k)} cm`]);
}
function shadowStep(rng: Rng): AskStep {
  const p = pick(rng, [1.5, 2, 3]); const s = pick(rng, [1, 2, 3, 4]); const k = rint(rng, 4, 12);
  const S = s * k; const T = p * k;
  const q = Q(K6, 'shadow', {
    prompt: `A ${fmt(p)} m post casts a ${s} m shadow. At the same moment the tower's shadow is ${S} m. How tall is the tower?`,
    expression: `${fmt(p)} / ${s} = ? / ${S}`,
    answer: T,
    unit: 'm',
    hint: 'The sun hits both at the same angle, so the post triangle and tower triangle are similar.',
    steps: ['Same sun angle and right angles at the ground: the triangles are similar (AA).', `${lab(S, "tower's shadow in m")} ÷ ${lab(s, "post's shadow in m")} = ${lab(k, 'scale factor')}: the tower's shadow is ${k} times the post's.`, `Tower = ${lab(fmt(p), 'post height in m')} × ${lab(k, 'scale factor')} = ${lab(fmt(T), 'tower height in m')}.`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [s, 0], [0, p]], labels: [`${s}`, null, fmt(p)] }, { t: 'poly', pts: [[s + 2, 0], [s + 2 + S, 0], [s + 2, T]], labels: [`${S}`, null, '?'] }], 330, 200),
    app: 'Surveyors have measured towers and pyramids by their shadows for 2,500 years.',
  });
  return typed(q);
}
/** Scale a blueprint triangle from its corner O: the scale factor multiplies each distance from O. */
function dilateTrussStep(rng: Rng): AskStep {
  let k = 2; let p = 2; let qv = 1; let O: [number, number] = [0, 0];
  for (let g = 0; g < 100; g++) {
    k = pick(rng, [2, 3]); p = rint(rng, 1, 3); qv = rint(rng, 1, 3); O = pick(rng, [[0, 0], [0, 0], [1, 1], [-2, -1], [-3, 0], [0, -2]] as [number, number][]);
    if (p !== qv && O[0] + k * p <= 8 && O[1] + k * qv <= 8) break;
  }
  if (!(O[0] + k * p <= 8 && O[1] + k * qv <= 8)) { k = 2; p = 3; qv = 2; O = [0, 0]; }
  const A: [number, number] = [O[0] + p, O[1]]; const B: [number, number] = [O[0], O[1] + qv];
  const A2: [number, number] = [O[0] + k * p, O[1]]; const B2: [number, number] = [O[0], O[1] + k * qv];
  const range: Range = [-4, 8, -3, 8];
  const layers: PlotLayers = { segments: [{ a: O, b: A }, { a: A, b: B }, { a: B, b: O }], points: [{ x: O[0], y: O[1], label: 'O' }, { x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }] };
  const q = Q(K6, 'scale-factor', {
    prompt: `Brick's blueprint truss is OAB. The real truss is similar and ${k} times as big, scaled from corner O. Plot A′ and B′.`,
    expression: `OA′ = ${k} × OA, OB′ = ${k} × OB`,
    answer: A2[0],
    hint: 'A scale factor multiplies distances from the centre O. It never adds the same amount.',
    steps: [`OA′ = ${lab(k, 'scale factor')} × ${lab(p, 'OA across')} = ${lab(k * p, 'new distance across')}: A′ = ${pt(A2[0], A2[1])}.`, `OB′ = ${lab(k, 'scale factor')} × ${lab(qv, 'OB up')} = ${lab(k * qv, 'new distance up')}: B′ = ${pt(B2[0], B2[1])}.`, `Every side of OA′B′ is ${lab(k, 'scale factor')} times the matching side of OAB, and the angles are unchanged: the triangles are similar.`],
    visual: plotV(range, layers),
    app: 'Blueprints and scale models are dilations of the real structure.',
  });
  return model(q, { kind: 'plot', range, count: 2, label: `Scale by ${lab(k, 'scale factor')} from O`, layers }, undefined, 'Tap the two new corners A′ and B′.', { rule: { kind: 'set', items: [`${A2[0]},${A2[1]}`, `${B2[0]},${B2[1]}`] } });
}
function areaScaleStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 4]); const A = rint(rng, 3, 12);
  const q = Q(K6, 'area-scale', {
    prompt: `${Aan(`${A} m²`)} floor plate is scaled up by a factor of ${k} in every direction. What is its new area?`,
    expression: `${A} m² × ? = new area`,
    answer: A * k * k,
    hint: 'Draw a 1 by 1 square and scale it: it becomes k by k.',
    steps: [`Area uses two lengths (m × m = m²), and each is multiplied by the scale factor: ${lab(k, 'length scale')} × ${lab(k, 'width scale')} = ${lab(k * k, 'area scale')}.`, `${lab(A, 'old area in m²')} × ${lab(k * k, 'area scale')} = ${lab(A * k * k, 'new area in m²')}.`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [1, 0], [1, 1], [0, 1]], labels: ['1', '1', null, null] }, { t: 'poly', pts: [[2, 0], [2 + k, 0], [2 + k, k], [2, k]], labels: [`${k}`, `${k}`, null, null] }], 300, 180),
  });
  return choose(rng, q, `${A * k * k} m²`, [`${A * k} m²`, `${A * k * k * k} m²`, `${A + k} m²`]);
}
function proportionStep(rng: Rng): AskStep {
  let m = rint(rng, 2, 6); let n = rint(rng, 2, 6); if (m === n) n = m + 1;
  if (m > n) [m, n] = [n, m];
  const t = rint(rng, 2, 5); const x = rint(rng, 2, 10); const p = m * t - x; const qv = n * t - x;
  const q = Q(K6, 'proportion', {
    prompt: `ΔABC ~ ΔDEF. AB = ${lin(1, p)}, DE = ${lin(1, qv)}, BC = ${m} and EF = ${n}. Find x.`,
    expression: `(${lin(1, p)}) / (${lin(1, qv)}) = ${m} / ${n}`,
    answer: x,
    hint: 'Set up AB/DE = BC/EF, then cross-multiply to clear the fractions.',
    steps: [`AB/DE = BC/EF: (${lin(1, p)})/(${lin(1, qv)}) = ${m}/${n} (BC over EF).`, `Cross-multiply by ${lab(n, 'EF')} and ${lab(m, 'BC')}: ${n}(${lin(1, p)}) = ${m}(${lin(1, qv)}), so ${lin(n, n * p)} = ${lin(m, m * qv)}.`, ...solveLines(n, n * p, m, m * qv), `Check: ${m * t}/${n * t} (AB over DE) = ${m}/${n} (BC over EF).`],
    visual: card('ΔABC ~ ΔDEF', [`AB = ${lin(1, p)}   DE = ${lin(1, qv)}`, `BC = ${m}   EF = ${n}`]),
  });
  return model(q, { kind: 'balance', a: n, b: n * p, c: m, d: m * qv, label: `${lin(n, n * p)} = ${lin(m, m * qv)}` }, [String(x)], `Cross-multiplied: ${lin(n, n * p)} = ${lin(m, m * qv)}. Balance it to find x.`);
}
function aaStep(rng: Rng): AskStep {
  const a = stepPick(rng, 30, 70, 5); const b = stepPick(rng, 35, 80, 5); const c = 180 - a - b;
  const similar = rng.next() < 0.5;
  let t2: [number, number];
  if (similar) t2 = pick(rng, [[b, c], [a, c], [c, b]] as [number, number][]);
  else { let o = stepPick(rng, 30, 80, 5); while ((o === a || o === c || o === b) && o < 170 - b) o += 5; t2 = [b, o]; }
  const c2 = 180 - t2[0] - t2[1];
  const q = Q(K6, 'aa', {
    prompt: `Triangle 1 has angles ${a}° and ${b}°. Triangle 2 has angles ${t2[0]}° and ${t2[1]}°. Are they similar?`,
    expression: `${a}°, ${b}° vs ${t2[0]}°, ${t2[1]}°`,
    answer: similar ? 1 : 0,
    hint: 'Find each third angle, then compare the full sets.',
    steps: [`Triangle 1: ${labd(180, 'angle sum')} − ${labd(a, 'first angle')} − ${labd(b, 'second angle')} = ${labd(c, 'third angle')}.`, `Triangle 2: ${labd(180, 'angle sum')} − ${labd(t2[0], 'first angle')} − ${labd(t2[1], 'second angle')} = ${labd(c2, 'third angle')}.`, similar ? `Both triangles have ${[a, b, c].sort((u, v) => u - v).join('°, ')}°: two equal angles are enough (AA), so they are similar.` : `The angle sets differ (${[a, b, c].sort((u, v) => u - v).join(', ')} vs ${[t2[0], t2[1], c2].sort((u, v) => u - v).join(', ')}), so they are not similar.`],
    visual: (() => { const p1 = triPts(a, b, 5); const p2 = triPts(t2[0], t2[1], 3.5).map(([x, y]) => [r3(x + 7), y]) as [P2, P2, P2]; return geo([{ t: 'poly', pts: p1 }, ...vertexArcs(p1, [`${a}°`, `${b}°`, '?']), { t: 'poly', pts: p2 }, ...vertexArcs(p2, [`${t2[0]}°`, `${t2[1]}°`, '?']), { t: 'text', p: [2.5, -0.8], text: 'Triangle 1' }, { t: 'text', p: [8.75, -0.8], text: 'Triangle 2' }], 330, 190); })(),
  });
  return choose(rng, q, similar ? 'Similar (AA)' : 'Not similar', [similar ? 'Not similar' : 'Similar (AA)', 'Can’t tell without the sides']);
}
function pinholeStep(rng: Rng): AskStep {
  for (let g = 0; g < 50; g++) {
    const H = pick(rng, [1.5, 2, 3, 4]); const d = pick(rng, [5, 10, 15, 20]); const D = pick(rng, [5, 10, 20]);
    const h = (H * d) / D;
    if (Math.abs(h * 10 - Math.round(h * 10)) < 1e-9 && h <= 20) {
      const q = Q(K6, 'shadow', {
        prompt: `A pinhole camera: a ${fmt(H)} m tall crane stands ${D} m from the pinhole, and the screen is ${d} cm behind it. How tall is the image, in cm?`,
        expression: `image / ${d} cm = ${fmt(H)} m / ${D} m`,
        answer: h,
        unit: 'cm',
        hint: 'Light through the pinhole makes two similar triangles with their tips at the hole.',
        steps: ['The triangles are similar (vertical angles at the pinhole, parallel object and screen), so image ÷ screen distance = crane height ÷ crane distance.', `Image = ${lab(d, 'screen distance in cm')} × ${lab(fmt(H), 'crane height in m')} ÷ ${lab(D, 'crane distance in m')} = ${lab(fmt(h), 'image height in cm')}. The m ÷ m cancels, so the image is in cm.`],
        visual: geo([{ t: 'seg', a: [0, 0], b: [0, 4] }, { t: 'seg', a: [0, 4], b: [6, 2] }, { t: 'seg', a: [0, 0], b: [6, 2] }, { t: 'seg', a: [6, 2], b: [8, 1.33] }, { t: 'seg', a: [6, 2], b: [8, 2.67] }, { t: 'seg', a: [8, 1.33], b: [8, 2.67] }, { t: 'text', p: [0, 4.6], text: 'crane' }, { t: 'text', p: [8, 3.3], text: 'image' }, { t: 'pt', p: [6, 2], label: 'pinhole' }], 320, 180),
      });
      return typed(q);
    }
  }
  return shadowStep(rng);
}
function mapScaleStep(rng: Rng): AskStep {
  const scale = pick(rng, [25000, 50000, 100000, 200000]); const d = rint(rng, 2, 12); const km = (d * scale) / 100000;
  const q = Q(K6, 'map-scale', {
    prompt: `A survey map has scale 1 : ${scale.toLocaleString('en-US')}. Two pylons are ${d} cm apart on the map. How far apart are they, in km?`,
    expression: `${d} cm × ${scale.toLocaleString('en-US')} = ? km`,
    answer: km,
    unit: 'km',
    hint: 'Every map length is multiplied by the same scale factor. Then convert: 100,000 cm = 1 km.',
    steps: [`Real distance = ${lab(d, 'map distance in cm')} × ${lab(scale.toLocaleString('en-US'), 'scale factor')} = ${lab((d * scale).toLocaleString('en-US'), 'real distance in cm')}.`, `${lab((d * scale).toLocaleString('en-US'), 'real distance in cm')} ÷ ${lab('100,000', 'cm per km')} = ${lab(fmt(km), 'real distance in km')}.`],
    visual: card('Map scale', [`1 : ${scale.toLocaleString('en-US')}`, `map distance ${d} cm`]),
  });
  return typed(q);
}

/* ================================================================== */
/* 7. Right triangles: Pythagoras and the special triangles            */
/* ================================================================== */
const K7 = 'right';
const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29], [15, 20, 25]];
const RT_CONTEXT = ['ramp', 'brace', 'ladder'] as const;
/** k√n with k = 1 written as √n. */
const rt = (k: number, n: number) => (k === 1 ? `√${n}` : `${fmt(k)}√${n}`);
function legsOf(rng: Rng): [number, number, number] { const t = pick(rng, TRIPLES); return rng.next() < 0.5 ? [t[0], t[1], t[2]] : [t[1], t[0], t[2]]; }
function hypStep(rng: Rng): AskStep {
  const [a, b, c] = legsOf(rng); const ctx = pick(rng, RT_CONTEXT);
  const nm = ctx === 'ramp' ? ['run', 'rise', 'ramp surface'] : ctx === 'ladder' ? ['foot to wall', 'height up the wall', 'ladder'] : ['frame width', 'frame height', 'brace'];
  const prompt = ctx === 'ramp' ? `A ramp runs ${a} m along the ground and rises ${b} m. How long is the ramp surface?` : ctx === 'ladder' ? `A ladder's foot is ${a} m from the wall and it reaches ${b} m up. How long is the ladder?` : `A diagonal brace spans a frame ${a} m wide and ${b} m tall. How long is the brace?`;
  const q = Q(K7, 'hypotenuse', {
    prompt,
    expression: `${a}² + ${b}² = c²`,
    answer: c,
    unit: 'm',
    hint: 'Square each leg, add the squares, then take the square root. Adding the legs themselves gives a path, not the diagonal.',
    steps: [`The legs are ${lab(a, `${nm[0]} in m`)} and ${lab(b, `${nm[1]} in m`)}.`, `a² + b² = c²: ${a}² + ${b}² = ${lab(a * a, `${nm[0]} squared in m²`)} + ${lab(b * b, `${nm[1]} squared in m²`)} = ${lab(c * c, `${nm[2]} squared in m²`)}.`, `c = √${c * c} = ${lab(c, `${nm[2]} in m`)}.`],
    visual: { type: 'rtri', a, b, c, hide: 'c', unit: 'm', context: ctx },
    app: 'Builders check square corners and brace lengths with a² + b² = c².',
  });
  return typed(q);
}
function legStep(rng: Rng): AskStep {
  const [a, b, c] = legsOf(rng);
  const q = Q(K7, 'leg', {
    prompt: `${Aan(`${c} m`)} ladder leans on a wall with its foot ${a} m out. How high up the wall does it reach?`,
    expression: `${a}² + b² = ${c}²`,
    answer: b,
    hint: 'The ladder is the hypotenuse, so it is the longest side. Subtract squares to find a leg.',
    steps: [`The ladder is ${lab(c, 'hypotenuse in m')} and its foot is ${lab(a, 'distance from the wall in m')}.`, `b² = c² − a² = ${c}² − ${a}² = ${lab(c * c, 'ladder squared in m²')} − ${lab(a * a, 'foot distance squared in m²')} = ${lab(b * b, 'height squared in m²')}.`, `b = √${b * b} = ${lab(b, 'height up the wall in m')}.`],
    visual: { type: 'rtri', a, b, c, hide: 'b', unit: 'm', context: 'ladder' },
  });
  return choose(rng, q, `${b} m`, [`${c - a} m`, `${b * b} m`, `${c + a} m`]);
}
function squaresTableStep(rng: Rng): AskStep {
  const [a, b, c] = legsOf(rng);
  const q = Q(K7, 'squares', {
    prompt: `Build the Pythagorean check for legs ${a} and ${b}: square each side, then find the hypotenuse.`,
    expression: `${a}² + ${b}² = c²`,
    answer: a * a,
    hint: 'The square on the hypotenuse has the same area as the two leg squares together.',
    steps: [`${a}² = ${lab(a * a, 'square on leg a')} and ${b}² = ${lab(b * b, 'square on leg b')}.`, `c² = ${lab(a * a, 'square on leg a')} + ${lab(b * b, 'square on leg b')} = ${lab(c * c, 'square on the hypotenuse')}, so c = ${lab(c, 'hypotenuse')}.`],
    visual: { type: 'rtri', a, b, c, hide: 'c', unit: '', context: 'brace' },
  });
  return model(q, { kind: 'table', rowLabels: ['leg a', 'leg b', 'hyp c'], cols: ['length', 'square'], rows: [[a, null], [b, null], [null, null]], label: 'Square the sides' }, [`${a * a},${b * b},${c},${c * c}`], 'Fill in the squares, then c and c².');
}
function converseStep7(rng: Rng): AskStep {
  const t = pick(rng, TRIPLES); const kind = pick(rng, ['right', 'right', 'acute', 'obtuse'] as const);
  const sides = [t[0], t[1], kind === 'right' ? t[2] : kind === 'obtuse' ? t[2] + 1 : t[2] - 1];
  const sorted = [...sides].sort((x, y) => x - y); const [x, y, z] = sorted;
  const lhs = x * x + y * y; const rhs = z * z;
  const actual = lhs === rhs ? 'right' : rhs > lhs ? 'obtuse' : 'acute';
  const shown = rng.shuffle(sides);
  const q = Q(K7, 'converse', {
    prompt: `Ada measures a frame with sides ${shown.join(', ')}. Is the corner square? Classify the triangle.`,
    expression: `${shown.join(', ')}`,
    answer: 0,
    hint: 'Compare the square of the LONGEST side with the sum of the squares of the other two.',
    steps: [`Longest side ${z}: ${z}² = ${lab(rhs, 'longest side squared')}. Others: ${x}² + ${y}² = ${lab(lhs, 'other two squares added')}.`, lhs === rhs ? 'Equal, so the triangle is right (the converse of Pythagoras).' : rhs > lhs ? `${lab(rhs, 'longest side squared')} > ${lab(lhs, 'other two squares added')}: the longest side is too long for a right angle, so the triangle is obtuse.` : `${lab(rhs, 'longest side squared')} < ${lab(lhs, 'other two squares added')}: the longest side is too short for a right angle, so the triangle is acute.`],
    visual: card('Frame check', [`sides ${shown.join(', ')}`, 'c² ? a² + b²']),
  });
  return choose(rng, q, `${actual} triangle`, ['right triangle', 'acute triangle', 'obtuse triangle'].filter((k) => k !== `${actual} triangle`));
}
function special45Step(rng: Rng): AskStep {
  const v = rint(rng, 0, 2); const a = rint(rng, 2, 12);
  const P: [P2, P2, P2] = [[0, 0], [4, 0], [4, 4]];
  const base: GeoItem[] = [{ t: 'poly', pts: P }, ...vertexArcs(P, ['45°', 'R', '45°'])];
  if (v === 0) {
    const q = Q(K7, 'special-45', {
      prompt: `A square gate panel has sides of ${a} m. How long is its diagonal brace?`,
      expression: `45-45-90: leg ${a}, hypotenuse ?`,
      answer: a * Math.SQRT2, answerText: `${rt(a, 2)} m`,
      hint: 'Half a square is a 45-45-90 triangle. Try Pythagoras: a² + a² = 2a².',
      steps: [`Each leg is ${lab(a, 'side in m')}. hyp² = ${a}² + ${a}² = ${lab(2, 'equal legs')} × ${lab(a * a, 'leg squared in m²')}, so the diagonal is √(${a * a} × 2) = ${a}√2 m.`, 'In a 45-45-90 triangle, hypotenuse = leg × √2.'],
      visual: geo([{ t: 'poly', pts: P, labels: [`${a}`, `${a}`, '?'] }, ...base.slice(1)], 240, 200),
    });
    return choose(rng, q, `${rt(a, 2)} m`, [`${2 * a} m`, `${rt(a, 3)} m`, `${rt(2 * a, 2)} m`]);
  }
  if (v === 1) {
    const q = Q(K7, 'special-45', {
      prompt: `The diagonal brace of a square panel is ${rt(a, 2)} m. How long is each side?`,
      expression: `45-45-90: hypotenuse ${rt(a, 2)}, leg ?`,
      answer: a,
      hint: 'Hypotenuse = leg × √2. Undo the × √2.',
      steps: [`The diagonal ${rt(a, 2)} m is leg × √2, so each side is ${lab(a, 'side in m')}.`],
      visual: geo([{ t: 'poly', pts: P, labels: ['?', '?', rt(a, 2)] }, ...base.slice(1)], 240, 200),
    });
    return choose(rng, q, `${a} m`, [`${2 * a} m`, `${rt(a, 2)} m`, `${fmt(a / 2)} m`]);
  }
  const H = 2 * a;
  const q = Q(K7, 'special-45', {
    prompt: `A 45-45-90 roof brace has a hypotenuse of ${H} m. How long is each leg?`,
    expression: `leg × √2 = ${H}`,
    answer: H / Math.SQRT2, answerText: rt(a, 2),
    hint: 'Hypotenuse = leg × √2. Since √2 × √2 = 2, which leg times √2 makes this hypotenuse?',
    steps: [`leg × √2 = ${lab(H, 'hypotenuse in m')}, and ${H} = ${a} × 2 = ${a} × √2 × √2.`, `So each leg is ${rt(a, 2)} m. Check: ${rt(a, 2)} × √2 = ${a} × 2 = ${lab(H, 'hypotenuse in m')}.`],
    visual: geo([{ t: 'poly', pts: P, labels: ['?', '?', `${H}`] }, ...base.slice(1)], 240, 200),
  });
  return choose(rng, q, `${rt(a, 2)} m`, [`${a} m`, `${rt(H, 2)} m`, `${rt(a, 3)} m`]);
}
function special3060Step(rng: Rng): AskStep {
  const s = rint(rng, 2, 10); const v = rint(rng, 0, 2);
  const P: [P2, P2, P2] = [[0, 0], [r3(2 * Math.sqrt(3)), 0], [r3(2 * Math.sqrt(3)), 2]]; // 30° at P0, 90° at P1, 60° at P2
  const arcs = vertexArcs(P, ['30°', 'R', '60°']);
  const fig = (labels: string[]) => geo([{ t: 'poly', pts: P, labels }, ...arcs], 280, 190);
  if (v === 0) {
    const q = Q(K7, 'special-30', {
      prompt: `A 30-60-90 brace has a short leg of ${s} m. How long is the long leg?`,
      expression: `short ${s} → long ?`,
      answer: s * Math.sqrt(3), answerText: rt(s, 3),
      hint: 'A 30-60-90 triangle is half an equilateral triangle. The hypotenuse is twice the short leg; use Pythagoras for the long leg.',
      steps: [`Half an equilateral triangle, so the hypotenuse is double the short leg: 2 × ${lab(s, 'short leg in m')} = ${lab(2 * s, 'hypotenuse in m')}.`, `long² = ${2 * s}² − ${s}² = ${lab(3 * s * s, 'long leg squared in m²')} = 3 × ${s * s}, so the long leg is ${rt(s, 3)} m.`],
      visual: fig(['?', `${s}`, '']),
    });
    return choose(rng, q, `${rt(s, 3)} m`, [`${2 * s} m`, `${rt(s, 2)} m`, `${3 * s} m`]);
  }
  if (v === 1) {
    const q = Q(K7, 'special-30', {
      prompt: `A 30-60-90 brace has a short leg of ${s} m. How long is the hypotenuse?`,
      expression: `short ${s} → hypotenuse ?`,
      answer: 2 * s,
      hint: 'Picture the equilateral triangle this is half of. Its side is the hypotenuse.',
      steps: [`The short leg is half the equilateral side, so the hypotenuse is 2 × ${lab(s, 'short leg in m')} = ${lab(2 * s, 'hypotenuse in m')}.`],
      visual: fig(['', `${s}`, '?']),
    });
    return choose(rng, q, `${2 * s} m`, [`${rt(s, 3)} m`, `${rt(s, 2)} m`, `${3 * s} m`]);
  }
  const H = 2 * s;
  const q = Q(K7, 'special-30', {
    prompt: `A 30-60-90 rafter has a hypotenuse of ${H} m. How long is the long leg?`,
    expression: `hypotenuse ${H} → long ?`,
    answer: s * Math.sqrt(3), answerText: rt(s, 3),
    hint: 'Find the short leg first (half the hypotenuse), then scale by √3.',
    steps: [`The short leg is half the hypotenuse: ${lab(H, 'hypotenuse in m')} ÷ 2 = ${lab(s, 'short leg in m')}.`, `long = ${lab(s, 'short leg in m')} × √3 = ${rt(s, 3)} m.`],
    visual: fig(['?', '', `${H}`]),
  });
  return choose(rng, q, `${rt(s, 3)} m`, [`${s} m`, `${rt(H, 3)} m`, `${rt(s, 2)} m`]);
}
function special3060TableStep(rng: Rng): AskStep {
  const [s1, s2, s3] = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const q = Q(K7, 'special-30', {
    prompt: 'Fill in the 30-60-90 table: short leg, long leg, hypotenuse.',
    expression: 'short : long : hyp = 1 : √3 : 2',
    answer: 2 * s1,
    hint: 'The hypotenuse is twice the short leg. The long leg is the short leg times √3.',
    steps: ['short : long : hypotenuse = 1 : √3 : 2.', `Row 1: hyp = 2 × ${lab(s1, 'short leg')} = ${lab(2 * s1, 'hypotenuse')}.`, `Row 2: long leg ${rt(s2, 3)} means short = ${lab(s2, 'short leg')}, so hyp = 2 × ${s2} = ${lab(2 * s2, 'hypotenuse')}.`, `Row 3: short = ${lab(2 * s3, 'hypotenuse')} ÷ 2 = ${lab(s3, 'short leg')}.`],
    visual: card('30-60-90', ['short leg : long leg : hypotenuse', '1 : √3 : 2']),
  });
  return model(q, { kind: 'table', cols: ['short', 'long', 'hyp'], rows: [[s1, rt(s1, 3), null], [null, rt(s2, 3), null], [null, rt(s3, 3), 2 * s3]], label: '30-60-90 triangles' }, [`${2 * s1},${s2},${2 * s2},${s3}`], 'Fill in each blank with a plain number.');
}
function special45TableStep(rng: Rng): AskStep {
  const [a, b] = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 2);
  const q = Q(K7, 'special-45', {
    prompt: 'Fill in the 45-45-90 table: leg, leg, hypotenuse.',
    expression: 'leg : leg : hyp = 1 : 1 : √2',
    answer: a,
    hint: 'Both legs are equal, and the hypotenuse is a leg times √2.',
    steps: ['leg : leg : hypotenuse = 1 : 1 : √2.', `Row 1: the legs are equal, so the other leg is ${lab(a, 'same as the first leg')}.`, `Row 2: hyp ${rt(b, 2)} = leg × √2, so each leg is ${lab(b, 'leg')}.`],
    visual: card('45-45-90', ['leg : leg : hypotenuse', '1 : 1 : √2']),
  });
  return model(q, { kind: 'table', cols: ['leg', 'leg', 'hyp'], rows: [[a, null, rt(a, 2)], [null, null, rt(b, 2)]], label: '45-45-90 triangles' }, [`${a},${b},${b}`], 'Fill in each blank with a plain number.');
}
/** Either special-triangle table (for mixed sets). */
const specialTableStep = (rng: Rng): AskStep => (rng.next() < 0.5 ? special3060TableStep(rng) : special45TableStep(rng));
/** The largest k with k² dividing n, and what is left under the root: √n = k√m. */
function rootParts(n: number): [number, number] { let k = 1; for (let d = 2; d * d <= n; d++) if (n % (d * d) === 0) k = d; return [k, n / (k * k)]; }
/** √(k²·n) = k√n: pull the perfect square out of the root (needed for x√2 and x√3). */
function simplifyRootStep(rng: Rng): AskStep {
  const k = rint(rng, 2, 6); const n = pick(rng, [2, 2, 3, 3, 5]); const N = k * k * n;
  const q = Q(K7, 'simplify-root', {
    prompt: `A brace calculation ends at √${N} m. Write it in simplest form.`,
    expression: `√${N} = ?`,
    answer: k * Math.sqrt(n), answerText: `${rt(k, n)} m`,
    hint: `Find the biggest perfect square that divides ${lab(N, 'number under the root')}. √(a × b) = √a × √b.`,
    steps: [`${lab(N, 'number under the root')} = ${lab(k * k, 'perfect square')} × ${lab(n, 'what is left')}, and ${k * k} = ${k}².`, `√${N} = √${k * k} × √${n} = ${rt(k, n)} m, the brace length.`, `Check: (${rt(k, n)})² = ${k * k} × ${n} = ${lab(N, 'number under the root')}.`],
    visual: card('Pull out perfect squares', ['√8 = √(4 × 2) = 2√2', '√75 = √(25 × 3) = 5√3']),
  });
  // Slips: forgetting to root the square (9√2), pulling out the wrong factor (2√9), halving instead of rooting.
  return choose(rng, q, `${rt(k, n)} m`, [`${rt(k * k, n)} m`, `${rt(n, k * k)} m`, `${fmt(N / 2)} m`]);
}
function braceSliderStep(rng: Rng): AskStep {
  const [a, b] = pick(rng, [[2, 3], [1, 3], [3, 5], [4, 5], [2, 5], [1, 2], [3, 6], [2, 6], [4, 6]] as [number, number][]);
  const c2 = a * a + b * b; const c = Math.round(Math.sqrt(c2) * 10) / 10; const lo = Math.floor(Math.sqrt(c2));
  const q = Q(K7, 'estimate', {
    prompt: `A brace spans legs of ${a} m and ${b} m. Estimate its length to the nearest 0.1 m.`,
    expression: `c = √${c2}`,
    answer: c,
    unit: 'm',
    hint: `The legs are ${lab(a, 'first leg in m')} and ${lab(b, 'second leg in m')}, so c² = ${a}² + ${b}². Which two perfect squares is that between?`,
    steps: [`c² = ${lab(a * a, 'first leg squared in m²')} + ${lab(b * b, 'second leg squared in m²')} = ${lab(c2, 'brace squared in m²')}.`, `${lo}² = ${lo * lo} and ${lo + 1}² = ${(lo + 1) * (lo + 1)}, so c is between ${lab(lo, 'lower estimate in m')} and ${lab(lo + 1, 'upper estimate in m')}.`, `√${c2} ≈ ${fmt(Math.sqrt(c2))} → ${lab(fmt(c), 'brace length in m')}.`],
    visual: { type: 'rtri', a, b, c, hide: 'c', unit: 'm', context: 'brace' },
  });
  return model(q, { kind: 'slider', min: 0, max: 8, step: 0.1, label: 'Brace length', unit: 'm' }, [fmt(c)], 'Slide to the brace length, to the nearest tenth of a metre.');
}
function tvStep(rng: Rng): AskStep {
  const [w, h, d] = pick(rng, [[16, 12, 20], [32, 24, 40], [40, 30, 50], [48, 36, 60], [24, 18, 30]] as [number, number, number][]);
  const q = Q(K7, 'hypotenuse', {
    prompt: `A monitor screen is ${w} in wide and ${h} in tall. Screens are sold by their diagonal. What size is it?`,
    expression: `${w}² + ${h}² = d²`,
    answer: d, answerText: `${d} in`,
    hint: 'The diagonal cuts the screen into two right triangles.',
    steps: [`d² = ${w}² + ${h}² = ${lab(w * w, 'width squared in in²')} + ${lab(h * h, 'height squared in in²')} = ${lab(d * d, 'diagonal squared in in²')}.`, `d = √${d * d} = ${lab(d, 'diagonal in inches')}.`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [w, 0], [w, h], [0, h]], labels: [`${w}`, `${h}`, '', ''] }, { t: 'seg', a: [0, 0], b: [w, h], label: '?' }], 300, 200),
  });
  // Adding the sides is the classic slip (a + b = c); squaring and forgetting the root is the other.
  return choose(rng, q, `${d} in`, [`${w + h} in`, `${w * w + h * h} in`]);
}
function diamondStep(rng: Rng): AskStep {
  const s = pick(rng, [90, 60, 30, 50]);
  const q = Q(K7, 'special-45', {
    prompt: `A square field has sides of ${s} m. How far is it corner to opposite corner?`,
    expression: `diagonal of a ${s} m square`,
    answer: s * Math.SQRT2, answerText: `${rt(s, 2)} m`,
    hint: 'The diagonal splits the square into two 45-45-90 triangles.',
    steps: [`45-45-90: hypotenuse = ${lab(s, 'side in m')} × √2 = ${rt(s, 2)} m, about ${lab(fmt(Math.round(s * Math.SQRT2 * 10) / 10), 'diagonal in m')}.`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [4, 0], [4, 4], [0, 4]], labels: [`${s}`, `${s}`, '', ''] }, { t: 'seg', a: [0, 0], b: [4, 4], dashed: true, label: '?' }], 220, 200),
  });
  return choose(rng, q, `${rt(s, 2)} m`, [`${2 * s} m`, `${rt(s, 3)} m`, `${s * 1.5} m`]);
}
function ropeStep(rng: Rng): AskStep {
  const [a, b, c] = pick(rng, [[3, 4, 5], [5, 12, 13], [6, 8, 10]] as [number, number, number][]);
  const q = Q(K7, 'converse', {
    prompt: `Ancient builders knotted a rope loop into ${a + b + c} equal spaces and pulled it into a ${a}-${b}-${c} triangle. Why is the corner square?`,
    expression: `${a}, ${b}, ${c}`,
    answer: 0,
    hint: 'Which test proves a corner is exactly 90°?',
    steps: [`The sides are ${lab(a, 'short side in spaces')}, ${lab(b, 'middle side in spaces')} and ${lab(c, 'long side in spaces')}.`, `${a}² + ${b}² = ${lab(a * a + b * b, 'short squares added')} = ${c}², so by the converse of the Pythagorean theorem the angle opposite the long side is 90°.`],
    visual: card('Rope stretchers', [`${a} + ${b} + ${c} = ${a + b + c} knots`]),
  });
  return choose(rng, q, `${a}² + ${b}² = ${c}²`, [`${a} + ${b} > ${c}`, `${a} + ${b} + ${c} = ${a + b + c}`, 'Every triangle has a right angle']);
}

/* ================================================================== */
/* 8. Polygons, perimeter & area                                       */
/* ================================================================== */
const K8 = 'polygons';
/** Regular n-gon of circumradius 3, optionally with diagonals from vertex 0 (the triangle fan). */
function ngon(n: number, fan = false, extra: GeoItem[] = []): Visual {
  const pts = Array.from({ length: n }, (_, i) => at([0, 0], 270 - 180 / n + (360 * i) / n, 3));
  const items: GeoItem[] = [{ t: 'poly', pts }];
  if (fan) for (let i = 2; i < n - 1; i++) items.push({ t: 'seg', a: pts[0], b: pts[i], dashed: true });
  return geo([...items, ...extra], 240, 220);
}
const NGON_NAME: Record<number, string> = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };
function interiorSumStep(rng: Rng): AskStep {
  const n = pick(rng, [5, 6, 7, 8, 9, 10, 12]); const sum = (n - 2) * 180;
  const q = Q(K8, 'interior-sum', {
    prompt: `The plaza fountain is ${aan(NGON_NAME[n])} (${n} sides). What do its interior angles add to?`,
    expression: `${n} sides → angle sum ?`,
    answer: sum,
    hint: 'Draw diagonals from one corner. How many triangles do you get, and what does each triangle hold?',
    steps: [`Diagonals from one corner cut the polygon into triangles: ${lab(n, 'sides')} − ${lab(2, 'sides at that corner')} = ${lab(n - 2, 'triangles')}.`, `Each triangle holds 180°: ${lab(n - 2, 'triangles')} × ${labd(180, 'per triangle')} = ${labd(sum, 'angle sum')}.`],
    visual: ngon(n, true),
  });
  return choose(rng, q, dg(sum), [dg(n * 180), dg((n - 1) * 180), dg(360)]);
}
function sumTableStep(rng: Rng): AskStep {
  const n1 = rint(rng, 5, 7); const n2 = rint(rng, 8, 12);
  const q = Q(K8, 'interior-sum', {
    prompt: 'Fan each polygon into triangles from one corner. Fill in the table.',
    expression: 'angle sum = triangles × 180°',
    answer: n1 - 2,
    hint: 'A quadrilateral makes 2 triangles. Each extra side adds one more triangle.',
    steps: ['An n-gon fans into n − 2 triangles, each holding 180°.', `${lab(n1, 'sides')} − 2 = ${lab(n1 - 2, 'triangles')}, and ${lab(n1 - 2, 'triangles')} × ${labd(180, 'per triangle')} = ${labd((n1 - 2) * 180, 'angle sum')}.`, `${lab(n2, 'sides')} − 2 = ${lab(n2 - 2, 'triangles')}, and ${lab(n2 - 2, 'triangles')} × ${labd(180, 'per triangle')} = ${labd((n2 - 2) * 180, 'angle sum')}.`],
    visual: ngon(n1, true),
  });
  return model(q, { kind: 'table', cols: ['sides', 'triangles', 'angle sum (°)'], rows: [[4, 2, 360], [n1, null, null], [n2, null, null]], label: 'Triangles in a polygon' }, [`${n1 - 2},${(n1 - 2) * 180},${n2 - 2},${(n2 - 2) * 180}`], 'Fill in the triangles and the angle sums.');
}
function regularDialStep(rng: Rng): AskStep {
  const n = pick(rng, [3, 4, 6, 8, 9, 12]); const ext = 360 / n; const int = 180 - ext; const askExt = rng.next() < 0.5;
  const pts = Array.from({ length: n }, (_, i) => at([0, 0], 270 - 180 / n + (360 * i) / n, 3));
  const E = at(pts[1], (Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) * 180) / Math.PI, 2.2);
  const extra: GeoItem[] = askExt ? [{ t: 'seg', a: pts[1], b: E, dashed: true }, { t: 'arc', at: pts[1], from: E, to: pts[2], label: '?' }] : [{ t: 'arc', at: pts[1], from: pts[2], to: pts[0], label: '?' }];
  const q = Q(K8, 'regular', {
    prompt: `${Aan(n === 3 ? 'equilateral triangle' : n === 4 ? 'square' : `regular ${NGON_NAME[n]}`)} window frame has ${n} equal sides. Set the dial to one ${askExt ? 'exterior' : 'interior'} angle.`,
    expression: askExt ? `360° ÷ ${n}` : `180° − 360° ÷ ${n}`,
    answer: askExt ? ext : int,
    hint: 'Walk around the frame: at each corner you turn through the exterior angle, and one lap turns you 360° in total.',
    steps: [`The exterior angles of any polygon add to 360°, so each is ${labd(360, 'one full lap')} ÷ ${lab(n, 'corners')} = ${labd(ext, 'each exterior angle')}.`, askExt ? `Exterior angle = ${labd(ext, 'each exterior angle')}.` : `Interior + exterior = 180°, so the interior angle is ${labd(180, 'straight line')} − ${labd(ext, 'exterior angle')} = ${labd(int, 'interior angle')}.`],
    visual: geo([{ t: 'poly', pts }, ...extra], 240, 220),
  });
  return model(q, dial(askExt ? 'Set an exterior angle' : 'Set an interior angle'), [String(askExt ? ext : int)], `Turn the dial to one ${askExt ? 'exterior' : 'interior'} angle.`);
}
function findNStep(rng: Rng): AskStep {
  const n = pick(rng, [5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 36]); const ext = 360 / n; const int = 180 - ext; const byInt = rng.next() < 0.5;
  const q = Q(K8, 'find-n', {
    prompt: byInt ? `Each interior angle of a regular polygon is ${int}°. How many sides does it have?` : `Each exterior angle of a regular polygon is ${ext}°. How many sides does it have?`,
    expression: byInt ? `interior ${int}° → n = ?` : `exterior ${ext}° → n = ?`,
    answer: n,
    hint: byInt ? 'Switch to the exterior angle first: interior + exterior = 180°. Then use the 360° lap.' : 'The exterior angles make one full 360° lap.',
    steps: byInt ? [`Exterior angle = ${labd(180, 'straight line')} − ${labd(int, 'interior angle')} = ${labd(ext, 'exterior angle')}.`, `n = ${labd(360, 'one full lap')} ÷ ${labd(ext, 'turn per corner')} = ${lab(n, 'sides')}.`] : [`n = ${labd(360, 'one full lap')} ÷ ${labd(ext, 'turn per corner')} = ${lab(n, 'sides')}.`],
    visual: card('Regular polygon', [byInt ? `interior angle ${int}°` : `exterior angle ${ext}°`, 'sides = ?']),
  });
  return typed(q);
}
function missingPolyAngleStep(rng: Rng): AskStep {
  const n = pick(rng, [4, 5, 6]); const S = (n - 2) * 180; const avg = S / n;
  let angs: number[] = []; let last = 0;
  for (let g = 0; g < 100; g++) {
    angs = Array.from({ length: n - 1 }, () => stepPick(rng, Math.round(avg / 5) * 5 - 25, Math.round(avg / 5) * 5 + 25, 5));
    last = S - angs.reduce((x, y) => x + y, 0);
    if (last >= 60 && last <= 170) break;
  }
  const q = Q(K8, 'missing-angle', {
    prompt: `${Aan(NGON_NAME[n])} paving stone has angles ${angs.map((v) => `${v}°`).join(', ')} and one more. Find it.`,
    expression: `sum = (${n} − 2) × 180° = ${S}°`,
    answer: last,
    hint: 'Find the total the angles must reach, then subtract the ones you know.',
    steps: [`${lab(n, 'sides')} − 2 = ${lab(n - 2, 'triangles')}, so the angle sum is ${lab(n - 2, 'triangles')} × ${labd(180, 'per triangle')} = ${labd(S, 'angle sum')}.`, `Known angles add to ${labd(S - last, 'known angles')}, so the last one is ${labd(S, 'angle sum')} − ${labd(S - last, 'known angles')} = ${labd(last, 'missing angle')}.`],
    visual: (() => {
      const pts = Array.from({ length: n }, (_, i) => at([0, 0], 270 - 180 / n + (360 * i) / n, 3));
      const arcs: GeoItem[] = pts.map((v, i) => ({ t: 'arc', at: v, from: pts[(i + 1) % n], to: pts[(i + n - 1) % n], label: i < n - 1 ? `${angs[i]}°` : '?' }));
      return geo([{ t: 'poly', pts }, ...arcs, { t: 'text', p: [0, -3.9], text: 'not to scale' }], 240, 230);
    })(),
  });
  return typed(q);
}
function triangleAreaStep(rng: Rng): AskStep {
  const [p, h, s] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [4, 3, 5], [8, 6, 10], [9, 12, 15]] as [number, number, number][]);
  let b = p + rint(rng, 2, 8); if ((b * h) % 2) b += 1;
  const A = (b * h) / 2;
  const q = Q(K8, 'triangle-area', {
    prompt: `A triangular gusset plate has base ${b} cm, height ${h} cm and a slanted side of ${s} cm. What is its area?`,
    expression: 'A = ½ × base × height',
    answer: A,
    hint: 'The height must meet the base at a right angle. The slanted side is not the height.',
    steps: [`A = ½ × ${lab(b, 'base in cm')} × ${lab(h, 'height in cm')} = ${lab(A, 'area in cm²')}. The ${s} cm slanted side is not used.`, 'Why ½: a triangle is half of a rectangle (or parallelogram) with the same base and perpendicular height. Why cm²: cm × cm counts square centimetres.'],
    visual: geo([{ t: 'poly', pts: [[0, 0], [b, 0], [p, h]], labels: [`${b}`, '', `${s}`] }, { t: 'seg', a: [p, h], b: [p, 0], dashed: true, label: `${h}` }, { t: 'arc', at: [p, 0], from: [b, 0], to: [p, h], right: true }], 300, 200),
  });
  return choose(rng, q, `${fmt(A)} cm²`, [`${fmt((b * s) / 2)} cm²`, `${b * h} cm²`, `${b * s} cm²`]);
}
function trapezoidStep(rng: Rng): AskStep {
  const a = rint(rng, 3, 10); let b = rint(rng, a + 2, a + 9); let h = rint(rng, 2, 9); if (((a + b) * h) % 2) h += 1;
  const A = ((a + b) * h) / 2; const off = rint(rng, 1, b - a - 1 > 0 ? b - a - 1 : 1);
  const q = Q(K8, 'trapezoid', {
    prompt: `A dam's cross-section is a trapezoid: ${a} m across the top, ${b} m across the base, ${h} m tall. What is its area?`,
    expression: 'A = ½ (a + b) × h',
    answer: A,
    unit: 'm²',
    hint: 'Average the two parallel sides, then multiply by the height.',
    steps: [`Average of the parallel sides: (${lab(a, 'top in m')} + ${lab(b, 'base in m')}) ÷ ${lab(2, 'parallel sides')} = ${lab(fmt((a + b) / 2), 'average width in m')}.`, `A = ${lab(fmt((a + b) / 2), 'average width in m')} × ${lab(h, 'height in m')} = ${lab(fmt(A), 'area in m²')}, since m × m = m².`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [b, 0], [off + a, h], [off, h]], labels: [`${b}`, '', `${a}`, ''] }, { t: 'seg', a: [off, h], b: [off, 0], dashed: true, label: `${h}` }], 300, 190),
  });
  return typed(q);
}
function compositeTableStep(rng: Rng): AskStep {
  const w = 2 * rint(rng, 2, 6); const h1 = rint(rng, 3, 8); const h2 = rint(rng, 2, 6);
  const rect = w * h1; const tri = (w * h2) / 2; const tot = rect + tri;
  const q = Q(K8, 'composite', {
    prompt: `A gatehouse wall is ${aan(`${w} m`)} × ${h1} m rectangle with a triangular gable ${h2} m tall on top. Find each piece's area and the total.`,
    expression: 'total = rectangle + triangle',
    answer: rect,
    hint: 'Split the shape into pieces you know, find each area, then add.',
    steps: [`Rectangle: ${lab(w, 'width in m')} × ${lab(h1, 'wall height in m')} = ${lab(rect, 'rectangle in m²')}.`, `Triangle: ½ × ${lab(w, 'base in m')} × ${lab(h2, 'gable height in m')} = ${lab(tri, 'gable in m²')}.`, `Total: ${lab(rect, 'rectangle in m²')} + ${lab(tri, 'gable in m²')} = ${lab(tot, 'wall area in m²')}.`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [w, 0], [w, h1], [w / 2, h1 + h2], [0, h1]], labels: [`${w}`, `${h1}`, '', '', ''] }, { t: 'seg', a: [0, h1], b: [w, h1], dashed: true }, { t: 'seg', a: [w / 2, h1], b: [w / 2, h1 + h2], dashed: true, label: `${h2}` }], 260, 220),
  });
  return model(q, { kind: 'table', rowLabels: ['rectangle', 'triangle', 'total'], cols: ['area (m²)'], rows: [[null], [null], [null]], label: 'Split and add' }, [`${rect},${tri},${tot}`], 'Fill in the area of each piece and the total.');
}
function lShapeStep(rng: Rng): AskStep {
  const W = rint(rng, 7, 12); const H = rint(rng, 6, 10); const a = rint(rng, 2, W - 3); const b = rint(rng, 2, H - 3);
  const askPer = rng.next() < 0.5; const per = 2 * (W + H); const area = W * H - a * b;
  const q = Q(K8, 'composite', {
    prompt: askPer ? `An L-shaped courtyard is ${W} m by ${H} m with a ${a} m × ${b} m corner cut out. How much edging goes around it?` : `An L-shaped courtyard is ${W} m by ${H} m with a ${a} m × ${b} m corner cut out. How much paving covers it?`,
    expression: askPer ? 'perimeter = ?' : 'area = ?',
    answer: askPer ? per : area,
    hint: askPer ? 'Slide the two edges of the notch outward: where do they land?' : 'Find the full rectangle, then take away the missing corner.',
    steps: askPer ? ['The notch edges, pushed outward, exactly fill in the missing corner of the rectangle.', `So the perimeter is the same as the full rectangle: ${lab(2, 'of each side')} × (${lab(W, 'length in m')} + ${lab(H, 'width in m')}) = ${lab(per, 'edging in m')}.`] : [`Full rectangle: ${lab(W, 'length in m')} × ${lab(H, 'width in m')} = ${lab(W * H, 'full area in m²')}.`, `Missing corner: ${lab(a, 'cut length in m')} × ${lab(b, 'cut width in m')} = ${lab(a * b, 'cut-out in m²')}.`, `${lab(W * H, 'full area in m²')} − ${lab(a * b, 'cut-out in m²')} = ${lab(area, 'paving in m²')}.`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [W, 0], [W, H - b], [W - a, H - b], [W - a, H], [0, H]], labels: [`${W}`, '', `${a}`, `${b}`, '', `${H}`] }], 280, 220),
  });
  return askPer ? choose(rng, q, `${per} m`, [`${per - a - b} m`, `${W + H + a + b} m`, `${area} m`]) : choose(rng, q, `${area} m²`, [`${W * H} m²`, `${per} m²`, `${W * H - a - b} m²`]);
}
function trapBalanceStep(rng: Rng): AskStep {
  const h = pick(rng, [2, 4, 6, 8]); const b0 = rint(rng, 3, 12); let x = rint(rng, 3, 12); while (x === b0) x = rint(rng, 3, 12);
  const A = (h / 2) * (x + b0);
  // Drawn with fixed bases (not to scale), so the picture does not give away x.
  const L = 8; const top = 5; const off = (L - top) / 2; const hd = 3;
  const q = Q(K8, 'area-algebra', {
    prompt: `A trapezoid plate has area ${A} cm², height ${h} cm and one base ${b0} cm. Find the other base, x.`,
    expression: `½ (x + ${b0}) × ${h} = ${A}`,
    answer: x,
    hint: 'Simplify ½ × height first, then distribute.',
    steps: h === 2
      ? [`½ × ${lab(2, 'height in cm')} = 1, so x + ${lab(b0, 'known base in cm')} = ${lab(A, 'area in cm²')}.`, ...solveLines(1, b0, 0, A)]
      : [`½ × ${lab(h, 'height in cm')} = ${h / 2}, so ${h / 2}(x + ${b0}) = ${lab(A, 'area in cm²')}, with ${lab(b0, 'known base in cm')}.`, `Distribute: ${lin(h / 2, (h / 2) * b0)} = ${lab(A, 'area in cm²')}.`, ...solveLines(h / 2, (h / 2) * b0, 0, A)],
    visual: geo([{ t: 'poly', pts: [[0, 0], [L, 0], [off + top, hd], [off, hd]], labels: ['x', '', `${b0}`, ''] }, { t: 'seg', a: [off, hd], b: [off, 0], dashed: true, label: `${h}` }, { t: 'text', p: [L / 2, -0.9], text: 'not to scale' }], 280, 180),
  });
  return model(q, { kind: 'balance', a: h / 2, b: (h / 2) * b0, c: 0, d: A, label: `${lin(h / 2, (h / 2) * b0)} = ${A}` }, [String(x)], 'Solve for x on the balance.');
}
function tileStep(rng: Rng): AskStep {
  const good = pick(rng, [['regular hexagons', 120, 3], ['squares', 90, 4], ['equilateral triangles', 60, 6]] as [string, number, number][]);
  const q = Q(K8, 'tiling', {
    prompt: 'The plaza needs one shape of regular tile, with no gaps and no overlaps. Which tile works?',
    expression: 'angles meeting at a point = 360°',
    answer: 0,
    hint: 'Tiles meet at a corner point. Their angles there must add to exactly 360°.',
    steps: [`${good[2]} ${good[0]} meet at each corner: ${lab(good[2], 'tiles')} × ${labd(good[1], 'each tile corner')} = ${labd(360, 'full turn')}.`, 'Pentagons (108°), octagons (135°) and decagons (144°) do not divide 360° evenly.'],
    visual: card('Tiling rule', ['angles at each corner', 'must total 360°']),
  });
  return choose(rng, q, good[0], ['regular pentagons', 'regular octagons', 'regular decagons']);
}
function gridAreaStep(rng: Rng): AskStep {
  const b = rint(rng, 3, 8); const h = 2 * rint(rng, 1, 3) + (b % 2 ? 0 : 1); const p = rint(rng, 0, b);
  const A = (b * h) / 2;
  const q = Q(K8, 'triangle-area', {
    prompt: `A solar panel's corners are at (0, 0), (${b}, 0) and ${pt(p, h)} on a metre grid. What is its area?`,
    expression: 'A = ½ × base × height',
    answer: A,
    unit: 'm²',
    hint: 'The base lies on the x-axis. The height is how far the top corner is above it.',
    steps: [`The base runs ${lab(b, 'base in m')} along the x-axis; the top corner's y gives ${lab(h, 'height in m')}.`, `A = ½ × ${lab(b, 'base in m')} × ${lab(h, 'height in m')} = ${lab(fmt(A), 'area in m²')}.`],
    visual: plotV([-1, 9, -1, 8], { segments: [{ a: [0, 0], b: [b, 0] }, { a: [b, 0], b: [p, h] }, { a: [p, h], b: [0, 0] }], points: [{ x: 0, y: 0 }, { x: b, y: 0 }, { x: p, y: h }] }),
  });
  return typed(q);
}

/* ================================================================== */
/* 9. Circles                                                          */
/* ================================================================== */
const K9 = 'circles';
function circumferenceStep(rng: Rng): AskStep {
  const r = rint(rng, 2, 12); const giveD = rng.next() < 0.5; const d = 2 * r;
  const q = Q(K9, 'circumference', {
    prompt: giveD ? `A flywheel is ${d} cm across. What is its circumference?` : `A flywheel has radius ${r} cm. What is its circumference?`,
    expression: giveD ? `C = π × d, d = ${d}` : `C = 2πr, r = ${r}`,
    answer: 2 * r * Math.PI, answerText: `${piStr(d)} cm`,
    hint: 'Every circle is about 3.14 diameters around: C = πd = 2πr.',
    steps: [giveD ? `C = π × ${lab(d, 'diameter in cm')}, so the circumference is ${piStr(d)} cm.` : `C = ${lab(2, 'radii in a diameter')} × π × ${lab(r, 'radius in cm')}, so the circumference is ${piStr(d)} cm.`, `That is about ${lab(fmt(Math.round(d * Math.PI * 10) / 10), 'circumference in cm')}.`],
    visual: { type: 'circle', r, unit: 'cm', show: giveD ? 'd' : 'r', wheel: true },
  });
  const wrong = giveD ? [`${piStr(2 * d)} cm`, `${piStr(r * r)} cm`, `${piStr(r)} cm`] : [`${piStr(r)} cm`, `${piStr(r * r)} cm`, `${piStr(4 * r)} cm`];
  return choose(rng, q, `${piStr(d)} cm`, wrong);
}
function circleAreaStep(rng: Rng): AskStep {
  const r = rint(rng, 2, 10); const giveD = rng.next() < 0.6; const d = 2 * r;
  const q = Q(K9, 'area', {
    prompt: giveD ? `A round hatch is ${d} cm across. What is its area?` : `A round hatch has radius ${r} cm. What is its area?`,
    expression: 'A = πr²',
    answer: r * r * Math.PI, answerText: `${piStr(r * r)} cm²`,
    hint: giveD ? 'The formula needs the radius, which is half the diameter.' : 'Square the radius, not double it.',
    steps: [giveD ? `r = ${lab(d, 'diameter in cm')} ÷ ${lab(2, 'radii in a diameter')} = ${lab(r, 'radius in cm')}.` : `r = ${lab(r, 'radius in cm')}.`, `A = π × ${r}² = π × ${lab(r * r, 'radius squared in cm²')}, so the area is ${piStr(r * r)} cm² (cm × cm = cm²).`],
    visual: { type: 'circle', r, unit: 'cm', show: giveD ? 'd' : 'r' },
  });
  const wrong = giveD ? [`${piStr(d * d)} cm²`, `${piStr(d)} cm²`, `${piStr((d * d) / 2)} cm²`] : [`${piStr(2 * r)} cm²`, `${piStr(4 * r * r)} cm²`, `${piStr(r)} cm²`];
  return choose(rng, q, `${piStr(r * r)} cm²`, wrong);
}
function arcPick(rng: Rng): { th: number; r: number } {
  const th = pick(rng, [30, 45, 60, 90, 120, 135, 150, 180, 240, 270]);
  const rs = Array.from({ length: 23 }, (_, i) => i + 2).filter((r) => (th * r) % 180 === 0);
  return { th, r: pick(rng, rs.length ? rs : [12]) };
}
function sectorFig(th: number, r: number, lab: string): Visual {
  const O: P2 = [0, 0]; const A = at(O, 90 - th / 2, 3); const B = at(O, 90 + th / 2, 3);
  return geo([{ t: 'circle', c: O, r: 3 }, { t: 'seg', a: O, b: A, label: `${r}` }, { t: 'seg', a: O, b: B }, ...(th < 180 ? [{ t: 'arc', at: O, from: A, to: B, label: `${th}°` } as GeoItem] : [{ t: 'text', p: [0, -0.8], text: `${th}°` } as GeoItem]), { t: 'text', p: at(O, 90, 3.6), text: lab }], 240, 220);
}
function arcLengthStep(rng: Rng): AskStep {
  const { th, r } = arcPick(rng); const L = (th * r) / 180;
  const q = Q(K9, 'arc', {
    prompt: `A gate swings through ${th}° on a ${r} m arm. How far does the tip travel along its arc?`,
    expression: `arc = (${th}/360) × 2π × ${r}`,
    answer: L * Math.PI, answerText: `${piStr(L)} m`,
    hint: 'An arc is a fraction of the whole circumference. What fraction of 360° is the angle?',
    steps: [`Whole circumference: 2π × ${lab(r, 'arm length in m')} = ${piStr(2 * r)} m.`, `The swing is ${labd(th, 'gate swing')} of ${labd(360, 'full turn')}, so the arc is ${th}/360 (fraction of the circle) of it.`, `Arc = ${piStr(2 * r)} m × ${th}/360 = ${piStr(L)} m.`],
    visual: sectorFig(th, r, 'arc ?'),
    app: 'Gate swings, cam profiles and road curves are laid out by arc length.',
  });
  return choose(rng, q, `${piStr(L)} m`, [`${piStr((th * r * r) / 360)} m`, `${piStr(2 * r)} m`, `${piStr(L / 2)} m`]);
}
function sectorAreaStep(rng: Rng): AskStep {
  const th = pick(rng, [30, 45, 60, 90, 120, 180, 270]); const rs = Array.from({ length: 11 }, (_, i) => i + 2).filter((r) => (th * r * r) % 360 === 0); const r = pick(rng, rs.length ? rs : [6]);
  const A = (th * r * r) / 360;
  const q = Q(K9, 'sector', {
    prompt: `A sprinkler waters a ${th}° sector out to ${r} m. What area does it cover?`,
    expression: `sector = (${th}/360) × π × ${r}²`,
    answer: A * Math.PI, answerText: `${piStr(A)} m²`,
    hint: 'A sector is a slice of the whole disc. Find the whole area first.',
    steps: [`Whole disc: π × ${r}² = π × ${lab(r * r, 'reach squared in m²')} = ${piStr(r * r)} m².`, `The sector is ${labd(th, 'spray angle')} of ${labd(360, 'full turn')}: ${th}/360 (fraction watered).`, `Watered area = ${piStr(r * r)} m² × ${th}/360 = ${piStr(A)} m².`],
    visual: sectorFig(th, r, ''),
  });
  return choose(rng, q, `${piStr(A)} m²`, [`${piStr((th * r) / 180)} m²`, `${piStr(r * r)} m²`, `${piStr((th * r * r) / 180)} m²`]);
}
function inscribedDialStep(rng: Rng): AskStep {
  const O: P2 = [0, 0];
  if (rng.next() < 0.6) {
    const a = stepPick(rng, 40, 170, 10); const ans = a / 2; // arc AB names the minor arc, so a < 180
    const A = at(O, 270 - a / 2, 3); const B = at(O, 270 + a / 2, 3); const P = at(O, 90 + rint(rng, -30, 30), 3);
    const q = Q(K9, 'inscribed', {
      prompt: `In the plaza paving, arc AB measures ${a}°. Point P is on the circle. Set the dial to the inscribed angle ∠APB.`,
      expression: `∠APB = ? (arc ${a}°)`,
      answer: ans,
      hint: 'The central angle matches the arc. An inscribed angle, standing on the circle, sees the same arc at half the size.',
      steps: ['An inscribed angle is half its intercepted arc.', `∠APB = ${labd(a, 'arc AB')} ÷ ${lab(2, 'inscribed is half')} = ${labd(ans, 'inscribed angle')}.`],
      visual: geo([{ t: 'circle', c: O, r: 3 }, { t: 'seg', a: P, b: A }, { t: 'seg', a: P, b: B }, { t: 'arc', at: P, from: A, to: B, label: '?' }, { t: 'pt', p: A, label: 'A' }, { t: 'pt', p: B, label: 'B' }, { t: 'pt', p: P, label: 'P' }, { t: 'pt', p: O }, { t: 'text', p: [0, -3.7], text: `arc AB = ${a}°` }], 240, 240),
    });
    return model(q, dial('Set ∠APB'), [String(ans)], 'Turn the dial to the inscribed angle.');
  }
  const i = stepPick(rng, 20, 85, 5); const c = 2 * i;
  const A = at(O, 270 - i, 3); const B = at(O, 270 + i, 3); const P = at(O, 90 + rint(rng, -30, 30), 3);
  const q = Q(K9, 'inscribed', {
    prompt: `Inscribed angle ∠APB is ${i}°. Set the dial to the central angle ∠AOB on the same arc.`,
    expression: `∠AOB = ? (∠APB = ${i}°)`,
    answer: c,
    hint: 'The central angle and the inscribed angle stand on the same arc. Which one is bigger?',
    steps: ['The central angle equals the arc; the inscribed angle is half the arc.', `So ∠AOB = ${lab(2, 'central is double')} × ${labd(i, 'inscribed angle')} = ${labd(c, 'central angle')}.`],
    visual: geo([{ t: 'circle', c: O, r: 3 }, { t: 'seg', a: P, b: A }, { t: 'seg', a: P, b: B }, { t: 'seg', a: O, b: A }, { t: 'seg', a: O, b: B }, { t: 'arc', at: P, from: A, to: B, label: `${i}°` }, { t: 'arc', at: O, from: A, to: B, label: '?' }, { t: 'pt', p: A, label: 'A' }, { t: 'pt', p: B, label: 'B' }, { t: 'pt', p: P, label: 'P' }, { t: 'pt', p: O, label: 'O' }], 240, 240),
  });
  return model(q, dial('Set ∠AOB'), [String(c)], 'Turn the dial to the central angle.');
}
function semicircleStep(rng: Rng): AskStep {
  const a = stepPick(rng, 20, 70, 5); const askP = rng.next() < 0.4;
  const O: P2 = [0, 0]; const A: P2 = [-3, 0]; const B: P2 = [3, 0]; const P = at(O, askP ? rint(rng, 40, 140) : 2 * a, 3);
  const q = Q(K9, 'semicircle', {
    prompt: askP ? 'AB is a diameter of the plaza circle and P is on the circle. What is ∠APB?' : `AB is a diameter and P is on the circle. ∠PAB = ${a}°. What is ∠PBA?`,
    expression: askP ? '∠APB = ?' : `∠PAB = ${a}°, ∠PBA = ?`,
    answer: askP ? 90 : 90 - a,
    hint: 'The diameter cuts off a semicircle. How does an inscribed angle compare with the arc it stands on?',
    steps: askP ? ['∠APB stands on a semicircle: an arc of 180°.', 'Inscribed angle = half the arc: 180° (semicircle arc) ÷ 2 = 90° (angle APB).'] : ['∠APB stands on a semicircle, so it is 90°.', `The triangle's angles add to 180°: ∠PBA = ${labd(180, 'angle sum')} − ${labd(90, 'angle APB')} − ${labd(a, 'angle PAB')} = ${labd(90 - a, 'angle PBA')}.`],
    visual: geo([{ t: 'circle', c: O, r: 3 }, { t: 'poly', pts: [A, B, P], open: true }, { t: 'pt', p: A, label: 'A' }, { t: 'pt', p: B, label: 'B' }, { t: 'pt', p: P, label: 'P' }, { t: 'pt', p: O }, ...(askP ? [{ t: 'arc', at: P, from: A, to: B, label: '?' } as GeoItem] : [{ t: 'arc', at: A, from: B, to: P, label: `${a}°` } as GeoItem, { t: 'arc', at: B, from: P, to: A, label: '?' } as GeoItem])], 240, 220),
  });
  return askP ? choose(rng, q, '90°', ['180°', '45°', '60°']) : choose(rng, q, dg(90 - a), [dg(180 - a), dg(a), dg(180 - 2 * a)]);
}
function wheelSliderStep(rng: Rng): AskStep {
  const d = pick(rng, [0.5, 1, 1.5, 2, 2.5, 3]); const C = Math.round(d * Math.PI * 10) / 10;
  const q = Q(K9, 'circumference', {
    prompt: `A surveyor's measuring wheel is ${fmt(d)} m across. How far does it roll in one full turn? Slide to the nearest 0.1 m.`,
    expression: `C = π × ${fmt(d)}`,
    answer: C,
    unit: 'm',
    hint: 'One turn lays the whole rim flat on the ground. π is a little more than 3.',
    steps: [`One turn rolls one circumference: C = π × ${lab(fmt(d), 'diameter in m')} ≈ ${lab('3.1416', 'value of pi')} × ${lab(fmt(d), 'diameter in m')} = ${lab(fmt(Math.round(d * Math.PI * 1000) / 1000), 'distance in m')}.`, `To the nearest 0.1 m: ${lab(fmt(C), 'distance per turn in m')}.`],
    visual: { type: 'circle', r: d / 2, unit: 'm', show: 'd', wheel: true },
  });
  return model(q, { kind: 'slider', min: 0, max: 10, step: 0.1, label: 'Distance in one turn', unit: 'm' }, [fmt(C)], 'Slide to the distance rolled in one turn.');
}
function piCoefStep(rng: Rng): AskStep {
  const r = rint(rng, 2, 12); const area = rng.next() < 0.5;
  const q = Q(K9, area ? 'area' : 'circumference', {
    prompt: area ? `A round vent has radius ${r} cm. Its area is ?π cm². Type the number in front of π.` : `A round vent has radius ${r} cm. Its circumference is ?π cm. Type the number in front of π.`,
    expression: area ? `A = π × ${r}² = ?π` : `C = 2π × ${r} = ?π`,
    answer: area ? r * r : 2 * r,
    hint: area ? 'Area uses r², the radius times itself.' : 'Circumference is 2 times π times the radius.',
    steps: [area ? `A = π × ${r}², and ${r}² = ${lab(r * r, 'radius squared in cm²')}, so A = ${r * r}π cm².` : `C = 2 × π × r, and ${lab(2, 'radii in a diameter')} × ${lab(r, 'radius in cm')} = ${lab(2 * r, 'diameter in cm')}, so C = ${2 * r}π cm.`],
    visual: { type: 'circle', r, unit: 'cm', show: 'r' },
  });
  return typed(q);
}
function pipeStep(rng: Rng): AskStep {
  const d = pick(rng, [10, 20, 30]); const k = pick(rng, [2, 3]);
  const q = Q(K9, 'area', {
    prompt: `One pipe ${k * d} cm across, or ${k} pipes each ${d} cm across: which carries more water (bigger total opening)?`,
    expression: `π(${(k * d) / 2})² vs ${k} × π(${d / 2})²`,
    answer: 0,
    hint: 'Area grows with the square of the radius, so doubling the width more than doubles the opening.',
    steps: [`One big pipe: radius ${lab((k * d) / 2, 'big radius in cm')}, area π × ${(k * d) / 2}² = ${piStr(((k * d) / 2) ** 2)} cm².`, `Small pipes: radius ${lab(d / 2, 'small radius in cm')}, area ${lab(k, 'small pipes')} × π × ${d / 2}² = ${piStr(k * (d / 2) ** 2)} cm².`, `The single ${k * d} cm pipe opens ${k} times as much as all the small pipes together.`],
    visual: card('Pipe openings', [`one pipe: ${k * d} cm across`, `or ${k} pipes: ${d} cm across each`]),
  });
  return choose(rng, q, `the one ${k * d} cm pipe`, [`the ${k} small pipes`, 'they carry the same']);
}
function ropeRiseStep(rng: Rng): AskStep {
  const L = pick(rng, [1, 2, 3, 5]); const rise = Math.round((L / (2 * Math.PI)) * 100) / 100;
  const q = Q(K9, 'circumference', {
    prompt: `A cable is wrapped tight around the Earth's equator. It is made ${L} m longer and raised evenly all round. How high does it rise, to 2 decimal places?`,
    expression: `2π(r + h) = 2πr + ${L}`,
    answer: rise, answerText: rise.toFixed(2),
    tolerance: 0.01,
    unit: 'm',
    hint: 'Extra circumference = 2π × extra radius, whatever the size of the circle.',
    steps: [`2π(r + h) − 2πr = 2πh = ${lab(L, 'extra cable in m')}.`, `h = ${lab(L, 'extra cable in m')} ÷ 2π ≈ ${lab(rise.toFixed(2), 'rise in m')}, the same for a marble or a planet.`],
    visual: card('Equator cable', [`+${L} m of cable`, 'rise = ?']),
    app: 'Belt drives and pulley loops follow the same rule: extra length = 2π × extra radius.',
  });
  return typed(q);
}
/** A running track: a rectangle with a semicircle on each end (perimeter and composite area with circles). */
function trackStep(rng: Rng): AskStep {
  const L = rint(rng, 8, 20); const r = rint(rng, 2, 5); const d = 2 * r; const askPer = rng.next() < 0.5;
  const semi = (c: P2, from: number): P2[] => Array.from({ length: 13 }, (_, i) => at(c, from + 15 * i, r));
  const visual = geo([
    { t: 'seg', a: [0, 0], b: [L, 0], label: `${L}` }, { t: 'seg', a: [0, d], b: [L, d] },
    { t: 'poly', pts: semi([L, r], -90), open: true }, { t: 'poly', pts: semi([0, r], 90), open: true },
    { t: 'seg', a: [0, 0], b: [0, d], dashed: true, label: `${d}` }, { t: 'seg', a: [L, 0], b: [L, d], dashed: true },
  ], 320, 170);
  const q = Q(K9, 'composite', {
    prompt: askPer
      ? `A running track has two ${L} m straights joined by semicircles ${d} m across. How long is one lap?`
      : `A plaza lawn is a ${L} m × ${d} m rectangle with a semicircle on each ${d} m end. What is its area?`,
    expression: askPer ? 'lap = 2 straights + 2 half-circles' : 'area = rectangle + 2 half-discs',
    answer: askPer ? 2 * L + d * Math.PI : L * d + r * r * Math.PI,
    answerText: askPer ? `${2 * L} + ${piStr(d)} m` : `${L * d} + ${piStr(r * r)} m²`,
    hint: askPer ? 'Walk the edge: which parts do your feet touch? The dashed diameters are not on the lap.' : 'Two half-discs make one whole disc. Use the radius, half of the width.',
    steps: askPer
      ? [`The two straights: ${lab(2, 'straights')} × ${lab(L, 'straight in m')} = ${lab(2 * L, 'straights in m')}.`, `The two semicircles make one whole circle of diameter ${lab(d, 'track width in m')}: π × ${d} = ${piStr(d)} m.`, `Lap = ${lab(2 * L, 'straights in m')} + ${piStr(d)} m ≈ ${lab(fmt(Math.round((2 * L + d * Math.PI) * 10) / 10), 'lap in m')}.`]
      : [`Rectangle: ${lab(L, 'length in m')} × ${lab(d, 'width in m')} = ${lab(L * d, 'rectangle in m²')}.`, `Two half-discs make one disc of radius ${lab(r, 'half the width in m')}: π × ${r}² = ${piStr(r * r)} m².`, `Area = ${lab(L * d, 'rectangle in m²')} + ${piStr(r * r)} m².`],
    visual,
    app: 'Tracks, windows and pipe bends combine straight runs with circle pieces.',
  });
  // Slips: counting a full circle at each end, adding the dashed diameters, using d in place of r.
  return askPer
    ? choose(rng, q, `${2 * L} + ${piStr(d)} m`, [`${2 * L} + ${piStr(2 * d)} m`, `${2 * L + 2 * d} + ${piStr(d)} m`, `${2 * L} + ${piStr(r)} m`])
    : choose(rng, q, `${L * d} + ${piStr(r * r)} m²`, [`${L * d} + ${piStr(2 * r * r)} m²`, `${L * d} + ${piStr(d * d)} m²`, `${L * d} + ${piStr(d)} m²`]);
}

/* ================================================================== */
/* 10. Surface area & volume                                           */
/* ================================================================== */
const K10 = 'solids';
const ellipse = (c: P2, rx: number, ry: number, n = 28): P2[] => Array.from({ length: n }, (_, i) => [r3(c[0] + rx * Math.cos((2 * Math.PI * i) / n)), r3(c[1] + ry * Math.sin((2 * Math.PI * i) / n))] as P2);
function coneFig(r: string, h: string): Visual {
  return geo([{ t: 'poly', pts: ellipse([0, 0], 3, 0.8), open: true }, { t: 'seg', a: [-3, 0], b: [0, 4.5] }, { t: 'seg', a: [3, 0], b: [0, 4.5] }, { t: 'seg', a: [0, 0], b: [0, 4.5], dashed: true, label: h }, { t: 'seg', a: [0, 0], b: [3, 0], label: r }, { t: 'arc', at: [0, 0], from: [3, 0], to: [0, 4.5], right: true }], 240, 220);
}
function pyramidFig(s: string, h: string): Visual {
  const B: P2[] = [[0, 0], [4, 0], [5.5, 1.5], [1.5, 1.5]]; const T: P2 = [2.75, 5];
  return geo([{ t: 'poly', pts: B, labels: [s, s, '', ''] }, ...B.map((p) => ({ t: 'seg', a: p, b: T } as GeoItem)), { t: 'seg', a: [2.75, 0.75], b: T, dashed: true, label: h }], 260, 230);
}
function sphereFig(r: number): Visual {
  return geo([{ t: 'circle', c: [0, 0], r: 3 }, { t: 'poly', pts: ellipse([0, 0], 3, 0.8), open: true }, { t: 'seg', a: [0, 0], b: [3, 0], label: `${r}` }, { t: 'pt', p: [0, 0] }], 220, 220);
}
function boxVolumeStep(rng: Rng): AskStep {
  const l = rint(rng, 2, 9); const w = rint(rng, 2, 6); const h = rint(rng, 2, 6);
  const q = Q(K10, 'prism', {
    prompt: `A concrete footing is ${l} m long, ${w} m wide and ${h} m deep. How much concrete fills it?`,
    expression: 'V = l × w × h',
    answer: l * w * h,
    unit: 'm³',
    hint: 'Count the 1 m cubes in one layer (base area), then stack the layers.',
    steps: [`Base layer: ${lab(l, 'length in m')} × ${lab(w, 'width in m')} = ${lab(l * w, 'one-metre cubes per layer')}.`, `${lab(l * w, 'cubes per layer')} × ${lab(h, 'layers, the depth in m')} = ${lab(l * w * h, 'volume in m³')}. Each cube is 1 m × 1 m × 1 m = 1 m³.`],
    visual: { type: 'box', l, w, h, unit: 'm' },
    app: 'Concrete, water and grain are ordered by volume.',
  });
  return typed(q);
}
function cylinderStep(rng: Rng): AskStep {
  const r = rint(rng, 2, 6); const h = rint(rng, 2, 10);
  const q = Q(K10, 'cylinder', {
    prompt: `A water tank is a cylinder of radius ${r} m and height ${h} m. What is its volume?`,
    expression: 'V = πr² × h',
    answer: Math.PI * r * r * h, answerText: `${piStr(r * r * h)} m³`,
    hint: 'A cylinder is a prism with a circular base: base area × height.',
    steps: [`Base area: π × ${r}², and ${r}² = ${lab(r * r, 'radius squared in m²')}, so the base is ${piStr(r * r)} m².`, `V = ${piStr(r * r)} m² × ${lab(h, 'height in m')} = ${piStr(r * r * h)} m³.`],
    visual: { type: 'cylinder', r, h, unit: 'm' },
  });
  return choose(rng, q, `${piStr(r * r * h)} m³`, [`${piStr(2 * r * h)} m³`, `${piStr(4 * r * r * h)} m³`, `${piStr(r * h)} m³`]);
}
function coneStep(rng: Rng): AskStep {
  let r = rint(rng, 2, 6); let h = 3 * rint(rng, 1, 4); if (rng.next() < 0.3) { r = 3 * rint(rng, 1, 2); h = rint(rng, 2, 8); }
  const V = (r * r * h) / 3;
  const q = Q(K10, 'cone', {
    prompt: `A sand hopper is a cone of radius ${r} m and height ${h} m. What is its volume?`,
    expression: 'V = ⅓ πr²h',
    answer: V * Math.PI, answerText: `${piStr(V)} m³`,
    hint: 'A cone holds exactly one third of the cylinder with the same base and height.',
    steps: [`Cylinder with the same base and height: π × ${lab(r * r, 'radius squared in m²')} × ${lab(h, 'height in m')} = ${piStr(r * r * h)} m³.`, `Three cones fill that cylinder, so the cone is ⅓ × ${piStr(r * r * h)} m³ = ${piStr(V)} m³.`],
    visual: coneFig(`${r}`, `${h}`),
  });
  return choose(rng, q, `${piStr(V)} m³`, [`${piStr(r * r * h)} m³`, `${piStr((r * r * h) / 2)} m³`, `${piStr(r * h)} m³`]);
}
function pyramidStep(rng: Rng): AskStep {
  let s = rint(rng, 2, 9); let h = 3 * rint(rng, 1, 4); if (rng.next() < 0.3) { s = 3 * rint(rng, 1, 3); h = rint(rng, 2, 10); }
  const V = (s * s * h) / 3;
  const q = Q(K10, 'pyramid', {
    prompt: `A stone pyramid cap has a ${s} m square base and is ${h} m tall. What is its volume?`,
    expression: 'V = ⅓ × base area × h',
    answer: V,
    unit: 'm³',
    hint: 'Three identical pyramids fill the prism with the same base and height.',
    steps: [`Base area: ${lab(s, 'base edge in m')} × ${lab(s, 'base edge in m')} = ${lab(s * s, 'base area in m²')}.`, `V = ⅓ × ${lab(s * s, 'base area in m²')} × ${lab(h, 'height in m')} = ${lab(V, 'volume in m³')}.`],
    visual: pyramidFig(`${s}`, `${h}`),
  });
  return typed(q);
}
function sphereStep(rng: Rng): AskStep {
  const r = pick(rng, [3, 6]); const askV = rng.next() < 0.5; const V = (4 * r ** 3) / 3; const SA = 4 * r * r;
  const q = Q(K10, 'sphere', {
    prompt: askV ? `A spherical gas tank has radius ${r} m. What is its volume?` : `A spherical gas tank has radius ${r} m. How much paint area does its surface need?`,
    expression: askV ? 'V = 4/3 πr³' : 'SA = 4πr²',
    answer: (askV ? V : SA) * Math.PI, answerText: `${piStr(askV ? V : SA)} ${askV ? 'm³' : 'm²'}`,
    hint: askV ? 'Volume uses r cubed (three lengths multiplied).' : 'The surface is exactly four of the sphere\'s own great circles: 4 × πr².',
    steps: askV
      ? [`${r}³ = ${lab(r ** 3, 'radius cubed in m³')}, so V = 4/3 × π × ${r ** 3} = ${piStr(V)} m³.`, `Why 4/3: Archimedes showed a sphere fills ⅔ of the cylinder that just holds it (radius r, height 2r, volume 2πr³), and ⅔ × 2πr³ = 4/3 πr³.`]
      : [`${r}² = ${lab(r * r, 'radius squared in m²')}, so SA = ${lab(4, 'great circles')} × π × ${r * r} = ${piStr(SA)} m².`, `Why 4πr²: Archimedes showed the sphere's surface equals the label of the cylinder that just holds it: 2πr × 2r = 4πr².`],
    visual: sphereFig(r),
  });
  return askV ? choose(rng, q, `${piStr(V)} m³`, [`${piStr(SA)} m³`, `${piStr(4 * r ** 3)} m³`, `${piStr(r ** 3)} m³`]) : choose(rng, q, `${piStr(SA)} m²`, [`${piStr(r * r)} m²`, `${piStr(2 * r * r)} m²`, `${piStr(V)} m²`]);
}
function surfaceTableStep(rng: Rng): AskStep {
  const l = rint(rng, 2, 8); const w = rint(rng, 2, 6); const h = rint(rng, 2, 6);
  const t = 2 * l * w; const f = 2 * l * h; const sd = 2 * w * h;
  const q = Q(K10, 'surface', {
    prompt: `A crate is ${l} m long, ${w} m wide and ${h} m tall. Unfold it: find each pair of faces, then the total surface area.`,
    expression: 'SA = 2lw + 2lh + 2wh',
    answer: t,
    hint: 'A box has three pairs of matching faces. Surface area counts all six.',
    steps: [`Top + bottom: ${lab(2, 'faces')} × ${lab(l, 'length in m')} × ${lab(w, 'width in m')} = ${lab(t, 'top and bottom in m²')}.`, `Front + back: ${lab(2, 'faces')} × ${lab(l, 'length in m')} × ${lab(h, 'height in m')} = ${lab(f, 'front and back in m²')}.`, `Left + right: ${lab(2, 'faces')} × ${lab(w, 'width in m')} × ${lab(h, 'height in m')} = ${lab(sd, 'two sides in m²')}.`, `Total: ${lab(t, 'top and bottom in m²')} + ${lab(f, 'front and back in m²')} + ${lab(sd, 'two sides in m²')} = ${lab(t + f + sd, 'surface area in m²')}.`],
    visual: { type: 'box', l, w, h, unit: 'm' },
  });
  return model(q, { kind: 'table', rowLabels: ['top + bottom', 'front + back', 'left + right', 'total'], cols: ['area (m²)'], rows: [[null], [null], [null], [null]], label: 'Unfold the crate' }, [`${t},${f},${sd},${t + f + sd}`], 'Fill in each pair of faces and the total.');
}
function scaleVolStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3]);
  const q = Q(K10, 'scale', {
    prompt: `Catalyst's reactor tank is rebuilt ${k} times as long, ${k} times as wide and ${k} times as tall. How many times the volume?`,
    expression: `${k} × ${k} × ${k}`,
    answer: k ** 3,
    hint: 'Volume multiplies three lengths. Each one grows.',
    steps: [`Each of the three dimensions is multiplied by ${k}: ${lab(k, 'length scale')} × ${lab(k, 'width scale')} × ${lab(k, 'height scale')} = ${lab(k ** 3, 'volume scale')}.`, `The volume is ${k ** 3} times as big (area would be ${k * k} times).`],
    visual: { type: 'cubes', l: k, w: k, h: k },
  });
  return choose(rng, q, `${k ** 3} times`, [`${k} times`, `${k * k} times`, `${3 * k} times`, `${2 * k} times`]);
}
function depthSliderStep(rng: Rng): AskStep {
  const l = rint(rng, 2, 5); const w = rint(rng, 2, 4); const d = stepPick(rng, 0.5, 5.5, 0.5); const V = l * w * d;
  const q = Q(K10, 'prism', {
    prompt: `A tank has a ${l} m × ${w} m floor. Catalyst pumps in ${fmt(V)} m³ of coolant. How deep is it?`,
    expression: `${l} × ${w} × depth = ${fmt(V)}`,
    answer: d,
    unit: 'm',
    hint: 'Volume = floor area × depth. Find the floor area first.',
    steps: [`Floor area: ${lab(l, 'length in m')} × ${lab(w, 'width in m')} = ${lab(l * w, 'floor area in m²')}.`, `Depth = ${lab(fmt(V), 'coolant in m³')} ÷ ${lab(l * w, 'floor area in m²')} = ${lab(fmt(d), 'depth in m')}, since m³ ÷ m² = m.`],
    visual: { type: 'box', l, w, h: d, unit: 'm', hide: 'h' },
  });
  return model(q, { kind: 'slider', min: 0, max: 6, step: 0.5, label: 'Coolant depth', unit: 'm' }, [fmt(d)], 'Slide to the depth of the coolant.');
}
function coneCylTableStep(rng: Rng): AskStep {
  const r = rint(rng, 2, 5); const h = 3 * rint(rng, 1, 3); const cyl = r * r * h; const cone = cyl / 3;
  const q = Q(K10, 'cone', {
    prompt: `A cylinder and a cone share a base of radius ${r} cm and height ${h} cm. Fill in each volume as a multiple of π.`,
    expression: 'cylinder πr²h, cone ⅓πr²h',
    answer: cyl,
    hint: 'Pour three full cones into the cylinder and it is exactly full.',
    steps: [`Cylinder: π × ${lab(r * r, 'radius squared in cm²')} × ${lab(h, 'height in cm')} = ${cyl}π cm³.`, `Cone: ⅓ × ${cyl}π = ${cone}π cm³, since three cones fill the cylinder.`],
    visual: coneFig(`${r}`, `${h}`),
  });
  return model(q, { kind: 'table', cols: ['cylinder', 'cone'], rowLabels: ['volume (× π)'], rows: [[null, null]], label: 'Same base, same height' }, [`${cyl},${cone}`], 'Fill in the number in front of π for each.');
}
function siloStep(rng: Rng): AskStep {
  const r = 3; const h = pick(rng, [6, 8, 10, 12]); const cyl = r * r * h; const hemi = (2 * r ** 3) / 3;
  const q = Q(K10, 'composite-solid', {
    prompt: `A grain silo is a cylinder (radius ${r} m, height ${h} m) topped with a hemisphere. What is its volume?`,
    expression: 'cylinder + ½ sphere',
    answer: (cyl + hemi) * Math.PI, answerText: `${piStr(cyl + hemi)} m³`,
    hint: 'Split the silo into two solids you know, then add.',
    steps: [`Cylinder: π × ${lab(r * r, 'radius squared in m²')} × ${lab(h, 'height in m')} = ${piStr(cyl)} m³.`, `Hemisphere, half a sphere: ½ × 4/3 × π × ${lab(r ** 3, 'radius cubed in m³')} = ${piStr(hemi)} m³.`, `Total: ${piStr(cyl)} m³ + ${piStr(hemi)} m³ = ${piStr(cyl + hemi)} m³.`],
    visual: (() => {
      const hd = h / 2; // drawn height, halved so the dome fits
      const dome: P2[] = Array.from({ length: 19 }, (_, i) => at([0, hd], 10 * i, 3));
      return geo([{ t: 'poly', pts: [[-3, 0], [3, 0], [3, hd], [-3, hd]], labels: ['', `${h}`, '', ''] }, { t: 'poly', pts: dome, open: true }, { t: 'seg', a: [0, hd], b: [3, hd], dashed: true, label: `${r}` }, { t: 'text', p: [0, hd + 1.3], text: 'hemisphere' }], 220, 240);
    })(),
  });
  return choose(rng, q, `${piStr(cyl + hemi)} m³`, [`${piStr(cyl)} m³`, `${piStr(cyl + 2 * hemi)} m³`, `${piStr(cyl + r * r)} m³`]);
}
function recastStep(rng: Rng): AskStep {
  const [R, r0] = pick(rng, [[3, 3], [3, 2], [6, 6], [6, 4], [6, 3]] as [number, number][]);
  const V = (4 * R ** 3) / 3; const h = V / (r0 * r0);
  const q = Q(K10, 'composite-solid', {
    prompt: `A steel ball of radius ${R} cm is melted and recast as a rod of radius ${r0} cm. How long is the rod?`,
    expression: `4/3 π × ${R}³ = π × ${r0}² × h`,
    answer: h,
    unit: 'cm',
    hint: 'Melting keeps the volume. Set the sphere\'s volume equal to the cylinder\'s.',
    steps: [`Sphere: 4/3 × π × ${lab(R ** 3, 'ball radius cubed in cm³')} = ${V}π cm³.`, `Rod: π × ${lab(r0 * r0, 'rod radius squared in cm²')} × h = ${r0 * r0}πh.`, `The volumes match and π cancels: ${r0 * r0}h = ${V}, so h = ${lab(V, 'volume over pi')} ÷ ${lab(r0 * r0, 'rod radius squared')} = ${lab(fmt(h), 'rod length in cm')}.`],
    visual: sphereFig(R),
  });
  return typed(q);
}
/** A box net: 6 rectangles, unfolded around the base (l × w), with side flaps h wide. */
function boxNetFig(l: number, w: number, h: number): Visual {
  const rect = (x: number, y: number, a: number, b: number, labels?: string[]): GeoItem => ({ t: 'poly', pts: [[x, y], [x + a, y], [x + a, y + b], [x, y + b]], ...(labels ? { labels } : {}) });
  return geo([
    rect(h, 0, l, h), rect(h, h, l, w, [`${l}`, `${w}`, '', '']), rect(h, h + w, l, h, ['', `${h}`, '', '']), rect(h, 2 * h + w, l, w),
    rect(0, h, h, w), rect(h + l, h, h, w),
  ], 240, 260);
}
function cylinderSurfaceStep(rng: Rng): AskStep {
  const r = rint(rng, 2, 6); const h = rint(rng, 2, 10);
  const ends = 2 * r * r; const label = 2 * r * h; const tot = ends + label;
  const O2: P2 = [r, -r - 0.5];
  const q = Q(K10, 'cylinder-surface', {
    prompt: `A can-shaped tank has radius ${r} m and height ${h} m. Unroll it: fill in each part of its surface as a multiple of π.`,
    expression: 'SA = 2πr² + 2πr × h',
    answer: ends,
    hint: 'Peel off the label: it unrolls into a rectangle as long as the rim (2πr) and as tall as the tank. Then add the two round ends.',
    steps: [`Two circles: ${lab(2, 'ends')} × π × ${lab(r * r, 'radius squared in m²')} = ${ends}π m².`, `Label: the rim 2π × ${lab(r, 'radius in m')} = ${piStr(2 * r)} m, times ${lab(h, 'height in m')} = ${label}π m².`, `Total: ${ends}π + ${label}π = ${tot}π m². (πr²h = ${r * r * h}π is the volume, not the surface.)`],
    visual: geo([{ t: 'poly', pts: [[0, 0], [2 * r, 0], [2 * r, h], [0, h]], labels: [`2π × ${r}`, `${h}`, '', ''] }, { t: 'circle', c: [r, h + r + 0.5], r }, { t: 'circle', c: O2, r }, { t: 'seg', a: O2, b: [2 * r, O2[1]], label: `${r}` }], 220, 280),
    app: 'Tanks and cans are priced by their sheet metal: the surface area.',
  });
  return model(q, { kind: 'table', rowLabels: ['two circles', 'label (2πr × h)', 'total'], cols: ['area (× π m²)'], rows: [[null], [null], [null]], label: 'Unroll the tank' }, [`${ends},${label},${tot}`], 'Fill in the number in front of π for each part.');
}
/** Square pyramid: base s, vertical height h, slant height ℓ with (s/2, h, ℓ) a Pythagorean triple. */
function pyramidSurfaceStep(rng: Rng): AskStep {
  const [half, h, l] = pick(rng, [[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10]] as [number, number, number][]);
  const s = 2 * half; const SA = s * s + 2 * s * l;
  const tri = (a: P2, b: P2, apex: P2): GeoItem => ({ t: 'poly', pts: [a, b, apex] });
  const k = 3 / s; const S = s * k; const Lk = l * k; // drawn scale
  const q = Q(K10, 'pyramid-surface', {
    prompt: `A roof cap is a square pyramid: base ${s} m, height ${h} m, and slant height ${l} m up the middle of each face. How much sheet metal covers all five faces?`,
    expression: 'SA = base + 4 triangles',
    answer: SA, answerText: `${SA} m²`,
    hint: 'Unfold it: a square and four triangles. Each triangle\'s height is the slant height up the face, not the height of the pyramid.',
    steps: [`Base: ${lab(s, 'base edge in m')} × ${lab(s, 'base edge in m')} = ${lab(s * s, 'base in m²')}.`, `Each triangle: ½ × ${lab(s, 'base edge in m')} × ${lab(l, 'slant height in m')} = ${lab(s * l / 2, 'one face in m²')}.`, `${lab(4, 'faces')} × ${lab(s * l / 2, 'one face in m²')} = ${lab(2 * s * l, 'four faces in m²')}.`, `Total: ${lab(s * s, 'base in m²')} + ${lab(2 * s * l, 'four faces in m²')} = ${lab(SA, 'sheet metal in m²')}. Using the vertical height ${h} m would give each face too little area.`],
    visual: geo([
      { t: 'poly', pts: [[0, 0], [S, 0], [S, S], [0, S]], labels: [`${s}`, '', '', ''] },
      tri([0, 0], [S, 0], [S / 2, -Lk]), tri([S, 0], [S, S], [S + Lk, S / 2]), tri([S, S], [0, S], [S / 2, S + Lk]), tri([0, S], [0, 0], [-Lk, S / 2]),
      { t: 'seg', a: [S / 2, S], b: [S / 2, S + Lk], dashed: true, label: `ℓ = ${l}` },
    ], 240, 240),
  });
  return choose(rng, q, `${SA} m²`, [`${s * s + 2 * s * h} m²`, `${2 * s * l} m²`, `${s * s + 4 * s * l} m²`]);
}
/** Cone curved surface πrℓ: it unrolls into a sector of radius ℓ whose arc is the rim, 2πr. */
function coneSurfaceStep(rng: Rng): AskStep {
  const [r, h, l] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 6, 10]] as [number, number, number][]);
  const q = Q(K10, 'cone-surface', {
    prompt: `A funnel is a cone with no lid: radius ${r} cm, height ${h} cm, slant height ${l} cm. How much sheet covers its curved surface?`,
    expression: 'curved surface = πrℓ',
    answer: Math.PI * r * l, answerText: `${piStr(r * l)} cm²`,
    hint: 'Cut the funnel along a slant line and flatten it: a sector of a circle of radius ℓ, whose curved edge is the rim, 2πr long.',
    steps: [`The flattened sheet is a sector of radius ℓ = ${lab(l, 'slant height in cm')}. Its arc is the rim, 2π × ${lab(r, 'radius in cm')}, which is ${r}/${l} (fraction of the full circle) of 2π × ${l}.`, `Area = ${r}/${l} × π × ${l}² = π × ${lab(r, 'radius in cm')} × ${lab(l, 'slant height in cm')} = ${piStr(r * l)} cm².`],
    visual: coneFig(`${r}`, `${h}`),
  });
  return choose(rng, q, `${piStr(r * l)} cm²`, [`${piStr(r * h)} cm²`, `${piStr(r * l + r * r)} cm²`, `${piStr(2 * r * l)} cm²`]);
}
type Cell = [number, number];
const CUBE_NETS: { cells: Cell[]; ok: boolean; why: string }[] = [
  { cells: [[0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [1, 0]], ok: true, why: '' },
  { cells: [[0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [3, 0]], ok: true, why: '' },
  { cells: [[0, 1], [1, 1], [2, 1], [3, 1], [2, 2], [0, 0]], ok: true, why: '' },
  { cells: [[0, 1], [1, 1], [2, 1], [2, 0], [3, 0], [4, 0]], ok: true, why: '' },
  { cells: [[0, 2], [1, 2], [1, 1], [2, 1], [2, 0], [3, 0]], ok: true, why: '' },
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [2, 1]], ok: false, why: 'The four in a row wrap around the sides, so both squares above it fold onto the top: they overlap and the bottom stays open.' },
  { cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], ok: false, why: 'A 2 × 3 block folds into a loop with two faces doubled and two ends open.' },
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1]], ok: false, why: 'Five in a row wrap all the way round, so the fifth square lands on the first.' },
];
function netFig(cells: Cell[]): Visual {
  return geo([...bounds([-0.2, -0.2], [5.2, 3.2]), ...cells.map(([x, y]) => ({ t: 'poly', pts: [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]] } as GeoItem))], 200, 140);
}
function netStep(rng: Rng): AskStep {
  const bad = pick(rng, CUBE_NETS.filter((n) => !n.ok)); const good = rng.shuffle(CUBE_NETS.filter((n) => n.ok)).slice(0, 3);
  const q = Q(K10, 'net', {
    prompt: 'Brick cut four cardboard nets for cube crates. Which one will NOT fold into a closed cube?',
    expression: 'Fold each net in your head',
    answer: 0,
    hint: 'Pick one square as the bottom and fold the others up around it. Does every face get exactly one square?',
    steps: [bad.why, 'A cube net needs exactly one square for each of the 6 faces: no overlaps, no gaps.'],
  });
  return pickFig(rng, q, [{ visual: netFig(bad.cells), right: true }, ...good.map((n) => ({ visual: netFig(n.cells) }))]);
}
const SECTIONS: { solid: 'cone' | 'cylinder' | 'cube' | 'pyramid'; cut: string; right: string; wrong: string[]; why: string }[] = [
  { solid: 'cone', cut: 'A cone is sliced parallel to its base.', right: 'a circle', wrong: ['a triangle', 'an ellipse', 'a rectangle'], why: 'Every slice parallel to the base is a smaller copy of the round base: a circle.' },
  { solid: 'cone', cut: 'A cone is sliced straight down through its tip and the centre of its base.', right: 'a triangle', wrong: ['a circle', 'a rectangle', 'a semicircle'], why: 'The cut runs from the tip to both ends of a diameter: a triangle.' },
  { solid: 'cylinder', cut: 'A cylinder is sliced parallel to its base.', right: 'a circle', wrong: ['a rectangle', 'an ellipse', 'a triangle'], why: 'Every slice parallel to the base is a copy of the base: a circle.' },
  { solid: 'cylinder', cut: 'A cylinder is sliced straight down through its axis.', right: 'a rectangle', wrong: ['a circle', 'a triangle', 'an ellipse'], why: 'The cut is as wide as the diameter and as tall as the cylinder: a rectangle.' },
  { solid: 'cube', cut: 'A cube is sliced parallel to one face.', right: 'a square', wrong: ['a triangle', 'a hexagon', 'a circle'], why: 'A slice parallel to a face is a copy of that face: a square.' },
  { solid: 'cube', cut: 'One corner of a cube is sliced off through the three corners next to it.', right: 'a triangle', wrong: ['a square', 'a hexagon', 'a circle'], why: 'The cut crosses three faces, one edge on each: a triangle (equilateral, since the three corners are equally far apart).' },
  { solid: 'pyramid', cut: 'A square pyramid is sliced parallel to its base.', right: 'a square', wrong: ['a triangle', 'a circle', 'a pentagon'], why: 'Every slice parallel to the base is a smaller copy of the square base.' },
];
function crossSectionStep(rng: Rng): AskStep {
  const f = pick(rng, SECTIONS);
  const visual: Visual = f.solid === 'cone' ? coneFig('', '') : f.solid === 'cylinder' ? { type: 'cylinder', r: 2, h: 4, unit: 'm' } : f.solid === 'cube' ? { type: 'box', l: 3, w: 3, h: 3, unit: 'm' } : pyramidFig('', '');
  const q = Q(K10, 'cross-section', {
    prompt: `${f.cut} What shape is the cut face?`,
    expression: 'cross-section = ?',
    answer: 0,
    hint: 'Picture the knife going through. Which edges or curves of the solid does the cut cross?',
    steps: [f.why],
    visual,
    app: 'CT scans and engineering drawings show solids as cross-sections.',
  });
  return choose(rng, q, f.right, f.wrong);
}

/* ================================================================== */
/* 11. Transformations                                                 */
/* ================================================================== */
const K11 = 'transform';
const R6: Range = [-6, 6, -6, 6];
const inR = (x: number, y: number, m = 6) => Math.abs(x) <= m && Math.abs(y) <= m;
function latticeP(rng: Rng, m = 5, avoid?: (x: number, y: number) => boolean): [number, number] {
  for (let g = 0; g < 100; g++) { const x = rint(rng, -m, m); const y = rint(rng, -m, m); if (x !== 0 && y !== 0 && Math.abs(x) !== Math.abs(y) && !(avoid && avoid(x, y))) return [x, y]; }
  return [2, 3];
}
function translateStep(rng: Rng): AskStep {
  let a = 0; let b = 0; let P: [number, number] = [0, 0];
  for (let g = 0; g < 100; g++) { a = rint(rng, -6, 6); b = rint(rng, -6, 6); P = [rint(rng, -5, 5), rint(rng, -5, 5)]; if ((a || b) && a !== 0 && b !== 0 && inR(P[0] + a, P[1] + b, 5)) break; }
  const I = [P[0] + a, P[1] + b];
  const q = Q(K11, 'translate', {
    prompt: `Slide the crane hook from P${pt(P[0], P[1])} by the rule (x, y) → (x ${fmtSigned(a)}, y ${fmtSigned(b)}). Plot P′.`,
    expression: `(x, y) → (x ${fmtSigned(a)}, y ${fmtSigned(b)})`,
    answer: I[0],
    hint: `A translation slides every point the same way: ${labn(Math.abs(a), `unit ${a > 0 ? 'right' : 'left'}`, `units ${a > 0 ? 'right' : 'left'}`)}, ${labn(Math.abs(b), `unit ${b > 0 ? 'up' : 'down'}`, `units ${b > 0 ? 'up' : 'down'}`)}.`,
    steps: [`x: ${lab(fmt(P[0]), 'x of P')} ${fmtSigned(a)} (slide in x) = ${lab(fmt(I[0]), 'new x')}.`, `y: ${lab(fmt(P[1]), 'y of P')} ${fmtSigned(b)} (slide in y) = ${lab(fmt(I[1]), 'new y')}.`, `P′ = ${pt(I[0], I[1])}.`],
    visual: plotV(R6, { points: [{ x: P[0], y: P[1], label: 'P' }] }),
    app: 'Robot arms and CNC machines move parts with translations.',
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: 'Plot P′', layers: { points: [{ x: P[0], y: P[1], label: 'P' }] } }, [`${I[0]},${I[1]}`], 'Tap where P lands after the slide.');
}
type Mirror = 'x' | 'y' | 'yx';
const MIRROR_NAME: Record<Mirror, string> = { x: 'the x-axis', y: 'the y-axis', yx: 'the line y = x' };
const reflectPt = (m: Mirror, x: number, y: number): [number, number] => (m === 'x' ? [x, -y] : m === 'y' ? [-x, y] : [y, x]);
function mirrorLayers(m: Mirror): PlotLayers {
  return m === 'yx' ? { fns: [{ fn: { kind: 'poly', c: [0, 1] }, color: 'ask', dashed: true, label: 'y = x' }] } : m === 'x' ? { hlines: [{ y: 0, label: 'mirror' }] } : { vlines: [{ x: 0, label: 'mirror' }] };
}
function reflectStep(rng: Rng): AskStep {
  const m = pick(rng, ['x', 'y', 'yx'] as Mirror[]); const [x, y] = latticeP(rng); const [u, v] = reflectPt(m, x, y);
  const layers: PlotLayers = { ...mirrorLayers(m), points: [{ x, y, label: 'P' }] };
  const q = Q(K11, 'reflect', {
    prompt: `Reflect P${pt(x, y)} over ${MIRROR_NAME[m]}. Plot P′.`,
    expression: `reflect over ${MIRROR_NAME[m]}`,
    answer: u,
    hint: m === 'yx' ? 'Reflecting over y = x swaps the roles of x and y.' : `The mirror is ${MIRROR_NAME[m]}. P′ is the same distance on the other side, straight across it.`,
    steps: m === 'x' ? ['Over the x-axis, x stays and y changes sign: (x, y) → (x, −y).', `P′ = ${pt(u, v)}.`] : m === 'y' ? ['Over the y-axis, y stays and x changes sign: (x, y) → (−x, y).', `P′ = ${pt(u, v)}.`] : ['Over y = x, the coordinates swap: (x, y) → (y, x).', `P′ = ${pt(u, v)}.`],
    visual: plotV(R6, layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `Reflect over ${MIRROR_NAME[m]}`, layers }, [`${u},${v}`], 'Tap the mirror image of P.');
}
type Rot = 90 | 180 | -90;
const rotatePt = (r: Rot, x: number, y: number): [number, number] => (r === 90 ? [-y, x] : r === 180 ? [-x, -y] : [y, -x]);
const ROT_NAME: Record<string, string> = { '90': '90° counterclockwise', '180': '180°', '-90': '90° clockwise' };
function rotateStep(rng: Rng): AskStep {
  const r = pick(rng, [90, 180, -90] as Rot[]); const [x, y] = latticeP(rng); const [u, v] = rotatePt(r, x, y);
  const layers: PlotLayers = { points: [{ x, y, label: 'P' }], segments: [{ a: [0, 0], b: [x, y], dashed: true, color: 'muted' }] };
  const q = Q(K11, 'rotate', {
    prompt: `Turn the crane arm ${ROT_NAME[String(r)]} about the origin. Where does P${pt(x, y)} land?`,
    expression: r === 90 ? '(x, y) → (−y, x)' : r === 180 ? '(x, y) → (−x, −y)' : '(x, y) → (y, −x)',
    answer: u,
    hint: 'Picture the arm from the origin to P as a rigid rod. Turn the page with it, a quarter turn at a time.',
    steps: [r === 90 ? '90° counterclockwise: (x, y) → (−y, x).' : r === 180 ? '180°: (x, y) → (−x, −y).' : '90° clockwise: (x, y) → (y, −x).', `P${pt(x, y)} → P′${pt(u, v)}.`],
    visual: plotV(R6, layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `Rotate ${ROT_NAME[String(r)]}`, layers }, [`${u},${v}`], 'Tap where P lands after the turn.');
}
function dilateStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 0.5]); const m = k === 2 ? 3 : k === 3 ? 2 : 6;
  let x = 0; let y = 0;
  for (let g = 0; g < 100; g++) { x = rint(rng, -m, m); y = rint(rng, -m, m); if (k === 0.5) { x -= x % 2; y -= y % 2; } if (x !== 0 && y !== 0) break; }
  if (x === 0 || y === 0) { x = 2; y = -2; }
  const u = x * k; const v = y * k;
  const layers: PlotLayers = { points: [{ x, y, label: 'P' }] };
  const q = Q(K11, 'dilate', {
    prompt: `Dilate P${pt(x, y)} from the origin by a scale factor of ${fmt(k)}. Plot P′.`,
    expression: `(x, y) → (${fmt(k)}x, ${fmt(k)}y)`,
    answer: u,
    hint: 'A dilation from the origin multiplies both coordinates. It never adds.',
    steps: [`Multiply both coordinates by ${lab(fmt(k), 'scale factor')}: x = ${fmt(k)} × ${lab(fmt(x), 'x of P')} = ${lab(fmt(u), 'new x')} and y = ${fmt(k)} × ${lab(fmt(y), 'y of P')} = ${lab(fmt(v), 'new y')}.`, `P′ = ${pt(u, v)}.`],
    visual: plotV(R6, layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `Dilate by ${lab(fmt(k), 'scale factor')}`, layers }, [`${u},${v}`], 'Tap the image of P.');
}
const RULES: { name: string; f: (x: number, y: number) => [number, number] }[] = [
  { name: '(x, y) → (−x, y)', f: (x, y) => [-x, y] },
  { name: '(x, y) → (x, −y)', f: (x, y) => [x, -y] },
  { name: '(x, y) → (y, x)', f: (x, y) => [y, x] },
  { name: '(x, y) → (−y, x)', f: (x, y) => [-y, x] },
  { name: '(x, y) → (y, −x)', f: (x, y) => [y, -x] },
  { name: '(x, y) → (−x, −y)', f: (x, y) => [-x, -y] },
];
const RULE_WHY = ['a reflection over the y-axis', 'a reflection over the x-axis', 'a reflection over y = x', 'a 90° counterclockwise rotation', 'a 90° clockwise rotation', 'a 180° rotation'];
function ruleStep(rng: Rng): AskStep {
  const [x, y] = latticeP(rng); const i = rint(rng, 0, RULES.length - 1); const [u, v] = RULES[i].f(x, y);
  const wrong = rng.shuffle(RULES.filter((_, j) => j !== i)).map((r) => r.name);
  const q = Q(K11, 'rule', {
    prompt: `The survey drone moved from P${pt(x, y)} to P′${pt(u, v)}. Which rule did it follow?`,
    expression: `${pt(x, y)} → ${pt(u, v)}`,
    answer: i,
    hint: 'Test each rule on P. Watch which coordinate moves where, and which signs flip.',
    steps: [`${RULES[i].name} sends ${pt(x, y)} to ${pt(u, v)}: ${RULE_WHY[i]}.`],
    visual: plotV(R6, { points: [{ x, y, label: 'P' }, { x: u, y: v, label: 'P′', color: 'ask' }] }),
  });
  return choose(rng, q, RULES[i].name, wrong);
}
function pickImageStep(rng: Rng): AskStep {
  const ox = rint(rng, 1, 2); const oy = rint(rng, 1, 2);
  const tri: [number, number][] = [[ox, oy], [ox + 3, oy], [ox, oy + 2]];
  const which = rint(rng, 0, RULES.length - 1);
  const picks = [which, ...rng.shuffle([0, 1, 2, 3, 4, 5].filter((j) => j !== which)).slice(0, 3)];
  const seg = (ps: [number, number][], color: 'muted' | 'orange') => ps.map((p, j) => ({ a: p, b: ps[(j + 1) % 3], color } as NonNullable<PlotLayers['segments']>[number]));
  const vis = (j: number): Visual => { const img = tri.map(([x, y]) => RULES[j].f(x, y)); return plotV(R6, { segments: [...seg(tri, 'muted'), ...seg(img, 'orange')] }); };
  const q = Q(K11, 'pick-image', {
    prompt: `Which sketch shows the gray panel after ${RULE_WHY[which]}${which >= 3 ? ' about the origin' : ''}?`,
    expression: `${RULE_WHY[which]}${which >= 3 ? ' about the origin' : ''}`,
    answer: 0,
    hint: 'Follow one corner: work out where the rule sends it, then check that sketch.',
    steps: [`${RULE_WHY[which][0].toUpperCase()}${RULE_WHY[which].slice(1)}: ${RULES[which].name}.`, `The corner ${pt(tri[1][0], tri[1][1])} goes to ${pt(...RULES[which].f(tri[1][0], tri[1][1]))}.`],
  });
  return pickFig(rng, q, picks.map((j) => ({ visual: vis(j), right: j === which })));
}
function segmentMoveStep(rng: Rng): AskStep {
  let a = 2; let b = -2; let A: [number, number] = [0, 0]; let B: [number, number] = [2, 1];
  for (let g = 0; g < 200; g++) {
    a = rint(rng, -4, 4); b = rint(rng, -4, 4); A = [rint(rng, -4, 4), rint(rng, -4, 4)]; B = [A[0] + pick(rng, [-3, -2, 2, 3]), A[1] + pick(rng, [-2, -1, 1, 2])];
    if (a && b && inR(B[0], B[1], 5) && inR(A[0] + a, A[1] + b, 5) && inR(B[0] + a, B[1] + b, 5)) break;
  }
  const A2 = [A[0] + a, A[1] + b]; const B2 = [B[0] + a, B[1] + b];
  const layers: PlotLayers = { segments: [{ a: A, b: B }], points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }] };
  const q = Q(K11, 'translate', {
    prompt: `Slide beam AB by (x, y) → (x ${fmtSigned(a)}, y ${fmtSigned(b)}). Plot A′ and B′.`,
    expression: `(x, y) → (x ${fmtSigned(a)}, y ${fmtSigned(b)})`,
    answer: A2[0],
    hint: 'Move each end by the same slide. The beam keeps its length and direction.',
    steps: [`A${pt(A[0], A[1])} → A′${pt(A2[0], A2[1])}.`, `B${pt(B[0], B[1])} → B′${pt(B2[0], B2[1])}.`],
    visual: plotV(R6, layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 2, label: 'Plot A′ and B′', layers }, undefined, 'Tap the two new ends of the beam.', { rule: { kind: 'set', items: [`${A2[0]},${A2[1]}`, `${B2[0]},${B2[1]}`] } });
}
function dilationFactStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3]); const askAngle = rng.next() < 0.5; const s = rint(rng, k === 2 ? 3 : 2, 6); // s = k = 2 would make the s + k distractor equal s·k
  const q = Q(K11, 'dilate', {
    prompt: askAngle ? `A triangle with a 30° angle is dilated by a factor of ${k}. What happens to that angle?` : `A triangle with a ${s} cm side is dilated by a factor of ${k}. How long is that side now?`,
    expression: askAngle ? `dilate × ${k}: angle 30° → ?` : `dilate × ${k}: ${s} cm → ?`,
    answer: askAngle ? 30 : s * k,
    hint: 'A dilation makes a similar figure: same shape, different size.',
    steps: askAngle ? ['Dilations multiply lengths but keep every angle: the image is similar, so the angle stays 30° (given angle).'] : [`Lengths multiply by the scale factor: ${lab(s, 'side in cm')} × ${lab(k, 'scale factor')} = ${lab(s * k, 'new side in cm')}. Angles stay the same.`],
    visual: card('Dilation', [`scale factor ${k}`, 'lengths ×k, angles unchanged?']),
  });
  return askAngle ? choose(rng, q, 'It stays 30°', [`It becomes ${30 * k}°`, `It becomes ${30 + k}°`, `It becomes ${fmt(30 / k)}°`]) : choose(rng, q, `${s * k} cm`, [`${s + k} cm`, `${s * k * k} cm`, `${s} cm`]);
}
function spriteTableStep(rng: Rng): AskStep {
  const i = pick(rng, [5, 3, 4]); const A = latticeP(rng, 5); const B = latticeP(rng, 5, (x, y) => x === A[0] && y === A[1]);
  const [a1, a2] = RULES[i].f(A[0], A[1]); const [b1, b2] = RULES[i].f(B[0], B[1]);
  const q = Q(K11, 'rule', {
    prompt: `A game sprite is turned ${i === 5 ? '180°' : i === 3 ? '90° counterclockwise' : '90° clockwise'} about the origin. Fill in the new corner coordinates.`,
    expression: RULES[i].name,
    answer: a1,
    hint: 'Apply the rule to each corner separately.',
    steps: [`${RULES[i].name}.`, `A${pt(A[0], A[1])} → ${pt(a1, a2)}; B${pt(B[0], B[1])} → ${pt(b1, b2)}.`],
    visual: card('Sprite corners', [`A${pt(A[0], A[1])}`, `B${pt(B[0], B[1])}`]),
    app: 'Game engines rotate sprites with exactly these coordinate rules.',
  });
  return model(q, { kind: 'table', cols: ['x′', 'y′'], rowLabels: [`A${pt(A[0], A[1])}`, `B${pt(B[0], B[1])}`], rows: [[null, null], [null, null]], label: 'New corners' }, [`${a1},${a2},${b1},${b2}`], 'Fill in x′ and y′ for each corner.');
}
/** Rotational and line symmetry: a new situation for the transfer (used nowhere else). */
function symmetryStep(rng: Rng): AskStep {
  const n = pick(rng, [3, 4, 5, 6]); const turn = 360 / n; const O: P2 = [0, 0];
  if (rng.next() < 0.6) {
    const blades: GeoItem[] = Array.from({ length: n }, (_, i) => { const d = 90 + turn * i; return { t: 'poly', pts: [at(O, d - 8, 0.9), at(O, d, 3.6), at(O, d + 8, 0.9)] } as GeoItem; });
    const q = Q(K11, 'symmetry', {
      prompt: `A wind-turbine hub has ${n} identical blades. What is the smallest turn that maps it exactly onto itself?`,
      expression: `${n} blades → smallest turn = ?`,
      answer: turn,
      hint: 'Turn until the next blade lands where the first one was. The blades share one full turn equally.',
      steps: [`${n} equal blades split the full 360° turn into ${n} equal steps.`, `${labd(360, 'full turn')} ÷ ${lab(n, 'blades')} = ${labd(turn, 'smallest turn')}. A full 360° turn always works, but it is not the smallest.`],
      visual: geo([...blades, { t: 'circle', c: O, r: 0.8 }], 220, 220),
      app: 'Rotors, fans and gears are balanced by rotational symmetry.',
    });
    return choose(rng, q, dg(turn), [dg(360), dg(turn / 2), n === 4 ? '60°' : '90°']);
  }
  const q = Q(K11, 'symmetry', {
    prompt: `A logo is ${aan(n === 3 ? 'equilateral triangle' : n === 4 ? 'square' : `regular ${NGON_NAME[n]}`)}. How many lines of symmetry does it have?`,
    expression: `regular ${n}-gon: lines of symmetry = ?`,
    answer: n,
    hint: 'A mirror line can run through a corner or through the middle of a side. Count them all the way round.',
    steps: [`A regular ${n}-gon has ${n} lines of symmetry: ${n % 2 ? 'each runs from a corner to the middle of the opposite side' : `${n / 2} run corner to corner and ${n / 2} run through the middles of opposite sides`}.`],
    visual: ngon(n),
  });
  return choose(rng, q, String(n), [String(2 * n), n % 2 ? '1' : String(n / 2), n === 4 ? '8' : '0'].filter((v) => v !== String(n)));
}
function compositionStep(rng: Rng): AskStep {
  const firstY = rng.next() < 0.5;
  const q = Q(K11, 'composition', {
    prompt: `Reflect a shape over the ${firstY ? 'y-axis, then over the x-axis' : 'x-axis, then over the y-axis'}. What single move does the same thing?`,
    expression: firstY ? '(x, y) → (−x, y) → (−x, −y)' : '(x, y) → (x, −y) → (−x, −y)',
    answer: 0,
    hint: 'Follow one point, such as (2, 1), through both reflections.',
    steps: ['Each reflection flips one sign; together both signs flip: (x, y) → (−x, −y).', 'That is a 180° rotation about the origin.'],
    visual: plotV(R6, { points: [{ x: 2, y: 1, label: 'P' }] }),
  });
  return choose(rng, q, 'a 180° rotation about the origin', ['a reflection over y = x', 'a 90° rotation about the origin', 'a translation']);
}

/* ================================================================== */
/* 12. Coordinate geometry                                             */
/* ================================================================== */
const K12 = 'coordinate';
function midpointStep(rng: Rng): AskStep {
  let A: [number, number] = [0, 0]; let B: [number, number] = [2, 2];
  for (let g = 0; g < 100; g++) { A = [rint(rng, -6, 6), rint(rng, -6, 6)]; B = [A[0] + 2 * rint(rng, -5, 5), A[1] + 2 * rint(rng, -5, 5)]; if (inR(B[0], B[1]) && Math.abs(B[0] - A[0]) + Math.abs(B[1] - A[1]) >= 4 && B[0] !== A[0]) break; }
  const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const layers: PlotLayers = { points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }], segments: [{ a: A, b: B, dashed: true, color: 'muted' }] };
  const q = Q(K12, 'midpoint', {
    prompt: `A cable runs from A${pt(A[0], A[1])} to B${pt(B[0], B[1])}. Plot its midpoint, where the support goes.`,
    expression: 'M = ((x₁ + x₂)/2, (y₁ + y₂)/2)',
    answer: M[0],
    hint: 'Average the x-coordinates, then average the y-coordinates.',
    steps: [`x: average ${lab(fmt(A[0]), 'x of A')} and ${lab(fmt(B[0]), 'x of B')}: (${sumText(A[0], B[0])}) ÷ ${lab(2, 'ends')} = ${lab(fmt(M[0]), 'x of M')}.`, `y: average ${lab(fmt(A[1]), 'y of A')} and ${lab(fmt(B[1]), 'y of B')}: (${sumText(A[1], B[1])}) ÷ ${lab(2, 'ends')} = ${lab(fmt(M[1]), 'y of M')}.`, `M = ${pt(M[0], M[1])}.`],
    visual: plotV(R6, layers),
    app: 'CAD software finds midpoints to centre supports and holes.',
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: 'Plot the midpoint', layers }, [`${M[0]},${M[1]}`], 'Tap the midpoint of AB.');
}
function endpointStep(rng: Rng): AskStep {
  let A: [number, number] = [0, 0]; let M: [number, number] = [1, 1]; let B: [number, number] = [2, 2];
  for (let g = 0; g < 100; g++) { A = [rint(rng, -6, 6), rint(rng, -6, 6)]; M = [rint(rng, -4, 4), rint(rng, -4, 4)]; B = [2 * M[0] - A[0], 2 * M[1] - A[1]]; if (inR(B[0], B[1]) && (M[0] !== A[0] || M[1] !== A[1]) && Math.abs(M[0] - A[0]) + Math.abs(M[1] - A[1]) >= 2) break; }
  const layers: PlotLayers = { points: [{ x: A[0], y: A[1], label: 'A' }, { x: M[0], y: M[1], label: 'M' }] };
  const q = Q(K12, 'endpoint', {
    prompt: `M${pt(M[0], M[1])} is the midpoint of beam AB, and A is at ${pt(A[0], A[1])}. Plot B.`,
    expression: 'B = M + (M − A)',
    answer: B[0],
    hint: 'Whatever step takes you from A to M, take the same step again from M.',
    steps: [`From A to M: x changes by ${lab(fmt(M[0] - A[0]), 'x step')}, y by ${lab(fmt(M[1] - A[1]), 'y step')}.`, `Repeat from M: x = ${lab(fmt(M[0]), 'x of M')} ${fmtSigned(M[0] - A[0])} (x step) = ${lab(fmt(B[0]), 'x of B')}, y = ${lab(fmt(M[1]), 'y of M')} ${fmtSigned(M[1] - A[1])} (y step) = ${lab(fmt(B[1]), 'y of B')}, so B = ${pt(B[0], B[1])}.`],
    visual: plotV(R6, layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: 'Plot B', layers }, [`${B[0]},${B[1]}`], 'Tap the other end of the beam.');
}
function distPair(rng: Rng): { A: [number, number]; B: [number, number]; dx: number; dy: number; d: number } {
  const [dx0, dy0, d] = pick(rng, [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15]] as [number, number, number][]);
  const dx = dx0 * (rng.next() < 0.5 ? -1 : 1); const dy = dy0 * (rng.next() < 0.5 ? -1 : 1);
  const A: [number, number] = [rint(rng, Math.max(-6, -6 - dx), Math.min(6, 6 - dx)), rint(rng, Math.max(-6, -6 - dy), Math.min(6, 6 - dy))];
  return { A, B: [A[0] + dx, A[1] + dy], dx, dy, d };
}
function distanceStep(rng: Rng): AskStep {
  if (rng.next() < 0.4) {
    // Most distances are not whole numbers: leave the exact answer as a simplified root.
    let dx = 2; let dy = 3;
    for (let g = 0; g < 100; g++) { dx = rint(rng, 1, 6); dy = rint(rng, 1, 6); const n = dx * dx + dy * dy; if (dx + dy >= 3 && Math.round(Math.sqrt(n)) ** 2 !== n) break; }
    const sx = rng.next() < 0.5 ? -1 : 1; const sy = rng.next() < 0.5 ? -1 : 1;
    const A: [number, number] = [rint(rng, Math.max(-6, -6 - sx * dx), Math.min(6, 6 - sx * dx)), rint(rng, Math.max(-6, -6 - sy * dy), Math.min(6, 6 - sy * dy))];
    const B: [number, number] = [A[0] + sx * dx, A[1] + sy * dy];
    const n = dx * dx + dy * dy; const [k, m] = rootParts(n); const exact = rt(k, m);
    const q = Q(K12, 'distance', {
      prompt: `A cable runs straight from A${pt(A[0], A[1])} to B${pt(B[0], B[1])} (grid in m). How long is it exactly?`,
      expression: 'd = √((x₂ − x₁)² + (y₂ − y₁)²)',
      answer: Math.sqrt(n), answerText: `${exact} m`,
      hint: 'Draw the right triangle under AB. Square the legs, add, and take the root. If it is not a perfect square, leave the root.',
      steps: [`Legs: |${minusLab(B[0], 'x of B', A[0], 'x of A')}| = ${lab(dx, 'run in m')} and |${minusLab(B[1], 'y of B', A[1], 'y of A')}| = ${lab(dy, 'rise in m')}.`, `d² = ${lab(dx * dx, 'run squared')} + ${lab(dy * dy, 'rise squared')} = ${lab(n, 'cable squared in m²')}, so the cable is √${n}${k > 1 ? ` = √(${k * k} × ${m}) = ${exact}` : ''} m ≈ ${lab(fmt(Math.round(Math.sqrt(n) * 100) / 100), 'cable in m')}.`],
      visual: plotV(R6, { segments: [{ a: A, b: B }, { a: A, b: [B[0], A[1]], dashed: true, color: 'muted' }, { a: [B[0], A[1]], b: B, dashed: true, color: 'muted' }], points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }] }),
    });
    // Slips: adding the legs, forgetting the root, rooting the sum of the legs, subtracting the squares.
    const isSq = (v: number) => Math.round(Math.sqrt(v)) ** 2 === v;
    const roots = [dx + dy, Math.abs(dx * dx - dy * dy)].filter((v) => v > 1 && !isSq(v)).map((v) => `√${v} m`);
    return choose(rng, q, `${exact} m`, [`${dx + dy} m`, `${n} m`, ...roots]);
  }
  const { A, B, dx, dy, d } = distPair(rng);
  const q = Q(K12, 'distance', {
    prompt: `A drone flies straight from A${pt(A[0], A[1])} to B${pt(B[0], B[1])} (grid in km). How far is that?`,
    expression: 'd = √((x₂ − x₁)² + (y₂ − y₁)²)',
    answer: d,
    hint: 'Draw the right triangle under AB: its legs are the change in x and the change in y.',
    steps: [`Legs: |${minusLab(B[0], 'x of B', A[0], 'x of A')}| = ${lab(Math.abs(dx), 'east-west leg in km')} and |${minusLab(B[1], 'y of B', A[1], 'y of A')}| = ${lab(Math.abs(dy), 'north-south leg in km')}.`, `d² = ${lab(dx * dx, 'east-west squared')} + ${lab(dy * dy, 'north-south squared')} = ${lab(d * d, 'distance squared in km²')}, so d = √${d * d} = ${lab(d, 'distance in km')}.`],
    visual: plotV(R6, { segments: [{ a: A, b: B }, { a: A, b: [B[0], A[1]], dashed: true, color: 'muted' }, { a: [B[0], A[1]], b: B, dashed: true, color: 'muted' }], points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }] }),
  });
  return choose(rng, q, `${d} km`, [`${Math.abs(dx) + Math.abs(dy)} km`, `${d * d} km`, `${Math.abs(Math.abs(dx) - Math.abs(dy)) || 1} km`]);
}
function cornerStep(rng: Rng): AskStep {
  const { A, B, dx, dy, d } = distPair(rng);
  const layers: PlotLayers = { segments: [{ a: A, b: B }], points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }] };
  const q = Q(K12, 'distance', {
    prompt: 'To find AB, build a right triangle under it. Plot the corner C where a horizontal leg meets a vertical leg.',
    expression: 'right angle at C',
    answer: d,
    answerText: `${pt(B[0], A[1])} or ${pt(A[0], B[1])}`,
    hint: 'C shares its x-coordinate with one end and its y-coordinate with the other.',
    steps: [`C = ${pt(B[0], A[1])} (or ${pt(A[0], B[1])}).`, `The legs are ${lab(Math.abs(dx), 'horizontal leg')} and ${lab(Math.abs(dy), 'vertical leg')}, so AB = √(${lab(dx * dx, 'horizontal squared')} + ${lab(dy * dy, 'vertical squared')}) = ${lab(d, 'length of AB')}.`],
    visual: plotV(R6, layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: 'Plot the right-angle corner', layers }, [`${B[0]},${A[1]}`, `${A[0]},${B[1]}`], 'Tap a corner that makes a right triangle with A and B.');
}
function slopeStep(rng: Rng): AskStep {
  let A: [number, number] = [0, 0]; let B: [number, number] = [1, 1];
  for (let g = 0; g < 100; g++) { A = [rint(rng, -5, 5), rint(rng, -5, 5)]; B = [rint(rng, -5, 5), rint(rng, -5, 5)]; if (B[0] !== A[0] && B[1] !== A[1]) break; }
  const dy = B[1] - A[1]; const dx = B[0] - A[0]; const m = dy / dx;
  const q = Q(K12, 'slope', {
    prompt: `A ramp runs from A${pt(A[0], A[1])} to B${pt(B[0], B[1])}. What is its slope?`,
    expression: 'm = (y₂ − y₁) / (x₂ − x₁)',
    answer: m, answerText: fracStr(dy, dx), fraction: !Number.isInteger(m), negative: m < 0,
    hint: 'Rise over run: change in y on top, change in x underneath, subtracted in the same order.',
    steps: [`Rise: ${minusLab(B[1], 'y of B', A[1], 'y of A')} = ${lab(fmt(dy), 'rise')}.`, `Run: ${minusLab(B[0], 'x of B', A[0], 'x of A')} = ${lab(fmt(dx), 'run')}.`, `m = ${lab(fmt(dy), 'rise')} ÷ ${dx < 0 ? `(${lab(fmt(dx), 'run')})` : lab(fmt(dx), 'run')} = ${lab(fracStr(dy, dx), 'slope')}.`],
    visual: plotV(R6, { segments: [{ a: A, b: B }], points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }] }),
  });
  return typed(q);
}
const SLOPES: [number, number][] = [[2, 1], [-2, 1], [1, 2], [-1, 2], [3, 1], [-3, 1], [1, 3], [-1, 3], [2, 3], [-2, 3], [3, 2], [-3, 2], [3, 4], [-4, 3]];
function perpSlopeStep(rng: Rng): AskStep {
  const [p, qd] = pick(rng, SLOPES); const m = fracStr(p, qd); const perp = fracStr(-qd, p);
  const q = Q(K12, 'perpendicular', {
    prompt: `A beam has slope ${m}. What slope must a cross-beam have to meet it at a right angle?`,
    expression: `m = ${m}, m⊥ = ?`,
    answer: -qd / p, answerText: perp,
    hint: 'Turn a rise-over-run triangle a quarter turn: rise and run swap, and one of them changes direction.',
    steps: [`Perpendicular slopes are negative reciprocals: flip ${lab(m, 'beam slope')} and change its sign.`, `m⊥ = ${lab(perp, 'cross-beam slope')}. Check: ${lab(m, 'beam slope')} × ${lab(perp, 'cross-beam slope')} = −1 (perpendicular test).`],
    visual: plotV(R6, { fns: [{ fn: { kind: 'poly', c: [0, p / qd] }, label: `m = ${m}` }] }),
  });
  return choose(rng, q, perp, [fracStr(-p, qd), fracStr(qd, p), fracStr(p, qd)]);
}
/** 'y = ½x − 3' for the slopes used on the plot model. */
function lineText(m: number, b: number): string {
  const mx = m === 0.5 ? '½x' : m === -0.5 ? '−½x' : Number.isInteger(m) ? coefTerm(m, 'x') : `${fmt(m)}x`;
  return `y = ${mx}${b ? ` ${fmtSigned(b)}` : ''}`;
}
/** 'From P(1, 2), go 2 right and 1 down to (3, 1).' for a slope, staying on the grid. */
function stepText(P: [number, number], m: number): string {
  const run = Number.isInteger(m) ? 1 : 2; const rise = m * run;
  const fwd = inR(P[0] + run, P[1] + rise); const dir = fwd ? 1 : -1; const Q2: [number, number] = [P[0] + dir * run, P[1] + dir * rise];
  const vert = (r: number) => lab(Math.abs(r), `rise ${r < 0 ? 'down' : 'up'}`);
  return `From P${pt(P[0], P[1])}, go ${lab(run, `run ${fwd ? 'right' : 'left'}`)} and ${vert(dir * rise)} to reach ${pt(Q2[0], Q2[1])}.`;
}
function lineThroughStep(rng: Rng, perp: boolean): AskStep {
  const [p, qd] = pick(rng, [[1, 1], [-1, 1], [2, 1], [-2, 1], [1, 2], [-1, 2]] as [number, number][]);
  const m = p / qd; const b = rint(rng, -3, 3); const m2 = perp ? -qd / p : m;
  let P: [number, number] = [0, 0]; let b2 = 0;
  for (let g = 0; g < 200; g++) {
    P = [rint(rng, -4, 4), rint(rng, -4, 4)]; b2 = P[1] - m2 * P[0];
    let cnt = 0; for (let x = -6; x <= 6; x++) { const y = m2 * x + b2; if (Number.isInteger(Math.round(y * 1e9) / 1e9) && Math.abs(y) <= 6) cnt++; }
    if (cnt >= 3 && Math.abs(b2 - b) > 1e-9 && Math.abs(P[1] - (m * P[0] + b)) > 1e-9) break;
  }
  const layers: PlotLayers = { fns: [{ fn: { kind: 'poly', c: [b, m] }, label: lineText(m, b) }], points: [{ x: P[0], y: P[1], label: 'P' }] };
  const mt = fracStr(p, qd); const m2t = perp ? fracStr(-qd, p) : mt;
  const q = Q(K12, perp ? 'perpendicular' : 'parallel', {
    prompt: perp ? `Draw a brace through P${pt(P[0], P[1])} perpendicular to the beam ${lineText(m, b)}. Tap two points on it.` : `Lay a second rail through P${pt(P[0], P[1])} parallel to the rail ${lineText(m, b)}. Tap two points on it.`,
    expression: `slope ${mt} → slope ?`,
    answer: m2,
    hint: perp ? 'Perpendicular slope: flip the fraction and change the sign. Then step from P.' : 'Parallel lines have the same slope. Step from P using that rise and run.',
    steps: [perp ? `The beam's slope is ${lab(mt, 'beam slope')}, so the brace's slope is ${lab(m2t, 'brace slope')}.` : `Parallel means the same slope: ${lab(mt, 'rail slope')}.`, stepText(P, m2), `The new line is ${lineText(m2, b2)}.`],
    visual: plotV(R6, layers),
  });
  return model(q, { kind: 'plot', range: R6, count: 2, label: perp ? 'Draw the perpendicular' : 'Draw the parallel', layers }, undefined, 'Tap two points on your new line.', { rule: { kind: 'on-line', m: m2, b: b2 } });
}
const parallelLineStep = (rng: Rng) => lineThroughStep(rng, false);
const perpLineStep = (rng: Rng) => lineThroughStep(rng, true);
function classifyLinesStep(rng: Rng): AskStep {
  const [p, qd] = pick(rng, SLOPES); const kind = pick(rng, ['parallel', 'perpendicular', 'neither', 'neither'] as const);
  const m1 = fracStr(p, qd);
  const m2 = kind === 'parallel' ? m1 : kind === 'perpendicular' ? fracStr(-qd, p) : pick(rng, [fracStr(-p, qd), fracStr(qd, p)]);
  const b1 = rint(rng, -5, 5); let b2 = rint(rng, -5, 5); if (b2 === b1) b2 = b1 + 2;
  const eq = (m: string, b: number) => `y = ${m === '1' ? '' : m === '−1' ? '−' : m.includes('/') ? `(${m})` : m}x${b ? ` ${fmtSigned(b)}` : ''}`;
  const q = Q(K12, 'classify-lines', {
    prompt: `Rail 1: ${eq(m1, b1)}. Rail 2: ${eq(m2, b2)}. How do they meet?`,
    expression: `slopes ${m1} and ${m2}`,
    answer: 0,
    hint: 'Compare slopes: equal means parallel; multiplying to −1 means perpendicular.',
    steps: [kind === 'parallel' ? `Both slopes are ${lab(m1, 'slope of each rail')}, with different intercepts: parallel.` : kind === 'perpendicular' ? `${lab(m1, 'rail one slope')} × ${lab(m2, 'rail two slope')} = −1: perpendicular.` : `${lab(m1, 'rail one slope')} and ${lab(m2, 'rail two slope')} are not equal and do not multiply to −1: neither. (Perpendicular needs the flip AND the sign change.)`],
    visual: card('Two rails', [eq(m1, b1), eq(m2, b2)]),
  });
  return choose(rng, q, kind, ['parallel', 'perpendicular', 'neither'].filter((k) => k !== kind));
}
/** 'rise/run', followed by '= m' only when it simplifies: '2/1 = 2', '1/2', '−3/2'. */
function slopeWork(rise: number, run: number): string { const raw = `${fmt(rise)}/${fmt(run)}`; const red = fracStr(rise, run); return raw === red ? raw : `${raw} = ${red}`; }
function roadsStep(rng: Rng): AskStep {
  const [p, qd] = pick(rng, [[1, 2], [2, 1], [1, 3], [3, 1], [2, 3]] as [number, number][]); const perp = rng.next() < 0.5;
  const A: [number, number] = [0, 0]; const B: [number, number] = [qd, p];
  const C: [number, number] = [-4, 0]; const D: [number, number] = perp ? [-4 + p, -qd] : [-4 + p, qd];
  const m1 = fracStr(p, qd); const m2 = fracStr(D[1] - C[1], D[0] - C[0]);
  const q = Q(K12, 'perpendicular', {
    prompt: `Road 1 runs through ${pt(...A)} and ${pt(...B)}; road 2 through ${pt(...C)} and ${pt(...D)}. Do they cross at a right angle?`,
    expression: `slopes ${m1} and ${m2}`,
    answer: perp ? 1 : 0,
    hint: 'Find both slopes, then multiply them.',
    steps: [`Slope 1 = ${slopeWork(p, qd)} (road one slope). Slope 2 = ${slopeWork(D[1] - C[1], D[0] - C[0])} (road two slope).`, perp ? `${lab(m1, 'road one slope')} × ${lab(m2, 'road two slope')} = −1, so yes: a right angle.` : `${lab(m1, 'road one slope')} × ${lab(m2, 'road two slope')} ≠ −1, so no.`],
    visual: plotV(R6, { segments: [{ a: A, b: B }, { a: C, b: D, color: 'orange' }], points: [{ x: A[0], y: A[1] }, { x: B[0], y: B[1] }, { x: C[0], y: C[1] }, { x: D[0], y: D[1] }] }),
  });
  return choose(rng, q, perp ? 'Yes: the slopes multiply to −1' : 'No: the slopes do not multiply to −1', [perp ? 'No: the slopes do not multiply to −1' : 'Yes: the slopes multiply to −1', 'Can’t tell without a protractor']);
}
function meetStep(rng: Rng): AskStep {
  const t = distPair(rng);
  const { A, B, d } = t;
  const q = Q(K12, 'distance', {
    prompt: `Two rovers at ${pt(A[0], A[1])} and ${pt(B[0], B[1])} (grid in km) drive straight toward each other and meet halfway. How far does each drive?`,
    expression: 'half of AB',
    answer: d / 2,
    unit: 'km',
    hint: 'Find the whole distance with the distance formula, then halve it.',
    steps: [`AB = √(${lab(t.dx * t.dx, 'x change squared')} + ${lab(t.dy * t.dy, 'y change squared')}) = √${d * d} = ${lab(d, 'distance apart in km')}.`, `Each drives ${lab(d, 'distance apart in km')} ÷ ${lab(2, 'rovers')} = ${lab(fmt(d / 2), 'each drive in km')}.`],
    visual: plotV(R6, { segments: [{ a: A, b: B, dashed: true }], points: [{ x: A[0], y: A[1], label: 'rover 1' }, { x: B[0], y: B[1], label: 'rover 2' }] }),
  });
  return typed(q);
}

/* ================================================================== */
/* CHAPTERS                                                            */
/* ================================================================== */
const CHAPTERS: ChapterSpec[] = [
  {
    key: K1, title: 'Points, Lines & Planes', wing: 'gate', wingName: 'Straightedge Gate',
    goal: 'Name points, lines, planes, segments and rays; add segment lengths; find a midpoint; measure, classify and bisect angles on the dial.',
    misconception: 'Treating ray AB and ray BA as the same thing (or a line as if it stopped at its points); reading the wrong protractor scale.',
    teach: [
      { title: 'Point, line, plane', text: 'A point is a location with no size. A line runs forever both ways, and two points fix exactly one. A plane is a flat surface that runs forever: three points not on one line fix one plane.', steps: ['Mark A and B: exactly one line runs through both.', 'Add C off that line. Each pair of points fixes its own line: AB, BC and CA.', 'Count the pairs: 3 (points) × 2 (partners each) ÷ 2 (each line counted twice) = 3 (lines).', 'All three lines lie in the one plane that A, B and C fix.'], next: 'Add a fourth point D, with no three of the points on one line. How many lines can you draw now?', visual: figVisual('line') },
      { title: 'Segments and rays', text: 'Segment AB stops at A and B, so it has a length. Ray AB starts at A, passes through B and never stops. The first letter is the start, so ray BA points the other way.', steps: ['On a ruler, A sits at 0 and B at 4: AB = 4 (B\'s mark) − 0 (A\'s mark) = 4 (length of AB).', 'With P between A and B and AP = 1.5, the rest is PB = 4 (length of AB) − 1.5 (length of AP) = 2.5 (length of PB).', 'The midpoint is the average of the two ends: (0 (A\'s mark) + 4 (B\'s mark)) ÷ 2 (ends) = 2 (midpoint mark), so each half is 2 long.', 'Ray AB passes B at 4 and keeps going, so it has no length.'], next: 'C sits at 7 on ray AB. How long is segment BC?', visual: figVisual('rayAB') },
      { title: 'Measuring angles', text: 'An angle is the turn between two rays from one vertex. Read the protractor scale that starts at 0 on one ray. Acute is less than 90°, right is 90°, obtuse is between 90° and 180°. Perpendicular lines meet at 90°, and a bisector cuts an angle into two equal halves.', steps: ['Put one ray on 0 and read the other ray on the same scale: 135° (the angle).', '135° (the angle) is between 90° (right angle) and 180° (straight line), so it is obtuse.', 'The other scale reads 180 (straight line) − 135 (the angle) = 45° (other scale) at the same mark: that is the wrong scale, not the angle.', 'The bisector cuts it in half: 135 (the angle) ÷ 2 (equal halves) = 67.5° (each half), and 67.5 + 67.5 = 135° (whole angle).'], next: 'Set the dial to 70°. Is it acute or obtuse, and what does each half of its bisector measure?', model: dial('Try it: set 135°') },
    ],
    quests: [
      { id: 'aq.geo.lines.cable', name: 'Cable Run', giver: 'volt', guided: true,
        hook: 'Volt: "The gate lamps need cable, and my sketches are a mess of rays and segments. Name them right, then measure the runs."',
        change: 'Lamps glow along the Straightedge Gate.',
        waves: [wave('Name the figure', mixOf([figureNameStep, figureNameStep, notationStep])), wave('Add the segments', mixOf([segAddStep, midpointLineStep, segAlgebraStep])), wave('Swing the crane', mixOf([angleMeasureStep, classifyAngleStep, angleBisectorStep]))] },
      { id: 'aq.geo.lines.gate', name: 'Raise the Gate', giver: 'ada',
        hook: 'Ada: "The gate beam is marked in algebra and the crane protractor has two scales. Solve the spans, then set the arm."',
        change: 'The Straightedge Gate swings open.',
        waves: [wave('Solve the span', mixOf([segAlgebraStep, segAddStep, segAlgebraStep])), wave('Find the middle', mixOf([midpointLineStep, midpointLineStep, notationStep])), wave('Read the dial', mixOf([angleMeasureStep, angleBisectorStep, classifyAngleStep]))] },
    ],
    concept: conceptFrom([figureNameStep, midpointLineStep, angleMeasureStep, segAlgebraStep, angleBisectorStep]),
    transfer: oneOf([clockAngleStep, trailStep]),
    practice: (rng) => segAddStep(rng).question,
  },
  {
    key: K2, title: 'Angle Pairs', wing: 'gate', wingName: 'Gatehouse Hinges',
    goal: 'Use complementary, supplementary, vertical and linear-pair angles to find unknown angles, with numbers and with algebra.',
    misconception: 'Mixing up complementary (90°) and supplementary (180°); thinking vertical angles add to 180° instead of being equal.',
    teach: [
      { title: 'Straight line: 180°', text: 'Two angles side by side on a straight line form a linear pair. Together they make a straight angle, so they add to 180°: they are supplementary.', steps: ['The straight line is a straight angle: 180°.', 'On the figure: 130 (right-hand angle) + 50 (left-hand angle) = 180° (straight line).', 'Missing angle: 180 (straight line) − 130 (known angle) = 50° (missing angle).'], next: 'One angle of a linear pair is 72°. What is the other?', visual: linearPairFig(130, '50°', '130°') },
      { title: 'Square corner: 90°', text: 'Two angles that fill a right angle add to 90°: they are complementary. C comes before S in the alphabet, and 90 comes before 180.', steps: ['The square corner is 90°, split by the middle beam.', '35 (lower part) + 55 (upper part) = 90° (square corner), so 35° and 55° are complementary.', 'Missing angle: 90 (square corner) − 35 (known part) = 55° (missing part).', 'Compare the supplement of 35°: 180 (straight line) − 35 (the angle) = 145° (supplement).'], next: 'What angle is complementary to 28°?', visual: geo([{ t: 'seg', a: [0, 0], b: [4, 0] }, { t: 'seg', a: [0, 0], b: [0, 4] }, { t: 'seg', a: [0, 0], b: at([0, 0], 35, 4) }, { t: 'arc', at: [0, 0], from: [4, 0], to: at([0, 0], 35, 4), label: '35°' }, { t: 'arc', at: [0, 0], from: at([0, 0], 35, 4), to: [0, 4], label: '55°' }], 240, 200) },
      { title: 'Vertical angles are equal', text: 'When two lines cross, the angles across from each other are vertical angles. Each one makes a linear pair with the same neighbour, so they must be equal.', steps: ['One angle is 60°. Its neighbour on the straight line is 180 (straight line) − 60 (given angle) = 120° (neighbour).', 'The angle across from the 60° is also next to that 120°: 180 (straight line) − 120 (neighbour) = 60° (angle across).', 'So vertical angles match, and all four go once round: 60 (given) + 120 (neighbour) + 60 (across) + 120 (neighbour) = 360° (full turn).'], next: 'Two lines cross and one angle is 75°. What are the other three?', visual: crossFig(60, ['60°', '120°', '60°', '120°']) },
    ],
    quests: [
      { id: 'aq.geo.pairs.hinges', name: 'Gatehouse Hinges', giver: 'ada', guided: true,
        hook: 'Ada: "The gate hinges swing on angle pairs. Get the partner angle right or the doors bind."',
        change: 'The gatehouse doors swing freely.',
        waves: [wave('Straight and square', mixOf([linearPairDialStep, complementDialStep, compSuppStep])), wave('Crossing girders', mixOf([verticalStep, verticalStep, cornersTableStep])), wave('Angles in algebra', mixOf([pairEquationStep, verticalAlgebraStep, linearAlgebraStep]))] },
      { id: 'aq.geo.pairs.girders', name: 'Crossed Girders', giver: 'brick',
        hook: 'Brick: "Cross-braced girders everywhere, and every angle is written in x. Solve them before the load goes on."',
        change: 'The cross-bracing takes the load.',
        waves: [wave('Pairs', mixOf([compSuppStep, compSuppStep, linearPairDialStep])), wave('Solve for x', mixOf([pairEquationStep, verticalAlgebraStep, linearAlgebraStep])), wave('All four corners', mixOf([cornersTableStep, verticalStep]))] },
    ],
    concept: conceptFrom([linearPairDialStep, cornersTableStep, pairEquationStep, complementDialStep]),
    transfer: oneOf([scissorsStep, mirrorStep]),
    practice: (rng) => typedPrompt(linearPairDialStep(rng).question),
  },
  {
    key: K3, title: 'Parallel Lines & Transversals', wing: 'bridges', wingName: 'Rail Bridges',
    goal: 'Find corresponding, alternate interior, alternate exterior and co-interior angles, and use them to prove lines parallel.',
    misconception: 'Thinking every angle in the figure is equal, or that co-interior angles are equal (they add to 180°).',
    teach: [
      { title: 'One crossing, copied', text: 'A transversal cuts two parallel rails at the same tilt, so the upper crossing is an exact copy of the lower one. Corresponding angles (same corner, an F shape) are equal.', steps: ['Top crossing, upper right corner: 60° (given angle).', 'Bottom crossing, same corner: a copy, so also 60° (corresponding angle).', 'Its neighbour along each rail: 180 (straight rail) − 60 (given angle) = 120° (neighbour), at both crossings.'], visual: railFig(60, [{ v: 'T', p: 'UR', label: '60°' }, { v: 'B', p: 'UR', label: '60°' }]) },
      { title: 'Z and C shapes', text: 'Alternate interior angles sit between the rails on opposite sides (a Z): equal. Co-interior angles sit between the rails on the same side (a C): they add to 180°.', steps: ['Z: 60° (top angle) and 60° (bottom angle), on opposite sides between the rails.', 'C: 60° (top angle) and 120° (bottom angle), on the same side between the rails.', '60 (top angle) + 120 (bottom angle) = 180° (straight angle), so the C pair is supplementary.', 'Missing co-interior angle: 180 (C pair total) − 60 (top angle) = 120° (co-interior partner).'], next: 'Tilt the crossing so one angle is 75°. What are its Z partner and its C partner?', visual: railFig(60, [{ v: 'T', p: 'LL', label: '60°' }, { v: 'B', p: 'UR', label: '60°' }, { v: 'B', p: 'UL', label: '120°' }]) },
      { title: 'Working backwards', text: 'The converse proves rails parallel: if corresponding or alternate angles are equal, or co-interior angles add to 180°, the rails never meet.', steps: ['The two marked angles sit between the rails on the same side: a C pair.', '110 (top angle) + 70 (bottom angle) = 180° (C pair total), so the rails are parallel.', 'If the bottom read 75° instead: 110 (top angle) + 75 (new bottom angle) = 185° (their sum), not 180°, so the rails would meet.'], next: 'Corresponding angles read 64° and 66°. Are the rails parallel?', visual: railFig(70, [{ v: 'T', p: 'LR', label: '110°' }, { v: 'B', p: 'UR', label: '70°' }]) },
    ],
    quests: [
      { id: 'aq.geo.parallel.rails', name: 'True Rails', giver: 'brick', guided: true,
        hook: 'Brick: "The rail bridge needs its cross-ties set. The rails are parallel, so one angle tells you all eight."',
        change: 'Cross-ties lock into the rail bridge.',
        waves: [wave('Name the pair', mixOf([relNameStep, relNameStep, transAngleStep])), wave('Set the ties', mixOf([transAngleStep, transAngleStep, railTableStep])), wave('Angles in algebra', mixOf([railEquationStep, transAlgebraStep, transAngleStep]))] },
      { id: 'aq.geo.parallel.survey', name: 'Parallel or Not?', giver: 'ada',
        hook: 'Ada: "Two new rails were laid in the dark. Measure the angles and tell me: parallel, or a derailment waiting to happen?"',
        change: 'The second rail line opens to traffic.',
        waves: [wave('Check the rails', mixOf([converseStep, converseStep, relNameStep])), wave('Solve the angles', mixOf([railEquationStep, transAlgebraStep, transAngleStep])), wave('The whole crossing', mixOf([railTableStep, converseStep]))] },
    ],
    concept: conceptFrom([transAngleStep, railTableStep, converseStep, railEquationStep]),
    transfer: oneOf([eratosthenesStep, sunRayStep]),
    practice: (rng) => typedPrompt(transAngleStep(rng).question),
  },
  {
    key: K4, title: 'Triangles', wing: 'bridges', wingName: 'Truss Yard',
    goal: 'Use the angle sum and the exterior angle theorem, classify triangles, and test side lengths with the triangle inequality.',
    misconception: 'Believing any three lengths make a triangle (3, 4, 8); classifying by the two angles you can see instead of the largest angle.',
    teach: [
      { title: 'Three corners, one straight line', text: 'Draw the line through C parallel to AB. Alternate interior angles (the Z shapes) copy ∠A and ∠B up to C, where the three angles sit side by side along one straight line. So the angles of every triangle add to 180°.', steps: ['∠A = 50° is copied up to C by one Z, and ∠B = 60° by the other.', 'Along the dashed line at C: 50 (copy of angle A) + 70 (angle C) + 60 (copy of angle B) = 180° (straight line).', 'Missing angle: ∠C = 180 (angle sum) − 50 (angle A) − 60 (angle B) = 70° (angle C).'], next: 'A triangle has angles 90° and 35°. What is the third?', visual: (() => { const p = triPts(50, 60); const C = p[2]; const L: P2 = [C[0] - 3.5, C[1]]; const R: P2 = [C[0] + 3.5, C[1]]; return geo([{ t: 'poly', pts: p }, { t: 'seg', a: L, b: R, dashed: true }, ...vertexArcs(p, ['50°', '60°', '70°']), { t: 'arc', at: C, from: L, to: p[0], label: '50°' }, { t: 'arc', at: C, from: p[1], to: R, label: '60°' }, { t: 'pt', p: p[0], label: 'A' }, { t: 'pt', p: p[1], label: 'B' }, { t: 'pt', p: C, label: 'C' }], 320, 200); })() },
      { title: 'The exterior angle', text: 'Extend one side. The outside angle and its inside neighbour make 180°, and so do the neighbour and the other two angles. So the exterior angle equals the two remote interior angles added.', steps: ['Inside angle at B: 180 (angle sum) − 50 (angle A) − 60 (top angle) = 70° (inside angle at B).', 'Exterior angle on the straight line: 180 (straight line) − 70 (inside angle at B) = 110° (exterior angle).', 'Shortcut: 50 (angle A) + 60 (top angle) = 110° (exterior angle), the two remote angles added.'], next: 'The remote angles are 45° and 80°. What is the exterior angle?', visual: geo([{ t: 'poly', pts: triPts(50, 70) }, { t: 'seg', a: [6, 0], b: [9, 0], dashed: true }, ...vertexArcs(triPts(50, 70), ['50°', '', '60°']), { t: 'arc', at: [6, 0], from: [9, 0], to: triPts(50, 70)[2], label: '110°' }], 320, 200) },
      { title: 'Can the beams close?', text: 'Lay the two shorter beams along the longest. If they add to more than it, they reach past each other and close a triangle. Equal, and they lie flat; less, and they fall short.', steps: ['Beams 4 and 7: the third must be longer than 7 (long beam) − 4 (short beam) = 3 (lower limit) and shorter than 7 (long beam) + 4 (short beam) = 11 (upper limit).', 'Try 4, 7, 10: 4 (short beam) + 7 (long beam) = 11 (two beams together), more than 10 (third beam), so it closes.', 'Try 4, 7, 12: 4 (short beam) + 7 (long beam) = 11 (two beams together), less than 12 (third beam), so the beams fall short.'], next: 'Can beams 3, 5 and 8 close a triangle?', model: { kind: 'numberline', start: 0, min: 0, max: 15, label: 'Beams 4 (short beam) and 7 (long beam): the third is between 3 (lower limit) and 11 (upper limit)' } },
    ],
    quests: [
      { id: 'aq.geo.triangles.truss', name: 'Truss Yard', giver: 'brick', guided: true,
        hook: 'Brick: "Bridge trusses are all triangles. Tell me the missing angles and which beam bundles will even close."',
        change: 'Finished trusses stack up in the yard.',
        waves: [wave('Angle sum', mixOf([missingAngleDialStep, missingAngleDialStep, classifyTriStep])), wave('Can it close?', mixOf([inequalityStep, thirdSideStep, thirdSideStep])), wave('Outside the joint', mixOf([exteriorStep, isoscelesStep]))] },
      { id: 'aq.geo.triangles.roof', name: 'Roof Rafters', giver: 'ada',
        hook: 'Ada: "The roof trusses are isosceles and the plans are written in x. Solve the angles before the rafters are cut."',
        change: 'The Truss Yard roof goes up.',
        waves: [wave('Equal rafters', mixOf([isoscelesStep, isoscelesStep, exteriorStep])), wave('Angles in x', mixOf([triAlgebraStep, triAlgebraStep, missingAngleDialStep])), wave('Classify and close', mixOf([classifyTriStep, inequalityStep]))] },
    ],
    concept: conceptFrom([missingAngleDialStep, thirdSideStep, isoscelesStep, triAlgebraStep]),
    transfer: oneOf([shortcutStep, robotTurnStep]),
    practice: (rng) => typedPrompt(missingAngleDialStep(rng).question),
  },
  {
    key: K5, title: 'Congruence & Proof', wing: 'keep', wingName: 'Proof Hall',
    goal: 'Prove triangles congruent with SSS, SAS, ASA, AAS or HL, use CPCTC, and choose the reason for each step of a two-column proof.',
    misconception: 'Thinking SSA or AAA proves congruence; matching parts by where they sit in the picture instead of by the letter order in the statement.',
    teach: [
      { title: 'Congruent means a perfect copy', text: 'Congruent triangles match side for side and angle for angle. In ΔABC ≅ ΔDEF the order is the map: A ↔ D, B ↔ E, C ↔ F.', steps: ['The order is the map: A ↔ D, B ↔ E, C ↔ F.', 'AB = 5 (side length), so its partner DE = 5 (same length).', '∠A = 63° and ∠B = 43°, so ∠D = 63° (copy of angle A) and ∠E = 43° (copy of angle B).', 'Third angle: 180 (angle sum) − 63 (angle A) − 43 (angle B) = 74° (angle C), for ∠C and ∠F alike.'], next: 'In ΔPQR ≅ ΔXYZ, which side of ΔXYZ matches QR?', visual: critFig('SSS') },
      { title: 'Five shortcuts, two traps', text: 'SSS, SAS (angle between the sides), ASA (side between the angles), AAS, and HL for right triangles each prove congruence. SSA and AAA do not: two different triangles can match them.', steps: ['Marked here: two sides and the 63° angle between them, so SAS.', 'Two angles fix the third: 180 (angle sum) − 63 (angle A) − 43 (angle B) = 74° (angle C). That is why AAS works as well as ASA.', 'AAA trap: double every side and the angles still read 63 (angle A) + 43 (angle B) + 74 (angle C) = 180° (angle sum). Same shape, different size.'], visual: critFig('SAS') },
      { title: 'Two-column proof', text: 'Each statement needs a reason: given, a definition (midpoint, bisector), a property (reflexive), or a theorem (vertical angles, SAS). Once triangles are congruent, CPCTC gives every matching part.', steps: ['Given: AB = 10, M is its midpoint, and CM ⊥ AB.', 'M halves AB: 10 (length of AB) ÷ 2 (equal halves) = 5 (length of AM), so AM = MB = 5.', '∠AMC = ∠BMC = 90° (perpendicular) and CM is shared (reflexive), so ΔAMC ≅ ΔBMC by SAS.', 'CPCTC: if ∠A is 40°, so is ∠B, and ∠ACB = 180 (angle sum) − 40 (angle A) − 40 (angle B) = 100° (angle ACB).'], visual: card('Two-column proof', ['Statement → Reason', 'AM ≅ MB → Def. of midpoint', 'ΔAMC ≅ ΔBMC → SAS', '∠A ≅ ∠B → CPCTC']) },
    ],
    quests: [
      { id: 'aq.geo.congruence.panels', name: 'Matching Panels', giver: 'brick', guided: true,
        hook: 'Brick: "The keep\'s wall panels must be exact copies. Tell me which rule proves it, then read off the missing sizes."',
        change: 'Matched panels seal the keep wall.',
        waves: [wave('Which rule?', mixOf([criterionStep, criterionStep, criterionStep])), wave('Match the parts', mixOf([cpctcStep, corrTableStep, cpctcAngleStep])), wave('Solve and check', mixOf([congAlgebraStep, criterionStep]))] },
      { id: 'aq.geo.congruence.proof', name: 'The Proof Hall', giver: 'vector',
        hook: 'Vector: "A proof is a chain, and each link needs a reason. Supply the missing ones and the hall doors open."',
        change: 'The Proof Hall doors swing open.',
        waves: [wave('Give the reason', mixOf([reasonStep, reasonStep, proofChainStep])), wave('Congruent parts', mixOf([cpctcAngleStep, corrTableStep, congAlgebraStep])), wave('Follow the chain', mixOf([proofChainStep, criterionStep, cpctcStep]))] },
    ],
    concept: conceptFrom([criterionStep, corrTableStep, cpctcAngleStep, proofChainStep]),
    transfer: oneOf([riverStep, rigidStep]),
    practice: (rng) => cpctcStep(rng).question,
  },
  {
    key: K6, title: 'Similarity & Scale', wing: 'keep', wingName: 'Blueprint Room',
    goal: 'Find scale factors, missing sides of similar triangles, heights from shadows, and how area grows with scale.',
    misconception: 'Thinking additively (adding the same amount to every side) instead of multiplying; assuming area scales by k instead of k².',
    teach: [
      { title: 'Same shape, scaled', text: 'Similar figures have equal angles, and every side is multiplied by the same scale factor k. Scaling multiplies: adding the same amount to each side changes the shape.', steps: ['6 (big side) ÷ 3 (matching small side) = 2 (scale factor), so k = 2.', 'Every side times 2 (scale factor): 3 × 2 = 6 (short side), 4 × 2 = 8 (middle side), 5 × 2 = 10 (long side).', 'Adding 2 (extra length) instead gives 5-6-7, but 5 (new short) ÷ 3 (old short) ≈ 1.67 and 7 (new long) ÷ 5 (old long) = 1.4: no single k, so not similar.', 'The right angle stays 90° in both.'], next: 'Scale the 3-4-5 triangle by 3. What are its sides?', visual: simFig([3, 4, 5], 2, ['3', '4', '5'], ['6', '8', '10']) },
      { title: 'Two angles are enough', text: 'If two angles match, the third must match too (they all add to 180°), so AA proves triangles similar. Sun shadows make similar triangles: same sun angle, same right angle.', steps: ['Pole: 1.5 tall with a shadow of 2. Tower: shadow 8.', '8 (tower shadow) ÷ 2 (pole shadow) = 4 (scale factor), so the tower’s triangle is the pole’s scaled by 4.', 'Tower height: 1.5 (pole height) × 4 (scale factor) = 6 (tower height).', 'The sun angle is about 37° in both, so both top angles are about 180 (angle sum) − 90 (right angle) − 37 (sun angle) ≈ 53° (top angle).'], visual: geo([{ t: 'poly', pts: [[0, 0], [2, 0], [0, 1.5]], labels: ['2', null, '1.5'] }, { t: 'poly', pts: [[4, 0], [12, 0], [4, 6]], labels: ['8', null, '6'] }], 320, 190) },
      { title: 'Area grows by k²', text: 'Scale a shape by k and every length is multiplied by k. Area uses two lengths, so it is multiplied by k × k = k²; volume uses three, so k³.', steps: ['3 (big side) ÷ 1 (small side) = 3 (scale factor), so k = 3.', 'Area counts unit squares, so it uses two lengths: 1 (side) × 1 (side) = 1 (square unit) becomes 3 (side) × 3 (side) = 9 (square units), and 3² = 9: nine small squares fit inside.', 'A 1 by 1 by 1 cube scaled by 3 holds 3³ = 27 (small cubes).'], next: 'Scale the 1 by 1 square by 2 instead. How many small squares fit inside?', visual: geo([{ t: 'poly', pts: [[0, 0], [1, 0], [1, 1], [0, 1]], labels: ['1', '1', null, null] }, { t: 'poly', pts: [[2, 0], [5, 0], [5, 3], [2, 3]], labels: ['3', '3', null, null] }], 300, 180) },
    ],
    quests: [
      { id: 'aq.geo.similarity.blueprint', name: 'Blueprint Room', giver: 'ada', guided: true,
        hook: 'Ada: "The blueprints are all scale drawings. Scale them up right, multiply, never add, or the towers come out warped."',
        change: 'Scaled plans are pinned across the Blueprint Room.',
        waves: [wave('Scale factor', mixOf([dilateTrussStep, additiveStep, dilateTrussStep])), wave('Similar sides', mixOf([similarTableStep, similarTableStep, aaStep])), wave('Shadows', mixOf([shadowStep, areaScaleStep]))] },
      { id: 'aq.geo.similarity.shadows', name: 'Tower Shadows', giver: 'newton',
        hook: 'Newton: "No ladder reaches the keep\'s tower. But the sun is shining, and a shadow is a similar triangle."',
        change: 'The tower heights are chalked on the Blueprint Room wall.',
        waves: [wave('Shadow heights', mixOf([shadowStep, shadowStep, aaStep])), wave('Proportions', mixOf([proportionStep, proportionStep, similarTableStep])), wave('Area and scale', mixOf([areaScaleStep, additiveStep, dilateTrussStep]))] },
    ],
    concept: conceptFrom([similarTableStep, dilateTrussStep, proportionStep, areaScaleStep]),
    transfer: oneOf([pinholeStep, mapScaleStep]),
    practice: (rng) => shadowStep(rng).question,
  },
  {
    key: K7, title: 'Right Triangles', wing: 'keep', wingName: 'Surveyors\' Stair',
    goal: 'Use a² + b² = c² to find any side, test for right angles with the converse, simplify square roots, and use the 45-45-90 and 30-60-90 shortcuts.',
    misconception: 'Adding the legs (a + b = c) or adding squares when the missing side is a leg; swapping the √3 and the 2 in a 30-60-90 triangle.',
    teach: [
      { title: 'Squares on the sides', text: 'Build a square on each side of a 3-4-5 right triangle: the leg squares hold 9 and 16 tiles, the hypotenuse square 25, and 9 (short leg square) + 16 (long leg square) = 25 (hypotenuse square). Why always? Four copies of the triangle fit in an (a + b) square leaving a c² hole; rearranged, they leave an a² and a b² hole instead. Same square, same triangles, so a² + b² = c².', visual: geo([
        { t: 'poly', pts: [[0, 0], [4, 0], [0, 3]] }, { t: 'arc', at: [0, 0], from: [4, 0], to: [0, 3], right: true },
        { t: 'poly', pts: [[0, 0], [4, 0], [4, -4], [0, -4]], fill: 'rgba(45,212,191,0.25)' }, { t: 'text', p: [2, -2], text: '16' },
        { t: 'poly', pts: [[0, 0], [0, 3], [-3, 3], [-3, 0]], fill: 'rgba(45,212,191,0.25)' }, { t: 'text', p: [-1.5, 1.5], text: '9' },
        { t: 'poly', pts: [[4, 0], [0, 3], [3, 7], [7, 4]], fill: 'rgba(245,158,11,0.25)' }, { t: 'text', p: [3.5, 3.5], text: '25' },
        { t: 'text', p: [2, -4.8], text: '9 + 16 = 25' },
      ], 260, 280) },
      { title: 'The converse checks corners', text: 'If the longest side squared equals the other two squared and added, the corner is exactly 90°. Bigger means obtuse, smaller means acute. Builders use 3-4-5 to square a foundation.', steps: ['3, 4, 5: 3² + 4² = 9 + 16 = 25 (leg squares added), and 5² = 25 (longest squared), so the corner is 90°.', '4, 5, 7: 4² + 5² = 16 + 25 = 41 (leg squares added), and 7² = 49 (longest squared) is bigger: obtuse.', '5, 6, 7: 5² + 6² = 25 + 36 = 61 (leg squares added), and 7² = 49 (longest squared) is smaller: acute.'], next: 'A frame measures 6, 8 and 11. Is its corner square, obtuse or acute?', visual: card('Corner check', ['c² = a² + b²  → right', 'c² > a² + b²  → obtuse', 'c² < a² + b²  → acute']) },
      { title: 'Two special triangles', text: 'Half a square is 45-45-90: legs x and x, hypotenuse √(x² + x²) = √(2x²) = x√2. Pull perfect squares out of a root: √18 = √(9 × 2) = 3√2. Half an equilateral triangle is 30-60-90: short leg x, hypotenuse 2x, long leg √(4x² − x²) = √(3x²) = x√3.', visual: geo([{ t: 'poly', pts: [[0, 0], [r3(2 * Math.sqrt(3)), 0], [r3(2 * Math.sqrt(3)), 2]], labels: ['x√3', 'x', '2x'] }, ...vertexArcs([[0, 0], [r3(2 * Math.sqrt(3)), 0], [r3(2 * Math.sqrt(3)), 2]], ['30°', 'R', '60°'])], 280, 190) },
    ],
    quests: [
      { id: 'aq.geo.right.stair', name: 'Surveyors\' Stair', giver: 'ada', guided: true,
        hook: 'Ada: "The keep stair needs braces and ramps cut to length. Square the sides, add, and root."',
        change: 'Braced ramps climb the Surveyors\' Stair.',
        waves: [wave('Square the sides', mixOf([squaresTableStep, hypStep, squaresTableStep])), wave('Find the leg', mixOf([legStep, legStep, braceSliderStep])), wave('Square corners?', mixOf([converseStep7, braceSliderStep, converseStep7]))] },
      { id: 'aq.geo.right.special', name: 'Special Braces', giver: 'vector',
        hook: 'Vector: "Two triangles appear so often that engineers memorise them. Learn why they work, then use the shortcut."',
        change: 'Special-angle braces lock the stair in place.',
        waves: [wave('45-45-90', mixOf([simplifyRootStep, special45Step, special45Step, special45TableStep])), wave('30-60-90', mixOf([special3060Step, special3060Step, special3060TableStep])), wave('Mixed', mixOf([legStep, braceSliderStep, converseStep7]))] },
    ],
    concept: conceptFrom([squaresTableStep, braceSliderStep, specialTableStep, converseStep7]),
    transfer: oneOf([tvStep, diamondStep, ropeStep]),
    practice: (rng) => hypStep(rng).question,
  },
  {
    key: K8, title: 'Polygons & Area', wing: 'plaza', wingName: 'Tile Market',
    goal: 'Find interior and exterior angle sums of polygons, and the perimeter and area of triangles, trapezoids and composite shapes.',
    misconception: 'Using n × 180° for the angle sum; using the slanted side as a triangle\'s height; thinking a notch cut from a corner shortens the perimeter.',
    teach: [
      { title: 'Fan it into triangles', text: 'From one corner, diagonals cut an n-sided polygon into n − 2 triangles. Each holds 180°, so the interior angles add to (n − 2) × 180°.', steps: ['A hexagon has 6 sides. The two sides at the starting corner make no triangle of their own: 6 (sides) − 2 (sides at that corner) = 4 (triangles).', '4 (triangles) × 180 (degrees per triangle) = 720° (angle sum), the sum of its interior angles.', 'Regular hexagon: each angle is 720 (angle sum) ÷ 6 (equal angles) = 120° (each angle).'], next: 'How many triangles does the fan cut an octagon into, and what do its angles add to?', visual: ngon(6, true) },
      { title: 'One lap is 360°', text: 'Walk around any polygon: at each corner you turn through the exterior angle, and one lap turns you exactly 360°. A regular n-gon turns 360° ÷ n at each corner.', steps: ['A regular pentagon turns 360 (one lap) ÷ 5 (corners) = 72° (turn at each corner).', 'Interior angle: 180 (straight line) − 72 (turn) = 108° (interior angle).', 'Check with the fan: 5 (sides) − 2 = 3 (triangles), 3 × 180 = 540° (angle sum), and 540 (angle sum) ÷ 5 (corners) = 108° (each angle).'], next: 'A regular polygon turns 40° at each corner. How many sides does it have?', visual: ngon(5) },
      { title: 'Height is perpendicular', text: 'Area of a triangle is ½ × base × height, and the height meets the base at a right angle, never along a slanted side. Composite shapes: split into pieces, find each area, add (or subtract a hole). Perimeter is different: walk the outside edge and add only the lengths your feet touch.', steps: ['Base 8. The height is the dashed 4, which meets the base at 90°.', 'Why ½: the triangle is half of an 8 by 4 rectangle. ½ × 8 (base) × 4 (height) = 16 (area in square units).', 'Square units because length × length counts unit squares.', 'Not the slanted side: ½ × 8 (base) × 5 (slanted side) = 20 (wrong area) is too big.'], next: 'Keep the base at 8 but raise the height to 6. What is the area now?', visual: geo([{ t: 'poly', pts: [[0, 0], [8, 0], [3, 4]], labels: ['8', '', '5'] }, { t: 'seg', a: [3, 4], b: [3, 0], dashed: true, label: '4' }, { t: 'arc', at: [3, 0], from: [8, 0], to: [3, 4], right: true }], 300, 190) },
    ],
    quests: [
      { id: 'aq.geo.polygons.tiles', name: 'Tile Market', giver: 'vector', guided: true,
        hook: 'Vector: "The tile-cutters need angles for every polygon in the market. Fan them into triangles and the angles follow."',
        change: 'Polygon tiles fill the market stalls.',
        waves: [wave('Angle sums', mixOf([sumTableStep, interiorSumStep, interiorSumStep])), wave('Regular corners', mixOf([regularDialStep, regularDialStep, findNStep])), wave('The last angle', mixOf([missingPolyAngleStep, regularDialStep]))] },
      { id: 'aq.geo.polygons.paving', name: 'Paving the Plaza', giver: 'brick',
        hook: 'Brick: "Stone is paid by area and edging by length. Get the heights right, and no slanted sides."',
        change: 'The plaza is paved and edged.',
        waves: [wave('Triangles and trapezoids', mixOf([triangleAreaStep, trapezoidStep, trapBalanceStep])), wave('Composite shapes', mixOf([compositeTableStep, lShapeStep, lShapeStep])), wave('Area in x', mixOf([trapBalanceStep, compositeTableStep, triangleAreaStep]))] },
    ],
    concept: conceptFrom([sumTableStep, regularDialStep, compositeTableStep, trapBalanceStep]),
    transfer: oneOf([tileStep, gridAreaStep]),
    practice: (rng) => findNStep(rng).question,
  },
  {
    key: K9, title: 'Circles', wing: 'plaza', wingName: 'Circle Plaza',
    goal: 'Find circumference, area, arc length and sector area, the perimeter and area of shapes built from circles, and use central and inscribed angles.',
    misconception: 'Using the diameter in πr²; thinking an inscribed angle equals its arc (it is half); mixing up 2πr and πr².',
    teach: [
      { title: 'π diameters around', text: 'Roll any wheel one turn and it travels a little more than 3 of its diameters: C = πd = 2πr. Area packs the disc into a near-rectangle r by πr: A = πr².', visual: { type: 'circle', r: 3, unit: 'm', show: 'r', wheel: true } },
      { title: 'Arcs are fractions', text: 'A central angle of θ cuts off θ/360 of the circle. Arc length = θ/360 × 2πr and sector area = θ/360 × πr².', steps: ['90 (central angle) ÷ 360 (full turn) = 1/4 (of the circle).', 'Arc: ¼ × 2π × 4 (radius) = 2π ≈ 6.28 (arc length).', 'Sector: ¼ × π × 4² = 4π ≈ 12.57 (sector area, in square units).'], next: 'Open the angle to 180° with the same radius 4. What is the arc length?', visual: sectorFig(90, 4, '') },
      { title: 'Inscribed angles are half', text: 'The central angle at O equals its arc. Why is an inscribed angle half? Draw the diameter from P through O. OP = OA (radii), so triangle OPA is isosceles with two equal angles x, and the exterior angle at O is x + x = 2x. So the central angle is twice the inscribed one. A diameter cuts a 180° arc, so any angle in a semicircle is 90°.', steps: ['Here the inscribed angle at P is 30°: 2 × 30 (inscribed angle) = 60° (central angle at O).', 'Check in triangle OPA: ∠POA = 180 (angle sum) − 30 (angle at P) − 30 (angle at A) = 120° (angle POA).', 'Then 180 (straight line) − 120 (angle POA) = 60° (outside angle at O).', 'Semicircle: the arc is 180°, so the inscribed angle is 180 (semicircle arc) ÷ 2 = 90° (inscribed angle).'], next: 'A central angle is 110°. What is an inscribed angle on the same arc?', visual: (() => { const O: P2 = [0, 0]; const P = at(O, 110, 3); const Qd = at(O, 290, 3); const A = at(O, 230, 3); return geo([{ t: 'circle', c: O, r: 3 }, { t: 'seg', a: P, b: Qd }, { t: 'seg', a: P, b: A }, { t: 'seg', a: O, b: A }, { t: 'tick', a: O, b: P }, { t: 'tick', a: O, b: A }, { t: 'arc', at: P, from: A, to: Qd, label: 'x' }, { t: 'arc', at: A, from: O, to: P, label: 'x' }, { t: 'arc', at: O, from: A, to: Qd, label: '2x' }, { t: 'pt', p: P, label: 'P' }, { t: 'pt', p: A, label: 'A' }, { t: 'pt', p: O, label: 'O' }], 240, 240); })() },
    ],
    quests: [
      { id: 'aq.geo.circles.plaza', name: 'Circle Plaza', giver: 'volt', guided: true,
        hook: 'Volt: "The plaza fountain is a ring of lamps. Tell me how much cable goes round and how much glass covers it."',
        change: 'A ring of lamps lights the Circle Plaza.',
        waves: [wave('Round the rim', mixOf([wheelSliderStep, circumferenceStep, circumferenceStep])), wave('Cover the disc', mixOf([circleAreaStep, circleAreaStep, piCoefStep])), wave('Paving angles', mixOf([inscribedDialStep, inscribedDialStep, semicircleStep]))] },
      { id: 'aq.geo.circles.gears', name: 'Gear Arcs', giver: 'newton',
        hook: 'Newton: "Gates swing in arcs and sprinklers water sectors. And the paving hides inscribed angles: read them."',
        change: 'The plaza gates swing on true arcs.',
        waves: [wave('Arcs and sectors', mixOf([arcLengthStep, sectorAreaStep, arcLengthStep])), wave('Inscribed angles', mixOf([inscribedDialStep, inscribedDialStep, semicircleStep])), wave('Tracks and wheels', mixOf([trackStep, wheelSliderStep, circleAreaStep]))] },
    ],
    concept: conceptFrom([inscribedDialStep, wheelSliderStep, arcLengthStep, circleAreaStep]),
    transfer: oneOf([pipeStep, ropeRiseStep, trackStep]),
    practice: (rng) => piCoefStep(rng).question,
  },
  {
    key: K10, title: 'Surface Area & Volume', wing: 'towers', wingName: 'Polyhedron Towers',
    goal: 'Find the volume of prisms, cylinders, pyramids, cones and spheres; unfold nets to find the surface area of boxes, cylinders, pyramids, cones and spheres; picture cross-sections; and see how volume scales.',
    misconception: 'Forgetting the ⅓ for cones and pyramids; using the vertical height where the slant height belongs; mixing up surface area (square units) and volume (cubic units); thinking doubling every edge doubles the volume.',
    teach: [
      { title: 'Base area × height', text: 'Any prism or cylinder is a stack of identical layers: V = base area × height. A box is l × w × h; a cylinder is πr² × h.', steps: ['Base: 4 (length in m) × 3 (width in m) = 12 (base area in m²), one layer.', 'Stack it 2 m high: 12 (base area in m²) × 2 (height in m) = 24 (volume in m³).', 'Cylinder, radius 2 and height 5: π × 2² × 5 = 20π ≈ 62.8 (volume in m³).'], next: 'Raise the box to 5 m tall. What is its volume?', visual: { type: 'box', l: 4, w: 3, h: 2, unit: 'm' } },
      { title: 'Points take a third', text: 'A cone or pyramid tapers to a point. Three of them exactly fill the prism or cylinder with the same base and height, so V = ⅓ × base area × height.', steps: ['Cylinder, radius 3 and height 4: π × 3² × 4 = 36π ≈ 113.1 (cylinder volume).', 'Cone with the same base and height: ⅓ × 36π = 12π ≈ 37.7 (cone volume).', 'Square pyramid, base 6 by 6 and height 5: ⅓ × 36 (base area) × 5 (height) = 60 (pyramid volume).'], next: 'A cone holds 10 litres. How much does the cylinder with the same base and height hold?', visual: coneFig('r', 'h') },
      { title: 'Unfold the surface', text: 'Surface area is the paint on the outside: unfold the solid into its net and add the faces. A cylinder unrolls into two circles and a 2πr × h rectangle. A pyramid\'s triangles use the slant height ℓ up each face, not the vertical height. Archimedes: a sphere fills ⅔ of the cylinder that just holds it, so V = 4/3 πr³, and its surface equals that cylinder\'s label, 2πr × 2r = 4πr².', steps: ['The box net has three pairs of faces: 4 × 3 = 12 (top face), 4 × 2 = 8 (front face) and 3 × 2 = 6 (side face).', 'Surface: 2 (faces per pair) × (12 + 8 + 6) = 52 (surface in square units).', 'Cylinder, radius 2 and height 5: 2 (ends) × π × 2² + 2π × 2 × 5 = 8π + 20π = 28π ≈ 88.0 (surface area).'], next: 'Leave off one 4 by 3 face as an open top. How much surface is left to paint?', visual: boxNetFig(4, 3, 2) },
    ],
    quests: [
      { id: 'aq.geo.solids.towers', name: 'Polyhedron Towers', giver: 'catalyst', guided: true,
        hook: 'Dr. Catalyst: "Each tower is a storage tank of a different shape. I need volumes before the reagents arrive."',
        change: 'The tower tanks fill and glow.',
        waves: [wave('Stack the layers', mixOf([boxVolumeStep, depthSliderStep, cylinderStep])), wave('Points take a third', mixOf([coneCylTableStep, coneStep, pyramidStep])), wave('Spheres and tanks', mixOf([sphereStep, depthSliderStep, sphereStep]))] },
      { id: 'aq.geo.solids.crates', name: 'Crates & Paint', giver: 'brick',
        hook: 'Brick: "Crates need paint on the outside and space on the inside. Don\'t mix them up, and watch what happens when we scale."',
        change: 'Painted crates line the tower stores.',
        waves: [wave('Unfold the crate', mixOf([surfaceTableStep, netStep, cylinderSurfaceStep])), wave('Slant faces', mixOf([pyramidSurfaceStep, coneSurfaceStep, scaleVolStep])), wave('Slice and scale', mixOf([crossSectionStep, sphereStep, coneCylTableStep, depthSliderStep]))] },
    ],
    concept: conceptFrom([coneCylTableStep, surfaceTableStep, depthSliderStep, scaleVolStep, cylinderSurfaceStep, netStep]),
    transfer: oneOf([siloStep, recastStep]),
    practice: (rng) => boxVolumeStep(rng).question,
  },
  {
    key: K11, title: 'Transformations', wing: 'mirror', wingName: 'Hall of Mirrors',
    goal: 'Translate, reflect, rotate and dilate points and shapes on the coordinate plane, and name the rule for a move.',
    misconception: 'Reflecting over the x-axis by changing x; mixing up the 90° rotation rules; adding the scale factor in a dilation instead of multiplying.',
    teach: [
      { title: 'Slide and flip', text: 'A translation slides every point the same way: (x, y) → (x + a, y + b). A reflection flips across a mirror line: over the x-axis y changes sign, over the y-axis x changes sign, over y = x the coordinates swap.', steps: ['Over the x-axis y changes sign: 2 (y of P) × −1 (sign flip) = −2 (new y), so P(3, 2) lands on P′(3, −2).', 'Each is 2 (units) away from the mirror, on opposite sides.', 'Slide P by (−5, +1): x = 3 (x of P) − 5 (slide left) = −2 (new x), y = 2 (y of P) + 1 (slide up) = 3 (new y).', 'Over y = x the coordinates swap: P(3, 2) → (2, 3).'], next: 'Reflect P(3, 2) over the y-axis. Where does it land?', visual: plotV(R6, { hlines: [{ y: 0, label: 'mirror' }], points: [{ x: 3, y: 2, label: 'P(3, 2)' }, { x: 3, y: -2, label: 'P′(3, −2)', color: 'ask' }] }) },
      { title: 'Turn about the origin', text: 'Rotating 90° counterclockwise sends (x, y) to (−y, x); 180° sends it to (−x, −y). Picture the segment from the origin to P as a rigid arm and turn it.', steps: ['180°: both signs flip, so P(4, 1) → (−4, −1).', 'The arm keeps its length: √(4² + 1²) = √17 (arm before) and √((−4)² + (−1)²) = √17 (arm after).', '90° counterclockwise on another point: Q(3, 2) → (−2, 3). Check: √(3² + 2²) = √13 (arm length) = √((−2)² + 3²).'], next: 'Turn P(4, 1) 90° counterclockwise on the grid. Where does it land?', model: { kind: 'plot', range: R6, count: 1, label: 'Try it: turn P(4, 1) 90° counterclockwise', layers: { points: [{ x: 4, y: 1, label: 'P' }], segments: [{ a: [0, 0], b: [4, 1], dashed: true, color: 'muted' }] } } },
      { title: 'Rigid moves and dilations', text: 'Slides, flips and turns keep lengths and angles, so the image is congruent. A dilation by k multiplies every coordinate by k: lengths scale by k, angles stay the same, and the image is similar.', steps: ['Dilate by 2 (scale factor) from the origin: (1, 1) → (2 × 1, 2 × 1) = (2, 2).', 'Likewise (2, 1) → (4, 2) and (1, 2) → (2, 4).', 'The bottom leg was 2 (right end x) − 1 (left end x) = 1 (leg length); its image is 4 − 2 = 2 (image length): lengths double.', 'The right angle stays 90°, so the image is similar, not congruent.'], next: 'Dilate the small triangle by 3. Where does (2, 1) go?', visual: plotV(R6, { segments: [{ a: [1, 1], b: [2, 1] }, { a: [2, 1], b: [1, 2] }, { a: [1, 2], b: [1, 1] }, { a: [2, 2], b: [4, 2], color: 'orange' }, { a: [4, 2], b: [2, 4], color: 'orange' }, { a: [2, 4], b: [2, 2], color: 'orange' }] }) },
    ],
    quests: [
      { id: 'aq.geo.transform.mirrors', name: 'Hall of Mirrors', giver: 'volt', guided: true,
        hook: 'Volt: "The laser show runs on coordinates. Slide, flip and turn the beams and the hall lights up."',
        change: 'Laser beams criss-cross the Hall of Mirrors.',
        waves: [wave('Slide', mixOf([translateStep, segmentMoveStep, translateStep])), wave('Flip', mixOf([reflectStep, reflectStep, pickImageStep])), wave('Turn', mixOf([rotateStep, rotateStep]))] },
      { id: 'aq.geo.transform.drone', name: 'Drone Moves', giver: 'newton',
        hook: 'Newton: "The survey drone logged where it started and where it ended. Name its moves, then scale the flight plan."',
        change: 'The drone flight plan is filed in the Hall.',
        waves: [wave('Name the rule', mixOf([ruleStep, ruleStep, pickImageStep])), wave('Scale it', mixOf([dilateStep, dilateStep, dilationFactStep])), wave('Mixed moves', mixOf([rotateStep, reflectStep, spriteTableStep]))] },
    ],
    concept: conceptFrom([reflectStep, rotateStep, dilateStep, spriteTableStep]),
    transfer: oneOf([symmetryStep, compositionStep]),
    practice: (rng) => { const [x, y] = latticeP(rng); const m = pick(rng, ['x', 'y'] as Mirror[]); const [u, v] = reflectPt(m, x, y); return Q(K11, 'reflect', { prompt: `Reflect P${pt(x, y)} over ${MIRROR_NAME[m]}. What is the ${m === 'x' ? 'y' : 'x'}-coordinate of P′?`, expression: `P${pt(x, y)} → P′`, answer: m === 'x' ? v : u, negative: (m === 'x' ? v : u) < 0, hint: `Over ${MIRROR_NAME[m]}, one coordinate keeps its value and the other changes sign.`, steps: [`P′ = ${pt(u, v)}.`] }); },
  },
  {
    key: K12, title: 'Coordinate Geometry', wing: 'mirror', wingName: 'Map Room',
    goal: 'Find midpoints, missing endpoints and distances on the grid, and use slopes to build and test parallel and perpendicular lines.',
    misconception: 'Taking a perpendicular slope as just the negative (or just the reciprocal); adding the legs instead of using the distance formula; midpoint as half the difference.',
    teach: [
      { title: 'Midpoint = average', text: 'The midpoint of AB is halfway in x and halfway in y: average the x-coordinates and average the y-coordinates.', steps: ['Example: C(−2, 0) and D(4, 6).', 'x: (−2 (x of C) + 4 (x of D)) ÷ 2 (ends) = 1 (x of M).', 'y: (0 (y of C) + 6 (y of D)) ÷ 2 (ends) = 3 (y of M).', 'M = (1, 3): 3 right and 3 up from C, then 3 right and 3 up again to D.'], next: 'Find the midpoint of A(−4, 1) and B(2, 5) on the grid.', model: { kind: 'plot', range: R6, count: 1, label: 'Try it: the midpoint of (−4, 1) and (2, 5)', layers: { points: [{ x: -4, y: 1, label: 'A' }, { x: 2, y: 5, label: 'B' }], segments: [{ a: [-4, 1], b: [2, 5], dashed: true, color: 'muted' }] } } },
      { title: 'Distance is Pythagoras', text: 'Draw the right triangle under AB. Its legs are the change in x and the change in y, so AB = √((x₂ − x₁)² + (y₂ − y₁)²). Here the legs are 6 (change in x) and 8 (change in y): √(6² + 8²) = √100 = 10 (length of AB).', visual: plotV(R6, { segments: [{ a: [-3, -2], b: [3, 6], label: '10' }, { a: [-3, -2], b: [3, -2], dashed: true, color: 'muted', label: '6' }, { a: [3, -2], b: [3, 6], dashed: true, color: 'muted', label: '8' }], points: [{ x: -3, y: -2, label: 'A' }, { x: 3, y: 6, label: 'B' }] }) },
      { title: 'Parallel and perpendicular slopes', text: 'Parallel lines have equal slopes. Perpendicular slopes are negative reciprocals: turning a rise-over-run triangle a quarter turn swaps rise and run and flips one sign, so 2/3 becomes −3/2.', steps: ['Rise 2 over run 3: 2 (rise) ÷ 3 (run) = 2/3 (slope).', 'Quarter turn: rise and run swap and one sign flips, so −3 (new rise) ÷ 2 (new run) = −3/2 (perpendicular slope).', 'Check: perpendicular slopes multiply to −1: 2/3 (slope) × −3/2 (perpendicular slope) = −1.', 'A line parallel to m = 2/3 also rises 2 for every 3 across.'], next: 'What slope is perpendicular to m = 4?', visual: plotV(R6, { fns: [{ fn: { kind: 'poly', c: [0, 2 / 3] }, label: 'm = 2/3' }, { fn: { kind: 'poly', c: [0, -1.5] }, label: 'm = −3/2' }] }) },
    ],
    quests: [
      { id: 'aq.geo.coordinate.maproom', name: 'The Map Room', giver: 'ada', guided: true,
        hook: 'Ada: "The kingdom map is a grid. Centre the supports, measure the cables, and plot the missing ends."',
        change: 'The Map Room grid lights with every survey mark.',
        waves: [wave('Midpoints', mixOf([midpointStep, midpointStep, endpointStep])), wave('Distances', mixOf([cornerStep, distanceStep, distanceStep])), wave('Slopes', mixOf([slopeStep, perpSlopeStep]))] },
      { id: 'aq.geo.coordinate.rails', name: 'Rails and Braces', giver: 'brick',
        hook: 'Brick: "New rails must run parallel to the old ones, and braces must hit square. Plot them from the slopes."',
        change: 'Parallel rails and square braces cross the map.',
        waves: [wave('Parallel rails', mixOf([parallelLineStep, parallelLineStep, classifyLinesStep])), wave('Square braces', mixOf([perpSlopeStep, perpLineStep, perpLineStep])), wave('Survey check', mixOf([classifyLinesStep, endpointStep, distanceStep]))] },
    ],
    concept: conceptFrom([midpointStep, cornerStep, perpLineStep, parallelLineStep]),
    transfer: oneOf([roadsStep, meetStep]),
    practice: (rng) => slopeStep(rng).question,
  },
  {
    key: 'trial', title: 'Mastery Trial', wing: 'crown', wingName: 'The Geometry Core',
    goal: 'Prove durable mastery across the whole academy: angles, proof, similarity, right triangles, measurement and the coordinate plane. Seat the Geometry Core.',
    misconception: 'Treating each chapter as a separate trick instead of one connected toolkit: the angle sum, similarity and Pythagoras run through everything.',
    teach: [
      { title: 'Trial rules', text: 'Five phases across the whole academy, one helper you may use once. Pass at 80% or better. Every chapter must already be mastered.', visual: card('The Mastery Trial', ['Lines & angles · Triangles & proof', 'Measure · The plane', 'Transfer']) },
    ],
    quests: [
      { id: 'aq.geo.trial.rehearsal', name: 'Trial Rehearsal', giver: 'vector', guided: true,
        hook: 'Vector: "Before the Core, a short rehearsal from every corner of the kingdom. No stakes."',
        change: 'The Geometry Core vault unbars.',
        waves: [wave('Lines & angles', mixOf([segAlgebraStep, transAngleStep, missingAngleDialStep, verticalAlgebraStep])), wave('Triangles & proof', mixOf([reasonStep, similarTableStep, hypStep])), wave('Measure & the plane', mixOf([inscribedDialStep, reflectStep, midpointStep]))] },
      { id: 'aq.geo.trial.keeper', name: 'The Core Keeper', giver: 'brick',
        hook: 'Brick: "The Keeper asks anything from anywhere in the kingdom. Build like you own it."',
        change: 'The Keeper steps aside.',
        waves: [wave('Anything', mixOf([criterionStep, special3060Step, lShapeStep, coneStep])), wave('Anywhere', mixOf([rotateStep, perpLineStep, regularDialStep, eratosthenesStep]))] },
    ],
    concept: conceptFrom([railTableStep, squaresTableStep, compositeTableStep, rotateStep]),
    transfer: oneOf([robotTurnStep, pinholeStep, ropeRiseStep, recastStep, meetStep]),
    practice: (rng) => hypStep(rng).question,
  },
];

export const GEOMETRY = defineAcademy({
  id: 'geometry',
  name: 'Geometry Academy',
  short: 'Geometry',
  tier: 'High School',
  blurb: 'Points, lines, angles, triangles, proofs, circles, area and volume.',
  icon: 'anvil',
  home: 'geometry-kingdom',
  wings: {
    gate: { name: 'Straightedge Gate', icon: 'unlock' },
    bridges: { name: 'Truss Bridges', icon: 'bridge' },
    keep: { name: 'Tetrahedron Keep', icon: 'shield' },
    plaza: { name: 'Circle Plaza', icon: 'compass' },
    towers: { name: 'Polyhedron Towers', icon: 'factory' },
    mirror: { name: 'Mirror Hall', icon: 'map' },
    crown: { name: 'The Geometry Core', icon: 'trophy' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'Lines & angles', items: [angleMeasureStep(rng), segAlgebraStep(rng), verticalStep(rng), transAngleStep(rng), converseStep(rng), missingAngleDialStep(rng), exteriorStep(rng)] },
    { name: 'Triangles & proof', items: [criterionStep(rng), reasonStep(rng), cpctcAngleStep(rng), similarTableStep(rng), shadowStep(rng), hypStep(rng), special45Step(rng), converseStep7(rng)] },
    { name: 'Measure', items: [regularDialStep(rng), compositeTableStep(rng), circleAreaStep(rng), inscribedDialStep(rng), coneStep(rng), surfaceTableStep(rng)] },
    { name: 'The plane', items: [reflectStep(rng), rotateStep(rng), midpointStep(rng), perpLineStep(rng)] },
    { name: 'Transfer', items: [oneOf([eratosthenesStep, robotTurnStep, riverStep])(rng), oneOf([pinholeStep, ropeRiseStep, recastStep, meetStep])(rng)] },
  ],
  trialIntro: 'The Mastery Trial. Five phases across the whole kingdom, one helper, 80% to pass. The Geometry Core is waiting to be seated.',
  coreName: 'The Geometry Core',
  coreLine: 'Points to polyhedra, proof to the plane. The Geometry Core locks into the Engine, the towers of the kingdom light from keep to plaza, and the road to Algebra 2 opens.',
  coreColor: '#f59e0b',
  title: 'Master Builder',
});
