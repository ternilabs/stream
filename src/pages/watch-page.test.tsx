import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchPage } from './watch-page';

const titleMock = vi.fn();

vi.mock('../lib/queries', () => ({
  getTitleWithCache: (...args: unknown[]) => titleMock(...args),
}));

const tvDetails = {
  id: 2,
  title: 'Test Show',
  type: 'tv',
  year: '2020',
  rating: 8.5,
  overview: 'A long description about the test show that can be expanded by the viewer.',
  production: ['Studio One', 'Studio Two'],
  seasons: [
    {
      seasonNumber: 1,
      title: 'Season 1',
      episodeCount: 2,
      episodes: [
        { episodeNumber: 1, title: 'Pilot', aired: '2020-01-01' },
        { episodeNumber: 2, title: 'Second', aired: '2020-01-08' },
      ],
    },
    {
      seasonNumber: 2,
      title: 'Season 2',
      episodeCount: 1,
      episodes: [{ episodeNumber: 1, title: 'Return', aired: '2021-01-01' }],
    },
  ],
  cast: Array.from({ length: 5 }, (_, index) => ({ id: index, name: `Actor ${index + 1}`, character: `Character ${index + 1}` })),
  recommended: Array.from({ length: 13 }, (_, index) => ({ id: index + 10, type: 'movie', title: `Recommended ${index + 1}` })),
};

function mockSummaryOverflow(isOverflowing: boolean) {
  const scrollHeight = isOverflowing ? 80 : 40;
  const clientHeight = 40;
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => clientHeight });
}

describe('WatchPage', () => {
  beforeEach(() => {
    titleMock.mockReset();
    titleMock.mockResolvedValue({
      id: 1,
      title: 'Test Movie',
      type: 'movie',
      year: '2024',
      rating: 7.4,
      overview: 'Movie description',
      production: ['Movie Studio'],
      recommended: [],
      cast: [],
    });
    window.history.replaceState(null, '', '/watch/1?type=movie');
  });

  it('renders skeletons while title details are loading', () => {
    titleMock.mockReturnValue(new Promise(() => {}));

    render(<WatchPage />);

    expect(screen.getByLabelText('Loading title details')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading recommendations')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading characters')).toBeInTheDocument();
  });

  it('renders movie player iframe after movie details load', async () => {
    render(<WatchPage />);

    await waitFor(() => expect(screen.getByTitle('Test Movie')).toBeInTheDocument());
  });

  it('shows only the first Production value and removes the player share button', async () => {
    titleMock.mockResolvedValue({
      id: 1,
      title: 'Test Movie',
      type: 'movie',
      year: '2024',
      rating: 7.4,
      overview: 'Movie description',
      production: ['Movie Studio', 'Second Studio'],
      recommended: [],
      cast: [],
    });

    render(<WatchPage />);

    await waitFor(() => expect(screen.getByText('Movie Studio')).toBeInTheDocument());
    expect(screen.queryByText('Movie Studio, Second Studio')).not.toBeInTheDocument();
    expect(screen.queryByText('Second Studio')).not.toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.queryByText('Type')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Share title')).not.toBeInTheDocument();
  });

  it('expands and collapses the description only when collapsed text is truncated', async () => {
    mockSummaryOverflow(true);
    render(<WatchPage />);

    const seeMore = await screen.findByRole('button', { name: 'See more description' });
    expect(seeMore).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(seeMore);
    expect(screen.getByRole('button', { name: 'See less description' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'See less description' }));
    expect(screen.getByRole('button', { name: 'See more description' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('hides the description toggle when collapsed text is not truncated', async () => {
    mockSummaryOverflow(false);
    render(<WatchPage />);

    await waitFor(() => expect(screen.getByText('Movie description')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'See more description' })).not.toBeInTheDocument();
  });

  it('expands and collapses characters with accessible chevron controls', async () => {
    titleMock.mockResolvedValue(tvDetails);
    window.history.replaceState(null, '', '/watch/2?type=tv&season=1&episode=1');

    render(<WatchPage />);

    await waitFor(() => expect(screen.getByText('Character 4')).toBeInTheDocument());
    expect(screen.queryByText('Character 5')).not.toBeInTheDocument();

    const viewAll = screen.getByRole('button', { name: 'View all characters' });
    expect(viewAll).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(viewAll);

    expect(screen.getByText('Character 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show fewer characters' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders TV season episode dropdowns and updates the URL from API metadata', async () => {
    titleMock.mockResolvedValue(tvDetails);
    window.history.replaceState(null, '', '/watch/2?type=tv&season=1&episode=1');

    render(<WatchPage />);

    await waitFor(() => expect(screen.getByTitle('Test Show')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Season' }));
    fireEvent.click(screen.getByRole('option', { name: 'Season 2' }));

    expect(window.location.search).toContain('type=tv');
    expect(window.location.search).toContain('season=2');
    expect(window.location.search).toContain('episode=1');
  });

  it('blocks TV iframe rendering when API season metadata is missing', async () => {
    titleMock.mockResolvedValue({ ...tvDetails, seasons: [] });
    window.history.replaceState(null, '', '/watch/2?type=tv');

    render(<WatchPage />);

    await waitFor(() => expect(screen.getByText('Episodes are unavailable until valid season data exists.')).toBeInTheDocument());
    expect(screen.queryByTitle('Test Show')).not.toBeInTheDocument();
  });

  it('replaces invalid TV query params with the first valid API season and episode', async () => {
    titleMock.mockResolvedValue(tvDetails);
    window.history.replaceState(null, '', '/watch/2?type=tv&season=99&episode=99');

    render(<WatchPage />);

    await waitFor(() => expect(window.location.search).toContain('season=1'));
    expect(window.location.search).toContain('episode=1');
  });

  it('renders twelve recommendations from title details', async () => {
    titleMock.mockResolvedValue(tvDetails);
    render(<WatchPage />);

    await waitFor(() => expect(screen.getByText('Recommended 12')).toBeInTheDocument());
    expect(screen.queryByText('Recommended 13')).not.toBeInTheDocument();
  });
});
