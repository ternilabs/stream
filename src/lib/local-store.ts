type Namespace = 'api-cache' | 'source-health' | 'recent-searches' | 'settings';

const VERSION = 1;
const PREFIX = `stream:v${VERSION}`;

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
    if (parsed.version !== VERSION || parsed.day !== getLocalDayStamp()) {
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
  writeNamespace(namespace, data);
}

export function deleteCachedValue(namespace: Namespace, key: string): void {
  const data = readNamespace(namespace);
  delete data.values[key];
  writeNamespace(namespace, data);
}

export function clearAppStorage(): void {
  for (const namespace of ['api-cache', 'source-health', 'recent-searches', 'settings'] satisfies Namespace[]) {
    localStorage.removeItem(storageKey(namespace));
  }
}
