import { SAVE_KEY } from './SaveSystem';
import type { SyncLink } from './sync';

/**
 * Profiles: several players on one device, each with their own save. No passwords:
 * this is a family game, switching and resetting should be one tap (plus a confirm).
 */
export const PROFILES_KEY = 'engineering-quest.profiles';
export const LEGACY_ID = 'p1';

/** `sync` is set while this device syncs the profile with the cloud (see sync.ts). */
export interface ProfileMeta { id: string; name: string; avatar?: string; level: number; createdAt: number; lastPlayedAt: number; sync?: SyncLink }
export interface ProfileIndex { active: string; profiles: ProfileMeta[] }

export interface KeyValue { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

function storage(): KeyValue | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

/** The save key for a profile. The first profile keeps the original key so old saves carry over. */
export const saveKeyFor = (id: string) => (id === LEGACY_ID ? SAVE_KEY : `${SAVE_KEY}.${id}`);

export const newProfileId = () => `p-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/** Read the index, creating it from a legacy single save when this is the first run with profiles. */
export function loadIndex(kv: KeyValue | null = storage()): ProfileIndex {
  const empty: ProfileIndex = { active: '', profiles: [] };
  if (!kv) return empty;
  try {
    const raw = kv.getItem(PROFILES_KEY);
    if (raw) { const idx = JSON.parse(raw) as ProfileIndex; if (idx && Array.isArray(idx.profiles)) return { active: idx.active ?? '', profiles: idx.profiles }; }
  } catch { /* fall through */ }
  // Migration: an existing save becomes profile p1.
  const legacy = kv.getItem(SAVE_KEY);
  if (legacy) {
    let name = 'Player'; let level = 1; let avatar: string | undefined;
    try { const c = JSON.parse(legacy)?.data?.character; if (c?.name) { name = c.name; level = c.level ?? 1; avatar = c.avatar; } } catch { /* ignore */ }
    const idx: ProfileIndex = { active: LEGACY_ID, profiles: [{ id: LEGACY_ID, name, level, avatar, createdAt: Date.now(), lastPlayedAt: Date.now() }] };
    saveIndex(idx, kv);
    return idx;
  }
  return empty;
}

export function saveIndex(idx: ProfileIndex, kv: KeyValue | null = storage()) {
  try { kv?.setItem(PROFILES_KEY, JSON.stringify(idx)); } catch { /* ignore */ }
}

export function addProfile(idx: ProfileIndex, name = 'New player', now = Date.now()): { index: ProfileIndex; id: string } {
  const id = idx.profiles.length === 0 && !idx.profiles.some((p) => p.id === LEGACY_ID) ? LEGACY_ID : newProfileId();
  const meta: ProfileMeta = { id, name, level: 1, createdAt: now, lastPlayedAt: now };
  return { index: { active: id, profiles: [...idx.profiles, meta] }, id };
}

export function updateProfile(idx: ProfileIndex, id: string, patch: Partial<ProfileMeta>): ProfileIndex {
  return { ...idx, profiles: idx.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

export function removeProfile(idx: ProfileIndex, id: string): ProfileIndex {
  const profiles = idx.profiles.filter((p) => p.id !== id);
  return { active: idx.active === id ? (profiles[0]?.id ?? '') : idx.active, profiles };
}

/** Attach or remove a sync link. */
export function setSyncLink(idx: ProfileIndex, id: string, link: SyncLink | null): ProfileIndex {
  return { ...idx, profiles: idx.profiles.map((p) => { if (p.id !== id) return p; const { sync: _drop, ...rest } = p; return link ? { ...rest, sync: link } : rest; }) };
}

export const profileByName = (idx: ProfileIndex, name: string) => idx.profiles.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());

/** Wipe a profile's progress but keep its slot. */
export function clearProfileSave(id: string, kv: KeyValue | null = storage()) {
  try { kv?.removeItem(saveKeyFor(id)); } catch { /* ignore */ }
}
