import { describe, expect, it } from 'vitest';
import type { Difficulty, Question } from '../types';
import type { ContestVisual, PatternCell } from '../contest/visuals';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { gradeOf, type GradeId } from '../contest/common';
import { violatesCaps } from '../contest/grades';
import { LABELED } from '../label';
import { arithmeticSlips } from '../academy/teachMath';
import { COLOR_TWINS, PATTERN_KINDS, PATTERN_KIND_GRADES, PATTERN_META, patternQuestion, type PatternKind } from '../questions/patterns';
import { PATTERN_LESSONS } from '../../content/contest/patterns';
import { PICTURE_GAMES } from '../questions/games';

/**
 * Pattern Lab: every kind at every difficulty, many seeds. Each answer is worked out again here from the picture
 * (or the numbers in the prompt) with solvers that do not share code with the generator.
 */
const KINDS = PATTERN_KINDS.map((k) => k.id).filter((k) => k !== 'all') as Exclude<PatternKind, 'all'>[];
const DS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const N = 120;
type Train = Extract<ContestVisual, { type: 'pattern' }>;
type Machine = Extract<ContestVisual, { type: 'machine' }>;

const texts = (q: Question) => [q.prompt, q.expression, q.hint, ...q.solutionSteps, ...q.explanation, q.readAloud ?? '', ...(q.choices ?? []).map((c) => c.label)];
const isGap = (c: PatternCell | null) => !!c && c.shape === undefined && c.num === undefined;
const ord = (s: string | undefined) => { const m = /^(\d+)(st|nd|rd|th)$/.exec(s ?? ''); return m ? Number(m[1]) : null; };

/* ---------- independent solvers ---------- */

type Attr = 'shape' | 'color' | 'rot' | 'size' | 'num';
const ATTRS: Attr[] = ['shape', 'color', 'rot', 'size', 'num'];
/** Known cells at 0-based positions; predict the cell at `pos`, attribute by attribute, from each attribute's shortest repeat. */
function predict(known: { pos: number; c: PatternCell }[], pos: number): PatternCell {
  const out: PatternCell = {};
  for (const a of ATTRS) {
    const vals = known.map((k) => k.c[a]);
    if (vals.every((v) => v === undefined)) continue;
    let found = false;
    for (let p = 1; p <= Math.max(...known.map((k) => k.pos)) + 1; p++) {
      const ok = known.every((x) => known.every((y) => (x.pos - y.pos) % p !== 0 || x.c[a] === y.c[a]));
      if (!ok) continue;
      const rep = known.find((k) => (k.pos - pos) % p === 0);
      expect(rep, `attribute ${a}: repeat of ${p} has no example at place ${pos + 1}`).toBeTruthy();
      (out as Record<string, unknown>)[a] = rep!.c[a];
      found = true; break;
    }
    expect(found).toBe(true);
  }
  return out;
}
const sameCell = (a: PatternCell, b: PatternCell) => ATTRS.every((k) => (a[k] ?? (k === 'rot' ? 0 : k === 'size' ? 'm' : undefined)) === (b[k] ?? (k === 'rot' ? 0 : k === 'size' ? 'm' : undefined)));

/** Known positions of a train: before a "…" gap the index, after it the place from the caption. */
function trainPositions(v: Train): { known: { pos: number; c: PatternCell }[]; askPos: number | null; askIdx: number } {
  const gap = v.cells.findIndex(isGap);
  const known: { pos: number; c: PatternCell }[] = []; let askPos: number | null = null; let askIdx = -1;
  v.cells.forEach((c, i) => {
    if (isGap(c)) return;
    const pos = gap >= 0 && i > gap ? (ord(v.under?.[i]) ?? NaN) - 1 : i;
    if (c === null) { askPos = pos; askIdx = i; } else known.push({ pos, c });
  });
  return { known, askPos, askIdx };
}

