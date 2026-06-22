import { render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';
import { setViewportWidth } from '../test/match-media';

vi.mock('../lib/queries', () => ({
  getTrendingWithCache: vi.fn(() => Promise.resolve({ page: 1, totalPages: 1, results: [] })),
  getTopRatedWithCache: vi.fn(() => Promise.resolve({ page: 1, totalPages: 1, results: [] })),
}));

describe('HomePage', () => {
  it('renders announcement title, date label, and required notices', async () => {
    setViewportWidth(1200);
    render(<HomePage />);

    await waitFor(() => expect(screen.getByText('Announcement')).toBeInTheDocument());
    expect(screen.getByText('Daily cache active')).toBeInTheDocument();
    expect(screen.getByText(/report bugs, pull request/i)).toBeInTheDocument();
    expect(screen.getByText(/ko-fi.com\/mkgpdev/i)).toBeInTheDocument();
    expect(screen.getByText('The project is intended for educational and private use only. The developer does not condone or encourage copyright infringement.')).toBeInTheDocument();
    expect(screen.getByText("We don't store any medias and only supported with third-party APIs.")).toBeInTheDocument();
    expect(screen.getByText('The project is not affiliated with, endorsed by, or connected to any streaming platform.')).toBeInTheDocument();
  });
});
