import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Difficulty, Question } from '../types';
import type { ContestVisual } from '../contest/visuals';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { PICTURE_GAMES } from '../questions/games';
import { DATA_KINDS, DATA_KIND_GRADES, DATA_META, dataQuestion, type DataKind } from '../questions/dataLite';
import { DATA_LESSONS } from '../../content/contest/dataLite';
import { gradeOf } from '../contest/common';
import { violatesCaps } from '../contest/grades';
import { LABELED } from '../label';
import { arithmeticSlips } from '../academy/teachMath';
import { PieChart, Pictograph, VennDiagram } from '../../game/components/contest/DataViz';

/**
 * Charts & Venn: every kind at every difficulty, many seeds. Each answer is worked out again here from the picture
 * (and the numbers or names in the prompt) without the generator's helpers.
 */
type Picto = Extract<ContestVisual, { type: 'picto' }>;
type Pie = Extract<ContestVisual, { type: 'pie' }>;
type Venn = Extract<ContestVisual, { type: 'venn' }>;
const KINDS = ['picto', 'bar', 'pie', 'venn', 'mean'] as const;
const DS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const N = 120;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const LABEL_OK = /^[A-Za-z][A-Za-z ',/-]*[A-Za-z]$/;
function checkLabels(s: string) {
  const after = [...s.matchAll(/(?:\d|\?|%) \(([^)]*)\)/g)];
  for (const m of after) expect(LABEL_OK.test(m[1]), `bad label "(${m[1]})" in: ${s}`).toBe(true);
  expect([...s.matchAll(new RegExp(LABELED.source, 'g'))].length, s).toBe(after.length);
}
const words = (s: string) => s.split(/[.?!]/).map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length);
const nums = (s: string) => [...s.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, '')));
const texts = (q: Question) => [q.prompt, q.expression, q.hint, q.readAloud ?? '', ...q.solutionSteps, ...q.explanation, ...(q.choices ?? []).map((c) => c.label)];
const firstInt = (s: string) => { const m = /(\d+)/.exec(s); expect(m, s).toBeTruthy(); return Number(m![1]); };
/** The last sentence of a prompt: the question itself. */
const asked = (p: string) => p.split(/(?<=[.?!]) /).filter((x) => x.endsWith('?')).at(-1)!;
/** Indices of the labels named in a text, in the order they are named (whole words, any case). */
const named = (s: string, labels: string[]) => labels
  .map((l, i) => ({ i, at: s.search(new RegExp(`\\b${l}\\b`, 'i')) }))
  .filter((x) => x.at >= 0).sort((a, b) => a.at - b.at).map((x) => x.i);
const medianOf = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/* ---------- independent solvers ---------- */

/** Picture charts, tallies and bar charts: the amounts are the rows. */
function solveRows(q: Question): number {
  const v = q.visual as Picto; const p = q.prompt; const n = v.rows.map((r) => r.n); const labels = v.rows.map((r) => r.label);
  const qs = asked(p); const m = named(qs, labels);
  if (/Which tally shows/.test(p)) {
    const hits = q.choices!.filter((c) => (c.visual as Picto).rows[0].n === n[0]);
    expect(hits.length).toBe(1);
    return hits[0].value;
  }
  if (/the (most|fewest)/.test(p)) {
    const best = /most/.test(p) ? Math.max(...n) : Math.min(...n);
    expect(n.filter((x) => x === best).length).toBe(1);
    return q.choices!.find((c) => c.label === labels[n.indexOf(best)])!.value;
  }
  if (/How many pictures go in/.test(p)) {
    expect(v.ask).toBeDefined();
    const amount = firstInt(p);
    expect(n[v.ask!]).toBe(amount); expect(named(p, labels)[0]).toBe(v.ask);
    return amount / v.key;
  }
  if (/^Which two/.test(qs)) {
    const target = firstInt(qs);
    let pairs = 0;
    for (let a = 0; a < n.length; a++) for (let b = a + 1; b < n.length; b++) if (n[a] + n[b] === target) pairs++;
    expect(pairs).toBe(1);
    const ok = q.choices!.filter((c) => { const [a, b] = c.label.split(' and '); return n[labels.indexOf(a)] + n[labels.indexOf(b)] === target; });
    expect(ok.length).toBe(1);
    return ok[0].value;
  }
  if (/What fraction/.test(qs)) { expect(m.length).toBe(1); return n[m[0]] / sum(n); }
  if (/What percent/.test(qs)) { expect(m.length).toBe(1); return (n[m[0]] * 100) / sum(n); }
  if (/times as many/.test(qs)) { expect(m.length).toBe(2); return n[m[0]] / n[m[1]]; }
  if (/together than/.test(qs)) { expect(m.length).toBe(3); return n[m[0]] + n[m[1]] - n[m[2]]; }
  if (/How many more/.test(qs)) { expect(m.length).toBe(2); return n[m[0]] - n[m[1]]; }
  if (/in all\?$/.test(qs)) { expect([0, 2]).toContain(m.length); return m.length ? n[m[0]] + n[m[1]] : sum(n); }
  expect(m.length, qs).toBe(1);
  return n[m[0]];
}

