import csv
import re

csv_path = r'c:\Users\Lucho\Documents\JMT\JMT_marketplace\inventario_pantallas.csv'
org_id = 'b5d9c611-3c61-4dde-833b-513b1cf4462f'

structures = []
panels = []

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        full_code = row['CODIGO_PROVEEDOR'].strip()
        
        # Split code into structure and face
        # Assuming format like "CODE-123 X" or "CODE-123X"
        match = re.match(r'^(.+)\s+([A-Z])$', full_code)
        if match:
            struct_code = match.group(1).strip()
            face = match.group(2).strip()
        else:
            # Handle cases like TRU-046 U or similar
            parts = full_code.split(' ')
            if len(parts) > 1:
                struct_code = " ".join(parts[:-1]).strip()
                face = parts[-1].strip()
            else:
                struct_code = full_code
                face = 'U'

        # Medida split
        medida = row['MEDIDA'].upper().replace(',', '.')
        if 'X' in medida:
            w, h = medida.split('X')
        else:
            w, h = 0, 0

        # Structure data
        structures.append({
            'organization_id': org_id,
            'code': struct_code,
            'address': row['DIRECCION_COMERCIAL'],
            'reference': row['REFERENCIA'],
            'district': row['DISTRITO'],
            'city': row['DEPARTAMENTO'],
            'latitude': float(row['LATITUD']) if row['LATITUD'] and row['LATITUD'] != '-' else None,
            'longitude': float(row['LONGITUD']) if row['LONGITUD'] and row['LONGITUD'] != '-' else None
        })

        # Panel data
        panels.append({
            'struct_code': struct_code,
            'panel_code': full_code,
            'face': face,
            'media_type': 'DIGITAL',
            'format': row['FORMATO'],
            'width': float(w) if w else 0,
            'height': float(h) if h else 0,
            'traffic_view': row['TRANSITO'],
            'audience': int(row['AUDIENCIA']) if row['AUDIENCIA'] and row['AUDIENCIA'] != '-' else 0
        })

# Generate SQL
sql = []

# Insert structures (using CTE or separate inserts with conflict handling)
# Since I don't have a unique constraint on 'code' in the schema I saw (only ID is PK), 
# I should be careful. But usually 'code' should be unique per organization.
# Let's check the schema again for unique constraints on structures.code.

# Re-checking schema... Oh, it doesn't show unique on 'code'.
# I'll use a temporary mapping or check if I can add a unique constraint or use it for lookup.

print("Generating SQL...")

sql.append("BEGIN;")

# Create structures and get their IDs
for s in structures:
    # Use a subquery to avoid duplicates if code exists? 
    # Or just insert and rely on the fact that I'm doing it once.
    # Actually, multiple panels might share the same struct_code in the CSV.
    pass

# Unique structures
unique_structures = {}
for s in structures:
    unique_structures[s['code']] = s

def esc(s):
    if s is None: return 'NULL'
    return str(s).replace("'", "''")

for code, s in unique_structures.items():
    lat = s['latitude'] if s['latitude'] is not None else 'NULL'
    lon = s['longitude'] if s['longitude'] is not None else 'NULL'
    sql.append(f"INSERT INTO public.structures (organization_id, code, address, reference, district, city, latitude, longitude) VALUES ('{esc(s['organization_id'])}', '{esc(s['code'])}', '{esc(s['address'])}', '{esc(s['reference'])}', '{esc(s['district'])}', '{esc(s['city'])}', {lat}, {lon}) ON CONFLICT DO NOTHING;")

# Now insert panels
for p in panels:
    # We need the structure_id. Since we don't have it yet, we can use a subquery.
    sql.append(f"""
INSERT INTO public.panels (structure_id, panel_code, face, media_type, format, width, height, traffic_view, audience)
SELECT id, '{esc(p['panel_code'])}', '{esc(p['face'])}', '{esc(p['media_type'])}', '{esc(p['format'])}', {p['width']}, {p['height']}, '{esc(p['traffic_view'])}', {p['audience']}
FROM public.structures WHERE code = '{esc(p['struct_code'])}' AND organization_id = '{org_id}'
ON CONFLICT DO NOTHING;
""")

sql.append("COMMIT;")

with open('import_data.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql))
