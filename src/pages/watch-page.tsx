import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { AlertTriangle, ChevronDown, ChevronUp, Share2, Star, User } from 'preact-feather';
import { apiClient } from '../lib/api-client';
import { resolveEmbedUrl } from '../lib/embed-resolver';
import { getTitleWithCache } from '../lib/queries';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';
import { MediaType, TitleDetails, TvSeasonSummary } from '../lib/types';
import { ApiErrorMessage } from '../components/state-message';
import { MediaCard } from '../components/media-card';
import { SeasonEpisodePicker } from '../components/season-episode-picker';
import { ServerSelect } from '../components/server-select';

const PLAYER_IFRAME_PERMISSIONS = {
  allow: 'autoplay; fullscreen *; picture-in-picture; encrypted-media',
  allowFullScreen: true,
  webkitallowfullscreen: 'true',
  mozallowfullscreen: 'true',
} as const;

type WatchRoute =
  | { isValid: true; id: number; type: MediaType }
  | { isValid: false };

function parseWatchRoute(): WatchRoute {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const idText = pathParts[1] ?? '';
  const id = Number(idText);
  const params = new URLSearchParams(window.location.search);
  const rawType = params.get('type');

  if (!Number.isInteger(id) || id <= 0) return { isValid: false };
  if (rawType !== null && rawType !== 'movie' && rawType !== 'tv') return { isValid: false };

  return { isValid: true, id, type: rawType === 'tv' ? 'tv' : 'movie' };
}

function InvalidWatchRoute() {
  return (
    <main class="invalid-watch-shell">
      <section class="invalid-watch-state" role="status" aria-labelledby="invalid-watch-title">
        <span class="invalid-watch-icon"><AlertTriangle aria-label="Invalid watch route" /></span>
        <h1 id="invalid-watch-title">Invalid watch route</h1>
        <p>This watch URL does not match a known movie or TV title. Check the link or search for the title again.</p>
      </section>
    </main>
  );
}

function getValidTvSelection(seasons: TvSeasonSummary[] | undefined, season: number, episode: number) {
  const firstSeason = seasons?.[0];
  if (!firstSeason) return undefined;
  const selectedSeason = seasons.find((item) => item.seasonNumber === season) ?? firstSeason;
  const selectedEpisode = selectedSeason.episodes.find((item) => item.episodeNumber === episode) ?? selectedSeason.episodes[0];
  if (!selectedEpisode) return undefined;
  return { season: selectedSeason.seasonNumber, episode: selectedEpisode.episodeNumber };
}

function updateWatchUrl(id: number, type: MediaType, season?: number, episode?: number) {
  const next = new URLSearchParams(window.location.search);
  next.set('type', type);
  if (type === 'tv' && season && episode) {
    next.set('season', String(season));
    next.set('episode', String(episode));
  } else {
    next.delete('season');
    next.delete('episode');
  }
  window.history.replaceState(null, '', `/watch/${id}?${next.toString()}`);
}

function DetailSkeleton() {
  return (
    <div class="detail-skeleton" aria-label="Loading title details">
      <div class="watch-skeleton poster" />
      <div class="watch-skeleton-lines">
        <span class="watch-skeleton line wide" />
        <span class="watch-skeleton line" />
        <span class="watch-skeleton line short" />
      </div>
    </div>
  );
}

function RecommendationSkeleton() {
  return <div class="reco-grid" aria-label="Loading recommendations">{Array.from({ length: 6 }, (_, index) => <div class="skeleton-card" key={index}><div class="skeleton-poster" /><div class="skeleton-title" /></div>)}</div>;
}

function CharacterSkeleton() {
  return <div class="character-list" aria-label="Loading characters">{Array.from({ length: 4 }, (_, index) => <div class="character-row" key={index}><span class="avatar watch-skeleton" /><span class="watch-skeleton-lines"><span class="watch-skeleton line" /><span class="watch-skeleton line short" /></span></div>)}</div>;
}

