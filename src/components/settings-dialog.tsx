import { useEffect, useState } from 'preact/hooks';
import { X } from 'preact-feather';
import { clearAppStorage } from '../lib/local-store';
import { SourceWithHealth } from '../lib/types';
import { ServersUnavailableState } from './state-message';

export function SettingsDialog({ open, sources, sourcesUnavailable, onClose }: { open: boolean; sources: SourceWithHealth[]; sourcesUnavailable: boolean; onClose: () => void }) {
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
      <div class="alert-backdrop is-open" role="presentation" onClick={() => setConfirmingClear(false)}>
        <section class="alert-dialog" role="alertdialog" aria-modal="true" aria-labelledby="clear-storage-title" onClick={(event) => event.stopPropagation()}>
          <h2 class="alert-title" id="clear-storage-title">Clear local storage?</h2>
          <p class="alert-copy">This removes cached metadata, source health, recent searches, and settings saved on this device.</p>
          <div class="alert-actions">
            <button type="button" onClick={() => setConfirmingClear(false)}>Cancel</button>
            <button type="button" class="danger" onClick={() => { clearAppStorage(); setConfirmingClear(false); onClose(); }}>Clear storage</button>
          </div>
        </section>
      </div>
    );
  }
  return (
    <div class="modal-backdrop is-open" role="presentation" onClick={onClose}>
      <section class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
        <div class="dialog-head">
          <div><h2 class="dialog-title" id="settings-title">Settings</h2><div class="dialog-note">Saved to this device. No account needed.</div></div>
          <button type="button" class="close-dialog" aria-label="Close settings" onClick={onClose}><X aria-hidden="true" /></button>
        </div>
        <div class="dialog-body">
          <div class="server-head"><span class="eyebrow">Servers</span></div>
          {sourcesUnavailable ? (
            <ServersUnavailableState compact />
          ) : (
            <div class="server-list" aria-label="Server status list">
              {sources.map((source) => (
                <div class="server-row" key={source.id}>
                  <span class="server-name">{source.name}</span>
                  <span class={`server-status ${source.health === 'up' ? 'online' : ''}`}><span class="status-dot" />{source.health === 'up' ? 'Online' : 'Down'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div class="dialog-foot">
          <button type="button" class="clear-storage" onClick={() => setConfirmingClear(true)}>Clear local storage</button>
        </div>
      </section>
    </div>
  );
}
