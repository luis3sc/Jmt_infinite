"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    <div className="flex items-center bg-card/60 backdrop-blur-sm border border-border rounded-[calc(var(--radius)*1.0)] p-1.5 shadow-sm hover:shadow-lg hover:border-muted-foreground/30 transition-all duration-300">
      {/* Location Search */}
      <div className="relative w-[180px] lg:w-[280px]">
        <Input
          type="text"
          value={searchQuery || ""}
          onChange={(e) => onLocationSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="¿Dónde quieres anunciarte?"
          className="w-full px-4 py-2 bg-transparent border-none text-sm focus-visible:ring-0 h-[44px] font-medium placeholder:text-muted-foreground/60 shadow-none"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute top-[calc(100%+12px)] left-0 right-0 bg-card border border-border rounded-[calc(var(--radius)*1.0)] shadow-xl overflow-hidden z-[100] max-h-60 overflow-y-auto">
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
          <span className="text-[9px] lg:text-[10px] uppercase font-black text-muted-foreground tracking-tighter group-hover:opacity-80 transition-opacity leading-none">Desde</span>
          <div className="relative flex items-center h-[44px]">
            {!startDate && (
              <span className="absolute inset-0 pointer-events-none text-muted-foreground/40 text-[11px] lg:text-xs font-bold whitespace-nowrap flex items-center">
                Seleccionar
              </span>
            )}
            <Input
              type="date"
              value={startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
                if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker();
              }}
              className={cn(
                "bg-transparent border-none text-[11px] lg:text-xs focus:outline-none text-foreground w-[85px] lg:w-[95px] cursor-pointer font-bold [color-scheme:light] h-full shadow-none px-0 ring-offset-transparent focus-visible:ring-0",
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
          <span className="text-[9px] lg:text-[10px] uppercase font-black text-muted-foreground tracking-tighter group-hover:opacity-80 transition-opacity leading-none">Hasta</span>
          <div className="relative flex items-center h-[44px]">
            {!endDate && (
              <span className="absolute inset-0 pointer-events-none text-muted-foreground/40 text-[11px] lg:text-xs font-bold whitespace-nowrap flex items-center">
                Seleccionar
              </span>
            )}
            <Input
              type="date"
              value={endDate}
              min={startDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
                if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker();
              }}
              className={cn(
                "bg-transparent border-none text-[11px] lg:text-xs focus:outline-none text-foreground w-[85px] lg:w-[95px] cursor-pointer font-bold [color-scheme:light] h-full shadow-none px-0 ring-offset-transparent focus-visible:ring-0",
                !endDate && "opacity-0"
              )}
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <Button
        onClick={onSearch}
        size="icon-lg"
        className="ml-1 lg:ml-2 flex items-center justify-center"
      >
        <Search size={18} strokeWidth={3} />
        <span className="sr-only">Buscar</span>
      </Button>
    </div>
  );
}
