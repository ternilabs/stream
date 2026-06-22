import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiFailure } from './types';
import { createApiClient } from './api-client';

describe('api-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds search URLs with normalized parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ page: 1, totalPages: 1, results: [] })));
    const client = createApiClient('https://api.example.test', fetchMock);
    await client.search({ q: ' matrix ', page: 2, type: 'movie' });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/search?q=matrix&page=2&type=movie', expect.any(Object));
  });

  it('retries one time on 502', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'UPSTREAM', message: 'Bad gateway' } }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ page: 1, totalPages: 1, results: [] })));
    const client = createApiClient('https://api.example.test', fetchMock);
    await expect(client.trending('movies')).resolves.toEqual({ page: 1, totalPages: 1, results: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry rate-limit responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Daily limit reached' } }), { status: 429 }));
    const client = createApiClient('https://api.example.test', fetchMock);
    await expect(client.topRated('tv')).rejects.toMatchObject(new ApiFailure('rate-limited', 'Daily limit reached', 429));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