function ValidWatchPage({ id, type }: { id: number; type: MediaType }) {
  const params = new URLSearchParams(window.location.search);
  const [season, setSeason] = useState(Number(params.get('season')) || 1);
  const [episode, setEpisode] = useState(Number(params.get('episode')) || 1);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const [charactersExpanded, setCharactersExpanded] = useState(false);
  const sources = useMemo(() => mergeSourceHealth(SOURCES), []);
  const [sourceId, setSourceId] = useState(sources[0].id);
  const [details, setDetails] = useState<TitleDetails>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(true);
  const source = sources.find((item) => item.id === sourceId) ?? sources[0];
  const validTvSelection = type === 'tv' ? getValidTvSelection(details?.seasons, season, episode) : undefined;
  const canRenderPlayer = type === 'movie' || Boolean(validTvSelection);
  const embedUrl = canRenderPlayer ? resolveEmbedUrl(source, { type, id, season: validTvSelection?.season ?? season, episode: validTvSelection?.episode ?? episode }) : undefined;
  const production = details?.production?.[0] ?? 'Unknown';
  const visibleCast = charactersExpanded ? details?.cast ?? [] : (details?.cast ?? []).slice(0, 4);
  const showCharacterToggle = (details?.cast?.length ?? 0) > 4;

  useEffect(() => {
    setIsLoading(true);
    setError(undefined);
    setDetails(undefined);
    getTitleWithCache(apiClient, type, id)
      .then(setDetails)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [id, type]);

  useEffect(() => {
    setDescriptionExpanded(false);
    setDescriptionTruncated(false);
  }, [details?.overview]);

  useEffect(() => {
    if (descriptionExpanded) return;
    const summary = summaryRef.current;
    if (!summary || !details?.overview) {
      setDescriptionTruncated(false);
      return;
    }
    setDescriptionTruncated(summary.scrollHeight > summary.clientHeight + 1);
  }, [descriptionExpanded, details?.overview, isLoading]);

  useEffect(() => {
    if (type !== 'tv' || !details) return;
    const validSelection = getValidTvSelection(details.seasons, season, episode);
    if (!validSelection) return;
    if (validSelection.season !== season || validSelection.episode !== episode) {
      setSeason(validSelection.season);
      setEpisode(validSelection.episode);
      updateWatchUrl(id, type, validSelection.season, validSelection.episode);
    }
  }, [details, episode, id, season, type]);

  function updateEpisode(nextSeason: number, nextEpisode: number) {
    setSeason(nextSeason);
    setEpisode(nextEpisode);
    updateWatchUrl(id, type, nextSeason, nextEpisode);
  }

  return (
    <main>
      <div class="wrap detail-shell">
        <div class="left-panel">
          <section class="player-card" aria-label="Player area">
            <div class="player-placeholder">
              {embedUrl ? <iframe class="player-frame" src={embedUrl} title={details?.title ?? 'Selected stream source'} {...PLAYER_IFRAME_PERMISSIONS} /> : <div class="blocked-player">Episodes are unavailable until valid season data exists.</div>}
            </div>
            <div class="player-controls">
              <div class="now-row">
                <div class="now-copy"><span class="kicker">Now playing</span><span class="now-title">{details?.title ?? (isLoading ? 'Loading title...' : `Title ${id}`)}{type === 'tv' && validTvSelection ? ` S${validTvSelection.season} E${validTvSelection.episode}` : ''}</span></div>
                <ServerSelect sources={sources} value={sourceId} onChange={setSourceId} />
              </div>
              {type === 'tv' ? <SeasonEpisodePicker seasons={details?.seasons ?? []} season={validTvSelection?.season ?? season} episode={validTvSelection?.episode ?? episode} onChange={updateEpisode} /> : null}
              <div class="note-line">Please try different servers if one isn't working, and consider using ad blockers or the Brave browser.</div>
            </div>
          </section>

          <section class="panel-card recommendation" aria-label="Recommendations">
            <div class="section-head"><h2 class="section-title">Recommendation</h2></div>
            {isLoading ? <RecommendationSkeleton /> : <div class="reco-grid">
              {(details?.recommended ?? []).slice(0, 12).map((item) => <MediaCard item={item} key={`${item.type}-${item.id}`} />)}
              {!error && !details?.recommended?.length ? <div class="empty-row">No recommendations available.</div> : null}
            </div>}
          </section>
        </div>

        <aside class="right-panel">
          <section class="panel-card detail-card">
            {error ? <ApiErrorMessage error={error} /> : null}
            {isLoading ? <DetailSkeleton /> : <>
              <div class="detail-top">
                <div class="detail-poster">{details?.posterUrl ? <img src={details.posterUrl} alt="" /> : <span class="placeholder"><User aria-hidden="true" /></span>}</div>
                <div>
                  <h1 class="detail-title">{details?.title ?? `Title ${id}`}</h1>
                  <div class="detail-facts">
                    <span><span class="fact-label">Production</span><span class="fact-value">{production}</span></span>
                    <span><span class="fact-label">Year</span><span class="fact-value">{details?.year ?? 'Unknown'}</span></span>
                    <span><span class="fact-label">Rating</span><span class="fact-value">{details?.rating ? <><Star aria-hidden="true" /> {details.rating.toFixed(1)}</> : 'Unrated'}</span></span>
                  </div>
                </div>
              </div>
              <div class="summary-box">
                <p ref={summaryRef} class={`summary-text${descriptionExpanded ? '' : ' collapsed'}`}>{details?.overview ?? 'Details are unavailable.'}</p>
                {details?.overview && descriptionTruncated ? <button class="see-more" type="button" aria-expanded={descriptionExpanded} aria-label={descriptionExpanded ? 'See less description' : 'See more description'} onClick={() => setDescriptionExpanded((value) => !value)}>{descriptionExpanded ? 'See less' : 'See more'} {descriptionExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}</button> : null}
              </div>
              {details?.genres?.length ? <div class="tag-list">{details.genres.map((genre) => <span class="tag" key={genre}>{genre}</span>)}</div> : null}
            </>}
          </section>

          <section class="panel-card trailer-card">
            <div class="section-head"><h2 class="section-title">Trailer</h2></div>
            <div class="trailer-list">{details?.trailerUrl ? <a class="trailer-button" href={details.trailerUrl} target="_blank" rel="noreferrer">Open trailer <Share2 aria-hidden="true" /></a> : <span class="empty-row">No trailer available.</span>}</div>
          </section>

          <section class="panel-card characters-card">
            <div class="character-head"><h2 class="section-title">Characters</h2>{showCharacterToggle ? <button class="character-view-all" type="button" aria-expanded={charactersExpanded} aria-label={charactersExpanded ? 'Show fewer characters' : 'View all characters'} onClick={() => setCharactersExpanded((value) => !value)}>{charactersExpanded ? 'show less' : 'view all'} {charactersExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}</button> : null}</div>
            {isLoading ? <CharacterSkeleton /> : <div class="character-list">
              {visibleCast.map((person) => <div class="character-row" key={person.id}><span class="avatar">{person.imageUrl ? <img src={person.imageUrl} alt="" /> : person.name.slice(0, 2).toUpperCase()}</span><span><span class="character-name">{person.character ?? person.name}</span><span class="actor-name">{person.name}</span></span></div>)}
              {!error && !details?.cast?.length ? <span class="empty-row">No character data available.</span> : null}
            </div>}
          </section>
        </aside>
      </div>
    </main>
  );
}

export function WatchPage() {
  const route = parseWatchRoute();
  if (!route.isValid) return <InvalidWatchRoute />;

  return <ValidWatchPage id={route.id} type={route.type} />;
}
