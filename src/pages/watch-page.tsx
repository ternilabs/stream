import { useEffect, useRef, useState } from 'preact/hooks';
import { useLocation, useRoute } from 'preact-iso';
import { ChevronDown, ChevronUp, Share2, Star, User } from 'preact-feather';
import { apiClient } from '../lib/api-client';
import { resolveEmbedUrl } from '../lib/embed-resolver';
import { getTitleWithCache } from '../lib/queries';
import { MediaType, TitleDetails, TvSeasonSummary } from '../lib/types';
import { ApiErrorMessage, InvalidWatchLinkState, ServersUnavailableState } from '../components/state-message';
import { useSourceHealth } from '../hooks/use-source-health';
import { MediaCard } from '../components/media-card';
import { SkeletonCardGrid } from '../components/skeleton-card';
import { SeasonEpisodePicker } from '../components/season-episode-picker';
import { ServerSelect } from '../components/server-select';

const PLAYER_IFRAME_PERMISSIONS = {
  allow: 'autoplay; fullscreen *; picture-in-picture; encrypted-media',
  allowFullScreen: true,
  webkitallowfullscreen: 'true',
  mozallowfullscreen: 'true',
} as const;

/** claude-opus-5: Matches the twelve recommendations the loaded page renders, so the grid does not resize on load. */
const RECOMMENDATION_COUNT = 12;

type WatchRoute =
  | { isValid: true; id: number; type: MediaType }
  | { isValid: false };

function parseWatchRoute(rawId: string | undefined, rawType: string | undefined): WatchRoute {
  const id = Number(rawId);

  if (!rawId || !Number.isInteger(id) || id <= 0) return { isValid: false };
  if (rawType !== undefined && rawType !== 'movie' && rawType !== 'tv') return { isValid: false };

  return { isValid: true, id, type: rawType === 'tv' ? 'tv' : 'movie' };
}

function getValidTvSelection(seasons: TvSeasonSummary[] | undefined, season: number, episode: number) {
  const firstSeason = seasons?.[0];
  if (!firstSeason) return undefined;
  const selectedSeason = seasons.find((item) => item.seasonNumber === season) ?? firstSeason;
  const selectedEpisode = selectedSeason.episodes.find((item) => item.episodeNumber === episode) ?? selectedSeason.episodes[0];
  if (!selectedEpisode) return undefined;
  return { season: selectedSeason.seasonNumber, episode: selectedEpisode.episodeNumber };
}

function watchUrl(id: number, type: MediaType, season?: number, episode?: number): string {
  const next = new URLSearchParams();
  next.set('type', type);
  if (type === 'tv' && season && episode) {
    next.set('season', String(season));
    next.set('episode', String(episode));
  }
  return `/watch/${id}?${next.toString()}`;
}

/**
 * claude-opus-5: Mirrors the loaded detail card's own containers so the panel keeps its height when
 * content arrives. Using the real class names is what keeps the two in step.
 */
function DetailSkeleton() {
  return (
    <div class="detail-skeleton" role="status" aria-label="Loading title details">
      <div class="detail-top">
        <div class="detail-poster watch-skeleton" />
        <div class="detail-facts-skeleton">
          <span class="watch-skeleton line wide" />
          <span class="watch-skeleton line" />
          <span class="watch-skeleton line short" />
          <span class="watch-skeleton line short" />
        </div>
      </div>
      <div class="summary-box">
        <div class="summary-skeleton-lines">
          <span class="watch-skeleton line wide" />
          <span class="watch-skeleton line wide" />
          <span class="watch-skeleton line wide" />
          <span class="watch-skeleton line short" />
        </div>
        <span class="see-more watch-skeleton" />
      </div>
      <div class="tag-list">
        <span class="tag watch-skeleton" />
        <span class="tag watch-skeleton" />
      </div>
    </div>
  );
}

function TrailerSkeleton() {
  return <span class="trailer-button watch-skeleton" role="status" aria-label="Loading trailer" />;
}

function CharacterSkeleton() {
  return (
    <div class="character-list" role="status" aria-label="Loading characters">
      {Array.from({ length: 4 }, (_, index) => (
        <div class="character-row" key={index}>
          <span class="avatar watch-skeleton" />
          <span class="watch-skeleton-lines">
            <span class="watch-skeleton line" />
            <span class="watch-skeleton line short" />
          </span>
        </div>
      ))}
    </div>
  );
}

