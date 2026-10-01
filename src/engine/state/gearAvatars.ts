import type { GearState } from './gear';

export const GEAR_AVATARS = ['engineer', 'ian', 'myla', 'ella', 'mom', 'dad'] as const;
export type GearAvatarId = typeof GEAR_AVATARS[number];
export function normalizeGearAvatar(value: unknown): GearAvatarId {
  return GEAR_AVATARS.includes(value as GearAvatarId) ? value as GearAvatarId : 'engineer';
}

/** Feedback belongs to the player who just answered, even after the final advances. */
export function gearSpotlightId(g: GearState): string | undefined {
  let id: string | undefined;
  if (g.phase === 'question' || g.phase === 'feedback') id = g.contestants[g.turn]?.id;
  else if (g.phase === 'final') id = g.final?.current;
  else if (g.phase === 'finalFeedback') id = g.final?.history[g.final.history.length - 1]?.id;
  else if (g.phase === 'over') id = g.winnerId;
  return g.contestants.some(c => c.id === id && c.out === undefined) ? id : undefined;
}

/** Suggest a matching family avatar only when setting up a new player. */
export function suggestedGearAvatar(name: string | undefined): GearAvatarId {
 const id = name?.trim().toLowerCase();
 return GEAR_AVATARS.includes(id as GearAvatarId) ? id as GearAvatarId : 'engineer';
}
