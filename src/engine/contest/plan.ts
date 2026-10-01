import type { MasteryRecord } from '../types';
import type { GradeId } from './common';
import type { ContestHistoryEntry, ContestState, ThemeId } from './state';
import { PICTURE_GAMES, CONTEST_GAME_IDS } from '../questions/games';
import { STORY_KINDS, STORY_META } from './stories';

/**
 * The parent plan: a theme for each day of the week, the active grade's 4-day plan (Mon–Thu, plus a Friday mix),
 * the week so far (calm and timed minutes, sessions, lanterns) and a 5-point checklist for grown-ups.
 */
export interface DayTheme { id: ThemeId; name: string; short: string; about: string; dayName: string }
/** Indexed by Date#getDay(): 0 = Sunday. */
export const DAY_THEMES: DayTheme[] = [
  { id: 'rest', dayName: 'Sun', name: 'Rest day', short: 'Off', about: 'No session today. Rest is part of training.' },
  { id: 'number', dayName: 'Mon', name: 'Number day', short: 'Number', about: 'Number trains, quick sums and number puzzles.' },
  { id: 'picture', dayName: 'Tue', name: 'Picture and space day', short: 'Picture/space', about: 'Cubes, grids and shapes: see it, then count it.' },
  { id: 'stories', dayName: 'Wed', name: 'Story day', short: 'Stories', about: 'Little stories to picture and solve.' },
  { id: 'logic', dayName: 'Thu', name: 'Logic and counting day', short: 'Logic/count', about: 'True or false, who has what, and ways to count.' },
  { id: 'mix', dayName: 'Fri', name: 'Mix day', short: 'Mix', about: 'A bit of everything from the week.' },
  { id: 'play', dayName: 'Sat', name: 'Play day', short: 'Play', about: 'Free choice: Equation Plaza, Dice Workshop or Tycoon Junior.' },
];
export const themeForDay = (day: number): DayTheme => DAY_THEMES[((day % 7) + 7) % 7];

/** The game whose lesson gives the day's teach card. */
export const FOCUS: Record<ThemeId, Record<GradeId, string>> = {
  number: { g1: 'pattern', g3: 'pattern', g5: 'pctmulti' },
  picture: { g1: 'blocks', g3: 'blocks', g5: 'blocks' },
  stories: { g1: 'paths', g3: 'paths', g5: 'paths' },
  logic: { g1: 'logic', g3: 'logic', g5: 'logic' },
  mix: { g1: 'data', g3: 'data', g5: 'data' },
  play: { g1: 'pattern', g3: 'pattern', g5: 'pattern' },
  rest: { g1: 'pattern', g3: 'pattern', g5: 'pattern' },
};

/** What each weekday holds for each grade (the parent card's plan). */
const PLAN_TEXT: Record<GradeId, Record<'number' | 'picture' | 'stories' | 'logic' | 'mix', string>> = {
  g1: {
    number: 'Number trains, sums to 20 and a picture story.',
    picture: 'Count cubes, shape trains and mirror pictures.',
    stories: 'Picture stories: some come, some go, how many more.',
    logic: 'True, false or can\'t tell; outfits, cubes and pictures to count.',
    mix: 'A calm mix of the week, then one Notebook card.',
  },
  g3: {
    number: 'Number patterns, function machines and two-step sums.',
    picture: 'Hidden cubes, layers, and shapes on a grid.',
    stories: 'Two-step stories, outfits and menus to count.',
    logic: 'Logic grids, who stands where, and Venn diagrams.',
    mix: 'Mixed review; a clock for the last 4 only if they want it.',
  },
  g5: {
    number: 'Percent steps, far terms of patterns, fractions of a whole.',
    picture: 'Hidden and painted cubes, grids, area and perimeter.',
    stories: 'Multi-step stories, line-ups and routes to count.',
    logic: 'Logic grids, truth-tellers and fibbers, must or might.',
    mix: 'The 10-item mini-mock: calm, or a 15-minute clock if they agree.',
  },
};
export interface PlanLine { day: string; theme: string; what: string }
/** Mon–Thu plus the Friday mix for a grade. */
export function weekPlan(grade: GradeId): PlanLine[] {
  return ([1, 2, 3, 4, 5] as const).map((d) => {
    const t = DAY_THEMES[d];
    return { day: t.dayName, theme: t.short, what: PLAN_TEXT[grade][t.id as keyof typeof PLAN_TEXT['g1']] };
  });
}

