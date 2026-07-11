export const LIMA_CALLAO_DISTRICTS = [
  // LIMA
  { key: "Ancon", display: "Ancón", province: "Lima" },
  { key: "Ate", display: "Ate", province: "Lima" },
  { key: "Barranco", display: "Barranco", province: "Lima" },
  { key: "Brena", display: "Breña", province: "Lima" },
  { key: "Carabayllo", display: "Carabayllo", province: "Lima" },
  { key: "Chaclacayo", display: "Chaclacayo", province: "Lima" },
  { key: "Chorrillos", display: "Chorrillos", province: "Lima" },
  { key: "Cieneguilla", display: "Cieneguilla", province: "Lima" },
  { key: "Comas", display: "Comas", province: "Lima" },
  { key: "El Agustino", display: "El Agustino", province: "Lima" },
  { key: "Independencia", display: "Independencia", province: "Lima" },
  { key: "Jesus Maria", display: "Jesús María", province: "Lima" },
  { key: "La Molina", display: "La Molina", province: "Lima" },
  { key: "La Victoria", display: "La Victoria", province: "Lima" },
  { key: "Lima", display: "Cercado de Lima", province: "Lima" },
  { key: "Lince", display: "Lince", province: "Lima" },
  { key: "Los Olivos", display: "Los Olivos", province: "Lima" },
  { key: "Lurigancho", display: "Lurigancho-Chosica", province: "Lima" },
  { key: "Lurin", display: "Lurín", province: "Lima" },
  { key: "Magdalena del Mar", display: "Magdalena del Mar", province: "Lima" },
  { key: "Miraflores", display: "Miraflores", province: "Lima" },
  { key: "Pachacamac", display: "Pachacámac", province: "Lima" },
  { key: "Pucusana", display: "Pucusana", province: "Lima" },
  { key: "Pueblo Libre", display: "Pueblo Libre", province: "Lima" },
  { key: "Puente Piedra", display: "Puente Piedra", province: "Lima" },
  { key: "Punta Hermosa", display: "Punta Hermosa", province: "Lima" },
  { key: "Punta Negra", display: "Punta Negra", province: "Lima" },
  { key: "Rimac", display: "Rímac", province: "Lima" },
  { key: "San Bartolo", display: "San Bartolo", province: "Lima" },
  { key: "San Borja", display: "San Borja", province: "Lima" },
  { key: "San Isidro", display: "San Isidro", province: "Lima" },
  { key: "San Juan De Lurigancho", display: "San Juan de Lurigancho", province: "Lima" },
  { key: "San Juan De Miraflores", display: "San Juan de Miraflores", province: "Lima" },
  { key: "San Luis", display: "San Luis", province: "Lima" },
  { key: "San Martin De Porres", display: "San Martín de Porres", province: "Lima" },
  { key: "San Miguel", display: "San Miguel", province: "Lima" },
  { key: "Santa Anita", display: "Santa Anita", province: "Lima" },
  { key: "Santa Maria Del Mar", display: "Santa María del Mar", province: "Lima" },
  { key: "Santa Rosa", display: "Santa Rosa", province: "Lima" },
  { key: "Surco", display: "Santiago de Surco", province: "Lima" },
  { key: "Surquillo", display: "Surquillo", province: "Lima" },
  { key: "Villa El Salvador", display: "Villa El Salvador", province: "Lima" },
  { key: "Villa Maria Del Triunfo", display: "Villa María del Triunfo", province: "Lima" },
  // CALLAO
  { key: "Callao", display: "Callao Cercado", province: "Callao" },
  { key: "Bellavista", display: "Bellavista", province: "Callao" },
  { key: "Carmen De La Legua Reynoso", display: "Carmen de la Legua Reynoso", province: "Callao" },
  { key: "La Perla", display: "La Perla", province: "Callao" },
  { key: "La Punta", display: "La Punta", province: "Callao" },
  { key: "Ventanilla", display: "Ventanilla", province: "Callao" },
  { key: "Mi Peru", display: "Mi Perú", province: "Callao" }
];

