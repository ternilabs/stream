import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { WatchPage } from './watch-page';

vi.mock('../lib/queries', () => ({
  getTitleWithCache: vi.fn(() => Promise.resolve({ id: 1, title: 'Test Movie', type: 'movie' })),
}));

describe('WatchPage', () => {
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
});
