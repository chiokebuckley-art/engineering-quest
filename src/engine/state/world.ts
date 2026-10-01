import type { GameState } from './types';
import { MINE_DEPTHS, FOREST_DEPTHS } from '../combat/enemies';

/**
 * What the village and mines look like right now, derived from progress. Everything the player
 * does in Play shows up here: lanterns per gallery, rescued people, repaired machines, seated cores.
 */
export interface WorldView {
  /** Mine galleries cleared: one street lantern each. */
  lanterns: number;
  /** Houses with lit windows (one per gallery, up to six). */
  houses: number;
  pip: boolean; stall: boolean; bell: boolean; library: boolean; chimney: boolean; crypt: boolean; crystal: boolean; clock: boolean;
  bridge: boolean; pump: boolean; workshop: boolean;
  /** Fraction Forest groves cleared: a green lantern at the gate each. */
  forest: number;
  cores: { mult: boolean; div: boolean; frac: boolean };
  /** Progress toward the next core, for the Engine gauge. */
  charge: { label: string; done: number; total: number };
  /** Everything above, as a count, so "the village changed" is measurable. */
  score: number;
}

export function worldView(s: GameState): WorldView {
  const side = (k: string) => (s.world.sideDone ?? []).includes(k);
  const lanterns = s.world.depthCleared['mines'] ?? 0;
  const forest = s.world.depthCleared['fraction-forest'] ?? 0;
  const bosses = s.stats.bossesDefeated;
  const cores = { mult: bosses.includes('multiplication-dragon'), div: bosses.includes('division-titan'), frac: bosses.includes('fraction-hydra') };
  const charge = !cores.mult
    ? { label: 'Power Core I · Multiplication', done: lanterns, total: MINE_DEPTHS.length }
    : !cores.frac
      ? { label: 'Fraction Core · Fraction Forest', done: forest, total: FOREST_DEPTHS.length }
      : { label: 'Division Core · Division Dungeon', done: s.world.depthCleared['division'] ?? 0, total: 2 };
  const v: Omit<WorldView, 'score'> = {
    lanterns, houses: Math.min(6, lanterns),
    pip: side('mines:1'), stall: side('mines:2') || lanterns >= 2, bell: side('mines:3'), library: side('mines:4'), chimney: side('mines:5'), crypt: side('mines:6'), crystal: side('mines:7'), clock: side('mines:8'),
    bridge: s.stats.missionsCompleted.includes('m.bridge'), pump: s.stats.missionsCompleted.includes('m.pump'), workshop: s.quests['p.workshop']?.status === 'completed',
    forest, cores, charge,
  };
  const score = v.lanterns + v.houses + v.forest + [v.pip, v.stall, v.bell, v.library, v.chimney, v.crypt, v.crystal, v.clock, v.bridge, v.pump, v.workshop, cores.mult, cores.div, cores.frac].filter(Boolean).length;
  return { ...v, score };
}
