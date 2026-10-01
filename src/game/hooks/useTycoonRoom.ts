import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../store';
import { Room, type RoomMessage } from '../net/room';
import { current } from '../../engine/tycoon/game';
import { validView, viewFor, type TycoonGuestAction } from '../../engine/tycoon/online';

export interface TycoonRoomApi { connected: boolean; status: string; error: string; clearError: () => void; sendAction: (a: TycoonGuestAction) => void }
const Context = createContext<TycoonRoomApi>({ connected: false, status: '', error: '', clearError: () => {}, sendAction: () => {} });

/** Online Engine City Tycoon: the host runs the game; guests send moves and receive the table. */
function useTycoonRoomInternal(): TycoonRoomApi {
  const { state, dispatch } = useGame(); const g = state.tycoon;
  const latest = useRef(g); latest.current = g;
  const send = useRef(dispatch); send.current = dispatch;
  const roomRef = useRef<Room | null>(null);
  const peers = useRef<{ peer: string; id: string; name: string }[]>([]);
  const lastRev = useRef(-1), pendingRev = useRef(-1);
  const [connected, setConnected] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('');
  const code = g?.online?.code, host = !!g?.online?.host, myId = g?.online?.myId ?? '', name = state.character?.name ?? 'Player';
  useEffect(() => {
    if (!code) return;
    let closed = false, joined = false;
    let handshake: ReturnType<typeof setTimeout> | undefined;
    lastRev.current = -1; pendingRev.current = -1; peers.current = [];
    setConnected(false); setError('');
    const reject = (peer: string, message: string) => room.sendTo(peer, { t: 'terror', message });
    const room = new Room(code, host, {
      onStatus: (s) => { if (!closed) setStatus(s); },
      onError: (e) => { if (!closed) setError(e); },
      onMessage: (m: RoomMessage, from: string) => {
        if (closed) return;
        const cur = latest.current; if (!cur) return;
        if (m.t === 'thello' && host) {
          if (cur.phase !== 'lobby' || peers.current.length >= 3) { reject(from, 'This table is full or already playing. Ask the host for a new room.'); return; }
          if (typeof m.id !== 'string' || !/^p-[a-z0-9]{1,16}$/.test(m.id) || m.id === myId || typeof m.name !== 'string' || peers.current.some((p) => p.peer === from || p.id === m.id)) return;
          peers.current.push({ peer: from, id: m.id, name: m.name.trim().slice(0, 20) || 'Player' });
          send.current({ type: 'TYCOON_ROSTER', players: [{ id: myId, name }, ...peers.current.map(({ id, name: n }) => ({ id, name: n }))] });
        } else if (m.t === 'tstate' && !host) {
          if (!validView(m.state, code, myId) || m.state.rev <= lastRev.current) return;
          lastRev.current = m.state.rev; joined = true; clearTimeout(handshake); setConnected(true); setStatus('Connected to the table.'); setError('');
          send.current({ type: 'TYCOON_REMOTE', state: m.state });
        } else if (m.t === 'tact' && host) {
          if (!peers.current.some((p) => p.peer === from && p.id === m.id)) return;
          const a = m.action;
          if (!a || typeof a !== 'object') return;
          if (a.kind !== 'ack' && (cur.phase === 'lobby' || cur.phase === 'over' || current(cur).id !== m.id)) { reject(from, 'Wait for your turn.'); return; }
          // Reserve the revision synchronously so two packets can't spend one turn twice.
          if (m.rev !== cur.rev || pendingRev.current === cur.rev) { reject(from, 'The table changed. Check the latest turn and try again.'); return; }
          pendingRev.current = cur.rev;
          send.current({ type: 'TYCOON_GUEST', id: m.id, action: a });
        } else if (m.t === 'terror' && !host && typeof m.message === 'string') setError(m.message.slice(0, 240));
      },
      onPeerLeft: (peer) => {
        if (closed) return;
        if (host) { const p = peers.current.find((x) => x.peer === peer); peers.current = peers.current.filter((x) => x.peer !== peer); if (p) send.current({ type: 'TYCOON_LEFT', id: p.id }); }
        else { setConnected(false); setError('The host left the table. Go back to set up a new game.'); }
      },
    });
    roomRef.current = room;
    (async () => {
      try {
        if (host) { await room.open(); if (!closed) setConnected(true); }
        else {
          await room.join();
          if (!closed) { room.send({ t: 'thello', id: myId, name }); handshake = setTimeout(() => { if (!closed && !joined) setError('This room did not answer. Check the code, and that your friend has Engine City Tycoon open.'); }, 10_000); }
        }
        if (closed) room.close();
      } catch (e) { if (!closed) setError((e as Error).message); }
    })();
    return () => { closed = true; clearTimeout(handshake); room.close(); roomRef.current = null; peers.current = []; };
  }, [code, host, myId, name]);
  useEffect(() => {
    if (!host || !connected || !g || !roomRef.current) return;
    for (const p of peers.current) roomRef.current.sendTo(p.peer, { t: 'tstate', state: viewFor(g, p.id) });
  }, [g, host, connected]);
  return { connected, status, error, clearError: () => setError(''), sendAction: (action) => {
    const cur = latest.current; if (!host && connected && cur) { setError(''); roomRef.current?.send({ t: 'tact', id: myId, rev: cur.rev, action }); }
  } };
}
export function TycoonRoomProvider({ children }: { children: ReactNode }) {
  return createElement(Context.Provider, { value: useTycoonRoomInternal() }, children);
}
export const useTycoonRoom = () => useContext(Context);
