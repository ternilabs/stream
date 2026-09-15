import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test as base, expect, type Page, type Route } from '@playwright/test';

// claude-opus-5: Read rather than imported, so the fixtures need no JSON module resolution.
const read = (name: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf8'));

const fixtures = read('api.json') as Record<string, any>;

// claude-opus-5: Cards link to titles we did not capture individually. Rather than snapshot every
// id, synthesise a detail response from the list entry so navigation works anywhere in the app.
const listIndex = new Map<number, any>();
for (const [key, value] of Object.entries(fixtures)) {
  if (!Array.isArray(value?.data)) continue;
  for (const item of value.data) listIndex.set(item.id, item);
  void key;
}
for (const value of Object.values(fixtures)) {
  for (const item of (value as any)?.recommended ?? []) listIndex.set(item.id, item);
}

function synthesiseTitle(pathname: string) {
  const match = /^\/v1\/titles\/(movie|tv)\/(\d+)$/.exec(pathname);
  if (!match) return undefined;
  const [, type, rawId] = match;
  const id = Number(rawId);
  const listed = listIndex.get(id);
  if (!listed) return undefined;
  return {
    id,
    type,
    title: listed.title,
    year: listed.year ?? null,
    cover: listed.cover ?? null,
    rating: listed.rating,
    description: `Synthesised fixture detail for ${listed.title}.`,
    genres: ['Drama'],
    production: ['Fixture Studio'],
    cast: [],
    recommended: [],
    ...(type === 'tv'
      ? { seasons: [{ seasonNumber: 1, title: 'Season 1', episodeCount: 1, episodes: [{ episodeNumber: 1, title: 'Episode 1', aired: null }] }] }
      : {}),
  };
}
export const meta = read('meta.json') as {
  movieId: number; movieTitle: string; movieCastCount: number; movieRecommendedCount: number;
  tvId: number; tvTitle: string; tvSeasons: number[]; tvSeasonTitles: string[]; tvFirstSeasonEpisodes: number;
  searchTotalPages: number; searchPageSize: number; sourcesUp: number; sourcesTotal: number;
};

export { expect };

export const IS_LIVE = process.env.E2E_LIVE === '1';

/**
 * claude-opus-5: Assertions that depend on the exact contents of the captured fixtures. Trending
 * lists change daily upstream, so these are skipped when the suite is pointed at the live API.
 */
export function fixtureOnly(reason = 'depends on captured fixture data') {
  base.skip(IS_LIVE, reason);
}

type Store = Record<string, unknown>;

export interface MockOptions {
  /** Hold every response for this long. Must stay under the api-client's 4s abort timeout. */
  delayMs?: number;
  /** Respond with this status for paths matching the predicate. */
  failWith?: { status: number; when?: (path: string) => boolean };
  /** Replace or add fixture entries, keyed exactly as `pathname + search`. */
  overrides?: Store;
}

export class ApiMock {
  private released: Promise<void> | null = null;
  private release: () => void = () => undefined;

  constructor(private readonly page: Page, private readonly options: MockOptions = {}) {}

  /** Hold all API responses until `letThrough()` is called, so the loading state can be measured. */
  gate(): this {
    this.released = new Promise((resolve) => { this.release = () => resolve(); });
    return this;
  }

  letThrough(): void {
    this.release();
  }

  async install(): Promise<void> {
    if (IS_LIVE) return;
    const store: Store = { ...(fixtures as Store), ...(this.options.overrides ?? {}) };

    await this.page.route('**/v1/**', async (route: Route) => {
      const url = new URL(route.request().url());
      const key = `${url.pathname}${url.search}`;

      if (this.released) await this.released;
      if (this.options.delayMs) await new Promise((r) => setTimeout(r, this.options.delayMs));

      const failure = this.options.failWith;
      if (failure && (failure.when?.(key) ?? true)) {
        return route.fulfill({
          status: failure.status,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'mocked', message: 'Mocked failure' } }),
        });
      }

      const body = store[key] ?? synthesiseTitle(url.pathname);
      if (body === undefined) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'no-fixture', message: `No fixture for ${key}` } }),
        });
      }

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
  }
}

export const test = base.extend<{ api: ApiMock; mockApi: (options?: MockOptions) => Promise<ApiMock> }>({
  api: async ({ page }, use) => {
    const mock = new ApiMock(page);
    await mock.install();
    await use(mock);
  },
  // Use when a spec needs delays, failures, or overrides; it replaces the default mock.
  mockApi: async ({ page }, use) => {
    await use(async (options: MockOptions = {}) => {
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      // claude-opus-5: The app caches responses in localStorage for the day, so a reconfigured
      // mock would otherwise be shadowed by whatever the previous navigation cached.
      await page.evaluate(() => localStorage.clear()).catch(() => undefined);
      const mock = new ApiMock(page, options);
      await mock.install();
      return mock;
    });
  },
});

export interface Box {
  width: number;
  height: number;
}

/** Bounding box of the first match, or null when the element is absent. */
export async function boxOf(page: Page, selector: string): Promise<Box | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
  }, selector);
}

/** claude-opus-5: Sub-pixel rounding across a reflow is tolerable; anything larger is a visible jump. */
export const SHIFT_TOLERANCE = 4;

/** One side of a load transition: what proves the phase is rendered, and what to measure. */
export interface LoadPhase {
  /** Awaited before measuring, so a measurement cannot race the render. */
  ready: string;
  /** Measured once `ready` is visible. */
  measure: string;
}

export interface LoadMeasurement {
  pending: Box;
  settled: Box;
}

export interface LoadProbe {
  path: string;
  pending: LoadPhase;
  settled: LoadPhase;
}

async function measurePhase(page: Page, phase: LoadPhase): Promise<Box> {
  await expect(page.locator(phase.ready).first()).toBeVisible();
  const box = await boxOf(page, phase.measure);
  if (!box) throw new Error(`No element matched "${phase.measure}" while measuring`);
  return box;
}

/**
 * claude-opus-5: Holds the API response, measures the placeholder, releases, and measures the content that
 * replaces it. Every layout-shift assertion needs this same sequence, so it lives here once
 * rather than in each spec.
 */
export async function measureAcrossLoad(
  page: Page,
  openMock: (options?: MockOptions) => Promise<ApiMock>,
  probe: LoadProbe,
): Promise<LoadMeasurement> {
  const api = (await openMock()).gate();
  await page.goto(probe.path);

  const pending = await measurePhase(page, probe.pending);
  api.letThrough();
  const settled = await measurePhase(page, probe.settled);

  return { pending, settled };
}

/** Placeholder and content must occupy the same box, within `tolerance` pixels on both axes. */
export function expectNoShift({ pending, settled }: LoadMeasurement, tolerance = SHIFT_TOLERANCE): void {
  const describe = (axis: string) => `${axis} shifted: ${pending.width}x${pending.height} -> ${settled.width}x${settled.height}`;
  expect(Math.abs(pending.height - settled.height), describe('height')).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(pending.width - settled.width), describe('width')).toBeLessThanOrEqual(tolerance);
}



/**
 * claude-opus-5: Blocks until the webfont is actually usable. Text metrics decide whether the
 * watch page's description is clamped, so an assertion about that made mid-swap is racing.
 */
export async function waitForFonts(page: Page): Promise<void> {
  await page.waitForFunction(() => document.fonts.check('13px "Red Hat Text Variable"'));
}

export const DISCLAIMER = 'This site is not affiliated with, endorsed by, or connected to any streaming platform.';
