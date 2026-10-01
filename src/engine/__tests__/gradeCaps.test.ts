import { describe, it, expect, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GRADE_ARCADE, GRADES, GRADE_GAME_DIFFICULTY, violatesCaps, gameDifficulty, gradeDifficulty, timedModesAllowed, type GradeId } from '../contest/grades';
import { parseSelection, drawSeeded, startArcade } from '../state/arcade';
import { createRng } from '../rng';
import { checkAnswer, generateQuestion, generateFromSkills } from '../questions';
import type { Difficulty, Question } from '../types';
import type { ArcadeGame, GameState } from '../state/types';
import { gradeSelections, kindOk, gameOk, cappedKey, capGrade, lobbyKinds, ARCADE_GAMES, CAP_HOLD, runCapIssue, selectionOk, lessonOk, capMath, skillKind, RAMP_HOLD, gearSelectionOk, versusCapIssue, ClockGate, ArcadeScreen } from '../../game/screens/ArcadeScreen';
import { GEAR_MATH } from '../../game/screens/WeakestGearScreen';
import { TycoonScreen, tycoonGuestBlocked } from '../../game/tycoon/TycoonScreen';
import { guestLobby } from '../tycoon/online';
import { CHAIN } from '../state/gear';
import { MILL_KINDS, startMillionaire, pickOption, nextRung, correctIndex, LADDER } from '../state/millionaire';
import { MILL_TOP, millKindsFor, millOptionShown, millHeaderLevel } from '../../game/screens/MillionaireScreen';
import { tycoonLevels } from '../../game/tycoon/TycoonScreen';
import { LESSONS } from '../../content/lessons';
import { PICTURE_GAMES } from '../questions/games';
import { MM_ARCADE_GROUPS } from '../questions/mentalmath';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';

// Screens read the store through useGame; the render checks below hand them a state of their own.
const store = vi.hoisted(() => ({ state: null as unknown, dispatched: [] as unknown[] }));
vi.mock('../../game/store', () => ({ useGame: () => ({ state: store.state, dispatch: (a: unknown) => store.dispatched.push(a), play: () => {} }) }));
const render = (state: GameState, el: ReactElement) => { store.state = state; return renderToStaticMarkup(el); };

const GRADE_LIST: GradeId[] = ['g1', 'g3', 'g5'];
const MM_GROUPS = MM_ARCADE_GROUPS.map((g) => g.id);
const SEEDS = Number(process.env.CAPS_SEEDS ?? 60);
const text = (q: Question) => `${q.prompt} ${q.expression} ${q.hint} ${q.explanation} ${q.solutionSteps.join(' ')}`;

/** Every question the capped lobby can produce for a selection: the calm Practice path and the seeded (friends, Conquer) path. */
function draws(game: ArcadeGame, key: string, seed: number): Question[] {
  const sel = parseSelection(game, key);
  return [startArcade(game, 'practice', key, {}, 0, createRng(seed * 13 + 1)).question, drawSeeded(sel, seed, seed % 7)];
}
/** The first cap break among `n` draws of a selection, or null. */
function firstBreak(grade: GradeId, game: ArcadeGame, key: string, n: number): string | null {
  for (let seed = 1; seed <= n; seed++) for (const q of draws(game, key, seed)) {
    const why = violatesCaps(grade, { ...q, game });
    if (why) return `${why} · "${q.prompt.slice(0, 80)}" ${q.expression}`;
  }
  return null;
}

