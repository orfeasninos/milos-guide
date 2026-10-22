import sightsRaw from '../data/sights.json';
import beachesRaw from '../data/beaches.json';
import villagesRaw from '../data/villages.json';
import { beachAreaLabel } from './beaches';
import { restaurants, placeType } from './restaurants';
import { stays, stayType } from './stays';
import type { SearchItem } from './search-match';

const placeTypeEl: Record<string, string> = { restaurant: 'Εστιατόριο', cafe: 'Καφέ' };
const stayTypeEl: Record<string, string> = { hotel: 'Ξενοδοχείο', studio: 'Στούντιο', villa: 'Βίλα' };

// Flat index of every page worth searching. Built at build time for /search/ and /search-index.json.
export function buildSearchIndex(): SearchItem[] {
  return [
    ...sightsRaw.map(s => ({
      type:   'sight',
      typeEl: 'Αξιοθέατο',
      typeEn: 'Sight',
      nameEl: s.name,
      nameEn: s.nameEn,
      area:   s.area,
      url:    `/sights/${s.slug}/`,
      icon:   s.icon,
    })),
    ...beachesRaw.map(b => ({
      type:   'beach',
      typeEl: 'Παραλία',
      typeEn: 'Beach',
      nameEl: typeof b.name === 'object' ? (b.name as any).el : b.name,
      nameEn: typeof b.name === 'object' ? (b.name as any).en : b.name,
      area:   beachAreaLabel(b),
      url:    `/beaches/${b.slug}/`,
      icon:   '🏖',
    })),
    ...villagesRaw.map(v => ({
      type:   'village',
      typeEl: 'Χωριό',
      typeEn: 'Village',
      nameEl: v.name,
      nameEn: v.nameEn ?? v.name,
      area:   v.area,
      url:    `/villages/${v.slug}/`,
      icon:   '🏘',
    })),
    ...restaurants.map(r => ({
      type:   'restaurant',
      typeEl: placeTypeEl[r.type] ?? 'Εστιατόριο',
      typeEn: placeType(r).label,
      nameEl: r.name.el,
      nameEn: r.name.en,
      area:   r.location.area,
      url:    `/restaurants/${r.slug}/`,
      icon:   placeType(r).icon,
    })),
    ...stays.map(s => ({
      type:   'stay',
      typeEl: stayTypeEl[s.type] ?? 'Κατάλυμα',
      typeEn: stayType(s).label,
      nameEl: s.name.el,
      nameEn: s.name.en,
      area:   s.location.area,
      url:    `/stays/${s.slug}/`,
      icon:   stayType(s).icon,
    })),
  ];
}
