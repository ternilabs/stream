import { fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBox } from './search-box';

const searchMock = vi.fn();

vi.mock('../lib/api-client', () => ({ apiClient: {} }));
vi.mock('../lib/queries', () => ({
  getSearchWithCache: (...args: unknown[]) => searchMock(...args),
}));

describe('SearchBox', () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    searchMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hides recent-search content for fresh users with short queries', () => {
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);
    expect(document.querySelector('.search-panel')).toHaveClass('is-empty');

    expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
    expect(screen.queryByText('No recent searches yet.')).not.toBeInTheDocument();

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'd' } });

    expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
    expect(screen.queryByText('No recent searches yet.')).not.toBeInTheDocument();
  });

  it('shows saved recents for short queries and supports clearing them', () => {
    localStorage.setItem('stream:recent-searches', JSON.stringify(['Dune', 'Fallout']));
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Fallout')).toBeInTheDocument();

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'd' } });
    expect(screen.getByText('Dune')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear all'));
    expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
    expect(screen.queryByText('Dune')).not.toBeInTheDocument();
  });

  it('caps recents at five and removes one recent without submitting it', () => {
    localStorage.setItem('stream:recent-searches', JSON.stringify(['Dune', 'Fallout', 'Matrix', 'Alien', 'Shogun', 'Extra']));
    const onSearch = vi.fn();
    render(<SearchBox initialQuery="" onSearch={onSearch} />);

    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.queryByText('Extra')).not.toBeInTheDocument();

    const removeDune = screen.getByLabelText('Remove Dune from recent searches');
    expect(within(removeDune).getByTestId('remove-recent-icon')).toBeInTheDocument();
    fireEvent.click(removeDune);

    expect(screen.queryByText('Dune')).not.toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('stream:recent-searches') ?? '[]')).toEqual(['Fallout', 'Matrix', 'Alien', 'Shogun']);
  });

  it('debounces quick-result requests by 500ms and ignores short queries', async () => {
    vi.useFakeTimers();
    searchMock.mockResolvedValue({ page: 1, totalPages: 1, results: [] });
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'm' } });
    await vi.advanceTimersByTimeAsync(600);
    expect(searchMock).not.toHaveBeenCalled();

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'ma' } });
    await vi.advanceTimersByTimeAsync(499);
    expect(searchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith(expect.anything(), { q: 'ma', page: 1, limit: 6 });

    vi.useRealTimers();
  });

  it('clears stale results and hides view-all while a new query is pending', async () => {
    vi.useFakeTimers();
    searchMock.mockResolvedValueOnce({
      page: 1,
      totalPages: 1,
      results: [{ id: 603, type: 'movie', title: 'The Matrix', year: '1999', rating: 8.7 }],
    });
    searchMock.mockResolvedValueOnce({ page: 1, totalPages: 1, results: [] });
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'matrix' } });
    await vi.advanceTimersByTimeAsync(500);
    await screen.findByText('The Matrix');
    expect(screen.getByRole('button', { name: /View all results for/i })).toBeInTheDocument();

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'zzzz' } });

    expect(screen.queryByText('The Matrix')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View all results for/i })).not.toBeInTheDocument();
    expect(screen.getByText('Searching for "zzzz"')).toBeInTheDocument();
    expect(screen.getByText('Checking the catalog...')).toBeInTheDocument();
    expect(screen.getByText('Searching for "zzzz"')).toHaveClass('search-message-title');

    await vi.advanceTimersByTimeAsync(500);
    await screen.findByText('No matches for "zzzz"');

    vi.useRealTimers();
  });

  it('shows the no-match state without a view-all action when no results are returned', async () => {
    vi.useFakeTimers();
    searchMock.mockResolvedValue({ page: 1, totalPages: 1, results: [] });
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'unknown' } });
    await vi.advanceTimersByTimeAsync(500);

    expect(await screen.findByText('No matches for "unknown"')).toBeInTheDocument();
    expect(screen.getByText('Try a different title, actor, or genre.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View all results for/i })).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows six quick results and submits view-all through onSearch', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    searchMock.mockResolvedValue({
      page: 1,
      totalPages: 1,
      results: Array.from({ length: 7 }, (_, index) => ({ id: index + 1, type: 'movie', title: `Result ${index + 1}` })),
    });
    render(<SearchBox initialQuery="" onSearch={onSearch} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'result' } });
    await vi.advanceTimersByTimeAsync(500);

    expect(await screen.findByText('Result 6')).toBeInTheDocument();
    expect(screen.queryByText('Result 7')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /View all results for "result"/i }));

    expect(onSearch).toHaveBeenCalledWith('result');
    expect(JSON.parse(localStorage.getItem('stream:recent-searches') ?? '[]')).toEqual(['result']);

    vi.useRealTimers();
  });

  it('closes the quick-search panel before submitting view-all', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const onClose = vi.fn();
    searchMock.mockResolvedValue({
      page: 1,
      totalPages: 1,
      results: [{ id: 1, type: 'movie', title: 'Result 1' }],
    });
    render(<SearchBox initialQuery="" onSearch={onSearch} onClose={onClose} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'result' } });
    await vi.advanceTimersByTimeAsync(500);
    await screen.findByText('Result 1');
    fireEvent.click(screen.getByRole('button', { name: /View all results for "result"/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('result');
    expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(onSearch.mock.invocationCallOrder[0]);

    vi.useRealTimers();
  });

  it('renders poster images when posterUrl exists and a media fallback when it does not', async () => {
    vi.useFakeTimers();
    searchMock.mockResolvedValue({
      page: 1,
      totalPages: 1,
      results: [
        { id: 603, type: 'movie', title: 'The Matrix', year: '1999', rating: 8.7, posterUrl: 'https://image.test/matrix.jpg' },
        { id: 1399, type: 'tv', title: 'Game of Thrones', year: '2011' },
      ],
    });
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'matrix' } });
    await vi.advanceTimersByTimeAsync(500);

    expect(await screen.findByAltText('')).toHaveAttribute('src', 'https://image.test/matrix.jpg');
    expect(screen.getByAltText('').closest('.thumb')).toHaveClass('has-image');
    expect(screen.getByText('TV')).toBeInTheDocument();
    expect(screen.getByText('MOVIE - 1999')).toBeInTheDocument();
    expect(screen.getByText('★ 8.7')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('selects a quick result, calls onClose, and remembers the active query', async () => {
    vi.useFakeTimers();
    searchMock.mockResolvedValue({
      page: 1,
      totalPages: 1,
      results: [{ id: 603, type: 'movie', title: 'The Matrix', year: '1999', rating: 8.7 }],
    });
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<SearchBox initialQuery="" onSearch={() => undefined} onSelect={onSelect} onClose={onClose} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'matrix' } });
    await vi.advanceTimersByTimeAsync(500);
    fireEvent.click(await screen.findByText('The Matrix'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({ id: 603, type: 'movie', title: 'The Matrix', year: '1999', rating: 8.7 });
    expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(onSelect.mock.invocationCallOrder[0]);
    expect(screen.queryByText('The Matrix')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search any title...')).toHaveValue('');
    expect(JSON.parse(localStorage.getItem('stream:recent-searches') ?? '[]')).toEqual(['matrix']);

    vi.useRealTimers();
  });

  it('renders recent search actions without nesting buttons', () => {
    localStorage.setItem('stream:recent-searches', JSON.stringify(['Dune']));
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    const recentButton = screen.getByRole('button', { name: 'Search for Dune' });
    const removeButton = screen.getByRole('button', { name: 'Remove Dune from recent searches' });

    expect(recentButton.querySelector('button')).toBeNull();
    expect(removeButton.closest('button')).toBe(removeButton);
  });

  it('submits query when clicking the recent search select button', () => {
    localStorage.setItem('stream:recent-searches', JSON.stringify(['Dune']));
    const onSearch = vi.fn();
    render(<SearchBox initialQuery="" onSearch={onSearch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Search for Dune' }));
    expect(onSearch).toHaveBeenCalledWith('Dune');
  });

  it('removes recent search when clicking the remove button', () => {
    localStorage.setItem('stream:recent-searches', JSON.stringify(['Dune']));
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Dune from recent searches' }));
    expect(screen.queryByText('Dune')).not.toBeInTheDocument();
  });
});
