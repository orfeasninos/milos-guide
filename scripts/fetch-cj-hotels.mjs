/**
 * Fetches hotel/travel products from CJ Affiliate (ads.api.cj.com GraphQL).
 * Run with: npm run fetch:hotels
 *
 * Prerequisites – add to .env:
 *   CJ_API_KEY=your_personal_access_token
 *   CJ_COMPANY_ID=your_cid  ← Find this in CJ dashboard (see instructions below)
 *
 * How to find your CID:
 *   1. Log in at https://members.cj.com
 *   2. Click your account name (top right) → "Account Settings"
 *   3. Look for "Company ID" or check the URL: /member/…/account?cid=XXXXXXXX
 *
 * Saves results to: src/data/cj-hotels.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Helpers ────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    return Object.fromEntries(
      readFileSync(join(ROOT, '.env'), 'utf-8')
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
        .map(l => {
          const eq = l.indexOf('=');
          return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()];
        })
    );
  } catch { return {}; }
}

async function gql(token, query, variables = {}) {
  const res = await fetch('https://ads.api.cj.com/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: false, status: res.status, raw: text }; }
}

// ── GraphQL queries ────────────────────────────────────────────────────────

const TRAVEL_QUERY = /* graphql */ `
  query HotelsInMilos($companyId: ID!, $keywords: [String!], $limit: Int) {
    travelExperienceProducts(
      companyId: $companyId
      keywords: $keywords
      partnerStatus: JOINED
      limit: $limit
    ) {
      totalCount
      count
      resultList {
        adId
        advertiserId
        advertiserName
        title
        description
        imageLink
        additionalImageLink
        travelType
        destinationCity
        destinationCountry
        destinationLatitude
        destinationLongitude
        locationName
        starRating
        amenities
        freeBreakfast
        freeCancellation
        freeInternet
        roomType
        price  { amount currency }
        salePrice { amount currency }
        taxFees { amount currency }
        link
        joinedStatus
      }
    }
  }
`;