describe('grade caps: allow lists', () => {
  it('Grade 1 has no percent kinds, no clock, and fractions only as shading', () => {
    const g1 = GRADE_ARCADE.g1;
    expect(g1.pctmulti).toBeUndefined();
    expect(g1.frac).toEqual(['shade']);
    for (const [game, kinds] of Object.entries(g1)) for (const k of kinds ?? []) expect(`${game}:${k}`).not.toMatch(/pct|percent|discount|tax/i);
    expect(timedModesAllowed('g1')).toBe(false);
    expect(timedModesAllowed('g3')).toBe(true);
    expect(timedModesAllowed('g5')).toBe(true);
    expect(GRADES.g1.percent).toBe('none');
  });
  it('the Grade 1 lobby offers no percent game, no "every kind" mix of a capped game, and no academy or mixed', () => {
    const sels = gradeSelections('g1');
    expect(sels.length).toBeGreaterThan(10);
    expect(sels.some((s) => s.game === 'pctmulti' || /pct/.test(s.key))).toBe(false);
    expect(sels.filter((s) => s.game === 'frac').map((s) => s.key)).toEqual(['frac:shade']);
    expect(sels.some((s) => s.game === 'academy' || s.game === 'mixed' || s.game === 'mult' || s.game === 'div')).toBe(false);
    expect(sels.some((s) => /:all(@|$)/.test(s.key))).toBe(false);
    expect(kindOk('g1', 'volume', 'all')).toBe(false);
    expect(kindOk('g1', 'volume', 'cubes')).toBe(true);
    expect(kindOk('g1', 'word', 'mixed')).toBe(false);
  });
  it('no grade (or caps off) changes nothing', () => {
    expect(capGrade(undefined)).toBeNull();
    expect(capGrade({ grade: null, caps: true } as never)).toBeNull();
    expect(capGrade({ grade: 'g1', caps: false } as never)).toBeNull();
    expect(capGrade({ grade: 'g3', caps: true } as never)).toBe('g3');
    for (const g of ARCADE_GAMES) {
      expect(gameOk(null, g.id)).toBe(true);
      for (const k of lobbyKinds(g.id)) expect(kindOk(null, g.id, k)).toBe(true);
      expect(cappedKey(null, g.id, `${g.id}:all`)).toBe(`${g.id}:all`);
    }
  });
  it('games grades.ts pins carry that difficulty, other picture games the grade difficulty, fact games their own key', () => {
    for (const grade of GRADE_LIST) {
      const d = gradeDifficulty(grade);
      for (const s of gradeSelections(grade)) {
        const sel = parseSelection(s.game, s.key);
        const pinned = GRADE_GAME_DIFFICULTY[grade]?.[s.game];
        if (pinned) expect(sel.difficulty, s.key).toBe(pinned);
        else if (/@d\d$/.test(s.key)) expect(sel.difficulty, s.key).toBe(d);
        expect(/@d\d$/.test(s.key), s.key).toBe(!!pinned || !!PICTURE_GAMES[s.game]);
        expect(sel.key).toBe(s.key);
      }
      expect(cappedKey(grade, 'pattern', 'pattern:shapes')).toBe(`pattern:shapes@d${d}`);
      expect(cappedKey(grade, 'bonds', 'bonds:10')).toBe('bonds:10');
    }
    // Grade 1: word problems, sums, differences and cube stacks at difficulty 1 (they stay within 20 only there).
    const g1 = gradeSelections('g1').map((s) => s.key);
    for (const k of ['word:add@d1', 'word:sub@d1', 'add:20@d1', 'sub:20@d1', 'volume:cubes@d1']) expect(g1).toContain(k);
    expect(g1.some((k) => /^(word|add|sub|volume):[a-z0-9]+$/.test(k))).toBe(false);
    expect(cappedKey('g3', 'add', 'add:20')).toBe('add:20');
    expect(cappedKey('g3', 'word', 'word:add')).toBe('word:add');
  });
  it('Mental Math Blitz is back: every group draws, and a held kind stays out of its grade only', () => {
    for (const g of MM_GROUPS) expect(() => startArcade('mm', 'practice', `mm:${g}`, {}, 0, createRng(1)), `mm:${g}`).not.toThrow();
    expect(gameOk('g3', 'mm')).toBe(true);
    expect(gradeSelections('g3').filter((s) => s.game === 'mm').map((s) => s.key)).toEqual(GRADE_ARCADE.g3.mm!.filter((k) => !CAP_HOLD.g3?.mm?.includes(k)).map((k) => `mm:${k}`));
    expect(gradeSelections('g5').filter((s) => s.game === 'mm').map((s) => s.key).sort()).toEqual(MM_GROUPS.map((g) => `mm:${g}`).sort());
    for (const grade of GRADE_LIST) for (const [game, kinds] of Object.entries(CAP_HOLD[grade] ?? {})) for (const k of kinds ?? []) {
      expect(kindOk(grade, game as ArcadeGame, k)).toBe(false);
      expect(gradeSelections(grade).some((s) => s.key.replace(/@d\d$/, '') === `${game}:${k}`)).toBe(false);
      // A hold matters only while grades.ts still allows the kind and its draws still break the caps; say when not.
      const still = GRADE_ARCADE[grade][game as ArcadeGame]?.includes(k) ? firstBreak(grade, game as ArcadeGame, cappedKey(grade, game as ArcadeGame, `${game}:${k}`), 600) : null;
      if (!still) console.info(`[grade caps] ${grade} ${game}:${k} is held but no longer breaks the caps: drop it from CAP_HOLD`);
    }
  });
  it('every grade selection is in GRADE_ARCADE', () => {
    for (const grade of GRADE_LIST) for (const s of gradeSelections(grade)) {
      const list = GRADE_ARCADE[grade][s.game];
      expect(list, s.key).toBeDefined();
    }
  });
});

