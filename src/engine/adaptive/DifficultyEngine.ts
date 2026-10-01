import type { Difficulty } from '../types';

/**
 * Per-skill adaptive difficulty. Difficulty never jumps because of one answer:
 * it rises after a run of 6 recent answers at ≥ 85% accuracy and falls after
 * 2 misses in the last 4. Hints are shown more readily at low difficulty.
 */
export interface AdaptiveRecord {
  level: Difficulty;
  recent: number[]; // last 8 results
}

export type AdaptiveMap = Record<string, AdaptiveRecord>;

export function adaptiveLevel(map: AdaptiveMap, skillKey: string): Difficulty {
  return map[skillKey]?.level ?? 1;
}

export function recordResult(map: AdaptiveMap, skillKey: string, correct: boolean, max: Difficulty = 6): AdaptiveMap {
  const prev = map[skillKey] ?? { level: 1 as Difficulty, recent: [] };
  const recent = [...prev.recent, correct ? 1 : 0].slice(-8);
  let level = prev.level;
  const last4 = recent.slice(-4);
  const last6 = recent.slice(-6);
  if (last6.length === 6 && last6.reduce((a, b) => a + b, 0) >= 5 && level < max) {
    level = (level + 1) as Difficulty;
    return { ...map, [skillKey]: { level, recent: [] } };
  }
  if (last4.length >= 4 && last4.filter((x) => x === 0).length >= 2 && level > 1) {
    level = (level - 1) as Difficulty;
    return { ...map, [skillKey]: { level, recent: [] } };
  }
  return { ...map, [skillKey]: { level, recent } };
}

export function describeLevel(level: Difficulty): string {
  return ['', 'Foundations', 'Full table', 'Mixed facts', 'Missing factors', 'Applied problems', 'Multi-step'][level] ?? '';
}
