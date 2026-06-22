import { describe, expect, it } from 'vitest';
import { mergeSourceHealth } from './source-health';
import { SOURCES } from './source-registry';

describe('source-health', () => {
  it('merges API health into static sources', () => {
    const merged = mergeSourceHealth(SOURCES, { checkedAt: '2026-06-22T00:00:00Z', sources: [{ id: 'vidlink', name: 'VidLink', isUp: false }] });
    expect(merged.find((source) => source.id === 'vidlink')?.health).toBe('down');
    expect(merged.find((source) => source.id === 'mapple')?.health).toBe('unknown');
  });
});