function solvePie(q: Question): number {
  const v = q.visual as Pie; const p = q.prompt; const qs = asked(p);
  const parts = v.slices.map((s) => s.v); const whole = sum(parts);
  const m = named(p.replace(/^The pie chart shows[^.]*\./, ''), v.slices.map((s) => s.label));
  if (v.showPct) expect(whole).toBe(100);
  if (v.parts) { expect(whole).toBe(v.parts); parts.forEach((x) => expect(Number.isInteger(x) && x > 0).toBe(true)); }
  expect(v.parts || v.showPct, 'a pie needs guide lines or percents').toBeTruthy();
  if (/are there in all/.test(qs)) { const cnt = Number(/stands for (\d+)/.exec(p)![1]); expect(v.parts).toBeTruthy(); return (cnt * whole) / parts[m[0]]; }
  if (/What percent/.test(qs)) { expect(v.showPct).toBeFalsy(); return (parts[m[0]] / whole) * 100; }
  const T = firstInt(p);
  if (/How many more/.test(qs)) { expect(m.length).toBe(2); return (T * (parts[m[0]] - parts[m[1]])) / 100; }
  expect(m.length).toBe(1);
  if (v.ask !== undefined) { expect(m[0]).toBe(v.ask); return (T * (100 - sum(parts.filter((_, i) => i !== v.ask)))) / 100; }
  return (T * parts[m[0]]) / whole;
}

function solveVenn(q: Question): number {
  const v = q.visual as Venn; const c = v.counts; const qs = asked(q.prompt);
  const missing = Object.entries(c).filter(([, x]) => x === '?').map(([k]) => k);
  const known = Object.fromEntries(Object.entries(c).filter(([, x]) => x !== '?')) as Record<string, number>;
  // every number in the prompt is on the picture
  const shown = [...Object.values(known), ...(v.sizes ?? []), v.total].filter((x) => typeof x === 'number');
  for (const x of nums(q.prompt)) expect(shown, `${x} in "${q.prompt}"`).toContain(x);
  if (missing.length) {
    expect(missing.length).toBe(1);
    const r = missing[0];
    if (v.sizes) {
      const [sA, sB] = v.sizes as number[]; const T = v.total as number;
      if (r === 'A') return sA - known.AB;
      if (r === 'B') return sB - known.AB;
      if (r === 'AB') return sA + sB - (T - known.none);
      expect(r).toBe('none');
      return T - (sA + sB - known.AB);
    }
    expect(Object.keys(known).length).toBe(v.sets.length === 3 ? 7 : 3);
    return (v.total as number) - sum(Object.values(known));
  }
  const k = c as Record<string, number>;
  if (v.sets.length === 3) {
    if (/exactly two/.test(qs)) return k.AB + k.AC + k.BC;
    if (/at least two/.test(qs)) return k.AB + k.AC + k.BC + k.ABC;
    expect(qs).toMatch(/exactly one/);
    return k.A + k.B + k.C;
  }
  const m = named(qs, v.sets);
  const size = (i: number) => (i === 0 ? k.A : k.B) + k.AB;
  const only = (i: number) => (i === 0 ? k.A : k.B);
  if (/but not both\?$/.test(qs)) return k.A + k.B;
  if (/How many more/.test(qs)) return size(m[0]) - size(m[1]);
  if (/children (do not|cannot)/.test(qs)) { expect(m.length).toBe(1); return only(1 - m[0]) + k.none; }
  if (/in all\?$/.test(qs)) return k.A + k.B + k.AB + k.none;
  if (/\bboth\b/.test(qs)) return k.AB;
  if (/neither/.test(qs)) return k.none;
  if (/\bonly\b|but not|but no\b/.test(qs)) return only(m[0]);
  expect(m.length, qs).toBe(1);
  return size(m[0]);
}

