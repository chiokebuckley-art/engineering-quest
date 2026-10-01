import type { FactId, MasteryRecord, Question, SkillId } from '../types';
import { createRng, type Rng } from '../rng';
import { generateFromSkills } from '../questions';

/** A stage of the journey from Earth to the Moon. */
export interface RocketMission {
  id: string;
  order: number;
  name: string;
  place: string;
  blurb: string;
  skillIds: SkillId[];
  questions: number;
  /** Seconds allowed per question. */
  seconds: number;
  /** Cumulative rocket points required to unlock. */
  pointsToUnlock: number;
  /** Correct answers needed to reach the next station. */
  target: number;
  /** Sky colour at this altitude (top of gradient). */
  sky: [string, string];
}

export const ROCKET_MISSIONS: RocketMission[] = [
  { id: 'r1', order: 1, name: 'Launch Pad', place: 'Earth', blurb: 'Warm-up: ×2, ×5, ×10 and making 10.', skillIds: ['mult.2', 'mult.5', 'mult.10', 'bonds.10'], questions: 10, seconds: 8, pointsToUnlock: 0, target: 7, sky: ['#7dd3fc', '#1e3a8a'] },
  { id: 'r2', order: 2, name: 'Troposphere', place: 'Clouds', blurb: '×3 and ×4. The air gets thin.', skillIds: ['mult.3', 'mult.4'], questions: 10, seconds: 7, pointsToUnlock: 250, target: 7, sky: ['#38bdf8', '#0f2a6b'] },
  { id: 'r3', order: 3, name: 'Stratosphere', place: 'Edge of sky', blurb: '×6 and ×9. Hold steady.', skillIds: ['mult.6', 'mult.9'], questions: 12, seconds: 7, pointsToUnlock: 600, target: 9, sky: ['#1d4ed8', '#0b1020'] },
  { id: 'r4', order: 4, name: 'Low Orbit', place: 'Above Earth', blurb: '×7 and ×8. The hard ones.', skillIds: ['mult.7', 'mult.8'], questions: 12, seconds: 6, pointsToUnlock: 1100, target: 9, sky: ['#1e3a8a', '#020617'] },
  { id: 'r5', order: 5, name: 'Deep Space', place: 'Between worlds', blurb: '×11, ×12 and everything mixed.', skillIds: ['mult.11', 'mult.12', 'mult'], questions: 14, seconds: 5.5, pointsToUnlock: 1700, target: 11, sky: ['#0b1020', '#000000'] },
  { id: 'r6', order: 6, name: 'Lunar Orbit', place: 'Near the Moon', blurb: 'All tables, faster clock, and making 100.', skillIds: ['mult', 'bonds.100'], questions: 14, seconds: 4.5, pointsToUnlock: 2400, target: 11, sky: ['#111a2e', '#000000'] },
  { id: 'r7', order: 7, name: 'Moon Landing', place: 'The Moon', blurb: 'Mixed facts and missing factors. Land it.', skillIds: ['mult', 'mult.missing'], questions: 16, seconds: 4, pointsToUnlock: 3200, target: 13, sky: ['#1f2937', '#000000'] },
];

export const missionById = (id: string) => ROCKET_MISSIONS.find((m) => m.id === id);

export interface RocketState {
  missionId: string;
  question: Question;
  options: number[];
  lane: 0 | 1 | 2;
  index: number; // questions asked so far (0-based current)
  deadlineAt: number;
  questionStartedAt: number;
  lives: number;
  altitude: number; // correct answers this mission
  score: number;
  streak: number;
  bestStreak: number;
  results: { factId?: FactId; correct: boolean; timeMs: number; timedOut: boolean }[];
  /** 'boost' and 'hit' are short animation phases before the next question. */
  status: 'active' | 'boost' | 'hit' | 'won' | 'lost';
  lastPoints: number;
  lastAnswer?: number;
  newBest?: boolean;
}

export interface RocketRecord {
  points: number;
  missions: Record<string, { best: number; stars: number; completed: boolean; attempts: number }>;
}

export const LIVES = 3;

