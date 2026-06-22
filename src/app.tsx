import { ErrorBoundary, LocationProvider, Route, Router } from 'preact-iso';
import { Nav } from './components/nav';
import { HomePage } from './pages/home-page';

function NotFound() {
  return <main class="shell"><h1>Not found</h1></main>;
}

export function App() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <Nav />
        <Router>
          <Route path="/" component={HomePage} />
          <Route default component={NotFound} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
