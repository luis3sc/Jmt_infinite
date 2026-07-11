import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEPT_MAPPING: Record<string, { capitalizedName: string; cleanDeptName: string }> = {
  "LIMA": { capitalizedName: "Lima (Departamento)", cleanDeptName: "LIMA" },
  "CALLAO": { capitalizedName: "Callao (Departamento)", cleanDeptName: "CALLAO" },
  "AREQUIPA": { capitalizedName: "Arequipa (Departamento)", cleanDeptName: "AREQUIPA" },
  "ICA": { capitalizedName: "Ica (Departamento)", cleanDeptName: "ICA" },
  "CUSCO": { capitalizedName: "Cusco (Departamento)", cleanDeptName: "CUSCO" },
  "PIURA": { capitalizedName: "Piura (Departamento)", cleanDeptName: "PIURA" },
  "LAMBAYEQUE": { capitalizedName: "Lambayeque (Departamento)", cleanDeptName: "LAMBAYEQUE" },
  "JUNIN": { capitalizedName: "Junín (Departamento)", cleanDeptName: "JUNIN" },
  "LA LIBERTAD": { capitalizedName: "La Libertad (Departamento)", cleanDeptName: "LA LIBERTAD" }
};

async function main() {
  const geojsonPath = path.join(process.cwd(), 'public', 'data', 'peru_departamental_simple.geojson');
  if (!fs.existsSync(geojsonPath)) {
    console.error(`GeoJSON file not found at ${geojsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(geojsonPath, 'utf8');
  const geojson = JSON.parse(rawData);

  console.log(`Loaded GeoJSON. Found ${geojson.features?.length || 0} features.`);

  for (const feature of geojson.features || []) {
    const rawDeptName = feature.properties?.NOMBDEP;
    if (!rawDeptName) continue;

    const normDeptName = rawDeptName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    // Only insert the 9 departments where JMT has panels
    const mapping = DEPT_MAPPING[normDeptName];
    if (!mapping) continue;

    console.log(`Processing department: ${mapping.capitalizedName}`);

    const districtData = {
      name: mapping.capitalizedName,
      display_name: mapping.capitalizedName,
      province: mapping.capitalizedName,
      department: mapping.cleanDeptName,
      geometry: feature.geometry
    };

    // Upsert to handle updates if already exists (districts_name_key unique index)
    const { error } = await supabase
      .from('districts')
      .upsert(districtData, { onConflict: 'name' });

    if (error) {
      console.error(`Error inserting ${mapping.capitalizedName}:`, error.message);
    } else {
      console.log(`Successfully upserted ${mapping.capitalizedName}`);
    }
  }
}

main().catch(console.error);
