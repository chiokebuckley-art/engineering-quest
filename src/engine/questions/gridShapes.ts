import type { Difficulty, Question, QuestionChoice, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { contestQuestion, choicesFrom, gradeOf, type ContestGameMeta, type ContestKind, type ContestSpec, type KindGrades } from '../contest/common';
import { COLORS, type ColorName } from '../contest/visuals';
import { lab, labn, unit } from '../label';
import { num } from './picture';

/**
 * Mirror & Grid (Contest Path): mirror pictures, lines of symmetry, area and perimeter on the grid, composite shapes,
 * triangles on the grid and tangram pieces. Difficulty 1–2 = Grade 1, 3–4 = Grade 3, 5–6 = Grade 5 (see contest/common.ts).
 * A kind asked at a difficulty outside its grades plays at the nearest difficulty it supports.
 *
 * Grid pictures: a cell [col, row] is the unit square from (col, row) to (col + 1, row + 1), row 0 at the bottom.
 * Every answer is worked out from the cells (or the polygon, or the pieces) the picture draws.
 */
export type GridKind = 'all' | 'mirror' | 'lines' | 'area' | 'perimeter' | 'tangram';
type Kind = Exclude<GridKind, 'all'>;
export type Cell = [number, number];
type Pt = [number, number];
type GridV = Extract<Visual, { type: 'gridshape' }>;
type TanV = Extract<Visual, { type: 'tangram' }>;
export type TanPiece = TanV['pieces'][number];
export type TanKind = TanPiece['kind'];
type Rot = TanPiece['rot'];
type Axis = { dir: 'v' | 'h'; at: number };
type Seg = [Pt, Pt];

export const GRID_META: ContestGameMeta = {
  id: 'grid', label: 'Mirror & Grid', icon: 'compass', topic: 'Grid shapes', skill: 'grid',
  blurb: 'Mirror pictures, lines of symmetry, area and perimeter by counting squares, composite shapes and tangram pieces.',
  intro: 'A mirror line gives every square a twin, just as far away on the other side, and a line of symmetry is a fold that lands one half exactly on the other. Area counts the squares that cover a shape (two half squares make one whole), while perimeter walks once around the outside and counts every edge. Big shapes break into rectangles you can add, or fill in to a box and take the cut-out away. Tangram pieces are built from small triangles: a square, a medium triangle and the parallelogram are 2 small triangles each, and a large triangle is 4.',
  tree: { x: 5, y: 7 }, prereq: { skillId: 'add.basic', mastery: 0 },
};

export const GRID_KINDS: ContestKind[] = [
  { id: 'all', label: 'Mixed', short: 'Mixed', desc: 'Mirror pictures, lines of symmetry, area and perimeter by counting squares, composite shapes and tangram pieces.' },
  { id: 'mirror', label: 'Mirror the picture', short: 'Mirror', desc: 'Each square has a twin the same distance from the mirror line.' },
  { id: 'lines', label: 'Lines of symmetry', short: 'Lines', desc: 'Fold it in your head: do the two halves land on each other?' },
  { id: 'area', label: 'Area by counting', short: 'Area', desc: 'Count the squares inside; two half squares make one.' },
  { id: 'perimeter', label: 'Perimeter on the grid', short: 'Perimeter', desc: 'Walk around the outside and count each edge once.' },
  { id: 'tangram', label: 'Tangram pieces', short: 'Tangrams', desc: 'Which pieces make the picture? Small triangles join to make bigger shapes.' },
];
/** Which grades each kind suits. */
export const GRID_KIND_GRADES: KindGrades = { mirror: ['g1', 'g3'], lines: ['g3', 'g5'], area: ['g1', 'g3', 'g5'], perimeter: ['g3', 'g5'], tangram: ['g1', 'g3'] };
/** The difficulties each kind is written for; other difficulties play at the nearest one. */
const BAND: Record<Kind, [number, number]> = { mirror: [1, 4], lines: [3, 6], area: [1, 6], perimeter: [3, 6], tangram: [1, 4] };

const APP = 'Designers, tilers and builders mirror plans, count squares and walk the edge of a floor plan before they cut anything.';

/* ------------------------------------------------------------------ */
/* Grid geometry                                                        */
/* ------------------------------------------------------------------ */

const K = (c: number, r: number) => `${c},${r}`;
const setOf = (cells: readonly Cell[]) => new Set(cells.map(([c, r]) => K(c, r)));
const NB: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** Top row first, left to right: the order a child counts in (and the order the worked picture numbers them). */
export const countOrder = (cells: readonly Cell[]): Cell[] => [...cells].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
const cellsKey = (cells: readonly Cell[]) => [...setOf(cells)].sort().join(';');
function union(...lists: (readonly Cell[])[]): Cell[] {
  const seen = new Set<string>(); const out: Cell[] = [];
  for (const l of lists) for (const [c, r] of l) if (!seen.has(K(c, r))) { seen.add(K(c, r)); out.push([c, r]); }
  return out;
}
const minus = (a: readonly Cell[], b: readonly Cell[]): Cell[] => { const s = setOf(b); return a.filter(([c, r]) => !s.has(K(c, r))); };
const shift = (cells: readonly Cell[], dx: number, dy: number): Cell[] => cells.map(([c, r]) => [c + dx, r + dy]);
const rectCells = (x: number, y: number, w: number, h: number): Cell[] => { const out: Cell[] = []; for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) out.push([c, r]); return out; };
function bbox(cells: readonly Cell[]) {
  const xs = cells.map((p) => p[0]), ys = cells.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Unit edges around the outside: each side of a shaded square that no other shaded square shares. */
export function gridPerimeter(cells: readonly Cell[]): number {
  const s = setOf(cells); let p = 0;
  for (const [c, r] of cells) for (const [dc, dr] of NB) if (!s.has(K(c + dc, r + dr))) p++;
  return p;
}
/** The twin of every square across a mirror line on grid line `at` (vertical: x = at; horizontal: y = at). */
export const mirrorCells = (cells: readonly Cell[], axis: Axis): Cell[] => cells.map(([c, r]): Cell => (axis.dir === 'v' ? [2 * axis.at - 1 - c, r] : [c, 2 * axis.at - 1 - r]));

export type SymLine = 'v' | 'h' | 'd1' | 'd2';
/** The lines of symmetry of a shape made of squares: tested by reflecting every square (up-down, side-side, and both diagonals when its box is square). */
export function gridLines(cells: readonly Cell[]): SymLine[] {
  if (!cells.length) return [];
  const { x0, x1, y0, y1 } = bbox(cells); const s = setOf(cells);
  const ok = (f: (c: number, r: number) => Cell) => cells.every(([c, r]) => s.has(K(...f(c, r))));
  const out: SymLine[] = [];
  if (ok((c, r) => [x0 + x1 - c, r])) out.push('v');
  if (ok((c, r) => [c, y0 + y1 - r])) out.push('h');
  if (x1 - x0 === y1 - y0) {
    if (ok((c, r) => [x0 + (r - y0), y0 + (c - x0)])) out.push('d1');
    if (ok((c, r) => [x0 + (y1 - r), y0 + (x1 - c)])) out.push('d2');
  }
  return out;
}
/** Does the shape land on itself when turned halfway (or a quarter) round? */
function turnsOntoItself(cells: readonly Cell[]): boolean {
  const { x0, x1, y0, y1 } = bbox(cells); const s = setOf(cells);
  return cells.every(([c, r]) => s.has(K(x0 + x1 - c, y0 + y1 - r)));
}
/**
 * The lines of symmetry of a shape made of squares, as segments a little longer than the shape (worked pictures).
 * `side` = how far a side-to-side line reaches past the shape: letters in a word stand one square apart, so their
 * lines stop short and never join into one long line.
 */
function gridLineSegs(cells: readonly Cell[], side = 0.6): Seg[] {
  const { x0, x1, y0, y1 } = bbox(cells); const e = 0.6;
  const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2;
  const segs: Record<SymLine, Seg> = {
    v: [[cx, y0 - e], [cx, y1 + 1 + e]], h: [[x0 - side, cy], [x1 + 1 + side, cy]],
    d1: [[x0 - e, y0 - e], [x1 + 1 + e, y1 + 1 + e]], d2: [[x0 - e, y1 + 1 + e], [x1 + 1 + e, y0 - e]],
  };
  return gridLines(cells).map((l) => segs[l]);
}

export interface Run { a: Pt; b: Pt; len: number; dir: 'R' | 'U' | 'L' | 'D' }
/**
 * The outline of a shape without holes, as straight runs walked anticlockwise from the bottom-left corner of the
 * bottom row: right along the bottom first. Shapes whose squares touch only at a corner are never generated.
 */
export function outlineRuns(cells: readonly Cell[]): Run[] {
  const s = setOf(cells); const next = new Map<string, { to: Pt; dir: Run['dir'] }>();
  for (const [c, r] of cells) {
    if (!s.has(K(c, r - 1))) next.set(K(c, r), { to: [c + 1, r], dir: 'R' });
    if (!s.has(K(c + 1, r))) next.set(K(c + 1, r), { to: [c + 1, r + 1], dir: 'U' });
    if (!s.has(K(c, r + 1))) next.set(K(c + 1, r + 1), { to: [c, r + 1], dir: 'L' });
    if (!s.has(K(c - 1, r))) next.set(K(c, r + 1), { to: [c, r], dir: 'D' });
  }
  const y0 = Math.min(...cells.map((p) => p[1]));
  const x0 = Math.min(...cells.filter((p) => p[1] === y0).map((p) => p[0]));
  const start: Pt = [x0, y0]; const runs: Run[] = []; let p: Pt = start;
  for (let guard = 0; guard < 4000; guard++) {
    const e = next.get(K(p[0], p[1])); if (!e) break;
    const last = runs[runs.length - 1];
    if (last && last.dir === e.dir) { last.b = e.to; last.len++; } else runs.push({ a: p, b: e.to, len: 1, dir: e.dir });
    p = e.to;
    if (p[0] === start[0] && p[1] === start[1]) break;
  }
  return runs;
}

function connected(cells: readonly Cell[]): boolean {
  if (!cells.length) return false;
  const s = setOf(cells); const seen = new Set([K(...cells[0])]); const stack: Cell[] = [cells[0]];
  while (stack.length) { const [c, r] = stack.pop()!; for (const [dc, dr] of NB) { const k = K(c + dc, r + dr); if (s.has(k) && !seen.has(k)) { seen.add(k); stack.push([c + dc, r + dr]); } } }
  return seen.size === s.size;
}
/** No empty square is closed in by the shape. */
function holeFree(cells: readonly Cell[]): boolean {
  const { x0, x1, y0, y1 } = bbox(cells); const s = setOf(cells);
  const out = new Set<string>(); const stack: Cell[] = [[x0 - 1, y0 - 1]]; out.add(K(x0 - 1, y0 - 1));
  while (stack.length) {
    const [c, r] = stack.pop()!;
    for (const [dc, dr] of NB) {
      const nc = c + dc, nr = r + dr, k = K(nc, nr);
      if (nc < x0 - 1 || nc > x1 + 1 || nr < y0 - 1 || nr > y1 + 1 || s.has(k) || out.has(k)) continue;
      out.add(k); stack.push([nc, nr]);
    }
  }
  return (x1 - x0 + 3) * (y1 - y0 + 3) === out.size + s.size;
}
/** No two squares touch only at a corner (the outline is then one clean loop). */
function pinchFree(cells: readonly Cell[]): boolean {
  const s = setOf(cells);
  return cells.every(([c, r]) => [[1, 1], [1, -1]].every(([dc, dr]) => !(s.has(K(c + dc, r + dr)) && !s.has(K(c + dc, r)) && !s.has(K(c, r + dr)))));
}
const tidy = (cells: readonly Cell[]) => connected(cells) && holeFree(cells) && pinchFree(cells);
/** No empty square sits between two shaded squares in a row or a column (no slot one square wide, whose walls' labels would collide). */
function slotFree(cells: readonly Cell[]): boolean {
  const s = setOf(cells); const { x0, x1, y0, y1 } = bbox(cells);
  for (let c = x0; c <= x1; c++) for (let r = y0; r <= y1; r++) {
    if (s.has(K(c, r))) continue;
    if ((s.has(K(c - 1, r)) && s.has(K(c + 1, r))) || (s.has(K(c, r - 1)) && s.has(K(c, r + 1)))) return false;
  }
  return true;
}

/** Grow a shape square by square from `start`, inside the allowed squares. Squares with more shaded neighbours are likelier, so shapes stay compact. */
function grow(rng: Rng, n: number, inside: (c: number, r: number) => boolean, start: Cell): Cell[] {
  const cells: Cell[] = [start]; const s = setOf(cells);
  while (cells.length < n) {
    const opts: Cell[] = [];
    for (const [c, r] of cells) for (const [dc, dr] of NB) { const p: Cell = [c + dc, r + dr]; if (inside(p[0], p[1]) && !s.has(K(p[0], p[1]))) opts.push(p); }
    if (!opts.length) break;
    const p = rng.pick(opts); cells.push(p); s.add(K(p[0], p[1]));
  }
  return cells;
}
/** Squares in each row that has any, top row first. */
const rowCounts = (cells: readonly Cell[]) => { const { y0, y1 } = bbox(cells); const out: number[] = []; for (let r = y1; r >= y0; r--) { const n = cells.filter((p) => p[1] === r).length; if (n) out.push(n); } return out; };

const gs = (w: number, h: number, cells: readonly Cell[], extra: Partial<GridV> = {}): GridV => ({ type: 'gridshape', w, h, cells: countOrder(cells), ...extra });
const sidesOf = (runs: Run[], text: (r: Run, i: number) => string): GridV['sides'] => runs.map((r, i) => ({ a: r.a, b: r.b, text: text(r, i) }));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/* ------------------------------------------------------------------ */
/* Choices                                                              */
/* ------------------------------------------------------------------ */

/** Number choices in order: the right value plus mistakes a child really makes (all positive whole numbers, all different; `halves` also allows .5). */
function numberChoices(right: number, wrong: number[], n: number, halves = false): QuestionChoice[] {
  const vals = [right];
  for (const w of wrong) if (vals.length < n && Number.isInteger(halves ? w * 2 : w) && w > 0 && !vals.includes(w)) vals.push(w);
  for (let k = 1; vals.length < n; k++) for (const w of [right + k, right - k]) if (vals.length < n && w > 0 && !vals.includes(w)) vals.push(w);
  return choicesFrom(vals.sort((a, b) => a - b));
}
/** The right count and its nearest neighbours from a pool (0 allowed): for lines of symmetry. */
function poolChoices(right: number, pool: number[], n: number): QuestionChoice[] {
  const near = [...new Set([right, ...pool])].sort((a, b) => Math.abs(a - right) - Math.abs(b - right) || a - b).slice(0, n);
  return choicesFrom(near.sort((a, b) => a - b));
}
const LETTER = ['A', 'B', 'C', 'D', 'E'];

/* ------------------------------------------------------------------ */
/* Mirror the picture (Grades 1, 3)                                     */
/* ------------------------------------------------------------------ */

function mirrorQ(d: number, rng: Rng): ContestSpec {
  const g1 = d <= 2;
  const dir: 'v' | 'h' = g1 ? 'v' : rng.pick(['v', 'h'] as const);
  const cfg = ({
    1: { w: [4, 6], h: [3, 4], n: [2, 4] }, 2: { w: [6, 8], h: [4, 6], n: [3, 7] },
    3: { w: [6, 8], h: [5, 6], n: [4, 8] }, 4: { w: [8, 9, 10], h: [6, 7], n: [5, 10] },
  } as Record<number, { w: number[]; h: number[]; n: number[] }>)[d];
  const mode = d === 1 ? (rng.chance(0.5) ? 'pick' : 'count') : d === 2 ? (rng.chance(0.35) ? 'pick' : 'partial') : d === 3 ? (rng.chance(0.45) ? 'pick' : 'partial') : rng.chance(0.5) ? 'partial' : 'total';
  // Built with a vertical mirror; a horizontal one is the same picture turned (columns and rows swapped).
  let w = 6, h = 4, a = 3, T: Cell[] = [], opts: { cells: Cell[]; why: string }[] = [];
  for (let t = 0; t < 80; t++) {
    w = rng.pick(cfg.w); h = rng.int(cfg.h[0], cfg.h[1]);
    a = d === 4 ? rng.int(3, w - 3) : w / 2;
    const m = Math.min(a, w - a);
    const n = Math.min(rng.int(cfg.n[0], cfg.n[1]), m * h - 1);
    T = grow(rng, n, (c, r) => c >= a - m && c < a && r >= 0 && r < h, [a - 1 - rng.int(0, Math.min(1, m - 1)), rng.int(0, h - 1)]);
    if (T.length !== n) continue;
    if (mode !== 'pick') break;
    const tw = mirrorCells(T, { dir: 'v', at: a });
    const right = union(T, tw);
    const slide = { cells: union(T, shift(T, m, 0)), why: 'slides the squares over without flipping them' };
    const upside = { cells: union(T, tw.map(([c, r]): Cell => [c, h - 1 - r])), why: dir === 'v' ? 'flips the squares upside down, not across the line' : 'flips the squares left to right, not across the line' };
    const i = rng.int(0, tw.length - 1); const moved = tw.map((p, j): Cell => (j === i ? [p[0], p[1] + rng.pick([1, -1])] : p));
    const off = { cells: union(T, moved), why: 'has one twin in the wrong place' };
    const offOk = moved[i][1] >= 0 && moved[i][1] < h && !setOf(tw).has(K(...moved[i]));
    const wrong = [slide, ...rng.shuffle([upside, ...(offOk ? [off] : [])])].slice(0, d === 1 ? 2 : 3);
    const all = [{ cells: right, why: '' }, ...wrong];
    if (wrong.length === (d === 1 ? 2 : 3) && new Set(all.map((o) => cellsKey(o.cells))).size === all.length) { opts = all; break; }
  }
  const tr = (cells: readonly Cell[]): Cell[] => (dir === 'h' ? cells.map(([c, r]): Cell => [r, c]) : [...cells]);
  const W = dir === 'h' ? h : w, H = dir === 'h' ? w : h; const axis: Axis = { dir, at: a };
  const n = T.length;
  const near = g1 ? 'Each twin is just as far from the line.' : 'Each twin is just as far from the mirror line as its square, straight across.';

  if (mode === 'pick' && opts.length) {
    const order = rng.shuffle(opts.map((_, i) => i)); // order[k] = which option sits in place k
    const rightPlace = order.indexOf(0);
    const steps = [
      g1 ? `The gold half has ${lab(n, 'squares')}. It needs ${lab(n, 'twins')}.` : `The gold half has ${lab(n, 'squares')}, so the finished picture needs ${lab(n, 'twins')} across the line.`,
      near,
      g1 ? `Picture ${LETTER[rightPlace]} flips every square across the line.` : `Picture ${LETTER[rightPlace]} flips every square over the line, so it is the mirror picture.`,
      ...order.map((oi, k) => (oi === 0 ? '' : `Picture ${LETTER[k]} ${opts[oi].why}.`)).filter(Boolean),
    ];
    return {
      prompt: g1 ? 'The dashed line is a mirror. Which picture finishes it?' : 'The dashed line is a mirror line. Which picture shows the finished mirror picture?',
      readAloud: g1 ? 'The dashed line is a mirror. Tap the picture that finishes the mirror picture.' : undefined,
      expression: 'the finished picture = ?', answer: rightPlace + 1, difficulty: d as Difficulty,
      hint: g1 ? 'Each square has a twin on the other side. The twin is just as far from the line.' : 'Each square has a twin straight across the line, just as far away. Check the squares nearest the line first.',
      steps, visual: gs(W, H, tr(T), { axis, ask: 'mirror' }), solutionVisual: gs(W, H, tr(T), { axis, ghost: tr(mirrorCells(T, { dir: 'v', at: a })) }),
      choices: order.map((oi, k) => ({ value: k + 1, label: `Picture ${LETTER[k]}`, visual: gs(W, H, tr(opts[oi].cells), { axis }) })),
    };
  }

  const tw = mirrorCells(T, { dir: 'v', at: a });
  if (mode === 'count') {
    return {
      prompt: 'The dashed line is a mirror. How many squares do you shade to finish the picture?',
      readAloud: 'The dashed line is a mirror. How many squares do you shade to finish the picture?',
      expression: 'squares to shade = ?', answer: n, difficulty: d as Difficulty,
      hint: 'Each gold square needs one twin across the line. Count the gold squares.',
      steps: [`Count the gold squares: ${lab(n, 'squares')}.`, `Each one needs a twin. So you shade ${lab(n, 'squares')}.`, near],
      visual: gs(W, H, tr(T), { axis, ask: 'mirror' }), solutionVisual: gs(W, H, tr(T), { axis, ghost: tr(tw) }),
      choices: numberChoices(n, [n + 1, n - 1, 2 * n], 3),
    };
  }
  // Some twins are shaded already (Grade 1: only twins; Grade 3: a square or two on the far side may need a twin too).
  const k = rng.int(1, Math.max(1, Math.ceil(n / 2)));
  const done = rng.shuffle(tw).slice(0, Math.min(k, n - 1));
  let extra: Cell[] = [];
  if (!g1) {
    const m = Math.min(a, w - a);
    const free = rectCells(a, 0, m, h).filter(([c, r]) => !setOf(tw).has(K(c, r)));
    extra = rng.shuffle(free).slice(0, d === 3 ? rng.int(0, 1) : rng.int(0, 2));
  }
  const S = union(T, done, extra);
  const need = minus(mirrorCells(S, { dir: 'v', at: a }), S);
  const ans = need.length;
  const total = S.length, paired = total - ans;
  const visual = gs(W, H, tr(S), { axis, ask: 'mirror' }); const solutionVisual = gs(W, H, tr(S), { axis, ghost: tr(need) });
  if (g1) {
    return {
      prompt: 'The dashed line is a mirror. Some twins are shaded already. How many more do you shade?',
      readAloud: 'The dashed line is a mirror. Some twins are shaded already. How many more squares do you shade?',
      expression: 'more squares to shade = ?', answer: ans, difficulty: d as Difficulty,
      hint: 'Look at each gold square on the left. Does it have a twin on the right yet?',
      steps: [
        `Left of the line: ${lab(n, 'gold squares')}. Each one needs a twin.`,
        `Right of the line: ${labn(done.length, 'twin')} done already.`,
        `${lab(n, 'twins needed')} − ${lab(done.length, unit(done.length, 'twin') + ' done')} = ${lab(ans, unit(ans, 'more square', 'more squares'))}.`,
        near,
      ],
      visual, solutionVisual, choices: numberChoices(ans, [n, ans + 1, ans - 1], 4),
    };
  }
  const base = [
    `The picture has ${lab(total, 'gold squares')}.`,
    paired ? `${lab(paired, unit(paired, 'gold square'))} already ${paired === 1 ? 'has' : 'have'} a gold twin across the line.` : 'No gold square has its twin yet.',
    paired ? `${lab(total, 'gold squares')} − ${lab(paired, unit(paired, 'square with a twin', 'squares with twins'))} = ${lab(ans, unit(ans, 'square to shade', 'squares to shade'))}.` : `So every one needs a twin: ${lab(ans, unit(ans, 'square to shade', 'squares to shade'))}.`,
    near,
  ];
  if (mode === 'total') {
    return {
      prompt: 'Finish the mirror picture across the dashed line. How many squares will be shaded in all?',
      expression: 'shaded squares in all = ?', answer: total + ans, difficulty: d as Difficulty,
      hint: 'Find the gold squares whose twin across the line is still empty. Add those to the squares already shaded.',
      steps: [...base, `${lab(total, 'gold squares now')} + ${labn(ans, 'new twin')} = ${lab(total + ans, 'squares in all')}.`],
      visual, solutionVisual,
    };
  }
  return {
    prompt: 'The dashed line is a mirror line. How many more squares must be shaded so both sides match?',
    expression: 'more squares to shade = ?', answer: ans, difficulty: d as Difficulty,
    hint: 'Check each gold square: is its twin across the line gold too? Count the squares still missing a twin.',
    steps: base, visual, solutionVisual,
    choices: d === 3 ? numberChoices(ans, [total, ans + 1, ans - 1, total + ans], 4) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Lines of symmetry (Grades 3, 5)                                      */
/* ------------------------------------------------------------------ */

/** Blocky capital letters, 3 squares wide and 5 tall (top row first). */
const LETTERS: Record<string, string[]> = {
  H: ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'], I: ['XXX', '.X.', '.X.', '.X.', 'XXX'], O: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  T: ['XXX', '.X.', '.X.', '.X.', '.X.'], A: ['XXX', 'X.X', 'XXX', 'X.X', 'X.X'], U: ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
  E: ['XXX', 'X..', 'XXX', 'X..', 'XXX'], C: ['XXX', 'X..', 'X..', 'X..', 'XXX'], L: ['X..', 'X..', 'X..', 'X..', 'XXX'],
  F: ['XXX', 'X..', 'XXX', 'X..', 'X..'], P: ['XXX', 'X.X', 'XXX', 'X..', 'X..'], S: ['XXX', 'X..', 'XXX', '..X', 'XXX'],
  J: ['XXX', '..X', '..X', 'X.X', 'XXX'],
};
export const letterCells = (ch: string, x = 0, y = 0): Cell[] => LETTERS[ch].flatMap((row, i) => [...row].flatMap((m, c): Cell[] => (m === 'X' ? [[x + c, y + 4 - i]] : [])));
const WORDS = ['HAT', 'HOT', 'TOE', 'ICE', 'LIE', 'FOE', 'SUE', 'ELF', 'OIL', 'LOT', 'PIE', 'TIP', 'POT', 'CAT', 'COT', 'HUT', 'PUT', 'CUP', 'TOP', 'HIP', 'HOP', 'LIP', 'FIT', 'ACE', 'APE', 'EAT', 'TEA', 'SEA', 'SIP', 'SET', 'SAT', 'CUT', 'OAT', 'JET', 'JOT', 'PAL', 'SPA', 'LAP', 'CAP', 'TAP', 'HUE', 'CUE'];

export type Sym = 'v' | 'h' | 'd' | 'vh' | 'dd' | 'all4' | 'rot2' | 'rot4' | 'none';
/** How many lines of symmetry each kind of shape has (rot2, rot4 and none have no lines). */
export const SYM_LINES: Record<Sym, number> = { v: 1, h: 1, d: 1, vh: 2, dd: 2, all4: 4, rot2: 0, rot4: 0, none: 0 };
/** One shape of each kind, used only if building a fresh one keeps failing (top row first, like the letters). */
export const SYM_SPARE: Record<Sym, string[]> = {
  v: ['XXX', '.X.', '.X.'], h: ['XX.', 'XXX', 'XX.'], d: ['X..', 'XX.', 'XXX'], vh: ['X.X', 'XXX', 'X.X'], dd: ['XX.', 'XXX', '.XX'],
  all4: ['.X.', 'XXX', '.X.'], rot2: ['XX.', '.X.', '.XX'], rot4: ['.X..', '.XXX', 'XXX.', '..X.'], none: ['XX.', '.XX', '.X.'],
};
const fromRows = (rows: string[]): Cell[] => rows.flatMap((row, i) => [...row].flatMap((m, c): Cell[] => (m === 'X' ? [[c, rows.length - 1 - i]] : [])));
/**
 * A connected shape filling a W × H box with exactly the lines of symmetry its kind gives. A connected piece is grown
 * from a random square and then joined by its mirror images (or its turns), so the copies meet wherever the piece
 * reaches the fold; shapes that come apart, leave the box unfilled or pick up extra lines are thrown away.
 */
export function buildSymShape(rng: Rng, sym: Sym, W: number, H: number): Cell[] | null {
  const square = ['d', 'dd', 'all4', 'rot4'].includes(sym); if (square) H = W;
  const V = ([c, r]: Cell): Cell => [W - 1 - c, r], Hh = ([c, r]: Cell): Cell => [c, H - 1 - r];
  const D = ([c, r]: Cell): Cell => [r, c], D2 = ([c, r]: Cell): Cell => [W - 1 - r, W - 1 - c];
  const R2 = ([c, r]: Cell): Cell => [W - 1 - c, H - 1 - r], R4 = ([c, r]: Cell): Cell => [W - 1 - r, c];
  const ops = { v: [V], h: [Hh], d: [D], vh: [V, Hh], dd: [D, D2], all4: [V, Hh, D], rot2: [R2], rot4: [R4], none: [] }[sym];
  const inBox = (c: number, r: number) => c >= 0 && r >= 0 && c < W && r < H;
  for (let t = 0; t < 600; t++) {
    let cells: Cell[];
    if (sym === 'none') cells = grow(rng, rng.int(Math.ceil(W * H * 0.4), Math.ceil(W * H * 0.6)), inBox, [rng.int(0, W - 1), rng.int(0, H - 1)]);
    else {
      // the piece is about the share of the shape one copy covers: a half for one fold, a quarter or an eighth for more
      const k = { v: 2, h: 2, d: 2, rot2: 2, vh: 4, dd: 4, rot4: 4, all4: 8 }[sym];
      cells = grow(rng, rng.int(Math.max(2, Math.ceil((W * H * 0.3) / k)), Math.max(4, Math.ceil((W * H * 0.8) / k))), inBox, [rng.int(0, W - 1), rng.int(0, H - 1)]);
      for (let grew = true; grew;) { grew = false; for (const op of ops) { const more = union(cells, cells.map(op)); if (more.length > cells.length) { cells = more; grew = true; } } }
    }
    const b = bbox(cells);
    if (b.x0 !== 0 || b.y0 !== 0 || b.x1 !== W - 1 || b.y1 !== H - 1 || !connected(cells)) continue;
    if (cells.length < 4 || cells.length > W * H * 0.8) continue;
    if (gridLines(cells).length !== SYM_LINES[sym]) continue;
    if ((sym === 'rot2' || sym === 'rot4') && !turnsOntoItself(cells)) continue;
    return cells;
  }
  return null;
}
const symShape = (rng: Rng, sym: Sym, W: number, H: number): Cell[] => buildSymShape(rng, sym, W, H) ?? fromRows(SYM_SPARE[sym]);
/** Which kinds of symmetric shape each difficulty draws, and the box sizes it draws them in. */
export const SYM_POOL: Record<number, Sym[]> = { 3: ['v', 'h', 'vh', 'none'], 4: ['v', 'h', 'vh', 'd', 'all4', 'rot2', 'none'], 5: ['d', 'dd', 'all4', 'rot4', 'vh'], 6: ['all4', 'dd', 'rot4', 'rot2', 'd'] };
export const SYM_SIZE: Record<number, [number, number]> = { 3: [3, 4], 4: [4, 5], 5: [4, 6], 6: [4, 6] };
const symFor = (d: number, rng: Rng): Sym => rng.pick(SYM_POOL[d]);

interface PolyDef { name: string; desc: string; pts: Pt[]; w: number; h: number; lines: number; why: string[]; regular?: boolean }
const reg = (k: number, R: number, cx: number, cy: number, start: number): Pt[] => Array.from({ length: k }, (_, i) => {
  const a = ((start + (360 * i) / k) * Math.PI) / 180; return [Math.round((cx + R * Math.cos(a)) * 1e4) / 1e4, Math.round((cy + R * Math.sin(a)) * 1e4) / 1e4];
});
const POLYS: Record<string, PolyDef> = {
  square: { name: 'a square', desc: 'All four sides are equal and every corner is a square corner.', pts: [[1, 0.5], [5, 0.5], [5, 4.5], [1, 4.5]], w: 6, h: 5, lines: 4, why: ['The up-and-down line and the side-to-side line through the middle both work: the halves match.', 'Both diagonals work too: each folds one corner onto the opposite corner.', `${lab(2, 'straight lines')} + ${lab(2, 'diagonals')} = ${lab(4, 'lines of symmetry')}.`] },
  rectangle: { name: 'a rectangle', desc: 'It is longer than it is tall, with four square corners.', pts: [[0.5, 1], [6.5, 1], [6.5, 4], [0.5, 4]], w: 7, h: 5, lines: 2, why: ['The up-and-down line and the side-to-side line through the middle both work: the halves match.', 'A diagonal does not: fold along it and the corners miss each other.', `So it has ${lab(2, 'lines of symmetry')}.`] },
  equilateral: { name: 'an equilateral triangle', desc: 'All three sides are the same length.', pts: reg(3, 2.6, 3, 1.8, 90), w: 6, h: 5, lines: 3, regular: true, why: ['A line from any corner to the middle of the side across from it works: the halves match.', `It has ${lab(3, 'corners')}, so it has ${lab(3, 'lines of symmetry')}.`] },
  isosceles: { name: 'an isosceles triangle', desc: 'Two sides are the same length, and the bottom side is shorter.', pts: [[1.2, 0.5], [4.8, 0.5], [3, 4.6]], w: 6, h: 5, lines: 1, why: ['The up-and-down line from the top corner to the middle of the bottom works: the halves match.', 'Any other line puts a long side on a short side.', `So it has ${lab(1, 'line of symmetry')}.`] },
  scalene: { name: 'a scalene triangle', desc: 'All three sides have different lengths.', pts: [[0.6, 0.6], [5.4, 0.6], [1.8, 4.2]], w: 6, h: 5, lines: 0, why: ['Every line puts a side onto a side of a different length, so no line works.', `So it has ${lab(0, 'lines of symmetry')}.`] },
  right: { name: 'a right isosceles triangle', desc: 'It has one square corner and two equal sides beside it.', pts: [[1, 0.5], [5, 0.5], [1, 4.5]], w: 6, h: 5, lines: 1, why: ['The slanted line through the square corner works: the two equal sides land on each other.', 'An up-and-down line or a side-to-side line does not.', `So it has ${lab(1, 'line of symmetry')}.`] },
  hexagon: { name: 'a regular hexagon', desc: 'All six sides and all six corners are the same.', pts: reg(6, 2.4, 3, 2.5, 0), w: 6, h: 5, lines: 6, regular: true, why: [`Lines from a corner to the opposite corner: ${lab(3, 'lines')}. Lines from the middle of a side to the middle of the opposite side: ${lab(3, 'lines')}.`, `${lab(3, 'lines')} + ${lab(3, 'lines')} = ${lab(6, 'lines of symmetry')}.`] },
  pentagon: { name: 'a regular pentagon', desc: 'All five sides and all five corners are the same.', pts: reg(5, 2.4, 3, 2.4, 90), w: 6, h: 5, lines: 5, regular: true, why: ['A line from each corner to the middle of the side across from it works: the halves match.', `It has ${lab(5, 'corners')}, so it has ${lab(5, 'lines of symmetry')}.`] },
  octagon: { name: 'a regular octagon', desc: 'All eight sides and all eight corners are the same.', pts: reg(8, 2.6, 3, 3, 22.5), w: 6, h: 6, lines: 8, regular: true, why: [`Lines from a corner to the opposite corner: ${lab(4, 'lines')}. Lines from the middle of a side to the middle of the opposite side: ${lab(4, 'lines')}.`, `${lab(4, 'lines')} + ${lab(4, 'lines')} = ${lab(8, 'lines of symmetry')}.`] },
  rhombus: { name: 'a rhombus', desc: 'All four sides are equal, but no corner is a square corner.', pts: [[0.5, 2.5], [3, 0.5], [5.5, 2.5], [3, 4.5]], w: 6, h: 5, lines: 2, why: ['Both lines from a corner to the opposite corner work: the halves match.', 'A line through the middles of two opposite sides does not: the slanted sides miss each other.', `So it has ${lab(2, 'lines of symmetry')}.`] },
  kite: { name: 'a kite', desc: 'Two short sides meet at the top and two long sides meet at the bottom.', pts: [[3, 4.6], [5, 3.2], [3, 0.4], [1, 3.2]], w: 6, h: 5, lines: 1, why: ['The up-and-down line from the top corner to the bottom corner works: the halves match.', 'The side-to-side line does not: a short side lands on a long side.', `So it has ${lab(1, 'line of symmetry')}.`] },
  parallelogram: { name: 'a parallelogram', desc: 'Opposite sides are equal and slanted, and no corner is a square corner.', pts: [[0.5, 0.8], [4.5, 0.8], [5.5, 4.2], [1.5, 4.2]], w: 6, h: 5, lines: 0, why: ['No line works: fold it any way and the slanted sides lean the wrong way and miss. It looks the same turned halfway round, but turning is not folding.', `So it has ${lab(0, 'lines of symmetry')}.`] },
  trapezoid: { name: 'an isosceles trapezoid', desc: 'The top and bottom are parallel, and the two slanted sides are equal.', pts: [[0.5, 0.8], [5.5, 0.8], [4, 4.2], [2, 4.2]], w: 6, h: 5, lines: 1, why: ['The up-and-down line through the middle works: the halves match.', 'The side-to-side line does not: the short top lands on the long bottom.', `So it has ${lab(1, 'line of symmetry')}.`] },
};
const POLY_SETS: Record<number, string[]> = {
  3: ['square', 'rectangle', 'equilateral', 'isosceles', 'scalene', 'hexagon'],
  4: ['square', 'rectangle', 'equilateral', 'isosceles', 'scalene', 'hexagon', 'rhombus', 'kite'],
  // no hexagon at Grade 5: the Grade 5 lesson works the hexagon, so its tries apply the rule to other regular shapes
  5: ['pentagon', 'octagon', 'rhombus', 'kite', 'parallelogram', 'trapezoid', 'right', 'equilateral'],
  6: ['pentagon', 'octagon', 'parallelogram', 'trapezoid', 'right', 'rhombus', 'kite'],
};
/** The lines of symmetry of a polygon: every one passes through the centre and through a corner or the middle of a side. */
export function polyLines(pts: readonly Pt[]): Seg[] {
  const n = pts.length; const cx = sum(pts.map((p) => p[0])) / n, cy = sum(pts.map((p) => p[1])) / n;
  const R = Math.max(...pts.map(([x, y]) => Math.hypot(x - cx, y - cy))) * 1.18;
  const targets: Pt[] = [...pts, ...pts.map((p, i): Pt => [(p[0] + pts[(i + 1) % n][0]) / 2, (p[1] + pts[(i + 1) % n][1]) / 2])];
  const angles: number[] = [];
  for (const [tx, ty] of targets) {
    const th = Math.atan2(ty - cy, tx - cx); const ux = Math.cos(th), uy = Math.sin(th);
    const refl = pts.map(([x, y]): Pt => { const dx = x - cx, dy = y - cy, dot = dx * ux + dy * uy; return [cx + 2 * dot * ux - dx, cy + 2 * dot * uy - dy]; });
    if (!refl.every(([x, y]) => pts.some(([px, py]) => Math.hypot(px - x, py - y) < 1e-3))) continue;
    const a = ((th % Math.PI) + Math.PI) % Math.PI;
    if (!angles.some((b) => Math.abs(b - a) < 1e-3 || Math.abs(Math.abs(b - a) - Math.PI) < 1e-3)) angles.push(a);
  }
  return angles.map((a): Seg => [[cx - R * Math.cos(a), cy - R * Math.sin(a)], [cx + R * Math.cos(a), cy + R * Math.sin(a)]]);
}

/** Fold-by-fold reasons for a shape made of squares. */
function foldSteps(cells: readonly Cell[]): string[] {
  const has = gridLines(cells); const { x0, x1, y0, y1 } = bbox(cells); const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const yes = (l: SymLine) => has.includes(l);
  const out = [
    `Fold on the up-and-down line through the middle: ${yes('v') ? 'the two halves match.' : 'the halves miss each other.'}`,
    `Fold on the side-to-side line through the middle: ${yes('h') ? 'the halves match.' : 'the halves miss each other.'}`,
  ];
  if (bw === bh) out.push(`Fold on the diagonal from bottom left to top right: ${yes('d1') ? 'the halves match.' : 'they miss.'}`, `Fold on the other diagonal: ${yes('d2') ? 'the halves match.' : 'they miss.'}`);
  else out.push(`A slanted fold cannot work: the shape is ${bw > bh ? 'wider than it is tall' : 'taller than it is wide'}.`);
  if (!has.length && turnsOntoItself(cells)) out.push('It looks balanced because it turns onto itself, but turning is not folding.');
  out.push(`That makes ${lab(has.length, unit(has.length, 'line of symmetry', 'lines of symmetry'))}.`);
  return out;
}

function linesQ(d: number, rng: Rng): ContestSpec {
  const src = d === 3 ? rng.pick(['letter', 'letter', 'poly', 'poly', 'grid', 'grid', 'grid'] as const)
    : d === 4 ? rng.pick(['letter', 'poly', 'grid', 'grid'] as const)
      : d === 5 ? rng.pick(['poly', 'grid'] as const) : rng.pick(['word', 'word', 'grid', 'poly'] as const);
  const hint = 'Fold the shape in your head. A fold is a line of symmetry when the two halves land exactly on each other. Try the up-and-down line, the side-to-side line and both diagonals.';
  const choices = (ans: number) => (d === 3 ? poolChoices(ans, [0, 1, 2, 3, 4, 6], 4) : d === 4 ? poolChoices(ans, [0, 1, 2, 3, 4, 6, 8], 5) : undefined);
  if (src === 'poly') {
    const p = POLYS[rng.pick(POLY_SETS[d])];
    const visual = gs(p.w, p.h, [], { poly: p.pts, plain: true, ask: 'lines' });
    return {
      prompt: `This is ${p.name}. ${p.desc} How many lines of symmetry does it have?`,
      expression: 'lines of symmetry = ?', answer: p.lines, difficulty: d as Difficulty,
      hint: 'Try folding through each corner and through the middle of each side. A fold counts only when the two halves land exactly on each other.',
      steps: [...p.why, ...(p.regular && d >= 5 ? ['A regular shape has as many lines of symmetry as it has sides.'] : [])],
      visual, solutionVisual: { ...visual, ask: undefined, lines: polyLines(p.pts) },
      choices: d === 5 ? poolChoices(p.lines, [0, 1, 2, 3, 4, 5, 6, 8], 5) : choices(p.lines),
    };
  }
  if (src === 'letter') {
    const ch = rng.pick(Object.keys(LETTERS)); const cells = letterCells(ch, 1, 1); const n = gridLines(cells).length;
    const visual = gs(5, 7, cells, { ask: 'lines' });
    return {
      prompt: `This is the letter ${ch}, drawn with squares. How many lines of symmetry does it have?`,
      expression: 'lines of symmetry = ?', answer: n, difficulty: d as Difficulty, hint,
      steps: foldSteps(cells), visual, solutionVisual: { ...visual, ask: undefined, lines: gridLineSegs(cells) }, choices: choices(n),
    };
  }
  if (src === 'word') {
    const word = rng.pick(WORDS); const parts = [...word].map((ch, i) => ({ ch, cells: letterCells(ch, 1 + 4 * i, 1) }));
    const counts = parts.map((p) => gridLines(p.cells).length); const total = sum(counts);
    const fold = (ls: SymLine[]) => (ls.includes('v') && ls.includes('h') ? 'the up-and-down line and the side-to-side line' : ls.includes('v') ? 'the up-and-down line only' : ls.includes('h') ? 'the side-to-side line only' : 'no line works');
    const visual = gs(13, 7, parts.flatMap((p) => p.cells), { ask: 'lines' });
    return {
      prompt: `The word ${word} is drawn with squares. Find the lines of symmetry of each letter, then add them up. How many lines of symmetry are there in all?`,
      expression: 'lines of symmetry in all = ?', answer: total, difficulty: d as Difficulty,
      hint: 'Take one letter at a time. Try the up-and-down line, then the side-to-side line. The letters are taller than they are wide, so slanted lines never work.',
      steps: [
        ...parts.map((p, i) => `${p.ch}: ${lab(counts[i], unit(counts[i], 'line', 'lines'))}, ${fold(gridLines(p.cells))}.`),
        `${counts.map((c) => lab(c, unit(c, 'line', 'lines'))).join(' + ')} = ${lab(total, unit(total, 'line of symmetry', 'lines of symmetry'))}.`,
      ],
      visual, solutionVisual: { ...visual, ask: undefined, lines: parts.flatMap((p) => gridLineSegs(p.cells, 0.2)) },
    };
  }
  const sym = symFor(d, rng); const size = SYM_SIZE[d];
  const cells = shift(symShape(rng, sym, rng.int(size[0], size[1]), rng.int(size[0], size[1])), 1, 1);
  const { x1, y1 } = bbox(cells); const n = gridLines(cells).length;
  const visual = gs(x1 + 2, y1 + 2, cells, { ask: 'lines' });
  return {
    prompt: 'How many lines of symmetry does the gold shape have?',
    expression: 'lines of symmetry = ?', answer: n, difficulty: d as Difficulty, hint,
    steps: foldSteps(cells), visual, solutionVisual: { ...visual, ask: undefined, lines: gridLineSegs(cells) }, choices: choices(n),
  };
}

/* ------------------------------------------------------------------ */
/* Area (Grades 1, 3, 5)                                                */
/* ------------------------------------------------------------------ */

function rowSteps(cells: readonly Cell[], what = 'squares'): string {
  const rows = rowCounts(cells); const n = cells.length;
  return rows.length > 1 ? `Row by row from the top: ${rows.map((x) => labn(x, 'square')).join(' + ')} = ${lab(n, what)}.` : `One row of ${lab(n, what)}.`;
}

function areaQ(d: number, rng: Rng): ContestSpec {
  if (d <= 2) return rng.chance(d === 1 ? 0.35 : 0.45) ? compareQ(d, rng) : countQ(d, rng);
  if (d <= 4) { const r = rng.next(); return r < (d === 3 ? 0.3 : 0.15) ? rectAreaQ(d, rng) : r < 0.65 ? lAreaQ(d, rng) : halvesQ(d, rng); }
  return rng.chance(d === 5 ? 0.7 : 0.55) ? compositeAreaQ(d, rng) : triangleQ(d, rng);
}

/** Grade 1: count the gold squares. */
function countQ(d: number, rng: Rng): ContestSpec {
  let w = 5, h = 3, cells: Cell[] = [];
  for (let t = 0; t < 60; t++) {
    w = d === 1 ? rng.int(4, 6) : rng.int(6, 8); h = d === 1 ? rng.int(3, 4) : rng.int(4, 6);
    const n = d === 1 ? rng.int(3, 8) : rng.int(8, 16);
    cells = grow(rng, n, (c, r) => c >= 0 && r >= 0 && c < w && r < h, [rng.int(0, w - 1), rng.int(0, h - 1)]);
    if (cells.length === n) break;
  }
  const n = cells.length;
  return {
    prompt: 'How many squares are shaded?',
    readAloud: 'Count the gold squares. Touch each one once. How many are there?',
    expression: 'gold squares = ?', answer: n, difficulty: d as Difficulty,
    hint: 'Count one row at a time. Touch each square once.',
    steps: [rowSteps(cells), 'The worked picture numbers each square once.'],
    visual: gs(w, h, cells, { ask: 'area' }), solutionVisual: gs(w, h, cells, { count: true }),
    choices: d === 1 ? numberChoices(n, [n + 1, n - 1], 3) : numberChoices(n, [n - 1, n + 1, n + 2], 4),
  };
}
/** Grade 1: which of two shapes has more squares? The spread-out one often has fewer. */
function compareQ(d: number, rng: Rng): ContestSpec {
  let A: Cell[] = [], B: Cell[] = [], wa = 3, wb = 4, h = 4;
  for (let t = 0; t < 100; t++) {
    h = rng.int(3, 4); wa = rng.int(3, 4); wb = rng.int(3, 4);
    const big = d === 1 ? rng.int(5, 8) : rng.int(7, 12); const small = big - (d === 1 ? rng.int(1, 3) : rng.int(1, 2));
    const compact = (n: number, w: number) => grow(rng, n, (c, r) => c >= 0 && r >= 0 && c < w && r < h, [0, 0]);
    // the bigger shape stays compact in a corner; the smaller one spreads across its whole box
    const bigCells = compact(big, Math.min(wa, wb)); const wideW = Math.max(wa, wb);
    const smallCells = grow(rng, small, (c, r) => c >= 0 && r >= 0 && c < wideW && r < h, [rng.int(0, wideW - 1), rng.int(0, h - 1)]);
    if (bigCells.length !== big || smallCells.length !== small) continue;
    const bigLeft = rng.chance(0.5);
    const left0 = (cs: Cell[]) => shift(cs, -bbox(cs).x0, 0);
    const [a0, b0] = bigLeft ? [left0(bigCells), left0(smallCells)] : [left0(smallCells), left0(bigCells)];
    // Grade 1 pictures stay small: both shapes and the gap fit in 8 squares across
    if (bbox(a0).x1 + 1 + 1 + bbox(b0).x1 + 1 > 8) continue;
    [A, B] = [a0, b0]; wa = bbox(A).x1 + 1; wb = bbox(B).x1 + 1;
    break;
  }
  if (!A.length || !B.length) { h = 3; A = rectCells(0, 0, 2, 3); B = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]]; wa = 2; wb = 4; }
  const na = A.length, nb = B.length; const right = na > nb ? 1 : 2;
  const all = union(A, shift(B, wa + 1, 0));
  return {
    prompt: 'Which shape has more squares?',
    readAloud: 'Count the squares in each shape. Tap the shape with more squares.',
    expression: 'the shape with more squares = ?', answer: right, difficulty: d as Difficulty,
    hint: 'Count each shape one square at a time. A shape that spreads out is not always bigger.',
    steps: [
      `Left shape: ${lab(na, 'squares')}.`, `Right shape: ${lab(nb, 'squares')}.`,
      `${lab(Math.max(na, nb), 'squares')} is more than ${lab(Math.min(na, nb), 'squares')}, so the ${right === 1 ? 'left' : 'right'} shape has more.`,
    ],
    visual: gs(wa + 1 + wb, h, all, { ask: 'area' }), solutionVisual: gs(wa + 1 + wb, h, all, { count: true }),
    choices: [{ value: 1, label: 'Left shape', visual: gs(wa, h, A) }, { value: 2, label: 'Right shape', visual: gs(wb, h, B) }],
  };
}
/** Grade 3: a rectangle of squares, rows × squares in each row. */
function rectAreaQ(d: number, rng: Rng): ContestSpec {
  const rows = rng.int(2, d === 3 ? 5 : 7), cols = rng.int(3, d === 3 ? 7 : 9);
  const w = cols + rng.int(0, 2), h = rows + rng.int(0, 1); const x = rng.int(0, w - cols), y = rng.int(0, h - rows);
  const cells = rectCells(x, y, cols, rows); const A = rows * cols;
  return {
    prompt: 'What is the area of the gold rectangle, counted in squares?',
    expression: 'area = ? squares', answer: A, difficulty: d as Difficulty,
    hint: 'How many squares are in one row? How many rows are there? You do not need to count them one by one.',
    steps: [`One row has ${lab(cols, 'squares')}, and there are ${lab(rows, 'rows')}.`, `${lab(rows, 'rows')} × ${lab(cols, 'squares in each row')} = ${lab(A, 'squares')}.`],
    visual: gs(w, h, cells, { ask: 'area' }),
    solutionVisual: gs(w, h, cells, { sides: [{ a: [x, y], b: [x + cols, y], text: String(cols) }, { a: [x, y], b: [x, y + rows], text: String(rows) }] }),
    choices: d === 3 ? numberChoices(A, [2 * (rows + cols), A - cols, A + cols, rows + cols], 4) : undefined,
  };
}
/** Grade 3: an L-shape, split into two rectangles. */
function lAreaQ(d: number, rng: Rng): ContestSpec {
  const W = rng.int(4, d === 3 ? 6 : 8), H = rng.int(3, d === 3 ? 5 : 6), a = rng.int(1, W - 2), b = rng.int(1, H - 1);
  let cells = minus(rectCells(0, 0, W, H), rectCells(W - a, H - b, a, b));
  const fx = rng.chance(0.5), fy = rng.chance(0.4);
  const tf = (p: Cell): Cell => [fx ? W - 1 - p[0] : p[0], fy ? H - 1 - p[1] : p[1]];
  cells = cells.map(tf);
  const A1 = W * (H - b), A2 = (W - a) * b, A = A1 + A2;
  const ySplit = fy ? b : H - b; const split: Seg = [[-0.3, ySplit], [W + 0.3, ySplit]];
  return {
    prompt: d === 3 ? 'What is the area of the gold shape, counted in squares?' : 'What is the area of the gold shape, in squares? Use rectangles to count quickly.',
    expression: 'area = ? squares', answer: A, difficulty: d as Difficulty,
    hint: 'Cut the shape into two rectangles with one straight line. Find each one\'s area, then add.',
    steps: [
      'Cut the shape into two rectangles along the dashed line.',
      `Wide part: ${labn(H - b, 'row')} × ${labn(W, 'square in each row', 'squares in each row')} = ${lab(A1, 'squares')}.`,
      `Narrow part: ${labn(b, 'row')} × ${labn(W - a, 'square in each row', 'squares in each row')} = ${lab(A2, 'squares')}.`,
      `${lab(A1, 'squares')} + ${lab(A2, 'squares')} = ${lab(A, 'squares')}.`,
    ],
    visual: gs(W, H, cells, { ask: 'area' }), solutionVisual: gs(W, H, cells, { lines: [split] }),
    choices: d === 3 ? numberChoices(A, [W * H, A + 1, A - 1, gridPerimeter(cells)], 4) : undefined,
  };
}
/** Grade 3: whole squares and half squares (always an even number of halves, so the area is a whole number). */
function halvesQ(d: number, rng: Rng): ContestSpec {
  const shape = rng.pick(d === 3 ? (['stairs', 'house', 'para'] as const) : (['stairs', 'house', 'para', 'house'] as const));
  let full: Cell[] = [], halves: [number, number, 0 | 1 | 2 | 3][] = [], w = 4, h = 4, name = 'shape';
  if (shape === 'stairs') {
    const k = d === 3 ? 4 : rng.pick([4, 6]); name = 'triangle';
    for (let c = 0; c < k; c++) for (let r = 0; r < k; r++) { if (c + r <= k - 2) full.push([c, r]); else if (c + r === k - 1) halves.push([c, r, 0]); }
    w = k; h = k;
    if (rng.chance(0.5)) { full = full.map(([c, r]): Cell => [k - 1 - c, r]); halves = halves.map(([c, r]) => [k - 1 - c, r, 1]); }
  } else if (shape === 'house') {
    const m = d === 3 ? 1 : rng.pick([1, 2]); const hb = rng.int(1, d === 3 ? 2 : 3); name = 'house';
    full = rectCells(0, 0, 2 * m, hb);
    for (let j = 0; j < m; j++) { const r = hb + j; halves.push([j, r, 1], [2 * m - 1 - j, r, 0]); for (let c = j + 1; c < 2 * m - 1 - j; c++) full.push([c, r]); }
    w = 2 * m + 1; h = hb + m;
  } else {
    const rows = rng.int(1, d === 3 ? 2 : 3), cols = rng.int(2, d === 3 ? 4 : 5); name = 'slanted shape';
    for (let r = 0; r < rows; r++) { halves.push([r, r, 1], [r + cols + 1, r, 3]); for (let c = r + 1; c <= r + cols; c++) full.push([c, r]); }
    w = cols + rows + 1; h = rows;
  }
  const F = full.length, Hn = halves.length, A = F + Hn / 2;
  const dy = h <= 4 ? 1 : 0;
  const cells = shift(full, 1, dy); const hv = halves.map(([c, r, k]): [number, number, 0 | 1 | 2 | 3] => [c + 1, r + dy, k]);
  const W = w + 2, Hh = h + 2 * dy;
  return {
    prompt: `Two half squares make one whole square. What is the area of the gold ${name}, in squares?`,
    expression: 'area = ? squares', answer: A, difficulty: d as Difficulty,
    hint: 'Count the whole squares first. Then pair up the half squares: each pair makes one more whole square.',
    steps: [
      `Whole squares: ${lab(F, 'squares')}.`,
      `Half squares: ${lab(Hn, 'halves')}. Two halves make one whole: ${lab(Hn, 'halves')} ÷ 2 = ${lab(Hn / 2, unit(Hn / 2, 'whole square', 'whole squares'))}.`,
      `${lab(F, 'squares')} + ${lab(Hn / 2, unit(Hn / 2, 'square'))} = ${lab(A, 'squares')}.`,
    ],
    visual: gs(W, Hh, cells, { halves: hv, ask: 'area' }), solutionVisual: gs(W, Hh, cells, { halves: hv, count: true }),
    choices: d === 3 ? numberChoices(A, [F + Hn, F, A + 1, A - 1], 4) : undefined,
  };
}

/* ---------- Grade 5: composite shapes drawn to scale, read by their labels ---------- */

interface Composite { cells: Cell[]; W: number; H: number; runs: Run[]; kind: 'L' | 'U' | 'stair'; p: Record<string, number> }
/** The run of the outline at grid point a going to b (or null). */
const runAt = (runs: Run[], pred: (r: Run) => boolean) => runs.findIndex(pred);
function composite(rng: Rng, kind: Composite['kind']): Composite {
  if (kind === 'L') {
    const W = rng.int(8, 14), H = rng.int(6, 11), a = rng.int(2, W - 3), b = rng.int(2, H - 3);
    const cells = minus(rectCells(0, 0, W, H), rectCells(W - a, H - b, a, b));
    return { cells, W, H, runs: outlineRuns(cells), kind, p: { a, b } };
  }
  if (kind === 'U') {
    // the notch is at least 3 wide, so a label fits beside each of its walls
    const W = rng.int(9, 15), H = rng.int(6, 11), a = rng.int(3, W - 6), p = rng.int(2, W - a - 2), b = rng.int(a === 3 ? 3 : 2, H - 3); // a 3-wide notch is at least 3 deep, so its floor label fits between the walls
    const cells = minus(rectCells(0, 0, W, H), rectCells(p, H - b, a, b));
    return { cells, W, H, runs: outlineRuns(cells), kind, p: { a, b, p } };
  }
  const W = rng.int(9, 14), a1 = rng.int(2, 4), a2 = rng.int(2, 4), h1 = rng.int(2, 4), h2 = rng.int(2, 4), h3 = rng.int(2, 3);
  const H = h1 + h2 + h3;
  const cells = union(rectCells(0, 0, W, h1), rectCells(0, h1, W - a1, h2), rectCells(0, h1 + h2, W - a1 - a2, h3));
  return { cells, W, H, runs: outlineRuns(cells), kind, p: { a1, a2, h1, h2, h3 } };
}
const m = (n: number) => lab(n, unit(n, 'metre'));
const sqm = (n: number) => lab(n, 'square metres');

function compositeAreaQ(d: number, rng: Rng): ContestSpec {
  const c = composite(rng, rng.pick(['L', 'U', 'stair'] as const));
  const { W, H, runs, p } = c; const A = c.cells.length;
  // Grade 5 top: one side is missing and must be found first
  let hidden = -1; let find = '';
  if (d === 6) {
    if (c.kind === 'L') { hidden = runAt(runs, (r) => r.dir === 'L' && r.a[1] > 0 && r.a[1] < H); find = `First the missing side: across the top, ${m(W)} − ${m(W - p.a)} = ${m(p.a)}.`; }
    else if (c.kind === 'U') { hidden = runAt(runs, (r) => r.dir === 'L' && r.a[1] === H - p.b); find = `First the missing side: across the top, ${m(W)} − ${m(p.p)} − ${m(W - p.p - p.a)} = ${m(p.a)}.`; }
    else { hidden = runAt(runs, (r) => r.dir === 'L' && r.a[1] === H); const top = W - p.a1 - p.a2; find = `First the missing side: the top edges add up to the bottom, so ${m(W)} − ${m(p.a1)} − ${m(p.a2)} = ${m(top)}.`; }
  }
  const sides = sidesOf(runs, (r, i) => (i === hidden ? '?' : `${r.len} m`));
  let steps: string[]; let lines: Seg[] = []; let ghost: Cell[] = []; let wrong: number[];
  if (c.kind === 'stair') {
    const t1 = W, t2 = W - p.a1, t3 = W - p.a1 - p.a2; const A1 = t1 * p.h1, A2 = t2 * p.h2, A3 = t3 * p.h3;
    steps = [
      'Cut the shape into three rectangles, one for each step.',
      `Bottom: ${m(t1)} × ${m(p.h1)} = ${sqm(A1)}.`, `Middle: ${m(t2)} × ${m(p.h2)} = ${sqm(A2)}.`, `Top: ${m(t3)} × ${m(p.h3)} = ${sqm(A3)}.`,
      `${sqm(A1)} + ${sqm(A2)} + ${sqm(A3)} = ${sqm(A)}.`,
    ];
    lines = [[[-0.2, p.h1], [t2 + 0.2, p.h1]], [[-0.2, p.h1 + p.h2], [t3 + 0.2, p.h1 + p.h2]]];
    wrong = [W * H, A1 + A2, A + p.a1 * p.h2, gridPerimeter(c.cells)];
  } else {
    const cut = p.a * p.b;
    const where = c.kind === 'L' ? 'corner' : 'notch';
    steps = [
      `Fill in the cut-out ${where} to make one big rectangle: ${m(W)} × ${m(H)} = ${sqm(W * H)}.`,
      `The cut-out ${where} is ${m(p.a)} × ${m(p.b)} = ${sqm(cut)}.`,
      `${sqm(W * H)} − ${sqm(cut)} = ${sqm(A)}.`,
    ];
    if (c.kind === 'L') steps.push(`Check by adding two rectangles: ${m(W)} × ${m(H - p.b)} + ${m(W - p.a)} × ${m(p.b)} = ${sqm(A)}.`);
    ghost = c.kind === 'L' ? rectCells(W - p.a, H - p.b, p.a, p.b) : rectCells(p.p, H - p.b, p.a, p.b);
    wrong = [W * H, W * H + cut, A - p.a, gridPerimeter(c.cells), W * H - p.a - p.b];
  }
  if (find) steps.unshift(find);
  return {
    prompt: `Every corner is a square corner, and the lengths are in metres. ${hidden >= 0 ? 'One side is not labelled: find it first. ' : ''}What is the area of the shape, in square metres?`,
    expression: 'area = ? m²', answer: A, unit: 'm²', difficulty: d as Difficulty,
    hint: c.kind === 'stair' ? 'Cut the shape into rectangles, one for each step. Find each area, then add.' : 'Fill in the missing piece to make one big rectangle. Find its area, then take away the piece you filled in.',
    steps,
    visual: gs(W, H, c.cells, { plain: true, sides, ask: 'area' }),
    solutionVisual: gs(W, H, c.cells, { plain: true, sides: sidesOf(runs, (r) => `${r.len} m`), ghost, lines }),
    choices: d === 5 ? numberChoices(A, wrong, 5) : undefined,
  };
}

/** Grade 5: a triangle with its corners on grid points. Half a rectangle, or the box around it minus three right triangles. */
function triangleQ(d: number, rng: Rng): ContestSpec {
  const fx = rng.chance(0.5), fy = rng.chance(0.5);
  if (d === 5) {
    const a = rng.int(2, 8), b = rng.int(2, 6); const w = a + 2, h = b + 2;
    const pts: Pt[] = [[1, 1], [1 + a, 1], [1, 1 + b]].map(([x, y]): Pt => [fx ? w - x : x, fy ? h - y : y]);
    const A = (a * b) / 2;
    const box: Seg[] = boxSegs(pts);
    return {
      prompt: 'Each small square has an area of 1. What is the area of the gold triangle, in squares?',
      expression: 'area = ? squares', answer: A, difficulty: 5,
      hint: 'The triangle is exactly half of a rectangle. Find the rectangle first.',
      steps: [
        `Draw the rectangle around it: ${lab(a, 'squares wide')} × ${lab(b, 'squares tall')} = ${lab(a * b, 'squares')}.`,
        `The slanted side cuts the rectangle into two equal triangles, so the triangle is half: ${lab(a * b, 'squares')} ÷ 2 = ${lab(num(A), 'squares')}.`,
      ],
      visual: gs(w, h, [], { poly: pts, ask: 'area' }), solutionVisual: gs(w, h, [], { poly: pts, lines: box }),
      choices: numberChoices(A, [a * b, a + b, A + 1, A - 1, 2 * (a + b)], 5, true),
    };
  }
  const W = rng.int(4, 7), H = rng.int(3, 6), pp = rng.int(1, H - 1), q = rng.int(1, W - 1);
  const w = W + 2, h = H + 2;
  const raw: Pt[] = [[1, 1], [1 + W, 1 + pp], [1 + q, 1 + H]];
  const pts = raw.map(([x, y]): Pt => [fx ? w - x : x, fy ? h - y : y]);
  const t1 = (W * pp) / 2, t2 = (q * H) / 2, t3 = ((W - q) * (H - pp)) / 2; const A = W * H - t1 - t2 - t3;
  const tri = (a: number, b: number, t: number) => `${lab(a, unit(a, 'square wide', 'squares wide'))} × ${lab(b, unit(b, 'square tall', 'squares tall'))} ÷ 2 = ${lab(num(t), unit(t, 'square'))}`;
  return {
    prompt: 'Each small square has an area of 1. What is the area of the gold triangle, in squares?',
    expression: 'area = ? squares', answer: A, difficulty: 6,
    hint: 'Draw the smallest rectangle around the triangle. The parts of the rectangle outside the triangle are right triangles: each is half of a rectangle.',
    steps: [
      `The box around the triangle: ${lab(W, 'squares wide')} × ${lab(H, 'squares tall')} = ${lab(W * H, 'squares')}.`,
      `Three right triangles fill the rest of the box. Each is half a rectangle: ${tri(W, pp, t1)}; ${tri(q, H, t2)}; ${tri(W - q, H - pp, t3)}.`,
      `${lab(W * H, 'squares')} − ${[t1, t2, t3].map((t) => lab(num(t), unit(t, 'square'))).join(' − ')} = ${lab(num(A), unit(A, 'square'))}.`,
    ],
    visual: gs(w, h, [], { poly: pts, ask: 'area' }), solutionVisual: gs(w, h, [], { poly: pts, lines: boxSegs(pts) }),
  };
}
/** The four sides of the smallest box around some points (worked pictures). */
function boxSegs(pts: readonly Pt[]): Seg[] {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]];
}

