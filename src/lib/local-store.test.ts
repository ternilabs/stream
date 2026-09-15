import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_STORAGE_CLEARED_EVENT, clearAppStorage, getCachedValue, getLocalDayStamp, setCachedValue } from './local-store';

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

  // claude-opus-5: recent-searches is deliberately not in DAILY_NAMESPACES, so it survives the
  // day rollover that clears the API cache.
  it('keeps recent searches when the local day changes', () => {
    setCachedValue('recent-searches', 'queries', ['Dune']);
    vi.setSystemTime(new Date('2026-06-23T00:01:00'));
    expect(getCachedValue('recent-searches', 'queries')).toEqual(['Dune']);
  });

  it('clears all app-owned keys', () => {
    setCachedValue('api-cache', 'trending:movies', ['a']);
    setCachedValue('recent-searches', 'queries', ['Dune']);
    localStorage.setItem('other-app:key', 'keep');

    clearAppStorage();

    expect(localStorage.getItem('stream:v2:api-cache')).toBeNull();
    expect(localStorage.getItem('stream:v2:recent-searches')).toBeNull();
    expect(localStorage.getItem('other-app:key')).toBe('keep');
  });

  it('clears old versioned app keys', () => {
    localStorage.setItem('stream:v1:settings', 'old');
    localStorage.setItem('stream:recent-searches', JSON.stringify(['Dune']));
    localStorage.setItem('other-app:key', 'keep');

    clearAppStorage();

    expect(localStorage.getItem('stream:v1:settings')).toBeNull();
    expect(localStorage.getItem('stream:recent-searches')).toBeNull();
    expect(localStorage.getItem('other-app:key')).toBe('keep');
  });

  it('drops a namespace written under a different version', () => {
    localStorage.setItem('stream:v2:api-cache', JSON.stringify({ version: 1, day: getLocalDayStamp(), values: { a: 1 } }));
    expect(getCachedValue('api-cache', 'a')).toBeUndefined();
  });

  it('dispatches a storage-cleared event', () => {
    const listener = vi.fn();
    window.addEventListener(APP_STORAGE_CLEARED_EVENT, listener);
    clearAppStorage();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(APP_STORAGE_CLEARED_EVENT, listener);
  });

  it('formats local day stamps as YYYY-MM-DD', () => {
    expect(getLocalDayStamp()).toBe('2026-06-22');
  });
});
