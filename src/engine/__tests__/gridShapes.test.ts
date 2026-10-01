import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { PICTURE_GAMES } from '../questions/games';
import { GRID_KIND_GRADES, GRID_KINDS, GRID_META, gridQuestion, buildSymShape, SYM_POOL, SYM_SIZE, SYM_SPARE, SYM_LINES, type GridKind } from '../questions/gridShapes';
import { gridLayout, Tangram } from '../../game/components/contest/GridViz';
import { GRID_LESSONS } from '../../content/contest/gridShapes';
import { gradeOf } from '../contest/common';
import { violatesCaps } from '../contest/grades';
import { LABELED, stripLabels } from '../label';
import { arithmeticSlips } from '../academy/teachMath';
import type { Difficulty, Question, Visual } from '../types';

type GridV = Extract<Visual, { type: 'gridshape' }>;
type TanV = Extract<Visual, { type: 'tangram' }>;
type Cell = [number, number];
type Pt = [number, number];
const KINDS = ['mirror', 'lines', 'area', 'perimeter', 'tangram'] as const;
const DS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const N = 120;

/* ---------- independent geometry (no generator helpers) ---------- */

const key = ([c, r]: Cell) => `${c},${r}`;
const keys = (cells: readonly Cell[]) => new Set(cells.map(key));
const sameSet = (a: readonly Cell[], b: readonly Cell[]) => { const A = keys(a), B = keys(b); return A.size === B.size && [...A].every((k) => B.has(k)); };
/** Unit edges with a shaded square on one side only. */
function perimeterOf(cells: readonly Cell[]): number {
  const s = keys(cells); let edges = 0;
  for (const [c, r] of cells) { if (!s.has(key([c + 1, r]))) edges++; if (!s.has(key([c - 1, r]))) edges++; if (!s.has(key([c, r + 1]))) edges++; if (!s.has(key([c, r - 1]))) edges++; }
  return edges;
}
/** Move a set of squares so its lowest-leftmost box corner sits at (0, 0), as sorted keys. */
const norm = (cells: readonly Cell[]) => { const x0 = Math.min(...cells.map((p) => p[0])), y0 = Math.min(...cells.map((p) => p[1])); return cells.map(([c, r]) => `${c - x0},${r - y0}`).sort().join(';'); };
/** Lines of symmetry by reflecting the whole set and comparing it, moved back into place, with the original. */
function symmetryCount(cells: readonly Cell[]): number {
  const base = norm(cells);
  const maps: ((p: Cell) => Cell)[] = [([c, r]) => [-c, r], ([c, r]) => [c, -r], ([c, r]) => [r, c], ([c, r]) => [-r, -c]];
  return maps.filter((f) => norm(cells.map(f)) === base).length;
}
/** Components by 8-neighbour flood fill (letters drawn apart from each other). */
function components(cells: readonly Cell[], eight: boolean): Cell[][] {
  const left = new Map(cells.map((p) => [key(p), p])); const out: Cell[][] = [];
  const nb = eight ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (left.size) {
    const first = left.values().next().value as Cell; left.delete(key(first)); const comp: Cell[] = [first]; const stack = [first];
    while (stack.length) { const [c, r] = stack.pop()!; for (const [dc, dr] of nb) { const k = key([c + dc, r + dr]); const p = left.get(k); if (p) { left.delete(k); comp.push(p); stack.push(p); } } }
    out.push(comp);
  }
  return out;
}
/** Twin of a square across a mirror line on a grid line. */
const twinOf = (axis: { dir: 'v' | 'h'; at: number }) => ([c, r]: Cell): Cell => (axis.dir === 'v' ? [axis.at + (axis.at - c - 1), r] : [c, axis.at + (axis.at - r - 1)]);
const shoelace = (p: readonly Pt[]) => Math.abs(p.reduce((a, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return a + x * y2 - x2 * y; }, 0)) / 2;
/** Lines of symmetry of a polygon by sweeping the angle in half degrees through the centre of its corners. */
function polySymmetry(pts: readonly Pt[]): number {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  let n = 0;
  for (let k = 0; k < 360; k++) {
    const t = (k * Math.PI) / 360; const ux = Math.cos(t), uy = Math.sin(t);
    const ok = pts.every(([x, y]) => { const dx = x - cx, dy = y - cy, d = dx * ux + dy * uy; const rx = cx + 2 * d * ux - dx, ry = cy + 2 * d * uy - dy; return pts.some(([px, py]) => Math.hypot(px - rx, py - ry) < 2e-3); });
    if (ok) n++;
  }
  return n;
}
/* Tangram pieces, written out again: corners of each shape turned anticlockwise, box moved to (x, y). */
const SHAPE: Record<string, Pt[]> = { 'tri-s': [[0, 0], [1, 0], [0, 1]], 'tri-m': [[0, 0], [2, 0], [1, 1]], 'tri-l': [[0, 0], [2, 0], [0, 2]], square: [[0, 0], [1, 0], [1, 1], [0, 1]], para: [[0, 0], [1, 0], [2, 1], [1, 1]] };
function corners(p: TanV['pieces'][number]): Pt[] {
  let q = SHAPE[p.kind];
  for (let t = 0; t < p.rot / 90; t++) q = q.map(([a, b]): Pt => [-b, a]);
  const mx = Math.min(...q.map((v) => v[0])), my = Math.min(...q.map((v) => v[1]));
  return q.map(([a, b]): Pt => [a - mx + p.x, b - my + p.y]);
}
function inside(px: number, py: number, poly: readonly Pt[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c; }
  return c;
}
/** Pieces stay on the 4 × 4 board and never overlap (checked on a fine grid of sample points). */
function checkBoard(v: TanV, where: string) {
  const polys = v.pieces.map(corners);
  for (const p of polys) for (const [x, y] of p) { expect(x >= -1e-9 && x <= 4 + 1e-9 && y >= -1e-9 && y <= 4 + 1e-9, where).toBe(true); }
  for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) {
    const x = (i + 0.37) / 10, y = (j + 0.61) / 10;
    expect(polys.filter((p) => inside(x, y, p)).length, `${where} overlap at ${x},${y}`).toBeLessThanOrEqual(1);
  }
}
const smallTriangles = (pieces: TanV['pieces']) => pieces.filter((p) => !p.ghost).reduce((a, p) => a + shoelace(corners(p)) / 0.5, 0);

