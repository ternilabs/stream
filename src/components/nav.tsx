import { useEffect, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { Search, Settings } from 'preact-feather';
import { SettingsDialog } from './settings-dialog';
import { SearchBox } from './search-box';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';

export function Nav() {
  const { route: navigate } = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
    <header class="nav">
      <div class="wrap nav-inner">
        <a class="brand" href="/">TerniLabs</a>
        <button type="button" class="mobile-search-button" aria-label="Open search" aria-expanded={searchOpen} onClick={() => setSearchOpen(true)}><Search aria-hidden="true" /></button>
        <div class={searchOpen ? 'is-mobile-open' : ''}>
          <SearchBox
            initialQuery=""
            onClose={() => setSearchOpen(false)}
            onSearch={(query) => { navigate(`/search?q=${encodeURIComponent(query)}`); setSearchOpen(false); }}
            onSelect={(item) => { navigate(`/watch/${item.id}?type=${item.type}`); setSearchOpen(false); }}
          />
        </div>
        <div class="nav-actions">
          <button type="button" class="icon-button" aria-label="Settings" onClick={() => setSettingsOpen(true)}><Settings aria-hidden="true" /></button>
        </div>
      </div>
      <SettingsDialog open={settingsOpen} sources={mergeSourceHealth(SOURCES)} onClose={() => setSettingsOpen(false)} />
    </header>
    <div class="mobile-search-scrim" aria-hidden="true" onClick={() => setSearchOpen(false)} />
    </>
  );
}
