import type { APIRoute } from 'astro';
import beachesData from '../data/beaches.json';
import villagesData from '../data/villages.json';
import sightsData from '../data/sights.json';

export const prerender = true;

const SITE = 'https://milos.guide';
const today = new Date().toISOString().split('T')[0];

const statics = [
  { en: '/',              el: '/el/',              priority: '1.0' },
  { en: '/beaches/',      el: '/el/beaches/',      priority: '0.9' },
  { en: '/villages/',     el: '/el/villages/',     priority: '0.9' },
  { en: '/sights/',       el: '/el/sights/',       priority: '0.9' },
  { en: '/map/',          el: '/el/map/',          priority: '0.7' },
  { en: '/how-to-reach/', el: '/el/how-to-reach/', priority: '0.7' },
  { en: '/weather/',      el: '/el/weather/',      priority: '0.6' },
  { en: '/about/',        el: '/el/about/',        priority: '0.6' },
  { en: '/search/',       el: '/el/search/',       priority: '0.5' },
  { en: '/contact/',      el: '/el/contact/',      priority: '0.4' },
  { en: '/privacy/',      el: '/el/privacy/',      priority: '0.3' },
];

function urlPair(en: string, el: string, priority: string) {
  return `  <url>
    <loc>${SITE}${en}</loc>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${en}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${en}"/>
    <xhtml:link rel="alternate" hreflang="el" href="${SITE}${el}"/>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>
  <url>
    <loc>${SITE}${el}</loc>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${en}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${en}"/>
    <xhtml:link rel="alternate" hreflang="el" href="${SITE}${el}"/>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${statics.map(s    => urlPair(s.en, s.el, s.priority)).join('\n')}
${beachesData.map(b  => urlPair(`/beaches/${b.slug}/`,  `/el/beaches/${b.slug}/`,  '0.8')).join('\n')}
${villagesData.map(v => urlPair(`/villages/${v.slug}/`, `/el/villages/${v.slug}/`, '0.8')).join('\n')}
${sightsData.map(s   => urlPair(`/sights/${s.slug}/`,   `/el/sights/${s.slug}/`,   '0.7')).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
