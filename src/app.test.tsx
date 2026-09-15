import { render, screen } from '@testing-library/preact';
import { App } from './app';
import { setViewportWidth } from './test/match-media';

const DISCLAIMER = 'This site is not affiliated with, endorsed by, or connected to any streaming platform.';

test('renders without crashing', () => {
  setViewportWidth(1200);
  const { container } = render(<App />);
  expect(container.querySelector('main')).toBeInTheDocument();
});

it('renders the shared not-found state for unknown routes', async () => {
  window.history.pushState(null, '', '/missing');

  render(<App />);

  const state = await screen.findByRole('status', { name: 'Page not found' });
  expect(state).toHaveClass('invalid-response-state');
  expect(screen.getByText('This page does not exist or the link is no longer valid. Check the URL or search for the title again.')).toBeInTheDocument();
});

// claude-opus-5: The footer replaced the home-page announcement bar and sits outside the Router,
// so the disclaimer has to survive every route including the not-found fallback.
it.each(['/', '/search', '/watch/1?type=movie', '/missing'])('renders the disclaimer footer on %s', (path) => {
  setViewportWidth(1200);
  window.history.pushState(null, '', path);

  const { container } = render(<App />);

  const footer = container.querySelector('footer');
  expect(footer).toBeInTheDocument();
  expect(footer).toHaveTextContent(DISCLAIMER);
});