/* ------------------------------------------------------------------ */
/* Perimeter (Grades 3, 5)                                              */
/* ------------------------------------------------------------------ */

const cmL = (n: number) => lab(n, 'cm');
/** Walk the outline: "4 (cm) + 2 (cm) + … = 18 (cm)". */
const walk = (runs: Run[], u: (n: number) => string) => `${runs.map((r) => u(r.len)).join(' + ')} = ${u(sum(runs.map((r) => r.len)))}`;

function perimeterQ(d: number, rng: Rng): ContestSpec {
  if (d <= 4) return gridPerimeterQ(d, rng);
  if (d === 5) return rng.chance(0.7) ? plainPerimeterQ(d, rng) : twoShapesQ(d, rng);
  return rng.chance(0.65) ? plainPerimeterQ(d, rng) : twoShapesQ(d, rng);
}
function gridPerimeterQ(d: number, rng: Rng): ContestSpec {
  let cells: Cell[] = [], w = 6, h = 5;
  for (let t = 0; t < 200; t++) {
    if (d === 3 && rng.chance(0.4)) {
      const cols = rng.int(2, 6), rows = rng.int(2, 4); w = cols + 2; h = rows + 1; cells = rectCells(1, rng.int(0, 1), cols, rows); break;
    }
    if (d === 3) {
      const W = rng.int(3, 6), H = rng.int(3, 5), a = rng.int(1, W - 1), b = rng.int(1, H - 1);
      const fx = rng.chance(0.5);
      cells = minus(rectCells(0, 0, W, H), rectCells(W - a, H - b, a, b)).map(([c, r]): Cell => [(fx ? W - 1 - c : c) + 1, r]); w = W + 2; h = H; break;
    }
    w = rng.int(5, 8); h = rng.int(4, 6);
    const n = rng.int(7, 14);
    const c0 = grow(rng, n, (c, r) => c >= 0 && r >= 0 && c < w && r < h, [rng.int(0, w - 1), rng.int(0, h - 1)]);
    if (c0.length === n && tidy(c0) && slotFree(c0)) { cells = c0; break; }
  }
  if (!cells.length || !tidy(cells)) { w = 6; h = 4; cells = minus(rectCells(1, 0, 4, 4), rectCells(3, 2, 2, 2)); }
  const runs = outlineRuns(cells); const P = gridPerimeter(cells); const A = cells.length;
  const edgeSquares = cells.filter(([c, r]) => NB.some(([dc, dr]) => !setOf(cells).has(K(c + dc, r + dr)))).length;
  return {
    prompt: 'Each square is 1 cm on each side. What is the perimeter of the gold shape?',
    expression: 'perimeter = ? cm', answer: P, unit: 'cm', difficulty: d as Difficulty,
    hint: 'Start at a corner and walk around the outside, counting each square edge once. Edges between two gold squares are inside, so they do not count.',
    steps: [
      'Start at the bottom-left corner and walk around the outside, one straight side at a time:',
      `${walk(runs, cmL)}.`,
      'Edges between two gold squares are inside the shape, so they are not part of the perimeter.',
    ],
    visual: gs(w, h, cells, { ask: 'perimeter' }), solutionVisual: gs(w, h, cells, { ask: 'perimeter', sides: sidesOf(runs, (r) => String(r.len)) }),
    choices: d === 3 ? numberChoices(P, [A, edgeSquares, P - 2, P + 2], 4) : undefined,
  };
}
/** Grade 5: a shape drawn to scale with some sides unlabelled. The edges facing up add up to the edges facing down (and left to right). */
function plainPerimeterQ(d: number, rng: Rng): ContestSpec {
  const kind = d === 5 ? rng.pick(['L', 'stair'] as const) : rng.pick(['U', 'stair', 'U'] as const);
  const c = composite(rng, kind); const { W, H, runs, p } = c; const P = gridPerimeter(c.cells);
  const hide = new Set<number>(); const find: string[] = [];
  const ups = runs.map((r, i) => ({ r, i })).filter((x) => x.r.dir === 'U');
  const tops = runs.map((r, i) => ({ r, i })).filter((x) => x.r.dir === 'L');
  if (kind === 'U') {
    const tl = runAt(runs, (r) => r.dir === 'L' && r.a[1] === H && r.b[0] === 0);
    const tr = runAt(runs, (r) => r.dir === 'L' && r.a[1] === H && r.a[0] === W);
    const wall = runAt(runs, (r) => r.dir === 'D' && r.a[1] === H && r.a[0] > 0);
    hide.add(tl); hide.add(wall);
    find.push(`Across: the top edges add up to the bottom, so the missing top edge is ${m(W)} − ${m(p.a)} − ${m(runs[tr].len)} = ${m(runs[tl].len)}.`);
    find.push(`The two walls of the notch are the same depth: ${m(p.b)}.`);
  } else if (d === 6) {
    // the trick: two top edges are missing, but together they are as long as the bottom
    const pick = rng.shuffle(tops.map((x) => x.i)).slice(0, 2); pick.forEach((i) => hide.add(i));
    const vis = tops.filter((x) => !hide.has(x.i));
    find.push(`Across: you do not need each missing edge. The top edges together are as long as the bottom, ${m(W)}${vis.length ? `, so the two missing ones add up to ${m(W)} − ${vis.map((x) => m(x.r.len)).join(' − ')} = ${m(W - sum(vis.map((x) => x.r.len)))}` : ''}.`);
    const u = rng.pick(ups); hide.add(u.i);
    const others = ups.filter((x) => x.i !== u.i);
    find.push(`Up and down: the edges facing right add up to the left side, so the missing one is ${m(H)} − ${others.map((x) => m(x.r.len)).join(' − ')} = ${m(u.r.len)}.`);
  } else {
    const t = rng.pick(tops); hide.add(t.i); const u = rng.pick(ups); hide.add(u.i);
    const ot = tops.filter((x) => x.i !== t.i), ou = ups.filter((x) => x.i !== u.i);
    find.push(`Across: the top edges add up to the bottom, so the missing one is ${m(W)} − ${ot.map((x) => m(x.r.len)).join(' − ')} = ${m(t.r.len)}.`);
    find.push(`Up and down: the edges facing right add up to the left side, so the missing one is ${m(H)} − ${ou.map((x) => m(x.r.len)).join(' − ')} = ${m(u.r.len)}.`);
  }
  const sides = sidesOf(runs, (r, i) => (hide.has(i) ? '?' : `${r.len} m`));
  const steps = [...find];
  if (kind === 'U') {
    steps.push(`Walk around: ${walk(runs, m)}.`);
    steps.push(`Shortcut: the box around it, plus the two walls of the notch: 2 × (${m(W)} + ${m(H)}) + ${m(p.b)} + ${m(p.b)} = ${m(P)}.`);
  } else if (d === 6) {
    steps.push(`So the perimeter is the same as the box around the shape: 2 × (${m(W)} + ${m(H)}) = ${m(P)}.`);
  } else {
    steps.push(`Walk around: ${walk(runs, m)}.`);
    steps.push(`Shortcut: the steps fill out the box around the shape, so 2 × (${m(W)} + ${m(H)}) = ${m(P)} too.`);
  }
  const hidSum = sum([...hide].map((i) => runs[i].len));
  // Grade 5 top stairs: two missing top edges can only be found together, so the hint says to use the totals
  const totalsOnly = kind === 'stair' && d === 6;
  return {
    prompt: `Every corner is a square corner, and the lengths are in metres. Some sides are not labelled. What is the perimeter of the shape?`,
    expression: 'perimeter = ? m', answer: P, unit: 'm', difficulty: d as Difficulty,
    hint: totalsOnly
      ? 'You cannot find every missing side, and you do not need to. The edges facing up add up to the bottom, and the edges facing right add up to the left side. Use those totals.'
      : 'Find the missing sides first: the edges facing up add up to the edges facing down, and the edges facing left add up to the edges facing right. Then walk all the way around.',
    steps,
    visual: gs(W, H, c.cells, { plain: true, sides, ask: 'perimeter' }),
    solutionVisual: gs(W, H, c.cells, { plain: true, ask: 'perimeter', sides: sidesOf(runs, (r) => `${r.len} m`) }),
    choices: d === 5 ? numberChoices(P, [P - hidSum, W + H, c.cells.length, P + 2, P - 2], 5) : undefined,
  };
}
/** Grade 5: same area, different perimeters. */
function twoShapesQ(d: number, rng: Rng): ContestSpec {
  const RECTS: [number, number][] = [[2, 4], [3, 3], [2, 5], [3, 4], [2, 7], [3, 5], [4, 4]];
  let L: Cell[] = [], R: Cell[] = [], rw = 3, rh = 4, h = 5, wr = 5;
  for (let t = 0; t < 300; t++) {
    [rw, rh] = rng.pick(d === 5 ? RECTS.slice(0, 4) : RECTS.slice(2)); if (rng.chance(0.5)) [rw, rh] = [rh, rw];
    const n = rw * rh; h = Math.max(rh, rng.int(4, 6)); wr = rng.int(4, 6);
    L = rectCells(0, 0, rw, rh);
    const c0 = grow(rng, n, (c, r) => c >= 0 && r >= 0 && c < wr && r < h, [rng.int(0, wr - 1), rng.int(0, h - 1)]);
    if (c0.length === n && tidy(c0) && slotFree(c0) && gridPerimeter(c0) > gridPerimeter(L)) { R = c0; break; }
  }
  if (!R.length) { L = rectCells(0, 0, 3, 3); R = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [4, 2], [4, 3], [4, 4]]; rw = 3; rh = 3; wr = 5; h = 5; }
  const n = L.length; const Pl = gridPerimeter(L), Pr = gridPerimeter(R); const diff = Pr - Pl;
  const xr = rw + 2; const all = union(L, shift(R, xr, 0)); const W = xr + wr;
  const runsR = outlineRuns(R);
  return {
    prompt: `Both gold shapes are made of ${n} squares, so they have the same area. Each square is 1 cm on each side. How much longer is the perimeter of the right shape than the perimeter of the left shape?`,
    expression: 'longer by ? cm', answer: diff, unit: 'cm', difficulty: d as Difficulty,
    hint: 'Find each perimeter by walking around the outside and counting edges. Then subtract.',
    steps: [
      `Left shape, a rectangle: ${cmL(rw)} + ${cmL(rh)} + ${cmL(rw)} + ${cmL(rh)} = ${cmL(Pl)}.`,
      ...(runsR.some((r) => r.len === 1) ? ['In the worked picture, an edge with no number is one square edge long.'] : []),
      `Right shape, walking around: ${walk(runsR, cmL)}.`,
      `${cmL(Pr)} − ${cmL(Pl)} = ${lab(diff, 'cm longer')}.`,
      'Same area does not mean same perimeter: a spread-out shape has more edges on the outside.',
    ],
    visual: gs(W, h, all, { ask: 'perimeter' }),
    // only stretches of 2 or more are numbered: the grid shows the single edges, and their "1"s would crowd each other
    solutionVisual: gs(W, h, all, { ask: 'perimeter', sides: [...sidesOf(outlineRuns(L), (r) => String(r.len))!, ...sidesOf(runsR.filter((r) => r.len > 1).map((r) => ({ ...r, a: [r.a[0] + xr, r.a[1]] as Pt, b: [r.b[0] + xr, r.b[1]] as Pt })), (r) => String(r.len))!] }),
    choices: d === 5 ? numberChoices(diff, [Pr, Pl, diff + 2, diff - 2, Pr + Pl], 5) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Tangram pieces (Grades 1, 3)                                         */
/* ------------------------------------------------------------------ */

/**
 * Tangram lite: every corner sits on a grid point. A small triangle is half a square; the medium triangle, the square and
 * the parallelogram are each 2 small triangles; the large triangle is 4. Pieces turn in quarter turns about their box.
 */
const TAN_SHAPE: Record<TanKind, Pt[]> = {
  'tri-s': [[0, 0], [1, 0], [0, 1]], 'tri-m': [[0, 0], [2, 0], [1, 1]], 'tri-l': [[0, 0], [2, 0], [0, 2]],
  square: [[0, 0], [1, 0], [1, 1], [0, 1]], para: [[0, 0], [1, 0], [2, 1], [1, 1]],
};
/** Each piece's size in small triangles. */
export const TAN_SMALL: Record<TanKind, number> = { 'tri-s': 1, 'tri-m': 2, 'tri-l': 4, square: 2, para: 2 };
export const TAN_NAME: Record<TanKind, [string, string]> = {
  'tri-s': ['small triangle', 'small triangles'], 'tri-m': ['medium triangle', 'medium triangles'], 'tri-l': ['large triangle', 'large triangles'],
  square: ['square', 'squares'], para: ['parallelogram', 'parallelograms'],
};
/** The corners of a placed piece: its shape turned by `rot` (anticlockwise), then moved so its box starts at (x, y). */
export function tanPoints(p: Pick<TanPiece, 'kind' | 'x' | 'y' | 'rot'>): Pt[] {
  const turn = ([a, b]: Pt): Pt => (p.rot === 90 ? [-b, a] : p.rot === 180 ? [-a, -b] : p.rot === 270 ? [b, -a] : [a, b]);
  const q = TAN_SHAPE[p.kind].map(turn); const mx = Math.min(...q.map((v) => v[0])), my = Math.min(...q.map((v) => v[1]));
  return q.map(([a, b]): Pt => [a - mx + p.x, b - my + p.y]);
}
function inPoly(px: number, py: number, pts: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** How much of each unit square of the 4 × 4 board the pieces cover: 2 = a whole square, 1 = half (counted in small triangles). */
export function tanCover(pieces: readonly TanPiece[]): { whole: number; half: number } {
  const polys = pieces.filter((p) => !p.ghost).map(tanPoints); let whole = 0, half = 0;
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    const qs: Pt[] = [[c + 0.5, r + 1 / 6], [c + 5 / 6, r + 0.5], [c + 0.5, r + 5 / 6], [c + 1 / 6, r + 0.5]];
    const n = qs.filter(([x, y]) => polys.some((pp) => inPoly(x, y, pp))).length;
    if (n === 4) whole++; else if (n >= 2) half++;
  }
  return { whole, half };
}
/** Do two pieces share a stretch of edge? (Neighbours get different colours.) */
function touching(a: Pt[], b: Pt[]): boolean {
  const onSeg = ([x, y]: Pt, [x1, y1]: Pt, [x2, y2]: Pt) => Math.abs((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) < 1e-9 && x >= Math.min(x1, x2) - 1e-9 && x <= Math.max(x1, x2) + 1e-9 && y >= Math.min(y1, y2) - 1e-9 && y <= Math.max(y1, y2) + 1e-9;
  for (let i = 0; i < a.length; i++) {
    const p = a[i], q = a[(i + 1) % a.length];
    for (const t of [0.25, 0.5, 0.75]) { const mpt: Pt = [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]; if (b.some((u, j) => onSeg(mpt, u, b[(j + 1) % b.length]))) return true; }
  }
  return false;
}
/**
 * Each piece gets the colour used least so far that no touching piece has (ties: the shuffled palette's order), so a
 * picture of up to six pieces has six different colours, and touching pieces never share one.
 */
function colourPieces(rng: Rng, specs: [TanKind, number, number, Rot][]): TanPiece[] {
  const pieces: TanPiece[] = specs.map(([kind, x, y, rot]) => ({ kind, x, y, rot }));
  const pts = pieces.map(tanPoints); const palette = rng.shuffle(COLORS);
  const uses = new Map<ColorName, number>(palette.map((c) => [c, 0]));
  pieces.forEach((p, i) => {
    const near = new Set(pieces.slice(0, i).filter((_, j) => touching(pts[i], pts[j])).map((q) => q.color));
    const free = palette.filter((c) => !near.has(c));
    const c = (free.length ? free : palette).reduce((best, x) => (uses.get(x)! < uses.get(best)! ? x : best));
    p.color = c; uses.set(c, uses.get(c)! + 1);
  });
  return pieces;
}
type Spec = [TanKind, number, number, Rot];
const at = (specs: Spec[], dx: number, dy: number): Spec[] => specs.map(([k, x, y, r]) => [k, x + dx, y + dy, r]);
/** A 2 × 2 block built five different ways. */
const BLOCKS: Record<string, Spec[]> = {
  squares: [['square', 0, 0, 0], ['square', 1, 0, 0], ['square', 0, 1, 0], ['square', 1, 1, 0]],
  big: [['tri-l', 0, 0, 0], ['tri-l', 0, 0, 180]],
  big2: [['tri-l', 0, 0, 90], ['tri-l', 0, 0, 270]],
  mixed: [['square', 0, 0, 0], ['square', 1, 0, 0], ['tri-m', 0, 1, 0], ['tri-s', 0, 1, 270], ['tri-s', 1, 1, 180]],
  para: [['square', 0, 0, 0], ['square', 1, 0, 0], ['para', 0, 1, 0], ['tri-s', 0, 1, 270], ['tri-s', 1, 1, 90]],
};
/** Pictures made of pieces on the 4 × 4 board. */
function tanDesign(rng: Rng, maxPieces = 9): { name: string; pieces: TanPiece[] } {
  for (let t = 0; t < 60; t++) {
    const name = rng.pick(['house', 'rocket', 'cat', 'boat', 'arrow', 'fish']);
    const block = BLOCKS[rng.pick(Object.keys(BLOCKS))];
    let specs: Spec[];
    if (name === 'house') specs = [...at(block, 1, 0), ...(rng.chance(0.5) ? [['tri-l', 0, 2, 90], ['tri-l', 2, 2, 0]] as Spec[] : [['tri-m', 1, 2, 0]] as Spec[])];
    else if (name === 'rocket') specs = [...at(block, 1, 1), ['tri-m', 1, 3, 0], ['tri-s', 0, 1, 90], ['tri-s', 3, 1, 0], ['tri-m', 1, 0, 180]];
    else if (name === 'cat') specs = [...at(block, 1, 0), ['tri-s', 1, 2, 0], ['tri-s', 2, 2, 90], ['para', 3, 0, 90]];
    else if (name === 'boat') specs = [['square', 1, 0, 0], ['square', 2, 0, 0], ['tri-s', 0, 0, 180], ['tri-s', 3, 0, 270], ['tri-l', 2, 1, 0], ...(rng.chance(0.5) ? [['tri-l', 0, 1, 90]] as Spec[] : [['tri-m', 1, 1, 90]] as Spec[]), ...(rng.chance(0.5) ? [['tri-s', 2, 3, 0]] as Spec[] : [])];
    else if (name === 'arrow') specs = [...at(rng.pick([BLOCKS.squares, BLOCKS.big, BLOCKS.big2]), 0, 1), ['tri-l', 2, 2, 0], ['tri-l', 2, 0, 270]];
    else specs = [...(rng.chance(0.5) ? [['tri-s', 1, 2, 90], ['tri-s', 2, 2, 0], ['tri-s', 2, 1, 270], ['tri-s', 1, 1, 180]] as Spec[] : [['tri-m', 1, 2, 0], ['tri-m', 1, 1, 180]] as Spec[]), ['tri-m', 3, 1, 90]];
    if (specs.length <= maxPieces) return { name, pieces: colourPieces(rng, specs) };
  }
  return { name: 'house', pieces: colourPieces(rng, [...at(BLOCKS.big, 1, 0), ['tri-m', 1, 2, 0]]) };
}
const tan = (pieces: TanPiece[], extra: Partial<TanV> = {}): TanV => ({ type: 'tangram', pieces, ...extra });
/** "2 (large triangles) + 4 (squares) = 6 (pieces)" from the pieces shown. */
function pieceTally(pieces: readonly TanPiece[], kinds: TanKind[], total: string): string {
  const counts = kinds.map((k) => ({ k, n: pieces.filter((p) => p.kind === k).length })).filter((x) => x.n);
  const n = sum(counts.map((x) => x.n));
  return counts.length > 1 ? `${counts.map(({ k, n: c }) => lab(c, TAN_NAME[k][c === 1 ? 0 : 1])).join(' + ')} = ${lab(n, total)}` : counts.length ? `${lab(n, TAN_NAME[counts[0].k][n === 1 ? 0 : 1])}, so ${lab(n, total)} in all` : lab(0, total);
}
const ALL_KINDS: TanKind[] = ['tri-l', 'tri-m', 'tri-s', 'square', 'para'];

function tangramQ(d: number, rng: Rng): ContestSpec {
  const r = rng.next();
  if (d === 1) return r < 0.6 ? tanCountQ(d, rng) : tanMissingQ(d, rng);
  if (d === 2) return r < 0.35 ? tanTrianglesQ(rng) : r < 0.7 ? tanSmallQ(rng) : tanMissingQ(d, rng);
  if (d === 3) return r < 0.7 ? tanAreaQ(d, rng, false) : tanMissingQ(d, rng);
  return r < 0.7 ? tanAreaQ(d, rng, true) : tanAreaQ(d, rng, false);
}
function tanCountQ(d: number, rng: Rng): ContestSpec {
  const { name, pieces } = tanDesign(rng, 7); const n = pieces.length;
  return {
    prompt: `How many pieces make the ${name}?`, readAloud: `Count the pieces in the ${name}. How many are there?`,
    expression: 'pieces = ?', answer: n, difficulty: d as Difficulty,
    hint: 'Touch each coloured piece once as you count.',
    steps: [`Count each piece once: ${pieceTally(pieces, ALL_KINDS, 'pieces')}.`, 'The worked picture numbers every piece.'],
    visual: tan(pieces), solutionVisual: tan(pieces, { marks: 'count' }),
    choices: numberChoices(n, [n + 1, n - 1, n + 2], 3),
  };
}
function tanTrianglesQ(rng: Rng): ContestSpec {
  let des = tanDesign(rng, 8);
  for (let t = 0; t < 40 && (des.pieces.every((p) => p.kind.startsWith('tri')) || des.pieces.filter((p) => p.kind.startsWith('tri')).length < 2); t++) des = tanDesign(rng, 8);
  const { name, pieces } = des; const tri = pieces.filter((p) => p.kind.startsWith('tri')).length; const others = pieces.length - tri;
  return {
    prompt: `How many triangle pieces make the ${name}?`, readAloud: `A triangle has three sides. How many triangle pieces make the ${name}?`,
    expression: 'triangles = ?', answer: tri, difficulty: 2,
    hint: 'A triangle has three sides and three corners. Big or small, it is still a triangle.',
    steps: [
      `A triangle has ${lab(3, 'sides')} and ${lab(3, 'corners')}.`,
      `Triangles: ${pieceTally(pieces, ['tri-l', 'tri-m', 'tri-s'], 'triangles')}.`,
      others ? `The ${labn(others, 'other piece')} ${others === 1 ? 'has' : 'have'} four sides, so ${others === 1 ? 'it is' : 'they are'} not triangles.` : '',
      'The worked picture numbers only the triangle pieces.',
    ].filter(Boolean),
    // the four-sided pieces are faded and left unnumbered, so the last number is the count of triangles
    visual: tan(pieces), solutionVisual: tan(pieces.map((p) => (p.kind.startsWith('tri') ? p : { ...p, dim: true })), { marks: 'count' }),
    choices: numberChoices(tri, [pieces.length, tri + 1, tri - 1], 4),
  };
}
/** Grade 1: a shape cut into small triangles only. */
function tanSmallQ(rng: Rng): ContestSpec {
  const shapes = [
    { name: 'square', cells: [[0, 0]] as Cell[], tri: 0 }, { name: 'rectangle', cells: [[0, 0], [1, 0]] as Cell[], tri: 0 },
    { name: 'big square', cells: rectCells(0, 0, 2, 2), tri: 0 }, { name: 'tall rectangle', cells: rectCells(0, 0, 1, 3), tri: 0 },
    { name: 'big triangle', cells: [] as Cell[], tri: 2 }, { name: 'giant triangle', cells: [] as Cell[], tri: 3 }, { name: 'long rectangle', cells: rectCells(0, 0, 3, 1), tri: 0 },
  ];
  const s = rng.pick(shapes); const specs: Spec[] = [];
  const split = (c: number, r: number) => (rng.chance(0.5) ? specs.push(['tri-s', c, r, 0], ['tri-s', c, r, 180]) : specs.push(['tri-s', c, r, 90], ['tri-s', c, r, 270]));
  if (s.tri) { for (let c = 0; c < s.tri; c++) for (let r = 0; r < s.tri; r++) { if (c + r <= s.tri - 2) split(c, r); else if (c + r === s.tri - 1) specs.push(['tri-s', c, r, 0]); } }
  else for (const [c, r] of s.cells) split(c, r);
  const bw = s.tri || bbox(s.cells).x1 + 1, bh = s.tri || bbox(s.cells).y1 + 1;
  const pieces = colourPieces(rng, at(specs, Math.floor((4 - bw) / 2), Math.floor((4 - bh) / 2)));
  const n = pieces.length;
  const sq = s.tri ? 0 : s.cells.length;
  return {
    prompt: `How many small triangles make the ${s.name}?`, readAloud: `Count the small triangles in the ${s.name}. How many are there?`,
    expression: 'small triangles = ?', answer: n, difficulty: 2,
    hint: 'Touch each small triangle once as you count. Two small triangles make a square.',
    steps: [
      `Count each small triangle once: ${lab(n, 'small triangles')}.`,
      sq > 1 ? `Each square holds ${lab(2, 'small triangles')}: ${Array.from({ length: sq }, () => lab(2, 'small triangles')).join(' + ')} = ${lab(n, 'small triangles')}.` : sq === 1 ? 'Two small triangles make one square.' : 'Along the slanted side, each small triangle is half a square.',
    ],
    visual: tan(pieces), solutionVisual: tan(pieces, { marks: 'count' }),
    choices: numberChoices(n, [n - 1, n + 1, sq || n + 2], 4),
  };
}
function tanMissingQ(d: number, rng: Rng): ContestSpec {
  const { name, pieces } = tanDesign(rng, d <= 2 ? 7 : 9);
  const gi = rng.int(0, pieces.length - 1); const gap = pieces[gi];
  const shown = pieces.map((p, i) => (i === gi ? { ...p, ghost: true, color: undefined } : p));
  const WRONG: Record<TanKind, TanKind[]> = { 'tri-s': ['tri-m', 'tri-l', 'square'], 'tri-m': ['tri-s', 'tri-l', 'para'], 'tri-l': ['tri-m', 'tri-s', 'square'], square: ['tri-s', 'para', 'tri-m'], para: ['square', 'tri-m', 'tri-s'] };
  const kinds = rng.shuffle([gap.kind, ...WRONG[gap.kind].slice(0, d <= 2 ? 2 : 3)]);
  const right = kinds.indexOf(gap.kind);
  const one = (kind: TanKind): TanV => {
    const pts = tanPoints({ kind, x: 0, y: 0, rot: gap.rot }); const bw = Math.max(...pts.map((p) => p[0])), bh = Math.max(...pts.map((p) => p[1]));
    return tan([{ kind, x: (4 - bw) / 2, y: (4 - bh) / 2, rot: gap.rot, color: 'blue' }]);
  };
  const size = TAN_SMALL[gap.kind];
  return {
    prompt: `One piece of the ${name} is missing. Which piece fills the gap?`,
    readAloud: 'One piece is missing. Tap the piece that fills the gap.',
    expression: 'the missing piece = ?', answer: right + 1, difficulty: d as Difficulty,
    hint: 'Look at the gap. Count its corners. Check how big it is.',
    steps: [
      `The gap is ${gap.kind === 'square' ? 'a square' : gap.kind === 'para' ? 'a slanted four-sided shape' : 'a triangle'} the size of ${lab(size, unit(size, 'small triangle'))}.`,
      `That is the ${TAN_NAME[gap.kind][0]}, so it fills the gap.`,
      ...kinds.filter((k) => k !== gap.kind).map((k) => `The ${TAN_NAME[k][0]} is ${TAN_SMALL[k] === size ? 'the right size but the wrong shape' : TAN_SMALL[k] > size ? 'too big' : 'too small'}.`),
    ],
    visual: tan(shown), solutionVisual: tan(pieces),
    choices: kinds.map((k, i) => ({ value: i + 1, label: TAN_NAME[k][0][0].toUpperCase() + TAN_NAME[k][0].slice(1), visual: one(k) })),
  };
}
/** Grade 3: area in small triangles, from the pieces (cuts shown) or from the outline on the grid. */
function tanAreaQ(d: number, rng: Rng, outline: boolean): ContestSpec {
  const { name, pieces } = tanDesign(rng, 9);
  const A = sum(pieces.map((p) => TAN_SMALL[p.kind]));
  const kinds = ALL_KINDS.filter((k) => pieces.some((p) => p.kind === k));
  const parts = kinds.map((k) => { const n = pieces.filter((p) => p.kind === k).length; return { k, n, t: n * TAN_SMALL[k] }; });
  const byPiece = parts.map(({ k, n, t }) => `${lab(n, TAN_NAME[k][n === 1 ? 0 : 1])} × ${lab(TAN_SMALL[k], unit(TAN_SMALL[k], 'small triangle each', 'small triangles each'))} = ${lab(t, unit(t, 'small triangle'))}`);
  const total = parts.length > 1 ? `${parts.map((x) => lab(x.t, unit(x.t, 'small triangle'))).join(' + ')} = ${lab(A, 'small triangles')}.` : `That is ${lab(A, 'small triangles')}.`;
  if (outline) {
    const { whole, half } = tanCover(pieces);
    return {
      prompt: `Only the outline of the ${name} shows. Use the grid: how many small triangles would cover it?`,
      expression: 'small triangles = ?', answer: A, difficulty: d as Difficulty,
      hint: 'A whole square of the grid holds 2 small triangles, and a half square holds 1. Count the whole squares and the half squares.',
      steps: [
        whole ? `Whole squares inside: ${lab(whole, unit(whole, 'square'))} × ${lab(2, 'small triangles each')} = ${lab(2 * whole, 'small triangles')}.` : 'There are no whole squares inside: every square is cut in half.',
        half ? `Half squares: ${lab(half, unit(half, 'half square'))} × ${lab(1, 'small triangle each')} = ${lab(half, unit(half, 'small triangle'))}.` : 'There are no half squares.',
        whole && half ? `${lab(2 * whole, 'small triangles')} + ${lab(half, unit(half, 'small triangle'))} = ${lab(A, 'small triangles')}.` : `That is ${lab(A, 'small triangles')}.`,
        `Check with the pieces: ${byPiece.join('; ')}.`,
      ],
      visual: tan(pieces, { outline: true }), solutionVisual: tan(pieces, { marks: 'area' }),
    };
  }
  return {
    prompt: `A small triangle is 1 unit of area. What is the area of the ${name}, in small triangles?`,
    expression: 'area = ? small triangles', answer: A, difficulty: d as Difficulty,
    hint: 'A square, a medium triangle and the parallelogram are each 2 small triangles. A large triangle is 4 small triangles.',
    steps: [...byPiece.map((s) => `${s}.`), ...(parts.length > 1 ? [total] : [])],
    visual: tan(pieces), solutionVisual: tan(pieces, { marks: 'area' }),
    choices: d === 3 ? numberChoices(A, [pieces.length, A - 2, A + 2, A / 2], 4) : undefined,
  };
}

/* ------------------------------------------------------------------ */

const MAKERS: Record<Kind, (d: number, rng: Rng) => ContestSpec> = { mirror: mirrorQ, lines: linesQ, area: areaQ, perimeter: perimeterQ, tangram: tangramQ };

export function gridQuestion(kind: GridKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const grade = gradeOf(d);
  const fits = GRID_KINDS.filter((x) => x.id !== 'all' && GRID_KIND_GRADES[x.id]?.includes(grade)).map((x) => x.id as Kind);
  const k: Kind = kind === 'all' || !MAKERS[kind as Kind] ? rng.pick(fits.length ? fits : ['area']) : (kind as Kind);
  const sid = skillId ?? (kind === 'all' ? 'grid' : `grid.${k}`);
  const [lo, hi] = BAND[k];
  const spec = MAKERS[k](Math.min(hi, Math.max(lo, d)), rng);
  return contestQuestion('grid', GRID_META.topic, sid, GRID_KINDS.find((x) => x.id === k)?.label ?? 'Mixed', { ...spec, difficulty: d, app: APP });
}
export const genGrid: Generator = (skillId, params, ctx) => gridQuestion(String(params?.kind ?? 'all') as GridKind, ctx.difficulty, ctx.rng, skillId);
