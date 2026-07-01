<!-- prettier-ignore -->
<div align="center">

# TerniLabs Stream

**A lightweight, educational streaming metadata browser for movies and TV series.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Preact](https://img.shields.io/badge/Preact-673ab8?style=flat-square&logo=preact&logoColor=white)](https://preactjs.com)
[![Vite](https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-TerniLabs-blue?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.3-71d083?style=flat-square)](#)

[Overview](#overview) • [Features](#features) • [Getting started](#getting-started) • [Usage](#usage) • [Architecture](#architecture) • [Configuration](#configuration) • [Disclaimer](#disclaimer)

</div>

## Overview

TerniLabs Stream is a single-page web app built with [Preact](https://preactjs.com) and [Vite](https://vitejs.dev) that browses movie and TV metadata and routes playback to one of 18 third-party embed providers. It is a client for a separate `stream-api` service: this repository contains the UI only.

The app is designed as a fast, dependency-light reference implementation for a catalog browser. It uses Preact Signals for fine-grained reactivity, [preact-iso](https://github.com/preactjs/preact-iso) for client-side routing, and a 24-hour localStorage cache layer that keeps the upstream API inside its free-tier rate limit.

> [!IMPORTANT]
> This project is intended **for educational and private use only**. The developer does not condone or encourage copyright infringement. TerniLabs does not store or host any media. All streams are served by third-party providers that are not affiliated with, endorsed by, or connected to this project.

## Features

- **Three routes** — Home (`/`), Search (`/search`), Watch (`/watch/:id`).
- **Home page** — four paged sections (Trending Movies, Trending TV, Top Rated Movies, Top Rated TV) with skeleton loading and viewport-aware card counts (6 / 4 / 2 by breakpoint).
- **Search** — debounced quick-search panel with up to 6 results, recent searches (max 5, deduplicated, individually removable), and a dedicated `/search` route with All / TV / Movie filter and first/prev/next/last pagination.
- **Watch page** — server selector, TV season and episode pickers populated from API metadata, detail card, trailer link, up to 12 recommendations, and expandable description and cast lists.
- **Settings dialog** — live source health indicators merged from the API snapshot, with a confirmed local-storage clear action.
- **Daily cache** — 24-hour localStorage cache that transparently reuses API responses.
- **Rate-limit friendly** — daily-resetting Ko-fi donation prompt shown when the API returns 429, with no extra request cost.
- **Accessibility** — `aria-expanded`, `aria-current`, listbox / option semantics on all custom dropdowns, and `prefers-reduced-motion` respected on shimmer and spinners.
- **Responsive** — 6 / 4 / 2 column media grids and a mobile-only search overlay with scrim and Escape-to-close.

## Tech stack

| Concern | Choice |
| --- | --- |
| UI runtime | [Preact](https://preactjs.com) `10.x` |
| Reactivity | [`@preact/signals`](https://github.com/preactjs/signals) + [`@preact-signals/query`](https://github.com/preact-iso) |
| Routing | [`preact-iso`](https://github.com/preactjs/preact-iso) |
| Icons | [`preact-feather`](https://github.com/feathericons/react-feather) |
| Fonts | [`@fontsource-variable/red-hat-*`](https://fontsource.org) (Display, Text, Mono) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Build tool | [Vite](https://vitejs.dev) `8.x` |
| Language | [TypeScript](https://www.typescriptlang.org) `6.x` (strict) |
| Tests | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) + [jsdom](https://github.com/jsdom/jsdom) |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org)
- [npm](https://www.npmjs.com) (ships with Node)
- A reachable `stream-api` instance — see [Configuration](#configuration)

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

The app starts on `http://localhost:5173` (Vite default) and binds to `0.0.0.0` for LAN access.

### Build for production

```bash
npm run build
```

The static bundle is emitted to `dist/`. Serve it with any static host — `_redirects` is already configured for SPA fallback (`/* /index.html 200`), so it works on hosts like Netlify and Cloudflare Pages out of the box.

### Preview the production build

```bash
npm run preview
```

### Type-check and test

```bash
npm run typecheck   # tsc -b, no emit
npm test            # vitest run
npm run test:watch  # vitest watch mode
```

## Usage

### Routes

| Path | Component | Purpose |
| --- | --- | --- |
| `/` | `HomePage` | Four paged catalog rails with skeleton loading. |
| `/search` | `SearchPage` | Full search with type filter, pagination, and URL-synced state. |
| `/watch/:id` | `WatchPage` | Player, server selector, TV picker, details, recommendations, cast, trailer; invalid watch routes render a centered invalid state. |

### Query parameters

| Route | Param | Purpose |
| --- | --- | --- |
| `/search` | `q` | Search query. |
| `/search` | `type` | `multi` (default), `tv`, or `movie`. |
| `/search` | `page` | 1-based page index. |
| `/watch/:id` | `id` | Must be a positive integer. Invalid IDs render the invalid watch state without calling the API. |
| `/watch/:id` | `type` | `movie` (default when omitted) or `tv`. Unsupported values render the invalid watch state without calling the API. |
| `/watch/:id` | `season`, `episode` | Used when `type=tv`. Invalid values are normalized to the first valid season and episode from the API. |

### Keyboard and pointer

- **Esc** closes the mobile search overlay and the search panel.
- **Click outside** the search panel closes it.
- The search input debounces by 500 ms; stale responses from earlier requests are dropped.

## Architecture

```
src/
├── app.tsx                # LocationProvider + ErrorBoundary + Router
├── main.tsx               # Preact render entry point
├── components/            # Nav, SearchBox, MediaCard, MediaSection, etc.
├── pages/                 # HomePage, SearchPage, WatchPage
├── hooks/                 # useVisibleCount
├── lib/
│   ├── api-client.ts      # Typed fetch wrapper, 4 s timeout, single 502 retry
│   ├── embed-resolver.ts  # URL template → embed URL for 18 sources
│   ├── local-store.ts     # Versioned localStorage helpers
│   ├── queries.ts         # 24 h cache layer over the API client
│   ├── source-health.ts   # Merges registry with API health snapshot
│   ├── source-registry.ts # 18 embed providers (movie + tv templates)
│   └── types.ts           # Shared domain and API types
├── styles.css             # Tailwind v4 + design tokens
└── test/                  # Vitest setup
```

### Data flow

1. The `api-client` issues typed requests to `stream-api` with a 4 s timeout and a single retry on `502`.
2. `queries.ts` wraps every call in a versioned 24 h `localStorage` cache, so the second mount of a route or page is free.
3. `source-registry.ts` lists 18 third-party embed providers; `source-health.ts` overlays the API's health snapshot to drive the status dots in the settings dialog.
4. `embed-resolver.ts` turns `(source, { type, id, season, episode })` into the final embed URL — no media is proxied through this app.
5. The home, search, and watch pages all read through `queries.ts`, so caching is transparent.

### Source registry

Sources are static metadata in `src/lib/source-registry.ts`. Each entry declares a movie and a TV embed template with `{id}`, `{season}`, and `{episode}` placeholders. The settings dialog renders the registry merged with the API health snapshot, so a failing provider is visible without leaving the app.

## Configuration

The app reads a single environment variable at build time:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | _(empty — same origin)_ | Base URL of the `stream-api` service. |

Create a `.env` file at the project root:

```bash
# .env
VITE_API_BASE_URL=https://your-stream-api.example.com
```

> [!WARNING]
> Do not commit your `.env` file. It is already covered by `.gitignore`.

### SPA routing

`_redirects` ships a single catch-all that maps every unknown path to `index.html` with a `200` response, which is what hosts like Netlify and Cloudflare Pages need for client-side routes like `/watch/123` to refresh cleanly.

## Disclaimer

> [!CAUTION]
> TerniLabs Stream is a metadata browser and embed launcher. It does not host, store, mirror, or transcode any media. All playback is delegated to third-party providers listed in `src/lib/source-registry.ts`, which are not affiliated with, endorsed by, or connected to this project.
>
> The project is intended for educational and private use only. The developer does not condone or encourage copyright infringement. You are responsible for ensuring that your use of the third-party providers complies with their terms and with the laws of your jurisdiction.

## Support

If you find a bug or want to propose a change, please open an issue or pull request on the original GitHub repository.

Support performance improvements and independent servers through [Ko-fi](https://ko-fi.com/mkgpdev).

<sub>Developed with <strong>GPT 5.5</strong> (medium intelligence) as the brain and <strong>DeepSeek V4 Flash</strong> (medium intelligence) as the executor.</sub>
