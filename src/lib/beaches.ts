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

export const getBeachName = (b: { name: string | { en: string } }): string =>
  typeof b.name === 'object' ? b.name.en : b.name;

// Rough popularity order, used to break ties when many beaches are equally sheltered.
export const POPULAR_BEACHES = [
  'sarakiniko', 'kleftiko', 'firopotamos', 'tsigrado', 'firiplaka', 'paleochori',
  'provatas', 'papafragas', 'plathiena', 'agia-kiriaki', 'pollonia-beach', 'mandrakia',
  'achivadolimni', 'gerontas', 'tria-pigadia', 'kipos-beach', 'agios-sostis', 'papikinou-beach',
];
