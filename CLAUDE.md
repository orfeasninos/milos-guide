# CLAUDE.md

Milos.guide (https://milos.guide): a static travel guide to Milos, Greece, built with Astro 7 and deployed to GitHub Pages. No backend, no UI framework, no CSS framework. Pages are `.astro` files with scoped `<style>` blocks and small vanilla `<script>`s.

## Commands

- `npm run dev`: dev server at localhost:4321
- `npm run build`: static build to `dist/`
- `npm run preview`: serve the build
- `npx astro check`: type-check (there is no test suite or linter)
- `node check-seo.cjs`: after a build, scans `dist/**/index.html` for missing, short or duplicate titles and meta descriptions
- `npm run weather:cache`: writes `public/weather-cache.json` (gitignored, generated at deploy)
- `node scripts/convert-images.mjs`: makes `-800w/-1200w/-1920w` WebP and AVIF variants for every jpg/png in `public/images/beaches` and `public/images/taverns`. It skips variants that already exist.
- `npm run fetch:hotels`: CJ Affiliate GraphQL fetch, needs `CJ_API_KEY` and `CJ_COMPANY_ID` in `.env`. Its output (`src/data/cj-hotels.json`) is not used by any page.

Node >= 22 (`.nvmrc`: 22).

## Deploy

`.github/workflows/deploy.yml` builds with `withastro/action` on every push to `main`. It also rebuilds four times a day on a cron schedule to keep the weather fallback cache fresh. If fetching the weather cache fails, the build still deploys. `public/CNAME` sets the domain.

## Layout

- `src/data/*.json`: all content (beaches, restaurants, sights, stays, villages). Detail pages are generated from these with `getStaticPaths` in `src/pages/<section>/[slug].astro`. Each section also has an `index.astro` with client-side filters.
- `src/lib/`: shared helpers, one module per domain:
  - `beaches.ts`: the `Beach` type, coast area computed from coordinates (`location.area` is always "Milos"), and `POPULAR_BEACHES` ordering
  - `restaurants.ts`, `stays.ts`: sorted lists, type and service labels, Maps and Booking links
  - `wind.ts`: wind exposure per beach, using the beach's `faces` bearing against the wind's from-direction. Used by `WindBeaches.astro` and the beach `WindCheck`.
  - `openmeteo.js`: the only place Open-Meteo URLs are defined. It is plain JS so the Node cache script can import it too. Wind comes from ECMWF IFS (`mergeWind`) and everything else from `best_match`.
  - `public-files.ts`: build-time `fs` checks for photos in `/public`. **Server-only**, never import it from a client script. Do not swap it for `import.meta.glob`, which would copy every image into `_astro/` as well.
  - `seo.ts` (`metaDescription` trims to 160 chars), `booking.ts` (CJ → Booking.com links, with `sid` tagging the source page), `kiwi.ts` (Travelpayouts flights), `basemap.ts` (CARTO tiles, with the key added only in PROD because it is domain-locked)
- `src/layouts/Layout.astro`: the single layout. It renders the head/meta, canonical URL, the BreadcrumbList and WebSite JSON-LD graph (pages pass extra schema through the `jsonld` prop), nav, footer, global styles and the Umami script.
- `src/components/`: `home/*` and `beach/*` hold sections of the home page and the beach detail page. `SmartImage.astro` renders `<picture>` with AVIF/WebP srcsets when the variant files exist in `/public`.
- `src/pages/sitemap.xml.ts`: a hand-maintained sitemap. When you add a static page, add it to `statics` there.
- `src/pages/weather.astro` + `src/scripts/weather.js` + `src/styles/weather.css`: the live forecast. It fetches Open-Meteo in the browser and falls back to `/weather-cache.json`.
- Maps (`/map`, the beaches map view) load Leaflet and markercluster from cdnjs at runtime. They are not npm dependencies.

## Conventions

- The site is English-only in practice. Data has `{ en, el }` name/description pairs (sights and villages use `name`/`nameEn` fields instead), and `Layout` supports `lang="el"` with an `/el` prefix, but no `/el` pages exist. `src/i18n/index.ts` is not imported anywhere.
- Photos: beaches are `/public/images/beaches/<slug>.jpg`. Restaurants and stays use the `localPhoto` path from JSON (`/images/taverns/…`, `/images/accommodations/…`). Those folders are mostly empty, and the pages show no photo until the user adds their own. Never fetch, cache or restore Google Places photos (Places API ToS).
- Opening hours are deliberately not stored. Restaurants have a `service` category and link to Google Maps for today's hours.
- Outbound affiliate and CTA links carry `data-umami-event` (and `data-umami-event-*`) attributes for analytics. Keep them when editing links, and use `rel="noopener sponsored"` on affiliate links.
- Comments explain *why* (API quirks, ToS, SEO reasons). Match that style.
- The user commits changes themselves. Do not `git commit`.
