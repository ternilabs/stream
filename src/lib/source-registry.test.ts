import { describe, expect, it } from 'vitest';
import { SOURCES } from './source-registry';

describe('source-registry', () => {
  it('lists the 18 approved sources in order', () => {
    expect(SOURCES).toHaveLength(18);
    expect(SOURCES.map((source) => source.id)).toEqual([
      'mapple', 'superembed', 'vidlink', 'vidsrc', '2embed', '111movies', 'vidfast', 'vidzee', 'spencerdevs',
      'xpass', 'vidcore', 'cinemaos', 'airflix', 'peachify', 'vidzen', 'vidplays', 'videasy', 'zxcstream',
    ]);
  });

  // claude-opus-5: A template missing a placeholder silently produces a broken embed URL,
  // which the resolver cannot detect at runtime.
  it('declares every placeholder the embed resolver substitutes', () => {
    for (const source of SOURCES) {
      expect(source.movieTemplate, source.id).toContain('{id}');
      expect(source.tvTemplate, source.id).toContain('{id}');
      expect(source.tvTemplate, source.id).toContain('{season}');
      expect(source.tvTemplate, source.id).toContain('{episode}');
    }
  });
});
