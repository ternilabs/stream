import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { LocationProvider } from 'preact-iso';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchPage } from './search-page';
import { getSearchWithCache } from '../lib/queries';

vi.mock('../lib/api-client', () => ({ apiClient: {} }));
vi.mock('../lib/queries', () => ({
  getSearchWithCache: vi.fn(() => Promise.resolve({ page: 1, totalPages: 1, results: [] })),
}));

const mockedGetSearchWithCache = vi.mocked(getSearchWithCache);

function renderSearchPage() {
  return render(<LocationProvider><SearchPage /></LocationProvider>);
}

function deferredSearch() {
  let resolve!: (value: { page: number; totalPages: number; results: Array<{ id: number; type: 'movie' | 'tv'; title: string }> }) => void;
  const promise = new Promise<{ page: number; totalPages: number; results: Array<{ id: number; type: 'movie' | 'tv'; title: string }> }>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('SearchPage', () => {
  beforeEach(() => {
    mockedGetSearchWithCache.mockReset();
    mockedGetSearchWithCache.mockResolvedValue({ page: 1, totalPages: 1, results: [] });
    window.history.pushState(null, '', '/search');
  });

  it('renders one page search input and no embedded quick-search component', () => {
    renderSearchPage();

    expect(screen.getByPlaceholderText('Search the catalog...')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search any title...')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Media type')).toHaveValue('multi');
  });

  it('uses q and type from the URL for the initial API request', async () => {
    window.history.pushState(null, '', '/search?q=matrix&type=tv');

    renderSearchPage();

    await waitFor(() => expect(mockedGetSearchWithCache).toHaveBeenCalledWith(expect.anything(), { q: 'matrix', page: 1, type: 'tv' }));
    expect(screen.getByPlaceholderText('Search the catalog...')).toHaveValue('matrix');
    expect(screen.getByLabelText('Media type')).toHaveValue('tv');
  });

  it('updates the URL and sends the selected type when the form is submitted', async () => {
    renderSearchPage();

    fireEvent.input(screen.getByPlaceholderText('Search the catalog...'), { target: { value: 'dune' } });
    fireEvent.change(screen.getByLabelText('Media type'), { target: { value: 'movie' } });
    fireEvent.submit(screen.getByRole('search', { name: 'Search catalog' }));

    await waitFor(() => expect(mockedGetSearchWithCache).toHaveBeenCalledWith(expect.anything(), { q: 'dune', page: 1, type: 'movie' }));
    expect(window.location.pathname).toBe('/search');
    expect(window.location.search).toBe('?q=dune&type=movie');
  });

  it('clears stale results, shows a spinner, and never renders the old Searching text while loading', async () => {
    mockedGetSearchWithCache.mockResolvedValueOnce({
      page: 1,
      totalPages: 1,
      results: [{ id: 603, type: 'movie', title: 'The Matrix' }],
    });
    window.history.pushState(null, '', '/search?q=matrix&type=multi');
    renderSearchPage();

    expect(await screen.findByRole('link', { name: 'Watch The Matrix' })).toBeInTheDocument();

    const pending = deferredSearch();
    mockedGetSearchWithCache.mockReturnValueOnce(pending.promise);
    fireEvent.input(screen.getByPlaceholderText('Search the catalog...'), { target: { value: 'alien' } });
    fireEvent.submit(screen.getByRole('search', { name: 'Search catalog' }));

    expect(screen.queryByRole('link', { name: 'Watch The Matrix' })).not.toBeInTheDocument();
    expect(screen.getByTestId('search-loading-icon')).toBeInTheDocument();
    expect(screen.queryByText('Searching')).not.toBeInTheDocument();

    pending.resolve({ page: 1, totalPages: 1, results: [{ id: 348, type: 'movie', title: 'Alien' }] });
    expect(await screen.findByRole('link', { name: 'Watch Alien' })).toBeInTheDocument();
  });
});