export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  "San Borja": { lat: -12.096154, lng: -76.995186, zoom: 14 },
  "Jesus Maria": { lat: -12.07865, lng: -77.049764, zoom: 14 },
  "Pachacamac": { lat: -12.155695, lng: -76.787611, zoom: 11 },
  "San Luis": { lat: -12.07234, lng: -76.998662, zoom: 14 },
  "La Molina": { lat: -12.090073, lng: -76.922593, zoom: 12 },
  "Ancon": { lat: -11.69862, lng: -77.101584, zoom: 11 },
  "Villa El Salvador": { lat: -12.217246, lng: -76.943196, zoom: 13 },
  "Surco": { lat: -12.124548, lng: -76.982853, zoom: 12 },
  "Ate": { lat: -12.038543, lng: -76.890985, zoom: 11 },
  "Callao": { lat: -12.003667, lng: -77.117712, zoom: 12 },
  "Los Olivos": { lat: -11.965201, lng: -77.073939, zoom: 12 },
  "Lurigancho": { lat: -11.949478, lng: -76.8078, zoom: 11 },
  "Comas": { lat: -11.93264, lng: -77.030505, zoom: 12 },
  "Ventanilla": { lat: -11.883914, lng: -77.138635, zoom: 12 },
  "Santa Rosa": { lat: -11.804077, lng: -77.166439, zoom: 13 },
  "Puente Piedra": { lat: -11.876709, lng: -77.089919, zoom: 12 },
  "Carmen De La Legua Reynoso": { lat: -12.042447, lng: -77.090339, zoom: 14 },
  "Cieneguilla": { lat: -12.072658, lng: -76.780105, zoom: 11 },
  "Pucusana": { lat: -12.468483, lng: -76.778518, zoom: 12 },
  "Lince": { lat: -12.085311, lng: -77.035701, zoom: 14 },
  "Rimac": { lat: -12.020392, lng: -77.032815, zoom: 13 },
  "Chaclacayo": { lat: -11.99203, lng: -76.775327, zoom: 12 },
  "Surquillo": { lat: -12.114221, lng: -77.010557, zoom: 14 },
  "Miraflores": { lat: -12.121149, lng: -77.028687, zoom: 13 },
  "La Punta": { lat: -12.070992, lng: -77.163657, zoom: 14 },
  "Pueblo Libre": { lat: -12.076514, lng: -77.065309, zoom: 14 },
  "Santa Anita": { lat: -12.042979, lng: -76.963514, zoom: 13 },
  "La Perla": { lat: -12.071184, lng: -77.118447, zoom: 14 },
  "San Miguel": { lat: -12.078037, lng: -77.091388, zoom: 14 },
  "La Victoria": { lat: -12.074136, lng: -77.015851, zoom: 14 },
  "Bellavista": { lat: -12.059771, lng: -77.110951, zoom: 13 },
  "Carabayllo": { lat: -11.819759, lng: -76.948782, zoom: 11 },
  "Brena": { lat: -12.059651, lng: -77.05134, zoom: 14 },
  "Lurin": { lat: -12.236455, lng: -76.799224, zoom: 11 },
  "San Bartolo": { lat: -12.367027, lng: -76.728508, zoom: 12 },
  "Santa Maria Del Mar": { lat: -12.407631, lng: -76.767338, zoom: 13 },
  "Punta Hermosa": { lat: -12.262702, lng: -76.74554, zoom: 11 },
  "Punta Negra": { lat: -12.298158, lng: -76.719178, zoom: 11 },
  "Barranco": { lat: -12.143842, lng: -77.020387, zoom: 14 },
  "Chorrillos": { lat: -12.192678, lng: -77.005537, zoom: 13 },
  "San Juan De Miraflores": { lat: -12.166623, lng: -76.964928, zoom: 12 },
  "Villa Maria Del Triunfo": { lat: -12.175743, lng: -76.920609, zoom: 12 },
  "Lima": { lat: -12.055131, lng: -77.045716, zoom: 12 },
  "El Agustino": { lat: -12.041939, lng: -76.974818, zoom: 13 },
  "Independencia": { lat: -11.988941, lng: -77.046551, zoom: 13 },
  "San Martin De Porres": { lat: -11.987811, lng: -77.085958, zoom: 12 },
  "San Juan De Lurigancho": { lat: -11.949096, lng: -76.962441, zoom: 11 },
  "Magdalena del Mar": { lat: -12.095679, lng: -77.06647, zoom: 14 },
  "San Isidro": { lat: -12.098299, lng: -77.034492, zoom: 13 },
  "Mi Peru": { lat: -11.85417, lng: -77.1225, zoom: 14 }
};