/** Every family of number rule that fits the whole sequence once the blank is filled with x. */
const FAMILIES: Record<string, (t: number[]) => boolean> = {
  arithmetic: (t) => t.every((_, i) => i < 2 || t[i] - t[i - 1] === t[1] - t[0]),
  geometric: (t) => t[0] !== 0 && Number.isInteger(t[1] / t[0]) && t[1] / t[0] >= 2 && t.every((_, i) => i < 1 || t[i] === t[i - 1] * (t[1] / t[0])),
  quadratic: (t) => t.every((_, i) => i < 3 || t[i] - 2 * t[i - 1] + t[i - 2] === t[2] - 2 * t[1] + t[0]),
  alternating: (t) => t.every((_, i) => i < 3 || t[i] - t[i - 1] === t[i - 2] - t[i - 3]),
  addTwoBefore: (t) => t.every((_, i) => i < 2 || t[i] === t[i - 1] + t[i - 2]),
  affine: (t) => { const d0 = t[1] - t[0]; if (!d0) return false; const a = (t[2] - t[1]) / d0; if (!Number.isInteger(a)) return false; const b = t[1] - a * t[0]; return t.every((_, i) => i < 1 || t[i] === a * t[i - 1] + b); },
};
function solveNumbers(cells: (number | null)[]): number[] {
  const known = cells.filter((c) => c !== null) as number[];
  const fams = known.length < 4 ? ['arithmetic'] : Object.keys(FAMILIES);
  const lo = Math.min(...known) - 1000; const hi = Math.max(...known) * 4 + 1000;
  const hits = new Set<number>();
  for (let x = lo; x <= hi; x++) {
    const t = cells.map((c) => (c === null ? x : c));
    if (fams.some((f) => FAMILIES[f](t))) hits.add(x);
  }
  return [...hits];
}

