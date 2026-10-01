import type { GradeId } from './common';
import type { Question, Visual } from '../types';

/** The day's theme from the parent plan (Mon Number … Sun Off). */
export type ThemeId = 'number' | 'picture' | 'stories' | 'logic' | 'mix' | 'play' | 'rest';
/** A track session, a 3-item peek at the next grade, or the Grade 5 mini-mock. */
export type RunMode = 'session' | 'preview' | 'mock';
/** The mini-mock's skill buckets (results are shown per bucket, never as a score). */
export type MockSkill = 'arith' | 'geometry' | 'counting' | 'data' | 'pattern' | 'logic' | 'percent' | 'ratio';

export interface RunItem {
  /** Where it came from: game, kind and difficulty ("pattern:shapes@d1", "stories:join@d2"). */
  key: string; game: string; kind: string;
  section: 'warm' | 'play' | 'mock';
  question: Question;
  /** Mini-mock: the skill this item counts toward. */
  skill?: MockSkill;
}
/** One teach card: the worked 'say' steps of a contest lesson (or a solved picture puzzle). */
export interface TeachCard { lessonId?: string; title: string; game: string; steps: { speaker: string; text: string; visual?: Visual; caption?: string }[] }
export interface ItemResult { correct: boolean; firstTry: boolean; tries: number; timeMs: number; timed: boolean }
/** The consent clock: offered before the last items (Grade 3) or the mock (Grade 5), never in Grade 1. */
export interface RunClock { state: 'off' | 'offered' | 'on' | 'declined'; ms: number; startedAt?: number; offerAt: number }

/** A session in progress. It lives in the save, so it survives a reload. */
export interface ContestRun {
  v: 1; id: string; mode: RunMode;
  /** The grade the items are pitched at (a preview plays the next grade up) and the player's own grade. */
  grade: GradeId; home: GradeId;
  day: number; date: string; theme: ThemeId; focus: string;
  items: RunItem[];
  teach: TeachCard | null;
  /** The teach card shows once this many items are done (after the warm-up). */
  teachAt: number; teachSeen: boolean; teachStep: number;
  /** Items still to play, the current one first. */
  queue: number[];
  /** Items flagged with Skip & come back (Grade 5): they wait at the end of the queue. */
  flagged: number[];
  results: Record<number, ItemResult>;
  phase: 'play' | 'teach' | 'consent' | 'over';
  attempts: number;
  feedback?: { correct: boolean; text: string };
  hintShown: boolean; showExplanation: boolean;
  questionStartedAt: number; startedAt: number; lastAt: number;
  clock: RunClock;
  calmMs: number; timedMs: number;
  /** Left for the hub with Pause: the hub offers Resume. */
  paused?: boolean;
  finishedAt?: number;
}

export interface ContestHistoryEntry {
  at: number; date: string; grade: GradeId; mode: RunMode; theme: ThemeId;
  items: number; right: number; firstTry: number; calmMs: number; timedMs: number; skills: string[];
  /** Mini-mock: [right, asked] per skill bucket. */
  mock?: Partial<Record<MockSkill, [number, number]>>;
}

/**
 * The Contest Path save slice. `grade` is this profile's track (each child keeps their own); `caps` hides Arcade games
 * and kinds above the grade (a grown-up can turn it off). `run` is a session in progress; `history` every finished one.
 */
export interface ContestState {
  grade: GradeId | null;
  caps: boolean;
  run: ContestRun | null;
  history: ContestHistoryEntry[];
}
export const initialContest = (): ContestState => ({ grade: null, caps: true, run: null, history: [] });

const GRADE_OK = (g: unknown): g is GradeId => g === 'g1' || g === 'g3' || g === 'g5';
const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
const isQuestion = (q: unknown) => !!q && typeof q === 'object' && typeof (q as Question).prompt === 'string' && typeof (q as Question).expression === 'string' && num((q as Question).answer) && !!(q as Question).visual;
const MODES = ['session', 'preview', 'mock'];
const PHASES = ['play', 'teach', 'consent', 'over'];

/** A saved run, if it is whole; anything odd (an old or broken save) is dropped rather than crashing the screen. */
function migrateRun(raw: unknown): ContestRun | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as ContestRun;
  if (r.v !== 1 || !MODES.includes(r.mode) || !PHASES.includes(r.phase) || !GRADE_OK(r.grade) || !GRADE_OK(r.home)) return null;
  if (!Array.isArray(r.items) || !r.items.length || !r.items.every((it) => it && typeof it === 'object' && isQuestion(it.question))) return null;
  if (!Array.isArray(r.queue) || !r.queue.every((i) => Number.isInteger(i) && i >= 0 && i < r.items.length)) return null;
  if (r.phase !== 'over' && !r.queue.length) return null;
  const clock = r.clock && typeof r.clock === 'object' && ['off', 'offered', 'on', 'declined'].includes(r.clock.state) ? r.clock : { state: 'off' as const, ms: 0, offerAt: 0 };
  return {
    ...r, clock, flagged: Array.isArray(r.flagged) ? r.flagged.filter((i) => Number.isInteger(i)) : [],
    results: r.results && typeof r.results === 'object' ? r.results : {},
    calmMs: num(r.calmMs) ? r.calmMs : 0, timedMs: num(r.timedMs) ? r.timedMs : 0,
    attempts: num(r.attempts) ? r.attempts : 0, teach: r.teach && Array.isArray(r.teach.steps) ? r.teach : null,
    teachAt: num(r.teachAt) ? r.teachAt : 0, teachStep: num(r.teachStep) ? r.teachStep : 0, teachSeen: !!r.teachSeen,
    hintShown: !!r.hintShown, showExplanation: !!r.showExplanation,
    questionStartedAt: num(r.questionStartedAt) ? r.questionStartedAt : 0, startedAt: num(r.startedAt) ? r.startedAt : 0, lastAt: num(r.lastAt) ? r.lastAt : 0,
  };
}
function migrateHistory(raw: unknown): ContestHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((h) => h && typeof h === 'object' && num(h.at) && typeof h.date === 'string' && GRADE_OK(h.grade) && MODES.includes(h.mode) && num(h.items) && num(h.right))
    .map((h: ContestHistoryEntry) => ({ ...h, firstTry: num(h.firstTry) ? h.firstTry : h.right, calmMs: num(h.calmMs) ? h.calmMs : 0, timedMs: num(h.timedMs) ? h.timedMs : 0, skills: Array.isArray(h.skills) ? h.skills.filter((x) => typeof x === 'string') : [] }))
    .slice(-300);
}
/** Old saves have no slice (or no run and history); bad values fall back to the defaults. */
export function migrateContest(raw: unknown): ContestState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<ContestState>;
  const grade = GRADE_OK(r.grade) ? r.grade : null;
  // A run belongs to the grade it was started on: one from another grade (or with no grade set) is dropped.
  const run = migrateRun(r.run);
  return { ...initialContest(), ...r, grade, caps: r.caps !== false, run: run && run.home === grade ? run : null, history: migrateHistory(r.history) };
}
