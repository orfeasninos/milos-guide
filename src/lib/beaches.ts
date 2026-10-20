export interface Beach {
  slug: string;
  name: string | { el: string; en: string };
  description: string | { el: string; en: string };
  location: { area: string; address: string };
  placeId: string | null;
  image: string | null;
  gallery?: string[];
  coordinates?: { lat: number; lng: number };
  faces: number;
  accessType: string;
  easyAccess?: boolean;
  facilities: string[];
  sandType?: string;
  shade?: boolean;
  bestFor?: string[];
  swimDepth?: string;
  nearbyFood?: boolean;
}

export interface BeachAccess { icon: string; label: string; color: string }

export type Area = 'north' | 'south' | 'west' | 'east' | 'gulf';

export function getArea(lat: number, lng: number): Area {
  if (!lat || !lng) return 'north';
  if (lng < 24.37) return 'west';
  if (lng > 24.52 && lat > 36.68) return 'east';
  if (lat < 36.68) return 'south';
  if (lat >= 36.74) return 'north';
  return 'gulf';
}

export const areaLabel: Record<Area, string> = {
  north: 'North coast',
  south: 'South coast',
  west: 'West coast',
  east: 'East coast',
  gulf: 'Milos Bay',
};

// Local photos live in /public/images/beaches/<slug>.jpg (with AVIF/WebP variants for SmartImage).
const localPhotos = import.meta.glob('/public/images/beaches/*.jpg');

export function beachPhoto(b: { slug: string; image?: string | null }): string | null {
  if (b.image) return b.image;
  const local = `/images/beaches/${b.slug}.jpg`;
  return `/public${local}` in localPhotos ? local : null;
}

// Small WebP variant for plain <img> tags (map popups) where SmartImage isn't available.
export function beachThumb(b: { slug: string; image?: string | null }): string | null {
  const photo = beachPhoto(b);
  return photo?.startsWith('/images/') ? photo.replace(/\.jpg$/, '-800w.webp') : photo;
}

export const getBeachName = (b: { name: string | { en: string } }): string =>
  typeof b.name === 'object' ? b.name.en : b.name;

// Rough popularity order, used to break ties when many beaches are equally sheltered.
export const POPULAR_BEACHES = [
  'sarakiniko', 'kleftiko', 'firopotamos', 'tsigrado', 'firiplaka', 'paleochori',
  'provatas', 'papafragas', 'plathiena', 'agia-kiriaki', 'pollonia-beach', 'mandrakia',
  'achivadolimni', 'gerontas', 'tria-pigadia', 'kipos-beach', 'agios-sostis', 'papikinou-beach',
];
