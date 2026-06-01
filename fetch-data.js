import fs from "fs";
import path from "path";
import "dotenv/config";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DOWNLOAD_PHOTOS = process.argv.includes("--photos");

if (!API_KEY) {
  console.error("❌ Δεν βρέθηκε το GOOGLE_PLACES_API_KEY στο .env");
  process.exit(1);
}

if (!DOWNLOAD_PHOTOS) {
  console.log("ℹ️  Photo download skipped. Run with --photos to download.");
}

// ─── SEED DATA ───────────────────────────────────────────────────────────────

const seedTaverns = [
  { name: "Barko tavern restaurant", location: "Adamas", slug: "barko-tavern", isFeatured: false },
  { name: "Sirocco Volcanic Restaurant", location: "Paleochori", slug: "sirocco-restaurant", isFeatured: false },
  { name: "Ενάλιον", location: "Pollonia", slug: "enalion-restaurant", isFeatured: false },
  { name: "O! Hamos!", location: "Papikinou", slug: "o-hamos-tavern", isFeatured: false },
  { name: "Avli-Milos", location: "Plaka", slug: "avli-milos", isFeatured: false },
  { name: "Mikros Apoplous - Seafood and more", location: "Adamas", slug: "mikros-apoplous", isFeatured: false },
  { name: "τα γλαρονήσια", location: "Tripiti", slug: "glaronisia-milos", isFeatured: false },
  { name: "Barriello", location: "Triovassalos", slug: "barriello-milos", isFeatured: false },
  { name: "Gialos", location: "Pollonia", slug: "gialos-milos", isFeatured: false },
  { name: "Medusa Milos", location: "Mandrakia", slug: "medusa-milos", isFeatured: false },
  { name: "Methismeni Politeia", location: "Tripiti", slug: "methismeni-politeia", isFeatured: true },
  { name: "Archontoula", location: "Plaka", slug: "archontoula-milos", isFeatured: false },
  { name: "Foras", location: "Plaka", slug: "foras-milos", isFeatured: false },
  { name: "Nostos Seafood Experience", location: "Adamas", slug: "nostos-seafood", isFeatured: false },
  { name: "Mpakalikon Galanis", location: "Triovasalos", slug: "galanis-mpakalikon", isFeatured: false },
  { name: "Estiatorio Iliovasilema", location: "Milos", slug: "iliovasilema-milos", isFeatured: true },
  { name: "Psitolatreia", location: "Triovasalos", slug: "psitolatreia-milos", isFeatured: true },
  { name: "Astakas Milos", location: "Klima", slug: "astakas-milos", isFeatured: false },
  { name: "O Zigos", location: "Adamas", slug: "zigos-milos", isFeatured: false },
  { name: "Trapatselis", location: "Adamas", slug: "trapatselis-milos", isFeatured: false },
  { name: "Estiatorio Ergina", location: "Tripiti", slug: "ergina-milos", isFeatured: false },
  { name: "Cavos Restaurant Milos", location: "Adamas", slug: "cavos-milos", isFeatured: false },
  { name: "Alkis", location: "Pollonia", slug: "alkis-milos", isFeatured: false },
  { name: "Nama Milos", location: "Pollonia", slug: "nama-milos", isFeatured: false },
  { name: "Lyra Milos - The sound of taste", location: "Pollonia", slug: "lyra-milos", isFeatured: false },
  { name: "Rifaki", location: "Pollonia", slug: "rifaki-milos", isFeatured: false },
  { name: "Akri", location: "Adamas", slug: "akri-milos", isFeatured: false }
];

