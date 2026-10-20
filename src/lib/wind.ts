// Wind exposure logic shared by the "Best beaches today" widget and beach pages.
// Each beach has `faces`: the compass bearing (deg) it looks out to sea, i.e. the
// wind direction that blows straight onshore. Open-Meteo reports wind as the
// direction it blows FROM, so a small angle between the two means waves on the beach.

export type Exposure = 'calm' | 'sheltered' | 'partial' | 'exposed';

export interface Wind {
  speed: number;      // km/h
  direction: number;  // degrees, direction the wind blows from
  time: string;       // ISO local time of the reading
  source: 'live' | 'cache';
}

export const CALM_KMH = 12;
// Below this the reported direction is model noise, so we don't show it.
export const VARIABLE_KMH = 4;
export const BOAT_TOUR_LIMIT_KMH = 28;

const LAT = 36.7257;
const LNG = 24.4496;
// ECMWF IFS 9 km: same source as /weather and the cache workflow (best_match reads
// near-zero with a random direction around Milos).
const SESSION_KEY = 'mg-wind-v2';
const SESSION_TTL = 30 * 60 * 1000;

export function angleDiff(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

export function exposure(faces: number, wind: Pick<Wind, 'speed' | 'direction'>): Exposure {
  if (wind.speed < CALM_KMH) return 'calm';
  const d = angleDiff(faces, wind.direction);
  if (d >= 110) return 'sheltered';
  if (d >= 60) return 'partial';
  return 'exposed';
}

// 1 = flat water, 0 = full onshore wind at 40+ km/h
export function shelterScore(faces: number, wind: Pick<Wind, 'speed' | 'direction'>): number {
  const onshore = Math.max(0, Math.cos((angleDiff(faces, wind.direction) * Math.PI) / 180));
  return 1 - onshore * Math.min(1, wind.speed / 40);
}

export function compass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// Compass arrows point where the wind blows TO (meteo.gr convention): a south wind
// draws an arrow pointing north. The arrow is drawn pointing up (N) at 0deg.
export function arrowRotation(fromDeg: number): number {
  return (((fromDeg + 180) % 360) + 360) % 360;
}

export function beaufort(kmh: number): number {
  const limits = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
  const i = limits.findIndex(l => kmh < l);
  return i === -1 ? 12 : i;
}

export const exposureLabel: Record<Exposure, string> = {
  calm: 'Calm',
  sheltered: 'Sheltered',
  partial: 'Side wind',
  exposed: 'Exposed',
};

async function fetchLive(): Promise<Wind> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}` +
        `&current=wind_speed_10m,wind_direction_10m&timezone=Europe%2FAthens&models=ecmwf_ifs`,
      { signal: ctrl.signal },
    );
    const c = (await res.json()).current;
    if (typeof c?.wind_speed_10m !== 'number') throw new Error('bad payload');
    return { speed: c.wind_speed_10m, direction: c.wind_direction_10m, time: c.time, source: 'live' };
  } finally {
    clearTimeout(tid);
  }
}

async function fetchCache(): Promise<Wind> {
  const res = await fetch('/weather-cache.json', { cache: 'no-cache' });
  const c = (await res.json()).weather?.current;
  if (typeof c?.wind_speed_10m !== 'number') throw new Error('bad cache');
  return { speed: c.wind_speed_10m, direction: c.wind_direction_10m, time: c.time, source: 'cache' };
}

let pending: Promise<Wind> | null = null;

// Lets the /weather page hand its own reading to the widget so both show the same wind.
export function rememberWind(wind: Wind): void {
  pending = Promise.resolve(wind);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ at: Date.now(), wind }));
  } catch {}
}

// Live reading first, committed cache as fallback; memoised per page and per tab session.
export function getWind(): Promise<Wind> {
  if (pending) return pending;
  pending = (async () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
      if (saved && Date.now() - saved.at < SESSION_TTL) return saved.wind as Wind;
    } catch {}
    const wind = await fetchLive().catch(fetchCache);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ at: Date.now(), wind }));
    } catch {}
    return wind;
  })();
  pending.catch(() => { pending = null; });
  return pending;
}
