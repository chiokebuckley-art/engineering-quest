import type { TycoonGame } from './game';
import { netWorth } from './game';

/** Lifetime Engine City Tycoon record for the profile. */
export interface TycoonRecord { games: number; wins: number; bestWorth: number; right: number; wrong: number; lastLevel?: string }
export const initialTycoon = (): TycoonRecord => ({ games: 0, wins: 0, bestWorth: 0, right: 0, wrong: 0 });

/** Fold a finished game into the record, from the point of view of player `me`. */
export function recordTycoon(rec: TycoonRecord, g: TycoonGame, me: string): TycoonRecord {
  const p = g.players.find((x) => x.id === me);
  if (!p) return rec;
  return { games: rec.games + 1, wins: rec.wins + (g.winner === me ? 1 : 0), bestWorth: Math.max(rec.bestWorth, p.out ? 0 : netWorth(g, me)), right: rec.right + p.stats.right, wrong: rec.wrong + p.stats.wrong, lastLevel: g.level };
}