const seedBeaches = [
  { name: "Sarakiniko", location: "Milos", slug: "sarakiniko", accessType: "road", facilities: ["parking"] },
  { name: "Fyropotamos", location: "Milos", slug: "fyropotamos", accessType: "road", facilities: [] },
  { name: "Tsigrado", location: "Milos", slug: "tsigrado", accessType: "road", facilities: [] },
  { name: "Fyriplaka", location: "Milos", slug: "fyriplaka", accessType: "road", facilities: ["sunbeds", "snack bar", "parking"] },
  { name: "Paleochori", location: "Milos", slug: "paleochori", accessType: "road", facilities: ["sunbeds", "snack bar", "parking"] },
  { name: "Provatas", location: "Milos", slug: "provatas", accessType: "road", facilities: ["sunbeds", "snack bar", "parking"] },
  { name: "Papafragas", location: "Milos", slug: "papafragas", accessType: "road", facilities: [] },
  { name: "Kleftiko", location: "Milos", slug: "kleftiko", accessType: "boat", facilities: [] },
  { name: "Agia Kyriaki", location: "Milos", slug: "agia-kyriaki", accessType: "road", facilities: ["sunbeds"] },
  { name: "Gerontas", location: "Milos", slug: "gerontas", accessType: "road", facilities: [] },
  { name: "Triades", location: "Milos", slug: "triades", accessType: "road", facilities: [] },
  { name: "Rivari", location: "Milos", slug: "rivari", accessType: "road", facilities: [] },
  { name: "Ammoudaki", location: "Milos", slug: "ammoudaki", accessType: "road", facilities: [] },
  { name: "Sikia beach", location: "Milos", slug: "sikia-beach", accessType: "boat", facilities: [] },
  { name: "Plathiena", location: "Milos", slug: "plathiena", accessType: "road", facilities: ["sunbeds"] },
  { name: "Paralia theiorycheio", location: "Milos", slug: "theiorycheia", accessType: "road", facilities: [] },
  { name: "Achivadolimni", location: "Milos", slug: "achivadolimni", accessType: "road", facilities: ["sunbeds"] },
  { name: "Agios Sostis", location: "Milos", slug: "agios-sostis", accessType: "road", facilities: [] },
  { name: "Tria pigadia", location: "Milos", slug: "tria-pigadia", accessType: "road", facilities: [] },
  { name: "Kastanas", location: "Milos", slug: "kastanas", accessType: "road", facilities: [] },
  { name: "Polonia beach", location: "Milos", slug: "polonia-beach", accessType: "road", facilities: [] },
  { name: "Mandrakia", location: "Milos", slug: "mandrakia", accessType: "road", facilities: [] },
  { name: "Kalogries beach", location: "Milos", slug: "kalogries-beach", accessType: "road", facilities: [] },
  { name: "Aggathia", location: "Milos", slug: "aggathia", accessType: "road", facilities: [] },
  { name: "Ammoudaraki beach", location: "Milos", slug: "ammoudaraki-beach", accessType: "road", facilities: [] },
  { name: "Kalamos beach", location: "Milos", slug: "kalamos", accessType: "road", facilities: [] },
  { name: "Agios Ioannis beach", location: "Milos", slug: "agios-ioannis-beach", accessType: "road", facilities: [] },
  { name: "Paralia Kipos", location: "Milos", slug: "kipos-beach", accessType: "road", facilities: [] },
  { name: "Deep blue beach", location: "Milos", slug: "deep-blue-beach", accessType: "road", facilities: [] },
  { name: "Psathi beach", location: "Milos", slug: "psathi-beach", accessType: "road", facilities: [] },
  { name: "Kolympionas beach", location: "Milos", slug: "kolympionas-beach", accessType: "road", facilities: [] },
  { name: "Voudia beach", location: "Milos", slug: "voudia-beach", accessType: "road", facilities: [] },
  { name: "Pachaina beach", location: "Milos", slug: "pachaina-beach", accessType: "road", facilities: [] },
  { name: "Alogomantra beach", location: "Milos", slug: "alogomantra-beach", accessType: "road", facilities: [] },
  { name: "Mytakas beach", location: "Milos", slug: "mytakas-beach", accessType: "road", facilities: [] },
  { name: "Nerodafni beach", location: "Milos", slug: "nerodafni-beach", accessType: "road", facilities: [] },
  { name: "Klima beach", location: "Milos", slug: "klima", accessType: "road", facilities: [] },
  { name: "Papikinou beach", location: "Milos", slug: "papikinou-beach", accessType: "road", facilities: [] },
  { name: "Agios Dimitrios beach", location: "Milos", slug: "agios-dimitrios-beach", accessType: "road", facilities: [] },
];