/* ---------- checks shared by every question ---------- */

const LABEL_OK = /^[A-Za-z][A-Za-z ',/-]*[A-Za-z]$/;
/** Words that end in s without being plurals. */
const NOT_PLURAL = new Set(['is', 'has', 'its', 'this', 'was', 'less', 'across']);
function checkLabels(s: string) {
  const after = [...s.matchAll(/(?:\d|\?) \(([^)]*)\)/g)];
  for (const m of after) expect(LABEL_OK.test(m[1]), `bad label "(${m[1]})" in: ${s}`).toBe(true);
  expect([...s.matchAll(new RegExp(LABELED.source, 'g'))].length, s).toBe(after.length);
  // exactly 1 of something takes the singular: "1 (square)", never "1 (squares)"
  for (const m of s.matchAll(/(?<![\d.,])1 \(([^)]*)\)/g)) {
    const plural = m[1].split(/[\s/-]+/).filter((w) => /s$/.test(w) && !NOT_PLURAL.has(w));
    expect(plural, `plural label after 1 in: ${s}`).toEqual([]);
  }
}
const words = (s: string) => s.split(/[.?!]/).map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length);
const nums = (s: string) => [...s.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, '')));
const texts = (q: Question) => [q.prompt, q.expression, q.hint, q.readAloud ?? '', ...q.solutionSteps, ...q.explanation, ...(q.choices ?? []).map((c) => c.label)];
const int = (s: string, re: RegExp) => { const m = re.exec(s); expect(m, `${re} in "${s}"`).toBeTruthy(); return Number(m![1]); };
const inGrid = (v: GridV, cells: readonly Cell[]) => cells.every(([c, r]) => c >= 0 && r >= 0 && c < v.w && r < v.h);

/** Side labels sit on the outline, and every number written is the true length of its stretch. */
function checkSides(v: GridV, where: string) {
  const s = keys(v.cells);
  for (const sd of v.sides ?? []) {
    const [ax, ay] = sd.a, [bx, by] = sd.b; expect(ax === bx || ay === by, where).toBe(true);
    const len = Math.abs(bx - ax) + Math.abs(by - ay);
    for (let t = 0; t < len; t++) {
      const across = ay === by; const x = Math.min(ax, bx) + (across ? t : 0), y = Math.min(ay, by) + (across ? 0 : t);
      const a: Cell = across ? [x, y] : [x, y], b: Cell = across ? [x, y - 1] : [x - 1, y];
      expect(s.has(key(a)) !== s.has(key(b)), `${where}: label ${JSON.stringify(sd)} is not on the outline`).toBe(true);
    }
    if (sd.text.trim() !== '?') expect(parseInt(sd.text, 10), where).toBe(len);
  }
}