const PRODUCTS_QUERY = /* graphql */ `
  query AllProductsMilos($companyId: ID!, $keywords: [String!], $limit: Int) {
    products(
      companyId: $companyId
      keywords: $keywords
      partnerStatus: JOINED
      limit: $limit
    ) {
      totalCount
      count
      resultList {
        adId
        advertiserId
        advertiserName
        title
        description
        imageLink
        price  { amount currency }
        salePrice { amount currency }
        link
        joinedStatus
      }
    }
  }
`;

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('──────────────────────────────────────────────');
  console.log('  CJ Affiliate – Hotel & Travel Data Fetch');
  console.log('  API: ads.api.cj.com (GraphQL)');
  console.log('──────────────────────────────────────────────\n');

  const env = loadEnv();
  const TOKEN      = env.CJ_API_KEY;
  const COMPANY_ID = env.CJ_COMPANY_ID;

  if (!TOKEN) {
    console.error('❌  CJ_API_KEY is missing from .env');
    process.exit(1);
  }

  if (!COMPANY_ID) {
    console.error('❌  CJ_COMPANY_ID is missing from .env\n');
    console.error('   How to find your Company ID (CID):');
    console.error('   1. Log in at https://members.cj.com');
    console.error('   2. Click your name (top right) → Account Settings');
    console.error('   3. Your CID is shown as "Company ID" on that page');
    console.error('   4. Add it to .env:  CJ_COMPANY_ID=12345678\n');
    process.exit(1);
  }

  console.log(`✅  Token: ${TOKEN.slice(0, 6)}… (${TOKEN.length} chars)`);
  console.log(`✅  Company ID: ${COMPANY_ID}\n`);

  const result = {
    fetchedAt: new Date().toISOString(),
    companyId: COMPANY_ID,
    travelProducts: [],
    products: [],
    deepLinks: {},
  };

  // 1 ── Travel Experience products (hotels, vacation rentals, etc.)
  console.log('🏨  Searching travelExperienceProducts…');
  const keywordSets = [
    ['milos', 'greece'],
    ['milos island'],
    ['cyclades', 'greece', 'hotel'],
  ];

  for (const keywords of keywordSets) {
    console.log(`   keywords: [${keywords.join(', ')}]`);
    const r = await gql(TOKEN, TRAVEL_QUERY, {
      companyId: COMPANY_ID,
      keywords,
      limit: 200,
    });

    if (!r.ok || r.raw) {
      console.log(`   → HTTP ${r.status}: ${(r.raw ?? JSON.stringify(r.data)).slice(0, 200)}`);
      continue;
    }

    const errors = r.data?.errors;
    if (errors?.length) {
      console.log(`   → GraphQL error: ${errors.map(e => e.message).join('; ')}`);
      continue;
    }

    const list = r.data?.data?.travelExperienceProducts?.resultList ?? [];
    const total = r.data?.data?.travelExperienceProducts?.totalCount ?? 0;
    console.log(`   → ${list.length} returned (total available: ${total})`);
    result.travelProducts.push(...list);
  }

  // 2 ── General products (broader search)
  console.log('\n🔍  Searching general products…');
  const generalKeywords = [['hotel', 'milos', 'greece'], ['accommodation', 'greece']];

  for (const keywords of generalKeywords) {
    console.log(`   keywords: [${keywords.join(', ')}]`);
    const r = await gql(TOKEN, PRODUCTS_QUERY, {
      companyId: COMPANY_ID,
      keywords,
      limit: 200,
    });

    if (!r.ok || r.raw) {
      console.log(`   → HTTP ${r.status}: ${(r.raw ?? JSON.stringify(r.data)).slice(0, 200)}`);
      continue;
    }

    const errors = r.data?.errors;
    if (errors?.length) {
      console.log(`   → GraphQL error: ${errors.map(e => e.message).join('; ')}`);
      continue;
    }

    const list = r.data?.data?.products?.resultList ?? [];
    const total = r.data?.data?.products?.totalCount ?? 0;
    console.log(`   → ${list.length} returned (total available: ${total})`);
    result.products.push(...list);
  }

  // 3 ── Deduplicate
  const seen = new Set();
  result.travelProducts = result.travelProducts.filter(p => {
    if (seen.has(p.adId)) return false;
    seen.add(p.adId);
    return true;
  });
  const seen2 = new Set(result.travelProducts.map(p => p.adId));
  result.products = result.products.filter(p => {
    if (seen2.has(p.adId)) return false;
    seen2.add(p.adId);
    return true;
  });

  // 4 ── Build deep links for each accommodation
  const accommodations = JSON.parse(
    readFileSync(join(ROOT, 'src/data/accommodations.json'), 'utf-8')
  );

  console.log('\n🔗  Building deep links per accommodation…');

  // Map existing products to accommodation slugs by name match
  const allProducts = [...result.travelProducts, ...result.products];

  for (const acc of accommodations) {
    const name = typeof acc.name === 'object' ? acc.name.en : acc.name;

    // Try to find a direct product match
    const match = allProducts.find(p => {
      const t = (p.title ?? '').toLowerCase();
      const n = name.toLowerCase();
      return t.includes(n.slice(0, 15)) || n.includes(t.slice(0, 15));
    });

    if (match?.link) {
      result.deepLinks[acc.slug] = {
        type:    'product',
        adId:    match.adId,
        advertiserName: match.advertiserName,
        title:   match.title,
        price:   match.price,
        salePrice: match.salePrice,
        clickUrl: match.link,
      };
      console.log(`   ✓ ${acc.slug} → matched product "${match.title?.slice(0, 40)}"`);
    }
    // else: no product match, page will fall back to generic booking.com link
  }

  // 5 ── Save
  const outPath = join(ROOT, 'src/data/cj-hotels.json');
  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

  const totalProducts = result.travelProducts.length + result.products.length;
  const linkedCount   = Object.keys(result.deepLinks).length;

  console.log('\n──────────────────────────────────────────────');
  console.log('✅  Saved to src/data/cj-hotels.json');
  console.log(`   Travel products:  ${result.travelProducts.length}`);
  console.log(`   Other products:   ${result.products.length}`);
  console.log(`   Deep links built: ${linkedCount} / ${accommodations.length}`);
  console.log('──────────────────────────────────────────────\n');

  if (totalProducts === 0) {
    console.log('💡  No joined products found. Checking which advertisers have Milos hotels…\n');

    // Discover available (not-yet-joined) advertisers with Milos content
    const discoverQuery = /* graphql */ `
      query Discover($companyId: ID!) {
        travelExperienceProducts(
          companyId: $companyId
          keywords: ["milos", "greece"]
          limit: 50
        ) {
          totalCount
          resultList {
            advertiserId
            advertiserName
            joinedStatus
          }
        }
      }
    `;

    const dr = await gql(TOKEN, discoverQuery, { companyId: COMPANY_ID });
    const dList = dr.data?.data?.travelExperienceProducts?.resultList ?? [];
    const advMap = new Map();
    for (const p of dList) {
      if (!advMap.has(p.advertiserId)) {
        advMap.set(p.advertiserId, { name: p.advertiserName, joined: p.joinedStatus, id: p.advertiserId });
      }
    }

    const notJoined = [...advMap.values()].filter(a => !a.joined);
    const alreadyJoined = [...advMap.values()].filter(a => a.joined);

    if (alreadyJoined.length) {
      console.log('   ✅ Already joined (but no Milos products yet):');
      alreadyJoined.forEach(a => console.log(`      • ${a.name} (ID: ${a.id})`));
      console.log();
    }

    if (notJoined.length) {
      console.log('   🎯 Advertisers with Milos hotels — JOIN THESE NOW:');
      notJoined.forEach(a => console.log(`      • ${a.name} (Advertiser ID: ${a.id})`));
      console.log();
      console.log('   How to join:');
      console.log('   1. Go to https://members.cj.com → Advertisers → Join Programs');
      notJoined.forEach(a => console.log(`   2. Search: "${a.name}" → click "Join Program"`));
      console.log('   3. Most travel programs are auto-approved (check email for confirmation)');
      console.log('   4. Once approved, run: npm run fetch:hotels\n');
    } else {
      console.log('   No specific advertisers found for Milos via keyword search.');
      console.log('   Try joining: Hotels.com, Expedia, Booking.com, trivago, Vrbo\n');
    }
  }

  if (totalProducts > 0 && linkedCount < accommodations.length) {
    console.log(`ℹ️   ${accommodations.length - linkedCount} accommodations have no direct product match.`);
    console.log('   Those pages will show a generic Booking.com search link.\n');
  }
}

main().catch(err => {
  console.error('\n💥  Unexpected error:', err.message || err);
  process.exit(1);
});