const tavernTranslations = {
  "barko-tavern": { name: "Barko Tavern", description: "Enjoy authentic Greek cuisine at Barko Tavern in Adamas, right by the harbour." },
  "sirocco-restaurant": { name: "Sirocco Volcanic Restaurant", description: "Dine on a geothermally heated beach at Sirocco in Paleochori — a truly unique experience." },
  "enalion-restaurant": { name: "Enalion", description: "Fresh seafood and traditional Greek dishes served by the sea in Pollonia." },
  "o-hamos-tavern": { name: "O! Hamos!", description: "A beloved local taverna with hearty traditional recipes in Papikinou, Milos." },
  "avli-milos": { name: "Avli Milos", description: "A charming courtyard restaurant in the hilltop village of Plaka, with views over the bay." },
  "mikros-apoplous": { name: "Mikros Apoplous – Seafood & More", description: "Seafood specialties and fresh catches steps from the harbour in Adamas." },
  "glaronisia-milos": { name: "Ta Glaronisia", description: "Traditional taverna with panoramic sea views perched above Tripiti." },
  "barriello-milos": { name: "Barriello", description: "Creative Mediterranean cuisine in a relaxed garden setting in Triovassalos." },
  "gialos-milos": { name: "Gialos", description: "Waterfront dining with freshly caught fish and mezedes in Pollonia." },
  "medusa-milos": { name: "Medusa Milos", description: "A cosy taverna overlooking the colourful syrmata of Mandrakia." },
  "methismeni-politeia": { name: "Methismeni Politeia", description: "One of the most celebrated restaurants in Milos, set in a beautifully restored space in Tripiti." },
  "archontoula-milos": { name: "Archontoula", description: "Traditional Greek home cooking in a welcoming family taverna in Plaka." },
  "foras-milos": { name: "Foras", description: "A relaxed spot in Plaka with mezedes, local wine, and views of the sunset." },
  "nostos-seafood": { name: "Nostos Seafood Experience", description: "Premium seafood and creative starters in a contemporary setting in Adamas." },
  "galanis-mpakalikon": { name: "Galanis Mpakalikon", description: "A traditional bakalikon-style eatery in Triovasalos — honest food, local character." },
  "iliovasilema-milos": { name: "Iliovasilema", description: "Watch the sunset over the Aegean while enjoying fresh seafood and grilled specialties." },
  "psitolatreia-milos": { name: "Psitolatreia", description: "Wood-fired grills and slow-roasted meats in a rustic setting in Triovasalos." },
  "astakas-milos": { name: "Astakas Milos", description: "A seafood-focused restaurant in the picturesque fishing village of Klima." },
  "zigos-milos": { name: "O Zigos", description: "A local favourite in Adamas serving generous portions of traditional Greek food." },
  "trapatselis-milos": { name: "Trapatselis", description: "A no-frills traditional taverna in Adamas popular with locals for its honest cooking." },
  "ergina-milos": { name: "Estiatorio Ergina", description: "A relaxed restaurant in Tripiti with good mezedes and a pleasant terrace." },
  "cavos-milos": { name: "Cavos Restaurant", description: "Harbour-front dining in Adamas with a wide menu of grilled fish and Greek classics." },
  "alkis-milos": { name: "Alkis", description: "A well-regarded fish taverna in Pollonia, ideal after a day at the beach." },
  "nama-milos": { name: "Nama Milos", description: "A modern café-restaurant in Pollonia with creative dishes and a relaxed vibe." },
  "lyra-milos": { name: "Lyra Milos", description: "The sound of good taste — Lyra serves Greek cuisine with creative touches in Pollonia." },
  "rifaki-milos": { name: "Rifaki", description: "A casual spot in Pollonia with fresh mezedes and a friendly atmosphere." },
  "akri-milos": { name: "Akri", description: "A hidden gem in Adamas with a relaxed atmosphere and delicious local cuisine." },
};

