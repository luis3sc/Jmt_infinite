"use client";

import { Search, Calendar } from "lucide-react";
import { useState } from "react";

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
    <div className="flex items-center bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-1.5 shadow-sm hover:shadow-lg hover:border-[#62ae40]/40 transition-all duration-300">
      {/* Location Search */}
      <div className="relative w-[180px] lg:w-[280px]">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#62ae40]" />
        <input
          type="text"
          value={searchQuery || ""}
          onChange={(e) => onLocationSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="¿Dónde quieres anunciarte?"
          className="w-full pl-11 pr-4 py-2 bg-transparent border-none text-sm focus:outline-none h-[38px] font-medium placeholder:text-muted-foreground/60"
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
        <Calendar size={16} className="text-[#62ae40] flex-shrink-0" />

        <div
          className="flex items-center gap-1 lg:gap-2 cursor-pointer group"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input');
            if (input && 'showPicker' in input) (input as any).showPicker();
          }}
        >
          <span className="text-[9px] lg:text-[10px] uppercase font-black text-[#62ae40] tracking-tighter group-hover:opacity-80 transition-opacity">Desde</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
            }}
            className="bg-transparent border-none text-[11px] lg:text-xs focus:outline-none text-foreground w-[85px] lg:w-[95px] cursor-pointer font-bold [color-scheme:dark]"
          />
        </div>

        <div className="h-4 w-px bg-border mx-0.5 lg:mx-1" />

        <div
          className="flex items-center gap-1 lg:gap-2 cursor-pointer group"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input');
            if (input && 'showPicker' in input) (input as any).showPicker();
          }}
        >
          <span className="text-[9px] lg:text-[10px] uppercase font-black text-[#62ae40] tracking-tighter group-hover:opacity-80 transition-opacity">Hasta</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
            }}
            className="bg-transparent border-none text-[11px] lg:text-xs focus:outline-none text-foreground w-[85px] lg:w-[95px] cursor-pointer font-bold [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        className="ml-1 lg:ml-2 bg-[#62ae40] text-white px-4 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-bold hover:bg-[#62ae40]/90 transition-all active:scale-95 shadow-sm shadow-[#62ae40]/20"
      >
        Buscar
      </button>
    </div>
  );
}
