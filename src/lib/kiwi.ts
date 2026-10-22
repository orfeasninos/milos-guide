// Kiwi.com flights via Travelpayouts. Travelpayouts only offers ready-made links for Kiwi
// (no custom deep links), so this opens the Kiwi.com UK homepage; visitors search ATH → MLO
// themselves. The tpk.lu redirect adds a fresh click id per visit, so always link to it
// rather than to the kiwi.com URL it resolves to.
export const KIWI_FLIGHTS_URL = 'https://kiwi.tpk.lu/Rudhw9eM';

// Travelpayouts "Flights Search Form" widget for Kiwi.com: destination preset to MLO, origin
// left to the widget (it guesses the visitor's city). Hotels checkbox and referral link are
// off so it doesn't compete with our Booking.com links. Colours match the site.
export const KIWI_WIDGET_SRC =
  'https://tpscr.com/content?currency=eur&trs=541264&shmarker=741231.how-to-reach-flights&locale=en' +
  '&default_destination=MLO&stops=any&show_hotels=false&powered_by=false&border_radius=8&plain=true' +
  '&color_button=%230d2b4e&color_button_text=%23ffffff&promo_id=3414&campaign_id=111';

// The two airlines flying Athens–Milos, for visitors who prefer to book direct.
export const airlines = [
  { name: 'Sky Express', url: 'https://www.skyexpress.gr/en' },
  { name: 'Olympic Air (Aegean)', url: 'https://www.olympicair.com/en/' },
];