const beachTranslations = {
  "sarakiniko": { name: "Sarakiniko", description: "A lunar landscape of brilliant white volcanic rock — one of the most photographed beaches in the Aegean." },
  "fyropotamos": { name: "Fyropotamos", description: "A picturesque bay with a small beach, crystal clear waters, and traditional 'syrmata' (boathouses) lining the shore." },
  "tsigrado": { name: "Tsigrado", description: "A hidden gem reached by descending a rope through a narrow cliff crevice, with dazzling turquoise water below." },
  "fyriplaka": { name: "Fyriplaka", description: "A long sandy beach on the south coast, sheltered from the meltemi winds and ideal throughout the summer." },
  "paleochori": { name: "Paleochori", description: "A unique geothermal beach where volcanic heat warms the sand from below — and the water from beneath the surface." },
  "provatas": { name: "Provatas", description: "A family-friendly beach with calm shallow water, full facilities, and easy road access on the south coast." },
  "papafragas": { name: "Papafragas", description: "Not a conventional beach but a series of narrow sea caves carved into the volcanic cliffs — magical for swimming." },
  "kleftiko": { name: "Kleftiko", description: "The crown jewel of Milos — dramatic sea caves and arches on the southwest tip, accessible only by boat." },
  "agia-kyriaki": { name: "Agia Kyriaki", description: "A sheltered south-coast beach with calm clear water, sunbeds, and a relaxed atmosphere." },
  "gerontas": { name: "Gerontas", description: "A remote beach with striking red and orange volcanic cliffs — few crowds and spectacular scenery." },
  "triades": { name: "Triades", description: "A long sandy beach on the northwest coast, naturally beautiful and unspoiled, with no facilities." },
  "rivari": { name: "Rivari Lagoon", description: "A stunning natural lagoon on the west coast where warm shallow water is separated from the open sea by a sand strip." },
  "ammoudaki": { name: "Ammoudaki", description: "A tiny remote beach on the southwest coast, reachable only on foot or by boat — pristine and rarely visited." },
  "sikia-beach": { name: "Sikia Beach", description: "A small beach inside a collapsed sea cave, famous for its emerald waters and spectacular natural skylight." },
  "plathiena": { name: "Plathiena", description: "A long sandy beach near Plaka with good facilities and colourful volcanic cliffs, easily accessible by road." },
  "theiorycheia": { name: "Paralia Theiorycheio", description: "A historic beach featuring abandoned sulfur mines and rusted machinery against a backdrop of colorful cliffs." },
  "achivadolimni": { name: "Achivadolimni", description: "A large, popular beach known for its sandy bottom, crystal clear waters, and ideal conditions for windsurfing." },
  "agios-sostis": { name: "Agios Sostis", description: "A serene and quiet beach with shallow waters, offering a peaceful escape from the island's busier spots." },
  "tria-pigadia": { name: "Tria Pigadia", description: "A secluded, rugged beach favored by those looking for privacy and untouched natural beauty." },
  "kastanas": { name: "Kastanas", description: "A striking beach with colorful volcanic pebbles and stones, set against dramatic, high cliffs." },
  "polonia-beach": { name: "Polonia Beach", description: "A convenient, family-friendly beach located in the charming fishing village of Pollonia, close to cafes and tavernas." },
  "mandrakia": { name: "Mandrakia", description: "A beautiful beach with clear blue waters, famous for the traditional colourful boathouses carved into the rocks." },
  "kalogries-beach": { name: "Kalogries Beach", description: "A quiet, secluded beach with fine sand and shallow, crystal-clear waters, perfect for relaxation." },
  "aggathia": { name: "Aggathia", description: "A tranquil, lesser-known spot on the island, ideal for those seeking privacy away from the crowds." },
  "ammoudaraki-beach": { name: "Ammoudaraki Beach", description: "A remote and peaceful beach featuring soft sand and beautiful natural surroundings." },
  "kalamos": { name: "Kalamos Beach", description: "A beautiful beach with fine golden sand and deep, clear blue waters, surrounded by impressive volcanic scenery." },
  "agios-ioannis-beach": { name: "Agios Ioannis Beach", description: "A long, wild, and mostly secluded beach on the west side of the island with golden sand and dramatic rocks." },
  "kipos-beach": { name: "Paralia Kipos", description: "A small, serene beach known for its clear waters and proximity to traditional fish tavernas." },
  "deep-blue-beach": { name: "Deep Blue Beach", description: "A hidden cove with incredibly deep blue waters, offering a sense of isolation and raw beauty." },
  "psathi-beach": { name: "Psathi Beach", description: "A lovely, quiet beach with a calm atmosphere, often visited by those looking for a peaceful swim." },
  "kolympionas-beach": { name: "Kolympionas Beach", description: "A rugged, non-organized beach offering a wild landscape for nature lovers." },
  "voudia-beach": { name: "Voudia Beach", description: "A unique beach characterized by its industrial history and proximity to the old mines, offering a different side of Milos." },
  "pachaina-beach": { name: "Pachaina Beach", description: "A lovely sandy beach with interesting rock formations and beautiful views of the Glaronisia islets." },
  "alogomantra-beach": { name: "Alogomantra Beach", description: "A beach enclosed by high vertical rocks, creating a natural harbor and a unique swimming experience." },
  "mytakas-beach": { name: "Mytakas Beach", description: "A small, scenic beach with traditional boat houses, popular for its clear waters and calm environment." },
  "nerodafni-beach": { name: "Nerodafni Beach", description: "A secluded, natural spot perfect for those who enjoy pristine environments away from organized facilities." },
  "klima": { name: "Klima Beach", description: "A unique beach at the famous settlement of Klima, known for the multi-colored traditional 'syrmata' houses." },
  "papikinou-beach": { name: "Papikinou Beach", description: "A long, tree-lined sandy beach near Adamas, offering plenty of shade and convenient access to local tavernas." },
  "agios-dimitrios-beach": { name: "Agios Dimitrios Beach", description: "A quiet beach named after the local chapel, offering a peaceful setting and shallow waters." }
};

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

