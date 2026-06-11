import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load local environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidos en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// Earth radius in meters for geodetic distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Map OSM tags to human-friendly categories
function mapPoiToCategory(tags: any): string | null {
  const amenity = tags.amenity || "";
  const shop = tags.shop || "";
  const leisure = tags.leisure || "";
  const aeroway = tags.aeroway || "";
  const historic = tags.historic || "";
  const tourism = tags.tourism || "";
  const office = tags.office || "";
  const sport = tags.sport || "";

  if (amenity === "bank" || amenity === "atm") return "Banco";
  if (shop === "mall" || shop === "department_store") return "Centro Comercial";
  if (amenity === "university" || amenity === "college") return "Universidad";
  if (amenity === "school" || amenity === "kindergarten") return "Colegio";
  if (leisure === "fitness_centre" || sport === "fitness" || leisure === "stadium" || leisure === "sports_centre") return "Gimnasio / Deporte";
  if (amenity === "hospital" || amenity === "clinic" || amenity === "doctors") return "Hospital / Clínica";
  if (aeroway === "aerodrome") return "Aeropuerto";
  if (amenity === "marketplace" || shop === "supermarket") return "Mercado / Supermercado";
  if (amenity === "fuel") return "Grifo";
  if (shop === "car") return "Showroom de Carros";
  if (amenity === "car_wash") return "Carwash";
  if (amenity === "pharmacy") return "Botica / Farmacia";
  if (amenity === "restaurant" || amenity === "fast_food" || amenity === "cafe" || amenity === "bar" || amenity === "pub" || amenity === "ice_cream") return "Restaurantes / Cafés";
  if (leisure === "park") return "Parque";
  if (historic === "heritage" || historic === "monument" || tourism === "attraction" || tourism === "museum" || tourism === "gallery") return "Cultura / Atracción";
  if (amenity === "cinema" || amenity === "theatre") return "Entretenimiento";
  if (shop === "kiosk") return "Kiosco";

  // General commercial sectors fallback
  if (office === "telecommunication" || shop === "mobile_phone") return "Telecomunicaciones";
  if (office === "insurance") return "Aseguradora";

  // General retail fallback
  if (shop && ["convenience", "clothes", "shoes", "electronics", "hairdresser", "bakery", "hardware"].includes(shop)) {
    return "Retail / Comercio";
  }

  return null;
}

// Group into brand sectors that appeal to target brands (Banca, Retail, Telecom, Aseguradoras)
function getPoiSector(name: string, tags: any): string | null {
  const lowerName = name.toLowerCase();
  const shop = tags.shop || "";
  const amenity = tags.amenity || "";
  const office = tags.office || "";

  // 1. Telecomunicaciones
  if (
    office === "telecommunication" ||
    shop === "mobile_phone" ||
    lowerName.includes("claro") ||
    lowerName.includes("movistar") ||
    lowerName.includes("entel") ||
    lowerName.includes("bitel") ||
    lowerName.includes("telefónica")
  ) {
    return "Telecomunicaciones";
  }

  // 2. Banca
  if (
    amenity === "bank" ||
    amenity === "atm" ||
    lowerName.includes("bcp") ||
    lowerName.includes("bbva") ||
    lowerName.includes("interbank") ||
    lowerName.includes("scotiabank") ||
    lowerName.includes("banco") ||
    lowerName.includes("caja") ||
    lowerName.includes("bn")
  ) {
    return "Banca";
  }

  // 3. Aseguradoras
  if (
    office === "insurance" ||
    lowerName.includes("rimac") ||
    lowerName.includes("pacifico") ||
    lowerName.includes("mapfre") ||
    lowerName.includes("la positiva") ||
    lowerName.includes("seguros")
  ) {
    return "Aseguradoras";
  }

  // 4. Retail / Supermercados
  if (
    shop === "mall" ||
    shop === "supermarket" ||
    shop === "department_store" ||
    lowerName.includes("ripley") ||
    lowerName.includes("falabella") ||
    lowerName.includes("saga") ||
    lowerName.includes("tottus") ||
    lowerName.includes("plaza vea") ||
    lowerName.includes("metro") ||
    lowerName.includes("wong") ||
    lowerName.includes("oeschle") ||
    lowerName.includes("sodimac") ||
    lowerName.includes("promart")
  ) {
    return "Retail";
  }

  return null;
}

