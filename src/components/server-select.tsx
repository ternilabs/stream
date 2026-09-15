import { SelectMenu } from './select-menu';
import { SourceWithHealth } from '../lib/types';

// claude-opus-5: Takes `loading` so the dropdown reads "Loading servers…" while health is in
// flight. It previously showed "No servers available", asserting a negative before the answer
// was known.
export function ServerSelect({ sources, value, loading = false, onChange }: { sources: SourceWithHealth[]; value: string; loading?: boolean; onChange: (id: string) => void }) {
  const selected = sources.find((source) => source.id === value) ?? sources[0];

  return (
    <SelectMenu
      label="Server"
      value={selected?.id ?? ''}
      options={sources.map((source) => ({
        value: source.id,
        label: source.name,
        disabled: source.health === 'down',
        decoration: <span class={`status-dot ${source.health === 'down' ? 'is-down' : ''}`} />,
      }))}
      emptyLabel={loading ? 'Loading servers…' : 'No servers available'}
      onChange={onChange}
    />
  );
}
