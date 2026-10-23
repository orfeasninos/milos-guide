# Milos.guide

A static travel guide to Milos, Greece: beaches, restaurants, sights, stays, villages, a live weather and wind forecast, and an interactive map.

Live at **https://milos.guide**.

Built with [Astro](https://astro.build) and deployed to GitHub Pages. There is no backend, no UI framework and no CSS framework. Pages are `.astro` files with scoped styles and small vanilla scripts.

## Getting started

Requires Node 22 or newer (see `.nvmrc`).

```sh
npm install
npm run dev        # http://localhost:4321
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site to `dist/` |
| `npm run preview` | Serve the built site locally |
| `npx astro check` | Type-check the project |
| `node check-seo.cjs` | After a build, report missing, short or duplicate titles and meta descriptions |
| `npm run weather:cache` | Write the weather fallback file `public/weather-cache.json` (gitignored) |
| `node scripts/convert-images.mjs` | Generate 800/1200/1920px WebP and AVIF variants for beach and tavern photos |
| `npm run fetch:hotels` | Fetch hotels from CJ Affiliate (needs `CJ_API_KEY` and `CJ_COMPANY_ID` in `.env`) |

There is no test suite or linter. Run `npx astro check` and a build before pushing.

## Project structure

```
src/
  data/         Content as JSON: beaches, restaurants, sights, stays, villages
  pages/        Routes. Each section has index.astro and [slug].astro detail pages
  lib/          Shared helpers (types, sorting, links, wind exposure, Open-Meteo, SEO)
  layouts/      Layout.astro: head, meta, JSON-LD, nav, footer, analytics
  components/   home/* and beach/* page sections, SmartImage for responsive photos
  scripts/      Client-side scripts (weather)
  styles/       Page CSS (weather)
public/         Static files and photos, served as-is
scripts/        Node scripts for images, weather cache and affiliate data
```

## Editing content

All content lives in `src/data/*.json`. Detail pages are generated from these files at build time, so adding an entry adds a page.

- **Beach photos** go in `public/images/beaches/<slug>.jpg`. Run `node scripts/convert-images.mjs` afterwards to create the responsive variants.
- **Restaurant and stay photos** go at the `localPhoto` path set in the JSON entry. Use only your own or owner-supplied photos. Google Places photos must not be downloaded or cached, per the Places API terms.
- **Opening hours** are not stored for regular listings. Pages link to Google Maps instead. Paid partner listings in `restaurants.json` can carry owner-supplied hours, photos and a reservation link.
- **New static pages** must be added to the `statics` list in `src/pages/sitemap.xml.ts`.

## Weather and maps

The `/weather` page fetches the forecast from [Open-Meteo](https://open-meteo.com) in the browser. Wind uses the ECMWF IFS model. If the live request fails, the page falls back to `/weather-cache.json`, which is generated at deploy time. The same wind data drives the "which beaches are sheltered today" feature.

Maps use Leaflet and markercluster loaded from cdnjs, with CARTO base tiles.

## Deployment

Every push to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`. The workflow also rebuilds four times a day to keep the weather cache fresh. A failed weather fetch does not block the deploy. The custom domain is set in `public/CNAME`.

## Affiliate links and analytics

Outbound affiliate and call-to-action links carry `data-umami-event` attributes for [Umami](https://umami.is) analytics. Affiliate links use `rel="noopener sponsored"`. Keep both when editing links.
