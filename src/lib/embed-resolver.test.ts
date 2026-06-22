import { describe, expect, it } from 'vitest';
import { resolveEmbedUrl } from './embed-resolver';
import { SOURCES } from './source-registry';

describe('embed-resolver', () => {
  it('builds movie URLs from provider templates', () => {
    expect(resolveEmbedUrl(SOURCES[2], { type: 'movie', id: 603 })).toBe('https://vidlink.pro/movie/603');
  });

  it('builds TV URLs with season and episode', () => {
    expect(resolveEmbedUrl(SOURCES[0], { type: 'tv', id: 1399, season: 2, episode: 3 })).toBe('https://mapple.uk/watch/tv/1399-2-3?autoPlay=true');
  });
});
