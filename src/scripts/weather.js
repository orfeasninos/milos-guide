// Client logic for /weather: live Open-Meteo fetch with retry, cache fallback, and rendering.
import { WEATHER_URL, WIND_URL, MARINE_URL, mergeWind } from '../lib/openmeteo.js';

const WMO_TEXT = {
  0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
  45:'Foggy',48:'Foggy',
  51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',
  61:'Light rain',63:'Rain',65:'Heavy rain',
  71:'Light snow',73:'Snow',75:'Heavy snow',
  80:'Showers',81:'Heavy showers',82:'Violent showers',
  95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm',
};

function el(id) { return document.getElementById(id); }

// Below 4 km/h the direction is model noise (keep in sync with VARIABLE_KMH in lib/wind.ts).
const VARIABLE_KMH = 4;
function windDir(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}
function beaufort(kmh) {
  if (kmh < 1)   return '0Bft - Calm';
  if (kmh < 6)   return '1Bft - Light air';
  if (kmh < 12)  return '2Bft - Light breeze';
  if (kmh < 20)  return '3Bft - Gentle breeze';
  if (kmh < 29)  return '4Bft - Moderate breeze';
  if (kmh < 39)  return '5Bft - Fresh breeze'; 
  if (kmh < 50)  return '6Bft - Strong breeze';
  if (kmh < 62)  return '7Bft - High wind';    
  if (kmh < 75)  return '8Bft - Gale';         
  if (kmh < 89)  return '9Bft - Strong gale';  
  if (kmh < 103) return '10Bft - Storm';        
  if (kmh < 118) return '11Bft - Violent storm';
  return '12Bft - Hurricane force';
}
function uvLevel(uv) {
  if (uv <= 2)  return ['Low', 'No protection needed'];
  if (uv <= 5)  return ['Moderate', 'Wear SPF 30+'];
  if (uv <= 7)  return ['High', 'SPF 50+ recommended'];
  if (uv <= 10) return ['Very high', 'Limit time in sun'];
  return ['Extreme', 'Avoid direct sun'];
}
function waveDesc(h) {
  if (h < 0.3) return ['Calm', 'Perfect for swimming'];
  if (h < 0.8) return ['Slight', 'Good conditions'];
  if (h < 1.5) return ['Moderate', 'Caution advised'];
  return ['Rough', 'Avoid open beaches'];
}
function humidityDesc(h) {
  if (h < 30)  return 'Dry';
  if (h < 60)  return 'Comfortable';
  if (h < 75)  return 'Humid';
  return 'Very humid';
}
function heroClass(code) {
  if (code === 0 || code === 1) return 'is-sunny';
  if (code === 2) return 'is-partly';
  if (code === 3) return 'is-cloudy';
  if (code >= 51 && code <= 82) return 'is-rain';
  if (code >= 95) return 'is-storm';
  return '';
}
// Open-Meteo times are Milos local strings ("2026-10-20T22:00"). Never parse them with
// the visitor's timezone — compare/slice the strings and format "now" in Europe/Athens.
function athensNowIso() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Athens' }).replace(' ', 'T').slice(0, 16);
}
function athensClock(date) {
  return date.toLocaleTimeString('en-US', { timeZone: 'Europe/Athens', hour: 'numeric', minute: '2-digit', hour12: true });
}
function windArrow(kmh, deg) {
  // Same convention as the compass: arrow points where the wind blows to.
  const rot = (deg + 180) % 360;
  const op = kmh < VARIABLE_KMH ? 0.3 : 1;
  return `<svg class="w-fc-arrow" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="opacity:${op};transform:rotate(${rot}deg)"><path d="M6 1 L9.5 10 L6 8 L2.5 10 Z" fill="currentColor"/></svg>`;
}
function formatHour(h) {
  if (h === 0)  return '12 am';
  if (h < 12)   return `${h} am`;
  if (h === 12) return '12 pm';
  return `${h - 12} pm`;
}
function formatTime(dtStr) {
  const [h, m] = dtStr.slice(11, 16).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
// Labels compare against today's date in Milos, so cached data never calls an old day "Today".
function dayLabel(dtStr, todayStr) {
  if (dtStr === todayStr) return 'Today';
  const tomorrow = new Date(`${todayStr}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (dtStr === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
  return new Date(`${dtStr}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

// ── Meteocons weather icons ────────────────────────────
const CDN = '/icons/weather';
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
function _wmoIcon(code, hour) {
  const isNight = hour !== undefined && (hour >= 20 || hour < 6);
  const map = isNight ? WMO_NIGHT : WMO_DAY;
  const name = map[code] ?? (isNight ? 'clear-night' : 'partly-cloudy-day');
  return `<img src="${CDN}/${name}.svg" width="48" height="48" alt="" style="display:inline-block;vertical-align:middle;flex-shrink:0" loading="lazy">`;
}

let _loading = false;
async function loadWeather() {
  if (_loading) return;
  _loading = true;
  el('w-loading').style.display = 'flex';
  el('w-error').style.display   = 'none';
  el('w-content').classList.remove('is-ready');
  el('w-stale-banner').style.display = 'none';

  let w, m, cachedAt = null;

  // One live attempt: weather must succeed, marine failure is tolerated.
  const attemptLive = async () => {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 12000);
    try {
      const [wSettled, windSettled, mSettled] = await Promise.allSettled([
        fetch(WEATHER_URL, { signal: ctrl.signal }),
        fetch(WIND_URL,    { signal: ctrl.signal }),
        fetch(MARINE_URL,  { signal: ctrl.signal }),
      ]);
      if (wSettled.status === 'rejected') throw wSettled.reason;
      const wData = await wSettled.value.json();
      if (wData.error) throw new Error(wData.reason ?? 'Weather API error');
      if (windSettled.status === 'fulfilled' && windSettled.value.ok) {
        mergeWind(wData, await windSettled.value.json().catch(() => null));
      }
      const mData = (mSettled.status === 'fulfilled' && mSettled.value.ok)
        ? await mSettled.value.json()
        : { current: null };
      return { w: wData, m: mData };
    } finally {
      clearTimeout(tid);
    }
  };

  try {
    try {
      ({ w, m } = await attemptLive());
    } catch (firstErr) {
      console.warn('Live fetch attempt 1 failed:', firstErr.message, '— retrying in 2 s…');
      await new Promise(r => setTimeout(r, 2000));
      ({ w, m } = await attemptLive());
    }
  } catch (liveErr) {
    console.warn('Both live attempts failed, falling to cache:', liveErr.message);
    try {
      const cacheRes = await fetch('/weather-cache.json', { cache: 'no-cache' });
      if (!cacheRes.ok) throw new Error('No cache');
      const cached = await cacheRes.json();
      w = cached.weather;
      m = cached.marine ?? { current: null };
      cachedAt = cached.cachedAt;
    } catch {
      el('w-loading').style.display = 'none';
      el('w-error').style.display   = 'block';
      _loading = false;
      return;
    }
  }

  try {
    const c = w.current;
    const waveH   = m.current?.wave_height ?? 0;
    const seaTemp = m.current?.sea_surface_temperature ?? null;

    // ── Hero
    const heroEl = document.getElementById('weather-hero');
    heroEl.classList.remove('is-sunny', 'is-partly', 'is-cloudy', 'is-rain', 'is-storm');
    const heroCls = heroClass(c.weather_code);
    if (heroCls) heroEl.classList.add(heroCls);
    el('hero-icon').innerHTML         = _wmoIcon(c.weather_code, Number(c.time.slice(11, 13)));
    el('hero-temp').textContent      = `${Math.round(c.temperature_2m)}°`;
    el('hero-condition').textContent = WMO_TEXT[c.weather_code] ?? 'Unknown';
    el('hero-feels').textContent     = `Feels like ${Math.round(c.apparent_temperature)}°C`;
    const variable = c.wind_speed_10m < VARIABLE_KMH;
    el('hs-wind').textContent        = `${Math.round(c.wind_speed_10m)} km/h ${variable ? 'calm' : windDir(c.wind_direction_10m)}`;
    el('hs-sea').textContent         = seaTemp ? `${Math.round(seaTemp)}°C` : '–';
    el('hs-waves').textContent       = `${waveH.toFixed(1)} m`;
    el('hs-uv').textContent          = `${Math.round(c.uv_index)} — ${uvLevel(c.uv_index)[0]}`;
    el('hs-humidity').textContent    = `${Math.round(c.relative_humidity_2m)}%`;
    el('hero-updated').textContent   = cachedAt
      ? `Last updated ${athensClock(new Date(cachedAt))} (Milos time)`
      : `Updated at ${formatTime(c.time)} (Milos time)`;

    // ── Wind card
    el('compass-needle-g').style.transform = `rotate(${(c.wind_direction_10m + 180) % 360}deg)`;
    el('w-wind-speed').textContent = `${Math.round(c.wind_speed_10m)} km/h`;
    el('w-wind-dir').textContent   = variable ? 'Calm, variable' : `${windDir(c.wind_direction_10m)} wind`;
    el('compass-needle-g').style.opacity = variable ? '0.25' : '';
    el('w-wind-tag').textContent   = beaufort(c.wind_speed_10m);

    // ── Sea & Waves card
    el('w-sea-temp').textContent  = seaTemp ? `${Math.round(seaTemp)}°C` : '–';
    const wavePct = Math.min(waveH / 3, 1) * 100;
    el('w-wave-fill').style.width = `${wavePct}%`;
    el('w-wave-val').textContent  = `${waveH.toFixed(1)} m`;
    const [waveTag] = waveDesc(waveH);
    el('w-wave-tag').textContent  = waveTag;

    // ── UV card
    const uvVal = Math.round(c.uv_index);
    const [uvLvl, uvTip] = uvLevel(c.uv_index);
    el('w-uv').textContent       = uvVal;
    el('w-uv-level').textContent = uvTip;
    el('w-uv-tag').textContent   = uvLvl;
    const uvPct = Math.min(c.uv_index / 11, 1) * 100;
    el('uv-marker').style.left   = `${uvPct}%`;

    // ── Humidity card
    el('w-humidity').textContent    = `${Math.round(c.relative_humidity_2m)}%`;
    el('w-humidity-sub').textContent = humidityDesc(c.relative_humidity_2m);

    // ── Range + Sun card (today's row; a cached forecast may start on an earlier day)
    const nowIso   = athensNowIso();
    const todayStr = nowIso.slice(0, 10);
    const todayIdx = Math.max(0, w.daily.time.indexOf(todayStr));
    el('w-temp-max').textContent = `${Math.round(w.daily.temperature_2m_max[todayIdx])}°C`;
    el('w-temp-min').textContent = `${Math.round(w.daily.temperature_2m_min[todayIdx])}°C`;
    el('w-sunrise').textContent  = formatTime(w.daily.sunrise[todayIdx]);
    el('w-sunset').textContent   = formatTime(w.daily.sunset[todayIdx]);

    // ── Beach recommendation (ranked by the module script below)
    window.__mgWeather = {
      speed: c.wind_speed_10m, direction: c.wind_direction_10m, time: c.time, waveH,
      source: cachedAt ? 'cache' : 'live',
    };
    window.dispatchEvent(new CustomEvent('mg:weather', { detail: window.__mgWeather }));

    // ── 12-hour hourly
    const times = w.hourly.time;
    const temps = w.hourly.temperature_2m;
    const codes = w.hourly.weather_code;
    const winds = w.hourly.wind_speed_10m;
    const wdirs = w.hourly.wind_direction_10m;
    const pops  = w.hourly.precipitation_probability;
    const nowHour = nowIso.slice(0, 13);
    let startIdx = times.findIndex(t => t.slice(0, 13) >= nowHour);
    if (startIdx < 0) startIdx = Math.max(0, times.length - 12);

    function hourBg(h) {
      if (h >= 6  && h < 9)  return 'linear-gradient(135deg,#ffedd5 0%,#fed7aa 100%)';
      if (h >= 9  && h < 13) return 'linear-gradient(135deg,#fef9c3 0%,#fde68a 100%)';
      if (h >= 13 && h < 17) return 'linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)';
      if (h >= 17 && h < 20) return 'linear-gradient(135deg,#ffe4e6 0%,#fecaca 100%)';
      return 'linear-gradient(135deg,#ede9fe 0%,#c7d2fe 100%)';
    }

    el('w-hourly').innerHTML = times.slice(startIdx, startIdx + 12).map((t, i) => {
      const idx = startIdx + i;
      const h = Number(t.slice(11, 13));
      const isNow = t.slice(0, 13) === nowHour;
      const rainPct = pops?.[idx] ?? 0;
      const bgStyle = isNow ? '' : `style="background:${hourBg(h)};border-color:transparent"`;
      return `<div class="w-fc-item${isNow ? ' is-now' : ''}" ${bgStyle}>
        <span class="w-fc-time">${isNow ? 'Now' : formatHour(h)}</span>
        <span class="w-fc-icon">${_wmoIcon(codes[idx], h)}</span>
        <span class="w-fc-temp">${Math.round(temps[idx])}°</span>
        <span class="w-fc-wind">${wdirs?.[idx] != null ? windArrow(winds[idx], wdirs[idx]) : ''}${Math.round(winds[idx])} km/h</span>
        ${rainPct >= 15 ? `<span class="w-fc-rain">💧 ${rainPct}%</span>` : '<span class="w-fc-rain-placeholder"></span>'}
      </div>`;
    }).join('');

    // ── 7-day outlook
    const dayPalette = [
      'linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)',
      'linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%)',
      'linear-gradient(135deg,#fef9c3 0%,#fde68a 100%)',
      'linear-gradient(135deg,#ffedd5 0%,#fed7aa 100%)',
      'linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%)',
      'linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%)',
      'linear-gradient(135deg,#ccfbf1 0%,#99f6e4 100%)',
    ];
    el('w-week').innerHTML = w.daily.time.map((d, i) => {
      if (i < todayIdx) return '';
      const isToday  = d === todayStr;
      const dayMax   = Math.round(w.daily.temperature_2m_max[i]);
      const dayMin   = Math.round(w.daily.temperature_2m_min[i]);
      const rainPct  = w.daily.precipitation_probability_max[i] ?? 0;
      const condFull = WMO_TEXT[w.daily.weather_code[i]] ?? '';
      const condShort = condFull.split(' ').slice(0, 2).join(' ');
      const dayBgStyle = isToday ? '' : `style="background:${dayPalette[i % dayPalette.length]};border-color:transparent"`;
      return `
      <div class="w-day${isToday ? ' is-today' : ''}" ${dayBgStyle}>
        <span class="w-day-name">${dayLabel(d, todayStr)}</span>
        <span class="w-day-icon">${_wmoIcon(w.daily.weather_code[i])}</span>
        <span class="w-day-cond">${condShort}</span>
        <span class="w-day-high">${dayMax}°</span>
        <span class="w-day-low">${dayMin}°</span>
        ${rainPct >= 10
          ? `<span class="w-day-rain">💧 ${rainPct}%</span>`
          : '<span class="w-day-rain-ph"></span>'}
      </div>`;
    }).join('');

    // ── Show stale banner if using cache
    if (cachedAt) {
      const d = new Date(cachedAt);
      el('w-stale-time').textContent = d.toLocaleString('en-US', {
        timeZone: 'Europe/Athens', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
      }) + ' (Milos time)';
      el('w-stale-banner').style.display = 'block';
    }

    // ── Show content
    el('w-loading').style.display = 'none';
    requestAnimationFrame(() => el('w-content').classList.add('is-ready'));
  } catch (err) {
    console.error(err);
    el('w-loading').style.display = 'none';
    el('w-error').style.display   = 'block';
  } finally {
    _loading = false;
  }
}

document.getElementById('w-retry-btn').addEventListener('click', loadWeather);
loadWeather();
