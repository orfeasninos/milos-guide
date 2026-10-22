// Booking.com affiliate links via CJ (program "Booking.com MEA", advertiser 4347392 — the
// one whose serviceable area includes Greece). PID is our CJ website, AID the link we
// deep-link through. Commission is session-based (no cookie), so always send people
// straight to Milos results, never to the Booking.com homepage.
const CJ_PID = '101772243';
const CJ_AID = '17343551';

// `sid` shows up in CJ reports, so we can tell which page a booking came from.
export function bookingLink(target: string, sid?: string): string {
  const params = new URLSearchParams({ url: target });
  if (sid) params.set('sid', sid);
  return `https://www.tkqlhce.com/click-${CJ_PID}-${CJ_AID}?${params}`;
}

// Hotel search for a place on Milos, e.g. bookingSearch('Plaka') → "Plaka, Milos, Greece".
export function bookingSearch(place?: string, sid?: string): string {
  const ss = [place?.trim(), 'Milos', 'Greece'].filter(Boolean).join(', ');
  return bookingLink(`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(ss)}`, sid);
}