// Pause/Delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// List of public Overpass API mirrors for high availability / rate limit recovery
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

let currentMirrorIndex = 0;

function getActiveMirror(): string {
  return OVERPASS_MIRRORS[currentMirrorIndex];
}

function rotateMirror(): void {
  currentMirrorIndex = (currentMirrorIndex + 1) % OVERPASS_MIRRORS.length;
  console.log(`🌐 Rotando al servidor espejo: ${getActiveMirror()}`);
}

// Fetch helper with retry, automatic mirror rotation, and strict network timeouts (AbortController)
async function fetchWithRetry(options: any, retries = 5, delayMs = 2500): Promise<Response> {
  const url = getActiveMirror();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds strict timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (retries > 0 && (response.status === 504 || response.status === 429 || response.status === 502 || response.status === 503)) {
        console.warn(`⚠️ Servidor ${url} retornó error ${response.status}. Rotando espejo y reintentando...`);
        rotateMirror();
        await delay(delayMs);
        return fetchWithRetry(options, retries - 1, delayMs * 1.2);
      }
      throw new Error(`Overpass respondió con status ${response.status}`);
    }
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout ? "Timeout excedido (12s)" : err.message;

    if (retries > 0) {
      console.warn(`⚠️ Error en ${url} (${errorMsg}). Rotando espejo y reintentando...`);
      rotateMirror();
      await delay(delayMs);
      return fetchWithRetry(options, retries - 1, delayMs * 1.2);
    }
    throw err;
  }
}

