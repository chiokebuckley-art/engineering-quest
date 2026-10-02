import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Difficulty, Question } from '../types';
import type { ContestVisual } from '../contest/visuals';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { gradeOf, GRADE_DIFFICULTY, type GradeId } from '../contest/common';
import { violatesCaps, CONTEST_KIND_GRADES } from '../contest/grades';
import { LABELED } from '../label';
import { arithmeticSlips } from '../academy/teachMath';
import { STORY_KIND_IDS, STORY_KIND_GRADES, STORY_META, storyQuestion, type StoryKind } from '../contest/stories';
import { buildSession, buildPreview, kindAllowed, drawCapped, SESSION_SHAPE, REST_SHAPE, KIND_CAP, GAME_CAP, YOUNG_PREVIEW_MAX, startContest, PREVIEW_ITEMS, G3_CLOCK_ITEMS, spokenQuestion, THEME_POOLS, speakable, teachCard } from '../contest/track';
import { buildMock, mockBars, isFractionPie, MOCK_BLUEPRINT, MOCK_SIZE } from '../contest/mock';
import { DAY_THEMES, themeForDay, weekPlan, weekSummary, weekStart, weakSpots, PARENT_CHECKLIST, FOCUS } from '../contest/plan';
import { initialContest, migrateContest, type ContestHistoryEntry, type ContestState } from '../contest/state';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import type { GameState } from '../state/types';
import type { Action } from '../state/actions';
import { ContestTrackScreen } from '../../game/screens/ContestTrackScreen';

/**
 * The screen is rendered to static markup (no browser) with a stand-in store and a stand-in voice, so its tests can
 * check what the child sees: the order of the clock buttons, the teach card's speaker, the hub while a run waits.
 */
const ui = vi.hoisted(() => ({ state: null as unknown, spoken: [] as string[] }));
vi.mock('../../game/store', () => ({ useGame: () => ({ state: ui.state, dispatch: () => {}, play: () => {} }) }));
vi.mock('../../game/speech', () => ({
  canSpeak: () => true, speak: (t: string) => { ui.spoken.push(t); }, stopSpeaking: () => {}, sayText: (t: string) => t,
}));

/**
 * Contest Path track shell: picture stories (every kind × every difficulty, answers worked out again from the picture
 * and the story), sessions for every grade and day (grade caps, sizes, sections, determinism), the mini-mock blueprint,
 * the run engine through the real reducer (retries, teach card, consent clock, Skip & come back, history, reload) and the
 * parent plan.
 */
const DS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const GRADES: GradeId[] = ['g1', 'g3', 'g5'];
const N = 120;
type Obj = Extract<ContestVisual, { type: 'objects' }>;

const texts = (q: Question) => [q.prompt, q.expression, q.hint, ...q.solutionSteps, ...q.explanation, q.readAloud ?? '', ...(q.choices ?? []).map((c) => c.label)];
const LABEL_OK = /^[A-Za-z][A-Za-z ',/-]*[A-Za-z]$/;
function checkLabels(s: string) {
  const after = [...s.matchAll(/(?:\d|\?) \(([^)]*)\)/g)];
  for (const m of after) expect(LABEL_OK.test(m[1]), `bad label "(${m[1]})" in: ${s}`).toBe(true);
  expect([...s.matchAll(new RegExp(LABELED.source, 'g'))].length, s).toBe(after.length);
}
const words = (s: string) => s.split(/[.?!]/).map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length);
const ints = (s: string) => [...s.matchAll(/\d+/g)].map((m) => Number(m[0]));
const allNumbers = (q: Question) => texts(q).flatMap((t) => [...t.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, ''))));

/* ------------------------------------------------------------------ */
/* Picture stories                                                     */
/* ------------------------------------------------------------------ */

/** The answer worked out again from the story's numbers and the picture (no shared code with the generator). */
function solveStory(kind: StoryKind, q: Question): number {
  const v = q.visual as Obj;
  expect(v.type).toBe('objects');
  const n = ints(q.prompt);
  const count = (f: (g: Obj['groups'][number]) => boolean) => v.groups.filter(f).reduce((s, g) => s + g.n, 0);
  switch (kind) {
    case 'join': {
      const [a, b] = n; expect(count(() => true)).toBe(a + b); expect(count((g) => !!g.arriving)).toBe(b);
      return a + b;
    }
    case 'leave': {
      const [a, b] = n; expect(count(() => true)).toBe(a); expect(count((g) => !!g.leaving)).toBe(b);
      return count((g) => !g.leaving);
    }
    case 'compare': {
      const [x, y] = n; expect(v.groups.map((g) => g.n)).toEqual([x, y]);
      return Math.abs(x - y);
    }
    case 'parts': {
      const [total, seen] = n; expect(count((g) => !g.hidden)).toBe(seen); expect(v.groups.some((g) => g.hidden)).toBe(true);
      return total - seen;
    }
    case 'match': {
      const [a, b] = n;
      const right = (q.choices ?? []).filter((c) => (c.visual as Obj | undefined)?.groups.reduce((s, g) => s + g.n, 0) === a + b);
      expect(right, q.prompt).toHaveLength(1);
      return right[0].value;
    }
  }
}

