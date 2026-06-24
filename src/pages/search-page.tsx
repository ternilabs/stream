import { useEffect, useRef, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { Loader, Search } from 'preact-feather';
import { apiClient } from '../lib/api-client';
import { getSearchWithCache } from '../lib/queries';
import { MediaItem } from '../lib/types';
import { MediaCard } from '../components/media-card';
import { ApiErrorMessage, StateMessage } from '../components/state-message';

type SearchType = 'multi' | 'tv' | 'movie';

function normalizeSearchType(value: string | null): SearchType {
  return value === 'tv' || value === 'movie' ? value : 'multi';
}

function searchUrl(query: string, type: SearchType) {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('type', type);
  return `/search?${params.toString()}`;
}

export function SearchPage() {
  const { route } = useLocation();
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q')?.trim() ?? '';
  const initialType = normalizeSearchType(params.get('type'));
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchType>(initialType);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setItems([]);
      setError(undefined);
      setLoading(false);
      return;
    }

    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setItems([]);
    setError(undefined);
    setLoading(true);

    getSearchWithCache(apiClient, { q: trimmed, page: 1, type })
      .then((response) => {
        if (requestId.current === currentRequest) setItems(response.results);
      })
      .catch((nextError) => {
        if (requestId.current === currentRequest) setError(nextError);
      })
      .finally(() => {
        if (requestId.current === currentRequest) setLoading(false);
      });
  }, [query, type]);

  function submitSearch(nextQuery = draftQuery, nextType = type) {
    const trimmed = nextQuery.trim();
    setDraftQuery(trimmed);
    setQuery(trimmed);
    if (trimmed) route(searchUrl(trimmed, nextType));
  }

  function changeType(nextType: SearchType) {
    setType(nextType);
    const trimmed = draftQuery.trim();
    if (trimmed) {
      setQuery(trimmed);
      route(searchUrl(trimmed, nextType));
    }
  }

  return (
    <main class="browse-page">
      <div class="browse-shell">
        <form class="browse-search-row" role="search" aria-label="Search catalog" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
          <label class="browse-search-box">
            {loading ? <Loader class="search-spinner" aria-hidden="true" data-testid="search-loading-icon" /> : <Search aria-hidden="true" />}
            <input value={draftQuery} onInput={(event) => setDraftQuery(event.currentTarget.value)} placeholder="Search the catalog..." />
          </label>
          <label class="browse-type-select">
            <span class="sr-only">Media type</span>
            <select aria-label="Media type" value={type} onChange={(event) => changeType(event.currentTarget.value as SearchType)}>
              <option value="multi">All</option>
              <option value="tv">TV</option>
              <option value="movie">Movie</option>
            </select>
          </label>
        </form>
        {error ? <ApiErrorMessage error={error} /> : null}
        {!loading && !error && query && items.length === 0 ? <StateMessage title="No results" /> : null}
        <section class="browse-grid" aria-label="Search results">
          {items.map((item) => <MediaCard key={`${item.type}-${item.id}`} item={item} />)}
        </section>
      </div>
    </main>
  );
}
