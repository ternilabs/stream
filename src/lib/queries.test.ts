import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTrendingWithCache } from './queries';

describe('queries', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T08:00:00'));
  });

  it('reuses same-day cached API responses', async () => {
    const client = { trending: vi.fn().mockResolvedValue({ page: 1, totalPages: 1, results: [] }) };
    await getTrendingWithCache(client, 'movies');
    await getTrendingWithCache(client, 'movies');
    expect(client.trending).toHaveBeenCalledTimes(1);
  });
});
