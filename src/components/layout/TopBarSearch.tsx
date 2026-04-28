"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Search } from "lucide-react";

interface TopBarSearchProps {
  searchQuery: string;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onSearch: () => void;
  suggestions: any[];
  showSuggestions: boolean;
  onSelectSuggestion: (lng: number, lat: number, placeName: string) => void;
  onLocationSearch: (query: string) => void;
}

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
}: TopBarSearchProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="flex items-center bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-1.5 shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300">
      {/* Location Search */}
      <div className="relative w-[180px] lg:w-[280px]">
        <input
          type="text"
          value={searchQuery || ""}
          onChange={(e) => onLocationSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="¿Dónde quieres anunciarte?"
          className="w-full px-4 py-2 bg-transparent border-none text-sm focus:outline-none h-[44px] font-medium placeholder:text-muted-foreground/60"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute top-[calc(100%+12px)] left-0 right-0 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-[100] max-h-60 overflow-y-auto">
            {suggestions.map((s: any) => (
              <li
                key={s.id}
                className="px-4 py-3 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-0 truncate text-foreground"
                onClick={() => onSelectSuggestion(s.center[0], s.center[1], s.place_name)}
              >
                {s.place_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hidden sm:block h-6 w-px bg-border mx-1 lg:mx-2" />

      {/* Date Range Picker */}
      <div className="hidden sm:flex items-center gap-2 lg:gap-3 px-2 lg:px-3">
        <div
          className="flex items-center gap-1 lg:gap-2 cursor-pointer group"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input');
            if (input && 'showPicker' in input) (input as any).showPicker();
          }}
        >
          <span className="text-[9px] lg:text-[10px] uppercase font-black text-primary tracking-tighter group-hover:opacity-80 transition-opacity leading-none">Desde</span>
          <div className="relative flex items-center h-[44px]">
            {!startDate && (
              <span className="absolute inset-0 pointer-events-none text-muted-foreground/40 text-[11px] lg:text-xs font-bold whitespace-nowrap flex items-center">
                Seleccionar
              </span>
            )}
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
                if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
              }}
              className={cn(
                "bg-transparent border-none text-[11px] lg:text-xs focus:outline-none text-foreground w-[85px] lg:w-[95px] cursor-pointer font-bold [color-scheme:dark] h-full",
                !startDate && "opacity-0"
              )}
            />
          </div>
        </div>

        <div className="h-4 w-px bg-border mx-0.5 lg:mx-1" />

        <div
          className="flex items-center gap-1 lg:gap-2 cursor-pointer group"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input');
            if (input && 'showPicker' in input) (input as any).showPicker();
          }}
        >
          <span className="text-[9px] lg:text-[10px] uppercase font-black text-primary tracking-tighter group-hover:opacity-80 transition-opacity leading-none">Hasta</span>
          <div className="relative flex items-center h-[44px]">
            {!endDate && (
              <span className="absolute inset-0 pointer-events-none text-muted-foreground/40 text-[11px] lg:text-xs font-bold whitespace-nowrap flex items-center">
                Seleccionar
              </span>
            )}
            <input
              type="date"
              value={endDate}
              min={startDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
                if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
              }}
              className={cn(
                "bg-transparent border-none text-[11px] lg:text-xs focus:outline-none text-foreground w-[85px] lg:w-[95px] cursor-pointer font-bold [color-scheme:dark] h-full",
                !endDate && "opacity-0"
              )}
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        className={cn(
          "ml-1 lg:ml-2 bg-primary text-white p-2 lg:p-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20",
          "flex items-center justify-center min-w-[44px] min-h-[44px]"
        )}
      >
        <Search size={18} strokeWidth={3} />
        <span className="hidden sm:hidden">Buscar</span>
      </button>

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>
    </div>
  );
}
