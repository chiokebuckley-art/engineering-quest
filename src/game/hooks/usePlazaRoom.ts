import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../store';
import { Room, type RoomMessage } from '../net/room';
import { checkPlazaMove, currentPlazaPlayer, isPlazaState, plazaViewFor, type PlazaMove, type PlazaState } from '../../engine/state/plaza';

export type PlazaGuestAction = { kind: 'play'; move: PlazaMove } | { kind: 'swap' };
export interface PlazaRoomApi {
  connected: boolean; status: string; error: string;
  /** Getting back into the room on its own: after a reload, a dropped signal, or the host stepping away. */
  reconnecting: boolean;
  clearError: () => void; sendAction: (a: PlazaGuestAction) => void;
  /** Try the room again now, after the automatic tries gave up. */
  retry: () => void;
}
const Context = createContext<PlazaRoomApi>({ connected: false, status: '', error: '', reconnecting: false, clearError: () => {}, sendAction: () => {}, retry: () => {} });

const validView = (g: PlazaState, code: string, id: string) => isPlazaState(g) && g.online?.code === code && g.online.myId === id && !g.online.host;

/** Automatic tries back into a room: quick at first, then every 10 s, for about five minutes. */
const RETRY_MS = [1500, 3000, 5000, 8000];
const MAX_TRIES = 32;
/**
 * Heartbeat. A closed tab or a phone that sleeps can leave a WebRTC link looking open for a long time, so the host
 * pings every few seconds; a player quiet for GONE_MS counts as away, and a guest that stops hearing the host reconnects.
 * Only a side that has taken part in the heartbeat is timed out, so an older copy of the game is never cut off.
 */
const PING_MS = 4000, GONE_MS = 15_000;

