import type { GameEvent, InventoryState, MasteryRecord, ObjectiveDef, QuestDef, QuestState } from '../types';
import { QUESTS } from './questDefs';
import { skillMastery } from '../mastery/MasteryEngine';

export type QuestMap = Record<string, QuestState>;

export function initialQuests(): QuestMap {
  const map: QuestMap = {};
  for (const q of QUESTS) map[q.id] = { status: q.after?.length ? 'locked' : 'available', progress: {} };
  return map;
}

export function objectiveTarget(o: ObjectiveDef): number {
  switch (o.type) {
    case 'answers': case 'defeat': case 'collect': return o.count;
    case 'drill': return 1;
    case 'mastery': return o.mastery;
    case 'depth': return o.depth;
    default: return 1;
  }
}

export function objectiveDone(o: ObjectiveDef, progress: Record<string, number>): boolean {
  return (progress[o.id] ?? 0) >= objectiveTarget(o);
}

export function questComplete(q: QuestDef, s: QuestState): boolean {
  return q.objectives.every((o) => objectiveDone(o, s.progress));
}

/** Unlock quests whose prerequisites are now complete. */
export function refreshAvailability(quests: QuestMap): QuestMap {
  const out = { ...quests };
  for (const q of QUESTS) {
    const s = out[q.id] ?? { status: 'locked', progress: {} };
    if (s.status === 'locked' && (q.after ?? []).every((a) => out[a]?.status === 'completed')) {
      out[q.id] = { ...s, status: 'available' };
    }
  }
  return out;
}

export function acceptQuest(quests: QuestMap, id: string, now = Date.now()): QuestMap {
  const s = quests[id];
  if (!s || s.status !== 'available') return quests;
  return { ...quests, [id]: { ...s, status: 'active', startedAt: now } };
}

/**
 * Feed a game event into all active quests. Returns the updated map and the ids of quests
 * that just became complete (the caller grants rewards).
 */
export function applyEvent(quests: QuestMap, ev: GameEvent, ctx: { mastery: Record<string, MasteryRecord>; inventory: InventoryState; now: number }): { quests: QuestMap; completed: string[] } {
  const out: QuestMap = { ...quests };
  const completed: string[] = [];
  for (const q of QUESTS) {
    const s = out[q.id];
    if (!s || s.status !== 'active') continue;
    let progress = { ...s.progress };
    let changed = false;
    q.objectives.forEach((o, idx) => {
      if (q.sequential && idx > 0 && !objectiveDone(q.objectives[idx - 1], progress)) return;
      const cur = progress[o.id] ?? 0;
      let next = cur;
      switch (o.type) {
        case 'talk': if (ev.type === 'npc-talked' && ev.npcId === o.npcId) next = 1; break;
        case 'visit': if (ev.type === 'region-visited' && ev.regionId === o.regionId) next = 1; break;
        case 'lesson': if (ev.type === 'lesson-completed' && ev.lessonId === o.lessonId) next = 1; break;
        case 'answers':
          if (ev.type === 'answer' && ev.correct && ev.skillId.startsWith(o.skillPrefix) && (!o.context || ev.context === o.context)) next = cur + 1;
          break;
        case 'defeat':
          if (ev.type === 'enemy-defeated' && (!o.enemyId || ev.enemyId === o.enemyId)) next = cur + 1;
          break;
        case 'boss': if (ev.type === 'boss-defeated' && ev.enemyId === o.enemyId) next = 1; break;
        case 'drill':
          if (ev.type === 'drill-finished' && ev.skillPrefix.startsWith(o.skillPrefix) && ev.count >= o.count && ev.accuracy >= o.accuracy) next = 1;
          break;
        case 'mission': if (ev.type === 'mission-completed' && ev.missionId === o.missionId) next = 1; break;
        case 'depth': if (ev.type === 'depth-cleared' && ev.regionId === o.regionId) next = Math.max(cur, ev.depth); break;
        case 'mastery': next = Math.max(cur, Math.round(skillMastery(o.skillId, ctx.mastery, ctx.now))); break;
        case 'collect': next = Math.max(cur, ctx.inventory.items[o.itemId] ?? 0); break;
      }
      if (next !== cur) { progress = { ...progress, [o.id]: next }; changed = true; }
    });
    if (changed) out[q.id] = { ...s, progress };
    if (questComplete(q, out[q.id])) {
      out[q.id] = { ...out[q.id], status: 'completed', completedAt: ctx.now };
      completed.push(q.id);
    }
  }
  return { quests: refreshAvailability(out), completed };
}

/** Re-evaluate passive objectives (mastery, collect) without an event. */
export function refreshPassive(quests: QuestMap, ctx: { mastery: Record<string, MasteryRecord>; inventory: InventoryState; now: number }) {
  return applyEvent(quests, { type: 'region-visited', regionId: '__none__' }, ctx);
}