function solveMean(q: Question): number {
  const v = q.visual as Picto; const p = q.prompt; const vals = v.rows.map((r) => r.n);
  expect(v.bar).toBeTruthy(); expect(v.values).toBe(true); expect(v.line).toBeUndefined();
  if (v.ask !== undefined) {
    const [, cnt, mean] = /mean of all (\d+) friends is (\d+)/.exec(p)!.map(Number);
    expect(cnt).toBe(vals.length);
    return mean * cnt - sum(vals.filter((_, i) => i !== v.ask));
  }
  expect(firstInt(p)).toBe(vals.length);
  const join = /also \w+ (\d+) \w+ but is not on the chart. What is the mean for all (\d+) friends/.exec(p);
  if (join) { expect(Number(join[2])).toBe(vals.length + 1); return (sum(vals) + Number(join[1])) / (vals.length + 1); }
  const gap = /How much bigger is the (mean|median) than the (median|mean)/.exec(p);
  const mean = sum(vals) / vals.length; const med = medianOf(vals);
  if (gap) { const d = gap[1] === 'mean' ? mean - med : med - mean; expect(d).toBeGreaterThan(0); return d; }
  if (/median/.test(p)) return med;
  if (/range/.test(p)) return Math.max(...vals) - Math.min(...vals);
  expect(p).toMatch(/mean/);
  return mean;
}

const SOLVE: Record<(typeof KINDS)[number], (q: Question) => number> = { picto: solveRows, bar: solveRows, pie: solvePie, venn: solveVenn, mean: solveMean };

/* ---------- the tests ---------- */

