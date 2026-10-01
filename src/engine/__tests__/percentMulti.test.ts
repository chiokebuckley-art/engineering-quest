import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { PICTURE_GAMES } from '../questions/games';
import { PCTMULTI_KIND_GRADES, PCTMULTI_KINDS, PCTMULTI_META, pctmultiQuestion, type PctMultiKind } from '../questions/percentMulti';
import { PCTMULTI_LESSONS } from '../../content/contest/percentMulti';
import { gradeOf } from '../contest/common';
import { violatesCaps } from '../contest/grades';
import { LABELED, stripLabels } from '../label';
import { arithmeticSlips } from '../academy/teachMath';
import { skillById } from '../curriculum/skills';
import { PercentSteps, STEP_BARS, pctAmountText } from '../../game/components/contest/PercentViz';
import { COLOR } from '../../game/components/contest/kit';
import type { Difficulty, Question, Visual } from '../types';

type PctV = Extract<Visual, { type: 'pctsteps' }>;
const KINDS = ['outof100', 'discounttax', 'twosteps', 'pctofpct', 'updown'] as const;
type Kind = typeof KINDS[number];
const DS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const N = Number(process.env.PCT_N ?? 120);
const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/* ---------- independent maths: walk the bars in plain floating point ---------- */

function walk(v: PctV): number[] {
  let a = v.start; const out = [a];
  for (const s of v.steps) {
    const part = (a / 100) * s.pct;
    a = s.kind === 'off' ? a - part : s.kind === 'on' ? a + part : part;
    out.push(a);
  }
  return out;
}
const nums = (s: string) => [...s.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, '')));
const pcts = (s: string) => [...s.matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) => Number(m[1]));
const has = (s: string, n: number) => nums(s).some((x) => close(x, n));
/** Money as a story writes it: $80, $38.88. */
const money = (x: number) => (Number.isInteger(x) ? `$${x}` : `$${x.toFixed(2)}`);

/** The answer worked out again from the picture and the words, without the generator's helpers. */
function recompute(kind: Kind, q: Question): number {
  const v = q.visual as PctV;
  const am = walk(v); const last = am[am.length - 1];
  const P = pcts(q.prompt);
  if (kind === 'outof100') {
    if (q.prompt.startsWith('Tap the grid')) {
      const p = P[0];
      expect(v.grid).toBe(true); expect(v.steps).toEqual([]);
      const shaded = q.choices!.map((c) => { const cv = c.visual as PctV; expect(cv.grid).toBe(true); return walk(cv)[1]; });
      expect(new Set(shaded).size).toBe(shaded.length);
      const hit = q.choices!.filter((_c, i) => close(shaded[i], p));
      expect(hit).toHaveLength(1);
      return hit[0].value;
    }
    if (v.ask === 'pct') {
      const s = v.steps[0]; expect(v.steps).toHaveLength(1);
      // the percent to find is the step's share; the picture's amount must be the one the story gives
      if (s.kind === 'off') { expect(q.prompt).toMatch(/NOT/); expect(has(q.prompt, last)).toBe(true); return 100 - (last / v.start) * 100; }
      if (/^0\.\d+/.test(q.prompt.split('and ')[1] ?? '')) { const dec = Number(/(0\.\d+)/.exec(q.prompt)![1]); expect(close(dec, last / v.start)).toBe(true); return dec * 100; }
      const frac = /(\d+)\/(\d+)/.exec(q.prompt);
      if (frac) { expect(Number(frac[2])).toBe(v.start); expect(close(Number(frac[1]), last)).toBe(true); return (Number(frac[1]) / Number(frac[2])) * 100; }
      expect(has(q.prompt, v.start) || /dollar/.test(q.prompt)).toBe(true);
      expect(has(q.prompt, last)).toBe(true);
      return (last / v.start) * 100;
    }
    expect(has(q.prompt, v.start)).toBe(true); expect(P).toContain(v.steps[0].pct);
    return last;
  }
  if (kind === 'discounttax') {
    expect(v.steps.map((s) => s.kind)).toEqual(['off', 'on']);
    expect(q.prompt).toContain(`${v.steps[0].pct}% off`); expect(q.prompt).toMatch(new RegExp(`${v.steps[1].pct}% tariff`));
    expect(q.prompt).toContain(v.unit === '$' ? `costs ${money(v.start)}` : `costs ${v.start} coins`);
    return last;
  }
  if (kind === 'twosteps') {
    expect(v.steps.map((s) => s.kind)).toEqual(['off', 'off']);
    expect(P.slice(0, 2)).toEqual(v.steps.map((s) => s.pct));
    if (v.unit === '%') { expect(v.start).toBe(100); return 100 - last; }
    expect(has(q.prompt, v.start)).toBe(true);
    return last;
  }
  if (kind === 'pctofpct') {
    const [p1, p2] = P;
    const without = /that (do not|are not|have no)/.test(q.prompt);
    // "do NOT": the picture takes the given part away; the complement is the child's step, never printed for them
    expect(v.steps.map((s) => s.kind)).toEqual(['take', without ? 'off' : 'take']);
    expect(v.steps[0].pct).toBe(p1);
    expect(v.steps[1].pct).toBe(p2);
    if (without && 100 - p2 !== p1 && 100 - p2 !== p2) {
      expect(q.expression, q.prompt).not.toContain(`${100 - p2}%`);
      expect(nodes(render(v)).join(' '), q.prompt).not.toContain(`${100 - p2}%`);
    }
    // the answer is never one of the percents the story prints (it could be copied)
    expect(P, q.prompt).not.toContain(q.answer);
    if (v.unit === '%') { expect(v.start).toBe(100); return (p1 / 100) * (without ? 100 - p2 : p2); }
    expect(has(q.prompt, v.start)).toBe(true);
    return (((v.start * p1) / 100) * p2) / 100;
  }
  // updown: the same percent up then down (or down then up)
  const [a, b] = v.steps;
  expect(a.pct).toBe(b.pct); expect(new Set([a.kind, b.kind])).toEqual(new Set(['on', 'off']));
  expect(q.prompt.indexOf(a.kind === 'on' ? 'up' : 'down')).toBeLessThan(q.prompt.indexOf(a.kind === 'on' ? 'down' : 'up'));
  if (v.unit === '%') return last - 100;
  expect(has(q.prompt, v.start)).toBe(true);
  return v.start * (1 + a.pct / 100) * (1 - a.pct / 100);
}

