// Formatting shared by /weather's client script and its build-time render. Plain JS like
// openmeteo.js; the page prerenders from the deploy's weather-cache.json so crawlers and
// first paint get real numbers, then the client swaps in the live reading with the same markup.
import { compass, VARIABLE_KMH } from './wind';

export const WMO_TEXT = {
  0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
  45:'Foggy',48:'Foggy',
  51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',
  61:'Light rain',63:'Rain',65:'Heavy rain',
  71:'Light snow',73:'Snow',75:'Heavy snow',
  80:'Showers',81:'Heavy showers',82:'Violent showers',
  95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm',
};

/** @param {number} uv */
export function uvLevel(uv) {
  if (uv <= 2)  return ['Low', 'No protection needed'];
  if (uv <= 5)  return ['Moderate', 'Wear SPF 30+'];
  if (uv <= 7)  return ['High', 'SPF 50+ recommended'];
  if (uv <= 10) return ['Very high', 'Limit time in sun'];
  return ['Extreme', 'Avoid direct sun'];
}
// European AQI bands (EEA). The index is the worst of the pollutant sub-indices.
/** @param {number} aqi */
export function aqiLevel(aqi) {
  if (aqi <= 20)  return ['Good', 'Great for outdoor activity'];
  if (aqi <= 40)  return ['Fair', 'Fine for everyone'];
  if (aqi <= 60)  return ['Moderate', 'Sensitive groups take it easy'];
  if (aqi <= 80)  return ['Poor', 'Limit strenuous activity'];
  if (aqi <= 100) return ['Very poor', 'Avoid strenuous activity'];
  return ['Extremely poor', 'Stay indoors if you can'];
}
/** @param {number} code */
export function heroClass(code) {
  if (code === 0 || code === 1) return 'is-sunny';
  if (code === 2) return 'is-partly';
  if (code === 3) return 'is-cloudy';
  if (code >= 51 && code <= 82) return 'is-rain';
  if (code >= 95) return 'is-storm';
  return '';
}
/** @param {string} dtStr */
export function formatTime(dtStr) {
  const [h, m] = dtStr.slice(11, 16).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
// Labels compare against today's date in Milos, so cached data never calls an old day "Today".
/** @param {string} dtStr @param {string} todayStr */
export function dayLabel(dtStr, todayStr) {
  if (dtStr === todayStr) return 'Today';
  const tomorrow = new Date(`${todayStr}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (dtStr === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
  return new Date(`${dtStr}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}
/** @param {string} dtStr */
function longDate(dtStr) {
  return new Date(`${dtStr}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

// ── Meteocons weather icons ────────────────────────────
const CDN = '/icons/weather';
/** @type {Record<number, string>} */
const WMO_DAY = {
  0:'clear-day', 1:'clear-day',
  2:'partly-cloudy-day',
  3:'overcast',
  45:'fog-day', 48:'fog-day',
  51:'drizzle', 53:'drizzle', 55:'overcast-drizzle',
  61:'rain', 63:'rain', 65:'overcast-rain',
  71:'partly-cloudy-day-snow', 73:'snow', 75:'overcast-snow',
  80:'partly-cloudy-day-rain', 81:'overcast-rain', 82:'overcast-rain',
  95:'thunderstorms', 96:'thunderstorms-rain', 99:'thunderstorms-rain',
};
/** @type {Record<number, string>} */
const WMO_NIGHT = {
  0:'clear-night', 1:'clear-night',
  2:'partly-cloudy-night',
  3:'overcast-night',
  45:'fog-night', 48:'fog-night',
  51:'drizzle', 53:'drizzle', 55:'overcast-drizzle',
  61:'rain', 63:'rain', 65:'overcast-rain',
  71:'partly-cloudy-night-snow', 73:'snow', 75:'overcast-snow',
  80:'partly-cloudy-night-rain', 81:'overcast-night-rain', 82:'overcast-night-rain',
  95:'thunderstorms', 96:'thunderstorms-rain', 99:'thunderstorms-rain',
};
/** @param {number} code @param {number} [hour] */
export function wmoIcon(code, hour) {
  const isNight = hour !== undefined && (hour >= 20 || hour < 6);
  const map = isNight ? WMO_NIGHT : WMO_DAY;
  const name = map[code] ?? (isNight ? 'clear-night' : 'partly-cloudy-day');
  return `<img src="${CDN}/${name}.svg" width="48" height="48" alt="" style="display:inline-block;vertical-align:middle;flex-shrink:0" loading="lazy">`;
}

/**
 * Hero numbers as display strings, keyed by element id.
 * @param {any} w best_match forecast with ECMWF wind merged
 * @param {any} m marine response ({ current: null } when missing)
 * @param {any} a air-quality response ({ current: null } when missing)
 */
export function heroValues(w, m, a) {
  const c = w.current;
  const waveH = m?.current?.wave_height ?? 0;
  const seaTemp = m?.current?.sea_surface_temperature ?? null;
  const aqi = a?.current?.european_aqi;
  const variable = c.wind_speed_10m < VARIABLE_KMH;
  return {
    'hero-temp':      `${Math.round(c.temperature_2m)}°`,
    'hero-condition': WMO_TEXT[/** @type {keyof typeof WMO_TEXT} */ (c.weather_code)] ?? 'Unknown',
    'hero-feels':     `Feels like ${Math.round(c.apparent_temperature)}°C`,
    'hs-wind':        `${Math.round(c.wind_speed_10m)} km/h ${variable ? 'calm' : compass(c.wind_direction_10m)}`,
    'hs-sea':         seaTemp != null ? `${Math.round(seaTemp)}°C` : '–',
    'hs-waves':       `${waveH.toFixed(1)} m`,
    'hs-uv':          `${Math.round(c.uv_index)} — ${uvLevel(c.uv_index)[0]}`,
    'hs-humidity':    `${Math.round(c.relative_humidity_2m)}%`,
    'hs-aqi':         aqi != null ? `${Math.round(aqi)} — ${aqiLevel(aqi)[0]}` : '–',
  };
}

/**
 * One plain-language paragraph for today and tomorrow. It is the text search engines
 * quote for "milos weather", so it names the place, the date and the numbers people look for.
 * @param {any} w @param {any} m @param {string} todayStr Milos-local YYYY-MM-DD
 */
export function forecastSummary(w, m, todayStr) {
  const d = w.daily;
  const i = Math.max(0, d.time.indexOf(todayStr));
  const c = w.current;
  const seaTemp = m?.current?.sea_surface_temperature;
  const wind = c.wind_speed_10m < VARIABLE_KMH
    ? 'calm winds'
    : `${compass(c.wind_direction_10m)} wind at ${Math.round(c.wind_speed_10m)} km/h`;
  /** @param {number} j */
  const day = j => `${(WMO_TEXT[/** @type {keyof typeof WMO_TEXT} */ (d.weather_code[j])] ?? 'Mixed').toLowerCase()}, ${Math.round(d.temperature_2m_min[j])}–${Math.round(d.temperature_2m_max[j])}°C` +
    ((d.precipitation_probability_max[j] ?? 0) >= 30 ? `, ${d.precipitation_probability_max[j]}% chance of rain` : '');
  let text = `Weather in Milos on ${longDate(d.time[i])}: ${day(i)}, ${wind}` +
    (seaTemp != null ? ` and a sea temperature of ${Math.round(seaTemp)}°C.` : '.');
  if (d.time[i + 1]) text += ` Tomorrow: ${day(i + 1)}.`;
  return text;
}

const DAY_PALETTE = [
  'linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)',
  'linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%)',
  'linear-gradient(135deg,#fef9c3 0%,#fde68a 100%)',
  'linear-gradient(135deg,#ffedd5 0%,#fed7aa 100%)',
  'linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%)',
  'linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%)',
  'linear-gradient(135deg,#ccfbf1 0%,#99f6e4 100%)',
];

/** 7-day outlook cards. @param {any} w @param {string} todayStr */
export function weekHtml(w, todayStr) {
  const todayIdx = Math.max(0, w.daily.time.indexOf(todayStr));
  return w.daily.time.map((/** @type {string} */ d, /** @type {number} */ i) => {
    if (i < todayIdx) return '';
    const isToday  = d === todayStr;
    const dayMax   = Math.round(w.daily.temperature_2m_max[i]);
    const dayMin   = Math.round(w.daily.temperature_2m_min[i]);
    const rainPct  = w.daily.precipitation_probability_max[i] ?? 0;
    const condFull = WMO_TEXT[/** @type {keyof typeof WMO_TEXT} */ (w.daily.weather_code[i])] ?? '';
    const condShort = condFull.split(' ').slice(0, 2).join(' ');
    const dayBgStyle = isToday ? '' : `style="background:${DAY_PALETTE[i % DAY_PALETTE.length]};border-color:transparent"`;
    return `
      <div class="w-day${isToday ? ' is-today' : ''}" ${dayBgStyle}>
        <span class="w-day-name">${dayLabel(d, todayStr)}</span>
        <span class="w-day-icon">${wmoIcon(w.daily.weather_code[i])}</span>
        <span class="w-day-cond">${condShort}</span>
        <span class="w-day-high">${dayMax}°</span>
        <span class="w-day-low">${dayMin}°</span>
        ${rainPct >= 10
          ? `<span class="w-day-rain">💧 ${rainPct}%</span>`
          : '<span class="w-day-rain-ph"></span>'}
      </div>`;
  }).join('');
}
