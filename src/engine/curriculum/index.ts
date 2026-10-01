import type { MasteryRecord, Region, Skill, SkillId, SkillRequirement } from '../types';
import { SKILLS, componentSkills, skillById, TABLE_ORDER } from './skills';
import { REGIONS, regionById } from './regions';
import { WORLDS } from './worlds';
import { skillMastery } from '../mastery/MasteryEngine';

export { SKILLS, skillById, componentSkills, TABLE_ORDER, skillsInWorld, childSkills } from './skills';
export { REGIONS, regionById, MAP_PATHS } from './regions';
export { WORLDS, worldById } from './worlds';
export * from './facts';

export type MasteryMap = Record<string, MasteryRecord>;

export interface RequirementStatus {
  skillId: SkillId;
  name: string;
  required: number;
  current: number;
  met: boolean;
}

export interface Readiness {
  ready: boolean;
  /** 0–100: average of min(current/required, 1) across requirements. */
  percent: number;
  requirements: RequirementStatus[];
  missingQuests: string[];
}

/**
 * CurriculumEngine: answers "may the player go here / study this yet?"
 * Requirements are visible even when unmet, so future regions can be explored on the map.
 */
export function evaluateRequirements(reqs: SkillRequirement[], mastery: MasteryMap): RequirementStatus[] {
  return reqs.map((r) => {
    const current = Math.round(skillMastery(r.skillId, mastery));
    return { skillId: r.skillId, name: skillById(r.skillId)?.name ?? r.skillId, required: r.mastery, current, met: current >= r.mastery };
  });
}

export function regionReadiness(region: Region, mastery: MasteryMap, completedQuests: Set<string>): Readiness {
  const requirements = evaluateRequirements(region.requirements, mastery);
  const missingQuests = (region.requiredQuests ?? []).filter((q) => !completedQuests.has(q));
  const parts = requirements.map((r) => Math.min(1, r.required === 0 ? 1 : r.current / r.required));
  const percent = parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : 100;
  return {
    ready: requirements.every((r) => r.met) && missingQuests.length === 0 && region.implemented,
    percent,
    requirements,
    missingQuests,
  };
}

export function skillReadiness(skill: Skill, mastery: MasteryMap): Readiness {
  const requirements = evaluateRequirements(skill.prerequisites, mastery);
  const parts = requirements.map((r) => Math.min(1, r.required === 0 ? 1 : r.current / r.required));
  const percent = parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : 100;
  return { ready: requirements.every((r) => r.met), percent, requirements, missingQuests: [] };
}

/** The next skill the player should study: implemented, prerequisites met, lowest mastery, in curriculum order. */
export function recommendNextSkill(mastery: MasteryMap): Skill | undefined {
  // Curriculum order for Version 1: tables in teaching order, then missing factors,
  // applied and multi-step problems, then division tables, then everything else.
  const order: SkillId[] = [
    ...TABLE_ORDER.map((n) => `mult.${n}`), 'mult.missing', 'mult.applied', 'mult.multistep',
    ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `div.${n}`), 'div.applied', 'add.basic', 'sub.basic',
  ];
  for (const id of order) {
    const s = skillById(id);
    if (s && s.implemented && skillMastery(id, mastery) < 85) return s;
  }
  const rest = SKILLS.filter((s) => s.implemented && s.generator !== 'none' && !componentSkills(s.id).length && !order.includes(s.id));
  return [...rest].sort((a, b) => skillMastery(a.id, mastery) - skillMastery(b.id, mastery))[0] ?? skillById('mult');
}

export function worldProgress(worldId: string, mastery: MasteryMap): number {
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world) return 0;
  // While a world is only partly implemented, progress is measured over the playable skills.
  const impl = world.skills.filter((s) => skillById(s)?.implemented);
  const ids = impl.length ? impl : world.skills;
  const vals = ids.map((s) => skillMastery(s, mastery));
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

export function regionForSkill(skillId: SkillId): Region | undefined {
  if (skillId.startsWith('mult')) return regionById('mines');
  if (skillId.startsWith('div')) return regionById('division');
  const s = skillById(skillId);
  return REGIONS.find((r) => r.worldId === s?.worldId);
}
