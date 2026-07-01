import { render, screen } from '@testing-library/preact';
import { App } from './app';
import { setViewportWidth } from './test/match-media';

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
