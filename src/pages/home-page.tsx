import { useEffect, useState } from 'preact/hooks';
import { apiClient } from '../lib/api-client';
import { getTopRatedWithCache, getTrendingWithCache } from '../lib/queries';
import { MediaItem } from '../lib/types';
import { ApiErrorMessage, StateMessage } from '../components/state-message';
import { MediaSection } from '../components/media-section';

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

  if (error) return <main class="shell page"><ApiErrorMessage error={error} /></main>;
  if (!data) return <main class="shell page"><StateMessage title="Loading metadata" /></main>;

  return (
    <main class="shell page">
      <section class="hero"><p>Streaming metadata and third-party source launcher.</p><h1>Find something to watch.</h1></section>
      <MediaSection title="Trending Movies" items={data.trendingMovies} />
      <MediaSection title="Trending TV" items={data.trendingTv} />
      <MediaSection title="Top Rated Movies" items={data.topMovies} />
      <MediaSection title="Top Rated TV" items={data.topTv} />
    </main>
  );
}
