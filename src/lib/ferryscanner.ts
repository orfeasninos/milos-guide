// Ferryscanner affiliate (Tapfiliate). The `ref` parameter is what credits the booking; the
// long version's utm_* params are optional. Pays ~3% of the ticket value (33% of their margin).
// It opens the generic ferry search: the search page only takes a route together with fixed
// dates, which would go stale, so plain links stay generic.
export const FERRYSCANNER_URL = 'https://www.ferryscanner.com/en/ferry/?ref=zja0ntn';

// Search box widget (iframe) from Ferryscanner's affiliate form, route preset to Piraeus (PIR)
// → Milos (MLO). btncolor is the site's --deep-blue without the '#'.
export const FERRYSCANNER_WIDGET_SRC =
  'https://www.ferryscanner.com/en/affiliates/ferry?ref=zja0ntn&utm_source=zja0ntn' +
  '&utm_campaign=Ferryscanner+Affiliate+Program+en&dep=PIR&arr=MLO&btncolor=286aff' +
  '&layout=horizontal&darkMode=false';
