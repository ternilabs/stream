import { expect, fixtureOnly, meta, test } from './support/test';

test.describe('search page', () => {
  test('runs the query from the URL and renders results', async ({ api, page }) => {
    void api;
    await page.goto('/search?q=matrix&type=multi');

    await expect(page.getByRole('region', { name: 'Search results' }).locator('.card').first()).toBeVisible();
    await expect(page.getByPlaceholder('Search the catalog...')).toHaveValue('matrix');
  });

  test('renders a full page of results', async ({ api, page }) => {
    fixtureOnly();
    void api;
    await page.goto('/search?q=matrix&type=multi');

    await expect(page.locator('.browse-grid .card')).toHaveCount(meta.searchPageSize);
  });

  test('submitting the form puts the query in the URL', async ({ api, page }) => {
    void api;
    await page.goto('/search');

    await page.getByPlaceholder('Search the catalog...').fill('matrix');
    await page.getByPlaceholder('Search the catalog...').press('Enter');

    await expect(page).toHaveURL(/\/search\?q=matrix&type=multi/);
    await expect(page.locator('.browse-grid .card').first()).toBeVisible();
  });

  test('the type filter narrows results and is reflected in the URL', async ({ api, page }) => {
    void api;
    await page.goto('/search?q=matrix&type=multi');
    await expect(page.locator('.browse-grid .card').first()).toBeVisible();

    await page.getByRole('button', { name: 'Media type' }).click();
    await page.getByRole('option', { name: 'Movie' }).click();

    await expect(page).toHaveURL(/type=movie/);
    await expect(page.locator('.browse-grid .card').first()).toBeVisible();
    await expect(page.locator('.browse-grid .card .meta').first()).toContainText('MOVIE');
  });

  test('paginates and keeps the page in the URL', async ({ api, page }) => {
    void api;
    await page.goto('/search?q=matrix&type=multi');
    await expect(page.locator('.browse-grid .card').first()).toBeVisible();

    const firstTitle = await page.locator('.browse-grid .card .title').first().textContent();

    await expect(page.getByRole('button', { name: 'First page' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await page.getByRole('button', { name: 'Next page' }).click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('.browse-grid .card .title').first()).not.toHaveText(firstTitle ?? '');
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });

  test('marks the current page and exposes the total page count', async ({ api, page }) => {
    fixtureOnly();
    void api;
    await page.goto('/search?q=matrix&type=multi');
    await expect(page.locator('.browse-grid .card').first()).toBeVisible();

    await expect(page.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: `Page ${meta.searchTotalPages}` })).toBeVisible();
  });

  test('shows the empty state and no pagination when nothing matches', async ({ api, page }) => {
    void api;
    await page.goto('/search?q=zqxjkvwnobody&type=multi');

    await expect(page.getByRole('status')).toContainText('No results');
    await expect(page.locator('.browse-grid .card')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toHaveCount(0);
  });

  test('hides pagination and results when there is no query at all', async ({ api, page }) => {
    void api;
    await page.goto('/search');

    await expect(page.getByPlaceholder('Search the catalog...')).toHaveValue('');
    await expect(page.locator('.browse-grid .card')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toHaveCount(0);
  });

  test('keeps the search form usable when the request fails', async ({ mockApi, page }) => {
    await mockApi({ failWith: { status: 500 } });
    await page.goto('/search?q=matrix&type=multi');

    await expect(page.getByRole('status', { name: 'Something went wrong' })).toBeVisible();
    await expect(page.getByPlaceholder('Search the catalog...')).toBeVisible();
  });

  test('the header quick-search is replaced by the page search on /search', async ({ api, page }) => {
    void api;
    await page.goto('/search?q=matrix&type=multi');

    await expect(page.getByPlaceholder('Search any title...')).toHaveCount(0);
    await expect(page.getByPlaceholder('Search the catalog...')).toBeVisible();
  });
});
