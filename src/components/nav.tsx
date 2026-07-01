import { useEffect, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { Search, Settings } from 'preact-feather';
import { SettingsDialog } from './settings-dialog';
import { SearchBox } from './search-box';
import { useSourceHealth } from '../hooks/use-source-health';

export function Nav() {
  const { path, route: navigate } = useLocation();
  const isSearchPage = path === '/search';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sourceHealth = useSourceHealth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (isSearchPage) setSearchOpen(false);
  }, [isSearchPage]);

  useEffect(() => {
    document.body.classList.toggle('mobile-search-open', searchOpen);
    return () => document.body.classList.remove('mobile-search-open');
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);

  return (
    <>
    <header class={`nav${isSearchPage ? ' is-search-page' : ''}`}>
      <div class="wrap nav-inner">
        <a class="brand" href="/">TerniLabs</a>
        {!isSearchPage ? <button type="button" class="mobile-search-button" aria-label="Open search" aria-expanded={searchOpen} onClick={() => setSearchOpen(true)}><Search aria-hidden="true" /></button> : null}
        {!isSearchPage ? (
          <div class={searchOpen ? 'is-mobile-open' : ''}>
            <SearchBox
              initialQuery=""
              onClose={() => setSearchOpen(false)}
              onSearch={(query) => { navigate(`/search?q=${encodeURIComponent(query)}`); setSearchOpen(false); }}
              onSelect={(item) => { navigate(`/watch/${item.id}?type=${item.type}`); setSearchOpen(false); }}
            />
          </div>
        ) : null}
        <div class="nav-actions">
          <button type="button" class="icon-button" aria-label="Settings" onClick={() => setSettingsOpen(true)}><Settings aria-hidden="true" /></button>
        </div>
      </div>
      <SettingsDialog open={settingsOpen} sources={sourceHealth.sources} sourcesUnavailable={sourceHealth.isUnavailable} onClose={() => setSettingsOpen(false)} />
    </header>
    <div class="mobile-search-scrim" aria-hidden="true" onClick={() => setSearchOpen(false)} />
    </>
  );
}