/** The answer worked out again from the picture and the words, without the generator's helpers. */
function recompute(kind: string, q: Question): number {
  const where = `${q.prompt} ${JSON.stringify(q.visual)}`;
  if (kind === 'tangram') {
    const v = q.visual as TanV; expect(v.type).toBe('tangram'); checkBoard(v, where);
    expect(v.marks, where).toBeFalsy();
    const shown = v.pieces.filter((p) => !p.ghost);
    if (q.prompt.includes('Which piece fills the gap')) {
      const gap = v.pieces.filter((p) => p.ghost); expect(gap).toHaveLength(1);
      const hits = q.choices!.filter((c) => (c.visual as TanV).pieces[0].kind === gap[0].kind);
      expect(hits).toHaveLength(1);
      // the right piece, turned the same way, fills the gap exactly
      const ok = corners({ ...(hits[0].visual as TanV).pieces[0], x: gap[0].x, y: gap[0].y }).map(String).sort().join(';');
      expect(ok).toBe(corners(gap[0]).map(String).sort().join(';'));
      expect(new Set(q.choices!.map((c) => (c.visual as TanV).pieces[0].kind)).size).toBe(q.choices!.length);
      return hits[0].value;
    }
    expect(v.pieces.some((p) => p.ghost)).toBe(false);
    if (q.prompt.startsWith('How many pieces')) return shown.length;
    if (q.prompt.startsWith('How many triangle pieces')) return shown.filter((p) => SHAPE[p.kind].length === 3).length;
    if (q.prompt.startsWith('How many small triangles make')) { expect(shown.every((p) => p.kind === 'tri-s')).toBe(true); return Math.round(smallTriangles(shown)); }
    expect(!!v.outline, where).toBe(q.prompt.includes('outline'));
    return Math.round(smallTriangles(shown));
  }
  const v = q.visual as GridV; expect(v.type, where).toBe('gridshape');
  expect(inGrid(v, v.cells), where).toBe(true);
  // the question picture never shows the answer
  expect(v.ghost ?? [], where).toEqual([]); expect(v.count, where).toBeFalsy(); expect(v.lines ?? [], where).toEqual([]);
  checkSides(v, where);
  if (kind === 'mirror') {
    expect(v.axis, where).toBeTruthy(); const tw = twinOf(v.axis!);
    if (q.choices?.some((c) => c.visual)) {
      expect(v.cells.every(([c, r]) => (v.axis!.dir === 'v' ? c < v.axis!.at : r < v.axis!.at)), where).toBe(true);
      const done = [...v.cells, ...v.cells.map(tw)];
      const hits = q.choices!.filter((c) => sameSet((c.visual as GridV).cells, done));
      expect(hits, where).toHaveLength(1);
      for (const c of q.choices!) { const cv = c.visual as GridV; expect(inGrid(cv, cv.cells)).toBe(true); expect(cv.axis).toEqual(v.axis); }
      return hits[0].value;
    }
    const twins = v.cells.map(tw); expect(inGrid(v, twins), where).toBe(true);
    const missing = twins.filter((p) => !keys(v.cells).has(key(p))).length;
    return q.prompt.includes('in all') ? v.cells.length + missing : missing;
  }
  if (kind === 'lines') {
    if (v.poly?.length) { expect(v.cells).toEqual([]); return polySymmetry(v.poly); }
    if (q.prompt.includes('add them up')) {
      const letters = components(v.cells, true); expect(letters).toHaveLength(3);
      return letters.reduce((a, l) => a + symmetryCount(l), 0);
    }
    return symmetryCount(v.cells);
  }
  if (kind === 'area') {
    if (q.prompt.startsWith('Which shape has more')) {
      const counts = q.choices!.map((c) => (c.visual as GridV).cells.length);
      const [l, r] = components(v.cells, false).length === 2 ? [0, 0] : [0, 0];
      void l; void r;
      expect(counts[0] + counts[1]).toBe(v.cells.length); expect(counts[0]).not.toBe(counts[1]);
      return q.choices![counts.indexOf(Math.max(...counts))].value;
    }
    if (v.poly?.length) { expect(v.cells).toEqual([]); return shoelace(v.poly); }
    if (v.plain) {
      // drawn to scale: every side is labelled, at most one is "?", and a "?" can be found from the edges across from it
      const sides = v.sides ?? []; expect(sides.reduce((a, s) => a + Math.abs(s.b[0] - s.a[0]) + Math.abs(s.b[1] - s.a[1]), 0)).toBe(perimeterOf(v.cells));
      expect(sides.filter((s) => s.text.includes('?')).length).toBeLessThanOrEqual(q.difficulty === 6 ? 1 : 0);
    }
    for (const [c, r] of v.halves ?? []) { expect(keys(v.cells).has(key([c, r])), where).toBe(false); expect(c >= 0 && r >= 0 && c < v.w && r < v.h).toBe(true); }
    expect((v.halves ?? []).length % 2, where).toBe(0);
    return v.cells.length + (v.halves ?? []).length / 2;
  }
  // perimeter
  const parts = components(v.cells, false);
  for (const p of parts) { expect(components(p, true)).toHaveLength(1); }
  if (q.prompt.includes('How much longer')) {
    expect(parts).toHaveLength(2);
    const n = int(q.prompt, /made of (\d+) squares/);
    const [L, R] = [...parts].sort((a, b) => Math.min(...a.map((p) => p[0])) - Math.min(...b.map((p) => p[0])));
    expect(L.length).toBe(n); expect(R.length).toBe(n);
    return perimeterOf(R) - perimeterOf(L);
  }
  expect(parts).toHaveLength(1);
  if (v.plain) {
    const sides = v.sides ?? []; const hidden = sides.filter((s) => s.text.includes('?'));
    expect(sides.reduce((a, s) => a + Math.abs(s.b[0] - s.a[0]) + Math.abs(s.b[1] - s.a[1]), 0)).toBe(perimeterOf(v.cells));
    expect(hidden.length).toBeGreaterThan(0);
    // the edges facing up add up to the edges facing down (and the same left to right): the hidden total can always be found
    for (const across of [true, false]) {
      const known = sides.filter((s) => (across ? s.a[1] === s.b[1] : s.a[0] === s.b[0]));
      expect(known.filter((s) => s.text.includes('?')).length).toBeLessThanOrEqual(2);
    }
  }
  return perimeterOf(v.cells);
}