/* ---------- checks shared by every question ---------- */

const LABEL_OK = /^[A-Za-z][A-Za-z ',/-]*[A-Za-z]$/;
function checkLabels(s: string) {
  const after = [...s.matchAll(/(?:\d|%|\?) \(([^)]*)\)/g)];
  for (const m of after) expect(LABEL_OK.test(m[1]) && m[1].length >= 2, `bad label "(${m[1]})" in: ${s}`).toBe(true);
  expect([...s.matchAll(new RegExp(LABELED.source, 'g'))].length, s).toBe(after.length);
}
const texts = (q: Question) => [q.prompt, q.expression, q.hint, q.readAloud ?? '', q.answerText ?? '', ...q.solutionSteps, ...q.explanation, ...(q.choices ?? []).map((c) => c.label)];
/** The number a choice label says: "$38.88", "75%", "66 coins", "4% lower", "No change", "30 shaded" or a plain number. */
function labelValue(label: string): number {
  if (label === 'No change') return 0;
  let m = /^(\d+(?:\.\d+)?)% (lower|higher)$/.exec(label); if (m) return m[2] === 'lower' ? -Number(m[1]) : Number(m[1]);
  m = /^\$(\d+(?:\.\d\d)?)$/.exec(label); if (m) return Number(m[1]);
  m = /^(\d+(?:\.\d+)?)(?:%| coins)?$/.exec(label); if (m) return Number(m[1]);
  throw new Error(`unreadable choice label "${label}"`);
}
const render = (v: Visual) => renderToStaticMarkup(createElement(PercentSteps, { v: v as PctV }));
/** Every text node of a picture. */
const nodes = (html: string) => [...html.matchAll(/>([^<>]+)</g)].map((m) => m[1]);

