import { DISCLAIMER, expect, fixtureOnly, meta, test } from './support/test';

const RAILS = ['Trending Movies', 'Trending TV', 'Top Rated Movies', 'Top Rated TV'];

test.describe('home', () => {
  test.beforeEach(async ({ api, page }) => {
    void api;
    await page.goto('/');
  });

  test('renders all four catalog rails', async ({ page }) => {
    for (const title of RAILS) {
      await expect(page.getByRole('region', { name: title })).toBeVisible();
    }
  });

  test('shows six cards per rail at desktop width', async ({ page }) => {
    const rail = page.getByRole('region', { name: 'Trending Movies' });
    await expect(rail.locator('.card').first()).toBeVisible();
    await expect(rail.locator('.card')).toHaveCount(6);
  });

  test('drops the announcement bar and shows the disclaimer footer instead', async ({ page }) => {
    await expect(page.locator('.announcement')).toHaveCount(0);
    await expect(page.getByText('Announcement')).toHaveCount(0);
    await expect(page.locator('footer')).toContainText(DISCLAIMER);
  });

  test('pages a rail forward and back', async ({ page }) => {
    const rail = page.getByRole('region', { name: 'Trending Movies' });
    await expect(rail.locator('.card').first()).toBeVisible();

    const firstTitle = await rail.locator('.card .title').first().textContent();
    const previous = rail.getByRole('button', { name: 'Previous Trending Movies' });
    const next = rail.getByRole('button', { name: 'Next Trending Movies' });

    await expect(previous).toBeDisabled();
    await next.click();

    await expect(rail.locator('.card .title').first()).not.toHaveText(firstTitle ?? '');
    await expect(previous).toBeEnabled();

    await previous.click();
    await expect(rail.locator('.card .title').first()).toHaveText(firstTitle ?? '');
    await expect(previous).toBeDisabled();
  });

  test('navigates from a card to its watch page', async ({ page }) => {
    const card = page.getByRole('region', { name: 'Trending Movies' }).locator('.card').first();
    await expect(card).toBeVisible();
    const title = (await card.locator('.title').textContent())?.trim() ?? '';

    await card.getByRole('link').click();

    await expect(page).toHaveURL(/\/watch\/\d+\?type=(movie|tv)/);
    await expect(page.locator('.detail-title')).toHaveText(title);
  });

  test('renders the trending titles from the API', async ({ page }) => {
    fixtureOnly();
    await expect(page.locator('.card .title').first()).toHaveText(meta.movieTitle);
  });

  test('shows the shared failure state when the API fails', async ({ mockApi, page }) => {
    await mockApi({ failWith: { status: 500 } });
    await page.goto('/');

    await expect(page.getByRole('status', { name: 'Something went wrong' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Trending Movies' })).toHaveCount(0);
    await expect(page.locator('footer')).toContainText(DISCLAIMER);
  });

  test('shows the rate-limit state and the support link when the API returns 429', async ({ mockApi, page }) => {
    await mockApi({ failWith: { status: 429 } });
    await page.goto('/');

    await expect(page.getByRole('status', { name: 'Service temporarily limited' })).toBeVisible();
    await expect(page.getByText(/ko-fi\.com\/mkgpdev/)).toBeVisible();
  });
});