describe('Mirror & Grid questions', () => {
  for (const kind of KINDS) for (const d of DS) {
    it(`${kind} at difficulty ${d}: right answers, fair choices, grade caps, labels`, () => {
      const r = createRng(1000 * d + kind.length * 7);
      const g = gradeOf(d); const inBand = GRID_KIND_GRADES[kind].includes(g);
      for (let i = 0; i < N; i++) {
        const q = gridQuestion(kind, d, r);
        const where = `${kind} d${d} #${i}: ${q.prompt} ${JSON.stringify(q.visual)}`;
        expect(q.topic).toBe(GRID_META.topic); expect(q.masterySkillId).toBe(`grid.${kind}`); expect(q.visualFirst).toBe(true);
        expect(q.difficulty).toBe(d);
        expect(recompute(kind, q), where).toBeCloseTo(q.answer, 9);
        expect(checkAnswer(q, String(q.answer)), where).toBe(true);
        expect(q.answer >= 0 && Number.isInteger(q.answer * 2), where).toBe(true);
        for (const t of texts(q)) expect(t, where).not.toMatch(/undefined|NaN|\[object|Infinity/);
        for (const t of [q.hint, ...q.solutionSteps, ...q.explanation]) checkLabels(t);
        expect(q.solutionSteps.flatMap(arithmeticSlips), where).toEqual([]);
        expect(q.solutionSteps.length).toBeGreaterThan(0);
        expect(q.solutionVisual, where).toBeTruthy();
        // the hint helps without giving the answer away
        if (q.answer > 2) expect(nums(q.hint), where).not.toContain(q.answer);
        if (q.choices) {
          const vals = q.choices.map((c) => c.value);
          expect(vals.length, where).toBeGreaterThanOrEqual(2); expect(vals.length).toBeLessThanOrEqual(5);
          expect(new Set(vals).size, where).toBe(vals.length);
          expect(vals, where).toContain(q.answer);
          if (q.choices.some((c) => c.visual)) expect([...vals].sort((a, b) => a - b), where).toEqual(vals.map((_, j) => j + 1));
          else for (const c of q.choices) { expect(c.label).toBe(String(c.value)); expect(c.value).toBeGreaterThanOrEqual(0); }
        }
        if (inBand) expect(violatesCaps(g, { ...q, game: 'grid' }), where).toBeNull();
        if (inBand && g === 'g1') {
          expect(q.choices, where).toBeTruthy(); expect(q.choices!.length).toBeLessThanOrEqual(4);
          expect(q.readAloud, where).toBeTruthy();
          for (const t of [q.prompt, q.readAloud!, q.hint]) expect(Math.max(...words(t)), t).toBeLessThanOrEqual(12);
          // worked steps stay short too (number labels are not counted as words)
          for (const t of q.solutionSteps) expect(Math.max(...words(stripLabels(t))), t).toBeLessThanOrEqual(14);
          for (const t of texts(q)) expect(Math.max(0, ...nums(t)), `${where} :: ${t}`).toBeLessThanOrEqual(20);
          expect(texts(q).join(' ')).not.toMatch(/%|percent/i);
          if (q.visual.type === 'gridshape') { expect(q.visual.w).toBeLessThanOrEqual(8); expect(q.visual.h).toBeLessThanOrEqual(6); }
        }
        if (inBand && g === 'g3') for (const t of texts(q)) expect(Math.max(0, ...nums(t))).toBeLessThanOrEqual(1000);
        if (kind === 'mirror' && g === 'g1') expect((q.visual as GridV).axis?.dir).toBe('v');
      }
    });
  }

  it('is deterministic for a seed', () => {
    for (const kind of [...KINDS, 'all'] as GridKind[]) for (const d of DS) {
      const a = gridQuestion(kind, d, createRng(5)), b = gridQuestion(kind, d, createRng(5));
      expect([a.prompt, a.answer, a.visual, a.choices, a.solutionSteps, a.solutionVisual]).toEqual([b.prompt, b.answer, b.visual, b.choices, b.solutionSteps, b.solutionVisual]);
    }
  });

  it('mixed play only picks kinds that suit the grade', () => {
    const r = createRng(9);
    for (const d of DS) for (let i = 0; i < 60; i++) {
      const q = gridQuestion('all', d, r);
      expect(q.masterySkillId).toBe('grid');
      const kind = GRID_KINDS.find((k) => k.label === q.subtopic)!.id;
      expect(GRID_KIND_GRADES[kind], `${kind} at d${d}`).toContain(gradeOf(d));
    }
  });

  it('covers every question type and keeps the worked pictures honest', () => {
    const r = createRng(42); const seen = new Set<string>();
    for (const kind of KINDS) for (const d of DS) for (let i = 0; i < 60; i++) {
      const q = gridQuestion(kind, d, r);
      seen.add(`${kind}:${q.prompt.replace(/\d+/g, '#')}`);
      const s = q.solutionVisual!;
      if (kind === 'mirror') {
        const v = q.visual as GridV; const sv = s as GridV; const tw = twinOf(v.axis!);
        const finished = q.choices?.some((c) => c.visual) ? [...v.cells, ...v.cells.map(tw)] : [...v.cells, ...v.cells.map(tw)];
        expect(sameSet([...sv.cells, ...(sv.ghost ?? [])], finished)).toBe(true);
        // a wrong flip across a side-to-side mirror is left to right, not upside down
        if (v.axis!.dir === 'h') expect(q.solutionSteps.join(' '), q.prompt).not.toMatch(/upside down/);
      }
      if (kind === 'lines' && s.type === 'gridshape') expect((s.lines ?? []).length, q.prompt).toBe(q.answer);
      if (s.type === 'tangram' && q.visual.type === 'tangram') {
        // the worked picture is the same pieces with the gap filled in by the right piece
        expect(s.pieces.some((p) => p.ghost), q.prompt).toBe(false);
        expect(s.pieces.map((p) => corners(p).map(String).sort().join(';')), q.prompt).toEqual(q.visual.pieces.map((p) => corners(p).map(String).sort().join(';')));
        if (q.visual.pieces.some((p) => p.ghost)) checkBoard(s, q.prompt);
      }
    }
    // every family shows up: mirror pick/count/partial/total, letters, polygons, words, composites, triangles, tangram kinds
    const fams = ['Which picture finishes', 'How many squares do you shade', 'Some twins are shaded', 'shaded in all', 'both sides match',
      'This is the letter', 'This is a', 'The word', 'Which shape has more', 'half squares make', 'gold rectangle', 'square metres', 'gold triangle',
      'perimeter of the gold shape', 'Some sides are not labelled', 'How much longer', 'How many pieces', 'Which piece fills', 'How many triangle pieces', 'How many small triangles make', 'outline', 'in small triangles'];
    const all = [...seen].join('\n');
    for (const f of fams) expect(all, f).toContain(f);
  });

  it('draws symmetric shapes of every count and polygons with the counts in their reasons', () => {
    const r = createRng(77); const counts = new Set<number>();
    for (let i = 0; i < 400; i++) {
      const q = gridQuestion('lines', ((i % 4) + 3) as Difficulty, r);
      counts.add(q.answer);
      expect(q.solutionSteps.join(' ')).toMatch(new RegExp(`\\b${q.answer} \\(line`));
    }
    for (const n of [0, 1, 2, 3, 4, 5, 6, 8]) expect(counts.has(n), `a shape with ${n} lines`).toBe(true);
  });
});

/* ---------- pictures: labels that fit, lines that stay apart, colours, numbers ---------- */

type Box = { x0: number; x1: number; y0: number; y1: number };
/** A label's box worked out again: monospace digits about 0.6 of the font size wide, plus the dark outline. */
function textBox(l: { x: number; y: number; anchor: string; size: number; text: string }): Box {
  const tw = l.text.length * 0.6 * l.size; const x0 = l.anchor === 'start' ? l.x : l.anchor === 'end' ? l.x - tw : l.x - tw / 2;
  return { x0: x0 - 1.5, x1: x0 + tw + 1.5, y0: l.y - 0.72 * l.size - 1.5, y1: l.y + 1.5 };
}
const apart = (a: Box, b: Box, gap: number) => a.x1 + gap <= b.x0 || b.x1 + gap <= a.x0 || a.y1 + gap <= b.y0 || b.y1 + gap <= a.y0;
function segDist([px, py]: Pt, [ax, ay]: Pt, [bx, by]: Pt): number {
  const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
/** Every length label is inside the picture, clear of the other labels and of the gold squares, and nearest to its own edge. */
function checkLabelLayout(v: GridV, where: string) {
  const L = gridLayout(v);
  const X = (x: number) => L.padL + x * L.s, Y = (y: number) => L.padT + (L.h - y) * L.s;
  expect(L.labels).toHaveLength((v.sides ?? []).length);
  const boxes = L.labels.map(textBox);
  boxes.forEach((b, i) => {
    const t = L.labels[i].text;
    expect(b.x0 >= 0 && b.x1 <= L.W && b.y0 >= 0 && b.y1 <= L.H, `${where}: label "${t}" is cut off (${JSON.stringify(b)} in ${L.W} × ${L.H})`).toBe(true);
    for (let j = i + 1; j < boxes.length; j++) expect(apart(b, boxes[j], 2), `${where}: labels "${t}" and "${L.labels[j].text}" touch`).toBe(true);
    for (const [c, r] of v.cells) expect(apart(b, { x0: X(c), x1: X(c + 1), y0: Y(r + 1), y1: Y(r) }, 0), `${where}: label "${t}" covers a square`).toBe(true);
    // the edge a label names is the nearest labelled edge to it
    const centre: Pt = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
    const dist = (k: number) => { const sd = v.sides![L.labels[k].side]; return segDist(centre, [X(sd.a[0]), Y(sd.a[1])], [X(sd.b[0]), Y(sd.b[1])]); };
    const own = dist(i);
    expect(own, `${where}: label "${t}" is far from its edge`).toBeLessThan(40);
    for (let k = 0; k < boxes.length; k++) if (k !== i) expect(own, `${where}: label "${t}" sits nearer the edge labelled "${L.labels[k].text}"`).toBeLessThan(dist(k) + 0.5);
  });
}
/** Two pieces share a stretch of edge (not just a corner). */
function shareEdge(a: Pt[], b: Pt[]): boolean {
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    const p = a[i], q = a[(i + 1) % a.length], u = b[j], w = b[(j + 1) % b.length];
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const cross = (r: Pt) => dx * (r[1] - p[1]) - dy * (r[0] - p[0]);
    if (Math.abs(cross(u)) > 1e-9 || Math.abs(cross(w)) > 1e-9) continue;
    const proj = (r: Pt) => ((r[0] - p[0]) * dx + (r[1] - p[1]) * dy) / (dx * dx + dy * dy);
    const [s0, s1] = [proj(u), proj(w)].sort((m, n) => m - n);
    if (Math.min(1, s1) - Math.max(0, s0) > 1e-6) return true;
  }
  return false;
}
/** The numbers written on a tangram picture. */
const tanNumbers = (v: TanV) => [...renderToStaticMarkup(createElement(Tangram, { v })).matchAll(/>(\d+)<\/text>/g)].map((m) => Number(m[1]));
/** A picture's shape wherever it sits: squares, polygon corners or pieces moved to the origin (mirror squares measured from the mirror line). */
function shapeKey(v: Visual): string {
  if (v.type === 'tangram') {
    const all = v.pieces.filter((p) => !p.ghost).map(corners); const x0 = Math.min(...all.flat().map((p) => p[0])), y0 = Math.min(...all.flat().map((p) => p[1]));
    return all.map((p) => p.map(([x, y]) => `${x - x0},${y - y0}`).sort().join(' ')).sort().join(';');
  }
  if (v.type !== 'gridshape') return '';
  if (v.poly?.length) { const x0 = Math.min(...v.poly.map((p) => p[0])), y0 = Math.min(...v.poly.map((p) => p[1])); return `poly:${v.poly.map(([x, y]) => `${+(x - x0).toFixed(3)},${+(y - y0).toFixed(3)}`).sort().join(';')}`; }
  if (v.axis) { const y0 = Math.min(...v.cells.map((p) => p[1])); return `mirror:${v.axis.dir}:${v.cells.map(([c, r]) => `${c - v.axis!.at},${r - y0}`).sort().join(';')}`; }
  return v.cells.length ? norm(v.cells) : '';
}

describe('Mirror & Grid pictures', () => {
  it('length labels never crowd, never cover the shape and are never cut off', () => {
    for (const kind of ['area', 'perimeter'] as const) for (const d of [3, 4, 5, 6] as Difficulty[]) {
      const r = createRng(9000 + d * 7 + kind.length);
      for (let i = 0; i < 300; i++) {
        const q = gridQuestion(kind, d, r);
        for (const v of [q.visual, q.solutionVisual]) if (v?.type === 'gridshape' && v.sides?.length) checkLabelLayout(v, `${kind} d${d} #${i} ${q.prompt}`);
      }
    }
    for (const l of GRID_LESSONS) for (const st of l.steps) if (st.type === 'say' && st.visual?.type === 'gridshape' && st.visual.sides?.length) checkLabelLayout(st.visual, st.text);
  });

  it('every lines-of-symmetry kind builds fresh shapes at every size it is asked for', () => {
    for (const [sym, rows] of Object.entries(SYM_SPARE)) {
      const cells = rows.flatMap((row, i) => [...row].flatMap((m, c): Cell[] => (m === 'X' ? [[c, rows.length - 1 - i]] : [])));
      expect(symmetryCount(cells), sym).toBe(SYM_LINES[sym as keyof typeof SYM_LINES]);
    }
    for (const d of [3, 4, 5, 6]) for (const sym of SYM_POOL[d]) {
      const [lo, hi] = SYM_SIZE[d];
      for (let W = lo; W <= hi; W++) for (let H = lo; H <= hi; H++) for (let seed = 0; seed < 40; seed++) {
        const cells = buildSymShape(createRng(seed * 101 + W * 13 + H), sym, W, H);
        expect(cells, `${sym} ${W} × ${H} seed ${seed}`).not.toBeNull();
        expect(symmetryCount(cells!), `${sym} ${W} × ${H}`).toBe(SYM_LINES[sym]);
        expect(components(cells!, false), `${sym} ${W} × ${H}`).toHaveLength(1);
      }
    }
    // no one shape takes over a difficulty, and Grade 3 shapes never have the four lines of a plus
    for (const d of [3, 4, 5, 6] as Difficulty[]) {
      const r = createRng(300 + d); const seen = new Map<string, number>(); let n = 0;
      for (let i = 0; i < 600; i++) {
        const q = gridQuestion('lines', d, r); const v = q.visual as GridV;
        if (v.poly?.length || !q.prompt.startsWith('How many lines')) continue;
        n++; const k = norm(v.cells); seen.set(k, (seen.get(k) ?? 0) + 1);
        if (d === 3) expect(q.answer, q.prompt).toBeLessThanOrEqual(2);
      }
      expect(Math.max(...seen.values()) / n, `d${d}`).toBeLessThan(0.1);
    }
  });

  it('the lines of symmetry of neighbouring letters in a word stay apart', () => {
    const r = createRng(64); let words = 0;
    for (let i = 0; i < 400; i++) {
      const q = gridQuestion('lines', 6, r); if (!q.prompt.startsWith('The word')) continue; words++;
      const across = ((q.solutionVisual as GridV).lines ?? []).filter(([a, b]) => a[1] === b[1]).map(([a, b]) => ({ y: a[1], x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]) }));
      for (let a = 0; a < across.length; a++) for (let b = a + 1; b < across.length; b++) {
        if (across[a].y !== across[b].y) continue;
        expect(Math.max(across[a].x0, across[b].x0) - Math.min(across[a].x1, across[b].x1), q.prompt).toBeGreaterThanOrEqual(0.5);
      }
    }
    expect(words).toBeGreaterThan(50);
  });

  it('tangram pieces that touch differ in colour, and small pictures use a new colour for every piece', () => {
    const r = createRng(17); let small = 0;
    for (const d of [1, 2, 3, 4] as Difficulty[]) for (let i = 0; i < 300; i++) {
      const q = gridQuestion('tangram', d, r); const v = q.visual as TanV;
      const shown = v.pieces.filter((p) => !p.ghost);
      for (let a = 0; a < shown.length; a++) for (let b = a + 1; b < shown.length; b++) if (shareEdge(corners(shown[a]), corners(shown[b]))) expect(shown[a].color, q.prompt).not.toBe(shown[b].color);
      if (v.pieces.length <= 6) { small++; expect(new Set(shown.map((p) => p.color)).size, `${q.prompt} ${JSON.stringify(v.pieces)}`).toBe(shown.length); }
    }
    expect(small).toBeGreaterThan(100);
  });

  it('a counting worked picture numbers exactly the things counted', () => {
    const r = createRng(23); let tri = 0, all = 0;
    for (let i = 0; i < 400; i++) {
      const q = gridQuestion('tangram', ((i % 2) + 1) as Difficulty, r); const s = q.solutionVisual as TanV;
      if (s.marks !== 'count') continue;
      const nums = tanNumbers(s);
      expect([...nums].sort((a, b) => a - b), q.prompt).toEqual(Array.from({ length: q.answer }, (_, k) => k + 1));
      if (q.prompt.startsWith('How many triangle pieces')) {
        tri++;
        // the four-sided pieces are faded and unnumbered; every triangle piece is numbered
        for (const p of s.pieces) expect(!!p.dim, q.prompt).toBe(SHAPE[p.kind].length !== 3);
      } else { all++; expect(s.pieces.some((p) => p.dim)).toBe(false); }
    }
    expect(tri).toBeGreaterThan(20); expect(all).toBeGreaterThan(20);
  });

  it('a hint never asks for missing sides that cannot each be found', () => {
    const r = createRng(66); let both = 0;
    for (let i = 0; i < 400; i++) {
      const q = gridQuestion('perimeter', 6, r); const v = q.visual as GridV; if (!v.plain) continue;
      const hiddenAcross = (v.sides ?? []).filter((sd) => sd.text.includes('?') && sd.a[1] === sd.b[1]).length;
      if (hiddenAcross >= 2) { both++; expect(q.hint, q.prompt).not.toMatch(/Find the missing sides first/); expect(q.hint).toMatch(/do not need/); }
      else expect(q.hint).toMatch(/Find the missing sides first/);
    }
    expect(both).toBeGreaterThan(20);
  });
});