async function main() {
  console.log("🚀 Iniciando Script de Enriquecimiento de POIs (Overpass API - Multiespejo)...");

  // Fetch all structures from Supabase
  const { data: structures, error: structError } = await supabase
    .from("structures")
    .select("id, code, latitude, longitude");

  if (structError) {
    console.error("❌ Error consultando structures de Supabase:", structError.message);
    process.exit(1);
  }

  const validStructures = structures.filter((s) => s.latitude && s.longitude);
  console.log(`📊 Se encontraron ${structures.length} estructuras, ${validStructures.length} tienen coordenadas válidas.`);

  const targetCodes = process.argv.slice(2);
  let filteredStructs = validStructures;
  if (targetCodes.length > 0) {
    filteredStructs = validStructures.filter(s => targetCodes.includes(s.code));
    console.log(`🎯 Ejecutando enriquecimiento únicamente para: ${targetCodes.join(", ")}`);
  }

  let index = 1;
  for (const struct of filteredStructs) {
    const lat = struct.latitude!;
    const lng = struct.longitude!;
    console.log(`\n🔄 [${index}/${filteredStructs.length}] Procesando ${struct.code || struct.id} (${lat}, ${lng})...`);

    try {
      // Build optimized Overpass API query for 500m radius using nwr (node, way, relation) and geometry output
      const overpassQuery = `[out:json][timeout:25];
(
  nwr(around:500,${lat},${lng})["amenity"~"bank|atm|university|college|school|kindergarten|fitness_centre|hospital|clinic|doctors|fuel|car_wash|pharmacy|restaurant|fast_food|cafe|bar|pub|ice_cream|cinema|theatre|marketplace"];
  nwr(around:500,${lat},${lng})["shop"~"mall|department_store|supermarket|car|kiosk|convenience|clothes|shoes|electronics|hairdresser|bakery|hardware|mobile_phone"];
  nwr(around:500,${lat},${lng})["leisure"~"fitness_centre|stadium|sports_centre|park"];
  nwr(around:500,${lat},${lng})["tourism"~"attraction|museum|gallery"];
  nwr(around:500,${lat},${lng})["historic"~"heritage|monument"];
  nwr(around:500,${lat},${lng})["aeroway"="aerodrome"];
  nwr(around:500,${lat},${lng})["office"~"telecommunication|insurance"];
);
out geom;`;

      const response = await fetchWithRetry({
        method: "POST",
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "JMTOutdoorsMarketplacePOIEnricher/2.0 (contacto@jmtoutdoors.com.pe)",
        },
      });

      const data = await response.json();
      const elements = data.elements || [];
      console.log(`📌 Encontrados ${elements.length} elementos crudos de OpenStreetMap.`);

      const mappedPois: any[] = [];
      const tagsSet = new Set<string>();

      for (const item of elements) {
        const tags = item.tags || {};
        const name = tags.name || tags.brand || "";
        if (!name) continue;

        const category = mapPoiToCategory(tags);
        if (!category) continue;

        // Calculate distance based on item type and geometry
        let dist = Infinity;
        let itemLat = null;
        let itemLon = null;

        if (item.type === "node" && item.lat && item.lon) {
          itemLat = item.lat;
          itemLon = item.lon;
          dist = calculateDistance(lat, lng, itemLat, itemLon);
        } else if ((item.type === "way" || item.type === "relation") && item.geometry) {
          // Calculate distance to nearest point on the polygon boundary
          for (const pt of item.geometry) {
            const ptDist = calculateDistance(lat, lng, pt.lat, pt.lon);
            if (ptDist < dist) {
              dist = ptDist;
              itemLat = pt.lat;
              itemLon = pt.lon;
            }
          }
        } else if (item.center) {
          itemLat = item.center.lat;
          itemLon = item.center.lon;
          dist = calculateDistance(lat, lng, itemLat, itemLon);
        }

        if (dist > 500 || itemLat === null || itemLon === null) continue;

        const sector = getPoiSector(name, tags);

        mappedPois.push({
          id: item.id,
          nombre: name,
          categoria: category,
          sector: sector || "Otros",
          distancia_metros: dist,
          coordenadas: { lat: itemLat, lng: itemLon },
        });

        tagsSet.add(category);
        if (sector) {
          tagsSet.add(sector);
        }
      }

      // Deduplicate POIs
      const uniquePois: any[] = [];
      for (const poi of mappedPois) {
        const isDuplicate = uniquePois.some(
          (u) =>
            u.nombre.toLowerCase() === poi.nombre.toLowerCase() &&
            Math.abs(u.distancia_metros - poi.distancia_metros) < 15
        );
        if (!isDuplicate) {
          uniquePois.push(poi);
        }
      }

      uniquePois.sort((a, b) => a.distancia_metros - b.distancia_metros);

      // Group POIs
      const groupedDetails: any = {
        total_count: uniquePois.length,
        resumen: Array.from(tagsSet),
        por_categoria: {},
      };

      uniquePois.forEach((poi) => {
        if (!groupedDetails.por_categoria[poi.categoria]) {
          groupedDetails.por_categoria[poi.categoria] = [];
        }
        groupedDetails.por_categoria[poi.categoria].push({
          nombre: poi.nombre,
          distancia_metros: poi.distancia_metros,
          sector: poi.sector,
          coordenadas: poi.coordenadas,
        });
      });

      const highLevelTags = Array.from(tagsSet);
      console.log(`✨ Enriquecidos ${uniquePois.length} POIs únicos.`);
      console.log(`🏷️  Tags asignados:`, highLevelTags);

      // Update structure record in Supabase
      const { error: updateError } = await supabase
        .from("structures")
        .update({
          poi_tags: highLevelTags,
          poi_details: groupedDetails,
        })
        .eq("id", struct.id);

      if (updateError) {
        console.error(`❌ Error actualizando estructura ${struct.code}:`, updateError.message);
      } else {
        console.log(`✅ Estructura ${struct.code || struct.id} actualizada correctamente.`);
      }

    } catch (err: any) {
      console.error(`❌ Error permanente procesando estructura ${struct.code || struct.id}:`, err.message || err);
    }

    // Delay between queries
    await delay(1500);
    index++;
  }

  console.log("\n🎉 ¡Enriquecimiento masivo de POIs completado exitosamente!");
}

main().catch((err) => {
  console.error("🔥 Error crítico en ejecución principal:", err);
});
