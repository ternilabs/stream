import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';
import { setViewportWidth } from '../test/match-media';
import { MediaItem } from '../lib/types';
import { getTopRatedWithCache, getTrendingWithCache } from '../lib/queries';

vi.mock('../lib/queries', () => ({
  getTrendingWithCache: vi.fn(() => Promise.resolve({ page: 1, totalPages: 1, results: [] })),
  getTopRatedWithCache: vi.fn(() => Promise.resolve({ page: 1, totalPages: 1, results: [] })),
}));

const mockedGetTrendingWithCache = vi.mocked(getTrendingWithCache);
const mockedGetTopRatedWithCache = vi.mocked(getTopRatedWithCache);

function makeItems(prefix: string, type: MediaItem['type']): MediaItem[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    type,
    title: `${prefix} ${index + 1}`,
  }));
}

describe('HomePage', () => {
  beforeEach(() => {
    mockedGetTrendingWithCache.mockReset();
    mockedGetTopRatedWithCache.mockReset();
    mockedGetTrendingWithCache.mockImplementation((_client, kind) => Promise.resolve({
      page: 1,
      totalPages: 1,
      results: makeItems(kind === 'movies' ? 'Trending Movie' : 'Trending TV', kind === 'movies' ? 'movie' : 'tv'),
    }));
    mockedGetTopRatedWithCache.mockImplementation((_client, kind) => Promise.resolve({
      page: 1,
      totalPages: 1,
      results: makeItems(kind === 'movies' ? 'Top Movie' : 'Top TV', kind === 'movies' ? 'movie' : 'tv'),
    }));
  });

  it('renders skeleton media sections while home lists are loading', () => {
    setViewportWidth(1200);
    mockedGetTrendingWithCache.mockImplementation(() => new Promise<never>(() => undefined));
    mockedGetTopRatedWithCache.mockImplementation(() => new Promise<never>(() => undefined));

    render(<HomePage />);

    expect(screen.queryByText('Loading metadata')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Trending Movies' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Previous Trending Movies' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next Trending Movies' })).toBeDisabled();
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(24);
  });

  it('renders the shared failed-fetch state when home metadata fails', async () => {
    mockedGetTrendingWithCache.mockRejectedValue(new Error('network'));

    render(<HomePage />);

    const state = await screen.findByRole('status', { name: 'Something went wrong' });
    expect(state).toHaveClass('invalid-response-state');
    expect(screen.getByText('We couldn’t retrieve the data from the server. Please refresh the page or try again later.')).toBeInTheDocument();
  });

  it('passes the API returned 20-item lists through to media sections', async () => {
    setViewportWidth(1200);
    render(<HomePage />);

    await waitFor(() => expect(screen.getByRole('link', { name: 'Watch Trending Movie 1' })).toBeInTheDocument());

    const trendingMovies = screen.getByRole('region', { name: 'Trending Movies' });
    expect(within(trendingMovies).getAllByRole('article')).toHaveLength(6);
    expect(within(trendingMovies).getByRole('link', { name: 'Watch Trending Movie 1' })).toBeInTheDocument();
    expect(within(trendingMovies).queryByRole('link', { name: 'Watch Trending Movie 20' })).not.toBeInTheDocument();

    fireEvent.click(within(trendingMovies).getByRole('button', { name: 'Next Trending Movies' }));
    fireEvent.click(within(trendingMovies).getByRole('button', { name: 'Next Trending Movies' }));
    fireEvent.click(within(trendingMovies).getByRole('button', { name: 'Next Trending Movies' }));

    expect(within(trendingMovies).getByRole('link', { name: 'Watch Trending Movie 19' })).toBeInTheDocument();
    expect(within(trendingMovies).getByRole('link', { name: 'Watch Trending Movie 20' })).toBeInTheDocument();
  });
});
