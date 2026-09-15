import { expect, fixtureOnly, meta, test, waitForFonts } from './support/test';

test.describe('watch — movie', () => {
  test.beforeEach(async ({ api, page }) => {
    void api;
    await page.goto(`/watch/${meta.movieId}?type=movie`);
  });

  test('renders the player iframe pointed at the selected source', async ({ page }) => {
    const frame = page.locator('iframe.player-frame');
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute('src', /^https?:\/\/.+/);
    await expect(frame).toHaveAttribute('allow', 'autoplay; fullscreen *; picture-in-picture; encrypted-media');
    await expect(frame).toHaveAttribute('allowfullscreen', 'true');
  });

  test('shows the title, production, year, and rating', async ({ page }) => {
    fixtureOnly();
    await expect(page.locator('.detail-title')).toHaveText(meta.movieTitle);
    await expect(page.locator('.detail-facts')).toContainText('Production');
    await expect(page.locator('.detail-facts')).toContainText('Year');
    await expect(page.locator('.detail-facts')).toContainText('Rating');
  });

  test('shows a single production company, not the whole list', async ({ page }) => {
    const value = page.locator('.detail-facts .fact-value').first();
    await expect(value).toBeVisible();
    expect((await value.textContent()) ?? '').not.toContain(',');
  });

  test('offers no season picker for a movie', async ({ page }) => {
    await expect(page.locator('.season-episode-panel')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Season' })).toHaveCount(0);
  });

  test('switching server changes the iframe source', async ({ page }) => {
    const frame = page.locator('iframe.player-frame');
    await expect(frame).toBeVisible();
    const before = await frame.getAttribute('src');

    await page.getByRole('button', { name: 'Server' }).click();
    const options = page.getByRole('option');
    await options.nth(1).click();

    await expect(frame).not.toHaveAttribute('src', before ?? '');
  });

  test('expands and collapses the cast list', async ({ page }) => {
    fixtureOnly();
    await expect(page.locator('.character-row').first()).toBeVisible();
    await expect(page.locator('.character-row')).toHaveCount(4);

    await page.getByRole('button', { name: 'View all characters' }).click();
    await expect(page.locator('.character-row')).toHaveCount(meta.movieCastCount);

    await page.getByRole('button', { name: 'Show fewer characters' }).click();
    await expect(page.locator('.character-row')).toHaveCount(4);
  });

  test('caps recommendations at twelve and links them onward', async ({ page }) => {
    fixtureOnly();
    await expect(page.locator('.reco-grid .card').first()).toBeVisible();
    await expect(page.locator('.reco-grid .card')).toHaveCount(12);

    const title = (await page.locator('.reco-grid .card .title').first().textContent())?.trim() ?? '';
    await page.locator('.reco-grid .card a').first().click();

    await expect(page.locator('.detail-title')).toHaveText(title);
  });

  test('opens the trailer in a new tab', async ({ page }) => {
    fixtureOnly();
    const trailer = page.getByRole('link', { name: /Open trailer/ });
    await expect(trailer).toBeVisible();
    await expect(trailer).toHaveAttribute('target', '_blank');
    await expect(trailer).toHaveAttribute('rel', /noreferrer/);
  });

  test('expands a truncated description', async ({ page }) => {
    fixtureOnly();
    // claude-opus-5: Whether this description is clamped depends on the loaded font's metrics, so
    // the assertion has to wait until the webfont is actually usable.
    await waitForFonts(page);
    const seeMore = page.getByRole('button', { name: 'See more description' });
    await expect(seeMore).toBeVisible();
    await expect(page.locator('.summary-text')).toHaveClass(/collapsed/);

    await seeMore.click();

    await expect(page.locator('.summary-text')).not.toHaveClass(/collapsed/);
    await expect(page.getByRole('button', { name: 'See less description' })).toBeVisible();
  });

  test('keeps the metadata but blocks playback when no server is up', async ({ mockApi, page }) => {
    await mockApi({
      overrides: {
        '/v1/sources': { checkedAt: null, sources: [{ id: 'mapple', name: 'Mapple', isUp: false }] },
      },
    });
    await page.goto(`/watch/${meta.movieId}?type=movie`);

    await expect(page.getByRole('status', { name: 'Servers unavailable' })).toBeVisible();
    await expect(page.locator('iframe.player-frame')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Server' })).toHaveCount(0);
    await expect(page.locator('.detail-title')).toBeVisible();
  });

  test('never shows the TV-only episode message on a movie', async ({ mockApi, page }) => {
    await mockApi({
      overrides: { '/v1/sources': { checkedAt: null, sources: [{ id: 'mapple', name: 'Mapple', isUp: false }] } },
    });
    await page.goto(`/watch/${meta.movieId}?type=movie`);

    await expect(page.getByText('Episodes are unavailable until valid season data exists.')).toHaveCount(0);
  });

  test('shows the failure state when title metadata fails', async ({ mockApi, page }) => {
    await mockApi({ failWith: { status: 500, when: (path) => path.startsWith('/v1/titles') } });
    await page.goto(`/watch/${meta.movieId}?type=movie`);

    await expect(page.getByRole('status', { name: 'Something went wrong' })).toBeVisible();
    await expect(page.getByLabel('Player area')).toHaveCount(0);
  });
});