function usePlazaRoomInternal(): PlazaRoomApi {
  const { state, dispatch } = useGame(); const g = state.plaza;
  const latest = useRef(g); latest.current = g;
  const send = useRef(dispatch); send.current = dispatch;
  const roomRef = useRef<Room | null>(null);
  const peers = useRef<{ peer: string; id: string; name: string }[]>([]);
  const lastRev = useRef(-1), pendingRev = useRef(-1), failures = useRef(0);
  const [connected, setConnected] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('');
  const [reconnecting, setReconnecting] = useState(false), [attempt, setAttempt] = useState(0);
  const code = g?.online?.code, host = !!g?.online?.host, myId = g?.online?.myId ?? '', name = (state.character?.name ?? 'Player').slice(0, 20);
  useEffect(() => {
    if (!code) return;
    // A game this device has already played in (it has a board from the host, or guests joined it) finds its way back on its own.
    const resuming = () => (latest.current?.rev ?? 0) > 0;
    let closed = false, live = false, refused = false;
    let handshake: ReturnType<typeof setTimeout> | undefined, again: ReturnType<typeof setTimeout> | undefined;
    const heard = new Map<string, number>(); // host: when each guest last answered a ping
    let hostHeard = 0, hostPings = false;     // guest: when the host last sent anything, and whether it pings at all
    lastRev.current = -1; pendingRev.current = -1; peers.current = [];
    setConnected(false);
    /** In: the host's room is open, or this guest has the host's board. */
    const up = (message: string) => { live = true; failures.current = 0; setReconnecting(false); setConnected(true); setError(''); setStatus(message); };
    /** Out of the room. A game already under way tries again (the seat is kept for this player); a first join shows why. */
    const fail = (message: string) => {
      if (closed) return;
      live = false; clearTimeout(handshake); setConnected(false);
      const cur = latest.current;
      if (!resuming() || refused || !cur || cur.phase === 'over') { setReconnecting(false); setError(message); return; }
      if (failures.current >= MAX_TRIES) {
        setReconnecting(false);
        setError(host ? `Could not reopen room ${code}. Check your internet, then try again.` : `Could not reach room ${code}. The host needs Equation Plaza open on their device.`);
        return;
      }
      setReconnecting(true); setError('');
      setStatus(host ? `Reopening room ${code}…` : `Reconnecting to room ${code}…`);
      again = setTimeout(() => { if (!closed) setAttempt(n => n + 1); }, RETRY_MS[failures.current++] ?? 10_000);
    };
    const reject = (peer: string, message: string) => room.sendTo(peer, { t: 'perror', message });
    /** Host: tell the game who is here (the lobby list, or which seats are away). */
    const seats = () => {
      const cur = latest.current; if (!cur) return;
      if (cur.phase === 'lobby') send.current({ type: 'PLAZA_ROSTER', players: [{ id: myId, name }, ...peers.current.map(({ id, name: n }) => ({ id, name: n }))] });
      else send.current({ type: 'PLAZA_SEATS', here: peers.current.map(p => p.id) });
    };
    const room = new Room(code, host, {
      onStatus: s => { if (!closed && (live || !resuming())) setStatus(s); },
      onError: e => { if (!closed && live) setError(e); },
      onSignal: on => { if (!closed && live && on) { setError(''); setStatus(host ? `Room ${code} is open again.` : 'Connected to the plaza.'); } },
      onMessage: (m: RoomMessage, from: string) => {
        if (closed) return;
        if (!host) hostHeard = Date.now();
        if (m.t === 'pping' && !host) { hostPings = true; room.send({ t: 'ppong' }); return; }
        if (m.t === 'ppong' && host) { if (peers.current.some(p => p.peer === from)) heard.set(from, Date.now()); return; }
        const cur = latest.current; if (!cur) return;
        if (m.t === 'phello' && host) {
          if (typeof m.id !== 'string' || !/^p-[a-z0-9]{1,16}$/.test(m.id) || m.id === myId || typeof m.name !== 'string') return;
          // Only the player a seat belongs to knows its id (guests see the others as seat-1, seat-2...), so a hello with it
          // is that player coming back: a reload, lost signal, or Leave by accident. Their newest link replaces any old one,
          // and an old link that is still open (another tab) is told to stop, so two screens never take turns bumping each other.
          const seat = cur.phase === 'lobby' ? undefined : cur.players.find(p => p.id === m.id && !p.bot);
          if (cur.phase !== 'lobby' && !seat) { reject(from, 'This plaza is already playing a match. Ask the host for a new room.'); return; }
          if (cur.phase === 'lobby' && !peers.current.some(p => p.id === m.id) && peers.current.length >= 3) { reject(from, 'This plaza is full. Ask the host for a new room.'); return; }
          for (const old of peers.current) if (old.id === m.id && old.peer !== from) room.sendTo(old.peer, { t: 'perror', message: 'Your seat was picked up on another screen.', final: true });
          peers.current = [...peers.current.filter(p => p.id !== m.id && p.peer !== from), { peer: from, id: m.id, name: seat?.name ?? (m.name.trim().slice(0, 20) || 'Player') }];
          seats();
          room.sendTo(from, { t: 'pstate', state: plazaViewFor(cur, m.id) });
          // Start the heartbeat at once, so a player who drops a moment after joining is still noticed.
          if (m.beat === true) { heard.set(from, Date.now()); room.sendTo(from, { t: 'pping' }); }
        } else if (m.t === 'pstate' && !host) {
          if (!validView(m.state, code, myId) || m.state.rev <= lastRev.current) return;
          // The first board after (re)connecting is taken as it is: the host's copy is the true one, even if older.
          const first = lastRev.current < 0;
          lastRev.current = m.state.rev; clearTimeout(handshake);
          if (first) up('Connected to the plaza.'); else setError('');
          send.current({ type: 'PLAZA_REMOTE', state: m.state, resync: first });
        } else if (m.t === 'pact' && host) {
          if (!peers.current.some(p => p.peer === from && p.id === m.id)) return;
          if (cur.phase !== 'playing' || currentPlazaPlayer(cur).id !== m.id) { reject(from, 'Wait for your turn.'); return; }
          // Reserve the revision synchronously: two packets arriving before React renders still cannot spend two turns.
          if (m.rev !== cur.rev || pendingRev.current === cur.rev) { reject(from, 'The board changed. Check the latest turn and try again.'); return; }
          if (m.action?.kind === 'play') {
            const result = checkPlazaMove(cur.board, currentPlazaPlayer(cur).rack, m.action.move, cur.config);
            if (result.error) { reject(from, result.error); return; }
            pendingRev.current = cur.rev; send.current({ type: 'PLAZA_PLAY', move: m.action.move });
          } else if (m.action?.kind === 'swap') { pendingRev.current = cur.rev; send.current({ type: 'PLAZA_SWAP' }); }
        } else if (m.t === 'perror' && !host && typeof m.message === 'string') {
          const message = m.message.slice(0, 240);
          // Turned away (full, a match this device has no seat in, or the seat taken up on another screen): trying again will not help.
          if (lastRev.current < 0 || m.final) { refused = true; fail(message); } else setError(message);
        }
      },
      onPeerLeft: peer => {
        if (closed) return;
        if (host) {
          heard.delete(peer);
          if (!peers.current.some(p => p.peer === peer)) return;
          peers.current = peers.current.filter(p => p.peer !== peer); seats();
        } else if (latest.current?.phase === 'over') { live = false; setConnected(false); setStatus('The host closed the room.'); }
        else fail('Lost the connection to the host.');
      },
    });
    roomRef.current = room;
    const beat = setInterval(() => {
      if (closed || !live) return;
      const now = Date.now();
      if (!host) { if (hostPings && now - hostHeard > GONE_MS) fail('Lost the connection to the host.'); return; }
      for (const p of peers.current) {
        const seen = heard.get(p.peer);
        if (seen === undefined || now - seen <= GONE_MS) { room.sendTo(p.peer, { t: 'pping' }); continue; }
        heard.delete(p.peer); peers.current = peers.current.filter(x => x.peer !== p.peer); seats(); room.drop(p.peer);
      }
    }, PING_MS);
    (async () => {
      try {
        if (host) { await room.open(); if (closed) return; up(`Room ${code} open. Waiting for players…`); seats(); }
        else {
          await room.join(); if (closed) return;
          room.send({ t: 'phello', id: myId, name, beat: true });
          handshake = setTimeout(() => { if (lastRev.current < 0) fail('This room did not answer. Check that your friend opened Equation Plaza and uses the latest game version.'); }, 10_000);
        }
      } catch (e) { fail((e as Error).message); }
    })();
    return () => { closed = true; clearTimeout(handshake); clearTimeout(again); clearInterval(beat); room.close(); roomRef.current = null; peers.current = []; };
  }, [code, host, myId, name, attempt]);
  useEffect(() => {
    if (!host || !connected || !g || !roomRef.current) return;
    for (const p of peers.current) roomRef.current.sendTo(p.peer, { t: 'pstate', state: plazaViewFor(g, p.id) });
  }, [g, host, connected]);
  return {
    connected, status, error, reconnecting, clearError: () => setError(''),
    retry: () => { failures.current = 0; setError(''); setAttempt(n => n + 1); },
    sendAction: action => { const cur = latest.current; if (!host && connected && cur) { setError(''); roomRef.current?.send({ t: 'pact', id: myId, rev: cur.rev, action }); } },
  };
}
export function PlazaRoomProvider({ children }: { children: ReactNode }) {
  return createElement(Context.Provider, { value: usePlazaRoomInternal() }, children);
}
export const usePlazaRoom = () => useContext(Context);