describe('Charts & Venn questions', () => {
  for (const kind of KINDS) for (const d of DS) {
    it(`${kind} at difficulty ${d}: right answers, fair choices, grade caps, labels`, () => {
      const r = createRng(1000 * d + kind.length * 7);
      const g = gradeOf(d); const inBand = DATA_KIND_GRADES[kind].includes(g);
      for (let i = 0; i < N; i++) {
        const q = dataQuestion(kind, d, r);
        const where = `${kind} d${d} #${i}: ${q.prompt} ${JSON.stringify(q.visual)}`;
        expect(q.topic).toBe(DATA_META.topic); expect(q.masterySkillId).toBe(`data.${kind}`); expect(q.visualFirst).toBe(true);
        expect(q.difficulty).toBe(d);
        expect(SOLVE[kind](q), where).toBeCloseTo(q.answer, 9);
        expect(checkAnswer(q, String(q.answer)), where).toBe(true);
        if (q.answerText) expect(checkAnswer(q, q.answerText), where).toBe(true);
        expect(q.answer, where).toBeGreaterThan(0);
        if (!q.allowFraction) expect(Number.isInteger(q.answer * 2), where).toBe(true);
        for (const t of texts(q)) expect(t, where).not.toMatch(/undefined|NaN|\[object|Infinity/);
        for (const t of [q.hint, ...q.solutionSteps, ...q.explanation]) checkLabels(t);
        expect(q.solutionSteps.flatMap(arithmeticSlips), where).toEqual([]);
        expect(q.solutionSteps.length).toBeGreaterThan(0);
        expect(q.solutionVisual, where).toBeTruthy();
        // the hint helps without giving the answer away
        if (q.answer > 2) expect(nums(q.hint), where).not.toContain(q.answer);
        // the question picture shows the problem, not the answer
        const v = q.visual as ContestVisual;
        if (v.type === 'picto' && kind !== 'mean') { expect(v.values, where).toBeFalsy(); expect(v.highlight).toBeUndefined(); }
        if (v.type === 'picto' && v.bar && kind !== 'mean') for (const row of v.rows) expect(row.n % (v.bar % 2 ? v.bar : v.bar / 2), where).toBe(0);
        if (v.type === 'picto' && !v.bar && !v.tally) for (const row of v.rows) { expect(row.n / v.key).toBeLessThanOrEqual(10); expect(Number.isInteger((2 * row.n) / v.key), where).toBe(true); }
        if (v.type === 'pie') expect(v.highlight).toBeUndefined();
        if (q.choices) {
          const vals = q.choices.map((c) => c.value);
          expect(vals.length, where).toBeGreaterThanOrEqual(2); expect(vals.length).toBeLessThanOrEqual(5);
          expect(new Set(vals).size, where).toBe(vals.length);
          expect(vals, where).toContain(q.answer);
          const numeric = q.choices.every((c) => /^\d+$/.test(c.label));
          if (numeric) for (const c of q.choices) { expect(c.label).toBe(String(c.value)); expect(c.value).toBeGreaterThan(0); }
          else expect([...vals].sort((a, b) => a - b), where).toEqual(vals.map((_, j) => j + 1));
        }
        if (inBand) expect(violatesCaps(g, { ...q, game: 'data' }), where).toBeNull();
        if (inBand && g === 'g1') {
          expect(q.choices, where).toBeTruthy(); expect(q.choices!.length).toBeLessThanOrEqual(4);
          expect(q.readAloud, where).toBeTruthy();
          for (const t of [q.prompt, q.readAloud!]) expect(Math.max(...words(t)), t).toBeLessThanOrEqual(12);
          for (const t of texts(q)) expect(Math.max(0, ...nums(t)), `${where} :: ${t}`).toBeLessThanOrEqual(20);
          if (v.type === 'picto') for (const row of v.rows) expect(row.n).toBeLessThanOrEqual(20);
          expect(texts(q).join(' ')).not.toMatch(/%|percent/i);
        }
        if (inBand && g === 'g3') {
          for (const t of texts(q)) expect(Math.max(0, ...nums(t)), `${where} :: ${t}`).toBeLessThanOrEqual(1000);
          expect(texts(q).join(' ')).not.toMatch(/%|percent/i);
        }
      }
    });
  }

  it('is deterministic for a seed', () => {
    for (const kind of [...KINDS, 'all'] as DataKind[]) for (const d of DS) {
      const a = dataQuestion(kind, d, createRng(5)), b = dataQuestion(kind, d, createRng(5));
      expect([a.prompt, a.answer, a.visual, a.choices, a.solutionSteps, a.solutionVisual]).toEqual([b.prompt, b.answer, b.visual, b.choices, b.solutionSteps, b.solutionVisual]);
    }
  });

  it('mixed play only picks kinds that suit the grade', () => {
    const r = createRng(9);
    for (const d of DS) for (let i = 0; i < 60; i++) {
      const q = dataQuestion('all', d, r);
      expect(q.masterySkillId).toBe('data');
      const kind = DATA_KINDS.find((k) => k.label === q.subtopic)!.id;
      expect(DATA_KIND_GRADES[kind], `${kind} at d${d}`).toContain(gradeOf(d));
    }
  });

  it('covers every question shape', () => {
    const r = createRng(77);
    const seen = new Set<string>();
    const shape = (q: Question) => {
      const v = q.visual as ContestVisual; const qs = asked(q.prompt);
      if (v.type === 'picto') return `${v.bar ? 'bar' : v.tally ? 'tally' : `key${v.key}`}:${/Which tally/.test(q.prompt) ? 'match' : /range/.test(qs) ? 'range' : /most|fewest/.test(qs) ? 'most' : /pictures go/.test(qs) ? 'pictures' : /fraction/.test(qs) ? 'fraction' : /percent/.test(qs) ? 'percent' : /Which two/.test(qs) ? 'pair' : /times/.test(qs) ? 'times' : /together than/.test(qs) ? 'twostep' : /more/.test(qs) ? 'more' : /median/.test(qs) ? 'median' : /range/.test(qs) ? 'range' : /mean/.test(qs) ? 'mean' : /in all/.test(qs) ? 'all' : 'one'}`;
      if (v.type === 'pie') return `pie:${v.showPct ? 'pct' : 'parts'}:${v.ask !== undefined ? 'ask' : /in all/.test(qs) ? 'reverse' : /percent/.test(qs) ? 'percent' : /more/.test(qs) ? 'more' : 'count'}`;
      if (v.type === 'venn') return `venn${v.sets.length}:${Object.values(v.counts).includes('?') ? 'missing' : v.sizes ? 'sizes' : 'read'}`;
      return v.type;
    };
    for (const kind of KINDS) for (const d of DS) for (let i = 0; i < 80; i++) seen.add(shape(dataQuestion(kind, d, r)));
    for (const s of ['tally:one', 'tally:most', 'tally:more', 'key1:one', 'key1:match', 'key1:most', 'key2:one', 'key5:all', 'key2:pictures', 'key4:twostep', 'bar:one', 'bar:more', 'bar:all', 'bar:twostep', 'bar:fraction', 'bar:pair', 'bar:times', 'bar:percent', 'bar:mean', 'bar:median', 'bar:range',
      'pie:parts:count', 'pie:parts:percent', 'pie:parts:reverse', 'pie:pct:count', 'pie:pct:ask', 'pie:pct:more', 'venn2:read', 'venn2:missing', 'venn3:read', 'venn3:missing']) expect(seen, s).toContain(s);
  });
});

describe('Charts & Venn lessons and wiring', () => {
  it('teaches on pictures, then tries real skills', () => {
    expect(DATA_LESSONS.length).toBeGreaterThanOrEqual(2);
    expect(PICTURE_GAMES.data.lessons.map(([id]) => id)).toEqual(DATA_LESSONS.map((l) => l.id));
    const kinds = new Set(DATA_KINDS.map((k) => `data.${k.id}`));
    DATA_LESSONS.forEach((l, i) => {
      expect(l.id).toBe(`l.data-${i + 1}`); expect(l.group).toBe(DATA_META.label); expect(['vector', 'newton']).toContain(l.teacher);
      const says = l.steps.filter((s) => s.type === 'say'); const tries = l.steps.filter((s) => s.type === 'try');
      expect(says.some((s) => s.type === 'say' && s.visual && s.caption)).toBe(true);
      expect(tries.length).toBeGreaterThan(0); expect(l.steps.at(-1)!.type).toBe('summary');
      for (const s of l.steps) {
        if (s.type === 'say') { checkLabels(s.text); expect(arithmeticSlips(s.text), s.text).toEqual([]); expect(['vector', 'newton']).toContain(s.speaker); }
        if (s.type === 'try') {
          expect(kinds.has(s.skillId), s.skillId).toBe(true); expect(s.count).toBeGreaterThanOrEqual(3); expect(s.count).toBeLessThanOrEqual(4);
          const kind = s.skillId.split('.')[1];
          expect(DATA_KIND_GRADES[kind]).toContain(gradeOf(s.difficulty));
          expect(dataQuestion(kind as DataKind, s.difficulty, createRng(1)).masterySkillId).toBe(s.skillId);
        }
      }
    });
    // one lesson reaches Grade 1, one is all Grade 5
    const tryGrades = DATA_LESSONS.map((l) => l.steps.flatMap((s) => (s.type === 'try' ? [gradeOf(s.difficulty)] : [])));
    expect(tryGrades.some((gs) => gs.includes('g1'))).toBe(true);
    expect(tryGrades.some((gs) => gs.every((g) => g === 'g5'))).toBe(true);
    expect(DATA_META.intro.length).toBeGreaterThan(80); expect(DATA_META.intro).not.toBe(DATA_META.blurb);
  });

  it('lesson pictures add up', () => {
    for (const l of DATA_LESSONS) for (const s of l.steps) {
      if (s.type !== 'say' || !s.visual) continue;
      const v = s.visual as ContestVisual;
      if (v.type === 'venn' && typeof v.total === 'number' && !Object.values(v.counts).includes('?')) expect(sum(Object.values(v.counts) as number[])).toBe(v.total);
      if (v.type === 'venn' && v.sizes && !Object.values(v.counts).includes('?')) { const c = v.counts as Record<string, number>; expect([c.A + c.AB, c.B + c.AB]).toEqual(v.sizes); }
      if (v.type === 'pie' && v.showPct) expect(sum(v.slices.map((x) => x.v))).toBe(100);
      if (v.type === 'pie' && v.parts) expect(sum(v.slices.map((x) => x.v))).toBe(v.parts);
    }
  });
});

/* ---------- regressions from the verifiers' findings ---------- */

/** Plural count nouns: after the number 1 the label must use the singular. */
const PLURAL = new Set(['children', 'students', 'friends', 'marks', 'pictures', 'parts', 'votes', 'apples', 'books', 'flowers', 'stars', 'cookies', 'kites', 'cars', 'cans', 'laps', 'tickets', 'points', 'goals', 'shells']);
function singularAfterOne(s: string) {
  for (const m of s.matchAll(/(?<![\d.,/])\b1 \(([^)]*)\)/g)) {
    if (/ only$/.test(m[1])) continue; // a Venn part named after its set ("apples only")
    const head = m[1].replace(/^more /, '').split(' ')[0];
    expect(PLURAL.has(head), `"1 (${m[1]})" in: ${s}`).toBe(false);
  }
}
type Tag = { tag: string; a: Record<string, string>; text: string };
/** The elements of a rendered SVG: name, attributes and (for text) the words. */
function elements(html: string): Tag[] {
  return [...html.matchAll(/<(text|rect|line|circle|svg|path)\b([^>]*)>(?:([^<]*)<\/text>)?/g)].map((m) => ({
    tag: m[1], a: Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map((x) => [x[1], x[2]])), text: m[3] ?? '',
  }));
}
const num = (t: Tag, k: string) => Number(t.a[k]);
const viewBox = (els: Tag[]) => { const [, , w, h] = els.find((e) => e.tag === 'svg')!.a.viewBox.split(' ').map(Number); return { w, h }; };
/** A text's box: monospace glyphs are about 0.6em wide, digits and capitals about 0.75em tall. */
function textBox(t: Tag) {
  const size = num(t, 'font-size'); const w = t.text.length * size * 0.6; const x = num(t, 'x'); const y = num(t, 'y');
  const left = t.a['text-anchor'] === 'end' ? x - w : t.a['text-anchor'] === 'middle' ? x - w / 2 : x;
  return { left, right: left + w, top: y - size * 0.75, bottom: y + 1 };
}
const isAsk = (e: Tag) => e.tag === 'rect' && e.a.stroke === '#f472b6';

