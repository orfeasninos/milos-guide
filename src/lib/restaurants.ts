import restaurantsRaw from '../data/restaurants.json';
import villagesData from '../data/villages.json';

export type Restaurant = (typeof restaurantsRaw)[number];

// The scraped areas aren't consistent ("Triovassalos" vs "Triovasalos", a bare "Milos").
const AREA_FIX: Record<string, string> = {
  Triovassalos: 'Triovasalos',
  Milos: 'Zefiria',
};

export const restaurantArea = (r: Restaurant): string =>
  AREA_FIX[r.location.area] ?? r.location.area;

// Village page for an area, when the guide has one.
export const areaVillageSlug = (area: string): string | null =>
  villagesData.find(v => v.slug === area.toLowerCase())?.slug ?? null;

// Featured first, then alphabetical.
export const restaurants = [...restaurantsRaw].sort(
  (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.en.localeCompare(b.name.en),
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
  encodeURIComponent(`${r.name.en}, ${restaurantArea(r)}, Milos`);

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
