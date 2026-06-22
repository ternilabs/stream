import { useState } from 'preact/hooks';
import { SettingsDialog } from './settings-dialog';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';

export function Nav() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <header class="topbar">
      <a class="brand" href="/">TerniLabs</a>
      <nav aria-label="Primary"><a href="/search">Search</a></nav>
      <button type="button" onClick={() => setSettingsOpen(true)}>Settings</button>
      <SettingsDialog open={settingsOpen} sources={mergeSourceHealth(SOURCES)} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
