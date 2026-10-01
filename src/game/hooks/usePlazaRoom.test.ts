// @vitest-environment jsdom
import { act, createContext, createElement, useContext, useReducer } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '../../engine/state/initialState';
import { gameReducer } from '../../engine/state/reducer';
import type { GameState } from '../../engine/state/types';
import type { Action } from '../../engine/state/actions';
import type { RoomHandlers, RoomMessage } from '../net/room';
import { PlazaRoomProvider, usePlazaRoom, type PlazaRoomApi } from './usePlazaRoom';
import { DEFAULT_PLAZA, currentPlazaPlayer, findPlazaMoves } from '../../engine/state/plaza';

const mock = vi.hoisted(() => ({ useGame: vi.fn(), rooms: [] as any[], actions: [] as any[] }));
vi.mock('../store', () => ({ useGame: () => mock.useGame() }));
vi.mock('../net/room', () => ({ Room: class {
  id: string; peers: any[] = []; closed = false; mute = false;
  constructor(public code: string, public isHost: boolean, public h: RoomHandlers) { this.id = `peer-${mock.rooms.length}`; mock.rooms.push(this); }
  async open() { if (mock.rooms.some(r => r !== this && r.isHost && !r.closed && r.code === this.code)) throw new Error('That room code is already in use. Try another.'); }
  async join() {
    const host = mock.rooms.find(r => r.isHost && !r.closed && r.code === this.code);
    if (!host) throw new Error('No room with that code. Check the letters with the host.');
    this.peers.push(host); host.peers.push(this);
  }
  send(m: RoomMessage) { this.peers.forEach(p => !this.mute && !p.mute && p.h.onMessage(JSON.parse(JSON.stringify(m)), this.id)); }
  sendTo(id: string, m: RoomMessage) { const p = this.peers.find(x => x.id === id); if (p && !this.mute && !p.mute) p.h.onMessage(m, this.id); }
  drop(id: string) { const p = this.peers.find(x => x.id === id); if (!p) return; this.peers = this.peers.filter(x => x !== p); p.peers = p.peers.filter((x: any) => x !== this); p.h.onPeerLeft?.(this.id); this.h.onPeerLeft?.(p.id); }
  close() { this.closed = true; this.peers.forEach(p => { p.peers = p.peers.filter((x: any) => x !== this); p.h.onPeerLeft?.(this.id); }); this.peers = []; }
} }));

type Store = { state: GameState; dispatch: (a: Action) => void };
const ctx = createContext<Store>(null!);
const clients = new Map<string, Store & { api: PlazaRoomApi }>();
const roots = new Map<string, Root>();
function Probe({ id }: { id: string }) { clients.set(id, { ...useContext(ctx), api: usePlazaRoom() }); return null; }
/** A device. `saved`: it opens a save, as after a reload; otherwise it starts a fresh online game. */
function Client({ id, host, saved }: { id: string; host: boolean; saved?: GameState }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    if (saved) return gameReducer(initialState(), { type: 'LOAD', state: JSON.parse(JSON.stringify(saved)) });
    let s = gameReducer(initialState(), { type: 'CREATE_CHARACTER', name: id, avatar: '', specialization: 'undecided' });
    s = gameReducer(s, { type: 'PLAZA_START', setup: { mode: 'online', config: { ...DEFAULT_PLAZA, rounds: 5 }, name: id, online: { code: 'ABCD', host, myId: `p-${id}` } } });
    return s;
  });
  return createElement(ctx.Provider, { value: { state, dispatch } }, createElement(PlazaRoomProvider, { children: createElement(Probe, { id }) }));
}
async function mount(id: string, host: boolean, saved?: GameState) { const root = createRoot(document.createElement('div')); roots.set(id, root); await act(async () => root.render(createElement(Client, { id, host, saved }))); }
/** Close the app on that device: its room closes with it. */
async function unmount(id: string) { const root = roots.get(id)!; roots.delete(id); await act(async () => root.unmount()); }
const wait = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const api = (id: string) => clients.get(id)!.api;
async function action(id: string, a: Action) { await act(async () => clients.get(id)!.dispatch(a)); }
const plaza = (id: string) => clients.get(id)!.state.plaza!;
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(100000); mock.rooms.length = 0; mock.actions.length = 0; clients.clear(); mock.useGame.mockImplementation(() => { const value = useContext(ctx); return { ...value, dispatch: (a: Action) => { mock.actions.push(a); value.dispatch(a); } }; }); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
afterEach(async () => { for (const root of roots.values()) await act(async () => root.unmount()); roots.clear(); vi.useRealTimers(); });

