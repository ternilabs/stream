import { expectNoShift, expect, measureAcrossLoad, meta, test, type LoadProbe } from './support/test';

/**
 * claude-opus-5: Regression guard for the defect this work started from. Before the fix the watch page's left
 * panel grew 402px between its skeleton and its loaded state, the recommendation grid rendered 6
 * placeholders for 12 real cards, and the search page had no skeleton at all.
 *
 * Every case below is the same behaviour — hold the API response, measure the placeholder,
 * release, measure what replaced it — so the sequence lives in `measureAcrossLoad` and each case
 * only declares what differs. The hold stays well under the api-client's 4s abort timeout.
 */
interface NoShiftCase extends LoadProbe {
  name: string;
  /** Defaults to SHIFT_TOLERANCE; zero where the two boxes should agree exactly. */
  tolerance?: number;
}

const WATCH_MOVIE = `/watch/${meta.movieId}?type=movie`;
const LOADING_DETAILS = '[role="status"][aria-label="Loading title details"]';
const LOADING_RECOMMENDATIONS = '[role="status"][aria-label="Loading recommendations"]';

const NO_SHIFT_CASES: NoShiftCase[] = [
  {
    name: 'a home card',
    path: '/',
    pending: { ready: '.skeleton-card', measure: '.media-section .skeleton-card' },
    settled: { ready: '.media-section .card:not(.skeleton-card)', measure: '.media-section .card' },
  },
  {
    name: 'a home rail',
    path: '/',
    pending: { ready: '.skeleton-card', measure: '.media-section' },
    settled: { ready: '.media-section .card:not(.skeleton-card)', measure: '.media-section' },
  },
  {
    name: 'the search results grid',
    path: '/search?q=matrix&type=multi',
    pending: { ready: '[role="status"][aria-label="Loading search results"]', measure: '.browse-grid' },
    settled: { ready: '.browse-grid .card', measure: '.browse-grid' },
  },
  {
    name: 'the watch page left panel',
    path: WATCH_MOVIE,
    pending: { ready: LOADING_RECOMMENDATIONS, measure: '.left-panel' },
    settled: { ready: '.reco-grid .card:not(.skeleton-card)', measure: '.left-panel' },
  },
  {
    // claude-opus-5: Waits for the real "See more" control — a <button>, where the skeleton's
    // placeholder is a <span> — because whether it renders is decided by an effect that measures
    // the description's scroll height. Waiting only on `.detail-title` races that effect, and a
    // `.see-more` selector would match the skeleton's own placeholder.
    name: 'the watch detail panel',
    path: WATCH_MOVIE,
    pending: { ready: LOADING_DETAILS, measure: '.detail-card' },
    settled: { ready: 'button.see-more', measure: '.detail-card' },
  },
  {
    name: 'the watch detail poster',
    path: WATCH_MOVIE,
    pending: { ready: LOADING_DETAILS, measure: '.detail-skeleton .detail-poster' },
    settled: { ready: '.detail-title', measure: '.detail-poster' },
    tolerance: 0,
  },
];

test.describe('loading states', () => {
  for (const { name, tolerance, ...probe } of NO_SHIFT_CASES) {
    test(`${name} keeps its box when data arrives`, async ({ mockApi, page }) => {
      expectNoShift(await measureAcrossLoad(page, mockApi, probe), tolerance);
    });
  }

  test('cards in one row are all the same height', async ({ api, page }) => {
    void api;
    await page.goto('/');
    await expect(page.locator('.media-section .card').first()).toBeVisible();

    const heights = await page.$$eval('.media-section .card', (els) =>
      [...new Set(els.map((el) => Math.round(el.getBoundingClientRect().height)))]);

    expect(heights).toHaveLength(1);
  });

  test('the recommendation grid shows one placeholder per real card', async ({ mockApi, page }) => {
    const api = (await mockApi()).gate();
    await page.goto(WATCH_MOVIE);

    const skeletonGrid = page.getByRole('status', { name: 'Loading recommendations' });
    await expect(skeletonGrid).toBeVisible();
    const placeholders = await skeletonGrid.locator('.skeleton-card').count();

    api.letThrough();
    await expect(page.locator('.reco-grid .card').first()).toBeVisible();

    expect(placeholders).toBe(await page.locator('.reco-grid .card').count());
  });

  // claude-opus-5: These three slots used to render a definite "no" before the answer was known.
  test('nothing claims to be missing while it is still loading', async ({ mockApi, page }) => {
    const api = (await mockApi()).gate();
    await page.goto(WATCH_MOVIE);

    await expect(page.getByRole('status', { name: 'Loading title details' })).toBeVisible();

    await expect(page.getByText('No trailer available.')).toHaveCount(0);
    await expect(page.getByText('No servers available')).toHaveCount(0);
    await expect(page.getByText('Episodes are unavailable until valid season data exists.')).toHaveCount(0);
    await expect(page.getByText('No recommendations available.')).toHaveCount(0);
    await expect(page.getByText('No character data available.')).toHaveCount(0);

    await expect(page.getByRole('status', { name: 'Loading player' })).toBeVisible();
    await expect(page.getByRole('status', { name: 'Loading trailer' })).toBeVisible();
    await expect(page.getByText('Loading servers…')).toBeVisible();

    api.letThrough();
    await expect(page.locator('iframe.player-frame')).toBeVisible();
  });

  test('placeholders are hidden from assistive tech but announced as busy', async ({ mockApi, page }) => {
    const api = (await mockApi()).gate();
    await page.goto('/');

    await expect(page.locator('.skeleton-card').first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Trending Movies' })).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('.skeleton-card').first()).toHaveAttribute('aria-hidden', 'true');

    api.letThrough();
    await expect(page.locator('.media-section .card:not(.skeleton-card)').first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Trending Movies' })).not.toHaveAttribute('aria-busy', 'true');
  });

  // claude-opus-5: Nav and WatchPage both call useSourceHealth; before the in-flight map in queries.ts they
  // each issued their own /v1/sources request on a cold cache.
  test('source health is requested once per page load', async ({ api, page }) => {
    void api;
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/v1/sources')) requests.push(request.url());
    });

    await page.goto(WATCH_MOVIE);
    await expect(page.locator('iframe.player-frame')).toBeVisible();

    expect(requests).toHaveLength(1);
  });
});
