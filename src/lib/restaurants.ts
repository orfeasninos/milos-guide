import restaurantsRaw from '../data/restaurants.json';
import villagesData from '../data/villages.json';

// Paid listings ("partner" in restaurants.json). Always labelled as such: EU consumer law
// requires paid placement to be disclosed, and the guide is only useful if readers can
// tell an ad from a recommendation.
export type PartnerTier = 'featured' | 'premium';
export type Partner = {
  tier: PartnerTier;
  until: string;           // last paid day, YYYY-MM-DD
  about?: string;          // longer description, shown instead of description.en on the page
  photos?: string[];       // the owner's own photos, e.g. /images/taverns/<slug>-2.jpg
  reservationUrl?: string;
  menuUrl?: string;
  instagram?: string;      // full profile URL
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