/** The 5-point checklist for grown-ups. */
export const PARENT_CHECKLIST: string[] = [
  'Default to Calm. Offer the clock only if your child wants it, and never in Grade 1.',
  'Clear one old Notebook card in each session.',
  'Celebrate the process: the picture drawn, the guess checked, the second try. Not the score.',
  'If there are tears, drop Thursday logic and shorten sessions to 8 minutes.',
  'Never use real contest papers with young kids. Every item here is original.',
];

/* ---------------- the week so far ---------------- */

/** Local midnight of the Monday that starts the week holding `now`. */
export function weekStart(now: number): number {
  const d = new Date(now); d.setHours(0, 0, 0, 0);
  const back = (d.getDay() + 6) % 7; // Monday = 0 back
  d.setDate(d.getDate() - back);
  return d.getTime();
}
export interface WeekSummary {
  sessions: number; items: number; right: number; firstTry: number;
  calmMin: number; timedMin: number;
  /** Lanterns, Monday first: a session (or the mini-mock) finished that day. */
  lanterns: boolean[];
  /** Weeks in a row (this one, or last one if this week has none yet) with at least one session. */
  streakWeeks: number;
}
const counts = (h: ContestHistoryEntry) => h.mode !== 'preview';
export function weekSummary(history: ContestHistoryEntry[], now = Date.now()): WeekSummary {
  const start = weekStart(now); const end = start + 7 * 86_400_000 + 3_600_000;
  const week = history.filter((h) => counts(h) && h.at >= start && h.at < end);
  const lanterns = Array.from({ length: 7 }, () => false);
  for (const h of week) lanterns[(new Date(h.at).getDay() + 6) % 7] = true;
  const weekOf = (at: number) => Math.round((weekStart(at) - weekStart(0)) / (7 * 86_400_000));
  const played = new Set(history.filter(counts).map((h) => weekOf(h.at)));
  let w = weekOf(now); if (!played.has(w)) w -= 1;
  let streakWeeks = 0; while (played.has(w)) { streakWeeks++; w--; }
  const sum = (f: (h: ContestHistoryEntry) => number) => week.reduce((s, h) => s + f(h), 0);
  return {
    sessions: week.length, items: sum((h) => h.items), right: sum((h) => h.right), firstTry: sum((h) => h.firstTry),
    calmMin: Math.round(sum((h) => h.calmMs) / 60_000), timedMin: Math.round(sum((h) => h.timedMs) / 60_000), lanterns, streakWeeks,
  };
}

/* ---------------- weak spots ---------------- */

/** "Pattern Lab: Shape trains" for a contest skill id (game.kind), or null when it is not a contest skill. */
export function contestSkillLabel(id: string): string | null {
  const [game, kind] = id.split('.');
  if (!kind) return null;
  if (game === STORY_META.skill) { const k = STORY_KINDS.find((x) => x.id === kind); return k ? `${STORY_META.label}: ${k.label}` : null; }
  if (!(CONTEST_GAME_IDS as readonly string[]).includes(game)) return null;
  const pg = PICTURE_GAMES[game]; const k = pg?.kinds.find((x) => x.id === kind);
  return pg && k ? `${pg.label}: ${k.label}` : null;
}
export interface WeakSpot { id: string; label: string; mastery: number; attempts: number }
/** The lowest-mastery contest skills this player has tried (at least one answer). */
export function weakSpots(mastery: Record<string, MasteryRecord>, n = 3): WeakSpot[] {
  return Object.values(mastery)
    .map((r) => ({ r, label: contestSkillLabel(r.id) }))
    .filter((x): x is { r: MasteryRecord; label: string } => !!x.label && x.r.attempts > 0)
    .map(({ r, label }) => ({ id: r.id, label, mastery: Math.round(r.mastery), attempts: r.attempts }))
    .sort((a, b) => a.mastery - b.mastery || b.attempts - a.attempts)
    .slice(0, n);
}

/** Everything the parent card shows for the active grade. */
export function parentView(contest: ContestState, mastery: Record<string, MasteryRecord>, now = Date.now()) {
  const grade = contest.grade ?? 'g1';
  return { grade, plan: weekPlan(grade), week: weekSummary(contest.history, now), weak: weakSpots(mastery), checklist: PARENT_CHECKLIST };
}
