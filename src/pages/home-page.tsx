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
        <div class="announcement-head"><span class="eyebrow">Announcement</span><span class="date">Daily cache active</span></div>
        <ul>
          <li>They can report bugs, pull request from the original repository (https://github.com/ternilabs/stream).</li>
          <li>Donate to improve the performance and have independent servers through my ko-fi (ko-fi.com/mkgpdev).</li>
          <li>The project is intended for educational and private use only. The developer does not condone or encourage copyright infringement.</li>
          <li>We don't store any medias and only supported with third-party APIs.</li>
          <li>The project is not affiliated with, endorsed by, or connected to any streaming platform.</li>
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
