// Client logic for /weather: live Open-Meteo fetch with retry, cache fallback, and rendering.
import { WEATHER_URL, WIND_URL, MARINE_URL, AIR_URL, mergeWind } from '../lib/openmeteo.js';
import { compass as windDir, VARIABLE_KMH } from '../lib/wind';
import { uvLevel, aqiLevel, heroClass, formatTime, wmoIcon, heroValues, forecastSummary, weekHtml } from '../lib/weather-format.js';

function el(id) { return document.getElementById(id); }

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
function dustLevel(ug) {
  if (ug < 20)  return 'None';
  if (ug < 50)  return 'Light haze';
  if (ug < 150) return 'Saharan dust';
  return 'Heavy dust';
}
// Rough bands for tree/grass pollen in grains/m³; null means out of season for CAMS.
function pollenLevel(g) {
  if (g == null) return 'Off season';
  if (g < 1)   return 'None';
  if (g < 10)  return 'Low';
  if (g < 50)  return 'Moderate';
  if (g < 200) return 'High';
  return 'Very high';
}
function visibilityDesc(m) {
  if (m >= 20000) return 'Excellent';
  if (m >= 10000) return 'Good';
  if (m >= 4000)  return 'Moderate';
  return 'Poor';
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
let _loading = false;
async function loadWeather() {
  if (_loading) return;
  _loading = true;
  el('w-loading').style.display = 'flex';
  el('w-error').style.display   = 'none';
  el('w-content').classList.remove('is-ready');
  el('w-stale-banner').style.display = 'none';

  let w, m, a, cachedAt = null;

  // One live attempt: weather must succeed, marine and air failures are tolerated.
  const attemptLive = async () => {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 12000);
    try {
      const [wSettled, windSettled, mSettled, aSettled] = await Promise.allSettled([
        fetch(WEATHER_URL, { signal: ctrl.signal }),
        fetch(WIND_URL,    { signal: ctrl.signal }),
        fetch(MARINE_URL,  { signal: ctrl.signal }),
        fetch(AIR_URL,     { signal: ctrl.signal }),
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
      const aData = (aSettled.status === 'fulfilled' && aSettled.value.ok)
        ? await aSettled.value.json().catch(() => ({ current: null }))
        : { current: null };
      return { w: wData, m: mData, a: aData };
    } finally {
      clearTimeout(tid);
    }
  };

  try {
    try {
      ({ w, m, a } = await attemptLive());
    } catch (firstErr) {
      console.warn('Live fetch attempt 1 failed:', firstErr.message, '— retrying in 2 s…');
      await new Promise(r => setTimeout(r, 2000));
      ({ w, m, a } = await attemptLive());
    }
  } catch (liveErr) {
    console.warn('Both live attempts failed, falling to cache:', liveErr.message);
    try {
      const cacheRes = await fetch('/weather-cache.json', { cache: 'no-cache' });
      if (!cacheRes.ok) throw new Error('No cache');
      const cached = await cacheRes.json();
      w = cached.weather;
      m = cached.marine ?? { current: null };
      a = cached.air ?? { current: null };
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
    el('hero-icon').innerHTML         = wmoIcon(c.weather_code, Number(c.time.slice(11, 13)));
    for (const [id, text] of Object.entries(heroValues(w, m, a))) el(id).textContent = text;
    const variable = c.wind_speed_10m < VARIABLE_KMH;
    const air = a?.current;
    const aqi = air?.european_aqi;
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
    el('w-sea-temp').textContent  = seaTemp != null ? `${Math.round(seaTemp)}°C` : '–';
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

    // ── Air quality card
    const fmtUg = v => v != null ? `${Math.round(v)} µg/m³` : '–';
    if (aqi != null) {
      const [aqiLvl, aqiTip] = aqiLevel(aqi);
      el('w-aqi').textContent       = Math.round(aqi);
      el('w-aqi-sub').textContent   = aqiTip;
      el('w-aqi-tag').textContent   = aqiLvl;
      el('aqi-marker').style.left   = `${Math.min(aqi / 100, 1) * 100}%`;
    } else {
      el('w-aqi').textContent       = '–';
      el('w-aqi-sub').textContent   = 'Air quality data unavailable';
      el('w-aqi-tag').textContent   = '–';
    }
    el('w-pm25').textContent  = fmtUg(air?.pm2_5);
    el('w-pm10').textContent  = fmtUg(air?.pm10);
    el('w-ozone').textContent = fmtUg(air?.ozone);
    el('w-dust').textContent  = air?.dust != null ? `${dustLevel(air.dust)} (${Math.round(air.dust)})` : '–';

    // ── Pollen card
    const pollen = [['olive', air?.olive_pollen], ['grass', air?.grass_pollen], ['ragweed', air?.ragweed_pollen]];
    for (const [k, v] of pollen) el(`w-pollen-${k}`).textContent = air ? pollenLevel(v) : '–';
    const worst = Math.max(...pollen.map(([, v]) => v ?? 0));
    el('w-pollen-tag').textContent = air ? pollenLevel(worst) : '–';

    // ── More conditions card
    el('w-gusts').textContent      = c.wind_gusts_10m != null ? `${Math.round(c.wind_gusts_10m)} km/h` : '–';
    el('w-visibility').textContent = c.visibility != null
      ? `${visibilityDesc(c.visibility)} (${Math.round(c.visibility / 1000)} km)` : '–';
    el('w-pressure').textContent   = c.pressure_msl != null ? `${Math.round(c.pressure_msl)} hPa` : '–';
    el('w-clouds').textContent     = c.cloud_cover != null ? `${Math.round(c.cloud_cover)}%` : '–';
    el('w-dewpoint').textContent   = c.dew_point_2m != null ? `${Math.round(c.dew_point_2m)}°C` : '–';

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
        <span class="w-fc-icon">${wmoIcon(codes[idx], h)}</span>
        <span class="w-fc-temp">${Math.round(temps[idx])}°</span>
        <span class="w-fc-wind">${wdirs?.[idx] != null ? windArrow(winds[idx], wdirs[idx]) : ''}${Math.round(winds[idx])} km/h</span>
        ${rainPct >= 15 ? `<span class="w-fc-rain">💧 ${rainPct}%</span>` : '<span class="w-fc-rain-placeholder"></span>'}
      </div>`;
    }).join('');

    // ── 7-day outlook
    el('w-week').innerHTML = weekHtml(w, todayStr);
    el('hero-summary').textContent = forecastSummary(w, m, todayStr);

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