export const isDistrictMatch = (structDistrict: string | null | undefined, targetDistrictKey: string | null) => {
  if (!structDistrict || !targetDistrictKey) return false;

  const structClean = structDistrict.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const targetClean = targetDistrictKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Direct check
  if (structClean === targetClean) return true;

  // Find in LIMA_CALLAO_DISTRICTS
  const targetItem = LIMA_CALLAO_DISTRICTS.find(d =>
    d.key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === targetClean ||
    d.display.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === targetClean
  );

  if (!targetItem) {
    return structClean.includes(targetClean) || targetClean.includes(structClean);
  }

  const structItem = LIMA_CALLAO_DISTRICTS.find(d =>
    d.key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === structClean ||
    d.display.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === structClean
  );

  if (structItem) {
    return structItem.key === targetItem.key;
  }

  const targetDisplayClean = targetItem.display.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const targetKeyClean = targetItem.key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  return structClean.includes(targetDisplayClean) ||
    structClean.includes(targetKeyClean) ||
    targetDisplayClean.includes(structClean) ||
    targetKeyClean.includes(structClean);
};

export const getRelevanceScore = (text: string, query: string) => {
  const normText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const normQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (normText === normQuery) return 100;
  if (normText.startsWith(normQuery)) return 80;
  if (normText.includes(" " + normQuery)) return 60;
  if (normText.includes(normQuery)) return 40;
  return 0;
};

export const CITY_TO_DEPARTMENT: Record<string, { department: string; center: { lat: number; lng: number }; zoom: number }> = {
  "lima": { department: "Lima", center: { lat: -12.046374, lng: -77.042793 }, zoom: 12 },
  "callao": { department: "Callao", center: { lat: -12.042087, lng: -77.103960 }, zoom: 12 },
  "arequipa": { department: "Arequipa", center: { lat: -16.401590, lng: -71.531417 }, zoom: 13 },
  "ica": { department: "Ica", center: { lat: -14.064315, lng: -75.732300 }, zoom: 14 },
  "cusco": { department: "Cusco", center: { lat: -13.527455, lng: -71.963588 }, zoom: 13 },
  "piura": { department: "Piura", center: { lat: -5.185439, lng: -80.629046 }, zoom: 13 },
  "chiclayo": { department: "Lambayeque", center: { lat: -6.769379, lng: -79.846263 }, zoom: 13 },
  "huancayo": { department: "Junín", center: { lat: -12.062049, lng: -75.208404 }, zoom: 14 },
  "trujillo": { department: "La Libertad", center: { lat: -8.119443, lng: -79.038919 }, zoom: 13 }
};

export interface DepartmentInfo {
  key: string;
  display: string;
  center: { lat: number; lng: number };
  zoom: number;
  city: string;
}

export const getActiveDepartments = (structures: any[]): DepartmentInfo[] => {
  const activeCities = new Set(
    structures
      .map(s => s.city?.toLowerCase().trim())
      .filter(Boolean)
  );

  const departmentsList: DepartmentInfo[] = [];

  // 1. Add known mapped departments if they are active in the dbStructures
  Object.entries(CITY_TO_DEPARTMENT).forEach(([cityKey, info]) => {
    if (activeCities.has(cityKey)) {
      const exists = departmentsList.some(d => d.key.toLowerCase() === info.department.toLowerCase());
      if (!exists) {
        departmentsList.push({
          key: info.department,
          display: info.department,
          center: info.center,
          zoom: info.zoom,
          city: cityKey
        });
      }
    }
  });

  // 2. Dynamic fallback for any unmapped active cities
  activeCities.forEach(city => {
    const cityKey = city.toLowerCase();
    if (!CITY_TO_DEPARTMENT[cityKey]) {
      const cityStructures = structures.filter(s => s.city?.toLowerCase().trim() === cityKey);
      if (cityStructures.length > 0) {
        const avgLat = cityStructures.reduce((sum, s) => sum + s.latitude, 0) / cityStructures.length;
        const avgLng = cityStructures.reduce((sum, s) => sum + s.longitude, 0) / cityStructures.length;
        departmentsList.push({
          key: city,
          display: city.charAt(0).toUpperCase() + city.slice(1),
          center: { lat: avgLat, lng: avgLng },
          zoom: 13,
          city: cityKey
        });
      }
    }
  });

  return departmentsList;
};
