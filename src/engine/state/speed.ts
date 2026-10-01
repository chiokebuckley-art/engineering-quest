import type { Question } from '../types';
import type { ArcadeGame } from './types';
import { factLabel } from '../curriculum/facts';
import { parseSelection } from './arcade';

/**
 * Speed practice: answer a set of questions each on its own clock, and keep the response-time data per
 * fact so progress toward the 3-second goal can be seen number by number.
 */
export const SPEED_TARGETS_MS = [15_000, 10_000, 7_000, 5_000, 3_000];
export const SPEED_GOAL_MS = 3_000;
export const SPEED_SET = 20;
export const SPEED_RUNS_KEPT = 300;

export interface SpeedFact {
  /** First-attempt answers recorded. */
  n: number;
  correct: number;
  sumMs: number;
  bestMs: number;
  lastMs: number;
  /** Most recent response times, newest last (up to 10). */
  recent: number[];
  /** Last recorded, ms since epoch. */
  at: number;
}
export interface SpeedRun {
  at: number; game: ArcadeGame; selection: string; targetMs: number;
  n: number; correct: number; onTime: number; avgMs: number; medianMs: number; bestMs: number;
}
export interface SpeedStats { facts: Record<string, SpeedFact>; runs: SpeedRun[] }
export const initialSpeed = (): SpeedStats => ({ facts: {}, runs: [] });

/** The row a question's time is filed under: its fact (6 × 7), or its skill for open-ended questions. */
export const speedKey = (q: Question): string => q.factId ?? `skill:${q.masterySkillId}`;
export const speedLabel = (key: string): string => (key.startsWith('skill:') ? key.slice(6) : factLabel(key));

export function recordSpeed(st: SpeedStats, q: Question, timeMs: number, correct: boolean, now: number): SpeedStats {
  const key = speedKey(q);
  const prev = st.facts[key] ?? { n: 0, correct: 0, sumMs: 0, bestMs: Infinity, lastMs: 0, recent: [], at: 0 };
  const fact: SpeedFact = {
    n: prev.n + 1, correct: prev.correct + (correct ? 1 : 0), sumMs: prev.sumMs + timeMs,
    bestMs: correct ? Math.min(prev.bestMs === Infinity ? timeMs : prev.bestMs, timeMs) : prev.bestMs,
    lastMs: timeMs, recent: [...prev.recent, timeMs].slice(-10), at: now,
  };
  if (fact.bestMs === Infinity) fact.bestMs = timeMs;
  return { ...st, facts: { ...st.facts, [key]: fact } };
}

export function summarizeRun(results: { correct: boolean; timeMs: number }[], targetMs: number): Pick<SpeedRun, 'n' | 'correct' | 'onTime' | 'avgMs' | 'medianMs' | 'bestMs'> {
  const n = results.length; const times = results.map((r) => r.timeMs).sort((a, b) => a - b);
  const correct = results.filter((r) => r.correct).length;
  const onTime = results.filter((r) => r.correct && r.timeMs <= targetMs).length;
  const avgMs = n ? Math.round(times.reduce((a, b) => a + b, 0) / n) : 0;
  const medianMs = n ? (n % 2 ? times[(n - 1) / 2] : Math.round((times[n / 2 - 1] + times[n / 2]) / 2)) : 0;
  const bestMs = n ? times[0] : 0;
  return { n, correct, onTime, avgMs, medianMs, bestMs };
}

export function addRun(st: SpeedStats, run: SpeedRun): SpeedStats {
  return { ...st, runs: [...st.runs, run].slice(-SPEED_RUNS_KEPT) };
}

/** Passed a target: 90 % correct and 90 % of those on the clock. */
export const passedTarget = (r: Pick<SpeedRun, 'n' | 'correct' | 'onTime'>) => r.n > 0 && r.correct >= Math.ceil(r.n * 0.9) && r.onTime >= Math.ceil(r.n * 0.9);
/** The next, tighter target after `targetMs`, or null at the goal. */
export const nextTarget = (targetMs: number): number | null => { const i = SPEED_TARGETS_MS.indexOf(targetMs); return i >= 0 && i < SPEED_TARGETS_MS.length - 1 ? SPEED_TARGETS_MS[i + 1] : targetMs > SPEED_GOAL_MS ? SPEED_GOAL_MS : null; };

export interface SpeedRow { key: string; label: string; n: number; correct: number; avgMs: number; bestMs: number; lastMs: number; recentAvgMs: number }
/** Per-fact rows for a selection, slowest first. Facts in the selection that have no data are listed with n = 0. */
export function speedRows(st: SpeedStats, game: ArcadeGame, selectionKey: string): SpeedRow[] {
  const sel = parseSelection(game, selectionKey);
  const keys = new Set<string>(sel.facts);
  if (!sel.facts.length) for (const k of Object.keys(st.facts)) if (k.startsWith('skill:') && sel.skillIds.some((s) => k === `skill:${s}` || k.startsWith(`skill:${s}.`))) keys.add(k);
  const rows: SpeedRow[] = [];
  for (const key of keys) {
    const f = st.facts[key];
    if (!f) { rows.push({ key, label: speedLabel(key), n: 0, correct: 0, avgMs: 0, bestMs: 0, lastMs: 0, recentAvgMs: 0 }); continue; }
    rows.push({ key, label: speedLabel(key), n: f.n, correct: f.correct, avgMs: Math.round(f.sumMs / f.n), bestMs: f.bestMs, lastMs: f.lastMs, recentAvgMs: Math.round(f.recent.reduce((a, b) => a + b, 0) / f.recent.length) });
  }
  return rows.sort((a, b) => (b.n === 0 ? -1 : a.n === 0 ? 1 : b.recentAvgMs - a.recentAvgMs));
}

/** Runs for a selection, newest first. */
export const runsFor = (st: SpeedStats, game: ArcadeGame, selectionKey: string) => st.runs.filter((r) => r.game === game && r.selection === selectionKey).slice().reverse();

/** Everything as CSV: one block of facts, one of runs. */
export function speedCsv(st: SpeedStats): string {
  const esc = (v: string | number) => (typeof v === 'number' ? String(v) : `"${v.replace(/"/g, '""')}"`);
  const lines: string[] = ['facts', 'key,label,tries,correct,avg_ms,best_ms,last_ms,recent_avg_ms,last_at'];
  for (const [key, f] of Object.entries(st.facts)) lines.push([key, speedLabel(key), f.n, f.correct, Math.round(f.sumMs / f.n), f.bestMs, f.lastMs, Math.round(f.recent.reduce((a, b) => a + b, 0) / f.recent.length), new Date(f.at).toISOString()].map(esc).join(','));
  lines.push('', 'runs', 'at,game,selection,target_ms,questions,correct,on_time,avg_ms,median_ms,best_ms');
  for (const r of st.runs) lines.push([new Date(r.at).toISOString(), r.game, r.selection, r.targetMs, r.n, r.correct, r.onTime, r.avgMs, r.medianMs, r.bestMs].map(esc).join(','));
  return lines.join('\n');
}
