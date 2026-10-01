// @vitest-environment jsdom
import { act, createContext, createElement, useContext, useReducer } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '../../engine/state/initialState';
import { gameReducer } from '../../engine/state/reducer';
import type { GameState } from '../../engine/state/types';
import type { Action } from '../../engine/state/actions';
import type { RoomHandlers, RoomMessage } from '../net/room';
import { VersusRoomProvider, useVersusRoom, type VersusRoomApi } from './useVersusRoom';
import { battleView } from '../naval/battle';

const mock = vi.hoisted(() => ({ useGame: vi.fn(), rooms: [] as any[] }));
vi.mock('../store', () => ({ useGame: () => mock.useGame() }));
vi.mock('../net/room', () => ({ Room: class {
  id: string; peers: any[] = [];
  constructor(public code: string, public isHost: boolean, public h: RoomHandlers) { this.id = `peer-${mock.rooms.length}`; mock.rooms.push(this); }
  async open() {}
  async join() { const host = mock.rooms.find(r => r.isHost && r.code === this.code); this.peers.push(host); host.peers.push(this); }
  send(m: RoomMessage) { this.peers.forEach(p => p.h.onMessage(m, this.id)); }
  sendTo(id: string, m: RoomMessage) { this.peers.find(p => p.id === id)?.h.onMessage(m, this.id); }
  close() { this.peers.forEach(p => { p.peers = p.peers.filter((x: any) => x !== this); p.h.onPeerLeft?.(this.id); }); this.peers = []; }
} }));

type Store = { state: GameState; dispatch: (a: Action) => void };
const ctx = createContext<Store>(null!);
const clients = new Map<string, Store & { api: VersusRoomApi }>();
const roots: Root[] = [];
function Probe({ id }: { id: string }) { clients.set(id, { ...useContext(ctx), api: useVersusRoom() }); return null; }
function Client({ id, host, levels }: { id: string; host: boolean; levels?: { game: 'mult' | 'div'; selection: string }[] }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => gameReducer(initialState(), { type: 'VERSUS_SETUP', kind: 'online', game: 'mult', selection: 'mult:7', names: [id], isHost: host, roomCode: 'TEST', levels }));
  return createElement(ctx.Provider, { value: { state, dispatch } }, createElement(VersusRoomProvider, { children: createElement(Probe, { id }) }));
}
async function mount(id: string, host: boolean, levels?: { game: 'mult' | 'div'; selection: string }[]) { const root = createRoot(document.createElement('div')); roots.push(root); await act(async () => root.render(createElement(Client, { id, host, levels }))); }
async function action(id: string, a: Action) { await act(async () => clients.get(id)!.dispatch(a)); }
const round = async () => { await act(async () => clients.get('host')!.api.startRound()); vi.setSystemTime(clients.get('host')!.state.versus!.startAt!); for (const id of ['host', 'guest']) await action(id, { type: 'VERSUS_BEGIN_TURN' }); };
const answer = async (id: string) => { await action(id, { type: 'ARCADE_ANSWER', given: String(clients.get(id)!.state.arcade!.question.answer) }); await action(id, { type: 'ARCADE_NEXT' }); };
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(100000); mock.rooms.length = 0; clients.clear(); mock.useGame.mockImplementation(() => useContext(ctx)); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
afterEach(async () => { for (const root of roots.splice(0)) await act(async () => root.unmount()); vi.useRealTimers(); });

