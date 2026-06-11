"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { addDays } from "date-fns";
import { useCartStore } from "@/store/cartStore";


const LIMA_CALLAO_DISTRICTS = [
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

const getRelevanceScore = (text: string, query: string) => {
 const normText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
 const normQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
 if (normText === normQuery) return 100;
 if (normText.startsWith(normQuery)) return 80;
 if (normText.includes(" " + normQuery)) return 60;
 if (normText.includes(normQuery)) return 40;
 return 0;
};

const formatDateLabel = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
 };

export function SearchForm() {
 const router = useRouter();
 const [location, setLocation] = useState("");
 const [selectedCoords, setSelectedCoords] = useState<{ lng: number; lat: number } | null>(null);
 const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
 const [dateFrom, setDateFrom] = useState("");
 const [dateTo, setDateTo] = useState("");
 const [suggestions, setSuggestions] = useState<any[]>([]);
 const [showSuggestions, setShowSuggestions] = useState(false);

 const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;


 const [dbStructures, setDbStructures] = useState<any[]>([]);

 useEffect(() => {
  // Clear cart/selected panels when visiting the home page / starting a new search
  useCartStore.getState().clearCart();
 }, []);

 useEffect(() => {

  const supabase = createClient();
  async function loadSearchIndex() {
   try {
    const { data, error } = await supabase
     .from("structures")
     .select("id, code, address, district, city, latitude, longitude");
    if (error) throw error;
    if (data) {
     setDbStructures(data);
    }
   } catch (err) {
    console.error("Error loading search index structures:", err);
   }
  }
  loadSearchIndex();
 }, []);

 const getTopRecommendations = () => {
  const districtCounts: Record<string, number> = {};

  dbStructures.forEach(s => {
   if (s.district) {
    const distClean = s.district.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const matched = LIMA_CALLAO_DISTRICTS.find(d =>
     d.display.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === distClean ||
     d.key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === distClean
    );

    if (matched) {
     districtCounts[matched.key] = (districtCounts[matched.key] || 0) + 1;
    }
   }
  });

  const sorted = Object.entries(districtCounts)
   .sort((a, b) => b[1] - a[1])
   .slice(0, 5);

  return sorted.map(([distKey, count]) => {
   const matched = LIMA_CALLAO_DISTRICTS.find(d => d.key === distKey)!;
   return {
    isDistrict: true,
    place_name: `${matched.display} (${count} paneles)`,
    display: matched.display,
    districtKey: matched.key,
    center: null
   };
  });
 };

 const handleLocationChange = (query: string) => {
  setLocation(query);
  setSelectedCoords(null);
  setSelectedDistrict(null);

  if (query.length < 2) {
   const top = getTopRecommendations();
   setSuggestions(top);
   setShowSuggestions(top.length > 0);
   return;
  }

  const queryClean = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Filter matching districts
  const matchedDistricts = LIMA_CALLAO_DISTRICTS.filter(d =>
   d.display.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(queryClean) ||
   d.key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(queryClean)
  ).map(d => ({
   isDistrict: true,
   place_name: `${d.display} (Distrito, ${d.province})`,
   display: d.display,
   districtKey: d.key,
   center: null
  }));

  // Sort matched districts by search relevance (starts with query, starts a word, substring)
  matchedDistricts.sort((a, b) => {
   const scoreA = Math.max(getRelevanceScore(a.display, queryClean), getRelevanceScore(a.districtKey, queryClean));
   const scoreB = Math.max(getRelevanceScore(b.display, queryClean), getRelevanceScore(b.districtKey, queryClean));
   if (scoreA !== scoreB) return scoreB - scoreA;
   return a.display.localeCompare(b.display, "es");
  });

  // 2. Filter matching structures in Supabase JMT DB
  const matchedStructures = dbStructures.filter(s => {
   const addressClean = (s.address || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
   const districtClean = (s.district || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
   const cityClean = (s.city || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
   const codeClean = (s.code || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

   return addressClean.includes(queryClean) ||
    districtClean.includes(queryClean) ||
    cityClean.includes(queryClean) ||
    codeClean.includes(queryClean);
  }).map(s => ({
   isStructure: true,
   place_name: `${s.address}${s.district ? `, ${s.district}` : ""}${s.city ? ` (${s.city})` : ""}`,
   display: s.address,
   code: s.code,
   center: [s.longitude, s.latitude],
   id: s.id
  }));

  // Sort matched structures by relevance
  matchedStructures.sort((a, b) => {
   const scoreA = Math.max(getRelevanceScore(a.display || "", queryClean), getRelevanceScore(a.code || "", queryClean));
   const scoreB = Math.max(getRelevanceScore(b.display || "", queryClean), getRelevanceScore(b.code || "", queryClean));
   if (scoreA !== scoreB) return scoreB - scoreA;
   return (a.display || "").localeCompare(b.display || "", "es");
  });

  const allSuggestions = [...matchedDistricts, ...matchedStructures];
  setSuggestions(allSuggestions);
  setShowSuggestions(allSuggestions.length > 0);
 };

 const handleSearch = (e?: React.FormEvent) => {
  if (e) e.preventDefault();
  const query = new URLSearchParams();

  // Check if the typed text matches a district directly (case insensitive, without accents)
  const cleanLocation = location.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const matched = LIMA_CALLAO_DISTRICTS.find(d =>
   d.display.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cleanLocation ||
   d.key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cleanLocation
  );

  const activeDistrict = selectedDistrict || (matched ? matched.key : null);
  let activeLocation = matched ? matched.display : location;
  let activeCoords = selectedCoords;

  if (!activeDistrict && !activeCoords && cleanLocation.length >= 3) {
   const matchedStructure = dbStructures.find(s => {
    const addressClean = (s.address || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const districtClean = (s.district || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cityClean = (s.city || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const codeClean = (s.code || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return addressClean.includes(cleanLocation) ||
     districtClean.includes(cleanLocation) ||
     cityClean.includes(cleanLocation) ||
     codeClean.includes(cleanLocation);
   });

   if (matchedStructure) {
    activeCoords = {
     lat: matchedStructure.latitude,
     lng: matchedStructure.longitude
    };
    activeLocation = `${matchedStructure.address}${matchedStructure.district ? `, ${matchedStructure.district}` : ""}`;
   }
  }

  if (activeLocation) query.append("location", activeLocation);
  if (activeDistrict) {
   query.append("district", activeDistrict);
  } else if (activeCoords) {
   query.append("lat", activeCoords.lat.toString());
   query.append("lng", activeCoords.lng.toString());
  }
  if (dateFrom) query.append("from", dateFrom);
  if (dateTo) query.append("to", dateTo);

  router.push(`/map?${query.toString()}`);
 };

 return (
  <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
   className="w-full"
  >
   <form
    onSubmit={handleSearch}
    className={cn(
     "bg-card border border-border/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] transition-all duration-300",
     "hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] hover:border-primary",
     "focus-within:border-primary",
     "rounded-dialog p-2 flex flex-col md:flex-row items-center gap-1 md:gap-0"
    )}
   >
    {/* Location Section */}
    <div className="relative flex-1 w-full group">
     <div className="flex items-center h-full px-5 py-4 md:py-0">
      <div className="flex flex-col md:flex-row md:items-center flex-1 min-w-0">
       <span className="text-[10px] font-black uppercase text-foreground/60 tracking-[0.2em] leading-none mb-1.5 md:mb-0 md:mr-3 md:hidden">Ubicación</span>
       <input
        type="text"
        placeholder="¿Dónde quieres anunciarte?"
        value={location}
        onChange={(e) => handleLocationChange(e.target.value)}
        onFocus={() => {
         if (location.length < 2) {
          setSuggestions(getTopRecommendations());
         }
         setShowSuggestions(true);
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-0 text-base font-bold placeholder:text-muted-foreground/75 w-full truncate text-foreground h-auto"
       />
      </div>
      {location && (
       <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setLocation("")}
        className="h-8 w-8 rounded-full md:mr-2"
       >
        <X size={16} className="text-muted-foreground" />
       </Button>
      )}
     </div>

     {/* Autocomplete Dropdown */}
     <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
       <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute top-[calc(100%+2px)] left-0 right-0 bg-card border border-border rounded-dialog shadow-xl z-[100] max-h-72 overflow-y-auto"
       >
        {suggestions.map((suggestion, index) => (
         <div
          key={index}
          className="px-5 py-3 hover:bg-primary/[0.08] cursor-pointer flex items-center gap-4 transition-all duration-200 border-b border-border/50 last:border-0 group/item"
          onClick={() => {
           if (suggestion.isDistrict) {
            setLocation(suggestion.display);
            setSelectedDistrict(suggestion.districtKey);
            setSelectedCoords(null);
           } else {
            setLocation(suggestion.place_name);
            setSelectedDistrict(null);
            if (suggestion.center) {
             setSelectedCoords({
              lng: suggestion.center[0],
              lat: suggestion.center[1]
             });
            }
           }
           setShowSuggestions(false);
          }}
         >
          <div className="w-8 h-2 rounded-input bg-muted flex items-center justify-center shrink-0 group-hover/item:bg-primary/20 transition-colors">
           <MapPin size={16} className="text-muted-foreground group-hover/item:text-primary transition-colors" />
          </div>
          <span className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors truncate">{suggestion.place_name}</span>
         </div>
        ))}
       </motion.div>
      )}
     </AnimatePresence>
    </div>

    <div className="h-px w-[90%] bg-border/60 md:hidden mx-auto" />
    <div className="hidden md:block h-12 w-px bg-border mx-3" />

    {/* Dates Section */}
    <div className="flex items-center w-full md:w-auto gap-0">
     {/* Date From */}
      <div className="relative flex-1 md:flex-none flex items-center px-4 md:px-5 py-4 md:py-5 cursor-pointer group">
       <div className="pointer-events-none flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
        <span className="text-[10px] font-black uppercase text-foreground/60 tracking-[0.2em] leading-none mb-1.5 md:mb-0 group-hover:opacity-80 transition-opacity">Desde</span>
        <div className="relative flex items-center h-full">
         {!dateFrom ? (
          <span className="text-muted-foreground/75 text-sm md:text-base font-bold whitespace-nowrap flex items-center">
           Seleccionar
          </span>
         ) : (
          <span className="text-sm md:text-base font-bold text-foreground whitespace-nowrap flex items-center">
           {formatDateLabel(dateFrom)}
          </span>
         )}
        </div>
       </div>
       <input
        type="date"
        value={dateFrom}
        min={new Date().toISOString().split('T')[0]}
        onChange={(e) => setDateFrom(e.target.value)}
        onClick={(e) => {
         const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
         if (!isMobile && 'showPicker' in e.currentTarget) {
          try {
           e.currentTarget.showPicker();
          } catch (err) {
           console.error("Failed to open datepicker:", err);
          }
         }
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [color-scheme:light] dark:[color-scheme:dark]"
       />
      </div>

      <div className="h-8 w-px bg-border mx-1 md:mx-0" />

      {/* Date To */}
      <div className="relative flex-1 md:flex-none flex items-center px-4 md:px-5 py-4 md:py-5 cursor-pointer group">
       <div className="pointer-events-none flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
        <span className="text-[10px] font-black uppercase text-foreground/60 tracking-[0.2em] leading-none mb-1.5 md:mb-0 group-hover:opacity-80 transition-opacity">Hasta</span>
        <div className="relative flex items-center h-full">
         {!dateTo ? (
          <span className="text-muted-foreground/75 text-sm md:text-base font-bold whitespace-nowrap flex items-center">
           Seleccionar
          </span>
         ) : (
          <span className="text-sm md:text-base font-bold text-foreground whitespace-nowrap flex items-center">
           {formatDateLabel(dateTo)}
          </span>
         )}
        </div>
       </div>
       <input
        type="date"
        value={dateTo}
        min={dateFrom || new Date().toISOString().split('T')[0]}
        onChange={(e) => setDateTo(e.target.value)}
        onClick={(e) => {
         const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
         if (!isMobile && 'showPicker' in e.currentTarget) {
          try {
           e.currentTarget.showPicker();
          } catch (err) {
           console.error("Failed to open datepicker:", err);
          }
         }
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [color-scheme:light] dark:[color-scheme:dark]"
       />
      </div>
    </div>

    <div className="w-full md:w-auto p-2 md:p-1.5">
     <Button
      type="submit"
      className={cn(
       "w-full h-14 md:h-[64px] md:w-[64px] rounded-button-xl md:rounded-button-2xl font-black text-xs uppercase tracking-[0.2em]",
       "flex items-center justify-center gap-3 hover:scale-[1.02]",
       "shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] shadow-primary/40"
      )}
     >
      <Search size={22} strokeWidth={3} />
      <span className="md:hidden">Buscar Paneles</span>
     </Button>
    </div>
   </form>
  </motion.div>
 );
}
