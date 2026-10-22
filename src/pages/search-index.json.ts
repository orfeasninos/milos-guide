import type { APIRoute } from 'astro';
import { buildSearchIndex } from '../lib/search-index';

export const prerender = true;

// Fetched lazily by the header search box, so the index isn't inlined into every page.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
