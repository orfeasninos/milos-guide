import type { APIRoute } from 'astro';
import beachesData from '../data/beaches.json';
import villagesData from '../data/villages.json';
import sightsData from '../data/sights.json';
import climateData from '../data/climate.json';

export const prerender = true;

const SITE = 'https://milos.guide';

// llms.txt (llmstxt.org): a Markdown map of the site for language models. Built from the same
// JSON as the sitemap so new beaches and villages show up without editing it. Restaurants and
// stays are linked by section only, since their list pages are the useful entry point.
const link = (name: string, path: string, note?: string) =>
  `- [${name}](${SITE}${path})${note ? `: ${note}` : ''}`;

export const GET: APIRoute = () => {
  const txt = `# Milos.guide

> An independent English-language travel guide to Milos, a volcanic island in the south-west Cyclades, Greece: its 70+ beaches, villages, sights, tavernas and places to stay, plus a daily check of which beaches are sheltered from the current wind.

Milos is windy in summer (the meltemi blows from the north), so which beach is calm changes day to day. The home page and each beach page rank beaches by how sheltered they are from the live wind.

## Main sections

${link('Home: where to swim today', '/', 'beaches sheltered from today\'s wind')}
${link('Beaches', '/beaches/', 'every beach, with access, facilities and which wind it faces')}
${link('Villages', '/villages/')}
${link('Sights', '/sights/')}
${link('Restaurants and tavernas', '/restaurants/')}
${link('Where to stay', '/stays/')}
${link('Weather and wind forecast', '/weather/')}
${link('How to reach Milos', '/how-to-reach/', 'ferries and flights')}
${link('Car rental', '/car-rental/')}
${link('Map', '/map/')}
${link('Search', '/search/', 'append ?q=<terms>')}

## Beaches

${beachesData.map(b => link(b.name.en, `/beaches/${b.slug}/`, b.description.en)).join('\n')}

## Villages

${villagesData.map(v => link(v.nameEn, `/villages/${v.slug}/`, v.taglineEn)).join('\n')}

## Sights

${sightsData.map(s => link(s.nameEn, `/sights/${s.slug}/`, s.taglineEn)).join('\n')}

## Optional

${climateData.map(m => link(`Milos in ${m.name}`, `/weather/${m.slug}/`, 'climate averages')).join('\n')}
${link('About Milos', '/about/')}
${link('Contact', '/contact/')}
`;

  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
