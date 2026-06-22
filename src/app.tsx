import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';

function HomePlaceholder() {
  return <main class="shell"><h1>TerniLabs</h1></main>;
}

function NotFound() {
  return <main class="shell"><h1>Not found</h1></main>;
}

export function App() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <Router>
          <Route path="/" component={HomePlaceholder} />
          <Route default component={NotFound} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
