import { SourceWithHealth } from '../lib/types';

export function ServerSelect({ sources, value, onChange }: { sources: SourceWithHealth[]; value: string; onChange: (id: string) => void }) {
  return (
    <label class="field">Server
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {sources.map((source) => <option key={source.id} value={source.id}>{source.name} ({source.health})</option>)}
      </select>
    </label>
  );
}
