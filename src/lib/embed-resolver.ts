import { MediaType, SourceDefinition } from './types';

interface ResolveEmbedInput {
  type: MediaType;
  id: number;
  season?: number;
  episode?: number;
}

export function resolveEmbedUrl(source: SourceDefinition, input: ResolveEmbedInput): string {
  const template = input.type === 'movie' ? source.movieTemplate : source.tvTemplate;
  return template
    .replaceAll('{id}', String(input.id))
    .replaceAll('{season}', String(input.season ?? 1))
    .replaceAll('{episode}', String(input.episode ?? 1));
}
