import type { GameState } from './types';
import type { Action } from './actions';
import { skillMastery } from '../mastery/MasteryEngine';
import { TABLE_ORDER } from '../curriculum/skills';
import { MINE_DEPTHS, FOREST_DEPTHS } from '../combat/enemies';
import { hasItem } from '../inventory/InventorySystem';

export interface GuideStep {
  /** Short imperative label for the big button, e.g. "Talk to Professor Vector". */
  label: string;
  /** One short line of context. */
  hint: string;
  /** Action to dispatch when the button is pressed. */
  action: Action;
  /** Hotspot id to highlight in the current scene. */
  hotspot?: string;
  icon: string;
}

/**
 * The guide answers "what do I do now?" with exactly one step, derived from quest state.
 * It keeps the critical path to the first power core one button press at a time.
 */
export function nextStep(s: GameState): GuideStep {
  const q = (id: string) => s.quests[id]?.status ?? 'locked';
  const here = s.world.currentRegion;
  const now = Date.now();

  if (q('q.awakening') !== 'completed') {
    if (here !== 'village') return { label: 'Go back to the village', hint: 'Professor Vector is waiting.', action: { type: 'TRAVEL', regionId: 'village' }, icon: 'home' };
    return { label: 'Talk to Professor Vector', hint: 'Your quest begins here.', action: { type: 'TALK', npcId: 'vector' }, hotspot: 'vector', icon: 'scroll' };
  }
  const depthCleared = s.world.depthCleared['mines'] ?? 0;
  if (q('q.into-the-mines') !== 'completed') {
    const done = s.quests['q.into-the-mines']?.progress['defeat'] ?? 0;
    // The very first fight is one tap from the village: no lecture before the first swing.
    if (done === 0 && depthCleared === 0) return { label: 'Into the Mines: fight the Ore Slime', hint: 'Answer right to attack. Tap an NPC mid-fight for a tip.', action: { type: 'START_BATTLE', enemyId: MINE_DEPTHS[0].enemyId, regionId: 'mines', depth: 1 }, hotspot: 'mines', icon: 'sword' };
    if (here !== 'mines') return { label: 'Go to the Multiplication Mines', hint: `Beat 3 creatures (${done}/3).`, action: { type: 'TRAVEL', regionId: 'mines' }, hotspot: 'mines', icon: 'pickaxe' };
    const depth = Math.min(depthCleared + 1, MINE_DEPTHS.length);
    return { label: `Fight: Gallery ${depth}`, hint: `Beat 3 creatures (${done}/3). Answer right to attack.`, action: { type: 'START_BATTLE', enemyId: MINE_DEPTHS[depth - 1].enemyId, regionId: 'mines', depth }, hotspot: `depth-${depth}`, icon: 'sword' };
  }
  // In Fraction Forest, the next step is the next grove (or the Hydra).
  if (here === 'fraction-forest' && !s.stats.bossesDefeated.includes('fraction-hydra')) {
    const fc = s.world.depthCleared['fraction-forest'] ?? 0;
    if (fc >= FOREST_DEPTHS.length) return { label: 'Challenge the Fraction Hydra', hint: 'Three heads: sums, products, everything. 4 misses allowed.', action: { type: 'START_BATTLE', enemyId: 'fraction-hydra', regionId: 'fraction-forest' }, icon: 'crystal' };
    const g = FOREST_DEPTHS[fc];
    const wins = s.world.depthWins[`fraction-forest:${g.depth}`] ?? 0;
    return { label: `Fight: ${g.name}`, hint: `${wins}/${g.clears} wins to clear it.`, action: { type: 'START_BATTLE', enemyId: g.enemyId, regionId: 'fraction-forest', depth: g.depth }, hotspot: `depth-${g.depth}`, icon: 'sword' };
  }
  if (q('q.bridge') === 'active' && !s.stats.missionsCompleted.includes('m.bridge')) {
    if (here !== 'mines') return { label: 'Go to the mines to fix the bridge', hint: 'Mechanic Ada has the plans.', action: { type: 'TRAVEL', regionId: 'mines' }, icon: 'bridge' };
    return { label: 'Build: Repair the Bridge', hint: '4 problems. Each one builds a piece.', action: { type: 'START_MISSION', missionId: 'm.bridge' }, hotspot: 'mission-m.bridge', icon: 'bridge' };
  }
  // Core loop: clear galleries; when a table lags, send them to a lesson or drill.
  const beaten = s.stats.bossesDefeated.includes('multiplication-dragon');
  if (!beaten) {
    if (q('q.forge-key') === 'completed' && hasItem(s.inventory, 'forge-key')) {
      if (here !== 'forge') return { label: 'Go to the Dragon\'s Forge', hint: 'The boss. 50 facts, 5 misses allowed.', action: { type: 'TRAVEL', regionId: 'forge' }, icon: 'dragon' };
      return { label: 'Challenge the Multiplication Dragon', hint: 'Win to restore the first power core.', action: { type: 'START_BATTLE', enemyId: 'multiplication-dragon', regionId: 'forge' }, icon: 'dragon' };
    }
    // Weak cleared table → lesson (if any unseen) or drill.
    const weakTable = TABLE_ORDER.find((n) => MINE_DEPTHS.some((d) => d.depth <= depthCleared && d.tables.includes(n)) && skillMastery(`mult.${n}`, s.mastery, now) < 60);
    if (weakTable !== undefined && s.stats.totalAnswered % 3 === 0) {
      return { label: `Train the ×${weakTable} table`, hint: '10 quick problems. Weak facts come back more often.', action: { type: 'START_DRILL', skillIds: [`mult.${weakTable}`], count: 10 }, hotspot: 'training', icon: 'target' };
    }
    if (depthCleared < MINE_DEPTHS.length) {
      const depth = depthCleared + 1;
      const d = MINE_DEPTHS[depth - 1];
      const wins = s.world.depthWins[`mines:${depth}`] ?? 0;
      if (here !== 'mines') return { label: `Go to the mines: Gallery ${depth}`, hint: `${d.name}. ${wins}/${d.clears} wins.`, action: { type: 'TRAVEL', regionId: 'mines' }, icon: 'pickaxe' };
      return { label: `Fight: Gallery ${depth} — ${d.name}`, hint: `${wins}/${d.clears} wins to clear it. Tables ${d.tables.map((t) => `×${t}`).join(', ')}.`, action: { type: 'START_BATTLE', enemyId: d.enemyId, regionId: 'mines', depth }, hotspot: `depth-${depth}`, icon: 'sword' };
    }
    const m = Math.round(skillMastery('mult', s.mastery, now));
    if (m < 75) {
      const weakest = [...TABLE_ORDER].sort((a, b) => skillMastery(`mult.${a}`, s.mastery, now) - skillMastery(`mult.${b}`, s.mastery, now))[0];
      return { label: `Train the ×${weakest} table`, hint: `Multiplication ${m}%. Reach 75% to get the Forge Key.`, action: { type: 'START_DRILL', skillIds: [`mult.${weakest}`], count: 15 }, hotspot: 'training', icon: 'target' };
    }
    return { label: 'Talk to Foreman Brick', hint: 'Collect the Forge Key.', action: here === 'mines' ? { type: 'TALK', npcId: 'brick' } : { type: 'TRAVEL', regionId: 'mines' }, hotspot: 'brick', icon: 'unlock' };
  }
  if (s.world.unlockedRegions.includes('division')) {
    if (here !== 'division') return { label: 'Explore the Division Dungeon', hint: 'Every fact you know, backwards.', action: { type: 'TRAVEL', regionId: 'division' }, icon: 'divide' };
    const depth = (s.world.depthCleared['division'] ?? 0) < 1 ? 1 : 2;
    return { label: `Fight: Hall ${depth}`, hint: 'Division Imps.', action: { type: 'START_BATTLE', enemyId: depth === 1 ? 'division-imp' : 'division-imp-2', regionId: 'division', depth }, hotspot: `depth-${depth}`, icon: 'sword' };
  }
  return { label: 'Review your weak facts', hint: 'The Dungeon of Forgotten Knowledge.', action: { type: 'START_DUNGEON' }, icon: 'skull' };
}

/** How much of the village to show: 0 = just Vector, 1 = lesson & training, 2 = everything. */
export function villageStage(s: GameState): number {
  if (s.quests['q.awakening']?.status !== 'completed') return 0;
  if (s.quests['q.into-the-mines']?.status !== 'completed') return 1;
  return 2;
}