function ValidWatchPage({ id, type, initialSeason, initialEpisode }: { id: number; type: MediaType; initialSeason: number; initialEpisode: number }) {
  const { route } = useLocation();
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const [charactersExpanded, setCharactersExpanded] = useState(false);
  const sourceHealth = useSourceHealth();
  const sources = sourceHealth.sources;
  const availableSources = sourceHealth.availableSources;
  const [sourceId, setSourceId] = useState('');
  const [details, setDetails] = useState<TitleDetails>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(true);
  const source = availableSources.find((item) => item.id === sourceId) ?? availableSources[0];
  const validTvSelection = type === 'tv' ? getValidTvSelection(details?.seasons, season, episode) : undefined;
  const canRenderPlayer = Boolean(source) && (type === 'movie' || Boolean(validTvSelection));
  const embedUrl = canRenderPlayer ? resolveEmbedUrl(source, { type, id, season: validTvSelection?.season ?? season, episode: validTvSelection?.episode ?? episode }) : undefined;
  const sourcesUnavailable = sourceHealth.isUnavailable || (!sourceHealth.isLoading && availableSources.length === 0);
  const isPlayerPending = isLoading || sourceHealth.isLoading;
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
    if (!availableSources.length) {
      setSourceId('');
      return;
    }
    if (!availableSources.some((item) => item.id === sourceId)) {
      setSourceId(availableSources[0].id);
    }
  }, [availableSources, sourceId]);

  useEffect(() => {
    if (type !== 'tv' || !details) return;
    const validSelection = getValidTvSelection(details.seasons, season, episode);
    if (!validSelection) return;
    if (validSelection.season !== season || validSelection.episode !== episode) {
      setSeason(validSelection.season);
      setEpisode(validSelection.episode);
      route(watchUrl(id, type, validSelection.season, validSelection.episode), true);
    }
  }, [details, episode, id, route, season, type]);

  function updateEpisode(nextSeason: number, nextEpisode: number) {
    setSeason(nextSeason);
    setEpisode(nextEpisode);
    route(watchUrl(id, type, nextSeason, nextEpisode), true);
  }

  if (error) return <main class="invalid-response-shell"><ApiErrorMessage error={error} /></main>;

  return (
    <main>
      <div class="wrap detail-shell">
        <div class="left-panel">
          <section class="player-card" aria-label="Player area">
            <div class="player-placeholder">
              {sourcesUnavailable
                ? <ServersUnavailableState compact />
                : embedUrl
                  ? <iframe class="player-frame" src={embedUrl} title={details?.title ?? 'Selected stream source'} {...PLAYER_IFRAME_PERMISSIONS} />
                  : isPlayerPending
                    ? <div class="player-loading" role="status" aria-label="Loading player" />
                    : <div class="blocked-player">{type === 'tv' ? 'Episodes are unavailable until valid season data exists.' : 'This title is unavailable on the selected server.'}</div>}
            </div>
            <div class="player-controls">
              <div class="now-row">
                <div class="now-copy"><span class="kicker">Now playing</span><span class="now-title">{details?.title ?? (isLoading ? 'Loading title...' : `Title ${id}`)}{type === 'tv' && validTvSelection ? ` S${validTvSelection.season} E${validTvSelection.episode}` : ''}</span></div>
                {sourcesUnavailable ? null : <ServerSelect sources={sources} value={sourceId} loading={sourceHealth.isLoading} onChange={setSourceId} />}
              </div>
              {type === 'tv' ? <SeasonEpisodePicker seasons={details?.seasons ?? []} season={validTvSelection?.season ?? season} episode={validTvSelection?.episode ?? episode} onChange={updateEpisode} /> : null}
              <div class="note-line">Please try different servers if one isn't working, and consider using ad blockers or the Brave browser.</div>
            </div>
          </section>

          <section class="panel-card recommendation" aria-label="Recommendations">
            <div class="section-head"><h2 class="section-title">Recommendation</h2></div>
            {isLoading ? <SkeletonCardGrid count={RECOMMENDATION_COUNT} className="reco-grid" label="Loading recommendations" /> : <div class="reco-grid">
              {(details?.recommended ?? []).slice(0, RECOMMENDATION_COUNT).map((item) => <MediaCard item={item} key={`${item.type}-${item.id}`} />)}
              {!error && !details?.recommended?.length ? <div class="empty-row">No recommendations available.</div> : null}
            </div>}
          </section>
        </div>

        <aside class="right-panel">
          <section class="panel-card detail-card">
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
            <div class="trailer-list">
              {isLoading
                ? <TrailerSkeleton />
                : details?.trailerUrl
                  ? <a class="trailer-button" href={details.trailerUrl} target="_blank" rel="noreferrer">Open trailer <Share2 aria-hidden="true" /></a>
                  : <span class="empty-row">No trailer available.</span>}
            </div>
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
  const { params, query } = useRoute();
  const route = parseWatchRoute(params.id, query.type);

  if (!route.isValid) return <main class="invalid-response-shell"><InvalidWatchLinkState /></main>;

  return (
    <ValidWatchPage
      key={`${route.type}-${route.id}`}
      id={route.id}
      type={route.type}
      initialSeason={Number(query.season) || 1}
      initialEpisode={Number(query.episode) || 1}
    />
  );
}