describe('grade caps: every allowed selection generates questions within the caps', () => {
  for (const grade of GRADE_LIST) {
    it(`${grade}: ${GRADES[grade].title}`, () => {
      const breaks = new Map<string, string>();
      let n = 0;
      for (const s of gradeSelections(grade)) {
        for (let seed = 1; seed <= SEEDS; seed++) {
          for (const q of draws(s.game, s.key, seed)) {
            n++;
            expect(text(q), s.key).not.toMatch(/undefined|NaN/);
            expect(checkAnswer(q, String(q.answer)), `${s.key} answer ${q.answer}`).toBe(true);
            const why = violatesCaps(grade, { ...q, game: s.game });
            if (why && !breaks.has(s.key)) breaks.set(s.key, `${why} · "${q.prompt.slice(0, 80)}" ${q.expression}`);
          }
        }
      }
      expect(n).toBeGreaterThan(100);
      expect([...breaks].map(([k, v]) => `${k}: ${v}`), `cap breaks for ${grade}`).toEqual([]);
    });
  }
});

describe('grade caps: Math Millionaire', () => {
  it('rung caps rise with the grade and stay on the ladder', () => {
    expect(MILL_TOP.g1).toBeLessThan(MILL_TOP.g3);
    expect(MILL_TOP.g3).toBeLessThan(MILL_TOP.g5);
    expect(MILL_TOP.g5).toBeLessThan(LADDER.length - 1);
    expect(millKindsFor(null).map((k) => k.id)).toEqual(MILL_KINDS.map((k) => k.id));
    expect(millKindsFor('g1').map((k) => k.id)).toEqual(['add', 'sub']);
  });
  it('banking at the top of a capped ladder (the screen sends MILL_NEXT then MILL_WALK) keeps the top prize', () => {
    for (const grade of GRADE_LIST) {
      let s = initialState();
      s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'Ada', avatar: 'a', specialization: 'undecided' });
      s = gameReducer(s, { type: 'MILL_START', kind: millKindsFor(grade)[0].id });
      for (let level = 0; level <= MILL_TOP[grade]; level++) {
        s = gameReducer(s, { type: 'MILL_PICK', index: correctIndex(s.millionaire!) });
        expect(s.millionaire!.status).toBe('reveal');
        if (level < MILL_TOP[grade]) s = gameReducer(s, { type: 'MILL_NEXT' });
      }
      s = gameReducer(s, { type: 'MILL_NEXT' });
      s = gameReducer(s, { type: 'MILL_WALK' });
      const m = s.millionaire!;
      expect(m.status).toBe('walked');
      expect(m.level).toBe(MILL_TOP[grade] + 1);
      expect(m.correct).toBe(MILL_TOP[grade] + 1);
      expect(m.winnings).toBe(LADDER[MILL_TOP[grade]]);
      expect(s.stats.millionaire.best).toBe(LADDER[MILL_TOP[grade]]);
      expect(s.stats.millionaire.bestRung).toBe(MILL_TOP[grade] + 1);
    }
  });
  for (const grade of GRADE_LIST) {
    it(`${grade}: every rung up to the cap stays within the caps`, () => {
      const breaks = new Set<string>();
      for (const k of millKindsFor(grade)) for (let seed = 1; seed <= 25; seed++) {
        let m = startMillionaire(k.id, 0, seed);
        for (let level = 0; level <= MILL_TOP[grade]; level++) {
          expect(m.level).toBe(level);
          const why = violatesCaps(grade, { ...m.question, game: 'word' });
          if (why) breaks.add(`${k.id} rung ${level + 1}: ${why}`);
          m = pickOption(m, correctIndex(m), 1);
          if (level < MILL_TOP[grade]) m = nextRung(m, 2);
        }
      }
      expect([...breaks].slice(0, 12)).toEqual([]);
    });
  }
});