function checkQuestion(kind: Kind, d: Difficulty, q: Question) {
  const ctx = `${kind} d${d}: ${q.prompt}`;
  expect(q.topic).toBe(PCTMULTI_META.topic);
  expect(q.masterySkillId).toBe(`pctmulti.${kind}`);
  expect(q.visualFirst).toBe(true);
  expect(q.difficulty).toBe(d);
  expect(q.visual.type, ctx).toBe('pctsteps');
  const v = q.visual as PctV;
  expect(v.reveal, ctx).toBeFalsy();
  const sol = q.solutionVisual as PctV;
  expect(sol.type).toBe('pctsteps'); expect(sol.reveal).toBe(true);
  if (!q.prompt.startsWith('Tap the grid')) { expect(sol.start).toBe(v.start); expect(sol.steps).toEqual(v.steps); }
  for (const s of v.steps) { expect(s.pct > 0 && s.pct < 100, ctx).toBe(true); expect(s.label.length).toBeGreaterThan(0); }
  if (v.grid) expect(v.start).toBe(100);

  // the answer, worked out again
  const right = recompute(kind, q);
  expect(close(q.answer, right), `${ctx} → ${q.answer} but recomputed ${right}`).toBe(true);
  expect(checkAnswer(q, String(q.answer)), ctx).toBe(true);
  // whole numbers, or money to the cent
  expect(Math.abs(Math.round(q.answer * 100) - q.answer * 100) < 1e-6, ctx).toBe(true);
  for (const a of walk(v)) expect(Math.abs(Math.round(a * 100) - a * 100) < 1e-6, `${ctx}: amount ${a}`).toBe(true);
  if (v.unit !== '$' && !v.unit.startsWith('%') && !v.grid && v.ask !== 'pct') for (const a of walk(v)) expect(Number.isInteger(Math.round(a * 1e6) / 1e6), `${ctx}: ${a} ${v.unit}`).toBe(true);

  // tap choices: 2–5, distinct, honest labels, the right one among them
  if (q.choices) {
    const cs = q.choices;
    expect(cs.length, ctx).toBeGreaterThanOrEqual(2); expect(cs.length, ctx).toBeLessThanOrEqual(5);
    expect(new Set(cs.map((c) => c.value)).size, ctx).toBe(cs.length);
    expect(new Set(cs.map((c) => c.label)).size, ctx).toBe(cs.length);
    expect(cs.filter((c) => close(c.value, q.answer)), ctx).toHaveLength(1);
    if (q.prompt.startsWith('Tap the grid')) {
      expect(cs.map((c) => c.value).sort()).toEqual(cs.map((_, i) => i + 1));
      // a label never says the count: matching digits must not answer it
      for (const c of cs) expect(c.label, ctx).not.toMatch(/\d/);
    } else for (const c of cs) expect(close(labelValue(c.label), c.value), `${ctx}: ${c.label} = ${c.value}`).toBe(true);
    // five buttons in a row of three: a label fits on one line at phone width ("1200 coins" wraps)
    if (cs.length === 5) for (const c of cs) expect(c.label.length, `${ctx}: ${c.label}`).toBeLessThanOrEqual(9);
    if (gradeOf(d) === 'g5' && v.unit !== '%' && !q.prompt.startsWith('Tap')) expect(cs.length, ctx).toBe(5);
  }

  // words: no holes, labels well formed, the working shows the answer with a label
  const all = texts(q);
  for (const s of all) { expect(s, ctx).not.toMatch(/undefined|NaN|Infinity|\[object/); checkLabels(s); }
  expect(q.hint.length).toBeGreaterThan(10);
  expect(q.solutionSteps.length).toBeGreaterThan(0);
  expect(q.explanation).toEqual(q.solutionSteps);
  for (const s of q.solutionSteps) expect(arithmeticSlips(s), `${ctx}: ${s}`).toEqual([]);
  const labelled = q.solutionSteps.flatMap((s) => [...s.matchAll(new RegExp(LABELED.source, 'g'))].map((m) => Number(m[1].replace(/[$%,]/g, ''))));
  const shown = q.prompt.startsWith('Tap the grid') ? pcts(q.prompt)[0] : Math.abs(q.answer);
  expect(labelled.some((n) => close(n, shown)), `${ctx}: answer ${shown} not labelled in the steps`).toBe(true);
  // the hint never says the answer (for out-of-100 stories the answer is a number the story already gives)
  if (kind !== 'outof100') expect(pcts(q.hint).concat(nums(q.hint)).some((n) => close(n, Math.abs(q.answer)) && !has(q.prompt, n)), `${ctx}: hint gives ${q.answer}`).toBe(false);
  // "what percent" of a whole that is not 100: the answer is never a number the prompt prints ("1 of 10 parts" = 10%)
  if (kind === 'outof100' && v.ask === 'pct' && v.start !== 100) expect(nums(q.prompt), ctx).not.toContain(q.answer);
  // a count of 1 reads "1 of the 20 plants have flowers": never asked
  expect(q.prompt, ctx).not.toMatch(/^1 of the/);
  // the "Show me how" heading drops " = ?": what is left must still read right (no "50 out of 100%")
  expect(q.expression, ctx).not.toMatch(/ = \?%/);
  expect(q.readAloud, ctx).toBeTruthy();
  expect(q.readAloud!).not.toMatch(/[%$]/);

  // the picture shows the problem, never the answer; the worked picture does show it
  const html = render(q.visual); const solHtml = render(q.solutionVisual!);
  const text = nodes(html); const solText = nodes(solHtml);
  if (q.prompt.startsWith('Tap the grid')) {
    expect(text.join(' ')).toContain('100 squares');
    for (const c of q.choices!) expect(render(c.visual!), ctx).not.toMatch(/shaded shaded/);
    return;
  }
  checkBars(v, html, ctx); checkBars(sol, solHtml, `${ctx} (worked)`);
  const am = walk(v);
  if (v.ask === 'pct') {
    expect(text, ctx).not.toContain(`${q.answer}%`);
    expect(solText.join(' '), ctx).toContain(`${q.answer}%`);
    expect(text, ctx).toContain('?');
  } else {
    const hidden = pctAmountText(am[am.length - 1], v.unit);
    expect(text, `${ctx}: picture shows ${hidden}`).not.toContain(hidden);
    // amounts after the steps never show (a '%' amount equal to a step's own percent is that percent's tag, not a leak)
    const tags = new Set(v.steps.map((s) => `${s.pct}%`));
    for (const a of am.slice(1)) if (!tags.has(pctAmountText(a, v.unit))) expect(text, ctx).not.toContain(pctAmountText(a, v.unit));
    expect(solText, ctx).toContain(hidden);
    expect(text.filter((t) => t === '?').length, ctx).toBe(v.steps.length);
    expect(html).not.toContain(`then ${hidden}`);
  }
  // the given start shows; every percent shows unless it is the "?"
  expect(text.join(' ')).toContain(v.grid ? '100' : pctAmountText(v.start, v.unit));
  if (v.ask !== 'pct') for (const s of v.steps) expect(text.join(' '), ctx).toContain(`${s.pct}%`);
}

/* ---------- bar pictures: every step tagged, tags clear of the dividers and the amounts, no countable answer ---------- */

const attrs = (tag: string) => Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
/** Tag boxes (the dark pill or the "?%" box) and divider lines, with their geometry. */
function geometry(html: string) {
  const tags = [...html.matchAll(/<g data-tag="([^"]+)"><rect ([^>]*)>/g)].map((m) => { const a = attrs(m[2]); return { key: m[1], x: +a.x, y: +a.y, w: +a.width, h: +a.height }; });
  const divs = [...html.matchAll(/<line ([^>]*data-div[^>]*)>/g)].map((m) => { const a = attrs(m[1]); return { x: +a.x1, y1: +a.y1, y2: +a.y2 }; });
  return { tags, divs };
}
function checkBars(v: PctV, html: string, ctx: string) {
  if (v.grid) return;
  const { tags, divs } = geometry(html);
  // the start and every step carry their percent (or the "?%" box) on the bar or just past it
  expect(tags.map((t) => t.key), ctx).toEqual(['start', ...v.steps.map((_s, i) => `s${i + 1}`)]);
  const amountLeft = STEP_BARS.W - 4 - STEP_BARS.amtW;
  for (const t of tags) {
    expect(t.x, ctx).toBeGreaterThanOrEqual(0);
    expect(t.x + t.w, `${ctx}: tag ${t.key} runs into the amounts`).toBeLessThanOrEqual(amountLeft);
    for (const d of divs) if (d.y2 > t.y && d.y1 < t.y + t.h) expect(d.x <= t.x || d.x >= t.x + t.w, `${ctx}: tag ${t.key} hides a divider`).toBe(true);
  }
  // amounts that are hidden are never cut into pieces a child could count
  if (!v.reveal && v.ask !== 'pct') expect(divs, ctx).toEqual([]);
}

function checkSentences(q: Question, d: Difficulty) {
  if (gradeOf(d) !== 'g3') return;
  for (const s of q.prompt.split(/[.?!]/).map((x) => x.trim()).filter(Boolean)) expect(s.split(/\s+/).length, `long sentence for Grade 3: ${s}`).toBeLessThanOrEqual(12);
}

describe('Multi-step %: every kind at every difficulty', () => {
  for (const kind of KINDS) {
    it(`${kind}: ${N} questions per difficulty are right, labelled, capped and never show the answer`, () => {
      for (const d of DS) {
        const rng = createRng(1000 * d + kind.length);
        const prompts = new Set<string>();
        for (let i = 0; i < N; i++) {
          const q = pctmultiQuestion(kind, d, rng);
          checkQuestion(kind, d, q);
          prompts.add(q.prompt);
          if (PCTMULTI_KIND_GRADES[kind].includes(gradeOf(d))) {
            expect(violatesCaps(gradeOf(d), { ...q, game: 'pctmulti' }), `${kind} d${d}: ${q.prompt}`).toBeNull();
            checkSentences(q, d);
          }
        }
        expect(prompts.size, `${kind} d${d} variety`).toBeGreaterThan(Math.min(N / 4, 30));
      }
    });
  }

  it('is deterministic for a seed', () => {
    for (const kind of [...KINDS, 'all'] as PctMultiKind[]) for (const d of DS) {
      const a = pctmultiQuestion(kind, d, createRng(42)), b = pctmultiQuestion(kind, d, createRng(42));
      expect([a.prompt, a.answer, a.solutionSteps, a.choices?.map((c) => c.label)]).toEqual([b.prompt, b.answer, b.solutionSteps, b.choices?.map((c) => c.label)]);
    }
  });

  it('Grade 3 plays only out of 100; Mixed picks kinds that suit the grade and never crashes', () => {
    for (const d of DS) {
      const rng = createRng(d);
      for (let i = 0; i < 80; i++) {
        const q = pctmultiQuestion('all', d, rng);
        expect(q.masterySkillId).toBe('pctmulti');
        expect(Number.isFinite(q.answer)).toBe(true);
        expect(checkAnswer(q, String(q.answer))).toBe(true);
        if (d <= 4) expect(q.subtopic).toBe('Out of 100');
        if (d >= 3) expect(violatesCaps(gradeOf(d), { ...q, game: 'pctmulti' })).toBeNull();
      }
    }
    expect(pctmultiQuestion('updown', 1, createRng(3), 'custom.skill').masterySkillId).toBe('custom.skill');
  });

  it('teaches each kind with its own subtypes (Grade 3 grids and coins, Grade 5 fractions, cents and signed changes)', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const r = createRng(seed);
      for (const [kind, d] of [['outof100', 3], ['outof100', 4], ['outof100', 5], ['outof100', 6], ['discounttax', 6], ['twosteps', 6], ['pctofpct', 6], ['updown', 6]] as const) {
        const q = pctmultiQuestion(kind, d, r); const v = q.visual as PctV;
        seen.add(`${kind}:${q.prompt.startsWith('Tap') ? 'pick' : v.grid ? 'grid' : (v.ask === 'pct' || v.unit === '%') ? 'pct' : 'amount'}`);
        if (q.answerText?.startsWith('$') && !Number.isInteger(q.answer)) seen.add('cents');
        if (q.answer < 0) seen.add('signed');
        if (!q.choices) seen.add(`typed:${kind}`);
      }
    }
    for (const k of ['outof100:pick', 'outof100:grid', 'outof100:pct', 'outof100:amount', 'discounttax:amount', 'twosteps:pct', 'pctofpct:pct', 'updown:pct', 'cents', 'signed', 'typed:outof100', 'typed:discounttax']) expect(seen, k).toContain(k);
  });
});

