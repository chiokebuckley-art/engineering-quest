import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { GameState } from '../engine/state/types';
import type { Action } from '../engine/state/actions';
import { gameReducer } from '../engine/state/reducer';
import { initialState } from '../engine/state/initialState';
import { createSaveSystem, LocalStorageAdapter, serialize, type SaveAdapter } from '../engine/save/SaveSystem';
import { loadIndex, saveIndex, addProfile, updateProfile, removeProfile, clearProfileSave, saveKeyFor, setSyncLink, profileByName, type ProfileIndex } from '../engine/save/profiles';
import { loadSyncConfig, pullSave, pushSave, packSave, readRemote, reconcile, newSyncCode, normalizeCode, validCode, ago, PUSH_DELAY_MS, PULL_GAP_MS, type SyncLink, type RemoteSave } from '../engine/save/sync';
import { Sound, type SoundCue } from '../engine/sound/SoundEngine';

/** Points at the active profile's save slot; switching profiles just moves the key. */
class ProfileAdapter implements SaveAdapter {
  inner: LocalStorageAdapter;
  constructor(id: string) { this.inner = new LocalStorageAdapter(saveKeyFor(id)); }
  use(id: string) { this.inner = new LocalStorageAdapter(saveKeyFor(id)); }
  load() { return this.inner.load(); }
  save(raw: string) { this.inner.save(raw); }
  clear() { this.inner.clear(); }
}
const initialIndex = loadIndex();
const adapter = new ProfileAdapter(initialIndex.active || 'p1');
const saveSystem = createSaveSystem<GameState>(adapter);
let pendingTimer: ReturnType<typeof setTimeout> | undefined;
const doFetch = (i: string, o?: RequestInit) => fetch(i, o);
/** Screens a pulled save may land on without interrupting anything; elsewhere the pull keeps the player where they are. */
const HUB_SCREENS = new Set(['home', 'library', 'me', 'topic', 'friends', 'grownups', 'search', 'setup', 'region', 'map', 'settings', 'dashboard', 'inventory', 'quests', 'achievements', 'lessons', 'skilltree', 'notebook', 'lab', 'academy']);
/** An Equation Plaza game and a left match's room seat belong to the device they were played on, never to a save brought from elsewhere. */
const withoutPlaza = (d: GameState): GameState => ({ ...d, plaza: null, stats: d.stats?.plaza ? { ...d.stats, plaza: { ...d.stats.plaza, paused: undefined } } : d.stats });
/** Mid-run screens: a conflicting cloud copy waits rather than wiping the run. */
const MID_RUN = new Set(['dice', 'battle', 'drill', 'mission', 'lesson', 'dungeon', 'versus', 'rocket', 'millionaire', 'stud', 'gear', 'plaza', 'tycoon', 'countlab', 'mental', 'academy']);

export interface SyncInfo {
  /** False only when sync has been switched off by config. */
  available: boolean;
  busy: boolean;
  /** A short status line for Settings: offline, server trouble, or empty. */
  note: string;
  /** The active profile's link, if it syncs. */
  link: SyncLink | null;
}

interface Store {
  state: GameState;
  dispatch: (a: Action) => void;
  play: (cue: SoundCue) => void;
  exportSave: () => string;
  flushSave: () => void;
  importSave: (raw: string) => boolean;
  hasSave: boolean;
  /** Profiles on this device. */
  profiles: ProfileIndex;
  switchProfile: (id: string) => void;
  newProfile: () => void;
  resetProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  /** Cloud sync for the active profile. */
  sync: SyncInfo;
  turnOnSync: () => Promise<boolean>;
  turnOffSync: () => void;
  syncNow: () => Promise<void>;
  /** Bring a profile from another device by its sync code. Resolves to an error message, or null when linked. */
  linkProfile: (code: string) => Promise<string | null>;
}

const Ctx = createContext<Store | null>(null);

