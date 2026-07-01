import { describe, expect, it } from 'vitest';
import { mergeSourceHealth } from './source-health';
import { SOURCES } from './source-registry';

describe('source-health', () => {
  it('merges API health into static sources', () => {
    const merged = mergeSourceHealth(SOURCES, { checkedAt: '2026-06-22T00:00:00Z', sources: [{ id: 'vidlink', name: 'VidLink', isUp: false }] });
    expect(merged.find((source) => source.id === 'vidlink')?.health).toBe('down');
    expect(merged.find((source) => source.id === 'mapple')?.health).toBe('unknown');
  });

  it('accepts a null checkedAt from the API and still applies source health', () => {
    const merged = mergeSourceHealth(SOURCES, { checkedAt: null, sources: [{ id: 'mapple', name: 'Mapple', isUp: true }] });
    expect(merged.find((source) => source.id === 'mapple')).toMatchObject({ health: 'up', checkedAt: null });
  });

  it('contains no source notes because provider labels are not displayed', () => {
    expect(SOURCES.every((source) => !('notes' in source))).toBe(true);
  });
});
