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
    expect(screen.getByText('Announcement')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Trending Movies' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Previous Trending Movies' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next Trending Movies' })).toBeDisabled();
    expect(screen.getAllByTestId('media-skeleton-card')).toHaveLength(24);
  });

  it('renders announcement title, date label, safe links, and required notices', async () => {
    setViewportWidth(1200);
    render(<HomePage />);

    await waitFor(() => expect(screen.getByText('Announcement')).toBeInTheDocument());
    expect(screen.getByText('Jun 22')).toBeInTheDocument();
    expect(screen.queryByText('Daily cache active')).not.toBeInTheDocument();

    const githubLink = screen.getByRole('link', { name: 'original GitHub repository' });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/ternilabs/stream');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    const koFiLink = screen.getByRole('link', { name: 'Ko-fi' });
    expect(koFiLink).toHaveAttribute('href', 'https://ko-fi.com/mkgpdev');
    expect(koFiLink).toHaveAttribute('target', '_blank');
    expect(koFiLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(githubLink.closest('li') as HTMLLIElement).toHaveTextContent('Report bugs or open pull requests through the original GitHub repository.');
    expect(koFiLink.closest('li') as HTMLLIElement).toHaveTextContent('Support performance improvements and independent servers through Ko-fi.');
    expect(screen.getByText('The project is intended for educational and private use only. The developer does not condone or encourage copyright infringement.')).toBeInTheDocument();
    expect(screen.getByText('TerniLabs does not store media and uses third-party APIs and providers.')).toBeInTheDocument();
    expect(screen.getByText('The project is not affiliated with, endorsed by, or connected to any streaming platform.')).toBeInTheDocument();
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
