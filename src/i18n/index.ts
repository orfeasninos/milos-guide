// src/i18n/index.ts

export const languages = {
  en: 'English',
  el: 'Ελληνικά',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    // Nav
    'nav.beaches':    'Beaches',
    'nav.eat':        'Food',
    'nav.villages':   'Villages',
    'nav.boattours':  'Boat Tours',
    'nav.soon':       'Coming soon',

    // Footer
    'footer.tagline':    'The most complete guide\nto Milos — no ads.',
    'footer.explore':    'Explore',
    'footer.beaches':    'Beaches',
    'footer.restaurants':'Restaurants',
    'footer.villages':   'Villages',
    'footer.boattours':  'Boat Tours',
    'footer.rentals':    'Car Rentals',
    'footer.top-beaches':'Top Beaches',
    'footer.info':       'Information',
    'footer.howtoget':   'How to get there',
    'footer.whentogo':   'When to visit',
    'footer.map':        'Island map',
    'footer.contact':    'Contact',
    'footer.copy':       '© 2026 Milos.guide',
    'footer.note':       'Made with love for Milos · No ads · No sponsors',

    // Common
    'common.seeall':     'See all →',
    'common.soon':       'Coming soon',
    'common.back.beaches': '← All beaches',
    'common.back.eat':     '← All restaurants',
    'common.back.villages':'← All villages',
    'common.mapslink':   'Open in Google Maps ↗',
    'common.website':    'Visit website ↗',
    'common.rating':     'Rating',
    'common.access':     'Access',
    'common.facilities': 'Facilities',
    'common.area':       'Area',
    'common.today':      'Today',
    'common.phone':      'Phone',
    'common.address':    'Address',
    'common.price':      'Price',
    'common.hours':      'Opening hours',
    'common.featured':   'Featured',
    'common.nearby.taverns': 'Nearby restaurants',
    'common.nearby.beaches': 'Nearby beaches',

    // Access types
    'access.road': 'By car',
    'access.hike': 'Hiking trail',
    'access.boat': 'Boat only',

    // Pages
    'beaches.title':      'Beaches in Milos',
    'beaches.desc':       'Volcanic rocks, crystal waters, hidden caves.',
    'beaches.filter.access':   'Access',
    'beaches.filter.facilities':'Facilities',
    'beaches.filter.all': 'All',
    'beaches.empty':      'No beaches found with these filters.',
    'beaches.reset':      'Show all',

    'eat.title':          'Food in Milos',
    'eat.filter.area':    'All areas',
    'eat.filter.featured':'Featured only',
    'eat.empty':          'No restaurants found.',

    'villages.title':     'Villages of Milos',
    'villages.desc':      'Milos is more than beaches.',
    'villages.filter.all':'All',

    'about.title':        'About Milos',
    'about.desc':         'Everything you need to know about Milos.',
  },

  el: {
    // Nav
    'nav.beaches':    'Παραλίες',
    'nav.eat':        'Φαγητό',
    'nav.villages':   'Χωριά',
    'nav.boattours':  'Boat Tours',
    'nav.soon':       'Σύντομα',

    // Footer
    'footer.tagline':    'Ο πιο πλήρης οδηγός\nγια τη Μήλο — χωρίς διαφημίσεις.',
    'footer.explore':    'Εξερεύνηση',
    'footer.beaches':    'Παραλίες',
    'footer.restaurants':'Εστιατόρια',
    'footer.villages':   'Χωριά',
    'footer.boattours':  'Boat Tours',
    'footer.rentals':    'Ενοικιάσεις',
    'footer.top-beaches':'Κορυφαίες παραλίες',
    'footer.info':       'Πληροφορίες',
    'footer.howtoget':   'Πώς να φτάσετε',
    'footer.whentogo':   'Πότε να έρθετε',
    'footer.map':        'Χάρτης νησιού',
    'footer.contact':    'Επικοινωνία',
    'footer.copy':       '© 2026 Milos.guide',
    'footer.note':       'Φτιαγμένο με αγάπη για τη Μήλο · Χωρίς διαφημίσεις · Χωρίς χορηγούς',

    // Common
    'common.seeall':     'Όλα →',
    'common.soon':       'Σύντομα',
    'common.back.beaches': '← Όλες οι παραλίες',
    'common.back.eat':     '← Όλα τα εστιατόρια',
    'common.back.villages':'← Όλα τα χωριά',
    'common.mapslink':   'Άνοιγμα στο Google Maps ↗',
    'common.website':    'Επίσκεψη ιστοσελίδας ↗',
    'common.rating':     'Αξιολόγηση',
    'common.access':     'Πρόσβαση',
    'common.facilities': 'Παροχές',
    'common.area':       'Περιοχή',
    'common.today':      'Σήμερα',
    'common.phone':      'Τηλέφωνο',
    'common.address':    'Διεύθυνση',
    'common.price':      'Τιμές',
    'common.hours':      'Ωράριο λειτουργίας',
    'common.featured':   'Επιλεγμένο',
    'common.nearby.taverns': 'Εστιατόρια κοντά',
    'common.nearby.beaches': 'Παραλίες κοντά',

    // Access types
    'access.road': 'Οδικώς',
    'access.hike': 'Πεζοπορία',
    'access.boat': 'Μόνο με βάρκα',

    // Pages
    'beaches.title':      'Παραλίες στη Μήλο',
    'beaches.desc':       'Ηφαιστειακοί βράχοι, κρυστάλλινα νερά, κρυφά σπήλαια.',
    'beaches.filter.access':   'Πρόσβαση',
    'beaches.filter.facilities':'Παροχές',
    'beaches.filter.all': 'Όλες',
    'beaches.empty':      'Δεν βρέθηκαν παραλίες με αυτά τα φίλτρα.',
    'beaches.reset':      'Εμφάνιση όλων',

    'eat.title':          'Φαγητό στη Μήλο',
    'eat.filter.area':    'Όλες οι περιοχές',
    'eat.filter.featured':'Μόνο επιλεγμένα',
    'eat.empty':          'Δεν βρέθηκαν εστιατόρια.',

    'villages.title':     'Χωριά της Μήλου',
    'villages.desc':      'Η Μήλος δεν είναι μόνο παραλίες.',
    'villages.filter.all':'Όλα',

    'about.title':        'Σχετικά με τη Μήλο',
    'about.desc':         'Όλα όσα πρέπει να ξέρεις για τη Μήλο.',
  },
} as const;

export type UIKey = keyof typeof ui[typeof defaultLang];

export function getLangFromUrl(url: URL): Lang {
  const [, firstSegment] = url.pathname.split('/');
  if (firstSegment === 'el') return 'el';
  return 'en';
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return (ui[lang] as Record<string, string>)[key] ?? (ui[defaultLang] as Record<string, string>)[key] ?? key;
  };
}

export function getLocalePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'en') return clean;
  return `/el${clean}`;
}

export function getAlternateLang(lang: Lang): Lang {
  return lang === 'en' ? 'el' : 'en';
}