import { render } from '@testing-library/preact';
import { App } from './app';
import { setViewportWidth } from './test/match-media';

test('renders without crashing', () => {
  setViewportWidth(1200);
  const { container } = render(<App />);
  expect(container.querySelector('main')).toBeInTheDocument();
});
