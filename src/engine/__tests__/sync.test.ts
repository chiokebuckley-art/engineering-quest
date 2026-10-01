import { describe, it, expect } from 'vitest';
import { newSyncCode, normalizeCode, validCode, formatCode, reconcile, packSave, unpackSave, pullSave, pushSave, loadSyncConfig, readRemote, DEFAULT_SYNC_URL, SYNC_URL_KEY, CODE_PREFIX, type Fetch } from '../save/sync';
import { serialize } from '../save/SaveSystem';
import { setSyncLink, profileByName, type ProfileIndex } from '../save/profiles';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';

const res = (status: number, body: unknown) => ({ status, ok: status >= 200 && status < 300, json: async () => body }) as unknown as Response;

describe('sync codes', () => {
  it('are 12 characters, start with EQ and avoid look-alike letters', () => {
    for (let i = 0; i < 50; i++) { const c = newSyncCode(); expect(c).toHaveLength(12); expect(c.startsWith(CODE_PREFIX)).toBe(true); expect(validCode(c)).toBe(true); expect(c).not.toMatch(/[IO01]/); }
  });
  it('normalise what a kid types', () => {
    expect(normalizeCode(' eq4k-9tq2-mhb7 ')).toBe('EQ4K9TQ2MHB7');
    expect(validCode(normalizeCode('eq4k-9tq2-mhb7'))).toBe(true);
    expect(validCode('EQ4K9TQ2MHB')).toBe(false);
    expect(validCode('EQ4K9TQ2MHB0')).toBe(false);
    expect(formatCode('EQ4K9TQ2MHB7')).toBe('EQ4K-9TQ2-MHB7');
  });
});

describe('reconcile', () => {
  const link = { code: 'EQ4K9TQ2MHB7', rev: 3, at: 1000 };
  it('pushes when the cloud has nothing', () => { expect(reconcile(link, 1000, null)).toBe('push'); });
  it('does nothing when both sides are where we left them', () => { expect(reconcile(link, 1000, { rev: 3, savedAt: 1000, data: '' })).toBe('same'); });
  it('pushes local changes when the cloud has not moved', () => { expect(reconcile(link, 2000, { rev: 3, savedAt: 1000, data: '' })).toBe('push'); });
  it('takes the cloud copy when another device played and we did not', () => { expect(reconcile(link, 1000, { rev: 4, savedAt: 1500, data: '' })).toBe('use-remote'); });
  it('when both changed, the later save wins', () => {
    expect(reconcile(link, 2000, { rev: 4, savedAt: 3000, data: '' })).toBe('use-remote');
    expect(reconcile(link, 4000, { rev: 4, savedAt: 3000, data: '' })).toBe('push');
  });
});

describe('packing', () => {
  it('round-trips a save and shrinks it well under the server cap', async () => {
    let s = gameReducer(initialState(), { type: 'NEW_GAME' });
    s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'Kid', avatar: 'a1', specialization: 'chemical' });
    for (let run = 0; run < 40; run++) {
      s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'practice', selection: 'mult:all' });
      for (let i = 0; i < 50 && s.arcade?.question; i++) { s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade.question.answer) }); if (s.arcade?.feedback) s = gameReducer(s, { type: 'ARCADE_NEXT' }); }
      s = gameReducer(s, { type: 'ARCADE_EXIT' });
    }
    const raw = serialize(s);
    expect(raw.length).toBeGreaterThan(150_000);
    const packed = await packSave(raw);
    expect(packed.startsWith('gz1:')).toBe(true);
    expect(packed.length).toBeLessThan(raw.length / 4);
    expect(await unpackSave(packed)).toBe(raw);
    const data = await readRemote<typeof s>(packed);
    expect(data?.character?.name).toBe('Kid');
  });
  it('passes plain text through and rejects saves from other games', async () => {
    expect(await unpackSave('{"a":1}')).toBe('{"a":1}');
    expect(await readRemote('{"name":"Word Raider","quest":{}}')).toBeNull();
    expect(await readRemote(serialize({ hello: 1 }))).toBeNull();
  });
});

