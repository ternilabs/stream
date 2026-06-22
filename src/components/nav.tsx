import { useEffect, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { SettingsDialog } from './settings-dialog';
import { SearchBox } from './search-box';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';

export function Nav() {
  const { route: navigate } = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);

  return (
    <header class="topbar">
      <a class="brand" href="/">TerniLabs</a>
      <nav aria-label="Primary"><a href="/search">Search</a></nav>
      <button type="button" class="mobile-search-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>Search</button>
      <button type="button" onClick={() => setSettingsOpen(true)}>Settings</button>
      {searchOpen ? (
        <div class="backdrop" role="presentation" onClick={() => setSearchOpen(false)}>
          <div class="search-overlay" role="dialog" aria-modal="true" aria-label="Search" onClick={(event) => event.stopPropagation()}>
            <SearchBox initialQuery="" onSearch={(query) => { navigate(`/search?q=${encodeURIComponent(query)}`); setSearchOpen(false); }} />
          </div>
        </div>
      ) : null}
      <SettingsDialog open={settingsOpen} sources={mergeSourceHealth(SOURCES)} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
