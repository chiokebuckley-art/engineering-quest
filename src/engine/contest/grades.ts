import type { Difficulty, Question } from '../types';
import type { ArcadeGame } from '../state/types';
import { GRADE_DIFFICULTY, type GradeId, type KindGrades } from './common';
import { PATTERN_KIND_GRADES } from '../questions/patterns';
import { BLOCKS_KIND_GRADES } from '../questions/spatialBlocks';
import { PATHS_KIND_GRADES } from '../questions/countingPaths';
import { DATA_KIND_GRADES } from '../questions/dataLite';
import { LOGIC_KIND_GRADES } from '../questions/logicLite';
import { PCTMULTI_KIND_GRADES } from '../questions/percentMulti';
import { GRID_KIND_GRADES } from '../questions/gridShapes';

export type { GradeId } from './common';

/**
 * Contest Path grade profiles: AMC 8–style practice inspired by common contest skills, capped by grade.
 * Calm is the default everywhere; a clock only ever appears after the player agrees to it, and never in Grade 1.
 */
export interface GradeProfile {
  id: GradeId; grade: 1 | 3 | 5;
  /** "Grade 1 Foundation" etc. */
  title: string;
  /** The track's world name. */
  track: string;
  goal: string;
  /** Suggested session length, minutes. */
  minutes: [number, number];
  difficulty: [Difficulty, Difficulty];
  /** Largest number a question may show (prompt, picture, answer); null = no cap. */
  maxNumber: number | null;
  /** Percent allowed: none (g1), single-step "out of 100" (g3), everything (g5). */
  percent: 'none' | 'simple' | 'all';
  /** Read prompts aloud by default. */
  readAloud: boolean;
  /** A clock may be offered (with consent). Grade 1: never. */
  timerOffer: boolean;
  /** Short reminder of what the track is not. */
  isNot: string;
}

export const GRADES: Record<GradeId, GradeProfile> = {
  g1: {
    id: 'g1', grade: 1, title: 'Grade 1 Foundation', track: 'Signal Cubes',
    goal: 'Contest habits and picture thinking: notice a pattern, try a picture, check a guess, enjoy a short puzzle.',
    minutes: [10, 12], difficulty: GRADE_DIFFICULTY.g1, maxNumber: 20, percent: 'none', readAloud: true, timerOffer: false,
    isNot: 'Not AMC 8 readiness: habits and joy first.',
  },
  g3: {
    id: 'g3', grade: 3, title: 'Grade 3 Bridge', track: 'Gear Trail',
    goal: 'Early contest thinking: two-step stories, early fractions, perimeter, bar charts, small counting, pattern rules.',
    minutes: [12, 18], difficulty: GRADE_DIFFICULTY.g3, maxNumber: 1000, percent: 'simple', readAloud: false, timerOffer: true,
    isNot: 'Not "ready for all 25 AMC 8 items": climbing toward contest skills.',
  },
  g5: {
    id: 'g5', grade: 5, title: 'Grade 5 Contest Ramp', track: 'Tariff Trials',
    goal: 'First serious AMC 8–style training: creative fractions, decimals, percent and ratio, composites, counting, data and logic.',
    minutes: [15, 20], difficulty: GRADE_DIFFICULTY.g5, maxNumber: null, percent: 'all', readAloud: false, timerOffer: true,
    isNot: 'Not a score guarantee: aims at comfort on the first 10 to 15 AMC 8–style items, with original practice.',
  },
};

/** Print this on every Contest Path screen. */
export const CONTEST_DISCLAIMER = 'AMC 8–style practice inspired by common contest skills. Not affiliated with, endorsed by, or an official product of the Mathematical Association of America (MAA) or Art of Problem Solving.';

/** The new Contest Path games and the grades each kind suits. */
export const CONTEST_KIND_GRADES: Record<string, KindGrades> = {
  pattern: PATTERN_KIND_GRADES, blocks: BLOCKS_KIND_GRADES, paths: PATHS_KIND_GRADES, data: DATA_KIND_GRADES,
  logic: LOGIC_KIND_GRADES, pctmulti: PCTMULTI_KIND_GRADES, grid: GRID_KIND_GRADES,
};

/**
 * Existing Arcade games each grade may use, by kind ('*' = every kind). Anything not listed is hidden while a grade is
 * set (a grown-up can show everything). Grade 1 never meets a percent, a clock, or the card table.
 */
