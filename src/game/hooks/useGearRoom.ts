import { createContext, useContext, useEffect, useRef, useState, type ReactNode, createElement } from 'react';
import { useGame } from '../store';
import { Room, type RoomMessage } from '../net/room';
import { normalizeGearAvatar, type GearAvatarId } from '../../engine/state/gearAvatars';
import { currentId, type GearState } from '../../engine/state/gear';

/**
 * Weakest Gear online rooms. The host's phone is the arena: it runs every rule and
 * broadcasts the whole game state after each change. Guests send answers, banks and
 * votes; the host checks it is really their turn before applying them.
 */
export type GuestAction = { action: 'answer'; given: string } | { action: 'bank' } | { action: 'vote'; targetId: string } | { action: 'tiebreak'; targetId: string };

function useGearRoomInternal() {
  const { state, dispatch } = useGame(); const g = state.gear;
  const latest = useRef<GearState | null>(g); latest.current = g;
  const roomRef = useRef<Room | null>(null);
  const [status, setStatus] = useState(''); const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const rosterRef = useRef<{ id: string; name: string; avatarId?: GearAvatarId; peer: string }[]>([]);
  const rev = useRef(0);
  const code = g?.online?.roomCode; const isHost = !!g?.online?.isHost; const myId = g?.online?.myId ?? ''; const myName = g?.online?.myName ?? state.character?.name ?? 'Player';

  useEffect(() => {
    if (!code || roomRef.current) return;
    let closed = false;
    const roster = () => [{ id: myId, name: myName, avatarId: normalizeGearAvatar(latest.current?.online?.myAvatarId) }, ...rosterRef.current.map(({ id, name, avatarId }) => ({ id, name, avatarId }))];
    const leave = (id: string) => { rosterRef.current = rosterRef.current.filter((p) => p.id !== id); dispatch({ type: 'GEAR_LEFT', id }); if (latest.current?.phase === 'lobby') room.send({ t: 'groster', players: roster() }); };
    const room = new Room(code, isHost, {
      onStatus: (s) => { if (!closed) setStatus(s); },
      onError: (e) => { if (!closed) setError(e); },
      onMessage: (m: RoomMessage, from: string) => {
        if (closed) return;
        const cur = latest.current;
        if (m.t === 'ghello' && room.isHost) {
          if (rosterRef.current.some((p) => p.peer === from)) return;
          if (!cur || cur.phase !== 'lobby' || rosterRef.current.length + 1 + cur.setup.bots.length >= 8) { room.sendTo(from, { t: 'rejected', reason: 'This arena is full or already playing. Ask the host for a new room.' }); return; }
          if (typeof m.id !== 'string' || !/^p-[a-z0-9]{1,12}$/.test(m.id) || m.id === myId || rosterRef.current.some((p) => p.id === m.id) || typeof m.name !== 'string') return;
          rosterRef.current = [...rosterRef.current, { id: m.id, name: m.name.trim().slice(0, 16) || 'Player', avatarId: normalizeGearAvatar(m.avatarId), peer: from }];
          dispatch({ type: 'GEAR_LOBBY_ROSTER', players: roster() });
          room.send({ t: 'groster', players: roster() });
        } else if (m.t === 'groster' && !room.isHost) {
          if (Array.isArray(m.players) && m.players.length <= 8) dispatch({ type: 'GEAR_LOBBY_ROSTER', players: m.players });
        } else if (m.t === 'gstate' && !room.isHost) {
          if (!m.state || typeof m.state !== 'object' || !Array.isArray(m.state.contestants)) return;
          dispatch({ type: 'GEAR_REMOTE_STATE', state: m.state });
        } else if (m.t === 'gact' && room.isHost) {
          if (!cur || !rosterRef.current.some((p) => p.peer === from && p.id === m.id)) return;
          const turnId = currentId(cur);
          if (m.action === 'answer' && turnId === m.id && (cur.phase === 'question' || cur.phase === 'final') && typeof m.given === 'string') dispatch({ type: 'GEAR_ANSWER', given: m.given.slice(0, 12) });
          else if (m.action === 'bank' && turnId === m.id && cur.phase === 'question') dispatch({ type: 'GEAR_BANK' });
          else if (m.action === 'vote' && cur.phase === 'vote' && typeof m.targetId === 'string') dispatch({ type: 'GEAR_VOTE', voterId: m.id, targetId: m.targetId });
          else if (m.action === 'tiebreak' && cur.phase === 'tiebreak' && cur.tie?.strongest === m.id && typeof m.targetId === 'string') dispatch({ type: 'GEAR_TIEBREAK', targetId: m.targetId });
        } else if (m.t === 'rejected' && !room.isHost) setError(m.reason);
      },
      onPeerLeft: (peer) => {
        if (closed) return;
        if (room.isHost) { const p = rosterRef.current.find((x) => x.peer === peer); if (p) leave(p.id); }
        else { setConnected(false); setError('The host disconnected. Leave and join a new arena.'); }
      },
    });
    roomRef.current = room;
    (async () => {
      try {
        if (room.isHost) await room.open();
        else { await room.join(); if (!closed) room.send({ t: 'ghello', id: myId, name: myName, avatarId: normalizeGearAvatar(latest.current?.online?.myAvatarId) }); }
        if (closed) room.close(); else setConnected(true);
      } catch (e) { if (!closed) setError((e as Error).message); }
    })();
    return () => { closed = true; room.close(); roomRef.current = null; rosterRef.current = []; };
  }, [code, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // Host: every change to the arena goes out to the guests.
  useEffect(() => {
    if (!isHost || !connected || !g || !roomRef.current || g.phase === 'lobby') return;
    rev.current += 1;
    roomRef.current.send({ t: 'gstate', state: g, rev: rev.current });
  }, [g, isHost, connected]);

  const sendAction = (a: GuestAction) => { if (roomRef.current && connected && !isHost) roomRef.current.send({ t: 'gact', id: myId, ...a }); };
  return { status, error, connected, sendAction, guests: rosterRef.current.length };
}

export interface GearRoomApi { status: string; error: string; connected: boolean; sendAction: (a: GuestAction) => void; guests: number }
const Ctx = createContext<GearRoomApi>({ status: '', error: '', connected: false, sendAction: () => {}, guests: 0 });
export function GearRoomProvider({ children }: { children: ReactNode }) {
  const api = useGearRoomInternal(); return createElement(Ctx.Provider, { value: api }, children);
}
export const useGearRoom = () => useContext(Ctx);