describe('grade caps: runs started outside the lobby', () => {
  it('no grade (or caps off) never stops a run', () => {
    for (const g of ARCADE_GAMES) for (const mode of ['practice', 'blitz', 'speed', 'conquer'] as const) expect(runCapIssue(null, g.id, `${g.id}:all`, mode)).toBeNull();
  });
  it('every lobby selection passes as Practice; Grade 1 never runs a clock', () => {
    for (const grade of GRADE_LIST) for (const s of gradeSelections(grade)) {
      expect(runCapIssue(grade, s.game, s.key, 'practice'), s.key).toBeNull();
      expect(selectionOk(grade, s.game, s.key), s.key).toBe(true);
      for (const mode of ['blitz', 'speed', 'conquer'] as const) expect(runCapIssue(grade, s.game, s.key, mode) === null, `${grade} ${s.key} ${mode}`).toBe(timedModesAllowed(grade));
    }
  });
  it('training after a fight meets the caps: the nearest calm Practice, or none', () => {
    // Grade 1 has no times tables: no swap, the card offers a way back.
    expect(runCapIssue('g1', 'mult', 'mult:7', 'practice')).toEqual({ swap: null });
    expect(runCapIssue('g1', 'mult', 'mult:fact:3x7', 'practice')).toEqual({ swap: null });
    // Word problems at the default difficulty 2 go past 20: play the same kind at Grade 1 size.
    expect(runCapIssue('g1', 'word', 'word:add', 'practice')).toEqual({ swap: 'word:add@d1' });
    expect(runCapIssue('g1', 'add', 'add:100', 'practice')).toEqual({ swap: 'add:20@d1' });
    expect(runCapIssue('g1', 'pattern', 'pattern:shapes@d6', 'practice')).toEqual({ swap: 'pattern:shapes@d2' });
    expect(runCapIssue('g3', 'mult', 'mult:7', 'practice')).toBeNull();
    expect(runCapIssue('g3', 'mult', 'mult:3,4', 'practice')).toBeNull();
    expect(runCapIssue('g3', 'mixed', 'mixed:all', 'practice')).toEqual({ swap: null });
    expect(runCapIssue('g5', 'geo', 'geo:pythag', 'practice')?.swap).toMatch(/^geo:[a-z]+@d6$/);
    // Smaller than the grade's size is fine (a picture game's default difficulty 2 for Grade 5).
    expect(runCapIssue('g5', 'geo', 'geo:angles', 'practice')).toBeNull();
    // Academy drills follow the academy a grown-up opened.
    for (const grade of GRADE_LIST) expect(runCapIssue(grade, 'academy', 'academy:arithmetic.count', 'practice')).toBeNull();
    // Every swap is itself a selection the grade may play, within its caps.
    for (const grade of GRADE_LIST) for (const g of ARCADE_GAMES) for (const k of lobbyKinds(g.id)) {
      const swap = runCapIssue(grade, g.id, `${g.id}:${k}`, 'practice')?.swap;
      if (!swap) continue;
      expect(runCapIssue(grade, g.id, swap, 'practice'), `${grade} ${g.id}:${k} -> ${swap}`).toBeNull();
      expect(firstBreak(grade, g.id, swap, 20), `${grade} ${swap}`).toBeNull();
    }
  });
});

