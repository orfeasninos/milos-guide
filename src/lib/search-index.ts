import sightsRaw from '../data/sights.json';
import beachesRaw from '../data/beaches.json';
import villagesRaw from '../data/villages.json';
import { beachAreaLabel } from './beaches';
import { restaurants, placeType, activePartner } from './restaurants';
import { partnerLogo } from './public-files';
import { stays, stayType } from './stays';
import type { SearchItem } from './search-match';

const placeTypeEl: Record<string, string> = { restaurant: 'Εστιατόριο', cafe: 'Καφέ' };
const stayTypeEl: Record<string, string> = { hotel: 'Ξενοδοχείο', studio: 'Στούντιο', villa: 'Βίλα' };

// Section and info pages. Listed first so "beaches" puts the Beaches page above every single beach.
// Keywords mix English and Greek because typed queries come in both.
const guidePages: { nameEn: string; nameEl: string; url: string; icon: string; logo?: string; keywords: string }[] = [
  { nameEn: 'Beaches',            nameEl: 'Παραλίες',           url: '/beaches/',      icon: '🏖', keywords: 'swim sand wind παραλια κολυμπι' },
  { nameEn: 'Sights',             nameEl: 'Αξιοθέατα',          url: '/sights/',       icon: '🏛', keywords: 'attractions things to do museum catacombs αξιοθεατα μουσειο' },
  { nameEn: 'Villages',           nameEl: 'Χωριά',              url: '/villages/',     icon: '🏘', keywords: 'towns villages χωρια' },
  { nameEn: 'Restaurants & Cafés', nameEl: 'Εστιατόρια & Καφέ', url: '/restaurants/',  icon: '🍽', keywords: 'eat food taverna tavern cafe coffee φαγητο ταβερνα καφε' },
  { nameEn: 'Where to Stay',      nameEl: 'Διαμονή',            url: '/stays/',        icon: '🛏', keywords: 'hotels accommodation rooms villas studios ξενοδοχεια καταλυματα δωματια' },
  { nameEn: 'Map of Milos',       nameEl: 'Χάρτης της Μήλου',   url: '/map/',          icon: '🗺', logo: '/icons/milos-map.svg', keywords: 'map χαρτης' },
  { nameEn: 'How to Get to Milos', nameEl: 'Πώς θα έρθεις στη Μήλο', url: '/how-to-reach/', icon: '🚢', keywords: 'ferry boat flight plane airport port piraeus tickets car rental getting around πλοιο αεροπλανο πτηση αεροδρομιο λιμανι πειραιας εισιτηρια ενοικιαση αυτοκινητου' },
  { nameEn: 'Weather',            nameEl: 'Καιρός',             url: '/weather/',      icon: '☀️', keywords: 'forecast wind meltemi sea temperature waves uv καιρος προγνωση ανεμος μελτεμι θαλασσα κυμα' },
  { nameEn: 'About Milos',        nameEl: 'Σχετικά με τη Μήλο', url: '/about/',        icon: 'ℹ️', keywords: 'history geography venus aphrodite when to visit seasons ιστορια γεωγραφια αφροδιτη εποχες' },
  { nameEn: 'Contact',            nameEl: 'Επικοινωνία',        url: '/contact/',      icon: '✉️', keywords: 'email contact partnership advertise επικοινωνια συνεργασια διαφημιση' },
];

// Flat index of every page worth searching. Built at build time for /search/ and /search-index.json.
export function buildSearchIndex(): SearchItem[] {
  return [
    ...guidePages.map(p => ({
      type:   'guide',
      typeEl: 'Οδηγός',
      typeEn: 'Guide',
      ...p,
    })),
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
      // undefined drops out of the JSON, so the index fetched by the header box stays small.
      logo:   partnerLogo(activePartner(r)) ?? undefined,
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
