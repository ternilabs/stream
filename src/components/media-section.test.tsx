import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { setViewportWidth } from '../test/match-media';
import { MediaSection } from './media-section';

const items = Array.from({ length: 8 }, (_, index) => ({ id: index + 1, type: 'movie' as const, title: `Movie ${index + 1}` }));

describe('MediaSection', () => {
  it('renders exactly the active breakpoint count', () => {
    setViewportWidth(900);
    render(<MediaSection title="Trending" items={items} />);
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('links visible cards to the watch route', () => {
    setViewportWidth(1200);
    render(<MediaSection title="Trending" items={items} />);

    expect(screen.getByRole('link', { name: /Watch Movie 1/i })).toHaveAttribute('href', '/watch/1?type=movie');
  });

  it('renders responsive skeleton cards while loading', () => {
    setViewportWidth(900);
    render(<MediaSection title="Trending" items={[]} loading />);

    expect(screen.getByRole('region', { name: 'Trending' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByTestId('media-skeleton-card')).toHaveLength(4);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('disables section navigation while loading', () => {
    setViewportWidth(1200);
    render(<MediaSection title="Trending" items={[]} loading />);

    expect(screen.getByRole('button', { name: 'Previous Trending' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next Trending' })).toBeDisabled();
  });
});
