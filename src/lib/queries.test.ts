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

  // claude-opus-5: Nav and WatchPage both call useSourceHealth on mount. Before the in-flight map
  // they raced past the empty cache and issued the same request twice.
  it('shares one request between callers that ask before the first settles', async () => {
    let resolveTrending: (value: unknown) => void = () => undefined;
    const client = { trending: vi.fn(() => new Promise((resolve) => { resolveTrending = resolve; })) };

    const first = getTrendingWithCache(client as never, 'movies');
    const second = getTrendingWithCache(client as never, 'movies');

    expect(client.trending).toHaveBeenCalledTimes(1);

    resolveTrending({ page: 1, totalPages: 1, results: [] });
    await expect(first).resolves.toEqual({ page: 1, totalPages: 1, results: [] });
    await expect(second).resolves.toEqual({ page: 1, totalPages: 1, results: [] });
  });

  it('keys in-flight requests separately per argument set', async () => {
    const client = { trending: vi.fn().mockResolvedValue({ page: 1, totalPages: 1, results: [] }) };

    await Promise.all([getTrendingWithCache(client, 'movies'), getTrendingWithCache(client, 'tv')]);

    expect(client.trending).toHaveBeenCalledTimes(2);
  });

  it('releases the in-flight entry when a request fails, so a retry can happen', async () => {
    const client = { trending: vi.fn().mockRejectedValue(new Error('network')) };

    await expect(getTrendingWithCache(client as never, 'movies')).rejects.toThrow('network');
    await expect(getTrendingWithCache(client as never, 'movies')).rejects.toThrow('network');

    expect(client.trending).toHaveBeenCalledTimes(2);
  });
});