describe('grade caps: pickers, lessons and levels', () => {
  const MATH = ['mixed:all', 'mult:all', 'div:all', 'mental:all', 'bonds:100', 'word:mixed', 'tricks:all', 'alg:all', 'volume:all', 'measure:all', 'geo:all', 'rates:all', 'spiral:all', 'precalc:all']
    .map((k) => ({ key: k, game: k.split(':')[0] as ArcadeGame, selection: k }));
  it('Stud Math and Weakest Gear lists keep only what the grade may play', () => {
    expect(capMath(null, MATH)).toEqual(MATH);
    expect(capMath('g1', MATH)).toEqual([]);
    expect(capMath('g3', MATH).map((m) => m.key)).toEqual(['mult:all', 'div:all', 'mental:all', 'word:mixed']);
    const g5 = capMath('g5', MATH).map((m) => m.key);
    expect(g5).toContain('bonds:100');
    expect(g5).not.toContain('mixed:all');
    expect(g5).not.toContain('geo:all');
    expect(g5).not.toContain('precalc:all');
  });
  it('lesson buttons follow the caps', () => {
    for (const l of LESSONS) expect(lessonOk(null, l.id)).toBe(true);
    // Grade 1: every practice step at no more than the grade's difficulty for that game, and no number past 20 in the
    // teaching text. "Fill it with cubes" practises 4 × 4 × 3 stacks at difficulty 2 and says "× 2 (layers) = 24".
    expect(lessonOk('g1', 'l.volume-cubes')).toBe(false);
    expect(lessonOk('g3', 'l.volume-cubes')).toBe(true);
    for (const id of ['l.paths-1', 'l.data-1', 'l.logic-1']) expect(lessonOk('g1', id), id).toBe(false);
    for (const id of ['l.pattern-1', 'l.grid-1']) expect(lessonOk('g1', id), id).toBe(true);
    // A percent in the percent game's own lesson is fine for Grade 3.
    expect(lessonOk('g3', 'l.pctmulti-1')).toBe(true);
    expect(lessonOk('g1', 'l.volume-formula')).toBe(false);
    expect(lessonOk('g1', 'l.volume-jug')).toBe(false);
    expect(lessonOk('g1', 'l.word-detective')).toBe(false);
    expect(lessonOk('g1', 'l.measure-what')).toBe(false);
    expect(lessonOk('g3', 'l.measure-what')).toBe(true);
    expect(lessonOk('g3', 'l.measure-convert')).toBe(false);
    expect(lessonOk('g5', 'l.measure-convert')).toBe(true);
    expect(lessonOk('g1', 'l.pattern-1')).toBe(true);
    expect(lessonOk('g1', 'l.pattern-2')).toBe(false);
    expect(lessonOk('g1', 'l.pattern-3')).toBe(false);
    expect(lessonOk('g5', 'l.pattern-3')).toBe(true);
    expect(lessonOk('g1', 'l.no-such-lesson')).toBe(false);
  });
  it('Tycoon: Junior only for Grade 1 (Explorer brings percentages), Junior and Explorer for Grade 3, all for Grade 5', () => {
    expect(tycoonLevels('g1')).toEqual(['junior']);
    expect(tycoonLevels('g3')).toEqual(['junior', 'explorer']);
    expect(tycoonLevels('g5')).toEqual(['junior', 'explorer', 'tycoon']);
    expect(tycoonLevels(null)).toEqual(['junior', 'explorer', 'tycoon']);
  });
});

describe('grade caps: Millionaire screen', () => {
  it('Grade 1 sees only + and − setups (at least two), always including the right one', () => {
    for (const k of millKindsFor('g1')) for (let seed = 1; seed <= 60; seed++) {
      let m = startMillionaire(k.id, 0, seed);
      for (let level = 0; level <= MILL_TOP.g1; level++) {
        const ci = correctIndex(m);
        const shown = m.options.filter((o, i) => millOptionShown('g1', o, i === ci));
        expect(shown.length, `${k.id} seed ${seed} rung ${level + 1}`).toBeGreaterThanOrEqual(2);
        expect(shown.some((o) => /[×÷]/.test(o))).toBe(false);
        expect(shown).toContain(m.options[ci]);
        m = nextRung(pickOption(m, ci, 1), 2);
      }
    }
    // Everyone else sees every option.
    expect(millOptionShown('g3', '4 × 5', false)).toBe(true);
    expect(millOptionShown(null, '4 ÷ 5', false)).toBe(true);
  });
  it('after banking at the top the header names the top rung, not the one past it', () => {
    for (const grade of GRADE_LIST) {
      expect(millHeaderLevel(grade, MILL_TOP[grade] + 1, true)).toBe(MILL_TOP[grade]);
      expect(millHeaderLevel(grade, 1, false)).toBe(1);
    }
    expect(millHeaderLevel(null, 6, true)).toBe(6);
  });
});

