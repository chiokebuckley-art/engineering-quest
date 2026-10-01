import type { GearAvatarId } from '../../engine/state/gearAvatars';
/**
 * Online versus rooms over WebRTC using PeerJS (bundled as a lazy chunk, loaded only when a room opens). The host's peer id is derived from a 4-letter room code; guests connect
 * to it directly. Messages are tiny JSON objects; the host relays roster/round info.
 */
export type RoomMessage =
  /** `beat`: this player answers heartbeat pings (older copies of the game do not). */
  | { t: 'phello'; id: string; name: string; beat?: boolean }
  | { t: 'pstate'; state: import('../../engine/state/plaza').PlazaState }
  | { t: 'pact'; id: string; rev: number; action: import('../hooks/usePlazaRoom').PlazaGuestAction }
  /** `final`: stop trying to reconnect (for example, the seat was picked up on another screen). */
  | { t: 'perror'; message: string; final?: boolean }
  /** Heartbeat: the host asks, guests answer. A link that goes quiet is closed so both sides reconnect cleanly. */
  | { t: 'pping' }
  | { t: 'ppong' }
  | { t: 'thello'; id: string; name: string }
  | { t: 'dhello'; id: string; name: string; avatar: string }
  | { t: 'dstate'; table: import('../../engine/state/diceTable').DiceTable }
  | { t: 'dact'; id: string; rev: number; action: import('../../engine/state/diceTable').DiceAction }
  | { t: 'derror'; message: string }
  | { t: 'tstate'; state: import('../../engine/tycoon/game').TycoonGame }
  | { t: 'tact'; id: string; rev: number; action: import('../../engine/tycoon/online').TycoonGuestAction }
  | { t: 'terror'; message: string }
  | { t: 'hello'; id: string; name: string }
  | { t: 'roster'; players: { id: string; name: string }[] }
  | { t: 'round'; seed: number; game: import('../../engine/state/types').ArcadeGame; selection: string; startAt: number; players: { id: string; name: string }[]; durationMs?: number; level?: number; wins?: Record<string, number>; plan?: import('../../engine/state/types').VersusLevel[] }
  | { t: 'next'; id: string }
  | { t: 'rematch'; id: string }
  | { t: 'ghello'; id: string; name: string; avatarId?: GearAvatarId }
  | { t: 'groster'; players: { id: string; name: string; avatarId?: GearAvatarId }[] }
  | { t: 'gstate'; state: import('../../engine/state/gear').GearState; rev: number }
  | { t: 'gact'; id: string; action: 'answer' | 'bank' | 'vote' | 'tiebreak'; given?: string; targetId?: string }
  | { t: 'progress'; id: string; score: number; correct: number; done: boolean; roundId: string }
  | { t: 'rejected'; reason: string }
  | { t: 'bye'; id: string };

interface PeerLike {
  id: string;
  on(ev: 'open', cb: (id: string) => void): void;
  on(ev: 'connection', cb: (conn: ConnLike) => void): void;
  on(ev: 'error', cb: (err: { type?: string; message?: string }) => void): void;
  on(ev: 'disconnected' | 'close', cb: () => void): void;
  connect(id: string, opts?: { reliable?: boolean }): ConnLike;
  reconnect?(): void;
  destroy(): void;
}
interface ConnLike {
  peer: string;
  open: boolean;
  on(ev: 'open' | 'close', cb: () => void): void;
  on(ev: 'data', cb: (d: unknown) => void): void;
  on(ev: 'error', cb: (e: unknown) => void): void;
  send(d: unknown): void;
  close(): void;
}
declare global { interface Window { Peer?: new (id?: string, opts?: Record<string, unknown>) => PeerLike; __EQ_PEER_SERVER__?: Record<string, unknown> } }

const PEERJS_SRC = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
// Separate the round-tagged protocol from older cached clients.
const PREFIX = 'engq-v2-';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Clean up whatever a phone keyboard produced: "kq zp." → "KQZP". */
export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

/** A link friends can tap instead of typing the code. */
export function inviteUrl(code: string, base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '/'): string {
  return `${base}?room=${encodeURIComponent(code)}`;
}

export function makeRoomCode(): string {
  let c = '';
  for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return c;
}

type PeerCtor = new (id?: string, opts?: Record<string, unknown>) => PeerLike;
let bundled: PeerCtor | null = null;

/** The bundled PeerJS client (lazy chunk); falls back to the CDN copy for very old cached builds. */
async function loadPeer(): Promise<PeerCtor> {
  if (bundled) return bundled;
  try {
    const mod = await import('peerjs');
    bundled = mod.Peer as unknown as PeerCtor;
    return bundled;
  } catch { /* fall through to the CDN */ }
  if (window.Peer) return window.Peer;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEERJS_SRC; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the online play library. Check your connection and try again.'));
    document.head.appendChild(s);
  });
  if (!window.Peer) throw new Error('Online play library failed to start.');
  return window.Peer;
}

