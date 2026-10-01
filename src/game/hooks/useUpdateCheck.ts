import { useCallback, useEffect, useState } from 'react';

export interface BuildInfo { version: string; builtAt: string }
declare const __EQ_BUILD__: BuildInfo | undefined;

export const CURRENT_BUILD: BuildInfo = typeof __EQ_BUILD__ !== 'undefined' ? __EQ_BUILD__ : { version: 'dev', builtAt: '' };

const CHECK_MS = 5 * 60_000;

/**
 * Looks for a newer deployed build by fetching version.json (never cached) on load, when the
 * app comes back to the foreground, and every five minutes. `reload()` forces a fresh copy so
 * home-screen installs pick up updates without reinstalling.
 */
export function useUpdateCheck() {
  const [remote, setRemote] = useState<BuildInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState(0);

  const check = useCallback(async () => {
    if (!CURRENT_BUILD.builtAt) return null; // dev server
    setChecking(true);
    try {
      const url = `${import.meta.env.BASE_URL}version.json?_=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      const info = (await res.json()) as BuildInfo;
      setRemote(info);
      setCheckedAt(Date.now());
      return info;
    } catch {
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
    const t = setInterval(() => { void check(); }, CHECK_MS);
    const onVis = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [check]);

  const available = !!remote && !!CURRENT_BUILD.builtAt && remote.builtAt !== CURRENT_BUILD.builtAt;
  return { available, remote, current: CURRENT_BUILD, check, checking, checkedAt, reload };
}

/** Reload bypassing HTTP caches: a changing query string defeats stale index.html copies. */
export function reload() {
  const u = new URL(window.location.href);
  u.searchParams.set('u', Date.now().toString(36));
  window.location.replace(u.toString());
}
