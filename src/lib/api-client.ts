import { ApiFailure, ApiSearchParams, PagedMediaResponse, SourceHealthApiResponse, TitleDetails } from './types';

type FetchLike = typeof fetch;

const TIMEOUT_MS = 4000;

interface ApiListItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  rating?: number;
  year?: number | null;
  cover?: string | null;
}

interface ApiPagination {
  page: number;
  totalPages: number;
}

interface ApiPaginatedList {
  data: ApiListItem[];
  pagination: ApiPagination;
}

interface ApiTitleDetails extends ApiListItem {
  description?: string;
  genres?: string[];
  trailers?: Array<{ url: string }>;
  cast?: Array<{ actor: string; character?: string; profile?: string | null }>;
  recommended?: ApiListItem[];
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function failureFromStatus(status: number, message: string): ApiFailure {
  if (status === 400) return new ApiFailure('bad-request', message, status);
  if (status === 404) return new ApiFailure('not-found', message, status);
  if (status === 429) return new ApiFailure('rate-limited', message, status);
  if (status === 502) return new ApiFailure('upstream', message, status);
  if (status >= 500) return new ApiFailure('server', message, status);
  return new ApiFailure('network', message, status);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => undefined) as { error?: { message?: string } } | T | undefined;
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'error' in body && body.error?.message
      ? body.error.message
      : `Request failed with status ${response.status}`;
    throw failureFromStatus(response.status, message);
  }
  return body as T;
}

function mapMediaItem(item: ApiListItem) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    ...(item.year == null ? {} : { year: String(item.year) }),
    ...(item.cover ? { posterUrl: item.cover } : {}),
    ...(item.rating === undefined ? {} : { rating: item.rating }),
  };
}

function normalizeList(response: ApiPaginatedList): PagedMediaResponse {
  return {
    page: response.pagination.page,
    totalPages: response.pagination.totalPages,
    results: response.data.map(mapMediaItem),
  };
}

function normalizeTitle(response: ApiTitleDetails): TitleDetails {
  return {
    ...mapMediaItem(response),
    ...(response.description ? { overview: response.description } : {}),
    ...(response.genres ? { genres: response.genres } : {}),
    ...(response.trailers?.[0]?.url ? { trailerUrl: response.trailers[0].url } : {}),
    ...(response.cast ? { cast: response.cast.map((person, index) => ({ id: index, name: person.actor, character: person.character, imageUrl: person.profile ?? undefined })) } : {}),
    ...(response.recommended ? { recommended: response.recommended.map(mapMediaItem) } : {}),
  };
}

export function createApiClient(baseUrl = import.meta.env.VITE_API_BASE_URL ?? '', fetcher: FetchLike = fetch) {
  const base = normalizeBaseUrl(baseUrl);

  async function request<T>(path: string, retry502 = true): Promise<T> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetcher(`${base}${path}`, { signal: controller.signal });
      if (response.status === 502 && retry502) return request<T>(path, false);
      return await parseResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiFailure) throw error;
      throw new ApiFailure('network', error instanceof Error ? error.message : 'Network request failed');
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return {
    healthz: () => request<{ ok: boolean }>('/healthz'),
    search: async (params: ApiSearchParams) => {
      const query = new URLSearchParams();
      query.set('query', params.q.trim());
      if (params.page) query.set('page', String(params.page));
      if (params.type) query.set('type', params.type);
      if (params.limit) query.set('limit', String(params.limit));
      return normalizeList(await request<ApiPaginatedList>(`/v1/search?${query.toString()}`));
    },
    trending: async (kind: 'movies' | 'tv') => normalizeList(await request<ApiPaginatedList>(`/v1/trending/${kind}`)),
    topRated: async (kind: 'movies' | 'tv') => normalizeList(await request<ApiPaginatedList>(`/v1/top-rated/${kind}`)),
    title: async (type: 'movie' | 'tv', id: number) => normalizeTitle(await request<ApiTitleDetails>(`/v1/titles/${type}/${id}`)),
    sources: () => request<SourceHealthApiResponse>('/v1/sources'),
  };
}

export const apiClient = createApiClient();
