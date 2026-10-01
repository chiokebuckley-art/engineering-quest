import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { PICTURE_GAMES } from '../questions/games';
import { BLOCKS_KIND_GRADES, BLOCKS_KINDS, BLOCKS_META, BLOCKS_SMALL_EDGE, blocksQuestion, blocksSmallEdge, pictureFixesStack, seenCubes, type BlocksKind } from '../questions/spatialBlocks';
import { BLOCKS_LESSONS } from '../../content/contest/spatialBlocks';
import { gradeOf } from '../contest/common';
import { violatesCaps } from '../contest/grades';
import { LABELED } from '../label';
import { arithmeticSlips } from '../academy/teachMath';
import type { Difficulty, Question, Visual } from '../types';

type Grid = number[][];
type Iso = Extract<Visual, { type: 'iso' }>;
const KINDS = ['count', 'hidden', 'layers', 'fill', 'painted'] as const;
const DS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const N = 120;

/* ---------- independent geometry: cast rays toward the viewer ---------- */

const H = (h: Grid, r: number, c: number) => (r >= 0 && c >= 0 ? h[r]?.[c] ?? 0 : 0);
/** Does the ray p + t(1, 1, 1), t > 0, pass through the inside of any cube of the stack? (The viewer sits at +row, +col, +z.) */
function blocked(h: Grid, p: [number, number, number]): boolean {
  for (let r = 0; r < h.length; r++) for (let c = 0; c < h[r].length; c++) for (let z = 0; z < h[r][c]; z++) {
    const lo = Math.max(1e-9, r - p[0], c - p[1], z - p[2]);
    const hi = Math.min(r + 1 - p[0], c + 1 - p[1], z + 1 - p[2]);
    if (hi - lo > 1e-9) return true;
  }
  return false;
}
/**
 * Sample points on a face. In the drawing each face is split into two triangles along its u = v diagonal, and a ray from
 * that diagonal can slip along cube edges, so the u and v samples never match: every sample sits inside one triangle.
 */
const US = [0.1, 0.35, 0.6, 0.85], VS = [0.2, 0.45, 0.7, 0.95];
/** For each cube: how many of its three faces show fully, and whether any part shows. */
function rayView(h: Grid) {
  const out: { r: number; c: number; z: number; full: number; any: boolean }[] = [];
  for (let r = 0; r < h.length; r++) for (let c = 0; c < h[r].length; c++) for (let z = 0; z < h[r][c]; z++) {
    const faces: [number, number, number][][] = [
      US.flatMap((u) => VS.map((v): [number, number, number] => [r + u, c + v, z + 1])), // top
      US.flatMap((u) => VS.map((v): [number, number, number] => [r + 1, c + u, z + v])), // front (+row)
      US.flatMap((u) => VS.map((v): [number, number, number] => [r + u, c + 1, z + v])), // right (+col)
    ];
    const open = faces.map((f) => f.map((p) => !blocked(h, p)));
    out.push({ r, c, z, full: open.filter((f) => f.every(Boolean)).length, any: open.some((f) => f.some(Boolean)) });
  }
  return out;
}
const sum = (h: Grid) => h.flat().reduce((a, b) => a + b, 0);

/* ---------- independent picture check: does the drawing fix the stack? ---------- */

/**
 * Lines of sight. The viewer looks along (−1, −1, −1), so every line of sight is p + t(1, 1, 1) and meets the floor
 * plane once, at (u, v, 0). The picture is what each line shows first: the top, front or right face of a cube (named by
 * its spot on the screen, so two faces in the same spot look the same), a floor square, or nothing. Cube edges fall on
 * u, v or u − v whole, so sample points off those lines see whole faces.
 */