/** Squares in a growing step: unique and joined edge to edge. */
function checkFigure(step: [number, number][]) {
  const keys = new Set(step.map(([c, r]) => `${c},${r}`));
  expect(keys.size).toBe(step.length);
  expect(step.every(([c, r]) => c >= 0 && r >= 0)).toBe(true);
  const seen = new Set([`${step[0][0]},${step[0][1]}`]); const stack = [step[0]];
  while (stack.length) { const [c, r] = stack.pop()!; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${c + dc},${r + dr}`; if (keys.has(k) && !seen.has(k)) { seen.add(k); stack.push([c + dc, r + dr]); } } }
  expect(seen.size, 'figure is in one piece').toBe(step.length);
}
/** Counts per step → the count at step n, by first and second differences (linear or quadratic rules). */
function extend(counts: number[], n: number): number {
  const [c1, c2, c3] = counts; const s = c3 - 2 * c2 + c1;
  counts.forEach((c, i) => expect(c, 'shown steps follow one rule').toBe(c1 + i * (c2 - c1) + ((i * (i - 1)) / 2) * s));
  return c1 + (n - 1) * (c2 - c1) + (((n - 1) * (n - 2)) / 2) * s;
}

/** Machine: rule from its text, or fitted from the full rows. */
function machineFn(v: Machine): { f: (x: number) => number; a: number; b: number } {
  if (v.rule) {
    const m = /^([+−×]) (\d+)(?:, then ([+−]) (\d+))?$/.exec(v.rule);
    expect(m, v.rule).toBeTruthy();
    const n = Number(m![2]); const second = m![3] ? (m![3] === '+' ? 1 : -1) * Number(m![4]) : 0;
    const a = m![1] === '×' ? n : 1; const b = (m![1] === '+' ? n : m![1] === '−' ? -n : 0) + second;
    return { f: (x) => a * x + b, a, b };
  }
  const full = v.rows.filter((r) => r.input !== '?' && r.output !== '?') as { input: number; output: number }[];
  expect(full.length).toBeGreaterThanOrEqual(2);
  const a = (full[1].output - full[0].output) / (full[1].input - full[0].input); const b = full[0].output - a * full[0].input;
  return { f: (x) => a * x + b, a, b };
}

/** The answer worked out again from the picture (and, where the picture cannot hold it, the prompt). */
function solve(q: Question, kind: string): number {
  const v = q.visual as ContestVisual;
  if (v.type === 'growing') {
    v.steps.forEach(checkFigure);
    const counts = v.steps.map((s) => s.length);
    if (v.ask !== undefined) return extend(counts, v.ask);
    const target = Number(/Which step has (\d+) squares/.exec(q.prompt)![1]);
    for (let n = 1; n < 500; n++) if (extend(counts, n) === target) return n;
    throw new Error('no step has that many squares');
  }
  if (v.type === 'machine') {
    const { f, a, b } = machineFn(v);
    for (const r of v.rows) if (r.input !== '?' && r.output !== '?') expect(f(r.input), 'every full row follows the rule').toBe(r.output);
    const ask = v.rows.find((r) => r.input === '?' || r.output === '?')!;
    return ask.output === '?' ? f(ask.input as number) : ((ask.output as number) - b) / a;
  }
  if (v.type !== 'pattern') throw new Error(`unexpected picture ${v.type}`);
  const { known, askPos, askIdx } = trainPositions(v);
  const numeric = known.every((k) => k.c.num !== undefined && !k.c.shape);
  if (kind === 'number') {
    const sols = solveNumbers(v.cells.map((c) => (c === null ? null : c.num!)));
    expect(sols, `one rule fits ${JSON.stringify(v.cells)}`).toHaveLength(1);
    return sols[0];
  }
  if (numeric) {
    const first = known.filter((k) => !Number.isNaN(k.pos) && k.pos < 4).map((k) => k.c.num!);
    const step = first[1] - first[0];
    first.forEach((t, i) => expect(t).toBe(first[0] + i * step));
    if (askPos !== null) return first[0] + askPos * step;
    // "In which place is N?": the last cell holds N and its caption is "?"
    const target = v.cells[v.cells.length - 1]!.num!;
    expect(v.under?.[v.cells.length - 1]).toBe('?');
    return (target - first[0]) / step + 1;
  }
  if (askPos === null) {
    // How many of a shape in the first N
    const m = /How many (\w+)s are in the first (\d+) shapes/.exec(q.prompt)!;
    const shape = m[1]; const total = Number(m[2]);
    let n = 0; for (let p = 0; p < total; p++) if (predict(known, p).shape === shape) n++;
    return n;
  }
  const want = predict(known, askPos);
  const hits = q.choices!.filter((c) => c.visual?.type === 'pattern' && sameCell((c.visual as Train).cells[0]!, want));
  expect(hits, `exactly one choice is ${JSON.stringify(want)} (ask cell ${askIdx})`).toHaveLength(1);
  return hits[0].value;
}

/* ---------- checks ---------- */

const LABEL_OK = /^[A-Za-z][A-Za-z ',/-]*[A-Za-z]$/;
/** Words that are asides, not labels: "1 (more)", "+ 3 (up)", "× 2 (double)" do not say what the number is. */
const NOT_LABELS = new Set(['more', 'less', 'up', 'down', 'double', 'again', 'extra']);
/** Words in a label that end in "s" but are not plurals. */
const NOT_PLURAL = new Set(['is', 'its', 'this', 'has', 'was', 'plus', 'as', 'across', 'minus']);
function checkLabels(s: string) {
  const after = [...s.matchAll(/(?:\d|\?) \(([^)]*)\)/g)];
  for (const m of after) expect(LABEL_OK.test(m[1]), `bad label "(${m[1]})" in: ${s}`).toBe(true);
  expect([...s.matchAll(new RegExp(LABELED.source, 'g'))].length, s).toBe(after.length);
  for (const m of s.matchAll(new RegExp(LABELED.source, 'g'))) {
    expect(NOT_LABELS.has(m[2]), `"${m[0]}" is an aside, not a label: ${s}`).toBe(false);
    // A count of 1 never takes a plural label: "1 (extra shape)", not "1 (extra shapes)"
    if (/^[−-]?1$/.test(m[1].replace(/^[+−] ?/, ''))) expect(m[2].split(' ').some((w) => /s$/.test(w) && !NOT_PLURAL.has(w)), `"${m[0]}" should be singular: ${s}`).toBe(false);
  }
}
/** Numbers in working that carry no label (step names like "step 4" and places like "13th" are names, not amounts). */
const unlabelled = (s: string) => [...s.replace(new RegExp(LABELED.source, 'g'), '#').replace(/\b\d+(st|nd|rd|th)\b/g, '#').replace(/\b[Ss]tep \d+/g, 'step #').matchAll(/\d+/g)].map((m) => m[0]);
/** Words per sentence (maths signs such as + and = are not words). */
const words = (s: string) => s.split(/[.?!]/).map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length);

describe('Pattern Lab questions', () => {
  for (const kind of KINDS) for (const d of DS) {
    it(`${kind} at difficulty ${d}: right answers, fair choices, grade caps, labels`, () => {
      const r = createRng(1000 * d + kind.length);
      const g = gradeOf(d); const inBand = PATTERN_KIND_GRADES[kind].includes(g);
      for (let i = 0; i < N; i++) {
        const q = patternQuestion(kind, d, r);
        const where = `${kind} d${d} #${i}: ${q.prompt}`;
        expect(q.topic).toBe(PATTERN_META.topic);
        expect(q.masterySkillId).toBe(`pattern.${kind}`);
        expect(q.visualFirst).toBe(true);
        expect(q.difficulty).toBe(d);
        expect(Number.isFinite(q.answer)).toBe(true);
        expect(checkAnswer(q, String(q.answer)), where).toBe(true);
        for (const t of texts(q)) { expect(t, where).not.toMatch(/undefined|NaN|AMC/); checkLabels(t); }
        expect(q.hint.length).toBeGreaterThan(10);
        expect(q.solutionSteps.length).toBeGreaterThan(0);
        expect(q.solutionSteps.flatMap(arithmeticSlips), where).toEqual([]);

        // The answer, independently
        expect(solve(q, kind), where).toBe(q.answer);

        // Choices
        if (q.choices) {
          const vals = q.choices.map((c) => c.value);
          expect(vals.length).toBeGreaterThanOrEqual(2); expect(vals.length).toBeLessThanOrEqual(g === 'g1' && inBand ? 4 : 5);
          expect(new Set(vals).size).toBe(vals.length);
          expect(new Set(q.choices.map((c) => c.label)).size).toBe(vals.length);
          expect(vals).toContain(q.answer);
          if (q.choices.some((c) => c.visual)) {
            expect([...vals].sort((a, b) => a - b)).toEqual(vals.map((_, j) => j + 1));
            expect(q.prompt).toMatch(/Tap it/);
          } else q.choices.forEach((c) => expect(c.label).toBe(String(c.value)));
        }
        // The question picture never shows the answer; a numeric answer is labelled in the working
        const v = q.visual as ContestVisual;
        if (v.type === 'pattern') expect(v.cells.includes(null) || v.under?.includes('?') || /How many/.test(q.prompt)).toBe(true);
        if (v.type === 'machine') expect(v.rows.some((x) => x.input === '?' || x.output === '?')).toBe(true);
        if (v.type === 'growing') expect(v.ask !== undefined || /Which step/.test(q.prompt)).toBe(true);
        if (!q.choices?.some((c) => c.visual)) expect(q.solutionSteps.join(' '), where).toMatch(new RegExp(`\\b${q.answer} \\(`));
        if (q.answer >= 10 && !q.choices?.some((c) => c.visual)) expect(q.hint, where).not.toMatch(new RegExp(`\\b${q.answer}\\b`));
        if (q.solutionVisual) expect(q.solutionVisual.type).toBe(q.visual.type);

        // Grade fit
        if (inBand) expect(violatesCaps(g, { ...q, game: 'pattern' }), where).toBeNull();
        if (g === 'g1' && inBand) {
          expect(q.choices, where).toBeTruthy();
          expect(q.readAloud, where).toBeTruthy();
          const nums = [...texts(q).join(' ').matchAll(/\d+/g)].map((m) => Number(m[0]));
          expect(Math.max(0, ...nums), where).toBeLessThanOrEqual(20);
          for (const t of [q.prompt, q.readAloud!, ...q.solutionSteps]) for (const w of words(t)) expect(w, t).toBeLessThanOrEqual(12);
          expect(texts(q).join(' ')).not.toMatch(/%|percent/i);
        }
      }
    });
  }

  it('is deterministic for a seed, and Mixed only picks kinds that suit the grade', () => {
    for (const d of DS) {
      const a = patternQuestion('all', d, createRng(7)); const b = patternQuestion('all', d, createRng(7));
      expect({ ...a, id: '' }).toEqual({ ...b, id: '' });
      const r = createRng(d);
      for (let i = 0; i < 60; i++) {
        const q = patternQuestion('all', d, r);
        expect(q.masterySkillId).toBe('pattern');
        const kind = PATTERN_KINDS.find((k) => k.label === q.subtopic)!.id;
        expect(PATTERN_KIND_GRADES[kind].includes(gradeOf(d)), `${kind} at d${d}`).toBe(true);
      }
    }
    expect(patternQuestion('grow', 3, createRng(1), 'pattern.custom').masterySkillId).toBe('pattern.custom');
    expect(PICTURE_GAMES.pattern.lessons.length).toBe(PATTERN_LESSONS.length);
  });

  it('meets each grade: Grade 1 taps and reads aloud, Grade 3 stays within 1,000, Grade 5 reaches far terms', () => {
    const r = createRng(42);
    const g5 = Array.from({ length: 80 }, () => patternQuestion('term', 6, r));
    expect(g5.some((q) => /100th/.test(q.prompt))).toBe(true);
    expect(g5.some((q) => /In which place/.test(q.prompt))).toBe(true);
    expect(g5.some((q) => /How many/.test(q.prompt))).toBe(true);
    const grow5 = Array.from({ length: 80 }, () => patternQuestion('grow', 6, r));
    expect(grow5.some((q) => /Which step/.test(q.prompt))).toBe(true);
    expect(grow5.some((q) => /step 20/.test(q.prompt))).toBe(true);
    const shapes3 = Array.from({ length: 80 }, () => patternQuestion('shapes', 4, r));
    expect(shapes3.some((q) => (q.visual as Train).cells.some((c) => c?.rot !== undefined))).toBe(true);
    expect(shapes3.some((q) => /th shape/.test(q.prompt))).toBe(true);
    const mach = Array.from({ length: 80 }, () => patternQuestion('machine', 5, r));
    expect(mach.some((q) => q.expression === 'in = ?')).toBe(true);
    expect(mach.every((q) => /then/.test((q.visual as Machine).rule ?? 'then'))).toBe(true);
  });
});

