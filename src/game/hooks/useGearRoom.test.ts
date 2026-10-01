// @vitest-environment jsdom
import { act, createContext, createElement, useContext, useReducer } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '../../engine/state/initialState';
import { gameReducer } from '../../engine/state/reducer';
import type { GameState } from '../../engine/state/types';
import type { Action } from '../../engine/state/actions';
import type { RoomHandlers, RoomMessage } from '../net/room';
import { GearRoomProvider, useGearRoom, type GearRoomApi } from './useGearRoom';
import { active, currentId, byId } from '../../engine/state/gear';

const mock = vi.hoisted(() => ({ useGame: vi.fn(), rooms: [] as any[] }));
vi.mock('../store', () => ({ useGame: () => mock.useGame() }));
vi.mock('../net/room', () => ({ Room: class {
  id: string; peers: any[] = [];
  constructor(public code: string, public isHost: boolean, public h: RoomHandlers) { this.id = `peer-${mock.rooms.length}`; mock.rooms.push(this); }
  async open() {}
  async join() { const host = mock.rooms.find(r => r.isHost && r.code === this.code); this.peers.push(host); host.peers.push(this); }
  send(m: RoomMessage) { this.peers.forEach(p => p.h.onMessage(JSON.parse(JSON.stringify(m)), this.id)); }
  sendTo(id: string, m: RoomMessage) { this.peers.find(p => p.id === id)?.h.onMessage(m, this.id); }
  close() { this.peers.forEach(p => { p.peers = p.peers.filter((x: any) => x !== this); p.h.onPeerLeft?.(this.id); }); this.peers = []; }
} }));

type Store = { state: GameState; dispatch: (a: Action) => void };
const ctx = createContext<Store>(null!);
const clients = new Map<string, Store & { api: GearRoomApi }>();
const roots: Root[] = [];
function Probe({ id }: { id: string }) { clients.set(id, { ...useContext(ctx), api: useGearRoom() }); return null; }
function Client({ id, host }: { id: string; host: boolean }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    let s = gameReducer(initialState(), { type: 'CREATE_CHARACTER', name: id, avatar: '', specialization: 'undecided' });
    s = gameReducer(s, { type: 'GEAR_START', setup: { selection: { game: 'mult', key: 'mult:all' }, me: id, friends: [], bots: host ? [{ level: 'easy' }] : [], roundMs: 60_000, online: { roomCode: 'ARENA', isHost: host, myId: `p-${id}` } } });
    return s;
  });
  return createElement(ctx.Provider, { value: { state, dispatch } }, createElement(GearRoomProvider, { children: createElement(Probe, { id }) }));
}
async function mount(id: string, host: boolean) { const root = createRoot(document.createElement('div')); roots.push(root); await act(async () => root.render(createElement(Client, { id, host }))); }
async function action(id: string, a: Action) { await act(async () => clients.get(id)!.dispatch(a)); }
const gear = (id: string) => clients.get(id)!.state.gear!;
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(100000); mock.rooms.length = 0; clients.clear(); mock.useGame.mockImplementation(() => useContext(ctx)); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
afterEach(async () => { for (const root of roots.splice(0)) await act(async () => root.unmount()); vi.useRealTimers(); });

describe('Weakest Gear online rooms', () => {
  it('guests join the lobby, the host launches, turns and votes flow through the host', async () => {
    await mount('host', true); await mount('guest', false);
    expect(gear('host').online!.lobby.map(p => p.name)).toEqual(['host', 'guest']);
    expect(gear('guest').online!.lobby.map(p => p.name)).toEqual(['host', 'guest']);
    await action('host', { type: 'GEAR_LAUNCH' });
    expect(gear('host').phase).toBe('question'); expect(gear('guest').phase).toBe('question');
    expect(gear('guest').contestants.map(c => c.id)).toEqual(gear('host').contestants.map(c => c.id));
    expect(gear('guest').contestants.find(c => c.isMe)!.id).toBe('p-guest');
    expect(gear('host').contestants.find(c => c.isMe)!.id).toBe('p-host');
    // Play until it is the guest's turn, then the guest answers through the room.
    for (let i = 0; i < 12 && currentId(gear('host')) !== 'p-guest'; i++) {
      const g = gear('host'); const cur = byId(g, currentId(g)!);
      if (g.phase === 'question') await action('host', cur.bot ? { type: 'GEAR_BOT' } : { type: 'GEAR_ANSWER', given: String(g.question.answer) });
      else if (g.phase === 'feedback') await action('host', { type: 'GEAR_NEXT' });
    }
    expect(currentId(gear('guest'))).toBe('p-guest');
    const q = gear('guest').question;
    await act(async () => clients.get('guest')!.api.sendAction({ action: 'answer', given: String(q.answer) }));
    expect(gear('host').phase).toBe('feedback'); expect(gear('host').chain).toBeGreaterThan(0);
    expect(gear('guest').phase).toBe('feedback'); expect(gear('guest').feedback!.correct).toBe(true);
    // A guest cannot answer or bank out of turn.
    await action('host', { type: 'GEAR_NEXT' });
    if (currentId(gear('host')) !== 'p-guest') { const before = gear('host'); await act(async () => clients.get('guest')!.api.sendAction({ action: 'bank' })); expect(gear('host')).toBe(before); }
    // Round ends: both vote on their own phones (guest first), the host resolves.
    await action('host', { type: 'GEAR_TIMEOUT' });
    expect(gear('guest').phase).toBe('vote');
    await act(async () => clients.get('guest')!.api.sendAction({ action: 'vote', targetId: 'p-host' }));
    expect(gear('host').votes['p-guest']).toBe('p-host'); expect(gear('host').phase).toBe('vote');
    const bot = active(gear('host')).find(c => c.bot)!.id;
    await action('host', { type: 'GEAR_VOTE', voterId: 'p-host', targetId: bot });
    expect(['eliminated', 'tiebreak']).toContain(gear('host').phase);
    expect(gear('guest').phase).toBe(gear('host').phase);
  });
  it('rejects late joiners once the show has started and drops a guest who disconnects', async () => {
    await mount('host', true); await mount('guest', false);
    await action('host', { type: 'GEAR_LAUNCH' });
    await mount('late', false);
    expect(clients.get('late')!.api.error).toContain('already playing');
    await act(async () => mock.rooms[1].close());
    expect(gear('host').contestants.find(c => c.id === 'p-guest')!.out).toBeDefined();
    expect(active(gear('host')).length).toBe(2);
  });
});