/** When the local copy of a profile was last written (its envelope's savedAt). */
function savedAtFor(id: string): number {
  try { const raw = new LocalStorageAdapter(saveKeyFor(id)).load(); return raw ? Number(JSON.parse(raw)?.savedAt) || 0 : 0; } catch { return 0; }
}

function loadFor(id: string): GameState | null {
  try {
    const raw = new LocalStorageAdapter(saveKeyFor(id)).load();
    return raw ? saveSystem.import(raw) : null;
  } catch { return null; }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<ProfileIndex>(initialIndex);
  const profilesRef = useRef(profiles); profilesRef.current = profiles;
  const [state, rawDispatch] = useReducer(gameReducer, undefined, () => {
    const loaded = initialIndex.active ? loadFor(initialIndex.active) : null;
    return loaded ? gameReducer(initialState(), { type: 'LOAD', state: loaded }) : initialState();
  });

  /* ---------- cloud sync state ---------- */
  const [syncCfg, setSyncCfg] = useState<{ url: string } | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncNote, setSyncNote] = useState('');
  const syncCfgRef = useRef<{ url: string } | null>(null);
  const cfgReady = useRef<Promise<{ url: string } | null>>(Promise.resolve(null));
  /** When this device last changed the save by playing (not by adopting a cloud copy). */
  const localChangedAt = useRef(initialIndex.active ? savedAtFor(initialIndex.active) : 0);
  const pushedAt = useRef(0);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPull = useRef(0);
  const pullRef = useRef<(id: string, link: SyncLink) => void>(() => {});
  const pushRef = useRef<(id: string, link: SyncLink) => void>(() => {});

  // Autosave (debounced) whenever state changes; flush immediately when the tab hides or closes.
  const latest = useRef(state);
  latest.current = state;
  const flush = () => { if (latest.current.character && profilesRef.current.active) void saveSystem.save(latest.current); };
  useEffect(() => {
    if (!state.character || !profiles.active) return;
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { pendingTimer = undefined; void saveSystem.save(latest.current); }, 250);
    // Keep the profile card (name, avatar, level, last played) in step with the character.
    const me = profiles.profiles.find((p) => p.id === profiles.active);
    if (me && (me.name !== state.character.name || me.level !== state.character.level || me.avatar !== state.character.avatar)) {
      const idx = updateProfile(profiles, profiles.active, { name: state.character.name, level: state.character.level, avatar: state.character.avatar, lastPlayedAt: Date.now() });
      saveIndex(idx); setProfiles(idx);
    }
    // A linked profile pushes a little after the last change; idle ticks never wake the network.
    if (me?.sync && localChangedAt.current > pushedAt.current && !pushTimer.current) {
      const link = me.sync; const id = profiles.active;
      pushTimer.current = setTimeout(() => { pushTimer.current = null; pushRef.current(id, link); }, PUSH_DELAY_MS);
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('beforeunload', flush); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Sound.setMuted(!state.settings.sound);
    Sound.setVolume(state.settings.volume);
  }, [state.settings.sound, state.settings.volume]);

  // Energy regeneration: 1 point every 30 s.
  useEffect(() => {
    const t = setInterval(() => rawDispatch({ type: 'TICK', now: Date.now() }), 30_000);
    return () => clearInterval(t);
  }, []);

  /** Save the current profile, drop any pending write, and point the save slot at another profile. */
  const activate = (idx: ProfileIndex, id: string) => {
    flush();
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = undefined; }
    if (pushTimer.current) { clearTimeout(pushTimer.current); pushTimer.current = null; }
    localChangedAt.current = savedAtFor(id); pushedAt.current = 0;
    const next = { ...idx, active: id };
    adapter.use(id || 'p1');
    saveIndex(next); setProfiles(next); profilesRef.current = next;
    const link = next.profiles.find((p) => p.id === id)?.sync;
    if (link) setTimeout(() => pullRef.current(id, link), 0);
  };

  /* ---------- cloud sync: pull when a profile opens or the app comes back, push a little after every change ---------- */
  const applyLink = useCallback((id: string, link: SyncLink | null) => {
    const n = setSyncLink(profilesRef.current, id, link); profilesRef.current = n; saveIndex(n); setProfiles(n);
  }, []);
  const notice = useCallback((text: string) => rawDispatch({ type: 'NOTICE', text, icon: 'cloud-sync' }), []);
  /** Replace this device's copy with the cloud's. */
  const adoptRemote = useCallback(async (id: string, link: SyncLink, remote: RemoteSave) => {
    const data = await readRemote<GameState>(remote.data);
    if (!data) throw new Error('not a save');
    if (profilesRef.current.active !== id) return;
    localChangedAt.current = 0; pushedAt.current = 0;
    if (pushTimer.current) { clearTimeout(pushTimer.current); pushTimer.current = null; }
    const here = latest.current;
    rawDispatch({ type: 'LOAD', keepPlaza: true, state: here.character && HUB_SCREENS.has(here.screen) ? { ...data, screen: here.screen, screenParams: here.screenParams } : data });
    applyLink(id, { code: link.code, rev: remote.rev, at: remote.savedAt });
    notice(`Loaded newer progress from the cloud (saved ${ago(Date.now() - remote.savedAt)}).`);
  }, [applyLink, notice]);
  const pushNow = useCallback(async (id: string, link: SyncLink, keepalive = false): Promise<boolean> => {
    const cfg = syncCfgRef.current ?? (await cfgReady.current);
    const fresh = profilesRef.current.profiles.find((p) => p.id === id)?.sync;
    if (!cfg || !fresh || profilesRef.current.active !== id || !latest.current.character) return false;
    link = { ...link, rev: fresh.rev };
    const savedAt = localChangedAt.current || Date.now();
    const body = await packSave(serialize(latest.current));
    const res = await pushSave(cfg.url, link.code, body, link.rev, savedAt, doFetch, keepalive);
    if (res.ok) { pushedAt.current = savedAt; applyLink(id, { code: link.code, rev: res.rev, at: savedAt }); setSyncNote(''); return true; }
    if ('conflict' in res) {
      const r = res.conflict;
      if (r.savedAt >= savedAt && r.data && !MID_RUN.has(latest.current.screen)) { try { await adoptRemote(id, link, r); return true; } catch { /* keep ours */ } }
      const again = await pushSave(cfg.url, link.code, body, r.rev, savedAt, doFetch, keepalive);
      if (again.ok) { pushedAt.current = savedAt; applyLink(id, { code: link.code, rev: again.rev, at: savedAt }); return true; }
      setSyncNote('Could not save to the cloud just now.'); return false;
    }
    setSyncNote(/connection|fetch|network/i.test(res.error) ? 'Offline: progress will sync when you are back online.' : res.error);
    return false;
  }, [applyLink, adoptRemote]);
  const pullNow = useCallback(async (id: string, link: SyncLink) => {
    const cfg = syncCfgRef.current ?? (await cfgReady.current);
    const fresh = profilesRef.current.profiles.find((p) => p.id === id)?.sync;
    if (!cfg || !fresh) return;
    link = { ...link, rev: fresh.rev, at: fresh.at }; lastPull.current = Date.now();
    try {
      const remote = await pullSave(cfg.url, link.code, doFetch);
      if (profilesRef.current.active !== id) return;
      const what = reconcile(link, localChangedAt.current, remote);
      if (what === 'use-remote' && remote) await adoptRemote(id, link, remote);
      else if (what === 'push') await pushNow(id, link);
      else setSyncNote('');
    } catch (e) { setSyncNote(e instanceof Error && /said \d/.test(e.message) ? e.message : 'Offline: progress will sync when you are back online.'); }
  }, [adoptRemote, pushNow]);
  useEffect(() => { pullRef.current = (id, link) => { void pullNow(id, link); }; pushRef.current = (id, link) => { void pushNow(id, link); }; }, [pullNow, pushNow]);
  useEffect(() => {
    let live = true;
    const pr = loadSyncConfig(doFetch, localStorage, import.meta.env.BASE_URL);
    cfgReady.current = pr;
    pr.then((c) => { syncCfgRef.current = c; if (!live) return; setSyncCfg(c); const id = profilesRef.current.active; const link = profilesRef.current.profiles.find((p) => p.id === id)?.sync; if (c && link) void pullNow(id, link); });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const linked = () => { const id = profilesRef.current.active; const link = profilesRef.current.profiles.find((p) => p.id === id)?.sync; return link && syncCfgRef.current ? { id, link } : null; };
    const flushPush = () => { const l = linked(); if (!l || !pushTimer.current) return; clearTimeout(pushTimer.current); pushTimer.current = null; void pushNow(l.id, l.link, true); };
    const onVis = () => {
      if (document.visibilityState === 'hidden') { flushPush(); return; }
      const l = linked(); if (l && Date.now() - lastPull.current > PULL_GAP_MS && !pushTimer.current) void pullNow(l.id, l.link);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flushPush);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', flushPush); };
  }, [pushNow, pullNow]);

  const store = useMemo<Store>(() => ({
    state,
    // Every action the player takes counts as a local change; only the energy tick (dispatched internally) does not.
    dispatch: (a) => { if (a.type !== 'TICK' && a.type !== 'DISMISS_TOAST' && a.type !== 'NOTICE') localChangedAt.current = Date.now(); rawDispatch(a); },
    play: (cue) => Sound.play(cue),
    exportSave: () => saveSystem.export(state),
    flushSave: flush,
    importSave: (raw) => {
      const file = saveSystem.import(raw);
      const data = file && withoutPlaza(file);
      if (!data) return false;
      let idx = profiles;
      if (!idx.active) { const a = addProfile(idx, data.character?.name ?? 'Imported'); idx = a.index; activate(idx, a.id); }
      localChangedAt.current = Date.now();
      rawDispatch({ type: 'LOAD', state: data });
      return true;
    },
    hasSave: !!state.character,
    profiles,
    switchProfile: (id) => {
      if (!profiles.profiles.some((p) => p.id === id) || id === profiles.active) { if (id === profiles.active && state.character) rawDispatch({ type: 'NAVIGATE', screen: 'home' }); return; }
      const idx = updateProfile(profiles, id, { lastPlayedAt: Date.now() });
      activate(idx, id);
      const loaded = loadFor(id);
      if (loaded?.character) rawDispatch({ type: 'LOAD', state: { ...loaded, screen: 'home' } });
      else rawDispatch({ type: 'NEW_GAME' });
    },
    newProfile: () => {
      const a = addProfile(profiles);
      activate(a.index, a.id);
      rawDispatch({ type: 'NEW_GAME' });
    },
    resetProfile: (id) => {
      clearProfileSave(id);
      const idx = updateProfile(profiles, id, { level: 1, lastPlayedAt: Date.now() });
      saveIndex(idx); setProfiles(idx); profilesRef.current = idx;
      if (id === profiles.active) { if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = undefined; } localChangedAt.current = Date.now(); rawDispatch({ type: 'RESET_PROGRESS' }); }
    },
    deleteProfile: (id) => {
      clearProfileSave(id);
      const idx = removeProfile(profiles, id);
      if (id === profiles.active) {
        if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = undefined; }
        if (pushTimer.current) { clearTimeout(pushTimer.current); pushTimer.current = null; }
        adapter.use(idx.active || 'p1'); saveIndex(idx); setProfiles(idx); profilesRef.current = idx;
        const loaded = idx.active ? loadFor(idx.active) : null;
        if (loaded?.character) rawDispatch({ type: 'LOAD', state: { ...loaded, screen: 'menu' } }); else rawDispatch({ type: 'RESET_PROGRESS' });
      } else { saveIndex(idx); setProfiles(idx); profilesRef.current = idx; }
    },
    renameProfile: (id, name) => { const idx = updateProfile(profiles, id, { name: name.trim().slice(0, 16) || 'Player' }); saveIndex(idx); setProfiles(idx); profilesRef.current = idx; },
    sync: { available: !!syncCfg, busy: syncBusy, note: syncNote, link: profiles.profiles.find((p) => p.id === profiles.active)?.sync ?? null },
    turnOnSync: async () => {
      const id = profiles.active; if (!id || !syncCfg || !state.character) return false;
      setSyncBusy(true);
      const link = { code: newSyncCode(), rev: 0, at: 0 };
      localChangedAt.current = Date.now(); applyLink(id, link);
      const ok = await pushNow(id, link);
      setSyncBusy(false);
      if (ok) notice('Sync is on. Enter the code on your other devices.');
      else { applyLink(id, null); notice('Could not reach the sync server. Try again in a moment.'); }
      return ok;
    },
    turnOffSync: () => {
      if (!profiles.active) return;
      if (pushTimer.current) { clearTimeout(pushTimer.current); pushTimer.current = null; }
      applyLink(profiles.active, null);
      notice('This device no longer syncs this player. The cloud copy stays.');
    },
    syncNow: async () => {
      const id = profiles.active; const link = profiles.profiles.find((p) => p.id === id)?.sync; if (!id || !link) return;
      setSyncBusy(true);
      if (pushTimer.current) { clearTimeout(pushTimer.current); pushTimer.current = null; }
      await pullNow(id, link);
      setSyncBusy(false);
      notice('Synced.');
    },
    linkProfile: async (typed) => {
      const code = normalizeCode(typed);
      if (!validCode(code)) return 'A sync code has 12 letters and numbers, like EQ4K-9TQ2-MHB7.';
      const cfg = syncCfg ?? (await cfgReady.current); if (!cfg) return 'Sync is switched off in this copy of the game.';
      setSyncBusy(true);
      try {
        const remote = await pullSave(cfg.url, code, doFetch);
        if (!remote) return 'No player found for that code. Check it on the other device under Settings → Sync.';
        const cloud = await readRemote<GameState>(remote.data);
        if (!cloud?.character) return 'That code belongs to a different game, not Engineering Quest.';
        const data = withoutPlaza(cloud), who = cloud.character;
        const name = who.name.trim() || 'Player';
        let idx = profilesRef.current; let id: string;
        const existing = profileByName(idx, name);
        if (existing && !existing.sync) {
          // Same name on this device: the newer of the two copies wins the slot.
          id = existing.id;
          if (remote.savedAt >= savedAtFor(id) || !loadFor(id)?.character) new LocalStorageAdapter(saveKeyFor(id)).save(serialize(data));
        } else {
          const made = addProfile(idx, name); idx = made.index; id = made.id;
          idx = updateProfile(idx, id, { level: who.level, avatar: who.avatar });
          new LocalStorageAdapter(saveKeyFor(id)).save(serialize(data));
        }
        idx = setSyncLink(idx, id, { code, rev: remote.rev, at: remote.savedAt });
        activate(idx, id);
        const loaded = loadFor(id) ?? data;
        rawDispatch({ type: 'LOAD', state: { ...loaded, screen: 'home' } });
        notice(`${name} is linked. Progress now syncs on this device.`);
        return null;
      } catch (e) { return e instanceof Error && /too old/.test(e.message) ? e.message : 'Could not reach the sync server. Check the connection and try again.'; }
      finally { setSyncBusy(false); }
    },
  }), [state, profiles, syncCfg, syncBusy, syncNote]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useGame(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useGame outside GameProvider');
  return s;
}

/** Erase the active profile's save (kept for older screens). */
export function clearSave() { void saveSystem.clear(); }