interface Sight { cells: { r: number; c: number; t0: number; t1: number; front: boolean }[]; floor: string }
function sightLines(rows: number, cols: number, hmax: number): Sight[] {
  const lines: Sight[] = [];
  for (let i = -hmax - 2; i <= rows; i++) for (let j = -hmax - 2; j <= cols; j++) for (const [a, b] of [[0.71, 0.29], [0.29, 0.71], [0.55, 0.12], [0.12, 0.55]]) {
    const u = i + a, v = j + b; const cells: Sight['cells'] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      // the line is over square (r, c) while t0 < t < t1, at height z = t
      const t0 = Math.max(r - u, c - v, 0), t1 = Math.min(r + 1 - u, c + 1 - v);
      if (t1 > t0) cells.push({ r, c, t0, t1, front: r + 1 - u < c + 1 - v });
    }
    cells.sort((p, q) => q.t1 - p.t1); // nearest the viewer first
    lines.push({ cells, floor: u >= 0 && u < rows && v >= 0 && v < cols ? `floor ${Math.floor(u)},${Math.floor(v)}` : 'nothing' });
  }
  return lines;
}
/** What a line of sight shows, or null while a square it needs has no height yet. */
function look(line: Sight, get: (r: number, c: number) => number | undefined): string | null {
  for (const x of line.cells) {
    const h = get(x.r, x.c);
    if (h === undefined) return null;
    if (h > x.t0) {
      if (h < x.t1) return `top ${x.c - x.r},${x.c + x.r - 2 * (h - 1)}`;
      const z = Math.floor(x.t1);
      return `${x.front ? 'front' : 'right'} ${x.c - x.r},${x.c + x.r - 2 * z}`;
    }
  }
  return line.floor;
}
/** Every stack on the same floor that draws exactly the same picture (up to `limit`), by search, nearest squares first. */
function stacksWithPicture(h: Grid, limit = 2): Grid[] {
  const rows = h.length, cols = Math.max(...h.map((r) => r.length));
  const hmax = Math.max(...h.flat()) + Math.ceil((rows + cols) / 2) + 1;
  const lines = sightLines(rows, cols, hmax);
  const target = lines.map((l) => look(l, (r, c) => h[r]?.[c] ?? 0));
  const order: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) order.push([r, c]);
  order.sort((p, q) => q[0] + q[1] - (p[0] + p[1]));
  const through: number[][][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => []));
  lines.forEach((l, i) => l.cells.forEach((x) => through[x.r][x.c].push(i)));
  const g: (number | undefined)[][] = Array.from({ length: rows }, () => Array(cols).fill(undefined));
  const get = (r: number, c: number) => g[r][c];
  const found: Grid[] = [];
  const go = (k: number) => {
    if (found.length >= limit) return;
    if (k === order.length) { found.push(g.map((row) => row.map((x) => x!))); return; }
    const [r, c] = order[k];
    for (let x = 0; x <= hmax; x++) {
      g[r][c] = x;
      if (through[r][c].every((i) => { const seen = look(lines[i], get); return seen === null || seen === target[i]; })) go(k + 1);
    }
    g[r][c] = undefined;
  };
  go(0);
  return found;
}
/** Towers never get taller toward the front (+row) or toward the right (+col). */
const isCorner = (h: Grid) => h.every((row, r) => row.every((v, c) => v >= H(h, r + 1, c) && v >= H(h, r, c + 1)));

/* ---------- checks shared by every question ---------- */

const LABEL_OK = /^[A-Za-z][A-Za-z ',/-]*[A-Za-z]$/;
function checkLabels(s: string) {
  const after = [...s.matchAll(/(?:\d|\?) \(([^)]*)\)/g)];
  for (const m of after) expect(LABEL_OK.test(m[1]), `bad label "(${m[1]})" in: ${s}`).toBe(true);
  expect([...s.matchAll(new RegExp(LABELED.source, 'g'))].length, s).toBe(after.length);
}
const words = (s: string) => s.split(/[.?!]/).map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length);
const nums = (s: string) => [...s.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, '')));
const texts = (q: Question) => [q.prompt, q.expression, q.hint, q.readAloud ?? '', ...q.solutionSteps, ...q.explanation, ...(q.choices ?? []).map((c) => c.label)];
const int = (s: string, re: RegExp) => { const m = re.exec(s); expect(m, `${re} in "${s}"`).toBeTruthy(); return Number(m![1]); };

/** The rule-built stacks of layers d5/d6, read from the prompt: layer i from the top, as the squares it covers (row 0 at the back, col 0 at the left). */
const familyOf = (p: string) => (p.includes('a square of cubes') ? 'square' : p.includes('a triangle of cubes') ? 'stair' : p.includes('a rectangle of cubes') ? 'rect' : p.includes('an L of cubes') ? 'ell' : '');
function layerShape(fam: string, i: number): string[] {
  const out: string[] = [];
  for (let r = 0; r <= i; r++) for (let c = 0; c <= i; c++) {
    const inside = fam === 'square' ? r < i && c < i : fam === 'stair' ? r + c < i : fam === 'rect' ? r < i && c < i + 1 : (r === 0 && c < i) || (c === 0 && r < i);
    if (inside) out.push(`${r},${c}`);
  }
  return out;
}
/** Cubes in a stack of j layers built by the rule. */
const layerTotal = (fam: string, j: number) => Array.from({ length: j }, (_, i) => layerShape(fam, i + 1).length).reduce((a, b) => a + b, 0);

