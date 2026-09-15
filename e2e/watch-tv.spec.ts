import { expect, fixtureOnly, meta, test } from './support/test';

test.describe('watch — TV', () => {
  test('renders the season and episode pickers', async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.tvId}?type=tv&season=1&episode=1`);

    await expect(page.locator('.season-episode-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Season' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Episode' })).toBeVisible();
  });

  test('lists every season the API reports', async ({ api, page }) => {
    fixtureOnly();
    void api;
    await page.goto(`/watch/${meta.tvId}?type=tv&season=1&episode=1`);

    await page.getByRole('button', { name: 'Season' }).click();
    await expect(page.getByRole('option')).toHaveCount(meta.tvSeasons.length);
  });

  test('changing season keeps an episode that exists in the new season', async ({ api, page }) => {
    fixtureOnly();
    void api;
    await page.goto(`/watch/${meta.tvId}?type=tv&season=1&episode=3`);
    await expect(page.locator('iframe.player-frame')).toBeVisible();

    await page.getByRole('button', { name: 'Season' }).click();
    await page.getByRole('option', { name: meta.tvSeasonTitles[1] }).click();

    await expect(page).toHaveURL(/season=2/);
    await expect(page).toHaveURL(/episode=3/);
    await expect(page).toHaveURL(/type=tv/);
    await expect(page.locator('.now-title')).toContainText('S2 E3');
  });

  // claude-opus-5: The other half of the same branch — the episode cannot carry over, so the
  // picker falls back to the first episode of the season being switched to.
  test('changing season falls back to the first episode when the current one does not exist', async ({ mockApi, page }) => {
    const detail = `/v1/titles/tv/${meta.tvId}`;
    await mockApi({
      overrides: {
        [detail]: {
          id: meta.tvId, type: 'tv', title: meta.tvTitle, description: 'Short seasons fixture.',
          seasons: [
            { seasonNumber: 1, title: 'Season 1', episodeCount: 3, episodes: [1, 2, 3].map((n) => ({ episodeNumber: n, title: `Ep ${n}`, aired: null })) },
            { seasonNumber: 2, title: 'Season 2', episodeCount: 1, episodes: [{ episodeNumber: 1, title: 'Ep 1', aired: null }] },
          ],
        },
      },
    });
    await page.goto(`/watch/${meta.tvId}?type=tv&season=1&episode=3`);
    await expect(page.locator('iframe.player-frame')).toBeVisible();

    await page.getByRole('button', { name: 'Season' }).click();
    await page.getByRole('option', { name: 'Season 2' }).click();

    await expect(page).toHaveURL(/season=2/);
    await expect(page).toHaveURL(/episode=1/);
  });

  test('changing episode updates the URL and the player source', async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.tvId}?type=tv&season=1&episode=1`);
    const frame = page.locator('iframe.player-frame');
    await expect(frame).toBeVisible();
    const before = await frame.getAttribute('src');

    await page.getByRole('button', { name: 'Episode' }).click();
    await page.getByRole('option').nth(1).click();

    await expect(page).toHaveURL(/episode=2/);
    await expect(frame).not.toHaveAttribute('src', before ?? '');
  });

  test('shows the current season and episode in the now-playing line', async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.tvId}?type=tv&season=1&episode=1`);

    await expect(page.locator('.now-title')).toContainText('S1 E1');
  });

  test('normalises out-of-range season and episode params', async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.tvId}?type=tv&season=99&episode=99`);

    await expect(page).toHaveURL(/season=1/);
    await expect(page).toHaveURL(/episode=1/);
    await expect(page.locator('iframe.player-frame')).toBeVisible();
  });

  test('defaults to season one episode one when the params are absent', async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.tvId}?type=tv`);

    await expect(page.locator('.now-title')).toContainText('S1 E1');
    await expect(page.locator('iframe.player-frame')).toBeVisible();
  });

  test('blocks playback and explains why when the API returns no seasons', async ({ mockApi, page }) => {
    const detail = `/v1/titles/tv/${meta.tvId}`;
    await mockApi({ overrides: { [detail]: { id: meta.tvId, type: 'tv', title: meta.tvTitle, seasons: [] } } });
    await page.goto(`/watch/${meta.tvId}?type=tv`);

    await expect(page.getByText('Episodes are unavailable until valid season data exists.')).toBeVisible();
    await expect(page.locator('iframe.player-frame')).toHaveCount(0);
  });

  test('reloading a deep episode link restores that episode', async ({ api, page }) => {
    fixtureOnly();
    void api;
    await page.goto(`/watch/${meta.tvId}?type=tv&season=2&episode=1`);
    await expect(page.locator('.now-title')).toContainText('S2 E1');

    await page.reload();

    await expect(page.locator('.now-title')).toContainText('S2 E1');
  });
});