describe('Pattern Lab regressions (verifier findings)', () => {
  const sweep = (kind: Exclude<PatternKind, 'all'>, d: Difficulty, n = 400, seed = 77) => { const r = createRng(seed * 31 + d); return Array.from({ length: n }, () => patternQuestion(kind, d, r)); };
  const bands: Record<string, Difficulty[]> = { shapes: [1, 2, 3, 4], grow: [1, 2, 3, 4, 5, 6], number: [1, 2, 3, 4, 5, 6], machine: [3, 4, 5, 6], term: [5, 6] };

  it('labels every number in hints and working, with no asides and no "1 (plural)"', () => {
    for (const kind of KINDS) for (const d of bands[kind]) for (const q of sweep(kind, d, 300)) {
      for (const t of [q.hint, ...q.solutionSteps]) { checkLabels(t); expect(unlabelled(t), `${kind} d${d}: ${t}`).toEqual([]); }
    }
    // the exact case the verifier found: a remainder of 1 in the far-shape working
    const ones = [...sweep('term', 6, 600), ...sweep('term', 5, 600)].flatMap((q) => q.solutionSteps).filter((t) => /\+ 1 \(extra shape\)/.test(t));
    expect(ones.length).toBeGreaterThan(0);
  });

  it('never puts colour twins (blue and purple) in one picture or one set of choices', () => {
    for (const kind of ['shapes', 'term'] as const) for (const d of bands[kind]) for (const q of sweep(kind, d, 600)) {
      const v = q.visual as Train;
      const colours = new Set([...(v.cells ?? []), ...(q.choices ?? []).flatMap((c) => (c.visual as Train | undefined)?.cells ?? [])].map((c) => c?.color).filter(Boolean));
      for (const [a, b] of COLOR_TWINS) expect(colours.has(a) && colours.has(b), `${kind} d${d}: ${q.prompt}`).toBe(false);
    }
  });

  it('Grade 1 colour-only trains ask about the colour', () => {
    for (const d of [1, 2] as Difficulty[]) for (const q of sweep('shapes', d)) {
      const shapes = new Set((q.visual as Train).cells.filter(Boolean).map((c) => c!.shape));
      if (shapes.size === 1) { expect(q.prompt).toMatch(/colour/); expect(q.readAloud).toMatch(/colour/); } else expect(q.prompt).toMatch(/shape/);
    }
  });

  it('keeps trains with place captions short enough to read on a phone', () => {
    for (const kind of ['shapes', 'term'] as const) for (const d of bands[kind]) for (const q of sweep(kind, d)) {
      const v = q.visual as Train;
      if (v.type === 'pattern' && v.under) expect(v.cells.filter((c) => !isGap(c)).length, q.prompt).toBeLessThanOrEqual(8);
    }
  });

  it('Grade 5 number choices are never below the smallest number in the train', () => {
    for (const d of [5, 6] as Difficulty[]) for (const q of sweep('number', d, 1500)) {
      if (!q.choices) continue;
      const lo = Math.min(...(q.visual as Train).cells.filter(Boolean).map((c) => c!.num!));
      for (const c of q.choices) expect(c.value, q.prompt).toBeGreaterThanOrEqual(lo);
    }
  });

  it('Grade 1 number trains show their jump: no count by tens, two numbers side by side, a hint that does not name the rule', () => {
    for (const d of [1, 2] as Difficulty[]) {
      const qs = sweep('number', d, 2000);
      for (const q of qs) {
        const nums = (q.visual as Train).cells.map((c) => c?.num ?? null);
        const all = (q.solutionVisual as Train).cells.map((c) => c!.num!);
        expect(nums.filter((n) => n !== null).length, q.prompt).toBeGreaterThanOrEqual(3);
        expect(nums.some((n, i) => i > 0 && n !== null && nums[i - 1] !== null), JSON.stringify(nums)).toBe(true);
        expect(Math.abs(all[1] - all[0]), JSON.stringify(all)).not.toBe(10);
        expect(q.hint).not.toMatch(/count (back )?by|tens|twos|fives/i);
      }
      const counts = new Map<number, number>(); qs.forEach((q) => counts.set(q.answer, (counts.get(q.answer) ?? 0) + 1));
      expect(Math.max(...counts.values()) / qs.length, `number d${d}: the most common answer`).toBeLessThan(0.15);
    }
  });

  it('growing figures vary: many different questions per difficulty, no answer dominates', () => {
    const want: Record<number, number> = { 1: 12, 2: 25, 3: 25, 4: 30, 5: 40, 6: 50 };
    for (const d of DS) {
      const qs = sweep('grow', d, 600);
      const keys = new Set(qs.map((q) => `${q.prompt}|${JSON.stringify(q.visual)}`));
      expect(keys.size, `grow d${d} distinct questions`).toBeGreaterThanOrEqual(want[d]);
      const counts = new Map<number, number>(); qs.forEach((q) => counts.set(q.answer, (counts.get(q.answer) ?? 0) + 1));
      expect(Math.max(...counts.values()) / qs.length, `grow d${d}: the most common answer`).toBeLessThan(0.25);
    }
  });

  it('the "Show me how" picture of a growing figure builds the asked step when it fits', () => {
    for (const d of DS) for (const q of sweep('grow', d, 300)) {
      const v = q.visual as Extract<ContestVisual, { type: 'growing' }>; const sol = q.solutionVisual as Extract<ContestVisual, { type: 'growing' }>;
      const nums = sol.steps.map((_, i) => sol.nums?.[i] ?? i + 1);
      expect([...nums].sort((a, b) => a - b), 'step numbers go up').toEqual(nums);
      // every drawn step has the right number of squares (fitted from the question picture's steps)
      const counts = v.steps.map((s) => s.length);
      sol.steps.forEach((s, i) => { checkFigure(s); expect(s.length).toBe(extend(counts, nums[i])); });
      if (v.ask !== undefined && gradeOf(d) !== 'g5') expect(nums[nums.length - 1], `${q.prompt}: solution reaches the asked step`).toBe(v.ask);
      if (v.ask !== undefined && nums.length > 4) expect(nums[nums.length - 1]).toBe(v.ask);
      expect(q.hint, 'the hint names the real fixed part').not.toMatch(/L-shape/.test(q.prompt) ? /centre/ : /corner square/);
    }
  });
});