/** Numbers and percents in a text, read independently of violatesCaps. */
function capBreak(grade: GradeId, text: string, game?: string): string | null {
  const max = { g1: 20, g3: 1000, g5: Infinity }[grade];
  const big = [...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, ''))).find((n) => n > max);
  if (big !== undefined) return `number ${big}`;
  if (grade === 'g1' && /%|percent/i.test(text)) return 'percent';
  if (grade === 'g3' && /%|percent/i.test(text) && game !== 'pctmulti') return 'percent';
  return null;
}

describe('grade caps: lessons a capped grade may open', () => {
  for (const grade of GRADE_LIST) {
    it(`${grade}: every practice step (as the lesson runner draws it) and the teaching text stay within the caps`, () => {
      const shown = LESSONS.filter((l) => lessonOk(grade, l.id));
      expect(shown.length).toBeGreaterThan(1);
      const breaks: string[] = [];
      for (const l of shown) {
        const games = new Set<string>();
        for (const step of l.steps) {
          if (step.type !== 'try') continue;
          const sk = skillKind(step.skillId)!;
          games.add(sk.game);
          expect(step.difficulty, `${l.id} ${step.skillId}`).toBeLessThanOrEqual(gameDifficulty(grade, sk.game));
          // The runner: generateQuestion(step.skillId, mastery, { rng, difficulty: step.difficulty }).
          for (let seed = 1; seed <= 200; seed++) {
            const q = generateQuestion(step.skillId, {}, { rng: createRng(seed), difficulty: step.difficulty });
            const why = capBreak(grade, `${q.prompt} ${q.expression} ${q.hint} ${q.answer}`, sk.game);
            if (why) { breaks.push(`${l.id} ${step.skillId} d${step.difficulty} seed ${seed}: ${why} · ${q.prompt.slice(0, 60)}`); break; }
          }
        }
        const words = [l.summary, ...l.steps.map((st) => (st.type === 'say' ? `${st.text} ${st.caption ?? ''}` : st.type === 'try' ? st.intro : st.points.join(' ')))].join(' ');
        const why = capBreak(grade, words, games.size === 1 ? [...games][0] : undefined);
        if (why) breaks.push(`${l.id} text: ${why}`);
      }
      expect(breaks).toEqual([]);
    });
  }
});

