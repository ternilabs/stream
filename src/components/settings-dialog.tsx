import { useEffect, useState } from 'preact/hooks';
import { X } from 'preact-feather';
import { clearAppStorage } from '../lib/local-store';
import { SourceWithHealth } from '../lib/types';
import { SERVERS_UNAVAILABLE } from './state-message';

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

  // claude-opus-5: `body.modal-open { overflow: hidden }` already existed in the stylesheet but
  // nothing ever set the class, so the page scrolled behind the dialog while the mobile search
  // overlay correctly locked it. This restores the intended behaviour.
  useEffect(() => {
    document.body.classList.toggle('modal-open', open);
    return () => document.body.classList.remove('modal-open');
  }, [open]);

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
            <div class="server-unavailable" role="status" aria-labelledby="server-unavailable-title">
              {/* claude-opus-5: Copy now comes from the shared constant; it used to be typed out
                  a second time here and could drift from the full-page state. */}
              <h3 id="server-unavailable-title">{SERVERS_UNAVAILABLE.title}</h3>
              <p>{SERVERS_UNAVAILABLE.detail}</p>
            </div>
          ) : (
            <div class="server-list" aria-label="Server status list">
              {sources.map((source) => (
                <div class="server-row" key={source.id}>
                  <span class="server-name">{source.name}</span>
                  <span class={`server-status ${source.health === 'up' ? 'online' : ''}`}><span class="status-dot" />{source.health === 'up' ? 'Online' : source.health === 'down' ? 'Down' : 'Unknown'}</span>
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
