import { describe, expect, it } from 'vitest';
import type { Difficulty, Question } from '../types';
import type { ContestVisual } from '../contest/visuals';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { gradeOf, type GradeId } from '../contest/common';
import { violatesCaps } from '../contest/grades';
import { LABELED } from '../label';
import { arithmeticSlips } from '../academy/teachMath';
import { PATHS_KINDS, PATHS_KIND_GRADES, PATHS_META, pathsQuestion, watchPathsChoices, type PathsChoiceBuild, type PathsKind } from '../questions/countingPaths';
import { PATHS_LESSONS } from '../../content/contest/countingPaths';
import { PICTURE_GAMES } from '../questions/games';

/**
 * Counting Paths: every kind at every difficulty, many seeds. Each answer is counted again here by brute force from the
 * picture (every combination, every order, every route, every pair is listed and filtered by the rule in the prompt),
 * sharing no code with the generator.
 */
type Kind = Exclude<PathsKind, 'all'>;
const KINDS = PATHS_KINDS.map((k) => k.id).filter((k) => k !== 'all') as Kind[];
const DS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const N = 120;
type MenuV = Extract<ContestVisual, { type: 'menu' }>;
type GridV = Extract<ContestVisual, { type: 'gridpath' }>;
type LineV = Extract<ContestVisual, { type: 'lineup' }>;

const texts = (q: Question) => [q.prompt, q.expression, q.hint, ...q.solutionSteps, ...q.explanation, q.readAloud ?? '', ...(q.choices ?? []).map((c) => c.label)];

/* ---------- brute-force counters ---------- */

/** Every way to take one name from each group. */
function combos(groups: { items: { name: string }[] }[]): string[][] {
  let out: string[][] = [[]];
  for (const g of groups) out = out.flatMap((c) => g.items.map((i) => [...c, i.name]));
  return out;
}
const menuSize = (v: MenuV) => combos(v.groups).length;
/** Every order of a list. */
function orders<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  const out: T[][] = [];
  xs.forEach((x, i) => { for (const rest of orders(xs.filter((_, j) => j !== i))) out.push([x, ...rest]); });
  return out;
}
/** Every route from (0,0) to (w,h), one step up or right at a time, avoiding blocked corners. */
function walk(w: number, h: number, blocked: [number, number][]): string[] {
  const bad = new Set(blocked.map(([x, y]) => `${x},${y}`));
  const out: string[] = [];
  const go = (x: number, y: number, path: string) => {
    if (bad.has(`${x},${y}`)) return;
    if (x === w && y === h) { out.push(path); return; }
    if (x < w) go(x + 1, y, `${path}R`);
    if (y < h) go(x, y + 1, `${path}U`);
  };
  go(0, 0, '');
  return out;
}
const WORD_TO_GROUP: Record<string, string> = { hat: 'Hats', shirt: 'Shirts', 'pair of shoes': 'Shoes', main: 'Mains', drink: 'Drinks', snack: 'Snacks', body: 'Bodies', gear: 'Gears', 'power source': 'Power', scoop: 'Scoops', topping: 'Toppings' };
/** How many combinations use a brand-new item added to the named group. */
function newItemCount(v: MenuV, word: string): number {
  const label = WORD_TO_GROUP[word]; expect(label, word).toBeTruthy();
  const g = v.groups.findIndex((x) => x.label === label); expect(g, `group ${label}`).toBeGreaterThanOrEqual(0);
  const more = v.groups.map((x, i) => (i === g ? { items: [...x.items, { name: '__new__' }] } : x));
  return combos(more).filter((c) => c.includes('__new__')).length;
}

function solveOutfits(q: Question): number {
  const v = q.visual as MenuV; expect(v.type).toBe('menu'); expect(v.tree).toBeFalsy();
  if (/Which closet/.test(q.prompt)) {
    const want = menuSize(v);
    const hits = q.choices!.filter((c) => (c.visual as MenuV).type === 'menu' && menuSize(c.visual as MenuV) === want);
    expect(hits, 'exactly one closet makes as many outfits').toHaveLength(1);
    return hits[0].value;
  }
  const made = /can make (\d+) different outfits/.exec(q.prompt);
  if (made) {
    const empty = v.groups.filter((g) => g.items.length === 0);
    expect(empty).toHaveLength(1);
    const known = combos(v.groups.filter((g) => g.items.length));
    const total = Number(made[1]);
    expect(total % known.length).toBe(0);
    // Try each possible size of the hidden group and keep the one that gives the total.
    const fits = [1, 2, 3, 4, 5, 6].filter((k) => known.length * k === total);
    expect(fits).toHaveLength(1);
    return fits[0];
  }
  const more = /gets 1 more (hat|shirt|pair of shoes)\./.exec(q.prompt);
  if (more) return newItemCount(v, more[1]);
  expect(/1 hat and 1 shirt|1 hat, 1 shirt and 1 pair of shoes/.test(q.prompt), q.prompt).toBe(true);
  return menuSize(v);
}

