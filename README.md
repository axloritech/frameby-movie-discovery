# Frameby — Movie & Series Discovery

A responsive Next.js App Router interface for the documented Omegatech MovieBox-pro2 API. It displays real API-provided titles, posters, metadata and ratings; it does not ship fake production records.

## API operations used

The API reference at `https://api.omegatech.app/api.html?route=%2Fapi%2Fmovie%2FMovieBox-pro2` documents these supported actions, and the app calls only these:

- `homepage` — featured/top-pick titles.
- `trending` — paginated titles (`page` starts at 0; `perPage` is bounded by the app).
- `info` — title details by `subjectId`.
- `sources` — source/download information by `subjectId` (the UI uses the default first season/episode values only because the API's source action requires them; it does not provide an episode selector).

The API documentation does **not** document a keyword search action for `MovieBox-pro2`. The search box therefore filters the real titles already loaded into the client from homepage/trending pages; it is not a global API search. The search endpoint mentioned in the prompt belongs to a different `MovieBox-pro` route and is intentionally not guessed or silently mixed into this integration. Genre filtering is likewise performed against genre metadata in loaded API results.

Playback, episode navigation and subtitle selection are intentionally omitted: there is no documented player/episode response contract in the provided reference. Download options are requested on demand only after an authorization confirmation. Only HTTPS `proxyDownloadUrl` links on `stream.omegatech.app` are accepted; direct upstream links and arbitrary hosts are rejected. The browser opens accepted links directly. The API docs do not establish content licensing, so users must confirm rights and follow provider/local terms before accessing a link.

## Local setup

Requirements: Node.js 20.9+ and npm (Node 20 LTS or newer recommended).

```bash
npm install
cp .env.example .env.local # optional; defaults are already configured
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

`MOVIEBOX_API_BASE_URL` is optional. It defaults to:

```text
https://api.omegatech.app/api/movie/MovieBox-pro2
```

The app makes requests server-side through `/api/movies`, so the external API URL and its headers are not shipped in browser bundles. The currently documented API does not require a credential. Do not put private credentials in `NEXT_PUBLIC_*` variables.

The single API adapter lives in `lib/movie-api.ts` and centralizes the endpoint, supported action parameters, payload normalization, timeout/error handling and download URL validation. Change the base URL there (or through the environment variable) if the API host/route changes. If the API changes its response format, update the normalizers there.

## Features

- API-driven featured and trending feeds, including page loading.
- Search within titles already loaded from the API and local genre filters.
- Responsive poster cards, featured hero, rating-based picks and movie/series details.
- A local-device watchlist stored in browser `localStorage` (no account or database).
- Skeleton states, retries, empty states, malformed-response handling and safe missing-image fallbacks.
- Download link discovery gated by an explicit rights confirmation; validated proxy links are opened directly in a new tab.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Use the Next.js framework preset and Node runtime.
3. Optionally add `MOVIEBOX_API_BASE_URL` in Project Settings → Environment Variables.
4. Deploy. No database, API key or paid service is required by the documented API.

## Verify

```bash
npm run build
```

The API is external and can be rate-limited, unavailable, or return expired source URLs. The app reports request errors and does not cache API responses. The exact download host allowlist is intentionally narrow and defined in `lib/movie-api.ts`.
