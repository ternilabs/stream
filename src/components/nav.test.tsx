import { render, screen } from '@testing-library/preact';
import { LocationProvider } from 'preact-iso';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Nav } from './nav';

vi.mock('./settings-dialog', () => ({
  SettingsDialog: () => null,
}));

vi.mock('./search-box', () => ({
  SearchBox: () => <div data-testid="nav-search-box"><input placeholder="Search any title..." /></div>,
}));

vi.mock('../hooks/use-source-health', () => ({
  useSourceHealth: () => ({ sources: [], availableSources: [], isLoading: false, isUnavailable: true }),
}));

function renderNav() {
  return render(<LocationProvider><Nav /></LocationProvider>);
}

describe('Nav', () => {
  beforeEach(() => {
    document.body.className = '';
    window.history.pushState(null, '', '/');
  });

  it('shows quick-search controls outside the search page', () => {
    window.history.pushState(null, '', '/watch/603?type=movie');

    renderNav();

    expect(screen.getByTestId('nav-search-box')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open search' })).toBeInTheDocument();
  });

  it('hides quick-search controls on the search page and removes mobile search body state', () => {
    document.body.classList.add('mobile-search-open');
    window.history.pushState(null, '', '/search?q=matrix&type=multi');

    renderNav();

    expect(screen.queryByTestId('nav-search-box')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open search' })).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('mobile-search-open');
  });
});