function solveMenus(q: Question): number {
  const v = q.visual as MenuV; expect(v.type).toBe('menu'); expect(v.tree).toBeFalsy();
  const names = v.groups.flatMap((g) => g.items.map((i) => i.name));
  expect(new Set(names).size, 'item names are unique').toBe(names.length);
  const all = combos(v.groups);
  if (/double sundae/.test(q.prompt)) {
    const scoops = v.groups.find((g) => g.label === 'Scoops')!.items; const tops = v.groups.find((g) => g.label === 'Toppings')!.items;
    const seen = new Set<string>();
    for (const a of scoops) for (const b of scoops) for (const t of tops) if (a !== b) seen.add(`${[a.name, b.name].sort().join('+')}|${t.name}`);
    return seen.size;
  }
  if (/either 1 drink or 1 snack/.test(q.prompt)) {
    const [mains, drinks, snacks] = v.groups.map((g) => g.items.map((i) => i.name));
    const deals = new Set<string>();
    for (const m of mains) { for (const d of drinks) deals.add(`${m}+${d}`); for (const s of snacks) deals.add(`${m}+${s}`); }
    return deals.size;
  }
  const rules = [...q.prompt.matchAll(/the ([a-z -]+?) never goes with the ([a-z -]+?)[,.]/g)].map((m) => [m[1], m[2]]);
  for (const [a, b] of rules) { expect(names).toContain(a); expect(names).toContain(b); }
  const but = /have the (.+?) but not the (.+?)\?/.exec(q.prompt);
  if (but) return all.filter((c) => c.includes(but[1]) && !c.includes(but[2])).length;
  const or = /have the (.+?) or the (.+?), or both\?/.exec(q.prompt);
  if (or) return all.filter((c) => c.includes(or[1]) || c.includes(or[2])).length;
  const more = /adds 1 more (main|drink|snack|body|gear|power source|scoop|topping)\./.exec(q.prompt);
  if (more) return newItemCount(v, more[1]);
  return all.filter((c) => rules.every(([a, b]) => !(c.includes(a) && c.includes(b)))).length;
}

function solveOrders(q: Question): number {
  const v = q.visual as LineV; expect(v.type).toBe('lineup'); expect(v.mode).toBe('row');
  const names = v.items.map((i) => i.name);
  expect(new Set(names).size).toBe(names.length);
  const places = v.places ?? [];
  if (/robots race/.test(q.prompt)) {
    expect(Number(/^(\d+) robots/.exec(q.prompt)![1])).toBe(names.length);
    const k = places.length; expect(places.slice(0, k)).toEqual(['Gold', 'Silver', 'Bronze'].slice(0, k));
    return new Set(orders(names).map((o) => o.slice(0, k).join(' '))).size;
  }
  expect(places).toHaveLength(names.length);
  for (const nm of names) expect(q.prompt).toContain(nm);
  const n = names.length; let all = orders(names);
  const fixed = /(\w+) must stand (first|last|in the middle|second)\./.exec(q.prompt);
  if (fixed) {
    const at = { first: 0, last: n - 1, 'in the middle': (n - 1) / 2, second: 1 }[fixed[2]]!;
    expect(Number.isInteger(at)).toBe(true);
    expect(v.fixed).toEqual([names.indexOf(fixed[1]), at]);
    all = all.filter((o) => o[at] === fixed[1]);
  }
  const pair = /(\w+) and (\w+) must (stand next to each other|not stand next to each other|stand at the two ends)/.exec(q.prompt);
  if (pair) {
    const [, a, b, rule] = pair;
    const gap = (o: string[]) => Math.abs(o.indexOf(a) - o.indexOf(b));
    if (rule === 'stand next to each other') {
      all = all.filter((o) => gap(o) === 1);
      expect([...v.together!].map((i) => names[i]).sort()).toEqual([a, b].sort());
      expect(Math.abs(v.together![0] - v.together![1])).toBe(1);
    } else if (rule === 'not stand next to each other') all = all.filter((o) => gap(o) !== 1);
    else all = all.filter((o) => [o[0], o[n - 1]].sort().join() === [a, b].sort().join());
  }
  if (!pair) expect(v.together).toBeUndefined();
  if (!fixed) expect(v.fixed).toBeUndefined();
  return all.length;
}

function solveGrid(q: Question): number {
  const v = q.visual as GridV; expect(v.type).toBe('gridpath'); expect(v.counts).toBeFalsy();
  const blocked = v.blocked ?? [];
  for (const [x, y] of blocked) {
    expect(x >= 0 && x <= v.w && y >= 0 && y <= v.h).toBe(true);
    expect((x === 0 && y === 0) || (x === v.w && y === v.h)).toBe(false);
  }
  expect(blocked.length > 0).toBe(/✕/.test(q.prompt));
  if (v.path) {
    // The example route is a real one: starts at Start, ends at Finish, one step up or right at a time, no ✕.
    expect(v.path[0]).toEqual([0, 0]); expect(v.path[v.path.length - 1]).toEqual([v.w, v.h]);
    v.path.slice(1).forEach(([x, y], i) => { const [px, py] = v.path![i]; expect((x - px) + (y - py)).toBe(1); expect(x >= px && y >= py).toBe(true); });
  }
  const s = q.solutionVisual as GridV;
  expect(s).toMatchObject({ type: 'gridpath', w: v.w, h: v.h, counts: true });
  expect(s.blocked ?? []).toEqual(blocked);
  return walk(v.w, v.h, blocked).length;
}

