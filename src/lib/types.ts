export type MediaType = 'movie' | 'tv';
export type ApiListKind = 'movies' | 'tv';
export type SourceHealthStatus = 'up' | 'down' | 'unknown';

export interface ApiErrorEnvelope {
  error: { code: string; message: string };
}

export interface ApiSearchParams {
  q: string;
  page?: number;
  type?: MediaType | 'multi';
  limit?: number;
}

export interface MediaItem {
  id: number;
  type: MediaType;
  title: string;
  year?: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  rating?: number;
}

export interface PagedMediaResponse {
  page: number;
  totalPages: number;
  results: MediaItem[];
}

export interface SourceHealthApiItem {
  id: string;
  name: string;
  isUp: boolean;
}

export interface SourceHealthApiResponse {
  checkedAt: string | null;
  sources: SourceHealthApiItem[];
}

export interface SourceDefinition {
  id: string;
  name: string;
  movieTemplate: string;
  tvTemplate: string;
}

export interface SourceWithHealth extends SourceDefinition {
  health: SourceHealthStatus;
  checkedAt?: string | null;
}

export interface TvSeasonSummary {
  seasonNumber: number;
  title: string;
  episodeCount: number;
  episodes: Array<{
    episodeNumber: number;
    title: string;
    aired: string | null;
  }>;
}

export interface TitleDetails extends MediaItem {
  genres?: string[];
  runtimeMinutes?: number;
  trailerUrl?: string;
  production?: string[];
  seasons?: TvSeasonSummary[];
  cast?: Array<{ id: number; name: string; character?: string; imageUrl?: string }>;
  recommended?: MediaItem[];
}

export type ApiFailureKind = 'bad-request' | 'not-found' | 'rate-limited' | 'upstream' | 'server' | 'network';

export class ApiFailure extends Error {
  constructor(
    public readonly kind: ApiFailureKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiFailure';
  }
}
