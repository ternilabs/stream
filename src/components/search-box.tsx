import { useEffect, useState } from 'preact/hooks';
import { ArrowRight, Clock, Search } from 'preact-feather';
import { apiClient } from '../lib/api-client';
import { getSearchWithCache } from '../lib/queries';
import { MediaItem } from '../lib/types';

const RECENTS_KEY = 'stream:recent-searches';

function readRecents(): string[] {
  try {
    const value = localStorage.getItem(RECENTS_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

function writeRecents(values: string[]) {
  localStorage.setItem(RECENTS_KEY, JSON.stringify(values.slice(0, 5)));
}

function labelFor(item: MediaItem) {
  return [item.type.toUpperCase(), item.year].filter(Boolean).join(' - ');
}

function fallbackThumbLabel(item: MediaItem) {
  return item.type === 'movie' ? 'MV' : 'TV';
}

export function rememberSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = readRecents().filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
  writeRecents([trimmed, ...existing]);
}

export function SearchBox({ initialQuery, onSearch, onSelect, onClose }: { initialQuery: string; onSearch: (query: string) => void; onSelect?: (item: MediaItem) => void; onClose?: () => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [recents, setRecents] = useState<string[]>(readRecents());
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setResults([]);
    setLoading(true);
    const timeout = window.setTimeout(() => {
      getSearchWithCache(apiClient, { q: trimmed, page: 1, limit: 6 })
        .then((response) => {
          if (!cancelled) setResults(response.results.slice(0, 6));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  function submit(nextQuery = query) {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;
    rememberSearch(trimmed);
    setRecents(readRecents());
    onSearch(trimmed);
  }

  function clearRecents() {
    writeRecents([]);
    setRecents([]);
  }

  function removeRecent(value: string) {
    const next = recents.filter((item) => item !== value);
    writeRecents(next);
    setRecents(next);
  }

  const trimmedQuery = query.trim();
  const showingResults = trimmedQuery.length >= 2;
  const showingRecents = !showingResults && recents.length > 0;

  return (
    <div class="search-wrap">
      <form class="search" aria-label="Search" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <Search aria-hidden="true" />
        <input value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search any title..." autocomplete="off" />
        {onClose ? <button class="mobile-search-close" type="button" aria-label="Close search" onClick={onClose}>x</button> : null}
      </form>

      <div class={`search-panel ${showingRecents || showingResults ? '' : 'is-empty'}`} aria-label="Search suggestions">
        {showingRecents && (
          <div class="search-mode is-active">
            <div class="search-panel-head">
              <span class="search-label">Recent Searches</span>
              <button class="clear-btn" type="button" onClick={clearRecents}>Clear all</button>
            </div>
            {recents.map((recent) => (
              <button class="recent-row" type="button" key={recent} onClick={() => { setQuery(recent); submit(recent); }}>
                <Clock aria-hidden="true" />
                <span class="recent-title">{recent}</span>
                <span
                  aria-label={`Remove ${recent} from recent searches`}
                  class="remove-recent"
                  role="button"
                  tabIndex={0}
                  onClick={(event) => { event.stopPropagation(); removeRecent(recent); }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      removeRecent(recent);
                    }
                  }}
                >x</span>
              </button>
            ))}
          </div>
        )}

        <div class={`search-mode ${showingResults ? 'is-active' : ''}`}>
          <div class="search-panel-head"><span class="search-label">Results</span></div>
          <div class="result-list">
            {loading ? (
              <div class="search-message">
                <span class="search-message-title">Searching for "{trimmedQuery}"</span>
                <span class="search-message-copy">Checking the catalog...</span>
              </div>
            ) : null}
            {!loading && results.length === 0 ? (
              <div class="search-message">
                <span class="search-message-title">No matches for "{trimmedQuery}"</span>
                <span class="search-message-copy">Try a different title, actor, or genre.</span>
              </div>
            ) : null}
            {results.map((item) => (
              <button class="result-row" type="button" key={`${item.type}-${item.id}`} onClick={() => { rememberSearch(trimmedQuery); onSelect?.(item); }}>
                <span class={`thumb ${item.posterUrl ? 'has-image' : ''}`} aria-hidden={item.posterUrl ? 'true' : undefined}>
                  {item.posterUrl ? <img src={item.posterUrl} alt="" /> : fallbackThumbLabel(item)}
                </span>
                <span class="result-copy"><span class="result-title">{item.title}</span><span class="result-meta">{labelFor(item)}</span></span>
                <span class="result-rating">{item.rating ? `★ ${item.rating.toFixed(1)}` : 'OPEN'}</span>
              </button>
            ))}
          </div>
          {!loading && results.length > 0 ? <button class="view-all" type="button" onClick={() => submit(trimmedQuery)}><span>View all results for <strong>{`"${trimmedQuery}"`}</strong></span><ArrowRight aria-hidden="true" /></button> : null}
        </div>
      </div>
    </div>
  );
}
