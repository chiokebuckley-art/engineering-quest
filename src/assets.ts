/**
 * Asset path resolver.
 *  - Normal build: prefixes the app base (Vite BASE_URL, e.g. "/quest/") so the game can be
 *    served from a sub-path of another site.
 *  - Single-file build (scripts/make-single-file.mjs): `window.__EQ_ASSETS__` maps each path to a
 *    data URI so the whole game runs from one HTML file with no server.
 */
declare global {
  interface Window { __EQ_ASSETS__?: Record<string, string> }
}
const BASE: string = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
export function asset(path: string): string {
  if (!path.startsWith('/assets/')) return path;
  const map = typeof window !== 'undefined' ? window.__EQ_ASSETS__ : undefined;
  if (map && map[path]) return map[path];
  return BASE.replace(/\/$/, '') + path;
}
