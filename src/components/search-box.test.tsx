import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBox } from './search-box';

const searchMock = vi.fn();

vi.mock('../lib/api-client', () => ({ apiClient: {} }));
vi.mock('../lib/queries', () => ({
  getSearchWithCache: (...args: unknown[]) => searchMock(...args),
}));

describe('SearchBox', () => {
  beforeEach(() => {
    localStorage.clear();
    searchMock.mockReset();
  });

  it('shows template recent searches and clears them', () => {
    localStorage.setItem('stream:recent-searches', JSON.stringify(['Dune', 'Fallout']));
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Fallout')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear all'));
    expect(screen.queryByText('Dune')).not.toBeInTheDocument();
  });

  it('shows live results and selects a result for watch navigation', async () => {
    searchMock.mockResolvedValue({
      page: 1,
      totalPages: 1,
      results: [{ id: 603, type: 'movie', title: 'The Matrix', year: '1999', rating: 8.7 }],
    });
    const onSelect = vi.fn();
    render(<SearchBox initialQuery="" onSearch={() => undefined} onSelect={onSelect} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'matrix' } });

    await waitFor(() => expect(screen.getByText('The Matrix')).toBeInTheDocument());
    expect(screen.getByText('MOVIE - 1999')).toBeInTheDocument();

    fireEvent.click(screen.getByText('The Matrix'));
    expect(onSelect).toHaveBeenCalledWith({ id: 603, type: 'movie', title: 'The Matrix', year: '1999', rating: 8.7 });
  });

  it('requests and shows six quick results with disabled view-all action', async () => {
    searchMock.mockResolvedValue({
      page: 1,
      totalPages: 1,
      results: Array.from({ length: 7 }, (_, index) => ({ id: index + 1, type: 'movie', title: `Result ${index + 1}` })),
    });
    render(<SearchBox initialQuery="" onSearch={() => undefined} />);

    fireEvent.input(screen.getByPlaceholderText('Search any title...'), { target: { value: 'result' } });

    await waitFor(() => expect(screen.getByText('Result 6')).toBeInTheDocument());
    expect(screen.queryByText('Result 7')).not.toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledWith(expect.anything(), { q: 'result', page: 1, limit: 6 });
    expect(screen.getByRole('button', { name: /View all results for/i })).toBeDisabled();
  });
});
