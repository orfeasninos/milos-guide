// Month-by-month climate for /weather and /weather/<month>/.
// Numbers in climate.json are averages for the island's grid point (36.73 N, 24.45 E):
// air temperatures, rain days (≥ 1 mm) and strong north-wind days (dominant wind N–NE–NW
// with a daily mean ≥ 25 km/h, about 4 Bft) from ERA5 2015–2024 via the Open-Meteo
// archive API; sea temperature from the Open-Meteo marine API, 2022–2024. ERA5's
// sunshine hours overestimate badly in winter, so they are deliberately left out.
import climateRaw from '../data/climate.json';
import beachesRaw from '../data/beaches.json';
import { getBeachName, POPULAR_BEACHES } from './beaches';
import { exposure } from './wind';

export interface ClimateMonth {
  slug: string;
  name: string;
  hi: number;
  lo: number;
  sea: number;
  rainDays: number;
  northWindDays: number;
  tag: string;
  intro: string;
  pack: string;
}

export const months: ClimateMonth[] = climateRaw;

export const CLIMATE_SOURCE = 'Averages for 2015–2024 from ERA5 reanalysis (sea: 2022–2024), via Open-Meteo.';

export function swimVerdict(sea: number): string {
  if (sea >= 24) return 'Warm: easy, long swims';
  if (sea >= 21) return 'Pleasant for most swimmers';
  if (sea >= 19) return 'Refreshing: short swims';
  return 'Cold: brief dips or a wetsuit';
}

// Months with the meltemi blowing on a large share of days.
export const isWindy = (m: ClimateMonth) => m.northWindDays >= 10;

// Beaches out of a typical meltemi (north wind, ~35 km/h), popular first. Road access only,
// since boat-only beaches depend on tours that may not run in that wind.
export function shelteredFromNorth(limit = 6) {
  const rank = (slug: string) => {
    const i = POPULAR_BEACHES.indexOf(slug);
    return i === -1 ? 99 : i;
  };
  return beachesRaw
    .filter(b => b.accessType === 'road' && exposure(b.faces, { speed: 35, direction: 0 }) === 'sheltered')
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .slice(0, limit)
    .map(b => ({ slug: b.slug, name: getBeachName(b) }));
}
