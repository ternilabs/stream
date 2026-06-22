import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchPage } from './watch-page';

const titleMock = vi.fn();

vi.mock('../lib/queries', () => ({
  getTitleWithCache: (...args: unknown[]) => titleMock(...args),
}));

describe('WatchPage', () => {
  beforeEach(() => {
    titleMock.mockReset();
    titleMock.mockResolvedValue({ id: 1, title: 'Test Movie', type: 'movie' });
    window.history.replaceState(null, '', '/watch/1?type=movie');
  });

  it('renders the player iframe', () => {
    render(<WatchPage />);
    expect(screen.getByTitle(/Selected stream source/)).toBeInTheDocument();
  });

  it('renders the details panel heading', () => {
    render(<WatchPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders TV season episode picker and updates the URL', () => {
    window.history.replaceState(null, '', '/watch/2?type=tv&season=1&episode=1');
    render(<WatchPage />);

    expect(screen.getByLabelText('Season')).toHaveValue(1);
    expect(screen.getByLabelText('Episode')).toHaveValue(1);

    fireEvent.input(screen.getByLabelText('Season'), { target: { value: '2' } });
    fireEvent.input(screen.getByLabelText('Episode'), { target: { value: '3' } });

    expect(window.location.search).toContain('type=tv');
    expect(window.location.search).toContain('season=2');
    expect(window.location.search).toContain('episode=3');
  });

  it('renders twelve recommendations from title details', async () => {
    titleMock.mockResolvedValue({
      id: 1,
      title: 'Test Movie',
      type: 'movie',
      recommended: Array.from({ length: 13 }, (_, index) => ({ id: index + 10, type: 'movie', title: `Recommended ${index + 1}` })),
    });
    render(<WatchPage />);

    await waitFor(() => expect(screen.getByText('Recommended 12')).toBeInTheDocument());
    expect(screen.queryByText('Recommended 13')).not.toBeInTheDocument();
  });
});
