// claude-opus-5: Dropped the unused 'source-health' and 'settings' namespaces, and
// `deleteCachedValue`, which nothing called.
type Namespace = 'api-cache' | 'recent-searches';

const VERSION = 2;
const PREFIX = `stream:v${VERSION}`;

/** claude-opus-5: Namespaces whose values are dropped when the local day changes. Everything else persists until the version changes. */
const DAILY_NAMESPACES: ReadonlySet<Namespace> = new Set<Namespace>(['api-cache']);

interface StoredNamespace {
  version: number;
  day: string;
  values: Record<string, unknown>;
}

export function getLocalDayStamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function storageKey(namespace: Namespace): string {
  return `${PREFIX}:${namespace}`;
}

function readNamespace(namespace: Namespace): StoredNamespace {
  const fallback: StoredNamespace = { version: VERSION, day: getLocalDayStamp(), values: {} };
  const raw = localStorage.getItem(storageKey(namespace));
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as StoredNamespace;
    const expired = DAILY_NAMESPACES.has(namespace) && parsed.day !== getLocalDayStamp();
    if (parsed.version !== VERSION || expired) {
      localStorage.removeItem(storageKey(namespace));
      return fallback;
    }
    return { version: VERSION, day: parsed.day, values: parsed.values ?? {} };
  } catch {
    localStorage.removeItem(storageKey(namespace));
    return fallback;
  }
}

function writeNamespace(namespace: Namespace, data: StoredNamespace): void {
  localStorage.setItem(storageKey(namespace), JSON.stringify(data));
}

export function getCachedValue<T>(namespace: Namespace, key: string): T | undefined {
  const data = readNamespace(namespace);
  return data.values[key] as T | undefined;
}

export function setCachedValue(namespace: Namespace, key: string, value: unknown): void {
  const data = readNamespace(namespace);
  data.values[key] = value;
  // claude-opus-5: Stamp on write so a non-daily namespace still records when it was last touched.
  data.day = getLocalDayStamp();
  writeNamespace(namespace, data);
}

export const APP_STORAGE_CLEARED_EVENT = 'stream:storage-cleared';

export function clearAppStorage(): void {
  const keys = Object.keys(localStorage).filter((key) => key.startsWith('stream:'));
  for (const key of keys) localStorage.removeItem(key);
  window.dispatchEvent(new Event(APP_STORAGE_CLEARED_EVENT));
}
