/**
 * SaveSystem: versioned JSON persistence behind a tiny adapter interface so that a
 * cloud/database adapter can be added later without touching game logic.
 */
export const SAVE_KEY = 'engineering-quest.save';
export const SCHEMA_VERSION = 1;

export interface SaveEnvelope<T> {
  schemaVersion: number;
  savedAt: number;
  data: T;
}

export interface SaveAdapter {
  load(): Promise<string | null> | string | null;
  save(raw: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

export class LocalStorageAdapter implements SaveAdapter {
  constructor(private key = SAVE_KEY) {}
  load() {
    try { return globalThis.localStorage?.getItem(this.key) ?? null; } catch { return null; }
  }
  save(raw: string) {
    try { globalThis.localStorage?.setItem(this.key, raw); } catch { /* quota or private mode — ignore */ }
  }
  clear() {
    try { globalThis.localStorage?.removeItem(this.key); } catch { /* ignore */ }
  }
}

export class MemoryAdapter implements SaveAdapter {
  private raw: string | null = null;
  load() { return this.raw; }
  save(raw: string) { this.raw = raw; }
  clear() { this.raw = null; }
}

export type Migration = (data: unknown, fromVersion: number) => unknown;

export function serialize<T>(data: T): string {
  const env: SaveEnvelope<T> = { schemaVersion: SCHEMA_VERSION, savedAt: Date.now(), data };
  return JSON.stringify(env);
}

export function deserialize<T>(raw: string, migrate?: Migration): T | null {
  try {
    const env = JSON.parse(raw) as SaveEnvelope<T>;
    if (!env || typeof env !== 'object' || !('data' in env)) return null;
    let data: unknown = env.data;
    if (env.schemaVersion !== SCHEMA_VERSION && migrate) data = migrate(data, env.schemaVersion);
    return data as T;
  } catch {
    return null;
  }
}

export function createSaveSystem<T>(adapter: SaveAdapter, migrate?: Migration) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    async load(): Promise<T | null> {
      const raw = await adapter.load();
      return raw ? deserialize<T>(raw, migrate) : null;
    },
    async save(data: T) { await adapter.save(serialize(data)); },
    /** Debounced save for frequent state changes. */
    saveSoon(data: T, delayMs = 400) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { void adapter.save(serialize(data)); }, delayMs);
    },
    async clear() { await adapter.clear(); },
    export(data: T) { return serialize(data); },
    import(raw: string) { return deserialize<T>(raw, migrate); },
  };
}