/** The answer worked out again from the picture and the words, without the generator's helpers. */
function recompute(kind: string, q: Question): number {
  const v = q.visual as Iso;
  if (kind === 'count') {
    if (q.prompt.startsWith('Which stack has more')) {
      const totals = q.choices!.map((c) => sum((c.visual as Iso).heights));
      expect(new Set(totals).size).toBe(2);
      // the left and right buttons show the left and right stacks of the picture
      const row = v.heights[0]; const gap = row.indexOf(0);
      expect(v.heights).toHaveLength(1); expect(gap).toBeGreaterThan(0);
      expect(totals).toEqual([sum([row.slice(0, gap)]), sum([row.slice(gap + 1)])]);
      expect(q.choices!.map((c) => c.label)).toEqual(['Left stack', 'Right stack']);
      return q.choices![totals.indexOf(Math.max(...totals))].value;
    }
    if (q.prompt.startsWith('Which stack has')) {
      const n = int(q.prompt, /has (\d+) cubes/);
      expect(v.heights).toEqual([Array(n).fill(1)]);
      const hits = q.choices!.filter((c) => sum((c.visual as Iso).heights) === n);
      expect(hits).toHaveLength(1);
      return hits[0].value;
    }
    // every cube shows a whole face, and no other stack draws the same picture, so counting what you see is the answer
    for (const cube of rayView(v.heights)) expect(cube.full, `cube ${JSON.stringify(cube)} of ${JSON.stringify(v.heights)}`).toBeGreaterThan(0);
    expect(stacksWithPicture(v.heights), JSON.stringify(v.heights)).toEqual([v.heights]);
    expect(q.prompt).toMatch(/^Every cube shows/);
    return sum(v.heights);
  }
  if (kind === 'hidden') {
    expect(isCorner(v.heights), JSON.stringify(v.heights)).toBe(true);
    const view = rayView(v.heights);
    const hidden = view.filter((x) => !x.any).length;
    expect(hidden).toBeGreaterThan(0);
    return q.prompt.includes('NOT see') ? hidden : sum(v.heights);
  }
  if (kind === 'layers') {
    if (/with (\d+) layers need/.test(q.prompt)) {
      const k = int(q.prompt, /has (\d+) layers/), m = int(q.prompt, /with (\d+) layers need/);
      const fam = familyOf(q.prompt);
      expect(fam, q.prompt).not.toBe('');
      expect(q.prompt).toMatch(/^Every cube sits on the floor or on another cube\./);
      const shape = (i: number) => layerShape(fam, i);
      // each layer sits on the one under it; stacking k layers gives the picture
      for (let i = 1; i < k; i++) for (const sq of shape(i)) expect(shape(i + 1)).toContain(sq);
      const tall = new Map<string, number>();
      for (let i = 1; i <= k; i++) for (const sq of shape(i)) tall.set(sq, (tall.get(sq) ?? 0) + 1);
      v.heights.forEach((row, r) => row.forEach((x, c) => expect(x, `${fam} ${r},${c}`).toBe(tall.get(`${r},${c}`) ?? 0)));
      expect(sum(v.heights)).toBe([...tall.values()].reduce((a, b) => a + b, 0));
      // the question picture also pulls the layers apart, so each layer can be counted; the worked one too
      expect(v.layers).toBe(true);
      const sv = q.solutionVisual as Iso; expect(sv.layers && sv.ghost).toBe(true);
      expect(Math.max(...sv.heights.flat())).toBe(Math.min(m, 6));
      return layerTotal(fam, m);
    }
    expect(isCorner(v.heights)).toBe(true);
    if (q.prompt.includes('bottom layer')) return v.heights.flat().filter((x) => x >= 1).length;
    if (q.prompt.includes('second layer')) return v.heights.flat().filter((x) => x >= 2).length;
    return sum(v.heights);
  }
  if (kind === 'fill') {
    expect(isCorner(v.heights)).toBe(true);
    if (q.prompt.startsWith('You want a solid cube')) {
      const n = int(q.prompt, /cube, (\d+) cubes long/);
      expect(v.box).toBe(n); expect(v.heights.length).toBe(n);
      return n ** 3 - sum(v.heights);
    }
    const L = int(q.prompt, /(\d+) cubes long/), W = int(q.prompt, /(\d+) cubes wide/), T = int(q.prompt, /(\d+) cubes tall/);
    expect(v.box).toBe(T); expect(v.heights.length).toBe(W);
    for (const row of v.heights) { expect(row.length).toBe(L); for (const x of row) expect(x >= 1 && x <= T).toBe(true); }
    expect(sum(v.heights)).toBeLessThan(L * W * T);
    // whole layers, then whole rows, then at most one part row: the cubes in the box are countable
    const lo = Math.min(...v.heights.flat());
    expect(v.heights.flat().every((x) => x === lo || x === lo + 1)).toBe(true);
    expect(v.heights.filter((row) => row.some((x) => x === lo) && row.some((x) => x === lo + 1)).length).toBeLessThanOrEqual(1);
    return L * W * T - sum(v.heights);
  }
  // painted: sort every small cube by how many of its coordinates sit on the outside
  const p = q.visual as Extract<Visual, { type: 'paintcube' }>;
  const n = int(q.prompt, /small cubes, (\d+) along/);
  expect(p.n).toBe(n); expect(p.cut).toBeFalsy();
  expect(q.prompt).toContain('Its whole outside is painted, even the bottom.');
  const tally = [0, 0, 0, 0];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = 0; c < n; c++) tally[[a, b, c].filter((x) => x === 0 || x === n - 1).length]++;
  if (q.prompt.includes('at least one')) return n ** 3 - tally[0];
  if (q.prompt.includes('at least two')) return tally[2] + tally[3];
  if (q.prompt.includes('no paint')) return tally[0];
  return tally[int(q.prompt, /exactly (\d) face/)];
}

