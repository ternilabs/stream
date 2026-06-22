import { SourceDefinition, SourceHealthApiResponse, SourceWithHealth } from './types';

export function mergeSourceHealth(sources: SourceDefinition[], api?: SourceHealthApiResponse): SourceWithHealth[] {
  const healthById = new Map(api?.sources.map((source) => [source.id, source]));
  return sources.map((source) => {
    const health = healthById.get(source.id);
    return {
      ...source,
      health: health ? (health.isUp ? 'up' : 'down') : 'unknown',
      checkedAt: health ? api?.checkedAt : undefined,
    };
  });
}