describe('connected naval rounds', () => {
  it('synchronizes two clients, ignores echo/stale packets, agrees on sinking, and resets a rematch', async () => {
    await mount('host', true); await mount('guest', false);
    expect(clients.get('host')!.state.versus!.players).toHaveLength(2);
    await round();
    expect(clients.get('host')!.state.arcade!.question.expression).toBe(clients.get('guest')!.state.arcade!.question.expression);
    await answer('host'); await answer('host'); await answer('host'); await answer('guest');
    const hv = clients.get('host')!.state.versus!; const gv = clients.get('guest')!.state.versus!;
    const normalize = (v: typeof hv) => battleView(v).ships.map(({ isMe: _me, ...s }) => s);
    expect(normalize(hv)).toEqual(normalize(gv));
    const stale: RoomMessage = { t: 'progress', id: gv.myId, score: 0, correct: 0, done: false, roundId: `${gv.seed}:${gv.startAt}` };
    await act(async () => mock.rooms[1].send(stale));
    expect(clients.get('host')!.state.versus!.players.find(p => p.id === gv.myId)!.score).toBeGreaterThan(0);
    for (const id of ['host', 'guest']) { await action(id, { type: 'ARCADE_TIMEOUT' }); await action(id, { type: 'VERSUS_CONTINUE' }); }
    expect(clients.get('host')!.state.versus!.status).toBe('results'); expect(clients.get('guest')!.state.versus!.status).toBe('results');
    expect(normalize(clients.get('host')!.state.versus!)).toEqual(normalize(clients.get('guest')!.state.versus!));
    expect(battleView(clients.get('guest')!.state.versus!).ships.find(s => s.id === hv.myId)!.winner).toBe(true);
    await action('host', { type: 'VERSUS_REMATCH' }); await round();
    expect(clients.get('guest')!.state.versus!.round).toBe(2);
    await act(async () => mock.rooms[1].send({ ...stale, score: 999, correct: 30, done: true }));
    expect(clients.get('host')!.state.versus!.players.every(p => p.score === 0 && !p.done)).toBe(true);
    await answer('guest'); expect(clients.get('host')!.state.versus!.players.find(p => p.id === gv.myId)!.score).toBeGreaterThan(0);
  });
  it('rejects late arrivals and finishes after an unfinished opponent disconnects', async () => {
    await mount('host', true); await mount('guest', false); await round(); await mount('late', false);
    expect(clients.get('late')!.api.error).toContain('already battling');
    expect(clients.get('host')!.state.versus!.players).toHaveLength(2);
    await act(async () => mock.rooms[1].close());
    await action('host', { type: 'ARCADE_TIMEOUT' }); await action('host', { type: 'VERSUS_CONTINUE' });
    const v = clients.get('host')!.state.versus!;
    expect(v.status).toBe('results'); expect(v.players.find(p => !p.isMe)!.withdrawn).toBe(true);
    expect(battleView(v).ships.find(p => p.isMe)!.winner).toBe(true);
  });
  it('uses the shared deadline even when a phone starts late and rejects early answers', async () => {
    await mount('host', true); await mount('guest', false);
    await act(async () => clients.get('host')!.api.startRound());
    await action('host', { type: 'VERSUS_BEGIN_TURN' }); await answer('host');
    expect(clients.get('host')!.state.arcade!.score).toBe(0);
    const startAt = clients.get('host')!.state.versus!.startAt!;
    vi.setSystemTime(startAt + 2000); await action('guest', { type: 'VERSUS_BEGIN_TURN' });
    expect(clients.get('guest')!.state.arcade!.deadlineAt).toBe(startAt + 60000);
  });
  it('runs a multi-level match: the guest can call the next level and a rematch, wins grow ships on both devices', async () => {
    const levels = [{ game: 'mult' as const, selection: 'mult:7' }, { game: 'div' as const, selection: 'div:all' }];
    await mount('host', true, levels); await mount('guest', false);
    await round();
    expect(clients.get('guest')!.state.versus!.levels).toEqual(levels);
    await answer('host'); await answer('host');
    for (const id of ['host', 'guest']) { await action(id, { type: 'ARCADE_TIMEOUT' }); await action(id, { type: 'VERSUS_CONTINUE' }); }
    const hostId = clients.get('host')!.state.versus!.myId;
    expect(clients.get('guest')!.state.versus!.wins).toEqual({ [hostId]: 1 });
    expect(battleView(clients.get('guest')!.state.versus!).ships.find(s => s.id === hostId)!.shipClass).toBe('Corvette');
    // Guest asks for the next level; the host's device starts level 2 (division) for both.
    await act(async () => clients.get('guest')!.api.requestNext());
    expect(clients.get('host')!.state.versus!.level).toBe(1); expect(clients.get('guest')!.state.versus!.level).toBe(1);
    expect(clients.get('guest')!.state.versus!.game).toBe('div'); expect(clients.get('guest')!.state.versus!.wins).toEqual({ [hostId]: 1 });
    vi.setSystemTime(clients.get('host')!.state.versus!.startAt!); for (const id of ['host', 'guest']) await action(id, { type: 'VERSUS_BEGIN_TURN' });
    expect(clients.get('guest')!.state.arcade!.question.expression).toContain('÷');
    await answer('guest');
    for (const id of ['host', 'guest']) { await action(id, { type: 'ARCADE_TIMEOUT' }); await action(id, { type: 'VERSUS_CONTINUE' }); }
    const guestId = clients.get('guest')!.state.versus!.myId;
    expect(clients.get('host')!.state.versus!.wins).toEqual({ [hostId]: 1, [guestId]: 1 });
    // Last level: a next-level request is ignored; a rematch request restarts from level 1 with empty wins.
    await act(async () => clients.get('guest')!.api.requestNext());
    expect(clients.get('host')!.state.versus!.status).toBe('results');
    await act(async () => clients.get('guest')!.api.requestRematch());
    expect(clients.get('host')!.state.versus!.level).toBe(0); expect(clients.get('host')!.state.versus!.wins).toEqual({});
    expect(clients.get('guest')!.state.versus!.level).toBe(0); expect(clients.get('guest')!.state.versus!.game).toBe('mult'); expect(clients.get('guest')!.state.versus!.status).toBe('ready');
  });
});
