import { DISCLAIMER, expect, meta, test } from './support/test';

test.describe('routing', () => {
  test('renders the not-found state for an unknown path', async ({ api, page }) => {
    void api;
    await page.goto('/nope');

    await expect(page.getByRole('status', { name: 'Page not found' })).toBeVisible();
    await expect(page.locator('footer')).toContainText(DISCLAIMER);
  });

  const invalidIds = ['/watch/foo', '/watch/0', '/watch/-1', '/watch/1.5'];
  for (const path of invalidIds) {
    test(`rejects ${path} without calling the API`, async ({ api, page }) => {
      void api;
      const titleRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/v1/titles')) titleRequests.push(request.url());
      });

      await page.goto(path);

      await expect(page.getByRole('status', { name: 'Invalid watch link' })).toBeVisible();
      expect(titleRequests).toEqual([]);
    });
  }

  test('rejects an unsupported watch type without calling the API', async ({ api, page }) => {
    void api;
    const titleRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/v1/titles')) titleRequests.push(request.url());
    });

    await page.goto(`/watch/${meta.movieId}?type=person`);

    await expect(page.getByRole('status', { name: 'Invalid watch link' })).toBeVisible();
    expect(titleRequests).toEqual([]);
  });

  test('treats a missing watch type as a movie', async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.movieId}`);

    await expect(page.locator('.detail-title')).toBeVisible();
    await expect(page.locator('.season-episode-panel')).toHaveCount(0);
  });

  test('deep links survive a reload thanks to the SPA fallback', async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.movieId}?type=movie`);
    await expect(page.locator('.detail-title')).toBeVisible();

    await page.reload();

    await expect(page.locator('.detail-title')).toBeVisible();
  });

  test('the brand link returns home from any route', async ({ api, page }) => {
    void api;
    await page.goto('/search?q=matrix&type=multi');

    await page.getByRole('link', { name: 'TerniLabs' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('region', { name: 'Trending Movies' })).toBeVisible();
  });

  const everyRoute = ['/', '/search?q=matrix&type=multi', '/nope'];
  for (const path of everyRoute) {
    test(`shows the disclaimer footer on ${path}`, async ({ api, page }) => {
      void api;
      await page.goto(path);
      await expect(page.locator('footer')).toContainText(DISCLAIMER);
    });
  }

  test('shows the disclaimer footer on a watch page', async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.movieId}?type=movie`);
    await expect(page.locator('footer')).toContainText(DISCLAIMER);
  });

  // claude-opus-5: The app had no footer before, so nothing pinned the page to the viewport.
  // On a short route the footer must sit at the bottom, not float with dead space beneath it.
  test('keeps the footer at the bottom of short pages', async ({ api, page }) => {
    void api;
    for (const path of ['/search?q=zqxjkvwnobody&type=multi', '/nope']) {
      await page.goto(path);
      await expect(page.locator('footer')).toBeVisible();

      const gap = await page.evaluate(() => {
        const footer = document.querySelector('footer')!;
        return Math.round(window.innerHeight - footer.getBoundingClientRect().bottom);
      });

      expect(gap, `dead space below the footer on ${path}`).toBeLessThanOrEqual(1);
    }
  });

  test('does not ship the removed analytics script', async ({ api, page }) => {
    void api;
    await page.goto('/');

    const scripts = await page.$$eval('script[src]', (els) => els.map((el) => el.getAttribute('src') ?? ''));
    expect(scripts.some((src) => src.includes('contentsquare'))).toBe(false);
  });
});