describe('Equation Plaza online rooms', () => {
  it('joins, shares host settings, hides private racks and completes equal-turn matches', async () => {
    await mount('host', true); await mount('guest', false);
    expect(plaza('guest').online!.lobby.map(p => p.name)).toEqual(['host', 'guest']);
    await action('host', { type: 'PLAZA_LAUNCH' });
    expect(plaza('guest').phase).toBe('playing');
    expect(plaza('guest').players[0].rack).toEqual([]);
    expect(plaza('guest').config).toEqual(plaza('host').config);
    while (plaza('host').phase === 'playing') {
      const g = plaza('host'), player = currentPlazaPlayer(g), move = findPlazaMoves(g, player.rack)[0];
      expect(move).toBeDefined();
      if (player.id === 'p-host') await action('host', { type: 'PLAZA_PLAY', move });
      else {
        expect(currentPlazaPlayer(plaza('guest')).rack).toEqual(player.rack);
        await act(async () => clients.get('guest')!.api.sendAction({ kind: 'play', move }));
      }
      expect(plaza('guest').board).toEqual(plaza('host').board);
      expect(plaza('guest').rev).toEqual(plaza('host').rev);
    }
    expect(plaza('host').players.map(p => p.turns)).toEqual([5, 5]);
    expect(plaza('guest').phase).toBe('over');
    expect(clients.get('host')!.state.stats.plaza.sessions).toBe(1);
    expect(clients.get('guest')!.state.stats.plaza.sessions).toBe(1);
    expect(clients.get('guest')!.state.stats.plaza.equations).toBe(plaza('host').players[1].equations);
  });
  it('rejects out-of-turn, forged, invalid and repeated commands without changing the board', async () => {
    await mount('host', true); await mount('guest', false); await action('host', { type: 'PLAZA_LAUNCH' });
    const initial = plaza('host');
    await act(async () => clients.get('guest')!.api.sendAction({ kind: 'swap' }));
    expect(plaza('host')).toBe(initial);
    expect(clients.get('guest')!.api.error).toContain('turn');
    await act(async () => mock.rooms[0].h.onMessage({ t: 'pact', id: 'p-host', rev: initial.rev, action: { kind: 'swap' } }, mock.rooms[1].id));
    expect(plaza('host')).toBe(initial);
    await action('host', { type: 'PLAZA_SWAP' });
    const before = plaza('host');
    await act(async () => clients.get('guest')!.api.sendAction({ kind: 'play', move: { start: 57, direction: 'across', tokens: [...'1+1=9'] } }));
    expect(plaza('host')).toBe(before);
    const msg = { t: 'pact', id: 'p-guest', rev: before.rev, action: { kind: 'swap' } };
    await act(async () => { mock.rooms[1].send(msg); mock.rooms[1].send(msg); });
    expect(plaza('host').players[1].turns).toBe(1);
    const after = plaza('host'); await act(async () => mock.rooms[1].send(msg)); expect(plaza('host')).toBe(after);
  });
  it('ignores stale/malformed views and rejects late joins', async () => {
    await mount('host', true); await mount('guest', false);
    const lobby = plaza('guest'); await action('host', { type: 'PLAZA_LAUNCH' });
    const playing = plaza('guest');
    await act(async () => mock.rooms[0].sendTo(mock.rooms[1].id, { t: 'pstate', state: lobby })); expect(plaza('guest')).toBe(playing);
    await act(async () => mock.rooms[0].sendTo(mock.rooms[1].id, { t: 'pstate', state: { ...playing, rev: 999, players: null } })); expect(plaza('guest')).toBe(playing);
    await mount('late', false); expect(clients.get('late')!.api.error).toContain('already playing');
  });
  it('drops lobby members who disconnect; the host can end a match for everyone, which never counts', async () => {
    await mount('host', true); await mount('guest', false);
    await act(async () => mock.rooms[1].close()); expect(plaza('host').online!.lobby).toHaveLength(1);
    await mount('guest2', false); await action('host', { type: 'PLAZA_LAUNCH' });
    expect(plaza('guest2').players.find(p => p.name === 'host')!.id).toBe('seat-1'); // nobody else learns a seat's id
    await action('host', { type: 'PLAZA_END_EARLY' });
    expect(plaza('host')).toMatchObject({ phase: 'over', endedEarly: true }); expect(plaza('guest2').phase).toBe('over');
    expect(clients.get('host')!.state.stats.plaza.sessions).toBe(0); expect(clients.get('guest2')!.state.stats.plaza.sessions).toBe(0);
  });
  it('keeps the seat of a player who closes the app, and gives it back when they open it again', async () => {
    await mount('host', true); await mount('guest', false); await action('host', { type: 'PLAZA_LAUNCH' });
    const first = plaza('host'); await action('host', { type: 'PLAZA_PLAY', move: findPlazaMoves(first, currentPlazaPlayer(first).rack)[0] });
    const saved = clients.get('guest')!.state;
    await unmount('guest');
    expect(plaza('host').phase).toBe('playing'); expect(plaza('host').players[1].away).toBe(true);
    expect(currentPlazaPlayer(plaza('host')).id).toBe('p-guest'); // their turn waits for them
    await mount('guest', false, saved);
    expect(api('guest').connected).toBe(true); expect(plaza('host').players[1].away).toBe(false);
    expect(plaza('guest').rev).toBe(plaza('host').rev); expect(plaza('guest').board).toEqual(plaza('host').board);
    expect(currentPlazaPlayer(plaza('guest')).rack).toEqual(currentPlazaPlayer(plaza('host')).rack);
    const g = plaza('host'), move = findPlazaMoves(g, currentPlazaPlayer(g).rack)[0];
    await act(async () => api('guest').sendAction({ kind: 'play', move }));
    expect(plaza('host').players[1].turns).toBe(1); expect(plaza('guest').board).toEqual(plaza('host').board);
  });
  it('goes back into the room after Leave with one tap, no code needed', async () => {
    await mount('host', true); await mount('guest', false); await action('host', { type: 'PLAZA_LAUNCH' });
    await action('guest', { type: 'PLAZA_EXIT' });
    expect(clients.get('guest')!.state.plaza).toBeNull(); expect(plaza('host').players[1].away).toBe(true);
    expect(clients.get('guest')!.state.stats.plaza.paused?.game.online?.code).toBe('ABCD');
    await action('guest', { type: 'PLAZA_RESUME' });
    expect(api('guest').connected).toBe(true); expect(plaza('host').players[1].away).toBe(false);
    expect(plaza('guest').rev).toBe(plaza('host').rev);
  });
  it('a host who reloads reopens the same room, and everyone reconnects on their own', async () => {
    await mount('host', true); await mount('guest', false); await action('host', { type: 'PLAZA_LAUNCH' });
    const g = plaza('host'); await action('host', { type: 'PLAZA_PLAY', move: findPlazaMoves(g, currentPlazaPlayer(g).rack)[0] });
    const saved = clients.get('host')!.state;
    await unmount('host');
    expect(api('guest').connected).toBe(false); expect(api('guest').reconnecting).toBe(true); expect(api('guest').error).toBe('');
    await wait(1600); // a try while the host is still gone
    expect(api('guest').reconnecting).toBe(true);
    await mount('host', true, saved);
    expect(api('host').connected).toBe(true); expect(plaza('host').players[1].away).toBe(true);
    await wait(3100); // the guest's next try finds the reopened room
    expect(api('guest').connected).toBe(true); expect(api('guest').reconnecting).toBe(false);
    expect(plaza('host').players[1].away).toBe(false); expect(plaza('guest').rev).toBe(plaza('host').rev);
    const now = plaza('host'), move = findPlazaMoves(now, currentPlazaPlayer(now).rack)[0];
    await act(async () => api('guest').sendAction({ kind: 'play', move }));
    expect(plaza('host').players.map(p => p.turns)).toEqual([1, 1]);
  });
  it('notices a player whose link goes quiet (a sleeping phone), and lets them straight back in', async () => {
    await mount('host', true); await mount('guest', false); await action('host', { type: 'PLAZA_LAUNCH' });
    await wait(9000); expect(plaza('host').players[1].away).toBeFalsy(); // pings answered: all well
    mock.rooms[1].mute = true; // nothing gets through, but nothing closes either
    await wait(20_000);
    // The host closed the quiet link and marked the seat away; the guest came back on a fresh link.
    expect(mock.actions.some(a => a.type === 'PLAZA_SEATS' && a.here.length === 0)).toBe(true);
    expect(mock.rooms[0].peers).not.toContain(mock.rooms[1]); expect(mock.rooms.length).toBeGreaterThan(2);
    expect(api('guest').connected).toBe(true); expect(plaza('host').players[1].away).toBe(false);
  });
  it('notices a player who drops a moment after joining, but never times out an older copy of the game', async () => {
    await mount('host', true);
    await act(async () => mock.rooms[0].h.onMessage({ t: 'phello', id: 'p-old', name: 'Old' }, 'peer-old')); // no heartbeat in its hello
    await mount('guest', false); await action('host', { type: 'PLAZA_LAUNCH' });
    mock.rooms[1].mute = true; // gone before the first regular ping
    await wait(20_000);
    expect(mock.actions.some(a => a.type === 'PLAZA_SEATS' && !a.here.includes('p-guest'))).toBe(true);
    expect(mock.actions.some(a => a.type === 'PLAZA_SEATS' && !a.here.includes('p-old'))).toBe(false);
    expect(plaza('host').players.find(p => p.name === 'Old')!.away).toBeFalsy();
  });
  it('a guest that stops hearing the host reconnects on its own', async () => {
    await mount('host', true); await mount('guest', false); await action('host', { type: 'PLAZA_LAUNCH' });
    await wait(5000);
    mock.rooms[0].mute = true; // the host's side goes quiet
    await wait(17_000); expect(api('guest').connected).toBe(false); expect(api('guest').reconnecting).toBe(true);
    mock.rooms[0].mute = false;
    await wait(15_000); expect(api('guest').connected).toBe(true); expect(plaza('guest').rev).toBe(plaza('host').rev);
  });
  it('gives up after a while with a Try again, and never lets two screens bump each other', async () => {
    await mount('host', true); await mount('guest', false); await action('host', { type: 'PLAZA_LAUNCH' });
    const saved = clients.get('guest')!.state;
    await mount('tab2', false, saved); // the same seat opened on a second screen
    expect(api('tab2').connected).toBe(true);
    expect(api('guest').connected).toBe(false); expect(api('guest').error).toContain('another screen'); expect(api('guest').reconnecting).toBe(false);
    await wait(60_000); expect(api('guest').connected).toBe(false); // it does not take the seat back on its own
    const hostSave = clients.get('host')!.state;
    await unmount('host');
    for (let k = 0; k < 40 && api('tab2').reconnecting; k++) await wait(10_000);
    expect(api('tab2').reconnecting).toBe(false); expect(api('tab2').error).toContain('Could not reach room ABCD');
    await mount('host', true, hostSave);
    await act(async () => api('tab2').retry());
    expect(api('tab2').connected).toBe(true); expect(api('tab2').error).toBe('');
    expect(api('guest').connected).toBe(false); expect(api('guest').reconnecting).toBe(false);
  });
});
