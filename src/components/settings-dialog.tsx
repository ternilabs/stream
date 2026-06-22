import { useEffect, useState } from 'preact/hooks';
import { clearAppStorage } from '../lib/local-store';
import { SourceWithHealth } from '../lib/types';

export function SettingsDialog({ open, sources, onClose }: { open: boolean; sources: SourceWithHealth[]; onClose: () => void }) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (confirmingClear) setConfirmingClear(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmingClear, onClose, open]);
  if (!open) return null;
  if (confirmingClear) {
    return (
      <div class="backdrop" role="presentation" onClick={() => setConfirmingClear(false)}>
        <section class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="clear-storage-title" onClick={(event) => event.stopPropagation()}>
          <h2 id="clear-storage-title">Clear local storage?</h2>
          <p>This removes cached metadata, source health, recent searches, and settings saved on this device.</p>
          <div class="dialog-actions">
            <button type="button" onClick={() => setConfirmingClear(false)}>Cancel</button>
            <button type="button" class="danger-button" onClick={() => { clearAppStorage(); setConfirmingClear(false); }}>Clear storage</button>
          </div>
        </section>
      </div>
    );
  }
  return (
    <div class="backdrop" role="presentation" onClick={onClose}>
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" class="icon-button" aria-label="Close settings" onClick={onClose}>X</button>
        <h2 id="settings-title">Settings</h2>
        <p>Saved to this device. No account needed.</p>
        <h3>SERVERS</h3>
        <div class="server-list">
          {sources.map((source) => <span key={source.id}>{source.name} · {source.health}</span>)}
        </div>
        <button type="button" class="link-button" onClick={() => setConfirmingClear(true)}>Clear local storage</button>
      </section>
    </div>
  );
}
