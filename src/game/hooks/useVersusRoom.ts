import { createContext, useContext, useEffect, useRef, useState, type ReactNode, createElement } from 'react';
import { useGame } from '../store';
import { Room, type RoomMessage } from '../net/room';

/** Scores are cumulative and tagged by round; the host freezes the fleet at launch. */
function useVersusRoomInternal() {
  const { state, dispatch } = useGame(); const v = state.versus;
  const latest = useRef(v); latest.current = v;
  const roomRef = useRef<Room | null>(null);
  const [status, setStatus] = useState(''); const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [asked, setAsked] = useState('');
  const startRoundRef = useRef<(opts?: { level?: number; wins?: Record<string, number> }) => void>(() => {});
  const rosterRef = useRef<{ id: string; name: string; peer: string }[]>([]);
  const myName = state.character?.name ?? 'Player';

  useEffect(() => {
    if (!v || v.kind !== 'online' || !v.roomCode || roomRef.current) return;
    const myId = v.myId; let closed = false;
    const roster = () => [{ id: myId, name: myName }, ...rosterRef.current.map(({ id, name }) => ({ id, name }))];
    const leave = (id: string) => {
      rosterRef.current = rosterRef.current.filter(p => p.id !== id);
      dispatch({ type: 'VERSUS_LEFT', playerId: id });
      room.send({ t: 'bye', id });
    };
    const room = new Room(v.roomCode, !!v.isHost, {
      onStatus: s => { if (!closed) setStatus(s); },
      onError: e => { if (!closed) setError(e); },
      onMessage: (m: RoomMessage, from: string) => {
        if (closed) return;
        if (m.t === 'hello' && room.isHost) {
          const existing = rosterRef.current.find(p => p.peer === from);
          if (existing) return;
          if (latest.current?.status !== 'lobby' || rosterRef.current.length >= 5) {
            room.sendTo(from, { t: 'rejected', reason: 'This fleet is full or already battling. Leave and join the next round.' }); return;
          }
          if (typeof m.id !== 'string' || !/^p-[a-z0-9]{1,12}$/.test(m.id) || m.id === myId || rosterRef.current.some(p => p.id === m.id) || typeof m.name !== 'string') return;
          const name = m.name.trim().slice(0, 16) || 'Player';
          rosterRef.current = [...rosterRef.current, { id: m.id, name, peer: from }];
          dispatch({ type: 'VERSUS_REMOTE', playerId: m.id, name, score: 0, correct: 0, done: false });
          room.send({ t: 'roster', players: roster() });
        } else if (m.t === 'roster' && !room.isHost && latest.current?.status === 'lobby') {
          if (!Array.isArray(m.players) || m.players.length > 6) return;
          dispatch({ type: 'VERSUS_SET_PLAYERS', players: m.players.map((p, i) => ({ ...p, isMe: p.id === myId, score: 0, correct: 0, done: false, color: ['#ffb347', '#2dd4bf', '#a78bfa', '#4ade80', '#f472b6', '#22d3ee'][i] })) });
        } else if (m.t === 'round' && !room.isHost) {
          if (!Number.isFinite(m.seed) || !Number.isFinite(m.startAt) || !Array.isArray(m.players) || m.players.length < 2 || m.players.length > 6 || !GAMES.includes(m.game) || typeof m.selection !== 'string') return;
          const plan = Array.isArray(m.plan) && m.plan.length <= 10 && m.plan.every(p => p && GAMES.includes(p.game) && typeof p.selection === 'string' && p.selection.length <= 40) ? m.plan : undefined;
          const wins = m.wins && typeof m.wins === 'object' && Object.values(m.wins).every(n => Number.isInteger(n) && n >= 0 && n <= 10) ? m.wins : undefined;
          const level = Number.isInteger(m.level) && m.level! >= 0 && m.level! < 10 ? m.level : undefined;
          setAsked('');
          dispatch({ type: 'VERSUS_ROUND', seed: m.seed, game: m.game, selection: m.selection, startAt: m.startAt, players: m.players, durationMs: m.durationMs, level, wins, plan });
        } else if (m.t === 'progress') {
          if (typeof m.roundId !== 'string' || typeof m.done !== 'boolean') return;
          if (room.isHost && !rosterRef.current.some(p => p.peer === from && p.id === m.id)) return;
          dispatch({ type: 'VERSUS_REMOTE', playerId: m.id, score: m.score, correct: m.correct, done: m.done, roundId: m.roundId });
          if (room.isHost) room.send(m);
        } else if (m.t === 'bye') {
          if (room.isHost) { if (rosterRef.current.some(p => p.peer === from && p.id === m.id)) leave(m.id); }
          else dispatch({ type: 'VERSUS_LEFT', playerId: m.id });
        } else if ((m.t === 'next' || m.t === 'rematch') && room.isHost) {
          // Any captain can call for the next level or a rematch; the host's device starts it for everyone.
          if (!rosterRef.current.some(p => p.peer === from && p.id === m.id)) return;
          const cur = latest.current; if (!cur || cur.status !== 'results') return;
          if (m.t === 'rematch') startRoundRef.current({ level: 0, wins: {} });
          else if (cur.level + 1 < cur.levels.length) startRoundRef.current({ level: cur.level + 1 });
        } else if (m.t === 'rejected' && !room.isHost) setError(m.reason);
      },
      onPeerLeft: peer => {
        if (closed) return;
        if (room.isHost) { const p = rosterRef.current.find(p => p.peer === peer); if (p) leave(p.id); }
        else { setConnected(false); setError('The host disconnected. Leave this room and create a new one to battle again.'); }
      },
    });
    roomRef.current = room;
    (async () => {
      try {
        if (room.isHost) await room.open();
        else { await room.join(); if (!closed) room.send({ t: 'hello', id: myId, name: myName }); }
        if (closed) room.close(); else setConnected(true);
      } catch (e) { if (!closed) setError((e as Error).message); }
    })();
    return () => { closed = true; room.send({ t: 'bye', id: myId }); room.close(); roomRef.current = null; rosterRef.current = []; };
  }, [v?.roomCode, v?.kind]); // match ownership, not changing scores

  // A captain who left after submitting a result keeps that result, but is removed
  // from the next lobby. The live transport roster decides who can start again.
  useEffect(() => {
    if (!v?.isHost || v.status !== 'lobby') return;
    const ids = new Set([v.myId, ...rosterRef.current.map(p => p.id)]);
    const players = v.players.filter(p => ids.has(p.id));
    if (players.length !== v.players.length) dispatch({ type: 'VERSUS_SET_PLAYERS', players });
  }, [v?.status, v?.players, v?.isHost, v?.myId, dispatch]);

  const me = v?.players.find(p => p.isMe);
  useEffect(() => {
    if (!v || v.kind !== 'online' || !v.startAt || !roomRef.current || !me || !connected) return;
    roomRef.current.send({ t: 'progress', id: me.id, score: me.score, correct: me.correct, done: me.done, roundId: `${v.seed}:${v.startAt}` });
  }, [me?.score, me?.correct, me?.done, v?.seed, v?.startAt, connected]);

  /** Host only. From the lobby: start the current level. From results: start the given level (default: the next one). */
  const startRound = (opts: { level?: number; wins?: Record<string, number> } = {}) => {
    const cur = latest.current;
    if (!cur || !cur.isHost || !roomRef.current || !connected) return;
    if (cur.status !== 'lobby' && cur.status !== 'results') return;
    const level = opts.level ?? (cur.status === 'results' ? cur.level + 1 : cur.level);
    if (level >= Math.max(1, cur.levels.length)) return;
    const wins = opts.wins ?? cur.wins;
    const lv = cur.levels[level] ?? { game: cur.game, selection: cur.selection };
    const players = [{ id: cur.myId, name: myName }, ...rosterRef.current.map(({ id, name }) => ({ id, name }))];
    if (players.length < 2) return;
    const seed = Math.floor(Math.random() * 1e9); const startAt = Date.now() + 3500;
    // Lock immediately, before React renders, so a late hello cannot change targets.
    latest.current = { ...cur, status: 'ready' };
    const msg = { t: 'round' as const, seed, game: lv.game, selection: lv.selection, startAt, players, durationMs: cur.durationMs, level, wins, plan: cur.levels };
    roomRef.current.send(msg);
    dispatch({ type: 'VERSUS_ROUND', seed, game: lv.game, selection: lv.selection, startAt, players, durationMs: cur.durationMs, level, wins, plan: cur.levels });
  };
  startRoundRef.current = startRound;
  const nextLevel = () => startRound();
  const rematch = () => startRound({ level: 0, wins: {} });
  /** Guests: ask the host's device to start the next level / a rematch. */
  const requestNext = () => { if (v && roomRef.current && connected) { roomRef.current.send({ t: 'next', id: v.myId }); setAsked('next'); } };
  const requestRematch = () => { if (v && roomRef.current && connected) { roomRef.current.send({ t: 'rematch', id: v.myId }); setAsked('rematch'); } };
  return { status, error, startRound, nextLevel, rematch, requestNext, requestRematch, asked, connected };
}
const GAMES = ['mult', 'div', 'add', 'sub', 'bonds', 'alg', 'word', 'tricks', 'mental', 'volume', 'measure', 'geo', 'rates', 'fit', 'phys', 'pipe', 'prob', 'spiral', 'precalc', 'mixed'];
export interface VersusRoomApi {
  status: string; error: string; connected: boolean;
  startRound: (opts?: { level?: number; wins?: Record<string, number> }) => void;
  nextLevel: () => void; rematch: () => void; requestNext: () => void; requestRematch: () => void;
  /** Guest: which request is waiting on the host ('' | 'next' | 'rematch'). */
  asked: string;
}
const Ctx = createContext<VersusRoomApi>({ status: '', error: '', connected: false, startRound: () => {}, nextLevel: () => {}, rematch: () => {}, requestNext: () => {}, requestRematch: () => {}, asked: '' });
export function VersusRoomProvider({ children }: { children: ReactNode }) {
  const api = useVersusRoomInternal(); return createElement(Ctx.Provider, { value: api }, children);
}
export const useVersusRoom = () => useContext(Ctx);
