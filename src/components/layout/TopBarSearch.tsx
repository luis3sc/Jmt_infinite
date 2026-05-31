"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Search, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";

interface TopBarSearchProps {
 searchQuery: string;
 startDate: string;
 setStartDate: (date: string) => void;
 endDate: string;
 setEndDate: (date: string) => void;
 onSearch: () => void;
 suggestions: any[];
 showSuggestions: boolean;
 onSelectSuggestion: (lng: number, lat: number, placeName: string, suggestion?: any) => void;
 onLocationSearch: (query: string) => void;
 onFocus?: () => void;
 onBlur?: () => void;
}

const formatDateLabel = (dateStr: string) => {
 if (!dateStr) return "";
 const parts = dateStr.split('-');
 if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
 return dateStr;
};

export default function TopBarSearch({
 searchQuery,
 onLocationSearch,
 startDate,
 setStartDate,
 endDate,
 setEndDate,
 onSearch,
 suggestions,
 showSuggestions,
 onSelectSuggestion,
 onFocus,
 onBlur,
}: TopBarSearchProps) {
 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
   e.preventDefault();
   onSearch();
  }
 };

 return (
  <div className="relative w-full max-w-4xl mx-auto z-[100] px-4 sm:px-0">
   <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-background/80 backdrop-blur-md border border-border/80 rounded-2xl sm:rounded-full p-2 gap-2 shadow-lg w-full">
    {/* Map Search Input */}
    <div className="flex-1 flex items-center gap-2 pl-3 relative">
     <MapPin className="text-muted-foreground shrink-0" size={18} />
     <input
      type="text"
      placeholder="Buscar por avenida, distrito o provincia..."
      value={searchQuery || ""}
      onChange={(e) => onLocationSearch(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className="bg-transparent border-none text-xs font-semibold focus:outline-none text-foreground w-full h-[44px] placeholder:text-muted-foreground/60"
     />
     {searchQuery && (
      <button
       type="button"
       onClick={() => onLocationSearch("")}
       className="absolute right-2 p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors"
      >
       <X size={14} />
      </button>
     )}

     {/* Autocomplete Suggestions */}
     <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
       <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-xl shadow-xl z-[110] overflow-hidden max-h-[300px] overflow-y-auto"
       >
        {suggestions.map((s: any, idx: number) => (
         <button
          key={s.id || idx}
          type="button"
          onClick={() => {
           const [lng, lat] = s.center || [0, 0];
           onSelectSuggestion(lng, lat, s.place_name, s);
          }}
          className="w-full text-left px-4 py-3 text-xs hover:bg-muted/80 transition-colors flex items-start gap-2 border-b border-border/40 last:border-b-0"
         >
          <MapPin className="text-muted-foreground shrink-0 mt-0.5" size={14} />
          <div>
           <p className="font-bold text-foreground">{s.text}</p>
           <p className="text-[10px] text-muted-foreground">{s.place_name}</p>
          </div>
         </button>
        ))}
       </motion.div>
      )}
     </AnimatePresence>
    </div>

    <div className="hidden sm:block h-8 w-px bg-border/85" />

    {/* Date Range Picker */}
    <div className="hidden sm:flex items-center gap-2 lg:gap-3 px-2 lg:px-3">
     <div className="relative flex items-center gap-1 lg:gap-2 cursor-pointer group h-[44px]">
      <div className="pointer-events-none flex items-center gap-1 lg:gap-2">
       <span className="text-[9px] lg:text-[10px] uppercase font-black text-muted-foreground tracking-tighter group-hover:opacity-80 transition-opacity leading-none">Desde</span>
       <span className={cn(
        "text-[11px] lg:text-xs font-bold whitespace-nowrap min-w-[55px] lg:min-w-[65px] flex items-center",
        startDate ? "text-foreground" : "text-muted-foreground/40"
       )}>
        {startDate ? formatDateLabel(startDate) : "Seleccionar"}
       </span>
      </div>
      <Input
       type="date"
       value={startDate}
       min={new Date().toISOString().split('T')[0]}
       onChange={(e) => setStartDate(e.target.value)}
       onClick={(e) => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile && 'showPicker' in e.currentTarget) {
         try {
          (e.currentTarget as any).showPicker();
         } catch (err) {
          console.warn(err);
         }
        }
       }}
       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0 bg-transparent border-none"
      />
     </div>

     <div className="h-4 w-px bg-border mx-0.5 lg:mx-1" />

     <div className="relative flex items-center gap-1 lg:gap-2 cursor-pointer group h-[44px]">
      <div className="pointer-events-none flex items-center gap-1 lg:gap-2">
       <span className="text-[9px] lg:text-[10px] uppercase font-black text-muted-foreground tracking-tighter group-hover:opacity-80 transition-opacity leading-none">Hasta</span>
       <span className={cn(
        "text-[11px] lg:text-xs font-bold whitespace-nowrap min-w-[55px] lg:min-w-[65px] flex items-center",
        endDate ? "text-foreground" : "text-muted-foreground/40"
       )}>
        {endDate ? formatDateLabel(endDate) : "Seleccionar"}
       </span>
      </div>
      <Input
       type="date"
       value={endDate}
       min={startDate || new Date().toISOString().split('T')[0]}
       onChange={(e) => setEndDate(e.target.value)}
       onClick={(e) => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile && 'showPicker' in e.currentTarget) {
         try {
          (e.currentTarget as any).showPicker();
         } catch (err) {
          console.warn(err);
         }
        }
       }}
       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0 bg-transparent border-none"
      />
     </div>
    </div>

    {/* Search Button */}
    <Button
     onClick={onSearch}
     size="icon-lg"
     className="ml-1 lg:ml-2 flex items-center justify-center cursor-pointer"
    >
     <Search size={18} strokeWidth={3} />
     <span className="sr-only">Buscar</span>
    </Button>
   </div>
  </div>);
}
