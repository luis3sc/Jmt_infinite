import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

const parseLatitudeLongitude = (value: string): number | null => {
  if (!value || value === '-') return null;
  let normalized = value.replace(',', '.');
  let num = parseFloat(normalized);
  
  if (Math.abs(num) > 180) {
    num = num / 1000000;
  }
  return num;
};

const parseDimension = (value: string): number | null => {
  if (!value || value === '-') return null;
  let normalized = value.replace(',', '.');
  return parseFloat(normalized);
}

const parseAudience = (value: string): number => {
  if (!value || value === '-' || value === '0') return 0;
  return parseInt(value.replace(/\./g, ''), 10);
}

const determineStatus = (obs: string): string => {
  const normalized = (obs || '').toLowerCase().trim();
  if (!normalized || normalized === '0') return 'available';
  
  if (
    normalized.includes('falla') || 
    normalized.includes('trámite') || 
    normalized.includes('medidor') || 
    normalized.includes('instalar') ||
    normalized.includes('sin punto de luz')
  ) {
    return 'maintenance';
  }
  
  if (
    normalized.includes('exclusiv') || 
    normalized.includes('no vender') ||
    normalized.includes('restricc')
  ) {
    return 'inactive';
  }
  
  return 'available';
}

const determinePrice = (audience: number): number => {
  if (audience > 10000000) return 210;
  if (audience > 6000000) return 180;
  if (audience > 3000000) return 150;
  return 120;
}

function transform() {
  console.log('--- Starting CSV Transformation and Cleaning ---');
  
  const inputPath = path.resolve(process.cwd(), 'public/data/database_actual.csv');
  const outputPath = path.resolve(process.cwd(), 'public/data/database_actual_clean.csv');
  
  const fileContent = fs.readFileSync(inputPath, 'utf8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
  
  console.log(`Read ${records.length} records from raw CSV.`);
  
  const transformed = records.map((record: any) => {
    const code = record.ELEMENTO.trim();
    const face = record.CARA.trim();
    const panelCode = `${code}-${face}`;
    const lat = parseLatitudeLongitude(record.LATITUD);
    const lng = parseLatitudeLongitude(record.LONGITUD);
    const width = parseDimension(record.ANCHO);
    const height = parseDimension(record.ALTO);
    const audience = parseAudience(record.AUDIENCIA);
    
    const status = determineStatus(record.OBSERVACION);
    const price = determinePrice(audience);
    
    return {
      // Structure fields
      ELEMENTO: code,
      DEPARTAMENTO: record.DEPARTAMENTO === '-' ? 'Lima' : record.DEPARTAMENTO,
      DISTRITO: record.DISTRITO === '-' ? 'Lima Metropolitana' : record.DISTRITO,
      DIRECCION_COMERCIAL: record.DIRECCION_COMERCIAL.trim(),
      REFERENCIA: record.REFERENCIA ? record.REFERENCIA.trim() : '',
      LATITUD: lat,
      LONGITUD: lng,
      
      // Panel fields
      CARA: face,
      PANEL_CODE: panelCode,
      TIPO: record.TIPO.trim().toUpperCase() === 'DIGITAL' ? 'DIGITAL' : 'STATIC',
      FORMATO: record.FORMATO.trim(),
      ANCHO: width,
      ALTO: height,
      TRANSITO: record.TRANSITO ? record.TRANSITO.trim() : '',
      AUDIENCIA: audience,
      RESOLUTION_WIDTH: parseInt(record.resolution_width) || null,
      RESOLUTION_HEIGHT: parseInt(record.resolution_height) || null,
      PHOTO_URL: record.photo_url || null,
      OBSERVACION: record.OBSERVACION || '',
      
      // Enriched / completed fields
      DAILY_PRICE: price,
      BASE_PRICE: price,
      CURRENCY: 'PEN',
      PRICE_PERIOD: 'day',
      MAX_SLOTS: 23,
      SLOT_DURATION_SECONDS: parseInt(record.slot_duration_seconds) || 7,
      OPERATING_START_TIME: '06:00:00',
      OPERATING_END_TIME: '00:00:00',
      STATUS: status
    };
  });
  
  const outputCsv = stringify(transformed, { header: true });
  fs.writeFileSync(outputPath, outputCsv, 'utf8');
  
  console.log(`Successfully wrote ${transformed.length} cleaned records to database_actual_clean.csv`);
  console.log('--- Transformation Completed ---');
}

transform();
