import type { Difficulty, Question, QuestionChoice, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { contestQuestion, choicesFrom, gradeOf, type ContestGameMeta, type ContestKind, type GradeId, type KindGrades } from '../contest/common';
import type { ColorName, PatternCell, ShapeName } from '../contest/visuals';
import { lab, labn, unit } from '../label';

/**
 * Pattern Lab (Contest Path): repeating trains, growing figures, number patterns, function machines and far terms.
 * Difficulty 1–2 = Grade 1, 3–4 = Grade 3, 5–6 = Grade 5 (see contest/common.ts). Every question is original.
 *
 *  shapes  (G1, G3) repeating trains of coloured shapes: what comes next, what is missing, the 12th shape
 *  grow    (G1, G3, G5) growing figures of unit squares: the next step, step 5 or 6, step 10 or 20, which step has N
 *  number  (G1, G3, G5) count on, jumps, doubling, jumps that take turns or grow, squares, triangles, add the two before
 *  machine (G3, G5) in → rule → out: use the rule, work backwards, find a hidden rule from the table
 *  term    (G5) jump far ahead: the nth number, the shape in place 47, which place a number is in, how many in the first N
 */
export type PatternKind = 'all' | "shapes" | "grow" | "number" | "machine" | "term";

export const PATTERN_META: ContestGameMeta = {
  id: "pattern", label: "Pattern Lab", icon: "target", topic: "Patterns", skill: "pattern",
  blurb: "What comes next? Shape and colour trains, growing figures, number patterns, function machines and the 10th term.",
  intro: "A pattern is something that repeats or grows by a rule. Find the part that repeats, or the jump from one step to the next, and you can say what comes next. To jump far ahead, count the jumps (the 10th number is 9 jumps after the 1st) or find your place in the repeat. A function machine does the same thing to every number that goes in, so you can run it forwards, or backwards to find what went in.",
  tree: { x: 5, y: 1 }, prereq: { skillId: "add.basic", mastery: 0 },
};

export const PATTERN_KINDS: ContestKind[] = [
  { id: 'all', label: 'Mixed', short: 'Mixed', desc: "What comes next? Shape and colour trains, growing figures, number patterns, function machines and the 10th term." },
  { id: "shapes", label: "Shape and colour trains", short: "Trains", desc: "Find the part that repeats, then say what comes next or what is missing." },
  { id: "grow", label: "Growing figures", short: "Growing", desc: "Count what each step adds, then build the next step (or step 10)." },
  { id: "number", label: "Number patterns", short: "Numbers", desc: "Find the jump between numbers: +2, +3, double, or two jumps taking turns." },
  { id: "machine", label: "Function machines", short: "Machines", desc: "In → rule → out. Find the rule from the table, then use it." },
  { id: "term", label: "The 10th term", short: "Far terms", desc: "Jump to a far term without listing them all: first + jumps × size, or the place in the repeat." },
];
/** Which grades each kind suits. */
export const PATTERN_KIND_GRADES: KindGrades = { shapes: ["g1", "g3"], grow: ["g1", "g3", "g5"], number: ["g1", "g3", "g5"], machine: ["g3", "g5"], term: ["g5"] };

type K = Exclude<PatternKind, 'all'>;
type Cell = PatternCell;
type Sq = [number, number];

const APP = 'Engineers spot patterns to predict what a machine, a structure or a set of readings will do next.';
const BANDS: Record<GradeId, [Difficulty, Difficulty]> = { g1: [1, 2], g3: [3, 4], g5: [5, 6] };
const NEAREST: Record<GradeId, GradeId[]> = { g1: ['g1', 'g3', 'g5'], g3: ['g3', 'g1', 'g5'], g5: ['g5', 'g3', 'g1'] };
/** The difficulty a kind is played at: d itself when the kind suits that grade, else the same spot in the nearest band it suits. */
export function patternDifficulty(kind: K, d: Difficulty): Difficulty {
  const ok = PATTERN_KIND_GRADES[kind]; const g = NEAREST[gradeOf(d)].find((x) => ok.includes(x)) ?? 'g3';
  return g === gradeOf(d) ? d : BANDS[g][(d - 1) % 2];
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

export const ordinal = (n: number) => { const t = n % 100; const s = t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'; return `${n}${s}`; };
const DIR: Record<number, string> = { 0: 'up', 90: 'right', 180: 'down', 270: 'left' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const list = (xs: (string | number)[]) => xs.join(', ');
const listAnd = (xs: (string | number)[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
/** A signed jump; a no-break space keeps the sign on the same line as its number. */
const signed = (v: number) => (v < 0 ? `−\u00a0${-v}` : `+\u00a0${v}`);
/** "red circle", "big blue star", "green triangle pointing right", or the number. */
export function cellName(c: Cell): string {
  if (c.num !== undefined && !c.shape) return String(c.num);
  const words = [c.size === 'l' ? 'big' : c.size === 's' ? 'small' : '', c.color ?? '', c.shape ?? ''].filter(Boolean).join(' ');
  return c.rot !== undefined ? `${words} pointing ${DIR[c.rot]}` : words;
}
const same = (a: Cell, b: Cell) => a.shape === b.shape && a.color === b.color && a.num === b.num && (a.rot ?? 0) === (b.rot ?? 0) && (a.size ?? 'm') === (b.size ?? 'm');

/** Picture choices: the right cell and distinct wrong cells (in priority order), shuffled, valued 1..n. */
function cellChoices(rng: Rng, right: Cell, wrong: Cell[], n: number): { choices: QuestionChoice[]; answer: number } {
  const opts: Cell[] = [right];
  for (const c of wrong) if (opts.length < n && !opts.some((o) => same(o, c))) opts.push(c);
  const order = rng.shuffle(opts);
  return { choices: order.map((c, i) => ({ value: i + 1, label: cap(cellName(c)), visual: { type: 'pattern', cells: [c] } })), answer: order.findIndex((c) => same(c, right)) + 1 };
}
/** Number choices: the answer plus real-mistake distractors (in priority order), topped up with near misses, shuffled. */
function numChoices(rng: Rng, answer: number, wrong: number[], n: number, max = Infinity, min = 0): QuestionChoice[] {
  const vals = [answer];
  const ok = (v: number) => Number.isInteger(v) && v >= min && v <= max && !vals.includes(v);
  for (const v of wrong) if (vals.length < n && ok(v)) vals.push(v);
  for (let k = 1; vals.length < n && k < 60; k++) for (const v of [answer + k, answer - k]) if (vals.length < n && ok(v)) vals.push(v);
  return choicesFrom(rng.shuffle(vals));
}

interface Q { prompt: string; expression: string; answer: number; hint: string; steps: string[]; visual: Visual; solution?: Visual; choices?: QuestionChoice[]; read?: string }
function make(k: K, d: Difficulty, sid: string, q: Q): Question {
  return contestQuestion('pattern', PATTERN_META.topic, sid, PATTERN_KINDS.find((x) => x.id === k)!.label, {
    prompt: q.prompt, expression: q.expression, answer: q.answer, difficulty: d, hint: q.hint, steps: q.steps, visual: q.visual,
    solutionVisual: q.solution, choices: q.choices, readAloud: q.read, app: APP,
  });
}

/* ------------------------------------------------------------------ */
/* shapes: repeating trains                                            */
/* ------------------------------------------------------------------ */

const G1_SHAPES: ShapeName[] = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
const G1_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green'];
const G3_SHAPES: ShapeName[] = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'hexagon', 'moon'];
const G3_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
const TURNS_CW: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
/**
 * Shuffled Grade 3 colours where blue and purple are never both among the first five. The two have almost the same
 * lightness, so a colour-blind child could not tell them apart in a colour repeat or between two choices.
 */
export const COLOR_TWINS: [ColorName, ColorName][] = [['blue', 'purple']];
function g3Colors(rng: Rng): ColorName[] {
  let cs = rng.shuffle(G3_COLORS);
  for (const [a, b] of COLOR_TWINS) { const late = Math.max(cs.indexOf(a), cs.indexOf(b)); cs = [...cs.slice(0, late), ...cs.slice(late + 1), cs[late]]; }
  return cs;
}

/** Grade 1: AB, ABC, AAB, ABB with one attribute changing; "which comes next?" or "which is missing?". */
function shapesG1(d: Difficulty, rng: Rng, sid: string): Question {
  const core = rng.pick(d === 1 ? ['AB', 'AB', 'ABC'] : ['AB', 'ABC', 'AAB', 'ABB']);
  const len = core.length; const kinds = new Set(core).size;
  const byShape = rng.chance(0.5);
  const shapes = rng.shuffle(G1_SHAPES); const colors = rng.shuffle(G1_COLORS);
  const val = (i: number): Cell => (byShape ? { shape: shapes[i], color: colors[0] } : { shape: shapes[0], color: colors[i] });
  const word = (i: number) => (byShape ? shapes[i] : colors[i]);
  const at = (i: number) => core.charCodeAt(i % len) - 65;
  const missing = d === 2 && rng.chance(0.5);
  const total = missing ? rng.int(2 * len + 1, Math.min(9, 3 * len + 1)) : rng.int(Math.max(4, 2 * len), Math.max(2 * len, Math.min(8, 3 * len))) + 1;
  const ask = missing ? rng.int(len, total - 2) : total - 1;
  const right = val(at(ask));
  const cells: (Cell | null)[] = range(total).map((i) => (i === ask ? null : val(at(i))));
  const wrong = [...range(kinds).filter((i) => i !== at(ask)).map(val), val(kinds)];
  const { choices, answer } = cellChoices(rng, right, wrong, d === 1 ? 3 : Math.min(4, kinds + 1));
  const what = byShape ? 'shape' : 'colour';
  const coreWords = list(range(len).map((i) => word(at(i))));
  const ctx = range(len - 1).map((j) => word(at(ask - len + 1 + j)));
  const steps = [
    `The ${what}s repeat: ${coreWords}.`,
    `The repeat has ${labn(len, 'shape')}, then it starts again.`,
    missing ? `Say the repeat along the train. At the box you say "${word(at(ask))}".` : `After ${ctx.length > 1 ? `"${list(ctx)}"` : ctx[0]} comes ${word(at(ask))}.`,
    `So the ${missing ? 'missing' : 'next'} one is the ${cellName(right)}.`,
  ];
  return make('shapes', d, sid, {
    prompt: missing ? `Which ${what} is missing? Tap it.` : `Which ${what} comes next? Tap it.`,
    expression: missing ? 'missing = ?' : 'next = ?', answer, choices,
    hint: `Say the ${what}s out loud. Find the part that repeats.`, steps,
    visual: { type: 'pattern', cells }, solution: { type: 'pattern', cells: cells.map((c) => c ?? right) },
    read: byShape
      ? (missing ? 'Look at the train of shapes. One is missing. Which shape goes in the box?' : 'Look at the train of shapes. Which shape comes next?')
      : (missing ? 'Look at the colours. One is missing. Which colour goes in the box?' : 'Look at the colours. Which colour comes next?'),
  });
}

/** Grade 3: ABCD cores, turned shapes, two attributes on different cycles, and "the 12th shape". */
function shapesG3(d: Difficulty, rng: Rng, sid: string): Question {
  const mode = rng.pick(d === 3 ? ['abcd', 'abcd', 'turn', 'nth'] as const : ['two', 'two', 'turncolor', 'nth'] as const);
  const shapes = rng.shuffle(G3_SHAPES); const colors = g3Colors(rng);
  if (mode === 'nth') {
    const len = rng.int(3, 4); const together = rng.chance(0.6);
    const core: Cell[] = range(len).map((i) => ({ shape: shapes[i], color: together ? colors[i] : colors[0] }));
    // One full repeat and a bit more (6 places), so the train and its place captions stay large on a phone.
    const shown = 6; const n = rng.int(shown + 4, 20);
    const right = core[(n - 1) % len];
    const cells: (Cell | null)[] = [...range(shown).map((i) => core[i % len]), {}, null];
    const under = [...range(shown).map((i) => ordinal(i + 1)), '', ordinal(n)];
    const { choices, answer } = cellChoices(rng, right, core.filter((c) => !same(c, right)), len);
    const starts = range(20).map((i) => 1 + i * len).filter((p) => p <= n);
    const last = starts[starts.length - 1];
    const steps = [
      `The repeat has ${labn(len, 'shape')}: ${list(core.map(cellName))}.`,
      `A new repeat starts at the ${listAnd(starts.map(ordinal))} places.`,
      n === last ? `The ${ordinal(n)} place starts a repeat, so it is the ${cellName(right)}.` : `The ${ordinal(last)} place is the ${cellName(core[0])}. Count on ${labn(n - last, 'more place')} in the repeat to the ${ordinal(n)}: the ${cellName(right)}.`,
    ];
    return make('shapes', d, sid, {
      prompt: `The train keeps repeating. What is the ${ordinal(n)} shape? Tap it.`, expression: `${ordinal(n)} shape = ?`, answer, choices,
      hint: 'Find where each new repeat starts, then count on.', steps,
      visual: { type: 'pattern', cells, under }, solution: { type: 'pattern', cells: cells.map((c) => c ?? right), under },
    });
  }
  if (mode === 'turn' || mode === 'turncolor') {
    const cw = rng.chance(0.5); const turns = cw ? TURNS_CW : [0, 270, 180, 90] as (0 | 90 | 180 | 270)[];
    const off = rng.int(0, 3); const q = mode === 'turncolor' ? rng.int(2, 3) : 1;
    const cell = (i: number): Cell => ({ shape: 'triangle', color: colors[i % q], rot: turns[(i + off) % 4] });
    const missing = mode === 'turn' && rng.chance(0.5);
    const total = mode === 'turn' && !missing ? rng.int(6, 8) : 8; const ask = missing ? rng.int(2, total - 2) : total - 1;
    const right = cell(ask);
    const cells: (Cell | null)[] = range(total).map((i) => (i === ask ? null : cell(i)));
    const wrong: Cell[] = [...range(4).map((j) => ({ ...right, rot: turns[(ask + off + 1 + j) % 4] })), ...range(q).map((j) => ({ ...right, color: colors[(ask + 1 + j) % q] }))];
    const order = mode === 'turncolor' ? [wrong[0], wrong[4], wrong[1], wrong[2]] : wrong;
    const { choices, answer } = cellChoices(rng, right, order, 4);
    const dirs = range(4).map((j) => DIR[turns[(off + j) % 4]]);
    const steps = [
      `The tip turns a quarter turn ${cw ? 'clockwise' : 'counterclockwise'} each time: ${list(dirs)}, then ${dirs[0]} again.`,
      missing ? `Before the box the tip points ${DIR[turns[(ask - 1 + off) % 4]]}, so in the box it points ${DIR[right.rot!]}. After the box it points ${DIR[turns[(ask + 1 + off) % 4]]}: that fits.` : `The last triangle points ${DIR[turns[(ask - 1 + off) % 4]]}, so the next one points ${DIR[right.rot!]}.`,
      ...(q > 1 ? [`The colours repeat on their own: ${list(range(q).map((j) => colors[j]))}. That is ${labn(q, 'colour')} in the colour repeat, so the next colour is ${right.color}.`] : []),
      `So the ${missing ? 'missing' : 'next'} one is the ${cellName(right)}.`,
    ];
    return make('shapes', d, sid, {
      prompt: missing ? 'The triangle turns as the train goes. Which triangle is missing? Tap it.' : 'The triangle turns as the train goes. Which triangle comes next? Tap it.',
      expression: missing ? 'missing = ?' : 'next = ?', answer, choices,
      hint: q > 1 ? 'Follow the way the tip points, then follow the colours on their own.' : 'Watch the tip. Which way does it turn each time?', steps,
      visual: { type: 'pattern', cells }, solution: { type: 'pattern', cells: cells.map((c) => c ?? right) },
    });
  }
  if (mode === 'abcd') {
    const together = rng.chance(0.5);
    const core: Cell[] = range(4).map((i) => ({ shape: shapes[i], color: together ? colors[i] : colors[0] }));
    const missing = rng.chance(0.5);
    const total = missing ? rng.int(9, 10) : rng.int(7, 9); const ask = missing ? rng.int(4, total - 2) : total - 1;
    const right = core[ask % 4];
    const cells: (Cell | null)[] = range(total).map((i) => (i === ask ? null : core[i % 4]));
    const { choices, answer } = cellChoices(rng, right, core.filter((c) => !same(c, right)), 4);
    const steps = [
      `The repeat has ${labn(4, 'shape')}: ${list(core.map(cellName))}.`,
      missing ? `Say the repeat along the train. At the box you say "${cellName(right)}".` : `The train ends with ${cellName(core[(ask - 1) % 4])}, and in the repeat the ${cellName(right)} comes after it.`,
      `So the ${missing ? 'missing' : 'next'} one is the ${cellName(right)}.`,
    ];
    return make('shapes', d, sid, {
      prompt: missing ? 'Which shape is missing from the train? Tap it.' : 'Which shape comes next in the train? Tap it.', expression: missing ? 'missing = ?' : 'next = ?', answer, choices,
      hint: 'Find the part that repeats. How many shapes long is it?', steps,
      visual: { type: 'pattern', cells }, solution: { type: 'pattern', cells: cells.map((c) => c ?? right) },
    });
  }
  // two attributes changing on different cycles
  const p = rng.pick([2, 3]); const q = p === 2 ? 3 : 2;
  const cell = (i: number): Cell => ({ shape: shapes[i % p], color: colors[i % q] });
  const missing = rng.chance(0.5); const total = 8; const ask = missing ? rng.int(3, 5) : 7;
  const right = cell(ask);
  const cells: (Cell | null)[] = range(total).map((i) => (i === ask ? null : cell(i)));
  const wrong: Cell[] = [{ ...right, color: colors[(ask + 1) % q] }, { ...right, shape: shapes[(ask + 1) % p] }, { ...right, shape: shapes[(ask + p - 1) % p] }, cell(ask + 1), cell(0)];
  const { choices, answer } = cellChoices(rng, right, wrong, 4);
  const steps = [
    `Look at the shapes only: ${list(range(p).map((i) => shapes[i]))}, again and again. That repeat has ${labn(p, 'shape')}.`,
    `Look at the colours only: ${list(range(q).map((i) => colors[i]))}, again and again. That repeat has ${labn(q, 'colour')}.`,
    missing ? `At the box, the shape repeat says ${right.shape} and the colour repeat says ${right.color}.` : `Next, the shape repeat says ${right.shape} and the colour repeat says ${right.color}.`,
    `So the ${missing ? 'missing' : 'next'} one is the ${cellName(right)}.`,
  ];
  return make('shapes', d, sid, {
    prompt: missing ? 'Shapes and colours repeat in different ways. Which one is missing? Tap it.' : 'Shapes and colours repeat in different ways. Which one comes next? Tap it.',
    expression: missing ? 'missing = ?' : 'next = ?', answer, choices,
    hint: 'Follow the shapes on their own. Then follow the colours on their own.', steps,
    visual: { type: 'pattern', cells }, solution: { type: 'pattern', cells: cells.map((c) => c ?? right) },
  });
}

/* ------------------------------------------------------------------ */
/* grow: growing figures                                               */
/* ------------------------------------------------------------------ */

interface Fig {
  id: 'tower' | 'row' | 'twotower' | 'tworow' | 'post' | 'L' | 'T' | 'plus' | 'stairs' | 'square' | 'rect' | 'frame';
  name: string;
  /** Squares of step n; `m` is the largest step drawn in the same picture (so old squares keep their place). */
  cells: (n: number, m: number) => Sq[];
  f: (n: number) => number;
  /** Linear figures: squares added per step. */
  add?: number;
  /** Arm figures: [label of the fixed part, number of arms]. */
  parts?: [string, number];
  /** How much longer than the step number the growing part (arm, side, tower, columns) is. Varies the figures. */
  off: number;
}
const col = (c: number, h: number, r0 = 0): Sq[] => range(h).map((r) => [c, r0 + r] as Sq);
const tri = (k: number) => (k * (k + 1)) / 2;
const FIGS = {
  tower: (a: number): Fig => ({ id: 'tower', name: 'tower', cells: (n) => col(0, n + a), f: (n) => n + a, add: 1, off: a }),
  row: (a: number): Fig => ({ id: 'row', name: 'row', cells: (n) => range(n + a).map((c) => [c, 0] as Sq), f: (n) => n + a, add: 1, off: a }),
  twotower: (a: number): Fig => ({ id: 'twotower', name: 'pair of towers', cells: (n) => [...col(0, n + a), ...col(1, n + a)], f: (n) => 2 * (n + a), add: 2, off: a }),
  tworow: (a: number): Fig => ({ id: 'tworow', name: 'wall', cells: (n) => range(n + a).flatMap((c) => col(c, 2)), f: (n) => 2 * (n + a), add: 2, off: a }),
  post: (a: number): Fig => ({ id: 'post', name: 'tower on a base', cells: (n) => [[0, 0], [1, 0], [2, 0], ...col(1, n + a, 1)], f: (n) => 3 + n + a, add: 1, off: a }),
  L: (b: number): Fig => ({
    id: 'L', name: 'L-shape', f: (n) => 2 * (n + b) + 1, add: 2, parts: ['corner square', 2], off: b,
    cells: (n) => [[0, 0], ...range(n + b).flatMap((i) => [[0, i + 1], [i + 1, 0]] as Sq[])],
  }),
  T: (b: number): Fig => ({
    id: 'T', name: 'T-shape', f: (n) => 3 * (n + b) + 1, add: 3, parts: ['centre square', 3], off: b,
    cells: (n, m) => { const M = m + b; return [[M, M], ...range(n + b).flatMap((i) => [[M - i - 1, M], [M + i + 1, M], [M, M - i - 1]] as Sq[])]; },
  }),
  plus: (b: number): Fig => ({
    id: 'plus', name: 'plus sign', f: (n) => 4 * (n + b) + 1, add: 4, parts: ['centre square', 4], off: b,
    cells: (n, m) => { const M = m + b; return [[M, M], ...range(n + b).flatMap((i) => [[M - i - 1, M], [M + i + 1, M], [M, M - i - 1], [M, M + i + 1]] as Sq[])]; },
  }),
  stairs: (b: number): Fig => ({ id: 'stairs', name: 'staircase', cells: (n) => range(n + b).flatMap((c) => col(c, c + 1)), f: (n) => tri(n + b), off: b }),
  square: (b: number): Fig => ({ id: 'square', name: 'square', cells: (n) => range(n + b).flatMap((c) => col(c, n + b)), f: (n) => (n + b) ** 2, off: b }),
  rect: (b: number): Fig => ({ id: 'rect', name: 'rectangle', cells: (n) => range(n + b + 1).flatMap((c) => col(c, n + b)), f: (n) => (n + b) * (n + b + 1), off: b }),
  /** A square ring: step n is n + 2 + b squares across. */
  frame: (b: number): Fig => ({
    id: 'frame', name: 'square ring', f: (n) => 4 * (n + 1 + b), add: 4, off: b,
    cells: (n) => { const s = n + 2 + b; return range(s).flatMap((c) => range(s).filter((r) => c === 0 || r === 0 || c === s - 1 || r === s - 1).map((r) => [c, r] as Sq)); },
  }),
};
const figSteps = (fig: Fig, upTo: number, m = upTo): Sq[][] => range(upTo).map((i) => fig.cells(i + 1, m));
const span = (sq: Sq[], k: 0 | 1) => Math.max(...sq.map((s) => s[k])) - Math.min(...sq.map((s) => s[k])) + 1;
/** Would these steps fit one picture row (about 400 wide, 150 tall) with squares of size u? Mirrors GrowingFigure's layout. */
function fitsAt(fig: Fig, nums: number[], m: number, u: number): boolean {
  const steps = nums.map((n) => fig.cells(n, m));
  const gaps = nums.filter((n, i) => i > 0 && n > nums[i - 1] + 1).length;
  const w = 16 + steps.reduce((s, sq) => s + Math.max(span(sq, 0) * u, 46), 0) + 16 * (nums.length - 1) + 22 * gaps;
  return w <= 400 && Math.max(...steps.map((sq) => span(sq, 1))) * u <= 150;
}
/**
 * The "Show me how" picture: every step up to the asked one when they fit, else the first steps, "…" and the asked
 * step, else (a very far step) the first four steps. New squares are coloured, except in a ring, which moves outwards.
 */
function solutionFig(fig: Fig, ask: number, shown: number, minU: number): Visual {
  const all = range(ask).map((i) => i + 1); const jump = [...range(shown).map((i) => i + 1), ask];
  const showNew = fig.id !== 'frame';
  if (fitsAt(fig, all, ask, 10)) return { type: 'growing', steps: figSteps(fig, ask), showNew };
  if (fitsAt(fig, jump, ask, minU)) return { type: 'growing', steps: jump.map((n) => fig.cells(n, ask)), nums: jump, showNew };
  return { type: 'growing', steps: figSteps(fig, 4), showNew };
}

/** Worked lines that build up to step `ask` one step at a time (Grades 1 and 3). */
function countOn(fig: Fig, from: number, ask: number): string[] {
  return range(ask - from).map((i) => {
    const k = from + i + 1; const add = fig.f(k) - fig.f(k - 1);
    return `Step ${k} has ${labn(fig.f(k - 1), 'square before', 'squares before')} + ${labn(add, 'new square')} = ${labn(fig.f(k), 'square')}.`;
  });
}
/** The Grade 5 working for step n: "1 (centre square) + 3 (arms) × 12 (squares per arm) = 37 (squares)". */
function buildEq(fig: Fig, n: number): string {
  const k = n + fig.off; const tot = labn(fig.f(n), 'square');
  switch (fig.id) {
    case 'square': return `${labn(k, 'row')} × ${labn(k, 'square per row', 'squares per row')} = ${tot}`;
    case 'rect': return `${labn(k, 'row')} × ${labn(k + 1, 'square per row', 'squares per row')} = ${tot}`;
    case 'stairs': return `${labn(k, 'row')} × ${labn(k + 1, 'column')} ÷ ${lab(2, 'staircases in the rectangle')} = ${tot}`;
    case 'frame': return `${lab(4, 'sides')} × ${lab(k + 2, 'squares per side')} − ${lab(4, 'corners counted twice')} = ${tot}`;
    default: return `${lab(1, fig.parts![0])} + ${lab(fig.parts![1], 'arms')} × ${labn(k, 'square per arm', 'squares per arm')} = ${tot}`;
  }
}
/** How a Grade 5 figure is built, read from steps 1 and 2 of the picture. */
function structure(fig: Fig): string[] {
  const b = fig.off;
  switch (fig.id) {
    case 'square': return [`Each step is a square. Step 1 has ${labn(1 + b, 'row')} of ${labn(1 + b, 'square')}, and step 2 has ${labn(2 + b, 'row')} of ${labn(2 + b, 'square')}.`,
      b ? `So the side is ${labn(b, 'square')} more than the step number.` : 'So the side is as long as the step number.'];
    case 'rect': return [`Each step is a rectangle. Step 1 has ${labn(1 + b, 'row')} of ${labn(2 + b, 'square')}, and step 2 has ${labn(2 + b, 'row')} of ${labn(3 + b, 'square')}.`,
      `So it has ${b ? `${labn(b, 'row')} more than the step number` : 'as many rows as the step number'}, and each row has one more square than there are rows.`];
    case 'stairs': return [`Step 1 is a staircase ${labn(1 + b, 'column')} wide, and step 2 is ${labn(2 + b, 'column')} wide${b ? `: ${labn(b, 'column')} more than the step number` : ''}.`,
      'Two copies of a staircase fit together into a rectangle one column wider than it is tall.'];
    case 'frame': return [`Each step is a square ring. Step 1 is ${labn(3 + b, 'square')} across, and step 2 is ${labn(4 + b, 'square')} across: ${lab(2 + b, 'squares')} more than the step number.`,
      `Count ${lab(4, 'sides')}, then take away the ${lab(4, 'corners')}, because each corner sits on two sides.`];
    default: return [`Each step has ${lab(1, fig.parts![0])} and ${lab(fig.parts![1], 'arms')}. In step 1 each arm has ${labn(1 + b, 'square')}, and in step 2 each arm has ${labn(2 + b, 'square')}.`,
      b ? `So each arm has ${labn(b, 'square')} more than the step number.` : 'So each arm has as many squares as the step number.'];
  }
}
/** Real mistakes for "how many squares in step n": forgot the fixed part, forgot the offset, forgot to halve, counted corners twice. */
function growSlips(fig: Fig, n: number): number[] {
  const k = n + fig.off;
  const common = [fig.f(n - 1), fig.f(n + 1), n * fig.f(1), fig.f(3) + (n - 3) * (fig.f(3) - fig.f(2))];
  switch (fig.id) {
    case 'square': return [n * n, k * (k + 1), ...common];
    case 'rect': return [k * k, n * (n + 1), ...common];
    case 'stairs': return [k * (k + 1), tri(n), ...common];
    case 'frame': return [4 * (k + 2), 4 * (n + 1), ...common];
    default: return [fig.parts![1] * k, fig.f(n - fig.off), ...common];
  }
}

function growQuestion(d: Difficulty, rng: Rng, sid: string): Question {
  const g = gradeOf(d);
  if (g === 'g1') {
    const fig = d === 1
      ? rng.pick([FIGS.tower(rng.int(0, 4)), FIGS.row(rng.int(0, 3)), FIGS.post(rng.int(0, 3)), FIGS.twotower(rng.int(0, 2))])
      : rng.pick([FIGS.L(rng.int(0, 2)), FIGS.twotower(rng.int(0, 3)), FIGS.tworow(rng.int(0, 2)), FIGS.tower(rng.int(2, 6)), FIGS.post(rng.int(1, 4)), FIGS.row(rng.int(1, 2))]);
    const shown = d === 1 ? 3 : rng.pick([3, 4]); const ask = shown + 1; const ans = fig.f(ask); const m = fig.add!;
    const choices = numChoices(rng, ans, [fig.f(shown), fig.f(shown) + 1, ans + 1, ans - 1, ans + m], d === 1 ? 3 : 4, 20, 1);
    const steps = [
      range(shown).map((i) => `Step ${i + 1} has ${labn(fig.f(i + 1), 'square')}.`).join(' '),
      `Each step adds ${labn(m, 'square')}.`,
      `So step ${ask} has ${labn(fig.f(shown), 'square before', 'squares before')} + ${labn(m, 'new square')} = ${labn(ans, 'square')}.`,
    ];
    return make('grow', d, sid, {
      prompt: `The shape grows. How many squares are in step ${ask}?`, expression: `Step ${ask} = ? squares`, answer: ans, choices,
      hint: 'Count the squares in each step. How many more each time?', steps,
      visual: { type: 'growing', steps: figSteps(fig, shown, ask), ask }, solution: { type: 'growing', steps: figSteps(fig, ask), showNew: true },
      read: `The shape grows step by step. How many squares will step ${ask} have?`,
    });
  }
  if (g === 'g3') {
    const fig = d === 3
      ? rng.pick([FIGS.L(rng.int(0, 2)), FIGS.L(rng.int(0, 3)), FIGS.twotower(rng.int(0, 4)), FIGS.tworow(rng.int(0, 3)), FIGS.T(rng.int(0, 1)), FIGS.stairs(rng.int(1, 2))])
      : rng.pick([FIGS.stairs(rng.int(0, 1)), FIGS.stairs(rng.int(0, 2)), FIGS.L(rng.int(0, 3)), FIGS.T(rng.int(0, 2)), FIGS.plus(rng.int(0, 1)), FIGS.twotower(rng.int(2, 6))]);
    // Lesson l.pattern-2 works the plain staircase (1, 3, 6, 10) up to step 5, so practice never asks that same step:
    // Grade 3's first band starts the staircase further on, and the plain staircase is only asked for step 6 or 7.
    const plainStairs = fig.id === 'stairs' && fig.off === 0;
    const shown = fig.id === 'stairs' ? 4 : 3; const ask = plainStairs ? rng.pick([6, 6, 7]) : d === 3 ? rng.pick([5, 5, 6]) : rng.pick([5, 6, 6]);
    const ans = fig.f(ask);
    const counts = range(shown).map((i) => `step ${i + 1} has ${labn(fig.f(i + 1), 'square')}`);
    const steps = [
      `${cap(list(counts))}.`,
      fig.add ? `Each step adds ${labn(fig.add, 'square')}.`
        : `Each step adds a column one square taller: ${list(range(shown - 1).map((i) => `step ${i + 2} adds ${labn(fig.f(i + 2) - fig.f(i + 1), 'new square')}`))}.`,
      ...countOn(fig, shown, ask),
    ];
    return make('grow', d, sid, {
      prompt: `The ${fig.name} grows by the same rule each step. How many squares are in step ${ask}?`, expression: `Step ${ask} = ? squares`, answer: ans,
      hint: fig.id === 'stairs' ? 'Each new step adds a column. How tall is the new column?' : 'How many squares does each step add? Keep adding step by step.', steps,
      visual: { type: 'growing', steps: figSteps(fig, shown, ask), ask }, solution: solutionFig(fig, ask, shown, 7),
    });
  }
  // Grade 5: a far step built from its parts, or which step has N squares
  const inverse = d === 6 && rng.chance(0.4);
  const b = rng.int(0, 2);
  if (inverse) {
    const fig = rng.pick([FIGS.L(b), FIGS.T(b), FIGS.plus(b), FIGS.square(b), FIGS.frame(b)]);
    const n = fig.id === 'square' ? rng.int(7, 15) : rng.int(9, 30); const N = fig.f(n); const k = n + b;
    let steps: string[]; let wrong: number[]; let hint: string;
    if (fig.id === 'square') {
      steps = [...structure(fig), `Which number times itself makes ${lab(N, 'squares')}? ${lab(k, 'rows')} × ${lab(k, 'squares per row')} = ${labn(N, 'square')}.`,
        b ? `The side is ${labn(b, 'square')} more than the step number: ${lab(k, 'squares per side')} − ${labn(b, 'extra square')} = ${lab(n, 'step number')}.` : `The side is as long as the step number, so the answer is ${lab(n, 'step number')}.`];
      wrong = [k, n - 1, n + 1, N / 2, n + 2];
      hint = 'Each step is a square. What number times itself makes the total? Then compare the side with the step number.';
    } else if (fig.id === 'frame') {
      const s = n + 2 + b;
      steps = [...structure(fig), `Split the ring into ${lab(4, 'equal parts')}, each one side without its last corner: ${lab(N, 'squares')} ÷ ${lab(4, 'parts')} = ${lab(s - 1, 'squares per part')}.`,
        `So each side is ${lab(s - 1, 'squares per part')} + ${lab(1, 'corner square')} = ${lab(s, 'squares per side')}.`,
        `The side is ${lab(2 + b, 'squares')} more than the step number: ${lab(s, 'squares per side')} − ${lab(2 + b, 'extra squares')} = ${lab(n, 'step number')}.`];
      wrong = [s, s - 1, N / 4 - 2, n + 1, n - 1];
      hint = 'Split the ring into four equal parts. How many squares wide is each side? Then compare it with the step number.';
    } else {
      const [part, arms] = fig.parts!;
      steps = [...structure(fig), `Take away the ${part}: ${lab(N, 'squares')} − ${lab(1, part)} = ${lab(N - 1, 'squares on the arms')}.`,
        `Share them among the arms: ${lab(N - 1, 'squares on the arms')} ÷ ${lab(arms, 'arms')} = ${lab(k, 'squares per arm')}.`,
        b ? `Each arm has ${labn(b, 'square')} more than the step number: ${lab(k, 'squares per arm')} − ${labn(b, 'extra square')} = ${lab(n, 'step number')}.` : `Each arm is as long as the step number, so the answer is ${lab(n, 'step number')}.`];
      wrong = [k, n - 1, n + 1, N - 1, (N - 1) / (arms - 1), (N - 1) / (arms + 1)];
      hint = `Find how each step is built: a ${part} and arms. How long is each arm? Then compare it with the step number.`;
    }
    const choices = rng.chance(0.5) ? numChoices(rng, n, wrong, 5, Infinity, 1) : undefined;
    return make('grow', d, sid, {
      prompt: `The ${fig.name} keeps growing by the same rule. Which step has ${N} squares?${choices ? ' Tap it.' : ''}`, expression: `step with ${N} squares = ?`, answer: n, choices,
      hint, steps, visual: { type: 'growing', steps: figSteps(fig, 3) }, solution: solutionFig(fig, n, 3, 7),
    });
  }
  const fig = d === 5 ? rng.pick([FIGS.L(b), FIGS.T(b), FIGS.plus(b), FIGS.square(b), FIGS.stairs(b), FIGS.frame(b)])
    : rng.pick([FIGS.T(b), FIGS.plus(b), FIGS.square(b), FIGS.stairs(b), FIGS.rect(rng.int(0, 1)), FIGS.frame(b)]);
  const ask = d === 5 ? rng.pick([10, 10, 12, 15]) : rng.pick([10, 20, 20, 25, 30]);
  const ans = fig.f(ask); const shown = 3;
  const steps = [...structure(fig), `Check on step ${shown}: ${buildEq(fig, shown)}.`, `So step ${ask} has ${buildEq(fig, ask)}.`];
  const choices = rng.chance(0.5) ? numChoices(rng, ans, growSlips(fig, ask), 5, Infinity, 1) : undefined;
  return make('grow', d, sid, {
    prompt: `The ${fig.name} grows by the same rule each step. How many squares are in step ${ask}?${choices ? ' Tap it.' : ''}`, expression: `Step ${ask} = ? squares`, answer: ans, choices,
    hint: `Find how each step is built, then build step ${ask} in your head. Do not just multiply step 1.`, steps,
    visual: { type: 'growing', steps: figSteps(fig, shown), ask }, solution: solutionFig(fig, ask, shown, 7),
  });
}

/* ------------------------------------------------------------------ */
/* number: number patterns                                             */
/* ------------------------------------------------------------------ */

interface Seq {
  terms: number[]; ask: number; missing: boolean;
  /** One or two lines that name the rule (shown first in the worked steps). */
  rule: string[];
  /** The worked line that makes the asked term, and (for a missing term) the check with the next one. */
  make: string; check?: string;
  hint: string; wrong: number[];
}
/** A sequence where each term is the one before plus a jump (constant, taking turns or growing). */
function jumpSeq(terms: number[], ask: number, missing: boolean, rule: string[], hint: string, wrong: number[]): Seq {
  const j = terms[ask] - terms[ask - 1];
  const before = missing ? 'number before the box' : 'last number';
  const mk = `${lab(terms[ask - 1], before)} ${j < 0 ? '−' : '+'} ${lab(Math.abs(j), 'jump')} = ${lab(terms[ask], missing ? 'missing number' : 'next number')}.`;
  const j2 = missing ? terms[ask + 1] - terms[ask] : 0;
  const check = missing ? `Check: ${lab(terms[ask], 'missing number')} ${j2 < 0 ? '−' : '+'} ${lab(Math.abs(j2), 'next jump')} = ${lab(terms[ask + 1], 'number after the box')}.` : undefined;
  return { terms, ask, missing, rule, make: mk, check, hint, wrong };
}

/** The jumps between neighbours, each labelled, with "?" for the jumps that touch the box. */
const jumpList = (terms: number[], ask: number) => list(range(terms.length - 1).map((i) => (i === ask - 1 || i === ask ? '?' : lab(signed(terms[i + 1] - terms[i]), 'jump'))));
const into = (missing: boolean) => (missing ? 'box' : 'next place');

function numberSeq(d: Difficulty, rng: Rng): Seq {
  const g = gradeOf(d);
  if (g === 'g1') {
    // No count by tens: within 20 it has only 0, 10 and 20, too few numbers to show a jump. Fives cover 0, 5, 10, 15, 20.
    const t = d === 1 ? rng.pick(['up1', 'up2', 'up2', 'up1']) : rng.pick(['up2', 'up5', 'back1', 'back2', 'up1', 'up2', 'up5', 'back5', 'up1', 'back2', 'up2']);
    const k = t === 'up1' || t === 'back1' ? 1 : t === 'up2' || t === 'back2' ? 2 : 5;
    const down = t.startsWith('back');
    const len = k === 5 ? rng.int(4, 5) : 5;
    const span = k * len;
    const start = k === 5 ? (down ? (len === 5 ? 20 : rng.pick([15, 20])) : len === 5 ? 0 : rng.pick([0, 5])) : down ? rng.int(span, 20) : rng.int(t === 'up1' ? 1 : 0, 20 - span);
    const terms = range(len).map((i) => (down ? start - i * k : start + i * k));
    const missing = d === 2 && rng.chance(0.4);
    const ask = missing ? rng.int(1, len - 2) : len - 1;
    const ans = terms[ask]; const prev = terms[ask - 1];
    const rule = [down ? `Each jump takes away ${lab(k, 'jump')}.` : `Each jump adds ${lab(k, 'jump')}.`];
    const wrong = down ? [prev - 1, ans + 1, ans - 1, prev + k] : [prev + 1, ans + 1, ans - 1, ans + k, prev];
    return jumpSeq(terms, ask, missing, rule, down ? 'The numbers go down. How much does each jump take away?' : 'How much does each number go up by?', wrong);
  }
  if (g === 'g3') {
    const r = rng.pick(d === 3 ? ['+3', '+4', '+25', '-2', '+5', '-10', 'x2'] : ['+25', '+50', 'x2', '-2', '+4', '+3', '-25', '+9']);
    const len = 6; const missing = d === 4 ? rng.chance(0.7) : rng.chance(0.2);
    const ask = missing ? rng.int(2, len - 2) : len - 1;
    if (r === 'x2') {
      const start = rng.int(2, d === 3 ? 6 : 12); const terms = range(len).map((i) => start * 2 ** i);
      const ans = terms[ask];
      const mk = `${lab(terms[ask - 1], missing ? 'number before the box' : 'last number')} × ${lab(2, 'multiplier')} = ${lab(ans, missing ? 'missing number' : 'next number')}.`;
      const check = missing ? `Check: ${lab(ans, 'missing number')} × ${lab(2, 'multiplier')} = ${lab(terms[ask + 1], 'number after the box')}.` : undefined;
      return { terms, ask, missing, rule: [`Each number is double the one before: × ${lab(2, 'multiplier')} every time.`], make: mk, check, hint: 'Find the jump. Is it adding, taking away, or doubling?', wrong: [terms[ask - 1] + (terms[ask - 1] - terms[ask - 2]), ans + 2, ans - 2, terms[ask - 1] + 2] };
    }
    const k = Number(r.slice(1)); const down = r.startsWith('-');
    const span = k * (len - 1);
    const start = down ? rng.int(span + 2, span + (k >= 10 ? 400 : 60)) : k >= 25 ? k * rng.int(1, 6) + (k === 25 && rng.chance(0.3) ? rng.pick([5, 10, 15, 20]) : 0) : rng.int(1, 60);
    const terms = range(len).map((i) => (down ? start - i * k : start + i * k));
    const ans = terms[ask]; const prev = terms[ask - 1];
    return jumpSeq(terms, ask, missing, [down ? `Each jump takes away ${lab(k, 'jump')}.` : `Each jump adds ${lab(k, 'jump')}.`], 'Find the jump. Is it adding, taking away, or doubling?',
      down ? [prev - 1, prev + k, ans + 1, ans - 1, ans - k] : [prev + 1, ans + 1, ans - 1, ans + k, prev * 2]);
  }
  // Grade 5
  const fam = rng.pick(d === 5 ? ['alt', 'alt', 'grow', 'grow', 'times'] : ['square', 'tri', 'fib', 'affine', 'grow', 'alt']);
  const missing = d === 6 ? rng.chance(0.45) && fam !== 'affine' : rng.chance(0.2);
  const len = missing ? 7 : 6;
  const ask = missing ? rng.int(2, len - 2) : len - 1;
  if (fam === 'alt') {
    const a = rng.int(3, 9); const b = rng.int(1, a - 1); const start = rng.int(1, 20);
    const terms = [start]; for (let i = 1; i < len; i++) terms.push(terms[i - 1] + (i % 2 ? a : -b));
    const j = terms[ask] - terms[ask - 1];
    return jumpSeq(terms, ask, missing, [`Write the jumps: ${jumpList(terms, ask)}. They take turns: + ${lab(a, 'jump up')}, then − ${lab(b, 'jump down')}.`, `So the jump into the ${into(missing)} is ${lab(signed(j), 'jump')}.`],
      'Write the jump between each pair of numbers. Do the jumps take turns?', [terms[ask - 1] - j, terms[ask - 1] + a - b, terms[ask] + 1, terms[ask] - 1, terms[ask - 2] + a]);
  }
  if (fam === 'grow' || fam === 'tri') {
    const inc = fam === 'tri' ? 1 : rng.pick([1, 1, 2]); const j0 = fam === 'tri' ? 2 : rng.int(1, 5); const start = fam === 'tri' ? 1 : rng.int(1, 15);
    const terms = [start]; for (let i = 1; i < len; i++) terms.push(terms[i - 1] + j0 + (i - 1) * inc);
    const j = terms[ask] - terms[ask - 1];
    const rule = [`Write the jumps: ${jumpList(terms, ask)}.`, `Each jump is bigger than the one before by ${lab(inc, 'growth per jump')}, so the jump into the ${into(missing)} is ${lab(signed(j), 'jump')}.${fam === 'tri' ? ' These are the triangle numbers: dots that make bigger and bigger triangles.' : ''}`];
    return jumpSeq(terms, ask, missing, rule, 'Write the jump between each pair of numbers. How do the jumps change?', [terms[ask - 1] + (j - inc), terms[ask] + inc, terms[ask] + 1, terms[ask] - 1, 2 * terms[ask - 1] - terms[ask - 2]]);
  }
  if (fam === 'times') {
    const r = rng.pick([2, 2, 3]); const start = rng.int(1, r === 2 ? 7 : 4); const terms = range(len).map((i) => start * r ** i);
    const ans = terms[ask];
    const mk = `${lab(terms[ask - 1], missing ? 'number before the box' : 'last number')} × ${lab(r, 'multiplier')} = ${lab(ans, missing ? 'missing number' : 'next number')}.`;
    const check = missing ? `Check: ${lab(ans, 'missing number')} × ${lab(r, 'multiplier')} = ${lab(terms[ask + 1], 'number after the box')}.` : undefined;
    return { terms, ask, missing, rule: [`Each number is the one before × ${lab(r, 'multiplier')}.`], make: mk, check, hint: 'The jumps get big fast. Try multiplying instead of adding.', wrong: [terms[ask - 1] + (terms[ask - 1] - terms[ask - 2]), ans + r, ans - r, terms[ask - 1] + r] };
  }
  if (fam === 'square') {
    const k0 = rng.int(1, 6); const terms = range(len).map((i) => (k0 + i) ** 2);
    const s = k0 + ask; const ans = terms[ask];
    const mk = `${missing ? 'In the box' : 'Next'}: ${lab(s, 'side')} × ${lab(s, 'side')} = ${lab(ans, missing ? 'missing number' : 'next number')}.`;
    const sq = (x: number) => `${lab(x, 'side')} × ${lab(x, 'side')}`;
    return { terms, ask, missing, rule: [`These are square numbers: ${sq(k0)}, ${sq(k0 + 1)}, ${sq(k0 + 2)}, and so on.`, `The jumps are odd numbers that grow by ${lab(2, 'growth per jump')} each time: ${jumpList(terms, ask)}.`],
      make: mk, hint: 'Try multiplying a number by itself. Or write the jumps.', wrong: [terms[ask - 1] + (terms[ask - 1] - terms[ask - 2]), ans + 1, ans - 1, 2 * s, ans + 2 * s + 1] };
  }
  if (fam === 'fib') {
    const a = rng.int(1, 5); const b = rng.int(a, a + 4); const terms = [a, b]; for (let i = 2; i < len; i++) terms.push(terms[i - 1] + terms[i - 2]);
    const ans = terms[ask];
    const mk = `${lab(terms[ask - 2], 'two before')} + ${lab(terms[ask - 1], 'one before')} = ${lab(ans, missing ? 'missing number' : 'next number')}.`;
    const check = missing ? `Check: ${lab(terms[ask - 1], 'one before')} + ${lab(ans, 'missing number')} = ${lab(terms[ask + 1], 'number after the box')}.` : undefined;
    return { terms, ask, missing, rule: [`Each number is the two numbers before it added together. Check: ${lab(terms[0], 'first')} + ${lab(terms[1], 'second')} = ${lab(terms[2], 'third')}.`], make: mk, check,
      hint: 'Look at two numbers side by side, then at the number after them.', wrong: [terms[ask - 1] + (terms[ask - 1] - terms[ask - 2]), ans + 1, ans - 1, 2 * terms[ask - 1]] };
  }
  // affine: × a, then + b (or − b)
  const a = rng.pick([2, 2, 3]); const b = rng.pick(a === 2 ? [1, -1, 2, 3] : [1, -1, 2]); const start = rng.int(b < 0 ? 2 : 1, a === 2 ? 5 : 3);
  const terms = [start]; for (let i = 1; i < len; i++) terms.push(terms[i - 1] * a + b);
  const ans = terms[ask];
  const mk = `${lab(terms[ask - 1], 'last number')} × ${lab(a, 'multiplier')} ${b < 0 ? '−' : '+'} ${lab(Math.abs(b), 'amount added')} = ${lab(ans, 'next number')}.`;
  return { terms, ask, missing: false, rule: [`Each number is the one before × ${lab(a, 'multiplier')}, then ${b < 0 ? '−' : '+'} ${lab(Math.abs(b), 'amount added')}.`, `Check: ${lab(terms[0], 'first')} × ${lab(a, 'multiplier')} ${b < 0 ? '−' : '+'} ${lab(Math.abs(b), 'amount added')} = ${lab(terms[1], 'second')}.`],
    make: mk, hint: 'The jumps grow fast. Try multiplying the number before, then fixing it up by a little.', wrong: [terms[ask - 1] * a, terms[ask - 1] + (terms[ask - 1] - terms[ask - 2]), ans + 1, ans - 1] };
}

function numberQuestion(d: Difficulty, rng: Rng, sid: string): Question {
  const s = numberSeq(d, rng); const g = gradeOf(d);
  const cells: (Cell | null)[] = s.terms.map((n, i) => (i === s.ask ? null : { num: n }));
  const choices = g === 'g1' ? numChoices(rng, s.terms[s.ask], s.wrong, d === 1 ? 3 : 4, 20) : g === 'g5' && rng.chance(0.4) ? numChoices(rng, s.terms[s.ask], s.wrong, 5, Infinity, Math.min(...s.terms)) : undefined;
  const tap = choices && g !== 'g1' ? ' Tap it.' : '';
  const shown = s.terms.map((n, i) => (i === s.ask ? '?' : String(n)));
  const read = g === 'g1' ? (s.missing ? `${list(shown.slice(0, s.ask))}, then a box, then ${list(shown.slice(s.ask + 1))}. What number goes in the box?` : `${list(shown.slice(0, s.ask))}. What number comes next?`) : undefined;
  const prompt = g === 'g1' ? (s.missing ? 'What number is missing?' : 'What number comes next?')
    : s.missing ? `One number in the pattern is missing. What is it?${tap}` : `The pattern keeps going by the same rule. What number comes next?${tap}`;
  return make('number', d, sid, {
    prompt, expression: s.missing ? 'missing = ?' : 'next = ?', answer: s.terms[s.ask], choices, read,
    hint: s.hint, steps: [...s.rule, s.make, ...(s.check ? [s.check] : [])],
    visual: { type: 'pattern', cells }, solution: { type: 'pattern', cells: s.terms.map((n) => ({ num: n })) },
  });
}

/* ------------------------------------------------------------------ */
/* machine: function machines                                          */
/* ------------------------------------------------------------------ */

type Op = '+' | '−' | '×';
interface Rule { a: Op; n: number; b?: '+' | '−'; m?: number }
const apply = (r: Rule, x: number) => { let y = r.a === '+' ? x + r.n : r.a === '−' ? x - r.n : x * r.n; if (r.b) y = r.b === '+' ? y + r.m! : y - r.m!; return y; };
const ruleText = (r: Rule) => `${r.a} ${r.n}${r.b ? `, then ${r.b} ${r.m}` : ''}`;
const ruleWords = (r: Rule) => (r.a === '+' ? `adds ${r.n}` : r.a === '−' ? `takes away ${r.n}` : `multiplies by ${r.n}`);
const undoOp = (o: Op | '+' | '−') => (o === '+' ? '−' : o === '−' ? '+' : '÷');

function machineQuestion(d: Difficulty, rng: Rng, sid: string): Question {
  const g = gradeOf(d) === 'g5' ? 'g5' : 'g3';
  const backward = rng.chance(0.4);
  const hidden = d === 4 || d === 6;
  let rule: Rule; let ins: number[];
  if (g === 'g3') {
    const a = rng.pick(['+', '−', '×'] as Op[]);
    const n = a === '×' ? rng.int(2, 10) : a === '+' ? rng.int(2, d === 3 ? 30 : 99) : rng.int(2, d === 3 ? 20 : 50);
    rule = { a, n };
    const lo = a === '−' ? n + 1 : 1; const hi = a === '×' ? (d === 3 ? 12 : 25) : a === '+' ? 200 : n + 150;
    ins = rng.shuffle(range(hi - lo + 1).map((i) => lo + i)).slice(0, hidden ? 4 : 3);
  } else {
    const a = rng.int(2, 6); const b = rng.chance(0.65) ? '+' : '−'; const m = rng.int(1, 15);
    rule = { a: '×', n: a, b, m };
    const lo = b === '−' ? Math.ceil((m + 1) / a) : 1;
    ins = rng.shuffle(range(12).map((i) => lo + i)).slice(0, 3).sort((x, y) => x - y);
    let last = 0;
    for (let t = 0; t < 20 && (!last || ins.includes(last)); t++) last = hidden ? rng.pick([rng.int(15, 30), 50, 100]) : rng.int(11, 40);
    ins.push(ins.includes(last) ? ins[2] + 13 : last);
  }
  const examples = hidden ? ins.slice(0, 3) : ins.slice(0, g === 'g3' ? 2 : 1);
  if (g === 'g3') examples.sort((x, y) => x - y);
  const x = ins[ins.length - 1]; const y = apply(rule, x);
  const rows = [...examples.map((i) => ({ input: i, output: apply(rule, i) })), backward ? { input: '?' as const, output: y } : { input: x, output: '?' as const }];
  const answer = backward ? x : y;
  const steps: string[] = [];
  if (hidden) {
    if (!rule.b) {
      const [r0] = examples;
      steps.push(`Compare each in with its out: ${list(examples.map((i) => `${lab(i, 'in')} → ${lab(apply(rule, i), 'out')}`))}.`);
      steps.push(rule.a === '×' ? `Each out is its in × ${lab(rule.n, 'the rule')}. Check: ${lab(r0, 'in')} × ${lab(rule.n, 'the rule')} = ${lab(apply(rule, r0), 'out')}.`
        : `Each out is its in ${rule.a} ${lab(rule.n, 'the rule')}. Check: ${lab(r0, 'in')} ${rule.a} ${lab(rule.n, 'the rule')} = ${lab(apply(rule, r0), 'out')}.`);
    } else {
      const [i1, i2] = examples; const o1 = apply(rule, i1); const o2 = apply(rule, i2);
      steps.push(`From ${lab(i1, 'in')} to ${lab(i2, 'in')} the in goes up ${lab(i2 - i1, 'in change')}, and the out goes up ${lab(o2 - o1, 'out change')}.`);
      steps.push(`${lab(o2 - o1, 'out change')} ÷ ${lab(i2 - i1, 'in change')} = ${lab(rule.n, 'multiplier')}, so the first step is × ${lab(rule.n, 'multiplier')}.`);
      steps.push(`${lab(i1, 'in')} × ${lab(rule.n, 'multiplier')} = ${lab(i1 * rule.n, 'after the first step')}, but the out is ${lab(o1, 'out')}. So the second step is ${rule.b} ${lab(rule.m!, 'second step')}.`);
      steps.push(`The rule is × ${lab(rule.n, 'multiplier')}, then ${rule.b} ${lab(rule.m!, 'second step')}.`);
    }
  }
  if (!rule.b) {
    if (backward) steps.push(`Work backwards: undo ${rule.a} ${lab(rule.n, 'the rule')} with ${undoOp(rule.a)} ${lab(rule.n, 'the rule')}.`, `${lab(y, 'out')} ${undoOp(rule.a)} ${lab(rule.n, 'the rule')} = ${lab(x, 'in')}.`);
    else steps.push(`${lab(x, 'in')} ${rule.a} ${lab(rule.n, 'the rule')} = ${lab(y, 'out')}.`);
  } else {
    const mid = x * rule.n;
    if (backward) {
      steps.push('Work backwards: undo the last step first.');
      steps.push(`${lab(y, 'out')} ${undoOp(rule.b)} ${lab(rule.m!, 'second step')} = ${lab(mid, 'before the second step')}.`);
      steps.push(`Then ${lab(mid, 'before the second step')} ÷ ${lab(rule.n, 'multiplier')} = ${lab(x, 'in')}.`);
    } else {
      steps.push(`${lab(x, 'in')} × ${lab(rule.n, 'multiplier')} = ${lab(mid, 'after the first step')}.`);
      steps.push(`Then ${lab(mid, 'after the first step')} ${rule.b} ${lab(rule.m!, 'second step')} = ${lab(y, 'out')}.`);
    }
  }
  let choices: QuestionChoice[] | undefined;
  if (g === 'g5' && rng.chance(0.5)) {
    const m = rule.m!; const s = rule.b === '+' ? 1 : -1;
    choices = backward
      ? numChoices(rng, x, [(y / rule.n) - s * m, y - s * m, x + 1, x - 1, Math.round(y / rule.n)], 5, Infinity, 1)
      : numChoices(rng, y, [x * rule.n, (x + s * m) * rule.n, x * rule.n - s * m, y + rule.n], 5, Infinity, 1);
  }
  const tap = choices ? ' Tap it.' : '';
  const given = hidden ? 'Find the rule from the table.' : rule.b ? `The machine does × ${rule.n}, then ${rule.b} ${rule.m}.` : `The machine ${ruleWords(rule)}.`;
  const prompt = `${given} ${backward ? `What went in to give ${y}?` : `What comes out when ${x} goes in?`}${tap}`;
  const hint = backward ? (rule.b ? 'Work backwards: undo the last step first, then the first step.' : 'Work backwards: do the opposite of the rule.')
    : hidden ? (rule.b ? 'How much does the out go up when the in goes up by one? That is the multiplier.' : 'Compare each in with its out. What was done to it?')
      : rule.b ? 'Do the first step, then do the second step to that answer.' : 'Do what the machine says to the number that goes in.';
  return make('machine', d, sid, {
    prompt, expression: backward ? 'in = ?' : 'out = ?', answer, choices, hint, steps,
    visual: { type: 'machine', rule: hidden ? undefined : ruleText(rule), rows },
    solution: { type: 'machine', rule: ruleText(rule), rows: rows.map((r) => ({ input: r.input === '?' ? x : r.input, output: r.output === '?' ? y : r.output })) },
  });
}

/* ------------------------------------------------------------------ */
/* term: far terms                                                     */
/* ------------------------------------------------------------------ */

function termQuestion(d: Difficulty, rng: Rng, sid: string): Question {
  const mode = d === 5 ? rng.pick(['nth', 'nth', 'shape']) : rng.pick(['far', 'place', 'count', 'shape']);
  if (mode === 'shape' || mode === 'count') {
    const shapes = rng.shuffle(G3_SHAPES); const colors = g3Colors(rng);
    if (mode === 'count') {
      const len = rng.int(3, 5); const target = shapes[0];
      const others = range(len).map((i) => ({ shape: shapes[1 + (i % 3)], color: colors[1 + (i % 4)] } as Cell));
      const spots = rng.shuffle(range(len)).slice(0, rng.int(1, 2));
      const core: Cell[] = range(len).map((i) => (spots.includes(i) ? { shape: target, color: colors[0] } : others[i]));
      const N = rng.int(30, 80); const full = Math.floor(N / len); const r = N % len;
      const per = spots.length; const extra = core.slice(0, r).filter((c) => c.shape === target).length;
      const ans = full * per + extra;
      const shown = Math.max(6, len + 2); // one full repeat and a bit more, so the train stays large on a phone
      const cells: (Cell | null)[] = [...range(shown).map((i) => core[i % len]), {}];
      const under = [...range(shown).map((i) => ordinal(i + 1)), ''];
      const plural = `${target}s`;
      const steps = [
        `The repeat has ${labn(len, 'shape')} with ${labn(per, target)} in it: ${list(core.map(cellName))}.`,
        `${lab(N, 'shapes')} = ${labn(full, 'full repeat')} × ${lab(len, 'shapes in the repeat')} + ${labn(r, 'extra shape')}.`,
        `The full repeats hold ${labn(full, 'full repeat')} × ${lab(per, `${unit(per, target)} per repeat`)} = ${labn(full * per, target)}.`,
        ...(r === 0 ? [`There are no extra shapes, so there are ${labn(ans, target)}.`] : [`The ${labn(r, 'extra shape')} ${r === 1 ? 'is' : 'are'} the start of a repeat: ${list(core.slice(0, r).map(cellName))}. That adds ${labn(extra, target)}.`,
          `${lab(full * per, plural)} + ${labn(extra, target)} = ${labn(ans, target)}.`]),
      ];
      const choices = rng.chance(0.5) ? numChoices(rng, ans, [full * per, Math.round(N / len), ans + 1, ans - 1, Math.round((N * per) / len) + 1], 5, Infinity, 0) : undefined;
      return make('term', d, sid, {
        prompt: `The train repeats the same way forever. How many ${plural} are in the first ${N} shapes?${choices ? ' Tap it.' : ''}`, expression: `${plural} = ?`, answer: ans, choices,
        hint: 'How many full repeats fit in the first shapes? Then look at the shapes left over.', steps,
        visual: { type: 'pattern', cells, under },
      });
    }
    const len = d === 5 ? rng.int(3, 4) : rng.int(4, 5);
    const core: Cell[] = range(len).map((i) => ({ shape: shapes[i], color: colors[i] }));
    const N = d === 5 ? rng.int(20, 50) : rng.int(45, 100);
    const shown = Math.max(6, len + 2);
    const q = Math.floor(N / len); const r = N % len; const right = core[(N - 1) % len];
    const cells: (Cell | null)[] = [...range(shown).map((i) => core[i % len]), {}, null];
    const under = [...range(shown).map((i) => ordinal(i + 1)), '', ordinal(N)];
    const { choices, answer } = cellChoices(rng, right, core.filter((c) => !same(c, right)), len);
    const steps = [
      `The repeat has ${labn(len, 'shape')}: ${list(core.map(cellName))}.`,
      `${lab(N, 'place')} = ${labn(q, 'full repeat')} × ${lab(len, 'shapes in the repeat')} + ${labn(r, 'extra shape')}.`,
      r === 0 ? `No shapes are left over, so the ${ordinal(N)} shape is the last one of a repeat: the ${cellName(right)}.` : `After the full repeats, count ${labn(r, 'more shape')} into a new repeat: the ${ordinal(N)} shape is the ${ordinal(r)} shape of the repeat, the ${cellName(right)}.`,
    ];
    return make('term', d, sid, {
      prompt: `The train repeats the same way forever. What is the ${ordinal(N)} shape? Tap it.`, expression: `${ordinal(N)} shape = ?`, answer, choices,
      hint: 'How many full repeats fit before that place? What is left over?', steps,
      visual: { type: 'pattern', cells, under }, solution: { type: 'pattern', cells: cells.map((c) => c ?? right), under },
    });
  }
  // arithmetic sequences
  const a = rng.int(1, 20); const k = rng.int(2, d === 5 ? 9 : 12);
  const terms = range(4).map((i) => a + i * k);
  if (mode === 'place') {
    const p = rng.int(15, 60); const N = a + (p - 1) * k;
    const cells: (Cell | null)[] = [...terms.map((n) => ({ num: n })), {}, { num: N }];
    const under = [...range(4).map((i) => ordinal(i + 1)), '', '?'];
    const steps = [
      `Each jump adds ${lab(k, 'jump')}.`,
      `From the 1st number to ${lab(N, 'target')} the pattern climbs ${lab(N, 'target')} − ${lab(a, 'first number')} = ${lab(N - a, 'climb')}.`,
      `${lab(N - a, 'climb')} ÷ ${lab(k, 'jump')} = ${lab(p - 1, 'jumps')}.`,
      `Count the places: ${lab(1, 'first place')} + ${lab(p - 1, 'jumps')} = ${lab(p, 'place')}. So ${lab(N, 'target')} is the ${ordinal(p)} number.`,
    ];
    const choices = rng.chance(0.5) ? numChoices(rng, p, [p - 1, p + 1, Math.round(N / k), Math.round(N / k) + 1], 5, Infinity, 1) : undefined;
    return make('term', d, sid, {
      prompt: `The pattern ${list(terms)}, … keeps adding the same amount. In which place is the number ${N}?${choices ? ' Tap it.' : ''}`, expression: `place of ${N} = ?`, answer: p, choices,
      hint: 'How far does the pattern climb from the first number to this one? How many jumps is that?', steps,
      visual: { type: 'pattern', cells, under }, solution: { type: 'pattern', cells, under: [...under.slice(0, 5), ordinal(p)] },
    });
  }
  const n = mode === 'far' ? rng.pick([50, 100, 100]) : rng.int(10, 30);
  const ans = a + (n - 1) * k;
  const cells: (Cell | null)[] = [...terms.map((x) => ({ num: x })), {}, null];
  const under = [...range(4).map((i) => ordinal(i + 1)), '', ordinal(n)];
  const steps = [
    `Each jump adds ${lab(k, 'jump')}.`,
    `From the 1st number to the ${ordinal(n)} there are ${lab(n - 1, 'jumps')}: one fewer than the place number.`,
    `${lab(a, 'first number')} + ${lab(n - 1, 'jumps')} × ${lab(k, 'jump')} = ${lab(ans, 'far number')}.`,
  ];
  const choices = rng.chance(0.5) ? numChoices(rng, ans, [a + n * k, n * k, (n - 1) * k, ans + 1], 5, Infinity, 1) : undefined;
  return make('term', d, sid, {
    prompt: `The pattern ${list(terms)}, … keeps adding the same amount. What is the ${ordinal(n)} number?${choices ? ' Tap it.' : ''}`, expression: `${ordinal(n)} number = ?`, answer: ans, choices,
    hint: `How many jumps are there from the 1st number to the ${ordinal(n)}? Careful: there is one jump fewer than the place number.`, steps,
    visual: { type: 'pattern', cells, under }, solution: { type: 'pattern', cells: cells.map((c) => c ?? { num: ans }), under },
  });
}

/* ------------------------------------------------------------------ */

export function patternQuestion(kind: PatternKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const fits = (PATTERN_KINDS.map((x) => x.id).filter((x) => x !== 'all') as K[]).filter((x) => PATTERN_KIND_GRADES[x].includes(gradeOf(d)));
  const k: K = kind === 'all' ? rng.pick(fits) : kind;
  const sid = skillId ?? (kind === 'all' ? "pattern" : `pattern.${k}`);
  const e = patternDifficulty(k, d);
  const q = k === 'shapes' ? (gradeOf(e) === 'g1' ? shapesG1(e, rng, sid) : shapesG3(e, rng, sid))
    : k === 'grow' ? growQuestion(e, rng, sid)
      : k === 'number' ? numberQuestion(e, rng, sid)
        : k === 'machine' ? machineQuestion(e, rng, sid)
          : termQuestion(e, rng, sid);
  return e === d ? q : { ...q, difficulty: d };
}
export const genPattern: Generator = (skillId, params, ctx) => patternQuestion(String(params?.kind ?? 'all') as PatternKind, ctx.difficulty, ctx.rng, skillId);
