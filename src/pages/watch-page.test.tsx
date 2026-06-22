import { render, screen } from '@testing-library/preact';
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
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
