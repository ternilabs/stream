import { useEffect, useState } from 'preact/hooks';
import { apiClient } from '../lib/api-client';
import { getTopRatedWithCache, getTrendingWithCache } from '../lib/queries';
import { MediaItem } from '../lib/types';
import { ApiErrorMessage } from '../components/state-message';
import { MediaSection } from '../components/media-section';

// claude-opus-5: The announcement bar was removed here; its disclaimer now lives in the global
// footer, and its GitHub / Ko-fi links were dropped by decision rather than relocated.
interface HomeState {
  trendingMovies: MediaItem[];
  trendingTv: MediaItem[];
  topMovies: MediaItem[];
  topTv: MediaItem[];
}

export function HomePage() {
  const [data, setData] = useState<HomeState>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getTrendingWithCache(apiClient, 'movies'),
      getTrendingWithCache(apiClient, 'tv'),
      getTopRatedWithCache(apiClient, 'movies'),
      getTopRatedWithCache(apiClient, 'tv'),
    ]).then(([trendingMovies, trendingTv, topMovies, topTv]) => {
      if (!cancelled) setData({ trendingMovies: trendingMovies.results, trendingTv: trendingTv.results, topMovies: topMovies.results, topTv: topTv.results });
    }).catch((caught) => {
      if (!cancelled) setError(caught);
    });
    return () => { cancelled = true; };
  }, []);

  if (error) return <main class="invalid-response-shell"><ApiErrorMessage error={error} /></main>;

  return (
    <main>
      <div class="wrap">
        <MediaSection title="Trending Movies" items={data?.trendingMovies ?? []} loading={!data} />
        <MediaSection title="Trending TV" items={data?.trendingTv ?? []} loading={!data} />
        <MediaSection title="Top Rated Movies" items={data?.topMovies ?? []} loading={!data} />
        <MediaSection title="Top Rated TV" items={data?.topTv ?? []} loading={!data} />
      </div>
    </main>
  );
}
