import fs from "fs";
import path from "path";
import "dotenv/config";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.error("❌ Σφάλμα: Δεν βρέθηκε το GOOGLE_PLACES_API_KEY στο αρχείο .env");
  process.exit(1);
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
  { name: "ACS milos", location: "Adamas", slug: "acs-milos", isFeatured: false }
];

const seedBeaches = [
  { name: "Sarakiniko", location: "Sarakiniko", slug: "sarakiniko", accessType: "road", facilities: ["parking"] },
  { name: "Tsigrado", location: "Milos", slug: "tsigrado", accessType: "hike", facilities: [] },
  { name: "Fyriplaka", location: "Milos", slug: "fyriplaka", accessType: "road", facilities: ["sunbeds", "snack bar", "parking"] },
  { name: "Paleochori", location: "Paleochori", slug: "paleochori", accessType: "road", facilities: ["sunbeds", "snack bar", "parking"] },
  { name: "Provatas", location: "Milos", slug: "provatas", accessType: "road", facilities: ["sunbeds", "snack bar", "parking"] },
  { name: "Papafragas", location: "Milos", slug: "papafragas", accessType: "hike", facilities: [] },
  { name: "Kleftiko", location: "Milos", slug: "kleftiko", accessType: "boat", facilities: [] },
  { name: "Agia Kyriaki", location: "Milos", slug: "agia-kyriaki", accessType: "road", facilities: ["sunbeds"] },
  { name: "Gerontas", location: "Milos", slug: "gerontas", accessType: "road", facilities: [] },
  { name: "Triades", location: "Milos", slug: "triades", accessType: "road", facilities: [] },
  { name: "Patakonas", location: "Milos", slug: "patakonas", accessType: "road", facilities: [] },
  { name: "Rivari", location: "Milos", slug: "rivari", accessType: "road", facilities: [] },
  { name: "Ammoudaki", location: "Milos", slug: "ammoudaki", accessType: "hike", facilities: [] },
  { name: "Sikia Cave", location: "Milos", slug: "sikia-cave", accessType: "boat", facilities: [] },
  { name: "Plathiena", location: "Milos", slug: "plathiena", accessType: "road", facilities: ["sunbeds"] },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function extractShortHours(weekdayDescriptions) {
  if (!weekdayDescriptions || weekdayDescriptions.length === 0) return "13:00 - 00:00";
  const parts = weekdayDescriptions[0].split(": ");
  return parts[1] || "13:00 - 00:00";
}

function buildImageUrl(photos) {
  return photos?.[0] ? photos[0].name : null;
}

async function fetchPlace(query) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY.trim(),
      "X-Goog-FieldMask":
        "places.displayName,places.googleMapsUri,places.formattedAddress,places.nationalPhoneNumber,places.location,places.rating,places.priceLevel,places.regularOpeningHours,places.photos,places.websiteUri",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "el" }),
  });
  const data = await response.json();
  return data.places?.[0] || null;
}

// ─── TAVERNS ─────────────────────────────────────────────────────────────────

async function fetchTaverns() {
  const finalData = [];
  console.log("\n🍽️  Έναρξη συλλογής ταβερνών...");

  for (const tavern of seedTaverns) {
    try {
      console.log(`  🔍 ${tavern.name}`);
      const place = await fetchPlace(`${tavern.name}, ${tavern.location}, Milos`);

      if (!place) {
        console.error(`  ❌ Δεν βρέθηκε: ${tavern.name}`);
        continue;
      }

      let priceRange = "€€";
      if (place.priceLevel === "PRICE_LEVEL_INEXPENSIVE") priceRange = "€";
      if (place.priceLevel === "PRICE_LEVEL_MODERATE")    priceRange = "€€";
      if (place.priceLevel === "PRICE_LEVEL_EXPENSIVE")   priceRange = "€€€";
      if (place.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") priceRange = "€€€€";

      const weekdayDescriptions = place.regularOpeningHours?.weekdayDescriptions || ["Δεν ανακοινώθηκε ωράριο"];

      finalData.push({
        slug: tavern.slug,
        name: place.displayName?.text || tavern.name,
        description: `Απολαύστε αυθεντικές γεύσεις στο εστιατόριο ${place.displayName?.text || tavern.name} στον προορισμό ${tavern.location} της Μήλου.`,
        location: {
          area: tavern.location,
          address: place.formattedAddress || `${tavern.location}, Milos`,
        },
        googleMapsUri: place.googleMapsUri || null,
        photoRef: place.photos?.[0]?.name || null,
        image: buildImageUrl(place.photos),
        cuisine: ["Παραδοσιακή Ελληνική"],
        servesCuisine: "Greek",
        phone: place.nationalPhoneNumber || "",
        website: place.websiteUri || null,
        coordinates: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
        rating: place.rating || 0,
        priceRange,
        hours: extractShortHours(place.regularOpeningHours?.weekdayDescriptions),
        openingHours: weekdayDescriptions,
        isFeatured: tavern.isFeatured,
      });

      console.log(`  ✅ ${place.displayName?.text}`);
    } catch (err) {
      console.error(`  ❌ Σφάλμα (${tavern.name}):`, err.message);
    }
  }

  return finalData;
}

// ─── BEACHES ─────────────────────────────────────────────────────────────────

async function fetchBeaches() {
  const finalData = [];
  console.log("\n🏖️  Έναρξη συλλογής παραλιών...");

  for (const beach of seedBeaches) {
    try {
      console.log(`  🔍 ${beach.name}`);
      const place = await fetchPlace(`${beach.name} beach, Milos, Greece`);

      if (!place) {
        console.error(`  ❌ Δεν βρέθηκε: ${beach.name}`);
        continue;
      }

      finalData.push({
        slug: beach.slug,
        name: place.displayName?.text || beach.name,
        description: `Ανακαλύψτε την παραλία ${place.displayName?.text || beach.name} στη Μήλο — έναν από τους πιο εντυπωσιακούς προορισμούς του νησιού.`,
        location: {
          area: beach.location,
          address: place.formattedAddress || `${beach.location}, Milos`,
        },
        googleMapsUri: place.googleMapsUri || null,
        photoRef: place.photos?.[0]?.name || null,
        image: buildImageUrl(place.photos),
        website: place.websiteUri || null,
        coordinates: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
        rating: place.rating || 0,
        accessType: beach.accessType,
        facilities: beach.facilities,
      });

      console.log(`  ✅ ${place.displayName?.text}`);
    } catch (err) {
      console.error(`  ❌ Σφάλμα (${beach.name}):`, err.message);
    }
  }

  return finalData;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Έναρξη fetch-all-data...");

  const [taverns, beaches] = await Promise.all([fetchTaverns(), fetchBeaches()]);

  const tavernsPath = path.join(process.cwd(), "src", "data", "taverns.json");
  const beachesPath = path.join(process.cwd(), "src", "data", "beaches.json");

  fs.writeFileSync(tavernsPath, JSON.stringify(taverns, null, 2), "utf-8");
  fs.writeFileSync(beachesPath, JSON.stringify(beaches, null, 2), "utf-8");

  console.log(`\n🎉 Έτοιμο!`);
  console.log(`   taverns.json → ${taverns.length} εγγραφές`);
  console.log(`   beaches.json → ${beaches.length} εγγραφές`);
}

main();