function solvePairs(q: Question): number {
  const v = q.visual as LineV; expect(v.type).toBe('lineup'); expect(v.mode).toBe('pairs'); expect(v.lines).toBeFalsy();
  const names = v.items.map((i) => i.name); expect(new Set(names).size).toBe(names.length);
  const pairs: [string, string][] = [];
  names.forEach((a, i) => names.forEach((b, j) => { if (i < j) pairs.push([a, b]); }));
  const n = Number(/^(\d+) /.exec(q.prompt)?.[1] ?? /these (\d+) /.exec(q.prompt)?.[1]);
  if (/arrives late/.test(q.prompt)) {
    expect(n).toBe(names.length - 1);
    expect(q.prompt).toContain(`Then ${names[names.length - 1]} arrives late`);
    // The picture marks the latecomer (drawn outside the circle), so the circle shows the n friends of the prompt.
    expect(v.late, 'the late friend is marked in the picture').toBe(names.length - 1);
    return pairs.length;
  }
  expect(v.late).toBeUndefined();
  expect(n).toBe(names.length);
  if (/twice/.test(q.prompt)) return pairs.flatMap((p) => [[...p, 'home'], [...p, 'away']]).length;
  const skip = /(\w+) and (\w+) already shook hands this morning, so they skip each other\. Every other pair shakes hands once at the club\. How many handshakes happen at the club\?/.exec(q.prompt);
  if (skip) {
    // The skipped pair is the one the picture crosses out.
    expect(v.skip, 'the skipped pair is marked in the picture').toBeTruthy();
    expect(v.skip!.map((i) => names[i]).sort()).toEqual([skip[1], skip[2]].sort());
    return pairs.filter(([a, b]) => [a, b].sort().join() !== [skip[1], skip[2]].sort().join()).length;
  }
  expect(q.prompt, 'no other handshake wording').not.toMatch(/already shook|skip/);
  expect(v.skip).toBeUndefined();
  return pairs.length;
}

const SOLVE: Record<Kind, (q: Question) => number> = { outfits: solveOutfits, menus: solveMenus, orders: solveOrders, grid: solveGrid, pairs: solvePairs };

/* ---------- checks ---------- */

const LABEL_OK = /^[A-Za-z][A-Za-z ',/-]*[A-Za-z]$/;
function checkLabels(s: string) {
  const after = [...s.matchAll(/(?:\d|\?) \(([^)]*)\)/g)];
  for (const m of after) expect(LABEL_OK.test(m[1]), `bad label "(${m[1]})" in: ${s}`).toBe(true);
  expect([...s.matchAll(new RegExp(LABELED.source, 'g'))].length, s).toBe(after.length);
}
/** Words per sentence (maths signs such as + and = are not words). */
const words = (s: string) => s.split(/[.?!]/).map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length);

