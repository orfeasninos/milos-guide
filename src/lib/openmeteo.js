// Single source for the Open-Meteo requests. Plain JS so the cache script
// (scripts/update-weather-cache.mjs) can import it with Node as well as the site.

export const LAT = 36.7257;
export const LNG = 24.4496;

const BASE = `latitude=${LAT}&longitude=${LNG}&timezone=Europe%2FAthens`;

export const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?${BASE}` +
  `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index,relative_humidity_2m` +
  `&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability` +
  `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset` +
  `&forecast_days=7&models=best_match`;

// Wind comes from ECMWF IFS (9 km, grid point on Milos): closer to meteo.gr than
// best_match, which reads near-zero with a random direction around the island.
// ECMWF has no UV index, so everything else stays on best_match.
export const WIND_URL =
  `https://api.open-meteo.com/v1/forecast?${BASE}` +
  `&current=wind_speed_10m,wind_direction_10m` +
  `&hourly=wind_speed_10m,wind_direction_10m` +
  `&forecast_days=7&models=ecmwf_ifs`;

export const CURRENT_WIND_URL =
  `https://api.open-meteo.com/v1/forecast?${BASE}` +
  `&current=wind_speed_10m,wind_direction_10m&models=ecmwf_ifs`;

export const MARINE_URL =
  `https://marine-api.open-meteo.com/v1/marine?${BASE}` +
  `&current=wave_height,sea_surface_temperature&forecast_days=1`;

/**
 * Overwrite best_match wind with the ECMWF reading, matching hourly rows by time.
 * @param {any} w   best_match forecast (mutated)
 * @param {any} wind ECMWF forecast, may be null
 */
export function mergeWind(w, wind) {
  if (typeof wind?.current?.wind_speed_10m !== 'number') return;
  w.current.wind_speed_10m = wind.current.wind_speed_10m;
  w.current.wind_direction_10m = wind.current.wind_direction_10m;
  const byTime = new Map(wind.hourly?.time?.map((/** @type {string} */ t, /** @type {number} */ i) => [t, i]) ?? []);
  w.hourly.wind_direction_10m ??= [];
  w.hourly.time.forEach((/** @type {string} */ t, /** @type {number} */ i) => {
    const j = byTime.get(t);
    if (j === undefined || wind.hourly.wind_speed_10m[j] == null) return;
    w.hourly.wind_speed_10m[i] = wind.hourly.wind_speed_10m[j];
    w.hourly.wind_direction_10m[i] = wind.hourly.wind_direction_10m[j];
  });
}