describe('Multi-step % pictures', () => {
  it('hides the amounts after the steps until reveal, and the percent for a "what percent" question', () => {
    const v: PctV = { type: 'pctsteps', start: 80, unit: 'coins', steps: [{ label: 'sale', pct: 25, kind: 'off' }, { label: 'tariff', pct: 10, kind: 'on' }] };
    const q = nodes(render(v));
    expect(q).toContain('80'); expect(q).toContain('Sale: −25%'); expect(q).toContain('Tariff: +10%');
    expect(q).not.toContain('60'); expect(q).not.toContain('66');
    const s = nodes(render({ ...v, reveal: true }));
    expect(s).toContain('60'); expect(s).toContain('66');
    const g: PctV = { type: 'pctsteps', start: 100, unit: 'squares', steps: [{ label: 'blue', pct: 37, kind: 'take' }], ask: 'pct', grid: true };
    const gq = nodes(render(g));
    expect(gq).toContain('37 of 100'); expect(gq).not.toContain('37%');
    expect(nodes(render({ ...g, reveal: true }))).toContain('37%');
    expect((render(g).match(/<rect/g) ?? []).length).toBeGreaterThanOrEqual(100);
  });
  it('writes money, percents and counts the way the stories do', () => {
    expect(pctAmountText(38.88, '$')).toBe('$38.88'); expect(pctAmountText(129.6, '$')).toBe('$129.60'); expect(pctAmountText(66, '$')).toBe('$66');
    expect(pctAmountText(96, '%')).toBe('96%'); expect(pctAmountText(360, 'crates')).toBe('360');
    const html = render({ type: 'pctsteps', start: 100, unit: '%', steps: [{ label: 'up', pct: 20, kind: 'on' }, { label: 'down', pct: 20, kind: 'off' }], reveal: true });
    expect(nodes(html)).toContain('120%'); expect(nodes(html)).toContain('96%');
  });
  it('draws countable pieces only when the amounts show, and keeps every tag off the pieces', () => {
    // "There are 20 students. 25% of them walk": 20 pieces would let a child count the 5
    const q: PctV = { type: 'pctsteps', start: 20, unit: 'students', steps: [{ label: 'walking', pct: 25, kind: 'take' }] };
    expect(geometry(render(q)).divs).toEqual([]);
    const worked = render({ ...q, reveal: true });
    expect(geometry(worked).divs.length).toBeGreaterThan(0);
    checkBars({ ...q, reveal: true }, worked, 'worked 20');
    // "11/20 shaded: what percent?" the "?%" box sits past the bar, not over the 11 pieces
    const f: PctV = { type: 'pctsteps', start: 20, unit: 'parts', steps: [{ label: 'shaded', pct: 55, kind: 'take' }], ask: 'pct' };
    const fh = render(f); const g = geometry(fh);
    expect(g.divs.length).toBe(2 * 19);
    checkBars(f, fh, '11/20');
  });
  it('tags every step, even when a piece is narrow or its bar is the longest', () => {
    for (const v of [
      { type: 'pctsteps', start: 200, unit: '$', steps: [{ label: 'up', pct: 20, kind: 'on' }, { label: 'down', pct: 20, kind: 'off' }] },
      { type: 'pctsteps', start: 150, unit: '$', steps: [{ label: 'sale', pct: 5, kind: 'off' }, { label: 'tariff', pct: 5, kind: 'on' }] },
      { type: 'pctsteps', start: 500, unit: 'robots', steps: [{ label: 'wheeled robots', pct: 10, kind: 'take' }, { label: 'blue', pct: 60, kind: 'take' }] },
      { type: 'pctsteps', start: 100, unit: '%', steps: [{ label: 'band students', pct: 10, kind: 'take' }, { label: 'drums', pct: 40, kind: 'off' }] },
    ] as PctV[]) for (const x of [v, { ...v, reveal: true }, { ...v, ask: 'pct' as const }]) checkBars(x, render(x), JSON.stringify(x));
  });
  it('opens up a narrow part (a percent of a percent) to fill its row', () => {
    const v: PctV = { type: 'pctsteps', start: 500, unit: 'robots', steps: [{ label: 'wheeled robots', pct: 10, kind: 'take' }, { label: 'blue', pct: 60, kind: 'take' }] };
    expect(render(v)).toContain('data-zoom');
    expect(render({ ...v, steps: [{ ...v.steps[0], pct: 80 }, v.steps[1]] })).not.toContain('data-zoom');
  });
  it('draws the start in a colour no story part uses', () => {
    const html = render({ type: 'pctsteps', start: 100, unit: 'marbles', steps: [{ label: 'blue', pct: 20, kind: 'take' }] });
    expect(html.match(new RegExp(`fill="${COLOR.blue}"`, 'g'))).toHaveLength(1);
    const start = attrs(/<rect ([^>]*)>/.exec(html.split('</defs>')[1])![1]);
    expect(Object.values(COLOR)).not.toContain(start.fill);
  });
  it('draws small pictures without words for tap choices', () => {
    const html = renderToStaticMarkup(createElement(PercentSteps, { v: { type: 'pctsteps', start: 100, unit: 'squares', steps: [{ label: 'shaded', pct: 30, kind: 'take' }], grid: true, reveal: true }, small: true }));
    expect(nodes(html).filter((t) => t.trim())).toEqual([]);
    expect(html).toMatch(/width="96"/);
  });
});