describe('Pattern Lab lessons', () => {
  it('teach on a picture, then try real kinds at a sensible difficulty, then sum up', () => {
    expect(PATTERN_LESSONS.length).toBeGreaterThanOrEqual(2);
    const grades = new Set<GradeId>();
    PATTERN_LESSONS.forEach((l, i) => {
      expect(l.id).toBe(`l.pattern-${i + 1}`);
      expect(l.group).toBe('Pattern Lab');
      expect(['vector', 'newton']).toContain(l.teacher);
      const firstTry = l.steps.findIndex((s) => s.type === 'try');
      expect(l.steps.slice(0, firstTry).some((s) => s.type === 'say' && s.visual && s.caption)).toBe(true);
      expect(l.steps[l.steps.length - 1].type).toBe('summary');
      for (const s of l.steps) {
        expect(['vector', 'newton']).toContain(s.speaker);
        if (s.type === 'say') {
          checkLabels(s.text); expect(arithmeticSlips(s.text), s.text).toEqual([]);
          // worked numbers carry labels (a pattern read off the picture, like "5, 8, 11, 14, …", is the question itself)
          expect(unlabelled(s.text.replace(/(\d+, )+\d+, …/g, '#')), s.text).toEqual([]);
          expect(s.text).not.toMatch(/AMC|undefined|NaN/);
        }
        if (s.type === 'try') {
          const kind = s.skillId.replace(/^pattern\./, '');
          expect(KINDS).toContain(kind as never);
          expect(PATTERN_KIND_GRADES[kind].includes(gradeOf(s.difficulty)), `${l.id} tries ${kind} at d${s.difficulty}`).toBe(true);
          expect(s.count).toBeGreaterThanOrEqual(3); expect(s.count).toBeLessThanOrEqual(4);
          grades.add(gradeOf(s.difficulty));
        }
      }
    });
    expect(grades.has('g5')).toBe(true);
    expect(grades.has('g1') || grades.has('g3')).toBe(true);
  });

  /** What makes two questions the same: the numbers and the place asked (not where the squares sit or which way round). */
  const sig = (v: ContestVisual): string | null => {
    if (v.type === 'pattern') {
      if (!v.cells.includes(null) && !v.under?.includes('?')) return null;
      return JSON.stringify({ cells: v.cells.map((c) => c && [c.shape ?? '', c.color ?? '', c.rot ?? 0, c.size ?? 'm', c.num ?? '']), under: v.under ?? [] });
    }
    if (v.type === 'growing') return v.ask === undefined ? null : JSON.stringify({ first: v.steps.slice(0, 3).map((s) => s.length), ask: v.ask });
    if (v.type === 'machine') return v.rows.some((r) => r.input === '?' || r.output === '?') ? JSON.stringify({ rule: v.rule ?? null, rows: v.rows }) : null;
    return null;
  };
  type Say = Extract<(typeof PATTERN_LESSONS)[number]['steps'][number], { type: 'say' }>;
  type Try = Extract<(typeof PATTERN_LESSONS)[number]['steps'][number], { type: 'try' }>;
  const tries = (r: ReturnType<typeof createRng>, t: Try, n: number) => Array.from({ length: n }, () => patternQuestion(t.skillId.replace(/^pattern\./, '') as PatternKind, t.difficulty, r, t.skillId));

  it('a try never asks a question a teach card has just worked (same numbers, same place asked)', () => {
    const worked = PATTERN_LESSONS.flatMap((l) => l.steps.filter((s): s is Say => s.type === 'say' && !!s.visual)
      .map((s) => ({ id: l.id, text: s.text, key: sig(s.visual as ContestVisual) })).filter((w) => w.key !== null));
    expect(worked.length).toBeGreaterThanOrEqual(6);
    const r = createRng(2024);
    for (const l of PATTERN_LESSONS) for (const t of l.steps.filter((s): s is Try => s.type === 'try')) {
      for (const q of tries(r, t, 3000)) {
        const k = sig(q.visual as ContestVisual);
        const hit = worked.find((w) => w.key === k);
        expect(hit, `${l.id} try ${t.skillId}@d${t.difficulty} repeats the worked example of ${hit?.id}: "${hit?.text}"`).toBeUndefined();
      }
    }
    // The verifier's case: the plain staircase 1, 3, 6, 10 is never asked for step 5 in Grade 3 practice.
    for (const d of [3, 4] as Difficulty[]) for (const q of Array.from({ length: 3000 }, ((rr) => () => patternQuestion('grow', d, rr))(createRng(d * 7 + 1)))) {
      const v = q.visual as Extract<ContestVisual, { type: 'growing' }>;
      expect(v.steps.slice(0, 4).map((s) => s.length).join(',') === '1,3,6,10' && v.ask === 5, `grow d${d}: ${q.prompt}`).toBe(false);
    }
  });

  it('a teach card that finds a hidden machine rule is followed by a try that hides the rule', () => {
    let taught = 0;
    for (const l of PATTERN_LESSONS) l.steps.forEach((s, i) => {
      if (s.type !== 'say' || (s.visual as ContestVisual | undefined)?.type !== 'machine' || (s.visual as Machine).rule) return;
      taught++;
      const t = l.steps.slice(i + 1).find((x): x is Try => x.type === 'try' && x.skillId === 'pattern.machine');
      expect(t, `${l.id}: a machine try after "${s.text}"`).toBeTruthy();
      const qs = tries(createRng(5), t!, 300);
      expect(qs.every((q) => !(q.visual as Machine).rule), `${l.id}: pattern.machine@d${t!.difficulty} shows the rule`).toBe(true);
      expect(qs.some((q) => q.expression === 'in = ?') && qs.some((q) => q.expression === 'out = ?')).toBe(true);
      expect(qs.every((q) => violatesCaps(gradeOf(t!.difficulty), { ...q, game: 'pattern' }) === null)).toBe(true);
    });
    expect(taught).toBeGreaterThan(0);
  });
});
