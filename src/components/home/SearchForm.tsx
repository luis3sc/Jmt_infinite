"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";

export function SearchForm() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleLocationChange = async (query: string) => {
    setLocation(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&language=es&types=place,locality,region,address`);
      const data = await res.json();
      if (data.features) {
        setSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Error fetching mapbox places:", err);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = new URLSearchParams();
    if (location) query.append("location", location);
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
          "bg-card/40 backdrop-blur-xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300",
          "hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] hover:border-primary",
          "rounded-3xl md:rounded-[2.5rem] p-2 flex flex-col md:flex-row items-center gap-1 md:gap-0"
        )}
      >
        {/* Location Section */}
        <div className="relative flex-1 w-full group">
          <div className="flex items-center h-full px-5 py-4 md:py-0">
            <div className="flex flex-col md:flex-row md:items-center flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.1em] leading-none mb-1.5 md:mb-0 md:mr-3 md:hidden">Ubicación</span>
              <input
                type="text"
                placeholder="¿Dónde quieres anunciarte?"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="bg-transparent border-none p-0 text-base font-bold focus:outline-none placeholder:text-muted-foreground/40 w-full truncate"
              />
            </div>
            {location && (
              <button 
                type="button"
                onClick={() => setLocation("")}
                className="p-2 hover:bg-muted rounded-full transition-colors md:mr-2"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-[calc(100%+12px)] left-0 right-0 bg-card/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-[100] max-h-72 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="px-5 py-4 hover:bg-primary/10 cursor-pointer flex items-center gap-4 transition-colors border-b border-white/5 last:border-0"
                    onClick={() => {
                      setLocation(suggestion.place_name);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">{suggestion.place_name}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px w-[90%] bg-white/5 md:hidden mx-auto" />
        <div className="hidden md:block h-12 w-px bg-white/10 mx-3" />

        {/* Dates Section */}
        <div className="flex items-center w-full md:w-auto gap-0">
          {/* Date From */}
          <div 
            className="flex-1 md:flex-none flex items-center px-4 md:px-5 py-4 md:py-5 cursor-pointer group"
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input');
              if (input && 'showPicker' in input) (input as any).showPicker();
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.1em] leading-none mb-1.5 md:mb-0 group-hover:opacity-80 transition-opacity">Desde</span>
              <div className="relative flex items-center h-full">
                {!dateFrom && (
                  <span className="absolute inset-0 pointer-events-none text-muted-foreground/40 text-sm md:text-base font-bold whitespace-nowrap flex items-center">
                    Seleccionar
                  </span>
                )}
                <input
                  type="date"
                  value={dateFrom}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDateFrom(e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker();
                  }}
                  className={cn(
                    "bg-transparent border-none p-0 text-sm md:text-base font-bold focus:outline-none [color-scheme:dark] cursor-pointer w-full md:w-[110px]",
                    !dateFrom && "opacity-0"
                  )}
                />
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/5 md:bg-white/10 mx-1 md:mx-0" />

          {/* Date To */}
          <div 
            className="flex-1 md:flex-none flex items-center px-4 md:px-5 py-4 md:py-5 cursor-pointer group"
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input');
              if (input && 'showPicker' in input) (input as any).showPicker();
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.1em] leading-none mb-1.5 md:mb-0 group-hover:opacity-80 transition-opacity">Hasta</span>
              <div className="relative flex items-center h-full">
                {!dateTo && (
                  <span className="absolute inset-0 pointer-events-none text-muted-foreground/40 text-sm md:text-base font-bold whitespace-nowrap flex items-center">
                    Seleccionar
                  </span>
                )}
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDateTo(e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker();
                  }}
                  className={cn(
                    "bg-transparent border-none p-0 text-sm md:text-base font-bold focus:outline-none [color-scheme:dark] cursor-pointer w-full md:w-[110px]",
                    !dateTo && "opacity-0"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto p-2 md:p-1.5">
          <button
            type="submit"
            className={cn(
              "w-full h-14 md:h-[64px] md:w-[64px] bg-primary text-white rounded-2xl md:rounded-full font-black text-xs uppercase tracking-[0.2em]",
              "flex items-center justify-center gap-3 hover:bg-primary/90 transition-all active:scale-95 hover:scale-[1.02]",
              "shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] shadow-primary/40"
            )}
          >
            <Search size={22} strokeWidth={3} />
            <span className="md:hidden">Buscar Paneles</span>
          </button>
        </div>
      </form>

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>
    </motion.div>
  );
}
