// Refreshes public/weather-cache.json, the fallback the site reads when Open-Meteo
// is unreachable. Run by .github/workflows/weather-cache.yml.
import { writeFile } from 'node:fs/promises';
import { WEATHER_URL, WIND_URL, MARINE_URL, mergeWind } from '../src/lib/openmeteo.js';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const [weather, wind, marine] = await Promise.all([
  getJson(WEATHER_URL),
  getJson(WIND_URL).catch(() => null),
  getJson(MARINE_URL).catch(() => ({ current: null })),
]);

if (weather.error) throw new Error(`API error: ${weather.reason}`);
mergeWind(weather, wind);

const cachedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
await writeFile(
  new URL('../public/weather-cache.json', import.meta.url),
  JSON.stringify({ weather, marine, cachedAt }, null, 2) + '\n',
);
console.log(`Cache updated at ${cachedAt}`);
