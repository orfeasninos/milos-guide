import fs   from "fs";
import path from "path";
import "dotenv/config";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.error("❌ Δεν βρέθηκε το GOOGLE_PLACES_API_KEY στο .env");
  process.exit(1);
}

// ─── SEED DATA ───────────────────────────────────────────────────────────────

const seedTaverns = [
  { name: "Barko tavern restaurant",              location: "Adamas",      slug: "barko-tavern",         isFeatured: false },
  { name: "Sirocco Volcanic Restaurant",          location: "Paleochori",  slug: "sirocco-restaurant",   isFeatured: false },
  { name: "Ενάλιον",                             location: "Pollonia",    slug: "enalion-restaurant",   isFeatured: false },
  { name: "O! Hamos!",                            location: "Papikinou",   slug: "o-hamos-tavern",       isFeatured: false },
  { name: "Avli-Milos",                           location: "Plaka",       slug: "avli-milos",           isFeatured: false },
  { name: "Mikros Apoplous - Seafood and more",   location: "Adamas",      slug: "mikros-apoplous",      isFeatured: false },
  { name: "τα γλαρονήσια",                       location: "Tripiti",     slug: "glaronisia-milos",     isFeatured: false },
  { name: "Barriello",                            location: "Triovassalos",slug: "barriello-milos",      isFeatured: false },
  { name: "Gialos",                               location: "Pollonia",    slug: "gialos-milos",         isFeatured: false }
];

const seedBeaches = [
  { name: "Sarakiniko",  location: "Sarakiniko", slug: "sarakiniko",  accessType: "road",  facilities: ["parking"] },
  { name: "Tsigrado",    location: "Milos",       slug: "tsigrado",    accessType: "hike",  facilities: [] },
  { name: "Fyriplaka",   location: "Milos",       slug: "fyriplaka",   accessType: "road",  facilities: ["sunbeds","snack bar","parking"] },
  { name: "Paleochori",  location: "Paleochori",  slug: "paleochori",  accessType: "road",  facilities: ["sunbeds","snack bar","parking"] },
  { name: "Provatas",    location: "Milos",       slug: "provatas",    accessType: "road",  facilities: ["sunbeds","snack bar","parking"] },
  { name: "Papafragas",  location: "Milos",       slug: "papafragas",  accessType: "hike",  facilities: [] }
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function extractShortHours(weekdayDescriptions) {
  if (!weekdayDescriptions?.length) return "13:00 - 00:00";
  const parts = weekdayDescriptions[0].split(": ");
  return parts[1] || "13:00 - 00:00";
}

async function fetchPlace(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY.trim(),
      "X-Goog-FieldMask":
        "places.displayName,places.googleMapsUri,places.formattedAddress,places.nationalPhoneNumber,places.location,places.rating,places.priceLevel,places.regularOpeningHours,places.photos,places.websiteUri",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "el" }),
  });
  const data = await res.json();
  return data.places?.[0] || null;
}

// ─── PHOTO DOWNLOAD ───────────────────────────────────────────────────────────

async function downloadPhoto(photoRef, slug, type) {
  if (!photoRef) return null;

  const dir  = path.join(process.cwd(), "public", "images", type);
  const file = path.join(dir, `${slug}.jpg`);
  const url  = `/images/${type}/${slug}.jpg`;

  // Skip if already downloaded
  if (fs.existsSync(file)) {
    console.log(`    ⏭  Photo exists: ${url}`);
    return url;
  }

  try {
    // Step 1: get the actual photo URI (skipHttpRedirect returns JSON instead of redirect)
    const metaRes = await fetch(
      `https://places.googleapis.com/v1/${photoRef}/media?key=${API_KEY}&maxWidthPx=900&skipHttpRedirect=true`
    );
    const meta = await metaRes.json();

    if (!meta.photoUri) {
      console.warn(`    ⚠️  No photoUri for ${slug}`);
      return null;
    }

    // Step 2: download the actual image
    const imgRes = await fetch(meta.photoUri);
    if (!imgRes.ok) {
      console.warn(`    ⚠️  Image download failed for ${slug}: ${imgRes.status}`);
      return null;
    }

    const buffer = await imgRes.arrayBuffer();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, Buffer.from(buffer));

    console.log(`    📸 Saved: ${url}`);
    return url;
  } catch (err) {
    console.warn(`    ⚠️  Photo error (${slug}): ${err.message}`);
    return null;
  }
}

// ─── TAVERNS ─────────────────────────────────────────────────────────────────

