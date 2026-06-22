import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiFailure } from './types';
import { createApiClient } from './api-client';

describe('api-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds search URLs with normalized parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [], pagination: { page: 1, totalPages: 1, totalResults: 0, hasNext: false, hasPrevious: false } })));
    const client = createApiClient('https://api.example.test', fetchMock);
    await client.search({ q: ' matrix ', page: 2, type: 'movie', limit: 6 });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/search?query=matrix&page=2&type=movie&limit=6', expect.any(Object));
  });

  it('normalizes title recommendations from details responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 603,
      type: 'movie',
      title: 'The Matrix',
      rating: 8.2,
      year: 1999,
      cover: 'https://image.test/matrix.jpg',
      recommended: [{ id: 604, type: 'movie', title: 'The Matrix Reloaded', rating: 7.1, year: 2003, cover: 'https://image.test/reloaded.jpg' }],
    })));
    const client = createApiClient('https://api.example.test', fetchMock);

    await expect(client.title('movie', 603)).resolves.toMatchObject({
      id: 603,
      title: 'The Matrix',
      recommended: [{ id: 604, type: 'movie', title: 'The Matrix Reloaded', rating: 7.1, year: '2003', posterUrl: 'https://image.test/reloaded.jpg' }],
    });
  });

  it('normalizes paginated API lists into frontend media items', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 603, type: 'movie', title: 'The Matrix', rating: 8.2, year: 1999, cover: 'https://image.test/matrix.jpg' }],
      pagination: { page: 2, totalPages: 9, totalResults: 171, hasNext: true, hasPrevious: true },
    })));
    const client = createApiClient('https://api.example.test', fetchMock);

    await expect(client.trending('movies')).resolves.toEqual({
      page: 2,
      totalPages: 9,
      results: [{ id: 603, type: 'movie', title: 'The Matrix', rating: 8.2, year: '1999', posterUrl: 'https://image.test/matrix.jpg' }],
    });
  });

  it('retries one time on 502', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'UPSTREAM', message: 'Bad gateway' } }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [], pagination: { page: 1, totalPages: 1, totalResults: 0, hasNext: false, hasPrevious: false } })));
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
