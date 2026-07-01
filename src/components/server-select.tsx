import { SelectMenu } from './select-menu';
import { SourceWithHealth } from '../lib/types';

export function ServerSelect({ sources, value, onChange }: { sources: SourceWithHealth[]; value: string; onChange: (id: string) => void }) {
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
      emptyLabel="No servers available"
      onChange={onChange}
    />
  );
}
