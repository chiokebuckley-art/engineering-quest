import type { FactId, MasteryRecord, SrsState } from '../types';
import type { Rng } from '../rng';

const MIN = 60_000;
const DAY = 86_400_000;

/** Interval ladder: same-session retry, then 1, 3, 7, 14, 30, 60 days. */
export const INTERVALS_MS = [10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY, 60 * DAY];

export function initialSrs(now = Date.now()): SrsState {
  return { stage: 0, dueAt: now, lastReviewAt: 0, lapses: 0 };
}

/**
 * Reschedule after an answer.
 *  - correct with solid mastery → climb one rung
 *  - correct but still shaky   → stay on the rung (repeat sooner)
 *  - wrong                     → drop two rungs, due again in 10 minutes, count a lapse
 */
export function scheduleAfterAnswer(prev: SrsState, correct: boolean, mastery: number, now = Date.now()): SrsState {
  let stage = prev.stage;
  let lapses = prev.lapses;
  if (correct) {
    if (mastery >= 70) stage = Math.min(INTERVALS_MS.length - 1, stage + 1);
    else if (mastery >= 40 && stage === 0) stage = 1;
  } else {
    stage = Math.max(0, stage - 2);
    lapses += 1;
  }
  // Items that keep lapsing climb more slowly.
  const penalty = lapses >= 3 ? 0.6 : lapses >= 1 ? 0.8 : 1;
  const interval = correct ? INTERVALS_MS[stage] * penalty : INTERVALS_MS[0];
  return { stage, lapses, lastReviewAt: now, dueAt: now + Math.round(interval) };
}

export function isDue(rec: MasteryRecord | undefined, now = Date.now()): boolean {
  return !!rec && rec.attempts > 0 && rec.srs.dueAt <= now;
}

export function dueItems(mastery: Record<string, MasteryRecord>, now = Date.now()): MasteryRecord[] {
  return Object.values(mastery).filter((r) => isDue(r, now)).sort((a, b) => a.srs.dueAt - b.srs.dueAt);
}

/**
 * Selection weight for a fact: unseen facts are introduced steadily, weak facts appear
 * much more often, mastered facts still appear (cumulative review) but rarely.
 */
export function selectionWeight(rec: MasteryRecord | undefined, now = Date.now()): number {
  if (!rec || rec.attempts === 0) return 2.5;
  const m = rec.mastery;
  let w = 0.4 + (100 - m) / 20; // 0.4 (mastered) … 5.4 (mastery 0)
  if (rec.srs.dueAt <= now) w += 3;
  const recentMisses = rec.history.slice(-5).filter((h) => h === 0).length;
  w += recentMisses * 1.5;
  w += Math.min(3, rec.srs.lapses) * 0.5;
  return w;
}

/** Weighted random choice among candidate facts, avoiding immediate repeats where possible. */
export function pickFact(candidates: FactId[], mastery: Record<string, MasteryRecord>, rng: Rng, avoid: FactId[] = [], now = Date.now()): FactId {
  const pool = candidates.length > avoid.length + 1 ? candidates.filter((c) => !avoid.includes(c)) : candidates;
  const weights = pool.map((c) => selectionWeight(mastery[c], now));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function describeDue(dueAt: number, now = Date.now()): string {
  const diff = dueAt - now;
  if (diff <= 0) return 'due now';
  if (diff < 60 * MIN) return `in ${Math.max(1, Math.round(diff / MIN))} min`;
  if (diff < DAY) return `in ${Math.round(diff / (60 * MIN))} h`;
  const days = Math.round(diff / DAY);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}
