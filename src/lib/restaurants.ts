import restaurantsRaw from '../data/restaurants.json';
import villagesData from '../data/villages.json';

// Paid listings ("partner" in restaurants.json). Always labelled as such: EU consumer law
// requires paid placement to be disclosed, and the guide is only useful if readers can
// tell an ad from a recommendation.
export type PartnerTier = 'featured' | 'premium';

export const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const;
export type DayKey = (typeof DAYS)[number]['key'];
export type Partner = {
  tier: PartnerTier;
  until: string;           // last paid day, YYYY-MM-DD
  about?: string;          // longer description, shown instead of description.en on the page
  photos?: string[];       // the owner's own photos, e.g. /images/taverns/<slug>-2.jpg
  // Exact weekly hours, e.g. { "mon": "13:00–00:00", "tue": "19:00–00:00" }; a missing day
  // shows as closed. Only partners get these: the owner gives them to us and tells us when
  // they change, which we can't keep up with for every place (see `services` below).
  hours?: Partial<Record<DayKey, string>>;
  // Set to false when the place closes for the winter and back to true when it reopens.
  // Season dates move every year, so this is flipped by hand rather than computed. While
  // false the page says "Closed for the season" instead of reading `hours`.
  open?: boolean;
  // "From the kitchen" on the partner page. `photo` is the owner's own, same folder as `photos`.
  dishes?: { name: string; note?: string; photo?: string }[];
  reservationUrl?: string;
  menuUrl?: string;
  instagram?: string;      // full profile URL
  // The owner's logo, transparent PNG/WebP in /images/taverns/. Shown instead of the photo
  // in "Where to eat nearby" on beach pages; everywhere else keeps the photo.
  logo?: string;
};

export type Restaurant = (typeof restaurantsRaw)[number] & { partner?: Partner };

export const PARTNER_LABEL = 'Featured partner';

// Checked at build time. The deploy cron rebuilds four times a day, so an expired listing
// falls back to the free one within hours without touching the JSON.
const today = new Date().toISOString().slice(0, 10);
export const activePartner = (r: Restaurant): Partner | null =>
  r.partner && r.partner.until >= today ? r.partner : null;

const TIER_RANK: Record<PartnerTier, number> = { premium: 2, featured: 1 };
const tierRank = (r: Restaurant) => {
  const p = activePartner(r);
  return p ? TIER_RANK[p.tier] : 0;
};

// Village page for an area, when the guide has one ("Pera Triovasalos" → pera-triovasalos).
export const areaVillageSlug = (area: string): string | null =>
  villagesData.find(v => v.slug === area.trim().toLowerCase().replace(/\s+/g, '-'))?.slug ?? null;

// Paid partners first (labelled on the card), then alphabetical.
export const restaurants = [...(restaurantsRaw as Restaurant[])].sort(
  (a, b) => tierRank(b) - tierRank(a) || a.name.en.localeCompare(b.name.en),
);

// Premium is sold as limited per area. Fail the build rather than quietly break that
// promise to the owners who already paid for it.
export const PREMIUM_PER_AREA = 2;
const premiumByArea = Object.groupBy(
  restaurants.filter(r => activePartner(r)?.tier === 'premium'),
  r => r.location.area,
);
for (const [area, list = []] of Object.entries(premiumByArea)) {
  if (list.length > PREMIUM_PER_AREA) {
    throw new Error(`restaurants.json: ${list.length} premium partners in ${area}, the limit is ${PREMIUM_PER_AREA}.`);
  }
}

export const placeTypes: Record<string, { label: string; plural: string; icon: string; schema: string }> = {
  restaurant: { label: 'Restaurant',    plural: 'Restaurants & tavernas', icon: '🍽', schema: 'Restaurant' },
  cafe:       { label: 'Café & brunch', plural: 'Cafés & brunch',         icon: '☕', schema: 'CafeOrCoffeeShop' },
};

export const placeType = (r: Restaurant) => placeTypes[r.type] ?? placeTypes.restaurant;

// Exact opening hours change too often to keep by hand, so we only store when a place
// serves and send people to Google Maps or the phone for today's hours.
export const services: Record<string, { label: string; icon: string; text: string }> = {
  'lunch-dinner':    { label: 'Lunch & dinner',     icon: '🕐', text: 'Open for lunch and dinner.' },
  dinner:            { label: 'Dinner only',        icon: '🌙', text: 'Opens in the evening only.' },
  'breakfast-lunch': { label: 'Breakfast & brunch', icon: '☀️', text: 'Open from the morning, usually until the afternoon.' },
  'all-day':         { label: 'All day',            icon: '🕐', text: 'Open from the morning until late.' },
};

export const placeService = (r: Restaurant) => services[r.service] ?? services['lunch-dinner'];

// Google Maps search link (Maps URLs: no API key, nothing stored). Name plus area finds
// the place's listing, where visitors see today's hours and reviews.
export const mapsUrl = (r: Restaurant): string =>
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(`${r.name.en}, ${r.location.area}, Milos`);

export const telHref = (phone: string): string =>
  'tel:+30' + phone.replace(/\D/g, '');

// Distance in km between two points.
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// Paid partners for the "Where to eat nearby" block on beach and village pages: those
// listed in the village itself, or within `maxKm` in a straight line (Milos roads wind,
// so 3 km is often twice that by car). Premium takes the two slots before Featured,
// since that priority is what the higher tier pays for; closest first within a tier.
export function nearbyPartners(
  point: { lat: number; lng: number },
  { maxKm = 3, villageSlug }: { maxKm?: number; villageSlug?: string } = {},
): { restaurant: Restaurant; km: number }[] {
  return restaurants
    .filter(r => activePartner(r))
    .map(r => ({ restaurant: r, km: distanceKm(point, r.coordinates) }))
    .filter(({ restaurant, km }) =>
      km <= maxKm || (villageSlug !== undefined && areaVillageSlug(restaurant.location.area) === villageSlug))
    .sort((a, b) => tierRank(b.restaurant) - tierRank(a.restaurant) || a.km - b.km)
    .slice(0, 2);
}