describe('Picture stories', () => {
  for (const kind of STORY_KIND_IDS) for (const d of DS) {
    it(`${kind} at difficulty ${d}: right answers, fair tap choices, Grade 1 caps, labels`, () => {
      const r = createRng(700 + 13 * d + kind.length);
      const seen = new Set<string>();
      for (let i = 0; i < N; i++) {
        const q = storyQuestion(kind, d, r);
        const where = `${kind} d${d} #${i}: ${q.prompt}`;
        seen.add(q.prompt);
        expect(q.topic).toBe(STORY_META.topic);
        expect(q.masterySkillId).toBe(`stories.${kind}`);
        expect(q.visualFirst).toBe(true);
        expect(q.difficulty).toBe(d);
        expect(q.readAloud, where).toBeTruthy();
        expect(checkAnswer(q, String(q.answer)), where).toBe(true);
        expect(solveStory(kind, q), where).toBe(q.answer);
        for (const t of texts(q)) { expect(t, where).not.toMatch(/undefined|NaN|AMC/); checkLabels(t); }
        expect(q.solutionSteps.flatMap(arithmeticSlips), where).toEqual([]);
        // Grade 1 everywhere: numbers to 20 (to 10 at difficulty 1 and its echoes), no percent, short sentences
        const max = Math.max(...allNumbers(q));
        expect(max, where).toBeLessThanOrEqual(d % 2 === 1 ? 10 : 20);
        expect(texts(q).join(' ')).not.toMatch(/%|percent/i);
        expect(Math.max(...words(q.prompt)), where).toBeLessThanOrEqual(12);
        if (STORY_KIND_GRADES[kind].includes(gradeOf(d))) expect(violatesCaps(gradeOf(d), { ...q, game: 'stories' }), where).toBeNull();
        expect(violatesCaps('g1', { ...q, game: 'stories' }), where).toBeNull();
        // Tap choices: 2 to 4, distinct, the right one among them; picture choices are numbered 1..n with words
        const ch = q.choices!;
        expect(ch.length).toBeGreaterThanOrEqual(2); expect(ch.length).toBeLessThanOrEqual(4);
        const vals = ch.map((c) => c.value);
        expect(new Set(vals).size).toBe(vals.length);
        expect(new Set(ch.map((c) => c.label)).size).toBe(vals.length);
        expect(vals).toContain(q.answer);
        if (kind === 'match') {
          expect([...vals].sort((a, b) => a - b)).toEqual(vals.map((_, j) => j + 1));
          expect(q.prompt).toMatch(/Tap it/);
          ch.forEach((c) => expect(c.visual?.type).toBe('objects'));
        } else {
          ch.forEach((c) => { expect(c.label).toBe(String(c.value)); expect(c.value).toBeGreaterThanOrEqual(kind === 'join' ? 1 : 0); });
          // the answer is labelled in the working
          expect(q.solutionSteps.join(' '), where).toMatch(new RegExp(`\\b${q.answer} \\(`));
        }
        // The picture shows the story, not the answer: no number in its words except the total a story already says
        const v = q.visual as Obj;
        for (const g of v.groups) expect(g.label ?? '', where).not.toMatch(/\d/);
        if (v.title) expect(ints(v.title).every((x) => ints(q.prompt).includes(x)), where).toBe(true);
        expect(q.solutionVisual?.type).toBe('objects');
        expect(q.hint.length).toBeGreaterThan(10);
      }
      expect(seen.size, 'stories vary').toBeGreaterThan(N / 3);
    });
  }
  it('is deterministic for a given rng', () => {
    for (const kind of STORY_KIND_IDS) {
      const a = storyQuestion(kind, 2, createRng(5)); const b = storyQuestion(kind, 2, createRng(5));
      expect({ ...a, id: '' }).toEqual({ ...b, id: '' });
    }
  });
});

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

function checkItem(grade: GradeId, game: string, q: Question, where: string) {
  expect(Number.isFinite(q.answer), where).toBe(true);
  expect(checkAnswer(q, String(q.answer)), where).toBe(true);
  expect(violatesCaps(grade, { ...q, game }), where).toBeNull();
  for (const t of texts(q)) expect(t, where).not.toMatch(/undefined|NaN|\bAMC\b/);
  if (q.choices) {
    const vals = q.choices.map((c) => c.value);
    expect(vals.length).toBeGreaterThanOrEqual(2); expect(vals.length).toBeLessThanOrEqual(5);
    expect(new Set(vals).size).toBe(vals.length);
    expect(vals.some((v) => Math.abs(v - q.answer) < 1e-9), where).toBe(true);
  }
}

