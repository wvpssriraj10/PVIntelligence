/**
 * PVIntelligence — weather.js
 * Live Weather Data Integration via Open-Meteo Solar Radiation API
 * Pure Vanilla JavaScript — Zero Dependencies — Zero API Key Required
 */

'use strict';

/* ============================================================
   REGIONS CONFIGURATION
   Region A: 650 kWp array modeled at Bhadla coordinates (Rajasthan)
   Region B: 520 kWp array modeled at Charanka coordinates (Gujarat)
   ============================================================ */
const REGIONS = {
  A: {
    key: 'A',
    name: 'Region A · 650 kWp (Bhadla coords)',
    lat: 27.54,
    lon: 71.91,
    capacity: 650,
    baseRmse: 5.8
  },
  B: {
    key: 'B',
    name: 'Region B · 520 kWp (Charanka coords)',
    lat: 23.90,
    lon: 71.20,
    capacity: 520,
    baseRmse: 6.9
  }
};

/* ============================================================
   UNIT VALIDATION NOTE (STEP 4)
   - Open-Meteo shortwave_radiation: W/m² (Global Horizontal Irradiance)
     PVIntelligence model expects: W/m² (0 - 1400 range). Direct 1:1 match.
   - Open-Meteo temperature_2m: °C (Ambient Temperature)
     PVIntelligence model expects: °C (-10 to 60 range). Direct 1:1 match.
   - Open-Meteo cloud_cover: % (Total Cloud Cover)
     PVIntelligence model expects: % (0 to 100 range). Direct 1:1 match.
   - Open-Meteo wind_speed_10m: km/h
     PVIntelligence model expects: km/h. Direct 1:1 match.
   No conversion scaling needed; values are validated and clamped safely below.
   ============================================================ */

/**
 * Helper to get local date and hour formatted as 'YYYY-MM-DDTHH' to match Open-Meteo's timezone=auto time strings
 */