describe('Counting Paths questions', () => {
  for (const kind of KINDS) for (const d of DS) {
    it(`${kind} at difficulty ${d}: right answers, fair choices, grade caps, labels`, () => {
      const r = createRng(1000 * d + kind.length);
      const g = gradeOf(d); const inBand = PATHS_KIND_GRADES[kind].includes(g);
      for (let i = 0; i < N; i++) {
        const q = pathsQuestion(kind, d, r);
        const where = `${kind} d${d} #${i}: ${q.prompt}`;
        expect(q.topic).toBe(PATHS_META.topic);
        expect(q.masterySkillId).toBe(`paths.${kind}`);
        expect(q.visualFirst).toBe(true);
        expect(q.difficulty).toBe(d);
        expect(Number.isInteger(q.answer) && q.answer > 0, where).toBe(true);
        expect(checkAnswer(q, String(q.answer)), where).toBe(true);
        for (const t of texts(q)) { expect(t, where).not.toMatch(/undefined|NaN|AMC|\[object/); checkLabels(t); }
        expect(q.hint.length).toBeGreaterThan(10);
        expect(q.solutionSteps.length).toBeGreaterThan(0);
        expect(q.explanation.length).toBeGreaterThan(0);
        expect(q.solutionSteps.flatMap(arithmeticSlips), where).toEqual([]);

        // The answer, counted again by brute force
        expect(SOLVE[kind](q), where).toBe(q.answer);

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
          } else {
            q.choices.forEach((c) => { expect(c.label).toBe(String(c.value)); expect(c.value).toBeGreaterThan(0); });
          }
        }
        // The question picture never shows the answer; the worked picture is the same kind of picture
        const v = q.visual as ContestVisual;
        if (v.type === 'menu') expect(v.tree).toBeFalsy();
        if (v.type === 'gridpath') expect(v.counts).toBeFalsy();
        if (v.type === 'lineup') expect(v.lines).toBeFalsy();
        if (q.solutionVisual) expect(q.solutionVisual.type).toBe(q.visual.type);
        // A numeric answer is labelled in the working, and a big one is not given away in the hint
        if (!q.choices?.some((c) => c.visual)) expect(q.solutionSteps.join(' '), where).toMatch(new RegExp(`\\b${q.answer} \\(`));
        if (q.answer >= 10 && !q.choices?.some((c) => c.visual)) expect(q.hint, where).not.toMatch(new RegExp(`\\b${q.answer}\\b`));

        // Grade fit
        if (inBand) expect(violatesCaps(g, { ...q, game: 'paths' }), where).toBeNull();
        if (g === 'g1' && inBand) {
          expect(q.choices, where).toBeTruthy();
          expect(q.readAloud, where).toBeTruthy();
          const nums = [...texts(q).join(' ').matchAll(/\d+/g)].map((m) => Number(m[0]));
          expect(Math.max(0, ...nums), where).toBeLessThanOrEqual(20);
          for (const t of [q.prompt, q.readAloud!, ...q.solutionSteps]) for (const w of words(t)) expect(w, t).toBeLessThanOrEqual(12);
          expect(texts(q).join(' ')).not.toMatch(/%|percent|×/i);
        }
        if (g === 'g3' && inBand) {
          const nums = [...texts(q).join(' ').matchAll(/\d+/g)].map((m) => Number(m[0]));
          expect(Math.max(0, ...nums), where).toBeLessThanOrEqual(1000);
          for (const w of words(q.prompt)) expect(w, q.prompt).toBeLessThanOrEqual(22);
        }
      }
    });
  }

  it('is deterministic for a seed, and Mixed only picks kinds that suit the grade', () => {
    for (const d of DS) {
      const a = pathsQuestion('all', d, createRng(7)); const b = pathsQuestion('all', d, createRng(7));
      expect({ ...a, id: '' }).toEqual({ ...b, id: '' });
      for (const k of KINDS) {
        const x = pathsQuestion(k, d, createRng(11)); const y = pathsQuestion(k, d, createRng(11));
        expect({ ...x, id: '' }).toEqual({ ...y, id: '' });
      }
      const r = createRng(d);
      for (let i = 0; i < 60; i++) {
        const q = pathsQuestion('all', d, r);
        expect(q.masterySkillId).toBe('paths');
        const kind = PATHS_KINDS.find((k) => k.label === q.subtopic)!.id as Kind;
        expect(PATHS_KIND_GRADES[kind].includes(gradeOf(d)), `${kind} at d${d}`).toBe(true);
      }
    }
    expect(pathsQuestion('grid', 3, createRng(1), 'paths.custom').masterySkillId).toBe('paths.custom');
    expect(PICTURE_GAMES.paths.lessons.length).toBe(PATHS_LESSONS.length);
    expect(PICTURE_GAMES.paths.topic).toBe(PATHS_META.topic);
  });

  it('meets each grade: Grade 1 lists and taps, Grade 3 lists line-ups and short routes, Grade 5 reaches rules, blocks and pairs', () => {
    const r = createRng(42);
    const many = (k: Kind, d: Difficulty) => Array.from({ length: 150 }, () => pathsQuestion(k, d, r));
    // Grade 1: only 2 × 2, 2 × 3 and 3 × 2 closets; picture choices sometimes
    const g1 = [...many('outfits', 1), ...many('outfits', 2)];
    for (const q of g1) for (const c of (q.visual as MenuV).groups) expect(c.items.length).toBeLessThanOrEqual(3);
    expect(g1.filter((q) => !/closet/.test(q.prompt)).every((q) => [4, 6].includes(q.answer))).toBe(true);
    expect(g1.some((q) => q.choices?.some((c) => c.visual))).toBe(true);
    // Grade 3: three groups, a missing group, 3 friends listed, 1 × 2 and 2 × 2 grids with 3 and 6 routes
    const o3 = many('outfits', 4);
    expect(o3.some((q) => (q.visual as MenuV).groups.length === 3 && /How many different outfits/.test(q.prompt))).toBe(true);
    expect(o3.some((q) => (q.visual as MenuV).groups.some((x) => x.items.length === 0))).toBe(true);
    const ord3 = many('orders', 3);
    expect(ord3.some((q) => q.answer === 6 && q.solutionSteps.some((s) => /first: \w+, \w+, \w+ or/.test(s)))).toBe(true);
    const grid3 = [...many('grid', 3), ...many('grid', 4)];
    expect(new Set(grid3.map((q) => q.answer))).toEqual(new Set([3, 4, 6, 10]));
    expect(grid3.some((q) => q.solutionSteps.some((s) => /^List them: /.test(s)))).toBe(true);
    // Grade 5: rules (with inclusion–exclusion), blocks of friends, blocked corners, handshakes up to 12 people
    const m5 = [...many('menus', 5), ...many('menus', 6)];
    for (const re of [/never goes with/, /, and the .* never goes with/, /but not/, /or both/, /double sundae/, /adds 1 more/]) expect(m5.some((q) => re.test(q.prompt)), String(re)).toBe(true);
    const o5 = [...many('orders', 5), ...many('orders', 6)];
    for (const re of [/next to each other/, /not stand next/, /two ends/, /must stand/, /gold, silver and bronze/]) expect(o5.some((q) => re.test(q.prompt)), String(re)).toBe(true);
    const g5 = [...many('grid', 5), ...many('grid', 6)];
    expect(g5.some((q) => ((q.visual as GridV).blocked ?? []).length === 1)).toBe(true);
    expect(g5.some((q) => ((q.visual as GridV).blocked ?? []).length === 2)).toBe(true);
    expect(g5.every((q) => (q.visual as GridV).w <= 4 && (q.visual as GridV).h <= 3)).toBe(true);
    const p5 = [...many('pairs', 5), ...many('pairs', 6)];
    for (const re of [/shakes hands/, /plays every other team once/, /twice/, /teams of 2/, /stars/, /arrives late/, /already shook hands/]) expect(p5.some((q) => re.test(q.prompt)), String(re)).toBe(true);
    // Worked pictures: trees for small menus, ways in every corner, every pair joined
    expect(g1.every((q) => (q.solutionVisual as MenuV).tree)).toBe(true);
    expect(p5.filter((q) => q.solutionVisual).every((q) => (q.solutionVisual as LineV).lines)).toBe(true);
  });

  it('maps a kind to the nearest grade it suits instead of failing', () => {
    for (const d of DS) for (const k of KINDS) {
      const q = pathsQuestion(k, d, createRng(3));
      expect(q.difficulty).toBe(d);
      expect(SOLVE[k](q)).toBe(q.answer);
    }
    // Pairs is Grade 5 only: asked at Grade 1 it still gives a Grade 5 handshake question.
    expect(pathsQuestion('pairs', 1, createRng(5)).visual.type).toBe('lineup');
    // Outfits has no Grade 5 band: it plays the Grade 3 version (three groups or the missing group).
    expect(pathsQuestion('outfits', 6, createRng(5)).prompt).toMatch(/pair of shoes|pairs of shoes/);
  });
});

