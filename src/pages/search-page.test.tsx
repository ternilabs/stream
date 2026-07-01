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
    expect(screen.getByRole('button', { name: 'Media type' })).toBeInTheDocument();
  });

  it('uses q and type from the URL for the initial API request', async () => {
    window.history.pushState(null, '', '/search?q=matrix&type=tv');

    renderSearchPage();

    await waitFor(() => expect(mockedGetSearchWithCache).toHaveBeenCalledWith(expect.anything(), { q: 'matrix', page: 1, type: 'tv' }));
    expect(screen.getByPlaceholderText('Search the catalog...')).toHaveValue('matrix');
    expect(screen.getByRole('button', { name: 'Media type' })).toHaveTextContent('TV');
  });

  it('updates the URL and sends the selected type when the form is submitted', async () => {
    renderSearchPage();

    fireEvent.input(screen.getByPlaceholderText('Search the catalog...'), { target: { value: 'dune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Media type' }));
    fireEvent.click(screen.getByRole('option', { name: 'Movie' }));
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

  it('renders pagination controls from page and totalPages', async () => {
    mockedGetSearchWithCache.mockResolvedValue({
      page: 3, totalPages: 5,
      results: [{ id: 1, type: 'movie', title: 'Matrix' }],
    });
    window.history.pushState(null, '', '/search?q=matrix&type=multi&page=3');

    renderSearchPage();

    await screen.findByRole('navigation', { name: 'Pagination' });
    expect(screen.getByRole('button', { name: 'First page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveClass('is-active');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeEnabled();
  });

  it('disables boundary pagination controls on first page', async () => {
    mockedGetSearchWithCache.mockResolvedValue({
      page: 1, totalPages: 3,
      results: [{ id: 1, type: 'movie', title: 'Matrix' }],
    });
    window.history.pushState(null, '', '/search?q=matrix&type=multi');

    renderSearchPage();

    await screen.findByRole('navigation', { name: 'Pagination' });
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeEnabled();
  });

  it('requests the selected page and updates the URL', async () => {
    window.history.pushState(null, '', '/search?q=alien&type=movie');
    mockedGetSearchWithCache.mockResolvedValueOnce({
      page: 1, totalPages: 3,
      results: [{ id: 1, type: 'movie', title: 'Alien' }],
    });
    renderSearchPage();

    await waitFor(() => expect(mockedGetSearchWithCache).toHaveBeenCalledWith(expect.anything(), { q: 'alien', page: 1, type: 'movie' }));

    mockedGetSearchWithCache.mockResolvedValueOnce({
      page: 2, totalPages: 3,
      results: [{ id: 1, type: 'movie', title: 'Aliens' }],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(mockedGetSearchWithCache).toHaveBeenCalledWith(expect.anything(), { q: 'alien', page: 2, type: 'movie' }));
    expect(window.location.search).toContain('page=2');
  });

  it('hides pagination when there is no query', () => {
    renderSearchPage();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('keeps the search form visible and hides results when search metadata fails', async () => {
    mockedGetSearchWithCache.mockRejectedValue(new Error('network'));
    window.history.pushState(null, '', '/search?q=matrix&type=multi&page=2');

    renderSearchPage();

    expect(screen.getByRole('search', { name: 'Search catalog' })).toBeInTheDocument();
    const state = await screen.findByRole('status', { name: 'Something went wrong' });
    expect(state).toHaveClass('invalid-response-state');
    expect(screen.getByText('We couldn’t retrieve the data from the server. Please refresh the page or try again later.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Search results')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('renders inert ellipsis separators in pagination', async () => {
    mockedGetSearchWithCache.mockResolvedValue({
      page: 5, totalPages: 10,
      results: [{ id: 1, type: 'movie', title: 'Matrix' }],
    });
    window.history.pushState(null, '', '/search?q=matrix&type=multi&page=5');

    renderSearchPage();

    await screen.findByRole('navigation', { name: 'Pagination' });
    const ellipses = document.querySelectorAll('[aria-hidden="true"]');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
    ellipses.forEach(el => {
      expect(el.tagName).not.toBe('BUTTON');
    });
  });
});
