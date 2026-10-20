// CARTO Basemaps (Voyager) tiles shared by /map and the beaches map view.
// The API key is domain-locked to milos.guide: CARTO answers 403 for any other referrer
// (localhost, www.milos.guide), while keyless requests still work. So the key is only
// added to production builds. It ships in the page, so it is public by design.
const CARTO_KEY = 'cb1_40eg_1_17d25841dc6faf6717ccc023';

export const CARTO_VOYAGER_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' +
  (import.meta.env.PROD ? `?key=${CARTO_KEY}` : '');
