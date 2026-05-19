"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
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
          "bg-card border border-border/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] transition-all duration-300",
          "hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] hover:border-primary",
          "focus-within:border-primary",
          "rounded-[calc(var(--radius)*1.5)] p-2 flex flex-col md:flex-row items-center gap-1 md:gap-0"
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
                onFocus={() => setShowSuggestions(true)}
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
                className="absolute top-[calc(100%+12px)] left-0 right-0 bg-card border border-border rounded-[calc(var(--radius)*1.5)] shadow-xl z-[100] max-h-72 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-5 py-4 hover:bg-primary/[0.08] cursor-pointer flex items-center gap-4 transition-all duration-200 border-b border-border/50 last:border-0 group/item"
                    onClick={() => {
                      setLocation(suggestion.place_name);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-[calc(var(--radius)*0.75)] bg-muted flex items-center justify-center shrink-0 group-hover/item:bg-primary/20 transition-colors">
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
          <div
            className="flex-1 md:flex-none flex items-center px-4 md:px-5 py-4 md:py-5 cursor-pointer group"
            onClick={(e) => {
              const input = e.currentTarget.querySelector<HTMLInputElement>('input');
              if (input) {
                if (typeof (input as any).showPicker === 'function') {
                  try {
                    (input as any).showPicker();
                  } catch (err) {
                    console.error("Failed to open datepicker:", err);
                    input.focus();
                  }
                } else {
                  input.focus();
                }
              }
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
              <span className="text-[10px] font-black uppercase text-foreground/60 tracking-[0.2em] leading-none mb-1.5 md:mb-0 group-hover:opacity-80 transition-opacity">Desde</span>
              <div className="relative flex items-center h-full">
                {!dateFrom && (
                  <span className="absolute inset-0 pointer-events-none text-muted-foreground/75 text-sm md:text-base font-bold whitespace-nowrap flex items-center">
                    Seleccionar
                  </span>
                )}
                <input
                  type="date"
                  value={dateFrom}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={cn(
                    "bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-0 text-sm md:text-base font-bold [color-scheme:light] dark:[color-scheme:dark] pointer-events-none w-full md:w-[110px] text-foreground h-auto",
                    !dateFrom && "opacity-0"
                  )}
                />
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-border mx-1 md:mx-0" />

          {/* Date To */}
          <div
            className="flex-1 md:flex-none flex items-center px-4 md:px-5 py-4 md:py-5 cursor-pointer group"
            onClick={(e) => {
              const input = e.currentTarget.querySelector<HTMLInputElement>('input');
              if (input) {
                if (typeof (input as any).showPicker === 'function') {
                  try {
                    (input as any).showPicker();
                  } catch (err) {
                    console.error("Failed to open datepicker:", err);
                    input.focus();
                  }
                } else {
                  input.focus();
                }
              }
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
              <span className="text-[10px] font-black uppercase text-foreground/60 tracking-[0.2em] leading-none mb-1.5 md:mb-0 group-hover:opacity-80 transition-opacity">Hasta</span>
              <div className="relative flex items-center h-full">
                {!dateTo && (
                  <span className="absolute inset-0 pointer-events-none text-muted-foreground/75 text-sm md:text-base font-bold whitespace-nowrap flex items-center">
                    Seleccionar
                  </span>
                )}
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={cn(
                    "bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-0 text-sm md:text-base font-bold [color-scheme:light] dark:[color-scheme:dark] pointer-events-none w-full md:w-[110px] text-foreground h-auto",
                    !dateTo && "opacity-0"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto p-2 md:p-1.5">
          <Button
            type="submit"
            className={cn(
              "w-full h-14 md:h-[64px] md:w-[64px] rounded-[calc(var(--radius)*0.875)] md:rounded-[var(--radius)] font-black text-xs uppercase tracking-[0.2em]",
              "flex items-center justify-center gap-3 active:scale-95 hover:scale-[1.02]",
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
