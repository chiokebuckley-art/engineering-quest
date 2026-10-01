import type { GameState } from './types';
import { skillMastery } from '../mastery/MasteryEngine';
import { regionById } from '../curriculum/regions';
import { regionReadiness } from '../curriculum';
import { enemyById } from '../combat/enemies';
import { academyUnlocked, graduated } from '../academy/AcademyEngine';
import { academyById } from '../academy/registry';

/** Milestones an academy completes: graduating from it marks the milestone done. */
const ACADEMY_FOR: Record<string, string> = { alg: 'algebra1', geo: 'geometry', trig: 'trig', calc: 'calculus' };

/**
 * The road from the times tables to calculus, as milestones tied to real skills. Every milestone can be
 * trained in the Arcade today; the ones with a region you can reach are playable; the rest can be scouted.
 */
export interface MilestoneDef { id: string; name: string; guardian: string; regionId: string; boss?: string; skills: string[]; arcade: { game: string; selection: string } }
export const ROAD: MilestoneDef[] = [
  { id: 'mult', name: 'Multiplication Core', guardian: 'Multiplication Dragon', regionId: 'mines', boss: 'multiplication-dragon', skills: ['mult'], arcade: { game: 'mult', selection: 'mult:all' } },
  { id: 'div', name: 'Division Core', guardian: 'Division Titan', regionId: 'division', boss: 'division-titan', skills: ['div'], arcade: { game: 'div', selection: 'div:all' } },
  { id: 'frac', name: 'Fraction Core', guardian: 'Fraction Hydra', regionId: 'fraction-forest', boss: 'fraction-hydra', skills: ['precalc.frac.add', 'precalc.frac.mul'], arcade: { game: 'precalc', selection: 'precalc:frac.add' } },
  { id: 'alg', name: 'Algebra Tower', guardian: 'Equation Golem', regionId: 'algebra-city', skills: ['precalc.neg', 'precalc.rearrange', 'precalc.func'], arcade: { game: 'precalc', selection: 'precalc:rearrange' } },
  { id: 'geo', name: 'Geometry Colossus', guardian: 'Compass Knight', regionId: 'geometry-kingdom', skills: ['geo.angles', 'geo.circle', 'geo.pythag'], arcade: { game: 'geo', selection: 'geo:all' } },
  { id: 'trig', name: 'Trig Guardian', guardian: 'Ridge Wraith', regionId: 'trig-mountains', skills: ['precalc.trig'], arcade: { game: 'precalc', selection: 'precalc:trig' } },
  { id: 'calc', name: 'Calculus Timekeeper', guardian: 'Timekeeper', regionId: 'calculus-frontier', skills: ['precalc.graph', 'precalc.exp', 'precalc.scinot', 'precalc.func'], arcade: { game: 'precalc', selection: 'precalc:graph' } },
];

export type MilestoneStatus = 'done' | 'playable' | 'locked' | 'scout';
export interface Milestone extends MilestoneDef { status: MilestoneStatus; mastery: number; skillMastery: { id: string; mastery: number }[]; scouted: boolean; scoutEnemy?: string; /** For locked regions: what opens them. */ unlockHint?: string }

export function road(s: GameState, now = Date.now()): Milestone[] {
  return ROAD.map((m) => {
    const per = m.skills.map((id) => ({ id, mastery: Math.round(skillMastery(id, s.mastery, now)) }));
    const mastery = Math.round(per.reduce((a, x) => a + x.mastery, 0) / per.length);
    const region = regionById(m.regionId);
    const done = !!m.boss && s.stats.bossesDefeated.includes(m.boss);
    // Built regions are only "playable" once you can actually get in; otherwise say what opens them.
    const completed = new Set(Object.entries(s.quests).filter(([, q]) => q.status === 'completed').map(([id]) => id));
    const open = !!region && (s.world.unlockedRegions.includes(region.id) || regionReadiness(region, s.mastery, completed).ready);
    const acad = ACADEMY_FOR[m.id] ? academyById(ACADEMY_FOR[m.id]) : undefined;
    const acadLive = !!acad && !acad.draft && acad.chapters.length > 0;
    const status: MilestoneStatus = done || (acadLive && graduated(s, acad!.id)) ? 'done' : acadLive && academyUnlocked(s, acad!.id) ? 'playable' : region?.implemented ? (open ? 'playable' : 'locked') : 'scout';
    const unlockHint = status !== 'locked' || !region ? undefined : region.id === 'division' ? 'Opens when the Multiplication Dragon falls' : region.id === 'forge' ? 'Opens with the Forge Key: clear Gallery 8 and reach 75%' : region.requirements.length ? `Opens at ${region.requirements.map((r) => `${r.skillId} ${r.mastery}%`).join(', ')}${region.requiredQuests?.length ? ' after the first mine fights' : ''}` : 'Opens later in the story';
    const scoutId = `scout-${m.regionId}`;
    return { ...m, status, mastery, skillMastery: per, scouted: (s.world.scouted ?? []).includes(m.regionId), scoutEnemy: enemyById(scoutId) ? scoutId : undefined, unlockHint };
  });
}
