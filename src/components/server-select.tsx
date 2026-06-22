import { useEffect, useRef, useState } from 'preact/hooks';
import { ChevronDown } from 'preact-feather';
import { SourceWithHealth } from '../lib/types';

export function ServerSelect({ sources, value, onChange }: { sources: SourceWithHealth[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = sources.find((source) => source.id === value) ?? sources[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div class={`server-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button class="server-select-button" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((next) => !next)}>
        <span>{selected.name}</span><ChevronDown aria-hidden="true" />
      </button>
      <div class="server-menu" role="listbox" aria-label="Server list">
        {sources.map((source) => (
          <button class={`server-option ${source.id === value ? 'is-selected' : ''}`} type="button" role="option" aria-selected={source.id === value} key={source.id} onClick={() => { onChange(source.id); setOpen(false); }}>
            <span class="radio" /><span>{source.name}</span><span class={`status-dot ${source.health === 'down' ? 'is-down' : ''}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
