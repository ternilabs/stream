import { useEffect, useRef, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { Loader, Search } from 'preact-feather';
import { apiClient } from '../lib/api-client';
import { getSearchWithCache } from '../lib/queries';
import { MediaItem } from '../lib/types';
import { MediaCard } from '../components/media-card';
import { ApiErrorMessage, StateMessage } from '../components/state-message';
import { SelectMenu } from '../components/select-menu';

type SearchType = 'multi' | 'tv' | 'movie';

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

    getSearchWithCache(apiClient, { q: trimmed, page, type })
      .then((response) => {
        if (requestId.current === currentRequest) {
          setItems(response.results);
          setCurrentPage(response.page ?? 1);
          setTotalPages(response.totalPages ?? 1);
        }
      })
      .catch((nextError) => {
        if (requestId.current === currentRequest) setError(nextError);
      })
      .finally(() => {
        if (requestId.current === currentRequest) setLoading(false);
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

  function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
    const pages = new Set([1, total, current, current - 1, current + 1]);
    const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    const result: (number | 'ellipsis')[] = [];
    let previous = 0;
    for (const p of sorted) {
      if (p - previous > 1) result.push('ellipsis');
      result.push(p);
      previous = p;
    }
    return result;
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
        {error ? <ApiErrorMessage error={error} /> : null}
        {!loading && !error && query && items.length === 0 ? <StateMessage title="No results" /> : null}
        <section class="browse-grid" aria-label="Search results">
          {items.map((item) => <MediaCard key={`${item.type}-${item.id}`} item={item} />)}
        </section>
        {query && totalPages > 1 ? (
          <nav class="browse-pagination" aria-label="Pagination">
            <button class="browse-page-button" type="button" aria-label="First page" disabled={currentPage <= 1} onClick={() => goToPage(1)}>«</button>
            <button class="browse-page-button" type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>‹</button>
            {pageWindow(currentPage, totalPages).map((item, index) => {
              if (item === 'ellipsis') return <span class="browse-page-button" aria-hidden="true" key={`e${index}`}>…</span>;
              return <button class={`browse-page-button${item === currentPage ? ' is-active' : ''}`} type="button" aria-label={`Page ${item}`} aria-current={item === currentPage ? 'page' : undefined} key={item} onClick={() => goToPage(item as number)}>{item}</button>;
            })}
            <button class="browse-page-button" type="button" aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>›</button>
            <button class="browse-page-button" type="button" aria-label="Last page" disabled={currentPage >= totalPages} onClick={() => goToPage(totalPages)}>»</button>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
