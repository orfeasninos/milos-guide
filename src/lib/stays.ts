import staysRaw from '../data/stays.json';
import { bookingLink } from './booking';

// `about`: a longer description written by hand, shown under the short one.
export type Stay = (typeof staysRaw)[number] & { about?: string };

export const stays = [...staysRaw].sort((a, b) => a.name.en.localeCompare(b.name.en));

export const stayTypes: Record<string, { label: string; plural: string; icon: string; schema: string }> = {
  hotel:  { label: 'Hotel',  plural: 'Hotels',          icon: '🏨', schema: 'Hotel' },
  studio: { label: 'Studio', plural: 'Studios & rooms', icon: '🛏', schema: 'LodgingBusiness' },
  villa:  { label: 'Villa',  plural: 'Villas',          icon: '🏡', schema: 'LodgingBusiness' },
};

export const stayType = (s: Stay) => stayTypes[s.type] ?? stayTypes.hotel;

// Straight to the property's Booking.com page when we know it (bookingUrl in stays.json),
// otherwise a search by name. `sid` tags the click in CJ reports.
export const stayBookingUrl = (s: Stay): string =>
  bookingLink(
    s.bookingUrl ?? `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${s.name.en}, Milos, Greece`)}`,
    `stay-${s.slug}`,
  );

// Short notes per area for the "where to stay" guide on /stays/.
export const areaNotes: Record<string, string> = {
  Adamas:   'The port town. Ferries, car rental, buses and plenty of tavernas on the doorstep: the easiest base without a car.',
  Pollonia: 'A quiet fishing village in the north-east, with the ferry to Kimolos and some of the best fish tavernas on the island.',
  Plaka:    'The hilltop capital. Cycladic lanes, the Kastro at sunset and the liveliest evenings, but you will want a car for the beaches.',
};