describe('Spatial Blocks geometry', () => {
  it('agrees with ray casting about which cubes show, on random stacks', () => {
    const rng = createRng(77);
    for (let i = 0; i < 300; i++) {
      const rows = rng.int(1, 4), cols = rng.int(1, 4);
      const h: Grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => rng.int(0, 4)));
      const mine = seenCubes(h); const rays = rayView(h);
      expect(mine.length).toBe(sum(h));
      for (const ray of rays) {
        const m = mine.find((x) => x.r === ray.r && x.c === ray.c && x.z === ray.z)!;
        expect(m.shown > 0, `any part of ${JSON.stringify(ray)} in ${JSON.stringify(h)}`).toBe(ray.any);
        expect(m.face, `a whole face of ${JSON.stringify(ray)} in ${JSON.stringify(h)}`).toBe(ray.full > 0);
      }
    }
  });
  it('finds a cube that could hide unseen (the picture check works)', () => {
    // a cube standing in the empty middle row sits exactly behind the 2-tall front tower to its right
    const twins = stacksWithPicture([[1, 1, 1], [0, 0, 0], [0, 2, 1]], 5);
    expect(twins).toContainEqual([[1, 1, 1], [1, 0, 0], [0, 2, 1]]);
    expect(pictureFixesStack([[1, 1, 1], [0, 0, 0], [0, 2, 1]])).toBe(false);
    for (const h of [[[1, 1, 1, 1], [0, 0, 0, 0], [1, 2, 1, 2]], [[1, 1, 3], [0, 0, 0], [2, 2, 0]]]) {
      expect(stacksWithPicture(h).length, JSON.stringify(h)).toBeGreaterThan(1);
      expect(pictureFixesStack(h)).toBe(false);
    }
    // a low front row does not hide anything
    for (const h of [[[3, 2, 1]], [[2, 3, 2], [0, 0, 0], [1, 1, 0]], [[3, 4, 2], [0, 0, 0], [2, 0, 1]]]) {
      expect(stacksWithPicture(h), JSON.stringify(h)).toEqual([h]);
      expect(pictureFixesStack(h)).toBe(true);
    }
  });
  it('agrees with the exact picture check on random two-row stacks', () => {
    const rng = createRng(12);
    for (let i = 0; i < 150; i++) {
      const cols = rng.int(2, 4);
      const h: Grid = [Array.from({ length: cols }, () => rng.int(1, 4)), Array(cols).fill(0), Array.from({ length: cols }, () => rng.int(0, 2))];
      expect(pictureFixesStack(h), JSON.stringify(h)).toBe(stacksWithPicture(h).length === 1);
    }
  });
  it('knows the classic cases', () => {
    expect(rayView([[2, 1], [1, 1]]).filter((x) => !x.any)).toEqual([expect.objectContaining({ r: 0, c: 0, z: 0 })]);
    expect(rayView([[3, 2, 1]]).every((x) => x.full > 0)).toBe(true);
    expect(rayView([[3, 3, 3], [3, 3, 3], [3, 3, 3]]).filter((x) => !x.any).length).toBe(8); // the 2 × 2 × 2 corner block
  });
});

