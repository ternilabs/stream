import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { apiClient } from '../lib/api-client';
import { getSearchWithCache } from '../lib/queries';
import { MediaItem } from '../lib/types';
import { MediaCard } from '../components/media-card';
import { ApiErrorMessage, StateMessage } from '../components/state-message';
import { SearchBox } from '../components/search-box';
import { Search, Sliders } from 'preact-feather';

export function SearchPage() {
  const { route } = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(undefined);
    getSearchWithCache(apiClient, { q: query, page: 1 })
      .then((response) => setItems(response.results))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <main class="browse-page">
      <div class="browse-shell">
      <SearchBox initialQuery={initialQuery} onSearch={(nextQuery) => { setQuery(nextQuery); route(`/search?q=${encodeURIComponent(nextQuery)}`); }} onSelect={(item) => route(`/watch/${item.id}?type=${item.type}`)} />
      <div class="browse-search-row" aria-label="Browse filters">
        <label class="browse-search-box"><Search aria-hidden="true" /><input value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search the catalog..." /></label>
        <button class="browse-advanced-toggle" type="button" disabled><Sliders aria-hidden="true" />Advanced</button>
      </div>
      {loading ? <StateMessage title="Searching" /> : null}
      {error ? <ApiErrorMessage error={error} /> : null}
      {!loading && !error && query && items.length === 0 ? <StateMessage title="No results" /> : null}
      <section class="browse-grid" aria-label="Search results">
        {items.map((item) => <MediaCard key={`${item.type}-${item.id}`} item={item} />)}
      </section>
      </div>
    </main>
  );
}
