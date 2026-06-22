import { createApiClient } from './api-client';
import { getCachedValue, setCachedValue } from './local-store';
import { ApiListKind, ApiSearchParams, PagedMediaResponse, SourceHealthApiResponse, TitleDetails } from './types';

type ApiClient = ReturnType<typeof createApiClient>;

function cacheKey(name: string, params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  return `${name}:${query.toString()}`;
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = getCachedValue<T>('api-cache', key);
  if (existing !== undefined) return existing;
  const value = await load();
  setCachedValue('api-cache', key, value);
  return value;
}

export function getSearchWithCache(client: ApiClient, params: ApiSearchParams): Promise<PagedMediaResponse> {
  return cached(cacheKey('search', { q: params.q.trim(), page: params.page ?? 1, type: params.type }), () => client.search(params));
}

export function getTrendingWithCache(client: Pick<ApiClient, 'trending'>, kind: ApiListKind): Promise<PagedMediaResponse> {
  return cached(cacheKey('trending', { kind }), () => client.trending(kind));
}

export function getTopRatedWithCache(client: ApiClient, kind: ApiListKind): Promise<PagedMediaResponse> {
  return cached(cacheKey('top-rated', { kind }), () => client.topRated(kind));
}

export function getTitleWithCache(client: ApiClient, type: 'movie' | 'tv', id: number): Promise<TitleDetails> {
  return cached(cacheKey('title', { type, id }), () => client.title(type, id));
}

export function getSourcesWithCache(client: ApiClient): Promise<SourceHealthApiResponse> {
  return cached(cacheKey('sources', {}), () => client.sources());
}