describe('Spatial Blocks questions', () => {
  for (const kind of KINDS) for (const d of DS) {
    it(`${kind} at difficulty ${d}: right answers, fair choices, grade caps, labels`, () => {
      const r = createRng(1000 * d + kind.length);
      const g = gradeOf(d); const inBand = BLOCKS_KIND_GRADES[kind].includes(g);
      for (let i = 0; i < N; i++) {
        const q = blocksQuestion(kind, d, r);
        const where = `${kind} d${d} #${i}: ${q.prompt} ${JSON.stringify(q.visual)}`;
        expect(q.topic).toBe(BLOCKS_META.topic); expect(q.masterySkillId).toBe(`blocks.${kind}`); expect(q.visualFirst).toBe(true);
        expect(q.difficulty).toBe(d);
        expect(recompute(kind, q), where).toBe(q.answer);
        expect(checkAnswer(q, String(q.answer)), where).toBe(true);
        expect(Number.isInteger(q.answer) && q.answer > 0, where).toBe(true);
        for (const t of texts(q)) { expect(t, where).not.toMatch(/undefined|NaN|\[object/); }
        for (const t of [q.hint, ...q.solutionSteps, ...q.explanation]) checkLabels(t);
        expect(q.solutionSteps.flatMap(arithmeticSlips), where).toEqual([]);
        expect(q.solutionSteps.length).toBeGreaterThan(0);
        expect(q.solutionVisual, where).toBeTruthy();
        // the question picture never shows the answer
        if (q.visual.type === 'iso') expect(q.visual.ghost, where).toBeFalsy();
        if (q.visual.type === 'paintcube') expect(q.visual.cut, where).toBeFalsy();
        // the hint helps without giving the answer away
        if (q.answer > 2) expect(nums(q.hint), where).not.toContain(q.answer);
        if (q.choices) {
          const vals = q.choices.map((c) => c.value);
          expect(vals.length, where).toBeGreaterThanOrEqual(2); expect(vals.length).toBeLessThanOrEqual(5);
          expect(new Set(vals).size, where).toBe(vals.length);
          expect(vals, where).toContain(q.answer);
          if (q.choices.some((c) => c.visual)) expect([...vals].sort((a, b) => a - b), where).toEqual(vals.map((_, j) => j + 1));
          else for (const c of q.choices) { expect(c.label).toBe(String(c.value)); expect(c.value).toBeGreaterThan(0); }
        }
        if (inBand) expect(violatesCaps(g, { ...q, game: 'blocks' }), where).toBeNull();
        if (inBand && g === 'g1') {
          expect(q.choices, where).toBeTruthy(); expect(q.choices!.length).toBeLessThanOrEqual(4);
          expect(q.readAloud, where).toBeTruthy();
          for (const t of [q.prompt, q.readAloud!]) expect(Math.max(...words(t)), t).toBeLessThanOrEqual(12);
          for (const t of texts(q)) expect(Math.max(0, ...nums(t)), `${where} :: ${t}`).toBeLessThanOrEqual(20);
          expect(texts(q).join(' ')).not.toMatch(/%|percent/i);
        }
        if (inBand && g === 'g3') for (const t of texts(q)) expect(Math.max(0, ...nums(t))).toBeLessThanOrEqual(1000);
      }
    });
  }

  it('is deterministic for a seed', () => {
    for (const kind of [...KINDS, 'all'] as BlocksKind[]) for (const d of DS) {
      const a = blocksQuestion(kind, d, createRng(5)), b = blocksQuestion(kind, d, createRng(5));
      expect([a.prompt, a.answer, a.visual, a.choices, a.solutionSteps]).toEqual([b.prompt, b.answer, b.visual, b.choices, b.solutionSteps]);
    }
  });

  it('mixed play only picks kinds that suit the grade', () => {
    const r = createRng(9);
    for (const d of DS) for (let i = 0; i < 60; i++) {
      const q = blocksQuestion('all', d, r);
      expect(q.masterySkillId).toBe('blocks');
      const kind = BLOCKS_KINDS.find((k) => k.label === q.subtopic)!.id;
      expect(BLOCKS_KIND_GRADES[kind], `${kind} at d${d}`).toContain(gradeOf(d));
    }
  });

  it('keeps the count pictures fully visible and the hidden pictures solvable', () => {
    const r = createRng(31);
    let multiRow = 0, picks = 0, more = 0;
    for (let i = 0; i < 400; i++) {
      const q = blocksQuestion('count', ((i % 4) + 1) as Difficulty, r);
      const v = q.visual as Iso;
      if (q.choices?.some((c) => c.visual)) { q.prompt.includes('more') ? more++ : picks++; continue; }
      if (v.heights.length > 1) {
        multiRow++;
        // a back row, an empty row, and a front row lower than every back tower
        expect(v.heights).toHaveLength(3); expect(sum([v.heights[1]])).toBe(0);
        expect(Math.max(...v.heights[2]), JSON.stringify(v.heights)).toBeLessThan(Math.min(...v.heights[0]));
      }
      for (const cube of rayView(v.heights)) expect(cube.full).toBeGreaterThan(0);
    }
    expect(multiRow).toBeGreaterThan(20); expect(picks).toBeGreaterThan(10); expect(more).toBeGreaterThan(10);
    // a hidden stack: every tower's top shows in full, so each tower's height can be read off the picture
    for (let i = 0; i < 200; i++) {
      const q = blocksQuestion('hidden', ((i % 4) + 3) as Difficulty, r);
      const h = (q.visual as Iso).heights; const view = rayView(h);
      h.forEach((row, rr) => row.forEach((x, c) => { if (x) expect(view.find((y) => y.r === rr && y.c === c && y.z === x - 1)!.full).toBeGreaterThan(0); }));
    }
  });
});

describe('Spatial Blocks fairness and variety', () => {
  /** Questions with number buttons (not picture buttons): the sorted numbers, and which one is right. */
  const numberSets = (kind: BlocksKind, d: Difficulty, count: number, seed: number) => {
    const r = createRng(seed); const out: { v: number[]; pos: number; q: Question }[] = [];
    for (let i = 0; i < count; i++) {
      const q = blocksQuestion(kind, d, r);
      if (i === 40 && !out.length) break; // this setting has no number buttons
      if (!q.choices || q.choices.some((c) => c.visual)) continue;
      const v = q.choices.map((c) => c.value); out.push({ v, pos: v.indexOf(q.answer), q });
    }
    return out;
  };
  // a gap pattern: '1' for numbers in a row, '2' for 2 apart (fine pattern only), 'B' for further apart
  const gaps = (v: number[], fine: boolean) => v.slice(1).map((x, j) => (x - v[j] === 1 ? '1' : fine && x - v[j] === 2 ? '2' : 'B')).join('');
  for (const kind of KINDS) it(`${kind}: lets no blind guess beat chance (not the button, not the gaps between the numbers, not the middle value)`, () => {
    let settings = 0;
    for (const d of DS) {
      const train = numberSets(kind, d, 600, 4242 + d), test = numberSets(kind, d, 600, 999 + d);
      if (test.length < 150) continue;
      settings++;
      const n = test[0].v.length; const chance = 1 / n; const where = `${kind} d${d}`;
      for (const x of test) expect(x.v, where).toEqual([...x.v].sort((a, b) => a - b));
      // a guesser that learned, for each gap pattern, which button is most often right (tested on other questions)
      for (const fine of [false, true]) {
        const tab = new Map<string, number[]>();
        for (const x of train) { const k = gaps(x.v, fine); if (!tab.has(k)) tab.set(k, Array(n).fill(0)); tab.get(k)![x.pos]++; }
        const hits = test.filter((x) => { const t = tab.get(gaps(x.v, fine)); return (t ? t.indexOf(Math.max(...t)) : 0) === x.pos; }).length;
        expect(hits / test.length / chance, `${where}: gap guesser (${fine ? '1, 2 or far' : '1 or far'})`).toBeLessThan(1.3);
      }
      // always the same button
      for (let b = 0; b < n; b++) expect(test.filter((x) => x.pos === b).length / test.length / chance, `${where}: button ${b + 1}`).toBeLessThan(1.3);
      // "the one with a number 1 away from it" and "the one nearest the middle value"
      let nb = 0, mid = 0;
      for (const x of test) {
        const near = x.v.filter((a) => x.v.includes(a - 1) || x.v.includes(a + 1));
        nb += near.length ? (near.includes(x.v[x.pos]) ? 1 / near.length : 0) : chance;
        const mean = x.v.reduce((a, b) => a + b, 0) / n; const off = x.v.map((a) => Math.abs(a - mean));
        if (off.indexOf(Math.min(...off)) === x.pos) mid++;
      }
      expect(nb / test.length / chance, `${where}: neighbour rule`).toBeLessThan(1.3);
      expect(mid / test.length / chance, `${where}: nearest the middle value`).toBeLessThan(1.3);
    }
    expect(settings).toBeGreaterThan(0);
  });
  it('makes every number button a real slip, never a filler', () => {
    for (const kind of KINDS) for (const d of DS) for (const { v, q } of numberSets(kind, d, 150, 60 + d)) {
      const where = `${kind} d${d}: ${q.prompt} ${v.join(', ')} (answer ${q.answer})`;
      if (kind === 'count' || kind === 'hidden' || (kind === 'layers' && !q.prompt.includes('layers need'))) {
        // a count: one, two or three too few or too many
        expect(v, where).toEqual(v.map((_, i) => v[0] + i));
      } else if (kind === 'layers') {
        // the totals for a layer or two fewer or more, by the same rule
        const fam = familyOf(q.prompt); const totals = Array.from({ length: 14 }, (_, j) => layerTotal(fam, j + 1));
        const at = totals.indexOf(v[0]);
        expect(at, where).toBeGreaterThanOrEqual(0);
        expect(v, where).toEqual(totals.slice(at, at + v.length));
        expect(gradeOf(d)).toBe('g5');
      } else if (kind === 'fill') {
        // a row of the box (one, two…) miscounted
        const L = int(q.prompt, /(\d+) cubes long/);
        expect(v.slice(1).map((x, j) => x - v[j]), where).toEqual(Array(v.length - 1).fill(L));
      } else {
        // the four kinds of small cube, and one slip in working out a count
        const n = int(q.prompt, /small cubes, (\d+) along/); const m = n - 2;
        const kinds = [8, 12 * m, 6 * m * m, m ** 3];
        expect(new Set(kinds).size).toBe(4);
        for (const c of kinds) expect(v, where).toContain(c);
        const extra = v.filter((x) => !kinds.includes(x));
        expect(extra).toHaveLength(1);
        expect([24, 4, 12 * n, 12 * (n - 1), 6 * n * n, 6 * (n - 1) ** 2, 5 * m * m, (n - 1) ** 3, 3 * m, n ** 3], where).toContain(extra[0]);
      }
    }
  });
  it('draws the stacks of one question at one cube size, tower on either side', () => {
    const r = createRng(41); const sides = new Set<boolean>(); let pics = 0;
    for (let i = 0; i < 300; i++) {
      const q = blocksQuestion('count', ((i % 2) + 1) as Difficulty, r);
      const vs = (q.choices ?? []).flatMap((c) => (c.visual ? [c.visual as Iso] : []));
      if (!vs.length) continue;
      pics++;
      for (const v of vs) expect(blocksSmallEdge(v.heights), JSON.stringify(v.heights)).toBe(BLOCKS_SMALL_EDGE);
      if (q.prompt.includes('more')) sides.add((q.visual as Iso).heights[0][1] === 0);
    }
    expect(pics).toBeGreaterThan(50); expect(sides.size).toBe(2);
  });
  it('has enough different questions in each setting', () => {
    const distinct = (kind: BlocksKind, d: Difficulty) => {
      const r = createRng(90 + d); const seen = new Set<string>();
      for (let i = 0; i < 200; i++) { const q = blocksQuestion(kind, d, r); seen.add(q.prompt + JSON.stringify(q.visual)); }
      return seen.size;
    };
    expect(distinct('layers', 5)).toBeGreaterThanOrEqual(16);
    expect(distinct('layers', 6)).toBeGreaterThanOrEqual(30);
    expect(distinct('fill', 3)).toBeGreaterThanOrEqual(40);
    expect(distinct('painted', 5)).toBeGreaterThanOrEqual(12);
    expect(distinct('painted', 6)).toBeGreaterThanOrEqual(18);
  });
});

describe('Spatial Blocks lessons and wiring', () => {
  it('teaches on pictures, then tries real skills', () => {
    expect(BLOCKS_LESSONS.length).toBeGreaterThanOrEqual(2);
    expect(PICTURE_GAMES.blocks.lessons.map(([id]) => id)).toEqual(BLOCKS_LESSONS.map((l) => l.id));
    const kinds = new Set(BLOCKS_KINDS.map((k) => `blocks.${k.id}`));
    BLOCKS_LESSONS.forEach((l, i) => {
      expect(l.id).toBe(`l.blocks-${i + 1}`); expect(l.group).toBe(BLOCKS_META.label); expect(['vector', 'newton']).toContain(l.teacher);
      const says = l.steps.filter((s) => s.type === 'say'); const tries = l.steps.filter((s) => s.type === 'try');
      expect(says.some((s) => s.type === 'say' && s.visual && s.caption)).toBe(true);
      expect(tries.length).toBeGreaterThan(0); expect(l.steps.at(-1)!.type).toBe('summary');
      for (const s of l.steps) {
        if (s.type === 'say') { checkLabels(s.text); expect(arithmeticSlips(s.text), s.text).toEqual([]); expect(['vector', 'newton']).toContain(s.speaker); }
        if (s.type === 'try') {
          expect(kinds.has(s.skillId), s.skillId).toBe(true); expect(s.count).toBeGreaterThanOrEqual(3); expect(s.count).toBeLessThanOrEqual(4);
          const kind = s.skillId.split('.')[1];
          expect(BLOCKS_KIND_GRADES[kind]).toContain(gradeOf(s.difficulty));
          const q = blocksQuestion(kind as BlocksKind, s.difficulty, createRng(1));
          expect(q.masterySkillId).toBe(s.skillId);
        }
      }
    });
    // captions and layer counts match the pictures
    for (const l of BLOCKS_LESSONS) for (const st of l.steps) {
      if (st.type !== 'say' || st.visual?.type !== 'iso') continue;
      const v = st.visual as Iso; const cap = st.caption ?? '';
      const hid = rayView(v.heights).filter((x) => !x.any).length;
      const said = /(\d+) hidden cubes/.exec(cap);
      if (said) expect(hid, cap).toBe(Number(said[1]));
      if (/the hidden cube\b/.test(cap)) expect(hid, cap).toBe(1);
      if (v.layers) {
        const K = Math.max(...v.heights.flat());
        const sizes = Array.from({ length: K }, (_, j) => v.heights.flat().filter((x) => x >= K - j).length);
        expect(nums(`${st.text} ${cap}`), st.text).toEqual(expect.arrayContaining(sizes));
      }
    }
    // one lesson for Grades 1 to 3, one for Grade 5
    const tryGrades = BLOCKS_LESSONS.map((l) => l.steps.flatMap((s) => (s.type === 'try' ? [gradeOf(s.difficulty)] : [])));
    expect(tryGrades.some((gs) => gs.includes('g1'))).toBe(true);
    expect(tryGrades.some((gs) => gs.every((g) => g === 'g5'))).toBe(true);
    expect(BLOCKS_META.intro.length).toBeGreaterThan(80); expect(BLOCKS_META.intro).not.toBe(BLOCKS_META.blurb);
  });
  it('never tries a question the lesson has just worked out', () => {
    let checked = 0;
    for (const l of BLOCKS_LESSONS) {
      const says = l.steps.flatMap((s) => (s.type === 'say' ? [s] : []));
      const worked = new Set(says.flatMap((s) => nums(s.text)));
      const pics = says.flatMap((s) => (s.visual ? [s.visual as Visual] : []));
      for (const st of l.steps) {
        if (st.type !== 'try') continue;
        const r = createRng(2024 + st.difficulty);
        for (let i = 0; i < 1200; i++) {
          const q = blocksQuestion(st.skillId.split('.')[1] as BlocksKind, st.difficulty, r); const v = q.visual;
          const where = `${l.id} try ${st.skillId} d${st.difficulty}: ${q.prompt} ${JSON.stringify(v)} = ${q.answer}`;
          for (const p of pics) {
            // a painted cube the lesson sorted in full is never the try's cube
            if (v.type === 'paintcube' && p.type === 'paintcube') expect(v.n, where).not.toBe(p.n);
            // the lesson's stack may come back, but never with an answer the lesson worked out
            if (v.type === 'iso' && p.type === 'iso' && JSON.stringify(v.heights) === JSON.stringify(p.heights) && (v.box ?? 0) === (p.box ?? 0)) { checked++; expect(worked.has(q.answer), where).toBe(false); }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0); // the 3-layer staircase of l.blocks-3 comes back, grown to 5 or 6 layers
  });
});
