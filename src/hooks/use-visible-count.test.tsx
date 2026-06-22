import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { setViewportWidth } from '../test/match-media';
import { useVisibleCount } from './use-visible-count';

function Probe() {
  return <span>{useVisibleCount()}</span>;
}

describe('useVisibleCount', () => {
  it('returns 6 desktop, 4 tablet, and 2 mobile', () => {
    setViewportWidth(1200);
    const { rerender } = render(<Probe />);
    expect(screen.getByText('6')).toBeInTheDocument();
    setViewportWidth(900);
    rerender(<Probe />);
    expect(screen.getByText('4')).toBeInTheDocument();
    setViewportWidth(500);
    rerender(<Probe />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
