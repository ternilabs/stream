import { useEffect, useRef, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { Loader, Search } from 'preact-feather';
import { apiClient } from '../lib/api-client';
import { getSearchWithCache } from '../lib/queries';
import { MediaItem } from '../lib/types';
import { MediaCard } from '../components/media-card';
import { Pagination } from '../components/pagination';
import { SkeletonCardGrid } from '../components/skeleton-card';
import { ApiErrorMessage, StateMessage } from '../components/state-message';
import { SelectMenu } from '../components/select-menu';

type SearchType = 'multi' | 'tv' | 'movie';

/** claude-opus-5: The API's search page size. Used to reserve grid height on the first query, before any result count is known. */
const SEARCH_PAGE_SIZE = 24;

function normalizeSearchType(value: string | null): SearchType {
  return value === 'tv' || value === 'movie' ? value : 'multi';
}

function searchUrl(query: string, type: SearchType, page: number) {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('type', type);
  if (page > 1) params.set('page', String(page));
  return `/search?${params.toString()}`;
}

export function SearchPage() {
  const { route } = useLocation();
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q')?.trim() ?? '';
  const initialType = normalizeSearchType(params.get('type'));
  const initialPage = Math.max(1, Number(params.get('page')) || 1);
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchType>(initialType);
  const [page, setPage] = useState(initialPage);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(initialQuery.length > 0);
  const [skeletonCount, setSkeletonCount] = useState(SEARCH_PAGE_SIZE);
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
    // claude-opus-5: One named guard instead of repeating the same nested id check in
    // three callbacks.
    const isStale = () => requestId.current !== currentRequest;
    setItems([]);
    setError(undefined);
    setLoading(true);

    getSearchWithCache(apiClient, { q: trimmed, page, type })
      .then((response) => {
        if (isStale()) return;
        setItems(response.results);
        setSkeletonCount(response.results.length || SEARCH_PAGE_SIZE);
        setCurrentPage(response.page ?? 1);
        setTotalPages(response.totalPages ?? 1);
      })
      .catch((nextError) => {
        if (isStale()) return;
        setError(nextError);
      })
      .finally(() => {
        if (isStale()) return;
        setLoading(false);
      });
  }, [query, type, page]);

  function submitSearch(nextQuery = draftQuery, nextType = type) {
    const trimmed = nextQuery.trim();
    setDraftQuery(trimmed);
    setQuery(trimmed);
    setPage(1);
    route(trimmed ? searchUrl(trimmed, nextType, 1) : '/search');
  }

  function changeType(nextType: SearchType) {
    setType(nextType);
    setPage(1);
    const trimmed = draftQuery.trim();
    if (trimmed) {
      setQuery(trimmed);
      route(searchUrl(trimmed, nextType, 1));
    }
  }

  function goToPage(nextPage: number) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setCurrentPage(nextPage);
    setPage(nextPage);
    route(searchUrl(trimmed, type, nextPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main class="browse-page">
      <div class="browse-shell">
        <form class="browse-search-row" role="search" aria-label="Search catalog" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
          <label class="browse-search-box">
            {loading ? <Loader class="search-spinner" aria-hidden="true" data-testid="search-loading-icon" /> : <Search aria-hidden="true" />}
            <input value={draftQuery} onInput={(event) => setDraftQuery(event.currentTarget.value)} placeholder="Search the catalog..." />
          </label>
          <SelectMenu
            label="Media type"
            value={type}
            options={[
              { value: 'multi', label: 'All' },
              { value: 'movie', label: 'Movie' },
              { value: 'tv', label: 'TV' },
            ]}
            onChange={(value) => changeType(normalizeSearchType(value))}
            className="browse-type-select"
          />
        </form>
        {error ? <div class="invalid-response-shell in-page"><ApiErrorMessage error={error} /></div> : null}
        {!loading && !error && query && items.length === 0 ? <StateMessage title="No results" /> : null}
        {/* claude-opus-5: The results grid had no loading state at all — it went from 0px to full
            height on arrival while home and watch both skeletoned. */}
        {loading && !error ? <SkeletonCardGrid count={skeletonCount} className="browse-grid" label="Loading search results" /> : null}
        {!loading && !error ? <section class="browse-grid" aria-label="Search results">
          {items.map((item) => <MediaCard key={`${item.type}-${item.id}`} item={item} />)}
        </section> : null}
        {!error && query && totalPages > 1
          ? <Pagination currentPage={currentPage} totalPages={totalPages} onSelect={goToPage} />
          : null}
      </div>
    </main>
  );
}