describe('Mirror & Grid lessons and wiring', () => {
  it('teaches on pictures, then tries real skills', () => {
    expect(GRID_LESSONS.length).toBeGreaterThanOrEqual(2);
    expect(PICTURE_GAMES.grid.lessons.map(([id]) => id)).toEqual(GRID_LESSONS.map((l) => l.id));
    const kinds = new Set(GRID_KINDS.map((k) => `grid.${k.id}`));
    GRID_LESSONS.forEach((l, i) => {
      expect(l.id).toBe(`l.grid-${i + 1}`); expect(l.group).toBe(GRID_META.label); expect(['vector', 'newton']).toContain(l.teacher);
      const says = l.steps.filter((s) => s.type === 'say'); const tries = l.steps.filter((s) => s.type === 'try');
      expect(says.some((s) => s.type === 'say' && s.visual && s.caption)).toBe(true);
      expect(tries.length).toBeGreaterThan(0); expect(l.steps.at(-1)!.type).toBe('summary');
      for (const s of l.steps) {
        if (s.type === 'say') { checkLabels(s.text); expect(arithmeticSlips(s.text), s.text).toEqual([]); expect(['vector', 'newton']).toContain(s.speaker); }
        if (s.type === 'say' && s.visual?.type === 'gridshape') { checkSides(s.visual, s.text); expect(inGrid(s.visual, s.visual.cells)).toBe(true); }
        if (s.type === 'say' && s.visual?.type === 'tangram') checkBoard(s.visual, s.text);
        if (s.type === 'try') {
          expect(kinds.has(s.skillId), s.skillId).toBe(true); expect(s.count).toBeGreaterThanOrEqual(3); expect(s.count).toBeLessThanOrEqual(4);
          const kind = s.skillId.split('.')[1];
          expect(GRID_KIND_GRADES[kind]).toContain(gradeOf(s.difficulty));
          const q = gridQuestion(kind as GridKind, s.difficulty, createRng(1));
          expect(q.masterySkillId).toBe(s.skillId);
        }
      }
    });
    // one lesson for Grades 1 to 3, one for Grade 5
    const tryGrades = GRID_LESSONS.map((l) => l.steps.flatMap((s) => (s.type === 'try' ? [gradeOf(s.difficulty)] : [])));
    expect(tryGrades.some((gs) => gs.includes('g1'))).toBe(true);
    expect(tryGrades.some((gs) => gs.every((g) => g === 'g5'))).toBe(true);
    expect(GRID_META.intro.length).toBeGreaterThan(80); expect(GRID_META.intro).not.toBe(GRID_META.blurb);
  });

  it('the lesson pictures match their words', () => {
    const [l1, l2, l3] = GRID_LESSONS;
    const pic = (l: typeof l1, i: number) => (l.steps[i] as { visual: Visual }).visual;
    const mirror = pic(l1, 1) as GridV; expect(sameSet(mirror.ghost!, mirror.cells.map(twinOf(mirror.axis!)))).toBe(true);
    expect((pic(l1, 3) as GridV).cells).toHaveLength(9);
    const tree = pic(l1, 5) as TanV; expect(smallTriangles(tree.pieces)).toBe(12); expect(tree.pieces).toHaveLength(4); checkBoard(tree, 'tree');
    const L = pic(l2, 1) as GridV; expect(perimeterOf(L.cells)).toBe(22); expect(L.cells).toHaveLength(24);
    expect(symmetryCount((pic(l2, 3) as GridV).cells)).toBe(1);
    const F = pic(l3, 0) as GridV; expect(F.cells).toHaveLength(81); expect(perimeterOf(F.cells)).toBe(40);
    const T = pic(l3, 2) as GridV; expect(shoelace(T.poly!)).toBe(12);
    // the box drawn round the triangle is 6 by 4 (24 squares)
    const xs = T.lines!.flat().map((p) => p[0]), ys = T.lines!.flat().map((p) => p[1]);
    expect((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))).toBe(24);
    expect(polySymmetry((pic(l3, 6) as GridV).poly!)).toBe(6);
  });

  it('a try never repeats the picture its lesson has just worked', () => {
    for (const l of GRID_LESSONS) {
      const worked = new Set(l.steps.flatMap((st) => (st.type === 'say' && st.visual ? [shapeKey(st.visual)] : [])).filter(Boolean));
      for (const st of l.steps) {
        if (st.type !== 'try') continue;
        const r = createRng(st.difficulty * 97 + st.skillId.length);
        for (let i = 0; i < 400; i++) {
          const q = gridQuestion(st.skillId.split('.')[1] as GridKind, st.difficulty, r);
          expect(worked.has(shapeKey(q.visual)), `${l.id} ${st.skillId} d${st.difficulty}: ${q.prompt}`).toBe(false);
          expect(q.prompt, l.id).not.toMatch(l.id === 'l.grid-3' && st.skillId === 'grid.lines' ? /hexagon/ : /^$/);
        }
      }
    }
  });
});