describe('Track sessions', () => {
  it('Grade 1 never meets a percent or a number over 20, on any day, across many seeds', () => {
    let items = 0, tap = 0, stories = 0;
    for (let day = 0; day < 7; day++) for (let seed = 1; seed <= 60; seed++) {
      const p = buildSession('g1', day, createRng(seed * 31 + day));
      for (const it of [...p.warm, ...p.play]) {
        const q = it.question; const where = `g1 day ${day} seed ${seed} ${it.key}: ${q.prompt} ${q.expression}`;
        items++; if (q.choices) tap++; if (it.game === 'stories') stories++;
        expect(texts(q).join(' '), where).not.toMatch(/%|percent/i);
        expect(Math.max(0, ...allNumbers(q)), where).toBeLessThanOrEqual(20);
        expect(Number.isInteger(q.answer) && q.answer >= 0, where).toBe(true);
        expect(q.readAloud, where).toBeTruthy();
        // every Grade 1 item is tapped, answers of 0 included; no empty number bonds ("? + 20 = 20")
        expect(q.choices?.length, where).toBeGreaterThanOrEqual(2);
        if (it.game === 'bonds') expect(q.answer, where).toBeGreaterThan(0);
        // read aloud in plain words: no sum symbols, no "= ?"
        expect(q.readAloud, where).not.toMatch(/[=+−×÷]/);
        expect(gradeOf(q.difficulty), where).toBe('g1');
        checkItem('g1', it.game, q, where);
      }
      expect(p.warm.concat(p.play).some((x) => x.game === 'stories'), `day ${day} seed ${seed} has a picture story`).toBe(true);
    }
    expect(tap / items, 'Grade 1 is all tap choices').toBe(1);
    expect(stories).toBeGreaterThan(400);
  });

  for (const grade of GRADES) it(`${grade}: sections, sizes, grade fit, focus game, variety, no repeats, deterministic`, () => {
    const [lo, hi] = GRADE_DIFFICULTY[grade];
    for (let day = 0; day < 7; day++) for (let seed = 1; seed <= 25; seed++) {
      const p = buildSession(grade, day, createRng(seed * 977 + day));
      const where = `${grade} day ${day} seed ${seed}`;
      const rest = day === 0;
      const shape = rest ? REST_SHAPE : SESSION_SHAPE[grade];
      expect(p.theme).toBe(themeForDay(day).id);
      expect(p.warm.length, where).toBe(shape.warm);
      expect(p.play.length, `${where}: the session keeps its size`).toBe(shape.play);
      if (rest) {
        // Sunday's "short one anyway": a warm-up and three puzzles, no teach card
        expect(p.warm.length + p.play.length).toBe(4);
        expect(p.teach, where).toBeNull();
      } else {
        expect(shape.warm).toBeGreaterThanOrEqual(2); expect(shape.warm).toBeLessThanOrEqual(3);
        expect(shape.play).toBeGreaterThanOrEqual(5); expect(shape.play).toBeLessThanOrEqual(8);
        expect(p.teach, `${where}: a teach card`).not.toBeNull();
        expect(p.teach!.steps.length).toBeGreaterThanOrEqual(1);
        expect(p.teach!.steps.every((s) => s.visual), 'teach steps are worked on a picture').toBe(true);
      }
      const keys = new Set<string>();
      const kinds: Record<string, number> = {}; const games: Record<string, number> = {};
      for (const it of [...p.warm, ...p.play]) {
        const d = Number(/@d(\d)$/.exec(it.key)![1]);
        expect(d, `${where} ${it.key}`).toBeGreaterThanOrEqual(lo); expect(d).toBeLessThanOrEqual(hi);
        // the question really is pitched at the grade (some generators ignore the difficulty asked for)
        expect(gradeOf(it.question.difficulty), `${where} ${it.key}: ${it.question.prompt}`).toBe(grade);
        expect(kindAllowed(grade, it.game, it.kind), `${where} ${it.key}`).toBe(true);
        checkItem(grade, it.game, it.question, `${where} ${it.key}: ${it.question.prompt}`);
        const k = `${it.question.prompt}|${it.question.expression}|${JSON.stringify(it.question.visual)}`;
        expect(keys.has(k), `${where}: repeated question`).toBe(false); keys.add(k);
        kinds[`${it.game}:${it.kind}`] = (kinds[`${it.game}:${it.kind}`] ?? 0) + 1;
        games[it.game] = (games[it.game] ?? 0) + 1;
      }
      expect(Math.max(...Object.values(kinds)), `${where}: one kind at most ${KIND_CAP} times ${JSON.stringify(kinds)}`).toBeLessThanOrEqual(KIND_CAP);
      expect(Math.max(...Object.values(games)), `${where}: one game at most ${GAME_CAP[grade]} times ${JSON.stringify(games)}`).toBeLessThanOrEqual(GAME_CAP[grade]);
      p.warm.forEach((it) => expect(it.key.endsWith(`@d${lo}`)).toBe(true));
      const focus = FOCUS[p.theme === 'play' || p.theme === 'rest' ? 'mix' : p.theme][grade];
      if (!rest) {
        expect(p.play.filter((x) => x.game === focus).length, `${where}: focus ${focus}`).toBeGreaterThanOrEqual(2);
        // the warm-up comes before the teach card, so it leaves the focus game for after it
        expect(p.warm.some((x) => x.game === focus), `${where}: warm-up avoids the focus game`).toBe(false);
      }
    }
    const a = buildSession(grade, 3, createRng(42)); const b = buildSession(grade, 3, createRng(42));
    const strip = (p: typeof a) => [...p.warm, ...p.play].map((x) => [x.key, x.question.prompt, x.question.expression, x.question.answer, JSON.stringify(x.question.visual)]);
    expect(strip(a)).toEqual(strip(b));
    expect(a.teach).toEqual(b.teach);
  });

  it('Grade 1 Thursday (and other thin days) are varied: no kind fills the session', () => {
    // a reported case: five True/False/Can't tell in a row, then a story pushed on the end (6 play items, not 5)
    const p13 = buildSession('g1', 4, createRng(13));
    expect(p13.play).toHaveLength(SESSION_SHAPE.g1.play);
    expect(p13.play.filter((x) => x.kind === 'truefalse').length).toBeLessThanOrEqual(KIND_CAP);
    for (const [grade, day] of [['g1', 4], ['g1', 3], ['g1', 2], ['g5', 2], ['g5', 3]] as const) {
      let distinct = 0, prompt3 = 0; const n = 150; const byKind: Record<string, number> = {};
      for (let seed = 1; seed <= n; seed++) {
        const all = (({ warm, play }) => [...warm, ...play])(buildSession(grade, day, createRng(seed * 7919 + day)));
        const kinds = new Set(all.map((x) => `${x.game}:${x.kind}`)); distinct += kinds.size;
        all.forEach((x) => { byKind[`${x.game}:${x.kind}`] = (byKind[`${x.game}:${x.kind}`] ?? 0) + 1; });
        const prompts: Record<string, number> = {}; all.forEach((x) => { prompts[x.question.prompt] = (prompts[x.question.prompt] ?? 0) + 1; });
        if (Math.max(...Object.values(prompts)) >= 3) prompt3++;
      }
      const items = Object.values(byKind).reduce((a, b) => a + b, 0);
      expect(distinct / n, `${grade} day ${day}: kinds per session`).toBeGreaterThanOrEqual(4.5);
      expect(Math.max(...Object.values(byKind)) / items, `${grade} day ${day}: no kind is a third of the week's items ${JSON.stringify(byKind)}`).toBeLessThan(0.3);
      expect(prompt3, `${grade} day ${day}: the same sentence three times`).toBe(0);
    }
    // Thursday is Logic and counting: Grade 1 counts cubes, pictures and hidden parts too
    expect(THEME_POOLS.logic.filter(([g, k]) => kindAllowed('g1', g, k)).length).toBeGreaterThanOrEqual(5);
  });

  it('a Grade 1 child previewing Grade 3: no percent, numbers to 100, tap choices, read aloud', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const items = buildPreview('g3', createRng(seed), 'g1');
      expect(items).toHaveLength(PREVIEW_ITEMS);
      for (const it of items) {
        const q = it.question; const where = `g1 preview seed ${seed} ${it.key}: ${q.prompt}`;
        expect(it.game, where).not.toBe('pctmulti');
        expect(texts(q).join(' '), where).not.toMatch(/%|percent/i);
        expect(Math.max(0, ...allNumbers(q)), where).toBeLessThanOrEqual(YOUNG_PREVIEW_MAX);
        expect(q.readAloud, where).toBeTruthy();
        expect(q.choices?.length, where).toBeGreaterThanOrEqual(2);
        checkItem('g3', it.game, q, where);
      }
    }
    // a Grade 3 child previewing Grade 5 gets the Grade 5 items as they are
    expect(buildPreview('g5', createRng(4), 'g3').length).toBe(PREVIEW_ITEMS);
  });

  it('weaker kinds come up more often when mastery is given', () => {
    const strong = Object.fromEntries(Object.keys(CONTEST_KIND_GRADES.logic).map((k) => [`logic.${k}`, { id: `logic.${k}`, mastery: 100 } as never]));
    let logicPlain = 0, logicStrong = 0;
    for (let seed = 1; seed <= 40; seed++) {
      logicPlain += buildSession('g3', 4, createRng(seed)).play.filter((x) => x.game === 'logic').length;
      logicStrong += buildSession('g3', 4, createRng(seed), strong).play.filter((x) => x.game === 'logic').length;
    }
    expect(logicStrong).toBeLessThan(logicPlain);
  });

  it('the preview is 3 items of the next grade up, and Grade 5 has none', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const [home, up] of [['g1', 'g3'], ['g3', 'g5']] as const) {
        const items = buildPreview(up, createRng(seed));
        expect(items).toHaveLength(PREVIEW_ITEMS);
        expect(new Set(items.map((x) => x.game)).size).toBe(PREVIEW_ITEMS);
        for (const it of items) { expect(kindAllowed(up, it.game, it.kind)).toBe(true); checkItem(up, it.game, it.question, `${home} preview ${it.key}`); }
        const c = startContest({ ...initialContest(), grade: home }, 'preview', 2, {}, 1_000, seed);
        expect(c.run?.grade).toBe(up); expect(c.run?.home).toBe(home); expect(c.grade).toBe(home);
      }
      const g5 = { ...initialContest(), grade: 'g5' as GradeId };
      expect(startContest(g5, 'preview', 2, {}, 1_000, seed)).toBe(g5);
    }
  });

  it('Grade 1 read-aloud says a bare sum in words', () => {
    const q = (prompt: string, expression: string, mode: Question['mode'] = 'pure') => ({ prompt, expression, mode } as Question);
    expect(spokenQuestion(q('Compute 9 − 3.', '9 − 3 = ?'))).toBe('What is 9 minus 3?');
    expect(spokenQuestion(q('What makes 10?', '10 − 5 = ?'))).toBe('What makes 10? What is 10 minus 5?');
    expect(spokenQuestion(q('Fill the gap.', '? + 5 = 12'))).toBe('Fill the gap. What number plus 5 makes 12?');
    expect(spokenQuestion(q('Fill the gap.', '7 + ? = 12'))).toBe('Fill the gap. 7 plus what number makes 12?');
    expect(spokenQuestion(q('Each block is 1 cube. How many cubes?', 'Volume = ? cubes', 'applied'))).toBe('Each block is 1 cube. How many cubes?');
    expect(spokenQuestion({ ...q('x', 'y'), readAloud: 'Own words.' })).toBe('Own words.');
  });

  it('a capped draw is redrawn until it fits (Grade 1 on a Grade 3 kind returns nothing rather than breaking a cap)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const q = drawCapped('g1', 'pctmulti', 'outof100', 3, createRng(seed));
      expect(q).toBeNull();
      const ok = drawCapped('g1', 'stories', 'join', 2, createRng(seed));
      expect(ok && violatesCaps('g1', { ...ok, game: 'stories' })).toBeNull();
    }
  });
});