describe("grade caps: friends' rounds", () => {
  // An uncapped host's default plan (VersusScreen RAMP, after the host's own pick).
  const RAMP = ['mult:all', 'div:all', 'add:100', 'sub:100', 'bonds:100', 'word:mixed', 'alg:all', 'tricks:all', 'mixed:all'];
  const gameOf = (k: string) => k.split(':')[0] as ArcadeGame;
  it('levels the capped lobby sets up always play; a joined plan is checked level by level', () => {
    for (const g of ARCADE_GAMES) for (const k of lobbyKinds(g.id)) expect(versusCapIssue(null, g.id, `${g.id}:${k}`)).toBe(false);
    for (const s of gradeSelections('g1')) expect(versusCapIssue('g1', s.game, s.key), s.key).toBe(true);
    for (const grade of ['g3', 'g5'] as GradeId[]) for (const s of gradeSelections(grade)) expect(versusCapIssue(grade, s.game, s.key), `${grade} ${s.key}`).toBe(false);
    const g3Out = RAMP.filter((k) => versusCapIssue('g3', gameOf(k), k));
    expect(g3Out).toEqual(['alg:all', 'tricks:all', 'mixed:all']);
    expect(RAMP.filter((k) => versusCapIssue('g5', gameOf(k), k))).toEqual(['mixed:all']);
    // What a Grade 3 joiner does play from that plan stays within the caps (the seeded draws everyone shares).
    for (const k of RAMP.filter((x) => !g3Out.includes(x))) {
      const sel = parseSelection(gameOf(k), k);
      for (let seed = 1; seed <= 200; seed++) {
        const q = drawSeeded(sel, seed * 7919, seed % 40);
        expect(capBreak('g3', `${q.prompt} ${q.expression} ${q.hint} ${q.answer}`), `${k} seed ${seed}: ${q.expression}`).toBeNull();
      }
    }
  });
  const joined = (grade: GradeId | null, selection: string) => {
    let s = gameReducer(initialState(), { type: 'CREATE_CHARACTER', name: 'Ada', avatar: 'a', specialization: 'undecided' });
    s = { ...s, contest: { ...s.contest, grade, caps: true } };
    s = gameReducer(s, { type: 'VERSUS_SETUP', kind: 'online', game: 'mult', selection: 'mult:all', names: ['Ada'], roomCode: 'WXYZ', isHost: false, durationMs: 60_000 });
    const me = s.versus!.myId;
    s = gameReducer(s, { type: 'VERSUS_ROUND', seed: 7, game: gameOf(selection), selection, startAt: Date.now() + 1000, players: [{ id: 'host', name: 'Host' }, { id: me, name: 'Ada' }], level: 7, plan: RAMP.map((k) => ({ game: gameOf(k), selection: k })) });
    return gameReducer(s, { type: 'VERSUS_BEGIN_TURN' });
  };
  it("a Grade 3 joiner meets a calm card for the host's Math tricks level, sits it out at 0, and the match goes on", () => {
    let s = joined('g3', 'tricks:all');
    expect(s.arcade?.versus).toBe(true);
    const html = render(s, createElement(ArcadeScreen));
    expect(html).toContain('Sit this level out');
    expect(html).toContain('Leave the match');
    expect(html).toContain('Grade 3 Bridge');
    s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
    expect(s.arcade!.status).toBe('finished');
    const mine = s.versus!.players.find((p) => p.isMe)!;
    expect(mine.done).toBe(true);
    expect(mine.score).toBe(0);
    s = gameReducer(s, { type: 'VERSUS_CONTINUE' });
    expect(s.versus).not.toBeNull();
    // A level on the path plays as usual.
    expect(versusCapIssue('g3', 'mult', 'mult:all')).toBe(false);
  });
  it('Grade 1 only leaves; with no grade the level plays', () => {
    const html = render(joined('g1', 'add:100'), createElement(ArcadeScreen));
    expect(html).toContain('Leave the match');
    expect(html).not.toContain('Sit this level out');
    expect(versusCapIssue(null, 'tricks', 'tricks:all')).toBe(false);
    expect(versusCapIssue(capGrade({ grade: 'g3', caps: false } as never), 'tricks', 'tricks:all')).toBe(false);
  });
});

describe('grade caps: Weakest Gear climbs the chain', () => {
  it('the math a grade sees stays within its caps all the way up the chain', () => {
    expect(capMath(null, GEAR_MATH, true)).toEqual(GEAR_MATH);
    expect(capMath('g3', GEAR_MATH, true).map((m) => m.key)).toEqual(['mult:all', 'div:all', 'mental:all']);
    // Stud Math does not climb: word problems stay there.
    expect(capMath('g3', GEAR_MATH).map((m) => m.key)).toContain('word:mixed');
    const breaks: string[] = [];
    for (const grade of GRADE_LIST) for (const m of capMath(grade, GEAR_MATH, true)) {
      const sel = parseSelection(m.game, m.selection);
      for (let chain = 0; chain <= CHAIN.length; chain++) {
        // gear.ts: the chain adds half its length to the selection's difficulty, up to 6.
        const d = Math.max(1, Math.min(6, sel.difficulty + Math.floor(chain / 2))) as Difficulty;
        for (let seed = 1; seed <= 80; seed++) {
          const q = generateFromSkills(sel.skillIds, {}, { rng: createRng(seed * 31 + chain), difficulty: d, recentFacts: [] });
          const why = capBreak(grade, `${q.prompt} ${q.expression} ${q.hint} ${q.answer}`);
          if (why) { breaks.push(`${grade} ${m.key} chain ${chain} d${d}: ${why}`); break; }
        }
      }
    }
    expect(breaks).toEqual([]);
    // A hold matters only while the selection still breaks the caps when it climbs; say when not.
    for (const grade of GRADE_LIST) for (const key of RAMP_HOLD[grade] ?? []) {
      const m = GEAR_MATH.find((x) => x.selection === key)!;
      const sel = parseSelection(m.game, m.selection);
      let still = false;
      for (let seed = 1; seed <= 400 && !still; seed++) still = !!capBreak(grade, (({ prompt, expression, hint, answer }) => `${prompt} ${expression} ${hint} ${answer}`)(generateFromSkills(sel.skillIds, {}, { rng: createRng(seed), difficulty: 6, recentFacts: [] })));
      if (!still) console.info(`[grade caps] ${grade} ${key} is held for Weakest Gear but no longer breaks the caps: drop it from RAMP_HOLD`);
    }
  });
  it("an arena someone else hosts is checked against the grade", () => {
    expect(gearSelectionOk(null, 'precalc', 'precalc:all')).toBe(true);
    expect(gearSelectionOk('g3', 'word', 'word:mixed')).toBe(false);
    expect(gearSelectionOk('g3', 'mult', 'mult:all')).toBe(true);
    expect(gearSelectionOk('g3', 'bonds', 'bonds:20')).toBe(true);
    expect(gearSelectionOk('g3', 'bonds', 'bonds:35')).toBe(false);
    expect(gearSelectionOk('g5', 'precalc', 'precalc:all')).toBe(false);
    expect(gearSelectionOk('g5', 'word', 'word:mixed')).toBe(true);
  });
});

