// Server-only: reads public/weather-cache.json at build time. The deploy fetches it just
// before building (and again on each cron rebuild), so prerendered weather lags the real
// sky by at most one rebuild interval. Null locally without a cache or when the fetch failed.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface WeatherCache {
  weather: any;
  marine: any;
  air: any;
  cachedAt: string;
}

let memo: WeatherCache | null | undefined;

export function readWeatherCache(): WeatherCache | null {
  if (memo !== undefined) return memo;
  try {
    const c = JSON.parse(readFileSync(join(process.cwd(), 'public', 'weather-cache.json'), 'utf8'));
    memo = c?.weather?.current ? { marine: { current: null }, air: { current: null }, ...c } : null;
  } catch {
    memo = null;
  }
  return memo ?? null;
}
