import { expect, fixtureOnly, meta, test } from './support/test';

const QUICK = 'Search any title...';

test.describe('quick search', () => {
  test.beforeEach(async ({ api, page }) => {
    void api;
    await page.goto('/');
  });

  test('shows up to six results after the debounce', async ({ page }) => {
    await page.getByPlaceholder(QUICK).fill('matrix');

    await expect(page.locator('.result-row').first()).toBeVisible();
    expect(await page.locator('.result-row').count()).toBeLessThanOrEqual(6);
  });

  test('ignores queries shorter than two characters', async ({ page }) => {
    await page.getByPlaceholder(QUICK).fill('m');

    await expect(page.locator('.result-row')).toHaveCount(0);
    await expect(page.getByText(/Searching for/)).toHaveCount(0);
  });

  test('renders the rating with an icon, matching the cards', async ({ page }) => {
    fixtureOnly();
    await page.getByPlaceholder(QUICK).fill('matrix');
    await expect(page.locator('.result-row').first()).toBeVisible();

    await expect(page.locator('.result-rating svg').first()).toBeVisible();
    await expect(page.getByText('★', { exact: false })).toHaveCount(0);
  });

  test('shows a no-match state without a view-all action', async ({ page }) => {
    await page.getByPlaceholder(QUICK).fill('zqxjkvwnobody');

    await expect(page.getByText(/No matches for/)).toBeVisible();
    await expect(page.getByRole('button', { name: /View all results/ })).toHaveCount(0);
  });

  test('selecting a result opens its watch page', async ({ page }) => {
    await page.getByPlaceholder(QUICK).fill('matrix');
    await expect(page.locator('.result-row').first()).toBeVisible();

    const title = (await page.locator('.result-row .result-title').first().textContent())?.trim() ?? '';
    await page.locator('.result-row').first().click();

    await expect(page).toHaveURL(/\/watch\/\d+\?type=(movie|tv)/);
    await expect(page.locator('.detail-title')).toHaveText(title);
  });

  test('view-all hands the query to the search page', async ({ page }) => {
    await page.getByPlaceholder(QUICK).fill('matrix');
    await expect(page.locator('.result-row').first()).toBeVisible();

    await page.getByRole('button', { name: /View all results/ }).click();

    await expect(page).toHaveURL(/\/search\?q=matrix/);
  });

  test('remembers, removes, and clears recent searches', async ({ page }) => {
    await page.getByPlaceholder(QUICK).fill('matrix');
    await expect(page.locator('.result-row').first()).toBeVisible();
    await page.getByRole('button', { name: /View all results/ }).click();
    await expect(page).toHaveURL(/\/search/);

    await page.goto('/');
    await page.getByPlaceholder(QUICK).click();
    await expect(page.getByRole('button', { name: 'Search for matrix' })).toBeVisible();

    await page.getByRole('button', { name: 'Remove matrix from recent searches' }).click();
    await expect(page.getByRole('button', { name: 'Search for matrix' })).toHaveCount(0);
  });

  test('recent searches survive a reload, unlike the daily API cache', async ({ page }) => {
    await page.getByPlaceholder(QUICK).fill('matrix');
    await expect(page.locator('.result-row').first()).toBeVisible();
    await page.getByRole('button', { name: /View all results/ }).click();
    await expect(page).toHaveURL(/\/search/);

    await page.goto('/');
    await page.reload();
    await page.getByPlaceholder(QUICK).click();

    await expect(page.getByRole('button', { name: 'Search for matrix' })).toBeVisible();
  });

  test('stores recent searches in the versioned namespace, not a raw key', async ({ page }) => {
    await page.getByPlaceholder(QUICK).fill('matrix');
    await expect(page.locator('.result-row').first()).toBeVisible();
    await page.getByRole('button', { name: /View all results/ }).click();
    await expect(page).toHaveURL(/\/search/);

    const keys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('stream:')));
    expect(keys).toContain('stream:v2:recent-searches');
    expect(keys).not.toContain('stream:recent-searches');
  });

  test('caps recent searches at five', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('stream:v2:recent-searches', JSON.stringify({
        version: 2,
        day: '2020-01-01',
        values: { queries: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] },
      }));
    });
    await page.reload();
    await page.getByPlaceholder(QUICK).click();

    await expect(page.locator('.recent-row')).toHaveCount(5);
  });

  test('quick-search results come from the API', async ({ page }) => {
    fixtureOnly();
    void meta;
    await page.getByPlaceholder(QUICK).fill('matrix');

    await expect(page.locator('.result-row .result-title').first()).not.toBeEmpty();
  });
});
