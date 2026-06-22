import { render } from '@testing-library/preact';
import { App } from './app';

test('renders without crashing', () => {
  const { container } = render(<App />);
  expect(container.querySelector('h1')).toHaveTextContent('Stream without stored video.');
});