describe('Charts & Venn regressions', () => {
  it('a count of 1 is singular in labels, and a prompt never says "1 play both"', () => {
    for (const kind of KINDS) for (const d of DS) {
      const r = createRng(31 * d + kind.length);
      for (let i = 0; i < 300; i++) {
        const q = dataQuestion(kind, d, r);
        for (const t of [q.hint, ...q.solutionSteps]) singularAfterOne(t);
        expect(q.prompt, q.prompt).not.toMatch(/(?<![\d.,/])\b1 (children|students|friends|votes|play|have|take|like|are|were)\b/);
      }
    }
    for (const l of DATA_LESSONS) for (const s of l.steps) if (s.type === 'say') singularAfterOne(s.text);
    // the two reported cases
    expect(dataQuestion('venn', 4, createRng(39723)).solutionSteps.join(' ')).toContain('= 1 (more child).');
    expect(dataQuestion('pie', 6, createRng(3262817)).solutionSteps.join(' ')).toContain('= 1 (more student).');
  });

  it('every number in hints and worked steps carries a label', () => {
    const NUM = /(?<![\w/.])[−-]?\d[\d,]*(?:\.\d+)?(?:\/\d+)?%?/g;
    const check = (t: string) => {
      const labelled = new Set([...t.matchAll(new RegExp(LABELED.source, 'g'))].map((m) => m.index));
      for (const m of t.matchAll(NUM)) expect(labelled.has(m.index), `unlabelled "${m[0]}" in: ${t}`).toBe(true);
    };
    for (const kind of KINDS) for (const d of DS) {
      const r = createRng(77 * d + kind.length);
      for (let i = 0; i < 200; i++) { const q = dataQuestion(kind, d, r); [q.hint, ...q.solutionSteps].forEach(check); }
    }
    for (const l of DATA_LESSONS) for (const s of l.steps) if (s.type === 'say') check(s.text);
  });

  it('a lesson never shows the same chart with different numbers', () => {
    for (const l of DATA_LESSONS) {
      const shares = new Map<string, string>();
      for (const s of l.steps) {
        if (s.type !== 'say' || !s.visual) continue;
        const v = s.visual as ContestVisual;
        if (v.type !== 'pie') continue;
        const tot = sum(v.slices.map((x) => x.v));
        const key = v.slices.map((x) => `${x.label.split(' ')[0]}:${x.v / tot}`).sort().join(',');
        if (shares.has(v.title ?? '')) expect(key, `${l.id} pie "${v.title}"`).toBe(shares.get(v.title ?? ''));
        shares.set(v.title ?? '', key);
      }
    }
  });

  it('mean pictures: the missing bar does not set the scale, and the gap picture marks the median', () => {
    const step = (max: number) => (max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : 50);
    let missing = 0, gaps = 0;
    for (const d of [5, 6] as Difficulty[]) {
      const r = createRng(400 + d);
      for (let i = 0; i < 400; i++) {
        const q = dataQuestion('mean', d, r); const v = q.visual as Picto; const sv = q.solutionVisual as Picto;
        if (v.ask !== undefined) {
          missing++;
          expect(v.bar, q.prompt).toBe(step(Math.max(...v.rows.filter((_, j) => j !== v.ask).map((x) => x.n))));
        }
        if (/How much bigger/.test(q.prompt)) {
          gaps++;
          const vals = sv.rows.map((x) => x.n);
          expect(vals).toEqual([...vals].sort((a, b) => a - b));
          expect(sv.highlight).toEqual([vals.length >> 1]);
          expect(sv.line).toBeDefined();
          expect(vals[vals.length >> 1]).toBe(medianOf(v.rows.map((x) => x.n)));
        }
      }
    }
    expect(missing).toBeGreaterThan(20); expect(gaps).toBeGreaterThan(20);
  });

  it('a Venn worked picture shows only numbers the question gives or that can be worked out', () => {
    let n = 0;
    for (const d of [5, 6] as Difficulty[]) {
      const r = createRng(500 + d);
      for (let i = 0; i < 400; i++) {
        const q = dataQuestion('venn', d, r); const v = q.visual as Venn; const sv = q.solutionVisual as Venn;
        if (v.total === undefined && !('none' in v.counts)) { n++; expect('none' in sv.counts, q.prompt).toBe(false); expect(sv.total).toBeUndefined(); }
      }
    }
    expect(n).toBeGreaterThan(20);
  });

  it('pie labels stay inside the picture, worked counts and pulled-out slices included', () => {
    const pies: Pie[] = [];
    for (const d of [5, 6] as Difficulty[]) {
      const r = createRng(600 + d);
      for (let i = 0; i < 400; i++) { const q = dataQuestion('pie', d, r); pies.push(q.visual as Pie, q.solutionVisual as Pie); }
    }
    for (const l of DATA_LESSONS) for (const s of l.steps) if (s.type === 'say' && (s.visual as ContestVisual)?.type === 'pie') pies.push(s.visual as Pie);
    for (const v of pies) {
      const els = elements(renderToStaticMarkup(createElement(PieChart, { v })));
      const { w, h } = viewBox(els);
      for (const t of els.filter((e) => e.tag === 'text')) {
        const b = textBox(t);
        expect(b.left >= 0 && b.right <= w && b.top >= 0 && b.bottom <= h, `"${t.text}" at ${JSON.stringify(b)} in ${w}x${h}: ${JSON.stringify(v)}`).toBe(true);
      }
    }
  });

  it('the mean line never runs through a printed bar value', () => {
    let lines = 0;
    for (const d of [5, 6] as Difficulty[]) {
      const r = createRng(700 + d);
      for (let i = 0; i < 400; i++) {
        const q = dataQuestion('mean', d, r); const sv = q.solutionVisual as Picto;
        if (sv.line === undefined) continue;
        lines++;
        const els = elements(renderToStaticMarkup(createElement(Pictograph, { v: sv })));
        const mean = els.find((e) => e.tag === 'line' && e.a['stroke-dasharray'] === '6 4' && num(e, 'x1') === 50)!;
        expect(mean, JSON.stringify(sv)).toBeTruthy();
        const y = num(mean, 'y1');
        for (const t of els.filter((e) => e.tag === 'text' && e.a['font-size'] === '13' && e.a['text-anchor'] === 'middle')) {
          const b = textBox(t);
          expect(y + 1.25 <= b.top || y - 1.25 >= b.bottom, `value ${t.text} crosses the mean line at ${y}: ${JSON.stringify(sv)}`).toBe(true);
        }
      }
    }
    expect(lines).toBeGreaterThan(100);
  });

  it('the missing bar is an empty column the height of the grid', () => {
    for (let i = 0, r = createRng(800); i < 300; i++) {
      const q = dataQuestion('mean', 5 + (i % 2) as Difficulty, r); const v = q.visual as Picto;
      if (v.ask === undefined) continue;
      const els = elements(renderToStaticMarkup(createElement(Pictograph, { v })));
      const grid = els.filter((e) => e.tag === 'line' && num(e, 'x1') === 50 && e.a.y1 === e.a.y2).map((e) => num(e, 'y1'));
      const box = els.find(isAsk)!;
      expect(num(box, 'y')).toBeCloseTo(Math.min(...grid) + 2, 5);
      expect(num(box, 'y') + num(box, 'height')).toBeCloseTo(Math.max(...grid) - 2, 5);
    }
  });

  it('the tally choices are drawn in one frame that fits a choice button', () => {
    let n = 0;
    for (const d of [1, 2] as Difficulty[]) {
      const r = createRng(900 + d);
      for (let i = 0; i < 300; i++) {
        const q = dataQuestion('picto', d, r);
        if (!/Which tally/.test(q.prompt)) continue;
        n++;
        const svgs = q.choices!.map((c) => elements(renderToStaticMarkup(createElement(Pictograph, { v: c.visual as Picto, small: true }))).find((e) => e.tag === 'svg')!);
        expect(new Set(svgs.map((s) => `${s.a.viewBox} ${s.a.width}`)).size).toBe(1);
        expect(num(svgs[0], 'width')).toBeLessThanOrEqual(84);
        // the marks fit inside the frame
        const els = elements(renderToStaticMarkup(createElement(Pictograph, { v: q.choices![0].visual as Picto, small: true })));
        const { w } = viewBox(els);
        for (const l of els.filter((e) => e.tag === 'line')) expect(Math.max(num(l, 'x1'), num(l, 'x2'))).toBeLessThanOrEqual(w);
      }
    }
    expect(n).toBeGreaterThan(20);
  });

  it('a Venn "?" box sits wholly inside the region it asks about', () => {
    let n = 0;
    for (const d of [3, 4, 5, 6] as Difficulty[]) {
      const r = createRng(1000 + d);
      for (let i = 0; i < 400; i++) {
        const q = dataQuestion('venn', d, r); const v = q.visual as Venn;
        const asked = Object.entries(v.counts).find(([, x]) => x === '?')?.[0];
        if (!asked) continue;
        n++;
        const els = elements(renderToStaticMarkup(createElement(VennDiagram, { v })));
        const circles = els.filter((e) => e.tag === 'circle').map((e) => ({ x: num(e, 'cx'), y: num(e, 'cy'), r: num(e, 'r') }));
        const frame = els.find((e) => e.tag === 'rect' && e.a.rx === '10')!;
        const box = els.find(isAsk)!;
        const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((k) => num(box, k));
        const region = (px: number, py: number) => circles.map((c, j) => (Math.hypot(px - c.x, py - c.y) < c.r ? 'ABC'[j] : '')).join('') || 'none';
        for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h], [x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2]]) {
          expect(region(px, py), `${asked} box corner (${px}, ${py}): ${JSON.stringify(v)}`).toBe(asked);
        }
        expect(y + h, 'the "?" box stays clear of the frame').toBeLessThanOrEqual(num(frame, 'y') + num(frame, 'height') - 6);
      }
    }
    expect(n).toBeGreaterThan(100);
  });
});