describe('grade caps: Tycoon tables someone else hosts', () => {
  const guest = (level: 'junior' | 'explorer' | 'tycoon', rev = 2) => ({ ...guestLobby('ABCD', { id: 'me', name: 'Ada' }, 0), level, rev });
  it("a guest learns the host's level, and a level above the grade's gets a calm card", () => {
    // Before the host's first update the guest's own placeholder level says nothing.
    expect(tycoonGuestBlocked('g1', guest('explorer', 0))).toBe(false);
    expect(tycoonGuestBlocked('g1', guest('explorer'))).toBe(true);
    expect(tycoonGuestBlocked('g1', guest('junior'))).toBe(false);
    expect(tycoonGuestBlocked('g3', guest('explorer'))).toBe(false);
    expect(tycoonGuestBlocked('g3', guest('tycoon'))).toBe(true);
    expect(tycoonGuestBlocked('g5', guest('tycoon'))).toBe(false);
    expect(tycoonGuestBlocked(null, guest('tycoon'))).toBe(false);
    // The host's own table is never blocked here (the host picked from the grade's levels).
    const g = guest('tycoon');
    expect(tycoonGuestBlocked('g1', { ...g, online: { ...g.online!, host: true } })).toBe(false);
    const s0 = initialState();
    const html = render({ ...s0, contest: { ...s0.contest, grade: 'g1', caps: true }, tycoon: guest('explorer') }, createElement(TycoonScreen));
    expect(html).toContain('Explorer level');
    expect(html).toContain('Leave room');
  });
});

describe('grade caps: the Rocket Game clock gate (ClockGate, for RocketScreen)', () => {
  it('no grade shows the game; Grade 1 never; Grades 3 and 5 after a yes, here or in the Arcade lobby', () => {
    const el = createElement(ClockGate, { title: 'Rocket Game', what: 'Every question has a clock.', children: createElement('i', null, 'ROCKET') });
    const s0 = initialState();
    const at = (grade: GradeId | null, caps = true, params: Record<string, string> = {}): GameState => ({ ...s0, contest: { ...s0.contest, grade, caps }, screenParams: params });
    expect(render(s0, el)).toContain('ROCKET');
    expect(render(at('g1', false), el)).toContain('ROCKET');
    expect(render(at('g1'), el)).not.toContain('ROCKET');
    expect(render(at('g1'), el)).toContain('not on the Grade 1 Foundation path');
    expect(render(at('g1', true, { clock: 'yes' }), el)).not.toContain('ROCKET');
    for (const g of ['g3', 'g5'] as GradeId[]) {
      expect(render(at(g), el)).not.toContain('ROCKET');
      expect(render(at(g), el)).toContain('Practice was calm; this round has a clock.');
      expect(render(at(g, true, { clock: 'yes' }), el)).toContain('ROCKET');
    }
  });
});
