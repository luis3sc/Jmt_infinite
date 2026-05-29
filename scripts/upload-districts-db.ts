import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

// Complete metadata dictionary for mapping OSM names to Display Names and DB values
const DISTRICTS_METADATA: Record<string, { display_name: string; name_db: string; province: string; department: string }> = {
  // LIMA PROVINCE (43 Districts)
  "ANCON": { display_name: "Ancón", name_db: "Ancon", province: "LIMA", department: "LIMA" },
  "ATE": { display_name: "Ate", name_db: "Ate", province: "LIMA", department: "LIMA" },
  "BARRANCO": { display_name: "Barranco", name_db: "Barranco", province: "LIMA", department: "LIMA" },
  "BREÑA": { display_name: "Breña", name_db: "Breña", province: "LIMA", department: "LIMA" },
  "CARABAYLLO": { display_name: "Carabayllo", name_db: "Carabayllo", province: "LIMA", department: "LIMA" },
  "CHACLACAYO": { display_name: "Chaclacayo", name_db: "Chaclacayo", province: "LIMA", department: "LIMA" },
  "CHORRILLOS": { display_name: "Chorrillos", name_db: "Chorrillos", province: "LIMA", department: "LIMA" },
  "CIENEGUILLA": { display_name: "Cieneguilla", name_db: "Cieneguilla", province: "LIMA", department: "LIMA" },
  "COMAS": { display_name: "Comas", name_db: "Comas", province: "LIMA", department: "LIMA" },
  "EL AGUSTINO": { display_name: "El Agustino", name_db: "El Agustino", province: "LIMA", department: "LIMA" },
  "INDEPENDENCIA": { display_name: "Independencia", name_db: "Independencia", province: "LIMA", department: "LIMA" },
  "JESUS MARIA": { display_name: "Jesús María", name_db: "Jesus Maria", province: "LIMA", department: "LIMA" },
  "LA MOLINA": { display_name: "La Molina", name_db: "La Molina", province: "LIMA", department: "LIMA" },
  "LA VICTORIA": { display_name: "La Victoria", name_db: "La Victoria", province: "LIMA", department: "LIMA" },
  "LIMA": { display_name: "Cercado de Lima", name_db: "Lima", province: "LIMA", department: "LIMA" },
  "LINCE": { display_name: "Lince", name_db: "Lince", province: "LIMA", department: "LIMA" },
  "LOS OLIVOS": { display_name: "Los Olivos", name_db: "Los Olivos", province: "LIMA", department: "LIMA" },
  "LURIGANCHO": { display_name: "Lurigancho-Chosica", name_db: "Lurigancho", province: "LIMA", department: "LIMA" },
  "LURIN": { display_name: "Lurín", name_db: "Lurin", province: "LIMA", department: "LIMA" },
  "MAGDALENA DEL MAR": { display_name: "Magdalena del Mar", name_db: "Magdalena del Mar", province: "LIMA", department: "LIMA" },
  "MIRAFLORES": { display_name: "Miraflores", name_db: "Miraflores", province: "LIMA", department: "LIMA" },
  "PACHACAMAC": { display_name: "Pachacámac", name_db: "Pachacamac", province: "LIMA", department: "LIMA" },
  "PUCUSANA": { display_name: "Pucusana", name_db: "Pucusana", province: "LIMA", department: "LIMA" },
  "PUEBLO LIBRE": { display_name: "Pueblo Libre", name_db: "Pueblo Libre", province: "LIMA", department: "LIMA" },
  "PUENTE PIEDRA": { display_name: "Puente Piedra", name_db: "Puente Piedra", province: "LIMA", department: "LIMA" },
  "PUNTA HERMOSA": { display_name: "Punta Hermosa", name_db: "Punta Hermosa", province: "LIMA", department: "LIMA" },
  "PUNTA NEGRA": { display_name: "Punta Negra", name_db: "Punta Negra", province: "LIMA", department: "LIMA" },
  "RIMAC": { display_name: "Rímac", name_db: "Rimac", province: "LIMA", department: "LIMA" },
  "SAN BARTOLO": { display_name: "San Bartolo", name_db: "San Bartolo", province: "LIMA", department: "LIMA" },
  "SAN BORJA": { display_name: "San Borja", name_db: "San Borja", province: "LIMA", department: "LIMA" },
  "SAN ISIDRO": { display_name: "San Isidro", name_db: "San Isidro", province: "LIMA", department: "LIMA" },
  "SAN JUAN DE LURIGANCHO": { display_name: "San Juan de Lurigancho", name_db: "San Juan De Lurigancho", province: "LIMA", department: "LIMA" },
  "SAN JUAN DE MIRAFLORES": { display_name: "San Juan de Miraflores", name_db: "San Juan De Miraflores", province: "LIMA", department: "LIMA" },
  "SAN LUIS": { display_name: "San Luis", name_db: "San Luis", province: "LIMA", department: "LIMA" },
  "SAN MARTIN DE PORRES": { display_name: "San Martín de Porres", name_db: "San Martin De Porres", province: "LIMA", department: "LIMA" },
  "SAN MIGUEL": { display_name: "San Miguel", name_db: "San Miguel", province: "LIMA", department: "LIMA" },
  "SANTA ANITA": { display_name: "Santa Anita", name_db: "Santa Anita", province: "LIMA", department: "LIMA" },
  "SANTA MARIA DEL MAR": { display_name: "Santa María del Mar", name_db: "Santa Maria Del Mar", province: "LIMA", department: "LIMA" },
  "SANTA ROSA": { display_name: "Santa Rosa", name_db: "Santa Rosa", province: "LIMA", department: "LIMA" },
  "SANTIAGO DE SURCO": { display_name: "Santiago de Surco", name_db: "Surco", province: "LIMA", department: "LIMA" },
  "SURQUILLO": { display_name: "Surquillo", name_db: "Surquillo", province: "LIMA", department: "LIMA" },
  "VILLA EL SALVADOR": { display_name: "Villa El Salvador", name_db: "Villa El Salvador", province: "LIMA", department: "LIMA" },
  "VILLA MARIA DEL TRIUNFO": { display_name: "Villa María del Triunfo", name_db: "Villa Maria Del Triunfo", province: "LIMA", department: "LIMA" },

  // CALLAO PROVINCE (7 Districts)
  "CALLAO": { display_name: "Callao Cercado", name_db: "Callao", province: "CALLAO", department: "CALLAO" },
  "BELLAVISTA": { display_name: "Bellavista", name_db: "Bellavista", province: "CALLAO", department: "CALLAO" },
  "CARMEN DE LA LEGUA": { display_name: "Carmen de la Legua", name_db: "Carmen De La Legua Reynoso", province: "CALLAO", department: "CALLAO" },
  "CARMEN DE LA LEGUA REYNOSO": { display_name: "Carmen de la Legua", name_db: "Carmen De La Legua Reynoso", province: "CALLAO", department: "CALLAO" },
  "CARMEN DE LA LEGUA-REYNOSO": { display_name: "Carmen de la Legua", name_db: "Carmen De La Legua Reynoso", province: "CALLAO", department: "CALLAO" },
  "LA PERLA": { display_name: "La Perla", name_db: "La Perla", province: "CALLAO", department: "CALLAO" },
  "LA PUNTA": { display_name: "La Punta", name_db: "La Punta", province: "CALLAO", department: "CALLAO" },
  "VENTANILLA": { display_name: "Ventanilla", name_db: "Ventanilla", province: "CALLAO", department: "CALLAO" },
  "MI PERU": { display_name: "Mi Perú", name_db: "Mi Peru", province: "CALLAO", department: "CALLAO" },
  "MI PERÚ": { display_name: "Mi Perú", name_db: "Mi Peru", province: "CALLAO", department: "CALLAO" }
};