/** Rank of the right answer among the number choices, smallest = 1. */
const rankOf = (q: Question) => [...q.choices!.map((c) => c.value)].sort((a, b) => a - b).indexOf(q.answer) + 1;

describe('Counting Paths: review fixes stay fixed', () => {
  const sample = (k: Kind, d: Difficulty, count: number, seed: number) => { const r = createRng(seed); return Array.from({ length: count }, () => pathsQuestion(k, d, r)); };

  it('a handshake skipped this morning: the question asks only about the club, and the picture crosses out that pair', () => {
    const qs = sample('pairs', 6, 700, 21).filter((q) => /already shook hands/.test(q.prompt));
    expect(qs.length).toBeGreaterThan(30);
    for (const q of qs) {
      expect(q.prompt).not.toMatch(/\bexcept\b|\bnow\b/);
      expect(q.prompt).toMatch(/How many handshakes happen at the club\?$/);
      const v = q.visual as LineV; const n = v.items.length;
      expect(q.answer).toBe((n * (n - 1)) / 2 - 1);
      expect((q.solutionVisual as LineV).skip).toEqual(v.skip);
    }
    // A late friend stands outside the circle in the question picture and in the worked picture.
    const late = sample('pairs', 6, 700, 22).filter((q) => /arrives late/.test(q.prompt));
    expect(late.length).toBeGreaterThan(30);
    for (const q of late) {
      const v = q.visual as LineV;
      expect(v.late).toBe(v.items.length - 1);
      expect((q.solutionVisual as LineV).late).toBe(v.late);
    }
  });

  it('three medals: every outcome listed in the working names gold, silver and bronze, and so does the hint', () => {
    const qs = sample('orders', 6, 500, 23).filter((q) => /gold, silver and bronze/.test(q.prompt));
    expect(qs.length).toBeGreaterThan(20);
    for (const q of qs) {
      const listed = q.solutionSteps[0].replace(/^List a few: /, '').replace(/\..*$/, '').split('; ');
      expect(listed.length).toBeGreaterThanOrEqual(2);
      for (const l of listed) expect(l).toMatch(/^gold \w+, silver \w+, bronze \w+$/);
      expect(new Set(listed).size).toBe(listed.length);
      expect(q.hint).toMatch(/bronze/);
    }
  });

  it('every number in the worked steps carries a label (corner sums, count-downs, line-ups)', () => {
    for (const k of KINDS) for (const d of DS) for (const q of sample(k, d, 150, 24 + d)) {
      for (const s of q.solutionSteps) {
        const body = s.replace(/^(Bottom street|Street \d up):/, '');
        const bare = [...body.matchAll(/(?<!\d)\d+(?!\d)(?! \()/g)].map((m) => m[0]);
        expect(bare, `${k} d${d}: ${s}`).toEqual([]);
      }
    }
  });

  it('Grade 5 blocked corners always need the corner-by-corner adding', () => {
    const qs = [...sample('grid', 5, 400, 25), ...sample('grid', 6, 400, 26)].filter((q) => (q.visual as GridV).blocked?.length);
    expect(qs.length).toBeGreaterThan(200);
    for (const q of qs) {
      const v = q.visual as GridV; const blocked = v.blocked!;
      for (const [x, y] of blocked) {
        // Never a far corner (top-left or bottom-right): a ✕ there only takes away 1 route.
        expect((x === 0 && y === v.h) || (x === v.w && y === 0), `${v.w}x${v.h} ✕ at ${x},${y}`).toBe(false);
        // Each ✕ takes away at least 2 routes, given the others.
        const without = walk(v.w, v.h, blocked.filter(([bx, by]) => bx !== x || by !== y)).length;
        expect(without - q.answer, `${v.w}x${v.h} ✕ at ${x},${y}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('Grade 1 number choices always include a real mistake, not only near misses', () => {
    const qs = [...sample('outfits', 1, 400, 27), ...sample('outfits', 2, 400, 28)].filter((q) => q.choices && !q.choices.some((c) => c.visual));
    expect(qs.length).toBeGreaterThan(500);
    let twoByTwo = 0;
    for (const q of qs) {
      const [a, b] = (q.visual as MenuV).groups.map((g) => g.items.length);
      // Counted one group only (a or b), added (a + b), counted each outfit twice (2 × answer), or counted the hats
      // and/or the shirts of the tree as outfits too (answer + a, answer + b, answer + a + b).
      const real = [a, b, a + b, 2 * q.answer, q.answer + a, q.answer + b, q.answer + a + b].filter((x) => x !== q.answer);
      expect(q.choices!.some((c) => real.includes(c.value)), `${a}x${b}: ${q.choices!.map((c) => c.value)}`).toBe(true);
      if (a === 2 && b === 2) twoByTwo++;
    }
    expect(twoByTwo).toBeGreaterThan(20);
  });

  it('the right answer does not sit in a fixed place by size among the number choices', () => {
    for (const k of KINDS) for (const d of DS) {
      const qs = sample(k, d, 400, 29 + d).filter((q) => q.choices && !q.choices.some((c) => c.visual));
      if (qs.length < 60) continue;
      const counts = new Map<number, number>();
      for (const q of qs) counts.set(rankOf(q), (counts.get(rankOf(q)) ?? 0) + 1);
      const most = Math.max(...counts.values());
      expect(counts.size, `${k} d${d} ranks ${JSON.stringify([...counts])}`).toBeGreaterThanOrEqual(3);
      expect(most / qs.length, `${k} d${d} ranks ${JSON.stringify([...counts])}`).toBeLessThanOrEqual(0.5);
    }
  });

  /** Number-choice questions of one kind and difficulty, each with how its choices were built. */
  const built = (k: Kind, d: Difficulty, count: number, seed: number) => {
    const out: { q: Question; b: PathsChoiceBuild }[] = [];
    let last: PathsChoiceBuild | undefined;
    watchPathsChoices((b) => { last = b; });
    try {
      const r = createRng(seed);
      for (let i = 0; i < count; i++) {
        last = undefined;
        const q = pathsQuestion(k, d, r);
        if (!q.choices || q.choices.some((c) => c.visual)) { expect(last).toBeUndefined(); continue; }
        out.push({ q, b: last! });
      }
    } finally { watchPathsChoices(); }
    return out;
  };
  const runOf = (vals: number[]) => { const V = new Set(vals); let best = 0; for (const v of V) if (!V.has(v - 1)) { let n = 1; while (V.has(v + n)) n++; best = Math.max(best, n); } return best; };

  it('every wrong option is one of the question\'s real mistakes: no near-miss fillers, no runs of numbers in a row', () => {
    for (const k of KINDS) for (const d of DS) {
      const qs = built(k, d, 300, 50 + d);
      let sig = 0; let sigN = 0;
      for (const { q, b } of qs) {
        const vals = q.choices!.map((c) => c.value); const where = `${k} d${d}: ${q.prompt} ${vals}`;
        expect(b.answer).toBe(q.answer);
        expect([...vals].sort((x, y) => x - y), where).toEqual([q.answer, ...b.picked].sort((x, y) => x - y));
        expect(b.fillers, where).toEqual([]);
        for (const v of b.picked) expect(b.real, where).toContain(v);
        // Never 4 numbers in a row, or all 3 of 3 choices (a run like 3, 4, 5, 6 can be answered without counting).
        expect(runOf(vals), where).toBeLessThan(Math.min(4, vals.length));
        if (b.signature !== undefined) { sigN++; if (vals.includes(b.signature)) sig++; }
      }
      // The kind's signature mistake is offered often (in most sets for handshakes and blocked grids: see the next test).
      if (sigN >= 50) expect(sig / sigN, `${k} d${d} signature in ${sig}/${sigN}`).toBeGreaterThanOrEqual(0.4);
    }
  });

  it('handshake and blocked-grid options are mistakes a child really makes, and the signature mistake is usually there', () => {
    // Handshakes, games, teams of 2, lines between dots: each wrong option is a known slip, worked out here from n.
    let sig = 0; let half = 0; let tot = 0;
    for (const d of [5, 6] as Difficulty[]) for (const { q } of built('pairs', d, 700, 60 + d)) {
      if (/twice|arrives late|already shook/.test(q.prompt)) continue;
      const n = (q.visual as LineV).items.length; const c2 = (m: number) => (m * (m - 1)) / 2; const ans = c2(n);
      expect(q.answer).toBe(ans);
      // Forgot to halve; one too many or too few in the count-down; shook their own hand (then halved, or not); one too
      // many and forgot to halve; one too few and forgot to halve; only the first friend's (or the first two friends',
      // with or without their own handshake counted twice); one each; missed one or counted one twice.
      const slips = new Set([n * (n - 1), c2(n + 1), c2(n - 1), n * n, n * n / 2, n * (n + 1), (n - 1) * (n - 2), n - 1, 2 * n - 3, 2 * (n - 1), n, ans - 1, ans + 1]);
      const vals = q.choices!.map((c) => c.value);
      for (const v of vals) if (v !== ans) expect(slips.has(v), `${n} people: ${vals}`).toBe(true);
      tot++; if (vals.includes(n * (n - 1))) sig++;
      const doubled = vals.filter((v) => vals.includes(2 * v)); if (doubled.includes(ans)) half += 1 / doubled.length; else if (!doubled.length) half += 1 / vals.length;
    }
    expect(tot).toBeGreaterThan(300);
    expect(sig / tot, 'forgot to halve is offered in most sets').toBeGreaterThanOrEqual(0.5);
    expect(half / tot, '"tap the one whose double is offered" is not a shortcut').toBeLessThanOrEqual(0.4);

    // Blocked street grids: each wrong option is a slip in the corner method, worked out here by walking every route.
    sig = 0; tot = 0;
    for (const d of [5, 6] as Difficulty[]) for (const { q } of built('grid', d, 700, 62 + d)) {
      const v = q.visual as GridV; const blocked = v.blocked ?? [];
      if (!blocked.length) continue;
      const open = walk(v.w, v.h, []).length;
      // A ✕ written as 1 instead of 0 (the corner adding redone here).
      const asOne = (() => {
        const c: number[][] = Array.from({ length: v.h + 1 }, () => Array(v.w + 1).fill(0));
        for (let y = 0; y <= v.h; y++) for (let x = 0; x <= v.w; x++) c[y][x] = (x === 0 && y === 0) || blocked.some(([bx, by]) => bx === x && by === y) ? 1 : (y ? c[y - 1][x] : 0) + (x ? c[y][x - 1] : 0);
        return c[v.h][v.w];
      })();
      const slips = new Set([open, open - blocked.length, open - q.answer, asOne, walk(v.w - 1, v.h, blocked).length, walk(v.w, v.h - 1, blocked).length, v.w * v.h, q.answer - 1, q.answer + 1,
        ...(blocked.length === 2 ? blocked.map((b) => walk(v.w, v.h, blocked.filter((x) => x !== b)).length) : [])]);
      const vals = q.choices!.map((c) => c.value);
      for (const x of vals) if (x !== q.answer) expect(slips.has(x), `${v.w}x${v.h} ✕ ${JSON.stringify(blocked)}: ${vals}`).toBe(true);
      tot++; if (vals.includes(open)) sig++;
    }
    expect(tot).toBeGreaterThan(300);
    expect(sig / tot, 'forgot the ✕ is offered in most sets').toBeGreaterThanOrEqual(0.5);
  });

  it('no shortcut finds the answer much more often than a guess', () => {
    const SPOT: Record<string, (vals: number[]) => number[]> = {
      'the one whose double is offered': (vals) => vals.filter((v) => vals.includes(2 * v)),
      'the double of another': (vals) => vals.filter((v) => vals.includes(v / 2)),
      'one next to another': (vals) => vals.filter((v) => vals.includes(v - 1) || vals.includes(v + 1)),
      'the middle of three in a row': (vals) => vals.filter((v) => vals.includes(v - 1) && vals.includes(v + 1)),
      'the one with the most close neighbours': (vals) => { const sc = vals.map((v) => vals.filter((w) => w !== v && Math.abs(w - v) <= 2).length); return vals.filter((_, i) => sc[i] === Math.max(...sc)); },
    };
    for (const k of KINDS) for (const d of DS) {
      const qs = built(k, d, 500, 70 + d);
      if (qs.length < 100) continue;
      const guess = qs.reduce((s, { q }) => s + 1 / q.choices!.length, 0) / qs.length;
      for (const [name, spot] of Object.entries(SPOT)) {
        let hit = 0;
        for (const { q } of qs) { const vals = q.choices!.map((c) => c.value); const p = spot(vals); hit += p.length ? (p.includes(q.answer) ? 1 / p.length : 0) : 1 / vals.length; }
        expect(hit / qs.length, `${k} d${d}: ${name}`).toBeLessThanOrEqual(guess + 0.2);
      }
    }
  });

  it('Grade 3: a 2 × 2 menu is rare, and 1 × 2 street grids offer real slips, not a run of numbers', () => {
    const two = sample('menus', 3, 800, 90).filter((q) => (q.visual as MenuV).groups.length === 2);
    const small = two.filter((q) => (q.visual as MenuV).groups.every((g) => g.items.length === 2));
    expect(two.length).toBeGreaterThan(200);
    expect(small.length / two.length).toBeLessThanOrEqual(0.12);
    for (const q of small.filter((x) => x.choices)) {
      // One group only (2), a row too many (6) or every lunch counted twice (8); never 2 + 2, which is the answer.
      expect(q.choices!.some((c) => [2, 6, 8].includes(c.value)), q.choices!.map((c) => c.value).join()).toBe(true);
    }
    const grids = sample('grid', 3, 600, 91).filter((q) => q.choices && q.answer === 3);
    expect(grids.length).toBeGreaterThan(50);
    for (const q of grids) {
      const vals = q.choices!.map((c) => c.value);
      // Only the straight routes (2), the corners (6), 2 ways at every move (8), one corner early (1 or 2), off by one (4).
      for (const v of vals) if (v !== 3) expect([1, 2, 4, 6, 8], vals.join()).toContain(v);
      expect(runOf(vals)).toBeLessThan(4);
    }
  });

  it('people in a picture never look alike: a row has no repeated colour, neighbours round a circle never match', () => {
    for (const d of DS) {
      for (const q of sample('orders', d, 200, 30 + d)) {
        const v = q.visual as LineV;
        const looks = v.items.map((i) => `${i.icon}/${i.color ?? 'plain'}`);
        expect(new Set(looks).size, looks.join(' ')).toBe(looks.length);
      }
      for (const q of sample('pairs', d, 200, 40 + d)) {
        const v = q.visual as LineV;
        const ring = v.items.filter((_, i) => i !== v.late);
        if (new Set(ring.map((i) => i.color)).size === 1) continue; // stars: all alike on purpose, named by letter
        ring.forEach((it, i) => expect(it.color, `${ring.map((x) => x.color).join(' ')}`).not.toBe(ring[(i + 1) % ring.length].color));
      }
    }
  });

  it('pictures mark what the rule names: apart, the two ends, banned menu pairs, "but not" and "or"', () => {
    for (const q of sample('orders', 6, 500, 31)) {
      const v = q.visual as LineV; const names = v.items.map((i) => i.name);
      const m = /(\w+) and (\w+) must (not stand next to each other|stand at the two ends)/.exec(q.prompt);
      if (!m) { expect(v.apart).toBeUndefined(); expect(v.mark).toBeUndefined(); continue; }
      const named = [m[1], m[2]].sort();
      expect(v.mark!.map((i) => names[i]).sort()).toEqual(named);
      if (m[3].startsWith('not')) {
        expect(v.apart!.map((i) => names[i]).sort()).toEqual(named);
        // Drawn apart, so the picture never shows them side by side.
        expect(Math.abs(v.apart![0] - v.apart![1])).toBeGreaterThanOrEqual(2);
      } else expect(v.apart).toBeUndefined();
    }
    for (const q of [...sample('menus', 5, 400, 32), ...sample('menus', 6, 400, 33)]) {
      const v = q.visual as MenuV;
      const rules = [...q.prompt.matchAll(/the ([a-z -]+?) never goes with the ([a-z -]+?)[,.]/g)].map((m) => [m[1], m[2]]);
      expect(v.bans ?? []).toEqual(rules);
      const but = /have the (.+?) but not the (.+?)\?/.exec(q.prompt);
      const or = /have the (.+?) or the (.+?), or both\?/.exec(q.prompt);
      expect(v.marks ?? []).toEqual(but ? [but[1]] : or ? [or[1], or[2]] : []);
      expect(v.crossed ?? []).toEqual(but ? [but[2]] : []);
    }
  });
});

describe('Counting Paths lessons', () => {
  it('teach on a picture, then try real kinds at a sensible difficulty, then sum up', () => {
    expect(PATHS_LESSONS.length).toBeGreaterThanOrEqual(2);
    const grades = new Set<GradeId>();
    PATHS_LESSONS.forEach((l, i) => {
      expect(l.id).toBe(`l.paths-${i + 1}`);
      expect(l.group).toBe('Counting Paths');
      expect(['vector', 'newton']).toContain(l.teacher);
      expect(KINDS).toContain(l.skillId.replace(/^paths\./, '') as Kind);
      const firstTry = l.steps.findIndex((s) => s.type === 'try');
      expect(firstTry).toBeGreaterThan(0);
      expect(l.steps.slice(0, firstTry).some((s) => s.type === 'say' && s.visual && s.caption)).toBe(true);
      expect(l.steps[l.steps.length - 1].type).toBe('summary');
      for (const s of l.steps) {
        expect(['vector', 'newton']).toContain(s.speaker);
        if (s.type === 'say') {
          checkLabels(s.text); expect(arithmeticSlips(s.text), s.text).toEqual([]);
          expect(s.text).not.toMatch(/AMC|undefined|NaN/);
          // A worked street grid: the routes the text gives Finish are the real count.
          const v = s.visual as ContestVisual | undefined;
          if (v?.type === 'gridpath' && v.counts) {
            const m = /= (\d+) \(routes\)/.exec(s.text)!; expect(m, s.text).toBeTruthy();
            expect(Number(m[1])).toBe(walk(v.w, v.h, v.blocked ?? []).length);
          }
          if (v?.type === 'menu' && v.tree) expect(s.text).toContain(`= ${menuSize(v)} (outfits)`);
          if (v?.type === 'lineup' && v.lines) expect(s.text).toContain(`= ${(v.items.length * (v.items.length - 1)) / 2} (handshakes)`);
        }
        if (s.type === 'try') {
          const kind = s.skillId.replace(/^paths\./, '') as Kind;
          expect(KINDS).toContain(kind);
          expect(PATHS_KIND_GRADES[kind].includes(gradeOf(s.difficulty)), `${l.id} tries ${kind} at d${s.difficulty}`).toBe(true);
          expect(s.count).toBeGreaterThanOrEqual(3); expect(s.count).toBeLessThanOrEqual(4);
          grades.add(gradeOf(s.difficulty));
        }
      }
    });
    expect(grades.has('g1') || grades.has('g3')).toBe(true);
    expect(grades.has('g5')).toBe(true);
  });
});
