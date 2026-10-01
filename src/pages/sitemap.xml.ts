import type { APIRoute } from 'astro';
import beachesData from '../data/beaches.json';
import villagesData from '../data/villages.json';
import sightsData from '../data/sights.json';

export const prerender = true;

const SITE = 'https://milos.guide';
const today = new Date().toISOString().split('T')[0];

const statics = [
  { en: '/',              priority: '1.0' },
  { en: '/beaches/',      priority: '0.9' },
  { en: '/villages/',     priority: '0.9' },
  { en: '/sights/',       priority: '0.9' },
  { en: '/map/',          priority: '0.7' },
  { en: '/how-to-reach/', priority: '0.7' },
  { en: '/weather/',      priority: '0.6' },
  { en: '/about/',        priority: '0.6' },
  { en: '/search/',       priority: '0.5' },
  { en: '/contact/',      priority: '0.4' },
  { en: '/privacy/',      priority: '0.3' },
];

function urlPair(en: string, priority: string) {
  return `  <url>
    <loc>${SITE}${en}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${statics.map(s    => urlPair(s.en, s.priority)).join('\n')}
${beachesData.map(b  => urlPair(`/beaches/${b.slug}/`,  '0.8')).join('\n')}
${villagesData.map(v => urlPair(`/villages/${v.slug}/`, '0.8')).join('\n')}
${sightsData.map(s   => urlPair(`/sights/${s.slug}/`,   '0.7')).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