describe('Multi-step % registry and lessons', () => {
  it('is wired into the picture games and skills', () => {
    const g = PICTURE_GAMES.pctmulti;
    expect(g.kinds).toBe(PCTMULTI_KINDS); expect(g.topic).toBe(PCTMULTI_META.topic);
    expect(PCTMULTI_KINDS.map((k) => k.id)).toEqual(['all', ...KINDS]);
    for (const k of KINDS) expect(skillById(`pctmulti.${k}`)?.parent).toBe('pctmulti');
    expect(g.lessons.map(([id]) => id)).toEqual(PCTMULTI_LESSONS.map((l) => l.id));
    const intro = PCTMULTI_META.intro.split(/(?<=\.)\s+/);
    expect(intro.length).toBeGreaterThanOrEqual(2); expect(intro.length).toBeLessThanOrEqual(5);
  });

  it('teaches on pictures, then tries the game kinds at a sensible difficulty', () => {
    expect(PCTMULTI_LESSONS.length).toBeGreaterThanOrEqual(2);
    PCTMULTI_LESSONS.forEach((l, i) => {
      expect(l.id).toBe(`l.pctmulti-${i + 1}`);
      expect(l.group).toBe(PCTMULTI_META.label);
      expect(['vector', 'newton']).toContain(l.teacher);
      expect(l.steps[l.steps.length - 1].type).toBe('summary');
      const says = l.steps.filter((s) => s.type === 'say');
      expect(says.some((s) => s.type === 'say' && s.visual && s.caption), l.id).toBe(true);
      const tries = l.steps.filter((s) => s.type === 'try');
      expect(tries.length).toBeGreaterThan(0);
      for (const t of tries) if (t.type === 'try') {
        const kind = t.skillId.split('.')[1] as Kind;
        expect(KINDS).toContain(kind); expect(t.skillId).toBe(`pctmulti.${kind}`);
        expect(PCTMULTI_KIND_GRADES[kind]).toContain(gradeOf(t.difficulty));
        expect(t.count).toBeGreaterThanOrEqual(3); expect(t.count).toBeLessThanOrEqual(4);
      }
      for (const s of l.steps) {
        const words = s.type === 'say' ? [s.text, s.caption ?? ''] : s.type === 'try' ? [s.intro] : s.points;
        for (const w of words) { checkLabels(w); expect(arithmeticSlips(w), w).toEqual([]); expect(w).not.toMatch(/undefined|NaN/); }
        if (s.type === 'say' && s.visual?.type === 'pctsteps') for (const a of walk(s.visual)) expect(Math.abs(Math.round(a * 100) - a * 100) < 1e-6).toBe(true);
      }
    });
    const lowest = PCTMULTI_LESSONS.map((l) => Math.min(...l.steps.flatMap((s) => (s.type === 'try' ? [s.difficulty] : []))));
    expect(lowest.some((d) => d <= 4), 'a lesson for Grades 1–3').toBe(true);
    expect(lowest.some((d) => d >= 5), 'a lesson for Grade 5').toBe(true);
  });

  it('works the worked lesson numbers correctly', () => {
    const say = PCTMULTI_LESSONS.flatMap((l) => l.steps).filter((s) => s.type === 'say').map((s) => (s.type === 'say' ? stripLabels(s.text) : ''));
    expect(say.join(' ')).toContain('80 − 20 = 60');
    expect(say.join(' ')).toContain('60 + 6 = 66');
    expect(say.join(' ')).toContain('120 − 24 = 96');
  });
});
