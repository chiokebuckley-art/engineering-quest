import { describe, it, expect } from 'vitest';
import { loadIndex, saveIndex, addProfile, updateProfile, removeProfile, clearProfileSave, saveKeyFor, LEGACY_ID, PROFILES_KEY, type KeyValue } from '../save/profiles';
import { SAVE_KEY } from '../save/SaveSystem';

const mem = (): KeyValue & { m: Map<string, string> } => { const m = new Map<string, string>(); return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); }, removeItem: (k) => { m.delete(k); } }; };

describe('Profiles', () => {
  it('migrates an existing single save into profile p1 with the character name', () => {
    const kv = mem();
    kv.setItem(SAVE_KEY, JSON.stringify({ schemaVersion: 1, savedAt: 1, data: { character: { name: 'Chioke', level: 7, avatar: '/a.svg' } } }));
    const idx = loadIndex(kv);
    expect(idx.active).toBe(LEGACY_ID); expect(idx.profiles).toHaveLength(1); expect(idx.profiles[0]).toMatchObject({ id: 'p1', name: 'Chioke', level: 7, avatar: '/a.svg' });
    expect(kv.getItem(PROFILES_KEY)).toBeTruthy();
    expect(saveKeyFor('p1')).toBe(SAVE_KEY); expect(saveKeyFor('p-xyz')).toBe(`${SAVE_KEY}.p-xyz`);
  });
  it('starts empty on a fresh device and adds, renames, resets and removes profiles', () => {
    const kv = mem();
    let idx = loadIndex(kv); expect(idx).toEqual({ active: '', profiles: [] });
    const a = addProfile(idx, 'Ava', 10); idx = a.index; expect(a.id).toBe(LEGACY_ID); expect(idx.active).toBe('p1');
    const b = addProfile(idx, 'Ben', 20); idx = b.index; expect(b.id).not.toBe('p1'); expect(idx.active).toBe(b.id); expect(idx.profiles).toHaveLength(2);
    idx = updateProfile(idx, b.id, { name: 'Benji', level: 3 }); expect(idx.profiles[1]).toMatchObject({ name: 'Benji', level: 3 });
    saveIndex(idx, kv); expect(loadIndex(kv)).toEqual(idx);
    kv.setItem(saveKeyFor(b.id), 'x'); clearProfileSave(b.id, kv); expect(kv.getItem(saveKeyFor(b.id))).toBeNull();
    idx = removeProfile(idx, b.id); expect(idx.active).toBe('p1'); expect(idx.profiles).toHaveLength(1);
    idx = removeProfile(idx, 'p1'); expect(idx.active).toBe(''); expect(idx.profiles).toHaveLength(0);
  });
});
