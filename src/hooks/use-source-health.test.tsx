import { renderHook, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSourceHealth } from './use-source-health';
import { getSourcesWithCache } from '../lib/queries';

vi.mock('../lib/api-client', () => ({ apiClient: {} }));
vi.mock('../lib/queries', () => ({ getSourcesWithCache: vi.fn() }));

const mockedGetSourcesWithCache = vi.mocked(getSourcesWithCache);

describe('useSourceHealth', () => {
  beforeEach(() => {
    mockedGetSourcesWithCache.mockReset();
  });

  it('loads source health and exposes only up sources as available', async () => {
    mockedGetSourcesWithCache.mockResolvedValue({
      checkedAt: null,
      sources: [
        { id: 'mapple', name: 'Mapple', isUp: true },
        { id: 'vidlink', name: 'VidLink', isUp: false },
      ],
    });

    const { result } = renderHook(() => useSourceHealth());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isUnavailable).toBe(false);
    expect(result.current.sources.find((source) => source.id === 'mapple')?.health).toBe('up');
    expect(result.current.sources.find((source) => source.id === 'vidlink')?.health).toBe('down');
    expect(result.current.availableSources.map((source) => source.id)).toEqual(['mapple']);
  });

  it('marks sources unavailable when source health cannot be loaded', async () => {
    mockedGetSourcesWithCache.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useSourceHealth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sources).toEqual([]);
    expect(result.current.availableSources).toEqual([]);
    expect(result.current.isUnavailable).toBe(true);
  });
});
