import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../store';
import { Room, type RoomMessage } from '../net/room';
import { normalizeGearAvatar } from '../../engine/state/gearAvatars';
import { currentPlayer, tableViewFor, validTable, type DiceAction } from '../../engine/state/diceTable';

export interface DiceRoomApi { connected: boolean; status: string; error: string; clearError: () => void; sendAction: (a: DiceAction) => void }
const Context = createContext<DiceRoomApi>({ connected: false, status: '', error: '', clearError: () => {}, sendAction: () => {} });

/** Online Dice Workshop: the host runs the table; guests send moves and receive the table. */
function useDiceRoomInternal(): DiceRoomApi {
  const { state, dispatch } = useGame(); const t = state.diceTable;
  const latest = useRef(t); latest.current = t;
  const send = useRef(dispatch); send.current = dispatch;
  const roomRef = useRef<Room | null>(null);
  const peers = useRef<{ peer: string; id: string; name: string; avatar: string }[]>([]);
  const lastRev = useRef(-1), pendingRev = useRef(-1);
  const [connected, setConnected] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('');
  const code = t?.online.code, host = !!t?.online.host, myId = t?.online.myId ?? '';
  const name = state.character?.name ?? 'Player', avatar = state.diceWorkshop?.avatar ?? 'engineer';
  useEffect(() => {
    if (!code) return;
    let closed = false, joined = false;
    let handshake: ReturnType<typeof setTimeout> | undefined;
    lastRev.current = -1; pendingRev.current = -1; peers.current = [];
    setConnected(false); setError('');
    const reject = (peer: string, message: string) => room.sendTo(peer, { t: 'derror', message });
    const room = new Room(code, host, {
      onStatus: (s) => { if (!closed) setStatus(s); },
      onError: (e) => { if (!closed) setError(e); },
      onMessage: (m: RoomMessage, from: string) => {
        if (closed) return;
        const cur = latest.current; if (!cur) return;
        if (m.t === 'dhello' && host) {
          if (cur.phase !== 'lobby' || peers.current.length >= 3) { reject(from, 'This table is full or already playing. Ask the host for a new room.'); return; }
          if (typeof m.id !== 'string' || !/^p-[a-z0-9]{1,16}$/.test(m.id) || m.id === myId || typeof m.name !== 'string' || peers.current.some((p) => p.peer === from || p.id === m.id)) return;
          peers.current.push({ peer: from, id: m.id, name: m.name.trim().slice(0, 20) || 'Player', avatar: normalizeGearAvatar(m.avatar) });
          send.current({ type: 'DICE_ROSTER', seats: [{ id: myId, name, avatar }, ...peers.current.map(({ id, name: n, avatar: a }) => ({ id, name: n, avatar: normalizeGearAvatar(a) }))] });
        } else if (m.t === 'dstate' && !host) {
          if (!validTable(m.table, code, myId) || m.table.rev <= lastRev.current) return;
          lastRev.current = m.table.rev; joined = true; clearTimeout(handshake); setConnected(true); setStatus('Connected to the table.'); setError('');
          send.current({ type: 'DICE_REMOTE', table: m.table });
        } else if (m.t === 'dact' && host) {
          if (!peers.current.some((p) => p.peer === from && p.id === m.id) || !m.action || typeof m.action !== 'object') return;
          if (cur.phase !== 'playing' || currentPlayer(cur)?.id !== m.id) { reject(from, 'Wait for your turn.'); return; }
          // Reserve the revision synchronously so two packets can't spend one move twice.
          if (m.rev !== cur.rev || pendingRev.current === cur.rev) { reject(from, 'The table changed. Try that again.'); return; }
          pendingRev.current = cur.rev;
          send.current({ type: 'DICE_GUEST', id: m.id, action: m.action });
        } else if (m.t === 'derror' && !host && typeof m.message === 'string') setError(m.message.slice(0, 240));
      },
      onPeerLeft: (peer) => {
        if (closed) return;
        if (host) { const p = peers.current.find((x) => x.peer === peer); peers.current = peers.current.filter((x) => x.peer !== peer); if (p) send.current({ type: 'DICE_LEFT', id: p.id }); }
        else { setConnected(false); setError('The host left the table. Go back to start or join another game.'); }
      },
    });
    roomRef.current = room;
    (async () => {
      try {
        if (host) { await room.open(); if (!closed) setConnected(true); }
        else {
          await room.join();
          if (!closed) { room.send({ t: 'dhello', id: myId, name, avatar }); handshake = setTimeout(() => { if (!closed && !joined) setError('This room did not answer. Check the code, and that your friend has Dice Workshop open.'); }, 10_000); }
        }
        if (closed) room.close();
      } catch (e) { if (!closed) setError((e as Error).message); }
    })();
    return () => { closed = true; clearTimeout(handshake); room.close(); roomRef.current = null; peers.current = []; };
  }, [code, host, myId, name, avatar]);
  useEffect(() => {
    if (!host || !connected || !t || !roomRef.current) return;
    for (const p of peers.current) roomRef.current.sendTo(p.peer, { t: 'dstate', table: tableViewFor(t, p.id) });
  }, [t, host, connected]);
  return { connected, status, error, clearError: () => setError(''), sendAction: (action) => {
    const cur = latest.current; if (!host && connected && cur) { setError(''); roomRef.current?.send({ t: 'dact', id: myId, rev: cur.rev, action }); }
  } };
}
export function DiceRoomProvider({ children }: { children: ReactNode }) {
  return createElement(Context.Provider, { value: useDiceRoomInternal() }, children);
}
export const useDiceRoom = () => useContext(Context);
