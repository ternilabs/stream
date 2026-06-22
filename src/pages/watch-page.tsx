import { useEffect, useMemo, useState } from 'preact/hooks';
import { Share2, Star, User } from 'preact-feather';
import { apiClient } from '../lib/api-client';
import { resolveEmbedUrl } from '../lib/embed-resolver';
import { getTitleWithCache } from '../lib/queries';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';
import { MediaType, TitleDetails } from '../lib/types';
import { ApiErrorMessage } from '../components/state-message';
import { MediaCard } from '../components/media-card';
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
    <main>
      <div class="wrap detail-shell">
      <div class="left-panel">
        <section class="player-card" aria-label="Player area">
          <div class="player-placeholder">
            <iframe class="player-frame" src={embedUrl} title={details?.title ?? 'Selected stream source'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          </div>
          <div class="player-controls">
            <div class="now-row">
              <div class="now-copy"><span class="kicker">Now playing</span><span class="now-title">{details?.title ?? `Title ${id}`}{type === 'tv' ? ` S${season} E${episode}` : ''}</span></div>
              <button class="share-button" type="button" aria-label="Share title" onClick={() => navigator.clipboard?.writeText(window.location.href)}><Share2 aria-hidden="true" /></button>
              <ServerSelect sources={sources} value={sourceId} onChange={setSourceId} />
            </div>
            {type === 'tv' ? <SeasonEpisodePicker season={season} episode={episode} onChange={updateEpisode} /> : null}
            <div class="note-line">Please try different servers if one isn't working, and consider using ad blockers or the Brave browser.</div>
          </div>
        </section>

        <section class="panel-card recommendation" aria-label="Recommendations">
          <div class="section-head"><h2 class="section-title">Recommendation</h2></div>
          <div class="reco-grid">
            {(details?.recommended ?? []).slice(0, 12).map((item) => <MediaCard item={item} key={`${item.type}-${item.id}`} />)}
            {!details?.recommended?.length ? <div class="empty-row">No recommendations available.</div> : null}
          </div>
        </section>
      </div>

      <aside class="right-panel">
        <section class="panel-card detail-card">
          {error ? <ApiErrorMessage error={error} /> : null}
          <div class="detail-top">
            <div class="detail-poster">{details?.posterUrl ? <img src={details.posterUrl} alt="" /> : <span class="placeholder"><User aria-hidden="true" /></span>}</div>
            <div>
              <h1 class="detail-title">{details?.title ?? `Title ${id}`}</h1>
              <div class="detail-facts">
                <span><span class="fact-label">Type</span><span class="fact-value">{type.toUpperCase()}</span></span>
                <span><span class="fact-label">Year</span><span class="fact-value">{details?.year ?? 'Unknown'}</span></span>
                <span><span class="fact-label">Rating</span><span class="fact-value">{details?.rating ? <><Star aria-hidden="true" /> {details.rating.toFixed(1)}</> : 'Unrated'}</span></span>
              </div>
            </div>
          </div>
          <div class="summary-box"><p class="summary-text collapsed">{details?.overview ?? 'Details are unavailable, but the selected third-party player can still be tried.'}</p></div>
          {details?.genres?.length ? <div class="tag-list">{details.genres.map((genre) => <span class="tag" key={genre}>{genre}</span>)}</div> : null}
        </section>

        <section class="panel-card trailer-card">
          <div class="section-head"><h2 class="section-title">Trailer</h2></div>
          <div class="trailer-list">{details?.trailerUrl ? <a class="trailer-button" href={details.trailerUrl} target="_blank" rel="noreferrer">Open trailer <Share2 aria-hidden="true" /></a> : <span class="empty-row">No trailer available.</span>}</div>
        </section>

        <section class="panel-card characters-card">
          <div class="character-head"><h2 class="section-title">Characters</h2><button class="character-view-all" type="button">view all</button></div>
          <div class="character-list">
            {(details?.cast ?? []).slice(0, 4).map((person) => <div class="character-row" key={person.id}><span class="avatar">{person.imageUrl ? <img src={person.imageUrl} alt="" /> : person.name.slice(0, 2).toUpperCase()}</span><span><span class="character-name">{person.character ?? person.name}</span><span class="actor-name">{person.name}</span></span></div>)}
            {!details?.cast?.length ? <span class="empty-row">No character data available.</span> : null}
          </div>
        </section>
      </aside>
      </div>
    </main>
  );
}
