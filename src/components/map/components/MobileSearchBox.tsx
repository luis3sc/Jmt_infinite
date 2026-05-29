"use client";

import React from "react";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface MobileSearchBoxProps {
 searchQuery: string;
 suggestions: any[];
 showSuggestions: boolean;
 setShowSuggestions: (val: boolean) => void;
 onLocationSearch: (val: string) => void;
 onSelectSuggestion: (lng: number, lat: number, placeName: string, suggestion?: any) => void;
 onClear: () => void;
 onSearch: () => void;
 getTopRecommendations: () => any[];
 setSuggestions: (val: any[]) => void;
}

export default function MobileSearchBox({
 searchQuery,
 suggestions,
 showSuggestions,
 setShowSuggestions,
 onLocationSearch,
 onSelectSuggestion,
 onClear,
 onSearch,
 getTopRecommendations,
 setSuggestions,
}: MobileSearchBoxProps) {
 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
   onSearch();
  }
 };

 return (
  <div className="px-4 pb-4 pointer-events-auto">
   <div className="relative w-full shadow-2xl rounded-[calc(var(--radius)*1.0)] bg-card border border-border">
    <button
     onClick={onSearch}
     className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10 p-1.5 hover:bg-muted rounded-[calc(var(--radius)*0.6875)] transition-all "
    >
     <Search size={20} strokeWidth={2.5} />
    </button>
    <Input
     type="text"
     value={searchQuery || ""}
     onChange={(e) => onLocationSearch(e.target.value)}
     onKeyDown={handleKeyDown}
     onFocus={() => {
      if (searchQuery.length < 2) {
       setSuggestions(getTopRecommendations());
      }
      setShowSuggestions(true);
     }}
     onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
     placeholder="¿Dónde quieres anunciarte?"
     className="w-full pl-11 pr-12 py-3.5 bg-transparent rounded-[calc(var(--radius)*1.0)] text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 shadow-none ring-offset-transparent border-none h-auto"
    />
    {searchQuery && (
     <button
      type="button"
      onClick={onClear}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 p-1.5 hover:bg-muted rounded-full transition-all "
     >
      <X size={16} />
     </button>
    )}
    {showSuggestions && suggestions.length > 0 && (
     <ul
      onMouseDown={(e) => e.preventDefault()}
      className="absolute bottom-full mb-2 left-0 right-0 bg-card border border-border rounded-[calc(var(--radius)*0.6875)] shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto"
     >
      {suggestions.map((s: any, idx: number) => (
       <div
        key={s.id || s.districtKey || `mobile-sug-${idx}`}
        className="px-5 py-4 hover:bg-primary/[0.08] cursor-pointer flex items-center gap-4 transition-all duration-200 border-b border-border/50 last:border-0 group/item"
        onClick={() =>
         onSelectSuggestion(
          s.center ? s.center[0] : 0,
          s.center ? s.center[1] : 0,
          s.place_name,
          s
         )
        }
       >
        <div className="w-8 h-8 rounded-[calc(var(--radius)*0.75)] bg-muted flex items-center justify-center shrink-0 group-hover/item:bg-primary/20 transition-colors">
         <MapPin
          size={16}
          className="text-muted-foreground group-hover/item:text-primary transition-colors"
         />
        </div>
        <span className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors truncate">
         {s.place_name}
        </span>
       </div>
      ))}
     </ul>
    )}
   </div>
  </div>
 );
}
