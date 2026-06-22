import { describe, expect, it } from 'vitest';
import { SOURCES } from './source-registry';

describe('source-registry', () => {
  it('contains the 18 approved sources and excludes nebula', () => {
    expect(SOURCES).toHaveLength(18);
    expect(SOURCES.map((source) => source.id)).toEqual([
      'mapple', 'superembed', 'vidlink', 'vidsrc', '2embed', '111movies', 'vidfast', 'vidzee', 'spencerdevs',
      'xpass', 'vidcore', 'cinemaos', 'airflix', 'peachify', 'vidzen', 'vidplays', 'videasy', 'zxcstream',
    ]);
    expect(SOURCES.some((source) => source.id === 'nebula')).toBe(false);
  });
});
