import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';
import { Nav } from './components/nav';

function HomePlaceholder() {
  return <main class="shell"><h1>Stream without stored video.</h1></main>;
}

function NotFound() {
  return <main class="shell"><h1>Not found</h1></main>;
}

export function App() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <Nav />
        <Router>
          <Route path="/" component={HomePlaceholder} />
          <Route default component={NotFound} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
