import { ApiFailure, ApiSearchParams, PagedMediaResponse, SourceHealthApiResponse, TitleDetails } from './types';

type FetchLike = typeof fetch;

const TIMEOUT_MS = 4000;

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
    search: (params: ApiSearchParams) => {
      const query = new URLSearchParams();
      query.set('q', params.q.trim());
      if (params.page) query.set('page', String(params.page));
      if (params.type) query.set('type', params.type);
      return request<PagedMediaResponse>(`/v1/search?${query.toString()}`);
    },
    trending: (kind: 'movies' | 'tv') => request<PagedMediaResponse>(`/v1/trending/${kind}`),
    topRated: (kind: 'movies' | 'tv') => request<PagedMediaResponse>(`/v1/top-rated/${kind}`),
    title: (type: 'movie' | 'tv', id: number) => request<TitleDetails>(`/v1/titles/${type}/${id}`),
    sources: () => request<SourceHealthApiResponse>('/v1/sources'),
  };
}

export const apiClient = createApiClient();