/* ------------------------------------------------------------------ */
/* Mini-mock                                                           */
/* ------------------------------------------------------------------ */

describe('Grade 5 mini-mock', () => {
  it('10 original items, skills-balanced, easier first, all within Grade 5', () => {
    const want = { arith: 2, geometry: 2, counting: 1, data: 1, pattern: 1, logic: 1, percent: 1, ratio: 1 };
    expect(MOCK_BLUEPRINT).toHaveLength(MOCK_SIZE);
    for (let seed = 1; seed <= 40; seed++) {
      const items = buildMock(createRng(seed), (g, k, d, r, seen) => drawCapped('g5', g, k, d, r, seen));
      expect(items).toHaveLength(MOCK_SIZE);
      const tally: Record<string, number> = {};
      for (const it of items) { tally[it.skill!] = (tally[it.skill!] ?? 0) + 1; checkItem('g5', it.game, it.question, `mock ${seed} ${it.key}`); expect(kindAllowed('g5', it.game, it.kind)).toBe(true); }
      expect(tally).toEqual(want);
      // fractions and percent in the two arithmetic items, every item really at Grade 5 (the Arcade fraction and
      // ratio games play one Grade 3 level whatever difficulty is asked, so they are not used)
      const arith = items.filter((x) => x.skill === 'arith');
      expect(arith.some((x) => isFractionPie(x.question)), `mock ${seed}: a fraction item`).toBe(true);
      expect(arith.map((x) => x.game)).toContain('pctmulti');
      for (const it of items) expect(gradeOf(it.question.difficulty), `mock ${seed} ${it.key}: ${it.question.prompt}`).toBe('g5');
      expect(items.some((x) => x.game === 'frac' || x.game === 'ratio')).toBe(false);
      expect(items.find((x) => x.skill === 'ratio')!.key).toMatch(/^rates:ratio@d[56]$/);
      expect(items.slice(0, 5).every((x) => x.key.endsWith('@d5'))).toBe(true);
      expect(new Set(items.map((x) => x.question.prompt + x.question.expression)).size).toBe(MOCK_SIZE);
    }
  });

  it('every mini-mock has all 10 items and its fraction item (the fraction slot keeps only fraction pies)', () => {
    // 8 draws for the fraction slot used to leave about 1 mock in 150 at 9 items (seeds 64 and 180 through startContest)
    const base = { ...initialContest(), grade: 'g5' as const };
    for (let seed = 1; seed <= 600; seed++) {
      const items = startContest(base, 'mock', 5, {}, Date.UTC(2026, 9, 2, 9), seed).run!.items;
      expect(items, `mock seed ${seed}`).toHaveLength(MOCK_SIZE);
      expect(items[0].skill).toBe('arith');
      expect(isFractionPie(items[0].question), `mock seed ${seed}: the fraction item`).toBe(true);
      expect(items.filter((x) => x.skill === 'arith'), `mock seed ${seed}`).toHaveLength(2);
    }
  });
});

/* ------------------------------------------------------------------ */
/* The run engine, through the reducer                                 */
/* ------------------------------------------------------------------ */