async function fetchTaverns() {
  const finalData = [];
  console.log("\n🍽️  Fetching taverns...");

  for (const tavern of seedTaverns) {
    try {
      console.log(`  🔍 ${tavern.name}`);
      const place = await fetchPlace(`${tavern.name}, ${tavern.location}, Milos`);

      if (!place) {
        console.error(`  ❌ Not found: ${tavern.name}`);
        continue;
      }

      let priceRange = "€€";
      if (place.priceLevel === "PRICE_LEVEL_INEXPENSIVE")    priceRange = "€";
      if (place.priceLevel === "PRICE_LEVEL_MODERATE")       priceRange = "€€";
      if (place.priceLevel === "PRICE_LEVEL_EXPENSIVE")      priceRange = "€€€";
      if (place.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") priceRange = "€€€€";

      const photoRef  = place.photos?.[0]?.name || null;
      const localPhoto = await downloadPhoto(photoRef, tavern.slug, "taverns");
      const weekdays  = place.regularOpeningHours?.weekdayDescriptions || ["Δεν ανακοινώθηκε ωράριο"];

      finalData.push({
        slug:        tavern.slug,
        name:        place.displayName?.text || tavern.name,
        description: `Απολαύστε αυθεντικές γεύσεις στο εστιατόριο ${place.displayName?.text || tavern.name} στον προορισμό ${tavern.location} της Μήλου.`,
        location: {
          area:    tavern.location,
          address: place.formattedAddress || `${tavern.location}, Milos`,
        },
        googleMapsUri: place.googleMapsUri || null,
        photoRef,
        localPhoto,   // ← static path, e.g. /images/taverns/psitolatreia-milos.jpg
        cuisine:       ["Παραδοσιακή Ελληνική"],
        servesCuisine: "Greek",
        phone:         place.nationalPhoneNumber || "",
        website:       place.websiteUri || null,
        coordinates: {
          lat: place.location?.latitude  || 0,
          lng: place.location?.longitude || 0,
        },
        rating:       place.rating || 0,
        priceRange,
        hours:        extractShortHours(weekdays),
        openingHours: weekdays,
        isFeatured:   tavern.isFeatured,
      });

      console.log(`  ✅ ${place.displayName?.text}`);
    } catch (err) {
      console.error(`  ❌ Error (${tavern.name}):`, err.message);
    }
  }

  return finalData;
}

// ─── BEACHES ─────────────────────────────────────────────────────────────────

async function fetchBeaches() {
  const finalData = [];
  console.log("\n🏖️  Fetching beaches...");

  for (const beach of seedBeaches) {
    try {
      console.log(`  🔍 ${beach.name}`);
      const place = await fetchPlace(`${beach.name} beach, Milos, Greece`);

      if (!place) {
        console.error(`  ❌ Not found: ${beach.name}`);
        continue;
      }

      const photoRef   = place.photos?.[0]?.name || null;
      const localPhoto = await downloadPhoto(photoRef, beach.slug, "beaches");

      finalData.push({
        slug:        beach.slug,
        name:        place.displayName?.text || beach.name,
        description: `Ανακαλύψτε την παραλία ${place.displayName?.text || beach.name} στη Μήλο — έναν από τους πιο εντυπωσιακούς προορισμούς του νησιού.`,
        location: {
          area:    beach.location,
          address: place.formattedAddress || `${beach.location}, Milos`,
        },
        googleMapsUri: place.googleMapsUri || null,
        photoRef,
        localPhoto,   // ← static path, e.g. /images/beaches/sarakiniko.jpg
        website:       place.websiteUri || null,
        coordinates: {
          lat: place.location?.latitude  || 0,
          lng: place.location?.longitude || 0,
        },
        rating:      place.rating || 0,
        accessType:  beach.accessType,
        facilities:  beach.facilities,
      });

      console.log(`  ✅ ${place.displayName?.text}`);
    } catch (err) {
      console.error(`  ❌ Error (${beach.name}):`, err.message);
    }
  }

  return finalData;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting fetch-all-data...");

  const [taverns, beaches] = await Promise.all([fetchTaverns(), fetchBeaches()]);

  const dataDir = path.join(process.cwd(), "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(path.join(dataDir, "taverns.el.json"), JSON.stringify(taverns, null, 2), "utf-8");
  fs.writeFileSync(path.join(dataDir, "beaches.el.json"), JSON.stringify(beaches, null, 2), "utf-8");

  console.log(`\n🎉 Done!`);
  console.log(`   taverns.el.json → ${taverns.length} entries`);
  console.log(`   beaches.el.json → ${beaches.length} entries`);
  console.log(`   Photos saved to → public/images/`);
  console.log(`\n💡 Next: translate src/data/taverns.el.json → taverns.en.json`);
  console.log(`         translate src/data/beaches.el.json  → beaches.en.json`);
}

main();