/** Two plausible wrong answers near the right one (never negative, never equal). */
export function distractors(q: Question, rng: Rng): number[] {
  const ans = q.answer;
  const m = /^(\d+) × (\d+)/.exec(q.expression) ?? /^(\d+) × \? = (\d+)$/.exec(q.expression);
  const cands = new Set<number>();
  if (m && q.expression.includes('× ?') === false && q.expression.includes('? ×') === false) {
    const a = Number(m[1]); const b = Number(m[2]);
    for (const c of [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, ans + a, ans - a, ans + b, ans - b, ans + 1, ans - 1, ans + 2, ans - 2]) cands.add(c);
  } else {
    for (const c of [ans + 1, ans - 1, ans + 2, ans - 2, ans + 3, ans - 3, ans + 5, ans - 5, ans + 10, ans - 10]) cands.add(c);
  }
  const pool = [...cands].filter((c) => c !== ans && c >= 0 && Number.isInteger(c));
  const picked = rng.shuffle(pool).slice(0, 2);
  while (picked.length < 2) { const c = ans + rng.int(1, 9) * (rng.chance(0.5) ? 1 : -1); if (c >= 0 && c !== ans && !picked.includes(c)) picked.push(c); }
  return picked;
}

function nextQuestion(m: RocketMission, mastery: Record<string, MasteryRecord>, rng: Rng, recent: FactId[]) {
  const question = generateFromSkills(m.skillIds, mastery, { rng, difficulty: 2, recentFacts: recent });
  const options = rng.shuffle([question.answer, ...distractors(question, rng)]);
  return { question, options };
}

export function startRocket(missionId: string, mastery: Record<string, MasteryRecord>, now = Date.now(), rng = createRng()): RocketState {
  const m = missionById(missionId)!;
  const { question, options } = nextQuestion(m, mastery, rng, []);
  return {
    missionId, question, options, lane: 1, index: 0, deadlineAt: now + m.seconds * 1000, questionStartedAt: now,
    lives: LIVES, altitude: 0, score: 0, streak: 0, bestStreak: 0, results: [], status: 'active', lastPoints: 0,
  };
}

export function moveRocket(r: RocketState, dir: -1 | 1): RocketState {
  if (r.status !== 'active') return r;
  const lane = Math.max(0, Math.min(2, r.lane + dir)) as 0 | 1 | 2;
  return { ...r, lane };
}

export function setLane(r: RocketState, lane: 0 | 1 | 2): RocketState {
  return r.status === 'active' ? { ...r, lane } : r;
}

export interface BoostOutcome { state: RocketState; correct: boolean; timeMs: number; points: number }

/** Fire the engines under the current lane (or be hit by the bomb on timeout). */
export function boost(r: RocketState, now = Date.now(), timedOut = false): BoostOutcome {
  if (r.status !== 'active') return { state: r, correct: false, timeMs: 0, points: 0 };
  const m = missionById(r.missionId)!;
  const chosen = r.options[r.lane];
  const correct = !timedOut && chosen === r.question.answer;
  const timeMs = Math.max(200, now - r.questionStartedAt);
  const remaining = Math.max(0, r.deadlineAt - now);
  let points = 0;
  const next: RocketState = { ...r, results: [...r.results, { factId: r.question.factId, correct, timeMs, timedOut }], lastAnswer: chosen };
  if (correct) {
    next.streak += 1; next.bestStreak = Math.max(next.bestStreak, next.streak);
    points = 10 + Math.round((remaining / (m.seconds * 1000)) * 10) + Math.min(5, next.streak) * 2;
    next.score += points; next.altitude += 1; next.status = 'boost';
  } else {
    next.streak = 0; next.lives -= 1; next.status = 'hit';
  }
  next.lastPoints = points;
  return { state: next, correct, timeMs, points };
}

/** Advance after the boost/hit animation: next question, or mission won/lost. */
export function rocketNext(r: RocketState, mastery: Record<string, MasteryRecord>, now = Date.now(), rng = createRng()): RocketState {
  if (r.status !== 'boost' && r.status !== 'hit') return r;
  const m = missionById(r.missionId)!;
  if (r.lives <= 0) return { ...r, status: 'lost' };
  const asked = r.index + 1;
  if (asked >= m.questions) return { ...r, status: r.altitude >= m.target ? 'won' : 'lost' };
  const recent = [r.question.factId ?? ''].filter(Boolean);
  const { question, options } = nextQuestion(m, mastery, rng, recent);
  return { ...r, question, options, lane: 1, index: asked, deadlineAt: now + m.seconds * 1000, questionStartedAt: now, status: 'active', lastPoints: 0, lastAnswer: undefined };
}

export function rocketStars(r: RocketState): number {
  const m = missionById(r.missionId)!;
  if (r.status !== 'won') return 0;
  if (r.lives === LIVES && r.altitude === m.questions) return 3;
  if (r.lives >= 2) return 2;
  return 1;
}

export function missionUnlocked(m: RocketMission, rec: RocketRecord): boolean {
  if (m.order === 1) return true;
  const prev = ROCKET_MISSIONS[m.order - 2];
  return rec.points >= m.pointsToUnlock && !!rec.missions[prev.id]?.completed;
}
