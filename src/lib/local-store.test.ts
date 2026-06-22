import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAppStorage, getCachedValue, getLocalDayStamp, setCachedValue } from './local-store';

describe('local-store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T10:00:00'));
  });

  it('stores and reads same-day cached values', () => {
    setCachedValue('api-cache', 'search:q=matrix', { page: 1, results: [] });
    expect(getCachedValue('api-cache', 'search:q=matrix')).toEqual({ page: 1, results: [] });
  });

  it('clears daily cache when the local day changes', () => {
    setCachedValue('api-cache', 'trending:movies', ['a']);
    vi.setSystemTime(new Date('2026-06-23T00:01:00'));
    expect(getCachedValue('api-cache', 'trending:movies')).toBeUndefined();
  });

  it('clears all app-owned keys', () => {
    setCachedValue('settings', 'selectedSource', 'vidlink');
    localStorage.setItem('other-app:key', 'keep');
    clearAppStorage();
    expect(localStorage.getItem('stream:v1:settings')).toBeNull();
    expect(localStorage.getItem('other-app:key')).toBe('keep');
  });

  it('formats local day stamps as YYYY-MM-DD', () => {
    expect(getLocalDayStamp()).toBe('2026-06-22');
  });
});