describe('server calls', () => {
  it('pull: 404 means no save yet, other errors throw', async () => {
    expect(await pullSave('https://s', 'EQ4K9TQ2MHB7', (async () => res(404, { error: 'none' })) as Fetch)).toBeNull();
    const got = await pullSave('https://s', 'EQ4K9TQ2MHB7', (async () => res(200, { rev: 2, savedAt: 5, data: 'x' })) as Fetch);
    expect(got).toEqual({ rev: 2, savedAt: 5, data: 'x' });
    await expect(pullSave('https://s', 'EQ4K9TQ2MHB7', (async () => res(503, { error: 'down' })) as Fetch)).rejects.toThrow('503');
  });
  it('push: sends text/plain with the base revision and reports conflicts', async () => {
    let seen: { url: string; init?: RequestInit } | null = null;
    const ok = await pushSave('https://s', 'EQ4K9TQ2MHB7', 'DATA', 2, 777, (async (url, init) => { seen = { url, init }; return res(200, { rev: 3, savedAt: 777 }); }) as Fetch);
    expect(ok).toEqual({ ok: true, rev: 3, savedAt: 777 });
    expect(seen!.url).toBe('https://s/v1/save/EQ4K9TQ2MHB7');
    expect((seen!.init!.headers as Record<string, string>)['content-type']).toBe('text/plain');
    expect(JSON.parse(seen!.init!.body as string)).toEqual({ data: 'DATA', baseRev: 2, savedAt: 777 });
    const conflict = await pushSave('https://s', 'EQ4K9TQ2MHB7', 'DATA', 2, 777, (async () => res(409, { conflict: true, rev: 5, savedAt: 900, data: 'THEIRS' })) as Fetch);
    expect(conflict).toEqual({ ok: false, conflict: { rev: 5, savedAt: 900, data: 'THEIRS' } });
    const offline = await pushSave('https://s', 'EQ4K9TQ2MHB7', 'DATA', 2, 777, (async () => { throw new TypeError('Failed to fetch'); }) as Fetch);
    expect(offline).toEqual({ ok: false, error: 'Failed to fetch' });
  });
  it('config: localStorage override, then sync.json, then the shared default; "off" disables', async () => {
    const store = (v: string | null) => ({ getItem: () => v });
    expect(await loadSyncConfig((async () => res(404, {})) as Fetch, store('https://mine.example/'))).toEqual({ url: 'https://mine.example' });
    expect(await loadSyncConfig((async () => res(200, { url: 'https://json.example' })) as Fetch, store(null))).toEqual({ url: 'https://json.example' });
    expect(await loadSyncConfig((async () => { throw new Error('offline'); }) as Fetch, store(null))).toEqual({ url: DEFAULT_SYNC_URL });
    expect(await loadSyncConfig((async () => res(404, {})) as Fetch, store('off'))).toBeNull();
    expect(SYNC_URL_KEY).toBe('engineering-quest.sync.url');
  });
});

describe('profile links', () => {
  const idx: ProfileIndex = { active: 'p1', profiles: [{ id: 'p1', name: 'Ada', level: 3, createdAt: 1, lastPlayedAt: 2 }, { id: 'p2', name: 'Max', level: 1, createdAt: 1, lastPlayedAt: 2 }] };
  it('attach and remove without touching other profiles', () => {
    const linked = setSyncLink(idx, 'p1', { code: 'EQ4K9TQ2MHB7', rev: 1, at: 9 });
    expect(linked.profiles[0].sync?.code).toBe('EQ4K9TQ2MHB7');
    expect(linked.profiles[1].sync).toBeUndefined();
    expect(setSyncLink(linked, 'p1', null).profiles[0]).not.toHaveProperty('sync');
  });
  it('find a profile by name, ignoring case', () => { expect(profileByName(idx, ' max ')?.id).toBe('p2'); expect(profileByName(idx, 'Zed')).toBeUndefined(); });
});
