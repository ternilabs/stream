import { useState } from 'preact/hooks';

export function SearchBox({ initialQuery, onSearch }: { initialQuery: string; onSearch: (query: string) => void }) {
  const [query, setQuery] = useState(initialQuery);
  return (
    <form class="search-box" onSubmit={(event) => { event.preventDefault(); onSearch(query.trim()); }}>
      <label htmlFor="search-query">Search</label>
      <input id="search-query" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search movies or TV" />
      <button type="submit">Search</button>
    </form>
  );
}