function normalizeText(text: string): string {
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/tildes
    .trim();
}

async function main() {
  console.log("🚀 Iniciando carga de polígonos de distritos de Lima y Callao en la Base de Datos...");

  // Read GeoJSON file from public data directory
  const geojsonPath = path.join(process.cwd(), "public", "data", "lima_callao_distritos_simple.geojson");
  
  if (!fs.existsSync(geojsonPath)) {
    console.error(`❌ Error: No se encontró el archivo GeoJSON en: ${geojsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(geojsonPath, "utf-8");
  const geojson = JSON.parse(rawData);

  if (!geojson.features || !Array.isArray(geojson.features)) {
    console.error("❌ Error: Estructura de GeoJSON inválida (falta features[])");
    process.exit(1);
  }

  console.log(`📊 Encontrados ${geojson.features.length} distritos en el archivo GeoJSON.`);

  const recordsToUpload = [];

  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const osmNameRaw = props.distrito || "";
    
    if (!osmNameRaw) {
      console.warn("⚠️ Advertencia: Feature sin atributo 'distrito' en properties. Omitiendo...");
      continue;
    }

    const normalizedOsmKey = normalizeText(osmNameRaw);
    const metadata = DISTRICTS_METADATA[normalizedOsmKey];

    let nameDb = normalizedOsmKey;
    let displayName = props.distrito2 || osmNameRaw;
    let province = props.provincia || "LIMA";
    let department = props.departamento || "LIMA";

    if (metadata) {
      nameDb = metadata.name_db;
      displayName = metadata.display_name;
      province = metadata.province;
      department = metadata.department;
    } else {
      console.log(`ℹ️ Distrito '${osmNameRaw}' no mapeado formalmente. Usando valores por defecto.`);
    }

    recordsToUpload.push({
      name: nameDb, // e.g. "Surco" or "Jesus Maria" (exact matches for structures.district)
      display_name: displayName, // e.g. "Santiago de Surco" or "Jesús María"
      province: province,
      department: department,
      geometry: feature.geometry, // stores Polygon or MultiPolygon coordinates
    });
  }

  console.log(`⏳ Cargando ${recordsToUpload.length} registros en Supabase...`);

  // Upload to Supabase using upsert
  const { data, error } = await supabase
    .from("districts")
    .upsert(recordsToUpload, { onConflict: "name" })
    .select("name");

  if (error) {
    console.error("❌ Error subiendo distritos a Supabase:", error.message);
    process.exit(1);
  }

  console.log(`✅ ¡Éxito! Se procesaron y subieron ${data?.length} distritos correctamente a la tabla 'public.districts'.`);
}

main().catch((err) => {
  console.error("🔥 Error crítico en ejecución principal:", err);
});
