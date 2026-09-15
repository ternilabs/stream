import { DISCLAIMER, expect, meta, test } from './support/test';

// claude-opus-5: Runs under the `mobile` project (Pixel 7, 412x915) — see playwright.config.ts.
test.describe('mobile', () => {
  test.beforeEach(async ({ api, page }) => {
    void api;
    await page.goto('/');
  });

  test('collapses the card grid to two columns', async ({ page }) => {
    await expect(page.locator('.media-section .card').first()).toBeVisible();

    const columns = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.grid')!).gridTemplateColumns.split(' ').length);

    expect(columns).toBe(2);
    await expect(page.getByRole('region', { name: 'Trending Movies' }).locator('.card')).toHaveCount(2);
  });

  test('hides the inline search field behind a button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Open search' })).toBeVisible();
    await expect(page.getByPlaceholder('Search any title...')).toBeHidden();
  });

  test('opens the search overlay, locks the body, and closes on Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Open search' }).click();

    await expect(page.getByPlaceholder('Search any title...')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/mobile-search-open/);
    await expect(page.locator('.mobile-search-scrim')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('body')).not.toHaveClass(/mobile-search-open/);
    await expect(page.getByPlaceholder('Search any title...')).toBeHidden();
  });

  test('closes the search overlay from its close button', async ({ page }) => {
    await page.getByRole('button', { name: 'Open search' }).click();
    await page.getByRole('button', { name: 'Close search' }).click();

    await expect(page.locator('body')).not.toHaveClass(/mobile-search-open/);
  });

  test('searching from the overlay navigates to the search page', async ({ page }) => {
    await page.getByRole('button', { name: 'Open search' }).click();
    await page.getByPlaceholder('Search any title...').fill('matrix');
    await page.getByPlaceholder('Search any title...').press('Enter');

    await expect(page).toHaveURL(/\/search\?q=matrix/);
    await expect(page.locator('body')).not.toHaveClass(/mobile-search-open/);
  });

  test('stacks the watch page into one column', async ({ page }) => {
    await page.goto(`/watch/${meta.movieId}?type=movie`);
    await expect(page.locator('.detail-title')).toBeVisible();

    const columns = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.detail-shell')!).gridTemplateColumns.split(' ').length);

    expect(columns).toBe(1);
  });

  test('never scrolls the page sideways', async ({ page }) => {
    for (const path of ['/', '/search?q=matrix&type=multi', `/watch/${meta.tvId}?type=tv`]) {
      await page.goto(path);
      await expect(page.locator('footer')).toBeVisible();

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
  });

  test('keeps the disclaimer footer readable on a narrow screen', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toContainText(DISCLAIMER);
    await expect(footer).toBeVisible();
  });

  test('keeps the search grid at two columns', async ({ page }) => {
    await page.goto('/search?q=matrix&type=multi');
    await expect(page.locator('.browse-grid .card').first()).toBeVisible();

    const columns = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.browse-grid')!).gridTemplateColumns.split(' ').length);

    expect(columns).toBe(2);
  });
});
