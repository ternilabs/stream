import { useEffect, useState } from 'preact/hooks';
import { apiClient } from '../lib/api-client';
import { getTopRatedWithCache, getTrendingWithCache } from '../lib/queries';
import { MediaItem } from '../lib/types';
import { ApiErrorMessage } from '../components/state-message';
import { MediaSection } from '../components/media-section';

interface HomeState {
  trendingMovies: MediaItem[];
  trendingTv: MediaItem[];
  topMovies: MediaItem[];
  topTv: MediaItem[];
}

function Announcement() {
  return (
    <section class="announcement">
      <div class="announcement-head"><span class="eyebrow">Announcement</span><span class="date">Jun 22</span></div>
      <ul>
        <li>Report bugs or open pull requests through the <a href="https://github.com/ternilabs/stream" target="_blank" rel="noopener noreferrer">original GitHub repository</a>.</li>
        <li>Support performance improvements and independent servers through <a href="https://ko-fi.com/mkgpdev" target="_blank" rel="noopener noreferrer">Ko-fi</a>.</li>
        <li>The project is intended for educational and private use only. The developer does not condone or encourage copyright infringement.</li>
        <li>TerniLabs does not store media and uses third-party APIs and providers.</li>
        <li>The project is not affiliated with, endorsed by, or connected to any streaming platform.</li>
      </ul>
    </section>
  );
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

  return (
    <main>
      <div class="wrap">
        <Announcement />
        <MediaSection title="Trending Movies" items={data?.trendingMovies ?? []} loading={!data} />
        <MediaSection title="Trending TV" items={data?.trendingTv ?? []} loading={!data} />
        <MediaSection title="Top Rated Movies" items={data?.topMovies ?? []} loading={!data} />
        <MediaSection title="Top Rated TV" items={data?.topTv ?? []} loading={!data} />
      </div>
    </main>
  );
}
