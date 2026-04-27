"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MagnifyingGlass, CalendarBlank, MapPin } from "@phosphor-icons/react";

export function SearchForm() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleLocationChange = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=-77.0428,-12.0464&language=es`);
      const data = await res.json();
      if (data.features) {
        setSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Error fetching mapbox places:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (location) query.append("location", location);
    if (dateFrom) query.append("from", dateFrom);
    if (dateTo) query.append("to", dateTo);
    
    router.push(`/map?${query.toString()}`);
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
      onSubmit={handleSearch}
      className="w-full bg-card/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2 relative">
        <label htmlFor="location" className="text-sm font-medium text-foreground pl-1">
          ¿Dónde quieres anunciarte?
        </label>
        <div className="relative group">
          <MapPin weight="fill" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
          <input
            id="location"
            type="text"
            placeholder="Ej. Miraflores, Lima"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              handleLocationChange(e.target.value);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-11 pr-4 py-3.5 bg-input border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all duration-200"
          />
        </div>
        
        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-[100%] left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3 transition-colors border-b border-border/50 last:border-0"
                onClick={() => {
                  setLocation(suggestion.place_name);
                  setShowSuggestions(false);
                }}
              >
                <MapPin size={16} className="text-primary flex-shrink-0" />
                <span className="text-sm text-foreground truncate">{suggestion.place_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="dateFrom" className="text-sm font-medium text-foreground pl-1">
            Desde
          </label>
          <div className="relative group">
            <CalendarBlank 
              weight="fill" 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10" 
              size={20} 
            />
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              onClick={(e) => {
                if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-input border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all duration-200 [color-scheme:dark] cursor-pointer"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="dateTo" className="text-sm font-medium text-foreground pl-1">
            Hasta
          </label>
          <div className="relative group">
            <CalendarBlank 
              weight="fill" 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10" 
              size={20} 
            />
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              onClick={(e) => {
                if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-input border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all duration-200 [color-scheme:dark] cursor-pointer"
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        type="submit"
        className="relative mt-2 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-medium flex items-center justify-center gap-2 overflow-hidden group"
      >
        <span className="relative z-10 flex items-center gap-2">
          Buscar Paneles
          <motion.span
            animate={{ x: isHovered ? 4 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <MagnifyingGlass weight="bold" size={20} />
          </motion.span>
        </span>
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.button>
    </motion.form>
  );
}