async function downloadPhoto(photoRef, slug, type) {
  // Skip entirely if --photos flag not passed
  if (!DOWNLOAD_PHOTOS) return null;
  if (!photoRef) return null;

  const dir = path.join(process.cwd(), "public", "images", type);
  const file = path.join(dir, `${slug}.jpg`);
  const url = `/images/${type}/${slug}.jpg`;

  // Skip if already downloaded
  if (fs.existsSync(file)) {
    console.log(`    ⏭  Photo exists: ${url}`);
    return url;
  }

  try {
    const metaRes = await fetch(
      `https://places.googleapis.com/v1/${photoRef}/media?key=${API_KEY}&maxWidthPx=900&skipHttpRedirect=true`
    );
    const meta = await metaRes.json();

    if (!meta.photoUri) {
      console.warn(`    ⚠️  No photoUri for ${slug}`);
      return null;
    }

    const imgRes = await fetch(meta.photoUri);
    if (!imgRes.ok) {
      console.warn(`    ⚠️  Download failed for ${slug}: ${imgRes.status}`);
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

// Αν έχουμε ήδη κατεβάσει φωτογραφία, διατήρησέ την στο JSON
function resolveExistingPhoto(slug, type) {
  const file = path.join(process.cwd(), "public", "images", type, `${slug}.jpg`);
  const url = `/images/${type}/${slug}.jpg`;
  return fs.existsSync(file) ? url : null;
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
      if (place.priceLevel === "PRICE_LEVEL_INEXPENSIVE") priceRange = "€";
      if (place.priceLevel === "PRICE_LEVEL_MODERATE") priceRange = "€€";
      if (place.priceLevel === "PRICE_LEVEL_EXPENSIVE") priceRange = "€€€";
      if (place.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") priceRange = "€€€€";

      const photoRef = place.photos?.[0]?.name || null;
      const localPhoto = DOWNLOAD_PHOTOS
        ? await downloadPhoto(photoRef, tavern.slug, "taverns")
        : resolveExistingPhoto(tavern.slug, "taverns");

      const weekdays = place.regularOpeningHours?.weekdayDescriptions || ["Δεν ανακοινώθηκε ωράριο"];
      const tr = tavernTranslations[tavern.slug];

      finalData.push({
        slug: tavern.slug,
        name: {
          el: place.displayName?.text || tavern.name,
          en: tr?.name || place.displayName?.text || tavern.name,
        },
        description: {
          el: `Απολαύστε αυθεντικές γεύσεις στο εστιατόριο ${place.displayName?.text || tavern.name} στον προορισμό ${tavern.location} της Μήλου.`,
          en: tr?.description || `Enjoy authentic Greek cuisine at ${tavern.name} in ${tavern.location}, Milos.`,
        },
        location: { area: tavern.location, address: place.formattedAddress || `${tavern.location}, Milos` },
        googleMapsUri: place.googleMapsUri || null,
        localPhoto,
        cuisine: { el: "Παραδοσιακή Ελληνική", en: "Traditional Greek" },
        servesCuisine: "Greek",
        phone: place.nationalPhoneNumber || "",
        website: place.websiteUri || null,
        coordinates: { lat: place.location?.latitude || 0, lng: place.location?.longitude || 0 },
        rating: place.rating || 0,
        priceRange,
        hours: extractShortHours(weekdays),
        openingHours: weekdays,
        isFeatured: tavern.isFeatured,
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

      const photoRef = place.photos?.[0]?.name || null;
      const localPhoto = DOWNLOAD_PHOTOS
        ? await downloadPhoto(photoRef, beach.slug, "beaches")
        : resolveExistingPhoto(beach.slug, "beaches");

      const tr = beachTranslations[beach.slug];

      finalData.push({
        slug: beach.slug,
        name: {
          el: place.displayName?.text || beach.name,
          en: tr?.name || beach.name,
        },
        description: {
          el: `Ανακαλύψτε την παραλία ${place.displayName?.text || beach.name} στη Μήλο — έναν από τους πιο εντυπωσιακούς προορισμούς του νησιού.`,
          en: tr?.description || `Discover ${beach.name} beach in Milos.`,
        },
        location: { area: beach.location, address: place.formattedAddress || `${beach.location}, Milos` },
        googleMapsUri: place.googleMapsUri || null,
        localPhoto,
        website: place.websiteUri || null,
        coordinates: { lat: place.location?.latitude || 0, lng: place.location?.longitude || 0 },
        rating: place.rating || 0,
        accessType: beach.accessType,
        facilities: beach.facilities,
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
  console.log(`📷 Photo mode: ${DOWNLOAD_PHOTOS ? "ENABLED (--photos)" : "DISABLED"}`);

  const [taverns, beaches] = await Promise.all([fetchTaverns(), fetchBeaches()]);

  const dataDir = path.join(process.cwd(), "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(path.join(dataDir, "taverns.json"), JSON.stringify(taverns, null, 2), "utf-8");
  fs.writeFileSync(path.join(dataDir, "beaches.json"), JSON.stringify(beaches, null, 2), "utf-8");

  console.log(`\n🎉 Done!`);
  console.log(`   taverns.json → ${taverns.length} entries`);
  console.log(`   beaches.json → ${beaches.length} entries`);
  if (DOWNLOAD_PHOTOS) {
    console.log(`   Photos       → public/images/`);
  } else {
    console.log(`   Photos       → skipped (existing photos preserved)`);
    console.log(`   💡 Run with --photos to download/update photos`);
  }
}

main();