let clock = Date.UTC(2026, 8, 30, 15, 0, 0); // a Wednesday afternoon
afterEach(() => { vi.useRealTimers(); });
function at(t: number) { vi.useFakeTimers(); vi.setSystemTime(t); }
function step(s: GameState, a: Action, dt = 20_000): GameState { clock += dt; at(clock); return gameReducer(s, a); }
const cur = (s: GameState) => s.contest.run!.items[s.contest.run!.queue[0]];
function fresh(grade: GradeId): GameState { at(clock); return gameReducer(initialState(), { type: 'CONTEST_SET_GRADE', grade }); }
/** Play to the end: right answers, through the teach card and the clock offer (`clockYes`). Returns the phases seen. */
function playAll(s0: GameState, clockYes: boolean, wrongFirst = -1): { s: GameState; phases: string[] } {
  let s = s0; const phases: string[] = []; let n = 0;
  for (let g = 0; g < 200 && s.contest.run && s.contest.run.phase !== 'over'; g++) {
    const r = s.contest.run; phases.push(r.phase);
    if (r.phase === 'teach') { s = step(s, { type: 'CONTEST_TEACH_NEXT' }); continue; }
    if (r.phase === 'consent') { s = step(s, { type: 'CONTEST_CLOCK', accept: clockYes }); continue; }
    const q = cur(s).question;
    if (n++ === wrongFirst) {
      const wrong = q.choices ? q.choices.find((c) => c.value !== q.answer)!.value : q.answer + 1;
      s = step(s, { type: 'CONTEST_ANSWER', given: String(wrong) });
      expect(s.contest.run!.feedback?.correct).toBe(false);
      s = step(s, { type: 'CONTEST_NEXT' });
      expect(cur(s).question.id, 'a first miss gets a second try at the same item').toBe(q.id);
    }
    s = step(s, { type: 'CONTEST_ANSWER', given: String(q.answer) });
    expect(s.contest.run!.feedback?.correct).toBe(true);
    s = step(s, { type: 'CONTEST_NEXT' });
  }
  return { s, phases };
}

