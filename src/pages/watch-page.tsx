import { useEffect, useMemo, useState } from 'preact/hooks';
import { apiClient } from '../lib/api-client';
import { resolveEmbedUrl } from '../lib/embed-resolver';
import { getTitleWithCache } from '../lib/queries';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';
import { MediaType, TitleDetails } from '../lib/types';
import { ApiErrorMessage } from '../components/state-message';
import { SeasonEpisodePicker } from '../components/season-episode-picker';
import { ServerSelect } from '../components/server-select';

export function WatchPage() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const id = Number(pathParts[1]);
  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') === 'tv' ? 'tv' : 'movie') as MediaType;
  const [season, setSeason] = useState(Number(params.get('season')) || 1);
  const [episode, setEpisode] = useState(Number(params.get('episode')) || 1);
  const sources = useMemo(() => mergeSourceHealth(SOURCES), []);
  const [sourceId, setSourceId] = useState(sources[0].id);
  const [details, setDetails] = useState<TitleDetails>();
  const [error, setError] = useState<unknown>();
  const source = sources.find((item) => item.id === sourceId) ?? sources[0];
  const embedUrl = resolveEmbedUrl(source, { type, id, season, episode });

  useEffect(() => {
    getTitleWithCache(apiClient, type, id).then(setDetails).catch(setError);
  }, [id, type]);

  function updateEpisode(nextSeason: number, nextEpisode: number) {
    setSeason(nextSeason);
    setEpisode(nextEpisode);
    const next = new URLSearchParams(window.location.search);
    next.set('type', type);
    next.set('season', String(nextSeason));
    next.set('episode', String(nextEpisode));
    window.history.replaceState(null, '', `/watch/${id}?${next.toString()}`);
  }

  return (
    <main class="shell page watch-layout">
      <section>
        <iframe class="player" src={embedUrl} title={details?.title ?? 'Selected stream source'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        <ServerSelect sources={sources} value={sourceId} onChange={setSourceId} />
        {type === 'tv' ? <SeasonEpisodePicker season={season} episode={episode} onChange={updateEpisode} /> : null}
        <p class="muted">TerniLabs does not host video. If one third-party source fails, try another server.</p>
      </section>
      <aside class="details-panel">
        {error ? <ApiErrorMessage error={error} /> : null}
        <h1>{details?.title ?? `Title ${id}`}</h1>
        <p>{details?.overview ?? 'Details are unavailable, but the selected third-party player can still be tried.'}</p>
      </aside>
    </main>
  );
}
