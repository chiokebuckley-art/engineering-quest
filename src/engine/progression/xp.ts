import type { AnswerContext, Difficulty } from '../types';

/** XP needed to go from level n to n+1. */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export function totalXpToReach(level: number): number {
  let t = 0;
  for (let l = 1; l < level; l++) t += xpForLevel(l);
  return t;
}

export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let rem = xp;
  while (rem >= xpForLevel(level) && level < 99) {
    rem -= xpForLevel(level);
    level++;
  }
  return { level, into: rem, needed: xpForLevel(level) };
}

export const TITLES: [number, string][] = [
  [1, 'Engineering Apprentice'],
  [3, 'Journeyman Calculator'],
  [5, 'Workshop Technician'],
  [8, 'Mine Surveyor'],
  [12, 'Systems Technician'],
  [16, 'Junior Engineer'],
  [22, 'Engineer'],
  [30, 'Senior Engineer'],
  [40, 'Principal Engineer'],
  [55, 'Master Engineer'],
];

export function titleForLevel(level: number): string {
  let t = TITLES[0][1];
  for (const [l, name] of TITLES) if (level >= l) t = name;
  return t;
}

/**
 * XP for a correct answer. Meaningful learning earns more:
 *  - harder question types earn more,
 *  - facts already mastered (≥95) earn very little (no grinding),
 *  - boss/mission contexts get a small premium.
 */
export function xpForAnswer(difficulty: Difficulty, factMasteryBefore: number, context: AnswerContext, crossedMastered: boolean, firstCorrect: boolean): number {
  if (factMasteryBefore >= 95) return 2;
  let xp = 8 + difficulty * 3;
  if (factMasteryBefore < 40) xp += 4;
  if (context === 'boss') xp += 4;
  if (context === 'mission') xp += 3;
  if (context === 'review') xp += 3;
  if (firstCorrect) xp += 5;
  if (crossedMastered) xp += 25;
  return xp;
}
