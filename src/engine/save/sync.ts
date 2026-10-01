/**
 * Cloud sync for profiles, the same scheme Word Raiders uses. A profile that is "linked" carries a
 * secret 12-character sync code; the same code entered on another device pulls the same save.
 * The server keeps one save per code with a revision counter, so two devices never overwrite each
 * other silently: the device with the older copy is handed the newer save instead.
 *
 * Both games share one sync service (a tiny Cloudflare Worker with a database, see
 * wordraiders/sync/worker.mjs). The address comes from localStorage "engineering-quest.sync.url"
 * (self-hosting, tests), then sync.json next to the game, then the built-in default.
 *
 * Saves grow past the server's 400 KB cap after a few months of play, so they travel gzipped and
 * base64-encoded ("gz1:" prefix) whenever the browser can compress; older browsers send plain JSON.
 */
import { deserialize } from './SaveSystem';

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 12;
/** Engineering Quest codes start with EQ so a code tells you which game it belongs to. */
export const CODE_PREFIX = 'EQ';
export const SYNC_URL_KEY = 'engineering-quest.sync.url';
export const DEFAULT_SYNC_URL = 'https://wordraiders-sync.wordraiders.workers.dev';
/** Push at most this often while playing; pull when the app comes back after this long. */
export const PUSH_DELAY_MS = 15_000;
export const PULL_GAP_MS = 20_000;

export interface SyncLink { code: string; rev: number; at: number }
export interface RemoteSave { rev: number; savedAt: number; data: string }
export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export function newSyncCode(random: () => number = Math.random): string {
  let c = CODE_PREFIX;
  while (c.length < CODE_LENGTH) c += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return c;
}
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, CODE_LENGTH);
export const validCode = (s: string) => new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(s);
export const formatCode = (c: string) => (c.length === CODE_LENGTH ? `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}` : c);
export const validSyncUrl = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\/[^\s]+$/.test(u) && u.length < 300;

/** The sync server address. Never throws; null only when sync has been switched off by config. */
export async function loadSyncConfig(fetchFn: Fetch, storage?: Pick<Storage, 'getItem'>, base = './'): Promise<{ url: string } | null> {
  try { const o: string | null | undefined = storage?.getItem(SYNC_URL_KEY); if (o === 'off') return null; if (validSyncUrl(o)) return { url: o.replace(/\/$/, '') }; } catch { /* storage may be blocked */ }
  try {
    const res = await fetchFn(`${base}sync.json?_=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) { const x = (await res.json()) as { url?: unknown }; if (validSyncUrl(x?.url)) return { url: x.url.replace(/\/$/, '') }; if (x?.url === 'off') return null; }
  } catch { /* no sync.json: use the default */ }
  return { url: DEFAULT_SYNC_URL };
}

/* ---------- compression: gzip + base64 when the browser has CompressionStream ---------- */
const GZ = 'gz1:';
declare const CompressionStream: { new (format: string): { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> } } | undefined;
declare const DecompressionStream: { new (format: string): { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> } } | undefined;

async function pipe(bytes: Uint8Array, stream: { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }): Promise<Uint8Array> {
  const w = stream.writable.getWriter(); void w.write(bytes); void w.close();
  const chunks: Uint8Array[] = []; const r = stream.readable.getReader();
  for (;;) { const { done, value } = await r.read(); if (done) break; if (value) chunks.push(value); }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0)); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}
const toB64 = (b: Uint8Array) => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = (s: string) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));

/** Shrink a save for the wire. Plain text when compression is unavailable. */
export async function packSave(raw: string): Promise<string> {
  if (typeof CompressionStream === 'undefined') return raw;
  try { return GZ + toB64(await pipe(new TextEncoder().encode(raw), new CompressionStream('gzip'))); } catch { return raw; }
}
/** Undo packSave. Throws when the text is compressed and this browser cannot decompress. */
export async function unpackSave(text: string): Promise<string> {
  if (!text.startsWith(GZ)) return text;
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser is too old to read synced saves.');
  return new TextDecoder().decode(await pipe(fromB64(text.slice(GZ.length)), new DecompressionStream('gzip')));
}

/* ---------- server calls ---------- */
export async function pullSave(url: string, code: string, fetchFn: Fetch): Promise<RemoteSave | null> {
  const res = await fetchFn(`${url}/v1/save/${code}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Sync server said ${res.status}.`);
  const x = (await res.json()) as { rev?: unknown; savedAt?: unknown; data?: unknown };
  if (!x || !Number.isInteger(x.rev) || typeof x.data !== 'string') throw new Error('The sync server sent something odd.');
  return { rev: x.rev as number, savedAt: Number(x.savedAt) || 0, data: x.data };
}

export type PushResult = { ok: true; rev: number; savedAt: number } | { ok: false; conflict: RemoteSave } | { ok: false; error: string };
export async function pushSave(url: string, code: string, data: string, baseRev: number, savedAt: number, fetchFn: Fetch, keepalive = false): Promise<PushResult> {
  try {
    // text/plain keeps the browser from sending a CORS preflight before every push.
    const res = await fetchFn(`${url}/v1/save/${code}`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ data, baseRev, savedAt }), keepalive });
    const x = (await res.json().catch(() => null)) as { conflict?: unknown; rev?: unknown; savedAt?: unknown; data?: unknown; error?: unknown } | null;
    if (res.status === 409 && x?.conflict) return { ok: false, conflict: { rev: Number(x.rev) || 0, savedAt: Number(x.savedAt) || 0, data: typeof x.data === 'string' ? x.data : '' } };
    if (!res.ok) return { ok: false, error: typeof x?.error === 'string' ? x.error : `Sync server said ${res.status}.` };
    return { ok: true, rev: Number(x?.rev) || baseRev + 1, savedAt: Number(x?.savedAt) || savedAt };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'No connection.' }; }
}

/**
 * What to do after looking at the cloud copy:
 *  - use-remote: the cloud moved on since this device last synced and it is the newer save;
 *  - push: this device has changes the cloud does not (its base revision is still current, or its copy is newer);
 *  - same: nothing to do.
 */
export function reconcile(link: SyncLink, localSavedAt: number, remote: RemoteSave | null): 'use-remote' | 'push' | 'same' {
  if (!remote) return 'push';
  const localChanged = localSavedAt > link.at;
  if (remote.rev === link.rev) return localChanged ? 'push' : 'same';
  if (remote.rev < link.rev) return 'push';
  if (!localChanged) return 'use-remote';
  return remote.savedAt >= localSavedAt ? 'use-remote' : 'push';
}

/** Parse a pulled save into game data; null when it is not an Engineering Quest save. */
export async function readRemote<T extends { character?: unknown }>(data: string): Promise<T | null> {
  const raw = await unpackSave(data);
  const d = deserialize<T>(raw);
  return d && typeof d === 'object' && d.character ? d : null;
}

export const ago = (ms: number) => (ms < 60_000 ? 'just now' : ms < 3_600_000 ? `${Math.round(ms / 60_000)} min ago` : ms < 86_400_000 ? `${Math.round(ms / 3_600_000)} h ago` : `${Math.round(ms / 86_400_000)} day${Math.round(ms / 86_400_000) === 1 ? '' : 's'} ago`);