describe('Run engine', () => {
  it('Grade 3: warm-up, teach card, consent clock before the last 4, history, mastery and the notebook', () => {
    let s = fresh('g3');
    s = step(s, { type: 'CONTEST_START', mode: 'session', day: 4, seed: 11 });
    expect(s.screen).toBe('contest');
    const run = s.contest.run!;
    expect(run.phase).toBe('play'); expect(run.items[0].section).toBe('warm');
    expect(run.clock).toMatchObject({ state: 'off', offerAt: G3_CLOCK_ITEMS });
    const { s: end, phases } = playAll(s, true, 1);
    const r = end.contest.run!;
    expect(r.phase).toBe('over');
    expect(phases.indexOf('teach')).toBe(SESSION_SHAPE.g3.warm);
    const consentAt = phases.indexOf('consent');
    expect(consentAt).toBeGreaterThan(0);
    expect(phases.slice(consentAt + 1).filter((p) => p === 'play').length).toBeGreaterThanOrEqual(G3_CLOCK_ITEMS);
    expect(r.clock.state).toBe('on');
    expect(r.calmMs).toBeGreaterThan(0); expect(r.timedMs).toBeGreaterThan(0);
    expect(Object.values(r.results).every((x) => x.correct)).toBe(true);
    expect(Object.values(r.results).filter((x) => !x.firstTry)).toHaveLength(1);
    expect(end.contest.history).toHaveLength(1);
    const h = end.contest.history[0];
    expect(h).toMatchObject({ grade: 'g3', mode: 'session', theme: 'logic', items: run.items.length, right: run.items.length, firstTry: run.items.length - 1 });
    expect(h.skills.length).toBeGreaterThan(1);
    for (const sk of h.skills) expect(end.mastery[sk]?.attempts, sk).toBeGreaterThanOrEqual(1);
    expect(end.answers.filter((x) => x.context === 'drill').length).toBe(run.items.length);
    expect(end.notebook.filter((e) => !e.clearedAt)).toHaveLength(1);
    // the victory card closes once; history is not written twice
    const again = step(end, { type: 'CONTEST_NEXT' });
    expect(again.contest.history).toHaveLength(1);
    const closed = step(end, { type: 'CONTEST_CLOSE' });
    expect(closed.contest.run).toBeNull(); expect(closed.contest.history).toHaveLength(1);
  });

  it('Grade 1 never sees a clock offer; declining keeps Grade 3 calm', () => {
    let s = fresh('g1');
    s = step(s, { type: 'CONTEST_START', mode: 'session', day: 1, seed: 3 });
    expect(s.contest.run!.clock.offerAt).toBe(0);
    const { s: end, phases } = playAll(s, true);
    expect(phases).not.toContain('consent');
    expect(end.contest.run!.timedMs).toBe(0);
    let g3 = fresh('g3');
    g3 = step(g3, { type: 'CONTEST_START', mode: 'session', day: 2, seed: 5 });
    const calm = playAll(g3, false).s;
    expect(calm.contest.run!.clock.state).toBe('declined');
    expect(calm.contest.run!.timedMs).toBe(0);
    expect(calm.contest.history[0].timedMs).toBe(0);
  });

  it('Grade 5: Skip & come back returns the flagged item at the end', () => {
    let s = fresh('g5');
    s = step(s, { type: 'CONTEST_START', mode: 'session', day: 1, seed: 9 });
    const first = s.contest.run!.queue[0];
    s = step(s, { type: 'CONTEST_SKIP' });
    const r = s.contest.run!;
    expect(r.queue[r.queue.length - 1]).toBe(first);
    expect(r.flagged).toEqual([first]);
    const end = playAll(s, false).s;
    expect(end.contest.run!.results[first]?.correct).toBe(true);
    expect(end.contest.run!.flagged).toEqual([]);
    // no skipping for Grade 1 or Grade 3
    let g1 = fresh('g1'); g1 = step(g1, { type: 'CONTEST_START', mode: 'session', day: 1, seed: 9 });
    const q0 = g1.contest.run!.queue[0];
    expect(step(g1, { type: 'CONTEST_SKIP' }).contest.run!.queue[0]).toBe(q0);
  });

  it('Grade 5 mini-mock: the clock is asked for first, one try each, results per skill', () => {
    let s = fresh('g5');
    s = step(s, { type: 'CONTEST_START', mode: 'mock', day: 5, seed: 21 });
    expect(s.contest.run!.phase).toBe('consent');
    s = step(s, { type: 'CONTEST_CLOCK', accept: true });
    expect(s.contest.run!.clock.state).toBe('on');
    // the clock waits while the run is paused
    const started = s.contest.run!.clock.startedAt!;
    s = step(s, { type: 'CONTEST_PAUSE' }, 5_000);
    s = step(s, { type: 'CONTEST_RESUME' }, 3_600_000);
    expect(s.contest.run!.clock.startedAt).toBe(started + 3_600_000);
    // one wrong answer: no second try in the mock
    const q = cur(s).question;
    s = step(s, { type: 'CONTEST_ANSWER', given: String(q.choices ? q.choices.find((c) => c.value !== q.answer)!.value : q.answer + 7) });
    s = step(s, { type: 'CONTEST_NEXT' });
    expect(cur(s).question.id).not.toBe(q.id);
    const end = playAll(s, true).s;
    const h = end.contest.history[0];
    expect(h.mode).toBe('mock');
    const bars = mockBars(h);
    expect(bars.reduce((t, b) => t + b.of, 0)).toBe(MOCK_SIZE);
    expect(bars.reduce((t, b) => t + b.right, 0)).toBe(MOCK_SIZE - 1);
    expect(h.timedMs).toBeGreaterThan(0);
    // only Grade 5 has a mock
    const g3 = fresh('g3');
    expect(step(g3, { type: 'CONTEST_START', mode: 'mock' }).contest.run).toBeNull();
  });

  it('a preview never changes the grade and lights no lantern', () => {
    let s = fresh('g1');
    s = step(s, { type: 'CONTEST_START', mode: 'preview', day: 3, seed: 2 });
    expect(s.contest.run!.items).toHaveLength(PREVIEW_ITEMS);
    expect(s.contest.run!.grade).toBe('g3');
    const end = playAll(s, false).s;
    expect(end.contest.grade).toBe('g1');
    expect(end.contest.history[0].mode).toBe('preview');
    expect(weekSummary(end.contest.history, clock).sessions).toBe(0);
  });

  it('pause, resume and quit; nothing starts without a grade', () => {
    at(clock);
    const none = gameReducer(initialState(), { type: 'CONTEST_START', mode: 'session' });
    expect(none.contest.run).toBeNull();
    let s = fresh('g3');
    s = step(s, { type: 'CONTEST_START', mode: 'session', day: 2, seed: 4 });
    s = step(s, { type: 'CONTEST_PAUSE' });
    expect(s.contest.run!.paused).toBe(true);
    const before = s.contest.run!.calmMs;
    s = step(s, { type: 'CONTEST_ANSWER', given: String(cur(s).question.answer) }, 3_600_000);
    expect(s.contest.run!.feedback, 'no answers while paused').toBeUndefined();
    s = step(s, { type: 'CONTEST_RESUME' });
    expect(s.contest.run!.paused).toBe(false);
    expect(s.contest.run!.calmMs, 'an hour away is not practice').toBe(before);
    s = step(s, { type: 'CONTEST_QUIT' });
    expect(s.contest.run).toBeNull(); expect(s.contest.history).toHaveLength(0);
  });

  it('the mini-mock keeps its worked answer shut until the item is answered', () => {
    let s = fresh('g5');
    s = step(s, { type: 'CONTEST_START', mode: 'mock', day: 5, seed: 31 });
    s = step(s, { type: 'CONTEST_CLOCK', accept: false });
    s = step(s, { type: 'CONTEST_EXPLAIN' });
    expect(s.contest.run!.showExplanation, 'no peeking before answering').toBe(false);
    s = step(s, { type: 'CONTEST_HINT' });
    expect(s.contest.run!.hintShown).toBe(false);
    s = step(s, { type: 'CONTEST_ANSWER', given: String(cur(s).question.answer) });
    s = step(s, { type: 'CONTEST_EXPLAIN' });
    expect(s.contest.run!.showExplanation, 'after the answer it opens').toBe(true);
    // everywhere else "Show me how" works before answering, as in the Arcade
    let g3 = fresh('g3'); g3 = step(g3, { type: 'CONTEST_START', mode: 'session', day: 2, seed: 31 });
    expect(step(g3, { type: 'CONTEST_EXPLAIN' }).contest.run!.showExplanation).toBe(true);
  });

  it('a waiting session is never quietly replaced; switching grade drops a run from the old grade', () => {
    let s = fresh('g1');
    s = step(s, { type: 'CONTEST_START', mode: 'session', day: 3, seed: 6 });
    s = step(s, { type: 'CONTEST_PAUSE' });
    const id = s.contest.run!.id;
    for (const mode of ['session', 'preview'] as const) expect(step(s, { type: 'CONTEST_START', mode, day: 3, seed: 7 }).contest.run!.id, mode).toBe(id);
    const replaced = step(s, { type: 'CONTEST_START', mode: 'session', day: 3, seed: 7, replace: true });
    expect(replaced.contest.run!.id).not.toBe(id);
    expect(replaced.contest.history).toHaveLength(0);
    // a finished run (victory card still open) may be replaced
    const done = playAll(step(s, { type: 'CONTEST_RESUME' }), false).s;
    expect(done.contest.run!.phase).toBe('over');
    expect(step(done, { type: 'CONTEST_START', mode: 'session', day: 3, seed: 8 }).contest.run!.phase).not.toBe('over');
    // the reported case: a Grade 5 mock paused, then the grade switched to Grade 1: the mock (percent, clock) is gone
    let g5 = fresh('g5');
    g5 = step(g5, { type: 'CONTEST_START', mode: 'mock', day: 5, seed: 2 });
    g5 = step(g5, { type: 'CONTEST_PAUSE' });
    const g1 = step(g5, { type: 'CONTEST_SET_GRADE', grade: 'g1' });
    expect(g1.contest.grade).toBe('g1'); expect(g1.contest.run).toBeNull();
    expect(step(g1, { type: 'CONTEST_RESUME' }).contest.run).toBeNull();
    expect(step(g5, { type: 'CONTEST_SET_GRADE', grade: 'g5' }).contest.run, 'the same grade keeps it').not.toBeNull();
    expect(step(g5, { type: 'CONTEST_SET_GRADE', grade: null }).contest.run).toBeNull();
    // an old save holding another grade's run does not bring it back
    expect(migrateContest({ ...g5.contest, grade: 'g1' }).run).toBeNull();
    expect(migrateContest(JSON.parse(JSON.stringify(g5.contest))).run).not.toBeNull();
  });

  it('Sunday: "a short one anyway" is short, with no teach card and no clock', () => {
    for (const grade of GRADES) {
      let s = fresh(grade);
      s = step(s, { type: 'CONTEST_START', mode: 'session', day: 0, seed: 12 });
      const r = s.contest.run!;
      expect(r.items).toHaveLength(REST_SHAPE.warm + REST_SHAPE.play);
      expect(r.teach).toBeNull(); expect(r.clock.offerAt).toBe(0); expect(r.theme).toBe('rest');
      const { s: end, phases } = playAll(s, true);
      expect(phases).not.toContain('consent'); expect(phases).not.toContain('teach');
      expect(end.contest.run!.timedMs).toBe(0);
    }
  });

  it('a session in progress survives a reload; old and broken saves migrate safely', () => {
    let s = fresh('g3');
    s = { ...s, character: { name: 'QA', avatar: '', specialization: 'undecided', level: 1, xp: 0, hp: 100, maxHp: 100, energy: 50, maxEnergy: 50, intelligence: 1, engineeringSkill: 1, createdAt: 0, title: 'x' } };
    s = step(s, { type: 'CONTEST_START', mode: 'session', day: 4, seed: 8 });
    s = step(s, { type: 'CONTEST_ANSWER', given: String(cur(s).question.answer) });
    const saved = JSON.parse(JSON.stringify(s)) as GameState;
    const loaded = step(initialState(), { type: 'LOAD', state: saved });
    expect(loaded.screen).toBe('contest');
    expect(loaded.contest.run).toEqual(saved.contest.run);
    const next = step(loaded, { type: 'CONTEST_NEXT' });
    expect(next.contest.run!.queue.length).toBe(saved.contest.run!.queue.length - 1);
    // old saves: no slice, or only grade and caps
    expect(migrateContest(undefined)).toEqual(initialContest());
    expect(migrateContest({ grade: 'g1', caps: false })).toEqual({ grade: 'g1', caps: false, run: null, history: [] });
    // broken runs and history rows are dropped, not crashed on
    expect(migrateContest({ grade: 'g3', run: { v: 1, mode: 'session', items: [{}], queue: [0] } }).run).toBeNull();
    expect(migrateContest({ grade: 'g3', run: { ...saved.contest.run, queue: [99] } }).run).toBeNull();
    expect(migrateContest({ grade: 'zz', history: [{ at: 1 }, 'x', null] })).toEqual(initialContest());
  });
});