export const GRADE_ARCADE: Record<GradeId, Partial<Record<ArcadeGame, string[]>>> = {
  g1: {
    add: ['20'], sub: ['20'], bonds: ['5', '10', '20'], word: ['add', 'sub'], frac: ['shade'], measure: ['compare'], volume: ['cubes'],
  },
  g3: {
    add: ['20', '100', '1000'], sub: ['20', '100', '1000'], bonds: ['10', '20', '50', '100'], mult: ['*'], div: ['*'],
    word: ['add', 'sub', 'mult', 'div', 'twostep', 'mixed'], mental: ['*'], mm: ['add', 'sub'],
    frac: ['shade', 'equiv', 'compare', 'addsame'], ratio: ['table', 'ppw'], measure: ['compare', 'ruler', 'time', 'shape', 'estimate'],
    volume: ['cubes'], spiral: ['pvalue'],
  },
  g5: {
    add: ['*'], sub: ['*'], bonds: ['*'], mult: ['*'], div: ['*'], word: ['*'], mental: ['*'], mm: ['*'], tricks: ['*'], alg: ['*'],
    frac: ['*'], ratio: ['*'], measure: ['*'], volume: ['*'], spiral: ['*'], geo: ['protractor', 'angles', 'circle', 'scale'],
    rates: ['ratio', 'speed'], prob: ['count'],
  },
};
for (const g of ['g1', 'g3', 'g5'] as GradeId[]) for (const [game, kinds] of Object.entries(CONTEST_KIND_GRADES)) {
  const ok = Object.entries(kinds).filter(([, gs]) => gs.includes(g)).map(([k]) => k);
  if (ok.length) GRADE_ARCADE[g][game as ArcadeGame] = ok;
}

/** May a player on this grade use this Arcade game (and kind)? `kind` is the part after "game:" in a selection key. */
export function arcadeAllowed(grade: GradeId, game: ArcadeGame, kind?: string): boolean {
  const kinds = GRADE_ARCADE[grade][game];
  if (!kinds) return false;
  if (!kind || kind === 'all' || kinds.includes('*')) return true;
  return kinds.includes(kind);
}
/**
 * Some existing generators only fit a grade at the bottom of its band (Grade 1 word problems, sums and cube stacks stay
 * within 20 at difficulty 1, not at 2). Track pickers and the Arcade play these games at this difficulty instead.
 */
export const GRADE_GAME_DIFFICULTY: Partial<Record<GradeId, Partial<Record<ArcadeGame, Difficulty>>>> = { g1: { word: 1, add: 1, sub: 1, volume: 1 } };
/** The difficulty a grade should play an existing Arcade game at. */
export const gameDifficulty = (grade: GradeId, game: ArcadeGame, warm = false): Difficulty => GRADE_GAME_DIFFICULTY[grade]?.[game] ?? gradeDifficulty(grade, warm);
/** Timed Arcade modes a grade may choose (after consent): none for Grade 1. */
export const timedModesAllowed = (grade: GradeId) => GRADES[grade].timerOffer;
/** The difficulty a grade plays existing generators at (the top of its band for practice, the bottom for warm-ups). */
export const gradeDifficulty = (grade: GradeId, warm = false): Difficulty => GRADES[grade].difficulty[warm ? 0 : 1];

const NUMBERS = /\d[\d,]*(?:\.\d+)?/g;
/**
 * Does a generated question break its grade's caps? Grade 1: any number over 20, or any percent. Grade 3: numbers
 * over 1,000, or a percent other than a simple "out of 100". Track pickers redraw until this is false.
 */
export function violatesCaps(grade: GradeId, q: Pick<Question, 'prompt' | 'expression' | 'answer' | 'hint'> & { game?: string }): string | null {
  const p = GRADES[grade];
  const text = `${q.prompt} ${q.expression} ${q.hint}`;
  if (p.percent === 'none' && /%|percent/i.test(text)) return 'percent';
  if (p.percent === 'simple' && /%|percent/i.test(text) && q.game !== 'pctmulti') return 'percent outside the out-of-100 kind';
  if (p.maxNumber !== null) {
    const nums = [...text.matchAll(NUMBERS)].map((m) => Number(m[0].replace(/,/g, ''))).concat(Math.abs(q.answer));
    const big = nums.find((n) => n > p.maxNumber!);
    if (big !== undefined) return `number ${big} over ${p.maxNumber}`;
  }
  return null;
}