function getLocalIsoHour(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}`;
}

/**
 * Offline sample fallback data when no cache and no internet exists.
 */
function getOfflineDemoData(regionKey) {
  const cap = REGIONS[regionKey]?.capacity || 650;
  const isA = regionKey === 'A';
  const now = new Date();
  const times = [];
  const hourly = [];

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const dt = new Date(now.getTime() + (d * 24 + h) * 3600000);
      const iso = dt.toISOString().slice(0, 13) + ':00';
      times.push(iso);

      let ghi = 0;
      if (h >= 6 && h <= 18) {
        const peakHour = 12.5; // ~12:30 PM solar peak
        const dist = Math.abs(h - peakHour);
        const maxGhi = isA ? 880 : 760;
        ghi = Math.max(0, Math.round(maxGhi * Math.cos((dist / 6.5) * (Math.PI / 2))));
      }

      hourly.push({
        time: iso,
        ghi: ghi,
        temp: isA ? (24 + (h >= 11 && h <= 16 ? 9 : 2)) : (22 + (h >= 11 && h <= 16 ? 8 : 1)),
        cloud: isA ? 22 : 38,
        wind: isA ? 9.2 : 11.4
      });
    }
  }

  const currHour = now.getHours();
  return {
    source: 'Offline demo data',
    fetchedAt: Date.now(),
    hourly: hourly,
    current: hourly[currHour] || hourly[0]
  };
}

/**
 * Fetches 7-day hourly solar radiation & weather metrics from Open-Meteo.
 * Includes localStorage caching (15-min TTL) and 8-second timeout abort.
 *
 * @param {string} regionKey - 'A' or 'B'
 * @param {boolean} forceRefresh - If true, bypasses the 15-minute cache
 * @returns {Promise<{source: string, fetchedAt: number, hourly: Array, current: Object}>}
 */
async function getWeather(regionKey, forceRefresh = false) {
  const reg = REGIONS[regionKey] || REGIONS.A;
  const cacheKey = `pv_weather_${reg.key}`;
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  // 1. Check local cache
  let cached = null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) cached = JSON.parse(raw);
  } catch (e) {
    console.warn('Weather cache read error:', e);
  }

  const now = Date.now();

  // If browser is currently offline, immediately return cached or demo data without firing network requests
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (cached && cached.hourly && cached.current) {
      return {
        source: 'Cached weather data',
        fetchedAt: cached.timestamp || now,
        hourly: cached.hourly,
        current: cached.current
      };
    }
    return getOfflineDemoData(reg.key);
  }

  if (!forceRefresh && cached && cached.timestamp && (now - cached.timestamp < CACHE_TTL_MS)) {
    return {
      source: cached.source || 'Live weather',
      fetchedAt: cached.timestamp,
      hourly: cached.hourly,
      current: cached.current
    };
  }

  // 2. Fetch live data from Open-Meteo with 8s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${reg.lat}&longitude=${reg.lon}&hourly=shortwave_radiation,temperature_2m,cloud_cover,wind_speed_10m&forecast_days=16&timezone=auto`;

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Open-Meteo HTTP error ${res.status}`);
    const json = await res.json();

    if (!json.hourly || !json.hourly.time) throw new Error('Malformed Open-Meteo response');

    const times = json.hourly.time;
    const rads = json.hourly.shortwave_radiation || [];
    const temps = json.hourly.temperature_2m || [];
    const clouds = json.hourly.cloud_cover || [];
    const winds = json.hourly.wind_speed_10m || [];

    const hourly = [];
    for (let i = 0; i < times.length; i++) {
      hourly.push({
        time: times[i],
        ghi: Math.round(Math.max(0, Number(rads[i]) || 0)),
        temp: parseFloat((Number(temps[i]) || 25).toFixed(1)),
        cloud: Math.max(0, Math.min(100, Math.round(Number(clouds[i]) || 0))),
        wind: parseFloat((Number(winds[i]) || 0).toFixed(1))
      });
    }

    // Determine current hour index
    const nowLocalIso = getLocalIsoHour(new Date());
    let currIdx = times.findIndex(t => t.startsWith(nowLocalIso));
    if (currIdx === -1) {
      const hour = new Date().getHours();
      currIdx = Math.min(hour, hourly.length - 1);
    }
    const current = hourly[currIdx] || hourly[0];

    const result = {
      source: 'Live weather',
      fetchedAt: now,
      hourly: hourly,
      current: current
    };

    // Save to cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: result.fetchedAt,
        source: 'Live weather',
        hourly: result.hourly,
        current: result.current
      }));
    } catch (e) {
      console.warn('Weather cache write error:', e);
    }

    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    console.info(`[PVIntelligence] Offline or network unreachable for Region ${regionKey}. Using ${cached ? 'cached data' : 'offline demo dataset'}.`);

    // Fallback 1: Cached weather data
    if (cached && cached.hourly && cached.current) {
      return {
        source: 'Cached weather data',
        fetchedAt: cached.timestamp || now,
        hourly: cached.hourly,
        current: cached.current
      };
    }

    // Fallback 2: Offline demo data
    return getOfflineDemoData(reg.key);
  }
}

/**
 * Fetches real-time 7-day solar telemetry for any arbitrary latitude and longitude.
 */
async function fetchWeatherForCoordinates(lat, lon, label = 'Custom location') {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=shortwave_radiation,temperature_2m,cloud_cover,wind_speed_10m&forecast_days=16&timezone=auto`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Open-Meteo HTTP error ${res.status}`);
    const json = await res.json();
    if (!json.hourly || !json.hourly.time) throw new Error('Malformed Open-Meteo response');

    const times = json.hourly.time;
    const rads = json.hourly.shortwave_radiation || [];
    const temps = json.hourly.temperature_2m || [];
    const clouds = json.hourly.cloud_cover || [];
    const winds = json.hourly.wind_speed_10m || [];

    const hourly = [];
    for (let i = 0; i < times.length; i++) {
      hourly.push({
        time: times[i],
        ghi: Math.round(Math.max(0, Number(rads[i]) || 0)),
        temp: parseFloat((Number(temps[i]) || 25).toFixed(1)),
        cloud: Math.max(0, Math.min(100, Math.round(Number(clouds[i]) || 0))),
        wind: parseFloat((Number(winds[i]) || 0).toFixed(1))
      });
    }

    const nowLocalIso = getLocalIsoHour(new Date());
    let currIdx = times.findIndex(t => t.startsWith(nowLocalIso));
    if (currIdx === -1) {
      currIdx = Math.min(new Date().getHours(), hourly.length - 1);
    }

    return {
      source: `Live weather · ${label}`,
      fetchedAt: Date.now(),
      hourly: hourly,
      current: hourly[currIdx] || hourly[0]
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Coordinate fetch error:', err);
    throw err;
  }
}

/**
 * Returns formatted text and badge class for honest status labels.
 */
function getWeatherBadgeMeta(source, fetchedAt) {
  const elapsedSec = Math.max(0, Math.floor((Date.now() - (fetchedAt || Date.now())) / 1000));
  const elapsedMin = Math.floor(elapsedSec / 60);
  const timeText = elapsedMin <= 0 ? 'just now' : `${elapsedMin}m ago`;

  if (source && source.startsWith('Live weather')) {
    const label = source.includes('·') ? source : 'Live weather · Open-Meteo';
    return {
      text: `${label} · updated ${timeText}`,
      cls: 'turquoise',
      dotColor: 'var(--turquoise)'
    };
  }

  switch (source) {
    case 'Cached weather data':
      return {
        text: `Cached weather data · updated ${timeText}`,
        cls: 'amber',
        dotColor: 'var(--amber)'
      };
    case 'Manual input':
      return {
        text: 'Manual input',
        cls: 'neutral',
        dotColor: 'var(--text-muted)'
      };
    case 'Offline demo data':
    default:
      return {
        text: 'Offline demo data',
        cls: 'neutral',
        dotColor: 'var(--text-muted)'
      };
  }
}

// Explicit window exports for browser script compatibility
if (typeof window !== 'undefined') {
  window.REGIONS = REGIONS;
  window.getWeather = getWeather;
  window.fetchWeatherForCoordinates = fetchWeatherForCoordinates;
  window.getWeatherBadgeMeta = getWeatherBadgeMeta;
  window.getOfflineDemoData = getOfflineDemoData;
}