/* ------------------------------------------------------------------ */
/* Parent plan                                                         */
/* ------------------------------------------------------------------ */

describe('Parent plan', () => {
  it('day themes, the 4-day plan plus Friday, the checklist', () => {
    expect(DAY_THEMES.map((d) => d.id)).toEqual(['rest', 'number', 'picture', 'stories', 'logic', 'mix', 'play']);
    expect(themeForDay(8).id).toBe('number');
    for (const g of GRADES) {
      const p = weekPlan(g);
      expect(p.map((l) => l.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      p.forEach((l) => expect(l.what.length).toBeGreaterThan(10));
    }
    expect(weekPlan('g5')[4].what).toMatch(/mini-mock/);
    expect(PARENT_CHECKLIST).toHaveLength(5);
    expect(PARENT_CHECKLIST.join(' ')).toMatch(/Calm/); expect(PARENT_CHECKLIST.join(' ')).toMatch(/Notebook/); expect(PARENT_CHECKLIST.join(' ')).toMatch(/8 minutes/); expect(PARENT_CHECKLIST.join(' ')).toMatch(/real contest papers/);
  });

  it('week summary: lanterns by weekday, calm and timed minutes, previews not counted, a week streak', () => {
    const wed = new Date(2026, 8, 30, 17, 0).getTime(); // Wed 30 Sep 2026, local time
    const mon = weekStart(wed);
    expect(new Date(mon).getDay()).toBe(1);
    const e = (at: number, mode: ContestHistoryEntry['mode'], calm: number, timed: number): ContestHistoryEntry => ({ at, date: '', grade: 'g3', mode, theme: 'number', items: 10, right: 9, firstTry: 8, calmMs: calm, timedMs: timed, skills: [] });
    const h = [
      e(mon - 3 * 86_400_000, 'session', 600_000, 0), // last week
      e(mon + 3_600_000, 'session', 600_000, 0), // Monday
      e(mon + 2 * 86_400_000 + 3_600_000, 'session', 480_000, 240_000), // Wednesday
      e(mon + 2 * 86_400_000 + 7_200_000, 'preview', 120_000, 0),
    ];
    const w = weekSummary(h, wed);
    expect(w.sessions).toBe(2); expect(w.calmMin).toBe(18); expect(w.timedMin).toBe(4); expect(w.firstTry).toBe(16);
    expect(w.lanterns).toEqual([true, false, true, false, false, false, false]);
    expect(w.streakWeeks).toBe(2);
    expect(weekSummary([], wed)).toMatchObject({ sessions: 0, streakWeeks: 0 });
  });

  it('weak spots: the lowest-mastery contest skills that were tried', () => {
    const rec = (id: string, mastery: number, attempts = 3) => ({ id, mastery, attempts } as never);
    const m = { 'logic.grid': rec('logic.grid', 20), 'pattern.shapes': rec('pattern.shapes', 70), 'stories.join': rec('stories.join', 10), 'mult.6': rec('mult.6', 0), 'paths.menus': rec('paths.menus', 5, 0), 'blocks.count': rec('blocks.count', 40) };
    const w = weakSpots(m);
    expect(w.map((x) => x.id)).toEqual(['stories.join', 'logic.grid', 'blocks.count']);
    expect(w[0].label).toBe('Picture stories: Some more come');
  });

  it('a whole week of sessions in the reducer lights a lantern per day', () => {
    let s: GameState = { ...initialState(), contest: { ...initialContest(), grade: 'g1' } as ContestState };
    const monday = weekStart(new Date(2026, 9, 5, 12).getTime()) + 16 * 3_600_000;
    for (const d of [0, 1, 2, 3]) {
      clock = monday + d * 86_400_000; at(clock);
      s = gameReducer(s, { type: 'CONTEST_START', mode: 'session', seed: 100 + d });
      s = playAll(s, false).s;
      s = step(s, { type: 'CONTEST_CLOSE' });
    }
    const w = weekSummary(s.contest.history, clock);
    expect(w.lanterns).toEqual([true, true, true, true, false, false, false]);
    expect(s.contest.history.map((h) => h.theme)).toEqual(['number', 'picture', 'stories', 'logic']);
  });
});

/* ------------------------------------------------------------------ */
/* What the screen shows                                               */
/* ------------------------------------------------------------------ */

const screen = (st: GameState) => { ui.state = st; return renderToStaticMarkup(createElement(ContestTrackScreen)); };
const buttons = (html: string) => [...html.matchAll(/<button([^>]*)>(.*?)<\/button>/g)].map((m) => ({ attrs: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }));
/** The markup of the element that carries this aria-label (to the end of the page: enough for button order). */
const from = (html: string, label: string) => { const i = html.indexOf(`aria-label="${label}"`); expect(i, label).toBeGreaterThan(-1); return html.slice(i); };

describe('Contest Path screen', () => {
  it('the clock offer: "Stay calm" comes first and is the main button; the clock is the opt-in', () => {
    let s = fresh('g3');
    s = step(s, { type: 'CONTEST_START', mode: 'session', day: 4, seed: 11 });
    for (let g = 0; g < 40 && s.contest.run!.phase !== 'consent'; g++) {
      const r = s.contest.run!;
      if (r.phase === 'teach') { s = step(s, { type: 'CONTEST_TEACH_NEXT' }); continue; }
      s = step(s, { type: 'CONTEST_ANSWER', given: String(cur(s).question.answer) });
      s = step(s, { type: 'CONTEST_NEXT' });
    }
    expect(s.contest.run!.phase).toBe('consent');
    const card = from(screen(s), 'Clock choice');
    expect(card).toContain('Practice was calm. This last round can have a clock if you like. Want to try it?');
    expect(card).not.toMatch(/this round has a clock/);
    const [calm, clockBtn] = buttons(card);
    expect(calm.text).toBe('Stay calm'); expect(calm.attrs).toMatch(/class="btn primary"/);
    expect(clockBtn.text).toBe('Yes, try the clock'); expect(clockBtn.attrs).toMatch(/class="btn ghost"/);
    // the mini-mock asks the same way
    let m = fresh('g5'); m = step(m, { type: 'CONTEST_START', mode: 'mock', day: 5, seed: 21 });
    expect(buttons(from(screen(m), 'Clock choice')).map((b) => b.text)).toEqual(['Stay calm', 'Yes, try the clock']);
  });

  it('the teach card has a "Read to me" button, and its words are said plainly', () => {
    for (const grade of GRADES) {
      let s = fresh(grade);
      s = step(s, { type: 'CONTEST_START', mode: 'session', day: 4, seed: 5 });
      for (let g = 0; g < 10 && s.contest.run!.phase === 'play'; g++) {
        s = step(s, { type: 'CONTEST_ANSWER', given: String(cur(s).question.answer) });
        s = step(s, { type: 'CONTEST_NEXT' });
      }
      expect(s.contest.run!.phase, grade).toBe('teach');
      const card = from(screen(s), 'Teach card');
      const btns = buttons(card);
      // a two-step card offers the next step; a one-step card goes straight to the puzzles
      const next = s.contest.run!.teach!.steps.length > 1 ? 'Show me ▸' : 'Let\u2019s play ▸';
      expect(btns.map((b) => b.text.replace('&#x27;', '\u2019')), grade).toEqual(['Read to me', next]);
      expect(btns[0].attrs).toContain('aria-label="Read the teach card aloud"');
    }
    // labels are said as words, capitals for stress as ordinary words
    expect(speakable('Count them: 3 (red apples) is more than 2 (green apples). So it is TRUE, but we CAN\'T TELL.'))
      .toBe('Count them: 3 red apples is more than 2 green apples. So it is true, but we can\'t tell.');
    for (const grade of GRADES) for (const focus of Object.values(FOCUS).map((f) => f[grade])) {
      for (const st of teachCard(grade, focus, createRng(3))?.steps ?? []) {
        const said = speakable(st.text);
        expect([...said.matchAll(new RegExp(LABELED.source, 'g'))], said).toHaveLength(0);
        expect(said, said).not.toMatch(/\b[A-Z]{2,}\b/);
        expect(said.length).toBeGreaterThan(10);
      }
    }
  });

  it('the mini-mock hides "Show me how" until the item is answered, without depending on icon URLs', () => {
    let s = fresh('g5');
    s = step(s, { type: 'CONTEST_START', mode: 'mock', day: 5, seed: 31 });
    s = step(s, { type: 'CONTEST_CLOCK', accept: false });
    const before = screen(s);
    expect(before).toContain('ct-play ct-noexplain');
    // The worked answer lives in the ? Help sheet; during the mock it is left out (explainLocked), and the tool row
    // offers only labelled buttons and ? Help, never the explanation itself.
    const tools = /<div class="tools">(.*?)<\/div>/.exec(before)![1];
    const btns = buttons(tools);
    expect(btns.at(-1)!.text).toBe('? Help');
    expect(btns.slice(0, -1).every((b) => b.attrs.includes('aria-label')), 'only labelled buttons come before it').toBe(true);
    expect(before).not.toMatch(/Explain this|Show me how/);
    s = step(s, { type: 'CONTEST_ANSWER', given: String(cur(s).question.answer) });
    expect(screen(s)).not.toContain('ct-noexplain');
  });

  it('while a mini-mock waits, the Today card names it instead of today\'s plan', () => {
    clock = new Date(2026, 9, 2, 16, 0).getTime(); // a Friday: a mix day, with the mini-mock offer
    let s = fresh('g5');
    s = step(s, { type: 'CONTEST_START', mode: 'mock', day: 5, seed: 21 });
    s = step(s, { type: 'CONTEST_CLOCK', accept: false });
    s = step(s, { type: 'CONTEST_PAUSE' });
    at(clock);
    const html = screen(s);
    const today = from(html, 'The waiting session');
    expect(today).toMatch(/Waiting:.*Mini-mock, 0 of 10 done/);
    expect(html).not.toContain('aria-label="Today&#x27;s session"');
    expect(html).not.toMatch(/Mixed play · \d/);
    expect(html).not.toContain('unless you choose one near the end');
    expect(html).not.toContain('Start the mini-mock');
    expect(buttons(html).map((b) => b.text)).toContain('Resume the waiting session');
    // with nothing waiting the plan is back
    const fresh5 = step(s, { type: 'CONTEST_QUIT' });
    at(clock);
    const idle = screen(fresh5);
    expect(idle).toContain('aria-label="Today&#x27;s session"');
    expect(idle).not.toContain('The waiting session');
  });
});