export interface RoomHandlers {
  onMessage: (m: RoomMessage, from: string) => void;
  onStatus: (s: string) => void;
  onError: (e: string) => void;
  onPeerLeft?: (peerId: string) => void;
  /** The link to the online play server dropped (false) or came back (true). An open room keeps trying to get it back. */
  onSignal?: (up: boolean) => void;
}

export class Room {
  private peer: PeerLike | null = null;
  private conns = new Map<string, ConnLike>();
  private closed = false;
  private resignal?: ReturnType<typeof setTimeout>;
  /** Ends a pending join at once when the server says nobody has that room. */
  private joinFail?: (message: string) => void;
  readonly isHost: boolean;
  readonly code: string;
  constructor(code: string, isHost: boolean, private h: RoomHandlers) { this.code = code.toUpperCase(); this.isHost = isHost; }

  async open(): Promise<void> {
    const Peer = await loadPeer();
    if (this.closed) throw new Error('This room was closed.');
    const id = this.isHost ? PREFIX + this.code : undefined;
    // Default: the public PeerJS cloud. Override with window.__EQ_PEER_SERVER__ = { host, port, path, secure } to self-host.
    this.peer = new Peer(id, { debug: 0, ...(window.__EQ_PEER_SERVER__ ?? {}) });
    let opened = false;
    await new Promise<void>((resolve, reject) => {
      const p = this.peer!;
      p.on('open', () => { if (opened) this.h.onSignal?.(true); opened = true; resolve(); });
      p.on('error', (e) => {
        const msg = e.type === 'unavailable-id' ? 'That room code is already in use. Try another.' : e.type === 'peer-unavailable' ? 'No room with that code. Check the letters with the host.' : ['network', 'server-error', 'socket-error', 'socket-closed', 'webrtc'].includes(e.type ?? '') ? 'Could not reach the online play server. Check your internet (mobile data or Wi-Fi) and try again.' : e.message || 'Connection error.';
        if (e.type === 'peer-unavailable' && this.joinFail) { this.joinFail(msg); return; }
        this.h.onError(msg); reject(new Error(msg));
      });
    });
    this.peer.on('connection', (c) => this.wire(c));
    this.peer.on('disconnected', () => {
      if (this.closed) return;
      this.h.onStatus('Lost the online play server. Reconnecting…'); this.h.onSignal?.(false);
      // Same id and token, so the server hands the room back; open links to players carry on meanwhile.
      clearTimeout(this.resignal);
      this.resignal = setTimeout(() => { if (this.closed) return; try { this.peer?.reconnect?.(); } catch { /* destroyed: a new room takes over */ } }, 3000);
    });
    this.h.onStatus(this.isHost ? `Room ${this.code} open. Waiting for players…` : 'Connecting to room…');
  }

  async join(): Promise<void> {
    if (!this.peer) await this.open();
    const conn = this.peer!.connect(PREFIX + this.code, { reliable: true });
    await new Promise<void>((resolve, reject) => {
      const done = (err?: Error) => { clearTimeout(t); this.joinFail = undefined; if (err) reject(err); else resolve(); };
      const t = setTimeout(() => done(new Error('Could not reach the host. Is the code right and the host still in the room?')), 12_000);
      this.joinFail = (msg) => done(new Error(msg));
      conn.on('open', () => done());
      conn.on('error', () => done(new Error('Connection failed.')));
    });
    this.wire(conn);
    this.h.onStatus('Connected!');
  }

  private wire(c: ConnLike) {
    if (!this.isHost && c.peer !== PREFIX + this.code) { c.close(); return; }
    this.conns.set(c.peer, c);
    c.on('data', (d) => { if (d && typeof d === 'object' && 't' in (d as object)) this.h.onMessage(d as RoomMessage, c.peer); });
    c.on('close', () => { this.conns.delete(c.peer); this.h.onPeerLeft?.(c.peer); });
    c.on('error', () => { /* handled by close */ });
  }

  send(m: RoomMessage) {
    for (const c of this.conns.values()) if (c.open) c.send(m);
  }

  sendTo(peer: string, m: RoomMessage) { const c = this.conns.get(peer); if (c?.open) c.send(m); }

  /** Close one player's link (it went quiet), so that player reconnects on a fresh one. */
  drop(peer: string) { this.conns.get(peer)?.close(); }

  close() {
    this.closed = true; clearTimeout(this.resignal); this.joinFail = undefined;
    for (const c of this.conns.values()) c.close();
    this.conns.clear();
    this.peer?.destroy();
    this.peer = null;
  }
}


