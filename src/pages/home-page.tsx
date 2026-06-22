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
    <main>
      <div class="wrap">
      <section class="announcement">
        <div class="announcement-head"><span class="eyebrow">TerniLabs Stream</span><span class="date">Daily cache active</span></div>
        <ul>
          <li>Search movies and TV metadata without storing videos on this site.</li>
          <li>Open third-party players from any visible title card.</li>
          <li>If the free API limit is hit, cached data remains available where possible.</li>
        </ul>
      </section>
      <MediaSection title="Trending Movies" items={data.trendingMovies} />
      <MediaSection title="Trending TV" items={data.trendingTv} />
      <MediaSection title="Top Rated Movies" items={data.topMovies} />
      <MediaSection title="Top Rated TV" items={data.topTv} />
      </div>
    </main>
  );
}
