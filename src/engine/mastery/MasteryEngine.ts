import type { MasteryBand, MasteryRecord, SkillId } from '../types';
import { skillById, componentSkills } from '../curriculum/skills';
import { initialSrs, scheduleAfterAnswer } from '../srs/SpacedRepetitionEngine';

export type MasteryMap = Record<string, MasteryRecord>;

const HISTORY_CAP = 12;
const TIMES_CAP = 8;

export function bandFor(mastery: number): MasteryBand {
  if (mastery >= 90) return 'Mastered';
  if (mastery >= 85) return 'Nearly Mastered';
  if (mastery >= 70) return 'Competent';
  if (mastery >= 40) return 'Developing';
  return 'Learning';
}

export const BAND_COLORS: Record<MasteryBand, string> = {
  Learning: '#64748b',
  Developing: '#f59e0b',
  Competent: '#22d3ee',
  'Nearly Mastered': '#a78bfa',
  Mastered: '#4ade80',
};

export function newRecord(id: string, now = Date.now()): MasteryRecord {
  return {
    id, attempts: 0, correct: 0, streak: 0, bestStreak: 0, history: [], times: [], avgTimeMs: 0,
    mastery: 0, lastPracticedAt: 0, firstPracticedAt: now, srs: initialSrs(now),
  };
}

/**
 * Compute the mastery score (0–100) from a record.
 *  - Recency-weighted accuracy over the last 12 attempts (recent answers count more).
 *  - A confidence factor: a single lucky answer cannot produce a high score; ~6+ attempts are needed.
 *  - Accuracy comes first: the score is capped at 89 ("Nearly Mastered") until answers are also fast.
 *  - Speed only counts once recent accuracy is >= 85%.
 */
export function computeMastery(rec: MasteryRecord, targetTimeMs: number): number {
  if (rec.attempts === 0) return 0;
  let wsum = 0;
  let acc = 0;
  const n = rec.history.length;
  for (let i = 0; i < n; i++) {
    const age = n - 1 - i;
    const w = Math.pow(0.85, age);
    wsum += w;
    acc += w * rec.history[i];
  }
  const recentAcc = wsum ? acc / wsum : 0;
  const confidence = Math.min(1, rec.attempts / 6);
  const base = recentAcc * (40 + 50 * confidence); // max 90
  if (recentAcc < 0.85) return Math.round(Math.min(84, base));
  // Speed component (0..10): fluent at or under the target time, zero at 2× the target.
  const avg = rec.avgTimeMs || targetTimeMs * 2;
  const speed = Math.max(0, Math.min(1, (targetTimeMs * 2 - avg) / targetTimeMs));
  const speedScore = speed * 11;
  return Math.round(Math.min(100, Math.min(base, 89) + speedScore));
}

export interface AnswerUpdate {
  record: MasteryRecord;
  before: number;
  after: number;
  crossedMastered: boolean;
  firstCorrect: boolean;
}

/** Apply one answer to a record (pure — returns the new record). */
export function applyAnswer(
  prev: MasteryRecord | undefined,
  id: string,
  correct: boolean,
  timeMs: number,
  targetTimeMs: number,
  now = Date.now(),
): AnswerUpdate {
  const rec: MasteryRecord = prev ? { ...prev, history: [...prev.history], times: [...prev.times], srs: { ...prev.srs } } : newRecord(id, now);
  const before = rec.mastery;
  rec.attempts += 1;
  if (correct) rec.correct += 1;
  rec.streak = correct ? rec.streak + 1 : 0;
  rec.bestStreak = Math.max(rec.bestStreak, rec.streak);
  rec.history.push(correct ? 1 : 0);
  if (rec.history.length > HISTORY_CAP) rec.history.shift();
  if (correct) {
    rec.times.push(Math.min(timeMs, targetTimeMs * 4));
    if (rec.times.length > TIMES_CAP) rec.times.shift();
    rec.avgTimeMs = Math.round(rec.times.reduce((a, b) => a + b, 0) / rec.times.length);
  }
  rec.lastPracticedAt = now;
  rec.mastery = computeMastery(rec, targetTimeMs);
  rec.srs = scheduleAfterAnswer(rec.srs, correct, rec.mastery, now);
  return {
    record: rec,
    before,
    after: rec.mastery,
    crossedMastered: before < 90 && rec.mastery >= 90,
    firstCorrect: correct && rec.correct === 1,
  };
}

/** Mastery decays gently when a review is overdue — this is the score the game shows and uses for gating. */
export function effectiveMastery(rec: MasteryRecord | undefined, now = Date.now()): number {
  if (!rec || rec.attempts === 0) return 0;
  const overdueDays = Math.max(0, (now - rec.srs.dueAt) / 86_400_000);
  const decay = Math.min(15, overdueDays * 1.5);
  return Math.max(0, Math.round(rec.mastery - decay));
}

/**
 * Mastery of a skill:
 *  - fact-based skill  → mean of its facts (untouched facts count as 0);
 *  - umbrella skill    → mean of component skills;
 *  - otherwise         → its own record.
 */
export function skillMastery(skillId: SkillId, mastery: MasteryMap, now = Date.now()): number {
  const skill = skillById(skillId);
  const comps = componentSkills(skillId);
  if (comps.length) {
    const vals = comps.map((c) => skillMastery(c, mastery, now));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  if (skill?.facts?.length) {
    const vals = skill.facts.map((f) => effectiveMastery(mastery[f], now));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  return effectiveMastery(mastery[skillId], now);
}

export interface SkillStats {
  mastery: number;
  attempts: number;
  correct: number;
  accuracy: number;
  avgTimeMs: number;
  lastPracticedAt: number;
  nextReviewAt: number;
  weakestFacts: { id: string; mastery: number }[];
}

export function skillStats(skillId: SkillId, mastery: MasteryMap, now = Date.now()): SkillStats {
  const skill = skillById(skillId);
  const ids: string[] = Array.from(new Set(skill?.facts?.length
    ? skill.facts
    : componentSkills(skillId).length
      ? componentSkills(skillId).flatMap((c) => skillById(c)?.facts ?? [c])
      : [skillId]));
  const recs = ids.map((i) => mastery[i]).filter(Boolean) as MasteryRecord[];
  const attempts = recs.reduce((a, r) => a + r.attempts, 0);
  const correct = recs.reduce((a, r) => a + r.correct, 0);
  const timed = recs.filter((r) => r.avgTimeMs > 0);
  return {
    mastery: Math.round(skillMastery(skillId, mastery, now)),
    attempts,
    correct,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
    avgTimeMs: timed.length ? Math.round(timed.reduce((a, r) => a + r.avgTimeMs, 0) / timed.length) : 0,
    lastPracticedAt: recs.reduce((a, r) => Math.max(a, r.lastPracticedAt), 0),
    nextReviewAt: recs.length ? Math.min(...recs.map((r) => r.srs.dueAt)) : 0,
    weakestFacts: ids
      .map((id) => ({ id, mastery: effectiveMastery(mastery[id], now), seen: !!mastery[id] }))
      .filter((f) => f.seen)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 5),
  };
}

/** Facts/skills that are weak or overdue — the material of the Dungeon of Forgotten Knowledge. */
export function weakItems(mastery: MasteryMap, now = Date.now(), limit = 12): MasteryRecord[] {
  return Object.values(mastery)
    .filter((r) => r.attempts >= 2)
    .map((r) => ({ r, score: effectiveMastery(r, now) - (r.srs.dueAt <= now ? 10 : 0) - r.srs.lapses * 3 }))
    .filter((x) => x.score < 75 || x.r.srs.lapses >= 2)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.r);
}
