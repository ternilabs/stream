import { expect, fixtureOnly, meta, test } from './support/test';

test.describe('settings dialog', () => {
  test.beforeEach(async ({ api, page }) => {
    void api;
    await page.goto('/');
  });

  test('opens from the header and lists every source with a status', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();

    const dialog = page.getByRole('dialog', { name: 'Settings' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.server-row').first()).toBeVisible();
  });

  test('shows one row per registered source', async ({ page }) => {
    fixtureOnly();
    await page.getByRole('button', { name: 'Settings' }).click();

    await expect(page.locator('.server-row')).toHaveCount(meta.sourcesTotal);
    await expect(page.locator('.server-status.online')).toHaveCount(meta.sourcesUp);
  });

  // claude-opus-5: `body.modal-open { overflow: hidden }` was in the stylesheet but nothing set
  // the class, so the page scrolled behind the dialog.
  test('locks background scrolling while open and restores it on close', async ({ page }) => {
    await expect(page.locator('body')).not.toHaveClass(/modal-open/);

    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('body')).toHaveClass(/modal-open/);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

    await page.getByRole('button', { name: 'Close settings' }).click();
    await expect(page.locator('body')).not.toHaveClass(/modal-open/);
  });

  test('closes on Escape and on a backdrop click', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Settings' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.locator('.modal-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole('dialog', { name: 'Settings' })).toHaveCount(0);
  });

  test('asks for confirmation before clearing storage, and cancelling keeps it', async ({ page }) => {
    await page.getByPlaceholder('Search any title...').fill('matrix');
    await expect(page.locator('.result-row').first()).toBeVisible();
    await page.getByRole('button', { name: /View all results/ }).click();
    await page.goto('/');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Clear local storage' }).click();

    await expect(page.getByRole('alertdialog', { name: 'Clear local storage?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);

    const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('stream:')));
    expect(keys.length).toBeGreaterThan(0);
  });

  test('confirming removes every app-owned key and closes both dialogs', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('other-app:key', 'keep'));
    await page.getByPlaceholder('Search any title...').fill('matrix');
    await expect(page.locator('.result-row').first()).toBeVisible();
    await page.getByRole('button', { name: /View all results/ }).click();
    await page.goto('/');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Clear local storage' }).click();
    await page.getByRole('button', { name: 'Clear storage' }).click();

    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Settings' })).toHaveCount(0);

    const state = await page.evaluate(() => ({
      stream: Object.keys(localStorage).filter((k) => k.startsWith('stream:')),
      other: localStorage.getItem('other-app:key'),
    }));
    expect(state.stream).toEqual([]);
    expect(state.other).toBe('keep');
  });

  test('shows the shared unavailable copy when source health cannot be read', async ({ mockApi, page }) => {
    await mockApi({ failWith: { status: 500, when: (path) => path.startsWith('/v1/sources') } });
    await page.goto('/');

    await page.getByRole('button', { name: 'Settings' }).click();

    const unavailable = page.locator('.server-unavailable');
    await expect(unavailable).toContainText('Servers unavailable');
    await expect(unavailable).toContainText('No streaming servers are available right now. Please try again later.');
  });
});
